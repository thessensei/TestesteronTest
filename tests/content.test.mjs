import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanTranslations, localizeDuration } from '../api/_content-shape.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Testler her zaman okunabilir kaynakları denetler (js/ altındakiler üretilmiş dosyalardır)
const srcJsDir = path.join(root, 'src', 'js');
const contentSource = fs.readFileSync(path.join(srcJsDir, 'content.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

// İçerik modülünü tarayıcı stub'larıyla Node'da değerlendirip API'sini alıyoruz
function loadContentModule() {
    const store = new Map();
    const localStorage = {
        getItem: key => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: key => store.delete(key)
    };
    const document = {
        querySelectorAll: () => [],
        getElementById: () => null,
        createElement: () => ({ set textContent(v) { this._v = v; }, get innerHTML() { return this._v || ''; } }),
        addEventListener: () => {},
        documentElement: {}
    };
    const factory = new Function(
        'document', 'localStorage', 'window', 'IC', 'showToast', 'requestAnimationFrame', 'fetch',
        `${contentSource}\n;return { localizedContent, localizeDuration, i18n, seedContent, getAllContent };`
    );
    const api = factory(document, localStorage, {}, () => '', () => {}, () => {}, () => Promise.reject(new Error('offline')));
    return { api, store };
}

// ------------------------------------------------------------ süre çevirisi

test('süre metni dile göre çevrilir', () => {
    assert.equal(localizeDuration('20 dk', 'en'), '20 min');
    assert.equal(localizeDuration('20 dk', 'de'), '20 Min.');
    assert.equal(localizeDuration('20 dk', 'ja'), '20分');
    assert.equal(localizeDuration('6 dakika', 'en'), '6 min');
    assert.equal(localizeDuration('1,5 saat', 'de'), '1,5 Std.');
    assert.equal(localizeDuration('2 saat', 'ja'), '2時間');
    assert.equal(localizeDuration('20 dk', 'tr'), '20 dk');
    assert.equal(localizeDuration('bir çırpıda', 'en'), 'bir çırpıda', 'tanınmayan metin olduğu gibi kalır');
});

test('tarayıcı tarafı süre çevirisi API ile aynı sonucu verir', () => {
    const { api } = loadContentModule();
    for (const [text, lang] of [['20 dk', 'en'], ['20 dk', 'de'], ['20 dk', 'ja'], ['45 dakika', 'en'], ['3 saat', 'ja']]) {
        assert.equal(api.localizeDuration(text, lang), localizeDuration(text, lang), `${text}/${lang}`);
    }
});

// ------------------------------------------------- çeviri alanlarının kaydı

test('API çeviri bloğu süre ve malzemeleri de saklar', () => {
    const cleaned = cleanTranslations({
        en: { title: 'Protein Bowl', summary: 's', body: 'b', category: 'High Protein', time: '20 min', ingredients: ['150 g chicken breast', '  ', '1 tsp olive oil'] },
        de: { title: 'Bowl', time: '20 Min.', ingredients: ['150 g Hähnchenbrust'] },
        ja: { title: 'ボウル', time: '20分', ingredients: ['鶏むね肉 150g'] }
    });

    assert.equal(cleaned.en.time, '20 min');
    assert.deepEqual(cleaned.en.ingredients, ['150 g chicken breast', '1 tsp olive oil'], 'boş satırlar ayıklanmalı');
    assert.equal(cleaned.de.time, '20 Min.');
    assert.deepEqual(cleaned.ja.ingredients, ['鶏むね肉 150g']);

    const empty = cleanTranslations({});
    for (const lang of ['en', 'de', 'ja']) {
        assert.equal(empty[lang].time, '');
        assert.deepEqual(empty[lang].ingredients, []);
    }
});

test('api/content.js ortak şekillendirme modülünü kullanır', () => {
    const source = fs.readFileSync(path.join(root, 'api', 'content.js'), 'utf8');
    assert.match(source, /from '\.\/_content-shape\.js'/);
    assert.match(source, /cleanTranslations\(input\.translations\)/);
    assert.ok(!/const cleanTranslations/.test(source), 'çeviri temizleme tek yerde tanımlı olmalı');
});

// ------------------------------------------------- site tarafı yerelleştirme

test('panelden girilen süre ve malzeme çevirisi ziyaretçiye gösterilir', () => {
    const { api, store } = loadContentModule();
    const item = {
        id: 'x', type: 'recipe', category: 'Yüksek Protein', title: 'Kase', time: '20 dk',
        summary: 'özet', body: 'gövde', ingredients: ['150 g tavuk göğsü'],
        translations: { en: { title: 'Bowl', time: '20 min', ingredients: ['150 g chicken breast'] } }
    };

    store.set('testotavan_language', 'en');
    const en = api.localizedContent(item);
    assert.equal(en.title, 'Bowl');
    assert.equal(en.time, '20 min');
    assert.deepEqual(en.ingredients, ['150 g chicken breast']);

    store.set('testotavan_language', 'tr');
    const tr = api.localizedContent(item);
    assert.equal(tr.time, '20 dk');
    assert.deepEqual(tr.ingredients, ['150 g tavuk göğsü']);
});

test('çeviri girilmemişse süre otomatik çevrilir, malzeme Türkçeye düşer', () => {
    const { api, store } = loadContentModule();
    const item = {
        id: 'y', type: 'recipe', category: 'Uyku', title: 'Tarif', time: '35 dk',
        summary: 'özet', body: 'gövde', ingredients: ['1 su bardağı bulgur'],
        translations: { de: { title: 'Rezept' } }
    };

    store.set('testotavan_language', 'de');
    const de = api.localizedContent(item);
    assert.equal(de.title, 'Rezept');
    assert.equal(de.time, '35 Min.', 'boş bırakılan süre otomatik çevrilmeli');
    assert.deepEqual(de.ingredients, ['1 su bardağı bulgur'], 'malzeme çevirisi yoksa Türkçesi gösterilir');
});

test('örnek tarifin süresi ve malzemeleri seçilen dilde gelir', () => {
    const { api, store } = loadContentModule();
    store.set('testotavan_language', 'ja');
    const recipe = api.getAllContent().find(x => x.type === 'recipe');
    assert.equal(recipe.time, '20分');
    assert.ok(recipe.ingredients.some(x => x.includes('鶏むね肉')));
});

test('modal başlıkları (Malzemeler / Hazırlanışı) sözlükte var', () => {
    const { api } = loadContentModule();
    for (const lang of ['en', 'de', 'ja']) {
        assert.ok(api.i18n[lang]['Malzemeler'], `${lang}: Malzemeler çevirisi eksik`);
        assert.ok(api.i18n[lang]['Hazırlanışı'], `${lang}: Hazırlanışı çevirisi eksik`);
    }
    assert.equal(api.i18n.en['Malzemeler'], 'Ingredients');
    assert.equal(api.i18n.ja['Hazırlanışı'], '作り方');
});

test('analiz alt açıklamaları ve erişilebilir etiketleri tüm dillerde çevrilir', () => {
    const { api } = loadContentModule();
    const required = [
        'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.',
        'Tahmin modelinin girdileri',
        'Kan vermeden önce: numune koşulları',
        'Tahlilinizi yükleyin, biz okuyalım',
        'Sağlık verisi açık rızası',
        'Testi nerede ve kaç günde yaptırırım?',
        'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.',
        'Dil seçin',
        'Ana navigasyon'
    ];
    for (const lang of ['en', 'de', 'ja']) {
        for (const source of required) {
            assert.ok(api.i18n[lang][source], `${lang}: ${source} çevirisi eksik`);
        }
    }
    assert.equal(api.i18n.en['Tahmin modelinin girdileri'], 'Inputs used by the estimation model');
    assert.equal(api.i18n.de['Sağlık verisi açık rızası'], 'Einwilligung für Gesundheitsdaten');
    assert.equal(api.i18n.ja['Ana navigasyon'], 'メインナビゲーション');

    const appSource = fs.readFileSync(path.join(srcJsDir, 'app.js'), 'utf8');
    assert.match(appSource, /window\.addEventListener\('testo-language-change'/, 'dinamik alt metinler dil değişiminde yeniden çizilmeli');
    assert.match(appSource, /const T = text => window\.translateUi/, 'dinamik metinler ortak çeviri yardımcısını kullanmalı');
});

// --------------------------------------------------------------- admin panel

test('admin panelinde her dil için süre ve malzeme alanı var', () => {
    for (const lang of ['tr', 'en', 'de', 'ja']) {
        assert.match(adminHtml, new RegExp(`time-\\$\\{l\\}|time-${lang}`), `${lang} süre alanı eksik`);
    }
    assert.match(adminHtml, /id="time-\$\{l\}"/, 'süre alanı dile göre üretilmeli');
    assert.match(adminHtml, /id="ingredients-\$\{l\}"/, 'malzeme alanı dile göre üretilmeli');
    assert.ok(!/<input id="time" required/.test(adminHtml), 'tek dilli süre alanı kaldırılmalı');
    assert.ok(!/<textarea id="ingredients"><\/textarea>/.test(adminHtml), 'tek dilli malzeme alanı kaldırılmalı');
});

test('admin paneli süre ve malzemeyi çeviri bloğuyla gönderir', () => {
    assert.match(adminHtml, /time:\s*\$\(`time-\$\{l\}`\)\.value\.trim\(\)/);
    assert.match(adminHtml, /ingredients:\s*ingredientValues\(l\)/);
    assert.match(adminHtml, /translations:\{en:base\('en'\),de:base\('de'\),ja:base\('ja'\)\}/);
    assert.match(adminHtml, /function autoFillDurations\(\)/, 'TR süresinden otomatik çeviri önerisi olmalı');
});

test('admin panelindeki malzeme editörü tarif malzemelerini satır satır yönetir', () => {
    assert.match(adminHtml, /function addIngredient\(lang,afterIndex\)/, 'malzeme ekleme işlevi olmalı');
    assert.match(adminHtml, /function removeIngredient\(lang,index\)/, 'malzeme silme işlevi olmalı');
    assert.match(adminHtml, /ingredient-count-\$\{l\}/, 'malzeme sayacı olmalı');
    assert.match(adminHtml, /Tarifler için en az bir malzeme ekleyin/, 'boş tarif listesi istemcide engellenmeli');
});

test('tarifler API tarafında da en az bir malzeme gerektirir', () => {
    const source = fs.readFileSync(path.join(root, 'api', 'content.js'), 'utf8');
    const checks = source.match(/item\.type === 'recipe' && !item\.ingredients\.length/g) || [];
    assert.equal(checks.length, 2, 'oluşturma ve güncelleme istekleri doğrulanmalı');
});

// ------------------------------------------------------------------ fiyatlar

test('sitede fiyat bilgisi gösterilmez', () => {
    assert.ok(!/\bTL\b/.test(indexHtml), 'index.html fiyat içermemeli');
    assert.ok(!/maliyet/i.test(indexHtml), 'index.html maliyet satırı içermemeli');
    const core = fs.readFileSync(path.join(srcJsDir, 'validation.js'), 'utf8');
    assert.ok(!/\bTL\b/.test(core), 'validation çekirdeği fiyat içermemeli');
    assert.match(indexHtml, /Sonuç süresi/, 'lojistik bilgisi korunmalı');
});
