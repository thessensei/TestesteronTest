import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';
import { prepareForum, validatePost, validId } from './_forum.js';

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
    let input;
    if (req.method === 'POST') {
      try { input = validatePost(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
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
          const replies = await sql`SELECT * FROM forum_replies WHERE thread_id=${query.id} AND (approved=TRUE OR ${manage}) ORDER BY created_at, id LIMIT 50 OFFSET ${offset}`;
          return res.status(200).json({ thread, replies });
        }
        const threads = await sql`SELECT t.*, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage})) AS reply_count, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND r.approved=FALSE AND ${manage}) AS pending_count FROM forum_threads t WHERE t.approved=TRUE OR ${manage} ORDER BY t.created_at DESC, t.id LIMIT 30 OFFSET ${offset}`;
        return res.status(200).json({ threads });
      }
      if (req.method === 'POST') {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
        const key = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(ip).digest('hex');
        await sql`DELETE FROM forum_limits WHERE last_post < NOW() - INTERVAL '1 day'`;
        const allowed = await sql`INSERT INTO forum_limits (key,last_post) VALUES (${key},NOW()) ON CONFLICT (key) DO UPDATE SET last_post=NOW() WHERE forum_limits.last_post < NOW() - INTERVAL '30 seconds' RETURNING key`;
        if (!allowed.length) return res.status(429).json({ error: 'Yeni mesaj için 30 saniye bekleyin.' });
        const id = crypto.randomUUID();
        if (input.threadId) {
          // Row lock serializes reply insertion with moderation/deletion.
          const rows = await sql`WITH parent AS (SELECT id FROM forum_threads WHERE id=${input.threadId} AND approved=TRUE AND locked=FALSE FOR UPDATE) INSERT INTO forum_replies (id,thread_id,author,body) SELECT ${id}::uuid,id,${input.author},${input.body} FROM parent RETURNING id`;
          if (!rows.length) return res.status(409).json({ error: 'Konu kapalı veya yayında değil.' });
        } else {
          await sql`INSERT INTO forum_threads (id,author,title,body,category) VALUES (${id},${input.author},${input.title},${input.body},${input.category})`;
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
