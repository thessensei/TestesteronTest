// ========================================
// TestoTavan — arayüz katmanı
// Akış: Semptom -> Tahmin -> Doğrulama
// ========================================
const IC = id => `<svg class="ic" aria-hidden="true"><use href="#${id}"></use></svg>`;
const V = () => window.TestoValidation;
// Çeviri modülü isteğe bağlı yüklenir; yüklenene kadar kaynak metin gösterilir.
const T = text => window.translateUi ? window.translateUi(text) : text;

// Uygulama durumu (ekranlar arası tutarlılık için tek kaynak)
const state = {
    step: 1,
    progress: 10,
    progressNote: '',
    estimate: null,
    measurement: 'baseline',
    consent: false,
    lastSource: 'manual'
};

// ========================================
// ADIM GÖSTERGESİ + İLERLEME
// ========================================
const STEPS = [
    { id: 1, label: 'Semptom' },
    { id: 2, label: 'Tahmin' },
    { id: 3, label: 'Doğrulama' }
];

function renderSteppers() {
    document.querySelectorAll('[data-stepper]').forEach(node => {
        node.innerHTML = STEPS.map(step => {
            const done = step.id < state.step;
            const active = step.id === state.step;
            const cls = done ? 'step done' : (active ? 'step active' : 'step');
            return `<div class="${cls}" aria-current="${active ? 'step' : 'false'}">
                        <span class="step-dot">${done ? IC('i-check') : step.id}</span>
                        <span class="step-label">${T(step.label)}</span>
                    </div>`;
        }).join('<span class="step-line" aria-hidden="true"></span>');
    });
}

function setStep(step) {
    state.step = step;
    renderSteppers();
}

function setProgress(percent, note) {
    state.progress = percent;
    document.querySelectorAll('[data-progress]').forEach(node => {
        state.progressNote = note || `Analizin %${percent} tamamlandı`;
    const text = T(state.progressNote);
        node.innerHTML = `
            <div class="progress-head">
                <span>${text}</span>
                <span class="progress-pct">%${percent}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        `;
    });
}

// ========================================
// FORM DOĞRULAMA YARDIMCILARI
// ========================================
function getFieldErrorBox(input) {
    if (!input) return null;
    let box = document.getElementById('error-' + input.id);
    if (!box) {
        box = document.createElement('div');
        box.className = 'form-error';
        box.id = 'error-' + input.id;
        box.setAttribute('role', 'alert');
        input.insertAdjacentElement('afterend', box);
    }
    return box;
}

function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const box = getFieldErrorBox(input);
    input.classList.add('is-invalid');
    input.classList.remove('is-warning');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', box.id);
    box.textContent = message;
    box.classList.add('visible');
    clearFieldWarning(inputId);
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const box = document.getElementById('error-' + inputId);
    if (box) {
        box.textContent = '';
        box.classList.remove('visible');
    }
}

// Anomali: reddetme, uyar
function setFieldWarning(inputId, message) {
    const input = document.getElementById(inputId);
    const box = document.getElementById('warn-' + inputId);
    if (!input || !box) return;
    input.classList.add('is-warning');
    box.innerHTML = `${IC('i-warning')} ${message}`;
    box.classList.add('visible');
}

function clearFieldWarning(inputId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById('warn-' + inputId);
    if (input) input.classList.remove('is-warning');
    if (box) {
        box.innerHTML = '';
        box.classList.remove('visible');
    }
}

function readFieldValues(fields) {
    const values = {};
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        values[field.id] = input ? input.value : '';
    });
    return values;
}

function applyValidation(fields, result) {
    fields.forEach(field => {
        if (result.errors && result.errors[field.id]) {
            setFieldError(field.id, result.errors[field.id]);
        } else {
            clearFieldError(field.id);
        }
    });

    if (!result.ok) {
        showToast(IC('i-warning') + ' ' + result.message, 'red');
        const focusId = result.firstErrorId;
        if (focusId) {
            const input = document.getElementById(focusId);
            if (input) input.focus();
        }
    }
    return result.ok;
}

// ========================================
// SAYFA / TOAST
// ========================================
function changePage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        const isCurrent = item.getAttribute('aria-controls') === pageId;
        item.classList.toggle('active', isCurrent);
        item.toggleAttribute('aria-current', isCurrent);
    });

    if (pageId === 'physicalPage') setStep(state.estimate ? 2 : 1);
    if (pageId === 'bloodPage') setStep(3);

    if (pageId === 'blogPage') {
        loadOptionalFeatures().then(() => {
            window.renderContent();
            window.ensureBlogData();
        });
    }
    if (pageId === 'aboutPage') loadOptionalFeatures().then(() => window.loadAboutContent?.());
    if (pageId === 'adminPage') loadOptionalFeatures().then(() => window.renderAdmin?.());
    if (window.applyTranslations) requestAnimationFrame(window.applyTranslations);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, color) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';

    const colors = {
        gold: 'var(--gold)',
        green: 'var(--green)',
        red: 'var(--red)',
        blue: 'var(--blue)'
    };

    toast.style.borderLeft = `4px solid ${colors[color] || colors.gold}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ========================================
// SEMPTOM SEÇİMİ
// ========================================
function renderSymptomGrid() {
    const grid = document.getElementById('symptomGrid');
    if (!grid || !V()) return;

    grid.innerHTML = V().SYMPTOMS.map(symptom => `
        <label class="symptom-chip" for="sym-${symptom.id}">
            <input type="checkbox" id="sym-${symptom.id}" value="${symptom.id}" onchange="onSymptomChange()">
            <span>${T(symptom.label)}</span>
        </label>
    `).join('');
}

function selectedSymptoms() {
    return Array.from(document.querySelectorAll('#symptomGrid input:checked')).map(i => i.value);
}

function onSymptomChange() {
    const count = selectedSymptoms().length;
    const info = document.getElementById('symptomCount');
    if (info) {
        info.textContent = count === 0
            ? 'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.'
            : `${count} semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.`;
    }
    setProgress(Math.min(60, 10 + count * 8 + 10));
}

// ========================================
// YARDIMCI: ölçek üzerinde yüzde konumu
// ========================================
function safeScroll(target, options) {
    if (!target) return;
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView(options || { behavior: 'smooth', block: 'start' });
}

function scalePos(value, min, max) {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function fmt(value, decimals) {
    return V().formatNumber(value, decimals === undefined ? 0 : decimals);
}

// ========================================
// FİZİKSEL (SEMPTOM) ANALİZİ
// ========================================
function analyzePhysical() {
    const fields = V().PHYSICAL_FIELDS;
    const result = V().validatePhysical(readFieldValues(fields));
    if (!applyValidation(fields, result)) return;

    const symptoms = selectedSymptoms();
    if (!symptoms.length) {
        showToast(IC('i-warning') + ' En az 1 semptom seçin — tahmin buna göre kişiselleşiyor.', 'red');
        safeScroll(document.getElementById('symptomGrid'), { behavior: 'smooth', block: 'center' });
        return;
    }

    const estimate = V().estimateFromSymptoms({
        age: result.values.inputAge,
        height: result.values.inputHeight,
        weight: result.values.inputWeight,
        activity: Number(document.getElementById('inputActivity')?.value || 3),
        sleepHours: Number(document.getElementById('inputSleep')?.value || 7),
        stress: Number(document.getElementById('inputStress')?.value || 2),
        symptoms
    });

    state.estimate = estimate;
    setStep(2);
    setProgress(70, 'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama');
    renderEstimate(estimate);
    showToast(IC('i-check') + ' Sonuç ve kişisel planınız hazır.', 'gold');
}

function renderEstimate(est) {
    const panel = document.getElementById('physicalResult');
    const plan = buildPlanFromEstimate(est);
    const SCALE_MIN = 0;
    const SCALE_MAX = 1200;

    const refLeft = scalePos(est.ref[0], SCALE_MIN, SCALE_MAX);
    const refWidth = scalePos(est.ref[1], SCALE_MIN, SCALE_MAX) - refLeft;
    const ciLeft = scalePos(est.low, SCALE_MIN, SCALE_MAX);
    const ciWidth = scalePos(est.high, SCALE_MIN, SCALE_MAX) - ciLeft;
    const pointPos = scalePos(est.point, SCALE_MIN, SCALE_MAX);

    const driverCards = est.cards.map(card => {
        const dec = card.marker.units[0].decimals;
        const scaleMax = card.ref[1] * 1.6;
        const cRefLeft = scalePos(card.ref[0], 0, scaleMax);
        const cRefWidth = scalePos(card.ref[1], 0, scaleMax) - cRefLeft;
        const cBandLeft = scalePos(card.low, 0, scaleMax);
        const cBandWidth = scalePos(card.high, 0, scaleMax) - cBandLeft;
        const cPoint = scalePos(card.value, 0, scaleMax);

        return `
        <article class="lab-card" style="--status:${card.status.color}">
            <header class="lab-card-head">
                <div>
                    <h4 class="lab-card-title">${T(card.title)}</h4>
                    <p class="lab-card-sub">${T('İlgili gösterge:')} ${T(card.marker.label)}</p>
                </div>
                <span class="badge ${card.status.badgeClass}">${T(card.status.label)}</span>
            </header>
            <div class="lab-card-value">
                <strong>${fmt(card.value, dec)}</strong>
                <span class="unit">${card.unit}</span>
                <span class="lab-card-ci">tahmin aralığı ${fmt(card.low, dec)}–${fmt(card.high, dec)}</span>
            </div>
            <div class="ci-track slim">
                <div class="ci-ref" style="left:${cRefLeft}%;width:${cRefWidth}%"></div>
                <div class="ci-band" style="left:${cBandLeft}%;width:${cBandWidth}%"></div>
                <div class="ci-point" style="left:${cPoint}%"></div>
            </div>
            <p class="lab-card-ref">Laboratuvar normal aralığı: <b>${card.refText}</b></p>
            <p class="lab-card-explain">${T(card.explain)}</p>
        </article>`;
    }).join('');

    panel.innerHTML = `
        <section class="estimate-card" style="--status:${est.status.color}">
            <header class="estimate-head">
                <div>
                    <p class="eyebrow">Tahmini değer</p>
                    <h3 class="estimate-title">Total Testosteron</h3>
                </div>
                <span class="badge ${est.status.badgeClass}">${T(est.status.label)}</span>
            </header>

            <div class="estimate-value">${fmt(est.point)}<span class="unit">ng/dL</span></div>
            <p class="estimate-ci">%68 güven aralığı <b>${fmt(est.low)}–${fmt(est.high)} ng/dL</b> · tahmin güveni %${est.confidence}</p>

            <div class="ci-track">
                <div class="ci-ref" style="left:${refLeft}%;width:${refWidth}%"></div>
                <div class="ci-band" style="left:${ciLeft}%;width:${ciWidth}%"></div>
                <div class="ci-point" style="left:${pointPos}%"></div>
            </div>
            <div class="ci-scale"><span>0</span><span>300</span><span>600</span><span>900</span><span>1200</span></div>
            <div class="ci-legend">
                <span><i class="dot ref"></i> Laboratuvar normal aralığı ${est.refText}</span>
                <span><i class="dot band"></i> Sizin tahmin aralığınız</span>
            </div>
            <p class="estimate-note">${IC('i-info')} Bu bir tahmindir, teşhis değildir. Kesin değer yalnızca kan testiyle belirlenir.</p>
        </section>

        <div class="section-title">
            <h3>Semptomlarınıza göre öne çıkanlar</h3>
            <p>${est.cards.length} kart · kritik olan üstte</p>
        </div>
        ${driverCards}

        ${renderSupplementCard(plan, 'Kişisel planınız', `${plan.length} adım · uygulama sırasına göre`)}
        <p class="muted plan-note">${IC('i-info')} Plan tahmini değerinize ve girdilerinize dayanır; kişisel dozlar kan testiyle kesinleşir. Tüm adımlar kilit olmadan yukarıda listelenmiştir.</p>

        <div class="cta-block">
            <button class="btn-primary" onclick="goToVerification()">
                ${IC('i-drop')} &nbsp;KAN TESTİ İLE DOĞRULA
            </button>
            <button class="btn-ghost" onclick="backToSymptoms()">${IC('i-user')} &nbsp;Tahmin girdilerini değiştir</button>
            <p class="trust-line">${IC('i-clock')} Sonuç 5 dakikada · ${IC('i-check')} kayıt gerekmez · tek tıkla iptal</p>
        </div>
    `;

    panel.classList.add('show');
    setTimeout(() => safeScroll(panel), 180);
}

// Kişisel plan doğrudan gösterilir: önce yaşam tarzı adımları, sonra takviyeler.
// Bulanık/kilitli önizleme yok — kullanıcı sonucu bekletilmeden görür.
function buildPlanFromEstimate(est) {
    const readNumber = (id, fallback) => {
        const input = document.getElementById(id);
        const value = input ? V().parseNumber(input.value) : null;
        return value === null ? fallback : value;
    };

    const sleep = readNumber('inputSleep', 7);
    const stress = readNumber('inputStress', 2);
    const activity = readNumber('inputActivity', 3);
    const items = [];

    if (sleep < 7) {
        items.push(sup('Uykuyu 7–9 saate çıkarın',
            `Şu an gecede ${fmt(sleep, sleep % 1 === 0 ? 0 : 1)} saat uyuyorsunuz. Kısa uyku, testosteron üretimini en hızlı düşüren etkenlerden biridir.`,
            'Her gece aynı saatte yatın; yatmadan 1 saat önce ekranı bırakın',
            sleep < 6 ? 'critical' : 'high'));
    }
    if (stress >= 3) {
        items.push(sup('Stres yükünü düşürün',
            'Yüksek stres, kortizol üzerinden testosteron üretimini baskılar.',
            'Günde 10 dakika nefes egzersizi + haftada 2 uzun yürüyüş',
            'high'));
    }
    if (activity <= 1) {
        items.push(sup('Hareketi artırın',
            'Hareketsizlik yağ oranını yükseltir; yağ dokusu testosteronu estradiole çevirir.',
            'Haftada 3 gün 30 dakika tempolu yürüyüş + 2 gün ağırlık çalışması',
            'high'));
    }
    if (est.bmi >= 27) {
        items.push(sup('Kilo yönetimi',
            `Vücut kitle indeksiniz tahminen ${fmt(est.bmi, 1)}. Yağ oranı düştükçe serbest testosteron toparlanır.`,
            'Günlük kalori açığı + protein ağırlıklı beslenme (hekim/diyetisyen desteğiyle)',
            'high'));
    }

    const supplements = buildSupplements({ totalT: est.point });
    return items.concat(supplements).sort((a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank);
}

function backToSymptoms() {
    changePage('physicalPage');
    setTimeout(() => safeScroll(document.getElementById('symptomGrid'), { behavior: 'smooth', block: 'start' }), 350);
}

function goToVerification() {
    changePage('bloodPage');
    setProgress(80, 'Analizin %80 tamamlandı — değerleri girince rapor açılır');
    const anchor = document.getElementById('uploadCard');
    setTimeout(() => safeScroll(anchor, { behavior: 'smooth', block: 'center' }), 350);
}

// ========================================
// KAN TESTİ EKRANI — birim, placeholder, ipucu
// ========================================
function currentUnit(markerId) {
    const select = document.getElementById('unit-' + markerId);
    const marker = V().MARKER_BY_ID[markerId];
    return select ? select.value : marker.unit;
}

function refreshFieldMeta(markerId) {
    const marker = V().MARKER_BY_ID[markerId];
    if (!marker) return;
    const unit = currentUnit(markerId);
    const input = document.getElementById(markerId);
    const hint = document.getElementById('hint-' + markerId);
    const accept = document.getElementById('accept-' + markerId);

    if (input) input.placeholder = V().placeholderFor(marker, unit);
    if (hint) hint.innerHTML = `<b>${T('Lab normal aralığı:')} ${V().describeRange(marker, unit, 'ref')}</b> — ${T(marker.explain)}`;
    if (accept) accept.textContent = T('Geçerli giriş aralığı:') + ' ' + V().describeRange(marker, unit, 'accept');
}

// nmol/L <-> ng/dL gibi birim değişiminde girilen değeri çevirir
function onUnitChange(markerId, previousUnit) {
    const marker = V().MARKER_BY_ID[markerId];
    const input = document.getElementById(markerId);
    const select = document.getElementById('unit-' + markerId);
    if (!marker || !input || !select) return;

    const from = previousUnit || select.dataset.previous || marker.unit;
    const to = select.value;
    const raw = V().parseNumber(input.value);

    if (raw !== null && from !== to) {
        const converted = V().convert(marker.key, raw, from, to);
        const decimals = V().getUnit(marker, to).decimals;
        input.value = String(V().round(converted, decimals)).replace('.', ',');
        showToast(`${IC('i-check')} ${marker.short}: ${from} → ${to} dönüştürüldü`, 'blue');
    }

    select.dataset.previous = to;
    refreshFieldMeta(markerId);
    validateLabField(markerId);
}

function validateLabField(markerId) {
    const marker = V().MARKER_BY_ID[markerId];
    const input = document.getElementById(markerId);
    if (!marker || !input) return true;

    const res = V().validateMarkerValue(input.value, marker, currentUnit(markerId));
    if (!res.ok) {
        setFieldError(markerId, res.error);
        return false;
    }
    clearFieldError(markerId);
    if (res.warning) {
        setFieldWarning(markerId, res.warning);
    } else {
        clearFieldWarning(markerId);
    }
    return true;
}

function setMeasurementType(type) {
    state.measurement = type;
    document.querySelectorAll('[data-measure]').forEach(btn => {
        const active = btn.dataset.measure === type;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    const label = document.getElementById('measurementNote');
    if (label) {
        label.textContent = type === 'baseline'
            ? T('Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.')
            : T('Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.');
    }
}

function toggleManualEntry(force) {
    const section = document.getElementById('manualEntry');
    const link = document.getElementById('manualToggle');
    if (!section) return;
    const willOpen = force === undefined ? section.hasAttribute('hidden') : force;
    if (willOpen) {
        section.removeAttribute('hidden');
        if (link) link.textContent = T('Elle girişi gizle');
        safeScroll(section);
    } else {
        section.setAttribute('hidden', '');
        if (link) link.textContent = T('Değerleri elle gireceğim');
    }
}

function togglePasteBox(force) {
    const box = document.getElementById('pasteBox');
    if (!box) return;
    const willOpen = force === undefined ? box.hasAttribute('hidden') : force;
    box.toggleAttribute('hidden', !willOpen);
    if (willOpen) document.getElementById('pasteText')?.focus();
}

function setConsent(checkbox) {
    state.consent = !!(checkbox && checkbox.checked);
    const note = document.getElementById('consentError');
    if (note && state.consent) note.classList.remove('visible');

    // KVKK / Veri Güvenliği Kalkanı Parlatması
    const card = document.getElementById('kvkkCard');
    const box = document.getElementById('consentBoxWrap');
    const banner = document.getElementById('kvkkShieldBanner');
    const icon = document.getElementById('kvkkCardIcon');

    if (card) card.classList.toggle('shield-active', state.consent);
    if (box) box.classList.toggle('shield-active', state.consent);
    if (banner) {
        banner.classList.toggle('shield-active', state.consent);
        banner.setAttribute('aria-hidden', String(!state.consent));
    }
    if (icon) {
        icon.className = state.consent ? 'card-icon icon-green shield-icon-glow' : 'card-icon icon-purple';
        icon.innerHTML = state.consent ? IC('i-shield') : IC('i-lock');
    }
}

// ========================================
// TAHLİL YÜKLEME & HAFİF OCR BORU HATTI (PDF + Fotoğraf Tesseract.js)
// ========================================
const TESSERACT_CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
let tesseractPromise = null;

function loadTesseractEngine() {
    if (typeof window !== 'undefined' && window.TestoOcrEngine) {
        return Promise.resolve(window.TestoOcrEngine);
    }
    if (typeof window !== 'undefined' && window.Tesseract) {
        return Promise.resolve(window.Tesseract);
    }
    if (tesseractPromise) return tesseractPromise;

    tesseractPromise = new Promise((resolve, reject) => {
        if (typeof document === 'undefined' || !document.head) {
            reject(new Error('OCR motoru için tarayıcı ortamı bulunamadı.'));
            return;
        }
        const script = document.createElement('script');
        script.src = TESSERACT_CDN_URL;
        script.async = true;
        script.onload = () => {
            if (window.Tesseract) resolve(window.Tesseract);
            else reject(new Error('Tesseract.js yüklendi ancak başlatılamadı.'));
        };
        script.onerror = () => {
            tesseractPromise = null;
            reject(new Error('OCR kütüphanesi yüklenemedi.'));
        };
        document.head.appendChild(script);
    });

    return tesseractPromise;
}

// Görüntüyü OCR öncesi gri tonlama + kontrast germe ile keskinleştirir (tarayıcı içinde)
async function preprocessImageForOcr(file) {
    if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
        return file;
    }
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const maxDim = 2200;
                let w = img.naturalWidth || img.width || 1000;
                let h = img.naturalHeight || img.height || 1000;
                if (w > maxDim || h > maxDim) {
                    const scale = maxDim / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext && canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                const imgData = ctx.getImageData(0, 0, w, h);
                const d = imgData.data;
                for (let i = 0; i < d.length; i += 4) {
                    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                    const stretched = lum < 165 ? Math.max(0, (lum - 35) * 0.75) : Math.min(255, 195 + (lum - 165) * 0.65);
                    d[i] = d[i + 1] = d[i + 2] = stretched;
                }
                ctx.putImageData(imgData, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas);
            } catch (_) {
                URL.revokeObjectURL(url);
                resolve(file);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        img.src = url;
    });
}

async function runOcrOnFile(file, onProgress) {
    if (file && typeof file.__ocrText === 'string') {
        if (onProgress) onProgress(100);
        return file.__ocrText;
    }
    if (typeof window !== 'undefined' && window.TestoOcrEngine && typeof window.TestoOcrEngine.recognize === 'function') {
        const res = await window.TestoOcrEngine.recognize(file, onProgress);
        return typeof res === 'string' ? res : (res?.data?.text || res?.text || '');
    }

    const engine = await loadTesseractEngine();
    const target = /^image\//i.test(file?.type || '') ? await preprocessImageForOcr(file) : file;
    const logger = info => {
        if (info && typeof info.progress === 'number' && onProgress) {
            onProgress(Math.round(info.progress * 100));
        }
    };

    try {
        const result = await engine.recognize(target, 'tur+eng', { logger });
        return result?.data?.text || result?.text || '';
    } catch (_) {
        const fallback = await engine.recognize(target, 'eng', { logger });
        return fallback?.data?.text || fallback?.text || '';
    }
}

async function handleReportFile(inputEl) {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;

    const status = document.getElementById('uploadStatus');
    const setStatus = (html, tone) => {
        if (!status) return;
        status.className = 'upload-status ' + (tone || '');
        status.innerHTML = html;
    };

    setStatus(`${IC('i-clock')} ${file.name} okunuyor…`, 'busy');

    try {
        const isPdf = /\.pdf$/i.test(file.name || '') || file.type === 'application/pdf';
        const isImage = /^image\//i.test(file.type || '') || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file.name || '');

        if (isPdf) {
            let text = await extractPdfText(file);
            const quickCheck = text ? V().parseLabText(text) : { matched: [] };

            // Dijital metin katmanı yoksa veya taranmış görüntü PDF'iyse OCR motorunu devreye sok
            if (!text || text.replace(/\s/g, '').length < 20 || !quickCheck.matched.length) {
                try {
                    setStatus(`${IC('i-clock')} ${file.name} üzerinde OCR taraması başlatılıyor…`, 'busy');
                    const ocrText = await runOcrOnFile(file, pct => {
                        setStatus(`${IC('i-clock')} OCR tahlil taraması: <b>%${pct}</b> (${file.name})`, 'busy');
                    });
                    if (ocrText && ocrText.replace(/\s/g, '').length >= 10) {
                        text = (text ? text + '\n' : '') + ocrText;
                    }
                } catch (_) { /* OCR erişilemezse mevcut metinle devam et */ }
            }

            if (!text || text.replace(/\s/g, '').length < 10) {
                setStatus(`${IC('i-warning')} PDF taranmış görüntü olabilir; metin çıkarılamadı. Tahlil metnini yapıştırabilir ya da elle girebilirsiniz.`, 'warn');
                togglePasteBox(true);
                toggleManualEntry(true);
                return;
            }
            applyParsedReport(text, file.name);
        } else if (isImage) {
            setStatus(`${IC('i-clock')} OCR motoru fotoğrafı tarıyor: <b>%0</b> (${file.name})`, 'busy');
            const ocrText = await runOcrOnFile(file, pct => {
                setStatus(`${IC('i-clock')} OCR motoru fotoğrafı tarıyor: <b>%${pct}</b> (${file.name})`, 'busy');
            });
            if (!ocrText || ocrText.replace(/\s/g, '').length < 8) {
                setStatus(`${IC('i-warning')} Fotoğraftan metin okunamadı. Tahlil metnini yapıştırabilir veya değerleri elle girebilirsiniz.`, 'warn');
                togglePasteBox(true);
                toggleManualEntry(true);
                return;
            }
            applyParsedReport(ocrText, file.name);
        } else {
            const text = await file.text();
            applyParsedReport(text, file.name);
        }
    } catch (error) {
        console.warn(error);
        setStatus(`${IC('i-warning')} Dosya okunamadı. Tahlil metnini yapıştırabilir ya da elle girebilirsiniz.`, 'warn');
        togglePasteBox(true);
        toggleManualEntry(true);
    }
}

function parsePastedText() {
    const text = document.getElementById('pasteText')?.value || '';
    if (text.trim().length < 10) {
        showToast(IC('i-warning') + ' Önce tahlil metnini yapıştırın.', 'red');
        return;
    }
    applyParsedReport(text, 'yapıştırılan metin');
}

function applyParsedReport(text, sourceName) {
    const parsed = V().parseLabText(text);
    const status = document.getElementById('uploadStatus');
    const found = parsed.matched.length;

    if (!found) {
        if (status) {
            status.className = 'upload-status warn';
            status.innerHTML = `${IC('i-warning')} ${sourceName} içinde tanıyabildiğimiz bir değer bulamadık. Aşağıdan elle girebilirsiniz.`;
        }
        toggleManualEntry(true);
        return;
    }

    Object.keys(parsed.values).forEach(id => {
        const input = document.getElementById(id);
        const select = document.getElementById('unit-' + id);
        if (!input) return;
        if (select && parsed.units[id]) {
            select.value = parsed.units[id];
            select.dataset.previous = parsed.units[id];
        }
        const marker = V().MARKER_BY_ID[id];
        const decimals = V().getUnit(marker, parsed.units[id] || marker.unit).decimals;
        input.value = String(V().round(parsed.values[id], decimals)).replace('.', ',');
        refreshFieldMeta(id);
        validateLabField(id);
        input.closest('.lab-row')?.classList.add('autofilled');
    });

    state.lastSource = 'upload';
    toggleManualEntry(true);

    if (status) {
        status.className = 'upload-status ok';
        status.innerHTML = `${IC('i-check')} ${sourceName}: <b>${found} değer</b> okundu ve forma yazıldı. Lütfen gözden geçirip onaylayın.`;
    }
    showToast(`${IC('i-check')} ${found} değer otomatik dolduruldu`, 'green');
    setProgress(90, 'Analizin %90 tamamlandı — değerleri onaylayın');
}

// Tarayıcı içi basit PDF metin çıkarıcı (sıkıştırılmış akışları DecompressionStream ile açar)
async function extractPdfText(file) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const latin1 = new TextDecoder('latin1').decode(buffer);
    const chunks = [];
    const marker = /stream\r?\n?/g;
    let match;

    while ((match = marker.exec(latin1)) !== null) {
        const start = match.index + match[0].length;
        const end = latin1.indexOf('endstream', start);
        if (end === -1) break;
        const slice = buffer.subarray(start, end);
        let decoded = await inflateMaybe(slice);
        if (decoded) chunks.push(decoded);
        marker.lastIndex = end;
    }

    return chunks.map(extractTextOperators).join('\n');
}

async function inflateMaybe(bytes) {
    const asText = new TextDecoder('latin1').decode(bytes);
    if (/\bTj\b|\bTJ\b/.test(asText)) return asText;
    if (typeof DecompressionStream === 'undefined') return null;

    for (const format of ['deflate', 'deflate-raw', 'gzip']) {
        try {
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
            const out = await new Response(stream).arrayBuffer();
            const text = new TextDecoder('latin1').decode(out);
            if (/\bTj\b|\bTJ\b/.test(text)) return text;
        } catch (_) { /* sonraki formatı dene */ }
    }
    return null;
}

function extractTextOperators(content) {
    const lines = [];
    let current = '';
    const token = /\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>|\bT[dDmJj\*]\b|\bET\b/g;
    let m;

    while ((m = token.exec(content)) !== null) {
        const piece = m[0];
        if (piece.startsWith('(')) {
            current += piece.slice(1, -1)
                .replace(/\\([nrt])/g, ' ')
                .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
                .replace(/\\(.)/g, '$1');
        } else if (piece.startsWith('<')) {
            const hex = piece.slice(1, -1).replace(/\s/g, '');
            for (let i = 0; i + 3 < hex.length + 1; i += 4) {
                const code = parseInt(hex.substr(i, 4), 16);
                if (code) current += String.fromCharCode(code);
            }
        } else if (piece === 'Td' || piece === 'TD' || piece === 'T*' || piece === 'ET' || piece === 'Tm') {
            if (current.trim()) lines.push(current.trim());
            current = '';
        }
    }
    if (current.trim()) lines.push(current.trim());
    return lines.join('\n');
}

// ========================================
// KAN TESTİ ANALİZİ
// ========================================
function analyzeBlood() {
    const markers = V().MARKERS;
    const values = {};
    const units = {};
    markers.forEach(m => {
        const input = document.getElementById(m.id);
        values[m.id] = input ? input.value : '';
        units[m.id] = currentUnit(m.id);
    });

    const result = V().validateBloodPanel(values, units);

    markers.forEach(m => {
        if (result.errors[m.id]) {
            setFieldError(m.id, result.errors[m.id]);
        } else {
            clearFieldError(m.id);
            if (result.warnings[m.id]) setFieldWarning(m.id, result.warnings[m.id]);
            else clearFieldWarning(m.id);
        }
    });

    if (!result.ok) {
        toggleManualEntry(true);
        showToast(IC('i-warning') + ' ' + result.message, 'red');
        document.getElementById(result.firstErrorId)?.focus();
        return;
    }

    if (!state.consent) {
        const note = document.getElementById('consentError');
        if (note) note.classList.add('visible');
        document.getElementById('consentCheck')?.focus();
        showToast(IC('i-lock') + ' Devam etmek için sağlık verisi açık rızası gerekiyor.', 'red');
        return;
    }

    const warned = Object.keys(result.warnings);
    if (warned.length) {
        showToast(`${IC('i-warning')} ${warned.length} değer alışılmadık — rapora hekim notu eklendi.`, 'gold');
    }

    setProgress(100, 'Analiz tamamlandı');
    renderBloodReport(result);
}

function renderBloodReport(result) {
    const panel = document.getElementById('bloodResult');
    const score = V().computeOverallScore(result.values);
    const markers = V().MARKERS;

    const rows = markers.filter(m => result.values[m.key] !== undefined).map(m => {
        const value = result.values[m.key];
        const unit = currentUnit(m.id);
        const decimals = V().getUnit(m, unit).decimals;
        const shown = V().fromCanonical(m, value, unit);
        const status = V().classify(m, value);
        return `
            <tr style="--status:${status.color}">
                <th scope="row">${m.short}</th>
                <td class="num">${fmt(shown, decimals)} <span class="unit">${unit}</span></td>
                <td class="num ref">${V().describeRange(m, unit, 'ref')}</td>
                <td><span class="badge ${status.badgeClass}">${T(status.label)}</span></td>
            </tr>`;
    }).join('');

    const flagged = markers
        .filter(m => result.values[m.key] !== undefined)
        .map(m => ({ marker: m, value: result.values[m.key], status: V().classify(m, result.values[m.key]) }))
        .filter(item => item.status.key !== 'normal')
        .sort((a, b) => a.status.rank - b.status.rank);

    const warningList = Object.keys(result.warnings).map(id => {
        const m = V().MARKER_BY_ID[id];
        return `<li><b>${m.short}:</b> ${result.warnings[id]}</li>`;
    }).join('');

    const estimateCompare = state.estimate ? `
        <div class="compare-line">
            ${IC('i-activity')} Semptom tahminimiz <b>${fmt(state.estimate.point)} ng/dL</b> idi;
            ölçülen değer <b>${result.values.totalT !== undefined ? fmt(result.values.totalT) + ' ng/dL' : '—'}</b>.
        </div>` : '';

    const supplements = buildSupplements(result.values);
    const microAlerts = V().evaluateMicronutrientAlerts ? V().evaluateMicronutrientAlerts(result.values) : [];

    panel.innerHTML = `
        <section class="score-card">
            <header class="score-head">
                <div>
                    <p class="eyebrow">${state.measurement === 'baseline' ? 'Başlangıç ölçümü' : 'Kontrol (takip) ölçümü'}</p>
                    <h3>Genel Değerlendirme</h3>
                </div>
                <button type="button" class="info-btn" aria-expanded="false" aria-controls="scoreTooltip"
                        onclick="toggleScoreTooltip(this)" aria-label="Skor nasıl hesaplanıyor?">${IC('i-info')}</button>
            </header>
            <div class="score-value">%${score.score}</div>
            <div class="score-track"><div class="score-fill" style="width:${score.score}%"></div></div>
            <p class="score-sub">Kapsama: girdiğiniz parametreler toplam ağırlığın %${score.coverage}’ini karşılıyor.</p>
            <div class="tooltip-panel" id="scoreTooltip" hidden>
                <p>${score.formula}</p>
                <ul class="score-breakdown">
                    ${score.breakdown.map(b => `
                        <li>
                            <span>${b.label} <small>(ağırlık %${b.weight})</small></span>
                            <span class="badge ${b.status.badgeClass}">${b.points} puan</span>
                        </li>`).join('')}
                </ul>
            </div>
            ${estimateCompare}
        </section>

        ${renderMicronutrientAlertCards(microAlerts)}

        <section class="card">
            <div class="card-header">
                <div class="card-icon icon-blue">${IC('i-doc')}</div>
                <div>
                    <div class="card-title">Değerleriniz ve referans aralıkları</div>
                    <div class="card-subtitle">${rows ? markers.filter(m => result.values[m.key] !== undefined).length : 0} parametre</div>
                </div>
            </div>
            <div class="table-wrap">
                <table class="lab-table">
                    <thead>
                        <tr><th scope="col">Parametre</th><th scope="col">Sonucunuz</th><th scope="col">Lab normal aralığı</th><th scope="col">Durum</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </section>

        ${flagged.length ? `
        <div class="section-title">
            <h3>Öne çıkan bulgular</h3>
            <p>${flagged.length} parametre aralık dışında · kritik olan üstte</p>
        </div>
        ${flagged.map(item => {
            const unit = currentUnit(item.marker.id);
            const decimals = V().getUnit(item.marker, unit).decimals;
            const isLowVitDOrZinc = (item.marker.key === 'vitD' && item.value < 30) || (item.marker.key === 'zinc' && item.value < 70);
            const dynamicExplain = isLowVitDOrZinc
                ? `<b>${V().SYSTEM_MICRONUTRIENT_WARNING}.</b> ${T(item.marker.explain)}`
                : T(item.marker.explain);
            return `
            <article class="lab-card" style="--status:${item.status.color}">
                <header class="lab-card-head">
                    <div>
                        <h4 class="lab-card-title">${T(item.marker.label)}</h4>
                        <p class="lab-card-sub">${state.measurement === 'baseline' ? 'Başlangıç ölçümü' : 'Kontrol ölçümü'}</p>
                    </div>
                    <span class="badge ${item.status.badgeClass}">${T(item.status.label)}</span>
                </header>
                <div class="lab-card-value">
                    <strong>${fmt(V().fromCanonical(item.marker, item.value, unit), decimals)}</strong>
                    <span class="unit">${unit}</span>
                </div>
                <p class="lab-card-ref">Laboratuvar normal aralığı: <b>${V().describeRange(item.marker, unit, 'ref')}</b></p>
                <p class="lab-card-explain">${dynamicExplain}</p>
            </article>`;
        }).join('')}` : ''}

        ${warningList ? `
        <section class="card warn-card">
            <div class="card-header">
                <div class="card-icon icon-gold">${IC('i-warning')}</div>
                <div>
                    <div class="card-title">Alışılmadık değerler</div>
                    <div class="card-subtitle">Reddetmedik — teyit edin</div>
                </div>
            </div>
            <ul class="plain-list">${warningList}</ul>
            <p class="muted">Bu değerler doğruysa sonucu bir endokrinoloji veya üroloji hekimiyle paylaşmanızı öneririz.</p>
        </section>` : ''}

        ${renderSupplementCard(supplements, 'Kişisel takviye planı', `${supplements.length} öneri · doz ve sıra önceliklendirildi`)}

        <section class="card">
            <div class="card-header">
                <div class="card-icon icon-blue">${IC('i-calendar')}</div>
                <div>
                    <div class="card-title">Kontrol takvimi</div>
                    <div class="card-subtitle">Ne zaman tekrar ölçmeli</div>
                </div>
            </div>
            <ul class="plain-list">
                <li>D vitamini ve ferritin: <b>8–12 hafta</b> sonra kontrol.</li>
                <li>Total / serbest testosteron: <b>12 hafta</b> sonra, yine sabah 07:00–10:00 arasında.</li>
                <li>Kontrol ölçümünü girerken yukarıdan <b>“Kontrol (takip) ölçümü”</b> seçeneğini işaretleyin.</li>
            </ul>
            <p class="muted">Takviyelerin etkisine dair sayısal iyileşme oranı paylaşmıyoruz; kişiden kişiye değişir ve yayımlanmış bir ortalamaya dayanmayan yüzdeler yanıltıcıdır.</p>
        </section>

        <section class="card danger-card">
            <div class="card-header">
                <div class="card-icon icon-red">${IC('i-warning')}</div>
                <div>
                    <div class="card-title">Önemli uyarılar</div>
                    <div class="card-subtitle">Lütfen dikkatle okuyun</div>
                </div>
            </div>
            <ul class="plain-list">
                <li>Bu rapor bilgilendirme amaçlıdır; teşhis ya da tıbbi reçete yerine geçmez.</li>
                <li>Takviyeye başlamadan önce hekiminize danışın; mevcut ilaçlarınızla etkileşim olabilir.</li>
                <li>Tüm takviyeleri aynı anda başlatmayın — haftada 1–2 yeni ürün ekleyin.</li>
            </ul>
        </section>

        <button class="btn-ghost" onclick="window.scrollTo({top:0,behavior:'smooth'})" style="margin-top:14px">
            ${IC('i-arrow-up')} &nbsp;Başa dön
        </button>
    `;

    panel.classList.add('show');
    setTimeout(() => safeScroll(panel), 180);
    showToast(IC('i-check') + ' Rapor hazır.', 'green');
}

function toggleScoreTooltip(button) {
    const panel = document.getElementById('scoreTooltip');
    if (!panel) return;
    const open = panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !open);
    button.setAttribute('aria-expanded', String(open));
}

function renderMicronutrientAlertCards(alerts) {
    if (!Array.isArray(alerts) || !alerts.length) return '';
    return `
        <div class="section-title" id="micronutrientAlertSection">
            <h3>Kişiselleştirilmiş Mikro Besin Uyarıları</h3>
            <p>${alerts.length} kritik kofaktör analizi · dinamik beslenme protokolü</p>
        </div>
        ${alerts.map(alert => `
        <article class="card micro-alert-card" data-alert-id="${alert.id}" style="--status:${alert.status.color}">
            <div class="card-header">
                <div class="card-icon ${alert.status.key === 'critical' ? 'icon-red' : 'icon-gold'}">${IC('i-warning')}</div>
                <div style="flex:1">
                    <div class="card-title">${alert.title}</div>
                    <div class="card-subtitle">${alert.measuredText}</div>
                </div>
                <span class="badge ${alert.status.badgeClass}">${T(alert.status.label)}</span>
            </div>
            <p class="micro-alert-msg">${alert.message}</p>
            <ul class="plain-list micro-alert-list">
                ${(alert.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </article>`).join('')}
    `;
}

// ========================================
// TAKVİYE PLANI
// ========================================
const PRIORITY = {
    critical: { label: 'Kritik', badgeClass: 'badge-critical', rank: 0 },
    high: { label: 'Öncelikli', badgeClass: 'badge-low', rank: 1 },
    support: { label: 'Destekleyici', badgeClass: 'badge-borderline', rank: 2 },
    base: { label: 'Temel', badgeClass: 'badge-normal', rank: 3 }
};

// Değerlere göre takviye önerileri. Plan doğrudan gösterilir; gizlenen adım yoktur.
function buildSupplements(values) {
    const list = [];
    const v = values || {};
    const sysWarn = V() && V().SYSTEM_MICRONUTRIENT_WARNING
        ? V().SYSTEM_MICRONUTRIENT_WARNING
        : 'Sistem Analizi Uyarısı: Çinko/D Vitamini eksikliğiniz LH sinyalinizi ve testosteron sentezinizi doğrudan zayıflatıyor, acilen şu mikro besinleri holding standartlarında beslenmenize ekleyin';

    if (v.vitD !== undefined) {
        if (v.vitD < 20) list.push(sup('D3 Vitamini + K2', 'D vitamininiz ' + fmt(v.vitD, 1) + ' ng/mL — ciddi eksiklik (normal 30–100). ' + sysWarn + '.', '5000 IU D3 + 200 mcg K2 / gün', 'critical'));
        else if (v.vitD < 30) list.push(sup('D3 Vitamini + K2', 'D vitamininiz ' + fmt(v.vitD, 1) + ' ng/mL — yetersiz (normal 30–100). ' + sysWarn + '.', '3000 IU D3 + 100 mcg K2 / gün', 'high'));
    } else {
        list.push(sup('D3 Vitamini + K2', 'Değer girilmedi; Türkiye’de erişkin erkeklerin büyük kısmında yetersizlik bildiriliyor.', '2000 IU D3 + 100 mcg K2 / gün', 'high'));
    }

    if (v.ferritin !== undefined && v.ferritin < 30) {
        list.push(sup('Demir (hekim kontrolünde)', 'Ferritin ' + fmt(v.ferritin) + ' ng/mL — depo demiri düşük.', 'Dozu hekiminiz belirlemeli', 'critical'));
    }
    if (v.b12 !== undefined && v.b12 < 300) {
        list.push(sup('B12 (Metilkobalamin)', 'B12 ' + fmt(v.b12) + ' pg/mL — düşük.', v.b12 < 200 ? '2000 mcg / gün' : '1000 mcg / gün', v.b12 < 200 ? 'critical' : 'high'));
    }
    if (v.zinc !== undefined && v.zinc < 70) {
        list.push(sup('Çinko Pikolinat', 'Çinko ' + fmt(v.zinc) + ' µg/dL — düşük. ' + sysWarn + '.', v.zinc < 60 ? '30 mg / gün' : '15 mg / gün', v.zinc < 60 ? 'critical' : 'high'));
    } else if (v.zinc === undefined) {
        list.push(sup('Çinko Pikolinat', 'Testosteron sentezinde doğrudan rol alır.', '15 mg / gün (akşam yemeğiyle)', 'support'));
    }
    if (v.mg !== undefined && v.mg < 2.0) {
        list.push(sup('Magnezyum Bisglisinat', 'Magnezyum ' + fmt(v.mg, 2) + ' mg/dL — düşük.', v.mg < 1.7 ? '400 mg / gece' : '200 mg / gece', 'high'));
    } else if (v.mg === undefined) {
        list.push(sup('Magnezyum Bisglisinat', 'SHBG bağlanmasını azaltarak serbest testosteronu destekler.', '200 mg / gece', 'support'));
    }
    if (v.cortisol !== undefined && v.cortisol > 20) {
        list.push(sup('Ashwagandha KSM-66', 'Kortizol ' + fmt(v.cortisol, 1) + ' µg/dL — üst sınırın üzerinde.', '600 mg / gün (2 × 300 mg)', 'high'));
    }
    if (v.estradiol !== undefined && v.estradiol > 62) {
        list.push(sup('Kilo ve alkol yönetimi', 'Estradiol ' + fmt(v.estradiol, 1) + ' pg/mL — yüksek; aromataz aktivitesi artmış olabilir.', 'Aromataz inhibitörü yalnızca hekim kararıyla', 'high'));
    }

    list.push(sup('Omega-3 (EPA/DHA)', 'Temel destek: inflamasyon ve hormonal denge.', '2000–3000 mg / gün', 'base'));

    return list.sort((a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank);
}

function sup(name, desc, dose, priority) {
    return { name, desc, dose, priority };
}

function renderSupplementCard(supplements, title, subtitle) {
    return `
    <section class="card">
        <div class="card-header">
            <div class="card-icon icon-gold">${IC('i-star')}</div>
            <div>
                <div class="card-title">${title}</div>
                <div class="card-subtitle">${subtitle}</div>
            </div>
        </div>
        ${supplements.map(item => {
            const prio = PRIORITY[item.priority];
            return `
            <div class="result-item" style="--status:${prio.badgeClass === 'badge-critical' ? 'var(--red)' : prio.badgeClass === 'badge-low' ? 'var(--gold)' : prio.badgeClass === 'badge-borderline' ? 'var(--blue)' : 'var(--green)'}">
                <div class="result-body">
                    <div class="result-name">${item.name}<span class="badge ${prio.badgeClass}">${prio.label}</span></div>
                    <div class="result-desc">${item.desc}</div>
                    <div class="result-dose">${item.dose}</div>
                </div>
            </div>`;
        }).join('')}
    </section>`;
}

// ========================================
// SPONSOR ALANLARI (sol / sağ)
// ========================================
// Tüm sponsor içeriği tek yerden yönetilir. Her kayıt:
//   { badge, title, text, cta, href }
// - Sol liste  : masaüstü/TV'de içeriğin sol sütunu, mobilde içerikten önceki şerit
// - Sağ liste  : masaüstü/TV'de içeriğin sağ sütunu, mobilde içerikten sonraki şerit
// Farklı bir kaynaktan (ör. API) beslemek için window.TESTOTAVAN_SPONSORS
// değişkenine aynı biçimde bir nesne atamak yeterlidir.
const SPONSORS = {
    left: [
        {
            badge: 'Sponsor',
            title: 'Sponsor alanı',
            text: 'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.',
            cta: 'Sponsor ol',
            href: '#'
        },
        {
            badge: 'Sponsor',
            title: 'Laboratuvar iş birliği',
            text: 'Hormon paneli kampanyaları için ayrılmış alan.',
            cta: 'İletişime geç',
            href: '#'
        }
    ],
    right: [
        {
            badge: 'Sponsor',
            title: 'Sponsor alanı',
            text: 'Takviye ve erkek sağlığı markaları için ayrılmış alan.',
            cta: 'Sponsor ol',
            href: '#'
        },
        {
            badge: 'Sponsor',
            title: 'Sponsorlu içerik',
            text: 'Blog yazınız dört dilde bu alanda listelenir.',
            cta: 'Detaylar',
            href: '#'
        }
    ]
};

function sponsorCard(item) {
    const href = typeof item.href === 'string' && item.href ? item.href : '#';
    const external = /^https?:\/\//i.test(href);
    const rel = external ? ' rel="noopener nofollow sponsored"' : '';
    const target = external ? ' target="_blank"' : '';
    return `
        <article class="sponsor-card">
            <span class="sponsor-badge">${T(item.badge || 'Sponsor')}</span>
            <h3 class="sponsor-title">${T(item.title || '')}</h3>
            <p class="sponsor-text">${T(item.text || '')}</p>
            <a class="sponsor-cta" href="${href}"${target}${rel}>${T(item.cta || 'İncele')} ${IC('i-arrow-right')}</a>
        </article>`;
}

function renderSponsors() {
    const data = (window.TESTOTAVAN_SPONSORS && typeof window.TESTOTAVAN_SPONSORS === 'object')
        ? window.TESTOTAVAN_SPONSORS
        : SPONSORS;

    document.querySelectorAll('[data-sponsor-rail]').forEach(rail => {
        const list = rail.querySelector('[data-sponsor-list]');
        if (!list) return;
        const items = Array.isArray(data[rail.dataset.sponsorRail]) ? data[rail.dataset.sponsorRail] : [];
        list.innerHTML = items.map(sponsorCard).join('');
        rail.toggleAttribute('hidden', items.length === 0);
    });
}

document.addEventListener('DOMContentLoaded', renderSponsors);

// ========================================
// DAMAT ATOMU BESİN DEĞERİ HESAPLAYICI WIDGET
// ========================================
function updateDamatAtomuWidget() {
    if (!V() || typeof V().computeDamatAtomuNutrition !== 'function') return null;

    const grams = {};
    V().DAMAT_ATOMU_INGREDIENTS.forEach(ing => {
        const slider = document.getElementById(ing.id);
        const val = slider ? Number(slider.value) : ing.defaultGrams;
        grams[ing.key] = isFinite(val) ? val : ing.defaultGrams;

        const badge = document.getElementById('atomVal-' + ing.key);
        if (badge) badge.textContent = `${grams[ing.key]} g`;
    });

    const stats = V().computeDamatAtomuNutrition(grams);

    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('atomTotalKcal', `${fmt(stats.kcal, 0)} kcal`);
    setElText('atomTotalMg', `${fmt(stats.mg, 1)} mg`);
    setElText('atomTotalZinc', `${fmt(stats.zinc, 2)} mg`);
    setElText('atomTotalProtein', `${fmt(stats.protein, 1)} g`);
    setElText('atomTotalGrams', `${fmt(stats.totalGrams, 0)} g`);
    setElText('atomMgPct', `%${stats.mgRdaPct} Günlük Hedef`);
    setElText('atomZincPct', `%${stats.zincRdaPct} Günlük Hedef`);

    const mgBar = document.getElementById('atomMgBar');
    if (mgBar) mgBar.style.width = `${Math.min(100, stats.mgRdaPct)}%`;

    const zincBar = document.getElementById('atomZincBar');
    if (zincBar) zincBar.style.width = `${Math.min(100, stats.zincRdaPct)}%`;

    const logBox = document.getElementById('atomLiveLog');
    if (logBox) {
        const activeRows = stats.breakdown
            .filter(item => item.grams > 0)
            .map(item => `<li><b>${item.label} (${item.grams}g):</b> ${item.kcal} kcal · Mg ${fmt(item.mg, 1)} mg · Zn ${fmt(item.zinc, 2)} mg</li>`)
            .join('');
        logBox.innerHTML = `
            <div class="atom-log-head">${stats.logLine}</div>
            ${activeRows ? `<ul class="plain-list atom-log-list">${activeRows}</ul>` : '<p class="muted">Karışım için kaydırgaçları sağa çekin.</p>'}
        `;
    }

    return stats;
}

function applyDamatAtomuPreset(presetKey) {
    if (!V() || !V().DAMAT_ATOMU_PRESETS) return null;
    const preset = V().DAMAT_ATOMU_PRESETS[presetKey] || V().DAMAT_ATOMU_PRESETS.standard;
    V().DAMAT_ATOMU_INGREDIENTS.forEach(ing => {
        const slider = document.getElementById(ing.id);
        if (slider && preset[ing.key] !== undefined) {
            slider.value = String(preset[ing.key]);
        }
    });
    return updateDamatAtomuWidget();
}

// ========================================
// BAŞLANGIÇ
// ========================================
function initAnalysisScreens() {
    if (!V()) return;

    renderSteppers();
    setProgress(10, 'Analize başlayın');
    renderSymptomGrid();
    onSymptomChange();
    setMeasurementType('baseline');

    V().PHYSICAL_FIELDS.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        input.addEventListener('input', () => clearFieldError(field.id));
        input.addEventListener('blur', () => {
            const check = V().validateField(input.value, field);
            if (!check.ok) setFieldError(field.id, check.error);
            else clearFieldError(field.id);
        });
    });

    V().MARKERS.forEach(marker => {
        const input = document.getElementById(marker.id);
        const select = document.getElementById('unit-' + marker.id);
        if (select) select.dataset.previous = select.value;
        refreshFieldMeta(marker.id);
        if (!input) return;
        input.addEventListener('input', () => clearFieldError(marker.id));
        input.addEventListener('blur', () => validateLabField(marker.id));
    });
}

document.addEventListener('DOMContentLoaded', initAnalysisScreens);

// ========================================
// PİN DERİN BAĞLANTISI
// ========================================
// Pinterest pinlerinin hedefi /?icerik=<id> biçimindedir. Bu adresle gelen ziyaretçi
// Blog sekmesine yönlendirilir ve ilgili yazı, veritabanı yanıtı gelir gelmez açılır.
function openDeepLinkedContent(){
    const id = new URLSearchParams(window.location.search).get('icerik');
    if (!id) return;

    loadOptionalFeatures().then(() => {
        changePage('blogPage');
        window.ensureBlogData?.();
        let tries = 0;
        const openWhenReady = () => {
            if (window.openSharedContent?.(id) || tries++ >= 20) return;
            setTimeout(openWhenReady, 250);
        };
        openWhenReady();
    });
}

document.addEventListener('DOMContentLoaded', openDeepLinkedContent);

// Dil değiştiğinde dinamik basılan adımlar, notlar ve laboratuvar yardımcıları da
// yeni sözlükle tekrar üretilir. Böylece yalnızca sayfadaki başlıklar değil alt
// açıklamalar da seçilen dile geçer.
window.addEventListener('testo-language-change', () => {
    if (!V()) return;
    renderSteppers();
    onSymptomChange();
    setMeasurementType(state.measurement);
    V().MARKERS.forEach(marker => refreshFieldMeta(marker.id));
    setProgress(state.progress, state.progressNote);
    renderSponsors();
});

// ========================================
// OPSİYONEL MODÜLLER (blog + çeviri)
// ========================================
// Derleme sırasında (tools/build.mjs) hash'li dosya adıyla değiştirilir.
const OPTIONAL_FEATURES_URL = 'js/content.js';
let optionalFeaturesPromise;
function loadOptionalFeatures(){
    if (window.__testoOptionalReady) return Promise.resolve();
    if (optionalFeaturesPromise) return optionalFeaturesPromise;

    optionalFeaturesPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = OPTIONAL_FEATURES_URL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('İsteğe bağlı içerik modülü yüklenemedi.'));
        document.head.appendChild(script);
    }).catch(error => {
        optionalFeaturesPromise = null;
        console.warn(error.message);
        const list = document.getElementById('contentList');
        if (list) list.innerHTML = '<div class="empty-state">İçerikler şu anda yüklenemedi. Lütfen tekrar deneyin.</div>';
    });

    return optionalFeaturesPromise;
}

function setLanguage(language){
    loadOptionalFeatures().then(() => window.setLanguage(language));
}

if (localStorage.getItem('testotavan_language') && localStorage.getItem('testotavan_language') !== 'tr') {
    loadOptionalFeatures();
}

// ========================================
// ÇEREZ ONAYI & TEKİL ZİYARET SAYACI
// ========================================
let statsConsentOverride;
const STATS_CONSENT_COOKIE = 'testotavan_cookie_consent';
const STATS_VISITOR_COOKIE = 'testotavan_visitor_v1';
const STATS_VISITOR_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function readStatsCookie(name) {
    try {
        const part = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(name + '='));
        return part ? part.slice(name.length + 1) : '';
    } catch { return ''; }
}
function writeStatsCookie(name, value, maxAge = 31536000) {
    try {
        document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    } catch { /* Depolama engelliyse kullanıcı yine siteyi kullanabilir. */ }
    return readStatsCookie(name) === value;
}
function openCookieSettings() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.hidden = false;
        document.getElementById('acceptCookies')?.focus();
    }
}
function setStatsConsent(accepted) {
    const saved = writeStatsCookie(STATS_CONSENT_COOKIE, accepted ? 'accepted' : 'rejected');
    statsConsentOverride = accepted && saved ? 'accepted' : 'rejected';
    if (!accepted) writeStatsCookie(STATS_VISITOR_COOKIE, '', 0);
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.hidden = true;
    const status = document.getElementById('cookieStatus');
    if (status) status.textContent = saved ? '' : 'Çerez tercihi kaydedilemedi. Tarayıcınız çerezleri engelliyor; ziyaretiniz kaydedilmeyecek.';
    return loadStats();
}
async function loadStats() {
    let method = 'GET';
    if ((statsConsentOverride ?? readStatsCookie(STATS_CONSENT_COOKIE)) === 'accepted') {
        let visitor = readStatsCookie(STATS_VISITOR_COOKIE);
        if (!STATS_VISITOR_PATTERN.test(visitor)) {
            try { visitor = crypto.randomUUID(); } catch { visitor = ''; }
            if (visitor) writeStatsCookie(STATS_VISITOR_COOKIE, visitor);
        }
        // Çerez saklanamıyorsa her açılışta yeni kimlikle sayacı artırma.
        if (visitor && readStatsCookie(STATS_VISITOR_COOKIE) === visitor) method = 'POST';
    }
    try {
        const response = await fetch('/api/stats', {
            method, credentials: 'same-origin', cache: 'no-store',
            ...(method === 'POST' ? { headers: { 'X-Testotavan-Stats': '1' } } : {})
        });
        if (!response.ok) throw new Error('İstatistik servisine ulaşılamadı.');
        const data = await response.json();
        if (!Number.isFinite(data.views) || data.views < 0) throw new Error('Geçersiz sayaç.');
        const counter = document.getElementById('viewCounter');
        if (counter) counter.textContent = `Toplam tekil ziyaret: ${data.views.toLocaleString('tr-TR')}`;
    } catch {
        const counter = document.getElementById('viewCounter');
        if (counter) counter.textContent = 'Ziyaret sayısı şu anda yüklenemiyor.';
    }
}
function initStatsConsent() {
    const consent = readStatsCookie(STATS_CONSENT_COOKIE);
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.hidden = consent === 'accepted' || consent === 'rejected';
    document.getElementById('acceptCookies')?.addEventListener('click', () => setStatsConsent(true));
    document.getElementById('rejectCookies')?.addEventListener('click', () => setStatsConsent(false));
    document.getElementById('cookieSettings')?.addEventListener('click', openCookieSettings);
    return loadStats();
}
document.addEventListener('DOMContentLoaded', initStatsConsent);
