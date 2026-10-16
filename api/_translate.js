/*
 * Blog alanlarını EN / DE / JA dillerine eksiksiz çeviren katman.
 *
 * Sıra:
 *  1. Dil denetimi — kopyalanmış kaynak metin ve yarım çeviri reddedilir
 *  2. AI çeviri turu — başlık, özet ve gövdenin tamamı, paragraf yapısı korunarak
 *  3. Yedek makine çevirisi — AI yoksa veya tur eksik kaldıysa (testlerde kapalı)
 *  4. Yerel sözlük — ağ da yoksa en azından kalıp cümleler ve bilinen ifadeler
 *
 * Kaynak dildeki metin, hedef dil alanına olduğu gibi yazılmaz.
 */

import { clean, localizeDuration } from './_content-shape.js';

export const TARGET_LANGS = ['en', 'de', 'ja'];

const KNOWN_CATEGORIES = {
  'Hormon Sağlığı': { en: 'Hormone Health', de: 'Hormongesundheit', ja: 'ホルモン健康' },
  'Yüksek Protein': { en: 'High Protein', de: 'Proteinreich', ja: '高たんぱく' },
  Uyku: { en: 'Sleep', de: 'Schlaf', ja: '睡眠' }
};

const TR_HARD = /[çğışÇĞİŞ]/g;
const TR_FUNCTION = new Set([
  've', 'bir', 'bu', 'şu', 'için', 'ile', 'olan', 'olarak', 'değil', 'gibi', 'daha', 'çok',
  'sonra', 'ancak', 'çünkü', 'kadar', 'üzerine', 'arasında', 'hem', 'ya', 'veya', 'diye',
  'ise', 'nasıl', 'neden', 'göre', 'üzere', 'mi', 'mı', 'mu', 'mü', 'da', 'de', 'ki',
  'olan', 'eden', 'olan', 'her', 'çok', 'daha', 'en', 'bu', 'o', 'ne', 'hangi'
]);

// These Turkish food words have no distinctive Turkish characters. A partial
// word-map can otherwise make an ingredient look translated when it is not.
const UNTRANSLATED_RECIPE_TERMS = new Set([
  'yumurta', 'yumurtası', 'yumurtaları', 'badem', 'bademi', 'ceviz', 'cevizi', 'fındık', 'fıstık',
  'mercimek', 'nohut', 'yulaf', 'patates', 'domates', 'bal', 'muz', 'dana', 'hindi', 'kuzu',
  'tavuk', 'tavuklu', 'somon', 'peynir', 'ekmek', 'un', 'tuz', 'şeker', 'kabak', 'limon',
  'avokado', 'kakao', 'kahve', 'sirke', 'salça', 'biber', 'karabiber', 'bezelye', 'mantar',
  'havuç', 'pırasa', 'maydanoz', 'dereotu', 'fesleğen', 'kimyon', 'pul', 'adet'
]);

/** [kaynak, en, de, ja] — uzun ifadeler önce uygulanır. */
const PHRASES = [
  [
    'Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor?',
    'How Deep Sleep and Morning Sunlight Affect Testosterone',
    'Wie tiefer Schlaf und Morgenlicht das Testosteron beeinflussen',
    '深い睡眠と朝の日光はテストステロンにどう影響するか'
  ],
  [
    'Yeni klinik araştırmaya göre düzenli 8 saat uyku ve sabah gün ışığı maruziyeti hormon dengesini belirgin biçimde destekliyor.',
    'A new clinical study finds that regular 8-hour sleep and morning daylight clearly support hormone balance.',
    'Einer neuen klinischen Studie zufolge unterstützen regelmäßiger 8-stündiger Schlaf und morgendliches Tageslicht das Hormongleichgewicht deutlich.',
    '新しい臨床研究によると、規則的な8時間の睡眠と朝の日光はホルモンバランスを明らかに支えます。'
  ],
  [
    'Yapılan son araştırmalar, geceleri kesintisiz 7 ila 8 saat uyuyan yetişkin erkeklerde sabah total ve serbest testosteron düzeylerinin çok daha dengeli seyrettiğini ortaya koyuyor.',
    'Recent studies show that adult men who sleep 7 to 8 uninterrupted hours at night have much steadier morning total and free testosterone levels.',
    'Aktuelle Studien zeigen, dass erwachsene Männer mit 7 bis 8 Stunden ununterbrochenem Nachtschlaf deutlich stabilere morgendliche Gesamt- und freie Testosteronwerte haben.',
    '最新の研究では、夜に途切れず7〜8時間眠る成人男性は、朝の総テストステロンと遊離テストステロンがより安定していることが示されています。'
  ],
  [
    'Araştırma ekibi, özellikle REM ve derin uyku evrelerinin kısalmasının kortizol hormonunu yükselttiğini ve hipotalamus-hipofiz eksenini baskıladığını vurguluyor.',
    'The research team stresses that shorter REM and deep-sleep stages raise cortisol and suppress the hypothalamic-pituitary axis.',
    'Das Forschungsteam betont, dass kürzere REM- und Tiefschlafphasen das Cortisol erhöhen und die Hypothalamus-Hypophysen-Achse hemmen.',
    '研究チームは、REM睡眠と深い睡眠が短くなるとコルチゾールが上がり、視床下部・下垂体の軸が抑えられると強調しています。'
  ],
  [
    'Uzmanlar ayrıca sabah uyanır uyanmaz 15 dakika doğal gün ışığı almanın sirkadiyen ritmi ve melatonin-kortizol dengesini optimize ettiğini belirtiyor.',
    'Experts also note that 15 minutes of natural daylight right after waking optimizes circadian rhythm and the melatonin-cortisol balance.',
    'Fachleute weisen außerdem darauf hin, dass 15 Minuten natürliches Tageslicht direkt nach dem Aufwachen den zirkadianen Rhythmus und das Melatonin-Cortisol-Gleichgewicht verbessern.',
    '専門家はさらに、起床直後に15分ほど自然な日光を浴びると、概日リズムとメラトニン・コルチゾールのバランスが整うと述べています。'
  ],
  [
    'Uyku kalitesi, dengeli beslenme, düzenli direnç egzersizi ve stres yönetimi genel sağlık ile hormonal dengeyi destekleyen temel yapı taşlarıdır. Yeni araştırmaları değerlendirirken kişisel sağlık durumunuzu ve laboratuvar bulgularınızı bir hekimle birlikte ele almanız önerilir.',
    'Sleep quality, balanced nutrition, regular resistance training and stress management are the foundations of general health and hormonal balance. Review new findings together with a physician and your own lab results.',
    'Schlafqualität, ausgewogene Ernährung, regelmäßiges Krafttraining und Stressbewältigung sind die Grundlage für Gesundheit und Hormongleichgewicht. Besprechen Sie neue Erkenntnisse zusammen mit Ihren Laborwerten mit einer Ärztin oder einem Arzt.',
    '睡眠の質、バランスの取れた食事、定期的な筋力トレーニング、ストレス管理は、全身の健康とホルモンバランスを支える土台です。新しい研究は、ご自身の検査結果とあわせて医師に相談してください。'
  ],
  [
    'Not: Bu içerik bilgilendirme amaçlıdır; tıbbi teşhis veya tedavi yerine geçmez.',
    'Note: This content is for information only and does not replace medical diagnosis or treatment.',
    'Hinweis: Dieser Inhalt dient nur der Information und ersetzt keine ärztliche Diagnose oder Behandlung.',
    '注：この内容は情報提供のみを目的としており、医学的な診断や治療に代わるものではありません。'
  ],
  ['Öne Çıkan Noktalar:', 'Key Points:', 'Wichtige Punkte:', '要点：'],
  ['TestoTavan Değerlendirmesi:', 'TestoTavan Assessment:', 'TestoTavan-Einordnung:', 'TestoTavanの評価：'],
  ['Hormon Sağlığı', 'Hormone Health', 'Hormongesundheit', 'ホルモン健康'],
  ['Yüksek Protein', 'High Protein', 'Proteinreich', '高たんぱく'],
  ['sabah gün ışığı', 'morning daylight', 'morgendliches Tageslicht', '朝の日光'],
  ['derin uyku', 'deep sleep', 'Tiefschlaf', '深い睡眠'],
  ['hormon dengesi', 'hormone balance', 'Hormongleichgewicht', 'ホルモンバランス'],
  ['serbest testosteron', 'free testosterone', 'freies Testosteron', '遊離テストステロン'],
  ['total testosteron', 'total testosterone', 'Gesamttestosteron', '総テストステロン'],
  ['direnç egzersizi', 'resistance training', 'Krafttraining', '筋力トレーニング'],
  ['stres yönetimi', 'stress management', 'Stressbewältigung', 'ストレス管理'],
  ['dengeli beslenme', 'balanced nutrition', 'ausgewogene Ernährung', 'バランスの取れた食事'],
  ['uyku kalitesi', 'sleep quality', 'Schlafqualität', '睡眠の質'],
  ['gün ışığı', 'daylight', 'Tageslicht', '日光'],
  ['sirkadiyen ritmi', 'circadian rhythm', 'zirkadianer Rhythmus', '概日リズム'],
  ['sirkadiyen ritim', 'circadian rhythm', 'zirkadianer Rhythmus', '概日リズム'],
  ['tavuk göğsü', 'chicken breast', 'Hähnchenbrust', '鶏むね肉'],
  ['kabak çekirdeği içi', 'shelled pumpkin seeds', 'geschälte Kürbiskerne', 'かぼちゃの種'],
  ['zeytinyağı', 'olive oil', 'Olivenöl', 'オリーブオイル'],
  ['süzme yoğurt', 'strained yogurt', 'griechischer Joghurt', '水切りヨーグルト'],
  ['yemek kaşığı', 'tablespoon', 'Esslöffel', '大さじ'],
  ['tatlı kaşığı', 'dessert spoon', 'Dessertlöffel', 'デザートスプーン'],
  ['çay kaşığı', 'teaspoon', 'Teelöffel', '小さじ'],
  ['su bardağı', 'cup', 'Tasse', 'カップ'],
  ['yumurta', 'egg', 'Ei', '卵'],
  ['yoğurt', 'yogurt', 'Joghurt', 'ヨーグルト'],
  ['yulaf ezmesi', 'rolled oats', 'Haferflocken', 'オートミール'],
  ['karabiber', 'black pepper', 'schwarzer Pfeffer', '黒こしょう'],
  ['kırmızı biber', 'red pepper', 'rote Paprika', '赤ピーマン'],
  ['tuz', 'salt', 'Salz', '塩']
];

const WORDS = [
  ['uyku', 'sleep', 'Schlaf', '睡眠'],
  ['uykusuzluk', 'insomnia', 'Schlaflosigkeit', '不眠'],
  ['testosteron', 'testosterone', 'Testosteron', 'テストステロン'],
  ['testosteronu', 'testosterone', 'Testosteron', 'テストステロン'],
  ['hormon', 'hormone', 'Hormon', 'ホルモン'],
  ['hormonu', 'hormone', 'Hormon', 'ホルモン'],
  ['kortizol', 'cortisol', 'Cortisol', 'コルチゾール'],
  ['melatonin', 'melatonin', 'Melatonin', 'メラトニン'],
  ['egzersiz', 'exercise', 'Training', '運動'],
  ['antrenman', 'training', 'Training', 'トレーニング'],
  ['beslenme', 'nutrition', 'Ernährung', '栄養'],
  ['protein', 'protein', 'Protein', 'たんぱく質'],
  ['araştırma', 'study', 'Studie', '研究'],
  ['araştırmalar', 'studies', 'Studien', '研究'],
  ['uzmanlar', 'experts', 'Fachleute', '専門家'],
  ['erkeklerde', 'in men', 'bei Männern', '男性では'],
  ['erkek', 'man', 'Mann', '男性'],
  ['sağlık', 'health', 'Gesundheit', '健康'],
  ['sağlığı', 'health', 'Gesundheit', '健康'],
  ['dengesi', 'balance', 'Gleichgewicht', 'バランス'],
  ['dengesini', 'balance', 'Gleichgewicht', 'バランス'],
  ['destekliyor', 'supports', 'unterstützt', '支えます'],
  ['destekler', 'supports', 'unterstützt', '支えます'],
  ['önerilir', 'is recommended', 'wird empfohlen', '推奨されます'],
  ['belirtiyor', 'notes', 'weist darauf hin', '指摘しています'],
  ['vurguluyor', 'emphasizes', 'betont', '強調しています'],
  ['ortaya', 'forth', 'hervor', '明らかに'],
  ['koyuyor', 'shows', 'zeigt', '示しています'],
  ['düzenli', 'regular', 'regelmäßig', '規則的な'],
  ['doğal', 'natural', 'natürlich', '自然な'],
  ['sabah', 'morning', 'morgens', '朝'],
  ['geceleri', 'at night', 'nachts', '夜に'],
  ['gece', 'night', 'Nacht', '夜'],
  ['saat', 'hours', 'Stunden', '時間'],
  ['dakika', 'minutes', 'Minuten', '分'],
  ['yetişkin', 'adult', 'erwachsen', '成人の'],
  ['düzeylerinin', 'levels', 'Werte', '値'],
  ['düzeyleri', 'levels', 'Werte', '値'],
  ['düzeyi', 'level', 'Wert', '値'],
  ['artırır', 'increases', 'erhöht', '高めます'],
  ['azaltır', 'reduces', 'senkt', '下げます'],
  ['yükseltir', 'raises', 'erhöht', '上げます'],
  ['düşürür', 'lowers', 'senkt', '下げます'],
  ['önemli', 'important', 'wichtig', '重要'],
  ['önemlidir', 'is important', 'ist wichtig', '重要です'],
  ['bilimsel', 'scientific', 'wissenschaftlich', '科学的な'],
  ['klinik', 'clinical', 'klinisch', '臨床'],
  ['yeni', 'new', 'neu', '新しい'],
  ['son', 'recent', 'aktuell', '最新の'],
  ['yapılan', 'conducted', 'durchgeführt', '行われた'],
  ['göre', 'according to', 'zufolge', 'によると'],
  ['için', 'for', 'für', 'のために'],
  ['ile', 'with', 'mit', 'と'],
  ['veya', 'or', 'oder', 'または'],
  ['ve', 'and', 'und', 'と'],
  ['bir', 'a', 'ein', '1つの'],
  ['bu', 'this', 'dies', 'この'],
  ['daha', 'more', 'mehr', 'より'],
  ['çok', 'much', 'viel', '多く'],
  ['değil', 'not', 'nicht', 'ない'],
  ['gibi', 'like', 'wie', 'のように'],
  ['ancak', 'however', 'jedoch', 'しかし'],
  ['çünkü', 'because', 'weil', 'なぜなら'],
  ['sonra', 'after', 'danach', '後'],
  ['önce', 'before', 'vorher', '前'],
  ['nasıl', 'how', 'wie', 'どのように'],
  ['neden', 'why', 'warum', 'なぜ'],
  ['her', 'every', 'jeder', '毎'],
  ['gün', 'day', 'Tag', '日'],
  ['haftada', 'per week', 'pro Woche', '週に'],
  ['kas', 'muscle', 'Muskel', '筋肉'],
  ['stres', 'stress', 'Stress', 'ストレス'],
  ['vitamin', 'vitamin', 'Vitamin', 'ビタミン'],
  ['mineral', 'mineral', 'Mineral', 'ミネラル'],
  ['çinko', 'zinc', 'Zink', '亜鉛'],
  ['magnezyum', 'magnesium', 'Magnesium', 'マグネシウム'],
  ['omega', 'omega', 'Omega', 'オメガ'],
  ['kalori', 'calories', 'Kalorien', 'カロリー'],
  ['diyet', 'diet', 'Ernährung', '食事'],
  ['yemek', 'meal', 'Mahlzeit', '食事'],
  ['tarif', 'recipe', 'Rezept', 'レシピ'],
  ['hekim', 'physician', 'Arzt', '医師'],
  ['doktor', 'doctor', 'Arzt', '医師'],
  ['tedavi', 'treatment', 'Behandlung', '治療'],
  ['teşhis', 'diagnosis', 'Diagnose', '診断'],
  ['bilgilendirme', 'information', 'Information', '情報'],
  ['amaçlıdır', 'is intended', 'dient', '目的です'],
  ['yerine', 'instead of', 'anstelle', '代わり'],
  ['geçmez', 'does not replace', 'ersetzt nicht', '代わりにはなりません'],
  ['kaynak', 'source', 'Quelle', '出典'],
  ['malzemeler', 'ingredients', 'Zutaten', '材料'],
  ['malzeme', 'ingredient', 'Zutat', '材料'],
  ['hazırlanışı', 'preparation', 'Zubereitung', '作り方'],
  ['karıştırın', 'mix', 'mischen', '混ぜます'],
  ['ekleyin', 'add', 'hinzufügen', '加えます'],
  ['pişirin', 'cook', 'kochen', '調理します'],
  ['fırında', 'in the oven', 'im Ofen', 'オーブンで'],
  ['dakika', 'minutes', 'Minuten', '分'],
  ['gram', 'grams', 'Gramm', 'グラム'],
  ['adet', 'pieces', 'Stück', '個'],
  ['tavuk', 'chicken', 'Hähnchen', '鶏肉'],
  ['balık', 'fish', 'Fisch', '魚'],
  ['somon', 'salmon', 'Lachs', 'サーモン'],
  ['yulaf', 'oats', 'Hafer', 'オーツ麦'],
  ['pirinç', 'rice', 'Reis', '米'],
  ['bulgur', 'bulgur', 'Bulgur', 'ブルグル'],
  ['mercimek', 'lentils', 'Linsen', 'レンズ豆'],
  ['nohut', 'chickpeas', 'Kichererbsen', 'ひよこ豆'],
  ['ıspanak', 'spinach', 'Spinat', 'ほうれん草'],
  ['domates', 'tomato', 'Tomate', 'トマト'],
  ['soğan', 'onion', 'Zwiebel', '玉ねぎ'],
  ['sarımsak', 'garlic', 'Knoblauch', 'にんにく'],
  ['süt', 'milk', 'Milch', '牛乳'],
  ['peynir', 'cheese', 'Käse', 'チーズ'],
  ['zencefil', 'ginger', 'Ingwer', '生姜'],
  ['bal', 'honey', 'Honig', 'はちみつ'],
  ['muz', 'banana', 'Banane', 'バナナ'],
  ['not', 'note', 'Hinweis', '注']
];

const phraseIndex = PHRASES
  .map(row => ({ key: normKey(row[0]), en: row[1], de: row[2], ja: row[3], raw: row[0] }))
  .sort((a, b) => b.key.length - a.key.length);

const wordIndex = WORDS
  .map(row => ({ key: normKey(row[0]), en: row[1], de: row[2], ja: row[3] }))
  .sort((a, b) => b.key.length - a.key.length);

function normKey(value) {
  return String(value ?? '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

export function normalizeForCompare(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(normalizeForCompare(value).split(' ').filter(token => token.length > 1));
}

export function textSimilarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  if (normalizeForCompare(a) === normalizeForCompare(b)) return 1;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / new Set([...left, ...right]).size;
}

function stripUncheckedLines(value) {
  return String(value ?? '')
    .replace(/^(Kaynak|Source|Quelle|出典)[:：].*$/gim, '')
    .replace(/https?:\/\/\S+/g, ' ');
}

function japaneseEnough(text) {
  const kana = (text.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
  const latin = (text.match(/\p{Script=Latin}/gu) || []).length;
  if (kana < 2) return false;
  if (text.length > 40 && kana < 8) return false;
  // Birkaç Japonca kelime serpiştirilmiş Türkçe/Latin metin çeviri sayılmaz.
  if (latin > 12 && latin > kana) return false;
  if ((text.match(TR_HARD) || []).length) return false;
  if (turkishFunctionRatio(text) > 0.08) return false;
  return true;
}

function turkishFunctionRatio(value) {
  const words = normalizeForCompare(value).split(' ').filter(Boolean);
  if (!words.length) return 0;
  let hits = 0;
  for (const word of words) if (TR_FUNCTION.has(word)) hits += 1;
  return hits / words.length;
}

const LANGUAGE_MARKERS = {
  en: new Set(['the', 'and', 'with', 'for', 'from', 'that', 'this', 'these', 'those', 'into', 'are', 'is', 'was', 'were', 'of', 'in', 'on', 'not', 'your', 'can', 'should']),
  de: new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'und', 'mit', 'für', 'von', 'aus', 'dass', 'dies', 'diese', 'sind', 'ist', 'war', 'werden', 'nicht', 'ein', 'eine', 'einer', 'im', 'auf', 'kann', 'sollte'])
};

function languageMarkerScore(value, lang) {
  const markers = LANGUAGE_MARKERS[lang];
  if (!markers) return 0;
  return normalizeForCompare(value).split(' ').filter(word => markers.has(word)).length;
}

/** İngilizce ile Almancanın birbirine karıştığı bariz çıktıları reddeder. */
export function targetLanguageLooksCorrect(value, lang) {
  const text = stripUncheckedLines(String(value || '')).trim();
  if (!text) return false;
  if (lang === 'ja') return japaneseEnough(text);
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(text)) return false;
  if (!LANGUAGE_MARKERS[lang] || text.length < 45) return true;
  const targetScore = languageMarkerScore(text, lang);
  const otherLang = lang === 'en' ? 'de' : 'en';
  const otherScore = languageMarkerScore(text, otherLang);
  return !(otherScore >= 3 && otherScore > targetScore * 1.5);
}

/**
 * Hedef dil alanı gerçekten çevrilmiş mi?
 * Kaynakla aynı, ağırlıklı olarak Türkçe veya (Japonca için) Latin kopya ise false.
 */
export function fieldLooksTranslated(translated, sourceField, lang) {
  const value = String(translated ?? '').trim();
  const source = String(sourceField ?? '').trim();
  if (value.length < 2) return false;
  const checked = stripUncheckedLines(value);
  const checkedSource = stripUncheckedLines(source);
  if (checkedSource && normalizeForCompare(checked) === normalizeForCompare(checkedSource)) return false;
  if (checkedSource.length > 12 && textSimilarity(checked, checkedSource) > 0.72) return false;
  if (lang === 'ja') return japaneseEnough(checked);
  const hard = checked.match(TR_HARD) || [];
  if (hard.length && checked.length < 500) return false;
  if (hard.length > checked.length * 0.008) return false;
  if (turkishFunctionRatio(checked) > 0.12) return false;
  if (!targetLanguageLooksCorrect(checked, lang)) return false;
  return true;
}

function recipeIngredientLooksTranslated(translated, source, lang) {
  if (!fieldLooksTranslated(translated, source, lang)) return false;
  const words = normalizeForCompare(translated).split(' ').filter(Boolean);
  return !words.some(word => UNTRANSLATED_RECIPE_TERMS.has(word));
}

export function extractProtectedFacts(value) {
  const text = String(value || '');
  const urlPattern = /https?:\/\/[^\s)\]"']+/gi;
  const urls = (text.match(urlPattern) || [])
    .map(url => url.replace(/[.,;:!?。，、；：！？]+$/u, ''));
  const withoutUrls = text.replace(urlPattern, ' ');
  // Ölçü biriminin adı hedef dilde değişebilir; sayısal değerin kendisi korunur.
  const numbers = withoutUrls.match(/\d+(?:[.,]\d+)?/g) || [];
  return [...urls, ...numbers].map(token => token.toLowerCase().replace(/,/g, '.').replace(/\s+/g, ''));
}

function factsPreserved(sourceValue, translatedValue) {
  const sourceFacts = extractProtectedFacts(sourceValue);
  const translatedFacts = extractProtectedFacts(translatedValue);
  if (sourceFacts.length !== translatedFacts.length) return false;
  const remaining = [...translatedFacts];
  for (const fact of sourceFacts) {
    const index = remaining.indexOf(fact);
    if (index < 0) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

function structureStats(value) {
  const text = String(value || '').trim();
  return {
    paragraphs: text ? text.split(/\n{2,}/).filter(part => part.trim()).length : 0,
    listItems: (text.match(/^\s*(?:\d+[.)]|[-•*])\s+/gm) || []).length,
    sectionLabels: (text.match(/^.{2,80}[:：]\s*$/gm) || []).length
  };
}

function structurePreserved(sourceValue, translatedValue) {
  const sourceStats = structureStats(sourceValue);
  const targetStats = structureStats(translatedValue);
  if (sourceStats.paragraphs > 1 && targetStats.paragraphs !== sourceStats.paragraphs) return false;
  if (sourceStats.listItems && targetStats.listItems !== sourceStats.listItems) return false;
  if (sourceStats.sectionLabels && targetStats.sectionLabels < sourceStats.sectionLabels) return false;
  return true;
}

/**
 * Bir çevirinin yalnızca dolu olmasını değil; dil, yapı, sayı/birim ve tarif
 * bütünlüğünü de denetler. Yönetim paneli bu sonucu kalite kartlarında gösterir.
 */
export function assessTranslationQuality(translation, source, lang) {
  const current = translation || {};
  const issues = [];
  let score = 0;
  const fieldChecks = {};

  for (const [field, points] of [['title', 16], ['summary', 16], ['body', 30]]) {
    const ok = fieldLooksTranslated(current[field], source?.[field], lang);
    fieldChecks[field] = ok;
    if (ok) score += points;
    else issues.push(`${field} eksik, kopya veya hedef dilde değil`);
  }

  const languageOk = ['title', 'summary', 'body'].every(field =>
    targetLanguageLooksCorrect(current[field], lang)
  );
  if (languageOk) score += 8;
  else issues.push('hedef dil tutarlılığı başarısız');

  const combinedSource = `${source?.title || ''}\n${source?.summary || ''}\n${source?.body || ''}`;
  const combinedTarget = `${current.title || ''}\n${current.summary || ''}\n${current.body || ''}`;
  const factsOk = factsPreserved(combinedSource, combinedTarget);
  if (factsOk) score += 8;
  else issues.push('sayı, birim veya bağlantılardan biri korunmamış');

  const structureOk = structurePreserved(source?.body, current.body);
  if (structureOk) score += 7;
  else issues.push('paragraf, başlık veya liste yapısı korunmamış');

  const categoryOk = !String(source?.category || '').trim() || Boolean(String(current.category || '').trim());
  const timeOk = !String(source?.time || '').trim() || (
    Boolean(String(current.time || '').trim())
    && !/\bdk\b|dakika/i.test(String(current.time || ''))
  );
  const metadataOk = categoryOk && timeOk;
  if (metadataOk) score += 5;
  else issues.push('kategori veya süre yerelleştirilmemiş');

  const sourceIngredients = Array.isArray(source?.ingredients) ? source.ingredients : [];
  let ingredientsOk = true;
  if (sourceIngredients.length) {
    ingredientsOk = Array.isArray(current.ingredients)
      && current.ingredients.length === sourceIngredients.length
      && sourceIngredients.every((ingredient, index) =>
        recipeIngredientLooksTranslated(current.ingredients[index], ingredient, lang)
        && factsPreserved(ingredient, current.ingredients[index])
      );
    if (ingredientsOk) score += 10;
    else issues.push('malzeme adı, miktarı veya sırası eksik');
  } else {
    score += 10;
  }

  const complete = fieldChecks.title && fieldChecks.summary && fieldChecks.body
    && languageOk && factsOk && structureOk && metadataOk && ingredientsOk;

  return {
    complete: Boolean(complete),
    score: Math.max(0, Math.min(100, score)),
    issues,
    checks: {
      fields: fieldChecks,
      language: languageOk,
      facts: factsOk,
      structure: structureOk,
      metadata: metadataOk,
      ingredients: ingredientsOk
    }
  };
}

export function isTranslationComplete(translation, source, lang) {
  if (!translation || !TARGET_LANGS.includes(lang)) return false;
  return assessTranslationQuality(translation, source, lang).complete;
}

function categoryFor(sourceCategory, lang) {
  const known = KNOWN_CATEGORIES[String(sourceCategory || '').trim()];
  return known?.[lang] || '';
}

function repairTime(time, sourceTime, lang) {
  const value = String(time || '').trim();
  if (!value || /dakika|\bdk\b/i.test(value)) return localizeDuration(sourceTime || value, lang);
  return value;
}

export function repairTranslation(translation, source, lang) {
  const current = translation || {};
  const sourceIngredients = Array.isArray(source?.ingredients) ? source.ingredients : [];
  const ingredients = sourceIngredients.length && Array.isArray(current.ingredients)
    ? current.ingredients.map(value => clean(value, 200)).filter(Boolean).slice(0, 100)
    : [];
  return {
    category: categoryFor(source.category, lang) || clean(current.category, 60) || localTranslateText(source.category || '', lang),
    title: clean(current.title, 100),
    summary: clean(current.summary, 240),
    body: clean(current.body, 20000),
    time: repairTime(current.time, source.time, lang),
    ingredients
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function protectTokens(text) {
  const tokens = [];
  const masked = String(text).replace(/https?:\/\/[^\s)]+/g, match => {
    const mark = `\u0000${tokens.length}\u0000`;
    tokens.push(match);
    return mark;
  });
  return { masked, tokens };
}

function restoreTokens(text, tokens) {
  return tokens.reduce((out, token, index) => out.replace(`\u0000${index}\u0000`, token), text);
}

function replaceInsensitive(text, source, target) {
  if (!source || !target) return text;
  const lower = text.toLocaleLowerCase('tr');
  const needle = source.toLocaleLowerCase('tr');
  if (!needle || !lower.includes(needle)) return text;
  let out = '';
  let cursor = 0;
  while (cursor < text.length) {
    const index = lower.indexOf(needle, cursor);
    if (index < 0) {
      out += text.slice(cursor);
      break;
    }
    const before = index > 0 ? lower[index - 1] : '';
    const after = lower[index + needle.length] || '';
    const leftOk = !before || !/[\p{L}\p{N}]/u.test(before);
    const rightOk = !after || !/[\p{L}\p{N}]/u.test(after);
    if (leftOk && rightOk) {
      out += text.slice(cursor, index) + target;
      cursor = index + needle.length;
    } else {
      out += text.slice(cursor, index + 1);
      cursor = index + 1;
    }
  }
  return out;
}

function translateSourceLine(line, lang) {
  const match = String(line).match(/^Kaynak\s*[:：]\s*(.*)$/i);
  if (!match) return '';
  const label = lang === 'de' ? 'Quelle' : lang === 'ja' ? '出典' : 'Source';
  return `${label}: ${match[1]}`;
}

/** Tek satır veya paragrafı yerel sözlükle çevirir. Birebir kayıt varsa onu kullanır. */
export function localTranslateText(text, lang) {
  const raw = String(text ?? '');
  if (!raw.trim() || !TARGET_LANGS.includes(lang)) return raw.trim();
  const lines = raw.split('\n');
  return lines.map(line => {
    const prefix = line.match(/^(\s*\d+\.\s+)(.*)$/);
    const core = prefix ? prefix[2] : line;
    const lead = prefix ? prefix[1] : '';
    const trimmed = core.trim();
    if (!trimmed) return line;
    const sourceLine = translateSourceLine(trimmed, lang);
    if (sourceLine) return lead + sourceLine;
    const exact = phraseIndex.find(row => row.key === normKey(trimmed));
    if (exact?.[lang]) return lead + exact[lang];
    const { masked, tokens } = protectTokens(trimmed);
    let out = masked;
    for (const row of phraseIndex) {
      if (row.key.length < 8 || !row[lang]) continue;
      out = replaceInsensitive(out, row.raw, row[lang]);
    }
    for (const row of wordIndex) {
      if (!row[lang]) continue;
      out = replaceInsensitive(out, row.key, row[lang]);
    }
    return lead + restoreTokens(out, tokens);
  }).join('\n').replace(/[ ]{2,}/g, ' ').trim();
}

export function localTranslateFields(source, lang) {
  return repairTranslation({
    category: categoryFor(source.category, lang) || localTranslateText(source.category, lang),
    title: localTranslateText(source.title, lang),
    summary: localTranslateText(source.summary, lang),
    body: localTranslateText(source.body, lang),
    time: source.time,
    ingredients: (Array.isArray(source.ingredients) ? source.ingredients : []).map(value => localTranslateText(value, lang))
  }, source, lang);
}

export function networkTranslationAllowed(options = {}, env = process.env) {
  if (options.networkTranslate === false) return false;
  if (options.networkTranslate === true) return true;
  if (env.ENABLE_MACHINE_TRANSLATION === '0') return false;
  if (String(env.NODE_TEST_CONTEXT || '').startsWith('child')) return false;
  return true;
}

function decodeBasicEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

export function splitChunks(text, max = 450) {
  const chunks = [];
  const pushLong = (value, joiner) => {
    const sentences = String(value).split(/(?<=[.!?。！？])\s+/).filter(Boolean);
    let buf = '';
    const flush = () => {
      if (buf.trim()) chunks.push(buf.trim());
      buf = '';
    };
    if (!sentences.length) {
      for (let i = 0; i < value.length; i += max) chunks.push(value.slice(i, i + max));
      return;
    }
    for (const sentence of sentences) {
      if (sentence.length > max) {
        flush();
        for (let i = 0; i < sentence.length; i += max) chunks.push(sentence.slice(i, i + max));
        continue;
      }
      const next = buf ? `${buf}${joiner}${sentence}` : sentence;
      if (next.length > max && buf) {
        flush();
        buf = sentence;
      } else buf = next;
    }
    flush();
  };
  for (const paragraph of String(text ?? '').split(/\n{2,}/)) {
    if (!paragraph.trim()) continue;
    if (paragraph.length <= max) {
      chunks.push(paragraph.trim());
      continue;
    }
    if (paragraph.includes('\n')) {
      for (const line of paragraph.split('\n')) {
        if (!line.trim()) continue;
        if (line.length <= max) chunks.push(line.trim());
        else pushLong(line, ' ');
      }
      continue;
    }
    pushLong(paragraph, ' ');
  }
  return chunks.length ? chunks : [String(text ?? '').trim()].filter(Boolean);
}

function parseGooglePayload(data) {
  if (!Array.isArray(data?.[0])) return '';
  return data[0].map(row => (Array.isArray(row) ? row[0] : '')).join('').trim();
}

function parseMyMemoryPayload(data) {
  const text = decodeBasicEntities(data?.responseData?.translatedText || '').trim();
  if (!text || /MYMEMORY WARNING|QUERY LENGTH|INVALID LANGUAGE|EXAMPLE REQUEST/i.test(text)) return '';
  return text;
}

async function readJson(response) {
  if (!response) return null;
  try {
    return typeof response.json === 'function' ? await response.json() : null;
  } catch {
    return null;
  }
}

async function googleTranslateChunk(text, lang, fetchImpl, signal) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; TestoTavanBot/1.0)' },
    signal
  });
  if (!response?.ok) return '';
  const translated = parseGooglePayload(await readJson(response));
  if (!translated || normalizeForCompare(translated) === normalizeForCompare(text)) return '';
  return translated;
}

async function myMemoryTranslateChunk(text, lang, fetchImpl, signal) {
  const pair = `tr|${lang}`;
  const url = `https://api.mymemory.translated.net/get?langpair=${pair}&q=${encodeURIComponent(text)}`;
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; TestoTavanBot/1.0)' },
    signal
  });
  if (!response?.ok) return '';
  const translated = parseMyMemoryPayload(await readJson(response));
  if (!translated || normalizeForCompare(translated) === normalizeForCompare(text)) return '';
  return translated;
}

async function translateChunk(text, lang, fetchImpl, signal) {
  try {
    const google = await googleTranslateChunk(text, lang, fetchImpl, signal);
    if (google) return google;
  } catch {
    // Google uç noktası yanıt vermezse MyMemory denenir.
  }
  if (text.length > 420) {
    const parts = splitChunks(text, 350);
    const out = [];
    for (const part of parts) {
      try {
        const piece = await myMemoryTranslateChunk(part, lang, fetchImpl, signal);
        if (!piece) return '';
        out.push(piece);
      } catch {
        return '';
      }
    }
    return out.join(' ');
  }
  try {
    return await myMemoryTranslateChunk(text, lang, fetchImpl, signal);
  } catch {
    return '';
  }
}

/**
 * Paragraf ve satır yapısını koruyarak düz metni çevirir.
 * Bir parça başarısız olursa karışık dil dönmemek için null verir.
 */
export async function machineTranslateText(text, lang, options = {}) {
  const source = String(text ?? '').trim();
  if (!source) return '';
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.chunkTimeoutMs ?? 8000;
  const units = [];
  for (const paragraph of source.split(/\n{2,}/)) {
    if (!paragraph.trim()) continue;
    const lines = paragraph.split('\n');
    const translatedLines = [];
    for (const line of lines) {
      if (!line.trim()) {
        translatedLines.push('');
        continue;
      }
      const pieces = line.length > 1400 ? splitChunks(line, 700) : [line.trim()];
      const done = [];
      for (const piece of pieces) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const translated = await translateChunk(piece, lang, fetchImpl, controller.signal);
        clearTimeout(timer);
        if (!translated) return null;
        done.push(translated);
      }
      translatedLines.push(done.join(' '));
    }
    units.push(translatedLines.join('\n'));
  }
  return units.join('\n\n');
}

export async function machineTranslateFields(source, lang, options = {}) {
  const title = await machineTranslateText(source.title, lang, options);
  const summary = await machineTranslateText(source.summary, lang, options);
  const body = await machineTranslateText(source.body, lang, options);
  const sourceIngredients = Array.isArray(source.ingredients) ? source.ingredients : [];
  const ingredientBlock = sourceIngredients.length
    ? await machineTranslateText(sourceIngredients.join('\n'), lang, options)
    : '';
  const ingredients = sourceIngredients.length ? String(ingredientBlock || '').split('\n').map(value => value.trim()) : [];
  if (!title || !summary || !body || (sourceIngredients.length && (ingredients.length !== sourceIngredients.length || ingredients.some(value => !value)))) return null;
  return repairTranslation({
    category: categoryFor(source.category, lang),
    title,
    summary,
    body,
    time: source.time,
    ingredients
  }, source, lang);
}

const LANG_ALIASES = {
  en: ['en', 'english', 'ingilizce'],
  de: ['de', 'ger', 'deu', 'german', 'deutsch', 'almanca'],
  ja: ['ja', 'jp', 'japanese', 'japonca', '日本語']
};

export function pickLanguageBlock(bag, lang) {
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return null;
  const aliases = LANG_ALIASES[lang] || [lang];
  for (const [key, value] of Object.entries(bag)) {
    if (aliases.includes(String(key).trim().toLowerCase()) && value && typeof value === 'object') return value;
  }
  return null;
}

export function coerceTranslatedFields(block) {
  if (!block || typeof block !== 'object') return null;
  return {
    title: block.title || block.headline || block.baslik || '',
    summary: block.summary || block.description || block.ozet || '',
    body: block.body || block.content || block.text || block.icerik || block.article || '',
    category: block.category || block.kategori || '',
    time: block.time || block.reading_time || block.readingTime || '',
    ingredients: Array.isArray(block.ingredients) ? block.ingredients : (Array.isArray(block.malzemeler) ? block.malzemeler : [])
  };
}

export function translationSystemPrompt(langs, context = {}) {
  const names = { en: 'English', de: 'German', ja: 'Japanese' };
  const targetNames = langs.map(lang => names[lang]).join(', ');
  const retryIssues = Array.isArray(context.issues) && context.issues.length
    ? `\nPREVIOUS OUTPUT FAILED QUALITY CHECKS: ${context.issues.join('; ')}. Correct every listed problem.`
    : '';
  return [
    'TASK: full-translation',
    'You are a senior medical-content translator and localization QA editor for TestoTavan.',
    `Translate the complete Turkish source into ${targetNames}.`,
    'Return only valid JSON. No markdown, comments or extra keys.',
    'NON-NEGOTIABLE RULES:',
    '- Translate EVERY sentence. Never summarize, shorten, omit, merge or add medical claims.',
    '- Preserve the exact paragraph count, paragraph order, section headings, numbered lists and bullet count.',
    '- Preserve every number, decimal, percentage, URL, proper noun and scientific unit such as ng/dL, g/kg, REM and SHBG.',
    '- Translate title, summary, body, category, duration and EVERY ingredient. Ingredient count and order must exactly match the source; quantities must not change.',
    '- Do not leave Turkish words or sentences, except an untranslatable registered proper name. Never mix target languages.',
    '- English must read as native editorial English; German as native editorial German; Japanese as natural Japanese script, never romaji.',
    '- Keep title within 100 characters and summary within 240 characters without losing facts; body must stay within 20,000 characters.',
    '- Keep the meaning and medical caution level exact. Do not strengthen evidence, invent benefits, diagnoses, dosages or treatment advice.',
    '- category must be exactly: en "Hormone Health" | "High Protein" | "Sleep"; de "Hormongesundheit" | "Proteinreich" | "Schlaf"; ja "ホルモン健康" | "高たんぱく" | "睡眠".',
    '- Before answering, silently verify sentence coverage, numbers, paragraph/list structure and ingredient count.',
    langs.length === 1
      ? '{"title":"...","summary":"...","body":"...","category":"...","time":"...","ingredients":["..."]}'
      : '{"en":{"title":"...","summary":"...","body":"...","category":"...","time":"...","ingredients":["..."]},"de":{...},"ja":{...}}',
    retryIssues
  ].filter(Boolean).join('\n');
}

export function translationUserPrompt(source, langs, context = {}) {
  const payload = {
    category: source.category || '',
    title: source.title || '',
    summary: source.summary || '',
    body: source.body || '',
    time: source.time || '',
    ingredients: Array.isArray(source.ingredients) ? source.ingredients : []
  };
  const previous = context.previous
    ? `\n\nREJECTED_PREVIOUS_TRANSLATION_JSON (repair it; do not copy its errors):\n${JSON.stringify(context.previous)}`
    : '';
  return [
    `TARGET_LANGUAGE_CODES: ${langs.join(', ')}`,
    'SOURCE_LANGUAGE: tr',
    `SOURCE_JSON:
${JSON.stringify(payload)}`,
    'Translate only the SOURCE_JSON values. Preserve its structure and return the requested JSON shape.',
    previous
  ].filter(Boolean).join('\n\n');
}

/**
 * Eksik veya kopya çevirileri tamamlar. Her hedef dil bağımsız AI çağrısında
 * üretilir; başarısız kalite kontrolü sorun listesiyle ikinci kez düzeltilir.
 * options.requestAi(systemPrompt, userPrompt) → { ok, data } bekler.
 */
export async function ensureCompleteTranslations(item, options = {}) {
  const source = {
    category: item?.category || '',
    title: item?.title || '',
    summary: item?.summary || '',
    body: item?.body || '',
    time: item?.time || '',
    ingredients: Array.isArray(item?.ingredients) ? item.ingredients : []
  };
  const translations = {};
  const report = {};
  const quality = {};
  const attempts = { en: 0, de: 0, ja: 0 };
  const forceTranslation = options.forceTranslation === true;

  for (const lang of TARGET_LANGS) {
    const repaired = repairTranslation(item?.translations?.[lang], source, lang);
    const assessment = assessTranslationQuality(repaired, source, lang);
    translations[lang] = repaired;
    quality[lang] = assessment;
    report[lang] = !forceTranslation && assessment.complete ? 'ready' : 'pending';
  }

  const pending = () => TARGET_LANGS.filter(lang => report[lang] === 'pending');
  const requestAi = options.requestAi;
  const maxAiAttempts = options.allowPerLanguageRetry === false
    ? 1
    : Math.max(1, Math.min(3, Number(options.aiTranslationAttempts) || 2));

  if (requestAi && pending().length) {
    await Promise.all(pending().map(async lang => {
      let previous = translations[lang];
      let best = quality[lang];
      for (let attempt = 1; attempt <= maxAiAttempts; attempt += 1) {
        attempts[lang] = attempt;
        const context = attempt > 1 ? { issues: best.issues, previous } : {};
        try {
          const response = await requestAi(
            translationSystemPrompt([lang], context),
            translationUserPrompt(source, [lang], context)
          );
          const rawBlock = response?.ok
            ? pickLanguageBlock(response.data, lang) || response.data
            : null;
          const block = coerceTranslatedFields(rawBlock);
          if (!block) continue;
          const candidate = repairTranslation(block, source, lang);
          const assessment = assessTranslationQuality(candidate, source, lang);
          if (assessment.score >= best.score) {
            translations[lang] = candidate;
            quality[lang] = assessment;
            previous = candidate;
            best = assessment;
          }
          if (assessment.complete) {
            translations[lang] = candidate;
            quality[lang] = assessment;
            report[lang] = 'ai';
            break;
          }
        } catch (error) {
          console.warn(`[translate] ${lang} AI pass ${attempt} failed:`, error?.message || error);
        }
      }
    }));
  }

  if (pending().length && networkTranslationAllowed(options, options.env || process.env)) {
    await Promise.all(pending().map(async lang => {
      try {
        const mt = await machineTranslateFields(source, lang, options);
        const candidate = mt ? repairTranslation(mt, source, lang) : null;
        const assessment = candidate ? assessTranslationQuality(candidate, source, lang) : null;
        if (assessment?.complete) {
          translations[lang] = candidate;
          quality[lang] = assessment;
          report[lang] = 'mt';
        } else if (assessment && assessment.score > quality[lang].score) {
          translations[lang] = candidate;
          quality[lang] = assessment;
        }
      } catch (error) {
        console.warn(`[translate] ${lang} machine pass failed:`, error?.message || error);
      }
    }));
  }

  for (const lang of pending()) {
    // Zorunlu yenileme çağrısı başarısız olduysa mevcut ve kalite kontrolünü
    // geçen çeviriyi silmeyiz; kullanıcıya bozuk/boş alan döndürmekten kaçınırız.
    if (quality[lang].complete) {
      report[lang] = 'ready';
      continue;
    }
    const local = localTranslateFields(source, lang);
    const assessment = assessTranslationQuality(local, source, lang);
    if (assessment.complete) {
      translations[lang] = local;
      quality[lang] = assessment;
      report[lang] = 'local';
      continue;
    }
    if (assessment.score > quality[lang].score) {
      translations[lang] = local;
      quality[lang] = assessment;
    }
    const candidate = translations[lang];
    const sourceIngredients = Array.isArray(source.ingredients) ? source.ingredients : [];
    const safeCandidate = {
      ...candidate,
      title: fieldLooksTranslated(candidate.title, source.title, lang) ? candidate.title : '',
      summary: fieldLooksTranslated(candidate.summary, source.summary, lang) ? candidate.summary : '',
      body: fieldLooksTranslated(candidate.body, source.body, lang) ? candidate.body : '',
      ingredients: sourceIngredients.length && sourceIngredients.every((ingredient, index) =>
        recipeIngredientLooksTranslated(candidate.ingredients?.[index], ingredient, lang)
        && factsPreserved(ingredient, candidate.ingredients?.[index])
      ) ? candidate.ingredients : []
    };
    translations[lang] = repairTranslation(safeCandidate, source, lang);
    quality[lang] = assessTranslationQuality(translations[lang], source, lang);
    report[lang] = 'incomplete';
  }

  for (const lang of TARGET_LANGS) {
    quality[lang] = {
      ...quality[lang],
      method: report[lang],
      attempts: attempts[lang]
    };
  }

  const incomplete = TARGET_LANGS.filter(lang => report[lang] === 'incomplete');
  const warning = incomplete.length
    ? `Şu diller kalite kontrolünü geçemedi: ${incomplete.map(lang => `${lang.toUpperCase()} (${quality[lang].issues.slice(0, 2).join(', ')})`).join('; ')}. Seçili AI ile yeniden çevirin.`
    : '';

  return {
    item: { ...item, translations },
    report,
    quality,
    warning
  };
}

export function preferTranslated(candidate, fallback, sourceField, lang) {
  if (candidate && fieldLooksTranslated(candidate, sourceField, lang)) return candidate;
  if (fallback && fieldLooksTranslated(fallback, sourceField, lang)) return fallback;
  return candidate || fallback || '';
}

export { escapeRegExp };
