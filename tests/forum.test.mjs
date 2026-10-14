import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePost, validId, parseForumQuery } from '../api/_forum.js';
import { createForumHandler } from '../api/forum.js';
import { createSessionCookie } from '../api/_auth.js';
const id = '12345678-1234-4123-8123-123456789abc';
const post = {author:'Test',title:'Test konusu',body:'Merhaba topluluk',category:'Genel'};
process.env.SESSION_SECRET = 'forum-test-secret';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';
const forumToken = 'a'.repeat(64);
const sessionUser = { id, username: 'Ada' };
function harness(results = [], { user = null } = {}) {
  const queries = [];
  const handler = createForumHandler(() => async (strings,...values) => {
    const text = strings.join('?'); queries.push({text,values});
    if (/^(CREATE|ALTER)/.test(text)) return [];
    if (/forum_sessions/.test(text)) return user ? [user] : [];
    return results.shift() || [];
  });
  return { queries, async request(method, query = {}, body, admin = false, extraHeaders = {}, forum = false) {
    const req = {method,query,body,headers:{'content-type':'application/json',...extraHeaders}};
    if (admin) req.headers.cookie = createSessionCookie().split(';')[0];
    if (forum) req.headers.cookie = [req.headers.cookie, `testotavan_forum=${forumToken}`].filter(Boolean).join('; ');
    const res = {headers:{}, setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
    await handler(req,res); return res;
  }};
}
test('forum validates types, lengths, categories and UUIDs', () => {
  assert.equal(validatePost(post).title, post.title);
  assert.deepEqual(validatePost({author:'Test',body:'Yanıt',threadId:id}),{author:'Test',body:'Yanıt',threadId:id});
  for (const invalid of [{...post,author:[]},{...post,title:'x'},{...post,body:'x'.repeat(4001)},{...post,category:'Other'},{...post,threadId:'bad'},null]) assert.throws(() => validatePost(invalid));
  assert.equal(validId(id),true); assert.equal(validId("' OR 1=1"),false);
});
test('moderation requires admin before database access', async () => {
  const h = harness();
  for (const method of ['PATCH','DELETE']) assert.equal((await h.request(method,{id,kind:'thread'},{action:'approve'})).code,401);
  assert.equal((await h.request('GET',{manage:'1'})).code,401);
  assert.equal(h.queries.length,0);
});
test('write requests reject cross-site, non JSON and malformed input',async () => {
  const h=harness();
  assert.equal((await h.request('POST',{},post,false,{'sec-fetch-site':'cross-site'})).code,403);
  assert.equal((await h.request('POST',{},post,false,{'content-type':'text/plain'})).code,415);
  assert.equal((await h.request('POST',{},{})).code,400);
  assert.equal((await h.request('PATCH',{id,kind:'reply'},{action:'lock'},true)).code,400);
  assert.equal((await h.request('GET',{id:'invalid'})).code,400);
  assert.equal(h.queries.length,0);
});
test('public list excludes pending records and uses bounded pagination',async () => {
  const h=harness([[{id}]]), res=await h.request('GET',{offset:'-10'});
  assert.equal(res.code,200); assert.equal(res.headers['Cache-Control'],'no-store');
  assert.deepEqual(res.data.threads,[{id}]);
  const listQuery = h.queries.find(q => q.text.includes('WITH visible'));
  assert.match(listQuery.text, /t.approved=TRUE OR/);
  assert.match(listQuery.text, /LIMIT 31 OFFSET/);
  assert.deepEqual(listQuery.values, [false, false, false, false, '', '', '', '', 'active', 'active', 'active', 0]);
  assert.equal(res.data.hasMore, false);
  assert.deepEqual(res.data.categories, []);
});
test('hidden or missing thread returns 404 without fetching replies',async () => {
  const h=harness();assert.equal((await h.request('GET',{id})).code,404);
  assert.equal(h.queries.filter(q=>q.text.startsWith('SELECT')).length,1);
});
test('posting requires a forum account before any database access', async () => {
  const h = harness();
  const res = await h.request('POST', {}, post);
  assert.equal(res.code, 401);
  assert.match(res.data.error, /giriş/);
  assert.equal(h.queries.length, 0);
});
test('posting is rate limited in database',async () => {
  const h=harness([[],[]], { user: sessionUser });assert.equal((await h.request('POST',{},post,false,{},true)).code,429);
  assert.match(h.queries.at(-1).text,/ON CONFLICT/);
});
test('new topics are pending, parameterized, and ignore a client-supplied author',async () => {
  const h=harness([[],[{key:'key'}],[]], { user: sessionUser });
  const res=await h.request('POST',{},{...post, author:'Impostor'},false,{},true);
  assert.equal(res.code,201);assert.ok(validId(res.data.id));
  assert.match(h.queries.at(-1).text,/INSERT INTO forum_threads/);
  assert.ok(h.queries.at(-1).values.includes(post.body));
  assert.ok(h.queries.at(-1).values.includes('Ada'));
  assert.equal(h.queries.at(-1).values.includes('Impostor'), false);
  assert.doesNotMatch(h.queries.at(-1).text,/approved/);
});
test('locked or unpublished topics cannot receive replies',async () => {
  const h=harness([[],[{key:'key'}],[]], { user: sessionUser });
  assert.equal((await h.request('POST',{}, {author:'Test',body:'Yanıt',threadId:id},false,{},true)).code,409);
  assert.match(h.queries.at(-1).text,/approved=TRUE AND locked=FALSE FOR UPDATE/);
});
test('admin can approve, lock, unlock and delete; missing record is 404',async () => {
  for (const action of ['approve','lock','unlock']) {
    const h=harness([[{id}]]);assert.equal((await h.request('PATCH',{id,kind:'thread'},{action},true)).code,200);
  }
  const h=harness([[{id}]]);assert.equal((await h.request('DELETE',{id,kind:'reply'},{},true)).code,200);
  assert.equal((await harness().request('DELETE',{id,kind:'thread'},{},true)).code,404);
});
test('database failure produces a recoverable response',async () => {
  const h=createForumHandler(()=>{throw new Error('offline');});
  const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;}};
  const original=console.error;console.error=()=>{};
  try { await h({method:'GET',headers:{},query:{}},res); } finally {console.error=original;}
  assert.equal(res.code,500); assert.ok(!res.data.error.includes('offline'));
});

test('forum page offers login and registration', async () => {
  const {readFileSync}=await import('node:fs');
  const html=readFileSync(new URL('../forum/index.html', import.meta.url),'utf8');
  const script=readFileSync(new URL('../forum/forum.js', import.meta.url),'utf8');
  assert.match(html, /id="login-form"/);
  assert.match(html, /id="register-form"/);
  assert.match(html, /Kayıt ol/);
  assert.match(html, /Giriş yap/);
  assert.match(script, /\/api\/forum-auth/);
  assert.match(script, /action:'logout'|action: 'logout'|action, \.\.\.data/);
});

test('navigation selection uses page targets rather than positional indexes', async () => {
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');
  assert.ok(source.includes("item.getAttribute('aria-controls') === pageId"));
});


test('forum filters validate all values before querying the database', async () => {
  assert.deepEqual(parseForumQuery({ q: '  protein  ', category: 'Beslenme', sort: 'popular' }), { search: 'protein', category: 'Beslenme', sort: 'popular' });
  const h = harness();
  for (const query of [{ q: ['x'] }, { q: 'x'.repeat(121) }, { category: 'Other' }, { category: ['Genel'] }, { sort: 'DROP TABLE' }, { sort: ['newest'] }]) {
    assert.equal((await h.request('GET', query)).code, 400);
  }
  assert.equal(h.queries.length, 0);
});

test('lookahead pagination does not expose the extra row or create an empty last page', async () => {
  for (const length of [0, 30, 31]) {
    const h = harness([Array.from({ length }, () => ({ id }))]);
    const res = await h.request('GET', { offset: '9999999' });
    assert.equal(res.data.threads.length, Math.min(length, 30));
    assert.equal(res.data.hasMore, length > 30);
    assert.equal(h.queries.find(q => q.text.includes('WITH visible')).values.at(-1), 100000);
  }
  for (const length of [0, 50, 51]) {
    const h = harness([[{ id }], Array.from({ length }, () => ({ id }))]);
    const res = await h.request('GET', { id });
    assert.equal(res.data.replies.length, Math.min(length, 50));
    assert.equal(res.data.hasMore, length > 50);
    assert.match(h.queries.at(-1).text, /LIMIT 51 OFFSET/);
  }
});
