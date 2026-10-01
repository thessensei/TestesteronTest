/*
 * İçerik alanlarının ortak temizleme/şekillendirme yardımcıları.
 * Bağımlılığı yoktur; hem serverless fonksiyonlar hem Node testleri kullanır.
 */

export const LANGS = ['en', 'de', 'ja'];

export const clean = (value, max) => String(value ?? '').trim().slice(0, max);

export function cleanIngredients(value) {
  if (!Array.isArray(value)) return [];
  return value.map(x => clean(x, 200)).filter(Boolean).slice(0, 100);
}

/**
 * Çeviri bloklarını normalize eder.
 * Başlık/özet/içerik/kategoriye ek olarak süre ("5 dk" → "5 min") ve
 * malzeme listesi de dile göre saklanır.
 */
export function cleanTranslations(value) {
  const result = {};
  for (const lang of LANGS) {
    const item = value?.[lang] || {};
    result[lang] = {
      title: clean(item.title, 100),
      summary: clean(item.summary, 240),
      body: clean(item.body, 20000),
      category: clean(item.category, 60),
      time: clean(item.time, 30),
      ingredients: cleanIngredients(item.ingredients)
    };
  }
  return result;
}

/**
 * Türkçe süre metnini ("20 dk", "1,5 saat") hedef dile çevirir.
 * Admin panelinde boş bırakılan süre alanları için otomatik karşılık üretir.
 */
const DURATION_UNITS = {
  en: { min: 'min', hour: 'h', space: true },
  de: { min: 'Min.', hour: 'Std.', space: true },
  ja: { min: '分', hour: '時間', space: false }
};

export function localizeDuration(text, lang) {
  const source = clean(text, 30);
  if (!source || lang === 'tr' || !DURATION_UNITS[lang]) return source;

  const match = source.match(/^(\d+(?:[.,]\d+)?)\s*(dakika|dk|saat|sa)\.?$/i);
  if (!match) return source;

  const unitKey = /^(saat|sa)$/i.test(match[2]) ? 'hour' : 'min';
  const unit = DURATION_UNITS[lang];
  return unit.space ? `${match[1]} ${unit[unitKey]}` : `${match[1]}${unit[unitKey]}`;
}
