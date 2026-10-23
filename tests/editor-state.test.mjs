import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
const state=fs.readFileSync(new URL('../admin/editor-state.js',import.meta.url),'utf8');
function draftTools(){const context={window:{}};vm.createContext(context);vm.runInContext(state,context);return context.window.TestoEditorState;}
const item={type:'recipe',title:'Tarif',summary:'Özet',body:'Hazırlanış',category:'Tarifler',time:'30 dk',ingredients:['2 yumurta'],translations:{en:{title:'Recipe',ingredients:['2 eggs']}},emoji:'🥗',cover_url:'',pinterest:false};

test('taslak kodlama yayın alanlarını korur, kimlik ve sırları dışlar',()=>{
  const api=draftTools();const encoded=api.encode({...item,id:'private-record',apiKey:'secret-key',password:'secret-password',translations:{...item.translations,en:{...item.translations.en,token:'secret-token'}}});
  assert.doesNotMatch(encoded,/secret-|private-record/);
  const decoded=api.decode(encoded);
  assert.equal(decoded.type,'recipe');assert.deepEqual([...decoded.ingredients],['2 yumurta']);assert.deepEqual([...decoded.translations.en.ingredients],['2 eggs']);assert.equal(decoded.pinterest,false);
});

test('taslakta bozuk JSON, sürüm, boyut, alan ve kapak reddedilir',()=>{
 const api=draftTools();
 for(const value of ['bad','{}','null',JSON.stringify({version:2,item}), 'a'.repeat(500001)])assert.throws(()=>api.decode(value));
 for(const invalid of [{...item,type:'unknown'},{...item,title:'a'.repeat(101)},{...item,ingredients:[{}]},{...item,ingredients:Array(101).fill('a')},{...item,cover_url:'javascript:alert(1)'},{...item,body:{}}])assert.throws(()=>api.encode(invalid));
});

function publishHarness({editing=true}={}){
 let data=structuredClone(item),resolve;
 const button={disabled:false,textContent:''};const result={append(){}};
 const c={window:{TestoEditorState:draftTools()},saveBusy:false,editingId:editing?'old-id':null,editorContext:1,savedEditorSnapshot:'',items:editing?[{...item,id:'old-id'}]:[],resetCount:0,renderCount:0,toasts:[],readEditorData:()=>structuredClone(data),$:id=>id==='publish-btn'?button:result,toast:text=>c.toasts.push(text),publicUrlFor:row=>`/blog/${row.id}/`,pinReport(){},render(){c.renderCount++},setEditorMode(mode){c.mode=mode},resetEditor(){c.resetCount++;c.editingId=null},showPublishResult(){c.resultShown=true},document:{createTextNode:t=>t},fetch:()=>{c.requests++;return new Promise(done=>resolve=done)},requests:0};
 vm.createContext(c);vm.runInContext(html.slice(html.indexOf('async function publish(e){'),html.indexOf('function showPublishResult')),c);
 return {c,button,setData:newData=>{data=newData},finish:(row,ok=true)=>resolve({ok,json:async()=>row}),submit:()=>c.publish({preventDefault(){}})};
}

test('çift tıklama tek istek oluşturur; başarılı güncelleme düzenleme modunda kalır',async()=>{
 const h=publishHarness();const first=h.submit();await h.submit();assert.equal(h.c.requests,1);assert.equal(h.button.disabled,true);h.finish({...item,id:'old-id'});await first;assert.equal(h.c.mode,'edit');assert.equal(h.c.resetCount,0);assert.equal(h.button.disabled,false);assert.equal(h.c.saveBusy,false);
});

test('kaydetme sırasında başka kayıt açılınca yanlış kayıt/form değişmez',async()=>{
 const h=publishHarness();const pending=h.submit();h.c.items.push({...item,id:'another-id'});h.c.editingId='another-id';h.c.editorContext++;h.finish({...item,id:'old-id',title:'Kaydedilmiş eski kayıt'});await pending;
 assert.equal(h.c.items.find(x=>x.id==='old-id').title,'Kaydedilmiş eski kayıt');assert.equal(h.c.items.find(x=>x.id==='another-id').title,item.title);assert.equal(h.c.editingId,'another-id');assert.equal(h.c.resetCount,0);assert.equal(h.c.resultShown,undefined);
});

test('yeni yayın sürerken eklenen değişiklikler korunur ve sonraki kayıt PUT olur',async()=>{
 const h=publishHarness({editing:false});const pending=h.submit();h.setData({...item,title:'Henüz kaydedilmemiş başlık'});h.finish({...item,id:'new-id'});await pending;
 assert.equal(h.c.resetCount,0);assert.equal(h.c.editingId,'new-id');assert.equal(h.c.mode,'edit');assert.equal(JSON.parse(h.c.savedEditorSnapshot).title,item.title);
});

test('değişmeyen yeni yayın formu temizler; hata formu temizlemez',async()=>{
 const h=publishHarness({editing:false});const pending=h.submit();h.finish({...item,id:'new-id'});await pending;assert.equal(h.c.resetCount,1);
 const bad=publishHarness({editing:false});const wait=bad.submit();bad.finish({error:'Servis kesintisi'},false);await wait;assert.equal(bad.c.resetCount,0);assert.equal(bad.c.items.length,0);assert.match(bad.c.toasts.at(-1),/Form korundu/);assert.equal(bad.button.disabled,false);
});

test('kaydedilmemiş form uyarısı, güvenli geri yükleme ve gizli durum ekranı bağlıdır',()=>{
 assert.match(html,/window.addEventListener\('beforeunload'/);assert.match(html,/function confirmEditorDiscard/);assert.match(html,/sessionStorage.setItem\(EDITOR_DRAFT_KEY,window.TestoEditorState.encode\(readEditorData\(\)\)\)/);assert.match(html,/resetEditor\(\);applyGeneratedBlog\(item\)/);assert.match(html,/fetch\('\/api\/session\?settings=1'/);assert.match(html,/fetch\('\/api\/session',\{method:'DELETE'\}\)/);
});
