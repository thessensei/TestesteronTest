import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATEGORIES, CATEGORY_KEYS, UI } from '../forum/forum-core.js';

const read = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
const html = read('../forum/index.html');
const script = read('../forum/forum.js');
const css = read('../forum/style.css');

/* ------------------------------------------------------------------ tahta */

test('konu listesi Donanım Arşivi mantığında kolonlu tahta kullanır', () => {
  assert.match(html, /<div class="board" id="board">/);
  assert.match(html, /class="board-head"/);

  // Kolon başlıkları: # · Konu · Forum · Cevap · Hit · Gönderim · Son yazan
  for (const key of ['colTopic', 'colForum', 'colReplies', 'colViews', 'colPosted', 'colLast']) {
    assert.ok(html.includes(`data-i18n="${key}"`), `${key} kolon başlığı eksik`);
    assert.ok(key in UI.tr, `${key} sözlükte yok`);
  }
  assert.match(html, /class="c-index">#</);

  // Satırlar aynı ızgarayı kullanmalı: başlık ve satır 7 kolon.
  const gridRule = css.match(/\.board-head,\s*\n?\.topic-row\s*\{[^}]*grid-template-columns:\s*([^;]+);/);
  assert.ok(gridRule, 'ortak ızgara tanımı bulunamadı');
  assert.equal(gridRule[1].trim().split(/\s+(?![^(]*\))/).length, 7, 'başlık ve satır 7 kolon olmalı');
});

test('satırlar sıra numarası, son yazan ve mobil özet taşır', () => {
  for (const hook of ['row-index', 'row-topic', 'row-forum', 'row-num', 'row-when', 'row-last', 'row-mobile-meta']) {
    assert.ok(script.includes(hook), `${hook} satır parçası render edilmiyor`);
    assert.ok(css.includes(`.${hook}`), `${hook} stili eksik`);
  }
  assert.match(script, /offset \+ index \+ 1/, 'sıra numarası sayfa ofsetiyle devam etmeli');
  assert.match(script, /last_reply_author/, 'son yazan kolonu API alanını kullanmalı');
  assert.match(script, /noLastReply/, 'yanıtı olmayan konu bunu belirtmeli');
});

test('bölüm sekmeleri dört sıralamayı da sunar ve kolon başlıklarıyla senkron', () => {
  const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*data-sort="([a-z]+)"/g)].map(([, sort]) => sort);
  assert.deepEqual(tabs, ['new', 'top', 'active', 'unanswered']);
  for (const key of ['tabNew', 'tabHot']) assert.ok(key in UI.tr, `${key} sözlükte yok`);
  assert.match(html, /data-i18n="tabNew"/);
  assert.match(html, /data-i18n="tabHot"/);
  // Kolon başlıkları da aynı sıralamayı tetikler.
  assert.match(html, /class="c-num" data-sort="active"/);
  assert.match(html, /class="c-num" data-sort="top"/);
  const sync = script.match(/document\.querySelectorAll\('\[data-sort\]'\)/);
  assert.ok(sync, 'renderFilters tüm sıralama düğmelerini senkronlamalı');
});

test('sağ rayda "Yeni Konu Aç" ve "En Son İçerikler" bulunur', () => {
  assert.match(html, /id="rail-new-topic"[^>]*data-i18n="newTopic"/);
  assert.ok('newTopic' in UI.tr && 'latestContent' in UI.tr);
  assert.match(html, /id="rail-recent"/);
  assert.match(script, /function renderRecent\(/);
  assert.match(script, /stats\.recent/, 'ray verisi /api/forum-stats recent alanından gelir');
  assert.match(css, /\.recent-list/);
  assert.match(script, /\$\('rail-new-topic'\)\.onclick/, 'CTA tıklaması bağlanmalı');
});

test('sağ rayda kategori (forum) listesi ve sayaçları vardır', () => {
  assert.match(html, /id="rail-forums"/);
  assert.match(script, /\$\('rail-forums'\)\.innerHTML = \(stats\.categories/);
  assert.match(css, /\.forum-list a/);
  // Kategori bağlantıları mevcut filtreyi tetikler.
  assert.match(script, /closest\('\[data-category\]'\)/);
});

test('arama üst çubuğa taşındı, eski araç kartı kaldırıldı', () => {
  const head = html.slice(0, html.indexOf('<main'));
  assert.ok(head.includes('id="forum-search"'), 'arama kutusu üst çubukta olmalı');
  assert.ok(!html.includes('toolbar-card'), 'eski araç kartı kalmamalı');
  assert.match(css, /\.head-search/);
  // Arama hâlâ sunucu tarafına q parametresiyle gider.
  assert.match(script, /params\.set\('q', searchText\)/);
});

test('bölüm şeridi (alt navigasyon) forum, dergi ve analiz bağlarını taşır', () => {
  const nav = html.match(/<nav class="sub-nav"[\s\S]*?<\/nav>/)[0];
  for (const href of ['/forum/', '/blog/', '/#physicalPage']) {
    assert.ok(nav.includes(`href="${href}"`), `${href} bağlantısı eksik`);
  }
  assert.match(nav, /aria-current="page"/);
});

/* ------------------------------------------------------------ tutarlılık */

test('forum.js içindeki her DOM kimliği sayfada tanımlı', () => {
  const ids = new Set([...script.matchAll(/\$\('([a-z0-9-]+)'\)/g)].map(([, id]) => id));
  const missing = [...ids].filter(id => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `sayfada bulunmayan kimlikler: ${missing.join(', ')}`);
});

test('her data-i18n anahtarı dört dilde de karşılanır', () => {
  const keys = new Set();
  for (const match of html.matchAll(/data-i18n(?:-label|-placeholder)?="([^"]+)"/g)) keys.add(match[1]);
  for (const [, key] of script.matchAll(/(?<![\w.])t\('([A-Za-z-]+)'\)/g)) keys.add(key);
  for (const lang of ['tr', 'en', 'de', 'ja']) {
    const missing = [...keys].filter(key => !(key in UI[lang]));
    assert.deepEqual(missing, [], `${lang} dilinde eksik: ${missing.join(', ')}`);
  }
});

test('kategori çipleri, arama ve sıralama tek istekte birleşir', () => {
  assert.match(script, /new URLSearchParams\(\{ offset: String\(offset\), sort \}\)/);
  assert.match(script, /if \(category\) params\.set\('category', category\)/);
  for (const name of CATEGORIES) assert.ok(CATEGORY_KEYS[name], `${name} anahtarı tanımlı olmalı`);
});

test('tahta mobilde satır içi özete düşer', () => {
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.board-head \{ display: none; \}/);
  assert.match(css, /\.row-mobile-meta \{ grid-area: meta; display: flex;/);
});

test('sağ ray uzun içerikle sayfayla birlikte kayar, mobilde tek kolona iner', () => {
  assert.match(css, /\.rail \{ display: grid; gap: 12px; align-content: start; \}/);
  assert.doesNotMatch(css, /\.rail \{[^}]*position: sticky/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.rail \{ grid-template-columns: repeat\(auto-fit/);
});

test('konu detayında başlık şeridi ve iki kolonlu mesaj düzeni vardır', () => {
  assert.match(html, /id="thread-head"/);
  assert.match(script, /\$\('thread-head'\)\.innerHTML/);
  assert.match(script, /document\.title = `\$\{thread\.title\}/);
  assert.match(script, /BASE_TITLE/);
  assert.match(css, /\.post \{[^}]*grid-template-columns: 138px minmax\(0, 1fr\)/);
  assert.match(css, /\.post \.author \{[^}]*flex-direction: column/);
});

test('yeni konu düğmesi giriş durumuna göre besteciyi veya kayıt panelini açar', () => {
  const cta = script.match(/\$\('rail-new-topic'\)\.onclick = event => \{([\s\S]*?)\n\};/)[1];
  assert.match(cta, /if \(!user\) \{ showAuth\('register'\)/, 'girişsiz kullanıcı kayıt panelini görmeli');
  assert.match(cta, /scrollIntoView/, 'girişli kullanıcı besteciye kaydırılmalı');
});
