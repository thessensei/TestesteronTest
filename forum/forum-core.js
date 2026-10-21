/*
 * Forum sayfasının DOM'dan bağımsız çekirdeği.
 * Sözlük, biçimlendirme ve yönlendirme yardımcıları burada tutulur;
 * forum/forum.js bunları kullanır, testler ise doğrudan import eder.
 */
export const LANGUAGES = ['tr', 'en', 'de', 'ja'];
export const CATEGORIES = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
export const CATEGORY_KEYS = { Genel: 'cat-general', Antrenman: 'cat-training', Beslenme: 'cat-nutrition', Deneyimler: 'cat-stories' };
export const PAGE_SIZE = 30;
export const REPLY_PAGE = 50;
// Sunucudaki api/_forum.js ile aynı olmalı; testler iki değeri karşılaştırır.
export const EDIT_WINDOW_MS = 30 * 60 * 1000;
const LOCALES = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ja: 'ja-JP' };

export const UI = {
  tr: {
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
    opening: 'Sohbet yükleniyor…', closed: 'Bu konu yeni yanıtlara kapalı.', lockedBadge: 'Kilitli',
    postedAs: 'Şu hesapla yazıyorsun', welcome: 'Hoş geldin', authRequired: 'Yazmak için giriş yap.',
    mismatch: 'Şifreler eşleşmiyor.', manage: 'Forum yönetimi',
    approve: 'Onayla', unlock: 'Kilidi aç', lock: 'Kilitle', delete: 'Sil',
    'cat-general': 'Genel', 'cat-training': 'Antrenman', 'cat-nutrition': 'Beslenme', 'cat-stories': 'Deneyimler',
    waiting: 'Onay bekliyor', deleteTopic: 'Konu ve tüm yanıtları kalıcı olarak silinsin mi?',
    deleteReply: 'Yanıt kalıcı olarak silinsin mi?', done: 'İşlem tamamlandı.', noReplies: 'Henüz yanıt yok.',
    replyHeading: 'Yanıtlar',
    views: 'görüntülenme', pinnedBadge: 'Sabit', pin: 'Sabitle', unpin: 'Sabitlemeyi kaldır',
    like: 'Beğen', liked: 'Beğendin', likeFirst: 'Beğenmek için giriş yap.',
    quote: 'Alıntıla', quotedPost: 'Alıntılanan mesaj', cancelQuote: 'Alıntıyı kaldır',
    cancel: 'Vazgeç', save: 'Kaydet', edit: 'Düzenle', edited: 'düzenlendi',
    editHint: 'İlk 30 dakika içinde düzenleyebilirsin.', editExpired: 'Düzenleme süresi doldu.',
    copyLink: 'Bağlantıyı kopyala', copied: 'Bağlantı kopyalandı.', copyFailed: 'Bağlantı kopyalanamadı.',
    posts: 'mesaj', you: 'sen', topicOwner: 'Konu sahibi', jumpQuote: 'Alıntıya git',
    'rank-new': 'Yeni üye', 'rank-member': 'Üye', 'rank-active': 'Aktif üye', 'rank-veteran': 'Kıdemli üye',
    anchorMissing: 'Bağlantıdaki mesaj bu sayfada görünmüyor.',
    heroEyebrow: 'TESTOTAVAN MEYDAN', search: 'Konu ara…', searchLabel: 'Ara',
    sortNew: 'Yeni', sortTop: 'Popüler', sortActive: 'En çok yanıt', sortUnanswered: 'Yanıtsız',
    statsThreads: 'Konu', statsReplies: 'Yanıt', statsMembers: 'Üye', statsViews: 'Görüntülenme',
    railPulse: 'Topluluk nabzı', railAuthors: 'Öne çıkan yazarlar', railGuidelines: 'Meydan kuralları',
    guideline1: 'Saygılı ol; kişiye değil fikre odaklan.',
    guideline2: 'Kişisel sağlık verisi ve reçete paylaşma.',
    guideline3: 'Kaynak varsa bağlantısını ekle, kesin tedavi vaadi verme.',
    guideline4: 'Konular admin onayından sonra yayınlanır.',
    allCategories: 'Tümü', noResults: 'Bu filtrelerle konu bulunamadı.', clearFilters: 'Filtreleri temizle',
    sharePage: 'Konu sayfasını paylaş', openPage: 'Kalıcı sayfa', latestTopic: 'Son konu',
    boardForums: 'Forumlar', tabNew: 'Yeni mesajlar', tabHot: 'Sıcak konular',
    colTopic: 'Konu', colForum: 'Forum', colReplies: 'Cevap', colViews: 'Hit', colPosted: 'Gönderim', colLast: 'Son yazan',
    newTopic: 'Yeni Konu Aç', latestContent: 'En Son İçerikler', noLastReply: 'Yanıt yok'
  },
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
    opening: 'Loading conversation…', closed: 'This topic is closed to new replies.', lockedBadge: 'Locked',
    postedAs: 'Posting as', welcome: 'Welcome', authRequired: 'Log in to post.',
    mismatch: 'Passwords do not match.', manage: 'Forum moderation',
    approve: 'Approve', unlock: 'Unlock', lock: 'Lock', delete: 'Delete',
    'cat-general': 'General', 'cat-training': 'Training', 'cat-nutrition': 'Nutrition', 'cat-stories': 'Experiences',
    waiting: 'Awaiting approval', deleteTopic: 'Delete this topic and all replies permanently?',
    deleteReply: 'Delete this reply permanently?', done: 'Done.', noReplies: 'No replies yet.',
    replyHeading: 'Replies',
    views: 'views', pinnedBadge: 'Pinned', pin: 'Pin', unpin: 'Unpin',
    like: 'Like', liked: 'Liked', likeFirst: 'Log in to like posts.',
    quote: 'Quote', quotedPost: 'Quoted post', cancelQuote: 'Remove quote',
    cancel: 'Cancel', save: 'Save', edit: 'Edit', edited: 'edited',
    editHint: 'You can edit your post for the first 30 minutes.', editExpired: 'The edit window has closed.',
    copyLink: 'Copy link', copied: 'Link copied.', copyFailed: 'Could not copy the link.',
    posts: 'posts', you: 'you', topicOwner: 'Topic author', jumpQuote: 'Go to the quoted post',
    'rank-new': 'Newcomer', 'rank-member': 'Member', 'rank-active': 'Active member', 'rank-veteran': 'Veteran',
    anchorMissing: 'The linked post is not on this page.',
    heroEyebrow: 'TESTOTAVAN COMMONS', search: 'Search topics…', searchLabel: 'Search',
    sortNew: 'Newest', sortTop: 'Popular', sortActive: 'Most replies', sortUnanswered: 'Unanswered',
    statsThreads: 'Topics', statsReplies: 'Replies', statsMembers: 'Members', statsViews: 'Views',
    railPulse: 'Community pulse', railAuthors: 'Top authors', railGuidelines: 'Commons guidelines',
    guideline1: 'Be respectful; focus on the idea, not the person.',
    guideline2: 'Do not share personal health data or prescriptions.',
    guideline3: 'Add a link when you cite a source; never promise a cure.',
    guideline4: 'Topics go live after admin approval.',
    allCategories: 'All', noResults: 'No topics match these filters.', clearFilters: 'Clear filters',
    sharePage: 'Share topic page', openPage: 'Permalink', latestTopic: 'Latest topic',
    boardForums: 'Forums', tabNew: 'New posts', tabHot: 'Hot topics',
    colTopic: 'Topic', colForum: 'Forum', colReplies: 'Replies', colViews: 'Views', colPosted: 'Posted', colLast: 'Last reply',
    newTopic: 'Start a topic', latestContent: 'Latest activity', noLastReply: 'No replies'
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
    opening: 'Gespräch wird geladen…', closed: 'Dieses Thema ist für neue Antworten geschlossen.', lockedBadge: 'Gesperrt',
    postedAs: 'Du schreibst als', welcome: 'Willkommen', authRequired: 'Zum Schreiben bitte anmelden.',
    mismatch: 'Passwörter stimmen nicht überein.', manage: 'Forum-Moderation',
    approve: 'Freigeben', unlock: 'Entsperren', lock: 'Sperren', delete: 'Löschen',
    'cat-general': 'Allgemein', 'cat-training': 'Training', 'cat-nutrition': 'Ernährung', 'cat-stories': 'Erfahrungen',
    waiting: 'Wartet auf Freigabe', deleteTopic: 'Thema und alle Antworten dauerhaft löschen?',
    deleteReply: 'Antwort dauerhaft löschen?', done: 'Erledigt.', noReplies: 'Noch keine Antworten.',
    replyHeading: 'Antworten',
    views: 'Aufrufe', pinnedBadge: 'Angepinnt', pin: 'Anpinnen', unpin: 'Loslösen',
    like: 'Gefällt mir', liked: 'Gefällt dir', likeFirst: 'Melde dich an, um Beiträge zu liken.',
    quote: 'Zitieren', quotedPost: 'Zitierter Beitrag', cancelQuote: 'Zitat entfernen',
    cancel: 'Abbrechen', save: 'Speichern', edit: 'Bearbeiten', edited: 'bearbeitet',
    editHint: 'Du kannst deinen Beitrag in den ersten 30 Minuten bearbeiten.', editExpired: 'Die Bearbeitungszeit ist abgelaufen.',
    copyLink: 'Link kopieren', copied: 'Link kopiert.', copyFailed: 'Link konnte nicht kopiert werden.',
    posts: 'Beiträge', you: 'du', topicOwner: 'Themenautor', jumpQuote: 'Zum Zitat springen',
    'rank-new': 'Neu dabei', 'rank-member': 'Mitglied', 'rank-active': 'Aktives Mitglied', 'rank-veteran': 'Veteran',
    anchorMissing: 'Der verlinkte Beitrag ist nicht auf dieser Seite.',
    heroEyebrow: 'TESTOTAVAN FORUM', search: 'Themen suchen…', searchLabel: 'Suchen',
    sortNew: 'Neueste', sortTop: 'Beliebt', sortActive: 'Meiste Antworten', sortUnanswered: 'Unbeantwortet',
    statsThreads: 'Themen', statsReplies: 'Antworten', statsMembers: 'Mitglieder', statsViews: 'Aufrufe',
    railPulse: 'Community-Puls', railAuthors: 'Top-Autoren', railGuidelines: 'Forum-Regeln',
    guideline1: 'Bleib respektvoll; diskutiere die Idee, nicht die Person.',
    guideline2: 'Teile keine persönlichen Gesundheitsdaten oder Rezepte.',
    guideline3: 'Verlinke Quellen, versprich keine Heilung.',
    guideline4: 'Themen erscheinen nach Admin-Freigabe.',
    allCategories: 'Alle', noResults: 'Keine Themen für diese Filter.', clearFilters: 'Filter zurücksetzen',
    sharePage: 'Themenseite teilen', openPage: 'Permalink', latestTopic: 'Neuestes Thema',
    boardForums: 'Foren', tabNew: 'Neue Beiträge', tabHot: 'Heiße Themen',
    colTopic: 'Thema', colForum: 'Forum', colReplies: 'Antworten', colViews: 'Aufrufe', colPosted: 'Erstellt', colLast: 'Letzte Antwort',
    newTopic: 'Thema erstellen', latestContent: 'Neueste Inhalte', noLastReply: 'Keine Antworten'
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
    opening: '会話を読み込み中…', closed: 'このトピックは新しい返信を受け付けていません。', lockedBadge: 'ロック中',
    postedAs: '投稿者', welcome: 'ようこそ', authRequired: '投稿するにはログインしてください。',
    mismatch: 'パスワードが一致しません。', manage: 'フォーラム管理',
    approve: '承認', unlock: 'ロック解除', lock: 'ロック', delete: '削除',
    'cat-general': '一般', 'cat-training': 'トレーニング', 'cat-nutrition': '栄養', 'cat-stories': '体験',
    waiting: '承認待ち', deleteTopic: 'トピックとすべての返信を完全に削除しますか？',
    deleteReply: '返信を完全に削除しますか？', done: '完了しました。', noReplies: 'まだ返信がありません。',
    replyHeading: '返信',
    views: '表示', pinnedBadge: '固定', pin: '固定する', unpin: '固定を解除',
    like: 'いいね', liked: 'いいね済み', likeFirst: 'いいねするにはログインしてください。',
    quote: '引用', quotedPost: '引用元の投稿', cancelQuote: '引用を削除',
    cancel: 'キャンセル', save: '保存', edit: '編集', edited: '編集済み',
    editHint: '最初の30分以内なら編集できます。', editExpired: '編集できる時間が過ぎました。',
    copyLink: 'リンクをコピー', copied: 'リンクをコピーしました。', copyFailed: 'リンクをコピーできませんでした。',
    posts: '投稿', you: 'あなた', topicOwner: 'トピック投稿者', jumpQuote: '引用元へ移動',
    'rank-new': '新メンバー', 'rank-member': 'メンバー', 'rank-active': 'アクティブ', 'rank-veteran': 'ベテラン',
    anchorMissing: 'リンク先の投稿はこのページにありません。',
    heroEyebrow: 'TESTOTAVAN フォーラム', search: 'トピックを検索…', searchLabel: '検索',
    sortNew: '新着', sortTop: '人気', sortActive: '返信が多い', sortUnanswered: '未回答',
    statsThreads: 'トピック', statsReplies: '返信', statsMembers: 'メンバー', statsViews: '閲覧',
    railPulse: 'コミュニティの動き', railAuthors: '注目の投稿者', railGuidelines: 'フォーラムのルール',
    guideline1: '敬意を持ち、人ではなく意見について話しましょう。',
    guideline2: '個人の健康データや処方を共有しないでください。',
    guideline3: '出典がある場合はリンクを添え、治療を約束しないでください。',
    guideline4: 'トピックは管理者の承認後に公開されます。',
    allCategories: 'すべて', noResults: '条件に合うトピックがありません。', clearFilters: '絞り込みを解除',
    sharePage: 'トピックページを共有', openPage: '固定リンク', latestTopic: '最新トピック',
    boardForums: 'フォーラム', tabNew: '新着メッセージ', tabHot: '注目トピック',
    colTopic: 'トピック', colForum: 'フォーラム', colReplies: '返信', colViews: '閲覧', colPosted: '投稿日', colLast: '最新の返信',
    newTopic: 'トピックを作成', latestContent: '最新の投稿', noLastReply: '返信なし'
  }
};

const RELATIVE = {
  tr: { justNow: 'az önce', minutes: n => `${n} dk önce`, hours: n => `${n} sa önce`, days: n => `${n} gün önce`, weeks: n => `${n} hafta önce` },
  en: { justNow: 'just now', minutes: n => `${n} min ago`, hours: n => `${n} h ago`, days: n => `${n} d ago`, weeks: n => `${n} w ago` },
  de: { justNow: 'gerade eben', minutes: n => `vor ${n} Min.`, hours: n => `vor ${n} Std.`, days: n => `vor ${n} Tg.`, weeks: n => `vor ${n} Wo.` },
  ja: { justNow: 'たった今', minutes: n => `${n}分前`, hours: n => `${n}時間前`, days: n => `${n}日前`, weeks: n => `${n}週間前` }
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeLang(value) {
  return LANGUAGES.includes(String(value)) ? String(value) : 'tr';
}

/** Sözlükten çeviri üretir; eksik anahtar Türkçe karşılığına, sonra anahtarın kendisine düşer. */
export function translator(lang) {
  const table = UI[normalizeLang(lang)] || UI.tr;
  return key => table[key] ?? UI.tr[key] ?? key;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatCount(value, lang) {
  const number = Number(value) || 0;
  try { return number.toLocaleString(LOCALES[normalizeLang(lang)]); } catch { return String(number); }
}

export function formatDateTime(value, lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try { return date.toLocaleString(LOCALES[normalizeLang(lang)]); } catch { return date.toISOString(); }
}

/** "3 sa önce" biçiminde kısa zaman; 4 haftadan eskisi tarih olarak yazılır. */
export function relativeTime(value, lang, now = Date.now()) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '';
  const words = RELATIVE[normalizeLang(lang)];
  const diff = Math.max(0, now - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return words.justNow;
  if (minutes < 60) return words.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return words.hours(hours);
  const days = Math.floor(hours / 24);
  if (days < 28) return words.days(days);
  const weeks = Math.floor(days / 7);
  if (days < 84) return words.weeks(weeks);
  return formatDateTime(value, lang);
}

/** Beğeni ve mesaj sayısı için rütbe anahtarı. */
export function rankKey(posts) {
  const total = Number(posts) || 0;
  if (total >= 100) return 'rank-veteran';
  if (total >= 25) return 'rank-active';
  if (total >= 5) return 'rank-member';
  return 'rank-new';
}

/** Kendi mesajını düzenleme penceresi açık mı? */
export function withinEditWindow(createdAt, now = Date.now(), window = EDIT_WINDOW_MS) {
  const time = new Date(createdAt).getTime();
  return Number.isFinite(time) && now >= time && now - time <= window;
}

export function initials(name) {
  const parts = String(name ?? '').trim().split(/[\s_.-]+/).filter(Boolean);
  if (!parts.length) return '?';
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : Array.from(parts[0]).slice(0, 2).join('');
  return letters.toLocaleUpperCase('tr');
}

/**
 * Konu ve mesaj bağlantıları hash üzerinden taşınır:
 * /forum/#thread=<konu>&reply=<yanıt>. `?thread=` adresi de okunur.
 */
export function routeFromHash(hash = '', search = '') {
  const fromHash = new URLSearchParams(String(hash).replace(/^#/, ''));
  const fromQuery = new URLSearchParams(String(search).replace(/^\?/, ''));
  const thread = fromHash.get('thread') || fromQuery.get('thread') || '';
  const reply = fromHash.get('reply') || '';
  return { thread: UUID.test(thread) ? thread : '', reply: UUID.test(reply) ? reply : '' };
}

export function hashFor(threadId, replyId) {
  const params = new URLSearchParams({ thread: threadId });
  if (replyId) params.set('reply', replyId);
  return `#${params.toString()}`;
}
