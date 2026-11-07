/* Otomatik çeviri yalnızca tamamen boş hedef metinleri doldurur. */
(function (global) {
  'use strict';
  const languages = ['en', 'de', 'ja', 'fr', 'es', 'bg', 'ru', 'hi', 'zh'];
  async function translateMissing(item, fetchImpl, progress = () => {}) {
    const pending = languages.filter(lang => {
      const entry = item.translations?.[lang] || {};
      return !['title', 'summary', 'body'].some(key => String(entry[key] || '').trim());
    });
    const skipped = languages.filter(lang => {
      const entry = item.translations?.[lang] || {};
      const fields = ['title', 'summary', 'body'];
      return fields.some(key => String(entry[key] || '').trim()) && fields.some(key => !String(entry[key] || '').trim());
    });
    const translated = {}, failed = [];
    let index = 0, done = 0;
    const worker = async () => {
      while (index < pending.length) {
        const lang = pending[index++];
        try {
          const response = await fetchImpl('/api/ai-blog', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'machine-translate', lang, item: {
              type: item.type, category: item.category, title: item.title, summary: item.summary,
              body: item.body, time: item.time, ingredients: item.ingredients
            } })
          });
          const result = await response.json();
          if (!response.ok || !result.ok || result.lang !== lang || !result.translation || result.quality?.complete !== true) throw new Error('translation failed');
          const existing = item.translations?.[lang] || {};
          translated[lang] = {
            ...result.translation,
            category: String(existing.category || '').trim() || result.translation.category,
            time: String(existing.time || '').trim() || result.translation.time,
            ingredients: Array.isArray(existing.ingredients) && existing.ingredients.length ? existing.ingredients : result.translation.ingredients
          };
        } catch { failed.push(lang); }
        done++;
        progress(done, pending.length);
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker));
    return { translated, failed, skipped };
  }
  global.TestoAutoTranslate = { translateMissing };
})(typeof window !== 'undefined' ? window : globalThis);
