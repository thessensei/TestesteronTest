(() => {
  const $ = id => document.getElementById(id);
  const requestedManage = new URLSearchParams(location.search).get('manage') === '1';
  const LANG_KEY = 'testotavan_language';
  const dict = {
    en: {
      site: '← Back to site', eyebrow: 'LEARN TOGETHER, SHARE WHAT WORKS',
      title: 'Progress starts with a conversation.',
      intro: 'Talk with the community about training, nutrition and daily habits.',
      aside: 'Your account name is shown instead of a nickname. Do not share personal health data. Posts are not medical advice. Be respectful; topics and replies go live after admin approval.',
      'login-title': 'Continue with your account', 'login-help': 'You stay signed in for 14 days. Your username appears on posts.',
      'register-title': 'Create a free account', 'register-help': 'Pick a 3–20 character username and a password of at least 8 characters with a letter and a number.',
      username: 'Username', password: 'Password', confirm: 'Confirm password',
      'login-submit': 'Log in', 'register-submit': 'Sign up', logout: 'Log out',
      topics: 'Topics', refresh: 'Refresh', prev: '← Previous', next: 'Next →',
      'gate-title': 'An account is required to join', 'gate-body': 'Starting a topic and replying are free. Log in or create an account first.',
      'new-title': 'Start a conversation', category: 'Category', titleField: 'Topic title', message: 'Message',
      'send-topic': 'Submit for approval →', back: '← All topics',
      'reply-prev': '← Previous replies', 'reply-next': 'Next replies →',
      'reply-gate': 'Log in or sign up to reply.', 'reply-title': 'Join the conversation', reply: 'Reply',
      'send-reply': 'Submit reply for approval →', page: 'Page', empty: 'No topics yet. Start the first conversation!',
      replies: 'replies', pending: 'replies awaiting approval', loading: 'Loading topics…',
      opening: 'Loading conversation…', locked: 'This topic is closed to new replies.',
      postedAs: 'Posting as', welcome: 'Welcome', authRequired: 'Log in to post.',
      mismatch: 'Passwords do not match.', manage: 'Forum moderation',
      approve: 'Approve', unlock: 'Unlock', lock: 'Lock', locked: 'Locked', delete: 'Delete',
      'cat-general': 'General', 'cat-training': 'Training', 'cat-nutrition': 'Nutrition', 'cat-stories': 'Experiences',
      waiting: 'Awaiting approval', deleteTopic: 'Delete this topic and all replies permanently?',
      deleteReply: 'Delete this reply permanently?', done: 'Done.', noReplies: 'No replies yet.',
      replyHeading: 'Replies'
    },
    de: {
      site: '← Zurück zur Seite', eyebrow: 'GEMEINSAM LERNEN, ERFAHRUNG TEILEN',
      title: 'Fortschritt beginnt mit einem Gespräch.',
      intro: 'Sprich mit der Community über Training, Ernährung und Alltagsgewohnheiten.',
      aside: 'Dein Kontoname wird angezeigt, kein Spitzname. Teile keine persönlichen Gesundheitsdaten. Beiträge sind kein medizinischer Rat. Bleib respektvoll; Themen und Antworten erscheinen nach Admin-Freigabe.',
      'login-title': 'Mit deinem Konto fortfahren', 'login-help': 'Die Sitzung bleibt 14 Tage aktiv. Dein Benutzername steht unter Beiträgen.',
      'register-title': 'Kostenloses Konto erstellen', 'register-help': 'Wähle einen Benutzernamen mit 3–20 Zeichen und ein Passwort mit mindestens 8 Zeichen, einem Buchstaben und einer Zahl.',
      username: 'Benutzername', password: 'Passwort', confirm: 'Passwort wiederholen',
      'login-submit': 'Anmelden', 'register-submit': 'Registrieren', logout: 'Abmelden',
      topics: 'Themen', refresh: 'Aktualisieren', prev: '← Zurück', next: 'Weiter →',
      'gate-title': 'Zum Mitmachen brauchst du ein Konto', 'gate-body': 'Themen und Antworten sind kostenlos. Melde dich an oder registriere dich.',
      'new-title': 'Gespräch starten', category: 'Kategorie', titleField: 'Thementitel', message: 'Nachricht',
      'send-topic': 'Zur Freigabe senden →', back: '← Alle Themen',
      'reply-prev': '← Vorherige Antworten', 'reply-next': 'Nächste Antworten →',
      'reply-gate': 'Zum Antworten anmelden oder registrieren.', 'reply-title': 'Am Gespräch teilnehmen', reply: 'Antwort',
      'send-reply': 'Antwort zur Freigabe senden →', page: 'Seite', empty: 'Noch keine Themen. Starte das erste Gespräch!',
      replies: 'Antworten', pending: 'Antworten warten auf Freigabe', loading: 'Themen werden geladen…',
      opening: 'Gespräch wird geladen…', locked: 'Dieses Thema ist für neue Antworten geschlossen.',
      postedAs: 'Du schreibst als', welcome: 'Willkommen', authRequired: 'Zum Schreiben bitte anmelden.',
      mismatch: 'Passwörter stimmen nicht überein.', manage: 'Forum-Moderation',
      approve: 'Freigeben', unlock: 'Entsperren', lock: 'Sperren', locked: 'Gesperrt', delete: 'Löschen',
      'cat-general': 'Allgemein', 'cat-training': 'Training', 'cat-nutrition': 'Ernährung', 'cat-stories': 'Erfahrungen',
      waiting: 'Wartet auf Freigabe', deleteTopic: 'Thema und alle Antworten dauerhaft löschen?',
      deleteReply: 'Antwort dauerhaft löschen?', done: 'Erledigt.', noReplies: 'Noch keine Antworten.',
      replyHeading: 'Antworten'
    },
    ja: {
      site: '← サイトに戻る', eyebrow: '一緒に学び、経験を共有する',
      title: '成長は会話から始まります。',
      intro: 'トレーニング、食事、日々の習慣についてコミュニティと話そう。',
      aside: 'ニックネームではなくアカウント名が表示されます。個人の健康データは共有しないでください。投稿は医療アドバイスではありません。敬意を持って。トピックと返信は管理者の承認後に公開されます。',
      'login-title': 'アカウントで続ける', 'login-help': 'ログイン状態は14日間続きます。投稿にはユーザー名が表示されます。',
      'register-title': '無料アカウントを作成', 'register-help': '3〜20文字のユーザー名と、文字と数字を含む8文字以上のパスワードを選んでください。',
      username: 'ユーザー名', password: 'パスワード', confirm: 'パスワード確認',
      'login-submit': 'ログイン', 'register-submit': '登録', logout: 'ログアウト',
      topics: 'トピック', refresh: '更新', prev: '← 前へ', next: '次へ →',
      'gate-title': '参加にはアカウントが必要です', 'gate-body': 'トピック作成と返信は無料です。ログインまたは登録してください。',
      'new-title': '会話を始める', category: 'カテゴリー', titleField: 'タイトル', message: 'メッセージ',
      'send-topic': '承認へ送る →', back: '← すべてのトピック',
      'reply-prev': '← 前の返信', 'reply-next': '次の返信 →',
      'reply-gate': '返信するにはログインまたは登録してください。', 'reply-title': '会話に参加', reply: '返信',
      'send-reply': '返信を承認へ送る →', page: 'ページ', empty: 'まだトピックがありません。最初の会話を始めましょう。',
      replies: '件の返信', pending: '件が承認待ち', loading: 'トピックを読み込み中…',
      opening: '会話を読み込み中…', locked: 'このトピックは新しい返信を受け付けていません。',
      postedAs: '投稿者', welcome: 'ようこそ', authRequired: '投稿するにはログインしてください。',
      mismatch: 'パスワードが一致しません。', manage: 'フォーラム管理',
      approve: '承認', unlock: 'ロック解除', lock: 'ロック', locked: 'ロック中', delete: '削除',
      'cat-general': '一般', 'cat-training': 'トレーニング', 'cat-nutrition': '栄養', 'cat-stories': '体験',
      waiting: '承認待ち', deleteTopic: 'トピックとすべての返信を完全に削除しますか？',
      deleteReply: '返信を完全に削除しますか？', done: '完了しました。', noReplies: 'まだ返信がありません。',
      replyHeading: '返信'
    }
  };
  let lang = localStorage.getItem(LANG_KEY) || 'tr';
  if (!dict[lang] && lang !== 'tr') lang = 'tr';
  let manage = false, offset = 0, replyOffset = 0, current = null, user = null, authMode = null;
  const catLabel = value => ({ Genel: t('cat-general'), Antrenman: t('cat-training'), Beslenme: t('cat-nutrition'), Deneyimler: t('cat-stories') }[value] || value);
  const t = key => (lang !== 'tr' && dict[lang] && dict[lang][key]) || ({
    site: '← Siteye dön', eyebrow: 'BİRLİKTE ÖĞREN, DENEYİMİNİ PAYLAŞ',
    title: 'Gelişim bir sohbetle başlar.',
    intro: 'Antrenman, beslenme ve günlük alışkanlıklar üzerine toplulukla konuş.',
    aside: 'Rumuz yerine hesabın görünür. Kişisel sağlık verilerini paylaşma. Buradaki paylaşımlar tıbbi tavsiye değildir. Saygılı ol; konu ve yanıtlar admin onayından sonra yayınlanır.',
    'login-title': 'Hesabınla devam et', 'login-help': 'Oturum 14 gün açık kalır. Paylaşımlarda kullanıcı adın görünür.',
    'register-title': 'Ücretsiz hesap oluştur', 'register-help': '3–20 karakterlik bir kullanıcı adı ve en az 8 karakterlik, harf ile rakam içeren bir şifre seç.',
    username: 'Kullanıcı adı', password: 'Şifre', confirm: 'Şifre tekrar',
    'login-submit': 'Giriş yap', 'register-submit': 'Kayıt ol', logout: 'Çıkış',
    topics: 'Konular', refresh: 'Yenile', prev: '← Önceki', next: 'Sonraki →',
    'gate-title': 'Sohbete katılmak için hesap gerekir', 'gate-body': 'Konu açmak ve yanıt yazmak ücretsizdir. Önce giriş yap veya kayıt ol.',
    'new-title': 'Yeni bir sohbet başlat', category: 'Kategori', titleField: 'Konu başlığı', message: 'Mesaj',
    'send-topic': 'Onaya gönder →', back: '← Tüm konular',
    'reply-prev': '← Önceki yanıtlar', 'reply-next': 'Sonraki yanıtlar →',
    'reply-gate': 'Yanıt yazmak için giriş yap veya kayıt ol.', 'reply-title': 'Sohbete katıl', reply: 'Yanıt',
    'send-reply': 'Yanıtı onaya gönder →', page: 'Sayfa', empty: 'Henüz konu yok. İlk sohbeti sen başlat!',
    replies: 'yanıt', pending: 'yanıt onay bekliyor', loading: 'Konular yükleniyor…',
    opening: 'Sohbet yükleniyor…', locked: 'Bu konu yeni yanıtlara kapalı.',
    postedAs: 'Şu hesapla yazıyorsun', welcome: 'Hoş geldin', authRequired: 'Yazmak için giriş yap.',
    mismatch: 'Şifreler eşleşmiyor.', manage: 'Forum yönetimi',
    approve: 'Onayla', unlock: 'Kilidi aç', lock: 'Kilitle', locked: 'Kilitli', delete: 'Sil',
    'cat-general': 'Genel', 'cat-training': 'Antrenman', 'cat-nutrition': 'Beslenme', 'cat-stories': 'Deneyimler',
    waiting: 'Onay bekliyor', deleteTopic: 'Konu ve tüm yanıtları kalıcı olarak silinsin mi?',
    deleteReply: 'Yanıt kalıcı olarak silinsin mi?', done: 'İşlem tamamlandı.', noReplies: 'Henüz yanıt yok.',
    replyHeading: 'Yanıtlar'
  }[key] || key);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = value => new Date(value).toLocaleString(lang === 'ja' ? 'ja-JP' : lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'tr-TR');
  const status = message => { $('status').textContent = message || ''; };
  function applyLanguage() {
    document.documentElement.lang = lang;
    $('forum-lang').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      if (el.firstChild) el.firstChild.textContent = t(el.dataset.i18nLabel);
    });
    $('page-title').textContent = manage ? t('manage') : t('title');
    const categories = { Genel: t('cat-general'), Antrenman: t('cat-training'), Beslenme: t('cat-nutrition'), Deneyimler: t('cat-stories') };
    document.querySelectorAll('select[name=category] option').forEach(option => { option.textContent = categories[option.value] || option.value; });
    $('logout').textContent = t('logout');
    $('show-login').textContent = t('login-submit');
    $('show-register').textContent = t('register-submit');
    if (user) $('composer-as').textContent = `${t('postedAs')}: ${user.username}`;
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
    $('auth-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
    return data;
  }
  function controls(item, kind) {
    if (!manage) return '';
    const button = (action, label) => `<button class="secondary" type="button" data-action="${action}" data-kind="${kind}" data-id="${esc(item.id)}">${label}</button>`;
    return `<div>${!item.approved ? button('approve', t('approve')) : ''}${kind === 'thread' ? button(item.locked ? 'unlock' : 'lock', item.locked ? t('unlock') : t('lock')) : ''}${button('delete', t('delete'))}</div>`;
  }
  function meta(item) {
    return `<div class="meta">${!item.approved ? `<span class="badge">${esc(t('waiting'))}</span>` : ''}${esc(item.author)} · ${esc(date(item.created_at))}</div>`;
  }
  async function loadList() {
    status(t('loading'));
    const { threads } = await api('offset=' + offset);
    $('threads').innerHTML = threads.map(item => `<article><span class="badge">${esc(catLabel(item.category))}${item.locked ? ' · ' + esc(t('locked')) : ''}</span><h2><button class="topic" type="button" data-open="${esc(item.id)}">${esc(item.title)}</button></h2>${meta(item)}<p class="meta">${item.reply_count} ${esc(t('replies'))}${manage ? ` · ${item.pending_count} ${esc(t('pending'))}` : ''}</p>${controls(item, 'thread')}</article>`).join('') || `<article>${esc(t('empty'))}</article>`;
    $('previous').disabled = offset === 0;
    $('next').disabled = threads.length < 30;
    $('page').textContent = `${t('page')} ${offset / 30 + 1}`;
    status('');
  }
  async function open(id) {
    status(t('opening'));
    const { thread, replies } = await api(`id=${encodeURIComponent(id)}&offset=${replyOffset}`);
    current = id;
    $('listing').hidden = true;
    $('detail').hidden = false;
    $('conversation').innerHTML = `<article><span class="badge">${esc(catLabel(thread.category))}${thread.locked ? ' · ' + esc(t('locked')) : ''}</span><h2>${esc(thread.title)}</h2>${meta(thread)}<p>${esc(thread.body)}</p>${controls(thread, 'thread')}</article><h2>${esc(t('replyHeading'))}</h2>` + (replies.map(item => `<article>${meta(item)}<p>${esc(item.body)}</p>${controls(item, 'reply')}</article>`).join('') || `<p class="meta">${esc(t('noReplies'))}</p>`);
    const canReply = Boolean(user) && !thread.locked && thread.approved && !manage;
    $('reply-form').hidden = !canReply;
    $('reply-gate').hidden = Boolean(user) || thread.locked || !thread.approved || manage;
    $('reply-prev').disabled = replyOffset === 0;
    $('reply-next').disabled = replies.length < 50;
    status(thread.locked ? t('locked') : '');
  }
  const run = task => Promise.resolve().then(task).catch(error => status(error.message));
  $('refresh').onclick = () => run(loadList);
  $('previous').onclick = () => { offset = Math.max(0, offset - 30); run(loadList); };
  $('next').onclick = () => { offset += 30; run(loadList); };
  $('reply-prev').onclick = () => { replyOffset = Math.max(0, replyOffset - 50); run(() => open(current)); };
  $('reply-next').onclick = () => { replyOffset += 50; run(() => open(current)); };
  $('back').onclick = () => { current = null; $('detail').hidden = true; $('listing').hidden = false; run(loadList); };
  $('show-login').onclick = () => showAuth('login');
  $('show-register').onclick = () => showAuth('register');
  $('gate-login').onclick = () => showAuth('login');
  $('gate-register').onclick = () => showAuth('register');
  $('reply-login').onclick = () => showAuth('login');
  $('tab-login').onclick = () => showAuth('login');
  $('tab-register').onclick = () => showAuth('register');
  $('forum-lang').onchange = () => {
    lang = $('forum-lang').value;
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage();
    if (current) run(() => open(current));
    else run(loadList);
  };
  $('logout').onclick = () => run(async () => {
    await authApi({ action: 'logout' });
    user = null;
    authMode = null;
    $('auth-panel').hidden = true;
    renderAuth();
    if (current) $('reply-form').hidden = true;
    status(t('logout'));
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button?.dataset) return;
    if (button.dataset.open) { replyOffset = 0; run(() => open(button.dataset.open)); }
    if (button.dataset.action) run(async () => {
      const { action, kind, id } = button.dataset;
      if (action === 'delete' && !confirm(kind === 'thread' ? t('deleteTopic') : t('deleteReply'))) return;
      button.disabled = true;
      try {
        await api(`id=${encodeURIComponent(id)}&kind=${kind}`, { method: action === 'delete' ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
        if (action === 'delete' && kind === 'thread') { current = null; $('detail').hidden = true; $('listing').hidden = false; }
        await (current ? open(current) : loadList());
        status(t('done'));
      } finally { button.disabled = false; }
    });
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
    if (id === 'reply-form') data.threadId = current;
    button.disabled = true;
    run(async () => {
      try {
        const result = await api('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        form.reset();
        status(result.message);
      } finally { button.disabled = false; }
    });
  };
  run(async () => {
    applyLanguage();
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
    await loadList();
  });
})();
