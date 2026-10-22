/*
 * Haber bağlantısından (URL) otomatik blog taslağı üreten AI & içerik çıkarma modülü.
 * Bağımlılığı yoktur; hem Vercel serverless fonksiyonunda hem Node testlerinde çalışır.
 *
 * Akış:
 *  1. validateNewsUrl()        — URL doğrulama ve SSRF koruması (özel IP / localhost engeli)
 *  2. fetchNewsHtml()          — Zaman aşımlı, yönlendirme denetimli güvenli HTML çekimi
 *  3. extractArticleFromHtml() — JSON-LD, OpenGraph, meta etiketleri ve makale gövdesi çıkarma
 *  4. generateBlogFromArticle()— Gemini / OpenAI / Groq API ile (veya anahtarsız yerleşik akıllı
 *                                modla) TR + EN + DE + JA dillerinde blog taslağı üretimi
 */

import { clean, cleanTranslations, localizeDuration } from './_content-shape.js';
import { isSafeCoverUrl } from './_media.js';
import {
  ensureCompleteTranslations,
  localTranslateFields,
  localTranslateText,
  machineTranslateText,
  networkTranslationAllowed,
  pickLanguageBlock,
  coerceTranslatedFields,
  preferTranslated,
  repairTranslation,
  TARGET_LANGS
} from './_translate.js';
import { stripSourceReferences, wordCount } from './_seo.js';
import { LANG_NAMES } from './_langs.js';

export const NEWS_FETCH_TIMEOUT_MS = 10000;
export const AI_TIMEOUT_MS = 25000;
export const MAX_HTML_CHARS = 500_000;
export const MAX_REDIRECTS = 3;
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5';
export const DEFAULT_KIMI_MODEL = 'moonshot-v1-8k';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

const RETIRED_GEMINI_MODEL = /^gemini-(?:1\.0|1\.5|2\.0)(?:-|$)/i;
const RETIRED_GROQ_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct'
]);

function resolveGeminiModel(model) {
  const requested = String(model || '').trim();
  // Gemini 1.x/2.0 models are shut down; old deployment variables should not
  // silently break the admin's translation workflow.
  return !requested || RETIRED_GEMINI_MODEL.test(requested) ? DEFAULT_GEMINI_MODEL : requested;
}

function resolveGroqModel(model) {
  const requested = String(model || '').trim();
  // Migrate retired Groq model IDs that may still be stored in Vercel settings.
  return !requested || RETIRED_GROQ_MODELS.has(requested.toLowerCase()) ? DEFAULT_GROQ_MODEL : requested;
}

export const CATEGORY_MAP = {
  hormone: {
    tr: 'Hormon Sağlığı',
    en: 'Hormone Health',
    de: 'Hormongesundheit',
    ja: 'ホルモン健康',
    fr: 'Santé hormonale',
    es: 'Salud hormonal',
    bg: 'Хормонално здраве',
    ru: 'Здоровье гормонов',
    hi: 'हार्मोन स्वास्थ्य',
    zh: '激素健康',
    emoji: '🧬'
  },
  protein: {
    tr: 'Yüksek Protein',
    en: 'High Protein',
    de: 'Proteinreich',
    ja: '高たんぱく',
    fr: 'Riche en protéines',
    es: 'Alto en proteínas',
    bg: 'Високопротеинова',
    ru: 'Высокобелковая',
    hi: 'उच्च प्रोटीन',
    zh: '高蛋白',
    emoji: '🥗'
  },
  sleep: {
    tr: 'Uyku',
    en: 'Sleep',
    de: 'Schlaf',
    ja: '睡眠',
    fr: 'Sommeil',
    es: 'Sueño',
    bg: 'Сън',
    ru: 'Сон',
    hi: 'नींद',
    zh: '睡眠',
    emoji: '🌙'
  }
};

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
  hellip: '…', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™',
  Ccedil: 'Ç', ccedil: 'ç', Ouml: 'Ö', ouml: 'ö', Uuml: 'Ü', uuml: 'ü',
  Iuml: 'Ï', iuml: 'ï', Eacute: 'É', eacute: 'é', Acirc: 'Â', acirc: 'â'
};

/** HTML entity dizilerini okunabilir düz metne çözer. */
export function decodeHtmlEntities(input) {
  return String(input ?? '')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&([a-zA-Z0-9]+);/g, (full, name) => NAMED_ENTITIES[name] ?? full);
}

/**
 * SSRF koruması: localhost, özel ağ (RFC1918), link-local (169.254.x.x) ve
 * bulut metadata adreslerini reddeder.
 */
export function isBlockedHost(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;

  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv6 özel / loopback / link-local
  if (host.includes(':')) {
    if (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fe80:') ||
      host.startsWith('fe90:') ||
      host.startsWith('fea0:') ||
      host.startsWith('feb0:') ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('::ffff:')
    ) {
      return true;
    }
    return false;
  }

  // Tamamen sayısal veya hex/octal IP gösterimleri (örn. 2130706433 veya 0x7f000001)
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;

  // Standart IPv4 kontrolü
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return true;
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }

  // Nokta içermeyen tek kelimeli iç host adları
  if (!host.includes('.')) return true;

  return false;
}

/**
 * Haber bağlantısını doğrular. Yalnızca genel HTTP/HTTPS adreslerini kabul eder.
 */
export function validateNewsUrl(rawUrl) {
  const input = String(rawUrl ?? '').trim();
  if (!input) return { ok: false, error: 'Haber bağlantısı gerekli.' };
  if (input.length > 2000) return { ok: false, error: 'Bağlantı çok uzun.' };

  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, error: 'Geçerli bir haber bağlantısı (https://...) girin.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Yalnızca HTTP veya HTTPS bağlantıları desteklenir.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Kimlik bilgisi içeren bağlantılar kabul edilmez.' };
  }
  if (isBlockedHost(parsed.hostname)) {
    return { ok: false, error: 'Yerel veya özel ağ adreslerine erişilemez.' };
  }

  return { ok: true, url: parsed.href, hostname: parsed.hostname };
}

/**
 * Haber sayfasının HTML içeriğini güvenli şekilde çeker.
 * Yönlendirmeleri her adımda SSRF süzgecinden geçirir ve zaman aşımı uygular.
 */
export async function fetchNewsHtml(rawUrl, options = {}) {
  const check = validateNewsUrl(rawUrl);
  if (!check.ok) return check;

  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? NEWS_FETCH_TIMEOUT_MS;
  let currentUrl = check.url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TestoTavanBot/1.0; +https://testosteron-test.vercel.app)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers?.get?.('location') || response.headers?.location || '';
        if (!location) return { ok: false, error: 'Haber bağlantısı geçersiz bir yönlendirme döndürdü.' };
        const resolved = new URL(location, currentUrl).href;
        const hopCheck = validateNewsUrl(resolved);
        if (!hopCheck.ok) return hopCheck;
        currentUrl = hopCheck.url;
        continue;
      }

      if (response.url) {
        const finalCheck = validateNewsUrl(response.url);
        if (!finalCheck.ok) return finalCheck;
      }

      if (!response.ok) {
        return { ok: false, status: response.status, error: `Haber sayfası açılamadı (HTTP ${response.status}).` };
      }

      const contentType = String(response.headers?.get?.('content-type') || response.headers?.['content-type'] || '').toLowerCase();
      if (contentType && /^(image|video|audio|application\/pdf|application\/octet-stream)\b/.test(contentType)) {
        return { ok: false, error: 'Bağlantı bir haber metni yerine medya/dosya içeriyor.' };
      }

      const html = String(await response.text()).slice(0, MAX_HTML_CHARS);
      if (!html.trim()) {
        return { ok: false, error: 'Haber sayfası boş yanıt döndürdü.' };
      }

      return { ok: true, html, finalUrl: currentUrl };
    } catch (error) {
      clearTimeout(timer);
      const isAbort = error?.name === 'AbortError';
      return {
        ok: false,
        error: isAbort ? 'Haber sayfası zaman aşımına uğradı.' : 'Haber sayfasına bağlanılamadı.'
      };
    }
  }

  return { ok: false, error: 'Çok fazla yönlendirme tespit edildi.' };
}

/** Meta etiketi değerini (property veya name ile) HTML içinden okur. */
function getMetaContent(html, keys) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*>`, 'i')
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const decoded = decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim();
        if (decoded) return decoded;
      }
    }
  }
  return '';
}

/** HTML etiketlerini temizleyip tek satır düz metin döner. */
function stripTags(fragment) {
  return decodeHtmlEntities(
    String(fragment ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** JSON-LD script bloklarını bozuk sayfaları atlayarak dolaşır. */
function visitJsonLd(html, predicate) {
  const scripts = [...String(html ?? '').matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const visit = node => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    const found = predicate(node);
    if (found) return found;
    for (const value of Object.values(node)) {
      if (!value || typeof value !== 'object') continue;
      const nested = visit(value);
      if (nested) return nested;
    }
    return null;
  };

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const found = visit(parsed);
      if (found) return found;
    } catch {
      // Bozuk JSON-LD blokları yoksayılır.
    }
  }
  return null;
}

function schemaTypes(node) {
  const raw = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return raw.filter(Boolean).map(type => String(type).toLowerCase().split(/[\/#]/).filter(Boolean).at(-1));
}

function jsonLdImage(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return jsonLdImage(value[0]);
  return String(value?.url || value?.contentUrl || '').trim();
}

function normalizeRecipeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return decodeHtmlEntities(String(value)).replace(/\s+/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map(normalizeRecipeText).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    return normalizeRecipeText(value.text || value.name || value.description || '');
  }
  return '';
}

function collectHowToSteps(value, output = []) {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = normalizeRecipeText(value);
    if (text) output.push(text);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectHowToSteps(item, output));
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  if (value.itemListElement) return collectHowToSteps(value.itemListElement, output);
  const text = normalizeRecipeText(value.text || value.description || '');
  if (text) output.push(text);
  else if (value.name && schemaTypes(value).includes('howtostep')) output.push(normalizeRecipeText(value.name));
  return output;
}

function formatIsoDuration(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^P(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)$/i);
  if (!match) return '';
  const hours = Number(String(match[1] || 0).replace(',', '.'));
  const minutes = Number(String(match[2] || 0).replace(',', '.'));
  const seconds = Number(String(match[3] || 0).replace(',', '.'));
  const total = Math.round(hours * 60 + minutes + seconds / 60);
  if (total >= 60 && total % 60 === 0) return `${total / 60} saat`;
  return total ? `${total} dk` : '';
}

function extractJsonLdArticle(html) {
  const articleTypes = new Set(['newsarticle', 'article', 'blogposting', 'reportagenewsarticle', 'medicalwebpage', 'webpage']);
  return visitJsonLd(html, node => {
    if (!schemaTypes(node).some(type => articleTypes.has(type)) || !(node.headline || node.articleBody || node.description)) return null;
    return {
      title: normalizeRecipeText(node.headline || node.name || ''),
      description: normalizeRecipeText(node.description || ''),
      body: decodeHtmlEntities(node.articleBody || '').replace(/\r\n/g, '\n').trim(),
      image: jsonLdImage(node.image)
    };
  });
}

function extractJsonLdRecipe(html) {
  return visitJsonLd(html, node => {
    if (!schemaTypes(node).includes('recipe')) return null;
    const ingredients = Array.isArray(node.recipeIngredient) ? node.recipeIngredient : (node.recipeIngredient ? [node.recipeIngredient] : []);
    const nutrition = node.nutrition && typeof node.nutrition === 'object' ? node.nutrition : {};
    const nutritionFacts = {};
    for (const key of ['calories', 'proteinContent', 'fatContent', 'carbohydrateContent', 'fiberContent', 'sodiumContent']) {
      const value = normalizeRecipeText(nutrition[key]);
      if (value) nutritionFacts[key] = value;
    }
    return {
      name: normalizeRecipeText(node.name || node.headline || ''),
      description: normalizeRecipeText(node.description || ''),
      ingredients: ingredients.map(normalizeRecipeText).filter(Boolean).slice(0, 100),
      instructions: collectHowToSteps(node.recipeInstructions).slice(0, 100),
      yield: normalizeRecipeText(node.recipeYield || ''),
      category: normalizeRecipeText(node.recipeCategory || ''),
      prepTime: formatIsoDuration(node.prepTime),
      cookTime: formatIsoDuration(node.cookTime),
      totalTime: formatIsoDuration(node.totalTime),
      nutrition: nutritionFacts,
      image: jsonLdImage(node.image)
    };
  });
}

function extractHtmlRecipeSections(html) {
  const source = String(html || '');
  const sectionItems = patterns => {
    const headings = [...source.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
    for (let index = 0; index < headings.length; index += 1) {
      const headingText = stripTags(headings[index][2]).toLocaleLowerCase('tr');
      if (!patterns.test(headingText)) continue;
      const end = headings[index + 1]?.index ?? source.length;
      const section = source.slice(headings[index].index + headings[index][0].length, end).slice(0, 12000);
      const listItems = [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(match => stripTags(match[1])).filter(Boolean);
      if (listItems.length) return listItems;
      const paragraphs = [...section.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => stripTags(match[1])).filter(Boolean);
      if (paragraphs.length) return paragraphs;
    }
    return [];
  };

  const ingredientValues = [];
  const itempropPattern = /<([a-z][\w:-]*)\b([^>]*\bitemprop\s*=\s*["']recipeIngredient["'][^>]*)>(?:([\s\S]*?)<\/\1\s*>)?/gi;
  let match;
  while ((match = itempropPattern.exec(source)) !== null) {
    const content = match[2].match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1] || match[3] || '';
    const text = stripTags(content).replace(/\s+/g, ' ').trim();
    if (text && !ingredientValues.includes(text)) ingredientValues.push(text);
  }

  if (!ingredientValues.length) {
    const ingredientListPattern = /<(ul|ol)\b([^>]*(?:class|id)\s*=\s*["'][^"']*(?:ingredient|malzeme|zutat)[^"']*["'][^>]*)>([\s\S]*?)<\/\1>/gi;
    const list = ingredientListPattern.exec(source);
    if (list) {
      ingredientValues.push(...[...list[3].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(item => stripTags(item[1])).filter(Boolean));
    }
  }
  if (!ingredientValues.length) {
    ingredientValues.push(...sectionItems(/\b(ingredients?|malzemeler|malzeme listesi|zutaten)\b/i));
  }

  const instructions = sectionItems(/\b(method|directions?|instructions?|preparation|hazırlanış|hazırlanışı|nasıl yapılır|zubereitung)\b/i);
  return {
    name: '',
    description: '',
    ingredients: [...new Set(ingredientValues)].slice(0, 100),
    instructions: [...new Set(instructions)].slice(0, 100),
    yield: '', category: '', prepTime: '', cookTime: '', totalTime: '', nutrition: {}, image: ''
  };
}

/** Görsel bağlantısını kaynak URL'ye göre mutlaklaştırır ve güvenli HTTPS ise döner. */
function resolveSafeImage(rawImage, sourceUrl) {
  const candidate = String(rawImage ?? '').trim();
  if (!candidate) return '';
  try {
    const resolved = sourceUrl ? new URL(candidate, sourceUrl).href : candidate;
    return isSafeCoverUrl(resolved);
  } catch {
    return isSafeCoverUrl(candidate);
  }
}

/**
 * Haber HTML'inden başlık, özet, ana metin, kapak görseli ve site bilgisini çıkarır.
 */
export function extractArticleFromHtml(html, sourceUrl = '') {
  const source = String(html ?? '');
  if (!source.trim()) {
    return { ok: false, error: 'Haber içeriği boş.' };
  }

  const ld = extractJsonLdArticle(source);
  const jsonRecipe = extractJsonLdRecipe(source);

  const ogTitle = getMetaContent(source, ['og:title', 'twitter:title']);
  const ogDesc = getMetaContent(source, ['og:description', 'twitter:description', 'description']);
  const ogImage = getMetaContent(source, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']);
  const siteName = getMetaContent(source, ['og:site_name', 'application-name']);

  const titleTagMatch = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  // Gürültülü blokları temizle
  const cleanedHtml = source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|form|nav|footer|aside|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');

  const htmlRecipe = extractHtmlRecipeSections(cleanedHtml);
  const recipe = jsonRecipe || (htmlRecipe.ingredients.length ? htmlRecipe : null);
  if (recipe && jsonRecipe) {
    if (!recipe.instructions.length) recipe.instructions = htmlRecipe.instructions;
    if (!recipe.ingredients.length) recipe.ingredients = htmlRecipe.ingredients;
    if (!recipe.name) recipe.name = htmlRecipe.name;
    if (!recipe.description) recipe.description = htmlRecipe.description;
    if (!recipe.image) recipe.image = htmlRecipe.image;
  }

  // Varsa <article> veya <main> alanına odaklan
  const articleMatch = cleanedHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleanedHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let contentZone = cleanedHtml;
  if (articleMatch && stripTags(articleMatch[1]).length >= 180) {
    contentZone = articleMatch[1];
  } else if (mainMatch && stripTags(mainMatch[1]).length >= 180) {
    contentZone = mainMatch[1];
  }

  // Paragrafları ve alt başlıkları topla
  const blocks = [];
  const seen = new Set();
  const blockRegex = /<(p|h2|h3|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = blockRegex.exec(contentZone)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripTags(match[2]).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const minLen = tag.startsWith('h') ? 12 : 35;
    if (text.length < minLen) continue;
    if (/^(çerez|cookie|abone ol|bülten|tüm hakları|copyright|reklam|advertisement|paylaş|share)/i.test(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    blocks.push(text);
  }

  let bodyText = blocks.join('\n\n');
  if (ld?.body && ld.body.length > bodyText.length) {
    bodyText = ld.body;
  }
  if (!bodyText) {
    bodyText = stripTags(contentZone).slice(0, 12000);
  }
  if (recipe?.instructions?.length) {
    bodyText = recipe.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n\n');
  }
  bodyText = bodyText.slice(0, 12000).trim();

  const cleanedTitleTag = titleTagMatch
    ? stripTags(titleTagMatch[1]).replace(/\s+[|\-—–]\s+[^|\-—–]{2,45}$/, '').trim()
    : '';

  const rawTitle = (
    recipe?.name ||
    ld?.title ||
    ogTitle ||
    (h1Match ? stripTags(h1Match[1]) : '') ||
    cleanedTitleTag
  ).replace(/\s+/g, ' ').trim();

  // Yalnızca "| Site Adı" biçimindeki dikey çizgi eklerini veya site adını temizle
  const cleanTitle = rawTitle
    .replace(/\s+\|\s+[^|]{2,45}$/, '')
    .trim() || rawTitle;

  const description = (
    recipe?.description ||
    ld?.description ||
    ogDesc ||
    blocks[0] ||
    bodyText.slice(0, 240)
  ).replace(/\s+/g, ' ').trim();

  const image = resolveSafeImage(ogImage || ld?.image || recipe?.image || '', sourceUrl);

  let hostname = '';
  try {
    hostname = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : '';
  } catch {}

  if (!cleanTitle && bodyText.length < 40) {
    return { ok: false, error: 'Haber sayfasından anlamlı başlık veya metin çıkarılamadı.' };
  }

  return {
    ok: true,
    article: {
      url: sourceUrl,
      siteName: siteName || hostname,
      title: cleanTitle || 'Sağlık ve Yaşam Haberi',
      description,
      body: bodyText || description,
      image,
      type: recipe?.ingredients?.length ? 'recipe' : 'blog',
      recipe: recipe?.ingredients?.length ? recipe : null
    }
  };
}

/**
 * Haber metninin içeriğine göre en uygun TestoTavan kategorisini belirler.
 */
export function classifyArticleCategory(article) {
  const hay = `${article?.title || ''} ${article?.description || ''} ${article?.body || ''}`.toLowerCase();

  const sleepHits = (hay.match(/\b(uyku|uykusuzluk|gece|melatonin|sirkadiyen|horlama|apne|sleep|insomnia|circadian|rem|schlaf|naps?)\b/g) || []).length;
  const proteinHits = (hay.match(/\b(protein|beslenme|diyet|yemek|tarif|gıda|vitamin|mineral|çinko|magnezyum|omega|yumurta|tavuk|balık|et|kalori|nutrition|diet|food|meal|zinc|magnesium)\b/g) || []).length;
  const hormoneHits = (hay.match(/\b(testosteron|hormon|kortizol|androjen|egzersiz|antrenman|kas|stres|libido|fertilit|sperm|testosterone|hormone|cortisol|muscle|workout|resistance)\b/g) || []).length;

  if (sleepHits >= 2 && sleepHits >= proteinHits && sleepHits >= hormoneHits) {
    return CATEGORY_MAP.sleep;
  }
  if (proteinHits >= 2 && proteinHits > hormoneHits) {
    return CATEGORY_MAP.protein;
  }
  return CATEGORY_MAP.hormone;
}

/** Metin uzunluğundan Türkçe okuma süresi ("4 dk") hesaplar. */
export function estimateReadingTime(text) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.min(12, Math.ceil(words / 160) || 4));
  return `${minutes} dk`;
}

/**
 * Yerleşik taslağın "günlük hayata çeviri" ve değerlendirme blokları.
 * Makine çevirisine bırakılmaz: her dilde doğal, elle yazılmış metin kullanılır.
 */
const FALLBACK_SECTIONS = {
  tr: {
    practice: ['## Günlük Hayata Çeviri',
      '- Uyku saatini sabitleyin: her gün aynı saatte yatıp aynı saatte kalkın.',
      '- Sabah ilk 30 dakikada doğal gün ışığı alın.',
      '- Haftada 2–3 direnç antrenmanı planlayın.',
      '- Protein, çinko ve magnezyumu günlük düzende tutun.',
      '- Stres yönetimini (nefes, yürüyüş, ekran molası) programa ekleyin.'].join('\n'),
    assessment: 'TestoTavan Değerlendirmesi:\nUyku kalitesi, dengeli beslenme, düzenli direnç egzersizi ve stres yönetimi genel sağlık ile hormonal dengeyi destekleyen temel yapı taşlarıdır. Yeni araştırmaları değerlendirirken kişisel sağlık durumunuzu ve laboratuvar bulgularınızı bir hekimle birlikte ele almanız önerilir.'
  },
  en: {
    practice: ['## Putting it into practice',
      '- Fix your sleep window: go to bed and wake up at the same time every day.',
      '- Get natural daylight within the first 30 minutes after waking.',
      '- Plan 2–3 resistance sessions per week.',
      '- Keep protein, zinc and magnesium consistent in your daily routine.',
      '- Schedule stress management (breathing, walking, screen breaks).'].join('\n'),
    assessment: 'TestoTavan assessment:\nSleep quality, balanced nutrition, regular resistance training and stress management are the building blocks of general health and hormonal balance. Review new findings together with your physician and your own lab results.'
  },
  de: {
    practice: ['## In den Alltag übersetzen',
      '- Fixiere dein Schlaffenster: Geh jeden Tag zur gleichen Zeit ins Bett und steh zur gleichen Zeit auf.',
      '- Hole dir in den ersten 30 Minuten nach dem Aufwachen natürliches Tageslicht.',
      '- Plane 2–3 Krafttrainings pro Woche.',
      '- Halte Protein, Zink und Magnesium täglich konstant.',
      '- Nimm Stressmanagement (Atmen, Spazieren, Bildschirmpausen) in deinen Plan auf.'].join('\n'),
    assessment: 'TestoTavan-Einschätzung:\nSchlafqualität, ausgewogene Ernährung, regelmäßiges Krafttraining und Stressmanagement sind die Grundbausteine von Gesundheit und Hormonbalance. Besprich neue Erkenntnisse mit deiner Ärztin oder deinem Arzt und deinen eigenen Laborwerten.'
  },
  ja: {
    practice: ['## 日常生活への落とし込み',
      '- 睡眠時間を固定しましょう。毎日同じ時刻に寝て、同じ時刻に起きます。',
      '- 起床後30分以内に自然光を浴びましょう。',
      '- 週2〜3回の筋力トレーニングを計画しましょう。',
      '- たんぱく質・亜鉛・マグネシウムを毎日安定して摂りましょう。',
      '- ストレス管理（呼吸法、散歩、画面から離れる時間）を予定に入れましょう。'].join('\n'),
    assessment: 'TestoTavanの評価:\n睡眠の質、バランスの取れた食事、定期的な筋力トレーニング、ストレス管理は、健康とホルモンバランスの土台です。新しい研究は、主治医と自分の検査結果とあわせて評価してください。'
  }
};

// Yerleşik (sözlük tabanlı) bölümler yalnızca yerel sözlüğü olan diller içindir.
// Diğer dillerde İngilizce iskelet kullanılır; yayın aşamasında ensureCompleteTranslations
// bu dilleri "incomplete" olarak işaretler ve Türkçe metin asla sızmaz.
const FALLBACK_SECTIONS_LANGS = new Set(Object.keys(FALLBACK_SECTIONS));
const fallbackSectionsLang = lang => (FALLBACK_SECTIONS_LANGS.has(lang) ? lang : 'en');

const FAQ_HEADING = {
  tr: 'Sık Sorulan Sorular', en: 'Frequently Asked Questions', de: 'Häufige Fragen', ja: 'よくある質問'
};

const FAQ_QUESTIONS = {
  tr: ['Bu yazı hangi konuyu ele alıyor?', 'Araştırmanın öne çıkan bulgusu nedir?', 'Bu bilgiler günlük hayatta nasıl kullanılır?'],
  en: ['What does this article cover?', 'What is the main finding of the research?', 'How can I use this information in daily life?'],
  de: ['Worum geht es in diesem Artikel?', 'Was ist das zentrale Ergebnis der Studie?', 'Wie lässt sich das im Alltag umsetzen?'],
  ja: ['この記事は何を扱っていますか？', '研究の主な発見は何ですか？', 'この情報を日常生活でどう活かせますか？']
};

/**
 * Yedek taslaklara yapılandırılmış SSS ekler. Her yanıt 24+ karakterdir ve
 * soru işaretiyle bitmez; böylece /blog/<slug>/ sayfası FAQPage JSON-LD üretir.
 */
function fallbackFaq(lang, answers) {
  const resolved = fallbackSectionsLang(lang);
  const questions = FAQ_QUESTIONS[resolved];
  const cleaned = answers.map(value => String(value || '').replace(/\s+/g, ' ').replace(/^[-*•]\s+/, '').trim());
  const pairs = cleaned.slice(0, 3).map((answer, index) => [questions[index], answer]);
  return `## ${FAQ_HEADING[resolved]}\n${pairs.map(([question, answer]) => `${question}\n${answer}`).join('\n\n')}`;
}

function firstHighlight(body) {
  const match = String(body || '').match(/^\d{1,2}\.\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function lastBullet(section) {
  const lines = String(section || '').split('\n').filter(line => /^[-*•]\s+/.test(line));
  return lines.length ? lines.at(-1).replace(/^[-*•]\s+/, '').trim() : '';
}

/**
 * AI yanıtı olmadan veya AI servisine ulaşılamadığında devreye giren
 * yerleşik akıllı blog oluşturucu (TR + yerel sözlüğü olan EN, DE, JA).
 */
export function buildFallbackBlogPost(article) {
  const cat = classifyArticleCategory(article);
  const titleTr = clean(article?.title || 'Güncel Sağlık Araştırması ve Hormon Dengesi', 100);
  const rawParagraphs = String(article?.body || article?.description || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length >= 30);

  const summarySource = article?.description || rawParagraphs[0] || titleTr;
  const summaryTr = clean(summarySource, 240);

  // Anahtar çıkarımlar için en bilgilendirici cümleleri seç
  const sentences = (rawParagraphs.join(' ') || summaryTr)
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 220);

  const highlights = sentences.slice(0, 4);
  // Uzun kaynaklarda daha fazla bağlam taşınır; yine de gövde sınırlı tutulur.
  const mainParagraphs = rawParagraphs.slice(0, 12);

  // Ortak gövde: çeviri motoruna yalnızca kaynak cümleler gider.
  const sharedBody = [
    mainParagraphs.length ? mainParagraphs.join('\n\n') : summaryTr,
    highlights.length
      ? `## Öne Çıkan Noktalar\n${highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : ''
  ].filter(Boolean).join('\n\n');

  const faqTr = fallbackFaq('tr', [
    summaryTr,
    highlights[0] || summaryTr,
    lastBullet(FALLBACK_SECTIONS.tr.practice) || FALLBACK_SECTIONS.tr.assessment.split('\n')[1]
  ]);
  const sectionsTr = `${FALLBACK_SECTIONS.tr.practice}\n\n${faqTr}\n\n${FALLBACK_SECTIONS.tr.assessment}`;
  const bodyTr = clean(stripSourceReferences(`${sharedBody}\n\n${sectionsTr}`), 20000);
  const timeTr = estimateReadingTime(bodyTr);

  const source = {
    category: cat.tr,
    title: titleTr,
    summary: summaryTr,
    body: stripSourceReferences(sharedBody),
    time: timeTr
  };

  const translations = {};
  for (const lang of ['en', 'de', 'ja']) {
    const baseTranslation = localTranslateFields(source, lang);
    const localizedBody = String(baseTranslation.body || '').replace(
      /(^|\n)(?:##\s*)?(?:Öne Çıkan Noktalar|Key Points|Wichtige Punkte|要点)[:：]?/g,
      `$1## ${({ en: 'Key Points', de: 'Wichtige Punkte', ja: '要点' })[lang]}`
    );
    const localizedSections = [
      FALLBACK_SECTIONS[lang].practice,
      fallbackFaq(lang, [
        baseTranslation.summary,
        firstHighlight(localizedBody) || baseTranslation.summary,
        lastBullet(FALLBACK_SECTIONS[lang].practice) || FALLBACK_SECTIONS[lang].assessment.split('\n')[1]
      ]),
      FALLBACK_SECTIONS[lang].assessment
    ].join('\n\n');
    translations[lang] = {
      ...baseTranslation,
      category: cat[lang],
      body: clean(stripSourceReferences([localizedBody, localizedSections].filter(Boolean).join('\n\n')), 20000)
    };
  }

  return {
    type: 'blog',
    category: cat.tr,
    title: titleTr,
    emoji: cat.emoji,
    time: timeTr,
    summary: summaryTr,
    body: bodyTr,
    cover_url: resolveSafeImage(article?.image || '', article?.url || ''),
    translations
  };
}

/**
 * Üretilen ham AI çıktısını /api/content şemasına ve karakter sınırlarına göre temizler.
 * Eksik kalan alanları yerleşik yedek taslaktan tamamlar.
 */
export function buildFallbackRecipePost(article) {
  const recipe = article?.recipe || {};
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(value => clean(value, 200)).filter(Boolean).slice(0, 100) : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions.map(value => clean(value, 2000)).filter(Boolean).slice(0, 100) : [];
  const title = clean(recipe.name || article?.title || 'Yemek Tarifi', 100);
  const category = clean(recipe.category, 60) || CATEGORY_MAP.protein.tr;
  const time = clean(recipe.totalTime || [recipe.prepTime, recipe.cookTime].filter(Boolean).join(' + ') || recipe.prepTime || recipe.cookTime || '', 30) || 'Süre belirtilmemiş';
  const summary = clean(article?.description || `${title}: kaynakta ${ingredients.length} malzeme${recipe.yield ? ` ve ${recipe.yield} porsiyon bilgisi` : ''} listeleniyor.`, 240);
  const nutritionLabels = { calories: 'Kalori', proteinContent: 'Protein', fatContent: 'Yağ', carbohydrateContent: 'Karbonhidrat', fiberContent: 'Lif', sodiumContent: 'Sodyum' };
  const facts = recipe.nutrition && typeof recipe.nutrition === 'object' ? Object.entries(recipe.nutrition) : [];
  const nutritionText = facts.length
    ? facts.map(([key, value]) => `${nutritionLabels[key] || key}: ${value}`).join(' · ')
    : 'Kaynak sayfada porsiyon başına besin değerleri verilmediği için kesin kalori veya makro değeri çıkarılmadı. Hesaplayıcı, tanınan malzemeler ve girilen gramajlar üzerinden yaklaşık değer gösterir.';
  const bodyParts = [
    instructions.length
      ? `Hazırlanışı:\n${instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
      : 'Hazırlanış adımları kaynak sayfadan alınamadı; bu adımları yayınlamadan önce ekleyip doğrulayın.',
    `Tarif Analizi:\nKaynakta ${ingredients.length} malzeme${recipe.yield ? ` ve ${recipe.yield}` : ''} bilgisi bulunuyor. Tarifin içeriği aşağıdaki malzeme listesine dayanır; kaynakta olmayan miktarlar veya sağlık etkileri varsayılmamıştır.`,
    `Besin Değeri Notu:\n${nutritionText}`
  ].filter(Boolean);
  const body = clean(stripSourceReferences(bodyParts.join('\n\n')), 20000);
  const source = { category, title, summary, body, time, ingredients };
  return {
    type: 'recipe', category, title, emoji: '🍽️', time, summary, body,
    cover_url: resolveSafeImage(article?.image || recipe.image || '', article?.url || ''),
    ingredients,
    translations: {
      en: localTranslateFields(source, 'en'),
      de: localTranslateFields(source, 'de'),
      ja: localTranslateFields(source, 'ja')
    }
  };
}

export function normalizeGeneratedRecipe(raw, article) {
  const fallback = buildFallbackRecipePost(article);
  const recipe = article?.recipe || {};
  const rawIngredients = Array.isArray(raw?.ingredients) ? raw.ingredients : [];
  // The extracted source list takes precedence so an LLM cannot silently omit or invent items.
  const ingredients = (recipe.ingredients?.length ? recipe.ingredients : rawIngredients)
    .map(value => clean(value, 200)).filter(Boolean).slice(0, 100);
  const title = clean(raw?.title, 100) || fallback.title;
  const summary = clean(raw?.summary, 240) || fallback.summary;
  const body = clean(raw?.body, 20000) || fallback.body;
  const category = clean(raw?.category, 60) || fallback.category;
  const emoji = clean(raw?.emoji, 8) || fallback.emoji;
  const time = clean(raw?.time, 30) || fallback.time;
  const cover_url = isSafeCoverUrl(raw?.cover_url || article?.image || fallback.cover_url);
  const source = { category, title, summary, body, time, ingredients };
  const translations = cleanTranslations(collectedTranslations(raw));

  for (const lang of ['en', 'de', 'ja']) {
    const current = translations[lang];
    const backup = fallback.translations[lang];
    current.category = current.category || backup.category;
    current.title = clean(preferTranslated(current.title, backup.title, title, lang), 100);
    current.summary = clean(preferTranslated(current.summary, backup.summary, summary, lang), 240);
    current.body = clean(preferTranslated(current.body, backup.body, body, lang), 20000);
    current.time = current.time || backup.time || localizeDuration(time, lang);
    current.ingredients = current.ingredients.length ? current.ingredients : backup.ingredients;
    const repaired = repairTranslation(current, source, lang);
    current.category = repaired.category || current.category;
    current.time = repaired.time || current.time;
    current.ingredients = repaired.ingredients;
  }

  return { type: 'recipe', category, title, emoji, time, summary, body, cover_url, ingredients, translations };
}

function collectedTranslations(raw) {
  const bag = { ...(raw?.translations && typeof raw.translations === 'object' ? raw.translations : {}) };
  for (const lang of TARGET_LANGS) {
    if (!pickLanguageBlock(bag, lang)) {
      const top = pickLanguageBlock(raw, lang);
      if (top) bag[lang] = top;
    }
  }
  const normalized = {};
  for (const lang of TARGET_LANGS) {
    const block = coerceTranslatedFields(pickLanguageBlock(bag, lang)) || {};
    normalized[lang] = block;
  }
  return normalized;
}

export function normalizeGeneratedBlog(raw, article) {
  const fallback = buildFallbackBlogPost(article);
  const cat = classifyArticleCategory({
    title: raw?.title || article?.title,
    description: raw?.summary || article?.description,
    body: raw?.body || article?.body
  });

  const title = clean(stripSourceReferences(raw?.title || ''), 100) || fallback.title;
  const summary = clean(stripSourceReferences(raw?.summary || ''), 240) || fallback.summary;
  const body = clean(stripSourceReferences(raw?.body || ''), 20000) || fallback.body;
  const category = clean(raw?.category, 60) || cat.tr;
  const emoji = clean(raw?.emoji, 8) || cat.emoji;
  const time = clean(raw?.time, 30) || estimateReadingTime(body);
  const cover_url = isSafeCoverUrl(raw?.cover_url || article?.image || fallback.cover_url);
  const source = { category, title, summary, body, time };

  const cleanedTrans = cleanTranslations(collectedTranslations(raw));
  const defaultCats = Object.fromEntries(TARGET_LANGS.map(lang => [lang, cat[lang] || cat.en]));

  for (const lang of TARGET_LANGS) {
    const t = cleanedTrans[lang];
    const fb = fallback.translations[lang] || fallback.translations.en;
    t.category = t.category || defaultCats[lang];
    t.title = clean(stripSourceReferences(preferTranslated(t.title, fb.title, title, lang)), 100);
    t.summary = clean(stripSourceReferences(preferTranslated(t.summary, fb.summary, summary, lang)), 240);
    t.body = clean(stripSourceReferences(preferTranslated(t.body, fb.body, body, lang)), 20000);
    t.time = t.time || localizeDuration(time, lang);
    t.ingredients = [];
    const repaired = repairTranslation(t, source, lang);
    t.category = repaired.category || t.category;
    t.time = repaired.time || t.time;
  }

  return {
    type: 'blog',
    category,
    title,
    emoji,
    time,
    summary,
    body,
    cover_url,
    translations: cleanedTrans
  };
}

/**
 * Yayın kalite kapısı: AI taslağı yayına çıkmadan önce ölçülebilir kurallarla denetlenir.
 * Sorun listesi hem yeniden deneme istemine hem admin panelindeki kalite kartına gider.
 */
export function assessBlogDraft(item = {}) {
  const body = String(item?.body || '');
  const words = wordCount(body);
  const issues = [];
  if (words < 350) issues.push(`gövde çok kısa (${words} kelime)`);
  if (/^\s*(?:kaynak|kaynakça|referans|source|references?|quellen)\s*[:：]/im.test(body)) issues.push('kaynakça/atıf satırı içeriyor');
  if (/(?:https?:\/\/|www\.)/i.test(body)) issues.push('gövdede çıplak bağlantı var');
  const headings = (body.match(/^##\s+\S/gm) || []).length;
  if (headings < 2) issues.push('en az iki "## " bölüm başlığı yok');
  if (/(?:sık sorulan|frequently asked|faq|häufige fragen|よくある)/i.test(body) && !/[?？]/.test(body)) issues.push('SSS bölümünde soru yok');
  if (!/^##\s+.*(?:sık sorulan|frequently asked|faq|häufige fragen|よくある)/im.test(body)) issues.push('SSS (FAQ) bölümü yok');
  if (String(item?.title || '').length > 95) issues.push('başlık 95 karakteri aşıyor');
  if (String(item?.summary || '').length > 240) issues.push('özet 240 karakteri aşıyor');
  const penalty = issues.length * 18 + Math.max(0, 350 - words) / 5;
  return { ok: issues.length === 0, score: Math.max(0, Math.round(100 - penalty)), issues, words };
}

/**
 * Ortam değişkenlerinden veya istek seçeneklerinden kullanılacak AI sağlayıcısını çözer.
 */
function canonicalProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  if (provider === 'anthropic') return 'claude';
  if (provider === 'moonshot') return 'kimi';
  return ['gemini', 'openai', 'groq', 'claude', 'kimi', 'deepseek'].includes(provider) ? provider : '';
}

function providerEnvironment(provider, env) {
  const entries = {
    gemini: { key: env.GEMINI_API_KEY, model: env.GEMINI_MODEL },
    openai: { key: env.OPENAI_API_KEY, model: env.OPENAI_MODEL },
    groq: { key: env.GROQ_API_KEY, model: env.GROQ_MODEL },
    claude: { key: env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY, model: env.CLAUDE_MODEL || env.ANTHROPIC_MODEL },
    kimi: { key: env.MOONSHOT_API_KEY || env.KIMI_API_KEY, model: env.KIMI_MODEL || env.MOONSHOT_MODEL },
    deepseek: { key: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL }
  };
  return entries[provider] || { key: '', model: '' };
}

function providerConfig(provider, apiKey, model, env) {
  const configured = providerEnvironment(provider, env);
  const modelValue = String(model || configured.model || '').trim();
  const defaults = {
    gemini: resolveGeminiModel(modelValue),
    openai: modelValue || 'gpt-4o-mini',
    groq: resolveGroqModel(modelValue),
    claude: modelValue || DEFAULT_CLAUDE_MODEL,
    kimi: modelValue || DEFAULT_KIMI_MODEL,
    deepseek: modelValue || DEFAULT_DEEPSEEK_MODEL
  };
  return { provider, apiKey: String(apiKey || '').trim(), model: defaults[provider] };
}

export function resolveAiProvider(options = {}, env = process.env) {
  const explicitKey = String(options.apiKey ?? '').trim();
  const requested = String(options.provider ?? '').trim();
  const explicitProvider = canonicalProvider(requested);

  if (requested && !explicitProvider) return null;
  if (explicitProvider) {
    const configured = providerEnvironment(explicitProvider, env);
    const key = explicitKey || String(configured.key || '').trim();
    return key ? providerConfig(explicitProvider, key, options.model, env) : null;
  }

  if (explicitKey) {
    let inferred = 'openai';
    if (explicitKey.startsWith('AIza')) inferred = 'gemini';
    else if (explicitKey.startsWith('gsk_')) inferred = 'groq';
    else if (explicitKey.startsWith('sk-ant-')) inferred = 'claude';
    return providerConfig(inferred, explicitKey, options.model, env);
  }

  for (const provider of ['gemini', 'openai', 'claude', 'kimi', 'deepseek', 'groq']) {
    const configured = providerEnvironment(provider, env);
    if (configured.key) return providerConfig(provider, configured.key, configured.model, env);
  }
  if (env.AI_API_KEY) {
    const key = String(env.AI_API_KEY).trim();
    const inferred = key.startsWith('AIza') ? 'gemini'
      : key.startsWith('gsk_') ? 'groq'
        : key.startsWith('sk-ant-') ? 'claude' : 'openai';
    return providerConfig(inferred, key, env.AI_MODEL, env);
  }
  return null;
}

/** AI modelinden dönen metin içerisinden JSON nesnesini güvenle ayrıştırır. */
export function parseAiJson(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function buildAiPrompts(article, issues = []) {
  const systemPrompt = [
    'Sen TestoTavan platformunun baş sağlık ve bilim editörüsün.',
    'Görevin: Verilen haber/makale içeriğinden yararlanarak bilimsel temelli, özgün, akıcı ve okuyucuya pratik değer katan ana Türkçe blog taslağını üretmektir. Çeviriler ayrı ve bağımsız kalite kontrollü turlarda hazırlanacaktır.',
    'Kurallar:',
    '1. Yalnızca geçerli bir JSON nesnesi döndür; başka açıklama ekleme.',
    '2. "category" alanı Türkçe için şu üçünden en uygunu olmalı: "Hormon Sağlığı", "Yüksek Protein" veya "Uyku".',
    '3. "title" en fazla 95 karakter, dikkat çekici ve doğru olmalı; tıklama tuzağı kurma.',
    '4. "summary" 140-220 karakter arasında, 1-2 cümlelik net bir özet olmalı.',
    '5. "body" EN AZ 700 kelime olmalı. Bölümleri "## " ile başlayan başlıklarla ayır: "## Neden önemli", "## Araştırma ne gösteriyor", "## Günlük hayata çeviri", "## Kimler dikkat etmeli", "## Sık Sorulan Sorular".',
    '6. "Günlük hayata çeviri" bölümünde en az 4 madde işareti ("- ") öneri ver; her öneri uygulanabilir ve ölçülebilir olsun.',
    '7. "Sık Sorulan Sorular" bölümünde 3 soru yaz: her soru "?" ile bitsin, altındaki yanıt 2-3 cümle olsun.',
    '8. "time" okuma süresini "5 dk" biçiminde belirtmeli.',
    '9. Kaynaktaki sayı, oran, kişi, kurum ve bilimsel bulguları koru; kaynakta bulunmayan sonuç, doz veya sağlık vaadi ekleme.',
    '10. KAYNAK/ATIF YAZMA: "Kaynak:", "Kaynakça", "Referanslar", site adı, URL veya bağlantı listesi ekleme. İçerik kendi başına ayakta dursun; okuyucu ek bir siteye gitmek zorunda kalmasın.',
    '11. Çeviri üretme ve translations alanı ekleme. Yalnızca yüksek kaliteli Türkçe ana metni hazırla.',
    issues.length ? `12. ÖNCEKİ DENEME ŞU KURALLARI İHLAL ETTİ: ${issues.join('; ')}. Aynı hataları tekrarlama.` : '',
    'JSON Şeması:',
    '{"category":"Hormon Sağlığı","emoji":"🧬","title":"...","summary":"...","body":"...","time":"5 dk"}'
  ].filter(Boolean).join('\n');

  const userPrompt = [
    `Haber Bağlantısı: ${article.url || ''}`,
    `Kaynak: ${article.siteName || ''}`,
    `Haber Başlığı: ${article.title || ''}`,
    `Haber Özeti: ${article.description || ''}`,
    `Haber Metni:\n${String(article.body || '').slice(0, 8000)}`
  ].join('\n\n');

  return { systemPrompt, userPrompt };
}

function buildRecipeAiPrompts(article) {
  const recipe = article?.recipe || {};
  const sourceIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const sourceSteps = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const nutrition = recipe.nutrition && typeof recipe.nutrition === 'object' ? recipe.nutrition : {};
  const systemPrompt = [
    'Sen TestoTavan için deneyimli bir tarif editörü ve beslenme içeriği denetçisisin.',
    'Kaynak sayfadan çıkarılan tarifi düzenle, tam ve anlaşılır Türkçe ana tarif taslağı hazırla ve yalnızca kaynak verilerinin desteklediği ölçüde beslenme analizi ekle. Çeviriler ayrı kalite kontrollü turlarda hazırlanacaktır.',
    'Yalnızca geçerli JSON döndür; markdown veya açıklama ekleme.',
    'Kaynakta çıkarılan Türkçe malzeme listesini bire bir koru: hiçbir malzemeyi atlama, ekleme, miktarını değiştirme veya ikame etme. Üst düzey ingredients alanı kaynak dizisiyle aynı sırada ve aynı metinle olmalı.',
    'Kaynak adımlarını eksiksiz koru. Kaynakta hazırlama adımı yoksa yeni adım uydurma; body içinde adımların kaynakta bulunmadığını açıkça söyle.',
    'Body içinde "Hazırlanışı", "Tarif Analizi" ve "Besin Değeri Notu" başlıkları olsun. Tarif Analizi porsiyon, süre ve listelenen içerikleri özetlesin.',
    'Kaynakta porsiyon başına besin değerleri varsa yalnızca verilen değerleri ve birimleri aktar. Yoksa kesin kalori/protein/yağ iddiası üretme; eksik veriyi açıkça belirt ve gramaj bazlı hesaplamanın yaklaşık olduğunu söyle.',
    'Hastalık, hormon, tedavi veya kesin sağlık yararı iddiası ekleme. Kaynağa dayanmayan besin miktarı, porsiyon veya sağlık etkisi uydurma.',
    'Çeviri üretme ve translations alanı ekleme. Yalnızca Türkçe ana tarif ile kaynak malzeme listesini döndür.',
    'JSON gövde şeması:',
    '{"type":"recipe","category":"Yüksek Protein","emoji":"🍽️","title":"...","summary":"...","body":"...","time":"... dk","ingredients":["..."]}'
  ].join('\n');
  const userPrompt = [
    `Kaynak bağlantısı: ${article?.url || ''}`,
    `Kaynak site: ${article?.siteName || ''}`,
    `Tarif başlığı: ${recipe.name || article?.title || ''}`,
    `Kaynak özeti: ${recipe.description || article?.description || ''}`,
    `Porsiyon: ${recipe.yield || 'belirtilmemiş'}`,
    `Hazırlama süresi: ${recipe.prepTime || 'belirtilmemiş'}`,
    `Pişirme süresi: ${recipe.cookTime || 'belirtilmemiş'}`,
    `Toplam süre: ${recipe.totalTime || 'belirtilmemiş'}`,
    `Kaynak besin değerleri: ${Object.keys(nutrition).length ? JSON.stringify(nutrition) : 'belirtilmemiş'}`,
    `Kaynak malzemeler (metin ve sıralama aynen korunmalı):\n${sourceIngredients.map((value, index) => `${index + 1}. ${value}`).join('\n')}`,
    `Kaynak hazırlanış adımları:\n${sourceSteps.length ? sourceSteps.map((value, index) => `${index + 1}. ${value}`).join('\n') : 'Kaynakta yapılandırılmış hazırlanış adımı bulunamadı.'}`,
    `Sayfadan alınan ek metin:\n${String(article?.body || '').slice(0, 6000)}`
  ].join('\n\n');
  return { systemPrompt, userPrompt, temperature: 0.2, maxTokens: 8192 };
}

/**
 * Sağlayıcıya serbest sistem/kullanıcı istemi gönderir ve JSON nesnesi döndürür.
 * Çeviri turu da aynı istemciyi kullanır; anahtar veya gövde günlüğe yazılmaz.
 */
export async function requestAiJson(config, prompts, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? AI_TIMEOUT_MS;
  const systemPrompt = prompts.systemPrompt;
  const userPrompt = prompts.userPrompt;
  const temperature = prompts.temperature ?? 0.3;
  const maxTokens = prompts.maxTokens ?? 8192;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    if (config.provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens
          }
        }),
        signal: controller.signal
      });
    } else if (config.provider === 'claude') {
      response = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        }),
        signal: controller.signal
      });
    } else {
      const providers = {
        openai: 'https://api.openai.com/v1/chat/completions',
        groq: 'https://api.groq.com/openai/v1/chat/completions',
        kimi: 'https://api.moonshot.ai/v1/chat/completions',
        deepseek: 'https://api.deepseek.com/chat/completions'
      };
      const isGroq = config.provider === 'groq';
      const isGroqGptOss = isGroq && /^openai\/gpt-oss-(?:20b|120b)$/i.test(config.model);
      const endpoint = providers[config.provider];
      if (!endpoint) return { ok: false, error: 'Desteklenmeyen AI sağlayıcısı.' };
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          temperature,
          ...(isGroq ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
          ...(isGroqGptOss ? { reasoning_effort: 'low', reasoning_format: 'hidden' } : {}),
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = data?.error?.message || `AI API hatası (${response.status})`;
      return { ok: false, error: msg, status: response.status };
    }

    const rawText = config.provider === 'gemini'
      ? data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
      : config.provider === 'claude'
        ? data?.content?.filter(block => block?.type === 'text').map(block => block.text || '').join('') || ''
        : data?.choices?.[0]?.message?.content || '';

    const parsed = parseAiJson(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'AI yanıtı geçerli bir JSON olarak okunamadı.' };
    }

    return { ok: true, data: parsed, provider: config.provider, model: config.model };
  } catch (error) {
    return {
      ok: false,
      error: error?.name === 'AbortError' ? 'AI servisi zaman aşımına uğradı.' : String(error?.message || error)
    };
  } finally {
    // JSON gövdesinin okunması da aynı zaman aşımı bütçesi içinde kalsın.
    clearTimeout(timer);
  }
}

function isModelUnavailable(result) {
  const error = String(result?.error || '');
  if (result?.status === 404) return true;
  if (![400, 403].includes(result?.status)) return false;
  return /model.{0,160}(?:not found|does not exist|not supported|unavailable|shut.?down|deprecated|decommissioned)|(?:not found|does not exist|not supported|unavailable|shut.?down|deprecated|decommissioned).{0,160}model|model_decommissioned/i.test(error);
}

function currentModelFor(provider) {
  if (provider === 'gemini') return DEFAULT_GEMINI_MODEL;
  if (provider === 'groq') return DEFAULT_GROQ_MODEL;
  if (provider === 'claude') return DEFAULT_CLAUDE_MODEL;
  if (provider === 'kimi') return DEFAULT_KIMI_MODEL;
  if (provider === 'deepseek') return DEFAULT_DEEPSEEK_MODEL;
  return '';
}

async function requestAiJsonWithFallback(config, prompts, options = {}) {
  const result = await requestAiJson(config, prompts, options);
  const fallbackModel = currentModelFor(config.provider);
  if (result.ok || !fallbackModel || config.model === fallbackModel || !isModelUnavailable(result)) return result;

  console.warn(`[ai-blog] ${config.provider} modeli ${config.model} kullanılamıyor; ${fallbackModel} deneniyor.`);
  const fallback = await requestAiJson({ ...config, model: fallbackModel }, prompts, options);
  return fallback.ok ? { ...fallback, modelFallbackFrom: config.model } : fallback;
}

/**
 * Seçilen AI sağlayıcısına istek gönderip JSON yanıtı alır.
 */
export async function callAiProvider(article, config, options = {}) {
  const prompts = article?.type === 'recipe' || article?.recipe?.ingredients?.length
    ? buildRecipeAiPrompts(article)
    : buildAiPrompts(article);
  const result = await requestAiJsonWithFallback(config, prompts, options);
  if (!result.ok) return result;
  return { ...result, provider: config.provider, model: result.model || config.model };
}

function isHardAiFailure(message = '') {
  return /quota|429|401|403|unauthorized|api key|zaman aşımı|timeout|aborted|invalid api/i.test(String(message));
}

async function finishWithTranslations(item, options, aiConfig, canRepairWithAi) {
  const requestAi = canRepairWithAi && aiConfig
    ? (systemPrompt, userPrompt) => requestAiJsonWithFallback(aiConfig, {
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 8192
    }, { ...options, timeoutMs: options.translateTimeoutMs ?? Math.min(options.timeoutMs ?? AI_TIMEOUT_MS, 20000) })
    : null;
  return ensureCompleteTranslations(item, { ...options, requestAi });
}

/**
 * Çıkarılan haber verisinden tam blog taslağı üretir.
 * Yapılandırılmış bir AI anahtarı varsa LLM kullanır; yoksa veya LLM hata verirse
 * yerleşik akıllı modla 4 dilde taslağı kesintisiz oluşturur.
 * EN/DE/JA alanları kaynak metnin kopyasıysa ayrı bir tam çeviri turu çalışır.
 */
export async function generateRecipeFromArticle(article, options = {}) {
  const recipeArticle = { ...article, type: 'recipe' };
  const ingredients = recipeArticle.recipe?.ingredients || [];
  if (!ingredients.length) {
    return { ok: false, error: 'Bu bağlantıdan tarif malzemesi çıkarılamadı. Kaynakta malzeme listesi olduğundan emin olun veya blog türünü seçin.' };
  }

  const aiConfig = resolveAiProvider(options, options.env || process.env);
  let mode = 'fallback';
  let provider = 'builtin';
  let model;
  let warning;
  let raw = {};

  if (aiConfig) {
    const aiResult = await callAiProvider(recipeArticle, aiConfig, options);
    if (aiResult.ok) {
      mode = 'ai';
      provider = aiResult.provider;
      model = aiResult.model;
      raw = aiResult.data || {};
    } else {
      warning = aiResult.error;
      console.warn(`[ai-recipe] ${aiConfig.provider} hatası, yerleşik moda geçiliyor:`, aiResult.error);
    }
  }

  const item = normalizeGeneratedRecipe(raw, recipeArticle);
  const translationOptions = mode === 'ai' ? { ...options, forceTranslation: true } : options;
  const repaired = await finishWithTranslations(item, translationOptions, aiConfig, mode === 'ai' || (aiConfig && !isHardAiFailure(warning)));
  if (repaired.warning) warning = [warning, repaired.warning].filter(Boolean).join(' ');
  return {
    ok: true,
    mode,
    provider,
    model,
    warning,
    translation: repaired.report,
    translation_quality: repaired.quality,
    item: repaired.item
  };
}

export async function generateBlogFromArticle(article, options = {}) {
  const aiConfig = resolveAiProvider(options, options.env || process.env);
  let mode = 'fallback';
  let provider = 'builtin';
  let model;
  let warning;
  let raw = {};
  let quality = null;
  let retried = false;

  if (aiConfig) {
    const aiResult = await callAiProvider(article, aiConfig, options);
    if (aiResult.ok) {
      mode = 'ai';
      provider = aiResult.provider;
      model = aiResult.model;
      raw = aiResult.data || {};
      quality = assessBlogDraft(normalizeGeneratedBlog(raw, article));

      // Kalite kapısı: yalnızca açıkça istendiğinde ikinci bir yazım turu çalışır.
      // Daha düşük puanlı bir yeniden deneme ilk taslağı ezmez.
      if (!quality.ok && options.qualityRetry === true) {
        const retry = await requestAiJsonWithFallback(aiConfig, buildAiPrompts(article, quality.issues), options);
        if (retry.ok) {
          const retryItem = normalizeGeneratedBlog(retry.data, article);
          const retryQuality = assessBlogDraft(retryItem);
          retried = true;
          if (retryQuality.score > quality.score) {
            raw = retry.data || {};
            quality = retryQuality;
          }
        }
      }
    } else {
      warning = aiResult.error;
      console.warn(`[ai-blog] ${aiConfig.provider} hatası, yerleşik moda geçiliyor:`, aiResult.error);
    }
  }

  const item = normalizeGeneratedBlog(raw, article);
  const translationOptions = mode === 'ai' ? { ...options, forceTranslation: true } : options;
  const repaired = await finishWithTranslations(item, translationOptions, aiConfig, mode === 'ai' || (aiConfig && !isHardAiFailure(warning)));
  if (repaired.warning) warning = [warning, repaired.warning].filter(Boolean).join(' ');

  return {
    ok: true,
    mode,
    provider,
    model,
    warning,
    quality: { ...(quality || assessBlogDraft(repaired.item)), retried },
    translation: repaired.report,
    translation_quality: repaired.quality,
    item: repaired.item
  };
}

/**
 * Var olan Türkçe blog alanlarını yeniden yazmadan EN/DE/JA çevirilerini tamamlar.
 */
export async function completeBlogTranslations(rawItem, options = {}) {
  const title = clean(rawItem?.title, 100);
  const summary = clean(rawItem?.summary, 240);
  const body = clean(rawItem?.body, 20000);
  if (!title || !summary || !body) {
    return { ok: false, error: 'Çeviri için başlık, özet ve içerik gerekli.' };
  }
  const aiConfig = resolveAiProvider(options, options.env || process.env);
  const item = {
    ...rawItem,
    type: rawItem?.type === 'recipe' ? 'recipe' : 'blog',
    category: clean(rawItem?.category, 60),
    title,
    summary,
    body,
    time: clean(rawItem?.time, 30),
    ingredients: Array.isArray(rawItem?.ingredients) ? rawItem.ingredients.map(value => clean(value, 200)).filter(Boolean).slice(0, 100) : [],
    translations: cleanTranslations(rawItem?.translations)
  };
  const repaired = await finishWithTranslations(item, options, aiConfig, Boolean(aiConfig));
  return {
    ok: true,
    mode: aiConfig ? 'ai' : 'fallback',
    provider: aiConfig?.provider || 'builtin',
    model: aiConfig?.model,
    warning: repaired.warning,
    translation: repaired.report,
    translation_quality: repaired.quality,
    item: repaired.item
  };
}

/**
 * Yalnızca malzeme satırlarını çevirir (admin'deki otomatik doldurma için).
 *
 * Sıra: AI (anahtar varsa) → makine çevirisi (izin varsa) → yerel sözlük.
 * Yerel sözlük her zaman bir sonuç döndürdüğü için işlem çevrimdışı da tamamlanır;
 * miktar ve satır sayısı korunur, sıra değişmez.
 */
const INGREDIENT_PLURALS = {
  en: {
    egg: 'eggs', tomato: 'tomatoes', potato: 'potatoes', onion: 'onions', lemon: 'lemons',
    clove: 'cloves', slice: 'slices', cup: 'cups', tablespoon: 'tablespoons', teaspoon: 'teaspoons',
    banana: 'bananas', apple: 'apples', avocado: 'avocados', walnut: 'walnuts', almond: 'almonds',
    hazelnut: 'hazelnuts', strawberry: 'strawberries', cucumber: 'cucumbers', pepper: 'peppers',
    carrot: 'carrots', mushroom: 'mushrooms', date: 'dates'
  },
  de: {
    Ei: 'Eier', Tomate: 'Tomaten', Kartoffel: 'Kartoffeln', Zwiebel: 'Zwiebeln', Zitrone: 'Zitronen',
    Zehe: 'Zehen', Scheibe: 'Scheiben', Tasse: 'Tassen', Banane: 'Bananen', Apfel: 'Äpfel',
    Avocado: 'Avocados', Walnuss: 'Walnüsse', Mandel: 'Mandeln', Erdbeere: 'Erdbeeren',
    Gurke: 'Gurken', Karotte: 'Karotten', Pilz: 'Pilze', Dattel: 'Datteln'
  }
};

/**
 * Yerel sözlük tekili döndürür ("2 egg"). Miktar 1'den büyükse bilinen
 * malzemeleri çoğula çevirir; Japoncada çoğul yoktur, dokunulmaz.
 */
function pluralizeIngredientLine(line, lang) {
  const table = INGREDIENT_PLURALS[lang];
  if (!table) return line;
  const text = String(line || '').trim();
  const quantity = text.match(/^(\d+(?:[.,]\d+)?)/);
  if (!quantity) return text;
  if (Number(quantity[1].replace(',', '.')) <= 1) return text;
  return text.replace(/([\p{L}]+)(\s*)$/u, (match, word, tail) => (table[word] ? table[word] + tail : match));
}

function ingredientPrompts(source) {
  return {
    systemPrompt: [
      'TASK: ingredient-translation',
      `You translate Turkish recipe ingredient lines into these languages: ${TARGET_LANGS.map(code => LANG_NAMES[code] || code).join(', ')}.`,
      `Return only valid JSON with one array per language: ${JSON.stringify(Object.fromEntries(TARGET_LANGS.map(code => [code, ['...']])))}.`,
      'RULES:',
      '- Keep the exact number of lines and their original order.',
      '- Preserve every quantity, unit, number and brand name; translate food words and units naturally.',
      '- Never add, merge, split or drop an ingredient.',
      '- No markdown, no comments, no extra keys; every array item must be a complete ingredient phrase.'
    ].join('\n'),
    userPrompt: `SOURCE_INGREDIENTS:\n${JSON.stringify(source)}`
  };
}

function normalizeIngredientTranslations(data, source) {
  const blocks = {};
  for (const lang of TARGET_LANGS) {
    const block = pickLanguageBlock(data, lang) || (data && typeof data === 'object' ? data[lang] : null);
    const rows = Array.isArray(block)
      ? block
      : Array.isArray(block?.ingredients)
        ? block.ingredients
        : Array.isArray(block?.malzemeler)
          ? block.malzemeler
          : null;
    if (!rows || rows.length !== source.length) continue;
    const cleaned = rows.map(row => clean(row, 200));
    if (cleaned.some(row => !row)) continue;
    blocks[lang] = cleaned;
  }
  return Object.keys(blocks).length ? blocks : null;
}

export async function translateIngredientLines(lines, options = {}) {
  const source = (Array.isArray(lines) ? lines : [])
    .map(value => clean(value, 200))
    .filter(Boolean)
    .slice(0, 60);
  if (!source.length) return { ok: false, error: 'Çevrilecek malzeme bulunamadı.' };

  const aiConfig = resolveAiProvider(options, options.env || process.env);
  const prompts = ingredientPrompts(source);
  let translated = null;
  let mode = 'local';
  let warning;

  const requestAi = typeof options.requestAi === 'function'
    ? options.requestAi
    : aiConfig
      ? (systemPrompt, userPrompt) => requestAiJsonWithFallback(aiConfig, { systemPrompt, userPrompt }, {
        ...options,
        temperature: 0.1,
        maxTokens: 2048,
        timeoutMs: Math.min(options.timeoutMs ?? AI_TIMEOUT_MS, 15000)
      })
      : null;

  if (requestAi) {
    try {
      const response = await requestAi(prompts.systemPrompt, prompts.userPrompt);
      const candidate = response?.ok ? normalizeIngredientTranslations(response.data, source) : null;
      if (candidate) {
        translated = candidate;
        mode = 'ai';
      }
    } catch (error) {
      warning = error?.message || 'AI çevirisi yanıt vermedi.';
      console.warn('[ai-blog] malzeme AI çevirisi:', warning);
    }
  }

  if (!translated && networkTranslationAllowed(options, options.env || process.env)) {
    try {
      const blocks = {};
      for (const lang of TARGET_LANGS) {
        const block = await machineTranslateText(source.join('\n'), lang, options);
        const rows = String(block || '').split('\n').map(row => row.trim()).filter(Boolean);
        if (rows.length !== source.length) continue;
        const cleaned = rows.map(row => clean(row, 200));
        if (cleaned.some(row => !row)) continue;
        blocks[lang] = cleaned;
      }
      if (Object.keys(blocks).length === TARGET_LANGS.length) {
        translated = blocks;
        mode = 'mt';
      }
    } catch (error) {
      warning = error?.message || 'Makine çevirisi yanıt vermedi.';
      console.warn('[ai-blog] malzeme makine çevirisi:', warning);
    }
  }

  if (!translated) {
    translated = {};
    for (const lang of TARGET_LANGS) {
      translated[lang] = source.map(line => clean(pluralizeIngredientLine(localTranslateText(line, lang), lang), 200));
    }
    mode = 'local';
  }

  return {
    ok: true,
    mode,
    provider: aiConfig?.provider || 'builtin',
    model: aiConfig?.model,
    warning,
    count: source.length,
    ingredients: translated
  };
}

/**
 * Uçtan uca haber URL'sinden blog taslağı oluşturma boru hattı.
 */
export async function createBlogDraftFromUrl(url, options = {}) {
  const fetched = await fetchNewsHtml(url, options);
  if (!fetched.ok) return fetched;

  const extracted = extractArticleFromHtml(fetched.html, fetched.finalUrl);
  if (!extracted.ok) return extracted;

  const requestedType = String(options.type || 'auto').trim().toLowerCase();
  const forceRecipe = requestedType === 'recipe';
  const forceBlog = requestedType === 'blog';
  const isRecipe = forceRecipe || (!forceBlog && extracted.article.type === 'recipe');
  const articleForGeneration = isRecipe
    ? { ...extracted.article, type: 'recipe' }
    : { ...extracted.article, type: 'blog', recipe: null };
  const generated = isRecipe
    ? await generateRecipeFromArticle(articleForGeneration, options)
    : await generateBlogFromArticle(articleForGeneration, options);
  return {
    ...generated,
    source_url: fetched.finalUrl,
    source_title: extracted.article.title,
    source_site: extracted.article.siteName,
    detected_type: extracted.article.type || 'blog'
  };
}
