(() => {
  const $ = id => document.getElementById(id);
  const requestedManage = new URLSearchParams(location.search).get('manage') === '1';
  let manage = false, offset = 0, replyOffset = 0, current = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = value => new Date(value).toLocaleString('tr-TR');
  const status = message => { $('status').textContent = message; };
  async function api(params = '', options = {}) {
    const response = await fetch('/api/forum?' + params + (manage ? '&manage=1' : ''), options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
    return data;
  }
  function controls(item, kind) {
    if (!manage) return '';
    const button = (action, label) => `<button class="secondary" data-action="${action}" data-kind="${kind}" data-id="${esc(item.id)}">${label}</button>`;
    return `<div>${!item.approved ? button('approve','Onayla') : ''}${kind === 'thread' ? button(item.locked ? 'unlock' : 'lock',item.locked ? 'Kilidi aç' : 'Kilitle') : ''}${button('delete','Sil')}</div>`;
  }
  function meta(item) { return `<div class="meta">${!item.approved ? '<span class="badge">Onay bekliyor</span>' : ''}${esc(item.author)} · ${esc(date(item.created_at))}</div>`; }
  async function loadList() {
    status('Konular yükleniyor…');
    const { threads } = await api('offset=' + offset);
    $('threads').innerHTML = threads.map(t => `<article><span class="badge">${esc(t.category)}${t.locked ? ' · Kilitli' : ''}</span><h2><button class="topic" data-open="${esc(t.id)}">${esc(t.title)}</button></h2>${meta(t)}<p class="meta">${t.reply_count} yanıt${manage ? ` · ${t.pending_count} yanıt onay bekliyor` : ''}</p>${controls(t,'thread')}</article>`).join('') || '<article>Henüz konu yok. İlk sohbeti sen başlat!</article>';
    $('previous').disabled = offset === 0; $('next').disabled = threads.length < 30;
    $('page').textContent = 'Sayfa ' + (offset / 30 + 1); status('');
  }
  async function open(id) {
    status('Sohbet yükleniyor…');
    const { thread, replies } = await api(`id=${encodeURIComponent(id)}&offset=${replyOffset}`);
    current = id; $('listing').hidden = true; $('detail').hidden = false;
    $('conversation').innerHTML = `<article><span class="badge">${esc(thread.category)}${thread.locked ? ' · Kilitli' : ''}</span><h2>${esc(thread.title)}</h2>${meta(thread)}<p>${esc(thread.body)}</p>${controls(thread,'thread')}</article><h2>Yanıtlar</h2>` + (replies.map(r => `<article>${meta(r)}<p>${esc(r.body)}</p>${controls(r,'reply')}</article>`).join('') || '<p class="meta">Henüz yanıt yok.</p>');
    $('reply-form').hidden = thread.locked || !thread.approved;
    $('reply-prev').disabled = replyOffset === 0; $('reply-next').disabled = replies.length < 50;
    status(thread.locked ? 'Bu konu yeni yanıtlara kapalı.' : '');
  }
  const run = task => Promise.resolve().then(task).catch(e => status(e.message));
  $('refresh').onclick = () => run(loadList);
  $('previous').onclick = () => { offset = Math.max(0,offset-30); run(loadList); };
  $('next').onclick = () => { offset += 30; run(loadList); };
  $('reply-prev').onclick = () => { replyOffset = Math.max(0,replyOffset-50); run(() => open(current)); };
  $('reply-next').onclick = () => { replyOffset += 50; run(() => open(current)); };
  $('back').onclick = () => { current = null; $('detail').hidden = true; $('listing').hidden = false; run(loadList); };
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.open) { replyOffset = 0; run(() => open(button.dataset.open)); }
    if (button.dataset.action) run(async () => {
      const {action, kind, id} = button.dataset;
      if (action === 'delete' && !confirm(kind === 'thread' ? 'Konu ve tüm yanıtları kalıcı olarak silinsin mi?' : 'Yanıt kalıcı olarak silinsin mi?')) return;
      button.disabled = true;
      try {
        await api(`id=${encodeURIComponent(id)}&kind=${kind}`, { method: action === 'delete' ? 'DELETE' : 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action}) });
        if (action === 'delete' && kind === 'thread') { current = null; $('detail').hidden = true; $('listing').hidden = false; }
        await (current ? open(current) : loadList()); status('İşlem tamamlandı.');
      } finally { button.disabled = false; }
    });
  });
  for (const id of ['new-thread','reply-form']) $(id).onsubmit = event => {
    event.preventDefault(); const form = event.target, button = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form)); if (id === 'reply-form') data.threadId = current;
    button.disabled = true;
    run(async () => { try {
      const result = await api('', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      form.reset(); status(result.message);
    } finally { button.disabled = false; } });
  };
  run(async () => {
    if (requestedManage) {
      const response = await fetch('/api/session'); const session = await response.json();
      if (!session.authenticated) { $('listing').hidden = true; throw new Error('Moderasyon için admin panelinden giriş yapın.'); }
      manage = true; document.querySelector('h1').textContent = 'Forum yönetimi'; $('new-thread').hidden = true;
    }
    await loadList();
  });
})();
