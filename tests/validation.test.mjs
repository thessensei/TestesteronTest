import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// validation.js klasik bir script; Node tarafında değerlendirip API'yi alıyoruz
// (js/ altındaki dosyalar üretilmiştir, testler kaynakları okur)
const srcJsDir = path.join(root, 'src', 'js');
const source = fs.readFileSync(path.join(srcJsDir, 'validation.js'), 'utf8');
new Function(source)();
const V = globalThis.TestoValidation;

const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(srcJsDir, 'app.js'), 'utf8');

// ---------------------------------------------------------------- temel API

test('validation API yüklenir', () => {
    assert.ok(V, 'TestoValidation global olarak tanımlanmalı');
    assert.equal(typeof V.validatePhysical, 'function');
    assert.equal(typeof V.validateBlood, 'function');
    assert.equal(typeof V.validateBloodPanel, 'function');
    assert.equal(typeof V.estimateFromSymptoms, 'function');
    assert.equal(typeof V.computeOverallScore, 'function');
    assert.equal(typeof V.parseLabText, 'function');
});

test('geçerli pozitif değerler kabul edilir', () => {
    const r = V.validatePhysical({ inputAge: '25', inputHeight: '175', inputWeight: '70' });
    assert.equal(r.ok, true);
    assert.deepEqual(r.values, { inputAge: 25, inputHeight: 175, inputWeight: 70 });
    assert.equal(r.message, null);
});

test('virgüllü ondalık değer kabul edilir', () => {
    const r = V.validateField('2,5', { label: 'Magnezyum' });
    assert.equal(r.ok, true);
    assert.equal(r.value, 2.5);
});

test('binlik ayıracı olan değer doğru okunur', () => {
    assert.equal(V.parseNumber('1.234'), 1234);
    assert.equal(V.parseNumber('1.234,5'), 1234.5);
    assert.equal(V.parseNumber('1,234.5'), 1234.5);
    assert.equal(V.parseNumber('480'), 480);
    assert.equal(V.parseNumber('2,1'), 2.1);
    assert.equal(V.parseNumber('abc'), null);
});

test('0 değeri hata üretir', () => {
    const r = V.validateField('0', { label: 'Kilo (kg)' });
    assert.equal(r.ok, false);
    assert.match(r.error, /0 olamaz/);
});

test('negatif değer hata üretir', () => {
    const r = V.validateField('-5', { label: 'Yaş' });
    assert.equal(r.ok, false);
    assert.match(r.error, /negatif olamaz/);
});

test('fiziksel analiz 0 girildiğinde engellenir', () => {
    const r = V.validatePhysical({ inputAge: '0', inputHeight: '175', inputWeight: '70' });
    assert.equal(r.ok, false);
    assert.equal(r.firstErrorId, 'inputAge');
    assert.ok(r.errors.inputAge);
});

test('fiziksel analizde boş zorunlu alan engellenir', () => {
    const r = V.validatePhysical({ inputAge: '30', inputHeight: '', inputWeight: '70' });
    assert.equal(r.ok, false);
    assert.match(r.errors.inputHeight, /zorunludur/);
});

test('fiziksel analizde makul olmayan büyük değer engellenir', () => {
    const r = V.validatePhysical({ inputAge: '500', inputHeight: '175', inputWeight: '70' });
    assert.equal(r.ok, false);
    assert.match(r.errors.inputAge, /en fazla/);
});

// ------------------------------------------------- laboratuvar aralıkları

test('her parametrede lab referansı, geçerli giriş aralığı ve açıklama var', () => {
    for (const marker of V.MARKERS) {
        assert.ok(Array.isArray(marker.ref) && marker.ref.length === 2, `${marker.key} ref aralığı eksik`);
        assert.ok(Array.isArray(marker.accept) && marker.accept.length === 2, `${marker.key} accept aralığı eksik`);
        assert.ok(marker.accept[0] <= marker.ref[0] && marker.accept[1] >= marker.ref[1],
            `${marker.key}: geçerli giriş aralığı lab aralığını kapsamalı`);
        assert.ok(marker.usual[0] <= marker.ref[0] && marker.usual[1] >= marker.ref[1],
            `${marker.key}: alışılmış aralık lab aralığını kapsamalı`);
        assert.ok(marker.explain && marker.explain.length > 20, `${marker.key} açıklama cümlesi eksik`);
        assert.ok(marker.units.length >= 1, `${marker.key} birim tanımı eksik`);
    }
});

test('tıbbi aralıklar gerçek laboratuvar değerleriyle uyumlu', () => {
    assert.ok(V.MARKER_BY_KEY.totalT.ref[0] <= 300, 'Total T alt sınırı en fazla 300 ng/dL olmalı');
    assert.ok(V.MARKER_BY_KEY.lh.ref[1] >= 8.6, 'LH üst sınırı en az 8,6 IU/L olmalı');
    assert.ok(V.MARKER_BY_KEY.estradiol.ref[1] >= 44, 'Estradiol üst sınırı en az 44 pg/mL olmalı');
    assert.ok(V.MARKER_BY_KEY.ferritin.ref[1] >= 300, 'Ferritin üst sınırı en az 300 ng/mL olmalı');
});

test('geçerli laboratuvar sonuçları reddedilmez', () => {
    const cases = [
        ['inputTesto', '1050', 'ng/dL'],
        ['inputTesto', '290', 'ng/dL'],
        ['inputLH', '9.1', 'IU/L'],
        ['inputE2', '58', 'pg/mL'],
        ['inputFerritin', '330', 'ng/mL'],
        ['inputFSH', '17', 'IU/L']
    ];
    for (const [id, raw, unit] of cases) {
        const res = V.validateMarkerValue(raw, id, unit);
        assert.equal(res.ok, true, `${id}=${raw} ${unit} kabul edilmeliydi: ${res.error}`);
    }
});

test('anomali reddedilmez, uyarı üretir', () => {
    const res = V.validateMarkerValue('1900', 'inputTesto', 'ng/dL');
    assert.equal(res.ok, true, 'alışılmadık değer reddedilmemeli');
    assert.match(res.warning, /emin misiniz/);
    assert.match(res.warning, /hekim/i);
});

test('fiziksel olarak imkânsız değer net mesajla reddedilir', () => {
    const res = V.validateMarkerValue('45000', 'inputTesto', 'ng/dL');
    assert.equal(res.ok, false);
    assert.match(res.error, /Geçerli giriş aralığı/);
    assert.match(res.error, /[Bb]irim/);
});

test('birim dönüşümü: nmol/L ↔ ng/dL', () => {
    const res = V.validateMarkerValue('17', 'inputTesto', 'nmol/L');
    assert.equal(res.ok, true);
    assert.ok(Math.abs(res.value - 490) < 5, `17 nmol/L ≈ 490 ng/dL olmalı, ${res.value} geldi`);
    assert.ok(Math.abs(V.convert('totalT', 480, 'ng/dL', 'nmol/L') - 16.6) < 0.3);
});

test('ondalık ayıracı farkı kabul edilir', () => {
    assert.equal(V.validateMarkerValue('2,1', 'inputMg', 'mg/dL').ok, true);
    assert.equal(V.validateMarkerValue('2.1', 'inputMg', 'mg/dL').ok, true);
});

test('sınıflandırma ortak rozet dilini kullanır', () => {
    assert.equal(V.classify('totalT', 180).key, 'critical');
    assert.equal(V.classify('totalT', 250).key, 'low');
    assert.equal(V.classify('totalT', 600).key, 'normal');
    assert.equal(V.classify('totalT', 1200).key, 'high');
    for (const key of Object.keys(V.STATUS)) {
        assert.match(V.STATUS[key].badgeClass, /^badge-/);
    }
});

test('placeholder örnek değer ve lab aralığı içerir', () => {
    const ph = V.placeholderFor(V.MARKER_BY_KEY.totalT, 'ng/dL');
    assert.match(ph, /^Örn: /);
    assert.match(ph, /·/);
    assert.match(ph, /270/);
});

// ------------------------------------------------------- kan paneli akışı

test('kan paneli: Total T zorunlu, diğerleri opsiyonel', () => {
    assert.equal(V.MARKER_BY_KEY.totalT.required, true);
    for (const key of ['lh', 'fsh', 'estradiol', 'freeT', 'shbg', 'ferritin', 'vitD', 'b12', 'zinc', 'mg']) {
        assert.equal(V.MARKER_BY_KEY[key].required, false, `${key} opsiyonel olmalı`);
    }

    const missing = V.validateBloodPanel({ inputVitD: '18' }, {});
    assert.equal(missing.ok, false);
    assert.equal(missing.firstErrorId, 'inputTesto');

    const ok = V.validateBloodPanel({ inputTesto: '480', inputVitD: '18' }, {});
    assert.equal(ok.ok, true);
    assert.equal(ok.values.totalT, 480);
    assert.equal(ok.values.vitD, 18);
});

test('kan paneli uyarıları değeri silmez', () => {
    const res = V.validateBloodPanel({ inputTesto: '480', inputCortisol: '72' }, {});
    assert.equal(res.ok, true);
    assert.ok(res.warnings.inputCortisol);
    assert.equal(res.values.cortisol, 72);
});

test('eski kan testi API’si geriye dönük çalışır', () => {
    const r = V.validateBlood({ inputVitD: '18' });
    assert.equal(r.ok, true);
    const empty = V.validateBlood({});
    assert.equal(empty.ok, false);
    assert.match(empty.message, /En az 1 kan değeri/);
});

// ------------------------------------------------------------- tahmin motoru

test('semptom tahmini nokta değer + güven aralığı üretir', () => {
    const est = V.estimateFromSymptoms({
        age: 38, height: 180, weight: 95, activity: 2, sleepHours: 6, stress: 3,
        symptoms: ['libido', 'morning', 'fatigue']
    });
    assert.equal(typeof est.point, 'number');
    assert.ok(est.low < est.point && est.point < est.high, 'güven aralığı nokta değeri kapsamalı');
    assert.equal(est.unit, 'ng/dL');
    assert.ok(est.confidence > 0 && est.confidence <= 100);
    assert.deepEqual(est.ref, V.MARKER_BY_KEY.totalT.ref);
    assert.ok(est.status.badgeClass);
});

test('tahmin kartları kullanıcının semptom başlığını taşır ve önceliklendirilir', () => {
    const est = V.estimateFromSymptoms({
        age: 42, height: 178, weight: 104, activity: 1, sleepHours: 5, stress: 3,
        symptoms: ['libido', 'belly', 'sleep', 'fatigue']
    });
    assert.ok(est.cards.length >= 3);
    for (const card of est.cards) {
        assert.ok(card.title.length > 3, 'kart başlığı semptom metni olmalı');
        assert.ok(card.refText.length > 3, 'kartta referans aralığı olmalı');
        assert.ok(card.explain.length > 30, 'kartta tek cümle açıklama olmalı');
        assert.ok(card.status.badgeClass.startsWith('badge-'));
    }
    const ranks = est.cards.map(c => c.status.rank);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'kartlar kritikten normale sıralanmalı');
});

test('daha fazla semptom tahmini düşürür', () => {
    const base = { age: 35, height: 180, weight: 80, activity: 3, sleepHours: 7, stress: 2 };
    const few = V.estimateFromSymptoms({ ...base, symptoms: ['libido'] });
    const many = V.estimateFromSymptoms({ ...base, symptoms: ['libido', 'morning', 'muscle', 'fatigue', 'mood'] });
    assert.ok(many.point < few.point);
});

// ------------------------------------------------------------- skor + tooltip

test('genel değerlendirme skoru şeffaf şekilde hesaplanır', () => {
    const score = V.computeOverallScore({ totalT: 480, vitD: 18, cortisol: 14 });
    assert.ok(score.score >= 0 && score.score <= 100);
    assert.ok(score.breakdown.length === 3, 'yalnızca girilen parametreler hesaba katılmalı');
    assert.ok(score.coverage > 0 && score.coverage < 100);
    assert.match(score.formula, /ağırlık/i);
    const healthy = V.computeOverallScore({ totalT: 650, vitD: 60, cortisol: 14 });
    assert.ok(healthy.score > score.score);
});

// ------------------------------------------------------------ tahlil okuma

test('tahlil metninden değerler okunur', () => {
    const report = [
        'HORMON PANELI',
        'Total Testosteron        385      ng/dL      270 - 1080',
        'SHBG                     62,4     nmol/L',
        'LH                       7.2      IU/L',
        '25-OH Vitamin D          18       ng/mL',
        'Ferritin                 22       ng/mL'
    ].join('\n');

    const parsed = V.parseLabText(report);
    assert.equal(parsed.values.inputTesto, 385);
    assert.equal(parsed.units.inputTesto, 'ng/dL');
    assert.equal(parsed.values.inputSHBG, 62.4);
    assert.equal(parsed.values.inputLH, 7.2);
    assert.equal(parsed.values.inputVitD, 18);
    assert.equal(parsed.values.inputFerritin, 22);
    assert.ok(parsed.matched.length >= 5);
});

test('tahlil metni nmol/L birimini tanır', () => {
    const parsed = V.parseLabText('Total Testosteron 16,8 nmol/L');
    assert.equal(parsed.units.inputTesto, 'nmol/L');
    assert.equal(parsed.values.inputTesto, 16.8);
});

// -------------------------------------------------------------- arayüz/HTML

test('index.html koyu tema autofill düzeltmesini içerir', () => {
    assert.match(html, /-webkit-autofill/);
    assert.match(html, /-webkit-box-shadow: 0 0 0 1000px var\(--input\) inset !important/);
    assert.match(html, /-webkit-text-fill-color: var\(--text-primary\) !important/);
    assert.match(html, /color-scheme: dark/);
});

test('index.html hata/uyarı stillerini ve scriptleri içerir', () => {
    assert.match(html, /\.form-input\.is-invalid/);
    assert.match(html, /\.form-error/);
    assert.match(html, /\.form-warning/);
    // hash'li script yollarının doğruluğu tests/build.test.mjs içinde denetlenir
    assert.match(html, /<script defer src="js\/validation[^"]*\.js"><\/script>/);
    assert.match(html, /<script defer src="js\/app[^"]*\.js"><\/script>/);
});

test('fiziksel alanlar min/max ve inputmode özniteliklerine sahip', () => {
    for (const field of V.PHYSICAL_FIELDS) {
        const re = new RegExp(`<input type="number"[^>]*id="${field.id}"[^>]*>`, 's');
        const match = html.match(re);
        assert.ok(match, `${field.id} bulunamadı`);
        assert.match(match[0], /min="/, `${field.id} min özniteliğine sahip olmalı`);
        assert.match(match[0], /inputmode="decimal"/, `${field.id} inputmode özniteliğine sahip olmalı`);
    }
});

// Lab alanları type="text": tarayıcı "2,1" girdisini silmesin, virgül/nokta ayrımını biz yönetelim
test('lab alanları virgüllü girişi koruyacak şekilde tanımlanmış', () => {
    for (const marker of V.MARKERS) {
        const re = new RegExp(`<input type="text"[^>]*id="${marker.id}"[^>]*>`, 's');
        const match = html.match(re);
        assert.ok(match, `${marker.id} bulunamadı`);
        assert.match(match[0], /inputmode="decimal"/, `${marker.id} inputmode özniteliğine sahip olmalı`);
        assert.match(match[0], /placeholder="Örn: /, `${marker.id} placeholder'ı örnek değer içermeli`);
    }
});

test('her lab satırında birim seçici, lab aralığı ve zorunluluk etiketi var', () => {
    for (const marker of V.MARKERS) {
        assert.match(html, new RegExp(`id="unit-${marker.id}"`), `${marker.id} birim kolonu eksik`);
        assert.match(html, new RegExp(`id="hint-${marker.id}"`), `${marker.id} referans ipucu eksik`);
        assert.match(html, new RegExp(`id="accept-${marker.id}"`), `${marker.id} geçerli giriş aralığı etiketi eksik`);
        assert.match(html, new RegExp(`id="warn-${marker.id}"`), `${marker.id} uyarı alanı eksik`);
    }
    assert.match(html, /Geçerli giriş aralığı/);
    assert.ok(!/>\s*Hedef\s*</.test(html), '"Hedef" etiketi kaldırılmalı');
});

test('kan testi ekranında KVKK açık rızası boş başlar', () => {
    const consent = html.match(/<input type="checkbox" id="consentCheck"[^>]*>/);
    assert.ok(consent, 'açık rıza kutusu bulunamadı');
    assert.ok(!/checked/.test(consent[0]), 'açık rıza kutusu varsayılan işaretli olmamalı');
    assert.match(html, /KVKK/);
    assert.match(html, /açık rıza/i);
});

test('numune koşulları, lojistik ve ölçüm tipi ekranda var', () => {
    assert.match(html, /07:00–10:00/);
    assert.match(html, /[Bb]iotin/);
    assert.match(html, /açlık/);
    assert.match(html, /SGK/);
    assert.match(html, /Sonuç süresi|iş günü/);
    assert.match(html, /data-measure="baseline"/);
    assert.match(html, /data-measure="followup"/);
});

test('adım göstergesi ve ilerleme yüzdesi mevcut', () => {
    assert.match(html, /data-stepper/);
    assert.match(html, /data-progress/);
    assert.match(app, /Semptom/);
    assert.match(app, /Doğrulama/);
    assert.match(app, /Analizin %\$\{percent\} tamamlandı/);
});

test('ana CTA ve gölge buton birlikte, güven satırıyla sunulur', () => {
    assert.match(app, /KAN TESTİ İLE DOĞRULA/);
    assert.match(app, /btn-ghost/);
    assert.match(app, /trust-line/);
    assert.match(app, /Sonuç 5 dakikada/);
});

test('tahlil yükleme ana aksiyon, elle giriş ikincil bağlantıdır', () => {
    const uploadIndex = html.indexOf('id="reportFile"');
    const manualIndex = html.indexOf('id="manualToggle"');
    assert.ok(uploadIndex > -1 && manualIndex > -1);
    assert.ok(uploadIndex < manualIndex, 'yükleme alanı elle giriş bağlantısından önce gelmeli');
    assert.match(html, /class="link-btn" id="manualToggle"/);
    assert.match(html, /id="manualEntry" hidden/);
});

test('skor tooltip’i ve kaynaksız etki yüzdesi yasağı', () => {
    assert.match(app, /toggleScoreTooltip/);
    assert.match(app, /tooltip-panel/);
    assert.ok(!/%\d+\s*·\s*12 hafta/.test(app), 'kaynaksız etki yüzdesi gösterilmemeli');
    assert.ok(!/%\d+\s*·\s*12 hafta/.test(html), 'kaynaksız etki yüzdesi gösterilmemeli');
});

test('analiz fonksiyonları doğrulama başarısızsa erken çıkar', () => {
    assert.match(app, /function analyzePhysical\(\)[\s\S]{0,400}if \(!applyValidation\(fields, result\)\) return;/);
    assert.match(app, /function analyzeBlood\(\)[\s\S]{0,1400}if \(!result\.ok\) \{/);
    assert.match(app, /if \(!state\.consent\)/);
});
