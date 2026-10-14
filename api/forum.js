import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';
import { prepareForum, validatePost, validId, parseForumQuery } from './_forum.js';
import { findForumUserByToken, readForumToken } from './_forum-auth.js';

export function createForumHandler(connect = neon) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const admin = isAdmin(req), query = req.query || {};
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
      return res.status(405).json({ error: 'Yöntem desteklenmiyor.' });
    }
    if ((query.manage === '1' || ['PATCH', 'DELETE'].includes(req.method)) && !admin) return res.status(401).json({ error: 'Admin girişi gerekli.' });
    if (req.method !== 'GET') {
      // JSON-only writes prevent cross-site form submissions; no CORS is enabled.
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'JSON gerekli.' });
      if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'İstek reddedildi.' });
    }
    let input, filters;
    if (req.method === 'GET' && !query.id) {
      try { filters = parseForumQuery(query); } catch (e) { return res.status(400).json({ error: e.message }); }
    }
    if (req.method === 'POST') {
      try { input = validatePost(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
      if (!readForumToken(req)) return res.status(401).json({ error: 'Konu açmak ve yanıtlamak için giriş yapın.' });
    }
    if (query.id && !validId(query.id)) return res.status(400).json({ error: 'Geçersiz kimlik.' });
    if (['PATCH', 'DELETE'].includes(req.method) && (!validId(query.id) || !['thread', 'reply'].includes(query.kind))) return res.status(400).json({ error: 'Kimlik ve tür gerekli.' });
    if (req.method === 'PATCH' && !['approve', 'lock', 'unlock'].includes(req.body?.action)) return res.status(400).json({ error: 'Geçersiz işlem.' });
    if (req.method === 'PATCH' && query.kind === 'reply' && req.body.action !== 'approve') return res.status(400).json({ error: 'Yanıt kilitlenemez.' });
    if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) return res.status(503).json({ error: 'Forum henüz yapılandırılmadı.' });
    try {
      const sql = connect(process.env.DATABASE_URL);
      await prepareForum(sql);
      const manage = query.manage === '1' && admin;
      if (req.method === 'GET') {
        const offset = Math.min(100000, Math.max(0, parseInt(query.offset, 10) || 0));
        if (query.id) {
          const [thread] = await sql`SELECT * FROM forum_threads WHERE id=${query.id} AND (approved=TRUE OR ${manage})`;
          if (!thread) return res.status(404).json({ error: 'Konu bulunamadı.' });
          const replies = await sql`SELECT * FROM forum_replies WHERE thread_id=${query.id} AND (approved=TRUE OR ${manage}) ORDER BY created_at, id LIMIT 51 OFFSET ${offset}`;
          return res.status(200).json({ thread, replies: replies.slice(0, 50), hasMore: replies.length > 50 });
        }
        const { category, search, sort } = filters;
        // Every aggregate uses the same visibility rule as the list. Pending
        // replies must not change public counts, order or last-activity dates.
        const threads = await sql`
          WITH visible AS (
            SELECT t.*,
              (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage})) AS reply_count,
              (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND r.approved=FALSE AND ${manage}) AS pending_count,
              GREATEST(t.created_at, (SELECT MAX(r.created_at) FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage}))) AS last_activity
            FROM forum_threads t
            WHERE (t.approved=TRUE OR ${manage})
              AND (${category} = '' OR t.category=${category})
              AND (${search} = '' OR STRPOS(LOWER(t.title || ' ' || t.body), LOWER(${search})) > 0)
          )
          SELECT * FROM visible WHERE (${sort} <> 'unanswered' OR reply_count=0)
          ORDER BY
            CASE WHEN ${sort} = 'popular' THEN reply_count END DESC,
            CASE WHEN ${sort} = 'active' THEN last_activity ELSE created_at END DESC,
            id
          LIMIT 31 OFFSET ${offset}`;
        const categories = await sql`
          SELECT t.category, COUNT(*)::int AS topic_count,
            COALESCE(SUM((SELECT COUNT(*) FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage}))), 0)::int AS reply_count
          FROM forum_threads t WHERE (t.approved=TRUE OR ${manage}) GROUP BY t.category`;
        return res.status(200).json({ threads: threads.slice(0, 30), hasMore: threads.length > 30, categories });
      }
      if (req.method === 'POST') {
        const user = await findForumUserByToken(sql, readForumToken(req));
        if (!user) return res.status(401).json({ error: 'Oturumunuz sona erdi. Tekrar giriş yapın.' });
        input.author = user.username;
        const key = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(`forum-user:${user.id}`).digest('hex');
        await sql`DELETE FROM forum_limits WHERE last_post < NOW() - INTERVAL '1 day'`;
        const allowed = await sql`INSERT INTO forum_limits (key,last_post) VALUES (${key},NOW()) ON CONFLICT (key) DO UPDATE SET last_post=NOW() WHERE forum_limits.last_post < NOW() - INTERVAL '30 seconds' RETURNING key`;
        if (!allowed.length) return res.status(429).json({ error: 'Yeni mesaj için 30 saniye bekleyin.' });
        const id = crypto.randomUUID();
        if (input.threadId) {
          // Row lock serializes reply insertion with moderation/deletion.
          const rows = await sql`WITH parent AS (SELECT id FROM forum_threads WHERE id=${input.threadId} AND approved=TRUE AND locked=FALSE FOR UPDATE) INSERT INTO forum_replies (id,thread_id,author,body,user_id) SELECT ${id}::uuid,id,${input.author},${input.body},${user.id}::uuid FROM parent RETURNING id`;
          if (!rows.length) return res.status(409).json({ error: 'Konu kapalı veya yayında değil.' });
        } else {
          await sql`INSERT INTO forum_threads (id,author,title,body,category,user_id) VALUES (${id},${input.author},${input.title},${input.body},${input.category},${user.id})`;
        }
        return res.status(201).json({ id, message: 'Mesajınız alındı. Admin onayından sonra yayınlanacak.' });
      }
      let rows;
      if (req.method === 'DELETE') {
        rows = query.kind === 'thread' ? await sql`DELETE FROM forum_threads WHERE id=${query.id} RETURNING id` : await sql`DELETE FROM forum_replies WHERE id=${query.id} RETURNING id`;
      } else if (req.body.action === 'approve') {
        rows = query.kind === 'thread' ? await sql`UPDATE forum_threads SET approved=TRUE WHERE id=${query.id} RETURNING id` : await sql`UPDATE forum_replies SET approved=TRUE WHERE id=${query.id} RETURNING id`;
      } else {
        rows = await sql`UPDATE forum_threads SET locked=${req.body.action === 'lock'} WHERE id=${query.id} RETURNING id`;
      }
      return rows.length ? res.status(200).json({ ok: true }) : res.status(404).json({ error: 'Kayıt bulunamadı.' });
    } catch (error) {
      console.error('Forum service:', error);
      return res.status(500).json({ error: 'Foruma ulaşılamadı. Lütfen tekrar deneyin.' });
    }
  };
}
export default createForumHandler();
