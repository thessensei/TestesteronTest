// Etkileşim testleri ağ/veritabanı gerektirmez; gerçek tarayıcı veya canlı DB testi yerine geçmez.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const files = fs.readdirSync(new URL('../js/', import.meta.url));
const asset = prefix => read(`js/${files.find(file => file.startsWith(`${prefix}.`))}`);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(condition) {
  for (let i = 0; i < 100; i++) { if (condition()) return; await wait(10); }
  assert.fail('Arayüz beklenen duruma ulaşmadı');
}
function setup(window, errors) {
  window.scrollTo = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.addEventListener('error', event => errors.push(event.error || new Error(event.message)));
}
const virtualConsole = errors => {
  const vc = new VirtualConsole(); vc.on('jsdomError', error => errors.push(error)); return vc;
};

test('ana sayfa URL dili, engelli depolama, analiz ve gezinme akışları çalışır', async t => {
  const errors = [];
  const dom = new JSDOM(read('index.html'), { url: 'https://example.test/?lang=en', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: virtualConsole(errors), beforeParse(window) {
    setup(window, errors);
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    window.fetch = async path => new Response(JSON.stringify(String(path).includes('stats') ? { views: 3 } : []), { status: 200 });
  } });
  t.after(async () => { dom.window.eval('i18nObserver?.disconnect()'); await wait(50); dom.window.close(); });
  const { window } = dom, d = window.document;
  const append = d.head.appendChild.bind(d.head);
  d.head.appendChild = node => {
    if (node.tagName === 'SCRIPT' && /content\.[a-f\d]+\.js/.test(node.src)) {
      node.removeAttribute('src'); node.textContent = asset('content');
      const added = append(node); queueMicrotask(() => node.onload?.()); return added;
    }
    return append(node);
  };
  for (const name of ['validation', 'app']) { const script = d.createElement('script'); script.textContent = asset(name); append(script); }
  await until(() => d.documentElement.lang === 'en');
  assert.equal(d.querySelector('#languageSelect').value, 'en');
  d.querySelector('#languageSelect').value = 'de';
  d.querySelector('#languageSelect').dispatchEvent(new window.Event('change', { bubbles: true }));
  await until(() => d.documentElement.lang === 'de');
  d.querySelector('[aria-controls="physicalPage"]').click();
  assert.ok(d.querySelector('#physicalPage').classList.contains('active'));
  for (const [id, value] of Object.entries({ inputAge: '30', inputHeight: '175', inputWeight: '75' })) d.getElementById(id).value = value;
  await until(() => d.querySelector('#symptomGrid input'));
  d.querySelector('#symptomGrid input').click();
  d.querySelector('[onclick="analyzePhysical()"]').click();
  assert.ok(d.querySelector('#physicalResult').classList.contains('show'));
  d.querySelector('[aria-controls="bloodPage"]').click();
  assert.ok(d.querySelector('#bloodPage').classList.contains('active'));
  d.querySelector('#inputTesto').value = '480';
  d.querySelector('[onclick="analyzeBlood()"]').click();
  assert.equal(d.querySelector('#bloodResult').classList.contains('show'), false, 'açık rıza olmadan sonuç oluşmamalı');
  d.querySelector('#consentCheck').click();
  d.querySelector('[onclick="analyzeBlood()"]').click();
  assert.equal(d.querySelector('#bloodResult').classList.contains('show'), true);
  await wait(100); // bekleyen çeviri ve sayaç işlerini kapatmadan tamamla
  assert.deepEqual(errors, []);
});

test('içerik modülü yüklenemezse hata gösterilir ve sonraki deneme çalışır', async t => {
  const errors = [];
  const dom = new JSDOM(read('index.html'), { url: 'https://example.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: virtualConsole(errors), beforeParse(window) {
    setup(window, errors);
    window.fetch = async path => new Response(JSON.stringify(String(path).includes('stats') ? { views: 1 } : []), { status: 200 });
  } });
  t.after(async () => { if (dom.window.__testoOptionalReady) { dom.window.eval('i18nObserver?.disconnect()'); await wait(50); } dom.window.close(); });
  const { window } = dom, d = window.document;
  let attempts = 0;
  const append = d.head.appendChild.bind(d.head);
  d.head.appendChild = node => {
    if (node.tagName === 'SCRIPT' && /content\.[a-f\d]+\.js/.test(node.src)) {
      attempts++;
      if (attempts === 1) { queueMicrotask(() => node.onerror?.()); return node; }
      node.removeAttribute('src'); node.textContent = asset('content');
      const added = append(node); queueMicrotask(() => node.onload?.()); return added;
    }
    return append(node);
  };
  for (const name of ['validation', 'app']) { const script = d.createElement('script'); script.textContent = asset(name); append(script); }
  d.querySelector('[aria-controls="blogPage"]').click();
  await until(() => d.querySelector('#contentList').textContent.includes('yüklenemedi'));
  assert.equal(attempts, 1);
  d.querySelector('[aria-controls="blogPage"]').click();
  await until(() => window.__testoOptionalReady === true);
  await wait(100);
  assert.equal(attempts, 2);
  assert.deepEqual(errors, []);
});

test('forumda konu açma ve profil güncelleme arayüzü çalışır; not düz metin kalır', async t => {
  const errors = [];
  const { outputFiles } = await build({ entryPoints: [new URL('../forum/forum.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', platform: 'browser' });
  const id = '12345678-1234-4123-8123-123456789abc';
  const profile = { username: 'Ada', profile_note: 'Merhaba', avatar_url: '' };
  let profileWrites = 0, expired = false;
  const thread = () => ({ id, author: 'Ada', title: 'Örnek konu', body: 'Merhaba dünya', category: 'Genel', approved: true, created_at: '2026-01-01T00:00:00Z', profile_note: profile.profile_note, avatar_url: '', likes: 0 });
  const dom = new JSDOM(read('forum/index.html'), { url: 'https://example.test/forum/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: virtualConsole(errors), beforeParse(window) {
    setup(window, errors);
    window.fetch = async (address, options = {}) => {
      const url = new URL(address, 'https://example.test');
      let data;
      if (url.pathname === '/api/forum-auth') {
        if (options.method === 'POST') { const payload = JSON.parse(options.body); if (payload.action === 'profile') { if (expired) return new Response(JSON.stringify({ error: 'Oturum sona erdi.' }), { status: 401 }); profile.profile_note = payload.note; profileWrites++; } }
        data = { user: { ...profile }, googleEnabled: false };
      } else if (url.pathname === '/api/forum-stats') data = { threads: 1, replies: 0, members: 1, views: 0 };
      else if (url.pathname === '/api/forum') data = url.searchParams.has('id') ? { thread: thread(), replies: [] } : { threads: [thread()] };
      else return new Response('{}', { status: 404 });
      return new Response(JSON.stringify(data), { status: 200 });
    };
  } });
  t.after(() => dom.window.close());
  const { window } = dom, d = window.document;
  window.eval(outputFiles[0].text);
  await until(() => d.querySelector('[data-open]'));
  d.querySelector('[data-open]').click();
  await until(() => !d.querySelector('#detail').hidden);
  assert.match(d.querySelector('#conversation').textContent, /Merhaba/);
  d.querySelector('#show-profile').click();
  assert.equal(d.querySelector('#profile-panel').hidden, false);
  assert.equal(d.querySelector('#profile-note').value, 'Merhaba');
  d.querySelector('#profile-note').value = '<img src=x onerror=alert(1)>';
  d.querySelector('#profile-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => profileWrites === 1 && d.querySelector('#profile-feedback').textContent.includes('güncellendi'));
  assert.match(d.querySelector('#conversation').textContent, /<img src=x onerror=alert\(1\)>/);
  assert.equal(d.querySelector('#conversation .author-note img'), null);
  await until(() => !d.querySelector('#profile-form button[type=submit]').disabled);
  expired = true;
  d.querySelector('#profile-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => !d.querySelector('#auth-panel').hidden && d.querySelector('#profile-panel').hidden);
  assert.equal(d.querySelector('#auth-user').hidden, true);
  assert.deepEqual(errors, []);
});
