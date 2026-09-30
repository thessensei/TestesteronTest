import { neon } from '@neondatabase/serverless';

const ID_PATTERN = /^media-[A-Za-z0-9-]{6,80}$/;

/*
 * Yüklenen görseli sunar.
 * GET /api/media/media-<timestamp>-<rastgele>  →  görsel baytları (Content-Type: image/*)
 * Kimlikler benzersiz olduğu için yanıt bir yıl önbelleklenebilir.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query?.id || '').trim();
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Geçersiz görsel kimliği.' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Veritabanı yapılandırılmadı.' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const [row] = await sql`SELECT mime, data FROM media WHERE id = ${id}`;
    if (!row) return res.status(404).json({ error: 'Görsel bulunamadı.' });
    const buffer = Buffer.from(row.data, 'base64');
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Görsel servis edilemedi.' });
  }
}
