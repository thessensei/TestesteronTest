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
      opening: 'Loading conversation…',
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
      opening: 'Gespräch wird geladen…',
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
      opening: '会話を読み込み中…',
      postedAs: '投稿者', welcome: 'ようこそ', authRequired: '投稿するにはログインしてください。',
      mismatch: 'パスワードが一致しません。', manage: 'フォーラム管理',
      approve: '承認', unlock: 'ロック解除', lock: 'ロック', locked: 'ロック中', delete: '削除',
      'cat-general': '一般', 'cat-training': 'トレーニング', 'cat-nutrition': '栄養', 'cat-stories': '体験',
      waiting: '承認待ち', deleteTopic: 'トピックとすべての返信を完全に削除しますか？',
      deleteReply: '返信を完全に削除しますか？', done: '完了しました。', noReplies: 'まだ返信がありません。',
      replyHeading: '返信'
    }
  };
  const ui = {
    "tr": {
      "skip": "Konulara geç",
      "community": "TOPLULUK FORUMU",
      "home": "Ana sayfa",
      "forum": "Forum",
      "create": "+ Yeni konu aç",
      "notice": "Deneyimini paylaş, birlikte gelişelim. Paylaşımlar admin onayından sonra yayınlanır; tıbbi tavsiye değildir.",
      "rules": "Forum kuralları ↗",
      "categories": "FORUM KATEGORİLERİ",
      "stats": "TOPLULUK İSTATİSTİKLERİ",
      "totalTopics": "Konu",
      "totalReplies": "Yanıt",
      "statsNote": "Yayındaki paylaşımlar",
      "manageStats": "Bekleyen paylaşımlar dahil",
      "rulesTitle": "İyi bir sohbetin temeli",
      "ruleRespect": "Fikirlere açık, insanlara saygılı ol.",
      "rulePrivacy": "Kişisel sağlık verilerini paylaşma.",
      "ruleTitle": "Açıklayıcı bir başlık ve doğru kategori seç.",
      "medical": "Sağlık sorunlarında bir uzmana danış. Forum, tıbbi danışmanlığın yerini tutmaz.",
      "allTopics": "Tüm konular",
      "listDescription": "Sorular, deneyimler ve yeni bakış açıları.",
      "searchLabel": "Konularda ara",
      "search": "Ara",
      "searchPlaceholder": "Bir konu veya anahtar kelime ara…",
      "clear": "Filtreleri temizle",
      "topicColumn": "KONU / YAZAR",
      "replyColumn": "YANIT",
      "activityColumn": "SON HAREKET",
      "footer": "Daha bilinçli bir topluluk.",
      "top": "Yukarı dön ↑",
      "active": "Son hareket",
      "newest": "Yeni konular",
      "popular": "Çok yanıtlanan",
      "unanswered": "Yanıtsız",
      "noResults": "Aramana uygun konu bulunamadı.",
      "noResultsHelp": "Farklı bir kelime dene veya filtreleri temizle.",
      "emptyHelp": "İlk soruyu sor, deneyimini paylaş ve sohbeti başlat.",
      "topicAuthor": "Konu sahibi",
      "member": "Üye",
      "permalink": "Konu bağlantısı ↗",
      "sortLabel": "Sıralama",
      "closed": "Bu konu yeni yanıtlara kapalı.",
      "results": "Sonuçlar",
      "account": "Hesap",
      "language": "Dil",
    "requestFailed": "İşlem tamamlanamadı. Lütfen tekrar deneyin."
    },
    "en": {
      "skip": "Skip to topics",
      "community": "COMMUNITY FORUM",
      "home": "Home",
      "forum": "Forum",
      "create": "+ New topic",
      "notice": "Share your experience and grow together. Posts appear after admin approval and are not medical advice.",
      "rules": "Forum rules ↗",
      "categories": "FORUM CATEGORIES",
      "stats": "COMMUNITY STATISTICS",
      "totalTopics": "Topics",
      "totalReplies": "Replies",
      "statsNote": "Published posts",
      "manageStats": "Includes pending posts",
      "rulesTitle": "A better conversation",
      "ruleRespect": "Respect people and welcome different ideas.",
      "rulePrivacy": "Do not share personal health data.",
      "ruleTitle": "Choose a clear title and the right category.",
      "medical": "Consult a professional for health concerns. This forum does not replace medical advice.",
      "allTopics": "All topics",
      "listDescription": "Questions, experiences and fresh perspectives.",
      "searchLabel": "Search topics",
      "search": "Search",
      "searchPlaceholder": "Search a topic or keyword…",
      "clear": "Clear filters",
      "topicColumn": "TOPIC / AUTHOR",
      "replyColumn": "REPLIES",
      "activityColumn": "LAST ACTIVITY",
      "footer": "A more informed community.",
      "top": "Back to top ↑",
      "active": "Latest activity",
      "newest": "New topics",
      "popular": "Most replies",
      "unanswered": "Unanswered",
      "noResults": "No matching topics found.",
      "noResultsHelp": "Try another keyword or clear the filters.",
      "emptyHelp": "Ask the first question, share your experience and start a conversation.",
      "topicAuthor": "Topic author",
      "member": "Member",
      "permalink": "Topic link ↗",
      "sortLabel": "Sort topics",
      "closed": "This topic is closed to new replies.",
      "results": "Results",
      "account": "Account",
      "language": "Language",
    "requestFailed": "Request failed. Please try again."
    },
    "de": {
      "skip": "Zu den Themen",
      "community": "COMMUNITY-FORUM",
      "home": "Startseite",
      "forum": "Forum",
      "create": "+ Neues Thema",
      "notice": "Teile Erfahrungen und lerne gemeinsam. Beiträge erscheinen nach Admin-Freigabe und sind kein medizinischer Rat.",
      "rules": "Forumregeln ↗",
      "categories": "FORUMKATEGORIEN",
      "stats": "COMMUNITY-STATISTIK",
      "totalTopics": "Themen",
      "totalReplies": "Antworten",
      "statsNote": "Veröffentlichte Beiträge",
      "manageStats": "Inklusive ausstehender Beiträge",
      "rulesTitle": "Ein gutes Gespräch",
      "ruleRespect": "Respektiere Menschen und andere Ideen.",
      "rulePrivacy": "Teile keine persönlichen Gesundheitsdaten.",
      "ruleTitle": "Wähle einen klaren Titel und die richtige Kategorie.",
      "medical": "Wende dich bei Gesundheitsfragen an Fachleute. Das Forum ersetzt keine medizinische Beratung.",
      "allTopics": "Alle Themen",
      "listDescription": "Fragen, Erfahrungen und neue Perspektiven.",
      "searchLabel": "Themen durchsuchen",
      "search": "Suchen",
      "searchPlaceholder": "Thema oder Stichwort suchen…",
      "clear": "Filter löschen",
      "topicColumn": "THEMA / AUTOR",
      "replyColumn": "ANTWORTEN",
      "activityColumn": "LETZTE AKTIVITÄT",
      "footer": "Eine bewusstere Community.",
      "top": "Nach oben ↑",
      "active": "Letzte Aktivität",
      "newest": "Neue Themen",
      "popular": "Meiste Antworten",
      "unanswered": "Unbeantwortet",
      "noResults": "Keine passenden Themen gefunden.",
      "noResultsHelp": "Versuche ein anderes Stichwort oder lösche die Filter.",
      "emptyHelp": "Stelle die erste Frage und teile deine Erfahrungen.",
      "topicAuthor": "Themenautor",
      "member": "Mitglied",
      "permalink": "Themenlink ↗",
      "sortLabel": "Themen sortieren",
      "closed": "Dieses Thema ist für neue Antworten geschlossen.",
      "results": "Ergebnisse",
      "account": "Konto",
      "language": "Sprache",
    "requestFailed": "Anfrage fehlgeschlagen. Bitte versuche es erneut."
    },
    "ja": {
      "skip": "トピックへ移動",
      "community": "コミュニティフォーラム",
      "home": "ホーム",
      "forum": "フォーラム",
      "create": "+ トピックを作成",
      "notice": "経験を共有し、一緒に成長しましょう。投稿は管理者の承認後に公開され、医療アドバイスではありません。",
      "rules": "フォーラムのルール ↗",
      "categories": "カテゴリー",
      "stats": "コミュニティ統計",
      "totalTopics": "トピック",
      "totalReplies": "返信",
      "statsNote": "公開済みの投稿",
      "manageStats": "承認待ちの投稿を含む",
      "rulesTitle": "よい会話のために",
      "ruleRespect": "人を尊重し、異なる意見を受け入れましょう。",
      "rulePrivacy": "個人の健康データは共有しないでください。",
      "ruleTitle": "明確なタイトルと適切なカテゴリーを選びましょう。",
      "medical": "健康上の問題は専門家にご相談ください。このフォーラムは医療相談の代わりにはなりません。",
      "allTopics": "すべてのトピック",
      "listDescription": "質問、体験、そして新しい視点。",
      "searchLabel": "トピックを検索",
      "search": "検索",
      "searchPlaceholder": "トピックやキーワードを検索…",
      "clear": "フィルターを解除",
      "topicColumn": "トピック / 投稿者",
      "replyColumn": "返信",
      "activityColumn": "最新の活動",
      "footer": "より意識の高いコミュニティ。",
      "top": "ページ上部へ ↑",
      "active": "最新の活動",
      "newest": "新しいトピック",
      "popular": "返信が多い順",
      "unanswered": "未返信",
      "noResults": "一致するトピックはありません。",
      "noResultsHelp": "別のキーワードを試すか、フィルターを解除してください。",
      "emptyHelp": "最初の質問や体験を投稿して会話を始めましょう。",
      "topicAuthor": "トピック投稿者",
      "member": "メンバー",
      "permalink": "トピックへのリンク ↗",
      "sortLabel": "並べ替え",
      "closed": "このトピックは新しい返信を受け付けていません。",
      "results": "検索結果",
      "account": "アカウント",
      "language": "言語",
    "requestFailed": "リクエストに失敗しました。もう一度お試しください。"
    }
  };
  let lang = 'tr';
  try { lang = localStorage.getItem(LANG_KEY) || 'tr'; } catch { /* Storage can be disabled. */ }
  if (!dict[lang] && lang !== 'tr') lang = 'tr';
  let manage = false, offset = 0, replyOffset = 0, current = null, user = null, authMode = null;
  const catLabel = value => ({ Genel: t('cat-general'), Antrenman: t('cat-training'), Beslenme: t('cat-nutrition'), Deneyimler: t('cat-stories') }[value] || value);
  const t = key => ui[lang]?.[key] || (lang !== 'tr' && dict[lang] && dict[lang][key]) || ({
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
    opening: 'Sohbet yükleniyor…',
    postedAs: 'Şu hesapla yazıyorsun', welcome: 'Hoş geldin', authRequired: 'Yazmak için giriş yap.',
    mismatch: 'Şifreler eşleşmiyor.', manage: 'Forum yönetimi',
    approve: 'Onayla', unlock: 'Kilidi aç', lock: 'Kilitle', locked: 'Kilitli', delete: 'Sil',
    'cat-general': 'Genel', 'cat-training': 'Antrenman', 'cat-nutrition': 'Beslenme', 'cat-stories': 'Deneyimler',
    waiting: 'Onay bekliyor', deleteTopic: 'Konu ve tüm yanıtları kalıcı olarak silinsin mi?',
    deleteReply: 'Yanıt kalıcı olarak silinsin mi?', done: 'İşlem tamamlandı.', noReplies: 'Henüz yanıt yok.',
    replyHeading: 'Yanıtlar'
  }[key] || key);
  const categories = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
  const sorts = ['active', 'newest', 'popular', 'unanswered'];
  let category = '', search = '', sort = 'active', requestVersion = 0, listData = null, detailData = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const locale = () => ({ tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ja: 'ja-JP' }[lang]);
  const date = value => new Date(value).toLocaleString(locale());
  const count = value => Number(value || 0).toLocaleString(locale());
  const status = message => { $('status').textContent = message || ''; };
  const motion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  function readRoute() {
    const params = new URLSearchParams(location.search);
    category = categories.includes(params.get('category')) ? params.get('category') : '';
    search = (params.get('q') || '').slice(0, 120).trim();
    sort = sorts.includes(params.get('sort')) ? params.get('sort') : 'active';
    offset = Math.min(99990, Math.max(0, Math.floor((parseInt(params.get('offset'), 10) || 0) / 30) * 30));
    replyOffset = Math.min(100000, Math.max(0, Math.floor((parseInt(params.get('replyOffset'), 10) || 0) / 50) * 50));
    current = params.get('thread') || null;
  }
  function routeUrl(threadId = current) {
    const params = new URLSearchParams();
    if (requestedManage) params.set('manage', '1');
    if (category) params.set('category', category);
    if (search) params.set('q', search);
    if (sort !== 'active') params.set('sort', sort);
    if (offset) params.set('offset', offset);
    if (threadId) {
      params.set('thread', threadId);
      if (replyOffset) params.set('replyOffset', replyOffset);
    }
    return '/forum/' + (params.size ? '?' + params : '');
  }
  function saveRoute() {
    const url = routeUrl();
    if (url !== location.pathname + location.search) history.pushState(null, '', url);
  }
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
    for (const id of ['show-login', 'tab-login']) $(id).textContent = t('login-submit');
    for (const id of ['show-register', 'tab-register']) $(id).textContent = t('register-submit');
    $('forum-lang').setAttribute('aria-label', t('language'));
    document.querySelector('.lang-label').textContent = t('language');
    document.querySelector('.auth-tabs').setAttribute('aria-label', t('account'));
    document.querySelector('.breadcrumbs').setAttribute('aria-label', t('forum'));
    $('topic-search').placeholder = t('searchPlaceholder');
    $('new-thread').querySelector('[name=title]').placeholder = t('titleField');
    $('sort-nav').setAttribute('aria-label', t('sortLabel'));
    $('stats-note').textContent = t(manage ? 'manageStats' : 'statsNote');
    if (user) $('composer-as').textContent = `${t('postedAs')}: ${user.username}`;
    renderFilters();
  }
  function renderFilters() {
    // Rebuilding translated navigation must not lose the keyboard user's focus.
    const focused = document.activeElement;
    const focusCategory = focused?.getAttribute('data-category');
    const focusSort = focused?.getAttribute('data-sort');
    const totals = new Map((listData?.categories || []).map(item => [item.category, item]));
    const total = [...totals.values()].reduce((sum, item) => sum + Number(item.topic_count), 0);
    const icons = ['▦', '◈', '↗', '◒', '✧'];
    $('category-nav').innerHTML = ['', ...categories].map((value, index) => `<button class="category-button" type="button" data-category="${esc(value)}" aria-pressed="${category === value}"><span class="category-icon" aria-hidden="true">${icons[index]}</span><span>${esc(value ? catLabel(value) : t('allTopics'))}</span><span class="category-count">${listData ? count(value ? totals.get(value)?.topic_count : total) : '—'}</span></button>`).join('');
    $('sort-nav').innerHTML = sorts.map(value => `<button type="button" data-sort="${value}" aria-pressed="${sort === value}">${esc(t(value))}</button>`).join('');
    $('list-heading').textContent = category ? catLabel(category) : t('allTopics');
    $('list-description').textContent = search ? `${t('results')}: “${search}”` : t('listDescription');
    $('topic-search').value = search;
    $('clear-filters').hidden = !category && !search && sort === 'active';
    $('total-topics').textContent = listData ? count(total) : '—';
    $('total-replies').textContent = listData ? count([...totals.values()].reduce((sum, item) => sum + Number(item.reply_count), 0)) : '—';
    $('create-topic').hidden = manage;
    for (const button of document.querySelectorAll('#category-nav button, #sort-nav button')) {
      if ((focusCategory !== null && button.getAttribute('data-category') === focusCategory) ||
          (focusSort !== null && button.getAttribute('data-sort') === focusSort)) button.focus({ preventScroll: true });
    }
  }
  function renderReplyAccess() {
    const thread = detailData?.thread;
    $('reply-form').hidden = !thread || !user || thread.locked || !thread.approved || manage;
    $('reply-gate').hidden = !thread || Boolean(user) || thread.locked || !thread.approved || manage;
  }
  function renderAuth() {
    const signedIn = Boolean(user);
    $('auth-user').hidden = !signedIn;
    $('auth-guest').hidden = signedIn;
    $('auth-name').textContent = signedIn ? user.username : '';
    $('auth-gate').hidden = manage || signedIn;
    $('new-thread').hidden = manage || !signedIn;
    if (signedIn) $('composer-as').textContent = `${t('postedAs')}: ${user.username}`;
    $('auth-panel').hidden = signedIn || authMode == null;
    renderReplyAccess();
  }
  function showAuth(mode) {
    authMode = mode;
    $('auth-panel').hidden = false;
    $('login-form').hidden = mode !== 'login';
    $('register-form').hidden = mode !== 'register';
    for (const name of ['login', 'register']) {
      const selected = mode === name;
      $('tab-' + name).setAttribute('aria-selected', String(selected));
      $('tab-' + name).tabIndex = selected ? 0 : -1;
      $('tab-' + name).classList.toggle('secondary', !selected);
    }
    $('auth-panel').scrollIntoView({ behavior: motion(), block: 'start' });
    $(mode === 'register' ? 'register-form' : 'login-form').querySelector('input[name=username]')?.focus({ preventScroll: true });
  }
  document.querySelector('.auth-tabs').onkeydown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const mode = event.key === 'Home' ? 'login' : event.key === 'End' ? 'register' : authMode === 'login' ? 'register' : 'login';
    showAuth(mode);
    $('tab-' + mode).focus();
  };
  async function authApi(body, method = 'POST') {
    const response = await fetch('/api/forum-auth', method === 'GET' ? undefined : {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t('requestFailed'));
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
    if (!response.ok) throw new Error(data.error || t('requestFailed'));
    return data;
  }
  function controls(item, kind) {
    if (!manage) return '';
    const button = (action, label) => `<button class="secondary" type="button" data-action="${action}" data-kind="${kind}" data-id="${esc(item.id)}">${esc(label)}</button>`;
    return `<div class="moderation-controls">${!item.approved ? button('approve', t('approve')) : ''}${kind === 'thread' ? button(item.locked ? 'unlock' : 'lock', item.locked ? t('unlock') : t('lock')) : ''}${button('delete', t('delete'))}</div>`;
  }
  function avatar(item) {
    return `<span class="avatar" data-tone="${esc(item.category || '')}" aria-hidden="true">${esc(Array.from(item.author || '?')[0].toLocaleUpperCase(locale()))}</span>`;
  }
  function badges(item) {
    return `${item.category ? `<span class="badge">${esc(catLabel(item.category))}</span>` : ''}${item.locked ? `<span class="badge">${esc(t('locked'))}</span>` : ''}${!item.approved ? `<span class="badge pending">${esc(t('waiting'))}</span>` : ''}`;
  }
  function time(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `<time datetime="${esc(d.toISOString())}" title="${esc(date(value))}">${esc(d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }))}</time>`;
  }
  function renderList() {
    renderFilters();
    const threads = listData?.threads || [];
    $('threads').innerHTML = threads.map(item => `<article class="thread-row">${avatar(item)}<div class="thread-info"><h3><a class="topic" href="${esc(routeUrl(item.id))}" data-open="${esc(item.id)}">${esc(item.title)}</a></h3><div class="thread-meta">${badges(item)}<span>${esc(item.author)}</span><span aria-hidden="true">·</span>${time(item.created_at)}</div>${manage && item.pending_count ? `<p class="meta">${count(item.pending_count)} ${esc(t('pending'))}</p>` : ''}</div><div class="reply-count" aria-label="${esc(t('replies'))}">${count(item.reply_count)}</div><div class="last-activity"><span class="sr-only">${esc(t('active'))}: </span>${time(item.last_activity || item.created_at)}</div>${controls(item, 'thread')}</article>`).join('') || `<div class="empty-state"><span class="empty-icon" aria-hidden="true">☷</span><h3>${esc(t(category || search || sort === 'unanswered' ? 'noResults' : 'empty'))}</h3><p class="meta">${esc(t(category || search || sort === 'unanswered' ? 'noResultsHelp' : 'emptyHelp'))}</p></div>`;
    $('previous').disabled = offset === 0;
    $('next').disabled = !listData?.hasMore;
    $('page').textContent = `${t('page')} ${offset / 30 + 1}`;
    document.title = `${category ? catLabel(category) : t('forum')} | TestoTavan`;
  }
  function post(item, number, isAuthor = false) {
    return `<article class="panel post"><div class="post-author">${avatar(item)}<strong>${esc(item.author)}</strong><span class="meta">${esc(t(isAuthor ? 'topicAuthor' : 'member'))}</span></div><div class="post-body"><div class="post-top meta"><span>${time(item.created_at)} ${!item.approved ? `<span class="badge pending">${esc(t('waiting'))}</span>` : ''}</span><span>#${number}</span></div><p>${esc(item.body)}</p>${controls(item, isAuthor ? 'thread' : 'reply')}</div></article>`;
  }
  function renderDetail() {
    const { thread, replies, hasMore } = detailData;
    $('conversation').innerHTML = `<div class="panel conversation-heading"><div>${badges(thread)}</div><h2>${esc(thread.title)}</h2><div class="toolbar meta"><span>${esc(thread.author)} · ${time(thread.created_at)}</span><a href="/forum/?thread=${encodeURIComponent(thread.id)}">${esc(t('permalink'))}</a></div></div>${post(thread, 1, true)}<h2 class="reply-heading">${esc(t('replyHeading'))}</h2>` + (replies.map((item, i) => post(item, replyOffset + i + 2)).join('') || `<div class="panel empty-state meta">${esc(t('noReplies'))}</div>`);
    $('reply-prev').disabled = replyOffset === 0;
    $('reply-next').disabled = !hasMore;
    $('breadcrumb-topic').textContent = '/ ' + thread.title;
    $('breadcrumb-topic').hidden = false;
    document.title = `${thread.title} | TestoTavan`;
    renderReplyAccess();
  }
  async function loadList() {
    const version = ++requestVersion;
    $('listing').hidden = false;
    $('detail').hidden = true;
    $('breadcrumb-topic').hidden = true;
    renderFilters();
    $('threads').setAttribute('aria-busy', 'true');
    $('previous').disabled = $('next').disabled = true;
    status(t('loading'));
    try {
      const data = await api(new URLSearchParams({ offset, category, q: search, sort }));
      if (version !== requestVersion) return;
      listData = data;
      renderList();
      status('');
    } catch (error) {
      if (version === requestVersion) {
        $('threads').innerHTML = '';
        $('page').textContent = '';
        status(error.message);
      }
    } finally {
      if (version === requestVersion) $('threads').setAttribute('aria-busy', 'false');
    }
  }
  async function open(id, focus = false) {
    const version = ++requestVersion;
    $('listing').hidden = true;
    $('detail').hidden = false;
    $('conversation').innerHTML = '';
    $('reply-prev').disabled = $('reply-next').disabled = true;
    $('breadcrumb-topic').hidden = true;
    detailData = null;
    renderReplyAccess();
    status(t('opening'));
    try {
      const data = await api(`id=${encodeURIComponent(id)}&offset=${replyOffset}`);
      if (version !== requestVersion) return;
      detailData = data;
      renderDetail();
      status(data.thread.locked ? t('closed') : '');
      if (focus) $('conversation').focus({ preventScroll: true });
      if (!listData) {
        // A shared topic link has no cached overview yet. Failure here should
        // not replace a successfully loaded conversation with an error.
        try {
          const overview = await api(new URLSearchParams({ offset, category, q: search, sort }));
          if (version === requestVersion) { listData = overview; renderFilters(); }
        } catch { /* Statistics remain unknown rather than fabricated. */ }
      }
    } catch (error) {
      if (version === requestVersion) status(error.message);
    }
  }
  const run = task => Promise.resolve().then(task).catch(error => status(error.message));
  const loadView = () => current ? open(current) : loadList();
  function filter(update) {
    update();
    offset = 0;
    current = null;
    replyOffset = 0;
    saveRoute();
    run(loadList);
  }
  $('search-form').onsubmit = event => { event.preventDefault(); filter(() => { search = $('topic-search').value.trim(); }); };
  $('clear-filters').onclick = () => filter(() => { category = ''; search = ''; sort = 'active'; });
  $('refresh').onclick = () => run(loadList);
  $('previous').onclick = () => { offset = Math.max(0, offset - 30); saveRoute(); run(loadList); };
  $('next').onclick = () => { offset += 30; saveRoute(); run(loadList); };
  $('reply-prev').onclick = () => { replyOffset = Math.max(0, replyOffset - 50); saveRoute(); run(() => open(current, true)); };
  $('reply-next').onclick = () => { replyOffset += 50; saveRoute(); run(() => open(current, true)); };
  $('back').onclick = () => { current = null; replyOffset = 0; saveRoute(); $('listing').hidden = false; run(loadList); $('listing').focus(); };
  window.addEventListener('popstate', () => { readRoute(); run(loadView); });
  $('create-topic').onclick = () => {
    if (!user) { showAuth('login'); return; }
    if (current) { current = null; replyOffset = 0; saveRoute(); run(loadList); }
    $('listing').hidden = false;
    $('new-thread').scrollIntoView({ behavior: motion(), block: 'start' });
    $('new-thread').querySelector('[name=title]').focus({ preventScroll: true });
    if (category) $('new-thread').querySelector('[name=category]').value = category;
  };
  for (const id of ['show-login', 'gate-login', 'reply-login', 'tab-login']) $(id).onclick = () => showAuth('login');
  for (const id of ['show-register', 'gate-register', 'tab-register']) $(id).onclick = () => showAuth('register');
  $('forum-lang').onchange = () => {
    lang = $('forum-lang').value;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* Optional preference. */ }
    applyLanguage();
    if (current && detailData) renderDetail();
    else if (!current && listData) renderList();
    if (detailData?.thread.locked && current) status(t('closed'));
  };
  $('logout').onclick = () => run(async () => {
    await authApi({ action: 'logout' });
    user = null;
    authMode = null;
    renderAuth();
    status(t('logout'));
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-open]');
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      replyOffset = 0;
      current = link.dataset.open;
      saveRoute();
      run(() => open(current, true));
    }
    const button = event.target.closest('button');
    if (!button?.dataset) return;
    if (button.hasAttribute('data-category')) filter(() => { category = button.dataset.category; });
    if (button.dataset.sort) filter(() => { sort = button.dataset.sort; });
    if (button.dataset.action) run(async () => {
      const { action, kind, id } = button.dataset;
      if (action === 'delete' && !confirm(kind === 'thread' ? t('deleteTopic') : t('deleteReply'))) return;
      button.disabled = true;
      try {
        await api(`id=${encodeURIComponent(id)}&kind=${kind}`, { method: action === 'delete' ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
        if (action === 'delete' && kind === 'thread') { current = null; replyOffset = 0; offset = 0; saveRoute(); }
        await loadView();
        status(t('done'));
      } finally { button.disabled = false; }
    });
  });
  async function submitAuth(event, action) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    if (action === 'register' && data.password !== data.passwordConfirm) { status(t('mismatch')); return; }
    button.disabled = true;
    try {
      const result = await authApi({ action, ...data });
      user = result.user;
      form.reset();
      authMode = null;
      renderAuth();
      status(`${t('welcome')}, ${user.username}.`);
    } catch (error) { status(error.message); }
    finally { button.disabled = false; }
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
  readRoute();
  run(async () => {
    applyLanguage();
    renderAuth();
    try { await refreshUser(); } catch (error) { status(error.message); }
    if (requestedManage) {
      const response = await fetch('/api/session');
      const session = await response.json();
      if (!response.ok || !session.authenticated) {
        $('listing').hidden = true;
        $('detail').hidden = true;
        $('create-topic').hidden = true;
        throw new Error(lang === 'tr' ? 'Moderasyon için admin panelinden giriş yapın.' : t('manage'));
      }
      manage = true;
      applyLanguage();
      renderAuth();
    }
    await loadView();
  });
})();
