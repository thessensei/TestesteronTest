import { createSessionCookie, safePasswordMatch } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: 'Admin paneli henüz yapılandırılmadı.' });
  }
  const password = req.body?.password;
  if (!safePasswordMatch(password)) return res.status(401).json({ error: 'Şifre hatalı.' });
  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ authenticated: true });
}
