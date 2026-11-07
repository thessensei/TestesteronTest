// Mesajlar yalnızca düz metindir; http(s) bağlantıları güvenli şekilde açılır.
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function renderPostContent(value) {
  const text = String(value ?? '');
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  let result = '', last = 0, match;
  while ((match = pattern.exec(text))) {
    let url = match[0];
    // Cümle sonundaki noktalama bağlantının parçası değildir.
    while (/[.,!?;:]$/.test(url)) url = url.slice(0, -1);
    while (url.endsWith(')') && (url.match(/\)/g) || []).length > (url.match(/\(/g) || []).length) url = url.slice(0, -1);
    let valid = false;
    try { const parsed = new URL(url); valid = ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname); } catch { /* düz metin olarak bırak */ }
    if (!valid) continue;
    result += escape(text.slice(last, match.index));
    result += `<a href="${escape(url)}" target="_blank" rel="nofollow ugc noopener noreferrer">${escape(url)}</a>`;
    last = match.index + url.length;
  }
  return result + escape(text.slice(last));
}
