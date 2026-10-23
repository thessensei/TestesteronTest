import { mergeEditorial } from './_editorial.js';
import crypto from 'node:crypto';
import { isAdmin } from './_auth.js';
import { isSafeCoverUrl } from './_media.js';
import { clean, cleanIngredients, cleanTranslations } from './_content-shape.js';
import { pinterestRichPinFire } from './_pinterest.js';
import { connectDb, ensureSlug, listContent, prepareContent, withPublicUrl } from './_content-db.js';
import { stripSourceReferences } from './_seo.js';

/*
 * Blog & tarif içerik yönetimi.
 * Her kayıt yayınlanırken kalıcı bir slug alır: /blog/<slug>/ adresi buradan doğar.
 * Yayın gövdesindeki kaynakça/atıf satırları sunucu tarafında ayıklanır.
 */

function db() {
  return connectDb();
}

/** Çeviri gövdelerinde de kaynakça/atıf satırı bırakılmaz. */
function sanitizeTranslationBodies(translations) {
  for (const lang of Object.keys(translations)) {
    translations[lang].body = stripSourceReferences(translations[lang].body);
  }
  return translations;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (req.method !== 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Yetkisiz erişim.' });
    if (req.headers?.['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'İstek reddedildi.' });
    if (req.method !== 'DELETE' && !/^application\/json(?:;|$)/i.test(req.headers?.['content-type'] || '')) return res.status(415).json({ error: 'JSON gövdesi gerekli.' });
    if (req.method !== 'DELETE' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: 'Geçersiz içerik gövdesi.' });
  }
  const includeGuides = req.method === 'GET' && req.query?.guides === '1';
  try {
    const sql = db();
    await prepareContent(sql);

    if (req.method === 'GET') {
      const rows = await listContent(sql);
      res.setHeader('Cache-Control', isAdmin(req) ? 'private, no-store' : 'public, s-maxage=30, stale-while-revalidate=300');
      return res.status(200).json(includeGuides ? mergeEditorial(rows) : rows);
    }

    if (req.method === 'POST') {
      const input = req.body || {};
      const id = `content-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const item = {
        id,
        type: input.type === 'recipe' ? 'recipe' : 'blog',
        category: clean(input.category, 60), title: clean(input.title, 100),
        emoji: clean(input.emoji, 8), time: clean(input.time, 30),
        summary: clean(input.summary, 240), body: stripSourceReferences(clean(input.body, 20000)),
        ingredients: cleanIngredients(input.ingredients),
        translations: cleanTranslations(input.translations), cover_url: isSafeCoverUrl(input.cover_url)
      };
      item.translations = sanitizeTranslationBodies(item.translations);
      if (!item.category || !item.title || !item.time || !item.summary || !item.body) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
      if (item.type === 'recipe' && !item.ingredients.length) return res.status(400).json({ error: 'Tarifler için en az bir malzeme gerekli.' });

      const slug = await ensureSlug(sql, item.title, item.id);
      let [created] = await sql`INSERT INTO content (id,type,category,title,slug,emoji,time_text,summary,body,ingredients,translations,cover_url) VALUES (${item.id},${item.type},${item.category},${item.title},${slug},${item.emoji},${item.time},${item.summary},${item.body},${JSON.stringify(item.ingredients)}::jsonb,${JSON.stringify(item.translations)}::jsonb,${item.cover_url}) RETURNING id,type,category,title,slug,emoji,time_text AS time,summary,body,ingredients,translations,cover_url,TO_CHAR(published_at,'YYYY-MM-DD') AS date,published_at,updated_at`;
      created = withPublicUrl(created);

      // --- Pinterest Rich Pin boru hattı -------------------------------------------------
      // Kayıt commit edildiği anda tetiklenir; başlık, özet, canlı bağlantı ve kapak
      // görseli kurumsal JSON gövdesi olarak Pinterest API v5 /pins ucuna gönderilir.
      // Pin hatası yayın akışını bozmaz: sonuç 201 yanıtındaki `pinterest` alanıyla raporlanır.
      // (İstemci pin göndermek istemezse gövdede `pinterest: false` gönderir.)
      const pinterest = await pinterestRichPinFire(created, {
        headers: req.headers,
        enabled: input.pinterest !== false
      });

      return res.status(201).json({ ...created, pinterest });
    }

    if (req.method === 'PUT') {
      const id = clean(req.query.id, 120);
      if (!id) return res.status(400).json({ error: 'İçerik kimliği gerekli.' });
      const input = req.body || {};
      const item = { type: input.type === 'recipe' ? 'recipe' : 'blog', category: clean(input.category, 60), title: clean(input.title, 100), emoji: clean(input.emoji, 8), time: clean(input.time, 30), summary: clean(input.summary, 240), body: stripSourceReferences(clean(input.body, 20000)), ingredients: cleanIngredients(input.ingredients), translations: sanitizeTranslationBodies(cleanTranslations(input.translations)), cover_url: isSafeCoverUrl(input.cover_url) };
      if (!item.category || !item.title || !item.time || !item.summary || !item.body) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
      if (item.type === 'recipe' && !item.ingredients.length) return res.status(400).json({ error: 'Tarifler için en az bir malzeme gerekli.' });

      // Slug yayından sonra değişmez: paylaşılan bağlantılar ve arama motoru kaydı bozulmaz.
      const [existing] = await sql`SELECT slug FROM content WHERE id=${id}`;
      if (!existing) return res.status(404).json({ error: 'İçerik bulunamadı.' });
      const slug = existing.slug || await ensureSlug(sql, item.title, id);

      const [updated] = await sql`UPDATE content SET type=${item.type},category=${item.category},title=${item.title},slug=${slug},emoji=${item.emoji},time_text=${item.time},summary=${item.summary},body=${item.body},ingredients=${JSON.stringify(item.ingredients)}::jsonb,translations=${JSON.stringify(item.translations)}::jsonb,cover_url=${item.cover_url},updated_at=NOW() WHERE id=${id} RETURNING id,type,category,title,slug,emoji,time_text AS time,summary,body,ingredients,translations,cover_url,TO_CHAR(published_at,'YYYY-MM-DD') AS date,published_at,updated_at`;
      return updated ? res.status(200).json(withPublicUrl(updated)) : res.status(404).json({ error: 'İçerik bulunamadı.' });
    }

    if (req.method === 'DELETE') {
      const id = clean(req.query.id, 100);
      if (!id) return res.status(400).json({ error: 'İçerik kimliği gerekli.' });
      await sql`DELETE FROM content WHERE id = ${id}`;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    if (includeGuides) {
      res.setHeader('Cache-Control', 'public, s-maxage=30');
      return res.status(200).json(mergeEditorial());
    }
    return res.status(500).json({ error: 'İçerik servisine ulaşılamadı.' });
  }
}
