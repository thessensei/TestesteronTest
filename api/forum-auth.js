import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { prepareForum } from './_forum.js';
import {
  clearForumCookie,
  clearLoginFailures,
  createForumSession,
  destroyForumSession,
  findForumUserByToken,
  forumSessionCookie,
  hashPassword,
  loginAllowed,
  noteLoginFailure,
  readForumToken,
  registerAllowed,
  validateLogin,
  validateRegistration,
  verifyPasswordOrDummy
} from './_forum-auth.js';

function publicUser(user) {
  return user ? { username: user.username } : null;
}

export function createForumAuthHandler(connect = neon) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Yöntem desteklenmiyor.' });
    }
    if (req.method === 'POST') {
      if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'İstek reddedildi.' });
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'JSON gerekli.' });
    }
    if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
      return res.status(503).json({ error: 'Forum henüz yapılandırılmadı.' });
    }

    try {
      const sql = connect(process.env.DATABASE_URL);
      await prepareForum(sql);
      const token = readForumToken(req);

      if (req.method === 'GET') {
        const user = token ? await findForumUserByToken(sql, token) : null;
        if (token && !user) res.setHeader('Set-Cookie', clearForumCookie());
        return res.status(200).json({ user: publicUser(user) });
      }

      const action = req.body?.action;
      if (action === 'logout') {
        if (token) await destroyForumSession(sql, token);
        res.setHeader('Set-Cookie', clearForumCookie());
        return res.status(200).json({ ok: true, user: null });
      }

      if (action === 'register') {
        if (!registerAllowed(req)) return res.status(429).json({ error: 'Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.' });
        let credentials;
        try { credentials = validateRegistration(req.body || {}); } catch (error) {
          return res.status(400).json({ error: error.message });
        }
        const existing = await sql`SELECT id FROM forum_users WHERE username_key = ${credentials.usernameKey}`;
        if (existing.length) return res.status(409).json({ error: 'Bu kullanıcı adı alınmış.' });
        const id = crypto.randomUUID();
        const passwordHash = hashPassword(credentials.password);
        try {
          await sql`INSERT INTO forum_users (id, username, username_key, password_hash) VALUES (${id}, ${credentials.username}, ${credentials.usernameKey}, ${passwordHash})`;
        } catch (error) {
          if (/unique|duplicate/i.test(String(error?.message || error))) {
            return res.status(409).json({ error: 'Bu kullanıcı adı alınmış.' });
          }
          throw error;
        }
        const session = await createForumSession(sql, id);
        res.setHeader('Set-Cookie', forumSessionCookie(session));
        return res.status(201).json({ user: { username: credentials.username } });
      }

      if (action === 'login') {
        if (!loginAllowed(req)) return res.status(429).json({ error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' });
        let credentials;
        try { credentials = validateLogin(req.body || {}); } catch (error) {
          return res.status(400).json({ error: error.message });
        }
        const rows = await sql`SELECT id, username, password_hash FROM forum_users WHERE username_key = ${credentials.usernameKey}`;
        const row = rows[0];
        const matches = verifyPasswordOrDummy(credentials.password, row?.password_hash);
        if (!row || !matches) {
          noteLoginFailure(req);
          return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }
        clearLoginFailures(req);
        const session = await createForumSession(sql, row.id);
        res.setHeader('Set-Cookie', forumSessionCookie(session));
        return res.status(200).json({ user: { username: row.username } });
      }

      return res.status(400).json({ error: 'Geçersiz işlem.' });
    } catch (error) {
      console.error('Forum auth:', error);
      return res.status(500).json({ error: 'Hesap servisine ulaşılamadı. Lütfen tekrar deneyin.' });
    }
  };
}

export default createForumAuthHandler();
