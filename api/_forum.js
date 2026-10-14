import { prepareForumAuth } from './_forum-auth.js';

export const CATEGORIES = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
export function validatePost(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçersiz istek.');
  const text = (key, min, max) => {
    if (typeof input[key] !== 'string') throw new Error(`${key}: ${min}–${max} karakter gerekli.`);
    const value = input[key].trim();
    if (value.length < min || value.length > max) throw new Error(`${key}: ${min}–${max} karakter gerekli.`);
    return value;
  };
  const author = input.author == null || input.author === '' ? '' : text('author', 2, 40);
  const body = text('body', 3, 4000);
  if (input.threadId) {
    if (!validId(input.threadId)) throw new Error('Geçersiz konu.');
    return author ? { author, body, threadId: input.threadId } : { body, threadId: input.threadId };
  }
  const title = text('title', 5, 120);
  if (!CATEGORIES.includes(input.category)) throw new Error('Geçersiz kategori.');
  const post = { body, title, category: input.category };
  if (author) post.author = author;
  return post;
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
}
