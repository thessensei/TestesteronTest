import crypto from 'node:crypto';

const COOKIE_NAME = 'testotavan_admin';

function secret() {
  return process.env.SESSION_SECRET || '';
}

function signature(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export function createSessionCookie() {
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  const value = `${expires}.${signature(String(expires))}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdmin(req) {
  if (!secret()) return false;
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim().split('=')));
  const value = cookies[COOKIE_NAME];
  if (!value) return false;
  const [expires, received] = value.split('.');
  if (!expires || !received || Number(expires) < Date.now()) return false;
  const expected = signature(expires);
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function safePasswordMatch(password) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || typeof password !== 'string') return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
