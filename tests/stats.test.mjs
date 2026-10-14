import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { createStatsHandler } from '../api/stats.js';

process.env.DATABASE_URL = 'postgresql://test.invalid/test';
const id = '12345678-1234-4123-8123-123456789abc';
const consent = 'testotavan_cookie_consent';
const visitor = 'testotavan_visitor_v1';
const acceptedHeaders = {
  'x-testotavan-stats': '1',
  cookie: `${consent}=accepted; ${visitor}=${id}`
};
function server() {
  const visitors = new Set();
  const queries = [];
  const handler = createStatsHandler(() => async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (text.startsWith('INSERT')) visitors.add(values[0]);
    if (text.startsWith('SELECT')) return [{ views: String(visitors.size) }];
    return [];
  });
  return {
    queries, visitors,
    async request(method = 'GET', headers = {}) {
      const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
      await handler({ method, headers }, res);
      return res;
    }
  };
}

test('new unique counter starts at zero and never reads legacy page views', async () => {
  const s = server();
  for (let i = 0; i < 3; i++) {
    const res = await s.request();
    assert.equal(res.code, 200);
    assert.equal(res.data.views, 0);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  assert.ok(s.queries.every(q => !/site_stats|page_views/.test(q.text)));
  assert.ok(s.queries.every(q => !q.text.startsWith('INSERT')));
});

test('refresh, retries and concurrent requests share one DB identity; new browser counts once', async () => {
  const s = server();
  await Promise.all(Array.from({ length: 5 }, () => s.request('POST', acceptedHeaders)));
  assert.equal((await s.request()).data.views, 1);
  const insert = s.queries.find(q => q.text.startsWith('INSERT'));
  assert.match(insert.text, /ON CONFLICT \(visitor_id\) DO NOTHING/);
  assert.deepEqual(insert.values, [id]);
  assert.match(s.queries[0].text, /visitor_id UUID PRIMARY KEY/);
  await s.request('POST', { ...acceptedHeaders, cookie: `${consent}=accepted; ${visitor}=${randomUUID()}` });
  assert.equal((await s.request()).data.views, 2);
});

test('writes without consent, invalid IDs and cross-site requests never touch database', async () => {
  const s = server();
  for (const headers of [
    {},
    { ...acceptedHeaders, cookie: `${consent}=rejected; ${visitor}=${id}` },
    { ...acceptedHeaders, 'sec-fetch-site': 'cross-site' },
    { ...acceptedHeaders, 'x-testotavan-stats': '' }
  ]) assert.equal((await s.request('POST', headers)).code, 403);
  for (const value of ['', 'invalid', "' OR 1=1", id + 'garbage']) {
    assert.equal((await s.request('POST', { ...acceptedHeaders, cookie: `${consent}=accepted; ${visitor}=${value}` })).code, 400);
  }
  assert.equal((await s.request('DELETE')).code, 405);
  assert.equal(s.queries.length, 0);
});

test('missing database does not pretend the counter is zero', async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const res = await server().request();
    assert.equal(res.code, 503);
    assert.ok(res.data.error);
    assert.equal(res.data.views, undefined);
  } finally { process.env.DATABASE_URL = previous; }
});

const source = readFileSync(new URL('../src/js/app.js', import.meta.url), 'utf8');
const statsSource = source.slice(source.indexOf('let statsConsentOverride;'));
function browser({ cookies = new Map(), blocked = false, offline = false, backend = server() } = {}) {
  const elements = Object.fromEntries(['cookieBanner', 'viewCounter', 'cookieStatus', 'acceptCookies', 'rejectCookies', 'cookieSettings'].map(name => [name, { hidden: true, textContent: '', addEventListener() {}, focus() {} }]));
  const requests = [];
  const document = {
    get cookie() { return [...cookies].map(([k, v]) => `${k}=${v}`).join('; '); },
    set cookie(value) {
      if (blocked) return;
      const [pair] = value.split(';');
      const [key, data] = pair.split('=');
      if (value.includes('Max-Age=0')) cookies.delete(key);
      else cookies.set(key, data);
    },
    getElementById: name => elements[name],
    addEventListener() {}
  };
  const context = vm.createContext({ document, location: { protocol: 'https:' }, crypto: { randomUUID }, async fetch(url, options) {
    requests.push(options);
    if (offline) return { ok: false };
    const res = await backend.request(options.method, { cookie: document.cookie, 'x-testotavan-stats': options.headers?.['X-Testotavan-Stats'] });
    return { ok: res.code === 200, json: async () => res.data };
  } });
  vm.runInContext(statsSource, context);
  return { cookies, elements, requests, backend, run: code => vm.runInContext(code, context) };
}

test('landing page shows consent, GET only before consent; rejection persists on reload', async () => {
  const b = browser();
  await b.run('initStatsConsent()');
  assert.equal(b.elements.cookieBanner.hidden, false);
  assert.equal(b.requests[0].method, 'GET');
  assert.equal(b.cookies.size, 0);
  await b.run('setStatsConsent(false)');
  assert.equal(b.elements.cookieBanner.hidden, true);
  assert.equal(b.cookies.get(consent), 'rejected');
  assert.equal(b.cookies.has(visitor), false);
  const reload = browser({ cookies: b.cookies, backend: b.backend });
  await reload.run('initStatsConsent()');
  assert.equal(reload.elements.cookieBanner.hidden, true);
  assert.equal(reload.requests[0].method, 'GET');
  assert.equal(b.backend.visitors.size, 0);
});

test('accept, refresh, blog navigation and return visits count only once', async () => {
  const b = browser();
  await b.run('initStatsConsent()');
  await b.run('setStatsConsent(true)');
  const originalId = b.cookies.get(visitor);
  assert.ok(originalId);
  assert.equal(b.elements.viewCounter.textContent, 'Toplam tekil ziyaret: 1');
  await b.run('loadStats()');
  const reload = browser({ cookies: b.cookies, backend: b.backend });
  await reload.run('initStatsConsent()');
  assert.equal(reload.elements.cookieBanner.hidden, true);
  assert.equal(reload.cookies.get(visitor), originalId);
  assert.equal(b.backend.visitors.size, 1);
  reload.run('openCookieSettings()');
  assert.equal(reload.elements.cookieBanner.hidden, false);
  await reload.run('setStatsConsent(false)');
  assert.equal(reload.cookies.has(visitor), false);
  assert.equal(reload.requests.at(-1).method, 'GET');
});

test('blocked cookies and unavailable UUID generation never inflate counter', async () => {
  const b = browser({ blocked: true });
  await b.run('setStatsConsent(true)');
  assert.equal(b.requests.at(-1).method, 'GET');
  assert.match(b.elements.cookieStatus.textContent, /kaydedilemedi/);
  assert.equal(b.backend.visitors.size, 0);
  const noCrypto = browser();
  noCrypto.run('crypto.randomUUID = undefined');
  await noCrypto.run('setStatsConsent(true)');
  assert.equal(noCrypto.requests.at(-1).method, 'GET');
  assert.equal(noCrypto.backend.visitors.size, 0);
});

test('service errors show unavailable state instead of a misleading zero', async () => {
  const b = browser({ offline: true });
  await b.run('initStatsConsent()');
  assert.match(b.elements.viewCounter.textContent, /yüklenemiyor/);
  assert.doesNotMatch(b.elements.viewCounter.textContent, /0/);
});
