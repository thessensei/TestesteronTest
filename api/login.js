import { createSessionCookie, safePasswordMatch } from './_auth.js';

const attempts = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: 'Admin paneli henüz yapılandırılmadı.' });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now(), recent = attempts.get(ip) || [];
  const allowed = recent.filter(t => now - t < 15 * 60 * 1000);
  if (allowed.length >= 10) return res.status(429).json({ error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' });
  const password = req.body?.password;
  if (!safePasswordMatch(password)) { attempts.set(ip, [...allowed, now]); return res.status(401).json({ error: 'Şifre hatalı.' }); }
  attempts.delete(ip); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ authenticated: true });
}
