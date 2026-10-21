import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlogPageHandler } from '../api/blog-page.js';
import { createForumPageHandler, renderForumThread } from '../api/forum-page.js';

const ORIGIN = 'https://testosteron-test.vercel.app';
const THREAD_ID = '12345678-1234-4123-8123-123456789abc';

/* ------------------------------------------------------------------ sahte veritabanı */

function contentRow(overrides = {}) {
  return {
    id: 'content-1',
    type: 'blog',
    category: 'Uyku',
    title: 'Sabah güneşi ve uyku hormonları',
    slug: 'sabah-gunesi-ve-uyku',
    emoji: '🌙',
    time: '6 dk',
    summary: 'Düzenli uyku ve sabah ışığı hormonal dengeyi destekler.',
    body: 'Uyku hormonal sağlığın temelidir.\n\n## Neden önemli\n\nGece salgılanan hormonlar günü belirler.\n\n## Sık Sorulan Sorular\n\nUyku testosteronu etkiler mi?\nEvet, düzenli uyku hormonal dengeyi destekler.\n\nKaynak: Örnek Haber (https://ornek.com/haber)',
    ingredients: [],
    translations: {},
    cover_url: '',
    date: '2026-10-01',
    published_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-02T09:00:00Z',
    ...overrides
  };
}

function fakeContentSql(rows = [contentRow()]) {
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/INSERT|UPDATE|DELETE/.test(text)) return [];
    if (/FROM content/.test(text)) {
      if (/WHERE slug=\?/.test(text)) return rows.filter(row => row.slug === values[0]);
      if (/WHERE id=\?/.test(text)) return rows.filter(row => row.id === values[0]);
      return rows;
    }
    return [];
  };
  return { sql, queries };
}

function fakeForumSql({ thread = null, replies = [], related = [], authorPosts = [] } = {}) {
  const queries = [];
  let called = 0;
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    if (/^(CREATE|ALTER)/.test(text)) return [];
    called += 1;
    if (/FROM forum_threads t WHERE t.id=\? AND t.approved=TRUE/.test(text)) return thread ? [thread] : [];
    if (/FROM forum_replies r WHERE r.thread_id=\?/.test(text)) return replies;
    if (/AND t.id<>\? AND t.category=\?/.test(text)) return related;
    if (/WITH thread_authors/.test(text)) return authorPosts;
    return [];
  };
  return { sql, queries, calls: () => called };
}

function makeResponse() {
  return {
    headers: {}, code: 0, body: '',
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; }
  };
}

async function request(handler, { method = 'GET', query = {}, headers = { host: 'testosteron-test.vercel.app' } } = {}) {
  const res = makeResponse();
  await handler({ method, query, headers }, res);
  return res;
}

/* ------------------------------------------------------------------ blog yönlendirme */

test('blog arşivi ve yazı sayfası doğru HTTP davranışını gösterir', async () => {
  const { sql } = fakeContentSql();
  const handler = createBlogPageHandler({ connect: () => sql, env: {} });

  const hub = await request(handler);
  assert.equal(hub.code, 200);
  assert.match(hub.headers['Content-Type'], /text\/html/);
  assert.match(hub.headers['Cache-Control'], /s-maxage=120/);
  assert.match(hub.body, /<link rel="canonical" href="https:\/\/testosteron-test\.vercel\.app\/blog\/">/);
  assert.match(hub.body, /href="\/blog\/sabah-gunesi-ve-uyku\/"/, 'arşiv kartı yazının kendi adresine gitmeli');
  assert.match(hub.body, /Blog — Hormon, uyku ve güç rehberi/);

  const post = await request(handler, { query: { slug: 'sabah-gunesi-ve-uyku/' } });
  assert.equal(post.code, 200);
  assert.match(post.headers['Cache-Control'], /s-maxage=300|stale-while-revalidate=86400/);
  assert.match(post.body, /<h1>Sabah güneşi ve uyku hormonları<\/h1>/);
  assert.match(post.body, /DiscussionForumPosting|BlogPosting/);
  assert.doesNotMatch(post.body, /Kaynak:\s*Örnek Haber/, 'kaynak satırı yayınlanmamalı');
  assert.match(post.body, /"@type":"FAQPage"|"@type": "FAQPage"/);

  const missing = await request(handler, { query: { slug: 'olmayan-yazi' } });
  assert.equal(missing.code, 404);
  assert.match(missing.body, /noindex/);

  const notAllowed = await request(handler, { method: 'POST' });
  assert.equal(notAllowed.code, 405);
  assert.equal(notAllowed.headers.Allow, 'GET, HEAD');

  const head = await request(handler, { method: 'HEAD' });
  assert.equal(head.code, 200, 'HEAD istekleri GET gibi yanıtlanmalı');
});

test('blog yönlendiricisi veritabanı yokken de çalışır ve yazı bulunamaz', async () => {
  const handler = createBlogPageHandler({
    connect: () => { throw new Error('offline'); },
    env: {}
  });
  const hub = await request(handler);
  assert.equal(hub.code, 200);
  assert.match(hub.body, /Henüz yayınlanmış yazı yok/);

  const post = await request(handler, { query: { slug: 'sabah-gunesi-ve-uyku' } });
  assert.equal(post.code, 404);
});

test('blog yazısı dil varyantında çeviri metnini ve hreflang bağlarını kullanır', async () => {
  const rows = [contentRow({
    translations: {
      en: { title: 'Morning light and sleep hormones', summary: 'Regular sleep supports hormonal balance.', body: 'Sleep is the foundation.' }
    }
  })];
  const { sql } = fakeContentSql(rows);
  const handler = createBlogPageHandler({ connect: () => sql, env: {} });
  const res = await request(handler, { query: { slug: 'sabah-gunesi-ve-uyku', lang: 'en' } });
  assert.equal(res.code, 200);
  assert.match(res.body, /<html lang="en"/);
  assert.match(res.body, /<h1>Morning light and sleep hormones<\/h1>/);
  assert.match(res.body, /hreflang="en" href="https:\/\/testosteron-test\.vercel\.app\/blog\/sabah-gunesi-ve-uyku\/\?lang=en"/);
  assert.equal(res.headers['Content-Language'], 'en');
});

/* ------------------------------------------------------------------ forum yönlendirme */

test('forum konu sayfası geçersiz kimliği veritabanına gitmeden reddeder', async () => {
  const fake = fakeForumSql();
  const handler = createForumPageHandler({ connect: () => fake.sql, env: {} });
  for (const id of ['', '1 OR 1=1', '12345678-1234-4123-8123']) {
    const res = await request(handler, { query: { id } });
    assert.equal(res.code, 404, `${id} reddedilmeli`);
    assert.match(res.body, /noindex/);
  }
  assert.equal(fake.calls(), 0, 'geçersiz kimlikte sorgu çalışmamalı');
});

test('forum konu sayfası onaylı konuyu, yanıtları ve yapılandırılmış veriyi üretir', async () => {
  const thread = {
    id: THREAD_ID, author: 'Ada', title: 'Uyku düzenimi nasıl oturttunuz?', category: 'Genel',
    body: 'Son üç aydır uyku saatimi sabitlemeye çalışıyorum.', created_at: '2026-10-01T09:00:00Z',
    view_count: 42, replies: 1, likes: 3, pinned: false, locked: false, approved: true, quote_author: '', quote_excerpt: ''
  };
  const replies = [{
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', author: 'Kaan', body: 'Aynı saatte yatmak bende işe yaradı.',
    created_at: '2026-10-01T10:00:00Z', likes: 1, quote_author: '', quote_excerpt: ''
  }];
  const fake = fakeForumSql({
    thread,
    replies,
    related: [{ ...thread, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Işık ve uyku', reply_count: 2 }],
    authorPosts: [{ author: 'Ada', posts: 12 }]
  });
  const handler = createForumPageHandler({ connect: () => fake.sql, env: {} });
  const res = await request(handler, { query: { id: `${THREAD_ID}/` } });
  assert.equal(res.code, 200);
  assert.match(res.headers['Content-Type'], /text\/html/);
  assert.match(res.body, /<h1[^>]*>Uyku düzenimi nasıl oturttunuz\?/);
  assert.match(res.body, /Aynı saatte yatmak bende işe yaradı/);
  assert.match(res.body, /Işık ve uyku/, 'benzer konular iç bağlantı olmalı');
  const ld = JSON.parse(res.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const types = ld['@graph'].map(entry => entry['@type']);
  assert.ok(types.includes('DiscussionForumPosting'));
  assert.ok(types.includes('BreadcrumbList'));
  assert.ok(res.body.includes(`<link rel="canonical" href="${ORIGIN}/forum/t/${THREAD_ID}/">`));
  assert.match(res.body, /href="https:\/\/testosteron-test\.vercel\.app\/forum\/"/, 'konudan forum ana sayfasına dönüş bağlantısı olmalı');
  assert.equal(res.headers['Content-Language'], 'tr');
});

test('forum konu sayfası bilinmeyen ve kilitli konuyu 404 ile karşılar', async () => {
  const fake = fakeForumSql({ thread: null });
  const handler = createForumPageHandler({ connect: () => fake.sql, env: {} });
  const res = await request(handler, { query: { id: THREAD_ID } });
  assert.equal(res.code, 404);
  assert.match(res.body, /noindex/);
});

test('forum konu sayfası veritabanı hatasında 503 ve yedek sayfa döner', async () => {
  const handler = createForumPageHandler({ connect: () => { throw new Error('offline'); }, env: {} });
  const res = await request(handler, { query: { id: THREAD_ID } });
  assert.equal(res.code, 503);
  assert.match(res.body, /noindex/);
});

/* ------------------------------------------------------------------ saf üretici */

test('konu sayfası üreticisi yazar rütbesini ve beğeni sayısını işler', () => {
  const thread = {
    id: THREAD_ID, author: 'Ada', title: 'Başlık', category: 'Beslenme', body: 'Gövde metni.',
    created_at: '2026-10-01T09:00:00Z', view_count: 12, likes: 4, pinned: true, locked: false, approved: true
  };
  const html = renderForumThread({
    thread,
    replies: [],
    authorPosts: new Map([['Ada', 120]]),
    siteUrl: ORIGIN,
    env: {}
  });
  assert.match(html, /Kıdemli üye|Veteran/);
  assert.match(html, /4/, 'beğeni sayısı görünmeli');
  assert.match(html, /Sabit konu|Pinned/);
});
