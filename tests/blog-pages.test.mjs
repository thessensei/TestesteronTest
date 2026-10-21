import test from 'node:test';
import assert from 'node:assert/strict';
import {
  metaDescription, renderRichText, slugify, stripSourceReferences, extractFaq, resolveSiteUrl, sectionBase, blogPostPath
} from '../api/_seo.js';
import { createBlogPageHandler, renderBlogHub, renderBlogPost, localizedContent } from '../api/blog-page.js';
import { buildSitemap } from '../api/sitemap.js';

const ORIGIN = 'https://testosteron-test.vercel.app';

const sampleItem = {
  id: 'content-1',
  type: 'blog',
  category: 'Uyku',
  title: 'Derin Uyku ve Sabah Güneşi Hormonları Nasıl Etkiliyor?',
  slug: 'derin-uyku-ve-sabah-gunesi',
  emoji: '🌙',
  time: '6 dk',
  summary: 'Klinik araştırmalar düzenli uykunun hormonal dengeyi nasıl desteklediğini gösteriyor.',
  body: 'Uyku, hormonal sağlığın görünmeyen temelidir.\n\n## Neden önemli\n\nGece boyunca salgılanan hormonlar gün içi enerjiyi belirler.\n\n- 7-8 saat uyku\n- Sabah gün ışığı\n\n## Sık Sorulan Sorular\n\nUyku testosteronu etkiler mi?\nEvet, düzenli uyku hormonal dengeyi destekler ve kortizolü düşürür.\n\nKaynak: Sağlık Örnek (https://ornek.com/haber)\n\nNot: Bu içerik bilgilendirme amaçlıdır; tıbbi tanı yerine geçmez.',
  ingredients: [],
  translations: {
    en: {
      title: 'How Deep Sleep and Morning Sunlight Shape Hormones',
      summary: 'Clinical research shows how regular sleep supports hormonal balance.',
      body: 'Sleep is the invisible foundation of hormonal health.\n\n## Why it matters\n\nHormones released overnight shape daytime energy.'
    }
  },
  cover_url: 'https://cdn.example.com/cover.jpg',
  date: '2026-10-01',
  published_at: '2026-10-01T09:00:00Z',
  updated_at: '2026-10-02T09:00:00Z'
};

/* --------------------------------------------------------------- temel yardımcılar */

test('Türkçe başlıklar okunabilir slug üretir', () => {
  assert.equal(slugify('Sabah Güneşi ve Uyku: Testosteronu Nasıl Etkiler?'), 'sabah-gunesi-ve-uyku-testosteronu-nasil-etkiler');
  assert.equal(slugify('ÇĞİÖŞÜ çğıöşü'), 'cgiosu-cgiosu');
  assert.equal(slugify('   '), '');
  assert.equal(blogPostPath('ornek-yazi'), '/blog/ornek-yazi/');
});

test('kaynakça ve atıf satırları gövdeden ayıklanır', () => {
  const body = 'Birinci paragraf.\n\nKaynak: Sağlık Örnek (https://ornek.com/haber)\n\nKaynakça:\n- https://a.com\n- https://b.com\n\nİkinci paragraf.';
  const cleaned = stripSourceReferences(body);
  assert.ok(!/kaynak/i.test(cleaned), 'Kaynak satırı kalmamalı');
  assert.ok(!/https?:\/\//.test(cleaned), 'çıplak bağlantı kalmamalı');
  assert.match(cleaned, /Birinci paragraf/);
  assert.match(cleaned, /İkinci paragraf/);
});

test('markdown benzeri gövde güvenli HTML üretir ve script kaçırılır', () => {
  const html = renderRichText('## Başlık\n\nMetin **kalın**.\n\n- bir\n- iki\n\n<script>alert(1)</script>');
  assert.match(html, /<h2 id="baslik">Başlık<\/h2>/);
  assert.match(html, /<strong>kalın<\/strong>/);
  assert.match(html, /<ul><li>bir<\/li><li>iki<\/li><\/ul>/);
  assert.ok(!html.includes('<script>'), 'kullanıcı içeriği HTML olarak çalıştırılmamalı');
  assert.match(html, /&lt;script&gt;/);
});

test('SSS bölümü FAQPage için soru/yanıt çiftlerine ayrılır', () => {
  const faq = extractFaq(sampleItem.body, 'tr');
  assert.equal(faq.length, 1);
  assert.match(faq[0].question, /Uyku testosteronu etkiler mi\?/);
  assert.match(faq[0].answer, /kortizolü düşürür/);
});

test('meta açıklama kaynak satırı taşımaz ve sınırda kırpılır', () => {
  const description = metaDescription(sampleItem.summary, sampleItem.body, 158);
  assert.ok(description.length <= 158);
  assert.ok(!/Kaynak/.test(description));
});

test('canonical adres istek başlığından veya ortam değişkeninden çözülür', () => {
  assert.equal(resolveSiteUrl({ host: 'testotavan.example' }, {}), 'https://testotavan.example');
  assert.equal(resolveSiteUrl({ 'x-forwarded-host': 'a.example', 'x-forwarded-proto': 'http' }, {}), 'http://a.example');
  assert.equal(resolveSiteUrl({}, { SITE_URL: 'https://custom.example/' }), 'https://custom.example');
  assert.deepEqual(sectionBase('blog', ORIGIN, {}), { base: `${ORIGIN}/blog`, standalone: false });
  assert.deepEqual(sectionBase('forum', ORIGIN, { FORUM_SITE_URL: 'https://forum.testotavan.com' }), { base: 'https://forum.testotavan.com', standalone: true });
});

/* --------------------------------------------------------------- sayfa üretimi */

test('blog yazısı canonical, hreflang, Open Graph ve BlogPosting JSON-LD üretir', () => {
  const html = renderBlogPost({ item: sampleItem, related: [], siteUrl: ORIGIN, env: {} });
  assert.match(html, /<title>[^<]*\| TestoTavan<\/title>/);
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/blog/derin-uyku-ve-sabah-gunesi/">`));
  assert.match(html, /hreflang="en" href="https:\/\/testosteron-test\.vercel\.app\/blog\/derin-uyku-ve-sabah-gunesi\/\?lang=en"/);
  assert.match(html, /hreflang="x-default"/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/cdn\.example\.com\/cover\.jpg">/);
  assert.match(html, /<h1>Derin Uyku ve Sabah Güneşi Hormonları Nasıl Etkiliyor\?<\/h1>/);

  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const types = ld['@graph'].map(entry => entry['@type']);
  assert.ok(types.includes('BlogPosting'));
  assert.ok(types.includes('BreadcrumbList'));
  assert.ok(types.includes('FAQPage'));
  const posting = ld['@graph'].find(entry => entry['@type'] === 'BlogPosting');
  assert.equal(posting.headline, sampleItem.title);
  assert.equal(posting.inLanguage, 'tr');
  assert.ok(posting.wordCount > 0);
  assert.ok(!/Kaynak/.test(html), 'yayınlanan sayfada kaynak/atıf satırı olmamalı');
});

test('İngilizce görünüm çeviri başlığını ve ?lang canonical adresini kullanır', () => {
  const html = renderBlogPost({ item: sampleItem, related: [], siteUrl: ORIGIN, env: {}, lang: 'en' });
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<h1>How Deep Sleep and Morning Sunlight Shape Hormones<\/h1>/);
  assert.ok(html.includes(`href="${ORIGIN}/blog/derin-uyku-ve-sabah-gunesi/?lang=en"`));
  assert.equal(localizedContent(sampleItem, 'en').title, sampleItem.translations.en.title);
  assert.equal(localizedContent(sampleItem, 'tr').title, sampleItem.title);
});

test('blog arşivi tüm yazıları kart olarak listeler ve canonical taşır', () => {
  const html = renderBlogHub({ items: [sampleItem], siteUrl: ORIGIN, env: {} });
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/blog/">`));
  assert.match(html, /class="feature"/);
  assert.ok(html.includes(`href="/blog/derin-uyku-ve-sabah-gunesi/"`));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(ld['@graph'].some(entry => entry['@type'] === 'ItemList'));
});

test('BLOG_SITE_URL tanımlanınca bağlantılar alt alan adına taşınır', () => {
  const env = { BLOG_SITE_URL: 'https://blog.testotavan.com' };
  const post = renderBlogPost({ item: sampleItem, related: [], siteUrl: ORIGIN, env });
  assert.ok(post.includes('<link rel="canonical" href="https://blog.testotavan.com/derin-uyku-ve-sabah-gunesi/">'));
  assert.ok(post.includes('href="/"'), 'blog kökü alt alan adı ana sayfası olmalı');
  const hub = renderBlogHub({ items: [sampleItem], siteUrl: ORIGIN, env });
  assert.ok(hub.includes('href="/derin-uyku-ve-sabah-gunesi/"'), 'kart bağlantısı alt alan adı köküne göre üretilmeli');
  assert.ok(!hub.includes('href="/blog/derin-uyku-ve-sabah-gunesi/"'), 'alt alan adında /blog öneki kullanılmamalı');
});

/* --------------------------------------------------------------- handler */

function fakeDb(rows) {
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/INSERT|UPDATE|DELETE/.test(text)) return [];
    if (/FROM content/.test(text)) {
      if (/WHERE slug=\?/.test(text)) return rows.filter(row => row.slug === values[0]);
      if (/WHERE id=\?/.test(text)) return rows.filter(row => row.id === values[0]);
      return rows;
    }
    return [];
  };
  return { sql, queries };
}

async function callBlog(query = {}, options = {}) {
  const { sql } = fakeDb(options.rows || []);
  const handler = createBlogPageHandler({ connect: () => sql, env: options.env || {} });
  const res = {
    headers: {}, code: 0, body: '',
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; }
  };
  await handler({ method: 'GET', query, headers: { host: 'testosteron-test.vercel.app' }, ...(options.req || {}) }, res);
  return res;
}

test('blog route arşivi, yazıyı ve 404 durumunu doğru yanıtlar', async () => {
  const hub = await callBlog({}, { rows: [sampleItem] });
  assert.equal(hub.code, 200);
  assert.match(hub.headers['Content-Type'], /text\/html/);
  assert.match(hub.body, /Blog — Hormon, uyku ve güç rehberi/);

  const post = await callBlog({ slug: 'derin-uyku-ve-sabah-gunesi/' }, { rows: [sampleItem] });
  assert.equal(post.code, 200);
  assert.match(post.body, /Derin Uyku ve Sabah Güneşi/);

  const legacy = await callBlog({ slug: 'content-1' }, { rows: [sampleItem] });
  assert.equal(legacy.code, 200, 'eski kimlik tabanlı bağlantı çalışmalı');

  const missing = await callBlog({ slug: 'yok-boyle-yazi' }, { rows: [sampleItem] });
  assert.equal(missing.code, 404);
  assert.match(missing.body, /noindex/);

  const method = await callBlog({}, { rows: [], req: { method: 'POST' } });
  assert.equal(method.code, 405);
});

test('veritabanı yokken blog arşivi yine de yayınlanabilir bir sayfa döner', async () => {
  const handler = createBlogPageHandler({
    connect: () => { throw new Error('offline'); },
    env: {}
  });
  const res = {
    headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; }
  };
  await handler({ method: 'GET', query: {}, headers: { host: 'testosteron-test.vercel.app' } }, res);
  assert.equal(res.code, 200);
  assert.match(res.body, /Henüz yayınlanmış yazı yok/);
});

test('site haritası yazıları için tarih ve öncelik taşır', () => {
  const xml = buildSitemap({ siteUrl: ORIGIN, env: {}, content: [sampleItem], threads: [], today: new Date('2026-10-05T00:00:00Z') });
  assert.match(xml, /<lastmod>2026-10-02<\/lastmod>/);
  assert.match(xml, /<priority>0\.8<\/priority>/);
});
