import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('ana menü, blog ve yönetim panelinde forum ayrı bölüm olarak korunur', () => {
  const html = read('src/index.html');
  const nav = html.match(/<nav class="nav-bottom"[\s\S]*?<\/nav>/)?.[0];
  assert.match(nav, /href="\/forum\/"/);
  assert.match(nav, /aria-controls="blogPage"/);
  assert.match(html, /href="\/blog\/"/);
  const admin = read('admin/index.html');
  assert.match(admin, /href="\/forum\/\?manage=1"/);
  assert.match(admin, /href="\/blog\/"/);
  const forum = read('forum/index.html');
  for (const id of ['login-form', 'register-form', 'new-thread', 'reply-form']) {
    assert.ok(forum.includes(`id="${id}"`));
  }
});

test('önizleme forumu, varlıklarını ve blogu yönlendirmeden ayrı sunar', { timeout: 15000 }, async t => {
  const child = spawn(process.execPath, ['tools/dev-server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0', DATABASE_URL: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const ended = once(child, 'exit');
    child.kill();
    await ended;
  });
  child.stderr.resume();
  const port = await new Promise((resolve, reject) => {
    let output = '';
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Preview stopped: ${code}`)));
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/0\.0\.0\.0:(\d+)\/forum\//);
      if (match) resolve(match[1]);
    });
  });
  const get = path => fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
  for (const path of ['/forum', '/forum/', '/forum/index.html', '/forum/?manage=1', '/forum/?lang=en']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.equal(res.headers.get('location'), null);
    const html = await res.text();
    assert.match(html, /id="board"/);
    assert.match(html, /id="reply-form"/);
    assert.match(html, /src="\/forum\/forum.js"/);
  }
  for (const [path, type] of [['/forum/forum.js', 'javascript'], ['/forum/forum-core.js', 'javascript'], ['/forum/style.css', 'css']]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.ok(res.headers.get('content-type').includes(type));
    assert.ok((await res.text()).length > 0);
  }
  const blog = await get('/blog/');
  assert.equal(blog.status, 200);
  assert.match(await blog.text(), /TESTOTAVAN BLOG/);
  assert.equal((await get('/api/_forum')).status, 404, 'private modül açılmamalı');
  assert.equal((await get('/forum/t/not-a-uuid/')).status, 404, 'konu yönlendirmesi ayrı SEO işleyicisinde kalmalı');
});
