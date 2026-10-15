import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Dört kurumsal özelliğin testleri:
 *   1. OCR boru hattı        (cleanOcrText + parseLabText + arayüz bağlantıları)
 *   2. Mikro besin kartları  (micronutrientWarnings)
 *   3. Damat Atomu widget'ı  (computeDamatAtomuMix + arayüz bağlantıları)
 *   4. KVKK kalkanı          (setPrivacyShield bağlantıları + animasyon CSS'i)
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcJsDir = path.join(root, 'src', 'js');

const source = fs.readFileSync(path.join(srcJsDir, 'validation.js'), 'utf8');
new Function(source)();
const V = globalThis.TestoValidation;

const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const template = fs.readFileSync(path.join(root, 'tools', 'analysis-pages.template.html'), 'utf8');
const app = fs.readFileSync(path.join(srcJsDir, 'app.js'), 'utf8');
const content = fs.readFileSync(path.join(srcJsDir, 'content.js'), 'utf8');

// ------------------------------------------------------------ API yüklemesi

test('yeni özellik API’leri yüklenir', () => {
    assert.equal(typeof V.cleanOcrText, 'function');
    assert.equal(typeof V.micronutrientWarnings, 'function');
    assert.equal(typeof V.computeDamatAtomuMix, 'function');
    assert.ok(Array.isArray(V.DAMAT_ATOMU_INGREDIENTS) && V.DAMAT_ATOMU_INGREDIENTS.length >= 5);
    assert.ok(V.DAMAT_ATOMU_DAILY.kcal > 0 && V.DAMAT_ATOMU_DAILY.mg > 0 && V.DAMAT_ATOMU_DAILY.zn > 0);
});

// ------------------------------------------------------------ 1) OCR temizliği

test('cleanOcrText rakam bağlamındaki O/I/S/B karışmalarını düzeltir', () => {
    assert.equal(V.cleanOcrText('Total Testosteron 4O5 ng/dL'), 'Total Testosteron 405 ng/dL');
    assert.equal(V.cleanOcrText('LH 7,l IU/L'), 'LH 7,1 IU/L');
    assert.equal(V.cleanOcrText('Ferritin 2S0 ng/mL'), 'Ferritin 250 ng/mL');
    assert.equal(V.cleanOcrText('Estradiol 3B pg/mL'), 'Estradiol 38 pg/mL');
    assert.equal(V.cleanOcrText('Cortisol 1B,4 µg/dL'), 'Cortisol 18,4 µg/dL');
});

test('cleanOcrText sayı sonundaki O’yu düzeltir, sözcüklere dokunmaz', () => {
    assert.equal(V.cleanOcrText('Total Testosteron 1.08O ng/dL'), 'Total Testosteron 1.080 ng/dL');
    // Etiket sözcükleri korunmalı
    const word = V.cleanOcrText('Total Testosteron Serbest Testosteron SHBG');
    assert.match(word, /Total Testosteron/);
    assert.match(word, /Serbest Testosteron/);
    assert.match(word, /SHBG/);
});

test('cleanOcrText tipografik karakterleri normalize eder', () => {
    const out = V.cleanOcrText('Total\u00A0Testosteron\u2013 480 ng/dL');
    assert.ok(!out.includes('\u00A0'));
    assert.ok(!out.includes('\u2013'));
    assert.match(out, /Total Testosteron- 480 ng\/dL/);
});

test('OCR çıktısı temizlenip parseLabText’e verildiğinde değerler forma düşer', () => {
    const ocrOutput = [
        'HORMON PANELI',
        'T0tal Testosteron     385      ng/dL      270 - 1080',
        'SHBG                  6O,5     nmol/L',
        'LH                    4,S      IU/L',
        '25-OH Vitamin D       1B       ng/mL',
        'Cinko                 5Z       ug/dL'
    ].join('\n');

    const parsed = V.parseLabText(V.cleanOcrText(ocrOutput));
    // "T0tal" etiketi bozuk olsa da 'testosteron' rumuzu satırı yakalar
    assert.equal(parsed.values.inputTesto, 385);
    assert.equal(parsed.values.inputSHBG, 60.5);
    assert.equal(parsed.units.inputSHBG, 'nmol/L');
    assert.equal(parsed.values.inputLH, 4.5);
    assert.equal(parsed.values.inputVitD, 18);
    assert.equal(parsed.values.inputZinc, 52);
});

test('temiz okunan OCR metninde tüm parametreler yakalanır', () => {
    const ocrOutput = [
        'Total Testosteron 385 ng/dL',
        'Serbest Testosteron 72,4 pg/mL',
        'SHBG 31,2 nmol/L',
        'LH 4,2 IU/L',
        '25-OH Vitamin D 18 ng/mL',
        'Çinko 58 ug/dL'
    ].join('\n');
    const parsed = V.parseLabText(V.cleanOcrText(ocrOutput));
    assert.equal(parsed.values.inputTesto, 385);
    assert.equal(parsed.values.inputFreeTesto, 72.4);
    assert.equal(parsed.values.inputSHBG, 31.2);
    assert.equal(parsed.values.inputLH, 4.2);
    assert.equal(parsed.values.inputVitD, 18);
    assert.equal(parsed.values.inputZinc, 58);
    assert.equal(parsed.units.inputZinc, 'µg/dL');
});

test('OCR boru hattı arayüzde tamamen tarayıcı tarafına gömülüdür', () => {
    // Motor sabitleri pinlenmiş CDN sürümleriyle tanımlı
    assert.match(app, /tesseract\.js@5\.1\.1/);
    assert.match(app, /tesseract\.js-core@5\.1\.1/);
    assert.match(app, /pdfjs-dist@4\.10\.38/);
    assert.match(app, /'tur\+eng'/);
    // Boru hattı parçaları
    assert.match(app, /function prepareImageForOcr/);
    assert.match(app, /function runOcrPipeline/);
    assert.match(app, /function renderPdfPagesForOcr/);
    assert.match(app, /function runOcr\(/);
    assert.match(app, /function loadExternalScript/);
    // Fotoğraf dalı OCR'dan geçer; taranmış PDF dalı pdf.js + OCR kullanır
    const imageBranch = app.slice(app.indexOf("} else if (/^image\\//.test(file.type))"));
    assert.ok(imageBranch.includes('prepareImageForOcr') && imageBranch.includes('runOcrPipeline'));
    const pdfBranch = app.slice(app.indexOf("if (/\\.pdf$/i.test(file.name)"));
    assert.ok(pdfBranch.includes('renderPdfPagesForOcr'));
    // OCR metni parse edilmeden önce cleanOcrText'ten geçer
    assert.match(app, /V\(\)\.cleanOcrText\(ocrText\)/);
    assert.match(app, /V\(\)\.parseLabText\(V\(\)\.cleanOcrText\(text\)\)/);
});

test('yükleme kartı fotoğraf OCR’ını duyurur ve yerel işlemeyi vurgular', () => {
    assert.match(template, /fotoğraftaki değerleri tarayıcınızda OCR ile okuyup/);
    assert.match(template, /Dosya sunucuya gönderilmez/);
});

// ------------------------------------------------- 2) Mikro besin uyarı kartları

test('D vitamini 30 altı "Sistem Analizi Uyarısı" kartı üretir', () => {
    const warnings = V.micronutrientWarnings({ vitD: 22 });
    assert.equal(warnings.length, 1);
    const w = warnings[0];
    assert.equal(w.key, 'vitD');
    assert.equal(w.severity, 'high');
    assert.equal(w.title, 'Sistem Analizi Uyarısı');
    assert.match(w.headline, /Sistem Analizi Uyarısı: D Vitamini \(25-OH\) eksikliğiniz/);
    assert.match(w.headline, /LH sinyalinizi ve testosteron sentezinizi doğrudan zayıflatıyor/);
    assert.match(w.headline, /holding standartlarında beslenmenize ekleyin/);
    assert.match(w.valueText, /22 ng\/mL/);
    assert.ok(w.foods.length >= 4, 'yeterli besin önerisi listelenmeli');
});

test('çinko 70 altı kartı eksiklik eşiğinde tetiklenir', () => {
    const warnings = V.micronutrientWarnings({ zinc: 65 });
    assert.equal(warnings.length, 1);
    const w = warnings[0];
    assert.equal(w.key, 'zinc');
    assert.equal(w.severity, 'high', '60–70 arası değer "yüksek" ciddiyetinde kart üretmeli');
    assert.match(w.headline, /Sistem Analizi Uyarısı: Çinko eksikliğiniz/);
    assert.match(w.headline, /65 µg\/dL/);
});

test('kritik eşik altındaki değerler kritik kart üretir', () => {
    assert.equal(V.micronutrientWarnings({ vitD: 12 })[0].severity, 'critical');
    assert.equal(V.micronutrientWarnings({ zinc: 54 })[0].severity, 'critical');
    assert.equal(V.micronutrientWarnings({ ferritin: 12 })[0].severity, 'critical');
});

test('diğer mikro besinler de eşik altında kart üretir', () => {
    const mg = V.micronutrientWarnings({ mg: 1.2 });
    assert.equal(mg.length, 1);
    assert.match(mg[0].headline, /Magnezyum eksikliğiniz/);
    assert.match(mg[0].headline, /serbest testosteronunuzu düşürüyor/);

    const b12 = V.micronutrientWarnings({ b12: 180 });
    assert.equal(b12.length, 1);
    assert.match(b12[0].headline, /B12 eksikliğiniz/);
});

test('normal ve girilmeyen değerler kart üretmez; eşik değeri kart üretmez', () => {
    assert.deepEqual(V.micronutrientWarnings({}), []);
    assert.deepEqual(V.micronutrientWarnings({ zinc: 92, vitD: 55, mg: 2.1, b12: 420, ferritin: 120 }), []);
    assert.deepEqual(V.micronutrientWarnings({ zinc: 70, vitD: 30 }), [], 'eşik değeri kart üretmemeli');
});

test('birden fazla eksiklik varsa kritik olan önce sıralanır', () => {
    const warnings = V.micronutrientWarnings({ vitD: 12, zinc: 65 });
    assert.equal(warnings.length, 2);
    assert.equal(warnings[0].severity, 'critical');
    assert.equal(warnings[0].key, 'vitD');
    assert.equal(warnings[1].key, 'zinc');
});

test('uyarı kartları rapor içinde ve arayüzde bağlıdır', () => {
    assert.match(app, /V\(\)\.micronutrientWarnings\(result\.values\)/);
    assert.match(app, /Mikro Besin Uyarı Sistemi/);
    assert.match(app, /micronutrient-card/);
    assert.match(html, /\.micronutrient-card/);
    assert.match(html, /\.food-chip/);
});

// ------------------------------------------------- 3) Damat Atomu hesaplayıcı

test('varsayılan Damat Atomu gramajı doğru besin dökümü verir', () => {
    const grams = { bal: 30, muz: 120, ceviz: 30, badem: 20, hurma: 50 };
    const mix = V.computeDamatAtomuMix(grams);
    assert.equal(mix.rows.length, 5);
    assert.equal(mix.totals.grams, 250);
    assert.equal(mix.totals.kcal, 649);
    assert.equal(mix.totals.mg, 161.4);
    assert.equal(mix.totals.zn, 2.02);
    assert.equal(mix.daily.kcalPct, 26);
    assert.equal(mix.daily.mgPct, 40);
    assert.equal(mix.daily.znPct, 18);
});

test('tek malzemenin katkısı 100 g tabanından doğru ölçeklenir', () => {
    const mix = V.computeDamatAtomuMix({ ceviz: 100 });
    assert.equal(mix.totals.kcal, 654);
    assert.equal(mix.totals.mg, 158);
    assert.equal(mix.totals.zn, 3.09);
    const half = V.computeDamatAtomuMix({ ceviz: 50 });
    assert.equal(half.totals.kcal, 327);
    assert.equal(half.totals.mg, 79);
});

test('sıfır ve geçersiz gramajlar sıfır üretir, üst sınır aşımı kırpılır', () => {
    const zero = V.computeDamatAtomuMix({});
    assert.equal(zero.totals.kcal, 0);
    assert.equal(zero.totals.mg, 0);
    assert.equal(zero.totals.zn, 0);

    const bad = V.computeDamatAtomuMix({ bal: 'abc', muz: -10 });
    assert.equal(bad.totals.kcal, 0);

    const clamped = V.computeDamatAtomuMix({ muz: 9999 });
    assert.equal(clamped.rows.find(r => r.id === 'muz').grams, 300);
});

test('Damat Atomu widget’ı blog sayfasına ve tarif modalına bağlanır', () => {
    assert.match(html, /id="damatAtomuCard"/);
    assert.match(html, /id="damatAtomuMount"/);
    assert.match(html, /Damat Atomu Besin Değeri Hesaplayıcı/);
    assert.match(app, /function damatAtomuWidgetHtml/);
    assert.match(app, /function updateDamatAtomu/);
    assert.match(app, /function mountDamatAtomuWidget/);
    assert.match(app, /window\.mountDamatAtomuWidget = mountDamatAtomuWidget/);
    assert.match(app, /mountDamatAtomuWidget\('damatAtomuMount'\)/);
    assert.match(app, /computeDamatAtomuMix/);
    // content.js: "Damat Atomu" tarifi modalda açılırsa widget bağlanır
    assert.match(content, /damat\\s\*atomu/i);
    assert.match(content, /modalDamatAtomuMount/);
    assert.match(content, /mountDamatAtomuWidget\('modalDamatAtomuMount'\)/);
});

test('widget kaydırıcı ve canlı log stilleri tanımlıdır', () => {
    assert.match(html, /\.da-widget/);
    assert.match(html, /\.da-tile/);
    assert.match(html, /input\[type="range"\]/);
    assert.match(html, /\.da-log/);
});

// ------------------------------------------------- 4) KVKK veri güvenliği kalkanı

test('kalkan işaretlendiğinde yeşil kalkan efekti tetiklenir', () => {
    assert.match(app, /function setPrivacyShield/);
    assert.match(app, /setPrivacyShield\(state\.consent\)/);
    assert.match(app, /getElementById\('privacyShield'\)/);
    assert.match(app, /KVKK kalkanı aktif/);
});

test('kalkan görseli ve ibaresi KVKK kartında tanımlıdır', () => {
    assert.match(template, /id="privacyShield"/);
    assert.match(template, /KVKK VERİ GÜVENLİĞİ KALKANI AKTİF/);
    assert.match(
        template,
        /Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda \(Local Device\) anlık olarak işlenir/
    );
    // src/index.html üretim çıktısında da yer almalı
    assert.match(html, /id="privacyShield"/);
    assert.match(html, /KVKK VERİ GÜVENLİĞİ KALKANI AKTİF/);
});

test('kalkan animasyonu CSS’te tanımlı ve hareket azaltma tercihine saygılıdır', () => {
    assert.match(html, /\.kvkk-shield/);
    assert.match(html, /@keyframes shieldCheck/);
    assert.match(html, /@keyframes shieldRing/);
    assert.match(html, /@keyframes shieldGlow/);
    assert.match(html, /\.kvkk-shield\[hidden\]/);
    assert.match(html, /prefers-reduced-motion/);
});

test('kalkan ibaresi dört dile çevrilmiştir', () => {
    assert.match(content, /featureUpgradeTranslations/);
    assert.match(content, /DATA SECURITY SHIELD ACTIVE/);
    assert.match(content, /DATENSCHUTZ-SCHILD AKTIV/);
    assert.match(content, /データ保護シールド作動中/);
    assert.match(content, /Your data is never sent to or stored on a server/);
});
