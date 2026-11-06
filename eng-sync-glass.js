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

/* English study sessions: collect final choices, then save existing records once. */
(() => {
'use strict';
function install() {
 if (window.FloveEnglishStudy || !window.FloveSync || window.FLOVE_SYNC_CONFIG?.page !== 'eng' || window.FLOVE_SYNC_CONFIG.readOnly) return;
 const dataKey='english_exam_logs_v14', draftKey='__flove_eng_study_draft_v1';
 const old={};
 for(const name of ['getAllVocabList','setWordMemorizedState','initFlashcardMode','renderFlashcard','nextFlashcard','prevFlashcard','flipFlashcard','initQuizMode','renderQuizQuestion','checkQuizAnswer','switchTab','switchVocabSubTab']) {
  if(typeof window[name]!=='function') throw Error('영어 학습 함수 누락: '+name);
  old[name]=window[name];
 }
 let session=null, animation=null, serial=0, storageWarning=false;
 const visible=id=>{const e=document.getElementById(id);return e&&!e.hidden&&!e.classList.contains('hidden');};
 const key=(id,word)=>JSON.stringify([id,word]);
 function banner(message) {
  for(const mode of ['card','quiz']) {
   const host=document.getElementById('vocab-sub-'+mode);if(!host)continue;
   let bar=document.getElementById('eng-study-'+mode);
   if(!bar){
    bar=document.createElement('div');bar.id='eng-study-'+mode;bar.className='w-full text-xs bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2';
    const text=document.createElement('p');text.setAttribute('role','status');text.setAttribute('aria-live','polite');bar.appendChild(text);
    const done=document.createElement('button');done.type='button';done.textContent='학습 종료 · 한 번에 저장';done.className='px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold';
    done.onclick=()=>{if(finish())old.switchVocabSubTab('list');};bar.appendChild(done);host.prepend(bar);
   }
   bar.firstElementChild.textContent=message || (session?'학습 중 변경 '+session.changes.size+'묶음 · 종료할 때 한 번에 저장합니다.':'기기에 반영 완료 · 서버 저장 여부는 상단 동기화 상태를 확인하세요.');
  }
 }
 function journal() {
  try {
   if(session&&session.changes.size)sessionStorage.setItem(draftKey,JSON.stringify({version:1,changes:[...session.changes.values()]}));
   else sessionStorage.removeItem(draftKey);
   storageWarning=false;
  }catch(error){
   if(!storageWarning){storageWarning=true;alert('임시 보관 실패 — 현재 화면의 변경은 유지됩니다. 새로고침하지 말고 학습 종료·저장을 눌러 주세요.');}
  }
 }
 function cancelAnimation(){serial++;if(animation!==null)clearTimeout(animation);animation=null;isCardAnimating=false;}
 function begin(mode){if(!finish())return false;session={mode,changes:new Map()};serial++;banner();return true;}
 function finish() {
  cancelAnimation();
  if(!session)return true;
  const changes=[...session.changes.values()];
  {
   try {
    const latest=FloveSync.readArray(dataKey,examDataList);
    const next=JSON.parse(JSON.stringify(latest));
    for(const change of changes){
     const exam=next.find(e=>e.id===change.id);
     const matches=exam&&Array.isArray(exam.vocabs)?exam.vocabs.filter(v=>v.word===change.word):[];
     if(matches.length!==change.before.length||matches.some((v,i)=>(v.meaning||'')!==change.before[i].meaning))throw Error('학습 중 단어가 수정·삭제되었습니다: '+change.word);
     for(const v of matches)v.memorized=change.value;
    }
    const raw=JSON.stringify(next);
    if(changes.length&&raw!==localStorage.getItem(dataKey))FloveSync.saveLocal(dataKey,raw);
    examDataList=next;
   }catch(error){journal();banner('저장 실패 · 변경사항 유지 중. 종료·저장 버튼으로 다시 시도하세요. '+error.message);return false;}
  }
  session=null;
  journal();
  if(changes.length)FloveSync.markSaved();
  banner();
  return true;
 }
 function stage(word,id,value) {
  if(!session)return old.setWordMemorizedState(word,id,value);
  value=Boolean(value);
  for(const exam of examDataList){
   if(id!==null&&exam.id!==id)continue;
   const matches=Array.isArray(exam.vocabs)?exam.vocabs.filter(v=>v.word===word):[];
   if(!matches.length)continue;
   const k=key(exam.id,word),previous=session.changes.get(k);
   const before=previous?previous.before:matches.map(v=>({meaning:v.meaning||'',memorized:Boolean(v.memorized)}));
   if(before.every(v=>v.memorized===value))session.changes.delete(k);
   else session.changes.set(k,{id:exam.id,word,before,value});
  }
  journal();banner();
 }
 window.setWordMemorizedState=stage;
 window.getAllVocabList=function(){return old.getAllVocabList().map(v=>{const change=session?.changes.get(key(v.examId,v.word));return change?{...v,memorized:change.value}:v;});};
 window.initFlashcardMode=function(){if(!begin('card'))return;old.initFlashcardMode();};
 window.renderFlashcard=function(){
  if(flashcardList.length===0||currentCardIdx>=flashcardList.length)finish();
  old.renderFlashcard();
 };
 window.markCurrentCard=function(value){
  if(isCardAnimating||!flashcardList.length||currentCardIdx>=flashcardList.length)return;
  if(!session){session={mode:'card',changes:new Map()};serial++;}
  const item=flashcardList[currentCardIdx],idx=currentCardIdx,token=serial;
  stage(item.word,item.examId,value);
  isCardAnimating=true;
  const box=document.getElementById('flashcard-box');
  box.className='w-full max-w-md h-64 text-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-center '+(value?'bg-emerald-600':'bg-rose-600');
  box.textContent=value?'암기 선택 · 종료 시 저장':'미암기 선택 · 종료 시 저장';
  animation=setTimeout(()=>{
   animation=null;
   if(serial!==token||!session||session.mode!=='card')return;
   currentCardIdx=idx+1;isCardFlipped=false;isCardAnimating=false;window.renderFlashcard();
  },320);
 };
 for(const name of ['nextFlashcard','prevFlashcard','flipFlashcard'])window[name]=function(){cancelAnimation();return old[name]();};
 window.initQuizMode=function(){if(!begin('quiz'))return;old.initQuizMode();};
 window.renderQuizQuestion=function(){
  if(quizQueue.length===0||quizCurrentIdx>=quizQueue.length||getAllVocabList().length<4)finish();
  old.renderQuizQuestion();
 };
 function quizChoices(){
  if(document.getElementById('eng-quiz-memo'))return;
  const host=document.getElementById('quiz-card-box'),row=document.createElement('div');row.id='eng-quiz-memo';row.className='flex flex-wrap justify-center gap-2 mt-4';
  const hint=document.createElement('p');hint.className='w-full text-xs text-slate-500';hint.textContent='정답 여부와 별개로 암기 상태를 선택하세요. 선택하면 다음 문제로 이동합니다.';row.appendChild(hint);
  for(const value of [false,true]){
   const button=document.createElement('button');button.type='button';button.textContent=value?'암기 · 다음':'미암기 · 다음';button.className='px-3 py-2 text-xs font-bold rounded-lg border '+(value?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700');
   button.onclick=()=>{
    if(!session||session.mode!=='quiz'||!quizAnswered||!currentQuizWord||quizCurrentIdx>=quizQueue.length)return;
    stage(currentQuizWord.word,currentQuizWord.examId,value);generateQuizQuestion();
   };row.appendChild(button);
  }
  host.appendChild(row);
 }
 window.checkQuizAnswer=function(...args){if(quizAnswered)return;old.checkQuizAnswer(...args);if(quizAnswered)quizChoices();};
 window.switchVocabSubTab=function(sub){if(!finish())return;old.switchVocabSubTab(sub);};
 window.switchTab=function(tab){
  if(tab!=='vocab'&&!finish())return;
  old.switchTab(tab);
  if(tab==='vocab'&&!session){
   if(visible('vocab-sub-card'))window.initFlashcardMode();
   else if(visible('vocab-sub-quiz'))window.initQuizMode();
  }
 };
 FloveSync.register({
  editing:()=>editingExamId!==null||session!==null||(visible('tab-vocab')&&visible('vocab-sub-auto')&&isAutoPlaying),
  refresh:()=>{examDataList=FloveSync.readArray(dataKey);renderHistory();renderAnalytics();renderIntegratedVocab();}
 });
 document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href]');
  if(a&&a.getAttribute('href')&&!a.getAttribute('href').startsWith('#')&&!finish()){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 window.addEventListener('beforeunload',e=>{if(!finish()){e.preventDefault();e.returnValue='';}});
 window.addEventListener('pagehide',()=>finish());
 window.FloveEnglishStudy=Object.freeze({finish,hasPending:()=>Boolean(session?.changes.size)});
 try {
  const raw=sessionStorage.getItem(draftKey);
  if(raw){
   const draft=JSON.parse(raw);
   if(draft.version!==1||!Array.isArray(draft.changes)||draft.changes.some(c=>!c||!['number','string'].includes(typeof c.id)||typeof c.word!=='string'||typeof c.value!=='boolean'||!Array.isArray(c.before)||!c.before.length||c.before.some(v=>typeof v.meaning!=='string'||typeof v.memorized!=='boolean')))throw Error('임시 보관 형식 오류');
   session={mode:'recovery',changes:new Map(draft.changes.map(c=>[key(c.id,c.word),c]))};
   banner('이전 학습의 미저장 변경을 복구했습니다. 종료·저장 버튼으로 반영하세요.');
   alert('이전 학습의 미저장 변경을 복구했습니다. 단어장 탭에서 플래시카드나 퀴즈를 열면 이전 변경을 먼저 저장합니다.');
  }
 }catch(error){alert('이전 학습 임시 보관을 읽지 못했습니다. 원본을 자동 삭제하지 않습니다: '+error.message);}
 if(!session&&visible('tab-vocab')){
  if(visible('vocab-sub-card')){session={mode:'card',changes:new Map()};banner();}
  else if(visible('vocab-sub-quiz')){session={mode:'quiz',changes:new Map()};banner();}
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
