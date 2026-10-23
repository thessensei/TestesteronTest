import { mergeEditorial } from './_editorial.js';
/*
 * /blog/rss.xml — TestoTavan Dergi akışı.
 *
 * RSS, arama motorları ve içerik toplayıcılar için ikinci bir keşif kanalıdır;
 * her yazının canonical adresi, özeti ve kapak görseliyle listelenir.
 *
 * Adres: vercel.json → /blog/rss.xml → /api/seo?type=rss
 */

import { blogPostPath, DEFAULT_SITE_URL, metaDescription, oneLine, resolveSiteUrl, safeCover, sectionBase, stripSourceReferences } from './_seo.js';
import { connectDb, listContent, prepareContent } from './_content-db.js';

const xmlEscape = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const rfc822 = value => {
  const date = new Date(value || Date.now());
  return (Number.isNaN(date.getTime()) ? new Date() : date).toUTCString();
};

/** Saf fonksiyon: RSS 2.0 XML üretir. */
export function buildFeed({ siteUrl = DEFAULT_SITE_URL, env = process.env, items = [], limit = 40 } = {}) {
  const root = String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
  const blog = sectionBase('blog', root, env);
  const hubUrl = blog.standalone ? `${blog.base}/` : `${root}/blog/`;
  const selfUrl = blog.standalone ? `${blog.base}/rss.xml` : `${root}/blog/rss.xml`;
  const feedItems = items.slice(0, limit).map(item => {
    const loc = blog.standalone ? `${blog.base}/${encodeURIComponent(item.slug)}/` : `${root}${blogPostPath(item.slug)}`;
    const cover = safeCover(item.cover_url, root);
    const summary = metaDescription(item.summary, stripSourceReferences(item.body), 300);
    return `    <item>
      <title>${xmlEscape(oneLine(item.title, 160))}</title>
      <link>${xmlEscape(loc)}</link>
      <guid isPermaLink="true">${xmlEscape(loc)}</guid>
      <pubDate>${rfc822(item.published_at || item.date)}</pubDate>
      <category>${xmlEscape(item.category)}</category>
      <description>${xmlEscape(summary)}</description>
${cover ? `      <enclosure url="${xmlEscape(cover)}" type="image/jpeg" length="0"/>\n` : ''}    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>TestoTavan Dergi</title>
    <link>${xmlEscape(hubUrl)}</link>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml"/>
    <description>Hormon sağlığı, uyku, beslenme ve antrenman üzerine kanıta dayalı yazılar.</description>
    <language>tr</language>
    <lastBuildDate>${rfc822(items[0]?.updated_at || items[0]?.published_at || items[0]?.date)}</lastBuildDate>
${feedItems}
  </channel>
</rss>
`;
}

export function createBlogRssHandler(options = {}) {
  const connect = options.connect || connectDb;

  return async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Method not allowed');
    }

    const siteUrl = resolveSiteUrl(req.headers || {}, options.env || process.env);
    let items = mergeEditorial();
    try {
      const sql = connect();
      await prepareContent(sql);
      items = mergeEditorial(await listContent(sql));
    } catch (error) {
      console.warn('[blog-rss] içerik okunamadı:', error?.message || error);
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    return res.status(200).send(buildFeed({ siteUrl, env: options.env || process.env, items }));
  };
}

export default createBlogRssHandler();
