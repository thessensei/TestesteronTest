import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ views: 0 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS site_stats (name TEXT PRIMARY KEY, value BIGINT NOT NULL DEFAULT 0)`;
    await sql`INSERT INTO site_stats (name,value) VALUES ('page_views',0) ON CONFLICT (name) DO NOTHING`;
    if (req.method === 'POST') await sql`UPDATE site_stats SET value=value+1 WHERE name='page_views'`;
    const [row] = await sql`SELECT value FROM site_stats WHERE name='page_views'`;
    return res.status(200).json({ views: Number(row?.value || 0) });
  } catch (error) { console.error(error); return res.status(500).json({ error: 'İstatistik servisine ulaşılamadı.' }); }
}
