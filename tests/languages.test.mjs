/*
 * 10 dilli yayın kapsamı.
 *
 * Tek doğruluk kaynağı api/_langs.js'tir: istemci sözlüğü, yönetim paneli,
 * forum çekirdeği ve sunucu tarafı SEO çıktıları bu listeyle uyumlu olmalıdır.
 * Yeni dillerde eksik metin Türkçeye değil İngilizceye düşer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANGUAGES, LANGS, TARGET_LANGS, LANG_LABELS, LANG_LOCALES, SOURCE_LANG } from '../api/_langs.js';
import { ABOUT_LANGUAGES } from '../api/_about-shape.js';
import { renderBlogHub, renderBlogPost, localizedContent } from '../api/_blog-page.js';
import { renderForumThread } from '../api/_forum-page.js';
import { buildSitemap } from '../api/_sitemap.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const NEW_LANGS = ['fr', 'es', 'bg', 'ru', 'hi', 'zh'];
const ALL_LANGS = ['tr', 'en', 'de', 'ja', ...NEW_LANGS];

/* ---------- kayıt defteri ---------- */

test('dil kayıt defteri on dili tek yerden tanımlar', () => {
  assert.deepEqual(LANGS, ALL_LANGS);
  assert.equal(SOURCE_LANG, 'tr');
  assert.deepEqual(TARGET_LANGS, ALL_LANGS.filter(code => code !== 'tr'));
  assert.equal(LANGUAGES.length, 10);
  for (const language of LANGUAGES) {
    assert.ok(language.code && language.label && language.name, `${language.code} etiketi eksik`);
    assert.match(language.locale, /^[a-z]{2}_[A-Z]{2}$/, `${language.code} locale biçimi hatalı`);
  }
  assert.equal(LANG_LABELS.bg, 'BG');
  assert.equal(LANG_LOCALES.hi, 'hi_IN');
  assert.equal(LANG_LOCALES.zh, 'zh_CN');
});

test('istemci sözlüğü on dilde eksiksiz ve Türkçe metin sızdırmıyor', () => {
  const source = read('src/js/content.js');
  const start = source.indexOf('const i18n');
  const end = source.indexOf('let currentLanguage');
  assert.ok(start > 0 && end > start, 'i18n bloğu bulunamadı');
  const block = source.slice(start, end);
  const { i18n, pageMeta, examplePrefix } = new Function(`${block}\nreturn { i18n, pageMeta, examplePrefix };`)();

  assert.deepEqual(Object.keys(i18n).sort(), TARGET_LANGS.slice().sort(), 'i18n yalnızca hedef dilleri içermeli');
  const keys = Object.keys(i18n.en).sort();
  assert.ok(keys.length >= 300, `sözlük beklenenden küçük: ${keys.length}`);
  for (const lang of TARGET_LANGS) {
    assert.deepEqual(Object.keys(i18n[lang]).sort(), keys, `${lang} sözlüğünde eksik anahtar var`);
    const dictionary = /** @type {Record<string, string>} */ (i18n[lang]);
    if (lang !== 'en' && lang !== 'de' && lang !== 'ja') {
      const leaked = Object.entries(dictionary).filter(([, value]) => /[ğışİĞŞ]/.test(String(value)));
      assert.deepEqual(leaked.map(([key]) => key), [], `${lang} sözlüğünde Türkçe karakterli değer var`);
    }
  }
  assert.deepEqual(Object.keys(pageMeta), ALL_LANGS, 'pageMeta on dili kapsamalı');
  assert.equal(pageMeta.fr.locale, 'fr_FR');
  assert.equal(pageMeta.zh.locale, 'zh_CN');
  assert.deepEqual(Object.keys(examplePrefix).sort(), TARGET_LANGS.slice().sort());
  assert.equal(examplePrefix.hi, 'उदा.:');
});

test('istemci çeviri yardımcıları İngilizce yedeğine düşer', () => {
  const source = read('src/js/content.js');
  assert.match(source, /const dict=i18n\[currentLanguage\]\|\|\{\}; return dict\[text\]\|\|\(i18n\.en\|\|\{\}\)\[text\]\|\|text;/,
    'translateUi EN yedeği kullanmalı');
  assert.match(source, /const enDict=i18n\.en\|\|/, 'applyTranslations EN yedeği kullanmalı');
  assert.match(source, /localizeDuration[\s\S]{0,600}zh:\{min:'分钟'/, 'süre birimleri yeni dilleri kapsamalı');
  assert.match(source, /category:pick\('category'\)/, 'içerik çevirisi EN yedeğine düşmeli');
  assert.match(source, /const en=item\.translations\?\.en\|\|/, 'içerik EN yedeği tanımlı olmalı');
});

test('HTML kabuğu dil seçici, hreflang ve yazı tipi yedeklerini içerir', () => {
  const html = read('src/index.html');
  for (const lang of ALL_LANGS) {
    assert.match(html, new RegExp(`<option value="${lang}">`), `${lang} seçeneği eksik`);
  }
  assert.equal((html.match(/"inLanguage":/g) || []).length, 2, 'JSON-LD dil listeleri güncel olmalı');
  for (const lang of ALL_LANGS) {
    assert.match(html, new RegExp(`"inLanguage": \\[[^\\]]*"${lang}"`), `${lang} JSON-LD içinde yok`);
  }
  for (const lang of ['bg', 'ru', 'hi', 'zh', 'ja']) {
    assert.match(html, new RegExp(`html\\[lang="${lang}"\\] body`), `${lang} yazı tipi yedeği eksik`);
  }
  assert.match(read('forum/style.css'), /html\[lang="hi"\] \{ --sans:/, 'forum yazı tipi yedeği eksik');
  for (const lang of ALL_LANGS) {
    const href = lang === 'tr' ? 'https://testosteron-test.vercel.app/' : `https://testosteron-test.vercel.app/?lang=${lang}`;
    assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${href}">`), `${lang} hreflang alternatifi eksik`);
  }
  assert.match(html, /<link rel="alternate" hreflang="x-default" href="https:\/\/testosteron-test\.vercel\.app\/">/,
    'x-default alternatifi eksik');
  assert.match(html, /<link id="canonicalLink" rel="canonical"/, 'canonical bağlantısı dile göre güncellenebilmeli');
});

test('?lang= parametresi dili belirler ve canonical adresi günceller', () => {
  const source = read('src/js/content.js');
  assert.match(source, /function langFromUrl\(\)\{/, '?lang= okuyucusu tanımlı olmalı');
  assert.match(source, /new URLSearchParams\(location\.search\)\.get\('lang'\)/, 'lang parametresi adresten okunmalı');
  assert.match(source, /SUPPORTED_LANGUAGES\.some\(l=>l\.code===raw\)/, 'bilinmeyen dil yok sayılmalı');
  assert.match(source, /let currentLanguage = urlLang \|\| localStorage\.getItem\('testotavan_language'\)/, 'adres dili kayıtlı dilden öncelikli olmalı');
  assert.match(source, /function syncLanguageUrl\(lang\)\{/, 'seçim adrese yazılmalı');
  assert.match(source, /window\.history\.replaceState/, 'adres geçmişi bozulmadan güncellenmeli');
  assert.match(source, /url\.searchParams\.delete\('lang'\)/, 'Türkçede parametre kaldırılmalı');
  assert.match(source, /getElementById\('canonicalLink'\)/, 'canonical dile göre güncellenmeli');
});

/* ---------- yönetim paneli ---------- */

test('yönetim paneli on dili düzenler ve hedef dilleri tek yerden türetir', () => {
  const html = read('admin/index.html');
  assert.match(html, /const LANGS=\['tr','en','de','ja','fr','es','bg','ru','hi','zh'\];/);
  assert.match(html, /const TARGET_LANGS_ADMIN=LANGS\.filter\(l=>l!=='tr'\);/);
  assert.match(html, /const ING_TARGETS=TARGET_LANGS_ADMIN;/);
  for (const lang of NEW_LANGS) {
    assert.match(html, new RegExp(`data-lang="${lang}"`), `${lang} sekmesi eksik`);
    assert.match(html, new RegExp(`<div id="${lang}" class="lang-panel">`), `${lang} paneli eksik`);
    assert.match(html, new RegExp(`data-lang-quality="${lang}"`), `${lang} kalite kartı eksik`);
  }
  assert.match(html, /translations:Object\.fromEntries\(TARGET_LANGS_ADMIN\.map/, 'yayın payload tüm dilleri göndermeli');
  assert.match(html, /autoFillDurations[\s\S]{0,200}TARGET_LANGS_ADMIN\.forEach/, 'süre otomatik çevirisi tüm dilleri kapsamalı');
  assert.ok(!/\['en','de','ja'\]\.forEach/.test(html), 'üç dilli döngü kalmamalı');
  assert.match(html, /lang==='bg'\|\|lang==='ru'/, 'Kiril alfabesi denetimi olmalı');
  assert.match(html, /lang==='hi'\)return \/\[\\u0900-\\u097f\]/, 'Devanagari denetimi olmalı');
  assert.match(html, /lang==='zh'\)return \/\[\\u4e00-\\u9fff\]/, 'Han denetimi olmalı');
  for (const lang of NEW_LANGS) {
    assert.match(read('admin/index.html'), new RegExp(`<option value="${lang}">`), `${lang} hakkımızda dili eksik`);
  }
  assert.deepEqual(ABOUT_LANGUAGES, ALL_LANGS);
});

/* ---------- sunucu tarafı sayfalar ---------- */

const translatedItem = {
  id: '1',
  slug: 'uyku-ve-testosteron',
  type: 'blog',
  category: 'Uyku',
  title: 'Uyku ve Testosteron',
  summary: 'Uyku kalitesi hormonal dengeyi etkiler.',
  body: '## Başlık\nGövde metni.',
  time: '5 dk',
  created_at: '2026-01-01',
  translations: Object.fromEntries(TARGET_LANGS.map(lang => [lang, {
    title: `${lang} title`,
    summary: `${lang} summary text`,
    body: `## ${lang}\nbody`,
    category: `cat-${lang}`,
    time: '5 min'
  }]))
};

test('blog sayfası her çevrili dil için hreflang, og:locale ve html lang üretir', () => {
  for (const lang of NEW_LANGS) {
    const html = renderBlogPost({ item: translatedItem, siteUrl: 'https://testotavan.com', lang });
    assert.match(html, new RegExp(`<html lang="${lang}"`), `${lang} html lang eksik`);
    assert.match(html, new RegExp(`hreflang="${lang}"`), `${lang} hreflang eksik`);
    assert.match(html, /hreflang="x-default"/, 'x-default eksik');
    assert.match(html, new RegExp(`og:locale" content="${LANG_LOCALES[lang]}"`), `${lang} og:locale eksik`);
    assert.ok(html.includes(`${lang} title`), `${lang} içeriği sayfada yok`);
  }
  const hindi = renderBlogPost({ item: translatedItem, siteUrl: 'https://testotavan.com', lang: 'hi' });
  assert.match(hindi, /class="chip"/, 'dil değiştirici çipleri olmalı');
  assert.equal((hindi.match(/hreflang="/g) || []).length >= 11, true, 'hreflang listesi eksik');
});

test('blog arşivi çevirisi olmayan içeriği gizler ve İngilizceye düşer', () => {
  const onlyEnglish = {
    id: '2', slug: 'sleep', type: 'blog', category: 'Uyku', title: 'Uyku ve Testosteron',
    summary: 'Türkçe özet', body: '## B\nmetin', time: '5 dk', published_at: '2026-01-01',
    translations: { en: { title: 'Sleep and Testosterone', summary: 'EN summary', body: '## S\nbody', category: 'Sleep', time: '5 min' } }
  };
  const untranslated = {
    id: '3', slug: 'sadece-tr', type: 'blog', category: 'Uyku', title: 'Yalnızca Türkçe Başlık',
    summary: 'x', body: '## Y\ny', time: '3 dk', translations: {}
  };
  const html = renderBlogHub({ items: [onlyEnglish, untranslated], siteUrl: 'https://testotavan.com', env: {}, lang: 'ru' });
  assert.ok(html.includes('Sleep and Testosterone'), 'İngilizce başlık gösterilmeli');
  assert.ok(!html.includes('Uyku ve Testosteron'), 'Türkçe başlık Rusça arşivde görünmemeli');
  assert.ok(!html.includes('Yalnızca Türkçe Başlık'), 'çevirisi olmayan içerik listelenmemeli');
  assert.ok(html.includes('Sleep · '), 'kategori etiketi de çevrilmeli');
  assert.ok(html.includes('https://testotavan.com/?lang=ru#physicalPage'), 'CTA dili korumalı');

  const tr = renderBlogHub({ items: [onlyEnglish, untranslated], siteUrl: 'https://testotavan.com', env: {}, lang: 'tr' });
  assert.ok(tr.includes('Yalnızca Türkçe Başlık'), 'Türkçe arşiv tüm içeriği listeler');
  assert.ok(tr.includes('Uyku ve Testosteron'), 'Türkçe arşiv kaynak metni gösterir');
});

test('dil değiştirince iç bağlantılar da aynı dili taşır', () => {
  const html = renderBlogPost({ item: translatedItem, siteUrl: 'https://testotavan.com', lang: 'ru' });
  assert.ok(html.includes('href="https://testotavan.com/blog/uyku-ve-testosteron/?lang=ru"'), 'yazı bağlantısı dil taşımalı');
  assert.ok(html.includes('href="https://testotavan.com/?lang=ru"'), 'ana sayfa bağlantısı dil taşımalı');
  assert.ok(html.includes('href="https://testotavan.com/blog/?lang=ru"'), 'blog bağlantısı dil taşımalı');
  assert.ok(html.includes('href="https://testotavan.com/forum/?lang=ru"'), 'forum gezinme bağlantısı seçilen dili korumalı');
  assert.ok(html.includes('href="https://testotavan.com/?lang=ru#physicalPage"'), 'yazı CTA analiz bağlantısı dil taşımalı');
  assert.ok(!html.includes('ana sayfa"'), 'marka bağlantısının etiketi Türkçe kalmamalı');

  const thread = {
    id: 'abc123', author: 'Ada', title: 'Başlık', category: 'Beslenme', body: 'Gövde.',
    created_at: '2026-10-01T09:00:00Z', view_count: 12, likes: 4, pinned: false, locked: false, approved: true
  };
  const forumHtml = renderForumThread({ thread, replies: [], siteUrl: 'https://testotavan.com', env: {}, lang: 'hi' });
  assert.match(forumHtml, /<html lang="hi"/, 'forum sayfası Hintçe olmalı');
  assert.ok(forumHtml.includes('href="https://testotavan.com/?lang=hi"'), 'forum ana sayfa bağlantısı dil taşımalı');
  assert.ok(forumHtml.includes('href="https://testotavan.com/forum/?lang=hi"'), 'forum hub bağlantısı dil taşımalı');
  assert.ok(forumHtml.includes('href="https://testotavan.com/forum/?lang=hi#thread=abc123"'), 'yanıt bağlantısı dil taşımalı');
});

test('blog sayfası eksik çeviride İngilizceye düşer, Türkçe göstermez', () => {
  const onlyEnglish = {
    ...translatedItem,
    translations: {
      en: { title: 'Sleep and Testosterone', summary: 'Sleep quality affects hormonal balance.', body: '## Sleep\nBody.', category: 'Sleep', time: '5 min' }
    }
  };
  for (const lang of NEW_LANGS) {
    const view = localizedContent(onlyEnglish, lang);
    assert.equal(view.title, 'Sleep and Testosterone', `${lang} başlık EN yedeğine düşmeli`);
    assert.ok(!/[çğışİĞŞ]/.test(view.body), `${lang} gövdesinde Türkçe metin var`);
  }
});

test('site haritası tüm çeviri dillerini xhtml:link ile bildirir', () => {
  const xml = buildSitemap({ siteUrl: 'https://testotavan.com', content: [translatedItem], threads: [] });
  for (const lang of ALL_LANGS) {
    assert.match(xml, new RegExp(`hreflang="${lang}"`), `${lang} site haritasında yok`);
  }
  assert.match(xml, /hreflang="x-default"/);
  assert.equal((xml.match(/<xhtml:link/g) || []).length, 11, 'her URL için 10 dil + x-default olmalı');
});

test('forum konu sayfası yeni dillerde yazılı metinlere sahip', () => {
  const source = read('api/_forum-page.js');
  for (const lang of NEW_LANGS) {
    assert.match(source, new RegExp(`\\n  ${lang}: \\{ home: '`), `${lang} forum konu sözlüğü eksik`);
  }
  assert.match(source, /import \{ LANGS, SOURCE_LANG \} from '\.\/_langs\.js';/);
  assert.match(source, /return LANG_CODES\.has\(lang\) \? lang : SOURCE_LANG;/);
});

test('panelden eski içerikler toplu olarak yeni dillere taşınabilir', () => {
  const html = read('admin/index.html');
  assert.match(html, /id="backfill_btn"/, 'toplu çeviri düğmesi eksik');
  assert.match(html, /async function backfillLanguages\(\)/, 'toplu çeviri işlevi eksik');
  assert.match(html, /function itemNeedsBackfill\(row\)/, 'eksik dil tespiti eksik');
  assert.match(html, /mode:'translate'/, 'toplu çeviri AI köprüsünü kullanmalı');
  assert.match(html, /\/api\/content\?id=/, 'çeviri sonucu içeriğe kaydedilmeli');
  assert.match(html, /TARGET_LANGS_ADMIN\.some/, 'eksik dil kontrolü tüm hedef dilleri kapsamalı');
  assert.ok(!/4 dilde/.test(html), 'arayüzde dört dilli metin kalmamalı');
});

test('toplu geri doldurma aracı komut olarak tanımlı', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['backfill:languages'], 'node tools/backfill-languages.mjs');
  const tool = read('tools/backfill-languages.mjs');
  assert.match(tool, /export async function runBackfill/, 'araç test edilebilir işlev sunmalı');
  assert.match(tool, /--allow-english-fallback/, 'İngilizce yedek bilinçli bir bayrak olmalı');
  assert.match(tool, /UPDATE content SET translations=/, 'araç veritabanını güncellemeli');
});
