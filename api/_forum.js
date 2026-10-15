import { prepareForumAuth } from './_forum-auth.js';

export const CATEGORIES = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
// Kendi mesajını düzenleme penceresi. SQL tarafı da bu sabitten üretilir;
// istemci (forum/forum-core.js) aynı değeri kullanır ve testler ikisini karşılaştırır.
export const EDIT_WINDOW_MS = 30 * 60 * 1000;
// Alıntı bloğunda saklanan en uzun metin. Alıntı, asıl mesaj silinse de okunur kalır.
export const QUOTE_MAX = 240;
export const POST_MIN = 3;
export const POST_MAX = 4000;

/** Metin alanlarını doğrular: tür, kırpma ve uzunluk. */
export function validateText(value, key, min, max) {
  if (typeof value !== 'string') throw new Error(`${key}: ${min}–${max} karakter gerekli.`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw new Error(`${key}: ${min}–${max} karakter gerekli.`);
  return text;
}

/** Alıntı özeti: satır sonları tek boşluğa iner, uzun metin kısaltılır. */
export function quoteExcerpt(body, max = QUOTE_MAX) {
  const flat = String(body ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export function validatePost(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçersiz istek.');
  const author = input.author == null || input.author === '' ? '' : validateText(input.author, 'author', 2, 40);
  const body = validateText(input.body, 'body', POST_MIN, POST_MAX);
  if (input.threadId) {
    if (!validId(input.threadId)) throw new Error('Geçersiz konu.');
    const post = { body, threadId: input.threadId };
    if (input.quoteId != null && input.quoteId !== '') {
      if (!validId(input.quoteId)) throw new Error('Geçersiz alıntı.');
      post.quoteId = input.quoteId;
    }
    return author ? { author, ...post } : post;
  }
  const title = validateText(input.title, 'title', 5, 120);
  if (!CATEGORIES.includes(input.category)) throw new Error('Geçersiz kategori.');
  const post = { body, title, category: input.category };
  if (author) post.author = author;
  return post;
}

/** Beğeni isteği: yalnızca hedef tür ve kimlik taşır. */
export function validateLike(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçersiz istek.');
  if (!['thread', 'reply'].includes(input.kind)) throw new Error('Geçersiz hedef türü.');
  if (!validId(input.id)) throw new Error('Geçersiz kimlik.');
  return { kind: input.kind, id: input.id };
}

/** Düzenleme isteği: sahiplik ve süre kontrolü SQL tarafında yapılır. */
export function validateEdit(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçersiz istek.');
  if (!['thread', 'reply'].includes(input.kind)) throw new Error('Geçersiz hedef türü.');
  if (!validId(input.id)) throw new Error('Geçersiz kimlik.');
  return { kind: input.kind, id: input.id, body: validateText(input.body, 'body', POST_MIN, POST_MAX) };
}

export function validId(id) { return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }

export async function prepareForum(sql) {
  await prepareForumAuth(sql);
  await sql`CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY, author TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
    category TEXT NOT NULL, approved BOOLEAN NOT NULL DEFAULT FALSE, locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY, thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author TEXT NOT NULL, body TEXT NOT NULL, approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS forum_replies_thread ON forum_replies(thread_id, created_at)`;
  await sql`CREATE TABLE IF NOT EXISTS forum_limits (key TEXT PRIMARY KEY, last_post TIMESTAMPTZ NOT NULL)`;
  await sql`ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS user_id UUID`;
  await sql`ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS user_id UUID`;
  // Görüntülenme, sabitlenmiş konu ve düzenleme işaretleri.
  await sql`ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`;
  await sql`ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`;
  // Alıntı, gönderildiği andaki yazar ve metin özetini saklar.
  await sql`ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS quote_id UUID`;
  await sql`ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS quote_author TEXT`;
  await sql`ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS quote_excerpt TEXT`;
  // Rütbe hesapları yazar adına göre sayım yapar.
  await sql`CREATE INDEX IF NOT EXISTS forum_threads_author ON forum_threads(author)`;
  await sql`CREATE INDEX IF NOT EXISTS forum_replies_author ON forum_replies(author)`;
  await sql`CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
    target_kind TEXT NOT NULL, target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS forum_likes_unique ON forum_likes(user_id, target_kind, target_id)`;
  await sql`CREATE INDEX IF NOT EXISTS forum_likes_target ON forum_likes(target_kind, target_id)`;
}
