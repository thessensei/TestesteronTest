import { neon } from '@neondatabase/serverless';

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createStatsHandler(database = neon) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const cookies = Object.fromEntries((req.headers?.cookie || '').split(';').map(part => {
      const i = part.indexOf('=');
      return i < 0 ? [part.trim(), ''] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    }));
    const visitor = cookies.testotavan_visitor_v1 || '';
    if (req.method === 'POST') {
      if (req.headers?.['sec-fetch-site'] === 'cross-site' || req.headers?.['x-testotavan-stats'] !== '1') {
        return res.status(403).json({ error: 'Geçersiz istek.' });
      }
      if (cookies.testotavan_cookie_consent !== 'accepted') {
        return res.status(403).json({ error: 'Ziyaret kaydı için çerez onayı gerekiyor.' });
      }
      if (!VISITOR_ID.test(visitor)) return res.status(400).json({ error: 'Geçersiz ziyaretçi kimliği.' });
    }
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'İstatistik servisi yapılandırılmamış.' });
    try {
      const sql = database(process.env.DATABASE_URL);
      // Yeni sayaç sıfırdan başlar; eski site_stats.page_views verileri kullanılmaz.
      // Tablo sonraki dağıtımlarda korunur, her açılışta sıfırlanmaz.
      await sql`CREATE TABLE IF NOT EXISTS site_unique_visitors_v1 (visitor_id UUID PRIMARY KEY)`;
      if (req.method === 'POST') {
        // PK + ON CONFLICT: yenileme, yeniden deneme ve eşzamanlı istekler tek kayıt olur.
        await sql`INSERT INTO site_unique_visitors_v1 (visitor_id) VALUES (${visitor}) ON CONFLICT (visitor_id) DO NOTHING`;
      }
      const [row] = await sql`SELECT COUNT(*) AS views FROM site_unique_visitors_v1`;
      return res.status(200).json({ views: Number(row?.views || 0) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'İstatistik servisine ulaşılamadı.' });
    }
  };
}

export default createStatsHandler();
