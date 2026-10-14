import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePost, validId } from '../api/_forum.js';
import { createForumHandler } from '../api/forum.js';
import { createSessionCookie } from '../api/_auth.js';
const id = '12345678-1234-4123-8123-123456789abc';
const post = {author:'Test',title:'Test konusu',body:'Merhaba topluluk',category:'Genel'};
process.env.SESSION_SECRET = 'forum-test-secret';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';
function harness(results = []) {
  const queries = [];
  const handler = createForumHandler(() => async (strings,...values) => {
    const text = strings.join('?'); queries.push({text,values});
    if (/^CREATE/.test(text)) return [];
    return results.shift() || [];
  });
  return { queries, async request(method, query = {}, body, admin = false, extraHeaders = {}) {
    const req = {method,query,body,headers:{'content-type':'application/json',...extraHeaders}};
    if (admin) req.headers.cookie = createSessionCookie().split(';')[0];
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
  assert.match(h.queries.at(-1).text,/t.approved=TRUE OR/);
  assert.deepEqual(h.queries.at(-1).values,[false,false,false,0]);
});
test('hidden or missing thread returns 404 without fetching replies',async () => {
  const h=harness();assert.equal((await h.request('GET',{id})).code,404);
  assert.equal(h.queries.filter(q=>q.text.startsWith('SELECT')).length,1);
});
test('posting is rate limited in database',async () => {
  const h=harness([[],[]]);assert.equal((await h.request('POST',{},post)).code,429);
  assert.match(h.queries.at(-1).text,/ON CONFLICT/);
});
test('new topics are pending and SQL parameterized',async () => {
  const h=harness([[],[{key:'key'}],[]]);const res=await h.request('POST',{},post);
  assert.equal(res.code,201);assert.ok(validId(res.data.id));
  assert.match(h.queries.at(-1).text,/INSERT INTO forum_threads/);
  assert.ok(h.queries.at(-1).values.includes(post.body));
  assert.doesNotMatch(h.queries.at(-1).text,/approved/);
});
test('locked or unpublished topics cannot receive replies',async () => {
  const h=harness([[],[{key:'key'}],[]]);
  assert.equal((await h.request('POST',{}, {author:'Test',body:'Yanıt',threadId:id})).code,409);
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

test('navigation selection uses page targets rather than positional indexes', async () => {
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');
  assert.ok(source.includes("item.getAttribute('aria-controls') === pageId"));
});
