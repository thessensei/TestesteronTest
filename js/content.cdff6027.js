// ========================================
// BLOG, TARİFLER & YÖNETİM PANELİ
// ========================================
const seedContent = [
    {id:'seed-1',type:'blog',category:'Hormon Sağlığı',title:'Testosteronu Destekleyen 7 Günlük Alışkanlık',emoji:'⚡',time:'6 dk',summary:'Uyku, direnç antrenmanı ve beslenme düzeninizi sürdürülebilir şekilde iyileştirmek için pratik bir başlangıç rehberi.',body:'Testosteron sağlığı tek bir takviyeden değil, tutarlı alışkanlıklardan etkilenir.\n\n1. Her gün aynı saatte uyuyup 7–9 saat uyumayı hedefleyin.\n2. Haftada 3 gün temel direnç egzersizleri uygulayın.\n3. Yeterli enerji, protein ve sağlıklı yağ alın.\n4. Alkol tüketimini sınırlayın.\n5. Gün ışığına çıkın ve D vitamini düzeyinizi doktorunuzla değerlendirin.\n6. Stresi nefes egzersizi veya yürüyüşle yönetin.\n7. İlerlemenizi haftalık olarak takip edin.\n\nBelirtileriniz varsa kendi kendinize tedavi uygulamak yerine bir sağlık profesyoneline başvurun.',date:'2026-09-30'},
    {id:'seed-2',type:'recipe',category:'Yüksek Protein',title:'Proteinli Akdeniz Kasesi',emoji:'🥗',time:'20 dk',summary:'Tavuk, yoğurt ve renkli sebzelerle hazırlanan dengeli, yüksek proteinli bir ana öğün.',ingredients:['150 g tavuk göğsü','4 yemek kaşığı süzme yoğurt','1 su bardağı pişmiş bulgur','Domates, salatalık ve maydanoz','1 tatlı kaşığı zeytinyağı','Limon, kimyon ve karabiber'],body:'Tavuğu baharatlarla harmanlayıp tavada tamamen pişirin. Bulguru kaseye alın; doğranmış sebzeleri ve dilimlenmiş tavuğu üzerine yerleştirin. Yoğurt, limon ve zeytinyağını karıştırıp sos olarak ekleyin. Ilık veya soğuk servis edin.',date:'2026-09-29'},
    {id:'seed-3',type:'blog',category:'Uyku',title:'Uyku ve Hormon Dengesi: Temel Rehber',emoji:'🌙',time:'4 dk',summary:'Gece rutininizi düzenleyerek toparlanmayı ve hormon sağlığını desteklemenin kanıta dayalı yolları.',body:'Kaliteli uyku, fiziksel toparlanma ve hormonal ritim için temeldir. Yatak odasını serin ve karanlık tutun. Uyumadan 60 dakika önce parlak ekranları azaltın. Kafeini öğleden sonra sınırlayın ve yoğun egzersizi yatış saatine çok yakın yapmayın.\n\nHorlamanız, nefes kesilmeniz veya gündüz aşırı uykululuğunuz varsa uyku apnesi açısından hekime danışın.',date:'2026-09-28'}
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
function localizedContent(item){ const lang=localStorage.getItem('testotavan_language')||'tr'; const t=item.translations?.[lang]; return t?{...item,category:t.category||item.category,title:t.title||item.title,summary:t.summary||item.summary,body:t.body||item.body,ingredients:t.ingredients||item.ingredients}:item; }
function getAllContent(){ return [...sharedContent, ...seedContent].map(localizedContent); }
async function loadStats(){ try { const r=await fetch('/api/stats',{method:'POST'}); const j=await r.json(); const el=document.getElementById('viewCounter'); if(el)el.textContent=`Toplam ziyaret: ${Number(j.views||0).toLocaleString('tr-TR')}`; } catch(e) { const el=document.getElementById('viewCounter'); if(el)el.textContent=''; } }
async function loadSharedContent(){ try { const response=await fetch('/api/content'); if(response.ok){ sharedContent=await response.json(); renderContent(); } } catch(e){ console.warn('İçerikler yüklenemedi',e); } }
function ensureBlogData(){
    if (blogDataRequested) return;
    blogDataRequested = true;
    loadSharedContent();
    loadStats();
}
function escapeHTML(value=''){ const d=document.createElement('div'); d.textContent=value; return d.innerHTML; }
function setContentFilter(filter,button){ activeContentFilter=filter; document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active')); button.classList.add('active'); renderContent(); }
function renderContent(){
    const list=document.getElementById('contentList'); if(!list)return;
    const query=(document.getElementById('contentSearch')?.value||'').trim().toLocaleLowerCase('tr');
    const items=getAllContent().filter(x=>(activeContentFilter==='all'||x.type===activeContentFilter)&&(!query||`${x.title} ${x.category} ${x.summary}`.toLocaleLowerCase('tr').includes(query)));
    list.innerHTML=items.length?items.map(x=>`<article class="card content-card" role="button" tabindex="0" aria-label="${escapeHTML(x.title)} içeriğini aç" onclick="showContent('${escapeHTML(x.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showContent('${escapeHTML(x.id)}')}"><div class="content-cover ${x.type}"${x.cover_url&&(/^https:\/\//i.test(x.cover_url)||/^\/api\/media\/[\w-]+$/i.test(x.cover_url))?` style="background-image:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.05)),url('${escapeHTML(x.cover_url)}')"`:''}><span class="badge ${x.type==='recipe'?'badge-low':'badge-high'}">${x.type==='recipe'?'Yemek Tarifi':'Blog'}</span><span class="content-emoji">${escapeHTML(x.emoji||'📝')}</span></div><div class="content-body"><div class="eyebrow">${escapeHTML(x.category)}</div><h3 style="font-size:16px;margin-top:5px">${escapeHTML(x.title)}</h3><div class="content-meta"><span>◷ ${escapeHTML(x.time)}</span><span>▣ ${escapeHTML(x.date)}</span></div><p class="content-summary">${escapeHTML(x.summary)}</p></div></article>`).join(''):'<div class="empty-state"><div style="font-size:38px">🔎</div><p style="margin-top:10px">Aramanızla eşleşen içerik bulunamadı.</p></div>';
}
function showContent(id){
    const x=getAllContent().find(i=>i.id===id); if(!x)return;
    const ingredients=x.type==='recipe'&&x.ingredients?.length?`<h3 style="margin-top:20px">Malzemeler</h3><ul class="ingredient-list">${x.ingredients.map(i=>`<li>✓ ${escapeHTML(i)}</li>`).join('')}</ul><h3 style="margin:20px 0 10px">Hazırlanışı</h3>`:'';
    document.getElementById('modalSheet').innerHTML=`<button class="modal-close" aria-label="İçeriği kapat" onclick="closeContentModal()"><span class="icon" aria-hidden="true">×</span></button><div style="font-size:45px;margin-bottom:12px">${escapeHTML(x.emoji||'📝')}</div><div class="eyebrow">${escapeHTML(x.category)} · ${x.type==='recipe'?'Tarif':'Blog'}</div><h2 id="modalTitle" style="font-size:23px;line-height:1.25;margin:7px 45px 8px 0">${escapeHTML(x.title)}</h2><div class="content-meta"><span><span class="icon" aria-hidden="true">◷</span> ${escapeHTML(x.time)}</span><span>${escapeHTML(x.date)}</span></div><p class="content-summary" style="font-size:12px;margin:14px 0">${escapeHTML(x.summary)}</p>${ingredients}<div class="article-content">${escapeHTML(x.body)}</div><div style="font-size:10px;color:var(--text-secondary);border-top:1px solid var(--border);margin-top:22px;padding-top:14px">Sağlık içerikleri bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.</div>`;
    document.getElementById('contentModal').classList.add('show'); document.body.style.overflow='hidden';
}
function closeContentModal(event){ if(event&&event.target!==document.getElementById('contentModal'))return; document.getElementById('contentModal').classList.remove('show'); document.body.style.overflow=''; }
function openAdmin(){ window.location.href='/admin/'; }
function toggleRecipeFields(){ document.getElementById('recipeFields').style.display=document.getElementById('adminType').value==='recipe'?'block':'none'; }
async function saveContent(event){
    event.preventDefault(); const type=document.getElementById('adminType').value;
    const item={type,category:document.getElementById('adminCategory').value.trim(),title:document.getElementById('adminTitle').value.trim(),emoji:document.getElementById('adminEmoji').value.trim()||(type==='recipe'?'🍽️':'📝'),time:document.getElementById('adminTime').value.trim(),summary:document.getElementById('adminSummary').value.trim(),body:document.getElementById('adminBody').value.trim()};
    if(type==='recipe')item.ingredients=document.getElementById('adminIngredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
    const response=await fetch('/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)}); const result=await response.json();
    if(!response.ok){showToast('⚠️ '+(result.error||'Yayınlanamadı'),'red');return;}
    sharedContent.unshift(result); event.target.reset(); toggleRecipeFields(); renderAdmin(); renderContent(); showToast('✅ İçerik herkese açık olarak yayınlandı','green');
}
async function deleteContent(id){
    if(!confirm('Bu içeriği silmek istediğinize emin misiniz?'))return;
    const response=await fetch('/api/content?id='+encodeURIComponent(id),{method:'DELETE'}); if(!response.ok){showToast('İçerik silinemedi','red');return;}
    sharedContent=sharedContent.filter(x=>x.id!==id); renderAdmin(); renderContent(); showToast('İçerik silindi','red');
}
function renderAdmin(){
    const all=getAllContent(), custom=getCustomContent();
    document.getElementById('statAll').textContent=all.length; document.getElementById('statBlog').textContent=all.filter(x=>x.type==='blog').length; document.getElementById('statRecipe').textContent=all.filter(x=>x.type==='recipe').length;
    document.getElementById('adminContentList').innerHTML=custom.length?custom.map(x=>`<div class="admin-item"><div style="min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(x.emoji)} ${escapeHTML(x.title)}</div><div class="card-subtitle">${x.type==='recipe'?'Tarif':'Blog'} · ${escapeHTML(x.category)}</div></div><button class="icon-btn" aria-label="Sil" onclick="deleteContent('${escapeHTML(x.id)}')"><span class="icon" aria-hidden="true">🗑</span></button></div>`).join(''):'<p class="card-subtitle" style="padding:18px 0">Henüz panelden eklenmiş içerik yok. Örnek içerikler silinemez.</p>';
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
  'Misyonumuz':'Our Mission','Ne yapıyoruz?':'What do we do?','Bilimsel Kaynaklar':'Scientific Sources','Araştırma & Referanslar':'Research & References','Ekip':'Team','Geliştirici':'Developer','Kurucu & Geliştirici':'Founder & Developer','Tıbbi Sorumluluk Reddi':'Medical Disclaimer','Lütfen dikkatle okuyun':'Please read carefully','Gizlilik & Veri Güvenliği':'Privacy & Data Security','%100 güvenli':'100% secure','Önemli Uyarılar':'Important Warnings','BAŞA DÖN':'BACK TO TOP'
 },
 de: {
  'Ana Sayfa':'Startseite','Fiziksel':'Körper','Kan Testi':'Bluttest','Blog':'Blog','Hakkımızda':'Über uns','Analiz Yöntemi Seçin':'Analysemethode wählen','Size özel doğal takviye reçetesi oluşturalım.':'Wir erstellen Ihren persönlichen natürlichen Ergänzungsplan.','Hangi Yöntemi Seçmeliyim?':'Welche Methode soll ich wählen?','İki farklı analiz türü':'Zwei Analysemethoden','Fiziksel Analiz':'Körperanalyse','Kan Testi Analizi':'Bluttestanalyse','Semptom bazlı öneri':'Symptombasierte Empfehlungen','Bilimsel veri bazlı reçete':'Wissenschaftlich fundierter Plan','Temel Bilgiler':'Grunddaten','Fiziksel verileriniz':'Ihre Körperdaten','Yaş':'Alter','Boy (cm)':'Größe (cm)','Kilo (kg)':'Gewicht (kg)','Aktivite Seviyesi':'Aktivitätsniveau','Hareketsiz':'Inaktiv','Haftada 1-2 gün':'1–2 Tage pro Woche','Haftada 3-5 gün':'3–5 Tage pro Woche','Haftada 6-7 gün':'6–7 Tage pro Woche','ANALİZ BAŞLAT':'ANALYSE STARTEN','KAN ANALİZİ BAŞLAT':'BLUTANALYSE STARTEN','Hormon Paneli':'Hormonprofil','Sadece bildiğiniz değerleri girin':'Nur bekannte Werte eingeben','Vitamin & Mineral':'Vitamine & Mineralstoffe','Eksiklik tespiti':'Mangel-Screening','Neden Doğal Yollar?':'Warum natürliche Methoden?','Bilimsel yaklaşım':'Wissenschaftlicher Ansatz',
  'Blog & Tarifler':'Blog & Rezepte','Panel':'Dashboard','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'Praktisches Wissen für ein stärkeres Leben.','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'Wissenschaftliche Gesundheitsartikel und praktische Rezepte für Ihre Ziele.','Tümü':'Alle','Blog Yazıları':'Artikel','Yemek Tarifleri':'Rezepte','Yemek Tarifi':'Rezept','İçerik Paneli':'Inhaltsverwaltung','Yerel yönetim':'Lokale Verwaltung','Toplam':'Gesamt','Yazı':'Artikel','Tarif':'Rezept','Yeni içerik ekle':'Neuen Inhalt hinzufügen','Blog yazısı veya yemek tarifi yayınlayın':'Artikel oder Rezept veröffentlichen','İçerik türü':'Inhaltstyp','Blog yazısı':'Artikel','Kategori':'Kategorie','Başlık':'Titel','Emoji':'Emoji','Okuma / hazırlama':'Lese-/Zubereitungszeit','Kısa açıklama':'Kurzbeschreibung','Malzemeler':'Zutaten','İçerik / hazırlanış':'Inhalt / Zubereitung','YAYINLA':'VERÖFFENTLICHEN','Yayınlanan içerikler':'Veröffentlichte Inhalte','Hazırlanışı':'Zubereitung',
  'Misyonumuz':'Unsere Mission','Ne yapıyoruz?':'Was tun wir?','Bilimsel Kaynaklar':'Wissenschaftliche Quellen','Araştırma & Referanslar':'Forschung & Referenzen','Ekip':'Team','Geliştirici':'Entwickler','Kurucu & Geliştirici':'Gründer & Entwickler','Tıbbi Sorumluluk Reddi':'Medizinischer Haftungsausschluss','Lütfen dikkatle okuyun':'Bitte sorgfältig lesen','Gizlilik & Veri Güvenliği':'Datenschutz & Datensicherheit','%100 güvenli':'100 % sicher','Önemli Uyarılar':'Wichtige Hinweise','BAŞA DÖN':'NACH OBEN'
 },
 ja: {
  'Ana Sayfa':'ホーム','Fiziksel':'身体分析','Kan Testi':'血液検査','Blog':'ブログ','Hakkımızda':'概要','Analiz Yöntemi Seçin':'分析方法を選択','Size özel doğal takviye reçetesi oluşturalım.':'あなたに合った自然なサプリメントプランを作成します。','Hangi Yöntemi Seçmeliyim?':'どの方法を選びますか？','İki farklı analiz türü':'2種類の分析方法','Fiziksel Analiz':'身体分析','Kan Testi Analizi':'血液検査分析','Semptom bazlı öneri':'症状に基づく提案','Bilimsel veri bazlı reçete':'科学的根拠に基づくプラン','Temel Bilgiler':'基本情報','Fiziksel verileriniz':'身体データ','Yaş':'年齢','Boy (cm)':'身長 (cm)','Kilo (kg)':'体重 (kg)','Aktivite Seviyesi':'活動レベル','Hareketsiz':'運動なし','Haftada 1-2 gün':'週1〜2日','Haftada 3-5 gün':'週3〜5日','Haftada 6-7 gün':'週6〜7日','ANALİZ BAŞLAT':'分析を開始','KAN ANALİZİ BAŞLAT':'血液分析を開始','Hormon Paneli':'ホルモンパネル','Sadece bildiğiniz değerleri girin':'分かる数値だけ入力してください','Vitamin & Mineral':'ビタミン・ミネラル','Eksiklik tespiti':'不足の確認','Neden Doğal Yollar?':'なぜ自然な方法？','Bilimsel yaklaşım':'科学的アプローチ',
  'Blog & Tarifler':'ブログ・レシピ','Panel':'管理画面','Daha güçlü bir yaşam için uygulanabilir bilgiler.':'より健やかな生活のための実践的な知識。','Bilimsel sağlık yazıları ve hedeflerinize uygun, pratik yemek tarifleri.':'科学的な健康記事と目標に合った実用的なレシピ。','Tümü':'すべて','Blog Yazıları':'記事','Yemek Tarifleri':'レシピ','Yemek Tarifi':'レシピ','İçerik Paneli':'コンテンツ管理','Yerel yönetim':'ローカル管理','Toplam':'合計','Yazı':'記事','Tarif':'レシピ','Yeni içerik ekle':'新しいコンテンツ','Blog yazısı veya yemek tarifi yayınlayın':'記事またはレシピを公開','İçerik türü':'コンテンツ種類','Blog yazısı':'記事','Kategori':'カテゴリー','Başlık':'タイトル','Emoji':'絵文字','Okuma / hazırlama':'読了・調理時間','Kısa açıklama':'短い説明','Malzemeler':'材料','İçerik / hazırlanış':'本文・作り方','YAYINLA':'公開する','Yayınlanan içerikler':'公開済みコンテンツ','Hazırlanışı':'作り方',
  'Misyonumuz':'私たちの使命','Ne yapıyoruz?':'活動内容','Bilimsel Kaynaklar':'科学的資料','Araştırma & Referanslar':'研究・参考文献','Ekip':'チーム','Geliştirici':'開発者','Kurucu & Geliştirici':'創設者・開発者','Tıbbi Sorumluluk Reddi':'医療免責事項','Lütfen dikkatle okuyun':'よくお読みください','Gizlilik & Veri Güvenliği':'プライバシー・データ保護','%100 güvenli':'100%安全','Önemli Uyarılar':'重要な注意事項','BAŞA DÖN':'ページ上部へ'
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

const placeholderI18n = {
 en:{'Yazı veya tarif ara...':'Search articles or recipes...','Örn: 25':'E.g. 25','Örn: 175':'E.g. 175','Örn: 70':'E.g. 70','İçerik başlığı':'Content title','Her satıra bir malzeme':'One ingredient per line','Detaylı içeriği yazın...':'Write the detailed content...'},
 de:{'Yazı veya tarif ara...':'Artikel oder Rezepte suchen...','Örn: 25':'Z. B. 25','Örn: 175':'Z. B. 175','Örn: 70':'Z. B. 70','İçerik başlığı':'Inhaltstitel','Her satıra bir malzeme':'Eine Zutat pro Zeile','Detaylı içeriği yazın...':'Ausführlichen Inhalt schreiben...'},
 ja:{'Yazı veya tarif ara...':'記事やレシピを検索...','Örn: 25':'例：25','Örn: 175':'例：175','Örn: 70':'例：70','İçerik başlığı':'タイトル','Her satıra bir malzeme':'1行に1つの材料','Detaylı içeriği yazın...':'詳細を入力してください...'}
};
let currentLanguage = localStorage.getItem('testotavan_language') || 'tr';
function rememberOriginals(){
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.textContent.trim()).forEach(n=>{if(!n.__tr)n.__tr=n.textContent.trim()}); if(('placeholder' in el)&&el.placeholder&&!el.dataset.trPlaceholder)el.dataset.trPlaceholder=el.placeholder; });
}
function applyTranslations(){
 rememberOriginals(); const dict=i18n[currentLanguage]||{};
 document.documentElement.lang=currentLanguage;
 document.querySelectorAll('body *:not(script):not(style)').forEach(el=>{ Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.__tr).forEach(n=>{const lead=n.textContent.match(/^\s*/)[0],tail=n.textContent.match(/\s*$/)[0];const translated=lead+(dict[n.__tr]||n.__tr)+tail;if(n.textContent!==translated)n.textContent=translated}); if(el.dataset.trPlaceholder)el.placeholder=(placeholderI18n[currentLanguage]||{})[el.dataset.trPlaceholder]||el.dataset.trPlaceholder; });
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
 showToast(lang==='tr'?'🇹🇷 Dil Türkçe olarak ayarlandı':'🌐 Language updated','gold');
}
if(currentLanguage !== 'tr'){
 applyTranslations();
 startTranslationObserver();
} else {
 const select=document.getElementById('languageSelect');
 if(select) select.value='tr';
}


window.__testoOptionalReady = true;
