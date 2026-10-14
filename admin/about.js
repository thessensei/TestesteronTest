(() => {
    const languages = ['tr', 'en', 'de', 'ja'];
    const get = id => document.getElementById(id);
    const form = get('about-editor-form');
    const status = get('about-editor-status');
    const retry = get('about-editor-retry');
    const language = get('about-editor-language');
    const save = get('about-editor-save');
    let fields = [];
    let loading = false;

    function selectLanguage() {
        languages.forEach(lang => { get(`about-fields-${lang}`).hidden = language.value !== lang; });
    }
    window.loadAboutEditor = async () => {
        if (loading) return;
        loading = true;
        status.textContent = 'Hakkımızda bilgileri yükleniyor...';
        form.classList.add('hidden');
        retry.classList.add('hidden');
        try {
            const response = await fetch('/api/about', { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Bilgiler yüklenemedi.');
            if (!data.content?.tr || !Array.isArray(data.fields)) throw new Error('Geçersiz sunucu yanıtı.');
            fields = data.fields;
            const container = get('about-editor-fields');
            container.replaceChildren();
            languages.forEach(lang => {
                const panel = document.createElement('div');
                panel.id = `about-fields-${lang}`;
                fields.forEach(field => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'field';
                    const label = document.createElement('label');
                    const input = document.createElement(field.multiline ? 'textarea' : 'input');
                    input.id = `about-${lang}-${field.key}`;
                    input.lang = lang;
                    input.maxLength = field.maxLength;
                    input.required = lang === 'tr';
                    input.value = data.content[lang]?.[field.key] || '';
                    label.htmlFor = input.id;
                    label.textContent = `${field.label}${lang === 'tr' ? ' *' : ' (isteğe bağlı)'}`;
                    wrapper.append(label, input);
                    panel.append(wrapper);
                });
                container.append(panel);
            });
            selectLanguage();
            form.classList.remove('hidden');
            status.textContent = 'Mevcut bilgiler yüklendi. Düzenleyip kaydedebilirsiniz.';
        } catch (error) {
            status.textContent = error.message || 'Bağlantı hatası. Lütfen tekrar deneyin.';
            retry.classList.remove('hidden');
        } finally { loading = false; }
    };
    retry.addEventListener('click', () => window.loadAboutEditor());
    language.addEventListener('change', selectLanguage);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (save.disabled) return;
        const content = {};
        for (const lang of languages) {
            content[lang] = {};
            for (const field of fields) {
                const input = get(`about-${lang}-${field.key}`);
                if ((lang === 'tr' && !input.value.trim()) || input.value.length > field.maxLength) {
                    language.value = lang;
                    selectLanguage();
                    status.textContent = `${field.label}: ${!input.value.trim() ? 'bu alan zorunludur' : `en fazla ${field.maxLength} karakter girin`}.`;
                    input.focus();
                    return;
                }
                content[lang][field.key] = input.value.trim();
            }
        }
        save.disabled = true;
        save.textContent = 'Kaydediliyor...';
        status.textContent = 'Değişiklikler kaydediliyor...';
        try {
            const response = await fetch('/api/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Testotavan-About': '1' },
                body: JSON.stringify({ content })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Kaydedilemedi.');
            status.textContent = 'Hakkımızda bilgileri kaydedildi ve sitede yayınlandı.';
        } catch (error) {
            status.textContent = `${error.message || 'Bağlantı hatası.'} Düzenlemeleriniz formda korunuyor; tekrar kaydetmeyi deneyebilirsiniz.`;
        } finally {
            save.disabled = false;
            save.textContent = 'Hakkımızda değişikliklerini kaydet';
        }
    });
})();
