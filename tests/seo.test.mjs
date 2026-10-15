import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionOrigin = 'https://testosteron-test.vercel.app';

const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('sitemap XML geçerli namespace ve yalnızca gerçek canonical URL içerir', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.doesNotMatch(sitemap, /https:\/\/vercel\.app(?:<|\/)/, 'genel Vercel ana makinesi site URLsi olarak kullanılmamalı');

  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(urls, [`${productionOrigin}/`, `${productionOrigin}/forum/`]);
  for (const url of urls) assert.ok(url.startsWith(productionOrigin), `beklenmeyen site URLsi: ${url}`);
});

test('robots.txt sitemap adresini bildirir ve yönetim/API yollarını tarama dışında bırakır', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, /^Disallow: \/admin\//m);
  assert.match(robots, /^Disallow: \/api\//m);
  assert.ok(robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`));
});

test('ana sayfada index izni, canonical, sosyal önizleme ve geçerli JSON-LD bulunur', () => {
  const html = read('src/index.html');
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
  assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}/">`));
  assert.ok(html.includes(`<meta property="og:url" content="${productionOrigin}/">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /Testosteron Seviyesi İçin Ön Değerlendirme/);
  assert.match(html, /Bu araç tıbbi tanı koymaz/);

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

test('forum sayfası ayrı canonical URL ve arama açıklamasına sahip', () => {
  const html = read('forum/index.html');
  assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}/forum/">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
});
