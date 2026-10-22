import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EDIT_WINDOW_MS as API_EDIT_WINDOW_MS, QUOTE_MAX, quoteExcerpt, validateEdit, validateLike, validatePost } from '../api/_forum.js';
import { createForumHandler } from '../api/forum.js';
import { createSessionCookie } from '../api/_auth.js';
import {
  EDIT_WINDOW_MS, LANGUAGES, PAGE_SIZE, REPLY_PAGE, UI, hashFor, initials,
  relativeTime, routeFromHash, rankKey, translator, withinEditWindow
} from '../forum/forum-core.js';

const id = '12345678-1234-4123-8123-123456789abc';
const replyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
process.env.SESSION_SECRET = 'forum-features-secret';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

const forumToken = 'b'.repeat(64);
const sessionUser = { id: otherId, username: 'Ada' };

/** API'yi bellek içi sahte SQL ile çalıştırır; sorgular sırayla tüketilir. */
function harness(results = [], { user = sessionUser } = {}) {
  const queries = [];
  const handler = createForumHandler(() => async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/forum_sessions/.test(text)) return user ? [user] : [];
    return results.shift() || [];
  });
  return {
    queries,
    async request(method, query = {}, body, { admin = false, forum = false, headers = {} } = {}) {
      const req = { method, query, body, headers: { 'content-type': 'application/json', ...headers } };
      if (admin) req.headers.cookie = createSessionCookie().split(';')[0];
      if (forum) req.headers.cookie = [req.headers.cookie, `testotavan_forum=${forumToken}`].filter(Boolean).join('; ');
      const res = {
        headers: {},
        setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.code = code; return this; },
        json(data) { this.data = data; return this; }
      };
      await handler(req, res);
      return res;
    }
  };
}

const read = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');

/* ---------- paylaşılan çekirdek ---------- */

test('istemci çekirdeği ile API aynı pencere ve sayfa boyutlarını kullanır', () => {
  assert.equal(EDIT_WINDOW_MS, API_EDIT_WINDOW_MS);
  assert.equal(PAGE_SIZE, 30);
  assert.equal(REPLY_PAGE, 50);
  assert.deepEqual(LANGUAGES, ['tr', 'en', 'de', 'ja', 'fr', 'es', 'bg', 'ru', 'hi', 'zh']);
  assert.equal(translator('xx')('site'), UI.tr.site);
  assert.equal(translator('en')('site'), UI.en.site);
  assert.equal(translator('tr')('bilinmeyen-anahtar'), 'bilinmeyen-anahtar');
  assert.ok(UI.en['quote'] && UI.de['edit'] && UI.ja['views']);
});

test('on dil tam ve boşluksuz sözlüğe sahip', () => {
  const keys = Object.keys(UI.tr).sort();
  assert.ok(keys.length > 60, 'sözlük beklenenden küçük');
  for (const lang of LANGUAGES) {
    const table = UI[lang];
    assert.deepEqual(Object.keys(table).sort(), keys, `${lang} dilinde eksik/fazla anahtar var`);
    for (const [key, value] of Object.entries(table)) {
      assert.equal(typeof value, 'string', `${lang}.${key} metin olmalı`);
      assert.ok(value.trim().length > 0, `${lang}.${key} boş olamaz`);
    }
  }
});

test('çeviriler Türkçe metnin kopyası değil', () => {
  const keys = Object.keys(UI.tr);
  for (const lang of ['en', 'de', 'ja']) {
    assert.notDeepEqual(UI[lang], UI.tr, `${lang} sözlüğü çevrilmemiş`);
    const translated = keys.filter(key => UI[lang][key] !== UI.tr[key]).length;
    assert.ok(translated > keys.length / 2, `${lang} çevirileri eksik görünüyor (${translated}/${keys.length})`);
    for (const key of ['like', 'quote', 'edit', 'views', 'pinnedBadge', 'rank-veteran', 'topicOwner']) {
      assert.notEqual(UI[lang][key], UI.tr[key], `${lang}.${key} çevrilmemiş`);
    }
  }
});

test('rütbe eşikleri mesaj sayısına göre belirlenir', () => {
  assert.equal(rankKey(0), 'rank-new');
  assert.equal(rankKey(4), 'rank-new');
  assert.equal(rankKey(5), 'rank-member');
  assert.equal(rankKey(24), 'rank-member');
  assert.equal(rankKey(25), 'rank-active');
  assert.equal(rankKey(99), 'rank-active');
  assert.equal(rankKey(100), 'rank-veteran');
  assert.equal(rankKey('42'), 'rank-active');
  assert.equal(rankKey(null), 'rank-new');
});

test('göreli zaman dört dilde ve 4 hafta sınırında çalışır', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  assert.equal(relativeTime('2026-10-15T11:59:30Z', 'tr', now), 'az önce');
  assert.equal(relativeTime('2026-10-15T11:40:00Z', 'tr', now), '20 dk önce');
  assert.equal(relativeTime('2026-10-15T09:00:00Z', 'en', now), '3 h ago');
  assert.equal(relativeTime('2026-10-13T12:00:00Z', 'de', now), 'vor 2 Tg.');
  assert.equal(relativeTime('2026-09-10T12:00:00Z', 'ja', now), '5週間前');
  assert.equal(relativeTime('2026-09-10T12:00:00Z', 'tr', now), '5 hafta önce');
  assert.match(relativeTime('2026-01-01T12:00:00Z', 'tr', now), /2026/);
  assert.equal(relativeTime('bozuk-tarih', 'tr', now), '');
});

test('düzenleme penceresi 30 dakikada kapanır ve saat kaymasına izin vermez', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  assert.equal(withinEditWindow('2026-10-15T11:45:00Z', now), true);
  assert.equal(withinEditWindow('2026-10-15T11:30:00Z', now), true);
  assert.equal(withinEditWindow('2026-10-15T11:29:59Z', now), false);
  assert.equal(withinEditWindow('2026-10-15T12:05:00Z', now), false);
  assert.equal(withinEditWindow(undefined, now), false);
});

test('konu ve mesaj bağlantıları hash ve sorgu dizesinden okunur', () => {
  assert.deepEqual(routeFromHash(`#thread=${id}&reply=${replyId}`), { thread: id, reply: replyId });
  assert.deepEqual(routeFromHash('', `?thread=${id}`), { thread: id, reply: '' });
  assert.deepEqual(routeFromHash('#thread=gecersiz'), { thread: '', reply: '' });
  assert.deepEqual(routeFromHash('#thread=1 OR 1=1'), { thread: '', reply: '' });
  assert.equal(hashFor(id, replyId), `#thread=${id}&reply=${replyId}`);
  assert.equal(hashFor(id), `#thread=${id}`);
  assert.deepEqual(routeFromHash(hashFor(id, replyId)), { thread: id, reply: replyId });
  assert.equal(initials('Ada Lovelace'), 'AL');
  assert.equal(initials('ada'), 'AD');
  assert.equal(initials(''), '?');
});

test('alıntı özeti boşlukları sadeleştirir ve sınırda kısaltır', () => {
  assert.equal(quoteExcerpt('  bir\n  iki\tüç  '), 'bir iki üç');
  assert.equal(quoteExcerpt('Metin'), 'Metin');
  const long = 'x'.repeat(QUOTE_MAX + 80);
  const excerpt = quoteExcerpt(long);
  assert.ok(excerpt.length <= QUOTE_MAX);
  assert.ok(excerpt.endsWith('…'));
  assert.equal(quoteExcerpt(null), '');
});

test('alıntı, beğeni ve düzenleme girdileri doğrulanır', () => {
  assert.deepEqual(validatePost({ body: 'Yanıt', threadId: id, quoteId: replyId }), { body: 'Yanıt', threadId: id, quoteId: replyId });
  assert.deepEqual(validatePost({ body: 'Yanıt', threadId: id }), { body: 'Yanıt', threadId: id });
  assert.throws(() => validatePost({ body: 'Yanıt', threadId: id, quoteId: 'gecersiz' }));
  assert.deepEqual(validateLike({ action: 'like', kind: 'thread', id }), { kind: 'thread', id });
  assert.throws(() => validateLike({ kind: 'post', id }));
  assert.throws(() => validateLike({ kind: 'thread', id: 'gecersiz' }));
  assert.deepEqual(validateEdit({ action: 'edit', kind: 'reply', id, body: ' Yeni metin ' }), { kind: 'reply', id, body: 'Yeni metin' });
  assert.throws(() => validateEdit({ kind: 'reply', id, body: 'x' }));
  assert.throws(() => validateEdit({ kind: 'forum', id, body: 'Yeni metin' }));
});

/* ---------- sabitlenmiş konu ---------- */

test('liste sabitlenmiş konuları önce sıralar', async () => {
  const h = harness([[{ id, pinned: true, likes: 2, reply_count: 1, view_count: 4 }]]);
  const res = await h.request('GET', {});
  assert.equal(res.code, 200);
  assert.match(h.queries.at(-1).text, /ORDER BY t\.pinned DESC, t\.created_at DESC/);
  assert.match(h.queries.at(-1).text, /LIMIT 30 OFFSET/);
  assert.equal(res.data.threads[0].pinned, true);
  assert.equal(res.data.threads[0].likes, 2);
  assert.equal(res.data.threads[0].view_count, 4);
  assert.equal(res.data.threads[0].mine, false);
  assert.equal('user_id' in res.data.threads[0], false, 'kullanıcı kimliği istemciye gitmemeli');
});

test('moderasyon konu sabitler ve çözer, yanıtta hata verir', async () => {
  const pin = harness([[{ id }]]);
  assert.equal((await pin.request('PATCH', { id, kind: 'thread' }, { action: 'pin' }, { admin: true })).code, 200);
  assert.match(pin.queries.at(-1).text, /UPDATE forum_threads SET pinned=\?/);
  assert.deepEqual(pin.queries.at(-1).values, [true, id]);

  const unpin = harness([[{ id }]]);
  assert.equal((await unpin.request('PATCH', { id, kind: 'thread' }, { action: 'unpin' }, { admin: true })).code, 200);
  assert.deepEqual(unpin.queries.at(-1).values, [false, id]);

  const reply = harness();
  assert.equal((await reply.request('PATCH', { id, kind: 'reply' }, { action: 'pin' }, { admin: true })).code, 400);
  assert.equal(reply.queries.length, 0);

  const guest = harness();
  assert.equal((await guest.request('PATCH', { id, kind: 'thread' }, { action: 'pin' })).code, 401);
  assert.equal(guest.queries.length, 0);
});

/* ---------- görüntülenme ---------- */

test('görüntülenme yalnızca tekrar istendiğinde artar ve onaylı konuyla sınırlıdır', async () => {
  const h = harness([[{ id, approved: true, view_count: 4 }], [], [{ view_count: 5 }], []]);
  const res = await h.request('GET', { id, view: '1' });
  assert.equal(res.code, 200);
  assert.equal(res.data.thread.view_count, 5);
  const bumps = h.queries.filter(q => /UPDATE forum_threads SET view_count/.test(q.text));
  assert.equal(bumps.length, 1);
  assert.match(bumps[0].text, /WHERE id=\? AND approved=TRUE/);
  assert.match(h.queries.at(-3).text, /LIMIT 50 OFFSET/);

  const quiet = harness([[{ id, approved: true, view_count: 4 }], [], []]);
  const plain = await quiet.request('GET', { id });
  assert.equal(plain.data.thread.view_count, 4);
  assert.equal(quiet.queries.filter(q => /UPDATE forum_threads SET view_count/.test(q.text)).length, 0);

  const pending = harness([[{ id, approved: false }], [], []]);
  const managed = await pending.request('GET', { id, view: '1', manage: '1' }, undefined, { admin: true });
  assert.equal(managed.code, 200);
  assert.equal(pending.queries.filter(q => /UPDATE forum_threads SET view_count/.test(q.text)).length, 0);
});

/* ---------- beğeni ---------- */

test('beğeni aç-kapa sayıyı döner ve tek satırla sınırlıdır', async () => {
  const on = harness([[{ key: 'limit' }], [{ id }], [], [], [{ likes: 7 }]]);
  const liked = await on.request('POST', {}, { action: 'like', kind: 'thread', id }, { forum: true });
  assert.equal(liked.code, 200);
  assert.deepEqual(liked.data, { liked: true, likes: 7 });
  const insert = on.queries.find(q => /INSERT INTO forum_likes/.test(q.text));
  assert.ok(insert, 'beğeni kaydı eklenmeli');
  assert.match(on.queries.find(q => /ON CONFLICT \(key\) DO UPDATE/.test(q.text)).text, /INTERVAL '1 second'/);

  const off = harness([[{ key: 'limit' }], [{ id }], [{ id: id }], [], [{ likes: 6 }]]);
  const unliked = await off.request('POST', {}, { action: 'like', kind: 'thread', id }, { forum: true });
  assert.deepEqual(unliked.data, { liked: false, likes: 6 });
  assert.match(off.queries.at(-2).text, /DELETE FROM forum_likes WHERE user_id=\? AND target_kind=\? AND target_id=\?/);
  assert.equal(off.queries.some(q => /INSERT INTO forum_likes/.test(q.text)), false);
});

test('beğeni oturum, hız sınırı ve onaylı hedef ister', async () => {
  const guest = harness();
  assert.equal((await guest.request('POST', {}, { action: 'like', kind: 'thread', id })).code, 401);
  assert.equal(guest.queries.length, 0);

  const throttled = harness([[]]);
  assert.equal((await throttled.request('POST', {}, { action: 'like', kind: 'reply', id: replyId }, { forum: true })).code, 429);

  const hidden = harness([[{ key: 'limit' }], []]);
  const missing = await hidden.request('POST', {}, { action: 'like', kind: 'reply', id: replyId }, { forum: true });
  assert.equal(missing.code, 404);
  assert.match(hidden.queries.at(-1).text, /SELECT id FROM forum_replies WHERE id=\? AND approved=TRUE/);

  const broken = harness();
  assert.equal((await broken.request('POST', {}, { action: 'like', kind: 'thread', id: 'gecersiz' }, { forum: true })).code, 400);
  assert.equal(broken.queries.length, 0);
});

/* ---------- düzenleme ---------- */

test('kendi mesajını düzenleme sahiplik, süre ve hız sınırıyla korunur', async () => {
  const ok = harness([[{ key: 'limit' }], [{ edited_at: '2026-10-15T12:00:00Z' }]]);
  const res = await ok.request('POST', {}, { action: 'edit', kind: 'thread', id, body: 'Düzeltilmiş metin' }, { forum: true });
  assert.equal(res.code, 200);
  assert.equal(res.data.ok, true);
  const query = ok.queries.at(-1);
  assert.match(query.text, /UPDATE forum_threads SET body=\?, edited_at=NOW\(\)/);
  assert.match(query.text, /user_id=\? AND created_at > NOW\(\) - make_interval\(secs => \?\)/);
  assert.deepEqual(query.values, ['Düzeltilmiş metin', id, sessionUser.id, EDIT_WINDOW_MS / 1000]);

  const reply = harness([[{ key: 'limit' }], [{ edited_at: '2026-10-15T12:00:00Z' }]]);
  assert.equal((await reply.request('POST', {}, { action: 'edit', kind: 'reply', id: replyId, body: 'Yanıt düzeltmesi' }, { forum: true })).code, 200);
  assert.match(reply.queries.at(-1).text, /UPDATE forum_replies SET body=\?/);

  const foreign = harness([[{ key: 'limit' }], []]);
  const denied = await foreign.request('POST', {}, { action: 'edit', kind: 'thread', id, body: 'Başkasının konusu' }, { forum: true });
  assert.equal(denied.code, 403);
  assert.match(denied.data.error, /süre|ait/i);

  const guest = harness();
  assert.equal((await guest.request('POST', {}, { action: 'edit', kind: 'thread', id, body: 'Anonim düzenleme' })).code, 401);
  assert.equal(guest.queries.length, 0);

  const throttled = harness([[]]);
  assert.equal((await throttled.request('POST', {}, { action: 'edit', kind: 'thread', id, body: 'Çok sık düzenleme' }, { forum: true })).code, 429);

  const bad = harness();
  assert.equal((await bad.request('POST', {}, { action: 'edit', kind: 'thread', id, body: 'x' }, { forum: true })).code, 400);
  assert.equal(bad.queries.length, 0);
});

/* ---------- alıntı ---------- */

test('alıntılı yanıt onaylı mesajı özetleyip kimliğini saklar', async () => {
  const quotedBody = '  Antrenman   programımda\n\n dinlenme günlerini  arttırdım.  ';
  const h = harness([[], [{ key: 'limit' }], [{ id: replyId, author: 'Bora', body: quotedBody }], [{ id }]]);
  const res = await h.request('POST', {}, { body: 'Aynı deneyimi yaşadım.', threadId: id, quoteId: replyId }, { forum: true });
  assert.equal(res.code, 201);
  const insert = h.queries.at(-1);
  assert.match(insert.text, /INSERT INTO forum_replies \(id,thread_id,author,body,user_id,quote_id,quote_author,quote_excerpt\)/);
  assert.ok(insert.values.includes(replyId));
  assert.ok(insert.values.includes('Bora'));
  assert.ok(insert.values.includes('Antrenman programımda dinlenme günlerini arttırdım.'));
  assert.match(h.queries.at(-2).text, /WHERE id=\? AND thread_id=\? AND approved=TRUE/);
});

test('onaylanmamış veya başka konudaki mesaj alıntılanamaz', async () => {
  const h = harness([[], [{ key: 'limit' }], []]);
  const res = await h.request('POST', {}, { body: 'Alıntı denemesi', threadId: id, quoteId: replyId }, { forum: true });
  assert.equal(res.code, 409);
  assert.match(res.data.error, /Alıntılanan mesaj/);
  assert.equal(h.queries.some(q => /INSERT INTO forum_replies/.test(q.text)), false);
});

/* ---------- yazar bilgisi ---------- */

test('detay görünümü yazar mesaj sayısını ve sahipliği hesaplar', async () => {
  const h = harness([
    [{ id, author: 'Ada', user_id: otherId, approved: true, view_count: 1 }],
    [{ id: replyId, author: 'Bora', quote_author: 'Ada', quote_excerpt: 'ilk mesaj' }],
    [{ author: 'Ada', posts: 120 }, { author: 'Bora', posts: 3 }]
  ]);
  const res = await h.request('GET', { id }, undefined, { forum: true });
  assert.equal(res.code, 200);
  assert.equal(res.data.thread.mine, true);
  assert.equal(res.data.thread.author_posts, 120);
  assert.equal(res.data.replies[0].mine, false);
  assert.equal(res.data.replies[0].author_posts, 3);
  assert.equal(res.data.replies[0].quote_author, 'Ada');
  assert.equal('user_id' in res.data.replies[0], false);
  const stats = h.queries.find(q => /thread_authors/.test(q.text));
  assert.ok(stats, 'yazar istatistiği sorgulanmalı');
  assert.match(stats.text, /COUNT\(\*\)::int FROM forum_threads t WHERE t\.approved AND t\.author=ta\.author/);
  assert.match(stats.text, /COUNT\(\*\)::int FROM forum_replies r WHERE r\.approved AND r\.author=ta\.author/);
});

test('anonim görüntülemede sahiplik ve beğeni bilgisi yoktur', async () => {
  const h = harness([[{ id, author: 'Ada', likes: 3, liked: false }], [], []]);
  const res = await h.request('GET', { id });
  assert.equal(res.data.thread.mine, false);
  assert.equal(res.data.thread.liked, false);
  const sessionLookups = h.queries.filter(q => q.text.startsWith('SELECT') && /forum_sessions/.test(q.text));
  assert.equal(sessionLookups.length, 0, 'çerez yoksa oturum sorgulanmaz');
});

/* ---------- arayüz dosyaları ---------- */

test('forum arayüzü alıntı, beğeni, düzenleme ve sabitleme denetimlerini içerir', () => {
  const html = read('../forum/index.html');
  const script = read('../forum/forum.js');
  const core = read('../forum/forum-core.js');
  const css = read('../forum/style.css');

  assert.match(html, /<script type="module" src="\/forum\/forum\.js"><\/script>/);
  assert.match(html, /id="quote-chip"/);
  assert.match(html, /data-i18n="cancelQuote"/);
  assert.match(script, /from '\.\/forum-core\.js'/);
  for (const hook of ['data-like=', 'data-quote=', 'data-copy=', 'data-edit=', 'data-jump=', 'data-edit-form=', 'data-count=']) {
    assert.ok(script.includes(hook), `${hook} denetimi eksik`);
  }
  for (const action of ["action: 'like'", "action: 'edit'", "'pin'", "'unpin'"]) {
    assert.ok(script.includes(action) || core.includes(action), `${action} işlemi eksik`);
  }
  for (const selector of ['.topic-row', '.post .author', '.rank', '.avatar', '.chip', '.quote', '.quote-chip', '.edit-form', '.admin-bar']) {
    assert.ok(css.includes(selector), `${selector} stili eksik`);
  }
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) {
    assert.ok(key in UI.tr, `${key} anahtarı sözlükte yok`);
  }
  // forum.js içindeki sabit t('...') çağrıları da sözlükte bulunmalı
  for (const [, key] of script.matchAll(/(?<![\w.])t\('([A-Za-z-]+)'\)/g)) {
    assert.ok(key in UI.tr, `t('${key}') sözlükte yok`);
  }
});
