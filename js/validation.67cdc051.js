/*
 * TestoTavan - Laboratuvar çekirdeği ve girdi doğrulama
 * Hem tarayıcıda (window.TestoValidation) hem de Node testlerinde kullanılır.
 *
 * İçerik:
 *  - MARKERS       : laboratuvar normal aralığı + geçerli giriş aralığı + birim dönüşümleri
 *  - STATUS        : tüm ekranlarda ortak rozet dili (Kritik / Düşük / Sınırda / Normal / Yüksek)
 *  - SYMPTOMS      : semptom -> ilgili biyobelirteç eşlemesi ve açıklama cümlesi
 *  - estimate*     : semptomlardan nokta tahmin + güven aralığı
 *  - computeOverallScore : "Genel Değerlendirme" skorunun şeffaf hesabı (tooltip için)
 *  - parseLabText  : PDF/foto metninden laboratuvar değeri yakalama (OCR sonrası adım)
 */
(function () {
    'use strict';

    // ========================================================================
    // ORTAK ROZET DİLİ — tablo ve kartlar aynı renkleri kullanır
    // ========================================================================
    var STATUS = {
        critical: { key: 'critical', label: 'Kritik',  badgeClass: 'badge-critical', color: 'var(--red)',    rank: 0 },
        low:      { key: 'low',      label: 'Düşük',   badgeClass: 'badge-low',      color: 'var(--gold)',   rank: 1 },
        high:     { key: 'high',     label: 'Yüksek',  badgeClass: 'badge-high',     color: 'var(--purple)', rank: 2 },
        borderline:{ key: 'borderline', label: 'Sınırda', badgeClass: 'badge-borderline', color: 'var(--blue)', rank: 3 },
        normal:   { key: 'normal',   label: 'Normal',  badgeClass: 'badge-normal',   color: 'var(--green)',  rank: 4 },
        unknown:  { key: 'unknown',  label: 'Veri yok', badgeClass: 'badge-unknown', color: 'var(--text-secondary)', rank: 5 }
    };

    // ========================================================================
    // BİYOBELİRTEÇLER
    //  ref     : laboratuvar normal aralığı (erişkin erkek)
    //  accept  : geçerli giriş aralığı — bunun dışı reddedilir (fiziksel olarak imkânsız)
    //  usual   : alışılmış aralık — dışında kalan değer reddedilmez, uyarılır
    //  critical: klinik olarak acil/kritik eşikler
    // ========================================================================
    var MARKERS = [
        {
            id: 'inputTesto', key: 'totalT', label: 'Total Testosteron', short: 'Total T',
            unit: 'ng/dL', required: true, example: 480,
            units: [
                { code: 'ng/dL', factor: 1, decimals: 0 },
                { code: 'nmol/L', factor: 28.84, decimals: 2 }
            ],
            ref: [270, 1080], accept: [20, 4000], usual: [100, 1800],
            critical: { below: 200 },
            explain: 'Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.'
        },
        {
            id: 'inputFreeTesto', key: 'freeT', label: 'Serbest Testosteron', short: 'Serbest T',
            unit: 'pg/mL', required: false, example: 95,
            units: [
                { code: 'pg/mL', factor: 1, decimals: 1 },
                { code: 'ng/dL', factor: 10, decimals: 2 },
                { code: 'pmol/L', factor: 0.2885, decimals: 1 }
            ],
            ref: [47, 244], accept: [1, 1000], usual: [15, 500],
            critical: { below: 35 },
            explain: 'Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.'
        },
        {
            id: 'inputSHBG', key: 'shbg', label: 'SHBG', short: 'SHBG',
            unit: 'nmol/L', required: false, example: 32,
            units: [{ code: 'nmol/L', factor: 1, decimals: 1 }],
            ref: [18, 54], accept: [1, 250], usual: [5, 150],
            explain: 'SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.'
        },
        {
            id: 'inputLH', key: 'lh', label: 'LH', short: 'LH',
            unit: 'IU/L', required: false, example: 4.2,
            units: [{ code: 'IU/L', factor: 1, decimals: 1 }, { code: 'mIU/mL', factor: 1, decimals: 1 }],
            ref: [1.5, 9.3], accept: [0.05, 200], usual: [0.1, 60],
            explain: 'LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.'
        },
        {
            id: 'inputFSH', key: 'fsh', label: 'FSH', short: 'FSH',
            unit: 'IU/L', required: false, example: 5.1,
            units: [{ code: 'IU/L', factor: 1, decimals: 1 }, { code: 'mIU/mL', factor: 1, decimals: 1 }],
            ref: [1.4, 18.1], accept: [0.05, 200], usual: [0.1, 80],
            explain: 'FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.'
        },
        {
            id: 'inputE2', key: 'estradiol', label: 'Estradiol (E2)', short: 'E2',
            unit: 'pg/mL', required: false, example: 28,
            units: [
                { code: 'pg/mL', factor: 1, decimals: 1 },
                { code: 'pmol/L', factor: 0.2724, decimals: 1 }
            ],
            ref: [11, 62], accept: [1, 1000], usual: [3, 300],
            critical: { above: 120 },
            explain: 'Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.'
        },
        {
            id: 'inputCortisol', key: 'cortisol', label: 'Kortizol (sabah)', short: 'Kortizol',
            unit: 'µg/dL', required: false, example: 14,
            units: [
                { code: 'µg/dL', factor: 1, decimals: 1 },
                { code: 'nmol/L', factor: 0.03625, decimals: 1 }
            ],
            ref: [6, 23], accept: [0.5, 200], usual: [2, 60],
            critical: { above: 35 },
            explain: 'Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.'
        },
        {
            id: 'inputFerritin', key: 'ferritin', label: 'Ferritin', short: 'Ferritin',
            unit: 'ng/mL', required: false, example: 120,
            units: [{ code: 'ng/mL', factor: 1, decimals: 0 }, { code: 'µg/L', factor: 1, decimals: 0 }],
            ref: [24, 336], accept: [1, 5000], usual: [3, 1500],
            critical: { below: 15 },
            explain: 'Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.'
        },
        {
            id: 'inputVitD', key: 'vitD', label: 'D Vitamini (25-OH)', short: 'D Vit.',
            unit: 'ng/mL', required: false, example: 34,
            units: [
                { code: 'ng/mL', factor: 1, decimals: 1 },
                { code: 'nmol/L', factor: 0.4006, decimals: 1 }
            ],
            ref: [30, 100], accept: [1, 400], usual: [3, 150],
            critical: { below: 12 },
            explain: 'D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.'
        },
        {
            id: 'inputB12', key: 'b12', label: 'B12', short: 'B12',
            unit: 'pg/mL', required: false, example: 420,
            units: [
                { code: 'pg/mL', factor: 1, decimals: 0 },
                { code: 'pmol/L', factor: 1.355, decimals: 0 }
            ],
            ref: [200, 900], accept: [20, 5000], usual: [60, 2500],
            critical: { below: 150 },
            explain: 'Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.'
        },
        {
            id: 'inputZinc', key: 'zinc', label: 'Çinko', short: 'Çinko',
            unit: 'µg/dL', required: false, example: 92,
            units: [
                { code: 'µg/dL', factor: 1, decimals: 0 },
                { code: 'µmol/L', factor: 6.538, decimals: 1 }
            ],
            ref: [70, 120], accept: [5, 500], usual: [20, 250],
            explain: 'Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.'
        },
        {
            id: 'inputMg', key: 'mg', label: 'Magnezyum', short: 'Magnezyum',
            unit: 'mg/dL', required: false, example: 2.1,
            units: [
                { code: 'mg/dL', factor: 1, decimals: 2 },
                { code: 'mmol/L', factor: 2.431, decimals: 2 }
            ],
            ref: [1.7, 2.4], accept: [0.2, 10], usual: [0.8, 5],
            explain: 'Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.'
        }
    ];

    var MARKER_BY_ID = {};
    var MARKER_BY_KEY = {};
    MARKERS.forEach(function (m) { MARKER_BY_ID[m.id] = m; MARKER_BY_KEY[m.key] = m; });

    // ========================================================================
    // NUMARA AYRIŞTIRMA — virgül/nokta ve binlik ayıracı yönetimi
    // ========================================================================
    function isBlank(raw) {
        return raw === undefined || raw === null || String(raw).trim() === '';
    }

    function parseNumber(raw) {
        if (typeof raw === 'number') return isFinite(raw) ? raw : null;
        if (isBlank(raw)) return null;

        var text = String(raw).trim().replace(/\s/g, '').replace(/[<>=~]/g, '');
        if (!/^[-+]?[\d.,]+$/.test(text)) return null;

        var lastComma = text.lastIndexOf(',');
        var lastDot = text.lastIndexOf('.');

        if (lastComma > -1 && lastDot > -1) {
            // En sağdaki işaret ondalık ayıracıdır, diğeri binliktir
            if (lastComma > lastDot) {
                text = text.replace(/\./g, '').replace(',', '.');
            } else {
                text = text.replace(/,/g, '');
            }
        } else if (lastComma > -1) {
            var afterComma = text.length - lastComma - 1;
            // "1,234" gibi binlik kullanımını ondalıktan ayır: 3 hane + birden fazla grup
            if (afterComma === 3 && /^\d{1,3}(,\d{3})+$/.test(text)) {
                text = text.replace(/,/g, '');
            } else {
                text = text.replace(',', '.');
            }
        } else if (lastDot > -1) {
            if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
                text = text.replace(/\./g, '');
            }
        }

        var value = Number(text);
        return isFinite(value) ? value : null;
    }

    function round(value, decimals) {
        var p = Math.pow(10, decimals || 0);
        return Math.round(value * p) / p;
    }

    function formatNumber(value, decimals) {
        if (value === null || value === undefined || !isFinite(value)) return '—';
        return round(value, decimals).toLocaleString('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals || 0
        });
    }

    // ========================================================================
    // BİRİM DÖNÜŞÜMÜ
    // ========================================================================
    function getUnit(marker, unitCode) {
        if (!marker) return null;
        var list = marker.units || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].code === unitCode) return list[i];
        }
        return list[0] || null;
    }

    // Girilen değeri kanonik birime çevirir (ör. nmol/L -> ng/dL)
    function toCanonical(marker, value, unitCode) {
        var unit = getUnit(marker, unitCode);
        if (!unit || value === null) return value;
        return value * unit.factor;
    }

    // Kanonik değeri hedef birime çevirir
    function fromCanonical(marker, value, unitCode) {
        var unit = getUnit(marker, unitCode);
        if (!unit || value === null) return value;
        return value / unit.factor;
    }

    function convert(markerKey, value, fromUnit, toUnit) {
        var marker = MARKER_BY_KEY[markerKey] || MARKER_BY_ID[markerKey];
        if (!marker) return null;
        var canonical = toCanonical(marker, value, fromUnit);
        return fromCanonical(marker, canonical, toUnit);
    }

    function describeRange(marker, unitCode, which) {
        var range = marker[which || 'ref'];
        var unit = getUnit(marker, unitCode);
        var dec = unit ? unit.decimals : 0;
        var lo = fromCanonical(marker, range[0], unit && unit.code);
        var hi = fromCanonical(marker, range[1], unit && unit.code);
        return formatNumber(lo, dec) + '–' + formatNumber(hi, dec) + ' ' + (unit ? unit.code : marker.unit);
    }

    // Placeholder: "Örn: 480 · 270–1080"
    function placeholderFor(marker, unitCode) {
        var unit = getUnit(marker, unitCode);
        var dec = unit ? unit.decimals : 0;
        var example = fromCanonical(marker, marker.example, unit && unit.code);
        var lo = fromCanonical(marker, marker.ref[0], unit && unit.code);
        var hi = fromCanonical(marker, marker.ref[1], unit && unit.code);
        return 'Örn: ' + formatNumber(example, dec) + ' · ' + formatNumber(lo, dec) + '–' + formatNumber(hi, dec);
    }

    // ========================================================================
    // SINIFLANDIRMA — rozet dili
    // ========================================================================
    function classify(markerRef, canonicalValue) {
        var marker = typeof markerRef === 'string'
            ? (MARKER_BY_KEY[markerRef] || MARKER_BY_ID[markerRef])
            : markerRef;

        if (!marker || canonicalValue === null || canonicalValue === undefined || !isFinite(canonicalValue)) {
            return STATUS.unknown;
        }

        var crit = marker.critical || {};
        if (typeof crit.below === 'number' && canonicalValue < crit.below) return STATUS.critical;
        if (typeof crit.above === 'number' && canonicalValue > crit.above) return STATUS.critical;

        var lo = marker.ref[0];
        var hi = marker.ref[1];
        if (canonicalValue < lo) return STATUS.low;
        if (canonicalValue > hi) return STATUS.high;

        var span = hi - lo;
        if (canonicalValue < lo + span * 0.1 || canonicalValue > hi - span * 0.1) return STATUS.borderline;
        return STATUS.normal;
    }

    // ========================================================================
    // ALAN DOĞRULAMA
    // ========================================================================

    // Fiziksel analiz alanları: zorunlu, 0 ve negatif kabul edilmez
    var PHYSICAL_FIELDS = [
        { id: 'inputAge', label: 'Yaş', required: true, min: 16, max: 100 },
        { id: 'inputHeight', label: 'Boy (cm)', required: true, min: 120, max: 240 },
        { id: 'inputWeight', label: 'Kilo (kg)', required: true, min: 35, max: 300 }
    ];

    // Geriye dönük uyumluluk: eski BLOOD_FIELDS imzası
    var BLOOD_FIELDS = MARKERS.map(function (m) {
        return { id: m.id, label: m.label, required: false, marker: m.key };
    });

    /**
     * Tek bir alanı doğrular (eski API — fiziksel alanlar ve basit kullanım).
     * @returns {{ok:boolean, empty:boolean, value:(number|null), error:(string|null)}}
     */
    function validateField(raw, field) {
        field = field || {};
        var label = field.label || 'Değer';

        if (isBlank(raw)) {
            if (field.required) {
                return { ok: false, empty: true, value: null, error: label + ' alanı zorunludur' };
            }
            return { ok: true, empty: true, value: null, error: null };
        }

        var value = parseNumber(raw);

        if (value === null) {
            return { ok: false, empty: false, value: null, error: label + ' geçerli bir sayı olmalıdır' };
        }
        if (value === 0) {
            return { ok: false, empty: false, value: value, error: label + ' 0 olamaz, 0’dan büyük bir değer girin' };
        }
        if (value < 0) {
            return { ok: false, empty: false, value: value, error: label + ' negatif olamaz, 0’dan büyük bir değer girin' };
        }
        if (typeof field.min === 'number' && value < field.min) {
            return { ok: false, empty: false, value: value, error: label + ' en az ' + field.min + ' olabilir' };
        }
        if (typeof field.max === 'number' && value > field.max) {
            return { ok: false, empty: false, value: value, error: label + ' en fazla ' + field.max + ' olabilir' };
        }

        return { ok: true, empty: false, value: value, error: null };
    }

    /**
     * Laboratuvar alanı doğrulaması.
     * - accept aralığı dışı  -> hata (reddet)
     * - usual aralığı dışı   -> uyarı (reddetme, hekime yönlendir)
     * @returns {{ok, empty, value, raw, unit, error, warning, status}}
     */
    function validateMarkerValue(raw, markerRef, unitCode) {
        var marker = typeof markerRef === 'string'
            ? (MARKER_BY_ID[markerRef] || MARKER_BY_KEY[markerRef])
            : markerRef;

        if (!marker) {
            return { ok: false, empty: true, value: null, error: 'Bilinmeyen parametre', warning: null, status: STATUS.unknown };
        }

        var unit = getUnit(marker, unitCode || marker.unit);
        var unitLabel = unit ? unit.code : marker.unit;

        if (isBlank(raw)) {
            if (marker.required) {
                return {
                    ok: false, empty: true, value: null, unit: unitLabel,
                    error: marker.label + ' zorunlu alandır',
                    warning: null, status: STATUS.unknown
                };
            }
            return { ok: true, empty: true, value: null, unit: unitLabel, error: null, warning: null, status: STATUS.unknown };
        }

        var entered = parseNumber(raw);
        if (entered === null) {
            return {
                ok: false, empty: false, value: null, unit: unitLabel,
                error: 'Sayı olarak girin — ondalık için virgül veya nokta kullanabilirsiniz (ör. 2,1)',
                warning: null, status: STATUS.unknown
            };
        }
        if (entered <= 0) {
            return {
                ok: false, empty: false, value: null, unit: unitLabel,
                error: marker.label + ' 0’dan büyük olmalıdır',
                warning: null, status: STATUS.unknown
            };
        }

        var canonical = toCanonical(marker, entered, unitLabel);
        var acceptLo = marker.accept[0];
        var acceptHi = marker.accept[1];

        if (canonical < acceptLo || canonical > acceptHi) {
            return {
                ok: false, empty: false, value: null, unit: unitLabel, raw: entered,
                error: 'Geçerli giriş aralığı: ' + describeRange(marker, unitLabel, 'accept') + '. Birimi doğru seçtiniz mi?',
                warning: null, status: STATUS.unknown
            };
        }

        var warning = null;
        if (canonical < marker.usual[0] || canonical > marker.usual[1]) {
            warning = 'Alışılmadık bir değer, emin misiniz? Doğruysa analize devam edin; sonucu bir hekimle birlikte değerlendirmenizi öneririz.';
        }

        return {
            ok: true,
            empty: false,
            value: canonical,
            raw: entered,
            unit: unitLabel,
            error: null,
            warning: warning,
            status: classify(marker, canonical)
        };
    }

    /**
     * Bir alan grubunu doğrular (eski API).
     */
    function validateGroup(fields, values, options) {
        options = options || {};
        values = values || {};

        var errors = {};
        var parsed = {};
        var firstErrorId = null;
        var filledCount = 0;

        fields.forEach(function (field) {
            var result = validateField(values[field.id], field);
            if (!result.ok) {
                errors[field.id] = result.error;
                if (!firstErrorId) firstErrorId = field.id;
            } else if (!result.empty) {
                filledCount++;
                parsed[field.id] = result.value;
            }
        });

        var message = firstErrorId ? errors[firstErrorId] : null;

        if (!firstErrorId && options.requireAtLeastOne && filledCount === 0) {
            message = options.atLeastOneMessage || 'En az 1 değer girmeniz gerekiyor';
            return { ok: false, values: parsed, errors: errors, firstErrorId: null, message: message };
        }

        return {
            ok: !firstErrorId,
            values: parsed,
            errors: errors,
            firstErrorId: firstErrorId,
            message: message
        };
    }

    function validatePhysical(values) {
        return validateGroup(PHYSICAL_FIELDS, values, {});
    }

    function validateBlood(values) {
        return validateGroup(BLOOD_FIELDS, values, {
            requireAtLeastOne: true,
            atLeastOneMessage: 'En az 1 kan değeri girmeniz gerekiyor'
        });
    }

    /**
     * Kan paneli doğrulaması (yeni ekran).
     * @param {Object} values { inputTesto: '480', ... }
     * @param {Object} units  { inputTesto: 'nmol/L', ... }
     */
    function validateBloodPanel(values, units) {
        values = values || {};
        units = units || {};

        var errors = {};
        var warnings = {};
        var results = {};
        var parsed = {};
        var firstErrorId = null;
        var filled = 0;

        MARKERS.forEach(function (marker) {
            var res = validateMarkerValue(values[marker.id], marker, units[marker.id] || marker.unit);
            results[marker.id] = res;

            if (!res.ok) {
                errors[marker.id] = res.error;
                if (!firstErrorId) firstErrorId = marker.id;
                return;
            }
            if (res.warning) warnings[marker.id] = res.warning;
            if (!res.empty) {
                filled++;
                parsed[marker.key] = res.value;
            }
        });

        var message = firstErrorId ? errors[firstErrorId] : null;
        if (!firstErrorId && filled === 0) {
            message = 'En az Total Testosteron değerini girin';
            firstErrorId = 'inputTesto';
            errors.inputTesto = message;
        }

        return {
            ok: !firstErrorId,
            values: parsed,
            results: results,
            errors: errors,
            warnings: warnings,
            firstErrorId: firstErrorId,
            message: message,
            filled: filled
        };
    }

    // ========================================================================
    // SEMPTOMLAR
    // ========================================================================
    var SYMPTOMS = [
        {
            id: 'libido', label: 'Libido düşüklüğü', marker: 'totalT', weight: 70,
            note: 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.'
        },
        {
            id: 'morning', label: 'Sabah ereksiyonunun seyrekleşmesi', marker: 'freeT', weight: 65,
            note: 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.'
        },
        {
            id: 'muscle', label: 'Kas ve güç kaybı', marker: 'totalT', weight: 45,
            note: 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.'
        },
        {
            id: 'belly', label: 'Göbek bölgesinde yağlanma', marker: 'estradiol', weight: 40,
            note: 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.'
        },
        {
            id: 'gyno', label: 'Göğüs bölgesinde hassasiyet', marker: 'estradiol', weight: 35,
            note: 'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.'
        },
        {
            id: 'sleep', label: 'Uyku kalitesi düşük / yorgun uyanma', marker: 'cortisol', weight: 45,
            note: 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.'
        },
        {
            id: 'stress', label: 'Sürekli stres / sinirlilik', marker: 'cortisol', weight: 40,
            note: 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.'
        },
        {
            id: 'fatigue', label: 'Kronik yorgunluk', marker: 'ferritin', weight: 40,
            note: 'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.'
        },
        {
            id: 'recovery', label: 'Antrenman sonrası toparlanamama', marker: 'ferritin', weight: 30,
            note: 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.'
        },
        {
            id: 'mood', label: 'Motivasyon / odak kaybı', marker: 'vitD', weight: 35,
            note: 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.'
        },
        {
            id: 'hair', label: 'Vücut kıllanmasında azalma', marker: 'totalT', weight: 25,
            note: 'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.'
        },
        {
            id: 'sweat', label: 'Ani sıcak basması / terleme', marker: 'cortisol', weight: 25,
            note: 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.'
        }
    ];

    var SYMPTOM_BY_ID = {};
    SYMPTOMS.forEach(function (s) { SYMPTOM_BY_ID[s.id] = s; });

    // ========================================================================
    // TAHMİN MOTORU — nokta değer + güven aralığı
    // ========================================================================
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * @param {Object} input {age, height, weight, activity, sleepHours, stress, symptoms:[id]}
     * @returns {Object} tahmin + güven aralığı + semptom kartları
     */
    function estimateFromSymptoms(input) {
        input = input || {};
        var age = Number(input.age) || 35;
        var height = Number(input.height) || 175;
        var weight = Number(input.weight) || 78;
        var activity = Number(input.activity) || 3;
        var sleep = Number(input.sleepHours) || 7;
        var stress = Number(input.stress) || 2;
        var symptoms = (input.symptoms || []).filter(function (id) { return !!SYMPTOM_BY_ID[id]; });

        var bmi = weight / Math.pow(height / 100, 2);

        // Yaşa göre temel beklenti (popülasyon ortalaması, ng/dL)
        var base = 690 - Math.max(0, age - 25) * 4.4;

        var adjustments = [];
        function adjust(label, delta) {
            if (!delta) return;
            base += delta;
            adjustments.push({ label: label, delta: Math.round(delta) });
        }

        if (bmi >= 35) adjust('Vücut kitle indeksi 35+', -120);
        else if (bmi >= 30) adjust('Vücut kitle indeksi 30–35', -85);
        else if (bmi >= 27) adjust('Vücut kitle indeksi 27–30', -45);
        else if (bmi < 18.5) adjust('Düşük vücut kitle indeksi', -35);

        if (activity >= 4) adjust('Haftada 6–7 gün antrenman', 35);
        else if (activity === 3) adjust('Haftada 3–5 gün antrenman', 25);
        else if (activity === 1) adjust('Hareketsiz yaşam', -45);

        if (sleep < 6) adjust('Gecede 6 saatin altında uyku', -70);
        else if (sleep < 7) adjust('Gecede 6–7 saat uyku', -30);
        else if (sleep >= 8) adjust('Gecede 8+ saat uyku', 20);

        if (stress >= 3) adjust('Yüksek stres yükü', -55);
        else if (stress === 1) adjust('Düşük stres yükü', 15);

        var symptomLoad = 0;
        symptoms.forEach(function (id) {
            var s = SYMPTOM_BY_ID[id];
            symptomLoad += s.weight;
        });
        if (symptomLoad > 0) {
            adjust(symptoms.length + ' semptom işaretlendi', -Math.min(260, symptomLoad * 0.85));
        }

        var point = Math.round(clamp(base, 120, 1100) / 5) * 5;

        // Güven aralığı: veri azsa genişler
        var missing = 0;
        if (!input.age) missing++;
        if (!input.height || !input.weight) missing++;
        if (!input.sleepHours) missing++;
        if (!input.stress) missing++;
        if (!symptoms.length) missing += 2;

        var margin = Math.round(70 + missing * 22 + Math.max(0, 4 - symptoms.length) * 8);
        var low = Math.max(80, point - margin);
        var high = Math.min(1250, point + margin);
        var confidence = clamp(Math.round(92 - missing * 9 - Math.max(0, 3 - symptoms.length) * 4), 45, 90);

        // Semptom bazlı kartlar: her kart kullanıcının seçtiği semptomun başlığını taşır
        var grouped = {};
        symptoms.forEach(function (id) {
            var s = SYMPTOM_BY_ID[id];
            if (!grouped[s.marker]) grouped[s.marker] = { marker: s.marker, symptoms: [], weight: 0 };
            grouped[s.marker].symptoms.push(s);
            grouped[s.marker].weight += s.weight;
        });

        var cards = Object.keys(grouped).map(function (markerKey) {
            var group = grouped[markerKey];
            var marker = MARKER_BY_KEY[markerKey];
            var estimate = estimateMarker(markerKey, {
                totalT: point, bmi: bmi, sleep: sleep, stress: stress, load: group.weight, age: age
            });
            var status = classify(marker, estimate.value);
            return {
                markerKey: markerKey,
                marker: marker,
                title: group.symptoms.map(function (s) { return s.label; }).join(' + '),
                symptoms: group.symptoms,
                value: round(estimate.value, marker.units[0].decimals),
                low: round(estimate.low, marker.units[0].decimals),
                high: round(estimate.high, marker.units[0].decimals),
                unit: marker.unit,
                ref: marker.ref,
                refText: describeRange(marker, marker.unit, 'ref'),
                status: status,
                explain: group.symptoms[0].note + ' ' + marker.explain
            };
        }).sort(function (a, b) {
            return a.status.rank - b.status.rank;
        });

        return {
            point: point,
            low: low,
            high: high,
            unit: 'ng/dL',
            confidence: confidence,
            margin: margin,
            bmi: round(bmi, 1),
            status: classify('totalT', point),
            ref: MARKER_BY_KEY.totalT.ref,
            refText: describeRange(MARKER_BY_KEY.totalT, 'ng/dL', 'ref'),
            adjustments: adjustments,
            cards: cards,
            symptomCount: symptoms.length,
            completeness: 70
        };
    }

    // Semptom yüküne göre ilgili biyobelirtecin tahmini
    function estimateMarker(markerKey, ctx) {
        var load = ctx.load || 0;
        var value;

        switch (markerKey) {
            case 'totalT':
                value = ctx.totalT;
                break;
            case 'freeT':
                // Serbest T ~ total T'nin %2'si (pg/mL = ng/dL × 0.2)
                value = ctx.totalT * 0.2 * (1 - Math.min(0.25, load / 400));
                break;
            case 'estradiol':
                value = 24 + Math.max(0, ctx.bmi - 24) * 2.1 + load * 0.06;
                break;
            case 'cortisol':
                value = 13 + (ctx.stress - 2) * 2.6 + Math.max(0, 7 - ctx.sleep) * 1.9 + load * 0.02;
                break;
            case 'ferritin':
                value = 95 - load * 0.45;
                break;
            case 'vitD':
                value = 32 - load * 0.12;
                break;
            default:
                value = MARKER_BY_KEY[markerKey] ? (MARKER_BY_KEY[markerKey].ref[0] + MARKER_BY_KEY[markerKey].ref[1]) / 2 : 0;
        }

        var marker = MARKER_BY_KEY[markerKey];
        value = clamp(value, marker.accept[0], marker.accept[1]);
        var spread = value * 0.22;
        return {
            value: value,
            low: Math.max(marker.accept[0], value - spread),
            high: Math.min(marker.accept[1], value + spread)
        };
    }

    // ========================================================================
    // GENEL DEĞERLENDİRME SKORU — tooltip için şeffaf hesap
    // ========================================================================
    var SCORE_WEIGHTS = [
        { key: 'totalT', weight: 30 },
        { key: 'freeT', weight: 20 },
        { key: 'shbg', weight: 8 },
        { key: 'estradiol', weight: 8 },
        { key: 'cortisol', weight: 9 },
        { key: 'vitD', weight: 10 },
        { key: 'ferritin', weight: 7 },
        { key: 'b12', weight: 4 },
        { key: 'zinc', weight: 2 },
        { key: 'mg', weight: 2 }
    ];

    // Değerin referans aralığına göre 0-100 puanı
    function scoreMarker(markerKey, value) {
        var marker = MARKER_BY_KEY[markerKey];
        if (!marker || value === null || value === undefined) return null;

        var lo = marker.ref[0];
        var hi = marker.ref[1];
        var span = hi - lo;

        if (value >= lo && value <= hi) {
            // Aralığın alt ve üst %10'u "sınırda" sayılır, puan 80-100 arası
            var distance = Math.min(value - lo, hi - value) / (span / 2);
            return Math.round(80 + 20 * Math.min(1, distance));
        }

        var deviation = value < lo ? (lo - value) / span : (value - hi) / span;
        return Math.round(clamp(80 - deviation * 110, 0, 79));
    }

    /**
     * @param {Object} values { totalT: 480, vitD: 22, ... } (kanonik birimlerde)
     */
    function computeOverallScore(values) {
        values = values || {};
        var breakdown = [];
        var totalWeight = 0;
        var weighted = 0;

        SCORE_WEIGHTS.forEach(function (entry) {
            var value = values[entry.key];
            if (value === null || value === undefined) return;
            var points = scoreMarker(entry.key, value);
            if (points === null) return;
            var marker = MARKER_BY_KEY[entry.key];
            totalWeight += entry.weight;
            weighted += points * entry.weight;
            breakdown.push({
                key: entry.key,
                label: marker.short,
                weight: entry.weight,
                points: points,
                status: classify(marker, value)
            });
        });

        if (!totalWeight) {
            return { score: null, breakdown: [], coverage: 0, formula: 'Değer girilmedi.' };
        }

        var score = Math.round(weighted / totalWeight);
        var maxWeight = SCORE_WEIGHTS.reduce(function (sum, e) { return sum + e.weight; }, 0);

        return {
            score: score,
            breakdown: breakdown.sort(function (a, b) { return a.points - b.points; }),
            coverage: Math.round((totalWeight / maxWeight) * 100),
            formula: 'Skor = girdiğiniz her parametrenin referans aralığına uzaklığından 0–100 puan üretilir, ' +
                     'ardından ağırlıklı ortalaması alınır (Total T %30, Serbest T %20, D vitamini %10, kortizol %9 …). ' +
                     'Girmediğiniz parametreler hesaba katılmaz; bu nedenle skorun yanında kapsama oranı gösterilir.'
        };
    }

    // ========================================================================
    // TAHLİL METNİ AYRIŞTIRMA (PDF / foto okuma sonrası)
    // ========================================================================
    var PARSE_ALIASES = {
        totalT: ['total testosteron', 'totaltestosteron', 'testosteron total', 'total testosterone', 'serum testosteron', 'testosteron,total', 'testosteron'],
        freeT: ['serbest testosteron', 'free testosterone', 'free testosteron', 'testosteron serbest'],
        shbg: ['shbg', 'seks hormon baglayici', 'seks hormonu baglayici globulin', 'sex hormone binding'],
        lh: ['lh', 'luteinizan hormon', 'luteinizing hormone'],
        fsh: ['fsh', 'folikul stimulan hormon', 'follicle stimulating'],
        estradiol: ['estradiol', 'ostradiol', 'e2'],
        cortisol: ['kortizol', 'cortisol'],
        ferritin: ['ferritin', 'ferritin (serum)'],
        vitD: ['25 oh vitamin d', '25-oh vitamin d', 'vitamin d', 'd vitamini', '25 hidroksi vitamin d', '25(oh)d'],
        b12: ['vitamin b12', 'b12', 'kobalamin'],
        zinc: ['cinko', 'zinc', 'zn'],
        mg: ['magnezyum', 'magnesium']
    };

    var UNIT_PATTERNS = [
        { re: /ng\s*\/\s*dl/i, code: 'ng/dL' },
        { re: /ng\s*\/\s*ml/i, code: 'ng/mL' },
        { re: /pg\s*\/\s*ml/i, code: 'pg/mL' },
        { re: /nmol\s*\/\s*l/i, code: 'nmol/L' },
        { re: /pmol\s*\/\s*l/i, code: 'pmol/L' },
        { re: /µmol\s*\/\s*l|umol\s*\/\s*l/i, code: 'µmol/L' },
        { re: /mmol\s*\/\s*l/i, code: 'mmol/L' },
        { re: /µg\s*\/\s*dl|ug\s*\/\s*dl|mcg\s*\/\s*dl/i, code: 'µg/dL' },
        { re: /µg\s*\/\s*l|ug\s*\/\s*l/i, code: 'µg/L' },
        { re: /mg\s*\/\s*dl/i, code: 'mg/dL' },
        { re: /miu\s*\/\s*ml/i, code: 'mIU/mL' },
        { re: /iu\s*\/\s*l|u\s*\/\s*l/i, code: 'IU/L' }
    ];

    function normalizeText(text) {
        return String(text || '')
            .toLocaleLowerCase('tr')
            .replace(/ı/g, 'i').replace(/İ/g, 'i')
            .replace(/ş/g, 's').replace(/ğ/g, 'g')
            .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[\t ]+/g, ' ');
    }

    /**
     * Tahlil metninden (PDF metni veya OCR çıktısı) değerleri yakalar.
     * @returns {{values:Object, units:Object, matched:Array, unmatched:Array, lines:Object}}
     */
    function parseLabText(text) {
        var normalized = normalizeText(text);
        var lines = normalized.split(/\r?\n/);
        var values = {};
        var units = {};
        var matched = [];
        var matchedLines = {};

        MARKERS.forEach(function (marker) {
            var aliases = PARSE_ALIASES[marker.key] || [];
            for (var a = 0; a < aliases.length; a++) {
                var alias = normalizeText(aliases[a]);
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    var idx = line.indexOf(alias);
                    if (idx === -1) continue;

                    // Kısa kısaltmalar için kelime sınırı kontrolü (lh, e2, zn ...)
                    if (alias.length <= 3) {
                        var boundary = new RegExp('(^|[^a-z0-9])' + alias + '([^a-z0-9]|$)');
                        if (!boundary.test(line)) continue;
                    }

                    var rest = line.slice(idx + alias.length);
                    var numMatch = rest.match(/(-?\d{1,6}(?:[.,]\d{1,3})?)/);
                    if (!numMatch) continue;

                    var value = parseNumber(numMatch[1]);
                    if (value === null || value <= 0) continue;

                    // Birim tespiti
                    var unitCode = marker.unit;
                    var tail = rest.slice(numMatch.index + numMatch[1].length, numMatch.index + numMatch[1].length + 24);
                    for (var u = 0; u < UNIT_PATTERNS.length; u++) {
                        if (UNIT_PATTERNS[u].re.test(tail)) {
                            var candidate = UNIT_PATTERNS[u].code;
                            if (getUnit(marker, candidate) && getUnit(marker, candidate).code === candidate) {
                                unitCode = candidate;
                            }
                            break;
                        }
                    }

                    var canonical = toCanonical(marker, value, unitCode);
                    if (canonical < marker.accept[0] || canonical > marker.accept[1]) continue;

                    values[marker.id] = value;
                    units[marker.id] = unitCode;
                    matchedLines[marker.id] = line.trim();
                    matched.push(marker.key);
                    return;
                }
            }
        });

        var unmatched = MARKERS.filter(function (m) { return !values[m.id]; }).map(function (m) { return m.key; });

        return { values: values, units: units, matched: matched, unmatched: unmatched, lines: matchedLines };
    }

    // ========================================================================
    // NUMUNE KOŞULLARI VE LOJİSTİK (ekranlarda tek kaynaktan gösterilir)
    // ========================================================================
    var SAMPLE_RULES = [
        'Kan sabah 07:00–10:00 arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.',
        '8–12 saat açlık; sadece su içebilirsiniz.',
        'Biotin (B7) içeren takviyeleri ölçümden en az 72 saat önce bırakın — hormon sonuçlarını yanlış gösterir.',
        'Son 48 saatte ağır antrenman ve alkol olmasın.',
        'Akut hastalık (ateş, enfeksiyon) döneminde ölçüm ertelenmelidir.'
    ];

    var LOGISTICS = {
        updatedAt: 'Ekim 2025',
        items: [
            { label: 'Nerede yaptırılır', value: 'Herhangi bir özel laboratuvar veya devlet hastanesi; sevk gerekmez.' },
            { label: 'Ücret kimde', value: 'Test ücreti kullanıcıya aittir. TestoTavan ücret almaz, laboratuvarla iş ortaklığı yoktur.' },
            { label: 'Yaklaşık maliyet', value: 'Tek başına Total T için ~400–700 TL; geniş hormon paneli için ~1.500–2.500 TL (özel laboratuvar ortalaması).' },
            { label: 'Sonuç süresi', value: 'Hormon paneli genelde aynı gün – 2 iş günü içinde çıkar.' },
            { label: 'SGK kapsamı', value: 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.' }
        ],
        note: 'Fiyatlar ' + 'Ekim 2025' + ' itibarıyla kullanıcı bildirimlerine dayanan ortalamadır; işlem öncesi laboratuvardan teyit edin.'
    };

    var api = {
        STATUS: STATUS,
        MARKERS: MARKERS,
        MARKER_BY_ID: MARKER_BY_ID,
        MARKER_BY_KEY: MARKER_BY_KEY,
        SYMPTOMS: SYMPTOMS,
        SAMPLE_RULES: SAMPLE_RULES,
        LOGISTICS: LOGISTICS,
        SCORE_WEIGHTS: SCORE_WEIGHTS,

        PHYSICAL_FIELDS: PHYSICAL_FIELDS,
        BLOOD_FIELDS: BLOOD_FIELDS,

        parseNumber: parseNumber,
        formatNumber: formatNumber,
        round: round,
        getUnit: getUnit,
        toCanonical: toCanonical,
        fromCanonical: fromCanonical,
        convert: convert,
        describeRange: describeRange,
        placeholderFor: placeholderFor,
        classify: classify,

        validateField: validateField,
        validateGroup: validateGroup,
        validatePhysical: validatePhysical,
        validateBlood: validateBlood,
        validateMarkerValue: validateMarkerValue,
        validateBloodPanel: validateBloodPanel,

        estimateFromSymptoms: estimateFromSymptoms,
        estimateMarker: estimateMarker,
        scoreMarker: scoreMarker,
        computeOverallScore: computeOverallScore,
        parseLabText: parseLabText
    };

    if (typeof window !== 'undefined') {
        window.TestoValidation = api;
    } else if (typeof globalThis !== 'undefined') {
        globalThis.TestoValidation = api;
    }
})();
