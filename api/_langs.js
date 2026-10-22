/*
 * Desteklenen diller — tek kaynak.
 *
 * Sunucu tarafındaki tüm dil listeleri (SEO, sitemap, RSS, blog sayfası, forum
 * sayfası, çeviri hattı, içerik şeması) buradan beslenir. İstemci tarafındaki
 * karşılığı `src/js/content.js` içindeki `SUPPORTED_LANGUAGES` listesidir;
 * `tests/languages.test.mjs` iki listenin aynı olduğunu doğrular.
 *
 * Yeni bir dil eklemek için:
 *   1. Buraya bir satır ekle.
 *   2. `src/js/content.js` içindeki listeye ve sözlüklere ekle.
 *   3. `forum/forum-core.js` sözlüğüne ekle.
 *   4. Çeviri hattı (`TARGET_LANGS`) otomatik genişler.
 */

export const LANGUAGES = [
  { code: 'tr', label: 'TR', name: 'Türkçe', locale: 'tr_TR', dir: 'ltr' },
  { code: 'en', label: 'EN', name: 'English', locale: 'en_US', dir: 'ltr' },
  { code: 'de', label: 'DE', name: 'Deutsch', locale: 'de_DE', dir: 'ltr' },
  { code: 'ja', label: 'JA', name: '日本語', locale: 'ja_JP', dir: 'ltr' },
  { code: 'fr', label: 'FR', name: 'Français', locale: 'fr_FR', dir: 'ltr' },
  { code: 'es', label: 'ES', name: 'Español', locale: 'es_ES', dir: 'ltr' },
  { code: 'bg', label: 'BG', name: 'Български', locale: 'bg_BG', dir: 'ltr' },
  { code: 'ru', label: 'RU', name: 'Русский', locale: 'ru_RU', dir: 'ltr' },
  { code: 'hi', label: 'HI', name: 'हिन्दी', locale: 'hi_IN', dir: 'ltr' },
  { code: 'zh', label: 'ZH', name: '中文', locale: 'zh_CN', dir: 'ltr' }
];

/** Kaynak dil. */
export const SOURCE_LANG = 'tr';

/** Tüm dil kodları: ['tr','en',...,'zh'] */
export const LANGS = LANGUAGES.map(language => language.code);

/** Çeviri hedefleri: kaynak dil dışındaki 9 dil. */
export const TARGET_LANGS = LANGS.filter(code => code !== SOURCE_LANG);

/** { tr: 'TR', en: 'EN', … } — hreflang ve dil çipleri için. */
export const LANG_LABELS = Object.fromEntries(LANGUAGES.map(language => [language.code, language.label]));

/** { tr: 'Türkçe', … } — insan okunur adlar. */
export const LANG_NAMES = Object.fromEntries(LANGUAGES.map(language => [language.code, language.name]));

/** { tr: 'tr_TR', … } — og:locale ve <html lang> eşlemesi. */
export const LANG_LOCALES = Object.fromEntries(LANGUAGES.map(language => [language.code, language.locale]));

/**
 * Yerel (sözlük tabanlı) çeviri desteği olan diller.
 * Diğer diller AI/makine çevirisi olmadan **İngilizceye** düşer; asla Türkçe
 * metin göstermez.
 */
export const LOCAL_DICTIONARY_LANGS = ['en', 'de', 'ja'];

/** Bir dil kodunu doğrular; tanınmıyorsa kaynak dili döndürür. */
export function normalizeLang(value) {
  const code = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
  return LANGS.includes(code) ? code : SOURCE_LANG;
}

/** Blog/forum sayfalarında o dil için içerik gerçekten var mı? */
export function isTranslatedLang(code) {
  return TARGET_LANGS.includes(code);
}
