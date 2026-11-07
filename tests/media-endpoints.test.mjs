import test from 'node:test';
import assert from 'node:assert/strict';
import { createMediaUploadHandler } from '../api/media/index.js';
import { createMediaReadHandler } from '../api/media/[id].js';
import { createSessionCookie } from '../api/_auth.js';

process.env.SESSION_SECRET = 'test-only-session-secret-at-least-32-chars';
const cookie = createSessionCookie().split(';')[0];
const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(value) { this.data = value; return this; }, send(value) { this.data = value; return this; } };
}

test('kapak yükleme yönetici, aynı site ve JSON gerektirir; görsel güvenli sunulur', async () => {
  let stored;
  const sql = async (strings, ...values) => {
    const query = strings.join('?');
    if (/INSERT INTO media/.test(query)) stored = { id: values[0], mime: values[1], data: values[2] };
    if (/SELECT mime, data FROM media/.test(query)) return stored?.id === values[0] ? [stored] : [];
    return [];
  };
  const upload = createMediaUploadHandler(() => sql);
  const read = createMediaReadHandler(() => sql, { DATABASE_URL: 'postgres://fake/test' });
  const body = { mime: 'image/png', data: png.toString('base64') };
  const invoke = async (headers, payload = body) => { const res = response(); await upload({ method: 'POST', headers, body: payload }, res); return res; };
  assert.equal((await invoke({ 'content-type': 'application/json' })).code, 401);
  assert.equal((await invoke({ cookie, 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await invoke({ cookie, 'content-type': 'text/plain' })).code, 415);
  assert.equal((await invoke({ cookie, 'content-type': 'application/json' }, { mime: 'image/png', data: Buffer.from('<svg>').toString('base64') })).code, 400);
  const saved = await invoke({ cookie, 'content-type': 'application/json' });
  assert.equal(saved.code, 201);
  const id = saved.data.url.split('/').at(-1);
  const res = response(); await read({ method: 'GET', query: { id } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.headers['Content-Type'], 'image/png');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.deepEqual(res.data, png);
  stored.mime = 'image/svg+xml';
  const invalid = response(); await read({ method: 'GET', query: { id } }, invalid);
  assert.equal(invalid.code, 404);
});
