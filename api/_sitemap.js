import { mergeEditorial } from './_editorial.js';
/*
 * /sitemap.xml — yayındaki her şeyi tek yerden bildiren dinamik site haritası.
 *
 * Sabit sayfalar + tüm blog yazıları/tarifler + onaylı forum konuları.
 * Veritabanı geçici olarak erişilemezse yalnızca sabit sayfalar döner:
 * arama motoruna her koşulda geçerli XML verilir.
 *
 * Adres: vercel.json → /sitemap.xml → /api/seo?type=sitemap
 */

import { blogPostPath, DEFAULT_SITE_URL, forumThreadPath, resolveSiteUrl, sectionBase } from './_seo.js';
import { TARGET_LANGS } from './_langs.js';
import { connectDb, listContent, prepareContent } from './_content-db.js';

const xmlEscape = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const isoDay = value => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

/** Bir yazının yayınlanmış çeviri dilleri. */
function translatedLangs(item) {
  const langs = ['tr'];
  for (const lang of TARGET_LANGS) {
    if (String(item?.translations?.[lang]?.title || '').trim() && String(item?.translations?.[lang]?.body || '').trim()) langs.push(lang);
  }
  return langs;
}

/**
 * Saf fonksiyon: site haritası XML'i üretir (testler doğrudan çağırır).
 */
export function buildSitemap({ siteUrl = DEFAULT_SITE_URL, env = process.env, content = [], threads = [], today = new Date() } = {}) {
  const root = String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
  const blog = sectionBase('blog', root, env);
  const forum = sectionBase('forum', root, env);
  const lastmod = isoDay(today);
  const entries = [];

  const add = (loc, options = {}) => entries.push({ loc, lastmod: options.lastmod || lastmod, changefreq: options.changefreq || 'weekly', priority: options.priority ?? 0.7, alternates: options.alternates || [] });

  add(`${root}/`, { changefreq: 'weekly', priority: 1 });
  add(blog.standalone ? `${blog.base}/` : `${root}/blog/`, { changefreq: 'daily', priority: 0.9 });

  for (const item of content) {
    if (!item?.slug) continue;
    const loc = blog.standalone ? `${blog.base}/${encodeURIComponent(item.slug)}/` : `${root}${blogPostPath(item.slug)}`;
    const alternates = translatedLangs(item).map(lang => ({
      lang,
      href: lang === 'tr' ? loc : `${loc}?lang=${lang}`
    }));
    alternates.push({ lang: 'x-default', href: loc });
    add(loc, {
      lastmod: isoDay(item.updated_at || item.published_at || item.date),
      changefreq: 'monthly',
      priority: item.type === 'recipe' ? 0.6 : 0.8,
      alternates
    });
  }

  for (const thread of threads) {
    if (!thread?.id) continue;
    const loc = forum.standalone ? `${forum.base}/t/${encodeURIComponent(thread.id)}/` : `${root}${forumThreadPath(thread.id)}`;
    add(loc, { lastmod: isoDay(thread.created_at), changefreq: 'weekly', priority: 0.5 });
  }

  const urls = entries.map(entry => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
${entry.alternates.map(alt => `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alt.lang)}" href="${xmlEscape(alt.href)}"/>`).join('\n')}${entry.alternates.length ? '\n' : ''}    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

export function createSitemapHandler(options = {}) {
  const connect = options.connect || connectDb;

  return async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Method not allowed');
    }

    const siteUrl = resolveSiteUrl(req.headers || {}, options.env || process.env);
    let content = mergeEditorial();
    let threads = [];

    try {
      const sql = connect();
      await prepareContent(sql);
      content = mergeEditorial(await listContent(sql));
      const rows = await sql`SELECT id, created_at FROM forum_threads WHERE approved=TRUE ORDER BY created_at DESC LIMIT 2000`;
      threads = [...rows];
    } catch (error) {
      console.warn('[sitemap] dinamik içerik atlandı:', error?.message || error);
    }

    const xml = buildSitemap({ siteUrl, env: options.env || process.env, content, threads });
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  };
}

export default createSitemapHandler();
