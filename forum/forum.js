import {
  CATEGORIES, CATEGORY_KEYS, EDIT_WINDOW_MS, PAGE_SIZE, REPLY_PAGE,
  escapeHtml as esc, formatCount, formatDateTime, hashFor, initials, normalizeLang,
  rankKey, relativeTime, routeFromHash, translator, withinEditWindow
} from './forum-core.js';

const $ = id => document.getElementById(id);
const requestedManage = new URLSearchParams(location.search).get('manage') === '1';
const LANG_KEY = 'testotavan_language';
const VIEW_KEY = 'testotavan_forum_view:';
const ICONS = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.3 4.7 13a4.9 4.9 0 0 1 6.9-6.9l.4.4.4-.4A4.9 4.9 0 0 1 19.3 13z"/></svg>',
  quote: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7c-3 1.4-4.5 3.6-4.5 6.6V19H11v-6H8.2c.2-1.7 1-3 2.6-4zM19 7c-3 1.4-4.5 3.6-4.5 6.6V19H20v-6h-2.8c.2-1.7 1-3 2.6-4z"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10.5 13.6a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1M13.5 10.4a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1-1"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 19h14M6.5 15.5 16 6a2.1 2.1 0 0 1 3 3l-9.5 9.5H6z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 3.5h5l-1 5 3 3v2h-9v-2l3-3zM12 13.5v7"/></svg>'
};
const icon = name => ICONS[name] || '';
const store = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* depolama kapalı olabilir */ } }
};
let lang = 'tr';
try { lang = normalizeLang(localStorage.getItem(LANG_KEY) || 'tr'); } catch { /* depolama kapalı olabilir */ }
let t = translator(lang);
let manage = false, offset = 0, replyOffset = 0, current = null, user = null, authMode = null;
let listing = { threads: [], thread: null, replies: [] };
let quoting = null, editing = null;
// Meydan filtreleri: varsayılan olarak yeni konular, tüm kategoriler, arama yok.
let sort = 'new', category = '', searchText = '';
let stats = { threads: 0, replies: 0, members: 0, views: 0, categories: [], trending: [], contributors: [] };
let searchTimer = null;

const catLabel = value => (CATEGORY_KEYS[value] ? t(CATEGORY_KEYS[value]) : value);
const status = message => { $('status').textContent = message || ''; };
const motion = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
const preview = (text, max = 140) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};
const timeTag = value => {
  const full = formatDateTime(value, lang);
  return `<time class="meta" datetime="${esc(value)}" title="${esc(full)}">${esc(relativeTime(value, lang))}</time>`;
};

function applyLanguage() {
  document.documentElement.lang = lang;
  $('forum-lang').value = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    if (el.firstChild) el.firstChild.textContent = t(el.dataset.i18nLabel);
  });
  $('page-title').textContent = manage ? t('manage') : t('title');
  document.querySelectorAll('select[name=category] option').forEach(option => { option.textContent = catLabel(option.value); });
  $('logout').textContent = t('logout');
  $('show-login').textContent = t('login-submit');
  $('show-register').textContent = t('register-submit');
  if ($('forum-search')) $('forum-search').placeholder = t('search');
  if (user) $('composer-as').textContent = `${t('postedAs')}: ${user.username}`;
  renderFilters();
  renderStats();
}

/* ---------- topluluk nabzı ve filtreler ---------- */

function renderStats() {
  const set = (key, value) => {
    const node = document.querySelector(`[data-stat="${key}"]`);
    if (node) node.textContent = formatCount(value, lang);
  };
  set('threads', stats.threads);
  set('replies', stats.replies);
  set('members', stats.members);
  set('views', stats.views);

  $('rail-trending').innerHTML = (stats.trending || []).map(item => (
    `<li><a href="/forum/t/${esc(item.id)}/">${esc(item.title)}</a><span class="count">${formatCount(item.views, lang)}</span></li>`
  )).join('') || `<li class="meta">${esc(t('empty'))}</li>`;

  $('rail-contributors').innerHTML = (stats.contributors || []).map(item => (
    `<li><span>${esc(item.author)}</span><span class="count">${formatCount(item.posts, lang)} ${esc(t('posts'))}</span></li>`
  )).join('') || `<li class="meta">${esc(t('empty'))}</li>`;
}

function renderFilters() {
  const counts = new Map((stats.categories || []).map(row => [row.name, row.threads]));
  const chip = (value, label, count, active) => `<button type="button" class="chip${active ? ' on' : ''}" data-category="${esc(value)}" role="tab" aria-selected="${active ? 'true' : 'false'}">${esc(label)}<span class="count">${formatCount(count, lang)}</span></button>`;
  const chips = [chip('', t('allCategories'), stats.threads || 0, !category)];
  for (const name of CATEGORIES) chips.push(chip(name, catLabel(name), counts.get(name) || 0, category === name));
  if (category || searchText) chips.push(`<button type="button" class="chip" data-clear>${esc(t('clearFilters'))}</button>`);
  $('category-chips').innerHTML = chips.join('');
  document.querySelectorAll('#sort-tabs [data-sort]').forEach(button => {
    button.setAttribute('aria-selected', button.dataset.sort === sort ? 'true' : 'false');
  });
}

async function loadStats() {
  try {
    const response = await fetch('/api/forum-stats');
    if (!response.ok) return;
    const data = await response.json();
    if (data && typeof data === 'object' && 'threads' in data) stats = { ...stats, ...data };
    renderStats();
    renderFilters();
  } catch { /* istatistikler ikincil: hata sayfayı durdurmaz */ }
}

function renderAuth() {
  const signedIn = Boolean(user);
  $('auth-user').hidden = !signedIn;
  $('auth-guest').hidden = signedIn;
  $('auth-name').textContent = signedIn ? user.username : '';
  $('auth-gate').hidden = manage || signedIn;
  $('new-thread').hidden = manage || !signedIn;
  if (signedIn) $('composer-as').textContent = `${t('postedAs')}: ${user.username}`;
  if (!signedIn) $('auth-panel').hidden = authMode == null;
}

function showAuth(mode) {
  authMode = mode;
  $('auth-panel').hidden = false;
  $('login-form').hidden = mode !== 'login';
  $('register-form').hidden = mode !== 'register';
  $('tab-login').setAttribute('aria-selected', mode === 'login' ? 'true' : 'false');
  $('tab-register').setAttribute('aria-selected', mode === 'register' ? 'true' : 'false');
  $('tab-login').classList.toggle('secondary', mode !== 'login');
  $('tab-register').classList.toggle('secondary', mode !== 'register');
  $('auth-panel').scrollIntoView?.({ behavior: motion(), block: 'start' });
  const field = $(mode === 'register' ? 'register-form' : 'login-form').querySelector('input[name=username]');
  field?.focus();
}

async function authApi(body, method = 'POST') {
  const response = await fetch('/api/forum-auth', method === 'GET' ? undefined : {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t('authRequired'));
  return data;
}

async function refreshUser() {
  const data = await authApi(null, 'GET');
  user = data.user || null;
  renderAuth();
}

async function api(params = '', options = {}) {
  const response = await fetch('/api/forum?' + params + (manage ? '&manage=1' : ''), options);
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !manage) {
    user = null;
    renderAuth();
    showAuth('login');
  }
  if (!response.ok) {
    const error = new Error(data.error || 'İşlem tamamlanamadı.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/* ---------- gösterim ---------- */

function authorBlock(item, isReply) {
  const posts = Number(item.author_posts) || 0;
  const owner = Boolean(isReply && listing.thread && item.author === listing.thread.author);
  return `<div class="author">
    <span class="avatar" aria-hidden="true">${esc(initials(item.author))}</span>
    <span class="author-name">${esc(item.author)}${item.mine ? ` <em class="you">(${esc(t('you'))})</em>` : ''}</span>
    <span class="rank">${esc(t(rankKey(posts)))}</span>
    <span class="meta">${formatCount(posts, lang)} ${esc(t('posts'))}</span>
    ${owner ? `<span class="badge owner">${esc(t('topicOwner'))}</span>` : ''}
  </div>`;
}

function controls(item, kind) {
  if (!manage) return '';
  const button = (action, label, name) => `<button class="chip" type="button" data-action="${action}" data-kind="${kind}" data-id="${esc(item.id)}">${name ? icon(name) : ''}<span>${esc(label)}</span></button>`;
  return `<div class="admin-bar">${!item.approved ? button('approve', t('approve')) : ''}${kind === 'thread' ? button(item.pinned ? 'unpin' : 'pin', item.pinned ? t('unpin') : t('pin'), 'pin') : ''}${kind === 'thread' ? button(item.locked ? 'unlock' : 'lock', item.locked ? t('unlock') : t('lock')) : ''}${button('delete', t('delete'))}</div>`;
}

function actionBar(item, kind) {
  const id = esc(item.id);
  const likes = formatCount(item.likes, lang);
  const likeLabel = t(item.liked ? 'liked' : 'like');
  const editable = item.mine && withinEditWindow(item.created_at, Date.now(), EDIT_WINDOW_MS);
  return `<div class="post-actions">
    <button class="chip${item.liked ? ' on' : ''}" type="button" data-like="${id}" data-kind="${kind}" aria-pressed="${item.liked ? 'true' : 'false'}" title="${esc(likeLabel)}">${icon('heart')}<span class="sr-only">${esc(likeLabel)}</span><span data-count="${id}">${likes}</span></button>
    ${kind === 'reply' ? `<button class="chip" type="button" data-quote="${id}" title="${esc(t('quote'))}">${icon('quote')}<span>${esc(t('quote'))}</span></button>` : ''}
    <button class="chip" type="button" data-copy="${id}" data-kind="${kind}" title="${esc(t('copyLink'))}">${icon('link')}<span class="sr-only">${esc(t('copyLink'))}</span></button>
    ${editable ? `<button class="chip" type="button" data-edit="${id}" data-kind="${kind}" title="${esc(t('editHint'))}">${icon('edit')}<span>${esc(t('edit'))}</span></button>` : ''}
  </div>`;
}

function quoteBlock(item) {
  if (!item.quote_author) return '';
  const source = item.quote_id
    ? `<a href="${esc(hashFor(current, item.quote_id))}" data-jump="${esc(item.quote_id)}" title="${esc(t('jumpQuote'))}">${esc(item.quote_author)}</a>`
    : `<strong>${esc(item.quote_author)}</strong>`;
  return `<blockquote class="quote">
    <span class="meta">${esc(t('quotedPost'))}</span>
    ${source}
    <span class="quote-text">${esc(item.quote_excerpt || '')}</span>
  </blockquote>`;
}

function bodyHtml(item, kind) {
  if (editing !== item.id) return `<p class="body">${esc(item.body)}</p>`;
  const field = `edit-${item.id}`;
  return `<form class="edit-form" data-edit-form="${esc(item.id)}" data-kind="${kind}">
    <label class="sr-only" for="${esc(field)}">${esc(t('message'))}</label>
    <textarea id="${esc(field)}" name="body" required minlength="3" maxlength="4000" rows="4">${esc(item.body)}</textarea>
    <div class="toolbar">
      <button type="submit">${esc(t('save'))}</button>
      <button type="button" class="secondary" data-edit-cancel>${esc(t('cancel'))}</button>
    </div>
    <p class="meta">${esc(t('editHint'))}</p>
  </form>`;
}

function postHtml(item, kind) {
  const anchor = `${kind === 'thread' ? 'thread' : 'reply'}-${esc(item.id)}`;
  const edited = item.edited_at ? ` · <span class="meta">${esc(t('edited'))}</span>` : '';
  return `<article class="post" id="${anchor}" data-post="${esc(item.id)}">
    ${authorBlock(item, kind === 'reply')}
    <div class="post-main">
      ${kind === 'reply' ? quoteBlock(item) : ''}
      ${bodyHtml(item, kind)}
      <div class="post-foot">
        <span class="post-when">${timeTag(item.created_at)}${edited}</span>
        ${actionBar(item, kind)}
      </div>
      ${controls(item, kind)}
    </div>
  </article>`;
}

function renderQuoteChip() {
  const chip = $('quote-chip');
  if (!quoting || quoting.threadId !== current) {
    quoting = null;
    chip.hidden = true;
    $('quote-chip-text').textContent = '';
    return;
  }
  chip.hidden = false;
  $('quote-chip-text').innerHTML = `${icon('quote')}<strong>${esc(quoting.author)}</strong> <span>${esc(quoting.excerpt)}</span>`;
}

function renderList() {
  $('threads').innerHTML = listing.threads.map(item => {
    const badges = [
      `<span class="badge">${esc(catLabel(item.category))}</span>`,
      item.pinned ? `<span class="badge pin">${icon('pin')}${esc(t('pinnedBadge'))}</span>` : '',
      item.locked ? `<span class="badge">${esc(t('lockedBadge'))}</span>` : '',
      !item.approved ? `<span class="badge waiting">${esc(t('waiting'))}</span>` : '',
      manage && item.pending_count ? `<span class="badge waiting">${formatCount(item.pending_count, lang)} ${esc(t('pending'))}</span>` : ''
    ].join('');
    return `<article class="topic-row" data-thread="${esc(item.id)}">
      <span class="avatar" aria-hidden="true">${esc(initials(item.author))}</span>
      <div class="row-main">
        <div class="badges">${badges}</div>
        <h2><a class="topic" href="/forum/t/${esc(item.id)}/" data-open="${esc(item.id)}">${esc(item.title)}</a></h2>
        <p class="row-excerpt">${esc(preview(item.body, 150))}</p>
        <p class="row-meta"><span>${esc(item.author)}</span><span aria-hidden="true">·</span>${timeTag(item.created_at)}<span aria-hidden="true">·</span><span>${formatCount(item.reply_count, lang)} ${esc(t('replies'))}</span></p>
      </div>
      <dl class="row-stats">
        <div><dt>${esc(t('replies'))}</dt><dd>${formatCount(item.reply_count, lang)}</dd></div>
        <div><dt>${esc(t('views'))}</dt><dd>${formatCount(item.view_count, lang)}</dd></div>
        <div><dt>${esc(t('like'))}</dt><dd>${formatCount(item.likes, lang)}</dd></div>
      </dl>
      ${controls(item, 'thread')}
    </article>`;
  }).join('') || `<div class="gate"><p>${esc(category || searchText ? t('noResults') : t('empty'))}</p><div class="toolbar"><button type="button" class="secondary" data-clear>${esc(t('clearFilters'))}</button></div></div>`;
  $('previous').disabled = offset === 0;
  $('next').disabled = listing.threads.length < PAGE_SIZE;
  $('page').textContent = `${t('page')} ${offset / PAGE_SIZE + 1}`;
}

function renderThread() {
  const thread = listing.thread;
  $('conversation').innerHTML = postHtml(thread, 'thread')
    + `<p class="meta" style="margin:0 0 6px"><a href="/forum/t/${esc(thread.id)}/" style="color:var(--accent);text-decoration:none">${esc(t('openPage'))} →</a></p>`
    + `<h2 class="replies-heading">${esc(t('replyHeading'))}</h2>`
    + (listing.replies.map(item => postHtml(item, 'reply')).join('') || `<p class="meta">${esc(t('noReplies'))}</p>`);
  const canReply = Boolean(user) && !thread.locked && thread.approved && !manage;
  $('reply-form').hidden = !canReply;
  $('reply-gate').hidden = Boolean(user) || thread.locked || !thread.approved || manage;
  $('reply-prev').disabled = replyOffset === 0;
  $('reply-next').disabled = listing.replies.length < REPLY_PAGE;
  renderQuoteChip();
}

/* ---------- veri ---------- */

async function loadList() {
  status(t('loading'));
  const params = new URLSearchParams({ offset: String(offset), sort });
  if (category) params.set('category', category);
  if (searchText) params.set('q', searchText);
  const data = await api(params.toString());
  listing = { threads: data.threads || [], thread: null, replies: [] };
  renderList();
  status('');
}

async function open(id, options = {}) {
  status(t('opening'));
  const first = store.get(VIEW_KEY + id) !== '1';
  const { thread, replies } = await api(`id=${encodeURIComponent(id)}&offset=${replyOffset}${first ? '&view=1' : ''}`);
  store.set(VIEW_KEY + id, '1');
  current = id;
  listing = { threads: listing.threads, thread, replies };
  editing = null;
  if (quoting && quoting.threadId !== id) quoting = null;
  $('listing').hidden = true;
  $('detail').hidden = false;
  renderThread();
  status(thread.locked ? t('closed') : '');
  if (options.reply) focusReply(options.reply);
}

function focusReply(id) {
  const node = document.getElementById(`reply-${id}`);
  if (!node) { status(t('anchorMissing')); return; }
  node.scrollIntoView?.({ behavior: motion(), block: 'center' });
  node.classList.add('flash');
  setTimeout(() => node.classList.remove('flash'), 1600);
}

const refreshView = () => (current ? open(current) : loadList());

/* ---------- yönlendirme ---------- */

function showListing() {
  current = null;
  editing = null;
  $('detail').hidden = true;
  $('listing').hidden = false;
  return loadList();
}

function applyRoute({ scroll = true } = {}) {
  const route = routeFromHash(location.hash, location.search);
  if (route.thread && route.thread !== current) {
    replyOffset = 0;
    run(() => open(route.thread, { reply: scroll ? route.reply : '' }));
    return;
  }
  if (!route.thread && current) {
    run(showListing);
    return;
  }
  if (route.reply && current === route.thread) focusReply(route.reply);
}

function updateHash(threadId, replyId = '') {
  const target = threadId ? hashFor(threadId, replyId) : location.pathname + location.search;
  history.pushState(null, '', target);
}

/* ---------- etkileşimler ---------- */

function applyLike(id, result) {
  document.querySelectorAll(`[data-count="${id}"]`).forEach(node => { node.textContent = formatCount(result.likes, lang); });
  document.querySelectorAll(`[data-like="${id}"]`).forEach(node => {
    node.classList.toggle('on', Boolean(result.liked));
    node.setAttribute('aria-pressed', result.liked ? 'true' : 'false');
    node.title = result.liked ? t('liked') : t('like');
    node.querySelector('.sr-only').textContent = result.liked ? t('liked') : t('like');
  });
}

async function toggleLike(button) {
  if (!user) { showAuth('login'); status(t('likeFirst')); return; }
  const { like: id, kind } = button.dataset;
  button.disabled = true;
  try {
    const result = await api('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', kind, id })
    });
    applyLike(id, result);
    status(result.liked ? t('liked') : t('like'));
  } finally { button.disabled = false; }
}

function startQuote(button) {
  if (!user) { showAuth('login'); status(t('authRequired')); return; }
  const item = listing.replies.find(reply => reply.id === button.dataset.quote);
  if (!item) return;
  quoting = { id: item.id, author: item.author, excerpt: preview(item.body), threadId: current };
  editing = null;
  renderThread();
  $('reply-form').scrollIntoView?.({ behavior: motion(), block: 'center' });
  $('reply-form').querySelector('textarea')?.focus();
  status(t('quote'));
}

async function writeClipboard(value) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; }
  } catch { /* güvenli olmayan bağlamda clipboard yok */ }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch { return false; }
}

async function copyLink(button) {
  // Konu bağlantısı her zaman kalıcı SEO sayfasını gösterir; yanıt bağlantısı
  // aynı sayfadaki #reply-<id> çapasına iner.
  const isReply = button.dataset.kind === 'reply';
  const url = current
    ? `${location.origin}/forum/t/${current}/${isReply ? `#reply-${button.dataset.copy}` : ''}`
    : location.href;
  const ok = await writeClipboard(url);
  status(ok ? t('copied') : t('copyFailed'));
  if (ok) {
    button.classList.add('on');
    setTimeout(() => button.classList.remove('on'), 1500);
  }
}

function startEdit(button) {
  editing = button.dataset.edit;
  renderThread();
  const field = document.getElementById(`edit-${editing}`);
  field?.focus();
  field?.setSelectionRange(field.value.length, field.value.length);
}

async function saveEdit(form) {
  const id = form.dataset.editForm, kind = form.dataset.kind;
  const body = form.elements.body.value;
  editing = null;
  try {
    await api('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', kind, id, body })
    });
    await refreshView();
    status(t('done'));
  } catch (error) {
    // Form açıkken 30 dakika dolmuş olabilir; mesajı buna göre sadeleştir.
    status(error.status === 403 ? t('editExpired') : error.message);
    if (error.status === 403) await refreshView();
  }
}

function handleModeration(button) {
  return run(async () => {
    const { action, kind, id } = button.dataset;
    if (action === 'delete' && !confirm(kind === 'thread' ? t('deleteTopic') : t('deleteReply'))) return;
    button.disabled = true;
    try {
      await api(`id=${encodeURIComponent(id)}&kind=${kind}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (action === 'delete' && kind === 'thread') {
        updateHash('');
        await showListing();
      } else {
        await refreshView();
      }
      status(t('done'));
    } finally { button.disabled = false; }
  });
}

/* ---------- olaylar ---------- */

const run = task => Promise.resolve().then(task).catch(error => status(error.message));

$('refresh').onclick = () => run(loadList);
$('previous').onclick = () => { offset = Math.max(0, offset - PAGE_SIZE); run(loadList); };
$('next').onclick = () => { offset += PAGE_SIZE; run(loadList); };
$('reply-prev').onclick = () => { replyOffset = Math.max(0, replyOffset - REPLY_PAGE); run(() => open(current)); };
$('reply-next').onclick = () => { replyOffset += REPLY_PAGE; run(() => open(current)); };
$('back').onclick = () => { updateHash(''); run(showListing); };
$('show-login').onclick = () => showAuth('login');
$('show-register').onclick = () => showAuth('register');
$('gate-login').onclick = () => showAuth('login');
$('gate-register').onclick = () => showAuth('register');
$('reply-login').onclick = () => showAuth('login');
$('tab-login').onclick = () => showAuth('login');
$('tab-register').onclick = () => showAuth('register');
$('quote-cancel').onclick = () => { quoting = null; renderQuoteChip(); };
$('forum-lang').onchange = () => {
  lang = normalizeLang($('forum-lang').value);
  t = translator(lang);
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* depolama kapalı olabilir */ }
  applyLanguage();
  editing = null;
  run(refreshView);
};
$('logout').onclick = () => run(async () => {
  await authApi({ action: 'logout' });
  user = null;
  authMode = null;
  quoting = null;
  $('auth-panel').hidden = true;
  renderAuth();
  await refreshView();
  status(t('logout'));
});

$('forum-search').oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchText = $('forum-search').value.trim();
    offset = 0;
    renderFilters();
    run(loadList);
  }, 320);
};
window.addEventListener('popstate', () => applyRoute());

document.addEventListener('click', event => {
  const sortButton = event.target.closest('[data-sort]');
  if (sortButton) {
    sort = sortButton.dataset.sort || 'new';
    offset = 0;
    renderFilters();
    run(loadList);
    return;
  }
  const categoryButton = event.target.closest('[data-category]');
  if (categoryButton) {
    category = categoryButton.dataset.category || '';
    offset = 0;
    renderFilters();
    run(loadList);
    return;
  }
  if (event.target.closest('[data-clear]')) {
    category = '';
    searchText = '';
    if ($('forum-search')) $('forum-search').value = '';
    offset = 0;
    renderFilters();
    run(loadList);
    return;
  }
  const jump = event.target.closest('[data-jump]');
  const opener = event.target.closest('[data-open]');
  if (opener) {
    // JavaScript açıkken konu sayfa içinde açılır; bağlantı adresi arama
    // motorları ve "yeni sekmede aç" için kalıcı /forum/t/<id>/ sayfasıdır.
    event.preventDefault();
    replyOffset = 0;
    updateHash(opener.dataset.open);
    run(() => open(opener.dataset.open));
    return;
  }
  if (jump) {
    event.preventDefault();
    updateHash(current, jump.dataset.jump);
    focusReply(jump.dataset.jump);
    return;
  }
  const button = event.target.closest('button');
  if (!button?.dataset) return;
  if (button.dataset.like) run(() => toggleLike(button));
  if (button.dataset.quote) startQuote(button);
  if (button.dataset.copy) run(() => copyLink(button));
  if (button.dataset.edit) startEdit(button);
  if ('editCancel' in button.dataset) { editing = null; renderThread(); }
  if (button.dataset.action) handleModeration(button);
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (form.dataset.editForm) {
    event.preventDefault();
    run(() => saveEdit(form));
  }
});

async function submitAuth(event, action) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type=submit]');
  const data = Object.fromEntries(new FormData(form));
  if (action === 'register' && data.password !== data.passwordConfirm) {
    status(t('mismatch'));
    return;
  }
  button.disabled = true;
  try {
    const result = await authApi({ action, ...data });
    user = result.user;
    form.reset();
    authMode = null;
    $('auth-panel').hidden = true;
    renderAuth();
    status(`${t('welcome')}, ${user.username}.`);
    if (current) await open(current);
  } catch (error) {
    status(error.message);
  } finally {
    button.disabled = false;
  }
}

$('login-form').onsubmit = event => submitAuth(event, 'login');
$('register-form').onsubmit = event => submitAuth(event, 'register');
for (const id of ['new-thread', 'reply-form']) $(id).onsubmit = event => {
  event.preventDefault();
  if (!user) { showAuth('login'); status(t('authRequired')); return; }
  const form = event.target;
  const button = form.querySelector('button[type=submit]');
  const data = Object.fromEntries(new FormData(form));
  if (id === 'reply-form') {
    data.threadId = current;
    if (quoting && quoting.threadId === current) data.quoteId = quoting.id;
  }
  button.disabled = true;
  run(async () => {
    try {
      const result = await api('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      form.reset();
      if (id === 'reply-form') { quoting = null; renderQuoteChip(); }
      status(result.message);
    } finally { button.disabled = false; }
  });
};

run(async () => {
  applyLanguage();
  renderQuoteChip();
  try { await refreshUser(); } catch (error) { status(error.message); }
  if (requestedManage) {
    const response = await fetch('/api/session');
    const session = await response.json();
    if (!session.authenticated) {
      $('listing').hidden = true;
      throw new Error(lang === 'tr' ? 'Moderasyon için admin panelinden giriş yapın.' : t('manage'));
    }
    manage = true;
    applyLanguage();
    renderAuth();
  }
  loadStats();
  const route = routeFromHash(location.hash, location.search);
  if (route.thread) {
    await open(route.thread, { reply: route.reply });
    return;
  }
  await loadList();
});
