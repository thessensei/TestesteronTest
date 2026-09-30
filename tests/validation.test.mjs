import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// validation.69d286c8.js klasik bir script; Node tarafında değerlendirip API'yi alıyoruz
const source = fs.readFileSync(path.join(root, 'js', 'validation.69d286c8.js'), 'utf8');
new Function(source)();
const V = globalThis.TestoValidation;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.0a806577.js'), 'utf8');

test('validation API yüklenir', () => {
    assert.ok(V, 'TestoValidation global olarak tanımlanmalı');
    assert.equal(typeof V.validatePhysical, 'function');
    assert.equal(typeof V.validateBlood, 'function');
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

test('fiziksel analiz negatif değerde engellenir', () => {
    const r = V.validatePhysical({ inputAge: '30', inputHeight: '-175', inputWeight: '70' });
    assert.equal(r.ok, false);
    assert.equal(r.firstErrorId, 'inputHeight');
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

test('kan testi: tek geçerli değer yeterlidir', () => {
    const r = V.validateBlood({ inputVitD: '18' });
    assert.equal(r.ok, true);
    assert.equal(r.values.inputVitD, 18);
});

test('kan testi: hiç değer girilmezse engellenir', () => {
    const r = V.validateBlood({});
    assert.equal(r.ok, false);
    assert.match(r.message, /En az 1 kan değeri/);
});

test('kan testi: 0 girilen alan engellenir', () => {
    const r = V.validateBlood({ inputTesto: '0' });
    assert.equal(r.ok, false);
    assert.equal(r.firstErrorId, 'inputTesto');
    assert.match(r.errors.inputTesto, /0 olamaz/);
});

test('kan testi: negatif değer engellenir (diğer alan dolu olsa bile)', () => {
    const r = V.validateBlood({ inputTesto: '600', inputCortisol: '-3' });
    assert.equal(r.ok, false);
    assert.equal(r.firstErrorId, 'inputCortisol');
    assert.match(r.errors.inputCortisol, /negatif olamaz/);
});

test('kan testi: sayı olmayan değer engellenir', () => {
    const r = V.validateBlood({ inputB12: 'abc' });
    assert.equal(r.ok, false);
    assert.match(r.errors.inputB12, /geçerli bir sayı/);
});

test('index.html koyu tema autofill düzeltmesini içerir', () => {
    assert.match(html, /-webkit-autofill/);
    assert.match(html, /-webkit-box-shadow: 0 0 0 1000px var\(--input\) inset !important/);
    assert.match(html, /-webkit-text-fill-color: var\(--text-primary\) !important/);
    assert.match(html, /color-scheme: dark/);
});

test('index.html hata stillerini ve validation scriptini içerir', () => {
    assert.match(html, /\.form-input\.is-invalid/);
    assert.match(html, /\.form-error/);
    assert.match(html, /<script defer src="js\/validation\.69d286c8\.js"><\/script>/);
    assert.match(html, /<script defer src="js\/app\.0a806577\.js"><\/script>/);
});

test('sayısal alanlar min ve inputmode özniteliklerine sahip', () => {
    for (const field of [...V.PHYSICAL_FIELDS, ...V.BLOOD_FIELDS]) {
        const re = new RegExp(`<input type="number"[^>]*id="${field.id}"[^>]*>`);
        const match = html.match(re);
        assert.ok(match, `${field.id} bulunamadı`);
        assert.match(match[0], /min="/, `${field.id} min özniteliğine sahip olmalı`);
        assert.match(match[0], /inputmode="decimal"/, `${field.id} inputmode özniteliğine sahip olmalı`);
    }
});

test('analiz fonksiyonları doğrulama başarısızsa erken çıkar', () => {
    assert.match(app, /function analyzePhysical\(\) \{[\s\S]{0,400}if \(!applyValidation\(fields, result\)\) return;/);
    assert.match(app, /function analyzeBlood\(\) \{[\s\S]{0,400}if \(!applyValidation\(fields, result\)\) return;/);
});
