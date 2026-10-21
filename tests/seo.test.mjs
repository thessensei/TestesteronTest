import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSitemap } from '../api/sitemap.js';
import { buildFeed } from '../api/blog-rss.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionOrigin = 'https://testosteron-test.vercel.app';

const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('site haritası geçerli namespace ve yalnızca gerçek canonical URL içerir', () => {
  const xml = buildSitemap({
    siteUrl: productionOrigin,
    env: {},
    content: [
      {
        id: 'content-1', type: 'blog', slug: 'derin-uyku-ve-hormon-dengesi',
        title: 'Derin uyku ve hormon dengesi', published_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-02T09:00:00Z',
        translations: { en: { title: 'Deep sleep', body: 'Body' } }
      },
      { id: 'content-2', type: 'recipe', slug: 'tavuklu-bulgur', title: 'Tavuklu bulgur', published_at: '2026-10-03T09:00:00Z' }
    ],
    threads: [{ id: '12345678-1234-4123-8123-123456789abc', created_at: '2026-10-04T09:00:00Z' }]
  });

  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/);
  assert.doesNotMatch(xml, /https:\/\/vercel\.app(?:<|\/)/, 'genel Vercel ana makinesi site URLsi olarak kullanılmamalı');

  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.ok(urls.includes(`${productionOrigin}/`));
  assert.ok(urls.includes(`${productionOrigin}/blog/`));
  assert.ok(urls.includes(`${productionOrigin}/forum/`));
  assert.ok(urls.includes(`${productionOrigin}/blog/derin-uyku-ve-hormon-dengesi/`), 'blog yazısı kendi adresinde listelenmeli');
  assert.ok(urls.includes(`${productionOrigin}/blog/tavuklu-bulgur/`), 'tarif de listelenmeli');
  assert.ok(urls.includes(`${productionOrigin}/forum/t/12345678-1234-4123-8123-123456789abc/`), 'onaylı konu listelenmeli');
  for (const url of urls) assert.ok(url.startsWith(productionOrigin), `beklenmeyen site URLsi: ${url}`);

  // Çeviri varsa hreflang alternatifi eklenir.
  assert.match(xml, /hreflang="en" href="https:\/\/testosteron-test\.vercel\.app\/blog\/derin-uyku-ve-hormon-dengesi\/\?lang=en"/);
  assert.match(xml, /hreflang="x-default"/);
});

test('site haritası alt alan adı (subdomain) yapılandırmasını onurlandırır', () => {
  const xml = buildSitemap({
    siteUrl: productionOrigin,
    env: { BLOG_SITE_URL: 'https://blog.testotavan.com', FORUM_SITE_URL: 'https://forum.testotavan.com' },
    content: [{ id: 'content-1', type: 'blog', slug: 'ornek-yazi', title: 'Örnek', published_at: '2026-10-01T00:00:00Z' }],
    threads: [{ id: '12345678-1234-4123-8123-123456789abc', created_at: '2026-10-04T00:00:00Z' }]
  });
  assert.match(xml, /<loc>https:\/\/blog\.testotavan\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/blog\.testotavan\.com\/ornek-yazi\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/forum\.testotavan\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/forum\.testotavan\.com\/t\/12345678-1234-4123-8123-123456789abc\/<\/loc>/);
  assert.doesNotMatch(xml, /<loc>https:\/\/testosteron-test\.vercel\.app\/blog\//);
});

test('RSS akışı yayınlanan yazıları canonical bağlantılarıyla listeler', () => {
  const xml = buildFeed({
    siteUrl: productionOrigin,
    env: {},
    items: [{ id: 'content-1', slug: 'ornek-yazi', title: 'Örnek & yazı', category: 'Uyku', summary: 'Kısa özet', body: 'Gövde', published_at: '2026-10-01T09:00:00Z' }]
  });
  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<link>https:\/\/testosteron-test\.vercel\.app\/blog\/ornek-yazi\/<\/link>/);
  assert.match(xml, /<title>Örnek &amp; yazı<\/title>/, 'XML özel karakterleri kaçırılmalı');
  assert.match(xml, /<atom:link href="https:\/\/testosteron-test\.vercel\.app\/blog\/rss\.xml"/);
});

test('robots.txt sitemap adresini bildirir ve yönetim/API yollarını tarama dışında bırakır', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, /^Disallow: \/admin\//m);
  assert.match(robots, /^Disallow: \/api\//m);
  assert.ok(robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`));
  assert.equal(fs.existsSync(path.join(root, 'sitemap.xml')), false, 'statik sitemap yerine dinamik /sitemap.xml kullanılmalı');
});

test('vercel.json blog, rss, sitemap ve forum konu adreslerini fonksiyonlara bağlar', () => {
  const config = JSON.parse(read('vercel.json'));
  const rewrites = Object.fromEntries(config.rewrites.map(rule => [rule.source, rule.destination]));
  assert.equal(rewrites['/sitemap.xml'], '/api/sitemap');
  assert.equal(rewrites['/blog/rss.xml'], '/api/blog-rss');
  assert.equal(rewrites['/blog/(.*)'], '/api/blog-page?slug=$1');
  assert.equal(rewrites['/forum/t/(.*)'], '/api/forum-page?id=$1');
});

test('ana sayfada index izni, canonical, sosyal önizleme ve geçerli JSON-LD bulunur', () => {
  const html = read('src/index.html');
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
  assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}/">`));
  assert.ok(html.includes(`<meta property="og:url" content="${productionOrigin}/">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /Testosteron Seviyesi İçin Ön Değerlendirme/);
  assert.match(html, /Bu araç tıbbi tanı koymaz/);
  assert.ok(html.includes('href="/blog/"'), 'blog arşivine iç bağlantı olmalı');
  assert.ok(html.includes('href="/forum/"'), 'foruma iç bağlantı olmalı');

  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'structured data script should exist');
  const schema = JSON.parse(match[1]);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.ok(schema['@graph'].some(entry => entry['@type'] === 'WebSite'));
  assert.ok(schema['@graph'].some(entry => entry['@type'] === 'WebApplication'));
});

test('Google Search Console doğrulaması yayında kalır (HTML etiketi + HTML dosyası)', () => {
  // Google sahipliği periyodik olarak yeniden denetler; bunlar silinirse mülk doğrulaması düşer.
  const tokens = ['ac-bJdohFXsUbq5bD8cVEip7Ryd_nEkaRhNenMmCi8M', '4SlBNFo5IoQK9Q3QIw99aX6nuEvpNMV2CRIrzGPMMqc'];
  for (const file of ['src/index.html', 'index.html']) {
    const html = read(file);
    const head = html.slice(0, html.indexOf('</head>'));
    for (const token of tokens) {
      assert.ok(head.includes(`<meta name="google-site-verification" content="${token}">`), `${file} <head> içinde ${token} doğrulama etiketi olmalı`);
    }
  }
  assert.equal(read('google5ef2fba9d6d13dcc.html').trim(), 'google-site-verification: google5ef2fba9d6d13dcc.html');
  assert.doesNotMatch(read('.vercelignore'), /google[0-9a-f]+\.html/, 'doğrulama dosyası yayından hariç tutulmamalı');
});

test('forum sayfası ayrı canonical URL, arama açıklaması ve yapılandırılmış veriye sahip', () => {
  const html = read('forum/index.html');
  assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}/forum/">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/testosteron-test\.vercel\.app\/forum\/">/);
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'forum hub JSON-LD taşımalı');
  const schema = JSON.parse(match[1]);
  assert.ok(schema['@graph'].some(entry => entry['@type'] === 'DiscussionForumPosting'));
});
