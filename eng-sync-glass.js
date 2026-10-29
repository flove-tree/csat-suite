/* English-only presentation. Existing sync engine owns all record operations. */
(() => {
'use strict';
const cfg=window.FLOVE_SYNC_CONFIG||{};if(cfg.page!=='eng'||cfg.readOnly)return;
const css="#flove-sync-v2-panel.es-root{position:relative;z-index:10000;width:calc(100% - 24px);max-width:1280px;margin:8px auto;padding:0;border:0;border-radius:0;background:transparent;color:#334155;font:inherit}#flove-sync-v2-panel.es-root *{box-sizing:border-box}#flove-sync-v2-panel.es-root [hidden]{display:none!important}#flove-sync-v2-panel .es-bar{--a:#059669;display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:44px;padding:6px 10px;border:1px solid rgba(255,255,255,.95);outline:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(255,255,255,.68);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);box-shadow:0 4px 16px rgba(15,23,42,.045),inset 0 1px 0 rgba(255,255,255,.8)}#flove-sync-v2-panel .es-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:rgba(16,185,129,.08);color:var(--a)}#flove-sync-v2-panel .es-icon svg{width:17px;height:17px}#flove-sync-v2-panel .es-copy{display:flex;align-items:center;flex-wrap:wrap;gap:3px 8px;min-width:0}#flove-sync-v2-panel .es-title{margin:0;font-size:11.5px;font-weight:700;line-height:1.6;overflow-wrap:anywhere}#flove-sync-v2-panel .es-time{font-size:10px;color:#64748b;white-space:nowrap}#flove-sync-v2-panel .es-actions{display:flex;gap:4px;align-items:center}#flove-sync-v2-panel .es-retry,#flove-sync-v2-panel .es-info summary{display:grid;place-items:center;min-width:30px;min-height:30px;margin:0;padding:6px;border:1px solid rgba(255,255,255,.8);border-radius:9px;background:rgba(255,255,255,.4);color:#64748b;cursor:pointer;list-style:none}#flove-sync-v2-panel .es-retry svg,#flove-sync-v2-panel .es-info summary svg{width:14px;height:14px}#flove-sync-v2-panel .es-info summary::-webkit-details-marker{display:none}#flove-sync-v2-panel .es-retry:disabled{opacity:.45;cursor:wait}#flove-sync-v2-panel .es-inspect{min-height:28px;padding:4px 8px;border:1px solid #fde68a;border-radius:8px;background:rgba(251,191,36,.1);color:#92400e;font-size:10.5px;font-weight:650;cursor:pointer;white-space:nowrap}#flove-sync-v2-panel .es-pop{position:absolute;right:0;top:calc(100% + 7px);width:min(310px,100%);padding:14px;border:1px solid #fff;border-radius:14px;background:rgba(248,250,252,.97);backdrop-filter:blur(20px);box-shadow:0 12px 28px rgba(15,23,42,.1);font-size:11px;line-height:1.8}#flove-sync-v2-panel .es-pop p{margin:0 0 8px;overflow-wrap:anywhere}#flove-sync-v2-panel .es-backup,#flove-sync-v2-panel .es-choice{min-height:32px;margin:0;padding:8px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;color:#475569;font-size:11px;cursor:pointer}#flove-sync-v2-panel .es-panel{margin-top:7px;padding:14px;border:1px solid #fde68a;border-radius:12px;background:rgba(255,251,235,.94);color:#78350f;font-size:11px;line-height:1.8}#flove-sync-v2-panel .es-panel h2{margin:0 0 5px;font-size:12px}#flove-sync-v2-panel .es-warning{margin:0 0 10px}#flove-sync-v2-panel .es-choices{display:flex;flex-wrap:wrap;gap:7px}#flove-sync-v2-panel .es-choice{border-color:#fcd34d;color:#78350f}#flove-sync-v2-panel .es-raw{display:none!important}#flove-sync-v2-panel:is([data-eng-state='conflict'],[data-eng-state='waiting']) .es-bar{--a:#b45309;background:rgba(255,253,247,.72)}#flove-sync-v2-panel[data-eng-state='error'] .es-bar{--a:#e11d48}#flove-sync-v2-panel:is([data-eng-state='checking'],[data-eng-state='saving']) .es-bar{--a:#2563eb}#flove-sync-v2-panel :is(button,summary):focus-visible{outline:2px solid #6366f1;outline-offset:3px}@media(max-width:600px){#flove-sync-v2-panel.es-root{width:calc(100% - 16px);margin:7px auto}#flove-sync-v2-panel .es-bar{grid-template-columns:25px minmax(0,1fr) auto;gap:6px;padding:6px 8px;border-radius:12px}#flove-sync-v2-panel .es-icon{width:25px;height:25px}#flove-sync-v2-panel .es-title{font-size:11px}#flove-sync-v2-panel .es-time{display:none}#flove-sync-v2-panel .es-actions{gap:2px}#flove-sync-v2-panel .es-retry,#flove-sync-v2-panel .es-info summary{min-width:28px;min-height:28px}}@media print{#flove-sync-v2-panel.es-root{display:none!important}}\n";
const svg=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+p+'</svg>';
const cloud=svg('<path d="M7 18h10a4.5 4.5 0 0 0 1-8.9 6 6 0 0 0-11.4-1A5 5 0 0 0 7 18Z"/><path d="m9 13 2 2 4-4"/>');
const refresh=svg('<path d="M20 7v5h-5M4 17v-5h5M5.8 7a7 7 0 0 1 11.7-1.5L20 8M4 16l2.5 2.5A7 7 0 0 0 18.2 17"/>');
const info=svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>');
function mount(){
 const box=document.getElementById('flove-sync-v2-panel');if(!box)return false;if(box.dataset.engGlassMounted)return true;
 const raw=box.firstElementChild,backup=[...box.children].find(x=>x.tagName==='BUTTON'&&x.textContent==='양쪽 원본 내려받기'),conflict=[...box.children].find(x=>x.tagName==='DIV'&&x.querySelector('pre'));
 if(!raw||!backup||!conflict||!window.FloveSync||typeof window.FloveSync.retry!=='function')return false;
 const keys=conflict.querySelector('pre'),choices=[...conflict.querySelectorAll('button')];if(choices.length!==2)return false;
 const old=[...box.childNodes],styles=new Map([box,backup,...choices].map(x=>[x,x.getAttribute('style')]));
 const bar=document.createElement('div');bar.className='es-bar';bar.innerHTML='<span class="es-icon" aria-hidden="true"></span><div class="es-copy"><p class="es-title" role="status" aria-live="polite" aria-atomic="true"></p><time class="es-time"></time><button type="button" class="es-inspect" hidden aria-expanded="false" aria-controls="flove-eng-sync-conflicts">기록 확인</button></div><div class="es-actions"><button type="button" class="es-retry" aria-label="영어 동기화 다시 확인" title="다시 확인"></button><details class="es-info"><summary aria-label="영어 동기화 상세 정보" title="상세 정보"></summary><div class="es-pop"><p class="es-explain"></p><p>영어 시험 기록 묶음의 기존 동기화 상태를 표시합니다.</p></div></details></div>';
 const panel=document.createElement('section');panel.id='flove-eng-sync-conflicts';panel.className='es-panel';panel.hidden=true;panel.innerHTML='<h2>영어 시험 기록 · 차이 확인</h2><p class="es-warning">아래 선택은 영어 시험 기록 묶음 전체를 교체합니다. 자동 병합이 아닙니다. 먼저 양쪽 원본을 보관하고 내용을 확인해 주세요.</p>';
 const q=s=>bar.querySelector(s),title=q('.es-title'),time=q('.es-time'),retry=q('.es-retry'),inspect=q('.es-inspect'),details=q('details'),summary=q('summary'),explain=q('.es-explain');let pending=false,expanded=false,lastTime='',observer;
 function paint(){
  const text=raw.textContent||'',active=/^충돌\s+\d+개/.test(text)&&!conflict.hidden;
  const state=pending?'checking':active?'conflict':/^서버 저장 중/.test(text)?'saving':/^동기화 확인|^서버 저장 성공/.test(text)?'synced':/변경 대기/.test(text)?'waiting':/실패|오류|중단/.test(text)?'error':/연결 확인/.test(text)?'checking':'notice';
  box.dataset.engState=state;box.setAttribute('aria-busy',String(pending||state==='saving'));retry.disabled=pending;
  title.textContent=state==='conflict'?'영어 기록 차이 · 확인 필요':state==='synced'?'영어 동기화 완료':state==='saving'?'영어 기록 저장 중…':state==='waiting'?'영어 기록 반영 대기':state==='checking'?'영어 동기화 확인 중…':text;
  if(state==='synced'){const m=text.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);if(m){let h=Number(m[1]);if(/오후/.test(text)&&h<12)h+=12;if(/오전/.test(text)&&h===12)h=0;lastTime=String(h).padStart(2,'0')+':'+m[2];}}
  time.textContent=lastTime?(state==='error'?'이전 확인 ':'')+lastTime+(state==='synced'?' 확인':''):'';time.hidden=!lastTime||state==='checking';inspect.hidden=state!=='conflict';if(conflict.hidden)expanded=false;panel.hidden=state!=='conflict'||!expanded;inspect.setAttribute('aria-expanded',String(!panel.hidden));explain.textContent=pending?'기존 동기화 함수로 서버 기록을 다시 확인하고 있습니다.':text;
 }
 try{
  if(!document.getElementById('flove-eng-sync-glass-style')){const style=document.createElement('style');style.id='flove-eng-sync-glass-style';style.textContent=css;document.head.append(style);}
  box.replaceChildren(raw,bar,panel);box.style.cssText='';box.classList.add('es-root');raw.classList.add('es-raw');keys.classList.add('es-raw');backup.style.cssText='';backup.classList.add('es-backup');q('.es-pop').append(backup);panel.append(conflict);conflict.classList.add('es-choices');for(const x of choices){x.style.cssText='';x.classList.add('es-choice');}
  q('.es-icon').innerHTML=cloud;retry.innerHTML=refresh;summary.innerHTML=info;inspect.addEventListener('click',()=>{expanded=!expanded;paint();});
  retry.addEventListener('click',async()=>{if(pending)return;pending=true;paint();try{await window.FloveSync.retry();}catch(e){console.warn('[Flove English UI] Retry failed',e);}finally{pending=false;paint();}});
  box.addEventListener('keydown',e=>{if(e.key==='Escape'){if(details.open){details.open=false;summary.focus();}else if(expanded){expanded=false;paint();inspect.focus();}}});document.addEventListener('click',e=>{if(details.open&&!details.contains(e.target))details.open=false;});
  observer=new MutationObserver(paint);observer.observe(raw,{childList:true,subtree:true,characterData:true});observer.observe(conflict,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true});box.dataset.engGlassMounted='true';paint();return true;
 }catch(e){
  if(observer)observer.disconnect();box.replaceChildren(...old);for(const[x,c]of[[box,'es-root'],[raw,'es-raw'],[keys,'es-raw'],[backup,'es-backup'],[conflict,'es-choices'],...choices.map(x=>[x,'es-choice'])])x.classList.remove(c);for(const[x,s]of styles){if(s===null)x.removeAttribute('style');else x.setAttribute('style',s);}delete box.dataset.engGlassMounted;delete box.dataset.engState;box.removeAttribute('aria-busy');console.warn('[Flove English UI] Original panel retained',e);return false;
 }
}
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);}
})();

/* Reuse the original vocabulary form without duplicating IDs or save logic. */
(() => {
  'use strict';
  const cfg = window.FLOVE_SYNC_CONFIG || {};
  if (cfg.page !== 'eng' || cfg.readOnly) return;

  function mountVocabQuickAdd() {
    const recordTab = document.getElementById('tab-record');
    const vocabTab = document.getElementById('tab-vocab');
    const list = document.getElementById('vocab-input-list');
    if (!recordTab || !vocabTab || !list) return false;
    if (vocabTab.dataset.quickAddMounted === 'true') return true;
    const panel = Array.from(recordTab.children).find(node => node.contains(list));
    if (!panel) return false;
    const heading = panel.querySelector('h2');
    const headingText = heading && Array.from(heading.childNodes).find(node => node.nodeType === 3 && node.textContent.trim());
    const originalTitle = headingText ? headingText.textContent : '';
    const header = panel.firstElementChild;
    const originalHeaderClass = header ? header.className : '';
    const home = document.createComment('Original shared vocabulary input position');
    panel.before(home);
    const hint = document.createElement('p');
    hint.className = 'text-xs text-slate-500 mb-4 leading-relaxed';
    hint.textContent = '기록하기 탭과 같은 단어 입력창입니다. 입력 중인 내용은 탭을 옮겨도 유지됩니다. 기존 단어만 저장하기 버튼으로 저장하세요.';
    hint.hidden = true;
    panel.insertBefore(hint, list);

    function placePanel() {
      const inVocab = !vocabTab.hidden && !vocabTab.classList.contains('hidden');
      if (inVocab) {
        if (panel.parentElement !== vocabTab) vocabTab.prepend(panel);
      } else if (panel.parentElement !== recordTab) {
        home.after(panel);
      }
      hint.hidden = !inVocab;
      if (headingText) headingText.textContent = inVocab ? ' 단어 바로 추가' : originalTitle;
      if (header) header.className = inVocab ? originalHeaderClass + ' flex-wrap gap-3' : originalHeaderClass;
    }

    const observer = new MutationObserver(placePanel);
    observer.observe(vocabTab, { attributes: true, attributeFilter: ['class', 'hidden'] });
    vocabTab.dataset.quickAddMounted = 'true';
    placePanel();
    return true;
  }

  if (!mountVocabQuickAdd()) {
    const observer = new MutationObserver(() => {
      if (mountVocabQuickAdd()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
  }
})();
