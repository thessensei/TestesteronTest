import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    buildRichPin, buildPinDescription, hashtagOf, oneLine,
    canonicalPostUrl, resolvePinImageUrl, resolveSiteUrl,
    pinterestRichPinFire, PINTEREST_PINS_ENDPOINT,
    PINTEREST_MAX_TITLE, PINTEREST_MAX_DESCRIPTION
} from '../api/_pinterest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://testotavan.vercel.app';

const blogItem = {
    id: 'content-1760000000000-ab12cd34',
    type: 'blog',
    category: 'Hormon Sağlığı',
    title: 'Testosteronu Destekleyen 7 Günlük Alışkanlık',
    summary: 'Uyku, direnç antrenmanı ve beslenme düzeninizi iyileştirmek için pratik bir başlangıç rehberi.',
    cover_url: '/api/media/media-1760000000000-ab12cd34'
};

/** Ağa çıkmayan sahte fetch: çağrıları kaydeder, verilen yanıtları sırayla döner. */
function fakeFetch(responses) {
    const calls = [];
    const queue = [...responses];
    const impl = async (url, options) => {
        calls.push({ url, options, body: JSON.parse(options.body) });
        const next = queue.length > 1 ? queue.shift() : queue[0];
        if (next instanceof Error) throw next;
        return {
            ok: next.status >= 200 && next.status < 300,
            status: next.status,
            json: async () => next.body
        };
    };
    return { impl, calls };
}

// ------------------------------------------------------- veri paketi (payload)

test('kurumsal pin gövdesi title, description, link ve image_url taşır', () => {
    const { ok, payload } = buildRichPin(blogItem, { boardId: '987654321', siteUrl: SITE });
    assert.equal(ok, true);

    assert.equal(payload.board_id, '987654321');
    assert.equal(payload.title, blogItem.title);
    assert.equal(payload.link, `${SITE}/?icerik=${blogItem.id}`);
    assert.equal(payload.media_source.source_type, 'image_url');
    assert.equal(payload.media_source.url, `${SITE}/api/media/media-1760000000000-ab12cd34`);
    assert.ok(payload.description.startsWith(blogItem.summary), 'açıklama özetle başlamalı');
    assert.ok(payload.description.includes('#TestoTavan'), 'kurumsal hashtag eklenmeli');
    assert.ok(payload.description.includes('#HormonSagligi'), 'kategori hashtag olarak eklenmeli');
    assert.equal(payload.alt_text, `${blogItem.title} — Hormon Sağlığı`);
    assert.deepEqual(Object.keys(payload), ['board_id', 'title', 'description', 'link', 'alt_text', 'media_source']);
});

test('başlık 100, açıklama 500 karakter sınırına sığdırılır', () => {
    const long = {
        ...blogItem,
        title: 'T'.repeat(180),
        summary: 'S'.repeat(900)
    };
    const { payload } = buildRichPin(long, { boardId: '1', siteUrl: SITE });
    assert.equal(payload.title.length, PINTEREST_MAX_TITLE);
    assert.ok(payload.description.length <= PINTEREST_MAX_DESCRIPTION, `açıklama ${payload.description.length} karakter`);
    assert.ok(payload.description.includes('#TestoTavan'), 'kısaltma hashtag\'leri düşürmemeli');
});

test('hashtag üretimi Türkçe harfleri okunabilir ASCII\'ye çevirir', () => {
    assert.equal(hashtagOf('Hormon Sağlığı'), '#HormonSagligi');
    assert.equal(hashtagOf('Yüksek Protein'), '#YuksekProtein');
    assert.equal(hashtagOf('Uyku'), '#Uyku');
    assert.equal(hashtagOf(''), '');
    assert.equal(hashtagOf('!!!'), '');
    assert.equal(oneLine('  çok   boşluklu  ', 100), 'çok boşluklu');
});

test('özet boşsa açıklama yalnızca hashtag\'lerden oluşur', () => {
    const description = buildPinDescription({ category: 'Uyku' });
    assert.equal(description, '#Uyku #TestoTavan #ErkekSagligi #HormonSagligi');
});

test('kapak görseli mutlak HTTPS adresine çevrilir', () => {
    assert.equal(resolvePinImageUrl('https://cdn.ornek.com/a.jpg', SITE), 'https://cdn.ornek.com/a.jpg');
    assert.equal(resolvePinImageUrl('/api/media/media-1760000000000-ab12cd34', SITE), `${SITE}/api/media/media-1760000000000-ab12cd34`);
    assert.equal(resolvePinImageUrl('http://cdn.ornek.com/a.jpg', SITE), '', 'http kapak kabul edilmez');
    assert.equal(resolvePinImageUrl('', SITE), '');
    assert.equal(resolvePinImageUrl('https://cdn.ornek.com/a.jpg', ''), 'https://cdn.ornek.com/a.jpg');
});

test('canlı bağlantı Vercel adresine derin bağlantı olarak kurulur', () => {
    assert.equal(canonicalPostUrl('content-1', 'https://testotavan.vercel.app/'), 'https://testotavan.vercel.app/?icerik=content-1');
    assert.equal(canonicalPostUrl('content-1', ''), '');
    assert.equal(canonicalPostUrl('', SITE), '');
    assert.match(canonicalPostUrl('content-1', SITE), /^https:\/\/testotavan\.vercel\.app\/\?icerik=content-1$/);
});

test('site adresi SITE_URL → Vercel değişkenleri → istek başlıkları sırasıyla çözülür', () => {
    const saved = { SITE_URL: process.env.SITE_URL, VERCEL_URL: process.env.VERCEL_URL, VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL };
    try {
        delete process.env.SITE_URL;
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        assert.equal(resolveSiteUrl({ 'x-forwarded-host': 'testotavan.vercel.app', 'x-forwarded-proto': 'https' }), 'https://testotavan.vercel.app');
        assert.equal(resolveSiteUrl({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }), 'http://localhost:3000');
        assert.equal(resolveSiteUrl({}), '');

        process.env.VERCEL_URL = 'testotavan-abc.vercel.app';
        assert.equal(resolveSiteUrl({ 'x-forwarded-host': 'yoksay.vercel.app' }), 'https://testotavan-abc.vercel.app');

        process.env.SITE_URL = 'https://testotavan.com/';
        assert.equal(resolveSiteUrl({}), 'https://testotavan.com');
    } finally {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

// ------------------------------------------------------------- gönderim akışı

test('blog olmayan içerik ve panelden kapatılan pin gönderilmez', async () => {
    const { impl, calls } = fakeFetch([{ status: 201, body: { id: 'pin-1' } }]);
    const recipe = await pinterestRichPinFire({ ...blogItem, type: 'recipe' }, { token: 't', boardId: 'b', siteUrl: SITE, fetchImpl: impl });
    assert.equal(recipe.ok, false);
    assert.equal(recipe.skipped, true);
    assert.equal(recipe.reason, 'not_a_blog_item');

    const disabled = await pinterestRichPinFire(blogItem, { token: 't', boardId: 'b', siteUrl: SITE, enabled: false, fetchImpl: impl });
    assert.equal(disabled.reason, 'disabled_by_publisher');
    assert.equal(calls.length, 0, 'hiç istek gönderilmemeli');
});

test('eksik yapılandırma ve eksik kapak görseli pin göndermeden raporlanır', async () => {
    const { impl, calls } = fakeFetch([{ status: 201, body: { id: 'pin-1' } }]);

    const noToken = await pinterestRichPinFire(blogItem, { token: '', boardId: 'b', siteUrl: SITE, fetchImpl: impl });
    assert.equal(noToken.reason, 'token_missing');

    const noBoard = await pinterestRichPinFire(blogItem, { token: 't', boardId: '', siteUrl: SITE, fetchImpl: impl });
    assert.equal(noBoard.reason, 'board_id_missing');

    const noCover = await pinterestRichPinFire({ ...blogItem, cover_url: '' }, { token: 't', boardId: 'b', siteUrl: SITE, fetchImpl: impl });
    assert.equal(noCover.reason, 'cover_image_missing');

    const noSite = await pinterestRichPinFire(blogItem, { token: 't', boardId: 'b', siteUrl: '', headers: {}, fetchImpl: impl });
    assert.equal(noSite.reason, 'site_url_missing');

    assert.equal(calls.length, 0, 'eksik veriyle ağa çıkılmamalı');
});

test('pin isteği Authorization başlığı ve JSON gövdesiyle gönderilir', async () => {
    const { impl, calls } = fakeFetch([{ status: 201, body: { id: 'pin-42' } }]);
    const result = await pinterestRichPinFire(blogItem, { token: 'token-abc', boardId: '987654321', siteUrl: SITE, fetchImpl: impl });

    assert.equal(result.ok, true);
    assert.equal(result.pin_id, 'pin-42');
    assert.equal(result.status, 201);
    assert.equal(result.attempts, 1);
    assert.equal(calls.length, 1);

    const [call] = calls;
    assert.equal(call.url, PINTEREST_PINS_ENDPOINT);
    assert.equal(call.url, 'https://api.pinterest.com/v5/pins');
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.headers.Authorization, 'Bearer token-abc');
    assert.equal(call.options.headers['Content-Type'], 'application/json');
    assert.deepEqual(call.body, buildRichPin(blogItem, { boardId: '987654321', siteUrl: SITE }).payload);
});

test('geçici hatada (429/5xx) tekrar denenir, kalıcı hatada denenmez', async () => {
    const { impl, calls } = fakeFetch([
        { status: 429, body: { message: 'rate limited' } },
        { status: 201, body: { id: 'pin-99' } }
    ]);
    const retried = await pinterestRichPinFire(blogItem, { token: 't', boardId: 'b', siteUrl: SITE, fetchImpl: impl, retryDelayMs: 0 });
    assert.equal(retried.ok, true);
    assert.equal(retried.pin_id, 'pin-99');
    assert.equal(retried.attempts, 2);
    assert.equal(calls.length, 2);

    const { impl: impl2, calls: calls2 } = fakeFetch([{ status: 400, body: { message: 'Geçersiz board_id' } }]);
    const rejected = await pinterestRichPinFire(blogItem, { token: 't', boardId: 'b', siteUrl: SITE, fetchImpl: impl2, retryDelayMs: 0 });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.status, 400);
    assert.equal(rejected.error, 'Geçersiz board_id');
    assert.equal(calls2.length, 1, '4xx yanıtı tekrar denenmemeli');
});

test('ağ hatası ve zaman aşımı yayın akışını bozmaz', async () => {
    const network = await pinterestRichPinFire(blogItem, {
        token: 't', boardId: 'b', siteUrl: SITE, retryDelayMs: 0,
        fetchImpl: async () => { throw new Error('getaddrinfo ENOTFOUND api.pinterest.com'); }
    });
    assert.equal(network.ok, false);
    assert.equal(network.skipped, false);
    assert.equal(network.reason, 'request_failed');
    assert.match(network.error, /ENOTFOUND/);
    assert.equal(network.attempts, 2, 'ağ hatası tekrar denenmeli');

    const abort = new Error('aborted');
    abort.name = 'AbortError';
    const timeout = await pinterestRichPinFire(blogItem, {
        token: 't', boardId: 'b', siteUrl: SITE, retryDelayMs: 0, timeoutMs: 3000,
        fetchImpl: async () => { throw abort; }
    });
    assert.equal(timeout.ok, false);
    assert.match(timeout.error, /Zaman aşımı \(3000 ms\)/);

    const malformed = await pinterestRichPinFire(blogItem, {
        token: 't', boardId: 'b', siteUrl: SITE, retryDelayMs: 0,
        fetchImpl: async () => ({ ok: false, status: 500, json: async () => { throw new Error('bozuk JSON'); } })
    });
    assert.equal(malformed.error, 'Pinterest API hatası (500)');
});

test('yayın yanıtı pin durumunu raporlar, token yoksa içerik yine yayınlanır', async () => {
    const { impl } = fakeFetch([{ status: 201, body: { id: 'pin-7' } }]);
    const success = await pinterestRichPinFire(blogItem, { token: 't', boardId: 'b', siteUrl: SITE, fetchImpl: impl });
    assert.deepEqual(Object.keys(success).filter(key => key !== 'ms').sort(), ['attempts', 'ok', 'pin_id', 'skipped', 'status']);
    assert.equal(typeof success.ms, 'number');

    const saved = { PINTEREST_ACCESS_TOKEN: process.env.PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID: process.env.PINTEREST_BOARD_ID };
    try {
        delete process.env.PINTEREST_ACCESS_TOKEN;
        delete process.env.PINTEREST_BOARD_ID;
        const skipped = await pinterestRichPinFire(blogItem, { siteUrl: SITE, fetchImpl: impl });
        assert.equal(skipped.ok, false);
        assert.equal(skipped.skipped, true);
    } finally {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

test('boru hattı zaman aşımıyla sınırlıdır ve sert durum kodlarını hata sayar', () => {
    const source = fs.readFileSync(path.join(root, 'api', '_pinterest.js'), 'utf8');
    assert.match(source, /export const PINTEREST_TIMEOUT_MS = \d+/);
    assert.ok(Number(source.match(/PINTEREST_TIMEOUT_MS = (\d+)/)[1]) <= 5000, 'serverless yanıtı uzun süre beklememeli');
    assert.match(source, /new AbortController\(\)/);
    assert.match(source, /response\.status === 429 \|\| response\.status >= 500/);
});

// --------------------------------------------------- admin paneli bağlantısı

test('içerik route\'u commit sonrası Pinterest boru hattını tetikler', () => {
    const source = fs.readFileSync(path.join(root, 'api', 'content.js'), 'utf8');
    assert.match(source, /import \{ pinterestRichPinFire \} from '\.\/_pinterest\.js'/, 'modül içe aktarılmalı');
    const insertIndex = source.indexOf('INSERT INTO content');
    const fireIndex = source.indexOf('pinterestRichPinFire(created');
    assert.ok(insertIndex > -1 && fireIndex > insertIndex, 'çağrı INSERT (commit) ifadesinden sonra olmalı');
    assert.match(source, /enabled: input\.pinterest !== false/, 'panel tercihi dikkate alınmalı');
    assert.match(source, /return res\.status\(201\)\.json\(\{ \.\.\.created, pinterest \}\)/, 'pin sonucu yanıtta raporlanmalı');
});

test('admin paneli pin tercihini gönderir ve sonucu bildirir', () => {
    const adminHtml = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
    assert.match(adminHtml, /id="pin_pinterest"/, 'pin onay kutusu eksik');
    assert.match(adminHtml, /pinterest:pinWanted\(\)/, 'tercih gövdeye eklenmeli');
    assert.match(adminHtml, /function pinReport\(p\)/, 'pin sonucu kullanıcıya bildirilmeli');
    assert.match(adminHtml, /testotavan_pin/, 'tercih tarayıcıda hatırlanmalı');
});

test('openSharedContent geçerli kimliği açar, uydurma kimliği reddeder', () => {
    // content.js tarayıcı modülü, DOM stub'larıyla Node'da değerlendirilir.
    const elements = { modalSheet: { innerHTML: '' }, contentModal: { classList: { add() {}, remove() {} } } };
    const document = {
        querySelectorAll: () => [],
        getElementById: id => elements[id] || null,
        createElement: () => ({ set textContent(v) { this._v = v; }, get innerHTML() { return this._v || ''; } }),
        addEventListener: () => {},
        documentElement: {},
        body: { style: {} }
    };
    const source = fs.readFileSync(path.join(root, 'src', 'js', 'content.js'), 'utf8');
    const api = new Function(
        'document', 'localStorage', 'window', 'IC', 'showToast', 'requestAnimationFrame', 'fetch',
        `${source}\n;return { openSharedContent };`
    )(document, { getItem: () => null, setItem: () => {} }, {}, () => '', () => {}, () => {}, () => Promise.reject(new Error('offline')));

    assert.equal(api.openSharedContent('seed-1'), true, 'yayındaki yazı açılmalı');
    assert.equal(elements.modalSheet.innerHTML.includes('Testosteronu Destekleyen'), true, 'modal doğru yazıyla doldurulmalı');
    assert.equal(api.openSharedContent('content-yok'), false, 'olmayan içerik sessizce yok sayılmalı');
    assert.equal(api.openSharedContent('"><script>alert(1)</script>'), false, 'geçersiz kimlik reddedilmeli');
    assert.equal(api.openSharedContent(''), false);
});

test('pin bağlantısı site içinde ilgili yazıyı açar', () => {
    const appSource = fs.readFileSync(path.join(root, 'src', 'js', 'app.js'), 'utf8');
    const contentSource = fs.readFileSync(path.join(root, 'src', 'js', 'content.js'), 'utf8');
    assert.match(appSource, /new URLSearchParams\(window\.location\.search\)\.get\('icerik'\)/, 'derin bağlantı parametresi okunmalı');
    assert.match(appSource, /changePage\('blogPage'\)/, 'ziyaretçi blog sekmesine yönlendirilmeli');
    assert.match(contentSource, /window\.openSharedContent=openSharedContent/, 'yazıyı açan yardımcı yayınlanmalı');
    assert.match(contentSource, /function openSharedContent\(id\)/);
});
