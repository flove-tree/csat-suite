/* Loaded by tools/build_site.py after the wish app, core and bridge. */
(() => {
'use strict';
const config=window.FLOVE_WISH_SYNC_CONFIG;
if(!config||config.enabled!==true||window.FloveWishConnection)return;
const dialog=$('dataDialog'),box=document.createElement('section');
box.id='wish-sync-status';box.setAttribute('aria-label','소원 동기화');
box.style.cssText='margin:14px 0;padding:12px;border:1px solid #ffffff25;border-radius:12px;font-size:12px';
const label=document.createElement('p'),retry=document.createElement('button');
label.setAttribute('role','status');label.setAttribute('aria-live','polite');
label.style.cssText='margin:0 0 6px;font-size:12px;white-space:pre-line';
retry.type='button';retry.textContent='동기화 다시 확인';retry.disabled=true;
box.append(label,retry);dialog.append(box);
let connection,timer=null,closed=false,dirty=false,lastSynced='';
function paint(text){label.textContent=text+(lastSynced?'\n마지막 서버 확인: '+lastSynced:'');}
function busy(){
 return phase!=='idle'||editing||!!flight||pending!==null||
  !!$('wish').value.trim()||
  (typeof pastBusy!=='undefined'&&pastBusy)||
  (!!$('pastForm')&&!$('pastForm').hidden&&!!$('pastWish')?.value.trim());
}
function schedule(delay=0){
 if(closed)return;clearTimeout(timer);timer=setTimeout(attempt,delay);
}
async function attempt(){
 timer=null;if(closed||!connection)return;
 if(navigator.onLine===false){paint('오프라인 · 기기 기록 유지, 연결되면 다시 시도해요.');return;}
 if(document.hidden)return;
 if(busy()){paint('입력·저장·별 연출이 끝나면 동기화를 다시 확인해요.');schedule(700);return;}
 await connection.syncOnce();
}
function stateChanged(state){
 if(closed)return;
 const messages={
  deferred:'입력·저장·별 연출이 끝나면 동기화를 다시 확인해요.',
  stale:'확인 중 기록이 바뀌었어요. 최신 기록으로 다시 확인해요.',
  retry:'서버 기록이 바뀌었어요. 다시 확인해요.',
  'local-pending':'기기의 새 기록을 서버에 반영할 차례예요.',
  uncertain:'전송 결과와 서버 기록이 달라요. 원본을 유지하고 자동 덮어쓰기를 멈췄어요.',
  'remote-missing':'기존 서버 기록을 찾지 못했어요. 기기 기록은 유지했어요.',
  stopped:'동기화가 중지됐어요. 기기 기록은 유지돼요.'
 };
 if(state.status==='synced'){
  dirty=false;lastSynced=new Date().toLocaleTimeString('ko-KR');
  paint('서버와 소원 기록이 일치해요.');
 }else if(state.status==='conflict'){
  paint('같은 날짜의 기록이 서로 달라 자동 반영을 보류했어요.\n확인할 날짜: '+(state.dates||[]).join(', ')+'\n각 기기에서 백업 저장 후 내용을 비교해 주세요.');
 }else if(state.status==='error'){
  paint('동기화 실패 · 기기 기록은 유지했어요.\n'+(state.message||'서버 연결을 확인해 주세요.'));
 }else paint(messages[state.status]||'서버 기록을 확인하고 있어요.');
 if(['deferred','stale','retry','local-pending'].includes(state.status))schedule(700);
 window.dispatchEvent(new CustomEvent('flove-wish-sync-state',{detail:state}));
}
paint('소원 동기화 연결 중…');
try{
 connection=window.FloveWishBridge.connect({
  exclusive:fn=>exclusive(fn),isBusy:busy,
  refresh:()=>{data=read();sync();view();if(dialog.open)records();},
  onState:stateChanged
 },{...config,intervalMs:config.intervalMs||5000});
 const originalCommit=commit,originalFinish=finish;
 const wrappedCommit=async function(change){
  const ok=await originalCommit(change);
  if(ok){dirty=true;paint('기기에 저장했어요. 서버 반영 확인 중…');schedule(0);}
  return ok;
 };
 const wrappedFinish=function(){const result=originalFinish();schedule(0);return result;};
 commit=wrappedCommit;finish=wrappedFinish;
 const wake=()=>{if(!document.hidden)schedule(0);};
 const offline=()=>paint('오프라인 · 기기 기록 유지, 연결되면 다시 시도해요.');
 const storageChanged=e=>{if(e.key===KEY||e.key===null)schedule(0);};
 const inputFinished=()=>{if(dirty)schedule(0);};
 window.addEventListener('online',wake);window.addEventListener('offline',offline);
 window.addEventListener('focus',wake);window.addEventListener('pageshow',wake);
 window.addEventListener('storage',storageChanged);
 document.addEventListener('visibilitychange',wake);
 dialog.addEventListener('close',inputFinished);
 document.addEventListener('focusout',inputFinished);
 document.addEventListener('change',inputFinished);
 retry.disabled=false;retry.onclick=()=>{paint('서버 기록을 다시 확인하고 있어요…');schedule(0);};
 window.FloveWishConnection=Object.freeze({
  syncOnce:()=>connection.syncOnce(),getState:()=>connection.getState(),
  stop:()=>{
   if(closed)return;closed=true;clearTimeout(timer);connection.stop();
   if(commit===wrappedCommit)commit=originalCommit;if(finish===wrappedFinish)finish=originalFinish;
   window.removeEventListener('online',wake);window.removeEventListener('offline',offline);
   window.removeEventListener('focus',wake);window.removeEventListener('pageshow',wake);
   window.removeEventListener('storage',storageChanged);
   document.removeEventListener('visibilitychange',wake);dialog.removeEventListener('close',inputFinished);
   document.removeEventListener('focusout',inputFinished);document.removeEventListener('change',inputFinished);
   retry.disabled=true;label.textContent='동기화가 중지됐어요. 기기 기록은 유지돼요.';
  }
 });
 schedule(0);
}catch(error){
 retry.disabled=true;
 paint('동기화를 시작하지 못했어요. 기기 기록은 유지돼요.\n'+error.message);
 console.error('[Wish sync unavailable]',error);
}
})();

/* New manual wishes only. Existing/imported coordinates are never migrated. */
(() => {
'use strict';
function choosePosition(identity,rows){
 let seed=2166136261;
 for(const c of identity){seed^=c.codePointAt(0);seed=Math.imul(seed,16777619)>>>0;}
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const occupied=rows.filter(w=>Number.isFinite(w.px)&&Number.isFinite(w.py));
 let best={px:.12,py:.2},bestScore=-Infinity;
 for(let i=0;i<160;i++){
  const px=.06+.88*random(),py=.17+.66*random();
  if(px>.24&&px<.76&&py>.24&&py<.78)continue;
  let distance=1000;
  for(const w of occupied)distance=Math.min(distance,Math.hypot((px-w.px)*400,(py-w.py)*800));
  const score=Math.min(distance,90)*(.85+.3*random());
  if(score>bestScore){bestScore=score;best={px,py};}
 }
 return best;
}
if(typeof module==='object'&&module.exports){module.exports={choosePosition};return;}
if(window.FloveWishPlacement)return;
const originalNorm=norm,originalCommit=commit;
let context=null;
const identity=w=>String(w.id)+'|'+w.date;
norm=function(w,i=0){
 if(context&&!context.known.has(identity(w))&&(!Number.isFinite(w.px)||!Number.isFinite(w.py))){
  Object.assign(w,choosePosition(identity(w),context.rows));
 }
 return originalNorm(w,i);
};
commit=function(change){
 const manual=phase==='saving'&&!editing&&((typeof pastBusy!=='undefined'&&pastBusy)||!!$('wish').value.trim());
 if(!manual)return originalCommit(change);
 return originalCommit(a=>{
  const previous=context;context={rows:a,known:new Set(a.map(identity))};
  try{return change(a);}finally{context=previous;}
 });
};
window.FloveWishPlacement=Object.freeze({version:1});
})();
