// ========================================
// BLOG, TARİFLER & YÖNETİM PANELİ
// ========================================
const seedContent = [
    {id:'seed-1',type:'blog',category:'Hormon Sağlığı',title:'Testosteronu Destekleyen 7 Günlük Alışkanlık',emoji:'',time:'6 dk',summary:'Uyku, direnç antrenmanı ve beslenme düzeninizi sürdürülebilir şekilde iyileştirmek için pratik bir başlangıç rehberi.',body:'Testosteron sağlığı tek bir takviyeden değil, tutarlı alışkanlıklardan etkilenir.\n\n1. Her gün aynı saatte uyuyup 7–9 saat uyumayı hedefleyin.\n2. Haftada 3 gün temel direnç egzersizleri uygulayın.\n3. Yeterli enerji, protein ve sağlıklı yağ alın.\n4. Alkol tüketimini sınırlayın.\n5. Gün ışığına çıkın ve D vitamini düzeyinizi doktorunuzla değerlendirin.\n6. Stresi nefes egzersizi veya yürüyüşle yönetin.\n7. İlerlemenizi haftalık olarak takip edin.\n\nBelirtileriniz varsa kendi kendinize tedavi uygulamak yerine bir sağlık profesyoneline başvurun.',date:'2026-09-30'},
    {id:'seed-2',type:'recipe',category:'Yüksek Protein',title:'Proteinli Akdeniz Kasesi',emoji:'',time:'20 dk',summary:'Tavuk, yoğurt ve renkli sebzelerle hazırlanan dengeli, yüksek proteinli bir ana öğün.',ingredients:['150 g tavuk göğsü','4 yemek kaşığı süzme yoğurt','1 su bardağı pişmiş bulgur','Domates, salatalık ve maydanoz','1 tatlı kaşığı zeytinyağı','Limon, kimyon ve karabiber'],body:'Tavuğu baharatlarla harmanlayıp tavada tamamen pişirin. Bulguru kaseye alın; doğranmış sebzeleri ve dilimlenmiş tavuğu üzerine yerleştirin. Yoğurt, limon ve zeytinyağını karıştırıp sos olarak ekleyin. Ilık veya soğuk servis edin.',date:'2026-09-29'},
    {id:'seed-3',type:'blog',category:'Uyku',title:'Uyku ve Hormon Dengesi: Temel Rehber',emoji:'',time:'4 dk',summary:'Gece rutininizi düzenleyerek toparlanmayı ve hormon sağlığını desteklemenin kanıta dayalı yolları.',body:'Kaliteli uyku, fiziksel toparlanma ve hormonal ritim için temeldir. Yatak odasını serin ve karanlık tutun. Uyumadan 60 dakika önce parlak ekranları azaltın. Kafeini öğleden sonra sınırlayın ve yoğun egzersizi yatış saatine çok yakın yapmayın.\n\nHorlamanız, nefes kesilmeniz veya gündüz aşırı uykululuğunuz varsa uyku apnesi açısından hekime danışın.',date:'2026-09-28'}
];
seedContent[0].translations={
 en:{category:'Hormone Health',title:'7 Daily Habits That Support Testosterone',summary:'A practical guide to sustainably improve sleep, resistance training and nutrition.',body:'Testosterone health is influenced by consistent habits, not a single supplement.\n\n1. Aim for 7–9 hours of sleep at consistent times.\n2. Do basic resistance exercises three days a week.\n3. Get enough energy, protein and healthy fats.\n4. Limit alcohol.\n5. Spend time in daylight and discuss vitamin D with your doctor.\n6. Manage stress with breathing exercises or walking.\n7. Track your progress weekly.\n\nIf you have symptoms, consult a healthcare professional instead of self-treating.'},
 de:{category:'Hormongesundheit',title:'7 tägliche Gewohnheiten zur Unterstützung des Testosterons',summary:'Ein praktischer Leitfaden zur nachhaltigen Verbesserung von Schlaf, Krafttraining und Ernährung.',body:'Die Testosterongesundheit wird durch beständige Gewohnheiten beeinflusst, nicht durch ein einzelnes Präparat.\n\n1. Streben Sie 7–9 Stunden Schlaf zu festen Zeiten an.\n2. Machen Sie dreimal pro Woche grundlegendes Krafttraining.\n3. Nehmen Sie genug Energie, Protein und gesunde Fette auf.\n4. Begrenzen Sie Alkohol.\n5. Nutzen Sie Tageslicht und besprechen Sie Vitamin D mit Ihrem Arzt.\n6. Reduzieren Sie Stress durch Atemübungen oder Spaziergänge.\n7. Verfolgen Sie Ihre Fortschritte wöchentlich.\n\nWenden Sie sich bei Beschwerden an medizinisches Fachpersonal.'},
 ja:{category:'ホルモン健康',title:'テストステロンを支える7つの習慣',summary:'睡眠、筋力トレーニング、栄養を持続的に改善するための実践ガイドです。',body:'テストステロンの健康は、1つのサプリではなく継続的な習慣に左右されます。\n\n1. 毎日同じ時間に7〜9時間眠りましょう。\n2. 週3回、基本的な筋力トレーニングを行いましょう。\n3. 十分なエネルギー、たんぱく質、良質な脂質を摂りましょう。\n4. 飲酒を控えましょう。\n5. 日光を浴び、ビタミンDについて医師に相談しましょう。\n6. 呼吸法や散歩でストレスを管理しましょう。\n7. 毎週進捗を確認しましょう。\n\n症状がある場合は、自己判断で治療せず医療専門家に相談してください。'}};
seedContent[1].translations={
 en:{category:'High Protein',title:'Protein Mediterranean Bowl',summary:'A balanced, high-protein meal with chicken, yogurt and colorful vegetables.',body:'Season the chicken and cook it thoroughly in a pan. Put bulgur in a bowl, then add chopped vegetables and sliced chicken. Mix yogurt, lemon and olive oil for the dressing. Serve warm or cold.',ingredients:['150 g chicken breast','4 tbsp strained yogurt','1 cup cooked bulgur','Tomato, cucumber and parsley','1 tsp olive oil','Lemon, cumin and black pepper']},
 de:{category:'Proteinreich',title:'Proteinreiche mediterrane Bowl',summary:'Eine ausgewogene, proteinreiche Mahlzeit mit Hähnchen, Joghurt und buntem Gemüse.',body:'Hähnchen würzen und vollständig in der Pfanne garen. Bulgur in eine Schüssel geben, Gemüse und Hähnchen darauf verteilen. Joghurt, Zitrone und Olivenöl als Dressing mischen. Warm oder kalt servieren.',ingredients:['150 g Hähnchenbrust','4 EL stichfester Joghurt','1 Tasse gekochter Bulgur','Tomate, Gurke und Petersilie','1 TL Olivenöl','Zitrone, Kreuzkümmel und Pfeffer']},
 ja:{category:'高たんぱく',title:'地中海風プロテインボウル',summary:'鶏肉、ヨーグルト、彩り野菜を使ったバランスのよい高たんぱく料理です。',body:'鶏肉にスパイスを加え、フライパンで十分に加熱します。器にブルグル、刻んだ野菜、鶏肉を盛ります。ヨーグルト、レモン、オリーブオイルを混ぜてソースにし、温かいまま、または冷やしてどうぞ。',ingredients:['鶏むね肉 150g','水切りヨーグルト 大さじ4','調理済みブルグル 1カップ','トマト、きゅうり、パセリ','オリーブオイル 小さじ1','レモン、クミン、黒こしょう']}};
seedContent[2].translations={
 en:{category:'Sleep',title:'Sleep and Hormone Balance: The Basics',summary:'Evidence-informed ways to support recovery and hormone health through a better night routine.',body:'Quality sleep is essential for physical recovery and hormonal rhythm. Keep your bedroom cool and dark. Reduce bright screens 60 minutes before bed. Limit caffeine in the afternoon and avoid intense exercise too close to bedtime.\n\nIf you snore, stop breathing during sleep or feel excessively sleepy in the daytime, ask a doctor about sleep apnea.'},
 de:{category:'Schlaf',title:'Schlaf und Hormonbalance: Grundlagen',summary:'Wissenschaftlich fundierte Wege, um Erholung und Hormongesundheit durch eine bessere Abendroutine zu unterstützen.',body:'Guter Schlaf ist wesentlich für körperliche Erholung und den Hormonrhythmus. Halten Sie das Schlafzimmer kühl und dunkel. Reduzieren Sie helle Bildschirme 60 Minuten vor dem Schlafen. Begrenzen Sie Koffein am Nachmittag.\n\nSprechen Sie bei Schnarchen, Atemaussetzern oder starker Tagesmüdigkeit mit einem Arzt über Schlafapnoe.'},
 ja:{category:'睡眠',title:'睡眠とホルモンバランス：基本ガイド',summary:'夜の習慣を整え、回復とホルモンの健康を支える科学的な方法です。',body:'質のよい睡眠は身体の回復とホルモンリズムに不可欠です。寝室を涼しく暗く保ち、就寝60分前から明るい画面を控えましょう。午後のカフェインを減らし、就寝直前の激しい運動を避けてください。\n\nいびき、睡眠中の呼吸停止、日中の強い眠気がある場合は、睡眠時無呼吸症候群について医師に相談してください。'}};
let activeContentFilter = 'all';
let sharedContent = [];
let blogDataRequested = false;
let adminAuthenticated = false;
function getCustomContent(){ return sharedContent; }
// "20 dk" -> EN "20 min" · DE "20 Min." · JA "20分" (panelde süre çevirisi girilmemişse)
function localizeDuration(text, lang){
 const src=String(text||'').trim();
 const units={en:{min:'min',hour:'h',space:true},de:{min:'Min.',hour:'Std.',space:true},ja:{min:'分',hour:'時間',space:false}};
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
 const ingredients=(Array.isArray(t.ingredients)&&t.ingredients.length)?t.ingredients:item.ingredients;
 return {...item,
  category:t.category||item.category,
  title:t.title||item.title,
  summary:t.summary||item.summary,
  body:t.body||item.body,
  time:t.time||localizeDuration(item.time,lang),
  ingredients};
}
function getAllContent(){ return [...sharedContent, ...seedContent].map(localizedContent); }
async function loadStats(){ try { const r=await fetch('/api/stats',{method:'POST'}); const j=await r.json(); const el=document.getElementById('viewCounter'); if(el)el.textContent=`Toplam ziyaret: ${Number(j.views||0).toLocaleString('tr-TR')}`; } catch(e) { const el=document.getElementById('viewCounter'); if(el)el.textContent=''; } }
async function loadSharedContent(){ try { const response=await fetch('/api/content'); if(response.ok){ sharedContent=await response.json(); renderContent(); } } catch(e){ console.warn('İçerikler yüklenemedi',e); } }
function ensureBlogData(){
    if (blogDataRequested) return;
    blogDataRequested = true;
    loadSharedContent();
    loadStats();
}
// Dinamik olarak basılan sabit metinleri doğrudan sözlükten çevirir (gözlemciyi beklemeden)
function tLabel(text){ const lang=localStorage.getItem('testotavan_language')||'tr'; if(lang==='tr')return text; return (typeof i18n!=='undefined'&&i18n[lang]&&i18n[lang][text])||text; }
function escapeHTML(value=''){ const d=document.createElement('div'); d.textContent=value; return d.innerHTML; }
function setContentFilter(filter,button){ activeContentFilter=filter; document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active')); button.classList.add('active'); renderContent(); }
function renderContent(){
    const list=document.getElementById('contentList'); if(!list)return;
    const query=(document.getElementById('contentSearch')?.value||'').trim().toLocaleLowerCase('tr');
    const items=getAllContent().filter(x=>(activeContentFilter==='all'||x.type===activeContentFilter)&&(!query||`${x.title} ${x.category} ${x.summary}`.toLocaleLowerCase('tr').includes(query)));
    list.innerHTML=items.length?items.map(x=>`<article class="card content-card" role="button" tabindex="0" aria-label="${escapeHTML(x.title)} içeriğini aç" onclick="showContent('${escapeHTML(x.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showContent('${escapeHTML(x.id)}')}"><div class="content-cover ${x.type}"${x.cover_url&&(/^https:\/\//i.test(x.cover_url)||/^\/api\/media\/[\w-]+$/i.test(x.cover_url))?` style="background-image:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.05)),url('${escapeHTML(x.cover_url)}')"`:''}><span class="badge ${x.type==='recipe'?'badge-low':'badge-high'}">${escapeHTML(tLabel(x.type==='recipe'?'Yemek Tarifi':'Blog'))}</span><span class="content-emoji">${IC(x.type==='recipe'?'i-utensils':'i-news')}</span></div><div class="content-body"><div class="eyebrow">${escapeHTML(x.category)}</div><h3 style="font-size:16px;margin-top:5px">${escapeHTML(x.title)}</h3><div class="content-meta"><span>${IC('i-clock')}${escapeHTML(x.time)}</span><span>${IC('i-calendar')}${escapeHTML(x.date)}</span></div><p class="content-summary">${escapeHTML(x.summary)}</p></div></article>`).join(''):'<div class="empty-state"><svg class="ic empty-ic" aria-hidden="true"><use href="#i-search"></use></svg><p style="margin-top:10px">Aramanızla eşleşen içerik bulunamadı.</p></div>';
}
function showContent(id){
    const x=getAllContent().find(i=>i.id===id); if(!x)return;
    const ingredients=x.type==='recipe'&&x.ingredients?.length?`<h3 style="margin-top:20px">${escapeHTML(tLabel('Malzemeler'))}</h3><ul class="ingredient-list">${x.ingredients.map(i=>`<li>${IC('i-check')} ${escapeHTML(i)}</li>`).join('')}</ul><h3 style="margin:20px 0 10px">${escapeHTML(tLabel('Hazırlanışı'))}</h3>`:'';
    document.getElementById('modalSheet').innerHTML=`<button class="modal-close" aria-label="İçeriği kapat" onclick="closeContentModal()"><svg class="ic" aria-hidden="true"><use href="#i-close"></use></svg></button><div class="modal-emoji" style="margin-bottom:12px">${IC(x.type==='recipe'?'i-utensils':'i-news')}</div><div class="eyebrow">${escapeHTML(x.category)} · ${escapeHTML(tLabel(x.type==='recipe'?'Tarif':'Blog'))}</div><h2 id="modalTitle" style="font-size:23px;line-height:1.25;margin:7px 45px 8px 0">${escapeHTML(x.title)}</h2><div class="content-meta"><span>${IC('i-clock')}${escapeHTML(x.time)}</span><span>${escapeHTML(x.date)}</span></div><p class="content-summary" style="font-size:12px;margin:14px 0">${escapeHTML(x.summary)}</p>${ingredients}<div class="article-content">${escapeHTML(x.body)}</div><div style="font-size:10px;color:var(--text-secondary);border-top:1px solid var(--border);margin-top:22px;padding-top:14px">Sağlık içerikleri bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.</div>`;
    document.getElementById('contentModal').classList.add('show'); document.body.style.overflow='hidden';
}
function closeContentModal(event){ if(event&&event.target!==document.getElementById('contentModal'))return; document.getElementById('contentModal').classList.remove('show'); document.body.style.overflow=''; }
function openAdmin(){ window.location.href='/admin/'; }
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
    document.getElementById('adminContentList').innerHTML=custom.length?custom.map(x=>`<div class="admin-item"><div style="min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${IC(x.type==='recipe'?'i-utensils':'i-news')} ${escapeHTML(x.title)}</div><div class="card-subtitle">${x.type==='recipe'?'Tarif':'Blog'} · ${escapeHTML(x.category)}</div></div><button class="icon-btn" aria-label="Sil" onclick="deleteContent('${escapeHTML(x.id)}')"><svg class="ic" aria-hidden="true"><use href="#i-trash"></use></svg></button></div>`).join(''):'<p class="card-subtitle" style="padding:18px 0">Henüz panelden eklenmiş içerik yok. Örnek içerikler silinemez.</p>';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeContentModal()});


// ========================================
// ÇOK DİLLİ ARAYÜZ (TR / EN / DE / JA)
// ========================================
const i18n = {
 en: {
  'Ana Sayfa':'Home','Fiziksel':'Physical','Kan Testi':'Blood Test','Blog':'Blog','Hakkımızda':'About',
  'Analiz Yöntemi Seçin':'Choose an Analysis','Size özel doğal takviye reçetesi oluşturalım.':'Let us create a personalized natural supplement plan for you.','Hangi Yöntemi Seçmeliyim?':'Which Method Should I Choose?','İki farklı analiz türü':'Two analysis methods','Fiziksel Analiz':'Physical Analysis','Kan Testi Analizi':'Blood Test Analysis','Semptom bazlı öneri':'Symptom-based recommendations','Bilimsel veri bazlı reçete':'Evidence-based plan','Temel Bilgiler':'Basic Information','Fiziksel verileriniz':'Your physical data','Yaş':'Age','Boy (cm)':'Height (cm)','Kilo (kg)':'Weight (kg)','Aktivite Seviyesi':'Activity Level','Hareketsiz':'Sedentary','Haftada 1-2 gün':'1–2 days a week','Haftada 3-5 gün':'3–5 days a week','Haftada 6-7 gün':'6–7 days a week','ANALİZ BAŞLAT':'START ANALYSIS','KAN ANALİZİ BAŞLAT':'START BLOOD ANALYSIS','Hormon Paneli':'Hormone Panel','Sadece bildiğiniz değerleri girin':'Enter only the values you know','Vitamin & Mineral':'Vitamins & Minerals','Eksiklik tespiti':'Deficiency screening','Neden Doğal Yollar?':'Why Natural Methods?','Bilimsel yaklaşım':'Scientific approach',
  'Blog & Tarifler':'Blog & Recipes','Panel':'Dashboard','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Practical knowledge for a stronger life.','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Evidence-informed health articles and practical recipes for your goals.','Tümü':'All','Blog Yazıları':'Articles','Yemek Tarifleri':'Recipes','Yemek Tarifi':'Recipe','İçerik Paneli':'Content Dashboard','Yerel yönetim':'Local management','Toplam':'Total','Yazı':'Article','Tarif':'Recipe','Yeni içerik ekle':'Add new content','Blog yazısı veya yemek tarifi yayınlayın':'Publish an article or recipe','İçerik türü':'Content type','Blog yazısı':'Article','Kategori':'Category','Başlık':'Title','Emoji':'Emoji','Okuma / hazırlama':'Reading / prep time','Kısa açıklama':'Short description','Malzemeler':'Ingredients','İçerik / hazırlanış':'Content / directions','YAYINLA':'PUBLISH','Yayınlanan içerikler':'Published content','Hazırlanışı':'Directions',
  'Misyonumuz':'Our Mission','Ne yapıyoruz?':'What do we do?','Bilimsel Kaynaklar':'Scientific Sources','Araştırma & Referanslar':'Research & References','Ekip':'Team','Geliştirici':'Developer','Kurucu & Geliştirici':'Founder & Developer','Tıbbi Sorumluluk Reddi':'Medical Disclaimer','Lütfen dikkatle okuyun':'Please read carefully','Gizlilik & Veri Güvenliği':'Privacy & Data Security','%100 güvenli':'100% secure','Önemli Uyarılar':'Important Warnings','BAŞA DÖN':'BACK TO TOP','Malzemeler':'Ingredients','Hazırlanışı':'Preparation'
 },
 de: {
  'Ana Sayfa':'Startseite','Fiziksel':'Körper','Kan Testi':'Bluttest','Blog':'Blog','Hakkımızda':'Über uns','Analiz Yöntemi Seçin':'Analysemethode wählen','Size özel doğal takviye reçetesi oluşturalım.':'Wir erstellen Ihren persönlichen natürlichen Ergänzungsplan.','Hangi Yöntemi Seçmeliyim?':'Welche Methode soll ich wählen?','İki farklı analiz türü':'Zwei Analysemethoden','Fiziksel Analiz':'Körperanalyse','Kan Testi Analizi':'Bluttestanalyse','Semptom bazlı öneri':'Symptombasierte Empfehlungen','Bilimsel veri bazlı reçete':'Wissenschaftlich fundierter Plan','Temel Bilgiler':'Grunddaten','Fiziksel verileriniz':'Ihre Körperdaten','Yaş':'Alter','Boy (cm)':'Größe (cm)','Kilo (kg)':'Gewicht (kg)','Aktivite Seviyesi':'Aktivitätsniveau','Hareketsiz':'Inaktiv','Haftada 1-2 gün':'1–2 Tage pro Woche','Haftada 3-5 gün':'3–5 Tage pro Woche','Haftada 6-7 gün':'6–7 Tage pro Woche','ANALİZ BAŞLAT':'ANALYSE STARTEN','KAN ANALİZİ BAŞLAT':'BLUTANALYSE STARTEN','Hormon Paneli':'Hormonprofil','Sadece bildiğiniz değerleri girin':'Nur bekannte Werte eingeben','Vitamin & Mineral':'Vitamine & Mineralstoffe','Eksiklik tespiti':'Mangel-Screening','Neden Doğal Yollar?':'Warum natürliche Methoden?','Bilimsel yaklaşım':'Wissenschaftlicher Ansatz',
  'Blog & Tarifler':'Blog & Rezepte','Panel':'Dashboard','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Praktisches Wissen für ein stärkeres Leben.','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Wissenschaftliche Gesundheitsartikel und praktische Rezepte für Ihre Ziele.','Tümü':'Alle','Blog Yazıları':'Artikel','Yemek Tarifleri':'Rezepte','Yemek Tarifi':'Rezept','İçerik Paneli':'Inhaltsverwaltung','Yerel yönetim':'Lokale Verwaltung','Toplam':'Gesamt','Yazı':'Artikel','Tarif':'Rezept','Yeni içerik ekle':'Neuen Inhalt hinzufügen','Blog yazısı veya yemek tarifi yayınlayın':'Artikel oder Rezept veröffentlichen','İçerik türü':'Inhaltstyp','Blog yazısı':'Artikel','Kategori':'Kategorie','Başlık':'Titel','Emoji':'Emoji','Okuma / hazırlama':'Lese-/Zubereitungszeit','Kısa açıklama':'Kurzbeschreibung','Malzemeler':'Zutaten','İçerik / hazırlanış':'Inhalt / Zubereitung','YAYINLA':'VERÖFFENTLICHEN','Yayınlanan içerikler':'Veröffentlichte Inhalte','Hazırlanışı':'Zubereitung',
  'Misyonumuz':'Unsere Mission','Ne yapıyoruz?':'Was tun wir?','Bilimsel Kaynaklar':'Wissenschaftliche Quellen','Araştırma & Referanslar':'Forschung & Referenzen','Ekip':'Team','Geliştirici':'Entwickler','Kurucu & Geliştirici':'Gründer & Entwickler','Tıbbi Sorumluluk Reddi':'Medizinischer Haftungsausschluss','Lütfen dikkatle okuyun':'Bitte sorgfältig lesen','Gizlilik & Veri Güvenliği':'Datenschutz & Datensicherheit','%100 güvenli':'100 % sicher','Önemli Uyarılar':'Wichtige Hinweise','BAŞA DÖN':'NACH OBEN','Malzemeler':'Zutaten','Hazırlanışı':'Zubereitung'
 },
 ja: {
  'Ana Sayfa':'ホーム','Fiziksel':'身体分析','Kan Testi':'血液検査','Blog':'ブログ','Hakkımızda':'概要','Analiz Yöntemi Seçin':'分析方法を選択','Size özel doğal takviye reçetesi oluşturalım.':'あなたに合った自然なサプリメントプランを作成します。','Hangi Yöntemi Seçmeliyim?':'どの方法を選びますか？','İki farklı analiz türü':'2種類の分析方法','Fiziksel Analiz':'身体分析','Kan Testi Analizi':'血液検査分析','Semptom bazlı öneri':'症状に基づく提案','Bilimsel veri bazlı reçete':'科学的根拠に基づくプラン','Temel Bilgiler':'基本情報','Fiziksel verileriniz':'身体データ','Yaş':'年齢','Boy (cm)':'身長 (cm)','Kilo (kg)':'体重 (kg)','Aktivite Seviyesi':'活動レベル','Hareketsiz':'運動なし','Haftada 1-2 gün':'週1〜2日','Haftada 3-5 gün':'週3〜5日','Haftada 6-7 gün':'週6〜7日','ANALİZ BAŞLAT':'分析を開始','KAN ANALİZİ BAŞLAT':'血液分析を開始','Hormon Paneli':'ホルモンパネル','Sadece bildiğiniz değerleri girin':'分かる数値だけ入力してください','Vitamin & Mineral':'ビタミン・ミネラル','Eksiklik tespiti':'不足の確認','Neden Doğal Yollar?':'なぜ自然な方法？','Bilimsel yaklaşım':'科学的アプローチ',
  'Blog & Tarifler':'ブログ・レシピ','Panel':'管理画面','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'より健やかな生活のための実践的な知識。','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'科学的な健康記事と目標に合った実用的なレシピ。','Tümü':'すべて','Blog Yazıları':'記事','Yemek Tarifleri':'レシピ','Yemek Tarifi':'レシピ','İçerik Paneli':'コンテンツ管理','Yerel yönetim':'ローカル管理','Toplam':'合計','Yazı':'記事','Tarif':'レシピ','Yeni içerik ekle':'新しいコンテンツ','Blog yazısı veya yemek tarifi yayınlayın':'記事またはレシピを公開','İçerik türü':'コンテンツ種類','Blog yazısı':'記事','Kategori':'カテゴリー','Başlık':'タイトル','Emoji':'絵文字','Okuma / hazırlama':'読了・調理時間','Kısa açıklama':'短い説明','Malzemeler':'材料','İçerik / hazırlanış':'本文・作り方','YAYINLA':'公開する','Yayınlanan içerikler':'公開済みコンテンツ','Hazırlanışı':'作り方',
  'Misyonumuz':'私たちの使命','Ne yapıyoruz?':'活動内容','Bilimsel Kaynaklar':'科学的資料','Araştırma & Referanslar':'研究・参考文献','Ekip':'チーム','Geliştirici':'開発者','Kurucu & Geliştirici':'創設者・開発者','Tıbbi Sorumluluk Reddi':'医療免責事項','Lütfen dikkatle okuyun':'よくお読みください','Gizlilik & Veri Güvenliği':'プライバシー・データ保護','%100 güvenli':'100%安全','Önemli Uyarılar':'重要な注意事項','BAŞA DÖN':'ページ上部へ','Malzemeler':'材料','Hazırlanışı':'作り方'
 }
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
  'tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'ブラウザ内で即時に行われ、データはご本人だけに保持されます。'}
};
Object.keys(aboutTranslations).forEach(lang=>Object.assign(i18n[lang],aboutTranslations[lang]));

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
  'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.': 'Plötzliche Hitzewallungen können auf hormonelle Schwankungen und einen gestörten Cortisolrhythmus hinweisen.'
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
  'Ani sıcak basması hormonal dalgalanmanın ve kortizol ritminin bozulduğunun işaretidir.': '突然のほてりは、ホルモン変動やコルチゾールリズムの乱れを示すことがあります。'
 }
};
Object.keys(symptomNoteTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang],symptomNoteTranslations[lang]));

const remainingStaticTranslations = {
 en: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin', 'B12':'B12', 'Magnezyum':'Magnesium',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'A personalized, evidence-informed supplement and nutrition guide for natural testosterone optimization.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Reliable information about men’s health is increasingly difficult to access. TestoTavan offers personalized natural supplement and nutrition guidance based on scientific research.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'None of the data you enter is stored or sent to a server. All calculations run instantly in your browser. Your data remains with you.'
 },
 de: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'Estradiol (E2)', 'Ferritin':'Ferritin', 'B12':'B12', 'Magnezyum':'Magnesium',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'Ein personalisierter, wissenschaftlich fundierter Leitfaden zu Nahrungsergänzung und Ernährung für eine natürliche Testosteronoptimierung.',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'Zuverlässliche Informationen zur Männergesundheit sind immer schwerer zugänglich. TestoTavan bietet personalisierte natürliche Ergänzungs- und Ernährungsempfehlungen auf Grundlage wissenschaftlicher Forschung.',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'Keine Ihrer Eingaben wird gespeichert oder an einen Server gesendet. Alle Berechnungen erfolgen direkt in Ihrem Browser. Ihre Daten bleiben bei Ihnen.'
 },
 ja: {
  'SHBG':'SHBG', 'LH':'LH', 'FSH':'FSH', 'Estradiol (E2)':'エストラジオール（E2）', 'Ferritin':'フェリチン', 'B12':'ビタミンB12', 'Magnezyum':'マグネシウム',
  'Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.':'自然なテストステロン最適化のための、科学的根拠に基づく個別のサプリメント・栄養ガイドです。',
  'Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.':'男性の健康に関する信頼できる情報はますます得にくくなっています。TestoTavanは、科学的研究に基づく個別の自然なサプリメント・栄養情報を提供します。',
  'Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır.':'入力したデータは保存もサーバー送信もされません。すべての計算はブラウザ内で即時に行われ、データはご本人の端末に残ります。'
 }
};
Object.keys(remainingStaticTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang],remainingStaticTranslations[lang]));

const completeRangeTranslations = {
 en: { accepted: 'Accepted input range:', lab: 'Normal laboratory range:' },
 de: { accepted: 'Zulässiger Eingabebereich:', lab: 'Normalbereich des Labors:' },
 ja: { accepted: '有効な入力範囲：', lab: '検査室の基準範囲：' }
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
 for (const source of sourceRanges) {
  const prefix = source.startsWith('Geçerli') ? 'Geçerli giriş aralığı:' : 'Lab normal aralığı:';
  staticUiTranslations[lang][source] = source.replace(prefix, source.startsWith('Geçerli') ? labels.accepted : labels.lab);
 }
}
Object.keys(dynamicUiTranslations).forEach(lang=>Object.assign(staticUiTranslations[lang],dynamicUiTranslations[lang]));

Object.keys(staticUiTranslations).forEach(lang=>Object.assign(i18n[lang],staticUiTranslations[lang]));

const placeholderI18n = {
 en:{'Yazı veya tarif ara...':'Search articles or recipes...','Örn: 25':'E.g. 25','Örn: 175':'E.g. 175','Örn: 70':'E.g. 70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'E.g. Total Testosterone 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'Content title','Her satıra bir malzeme':'One ingredient per line','Detaylı içeriği yazın...':'Write the detailed content...'},
 de:{'Yazı veya tarif ara...':'Artikel oder Rezepte suchen...','Örn: 25':'Z. B. 25','Örn: 175':'Z. B. 175','Örn: 70':'Z. B. 70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'Z. B. Gesamt-Testosteron 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'Inhaltstitel','Her satıra bir malzeme':'Eine Zutat pro Zeile','Detaylı içeriği yazın...':'Ausführlichen Inhalt schreiben...'},
 ja:{'Yazı veya tarif ara...':'記事やレシピを検索...','Örn: 25':'例：25','Örn: 175':'例：175','Örn: 70':'例：70','Örn: Total Testosteron 480 ng/dL\nSHBG 32 nmol/L':'例：総テストステロン 480 ng/dL\nSHBG 32 nmol/L','İçerik başlığı':'タイトル','Her satıra bir malzeme':'1行に1つの材料','Detaylı içeriği yazın...':'詳細を入力してください...'}
};
const examplePrefix = { en:'E.g.', de:'Z. B.', ja:'例：' };
for (const [lang, prefix] of Object.entries(examplePrefix)) {
 for (const source of ['Örn: 480 · 270–1.080','Örn: 95 · 47–244','Örn: 32 · 18–54','Örn: 4,2 · 1,5–9,3','Örn: 5,1 · 1,4–18,1','Örn: 28 · 11–62','Örn: 14 · 6–23','Örn: 120 · 24–336','Örn: 34 · 30–100','Örn: 420 · 200–900','Örn: 92 · 70–120','Örn: 2,1 · 1,7–2,4']) placeholderI18n[lang][source]=source.replace('Örn:',prefix);
}
const pageMeta = {
 tr:{title:'TestoTavan | Doğal Testosteron Optimizasyonu',description:'Ücretsiz ve anlık testosteron seviyesi hesaplama aracı. Belirtilerinize göre hormon durumunuzu analiz edin ve doğal artırma yollarını öğrenin.'},
 en:{title:'TestoTavan | Natural Testosterone Optimization',description:'A free, instant testosterone-level estimator. Analyse your symptoms and discover evidence-informed natural ways to support your health.'},
 de:{title:'TestoTavan | Natürliche Testosteron-Optimierung',description:'Ein kostenloser, sofortiger Testosteron-Schätzer. Analysieren Sie Ihre Symptome und entdecken Sie wissenschaftlich fundierte natürliche Wege.'},
 ja:{title:'TestoTavan | 自然なテストステロン最適化',description:'無料で使える即時テストステロン推定ツール。症状を分析し、科学的根拠に基づく自然な健康サポート方法を確認できます。'}
};
let currentLanguage = localStorage.getItem('testotavan_language') || 'tr';
function translateUi(text){return (i18n[currentLanguage]||{})[text]||text}
function rememberOriginals(){
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.textContent.trim()).forEach(n=>{if(!n.__tr)n.__tr=n.textContent.trim()}); if(('placeholder' in el)&&el.placeholder&&!el.dataset.trPlaceholder)el.dataset.trPlaceholder=el.placeholder; if(el.hasAttribute('aria-label')&&!el.dataset.trAria)el.dataset.trAria=el.getAttribute('aria-label'); if(el.hasAttribute('alt')&&!el.dataset.trAlt)el.dataset.trAlt=el.getAttribute('alt'); });
}
function applyTranslations(){
 rememberOriginals(); const dict=i18n[currentLanguage]||{};
 document.documentElement.lang=currentLanguage;
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.__tr).forEach(n=>{const lead=n.textContent.match(/^\s*/)[0],tail=n.textContent.match(/\s*$/)[0];const translated=lead+(dict[n.__tr]||n.__tr)+tail;if(n.textContent!==translated)n.textContent=translated}); if(el.dataset.trPlaceholder)el.placeholder=(placeholderI18n[currentLanguage]||{})[el.dataset.trPlaceholder]||el.dataset.trPlaceholder; if(el.dataset.trAria)el.setAttribute('aria-label',dict[el.dataset.trAria]||el.dataset.trAria); if(el.dataset.trAlt)el.setAttribute('alt',dict[el.dataset.trAlt]||el.dataset.trAlt); });
 const meta=pageMeta[currentLanguage]||pageMeta.tr; document.title=meta.title; document.querySelector?.('meta[name="description"]')?.setAttribute('content',meta.description); document.querySelector?.('meta[property="og:title"]')?.setAttribute('content',meta.title); document.querySelector?.('meta[property="og:description"]')?.setAttribute('content',meta.description);
 const select=document.getElementById('languageSelect'); if(select)select.value=currentLanguage;
}
let i18nObserver;
function startTranslationObserver(){
 if(i18nObserver) return;
 i18nObserver=new MutationObserver(()=>{ if(!window.__translating){ window.__translating=true; requestAnimationFrame(()=>{applyTranslations();window.__translating=false}) } });
 i18nObserver.observe(document.body,{childList:true,subtree:true});
}
function setLanguage(lang){
 currentLanguage=lang;
 localStorage.setItem('testotavan_language',lang);
 if(document.getElementById('blogPage').classList.contains('active')) renderContent();
 applyTranslations();
 startTranslationObserver();
 window.dispatchEvent(new Event('testo-language-change'));
 showToast(IC('i-globe')+(lang==='tr'?' Dil Türkçe olarak ayarlandı':' Language updated'),'gold');
}
window.translateUi=translateUi;
window.applyTranslations=applyTranslations;
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
