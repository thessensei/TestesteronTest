/*
 * TestoTavan — SEO çekirdeği (private modül).
 *
 * Blog yazıları ve forum konuları artık kendi kalıcı adreslerinde sunulur:
 *   /blog/<slug>/      → api/seo.js → api/_blog-page.js (sunucu tarafında üretilen HTML)
 *   /forum/t/<id>/     → api/seo.js → api/_forum-page.js (sunucu tarafında üretilen HTML)
 *
 * Bu modül iki bölümün ortak ihtiyaçlarını karşılar:
 *  - Türkçe karakterleri doğru sadeleştiren slug üretimi
 *  - Kaynakça/atıf satırlarını temizleyen metin filtresi
 *  - Markdown-benzeri gövdeyi güvenli HTML'e çeviren küçük render motoru
 *  - Canonical / Open Graph / Twitter / JSON-LD üreten meta katmanı
 *  - Kendi kimliği olan, mobil öncelikli iki farklı sayfa teması (dergi + meydan)
 *
 * Hiçbir kullanıcı metni HTML olarak çalıştırılmaz; her şey kaçırılır.
 */

export const SITE_NAME = 'TestoTavan';
export const DEFAULT_SITE_URL = 'https://testosteron-test.vercel.app';
// Dil listesi tek kaynaktan gelir (api/_langs.js); burada yeniden dışa aktarılır.
export { LANGS, TARGET_LANGS, LANG_LABELS, LANG_LOCALES } from './_langs.js';
import { LANGS, LANG_LOCALES as LOCALES, TARGET_LANGS } from './_langs.js';
export const HTML_LANG = Object.fromEntries(LANGS.map(code => [code, code]));
export const OG_LOCALES = LOCALES;

/* ------------------------------------------------------------------ metin */

export function oneLine(value, max = 400) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export const escapeAttr = escapeHtml;

const ASCII_FOLD = {
  ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
  â: 'a', Â: 'A', î: 'i', Î: 'I', û: 'u', Û: 'U', é: 'e', è: 'e', ê: 'e', ñ: 'n'
};

/** "Sabah Güneşi ve Uyku: Testosteronu Nasıl Etkiler?" → "sabah-gunesi-ve-uyku-testosteronu-nasil-etkiler" */
export function slugify(value, max = 70) {
  const folded = String(value ?? '').replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛéèêñ]/g, ch => ASCII_FOLD[ch] || ch);
  return folded
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, max)
    .replace(/-+$/g, '') || '';
}

/** Başlık boşsa içerik kimliğinden okunabilir bir slug üretir. */
export function fallbackSlug(id, prefix = 'icerik') {
  const tail = String(id ?? '').replace(/[^A-Za-z0-9]+/g, '').slice(-8).toLowerCase();
  return tail ? `${prefix}-${tail}` : prefix;
}

/**
 * Gövdeden kaynakça/atıf satırlarını kaldırır.
 * Üretilen yazılar kendi başına ayakta durmalı: "Kaynak: site (link)" satırları,
 * çıplak URL'ler ve İngilizce "References" blokları yayına çıkmaz.
 */
const SOURCE_HEADING = /^\s*(?:#{1,6}\s*)?(?:kaynak(?:ça|lar)?|referans(?:lar)?|sources?|references?|bibliography|weiterführende\s+literatur|quellen(?:verzeichnis)?|参考文献|出典|参考資料)\s*[:：]?\s*$/i;
const SOURCE_LINE = /^\s*(?:#{1,6}\s*)?(?:kaynak(?:ça|lar)?|referans(?:lar)?|sources?|references?|bibliography|quellen(?:verzeichnis)?|参考文献|出典|参考資料)\s*[:：\-–—]/i;
const URL_ONLY_LINE = /^\s*(?:[-*•]|\d{1,2}[.)])?\s*(?:<(?:https?:\/\/|www\.)\S+>|(?:https?:\/\/|www\.)\S+)\s*$/i;
const LINK_LIST_LINE = /^\s*(?:[-*•]|\d{1,2}[.)])\s+(?:\[[^\]]*\]\([^)]+\)|<?https?:\/\/\S+>?)\s*$/i;
const REFERENCE_ITEM_LINE = /^\s*(?:[-*•]|\d{1,2}[.)])\s+\S/;
const BOILERPLATE_LINE = /^\s*(?:not|disclaimer|hinweis|注意)\s*[:：].*(?:bilgilendirme|tıbbi|tanı|medical|medizinisch|医学|診断).*$/i;

export function stripSourceReferences(body = '') {
  const lines = String(body ?? '').replace(/\r\n?/g, '\n').split('\n');
  const kept = [];
  // "Kaynakça" başlığı görüldüğünde başlık ve altındaki referans listesi bütünüyle
  // atılır; liste birden çok boş satırla ayrılmış olsa bile devam eder.
  let inReferences = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (SOURCE_HEADING.test(trimmed)) { inReferences = true; continue; }
    if (inReferences) {
      if (!trimmed) { kept.push(''); continue; }
      if (REFERENCE_ITEM_LINE.test(trimmed) || URL_ONLY_LINE.test(trimmed) || SOURCE_LINE.test(trimmed)) continue;
      inReferences = false;
    }
    if (SOURCE_LINE.test(trimmed) || URL_ONLY_LINE.test(trimmed) || LINK_LIST_LINE.test(trimmed) || BOILERPLATE_LINE.test(trimmed)) continue;
    kept.push(line);
  }
  return kept
    .join('\n')
    // Paragraf sonuna eklenmiş "Kaynak: ..." kalıntıları
    .replace(/\s*(?:Kaynak|Source|Sources|References?|Quelle|出典)\s*[:：]\s*[^\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Gövdedeki çıplak URL'leri (kaynak bağlantısı kalıntısı) metinden ayıklar. */
export function stripBareUrls(text = '') {
  return String(text ?? '').replace(/\s*\(?(?:https?:\/\/|www\.)[^\s)]+\)?/gi, '').replace(/[ \t]{2,}/g, ' ').trim();
}

/* ------------------------------------------------------- okuma / başlıklar */

export function wordCount(text = '') {
  return String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(text = '') {
  return Math.max(1, Math.min(60, Math.ceil(wordCount(text) / 180)));
}

export function readingLabel(minutes, lang = 'tr') {
  const m = Math.max(1, Number(minutes) || 1);
  const label = ({
    tr: `${m} dk okuma`, en: `${m} min read`, de: `${m} Min. Lesezeit`, ja: `${m}分で読めます`,
    fr: `${m} min de lecture`, es: `${m} min de lectura`, bg: `${m} мин четене`,
    ru: `${m} мин чтения`, hi: `${m} मिनट पढ़ें`, zh: `${m} 分钟阅读`
  })[lang];
  return label || (lang === 'tr' ? `${m} dk okuma` : `${m} min read`);
}

/** Gövdedeki "## Başlık" satırlarını içindekiler için toplar. */
export function extractHeadings(body = '') {
  const headings = [];
  for (const line of String(body ?? '').split('\n')) {
    const match = line.match(/^\s*#{2,3}\s+(.{2,120})$/);
    if (match) headings.push({ text: oneLine(match[1].replace(/[*_`]/g, ''), 120), id: anchorId(match[1]) });
  }
  return headings;
}

/** Tarif gövdesindeki "Hazırlanışı" adımlarını JSON-LD için ayıklar. */
export function extractRecipeSteps(body = '') {
  const lines = stripSourceReferences(body).split('\n').map(line => line.trim()).filter(Boolean);
  const start = lines.findIndex(line => /hazırlan|hazirlan|directions|instructions|zubereitung|作り方|手順/i.test(line) && /^#{1,4}\s|:$/.test(line));
  if (start < 0) return [];
  const steps = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,4}\s/.test(line)) break;
    const match = line.match(/^\d{1,2}[.)]\s+(.{3,400})$/);
    if (match) steps.push(oneLine(match[1], 400));
    if (steps.length >= 30) break;
  }
  return steps;
}

export function anchorId(text) {
  const base = slugify(text, 60);
  return base || 'bolum';
}

/* ------------------------------------------------------------ html üretimi */

function inlineMarkup(text) {
  let html = escapeHtml(text);
  // [etiket](https://...) — yalnızca https bağlantıları tıklanabilir.
  html = html.replace(/\[([^\]]{1,160})\]\((https:\/\/[^\s)]{4,300})\)/g, (_, label, href) => `<a href="${href}" rel="noopener nofollow">${label}</a>`);
  html = html.replace(/\*\*([^*\n]{1,200})\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(])\*([^*\n]{1,200})\*(?=$|[\s.,:;)])/g, '$1<em>$2</em>');
  return html;
}

const BULLET = /^\s*[-*•]\s+/;
const ORDERED = /^\s*\d{1,2}[.)]\s+/;
const HEADING = /^\s*(#{2,4})\s+(.+)$/;

/**
 * Panelden gelen düz metni güvenli, semantik HTML'e çevirir.
 * Desteklenen biçimler: "## Başlık", "- madde", "1. madde", **kalın**, [bağlantı](https://…).
 * "Başlık:" ile biten kısa tek satırlar da alt başlık sayılır (eski içerikler uyumlu kalır).
 */
export function renderRichText(body = '') {
  const blocks = String(body ?? '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
  const html = [];
  const usedIds = new Map();

  const heading = (level, text) => {
    const id = anchorId(text);
    const seen = usedIds.get(id) || 0;
    usedIds.set(id, seen + 1);
    const unique = seen ? `${id}-${seen + 1}` : id;
    return `<h${level} id="${unique}">${inlineMarkup(text)}</h${level}>`;
  };

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split('\n');

    if (lines.length === 1) {
      const match = block.match(HEADING);
      if (match) {
        html.push(heading(Math.min(4, Math.max(2, match[1].length)), match[2].trim()));
        continue;
      }
      // "Öne Çıkan Noktalar:" / "Sık Sorulan Sorular:" gibi kısa etiketler
      if (block.length <= 90 && /:$/.test(block) && !/^\d/.test(block)) {
        html.push(heading(2, block.replace(/:$/, '').trim()));
        continue;
      }
    }

    if (lines.every(line => BULLET.test(line) || !line.trim())) {
      html.push(`<ul>${lines.filter(line => BULLET.test(line)).map(line => `<li>${inlineMarkup(line.replace(BULLET, ''))}</li>`).join('')}</ul>`);
      continue;
    }
    if (lines.every(line => ORDERED.test(line) || !line.trim())) {
      html.push(`<ol>${lines.filter(line => ORDERED.test(line)).map(line => `<li>${inlineMarkup(line.replace(ORDERED, ''))}</li>`).join('')}</ol>`);
      continue;
    }

    // Satır içi başlıkları (##) paragraf ortasında da ayır.
    let paragraph = [];
    const flush = () => {
      if (paragraph.length) {
        html.push(`<p>${inlineMarkup(paragraph.join(' '))}</p>`);
        paragraph = [];
      }
    };
    for (const line of lines) {
      const headingMatch = line.match(HEADING);
      if (headingMatch) {
        flush();
        html.push(heading(Math.min(4, Math.max(2, headingMatch[1].length)), headingMatch[2].trim()));
      } else if (BULLET.test(line)) {
        flush();
        html.push(`<ul><li>${inlineMarkup(line.replace(BULLET, ''))}</li></ul>`);
      } else {
        paragraph.push(line.trim());
      }
    }
    flush();
  }
  return html.join('\n');
}

/**
 * Gövdedeki "Sık Sorulan Sorular" bölümünü JSON-LD FAQPage için ayıklar.
 * Soru satırı "?" ile biter, ardından gelen paragraf yanıt sayılır.
 */
export function extractFaq(body = '', lang = 'tr') {
  const text = stripSourceReferences(body);
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const items = [];
  const start = lines.findIndex(line => /^#{2,3}\s*.*(?:sık sorulan|sik sorulan|sss|faq|häufige|よくある)/i.test(line));
  const slice = start >= 0 ? lines.slice(start + 1) : lines;
  const questionMark = lang === 'ja' ? /[?？]$/ : /\?$/;
  for (let i = 0; i < slice.length - 1 && items.length < 8; i += 1) {
    const question = slice[i].replace(/^#{2,3}\s+|^\d{1,2}[.)]\s+|^[-*•]\s+/, '').replace(/\*\*/g, '').trim();
    const answer = slice[i + 1].replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').trim();
    if (questionMark.test(question) && question.length >= 12 && answer.length >= 24 && !questionMark.test(answer)) {
      items.push({ question: oneLine(question, 200), answer: oneLine(answer, 600) });
      i += 1;
    }
  }
  return items;
}

/** Özet yoksa gövdeden güvenli bir meta açıklama üretir. */
export function metaDescription(summary, body, max = 158) {
  const clean = oneLine(stripSourceReferences(summary || ''), 400);
  const source = clean.length >= 50 ? clean : oneLine(stripSourceReferences(body || '').replace(/[#*_]/g, ''), 400);
  if (source.length <= max) return source;
  const cut = source.slice(0, max - 1);
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '), cut.lastIndexOf(' '));
  return `${(boundary > max * 0.5 ? cut.slice(0, boundary) : cut).trim()}…`;
}

/** Başlıktan SEO başlığı: 60 karakteri aşarsa marka eklenmez. */
export function seoTitle(title, lang = 'tr') {
  const base = oneLine(title, 120);
  const suffix = ` | ${SITE_NAME}`;
  if (!base) return SITE_NAME;
  if (base.includes(SITE_NAME)) return oneLine(base, 76);
  if (base.length + suffix.length <= 64) return `${base}${suffix}`;
  // Marka adı her sayfada görünür kalsın: başlığı kelime sınırında kısaltıp
  // " | TestoTavan" ekleriz; böylece SERP'te tutarlı bir site kimliği oluşur.
  const room = Math.max(28, 64 - suffix.length);
  const trimmed = oneLine(base, room).replace(/\s+\S*$/, '').replace(/[,;:.\-–—]+$/, '');
  return `${trimmed || oneLine(base, room)}${suffix}`;
}

/* ------------------------------------------------------------------ adres */

export function resolveSiteUrl(headers = {}, env = process.env) {
  const explicit = oneLine(env.SITE_URL || '', 300).replace(/\/+$/, '');
  if (/^https?:\/\//i.test(explicit)) return explicit;

  const vercelHost = oneLine(env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL || '', 300);
  if (vercelHost) {
    const base = vercelHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const proto = /^localhost|^127\./.test(base) ? 'http' : 'https';
    return base ? `${proto}://${base}` : DEFAULT_SITE_URL;
  }

  const host = oneLine(headers['x-forwarded-host'] || headers.host || '', 300).split(',')[0].trim();
  if (!host) return DEFAULT_SITE_URL;
  const proto = oneLine(headers['x-forwarded-proto'] || 'https', 10).split(',')[0].trim();
  return `${proto === 'http' ? 'http' : 'https'}://${host}`;
}

/**
 * Bölümlerin kendi alt alan adı (subdomain) varlığı.
 * BLOG_SITE_URL / FORUM_SITE_URL tanımlanırsa canonical, OG ve RSS adresleri
 * doğrudan o alt alan adına yazılır; tanımlı değilse yol tabanlı adres kullanılır.
 * Böylece DNS bağlandığı gün tek bir ortam değişkeniyle tüm site taşınır.
 */
export function sectionBase(section, siteUrl, env = process.env) {
  const key = section === 'forum' ? 'FORUM_SITE_URL' : 'BLOG_SITE_URL';
  const explicit = oneLine(env[key] || '', 300).replace(/\/+$/, '');
  if (/^https?:\/\//i.test(explicit)) return { base: explicit, standalone: true };
  const root = oneLine(siteUrl || DEFAULT_SITE_URL, 300).replace(/\/+$/, '');
  return { base: `${root}${section === 'forum' ? '/forum' : '/blog'}`, standalone: false };
}

export function absoluteUrl(path, base) {
  const cleanBase = oneLine(base || DEFAULT_SITE_URL, 300).replace(/\/+$/, '');
  const cleanPath = String(path || '/').startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function blogPostPath(slug) {
  return `/blog/${encodeURIComponent(String(slug || '').trim())}/`;
}

export function forumThreadPath(id) {
  return `/forum/t/${encodeURIComponent(String(id || '').trim())}/`;
}

/* ----------------------------------------------------------- json-ld / meta */

export function jsonLdScripts(blocks = []) {
  return blocks
    .filter(Boolean)
    .map(block => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
}

export function organizationLd(siteUrl) {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: `${siteUrl}/`,
    logo: `${siteUrl}/assets/logo.png`,
    email: 'testotavan@gmail.com'
  };
}

export function websiteLd(siteUrl) {
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: SITE_NAME,
    inLanguage: LANGS,
    publisher: { '@id': `${siteUrl}/#organization` }
  };
}

export function breadcrumbLd(items, siteUrl) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl)
    }))
  };
}

/* ------------------------------------------------------------------- tema */

const THEME_CSS = String.raw`
*,*::before,*::after{box-sizing:border-box}
:root{
  color-scheme:dark;
  --bg:#07070b;--bg-soft:#0b0b11;--panel:#101018;--panel-2:#15151f;
  --line:rgba(255,255,255,.09);--line-soft:rgba(255,255,255,.05);
  --text:#f3f2ee;--muted:#9c9aa6;--accent:#f5a623;--accent-2:#ffd93d;
  --ok:#2ee68a;--radius:18px;--radius-sm:12px;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
html[data-theme="community"]{
  --bg:#06090c;--bg-soft:#080f13;--panel:#0c1418;--panel-2:#101c22;
  --line:rgba(46,230,197,.16);--line-soft:rgba(46,230,197,.08);
  --text:#eafaf7;--muted:#8fa9a8;--accent:#2ee6c5;--accent-2:#7b8cff;
}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
  font-size:16px;line-height:1.65;min-height:100vh;
  background-image:radial-gradient(900px 420px at 15% -8%,rgba(245,166,35,.10),transparent 60%);
  background-repeat:no-repeat;
}
html[data-theme="community"] body{background-image:radial-gradient(900px 420px at 10% -10%,rgba(46,230,197,.10),transparent 60%)}
a{color:inherit}
img{max-width:100%}
.wrap{width:100%;max-width:1120px;margin:0 auto;padding:0 20px}
.narrow{max-width:760px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

header.site{position:sticky;top:0;z-index:50;background:rgba(7,7,11,.82);backdrop-filter:blur(18px);border-bottom:1px solid var(--line-soft)}
html[data-theme="community"] header.site{background:rgba(6,9,12,.85)}
.site-bar{display:flex;align-items:center;gap:18px;min-height:62px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;letter-spacing:.02em}
.brand img{width:28px;height:28px;border-radius:8px}
.brand span{font-size:14px;color:var(--muted);font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.site-nav{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}
.site-nav a{padding:8px 12px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;color:var(--muted);border:1px solid transparent}
.site-nav a:hover{color:var(--text);border-color:var(--line)}
.site-nav a[aria-current]{color:#0b0b0f;background:var(--accent);border-color:var(--accent)}

.hero{padding:56px 0 28px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}
.hero h1{font-family:var(--serif);font-size:clamp(32px,6vw,58px);line-height:1.04;letter-spacing:-.02em;margin:14px 0 14px;max-width:16ch}
html[data-theme="community"] .hero h1{font-family:var(--sans);font-weight:850;letter-spacing:-.03em;max-width:20ch}
.hero p{color:var(--muted);font-size:17px;max-width:62ch;margin:0}
.hero-stats{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.stat{padding:12px 16px;border:1px solid var(--line);border-radius:14px;background:var(--panel);min-width:104px}
.stat b{display:block;font-size:20px;line-height:1.2}
.stat span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}

main{padding-bottom:72px}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:24px 0 16px}
.section-head h2{font-family:var(--serif);font-size:24px;margin:0;letter-spacing:-.01em}
html[data-theme="community"] .section-head h2{font-family:var(--sans);font-weight:800}
.section-head span{color:var(--muted);font-size:13px}

.chips{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 6px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;border:1px solid var(--line);background:var(--panel);text-decoration:none;font-size:12px;font-weight:600;color:var(--muted)}
.chip:hover{color:var(--text);border-color:var(--accent)}
.chip[aria-current]{background:var(--accent);border-color:var(--accent);color:#0b0b0f}

.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.post-card{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);overflow:hidden;text-decoration:none;transition:transform .18s ease,border-color .18s ease}
.post-card:hover{transform:translateY(-3px);border-color:var(--line)}
.post-card .cover{aspect-ratio:16/9;background:linear-gradient(135deg,#1b1b26,#0d0d14);background-size:cover;background-position:center}
.post-card .cover.emoji{display:grid;place-items:center;font-size:40px}
.post-card .card-body{padding:16px 18px 20px;display:flex;flex-direction:column;gap:8px;flex:1}
.post-card h3{font-family:var(--serif);font-size:19px;line-height:1.25;margin:0;letter-spacing:-.01em}
.post-card p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.55}
.post-card .meta{display:flex;gap:12px;color:var(--muted);font-size:11.5px;margin-top:auto;padding-top:8px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:rgba(245,166,35,.12);color:var(--accent);border:1px solid rgba(245,166,35,.25)}
html[data-theme="community"] .badge{background:rgba(46,230,197,.12);border-color:rgba(46,230,197,.28)}
.badge.recipe{background:rgba(123,140,255,.14);color:#aab6ff;border-color:rgba(123,140,255,.3)}

.feature{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0;background:var(--panel);border:1px solid var(--line-soft);border-radius:24px;overflow:hidden;text-decoration:none;margin-top:8px}
.feature .cover{min-height:260px;background:linear-gradient(135deg,#20202c,#0f0f16);background-size:cover;background-position:center}
.feature .feature-body{padding:30px 30px 28px;display:flex;flex-direction:column;gap:12px;justify-content:center}
.feature h2{font-family:var(--serif);font-size:clamp(24px,3vw,34px);line-height:1.12;margin:0;letter-spacing:-.02em}
.feature p{margin:0;color:var(--muted)}
.feature .meta{display:flex;gap:14px;color:var(--muted);font-size:12px}
@media (max-width:760px){.feature{grid-template-columns:1fr}.feature .cover{min-height:180px}}

/* ---------- yazı ---------- */
.crumbs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:var(--muted);font-size:12px;padding:22px 0 0}
.crumbs a{text-decoration:none;color:var(--muted)}
.crumbs a:hover{color:var(--accent)}
.article-head{padding:26px 0 8px}
.article-head h1{font-family:var(--serif);font-size:clamp(30px,5.2vw,50px);line-height:1.06;letter-spacing:-.025em;margin:14px 0 16px}
html[data-theme="community"] .article-head h1{font-family:var(--sans)}
.article-head .lead{font-size:18px;color:#c9c6cf;margin:0 0 18px;max-width:64ch}
.byline{display:flex;flex-wrap:wrap;gap:14px;align-items:center;color:var(--muted);font-size:12.5px;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);padding:12px 0}
.avatar{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#0a0a0f;font-weight:800;font-size:12px}
.hero-cover{margin:26px 0 8px;border-radius:22px;overflow:hidden;border:1px solid var(--line-soft);aspect-ratio:16/9;background:linear-gradient(135deg,#1b1b26,#0d0d14);background-size:cover;background-position:center}
.article-body{font-size:17.5px;line-height:1.82;color:#e7e4ea;padding-top:18px}
.article-body h2{font-family:var(--serif);font-size:clamp(23px,3vw,30px);line-height:1.2;margin:42px 0 14px;letter-spacing:-.015em;scroll-margin-top:90px}
.article-body h3{font-size:20px;margin:30px 0 10px;scroll-margin-top:90px}
.article-body p{margin:0 0 20px}
.article-body ul,.article-body ol{margin:0 0 22px;padding-left:22px}
.article-body li{margin:8px 0}
.article-body a{color:var(--accent);text-underline-offset:3px}
.article-body strong{color:#fff}
.article-body blockquote{margin:0 0 22px;padding:14px 18px;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 12px 12px 0;color:#d8d4dc}
.toc{margin:24px 0 8px;padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:var(--bg-soft)}
.toc h2{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;font-family:var(--sans)}
.toc ol{margin:0;padding-left:18px}
.toc a{text-decoration:none;color:var(--text);font-size:14px}
.toc a:hover{color:var(--accent)}
.ingredients{margin:26px 0;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--bg-soft)}
.ingredients h2{margin:0 0 12px;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.ingredients ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ingredients li{display:flex;gap:10px;font-size:15px}
.ingredients li::before{content:"✓";color:var(--ok);font-weight:800}
.share{display:flex;flex-wrap:wrap;gap:10px;margin:34px 0 8px;padding-top:22px;border-top:1px solid var(--line-soft)}
.share span{align-self:center;color:var(--muted);font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-right:4px}
.share a{padding:9px 14px;border-radius:999px;border:1px solid var(--line);text-decoration:none;font-size:12.5px;font-weight:600}
.share a:hover{border-color:var(--accent);color:var(--accent)}
.cta{margin:40px 0 8px;padding:24px;border-radius:20px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(245,166,35,.12),rgba(123,140,255,.07));display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap}
html[data-theme="community"] .cta{background:linear-gradient(135deg,rgba(46,230,197,.12),rgba(123,140,255,.08))}
.cta h2{margin:0 0 6px;font-size:19px;font-family:var(--serif)}
.cta p{margin:0;color:var(--muted);font-size:14px}
.button{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:999px;background:var(--accent);color:#0b0b0f;text-decoration:none;font-weight:750;font-size:13.5px;white-space:nowrap}
.button.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
.cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.disclaimer{margin:28px 0 0;padding:16px 18px;border-radius:14px;border:1px dashed var(--line);color:var(--muted);font-size:12.5px;line-height:1.6}

/* ---------- forum konuları ---------- */
.topic-list{display:grid;gap:14px;margin-top:18px}
.topic-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;padding:18px 20px;border:1px solid var(--line-soft);border-radius:18px;background:var(--panel);text-decoration:none;transition:border-color .18s ease,transform .18s ease}
.topic-card:hover{border-color:var(--line);transform:translateY(-2px)}
.topic-card .avatar{width:44px;height:44px;font-size:14px}
.topic-card h2{font-size:17.5px;line-height:1.3;margin:0 0 6px;font-weight:750}
.topic-card .excerpt{margin:0;color:var(--muted);font-size:13.5px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.topic-card .meta{display:flex;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:11.5px;margin-top:10px}
.topic-stats{display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-size:11.5px;color:var(--muted);white-space:nowrap}
.topic-stats b{color:var(--text);font-size:14px}
.post-shell{margin-top:26px;padding:26px 28px;border:1px solid var(--line-soft);border-radius:22px;background:var(--panel)}
.post-shell .post-head{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.post-shell h1{font-family:var(--sans);font-size:clamp(25px,4vw,36px);line-height:1.2;margin:0;letter-spacing:-.02em}
.post-body{font-size:16.5px;line-height:1.8;color:#e6f3f0;white-space:pre-wrap;overflow-wrap:anywhere}
.reply{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;padding:18px 0;border-top:1px solid var(--line-soft)}
.reply .reply-head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;font-size:12.5px;color:var(--muted)}
.reply .reply-head b{color:var(--text);font-size:14px}
.reply p{margin:8px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
.quote{display:block;margin:8px 0 0;padding:10px 14px;border-left:2px solid var(--accent-2);background:rgba(123,140,255,.08);border-radius:0 10px 10px 0;font-size:13px;color:#c8d4ff}
.empty{padding:28px;border:1px dashed var(--line);border-radius:16px;color:var(--muted);text-align:center}

footer.site{margin-top:60px;border-top:1px solid var(--line-soft);padding:28px 0 40px;color:var(--muted);font-size:12.5px}
footer.site .foot-links{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px}
footer.site a{text-decoration:none;color:var(--muted)}
footer.site a:hover{color:var(--accent)}

.notfound{min-height:60vh;display:grid;place-items:center;text-align:center;padding:60px 20px}
.notfound h1{font-family:var(--serif);font-size:clamp(60px,14vw,120px);margin:0;color:var(--accent);letter-spacing:-.04em}
.notfound p{color:var(--muted);max-width:44ch;margin:10px auto 24px}

@media (max-width:640px){
  .wrap{padding:0 16px}
  .hero{padding:36px 0 18px}
  .hero h1{max-width:none}
  .site-bar{gap:10px;padding:10px 0}
  .site-nav{margin-left:0;width:100%;overflow:auto;padding-bottom:4px}
  .topic-card{grid-template-columns:auto minmax(0,1fr);gap:12px;padding:16px}
  .topic-stats{grid-column:2;flex-direction:row;gap:14px;align-items:center}
  .article-body{font-size:16.5px}
  .post-shell{padding:20px 18px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

function navItems(siteUrl, section, lang) {
  const tr = lang === 'tr';
  const home = tr ? 'Ana Sayfa' : 'Home';
  const blog = 'Blog';
  const forum = tr ? 'Forum' : 'Forum';
  const analyzer = ({
    tr: 'Test Analizi', en: 'Test Analysis', de: 'Test-Analyse', ja: 'テスト分析',
    fr: 'Analyse du test', es: 'Análisis de la prueba', bg: 'Анализ на теста',
    ru: 'Анализ теста', hi: 'टेस्ट विश्लेषण', zh: '测试分析'
  })[lang] || 'Test Analysis';
  const langQuery = lang === 'tr' ? '' : `?lang=${lang}`;
  return [
    { href: `${siteUrl}/${langQuery}`, label: home, key: 'home' },
    { href: `${siteUrl}/blog/${langQuery}`, label: blog, key: 'blog' },
    { href: `${siteUrl}/forum/${langQuery}`, label: forum, key: 'forum' },
    { href: `${siteUrl}/${langQuery}#physicalPage`, label: analyzer, key: 'analyze' }
  ].map(item => ({ ...item, current: item.key === section }));
}

/**
 * Sunucu tarafında üretilen tam HTML belgesi.
 * `theme`: 'editorial' (blog) veya 'community' (forum) — iki bölüm ilk bakışta ayrışır.
 */
export function renderPage(options = {}) {
  const {
    lang = 'tr', title, description, canonical, siteUrl = DEFAULT_SITE_URL,
    theme = 'editorial', section = 'blog', robots = 'index,follow,max-image-preview:large',
    ogType = 'website', ogImage = '', publishedTime = '', modifiedTime = '',
    alternates = [], jsonLd = [], body = '', bodyClass = ''
  } = options;

  const image = ogImage || `${siteUrl}/assets/logo.png`;
  const nav = navItems(siteUrl, section, lang);
  const altLinks = alternates
    .map(alt => `<link rel="alternate" hreflang="${escapeAttr(alt.lang)}" href="${escapeAttr(alt.href)}">`)
    .join('\n    ');

  return `<!doctype html>
<html lang="${HTML_LANG[lang] || 'tr'}" data-theme="${theme === 'community' ? 'community' : 'editorial'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${theme === 'community' ? '#06090c' : '#07070b'}">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<meta name="robots" content="${escapeAttr(robots)}">
<link rel="canonical" href="${escapeAttr(canonical)}">
${altLinks}
<link rel="icon" type="image/png" href="${siteUrl}/assets/logo.png">
<link rel="apple-touch-icon" href="${siteUrl}/assets/logo.png">
<meta property="og:type" content="${escapeAttr(ogType)}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="${escapeAttr(LOCALES[lang] || 'tr_TR')}">
<meta property="og:url" content="${escapeAttr(canonical)}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:image" content="${escapeAttr(image)}">
${publishedTime ? `<meta property="article:published_time" content="${escapeAttr(publishedTime)}">` : ''}
${modifiedTime ? `<meta property="article:modified_time" content="${escapeAttr(modifiedTime)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${escapeAttr(image)}">
<style>${THEME_CSS}</style>
${jsonLdScripts(jsonLd)}
</head>
<body class="${escapeAttr(bodyClass)}">
<header class="site">
  <div class="wrap site-bar">
    <a class="brand" href="${siteUrl}/" aria-label="${SITE_NAME} ana sayfa">
      <img src="${siteUrl}/assets/logo.webp" alt="" width="28" height="28" onerror="this.src='${siteUrl}/assets/logo.png'">
      <strong>${SITE_NAME}</strong><span>${section === 'forum' ? (lang === 'tr' ? 'Meydan' : 'Commons') : (lang === 'tr' ? 'Dergi' : 'Journal')}</span>
    </a>
    <nav class="site-nav" aria-label="${lang === 'tr' ? 'Ana gezinme' : 'Primary'}">
      ${nav.map(item => `<a href="${item.href}"${item.current ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`).join('')}
    </nav>
  </div>
</header>
<main class="${escapeAttr(bodyClass)}">
${body}
</main>
<footer class="site">
  <div class="wrap">
    <div class="foot-links">
      <a href="${siteUrl}/">${SITE_NAME}</a>
      <a href="${siteUrl}/blog/">Blog</a>
      <a href="${siteUrl}/blog/rss.xml">RSS</a>
      <a href="${siteUrl}/forum/">Forum</a>
      <a href="${siteUrl}/#aboutPage">${lang === 'tr' ? 'Hakkımızda' : 'About'}</a>
      <a href="mailto:testotavan@gmail.com">testotavan@gmail.com</a>
    </div>
    <p>${lang === 'tr'
      ? 'Sağlık içerikleri yalnızca bilgilendirme amaçlıdır; tıbbi tanı veya tedavi yerine geçmez. Kararlarınızı hekiminizle birlikte alın.'
      : 'Health content is for information only and is not a substitute for medical diagnosis or treatment. Decide together with your physician.'}</p>
    <p>© ${new Date().getFullYear()} ${SITE_NAME}</p>
  </div>
</footer>
</body>
</html>`;
}

/** 404 sayfası: arama motoruna index izni verilmez. */
export function renderNotFound({ siteUrl = DEFAULT_SITE_URL, section = 'blog', lang = 'tr' } = {}) {
  const body = `<div class="notfound wrap">
    <div>
      <div class="eyebrow">404</div>
      <h1>404</h1>
      <p>${lang === 'tr' ? 'Bu sayfa taşınmış veya kaldırılmış olabilir. Yayındaki içeriklere aşağıdan ulaşabilirsiniz.' : 'This page may have moved or been removed. Browse the published content below.'}</p>
      <div class="chips" style="justify-content:center">
        <a class="button" href="${siteUrl}/blog/">${lang === 'tr' ? 'Bloga dön' : 'Back to blog'}</a>
        <a class="button ghost" href="${siteUrl}/forum/">${lang === 'tr' ? 'Foruma git' : 'Go to forum'}</a>
      </div>
    </div>
  </div>`;
  return renderPage({
    lang, section, robots: 'noindex,follow', siteUrl,
    title: `404 | ${SITE_NAME}`,
    description: lang === 'tr' ? 'Aradığınız sayfa bulunamadı.' : 'The page you are looking for was not found.',
    canonical: `${siteUrl}${section === 'forum' ? '/forum/' : '/blog/'}`,
    body
  });
}

/** Kitap kapağı yerine kullanılan güvenli kapak adresi. */
export function safeCover(coverUrl, siteUrl) {
  const value = String(coverUrl || '').trim();
  if (/^https:\/\/[^\s<>"'`]+$/i.test(value)) return value;
  if (/^\/api\/media\/[A-Za-z0-9_-]{6,80}$/.test(value)) return `${siteUrl.replace(/\/+$/, '')}${value}`;
  return '';
}

export function formatDate(value, lang = 'tr') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString((LOCALES[lang] || 'tr_TR').replace('_', '-'), { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatNumber(value, lang = 'tr') {
  const number = Number(value) || 0;
  try { return number.toLocaleString((LOCALES[lang] || 'tr_TR').replace('_', '-')); } catch { return String(number); }
}
