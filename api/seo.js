/*
 * /api/seo — blog, RSS, site haritası ve forum konu sayfalarının tek giriş noktası.
 *
 * Vercel Hobby planında sunucu fonksiyonu sayısı sınırlı olduğu için dört ayrı
 * uç nokta tek bir ince yönlendiriciye toplandı; gerçek işi `api/_*.js`
 * modülleri yapar ve doğrudan test edilir.
 *
 *   /blog/            → /api/seo?type=blog
 *   /blog/<slug>/     → /api/seo?type=blog&slug=<slug>
 *   /blog/rss.xml     → /api/seo?type=rss
 *   /sitemap.xml      → /api/seo?type=sitemap
 *   /forum/t/<id>/    → /api/seo?type=thread&id=<id>
 */

import { createBlogPageHandler } from './_blog-page.js';
import { createBlogRssHandler } from './_blog-rss.js';
import { createForumPageHandler } from './_forum-page.js';
import { createSitemapHandler } from './_sitemap.js';

const routes = {
  blog: createBlogPageHandler(),
  rss: createBlogRssHandler(),
  sitemap: createSitemapHandler(),
  thread: createForumPageHandler()
};

export function resolveSeoRoute(query = {}) {
  const type = String(query.type || 'blog').toLowerCase();
  return routes[type] || routes.blog;
}

export default async function handler(req, res) {
  return resolveSeoRoute(req.query).call(null, req, res);
}
