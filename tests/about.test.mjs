import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createAboutHandler } from '../api/about.js';
import { ABOUT_DEFAULTS, ABOUT_FIELDS, normalizeAbout } from '../api/_about-shape.js';
import { createSessionCookie } from '../api/_auth.js';

process.env.DATABASE_URL = 'postgresql://test.invalid/about';
process.env.SESSION_SECRET = 'about-test-secret';
const content = () => ({ tr: { ...ABOUT_DEFAULTS, title: 'Hakkımda' }, en: { title: 'About me' } });
const adminHeaders = () => ({
    cookie: createSessionCookie().split(';')[0],
    'content-type': 'application/json',
    'x-testotavan-about': '1'
});
function server() {
    let saved;
    const queries = [];
    const handler = createAboutHandler(() => async (strings, ...values) => {
        const sql = strings.join('?');
        queries.push(sql);
        if (sql.startsWith('INSERT')) saved = JSON.parse(values[0]);
        if (sql.startsWith('SELECT')) return saved ? [{ content: saved }] : [];
        return [];
    });
    return {
        queries,
        async request(method = 'GET', body, headers = {}) {
            const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
            await handler({ method, body, headers }, res);
            return res;
        }
    };
}

test('Hakkımızda ilk okumada mevcut metinleri döndürür; varsayılanları veritabanına yazmaz', async () => {
    const s = server();
    const res = await s.request();
    assert.equal(res.code, 200);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(res.data.content.tr, ABOUT_DEFAULTS);
    assert.deepEqual(res.data.fields, ABOUT_FIELDS);
    assert.ok(!s.queries.some(q => q.startsWith('INSERT')));
});

test('Hakkımızda kayıtları ve çeviriler kaydedilir, yeniden okunduğunda korunur', async () => {
    const s = server();
    const input = content();
    assert.equal((await s.request('PUT', { content: input }, adminHeaders())).code, 200);
    assert.deepEqual((await s.request()).data.content, normalizeAbout(input));
    input.tr.name = 'Yeni isim';
    input.en.title = '';
    await s.request('PUT', { content: input }, adminHeaders());
    assert.deepEqual((await s.request()).data.content, normalizeAbout(input));
    assert.ok(s.queries.some(q => /ON CONFLICT \(id\) DO UPDATE/.test(q)));
});

test('Hakkımızda yazma yetkisi, CSRF ve içerik türü DB erişiminden önce doğrulanır', async () => {
    const s = server();
    assert.equal((await s.request('PUT', { content: content() })).code, 401);
    assert.equal((await s.request('PUT', {}, { ...adminHeaders(), 'sec-fetch-site': 'cross-site' })).code, 403);
    assert.equal((await s.request('PUT', {}, { ...adminHeaders(), 'x-testotavan-about': '' })).code, 403);
    assert.equal((await s.request('PUT', {}, { ...adminHeaders(), 'content-type': 'text/plain' })).code, 415);
    assert.equal((await s.request('DELETE')).code, 405);
    assert.equal(s.queries.length, 0);
});

test('Hakkımızda boş, yanlış türde ve fazla uzun alanları reddeder', async () => {
    const s = server();
    for (const value of ['', '   ', 42, 'x'.repeat(201)]) {
        const input = content();
        input.tr.title = value;
        assert.equal((await s.request('PUT', { content: input }, adminHeaders())).code, 400);
    }
    assert.equal((await s.request('PUT', {}, adminHeaders())).code, 400);
    assert.equal(s.queries.length, 0);
    const input = content();
    input.tr.untrusted = 'ignored';
    assert.equal(normalizeAbout(input).tr.untrusted, undefined);
});

test('Hakkımızda DB yapılandırılmadıysa kayıt başarılı gibi gösterilmez', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
        assert.equal((await server().request('PUT', { content: content() }, adminHeaders())).code, 503);
    } finally { process.env.DATABASE_URL = original; }
});

// Minimal DOM: paneli ve ziyaretçi görünümünü aynı düğümlerle davranışsal olarak sınar.
function dom(ids = []) {
    const elements = new Map();
    function element(tag = 'div') {
        const classes = new Set();
        let id, text = '';
        return {
            tagName: tag, dataset: {}, children: [], childNodes: [], value: '', hidden: false,
            classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
            set id(value) { id = value; elements.set(id, this); }, get id() { return id; },
            set textContent(value) { text = value; }, get textContent() { return text; },
            append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = nodes; },
            handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
            focus() { this.focused = true; },
            closest() { return this.dataset.aboutCustom ? this : null; }
        };
    }
    ids.forEach(id => { element().id = id; });
    const document = {
        createElement: element, getElementById: id => elements.get(id) || null,
        querySelectorAll: selector => selector === '[data-about-field]' ? [...elements.values()].filter(x => x.dataset.aboutField) : [],
        addEventListener() {}, documentElement: {}
    };
    return { document, elements };
}

const contentSource = fs.readFileSync(new URL('../src/js/content.js', import.meta.url), 'utf8');
test('ziyaretçi kayıtlı metni ve dil değişikliklerini görür; HTML çalıştırılmaz', async () => {
    const { document, elements } = dom(['about-title']);
    const title = elements.get('about-title');
    title.dataset.aboutField = 'title';
    let lang = 'tr';
    let records = content();
    records.tr.title = '<img src=x onerror=alert(1)>\nHakkımda';
    const api = new Function('document', 'localStorage', 'window', 'fetch', `${contentSource}\nreturn { loadAboutContent, applyTranslations };`)(
        document, { getItem: () => lang }, {}, async () => ({ ok: true, json: async () => ({ content: records }) })
    );
    await api.loadAboutContent();
    assert.equal(title.textContent, records.tr.title);
    assert.equal(title.children.length, 0, 'metin HTML olarak eklenmemeli');
    lang = 'en'; api.applyTranslations();
    assert.equal(title.textContent, 'About me');
    lang = 'de'; api.applyTranslations();
    assert.equal(title.textContent, records.tr.title, 'çeviri boşsa TR gösterilmeli');
    records = { tr: { title: 'Güncellendi' } };
    await api.loadAboutContent();
    assert.equal(title.textContent, 'Güncellendi', 'sayfaya tekrar girişte güncel veri alınmalı');
});

test('admin editörü yükler, kaydeder, tekrar açar; hata halinde düzenlemeyi korur', async () => {
    const ids = ['about-editor-form', 'about-editor-status', 'about-editor-retry', 'about-editor-language', 'about-editor-save', 'about-editor-fields'];
    const { document, elements } = dom(ids);
    const get = id => elements.get(id);
    get('about-editor-language').value = 'tr';
    const s = server();
    let fail = false;
    const fetch = async (url, options = {}) => {
        assert.equal(url, '/api/about');
        if (fail) throw new Error('Bağlantı hatası');
        const response = await s.request(options.method || 'GET', options.body ? JSON.parse(options.body) : undefined, options.method ? adminHeaders() : {});
        return { ok: response.code === 200, json: async () => response.data };
    };
    const window = {};
    const source = fs.readFileSync(new URL('../admin/about.js', import.meta.url), 'utf8');
    new Function('document', 'window', 'fetch', source)(document, window, fetch);
    await window.loadAboutEditor();
    assert.equal(get('about-tr-name').value, ABOUT_DEFAULTS.name);
    get('about-tr-name').value = 'Panelden yeni isim';
    await get('about-editor-form').handlers.submit({ preventDefault() {} });
    assert.match(get('about-editor-status').textContent, /kaydedildi/);
    await window.loadAboutEditor();
    assert.equal(get('about-tr-name').value, 'Panelden yeni isim');
    get('about-tr-name').value = 'Henüz kaydedilmeyen isim';
    fail = true;
    await get('about-editor-form').handlers.submit({ preventDefault() {} });
    assert.match(get('about-editor-status').textContent, /korunuyor/);
    assert.equal(get('about-tr-name').value, 'Henüz kaydedilmeyen isim');
    assert.equal(get('about-editor-save').disabled, false);
    await window.loadAboutEditor();
    assert.equal(get('about-editor-form').classList.contains('hidden'), true, 'yükleme hatasında boş form kaydedilmemeli');
    assert.equal(get('about-editor-retry').classList.contains('hidden'), false);
});

test('tüm editör alanları ziyaretçi sayfasında bağlıdır', () => {
    const html = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
    for (const field of ABOUT_FIELDS) assert.ok(html.includes(`data-about-field="${field.key}"`), field.key);
    const admin = fs.readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
    assert.match(admin, /id="about-editor"/);
    assert.match(admin, /window\.loadAboutEditor\(\)/);
});

test('ziyaretçi yükleme hatasında mevcut metni korur ve sonraki girişte tekrar dener', async () => {
    const { document, elements } = dom(['about-title']);
    const title = elements.get('about-title');
    title.dataset.aboutField = 'title';
    title.textContent = 'Mevcut metin';
    let available = false;
    const api = new Function('document', 'localStorage', 'window', 'fetch', 'console', `${contentSource}\nreturn { loadAboutContent };`)(
        document, { getItem: () => 'tr' }, {}, async () => {
            if (!available) throw new Error('offline');
            return { ok: true, json: async () => ({ content: content() }) };
        }, { warn() {} }
    );
    await api.loadAboutContent();
    assert.equal(title.textContent, 'Mevcut metin');
    available = true;
    await api.loadAboutContent();
    assert.equal(title.textContent, 'Hakkımda');
});
