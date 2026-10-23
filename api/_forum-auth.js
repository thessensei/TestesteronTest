import crypto from 'node:crypto';
import { resolveSiteUrl } from './_seo.js';

export const FORUM_COOKIE = 'testotavan_forum';
export const FORUM_OAUTH_COOKIE = 'testotavan_forum_oauth';
export const FORUM_SESSION_DAYS = 14;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_PASSWORD_PLACEHOLDER = 'oauth$google';

const RESERVED = new Set(['admin', 'administrator', 'moderator', 'mod', 'testotavan', 'sistem', 'system', 'root', 'support', 'destek']);
const loginAttempts = new Map();
const registerAttempts = new Map();
const oauthAttempts = new Map();

function secret(env = process.env) {
  return env.SESSION_SECRET || '';
}

export function resetForumAuthLimits() {
  loginAttempts.clear();
  registerAttempts.clear();
  oauthAttempts.clear();
}

export function readCookie(req, name) {
  const header = req?.headers?.cookie || '';
  const found = header.split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? [part.trim(), ''] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).find(([key]) => key === name);
  return found ? decodeURIComponent(found[1]) : '';
}

export function forumSessionCookie(token) {
  const maxAge = FORUM_SESSION_DAYS * 24 * 60 * 60;
  return `${FORUM_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearForumCookie() {
  return `${FORUM_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function oauthStateCookie(value) {
  const maxAge = Math.floor(OAUTH_STATE_TTL_MS / 1000);
  return `${FORUM_OAUTH_COOKIE}=${encodeURIComponent(value)}; Path=/api/forum-auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearOAuthStateCookie() {
  return `${FORUM_OAUTH_COOKIE}=; Path=/api/forum-auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function hashForumToken(token) {
  return crypto.createHmac('sha256', secret()).update(`forum.${token}`).digest('hex');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$16384$8$1$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, salt, expectedHex] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!salt || !/^[0-9a-f]+$/i.test(expectedHex) || !Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  let actual;
  try {
    actual = crypto.scryptSync(String(password), salt, expectedHex.length / 2, { N: n, r, p });
  } catch {
    return false;
  }
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

const DUMMY_HASH = hashPassword('not-a-real-forum-password');

export function verifyPasswordOrDummy(password, stored) {
  const scryptStored = typeof stored === 'string' && stored.startsWith('scrypt$');
  return verifyPassword(password, scryptStored ? stored : DUMMY_HASH) && scryptStored;
}

export function validateUsername(raw) {
  const username = String(raw ?? '').trim().normalize('NFKC');
  if (!/^[\p{L}\p{N}_]{3,20}$/u.test(username)) {
    throw new Error('Kullanıcı adı 3–20 karakter olmalı; harf, rakam ve alt çizgi kullanılabilir.');
  }
  const usernameKey = username.toLocaleLowerCase('tr');
  if (RESERVED.has(usernameKey)) throw new Error('Bu kullanıcı adı kullanılamaz.');
  return { username, usernameKey };
}

export function validatePassword(password, username = '') {
  const value = String(password ?? '');
  if (value.length < 8 || value.length > 128) throw new Error('Şifre 8–128 karakter olmalı.');
  if (!/\p{L}/u.test(value) || !/\p{N}/u.test(value)) throw new Error('Şifre en az bir harf ve bir rakam içermeli.');
  if (username && value.toLocaleLowerCase('tr') === String(username).toLocaleLowerCase('tr')) {
    throw new Error('Şifre kullanıcı adıyla aynı olamaz.');
  }
  return value;
}

export function validateRegistration(input = {}) {
  if (input.website) throw new Error('Kayıt tamamlanamadı.');
  const { username, usernameKey } = validateUsername(input.username);
  const password = validatePassword(input.password, username);
  if (input.passwordConfirm != null && input.passwordConfirm !== input.password) {
    throw new Error('Şifreler eşleşmiyor.');
  }
  return { username, usernameKey, password };
}

export function validateLogin(input = {}) {
  const { username, usernameKey } = validateUsername(input.username);
  const password = String(input.password ?? '');
  if (!password || password.length > 128) throw new Error('Kullanıcı adı veya şifre hatalı.');
  return { username, usernameKey, password };
}

function clientIp(req) {
  return req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function hitLimit(store, key, windowMs, max) {
  const now = Date.now();
  const recent = (store.get(key) || []).filter(time => now - time < windowMs);
  if (recent.length >= max) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  return true;
}

export function noteLoginFailure(req) {
  hitLimit(loginAttempts, clientIp(req), 15 * 60 * 1000, 10);
}

export function loginAllowed(req) {
  const now = Date.now();
  const key = clientIp(req);
  const recent = (loginAttempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000);
  loginAttempts.set(key, recent);
  return recent.length < 10;
}

export function clearLoginFailures(req) {
  loginAttempts.delete(clientIp(req));
}

export function registerAllowed(req) {
  return hitLimit(registerAttempts, clientIp(req), 60 * 60 * 1000, 8);
}

export function oauthAllowed(req) {
  return hitLimit(oauthAttempts, clientIp(req), 15 * 60 * 1000, 20);
}

export function readForumToken(req) {
  const token = readCookie(req, FORUM_COOKIE);
  return /^[a-f0-9]{64}$/i.test(token) ? token : '';
}

/* ---------- Google OAuth 2.0 + PKCE (S256) ---------- */

export function isGoogleAuthConfigured(env = process.env) {
  return Boolean(
    typeof env.GOOGLE_CLIENT_ID === 'string' && env.GOOGLE_CLIENT_ID.trim()
    && typeof env.GOOGLE_CLIENT_SECRET === 'string' && env.GOOGLE_CLIENT_SECRET.trim()
  );
}

/** Yalnızca aynı site içindeki /forum/ yollarına izin verir (Open Redirect engeli). */
export function sanitizeReturnTo(raw) {
  const value = String(raw ?? '').trim();
  if (!value || value.length > 240 || /[\r\n\\]/.test(value) || value.startsWith('//')) return '/forum/';
  try {
    const parsed = new URL(value, 'https://forum.local');
    if (parsed.origin !== 'https://forum.local') return '/forum/';
    if (parsed.pathname !== '/forum' && !parsed.pathname.startsWith('/forum/')) return '/forum/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/forum/';
  }
}

/** Hedef URL'ye (#thread=... çapasını bozmadan) sorgu parametresi ekler. */
export function appendAuthParam(returnTo, key, value) {
  const safe = sanitizeReturnTo(returnTo);
  const parsed = new URL(safe, 'https://forum.local');
  parsed.searchParams.set(key, value);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function resolveGoogleRedirectUri(req, env = process.env) {
  const explicit = String(env.GOOGLE_REDIRECT_URI || '').trim();
  if (explicit) {
    const parsed = new URL(explicit);
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLocal)) {
      return parsed.toString();
    }
  }
  const rawHost = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim();
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(rawHost)) {
    return `http://${rawHost}/api/forum-auth`;
  }
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d{1,5})?$/i.test(rawHost)) {
    return `https://${rawHost}/api/forum-auth`;
  }
  return `${resolveSiteUrl(req?.headers || {}, env)}/api/forum-auth`;
}

export function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createGoogleAuthStart({ req, env = process.env, returnTo = '/forum/' }) {
  const state = crypto.randomBytes(24).toString('hex');
  const { verifier, challenge } = createPkcePair();
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const redirectUri = resolveGoogleRedirectUri(req, env);
  const payload = Buffer.from(JSON.stringify({
    state,
    verifier,
    returnTo: safeReturnTo,
    exp: Date.now() + OAUTH_STATE_TTL_MS
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret(env)).update(`forum-oauth.${payload}`).digest('base64url');
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID.trim(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account'
  });
  return {
    authorizeUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    cookie: oauthStateCookie(`${payload}.${sig}`)
  };
}

export function verifyGoogleAuthState(req, stateParam, env = process.env) {
  const rawCookie = readCookie(req, FORUM_OAUTH_COOKIE);
  const [payload, sig, extra] = String(rawCookie || '').split('.');
  if (!payload || !sig || extra || !stateParam || !secret(env)) return null;
  const expectedSig = crypto.createHmac('sha256', secret(env)).update(`forum-oauth.${payload}`).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.state !== 'string' || typeof parsed.verifier !== 'string') return null;
  if (!Number.isFinite(parsed.exp) || parsed.exp < Date.now()) return null;
  const stateBuf = Buffer.from(String(stateParam));
  const savedStateBuf = Buffer.from(parsed.state);
  if (stateBuf.length !== savedStateBuf.length || !crypto.timingSafeEqual(stateBuf, savedStateBuf)) return null;
  return {
    verifier: parsed.verifier,
    returnTo: sanitizeReturnTo(parsed.returnTo)
  };
}

export async function exchangeGoogleCode({ code, codeVerifier, req, env = process.env, fetchImpl = globalThis.fetch }) {
  const redirectUri = resolveGoogleRedirectUri(req, env);
  const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code: String(code),
      client_id: env.GOOGLE_CLIENT_ID.trim(),
      client_secret: env.GOOGLE_CLIENT_SECRET.trim(),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    }).toString(),
    signal: AbortSignal.timeout(10000)
  });
  if (!tokenRes.ok) throw new Error('Google token değişimi başarısız.');
  const tokenData = await tokenRes.json();
  if (!tokenData?.access_token) throw new Error('Google erişim anahtarı alınamadı.');

  const userRes = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  if (!userRes.ok) throw new Error('Google kullanıcı bilgisi alınamadı.');
  const profile = await userRes.json();
  const sub = String(profile?.sub || '').trim();
  if (!sub || sub.length > 128) throw new Error('Geçersiz Google hesap kimliği.');
  const email = String(profile?.email || '').trim().toLowerCase();
  if (!email || profile?.email_verified !== true) {
    const err = new Error('Google e-posta adresi doğrulanmamış.');
    err.code = 'UNVERIFIED_EMAIL';
    throw err;
  }
  return {
    sub,
    email,
    name: String(profile?.name || profile?.given_name || '').trim()
  };
}

/** Google profil adından veya e-posta ön ekinden kurallara uygun aday kullanıcı adı üretir. */
export function suggestGoogleUsername(profile = {}) {
  const clean = raw => String(raw ?? '')
    .normalize('NFKC')
    .replace(/[\s.-]+/g, '_')
    .replace(/[^\p{L}\p{N}_]/gu, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);

  const candidates = [
    clean(profile.name),
    clean(String(profile.email || '').split('@')[0])
  ];
  for (const candidate of candidates) {
    if (candidate.length >= 3 && !RESERVED.has(candidate.toLocaleLowerCase('tr'))) {
      return candidate;
    }
  }
  return `uye_${crypto.randomInt(1000, 9999)}`;
}

export async function findOrCreateGoogleForumUser(sql, profile) {
  const existingGoogle = await sql`SELECT id, username FROM forum_users WHERE google_sub = ${profile.sub}`;
  if (existingGoogle.length) {
    return { user: existingGoogle[0], created: false };
  }

  const base = suggestGoogleUsername(profile);
  for (let attempt = 0; attempt < 12; attempt++) {
    const suffix = attempt === 0 ? '' : attempt < 8 ? `_${attempt + 1}` : `_${crypto.randomInt(1000, 9999)}`;
    const maxBase = 20 - suffix.length;
    const trimmedBase = base.slice(0, Math.max(3, maxBase)).replace(/_+$/g, '');
    const candidate = `${trimmedBase.length >= 3 ? trimmedBase : 'uye'}${suffix}`.slice(0, 20);
    let validated;
    try {
      validated = validateUsername(candidate);
    } catch {
      continue;
    }
    const clash = await sql`SELECT id FROM forum_users WHERE username_key = ${validated.usernameKey}`;
    if (clash.length) continue;

    const id = crypto.randomUUID();
    try {
      await sql`INSERT INTO forum_users (id, username, username_key, password_hash, google_sub, google_email) VALUES (${id}, ${validated.username}, ${validated.usernameKey}, ${OAUTH_PASSWORD_PLACEHOLDER}, ${profile.sub}, ${profile.email})`;
      return { user: { id, username: validated.username }, created: true };
    } catch (error) {
      if (/google_sub/i.test(String(error?.message || error))) {
        const raceUser = await sql`SELECT id, username FROM forum_users WHERE google_sub = ${profile.sub}`;
        if (raceUser.length) return { user: raceUser[0], created: false };
      }
      if (/unique|duplicate/i.test(String(error?.message || error))) continue;
      throw error;
    }
  }
  throw new Error('Uygun kullanıcı adı oluşturulamadı.');
}

/* ---------- Veritabanı şeması ve oturum ---------- */

export async function prepareForumAuth(sql) {
  await sql`CREATE TABLE IF NOT EXISTS forum_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE forum_users ADD COLUMN IF NOT EXISTS google_sub TEXT`;
  await sql`ALTER TABLE forum_users ADD COLUMN IF NOT EXISTS google_email TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS forum_users_google_sub ON forum_users(google_sub) WHERE google_sub IS NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS forum_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS forum_sessions_user ON forum_sessions(user_id)`;
}

export async function findForumUserByToken(sql, token) {
  if (!token || !secret()) return null;
  const tokenHash = hashForumToken(token);
  const rows = await sql`SELECT u.id, u.username FROM forum_sessions s JOIN forum_users u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW()`;
  return rows[0] || null;
}

export async function createForumSession(sql, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashForumToken(token);
  await sql`INSERT INTO forum_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, NOW() + INTERVAL '14 days')`;
  await sql`DELETE FROM forum_sessions WHERE expires_at < NOW()`;
  return token;
}

export async function destroyForumSession(sql, token) {
  if (!token) return;
  await sql`DELETE FROM forum_sessions WHERE token_hash = ${hashForumToken(token)}`;
}
