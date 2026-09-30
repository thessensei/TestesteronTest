import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isAdmin } from '../_auth.js';
import { validateImageUpload } from '../_media.js';

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
  return neon(process.env.DATABASE_URL);
}

/*
 * Görsel yükleme.
 * POST /api/media  { mime: 'image/png', data: '<base64>' }  →  { url: '/api/media/<id>' }
 * Görsel Neon veritabanında saklanır ve /api/media/<id> üzerinden herkese açık sunulur.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Yetkisiz erişim.' });

  const checked = validateImageUpload(req.body);
  if (!checked.ok) return res.status(400).json({ error: checked.error });

  try {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      mime TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const id = `media-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    await sql`INSERT INTO media (id, mime, data) VALUES (${id}, ${checked.mime}, ${checked.buffer.toString('base64')})`;
    return res.status(201).json({ url: `/api/media/${id}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Görsel yüklenemedi.' });
  }
}
