import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createForumAuthHandler } from '../api/forum-auth.js';
import {
  FORUM_OAUTH_COOKIE,
  appendAuthParam,
  hashPassword,
  resetForumAuthLimits,
  resolveGoogleRedirectUri,
  sanitizeReturnTo,
  suggestGoogleUsername,
  validateLogin,
  validatePassword,
  validateRegistration,
  validateUsername,
  verifyPassword
} from '../api/_forum-auth.js';

process.env.SESSION_SECRET = 'forum-auth-test-secret';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

function authHarness(extraOptions = {}) {
  const state = { users: [], sessions: [] };
  const handler = createForumAuthHandler(() => async (strings, ...values) => {
    const text = strings.join('?');
    if (/^(CREATE|ALTER)/.test(text) || text.includes('DELETE FROM forum_sessions WHERE expires')) return [];
    if (text.includes('FROM forum_users WHERE google_sub')) {
      return state.users.filter(user => user.google_sub === values[0]).map(user => ({ ...user }));
    }
    if (text.includes('FROM forum_users WHERE username_key')) {
      return state.users.filter(user => user.username_key === values[0]).map(user => ({ ...user }));
    }
    if (text.includes('INSERT INTO forum_users')) {
      const [id, username, usernameKey, passwordHash, googleSub = null, googleEmail = null] = values;
      if (state.users.some(user => user.username_key === usernameKey)) {
        throw new Error('duplicate key value violates unique constraint');
      }
      if (googleSub && state.users.some(user => user.google_sub === googleSub)) {
        throw new Error('duplicate key value violates unique constraint "forum_users_google_sub"');
      }
      state.users.push({
        id,
        username,
        username_key: usernameKey,
        password_hash: passwordHash,
        google_sub: googleSub,
        google_email: googleEmail
      });
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
  }, extraOptions);
  return { state, handler };
}

async function call(handler, method, body, headers = {}, ip = '203.0.113.20', query = {}) {
  const req = {
    method,
    query,
    body,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
    socket: {}
  };
  const res = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(payload) { this.body = payload; return this; },
    json(data) { this.data = data; return this; }
  };
  await handler(req, res);
  return res;
}

function cookieToken(setCookie = '') {
  const text = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
  return text.match(/testotavan_forum=([a-f0-9]{64})/i)?.[1] || '';
}

function cookiePair(setCookie = '', name = FORUM_OAUTH_COOKIE) {
  const text = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
  const match = text.match(new RegExp(`${name}=([^;]+)`));
  return match ? `${name}=${match[1]}` : '';
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

test('Google OAuth signs up new member, preserves thread hash, avoids hijacking existing username, and logs back in', async () => {
  resetForumAuthLimits();
  const oauthEnv = {
    DATABASE_URL: 'postgresql://test.invalid/test',
    SESSION_SECRET: 'forum-auth-test-secret',
    SITE_URL: 'https://testotavan.com',
    GOOGLE_CLIENT_ID: '123456.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'GOCSPX-test-secret'
  };
  let googleProfile = {
    sub: 'google-sub-1001',
    email: 'ada.google@example.com',
    email_verified: true,
    name: 'Ada'
  };
  const fetchCalls = [];
  const mockFetch = async (url, init = {}) => {
    fetchCalls.push({ url: String(url), init });
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return { ok: true, async json() { return { access_token: 'ya29.mock-token' }; } };
    }
    return { ok: true, async json() { return googleProfile; } };
  };

  const { state, handler } = authHarness({ env: oauthEnv, fetch: mockFetch });

  // Önceden parolalı bir "Ada" hesabı oluştur: Google ile gelen "Ada" bu hesabı ele geçirmemeli!
  await call(handler, 'POST', {
    action: 'register',
    username: 'Ada',
    password: 'sifre123',
    passwordConfirm: 'sifre123'
  }, {}, '203.0.113.50');

  // 1) Google OAuth başlatma: PKCE S256 ve imzalı state çerezi ile yönlendirir
  const threadReturn = '/forum/?lang=en#thread=12345678-1234-4123-8123-123456789abc';
  const start = await call(handler, 'GET', null, {}, '203.0.113.51', {
    provider: 'google',
    mode: 'register',
    returnTo: threadReturn
  });
  assert.equal(start.code, 302);
  const authUrl = new URL(start.headers.Location);
  assert.equal(authUrl.origin, 'https://accounts.google.com');
  assert.equal(authUrl.searchParams.get('client_id'), oauthEnv.GOOGLE_CLIENT_ID);
  assert.equal(authUrl.searchParams.get('redirect_uri'), 'https://testotavan.com/api/forum-auth');
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(authUrl.searchParams.get('code_challenge'));
  const oauthState = authUrl.searchParams.get('state');
  const stateCookie = cookiePair(start.headers['Set-Cookie']);
  assert.ok(oauthState && stateCookie);

  // 2) İlk Google geri dönüşü: çakışmayan "Ada_2" hesabını açar ve oturum çerezi verir
  const callback = await call(handler, 'GET', null, { cookie: stateCookie }, '203.0.113.51', {
    code: 'auth-code-xyz',
    state: oauthState
  });
  assert.equal(callback.code, 302);
  assert.equal(callback.headers.Location, '/forum/?lang=en&auth=registered#thread=12345678-1234-4123-8123-123456789abc');
  const sessionToken = cookieToken(callback.headers['Set-Cookie']);
  assert.equal(sessionToken.length, 64);
  assert.equal(state.users.length, 2);
  assert.equal(state.users[1].username, 'Ada_2');
  assert.equal(state.users[1].google_sub, 'google-sub-1001');
  assert.ok(fetchCalls[0].init.body.includes('code_verifier='));

  // Google ile açılan hesaba rastgele şifreyle giriş yapılamaz
  const passwordAttempt = await call(handler, 'POST', {
    action: 'login',
    username: 'Ada_2',
    password: 'oauth$google1'
  }, {}, '203.0.113.52');
  assert.equal(passwordAttempt.code, 401);

  // Oturum kontrolü Google hesabını döndürür
  const me = await call(handler, 'GET', null, { cookie: `testotavan_forum=${sessionToken}` }, '203.0.113.52');
  assert.equal(me.code, 200);
  assert.deepEqual(me.data, { user: { username: 'Ada_2' }, googleEnabled: true });

  // 3) Aynı Google hesabıyla tekrar giriş: yeni kayıt açmadan "Ada_2" oturumu başlatır
  const secondStart = await call(handler, 'GET', null, {}, '203.0.113.53', { provider: 'google', returnTo: '/forum/' });
  const secondState = new URL(secondStart.headers.Location).searchParams.get('state');
  const secondCallback = await call(
    handler,
    'GET',
    null,
    { cookie: cookiePair(secondStart.headers['Set-Cookie']) },
    '203.0.113.53',
    { code: 'auth-code-2', state: secondState }
  );
  assert.equal(secondCallback.code, 302);
  assert.equal(secondCallback.headers.Location, '/forum/?auth=google');
  assert.equal(state.users.length, 2);
});

test('Google OAuth guards against open redirects, tampered state, cancellation, unverified email, and missing config', async () => {
  resetForumAuthLimits();
  assert.equal(sanitizeReturnTo('https://evil.example/steal'), '/forum/');
  assert.equal(sanitizeReturnTo('//evil.example/steal'), '/forum/');
  assert.equal(sanitizeReturnTo('/admin/'), '/forum/');
  assert.equal(sanitizeReturnTo('/forum/?lang=de#thread=abc'), '/forum/?lang=de#thread=abc');
  assert.equal(appendAuthParam('/forum/?lang=de#thread=abc', 'auth_error', 'cancelled'), '/forum/?lang=de&auth_error=cancelled#thread=abc');
  assert.equal(resolveGoogleRedirectUri({ headers: { 'x-forwarded-host': 'testosteron-test.vercel.app' } }, { SITE_URL: 'https://other.vercel.app' }), 'https://testosteron-test.vercel.app/api/forum-auth');
  assert.equal(resolveGoogleRedirectUri({ headers: { host: 'localhost:3000' } }, {}), 'http://localhost:3000/api/forum-auth');
  assert.equal(suggestGoogleUsername({ name: 'admin', email: 'kerem.yilmaz@gmail.com' }), 'kerem_yilmaz');

  // Yapılandırılmamış ortamda JSON hatası basmak yerine foruma güvenli uyarı ile döner
  const unconfigured = authHarness({
    env: { DATABASE_URL: 'postgresql://test.invalid/test', SESSION_SECRET: 'forum-auth-test-secret' }
  });
  const missingRes = await call(unconfigured.handler, 'GET', null, {}, '203.0.113.60', {
    provider: 'google',
    returnTo: 'https://evil.example/phish'
  });
  assert.equal(missingRes.code, 302);
  assert.equal(missingRes.headers.Location, '/forum/?auth_error=not_configured');

  const oauthEnv = {
    DATABASE_URL: 'postgresql://test.invalid/test',
    SESSION_SECRET: 'forum-auth-test-secret',
    SITE_URL: 'https://testotavan.com',
    GOOGLE_CLIENT_ID: '123456.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'GOCSPX-test-secret'
  };
  const unverifiedHarness = authHarness({
    env: oauthEnv,
    fetch: async url => String(url).includes('token')
      ? { ok: true, async json() { return { access_token: 'tok' }; } }
      : { ok: true, async json() { return { sub: 'sub-9', email: 'x@example.com', email_verified: false }; } }
  });

  // Geçersiz CSRF state reddedilir
  const badState = await call(unverifiedHarness.handler, 'GET', null, {}, '203.0.113.61', {
    code: 'abc',
    state: 'forged-state'
  });
  assert.equal(badState.code, 302);
  assert.equal(badState.headers.Location, '/forum/?auth_error=invalid_state');

  // Kullanıcı iptali (access_denied) düzgün yönlendirilir
  const start = await call(unverifiedHarness.handler, 'GET', null, {}, '203.0.113.62', { provider: 'google' });
  const validState = new URL(start.headers.Location).searchParams.get('state');
  const validCookie = cookiePair(start.headers['Set-Cookie']);
  const cancelled = await call(unverifiedHarness.handler, 'GET', null, { cookie: validCookie }, '203.0.113.62', {
    error: 'access_denied',
    state: validState
  });
  assert.equal(cancelled.code, 302);
  assert.equal(cancelled.headers.Location, '/forum/?auth_error=cancelled');

  // Doğrulanmamış Google e-postası reddedilir
  const unverified = await call(unverifiedHarness.handler, 'GET', null, { cookie: validCookie }, '203.0.113.63', {
    code: 'code-unverified',
    state: validState
  });
  assert.equal(unverified.code, 302);
  assert.equal(unverified.headers.Location, '/forum/?auth_error=unverified_email');
});

test('forum page renders Google sign-in / sign-up buttons across header, gates, and auth panel', () => {
  const html = fs.readFileSync(new URL('../forum/index.html', import.meta.url), 'utf8');
  for (const id of ['header-google', 'gate-google', 'reply-google', 'auth-google', 'auth-google-label']) {
    assert.ok(html.includes(`id="${id}"`), `${id} forum sayfasında bulunamadı`);
  }
  assert.match(html, /Google ile giriş yap/);
  assert.match(html, /Google ile devam et/);
});
