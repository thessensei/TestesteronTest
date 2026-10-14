import test from 'node:test';
import assert from 'node:assert/strict';
import { createForumAuthHandler } from '../api/forum-auth.js';
import {
  hashPassword,
  resetForumAuthLimits,
  validateLogin,
  validatePassword,
  validateRegistration,
  validateUsername,
  verifyPassword
} from '../api/_forum-auth.js';

process.env.SESSION_SECRET = 'forum-auth-test-secret';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

function authHarness() {
  const state = { users: [], sessions: [] };
  const handler = createForumAuthHandler(() => async (strings, ...values) => {
    const text = strings.join('?');
    if (/^(CREATE|ALTER)/.test(text) || text.includes('DELETE FROM forum_sessions WHERE expires')) return [];
    if (text.includes('FROM forum_users WHERE username_key')) {
      return state.users.filter(user => user.username_key === values[0]).map(user => ({ ...user }));
    }
    if (text.includes('INSERT INTO forum_users')) {
      const [id, username, usernameKey, passwordHash] = values;
      if (state.users.some(user => user.username_key === usernameKey)) {
        throw new Error('duplicate key value violates unique constraint');
      }
      state.users.push({ id, username, username_key: usernameKey, password_hash: passwordHash });
      return [];
    }
    if (text.includes('INSERT INTO forum_sessions')) {
      state.sessions.push({ token_hash: values[0], user_id: values[1] });
      return [];
    }
    if (text.includes('DELETE FROM forum_sessions WHERE token_hash')) {
      state.sessions = state.sessions.filter(session => session.token_hash !== values[0]);
      return [];
    }
    if (text.includes('FROM forum_sessions')) {
      const session = state.sessions.find(item => item.token_hash === values[0]);
      const user = session && state.users.find(item => item.id === session.user_id);
      return user ? [{ id: user.id, username: user.username }] : [];
    }
    return [];
  });
  return { state, handler };
}

async function call(handler, method, body, headers = {}, ip = '203.0.113.20') {
  const req = {
    method,
    body,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
    socket: {}
  };
  const res = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
  await handler(req, res);
  return res;
}

function cookieToken(setCookie = '') {
  return setCookie.match(/testotavan_forum=([a-f0-9]{64})/i)?.[1] || '';
}

test('forum passwords are hashed and credentials are validated', () => {
  const hash = hashPassword('sifre123');
  assert.notEqual(hash, 'sifre123');
  assert.equal(verifyPassword('sifre123', hash), true);
  assert.equal(verifyPassword('sifre124', hash), false);
  assert.equal(validateUsername('Ada_1').usernameKey, 'ada_1');
  assert.throws(() => validateUsername('admin'));
  assert.throws(() => validateUsername('ab'));
  assert.throws(() => validatePassword('kisa', 'Ada'));
  assert.throws(() => validatePassword('sifresizharf', 'Ada'));
  assert.throws(() => validateRegistration({ username: 'Ada', password: 'Ada12345', passwordConfirm: 'baska123' }));
  assert.equal(validateLogin({ username: 'Ada', password: 'sifre123' }).username, 'Ada');
});

test('register, login, session and logout stay on the account', async () => {
  resetForumAuthLimits();
  const { state, handler } = authHarness();
  const registered = await call(handler, 'POST', {
    action: 'register',
    username: 'Ada',
    password: 'sifre123',
    passwordConfirm: 'sifre123'
  }, {}, '203.0.113.31');
  assert.equal(registered.code, 201);
  assert.equal(registered.data.user.username, 'Ada');
  assert.match(registered.headers['Set-Cookie'], /^testotavan_forum=[a-f0-9]{64}/);
  assert.notEqual(state.users[0].password_hash, 'sifre123');
  assert.equal(verifyPassword('sifre123', state.users[0].password_hash), true);

  const duplicate = await call(handler, 'POST', {
    action: 'register',
    username: 'ada',
    password: 'baska123',
    passwordConfirm: 'baska123'
  }, {}, '203.0.113.32');
  assert.equal(duplicate.code, 409);

  const wrong = await call(handler, 'POST', { action: 'login', username: 'Ada', password: 'yanlis12' }, {}, '203.0.113.33');
  assert.equal(wrong.code, 401);
  assert.match(wrong.data.error, /hatalı/);

  const loggedIn = await call(handler, 'POST', { action: 'login', username: 'Ada', password: 'sifre123' }, {}, '203.0.113.33');
  assert.equal(loggedIn.code, 200);
  const token = cookieToken(loggedIn.headers['Set-Cookie']);
  assert.equal(token.length, 64);

  const me = await call(handler, 'GET', null, { cookie: `testotavan_forum=${token}` }, '203.0.113.34');
  assert.equal(me.code, 200);
  assert.deepEqual(me.data.user, { username: 'Ada' });

  const loggedOut = await call(handler, 'POST', { action: 'logout' }, { cookie: `testotavan_forum=${token}` }, '203.0.113.34');
  assert.equal(loggedOut.code, 200);
  assert.match(loggedOut.headers['Set-Cookie'], /Max-Age=0/);
  const after = await call(handler, 'GET', null, { cookie: `testotavan_forum=${token}` }, '203.0.113.35');
  assert.equal(after.data.user, null);
});

test('forum auth rejects cross-site writes and weak passwords', async () => {
  resetForumAuthLimits();
  const { handler } = authHarness();
  assert.equal((await call(handler, 'POST', { action: 'login' }, { 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await call(handler, 'POST', { action: 'register', username: 'ab', password: 'x' }, { 'content-type': 'text/plain' })).code, 415);
  const weak = await call(handler, 'POST', { action: 'register', username: 'Ada', password: 'kisa' }, {}, '203.0.113.40');
  assert.equal(weak.code, 400);
  assert.equal((await call(handler, 'PUT', {})).code, 405);
});
