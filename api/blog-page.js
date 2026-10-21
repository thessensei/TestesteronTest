/*
 * /blog/ ve /blog/<slug>/ — sunucu tarafında üretilen blog sayfaları.
 *
 * Amaç: her yazı kendi kalıcı adresinde, tam HTML olarak yayınlansın. Böylece
 * Googlebot içeriği JavaScript çalıştırmadan görür; canonical, Open Graph,
 * JSON-LD (BlogPosting + BreadcrumbList + FAQPage) ve sitemap/RSS aynı kaynaktan beslenir.
 *
 * Adres yönlendirmesi vercel.json içindedir:
 *   /blog            → /api/blog-page
 *   /blog/<slug>/    → /api/blog-page?slug=<slug>
 *   /blog/rss.xml    → /api/blog-rss
 */

import {
  DEFAULT_SITE_URL, SITE_NAME, LANG_LABELS, LANGS,
  absoluteUrl, blogPostPath, breadcrumbLd, escapeHtml, escapeAttr, extractFaq, extractHeadings, extractRecipeSteps,
  formatDate, formatNumber, metaDescription, oneLine, organizationLd, readingLabel,
  readingMinutes, renderNotFound, renderPage, renderRichText, resolveSiteUrl, safeCover,
  sectionBase, seoTitle, stripSourceReferences, websiteLd, wordCount
} from './_seo.js';
import { connectDb, findContentBySlug, listContent, prepareContent } from './_content-db.js';

const T = {
  tr: {
    eyebrow: 'TESTOTAVAN DERGİ', title: 'Hormon, uyku ve güç üzerine okunabilir rehber.',
    intro: 'Klinik araştırmaları sadeleştiren, günlük hayata çevrilebilir yazılar ve yüksek proteinli tarifler.',
    latest: 'Son yazılar', all: 'Tümü', recipes: 'Tarifler', articles: 'Yazılar', posts: 'yazı',
    readMore: 'Yazıyı oku', minRead: 'dk okuma', updated: 'Güncellendi',
    home: 'Ana sayfa', blog: 'Blog', share: 'Paylaş', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı',
    related: 'İlgili yazılar', toc: 'İçindekiler', ingredients: 'Malzemeler',
    ctaTitle: 'Kendi tablonu gör', ctaBody: 'İki dakikada belirtilerine göre ön değerlendirme al; sonuçlar cihazında kalır.',
    ctaButton: 'Analizi başlat', forumButton: 'Topluluğa katıl',
    forumCtaTitle: 'Bu konuyu konuşmak ister misin?', forumCtaBody: 'TestoTavan Meydanı’nda deneyimini paylaş; sorularına topluluktan yanıt al.',
    emptyTitle: 'Henüz yayınlanmış yazı yok', emptyBody: 'İlk yazı yayınlandığında burada listelenecek.',
    author: 'TestoTavan Editör Ekibi', published: 'Yayın'
  },
  en: {
    eyebrow: 'THE TESTOTAVAN JOURNAL', title: 'A readable guide to hormones, sleep and strength.',
    intro: 'Articles that translate clinical research into daily habits, plus high-protein recipes.',
    latest: 'Latest posts', all: 'All', recipes: 'Recipes', articles: 'Articles', posts: 'posts',
    readMore: 'Read article', minRead: 'min read', updated: 'Updated',
    home: 'Home', blog: 'Blog', share: 'Share', copy: 'Copy link', copied: 'Copied',
    related: 'Related posts', toc: 'Contents', ingredients: 'Ingredients',
    ctaTitle: 'See your own picture', ctaBody: 'Run a two-minute symptom check; results stay on your device.',
    ctaButton: 'Start the check', forumButton: 'Join the community',
    forumCtaTitle: 'Want to talk this through?', forumCtaBody: 'Share your experience in the TestoTavan Commons and get answers from the community.',
    emptyTitle: 'No posts published yet', emptyBody: 'The first article will appear here.',
    author: 'TestoTavan Editorial Team', published: 'Published'
  },
  de: {
    eyebrow: 'DAS TESTOTAVAN JOURNAL', title: 'Ein lesbarer Leitfaden zu Hormonen, Schlaf und Kraft.',
    intro: 'Artikel, die klinische Forschung in Alltagsgewohnheiten übersetzen, plus proteinreiche Rezepte.',
    latest: 'Neueste Beiträge', all: 'Alle', recipes: 'Rezepte', articles: 'Artikel', posts: 'Beiträge',
    readMore: 'Artikel lesen', minRead: 'Min. Lesezeit', updated: 'Aktualisiert',
    home: 'Startseite', blog: 'Blog', share: 'Teilen', copy: 'Link kopieren', copied: 'Kopiert',
    related: 'Ähnliche Beiträge', toc: 'Inhalt', ingredients: 'Zutaten',
    ctaTitle: 'Dein eigenes Bild', ctaBody: 'Mach den Zwei-Minuten-Symptomcheck; Ergebnisse bleiben auf deinem Gerät.',
    ctaButton: 'Check starten', forumButton: 'Community beitreten',
    forumCtaTitle: 'Möchtest du darüber sprechen?', forumCtaBody: 'Teile deine Erfahrung im TestoTavan-Forum und erhalte Antworten.',
    emptyTitle: 'Noch keine Beiträge', emptyBody: 'Der erste Artikel erscheint hier.',
    author: 'TestoTavan Redaktion', published: 'Veröffentlicht'
  },
  ja: {
    eyebrow: 'TESTOTAVAN ジャーナル', title: 'ホルモン・睡眠・筋力についての読みやすいガイド。',
    intro: '臨床研究を日常の習慣に翻訳する記事と、高たんぱくレシピ。',
    latest: '最新の記事', all: 'すべて', recipes: 'レシピ', articles: '記事', posts: '記事',
    readMore: '記事を読む', minRead: '分で読めます', updated: '更新',
    home: 'ホーム', blog: 'ブログ', share: '共有', copy: 'リンクをコピー', copied: 'コピーしました',
    related: '関連記事', toc: '目次', ingredients: '材料',
    ctaTitle: '自分の状態を確認', ctaBody: '2分の症状チェック。結果は端末内に保持されます。',
    ctaButton: 'チェックを開始', forumButton: 'コミュニティに参加',
    forumCtaTitle: 'この話題について話しませんか？', forumCtaBody: 'TestoTavanフォーラムで経験を共有しましょう。',
    emptyTitle: 'まだ記事がありません', emptyBody: '最初の記事がここに表示されます。',
    author: 'TestoTavan 編集部', published: '公開'
  }
};

function normalizeLang(value) {
  const lang = oneLine(value, 4).toLowerCase();
  return LANGS.includes(lang) ? lang : 'tr';
}

/** Yazıyı istenen dile çevirir; çeviri yoksa Türkçe içerik korunur. */
export function localizedContent(item, lang) {
  if (!item) return null;
  if (lang === 'tr') return item;
  const t = item.translations?.[lang] || {};
  const ingredients = Array.isArray(t.ingredients) && t.ingredients.length ? t.ingredients : item.ingredients;
  return {
    ...item,
    category: t.category || item.category,
    title: t.title || item.title,
    summary: t.summary || item.summary,
    body: t.body || item.body,
    time: t.time || item.time,
    ingredients
  };
}

function availableLangs(item) {
  const langs = ['tr'];
  for (const lang of ['en', 'de', 'ja']) {
    if (oneLine(item?.translations?.[lang]?.title, 100) && oneLine(item?.translations?.[lang]?.body, 400)) langs.push(lang);
  }
  return langs;
}

function postHref(slug, blog) {
  return blog.standalone ? `/${encodeURIComponent(slug)}/` : blogPostPath(slug);
}

function hubHref(blog) {
  return blog.standalone ? '/' : '/blog/';
}

function cardHtml(item, blog, lang) {
  const cover = safeCover(item.cover_url, blog.base);
  const t = T[lang];
  const isRecipe = item.type === 'recipe';
  return `<a class="post-card" href="${escapeAttr(postHref(item.slug, blog))}">
  <div class="cover${cover ? '' : ' emoji'}"${cover ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.5)),url('${escapeAttr(cover)}')"` : ''}>${cover ? '' : escapeHtml(item.emoji || '📄')}</div>
  <div class="card-body">
    <div><span class="badge${isRecipe ? ' recipe' : ''}">${escapeHtml(isRecipe ? t.recipes : t.articles)}</span></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(metaDescription(item.summary, item.body, 120) || '')}</p>
    <div class="meta"><span>${escapeHtml(item.category)}</span><span>${escapeHtml(item.time || '')}</span><span>${escapeHtml(formatDate(item.published_at || item.date, lang))}</span></div>
  </div>
</a>`;
}

/* ------------------------------------------------------------------- hub */

export function renderBlogHub({ items = [], siteUrl = DEFAULT_SITE_URL, env = process.env, lang = 'tr', category = '' }) {
  const t = T[lang];
  const blog = sectionBase('blog', siteUrl, env);
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  const filtered = category ? items.filter(item => item.category === category) : items;
  const published = items.map(item => item.published_at || item.date).filter(Boolean).sort().at(-1);
  const canonical = blog.standalone ? `${blog.base}/` : `${siteUrl}/blog/`;
  const description = lang === 'tr'
    ? 'TestoTavan Dergi: testosteron, uyku, beslenme ve antrenman üzerine kanıta dayalı yazılar ve yüksek proteinli tarifler.'
    : t.intro;
  const feature = filtered[0];
  const rest = filtered.slice(1);
  const categoriesChips = [`<a class="chip" href="${escapeAttr(hubHref(blog))}"${category ? '' : ' aria-current="page"'}>${escapeHtml(t.all)} · ${formatNumber(items.length, lang)}</a>`]
    .concat(categories.map(name => `<a class="chip" href="${escapeAttr(hubHref(blog))}?kategori=${encodeURIComponent(name)}"${category === name ? ' aria-current="page"' : ''}>${escapeHtml(name)} · ${formatNumber(items.filter(item => item.category === name).length, lang)}</a>`))
    .join('');

  const body = `<div class="wrap">
  <section class="hero">
    <div class="eyebrow">${escapeHtml(t.eyebrow)}</div>
    <h1>${escapeHtml(t.title)}</h1>
    <p>${escapeHtml(t.intro)}</p>
    <div class="hero-stats">
      <div class="stat"><b>${formatNumber(items.length, lang)}</b><span>${escapeHtml(t.posts)}</span></div>
      <div class="stat"><b>${formatNumber(categories.length, lang)}</b><span>${lang === 'tr' ? 'kategori' : 'categories'}</span></div>
      <div class="stat"><b>${escapeHtml(published ? formatDate(published, lang) : '—')}</b><span>${escapeHtml(t.updated)}</span></div>
    </div>
  </section>

  <nav class="chips" aria-label="${escapeAttr(lang === 'tr' ? 'Kategoriler' : 'Categories')}">${categoriesChips}</nav>

  ${feature ? `<a class="feature" href="${escapeAttr(postHref(feature.slug, blog))}">
    <div class="${safeCover(feature.cover_url, blog.base) ? 'cover' : 'cover emoji'}"${safeCover(feature.cover_url, blog.base) ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.5)),url('${escapeAttr(safeCover(feature.cover_url, blog.base))}')"` : ''}>${safeCover(feature.cover_url, blog.base) ? '' : escapeHtml(feature.emoji || '📄')}</div>
    <div class="feature-body">
      <div><span class="badge${feature.type === 'recipe' ? ' recipe' : ''}">${escapeHtml(feature.type === 'recipe' ? t.recipes : t.articles)}</span></div>
      <div class="eyebrow" style="color:var(--muted)">${escapeHtml(feature.category)}</div>
      <h2>${escapeHtml(feature.title)}</h2>
      <p>${escapeHtml(metaDescription(feature.summary, feature.body, 200) || '')}</p>
      <div class="meta"><span>${escapeHtml(formatDate(feature.published_at || feature.date, lang))}</span><span>${escapeHtml(readingLabel(readingMinutes(feature.body), lang))}</span><span>${escapeHtml(t.readMore)} →</span></div>
    </div>
  </a>` : `<div class="empty"><strong>${escapeHtml(t.emptyTitle)}</strong><p>${escapeHtml(t.emptyBody)}</p></div>`}

  ${rest.length ? `<div class="section-head"><h2>${escapeHtml(t.latest)}</h2><span>${formatNumber(rest.length, lang)}</span></div>
  <div class="cards">${rest.map(item => cardHtml(item, blog, lang)).join('\n')}</div>` : ''}

  <div class="cta">
    <div><h2>${escapeHtml(t.ctaTitle)}</h2><p>${escapeHtml(t.ctaBody)}</p></div>
    <div class="cta-actions"><a class="button" href="${escapeAttr(`${siteUrl}/#physicalPage`)}">${escapeHtml(t.ctaButton)} →</a><a class="button ghost" href="${escapeAttr(`${siteUrl}/forum/`)}">${escapeHtml(t.forumButton)} →</a></div>
  </div>
</div>`;

  const itemList = {
    '@type': 'ItemList',
    itemListElement: items.slice(0, 30).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: blog.standalone ? absoluteUrl(`/${encodeURIComponent(item.slug)}/`, blog.base) : absoluteUrl(blogPostPath(item.slug), siteUrl),
      name: item.title
    }))
  };

  return renderPage({
    lang, siteUrl, section: 'blog', theme: 'editorial',
    title: seoTitle(lang === 'tr' ? 'Blog — Hormon, uyku ve güç rehberi' : t.title, lang),
    description, canonical, ogType: 'website',
    jsonLd: [
      { '@context': 'https://schema.org', '@graph': [organizationLd(siteUrl), websiteLd(siteUrl), itemList, breadcrumbLd([{ name: SITE_NAME, path: '/' }, { name: 'Blog', path: '/blog/' }], siteUrl)] }
    ],
    body
  });
}

/* --------------------------------------------------------------- makale */

const SHARE = (url, title, lang) => {
  const enc = encodeURIComponent;
  const label = { tr: { x: 'X', wa: 'WhatsApp', li: 'LinkedIn', cp: 'Bağlantıyı kopyala' }, en: { x: 'X', wa: 'WhatsApp', li: 'LinkedIn', cp: 'Copy link' }, de: { x: 'X', wa: 'WhatsApp', li: 'LinkedIn', cp: 'Link kopieren' }, ja: { x: 'X', wa: 'WhatsApp', li: 'LinkedIn', cp: 'リンクをコピー' } }[lang];
  return `<div class="share"><span>${escapeHtml(T[lang].share)}</span>
    <a href="https://x.com/intent/tweet?text=${enc(title)}&amp;url=${enc(url)}" rel="nofollow noopener" target="_blank">${label.x}</a>
    <a href="https://api.whatsapp.com/send?text=${enc(`${title} ${url}`)}" rel="nofollow noopener" target="_blank">${label.wa}</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}" rel="nofollow noopener" target="_blank">${label.li}</a>
    <button class="chip" type="button" id="copyLink" data-url="${escapeAttr(url)}">${escapeHtml(label.cp)}</button>
  </div>`;
};

export function renderBlogPost({ item, related = [], siteUrl = DEFAULT_SITE_URL, env = process.env, lang = 'tr' }) {
  const t = T[lang];
  const blog = sectionBase('blog', siteUrl, env);
  const view = localizedContent(item, lang);
  const langs = availableLangs(item);
  const cover = safeCover(item.cover_url, blog.base);
  const bodyText = stripSourceReferences(view.body || '');
  const headings = extractHeadings(bodyText);
  const faq = extractFaq(bodyText, lang);
  const path = blog.standalone ? `/${encodeURIComponent(item.slug)}/` : blogPostPath(item.slug);
  const canonical = blog.standalone ? absoluteUrl(`/${encodeURIComponent(item.slug)}/`, blog.base) : absoluteUrl(blogPostPath(item.slug), siteUrl);
  const canonicalFor = code => (code === 'tr' ? canonical : `${canonical}?lang=${code}`);
  const alternates = langs.map(code => ({ lang: code, href: canonicalFor(code) }));
  alternates.push({ lang: 'x-default', href: canonical });
  const description = metaDescription(view.summary, bodyText, 158) || oneLine(view.title, 158);
  const isRecipe = item.type === 'recipe';
  const reading = readingLabel(readingMinutes(bodyText), lang);

  const toc = headings.length >= 3
    ? `<nav class="toc" aria-label="${escapeAttr(t.toc)}"><h2>${escapeHtml(t.toc)}</h2><ol>${headings.map(heading => `<li><a href="#${escapeAttr(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol></nav>`
    : '';

  const ingredients = isRecipe && Array.isArray(view.ingredients) && view.ingredients.length
    ? `<section class="ingredients"><h2>${escapeHtml(t.ingredients)}</h2><ul>${view.ingredients.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section>`
    : '';

  const relatedHtml = related.length
    ? `<div class="section-head"><h2>${escapeHtml(t.related)}</h2><a class="chip" href="${escapeAttr(hubHref(blog))}">${escapeHtml(t.blog)} →</a></div><div class="cards">${related.map(entry => cardHtml(entry, blog, lang)).join('')}</div>`
    : '';

  const langSwitch = langs.length > 1
    ? `<div class="chips" aria-label="Language">${langs.map(code => `<a class="chip" href="${escapeAttr(canonicalFor(code))}" hreflang="${code}"${code === lang ? ' aria-current="page"' : ''}>${LANG_LABELS[code]}</a>`).join('')}</div>`
    : '';

  const articleLd = {
    '@type': isRecipe ? 'Recipe' : 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: oneLine(view.title, 110),
    name: oneLine(view.title, 110),
    description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: [cover || `${siteUrl}/assets/logo.png`],
    datePublished: item.published_at ? new Date(item.published_at).toISOString() : undefined,
    dateModified: item.updated_at ? new Date(item.updated_at).toISOString() : undefined,
    inLanguage: lang,
    articleSection: view.category,
    keywords: [view.category, ...(isRecipe ? ['tarif', 'yüksek protein'] : ['testosteron', 'hormon sağlığı', 'uyku'])].join(', '),
    wordCount: wordCount(bodyText),
    author: { '@type': 'Organization', name: t.author, url: `${siteUrl}/` },
    publisher: { '@id': `${siteUrl}/#organization` },
    isAccessibleForFree: true,
    ...(isRecipe
      ? {
          recipeCategory: view.category,
          recipeIngredient: Array.isArray(view.ingredients) ? view.ingredients : [],
          ...(extractRecipeSteps(bodyText).length
            ? { recipeInstructions: extractRecipeSteps(bodyText).map(step => ({ '@type': 'HowToStep', text: step })) }
            : {})
        }
      : { timeRequired: `PT${readingMinutes(bodyText)}M` })
  };

  const graph = [organizationLd(siteUrl), websiteLd(siteUrl), articleLd, breadcrumbLd([
    { name: SITE_NAME, path: '/' },
    { name: 'Blog', path: '/blog/' },
    { name: oneLine(view.title, 90), path: path }
  ], siteUrl)];
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: canonicalFor(lang),
      inLanguage: lang,
      mainEntity: faq.map(entry => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer }
      }))
    });
  }

  const body = `<div class="wrap narrow">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${siteUrl}/">${escapeHtml(t.home)}</a><span aria-hidden="true">/</span>
    <a href="${escapeAttr(hubHref(blog))}">${escapeHtml(t.blog)}</a><span aria-hidden="true">/</span>
    <span>${escapeHtml(view.category)}</span>
  </nav>
  <article>
    <header class="article-head">
      <div class="eyebrow">${escapeHtml(view.category)}</div>
      <h1>${escapeHtml(view.title)}</h1>
      <p class="lead">${escapeHtml(view.summary || description)}</p>
      <div class="byline">
        <span class="avatar" aria-hidden="true">TT</span>
        <span>${escapeHtml(t.author)}</span>
        <time datetime="${escapeAttr(item.published_at || item.date || '')}">${escapeHtml(formatDate(item.published_at || item.date, lang))}</time>
        <span>${escapeHtml(reading)}</span>
        ${isRecipe ? `<span>${escapeHtml(view.time || '')}</span>` : ''}
      </div>
      ${langSwitch}
    </header>
    ${cover ? `<div class="hero-cover" role="img" aria-label="${escapeAttr(view.title)}" style="background-image:url('${escapeAttr(cover)}')"></div>` : ''}
    ${toc}
    ${ingredients}
    <div class="article-body">${renderRichText(bodyText)}</div>
    ${SHARE(canonical, view.title, lang)}
    <div class="cta">
      <div><h2>${escapeHtml(t.forumCtaTitle)}</h2><p>${escapeHtml(t.forumCtaBody)}</p></div>
      <a class="button" href="${escapeAttr(`${siteUrl}/forum/`)}">${escapeHtml(t.forumButton)} →</a>
    </div>
    <div class="cta">
      <div><h2>${escapeHtml(t.ctaTitle)}</h2><p>${escapeHtml(t.ctaBody)}</p></div>
      <a class="button ghost" href="${escapeAttr(`${siteUrl}/#physicalPage`)}">${escapeHtml(t.ctaButton)} →</a>
    </div>
    <p class="disclaimer">${lang === 'tr'
      ? 'Bu yazı bilgilendirme amaçlıdır ve tıbbi tanı, tedavi veya reçete yerine geçmez. Sağlık kararlarınızı hekiminizle birlikte alın. Metin editoryal ekibimizce bağımsız olarak hazırlanır; alıntı listesi yayınlanmaz.'
      : 'This article is for information only and is not a substitute for medical diagnosis, treatment or prescription. Decide together with your physician.'}</p>
  </article>
  ${relatedHtml}
</div>
<script>
(function(){
  var button=document.getElementById('copyLink');
  if(button){button.addEventListener('click',function(){var url=button.getAttribute('data-url');var done=function(){button.textContent=${JSON.stringify(t.copied)};setTimeout(function(){button.textContent=${JSON.stringify(t.copy)};},1600);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(function(){});}});}
})();
</script>`;

  return renderPage({
    lang, siteUrl, section: 'blog', theme: 'editorial',
    title: seoTitle(view.title, lang),
    description,
    canonical: canonicalFor(lang),
    ogType: 'article',
    ogImage: cover || undefined,
    publishedTime: item.published_at ? new Date(item.published_at).toISOString() : '',
    modifiedTime: item.updated_at ? new Date(item.updated_at).toISOString() : '',
    robots: 'index,follow,max-image-preview:large,max-snippet:-1',
    alternates,
    jsonLd: [{ '@context': 'https://schema.org', '@graph': graph }],
    body
  });
}

/* --------------------------------------------------------------- handler */

export function createBlogPageHandler(options = {}) {
  const connect = options.connect || connectDb;

  return async function handler(req, res) {
    const query = req.query || {};
    const headers = req.headers || {};
    const siteUrl = resolveSiteUrl(headers, options.env || process.env);
    const lang = normalizeLang(query.lang);
    const slug = oneLine(String(query.slug || query.path || '').replace(/^\/+|\/+$/g, ''), 200);
    const category = oneLine(query.kategori || query.category || '', 60);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', slug ? 'public, s-maxage=300, stale-while-revalidate=86400' : 'public, s-maxage=120, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Yöntem desteklenmiyor.');
    }

    const isHub = !slug || slug === 'index.html';
    let sql = null;
    try {
      sql = connect();
      await prepareContent(sql);
    } catch (error) {
      console.warn('[blog-page] veritabanına ulaşılamadı:', error?.message || error);
      sql = null;
    }

    try {
      if (isHub) {
        const items = sql ? await listContent(sql) : [];
        const html = renderBlogHub({ items, siteUrl, env: options.env || process.env, lang, category });
        res.setHeader('Content-Language', lang);
        return res.status(200).send(html);
      }

      const item = sql ? await findContentBySlug(sql, slug) : null;
      if (!item) {
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        return res.status(404).send(renderNotFound({ siteUrl, section: 'blog', lang }));
      }

      let related = [];
      if (sql) {
        const all = await listContent(sql);
        related = all
          .filter(entry => entry.id !== item.id && entry.slug !== item.slug)
          .sort((a, b) => Number(b.category === item.category) - Number(a.category === item.category))
          .slice(0, 3);
      }

      const html = renderBlogPost({ item, related, siteUrl, env: options.env || process.env, lang });
      res.setHeader('Content-Language', lang);
      return res.status(200).send(html);
    } catch (error) {
      console.error('[blog-page]', error);
      return res.status(500).send(renderNotFound({ siteUrl, section: 'blog', lang }));
    }
  };
}

export default createBlogPageHandler();
