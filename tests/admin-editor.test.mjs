import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { translateIngredientLines } from '../api/_ai-blog.js';

const read = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
const adminHtml = read('../admin/index.html');
const adminScript = read('../api/ai-blog.js');

/** admin/ingredients.js klasik bir script: aynı kaynağı vm ile yükleyip test ediyoruz. */
function loadIngredientTools() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('../admin/ingredients.js'), sandbox);
  return sandbox.window.MeydanIngredients;
}

const TR_SAMPLE = `Tavuklu kase

Malzemeler:
- 150 g tavuk göğsü
- 2 yumurta
- 1 yemek kaşığı zeytinyağı
• 1 su bardağı haşlanmış bulgur

Hazırlanış:
1. Tavuğu tavada pişirin.
2. Bulguru ekleyin ve karıştırın.`;

/* ------------------------------------------------------- malzeme ayıklama */

test('metindeki "Malzemeler" bölümünü malzeme satırlarına çevirir', () => {
  const { extractIngredients } = loadIngredientTools();
  const rows = extractIngredients(TR_SAMPLE);
  assert.deepEqual([...rows], [
    '150 g tavuk göğsü',
    '2 yumurta',
    '1 yemek kaşığı zeytinyağı',
    '1 su bardağı haşlanmış bulgur'
  ]);
});

test('başlık yoksa madde işaretli ve miktarlı satırları toplar', () => {
  const { extractIngredients } = loadIngredientTools();
  assert.deepEqual(
    [...extractIngredients('- 2 dilim ekmek\n- 1 avokado\nTuz, karabiber')],
    ['2 dilim ekmek', '1 avokado', 'Tuz, karabiber']
  );
  assert.deepEqual(
    [...extractIngredients('200 g somon\n1 limon\nFırında 20 dakika pişirin.')],
    ['200 g somon', '1 limon']
  );
});

test('hazırlanış adımları malzeme sanılmaz, boş metin boş dizi döner', () => {
  const { extractIngredients } = loadIngredientTools();
  const stepsOnly = `Hazırlanış:\n1. Tavuğu tavada 10 dakika pişirin.\n2. Servis yapın.`;
  assert.deepEqual([...extractIngredients(stepsOnly)], []);
  assert.deepEqual([...extractIngredients('')], []);
  assert.deepEqual([...extractIngredients('   \n  ')], []);
});

test('aynı malzeme iki kez eklenmez, var olan sıra korunur', () => {
  const { mergeIngredients } = loadIngredientTools();
  const merged = mergeIngredients(
    ['2 yumurta', '150 g tavuk göğsü'],
    ['150 g tavuk göğsü', '1 limon', '2 YUMURTA']
  );
  assert.deepEqual([...merged], ['2 yumurta', '150 g tavuk göğsü', '1 limon']);
});

/* ------------------------------------------------------ malzeme çevirisi */

test('malzeme çevirisi çevrimdışıyken yerel sözlükle üç dili de doldurur', async () => {
  const lines = ['150 g tavuk göğsü', '2 yumurta'];
  const result = await translateIngredientLines(lines, { env: {}, networkTranslate: false });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'local');
  assert.equal(result.count, 2);
  for (const lang of ['en', 'de', 'ja']) {
    assert.equal(result.ingredients[lang].length, 2, `${lang} satır sayısı korunmalı`);
  }
  assert.match(result.ingredients.en[0], /chicken breast/i);
  assert.match(result.ingredients.en[1], /2 eggs/i, 'miktar 1den büyükse İngilizce çoğul olmalı');
  assert.match(result.ingredients.de[0], /Hähnchenbrust/i);
  assert.match(result.ingredients.ja[1], /卵/);
  // Miktarlar korunur.
  assert.match(result.ingredients.en[0], /150\s*g/i);
});

test('AI yanıtı sıra ve sayıyı korursa AI modu kullanılır', async () => {
  const lines = ['150 g tavuk göğsü', '2 yumurta'];
  const requestAi = async () => ({
    ok: true,
    data: {
      en: ['150 g chicken breast', '2 eggs'],
      de: ['150 g Hähnchenbrust', '2 Eier'],
      ja: ['鶏むね肉 150 g', '卵 2個']
    }
  });
  const result = await translateIngredientLines(lines, { env: {}, networkTranslate: false, requestAi });
  assert.equal(result.mode, 'ai');
  assert.deepEqual(result.ingredients.en, ['150 g chicken breast', '2 eggs']);
});

test('AI satır sayısını bozarsa yerel sözlüğe düşer', async () => {
  const lines = ['150 g tavuk göğsü', '2 yumurta'];
  const requestAi = async () => ({ ok: true, data: { en: ['150 g chicken breast'], de: [], ja: [] } });
  const result = await translateIngredientLines(lines, { env: {}, networkTranslate: false, requestAi });
  assert.equal(result.mode, 'local');
  assert.equal(result.ingredients.en.length, 2);
});

test('boş liste için hata döner (sessizce yanlış yanıt vermez)', async () => {
  const result = await translateIngredientLines([], { env: {}, networkTranslate: false });
  assert.equal(result.ok, false);
  assert.match(result.error, /malzeme/i);
});

/* ------------------------------------------------------- admin arayüzü */

test('admin editörü tek yayın düğmesi ve ayrı "Yeni içerik" düğmesi taşır', () => {
  assert.match(adminHtml, /id="editor-title"/);
  assert.match(adminHtml, /id="publish-btn" type="submit"/);
  assert.match(adminHtml, /id="new-content-btn"[^>]*hidden[^>]*onclick="startNewContent\(\)"/);
  assert.match(adminHtml, /id="editor-mode-note"[^>]*hidden/);
  // Sayfada tek "Herkese açık yayınla" düğmesi var; ikincisi yalnızca JS etiketi.
  const labels = adminHtml.match(/>Herkese açık yayınla</g) || [];
  assert.equal(labels.length, 1);
});

test('setEditorMode düzenlemede Kaydet, yeni içerikte yayınla etiketini uygular', () => {
  const start = adminHtml.indexOf('function setEditorMode');
  const end = adminHtml.indexOf('function resetEditor', start);
  const block = adminHtml.slice(start, end);
  assert.match(block, /editing\?'Kaydet':'Herkese açık yayınla'/);
  assert.match(block, /extra\.hidden=!editing/);
  assert.match(block, /note\.hidden=!editing/);
  assert.match(block, /editing\?'İçeriği düzenle':'Yeni içerik yayınla'/);
});

test('publish kaydettikten sonra düzenleme modunda kalır, yayın etiketine dönmez', () => {
  const start = adminHtml.indexOf('async function publish(e)');
  const end = adminHtml.indexOf('function showPublishResult', start);
  const block = adminHtml.slice(start, end);
  assert.match(block, /const editing=Boolean\(editingId\)/);
  assert.match(block, /if\(editing\)\{items=items\.map/, 'düzenleme dalı korunmalı');
  assert.match(block, /if\(!editing\)resetEditor\(\)/, 'yalnızca yeni içerik formu sıfırlar');
  assert.match(block, /if\(editing\)setEditorMode\('edit'\)/, 'düzenleme modu korunur');
  assert.doesNotMatch(block, /textContent='Herkese açık yayınla'/);
  assert.match(block, /showPublishResult\(publicUrl,editing\)/);
});

test('düzenleme seçildiğinde yeni içerik düğmesi görünür olur', () => {
  const start = adminHtml.indexOf('function editItem(id){');
  const end = adminHtml.indexOf('async function removeItem', start);
  const block = adminHtml.slice(start, end);
  assert.match(block, /setEditorMode\('edit'\)/);
  assert.match(block, /autoIngredientSnapshot\.clear\(\)/);
});

test('malzeme alanı metinden çıkarma ve otomatik doldurma düğmelerini taşır', () => {
  assert.match(adminHtml, /onclick="extractIngredientsNow\(\)"/);
  assert.match(adminHtml, /onclick="translateIngredientsNow\(\)"/);
  assert.match(adminHtml, /id="ingredient-status-tr"[^>]*role="status"/);
  assert.match(adminHtml, /<script src="\/admin\/ingredients\.js"><\/script>/);
  assert.ok(
    adminHtml.indexOf('/admin/ingredients.js') < adminHtml.indexOf('id="ingredient-status-tr"'),
    'araç scripti alanlardan önce yüklenmeli'
  );
});

test('Türkçe malzeme değişince ve tarif moduna geçince otomatik senkron tetiklenir', () => {
  assert.match(adminHtml, /if\(lang==='tr'\)scheduleIngredientSync\(\)/);
  assert.match(adminHtml, /scheduleBodyExtraction\(\);scheduleIngredientSync\(\)/);
  assert.match(adminHtml, /mode:'ingredients'/);
  assert.match(adminHtml, /function syncIngredientsFromTr\(/);
  assert.match(adminHtml, /autoIngredientSource\.get\(lang\)!==signature/, 'değişmeyen liste için boşa istek atılmaz');
});

test('AI taslağı tarif getirmezse malzemeler metinden çıkarılır', () => {
  const start = adminHtml.indexOf('function applyGeneratedBlog');
  const block = adminHtml.slice(start, start + 2000);
  assert.ok(block.includes("if($('type').value==='recipe')"), 'tarif kontrolü yok');
  assert.ok(block.includes("if(!ingredientValues('tr').length)extractIngredients(true)"));
  assert.ok(block.includes('scheduleIngredientSync()'));
});

test('/api/ai-blog malzeme modunu yönlendirir', () => {
  assert.match(adminScript, /body\.mode === 'ingredients'/);
  assert.match(adminScript, /translateIngredientLines\(body\.items \|\| body\.ingredients/);
});
