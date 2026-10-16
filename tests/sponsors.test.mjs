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
        // Test bağlamında navigator yok → masaüstü: Gmail'in yeni ileti penceresi yeni sekmede açılır
        assert.match(rail.list.innerHTML, /class="sponsor-cta" href="https:\/\/mail\.google\.com\/mail\/\?view=cm&amp;fs=1&amp;to=testotavan@gmail\.com&amp;su=[^"]+" target="_blank" rel="noopener" title="testotavan@gmail\.com"/);
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

test('sponsorluk ve iletişim CTA\'ları testotavan@gmail.com adresine gider', () => {
    // Tek doğruluk kaynağı: CONTACT_EMAIL / CONTACT_HREF / CONTACT_GMAIL_HREF
    assert.match(appSource, /const CONTACT_EMAIL = 'testotavan@gmail\.com';/, 'iletişim adresi bulunamadı');
    assert.match(appSource, /const CONTACT_HREF = `mailto:\$\{CONTACT_EMAIL\}\?subject=\$\{encodeURIComponent\(CONTACT_SUBJECT\)\}`;/, 'mailto bağlantısı bulunamadı');
    assert.match(appSource, /const CONTACT_GMAIL_HREF = `https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=\$\{CONTACT_EMAIL\}&su=\$\{encodeURIComponent\(CONTACT_SUBJECT\)\}`;/, 'Gmail yazma bağlantısı bulunamadı');

    // Varsayılan SPONSORS listesinde ölü '#' bağlantısı kalmamalı
    const sponsorsBlock = appSource.match(/const SPONSORS = \{[\s\S]*?\n\};/)[0];
    assert.ok(!/href:\s*'#'/.test(sponsorsBlock), 'sponsor bağlantıları ölü # olmamalı');
    assert.equal([...sponsorsBlock.matchAll(/href:\s*CONTACT_HREF/g)].length, 4, 'dört sponsor CTA\'sının da CONTACT_HREF kullanması gerekir');

    // Hakkımızda alt bilgisinde görünür iletişim maili olmalı; JS onu cihaza göre günceller
    const footerLink = /<a href="mailto:testotavan@gmail\.com\?subject=[^"]+" data-contact-link[^>]*>testotavan@gmail\.com<\/a>/;
    assert.match(srcHtml, footerLink, 'Hakkımızda alt bilgisinde mailto linki yok');

    // Derlenmiş çıktı da aynı maili içermeli (index.html + app paketi)
    assert.match(builtHtml, footerLink, 'derlenmiş index.html içinde mailto linki yok');
    const builtApp = fs.readdirSync(path.join(root, 'js')).find(f => /^app\./.test(f));
    assert.ok(builtApp, 'derlenmiş app paketi bulunamadı');
    const builtAppSource = read(path.join('js', builtApp));
    assert.match(builtAppSource, /testotavan@gmail\.com/, 'derlenmiş app paketinde iletişim maili yok');
    assert.match(builtAppSource, /mail\.google\.com\/mail\/\?view=cm/, 'derlenmiş app paketinde Gmail yazma bağlantısı yok');

    // Eski adres hiçbir yerde kalmamalı
    for (const [name, source] of [['src/index.html', srcHtml], ['index.html', builtHtml], ['src/js/app.js', appSource], [`js/${builtApp}`, builtAppSource], ['README.md', read('README.md')]]) {
        assert.ok(!source.includes('testosterontavan@gmail.com'), `${name}: eski iletişim adresi duruyor`);
    }
});

test('iletişim bağlantısı yazma ekranını doğrudan açar (mobilde mail uygulaması, masaüstünde Gmail)', () => {
    const context = loadAppModule();
    const constant = name => vm.runInContext(name, context);
    const email = constant('CONTACT_EMAIL');
    const subject = constant('CONTACT_SUBJECT');

    // mailto: alıcı + konu dolu (telefon/tablet yazma ekranı)
    const mailto = new URL(constant('CONTACT_HREF'));
    assert.equal(mailto.protocol, 'mailto:');
    assert.equal(mailto.pathname, 'testotavan@gmail.com');
    assert.equal(mailto.searchParams.get('subject'), subject);

    // Gmail: "Yeni ileti" penceresi (view=cm) alıcı + konu dolu
    const gmail = new URL(constant('CONTACT_GMAIL_HREF'));
    assert.equal(gmail.origin + gmail.pathname, 'https://mail.google.com/mail/');
    assert.equal(gmail.searchParams.get('view'), 'cm');
    assert.equal(gmail.searchParams.get('to'), email);
    assert.equal(gmail.searchParams.get('su'), subject);

    // Statik alt bilgi bağlantısı JS'deki mailto ile birebir aynı (JS yokken de çalışır)
    const footerHref = srcHtml.match(/<a href="([^"]+)" data-contact-link/)[1];
    assert.equal(footerHref, constant('CONTACT_HREF'), 'alt bilgideki mailto, CONTACT_HREF ile aynı olmalı');

    // Cihaz tespiti
    const gmailLink = { href: constant('CONTACT_GMAIL_HREF'), target: '_blank', rel: 'noopener' };
    const mailtoLink = { href: constant('CONTACT_HREF'), target: '', rel: '' };
    const devices = [
        ['navigator yok', undefined, gmailLink],
        ['Windows Chrome', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', maxTouchPoints: 0 }, gmailLink],
        ['macOS Safari', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', maxTouchPoints: 0 }, gmailLink],
        ['iPhone', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }, mailtoLink],
        ['Android telefon', { userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36', maxTouchPoints: 5 }, mailtoLink],
        ['Android tablet', { userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', maxTouchPoints: 10 }, mailtoLink],
        ['iPadOS (masaüstü kimliği)', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', maxTouchPoints: 5 }, mailtoLink],
        ['userAgentData.mobile', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', userAgentData: { mobile: true } }, mailtoLink]
    ];
    for (const [name, nav, expected] of devices) {
        context.navigator = nav;
        assert.deepEqual({ ...context.contactLink() }, expected, `${name}: yanlış bağlantı`);
    }

    // Sponsor kartı: mobilde mailto (yeni sekme yok), masaüstünde Gmail yeni sekmede
    const card = { title: 'Sponsor alanı', text: 'Metin', cta: 'Sponsor ol', href: constant('CONTACT_HREF') };
    context.navigator = devices[3][1];
    const mobileCard = context.sponsorCard(card);
    assert.match(mobileCard, /class="sponsor-cta" href="mailto:testotavan@gmail\.com\?subject=[^"]+" title="testotavan@gmail\.com">/);
    assert.ok(!/target=/.test(mobileCard), 'mobilde mail uygulaması aynı sekmeden açılmalı');
    context.navigator = devices[1][1];
    const desktopCard = context.sponsorCard({ ...card, href: 'mailto:testotavan@gmail.com' });
    const desktopHref = desktopCard.match(/class="sponsor-cta" href="([^"]+)"/)[1].replace(/&amp;/g, '&');
    assert.equal(desktopHref, constant('CONTACT_GMAIL_HREF'), 'masaüstünde Gmail yazma penceresi açılmalı');
    assert.match(desktopCard, /target="_blank" rel="noopener" title="testotavan@gmail\.com"/);
    assert.ok(!/sponsored/.test(desktopCard), 'iletişim bağlantısı reklam bağlantısı olarak işaretlenmemeli');

    // Başka bir mailto adresi olduğu gibi kalır
    assert.match(context.sponsorCard({ ...card, href: 'mailto:baska@ornek.com' }), /href="mailto:baska@ornek\.com">/);

    // Statik [data-contact-link] bağlantıları cihaza göre güncellenir
    const anchorStub = () => ({
        attrs: { href: constant('CONTACT_HREF'), target: '_blank', rel: 'noopener' },
        setAttribute(name, value) { this.attrs[name] = value; },
        removeAttribute(name) { delete this.attrs[name]; }
    });
    const anchor = anchorStub();
    let selector = '';
    context.document.querySelectorAll = query => { selector = query; return [anchor]; };

    context.navigator = devices[1][1];
    context.enhanceContactLinks();
    assert.equal(selector, 'a[data-contact-link]');
    assert.deepEqual({ ...anchor.attrs }, gmailLink, 'masaüstünde alt bilgi bağlantısı Gmail\'i yeni sekmede açmalı');

    context.navigator = devices[4][1];
    context.enhanceContactLinks();
    assert.deepEqual({ ...anchor.attrs }, { href: constant('CONTACT_HREF') }, 'mobilde alt bilgi bağlantısı mailto olmalı (yeni sekme yok)');
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
