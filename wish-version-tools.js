/* Version-aware navigation and explicit wish conflict resolution. */
(function(root){
'use strict';
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
function choose(api,local,remote,choices){
 const l=new Map(api.parse(local).map(w=>[w.date,w])),r=new Map(api.parse(remote).map(w=>[w.date,w]));
 const rows=[];
 for(const date of [...new Set([...l.keys(),...r.keys()])].sort()){
  const a=l.get(date),b=r.get(date);let row=a;
  if(canonical(a)!==canonical(b)){
   if(!['local','remote'].includes(choices[date]))throw Error(date+'의 기기/서버 기록을 선택해 주세요.');
   row=choices[date]==='local'?a:b;
  }
  if(row!==undefined)rows.push(row);
 }
 const value=JSON.stringify(rows);api.parse(value);return value;
}
function service(api,storage,transport,lock,refresh){
 const key=api.KEY,metaKey='__flove_wish_sync_v1:'+encodeURIComponent(transport.identity);
 const readMeta=raw=>{
  const m=raw===null?{version:1,known:false,base:null,pending:null}:JSON.parse(raw);
  if(!m||m.version!==1||typeof m.known!=='boolean'||(!m.known&&m.base!==null)||!Object.prototype.hasOwnProperty.call(m,'pending'))throw Error('동기화 기준 기록을 읽지 못했어요.');
  api.parse(m.base);
  if(m.pending!==null){if(!m.pending||typeof m.pending.value!=='string')throw Error('전송 대기 기록 오류');for(const k of ['expected','value','local'])api.parse(m.pending[k]);}
  return m;
 };
 const flow=fn=>lock('flove-wish-flow:'+transport.identity,fn),daily=fn=>lock('wish-daily-save',fn);
 async function inspect(){return flow(async()=>{
  const s=await daily(()=>{const local=storage.getItem(key),metaRaw=storage.getItem(metaKey);api.parse(local);return {local,metaRaw,meta:readMeta(metaRaw)};});
  s.remote=await transport.read();api.parse(s.remote);return s;
 });}
 async function apply(s,choices){return flow(async()=>{
  const remote=await transport.read();api.parse(remote);
  if(remote!==s.remote)throw Error('비교 후 서버 기록이 바뀌었어요. 다시 비교해 주세요.');
  const value=choose(api,s.local,s.remote,choices);
  const staged=await daily(()=>{
   if(storage.getItem(key)!==s.local||storage.getItem(metaKey)!==s.metaRaw)throw Error('비교 후 기기 기록이 바뀌었어요. 다시 비교해 주세요.');
   const id=root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
   const backupKey=metaKey+':manual-recovery:'+id;
   const backup=JSON.stringify({version:1,reason:'manual-conflict-choice',createdAt:new Date().toISOString(),local:s.local,remote:s.remote,metaRaw:s.metaRaw,choices,value});
   storage.setItem(backupKey,backup);if(storage.getItem(backupKey)!==backup)throw Error('복구본 저장 실패 — 적용 중단');
   const meta={...s.meta,pending:{expected:remote,value,local:s.local}},raw=JSON.stringify(meta);
   storage.setItem(metaKey,raw);if(storage.getItem(metaKey)!==raw)throw Error('전송 대기 저장 실패 — 적용 중단');
   return {raw,backupKey};
  });
  let confirmed=remote;
  if(api.normalize(value)!==api.normalize(remote)){
   const result=await transport.compareAndSet(remote,value);
   if(result.result!=='success'||result.value!==value)throw Error('서버 기록이 바뀌었거나 저장을 확인하지 못했어요. 원본·대기 기록을 보관했어요. 다시 비교해 주세요.');
   confirmed=result.value;
  }
  await daily(()=>{
   if(storage.getItem(key)!==s.local||storage.getItem(metaKey)!==staged.raw)throw Error('서버 확인 중 기기 기록이 바뀌었어요. 서버 반영 여부를 다시 확인해 주세요.');
   try{
    storage.setItem(key,confirmed===null?'[]':confirmed);
    if(storage.getItem(key)!==(confirmed===null?'[]':confirmed))throw Error('기기 반영 확인 실패');
    refresh();
    if(storage.getItem(key)!==(confirmed===null?'[]':confirmed))throw Error('화면 갱신 중 기록 변경');
   }catch(error){
    if(storage.getItem(key)===(confirmed===null?'[]':confirmed)){
     if(s.local===null)storage.removeItem(key);else storage.setItem(key,s.local);
     try{refresh();}catch(_){}
    }
    throw error;
   }
   const done=JSON.stringify({...s.meta,known:true,base:confirmed,pending:null});
   storage.setItem(metaKey,done);if(storage.getItem(metaKey)!==done)throw Error('서버 확인 기준 저장 실패');
  });
  return staged.backupKey;
 });}
 return {inspect,apply};
}
if(typeof module==='object'&&module.exports){module.exports={choose,service};return;}
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
const version=document.querySelector('meta[name="flove-build"]')?.content||'';
const wish=!!document.getElementById('dataDialog');
const host=wish?document.getElementById('dataDialog'):(document.querySelector('footer')||document.body);
const panel=el('section');panel.id='flove-version-tools';panel.style.cssText='margin:14px 0;padding:12px;border:1px solid #94a3b855;border-radius:12px;font-size:12px;line-height:1.7';
const info=el('p','현재 실행 버전: '+(version.slice(0,12)||'확인 불가'));
const notice=el('p'),update=el('button','새 버전 확인'),reload=el('button','작성 내용을 저장한 뒤 새 버전 열기');
for(const b of [update,reload])b.type='button';reload.hidden=true;notice.setAttribute('role','status');
panel.append(info,notice,update,reload);host.append(panel);
let latestVersion='',checking=null,versionCheckBusy=false;
function drafting(){return wish&&(phase!=='idle'||editing||!!flight||pending!==null||!!$('wish').value.trim()||(typeof pastBusy!=='undefined'&&pastBusy)||(!$('pastForm')?.hidden&&!!$('pastWish')?.value.trim()));}
function destination(file,commit){const u=new URL(file,location.href);u.searchParams.set('flove_build',commit);return u.href;}
async function latest(){
 if(checking)return checking;
 checking=(async()=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);try{
  const u=new URL('site-version.json',location.href);u.searchParams.set('check',String(Date.now()));
  const r=await fetch(u,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('배포 정보 조회 실패');
  const v=await r.json();if(!/^[0-9a-f]{40}$/.test(v.commit))throw Error('배포 버전 형식 오류');return v.commit;
 }finally{clearTimeout(t);}})();
 try{return await checking;}finally{checking=null;}
}
function versionCheckTime(){return new Date().toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})+' (KST)';}
async function check(){
 if(versionCheckBusy)return;
 versionCheckBusy=true;update.disabled=true;update.textContent='확인 중…';panel.setAttribute('aria-busy','true');
 notice.textContent='새 배포 버전을 확인하고 있어요…';
 try{
  latestVersion=await latest();reload.hidden=latestVersion===version;
  const result=latestVersion===version?'최신 버전 확인 완료 · 최신 배포 버전을 사용 중이에요.':'새 배포 버전 '+latestVersion.slice(0,12)+'이 있어요. 입력 내용은 그대로 유지하며 자동 새로고침하지 않아요.';
  notice.textContent=result+' · 확인 시각: '+versionCheckTime();
  const link=document.getElementById('wish-shortcut');if(link)link.href=destination('soweon.html',latestVersion);
 }catch(_){notice.textContent='새 버전 확인 실패 · 현재 화면과 기록은 유지돼요. · 시도 시각: '+versionCheckTime();}
 finally{versionCheckBusy=false;update.disabled=false;update.textContent='새 버전 다시 확인';panel.setAttribute('aria-busy','false');}
}
update.onclick=()=>{void check();};
reload.onclick=async()=>{
 if(drafting()){notice.textContent='작성·수정·비교 중인 내용을 먼저 저장하거나 취소해 주세요. 자동으로 지우지 않아요.';return;}
 try{const commit=await latest();if(drafting())return;location.assign(destination(wish?'soweon.html':'index.html',commit));}
 catch(_){notice.textContent='배포 정보 확인 실패 · 현재 화면을 유지했어요.';}
};
const shortcut=document.getElementById('wish-shortcut');
if(shortcut)shortcut.addEventListener('click',async event=>{
 if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||shortcut.target==='_blank')return;
 event.preventDefault();try{location.assign(destination('soweon.html',await latest()));}
 catch(_){const u=new URL(shortcut.href,location.href);u.searchParams.set('flove_check',String(Date.now()));location.assign(u.href);}
});
void check();window.addEventListener('focus',()=>{void check();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
setInterval(()=>{if(!document.hidden)void check();},60000);
if(!wish)return;
const section=el('section');section.id='wish-conflict-tools';section.style.cssText=panel.style.cssText;
const heading=el('h3','기기 · 서버 소원 비교'),explain=el('p','다른 날짜마다 기기 기록 또는 서버 기록을 선택해요. 선택한 결과를 서버와 이 기기에 반영하며, 기존 양쪽 기록과 전송 대기는 복구본에 보관해요.');
const inspectButton=el('button','기기 · 서버 기록 비교'),cancel=el('button','비교 취소'),applyButton=el('button','선택한 기록 반영'),download=el('button','마지막 선택 복구본 저장');
for(const b of [inspectButton,cancel,applyButton,download])b.type='button';
const list=el('div'),status=el('p');status.setAttribute('role','status');status.style.whiteSpace='pre-line';
cancel.hidden=applyButton.hidden=download.hidden=true;section.append(heading,explain,inspectButton,cancel,list,applyButton,download,status);host.append(section);
let preview=null,choices={},review=false,working=false,lastBackup=null;
function finishReview(){preview=null;choices={};review=false;phase='idle';view();list.replaceChildren();cancel.hidden=applyButton.hidden=true;}
function resolver(){
 if(!window.FloveWishConnection)throw Error('동기화 연결이 준비되지 않았어요.');
 if(!navigator.locks)throw Error('이 브라우저의 안전한 동기화 잠금을 사용할 수 없어요.');
 const api=window.FloveWishSync,config=window.FLOVE_WISH_SYNC_CONFIG;
 const transport=api.createTransport({endpoint:config.endpoint,fetchImpl:fetch.bind(window),timeoutMs:config.timeoutMs||45000});
 return service(api,localStorage,transport,(name,fn)=>name==='wish-daily-save'?exclusive(fn):navigator.locks.request(name,fn),()=>{data=read();sync();view();records();});
}
function renderPreview(){
 list.replaceChildren();const api=window.FloveWishSync,l=new Map(api.parse(preview.local).map(w=>[w.date,w])),r=new Map(api.parse(preview.remote).map(w=>[w.date,w]));
 let count=0;
 if(preview.meta.pending){const details=el('details'),summary=el('summary','기존 전송 대기 내용 (이번 선택에서는 자동 적용하지 않음)'),pre=el('pre',JSON.stringify(preview.meta.pending,null,2));pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px';details.append(summary,pre);list.append(details);}
 for(const date of [...new Set([...l.keys(),...r.keys()])].sort()){
  const a=l.get(date),b=r.get(date);if(canonical(a)===canonical(b))continue;count++;
  const box=el('fieldset'),legend=el('legend',date);box.style.cssText='margin:10px 0;padding:10px;border:1px solid #94a3b855;border-radius:10px';box.append(legend);
  for(const [side,row,title] of [['local',a,'기기'],['remote',b,'서버']]){
   const label=el('label'),radio=el('input');radio.type='radio';radio.name='wish-choice-'+date;radio.value=side;radio.onchange=()=>{choices[date]=side;};
   label.style.cssText='display:block;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0';
   const text=row?title+': '+row.text+'\n완료: '+(row.done?'예':'아니오')+' · 모양: '+(row.shape||'미지정')+' · ID: '+(row.id||'없음')+'\n위치: '+(row.px??'미지정')+', '+(row.py??'미지정')+' · 색: '+(row.color||'미지정'):title+': 기록 없음 — 선택하면 이 날짜 기록을 제외해요.';
   label.append(radio,el('span',text));box.append(label);
  }
  list.append(box);
 }
 applyButton.hidden=false;cancel.hidden=false;
 status.textContent=count+'개 날짜가 달라요. 각 날짜를 선택한 뒤 반영해 주세요.'+(preview.meta.pending?'\n미확인 전송 대기도 있어요. 이번 선택은 현재 기기/서버 기록 기준이며 이전 대기 원본은 백업 후 교체해요.':'')+(count?'':'\n목록은 같아요. 반영하면 남은 전송 대기를 백업 후 정리해요.');
}
inspectButton.onclick=async()=>{
 if(working)return;if(!review&&drafting()){status.textContent='작성 중인 소원을 먼저 저장하거나 취소해 주세요.';return;}
 working=true;inspectButton.disabled=true;applyButton.disabled=true;cancel.disabled=true;
 if(!review){review=true;phase='reviewing';view();}
 status.textContent='서버 기록을 비교하고 있어요…';
 try{preview=await resolver().inspect();choices={};renderPreview();}
 catch(error){finishReview();status.textContent=error.message;}
 finally{working=false;inspectButton.disabled=applyButton.disabled=cancel.disabled=false;if(review&&!host.open)finishReview();}
};
cancel.onclick=()=>{if(working)return;finishReview();status.textContent='비교를 취소했어요. 기록은 변경하지 않았어요.';void window.FloveWishConnection?.syncOnce();};
applyButton.onclick=async()=>{
 if(working||!preview)return;
 try{window.FloveWishSync.parse(choose(window.FloveWishSync,preview.local,preview.remote,choices));}
 catch(error){status.textContent=error.message;return;}
 if(!window.confirm('선택한 날짜의 기기/서버 기록을 기준으로 서버와 이 기기를 갱신할까요? 기록 없음 선택은 해당 날짜를 제외합니다. 이전 기록과 전송 대기는 기기 복구본에 보관합니다.'))return;
 working=true;inspectButton.disabled=applyButton.disabled=cancel.disabled=true;
 try{lastBackup=await resolver().apply(preview,choices);finishReview();download.hidden=false;status.textContent='선택한 결과의 서버 저장과 기기 반영을 확인했어요. 다른 기기는 동기화를 다시 확인해 주세요.';void window.FloveWishConnection.syncOnce();}
 catch(error){status.textContent=error.message+'\n이전에 서버로 전송됐다면 대기 기록이 남아 있을 수 있어요. 다시 비교해 주세요.';}
 finally{working=false;inspectButton.disabled=applyButton.disabled=cancel.disabled=false;if(review&&!host.open)finishReview();}
};
download.onclick=()=>{try{const raw=localStorage.getItem(lastBackup);if(!raw)throw Error();const u=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=el('a');a.href=u;a.download='소원_충돌선택_복구본.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}catch(_){status.textContent='복구본을 읽지 못했어요.';}};
host.addEventListener('cancel',event=>{if(working){event.preventDefault();return;}if(review)finishReview();});
host.addEventListener('close',()=>{if(review&&!working)finishReview();});
})(typeof globalThis==='object'?globalThis:this);

/* Keep sync, conflict review and version details in one adaptive card. */
(function(){
'use strict';
if(typeof document==='undefined')return;
const dialog=document.getElementById('dataDialog');if(!dialog)return;
const card=document.getElementById('wish-sync-status'),compare=document.getElementById('wish-conflict-tools'),versions=document.getElementById('flove-version-tools');
if(!card||!compare||!versions)return;
const label=card.querySelector('p'),retry=card.querySelector('button');
const [inspect,cancel,apply,download]=compare.querySelectorAll('button');
const feedback=compare.lastElementChild;
if(!label||!retry||!inspect||!cancel||!apply||!download||feedback.tagName!=='P')return;
const title=document.createElement('h3');title.textContent='소원 동기화';title.style.cssText='margin:0 0 8px;font-size:14px;font-weight:500';card.prepend(title);
const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='버전 · 복구 상세';summary.style.cursor='pointer';
details.style.cssText='margin-top:10px;font-size:11px;opacity:.85';details.append(summary,versions,download);
versions.style.cssText='padding:6px 0;font-size:11px';
compare.style.cssText='padding:0;margin:0';inspect.hidden=true;
feedback.style.cssText='white-space:pre-line;font-size:12px;margin:8px 0';
card.append(compare,feedback,details);
let checking=false,queued=false;
function displayMode(){
 const reviewing=phase==='reviewing';card.dataset.mode=reviewing?'compare':'status';
 label.hidden=reviewing;retry.hidden=reviewing;compare.hidden=!reviewing;
 details.hidden=reviewing;summary.textContent=versions.textContent.includes('새 배포 버전 ')?'새 버전 있음 · 상세':'버전 · 복구 상세';card.setAttribute('aria-busy',String(checking||reviewing&&apply.disabled));
}
const originalInspect=inspect.onclick;
inspect.onclick=async function(event){try{return await originalInspect.call(this,event);}finally{displayMode();}};
const originalCancel=cancel.onclick;
cancel.onclick=function(event){const result=originalCancel.call(this,event);displayMode();return result;};
const originalApply=apply.onclick;
apply.onclick=async function(event){try{return await originalApply.call(this,event);}finally{displayMode();}};
function offerComparison(state){
 if(queued||checking||!dialog.open||phase==='reviewing'||!['conflict','uncertain','remote-missing'].includes(state?.status))return;
 queued=true;queueMicrotask(()=>{queued=false;if(dialog.open&&phase!=='reviewing')void inspect.onclick();});
}
retry.onclick=async()=>{
 if(checking||phase==='reviewing')return;
 checking=true;retry.disabled=true;feedback.textContent='';label.textContent='서버 기록을 다시 확인하고 있어요…';displayMode();
 let state;
 try{if(!window.FloveWishConnection)throw Error('동기화 연결이 준비되지 않았어요.');state=await window.FloveWishConnection.syncOnce();}
 catch(error){label.textContent='동기화 확인 실패 · '+error.message;}
 finally{checking=false;retry.disabled=false;displayMode();}
 offerComparison(state);
};
window.addEventListener('flove-wish-sync-state',event=>{if(phase!=='reviewing')offerComparison(event.detail);});
document.getElementById('openData')?.addEventListener('click',()=>{displayMode();offerComparison(window.FloveWishConnection?.getState());});
const observer=new MutationObserver(displayMode);
observer.observe(compare,{childList:true,subtree:true,characterData:true});
observer.observe(feedback,{childList:true,subtree:true,characterData:true});
observer.observe(versions,{childList:true,subtree:true,characterData:true});
dialog.addEventListener('close',displayMode);
const music=document.getElementById('music');
if(music?.parentElement&&!document.getElementById('wish-corner-home')){
 const home=document.createElement('button');home.id='wish-corner-home';home.type='button';home.title='허브로 돌아가기';home.setAttribute('aria-label','허브로 돌아가기');
 home.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-width:36px;color:#d8cdeb;border-color:#c6b6ec40;background:linear-gradient(135deg,#b39bdb18,#7997ce0d)';
 home.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9"/></svg>';
 home.onclick=()=>{
  if(checking||(phase!=='idle'&&phase!=='reviewing')||(phase==='reviewing'&&(inspect.disabled||apply.disabled))){toast('저장이나 서버 확인이 끝난 뒤 이동해 주세요.');return;}
  const draft=editing||!!$('wish').value.trim()||pending!==null||(!$('pastForm')?.hidden&&!!$('pastWish')?.value.trim())||phase==='reviewing';
  if(draft&&!window.confirm('저장하지 않은 입력이나 비교 선택은 사라질 수 있어요. 허브로 이동할까요? 저장된 소원은 유지돼요.'))return;
  const url=new URL('index.html',location.href),build=document.querySelector('meta[name="flove-build"]')?.content;
  if(build)url.searchParams.set('flove_build',build);location.assign(url.href);
 };
 music.insertAdjacentElement('afterend',home);
}
displayMode();offerComparison(window.FloveWishConnection?.getState());
})();
