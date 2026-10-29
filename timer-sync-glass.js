/* Timer-only informational presentation; no cloud or timer operations. */
(() => {
'use strict';
const cfg=window.FLOVE_SYNC_CONFIG||{};
const eligible=()=>cfg.page==='timer'&&Array.isArray(cfg.keys)&&cfg.keys.length===0&&!cfg.plan&&!cfg.readOnly;
if(!eligible())return;
const expected='타이머: 클라우드 저장 대상 없음';
const css=`#flove-sync-v2-panel.tn-root{position:relative;z-index:10000;display:grid;grid-template-columns:28px minmax(0,1fr) 30px;align-items:center;gap:8px;width:100%;max-width:520px;min-height:44px;flex-shrink:0;margin:0 auto 12px;padding:6px 10px;border:1px solid rgba(255,255,255,.95);outline:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(255,255,255,.68);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);box-shadow:0 4px 16px rgba(15,23,42,.045);color:#64748b;font-family:inherit}#flove-sync-v2-panel.tn-root *{box-sizing:border-box}#flove-sync-v2-panel.tn-root [hidden]{display:none!important}#flove-sync-v2-panel.tn-root .tn-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(148,163,184,.1)}#flove-sync-v2-panel.tn-root svg{width:16px;height:16px}#flove-sync-v2-panel.tn-root .tn-title{margin:0;font-size:11.5px;font-weight:650;line-height:1.5;overflow-wrap:anywhere}#flove-sync-v2-panel.tn-root summary{display:grid;place-items:center;min-width:30px;min-height:30px;padding:6px;border:1px solid rgba(255,255,255,.8);border-radius:9px;background:rgba(255,255,255,.4);cursor:pointer;list-style:none}#flove-sync-v2-panel.tn-root summary::-webkit-details-marker{display:none}#flove-sync-v2-panel.tn-root summary:focus-visible{outline:2px solid #64748b;outline-offset:3px}#flove-sync-v2-panel.tn-root .tn-pop{position:absolute;right:0;top:calc(100% + 7px);width:min(280px,100%);padding:14px;border:1px solid #fff;border-radius:14px;background:rgba(248,250,252,.97);color:#475569;box-shadow:0 12px 28px rgba(15,23,42,.1);font-size:11px;line-height:1.8}@media(max-width:600px){#flove-sync-v2-panel.tn-root{gap:6px;padding:6px 8px;border-radius:12px}#flove-sync-v2-panel.tn-root .tn-title{font-size:11px}}@media print{#flove-sync-v2-panel.tn-root{display:none!important}}`;
const svg=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+p+'</svg>';
function mount(){
 const box=document.getElementById('flove-sync-v2-panel');if(!box)return false;
 if(box.dataset.timerNoticeMounted)return true;
 const raw=box.firstElementChild;if(!raw||raw.textContent!==expected||!eligible())return false;
 const old=[...box.childNodes],style=box.getAttribute('style'),hidden=raw.hidden;
 const icon=document.createElement('span');icon.className='tn-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=svg('<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>');
 const title=document.createElement('p');title.className='tn-title';title.textContent='타이머 · 클라우드 동기화 대상 없음';
 const info=document.createElement('details');info.className='tn-info';info.innerHTML='<summary aria-label="타이머 동기화 대상 안내" title="동기화 대상 안내"></summary><p class="tn-pop">이 화면은 기기 간 타이머 상태를 공유하지 않습니다. 이 안내는 타이머 기록의 저장이나 동기화 완료를 뜻하지 않습니다.</p>';
 const summary=info.querySelector('summary');summary.innerHTML=svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>');
 let watcher,restored=false;
 const outside=e=>{if(info.open&&!info.contains(e.target))info.open=false;};
 function restore(){if(restored)return;restored=true;if(watcher)watcher.disconnect();document.removeEventListener('click',outside);box.replaceChildren(...old);raw.hidden=hidden;box.classList.remove('tn-root');if(style===null)box.removeAttribute('style');else box.setAttribute('style',style);delete box.dataset.timerNoticeMounted;}
 try{
  if(!document.getElementById('flove-timer-notice-style')){const s=document.createElement('style');s.id='flove-timer-notice-style';s.textContent=css;document.head.append(s);}
  box.replaceChildren(raw,icon,title,info);raw.hidden=true;box.style.cssText='';box.classList.add('tn-root');box.dataset.timerNoticeMounted='true';
  summary.addEventListener('keydown',e=>{if([' ','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',',','.','Escape'].includes(e.key)||e.code==='Space')e.stopPropagation();if(e.key==='Escape'){info.open=false;summary.focus();}});
  document.addEventListener('click',outside);
  watcher=new MutationObserver(()=>{if(!eligible()||raw.textContent!==expected)restore();});watcher.observe(raw,{childList:true,subtree:true,characterData:true});return true;
 }catch(e){restore();console.warn('[Flove Timer UI] Original panel retained',e);return false;}
}
if(!mount()){const wait=new MutationObserver(()=>{if(mount())wait.disconnect();});wait.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>wait.disconnect(),10000);}
})();

/* Timer initial viewport alignment only; no timer or storage changes. */
(() => {
'use strict';
if((window.FLOVE_SYNC_CONFIG||{}).page!=='timer'||window.__floveTimerInitialCenterV1)return;
const state=window.__floveTimerInitialCenterV1={status:'waiting'};
const events=new AbortController();let raf=0,done=false;
const finish=s=>{if(done)return;done=true;state.status=s;cancelAnimationFrame(raf);events.abort();};
const cancel=()=>finish('cancelled');
for(const name of ['wheel','touchstart','touchmove','pointerdown','keydown','input'])document.addEventListener(name,cancel,{capture:true,passive:true,signal:events.signal});
window.addEventListener('scroll',cancel,{passive:true,signal:events.signal});
function start(){
 if(done)return;
 const nav=performance.getEntriesByType('navigation')[0];
 if((nav&&nav.type==='back_forward')||window.scrollY>1){finish('position-preserved');return;}
 let loadReady=document.readyState==='complete',fontsReady=!document.fonts||document.fonts.status==='loaded';
 window.addEventListener('load',()=>{loadReady=true;},{once:true,signal:events.signal});
 if(document.fonts)document.fonts.ready.then(()=>{fontsReady=true;},()=>{fontsReady=true;});
 let begun=0,stableAt=0,last='';
 function tick(now){
  if(done)return;
  const target=document.getElementById('clockWrapper');
  if(!target){finish('target-missing');return;}
  const r=target.getBoundingClientRect();let visible=!document.hidden&&r.width>0&&r.height>0&&window.innerHeight>0;
  try{const f=window.frameElement;if(f){const b=f.getBoundingClientRect();visible=visible&&b.width>0&&b.height>0;}}catch(_){}
  if(!visible){begun=0;stableAt=0;last='';raf=requestAnimationFrame(tick);return;}
  if(!begun)begun=now;
  const key=[Math.round(r.top+window.scrollY),Math.round(r.height),Math.round(window.innerHeight),document.documentElement.scrollHeight].join(':');
  if(key!==last){last=key;stableAt=now;}
  const settled=now-stableAt>=200;
  if(!settled&&now-begun>=3000){finish('layout-unstable');return;}
  if(!settled||(!(loadReady&&fontsReady)&&now-begun<1800)){raf=requestAnimationFrame(tick);return;}
  const badge=document.getElementById('statusBadge');
  if(badge&&badge.textContent.trim()!=='준비됨'){finish('timer-use-preserved');return;}
  const active=document.activeElement;
  if(active&&active.closest('input,textarea,select,button,[contenteditable="true"]')){finish('focus-preserved');return;}
  const root=document.scrollingElement||document.documentElement;
  const max=Math.max(0,root.scrollHeight-root.clientHeight);
  const top=Math.max(0,Math.min(max,window.scrollY+r.top+r.height/2-window.innerHeight/2));
  finish('completed');
  if(Math.abs(top-window.scrollY)>1)window.scrollTo({top,left:window.scrollX,behavior:'instant'});
 }
 raf=requestAnimationFrame(tick);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true,signal:events.signal});else start();
})();

/* Keyboard-only timer entry; existing timer functions remain authoritative. */
(() => {
'use strict';
if((window.FLOVE_SYNC_CONFIG||{}).page!=='timer'||window.__floveTimerKeyboardV1)return;
window.__floveTimerKeyboardV1=true;
function mountKeyboard(){
 const clock=document.getElementById('clockWrapper'),minInput=document.getElementById('inputMin'),secInput=document.getElementById('inputSec');
 if(!clock||!minInput||!secInput||typeof window.setDuration!=='function')return;
 const notice=document.createElement('div');notice.id='timer-keyboard-entry';notice.hidden=true;
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 notice.style.cssText='position:fixed;z-index:10003;bottom:20px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 32px);padding:12px 18px;border:1px solid var(--primary);border-radius:14px;background:var(--card-bg,#fff);color:var(--text-main,#334155);box-shadow:0 8px 30px #0002;text-align:center;font-size:14px;line-height:1.7;pointer-events:none;white-space:pre-line';
 document.body.appendChild(notice);
 const hint=document.querySelector('.shortcut-hint');
 if(hint){const extra=document.createElement('span');extra.textContent='M: 중앙 정렬 / -: 시간 입력 / .: 초 입력 / Enter: 확정 / Esc: 취소';hint.appendChild(extra);}
 let draft=null;
 const editable=el=>el&&(el.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(el.tagName));
 const protectedUI=el=>el&&el.closest&&el.closest('#flove-sync-v2-panel,#flove-recovery-footer,dialog,[role="dialog"]');
 function center(){
  const r=clock.getBoundingClientRect();if(!r.width||!r.height)return;
  const root=document.scrollingElement||document.documentElement;
  const top=Math.max(0,Math.min(Math.max(0,root.scrollHeight-root.clientHeight),window.scrollY+r.top+r.height/2-window.innerHeight/2));
  window.scrollTo({top,left:window.scrollX,behavior:'instant'});
 }
 function render(error=''){
  notice.hidden=false;
  notice.textContent=`시간 설정 · ${draft.part==='min'?'분':'초'} 입력: ${draft.min||'_'}분 ${draft.sec?draft.sec.padStart(2,'0'):'__'}초\n${error||'. 초 입력 · Enter 확정 · Backspace 수정 · Esc 취소'}`;
 }
 function cancel(){draft=null;notice.hidden=true;}
 function begin(){
  const active=document.activeElement;if(active&&active.tagName==='BUTTON')active.blur();
  draft={part:'min',min:'',sec:''};render();
 }
 function commit(){
  const minutes=Number(draft.min||0),seconds=Number(draft.sec||0);
  if(minutes>180||seconds>59){render('분은 0~180, 초는 0~59로 입력해 주세요.');return;}
  if(minutes*60+seconds<=0){render('0초보다 긴 시간을 입력해 주세요.');return;}
  minInput.value=String(minutes);secInput.value=String(seconds);
  window.setDuration(minutes*60+seconds,'시간 설정됨');cancel();
 }
 window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const active=document.activeElement;
  if(editable(active)||protectedUI(active)){if(draft)cancel();return;}
  if(e.isComposing){if(draft){e.preventDefault();e.stopImmediatePropagation();}return;}
  const isM=e.code==='KeyM'||e.key.toLowerCase()==='m';
  const isMinus=e.key==='-'||(!e.shiftKey&&e.code==='Minus')||e.code==='NumpadSubtract';
  if(!draft){
   if(!isM&&!isMinus)return;
   e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
   if(isM)center();else begin();return;
  }
  if(e.key==='Tab'){cancel();return;}
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  if(e.key==='Escape'){cancel();return;}
  if(isM){center();return;}
  if(isMinus){begin();return;}
  if(e.key==='Backspace'){
   if(draft.part==='sec'&&!draft.sec)draft.part='min';
   else draft[draft.part]=draft[draft.part].slice(0,-1);
   render();return;
  }
  if(e.key==='.'||(!e.shiftKey&&e.code==='Period')||e.code==='NumpadDecimal'){draft.part='sec';render();return;}
  if(e.key==='Enter'){commit();return;}
  const numpadDigit=/^Numpad([0-9])$/.exec(e.code||'');
  const digit=numpadDigit?numpadDigit[1]:(/^[0-9]$/.test(e.key)?e.key:null);
  if(digit!==null){
   const part=draft.part,next=draft[part]+digit,limit=part==='min'?180:59,maxLength=part==='min'?3:2;
   if(next.length>maxLength||Number(next)>limit){render(part==='min'?'분은 0~180까지 입력할 수 있어요.':'초는 0~59까지 입력할 수 있어요.');return;}
   draft[part]=next;render();if(part==='sec'&&next.length===2)commit();
  }
 },true);
 document.addEventListener('pointerdown',()=>{if(draft)cancel();},true);
 document.addEventListener('focusin',e=>{if(draft&&(editable(e.target)||protectedUI(e.target)))cancel();});
 window.addEventListener('blur',()=>{if(draft)cancel();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&draft)cancel();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountKeyboard,{once:true});else mountKeyboard();
})();
