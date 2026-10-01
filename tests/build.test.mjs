import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifacts, diffArtifacts } from '../tools/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const builtIndex = read('index.html');
const jsFiles = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'));
const builtJs = jsFiles.map(f => read(path.join('js', f))).join('\n');

// ------------------------------------------------- üretilmiş dosyalar güncel

test('js/ ve index.html, src/ kaynaklarıyla güncel', async () => {
    const problems = diffArtifacts(await buildArtifacts());
    assert.deepEqual(problems, [], `Kaynaklar değişmiş. Çözüm: npm run build:assets\n${problems.join('\n')}`);
});

test('index.html gövdesi kaynakla birebir aynı (yalnızca stil bloğu küçültülür)', () => {
    const strip = html => html
        .replace(/<style>[\s\S]*?<\/style>/, '<style>#</style>')
        .replace(/<!-- ÜRETİLMİŞ DOSYA[^>]*-->\n/, '')
        .replace(/js\/(app|validation|content)\.[0-9a-f]+\.js/g, 'js/$1.js');
    assert.equal(strip(builtIndex), strip(read(path.join('src', 'index.html'))), 'derleme HTML gövdesini değiştirmemeli');
});

// --------------------------------------------------------- yayın dosya yolları

test('index.html yalnızca var olan hash\'li paketleri çağırır', () => {
    const referenced = [...builtIndex.matchAll(/<script defer src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
    assert.equal(referenced.length, 2, 'validation ve app paketleri yüklenmeli');
    for (const file of referenced) {
        assert.ok(fs.existsSync(path.join(root, file)), `${file} yayın klasöründe yok`);
        assert.match(file, /\.[0-9a-f]{8}\.js$/, `${file} içerik hash'i taşımalı (uzun süreli önbellek)`);
    }
});

test('app paketi içerik modülünü hash\'li adıyla yükler', () => {
    const appFile = jsFiles.find(f => f.startsWith('app.'));
    const contentFile = jsFiles.find(f => f.startsWith('content.'));
    assert.ok(appFile && contentFile, 'app ve content paketleri üretilmeli');
    assert.ok(read(path.join('js', appFile)).includes(`js/${contentFile}`), 'app paketi güncel content paketini işaret etmeli');
});

// ------------------------------------------------- küçültme davranışı bozmaz

test('satır içi onclick/onchange işleyicileri üretilmiş paketlerde tanımlı', () => {
    const handlers = [...builtIndex.matchAll(/\son[a-z]+="([^"]*)"/g)].map(m => m[1]);
    const called = new Set();
    for (const handler of handlers) {
        for (const match of handler.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) called.add(match[1]);
    }
    const browserGlobals = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'Number', 'String', 'Boolean', 'parseInt', 'parseFloat', 'alert', 'confirm', 'setTimeout', 'requestAnimationFrame', 'fetch', 'encodeURIComponent', 'decodeURIComponent']);
    const missing = [...called].filter(name => {
        if (browserGlobals.has(name)) return false;
        return !new RegExp(`(function\\s+${name}\\b|\\b${name}\\s*=\\s*(async\\s+)?(function|\\(|[A-Za-z_$]))`).test(builtJs);
    });
    assert.deepEqual(missing, [], 'küçültme sırasında global fonksiyon adları korunmalı');
});

test('küçültülmüş validation paketi aynı API\'yi sunar', async () => {
    const validationFile = jsFiles.find(f => f.startsWith('validation.'));
    const vm = await import('node:vm');
    const context = vm.createContext({ window: {}, document: { addEventListener() {} }, console });
    vm.runInContext(read(path.join('js', validationFile)), context);
    const api = context.window.TestoValidation || context.TestoValidation;
    assert.ok(api, 'TestoValidation global olarak tanımlanmalı');
    for (const fn of ['validatePhysical', 'validateBlood', 'validateBloodPanel', 'estimateFromSymptoms', 'computeOverallScore', 'parseLabText']) {
        assert.equal(typeof api[fn], 'function', `${fn} küçültülmüş pakette kayıp`);
    }
    const estimate = api.estimateFromSymptoms({ age: 34, height: 178, weight: 82, sleep: 6, stress: 3, symptoms: [] });
    assert.ok(estimate && typeof estimate === 'object', 'tahmin motoru çalışmalı');
});

// --------------------------------------------------------------- görsel boyutu

test('logo varlıkları mobil için küçük tutulur', () => {
    const webp = fs.statSync(path.join(root, 'assets', 'logo.webp')).size;
    const png = fs.statSync(path.join(root, 'assets', 'logo.png')).size;
    assert.ok(webp < 60 * 1024, `assets/logo.webp çok büyük: ${webp} bayt`);
    assert.ok(png < 60 * 1024, `assets/logo.png (favicon) çok büyük: ${png} bayt`);
    assert.match(builtIndex, /src="assets\/logo\.webp"[^>]*onerror=/, 'logo WebP + PNG yedeğiyle sunulmalı');
});
