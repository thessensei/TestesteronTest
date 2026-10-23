/*
 * Forum sayfasının DOM'dan bağımsız çekirdeği.
 * Sözlük, biçimlendirme ve yönlendirme yardımcıları burada tutulur;
 * forum/forum.js bunları kullanır, testler ise doğrudan import eder.
 */
// Dil listesi sunucudaki api/_langs.js ile aynı olmalı (tests/languages.test.mjs doğrular).
export const LANGUAGES = ['tr', 'en', 'de', 'ja', 'fr', 'es', 'bg', 'ru', 'hi', 'zh'];
export const CATEGORIES = ['Genel', 'Antrenman', 'Beslenme', 'Deneyimler'];
export const CATEGORY_KEYS = { Genel: 'cat-general', Antrenman: 'cat-training', Beslenme: 'cat-nutrition', Deneyimler: 'cat-stories' };
export const PAGE_SIZE = 30;
export const REPLY_PAGE = 50;
// Sunucudaki api/_forum.js ile aynı olmalı; testler iki değeri karşılaştırır.
export const EDIT_WINDOW_MS = 30 * 60 * 1000;
const LOCALES = {
  tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ja: 'ja-JP', fr: 'fr-FR',
  es: 'es-ES', bg: 'bg-BG', ru: 'ru-RU', hi: 'hi-IN', zh: 'zh-CN'
};

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
    'google-login': 'Google ile giriş yap', 'google-register': 'Google ile kayıt ol',
    'google-continue': 'Google ile devam et',
    'google-hint': 'Tek tıkla ücretsiz hesap oluşturur veya mevcut Google hesabınla oturum açar.',
    'or-divider': 'veya kullanıcı adıyla devam et',
    'google-not-configured': 'Google ile giriş henüz yapılandırılmadı. Kullanıcı adı ve şifreyle devam edebilirsin.',
    'google-cancelled': 'Google ile giriş iptal edildi.',
    'google-failed': 'Google doğrulaması tamamlanamadı. Lütfen tekrar dene.',
    'google-unverified': 'Google hesabının e-posta adresi doğrulanmamış.',
    'welcome-registered': 'Hesabın oluşturuldu! Hoş geldin',
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
    'google-login': 'Sign in with Google', 'google-register': 'Sign up with Google',
    'google-continue': 'Continue with Google',
    'google-hint': 'Creates a free account in one click or signs you in with your Google account.',
    'or-divider': 'or continue with a username',
    'google-not-configured': 'Google sign-in is not configured yet. Please continue with a username and password.',
    'google-cancelled': 'Google sign-in was cancelled.',
    'google-failed': 'Could not complete Google verification. Please try again.',
    'google-unverified': 'Your Google account email address is not verified.',
    'welcome-registered': 'Your account is ready! Welcome',
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
    'google-login': 'Mit Google anmelden', 'google-register': 'Mit Google registrieren',
    'google-continue': 'Weiter mit Google',
    'google-hint': 'Erstellt mit einem Klick ein kostenloses Konto oder meldet dich mit Google an.',
    'or-divider': 'oder mit Benutzernamen fortfahren',
    'google-not-configured': 'Google-Anmeldung ist noch nicht eingerichtet. Bitte nutze Benutzername und Passwort.',
    'google-cancelled': 'Google-Anmeldung wurde abgebrochen.',
    'google-failed': 'Google-Bestätigung fehlgeschlagen. Bitte versuche es erneut.',
    'google-unverified': 'Die E-Mail-Adresse deines Google-Kontos ist nicht bestätigt.',
    'welcome-registered': 'Dein Konto wurde erstellt! Willkommen',
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
    'google-login': 'Googleでログイン', 'google-register': 'Googleで登録',
    'google-continue': 'Googleで続行',
    'google-hint': 'ワンクリックで無料アカウントを作成するか、既存のGoogleアカウントでログインします。',
    'or-divider': 'またはユーザー名で続行',
    'google-not-configured': 'Googleログインはまだ設定されていません。ユーザー名とパスワードをご利用ください。',
    'google-cancelled': 'Googleログインがキャンセルされました。',
    'google-failed': 'Google認証を完了できませんでした。もう一度お試しください。',
    'google-unverified': 'Googleアカウントのメールアドレスが確認されていません。',
    'welcome-registered': 'アカウントを作成しました！ようこそ',
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
  },
  fr: {
    site: '← Retour au site', eyebrow: 'APPRENDRE ENSEMBLE, PARTAGER CE QUI MARCHE', title: 'La progression commence par une conversation.', intro: 'Échangez avec la communauté sur l entraînement, la nutrition et les habitudes quotidiennes.', aside: 'Votre compte est visible au lieu d un pseudonyme. Ne partagez pas de données de santé personnelles. Les publications ici ne sont pas un avis médical. Soyez respectueux ; les sujets et réponses sont publiés après validation.', 'login-title': 'Continuez avec votre compte',
    'login-help': 'La session reste ouverte 14 jours. Votre nom d utilisateur apparaît sur vos publications.', 'register-title': 'Créer un compte gratuit', 'register-help': 'Choisissez un nom d utilisateur de 3 à 20 caractères et un mot de passe d au moins 8 caractères contenant des lettres et des chiffres.', username: 'Nom d utilisateur', password: 'Mot de passe', confirm: 'Confirmer le mot de passe',
    'login-submit': 'Se connecter', 'register-submit': 'S inscrire', logout: 'Se déconnecter',
    'google-login': 'Se connecter avec Google', 'google-register': 'S inscrire avec Google',
    'google-continue': 'Continuer avec Google',
    'google-hint': 'Crée un compte gratuit en un clic ou vous connecte avec votre compte Google.',
    'or-divider': 'ou continuer avec un nom d utilisateur',
    'google-not-configured': 'La connexion Google n est pas encore configurée. Utilisez un nom d utilisateur et un mot de passe.',
    'google-cancelled': 'Connexion avec Google annulée.',
    'google-failed': 'La vérification Google a échoué. Veuillez réessayer.',
    'google-unverified': 'L adresse e-mail de votre compte Google n est pas vérifiée.',
    'welcome-registered': 'Votre compte est créé ! Bienvenue', topics: 'Sujets', refresh: 'Actualiser', prev: '← Précédent',
    next: 'Suivant →', 'gate-title': 'Un compte est nécessaire pour participer', 'gate-body': 'Créer un sujet et répondre est gratuit. Connectez-vous ou inscrivez-vous d abord.', 'new-title': 'Démarrer une nouvelle discussion', category: 'Catégorie', titleField: 'Titre du sujet',
    message: 'Message', 'send-topic': 'Envoyer pour validation →', back: '← Tous les sujets', 'reply-prev': '← Réponses précédentes', 'reply-next': 'Réponses suivantes →', 'reply-gate': 'Connectez-vous ou inscrivez-vous pour répondre.',
    'reply-title': 'Rejoindre la discussion', reply: 'Réponse', 'send-reply': 'Envoyer la réponse pour validation →', page: 'Page', empty: 'Aucun sujet pour le moment. Lancez la première discussion !', replies: 'réponses',
    pending: 'réponse en attente de validation', loading: 'Chargement des sujets…', opening: 'Chargement de la discussion…', closed: 'Ce sujet est fermé aux nouvelles réponses.', lockedBadge: 'Verrouillé', postedAs: 'Vous publiez avec',
    welcome: 'Bienvenue', authRequired: 'Connectez-vous pour publier.', mismatch: 'Les mots de passe ne correspondent pas.', manage: 'Gestion du forum', approve: 'Approuver', unlock: 'Déverrouiller',
    lock: 'Verrouiller', delete: 'Supprimer', 'cat-general': 'Général', 'cat-training': 'Entraînement', 'cat-nutrition': 'Nutrition', 'cat-stories': 'Expériences',
    waiting: 'En attente de validation', deleteTopic: 'Supprimer définitivement le sujet et toutes ses réponses ?', deleteReply: 'Supprimer définitivement la réponse ?', done: 'Opération terminée.', noReplies: 'Aucune réponse pour le moment.', replyHeading: 'Réponses',
    views: 'vues', pinnedBadge: 'Épinglé', pin: 'Épingler', unpin: 'Désépingler', like: 'J aime', liked: 'Vous aimez',
    likeFirst: 'Connectez-vous pour aimer.', quote: 'Citer', quotedPost: 'Message cité', cancelQuote: 'Retirer la citation', cancel: 'Annuler', save: 'Enregistrer',
    edit: 'Modifier', edited: 'modifié', editHint: 'Vous pouvez modifier dans les 30 premières minutes.', editExpired: 'Le délai de modification est écoulé.', copyLink: 'Copier le lien', copied: 'Lien copié.',
    copyFailed: 'Impossible de copier le lien.', posts: 'messages', you: 'vous', topicOwner: 'Auteur du sujet', jumpQuote: 'Aller à la citation', 'rank-new': 'Nouveau membre',
    'rank-member': 'Membre', 'rank-active': 'Membre actif', 'rank-veteran': 'Membre confirmé', anchorMissing: 'Le message du lien n apparaît pas sur cette page.', heroEyebrow: 'PLACE TESTOTAVAN', search: 'Rechercher un sujet…',
    searchLabel: 'Rechercher', sortNew: 'Récents', sortTop: 'Populaires', sortActive: 'Plus de réponses', sortUnanswered: 'Sans réponse', statsThreads: 'Sujets',
    statsReplies: 'Réponses', statsMembers: 'Membres', statsViews: 'Vues', railPulse: 'Pouls de la communauté', railAuthors: 'Auteurs en vedette', railGuidelines: 'Règles de la place',
    guideline1: 'Soyez respectueux ; visez l idée, pas la personne.', guideline2: 'Ne partagez pas de données de santé personnelles ni d ordonnances.', guideline3: 'Ajoutez un lien si vous citez une source ; ne promettez pas de guérison.', guideline4: 'Les sujets sont publiés après validation par un administrateur.', allCategories: 'Tout', noResults: 'Aucun sujet avec ces filtres.',
    clearFilters: 'Effacer les filtres', sharePage: 'Partager la page du sujet', openPage: 'Page permanente', latestTopic: 'Dernier sujet', boardForums: 'Forums', tabNew: 'Nouveaux messages',
    tabHot: 'Sujets chauds', colTopic: 'Sujet', colForum: 'Forum', colReplies: 'Réponses', colViews: 'Vues', colPosted: 'Publié',
    colLast: 'Dernière réponse', newTopic: 'Créer un sujet', latestContent: 'Derniers contenus', noLastReply: 'Sans réponse'
  },
  es: {
    site: '← Volver al sitio', eyebrow: 'APRENDER JUNTOS, COMPARTIR LO QUE FUNCIONA', title: 'El progreso empieza con una conversación.', intro: 'Habla con la comunidad sobre entrenamiento, nutrición y hábitos diarios.', aside: 'Tu cuenta es visible en lugar de un alias. No compartas datos personales de salud. Lo publicado aquí no es consejo médico. Sé respetuoso; los temas y respuestas se publican tras la aprobación.', 'login-title': 'Continúa con tu cuenta',
    'login-help': 'La sesión permanece abierta 14 días. Tu nombre de usuario aparece en tus publicaciones.', 'register-title': 'Crear una cuenta gratuita', 'register-help': 'Elige un nombre de usuario de 3 a 20 caracteres y una contraseña de al menos 8 caracteres con letras y números.', username: 'Nombre de usuario', password: 'Contraseña', confirm: 'Repetir contraseña',
    'login-submit': 'Iniciar sesión', 'register-submit': 'Registrarse', logout: 'Salir',
    'google-login': 'Iniciar sesión con Google', 'google-register': 'Registrarse con Google',
    'google-continue': 'Continuar con Google',
    'google-hint': 'Crea una cuenta gratuita con un clic o inicia sesión con tu cuenta de Google.',
    'or-divider': 'o continúa con nombre de usuario',
    'google-not-configured': 'El acceso con Google aún no está configurado. Usa nombre de usuario y contraseña.',
    'google-cancelled': 'Se canceló el acceso con Google.',
    'google-failed': 'No se pudo completar la verificación de Google. Inténtalo de nuevo.',
    'google-unverified': 'El correo electrónico de tu cuenta de Google no está verificado.',
    'welcome-registered': '¡Tu cuenta está lista! Bienvenido', topics: 'Temas', refresh: 'Actualizar', prev: '← Anterior',
    next: 'Siguiente →', 'gate-title': 'Necesitas una cuenta para participar', 'gate-body': 'Abrir un tema y responder es gratis. Inicia sesión o regístrate primero.', 'new-title': 'Iniciar una nueva conversación', category: 'Categoría', titleField: 'Título del tema',
    message: 'Mensaje', 'send-topic': 'Enviar para revisión →', back: '← Todos los temas', 'reply-prev': '← Respuestas anteriores', 'reply-next': 'Respuestas siguientes →', 'reply-gate': 'Inicia sesión o regístrate para responder.',
    'reply-title': 'Únete a la conversación', reply: 'Respuesta', 'send-reply': 'Enviar respuesta para revisión →', page: 'Página', empty: 'Aún no hay temas. ¡Inicia la primera conversación!', replies: 'respuestas',
    pending: 'respuesta pendiente de aprobación', loading: 'Cargando temas…', opening: 'Cargando conversación…', closed: 'Este tema está cerrado a nuevas respuestas.', lockedBadge: 'Bloqueado', postedAs: 'Publicas con',
    welcome: 'Bienvenido', authRequired: 'Inicia sesión para publicar.', mismatch: 'Las contraseñas no coinciden.', manage: 'Gestión del foro', approve: 'Aprobar', unlock: 'Desbloquear',
    lock: 'Bloquear', delete: 'Eliminar', 'cat-general': 'General', 'cat-training': 'Entrenamiento', 'cat-nutrition': 'Nutrición', 'cat-stories': 'Experiencias',
    waiting: 'Pendiente de aprobación', deleteTopic: '¿Eliminar definitivamente el tema y todas sus respuestas?', deleteReply: '¿Eliminar definitivamente la respuesta?', done: 'Operación completada.', noReplies: 'Aún no hay respuestas.', replyHeading: 'Respuestas',
    views: 'visualizaciones', pinnedBadge: 'Fijado', pin: 'Fijar', unpin: 'Quitar fijación', like: 'Me gusta', liked: 'Te gusta',
    likeFirst: 'Inicia sesión para dar me gusta.', quote: 'Citar', quotedPost: 'Mensaje citado', cancelQuote: 'Quitar cita', cancel: 'Cancelar', save: 'Guardar',
    edit: 'Editar', edited: 'editado', editHint: 'Puedes editar en los primeros 30 minutos.', editExpired: 'El plazo de edición ha terminado.', copyLink: 'Copiar enlace', copied: 'Enlace copiado.',
    copyFailed: 'No se pudo copiar el enlace.', posts: 'mensajes', you: 'tú', topicOwner: 'Autor del tema', jumpQuote: 'Ir a la cita', 'rank-new': 'Miembro nuevo',
    'rank-member': 'Miembro', 'rank-active': 'Miembro activo', 'rank-veteran': 'Miembro veterano', anchorMissing: 'El mensaje del enlace no aparece en esta página.', heroEyebrow: 'PLAZA TESTOTAVAN', search: 'Buscar un tema…',
    searchLabel: 'Buscar', sortNew: 'Recientes', sortTop: 'Populares', sortActive: 'Más respuestas', sortUnanswered: 'Sin respuesta', statsThreads: 'Temas',
    statsReplies: 'Respuestas', statsMembers: 'Miembros', statsViews: 'Vistas', railPulse: 'Pulso de la comunidad', railAuthors: 'Autores destacados', railGuidelines: 'Reglas de la plaza',
    guideline1: 'Sé respetuoso; céntrate en la idea, no en la persona.', guideline2: 'No compartas datos personales de salud ni recetas médicas.', guideline3: 'Añade el enlace si citas una fuente; no prometas curas.', guideline4: 'Los temas se publican tras la aprobación del administrador.', allCategories: 'Todo', noResults: 'Ningún tema coincide con estos filtros.',
    clearFilters: 'Limpiar filtros', sharePage: 'Compartir la página del tema', openPage: 'Página permanente', latestTopic: 'Último tema', boardForums: 'Foros', tabNew: 'Mensajes nuevos',
    tabHot: 'Temas calientes', colTopic: 'Tema', colForum: 'Foro', colReplies: 'Respuestas', colViews: 'Vistas', colPosted: 'Publicado',
    colLast: 'Última respuesta', newTopic: 'Crear tema', latestContent: 'Últimos contenidos', noLastReply: 'Sin respuesta'
  },
  bg: {
    site: '← Обратно към сайта', eyebrow: 'УЧИМ ЗАЕДНО, СПОДЕЛЯМЕ ОПИТ', title: 'Развитието започва с разговор.', intro: 'Говори с общността за тренировки, хранене и ежедневни навици.', aside: 'Вместо псевдоним се вижда профилът ти. Не споделяй лични здравни данни. Публикациите тук не са медицински съвет. Бъди уважителен; темите и отговорите се публикуват след одобрение.', 'login-title': 'Продължи с профила си',
    'login-help': 'Сесията остава активна 14 дни. Потребителското име се вижда в публикациите.', 'register-title': 'Създай безплатен профил', 'register-help': 'Избери потребителско име от 3 до 20 знака и парола поне 8 знака с букви и цифри.', username: 'Потребителско име', password: 'Парола', confirm: 'Повтори паролата',
    'login-submit': 'Вход', 'register-submit': 'Регистрация', logout: 'Изход',
    'google-login': 'Вход с Google', 'google-register': 'Регистрация с Google',
    'google-continue': 'Продължи с Google',
    'google-hint': 'Създава безплатен профил с един клик или влиза с вашия Google профил.',
    'or-divider': 'или продължи с потребителско име',
    'google-not-configured': 'Входът с Google все още не е настроен. Използвайте потребителско име и парола.',
    'google-cancelled': 'Входът с Google беше отказан.',
    'google-failed': 'Проверката с Google не бе успешна. Опитайте отново.',
    'google-unverified': 'Имейл адресът на вашия Google профил не е потвърден.',
    'welcome-registered': 'Профилът ви е създаден! Добре дошъл', topics: 'Теми', refresh: 'Обнови', prev: '← Предишна',
    next: 'Следваща →', 'gate-title': 'За участие е нужен профил', 'gate-body': 'Отварянето на тема и отговорите са безплатни. Първо влез или се регистрирай.', 'new-title': 'Започни нов разговор', category: 'Категория', titleField: 'Заглавие на темата',
    message: 'Съобщение', 'send-topic': 'Изпрати за одобрение →', back: '← Всички теми', 'reply-prev': '← Предишни отговори', 'reply-next': 'Следващи отговори →', 'reply-gate': 'Влез или се регистрирай, за да отговориш.',
    'reply-title': 'Присъедини се към разговора', reply: 'Отговор', 'send-reply': 'Изпрати отговора за одобрение →', page: 'Страница', empty: 'Все още няма теми. Започни първия разговор!', replies: 'отговора',
    pending: 'отговор чака одобрение', loading: 'Зареждане на теми…', opening: 'Зареждане на разговора…', closed: 'Тази тема е затворена за нови отговори.', lockedBadge: 'Заключена', postedAs: 'Пишеш като',
    welcome: 'Добре дошъл', authRequired: 'Влез, за да публикуваш.', mismatch: 'Паролите не съвпадат.', manage: 'Управление на форума', approve: 'Одобри', unlock: 'Отключи',
    lock: 'Заключи', delete: 'Изтрий', 'cat-general': 'Общи', 'cat-training': 'Тренировки', 'cat-nutrition': 'Хранене', 'cat-stories': 'Опит',
    waiting: 'Чака одобрение', deleteTopic: 'Да се изтрие ли темата с всички отговори завинаги?', deleteReply: 'Да се изтрие ли отговорът завинаги?', done: 'Операцията е завършена.', noReplies: 'Все още няма отговори.', replyHeading: 'Отговори',
    views: 'преглеждания', pinnedBadge: 'Закачена', pin: 'Закачи', unpin: 'Откачи', like: 'Харесва ми', liked: 'Харесва ти',
    likeFirst: 'Влез, за да харесаш.', quote: 'Цитирай', quotedPost: 'Цитирано съобщение', cancelQuote: 'Премахни цитата', cancel: 'Отказ', save: 'Запази',
    edit: 'Редактирай', edited: 'редактирано', editHint: 'Можеш да редактираш в първите 30 минути.', editExpired: 'Времето за редакция изтече.', copyLink: 'Копирай връзката', copied: 'Връзката е копирана.',
    copyFailed: 'Връзката не можа да се копира.', posts: 'съобщения', you: 'ти', topicOwner: 'Автор на темата', jumpQuote: 'Към цитата', 'rank-new': 'Нов член',
    'rank-member': 'Член', 'rank-active': 'Активен член', 'rank-veteran': 'Старши член', anchorMissing: 'Съобщението от връзката не е на тази страница.', heroEyebrow: 'ПЛОЩАД TESTOTAVAN', search: 'Търси тема…',
    searchLabel: 'Търси', sortNew: 'Нови', sortTop: 'Популярни', sortActive: 'Най-отговаряни', sortUnanswered: 'Без отговор', statsThreads: 'Теми',
    statsReplies: 'Отговори', statsMembers: 'Членове', statsViews: 'Преглеждания', railPulse: 'Пулс на общността', railAuthors: 'Изявени автори', railGuidelines: 'Правила на площада',
    guideline1: 'Бъди уважителен; насочи се към идеята, не към човека.', guideline2: 'Не споделяй лични здравни данни и рецепти.', guideline3: 'Добави връзка, ако цитираш източник; не обещавай лечение.', guideline4: 'Темите се публикуват след одобрение от администратор.', allCategories: 'Всички', noResults: 'Няма теми с тези филтри.',
    clearFilters: 'Изчисти филтрите', sharePage: 'Сподели страницата на темата', openPage: 'Постоянна страница', latestTopic: 'Последна тема', boardForums: 'Форуми', tabNew: 'Нови съобщения',
    tabHot: 'Горещи теми', colTopic: 'Тема', colForum: 'Форум', colReplies: 'Отговори', colViews: 'Прегледи', colPosted: 'Публикувано',
    colLast: 'Последен отговор', newTopic: 'Нова тема', latestContent: 'Последни публикации', noLastReply: 'Без отговор'
  },
  ru: {
    site: '← Вернуться на сайт', eyebrow: 'УЧИМСЯ ВМЕСТЕ, ДЕЛИМСЯ ОПЫТОМ', title: 'Прогресс начинается с разговора.', intro: 'Общайтесь с сообществом о тренировках, питании и ежедневных привычках.', aside: 'Вместо псевдонима виден ваш аккаунт. Не публикуйте личные медицинские данные. Материалы здесь не являются медицинским советом. Будьте уважительны; темы и ответы публикуются после проверки.', 'login-title': 'Продолжить с аккаунтом',
    'login-help': 'Сессия остаётся активной 14 дней. Имя пользователя видно в публикациях.', 'register-title': 'Создать бесплатный аккаунт', 'register-help': 'Выберите имя пользователя от 3 до 20 символов и пароль не короче 8 символов с буквами и цифрами.', username: 'Имя пользователя', password: 'Пароль', confirm: 'Повторите пароль',
    'login-submit': 'Войти', 'register-submit': 'Зарегистрироваться', logout: 'Выйти',
    'google-login': 'Войти через Google', 'google-register': 'Регистрация через Google',
    'google-continue': 'Продолжить с Google',
    'google-hint': 'Создаёт бесплатный аккаунт в один клик или выполняет вход через аккаунт Google.',
    'or-divider': 'или продолжите с именем пользователя',
    'google-not-configured': 'Вход через Google ещё не настроен. Используйте имя пользователя и пароль.',
    'google-cancelled': 'Вход через Google отменён.',
    'google-failed': 'Не удалось выполнить проверку Google. Попробуйте ещё раз.',
    'google-unverified': 'Электронная почта вашего аккаунта Google не подтверждена.',
    'welcome-registered': 'Аккаунт создан! Добро пожаловать', topics: 'Темы', refresh: 'Обновить', prev: '← Назад',
    next: 'Вперёд →', 'gate-title': 'Для участия нужен аккаунт', 'gate-body': 'Создать тему и ответить можно бесплатно. Сначала войдите или зарегистрируйтесь.', 'new-title': 'Начать новое обсуждение', category: 'Категория', titleField: 'Заголовок темы',
    message: 'Сообщение', 'send-topic': 'Отправить на проверку →', back: '← Все темы', 'reply-prev': '← Предыдущие ответы', 'reply-next': 'Следующие ответы →', 'reply-gate': 'Войдите или зарегистрируйтесь, чтобы ответить.',
    'reply-title': 'Присоединиться к обсуждению', reply: 'Ответ', 'send-reply': 'Отправить ответ на проверку →', page: 'Страница', empty: 'Тем пока нет. Начните первое обсуждение!', replies: 'ответов',
    pending: 'ответ ожидает проверки', loading: 'Загрузка тем…', opening: 'Загрузка обсуждения…', closed: 'Эта тема закрыта для новых ответов.', lockedBadge: 'Закрыто', postedAs: 'Вы пишете как',
    welcome: 'Добро пожаловать', authRequired: 'Войдите, чтобы писать.', mismatch: 'Пароли не совпадают.', manage: 'Управление форумом', approve: 'Одобрить', unlock: 'Открыть',
    lock: 'Закрыть', delete: 'Удалить', 'cat-general': 'Общее', 'cat-training': 'Тренировки', 'cat-nutrition': 'Питание', 'cat-stories': 'Опыт',
    waiting: 'Ожидает проверки', deleteTopic: 'Удалить тему и все ответы навсегда?', deleteReply: 'Удалить ответ навсегда?', done: 'Готово.', noReplies: 'Ответов пока нет.', replyHeading: 'Ответы',
    views: 'просмотров', pinnedBadge: 'Закреплено', pin: 'Закрепить', unpin: 'Открепить', like: 'Нравится', liked: 'Вам нравится',
    likeFirst: 'Войдите, чтобы поставить отметку.', quote: 'Цитировать', quotedPost: 'Цитируемое сообщение', cancelQuote: 'Убрать цитату', cancel: 'Отмена', save: 'Сохранить',
    edit: 'Изменить', edited: 'изменено', editHint: 'Можно изменить в первые 30 минут.', editExpired: 'Время редактирования истекло.', copyLink: 'Скопировать ссылку', copied: 'Ссылка скопирована.',
    copyFailed: 'Не удалось скопировать ссылку.', posts: 'сообщений', you: 'вы', topicOwner: 'Автор темы', jumpQuote: 'Перейти к цитате', 'rank-new': 'Новый участник',
    'rank-member': 'Участник', 'rank-active': 'Активный участник', 'rank-veteran': 'Старший участник', anchorMissing: 'Сообщение из ссылки не отображается на этой странице.', heroEyebrow: 'ПЛОЩАДЬ TESTOTAVAN', search: 'Найти тему…',
    searchLabel: 'Поиск', sortNew: 'Новые', sortTop: 'Популярные', sortActive: 'Больше ответов', sortUnanswered: 'Без ответа', statsThreads: 'Темы',
    statsReplies: 'Ответы', statsMembers: 'Участники', statsViews: 'Просмотры', railPulse: 'Пульс сообщества', railAuthors: 'Активные авторы', railGuidelines: 'Правила площади',
    guideline1: 'Будьте уважительны; обсуждайте идею, а не человека.', guideline2: 'Не публикуйте личные медицинские данные и рецепты.', guideline3: 'Добавляйте ссылку на источник; не обещайте лечение.', guideline4: 'Темы публикуются после проверки администратором.', allCategories: 'Все', noResults: 'По этим фильтрам тем не найдено.',
    clearFilters: 'Сбросить фильтры', sharePage: 'Поделиться страницей темы', openPage: 'Постоянная страница', latestTopic: 'Последняя тема', boardForums: 'Форумы', tabNew: 'Новые сообщения',
    tabHot: 'Горячие темы', colTopic: 'Тема', colForum: 'Форум', colReplies: 'Ответы', colViews: 'Просмотры', colPosted: 'Опубликовано',
    colLast: 'Последний ответ', newTopic: 'Создать тему', latestContent: 'Последние материалы', noLastReply: 'Без ответа'
  },
  hi: {
    site: '← साइट पर वापस', eyebrow: 'साथ सीखें, अनुभव साझा करें', title: 'प्रगति एक बातचीत से शुरू होती है।', intro: 'प्रशिक्षण, पोषण और रोज़ की आदतों पर समुदाय से बात करें।', aside: 'उपनाम की जगह आपका खाता दिखता है। व्यक्तिगत स्वास्थ्य डेटा साझा न करें। यहाँ की पोस्ट चिकित्सकीय सलाह नहीं हैं। विनम्र रहें; विषय और उत्तर व्यवस्थापक स्वीकृति के बाद प्रकाशित होते हैं।', 'login-title': 'अपने खाते से जारी रखें',
    'login-help': 'सत्र 14 दिन खुला रहता है। आपका उपयोगकर्ता नाम पोस्ट में दिखता है।', 'register-title': 'मुफ़्त खाता बनाएँ', 'register-help': '3–20 अक्षरों का उपयोगकर्ता नाम और कम से कम 8 अक्षरों का पासवर्ड चुनें जिसमें अक्षर और अंक हों।', username: 'उपयोगकर्ता नाम', password: 'पासवर्ड', confirm: 'पासवर्ड दोहराएँ',
    'login-submit': 'लॉग इन करें', 'register-submit': 'साइन अप करें', logout: 'लॉग आउट',
    'google-login': 'Google से साइन इन करें', 'google-register': 'Google से साइन अप करें',
    'google-continue': 'Google के साथ जारी रखें',
    'google-hint': 'एक क्लिक में मुफ़्त खाता बनाता है या आपके Google खाते से साइन इन करता है।',
    'or-divider': 'या उपयोगकर्ता नाम से जारी रखें',
    'google-not-configured': 'Google साइन-इन अभी कॉन्फ़िगर नहीं है। कृपया उपयोगकर्ता नाम और पासवर्ड का उपयोग करें।',
    'google-cancelled': 'Google साइन-इन रद्द कर दिया गया।',
    'google-failed': 'Google सत्यापन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।',
    'google-unverified': 'आपके Google खाते का ईमेल पता सत्यापित नहीं है।',
    'welcome-registered': 'आपका खाता बन गया है! स्वागत है', topics: 'विषय', refresh: 'रिफ़्रेश', prev: '← पिछला',
    next: 'अगला →', 'gate-title': 'भाग लेने के लिए खाता आवश्यक है', 'gate-body': 'विषय शुरू करना और उत्तर देना मुफ़्त है। पहले लॉग इन या साइन अप करें।', 'new-title': 'नई बातचीत शुरू करें', category: 'श्रेणी', titleField: 'विषय का शीर्षक',
    message: 'संदेश', 'send-topic': 'स्वीकृति के लिए भेजें →', back: '← सभी विषय', 'reply-prev': '← पिछले उत्तर', 'reply-next': 'अगले उत्तर →', 'reply-gate': 'उत्तर देने के लिए लॉग इन या साइन अप करें।',
    'reply-title': 'बातचीत में शामिल हों', reply: 'उत्तर', 'send-reply': 'उत्तर स्वीकृति के लिए भेजें →', page: 'पृष्ठ', empty: 'अभी कोई विषय नहीं। पहली बातचीत आप शुरू करें!', replies: 'उत्तर',
    pending: 'उत्तर स्वीकृति की प्रतीक्षा में', loading: 'विषय लोड हो रहे हैं…', opening: 'बातचीत लोड हो रही है…', closed: 'यह विषय नए उत्तरों के लिए बंद है।', lockedBadge: 'बंद', postedAs: 'आप इस खाते से लिख रहे हैं',
    welcome: 'स्वागत है', authRequired: 'लिखने के लिए लॉग इन करें।', mismatch: 'पासवर्ड मेल नहीं खाते।', manage: 'फ़ोरम प्रबंधन', approve: 'स्वीकृत करें', unlock: 'अनलॉक करें',
    lock: 'लॉक करें', delete: 'हटाएँ', 'cat-general': 'सामान्य', 'cat-training': 'प्रशिक्षण', 'cat-nutrition': 'पोषण', 'cat-stories': 'अनुभव',
    waiting: 'स्वीकृति की प्रतीक्षा', deleteTopic: 'विषय और उसके सभी उत्तर हमेशा के लिए हटाएँ?', deleteReply: 'उत्तर हमेशा के लिए हटाएँ?', done: 'कार्य पूरा हुआ।', noReplies: 'अभी कोई उत्तर नहीं।', replyHeading: 'उत्तर',
    views: 'बार देखा गया', pinnedBadge: 'पिन किया', pin: 'पिन करें', unpin: 'पिन हटाएँ', like: 'पसंद', liked: 'आपको पसंद है',
    likeFirst: 'पसंद करने के लिए लॉग इन करें।', quote: 'उद्धृत करें', quotedPost: 'उद्धृत संदेश', cancelQuote: 'उद्धरण हटाएँ', cancel: 'रद्द करें', save: 'सहेजें',
    edit: 'संपादित करें', edited: 'संपादित', editHint: 'पहले 30 मिनट में संपादित कर सकते हैं।', editExpired: 'संपादन का समय समाप्त हो गया।', copyLink: 'लिंक कॉपी करें', copied: 'लिंक कॉपी हो गया।',
    copyFailed: 'लिंक कॉपी नहीं हो सका।', posts: 'संदेश', you: 'आप', topicOwner: 'विषय के लेखक', jumpQuote: 'उद्धरण पर जाएँ', 'rank-new': 'नया सदस्य',
    'rank-member': 'सदस्य', 'rank-active': 'सक्रिय सदस्य', 'rank-veteran': 'वरिष्ठ सदस्य', anchorMissing: 'लिंक का संदेश इस पृष्ठ पर नहीं दिखता।', heroEyebrow: 'TESTOTAVAN चौक', search: 'विषय खोजें…',
    searchLabel: 'खोजें', sortNew: 'नए', sortTop: 'लोकप्रिय', sortActive: 'सर्वाधिक उत्तर', sortUnanswered: 'बिना उत्तर', statsThreads: 'विषय',
    statsReplies: 'उत्तर', statsMembers: 'सदस्य', statsViews: 'दृश्य', railPulse: 'समुदाय की धड़कन', railAuthors: 'प्रमुख लेखक', railGuidelines: 'चौक के नियम',
    guideline1: 'विनम्र रहें; व्यक्ति नहीं, विचार पर ध्यान दें।', guideline2: 'व्यक्तिगत स्वास्थ्य डेटा और पर्चे साझा न करें।', guideline3: 'स्रोत दें तो लिंक जोड़ें; इलाज का वादा न करें।', guideline4: 'विषय व्यवस्थापक स्वीकृति के बाद प्रकाशित होते हैं।', allCategories: 'सभी', noResults: 'इन फ़िल्टर से कोई विषय नहीं मिला।',
    clearFilters: 'फ़िल्टर साफ़ करें', sharePage: 'विषय पृष्ठ साझा करें', openPage: 'स्थायी पृष्ठ', latestTopic: 'नवीनतम विषय', boardForums: 'फ़ोरम', tabNew: 'नए संदेश',
    tabHot: 'लोकप्रिय विषय', colTopic: 'विषय', colForum: 'फ़ोरम', colReplies: 'उत्तर', colViews: 'दृश्य', colPosted: 'प्रकाशित',
    colLast: 'अंतिम उत्तर', newTopic: 'नया विषय', latestContent: 'नवीनतम सामग्री', noLastReply: 'कोई उत्तर नहीं'
  },
  zh: {
    site: '← 返回网站', eyebrow: '一起学习，分享经验', title: '进步从一次对话开始。', intro: '与社区交流训练、营养和日常习惯。', aside: '这里显示你的账号而不是匿名昵称。请勿分享个人健康数据。此处内容不是医疗建议。请保持尊重；主题和回复经管理员审核后发布。', 'login-title': '使用账号继续',
    'login-help': '登录状态保持 14 天。你的用户名会显示在发布内容中。', 'register-title': '创建免费账号', 'register-help': '用户名 3–20 个字符，密码至少 8 个字符并包含字母和数字。', username: '用户名', password: '密码', confirm: '确认密码',
    'login-submit': '登录', 'register-submit': '注册', logout: '退出',
    'google-login': '使用 Google 登录', 'google-register': '使用 Google 注册',
    'google-continue': '通过 Google 继续',
    'google-hint': '一键创建免费账号，或使用现有 Google 账号登录。',
    'or-divider': '或使用用户名继续',
    'google-not-configured': '尚未配置 Google 登录，请使用用户名和密码继续。',
    'google-cancelled': '已取消 Google 登录。',
    'google-failed': 'Google 验证失败，请重试。',
    'google-unverified': '您的 Google 账号邮箱尚未验证。',
    'welcome-registered': '账号创建成功！欢迎', topics: '主题', refresh: '刷新', prev: '← 上一页',
    next: '下一页 →', 'gate-title': '参与讨论需要账号', 'gate-body': '创建主题和回复均免费。请先登录或注册。', 'new-title': '开始新的讨论', category: '分类', titleField: '主题标题',
    message: '内容', 'send-topic': '提交审核 →', back: '← 全部主题', 'reply-prev': '← 之前的回复', 'reply-next': '之后的回复 →', 'reply-gate': '登录或注册后即可回复。',
    'reply-title': '加入讨论', reply: '回复', 'send-reply': '提交回复审核 →', page: '第', empty: '还没有主题。来发起第一个讨论吧！', replies: '条回复',
    pending: '条回复待审核', loading: '正在加载主题…', opening: '正在加载讨论…', closed: '该主题已关闭新回复。', lockedBadge: '已锁定', postedAs: '当前发布账号',
    welcome: '欢迎', authRequired: '登录后即可发布。', mismatch: '两次密码不一致。', manage: '论坛管理', approve: '通过', unlock: '解锁',
    lock: '锁定', delete: '删除', 'cat-general': '综合', 'cat-training': '训练', 'cat-nutrition': '营养', 'cat-stories': '经验',
    waiting: '待审核', deleteTopic: '永久删除该主题及其全部回复？', deleteReply: '永久删除该回复？', done: '操作已完成。', noReplies: '暂无回复。', replyHeading: '回复',
    views: '次浏览', pinnedBadge: '置顶', pin: '置顶', unpin: '取消置顶', like: '点赞', liked: '已点赞',
    likeFirst: '登录后可点赞。', quote: '引用', quotedPost: '引用的内容', cancelQuote: '取消引用', cancel: '取消', save: '保存',
    edit: '编辑', edited: '已编辑', editHint: '可在发布后 30 分钟内编辑。', editExpired: '编辑时间已结束。', copyLink: '复制链接', copied: '链接已复制。',
    copyFailed: '无法复制链接。', posts: '条内容', you: '你', topicOwner: '主题作者', jumpQuote: '跳转到引用', 'rank-new': '新成员',
    'rank-member': '成员', 'rank-active': '活跃成员', 'rank-veteran': '资深成员', anchorMissing: '链接中的内容不在本页。', heroEyebrow: 'TESTOTAVAN 广场', search: '搜索主题…',
    searchLabel: '搜索', sortNew: '最新', sortTop: '热门', sortActive: '回复最多', sortUnanswered: '未回复', statsThreads: '主题',
    statsReplies: '回复', statsMembers: '成员', statsViews: '浏览', railPulse: '社区脉搏', railAuthors: '活跃作者', railGuidelines: '广场规则',
    guideline1: '保持尊重；就事论事，不针对个人。', guideline2: '请勿分享个人健康数据和处方。', guideline3: '引用来源时请附链接；不要承诺疗效。', guideline4: '主题经管理员审核后发布。', allCategories: '全部', noResults: '没有符合筛选条件的主题。',
    clearFilters: '清除筛选', sharePage: '分享主题页面', openPage: '永久页面', latestTopic: '最新主题', boardForums: '版块', tabNew: '新消息',
    tabHot: '热门主题', colTopic: '主题', colForum: '版块', colReplies: '回复', colViews: '浏览', colPosted: '发布',
    colLast: '最后回复', newTopic: '发布主题', latestContent: '最新内容', noLastReply: '暂无回复'
  }
};

const RELATIVE = {
  tr: { justNow: 'az önce', minutes: n => `${n} dk önce`, hours: n => `${n} sa önce`, days: n => `${n} gün önce`, weeks: n => `${n} hafta önce` },
  en: { justNow: 'just now', minutes: n => `${n} min ago`, hours: n => `${n} h ago`, days: n => `${n} d ago`, weeks: n => `${n} w ago` },
  de: { justNow: 'gerade eben', minutes: n => `vor ${n} Min.`, hours: n => `vor ${n} Std.`, days: n => `vor ${n} Tg.`, weeks: n => `vor ${n} Wo.` },
  ja: { justNow: 'たった今', minutes: n => `${n}分前`, hours: n => `${n}時間前`, days: n => `${n}日前`, weeks: n => `${n}週間前` },
  fr: { justNow: 'à l instant', minutes: n => `il y a ${n} min`, hours: n => `il y a ${n} h`, days: n => `il y a ${n} j`, weeks: n => `il y a ${n} sem.` },
  es: { justNow: 'ahora mismo', minutes: n => `hace ${n} min`, hours: n => `hace ${n} h`, days: n => `hace ${n} d`, weeks: n => `hace ${n} sem.` },
  bg: { justNow: 'току-що', minutes: n => `преди ${n} мин`, hours: n => `преди ${n} ч`, days: n => `преди ${n} дни`, weeks: n => `преди ${n} седм.` },
  ru: { justNow: 'только что', minutes: n => `${n} мин назад`, hours: n => `${n} ч назад`, days: n => `${n} дн. назад`, weeks: n => `${n} нед. назад` },
  hi: { justNow: 'अभी', minutes: n => `${n} मिनट पहले`, hours: n => `${n} घंटे पहले`, days: n => `${n} दिन पहले`, weeks: n => `${n} हफ़्ते पहले` },
  zh: { justNow: '刚刚', minutes: n => `${n} 分钟前`, hours: n => `${n} 小时前`, days: n => `${n} 天前`, weeks: n => `${n} 周前` }
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
