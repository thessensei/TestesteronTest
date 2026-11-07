import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EDITORIAL_POSTS, REVIEWED_AT, mergeEditorial } from '../api/_editorial.js';
import { createBlogPageHandler, renderBlogHub, renderBlogPost } from '../api/_blog-page.js';
import { createBlogRssHandler } from '../api/_blog-rss.js';
import { createSitemapHandler } from '../api/_sitemap.js';
import contentHandler from '../api/content.js';

function response() {
  return {
    headers: {}, code: 0, body: '',
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; }
  };
}
async function request(handler, query = {}, method = 'GET') {
  const res = response();
  await handler({ method, query, headers: { host: 'testotavan.com' } }, res);
  return res;
}
const offline = { connect: () => { throw new Error('offline'); }, env: {} };

test('rehberler benzersiz, tarihlenmiş, kaynaklı ve TR/EN gövdeleriyle gelir', () => {
  assert.equal(EDITORIAL_POSTS.length, 3);
  assert.equal(new Set(EDITORIAL_POSTS.map(post => post.slug)).size, 3);
  for (const post of EDITORIAL_POSTS) {
    assert.equal(post.reviewed_at, REVIEWED_AT);
    assert.equal(post.read_only, true);
    assert.equal(post.url, `/blog/${post.slug}/`);
    assert.ok(post.body.length > 600);
    assert.ok(post.translations.en.body.length > 600);
    for (const source of post.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(['uroweb.org', 'www.fda.gov'].includes(new URL(source.url).hostname));
    }
  }
  assert.match(EDITORIAL_POSTS[1].body, /28 Şubat 2025/);
  assert.match(EDITORIAL_POSTS[1].body, /yeni bir 2026 ilaç onayı değildir/);
});

test('panel kaydı aynı slug için önceliklidir, tekrar veya veri mutasyonu oluşmaz', () => {
  const post = { ...EDITORIAL_POSTS[0], id: 'db-1', title: 'Panel güncellemesi', read_only: false };
  const rows = [post];
  const merged = mergeEditorial(rows);
  assert.equal(merged.length, 3);
  assert.equal(merged.find(item => item.slug === post.slug).title, 'Panel güncellemesi');
  assert.equal(rows.length, 1);
  assert.equal(mergeEditorial(merged).length, 3);
  assert.equal(mergeEditorial([{ ...EDITORIAL_POSTS[0], slug: 'yeni-slug' }]).length, 3);
});

test('veritabanı yokken hazır rehberler yeniden yayınlanmaz ve servis hatası gösterilir', async () => {
  const handler = createBlogPageHandler(offline);
  const hub = await request(handler);
  assert.equal(hub.code, 503);
  assert.match(hub.body, /geçici olarak kullanılamıyor/);
  for (const item of EDITORIAL_POSTS) {
    assert.ok(!hub.body.includes(item.url));
    assert.equal((await request(handler, { slug: item.slug })).code, 503);
  }
  assert.equal((await request(handler, {}, 'HEAD')).body, '');
  assert.equal((await request(handler, {}, 'POST')).code, 405);
});

test('veritabanı sorgu hatası 503 ve no-store ile yanıtlanır', async () => {
  const handler = createBlogPageHandler({ connect: () => async () => { throw new Error('query failed'); }, env: {} });
  const res = await request(handler, { slug: EDITORIAL_POSTS[0].slug });
  assert.equal(res.code, 503);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('kaynaklar gövde temizliğinden etkilenmez ve doğrulanmamış alanlar HTML çalıştıramaz', () => {
  const html = renderBlogPost({ item: EDITORIAL_POSTS[0], env: {} });
  assert.match(html, /rel="noopener noreferrer"/);
  const forged = renderBlogPost({ item: { ...EDITORIAL_POSTS[0], sources: [{ title: '<script>bad()</script>', url: 'javascript:alert(1)' }] }, env: {} });
  assert.doesNotMatch(forged, /javascript:alert|bad\(\)/);
  const custom = renderBlogPost({ item: { ...EDITORIAL_POSTS[0], id: 'custom', read_only: false }, env: {} });
  assert.doesNotMatch(custom, /Kaynaklar ve güncellik/);
});

test('arama, kategori ve dil birlikte çalışır; boş sonuç ve HTML kaçışı güvenlidir', () => {
  const result = renderBlogHub({ items: EDITORIAL_POSTS, search: 'FDA', category: 'Tedavi güvenliği', env: {} });
  assert.ok(result.includes(EDITORIAL_POSTS[1].url));
  assert.ok(!result.includes(EDITORIAL_POSTS[0].url + '">'));
  const empty = renderBlogHub({ items: EDITORIAL_POSTS, search: 'FDA', category: 'Test ve tanı', env: {} });
  assert.match(empty, /Eşleşen yazı bulunamadı/);
  const attack = renderBlogHub({ items: EDITORIAL_POSTS, search: '"><script>alert(1)</script>', env: {} });
  assert.doesNotMatch(attack, /<script>alert\(1\)<\/script>/);
  const english = renderBlogHub({ items: EDITORIAL_POSTS, search: 'fertility', lang: 'en', env: {} });
  assert.match(english, /name="lang" value="en"/);
  assert.ok(english.includes(`${EDITORIAL_POSTS[2].url}?lang=en`));
  const detail = renderBlogPost({ item: EDITORIAL_POSTS[0], lang: 'en', env: {} });
  assert.match(detail, /Sources and review date/);
  assert.doesNotMatch(detail, /Kaynaklar ve güncellik|2026 rehberi/);
});

test('RSS ve sitemap veritabanı yokken hazır rehberleri tekrar yayınlamaz', async () => {
  const rss = await request(createBlogRssHandler(offline));
  const sitemap = await request(createSitemapHandler(offline));
  assert.equal(rss.code, 200);
  assert.equal(sitemap.code, 200);
  for (const post of EDITORIAL_POSTS) {
    assert.ok(!rss.body.includes(post.url));
    assert.ok(!sitemap.body.includes(post.url));
  }
  assert.match(sitemap.body, /<loc>[^<]+\/forum\/<\/loc>/);
});

test('içerik API veritabanı yokken hazır rehberleri döndürmez', async () => {
  const old = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const publicResult = await request(contentHandler, { guides: '1' });
    assert.equal(publicResult.code, 500);
    assert.ok(!Array.isArray(publicResult.body));
    const writeResult = await request(contentHandler, { guides: '1' }, 'POST');
    assert.notEqual(writeResult.code, 200);
  } finally {
    if (old === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = old;
  }
});

test('forum girişleri blogdan bağımsız açılır; eski konu URLsi korunur', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(!(config.redirects || []).some(rule => rule.source.startsWith('/forum')));
  for (const source of ['/forum', '/forum/']) {
    assert.deepEqual(config.rewrites.find(rule => rule.source === source), { source, destination: '/forum/index.html' });
  }
  assert.ok(config.rewrites.some(rule => rule.source === '/forum/t/(.*)'));
  assert.ok(config.rewrites.some(rule => rule.source === '/blog' && rule.destination === '/api/seo?type=blog'));
});
