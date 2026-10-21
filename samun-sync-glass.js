/* Samun-only presentation. Existing sync engine owns note operations. */
(() => {
'use strict';
const cfg=window.FLOVE_SYNC_CONFIG||{};if(cfg.page!=='samun'||cfg.readOnly)return;
const css="#flove-sync-v2-panel.sc-root{position:relative;z-index:10000;width:calc(100% - 24px);max-width:1200px;margin:0 auto 12px;padding:0;border:0;border-radius:0;background:transparent;color:#334155;font:inherit}#flove-sync-v2-panel.sc-root *{box-sizing:border-box}#flove-sync-v2-panel.sc-root [hidden]{display:none!important}#flove-sync-v2-panel .sc-bar{--a:#059669;display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:44px;padding:6px 10px;border:1px solid rgba(255,255,255,.95);outline:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(255,255,255,.68);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);box-shadow:0 4px 16px rgba(15,23,42,.045),inset 0 1px 0 rgba(255,255,255,.8)}#flove-sync-v2-panel .sc-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:rgba(16,185,129,.08);color:var(--a)}#flove-sync-v2-panel .sc-icon svg{width:17px;height:17px}#flove-sync-v2-panel .sc-copy{display:flex;align-items:center;flex-wrap:wrap;gap:3px 8px;min-width:0}#flove-sync-v2-panel .sc-title{margin:0;font-size:11.5px;font-weight:700;line-height:1.6;overflow-wrap:anywhere}#flove-sync-v2-panel .sc-time{font-size:10px;color:#64748b;white-space:nowrap}#flove-sync-v2-panel .sc-actions{display:flex;gap:4px;align-items:center}#flove-sync-v2-panel .sc-retry,#flove-sync-v2-panel .sc-info summary{display:grid;place-items:center;min-width:30px;min-height:30px;margin:0;padding:6px;border:1px solid rgba(255,255,255,.8);border-radius:9px;background:rgba(255,255,255,.4);color:#64748b;cursor:pointer;list-style:none}#flove-sync-v2-panel .sc-retry svg,#flove-sync-v2-panel .sc-info summary svg{width:14px;height:14px}#flove-sync-v2-panel .sc-info summary::-webkit-details-marker{display:none}#flove-sync-v2-panel .sc-retry:disabled{opacity:.45;cursor:wait}#flove-sync-v2-panel .sc-inspect{min-height:28px;padding:4px 8px;border:1px solid #fde68a;border-radius:8px;background:rgba(251,191,36,.1);color:#92400e;font-size:10.5px;font-weight:650;cursor:pointer;white-space:nowrap}#flove-sync-v2-panel .sc-pop{position:absolute;right:0;top:calc(100% + 7px);width:min(310px,100%);padding:14px;border:1px solid #fff;border-radius:14px;background:rgba(248,250,252,.97);backdrop-filter:blur(20px);box-shadow:0 12px 28px rgba(15,23,42,.1);font-size:11px;line-height:1.8}#flove-sync-v2-panel .sc-pop p{margin:0 0 8px;overflow-wrap:anywhere}#flove-sync-v2-panel .sc-backup,#flove-sync-v2-panel .sc-choice{min-height:32px;margin:0;padding:8px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;color:#475569;font-size:11px;cursor:pointer}#flove-sync-v2-panel .sc-panel{margin-top:7px;padding:14px;border:1px solid #fde68a;border-radius:12px;background:rgba(255,251,235,.94);color:#78350f;font-size:11px;line-height:1.8}#flove-sync-v2-panel .sc-panel h2{margin:0 0 5px;font-size:12px}#flove-sync-v2-panel .sc-warning{margin:0 0 10px}#flove-sync-v2-panel .sc-groups{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}#flove-sync-v2-panel .sc-group{border:1px solid #fde68a;border-radius:6px;background:#fff;padding:2px 7px;font-size:10px}#flove-sync-v2-panel .sc-choices{display:flex;flex-wrap:wrap;gap:7px}#flove-sync-v2-panel .sc-choice{border-color:#fcd34d;color:#78350f}#flove-sync-v2-panel .sc-raw{display:none!important}#flove-sync-v2-panel:is([data-samun-state='conflict'],[data-samun-state='waiting']) .sc-bar{--a:#b45309;background:rgba(255,253,247,.72)}#flove-sync-v2-panel[data-samun-state='error'] .sc-bar{--a:#e11d48}#flove-sync-v2-panel:is([data-samun-state='checking'],[data-samun-state='saving']) .sc-bar{--a:#2563eb}#flove-sync-v2-panel :is(button,summary):focus-visible{outline:2px solid #6366f1;outline-offset:3px}@media(max-width:600px){#flove-sync-v2-panel .sc-bar{grid-template-columns:25px minmax(0,1fr) auto;gap:6px;padding:6px 8px;border-radius:12px}#flove-sync-v2-panel .sc-icon{width:25px;height:25px}#flove-sync-v2-panel .sc-title{font-size:11px}#flove-sync-v2-panel .sc-time{display:none}#flove-sync-v2-panel .sc-actions{gap:2px}#flove-sync-v2-panel .sc-retry,#flove-sync-v2-panel .sc-info summary{min-width:28px;min-height:28px}}@media print{#flove-sync-v2-panel.sc-root{display:none!important}}\n";
const svg=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+p+'</svg>';
const cloud=svg('<path d="M7 18h10a4.5 4.5 0 0 0 1-8.9 6 6 0 0 0-11.4-1A5 5 0 0 0 7 18Z"/><path d="m9 13 2 2 4-4"/>');
const refresh=svg('<path d="M20 7v5h-5M4 17v-5h5M5.8 7a7 7 0 0 1 11.7-1.5L20 8M4 16l2.5 2.5A7 7 0 0 0 18.2 17"/>');
const info=svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>');
function mount(){
 const box=document.getElementById('flove-sync-v2-panel');if(!box)return false;if(box.dataset.samunGlassMounted)return true;
 const raw=box.firstElementChild,backup=[...box.children].find(x=>x.tagName==='BUTTON'&&x.textContent==='양쪽 원본 내려받기'),conflict=[...box.children].find(x=>x.tagName==='DIV'&&x.querySelector('pre'));
 if(!raw||!backup||!conflict||!window.FloveSync||typeof window.FloveSync.retry!=='function')return false;
 const keys=conflict.querySelector('pre'),choices=[...conflict.querySelectorAll('button')];if(choices.length!==2)return false;
 const old=[...box.childNodes],styles=new Map([box,backup,...choices].map(x=>[x,x.getAttribute('style')]));
 const bar=document.createElement('div');bar.className='sc-bar';bar.innerHTML='<span class="sc-icon" aria-hidden="true"></span><div class="sc-copy"><p class="sc-title" role="status" aria-live="polite" aria-atomic="true"></p><time class="sc-time"></time><button type="button" class="sc-inspect" hidden aria-expanded="false" aria-controls="flove-samun-sync-conflicts">기록 확인</button></div><div class="sc-actions"><button type="button" class="sc-retry" aria-label="사문 동기화 다시 확인" title="다시 확인"></button><details class="sc-info"><summary aria-label="사문 동기화 상세 정보" title="상세 정보"></summary><div class="sc-pop"><p class="sc-explain"></p><p>사문 오답·행동강령 기록의 기존 동기화 상태를 표시합니다.</p></div></details></div>';
 const panel=document.createElement('section');panel.id='flove-samun-sync-conflicts';panel.className='sc-panel';panel.hidden=true;panel.innerHTML='<h2>사문 동기화 · 확인 대상</h2><div class="sc-groups"></div><p class="sc-warning">아래 선택은 표시된 기록 묶음 전체를 교체합니다. 자동 병합이 아닙니다. 먼저 양쪽 원본을 보관하고 내용을 확인해 주세요.</p>';
 const q=s=>bar.querySelector(s),title=q('.sc-title'),time=q('.sc-time'),retry=q('.sc-retry'),inspect=q('.sc-inspect'),details=q('details'),summary=q('summary'),explain=q('.sc-explain'),groups=panel.querySelector('.sc-groups');let pending=false,expanded=false,lastTime='',observer;
 function paint(){
  const text=raw.textContent||'',active=/^충돌\s+\d+개/.test(text)&&!conflict.hidden;
  const state=pending?'checking':active?'conflict':/^서버 저장 중/.test(text)?'saving':/^동기화 확인|^서버 저장 성공/.test(text)?'synced':/변경 대기/.test(text)?'waiting':/실패|오류|중단/.test(text)?'error':/연결 확인/.test(text)?'checking':'notice';
  box.dataset.samunState=state;box.setAttribute('aria-busy',String(pending||state==='saving'));retry.disabled=pending;
  title.textContent=state==='conflict'?'사문 기록 차이 · 확인 필요':state==='synced'?'사문 동기화 완료':state==='saving'?'사문 기록 저장 중…':state==='waiting'?'사문 기록 반영 대기':state==='checking'?'사문 동기화 확인 중…':text;
  if(state==='synced'){const m=text.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);if(m){let h=Number(m[1]);if(/오후/.test(text)&&h<12)h+=12;if(/오전/.test(text)&&h===12)h=0;lastTime=String(h).padStart(2,'0')+':'+m[2];}}
  time.textContent=lastTime?(state==='error'?'이전 확인 ':'')+lastTime+(state==='synced'?' 확인':''):'';time.hidden=!lastTime||state==='checking';inspect.hidden=state!=='conflict';if(conflict.hidden)expanded=false;panel.hidden=state!=='conflict'||!expanded;inspect.setAttribute('aria-expanded',String(!panel.hidden));explain.textContent=pending?'기존 동기화 함수로 서버 기록을 다시 확인하고 있습니다.':text;
  const names={'samun_notes_v1':'오답·행동강령 기록'};groups.replaceChildren();for(const key of [...new Set(keys.textContent.split('\n').filter(Boolean))]){const chip=document.createElement('span');chip.className='sc-group';chip.textContent=names[key]||key;groups.append(chip);}
 }
 try{
  if(!document.getElementById('flove-samun-sync-glass-style')){const style=document.createElement('style');style.id='flove-samun-sync-glass-style';style.textContent=css;document.head.append(style);}
  box.replaceChildren(raw,bar,panel);box.style.cssText='';box.classList.add('sc-root');raw.classList.add('sc-raw');keys.classList.add('sc-raw');backup.style.cssText='';backup.classList.add('sc-backup');q('.sc-pop').append(backup);panel.append(conflict);conflict.classList.add('sc-choices');for(const x of choices){x.style.cssText='';x.classList.add('sc-choice');}
  q('.sc-icon').innerHTML=cloud;retry.innerHTML=refresh;summary.innerHTML=info;inspect.addEventListener('click',()=>{expanded=!expanded;paint();});
  retry.addEventListener('click',async()=>{if(pending)return;pending=true;paint();try{await window.FloveSync.retry();}catch(e){console.warn('[Flove Samun UI] Retry failed',e);}finally{pending=false;paint();}});
  box.addEventListener('keydown',e=>{if(e.key==='Escape'){if(details.open){details.open=false;summary.focus();}else if(expanded){expanded=false;paint();inspect.focus();}}});document.addEventListener('click',e=>{if(details.open&&!details.contains(e.target))details.open=false;});
  observer=new MutationObserver(paint);observer.observe(raw,{childList:true,subtree:true,characterData:true});observer.observe(conflict,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true});box.dataset.samunGlassMounted='true';paint();return true;
 }catch(e){
  if(observer)observer.disconnect();box.replaceChildren(...old);for(const[x,c]of[[box,'sc-root'],[raw,'sc-raw'],[keys,'sc-raw'],[backup,'sc-backup'],[conflict,'sc-choices'],...choices.map(x=>[x,'sc-choice'])])x.classList.remove(c);for(const[x,s]of styles){if(s===null)x.removeAttribute('style');else x.setAttribute('style',s);}delete box.dataset.samunGlassMounted;delete box.dataset.samunState;box.removeAttribute('aria-busy');console.warn('[Flove Samun UI] Original panel retained',e);return false;
 }
}
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);}
})();

/* Optional entry for all Samun tabs; persistence stays with FloveSync. */
(() => {
  'use strict';
  const cfg = window.FLOVE_SYNC_CONFIG || {};
  if (cfg.page !== 'samun' || cfg.readOnly) return;
  function init() {
    const get = id => document.getElementById(id);
    const form = get('noteForm');
    if (!form || form.dataset.samunOptional) return;
    const optional = () => ['absolute', 'concept', 'statistics'].includes(currentSubject);
    const ids = ['unitSelect', 'yearInput', 'monthDetail', 'passageTitle', 'noteContent'];
    const required = new Map(ids.map(id => [id, get(id).required]));
    const examRequired = get('examCategory').required;
    function apply() {
      const enabled = optional();
      get('examCategory').required = enabled || examRequired;
      for (const id of ids) {
        get(id).required = !enabled && required.get(id) &&
          !(isQuickMode && (id === 'yearInput' || id === 'passageTitle'));
        const label = form.querySelector('label[for="' + id + '"]');
        if (!label) continue;
        const marker = label.querySelector('[data-samun-optional]');
        if (marker) marker.remove();
        if (enabled && id !== 'monthDetail') {
          const span = document.createElement('span');
          span.className = 'opt-text';
          span.dataset.samunOptional = 'true';
          span.textContent = ' (선택)';
          label.appendChild(span);
        }
      }
      get('yearInput').placeholder = enabled ? '예: 25 또는 26 (미입력 가능)'
        : isQuickMode ? '자동 입력 (생략 가능)' : '예: 25 또는 26';
      if (enabled) get('passageTitle').placeholder = currentSubject === 'absolute'
        ? '예: [시험 태도] 모르는 선지 함정 유의 (미입력 가능)'
        : currentSubject === 'concept'
          ? '예: 실증적 연구 vs 해석적 연구 (미입력 가능)'
          : '예: 부모/자녀 계층 이동 도표 분모 확인 (미입력 가능)';
    }
    const originalUnits = window.updateUnitOptions;
    window.updateUnitOptions = function(...args) {
      const result = originalUnits.apply(this, args);
      if (optional()) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '선택 안 함';
        option.defaultSelected = true;
        get('unitSelect').prepend(option);
        get('unitSelect').value = '';
      }
      return result;
    };
    for (const name of ['switchSubject', 'toggleQuickMode', 'cancelEdit']) {
      const original = window[name];
      window[name] = function(...args) {
        const result = original.apply(this, args);
        apply();
        return result;
      };
    }
    get('yearInput').addEventListener('blur', function() {
      if (optional() && !this.value.trim()) this.value = '';
    }, true);
    form.addEventListener('submit', function(event) {
      if (!optional()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!get('examCategory').value) {
        get('examCategory').reportValidity();
        return;
      }
      const rawYear = get('yearInput').value.trim();
      const values = {
        category: get('examCategory').value,
        year: rawYear ? parseYear(rawYear) : '',
        monthDetail: parseMonth(get('monthDetail').value),
        unit: currentSubject === 'absolute' ? '' : get('unitSelect').value,
        passageTitle: get('passageTitle').value.trim(),
        content: get('noteContent').value
      };
      const previous = notes;
      const editing = editingId !== null;
      if (editing) {
        notes = notes.map(note => note.id === editingId
          ? {...note, ...values, updatedAt: new Date().toLocaleDateString()}
          : note);
      } else {
        notes = [{
          id: Date.now(), subject: currentSubject, ...values,
          createdAt: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          })
        }, ...notes];
      }
      try {
        saveAndRender();
      } catch (error) {
        notes = previous;
        throw error;
      }
      if (editing) cancelEdit();
      if (isQuickMode) {
        get('noteContent').value = '';
        get('passageTitle').value = '';
        get('noteContent').focus();
      } else {
        form.reset();
        if (!editing) {
          get('examCategory').value = values.category;
          get('unitSelect').value = values.unit;
        }
      }
      apply();
    }, true);
    form.dataset.samunOptional = 'true';
    if (optional()) updateUnitOptions();
    apply();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();
