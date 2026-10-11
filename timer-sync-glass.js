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
