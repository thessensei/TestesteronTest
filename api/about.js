import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';
import { ABOUT_DEFAULTS, ABOUT_FIELDS, normalizeAbout } from './_about-shape.js';

export function createAboutHandler(database = neon) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'PUT'].includes(req.method)) {
      res.setHeader('Allow', 'GET, PUT');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    let content;
    if (req.method === 'PUT') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Yetkisiz erişim.' });
      if (req.headers['sec-fetch-site'] === 'cross-site' || req.headers['x-testotavan-about'] !== '1') {
        return res.status(403).json({ error: 'Geçersiz istek.' });
      }
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
        return res.status(415).json({ error: 'JSON içerik gönderin.' });
      }
      try { content = normalizeAbout(req.body?.content); }
      catch (error) { return res.status(400).json({ error: error.message }); }
    }
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Hakkımızda servisi yapılandırılmamış.' });
    try {
      const sql = database(process.env.DATABASE_URL);
      await sql`CREATE TABLE IF NOT EXISTS site_about (id INTEGER PRIMARY KEY CHECK (id = 1), content JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
      if (req.method === 'PUT') {
        await sql`INSERT INTO site_about (id, content) VALUES (1, ${JSON.stringify(content)}::jsonb) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`;
      } else {
        const [row] = await sql`SELECT content FROM site_about WHERE id = 1`;
        content = row?.content || { tr: ABOUT_DEFAULTS, en: {}, de: {}, ja: {} };
      }
      return res.status(200).json({ content, fields: ABOUT_FIELDS });
    } catch (error) {
      console.error('Hakkımızda servisi:', error.message);
      return res.status(500).json({ error: 'Hakkımızda bilgileri kaydedilemedi veya yüklenemedi. Lütfen tekrar deneyin.' });
    }
  };
}

export default createAboutHandler();
