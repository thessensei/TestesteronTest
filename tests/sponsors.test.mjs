import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcJsDir = path.join(root, 'src', 'js');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const srcHtml = read(path.join('src', 'index.html'));
const builtHtml = read('index.html');
const desktopIndexHtml = read('index.html');
const appSource = read(path.join('src', 'js', 'app.js'));
const contentSource = read(path.join('src', 'js', 'content.js'));
const validationSource = read(path.join('src', 'js', 'validation.js'));

// app.js klasik bir script; tarayıcı stub'larıyla Node'da değerlendirip
// global fonksiyonlarını (sponsor kartları dahil) test ediyoruz.
function loadAppModule() {
    const context = vm.createContext({
        window: { addEventListener: () => {} },
        document: {
            addEventListener: () => {},
            querySelectorAll: () => [],
            getElementById: () => null,
            createElement: () => ({}),
            cookie: ''
        },
        location: { protocol: 'https:' },
        localStorage: { getItem: () => 'tr', setItem: () => {} },
        console: { warn: () => {} },
        fetch: () => Promise.reject(new Error('offline')),
        setTimeout,
        clearTimeout,
        requestAnimationFrame: fn => fn(),
        Blob: class {},
        Response: class {},
        DecompressionStream: class {},
        TextDecoder,
        crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' }
    });
    vm.runInContext(validationSource, context);
    vm.runInContext(appSource, context);
    return context;
}

function railStub(side) {
    const list = { innerHTML: '' };
    return {
        dataset: { sponsorRail: side },
        querySelector: () => list,
        hidden: undefined,
        toggleAttribute(name, value) { this.hidden = { name, value }; },
        list
    };
}

// --------------------------------------------------- raylar her cihazda görünür

test('sağ ve sol sponsor rayları gövdeye yerleştirilir (her sayfada görünür)', () => {
    for (const [name, html] of [['src/index.html', srcHtml], ['index.html', builtHtml]]) {
        const left = html.indexOf('<aside class="sponsor-rail" data-sponsor-rail="left"');
        const right = html.indexOf('<aside class="sponsor-rail" data-sponsor-rail="right"');
        const mainOpen = html.indexOf('<main id="main-content"');
        const mainClose = html.indexOf('</main>');

        assert.ok(left > -1 && right > -1, `${name}: sponsor rayları bulunamadı`);
        assert.ok(left < mainOpen, `${name}: sol ray içerikten önce gelmeli`);
        assert.ok(right > mainClose, `${name}: sağ ray içerikten sonra gelmeli`);
        assert.match(html, /data-sponsor-rail="left"[\s\S]{0,200}data-sponsor-list/);
        assert.match(html, /data-sponsor-rail="right"[\s\S]{0,200}data-sponsor-list/);
        assert.ok(!html.slice(mainOpen, mainClose).includes('sponsor-rail'), `${name}: raylar sayfa içeriğinin dışında olmalı`);
    }
    assert.equal([...srcHtml.matchAll(/<aside class="sponsor-rail"/g)].length, 2, 'tam olarak iki sponsor rayı olmalı');
});

test('sponsor alanı dar ekranda şerit, geniş ekranda yan sütun olur', () => {
    // Mobil/tablet: içerikten önce ve sonra kaydırılabilir şerit
    assert.match(srcHtml, /\.sponsor-rail-inner \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
    // Geniş ekran (masaüstü · TV): üç kolonlu ızgara, içerik ortada, raylar yanlarda
    const desktop = srcHtml.match(/@media \(min-width: 1180px\) \{[\s\S]*?grid-template-columns: minmax\(0, var\(--rail-w\)\) minmax\(0, var\(--content-w\)\) minmax\(0, var\(--rail-w\)\)[\s\S]*?\n        \}/);
    assert.ok(desktop, 'geniş ekran ızgara düzeni bulunamadı');
    assert.match(desktop[0], /\.sponsor-rail\[data-sponsor-rail="left"\] \{ grid-column: 1; \}/);
    assert.match(desktop[0], /\.sponsor-rail\[data-sponsor-rail="right"\] \{ grid-column: 3; \}/);
    assert.match(desktop[0], /position: sticky; top: 16px;/, 'sponsor sütunları kaydırmada sabit kalmalı');
    assert.match(srcHtml, /@media \(min-width: 540px\) \{[\s\S]*?max-width: 500px;/, 'mobil kolon korunmalı');
});

// ------------------------------------------------------- sponsor içeriği yönetimi

test('sponsor içeriği tek listeden üretilir ve boş listede alan gizlenir', () => {
    assert.match(appSource, /const SPONSORS = \{\s*left: \[/, 'sol sponsor listesi bulunamadı');
    assert.match(appSource, /right: \[/, 'sağ sponsor listesi bulunamadı');
    assert.match(appSource, /function renderSponsors\(\)/);
    assert.match(appSource, /document\.querySelectorAll\('\[data-sponsor-rail\]'\)/);
    assert.ok(!/<script[^>]*sponsors/.test(srcHtml), 'sponsor modülü ayrı dosya olmamalı (derleme yalnızca mevcut paketleri taşır)');

    const context = loadAppModule();
    const left = railStub('left');
    const right = railStub('right');
    context.document.querySelectorAll = () => [left, right];

    context.renderSponsors();
    for (const rail of [left, right]) {
        assert.equal([...rail.list.innerHTML.matchAll(/class="sponsor-card"/g)].length, 2, `${rail.dataset.sponsorRail}: iki sponsor kartı basılmalı`);
        assert.match(rail.list.innerHTML, /class="sponsor-badge"/);
        assert.match(rail.list.innerHTML, /class="sponsor-cta" href="mailto:testosterontavan@gmail\.com"/);
        assert.equal(rail.hidden.value, false, 'dolu ray görünür kalmalı');
    }

    // Harici bağlantı güvenli ve reklam olarak işaretlenir
    context.window.TESTOTAVAN_SPONSORS = {
        left: [{ title: 'Marka', text: 'Metin', cta: 'Siteye git', href: 'https://ornek.com' }],
        right: []
    };
    context.renderSponsors();
    assert.match(left.list.innerHTML, /target="_blank" rel="noopener nofollow sponsored"/);
    assert.equal(right.list.innerHTML, '', 'boş listede içerik basılmamalı');
    assert.equal(right.hidden.value, true, 'boş ray gizlenmeli');
});

test('sponsorluk ve iletişim CTA\'ları testosterontavan@gmail.com adresine gider', () => {
    // Tek doğruluk kaynağı: CONTACT_EMAIL / CONTACT_HREF
    assert.match(appSource, /const CONTACT_EMAIL = 'testosterontavan@gmail\.com';/, 'iletişim adresi bulunamadı');
    assert.match(appSource, /const CONTACT_HREF = `mailto:\$\{CONTACT_EMAIL\}`;/, 'mailto bağlantısı bulunamadı');

    // Varsayılan SPONSORS listesinde ölü '#' bağlantısı kalmamalı
    const sponsorsBlock = appSource.match(/const SPONSORS = \{[\s\S]*?\n\};/)[0];
    assert.ok(!/href:\s*'#'/.test(sponsorsBlock), 'sponsor bağlantıları ölü # olmamalı');
    assert.equal([...sponsorsBlock.matchAll(/href:\s*CONTACT_HREF/g)].length, 4, 'dört sponsor CTA\'sının da CONTACT_HREF kullanması gerekir');

    // Hakkımızda alt bilgisinde görünür iletişim maili olmalı
    assert.match(srcHtml, /href="mailto:testosterontavan@gmail\.com"/, 'Hakkımızda alt bilgisinde mailto linki yok');

    // Derlenmiş çıktı da aynı maili içermeli (index.html + app paketi)
    assert.match(builtHtml, /href="mailto:testosterontavan@gmail\.com"/, 'derlenmiş index.html içinde mailto linki yok');
    const builtApp = fs.readdirSync(path.join(root, 'js')).find(f => /^app\./.test(f));
    if (builtApp) {
        assert.match(read(path.join('js', builtApp)), /testosterontavan@gmail\.com/, 'derlenmiş app paketinde iletişim maili yok');
    }
});

test('sponsor metinleri dört dilde çevrilebilir', () => {
    const factory = new Function(
        'document', 'localStorage', 'window', 'IC', 'showToast', 'requestAnimationFrame', 'fetch',
        `${contentSource}\n;return { i18n, translateUi };`
    );
    const api = factory(
        { querySelectorAll: () => [], getElementById: () => null, addEventListener: () => {}, createElement: () => ({}), documentElement: {} },
        { getItem: () => 'tr', setItem: () => {} },
        {},
        () => '',
        () => {},
        () => {},
        () => Promise.reject(new Error('offline'))
    );

    const required = ['Sponsor', 'Sponsor alanı', 'Sponsor ol', 'Kişisel planınız', 'Tahmin girdilerini değiştir'];
    for (const lang of ['en', 'de', 'ja']) {
        for (const source of required) {
            assert.ok(api.i18n[lang][source], `${lang}: ${source} çevirisi eksik`);
        }
    }
    assert.equal(api.i18n.en['Sponsor alanı'], 'Sponsor area');
    assert.equal(api.i18n.de['Sponsor alanı'], 'Sponsorfläche');
    assert.equal(api.i18n.ja['Sponsor ol'], 'スポンサーになる');
});

// ------------------------------------------------- kilitli önizleme kaldırıldı

test('kilitli/bulanık plan önizlemesi kaldırıldı, plan doğrudan gösterilir', () => {
    for (const [name, source] of [['src/index.html', srcHtml], ['index.html', desktopIndexHtml], ['src/js/app.js', appSource]]) {
        assert.ok(!/preview-lock|preview-blur|preview-overlay|renderPlanPreview/.test(source), `${name}: kilitli önizleme kalıntısı var`);
    }
    assert.ok(!/Doğrulamadan sonra dozlar kişiselleşir/.test(appSource), 'dozlar doğrulamaya kilitlenmemeli');
    assert.ok(!/showPlanTeaser|planTeaser/.test(appSource), 'önizleme butonu kaldırılmalı');

    // Plan, tahmin ekranında takviye kartıyla doğrudan basılır
    assert.match(appSource, /function renderEstimate\(est\) \{[\s\S]*?const plan = buildPlanFromEstimate\(est\);/);
    assert.match(appSource, /renderSupplementCard\(plan, 'Kişisel planınız'/);
    assert.match(appSource, /function buildPlanFromEstimate\(est\)/);
    assert.match(appSource, /function backToSymptoms\(\)/);
});

test('plan adımları yaşam tarzı ve takviyeleri öncelik sırasına göre birleştirir', () => {
    const context = loadAppModule();
    const values = { inputSleep: '5', inputStress: '4', inputActivity: '1' };
    context.document.getElementById = id => (id in values ? { value: values[id] } : null);

    const estimate = context.window.TestoValidation.estimateFromSymptoms({
        age: 42, height: 175, weight: 95, activity: 1, sleepHours: 5, stress: 4,
        symptoms: ['fatigue', 'libido']
    });
    const plan = context.buildPlanFromEstimate(estimate);

    assert.ok(plan.length >= 4, 'yaşam tarzı adımları ve takviyeler birlikte listelenmeli');
    assert.match(plan.map(item => item.name).join(' | '), /Uykuyu 7–9 saate çıkarın/);
    assert.match(plan.map(item => item.name).join(' | '), /Stres yükünü düşürün/);
    assert.match(plan.map(item => item.name).join(' | '), /Hareketi artırın/);
    assert.match(plan.map(item => item.name).join(' | '), /Kilo yönetimi/);
    for (const item of plan) {
        assert.ok(item.dose && !/doğrulama/i.test(item.dose), `${item.name}: doz doğrudan yazılmalı`);
    }
    // Array.from: vm bağlamında üretilen diziyi ana bağlama kopyalar (deepEqual prototipi karşılaştırır)
    const ranks = Array.from(plan, item => ({ critical: 0, high: 1, support: 2, base: 3 }[item.priority]));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'adımlar öncelik sırasına göre dizilmeli');
});
