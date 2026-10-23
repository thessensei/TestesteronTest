#!/usr/bin/env node
// Yerel önizleme: Vercel blog/API yollarını aynı origin üzerinde çalıştırır.
// Üretim sunucusu değildir; sırlar, kaynak kod ve private API modülleri sunulmaz.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../vercel.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
const apiNames = new Set(['about', 'content', 'seo', 'session', 'login', 'stats', 'forum', 'forum-auth', 'ai-blog']);

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status = code => { res.statusCode = code; return res; };
  res.send = body => { res.end(req.method === 'HEAD' ? undefined : body); return res; };
  res.json = data => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.send(JSON.stringify(data)); };
  try {
    const url = new URL(req.url, 'http://preview.invalid');
    const pathname = decodeURIComponent(url.pathname);
    const redirect = config.redirects.find(rule => rule.source === pathname);
    if (redirect) {
      res.setHeader('Location', redirect.destination + url.search);
      return res.status(308).send('Blog adresine taşındı.');
    }
    req.query = Object.fromEntries(url.searchParams);
    let api;
    if (pathname === '/blog/rss.xml' || pathname === '/feed.xml') { api = 'seo'; req.query.type = 'rss'; }
    else if (pathname === '/sitemap.xml') { api = 'seo'; req.query.type = 'sitemap'; }
    else if (/^\/blog(?:\/|$)/.test(pathname)) { api = 'seo'; req.query.type = 'blog'; req.query.slug = pathname.slice(5).replace(/^\/+|\/+$/g, ''); }
    else if (pathname.startsWith('/forum/t/')) { api = 'seo'; req.query.type = 'thread'; req.query.id = pathname.slice(9).replace(/\/$/, ''); }
    else if (pathname === '/api/forum-stats') { api = 'forum'; req.query.stats = '1'; }
    else if (pathname.startsWith('/api/')) api = pathname.slice(5);
    if (api) {
      if (!apiNames.has(api)) return res.status(404).send('Not found');
      if (!['GET', 'HEAD'].includes(req.method)) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 1024 * 1024) return res.status(413).send('Request too large');
          chunks.push(chunk);
        }
        try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
        catch { return res.status(400).json({ error: 'Geçersiz JSON.' }); }
      }
      const { default: handler } = await import(`../api/${api}.js`);
      return await handler(req, res);
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Method not allowed');
    }
    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    if (relative === 'admin' || relative === 'admin/') relative = 'admin/index.html';
    if (!/^(index\.html|robots\.txt|google[\w]+\.html|(?:assets|js|admin)\/[\w./-]+)$/.test(relative)) return res.status(404).send('Not found');
    const resolved = await fs.realpath(path.resolve(root, relative));
    if (!resolved.startsWith(root + path.sep) || relative.split('/').some(part => part.startsWith('.'))) return res.status(404).send('Not found');
    const data = await fs.readFile(resolved);
    res.setHeader('Content-Type', types[path.extname(resolved)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(data);
  } catch (error) {
    if (res.headersSent) return res.end();
    if (['ENOENT', 'EISDIR'].includes(error.code)) return res.status(404).send('Not found');
    console.error('[preview]', error.message);
    return res.status(500).json({ error: 'Önizleme isteği tamamlanamadı.' });
  }
}).listen(port, '0.0.0.0', () => console.log(`TestoTavan preview: http://0.0.0.0:${port}/blog/`));
