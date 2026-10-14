import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../forum/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../forum/forum.js', import.meta.url), 'utf8');
const id = '12345678-1234-4123-8123-123456789abc';
const thread = { id, title: 'Antrenman programı nasıl olmalı?', body: 'Deneyimleriniz neler?', author: 'Ada', category: 'Antrenman', approved: true, locked: false, reply_count: 2, pending_count: 0, created_at: '2026-01-01T12:00:00Z', last_activity: '2026-01-02T12:00:00Z' };
const overview = { threads: [thread], hasMore: false, categories: [{ category: 'Antrenman', topic_count: 1, reply_count: 2 }] };
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const settle = () => new Promise(resolve => setImmediate(resolve));

async function setup(t, { url = '', user = null, admin = true, fetchForum, storageDisabled = false } = {}) {
  const dom = new JSDOM(html, { url: `https://forum.test/forum/${url}`, runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: true });
  window.confirm = () => true;
  if (storageDisabled) Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  const requests = [];
  window.fetch = async (path, options = {}) => {
    const url = new URL(path, window.location.href);
    const entry = { url, method: options.method || 'GET', body: options.body && JSON.parse(options.body) };
    requests.push(entry);
    if (url.pathname === '/api/forum-auth') {
      if (entry.body?.action === 'logout') return response({ ok: true });
      return response({ user });
    }
    if (url.pathname === '/api/session') return response({ authenticated: admin });
    if (fetchForum) return fetchForum(entry, requests);
    if (entry.method !== 'GET') return response({ message: 'Onay bekliyor.', ok: true });
    return response(url.searchParams.has('id') ? { thread, replies: [], hasMore: false } : overview);
  };
  window.eval(script);
  await settle();
  const $ = id => window.document.getElementById(id);
  return { window, $, requests, click: selector => window.document.querySelector(selector).click(), submit: id => $(id).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })) };
}

test('forum renders real counts, safe links and guest gates with exact pagination', async t => {
  const { $, window, click } = await setup(t);
  assert.equal($('threads').querySelectorAll('.thread-row').length, 1);
  assert.equal($('total-topics').textContent, '1');
  assert.equal($('total-replies').textContent, '2');
  assert.equal($('next').disabled, true);
  assert.equal($('previous').disabled, true);
  assert.equal($('new-thread').hidden, true);
  assert.equal($('auth-gate').hidden, false);
  assert.match($('threads').querySelector('a').href, /thread=/);
  click('#create-topic');
  assert.equal($('auth-panel').hidden, false);
  assert.equal(window.document.activeElement.name, 'username');
});

test('category, search and sort reset pagination and round-trip through history', async t => {
  const { $, window, click, submit, requests } = await setup(t, { url: '?offset=30&sort=newest' });
  assert.equal($('page').textContent, 'Sayfa 2');
  window.document.querySelector('[data-category="Beslenme"]').focus();
  click('[data-category="Beslenme"]');
  await settle();
  assert.equal(new URL(window.location.href).searchParams.get('offset'), null);
  assert.equal(requests.at(-1).url.searchParams.get('category'), 'Beslenme');
  assert.equal(window.document.activeElement.dataset.category, 'Beslenme');
  $('topic-search').value = '  protein  ';
  submit('search-form');
  await settle();
  click('[data-sort="unanswered"]');
  await settle();
  assert.equal(requests.at(-1).url.searchParams.get('q'), 'protein');
  assert.equal(requests.at(-1).url.searchParams.get('sort'), 'unanswered');
  assert.equal($('clear-filters').hidden, false);
  click('#clear-filters');
  await settle();
  assert.equal(window.location.search, '');
  window.history.replaceState(null, '', '/forum/?category=Genel&sort=popular&offset=30');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await settle();
  assert.equal($('list-heading').textContent, 'Genel');
  assert.equal($('page').textContent, 'Sayfa 2');
  assert.equal(requests.at(-1).url.searchParams.get('sort'), 'popular');
});

test('shared topic URL loads the conversation, stats and reply gate; back preserves filters', async t => {
  const { $, window, click } = await setup(t, { url: `?category=Antrenman&thread=${id}` });
  assert.equal($('listing').hidden, true);
  assert.equal($('detail').hidden, false);
  assert.match($('conversation').textContent, /Deneyimleriniz neler/);
  assert.equal($('reply-gate').hidden, false);
  assert.equal($('reply-form').hidden, true);
  assert.equal($('total-topics').textContent, '1');
  click('#back');
  await settle();
  assert.equal($('listing').hidden, false);
  assert.equal($('detail').hidden, true);
  assert.equal(window.location.search, '?category=Antrenman');
  assert.equal(window.document.activeElement.id, 'listing');
});

test('topic links are keyboard/native navigation friendly and restore browser history', async t => {
  const { $, window, click } = await setup(t);
  click('[data-open]');
  await settle();
  assert.equal($('detail').hidden, false);
  assert.equal(new URL(window.location.href).searchParams.get('thread'), id);
  assert.equal(window.document.activeElement.id, 'conversation');
  window.history.replaceState(null, '', '/forum/');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await settle();
  assert.equal($('listing').hidden, false);
});

test('late requests cannot overwrite a newer filter or reopened list', async t => {
  let finish;
  const { $, click } = await setup(t, { fetchForum: ({ url }) => {
    if (url.searchParams.get('category') === 'Beslenme') return new Promise(resolve => { finish = resolve; });
    return response(overview);
  } });
  click('[data-category="Beslenme"]');
  await settle();
  assert.equal($('threads').getAttribute('aria-busy'), 'true');
  click('[data-category="Genel"]');
  await settle();
  finish(response({ ...overview, threads: [{ ...thread, title: 'Stale response' }] }));
  await settle();
  assert.equal($('list-heading').textContent, 'Genel');
  assert.ok(!$('threads').textContent.includes('Stale response'));
  assert.equal($('threads').getAttribute('aria-busy'), 'false');
});

test('empty, filtered-empty, error and retry states are distinct', async t => {
  let fail = false;
  const { $, click } = await setup(t, { fetchForum: () => fail ? response({ error: 'Foruma ulaşılamadı.' }, 503) : response({ threads: [], categories: [], hasMore: false }) });
  assert.match($('threads').textContent, /Henüz konu yok/);
  click('[data-category="Beslenme"]');
  await settle();
  assert.match($('threads').textContent, /Aramana uygun konu bulunamadı/);
  fail = true;
  click('#refresh');
  await settle();
  assert.match($('status').textContent, /Foruma ulaşılamadı/);
  assert.equal($('threads').textContent, '');
  assert.equal($('next').disabled, true);
  fail = false;
  click('#refresh');
  await settle();
  assert.equal($('status').textContent, '');
  assert.equal($('threads').getAttribute('aria-busy'), 'false');
});

test('untrusted titles, authors, categories and post bodies never become markup', async t => {
  const hostile = { ...thread, title: '<img src=x onerror=alert(1)>', author: '<svg onload=alert(1)>', category: '"><img src=x>', body: '<script>alert(1)</script>' };
  const { $, click } = await setup(t, { fetchForum: ({ url }) => response(url.searchParams.has('id') ? { thread: hostile, replies: [hostile], hasMore: false } : { ...overview, threads: [hostile] }) });
  assert.equal($('threads').querySelector('img, svg, script'), null);
  assert.match($('threads').textContent, /<img/);
  click('[data-open]');
  await settle();
  assert.equal($('conversation').querySelector('img, svg, script'), null);
  assert.match($('conversation').textContent, /<script>/);
});

test('signed-in posting uses selected category, then clears content after approval submission', async t => {
  const { $, click, submit, requests } = await setup(t, { user: { username: 'Ada' }, url: '?category=Beslenme' });
  click('#create-topic');
  const form = $('new-thread');
  assert.equal(form.hidden, false);
  assert.equal(form.elements.category.value, 'Beslenme');
  form.elements.title.value = 'Protein hakkında soru';
  form.elements.body.value = 'Deneyimlerinizi merak ediyorum.';
  submit('new-thread');
  await settle();
  assert.equal(requests.at(-1).method, 'POST');
  assert.equal(requests.at(-1).body.category, 'Beslenme');
  assert.equal(requests.at(-1).body.author, undefined);
  assert.equal(form.elements.body.value, '');
  assert.match($('status').textContent, /Onay bekliyor/);
});

test('logout from an open topic restores reply login gate; locked topics cannot be composed', async t => {
  const { $, click } = await setup(t, { user: { username: 'Ada' }, url: `?thread=${id}` });
  assert.equal($('reply-form').hidden, false);
  click('#logout');
  await settle();
  assert.equal($('reply-form').hidden, true);
  assert.equal($('reply-gate').hidden, false);
  const locked = await setup(t, { user: { username: 'Ada' }, url: `?thread=${id}`, fetchForum: ({ url }) => response(url.searchParams.has('id') ? { thread: { ...thread, locked: true }, replies: [], hasMore: false } : overview) });
  assert.equal(locked.$('reply-form').hidden, true);
  assert.equal(locked.$('reply-gate').hidden, true);
  assert.match(locked.$('status').textContent, /yeni yanıtlara kapalı/);
});

test('moderation stays admin-only and pending controls use the existing write API', async t => {
  const { $, click, requests } = await setup(t, { url: '?manage=1', fetchForum: ({ method }) => response(method === 'GET' ? { ...overview, threads: [{ ...thread, approved: false, pending_count: 1 }] } : { ok: true }) });
  assert.equal($('create-topic').hidden, true);
  assert.equal($('new-thread').hidden, true);
  assert.match($('stats-note').textContent, /Bekleyen/);
  click('[data-action="approve"]');
  await settle();
  assert.ok(requests.some(req => req.method === 'PATCH' && req.body.action === 'approve' && req.url.searchParams.get('manage') === '1'));
  const denied = await setup(t, { url: '?manage=1', admin: false });
  assert.equal(denied.$('listing').hidden, true);
  assert.ok(!denied.requests.some(req => req.url.pathname === '/api/forum'));
});

test('all supported languages update controls without refetching; blocked storage is optional', async t => {
  const { $, window, click, requests } = await setup(t, { storageDisabled: true });
  const count = requests.length;
  for (const [lang, heading, search] of [['en', 'All topics', 'Search'], ['de', 'Alle Themen', 'Suchen'], ['ja', 'すべてのトピック', '検索'], ['tr', 'Tüm konular', 'Ara']]) {
    $('forum-lang').value = lang;
    $('forum-lang').dispatchEvent(new window.Event('change'));
    assert.equal(window.document.documentElement.lang, lang);
    assert.equal($('list-heading').textContent, heading);
    assert.equal($('search-form').querySelector('button').textContent, search);
    assert.equal($('new-thread').querySelector('[name=title]').parentElement.firstChild.textContent, lang === 'tr' ? 'Konu başlığı' : lang === 'en' ? 'Topic title' : lang === 'de' ? 'Thementitel' : 'タイトル');
  }
  assert.equal(requests.length, count);
  click('#show-login');
  $('tab-login').focus();
  $('tab-login').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal($('tab-register').getAttribute('aria-selected'), 'true');
  assert.equal($('tab-register').tabIndex, 0);
  assert.equal($('tab-login').tabIndex, -1);
  assert.equal(window.document.activeElement.id, 'tab-register');
});

test('an expired session preserves the draft and returns to login instead of posting as a guest', async t => {
  const { $, submit } = await setup(t, { user: { username: 'Ada' }, fetchForum: ({ method }) => method === 'POST' ? response({ error: 'Oturumunuz sona erdi.' }, 401) : response(overview) });
  const form = $('new-thread');
  form.elements.title.value = 'Bir antrenman sorusu';
  form.elements.body.value = 'Kaybolmaması gereken taslak';
  submit('new-thread');
  await settle();
  assert.equal(form.elements.body.value, 'Kaybolmaması gereken taslak');
  assert.equal($('auth-panel').hidden, false);
  assert.equal($('new-thread').hidden, true);
  assert.equal(form.querySelector('[type=submit]').disabled, false);
  assert.match($('status').textContent, /Oturumunuz sona erdi/);
});

test('a late conversation response cannot reopen detail after navigating back', async t => {
  let finish;
  const { $, click } = await setup(t, { fetchForum: ({ url }) => url.searchParams.has('id') ? new Promise(resolve => { finish = resolve; }) : response(overview) });
  click('[data-open]');
  await settle();
  click('#back');
  await settle();
  finish(response({ thread, replies: [], hasMore: false }));
  await settle();
  assert.equal($('detail').hidden, true);
  assert.equal($('listing').hidden, false);
  assert.equal($('conversation').textContent, '');
  assert.equal($('status').textContent, '');
});
