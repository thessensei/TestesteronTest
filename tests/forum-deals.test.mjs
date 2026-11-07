import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATEGORIES as serverCategories, validatePost } from '../api/_forum.js';
import { CATEGORIES, CATEGORY_KEYS, UI, LANGUAGES } from '../forum/forum-core.js';
import { renderPostContent } from '../forum/post-content.js';
import { renderForumThread } from '../api/_forum-page.js';

const id = '12345678-1234-4123-8123-123456789abc';

test('fırsatlar kategori seçimi ve sunucu doğrulamasında desteklenir', () => {
  assert.deepEqual(CATEGORIES, serverCategories);
  assert.equal(CATEGORY_KEYS['Sıcak Fırsatlar'], 'cat-deals');
  assert.equal(validatePost({ title: 'İndirimli ürün', category: 'Sıcak Fırsatlar', body: 'https://example.com/urun 100 TL' }).category, 'Sıcak Fırsatlar');
  for (const lang of LANGUAGES) assert.ok(UI[lang]['cat-deals']);
  const html = fs.readFileSync(new URL('../forum/index.html', import.meta.url), 'utf8');
  assert.match(html, /data-category="Sıcak Fırsatlar"/);
  assert.match(html, /option value="Sıcak Fırsatlar"/);
  const nav = html.match(/<nav class="sub-nav"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(nav, /sitemap\.xml|rss\.xml/);
});

test('mesajdaki bağlantılar güvenli açılır ve HTML çalıştırılmaz', () => {
  const html = renderPostContent('İndirim: https://example.com/urun?a=1&b=2. <script>alert(1)</script> javascript:alert(1)');
  assert.match(html, /href="https:\/\/example\.com\/urun\?a=1&amp;b=2" target="_blank" rel="nofollow ugc noopener noreferrer"/);
  assert.match(html, /<\/a>\./);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|href="javascript:/);
  assert.match(renderPostContent('(https://example.com/a(b))'), /href="https:\/\/example\.com\/a\(b\)"/);
  assert.equal(renderPostContent('https:// <b>x</b>'), 'https:// &lt;b&gt;x&lt;/b&gt;');
});

test('kalıcı sayfa hem konu hem yanıt bağlantılarını ve kategori çevirisini gösterir', () => {
  const thread = { id, title: 'İndirim', body: 'Ürün https://example.com/x', category: 'Sıcak Fırsatlar', author: 'Ada', created_at: '2026-10-01T00:00:00Z' };
  const html = renderForumThread({ thread, replies: [{ id, author: 'Can', body: 'https://example.com/y <img src=x>', created_at: thread.created_at }], lang: 'en' });
  assert.match(html, /Hot Deals/);
  assert.match(html, /href="https:\/\/example.com\/x"/);
  assert.match(html, /href="https:\/\/example.com\/y"/);
  assert.match(html, /&lt;img src=x&gt;/);
});

test('fırsat konusu kaydedilir, kategoriyle filtrelenir ve yanıt alabilir', async () => {
  const { createForumHandler } = await import('../api/forum.js');
  process.env.DATABASE_URL = 'postgresql://test.invalid/test';
  process.env.SESSION_SECRET = 'deals-test-secret';
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER|DELETE FROM forum_limits)/.test(text)) return [];
    if (/forum_sessions/.test(text)) return [{ id, username: 'Ada' }];
    if (/INSERT INTO forum_limits/.test(text)) return [{ key: 'ok' }];
    if (/INSERT INTO forum_replies/.test(text)) return [{ id }];
    return [];
  };
  const handler = createForumHandler(() => sql);
  const request = async (method, query = {}, body) => {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method, query, body, headers: { 'content-type': 'application/json', cookie: `testotavan_forum=${'a'.repeat(64)}` } }, res);
    return res;
  };
  assert.equal((await request('POST', {}, { title: 'İndirimli ürün', body: 'https://example.com/urun 100 TL', category: 'Sıcak Fırsatlar' })).code, 201);
  assert.ok(queries.some(q => /INSERT INTO forum_threads/.test(q.text) && q.values.includes('Sıcak Fırsatlar')));
  const filtered = await request('GET', { category: 'Sıcak Fırsatlar' });
  assert.equal(filtered.data.meta.category, 'Sıcak Fırsatlar');
  assert.ok(queries.some(q => /FROM forum_threads t/.test(q.text) && q.values.includes('Sıcak Fırsatlar')));
  assert.equal((await request('POST', {}, { threadId: id, body: 'Bu ürünü kullanan var mı?' })).code, 201);
  assert.ok(queries.some(q => /INSERT INTO forum_replies/.test(q.text) && q.values.includes('Bu ürünü kullanan var mı?')));
});
