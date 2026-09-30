// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================
// Tek renkli, platformdan bağımsız SVG ikon üretici (emoji yerine stabil şekil)
const IC = id => `<svg class="ic" aria-hidden="true"><use href="#${id}"></use></svg>`;



// ========================================
// FORM DOĞRULAMA YARDIMCILARI
// ========================================

// Alanın altındaki hata kutusunu (yoksa oluşturarak) döndürür
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
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', box.id);
    box.textContent = message;
    box.classList.add('visible');
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

function readFieldValues(fields) {
    const values = {};
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        values[field.id] = input ? input.value : '';
    });
    return values;
}

// Doğrulama sonucunu forma uygular; geçersizse analiz başlatılmaz
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

// Kullanıcı yazarken hatayı temizle
function initFieldValidationListeners() {
    if (!window.TestoValidation) return;
    const all = TestoValidation.PHYSICAL_FIELDS.concat(TestoValidation.BLOOD_FIELDS);
    all.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        input.addEventListener('input', () => clearFieldError(field.id));
        input.addEventListener('blur', () => {
            const check = TestoValidation.validateField(input.value, field);
            if (!check.ok) {
                setFieldError(field.id, check.error);
            } else {
                clearFieldError(field.id);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initFieldValidationListeners);

// Sayfa değiştirme
function changePage(pageId) {
    // Tüm sayfaları gizle
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Seçilen sayfayı göster
    document.getElementById(pageId).classList.add('active');

    // Navigasyon aktif durumunu güncelle
   const pageMap = {
    'homePage': 0,
    'physicalPage': 1,
    'bloodPage': 2,
    'blogPage': 3,
    'aboutPage': 4,
    'adminPage': -1
};

    document.querySelectorAll('.nav-item').forEach((item, index) => {
        const isCurrent = index === pageMap[pageId];
        item.classList.toggle('active', isCurrent);
        item.toggleAttribute('aria-current', isCurrent);
    });

    if (pageId === 'blogPage') {
        loadOptionalFeatures().then(() => {
            window.renderContent();
            window.ensureBlogData();
        });
    }
    if (pageId === 'adminPage') loadOptionalFeatures().then(() => window.renderAdmin?.());
    if (window.applyTranslations) requestAnimationFrame(window.applyTranslations);

    // Sayfayı en üste kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toast bildirimi göster
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
// TestosteronSEVİYE GÖSTERGESİ
// ========================================
function renderTestoGauge(testoValue) {
    const minVal = 200;
    const maxVal = 1000;
    const normalMin = 350;
    const normalMax = 800;

    let status, statusClass, color;
    let percentage = ((testoValue - minVal) / (maxVal - minVal)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    if (testoValue < normalMin) {
        status = 'DÜŞÜK';
        statusClass = 'status-low';
        color = '#FF5252';
    } else if (testoValue >= normalMin && testoValue <= normalMax) {
        status = 'NORMAL';
        statusClass = 'status-normal';
        color = '#00E676';
    } else {
        status = 'YÜKSEK';
        statusClass = 'status-high';
        color = '#F5A623';
    }

    return `
        <div class="testo-gauge">
            <div class="gauge-title">${IC('i-activity')}TestosteronSeviyeniz</div>
            <div class="gauge-bar">
                <div class="gauge-fill" style="width: ${percentage}%; background: ${color}"></div>
            </div>
            <div class="gauge-markers">
                <span>200</span>
                <span>350</span>
                <span>600</span>
                <span>800</span>
                <span>1000+</span>
            </div>
            <div class="gauge-value" style="color: ${color}">${testoValue}</div>
            <div class="gauge-status ${statusClass}">${status}</div>
        </div>
    `;
}

// ========================================
// FİZİKSEL ANALİZ
// ========================================
function analyzePhysical() {
    const fields = TestoValidation.PHYSICAL_FIELDS;
    const result = TestoValidation.validatePhysical(readFieldValues(fields));

    // 0, negatif veya boş değerlerde analiz başlatılmaz
    if (!applyValidation(fields, result)) return;

    const height = result.values.inputHeight;
    const weight = result.values.inputWeight;

    const bmi = weight / ((height / 100) ** 2);
    const supplements = [];

    // D Vitamini
    supplements.push({
        name: 'D3 Vitamini + K2',
        icon: 'i-sun',
        color: 'icon-gold',
        desc: 'Testosteronsentezinin temel yapı taşı.',
        dose: '2000 IU D3 + 100mcg K2 / gün',
        priority: 'Yüksek',
        badgeClass: 'badge-high'
    });

    // Çinko
    supplements.push({
        name: 'Çinko Pikolinat',
        icon: 'i-bolt',
        color: 'icon-blue',
        desc: 'Testosteronsentezi ve bağışıklık için temel mineral.',
        dose: '15mg / gün (akşam yemeğiyle)',
        priority: 'Yüksek',
        badgeClass: 'badge-high'
    });

    // Magnezyum
    supplements.push({
        name: 'Magnezyum Bisglisinat',
        icon: 'i-moon',
        color: 'icon-purple',
        desc: 'SHBG\'yi düşürerek serbest testosteronu artırır.',
        dose: '200mg (yatmadan önce)',
        priority: 'Orta',
        badgeClass: 'badge-medium'
    });

    // Omega-3
    supplements.push({
        name: 'Omega-3 (EPA/DHA)',
        icon: 'i-fish',
        color: 'icon-blue',
        desc: 'Anti-inflamatuar ve hormonal denge.',
        dose: '2000mg / gün',
        priority: 'Temel',
        badgeClass: 'badge-low'
    });

    renderResults('physicalResult', supplements, null, bmi);
    showToast(IC('i-check') + ' Fiziksel analiz tamamlandı!', 'gold');
}

// ========================================
// KAN TESTİ ANALİZİ
// ========================================
function analyzeBlood() {
    const fields = TestoValidation.BLOOD_FIELDS;
    const result = TestoValidation.validateBlood(readFieldValues(fields));

    // 0, negatif veya geçersiz değerlerde analiz başlatılmaz
    if (!applyValidation(fields, result)) return;

    const testo = result.values.inputTesto || 0;
    const cortisol = result.values.inputCortisol || 0;
    const vitD = result.values.inputVitD || 0;
    const b12 = result.values.inputB12 || 0;
    const zinc = result.values.inputZinc || 0;
    const mg = result.values.inputMg || 0;

    const supplements = [];

    // D Vitamini
    if (vitD > 0) {
        if (vitD < 20) {
            supplements.push({
                name: 'D3 Vitamini + K2',
                icon: 'i-sun',
                color: 'icon-gold',
                desc: `Değeriniz: ${vitD} ng/mL → Ciddi eksiklik.`,
                dose: '5000 IU D3 + 200mcg K2 / gün',
                priority: 'Kritik',
                badgeClass: 'badge-critical'
            });
        } else if (vitD < 30) {
            supplements.push({
                name: 'D3 Vitamini + K2',
                icon: 'i-sun',
                color: 'icon-gold',
                desc: `Değeriniz: ${vitD} ng/mL → Yetersiz.`,
                dose: '3000 IU D3 + 100mcg K2 / gün',
                priority: 'Yüksek',
                badgeClass: 'badge-high'
            });
        }
    }

    // B12
    if (b12 > 0 && b12 < 300) {
        supplements.push({
            name: 'B12 (Metilkobalamin)',
            icon: 'i-battery',
            color: 'icon-green',
            desc: `Değeriniz: ${b12} pg/mL → Düşük.`,
            dose: b12 < 200 ? '2000mcg / gün' : '1000mcg / gün',
            priority: b12 < 200 ? 'Kritik' : 'Yüksek',
            badgeClass: b12 < 200 ? 'badge-critical' : 'badge-high'
        });
    }

    // Çinko
    if (zinc > 0 && zinc < 70) {
        supplements.push({
            name: 'Çinko Pikolinat',
            icon: 'i-bolt',
            color: 'icon-blue',
            desc: `Değeriniz: ${zinc} µg/dL → Düşük.`,
            dose: zinc < 60 ? '30mg / gün' : '15mg / gün',
            priority: zinc < 60 ? 'Kritik' : 'Yüksek',
            badgeClass: zinc < 60 ? 'badge-critical' : 'badge-high'
        });
    }

    // Magnezyum
    if (mg > 0 && mg < 2.0) {
        supplements.push({
            name: 'Magnezyum Bisglisinat',
            icon: 'i-moon',
            color: 'icon-purple',
            desc: `Değeriniz: ${mg} mg/dL → Düşük.`,
            dose: mg < 1.7 ? '400mg / gece' : '200mg / gece',
            priority: mg < 1.7 ? 'Kritik' : 'Yüksek',
            badgeClass: mg < 1.7 ? 'badge-critical' : 'badge-high'
        });
    }

    // Kortizol
    if (cortisol > 0 && cortisol > 16) {
        supplements.push({
            name: 'Ashwagandha KSM-66',
            icon: 'i-leaf',
            color: 'icon-green',
            desc: `Kortizol: ${cortisol} µg/dL → ${cortisol > 20 ? 'Çok yüksek' : 'Normal üst sınır'}.`,
            dose: cortisol > 20 ? '600mg / gün (2×300mg)' : '300mg / gün',
            priority: cortisol > 20 ? 'Kritik' : 'Orta',
            badgeClass: cortisol > 20 ? 'badge-critical' : 'badge-medium'
        });
    }

    // Omega-3 (temel)
    supplements.push({
        name: 'Omega-3 (EPA/DHA)',
        icon: 'i-fish',
        color: 'icon-blue',
        desc: 'Temel takviye. Anti-inflamatuar ve hormonal denge.',
        dose: '2000-3000mg / gün',
        priority: 'Temel',
        badgeClass: 'badge-low'
    });

    renderResults('bloodResult', supplements, testo);
    showToast(IC('i-check') + ' Kan testi analizi tamamlandı!', 'green');
}

// ========================================
// SONUÇLARI GÖSTER
// ========================================
function renderResults(containerId, supplements, testoValue = null, bmi = null) {
    const panel = document.getElementById(containerId);

    let html = `<div style="margin-top: 20px"></div>`;

    // Testosterongöstergesi (sadece kan testi için)
    if (testoValue && testoValue > 0) {
        html += renderTestoGauge(testoValue);
    }

    // BMI göstergesi (sadece fiziksel analiz için)
    if (bmi) {
        let bmiStatus, bmiColor;
        if (bmi < 18.5) {
            bmiStatus = 'Zayıf';
            bmiColor = 'var(--red)';
        } else if (bmi < 25) {
            bmiStatus = 'Normal';
            bmiColor = 'var(--green)';
        } else {
            bmiStatus = 'Fazla Kilolu';
            bmiColor = 'var(--gold)';
        }

        html += `
            <div class="card" style="border-color: rgba(68,138,255,.2)">
                <div class="card-header">
                    <div class="card-icon icon-blue">
                        ${IC('i-grid')}
                    </div>
                    <div>
                        <div class="card-title">Vücut Kitle İndeksi</div>
                        <div class="card-subtitle">BMI: ${bmi.toFixed(1)}</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 12px 0">
                    <div style="font-size: 28px; font-weight: 900; color: ${bmiColor}">${bmi.toFixed(1)}</div>
                    <div style="font-size: 13px; color: ${bmiColor}; font-weight: 700; margin-top: 4px">${bmiStatus}</div>
                </div>
            </div>
        `;
    }

    // Takviye önerileri
    html += `
        <div class="card">
            <div class="card-header">
                <div class="card-icon icon-gold">
                    ${IC('i-star')}
                </div>
                <div>
                    <div class="card-title">Kişisel Takviye Reçeteniz</div>
                    <div class="card-subtitle">${supplements.length} takviye önerildi</div>
                </div>
            </div>

            ${supplements.map(sup => `
                <div class="result-item">
                    <div class="result-icon ${sup.color}">${IC(sup.icon)}</div>
                    <div>
                        <div class="result-name">
                            ${sup.name}
                            <span class="badge ${sup.badgeClass}">${sup.priority}</span>
                        </div>
                        <div class="result-desc">${sup.desc}</div>
                        <div class="result-dose">${IC('i-pill')} ${sup.dose}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Uyarılar
    html += `
        <div class="card" style="border-color: rgba(255,82,82,.15); background: rgba(255,82,82,.02)">
            <div class="card-header">
                <div class="card-icon icon-red">
                    ${IC('i-warning')}
                </div>
                <div>
                    <div class="card-title">Önemli Uyarılar</div>
                    <div class="card-subtitle">Lütfen dikkatle okuyun</div>
                </div>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.7">
                <p style="margin-bottom: 10px">${IC('i-warning')} Bu öneriler bilgilendirme amaçlıdır, tıbbi reçete yerine geçmez.</p>
                <p style="margin-bottom: 10px">${IC('i-warning')} Herhangi bir takviyeye başlamadan önce doktorunuza danışın.</p>
                <p>${IC('i-warning')} Tüm takviyeleri aynı anda başlatmayın — her hafta 1-2 yeni ürün ekleyin.</p>
            </div>
        </div>
    `;

    html += `
        <button class="btn-secondary" onclick="window.scrollTo({top:0,behavior:'smooth'})" style="margin-top: 16px">
            ${IC('i-arrow-up')} &nbsp;BAŞA DÖN
        </button>
    `;


    panel.innerHTML = html;
    panel.classList.add('show');

    setTimeout(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}



// Blog content, translations and their API requests are loaded only when a visitor needs them.
const OPTIONAL_FEATURES_URL = 'js/content.291df0a1.js';
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

// The language picker is present in the first paint; this lightweight bridge keeps it usable before
// the optional translation bundle has loaded.
function setLanguage(language){
    loadOptionalFeatures().then(() => window.setLanguage(language));
}

if (localStorage.getItem('testotavan_language') && localStorage.getItem('testotavan_language') !== 'tr') {
    loadOptionalFeatures();
}
