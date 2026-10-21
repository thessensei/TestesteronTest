import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateNewsUrl,
  isBlockedHost,
  decodeHtmlEntities,
  fetchNewsHtml,
  extractArticleFromHtml,
  classifyArticleCategory,
  buildFallbackBlogPost,
  buildFallbackRecipePost,
  normalizeGeneratedBlog,
  normalizeGeneratedRecipe,
  resolveAiProvider,
  parseAiJson,
  requestAiJson,
  callAiProvider,
  generateBlogFromArticle,
  generateRecipeFromArticle,
  createBlogDraftFromUrl
} from '../api/_ai-blog.js';
import {
  isTranslationComplete,
  fieldLooksTranslated,
  machineTranslateText,
  ensureCompleteTranslations,
  assessTranslationQuality,
  targetLanguageLooksCorrect
} from '../api/_translate.js';
import { createAiBlogHandler } from '../api/ai-blog.js';
import {
  createSessionCookie,
  safeUsernameMatch,
  createCaptchaChallenge,
  verifyCaptcha,
  CAPTCHA_TTL_MS
} from '../api/_auth.js';
import loginHandler from '../api/login.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'ai-blog-test-secret';

const SAMPLE_NEWS_HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor? - Sağlık Haberleri</title>
  <meta property="og:title" content="Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor?">
  <meta property="og:description" content="Yeni klinik araştırmaya göre düzenli 8 saat uyku ve sabah gün ışığı maruziyeti hormon dengesini belirgin biçimde destekliyor.">
  <meta property="og:image" content="https://cdn.saglikornek.com/haberler/uyku-hormon.jpg">
  <meta property="og:site_name" content="Sağlık Örnek">
</head>
<body>
  <nav>Ana Sayfa | Gündem | İletişim</nav>
  <article>
    <h1>Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor?</h1>
    <p>Çerez politikamızı kabul edin.</p>
    <p>Yapılan son araştırmalar, geceleri kesintisiz 7 ila 8 saat uyuyan yetişkin erkeklerde sabah total ve serbest testosteron düzeylerinin çok daha dengeli seyrettiğini ortaya koyuyor.</p>
    <p>Araştırma ekibi, özellikle REM ve derin uyku evrelerinin kısalmasının kortizol hormonunu yükselttiğini ve hipotalamus-hipofiz eksenini baskıladığını vurguluyor.</p>
    <p>Uzmanlar ayrıca sabah uyanır uyanmaz 15 dakika doğal gün ışığı almanın sirkadiyen ritmi ve melatonin-kortizol dengesini optimize ettiğini belirtiyor.</p>
  </article>
  <footer>Tüm hakları saklıdır 2026</footer>
</body>
</html>`;

const SAMPLE_RECIPE_HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta property="og:site_name" content="Örnek Tarif Haberleri">
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Recipe","name":"Tavuklu Bulgur Kasesi","description":"Tavuk ve bulgurla hazırlanan pratik bir öğün.","image":"/img/tavuk-bulgur.jpg","recipeIngredient":["150 g tavuk göğsü","1 su bardağı bulgur","2 adet yumurta","1 yemek kaşığı zeytinyağı"],"recipeInstructions":[{"@type":"HowToStep","text":"Bulguru yumuşayana kadar haşlayın."},{"@type":"HowToStep","text":"Tavuğu tavada pişirin ve yumurtayla servis edin."}],"recipeYield":"2 porsiyon","prepTime":"PT15M","cookTime":"PT25M","totalTime":"PT40M","nutrition":{"@type":"NutritionInformation","calories":"420 kcal","proteinContent":"32 g"}}
  </script>
</head>
<body><h1>Tavuklu Bulgur Kasesi</h1></body>
</html>`;

const HTML_RECIPE_WITHOUT_JSON_LD = `<html lang="en"><head><title>Simple Oat Bowl</title><meta property="og:description" content="A simple breakfast recipe."></head><body><main><h1>Simple Oat Bowl</h1><h2>Ingredients</h2><ul class="recipe-ingredients"><li>80 g rolled oats</li><li>1 banana</li><li>200 ml milk</li></ul><h2>Directions</h2><ol><li>Cook the oats in milk for five minutes.</li><li>Slice the banana and serve.</li></ol></main></body></html>`;

// -------------------------------------------------- URL doğrulama ve SSRF

test('validateNewsUrl geçerli haber bağlantılarını kabul eder, yerel/özel ağları reddeder', () => {
  assert.equal(validateNewsUrl('https://saglik.ornek.com/haber/testosteron-uyku').ok, true);
  assert.equal(validateNewsUrl('http://ornek.com/makale').ok, true);

  for (const bad of [
    '',
    'not-a-url',
    'javascript:alert(1)',
    'file:///etc/passwd',
    'https://admin:pass@ornek.com/haber',
    'http://localhost:3000/api',
    'http://127.0.0.1/admin',
    'http://10.0.0.1/internal',
    'http://172.16.5.4/secret',
    'http://192.168.1.1/router',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]:8080/',
    'http://metadata.google.internal/',
    'http://intranet.local/news',
    'http://2130706433/'
  ]) {
    const res = validateNewsUrl(bad);
    assert.equal(res.ok, false, `Reddedilmeliydi: ${bad}`);
  }
  assert.equal(isBlockedHost('ornek.com'), false);
  assert.equal(isBlockedHost('127.0.0.1'), true);
});

test('fetchNewsHtml açık yönlendirme (SSRF redirect) ve ikili dosyaları engeller', async () => {
  const redirectToLocal = async () => ({
    status: 302,
    ok: false,
    headers: new Map([['location', 'http://127.0.0.1:8080/internal']])
  });
  const ssrRes = await fetchNewsHtml('https://ornek.com/haber', { fetchImpl: redirectToLocal });
  assert.equal(ssrRes.ok, false);
  assert.match(ssrRes.error, /Yerel veya özel ağ/);

  const binaryFetch = async () => ({
    status: 200,
    ok: true,
    headers: new Map([['content-type', 'application/pdf']]),
    text: async () => '%PDF-1.5'
  });
  const binRes = await fetchNewsHtml('https://ornek.com/dosya.pdf', { fetchImpl: binaryFetch });
  assert.equal(binRes.ok, false);
  assert.match(binRes.error, /medya\/dosya/);
});

// -------------------------------------------------- HTML ayrıştırma

test('extractArticleFromHtml başlık, özet, gövde ve kapak görselini çıkarır', () => {
  const res = extractArticleFromHtml(SAMPLE_NEWS_HTML, 'https://saglikornek.com/haber/1');
  assert.equal(res.ok, true);
  assert.equal(res.article.title, 'Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor?');
  assert.equal(res.article.image, 'https://cdn.saglikornek.com/haberler/uyku-hormon.jpg');
  assert.equal(res.article.siteName, 'Sağlık Örnek');
  assert.ok(res.article.body.includes('kesintisiz 7 ila 8 saat uyuyan'), 'makale paragrafları alınmalı');
  assert.ok(!res.article.body.includes('Çerez politikamızı'), 'çerez/footer gürültüsü ayıklanmalı');
});

test('extractArticleFromHtml JSON-LD NewsArticle verisini ve HTML entity dizilerini çözer', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"NewsArticle","headline":"Yüksek Protein &amp; Direnç Egzersizi &#8212; Yeni Bulgular","description":"Kas kütlesi ve hormon dengesi üzerine özet.","image":{"url":"/img/kapak.webp"},"articleBody":"Günde 1.6 g/kg protein alımı direnç antrenmanıyla birleştiğinde kas protein sentezini artırır."}
  </script></head><body></body></html>`;
  const res = extractArticleFromHtml(html, 'https://spor.ornek.com/makale');
  assert.equal(res.ok, true);
  assert.equal(res.article.title, 'Yüksek Protein & Direnç Egzersizi — Yeni Bulgular');
  assert.equal(res.article.image, 'https://spor.ornek.com/img/kapak.webp');
  assert.match(res.article.body, /1\.6 g\/kg protein/);
  assert.equal(decodeHtmlEntities('Çinko &amp; D&#32;Vitamini'), 'Çinko & D Vitamini');
});

test('Recipe JSON-LD ve başlık/listelerinden malzeme, adım, porsiyon ve süre çıkarılır', () => {
  const structured = extractArticleFromHtml(SAMPLE_RECIPE_HTML, 'https://yemek.ornek.com/tavuk-bulgur');
  assert.equal(structured.ok, true);
  assert.equal(structured.article.type, 'recipe');
  assert.equal(structured.article.title, 'Tavuklu Bulgur Kasesi');
  assert.deepEqual(structured.article.recipe.ingredients, [
    '150 g tavuk göğsü', '1 su bardağı bulgur', '2 adet yumurta', '1 yemek kaşığı zeytinyağı'
  ]);
  assert.deepEqual(structured.article.recipe.instructions, [
    'Bulguru yumuşayana kadar haşlayın.', 'Tavuğu tavada pişirin ve yumurtayla servis edin.'
  ]);
  assert.equal(structured.article.recipe.totalTime, '40 dk');
  assert.equal(structured.article.recipe.yield, '2 porsiyon');
  assert.match(structured.article.body, /Bulguru yumuşayana kadar haşlayın/);
  assert.equal(structured.article.image, 'https://yemek.ornek.com/img/tavuk-bulgur.jpg');

  const htmlOnly = extractArticleFromHtml(HTML_RECIPE_WITHOUT_JSON_LD, 'https://recipes.example.org/oat-bowl');
  assert.equal(htmlOnly.article.type, 'recipe');
  assert.deepEqual(htmlOnly.article.recipe.ingredients, ['80 g rolled oats', '1 banana', '200 ml milk']);
  assert.deepEqual(htmlOnly.article.recipe.instructions, ['Cook the oats in milk for five minutes.', 'Slice the banana and serve.']);
});

// -------------------------------------------------- Kategori ve Anahtarsız Mod

test('classifyArticleCategory ve buildFallbackBlogPost 4 dilde eksiksiz taslak üretir', () => {
  const { article } = extractArticleFromHtml(SAMPLE_NEWS_HTML, 'https://saglikornek.com/haber/1');
  const cat = classifyArticleCategory(article);
  assert.equal(cat.tr, 'Uyku');
  assert.equal(cat.en, 'Sleep');

  const draft = buildFallbackBlogPost(article);
  assert.equal(draft.type, 'blog');
  assert.equal(draft.category, 'Uyku');
  assert.equal(draft.cover_url, 'https://cdn.saglikornek.com/haberler/uyku-hormon.jpg');
  assert.match(draft.time, /^\d+ dk$/);
  assert.ok(draft.title.length > 10 && draft.title.length <= 100);
  assert.ok(draft.summary.length > 20 && draft.summary.length <= 240);
  assert.ok(draft.body.includes('Öne Çıkan Noktalar'));

  for (const lang of ['en', 'de', 'ja']) {
    const t = draft.translations[lang];
    assert.ok(t.category, `${lang} category dolu olmalı`);
    assert.ok(t.title, `${lang} title dolu olmalı`);
    assert.ok(t.summary, `${lang} summary dolu olmalı`);
    assert.ok(t.body, `${lang} body dolu olmalı`);
    assert.ok(t.time, `${lang} time dolu olmalı`);
  }
  assert.match(draft.translations.en.time, /min$/);
  assert.match(draft.translations.de.time, /Min\.$/);
  assert.match(draft.translations.ja.time, /分$/);
  assert.notEqual(draft.translations.en.title, draft.title, 'İngilizce başlık Türkçenin kopyası olmamalı');
  assert.match(draft.translations.en.title, /Sleep|Testosterone|Sunlight/i);
  assert.match(draft.translations.de.body, /Schlaf|Testosteron/);
  assert.match(draft.translations.ja.body, /[\u3040-\u30ff\u4e00-\u9fff]/);
  assert.equal(isTranslationComplete(draft.translations.en, draft, 'en'), true);
  assert.equal(isTranslationComplete(draft.translations.de, draft, 'de'), true);
  assert.equal(isTranslationComplete(draft.translations.ja, draft, 'ja'), true);
  assert.equal(fieldLooksTranslated(draft.title, draft.title, 'en'), false, 'kopya metin çeviri sayılmamalı');
});

test('tarif taslağı tam malzeme listesini korur ve kaynağa dayalı besin analizini ekler', () => {
  const { article } = extractArticleFromHtml(SAMPLE_RECIPE_HTML, 'https://yemek.ornek.com/tavuk-bulgur');
  const fallback = buildFallbackRecipePost(article);
  assert.equal(fallback.type, 'recipe');
  assert.equal(fallback.category, 'Yüksek Protein');
  assert.deepEqual(fallback.ingredients, article.recipe.ingredients);
  assert.match(fallback.body, /Hazırlanışı:/);
  assert.match(fallback.body, /Tarif Analizi:/);
  assert.match(fallback.body, /Besin Değeri Notu:/);
  assert.match(fallback.body, /Kalori: 420 kcal/);
  assert.match(fallback.time, /40 dk/);

  const normalized = normalizeGeneratedRecipe({
    title: article.title,
    summary: article.description,
    body: 'Hazırlanışı: Source steps. Tarif Analizi: Source-only facts.',
    time: '40 dk',
    ingredients: ['AI tarafından uydurulan malzeme'],
    translations: {}
  }, article);
  assert.deepEqual(normalized.ingredients, article.recipe.ingredients, 'çıkarılan kaynak listesi AI listesinden öncelikli olmalı');
  assert.equal(normalized.type, 'recipe');
});

// -------------------------------------------------- AI Sağlayıcıları ve Yedek Mod

test('resolveAiProvider Gemini, OpenAI, Groq, Claude, Kimi ve DeepSeek anahtarlarını seçer', () => {
  assert.equal(resolveAiProvider({}, { GEMINI_API_KEY: 'AIzaSyTest123' }).provider, 'gemini');
  assert.equal(resolveAiProvider({}, { OPENAI_API_KEY: 'sk-test-123' }).provider, 'openai');
  assert.equal(resolveAiProvider({}, { GROQ_API_KEY: 'gsk_test_123' }).provider, 'groq');
  assert.equal(resolveAiProvider({}, { GROQ_API_KEY: 'gsk_test_123' }).model, 'openai/gpt-oss-120b');
  assert.equal(resolveAiProvider({ apiKey: 'gsk_custom' }, {}).provider, 'groq');
  assert.equal(resolveAiProvider({ apiKey: 'gsk_custom' }, {}).model, 'openai/gpt-oss-120b');
  assert.equal(resolveAiProvider({ provider: 'claude', apiKey: 'sk-ant-test' }, {}).provider, 'claude');
  assert.equal(resolveAiProvider({ provider: 'claude', apiKey: 'sk-ant-test' }, {}).model, 'claude-sonnet-4-5');
  assert.equal(resolveAiProvider({ provider: 'kimi', apiKey: 'sk-kimi-test' }, {}).provider, 'kimi');
  assert.equal(resolveAiProvider({ provider: 'kimi', apiKey: 'sk-kimi-test' }, {}).model, 'moonshot-v1-8k');
  assert.equal(resolveAiProvider({ provider: 'deepseek', apiKey: 'sk-deepseek-test' }, {}).provider, 'deepseek');
  assert.equal(resolveAiProvider({ provider: 'deepseek', apiKey: 'sk-deepseek-test' }, {}).model, 'deepseek-chat');
  assert.equal(resolveAiProvider({ provider: 'claude' }, { ANTHROPIC_API_KEY: 'sk-ant-env' }).apiKey, 'sk-ant-env');
  assert.equal(resolveAiProvider({ provider: 'kimi' }, { KIMI_API_KEY: 'sk-kimi-env' }).apiKey, 'sk-kimi-env');
  assert.equal(resolveAiProvider({ provider: 'deepseek' }, { DEEPSEEK_API_KEY: 'sk-deepseek-env' }).apiKey, 'sk-deepseek-env');
  assert.equal(resolveAiProvider({}, {}), null);
  assert.deepEqual(parseAiJson('```json\n{"title":"Merhaba"}\n```'), { title: 'Merhaba' });
});

test('Claude Messages API, Kimi ve DeepSeek OpenAI-uyumlu uç noktaları kullanır', async () => {
  for (const provider of ['claude', 'kimi', 'deepseek']) {
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url: String(url), init, payload: JSON.parse(init.body) };
      const data = provider === 'claude'
        ? { content: [{ type: 'text', text: '{"title":"Translated"}' }] }
        : { choices: [{ message: { content: '{"title":"Translated"}' } }] };
      return { ok: true, status: 200, json: async () => data };
    };
    const config = resolveAiProvider({ provider, apiKey: 'test-key', model: 'test-model' }, {});
    const result = await requestAiJson(config, { systemPrompt: 'JSON only', userPrompt: 'Translate this' }, { fetchImpl });
    assert.equal(result.ok, true, provider);
    assert.deepEqual(result.data, { title: 'Translated' });
    assert.equal(seen.payload.model, 'test-model');
    if (provider === 'claude') {
      assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
      assert.equal(seen.init.headers['x-api-key'], 'test-key');
      assert.equal(seen.payload.system, 'JSON only');
    } else if (provider === 'kimi') {
      assert.equal(seen.url, 'https://api.moonshot.ai/v1/chat/completions');
      assert.equal(seen.init.headers.Authorization, 'Bearer test-key');
    } else {
      assert.equal(seen.url, 'https://api.deepseek.com/chat/completions');
      assert.equal(seen.init.headers.Authorization, 'Bearer test-key');
    }
  }
});

test('Gemini varsayılanı güncel, kapatılmış model ayarı otomatik olarak yenilenir', () => {
  assert.equal(resolveAiProvider({ apiKey: 'AIzaFake' }, {}).model, 'gemini-3.8-flash');
  assert.equal(resolveAiProvider({}, { GEMINI_API_KEY: 'AIzaFake', GEMINI_MODEL: 'gemini-2.0-flash' }).model, 'gemini-3.8-flash');
  assert.equal(resolveAiProvider({ provider: 'gemini', apiKey: 'AIzaFake' }, { GEMINI_MODEL: 'gemini-1.5-pro' }).model, 'gemini-3.8-flash');
  assert.equal(resolveAiProvider({ provider: 'gemini', apiKey: 'AIzaFake' }, { GEMINI_MODEL: 'gemini-3.8-flash' }).model, 'gemini-3.8-flash');
  assert.equal(resolveAiProvider({ provider: 'groq', apiKey: 'gskFake' }, { GROQ_MODEL: 'llama-3.3-70b-versatile' }).model, 'openai/gpt-oss-120b');
  assert.equal(resolveAiProvider({ provider: 'groq', apiKey: 'gskFake' }, { GROQ_MODEL: 'openai/gpt-oss-120b' }).model, 'openai/gpt-oss-120b');
});

test('Gemini eski model 404 verirse güncel modele otomatik geçer', async () => {
  const models = [];
  const fetchImpl = async url => {
    const model = decodeURIComponent(String(url).match(/models\/([^:]+)/)?.[1] || '');
    models.push(model);
    if (model === 'gemini-2.0-flash') {
      return { ok: false, status: 404, json: async () => ({ error: { message: 'models/gemini-2.0-flash is not found for API version v1beta' } }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"title":"Translated"}' }] } }] })
    };
  };

  const result = await callAiProvider({ title: 'Başlık', body: 'Makale içeriği' }, {
    provider: 'gemini', apiKey: 'AIzaFake', model: 'gemini-2.0-flash'
  }, { fetchImpl });

  assert.equal(result.ok, true);
  assert.deepEqual(models, ['gemini-2.0-flash', 'gemini-3.8-flash']);
  assert.equal(result.model, 'gemini-3.8-flash');
  assert.equal(result.modelFallbackFrom, 'gemini-2.0-flash');
});

test('Groq eski model 404 verirse gpt-oss-120b modeline geçer ve reasoning çıktısını sınırlı tutar', async () => {
  const models = [];
  const fetchImpl = async (url, init) => {
    assert.match(String(url), /api\.groq\.com\/openai\/v1\/chat\/completions/);
    const payload = JSON.parse(init.body);
    models.push(payload.model);
    if (payload.model === 'llama-3.3-70b-versatile') {
      return { ok: false, status: 404, json: async () => ({ error: { message: 'The model llama-3.3-70b-versatile does not exist.' } }) };
    }
    assert.equal(payload.max_completion_tokens, 8192);
    assert.equal(payload.reasoning_effort, 'low');
    assert.equal(payload.reasoning_format, 'hidden');
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"title":"Translated"}' } }] })
    };
  };

  const result = await callAiProvider({ title: 'Başlık', body: 'Makale içeriği' }, {
    provider: 'groq', apiKey: 'gsk_fake', model: 'llama-3.3-70b-versatile'
  }, { fetchImpl });

  assert.equal(result.ok, true);
  assert.deepEqual(models, ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']);
  assert.equal(result.model, 'openai/gpt-oss-120b');
  assert.equal(result.modelFallbackFrom, 'llama-3.3-70b-versatile');
});

test('generateBlogFromArticle AI yanıtını 4 dilde normalize eder, hata olursa yedek moda düşer', async () => {
  const { article } = extractArticleFromHtml(SAMPLE_NEWS_HTML, 'https://saglikornek.com/haber/1');

  const aiMockResponse = {
    category: 'Hormon Sağlığı',
    emoji: '🧬',
    title: 'Sabah Güneşi ve Uyku Kalitesinin Testosterona Etkisi',
    summary: 'Yeterli derin uyku ve sabah gün ışığı hormonal ritmi güçlendiriyor.',
    body: 'Detaylı Türkçe blog içeriği paragraf 1.\n\nParagraf 2.',
    time: '5 dk',
    translations: {
      en: { category: 'Hormone Health', title: 'Morning Sunlight and Sleep on Testosterone', summary: 'Deep sleep supports hormone balance.', body: 'Detailed English body.', time: '5 min' },
      de: { category: 'Hormongesundheit', title: 'Morgensonne und Schlaf für Testosteron', summary: 'Tiefschlaf unterstützt die Hormonbalance.', body: 'Deutscher Inhalt.', time: '5 Min.' },
      ja: { category: 'ホルモン健康', title: '朝日と睡眠がテストステロンに与える影響', summary: '深い睡眠がホルモンバランスを支えます。', body: '日本語の本文。', time: '5分' }
    }
  };

  const fakeGeminiFetch = async url => {
    assert.match(url, /generativelanguage\.googleapis\.com/);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(aiMockResponse) }] } }]
      })
    };
  };

  const aiRes = await generateBlogFromArticle(article, {
    apiKey: 'AIzaFakeKey',
    provider: 'gemini',
    fetchImpl: fakeGeminiFetch
  });

  assert.equal(aiRes.ok, true);
  assert.equal(aiRes.mode, 'ai');
  assert.equal(aiRes.provider, 'gemini');
  assert.equal(aiRes.item.title, aiMockResponse.title);
  assert.equal(aiRes.item.translations.en.title, 'Morning Sunlight and Sleep on Testosterone');
  assert.equal(aiRes.item.translations.de.title, 'Morgensonne und Schlaf für Testosteron');
  assert.equal(aiRes.item.translations.ja.title, '朝日と睡眠がテストステロンに与える影響');
  assert.equal(aiRes.item.cover_url, 'https://cdn.saglikornek.com/haberler/uyku-hormon.jpg');

  // AI hata döndürdüğünde yayını kırmadan yerleşik yedek moda geçmeli
  const failingAiFetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: { message: 'Quota exceeded' } })
  });

  const fallbackRes = await generateBlogFromArticle(article, {
    apiKey: 'sk-fake',
    provider: 'openai',
    fetchImpl: failingAiFetch
  });
  assert.equal(fallbackRes.ok, true);
  assert.equal(fallbackRes.mode, 'fallback');
  assert.ok(fallbackRes.item.title.length > 0);
  assert.ok(fallbackRes.item.translations.en.body.length > 0);
  assert.notEqual(fallbackRes.item.translations.en.title, fallbackRes.item.title);
});

test('çeviri doğrulaması Türkçe kalan malzeme adlarını eksik kabul eder', () => {
  const source = {
    title: 'Tavuklu pratik kase',
    summary: 'Tavuk ve sebzelerle hazırlanan hızlı bir öğün.',
    body: 'Yumurtaları sebzelerle pişirip hızlı bir öğün olarak servis edin.',
    ingredients: ['2 adet yumurta']
  };
  const translation = {
    title: 'Quick chicken bowl',
    summary: 'A quick meal made with chicken and vegetables.',
    body: 'Cook the chicken and serve it with fresh vegetables for a quick meal.',
    ingredients: ['2 pieces yumurta']
  };
  assert.equal(isTranslationComplete(translation, source, 'en'), false);
  assert.equal(isTranslationComplete({ ...translation, ingredients: ['2 eggs'] }, source, 'en'), true);
});

test('yedek tarif çevirisi kısmen Türkçe kalan malzeme listesini gizler', async () => {
  const { article } = extractArticleFromHtml(SAMPLE_RECIPE_HTML, 'https://yemek.ornek.com/tavuk-bulgur');
  const fallback = buildFallbackRecipePost(article);
  const result = await ensureCompleteTranslations(fallback, {
    networkTranslate: false,
    env: { ENABLE_MACHINE_TRANSLATION: '0' }
  });
  assert.equal(result.report.en, 'incomplete');
  assert.deepEqual(result.item.translations.en.ingredients, []);
});

test('kopyalanmış AI çevirileri ayrı tam çeviri turuyla değiştirilir', async () => {
  const article = {
    title: 'Zencefil çayı her sabah içilmelidir',
    description: 'Zencefil çayı dolaşımı desteklediği için sabah rutininize eklenmelidir.',
    body: 'Zencefil çayı her sabah içilmelidir çünkü dolaşımı destekler ve günü daha dengeli başlatır. Uzmanlar bu içeceği öğünle birlikte önermektedir.',
    siteName: 'Örnek Haber',
    url: 'https://ornek.com/zencefil',
    image: ''
  };
  const copied = {
    category: 'Hormon Sağlığı',
    emoji: '🧬',
    title: article.title,
    summary: article.description,
    body: article.body,
    time: '4 dk',
    translations: {
      en: { title: article.title, summary: article.description, body: article.body, category: 'Hormon Sağlığı', time: '4 dk' },
      de: { title: article.title, summary: article.description, body: article.body, category: 'Hormon Sağlığı' },
      ja: { title: article.title, summary: article.description, body: article.body, category: 'Hormon Sağlığı' }
    }
  };
  const translated = {
    en: {
      category: 'Hormone Health',
      title: 'Ginger tea belongs in the morning routine',
      summary: 'Ginger tea can support circulation when it is part of a morning routine.',
      body: 'Ginger tea in the morning can support circulation and start the day more steadily. Experts suggest having it with a meal.\n\nThis is general information, not medical advice.'
    },
    de: {
      category: 'Hormongesundheit',
      title: 'Ingwertee gehört in die Morgenroutine',
      summary: 'Ingwertee kann die Durchblutung unterstützen, wenn er zur Morgenroutine gehört.',
      body: 'Ingwertee am Morgen kann die Durchblutung unterstützen und den Tag ausgeglichener beginnen. Fachleute empfehlen ihn zu einer Mahlzeit.\n\nDas ist eine allgemeine Information und kein medizinischer Rat.'
    },
    ja: {
      category: 'ホルモン健康',
      title: '生姜茶は朝の習慣に合う',
      summary: '生姜茶は朝の習慣に取り入れると巡りを支えるとされています。',
      body: '朝の生姜茶は巡りを支え、一日をより安定して始めやすくします。専門家は食事と一緒に摂ることを勧めています。\n\nこれは一般的な情報であり、医療アドバイスではありません。'
    }
  };
  let translationCalls = 0;
  const fetchImpl = async (_url, init) => {
    const payload = JSON.parse(init.body);
    const system = payload.systemInstruction.parts[0].text;
    const data = system.includes('full-translation') ? (translationCalls += 1, translated) : copied;
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }] }) };
  };
  const result = await generateBlogFromArticle(article, {
    apiKey: 'AIzaFakeKey',
    provider: 'gemini',
    fetchImpl,
    networkTranslate: false
  });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'ai');
  assert.equal(translationCalls, 3, 'her hedef dil doğruluk için bağımsız AI turunda çevrilmeli');
  assert.equal(result.translation.en, 'ai');
  assert.equal(result.translation.de, 'ai');
  assert.equal(result.translation.ja, 'ai');
  assert.equal(result.item.translations.en.title, translated.en.title);
  assert.equal(result.item.translations.de.body, translated.de.body);
  assert.match(result.item.translations.ja.body, /生姜茶/);
  assert.equal(fieldLooksTranslated(article.body, article.body, 'en'), false);
});

test('zorunlu yeniden çeviri İngilizce/Almanca metni ve tarif malzemelerini AI ile yeniler', async () => {
  const item = {
    type: 'recipe', category: 'Yüksek Protein', title: 'Tavuklu bulgur kasesi',
    summary: 'Tavuk, bulgur ve yoğurtla hazırlanan pratik bir öğün.',
    body: 'Bulguru haşlayın. Tavuğu pişirin ve yoğurtla servis edin.', time: '40 dk',
    ingredients: ['150 g tavuk göğsü'], translations: { en: { title: 'Old translation' } }
  };
  const translated = {
    en: { category: 'High Protein', title: 'Chicken and bulgur bowl', summary: 'A quick meal made with chicken, bulgur and yogurt.', body: 'Cook the bulgur. Cook the chicken and serve it with yogurt.', time: '40 min', ingredients: ['150 g chicken breast'] },
    de: { category: 'Proteinreich', title: 'Bulgur-Bowl mit Hähnchen', summary: 'Ein schnelles Gericht mit Hähnchen, Bulgur und Joghurt.', body: 'Den Bulgur kochen. Das Hähnchen garen und mit Joghurt servieren.', time: '40 Min.', ingredients: ['150 g Hähnchenbrust'] },
    ja: { category: '高たんぱく', title: '鶏肉とブルグルのボウル', summary: '鶏肉、ブルグル、ヨーグルトを使った簡単な食事です。', body: 'ブルグルをゆでます。鶏肉を調理し、ヨーグルトを添えて出します。', time: '40分', ingredients: ['鶏むね肉 150 g'] }
  };
  let calls = 0;
  let userPrompt = '';
  const result = await ensureCompleteTranslations(item, {
    forceTranslation: true,
    networkTranslate: false,
    requestAi: async (_system, prompt) => {
      calls += 1;
      userPrompt = prompt;
      return { ok: true, data: translated };
    }
  });
  assert.equal(calls, 3, 'üç hedef dil birbirinden bağımsız istenmeli');
  assert.match(userPrompt, /150 g tavuk göğsü/);
  assert.equal(result.report.en, 'ai');
  assert.equal(result.report.de, 'ai');
  assert.equal(result.item.translations.en.ingredients[0], '150 g chicken breast');
  assert.equal(result.item.translations.de.title, translated.de.title);
});

test('çeviri kalite kapısı hedef dili, sayıları ve paragraf yapısını birlikte denetler', () => {
  const source = {
    category: 'Hormon Sağlığı',
    title: '15 dakikalık gün ışığı ve uyku',
    summary: 'Araştırma 120 katılımcıda 8 saat uykuyu değerlendirdi.',
    body: 'İlk paragrafta 120 katılımcının sonuçları açıklanır.\n\nİkinci paragrafta 8 saat uyku ve 15 dakika gün ışığı anlatılır.',
    time: '5 dk',
    ingredients: []
  };
  const good = {
    category: 'Hormone Health',
    title: '15 minutes of daylight and sleep',
    summary: 'The study evaluated 8 hours of sleep in 120 participants.',
    body: 'The first paragraph explains the results from 120 participants.\n\nThe second paragraph covers 8 hours of sleep and 15 minutes of daylight.',
    time: '5 min',
    ingredients: []
  };
  const complete = assessTranslationQuality(good, source, 'en');
  assert.equal(complete.complete, true);
  assert.equal(complete.score, 100);

  const omitted = {
    ...good,
    summary: 'The study evaluated sleep in participants.',
    body: 'The results are described in one shortened paragraph.'
  };
  const rejected = assessTranslationQuality(omitted, source, 'en');
  assert.equal(rejected.complete, false);
  assert.ok(rejected.issues.some(issue => /sayı|birim|bağlantı/.test(issue)));
  assert.ok(rejected.issues.some(issue => /paragraf|liste/.test(issue)));

  const invented = assessTranslationQuality({ ...good, summary: `${good.summary} Take 500 mg.` }, source, 'en');
  assert.equal(invented.complete, false, 'kaynakta olmayan sayısal dozlar reddedilmeli');
  assert.ok(invented.issues.some(issue => /sayı|birim|bağlantı/.test(issue)));

  assert.equal(targetLanguageLooksCorrect('The study and the results are written with clear English language for the reader.', 'de'), false);
  assert.equal(targetLanguageLooksCorrect('Die Studie und die Ergebnisse sind für die Leser klar auf Deutsch geschrieben.', 'de'), true);
});

test('kalite kontrolünden geçmeyen AI çevirisi sorun listesiyle yeniden denenir', async () => {
  const item = {
    type: 'blog', category: 'Hormon Sağlığı', title: 'Uyku araştırması',
    summary: 'Araştırma 8 saat uykuyu inceliyor.',
    body: 'İlk bölümde 120 katılımcı anlatılır.\n\nİkinci bölümde 8 saat uyku değerlendirilir.',
    time: '5 dk', ingredients: [], translations: {}
  };
  const valid = {
    en: { category: 'Hormone Health', title: 'Sleep study', summary: 'The study examines 8 hours of sleep.', body: 'The first section describes 120 participants.\n\nThe second section evaluates 8 hours of sleep.', time: '5 min', ingredients: [] },
    de: { category: 'Hormongesundheit', title: 'Schlafstudie', summary: 'Die Studie untersucht 8 Stunden Schlaf.', body: 'Der erste Abschnitt beschreibt 120 Teilnehmende.\n\nDer zweite Abschnitt bewertet 8 Stunden Schlaf.', time: '5 Min.', ingredients: [] },
    ja: { category: 'ホルモン健康', title: '睡眠研究', summary: 'この研究では8時間の睡眠を調べます。', body: '最初の節では120人の参加者について説明します。\n\n次の節では8時間の睡眠を評価します。', time: '5分', ingredients: [] }
  };
  const attempts = { en: 0, de: 0, ja: 0 };
  const seenSystems = [];
  const result = await ensureCompleteTranslations(item, {
    networkTranslate: false,
    requestAi: async (system, prompt) => {
      seenSystems.push(system);
      const lang = prompt.match(/TARGET_LANGUAGE_CODES: (en|de|ja)/)?.[1];
      attempts[lang] += 1;
      if (lang === 'en' && attempts.en === 1) {
        return { ok: true, data: { ...valid.en, body: 'The result is summarized without the original numbers.' } };
      }
      return { ok: true, data: valid[lang] };
    }
  });
  assert.deepEqual(attempts, { en: 2, de: 1, ja: 1 });
  assert.equal(result.report.en, 'ai');
  assert.equal(result.quality.en.complete, true);
  assert.equal(result.quality.en.attempts, 2);
  assert.ok(seenSystems.some(system => /PREVIOUS OUTPUT FAILED QUALITY CHECKS/.test(system)));
});

test('makine çevirisi paragrafları birleştirir ve kopyayı kabul etmez', async () => {
  const fetchImpl = async url => {
    const href = String(url);
    if (href.includes('translate.googleapis.com')) {
      const q = new URL(href).searchParams.get('q');
      return { ok: true, json: async () => [[['EN: ' + q, q]]] };
    }
    return { ok: false, status: 503, json: async () => ({}) };
  };
  const translated = await machineTranslateText('İlk paragraf yeterince uzundur.\n\nİkinci paragraf da çevrilmeli.', 'en', { fetchImpl, networkTranslate: true });
  assert.match(translated, /EN: İlk paragraf/);
  assert.match(translated, /EN: İkinci paragraf/);
  assert.ok(translated.includes('\n\n'));
});

// -------------------------------------------------- /api/ai-blog HTTP Handler

test('/api/ai-blog admin yetkisi, JSON başlığı ve URL güvenliğini denetler', async () => {
  const handler = createAiBlogHandler({
    env: {},
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      text: async () => SAMPLE_NEWS_HTML
    })
  });

  const call = async (method, body, admin = true, extraHeaders = {}) => {
    const req = {
      method,
      body,
      headers: { 'content-type': 'application/json', ...extraHeaders }
    };
    if (admin) req.headers.cookie = createSessionCookie().split(';')[0];
    const res = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; },
      json(data) { this.data = data; return this; }
    };
    await handler(req, res);
    return res;
  };

  assert.equal((await call('GET', {})).code, 405);
  assert.equal((await call('POST', { url: 'https://ornek.com/h' }, false)).code, 401);
  assert.equal((await call('POST', { url: 'https://ornek.com/h' }, true, { 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await call('POST', { url: 'https://ornek.com/h' }, true, { 'content-type': 'text/plain' })).code, 415);
  assert.equal((await call('POST', { url: 'http://127.0.0.1/secret' }, true)).code, 400);

  const okRes = await call('POST', { url: 'https://saglikornek.com/haber/1' }, true);
  assert.equal(okRes.code, 200);
  assert.equal(okRes.data.ok, true);
  assert.equal(okRes.data.item.type, 'blog');
  assert.equal(okRes.data.item.title, 'Derin Uyku ve Sabah Güneşi Testosteronu Nasıl Etkiliyor?');
  assert.notEqual(okRes.data.item.translations.en.title, okRes.data.item.title);
  assert.match(okRes.data.item.translations.ja.body, /[\u3040-\u30ff\u4e00-\u9fff]/);
  assert.equal(okRes.data.translation_quality.en.complete, true);
  assert.equal(okRes.data.translation_quality.de.score, 100);

  const missing = await call('POST', { mode: 'translate', item: { title: 'Yalnız başlık' } }, true);
  assert.equal(missing.code, 400);
  const translated = await call('POST', {
    mode: 'translate',
    item: {
      title: 'Zencefil çayı her sabah içilmelidir',
      summary: 'Zencefil çayı dolaşımı desteklediği için sabah rutininize eklenmelidir.',
      body: 'Zencefil çayı her sabah içilmelidir çünkü dolaşımı destekler ve günü daha dengeli başlatır.'
    }
  }, true);
  assert.equal(translated.code, 200);
  assert.equal(translated.data.ok, true);
  assert.equal(translated.data.item.translations.en.body, '', 'kalitesiz yedek çeviri kaynak dilde gösterilmemeli');
  assert.equal(translated.data.translation.en, 'incomplete');
  assert.match(translated.data.warning, /EN/);
});

test('URL içe aktarma otomatik olarak tarifi algılar ve kaynak malzemelerini forma taşır', async () => {
  const result = await createBlogDraftFromUrl('https://yemek.ornek.com/tavuk-bulgur', {
    env: {},
    networkTranslate: false,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      url: 'https://yemek.ornek.com/tavuk-bulgur',
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      text: async () => SAMPLE_RECIPE_HTML
    })
  });
  assert.equal(result.ok, true);
  assert.equal(result.detected_type, 'recipe');
  assert.equal(result.item.type, 'recipe');
  assert.deepEqual(result.item.ingredients, [
    '150 g tavuk göğsü', '1 su bardağı bulgur', '2 adet yumurta', '1 yemek kaşığı zeytinyağı'
  ]);
  assert.match(result.item.body, /Tarif Analizi:/);
  assert.equal(result.item.time, '40 dk');
});

// -------------------------------------------------- Admin Paneli Arayüzü ve Giriş Doğrulama Kodu

test('admin panelinde haber linkinden otomatik blog oluşturma ve doğrulama kodlu giriş tanımlı', () => {
  const adminHtml = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
  assert.match(adminHtml, /id="news_url"/, 'haber URL giriş alanı olmalı');
  assert.match(adminHtml, /id="ai_content_type"/, 'otomatik blog/tarif algılama seçeneği olmalı');
  assert.match(adminHtml, /id="ai_generate_btn"/, 'AI taslak üretim butonu olmalı');
  for (const provider of ['claude', 'kimi', 'deepseek']) assert.match(adminHtml, new RegExp(`value="${provider}"`), `${provider} sağlayıcısı panelde seçilebilmeli`);
  assert.match(adminHtml, /id="ai_model"/, 'model kimliği geçersizse ayarlanabilmeli');
  assert.match(adminHtml, /id="ai_retranslate_btn"/, 'EN/DE/JA yeniden çeviri düğmesi olmalı');
  assert.match(adminHtml, /id="ai_quality_summary"/, 'dil kalite özeti görünmeli');
  assert.match(adminHtml, /data-lang-quality="en"/, 'İngilizce kalite kartı olmalı');
  assert.match(adminHtml, /4 dilde taslak üret/, 'ana üretim eylemi anlaşılır olmalı');
  assert.match(adminHtml, /function renderTranslationDashboard\(/, 'çeviri kalite durumu anlık gösterilmeli');
  assert.match(adminHtml, /function generateFromNewsUrl\(\)/, 'haber çekme işlevi olmalı');
  assert.match(adminHtml, /function applyGeneratedBlog\(/, 'form doldurma işlevi olmalı');
  assert.match(adminHtml, /fetch\('\/api\/ai-blog'/, 'admin paneli /api/ai-blog ucunu çağırmalı');
  assert.match(adminHtml, /id="username"/, 'kullanıcı adı alanı olmalı');
  assert.match(adminHtml, /id="captcha_code"/, 'doğrulama kodu giriş alanı olmalı');
  assert.match(adminHtml, /id="captcha_display"/, 'doğrulama kodu göstergesi olmalı');
  assert.match(adminHtml, /function loadCaptcha\(\)/, 'doğrulama kodu yenileme işlevi olmalı');
  assert.match(adminHtml, /id="ai_translate_btn"/, 'açık alanları çevirme düğmesi olmalı');
  assert.match(adminHtml, /function translateOpenFields\(/);
  assert.match(adminHtml, /mode:'translate'/);
});

test('kullanıcı adı ve HMAC imzalı doğrulama kodu (Captcha) güvenli biçimde doğrulanır', async () => {
  const savedUser = process.env.ADMIN_USERNAME;
  const savedPass = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = 'test-strong-password';
  delete process.env.ADMIN_USERNAME;

  try {
    // Varsayılan kullanıcı adı "admin"
    assert.equal(safeUsernameMatch('admin'), true);
    assert.equal(safeUsernameMatch('  admin  '), true);
    assert.equal(safeUsernameMatch('root'), false);

    // Özel ADMIN_USERNAME tanımlandığında
    process.env.ADMIN_USERNAME = 'testoadmin';
    assert.equal(safeUsernameMatch('testoadmin'), true);
    assert.equal(safeUsernameMatch('admin'), false);

    const now = Date.now();
    const challenge = createCaptchaChallenge(now);
    assert.match(challenge.code, /^[A-Z0-9]{6}$/);
    assert.equal(verifyCaptcha(challenge.code, challenge.token, now), true);
    assert.equal(verifyCaptcha(challenge.code.toLowerCase(), challenge.token, now), true, 'büyük/küçük harf duyarsız olmalı');
    assert.equal(verifyCaptcha('WRONG1', challenge.token, now), false);
    assert.equal(verifyCaptcha(challenge.code, challenge.token, now + CAPTCHA_TTL_MS + 1000), false, 'süresi dolan kod reddedilmeli');

    // /api/login GET ve POST akışı
    const callLogin = async (method, body = {}, ip = '203.0.113.10') => {
      const req = { method, body, headers: { 'x-forwarded-for': ip } };
      const res = {
        headers: {},
        setHeader(k, v) { this.headers[k] = v; },
        status(code) { this.code = code; return this; },
        json(data) { this.data = data; return this; }
      };
      await loginHandler(req, res);
      return res;
    };

    const getRes = await callLogin('GET');
    assert.equal(getRes.code, 200);
    assert.ok(getRes.data.captcha?.code && getRes.data.captcha?.token);

    // Hatalı doğrulama kodu
    const badCaptcha = await callLogin('POST', {
      username: 'testoadmin',
      password: 'test-strong-password',
      captchaCode: '000000',
      captchaToken: getRes.data.captcha.token
    });
    assert.equal(badCaptcha.code, 400);
    assert.ok(badCaptcha.data.captcha?.token, 'yeni doğrulama kodu dönmeli');

    // Hatalı kullanıcı adı
    const fresh1 = badCaptcha.data.captcha;
    const badUser = await callLogin('POST', {
      username: 'yanlis',
      password: 'test-strong-password',
      captchaCode: fresh1.code,
      captchaToken: fresh1.token
    });
    assert.equal(badUser.code, 401);

    // Başarılı giriş
    const fresh2 = badUser.data.captcha;
    const okLogin = await callLogin('POST', {
      username: 'testoadmin',
      password: 'test-strong-password',
      captchaCode: fresh2.code,
      captchaToken: fresh2.token
    });
    assert.equal(okLogin.code, 200);
    assert.equal(okLogin.data.authenticated, true);
    assert.match(okLogin.headers['Set-Cookie'], /^testotavan_admin=/);

    // Aynı doğrulama kodu tekrar kullanılamaz (replay koruması)
    const replay = await callLogin('POST', {
      username: 'testoadmin',
      password: 'test-strong-password',
      captchaCode: fresh2.code,
      captchaToken: fresh2.token
    });
    assert.equal(replay.code, 400);
  } finally {
    if (savedUser === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = savedUser;
    if (savedPass === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = savedPass;
  }
});
