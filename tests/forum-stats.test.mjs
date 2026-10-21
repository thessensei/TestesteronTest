import test from 'node:test';
import assert from 'node:assert/strict';
import { collectForumStats, createForumStatsHandler, emptyStats, shapeStats } from '../api/_forum-stats.js';

/** Sorgu metnine göre şekilli yanıt dönen sahte SQL. */
function fakeSql() {
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER|CREATE INDEX)/.test(text)) return [];
    if (/AS threads,[\s\S]*AS replies,[\s\S]*AS members,[\s\S]*AS views/.test(text)) {
      return [{ threads: 18, replies: 64, members: 9, views: 2410 }];
    }
    if (/GROUP BY category/.test(text)) return [{ category: 'Genel', threads: 8 }, { category: 'Beslenme', threads: 5 }];
    if (/ORDER BY view_count DESC/.test(text)) return [{ id: 't1', title: 'Uyku düzeni', view_count: 320 }, { id: 't2', title: 'Protein', view_count: 210 }];
    if (/FROM authors GROUP BY author/.test(text)) return [{ author: 'Ada', posts: 14 }, { author: 'Kaan', posts: 9 }];
    if (/SELECT id, title FROM forum_threads WHERE approved=TRUE ORDER BY created_at DESC/.test(text)) return [{ id: 't3', title: 'Yeni konu' }];
    return [];
  };
  return { sql, queries };
}

async function call(handler, { method = 'GET', query = {}, headers = {} } = {}) {
  const res = {
    headers: {}, code: 0, data: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
  await handler({ method, query, headers }, res);
  return res;
}

test('forum istatistikleri tek yanıtta toplanır', async () => {
  const { sql, queries } = fakeSql();
  const handler = createForumStatsHandler({ connect: () => sql, env: {} });
  const res = await call(handler);
  assert.equal(res.code, 200);
  assert.deepEqual(res.data, {
    threads: 18,
    replies: 64,
    members: 9,
    views: 2410,
    categories: [{ name: 'Genel', threads: 8 }, { name: 'Beslenme', threads: 5 }],
    trending: [{ id: 't1', title: 'Uyku düzeni', views: 320 }, { id: 't2', title: 'Protein', views: 210 }],
    contributors: [{ author: 'Ada', posts: 14 }, { author: 'Kaan', posts: 9 }],
    latest: { id: 't3', title: 'Yeni konu' }
  });
  assert.match(res.headers['Cache-Control'], /s-maxage=60/);
  assert.match(res.headers['Cache-Control'], /stale-while-revalidate=600/);
  // Üye sayısı forum_users tablosunun gerçek kolonlarıyla sayılmalı.
  const totals = queries.find(query => /AS members/.test(query.text));
  assert.match(totals.text, /COUNT\(\*\)::int FROM forum_users/);
  assert.doesNotMatch(totals.text, /COUNT\(DISTINCT user_id\)/, 'forum_users tablosunda user_id kolonu yok');
});

test('yalnızca GET kabul edilir; DB hatasında boş ama geçerli yanıt döner', async () => {
  const handler = createForumStatsHandler({ connect: () => fakeSql().sql, env: {} });
  const notAllowed = await call(handler, { method: 'POST' });
  assert.equal(notAllowed.code, 405);
  assert.equal(notAllowed.headers.Allow, 'GET');
  assert.match(notAllowed.data.error, /desteklenmiyor/i);

  const offline = createForumStatsHandler({ connect: () => { throw new Error('kapalı'); }, env: {} });
  const originalError = console.error;
  console.error = () => {};
  try {
    const res = await call(offline);
    assert.equal(res.code, 200);
    assert.deepEqual(res.data, emptyStats());
  } finally {
    console.error = originalError;
  }
});

test('şekillendirme eksik ve bozuk alanları sıfıra indirger', () => {
  assert.deepEqual(shapeStats({}), emptyStats());
  const stats = shapeStats({
    totals: { threads: '12', replies: null, members: undefined, views: 'x' },
    categories: [{ category: '', threads: 3 }, { category: 'Genel', threads: '4' }],
    trending: [{ id: 'a', title: 'A', view_count: '7' }],
    contributors: [{ author: 'Ada', posts: '2' }],
    latest: []
  });
  assert.equal(stats.threads, 12);
  assert.equal(stats.replies, 0);
  assert.equal(stats.members, 0);
  assert.equal(stats.views, 0);
  assert.deepEqual(stats.categories, [{ name: 'Genel', threads: 4 }]);
  assert.deepEqual(stats.trending, [{ id: 'a', title: 'A', views: 7 }]);
  assert.deepEqual(stats.contributors, [{ author: 'Ada', posts: 2 }]);
  assert.equal(stats.latest, null);
});


test('forum sayfasındaki canlı şerit aynı toplayıcıyı kullanır', async () => {
  const { sql } = fakeSql();
  const stats = await collectForumStats(sql);
  assert.equal(stats.threads, 18);
  assert.equal(stats.categories.length, 2);
  assert.deepEqual(stats.latest, { id: 't3', title: 'Yeni konu' });
});
