import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createForumAuthHandler } from '../api/forum-auth.js';
import { createForumHandler } from '../api/forum.js';
import { hashForumToken } from '../api/_forum-auth.js';
import { AVATAR_MAX_BYTES, avatarUrl, validateProfile } from '../api/_forum-profile.js';
import { renderForumThread } from '../api/_forum-page.js';
import { LANGUAGES, UI } from '../forum/forum-core.js';

process.env.SESSION_SECRET = 'profile-session-secret-for-tests';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';
const aliceId = '12345678-1234-4123-8123-123456789abc';
const bobId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tokens = { Ada: 'a'.repeat(64), Bora: 'b'.repeat(64) };
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0xff, 0xd9]).toString('base64');

function harness() {
  const users = [
    { id: aliceId, username: 'Ada', username_key: 'ada', profile_note: '', avatar_data: '', avatar_present: false, avatar_version: 0 },
    { id: bobId, username: 'Bora', username_key: 'bora', profile_note: '', avatar_data: '', avatar_present: false, avatar_version: 0 }
  ];
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?'); queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/FROM forum_sessions/.test(text)) {
      const name = Object.keys(tokens).find(key => hashForumToken(tokens[key]) === values[0]);
      return users.filter(user => user.username === name).map(user => ({ ...user, avatar_data: undefined }));
    }
    if (/INSERT INTO forum_limits/.test(text)) return [{ key: 'allowed' }];
    if (/UPDATE forum_users SET profile_note/.test(text)) {
      const [note, changed, data, , present, , id] = values;
      const user = users.find(row => row.id === id);
      if (!user) return [];
      user.profile_note = note;
      if (changed) { user.avatar_data = data; user.avatar_present = present; user.avatar_version++; }
      return [{ username: user.username, profile_note: user.profile_note, avatar_present: user.avatar_present, avatar_version: user.avatar_version }];
    }
    if (/SELECT avatar_data FROM forum_users/.test(text)) {
      return users.filter(user => user.username_key === values[0] && user.avatar_version === values[1] && user.avatar_present).map(user => ({ avatar_data: user.avatar_data }));
    }
    return [];
  };
  return { users, queries, handler: createForumAuthHandler(() => sql) };
}
async function request(handler, { method = 'POST', body = {}, query = {}, token = '', headers = {} } = {}) {
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, send(data) { this.data = data; return this; } };
  await handler({ method, body, query, headers: { 'content-type': 'application/json', ...(token ? { cookie: `testotavan_forum=${token}` } : {}), ...headers } }, res);
  return res;
}

test('profil notu ve JPEG güvenli boyut ve biçimde doğrulanır', () => {
  assert.deepEqual(validateProfile({ note: 'Merhaba', avatar: jpeg }), { note: 'Merhaba', avatar: jpeg });
  assert.equal(validateProfile({ note: '', avatar: '' }).avatar, '');
  assert.equal(validateProfile({ note: '' }).avatar, null);
  for (const invalid of [
    { note: 'x'.repeat(161) }, { note: 'abc\nxyz' }, { note: {} }, { note: '', avatar: 'javascript:alert(1)' },
    { note: '', avatar: Buffer.from('not jpeg').toString('base64') }, { note: '', avatar: 'A'.repeat(AVATAR_MAX_BYTES * 2) }
  ]) assert.throws(() => validateProfile(invalid));
  assert.equal(avatarUrl('Ada', true, 2), '/api/forum-auth?avatar=Ada&v=2');
  assert.equal(avatarUrl('Ada', true, -1), '');
});

test('oturum sahibi yalnızca kendi profilini günceller, resmi değiştirebilir veya kaldırabilir', async () => {
  const h = harness();
  assert.equal((await request(h.handler, { body: { action: 'profile', note: 'Test' } })).code, 401);
  assert.equal((await request(h.handler, { token: tokens.Ada, body: { action: 'profile', note: 'Test' }, headers: { 'sec-fetch-site': 'cross-site' } })).code, 403);
  const saved = await request(h.handler, { token: tokens.Ada, body: { action: 'profile', note: '  Spor ve uyku  ', avatar: jpeg, id: bobId } });
  assert.equal(saved.code, 200);
  assert.deepEqual(saved.data.user, { username: 'Ada', profile_note: 'Spor ve uyku', avatar_url: '/api/forum-auth?avatar=Ada&v=1' });
  assert.equal(h.users[1].profile_note, '', 'istekteki sahte id başka hesabı değiştirmemeli');
  assert.equal('id' in saved.data.user, false);
  assert.equal('avatar_data' in saved.data.user, false);

  const session = await request(h.handler, { method: 'GET', token: tokens.Ada });
  assert.equal(session.data.user.profile_note, 'Spor ve uyku');
  const avatar = await request(h.handler, { method: 'GET', query: { avatar: 'Ada', v: '1' } });
  assert.equal(avatar.code, 200);
  assert.equal(avatar.headers['Content-Type'], 'image/jpeg');
  assert.equal(avatar.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(avatar.headers['Cache-Control'], 'no-store');
  assert.deepEqual(avatar.data, Buffer.from(jpeg, 'base64'));
  assert.equal((await request(h.handler, { method: 'GET', query: { avatar: 'Ada', v: '2' } })).code, 404);

  const noteOnly = await request(h.handler, { token: tokens.Ada, body: { action: 'profile', note: 'Yeni not' } });
  assert.equal(noteOnly.data.user.avatar_url, '/api/forum-auth?avatar=Ada&v=1');
  const removed = await request(h.handler, { token: tokens.Ada, body: { action: 'profile', note: '', avatar: '' } });
  assert.equal(removed.data.user.avatar_url, '');
  assert.equal((await request(h.handler, { method: 'GET', query: { avatar: 'Ada', v: '1' } })).code, 404);
  assert.equal(h.users[0].avatar_data, '');
});

test('geçersiz profil içeriği kayıt yapılmadan reddedilir', async () => {
  const h = harness();
  for (const body of [{ action: 'profile', note: 'x'.repeat(161) }, { action: 'profile', note: '', avatar: 'not-base64' }]) {
    assert.equal((await request(h.handler, { token: tokens.Ada, body })).code, 400);
  }
  assert.equal(h.queries.some(query => /UPDATE forum_users SET profile_note/.test(query.text)), false);
});

test('forum detay API profilleri yalnızca kullanıcı kimliğinden birleştirir ve kimliği gizler', async () => {
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?'); queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/FROM forum_threads t LEFT JOIN forum_users/.test(text)) return [{ id: aliceId, author: 'Ada', user_id: aliceId, approved: true, profile_note: 'Merhaba', avatar_present: true, avatar_version: 2 }];
    if (/FROM forum_replies r LEFT JOIN forum_users/.test(text)) return [{ id: bobId, author: 'Bora', user_id: bobId, profile_note: 'Bora notu', avatar_present: false, avatar_version: 0 }];
    return [];
  };
  const res = await request(createForumHandler(() => sql), { method: 'GET', query: { id: aliceId } });
  assert.equal(res.code, 200);
  assert.equal(res.data.thread.profile_note, 'Merhaba');
  assert.equal(res.data.thread.avatar_url, '/api/forum-auth?avatar=Ada&v=2');
  assert.equal(res.data.replies[0].profile_note, 'Bora notu');
  assert.equal('user_id' in res.data.thread, false);
  assert.equal('avatar_version' in res.data.thread, false);
  assert.ok(queries.some(q => /u.id=t.user_id/.test(q.text)));
  assert.ok(queries.some(q => /u.id=r.user_id/.test(q.text)));
});

test('kalıcı sayfada profil notları kaçırılır, resim yoksa baş harfler korunur', () => {
  const thread = { id: aliceId, title: 'Örnek konu', author: 'Ada', body: 'Mesaj', category: 'Genel', profile_note: '<script>x</script>', avatar_present: true, avatar_version: 3, created_at: '2026-10-01T00:00:00Z' };
  const reply = { id: bobId, author: 'Bora', body: 'Yanıt', profile_note: 'Selam', created_at: thread.created_at };
  const html = renderForumThread({ thread, replies: [reply], env: {} });
  assert.match(html, /avatar=Ada&amp;v=3/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>x<\/script>/);
  assert.match(html, /profile-avatar" aria-hidden="true">BO<\/span>/);
  assert.match(html, /Selam/);
});

test('profil paneli ve tüm dil sözlükleri kullanıcıya açık alanları belirtir', () => {
  const html = fs.readFileSync(new URL('../forum/index.html', import.meta.url), 'utf8');
  const script = fs.readFileSync(new URL('../forum/forum.js', import.meta.url), 'utf8');
  for (const id of ['show-profile', 'profile-panel', 'profile-form', 'profile-note', 'profile-photo', 'profile-remove']) assert.ok(html.includes(`id="${id}"`));
  assert.match(script, /ctx\.drawImage/);
  assert.match(script, /toDataURL\('image\/jpeg'/);
  assert.match(script, /esc\(item\.profile_note\)/);
  for (const lang of LANGUAGES) assert.ok(UI[lang].profileHelp && UI[lang].profileSave);
});
