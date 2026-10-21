import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';
import { CATEGORIES, EDIT_WINDOW_MS, prepareForum, quoteExcerpt, validateEdit, validateLike, validatePost, validId } from './_forum.js';
import { findForumUserByToken, readForumToken } from './_forum-auth.js';

const MODERATION_ACTIONS = ['approve', 'lock', 'unlock', 'pin', 'unpin'];

/** Kullanıcı kimliğini yanıttan çıkarır, sahiplik bilgisini ekler. */
function present(row, viewer, posts) {
  const { user_id: owner, ...rest } = row;
  const item = { ...rest, mine: Boolean(viewer && owner && owner === viewer.id) };
  if (posts) item.author_posts = posts.get(item.author) ?? 0;
  return item;
}

/** Konudaki yazarların onaylı mesaj sayısı (rütbe göstergesi). */
async function authorPosts(sql, threadId) {
  const rows = await sql`WITH thread_authors AS (
      SELECT author FROM forum_threads WHERE id=${threadId}
      UNION SELECT author FROM forum_replies WHERE thread_id=${threadId}
    )
    SELECT ta.author,
      ((SELECT COUNT(*)::int FROM forum_threads t WHERE t.approved AND t.author=ta.author)
        + (SELECT COUNT(*)::int FROM forum_replies r WHERE r.approved AND r.author=ta.author)) AS posts
    FROM thread_authors ta`;
  return new Map(rows.map(row => [row.author, Number(row.posts) || 0]));
}

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
    // Beğeni ve düzenleme, yeni mesaj göndermekle aynı uç noktayı kullanır;
    // gövde doğrulaması ve oturum kapısı her işlem için ayrı yapılır.
    const action = req.method === 'POST' ? req.body?.action : undefined;
    const interaction = action === 'like' || action === 'edit';
    let input, like, edit;
    if (req.method === 'POST' && interaction) {
      try {
        if (action === 'like') like = validateLike(req.body);
        else edit = validateEdit(req.body);
      } catch (e) { return res.status(400).json({ error: e.message }); }
      if (!readForumToken(req)) return res.status(401).json({ error: 'Beğenmek ve düzenlemek için giriş yapın.' });
    }
    if (req.method === 'POST' && !interaction) {
      try { input = validatePost(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
      if (!readForumToken(req)) return res.status(401).json({ error: 'Konu açmak ve yanıtlamak için giriş yapın.' });
    }
    if (query.id && !validId(query.id)) return res.status(400).json({ error: 'Geçersiz kimlik.' });
    if (['PATCH', 'DELETE'].includes(req.method) && (!validId(query.id) || !['thread', 'reply'].includes(query.kind))) return res.status(400).json({ error: 'Kimlik ve tür gerekli.' });
    if (req.method === 'PATCH' && !MODERATION_ACTIONS.includes(req.body?.action)) return res.status(400).json({ error: 'Geçersiz işlem.' });
    if (req.method === 'PATCH' && query.kind === 'reply' && req.body.action !== 'approve') return res.status(400).json({ error: 'Yanıt kilitlenemez veya sabitlenemez.' });
    if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) return res.status(503).json({ error: 'Forum henüz yapılandırılmadı.' });
    try {
      const sql = connect(process.env.DATABASE_URL);
      await prepareForum(sql);
      const manage = query.manage === '1' && admin;
      const token = readForumToken(req);
      if (req.method === 'GET') {
        const viewer = token ? await findForumUserByToken(sql, token) : null;
        const viewerId = viewer?.id ?? null;
        const offset = Math.min(100000, Math.max(0, parseInt(query.offset, 10) || 0));
        if (query.id) {
          const [thread] = await sql`SELECT t.*, (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id) AS likes, (${viewerId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id AND l.user_id=${viewerId})) AS liked FROM forum_threads t WHERE t.id=${query.id} AND (t.approved=TRUE OR ${manage})`;
          if (!thread) return res.status(404).json({ error: 'Konu bulunamadı.' });
          const replies = await sql`SELECT r.*, (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='reply' AND l.target_id=r.id) AS likes, (${viewerId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM forum_likes l WHERE l.target_kind='reply' AND l.target_id=r.id AND l.user_id=${viewerId})) AS liked FROM forum_replies r WHERE r.thread_id=${query.id} AND (r.approved=TRUE OR ${manage}) ORDER BY r.created_at, r.id LIMIT 50 OFFSET ${offset}`;
          if (query.view === '1' && thread.approved) {
            const bumped = await sql`UPDATE forum_threads SET view_count=view_count+1 WHERE id=${query.id} AND approved=TRUE RETURNING view_count`;
            if (bumped.length) thread.view_count = bumped[0].view_count;
          }
          const posts = await authorPosts(sql, query.id);
          return res.status(200).json({ thread: present(thread, viewer, posts), replies: replies.map(row => present(row, viewer, posts)) });
        }
        // Liste görünümü: kategori, arama ve sıralama. Varsayılan sıralama ve
        // sorgu metni sabittir; ek filtreler yalnızca istendiğinde devreye girer.
        const sort = ['new', 'top', 'active', 'unanswered'].includes(query.sort) ? query.sort : 'new';
        const category = CATEGORIES.includes(query.category) ? query.category : '';
        const search = String(query.q || '').replace(/[%_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
        const needle = search ? `%${search}%` : '';
        const filtered = Boolean(category || search);
        const threads = (!filtered && sort === 'new')
          ? await sql`SELECT t.*, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage})) AS reply_count, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND r.approved=FALSE AND ${manage}) AS pending_count, (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id) AS likes, (${viewerId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id AND l.user_id=${viewerId})) AS liked FROM forum_threads t WHERE t.approved=TRUE OR ${manage} ORDER BY t.pinned DESC, t.created_at DESC, t.id LIMIT 30 OFFSET ${offset}`
          : await sql`SELECT t.*, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND (r.approved=TRUE OR ${manage})) AS reply_count, (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND r.approved=FALSE AND ${manage}) AS pending_count, (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id) AS likes, (${viewerId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id AND l.user_id=${viewerId})) AS liked
            FROM forum_threads t
            WHERE (t.approved=TRUE OR ${manage})
              AND (${category}::text = '' OR t.category = ${category}::text)
              AND (${needle}::text = '' OR t.title ILIKE ${needle} OR t.body ILIKE ${needle})
            ORDER BY t.pinned DESC,
              (CASE WHEN ${sort}::text = 'top' THEN (SELECT COUNT(*)::int FROM forum_likes l2 WHERE l2.target_kind='thread' AND l2.target_id=t.id) END) DESC NULLS LAST,
              (CASE WHEN ${sort}::text = 'active' THEN (SELECT COUNT(*)::int FROM forum_replies r2 WHERE r2.thread_id=t.id AND r2.approved=TRUE) END) DESC NULLS LAST,
              (CASE WHEN ${sort}::text = 'unanswered' THEN (SELECT COUNT(*)::int FROM forum_replies r3 WHERE r3.thread_id=t.id AND r3.approved=TRUE) END) ASC NULLS LAST,
              t.created_at DESC, t.id
            LIMIT 30 OFFSET ${offset}`;
        return res.status(200).json({ threads: threads.map(row => present(row, viewer)), meta: { sort, category, q: search, offset } });
      }
      if (req.method === 'POST') {
        const user = await findForumUserByToken(sql, readForumToken(req));
        if (!user) return res.status(401).json({ error: 'Oturumunuz sona erdi. Tekrar giriş yapın.' });
        const key = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(`forum-user:${user.id}`).digest('hex');
        if (like) {
          const allowed = await sql`INSERT INTO forum_limits (key,last_post) VALUES (${'like:' + key},NOW()) ON CONFLICT (key) DO UPDATE SET last_post=NOW() WHERE forum_limits.last_post < NOW() - INTERVAL '1 second' RETURNING key`;
          if (!allowed.length) return res.status(429).json({ error: 'Çok hızlı işlem yapıyorsunuz. Bir saniye bekleyin.' });
          const target = like.kind === 'thread'
            ? await sql`SELECT id FROM forum_threads WHERE id=${like.id} AND approved=TRUE`
            : await sql`SELECT id FROM forum_replies WHERE id=${like.id} AND approved=TRUE`;
          if (!target.length) return res.status(404).json({ error: 'Beğenilecek kayıt bulunamadı.' });
          const existing = await sql`SELECT id FROM forum_likes WHERE user_id=${user.id} AND target_kind=${like.kind} AND target_id=${like.id}`;
          let liked = true;
          if (existing.length) {
            await sql`DELETE FROM forum_likes WHERE user_id=${user.id} AND target_kind=${like.kind} AND target_id=${like.id}`;
            liked = false;
          } else {
            try {
              await sql`INSERT INTO forum_likes (id,user_id,target_kind,target_id) VALUES (${crypto.randomUUID()},${user.id},${like.kind},${like.id})`;
            } catch (error) {
              // Eşzamanlı iki istek aynı beğeniyi yazmaya çalışırsa kayıt zaten vardır.
              if (!/unique|duplicate/i.test(String(error?.message || error))) throw error;
            }
          }
          const counts = await sql`SELECT COUNT(*)::int AS likes FROM forum_likes WHERE target_kind=${like.kind} AND target_id=${like.id}`;
          return res.status(200).json({ liked, likes: counts[0]?.likes ?? 0 });
        }
        if (edit) {
          const allowed = await sql`INSERT INTO forum_limits (key,last_post) VALUES (${'edit:' + key},NOW()) ON CONFLICT (key) DO UPDATE SET last_post=NOW() WHERE forum_limits.last_post < NOW() - INTERVAL '3 seconds' RETURNING key`;
          if (!allowed.length) return res.status(429).json({ error: 'Çok sık düzenleme yapıyorsunuz. Birkaç saniye bekleyin.' });
          // Sahiplik ve 30 dakikalık pencere tek sorguda doğrulanır.
          const rows = edit.kind === 'thread'
            ? await sql`UPDATE forum_threads SET body=${edit.body}, edited_at=NOW() WHERE id=${edit.id} AND user_id=${user.id} AND created_at > NOW() - make_interval(secs => ${EDIT_WINDOW_MS / 1000}) RETURNING edited_at`
            : await sql`UPDATE forum_replies SET body=${edit.body}, edited_at=NOW() WHERE id=${edit.id} AND user_id=${user.id} AND created_at > NOW() - make_interval(secs => ${EDIT_WINDOW_MS / 1000}) RETURNING edited_at`;
          if (!rows.length) return res.status(403).json({ error: 'Düzenleme süresi doldu veya bu mesaj size ait değil.' });
          return res.status(200).json({ ok: true, edited_at: rows[0].edited_at });
        }
        input.author = user.username;
        await sql`DELETE FROM forum_limits WHERE last_post < NOW() - INTERVAL '1 day'`;
        const allowed = await sql`INSERT INTO forum_limits (key,last_post) VALUES (${key},NOW()) ON CONFLICT (key) DO UPDATE SET last_post=NOW() WHERE forum_limits.last_post < NOW() - INTERVAL '30 seconds' RETURNING key`;
        if (!allowed.length) return res.status(429).json({ error: 'Yeni mesaj için 30 saniye bekleyin.' });
        const id = crypto.randomUUID();
        if (input.threadId) {
          let quote = null;
          if (input.quoteId) {
            // Yalnızca aynı konudaki onaylı yanıtlar alıntılanabilir.
            const quoted = await sql`SELECT id, author, body FROM forum_replies WHERE id=${input.quoteId} AND thread_id=${input.threadId} AND approved=TRUE`;
            if (!quoted.length) return res.status(409).json({ error: 'Alıntılanan mesaj bulunamadı.' });
            quote = { id: quoted[0].id, author: quoted[0].author, excerpt: quoteExcerpt(quoted[0].body) };
          }
          // Row lock serializes reply insertion with moderation/deletion.
          const rows = await sql`WITH parent AS (SELECT id FROM forum_threads WHERE id=${input.threadId} AND approved=TRUE AND locked=FALSE FOR UPDATE) INSERT INTO forum_replies (id,thread_id,author,body,user_id,quote_id,quote_author,quote_excerpt) SELECT ${id}::uuid,id,${input.author},${input.body},${user.id}::uuid,${quote?.id ?? null},${quote?.author ?? null},${quote?.excerpt ?? null} FROM parent RETURNING id`;
          if (!rows.length) return res.status(409).json({ error: 'Konu kapalı veya yayında değil.' });
        } else {
          await sql`INSERT INTO forum_threads (id,author,title,body,category,user_id) VALUES (${id},${input.author},${input.title},${input.body},${input.category},${user.id})`;
        }
        return res.status(201).json({ id, message: 'Mesajınız alındı. Admin onayından sonra yayınlanacak.' });
      }
      let rows;
      if (req.method === 'DELETE') {
        // Beğeniler hedeflerine yabancı anahtarla bağlı değil; silme sırasında temizlenir.
        if (query.kind === 'thread') {
          await sql`DELETE FROM forum_likes WHERE target_kind='thread' AND target_id=${query.id}`;
          await sql`DELETE FROM forum_likes WHERE target_kind='reply' AND target_id IN (SELECT id FROM forum_replies WHERE thread_id=${query.id})`;
        } else {
          await sql`DELETE FROM forum_likes WHERE target_kind='reply' AND target_id=${query.id}`;
        }
        rows = query.kind === 'thread' ? await sql`DELETE FROM forum_threads WHERE id=${query.id} RETURNING id` : await sql`DELETE FROM forum_replies WHERE id=${query.id} RETURNING id`;
      } else if (req.body.action === 'approve') {
        rows = query.kind === 'thread' ? await sql`UPDATE forum_threads SET approved=TRUE WHERE id=${query.id} RETURNING id` : await sql`UPDATE forum_replies SET approved=TRUE WHERE id=${query.id} RETURNING id`;
      } else if (req.body.action === 'pin' || req.body.action === 'unpin') {
        rows = await sql`UPDATE forum_threads SET pinned=${req.body.action === 'pin'} WHERE id=${query.id} RETURNING id`;
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
