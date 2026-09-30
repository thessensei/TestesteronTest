/*
 * Panel v2 — medya yardımcıları (saf fonksiyonlar, Node testlerinde doğrulanır).
 * Yalnızca API tarafında kullanılır; tarayıcıya çıkarılmaz.
 */

export const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

// Panelin yüklediği görsellerin yolu: /api/media/media-<timestamp>-<rastgele>
const MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{6,80}$/;
// Harici kapak bağlantıları yalnızca HTTPS olabilir; tırnak/oksunjuk karakterleri reddedilir.
const HTTPS_URL = /^https:\/\/[^\s<>"'`]+$/i;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

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
  const base64 = typeof input?.data === 'string'
    ? input.data.replace(/^data:[^,]*,/i, '').trim()
    : '';
  if (!base64 || !BASE64.test(base64)) {
    return { ok: false, error: 'Geçersiz görsel verisi.' };
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    return { ok: false, error: 'Geçersiz görsel verisi.' };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Görsel en fazla 2 MB olabilir.' };
  }
  return { ok: true, mime: type, buffer };
}
