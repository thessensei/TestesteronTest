import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';
import { isSafeCoverUrl } from './_media.js';

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
  return neon(process.env.DATABASE_URL);
}

async function prepare(sql) {
  await sql`CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('blog', 'recipe')),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    time_text TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cover_url TEXT NOT NULL DEFAULT ''
  )`;
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT ''`;
}

const clean = (value, max) => String(value || '').trim().slice(0, max);
function cleanTranslations(value) {
  const result = {};
  for (const lang of ['en', 'de', 'ja']) {
    const item = value?.[lang] || {};
    result[lang] = {
      title: clean(item.title, 100), summary: clean(item.summary, 240),
      body: clean(item.body, 20000), category: clean(item.category, 60)
    };
  }
  return result;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    await prepare(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, type, category, title, emoji, time_text AS time, summary, body, ingredients, translations, cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date FROM content ORDER BY published_at DESC`;
      return res.status(200).json(rows);
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Yetkisiz erişim.' });

    if (req.method === 'POST') {
      const input = req.body || {};
      const item = {
        id: `content-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        type: input.type === 'recipe' ? 'recipe' : 'blog',
        category: clean(input.category, 60), title: clean(input.title, 100),
        emoji: clean(input.emoji, 8) || '📝', time: clean(input.time, 30),
        summary: clean(input.summary, 240), body: clean(input.body, 20000),
        ingredients: Array.isArray(input.ingredients) ? input.ingredients.map(x => clean(x, 200)).filter(Boolean).slice(0, 100) : [],
        translations: cleanTranslations(input.translations), cover_url: isSafeCoverUrl(input.cover_url)
      };
      if (!item.category || !item.title || !item.time || !item.summary || !item.body) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
      const [created] = await sql`INSERT INTO content (id,type,category,title,emoji,time_text,summary,body,ingredients,translations,cover_url) VALUES (${item.id},${item.type},${item.category},${item.title},${item.emoji},${item.time},${item.summary},${item.body},${JSON.stringify(item.ingredients)}::jsonb,${JSON.stringify(item.translations)}::jsonb,${item.cover_url}) RETURNING id,type,category,title,emoji,time_text AS time,summary,body,ingredients,translations,cover_url,TO_CHAR(published_at,'YYYY-MM-DD') AS date`;
      return res.status(201).json(created);
    }

    if (req.method === 'PUT') {
      const id = clean(req.query.id, 120);
      if (!id) return res.status(400).json({ error: 'İçerik kimliği gerekli.' });
      const input = req.body || {};
      const item = { type: input.type === 'recipe' ? 'recipe' : 'blog', category: clean(input.category, 60), title: clean(input.title, 100), emoji: clean(input.emoji, 8) || '📝', time: clean(input.time, 30), summary: clean(input.summary, 240), body: clean(input.body, 20000), ingredients: Array.isArray(input.ingredients) ? input.ingredients.map(x => clean(x, 200)).filter(Boolean).slice(0, 100) : [], translations: cleanTranslations(input.translations), cover_url: isSafeCoverUrl(input.cover_url) };
      if (!item.category || !item.title || !item.time || !item.summary || !item.body) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
      const [updated] = await sql`UPDATE content SET type=${item.type},category=${item.category},title=${item.title},emoji=${item.emoji},time_text=${item.time},summary=${item.summary},body=${item.body},ingredients=${JSON.stringify(item.ingredients)}::jsonb,translations=${JSON.stringify(item.translations)}::jsonb,cover_url=${item.cover_url},updated_at=NOW() WHERE id=${id} RETURNING id,type,category,title,emoji,time_text AS time,summary,body,ingredients,translations,cover_url,TO_CHAR(published_at,'YYYY-MM-DD') AS date`;
      return updated ? res.status(200).json(updated) : res.status(404).json({ error: 'İçerik bulunamadı.' });
    }

    if (req.method === 'DELETE') {
      const id = clean(req.query.id, 100);
      if (!id) return res.status(400).json({ error: 'İçerik kimliği gerekli.' });
      await sql`DELETE FROM content WHERE id = ${id}`;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'İçerik servisine ulaşılamadı.' });
  }
}
