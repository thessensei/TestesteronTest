import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createForumHandler } from '../api/forum.js';
import { prepareForum } from '../api/_forum.js';
import { createSessionCookie } from '../api/_auth.js';

// Run the actual parameterized SQL against PostgreSQL, not a query-string mock.
test('forum discovery queries preserve visibility, filters and deterministic ordering', async t => {
  process.env.SESSION_SECRET = 'forum-query-test';
  process.env.DATABASE_URL = 'postgresql://test.invalid/test';
  const db = new PGlite();
  t.after(() => db.close());
  const sql = async (strings, ...values) => {
    const text = strings.reduce((query, part, i) => query + (i ? `$${i}` : '') + part, '');
    return (await db.query(text, values)).rows;
  };
  await prepareForum(sql);
  const ids = [1, 2, 3, 4].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
  for (const [i, title, body, category, approved, date] of [
    [0, 'Training program', 'Progress at 100% effort', 'Antrenman', true, '2026-01-01'],
    [1, 'Protein question', 'Nutrition and training', 'Beslenme', true, '2026-01-10'],
    [2, 'First question', 'No published replies', 'Genel', true, '2026-01-08'],
    [3, 'Private title', 'Private body', 'Deneyimler', false, '2026-02-01']
  ]) await sql`INSERT INTO forum_threads (id, author, title, body, category, approved, created_at) VALUES (${ids[i]}, 'Ada', ${title}, ${body}, ${category}, ${approved}, ${date})`;
  let n = 10;
  for (const [i, approved, date] of [[0, true, '2026-01-20'], [1, true, '2026-01-12'], [1, true, '2026-01-13'], [2, false, '2026-02-10'], [3, true, '2026-02-11']]) {
    const id = `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}`;
    await sql`INSERT INTO forum_replies (id, thread_id, author, body, approved, created_at) VALUES (${id}, ${ids[i]}, 'Can', 'Reply', ${approved}, ${date})`;
  }
  const handler = createForumHandler(() => sql);
  const request = async (query = {}, admin = false) => {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'GET', query, headers: admin ? { cookie: createSessionCookie().split(';')[0] } : {} }, res);
    assert.equal(res.code, 200, JSON.stringify(res.data));
    return res.data;
  };
  await t.test('activity, newest, popular and unanswered use all visible rows', async () => {
    for (const [sort, expected] of [['active', [0, 1, 2]], ['newest', [1, 2, 0]], ['popular', [1, 0, 2]], ['unanswered', [2]]]) {
      const data = await request({ sort });
      assert.deepEqual(data.threads.map(row => row.id), expected.map(i => ids[i]));
      assert.equal(data.hasMore, false);
      assert.ok(data.threads.every(row => row.pending_count === 0));
    }
  });
  await t.test('category and literal, case-insensitive title/body search compose before pagination', async () => {
    assert.deepEqual((await request({ q: 'TRAINING', category: 'Beslenme' })).threads.map(row => row.id), [ids[1]]);
    assert.deepEqual((await request({ q: '100%' })).threads.map(row => row.id), [ids[0]]);
    for (const q of ['_', "' OR TRUE --", 'Private']) assert.equal((await request({ q })).threads.length, 0);
    assert.equal((await request({ q: 'training', offset: '1', sort: 'newest' })).threads[0].id, ids[0]);
  });
  await t.test('category totals are unfiltered and exclude pending threads/replies', async () => {
    const data = await request({ category: 'Beslenme', q: 'not found' });
    assert.equal(data.threads.length, 0);
    assert.deepEqual(data.categories.sort((a, b) => a.category.localeCompare(b.category)), [
      { category: 'Antrenman', topic_count: 1, reply_count: 1 },
      { category: 'Beslenme', topic_count: 1, reply_count: 2 },
      { category: 'Genel', topic_count: 1, reply_count: 0 }
    ]);
    const first = (await request()).threads.find(row => row.id === ids[2]);
    assert.equal(new Date(first.last_activity).toISOString(), '2026-01-08T00:00:00.000Z');
  });
  await t.test('authenticated moderation includes pending rows and activity', async () => {
    const data = await request({ manage: '1' }, true);
    assert.deepEqual(data.threads.map(row => row.id), [ids[3], ids[2], ids[0], ids[1]]);
    assert.equal(data.threads[1].pending_count, 1);
    assert.equal(data.categories.reduce((sum, c) => sum + c.topic_count, 0), 4);
    assert.equal(data.categories.reduce((sum, c) => sum + c.reply_count, 0), 5);
    assert.equal((await request({ sort: 'unanswered', manage: '1' }, true)).threads.length, 0);
  });
});
