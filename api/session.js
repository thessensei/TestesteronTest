import { isAdmin, clearSessionCookie } from './_auth.js';
import { configurationReport } from './_settings.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'DELETE') {
    if (req.headers?.['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'İstek reddedildi.' });
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ authenticated: false });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const authenticated = isAdmin(req);
  if (req.query?.settings === '1') {
    if (!authenticated) return res.status(401).json({ error: 'Yönetici girişi gerekli.' });
    return res.status(200).json(configurationReport());
  }
  return res.status(200).json({ authenticated });
}
