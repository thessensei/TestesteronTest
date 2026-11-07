/*
 * Blog/tarif içerikleri için ortak veri katmanı (private modül).
 *
 * Her yazının kalıcı, insan okunur bir slug'ı vardır:
 *   /blog/sabah-gunesi-ve-uyku-testosteron/
 * Slug veritabanında saklanır; eski kayıtlar ilk istekte otomatik tamamlanır ve
 * benzersizlik kısmi bir index ile garanti edilir.
 */

import { neon } from '@neondatabase/serverless';
import { blogPostPath, fallbackSlug, slugify, stripSourceReferences } from './_seo.js';

let schemaReady = false;

export function connectDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
  return neon(process.env.DATABASE_URL);
}

/** Şema: slug kolonu + benzersiz index. Eski kayıtlar için tek seferlik tamamlama. */
export async function prepareContent(sql) {
  if (schemaReady) return;

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
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS slug TEXT`;

  // Slug'ı olmayan eski kayıtları doldur. İlk istekte yapılır, sonra index devralır.
  const missing = await sql`SELECT id, title FROM content WHERE slug IS NULL OR slug = '' LIMIT 100`;
  for (const row of missing) {
    const slug = await ensureSlug(sql, row.title, row.id);
    await sql`UPDATE content SET slug=${slug} WHERE id=${row.id}`;
  }
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS content_slug_key ON content (slug) WHERE slug IS NOT NULL`;
  } catch (error) {
    // Eski veride çakışan slug varsa yayın akışı durmasın; okuma kimlikle de çalışır.
    console.warn('[content] slug index oluşturulamadı:', error?.message || error);
  }

  schemaReady = true;
}

/** Aynı slug iki yazıya düşmesin: sırayla artan son ek, sonra kimlik kuyruğu. */
export async function ensureSlug(sql, title, id) {
  const base = slugify(title) || fallbackSlug(id);
  let candidate = base.slice(0, 80);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rows = await sql`SELECT id FROM content WHERE slug=${candidate} AND id<>${id} LIMIT 1`;
    if (!rows.length) return candidate;
    candidate = attempt < 3
      ? `${base.slice(0, 70)}-${attempt + 2}`
      : `${base.slice(0, 66)}-${Date.now().toString(36)}${attempt}`;
  }
  return `${base.slice(0, 60)}-${Date.now().toString(36)}`;
}

/** Yayın gövdesindeki kaynakça kalıntılarını temizler. */
export function cleanBody(body) {
  return stripSourceReferences(body);
}

/** API yanıtına herkese açık yazı adresini ekler. */
export function withPublicUrl(row) {
  if (!row) return row;
  const slug = row.slug || fallbackSlug(row.id);
  return { ...row, slug, url: blogPostPath(slug) };
}

/** Yayın sırasına göre tüm içerik (blog + tarif). */
export async function listContent(sql, query = null) {
  if (query) {
    const needle = `%${String(query).slice(0, 80)}%`;
    const rows = await sql`SELECT id, type, category, title, slug, emoji, time_text AS time, summary, body, ingredients, translations, cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date, published_at, updated_at
      FROM content WHERE title ILIKE ${needle} OR summary ILIKE ${needle} OR category ILIKE ${needle}
      ORDER BY published_at DESC`;
    return rows.map(withPublicUrl);
  }
  const rows = await sql`SELECT id, type, category, title, slug, emoji, time_text AS time, summary, body, ingredients, translations, cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date, published_at, updated_at FROM content ORDER BY published_at DESC`;
  return rows.map(withPublicUrl);
}

/** Arşivde yalnızca seçili dil ve İngilizce yedeği gerekir; diğer dillerin büyük gövdeleri taşınmaz. */
export async function listContentForHub(sql, lang = 'tr') {
  const rows = await sql`SELECT id, type, category, title, slug, emoji, time_text AS time, summary, body,
    jsonb_strip_nulls(jsonb_build_object(${lang}::text, translations->${lang}::text, 'en', translations->'en')) AS translations,
    cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date, published_at, updated_at
    FROM content ORDER BY published_at DESC`;
  return rows.map(withPublicUrl);
}

/** Detay sayfasındaki üç kart için tam gövde ve malzemeler gerekli değildir. */
export async function listRelatedContent(sql, item) {
  const rows = await sql`SELECT t.id, t.type, t.category, t.title, t.slug, t.emoji, t.time_text AS time, t.summary,
    COALESCE((SELECT jsonb_object_agg(e.key, e.value - 'body' - 'ingredients')
      FROM jsonb_each(t.translations) e WHERE jsonb_typeof(e.value) = 'object'), '{}'::jsonb) AS translations,
    t.cover_url, TO_CHAR(t.published_at, 'YYYY-MM-DD') AS date, t.published_at, t.updated_at
    FROM content t WHERE t.id <> ${item.id}
    ORDER BY (t.category = ${item.category}) DESC, t.published_at DESC LIMIT 3`;
  return rows.map(withPublicUrl);
}

export async function findContentBySlug(sql, slug) {
  const value = String(slug || '').trim();
  if (!value) return null;
  const rows = await sql`SELECT id, type, category, title, slug, emoji, time_text AS time, summary, body, ingredients, translations, cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date, published_at, updated_at
    FROM content WHERE slug=${value} OR id=${value}
    ORDER BY CASE WHEN slug=${value} THEN 0 ELSE 1 END LIMIT 1`;
  return rows.length ? withPublicUrl(rows[0]) : null;
}

export async function findContentById(sql, id) {
  const value = String(id || '').trim();
  if (!value) return null;
  const rows = await sql`SELECT id, type, category, title, slug, emoji, time_text AS time, summary, body, ingredients, translations, cover_url, TO_CHAR(published_at, 'YYYY-MM-DD') AS date, published_at, updated_at FROM content WHERE id=${value} LIMIT 1`;
  return rows.length ? withPublicUrl(rows[0]) : null;
}

export function isContentType(value) {
  return value === 'recipe' ? 'recipe' : 'blog';
}
