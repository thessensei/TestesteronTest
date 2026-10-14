/*
 * Pinterest Rich Pin köprüsü (private modül — tarayıcıya çıkarılmaz).
 *
 * Blog yazısı veritabanına yazıldıktan (commit) hemen sonra çağrılır; kurumsal
 * JSON gövdesini kurup Pinterest API v5 /pins ucuna POST eder.
 *
 * Tasarım kuralları:
 *  - Bu modül ASLA throw etmez: pin hatası blog yayınını asla bozmaz,
 *    sonuç admin paneline raporlanır ({ ok, skipped, reason, ... }).
 *  - Serverless'ta fonksiyon örneği yanıtla birlikte dondurulabildiği için
 *    istek beklenir ama sert bir zaman aşımıyla sınırlanır (aşağıdaki sabitler).
 *  - Tüm ağ/durum mantığı saf fonksiyonlara ayrılmıştır; Node testleri
 *    fetchImpl enjekte ederek ağa çıkmadan doğrular.
 */

export const PINTEREST_PINS_ENDPOINT = 'https://api.pinterest.com/v5/pins';
export const PINTEREST_MAX_TITLE = 100;
// Pinterest v5 dokümanı açıklama için 500 karakter, alt metin için 500 karakter der.
export const PINTEREST_MAX_DESCRIPTION = 500;
export const PINTEREST_MAX_ALT_TEXT = 500;
export const PINTEREST_TIMEOUT_MS = 3000;
export const PINTEREST_RETRY_DELAY_MS = 300;
export const PINTEREST_ATTEMPTS = 2;

const MAX_SUMMARY = 340;

// Türkçe harfleri hashtag'de okunabilir ASCII'ye çevirir ("Hormon Sağlığı" → #HormonSagligi)
const ASCII_FOLD = {
  ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
  â: 'a', Â: 'A', î: 'i', Î: 'I', û: 'u', Û: 'U', é: 'e', è: 'e', ñ: 'n'
};

export const DEFAULT_HASHTAGS = ['#TestoTavan', '#ErkekSagligi', '#HormonSagligi'];

/** Tek satıra indirger ve karakter sınırına kırpar. */
export function oneLine(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Kategori/tag metnini Pinterest dostu tek bir hashtag'e çevirir. */
export function hashtagOf(text, max = 32) {
  const words = String(text ?? '')
    .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛéèñ]/g, ch => ASCII_FOLD[ch] || ch)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return '';
  const tag = words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join('');
  return `#${tag.slice(0, max)}`;
}

/**
 * Pin açıklaması: özet + kategori ve kurumsal hashtag'ler.
 * Açıklama 500 karakter sınırını aşarsa özet kısaltılır, hashtag'ler korunur.
 */
export function buildPinDescription(item, extraTags = []) {
  const summary = oneLine(item?.summary || item?.title, MAX_SUMMARY);
  const tags = [...new Set([hashtagOf(item?.category), ...extraTags, ...DEFAULT_HASHTAGS].filter(Boolean))].join(' ');
  if (!summary) return tags.slice(0, PINTEREST_MAX_DESCRIPTION);
  const full = `${summary}\n\n${tags}`;
  if (full.length <= PINTEREST_MAX_DESCRIPTION) return full;
  const budget = Math.max(PINTEREST_MAX_DESCRIPTION - tags.length - 2, 0);
  return `${oneLine(summary, budget)}\n\n${tags}`.trim();
}

/**
 * Yayındaki sitenin kök adresini bulur: SITE_URL → Vercel ortam değişkenleri →
 * istek başlıkları. Hiçbiri yoksa '' döner (pin gönderilmez, blog yayınlanır).
 */
export function resolveSiteUrl(headers = {}) {
  const explicit = oneLine(process.env.SITE_URL || '', 300).replace(/\/+$/, '');
  if (/^https?:\/\//i.test(explicit)) return explicit;

  const vercelHost = oneLine(process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '', 300);
  if (vercelHost) {
    const base = vercelHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const proto = /^localhost|^127\./.test(base) ? 'http' : 'https';
    return base ? `${proto}://${base}` : '';
  }

  const host = oneLine(headers['x-forwarded-host'] || headers.host || '', 300).split(',')[0].trim();
  if (!host) return '';
  const proto = oneLine(headers['x-forwarded-proto'] || 'https', 10).split(',')[0].trim();
  return `${proto === 'http' ? 'http' : 'https'}://${host}`;
}

/**
 * Pinin hedef bağlantısı — Vercel'deki canlı yazıya derin bağlantı.
 * Ana sayfa `?icerik=<id>` parametresini okur ve ilgili yazıyı açıp gösterir.
 */
export function canonicalPostUrl(id, siteUrl) {
  const base = oneLine(siteUrl, 300).replace(/\/+$/, '');
  const postId = oneLine(id, 120);
  if (!base || !postId) return '';
  return `${base}/?icerik=${encodeURIComponent(postId)}`;
}

/**
 * Kapak görselini Pinterest'in indirebileceği genel HTTPS adresine çevirir.
 * Panel yüklemeleri (/api/media/...) sitenin kendi adresiyle mutlaklaştırılır.
 */
export function resolvePinImageUrl(coverUrl, siteUrl) {
  const raw = oneLine(coverUrl, 500);
  if (/^https:\/\/[^\s<>"'`]+$/i.test(raw)) return raw;
  const base = oneLine(siteUrl, 300).replace(/\/+$/, '');
  if (/^\/api\/media\/[A-Za-z0-9_-]{6,80}$/.test(raw) && base) return `${base}${raw}`;
  return '';
}

/**
 * Pinterest'e gönderilecek kurumsal JSON gövdesini üretir.
 * Eksik/eksiksiz tüm alanları doğrular; pin gönderilemezse nedenini döner.
 * Gerekli alanlar: başlık, özet/açıklama, canlı bağlantı ve kapak görseli.
 */
export function buildRichPin(item, options = {}) {
  const boardId = oneLine(options.boardId ?? '', 60);
  const siteUrl = options.siteUrl ?? '';
  const title = oneLine(item?.title, PINTEREST_MAX_TITLE);
  const imageUrl = resolvePinImageUrl(item?.cover_url, siteUrl);
  const link = canonicalPostUrl(item?.id, siteUrl);
  const description = buildPinDescription(item);

  if (!boardId) return { ok: false, reason: 'board_id_missing' };
  if (!title) return { ok: false, reason: 'title_missing' };
  if (!description) return { ok: false, reason: 'description_missing' };
  if (!link) return { ok: false, reason: 'site_url_missing' };
  if (!imageUrl) return { ok: false, reason: 'cover_image_missing' };

  return {
    ok: true,
    payload: {
      board_id: boardId,
      title,
      description,
      link,
      alt_text: oneLine(item?.alt_text || `${title} — ${item?.category || 'TestoTavan'}`, PINTEREST_MAX_ALT_TEXT),
      media_source: { source_type: 'image_url', url: imageUrl }
    }
  };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fail(reason, extra = {}) {
  return { ok: false, skipped: false, reason, ...extra };
}

/**
 * Blog yazısını Pinterest'e pin olarak gönderir.
 *
 * @param {object} item   Veritabanından dönen içerik kaydı (id, type, title, summary, cover_url, category)
 * @param {object} options
 *   headers   : req.headers (site adresi çözümlemesi için)
 *   token     : varsayılan process.env.PINTEREST_ACCESS_TOKEN
 *   boardId   : varsayılan process.env.PINTEREST_BOARD_ID
 *   enabled   : false ise pin hiç denenmez (panelden işaret kaldırıldı)
 *   fetchImpl : testlerde enjekte edilen fetch
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string, status?:number, pin_id?:string, attempts?:number, ms:number}>}
 */
export async function pinterestRichPinFire(item, options = {}) {
  const startedAt = Date.now();
  const done = result => ({ ...result, ms: Date.now() - startedAt });

  try {
    if (!item || item.type !== 'blog') return done({ ok: false, skipped: true, reason: 'not_a_blog_item' });
    if (options.enabled === false) return done({ ok: false, skipped: true, reason: 'disabled_by_publisher' });

    const token = oneLine(options.token ?? process.env.PINTEREST_ACCESS_TOKEN ?? '', 500);
    const boardId = oneLine(options.boardId ?? process.env.PINTEREST_BOARD_ID ?? '', 60);
    const siteUrl = options.siteUrl || resolveSiteUrl(options.headers || {});
    const built = buildRichPin(item, { boardId, siteUrl });

    if (!built.ok) {
      console.warn(`[pinterest] pin atlandı (${built.reason}) — içerik: ${item.id}`);
      return done({ ok: false, skipped: true, reason: built.reason });
    }
    if (!token) {
      console.warn('[pinterest] PINTEREST_ACCESS_TOKEN tanımlı değil; pin gönderilmedi.');
      return done({ ok: false, skipped: true, reason: 'token_missing' });
    }

    const fetchImpl = options.fetchImpl || fetch;
    const timeoutMs = options.timeoutMs ?? PINTEREST_TIMEOUT_MS;
    const attempts = options.attempts ?? PINTEREST_ATTEMPTS;
    const retryDelayMs = options.retryDelayMs ?? PINTEREST_RETRY_DELAY_MS;
    const body = JSON.stringify(built.payload);
    let attempt = 0;
    let lastError = '';

    while (attempt < attempts) {
      attempt += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(PINTEREST_PINS_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body,
          signal: controller.signal
        });
        clearTimeout(timer);

        const data = await response.json().catch(() => null);

        if (response.ok) {
          const pinId = data?.id || '';
          console.log(`[pinterest] pin gönderildi: ${pinId || '(id yok)'} — içerik: ${item.id}`);
          return done({ ok: true, skipped: false, pin_id: pinId, status: response.status, attempts: attempt });
        }

        const message = data?.message || data?.error?.message || `Pinterest API hatası (${response.status})`;
        lastError = message;

        // Yalnızca hız sınırı ve sunucu hatalarında tekrar denenir.
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < attempts) {
          await sleep(retryDelayMs);
          continue;
        }

        console.warn(`[pinterest] pin gönderilemedi (${response.status}): ${message} — içerik: ${item.id}`);
        return done(fail('api_error', { status: response.status, error: oneLine(message, 200), attempts: attempt }));
      } catch (error) {
        clearTimeout(timer);
        lastError = error?.name === 'AbortError' ? `Zaman aşımı (${timeoutMs} ms)` : oneLine(error?.message || error, 200);
        if (attempt < attempts) {
          await sleep(retryDelayMs);
          continue;
        }
      }
    }

    console.warn(`[pinterest] pin gönderilemedi: ${lastError} — içerik: ${item.id}`);
    return done(fail('request_failed', { error: lastError, attempts: attempt }));
  } catch (error) {
    // Kuşatıcı güvenlik ağı: pin hatası blog yayınını asla düşürmez.
    console.error('[pinterest] beklenmeyen hata:', error);
    return done(fail('unexpected_error', { error: oneLine(error?.message || error, 200) }));
  }
}
