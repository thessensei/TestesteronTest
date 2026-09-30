/*
 * TestoTavan - Ortak sayısal girdi doğrulama yardımcıları
 * Hem tarayıcıda (window.TestoValidation) hem de Node testlerinde kullanılır.
 */
(function () {
    'use strict';

    // Fiziksel analiz alanları: zorunlu, 0 ve negatif kabul edilmez
    var PHYSICAL_FIELDS = [
        { id: 'inputAge', label: 'Yaş', required: true, max: 120 },
        { id: 'inputHeight', label: 'Boy (cm)', required: true, max: 260 },
        { id: 'inputWeight', label: 'Kilo (kg)', required: true, max: 400 }
    ];

    // Kan testi alanları: opsiyonel, ama girildiyse 0 ve negatif kabul edilmez
    var BLOOD_FIELDS = [
        { id: 'inputTesto', label: 'Total Testosteron', required: false },
        { id: 'inputFreeTesto', label: 'Serbest Testosteron', required: false },
        { id: 'inputCortisol', label: 'Kortizol', required: false },
        { id: 'inputSHBG', label: 'SHBG', required: false },
        { id: 'inputVitD', label: 'D Vitamini', required: false },
        { id: 'inputB12', label: 'B12', required: false },
        { id: 'inputZinc', label: 'Çinko', required: false },
        { id: 'inputMg', label: 'Magnezyum', required: false }
    ];

    function isBlank(raw) {
        return raw === undefined || raw === null || String(raw).trim() === '';
    }

    /**
     * Tek bir alanı doğrular.
     * @returns {{ok: boolean, empty: boolean, value: (number|null), error: (string|null)}}
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

        var value = Number(String(raw).replace(',', '.'));

        if (!isFinite(value)) {
            return { ok: false, empty: false, value: null, error: label + ' geçerli bir sayı olmalıdır' };
        }
        if (value === 0) {
            return { ok: false, empty: false, value: value, error: label + ' 0 olamaz, 0’dan büyük bir değer girin' };
        }
        if (value < 0) {
            return { ok: false, empty: false, value: value, error: label + ' negatif olamaz, 0’dan büyük bir değer girin' };
        }
        if (typeof field.max === 'number' && value > field.max) {
            return { ok: false, empty: false, value: value, error: label + ' en fazla ' + field.max + ' olabilir' };
        }

        return { ok: true, empty: false, value: value, error: null };
    }

    /**
     * Bir alan grubunu doğrular.
     * @param {Array} fields alan tanımları
     * @param {Object} values { inputAge: '25', ... } ham değerler
     * @param {Object} options { requireAtLeastOne: boolean, atLeastOneMessage: string }
     * @returns {{ok: boolean, values: Object, errors: Object, firstErrorId: (string|null), message: (string|null)}}
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

    var api = {
        PHYSICAL_FIELDS: PHYSICAL_FIELDS,
        BLOOD_FIELDS: BLOOD_FIELDS,
        validateField: validateField,
        validateGroup: validateGroup,
        validatePhysical: validatePhysical,
        validateBlood: validateBlood
    };

    if (typeof window !== 'undefined') {
        window.TestoValidation = api;
    } else if (typeof globalThis !== 'undefined') {
        globalThis.TestoValidation = api;
    }
})();
