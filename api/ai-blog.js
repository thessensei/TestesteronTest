import { isAdmin } from './_auth.js';
import { completeBlogTranslations, createBlogDraftFromUrl, validateNewsUrl } from './_ai-blog.js';

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
