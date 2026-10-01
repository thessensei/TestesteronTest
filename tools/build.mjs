#!/usr/bin/env node
/*
 * TestoTavan — yayın dosyalarını üretir.
 *
 * Kaynaklar            →  Üretilen (deploy edilen) dosyalar
 *   src/index.html     →  index.html            (yalnızca <style> bloğu küçültülür)
 *   src/js/*.js        →  js/<ad>.<hash>.js     (boşluk/yorum küçültmesi + içerik hash'i)
 *
 * Kurallar:
 *  - HTML gövdesine dokunulmaz; sadece stil bloğu ve <script src> yolları değişir.
 *  - JS küçültmesinde değişken/fonksiyon adları KORUNUR. index.html içindeki
 *    satır içi onclick/onchange işleyicileri bu global adlara bağlı olduğu için
 *    isim karıştırma (mangle) kesinlikle kapalıdır.
 *
 * Kullanım: npm run build:assets   (veya node tools/build.mjs --check)
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const srcJsDir = path.join(srcDir, 'js');
const outJsDir = path.join(root, 'js');

const CHECK_ONLY = process.argv.includes('--check');

const hash8 = text => createHash('sha256').update(text).digest('hex').slice(0, 8);
const read = file => fs.readFileSync(file, 'utf8');

/** Klasik script'leri küçültür: yorum + boşluk gider, adlar aynı kalır. */
async function minifyScript(code, name) {
    const result = await esbuild.transform(code, {
        loader: 'js',
        format: undefined,
        minifyWhitespace: true,
        minifySyntax: true,
        minifyIdentifiers: false,
        legalComments: 'none',
        charset: 'utf8',
        target: 'es2019',
        sourcefile: name
    });
    return result.code;
}

async function minifyCss(code) {
    const result = await esbuild.transform(code, {
        loader: 'css',
        minify: true,
        charset: 'utf8',
        target: 'chrome90'
    });
    return result.code;
}

/** Üretilecek dosyaların tamamını bellekte hazırlar. */
export async function buildArtifacts() {
    const files = new Map(); // yol (repo köküne göre) -> içerik

    // 1) validation.js ve content.js bağımsızdır
    const validationCode = await minifyScript(read(path.join(srcJsDir, 'validation.js')), 'validation.js');
    const validationName = `validation.${hash8(validationCode)}.js`;

    const contentCode = await minifyScript(read(path.join(srcJsDir, 'content.js')), 'content.js');
    const contentName = `content.${hash8(contentCode)}.js`;

    // 2) app.js, content modülünü çalışma anında yüklediği için hash'li adı gömülür
    const appSource = read(path.join(srcJsDir, 'app.js'));
    const needle = "const OPTIONAL_FEATURES_URL = 'js/content.js';";
    if (!appSource.includes(needle)) {
        throw new Error(`src/js/app.js içinde beklenen satır yok: ${needle}`);
    }
    const appCode = await minifyScript(
        appSource.replace(needle, `const OPTIONAL_FEATURES_URL = 'js/${contentName}';`),
        'app.js'
    );
    const appName = `app.${hash8(appCode)}.js`;

    files.set(path.posix.join('js', validationName), validationCode);
    files.set(path.posix.join('js', contentName), contentCode);
    files.set(path.posix.join('js', appName), appCode);

    // 3) index.html: stil bloğu küçültülür, script yolları güncellenir
    let html = read(path.join(srcDir, 'index.html'));

    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (!styleMatch) throw new Error('src/index.html içinde <style> bloğu bulunamadı');
    const minifiedCss = await minifyCss(styleMatch[1]);
    html = html.replace(styleMatch[0], `<style>${minifiedCss}</style>`);

    const scriptReplacements = [
        [/<script defer src="js\/validation[^"]*\.js"><\/script>/, `<script defer src="js/${validationName}"></script>`],
        [/<script defer src="js\/app[^"]*\.js"><\/script>/, `<script defer src="js/${appName}"></script>`]
    ];
    for (const [pattern, replacement] of scriptReplacements) {
        if (!pattern.test(html)) throw new Error(`index.html içinde script etiketi bulunamadı: ${pattern}`);
        html = html.replace(pattern, replacement);
    }

    const banner = '<!-- ÜRETİLMİŞ DOSYA — düzenlemeyin. Kaynak: src/index.html, derleme: npm run build:assets -->\n';
    html = html.replace('<!DOCTYPE html>\n', `<!DOCTYPE html>\n${banner}`);

    files.set('index.html', html);
    return files;
}

function writeArtifacts(files) {
    fs.mkdirSync(outJsDir, { recursive: true });

    // eski hash'li js dosyalarını temizle
    const keep = new Set([...files.keys()].filter(f => f.startsWith('js/')).map(f => path.basename(f)));
    for (const file of fs.readdirSync(outJsDir)) {
        if (file.endsWith('.js') && !keep.has(file)) fs.rmSync(path.join(outJsDir, file));
    }

    for (const [relative, content] of files) {
        const target = path.join(root, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
    }
}

/** Depodaki üretilmiş dosyalar kaynaklarla uyumlu mu? */
export function diffArtifacts(files) {
    const problems = [];
    for (const [relative, content] of files) {
        const target = path.join(root, relative);
        if (!fs.existsSync(target)) {
            problems.push(`${relative} eksik`);
            continue;
        }
        if (read(target) !== content) problems.push(`${relative} güncel değil`);
    }
    const expected = new Set([...files.keys()].filter(f => f.startsWith('js/')).map(f => path.basename(f)));
    if (fs.existsSync(outJsDir)) {
        for (const file of fs.readdirSync(outJsDir)) {
            if (file.endsWith('.js') && !expected.has(file)) problems.push(`js/${file} artık kullanılmıyor`);
        }
    }
    return problems;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    const files = await buildArtifacts();

    if (CHECK_ONLY) {
        const problems = diffArtifacts(files);
        if (problems.length) {
            console.error('Üretilmiş dosyalar güncel değil:\n  - ' + problems.join('\n  - '));
            console.error('\nÇözüm: npm run build:assets');
            process.exit(1);
        }
        console.log('Üretilmiş dosyalar güncel.');
    } else {
        writeArtifacts(files);
        for (const [relative, content] of files) {
            const source = relative === 'index.html'
                ? path.join(srcDir, 'index.html')
                : path.join(srcJsDir, `${path.basename(relative).split('.')[0]}.js`);
            const before = fs.statSync(source).size;
            const after = Buffer.byteLength(content);
            const saved = Math.round((1 - after / before) * 100);
            console.log(`${relative.padEnd(28)} ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB  (-%${saved})`);
        }
    }
}
