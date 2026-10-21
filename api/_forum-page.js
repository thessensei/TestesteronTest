/*
 * /forum/t/<id>/ — forum konularının sunucu tarafında üretilen, aranabilir sayfası.
 *
 * İnteraktif forum (/forum/) aynen kalır; bu sayfa her konunun kalıcı adresidir.
 * Böylece arama motorları ve paylaşım önizlemeleri konu başlığını, ilk mesajı ve
 * onaylı yanıtları JavaScript çalıştırmadan görür (DiscussionForumPosting JSON-LD).
 *
 * Adres: vercel.json → /forum/t/<id>/ → /api/seo?type=thread&id=<id>
 */

import { neon } from '@neondatabase/serverless';
import {
  DEFAULT_SITE_URL, SITE_NAME, absoluteUrl, breadcrumbLd, escapeHtml, escapeAttr,
  formatDate, formatNumber, forumThreadPath, metaDescription, oneLine,
  organizationLd, renderNotFound, renderPage, resolveSiteUrl, sectionBase, websiteLd
} from './_seo.js';
import { prepareForum } from './_forum.js';

const T = {
  tr: {
    home: 'Ana sayfa', forum: 'Forum', back: '← Tüm konular', replies: 'yanıt', views: 'görüntülenme',
    likes: 'beğeni', join: 'Sohbete katıl', replyCta: 'Yanıt yaz', locked: 'Bu konu yeni yanıtlara kapalı.',
    noReplies: 'Henüz yanıt yok. İlk yanıtı sen yaz.', related: 'Benzer konular', pinned: 'Sabit konu',
    author: 'Konu sahibi', member: 'Topluluk üyesi', moderation: 'Konular admin onayından sonra yayınlanır. Kişisel sağlık verisi paylaşmayın; buradaki içerik tıbbi tavsiye değildir.',
    share: 'Bağlantıyı kopyala', copied: 'Kopyalandı', newReply: 'Yanıt', quote: 'Alıntı'
  },
  en: {
    home: 'Home', forum: 'Forum', back: '← All topics', replies: 'replies', views: 'views',
    likes: 'likes', join: 'Join the conversation', replyCta: 'Write a reply', locked: 'This topic is closed to new replies.',
    noReplies: 'No replies yet. Be the first to answer.', related: 'Similar topics', pinned: 'Pinned',
    author: 'Topic author', member: 'Community member', moderation: 'Topics go live after admin approval. Do not share personal health data; this is not medical advice.',
    share: 'Copy link', copied: 'Copied', newReply: 'Reply', quote: 'Quote'
  },
  de: {
    home: 'Startseite', forum: 'Forum', back: '← Alle Themen', replies: 'Antworten', views: 'Aufrufe',
    likes: 'Likes', join: 'Mitreden', replyCta: 'Antwort schreiben', locked: 'Dieses Thema ist für neue Antworten geschlossen.',
    noReplies: 'Noch keine Antworten. Sei die erste Person.', related: 'Ähnliche Themen', pinned: 'Angepinnt',
    author: 'Themenautor', member: 'Community-Mitglied', moderation: 'Themen erscheinen nach Admin-Freigabe. Teile keine persönlichen Gesundheitsdaten; dies ist kein medizinischer Rat.',
    share: 'Link kopieren', copied: 'Kopiert', newReply: 'Antwort', quote: 'Zitat'
  },
  ja: {
    home: 'ホーム', forum: 'フォーラム', back: '← すべてのトピック', replies: '返信', views: '閲覧',
    likes: 'いいね', join: '会話に参加', replyCta: '返信を書く', locked: 'このトピックは新しい返信を受け付けていません。',
    noReplies: 'まだ返信はありません。最初の返信を書きましょう。', related: '関連トピック', pinned: '固定',
    author: 'トピック作成者', member: 'コミュニティメンバー', moderation: 'トピックは管理者の承認後に公開されます。個人の健康データを共有しないでください。医学的助言ではありません。',
    share: 'リンクをコピー', copied: 'コピーしました', newReply: '返信', quote: '引用'
  }
};

const INITIALS = name => {
  const parts = String(name || '').trim().split(/[\s_.-]+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toLocaleUpperCase('tr');
};

function rankLabel(posts, lang) {
  const total = Number(posts) || 0;
  const key = total >= 100 ? 'veteran' : total >= 25 ? 'active' : total >= 5 ? 'member' : 'new';
  return ({
    tr: { veteran: 'Kıdemli üye', active: 'Aktif üye', member: 'Üye', new: 'Yeni üye' },
    en: { veteran: 'Veteran', active: 'Active member', member: 'Member', new: 'Newcomer' },
    de: { veteran: 'Veteran', active: 'Aktives Mitglied', member: 'Mitglied', new: 'Neu dabei' },
    ja: { veteran: 'ベテラン', active: 'アクティブ', member: 'メンバー', new: '新規' }
  }[lang] || {})[key] || key;
}

function normalizeLang(value) {
  const lang = oneLine(value, 4).toLowerCase();
  return ['tr', 'en', 'de', 'ja'].includes(lang) ? lang : 'tr';
}

const categoryLabel = (value, lang) => ({
  tr: { Genel: 'Genel', Antrenman: 'Antrenman', Beslenme: 'Beslenme', Deneyimler: 'Deneyimler' },
  en: { Genel: 'General', Antrenman: 'Training', Beslenme: 'Nutrition', Deneyimler: 'Experiences' },
  de: { Genel: 'Allgemein', Antrenman: 'Training', Beslenme: 'Ernährung', Deneyimler: 'Erfahrungen' },
  ja: { Genel: '一般', Antrenman: 'トレーニング', Beslenme: '栄養', Deneyimler: '体験談' }
}[lang] || {})[value] || value;

/** Konu sayfasının tüm HTML'i (saf fonksiyon — testler doğrudan çağırır). */
export function renderForumThread({ thread, replies = [], related = [], authorPosts = new Map(), siteUrl = DEFAULT_SITE_URL, env = process.env, lang = 'tr' }) {
  const t = T[lang];
  const forum = sectionBase('forum', siteUrl, env);
  const path = forum.standalone ? `/t/${encodeURIComponent(thread.id)}/` : forumThreadPath(thread.id);
  const canonical = forum.standalone ? absoluteUrl(`/t/${encodeURIComponent(thread.id)}/`, forum.base) : absoluteUrl(forumThreadPath(thread.id), siteUrl);
  const hubHref = forum.standalone ? `${forum.base}/` : `${siteUrl}/forum/`;
  const joinHref = `${siteUrl}/forum/#thread=${encodeURIComponent(thread.id)}`;
  const description = metaDescription(thread.body, thread.body, 158);
  const posts = (name) => Number(authorPosts.get?.(name) || 0);

  const replyHtml = replies.length
    ? replies.map(reply => `<article class="reply" id="reply-${escapeAttr(reply.id)}">
      <span class="avatar" aria-hidden="true">${escapeHtml(INITIALS(reply.author))}</span>
      <div>
        <div class="reply-head">
          <b>${escapeHtml(reply.author)}</b>
          <span>${escapeHtml(rankLabel(posts(reply.author), lang))}</span>
          <time datetime="${escapeAttr(reply.created_at || '')}">${escapeHtml(formatDate(reply.created_at, lang))}</time>
          <span>${formatNumber(reply.likes, lang)} ${escapeHtml(t.likes)}</span>
        </div>
        ${reply.quote_author ? `<blockquote class="quote"><strong>${escapeHtml(reply.quote_author)}</strong> — ${escapeHtml(reply.quote_excerpt || '')}</blockquote>` : ''}
        <p>${escapeHtml(reply.body)}</p>
      </div>
    </article>`).join('\n')
    : `<p class="empty">${escapeHtml(t.noReplies)}</p>`;

  const relatedHtml = related.length
    ? `<div class="section-head"><h2>${escapeHtml(t.related)}</h2></div>
    <div class="topic-list">${related.map(entry => {
      const href = forum.standalone ? `/t/${encodeURIComponent(entry.id)}/` : forumThreadPath(entry.id);
      return `<a class="topic-card" href="${escapeAttr(href)}">
        <span class="avatar" aria-hidden="true">${escapeHtml(INITIALS(entry.author))}</span>
        <div><h2>${escapeHtml(entry.title)}</h2><p class="excerpt">${escapeHtml(metaDescription(entry.body, entry.body, 140) || '')}</p>
        <div class="meta"><span class="badge">${escapeHtml(categoryLabel(entry.category, lang))}</span><span>${escapeHtml(formatDate(entry.created_at, lang))}</span></div></div>
        <div class="topic-stats"><span><b>${formatNumber(entry.reply_count, lang)}</b> ${escapeHtml(t.replies)}</span><span><b>${formatNumber(entry.view_count, lang)}</b> ${escapeHtml(t.views)}</span></div>
      </a>`;
    }).join('')}</div>`
    : '';

  const body = `<div class="wrap narrow">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${siteUrl}/">${escapeHtml(t.home)}</a><span aria-hidden="true">/</span>
    <a href="${escapeAttr(hubHref)}">${escapeHtml(t.forum)}</a><span aria-hidden="true">/</span>
    <span>${escapeHtml(categoryLabel(thread.category, lang))}</span>
  </nav>

  <article class="post-shell">
    <div class="post-head">
      <span class="badge">${escapeHtml(categoryLabel(thread.category, lang))}</span>
      ${thread.pinned ? `<span class="badge">${escapeHtml(t.pinned)}</span>` : ''}
      ${thread.locked ? `<span class="badge">${escapeHtml(t.locked)}</span>` : ''}
    </div>
    <h1>${escapeHtml(thread.title)}</h1>
    <div class="byline" style="margin-top:16px">
      <span class="avatar" aria-hidden="true">${escapeHtml(INITIALS(thread.author))}</span>
      <span><b>${escapeHtml(thread.author)}</b> · ${escapeHtml(rankLabel(posts(thread.author), lang))}</span>
      <time datetime="${escapeAttr(thread.created_at || '')}">${escapeHtml(formatDate(thread.created_at, lang))}</time>
      <span>${formatNumber(thread.view_count, lang)} ${escapeHtml(t.views)}</span>
      <span>${formatNumber(thread.likes, lang)} ${escapeHtml(t.likes)}</span>
    </div>
    <p class="post-body">${escapeHtml(thread.body)}</p>
    <div class="chips" style="margin-top:18px">
      <a class="button" href="${escapeAttr(joinHref)}">${escapeHtml(thread.locked ? t.back : t.replyCta)} →</a>
      <button class="chip" type="button" id="copyLink" data-url="${escapeAttr(canonical)}">${escapeHtml(t.share)}</button>
    </div>
  </article>

  <div class="section-head"><h2>${escapeHtml(lang === 'tr' ? 'Yanıtlar' : t.replies)}</h2><span>${formatNumber(replies.length, lang)}</span></div>
  <section class="post-shell" style="padding-top:6px">${replyHtml}</section>

  <div class="cta">
    <div><h2>${escapeHtml(t.join)}</h2><p>${escapeHtml(t.moderation)}</p></div>
    <a class="button" href="${escapeAttr(joinHref)}">${escapeHtml(t.replyCta)} →</a>
  </div>

  ${relatedHtml}
</div>
<script>
(function(){
  var button=document.getElementById('copyLink');
  if(button){button.addEventListener('click',function(){var url=button.getAttribute('data-url');var done=function(){button.textContent=${JSON.stringify(t.copied)};setTimeout(function(){button.textContent=${JSON.stringify(t.share)};},1600);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(function(){});}});}
})();
</script>`;

  const discussion = {
    '@type': 'DiscussionForumPosting',
    '@id': `${canonical}#discussion`,
    headline: oneLine(thread.title, 110),
    text: oneLine(thread.body, 5000),
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    datePublished: thread.created_at ? new Date(thread.created_at).toISOString() : undefined,
    inLanguage: lang,
    articleSection: categoryLabel(thread.category, lang),
    author: { '@type': 'Person', name: thread.author },
    publisher: { '@id': `${siteUrl}/#organization` },
    isAccessibleForFree: true,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: replies.length
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: Number(thread.view_count) || 0
      }
    ],
    comment: replies.slice(0, 20).map(reply => ({
      '@type': 'Comment',
      text: oneLine(reply.body, 1200),
      author: { '@type': 'Person', name: reply.author },
      dateCreated: reply.created_at ? new Date(reply.created_at).toISOString() : undefined
    }))
  };

  return renderPage({
    lang, siteUrl, section: 'forum', theme: 'community',
    title: `${oneLine(thread.title, 90)} | ${SITE_NAME} Forum`,
    description,
    canonical,
    ogType: 'article',
    publishedTime: thread.created_at ? new Date(thread.created_at).toISOString() : '',
    robots: 'index,follow,max-image-preview:large',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@graph': [
        organizationLd(siteUrl),
        websiteLd(siteUrl),
        discussion,
        breadcrumbLd([
          { name: SITE_NAME, path: '/' },
          { name: 'Forum', path: '/forum/' },
          { name: oneLine(thread.title, 90), path }
        ], siteUrl)
      ]
    }],
    body
  });
}

async function loadAuthorPosts(sql, threadId) {
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

export function createForumPageHandler(options = {}) {
  const connect = options.connect || (() => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
    return neon(process.env.DATABASE_URL);
  });

  return async function handler(req, res) {
    const siteUrl = resolveSiteUrl(req.headers || {}, options.env || process.env);
    const lang = normalizeLang(req.query?.lang);
    const id = String(req.query?.id || '').replace(/\/+$/, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=3600');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).send('Yöntem desteklenmiyor.');
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(404).send(renderNotFound({ siteUrl, section: 'forum', lang }));
    }

    try {
      const sql = options.sql || connect();
      await prepareForum(sql);

      const [thread] = await sql`SELECT t.*, (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='thread' AND l.target_id=t.id) AS likes
        FROM forum_threads t WHERE t.id=${id} AND t.approved=TRUE`;
      if (!thread) {
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        return res.status(404).send(renderNotFound({ siteUrl, section: 'forum', lang }));
      }

      const replies = await sql`SELECT r.id, r.author, r.body, r.created_at, r.quote_author, r.quote_excerpt,
          (SELECT COUNT(*)::int FROM forum_likes l WHERE l.target_kind='reply' AND l.target_id=r.id) AS likes
        FROM forum_replies r WHERE r.thread_id=${id} AND r.approved=TRUE
        ORDER BY r.created_at, r.id LIMIT 50`;
      const relatedRows = await sql`SELECT t.id, t.author, t.title, t.body, t.category, t.created_at, t.view_count,
          (SELECT COUNT(*)::int FROM forum_replies r WHERE r.thread_id=t.id AND r.approved=TRUE) AS reply_count
        FROM forum_threads t WHERE t.approved=TRUE AND t.id<>${id} AND t.category=${thread.category}
        ORDER BY t.created_at DESC LIMIT 4`;
      const authorPosts = await loadAuthorPosts(sql, id);

      const html = renderForumThread({
        thread, replies, related: relatedRows, authorPosts,
        siteUrl, env: options.env || process.env, lang
      });
      res.setHeader('Content-Language', lang);
      return res.status(200).send(html);
    } catch (error) {
      console.error('[forum-page]', error);
      res.setHeader('Cache-Control', 'public, s-maxage=30');
      return res.status(503).send(renderNotFound({ siteUrl, section: 'forum', lang }));
    }
  };
}

export default createForumPageHandler();
