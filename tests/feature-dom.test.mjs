import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * DOM koşusu olmadan arayüz mantığının uçtan uca denetimi:
 * Damat Atomu widget'ı (mount → kaydırıcı → canlı hesap → sıfırlama) ve
 * KVKK kalkanı (onay → yeşil kalkan animasyon durumu) sahte DOM üzerinde,
 * gerçek src/js/app.js + validation.js koduyla çalıştırılır.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------ sahte DOM
class El {
    constructor(id = '') {
        this.id = id;
        this._innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.checked = false;
        this.hidden = false;
        this.style = {};
        this.dataset = {};
        this._classes = new Set();
        this._attrs = new Map();
        this.children = [];
        this.parentNode = null;
        this._valueTouched = false;
    }
    get classList() {
        const self = this;
        return {
            add: (...c) => c.forEach(x => self._classes.add(x)),
            remove: (...c) => c.forEach(x => self._classes.delete(x)),
            toggle: (c, force) => {
                const on = force === undefined ? !self._classes.has(c) : !!force;
                if (on) self._classes.add(c); else self._classes.delete(c);
                return on;
            },
            contains: c => self._classes.has(c)
        };
    }
    set innerHTML(html) {
        this._innerHTML = String(html);
        // Etiketleri tara: id + value özniteliklerini sahte elemanlara taşı
        for (const tag of this._innerHTML.matchAll(/<[a-z]+[^>]*>/g)) {
            const idm = tag[0].match(/id="([A-Za-z0-9_-]+)"/);
            if (!idm) continue;
            const el = ensure(idm[1]);
            const valm = tag[0].match(/value="([^"]*)"/);
            if (valm && !el._valueTouched) el.value = valm[1];
        }
    }
    get innerHTML() { return this._innerHTML; }
    setAttribute(k, v) { this._attrs.set(k, String(v)); }
    getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
    removeAttribute(k) { this._attrs.delete(k); }
    hasAttribute(k) { return this._attrs.has(k); }
    toggleAttribute(k, force) {
        const on = force === undefined ? !this._attrs.has(k) : !!force;
        if (on) this._attrs.set(k, ''); else this._attrs.delete(k);
        return on;
    }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    insertAdjacentElement(_pos, el) { this.appendChild(el); return el; }
    addEventListener() {}
    removeEventListener() {}
    focus() {}
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); }
    closest() { return null; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    get offsetWidth() { return 100; }
    scrollIntoView() {}
}

const registry = {};
const ensure = id => { if (!registry[id]) registry[id] = new El(id); return registry[id]; };

const domListeners = {};
globalThis.document = {
    getElementById: id => registry[id] || null,
    createElement: () => new El(),
    querySelector: () => new El(),
    querySelectorAll: () => [],
    addEventListener: (ev, fn) => { (domListeners[ev] ||= []).push(fn); },
    removeEventListener() {},
    head: new El('head'),
    body: new El('body'),
    cookie: ''
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.dispatchEvent = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.location = { search: '', protocol: 'https:', href: 'https://testotavan.vercel.app/' };
globalThis.requestAnimationFrame = fn => fn();
globalThis.scrollTo = () => {};

// ------------------------------------------------------------ modüller
new Function(fs.readFileSync(path.join(root, 'src', 'js', 'validation.js'), 'utf8'))();
// app.js klasik script gibi GLOBAL kapsamda değerlendirilir (indirect eval);
// böylece satır içi onclick işleyicilerinin dayandığı global adlar oluşur
(0, eval)(fs.readFileSync(path.join(root, 'src', 'js', 'app.js'), 'utf8'));

const V = globalThis.TestoValidation;

function fireDomContentLoaded() {
    ensure('toastContainer');
    ensure('damatAtomuMount');
    ensure('privacyShield');
    (domListeners['DOMContentLoaded'] || []).forEach(fn => fn());
}

// ------------------------------------------------------------ Damat Atomu widget'ı

test('widget açılışta bağlanır ve varsayılan gramajla doğru hesaplar', () => {
    fireDomContentLoaded();

    const mount = ensure('damatAtomuMount');
    assert.match(mount.innerHTML, /da-widget/);
    assert.match(mount.innerHTML, /type="range"/);

    assert.equal(ensure('damatAtomuMount-kcal').textContent, '649');
    assert.equal(ensure('damatAtomuMount-mg').textContent, '161,4');
    assert.equal(ensure('damatAtomuMount-zn').textContent, '2,02');
    assert.ok(ensure('damatAtomuMount-kcalPct').textContent.startsWith('26%'));
});

test('kaydırıcı değişince kalori, gram etiketi ve canlı log anında güncellenir', () => {
    const range = ensure('damatAtomuMount-range-bal');
    range.value = '100';
    range._valueTouched = true;

    globalThis.updateDamatAtomu('damatAtomuMount');

    const expected = V.computeDamatAtomuMix({ bal: 100, muz: 120, ceviz: 30, badem: 20, hurma: 50 });
    assert.equal(ensure('damatAtomuMount-kcal').textContent, V.formatNumber(expected.totals.kcal, 0));
    assert.equal(ensure('damatAtomuMount-gram-bal').textContent, '100 g');

    const log = ensure('damatAtomuMount-log');
    assert.match(log.innerHTML, /🍯 Bal/);
    assert.ok(log.innerHTML.includes('kcal'), 'log kalori katkısı içermeli');
    assert.ok(log.innerHTML.includes('mg Mg'), 'log magnezyum katkısı içermeli');
});

test('sıfırlama kaydırıcıları varsayılan gramaja döndürür', () => {
    const range = ensure('damatAtomuMount-range-ceviz');
    range.value = '150';
    range._valueTouched = true;
    globalThis.updateDamatAtomu('damatAtomuMount');

    globalThis.resetDamatAtomu('damatAtomuMount');
    assert.equal(range.value, String(V.DAMAT_ATOMU_INGREDIENTS.find(i => i.id === 'ceviz').defaultGrams));
    assert.equal(ensure('damatAtomuMount-kcal').textContent, '649');
});

test('aynı widget tarife modalında farklı scope ile de bağlanabilir', () => {
    const modalMount = ensure('modalDamatAtomuMount');
    globalThis.mountDamatAtomuWidget('modalDamatAtomuMount');
    assert.match(modalMount.innerHTML, /da-widget/);
    assert.equal(ensure('modalDamatAtomuMount-kcal').textContent, '649');
    // sayfa widget'ı etkilenmemeli
    assert.equal(ensure('damatAtomuMount-kcal').textContent, '649');
});

// ------------------------------------------------------------ KVKK kalkanı

test('onay işaretlenince yeşil kalkan görünür ve active sınıfı alır', () => {
    fireDomContentLoaded();
    const shield = ensure('privacyShield');
    const checkbox = new El('consentCheck');

    checkbox.checked = true;
    globalThis.setConsent(checkbox);
    assert.equal(shield.hidden, false);
    assert.ok(shield.classList.contains('active'));

    checkbox.checked = false;
    globalThis.setConsent(checkbox);
    assert.equal(shield.hidden, true);
    assert.ok(!shield.classList.contains('active'));
});
