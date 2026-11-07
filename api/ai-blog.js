import { createBlogDraftFromTopic, validateTopicInput } from './_topic-draft.js';
import { isAdmin } from './_auth.js';
import { clean, cleanIngredients } from './_content-shape.js';
import { TARGET_LANGS } from './_langs.js';
import { assessTranslationQuality, machineTranslateFields, networkTranslationAllowed } from './_translate.js';
import { completeBlogTranslations, createBlogDraftFromUrl, translateIngredientLines, validateNewsUrl } from './_ai-blog.js';

export function createAiBlogHandler(options = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isAdmin(req)) {
      return res.status(401).json({ error: 'Yetkisiz erişim. Admin girişi gerekli.' });
    }

    if (req.headers?.['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: 'İstek reddedildi.' });
    }

    if (req.headers?.['content-type'] && !/^application\/json(?:;|$)/i.test(req.headers['content-type'])) {
      return res.status(415).json({ error: 'JSON gövdesi gerekli.' });
    }

    const body = req.body || {};
    const aiOptions = {
      ...options,
      provider: body.provider,
      apiKey: body.apiKey,
      model: body.model,
      type: body.type,
      forceTranslation: body.forceTranslation === true,
      // Yayın kalite kapısı: ilk taslak kısa/kaynaksız değilse ikinci bir yazım turu istenir.
      qualityRetry: body.qualityRetry !== false
    };

    if (body.mode === 'machine-translate') {
      const lang = body.lang;
      if (!TARGET_LANGS.includes(lang)) return res.status(400).json({ error: 'Geçersiz hedef dil.' });
      const raw = body.item;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return res.status(400).json({ error: 'Geçersiz içerik.' });
      const source = {
        title: clean(raw.title, 100), summary: clean(raw.summary, 240), body: clean(raw.body, 20000),
        category: clean(raw.category, 60), time: clean(raw.time, 30),
        ingredients: raw.type === 'recipe' ? cleanIngredients(raw.ingredients) : []
      };
      if (!source.title || !source.summary || !source.body || !source.category || !source.time) return res.status(400).json({ error: 'Çeviri için Türkçe alanları doldurun.' });
      if (!networkTranslationAllowed(options, options.env || process.env)) return res.status(503).json({ error: 'Makine çevirisi etkin değil.' });
      try {
        const translation = await machineTranslateFields(source, lang, options);
        if (!translation) return res.status(502).json({ error: 'Çeviri servisi yanıt vermedi.' });
        if (translation.title.length > 100 || translation.summary.length > 240 || translation.body.length > 20000 || translation.category.length > 60 || translation.time.length > 30 || translation.ingredients.some(line => line.length > 200)) return res.status(422).json({ error: 'Çeviri alan sınırını aşıyor; elle kontrol edin.' });
        const quality = assessTranslationQuality(translation, source, lang);
        if (!quality.complete) return res.status(422).json({ error: 'Çeviri bütünlük kontrolünden geçmedi; elle kontrol edin.', quality });
        return res.status(200).json({ ok: true, lang, translation, quality });
      } catch {
        return res.status(502).json({ error: 'Çeviri servisine ulaşılamadı.' });
      }
    }

    if (body.mode === 'ingredients') {
      try {
        const translated = await translateIngredientLines(body.items || body.ingredients, aiOptions);
        if (!translated.ok) return res.status(400).json({ error: translated.error });
        return res.status(200).json(translated);
      } catch (error) {
        console.error('[ai-blog] malzeme çevirisi hatası:', error);
        return res.status(500).json({ error: 'Malzeme çevirisi şu anda yanıt veremiyor.' });
      }
    }

    if (body.mode === 'translate') {
      try {
        const translated = await completeBlogTranslations(body.item, aiOptions);
        if (!translated.ok) return res.status(400).json({ error: translated.error });
        return res.status(200).json(translated);
      } catch (error) {
        console.error('[ai-blog] çeviri hatası:', error);
        return res.status(500).json({ error: 'Çeviri servisi şu anda yanıt veremiyor.' });
      }
    }

    if (body.mode === 'topic') {
      const input = validateTopicInput(body);
      if (!input.ok) return res.status(400).json({ error: input.error });
      try {
        const result = await createBlogDraftFromTopic(input, aiOptions);
        return res.status(result.ok ? 200 : 422).json(result);
      } catch (error) {
        console.error('[ai-blog] konu taslağı oluşturulamadı');
        return res.status(500).json({ error: 'Konu taslağı şu anda oluşturulamıyor. Yeniden deneyin.' });
      }
    }

    const urlCheck = validateNewsUrl(body.url);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: urlCheck.error });
    }

    try {
      const result = await createBlogDraftFromUrl(urlCheck.url, aiOptions);

      if (!result.ok) {
        return res.status(422).json({ error: result.error || 'Haber içeriği işlenemedi.' });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('[ai-blog] beklenmeyen hata:', error);
      return res.status(500).json({ error: 'AI blog oluşturucu şu anda yanıt veremiyor.' });
    }
  };
}

export default createAiBlogHandler();
