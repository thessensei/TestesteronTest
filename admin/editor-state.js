/* Oturumluk taslak biçimi: yalnızca yayın alanları; parola/AI anahtarı içermez. */
(function (global) {
  'use strict';
  const languages = ['en', 'de', 'ja', 'fr', 'es', 'bg', 'ru', 'hi', 'zh'];
  const limits = { title: 100, summary: 240, body: 20000, category: 60, time: 30 };
  function fields(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Taslak alanları geçersiz.');
    const result = {};
    for (const [key, max] of Object.entries(limits)) {
      const text = value[key] ?? '';
      if (typeof text !== 'string' || text.length > max) throw new Error(`${key}: en fazla ${max} karakter kullanılabilir.`);
      result[key] = text;
    }
    const ingredients = value.ingredients ?? [];
    if (!Array.isArray(ingredients) || ingredients.length > 100 || ingredients.some(line => typeof line !== 'string' || line.length > 200)) throw new Error('Malzeme listesi geçersiz.');
    result.ingredients = ingredients.filter(line => line.trim());
    return result;
  }
  function sanitize(item) {
    if (!item || !['blog', 'recipe'].includes(item.type)) throw new Error('Taslak türü geçersiz.');
    const cover = typeof item.cover_url === 'string' ? item.cover_url : '';
    if (cover && !/^https:\/\/[^\s"'<>]+$/.test(cover) && !/^\/api\/media\/[\w-]+$/.test(cover)) throw new Error('Kapak adresi geçersiz.');
    return {
      ...fields(item), type: item.type,
      emoji: typeof item.emoji === 'string' ? item.emoji.slice(0, 8) : '',
      cover_url: cover, pinterest: item.pinterest === true,
      translations: Object.fromEntries(languages.map(lang => [lang, fields(item.translations?.[lang])]))
    };
  }
  function encode(item) { return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), item: sanitize(item) }); }
  function decode(text) {
    if (typeof text !== 'string' || text.length > 500000) throw new Error('Taslak boyutu geçersiz.');
    let value;
    try { value = JSON.parse(text); } catch { throw new Error('Taslak okunamadı.'); }
    if (value?.version !== 1 || !value.item) throw new Error('Taslak sürümü desteklenmiyor.');
    return sanitize(value.item);
  }
  global.TestoEditorState = { encode, decode, sanitize };
})(typeof window !== 'undefined' ? window : globalThis);
