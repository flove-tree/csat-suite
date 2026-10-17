/* Samun-only JSON backup and confirmed whole-record restore. */
(() => {
'use strict';
const KEY='samun_notes_v1',FORMAT='flove-samun-json-backup',MAX_BYTES=10*1024*1024,MAX_NOTES=20000;
const subjects=['absolute','concept','statistics'],categories=['수능/평가원','교육청','EBS/사설'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function validateNotes(list,legacy=false){
 if(!Array.isArray(list)||list.length>MAX_NOTES)throw Error('사문 기록 배열이 아니거나 기록 수가 너무 많습니다.');
 const ids=new Set();
 for(const [index,n]of list.entries()){
  const where=(index+1)+'번째 기록: ';
  if(!object(n)||!Number.isSafeInteger(n.id)||n.id<0||ids.has(n.id))throw Error(where+'ID가 잘못됐거나 중복됩니다.');
  ids.add(n.id);
  if((legacy&&!has(n,'subject'))||(has(n,'subject')&&!subjects.includes(n.subject)))throw Error(where+'사회문화 탭 분류가 아닙니다.');
  if(typeof n.passageTitle!=='string'||typeof n.content!=='string'||!categories.includes(n.category))throw Error(where+'제목·내용·시험 분류를 확인해 주세요.');
  for(const field of ['year','monthDetail','unit','createdAt','updatedAt'])if(has(n,field)&&(typeof n[field]!=='string'||/[<>]/.test(n[field])))throw Error(where+field+' 필드 형식이 올바르지 않습니다.');
 }
 return list;
}
function parseBackup(text){
 if(typeof text!=='string'||text.length>MAX_BYTES)throw Error('JSON 파일이 너무 크거나 읽을 수 없습니다.');
 let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch(_){throw Error('올바른 JSON 파일이 아닙니다.');}
 if(Array.isArray(data))return validateNotes(data,true);
 if(!object(data)||data.format!==FORMAT||data.version!==1||data.app!=='samun'||data.key!==KEY)throw Error('사회문화 전용 JSON 백업 파일을 선택해 주세요.');
 return validateNotes(data.notes);
}
function makeBackup(list){
 validateNotes(list);
 return {format:FORMAT,version:1,app:'samun',key:KEY,createdAt:new Date().toISOString(),notes:JSON.parse(JSON.stringify(list))};
}
function counts(list){const c={absolute:0,concept:0,statistics:0};for(const n of list)c[n.subject||'absolute']++;return c;}
if(typeof module!=='undefined'&&module.exports){module.exports={KEY,FORMAT,MAX_BYTES,MAX_NOTES,validateNotes,parseBackup,makeBackup,counts};return;}
const cfg=window.FLOVE_SYNC_CONFIG||{};if(cfg.page!=='samun'||cfg.readOnly)return;
function init(){
 const group=document.querySelector('.export-btns'),form=document.getElementById('noteForm');
 if(!group||!form||document.getElementById('samun-json-backup-save')||typeof notes==='undefined')return;
 const style=document.createElement('style');style.textContent='.export-btns.samun-json-actions{flex-wrap:wrap;justify-content:flex-end}.samun-json-actions .samun-json-status{flex-basis:100%;font-size:11px;line-height:1.6;text-align:right;color:var(--text-muted,#64748b)}.samun-json-actions [hidden]{display:none!important}@media(max-width:850px){.container>header.samun-json-header{flex-wrap:wrap;gap:12px;align-items:flex-start}.export-btns.samun-json-actions{justify-content:flex-start;width:100%}.samun-json-actions .samun-json-status{text-align:left}}';document.head.appendChild(style);
 group.classList.add('samun-json-actions');const header=group.closest('header');if(header)header.classList.add('samun-json-header');
 const button=(id,text)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.id=id;b.textContent=text;return b;};
 const save=button('samun-json-backup-save','💾 JSON 백업 저장'),load=button('samun-json-backup-load','📂 백업 불러오기');
 save.title='검색·필터와 관계없이 저장된 사문 세 탭 전체를 백업합니다. 저장 전 입력은 포함하지 않습니다.';
 load.title='검증과 원본 보관 후 사문 세 탭의 기록 전체를 교체합니다. 자동 병합이 아닙니다.';
 const input=document.createElement('input');input.id='samun-json-backup-file';input.type='file';input.accept='.json,application/json';input.hidden=true;
 const status=document.createElement('span');status.id='samun-json-backup-status';status.className='samun-json-status';status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 group.prepend(save,load);group.append(input,status);let busy=false;
 function message(text,bad=false){status.textContent=text;status.style.color=bad?'var(--danger,#b91c1c)':'var(--text-muted,#64748b)';status.hidden=false;}
 function api(){const s=window.FloveSync;for(const name of ['validateData','saveLocal','backupCurrent','markSaved'])if(!s||typeof s[name]!=='function')throw Error('저장 관리가 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.');return s;}
 function readStored(raw=localStorage.getItem(KEY)){if(raw===null)throw Error('기기에 저장된 사문 기록을 찾지 못했습니다.');api().validateData(KEY,raw);let list;try{list=JSON.parse(raw);}catch(_){throw Error('기기 기록이 손상되어 작업을 중단했습니다.');}return validateNotes(list);}
 function drafting(){if(typeof editingId!=='undefined'&&editingId!==null)return true;return ['yearInput','monthDetail','passageTitle','noteContent'].some(id=>{const e=document.getElementById(id);return e&&e.value.trim()!=='';});}
 function assertIdle(){if(drafting())throw Error('작성·수정 중인 입력을 먼저 저장하거나 취소·비운 뒤 불러와 주세요.');}
 save.addEventListener('click',()=>{
  let url;
  try{const list=readStored(),data=makeBackup(list);url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='사회문화_전체_JSON백업_'+new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove();message('저장된 사문 기록 '+list.length+'개의 JSON 백업 다운로드를 요청했습니다. 작성 중인 미저장 입력은 제외됩니다.');}
  catch(e){message('백업 저장 실패: '+e.message,true);}
  finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
 });
 load.addEventListener('click',()=>{if(busy)return;try{assertIdle();input.click();}catch(e){message(e.message,true);}});
 input.addEventListener('change',async()=>{
  const file=input.files&&input.files[0];if(!file||busy)return;
  busy=true;load.disabled=true;
  try{
   assertIdle();if(file.size>MAX_BYTES)throw Error('10 MiB 이하의 JSON 파일을 선택해 주세요.');
   const beforeRaw=localStorage.getItem(KEY);const beforeList=readStored(beforeRaw);
   const incoming=parseBackup(await file.text());
   assertIdle();if(localStorage.getItem(KEY)!==beforeRaw)throw Error('파일을 읽는 동안 기기 기록이 바뀌었습니다. 다시 불러와 주세요.');
   if(!incoming.length)throw Error('기록이 없는 백업으로 기존 기록을 지우지는 않습니다.');
   const value=JSON.stringify(incoming);
   if(value===beforeRaw){message('백업과 기기 기록이 같아 변경하지 않았습니다.');return;}
   const c=counts(incoming);
   if(!confirm('사회문화 세 탭의 기록 전체를 교체합니다. 자동 병합이 아닙니다.\n현재 '+beforeList.length+'개 → 백업 '+incoming.length+'개\n절대강령 '+c.absolute+' · 개념 & 선지 '+c.concept+' · 도표 & 통계 '+c.statistics+'\n\n기존 기기 기록을 자동 보관한 뒤 교체합니다. 다른 과목은 변경하지 않습니다.\n교체 후 서버 반영은 기존 동기화 절차에서 처리하며 충돌이 나면 확인이 필요합니다.\n계속할까요?')){message('불러오기를 취소했습니다. 기존 기록과 입력을 유지했습니다.');return;}
   assertIdle();if(localStorage.getItem(KEY)!==beforeRaw)throw Error('확인하는 동안 기록이 바뀌었습니다. 다시 불러와 주세요.');
   const s=api();s.backupCurrent('before-samun-json-import');
   if(localStorage.getItem(KEY)!==beforeRaw)throw Error('원본을 보관하는 동안 기록이 바뀌어 교체를 중단했습니다.');
   const memory=notes;let committed=false;
   try{
    notes=incoming;renderNotes();
    if(localStorage.getItem(KEY)!==beforeRaw)throw Error('화면을 준비하는 동안 기록이 바뀌어 교체를 중단했습니다.');
    s.saveLocal(KEY,value);committed=true;
    if(localStorage.getItem(KEY)!==value)throw Error('저장 결과를 확인하지 못했습니다. 자동 보관된 원본을 확인해 주세요.');
   }catch(e){
    notes=memory;
    if(committed){try{const latest=localStorage.getItem(KEY);api().validateData(KEY,latest);notes=validateNotes(JSON.parse(latest));}catch(_){} }
    try{renderNotes();}catch(_){}
    throw e;
   }
   s.markSaved();message('사문 기록 '+incoming.length+'개를 기기에 불러왔습니다. 서버 저장 여부는 동기화 상태에서 확인해 주세요.');
  }catch(e){message('불러오기 중단: '+e.message,true);}
  finally{busy=false;load.disabled=false;input.value='';}
 });
 form.dataset.samunJsonBackup='true';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
