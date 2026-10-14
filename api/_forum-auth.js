import crypto from 'node:crypto';

export const FORUM_COOKIE = 'testotavan_forum';
export const FORUM_SESSION_DAYS = 14;
const RESERVED = new Set(['admin', 'administrator', 'moderator', 'mod', 'testotavan', 'sistem', 'system', 'root', 'support', 'destek']);
const loginAttempts = new Map();
const registerAttempts = new Map();

function secret() {
  return process.env.SESSION_SECRET || '';
}

export function resetForumAuthLimits() {
  loginAttempts.clear();
  registerAttempts.clear();
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
  return verifyPassword(password, stored || DUMMY_HASH);
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

export function readForumToken(req) {
  const token = readCookie(req, FORUM_COOKIE);
  return /^[a-f0-9]{64}$/i.test(token) ? token : '';
}

export async function prepareForumAuth(sql) {
  await sql`CREATE TABLE IF NOT EXISTS forum_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
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
