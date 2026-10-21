/*
 * /api/forum-stats — Meydan'ın canlı nabzı.
 *
 * Forum sayfasındaki istatistik şeridi, kategori dağılımı, öne çıkan konular ve
 * en aktif yazarlar tek istekte gelir. Sonuç 60 saniye CDN'de tutulur; her sayfa
 * yenilemesinde veritabanına yeni sorgu gitmez.
 */

import { neon } from '@neondatabase/serverless';
import { prepareForum } from './_forum.js';

export function emptyStats() {
  return {
    threads: 0, replies: 0, members: 0, views: 0,
    categories: [], trending: [], contributors: [], latest: null
  };
}

/** Sorgu sonuçlarını tek, güvenli yanıt şekline çevirir. */
export function shapeStats({ totals = {}, categories = [], trending = [], contributors = [], latest = [] } = {}) {
  const stats = emptyStats();
  stats.threads = Number(totals.threads) || 0;
  stats.replies = Number(totals.replies) || 0;
  stats.members = Number(totals.members) || 0;
  stats.views = Number(totals.views) || 0;
  stats.categories = categories.map(row => ({ name: row.category, threads: Number(row.threads) || 0 })).filter(row => row.name);
  stats.trending = trending.map(row => ({ id: row.id, title: row.title, views: Number(row.view_count) || 0 }));
  stats.contributors = contributors.map(row => ({ author: row.author, posts: Number(row.posts) || 0 }));
  stats.latest = latest.length ? { id: latest[0].id, title: latest[0].title } : null;
  return stats;
}

export function createForumStatsHandler(options = {}) {
  const connect = options.connect || (() => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
    return neon(process.env.DATABASE_URL);
  });

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Yöntem desteklenmiyor.' });
    }

    try {
      const sql = options.sql || connect();
      await prepareForum(sql);

      const [totals] = await sql`SELECT
        (SELECT COUNT(*)::int FROM forum_threads WHERE approved=TRUE) AS threads,
        (SELECT COUNT(*)::int FROM forum_replies WHERE approved=TRUE) AS replies,
        (SELECT COUNT(*)::int FROM forum_users) AS members,
        (SELECT COALESCE(SUM(view_count),0)::int FROM forum_threads WHERE approved=TRUE) AS views`;
      const categories = await sql`SELECT category, COUNT(*)::int AS threads FROM forum_threads WHERE approved=TRUE GROUP BY category ORDER BY threads DESC`;
      const trending = await sql`SELECT id, title, view_count FROM forum_threads WHERE approved=TRUE ORDER BY view_count DESC, created_at DESC LIMIT 5`;
      const contributors = await sql`WITH authors AS (
          SELECT author FROM forum_threads WHERE approved=TRUE
          UNION ALL SELECT author FROM forum_replies WHERE approved=TRUE
        ) SELECT author, COUNT(*)::int AS posts FROM authors GROUP BY author ORDER BY posts DESC LIMIT 5`;
      const latest = await sql`SELECT id, title FROM forum_threads WHERE approved=TRUE ORDER BY created_at DESC LIMIT 1`;

      return res.status(200).json(shapeStats({ totals, categories, trending, contributors, latest }));
    } catch (error) {
      console.error('[forum-stats]', error);
      return res.status(200).json(emptyStats());
    }
  };
}

export default createForumStatsHandler();
