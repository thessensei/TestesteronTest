// Hakkımızda: yalnızca metin yerleştirilir; panel içeriği HTML olarak çalıştırılmaz.
let aboutContent = null;
let aboutRequest = null;
function renderAboutContent() {
    if (!aboutContent) return;
    const lang = localStorage.getItem('testotavan_language') || 'tr';
    document.querySelectorAll('[data-about-field]').forEach(el => {
        const key = el.dataset.aboutField;
        const base = aboutContent.tr?.[key];
        if (typeof base !== 'string') return;
        const text = aboutContent[lang]?.[key] || (i18n[lang] || {})[base] || base;
        el.dataset.aboutCustom = 'true';
        if (el.textContent !== text) el.textContent = text;
    });
}
function loadAboutContent() {
    if (aboutRequest) return aboutRequest;
    aboutRequest = (async () => {
        try {
            const response = await fetch('/api/about', { cache: 'no-store' });
            if (!response.ok) throw new Error('Hakkımızda bilgileri yüklenemedi.');
            const data = await response.json();
            if (!data.content?.tr) throw new Error('Geçersiz Hakkımızda yanıtı.');
            aboutContent = data.content;
            renderAboutContent();
        } catch (error) {
            // Servis kesintisinde mevcut sayfa metni korunur; sonraki girişte yeniden denenir.
            console.warn(error.message);
        } finally { aboutRequest = null; }
    })();
    return aboutRequest;
}

// ========================================
// BLOG, TARİFLER & YÖNETİM PANELİ
// ========================================
let activeContentFilter = 'all';
let sharedContent = [];
let blogDataRequested = false;
let adminAuthenticated = false;
function getCustomContent(){ return sharedContent; }
// "20 dk" -> EN "20 min" · DE "20 Min." · JA "20分" · FR/ES "20 min" · BG/RU "20 мин" · HI "20 मिनट" · ZH "20 分钟"
function localizeDuration(text, lang){
 const src=String(text||'').trim();
 const units={en:{min:'min',hour:'h',space:true},de:{min:'Min.',hour:'Std.',space:true},ja:{min:'分',hour:'時間',space:false},fr:{min:'min',hour:'h',space:true},es:{min:'min',hour:'h',space:true},bg:{min:'мин',hour:'ч',space:true},ru:{min:'мин',hour:'ч',space:true},hi:{min:'मिनट',hour:'घंटा',space:true},zh:{min:'分钟',hour:'小时',space:true}};
 if(!src||!units[lang]) return src;
 const m=src.match(/^(\d+(?:[.,]\d+)?)\s*(dakika|dk|saat|sa)\.?$/i);
 if(!m) return src;
 const key=/^(saat|sa)$/i.test(m[2])?'hour':'min';
 return units[lang].space?`${m[1]} ${units[lang][key]}`:`${m[1]}${units[lang][key]}`;
}
function localizedContent(item){
 const lang=localStorage.getItem('testotavan_language')||'tr';
 if(lang==='tr') return item;
 const t=item.translations?.[lang]||{};
 // Eksik çeviri Türkçeye değil İngilizceye düşer; Türkçe metin başka dilde asla gösterilmez.
 const en=item.translations?.en||{};
 const pick=key=>t[key]||en[key]||'';
 const ingredients=(Array.isArray(t.ingredients)&&t.ingredients.length)?t.ingredients:((Array.isArray(en.ingredients)&&en.ingredients.length)?en.ingredients:[]);
 const title=pick('title');
 // Ne seçili dilde ne İngilizcede başlık varsa kayıt bu dilde gösterilmez.
 if(!title) return null;
 return {...item,
  category:pick('category'),
  title,
  summary:pick('summary'),
  body:pick('body'),
  time:t.time||en.time||localizeDuration(item.time,lang),
  ingredients};
}
function getAllContent(){ return sharedContent.map(localizedContent).filter(Boolean); }
async function loadSharedContent(){ try { const response=await fetch('/api/content'); if(response.ok){ sharedContent=await response.json(); renderContent(); } } catch(e){ console.warn('İçerikler yüklenemedi',e); } }
function ensureBlogData(){
    if (blogDataRequested) return;
    blogDataRequested = true;
    loadSharedContent();
    loadStats();
}
// Dinamik olarak basılan sabit metinleri doğrudan sözlükten çevirir (gözlemciyi beklemeden)
function tLabel(text){ const lang=localStorage.getItem('testotavan_language')||'tr'; if(lang==='tr')return text; if(typeof i18n==='undefined')return text; return (i18n[lang]&&i18n[lang][text])||(i18n.en&&i18n.en[text])||text; }
function escapeHTML(value=''){ const d=document.createElement('div'); d.textContent=value; return d.innerHTML; }
function setContentFilter(filter,button){ activeContentFilter=filter; document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active')); button.classList.add('active'); renderContent(); }
// Her yazının kendi SEO sayfası vardır: /blog/<slug>/. Kartlar doğrudan o adrese
// gider; böylece paylaşılan bağlantı ve arama motoru kaydı SPA durumuna bağlı kalmaz.
function contentPublicUrl(item){
    if(!item) return '';
    if(typeof item.url==='string'&&/^\/blog\//.test(item.url)) return item.url;
    if(typeof item.slug==='string'&&item.slug) return `/blog/${encodeURIComponent(item.slug)}/`;
    return '';
}
// Derin bağlantı (?icerik=<id>) modalı açar; kart tıklamaları kendi sayfasına gider.
function openContent(id){
    const item=getAllContent().find(x=>x.id===id);
    if(!item) return;
    const url=contentPublicUrl(item);
    if(url){ window.location.href=url; return; }
    showContent(id);
}
function renderContent(){
    const list=document.getElementById('contentList'); if(!list)return;
    const query=(document.getElementById('contentSearch')?.value||'').trim().toLocaleLowerCase('tr');
    const items=getAllContent().filter(x=>(activeContentFilter==='all'||x.type===activeContentFilter)&&(!query||`${x.title} ${x.category} ${x.summary}`.toLocaleLowerCase('tr').includes(query)));
    list.innerHTML=items.length?items.map(x=>{
        const url=contentPublicUrl(x)||'#';
        const cover=x.cover_url&&(/^https:\/\//i.test(x.cover_url)||/^\/api\/media\/[\w-]+$/i.test(x.cover_url))?`<div class="content-cover ${x.type}" style="background-image:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.05)),url('${escapeHTML(x.cover_url)}')"></div>`:`<div class="content-cover ${x.type}"></div>`;
        return `<a class="card content-card" href="${escapeHTML(url)}" style="text-decoration:none;color:inherit;display:block"><div class="content-body" style="padding:0">${cover}<div style="padding:16px 18px 18px"><div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><span class="badge ${x.type==='recipe'?'badge-low':'badge-high'}">${escapeHTML(tLabel(x.type==='recipe'?'Yemek Tarifi':'Blog'))}</span><span class="content-emoji" aria-hidden="true">${IC(x.type==='recipe'?'i-utensils':'i-news')}</span></div><div class="eyebrow" style="margin-top:10px">${escapeHTML(x.category)}</div><h3 style="font-size:16px;margin-top:5px">${escapeHTML(x.title)}</h3><div class="content-meta"><span>${IC('i-clock')}${escapeHTML(x.time)}</span><span>${IC('i-calendar')}${escapeHTML(x.date)}</span></div><p class="content-summary">${escapeHTML(x.summary)}</p></div></div></a>`;
    }).join(''):'<div class="empty-state"><svg class="ic empty-ic" aria-hidden="true"><use href="#i-search"></use></svg><p style="margin-top:10px">Aramanızla eşleşen içerik bulunamadı.</p></div>';
}
function recipeNutritionMarkup(item){
    const nutritionApi=window.TestoValidation;
    const parsed=nutritionApi?.parseRecipeIngredients?.(Array.isArray(item.ingredients)?item.ingredients:[])||[];
    window.activeRecipeNutritionItems=parsed;
    const known=parsed.filter(value=>value.matched);
    const rows=parsed.map((ingredient,index)=>{
        if(!ingredient.matched)return `<div class="atom-slider-row"><div class="atom-slider-head"><span>${escapeHTML(ingredient.label)}</span><span class="atom-gram-badge">${escapeHTML(tLabel('Besin verisi bulunamadı'))}</span></div><div class="muted">${escapeHTML(tLabel('Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.'))}</div></div>`;
        const amountNote=ingredient.grams>0?'':`<div class="muted" style="margin:5px 0">${escapeHTML(tLabel('Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.'))}</div>`;
        return `<div class="atom-slider-row"><div class="atom-slider-head"><label for="recipeNutritionInput-${index}">${escapeHTML(ingredient.label)}</label><span class="atom-gram-badge" id="recipeNutritionValue-${index}">${ingredient.grams} g</span></div>${amountNote}<input type="range" class="atom-range" id="recipeNutritionInput-${index}" min="0" max="${ingredient.maxGrams}" step="5" value="${ingredient.grams}" oninput="updateRecipeNutritionCalculator()"></div>`;
    }).join('');
    const emptyNote=known.length?'':`<p class="muted" style="margin:12px 0 0">${escapeHTML(tLabel('Bu tarifte hesaplanabilir malzeme eşleşmedi.'))}</p>`;
    return `<section class="card atom-widget recipe-nutrition-widget" id="recipeNutritionCalculator" aria-labelledby="recipeNutritionTitle"><div class="card-header"><div class="card-icon icon-gold"><svg class="ic" aria-hidden="true"><use href="#i-bolt"></use></svg></div><div><div class="eyebrow">${escapeHTML(tLabel('Damat Atomu Besin Değeri Hesaplayıcı'))}</div><h3 class="card-title" id="recipeNutritionTitle">${escapeHTML(tLabel('Bu tarife özel besin hesaplayıcı'))}</h3><div class="card-subtitle">${escapeHTML(item.title)}</div></div></div><p class="muted" style="margin:10px 0">${escapeHTML(tLabel('Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.'))}</p><p class="muted" style="margin:0">${known.length}/${parsed.length} ${escapeHTML(tLabel('Eşleşen malzeme'))}</p><div class="recipe-nutrition-ingredients">${rows}</div><div class="atom-metrics-grid" role="region" aria-live="polite" aria-label="${escapeHTML(tLabel('Bu tarife özel besin hesaplayıcı'))}"><div class="atom-metric-box"><div class="atom-metric-label">${escapeHTML(tLabel('Enerji'))}</div><div class="atom-metric-val" id="recipeNutritionKcal">0 kcal</div><div class="atom-metric-sub" id="recipeNutritionGrams">0 g</div></div><div class="atom-metric-box"><div class="atom-metric-label">${escapeHTML(tLabel('Magnezyum'))}</div><div class="atom-metric-val" id="recipeNutritionMg">0 mg</div><div class="atom-metric-sub" id="recipeNutritionMgPct">%0 ${escapeHTML(tLabel('Günlük hedef'))}</div></div><div class="atom-metric-box"><div class="atom-metric-label">${escapeHTML(tLabel('Çinko'))}</div><div class="atom-metric-val" id="recipeNutritionZinc">0 mg</div><div class="atom-metric-sub" id="recipeNutritionZincPct">%0 ${escapeHTML(tLabel('Günlük hedef'))}</div></div><div class="atom-metric-box"><div class="atom-metric-label">${escapeHTML(tLabel('Protein'))}</div><div class="atom-metric-val" id="recipeNutritionProtein">0 g</div><div class="atom-metric-sub">${escapeHTML(tLabel('Hesaplanan miktar'))}</div></div></div><div class="atom-rda-bars"><div><div class="progress-head"><span>${escapeHTML(tLabel('Magnezyum'))} · 420 mg</span><span id="recipeNutritionMgBarLabel">%0</span></div><div class="progress-track"><div class="progress-fill" id="recipeNutritionMgBar" style="width:0%"></div></div></div><div><div class="progress-head"><span>${escapeHTML(tLabel('Çinko'))} · 11 mg</span><span id="recipeNutritionZincBarLabel">%0</span></div><div class="progress-track"><div class="progress-fill" id="recipeNutritionZincBar" style="width:0%"></div></div></div></div><div class="atom-log-box" id="recipeNutritionLog" role="status" aria-live="polite"></div>${emptyNote}<p class="muted" style="margin:10px 0 0">${escapeHTML(tLabel('Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.'))}</p></section>`;
}
function updateRecipeNutritionCalculator(){
    const nutritionApi=window.TestoValidation;
    if(!nutritionApi?.computeRecipeNutrition)return null;
    const source=Array.isArray(window.activeRecipeNutritionItems)?window.activeRecipeNutritionItems:[];
    const items=source.map((ingredient,index)=>{
        const input=document.getElementById('recipeNutritionInput-'+index);
        const grams=input?Number(input.value):ingredient.grams;
        const value=Number.isFinite(grams)?grams:0;
        const badge=document.getElementById('recipeNutritionValue-'+index);
        if(badge)badge.textContent=`${value} g`;
        return {...ingredient,grams:value};
    });
    const stats=nutritionApi.computeRecipeNutrition(items);
    const lang=localStorage.getItem('testotavan_language')||'tr';
    const number=(value,digits=0)=>new Intl.NumberFormat(lang,{maximumFractionDigits:digits}).format(value);
    const set=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value};
    set('recipeNutritionKcal',`${number(stats.kcal)} kcal`);
    set('recipeNutritionMg',`${number(stats.mg,1)} mg`);
    set('recipeNutritionZinc',`${number(stats.zinc,2)} mg`);
    set('recipeNutritionProtein',`${number(stats.protein,1)} g`);
    set('recipeNutritionGrams',`${number(stats.totalGrams)} g ${tLabel('Hesaplanan miktar')}`);
    set('recipeNutritionMgPct',`%${stats.mgRdaPct} ${tLabel('Günlük hedef')}`);
    set('recipeNutritionZincPct',`%${stats.zincRdaPct} ${tLabel('Günlük hedef')}`);
    set('recipeNutritionMgBarLabel',`%${stats.mgRdaPct}`);
    set('recipeNutritionZincBarLabel',`%${stats.zincRdaPct}`);
    const mgBar=document.getElementById('recipeNutritionMgBar');
    const zincBar=document.getElementById('recipeNutritionZincBar');
    if(mgBar)mgBar.style.width=`${Math.min(100,stats.mgRdaPct)}%`;
    if(zincBar)zincBar.style.width=`${Math.min(100,stats.zincRdaPct)}%`;
    const log=document.getElementById('recipeNutritionLog');
    if(log){
        const rows=stats.breakdown.filter(row=>row.grams>0).map(row=>`<li>${escapeHTML(row.label)} (${row.grams} g): ${row.kcal} kcal · Mg ${number(row.mg,1)} mg · Zn ${number(row.zinc,2)} mg · ${number(row.protein,1)} g ${escapeHTML(tLabel('Protein'))}</li>`).join('');
        log.innerHTML=`<div class="atom-log-head">${escapeHTML(stats.logLine)}</div>${rows?`<ul class="plain-list atom-log-list">${rows}</ul>`:''}`;
    }
    window.activeRecipeNutritionItems=items;
    return stats;
}
function showContent(id){
    const x=getAllContent().find(i=>i.id===id); if(!x)return;
    window.activeRecipeNutritionItems=[];
    const ingredients=x.type==='recipe'&&x.ingredients?.length?`<h3 style="margin-top:20px">${escapeHTML(tLabel('Malzemeler'))}</h3><ul class="ingredient-list">${x.ingredients.map(i=>`<li>${IC('i-check')} ${escapeHTML(i)}</li>`).join('')}</ul><h3 style="margin:20px 0 10px">${escapeHTML(tLabel('Hazırlanışı'))}</h3>`:'';
    const nutrition=x.type==='recipe'&&x.ingredients?.length?recipeNutritionMarkup(x):'';
    document.getElementById('modalSheet').innerHTML=`<button class="modal-close" aria-label="İçeriği kapat" onclick="closeContentModal()"><svg class="ic" aria-hidden="true"><use href="#i-close"></use></svg></button><div class="modal-emoji" style="margin-bottom:12px">${IC(x.type==='recipe'?'i-utensils':'i-news')}</div><div class="eyebrow">${escapeHTML(x.category)} · ${escapeHTML(tLabel(x.type==='recipe'?'Tarif':'Blog'))}</div><h2 id="modalTitle" style="font-size:23px;line-height:1.25;margin:7px 45px 8px 0">${escapeHTML(x.title)}</h2><div class="content-meta"><span>${IC('i-clock')}${escapeHTML(x.time)}</span><span>${escapeHTML(x.date)}</span></div><p class="content-summary" style="font-size:12px;margin:14px 0">${escapeHTML(x.summary)}</p>${ingredients}<div class="article-content">${escapeHTML(x.body)}</div>${nutrition}<p style="margin-top:18px"><a href="${escapeHTML(contentPublicUrl(x)||'#')}" style="color:var(--gold);font-size:12px;font-weight:700;text-decoration:none">${escapeHTML(tLabel('Bu yazının sayfası'))} →</a></p><div style="font-size:10px;color:var(--text-secondary);border-top:1px solid var(--border);margin-top:22px;padding-top:14px">Sağlık içerikleri bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.</div>`;
    document.getElementById('contentModal').classList.add('show'); document.body.style.overflow='hidden';
    updateRecipeNutritionCalculator();
}
function closeContentModal(event){ if(event&&event.target!==document.getElementById('contentModal'))return; document.getElementById('contentModal').classList.remove('show'); document.body.style.overflow=''; window.activeRecipeNutritionItems=[]; }
function openAdmin(){ window.location.href='/admin/'; }
// Pinterest pinlerinin hedef bağlantısı: /?icerik=<id> → ilgili yazıyı modalda açar.
function openSharedContent(id){
    const key=String(id||'').trim();
    if(!/^[\w-]{1,120}$/.test(key)) return false;
    const x=getAllContent().find(i=>i.id===key);
    if(!x) return false;
    showContent(key);
    return true;
}
function toggleRecipeFields(){ document.getElementById('recipeFields').style.display=document.getElementById('adminType').value==='recipe'?'block':'none'; }
async function saveContent(event){
    event.preventDefault(); const type=document.getElementById('adminType').value;
    const item={type,category:document.getElementById('adminCategory').value.trim(),title:document.getElementById('adminTitle').value.trim(),emoji:(document.getElementById('adminEmoji')?.value.trim()||''),time:document.getElementById('adminTime').value.trim(),summary:document.getElementById('adminSummary').value.trim(),body:document.getElementById('adminBody').value.trim()};
    if(type==='recipe')item.ingredients=document.getElementById('adminIngredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
    const response=await fetch('/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)}); const result=await response.json();
    if(!response.ok){showToast(IC('i-warning')+' '+(result.error||'Yayınlanamadı'),'red');return;}
    sharedContent.unshift(result); event.target.reset(); toggleRecipeFields(); renderAdmin(); renderContent(); showToast(IC('i-check')+' İçerik herkese açık olarak yayınlandı','green');
}
async function deleteContent(id){
    if(!confirm('Bu içeriği silmek istediğinize emin misiniz?'))return;
    const response=await fetch('/api/content?id='+encodeURIComponent(id),{method:'DELETE'}); if(!response.ok){showToast('İçerik silinemedi','red');return;}
    sharedContent=sharedContent.filter(x=>x.id!==id); renderAdmin(); renderContent(); showToast('İçerik silindi','red');
}
function renderAdmin(){
    const all=getAllContent(), custom=getCustomContent();
    document.getElementById('statAll').textContent=all.length; document.getElementById('statBlog').textContent=all.filter(x=>x.type==='blog').length; document.getElementById('statRecipe').textContent=all.filter(x=>x.type==='recipe').length;
    document.getElementById('adminContentList').innerHTML=custom.length?custom.map(x=>`<div class="admin-item"><div style="min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${IC(x.type==='recipe'?'i-utensils':'i-news')} ${escapeHTML(x.title)}</div><div class="card-subtitle">${x.type==='recipe'?'Tarif':'Blog'} · ${escapeHTML(x.category)}</div></div><button class="icon-btn" aria-label="Sil" onclick="deleteContent('${escapeHTML(x.id)}')"><svg class="ic" aria-hidden="true"><use href="#i-trash"></use></svg></button></div>`).join(''):'<p class="card-subtitle" style="padding:18px 0">Henüz panelden eklenmiş içerik yok.</p>';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeContentModal()});


// ========================================
// ÇOK DİLLİ ARAYÜZ (TR / EN / DE / JA)
// ========================================
/** Desteklenen diller — sunucudaki api/_langs.js ile aynı olmalı (test doğrular). */
const SUPPORTED_LANGUAGES = [
  { code: 'tr', label: 'TR', name: 'Türkçe' }, { code: 'en', label: 'EN', name: 'English' },
  { code: 'de', label: 'DE', name: 'Deutsch' }, { code: 'ja', label: 'JA', name: '日本語' },
  { code: 'fr', label: 'FR', name: 'Français' }, { code: 'es', label: 'ES', name: 'Español' },
  { code: 'bg', label: 'BG', name: 'Български' }, { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' }, { code: 'zh', label: 'ZH', name: '中文' }
];
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;

const i18n = {
 en: {
  'Ana Sayfa':'Home','Fiziksel':'Physical','Kan Testi':'Blood Test','Blog':'Blog','Hakkımızda':'About',
  'Testosteron Seviyesi İçin Ön Değerlendirme':'Preliminary Testosterone Level Assessment','Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Get an estimate based on your symptoms or review your blood test results. This tool does not provide a medical diagnosis.','Hangi Yöntemi Seçmeliyim?':'Which Method Should I Choose?','İki farklı analiz türü':'Two analysis methods','Fiziksel Analiz':'Physical Analysis','Kan Testi Analizi':'Blood Test Analysis','Semptom bazlı öneri':'Symptom-based recommendations','Bilimsel veri bazlı reçete':'Evidence-based plan','Temel Bilgiler':'Basic Information','Fiziksel verileriniz':'Your physical data','Yaş':'Age','Boy (cm)':'Height (cm)','Kilo (kg)':'Weight (kg)','Aktivite Seviyesi':'Activity Level','Hareketsiz':'Sedentary','Haftada 1-2 gün':'1–2 days a week','Haftada 3-5 gün':'3–5 days a week','Haftada 6-7 gün':'6–7 days a week','ANALİZ BAŞLAT':'START ANALYSIS','KAN ANALİZİ BAŞLAT':'START BLOOD ANALYSIS','Hormon Paneli':'Hormone Panel','Sadece bildiğiniz değerleri girin':'Enter only the values you know','Vitamin & Mineral':'Vitamins & Minerals','Eksiklik tespiti':'Deficiency screening','Neden Doğal Yollar?':'Why Natural Methods?','Bilimsel yaklaşım':'Scientific approach',
  'Blog & Tarifler':'Blog & Recipes','Panel':'Dashboard','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Practical knowledge for a stronger life.','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Evidence-informed health articles and practical recipes for your goals.','Tümü':'All','Blog Yazıları':'Articles','Yemek Tarifleri':'Recipes','Yemek Tarifi':'Recipe','İçerik Paneli':'Content Dashboard','Yerel yönetim':'Local management','Toplam':'Total','Yazı':'Article','Tarif':'Recipe','Yeni içerik ekle':'Add new content','Blog yazısı veya yemek tarifi yayınlayın':'Publish an article or recipe','İçerik türü':'Content type','Blog yazısı':'Article','Kategori':'Category','Başlık':'Title','Emoji':'Emoji','Okuma / hazırlama':'Reading / prep time','Kısa açıklama':'Short description','Malzemeler':'Ingredients','İçerik / hazırlanış':'Content / directions','YAYINLA':'PUBLISH','Yayınlanan içerikler':'Published content','Hazırlanışı':'Directions','Bu yazının sayfası':'Open the full page',
  'Misyonumuz':'Our Mission','Ne yapıyoruz?':'What do we do?','Bilimsel Kaynaklar':'Scientific Sources','Araştırma & Referanslar':'Research & References','Ekip':'Team','Geliştirici':'Developer','Kurucu & Geliştirici':'Founder & Developer','Tıbbi Sorumluluk Reddi':'Medical Disclaimer','Lütfen dikkatle okuyun':'Please read carefully','Gizlilik & Veri Güvenliği':'Privacy & Data Security','%100 güvenli':'100% secure','Önemli Uyarılar':'Important Warnings','BAŞA DÖN':'BACK TO TOP','Malzemeler':'Ingredients','Hazırlanışı':'Preparation'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Symptom-Based Preliminary Assessment Report',
  'Kan Testi Değerlendirme Raporu':'Blood Test Assessment Report',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Data was processed only in this browser and was never sent to a server.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'This report is for information only; it does not replace a medical assessment, diagnosis or prescription. Share the results with a doctor.',
  'Raporu yazdır / PDF kaydet':'Print report / save as PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · choose “Save as PDF” in the print dialog. Your data never leaves your device.',
  'Yazdırmak için önce raporu oluşturun.':'Create the report first to print it.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'This browser does not support printing.'},
 de: {
  'Ana Sayfa':'Startseite','Fiziksel':'Körper','Kan Testi':'Bluttest','Blog':'Blog','Hakkımızda':'Über uns','Testosteron Seviyesi İçin Ön Değerlendirme':'Vorläufige Einschätzung des Testosteronspiegels','Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Erhalten Sie anhand Ihrer Symptome eine grobe Einschätzung oder prüfen Sie Ihre Blutwerte. Dieses Tool stellt keine medizinische Diagnose.','Hangi Yöntemi Seçmeliyim?':'Welche Methode soll ich wählen?','İki farklı analiz türü':'Zwei Analysemethoden','Fiziksel Analiz':'Körperanalyse','Kan Testi Analizi':'Bluttestanalyse','Semptom bazlı öneri':'Symptombasierte Empfehlungen','Bilimsel veri bazlı reçete':'Wissenschaftlich fundierter Plan','Temel Bilgiler':'Grunddaten','Fiziksel verileriniz':'Ihre Körperdaten','Yaş':'Alter','Boy (cm)':'Größe (cm)','Kilo (kg)':'Gewicht (kg)','Aktivite Seviyesi':'Aktivitätsniveau','Hareketsiz':'Inaktiv','Haftada 1-2 gün':'1–2 Tage pro Woche','Haftada 3-5 gün':'3–5 Tage pro Woche','Haftada 6-7 gün':'6–7 Tage pro Woche','ANALİZ BAŞLAT':'ANALYSE STARTEN','KAN ANALİZİ BAŞLAT':'BLUTANALYSE STARTEN','Hormon Paneli':'Hormonprofil','Sadece bildiğiniz değerleri girin':'Nur bekannte Werte eingeben','Vitamin & Mineral':'Vitamine & Mineralstoffe','Eksiklik tespiti':'Mangel-Screening','Neden Doğal Yollar?':'Warum natürliche Methoden?','Bilimsel yaklaşım':'Wissenschaftlicher Ansatz',
  'Blog & Tarifler':'Blog & Rezepte','Panel':'Dashboard','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Praktisches Wissen für ein stärkeres Leben.','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Wissenschaftliche Gesundheitsartikel und praktische Rezepte für Ihre Ziele.','Tümü':'Alle','Blog Yazıları':'Artikel','Yemek Tarifleri':'Rezepte','Yemek Tarifi':'Rezept','İçerik Paneli':'Inhaltsverwaltung','Yerel yönetim':'Lokale Verwaltung','Toplam':'Gesamt','Yazı':'Artikel','Tarif':'Rezept','Yeni içerik ekle':'Neuen Inhalt hinzufügen','Blog yazısı veya yemek tarifi yayınlayın':'Artikel oder Rezept veröffentlichen','İçerik türü':'Inhaltstyp','Blog yazısı':'Artikel','Kategori':'Kategorie','Başlık':'Titel','Emoji':'Emoji','Okuma / hazırlama':'Lese-/Zubereitungszeit','Kısa açıklama':'Kurzbeschreibung','Malzemeler':'Zutaten','İçerik / hazırlanış':'Inhalt / Zubereitung','YAYINLA':'VERÖFFENTLICHEN','Yayınlanan içerikler':'Veröffentlichte Inhalte','Hazırlanışı':'Zubereitung','Bu yazının sayfası':'Zur vollständigen Seite',
  'Misyonumuz':'Unsere Mission','Ne yapıyoruz?':'Was tun wir?','Bilimsel Kaynaklar':'Wissenschaftliche Quellen','Araştırma & Referanslar':'Forschung & Referenzen','Ekip':'Team','Geliştirici':'Entwickler','Kurucu & Geliştirici':'Gründer & Entwickler','Tıbbi Sorumluluk Reddi':'Medizinischer Haftungsausschluss','Lütfen dikkatle okuyun':'Bitte sorgfältig lesen','Gizlilik & Veri Güvenliği':'Datenschutz & Datensicherheit','%100 güvenli':'100 % sicher','Önemli Uyarılar':'Wichtige Hinweise','BAŞA DÖN':'NACH OBEN','Malzemeler':'Zutaten','Hazırlanışı':'Zubereitung'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Vorläufiger Bericht auf Basis der Symptome',
  'Kan Testi Değerlendirme Raporu':'Auswertungsbericht zum Bluttest',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Die Daten wurden ausschließlich in diesem Browser verarbeitet und nicht an einen Server gesendet.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'Dieser Bericht dient nur der Information; er ersetzt keine ärztliche Beurteilung, Diagnose oder Verordnung. Teilen Sie die Ergebnisse mit einer Ärztin oder einem Arzt.',
  'Raporu yazdır / PDF kaydet':'Bericht drucken / als PDF speichern',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · wählen Sie im Druckdialog „Als PDF speichern“. Ihre Daten verlassen das Gerät nicht.',
  'Yazdırmak için önce raporu oluşturun.':'Erstellen Sie zuerst den Bericht, um ihn zu drucken.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'Dieser Browser unterstützt das Drucken nicht.'},
 ja: {
  'Ana Sayfa':'ホーム','Fiziksel':'身体分析','Kan Testi':'血液検査','Blog':'ブログ','Hakkımızda':'概要','Testosteron Seviyesi İçin Ön Değerlendirme':'テストステロン値の事前評価','Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'症状に基づく目安を確認するか、血液検査結果を入力してください。このツールは医学的診断を行いません。','Hangi Yöntemi Seçmeliyim?':'どの方法を選びますか？','İki farklı analiz türü':'2種類の分析方法','Fiziksel Analiz':'身体分析','Kan Testi Analizi':'血液検査分析','Semptom bazlı öneri':'症状に基づく提案','Bilimsel veri bazlı reçete':'科学的根拠に基づくプラン','Temel Bilgiler':'基本情報','Fiziksel verileriniz':'身体データ','Yaş':'年齢','Boy (cm)':'身長 (cm)','Kilo (kg)':'体重 (kg)','Aktivite Seviyesi':'活動レベル','Hareketsiz':'運動なし','Haftada 1-2 gün':'週1〜2日','Haftada 3-5 gün':'週3〜5日','Haftada 6-7 gün':'週6〜7日','ANALİZ BAŞLAT':'分析を開始','KAN ANALİZİ BAŞLAT':'血液分析を開始','Hormon Paneli':'ホルモンパネル','Sadece bildiğiniz değerleri girin':'分かる数値だけ入力してください','Vitamin & Mineral':'ビタミン・ミネラル','Eksiklik tespiti':'不足の確認','Neden Doğal Yollar?':'なぜ自然な方法？','Bilimsel yaklaşım':'科学的アプローチ',
  'Blog & Tarifler':'ブログ・レシピ','Panel':'管理画面','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'より健やかな生活のための実践的な知識。','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'科学的な健康記事と目標に合った実用的なレシピ。','Tümü':'すべて','Blog Yazıları':'記事','Yemek Tarifleri':'レシピ','Yemek Tarifi':'レシピ','İçerik Paneli':'コンテンツ管理','Yerel yönetim':'ローカル管理','Toplam':'合計','Yazı':'記事','Tarif':'レシピ','Yeni içerik ekle':'新しいコンテンツ','Blog yazısı veya yemek tarifi yayınlayın':'記事またはレシピを公開','İçerik türü':'コンテンツ種類','Blog yazısı':'記事','Kategori':'カテゴリー','Başlık':'タイトル','Emoji':'絵文字','Okuma / hazırlama':'読了・調理時間','Kısa açıklama':'短い説明','Malzemeler':'材料','İçerik / hazırlanış':'本文・作り方','YAYINLA':'公開する','Yayınlanan içerikler':'公開済みコンテンツ','Hazırlanışı':'作り方','Bu yazının sayfası':'記事ページを開く',
  'Misyonumuz':'私たちの使命','Ne yapıyoruz?':'活動内容','Bilimsel Kaynaklar':'科学的資料','Araştırma & Referanslar':'研究・参考文献','Ekip':'チーム','Geliştirici':'開発者','Kurucu & Geliştirici':'創設者・開発者','Tıbbi Sorumluluk Reddi':'医療免責事項','Lütfen dikkatle okuyun':'よくお読みください','Gizlilik & Veri Güvenliği':'プライバシー・データ保護','%100 güvenli':'100%安全','Önemli Uyarılar':'重要な注意事項','BAŞA DÖN':'ページ上部へ','Malzemeler':'材料','Hazırlanışı':'作り方'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'症状に基づく事前評価レポート',
  'Kan Testi Değerlendirme Raporu':'血液検査評価レポート',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'データはこのブラウザ内でのみ処理され、サーバーには送信されていません。',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'このレポートは情報提供のみを目的としており、医師による評価、診断、処方の代わりにはなりません。結果は医師と共有してください。',
  'Raporu yazdır / PDF kaydet':'レポートを印刷 / PDFで保存',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · 印刷ダイアログで「PDFに保存」を選択できます。データが端末の外に出ることはありません。',
  'Yazdırmak için önce raporu oluşturun.':'印刷するには、先にレポートを作成してください。',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'このブラウザは印刷に対応していません。'},
 fr: {
  'Ana Sayfa':'Accueil', 'Fiziksel':'Physique', 'Kan Testi':'Analyse sanguine', 'Blog':'Blog',
  'Hakkımızda':'À propos', 'Testosteron Seviyesi İçin Ön Değerlendirme':'Évaluation préliminaire du taux de testostérone', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Obtenez une estimation selon vos symptômes ou analysez vos résultats sanguins. Cet outil ne pose pas de diagnostic médical.', 'Hangi Yöntemi Seçmeliyim?':'Quelle méthode choisir ?',
  'İki farklı analiz türü':'Deux types d analyse', 'Fiziksel Analiz':'Analyse physique', 'Kan Testi Analizi':'Analyse sanguine', 'Semptom bazlı öneri':'Recommandations selon les symptômes',
  'Bilimsel veri bazlı reçete':'Plan fondé sur les données scientifiques', 'Temel Bilgiler':'Informations de base', 'Fiziksel verileriniz':'Vos données physiques', 'Yaş':'Âge',
  'Boy (cm)':'Taille (cm)', 'Kilo (kg)':'Poids (kg)', 'Aktivite Seviyesi':'Niveau d activité', 'Hareketsiz':'Sédentaire',
  'Haftada 1-2 gün':'1 à 2 jours par semaine', 'Haftada 3-5 gün':'3 à 5 jours par semaine', 'Haftada 6-7 gün':'6 à 7 jours par semaine', 'ANALİZ BAŞLAT':'LANCER L ANALYSE',
  'KAN ANALİZİ BAŞLAT':'LANCER L ANALYSE SANGUINE', 'Hormon Paneli':'Bilan hormonal', 'Sadece bildiğiniz değerleri girin':'Saisissez uniquement les valeurs connues', 'Vitamin & Mineral':'Vitamines et minéraux',
  'Eksiklik tespiti':'Détection des carences', 'Neden Doğal Yollar?':'Pourquoi les méthodes naturelles ?', 'Bilimsel yaklaşım':'Approche scientifique', 'Blog & Tarifler':'Blog et recettes',
  'Panel':'Tableau de bord', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Des informations concrètes pour une vie plus forte.', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Des articles de santé fondés sur la science et des recettes pratiques adaptées à vos objectifs.', 'Tümü':'Tout',
  'Blog Yazıları':'Articles', 'Yemek Tarifleri':'Recettes', 'Yemek Tarifi':'Recette', 'İçerik Paneli':'Panneau de contenu',
  'Yerel yönetim':'Gestion locale', 'Toplam':'Total', 'Yazı':'Article', 'Tarif':'Recette',
  'Yeni içerik ekle':'Ajouter du contenu', 'Blog yazısı veya yemek tarifi yayınlayın':'Publiez un article ou une recette', 'İçerik türü':'Type de contenu', 'Blog yazısı':'Article',
  'Kategori':'Catégorie', 'Başlık':'Titre', 'Emoji':'Emoji', 'Okuma / hazırlama':'Lecture / préparation',
  'Kısa açıklama':'Description courte', 'Malzemeler':'Ingrédients', 'İçerik / hazırlanış':'Contenu / préparation', 'YAYINLA':'PUBLIER',
  'Yayınlanan içerikler':'Contenus publiés', 'Hazırlanışı':'Préparation', 'Bu yazının sayfası':'Ouvrir la page complète', 'Misyonumuz':'Notre mission',
  'Ne yapıyoruz?':'Que faisons-nous ?', 'Bilimsel Kaynaklar':'Sources scientifiques', 'Araştırma & Referanslar':'Recherche et références', 'Ekip':'Équipe',
  'Geliştirici':'Développeur', 'Kurucu & Geliştirici':'Fondateur et développeur', 'Tıbbi Sorumluluk Reddi':'Avertissement médical', 'Lütfen dikkatle okuyun':'À lire attentivement',
  'Gizlilik & Veri Güvenliği':'Confidentialité et sécurité des données', '%100 güvenli':'100 % sécurisé', 'Önemli Uyarılar':'Avertissements importants', 'BAŞA DÖN':'RETOUR EN HAUT'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Rapport préliminaire fondé sur les symptômes',
  'Kan Testi Değerlendirme Raporu':'Rapport d\'évaluation des analyses de sang',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Les données ont été traitées uniquement dans ce navigateur et n\'ont jamais été envoyées à un serveur.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'Ce rapport est informatif ; il ne remplace ni l\'évaluation médicale, ni le diagnostic, ni l\'ordonnance. Partagez les résultats avec un médecin.',
  'Raporu yazdır / PDF kaydet':'Imprimer le rapport / enregistrer en PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · choisissez « Enregistrer au format PDF » dans la fenêtre d\'impression. Vos données ne quittent pas votre appareil.',
  'Yazdırmak için önce raporu oluşturun.':'Créez d\'abord le rapport pour l\'imprimer.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'Ce navigateur ne prend pas en charge l\'impression.'},
 es: {
  'Ana Sayfa':'Inicio', 'Fiziksel':'Físico', 'Kan Testi':'Análisis de sangre', 'Blog':'Blog',
  'Hakkımızda':'Sobre nosotros', 'Testosteron Seviyesi İçin Ön Değerlendirme':'Evaluación preliminar del nivel de testosterona', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Obtén una estimación según tus síntomas o revisa tus resultados de sangre. Esta herramienta no emite un diagnóstico médico.', 'Hangi Yöntemi Seçmeliyim?':'¿Qué método elegir?',
  'İki farklı analiz türü':'Dos tipos de análisis', 'Fiziksel Analiz':'Análisis físico', 'Kan Testi Analizi':'Análisis de sangre', 'Semptom bazlı öneri':'Recomendaciones según síntomas',
  'Bilimsel veri bazlı reçete':'Plan basado en datos científicos', 'Temel Bilgiler':'Datos básicos', 'Fiziksel verileriniz':'Tus datos físicos', 'Yaş':'Edad',
  'Boy (cm)':'Altura (cm)', 'Kilo (kg)':'Peso (kg)', 'Aktivite Seviyesi':'Nivel de actividad', 'Hareketsiz':'Sedentario',
  'Haftada 1-2 gün':'1-2 días por semana', 'Haftada 3-5 gün':'3-5 días por semana', 'Haftada 6-7 gün':'6-7 días por semana', 'ANALİZ BAŞLAT':'INICIAR ANÁLISIS',
  'KAN ANALİZİ BAŞLAT':'INICIAR ANÁLISIS DE SANGRE', 'Hormon Paneli':'Perfil hormonal', 'Sadece bildiğiniz değerleri girin':'Introduce solo los valores que conozcas', 'Vitamin & Mineral':'Vitaminas y minerales',
  'Eksiklik tespiti':'Detección de carencias', 'Neden Doğal Yollar?':'¿Por qué métodos naturales?', 'Bilimsel yaklaşım':'Enfoque científico', 'Blog & Tarifler':'Blog y recetas',
  'Panel':'Panel', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Información práctica para una vida más fuerte.', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Artículos de salud basados en ciencia y recetas prácticas para tus objetivos.', 'Tümü':'Todo',
  'Blog Yazıları':'Artículos', 'Yemek Tarifleri':'Recetas', 'Yemek Tarifi':'Receta', 'İçerik Paneli':'Panel de contenido',
  'Yerel yönetim':'Gestión local', 'Toplam':'Total', 'Yazı':'Artículo', 'Tarif':'Receta',
  'Yeni içerik ekle':'Añadir contenido', 'Blog yazısı veya yemek tarifi yayınlayın':'Publica un artículo o una receta', 'İçerik türü':'Tipo de contenido', 'Blog yazısı':'Artículo',
  'Kategori':'Categoría', 'Başlık':'Título', 'Emoji':'Emoji', 'Okuma / hazırlama':'Lectura / preparación',
  'Kısa açıklama':'Descripción breve', 'Malzemeler':'Ingredientes', 'İçerik / hazırlanış':'Contenido / preparación', 'YAYINLA':'PUBLICAR',
  'Yayınlanan içerikler':'Contenidos publicados', 'Hazırlanışı':'Preparación', 'Bu yazının sayfası':'Abrir la página completa', 'Misyonumuz':'Nuestra misión',
  'Ne yapıyoruz?':'¿Qué hacemos?', 'Bilimsel Kaynaklar':'Fuentes científicas', 'Araştırma & Referanslar':'Investigación y referencias', 'Ekip':'Equipo',
  'Geliştirici':'Desarrollador', 'Kurucu & Geliştirici':'Fundador y desarrollador', 'Tıbbi Sorumluluk Reddi':'Aviso médico', 'Lütfen dikkatle okuyun':'Lee con atención',
  'Gizlilik & Veri Güvenliği':'Privacidad y seguridad de datos', '%100 güvenli':'100 % seguro', 'Önemli Uyarılar':'Avisos importantes', 'BAŞA DÖN':'VOLVER ARRIBA'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Informe preliminar basado en los síntomas',
  'Kan Testi Değerlendirme Raporu':'Informe de evaluación del análisis de sangre',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Los datos se procesaron solo en este navegador y nunca se enviaron a un servidor.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'Este informe es solo informativo; no sustituye la valoración médica, el diagnóstico ni la receta. Comparta los resultados con un médico.',
  'Raporu yazdır / PDF kaydet':'Imprimir informe / guardar como PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · elija «Guardar como PDF» en el cuadro de impresión. Sus datos no salen del dispositivo.',
  'Yazdırmak için önce raporu oluşturun.':'Cree primero el informe para poder imprimirlo.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'Este navegador no admite la impresión.'},
 bg: {
  'Ana Sayfa':'Начало', 'Fiziksel':'Физически', 'Kan Testi':'Кръвен тест', 'Blog':'Блог',
  'Hakkımızda':'За нас', 'Testosteron Seviyesi İçin Ön Değerlendirme':'Предварителна оценка на нивото на тестостерон', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Получете приблизителна оценка по симптомите си или прегледайте кръвните си резултати. Този инструмент не поставя медицинска диагноза.', 'Hangi Yöntemi Seçmeliyim?':'Кой метод да избера?',
  'İki farklı analiz türü':'Два вида анализ', 'Fiziksel Analiz':'Физически анализ', 'Kan Testi Analizi':'Анализ на кръвен тест', 'Semptom bazlı öneri':'Препоръки по симптоми',
  'Bilimsel veri bazlı reçete':'План, базиран на научни данни', 'Temel Bilgiler':'Основни данни', 'Fiziksel verileriniz':'Вашите физически данни', 'Yaş':'Възраст',
  'Boy (cm)':'Ръст (см)', 'Kilo (kg)':'Тегло (кг)', 'Aktivite Seviyesi':'Ниво на активност', 'Hareketsiz':'Заседнал',
  'Haftada 1-2 gün':'1-2 дни седмично', 'Haftada 3-5 gün':'3-5 дни седмично', 'Haftada 6-7 gün':'6-7 дни седмично', 'ANALİZ BAŞLAT':'СТАРТИРАЙ АНАЛИЗ',
  'KAN ANALİZİ BAŞLAT':'СТАРТИРАЙ КРЪВЕН АНАЛИЗ', 'Hormon Paneli':'Хормонален панел', 'Sadece bildiğiniz değerleri girin':'Въведете само известните стойности', 'Vitamin & Mineral':'Витамини и минерали',
  'Eksiklik tespiti':'Откриване на дефицит', 'Neden Doğal Yollar?':'Защо естествени методи?', 'Bilimsel yaklaşım':'Научен подход', 'Blog & Tarifler':'Блог и рецепти',
  'Panel':'Панел', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Практична информация за по-силен живот.', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Научно обосновани здравни статии и практични рецепти за вашите цели.', 'Tümü':'Всички',
  'Blog Yazıları':'Статии', 'Yemek Tarifleri':'Рецепти', 'Yemek Tarifi':'Рецепта', 'İçerik Paneli':'Панел за съдържание',
  'Yerel yönetim':'Локално управление', 'Toplam':'Общо', 'Yazı':'Статия', 'Tarif':'Рецепта',
  'Yeni içerik ekle':'Добави съдържание', 'Blog yazısı veya yemek tarifi yayınlayın':'Публикувайте статия или рецепта', 'İçerik türü':'Вид съдържание', 'Blog yazısı':'Статия',
  'Kategori':'Категория', 'Başlık':'Заглавие', 'Emoji':'Емоджи', 'Okuma / hazırlama':'Четене / приготвяне',
  'Kısa açıklama':'Кратко описание', 'Malzemeler':'Съставки', 'İçerik / hazırlanış':'Съдържание / приготвяне', 'YAYINLA':'ПУБЛИКУВАЙ',
  'Yayınlanan içerikler':'Публикувано съдържание', 'Hazırlanışı':'Приготвяне', 'Bu yazının sayfası':'Отвори пълната страница', 'Misyonumuz':'Нашата мисия',
  'Ne yapıyoruz?':'Какво правим?', 'Bilimsel Kaynaklar':'Научни източници', 'Araştırma & Referanslar':'Изследвания и препратки', 'Ekip':'Екип',
  'Geliştirici':'Разработчик', 'Kurucu & Geliştirici':'Основател и разработчик', 'Tıbbi Sorumluluk Reddi':'Отказ от медицинска отговорност', 'Lütfen dikkatle okuyun':'Прочетете внимателно',
  'Gizlilik & Veri Güvenliği':'Поверителност и сигурност на данните', '%100 güvenli':'100% сигурно', 'Önemli Uyarılar':'Важни предупреждения', 'BAŞA DÖN':'НАГОРЕ'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Предварителен доклад въз основа на симптомите',
  'Kan Testi Değerlendirme Raporu':'Доклад от оценка на кръвния тест',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Данните са обработени само в този браузър и не са изпращани към сървър.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'Този доклад е само с информационна цел; не замества лекарска оценка, диагноза или рецепта. Споделете резултатите с лекар.',
  'Raporu yazdır / PDF kaydet':'Печат на доклада / запазване като PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · изберете „Запазване като PDF“ в прозореца за печат. Данните не напускат устройството ви.',
  'Yazdırmak için önce raporu oluşturun.':'Първо създайте доклада, за да го отпечатате.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'Този браузър не поддържа печат.'},
 ru: {
  'Ana Sayfa':'Главная', 'Fiziksel':'Физический', 'Kan Testi':'Анализ крови', 'Blog':'Блог',
  'Hakkımızda':'О нас', 'Testosteron Seviyesi İçin Ön Değerlendirme':'Предварительная оценка уровня тестостерона', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'Получите ориентировочную оценку по симптомам или изучите результаты анализа крови. Инструмент не ставит медицинский диагноз.', 'Hangi Yöntemi Seçmeliyim?':'Какой метод выбрать?',
  'İki farklı analiz türü':'Два типа анализа', 'Fiziksel Analiz':'Физический анализ', 'Kan Testi Analizi':'Анализ крови', 'Semptom bazlı öneri':'Рекомендации по симптомам',
  'Bilimsel veri bazlı reçete':'План на основе научных данных', 'Temel Bilgiler':'Основные данные', 'Fiziksel verileriniz':'Ваши физические данные', 'Yaş':'Возраст',
  'Boy (cm)':'Рост (см)', 'Kilo (kg)':'Вес (кг)', 'Aktivite Seviyesi':'Уровень активности', 'Hareketsiz':'Сидячий',
  'Haftada 1-2 gün':'1–2 дня в неделю', 'Haftada 3-5 gün':'3–5 дней в неделю', 'Haftada 6-7 gün':'6–7 дней в неделю', 'ANALİZ BAŞLAT':'НАЧАТЬ АНАЛИЗ',
  'KAN ANALİZİ BAŞLAT':'НАЧАТЬ АНАЛИЗ КРОВИ', 'Hormon Paneli':'Гормональная панель', 'Sadece bildiğiniz değerleri girin':'Введите только известные значения', 'Vitamin & Mineral':'Витамины и минералы',
  'Eksiklik tespiti':'Выявление дефицита', 'Neden Doğal Yollar?':'Почему естественные методы?', 'Bilimsel yaklaşım':'Научный подход', 'Blog & Tarifler':'Блог и рецепты',
  'Panel':'Панель', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Практические знания для более сильной жизни.', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Научные статьи о здоровье и практичные рецепты под ваши цели.', 'Tümü':'Все',
  'Blog Yazıları':'Статьи', 'Yemek Tarifleri':'Рецепты', 'Yemek Tarifi':'Рецепт', 'İçerik Paneli':'Панель контента',
  'Yerel yönetim':'Локальное управление', 'Toplam':'Всего', 'Yazı':'Статья', 'Tarif':'Рецепт',
  'Yeni içerik ekle':'Добавить материал', 'Blog yazısı veya yemek tarifi yayınlayın':'Опубликуйте статью или рецепт', 'İçerik türü':'Тип материала', 'Blog yazısı':'Статья',
  'Kategori':'Категория', 'Başlık':'Заголовок', 'Emoji':'Эмодзи', 'Okuma / hazırlama':'Чтение / приготовление',
  'Kısa açıklama':'Краткое описание', 'Malzemeler':'Ингредиенты', 'İçerik / hazırlanış':'Содержание / приготовление', 'YAYINLA':'ОПУБЛИКОВАТЬ',
  'Yayınlanan içerikler':'Опубликованные материалы', 'Hazırlanışı':'Приготовление', 'Bu yazının sayfası':'Открыть полную страницу', 'Misyonumuz':'Наша миссия',
  'Ne yapıyoruz?':'Что мы делаем?', 'Bilimsel Kaynaklar':'Научные источники', 'Araştırma & Referanslar':'Исследования и ссылки', 'Ekip':'Команда',
  'Geliştirici':'Разработчик', 'Kurucu & Geliştirici':'Основатель и разработчик', 'Tıbbi Sorumluluk Reddi':'Медицинская оговорка', 'Lütfen dikkatle okuyun':'Прочитайте внимательно',
  'Gizlilik & Veri Güvenliği':'Конфиденциальность и безопасность данных', '%100 güvenli':'100% безопасно', 'Önemli Uyarılar':'Важные предупреждения', 'BAŞA DÖN':'НАВЕРХ'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'Предварительный отчёт на основе симптомов',
  'Kan Testi Değerlendirme Raporu':'Отчёт оценки анализа крови',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'Данные обработаны только в этом браузере и не отправлялись на сервер.',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'Этот отчёт носит информационный характер; он не заменяет врачебную оценку, диагноз или рецепт. Поделитесь результатами с врачом.',
  'Raporu yazdır / PDF kaydet':'Печать отчёта / сохранить в PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · выберите «Сохранить в PDF» в окне печати. Ваши данные не покидают устройство.',
  'Yazdırmak için önce raporu oluşturun.':'Сначала создайте отчёт, чтобы распечатать его.',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'Этот браузер не поддерживает печать.'},
 hi: {
  'Ana Sayfa':'होम', 'Fiziksel':'शारीरिक', 'Kan Testi':'रक्त परीक्षण', 'Blog':'ब्लॉग',
  'Hakkımızda':'हमारे बारे में', 'Testosteron Seviyesi İçin Ön Değerlendirme':'टेस्टोस्टेरोन स्तर का प्रारंभिक आकलन', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'अपने लक्षणों के आधार पर अनुमान लगाएँ या रक्त परीक्षण के परिणाम देखें। यह उपकरण चिकित्सकीय निदान नहीं करता।', 'Hangi Yöntemi Seçmeliyim?':'कौन-सा तरीका चुनूँ?',
  'İki farklı analiz türü':'दो प्रकार के विश्लेषण', 'Fiziksel Analiz':'शारीरिक विश्लेषण', 'Kan Testi Analizi':'रक्त परीक्षण विश्लेषण', 'Semptom bazlı öneri':'लक्षण आधारित सुझाव',
  'Bilimsel veri bazlı reçete':'वैज्ञानिक आँकड़ों पर आधारित योजना', 'Temel Bilgiler':'मूल जानकारी', 'Fiziksel verileriniz':'आपका शारीरिक डेटा', 'Yaş':'उम्र',
  'Boy (cm)':'लंबाई (सेमी)', 'Kilo (kg)':'वज़न (किग्रा)', 'Aktivite Seviyesi':'गतिविधि स्तर', 'Hareketsiz':'निष्क्रिय',
  'Haftada 1-2 gün':'सप्ताह में 1-2 दिन', 'Haftada 3-5 gün':'सप्ताह में 3-5 दिन', 'Haftada 6-7 gün':'सप्ताह में 6-7 दिन', 'ANALİZ BAŞLAT':'विश्लेषण शुरू करें',
  'KAN ANALİZİ BAŞLAT':'रक्त विश्लेषण शुरू करें', 'Hormon Paneli':'हार्मोन पैनल', 'Sadece bildiğiniz değerleri girin':'केवल ज्ञात मान दर्ज करें', 'Vitamin & Mineral':'विटामिन और खनिज',
  'Eksiklik tespiti':'कमी की पहचान', 'Neden Doğal Yollar?':'प्राकृतिक तरीके क्यों?', 'Bilimsel yaklaşım':'वैज्ञानिक दृष्टिकोण', 'Blog & Tarifler':'ब्लॉग और रेसिपी',
  'Panel':'पैनल', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'अधिक मज़बूत जीवन के लिए व्यावहारिक जानकारी।', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'वैज्ञानिक स्वास्थ्य लेख और आपके लक्ष्यों के अनुसार व्यावहारिक रेसिपी।', 'Tümü':'सभी',
  'Blog Yazıları':'लेख', 'Yemek Tarifleri':'रेसिपी', 'Yemek Tarifi':'रेसिपी', 'İçerik Paneli':'सामग्री पैनल',
  'Yerel yönetim':'स्थानीय प्रबंधन', 'Toplam':'कुल', 'Yazı':'लेख', 'Tarif':'रेसिपी',
  'Yeni içerik ekle':'सामग्री जोड़ें', 'Blog yazısı veya yemek tarifi yayınlayın':'लेख या रेसिपी प्रकाशित करें', 'İçerik türü':'सामग्री प्रकार', 'Blog yazısı':'लेख',
  'Kategori':'श्रेणी', 'Başlık':'शीर्षक', 'Emoji':'इमोजी', 'Okuma / hazırlama':'पढ़ने / बनाने का समय',
  'Kısa açıklama':'संक्षिप्त विवरण', 'Malzemeler':'सामग्री', 'İçerik / hazırlanış':'सामग्री / बनाने की विधि', 'YAYINLA':'प्रकाशित करें',
  'Yayınlanan içerikler':'प्रकाशित सामग्री', 'Hazırlanışı':'बनाने की विधि', 'Bu yazının sayfası':'पूरा पृष्ठ खोलें', 'Misyonumuz':'हमारा लक्ष्य',
  'Ne yapıyoruz?':'हम क्या करते हैं?', 'Bilimsel Kaynaklar':'वैज्ञानिक स्रोत', 'Araştırma & Referanslar':'अनुसंधान और संदर्भ', 'Ekip':'टीम',
  'Geliştirici':'डेवलपर', 'Kurucu & Geliştirici':'संस्थापक और डेवलपर', 'Tıbbi Sorumluluk Reddi':'चिकित्सकीय अस्वीकरण', 'Lütfen dikkatle okuyun':'कृपया ध्यान से पढ़ें',
  'Gizlilik & Veri Güvenliği':'गोपनीयता और डेटा सुरक्षा', '%100 güvenli':'100% सुरक्षित', 'Önemli Uyarılar':'महत्वपूर्ण चेतावनी', 'BAŞA DÖN':'ऊपर जाएँ'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'लक्षणों पर आधारित प्रारंभिक मूल्यांकन रिपोर्ट',
  'Kan Testi Değerlendirme Raporu':'रक्त परीक्षण मूल्यांकन रिपोर्ट',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'डेटा केवल इस ब्राउज़र में संसाधित किया गया और सर्वर पर नहीं भेजा गया।',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'यह रिपोर्ट केवल जानकारी के लिए है; यह चिकित्सकीय मूल्यांकन, निदान या पर्चे का विकल्प नहीं है। परिणाम किसी चिकित्सक के साथ साझा करें।',
  'Raporu yazdır / PDF kaydet':'रिपोर्ट प्रिंट करें / PDF में सहेजें',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · प्रिंट विंडो में “PDF में सहेजें” चुनें। आपका डेटा डिवाइस से बाहर नहीं जाता।',
  'Yazdırmak için önce raporu oluşturun.':'प्रिंट करने के लिए पहले रिपोर्ट बनाएँ।',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'यह ब्राउज़र प्रिंटिंग का समर्थन नहीं करता।'},
 zh: {
  'Ana Sayfa':'首页', 'Fiziksel':'身体分析', 'Kan Testi':'血液检查', 'Blog':'博客',
  'Hakkımızda':'关于我们', 'Testosteron Seviyesi İçin Ön Değerlendirme':'睾酮水平初步评估', 'Belirtilerinize göre yaklaşık bir değerlendirme yapın veya kan testi sonuçlarınızı inceleyin. Bu araç tıbbi tanı koymaz.':'根据症状获得粗略评估，或查看血液检查结果。本工具不作出医学诊断。', 'Hangi Yöntemi Seçmeliyim?':'该选哪种方式？',
  'İki farklı analiz türü':'两种分析方式', 'Fiziksel Analiz':'身体分析', 'Kan Testi Analizi':'血液检查分析', 'Semptom bazlı öneri':'基于症状的建议',
  'Bilimsel veri bazlı reçete':'基于科学数据的方案', 'Temel Bilgiler':'基本信息', 'Fiziksel verileriniz':'你的身体数据', 'Yaş':'年龄',
  'Boy (cm)':'身高（厘米）', 'Kilo (kg)':'体重（公斤）', 'Aktivite Seviyesi':'活动水平', 'Hareketsiz':'久坐',
  'Haftada 1-2 gün':'每周 1–2 天', 'Haftada 3-5 gün':'每周 3–5 天', 'Haftada 6-7 gün':'每周 6–7 天', 'ANALİZ BAŞLAT':'开始分析',
  'KAN ANALİZİ BAŞLAT':'开始血液分析', 'Hormon Paneli':'激素面板', 'Sadece bildiğiniz değerleri girin':'仅填写已知数值', 'Vitamin & Mineral':'维生素与矿物质',
  'Eksiklik tespiti':'缺乏筛查', 'Neden Doğal Yollar?':'为什么选择自然方法？', 'Bilimsel yaklaşım':'科学方法', 'Blog & Tarifler':'博客与食谱',
  'Panel':'面板', 'Daha güçlü bir yaşam için uygulanabilir bilgiler.':'让生活更强健的实用信息。', 'Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'有科学依据的健康文章，以及适合你目标的实用食谱。', 'Tümü':'全部',
  'Blog Yazıları':'文章', 'Yemek Tarifleri':'食谱', 'Yemek Tarifi':'食谱', 'İçerik Paneli':'内容面板',
  'Yerel yönetim':'本地管理', 'Toplam':'总计', 'Yazı':'文章', 'Tarif':'食谱',
  'Yeni içerik ekle':'添加内容', 'Blog yazısı veya yemek tarifi yayınlayın':'发布文章或食谱', 'İçerik türü':'内容类型', 'Blog yazısı':'文章',
  'Kategori':'分类', 'Başlık':'标题', 'Emoji':'表情符号', 'Okuma / hazırlama':'阅读 / 准备时间',
  'Kısa açıklama':'简短说明', 'Malzemeler':'食材', 'İçerik / hazırlanış':'内容 / 做法', 'YAYINLA':'发布',
  'Yayınlanan içerikler':'已发布内容', 'Hazırlanışı':'做法', 'Bu yazının sayfası':'打开完整页面', 'Misyonumuz':'我们的使命',
  'Ne yapıyoruz?':'我们做什么？', 'Bilimsel Kaynaklar':'科学来源', 'Araştırma & Referanslar':'研究与参考', 'Ekip':'团队',
  'Geliştirici':'开发者', 'Kurucu & Geliştirici':'创始人兼开发者', 'Tıbbi Sorumluluk Reddi':'医疗免责声明', 'Lütfen dikkatle okuyun':'请仔细阅读',
  'Gizlilik & Veri Güvenliği':'隐私与数据安全', '%100 güvenli':'100% 安全', 'Önemli Uyarılar':'重要提示', 'BAŞA DÖN':'返回顶部'
 ,
  'Semptom Tabanlı Ön Değerlendirme Raporu':'基于症状的初步评估报告',
  'Kan Testi Değerlendirme Raporu':'血液检测评估报告',
  'Veriler yalnızca bu tarayıcıda işlendi, sunucuya gönderilmedi.':'数据仅在此浏览器中处理，未发送到服务器。',
  'Bu rapor bilgilendirme amaçlıdır; hekim değerlendirmesi, tanı veya reçete yerine geçmez. Sonuçları bir hekimle paylaşın.':'本报告仅供参考，不能替代医生的评估、诊断或处方。请将结果与医生分享。',
  'Raporu yazdır / PDF kaydet':'打印报告 / 保存为 PDF',
  'A4 · yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Veriler cihazınızdan çıkmaz.':'A4 · 在打印窗口中选择“另存为 PDF”。您的数据不会离开设备。',
  'Yazdırmak için önce raporu oluşturun.':'请先生成报告后再打印。',
  'Bu tarayıcı yazdırmayı desteklemiyor.':'此浏览器不支持打印。'}
};
const aboutTranslations = {
 en:{
  'TestoTavan projesi ve bilimsel kaynaklar':'The TestoTavan project and scientific sources',
  'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'A personalized, evidence-informed supplement and nutrition guide for natural testosterone optimization.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Reliable information about men’s health is increasingly difficult to find. TestoTavan provides',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'personalized natural supplement and nutrition guidance based on scientific research.',
  'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'All supplement recommendations are based on peer-reviewed scientific articles.',
  'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan is not a medical device, diagnostic tool or treatment.',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Always consult a healthcare professional before starting any supplement.',
  'Bu platform sadece bilgilendirme amaçlıdır.':'This platform is for informational purposes only.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'None of the health data you enter is stored or sent to a server. All calculations',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'are performed instantly in your browser. Your data remains with you.'},
 de:{
  'TestoTavan projesi ve bilimsel kaynaklar':'Das TestoTavan-Projekt und wissenschaftliche Quellen',
  'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Ein personalisierter, wissenschaftlich fundierter Leitfaden zu Nahrungsergänzung und Ernährung für eine natürliche Testosteronoptimierung.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Verlässliche Informationen zur Männergesundheit sind immer schwerer zu finden. TestoTavan bietet',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'personalisierte natürliche Ergänzungs- und Ernährungsempfehlungen auf Grundlage wissenschaftlicher Forschung.',
  'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'Alle Empfehlungen basieren auf begutachteten wissenschaftlichen Artikeln.',
  'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan ist kein Medizinprodukt, Diagnoseinstrument oder Behandlungsverfahren.',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Konsultieren Sie vor der Einnahme von Nahrungsergänzungsmitteln medizinisches Fachpersonal.',
  'Bu platform sadece bilgilendirme amaçlıdır.':'Diese Plattform dient ausschließlich Informationszwecken.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'Ihre eingegebenen Gesundheitsdaten werden weder gespeichert noch an einen Server gesendet. Alle Berechnungen',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'erfolgen direkt im Browser. Ihre Daten bleiben bei Ihnen.'},
 ja:{
  'TestoTavan projesi ve bilimsel kaynaklar':'TestoTavanプロジェクトと科学的資料',
  'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'自然なテストステロン最適化のための、科学的根拠に基づく個別サプリメント・栄養ガイドです。',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'男性の健康に関する信頼できる情報は、ますます見つけにくくなっています。TestoTavanは、',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'科学的研究に基づいた個別の自然なサプリメント・栄養情報を提供します。',
  'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'すべてのサプリメント情報は、査読済みの科学論文に基づいています。',
  'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavanは医療機器、診断ツール、治療法ではありません。',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'サプリメントを始める前に、必ず医療専門家に相談してください。',
  'Bu platform sadece bilgilendirme amaçlıdır.':'このプラットフォームは情報提供のみを目的としています。',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'入力した健康データは保存されず、サーバーにも送信されません。すべての計算は',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'ブラウザ内で即時に行われ、データはご本人だけに保持されます。'},
 fr: {
  'TestoTavan projesi ve bilimsel kaynaklar':'Le projet TestoTavan et ses sources scientifiques', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Un guide personnalisé de compléments et de nutrition, fondé sur des données scientifiques, pour optimiser naturellement la testostérone.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Trouver des informations fiables sur la santé masculine devient chaque jour plus difficile. TestoTavan propose',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'des recommandations personnalisées de compléments naturels et de nutrition fondées sur la recherche scientifique.', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'Toutes nos recommandations de compléments reposent sur des articles scientifiques à comité de lecture.', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan n’est pas un dispositif médical, un outil de diagnostic ni un traitement',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Consultez toujours un professionnel de santé avant de commencer un complément.', 'Bu platform sadece bilgilendirme amaçlıdır.':'Cette plateforme est uniquement à but informatif.', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'Aucune donnée que vous saisissez n’est enregistrée ni envoyée à un serveur. Tous les calculs',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'sont effectués instantanément dans votre navigateur. Vos données restent chez vous.'
 },
 es: {
  'TestoTavan projesi ve bilimsel kaynaklar':'El proyecto TestoTavan y sus fuentes científicas', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Una guía personalizada de suplementos y nutrición, basada en datos científicos, para optimizar la testosterona de forma natural.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Encontrar información fiable sobre la salud masculina es cada vez más difícil. TestoTavan ofrece',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'recomendaciones personalizadas de suplementos naturales y nutrición basadas en la investigación científica.', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'Todas nuestras recomendaciones de suplementos se basan en artículos científicos revisados por pares.', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan no es un dispositivo médico, una herramienta de diagnóstico ni un tratamiento',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Consulta siempre a un profesional sanitario antes de comenzar cualquier suplemento.', 'Bu platform sadece bilgilendirme amaçlıdır.':'Esta plataforma tiene únicamente fines informativos.', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'Ningún dato que introduzcas se guarda ni se envía a un servidor. Todos los cálculos',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'se realizan al instante en tu navegador. Tus datos se quedan contigo.'
 },
 bg: {
  'TestoTavan projesi ve bilimsel kaynaklar':'Проектът TestoTavan и научните източници', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Персонализирано ръководство за добавки и хранене, базирано на научни данни, за естествена оптимизация на тестостерона.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Намирането на достоверна информация за мъжкото здраве става все по-трудно. TestoTavan предлага',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'персонализирани препоръки за естествени добавки и хранене, базирани на научни изследвания.', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'Всички наши препоръки за добавки се основават на рецензирани научни статии.', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan не е медицинско изделие, диагностичен инструмент или метод на лечение',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Винаги се консултирайте с медицински специалист, преди да започнете каквато и да е добавка.', 'Bu platform sadece bilgilendirme amaçlıdır.':'Тази платформа е само с информационна цел.', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'Никакви въведени от вас данни не се запазват или изпращат на сървър. Всички изчисления',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'се извършват незабавно в браузъра ви. Данните ви остават само при вас.'
 },
 ru: {
  'TestoTavan projesi ve bilimsel kaynaklar':'Проект TestoTavan и научные источники', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Персонализированное руководство по добавкам и питанию на основе научных данных для естественной оптимизации тестостерона.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'Находить достоверную информацию о мужском здоровье становится всё труднее. TestoTavan предлагает',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'персонализированные рекомендации по натуральным добавкам и питанию, основанные на научных исследованиях.', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'Все наши рекомендации по добавкам основаны на рецензируемых научных статьях.', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan не является медицинским изделием, диагностическим средством или методом лечения',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'Перед началом приёма любых добавок обязательно проконсультируйтесь с врачом.', 'Bu platform sadece bilgilendirme amaçlıdır.':'Эта платформа носит исключительно информационный характер.', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'Введённые вами данные не сохраняются и не отправляются на сервер. Все расчёты',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'выполняются мгновенно в вашем браузере. Данные остаются только у вас.'
 },
 hi: {
  'TestoTavan projesi ve bilimsel kaynaklar':'TestoTavan परियोजना और वैज्ञानिक स्रोत', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'प्राकृतिक टेस्टोस्टेरोन अनुकूलन के लिए वैज्ञानिक आँकड़ों पर आधारित व्यक्तिगत सप्लीमेंट और पोषण मार्गदर्शिका।', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'पुरुष स्वास्थ्य पर सही जानकारी पाना हर दिन कठिन होता जा रहा है। TestoTavan',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'वैज्ञानिक शोध पर आधारित व्यक्तिगत प्राकृतिक सप्लीमेंट और पोषण सुझाव प्रदान करता है।', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'हमारे सभी सप्लीमेंट सुझाव पीयर-रिव्यू वैज्ञानिक लेखों पर आधारित हैं।', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan कोई चिकित्सा उपकरण, निदान साधन या उपचार विधि नहीं है',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'कोई भी सप्लीमेंट शुरू करने से पहले हमेशा स्वास्थ्य विशेषज्ञ से सलाह लें।', 'Bu platform sadece bilgilendirme amaçlıdır.':'यह प्लेटफ़ॉर्म केवल जानकारी देने के उद्देश्य से है।', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'आपका कोई भी डेटा सहेजा या सर्वर पर भेजा नहीं जाता। सभी गणनाएँ',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'आपके ब्राउज़र में तुरंत की जाती हैं। आपका डेटा केवल आपके पास रहता है।'
 },
 zh: {
  'TestoTavan projesi ve bilimsel kaynaklar':'TestoTavan 项目与科学来源', 'Doğal Testosteronoptimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'基于科学数据的个性化补剂与营养指南，帮助你自然优化睾酮水平。', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan,':'如今要找到可靠的男性健康信息越来越难。TestoTavan',
  'bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'基于科学研究，提供个性化的天然补剂与营养建议。', 'Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.':'我们的所有补剂建议均基于同行评审的科学论文。', 'TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi':'TestoTavan 并非医疗器械、诊断工具或治疗方法',
  'Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın.':'开始服用任何补剂前，请务必咨询医疗专业人士。', 'Bu platform sadece bilgilendirme amaçlıdır.':'本平台仅供信息参考。', 'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar':'你输入的任何数据都不会被保存或发送到服务器。所有计算',
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'都在浏览器中即时完成，数据只保留在你本地。'
 }
};
Object.keys(aboutTranslations).forEach(lang=>Object.assign(i18n[lang]=i18n[lang]||{},aboutTranslations[lang]));

/*
 * Site kabuğunda görünen, içerik yönetiminden bağımsız sabit metinler.
 * Bu dosya build çıktısı değildir; content modülü tarafından yüklenerek i18n
 * sözlüğüne eklenir. Anahtarlar Türkçe kaynak metindir.
 */
const staticUiTranslations = {
  en: {
    'Doğal Testosteron Optimizasyonu': 'Natural Testosterone Optimization',
    'Dil': 'Language',
    'Dil seçin': 'Select language',
    'Ana içeriğe geç': 'Skip to main content',
    'Ana sayfaya dön': 'Back to home',
    'Analiz adımları': 'Analysis steps',
    'Ölçüm tipi': 'Measurement type',
    'Ana navigasyon': 'Main navigation',
    'Reklam alanı': 'Advertisement area',
    'Sponsor': 'Sponsor',
    'Sponsor alanı': 'Sponsor area',
    'Sponsor ol': 'Become a sponsor',
    'İletişime geç': 'Get in touch',
    'Detaylar': 'Details',
    'Laboratuvar iş birliği': 'Laboratory partnership',
    'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.': 'Your brand name, short text and link are published here.',
    'Hormon paneli kampanyaları için ayrılmış alan.': 'A reserved slot for hormone-panel campaigns.',
    'Takviye ve erkek sağlığı markaları için ayrılmış alan.': 'A reserved slot for supplement and men’s health brands.',
    'Blog yazınız tüm dillerde bu alanda listelenir.': 'Your blog post is listed here in every language.',
    'Kişisel planınız': 'Your personal plan',
    'Tahmin girdilerini değiştir': 'Change estimate inputs',
    'TestoTavan logosu': 'TestoTavan logo',
    'Semptom Analizi': 'Symptom Analysis',
    'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.': 'We estimate a value and confidence interval from your symptoms — it takes 2 minutes.',
    'Elimde kan testi var, doğrudan doğrulayayım': 'I have a blood test; let’s verify it directly',
    'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.': 'Upload your lab-report PDF; we will read the values and compare them with reference ranges.',
    'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.': 'Improving sleep, weight, training and missing micronutrients can support hormonal balance. Because responses vary from person to person, we do not promise a numerical increase; we measure first, then review.',
    'Tahmini hormon değerleriniz': 'Your estimated hormone values',
    'Tahmin modelinin girdileri': 'Inputs used by the estimation model',
    'Ortalama Uyku': 'Average Sleep',
    '5 saat ve altı': '5 hours or less',
    '6 saat': '6 hours',
    '7 saat': '7 hours',
    '8 saat ve üzeri': '8 hours or more',
    'Stres Düzeyi': 'Stress Level',
    'Düşük': 'Low',
    'Orta': 'Moderate',
    'Yüksek': 'High',
    'Semptomlarınız': 'Your Symptoms',
    'Yaşadıklarınızı işaretleyin': 'Select what you experience',
    'TAHMİNİ HESAPLA': 'CALCULATE ESTIMATE',
    'Kan Testi ile Doğrulama': 'Blood Test Verification',
    'Gerçek değerlerinizle kesin rapor': 'A definitive report using your actual values',
    'Bu ölçüm hangisi?': 'Which measurement is this?',
    'Raporda böyle etiketlenecek': 'This is how it will be labelled in the report',
    'Başlangıç ölçümü': 'Baseline measurement',
    'Kontrol (takip) ölçümü': 'Follow-up measurement',
    'Kan vermeden önce: numune koşulları': 'Before your blood draw: sample conditions',
    'Kan': 'Blood',
    'sabah 07:00–10:00': 'between 07:00–10:00 in the morning',
    'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.': '; testosterone can decrease by up to 30% during the day.',
    '8–12 saat açlık': 'Fast for 8–12 hours',
    '; yalnızca su içebilirsiniz.': '; you may drink water only.',
    'Biotin (B7)': 'Biotin (B7)',
    'içeren takviyeleri ölçümden en az': 'supplements should be stopped at least',
    '72 saat': '72 hours',
    'önce bırakın — hormon sonuçlarını yanlış gösterir.': 'before the test — they can distort hormone results.',
    'Son': 'For the last',
    '48 saatte': '48 hours',
    'ağır antrenman ve alkol olmasın.': 'avoid intense exercise and alcohol.',
    'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.': 'Postpone the measurement during an acute illness such as fever or infection.',
    'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.': 'A blood sample taken without these conditions can lead to a low result being interpreted incorrectly.',
    'Tahlilinizi yükleyin, biz okuyalım': 'Upload your lab report; we will read it',
    'En hızlı yol — elle giriş gerekmez': 'The fastest way — no manual entry needed',
    'Tahlil PDF’i veya fotoğrafı': 'Lab-report PDF or photo',
    'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.': 'We read values from the PDF in your browser and place them in the form. The file is not sent to a server.',
    'DOSYA SEÇ': 'CHOOSE FILE',
    'Tahlil metnini yapıştırayım': 'Paste lab-report text',
    'Değerleri elle gireceğim': 'I will enter values manually',
    'Tahlil metni': 'Lab-report text',
    'Metinden değerleri oku': 'Read values from text',
    'Yalnızca Total Testosteron zorunlu': 'Only Total Testosterone is required',
    'Total Testosteron': 'Total Testosterone',
    'Zorunlu': 'Required',
    'Opsiyonel': 'Optional',
    'Serbest Testosteron': 'Free Testosterone',
    'Kortizol (sabah)': 'Cortisol (morning)',
    'Hepsi opsiyonel': 'All optional',
    'D Vitamini (25-OH)': 'Vitamin D (25-OH)',
    'Çinko': 'Zinc',
    'Sağlık verisi açık rızası': 'Consent for health data',
    'KVKK m.6 — özel nitelikli kişisel veri': 'PDPL Art. 6 — sensitive personal data',
    'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla': 'I consent to the processing of the blood values I enter (sensitive health data) on',
    'cihazımda': 'my device',
    'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.': 'solely to create this analysis. Data is not sent to a server, stored or shared with third parties. I can withdraw my consent at any time by closing this page.',
    'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.': 'You need to tick the consent box to continue.',
    'Testi nerede ve kaç günde yaptırırım?': 'Where can I get the test and how long does it take?',
    'Butona basmadan önce bilmeniz gerekenler': 'What you should know before pressing the button',
    'Nerede:': 'Where:',
    'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.': 'Any private laboratory or public hospital; no special referral is needed apart from an appointment.',
    'Ücret:': 'Cost:',
    'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.': 'The laboratory’s processing fee is your responsibility. TestoTavan does not charge a fee and has no partnerships with laboratories.',
    'Sonuç süresi:': 'Turnaround time:',
    'Çoğu laboratuvarda aynı gün – 2 iş günü.': 'Same day to 2 business days at most laboratories.',
    'SGK:': 'Social Security:',
    'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.': 'It may be covered by Social Security at a public hospital when ordered by a physician.',
    'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.': 'Current fees and appointment conditions vary by laboratory; confirm with the provider before proceeding.',
    'RAPORU OLUŞTUR': 'CREATE REPORT',
    'Rapor 5 saniyede hazır ·': 'Report ready in 5 seconds ·',
    'veriler cihazınızdan çıkmaz': 'your data never leaves your device',
    'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar': 'The TestoTavan project, our approach and scientific sources',
    'Referans aldığımız çalışmalar': 'Studies we reference',
    'Özet:': 'Summary:',
    'D Vitamini & Testosteron İlişkisi': 'Vitamin D & Testosterone',
    '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.': 'In men taking 3,332 IU/day of vitamin D, total testosterone increased by 25.2% after 12 months (from 10.7±3.9 to 13.4±4.7 nmol/L). No change was observed in the placebo group.',
    'Ashwagandha & Kortizol Azaltımı': 'Ashwagandha & Cortisol Reduction',
    '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.': 'In the group taking 300 mg KSM-66 ashwagandha extract twice daily, serum cortisol fell 27.9% after 60 days. Stress scores fell 44%.',
    'Çinko Eksikliği & Hormon Sentezi': 'Zinc Deficiency & Hormone Synthesis',
    'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.': 'In young men with moderate zinc deficiency, 20–40 mg/day zinc supplementation produced a marked increase in serum testosterone after 6 months.',
    'Magnezyum & Serbest Testosteron Artışı': 'Magnesium & Increased Free Testosterone',
    '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.': 'Ten mg/kg magnesium sulfate supplementation for 4 weeks increased free and total testosterone in both sedentary and active participants.',
    'Uyku Kısıtlaması & Testosteron Düşüşü': 'Sleep Restriction & Lower Testosterone',
    'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.': 'One week of sleep restriction (5 hours/night) in young men resulted in a 10–15% reduction in daytime testosterone. This effect was observed after just one week.',
    'Omega-3 Yağ Asitleri & Hormonal Sağlık': 'Omega-3 Fatty Acids & Hormonal Health',
    'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.': 'In infertile men taking omega-3 supplementation (1,840 mg DHA), sperm quality increased and oxidative-stress markers decreased after 32 weeks.',
    'Kreatin Monohidrat & Güç Artışı': 'Creatine Monohydrate & Strength',
    'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.': 'When used with resistance training, creatine monohydrate supplementation (5 g/day) improves muscle mass and strength by 5–15%. It is the most researched sports supplement.',
    'Fenugreek (Çemen) & Serbest Testosteron': 'Fenugreek & Free Testosterone',
    '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.': 'In resistance-trained men taking 500 mg/day fenugreek extract for 8 weeks, free testosterone increased 46% and body-fat percentage decreased.',
    'değildir': 'is not',
    '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.': '. Always consult a healthcare professional before starting any supplement. This platform is for informational purposes only.',
    'TestoTavan v3.0 — Tüm hakları saklıdır © 2026': 'TestoTavan v3.0 — All rights reserved © 2026',
    'Geliştiren:': 'Built by:',
    'TestoTavan Rehber': 'TestoTavan Guide',
    'Okunma sayısı yükleniyor...': 'Loading view count...',
    'Sponsorlu içerik': 'Sponsored content',
    'Semptom': 'Symptoms',
    'Doğrulama': 'Verification',
    'Geçerli giriş aralığı:': 'Accepted input range:',
    'Lab normal aralığı:': 'Normal laboratory range:',
    'Laboratuvar normal aralığı:': 'Normal laboratory range:',
    '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.': '— Total testosterone is the sum of bound and free hormone; repeated measurements below 270 ng/dL are considered clinically low.',
    '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.': '— This is the fraction that reaches cells and often aligns with symptoms better than total testosterone.',
    '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.': '— When SHBG is high, testosterone binds to this protein and free testosterone decreases.',
    '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.': '— LH is the signal from the brain to the testes; high LH with low testosterone may point to the testes, while low LH may point to the pituitary.',
    '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.': '— FSH regulates sperm production; considered with LH, it helps distinguish the source of a low result.',
    '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.': '— Some testosterone converts to estradiol in fatty tissue; high E2 is associated with libido changes and breast tenderness.',
    '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.': '— Chronically high cortisol can suppress testosterone production; it should be measured between 07:00–10:00 in the morning.',
    '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.': '— It reflects iron stores; below 30 ng/mL, fatigue and poor recovery can occur independently of testosterone.',
    '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.': '— Vitamin D is a cofactor in testosterone synthesis; below 30 ng/mL is considered insufficient.',
    '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.': '— Low B12 can mimic low energy and poor focus independently of testosterone.',
    '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.': '— Zinc deficiency directly weakens LH signalling and testosterone synthesis.',
    '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.': '— Magnesium may support free testosterone by reducing SHBG binding.'
  },
  de: {
    'Doğal Testosteron Optimizasyonu': 'Natürliche Testosteron-Optimierung',
    'Dil': 'Sprache',
    'Dil seçin': 'Sprache auswählen',
    'Ana içeriğe geç': 'Zum Hauptinhalt springen',
    'Ana sayfaya dön': 'Zur Startseite',
    'Analiz adımları': 'Analyseschritte',
    'Ölçüm tipi': 'Messart',
    'Ana navigasyon': 'Hauptnavigation',
    'Reklam alanı': 'Werbebereich',
    'Sponsor': 'Sponsor',
    'Sponsor alanı': 'Sponsorfläche',
    'Sponsor ol': 'Sponsor werden',
    'İletişime geç': 'Kontakt aufnehmen',
    'Detaylar': 'Details',
    'Laboratuvar iş birliği': 'Labor-Kooperation',
    'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.': 'Markenname, Kurztext und Link werden hier veröffentlicht.',
    'Hormon paneli kampanyaları için ayrılmış alan.': 'Reservierter Platz für Hormonpanel-Kampagnen.',
    'Takviye ve erkek sağlığı markaları için ayrılmış alan.': 'Reservierter Platz für Marken aus dem Bereich Nahrungsergänzung und Männergesundheit.',
    'Blog yazınız tüm dillerde bu alanda listelenir.': 'Ihr Blogbeitrag wird hier in allen Sprachen gelistet.',
    'Kişisel planınız': 'Ihr persönlicher Plan',
    'Tahmin girdilerini değiştir': 'Eingaben ändern',
    'TestoTavan logosu': 'TestoTavan-Logo',
    'Semptom Analizi': 'Symptomanalyse',
    'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.': 'Aus Ihren Symptomen ermitteln wir einen Schätzwert und ein Konfidenzintervall — in 2 Minuten.',
    'Elimde kan testi var, doğrudan doğrulayayım': 'Ich habe einen Bluttest – direkt überprüfen',
    'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.': 'Laden Sie Ihr Labor-PDF hoch; wir lesen die Werte aus und vergleichen sie mit Referenzbereichen.',
    'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.': 'Besserer Schlaf, Gewicht, Training und der Ausgleich fehlender Mikronährstoffe können die hormonelle Balance unterstützen. Da die Wirkung individuell ist, versprechen wir keinen Zahlenwert: erst messen, dann prüfen.',
    'Tahmini hormon değerleriniz': 'Ihre geschätzten Hormonwerte',
    'Tahmin modelinin girdileri': 'Eingaben für das Schätzmodell',
    'Ortalama Uyku': 'Durchschnittlicher Schlaf',
    '5 saat ve altı': '5 Stunden oder weniger',
    '6 saat': '6 Stunden',
    '7 saat': '7 Stunden',
    '8 saat ve üzeri': '8 Stunden oder mehr',
    'Stres Düzeyi': 'Stressniveau',
    'Düşük': 'Niedrig',
    'Orta': 'Mittel',
    'Yüksek': 'Hoch',
    'Semptomlarınız': 'Ihre Symptome',
    'Yaşadıklarınızı işaretleyin': 'Wählen Sie, was Sie erleben',
    'TAHMİNİ HESAPLA': 'SCHÄTZUNG BERECHNEN',
    'Kan Testi ile Doğrulama': 'Überprüfung per Bluttest',
    'Gerçek değerlerinizle kesin rapor': 'Präziser Bericht mit Ihren tatsächlichen Werten',
    'Bu ölçüm hangisi?': 'Welche Messung ist das?',
    'Raporda böyle etiketlenecek': 'So wird sie im Bericht bezeichnet',
    'Başlangıç ölçümü': 'Ausgangsmessung',
    'Kontrol (takip) ölçümü': 'Kontrollmessung',
    'Kan vermeden önce: numune koşulları': 'Vor der Blutabnahme: Probenbedingungen',
    'Kan': 'Blut',
    'sabah 07:00–10:00': 'morgens zwischen 07:00–10:00',
    'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.': '; Testosteron kann im Tagesverlauf um bis zu 30 % sinken.',
    '8–12 saat açlık': '8–12 Stunden nüchtern bleiben',
    '; yalnızca su içebilirsiniz.': '; nur Wasser ist erlaubt.',
    'Biotin (B7)': 'Biotin (B7)',
    'içeren takviyeleri ölçümden en az': 'haltige Präparate mindestens',
    '72 saat': '72 Stunden',
    'önce bırakın — hormon sonuçlarını yanlış gösterir.': 'vorher absetzen — sie können Hormonwerte verfälschen.',
    'Son': 'In den letzten',
    '48 saatte': '48 Stunden',
    'ağır antrenman ve alkol olmasın.': 'kein intensives Training und kein Alkohol.',
    'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.': 'Verschieben Sie die Messung bei einer akuten Erkrankung wie Fieber oder Infektion.',
    'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.': 'Eine Blutabnahme ohne diese Bedingungen kann dazu führen, dass ein niedriger Wert falsch interpretiert wird.',
    'Tahlilinizi yükleyin, biz okuyalım': 'Laborbericht hochladen – wir lesen ihn aus',
    'En hızlı yol — elle giriş gerekmez': 'Der schnellste Weg – keine manuelle Eingabe nötig',
    'Tahlil PDF’i veya fotoğrafı': 'Labor-PDF oder Foto',
    'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.': 'Wir lesen die PDF-Werte in Ihrem Browser aus und tragen sie ins Formular ein. Die Datei wird nicht an einen Server gesendet.',
    'DOSYA SEÇ': 'DATEI AUSWÄHLEN',
    'Tahlil metnini yapıştırayım': 'Laborberichtstext einfügen',
    'Değerleri elle gireceğim': 'Werte manuell eingeben',
    'Tahlil metni': 'Laborberichtstext',
    'Metinden değerleri oku': 'Werte aus Text lesen',
    'Yalnızca Total Testosteron zorunlu': 'Nur Gesamt-Testosteron ist erforderlich',
    'Total Testosteron': 'Gesamt-Testosteron',
    'Zorunlu': 'Erforderlich',
    'Opsiyonel': 'Optional',
    'Serbest Testosteron': 'Freies Testosteron',
    'Kortizol (sabah)': 'Cortisol (morgens)',
    'Hepsi opsiyonel': 'Alle optional',
    'D Vitamini (25-OH)': 'Vitamin D (25-OH)',
    'Çinko': 'Zink',
    'Sağlık verisi açık rızası': 'Einwilligung für Gesundheitsdaten',
    'KVKK m.6 — özel nitelikli kişisel veri': 'DSGVO Art. 9 – besonders schutzwürdige Daten',
    'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla': 'Ich willige ein, dass die von mir eingegebenen Blutwerte (sensible Gesundheitsdaten) auf',
    'cihazımda': 'meinem Gerät',
    'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.': 'ausschließlich zur Erstellung dieser Analyse verarbeitet werden. Die Daten werden nicht an einen Server gesendet, gespeichert oder mit Dritten geteilt. Ich kann meine Einwilligung jederzeit durch Schließen dieser Seite widerrufen.',
    'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.': 'Um fortzufahren, müssen Sie das Einwilligungsfeld aktivieren.',
    'Testi nerede ve kaç günde yaptırırım?': 'Wo kann ich den Test machen und wie lange dauert er?',
    'Butona basmadan önce bilmeniz gerekenler': 'Das sollten Sie vor dem Start wissen',
    'Nerede:': 'Wo:',
    'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.': 'In jedem privaten Labor oder staatlichen Krankenhaus; außer einem Termin ist keine besondere Überweisung nötig.',
    'Ücret:': 'Kosten:',
    'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.': 'Die Laborgebühr tragen Sie selbst. TestoTavan erhebt keine Gebühr und hat keine Partnerschaften mit Laboren.',
    'Sonuç süresi:': 'Bearbeitungszeit:',
    'Çoğu laboratuvarda aynı gün – 2 iş günü.': 'Bei den meisten Laboren am selben Tag bis zu 2 Werktagen.',
    'SGK:': 'Sozialversicherung:',
    'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.': 'Bei ärztlicher Anordnung kann der Test in einem staatlichen Krankenhaus sozialversichert sein.',
    'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.': 'Aktuelle Gebühren und Terminbedingungen unterscheiden sich je nach Labor; bestätigen Sie diese vorher beim Anbieter.',
    'RAPORU OLUŞTUR': 'BERICHT ERSTELLEN',
    'Rapor 5 saniyede hazır ·': 'Bericht in 5 Sekunden fertig ·',
    'veriler cihazınızdan çıkmaz': 'Ihre Daten verlassen Ihr Gerät nicht',
    'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar': 'Das TestoTavan-Projekt, unser Ansatz und wissenschaftliche Quellen',
    'Referans aldığımız çalışmalar': 'Studien, auf die wir uns beziehen',
    'Özet:': 'Zusammenfassung:',
    'D Vitamini & Testosteron İlişkisi': 'Vitamin D & Testosteron',
    '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.': 'Bei Männern mit 3.332 IE Vitamin D täglich stieg das Gesamt-Testosteron nach 12 Monaten um 25,2 % (von 10,7±3,9 auf 13,4±4,7 nmol/L). In der Placebogruppe wurde keine Veränderung beobachtet.',
    'Ashwagandha & Kortizol Azaltımı': 'Ashwagandha & Cortisol-Senkung',
    '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.': 'In der Gruppe mit 300 mg KSM-66-Ashwagandha-Extrakt zweimal täglich sank der Serumcortisolwert nach 60 Tagen um 27,9 %. Die Stresswerte sanken um 44 %.',
    'Çinko Eksikliği & Hormon Sentezi': 'Zinkmangel & Hormonsynthese',
    'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.': 'Bei jungen Männern mit mäßigem Zinkmangel führte eine Zinksupplementierung von 20–40 mg/Tag nach 6 Monaten zu einem deutlichen Anstieg des Serumtestosterons.',
    'Magnezyum & Serbest Testosteron Artışı': 'Magnesium & freies Testosteron',
    '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.': 'Eine Supplementierung mit 10 mg/kg Magnesiumsulfat über 4 Wochen erhöhte bei bewegungsarmen und aktiven Personen freies und Gesamt-Testosteron.',
    'Uyku Kısıtlaması & Testosteron Düşüşü': 'Schlafmangel & niedrigeres Testosteron',
    'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.': 'Eine Woche Schlafbeschränkung (5 Stunden/Nacht) führte bei jungen Männern zu einem Rückgang des Testosterons am Tag um 10–15 %. Dieser Effekt zeigte sich bereits nach einer Woche.',
    'Omega-3 Yağ Asitleri & Hormonal Sağlık': 'Omega-3-Fettsäuren & hormonelle Gesundheit',
    'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.': 'Bei unfruchtbaren Männern mit Omega-3-Supplementierung (1.840 mg DHA) stiegen nach 32 Wochen die Spermienqualität und sanken Marker für oxidativen Stress.',
    'Kreatin Monohidrat & Güç Artışı': 'Kreatin-Monohydrat & Kraft',
    'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.': 'Kreatin-Monohydrat (5 g/Tag) kann zusammen mit Krafttraining Muskelmasse und Kraft um 5–15 % steigern. Es ist das am besten erforschte Sport-Supplement.',
    'Fenugreek (Çemen) & Serbest Testosteron': 'Bockshornklee & freies Testosteron',
    '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.': 'Bei krafttrainierenden Männern mit 500 mg/Tag Bockshornklee-Extrakt über 8 Wochen stieg das freie Testosteron um 46 % und der Körperfettanteil sank.',
    'değildir': 'ist kein',
    '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.': '. Konsultieren Sie vor der Einnahme von Nahrungsergänzungsmitteln medizinisches Fachpersonal. Diese Plattform dient ausschließlich der Information.',
    'TestoTavan v3.0 — Tüm hakları saklıdır © 2026': 'TestoTavan v3.0 — Alle Rechte vorbehalten © 2026',
    'Geliştiren:': 'Entwickelt von:',
    'TestoTavan Rehber': 'TestoTavan-Ratgeber',
    'Okunma sayısı yükleniyor...': 'Aufrufe werden geladen ...',
    'Sponsorlu içerik': 'Gesponserter Inhalt',
    'Semptom': 'Symptome',
    'Doğrulama': 'Überprüfung',
    'Geçerli giriş aralığı:': 'Zulässiger Eingabebereich:',
    'Lab normal aralığı:': 'Normalbereich des Labors:',
    'Laboratuvar normal aralığı:': 'Normalbereich des Labors:',
    '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.': '— Gesamt-Testosteron ist die Summe aus gebundenem und freiem Hormon; wiederholte Werte unter 270 ng/dL gelten als klinisch niedrig.',
    '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.': '— Dies ist der Anteil, der tatsächlich in die Zellen gelangt und oft besser zu Beschwerden passt als Gesamt-Testosteron.',
    '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.': '— Bei hohem SHBG bindet Testosteron an dieses Protein und freies Testosteron sinkt.',
    '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.': '— LH ist das Signal vom Gehirn zu den Hoden; bei niedrigem Testosteron kann ein hoher Wert auf die Hoden, ein niedriger auf die Hypophyse hinweisen.',
    '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.': '— FSH steuert die Spermienproduktion; zusammen mit LH hilft es, die Ursache eines niedrigen Werts einzuordnen.',
    '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.': '— Ein Teil des Testosterons wird im Fettgewebe zu Estradiol umgewandelt; hohes E2 wird mit Veränderungen der Libido und Brustempfindlichkeit verbunden.',
    '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.': '— Chronisch hohes Cortisol kann die Testosteronproduktion hemmen; es sollte morgens zwischen 07:00–10:00 gemessen werden.',
    '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.': '— Es zeigt die Eisenspeicher; unter 30 ng/mL können Müdigkeit und schlechte Erholung unabhängig vom Testosteron auftreten.',
    '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.': '— Vitamin D ist ein Kofaktor der Testosteronsynthese; unter 30 ng/mL gilt als unzureichend.',
    '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.': '— Niedriges B12 kann Energie- und Konzentrationsverlust unabhängig vom Testosteron nachahmen.',
    '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.': '— Zinkmangel schwächt LH-Signale und die Testosteronsynthese direkt.',
    '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.': '— Magnesium kann freies Testosteron durch geringere SHBG-Bindung unterstützen.'
  },
  ja: {
    'Doğal Testosteron Optimizasyonu': '自然なテストステロン最適化',
    'Dil': '言語',
    'Dil seçin': '言語を選択',
    'Ana içeriğe geç': 'メインコンテンツへ移動',
    'Ana sayfaya dön': 'ホームへ戻る',
    'Analiz adımları': '分析ステップ',
    'Ölçüm tipi': '測定の種類',
    'Ana navigasyon': 'メインナビゲーション',
    'Reklam alanı': '広告エリア',
    'Sponsor': 'スポンサー',
    'Sponsor alanı': 'スポンサー枠',
    'Sponsor ol': 'スポンサーになる',
    'İletişime geç': 'お問い合わせ',
    'Detaylar': '詳細',
    'Laboratuvar iş birliği': '検査機関との提携',
    'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.': 'ブランド名・短い説明・リンクがここに表示されます。',
    'Hormon paneli kampanyaları için ayrılmış alan.': 'ホルモン検査キャンペーン用の枠です。',
    'Takviye ve erkek sağlığı markaları için ayrılmış alan.': 'サプリメント・男性健康ブランド用の枠です。',
    'Blog yazınız tüm dillerde bu alanda listelenir.': 'ブログ記事がすべての言語でこの枠に掲載されます。',
    'Kişisel planınız': 'あなたの個別プラン',
    'Tahmin girdilerini değiştir': '入力条件を変更',
    'TestoTavan logosu': 'TestoTavan ロゴ',
    'Semptom Analizi': '症状分析',
    'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.': '症状から推定値と信頼区間を算出します。所要時間は約2分です。',
    'Elimde kan testi var, doğrudan doğrulayayım': '血液検査結果があるので、直接確認する',
    'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.': '検査結果のPDFをアップロードしてください。数値を読み取り、基準範囲と比較します。',
    'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.': '睡眠、体重、トレーニング、不足している微量栄養素を整えることは、ホルモンバランスの支えになります。反応には個人差があるため数値的な上昇は約束せず、まず測定してから確認します。',
    'Tahmini hormon değerleriniz': '推定ホルモン値',
    'Tahmin modelinin girdileri': '推定モデルの入力項目',
    'Ortalama Uyku': '平均睡眠時間',
    '5 saat ve altı': '5時間以下',
    '6 saat': '6時間',
    '7 saat': '7時間',
    '8 saat ve üzeri': '8時間以上',
    'Stres Düzeyi': 'ストレスレベル',
    'Düşük': '低い',
    'Orta': '中程度',
    'Yüksek': '高い',
    'Semptomlarınız': 'あなたの症状',
    'Yaşadıklarınızı işaretleyin': '当てはまる項目を選択してください',
    'TAHMİNİ HESAPLA': '推定を計算',
    'Kan Testi ile Doğrulama': '血液検査で確認',
    'Gerçek değerlerinizle kesin rapor': '実測値による詳細レポート',
    'Bu ölçüm hangisi?': '今回の測定はどちらですか？',
    'Raporda böyle etiketlenecek': 'レポートではこのように表示されます',
    'Başlangıç ölçümü': '初回測定',
    'Kontrol (takip) ölçümü': 'フォローアップ測定',
    'Kan vermeden önce: numune koşulları': '採血前：検体採取の条件',
    'Kan': '採血は',
    'sabah 07:00–10:00': '午前7:00〜10:00',
    'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.': 'に行ってください。テストステロンは日中に最大30%低下することがあります。',
    '8–12 saat açlık': '8〜12時間の絶食',
    '; yalnızca su içebilirsiniz.': '。水のみ飲めます。',
    'Biotin (B7)': 'ビオチン（B7）',
    'içeren takviyeleri ölçümden en az': 'を含むサプリメントは、検査の少なくとも',
    '72 saat': '72時間',
    'önce bırakın — hormon sonuçlarını yanlış gösterir.': '前に中止してください。ホルモン結果に影響する可能性があります。',
    'Son': '過去',
    '48 saatte': '48時間は',
    'ağır antrenman ve alkol olmasın.': '激しい運動と飲酒を避けてください。',
    'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.': '発熱や感染症などの急性疾患中は、測定を延期してください。',
    'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.': 'これらの条件を満たさずに採血すると、低い結果を誤って解釈するおそれがあります。',
    'Tahlilinizi yükleyin, biz okuyalım': '検査結果をアップロードしてください',
    'En hızlı yol — elle giriş gerekmez': '最も速い方法：手入力は不要です',
    'Tahlil PDF’i veya fotoğrafı': '検査結果のPDFまたは写真',
    'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.': 'PDF内の数値はブラウザ内で読み取り、フォームに入力されます。ファイルはサーバーへ送信されません。',
    'DOSYA SEÇ': 'ファイルを選択',
    'Tahlil metnini yapıştırayım': '検査結果テキストを貼り付け',
    'Değerleri elle gireceğim': '数値を手入力する',
    'Tahlil metni': '検査結果テキスト',
    'Metinden değerleri oku': 'テキストから数値を読み取る',
    'Yalnızca Total Testosteron zorunlu': '総テストステロンのみ必須です',
    'Total Testosteron': '総テストステロン',
    'Zorunlu': '必須',
    'Opsiyonel': '任意',
    'Serbest Testosteron': '遊離テストステロン',
    'Kortizol (sabah)': 'コルチゾール（朝）',
    'Hepsi opsiyonel': 'すべて任意',
    'D Vitamini (25-OH)': 'ビタミンD（25-OH）',
    'Çinko': '亜鉛',
    'Sağlık verisi açık rızası': '健康データに関する同意',
    'KVKK m.6 — özel nitelikli kişisel veri': '個人データ保護法 第6条 ― 要配慮個人情報',
    'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla': '入力した血液検査値（要配慮健康情報）が、この分析を作成する目的に限り、',
    'cihazımda': '自分の端末上で',
    'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.': '処理されることに同意します。データはサーバーに送信・保存・第三者提供されません。このページを閉じることでいつでも同意を撤回できます。',
    'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.': '続行するには、同意のチェックボックスを選択してください。',
    'Testi nerede ve kaç günde yaptırırım?': '検査はどこで受けられ、結果はいつ出ますか？',
    'Butona basmadan önce bilmeniz gerekenler': '開始前に知っておくこと',
    'Nerede:': '場所：',
    'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.': '民間検査機関または公立病院で受けられます。予約以外に特別な紹介状は不要です。',
    'Ücret:': '費用：',
    'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.': '検査機関の手数料は利用者負担です。TestoTavanは料金を受け取らず、検査機関との提携もありません。',
    'Sonuç süresi:': '結果までの期間：',
    'Çoğu laboratuvarda aynı gün – 2 iş günü.': '多くの検査機関では当日〜2営業日です。',
    'SGK:': '社会保険：',
    'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.': '医師の依頼があれば、公立病院で社会保険の対象になる場合があります。',
    'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.': '最新の料金や予約条件は検査機関ごとに異なります。事前に各機関へご確認ください。',
    'RAPORU OLUŞTUR': 'レポートを作成',
    'Rapor 5 saniyede hazır ·': 'レポートは5秒で完成 ·',
    'veriler cihazınızdan çıkmaz': 'データは端末外に送信されません',
    'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar': 'TestoTavanプロジェクト、私たちの方針と科学的資料',
    'Referans aldığımız çalışmalar': '参照している研究',
    'Özet:': '概要：',
    'D Vitamini & Testosteron İlişkisi': 'ビタミンDとテストステロン',
    '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.': 'ビタミンDを1日3,332 IU摂取した男性では、12か月後に総テストステロンが25.2%上昇しました（10.7±3.9から13.4±4.7 nmol/L）。プラセボ群では変化はみられませんでした。',
    'Ashwagandha & Kortizol Azaltımı': 'アシュワガンダとコルチゾール低下',
    '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.': 'KSM-66アシュワガンダ抽出物を1回300 mg、1日2回摂取した群では、60日後に血清コルチゾールが27.9%低下し、ストレススコアは44%低下しました。',
    'Çinko Eksikliği & Hormon Sentezi': '亜鉛欠乏とホルモン合成',
    'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.': '中等度の亜鉛欠乏がある若年男性では、1日20〜40 mgの亜鉛補給により、6か月後の血清テストステロンが顕著に上昇しました。',
    'Magnezyum & Serbest Testosteron Artışı': 'マグネシウムと遊離テストステロン',
    '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.': '硫酸マグネシウムを10 mg/kg、4週間補給したところ、運動習慣の少ない人と活動的な人の両方で、遊離・総テストステロンが上昇しました。',
    'Uyku Kısıtlaması & Testosteron Düşüşü': '睡眠制限とテストステロン低下',
    'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.': '若年男性では、1週間の睡眠制限（1晩5時間）により、日中のテストステロンが10〜15%低下しました。この影響はわずか1週間で確認されています。',
    'Omega-3 Yağ Asitleri & Hormonal Sağlık': 'オメガ3脂肪酸とホルモンの健康',
    'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.': 'オメガ3（DHA 1,840 mg）を摂取した不妊男性では、32週後に精子の質が改善し、酸化ストレス指標が低下しました。',
    'Kreatin Monohidrat & Güç Artışı': 'クレアチン一水和物と筋力',
    'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.': 'クレアチン一水和物（1日5 g）は、レジスタンストレーニングと併用すると筋量・筋力を5〜15%向上させます。スポーツサプリメントの中で最も研究されています。',
    'Fenugreek (Çemen) & Serbest Testosteron': 'フェヌグリークと遊離テストステロン',
    '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.': 'レジスタンストレーニングを行う男性がフェヌグリーク抽出物を1日500 mg、8週間摂取したところ、遊離テストステロンが46%上昇し、体脂肪率が低下しました。',
    'değildir': 'ではありません',
    '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.': '。サプリメントを始める前に、必ず医療専門家へ相談してください。このプラットフォームは情報提供のみを目的としています。',
    'TestoTavan v3.0 — Tüm hakları saklıdır © 2026': 'TestoTavan v3.0 — All rights reserved © 2026',
    'Geliştiren:': '開発者：',
    'TestoTavan Rehber': 'TestoTavan ガイド',
    'Okunma sayısı yükleniyor...': '閲覧数を読み込み中...',
    'Sponsorlu içerik': 'スポンサーコンテンツ',
    'Semptom': '症状',
    'Doğrulama': '確認',
    'Geçerli giriş aralığı:': '有効な入力範囲：',
    'Lab normal aralığı:': '検査室の基準範囲：',
    'Laboratuvar normal aralığı:': '検査室の基準範囲：',
    '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.': '— 総テストステロンは結合型と遊離型ホルモンの合計です。270 ng/dL未満が繰り返し確認される場合、臨床的な低値とみなされます。',
    '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.': '— 実際に細胞へ届く画分で、総テストステロンより症状との関連を反映しやすいことがあります。',
    '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.': '— SHBGが高いとテストステロンがこのタンパク質に結合し、遊離テストステロンが低下します。',
    '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.': '— LHは脳から精巣への信号です。低テストステロンとともに高値なら精巣、低値なら下垂体に関連する可能性があります。',
    '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.': '— FSHは精子産生を調節します。LHと併せて評価すると、低値の原因を区別する助けになります。',
    '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.': '— テストステロンの一部は脂肪組織でエストラジオールに変換されます。E2高値は性欲の変化や乳房の圧痛と関連します。',
    '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.': '— 慢性的に高いコルチゾールはテストステロン産生を抑制することがあります。午前7〜10時に測定してください。',
    '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.': '— 鉄の貯蔵量を示します。30 ng/mL未満では、テストステロンとは独立して疲労や回復不良が起こることがあります。',
    '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.': '— ビタミンDはテストステロン合成の補因子です。30 ng/mL未満は不足とみなされます。',
    '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.': '— B12低値は、テストステロンとは独立してエネルギーや集中力の低下に似た症状を起こすことがあります。',
    '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.': '— 亜鉛欠乏はLHシグナルとテストステロン合成を直接弱めます。',
    '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.': '— マグネシウムはSHBGへの結合を減らすことで、遊離テストステロンを支える可能性があります。'
  },
 fr: {
  'Doğal Testosteron Optimizasyonu':'Optimisation naturelle de la testostérone', 'Dil':'Langue', 'Dil seçin':'Choisir la langue',
  'Ana içeriğe geç':'Aller au contenu principal', 'Ana sayfaya dön':'Retour à l’accueil', 'Analiz adımları':'Étapes de l’analyse',
  'Ölçüm tipi':'Type de mesure', 'Ana navigasyon':'Navigation principale', 'Reklam alanı':'Espace publicitaire',
  'Sponsor':'Sponsor', 'Sponsor alanı':'Espace sponsor', 'Sponsor ol':'Devenir sponsor',
  'İletişime geç':'Nous contacter', 'Detaylar':'Détails', 'Laboratuvar iş birliği':'Partenariat laboratoire',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'Le nom de votre marque, un court texte et un lien sont publiés ici.', 'Hormon paneli kampanyaları için ayrılmış alan.':'Un espace réservé aux campagnes de bilans hormonaux.', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'Un espace réservé aux marques de compléments et de santé masculine.',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'Votre article de blog est affiché ici dans toutes nos langues.', 'Kişisel planınız':'Votre plan personnel', 'Tahmin girdilerini değiştir':'Modifier les données d’estimation',
  'TestoTavan logosu':'Logo TestoTavan', 'Semptom Analizi':'Analyse des symptômes', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'Nous estimons une valeur et un intervalle de confiance à partir de vos symptômes — cela prend 2 minutes.',
  'Elimde kan testi var, doğrudan doğrulayayım':'J’ai un bilan sanguin, vérifions-le directement', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'Importez le PDF de votre bilan ; nous lisons les valeurs et les comparons aux plages de référence.', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'Améliorer le sommeil, le poids, l’entraînement et les micronutriments manquants peut soutenir l’équilibre hormonal. Comme les réponses varient d’une personne à l’autre, nous ne promettons aucune hausse chiffrée ; nous mesurons d’abord, puis vérifions.',
  'Tahmini hormon değerleriniz':'Vos valeurs hormonales estimées', 'Tahmin modelinin girdileri':'Données utilisées par le modèle', 'Ortalama Uyku':'Sommeil moyen',
  '5 saat ve altı':'5 heures ou moins', '6 saat':'6 heures', '7 saat':'7 heures',
  '8 saat ve üzeri':'8 heures ou plus', 'Stres Düzeyi':'Niveau de stress', 'Düşük':'Faible',
  'Orta':'Modéré', 'Yüksek':'Élevé', 'Semptomlarınız':'Vos symptômes',
  'Yaşadıklarınızı işaretleyin':'Cochez ce que vous ressentez', 'TAHMİNİ HESAPLA':'CALCULER L’ESTIMATION', 'Kan Testi ile Doğrulama':'Vérification par analyse sanguine',
  'Gerçek değerlerinizle kesin rapor':'Un rapport définitif avec vos valeurs réelles', 'Bu ölçüm hangisi?':'De quelle mesure s’agit-il ?', 'Raporda böyle etiketlenecek':'Voici comment il sera étiqueté dans le rapport',
  'Başlangıç ölçümü':'Mesure de référence', 'Kontrol (takip) ölçümü':'Mesure de suivi', 'Kan vermeden önce: numune koşulları':'Avant la prise de sang : conditions de prélèvement',
  'Kan':'Le sang', 'sabah 07:00–10:00':'doit être prélevé le matin entre 07:00 et 10:00', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':' ; la testostérone peut baisser jusqu’à 30 % au cours de la journée.',
  '8–12 saat açlık':'Jeûne de 8 à 12 heures', '; yalnızca su içebilirsiniz.':' ; vous ne pouvez boire que de l’eau.', 'Biotin (B7)':'Biotine (B7)',
  'içeren takviyeleri ölçümden en az':'Les compléments contenant de la biotine doivent être arrêtés au moins', '72 saat':'72 heures', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'avant l’analyse — ils peuvent fausser les résultats hormonaux.',
  'Son':'Au cours des', '48 saatte':'48 heures', 'ağır antrenman ve alkol olmasın.':'qui précèdent, évitez l’entraînement intense et l’alcool.',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'Reportez la mesure en cas de maladie aiguë comme de la fièvre ou une infection.', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'Un prélèvement réalisé sans ces conditions peut conduire à interpréter à tort un résultat bas.', 'Tahlilinizi yükleyin, biz okuyalım':'Importez votre bilan, nous le lisons',
  'En hızlı yol — elle giriş gerekmez':'Le plus rapide — aucune saisie manuelle', 'Tahlil PDF’i veya fotoğrafı':'PDF ou photo du bilan', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'Nous lisons les valeurs du PDF dans votre navigateur et les plaçons dans le formulaire. Le fichier n’est pas envoyé à un serveur.',
  'DOSYA SEÇ':'CHOISIR UN FICHIER', 'Tahlil metnini yapıştırayım':'Je colle le texte du bilan', 'Değerleri elle gireceğim':'Je saisis les valeurs manuellement',
  'Tahlil metni':'Texte du bilan', 'Metinden değerleri oku':'Lire les valeurs dans le texte', 'Yalnızca Total Testosteron zorunlu':'Seule la testostérone totale est obligatoire',
  'Total Testosteron':'Testostérone totale', 'Zorunlu':'Obligatoire', 'Opsiyonel':'Facultatif',
  'Serbest Testosteron':'Testostérone libre', 'Kortizol (sabah)':'Cortisol (matin)', 'Hepsi opsiyonel':'Tous facultatifs',
  'D Vitamini (25-OH)':'Vitamine D (25-OH)', 'Çinko':'Zinc', 'Sağlık verisi açık rızası':'Consentement pour les données de santé',
  'KVKK m.6 — özel nitelikli kişisel veri':'LPD art. 6 — données personnelles sensibles', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'Je consens au traitement des valeurs sanguines que je saisis (données de santé sensibles), sur', 'cihazımda':'mon appareil',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':', uniquement pour créer cette analyse. Les données ne sont pas envoyées à un serveur, ni stockées, ni partagées avec des tiers. Je peux retirer mon consentement à tout moment en fermant cette page.', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'Vous devez cocher la case de consentement pour continuer.', 'Testi nerede ve kaç günde yaptırırım?':'Où faire le test et en combien de temps ?',
  'Butona basmadan önce bilmeniz gerekenler':'Ce qu’il faut savoir avant d’appuyer sur le bouton', 'Nerede:':'Où :', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'Tout laboratoire privé ou hôpital public ; aucune ordonnance particulière n’est requise en dehors du rendez-vous.',
  'Ücret:':'Coût :', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'Les frais de traitement du laboratoire sont à votre charge. TestoTavan ne perçoit aucun frais et n’a aucun partenariat avec les laboratoires.', 'Sonuç süresi:':'Délai de résultat :',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'Le jour même à 2 jours ouvrés dans la plupart des laboratoires.', 'SGK:':'Sécurité sociale :', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'Il peut être pris en charge par la Sécurité sociale dans un hôpital public sur prescription médicale.',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'Les tarifs et conditions de rendez-vous varient d’un laboratoire à l’autre ; confirmez auprès de l’établissement avant l’intervention.', 'RAPORU OLUŞTUR':'CRÉER LE RAPPORT', 'Rapor 5 saniyede hazır ·':'Rapport prêt en 5 secondes ·',
  'veriler cihazınızdan çıkmaz':'vos données ne quittent jamais votre appareil', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'Le projet TestoTavan, notre approche et nos sources scientifiques', 'Referans aldığımız çalışmalar':'Les études auxquelles nous nous référons',
  'Özet:':'Résumé :', 'D Vitamini & Testosteron İlişkisi':'Vitamine D et testostérone', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'Chez les hommes prenant 3 332 UI/jour de vitamine D, la testostérone totale a augmenté de 25,2 % après 12 mois (de 10,7 ± 3,9 à 13,4 ± 4,7 nmol/L). Aucun changement n’a été observé dans le groupe placebo.',
  'Ashwagandha & Kortizol Azaltımı':'Ashwagandha et réduction du cortisol', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'Dans le groupe prenant 300 mg d’extrait KSM-66 d’ashwagandha (2 fois/jour), le cortisol sérique a baissé de 27,9 % après 60 jours. Les scores de stress ont chuté de 44 %.', 'Çinko Eksikliği & Hormon Sentezi':'Carence en zinc et synthèse hormonale',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'Chez de jeunes hommes présentant une carence modérée en zinc, une supplémentation de 20–40 mg/jour a produit une hausse marquée de la testostérone sérique après 6 mois.', 'Magnezyum & Serbest Testosteron Artışı':'Magnésium et hausse de la testostérone libre', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'Une supplémentation de 10 mg/kg de sulfate de magnésium pendant 4 semaines a augmenté la testostérone libre et totale, chez les participants sédentaires comme actifs.',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'Restriction de sommeil et baisse de la testostérone', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'Une semaine de restriction de sommeil (5 heures/nuit) chez de jeunes hommes a entraîné une baisse de 10 à 15 % de la testostérone diurne. Cet effet a été observé après une seule semaine.', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'Acides gras oméga-3 et santé hormonale',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'Chez des hommes infertiles prenant 1 840 mg de DHA en complément, la qualité du sperme s’est améliorée et les marqueurs de stress oxydatif ont diminué après 32 semaines.', 'Kreatin Monohidrat & Güç Artışı':'Créatine monohydrate et force', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'Associée à l’entraînement en résistance, une supplémentation en créatine monohydrate (5 g/jour) améliore la masse musculaire et la force de 5 à 15 %. C’est le complément sportif le plus étudié.',
  'Fenugreek (Çemen) & Serbest Testosteron':'Fenugrec et testostérone libre', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'Chez des hommes pratiquant l’entraînement en résistance et prenant 500 mg/jour d’extrait de fenugrec pendant 8 semaines, la testostérone libre a augmenté de 46 % et la masse grasse a diminué.', 'değildir':'n’est pas',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. Consultez toujours un professionnel de santé avant de commencer un complément. Cette plateforme est uniquement à but informatif.', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — Tous droits réservés © 2026', 'Geliştiren:':'Développé par :',
  'TestoTavan Rehber':'Guide TestoTavan', 'Okunma sayısı yükleniyor...':'Chargement du nombre de vues…', 'Sponsorlu içerik':'Contenu sponsorisé',
  'Semptom':'Symptômes', 'Doğrulama':'Vérification', 'Geçerli giriş aralığı:':'Plage de saisie acceptée :',
  'Lab normal aralığı:':'Plage normale du laboratoire :', 'Laboratuvar normal aralığı:':'Plage normale du laboratoire :', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— La testostérone totale est la somme de l’hormone liée et libre ; des mesures répétées sous 270 ng/dL sont considérées comme cliniquement basses.',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— C’est la fraction qui pénètre réellement dans les cellules ; elle correspond souvent mieux aux symptômes que la testostérone totale.', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— Quand la SHBG est élevée, la testostérone se lie à cette protéine et la testostérone libre diminue.', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— La LH est le signal du cerveau vers les testicules ; une LH élevée avec une testostérone basse oriente vers les testicules, une LH basse vers l’hypophyse.',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— La FSH régule la production de spermatozoïdes ; évaluée avec la LH, elle aide à identifier l’origine d’un résultat bas.', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— Une partie de la testostérone se transforme en estradiol dans le tissu adipeux ; un E2 élevé est associé à des variations de libido et à une sensibilité mammaire.', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— Un cortisol chroniquement élevé peut freiner la production de testostérone ; il doit être mesuré entre 07:00 et 10:00 le matin.',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— C’est le reflet des réserves de fer ; sous 30 ng/mL, fatigue et récupération difficile peuvent apparaître indépendamment de la testostérone.', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— La vitamine D est un cofacteur de la synthèse de testostérone ; moins de 30 ng/mL est considéré comme insuffisant.', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— Une B12 basse peut imiter une baisse d’énergie et de concentration indépendamment de la testostérone.',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— Une carence en zinc affaiblit directement le signal LH et la synthèse de testostérone.', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— Le magnésium peut soutenir la testostérone libre en réduisant la liaison à la SHBG.'
 },
 es: {
  'Doğal Testosteron Optimizasyonu':'Optimización natural de la testosterona', 'Dil':'Idioma', 'Dil seçin':'Seleccionar idioma',
  'Ana içeriğe geç':'Ir al contenido principal', 'Ana sayfaya dön':'Volver al inicio', 'Analiz adımları':'Pasos del análisis',
  'Ölçüm tipi':'Tipo de medición', 'Ana navigasyon':'Navegación principal', 'Reklam alanı':'Espacio publicitario',
  'Sponsor':'Patrocinador', 'Sponsor alanı':'Espacio para patrocinadores', 'Sponsor ol':'Hazte patrocinador',
  'İletişime geç':'Contactar', 'Detaylar':'Detalles', 'Laboratuvar iş birliği':'Colaboración con laboratorios',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'Aquí se publican el nombre de la marca, un texto breve y un enlace.', 'Hormon paneli kampanyaları için ayrılmış alan.':'Espacio reservado para campañas de perfiles hormonales.', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'Espacio reservado para marcas de suplementos y salud masculina.',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'Tu artículo se muestra aquí en todos nuestros idiomas.', 'Kişisel planınız':'Tu plan personal', 'Tahmin girdilerini değiştir':'Cambiar los datos de la estimación',
  'TestoTavan logosu':'Logotipo de TestoTavan', 'Semptom Analizi':'Análisis de síntomas', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'Estimamos un valor y un intervalo de confianza a partir de tus síntomas — tarda 2 minutos.',
  'Elimde kan testi var, doğrudan doğrulayayım':'Tengo un análisis de sangre; verifiquémoslo directamente', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'Sube el PDF de tu análisis; leeremos los valores y los compararemos con los rangos de referencia.', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'Mejorar el sueño, el peso, el entrenamiento y los micronutrientes que faltan puede apoyar el equilibrio hormonal. Como la respuesta varía de persona a persona, no prometemos un aumento numérico; primero medimos y luego revisamos.',
  'Tahmini hormon değerleriniz':'Tus valores hormonales estimados', 'Tahmin modelinin girdileri':'Datos del modelo de estimación', 'Ortalama Uyku':'Sueño promedio',
  '5 saat ve altı':'5 horas o menos', '6 saat':'6 horas', '7 saat':'7 horas',
  '8 saat ve üzeri':'8 horas o más', 'Stres Düzeyi':'Nivel de estrés', 'Düşük':'Bajo',
  'Orta':'Moderado', 'Yüksek':'Alto', 'Semptomlarınız':'Tus síntomas',
  'Yaşadıklarınızı işaretleyin':'Marca lo que experimentas', 'TAHMİNİ HESAPLA':'CALCULAR ESTIMACIÓN', 'Kan Testi ile Doğrulama':'Verificación con análisis de sangre',
  'Gerçek değerlerinizle kesin rapor':'Un informe definitivo con tus valores reales', 'Bu ölçüm hangisi?':'¿Qué medición es esta?', 'Raporda böyle etiketlenecek':'Así se etiquetará en el informe',
  'Başlangıç ölçümü':'Medición inicial', 'Kontrol (takip) ölçümü':'Medición de seguimiento', 'Kan vermeden önce: numune koşulları':'Antes de la extracción: condiciones de la muestra',
  'Kan':'La sangre', 'sabah 07:00–10:00':'debe extraerse por la mañana entre las 07:00 y las 10:00', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':'; la testosterona puede bajar hasta un 30 % durante el día.',
  '8–12 saat açlık':'Ayuno de 8 a 12 horas', '; yalnızca su içebilirsiniz.':'; solo puedes beber agua.', 'Biotin (B7)':'Biotina (B7)',
  'içeren takviyeleri ölçümden en az':'Los suplementos con biotina deben suspenderse al menos', '72 saat':'72 horas', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'antes del análisis: pueden distorsionar los resultados hormonales.',
  'Son':'En las últimas', '48 saatte':'48 horas', 'ağır antrenman ve alkol olmasın.':'evita el entrenamiento intenso y el alcohol.',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'Aplaza la medición durante una enfermedad aguda como fiebre o infección.', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'Una extracción sin estas condiciones puede llevar a interpretar erróneamente un resultado bajo.', 'Tahlilinizi yükleyin, biz okuyalım':'Sube tu análisis, nosotros lo leemos',
  'En hızlı yol — elle giriş gerekmez':'La vía más rápida: sin entrada manual', 'Tahlil PDF’i veya fotoğrafı':'PDF o foto del análisis', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'Leemos los valores del PDF en tu navegador y los colocamos en el formulario. El archivo no se envía a ningún servidor.',
  'DOSYA SEÇ':'ELEGIR ARCHIVO', 'Tahlil metnini yapıştırayım':'Pego el texto del análisis', 'Değerleri elle gireceğim':'Introduciré los valores manualmente',
  'Tahlil metni':'Texto del análisis', 'Metinden değerleri oku':'Leer valores del texto', 'Yalnızca Total Testosteron zorunlu':'Solo la testosterona total es obligatoria',
  'Total Testosteron':'Testosterona total', 'Zorunlu':'Obligatorio', 'Opsiyonel':'Opcional',
  'Serbest Testosteron':'Testosterona libre', 'Kortizol (sabah)':'Cortisol (mañana)', 'Hepsi opsiyonel':'Todos opcionales',
  'D Vitamini (25-OH)':'Vitamina D (25-OH)', 'Çinko':'Zinc', 'Sağlık verisi açık rızası':'Consentimiento para datos de salud',
  'KVKK m.6 — özel nitelikli kişisel veri':'LPD art. 6 — datos personales sensibles', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'Doy mi consentimiento para el tratamiento de los valores sanguíneos que introduzco (datos de salud sensibles), en', 'cihazımda':'mi dispositivo',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':', únicamente para crear este análisis. Los datos no se envían a un servidor, no se almacenan ni se comparten con terceros. Puedo retirar mi consentimiento en cualquier momento cerrando esta página.', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'Debes marcar la casilla de consentimiento para continuar.', 'Testi nerede ve kaç günde yaptırırım?':'¿Dónde hago el análisis y en cuánto tiempo?',
  'Butona basmadan önce bilmeniz gerekenler':'Lo que debes saber antes de pulsar el botón', 'Nerede:':'Dónde:', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'Cualquier laboratorio privado u hospital público; no se necesita una derivación especial aparte de la cita.',
  'Ücret:':'Coste:', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'La tarifa del laboratorio corre por tu cuenta. TestoTavan no cobra nada ni tiene alianzas con laboratorios.', 'Sonuç süresi:':'Plazo de resultado:',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'El mismo día o hasta 2 días hábiles en la mayoría de laboratorios.', 'SGK:':'Seguridad social:', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'Puede estar cubierto por la Seguridad Social en un hospital público con prescripción médica.',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'Las tarifas y condiciones de cita varían según el laboratorio; confirma con el centro antes de proceder.', 'RAPORU OLUŞTUR':'CREAR INFORME', 'Rapor 5 saniyede hazır ·':'Informe listo en 5 segundos ·',
  'veriler cihazınızdan çıkmaz':'tus datos nunca salen de tu dispositivo', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'El proyecto TestoTavan, nuestro enfoque y fuentes científicas', 'Referans aldığımız çalışmalar':'Estudios en los que nos basamos',
  'Özet:':'Resumen:', 'D Vitamini & Testosteron İlişkisi':'Vitamina D y testosterona', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'En hombres que tomaban 3.332 UI/día de vitamina D, la testosterona total aumentó un 25,2 % tras 12 meses (de 10,7 ± 3,9 a 13,4 ± 4,7 nmol/L). No se observaron cambios en el grupo placebo.',
  'Ashwagandha & Kortizol Azaltımı':'Ashwagandha y reducción del cortisol', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'En el grupo que tomaba 300 mg de extracto KSM-66 de ashwagandha (2 veces al día), el cortisol sérico bajó un 27,9 % tras 60 días. Las puntuaciones de estrés cayeron un 44 %.', 'Çinko Eksikliği & Hormon Sentezi':'Deficiencia de zinc y síntesis hormonal',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'En hombres jóvenes con deficiencia moderada de zinc, un suplemento de 20–40 mg/día produjo un aumento notable de la testosterona sérica tras 6 meses.', 'Magnezyum & Serbest Testosteron Artışı':'Magnesio y aumento de la testosterona libre', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'La suplementación con 10 mg/kg de sulfato de magnesio durante 4 semanas aumentó la testosterona libre y total tanto en sedentarios como en activos.',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'Restricción de sueño y caída de testosterona', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'Una semana de restricción del sueño (5 horas/noche) en hombres jóvenes redujo la testosterona diurna entre un 10 y un 15 %. El efecto se observó tras solo una semana.', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'Ácidos grasos omega-3 y salud hormonal',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'En hombres infértiles que tomaban 1.840 mg de DHA, la calidad del semen mejoró y los marcadores de estrés oxidativo disminuyeron tras 32 semanas.', 'Kreatin Monohidrat & Güç Artışı':'Creatina monohidrato y fuerza', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'Junto con el entrenamiento de fuerza, la creatina monohidrato (5 g/día) mejora la masa muscular y la fuerza entre un 5 y un 15 %. Es el suplemento deportivo más estudiado.',
  'Fenugreek (Çemen) & Serbest Testosteron':'Fenogreco y testosterona libre', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'En hombres entrenados en fuerza que tomaron 500 mg/día de extracto de fenogreco durante 8 semanas, la testosterona libre aumentó un 46 % y el porcentaje de grasa corporal disminuyó.', 'değildir':'no es',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. Consulta siempre a un profesional sanitario antes de empezar cualquier suplemento. Esta plataforma tiene únicamente fines informativos.', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — Todos los derechos reservados © 2026', 'Geliştiren:':'Desarrollado por:',
  'TestoTavan Rehber':'Guía TestoTavan', 'Okunma sayısı yükleniyor...':'Cargando número de visitas...', 'Sponsorlu içerik':'Contenido patrocinado',
  'Semptom':'Síntomas', 'Doğrulama':'Verificación', 'Geçerli giriş aralığı:':'Rango de entrada aceptado:',
  'Lab normal aralığı:':'Rango normal del laboratorio:', 'Laboratuvar normal aralığı:':'Rango normal del laboratorio:', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— La testosterona total es la suma de la hormona ligada y libre; mediciones repetidas por debajo de 270 ng/dL se consideran clínicamente bajas.',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— Es la fracción que realmente entra en las células; suele correlacionarse mejor con los síntomas que la testosterona total.', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— Si la SHBG está alta, la testosterona se une a esta proteína y la testosterona libre baja.', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— La LH es la señal del cerebro a los testículos; una LH alta con testosterona baja apunta a los testículos, y una LH baja a la hipófisis.',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— La FSH regula la producción de espermatozoides; junto con la LH ayuda a distinguir el origen de un resultado bajo.', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— Parte de la testosterona se convierte en estradiol en el tejido graso; un E2 alto se asocia con cambios de libido y sensibilidad en el pecho.', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— Un cortisol crónicamente alto puede frenar la producción de testosterona; debe medirse entre las 07:00 y las 10:00 de la mañana.',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— Refleja las reservas de hierro; por debajo de 30 ng/mL pueden aparecer fatiga y mala recuperación con independencia de la testosterona.', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— La vitamina D es un cofactor en la síntesis de testosterona; menos de 30 ng/mL se considera insuficiente.', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— Una B12 baja puede imitar pérdida de energía y concentración con independencia de la testosterona.',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— La deficiencia de zinc debilita directamente la señal de LH y la síntesis de testosterona.', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— El magnesio puede apoyar la testosterona libre al reducir la unión a la SHBG.'
 },
 bg: {
  'Doğal Testosteron Optimizasyonu':'Естествена оптимизация на тестостерона', 'Dil':'Език', 'Dil seçin':'Изберете език',
  'Ana içeriğe geç':'Към основното съдържание', 'Ana sayfaya dön':'Обратно към началото', 'Analiz adımları':'Стъпки на анализа',
  'Ölçüm tipi':'Вид измерване', 'Ana navigasyon':'Основна навигация', 'Reklam alanı':'Рекламно пространство',
  'Sponsor':'Спонсор', 'Sponsor alanı':'Спонсорско пространство', 'Sponsor ol':'Станете спонсор',
  'İletişime geç':'Свържете се с нас', 'Detaylar':'Подробности', 'Laboratuvar iş birliği':'Партньорство с лаборатория',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'Тук се публикуват име на марка, кратък текст и връзка.', 'Hormon paneli kampanyaları için ayrılmış alan.':'Резервирано място за кампании за хормонални панели.', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'Резервирано място за марки за добавки и мъжко здраве.',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'Вашата статия се показва тук на всички наши езици.', 'Kişisel planınız':'Вашият личен план', 'Tahmin girdilerini değiştir':'Промяна на входните данни',
  'TestoTavan logosu':'Лого на TestoTavan', 'Semptom Analizi':'Анализ на симптомите', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'Оценяваме стойност и доверителен интервал по вашите симптоми — отнема 2 минути.',
  'Elimde kan testi var, doğrudan doğrulayayım':'Имам кръвен тест, да го потвърдим директно', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'Качете PDF на изследването; прочитаме стойностите и ги сравняваме с референтните диапазони.', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'Подобряването на съня, теглото, тренировките и липсващите микронутриенти подпомага хормоналния баланс. Тъй като реакциите са индивидуални, не обещаваме числено увеличение; първо измерваме, после проверяваме.',
  'Tahmini hormon değerleriniz':'Вашите прогнозни хормонални стойности', 'Tahmin modelinin girdileri':'Входни данни на модела', 'Ortalama Uyku':'Среден сън',
  '5 saat ve altı':'5 часа или по-малко', '6 saat':'6 часа', '7 saat':'7 часа',
  '8 saat ve üzeri':'8 часа или повече', 'Stres Düzeyi':'Ниво на стрес', 'Düşük':'Ниско',
  'Orta':'Средно', 'Yüksek':'Високо', 'Semptomlarınız':'Вашите симптоми',
  'Yaşadıklarınızı işaretleyin':'Отбележете какво изпитвате', 'TAHMİNİ HESAPLA':'ИЗЧИСЛИ ОЦЕНКАТА', 'Kan Testi ile Doğrulama':'Потвърждение с кръвен тест',
  'Gerçek değerlerinizle kesin rapor':'Точен доклад с вашите реални стойности', 'Bu ölçüm hangisi?':'Кое измерване е това?', 'Raporda böyle etiketlenecek':'Така ще бъде отбелязано в доклада',
  'Başlangıç ölçümü':'Изходно измерване', 'Kontrol (takip) ölçümü':'Контролно измерване', 'Kan vermeden önce: numune koşulları':'Преди кръвопускане: условия на пробата',
  'Kan':'Кръвта', 'sabah 07:00–10:00':'трябва да се вземе сутрин между 07:00 и 10:00', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':'; тестостеронът може да падне до 30 % през деня.',
  '8–12 saat açlık':'8–12 часа гладуване', '; yalnızca su içebilirsiniz.':'; можете да пиете само вода.', 'Biotin (B7)':'Биотин (B7)',
  'içeren takviyeleri ölçümden en az':'Добавки с биотин трябва да се спрат поне', '72 saat':'72 часа', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'преди изследването — те изкривяват хормоналните резултати.',
  'Son':'През последните', '48 saatte':'48 часа', 'ağır antrenman ve alkol olmasın.':'избягвайте тежки тренировки и алкохол.',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'Отложете измерването при остро заболяване като температура или инфекция.', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'Взета без тези условия кръв може да доведе до грешна интерпретация на нисък резултат.', 'Tahlilinizi yükleyin, biz okuyalım':'Качете изследването, ние го прочитаме',
  'En hızlı yol — elle giriş gerekmez':'Най-бързият начин — без ръчно въвеждане', 'Tahlil PDF’i veya fotoğrafı':'PDF или снимка на изследването', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'Прочитаме стойностите от PDF в браузъра ви и ги поставяме във формуляра. Файлът не се изпраща на сървър.',
  'DOSYA SEÇ':'ИЗБЕРЕТЕ ФАЙЛ', 'Tahlil metnini yapıştırayım':'Да поставя текста на изследването', 'Değerleri elle gireceğim':'Ще въведа стойностите ръчно',
  'Tahlil metni':'Текст на изследването', 'Metinden değerleri oku':'Прочети стойностите от текста', 'Yalnızca Total Testosteron zorunlu':'Задължителен е само общият тестостерон',
  'Total Testosteron':'Общ тестостерон', 'Zorunlu':'Задължително', 'Opsiyonel':'По избор',
  'Serbest Testosteron':'Свободен тестостерон', 'Kortizol (sabah)':'Кортизол (сутрин)', 'Hepsi opsiyonel':'Всички по избор',
  'D Vitamini (25-OH)':'Витамин D (25-OH)', 'Çinko':'Цинк', 'Sağlık verisi açık rızası':'Съгласие за здравни данни',
  'KVKK m.6 — özel nitelikli kişisel veri':'ЗЗЛД чл. 6 — чувствителни лични данни', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'Давам съгласие за обработване на въведените от мен кръвни стойности (чувствителни здравни данни) на', 'cihazımda':'моето устройство',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':', единствено за създаване на този анализ. Данните не се изпращат на сървър, не се съхраняват и не се споделят с трети лица. Мога да оттегля съгласието си по всяко време, като затворя тази страница.', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'Трябва да отметнете полето за съгласие, за да продължите.', 'Testi nerede ve kaç günde yaptırırım?':'Къде и за колко време се прави изследването?',
  'Butona basmadan önce bilmeniz gerekenler':'Какво трябва да знаете преди натискане на бутона', 'Nerede:':'Къде:', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'Всяка частна лаборатория или държавна болница; извън часа специално направление не е нужно.',
  'Ücret:':'Цена:', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'Таксата на лабораторията е за ваша сметка. TestoTavan не взема такса и няма партньорства с лаборатории.', 'Sonuç süresi:':'Срок за резултат:',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'Още същия ден до 2 работни дни в повечето лаборатории.', 'SGK:':'Здравна каса:', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'Може да е покрито от здравната каса в държавна болница при лекарско назначение.',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'Актуалните цени и условия за час варират според лабораторията; потвърдете в институцията преди процедурата.', 'RAPORU OLUŞTUR':'СЪЗДАЙ ДОКЛАД', 'Rapor 5 saniyede hazır ·':'Докладът е готов за 5 секунди ·',
  'veriler cihazınızdan çıkmaz':'данните не напускат устройството ви', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'Проектът TestoTavan, нашият подход и научните източници', 'Referans aldığımız çalışmalar':'Проучванията, на които се позоваваме',
  'Özet:':'Обобщение:', 'D Vitamini & Testosteron İlişkisi':'Витамин D и тестостерон', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'При мъже, приемали 3332 IU/ден витамин D, общият тестостерон се повишава с 25,2 % след 12 месеца (от 10,7±3,9 до 13,4±4,7 nmol/L). В плацебо групата не се наблюдава промяна.',
  'Ashwagandha & Kortizol Azaltımı':'Ашваганда и понижаване на кортизола', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'В групата, приемала 300 mg екстракт KSM-66 ашваганда (2 пъти дневно), серумният кортизол спадна с 27,9 % след 60 дни. Оценките за стрес паднаха с 44 %.', 'Çinko Eksikliği & Hormon Sentezi':'Дефицит на цинк и хормонален синтез',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'При млади мъже с умерен дефицит на цинк приемът на 20–40 mg/ден доведе до значимо повишаване на серумния тестостерон след 6 месеца.', 'Magnezyum & Serbest Testosteron Artışı':'Магнезий и повишен свободен тестостерон', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'Приемът на 10 mg/kg магнезиев сулфат в продължение на 4 седмици повиши свободния и общия тестостерон както при заседнали, така и при активни участници.',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'Ограничен сън и понижен тестостерон', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'Една седмица ограничен сън (5 часа на нощ) при млади мъже доведе до 10–15 % спад на дневния тестостерон. Ефектът се наблюдава само след седмица.', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'Омега-3 мастни киселини и хормонално здраве',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'При безплодни мъже, приемали 1840 mg DHA, качеството на спермата се подобри, а маркерите на оксидативен стрес намаляха след 32 седмици.', 'Kreatin Monohidrat & Güç Artışı':'Креатин монохидрат и сила', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'Прилаган срещу съпротивителни тренировки, креатин монохидрат (5 g/ден) подобрява мускулната маса и силата с 5–15 %. Това е най-изследваната спортна добавка.',
  'Fenugreek (Çemen) & Serbest Testosteron':'Сминдух и свободен тестостерон', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'При мъже, трениращи с тежести, приемали 500 mg/ден екстракт от сминдух за 8 седмици, свободният тестостерон се повиши с 46 %, а телесните мазнини намаляха.', 'değildir':'не е',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. Винаги се консултирайте с медицински специалист, преди да започнете каквато и да е добавка. Тази платформа е само с информационна цел.', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — Всички права запазени © 2026', 'Geliştiren:':'Разработчик:',
  'TestoTavan Rehber':'Ръководство TestoTavan', 'Okunma sayısı yükleniyor...':'Зареждане на броя прегледи...', 'Sponsorlu içerik':'Спонсорирано съдържание',
  'Semptom':'Симптоми', 'Doğrulama':'Потвърждение', 'Geçerli giriş aralığı:':'Допустим диапазон на въвеждане:',
  'Lab normal aralığı:':'Нормален лабораторен диапазон:', 'Laboratuvar normal aralığı:':'Нормален лабораторен диапазон:', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— Общият тестостерон е сборът от свързания и свободния хормон; повтарящи се стойности под 270 ng/dL се считат за клинично ниски.',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— Това е частта, която действително влиза в клетките; често съвпада по-добре със симптомите от общия тестостерон.', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— При висок SHBG тестостеронът се свързва с този протеин и свободният тестостерон намалява.', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— LH е сигналът от мозъка към тестисите; високо LH при нисък тестостерон насочва към тестисите, а ниско LH — към хипофизата.',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— FSH регулира производството на сперма; заедно с LH помага да се определи източникът на нисък резултат.', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— Част от тестостерона се превръща в естрадиол в мастната тъкан; високият E2 е свързан с промени в либидото и чувствителност в гърдите.', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— Хронично високият кортизол може да потисне производството на тестостерон; измерва се между 07:00 и 10:00 сутринта.',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— Отразява запасите от желязо; под 30 ng/mL умора и бавно възстановяване могат да се появят независимо от тестостерона.', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— Витамин D е кофактор в синтеза на тестостерон; под 30 ng/mL се счита за недостатъчно.', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— Ниският B12 може да имитира загуба на енергия и концентрация независимо от тестостерона.',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— Дефицитът на цинк пряко отслабва LH сигнала и синтеза на тестостерон.', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— Магнезият може да подпомогне свободния тестостерон, като намалява свързването с SHBG.'
 },
 ru: {
  'Doğal Testosteron Optimizasyonu':'Естественная оптимизация тестостерона', 'Dil':'Язык', 'Dil seçin':'Выберите язык',
  'Ana içeriğe geç':'Перейти к основному содержанию', 'Ana sayfaya dön':'Вернуться на главную', 'Analiz adımları':'Этапы анализа',
  'Ölçüm tipi':'Тип измерения', 'Ana navigasyon':'Основная навигация', 'Reklam alanı':'Рекламный блок',
  'Sponsor':'Спонсор', 'Sponsor alanı':'Блок спонсора', 'Sponsor ol':'Стать спонсором',
  'İletişime geç':'Связаться с нами', 'Detaylar':'Подробнее', 'Laboratuvar iş birliği':'Партнёрство с лабораторией',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'Здесь публикуются название бренда, короткий текст и ссылка.', 'Hormon paneli kampanyaları için ayrılmış alan.':'Зарезервировано для кампаний гормональных панелей.', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'Зарезервировано для брендов добавок и мужского здоровья.',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'Ваша статья отображается здесь на всех наших языках.', 'Kişisel planınız':'Ваш личный план', 'Tahmin girdilerini değiştir':'Изменить входные данные',
  'TestoTavan logosu':'Логотип TestoTavan', 'Semptom Analizi':'Анализ симптомов', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'Мы оцениваем значение и доверительный интервал по вашим симптомам — это занимает 2 минуты.',
  'Elimde kan testi var, doğrudan doğrulayayım':'У меня есть анализ крови, давайте проверим напрямую', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'Загрузите PDF с результатами — мы прочитаем значения и сравним их с референсными диапазонами.', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'Улучшение сна, веса, тренировок и восполнение дефицита микронутриентов поддерживают гормональный баланс. Поскольку реакция индивидуальна, мы не обещаем численного роста: сначала измеряем, потом проверяем.',
  'Tahmini hormon değerleriniz':'Ваши предполагаемые гормональные значения', 'Tahmin modelinin girdileri':'Входные данные модели', 'Ortalama Uyku':'Средний сон',
  '5 saat ve altı':'5 часов и менее', '6 saat':'6 часов', '7 saat':'7 часов',
  '8 saat ve üzeri':'8 часов и более', 'Stres Düzeyi':'Уровень стресса', 'Düşük':'Низкий',
  'Orta':'Средний', 'Yüksek':'Высокий', 'Semptomlarınız':'Ваши симптомы',
  'Yaşadıklarınızı işaretleyin':'Отметьте, что вы испытываете', 'TAHMİNİ HESAPLA':'РАССЧИТАТЬ ОЦЕНКУ', 'Kan Testi ile Doğrulama':'Проверка по анализу крови',
  'Gerçek değerlerinizle kesin rapor':'Точный отчёт по вашим реальным значениям', 'Bu ölçüm hangisi?':'Какое это измерение?', 'Raporda böyle etiketlenecek':'Так это будет отмечено в отчёте',
  'Başlangıç ölçümü':'Исходное измерение', 'Kontrol (takip) ölçümü':'Контрольное измерение', 'Kan vermeden önce: numune koşulları':'Перед сдачей крови: условия взятия',
  'Kan':'Кровь', 'sabah 07:00–10:00':'сдаётся утром между 07:00 и 10:00', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':'; тестостерон может снижаться до 30 % в течение дня.',
  '8–12 saat açlık':'Голодание 8–12 часов', '; yalnızca su içebilirsiniz.':'; можно пить только воду.', 'Biotin (B7)':'Биотин (B7)',
  'içeren takviyeleri ölçümden en az':'Добавки с биотином нужно отменить не менее чем за', '72 saat':'72 часа', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'до анализа — они искажают гормональные результаты.',
  'Son':'В последние', '48 saatte':'48 часов', 'ağır antrenman ve alkol olmasın.':'избегайте тяжёлых тренировок и алкоголя.',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'Отложите измерение при остром заболевании — температуре или инфекции.', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'Кровь, сданная без этих условий, может привести к неверной трактовке низкого результата.', 'Tahlilinizi yükleyin, biz okuyalım':'Загрузите анализ — мы его прочитаем',
  'En hızlı yol — elle giriş gerekmez':'Самый быстрый способ — без ручного ввода', 'Tahlil PDF’i veya fotoğrafı':'PDF или фото анализа', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'Мы читаем значения из PDF в вашем браузере и подставляем их в форму. Файл не отправляется на сервер.',
  'DOSYA SEÇ':'ВЫБРАТЬ ФАЙЛ', 'Tahlil metnini yapıştırayım':'Вставлю текст анализа', 'Değerleri elle gireceğim':'Введу значения вручную',
  'Tahlil metni':'Текст анализа', 'Metinden değerleri oku':'Прочитать значения из текста', 'Yalnızca Total Testosteron zorunlu':'Обязателен только общий тестостерон',
  'Total Testosteron':'Общий тестостерон', 'Zorunlu':'Обязательно', 'Opsiyonel':'Необязательно',
  'Serbest Testosteron':'Свободный тестостерон', 'Kortizol (sabah)':'Кортизол (утром)', 'Hepsi opsiyonel':'Все необязательны',
  'D Vitamini (25-OH)':'Витамин D (25-OH)', 'Çinko':'Цинк', 'Sağlık verisi açık rızası':'Согласие на обработку медицинских данных',
  'KVKK m.6 — özel nitelikli kişisel veri':'ЗЗПД ст. 6 — чувствительные персональные данные', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'Я даю согласие на обработку введённых мной показателей крови (чувствительные данные о здоровье) на', 'cihazımda':'моём устройстве',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':', исключительно для создания этого анализа. Данные не отправляются на сервер, не сохраняются и не передаются третьим лицам. Я могу отозвать согласие в любой момент, закрыв эту страницу.', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'Чтобы продолжить, отметьте поле согласия.', 'Testi nerede ve kaç günde yaptırırım?':'Где сдать анализ и сколько это займёт?',
  'Butona basmadan önce bilmeniz gerekenler':'Что важно знать перед нажатием кнопки', 'Nerede:':'Где:', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'Любая частная лаборатория или государственная больница; помимо записи, особого направления не требуется.',
  'Ücret:':'Стоимость:', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'Оплату лаборатории вы берёте на себя. TestoTavan не взимает плату и не имеет партнёрств с лабораториями.', 'Sonuç süresi:':'Срок результата:',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'В тот же день или до 2 рабочих дней в большинстве лабораторий.', 'SGK:':'Соцстрах:', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'Может покрываться соцстрахом в государственной больнице при наличии назначения врача.',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'Актуальные цены и условия записи различаются; уточните в учреждении до процедуры.', 'RAPORU OLUŞTUR':'СОЗДАТЬ ОТЧЁТ', 'Rapor 5 saniyede hazır ·':'Отчёт готов за 5 секунд ·',
  'veriler cihazınızdan çıkmaz':'данные не покидают ваше устройство', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'Проект TestoTavan, наш подход и научные источники', 'Referans aldığımız çalışmalar':'Исследования, на которые мы ссылаемся',
  'Özet:':'Итог:', 'D Vitamini & Testosteron İlişkisi':'Витамин D и тестостерон', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'У мужчин, принимавших 3332 МЕ витамина D в день, общий тестостерон вырос на 25,2 % через 12 месяцев (с 10,7±3,9 до 13,4±4,7 нмоль/л). В группе плацебо изменений не наблюдалось.',
  'Ashwagandha & Kortizol Azaltımı':'Ашваганда и снижение кортизола', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'В группе, принимавшей 300 мг экстракта KSM-66 ашваганды (2 раза в день), кортизол в крови снизился на 27,9 % через 60 дней. Показатели стресса упали на 44 %.', 'Çinko Eksikliği & Hormon Sentezi':'Дефицит цинка и синтез гормонов',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'У молодых мужчин с умеренным дефицитом цинка приём 20–40 мг/день дал выраженный рост тестостерона в крови через 6 месяцев.', 'Magnezyum & Serbest Testosteron Artışı':'Магний и рост свободного тестостерона', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'Приём 10 мг/кг сульфата магния в течение 4 недель повысил свободный и общий тестостерон и у малоподвижных, и у активных участников.',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'Ограничение сна и падение тестостерона', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'Неделя ограничения сна (5 часов в сутки) у молодых мужчин привела к снижению дневного тестостерона на 10–15 %. Эффект наблюдался уже через неделю.', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'Омега-3 жирные кислоты и гормональное здоровье',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'У мужчин с бесплодием приём 1840 мг DHA улучшил качество спермы и снизил маркеры окислительного стресса через 32 недели.', 'Kreatin Monohidrat & Güç Artışı':'Креатин моногидрат и сила', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'В сочетании с силовыми тренировками креатин моногидрат (5 г/день) увеличивает мышечную массу и силу на 5–15 %. Это самая изученная спортивная добавка.',
  'Fenugreek (Çemen) & Serbest Testosteron':'Пажитник и свободный тестостерон', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'У мужчин, тренирующихся с отягощениями и принимавших 500 мг/день экстракта пажитника 8 недель, свободный тестостерон вырос на 46 %, а процент жира снизился.', 'değildir':'не является',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. Перед началом приёма любых добавок обязательно проконсультируйтесь с врачом. Эта платформа носит исключительно информационный характер.', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — Все права защищены © 2026', 'Geliştiren:':'Разработчик:',
  'TestoTavan Rehber':'Руководство TestoTavan', 'Okunma sayısı yükleniyor...':'Загрузка числа просмотров…', 'Sponsorlu içerik':'Спонсорский контент',
  'Semptom':'Симптомы', 'Doğrulama':'Проверка', 'Geçerli giriş aralığı:':'Допустимый диапазон ввода:',
  'Lab normal aralığı:':'Норма лабораторного диапазона:', 'Laboratuvar normal aralığı:':'Норма лабораторного диапазона:', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— Общий тестостерон — сумма связанного и свободного гормона; повторные значения ниже 270 нг/дл считаются клинически низкими.',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— Это фракция, которая действительно проникает в клетки; она чаще лучше соответствует симптомам, чем общий тестостерон.', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— При высоком ГСПГ тестостерон связывается с этим белком, и свободный тестостерон падает.', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— ЛГ — сигнал от мозга к яичкам; высокий ЛГ при низком тестостероне указывает на яички, низкий ЛГ — на гипофиз.',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— ФСГ регулирует выработку спермы; в сочетании с ЛГ помогает определить причину низкого результата.', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— Часть тестостерона превращается в эстрадиол в жировой ткани; высокий E2 связан с изменениями либидо и чувствительностью груди.', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— Хронически высокий кортизол может подавлять выработку тестостерона; измерять его следует между 07:00 и 10:00 утра.',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— Отражает запасы железа; ниже 30 нг/мл усталость и плохое восстановление возникают независимо от тестостерона.', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— Витамин D — кофактор синтеза тестостерона; менее 30 нг/мл считается недостаточностью.', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— Низкий B12 может имитировать потерю энергии и концентрации независимо от тестостерона.',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— Дефицит цинка напрямую ослабляет сигнал ЛГ и синтез тестостерона.', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— Магний может поддерживать свободный тестостерон, снижая связывание с ГСПГ.'
 },
 hi: {
  'Doğal Testosteron Optimizasyonu':'प्राकृतिक टेस्टोस्टेरोन अनुकूलन', 'Dil':'भाषा', 'Dil seçin':'भाषा चुनें',
  'Ana içeriğe geç':'मुख्य सामग्री पर जाएँ', 'Ana sayfaya dön':'होम पर लौटें', 'Analiz adımları':'विश्लेषण चरण',
  'Ölçüm tipi':'माप का प्रकार', 'Ana navigasyon':'मुख्य नेविगेशन', 'Reklam alanı':'विज्ञापन क्षेत्र',
  'Sponsor':'प्रायोजक', 'Sponsor alanı':'प्रायोजक क्षेत्र', 'Sponsor ol':'प्रायोजक बनें',
  'İletişime geç':'संपर्क करें', 'Detaylar':'विवरण', 'Laboratuvar iş birliği':'प्रयोगशाला साझेदारी',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'यहाँ ब्रांड नाम, छोटा पाठ और लिंक प्रकाशित होता है।', 'Hormon paneli kampanyaları için ayrılmış alan.':'हार्मोन पैनल अभियानों के लिए आरक्षित स्थान।', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'सप्लीमेंट और पुरुष स्वास्थ्य ब्रांडों के लिए आरक्षित स्थान।',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'आपका लेख यहाँ हमारी सभी भाषाओं में दिखता है।', 'Kişisel planınız':'आपकी व्यक्तिगत योजना', 'Tahmin girdilerini değiştir':'अनुमान इनपुट बदलें',
  'TestoTavan logosu':'TestoTavan लोगो', 'Semptom Analizi':'लक्षण विश्लेषण', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'हम आपके लक्षणों से अनुमानित मान और विश्वास अंतराल निकालते हैं — इसमें 2 मिनट लगते हैं।',
  'Elimde kan testi var, doğrudan doğrulayayım':'मेरे पास रक्त रिपोर्ट है, सीधे जाँचते हैं', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'अपनी लैब रिपोर्ट का PDF अपलोड करें; हम मान पढ़कर संदर्भ सीमाओं से तुलना करते हैं।', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'नींद, वज़न, ट्रेनिंग और कमी वाले सूक्ष्म पोषक तत्वों में सुधार हार्मोनल संतुलन में सहायक हो सकता है। प्रतिक्रिया व्यक्ति-दर-व्यक्ति बदलती है, इसलिए हम संख्यात्मक वृद्धि का वादा नहीं करते; पहले मापते हैं, फिर जाँचते हैं।',
  'Tahmini hormon değerleriniz':'आपके अनुमानित हार्मोन मान', 'Tahmin modelinin girdileri':'अनुमान मॉडल के इनपुट', 'Ortalama Uyku':'औसत नींद',
  '5 saat ve altı':'5 घंटे या कम', '6 saat':'6 घंटे', '7 saat':'7 घंटे',
  '8 saat ve üzeri':'8 घंटे या अधिक', 'Stres Düzeyi':'तनाव स्तर', 'Düşük':'कम',
  'Orta':'मध्यम', 'Yüksek':'उच्च', 'Semptomlarınız':'आपके लक्षण',
  'Yaşadıklarınızı işaretleyin':'जो अनुभव करते हैं उसे चुनें', 'TAHMİNİ HESAPLA':'अनुमान निकालें', 'Kan Testi ile Doğrulama':'रक्त परीक्षण से सत्यापन',
  'Gerçek değerlerinizle kesin rapor':'आपके वास्तविक मानों के साथ सटीक रिपोर्ट', 'Bu ölçüm hangisi?':'यह कौन-सा माप है?', 'Raporda böyle etiketlenecek':'रिपोर्ट में ऐसे लेबल होगा',
  'Başlangıç ölçümü':'आधार माप', 'Kontrol (takip) ölçümü':'फ़ॉलो-अप माप', 'Kan vermeden önce: numune koşulları':'रक्त निकलवाने से पहले: नमूना शर्तें',
  'Kan':'रक्त', 'sabah 07:00–10:00':'सुबह 07:00–10:00 के बीच देना चाहिए', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':'; दिन में टेस्टोस्टेरोन 30% तक गिर सकता है।',
  '8–12 saat açlık':'8–12 घंटे का उपवास', '; yalnızca su içebilirsiniz.':'; केवल पानी पी सकते हैं।', 'Biotin (B7)':'बायोटिन (B7)',
  'içeren takviyeleri ölçümden en az':'बायोटिन युक्त सप्लीमेंट परीक्षण से कम से कम', '72 saat':'72 घंटे', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'पहले बंद कर दें — ये हार्मोन परिणामों को गलत दिखाते हैं।',
  'Son':'पिछले', '48 saatte':'48 घंटे', 'ağır antrenman ve alkol olmasın.':'में कड़ी ट्रेनिंग और शराब से बचें।',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'बुखार या संक्रमण जैसी तीव्र बीमारी के दौरान माप टालें।', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'इन शर्तों के बिना लिया गया रक्त कम परिणाम को गलत समझने का कारण बन सकता है।', 'Tahlilinizi yükleyin, biz okuyalım':'अपनी रिपोर्ट अपलोड करें, हम पढ़ लेंगे',
  'En hızlı yol — elle giriş gerekmez':'सबसे तेज़ तरीका — मैनुअल प्रविष्टि की ज़रूरत नहीं', 'Tahlil PDF’i veya fotoğrafı':'रिपोर्ट का PDF या फ़ोटो', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'हम PDF के मान आपके ब्राउज़र में पढ़कर फ़ॉर्म में भर देते हैं। फ़ाइल सर्वर पर नहीं भेजी जाती।',
  'DOSYA SEÇ':'फ़ाइल चुनें', 'Tahlil metnini yapıştırayım':'रिपोर्ट का पाठ चिपकाऊँ', 'Değerleri elle gireceğim':'मैं मान स्वयं भरूँगा',
  'Tahlil metni':'रिपोर्ट पाठ', 'Metinden değerleri oku':'पाठ से मान पढ़ें', 'Yalnızca Total Testosteron zorunlu':'केवल कुल टेस्टोस्टेरोन आवश्यक है',
  'Total Testosteron':'कुल टेस्टोस्टेरोन', 'Zorunlu':'आवश्यक', 'Opsiyonel':'वैकल्पिक',
  'Serbest Testosteron':'मुक्त टेस्टोस्टेरोन', 'Kortizol (sabah)':'कोर्टिसोल (सुबह)', 'Hepsi opsiyonel':'सभी वैकल्पिक',
  'D Vitamini (25-OH)':'विटामिन D (25-OH)', 'Çinko':'ज़िंक', 'Sağlık verisi açık rızası':'स्वास्थ्य डेटा सहमति',
  'KVKK m.6 — özel nitelikli kişisel veri':'PDPL अनुच्छेद 6 — संवेदनशील व्यक्तिगत डेटा', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'मैं अपने द्वारा दर्ज रक्त मानों (संवेदनशील स्वास्थ्य डेटा) के', 'cihazımda':'मेरे डिवाइस',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':'पर केवल इस विश्लेषण को बनाने के लिए प्रसंस्करण हेतु सहमति देता/देती हूँ। डेटा सर्वर पर नहीं भेजा जाता, सहेजा नहीं जाता और तीसरे पक्ष से साझा नहीं किया जाता। मैं यह पृष्ठ बंद करके कभी भी सहमति वापस ले सकता/सकती हूँ।', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'जारी रखने के लिए सहमति बॉक्स चुनना आवश्यक है।', 'Testi nerede ve kaç günde yaptırırım?':'परीक्षण कहाँ और कितने दिन में होगा?',
  'Butona basmadan önce bilmeniz gerekenler':'बटन दबाने से पहले जानें', 'Nerede:':'कहाँ:', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'कोई भी निजी प्रयोगशाला या सरकारी अस्पताल; अपॉइंटमेंट के अलावा किसी विशेष रेफ़रल की ज़रूरत नहीं।',
  'Ücret:':'शुल्क:', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'प्रयोगशाला का शुल्क आपका है। TestoTavan कोई शुल्क नहीं लेता और प्रयोगशालाओं से साझेदारी नहीं है।', 'Sonuç süresi:':'परिणाम समय:',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'अधिकांश प्रयोगशालाओं में उसी दिन से 2 कार्यदिवस तक।', 'SGK:':'सामाजिक सुरक्षा:', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'चिकित्सक के पर्चे पर सरकारी अस्पताल में सामाजिक सुरक्षा के अंतर्गत आ सकता है।',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'वर्तमान शुल्क और अपॉइंटमेंट शर्तें प्रयोगशाला के अनुसार बदलती हैं; प्रक्रिया से पहले संस्थान से पुष्टि करें।', 'RAPORU OLUŞTUR':'रिपोर्ट बनाएँ', 'Rapor 5 saniyede hazır ·':'रिपोर्ट 5 सेकंड में तैयार ·',
  'veriler cihazınızdan çıkmaz':'डेटा आपके डिवाइस से बाहर नहीं जाता', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'TestoTavan परियोजना, हमारा दृष्टिकोण और वैज्ञानिक स्रोत', 'Referans aldığımız çalışmalar':'जिन अध्ययनों को हम संदर्भ देते हैं',
  'Özet:':'सारांश:', 'D Vitamini & Testosteron İlişkisi':'विटामिन D और टेस्टोस्टेरोन', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'प्रतिदिन 3332 IU विटामिन D लेने वाले पुरुषों में 12 महीनों बाद कुल टेस्टोस्टेरोन 25.2% बढ़ा (10.7±3.9 से 13.4±4.7 nmol/L)। प्लेसीबो समूह में कोई बदलाव नहीं देखा गया।',
  'Ashwagandha & Kortizol Azaltımı':'अश्वगंधा और कोर्टिसोल में कमी', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'प्रतिदिन 2 बार 300 mg KSM-66 अश्वगंधा अर्क लेने वाले समूह में 60 दिनों बाद सीरम कोर्टिसोल 27.9% घटा। तनाव स्कोर 44% गिरे।', 'Çinko Eksikliği & Hormon Sentezi':'ज़िंक की कमी और हार्मोन संश्लेषण',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'मध्यम ज़िंक कमी वाले युवा पुरुषों में 20–40 mg/दिन ज़िंक सप्लीमेंट से 6 महीनों बाद सीरम टेस्टोस्टेरोन में स्पष्ट वृद्धि हुई।', 'Magnezyum & Serbest Testosteron Artışı':'मैग्नीशियम और मुक्त टेस्टोस्टेरोन में वृद्धि', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'4 सप्ताह तक 10 mg/kg मैग्नीशियम सल्फेट लेने से निष्क्रिय और सक्रिय दोनों प्रतिभागियों में मुक्त और कुल टेस्टोस्टेरोन बढ़ा।',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'नींद की कमी और टेस्टोस्टेरोन में गिरावट', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'युवा पुरुषों में एक सप्ताह की नींद कमी (5 घंटे/रात) से दिन का टेस्टोस्टेरोन 10–15% घटा। यह प्रभाव केवल एक सप्ताह में देखा गया।', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'ओमेगा-3 फैटी एसिड और हार्मोनल स्वास्थ्य',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'1,840 mg DHA लेने वाले बांझपन वाले पुरुषों में 32 हफ़्तों बाद शुक्राणु गुणवत्ता बढ़ी और ऑक्सीडेटिव तनाव के संकेतक घटे।', 'Kreatin Monohidrat & Güç Artışı':'क्रिएटिन मोनोहाइड्रेट और ताकत', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'प्रतिरोध ट्रेनिंग के साथ क्रिएटिन मोनोहाइड्रेट (5 g/दिन) मांसपेशियों और ताकत को 5–15% बढ़ाता है। यह सबसे अधिक शोधित खेल सप्लीमेंट है।',
  'Fenugreek (Çemen) & Serbest Testosteron':'मेथी और मुक्त टेस्टोस्टेरोन', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'8 हफ़्तों तक 500 mg/दिन मेथी अर्क लेने वाले प्रतिरोध-प्रशिक्षित पुरुषों में मुक्त टेस्टोस्टेरोन 46% बढ़ा और शरीर की चर्बी घटी।', 'değildir':'नहीं है',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. कोई भी सप्लीमेंट शुरू करने से पहले हमेशा स्वास्थ्य विशेषज्ञ से सलाह लें। यह प्लेटफ़ॉर्म केवल जानकारी देने के उद्देश्य से है।', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — सर्वाधिकार सुरक्षित © 2026', 'Geliştiren:':'निर्माता:',
  'TestoTavan Rehber':'TestoTavan मार्गदर्शिका', 'Okunma sayısı yükleniyor...':'व्यूज़ की संख्या लोड हो रही है...', 'Sponsorlu içerik':'प्रायोजित सामग्री',
  'Semptom':'लक्षण', 'Doğrulama':'सत्यापन', 'Geçerli giriş aralığı:':'स्वीकार्य इनपुट सीमा:',
  'Lab normal aralığı:':'प्रयोगशाला सामान्य सीमा:', 'Laboratuvar normal aralığı:':'प्रयोगशाला सामान्य सीमा:', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— कुल टेस्टोस्टेरोन बंधित और मुक्त हार्मोन का योग है; 270 ng/dL से नीचे बार-बार मापे गए मान नैदानिक रूप से कम माने जाते हैं।',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— यह वह भाग है जो वास्तव में कोशिकाओं में जाता है; यह लक्षणों से कुल टेस्टोस्टेरोन की तुलना में बेहतर मेल खाता है।', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— SHBG अधिक होने पर टेस्टोस्टेरोन इस प्रोटीन से बंध जाता है और मुक्त टेस्टोस्टेरोन घटता है।', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— LH मस्तिष्क से अंडकोष तक का संकेत है; कम टेस्टोस्टेरोन के साथ अधिक LH अंडकोष की ओर, और कम LH पीयूष ग्रंथि की ओर संकेत करता है।',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— FSH शुक्राणु उत्पादन नियंत्रित करता है; LH के साथ देखने पर कम परिणाम का स्रोत पहचानने में मदद मिलती है।', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— टेस्टोस्टेरोन का कुछ भाग वसा ऊतक में एस्ट्राडियोल में बदलता है; अधिक E2 कामेच्छा में बदलाव और छाती की संवेदनशीलता से जुड़ा है।', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— लगातार अधिक कोर्टिसोल टेस्टोस्टेरोन उत्पादन को दबा सकता है; इसे सुबह 07:00–10:00 के बीच मापना चाहिए।',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— यह लोहे के भंडार दर्शाता है; 30 ng/mL से नीचे थकान और धीमी रिकवरी टेस्टोस्टेरोन से अलग भी हो सकती है।', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— विटामिन D टेस्टोस्टेरोन संश्लेषण में सह-कारक है; 30 ng/mL से कम अपर्याप्त माना जाता है।', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— कम B12 टेस्टोस्टेरोन से अलग भी ऊर्जा और एकाग्रता की कमी जैसा लक्षण पैदा कर सकता है।',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— ज़िंक की कमी सीधे LH संकेत और टेस्टोस्टेरोन संश्लेषण को कमज़ोर करती है।', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— मैग्नीशियम SHBG से बंधन कम करके मुक्त टेस्टोस्टेरोन में सहायक हो सकता है।'
 },
 zh: {
  'Doğal Testosteron Optimizasyonu':'自然睾酮优化', 'Dil':'语言', 'Dil seçin':'选择语言',
  'Ana içeriğe geç':'跳到主要内容', 'Ana sayfaya dön':'返回首页', 'Analiz adımları':'分析步骤',
  'Ölçüm tipi':'测量类型', 'Ana navigasyon':'主导航', 'Reklam alanı':'广告位',
  'Sponsor':'赞助商', 'Sponsor alanı':'赞助商专区', 'Sponsor ol':'成为赞助商',
  'İletişime geç':'联系我们', 'Detaylar':'详情', 'Laboratuvar iş birliği':'实验室合作',
  'Marka başlığı, kısa metin ve bağlantı burada yayınlanır.':'此处发布品牌名称、简短文字和链接。', 'Hormon paneli kampanyaları için ayrılmış alan.':'激素面板推广专用位。', 'Takviye ve erkek sağlığı markaları için ayrılmış alan.':'补剂与男性健康品牌专用位。',
  'Blog yazınız tüm dillerde bu alanda listelenir.':'你的文章会在此以我们支持的所有语言展示。', 'Kişisel planınız':'你的个人方案', 'Tahmin girdilerini değiştir':'修改评估输入',
  'TestoTavan logosu':'TestoTavan 标志', 'Semptom Analizi':'症状分析', 'Semptomlarınızdan tahmini bir değer ve güven aralığı üretiriz — 2 dakika sürer.':'我们根据你的症状估算数值与置信区间 — 只需 2 分钟。',
  'Elimde kan testi var, doğrudan doğrulayayım':'我有血液化验单，直接验证', 'Tahlil PDF’inizi yükleyin; değerleri okuyup referans aralıklarıyla karşılaştıralım.':'上传化验单 PDF，我们会读取数值并与参考范围比较。', 'Uyku, kilo, antrenman ve eksik mikro besinlerin düzeltilmesi hormonal dengeyi destekler. Kişiden kişiye değiştiği için size sayısal bir artış vaadi vermiyoruz; önce ölçer, sonra kontrol ederiz.':'改善睡眠、体重、训练和补充缺乏的微量营养素有助于激素平衡。由于个体反应不同，我们不承诺具体数值提升；先测量，再评估。',
  'Tahmini hormon değerleriniz':'你的估算激素值', 'Tahmin modelinin girdileri':'估算模型输入', 'Ortalama Uyku':'平均睡眠',
  '5 saat ve altı':'5 小时及以下', '6 saat':'6 小时', '7 saat':'7 小时',
  '8 saat ve üzeri':'8 小时及以上', 'Stres Düzeyi':'压力水平', 'Düşük':'低',
  'Orta':'中', 'Yüksek':'高', 'Semptomlarınız':'你的症状',
  'Yaşadıklarınızı işaretleyin':'勾选你的感受', 'TAHMİNİ HESAPLA':'计算估算值', 'Kan Testi ile Doğrulama':'血液检查验证',
  'Gerçek değerlerinizle kesin rapor':'基于真实数值的精准报告', 'Bu ölçüm hangisi?':'这是哪次测量？', 'Raporda böyle etiketlenecek':'报告中如此标注',
  'Başlangıç ölçümü':'基线测量', 'Kontrol (takip) ölçümü':'复查测量', 'Kan vermeden önce: numune koşulları':'抽血前：采样条件',
  'Kan':'血液', 'sabah 07:00–10:00':'应在早晨 07:00–10:00 之间抽取', 'arasında verilmelidir; testosteron gün içinde %30’a kadar düşer.':'；一天内睾酮可下降多达 30%。',
  '8–12 saat açlık':'空腹 8–12 小时', '; yalnızca su içebilirsiniz.':'；只能喝水。', 'Biotin (B7)':'生物素 (B7)',
  'içeren takviyeleri ölçümden en az':'含生物素的补剂应至少在检测前', '72 saat':'72 小时', 'önce bırakın — hormon sonuçlarını yanlış gösterir.':'停用 — 它们会干扰激素结果。',
  'Son':'过去', '48 saatte':'48 小时', 'ağır antrenman ve alkol olmasın.':'内避免高强度训练和饮酒。',
  'Ateş/enfeksiyon gibi akut hastalık döneminde ölçümü erteleyin.':'发热或感染等急性疾病期间请推迟检测。', 'Bu koşullar sağlanmadan verilen kan, düşük çıkan bir sonucu yanlış yorumlamamıza yol açar.':'未满足这些条件就抽血，可能导致我们把偏低的结果解读错误。', 'Tahlilinizi yükleyin, biz okuyalım':'上传化验单，我们替你读取',
  'En hızlı yol — elle giriş gerekmez':'最快方式 — 无需手动输入', 'Tahlil PDF’i veya fotoğrafı':'化验单 PDF 或照片', 'PDF’teki değerleri tarayıcınızda okuyup forma yazıyoruz. Dosya sunucuya gönderilmez.':'我们在你的浏览器中读取 PDF 数值并填入表单。文件不会发送到服务器。',
  'DOSYA SEÇ':'选择文件', 'Tahlil metnini yapıştırayım':'粘贴化验单文字', 'Değerleri elle gireceğim':'我手动输入数值',
  'Tahlil metni':'化验单文字', 'Metinden değerleri oku':'从文字中读取数值', 'Yalnızca Total Testosteron zorunlu':'只有总睾酮为必填',
  'Total Testosteron':'总睾酮', 'Zorunlu':'必填', 'Opsiyonel':'选填',
  'Serbest Testosteron':'游离睾酮', 'Kortizol (sabah)':'皮质醇（晨间）', 'Hepsi opsiyonel':'全部选填',
  'D Vitamini (25-OH)':'维生素 D (25-OH)', 'Çinko':'锌', 'Sağlık verisi açık rızası':'健康数据同意',
  'KVKK m.6 — özel nitelikli kişisel veri':'PDPL 第 6 条 — 敏感个人数据', 'Girdiğim kan değerlerinin (özel nitelikli sağlık verisi) yalnızca bu analizi oluşturmak amacıyla':'我同意我输入的血液数值（敏感健康数据）在', 'cihazımda':'我的设备',
  'işlenmesine açık rıza veriyorum. Veriler sunucuya gönderilmez, saklanmaz ve üçüncü kişilerle paylaşılmaz. Rızamı sayfayı kapatarak her an geri çekebilirim.':'上处理，仅用于生成本次分析。数据不会发送至服务器、不会保存，也不会与第三方共享。我可随时关闭本页面撤回同意。', 'Devam etmek için açık rıza kutusunu işaretlemeniz gerekiyor.':'需勾选同意框才能继续。', 'Testi nerede ve kaç günde yaptırırım?':'在哪里做检测，需要几天？',
  'Butona basmadan önce bilmeniz gerekenler':'点击按钮前须知', 'Nerede:':'地点：', 'Herhangi bir özel laboratuvar veya devlet hastanesi; randevu dışında özel bir sevk gerekmez.':'任何私立实验室或公立医院；除预约外无需特别转诊。',
  'Ücret:':'费用：', 'Laboratuvarın işlem ücreti size aittir. TestoTavan hiçbir ücret almaz ve laboratuvarlarla iş ortaklığı yoktur.':'实验室检测费由你承担。TestoTavan 不收取任何费用，也不与实验室合作。', 'Sonuç süresi:':'出结果时间：',
  'Çoğu laboratuvarda aynı gün – 2 iş günü.':'多数实验室当天至 2 个工作日。', 'SGK:':'社保：', 'Hekim istemi varsa devlet hastanesinde SGK kapsamındadır.':'有医生处方时，公立医院可通过社保报销。',
  'Güncel ücret ve randevu koşulları laboratuvardan laboratuvara değişir; işlem öncesi kurumdan teyit edin.':'现行费用与预约条件因实验室而异，操作前请向机构确认。', 'RAPORU OLUŞTUR':'生成报告', 'Rapor 5 saniyede hazır ·':'报告 5 秒生成 ·',
  'veriler cihazınızdan çıkmaz':'数据不会离开你的设备', 'TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar':'TestoTavan 项目、我们的方法与科学来源', 'Referans aldığımız çalışmalar':'我们引用的研究',
  'Özet:':'摘要：', 'D Vitamini & Testosteron İlişkisi':'维生素 D 与睾酮', '3332 IU/gün D vitamini takviyesi alan erkeklerde 12 ay sonunda total testosteron %25.2 artış göstermiş (10.7±3.9\'dan 13.4±4.7 nmol/L\'ye). Plasebo grubunda değişiklik gözlenmemiş.':'每日补充 3332 IU 维生素 D 的男性，12 个月后总睾酮提升 25.2%（从 10.7±3.9 升至 13.4±4.7 nmol/L）。安慰剂组未见变化。',
  'Ashwagandha & Kortizol Azaltımı':'南非醉茄与皮质醇下降', '300 mg KSM-66 Ashwagandha ekstrakt (2x/gün) alan grupta 60 gün sonunda serum kortizol seviyesi %27.9 azalmış. Stres skorları %44 düşmüş.':'每日两次服用 300 mg KSM-66 南非醉茄提取物的组别，60 天后血清皮质醇下降 27.9%，压力评分下降 44%。', 'Çinko Eksikliği & Hormon Sentezi':'缺锌与激素合成',
  'Orta dereceli çinko eksikliği olan genç erkeklerde 20-40 mg/gün çinko takviyesi 6 ay sonunda serum testosteron seviyesinde belirgin artış sağlamış.':'在轻中度缺锌的年轻男性中，每日补充 20–40 mg 锌，6 个月后血清睾酮明显升高。', 'Magnezyum & Serbest Testosteron Artışı':'镁与游离睾酮提升', '10 mg/kg magnezyum sülfat takviyesi 4 hafta boyunca hem sedanter hem de aktif bireylerde serbest ve total testosteron seviyelerinde artış sağlamış.':'连续 4 周补充 10 mg/kg 硫酸镁，久坐与运动人群的游离睾酮和总睾酮均有提升。',
  'Uyku Kısıtlaması & Testosteron Düşüşü':'睡眠不足与睾酮下降', 'Genç erkeklerde 1 haftalık uyku kısıtlaması (5 saat/gece) gündüz testosteron seviyelerinde %10-15 azalma ile sonuçlanmış. Bu etki sadece 1 haftada gözlenmiş.':'年轻男性仅一周睡眠限制（每晚 5 小时），日间睾酮下降 10–15%。这一效应一周内即可出现。', 'Omega-3 Yağ Asitleri & Hormonal Sağlık':'Omega-3 脂肪酸与激素健康',
  'Omega-3 takviyesi (1840 mg DHA) alan infertil erkeklerde 32 hafta sonunda sperm kalitesi artmış ve oksidatif stres belirteçleri azalmış.':'不育男性补充 1,840 mg DHA，32 周后精子质量提升，氧化应激指标下降。', 'Kreatin Monohidrat & Güç Artışı':'一水肌酸与力量', 'Kreatin monohidrat takviyesi (5g/gün) direnç antrenmanıyla birlikte kullanıldığında kas kütlesi ve güçte %5-15 artış sağlıyor. En çok araştırılmış spor takviyesi.':'配合抗阻训练，一水肌酸（每天 5 g）可使肌肉量与力量提升 5–15%。它是研究最充分的运动补剂。',
  'Fenugreek (Çemen) & Serbest Testosteron':'胡芦巴与游离睾酮', '8 hafta boyunca 500 mg/gün fenugreek ekstrakt alan direnç antrenmanı yapan erkeklerde serbest testosteron %46 artmış, vücut yağ oranı azalmış.':'有抗阻训练习惯的男性连续 8 周每日服用 500 mg 胡芦巴提取物，游离睾酮提升 46%，体脂率下降。', 'değildir':'并非',
  '. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.':'. 开始服用任何补剂前，请务必咨询医疗专业人士。本平台仅供信息参考。', 'TestoTavan v3.0 — Tüm hakları saklıdır © 2026':'TestoTavan v3.0 — 版权所有 © 2026', 'Geliştiren:':'开发者：',
  'TestoTavan Rehber':'TestoTavan 指南', 'Okunma sayısı yükleniyor...':'正在加载阅读量…', 'Sponsorlu içerik':'赞助内容',
  'Semptom':'症状', 'Doğrulama':'验证', 'Geçerli giriş aralığı:':'可输入的取值范围：',
  'Lab normal aralığı:':'实验室正常范围：', 'Laboratuvar normal aralığı:':'实验室正常范围：', '— Total testosteron bağlı + serbest hormonun toplamıdır; 270 ng/dL altı tekrar eden ölçümlerde klinik düşüklük sayılır.':'— 总睾酮是结合态与游离态激素之和；反复测得低于 270 ng/dL 视为临床偏低。',
  '— Hücreye gerçekten giren kısımdır; şikâyetlerle total testosterondan daha iyi örtüşür.':'— 这是真正进入细胞的成分，与症状的对应关系常优于总睾酮。', '— SHBG yüksekse testosteron bu proteine bağlanır ve serbest testosteron düşer.':'— SHBG 偏高时，睾酮与该蛋白结合，游离睾酮下降。', '— LH beyinden testise giden sinyaldir; düşük testosteronla birlikte yüksekse sorun testiste, düşükse hipofizdedir.':'— LH 是大脑向睾丸发出的信号；睾酮低而 LH 高提示问题在睾丸，LH 低则提示在垂体。',
  '— FSH sperm üretimini yönetir; LH ile birlikte değerlendirilince düşüklüğün kaynağını ayırır.':'— FSH 调控精子生成；结合 LH 可帮助判断结果偏低的来源。', '— Testosteronun bir kısmı yağ dokusunda estradiole dönüşür; yüksek E2 libido ve göğüs hassasiyetiyle ilişkilidir.':'— 部分睾酮在脂肪组织中转化为雌二醇；E2 偏高与性欲变化和乳房敏感有关。', '— Kronik yüksek kortizol testosteron üretimini baskılar; sabah 07–10 arası ölçülmelidir.':'— 长期皮质醇偏高会抑制睾酮生成；应在早晨 07:00–10:00 之间测量。',
  '— Demir deposudur; 30 ng/mL altında yorgunluk ve toparlanamama testosterondan bağımsız olarak ortaya çıkar.':'— 它反映铁储备；低于 30 ng/mL 时，疲劳与恢复差可独立于睾酮出现。', '— D vitamini testosteron sentezinde kofaktördür; 30 ng/mL altı yetersiz kabul edilir.':'— 维生素 D 是睾酮合成的辅因子；低于 30 ng/mL 视为不足。', '— Düşük B12 enerji ve odak kaybını testosterondan bağımsız olarak taklit eder.':'— B12 偏低可独立于睾酮引起精力与专注力下降的假象。',
  '— Çinko eksikliği LH sinyalini ve testosteron sentezini doğrudan zayıflatır.':'— 缺锌会直接削弱 LH 信号与睾酮合成。', '— Magnezyum SHBG bağlanmasını azaltarak serbest testosteronu destekler.':'— 镁可减少与 SHBG 的结合，从而支持游离睾酮。'
 }
};


const dynamicUiTranslations = {
 en: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.': 'These values are recorded as the baseline (first) measurement.',
  'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.': 'These values are recorded as a follow-up measurement and compared with the previous measurement.',
  'Elle girişi gizle': 'Hide manual entry',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.': 'You have not selected a symptom yet — selecting at least one makes the estimate more specific.',
  'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.': 'symptom(s) selected. Each card will show the selected symptom name.',
  'Analize başlayın': 'Start the analysis',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama': 'Analysis is 70% complete — the remaining step is blood-test verification',
  'Analizin %80 tamamlandı — değerleri girince rapor açılır': 'Analysis is 80% complete — the report opens after you enter the values',
  'Analizin %90 tamamlandı — değerleri onaylayın': 'Analysis is 90% complete — please review the values',
  'Analiz tamamlandı': 'Analysis complete',
  'Libido düşüklüğü': 'Low libido',
  'Sabah ereksiyonunun seyrekleşmesi': 'Less frequent morning erections',
  'Kas ve güç kaybı': 'Loss of muscle and strength',
  'Göbek bölgesinde yağlanma': 'Abdominal fat gain',
  'Göğüs bölgesinde hassasiyet': 'Breast tenderness',
  'Uyku kalitesi düşük / yorgun uyanma': 'Poor sleep quality / waking tired',
  'Sürekli stres / sinirlilik': 'Persistent stress / irritability',
  'Kronik yorgunluk': 'Chronic fatigue',
  'Antrenman sonrası toparlanamama': 'Poor recovery after exercise',
  'Motivasyon / odak kaybı': 'Loss of motivation / focus',
  'Vücut kıllanmasında azalma': 'Reduced body hair',
  'Ani sıcak basması / terleme': 'Sudden hot flashes / sweating',
  'Sınırda': 'Borderline',
  'Normal': 'Normal'
 },
 de: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.': 'Diese Werte werden als Ausgangs- (Erst-)messung gespeichert.',
  'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.': 'Diese Werte werden als Kontrollmessung gespeichert und mit der vorherigen Messung verglichen.',
  'Elle girişi gizle': 'Manuelle Eingabe ausblenden',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.': 'Sie haben noch kein Symptom ausgewählt – mindestens eine Auswahl macht die Schätzung genauer.',
  'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.': 'Symptom(e) ausgewählt. Jede Karte zeigt den Namen des gewählten Symptoms.',
  'Analize başlayın': 'Analyse starten',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama': 'Analyse zu 70 % abgeschlossen – als Nächstes folgt die Überprüfung per Bluttest',
  'Analizin %80 tamamlandı — değerleri girince rapor açılır': 'Analyse zu 80 % abgeschlossen – der Bericht wird nach Eingabe der Werte geöffnet',
  'Analizin %90 tamamlandı — değerleri onaylayın': 'Analyse zu 90 % abgeschlossen – bitte überprüfen Sie die Werte',
  'Analiz tamamlandı': 'Analyse abgeschlossen',
  'Libido düşüklüğü': 'Verminderte Libido',
  'Sabah ereksiyonunun seyrekleşmesi': 'Seltener Morgenerektionen',
  'Kas ve güç kaybı': 'Verlust von Muskelmasse und Kraft',
  'Göbek bölgesinde yağlanma': 'Bauchfettzunahme',
  'Göğüs bölgesinde hassasiyet': 'Brustempfindlichkeit',
  'Uyku kalitesi düşük / yorgun uyanma': 'Schlechte Schlafqualität / müdes Aufwachen',
  'Sürekli stres / sinirlilik': 'Anhaltender Stress / Reizbarkeit',
  'Kronik yorgunluk': 'Chronische Müdigkeit',
  'Antrenman sonrası toparlanamama': 'Schlechte Erholung nach dem Training',
  'Motivasyon / odak kaybı': 'Verlust von Motivation / Konzentration',
  'Vücut kıllanmasında azalma': 'Weniger Körperbehaarung',
  'Ani sıcak basması / terleme': 'Plötzliche Hitzewallungen / Schwitzen',
  'Sınırda': 'Grenzwertig',
  'Normal': 'Normal'
 },
 ja: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.': 'これらの値は初回測定として記録されます。',
  'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.': 'これらの値はフォローアップ測定として記録され、前回の測定値と比較されます。',
  'Elle girişi gizle': '手入力を非表示',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.': 'まだ症状が選択されていません。少なくとも1つ選ぶと推定の精度が上がります。',
  'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.': '件の症状を選択しました。各カードには選択した症状名が表示されます。',
  'Analize başlayın': '分析を開始',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama': '分析は70%完了しました。残るステップは血液検査での確認です。',
  'Analizin %80 tamamlandı — değerleri girince rapor açılır': '分析は80%完了しました。数値を入力するとレポートが開きます。',
  'Analizin %90 tamamlandı — değerleri onaylayın': '分析は90%完了しました。数値を確認してください。',
  'Analiz tamamlandı': '分析が完了しました',
  'Libido düşüklüğü': '性欲の低下',
  'Sabah ereksiyonunun seyrekleşmesi': '朝の勃起頻度の低下',
  'Kas ve güç kaybı': '筋肉量・筋力の低下',
  'Göbek bölgesinde yağlanma': '腹部脂肪の増加',
  'Göğüs bölgesinde hassasiyet': '胸部の圧痛',
  'Uyku kalitesi düşük / yorgun uyanma': '睡眠の質の低下 / 疲れて目覚める',
  'Sürekli stres / sinirlilik': '継続するストレス / いらだち',
  'Kronik yorgunluk': '慢性的な疲労',
  'Antrenman sonrası toparlanamama': '運動後の回復不良',
  'Motivasyon / odak kaybı': '意欲・集中力の低下',
  'Vücut kıllanmasında azalma': '体毛の減少',
  'Ani sıcak basması / terleme': '突然のほてり / 発汗',
  'Sınırda': '境界域',
  'Normal': '正常'
 },
 fr: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'Ces valeurs sont enregistrées comme mesure de référence (initiale).', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'Ces valeurs sont enregistrées comme mesure de suivi et comparées à la mesure précédente.', 'Elle girişi gizle':'Masquer la saisie manuelle',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'Vous n avez encore choisi aucun symptôme — 1 sélection au minimum affine nettement l’estimation.', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'symptôme(s) sélectionné(s). Chaque carte s’ouvrira avec le nom du symptôme choisi.', 'Analize başlayın':'Commencer l’analyse',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'Analyse terminée à 70 % — étape restante : confirmation par analyse sanguine', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'Analyse terminée à 80 % — le rapport s’ouvre dès la saisie des valeurs', 'Analizin %90 tamamlandı — değerleri onaylayın':'Analyse terminée à 90 % — confirmez les valeurs',
  'Analiz tamamlandı':'Analyse terminée', 'Libido düşüklüğü':'Baisse de libido', 'Sabah ereksiyonunun seyrekleşmesi':'Raréfaction des érections matinales',
  'Kas ve güç kaybı':'Perte de muscle et de force', 'Göbek bölgesinde yağlanma':'Accumulation de graisse abdominale', 'Göğüs bölgesinde hassasiyet':'Sensibilité au niveau de la poitrine',
  'Uyku kalitesi düşük / yorgun uyanma':'Sommeil de mauvaise qualité / réveil fatigué', 'Sürekli stres / sinirlilik':'Stress constant / irritabilité', 'Kronik yorgunluk':'Fatigue chronique',
  'Antrenman sonrası toparlanamama':'Récupération difficile après l’entraînement', 'Motivasyon / odak kaybı':'Perte de motivation / de concentration', 'Vücut kıllanmasında azalma':'Diminution de la pilosité corporelle',
  'Ani sıcak basması / terleme':'Bouffées de chaleur / sueurs soudaines', 'Sınırda':'Limite', 'Normal':'Normal'
 },
 es: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'Estos valores se guardan como medición inicial (de referencia).', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'Estos valores se guardan como medición de seguimiento y se comparan con la anterior.', 'Elle girişi gizle':'Ocultar la entrada manual',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'Aún no has elegido ningún síntoma — al menos 1 selección mejora mucho la estimación.', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'síntoma(s) seleccionado(s). Cada tarjeta se abrirá con el nombre del síntoma elegido.', 'Analize başlayın':'Comenzar el análisis',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'Análisis completado al 70 % — paso restante: confirmación con análisis de sangre', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'Análisis completado al 80 % — el informe se abre al introducir los valores', 'Analizin %90 tamamlandı — değerleri onaylayın':'Análisis completado al 90 % — confirma los valores',
  'Analiz tamamlandı':'Análisis completado', 'Libido düşüklüğü':'Disminución de la libido', 'Sabah ereksiyonunun seyrekleşmesi':'Menos erecciones matutinas',
  'Kas ve güç kaybı':'Pérdida de músculo y fuerza', 'Göbek bölgesinde yağlanma':'Acumulación de grasa abdominal', 'Göğüs bölgesinde hassasiyet':'Sensibilidad en el pecho',
  'Uyku kalitesi düşük / yorgun uyanma':'Sueño de mala calidad / despertar cansado', 'Sürekli stres / sinirlilik':'Estrés constante / irritabilidad', 'Kronik yorgunluk':'Fatiga crónica',
  'Antrenman sonrası toparlanamama':'Recuperación lenta tras el entrenamiento', 'Motivasyon / odak kaybı':'Pérdida de motivación / concentración', 'Vücut kıllanmasında azalma':'Menos vello corporal',
  'Ani sıcak basması / terleme':'Sofocos / sudoración repentina', 'Sınırda':'Límite', 'Normal':'Normal'
 },
 bg: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'Тези стойности се записват като изходно (първо) измерване.', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'Тези стойности се записват като контролно (проследяващо) измерване и се сравняват с предишното.', 'Elle girişi gizle':'Скрий ръчното въвеждане',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'Все още не сте избрали симптом — поне 1 избор значително подобрява оценката.', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'избран(и) симптом(и). Всяка карта ще се отвори с името на избрания симптом.', 'Analize başlayın':'Започнете анализа',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'Анализът е 70 % готов — остава потвърждение с кръвен тест', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'Анализът е 80 % готов — докладът се отваря при въвеждане на стойностите', 'Analizin %90 tamamlandı — değerleri onaylayın':'Анализът е 90 % готов — потвърдете стойностите',
  'Analiz tamamlandı':'Анализът е завършен', 'Libido düşüklüğü':'Понижено либидо', 'Sabah ereksiyonunun seyrekleşmesi':'По-редки сутрешни ерекции',
  'Kas ve güç kaybı':'Загуба на мускулна маса и сила', 'Göbek bölgesinde yağlanma':'Отлагане на мазнини в корема', 'Göğüs bölgesinde hassasiyet':'Чувствителност в областта на гърдите',
  'Uyku kalitesi düşük / yorgun uyanma':'Лошо качество на съня / събуждане уморен', 'Sürekli stres / sinirlilik':'Постоянен стрес / раздразнителност', 'Kronik yorgunluk':'Хронична умора',
  'Antrenman sonrası toparlanamama':'Бавно възстановяване след тренировка', 'Motivasyon / odak kaybı':'Загуба на мотивация / концентрация', 'Vücut kıllanmasında azalma':'Намалено окосмяване по тялото',
  'Ani sıcak basması / terleme':'Внезапни горещи вълни / изпотяване', 'Sınırda':'Гранично', 'Normal':'Нормално'
 },
 ru: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'Эти значения сохраняются как исходное (первое) измерение.', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'Эти значения сохраняются как контрольное (повторное) измерение и сравниваются с предыдущим.', 'Elle girişi gizle':'Скрыть ручной ввод',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'Вы ещё не выбрали симптомы — даже 1 выбор заметно повышает точность оценки.', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'симптом(ов) выбрано. Каждая карточка откроется с названием выбранного симптома.', 'Analize başlayın':'Начать анализ',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'Анализ завершён на 70 % — остался шаг: подтверждение анализом крови', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'Анализ завершён на 80 % — отчёт откроется после ввода значений', 'Analizin %90 tamamlandı — değerleri onaylayın':'Анализ завершён на 90 % — подтвердите значения',
  'Analiz tamamlandı':'Анализ завершён', 'Libido düşüklüğü':'Снижение либидо', 'Sabah ereksiyonunun seyrekleşmesi':'Более редкие утренние эрекции',
  'Kas ve güç kaybı':'Потеря мышц и силы', 'Göbek bölgesinde yağlanma':'Накопление жира в области живота', 'Göğüs bölgesinde hassasiyet':'Чувствительность в области груди',
  'Uyku kalitesi düşük / yorgun uyanma':'Плохое качество сна / усталость при пробуждении', 'Sürekli stres / sinirlilik':'Постоянный стресс / раздражительность', 'Kronik yorgunluk':'Хроническая усталость',
  'Antrenman sonrası toparlanamama':'Медленное восстановление после тренировок', 'Motivasyon / odak kaybı':'Потеря мотивации / концентрации', 'Vücut kıllanmasında azalma':'Уменьшение волос на теле',
  'Ani sıcak basması / terleme':'Внезапные приливы жара / потливость', 'Sınırda':'На границе нормы', 'Normal':'Норма'
 },
 hi: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'ये मान आधार (पहले) माप के रूप में सहेजे जाते हैं।', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'ये मान नियंत्रण (फ़ॉलो-अप) माप के रूप में सहेजे जाते हैं और पिछले माप से तुलना की जाती है।', 'Elle girişi gizle':'मैनुअल प्रविष्टि छिपाएँ',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'आपने अभी कोई लक्षण नहीं चुना — कम से कम 1 चयन अनुमान को काफ़ी सटीक बनाता है।', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'लक्षण चुने गए। हर कार्ड आपके चुने लक्षण के नाम से खुलेगा।', 'Analize başlayın':'विश्लेषण शुरू करें',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'विश्लेषण 70% पूरा — बचा कदम: रक्त परीक्षण से पुष्टि', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'विश्लेषण 80% पूरा — मान दर्ज करते ही रिपोर्ट खुल जाएगी', 'Analizin %90 tamamlandı — değerleri onaylayın':'विश्लेषण 90% पूरा — मानों की पुष्टि करें',
  'Analiz tamamlandı':'विश्लेषण पूरा हुआ', 'Libido düşüklüğü':'कामेच्छा में कमी', 'Sabah ereksiyonunun seyrekleşmesi':'सुबह की स्तंभन में कमी',
  'Kas ve güç kaybı':'मांसपेशियों और ताकत में कमी', 'Göbek bölgesinde yağlanma':'पेट के आसपास चर्बी बढ़ना', 'Göğüs bölgesinde hassasiyet':'छाती में संवेदनशीलता',
  'Uyku kalitesi düşük / yorgun uyanma':'नींद की गुणवत्ता खराब / थकान के साथ जागना', 'Sürekli stres / sinirlilik':'लगातार तनाव / चिड़चिड़ापन', 'Kronik yorgunluk':'दीर्घकालिक थकान',
  'Antrenman sonrası toparlanamama':'ट्रेनिंग के बाद ठीक से रिकवरी न होना', 'Motivasyon / odak kaybı':'प्रेरणा / एकाग्रता में कमी', 'Vücut kıllanmasında azalma':'शरीर के बालों में कमी',
  'Ani sıcak basması / terleme':'अचानक गर्मी लगना / पसीना आना', 'Sınırda':'सीमा पर', 'Normal':'सामान्य'
 },
 zh: {
  'Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.':'这些数值将保存为基线（首次）测量。', 'Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır.':'这些数值将保存为复查（随访）测量，并与上次测量比较。', 'Elle girişi gizle':'隐藏手动输入',
  'Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.':'你还没有选择症状 — 至少选择 1 项即可显著提高评估准确度。', 'semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.':'项症状已选择。每张卡片将以所选症状的名称打开。', 'Analize başlayın':'开始分析',
  'Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama':'分析已完成 70% — 剩余步骤：血液检查确认', 'Analizin %80 tamamlandı — değerleri girince rapor açılır':'分析已完成 80% — 输入数值后即打开报告', 'Analizin %90 tamamlandı — değerleri onaylayın':'分析已完成 90% — 请确认数值',
  'Analiz tamamlandı':'分析完成', 'Libido düşüklüğü':'性欲下降', 'Sabah ereksiyonunun seyrekleşmesi':'晨勃减少',
  'Kas ve güç kaybı':'肌肉与力量下降', 'Göbek bölgesinde yağlanma':'腹部脂肪堆积', 'Göğüs bölgesinde hassasiyet':'胸部敏感',
  'Uyku kalitesi düşük / yorgun uyanma':'睡眠质量差 / 醒来疲惫', 'Sürekli stres / sinirlilik':'持续压力 / 易怒', 'Kronik yorgunluk':'慢性疲劳',
  'Antrenman sonrası toparlanamama':'训练后恢复缓慢', 'Motivasyon / odak kaybı':'动力 / 专注力下降', 'Vücut kıllanmasında azalma':'体毛减少',
  'Ani sıcak basması / terleme':'突发潮热 / 出汗', 'Sınırda':'临界', 'Normal':'正常'
 }
};
const symptomNoteTranslations = {
 en: {
  'İlgili gösterge:': 'Related marker:',
  'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.': 'Loss of libido is one of the most specific findings of low total testosterone.',
  'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.': 'Morning erections follow the daily rhythm of free testosterone; becoming less frequent can be an early sign.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.': 'Loss of strength with the same training can indicate weaker anabolic signalling.',
  'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.': 'Loss of strength with the same training can indicate weaker anabolic signalling.',
  'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.': 'Abdominal fat produces aromatase, which converts part of testosterone to estradiol.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.': 'Breast tenderness is a typical sign associated with high estradiol.',
  'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.': 'Much testosterone is produced during deep sleep; fragmented sleep raises cortisol.',
  'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.': 'Chronically high cortisol directly suppresses testosterone production.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.': 'Fatigue is often linked to low ferritin and may be addressed independently of testosterone.',
  'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.': 'When iron stores are low, muscle repair and oxygen transport slow down.',
  'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.': 'Vitamin D deficiency affects both mood and testosterone synthesis.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.': 'Reduced body hair can reflect long-term low androgen levels.',
  'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.': 'Sudden hot flashes can signal hormonal fluctuation and a disrupted cortisol rhythm.'
 },
 de: {
  'İlgili gösterge:': 'Zugehöriger Marker:',
  'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.': 'Ein Verlust der Libido ist einer der spezifischsten Hinweise auf niedriges Gesamt-Testosteron.',
  'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.': 'Morgenerektionen folgen dem Tagesrhythmus des freien Testosterons; ihre Abnahme kann ein frühes Warnzeichen sein.',
  'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.': 'Kraftverlust bei gleichem Training kann auf ein schwächeres anaboles Signal hinweisen.',
  'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.': 'Bauchfett produziert Aromatase und wandelt einen Teil des Testosterons in Estradiol um.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.': 'Brustempfindlichkeit ist ein typisches Zeichen bei erhöhtem Estradiol.',
  'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.': 'Ein großer Teil des Testosterons wird im Tiefschlaf gebildet; unterbrochener Schlaf erhöht Cortisol.',
  'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.': 'Chronisch hohes Cortisol unterdrückt die Testosteronproduktion direkt.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.': 'Hinter Müdigkeit steckt häufig niedriges Ferritin; dies kann unabhängig vom Testosteron behandelt werden.',
  'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.': 'Bei niedrigen Eisenspeichern verlangsamen sich Muskelreparatur und Sauerstofftransport.',
  'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.': 'Vitamin-D-Mangel beeinflusst sowohl Stimmung als auch Testosteronsynthese.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.': 'Abnehmende Körperbehaarung kann einen langfristig niedrigen Androgenspiegel widerspiegeln.',
  'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.': 'Plötzliche Hitzewallungen können auf hormonelle Schwankungen und einen gestörten Cortisolrhythmus hinweisen.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'Kraftverlust bei gleichem Training deutet auf ein schwächeres anabolisches Signal hin.',
 },
 ja: {
  'İlgili gösterge:': '関連する指標：',
  'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.': '性欲低下は、総テストステロン低値を示す特異性の高い所見の一つです。',
  'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.': '朝の勃起は遊離テストステロンの日内リズムに関係しており、頻度低下は早期のサインになることがあります。',
  'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.': '同じトレーニングで筋力が低下する場合、同化シグナルの低下を示すことがあります。',
  'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.': '腹部脂肪はアロマターゼを産生し、テストステロンの一部をエストラジオールへ変換します。',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.': '胸部の圧痛は、エストラジオール高値と関連する典型的な所見です。',
  'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.': 'テストステロンの多くは深い睡眠中に産生され、分断された睡眠はコルチゾールを上昇させます。',
  'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.': '慢性的なコルチゾール高値は、テストステロン産生を直接抑制します。',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.': '疲労の背景にはフェリチン低値があることが多く、テストステロンとは別に対処できる場合があります。',
  'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.': '鉄の貯蔵量が少ないと、筋修復と酸素運搬が遅くなります。',
  'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.': 'ビタミンD欠乏は気分とテストステロン合成の両方に影響します。',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.': '体毛の減少は、長期的なアンドロゲン低値を反映していることがあります。',
  'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.': '突然のほてりは、ホルモン変動やコルチゾールリズムの乱れを示すことがあります。',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'同じトレーニングで筋力が落ちる場合は、同化シグナルの低下を示します。',
 },
 fr: {
  'İlgili gösterge:':'Indicateur associé :', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'La perte de libido est le signe le plus spécifique d’une testostérone totale basse.', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'Les érections matinales dépendent du rythme circadien de la testostérone libre ; leur raréfaction’est un signal d’alerte précoce.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'Une perte de force à entraînement identique indique un affaiblissement de la signalisation anabolique.', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'Une perte de force à entraînement identique indique un affaiblissement du signal anabolique.', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'La graisse abdominale produit l’enzyme aromatase, qui convertit une partie de la testostérone en’estradiol.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'La sensibilité mammaire est un signe typique d’estradiol élevé.', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'La majeure partie de la testostérone est produite en sommeil profond ; un sommeil fragmenté augmente le cortisol.', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'Un cortisol chroniquement élevé freine directement la production de testostérone.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'Une fatigue cache souvent une ferritine basse, corrigeable indépendamment de la testostérone.', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'Quand les réserves de fer sont basses, la réparation musculaire et le transport de l’oxygène ralentissent.', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'Une carence en vitamine D affecte à la fois l’humeur et la synthèse de la testostérone.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'La diminution de la pilosité reflète un déficit androgénique prolongé.', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'Les bouffées de chaleur soudaines signalent une fluctuation hormonale et une perturbation du rythme du cortisol.'
 },
 es: {
  'İlgili gösterge:':'Indicador asociado:', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'La pérdida de libido es el signo más específico de testosterona total baja.', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'Las erecciones matutinas dependen del ritmo diario de la testosterona libre; su disminución es una señal de alerta temprana.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'Perder fuerza con el mismo entrenamiento indica que la señalización anabólica se debilita.', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'Perder fuerza con el mismo entrenamiento indica que la señal anabólica se debilita.', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'La grasa abdominal produce la enzima aromatasa, que convierte parte de la testosterona en estradiol.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'La sensibilidad en el pecho es un signo típico de estradiol elevado.', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'La mayor parte de la testosterona se produce en el sueño profundo; el sueño fragmentado eleva el cortisol.', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'Un cortisol crónicamente elevado frena directamente la producción de testosterona.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'Detrás del cansancio suele haber ferritina baja, corregible con independencia de la testosterona.', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'Con reservas de hierro bajas se ralentizan la reparación muscular y el transporte de oxígeno.', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'La deficiencia de vitamina D afecta tanto al estado de ánimo como a la síntesis de testosterona.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'La reducción del vello corporal refleja un déficit androgénico prolongado.', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'Los sofocos repentinos indican fluctuación hormonal y alteración del ritmo del cortisol.'
 },
 bg: {
  'İlgili gösterge:':'Свързан показател:', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'Загубата на либидо е най-специфичният признак на нисък общ тестостерон.', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'Сутрешните ерекции зависят от дневния ритъм на свободния тестостерон; разреждането им е ранен сигнал.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'Загубата на сила при същата тренировка показва отслабване на анаболичния сигнал.', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'Загубата на сила при същата тренировка показва отслабване на анаболичния сигнал.', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'Коремните мазнини произвеждат ензима ароматаза, който превръща част от тестостерона в естрадиол.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'Чувствителността в гърдите е типичен признак на повишен естрадиол.', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'По-голямата част от тестостерона се произвежда в дълбок сън; разкъсаният сън повишава кортизола.', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'Хронично повишеният кортизол директно потиска производството на тестостерон.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'Зад умората често стои нисък феритин, който може да се коригира независимо от тестостерона.', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'При ниски запаси от желязо възстановяването на мускулите и преносът на кислород се забавят.', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'Недостигът на витамин D влияе както на настроението, така и на синтеза на тестостерон.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'Намаленото окосмяване отразява продължителен андрогенен дефицит.', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'Внезапните горещи вълни са знак за хормонални колебания и нарушен ритъм на кортизола.'
 },
 ru: {
  'İlgili gösterge:':'Связанный показатель:', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'Снижение либидо — самый специфичный признак низкого общего тестостерона.', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'Утренние эрекции зависят от суточного ритма свободного тестостерона; их урежение — ранний сигнал.',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'Потеря силы при той же нагрузке говорит об ослаблении анаболического сигнала.', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'Потеря силы при той же нагрузке говорит об ослаблении анаболического сигнала.', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'Жировая ткань живота вырабатывает фермент ароматазу, превращающий часть тестостерона в эстрадиол.',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'Чувствительность груди — типичный признак повышенного эстрадиола.', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'Большая часть тестостерона вырабатывается в глубоком сне; фрагментированный сон повышает кортизол.', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'Хронически повышенный кортизол напрямую подавляет выработку тестостерона.',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'За усталостью часто стоит низкий ферритин, который можно скорректировать независимо от тестостерона.', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'При низких запасах железа замедляются восстановление мышц и транспорт кислорода.', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'Дефицит витамина D влияет и на настроение, и на синтез тестостерона.',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'Уменьшение волос на теле отражает длительный дефицит андрогенов.', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'Внезапные приливы жара — признак гормональных колебаний и нарушения ритма кортизола.'
 },
 hi: {
  'İlgili gösterge:':'संबंधित संकेतक:', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'कामेच्छा में कमी कम कुल टेस्टोस्टेरोन का सबसे विशिष्ट लक्षण है।', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'सुबह की स्तंभन मुक्त टेस्टोस्टेरोन की दैनिक लय पर निर्भर है; इसका घटना शुरुआती चेतावनी है।',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'उसी ट्रेनिंग पर ताकत घटना एनाबॉलिक संकेत के कमज़ोर होने का संकेत है।', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'उसी ट्रेनिंग पर ताकत घटना एनाबॉलिक संकेत के कमज़ोर होने का संकेत है।', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'पेट की चर्बी एरोमेटेज़ एंज़ाइम बनाती है, जो टेस्टोस्टेरोन का कुछ हिस्सा एस्ट्राडियोल में बदल देती है।',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'छाती में संवेदनशीलता अधिक एस्ट्राडियोल का सामान्य संकेत है।', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'टेस्टोस्टेरोन का अधिकांश भाग गहरी नींद में बनता है; टूटी नींद कोर्टिसोल बढ़ाती है।', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'लगातार अधिक कोर्टिसोल सीधे टेस्टोस्टेरोन उत्पादन को दबाता है।',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'थकान के पीछे अक्सर कम फेरिटिन होता है, जिसे टेस्टोस्टेरोन से अलग सुधारा जा सकता है।', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'लोहे का भंडार कम होने पर मांसपेशियों की मरम्मत और ऑक्सीजन परिवहन धीमा हो जाता है।', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'विटामिन D की कमी मूड और टेस्टोस्टेरोन संश्लेषण दोनों को प्रभावित करती है।',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'शरीर के बाल घटना लंबे समय तक एंड्रोजन की कमी दर्शाता है।', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'अचानक गर्मी लगना हार्मोनल उतार-चढ़ाव और कोर्टिसोल लय में गड़बड़ी का संकेत है।'
 },
 zh: {
  'İlgili gösterge:':'相关指标：', 'Libido kaybı, total testosteron düşüklüğünün en spesifik bulgusudur.':'性欲下降是总睾酮偏低最具特异性的表现。', 'Sabah ereksiyonu serbest testosteronun günlük ritmine bağlıdır; seyrekleşmesi erken uyarıdır.':'晨勃取决于游离睾酮的昼夜节律；晨勃减少是早期信号。',
  'Aynı antrenmanla güç kaybı, anabolik signalling zayıfladığını gösterir.':'同样训练强度下力量下降，说明合成代谢信号减弱。', 'Aynı antrenmanla güç kaybı, anabolik sinyalin zayıfladığını gösterir.':'同样训练强度下力量下降，说明合成代谢信号减弱。', 'Karın yağı aromataz enzimi üretir; testosteronun bir kısmını estradiole çevirir.':'腹部脂肪会产生芳香化酶，把一部分睾酮转化为雌二醇。',
  'Göğüs hassasiyeti estradiol yüksekliğinin tipik işaretidir.':'胸部敏感是雌二醇偏高的典型信号。', 'Testosteronun büyük kısmı derin uykuda üretilir; bölünmüş uyku kortizolü yükseltir.':'大部分睾酮在深睡眠中生成；睡眠碎片化会升高皮质醇。', 'Kronik kortizol yüksekliği testosteron üretimini doğrudan baskılar.':'长期皮质醇偏高会直接抑制睾酮生成。',
  'Yorgunluğun arkasında sıklıkla düşük ferritin vardır; testosterondan bağımsız olarak düzeltilebilir.':'疲劳背后常是铁蛋白偏低，可与睾酮无关地加以纠正。', 'Demir deposu düşükken kas onarımı ve oksijen taşınması yavaşlar.':'铁储备不足时，肌肉修复和氧气运输都会变慢。', 'D vitamini eksikliği hem ruh halini hem testosteron sentezini etkiler.':'维生素 D 缺乏会同时影响情绪和睾酮合成。',
  'Kıllanmanın azalması uzun süreli androjen düşüklüğünü yansıtır.':'体毛减少反映长期雄激素不足。', 'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.':'突发潮热是激素波动与皮质醇节律紊乱的信号。'
 }
};
Object.keys(symptomNoteTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang]=staticUiTranslations[lang]||{},symptomNoteTranslations[lang]));

const remainingStaticTranslations = {
 en: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin', 'B12':'B12', 'Magnezyum':'Magnesium',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'A personalized, evidence-informed supplement and nutrition guide for natural testosterone optimization.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Reliable information about men’s health is increasingly difficult to access. TestoTavan offers personalized natural supplement and nutrition guidance based on scientific research.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'None of the data you enter is stored or sent to a server. All calculations run instantly in your browser. Your data remains with you.',
  'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'CYBER DATA SHIELD ACTIVE · LOCAL DEVICE',
  'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Your data is never sent to a server or stored; it is processed 100% securely and instantly in your browser (Local Device)',
  'İnteraktif Mikro Besin Simülatörü':'Interactive Micronutrient Simulator',
  'Damat Atomu Besin Değeri Hesaplayıcı':'Damat Atomu Nutrition Calculator',
  'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Adjust ingredient weights with the sliders to calculate magnesium, zinc and calories in real time',
  'Standart Damat Atomu':'Standard Damat Atomu',
  'Maksimum Çinko & Mg':'Max Zinc & Mg',
  'Hafif Antrenman Öncesi':'Light Pre-Workout',
  'Sıfırla':'Reset',
  'Muz':'Banana',
  'Doğal Bal (Çiçek / Çam)':'Raw Honey (Flower / Pine)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Mixed Nuts (Walnut · Almond · Hazelnut)',
  'Kabak Çekirdeği İçi':'Pumpkin Seeds',
  'Tahin & Ham Kakao':'Tahini & Raw Cacao',
  'Toplam Enerji':'Total Energy'
 },
 de: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin', 'B12':'B12', 'Magnezyum':'Magnesium',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Ein personalisierter, wissenschaftlich fundierter Leitfaden zu Nahrungsergänzung und Ernährung für eine natürliche Testosteronoptimierung.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Zuverlässliche Informationen zur Männergesundheit sind immer schwerer zugänglich. TestoTavan bietet personalisierte natürliche Ergänzungs- und Ernährungsempfehlungen auf Grundlage wissenschaftlicher Forschung.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Keine Ihrer Eingaben wird gespeichert oder an einen Server gesendet. Alle Berechnungen erfolgen direkt in Ihrem Browser. Ihre Daten bleiben bei Ihnen.',
  'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'CYBER-DATENSCHUTZSCHILD AKTIV · LOCAL DEVICE',
  'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Ihre Daten werden niemals an einen Server gesendet oder gespeichert; sie werden zu 100 % sicher und sofort in Ihrem Browser (Local Device) verarbeitet',
  'İnteraktif Mikro Besin Simülatörü':'Interaktiver Mikronährstoff-Simulator',
  'Damat Atomu Besin Değeri Hesaplayıcı':'Damat-Atomu-Nährwertrechner',
  'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Passen Sie die Mengen per Schieberegler an; Magnesium, Zink und Kalorien werden sofort berechnet',
  'Standart Damat Atomu':'Standard Damat Atomu',
  'Maksimum Çinko & Mg':'Max. Zink & Mg',
  'Hafif Antrenman Öncesi':'Leichtes Pre-Workout',
  'Sıfırla':'Zurücksetzen',
  'Muz':'Banane',
  'Doğal Bal (Çiçek / Çam)':'Naturhonig (Blüte / Kiefer)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Nussmischung (Walnuss · Mandel · Haselnuss)',
  'Kabak Çekirdeği İçi':'Kürbiskerne',
  'Tahin & Ham Kakao':'Tahin & Rohkakao',
  'Toplam Enerji':'Gesamtenergie'
 },
 ja: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'エストラジオール（E2）', 'Ferritin':'フェリチン', 'B12':'ビタミンB12', 'Magnezyum':'マグネシウム',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'自然なテストステロン最適化のための、科学的根拠に基づく個別のサプリメント・栄養ガイドです。',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'男性の健康に関する信頼できる情報はますます得にくくなっています。TestoTavanは、科学的研究に基づく個別の自然なサプリメント・栄養情報を提供します。',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'入力したデータは保存もサーバー送信もされません。すべての計算はブラウザ内で即時に行われ、データはご本人の端末に残ります。',
  'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'サイバーデータ保護シールド有効 · LOCAL DEVICE',
  'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'データはサーバーに送信・保存されず、ブラウザ内（Local Device）で100%安全に即時処理されます',
  'İnteraktif Mikro Besin Simülatörü':'インタラクティブ微量栄養素シミュレーター',
  'Damat Atomu Besin Değeri Hesaplayıcı':'ダマト・アトム栄養価計算機',
  'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'スライダーで材料のグラム数を調整すると、マグネシウム・亜鉛・カロリーが即座に計算されます',
  'Standart Damat Atomu':'標準レシピ',
  'Maksimum Çinko & Mg':'最大 亜鉛・Mg',
  'Hafif Antrenman Öncesi':'プレワークアウト軽め',
  'Sıfırla':'リセット',
  'Muz':'バナナ',
  'Doğal Bal (Çiçek / Çam)':'天然はちみつ',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'ミックスナッツ（くるみ・アーモンド・ヘーゼルナッツ）',
  'Kabak Çekirdeği İçi':'かぼちゃの種',
  'Tahin & Ham Kakao':'タヒニ＆ローカカオ',
  'Toplam Enerji':'総エネルギー'
 },
 fr: {
  'Magnezyum':'Magnésium', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Un guide personnalisé de compléments et de nutrition, fondé sur des données scientifiques, pour optimiser naturellement la testostérone.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Trouver des informations fiables sur la santé masculine est de plus en plus difficile. TestoTavan propose des recommandations personnalisées de compléments naturels et de nutrition fondées sur la recherche scientifique.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Aucune donnée que vous saisissez n’est enregistrée ni envoyée à un serveur. Tous les calculs sont effectués instantanément dans votre navigateur. Vos données restent chez vous.', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'BOUCLIER DE DONNÉES ACTIF · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Vos données ne sont jamais envoyées à un serveur ni stockées ; elles sont traitées à 100 % en sécurité et instantanément dans votre navigateur (Local Device)',
  'İnteraktif Mikro Besin Simülatörü':'Simulateur interactif de micronutriments', 'Damat Atomu Besin Değeri Hesaplayıcı':'Calculateur nutritionnel Damat Atomu', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Ajustez les quantités avec les curseurs pour calculer en temps réel le magnésium, le zinc et les calories',
  'Standart Damat Atomu':'Damat Atomu standard', 'Maksimum Çinko & Mg':'Zinc et Mg maximum', 'Hafif Antrenman Öncesi':'Avant entraînement léger',
  'Sıfırla':'Réinitialiser', 'Muz':'Banane', 'Doğal Bal (Çiçek / Çam)':'Miel brut (fleurs / pin)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Fruits à coque mélangés (noix · amande · noisette)', 'Kabak Çekirdeği İçi':'Graines de courge', 'Tahin & Ham Kakao':'Tahini et cacao cru',
  'Toplam Enerji':'Énergie totale', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 },
 es: {
  'Magnezyum':'Magnesio', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Una guía personalizada de suplementos y nutrición, basada en datos científicos, para optimizar la testosterona de forma natural.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Encontrar información fiable sobre salud masculina es cada vez más difícil. TestoTavan ofrece recomendaciones personalizadas de suplementos naturales y nutrición basadas en la investigación científica.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Ningún dato que introduzcas se guarda ni se envía a un servidor. Todos los cálculos se realizan al instante en tu navegador. Tus datos se quedan contigo.', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'ESCUDO DE DATOS ACTIVO · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Tus datos nunca se envían a un servidor ni se almacenan; se procesan de forma 100 % segura y al instante en tu navegador (Local Device)',
  'İnteraktif Mikro Besin Simülatörü':'Simulador interactivo de micronutrientes', 'Damat Atomu Besin Değeri Hesaplayıcı':'Calculadora nutricional Damat Atomu', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Ajusta las cantidades con los deslizadores para calcular al instante magnesio, zinc y calorías',
  'Standart Damat Atomu':'Damat Atomu estándar', 'Maksimum Çinko & Mg':'Zinc y Mg máximo', 'Hafif Antrenman Öncesi':'Antes de entrenar suave',
  'Sıfırla':'Restablecer', 'Muz':'Plátano', 'Doğal Bal (Çiçek / Çam)':'Miel crudo (flores / pino)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Frutos secos mixtos (nuez · almendra · avellana)', 'Kabak Çekirdeği İçi':'Semillas de calabaza', 'Tahin & Ham Kakao':'Tahini y cacao crudo',
  'Toplam Enerji':'Energía total', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 },
 bg: {
  'Magnezyum':'Магнезий', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Персонализирано ръководство за добавки и хранене, базирано на научни данни, за естествена оптимизация на тестостерона.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Намирането на достоверна информация за мъжкото здраве става все по-трудно. TestoTavan предлага персонализирани препоръки за естествени добавки и хранене, базирани на научни изследвания.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Никакви въведени от вас данни не се запазват или изпращат на сървър. Всички изчисления се извършват незабавно в браузъра ви. Данните ви остават само при вас.', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'ЩИТ ЗА ДАННИ АКТИВЕН · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Данните ви никога не се изпращат на сървър и не се съхраняват; обработват се 100% сигурно и незабавно в браузъра ви (Local Device)',
  'İnteraktif Mikro Besin Simülatörü':'Интерактивен симулатор на микронутриенти', 'Damat Atomu Besin Değeri Hesaplayıcı':'Хранителен калкулатор Damat Atomu', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Променяйте количествата с плъзгачите, за да изчислявате магнезий, цинк и калории в реално време',
  'Standart Damat Atomu':'Стандартен Damat Atomu', 'Maksimum Çinko & Mg':'Максимум цинк и Mg', 'Hafif Antrenman Öncesi':'Преди лека тренировка',
  'Sıfırla':'Нулирай', 'Muz':'Банан', 'Doğal Bal (Çiçek / Çam)':'Натурален мед (цветен / бор)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Смесени ядки (орех · бадем · лешник)', 'Kabak Çekirdeği İçi':'Тиквени семки', 'Tahin & Ham Kakao':'Тахан и сурово какао',
  'Toplam Enerji':'Обща енергия', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 },
 ru: {
  'Magnezyum':'Магний', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Персонализированное руководство по добавкам и питанию на основе научных данных для естественной оптимизации тестостерона.', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Находить достоверную информацию о мужском здоровье становится всё труднее. TestoTavan предлагает персонализированные рекомендации по натуральным добавкам и питанию, основанные на научных исследованиях.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Введённые вами данные не сохраняются и не отправляются на сервер. Все расчёты выполняются мгновенно в вашем браузере. Данные остаются только у вас.', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'ЩИТ ДАННЫХ АКТИВЕН · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'Ваши данные никогда не отправляются на сервер и не сохраняются; они обрабатываются на 100% безопасно и мгновенно в вашем браузере (Local Device)',
  'İnteraktif Mikro Besin Simülatörü':'Интерактивный симулятор микронутриентов', 'Damat Atomu Besin Değeri Hesaplayıcı':'Калькулятор питания Damat Atomu', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'Меняйте порции ползунками — магний, цинк и калории пересчитываются мгновенно',
  'Standart Damat Atomu':'Стандартный Damat Atomu', 'Maksimum Çinko & Mg':'Максимум цинка и Mg', 'Hafif Antrenman Öncesi':'Перед лёгкой тренировкой',
  'Sıfırla':'Сбросить', 'Muz':'Банан', 'Doğal Bal (Çiçek / Çam)':'Натуральный мёд (цветочный / сосновый)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'Ореховая смесь (грецкий орех · миндаль · фундук)', 'Kabak Çekirdeği İçi':'Тыквенные семечки', 'Tahin & Ham Kakao':'Тахин и сырое какао',
  'Toplam Enerji':'Общая энергия', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 },
 hi: {
  'Magnezyum':'मैग्नीशियम', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'प्राकृतिक टेस्टोस्टेरोन अनुकूलन के लिए वैज्ञानिक आँकड़ों पर आधारित व्यक्तिगत सप्लीमेंट और पोषण मार्गदर्शिका।', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'पुरुष स्वास्थ्य पर सही जानकारी पाना हर दिन कठिन होता जा रहा है। TestoTavan वैज्ञानिक शोध पर आधारित व्यक्तिगत प्राकृतिक सप्लीमेंट और पोषण सुझाव प्रदान करता है।',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'आपका कोई भी डेटा सहेजा या सर्वर पर भेजा नहीं जाता। सभी गणनाएँ आपके ब्राउज़र में तुरंत की जाती हैं। आपका डेटा केवल आपके पास रहता है।', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'डेटा कवच सक्रिय · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'आपका डेटा कभी सर्वर पर नहीं भेजा या सहेजा जाता; यह 100% सुरक्षित रूप से आपके ब्राउज़र (Local Device) में तुरंत संसाधित होता है',
  'İnteraktif Mikro Besin Simülatörü':'इंटरैक्टिव सूक्ष्म पोषक तत्व सिम्युलेटर', 'Damat Atomu Besin Değeri Hesaplayıcı':'Damat Atomu पोषण कैलकुलेटर', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'स्लाइडर से मात्रा बदलें; मैग्नीशियम, ज़िंक और कैलोरी तुरंत गिने जाएँ',
  'Standart Damat Atomu':'स्टैंडर्ड Damat Atomu', 'Maksimum Çinko & Mg':'अधिकतम ज़िंक और Mg', 'Hafif Antrenman Öncesi':'हल्की ट्रेनिंग से पहले',
  'Sıfırla':'रीसेट', 'Muz':'केला', 'Doğal Bal (Çiçek / Çam)':'प्राकृतिक शहद (फूल / चीड़)',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'मिश्रित मेवे (अखरोट · बादाम · हेज़लनट)', 'Kabak Çekirdeği İçi':'कद्दू के बीज', 'Tahin & Ham Kakao':'ताहिनी और कच्चा कोको',
  'Toplam Enerji':'कुल ऊर्जा', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 },
 zh: {
  'Magnezyum':'镁', 'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'基于科学数据的个性化补剂与营养指南，帮助你自然优化睾酮水平。', 'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'如今要找到可靠的男性健康信息越来越难。TestoTavan 基于科学研究，提供个性化的天然补剂与营养建议。',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'你输入的任何数据都不会被保存或发送到服务器。所有计算都在浏览器中即时完成，数据只保留在你本地。', 'SİBER VERİ KALKANI AKTİF · LOCAL DEVICE':'数据护盾已启用 · LOCAL DEVICE', 'Verileriniz kesinlikle sunucuya gönderilmez, saklanmaz; %100 güvenli şekilde tarayıcınızda (Local Device) anlık olarak işlenir':'你的数据绝不会发送到服务器或保存，全部在你的浏览器（Local Device）中 100% 安全地即时处理',
  'İnteraktif Mikro Besin Simülatörü':'交互式微量营养素模拟器', 'Damat Atomu Besin Değeri Hesaplayıcı':'Damat Atomu 营养计算器', 'Malzeme gramajını kaydırgaçla değiştirin; magnezyum, çinko ve kalori anlık hesaplansın':'拖动滑块调整用量，实时计算镁、锌和热量',
  'Standart Damat Atomu':'标准 Damat Atomu', 'Maksimum Çinko & Mg':'最高锌与镁', 'Hafif Antrenman Öncesi':'轻训练前',
  'Sıfırla':'重置', 'Muz':'香蕉', 'Doğal Bal (Çiçek / Çam)':'天然蜂蜜（花蜜 / 松蜜）',
  'Karışık Kuruyemiş (Ceviz · Badem · Fındık)':'混合坚果（核桃 · 杏仁 · 榛子）', 'Kabak Çekirdeği İçi':'南瓜籽仁', 'Tahin & Ham Kakao':'芝麻酱与生可可',
  'Toplam Enerji':'总能量', 'SHBG':'SHBG', 'LH':'LH',
  'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin',
  'B12':'B12'
 }
};
Object.keys(remainingStaticTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang]=staticUiTranslations[lang]||{},remainingStaticTranslations[lang]));

const recipeCalculatorTranslations = {
 en: {
  'Bu tarife özel besin hesaplayıcı':'Nutrition calculator for this recipe',
  'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'This calculator uses only ingredients in this recipe. Adjust the amounts to update the estimates.',
  'Eşleşen malzeme':'matched ingredients',
  'Besin verisi bulunamadı':'Nutrition data unavailable',
  'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'This ingredient has no matching data and is excluded from the totals.',
  'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'No weight was listed in the source; adjust the amount to calculate it.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'No ingredients in this recipe could be matched to nutrition data.',
  'Enerji':'Energy',
  'Hesaplanan miktar':'Calculated amount',
  'Günlük hedef':'Daily target',
  'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Estimates only; values may vary by product, brand and cooking method.'
 },
 de: {
  'Bu tarife özel besin hesaplayıcı':'Nährwertrechner für dieses Rezept',
  'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'Dieser Rechner verwendet nur Zutaten aus diesem Rezept. Passen Sie die Mengen an, um die Schätzwerte zu aktualisieren.',
  'Eşleşen malzeme':'erkannte Zutaten',
  'Besin verisi bulunamadı':'Keine Nährwertdaten verfügbar',
  'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'Für diese Zutat wurden keine Daten gefunden; sie wird nicht in die Summe einbezogen.',
  'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'In der Quelle ist keine Menge angegeben; passen Sie das Gewicht für die Berechnung an.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'Für keine Zutat dieses Rezepts wurden passende Nährwertdaten gefunden.',
  'Enerji':'Energie',
  'Hesaplanan miktar':'Berechnete Menge',
  'Günlük hedef':'Tagesbedarf',
  'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Es handelt sich um Schätzwerte; Produkt, Marke und Zubereitung können die Werte verändern.'
 },
 ja: {
  'Bu tarife özel besin hesaplayıcı':'このレシピ専用の栄養計算機',
  'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'この計算機はこのレシピの材料のみを使用します。分量を調整すると推定値が更新されます。',
  'Eşleşen malzeme':'照合できた材料',
  'Besin verisi bulunamadı':'栄養データがありません',
  'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'この材料のデータが見つからないため、合計には含まれません。',
  'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'出典に重量がないため、計算するには量を調整してください。',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'このレシピには栄養データと照合できる材料がありません。',
  'Enerji':'エネルギー',
  'Hesaplanan miktar':'計算量',
  'Günlük hedef':'1日の目安',
  'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'概算値です。製品、ブランド、調理法によって異なります。'
 },
 fr: {
  'Bu tarife özel besin hesaplayıcı':'Calculateur nutritionnel propre à cette recette', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'Ce calculateur n’utilise que les ingrédients de cette recette. Ajustez les quantités ; les résultats sont approximatifs.', 'Eşleşen malzeme':'Ingrédient correspondant',
  'Besin verisi bulunamadı':'Données nutritionnelles introuvables', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'Cet ingrédient n’est pas additionné faute de correspondance de données.', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'Aucune quantité indiquée dans la source ; ajustez-la pour calculer.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'Aucun ingrédient calculable ne correspond dans cette recette.', 'Enerji':'Énergie', 'Hesaplanan miktar':'Quantité calculée',
  'Günlük hedef':'Objectif quotidien', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Valeurs approximatives ; elles varient selon le produit, la marque et le mode de cuisson.'
 },
 es: {
  'Bu tarife özel besin hesaplayıcı':'Calculadora nutricional específica de esta receta', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'Esta calculadora solo usa los ingredientes de esta receta. Ajusta las cantidades; los resultados son aproximados.', 'Eşleşen malzeme':'Ingrediente coincidente',
  'Besin verisi bulunamadı':'No se encontraron datos nutricionales', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'Este ingrediente no se suma por falta de coincidencia de datos.', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'La fuente no indica la cantidad; ajústala para calcular.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'Ningún ingrediente calculable coincide en esta receta.', 'Enerji':'Energía', 'Hesaplanan miktar':'Cantidad calculada',
  'Günlük hedef':'Objetivo diario', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Son valores aproximados; varían según el producto, la marca y el método de cocción.'
 },
 bg: {
  'Bu tarife özel besin hesaplayıcı':'Калкулатор за хранителни стойности към тази рецепта', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'Калкулаторът използва само съставките от тази рецепта. Регулирайте количествата; резултатите са приблизителни.', 'Eşleşen malzeme':'Съвпадаща съставка',
  'Besin verisi bulunamadı':'Не са намерени хранителни данни', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'Тази съставка не се добавя към сбора поради липса на съвпадение на данни.', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'В източника няма количество; задайте го, за да изчислите.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'В тази рецепта не съвпада нито една изчислима съставка.', 'Enerji':'Енергия', 'Hesaplanan miktar':'Изчислено количество',
  'Günlük hedef':'Дневна цел', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Стойностите са приблизителни; варират според продукта, марката и начина на приготвяне.'
 },
 ru: {
  'Bu tarife özel besin hesaplayıcı':'Калькулятор питания для этого рецепта', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'Калькулятор использует только ингредиенты этого рецепта. Измените количества — результаты приблизительны.', 'Eşleşen malzeme':'Совпадающий ингредиент',
  'Besin verisi bulunamadı':'Пищевые данные не найдены', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'Этот ингредиент не входит в сумму из-за отсутствия совпадения данных.', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'В источнике не указано количество; укажите его для расчёта.',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'В этом рецепте не нашлось ни одного ингредиента для расчёта.', 'Enerji':'Энергия', 'Hesaplanan miktar':'Рассчитанное количество',
  'Günlük hedef':'Дневная цель', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'Значения приблизительные; зависят от продукта, бренда и способа приготовления.'
 },
 hi: {
  'Bu tarife özel besin hesaplayıcı':'इस रेसिपी के लिए विशेष पोषण कैलकुलेटर', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'यह कैलकुलेटर केवल इस रेसिपी की सामग्री का उपयोग करता है। मात्राएँ बदलें; परिणाम लगभग होते हैं।', 'Eşleşen malzeme':'मेल खाती सामग्री',
  'Besin verisi bulunamadı':'पोषण डेटा नहीं मिला', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'डेटा मेल न होने के कारण यह सामग्री कुल में नहीं जोड़ी जाती।', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'स्रोत में मात्रा नहीं दी गई; गणना के लिए मात्रा सेट करें।',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'इस रेसिपी में कोई गणना-योग्य सामग्री नहीं मिली।', 'Enerji':'ऊर्जा', 'Hesaplanan miktar':'गणना की गई मात्रा',
  'Günlük hedef':'दैनिक लक्ष्य', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'अनुमानित मान हैं; उत्पाद, ब्रांड और पकाने के तरीके के अनुसार बदल सकते हैं।'
 },
 zh: {
  'Bu tarife özel besin hesaplayıcı':'专属此食谱的营养计算器', 'Bu hesaplayıcı yalnızca bu tarifteki malzemeleri kullanır. Miktarları ayarlayın; sonuçlar yaklaşık olarak güncellenir.':'此计算器仅使用本食谱中的食材。调整用量，结果为近似值。', 'Eşleşen malzeme':'匹配食材',
  'Besin verisi bulunamadı':'未找到营养数据', 'Bu malzeme veri eşleşmesi olmadığı için toplama katılmıyor.':'该食材无数据匹配，未计入合计。', 'Kaynakta gramaj belirtilmemiş; hesaplamak için gramajı ayarlayın.':'来源未标注用量；请设置用量以计算。',
  'Bu tarifte hesaplanabilir malzeme eşleşmedi.':'本食谱中没有可计算的匹配食材。', 'Enerji':'能量', 'Hesaplanan miktar':'计算用量',
  'Günlük hedef':'每日目标', 'Yaklaşık değerlerdir; ürün, marka ve pişirme yöntemine göre değişebilir.':'数值为近似值，会因产品、品牌和烹饪方式而异。'
 }
};
Object.keys(recipeCalculatorTranslations).forEach(lang=>Object.assign(i18n[lang]=i18n[lang]||{},recipeCalculatorTranslations[lang]));

const completeRangeTranslations = {
 en: { accepted: 'Accepted input range:', lab: 'Normal laboratory range:' },
 de: { accepted: 'Zulässiger Eingabebereich:', lab: 'Normalbereich des Labors:' },
 ja: { accepted: '有効な入力範囲：', lab: '検査室の基準範囲：' },
 fr: { accepted: 'Plage de saisie acceptée :', lab: 'Plage normale du laboratoire :' },
 es: { accepted: 'Rango de entrada aceptado:', lab: 'Rango normal del laboratorio:' },
 bg: { accepted: 'Допустим диапазон на въвеждане:', lab: 'Нормален лабораторен диапазон:' },
 ru: { accepted: 'Допустимый диапазон ввода:', lab: 'Норма лабораторного диапазона:' },
 hi: { accepted: 'स्वीकार्य इनपुट सीमा:', lab: 'प्रयोगशाला सामान्य सीमा:' },
 zh: { accepted: '可输入的取值范围：', lab: '实验室正常范围：' }
};
const sourceRanges = [
 'Geçerli giriş aralığı: 20–4.000 ng/dL', 'Geçerli giriş aralığı: 1–1.000 pg/mL', 'Geçerli giriş aralığı: 1–250 nmol/L',
 'Geçerli giriş aralığı: 0,1–200 IU/L', 'Geçerli giriş aralığı: 0,5–200 µg/dL', 'Geçerli giriş aralığı: 1–5.000 ng/mL',
 'Geçerli giriş aralığı: 1–400 ng/mL', 'Geçerli giriş aralığı: 20–5.000 pg/mL', 'Geçerli giriş aralığı: 5–500 µg/dL',
 'Geçerli giriş aralığı: 0,2–10 mg/dL', 'Lab normal aralığı: 270–1.080 ng/dL', 'Lab normal aralığı: 47–244 pg/mL',
 'Lab normal aralığı: 18–54 nmol/L', 'Lab normal aralığı: 1,5–9,3 IU/L', 'Lab normal aralığı: 1,4–18,1 IU/L',
 'Lab normal aralığı: 11–62 pg/mL', 'Lab normal aralığı: 6–23 µg/dL', 'Lab normal aralığı: 24–336 ng/mL',
 'Lab normal aralığı: 30–100 ng/mL', 'Lab normal aralığı: 200–900 pg/mL', 'Lab normal aralığı: 70–120 µg/dL', 'Lab normal aralığı: 1,7–2,4 mg/dL'
];
for (const [lang, labels] of Object.entries(completeRangeTranslations)) {
 staticUiTranslations[lang] = staticUiTranslations[lang] || {};
 for (const source of sourceRanges) {
  const prefix = source.startsWith('Geçerli') ? 'Geçerli giriş aralığı:' : 'Lab normal aralığı:';
  staticUiTranslations[lang][source] = source.replace(prefix, source.startsWith('Geçerli') ? labels.accepted : labels.lab);
 }
}
Object.keys(dynamicUiTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang]=staticUiTranslations[lang]||{},dynamicUiTranslations[lang]));

Object.keys(staticUiTranslations).forEach(lang=>Object.assign(i18n[lang]=i18n[lang]||{},staticUiTranslations[lang]));

const placeholderI18n = {
 en:{'Yazı veya tarif ara...':'Search articles or recipes...','Örn: 25':'E.g. 25','Örn: 175':'E.g. 175','Örn: 70':'E.g. 70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'E.g. Total Testosterone 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'Content title','Her satıra bir malzeme':'One ingredient per line','Detaylı içeriği yazın...':'Write the detailed content...'},
 de:{'Yazı veya tarif ara...':'Artikel oder Rezepte suchen...','Örn: 25':'Z. B. 25','Örn: 175':'Z. B. 175','Örn: 70':'Z. B. 70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Z. B. Gesamt-Testosteron 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'Inhaltstitel','Her satıra bir malzeme':'Eine Zutat pro Zeile','Detaylı içeriği yazın...':'Ausführlichen Inhalt schreiben...'},
 ja:{'Yazı veya tarif ara...':'記事やレシピを検索...','Örn: 25':'例：25','Örn: 175':'例：175','Örn: 70':'例：70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'例：総テストステロン 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'タイトル','Her satıra bir malzeme':'1行に1つの材料','Detaylı içeriği yazın...':'詳細を入力してください...'},
 fr:{
  'Yazı veya tarif ara...':'Rechercher un article ou une recette...', 'Örn: 25':'Ex. : 25',
  'Örn: 175':'Ex. : 175', 'Örn: 70':'Ex. : 70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Ex. : testostérone totale 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'Titre du contenu',
  'Her satıra bir malzeme':'Un ingrédient par ligne', 'Detaylı içeriği yazın...':'Saisissez le contenu détaillé...'
 },
 es:{
  'Yazı veya tarif ara...':'Buscar artículos o recetas...', 'Örn: 25':'Ej.: 25',
  'Örn: 175':'Ej.: 175', 'Örn: 70':'Ej.: 70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Ej.: testosterona total 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'Título del contenido',
  'Her satıra bir malzeme':'Un ingrediente por línea', 'Detaylı içeriği yazın...':'Escribe el contenido detallado...'
 },
 bg:{
  'Yazı veya tarif ara...':'Търсене на статии или рецепти...', 'Örn: 25':'Напр.: 25',
  'Örn: 175':'Напр.: 175', 'Örn: 70':'Напр.: 70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Напр.: общ тестостерон 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'Заглавие на съдържанието',
  'Her satıra bir malzeme':'Една съставка на ред', 'Detaylı içeriği yazın...':'Въведете подробното съдържание...'
 },
 ru:{
  'Yazı veya tarif ara...':'Поиск статей или рецептов...', 'Örn: 25':'Напр.: 25',
  'Örn: 175':'Напр.: 175', 'Örn: 70':'Напр.: 70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Напр.: общий тестостерон 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'Заголовок материала',
  'Her satıra bir malzeme':'Один ингредиент на строку', 'Detaylı içeriği yazın...':'Введите подробное содержание...'
 },
 hi:{
  'Yazı veya tarif ara...':'लेख या रेसिपी खोजें...', 'Örn: 25':'उदा.: 25',
  'Örn: 175':'उदा.: 175', 'Örn: 70':'उदा.: 70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'उदा.: कुल टेस्टोस्टेरोन 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'सामग्री शीर्षक',
  'Her satıra bir malzeme':'प्रति पंक्ति एक सामग्री', 'Detaylı içeriği yazın...':'विस्तृत सामग्री लिखें...'
 },
 zh:{
  'Yazı veya tarif ara...':'搜索文章或食谱...', 'Örn: 25':'例：25',
  'Örn: 175':'例：175', 'Örn: 70':'例：70',
  'Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'例：总睾酮 480 ng/dL\nSHBG 32 nmol/L', 'İçerik başlığı':'内容标题',
  'Her satıra bir malzeme':'每行一种食材', 'Detaylı içeriği yazın...':'填写详细内容...'
 }
};
const examplePrefix = { en:'E.g.', de:'Z. B.', ja:'例：', fr:'Ex. :', es:'Ej.:', bg:'Напр.:', ru:'Напр.:', hi:'उदा.:', zh:'例：' };
for (const [lang, prefix] of Object.entries(examplePrefix)) {
 placeholderI18n[lang] = placeholderI18n[lang] || {};
 for (const source of ['Örn: 480 · 270–1.080','Örn: 95 · 47–244','Örn: 32 · 18–54','Örn: 4,2 · 1,5–9,3','Örn: 5,1 · 1,4–18,1','Örn: 28 · 11–62','Örn: 14 · 6–23','Örn: 120 · 24–336','Örn: 34 · 30–100','Örn: 420 · 200–900','Örn: 92 · 70–120','Örn: 2,1 · 1,7–2,4']) placeholderI18n[lang][source]=source.replace('Örn:',prefix);
}
const pageMeta = {
 tr:{title:'Testosteron Seviyesi Ön Değerlendirme Aracı | TestoTavan',description:'Belirtilerinize göre testosteron seviyesi için ön tahmin alın ve kan testi değerlerinizi değerlendirin. Ücretsiz sağlık rehberi; tıbbi tanı yerine geçmez.',locale:'tr_TR'},
 en:{title:'Testosterone Level Estimator & Health Guide | TestoTavan',description:'Get a preliminary estimate based on symptoms or review blood test results. Free health information; not a medical diagnosis.',locale:'en_US'},
 de:{title:'Testosteron-Werteinschätzung & Gesundheitsratgeber | TestoTavan',description:'Erhalten Sie eine vorläufige Einschätzung anhand Ihrer Symptome oder prüfen Sie Blutwerte. Kostenlose Informationen, keine medizinische Diagnose.',locale:'de_DE'},
 ja:{title:'テストステロン値の推定・健康ガイド | TestoTavan',description:'症状に基づく目安を確認し、血液検査結果を見直せます。無料の健康情報であり、医学的診断ではありません。',locale:'ja_JP'},
 fr:{title:'Évaluation du taux de testostérone et guide santé | TestoTavan',description:'Obtenez une estimation préliminaire selon vos symptômes ou analysez vos résultats sanguins. Informations de santé gratuites ; ne remplace pas un diagnostic médical.',locale:'fr_FR'},
 es:{title:'Estimador del nivel de testosterona y guía de salud | TestoTavan',description:'Obtén una estimación preliminar según tus síntomas o revisa tus resultados de sangre. Información de salud gratuita; no sustituye un diagnóstico médico.',locale:'es_ES'},
 bg:{title:'Оценка на нивото на тестостерон и здравен наръчник | TestoTavan',description:'Получете предварителна оценка по симптомите си или прегледайте кръвните резултати. Безплатна здравна информация; не заменя медицинска диагноза.',locale:'bg_BG'},
 ru:{title:'Оценка уровня тестостерона и гид по здоровью | TestoTavan',description:'Получите предварительную оценку по симптомам или изучите результаты анализа крови. Бесплатная информация о здоровье; не заменяет медицинский диагноз.',locale:'ru_RU'},
 hi:{title:'टेस्टोस्टेरोन स्तर अनुमान और स्वास्थ्य मार्गदर्शिका | TestoTavan',description:'लक्षणों के आधार पर प्रारंभिक अनुमान लगाएँ या रक्त परीक्षण परिणाम देखें। मुफ़्त स्वास्थ्य जानकारी; चिकित्सकीय निदान नहीं।',locale:'hi_IN'},
 zh:{title:'睾酮水平评估与健康指南 | TestoTavan',description:'根据症状获得初步评估，或查看血液检查结果。免费健康信息，不能替代医学诊断。',locale:'zh_CN'},
};
function langFromUrl(){
 try{
  const raw=String(new URLSearchParams(location.search).get('lang')||'').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.some(l=>l.code===raw)?raw:null;
 }catch(e){ return null; }
}
const urlLang = langFromUrl();
let currentLanguage = urlLang || localStorage.getItem('testotavan_language') || 'tr';
if(urlLang) localStorage.setItem('testotavan_language', urlLang);
function translateUi(text){
 // Eksik çeviri asla Türkçe sızdırmaz: önce seçili dil, sonra İngilizce, en son kaynak metin.
 if(currentLanguage==='tr') return text;
 const dict=i18n[currentLanguage]||{}; return dict[text]||(i18n.en||{})[text]||text;
}
function rememberOriginals(){
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ if(el.closest?.('[data-about-custom]'))return; Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.textContent.trim()).forEach(n=>{if(!n.__tr)n.__tr=n.textContent.trim()}); if(('placeholder' in el)&&el.placeholder&&!el.dataset.trPlaceholder)el.dataset.trPlaceholder=el.placeholder; if(el.hasAttribute('aria-label')&&!el.dataset.trAria)el.dataset.trAria=el.getAttribute('aria-label'); if(el.hasAttribute('alt')&&!el.dataset.trAlt)el.dataset.trAlt=el.getAttribute('alt'); });
}
function applyTranslations(){
 renderAboutContent();
 rememberOriginals(); const dict=i18n[currentLanguage]||{};
 document.documentElement.lang=currentLanguage;
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ if(el.closest?.('[data-about-custom]'))return; const enDict=i18n.en||{};
  Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.__tr).forEach(n=>{const lead=n.textContent.match(/^\s*/)[0],tail=n.textContent.match(/\s*$/)[0];const translated=lead+((currentLanguage==='tr'?null:(dict[n.__tr]||enDict[n.__tr]))||n.__tr)+tail;if(n.textContent!==translated)n.textContent=translated}); if(el.dataset.trPlaceholder)el.placeholder=(placeholderI18n[currentLanguage]||{})[el.dataset.trPlaceholder]||el.dataset.trPlaceholder; if(el.dataset.trAria)el.setAttribute('aria-label',dict[el.dataset.trAria]||el.dataset.trAria); if(el.dataset.trAlt)el.setAttribute('alt',dict[el.dataset.trAlt]||el.dataset.trAlt); });
 const meta=pageMeta[currentLanguage]||pageMeta.tr; document.title=meta.title; document.querySelector?.('meta[name="description"]')?.setAttribute('content',meta.description); document.querySelector?.('meta[property="og:title"]')?.setAttribute('content',meta.title); document.querySelector?.('meta[property="og:description"]')?.setAttribute('content',meta.description); document.querySelector?.('meta[property="og:locale"]')?.setAttribute('content',meta.locale||'tr_TR');
 const select=document.getElementById('languageSelect'); if(select)select.value=currentLanguage;
 const canon=document.getElementById('canonicalLink');
 if(canon){ const base=String(canon.getAttribute('href')||'').replace(/\?.*$/,''); const href=currentLanguage==='tr'?base:base+'?lang='+currentLanguage; canon.setAttribute('href',href); document.getElementById('ogUrl')?.setAttribute('content',href); }
}
let i18nObserver;
function startTranslationObserver(){
 if(i18nObserver) return;
 i18nObserver=new MutationObserver(()=>{ if(!window.__translating){ window.__translating=true; requestAnimationFrame(()=>{applyTranslations();window.__translating=false}) } });
 i18nObserver.observe(document.body,{childList:true,subtree:true});
}
function syncLanguageUrl(lang){
 try{
  if(!window.history||typeof window.history.replaceState!=='function') return;
  const url=new URL(location.href);
  if(lang==='tr') url.searchParams.delete('lang'); else url.searchParams.set('lang',lang);
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
 }catch(e){}
}
function setLanguage(lang){
 const code=SUPPORTED_LANGUAGES.some(l=>l.code===lang)?lang:'tr';
 lang=code;
 currentLanguage=lang;
 localStorage.setItem('testotavan_language',lang);
 syncLanguageUrl(lang);
 if(document.getElementById('blogPage').classList.contains('active')) renderContent();
 applyTranslations();
 startTranslationObserver();
 window.dispatchEvent(new Event('testo-language-change'));
 const langName=(SUPPORTED_LANGUAGES.find(x=>x.code===lang)||{}).name||lang;
 const toastText=lang==='tr'?'Dil Türkçe olarak ayarlandı':`${(i18n[lang]||i18n.en||{})['Dil']||'Language'}: ${langName}`;
 showToast(IC('i-globe')+' '+toastText,'gold');
}
window.translateUi=translateUi;
window.applyTranslations=applyTranslations;
window.openSharedContent=openSharedContent;
if(currentLanguage !== 'tr'){
 applyTranslations();
 startTranslationObserver();
 // Kaydedilmiş dilde açılışta app modülü içerikleri Türkçe üretmiş olabilir;
 // yeniden çizim olayı bunları da doğrudan seçilen dile geçirir.
 window.dispatchEvent(new Event('testo-language-change'));
} else {
 const select=document.getElementById('languageSelect');
 if(select) select.value='tr';
}


window.__testoOptionalReady = true;
