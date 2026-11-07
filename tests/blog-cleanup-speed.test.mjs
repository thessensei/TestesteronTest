import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createContentHandler } from '../api/content.js';
import { createSessionCookie } from '../api/_auth.js';
import { createBlogPageHandler, renderBlogHub } from '../api/_blog-page.js';

process.env.SESSION_SECRET = 'test-blog-cleanup-secret-with-32-characters';
const entry = (id, type = 'blog') => ({ id, type, slug: id, title: id, category: 'Uyku', summary: 'Özet', body: 'Yazı gövdesi', time: '5 dk', translations: {}, published_at: '2026-10-01T00:00:00Z' });
function fakeDb(initial) {
  const state = [...initial], queries = [];
  const sql = async (parts, ...values) => {
    const text = parts.join('?'); queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/DELETE FROM content WHERE type='blog' RETURNING id/.test(text)) {
      const deleted = state.filter(row => row.type === 'blog');
      state.splice(0, state.length, ...state.filter(row => row.type !== 'blog'));
      return deleted.map(({ id }) => ({ id }));
    }
    if (/FROM content WHERE slug=\? OR id=\?/.test(text)) return state.filter(row => row.slug === values[0] || row.id === values[1]).slice(0, 1);
    if (/FROM content t WHERE t.id <>/.test(text)) return state.filter(row => row.id !== values[0]).slice(0, 3);
    if (/FROM content/.test(text)) return state;
    return [];
  };
  return { state, sql, queries };
}
async function request(handler, { method = 'GET', query = {}, admin = false, headers = {} } = {}) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; } };
  if (admin) headers.cookie = createSessionCookie().split(';')[0];
  await handler({ method, query, headers }, res);
  return res;
}

test('toplu silme admin ve aynı-site denetimi ister, tarifleri korur', async () => {
  const db = fakeDb([entry('blog1'), entry('recipe1', 'recipe'), entry('blog2')]);
  const handler = createContentHandler(() => db.sql);
  assert.equal((await request(handler, { method: 'DELETE', query: { scope: 'blogs' } })).code, 401);
  assert.equal((await request(handler, { method: 'DELETE', query: { scope: 'blogs' }, admin: true, headers: { 'sec-fetch-site': 'cross-site' } })).code, 403);
  assert.equal(db.queries.length, 0);
  assert.equal((await request(handler, { method: 'DELETE', query: { scope: 'blogs', id: 'recipe1' }, admin: true })).code, 400);
  assert.equal((await request(handler, { method: 'DELETE', query: { scope: 'all' }, admin: true })).code, 400);
  const removed = await request(handler, { method: 'DELETE', query: { scope: 'blogs' }, admin: true });
  assert.deepEqual(removed.body, { deleted: 2, scope: 'blogs' });
  assert.deepEqual(db.state.map(row => row.id), ['recipe1']);
  assert.equal((await request(handler, { method: 'DELETE', query: { scope: 'blogs' }, admin: true })).body.deleted, 0);
  assert.equal((await request(handler, { method: 'DELETE', admin: true })).code, 400);
  const admin = fs.readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
  assert.match(admin, /Tüm blog yazılarını sil/);
  assert.match(admin, /fetch\('\/api\/content\?scope=blogs',\{method:'DELETE'\}\)/);
  assert.match(admin, /Tüm yayınlanmış blog yazıları kalıcı olarak silinecek/);
});

test('boş blog arşivi eski hazır rehberleri yeniden eklemez', async () => {
  const db = fakeDb([]);
  const res = await request(createBlogPageHandler({ connect: () => db.sql, env: {} }));
  assert.equal(res.code, 200);
  assert.doesNotMatch(res.body, /testosteron-testi-2026-dogru-olcum/);
  assert.match(res.headers['Cache-Control'], /s-maxage=30/);
  const api = await request(createContentHandler(() => db.sql), { query: { guides: '1' } });
  assert.deepEqual(api.body, []);
});

test('detay yalnızca istenen yazıyı ve en fazla üç benzer kaydı sorgular', async () => {
  const db = fakeDb([entry('first'), entry('second'), entry('third'), entry('fourth'), entry('fifth')]);
  const res = await request(createBlogPageHandler({ connect: () => db.sql, env: {} }), { query: { slug: 'first' } });
  assert.equal(res.code, 200);
  const reads = db.queries.filter(q => /FROM content/.test(q.text));
  assert.equal(reads.length, 2);
  assert.match(reads[0].text, /WHERE slug=\? OR id=\?/);
  assert.match(reads[1].text, /LIMIT 3/);
  assert.match(reads[1].text, /value - 'body' - 'ingredients'/);
  assert.doesNotMatch(res.body, /href="\/blog\/fifth\/"/);
});

test('arşiv sorgusu yalnızca seçili dil ile İngilizce yedeğini alır ve kart görselleri ertelenir', async () => {
  const db = fakeDb([entry('first'), { ...entry('second'), cover_url: 'https://cdn.example.com/picture.png' }]);
  const handler = createBlogPageHandler({ connect: () => db.sql, env: {} });
  const res = await request(handler, { query: { lang: 'de' } });
  assert.equal(res.code, 200);
  const list = db.queries.find(q => /jsonb_build_object/.test(q.text));
  assert.ok(list);
  assert.deepEqual(list.values, ['de', 'de']);
  const html = renderBlogHub({ items: db.state, env: {} });
  assert.match(html, /loading="lazy" decoding="async"/);
});
