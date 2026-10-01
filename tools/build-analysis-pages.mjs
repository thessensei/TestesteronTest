/*
 * Kan testi formundaki satırları tek kaynaktan (validation çekirdeği) üretir.
 * Referans aralığı / geçerli giriş aralığı / birim listesi değiştiğinde:
 *   node tools/build-analysis-pages.mjs
 * komutuyla index.html içindeki ANALYSIS-PAGES bloğu yeniden yazılır.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Hash'li dosya adını bul (tek sürüm bulunur)
const jsDir = path.join(root, 'js');
const validationFile = fs.readdirSync(jsDir).find(f => /^(_)?validation.*\.js$/.test(f));
const source = fs.readFileSync(path.join(jsDir, validationFile), 'utf8');
new Function(source)();
const V = globalThis.TestoValidation;

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function row(marker, indent = '            ') {
    const unit = marker.unit;
    const units = marker.units
        .map(u => `<option value="${u.code}">${u.code}</option>`)
        .join('');
    const chip = marker.required
        ? '<span class="chip chip-req">Zorunlu</span>'
        : '<span class="chip chip-opt">Opsiyonel</span>';

    return `${indent}<div class="lab-row" data-marker="${marker.id}">
${indent}    <div class="lab-row-head">
${indent}        <label class="lab-name" for="${marker.id}">${escape(marker.label)} ${chip}</label>
${indent}        <span class="lab-accept" id="accept-${marker.id}">Geçerli giriş aralığı: ${escape(V.describeRange(marker, unit, 'accept'))}</span>
${indent}    </div>
${indent}    <div class="lab-inputs">
${indent}        <input type="text" class="form-input" id="${marker.id}" inputmode="decimal" autocomplete="off"
${indent}               placeholder="${escape(V.placeholderFor(marker, unit))}" data-marker-key="${marker.key}">
${indent}        <select class="form-input unit-select" id="unit-${marker.id}" aria-label="${escape(marker.label)} birimi"
${indent}                onchange="onUnitChange('${marker.id}')">${units}</select>
${indent}    </div>
${indent}    <div class="lab-hint" id="hint-${marker.id}"><b>Lab normal aralığı: ${escape(V.describeRange(marker, unit, 'ref'))}</b> — ${escape(marker.explain)}</div>
${indent}    <div class="form-error" id="error-${marker.id}" role="alert"></div>
${indent}    <div class="form-warning" id="warn-${marker.id}" role="status"></div>
${indent}</div>`;
}

const HORMONES = ['totalT', 'freeT', 'shbg', 'lh', 'fsh', 'estradiol', 'cortisol'];
const VITAMINS = ['ferritin', 'vitD', 'b12', 'zinc', 'mg'];

const hormoneRows = HORMONES.map(k => row(V.MARKER_BY_KEY[k])).join('\n');
const vitaminRows = VITAMINS.map(k => row(V.MARKER_BY_KEY[k])).join('\n');

const template = fs.readFileSync(path.join(root, 'tools', 'analysis-pages.template.html'), 'utf8');
const pages = template
    .replace('{{HORMONE_ROWS}}', hormoneRows)
    .replace('{{VITAMIN_ROWS}}', vitaminRows)
    .trimEnd();

const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const START = '<!-- ANALYSIS-PAGES:START (tools/build-analysis-pages.mjs tarafından üretilir) -->';
const END = '<!-- ANALYSIS-PAGES:END -->';

if (!html.includes(START)) {
    throw new Error('index.html içinde ANALYSIS-PAGES bloğu bulunamadı.');
}

const before = html.slice(0, html.indexOf(START) + START.length);
const after = html.slice(html.indexOf(END));
html = `${before}\n${pages}\n${after}`;

fs.writeFileSync(indexPath, html);
console.log(`ANALYSIS-PAGES bloğu güncellendi (${HORMONES.length + VITAMINS.length} parametre).`);
