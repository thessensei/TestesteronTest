import {
  createSessionCookie,
  safeUsernameMatch,
  safePasswordMatch,
  createCaptchaChallenge,
  verifyCaptcha,
  CAPTCHA_TTL_MS
} from './_auth.js';

const attempts = new Map();
const usedTokens = new Map();

function pruneUsedTokens(now) {
  for (const [token, exp] of usedTokens.entries()) {
    if (exp < now) usedTokens.delete(token);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: 'Admin paneli henüz yapılandırılmadı.' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ captcha: createCaptchaChallenge() });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now(), recent = attempts.get(ip) || [];
  const allowed = recent.filter(t => now - t < 15 * 60 * 1000);
  if (allowed.length >= 10) {
    return res.status(429).json({ error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' });
  }

  pruneUsedTokens(now);

  const { username, password, captchaCode, captchaToken } = req.body || {};

  if (!verifyCaptcha(captchaCode, captchaToken, now) || usedTokens.has(captchaToken)) {
    attempts.set(ip, [...allowed, now]);
    return res.status(400).json({
      error: 'Doğrulama kodu hatalı veya süresi doldu.',
      captcha: createCaptchaChallenge(now)
    });
  }

  // Tek kullanımlık olarak işaretle
  usedTokens.set(captchaToken, now + CAPTCHA_TTL_MS);

  if (!safeUsernameMatch(username) || !safePasswordMatch(password)) {
    attempts.set(ip, [...allowed, now]);
    return res.status(401).json({
      error: 'Kullanıcı adı veya şifre hatalı.',
      captcha: createCaptchaChallenge(now)
    });
  }

  attempts.delete(ip);
  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ authenticated: true });
}
