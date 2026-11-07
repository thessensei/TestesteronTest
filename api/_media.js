/*
 * Medya yardımcıları (saf fonksiyonlar, Node testlerinde doğrulanır).
 * Yalnızca API tarafında kullanılır; tarayıcıya çıkarılmaz.
 */

export const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

// Panelin yüklediği görsellerin yolu: /api/media/media-<timestamp>-<rastgele>
const MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{6,80}$/;
// Harici kapak bağlantıları yalnızca HTTPS olabilir; tırnak/oksunjuk karakterleri reddedilir.
const HTTPS_URL = /^https:\/\/[^\s<>"'`]+$/i;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function hasImageSignature(type, buffer) {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (type === 'image/gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (type === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

/*
 * Kapak görseli doğrulaması: geçerliyse temizlenmiş değeri, geçersizse '' döner.
 * Kabul: https://... bağlantıları ve panelin /api/media/ altına yüklediği dosyalar.
 */
export function isSafeCoverUrl(value) {
  const url = String(value || '').trim().slice(0, 500);
  if (MEDIA_PATH.test(url)) return url;
  return HTTPS_URL.test(url) ? url : '';
}

/*
 * Panel yüklemesi doğrulaması: MIME izinli, veri geçerli base64 ve boyut sınırı içinde olmalı.
 * Başarılıysa { ok:true, mime, buffer }, değilse { ok:false, error } döner.
 */
export function validateImageUpload(input) {
  const type = String(input?.mime || '').toLowerCase().split(';')[0].trim();
  if (!ALLOWED_IMAGE_MIME.has(type)) {
    return { ok: false, error: 'Sadece JPEG, PNG, WebP veya GIF görseller yüklenebilir.' };
  }
  const raw = typeof input?.data === 'string' ? input.data.trim() : '';
  const dataUrl = /^data:([^;,]+);base64,/i.exec(raw);
  if (raw.startsWith('data:') && (!dataUrl || dataUrl[1].toLowerCase() !== type)) {
    return { ok: false, error: 'Geçersiz görsel verisi.' };
  }
  const base64 = dataUrl ? raw.slice(dataUrl[0].length) : raw;
  if (base64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) return { ok: false, error: 'Görsel en fazla 2 MB olabilir.' };
  if (!base64 || !BASE64.test(base64)) {
    return { ok: false, error: 'Geçersiz görsel verisi.' };
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0 || buffer.toString('base64') !== base64) {
    return { ok: false, error: 'Geçersiz görsel verisi.' };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Görsel en fazla 2 MB olabilir.' };
  }
  if (!hasImageSignature(type, buffer)) return { ok: false, error: 'Görsel dosyası belirtilen biçimde değil.' };
  return { ok: true, mime: type, buffer };
}
