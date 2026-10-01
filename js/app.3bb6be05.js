const IC=id=>`<svg class="ic" aria-hidden="true"><use href="#${id}"></use></svg>`,V=()=>window.TestoValidation,T=text=>window.translateUi?window.translateUi(text):text,state={step:1,progress:10,progressNote:"",estimate:null,measurement:"baseline",consent:!1,lastSource:"manual"},STEPS=[{id:1,label:"Semptom"},{id:2,label:"Tahmin"},{id:3,label:"Doğrulama"}];function renderSteppers(){document.querySelectorAll("[data-stepper]").forEach(node=>{node.innerHTML=STEPS.map(step=>{const done=step.id<state.step,active=step.id===state.step;return`<div class="${done?"step done":active?"step active":"step"}" aria-current="${active?"step":"false"}">
                        <span class="step-dot">${done?IC("i-check"):step.id}</span>
                        <span class="step-label">${T(step.label)}</span>
                    </div>`}).join('<span class="step-line" aria-hidden="true"></span>')})}function setStep(step){state.step=step,renderSteppers()}function setProgress(percent,note){state.progress=percent,document.querySelectorAll("[data-progress]").forEach(node=>{state.progressNote=note||`Analizin %${percent} tamamlandı`;const text=T(state.progressNote);node.innerHTML=`
            <div class="progress-head">
                <span>${text}</span>
                <span class="progress-pct">%${percent}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        `})}function getFieldErrorBox(input){if(!input)return null;let box=document.getElementById("error-"+input.id);return box||(box=document.createElement("div"),box.className="form-error",box.id="error-"+input.id,box.setAttribute("role","alert"),input.insertAdjacentElement("afterend",box)),box}function setFieldError(inputId,message){const input=document.getElementById(inputId);if(!input)return;const box=getFieldErrorBox(input);input.classList.add("is-invalid"),input.classList.remove("is-warning"),input.setAttribute("aria-invalid","true"),input.setAttribute("aria-describedby",box.id),box.textContent=message,box.classList.add("visible"),clearFieldWarning(inputId)}function clearFieldError(inputId){const input=document.getElementById(inputId);if(!input)return;input.classList.remove("is-invalid"),input.removeAttribute("aria-invalid");const box=document.getElementById("error-"+inputId);box&&(box.textContent="",box.classList.remove("visible"))}function setFieldWarning(inputId,message){const input=document.getElementById(inputId),box=document.getElementById("warn-"+inputId);!input||!box||(input.classList.add("is-warning"),box.innerHTML=`${IC("i-warning")} ${message}`,box.classList.add("visible"))}function clearFieldWarning(inputId){const input=document.getElementById(inputId),box=document.getElementById("warn-"+inputId);input&&input.classList.remove("is-warning"),box&&(box.innerHTML="",box.classList.remove("visible"))}function readFieldValues(fields){const values={};return fields.forEach(field=>{const input=document.getElementById(field.id);values[field.id]=input?input.value:""}),values}function applyValidation(fields,result){if(fields.forEach(field=>{result.errors&&result.errors[field.id]?setFieldError(field.id,result.errors[field.id]):clearFieldError(field.id)}),!result.ok){showToast(IC("i-warning")+" "+result.message,"red");const focusId=result.firstErrorId;if(focusId){const input=document.getElementById(focusId);input&&input.focus()}}return result.ok}function changePage(pageId){document.querySelectorAll(".page").forEach(page=>page.classList.remove("active")),document.getElementById(pageId).classList.add("active");const pageMap={homePage:0,physicalPage:1,bloodPage:2,blogPage:3,aboutPage:4,adminPage:-1};document.querySelectorAll(".nav-item").forEach((item,index)=>{const isCurrent=index===pageMap[pageId];item.classList.toggle("active",isCurrent),item.toggleAttribute("aria-current",isCurrent)}),pageId==="physicalPage"&&setStep(state.estimate?2:1),pageId==="bloodPage"&&setStep(3),pageId==="blogPage"&&loadOptionalFeatures().then(()=>{window.renderContent(),window.ensureBlogData()}),pageId==="adminPage"&&loadOptionalFeatures().then(()=>{var _a;return(_a=window.renderAdmin)==null?void 0:_a.call(window)}),window.applyTranslations&&requestAnimationFrame(window.applyTranslations),window.scrollTo({top:0,behavior:"smooth"})}function showToast(message,color){const container=document.getElementById("toastContainer"),toast=document.createElement("div");toast.className="toast";const colors={gold:"var(--gold)",green:"var(--green)",red:"var(--red)",blue:"var(--blue)"};toast.style.borderLeft=`4px solid ${colors[color]||colors.gold}`,toast.innerHTML=message,container.appendChild(toast),setTimeout(()=>toast.remove(),3200)}function renderSymptomGrid(){const grid=document.getElementById("symptomGrid");!grid||!V()||(grid.innerHTML=V().SYMPTOMS.map(symptom=>`
        <label class="symptom-chip" for="sym-${symptom.id}">
            <input type="checkbox" id="sym-${symptom.id}" value="${symptom.id}" onchange="onSymptomChange()">
            <span>${T(symptom.label)}</span>
        </label>
    `).join(""))}function selectedSymptoms(){return Array.from(document.querySelectorAll("#symptomGrid input:checked")).map(i=>i.value)}function onSymptomChange(){const count=selectedSymptoms().length,info=document.getElementById("symptomCount");info&&(info.textContent=count===0?"Henüz semptom seçmediniz — en az 1 seçim tahmini belirgin şekilde keskinleştirir.":`${count} semptom seçildi. Her kart seçtiğiniz semptomun adıyla açılacak.`),setProgress(Math.min(60,10+count*8+10))}function safeScroll(target,options){target&&typeof target.scrollIntoView=="function"&&target.scrollIntoView(options||{behavior:"smooth",block:"start"})}function scalePos(value,min,max){return Math.max(0,Math.min(100,(value-min)/(max-min)*100))}function fmt(value,decimals){return V().formatNumber(value,decimals===void 0?0:decimals)}function analyzePhysical(){var _a,_b,_c;const fields=V().PHYSICAL_FIELDS,result=V().validatePhysical(readFieldValues(fields));if(!applyValidation(fields,result))return;const symptoms=selectedSymptoms();if(!symptoms.length){showToast(IC("i-warning")+" En az 1 semptom seçin — tahmin buna göre kişiselleşiyor.","red"),safeScroll(document.getElementById("symptomGrid"),{behavior:"smooth",block:"center"});return}const estimate=V().estimateFromSymptoms({age:result.values.inputAge,height:result.values.inputHeight,weight:result.values.inputWeight,activity:Number(((_a=document.getElementById("inputActivity"))==null?void 0:_a.value)||3),sleepHours:Number(((_b=document.getElementById("inputSleep"))==null?void 0:_b.value)||7),stress:Number(((_c=document.getElementById("inputStress"))==null?void 0:_c.value)||2),symptoms});state.estimate=estimate,setStep(2),setProgress(70,"Analizin %70 tamamlandı — kalan adım: kan testiyle doğrulama"),renderEstimate(estimate),showToast(IC("i-check")+" Tahmin hazır. Son adım: doğrulama.","gold")}function renderEstimate(est){const panel=document.getElementById("physicalResult"),SCALE_MIN=0,SCALE_MAX=1200,refLeft=scalePos(est.ref[0],SCALE_MIN,SCALE_MAX),refWidth=scalePos(est.ref[1],SCALE_MIN,SCALE_MAX)-refLeft,ciLeft=scalePos(est.low,SCALE_MIN,SCALE_MAX),ciWidth=scalePos(est.high,SCALE_MIN,SCALE_MAX)-ciLeft,pointPos=scalePos(est.point,SCALE_MIN,SCALE_MAX),driverCards=est.cards.map(card=>{const dec=card.marker.units[0].decimals,scaleMax=card.ref[1]*1.6,cRefLeft=scalePos(card.ref[0],0,scaleMax),cRefWidth=scalePos(card.ref[1],0,scaleMax)-cRefLeft,cBandLeft=scalePos(card.low,0,scaleMax),cBandWidth=scalePos(card.high,0,scaleMax)-cBandLeft,cPoint=scalePos(card.value,0,scaleMax);return`
        <article class="lab-card" style="--status:${card.status.color}">
            <header class="lab-card-head">
                <div>
                    <h4 class="lab-card-title">${T(card.title)}</h4>
                    <p class="lab-card-sub">${T("İlgili gösterge:")} ${T(card.marker.label)}</p>
                </div>
                <span class="badge ${card.status.badgeClass}">${T(card.status.label)}</span>
            </header>
            <div class="lab-card-value">
                <strong>${fmt(card.value,dec)}</strong>
                <span class="unit">${card.unit}</span>
                <span class="lab-card-ci">tahmin aralığı ${fmt(card.low,dec)}–${fmt(card.high,dec)}</span>
            </div>
            <div class="ci-track slim">
                <div class="ci-ref" style="left:${cRefLeft}%;width:${cRefWidth}%"></div>
                <div class="ci-band" style="left:${cBandLeft}%;width:${cBandWidth}%"></div>
                <div class="ci-point" style="left:${cPoint}%"></div>
            </div>
            <p class="lab-card-ref">Laboratuvar normal aralığı: <b>${card.refText}</b></p>
            <p class="lab-card-explain">${T(card.explain)}</p>
        </article>`}).join("");panel.innerHTML=`
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
            <p class="estimate-note">${IC("i-info")} Bu bir tahmindir, teşhis değildir. Kesin değer yalnızca kan testiyle belirlenir.</p>
        </section>

        <div class="section-title">
            <h3>Semptomlarınıza göre öne çıkanlar</h3>
            <p>${est.cards.length} kart · kritik olan üstte</p>
        </div>
        ${driverCards}

        ${renderPlanPreview()}

        <div class="cta-block">
            <button class="btn-primary" onclick="goToVerification()">
                ${IC("i-drop")} &nbsp;KAN TESTİ İLE DOĞRULA
            </button>
            <button class="btn-ghost" onclick="showPlanTeaser()">Önce doğal plan önerilerini gör</button>
            <p class="trust-line">${IC("i-clock")} Sonuç 5 dakikada · ${IC("i-lock")} kayıt gerekmez · tek tıkla iptal</p>
        </div>

        <div id="planTeaser"></div>
    `,panel.classList.add("show"),setTimeout(()=>safeScroll(panel),180)}function renderPlanPreview(){return`
    <section class="preview-card">
        <div class="preview-blur" aria-hidden="true">
            <div class="preview-row"><span class="pr-ic"></span><span class="pr-bar w70"></span><span class="pr-chip"></span></div>
            <div class="preview-row"><span class="pr-ic"></span><span class="pr-bar w90"></span><span class="pr-chip"></span></div>
            <div class="preview-row"><span class="pr-ic"></span><span class="pr-bar w55"></span><span class="pr-chip"></span></div>
            <div class="preview-row"><span class="pr-ic"></span><span class="pr-bar w80"></span><span class="pr-chip"></span></div>
        </div>
        <div class="preview-overlay">
            <span class="preview-lock">${IC("i-lock")}</span>
            <p class="preview-title">12 haftalık kişisel planınız hazır</p>
            <p class="preview-sub">Doğrulama tamamlanınca dozlar, sıralama ve kontrol takvimi açılır.</p>
        </div>
    </section>`}function showPlanTeaser(){const box=document.getElementById("planTeaser");if(!box)return;const est=state.estimate,supplements=buildSupplements(est?{totalT:est.point}:{},!0);box.innerHTML=renderSupplementCard(supplements,"Tahmine dayalı ön plan","Doğrulamadan sonra dozlar kişiselleşir"),safeScroll(box)}function goToVerification(){changePage("bloodPage"),setProgress(80,"Analizin %80 tamamlandı — değerleri girince rapor açılır");const anchor=document.getElementById("uploadCard");setTimeout(()=>safeScroll(anchor,{behavior:"smooth",block:"center"}),350)}function currentUnit(markerId){const select=document.getElementById("unit-"+markerId),marker=V().MARKER_BY_ID[markerId];return select?select.value:marker.unit}function refreshFieldMeta(markerId){const marker=V().MARKER_BY_ID[markerId];if(!marker)return;const unit=currentUnit(markerId),input=document.getElementById(markerId),hint=document.getElementById("hint-"+markerId),accept=document.getElementById("accept-"+markerId);input&&(input.placeholder=V().placeholderFor(marker,unit)),hint&&(hint.innerHTML=`<b>${T("Lab normal aralığı:")} ${V().describeRange(marker,unit,"ref")}</b> — ${T(marker.explain)}`),accept&&(accept.textContent=T("Geçerli giriş aralığı:")+" "+V().describeRange(marker,unit,"accept"))}function onUnitChange(markerId,previousUnit){const marker=V().MARKER_BY_ID[markerId],input=document.getElementById(markerId),select=document.getElementById("unit-"+markerId);if(!marker||!input||!select)return;const from=previousUnit||select.dataset.previous||marker.unit,to=select.value,raw=V().parseNumber(input.value);if(raw!==null&&from!==to){const converted=V().convert(marker.key,raw,from,to),decimals=V().getUnit(marker,to).decimals;input.value=String(V().round(converted,decimals)).replace(".",","),showToast(`${IC("i-check")} ${marker.short}: ${from} → ${to} dönüştürüldü`,"blue")}select.dataset.previous=to,refreshFieldMeta(markerId),validateLabField(markerId)}function validateLabField(markerId){const marker=V().MARKER_BY_ID[markerId],input=document.getElementById(markerId);if(!marker||!input)return!0;const res=V().validateMarkerValue(input.value,marker,currentUnit(markerId));return res.ok?(clearFieldError(markerId),res.warning?setFieldWarning(markerId,res.warning):clearFieldWarning(markerId),!0):(setFieldError(markerId,res.error),!1)}function setMeasurementType(type){state.measurement=type,document.querySelectorAll("[data-measure]").forEach(btn=>{const active=btn.dataset.measure===type;btn.classList.toggle("active",active),btn.setAttribute("aria-pressed",String(active))});const label=document.getElementById("measurementNote");label&&(label.textContent=T(type==="baseline"?"Bu değerler başlangıç (ilk) ölçümü olarak kaydedilir.":"Bu değerler kontrol (takip) ölçümü olarak kaydedilir; önceki ölçümle karşılaştırılır."))}function toggleManualEntry(force){const section=document.getElementById("manualEntry"),link=document.getElementById("manualToggle");if(!section)return;(force===void 0?section.hasAttribute("hidden"):force)?(section.removeAttribute("hidden"),link&&(link.textContent=T("Elle girişi gizle")),safeScroll(section)):(section.setAttribute("hidden",""),link&&(link.textContent=T("Değerleri elle gireceğim")))}function togglePasteBox(force){var _a;const box=document.getElementById("pasteBox");if(!box)return;const willOpen=force===void 0?box.hasAttribute("hidden"):force;box.toggleAttribute("hidden",!willOpen),willOpen&&((_a=document.getElementById("pasteText"))==null||_a.focus())}function setConsent(checkbox){state.consent=!!checkbox.checked;const note=document.getElementById("consentError");note&&state.consent&&note.classList.remove("visible")}async function handleReportFile(inputEl){const file=inputEl.files&&inputEl.files[0];if(!file)return;const status=document.getElementById("uploadStatus"),setStatus=(html,tone)=>{status&&(status.className="upload-status "+(tone||""),status.innerHTML=html)};setStatus(`${IC("i-clock")} ${file.name} okunuyor…`,"busy");try{if(/\.pdf$/i.test(file.name)||file.type==="application/pdf"){const text=await extractPdfText(file);if(!text||text.replace(/\s/g,"").length<20){setStatus(`${IC("i-warning")} PDF taranmış görüntü olabilir; metin çıkarılamadı. Tahlil metnini yapıştırabilir ya da elle girebilirsiniz.`,"warn"),togglePasteBox(!0),toggleManualEntry(!0);return}applyParsedReport(text,file.name)}else if(/^image\//.test(file.type))setStatus(`${IC("i-warning")} Fotoğrafı aldık. Görüntüden otomatik okuma şu an yalnızca PDF metinlerinde çalışıyor — tahlil metnini yapıştırın veya değerleri elle girin.`,"warn"),togglePasteBox(!0),toggleManualEntry(!0);else{const text=await file.text();applyParsedReport(text,file.name)}}catch(error){console.warn(error),setStatus(`${IC("i-warning")} Dosya okunamadı. Tahlil metnini yapıştırabilir ya da elle girebilirsiniz.`,"warn"),togglePasteBox(!0),toggleManualEntry(!0)}}function parsePastedText(){var _a;const text=((_a=document.getElementById("pasteText"))==null?void 0:_a.value)||"";if(text.trim().length<10){showToast(IC("i-warning")+" Önce tahlil metnini yapıştırın.","red");return}applyParsedReport(text,"yapıştırılan metin")}function applyParsedReport(text,sourceName){const parsed=V().parseLabText(text),status=document.getElementById("uploadStatus"),found=parsed.matched.length;if(!found){status&&(status.className="upload-status warn",status.innerHTML=`${IC("i-warning")} ${sourceName} içinde tanıyabildiğimiz bir değer bulamadık. Aşağıdan elle girebilirsiniz.`),toggleManualEntry(!0);return}Object.keys(parsed.values).forEach(id=>{var _a;const input=document.getElementById(id),select=document.getElementById("unit-"+id);if(!input)return;select&&parsed.units[id]&&(select.value=parsed.units[id],select.dataset.previous=parsed.units[id]);const marker=V().MARKER_BY_ID[id],decimals=V().getUnit(marker,parsed.units[id]||marker.unit).decimals;input.value=String(V().round(parsed.values[id],decimals)).replace(".",","),refreshFieldMeta(id),validateLabField(id),(_a=input.closest(".lab-row"))==null||_a.classList.add("autofilled")}),state.lastSource="upload",toggleManualEntry(!0),status&&(status.className="upload-status ok",status.innerHTML=`${IC("i-check")} ${sourceName}: <b>${found} değer</b> okundu ve forma yazıldı. Lütfen gözden geçirip onaylayın.`),showToast(`${IC("i-check")} ${found} değer otomatik dolduruldu`,"green"),setProgress(90,"Analizin %90 tamamlandı — değerleri onaylayın")}async function extractPdfText(file){const buffer=new Uint8Array(await file.arrayBuffer()),latin1=new TextDecoder("latin1").decode(buffer),chunks=[],marker=/stream\r?\n?/g;let match;for(;(match=marker.exec(latin1))!==null;){const start=match.index+match[0].length,end=latin1.indexOf("endstream",start);if(end===-1)break;const slice=buffer.subarray(start,end);let decoded=await inflateMaybe(slice);decoded&&chunks.push(decoded),marker.lastIndex=end}return chunks.map(extractTextOperators).join(`
`)}async function inflateMaybe(bytes){const asText=new TextDecoder("latin1").decode(bytes);if(/\bTj\b|\bTJ\b/.test(asText))return asText;if(typeof DecompressionStream=="undefined")return null;for(const format of["deflate","deflate-raw","gzip"])try{const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format)),out=await new Response(stream).arrayBuffer(),text=new TextDecoder("latin1").decode(out);if(/\bTj\b|\bTJ\b/.test(text))return text}catch{}return null}function extractTextOperators(content){const lines=[];let current="";const token=/\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>|\bT[dDmJj\*]\b|\bET\b/g;let m;for(;(m=token.exec(content))!==null;){const piece=m[0];if(piece.startsWith("("))current+=piece.slice(1,-1).replace(/\\([nrt])/g," ").replace(/\\(\d{1,3})/g,(_,oct)=>String.fromCharCode(parseInt(oct,8))).replace(/\\(.)/g,"$1");else if(piece.startsWith("<")){const hex=piece.slice(1,-1).replace(/\s/g,"");for(let i=0;i+3<hex.length+1;i+=4){const code=parseInt(hex.substr(i,4),16);code&&(current+=String.fromCharCode(code))}}else(piece==="Td"||piece==="TD"||piece==="T*"||piece==="ET"||piece==="Tm")&&(current.trim()&&lines.push(current.trim()),current="")}return current.trim()&&lines.push(current.trim()),lines.join(`
`)}function analyzeBlood(){var _a,_b;const markers=V().MARKERS,values={},units={};markers.forEach(m=>{const input=document.getElementById(m.id);values[m.id]=input?input.value:"",units[m.id]=currentUnit(m.id)});const result=V().validateBloodPanel(values,units);if(markers.forEach(m=>{result.errors[m.id]?setFieldError(m.id,result.errors[m.id]):(clearFieldError(m.id),result.warnings[m.id]?setFieldWarning(m.id,result.warnings[m.id]):clearFieldWarning(m.id))}),!result.ok){toggleManualEntry(!0),showToast(IC("i-warning")+" "+result.message,"red"),(_a=document.getElementById(result.firstErrorId))==null||_a.focus();return}if(!state.consent){const note=document.getElementById("consentError");note&&note.classList.add("visible"),(_b=document.getElementById("consentCheck"))==null||_b.focus(),showToast(IC("i-lock")+" Devam etmek için sağlık verisi açık rızası gerekiyor.","red");return}const warned=Object.keys(result.warnings);warned.length&&showToast(`${IC("i-warning")} ${warned.length} değer alışılmadık — rapora hekim notu eklendi.`,"gold"),setProgress(100,"Analiz tamamlandı"),renderBloodReport(result)}function renderBloodReport(result){const panel=document.getElementById("bloodResult"),score=V().computeOverallScore(result.values),markers=V().MARKERS,rows=markers.filter(m=>result.values[m.key]!==void 0).map(m=>{const value=result.values[m.key],unit=currentUnit(m.id),decimals=V().getUnit(m,unit).decimals,shown=V().fromCanonical(m,value,unit),status=V().classify(m,value);return`
            <tr style="--status:${status.color}">
                <th scope="row">${m.short}</th>
                <td class="num">${fmt(shown,decimals)} <span class="unit">${unit}</span></td>
                <td class="num ref">${V().describeRange(m,unit,"ref")}</td>
                <td><span class="badge ${status.badgeClass}">${T(status.label)}</span></td>
            </tr>`}).join(""),flagged=markers.filter(m=>result.values[m.key]!==void 0).map(m=>({marker:m,value:result.values[m.key],status:V().classify(m,result.values[m.key])})).filter(item=>item.status.key!=="normal").sort((a,b)=>a.status.rank-b.status.rank),warningList=Object.keys(result.warnings).map(id=>`<li><b>${V().MARKER_BY_ID[id].short}:</b> ${result.warnings[id]}</li>`).join(""),estimateCompare=state.estimate?`
        <div class="compare-line">
            ${IC("i-activity")} Semptom tahminimiz <b>${fmt(state.estimate.point)} ng/dL</b> idi;
            ölçülen değer <b>${result.values.totalT!==void 0?fmt(result.values.totalT)+" ng/dL":"—"}</b>.
        </div>`:"",supplements=buildSupplements(result.values,!1);panel.innerHTML=`
        <section class="score-card">
            <header class="score-head">
                <div>
                    <p class="eyebrow">${state.measurement==="baseline"?"Başlangıç ölçümü":"Kontrol (takip) ölçümü"}</p>
                    <h3>Genel Değerlendirme</h3>
                </div>
                <button type="button" class="info-btn" aria-expanded="false" aria-controls="scoreTooltip"
                        onclick="toggleScoreTooltip(this)" aria-label="Skor nasıl hesaplanıyor?">${IC("i-info")}</button>
            </header>
            <div class="score-value">%${score.score}</div>
            <div class="score-track"><div class="score-fill" style="width:${score.score}%"></div></div>
            <p class="score-sub">Kapsama: girdiğiniz parametreler toplam ağırlığın %${score.coverage}’ini karşılıyor.</p>
            <div class="tooltip-panel" id="scoreTooltip" hidden>
                <p>${score.formula}</p>
                <ul class="score-breakdown">
                    ${score.breakdown.map(b=>`
                        <li>
                            <span>${b.label} <small>(ağırlık %${b.weight})</small></span>
                            <span class="badge ${b.status.badgeClass}">${b.points} puan</span>
                        </li>`).join("")}
                </ul>
            </div>
            ${estimateCompare}
        </section>

        <section class="card">
            <div class="card-header">
                <div class="card-icon icon-blue">${IC("i-doc")}</div>
                <div>
                    <div class="card-title">Değerleriniz ve referans aralıkları</div>
                    <div class="card-subtitle">${rows?markers.filter(m=>result.values[m.key]!==void 0).length:0} parametre</div>
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

        ${flagged.length?`
        <div class="section-title">
            <h3>Öne çıkan bulgular</h3>
            <p>${flagged.length} parametre aralık dışında · kritik olan üstte</p>
        </div>
        ${flagged.map(item=>{const unit=currentUnit(item.marker.id),decimals=V().getUnit(item.marker,unit).decimals;return`
            <article class="lab-card" style="--status:${item.status.color}">
                <header class="lab-card-head">
                    <div>
                        <h4 class="lab-card-title">${T(item.marker.label)}</h4>
                        <p class="lab-card-sub">${state.measurement==="baseline"?"Başlangıç ölçümü":"Kontrol ölçümü"}</p>
                    </div>
                    <span class="badge ${item.status.badgeClass}">${T(item.status.label)}</span>
                </header>
                <div class="lab-card-value">
                    <strong>${fmt(V().fromCanonical(item.marker,item.value,unit),decimals)}</strong>
                    <span class="unit">${unit}</span>
                </div>
                <p class="lab-card-ref">Laboratuvar normal aralığı: <b>${V().describeRange(item.marker,unit,"ref")}</b></p>
                <p class="lab-card-explain">${T(item.marker.explain)}</p>
            </article>`}).join("")}`:""}

        ${warningList?`
        <section class="card warn-card">
            <div class="card-header">
                <div class="card-icon icon-gold">${IC("i-warning")}</div>
                <div>
                    <div class="card-title">Alışılmadık değerler</div>
                    <div class="card-subtitle">Reddetmedik — teyit edin</div>
                </div>
            </div>
            <ul class="plain-list">${warningList}</ul>
            <p class="muted">Bu değerler doğruysa sonucu bir endokrinoloji veya üroloji hekimiyle paylaşmanızı öneririz.</p>
        </section>`:""}

        ${renderSupplementCard(supplements,"Kişisel takviye planı",`${supplements.length} öneri · doz ve sıra önceliklendirildi`)}

        <section class="card">
            <div class="card-header">
                <div class="card-icon icon-blue">${IC("i-calendar")}</div>
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
                <div class="card-icon icon-red">${IC("i-warning")}</div>
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
            ${IC("i-arrow-up")} &nbsp;Başa dön
        </button>
    `,panel.classList.add("show"),setTimeout(()=>safeScroll(panel),180),showToast(IC("i-check")+" Rapor hazır.","green")}function toggleScoreTooltip(button){const panel=document.getElementById("scoreTooltip");if(!panel)return;const open=panel.hasAttribute("hidden");panel.toggleAttribute("hidden",!open),button.setAttribute("aria-expanded",String(open))}const PRIORITY={critical:{label:"Kritik",badgeClass:"badge-critical",rank:0},high:{label:"Öncelikli",badgeClass:"badge-low",rank:1},support:{label:"Destekleyici",badgeClass:"badge-borderline",rank:2},base:{label:"Temel",badgeClass:"badge-normal",rank:3}};function buildSupplements(values,isPreview){const list=[],v=values||{};return v.vitD!==void 0?v.vitD<20?list.push(sup("D3 Vitamini + K2","D vitamininiz "+fmt(v.vitD,1)+" ng/mL — ciddi eksiklik (normal 30–100).","5000 IU D3 + 200 mcg K2 / gün","critical")):v.vitD<30&&list.push(sup("D3 Vitamini + K2","D vitamininiz "+fmt(v.vitD,1)+" ng/mL — yetersiz (normal 30–100).","3000 IU D3 + 100 mcg K2 / gün","high")):list.push(sup("D3 Vitamini + K2","Değer girilmedi; Türkiye’de erişkin erkeklerin büyük kısmında yetersizlik bildiriliyor.","2000 IU D3 + 100 mcg K2 / gün","high")),v.ferritin!==void 0&&v.ferritin<30&&list.push(sup("Demir (hekim kontrolünde)","Ferritin "+fmt(v.ferritin)+" ng/mL — depo demiri düşük.","Dozu hekiminiz belirlemeli","critical")),v.b12!==void 0&&v.b12<300&&list.push(sup("B12 (Metilkobalamin)","B12 "+fmt(v.b12)+" pg/mL — düşük.",v.b12<200?"2000 mcg / gün":"1000 mcg / gün",v.b12<200?"critical":"high")),v.zinc!==void 0&&v.zinc<70?list.push(sup("Çinko Pikolinat","Çinko "+fmt(v.zinc)+" µg/dL — düşük.",v.zinc<60?"30 mg / gün":"15 mg / gün",v.zinc<60?"critical":"high")):v.zinc===void 0&&list.push(sup("Çinko Pikolinat","Testosteron sentezinde doğrudan rol alır.","15 mg / gün (akşam yemeğiyle)","support")),v.mg!==void 0&&v.mg<2?list.push(sup("Magnezyum Bisglisinat","Magnezyum "+fmt(v.mg,2)+" mg/dL — düşük.",v.mg<1.7?"400 mg / gece":"200 mg / gece","high")):v.mg===void 0&&list.push(sup("Magnezyum Bisglisinat","SHBG bağlanmasını azaltarak serbest testosteronu destekler.","200 mg / gece","support")),v.cortisol!==void 0&&v.cortisol>20&&list.push(sup("Ashwagandha KSM-66","Kortizol "+fmt(v.cortisol,1)+" µg/dL — üst sınırın üzerinde.","600 mg / gün (2 × 300 mg)","high")),v.estradiol!==void 0&&v.estradiol>62&&list.push(sup("Kilo ve alkol yönetimi","Estradiol "+fmt(v.estradiol,1)+" pg/mL — yüksek; aromataz aktivitesi artmış olabilir.","Aromataz inhibitörü yalnızca hekim kararıyla","high")),list.push(sup("Omega-3 (EPA/DHA)","Temel destek: inflamasyon ve hormonal denge.","2000–3000 mg / gün","base")),isPreview&&list.forEach(item=>{item.dose="Doğrulamadan sonra kişiselleşir"}),list.sort((a,b)=>PRIORITY[a.priority].rank-PRIORITY[b.priority].rank)}function sup(name,desc,dose,priority){return{name,desc,dose,priority}}function renderSupplementCard(supplements,title,subtitle){return`
    <section class="card">
        <div class="card-header">
            <div class="card-icon icon-gold">${IC("i-star")}</div>
            <div>
                <div class="card-title">${title}</div>
                <div class="card-subtitle">${subtitle}</div>
            </div>
        </div>
        ${supplements.map(item=>{const prio=PRIORITY[item.priority];return`
            <div class="result-item" style="--status:${prio.badgeClass==="badge-critical"?"var(--red)":prio.badgeClass==="badge-low"?"var(--gold)":prio.badgeClass==="badge-borderline"?"var(--blue)":"var(--green)"}">
                <div class="result-body">
                    <div class="result-name">${item.name}<span class="badge ${prio.badgeClass}">${prio.label}</span></div>
                    <div class="result-desc">${item.desc}</div>
                    <div class="result-dose">${item.dose}</div>
                </div>
            </div>`}).join("")}
    </section>`}function initAnalysisScreens(){V()&&(renderSteppers(),setProgress(10,"Analize başlayın"),renderSymptomGrid(),onSymptomChange(),setMeasurementType("baseline"),V().PHYSICAL_FIELDS.forEach(field=>{const input=document.getElementById(field.id);input&&(input.addEventListener("input",()=>clearFieldError(field.id)),input.addEventListener("blur",()=>{const check=V().validateField(input.value,field);check.ok?clearFieldError(field.id):setFieldError(field.id,check.error)}))}),V().MARKERS.forEach(marker=>{const input=document.getElementById(marker.id),select=document.getElementById("unit-"+marker.id);select&&(select.dataset.previous=select.value),refreshFieldMeta(marker.id),input&&(input.addEventListener("input",()=>clearFieldError(marker.id)),input.addEventListener("blur",()=>validateLabField(marker.id)))}))}document.addEventListener("DOMContentLoaded",initAnalysisScreens),window.addEventListener("testo-language-change",()=>{V()&&(renderSteppers(),onSymptomChange(),setMeasurementType(state.measurement),V().MARKERS.forEach(marker=>refreshFieldMeta(marker.id)),setProgress(state.progress,state.progressNote))});const OPTIONAL_FEATURES_URL="js/content.82f084cb.js";let optionalFeaturesPromise;function loadOptionalFeatures(){return window.__testoOptionalReady?Promise.resolve():optionalFeaturesPromise||(optionalFeaturesPromise=new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=OPTIONAL_FEATURES_URL,script.onload=()=>resolve(),script.onerror=()=>reject(new Error("İsteğe bağlı içerik modülü yüklenemedi.")),document.head.appendChild(script)}).catch(error=>{optionalFeaturesPromise=null,console.warn(error.message);const list=document.getElementById("contentList");list&&(list.innerHTML='<div class="empty-state">İçerikler şu anda yüklenemedi. Lütfen tekrar deneyin.</div>')}),optionalFeaturesPromise)}function setLanguage(language){loadOptionalFeatures().then(()=>window.setLanguage(language))}localStorage.getItem("testotavan_language")&&localStorage.getItem("testotavan_language")!=="tr"&&loadOptionalFeatures();
