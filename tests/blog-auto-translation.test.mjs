import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createAiBlogHandler } from '../api/ai-blog.js';
import { createSessionCookie } from '../api/_auth.js';
import { renderBlogHub, renderBlogPost } from '../api/_blog-page.js';

process.env.SESSION_SECRET = 'a-very-long-test-session-secret';
const source = {
  type: 'blog', category: 'Hormon Sağlığı', title: '15 dakikalık gün ışığı ve uyku',
  summary: 'Araştırma 120 katılımcıda 8 saat uykuyu değerlendirdi.',
  body: 'İlk paragrafta 120 katılımcının sonuçları açıklanır.\n\nİkinci paragrafta 8 saat uyku ve 15 dakika gün ışığı anlatılır.',
  time: '5 dk', ingredients: []
};
const pieces = new Map([
  [source.title, '15 minutes of daylight and sleep'],
  [source.summary, 'The study evaluated 8 hours of sleep in 120 participants.'],
  ['İlk paragrafta 120 katılımcının sonuçları açıklanır.', 'The first paragraph explains the results from 120 participants.'],
  ['İkinci paragrafta 8 saat uyku ve 15 dakika gün ışığı anlatılır.', 'The second paragraph covers 8 hours of sleep and 15 minutes of daylight.']
]);
function requestHandler(handler, body, admin = true) {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.data = value; return this; } };
  const req = { method: 'POST', body, headers: { 'content-type': 'application/json' } };
  if (admin) req.headers.cookie = createSessionCookie().split(';')[0];
  return handler(req, res).then(() => res);
}

test('resmi Google Cloud çevirisi kullanılır, sayılar ve paragraflar doğrulanır', async () => {
  const calls = [];
  const handler = createAiBlogHandler({ env: { GOOGLE_TRANSLATE_API_KEY: 'private-key' }, networkTranslate: true, fetchImpl: async (url, init) => {
    calls.push({ url, init });
    const input = JSON.parse(init.body);
    return { ok: true, json: async () => ({ data: { translations: [{ translatedText: pieces.get(input.q) || '' }] } }) };
  } });
  const res = await requestHandler(handler, { mode: 'machine-translate', lang: 'en', item: source });
  assert.equal(res.code, 200);
  assert.equal(res.data.quality.complete, true);
  assert.match(res.data.translation.body, /participants\.\n\nThe second/);
  assert.ok(calls.every(call => call.url === 'https://translation.googleapis.com/language/translate/v2'));
  assert.ok(calls.every(call => call.init.headers['X-Goog-Api-Key'] === 'private-key'));
  assert.doesNotMatch(JSON.stringify(res.data), /private-key/);
  assert.equal((await requestHandler(handler, { mode: 'machine-translate', lang: 'en', item: source }, false)).code, 401);
  assert.equal((await requestHandler(handler, { mode: 'machine-translate', lang: 'xx', item: source })).code, 400);
});

test('servis arızası veya kalite hatası çevrilmiş içerik olarak dönmez', async () => {
  let calls = 0;
  const broken = createAiBlogHandler({ env: { GOOGLE_TRANSLATE_API_KEY: 'bad-key' }, networkTranslate: true, fetchImpl: async () => { calls++; return { ok: false }; } });
  const res = await requestHandler(broken, { mode: 'machine-translate', lang: 'en', item: source });
  assert.equal(res.code, 502);
  assert.ok(calls > 0);
  const disabled = createAiBlogHandler({ env: { ENABLE_MACHINE_TRANSLATION: '0' }, fetchImpl: async () => { throw Error('must not call'); } });
  assert.equal((await requestHandler(disabled, { mode: 'machine-translate', lang: 'en', item: source })).code, 503);
  const invalid = createAiBlogHandler({ env: { GOOGLE_TRANSLATE_API_KEY: 'key' }, networkTranslate: true, fetchImpl: async () => ({ ok: true, json: async () => ({ data: { translations: [{ translatedText: 'The text is missing all the numbers.' }] } }) }) });
  assert.equal((await requestHandler(invalid, { mode: 'machine-translate', lang: 'en', item: source })).code, 422);
});

test('editör boş dilleri çevirir, elle yazılmış ve kısmi çevirileri korur', async () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../admin/auto-translate.js', import.meta.url), 'utf8'), context);
  const item = { ...source, translations: { en: { title: 'Manual title' }, de: { body: 'Manual body' }, ja: { time: '手動', ingredients: ['手動'] } } };
  const requested = [];
  const result = await context.window.TestoAutoTranslate.translateMissing(item, async (_url, init) => {
    const { lang } = JSON.parse(init.body);
    requested.push(lang);
    return { ok: lang !== 'fr', json: async () => ({ ok: true, lang, translation: { title: 'translated' }, quality: { complete: true } }) };
  });
  assert.equal(requested.length, 7);
  assert.ok(!requested.includes('en') && !requested.includes('de'));
  assert.deepEqual([...result.failed], ['fr']);
  assert.equal(Object.keys(result.translated).length, 6);
  assert.equal(item.translations.en.title, 'Manual title');
  assert.equal(result.translated.ja.time, '手動');
  assert.deepEqual([...result.translated.ja.ingredients], ['手動']);
  assert.deepEqual([...result.skipped], ['en', 'de']);
});

test('blog dil seçicisi üstte, filtreleri ve mevcut çevirileri dikkate alır', () => {
  const item = { ...source, id: 'one', slug: 'uyku', translations: { en: { title: 'Sleep', summary: 'Sleep summary', body: 'Sleep body' } } };
  const hub = renderBlogHub({ items: [item], siteUrl: 'https://example.com', env: {}, category: 'Hormon Sağlığı', search: 'uyku' });
  const header = hub.slice(0, hub.indexOf('</header>'));
  assert.match(header, /class="blog-language"/);
  assert.match(header, /name="kategori" value="Hormon Sağlığı"/);
  assert.match(header, /name="q" value="uyku"/);
  assert.match(header, /value="ja"/);
  assert.match(header, /<noscript>/);
  const post = renderBlogPost({ item, siteUrl: 'https://example.com', env: {} });
  assert.match(post, /action="\/blog\/uyku\/"/);
  assert.match(post, /<option value="en">English<\/option>/);
  assert.match(post, /<option value="de" disabled>/);
});

test('yayın sırasında otomatik çeviri kaydedilir, bu sırada yapılan kaynak düzenlemesi korunur', async () => {
  const html = fs.readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
  const section = html.slice(html.indexOf('async function publish(e){'), html.indexOf('function showPublishResult'));
  const blank = { title: '', summary: '', body: '', category: '', time: '', ingredients: [] };
  let editor = { ...source, cover_url: '', emoji: '', pinterest: false, translations: { en: { ...blank } } };
  let finishTranslation;
  const translation = { title: 'Sleep', summary: 'The summary', body: 'The body', category: 'Health', time: '5 min', ingredients: [] };
  const fields = { 'publish-btn': { disabled: false }, 'auto-translate': { checked: true }, 'auto-translate-status': {}, publishResult: { append() {} } };
  let sent;
  const context = {
    window: { TestoEditorState: { sanitize() {} }, TestoAutoTranslate: { translateMissing: () => new Promise(resolve => { finishTranslation = resolve; }) } },
    saveBusy: false, editingId: 'old-id', editorContext: 1, savedEditorSnapshot: '', items: [{ ...editor, id: 'old-id' }],
    readEditorData: () => structuredClone(editor), $: id => fields[id], toast() {}, publicUrlFor: () => '', render() {},
    setEditorMode() {}, resetEditor() {}, showPublishResult() {}, pinReport() {}, markLanguageProgress() {}, renderTranslationDashboard() {}, document: { createTextNode: value => value },
    fetch: async (_url, options) => { sent = JSON.parse(options.body); return { ok: true, json: async () => ({ ...sent, id: 'old-id' }) }; }
  };
  vm.createContext(context); vm.runInContext(section, context);
  const pending = context.publish({ preventDefault() {} });
  editor = { ...editor, title: 'Kaydedilmemiş yeni başlık' };
  finishTranslation({ translated: { en: translation }, failed: [], skipped: [] });
  await pending;
  assert.equal(sent.title, source.title);
  assert.equal(sent.translations.en.title, 'Sleep');
  assert.equal(editor.title, 'Kaydedilmemiş yeni başlık');
  assert.equal(editor.translations.en.title, '');
  assert.equal(JSON.parse(context.savedEditorSnapshot).translations.en.title, 'Sleep');
});
