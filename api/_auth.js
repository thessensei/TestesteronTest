import crypto from 'node:crypto';

const COOKIE_NAME = 'testotavan_admin';
const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 dakika

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
  const cookies = Object.fromEntries((req.headers?.cookie || '').split(';').map(part => { const i=part.indexOf('='); return i<0?[part.trim(),'']:[part.slice(0,i).trim(),part.slice(i+1)]; }));
  const value = cookies[COOKIE_NAME];
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [expires, received] = parts;
  if (!/^\d{13}$/.test(expires) || !/^[0-9a-f]{64}$/.test(received) || Number(expires) <= Date.now()) return false;
  const expected = signature(expires);
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function safeUsernameMatch(username) {
  const expected = (process.env.ADMIN_USERNAME || 'admin').trim();
  if (!expected || typeof username !== 'string') return false;
  const a = Buffer.from(username.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function safePasswordMatch(password) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || typeof password !== 'string') return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * 6 karakterlik tek kullanımlık/süreli güvenlik doğrulama kodu (Captcha) ve
 * stateless HMAC imzalı token üretir.
 */
export function createCaptchaChallenge(now = Date.now()) {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CAPTCHA_ALPHABET[crypto.randomInt(0, CAPTCHA_ALPHABET.length)];
  }
  const expires = now + CAPTCHA_TTL_MS;
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `captcha.${expires}.${nonce}.${code}`;
  const sig = signature(payload);
  return {
    code,
    token: `${expires}.${nonce}.${sig}`,
    expires
  };
}

/**
 * Kullanıcının girdiği doğrulama kodunu HMAC imzalı token ile doğrular.
 */
export function verifyCaptcha(inputCode, token, now = Date.now()) {
  if (!secret()) return false;
  if (typeof inputCode !== 'string' || typeof token !== 'string') return false;
  const normalizedCode = inputCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) return false;

  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  const [expiresStr, nonce, receivedSig] = parts;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < now) return false;
  if (!/^[0-9a-f]{16}$/.test(nonce) || !/^[0-9a-f]{64}$/.test(receivedSig)) return false;

  const expectedSig = signature(`captcha.${expires}.${nonce}.${normalizedCode}`);
  try {
    return crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}
