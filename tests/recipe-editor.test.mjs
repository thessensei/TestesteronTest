import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
const tools = fs.readFileSync(new URL('../admin/ingredients.js', import.meta.url), 'utf8');

// Gerçek admin fonksiyonlarını küçük bir DOM adaptörüyle çalıştırır; boş satır
// indisleri, kullanıcı olayları ve gecikmiş ağ yanıtları davranış olarak sınanır.
class Element {
  constructor(tag = 'div') { this.tag = tag; this.value = ''; this.children = []; this.dataset = {}; this.listeners = {}; this.classList = { toggle() {} }; }
  set innerHTML(value) { this.children = []; }
  setAttribute() {}
  addEventListener(name, fn) { this.listeners[name] = fn; }
  append(...elements) { this.children.push(...elements); }
  focus() {}
  querySelectorAll() { return this.children.flatMap(child => child.tag === 'input' && 'ingredient' in child.dataset ? [child] : child.querySelectorAll()); }
}
function editor() {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  get('type').value = 'recipe';
  const timers = new Map(); let timerId = 0;
  const context = {
    window: {}, $: get, TARGET_LANGS_ADMIN: ['en', 'de'], INGREDIENT_PLACEHOLDER: {},
    editorRevision: 0, lastTranslationQuality: {},
    document: { createElement: tag => new Element(tag) },
    markLanguageProgress() {}, markTranslationQuality() {}, toast(message) { context.lastToast = message; },
    requestAnimationFrame: callback => callback(), confirm: () => true,
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['2 eggs'], de: ['2 Eier'] } }) })
  };
  vm.createContext(context);
  vm.runInContext(tools, context);
  vm.runInContext(html.slice(html.indexOf('function ingredientRows('), html.indexOf('/* ---------------- yeni / düzenleme modu')), context);
  return { context, get, timers, rows: lang => [...context.ingredientRows(lang)], values: lang => [...context.ingredientValues(lang)] };
}

test('toplu giriş satırları ayırır, ondalık virgül ve kesirleri korur, tekrarları kaldırır', () => {
  const { context } = editor();
  const result = context.window.MeydanIngredients.parseIngredientBatch('- 1,5 su bardağı yulaf\n• ½ limon\n2 YUMURTA\n2 yumurta');
  assert.equal(result.ok, true);
  assert.deepEqual([...result.items], ['1,5 su bardağı yulaf', '½ limon', '2 YUMURTA']);
  assert.equal(context.window.MeydanIngredients.parseIngredientBatch('').ok, false);
  assert.equal(context.window.MeydanIngredients.parseIngredientBatch('a'.repeat(201)).ok, false);
  assert.equal(context.window.MeydanIngredients.parseIngredientBatch(Array.from({ length: 101 }, (_, i) => `${i} malzeme`).join('\n')).ok, false);
});

test('boş satır varken silme ve ekleme doğru görsel indisi kullanır', () => {
  const { context: c, rows, values } = editor();
  c.renderIngredientRows('tr', ['2 yumurta', '', '150 g yoğurt']);
  c.removeIngredient('tr', 1);
  assert.deepEqual(rows('tr'), ['2 yumurta', '150 g yoğurt']);
  c.addIngredient('tr', 0);
  assert.deepEqual(rows('tr'), ['2 yumurta', '', '150 g yoğurt']);
  c.removeIngredient('tr', 2);
  assert.deepEqual(rows('tr'), ['2 yumurta', '']);
  assert.deepEqual(values('tr'), ['2 yumurta'], 'boş satırlar kaydetme gövdesine girmez');
});

test('sıralama miktarı ve boş satırları korur, sınırların dışına çıkmaz', () => {
  const { context: c, rows } = editor();
  c.renderIngredientRows('tr', ['2 yumurta', '', '150 g yoğurt']);
  c.moveIngredient('tr', 2, -1);
  assert.deepEqual(rows('tr'), ['2 yumurta', '150 g yoğurt', '']);
  c.moveIngredient('tr', 0, -1);
  assert.deepEqual(rows('tr'), ['2 yumurta', '150 g yoğurt', '']);
});

test('toplu ekleme var olan listeyi korur; değiştirme iptali kayıp oluşturmaz', () => {
  const { context: c, get, rows } = editor();
  c.setIngredients('tr', ['2 yumurta']);
  get('ingredient-bulk-tr').value = '2 yumurta\n150 g yoğurt';
  c.importIngredients('tr');
  assert.deepEqual(rows('tr'), ['2 yumurta', '150 g yoğurt']);
  get('ingredient-bulk-tr').value = '3 domates';
  c.confirm = () => false;
  c.importIngredients('tr', true);
  assert.deepEqual(rows('tr'), ['2 yumurta', '150 g yoğurt']);
  assert.equal(get('ingredient-bulk-tr').value, '3 domates');
  c.confirm = () => true;
  c.importIngredients('tr', true);
  assert.deepEqual(rows('tr'), ['3 domates']);
});

test('100 satır sınırında yeni satır ve toplu ekleme mevcut veriyi değiştirmez', () => {
  const { context: c, get, rows } = editor();
  const initial = Array.from({ length: 100 }, (_, i) => `${i + 1} malzeme`);
  c.setIngredients('tr', initial); c.addIngredient('tr');
  assert.deepEqual(rows('tr'), initial);
  get('ingredient-bulk-tr').value = '101 malzeme'; c.importIngredients('tr');
  assert.deepEqual(rows('tr'), initial);
});

test('gecikmiş çeviri yeni Türkçe listeyi ezmez; son liste tekrar senkronlanır', async () => {
  const { context: c, get, rows, timers } = editor();
  c.setIngredients('tr', ['2 yumurta']);
  let resolve;
  c.fetch = () => new Promise(done => { resolve = done; });
  const pending = c.syncIngredientsFromTr();
  c.setIngredients('tr', ['3 yumurta']); c.ingredientChanged('tr');
  resolve({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['2 eggs'], de: ['2 Eier'] } }) });
  await pending;
  assert.deepEqual(rows('en'), []);
  assert.ok(timers.size > 0);
  c.fetch = async () => ({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['3 eggs'], de: ['3 Eier'] } }) });
  await c.syncIngredientsFromTr();
  assert.deepEqual(rows('en'), ['3 eggs']);
  // Aynı Türkçe metinle başka bir editör açılması da eski yanıtı geçersiz kılar.
  c.setIngredients('en', []); c.setIngredients('de', []);
  c.fetch = () => new Promise(done => { resolve = done; });
  const second = c.syncIngredientsFromTr();
  vm.runInContext('ingredientRevision++', c);
  resolve({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['wrong recipe'], de: ['wrong recipe'] } }) });
  await second;
  assert.deepEqual(rows('en'), []);
});

test('çeviri sürerken elle girilen hedef liste korunur; açık onayla yeniden üretilebilir', async () => {
  const { context: c, rows } = editor();
  c.setIngredients('tr', ['2 yumurta']);
  let resolve;
  c.fetch = () => new Promise(done => { resolve = done; });
  const pending = c.syncIngredientsFromTr();
  c.setIngredients('en', ['2 free-range eggs']); c.ingredientChanged('en');
  resolve({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['2 eggs'], de: ['2 Eier'] } }) });
  await pending;
  assert.deepEqual(rows('en'), ['2 free-range eggs']);
  c.fetch = async () => ({ ok: true, json: async () => ({ ok: true, ingredients: { en: ['2 eggs'], de: ['2 Eier'] } }) });
  c.confirm = () => false;
  await c.translateIngredientsNow(true);
  assert.deepEqual(rows('en'), ['2 free-range eggs']);
  c.confirm = () => true;
  await c.translateIngredientsNow(true);
  assert.deepEqual(rows('en'), ['2 eggs']);
});

test('Türkçe son malzeme silinince otomatik çeviriler temizlenir, el yazısı korunur', async () => {
  const { context: c, rows } = editor();
  c.setIngredients('tr', ['2 yumurta']);
  await c.syncIngredientsFromTr();
  c.setIngredients('de', ['2 frische Eier']); c.ingredientChanged('de');
  c.removeIngredient('tr', 0);
  await c.syncIngredientsFromTr();
  assert.deepEqual(rows('en'), []);
  assert.deepEqual(rows('de'), ['2 frische Eier']);
});

test('silinen son malzeme bekleyen gövde çıkarımıyla geri eklenmez', () => {
  const { context: c, get, timers, rows } = editor();
  get('body-tr').value = 'Malzemeler:\n2 yumurta\nHazırlanış:\nPişirin.';
  c.scheduleBodyExtraction();
  const callback = [...timers.values()][0];
  c.setIngredients('tr', ['2 yumurta']); c.removeIngredient('tr', 0);
  callback();
  assert.deepEqual(rows('tr'), []);
});

test('admin konusu, notları ve miktarları kaydetme/üretme akışına bağlanır', () => {
  assert.match(html, /id="ai_input_mode"/);
  assert.match(html, /id="ai_topic" minlength="5" maxlength="300"/);
  assert.match(html, /JSON.stringify\(\{mode,topic,brief,url,type:/);
  assert.match(html, /ingredients:ingredientValues\(l\)/);
  assert.match(html, /method:editing\?'PUT':'POST'/);
  assert.match(html, /if\(revision!==editorRevision\)/);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new Function(script));
});
