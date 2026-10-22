/*
 * Yazdırılabilir rapor (A4 / PDF).
 *
 * Kural: rapor kâğıda döküldüğünde yalnızca sonuç paneli basılır — menü,
 * sponsor sütunları, formlar ve çerez katmanı gizlenir; koyu tema kâğıt dostu
 * açık temaya döner. Tüm işlem tarayıcıda kalır, hiçbir ağ isteği yapılmaz.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const appSource = read(path.join('src', 'js', 'app.js'));
const indexHtml = read(path.join('src', 'index.html'));
const contentSource = read(path.join('src', 'js', 'content.js'));

/* ---------------------------------------------------------- mini DOM ortamı */

function fakeClassList(initial = []) {
    const set = new Set(initial);
    return {
        add: (...names) => names.forEach(name => set.add(name)),
        remove: (...names) => names.forEach(name => set.delete(name)),
        contains: name => set.has(name),
        toggle: (name, force) => (force ? set.add(name) : set.delete(name)),
        values: () => [...set]
    };
}

function fakeElement({ classes = [], textContent = '', closest = null } = {}) {
    return {
        classList: fakeClassList(classes),
        textContent,
        innerHTML: '',
        dataset: {},
        style: {},
        closest: () => closest,
        querySelector: () => null,
        querySelectorAll: () => [],
        setAttribute() {},
        getAttribute() {
            return null;
        },
        removeAttribute() {},
        hasAttribute: () => false,
        focus() {},
        remove() {},
        addEventListener() {},
        appendChild() {}
    };
}

// app.js'i tarayıcı taklitleriyle değerlendirip iç API'sini döndürür.
function loadApp({ reportReady = true } = {}) {
    const listeners = { window: {}, document: {} };
    const toasts = [];
    const container = fakeElement();
    container.appendChild = node => toasts.push(node);
    const page = fakeElement({ classes: ['page', 'active'] });
    const panel = fakeElement({
        classes: reportReady ? ['result-panel', 'show'] : ['result-panel'],
        textContent: reportReady ? 'Genel Değerlendirme' : '',
        closest: page
    });
    page.querySelector = selector => (selector === '.result-panel.show' && panel.classList.contains('show') ? panel : null);
    const nodes = { toastContainer: container, physicalResult: panel, bloodResult: panel };

    const document = {
        title: 'TestoTavan',
        documentElement: { lang: 'tr' },
        body: fakeElement(),
        getElementById: id => nodes[id] || null,
        createElement: () => fakeElement(),
        querySelector: selector => (selector.includes('.page.active') ? page : null),
        querySelectorAll: selector => (selector === '.page.is-print-target' && page.classList.contains('is-print-target') ? [page] : []),
        addEventListener: (type, handler) => {
            (listeners.document[type] ||= []).push(handler);
        }
    };
    const printed = [];
    const window = {
        print: () => printed.push(Date.now()),
        addEventListener: (type, handler) => {
            (listeners.window[type] ||= []).push(handler);
        },
        scrollTo() {}
    };

    const factory = new Function(
        'document', 'window', 'localStorage', 'location', 'crypto', 'fetch', 'requestAnimationFrame', 'setTimeout', 'clearTimeout',
        `${appSource}\n;return { printReport, cleanupPrintState, prepareNativePrint, reportPrintHeader, reportPrintFooter };`
    );
    const api = factory(
        document,
        window,
        { getItem: () => null, setItem() {}, removeItem() {} },
        { search: '', href: 'https://testosteron-test.vercel.app/' },
        { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
        () => Promise.reject(new Error('ağ kapalı')),
        handler => handler(),
        () => 0,
        () => {}
    );

    return { api, document, window, page, panel, listeners, printed, toasts };
}

/* ------------------------------------------------------- yazdırma davranışı */

test('printReport yalnızca hazır raporu yazdırır ve yazdırma görünümünü açar', () => {
    const { api, document, window, page, printed } = loadApp();
    assert.equal(api.printReport('blood'), true);
    assert.equal(printed.length, 1, 'tarayıcının yazdırma penceresi bir kez açılmalı');
    assert.ok(document.body.classList.contains('print-report'), 'yazdırma sırasında gövdeye print-report eklenir');
    assert.ok(page.classList.contains('is-print-target'), 'yalnızca rapor sayfası hedeflenir');
    assert.match(document.title, /^TestoTavan-Rapor-tr-\d{4}-\d{2}-\d{2}$/, 'dosya adı için sekme başlığı rapor adına döner');
});

test('afterprint sonrası ekran görünümü ve sekme başlığı geri yüklenir', () => {
    const { api, document, page, listeners } = loadApp();
    api.printReport('physical');
    assert.equal(listeners.window.afterprint.length, 1, 'yazdırma bitişi dinlenmeli');
    listeners.window.afterprint[0]();
    assert.equal(document.body.classList.contains('print-report'), false);
    assert.equal(page.classList.contains('is-print-target'), false);
    assert.equal(document.title, 'TestoTavan', 'kullanıcının gördüğü sekme başlığı korunur');
});

test('printReport rapor yokken yazdırmaz, kullanıcıyı uyarır', () => {
    const { api, document, printed, toasts } = loadApp({ reportReady: false });
    assert.equal(api.printReport('blood'), false);
    assert.equal(printed.length, 0, 'boş rapor yazdırılmamalı');
    assert.equal(document.body.classList.contains('print-report'), false);
    assert.equal(toasts.length, 1, 'kullanıcıya tek bir uyarı gösterilmeli');
    assert.match(toasts[0].innerHTML, /önce raporu oluşturun/i);
});

test('Ctrl+P (beforeprint) hazır rapor varsa temiz rapor görünümü uygular', () => {
    const { api, document, page } = loadApp();
    api.prepareNativePrint();
    assert.ok(document.body.classList.contains('print-report'));
    assert.ok(page.classList.contains('is-print-target'));

    const empty = loadApp({ reportReady: false });
    empty.api.prepareNativePrint();
    assert.equal(empty.document.body.classList.contains('print-report'), false, 'rapor yokken olağan sayfa yazdırılır');
});

/* ------------------------------------------------------------ rapor şablonu */

test('iki rapor da yazdırma düğmesini ve kâğıt başlığını taşır', () => {
    assert.match(appSource, /function reportPrintActions\(kind\)/, 'ortak yazdırma düğmesi tanımlı olmalı');
    assert.ok(appSource.includes("onclick=\"printReport('${key}')\""), 'düğme printReport işleyicisini çağırmalı');
    assert.ok(appSource.includes("reportPrintActions('physical')"), 'semptom raporu yazdırma düğmesi içermeli');
    assert.ok(appSource.includes("reportPrintActions('blood')"), 'kan testi raporu yazdırma düğmesi içermeli');
    assert.ok(appSource.includes("reportPrintHeader('physical')") && appSource.includes("reportPrintHeader('blood')"));
    assert.equal(appSource.split('reportPrintFooter()').length - 1 >= 2, true, 'her iki rapor sorumluluk reddi alt bilgisi taşımalı');
});

test('kâğıt başlığı tarih, rapor türü ve cihazda işleme notunu içerir', () => {
    const { api } = loadApp();
    const header = api.reportPrintHeader('blood');
    assert.match(header, /print-only print-head/);
    assert.match(header, /Kan Testi Değerlendirme Raporu/);
    assert.match(header, /\d{1,2} \w+ \d{4}|\d{4}-\d{2}-\d{2}/, 'tarih damgası olmalı');
    assert.match(header, /sunucuya gönderilmedi/i, 'verinin cihazda kaldığı yazılmalı');
    assert.match(api.reportPrintHeader('physical'), /Semptom Tabanlı Ön Değerlendirme Raporu/);

    const footer = api.reportPrintFooter();
    assert.match(footer, /print-only print-foot/);
    assert.match(footer, /tanı veya reçete yerine geçmez/i, 'tıbbi sorumluluk reddi kâğıtta da görünmeli');
});

/* ------------------------------------------------------------- stil kuralları */

test('yazdırma stili yalnızca sonuç panelini basar ve ekran arayüzünü gizler', () => {
    assert.ok(indexHtml.includes('@media print'), 'yazdırma ortamı için stil bloğu olmalı');
    assert.match(indexHtml, /@page\s*\{[^}]*size:\s*A4/, 'sayfa boyutu A4 olmalı');
    for (const selector of ['.header', '.sponsor-rail', '.nav-bottom', '.cookie-banner', '.cookie-footer']) {
        assert.ok(
            new RegExp(`body\\.print-report ${selector.replace('.', '\\.')}[^{]*\\{[^}]*display:\\s*none`).test(indexHtml),
            `${selector} kâğıda basılmamalı`
        );
    }
    assert.match(indexHtml, /\.report-actions, \.cta-block[^{]*\{[^}]*display:\s*none/, 'yazdırma ve yönlendirme düğmeleri kâğıda basılmamalı');
    assert.ok(/body\.print-report main > \.page \{ display: none !important; \}/.test(indexHtml), 'aktif olmayan sayfalar gizlenir');
    assert.ok(/body\.print-report main > \.page\.is-print-target \{ display: block !important;/.test(indexHtml), 'yalnızca hedeflenen sayfa basılır');
    assert.ok(/body\.print-report \.is-print-target > \*:not\(\.result-panel\) \{ display: none !important; \}/.test(indexHtml), 'form ve adım göstergeleri basılmaz');
    assert.ok(/body\.print-report \.result-panel \{ display: block !important;/.test(indexHtml));
});

test('yazdırma görünümü koyu temayı açık temaya çevirir ve ayarlar yalnızca yazdırmada geçerli', () => {
    const printBlock = indexHtml.slice(indexHtml.indexOf('@media print'));
    assert.match(printBlock, /body\.print-report \{[^}]*--bg:\s*#fff/, 'kart zeminleri beyaza döner');
    assert.match(printBlock, /--text-primary:\s*#111/, 'metinler kâğıtta koyu renge döner');
    assert.match(printBlock, /break-inside:\s*avoid/, 'kartlar sayfa ortasından bölünmez');

    // Ekran görünümü değişmemeli: print-report sınıfı JS ile yalnızca yazdırmada eklenir.
    assert.match(indexHtml, /\.print-only \{ display: none; \}/, 'yazdırma başlığı ekranda görünmez');
    assert.ok(appSource.includes("document.body.classList.add('print-report')"));
    assert.ok(appSource.includes("document.body.classList.remove('print-report')"));
});

test('yazdırma sırasında ikon sprite gizlenmez (SVG <use> referansları kırılmaz)', () => {
    const printBlock = indexHtml.slice(indexHtml.indexOf('@media print'));
    assert.equal(/body\s*>\s*\*[^{]*display:\s*none/.test(printBlock), false, 'gövdenin tüm çocuklarını gizleyen kural ikonları kırar');
    assert.match(indexHtml, /<svg width="0" height="0"[^>]*aria-hidden="true" focusable="false">/, 'ikon sprite dokunulmadan kalmalı');
});

test('yazdırma düğmesi erişilebilir: gerçek buton, düz metin etiketi ve ipucu', () => {
    const { api } = loadApp();
    const actions = appSource.slice(appSource.indexOf('function reportPrintActions'));
    assert.match(actions, /<button type="button"[^>]*onclick="printReport/, 'yazdırma düğmesi type="button" ve click işleyicisi taşımalı');
    assert.match(actions, /report-hint/, 'A4 / PDF ipucu düğmenin yanında olmalı');
    assert.ok(api && typeof api.printReport === 'function');
});

/* -------------------------------------------------------- çok dilli etiketler */

test('yazdırma metinleri on dilin sözlüğünde tanımlı', () => {
    const start = contentSource.indexOf('const i18n');
    const end = contentSource.indexOf('let currentLanguage');
    const { i18n } = new Function(`${contentSource.slice(start, end)}\nreturn { i18n };`)();

    const keys = [
        'Semptom Tabanlı Ön Değerlendirme Raporu',
        'Kan Testi Değerlendirme Raporu',
        'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.',
        'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.',
        'Raporu yazdır / PDF kaydet',
        'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.',
        'Yazdırmak için önce raporu oluşturun.',
        'Bu tarayıcı yazdırmayı desteklemiyor.'
    ];
    assert.deepEqual(Object.keys(i18n).sort(), ['bg', 'de', 'en', 'es', 'fr', 'hi', 'ja', 'ru', 'zh']);
    for (const lang of Object.keys(i18n)) {
        for (const key of keys) {
            assert.ok(Object.hasOwn(i18n[lang], key), `${lang} sözlüğünde eksik yazdırma metni: ${key}`);
            assert.ok(String(i18n[lang][key]).trim().length > 0, `${lang}/${key} boş olamaz`);
        }
    }
    assert.equal(i18n.en['Raporu yazdır / PDF kaydet'], 'Print report / save as PDF');
    assert.equal(i18n.tr, undefined, 'kaynak dil Türkçe olduğu için sözlükte yer almaz');
});

test('yazdırma akışı ağ isteği yapmaz (veriler cihazda kalır)', () => {
    const section = appSource.slice(appSource.indexOf('// RAPOR YAZDIRMA / PDF'), appSource.indexOf('// SPONSOR ALANLARI'));
    assert.ok(section.length > 0, 'yazdırma bölümü bulunmalı');
    assert.equal(/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(section), false, 'yazdırma sırasında hiçbir ağ isteği yapılmamalı');
    assert.match(section, /window\.print\(\)/, 'tarayıcının kendi yazdırma penceresi kullanılır');
});
