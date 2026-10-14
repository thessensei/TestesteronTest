export const CATEGORIES = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
export function validatePost(input = {}) {
  const text = (key, min, max) => {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (value.length < min || value.length > max) throw new Error(`${key}: ${min}–${max} karakter gerekli.`);
    return value;
  };
  const author = text('author', 2, 40), body = text('body', 3, 4000);
  if (input.threadId) {
    if (!validId(input.threadId)) throw new Error('Geçersiz konu.');
    return { author, body, threadId: input.threadId };
  }
  const title = text('title', 5, 120);
  if (!CATEGORIES.includes(input.category)) throw new Error('Geçersiz kategori.');
  return { author, body, title, category: input.category };
}
export function validId(id) { return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }
export async function prepareForum(sql) {
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
}
