/*
 * Malzeme otomasyonu — admin içerik stüdyosu.
 *
 * İki iş yapar, ikisi de tarayıcıda çalışır (sunucu gerekmez):
 *  1. extractIngredients(text)  — "İçerik / hazırlanış" metninden malzeme satırlarını çıkarır.
 *  2. mergeIngredients(existing, incoming) — var olan satırları koruyup yalnızca yenileri ekler.
 *
 * Klasik script olarak yüklenir; testler `window.MeydanIngredients` üzerinden aynı
 * fonksiyonları node:vm ile çalıştırır. Böylece admin sayfası ile testler tek kaynağı paylaşır.
 */
(function (global) {
  'use strict';

  // "Malzemeler:" / "Ingredients" / "Zutaten" / "材料" başlıkları
  const HEADING = /^(?:malzemeler|malzeme listesi|malzemeleri|içindekiler|icindekiler|ingredients|ingredient list|zutaten|材料|ざいりょう)\s*:?$/i;
  // Malzeme bölümünü bitiren başlıklar
  const END = /^(?:hazırlanış|hazirlanis|hazırlanışı|hazirlanisi|yapılış|yapilis|yapılışı|yapilisi|talimatlar?|adımlar|steps?|instructions?|zubereitung|作り方|つくり方|方法)\s*:?$/i;
  // "- 2 yumurta", "• 1 su bardağı un", "3) 150 g tavuk" gibi satırlar
  const BULLET = /^\s*(?:[-–—*•·▪◦]|\d{1,2}[.)])\s+/;
  const UNITS = [
    'g', 'gr', 'kg', 'mg', 'ml', 'cl', 'dl', 'lt', 'l', 'litre',
    'su bardağı', 'çay bardağı', 'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı',
    'bardak', 'fincan', 'adet', 'diş', 'tutam', 'dilim', 'paket', 'kutu',
    'ölçek', 'scoop', 'porsiyon', 'cay kasigi', 'yemek kasigi'
  ];
  const QTY_START = new RegExp(
    `^\\s*(?:\\d+(?:[.,]\\d+)?(?:\\s*[/⁄]\\s*\\d+)?|yarım|çeyrek|bir|iki|üç|dört|beş|altı|birkaç|half|one|two|three)`
    + `\\s*(?:${UNITS.join('|')})?\\b`,
    'i'
  );
  const MAX_ITEMS = 40;
  const MAX_LENGTH = 200;

  function foldTurkish(value) {
    return String(value || '').toLocaleLowerCase('tr');
  }

  function collapse(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function cleanHeading(line) {
    return collapse(String(line || '').replace(/^[#>*\s]+/, '').replace(/[:：]\s*$/, ''));
  }

  /** Satır başındaki madde işaretini / sıra numarasını atar. */
  function cleanLine(line) {
    return collapse(String(line || '').replace(BULLET, ''));
  }

  function sentenceLike(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    if (/[.!?]$/.test(text) && text.split(/\s+/).length >= 4) return true;
    return text.length > 140;
  }

  function looksLikeIngredient(value) {
    const text = String(value || '').trim();
    if (text.length < 2 || text.length > MAX_LENGTH) return false;
    // "1. Tavuğu 10 dakika pişirin." gibi adımlar malzeme değildir.
    if (sentenceLike(text)) return false;
    if (QTY_START.test(text)) return true;
    if (/\d/.test(text)) return true;
    // "Tuz", "Karabiber" gibi miktarsız kısa malzemeler
    return text.length <= 40 && !/[.!?]$/.test(text);
  }

  function dedupeKey(value) {
    return foldTurkish(collapse(value)).replace(/[.,;]+$/, '');
  }

  function dedupe(values) {
    const seen = new Set();
    const out = [];
    for (const value of values) {
      const key = dedupeKey(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  }

  function sectionIngredients(lines) {
    const start = lines.findIndex(line => HEADING.test(cleanHeading(line)));
    if (start < 0) return [];
    const out = [];
    for (let index = start + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!String(line || '').trim()) continue;
      const heading = cleanHeading(line);
      if (END.test(heading) || HEADING.test(heading)) break;
      const cleaned = cleanLine(line);
      if (!cleaned) continue;
      if (cleaned.length > MAX_LENGTH) break;
      if (!BULLET.test(line) && sentenceLike(cleaned)) break;
      if (!looksLikeIngredient(cleaned)) {
        if (BULLET.test(line) && cleaned.length <= 80 && !sentenceLike(cleaned)) {
          out.push(cleaned);
        }
        continue;
      }
      out.push(cleaned);
      if (out.length >= MAX_ITEMS) break;
    }
    return out;
  }

  /**
   * Madde işaretli bloğu toplar: "- 2 dilim ekmek" satırlarının hemen ardından
   * gelen ve cümle olmayan kısa satırlar ("Tuz, karabiber") da malzeme sayılır.
   * Blok boş satırla biter; böylece başlık veya paragraflar karışmaz.
   */
  function bulletIngredients(lines) {
    const out = [];
    let inBlock = false;
    for (const line of lines) {
      if (!String(line || '').trim()) {
        inBlock = false;
        continue;
      }
      if (BULLET.test(line)) {
        const cleaned = cleanLine(line);
        inBlock = true;
        if (looksLikeIngredient(cleaned)) out.push(cleaned);
        continue;
      }
      if (!inBlock) continue;
      const cleaned = cleanLine(line);
      if (looksLikeIngredient(cleaned)) {
        out.push(cleaned);
        continue;
      }
      inBlock = false;
    }
    return out;
  }

  function quantityIngredients(lines) {
    return lines
      .map(cleanLine)
      .filter(line => line && line.length <= MAX_LENGTH && QTY_START.test(line));
  }

  /**
   * Metinden malzeme listesini çıkarır.
   * Sıra: "Malzemeler" bölümü → madde işaretli satırlar → miktarla başlayan satırlar.
   */
  function extractIngredients(text, options) {
    const limit = Math.max(1, Math.min(100, Number(options && options.limit) || MAX_ITEMS));
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    if (!lines.some(line => String(line || '').trim())) return [];

    let found = sectionIngredients(lines);
    if (!found.length) found = bulletIngredients(lines);
    if (!found.length) found = quantityIngredients(lines);
    return dedupe(found).slice(0, limit);
  }

  /** Var olan sırayı korur; yalnızca yeni ve tekrar etmeyen malzemeleri ekler. */
  function mergeIngredients(existing, incoming) {
    const base = Array.isArray(existing) ? existing.map(collapse).filter(Boolean) : [];
    const seen = new Set(base.map(dedupeKey));
    const out = [...base];
    for (const value of (Array.isArray(incoming) ? incoming : [])) {
      const cleaned = collapse(value);
      const key = dedupeKey(cleaned);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(cleaned);
    }
    return out;
  }

  /** Toplu yapıştırmada virgülden bölme: 1,5 gibi miktarlar korunur. */
  function parseIngredientBatch(text) {
    const rows = String(text || '').replace(/\r/g, '').split('\n').map(cleanLine).filter(Boolean);
    if (!rows.length) return { ok: false, error: 'Her satıra bir malzeme yazın.' };
    if (rows.some(row => row.length > 200)) return { ok: false, error: 'Bir malzeme en fazla 200 karakter olabilir.' };
    const items = dedupe(rows);
    if (items.length > 100) return { ok: false, error: 'En fazla 100 malzeme eklenebilir.' };
    return { ok: true, items };
  }

  function moveIngredient(values, index, direction) {
    const result = [...values];
    const next = index + direction;
    if (!Number.isInteger(index) || ![-1, 1].includes(direction) || index < 0 || index >= result.length || next < 0 || next >= result.length) return result;
    [result[index], result[next]] = [result[next], result[index]];
    return result;
  }

  global.MeydanIngredients = { extractIngredients, mergeIngredients, parseIngredientBatch, moveIngredient };
})(typeof window !== 'undefined' ? window : globalThis);
