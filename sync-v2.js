/* Flove protocol-2 sync. Public client code: do not store OAuth tokens here. */
(() => {
'use strict';
const endpoint='https://script.google.com/macros/s/AKfycbzf5zZG53ArO38Y9pYUQi4uBTLCvf8x1qLH5_CHSJRMXabslHh17XbnYo8xxE6ntPZR/exec';
const cfg=window.FLOVE_SYNC_CONFIG||{page:'none',keys:[]};
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),val=(o,k)=>has(o,k)?o[k]:null;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const planKey=k=>/^\d{4}-\d{2}-\d{2}-[A-Za-z0-9_-]+$/.test(k)||/^rolled-id-\d+-\d+$/.test(k)||/^flove-rolled-\d{4}-\d{2}-\d{2}$/.test(k)||['flove-active-preset','flove-custom-hex','flove-last-save'].includes(k);
const own=k=>cfg.keys.includes(k)||(cfg.plan&&planKey(k))||(cfg.readOnly&&cfg.hubStatus&&cfg.inspectPlan&&planKey(k));
const recoverySource=new URL(document.currentScript.src);
let recoveryManagerInstance,recoveryReady=false,recoveryRender=()=>{},recoveryNotice='';
function requireRecovery(){if(!recoveryReady||!recoveryManagerInstance)throw Error('복구본 관리 준비 전 — 기록 교체 중단');return recoveryManagerInstance;}
function loadRecovery(){
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script'),url=new URL('recovery-backups.js',recoverySource);
  url.searchParams.set('v','1.0.0');const build=recoverySource.searchParams.get('flove_build');if(build)url.searchParams.set('flove_build',build);
  const timer=setTimeout(()=>finish(Error('복구본 관리 모듈 로딩 시간 초과')),15000);let settled=false;
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else resolve();}
  script.src=url.href;script.onload=()=>{const api=globalThis.FloveRecovery;if(!api||api.version!==1||typeof api.create!=='function'){finish(Error('복구본 관리 모듈 형식 오류'));return;}try{recoveryManagerInstance=api.create(localStorage,validate);recoveryReady=true;finish();}catch(e){finish(e);}};
  script.onerror=()=>finish(Error('복구본 관리 모듈을 불러오지 못했습니다'));document.head.appendChild(script);
 });
}
function maintainRecovery(){
 if(!idle()||(!cfg.keys.length&&!cfg.plan))return;
 try{if(requireRecovery().needsLegacyCleanup())backup('recovery-maintenance');}
 catch(e){recoveryNotice='자동 정리 보류: '+e.message;console.warn('[Flove Recovery]',e);}
 finally{recoveryRender();}
}
function mountRecovery(box){
 const styleId='flove-recovery-footer-style';
 if(!document.getElementById(styleId)){
  const style=document.createElement('style');style.id=styleId;
  style.textContent=`#flove-recovery-footer{box-sizing:border-box;width:100%;max-width:1200px;margin:8px auto 0;padding:0 16px;display:flex;justify-content:flex-end;flex-shrink:0;font:inherit}#flove-recovery-footer[data-timer]{max-width:520px}#flove-recovery-storage{position:relative;display:inline-block;max-width:100%;font:inherit;font-size:12px;text-align:left}#flove-recovery-storage>summary{display:inline-flex;align-items:center;gap:6px;min-height:30px;box-sizing:border-box;padding:4px 7px;border:1px solid transparent;border-radius:9px;list-style:none;color:inherit;opacity:.76;font:inherit;font-size:11.5px;cursor:pointer;user-select:none;transition:opacity .15s,background .15s}#flove-recovery-storage>summary::-webkit-details-marker{display:none}#flove-recovery-storage>summary svg{width:14px;height:14px;flex:none}#flove-recovery-storage>summary:hover,#flove-recovery-storage[open]>summary{opacity:1;background:rgba(148,163,184,.10)}#flove-recovery-storage>summary:focus-visible,#flove-recovery-storage button:focus-visible{outline:2px solid #818cf8;outline-offset:3px}#flove-recovery-storage[open]{z-index:10002}#flove-recovery-storage .fr-panel{position:absolute;right:0;bottom:calc(100% + 8px);box-sizing:border-box;width:320px;max-width:calc(100vw - 32px);max-height:min(65vh,420px);overflow:auto;padding:14px;border:1px solid var(--border-color,#e2e8f0);border-radius:15px;background:var(--card-bg,#fff);color:var(--text-main,#334155);box-shadow:0 12px 36px rgba(15,23,42,.12);font:inherit;font-size:12px;line-height:1.65}#flove-recovery-storage .fr-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}#flove-recovery-storage .fr-head h2{font:inherit;font-weight:700;font-size:13px;margin:0}#flove-recovery-storage button{font:inherit;color:inherit;cursor:pointer}#flove-recovery-storage .fr-close{display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:8px;background:transparent;color:#64748b;font-size:18px}#flove-recovery-storage .fr-close:hover{background:rgba(148,163,184,.12)}#flove-recovery-storage .fr-usage{white-space:pre-line;margin:0 0 7px}#flove-recovery-storage .fr-count{margin:0 0 12px;font-size:11px;color:#64748b;overflow-wrap:anywhere}#flove-recovery-storage .fr-warning{margin:8px 0;padding:8px;border-radius:8px;background:#fffbeb;color:#92400e;font-size:11px;white-space:pre-line}#flove-recovery-storage [hidden]{display:none!important}#flove-recovery-storage .fr-actions{display:flex;flex-direction:column;gap:6px}#flove-recovery-storage .fr-actions button{min-height:33px;padding:6px 9px;border:1px solid var(--border-color,#e2e8f0);border-radius:9px;background:transparent;font-size:11px}#flove-recovery-storage .fr-actions button:hover{background:rgba(148,163,184,.08)}#flove-recovery-storage .fr-policy{margin-top:10px;color:#64748b;font-size:10.5px}#flove-recovery-storage .fr-policy>summary{cursor:pointer;width:fit-content}#flove-recovery-storage .fr-policy p{margin:7px 0 0;line-height:1.7}#flove-recovery-storage .fr-caption{font-size:10px;color:#94a3b8;margin:9px 0 0}@media(max-width:600px){#flove-recovery-storage>summary{min-height:34px}#flove-recovery-storage .fr-panel{padding:12px}}@media(prefers-reduced-motion:reduce){#flove-recovery-storage>summary{transition:none}}@media print{#flove-recovery-footer{display:none!important}}`;
  document.head.appendChild(style);
 }
 const host=document.createElement('div');host.id='flove-recovery-footer';if(cfg.page==='timer')host.dataset.timer='true';
 const view=document.createElement('details');view.id='flove-recovery-storage';
 const summary=document.createElement('summary');summary.title='기기 백업·복구 관리';
 summary.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></svg><span>백업·복구</span>';
 const panel=document.createElement('div');panel.className='fr-panel';
 const header=document.createElement('div');header.className='fr-head';
 const title=document.createElement('h2');title.textContent='백업·복구';
 const close=document.createElement('button');close.type='button';close.className='fr-close';close.textContent='×';close.setAttribute('aria-label','복구본 관리 닫기');
 header.append(title,close);
 const usage=document.createElement('p');usage.className='fr-usage';usage.setAttribute('role','status');
 const count=document.createElement('p');count.className='fr-count';
 const warning=document.createElement('p');warning.className='fr-warning';warning.hidden=true;
 const actions=document.createElement('div');actions.className='fr-actions';
 const check=document.createElement('button'),exportAll=document.createElement('button');check.type=exportAll.type='button';check.textContent='사용량 다시 확인';exportAll.textContent='보관된 복구본 전체 내려받기';actions.append(check,exportAll);
 const policy=document.createElement('details');policy.className='fr-policy';
 const policyTitle=document.createElement('summary');policyTitle.textContent='보관 기준';
 const policyText=document.createElement('p');policyText.textContent='기존 일반 복구본은 7일 이상 지난 것만 정리하며 화면별 최신 2개는 남깁니다. 새 일반 복구본은 화면별 8개·합계 추정 1 MiB를 목표로 하되 최신 1개와 최근 1분 복구본을 보호합니다. 충돌·초기화 전·손상·분류 불명 복구본은 자동 삭제하지 않습니다. 따라서 전체 용량의 강제 상한은 아닙니다.';
 policy.append(policyTitle,policyText);
 const caption=document.createElement('p');caption.className='fr-caption';caption.textContent='사용량은 추정치이며 남은 localStorage 용량은 정확히 알 수 없습니다.';
 panel.append(header,usage,count,warning,actions,policy,caption);view.append(summary,panel);host.append(view);
 const kib=n=>(n/1024).toFixed(1)+' KiB';
 recoveryRender=()=>{if(!view.open)return;try{const s=requireRecovery().stats();usage.textContent='기기 저장소  '+kib(s.estimatedLocalStorageBytes)+'\n복구본  '+kib(s.estimatedRecoveryBytes);count.textContent='일반 '+s.automaticCount+' · 기존 '+s.legacyAutomaticCount+' · 보호 '+s.protectedCount+' · 정리 대기 '+s.legacyCleanupCandidateCount;warning.textContent=[s.warning,recoveryNotice].filter(Boolean).join('\n');warning.hidden=!warning.textContent;}catch(e){usage.textContent='사용량 확인 실패 — 기존 기록 유지';count.textContent='';warning.textContent=e.message;warning.hidden=false;}};
 view.addEventListener('toggle',recoveryRender);check.addEventListener('click',recoveryRender);
 const fitPanel=()=>{if(!view.open)return;panel.style.transform='';const r=panel.getBoundingClientRect(),width=document.documentElement.clientWidth;const shift=r.left<12?12-r.left:r.right>width-12?width-12-r.right:0;panel.style.transform=shift?'translateX('+shift+'px)':'';};
 view.addEventListener('toggle',fitPanel);window.addEventListener('resize',fitPanel);
 close.addEventListener('click',()=>{view.open=false;summary.focus();});
 view.addEventListener('keydown',e=>{if(cfg.page==='timer')e.stopPropagation();if(e.key==='Escape'&&view.open){view.open=false;summary.focus();e.stopPropagation();}});
 document.addEventListener('pointerdown',e=>{if(view.open&&!view.contains(e.target))view.open=false;});
 exportAll.addEventListener('click',()=>{let url;try{url=URL.createObjectURL(new Blob([JSON.stringify(requireRecovery().archive(),null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Flove_보관복구본_'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();}catch(e){warning.textContent='복구본 내보내기 실패: '+e.message;warning.hidden=false;}finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}});
 window.addEventListener('storage',e=>{if(e.key===null||e.key.startsWith('__flove_sync_recovery_'))recoveryRender();});
 (document.querySelector('body > footer')||document.body).appendChild(host);
}

/* Persistent baseline v1: metadata only, scoped by endpoint and page. */
function createPersistentBaseline(options){
 const {storage,locks,page,server,owns,check}=options;
 if(!['index','korean','math','eng','sang','samun','plan','timer'].includes(page))throw Error('기준본 화면 식별 오류');
 const url=new URL(server);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('기준본 서버 식별 오류');
 const identity=url.href,key='__flove_sync_baseline_v1:'+encodeURIComponent(identity)+':'+page;
 if(!locks||typeof locks.request!=='function')throw Error('안전한 기준본 저장 잠금 미지원 — 자동 동기화 중단');
 let observed,baseline;
 function copy(values){
  if(!obj(values))throw Error('기준본 형식 오류');
  const result=Object.create(null);
  for(const k of Object.keys(values).sort()){
   if(!k||['__proto__','constructor','prototype'].includes(k)||!owns(k))throw Error('기준본 키 오류: '+k);
   check(k,values[k]);if(values[k]!==null&&typeof values[k]!=='string')throw Error('기준본 값 오류: '+k);
   result[k]=values[k];
  }
  return result;
 }
 function decode(raw){
  if(raw===null)return {baseline:Object.create(null),revision:0};
  const state=JSON.parse(raw);
  if(!obj(state)||state.app!=='flove-confirmed-baseline'||state.version!==1||state.page!==page||state.endpoint!==identity||!Number.isSafeInteger(state.revision)||state.revision<1)throw Error('기준본 메타데이터 오류');
  return {baseline:copy(state.baseline),revision:state.revision};
 }
 function load(){
  const raw=storage.getItem(key),state=decode(raw);
  observed=raw;baseline=state.baseline;return copy(baseline);
 }
 function assertCurrent(){
  if(observed===undefined)throw Error('기준본 준비 전');
  if(storage.getItem(key)!==observed)throw Error('다른 탭에서 기준본 변경 — 새로고침 후 재확인 필요');
 }
 async function confirm(updates,confirmed){
  const delta=copy(updates);
  if(!obj(confirmed))throw Error('기준본 확인 응답 오류');
  for(const k of Object.keys(delta))if(delta[k]!==val(confirmed,k))throw Error('서버 확인값 불일치: '+k);
  return locks.request(key,{mode:'exclusive'},()=>{
   assertCurrent();
   const current=decode(observed),next=copy({...baseline,...delta});
   if(JSON.stringify(next)===JSON.stringify(baseline))return copy(baseline);
   const revision=current.revision+1;if(!Number.isSafeInteger(revision))throw Error('기준본 버전 범위 오류');
   const raw=JSON.stringify({app:'flove-confirmed-baseline',version:1,page,endpoint:identity,revision,baseline:next});
   storage.setItem(key,raw);
   if(storage.getItem(key)!==raw)throw Error('기준본 저장 결과 확인 실패');
   observed=raw;baseline=next;return copy(baseline);
  });
 }
 return {key,load,assertCurrent,confirm};
}
/* End persistent baseline v1. */
let baselineStore=null;

let base={},cloud={},adapter={},busy=false,dirty=false,stopped=false,conflicts=[],label,details,keysEl,hubLinks;
function decide(known,b,l,r){if(l===r)return 'equal';if(!known)return l===null&&r!==null?'pull':'conflict';if(l===b)return 'pull';if(r===b)return 'push';return 'conflict';}
function validate(k,v){
 if(v===null)return;if(typeof v!=='string')throw Error('서버 값 형식 오류: '+k);
 if(/notes_v\d+$|exam_logs_v\d+$/.test(k)){const a=JSON.parse(v);if(!Array.isArray(a)||a.some(x=>!obj(x)||!has(x,'id')))throw Error('기록 배열 오류: '+k);for(const x of a){for(const f of ['content','title','originalText','unit','category','importance'])if(has(x,f)&&x[f]!==null&&typeof x[f]!=='string')throw Error('기록 필드 오류: '+k);for(const f of ['vocabs','wrongQuestions','corrections'])if(has(x,f)&&(!Array.isArray(x[f])||x[f].some(y=>!obj(y))))throw Error('하위 기록 오류: '+k);}}
 else if(k==='liv_ethic_layout_v11'){const x=JSON.parse(v);if(!obj(x)||(has(x,'categoryOrder')&&!Array.isArray(x.categoryOrder)))throw Error('정렬 데이터 오류');}
 else if(k.startsWith('flove-rolled-')){if(!Array.isArray(JSON.parse(v)))throw Error('이월 데이터 오류');}
 else if(/^\d{4}-|^rolled-id-/.test(k)){if(!['true','false'].includes(v))throw Error('체크 데이터 오류');}
}
function local(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(own(k))d[k]=localStorage.getItem(k);}return d;}
function idle(){return !localSaveFailure&&!dirty&&(!adapter.editing||!adapter.editing());}
function status(s,bad=false){if(hubLinks){hubLinks.hidden=true;hubLinks.replaceChildren();}if(label){label.textContent=s;label.style.color=bad?'#b91c1c':'#166534';}}
const hubGroups=[
 {name:'국어',file:'korean.html',keys:['saegibun_notes_v3']},
 {name:'수학',file:'math.html',keys:['math_review_notes_v3']},
 {name:'영어',file:'eng.html',keys:['english_exam_logs_v14']},
 {name:'생활과 윤리',file:'sang.html',keys:['liv_ethic_notes_v11']},
 {name:'사회문화',file:'samun.html',keys:['samun_notes_v1']},
 {name:'플래너',file:'plan.html',keys:[]}
];
function hubActions(pull,ops,bad,ready){
 const applyKeys=pull.filter(k=>!(cfg.inspectPlan&&planKey(k)));
 const pending=[...bad,...ops.map(o=>o.key),...pull.filter(k=>!ready||(cfg.inspectPlan&&planKey(k)))];
 return {applyKeys:ready?applyKeys:[],pending:[...new Set(pending)]};
}
function hubReport(keys){
 const pending=new Set(keys),groups=hubGroups.filter(g=>g.keys.some(k=>pending.has(k))||(g.file==='plan.html'&&[...pending].some(planKey)));
 const unknown=[...pending].filter(k=>!planKey(k)&&!hubGroups.some(g=>g.keys.includes(k)));
 return {groups,unknown,needed:pending.size>0};
}
function renderHub(keys){
 const report=hubReport(keys),time=new Date().toLocaleTimeString('ko-KR');
 const names=report.groups.map(g=>g.name);if(report.unknown.length)names.push('기타 데이터');
 status(report.needed?'확인 필요: '+names.join(' · ')+' — 각 화면에서 기록을 확인해 주세요.':'전체 데이터 동기화 완료 · '+time,report.needed);
 if(!hubLinks)return;
 hubLinks.replaceChildren();hubLinks.hidden=!report.needed;
 for(const g of report.groups){
  const a=document.createElement('a');a.href=g.file;a.textContent=g.name+'에서 확인 →';
  Object.assign(a.style,{display:'inline-block',margin:'6px 8px 0 0',padding:'6px 10px',border:'1px solid #cbd5e1',borderRadius:'8px',color:'#334155',background:'#f8fafc',textDecoration:'none'});
  a.addEventListener('click',e=>{if(e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&typeof window.launchTool==='function'){e.preventDefault();window.launchTool(g.file);}});
  hubLinks.appendChild(a);
 }
}
async function remember(updates,confirmed){
 try{base=await baselineStore.confirm(updates,confirmed);}catch(e){stopped=true;throw Error('기준본 보존 실패 — 추가 동기화 중단: '+e.message);}
}
function snapshot(reason){return {format:'flove-sync-recovery-v2',createdAt:new Date().toISOString(),reason,page:cfg.page,local:local(),cloud:Object.fromEntries(Object.entries(cloud).filter(([k])=>own(k)))};}
function backup(reason){const r=snapshot(reason);try{requireRecovery().save(r);recoveryNotice='';return r;}finally{recoveryRender();}}
function download(){const u=URL.createObjectURL(new Blob([JSON.stringify(snapshot('download'),null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='Flove_동기화복구_'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function show(keys){conflicts=keys;if(!details)return;details.hidden=!keys.length;keysEl.textContent=keys.join('\n');if(keys.length)status('충돌 '+keys.length+'개 — 자동 덮어쓰기 중단',true);}
/* Server revision observation: session-local; never an applied-data marker. */
function createServerRevisionObserver(){
 let highest=null;
 function observe(response){
  if(!has(response,'revision'))return {status:'missing',observed:highest};
  const revision=response.revision;
  if(!Number.isSafeInteger(revision)||revision<0||Object.is(revision,-0))throw Error('서버 revision 형식 오류 — 응답 적용 중단');
  if(highest!==null&&revision<highest)throw Error('이전 서버 revision 응답 — 응답 적용 중단');
  const status=revision===highest?'same':'advanced';
  highest=revision;return {status,observed:highest};
 }
 return {observe,snapshot:()=>({observed:highest})};
}
const serverRevisionObserver=createServerRevisionObserver();
/* Missing revision preserves legacy protocol-2 handling; no version is inferred. */
async function request(body){const c=new AbortController(),timer=setTimeout(()=>c.abort(),45000);try{const opt={cache:'no-store',signal:c.signal};if(body){opt.method='POST';opt.headers={'Content-Type':'text/plain;charset=UTF-8'};opt.body=JSON.stringify(body);}const r=await fetch(cfg.url||endpoint,opt);if(!r.ok)throw Error('HTTP '+r.status);const p=await r.json();if(!obj(p)||p.protocol!==2||!['success','conflict'].includes(p.result)||!obj(p.data))throw Error(p.message||'서버 V2 응답 오류');for(const[k,v]of Object.entries(p.data))if(own(k))validate(k,v);serverRevisionObserver.observe(p);return p;}finally{clearTimeout(timer);}}
function refresh(keys){if(adapter.refresh)adapter.refresh(keys);}
function restore(old){for(const k of Object.keys(old)){try{if(old[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,old[k]);}catch(_){stopped=true;}}}
async function apply(keys){if(!keys.length)return;backup('before-cloud-apply');const old={};keys.forEach(k=>{old[k]=localStorage.getItem(k);});try{for(const k of keys){const v=val(cloud,k);validate(k,v);if(v===null&&/notes_v\d+$|exam_logs_v\d+$/.test(k))localStorage.setItem(k,'[]');else if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}refresh(keys);}catch(e){restore(old);try{refresh(keys);}catch(_){stopped=true;}throw e;}await remember(Object.fromEntries(keys.map(k=>[k,val(cloud,k)])),cloud);}
/* Stage 2B integration draft. Pending operations are metadata, never study keys. */
function mergeAPI(){
 const api=globalThis.FloveConservativeMerge;
 if(!api||api.version!==1||typeof api.mergeSerialized!=='function')throw Error('병합 모듈 준비 전 — 자동 병합 중단');
 return api;
}
function mergeEndpoint(){return new URL(cfg.url||endpoint).href;}
function mergePendingKey(){return '__flove_sync_merge_pending_v1:'+encodeURIComponent(mergeEndpoint())+':'+cfg.page;}
function runSyncFlow(task){
 const locks=globalThis.navigator&&globalThis.navigator.locks;
 if(!baselineStore||!locks||typeof locks.request!=='function')throw Error('동기화 작업 잠금 준비 전');
 return locks.request(baselineStore.key+':flow-v1',{mode:'exclusive'},task);
}
function validateMergeRecord(record){
 if(!obj(record)||record.format!=='flove-merge-pending-v1'||record.page!==cfg.page||record.endpoint!==mergeEndpoint()||typeof record.settled!=='boolean'||!Array.isArray(record.ops)||!record.ops.length||cfg.readOnly)throw Error('병합 대기 메타데이터 오류');
 const seen=new Set();
 for(const op of record.ops){
  if(!obj(op)||typeof op.key!=='string'||!own(op.key)||seen.has(op.key)||typeof op.baseKnown!=='boolean'||!has(op,'base'))throw Error('병합 대기 항목 오류');
  seen.add(op.key);
  for(const name of ['local','expected','value']){
   if(typeof op[name]!=='string')throw Error('병합 대기 기록 누락');
   validate(op.key,op[name]);
   if(!mergeAPI().mergeSerialized({key:op.key,known:false,local:op[name],remote:op[name]}).ok)throw Error('병합 대기 기록 형식 오류');
  }
  if(op.baseKnown){if(op.base!==null){validate(op.key,op.base);if(!mergeAPI().mergeSerialized({key:op.key,known:false,local:op.base,remote:op.base}).ok)throw Error('병합 대기 기준 오류');}}
  else if(op.base!==null)throw Error('미확인 기준은 비어 있어야 합니다');
 }
 return record;
}
function readMergePending(){
 try{
  const raw=localStorage.getItem(mergePendingKey());if(raw===null)return null;
  return {raw,record:validateMergeRecord(JSON.parse(raw))};
 }catch(error){stopped=true;throw Error('병합 대기 기록 오류 — 원문 유지·자동 동기화 중단: '+error.message);}
}
function writeMergePending(record,expectedRaw){
 try{
  validateMergeRecord(record);const key=mergePendingKey();
  if(localStorage.getItem(key)!==expectedRaw)throw Error('다른 탭에서 병합 대기 기록이 바뀌었습니다');
  const raw=JSON.stringify(record);localStorage.setItem(key,raw);
  if(localStorage.getItem(key)!==raw)throw Error('병합 대기 기록 재읽기 실패');
  return {raw,record:JSON.parse(raw)};
 }catch(error){stopped=true;throw Error('병합 대기 기록 보존 실패 — 추가 처리 중단: '+error.message);}
}
function clearMergePending(pending){
 try{
  const key=mergePendingKey();if(localStorage.getItem(key)!==pending.raw)throw Error('병합 대기 기록이 변경됐습니다');
  localStorage.removeItem(key);if(localStorage.getItem(key)!==null)throw Error('병합 대기 기록 정리 확인 실패');
 }catch(error){stopped=true;throw Error('병합 완료 확인 기록 정리 실패 — 추가 처리 중단: '+error.message);}
}
function mergeInputUnchanged(ops){return ops.every(op=>{const v=localStorage.getItem(op.key);return v===op.local||v===op.value;});}
function mergeBaseCompatible(ops){return ops.every(op=>(has(base,op.key)===op.baseKnown&&val(base,op.key)===op.base)||(has(base,op.key)&&val(base,op.key)===op.value));}
async function applyMergePending(pending,generation){
 const ops=pending.record.ops,keys=ops.map(op=>op.key);
 if(stopped||localSaveFailure||generation!==localSaveGeneration||!idle()||!mergeInputUnchanged(ops))return false;
 if(typeof adapter.refresh!=='function')throw Error('병합 반영 어댑터 준비 전');
 baselineStore.assertCurrent();if(!mergeBaseCompatible(ops))throw Error('병합 대기 기준과 현재 기준이 다릅니다');
 if(ops.some(op=>val(cloud,op.key)!==op.value))throw Error('서버의 병합 결과를 확인하지 못했습니다');
 backup('conflict-auto-apply');
 const old=new Map(keys.map(k=>[k,localStorage.getItem(k)])),attempted=[];
 try{
  for(const op of ops){
   if(localStorage.getItem(op.key)!==old.get(op.key))throw Error('병합 반영 중 기기 기록 변경');
   if(old.get(op.key)!==op.value){attempted.push(op);localStorage.setItem(op.key,op.value);}
   if(localStorage.getItem(op.key)!==op.value)throw Error('병합 반영 재읽기 실패');
  }
  refresh(keys);
  if(ops.some(op=>localStorage.getItem(op.key)!==op.value))throw Error('화면 갱신 중 병합 기록 변경');
 }catch(error){
  let uncertain=false;
  for(const op of attempted.reverse()){
   try{
    const current=localStorage.getItem(op.key),previous=old.get(op.key);
    if(current!==previous){if(current!==op.value)throw Error('새 기기 변경이 있어 원복하지 않습니다');if(previous===null)localStorage.removeItem(op.key);else localStorage.setItem(op.key,previous);}
    if(localStorage.getItem(op.key)!==previous)throw Error('원복 확인 실패');
   }catch(rollbackError){uncertain=true;console.error('[Flove merge rollback]',rollbackError);}
  }
  try{refresh(keys);}catch(_){uncertain=true;}
  stopped=true;
  throw Error('병합 기기 반영 실패 — 복구본·대기 기록 유지'+(uncertain?' (원복 미확인)':'')+': '+error.message);
 }
 await remember(Object.fromEntries(ops.map(op=>[op.key,op.value])),cloud);
 clearMergePending(pending);show([]);
 status(generation===localSaveGeneration&&idle()?'서버 저장 성공 · '+new Date().toLocaleTimeString('ko-KR'):'자동 병합 반영 완료 — 새 기기 변경은 다음 조회에서 확인');
 return true;
}
async function resumeMergePending(pending,generation){
 const ops=pending.record.ops;
 if(stopped||localSaveFailure||generation!==localSaveGeneration)return;
 if(!idle()){show([]);status('자동 병합 반영 대기 — 입력을 저장하거나 취소하세요',true);return;}
 if(!mergeBaseCompatible(ops)){stopped=true;throw Error('병합 대기 기준 불일치 — 원본 유지·재확인 필요');}
 if(ops.every(op=>val(cloud,op.key)===op.value)&&mergeInputUnchanged(ops)){
  await applyMergePending(pending,generation);return;
 }
 backup('conflict-auto-review');
 if(!pending.record.settled){
  show([]);status('병합 저장 결과 미확인 — 기기 원본 유지·자동 재전송 보류',true);return;
 }
 show(ops.map(op=>op.key));
}
async function tryAutoMerge(keys,d,generation){
 if(!idle()||typeof adapter.refresh!=='function')return false;
 const ops=[];
 for(const key of keys){
  const result=mergeAPI().mergeSerialized({key,known:has(base,key),base:val(base,key),local:val(d,key),remote:val(cloud,key)});
  if(!result.ok)continue;
  ops.push({key,expected:val(cloud,key),value:result.value,local:val(d,key),baseKnown:has(base,key),base:val(base,key)});
 }
 if(!ops.length)return false;
 if(stopped||localSaveFailure||generation!==localSaveGeneration||!idle()||ops.some(op=>localStorage.getItem(op.key)!==op.local))return true;
 baselineStore.assertCurrent();if(readMergePending())throw Error('먼저 시작된 병합 대기 기록이 있습니다');
 backup('conflict-auto-merge');
 const writes=ops.filter(op=>op.value!==op.expected).map(op=>({key:op.key,expected:op.expected,value:op.value}));
 let pending=writeMergePending({format:'flove-merge-pending-v1',page:cfg.page,endpoint:mergeEndpoint(),settled:!writes.length,ops},null);
 show([]);
 if(writes.length){
  status('서버 저장 중…');
  let response;
  try{response=await request({protocol:2,ops:writes});}
  catch(error){if(!stopped&&!localSaveFailure)status('병합 저장 결과 확인 대기 — 기기 원본 유지: '+error.message,true);console.error('[Flove automatic merge]',error);return true;}
  if(stopped||localSaveFailure)return true;
  cloud=response.data;
  pending=writeMergePending({...pending.record,settled:true},pending.raw);
  if(response.result==='success'&&writes.some(op=>val(response.data,op.key)!==op.value)){
   stopped=true;throw Error('병합 성공 응답의 저장값 불일치 — 원본·대기 기록 유지');
  }
 }
 await resumeMergePending(pending,generation);return true;
}
/* End stage 2B integration draft. */

async function cycle(force=false){
 if(conflicts.length&&force!==true)return;
 if(busy||stopped||localSaveFailure||!recoveryReady||document.hidden)return;if(!cfg.keys.length&&!cfg.plan){status('타이머: 클라우드 저장 대상 없음');return;}busy=true;const generation=localSaveGeneration;
 try{await runSyncFlow(async()=>{
 if(stopped||localSaveFailure||generation!==localSaveGeneration)return;
 baselineStore.assertCurrent();
 const p=await request();if(stopped||localSaveFailure||generation!==localSaveGeneration)return;if(p.result!=='success')throw Error('서버 조회 성공 확인 실패');baselineStore.assertCurrent();
 cloud=p.data;const pending=readMergePending();if(pending){await resumeMergePending(pending,generation);return;}
 const d=local(),keys=[...new Set([...cfg.keys,...Object.keys(d),...Object.keys(cloud).filter(own),...Object.keys(base).filter(own)])],pull=[],ops=[],bad=[],equal={};
 for(const k of keys){validate(k,val(d,k));const a=decide(has(base,k),val(base,k),val(d,k),val(cloud,k));if(a==='equal'){if(idle())equal[k]=val(cloud,k);}else if(a==='pull')pull.push(k);else if(a==='push')ops.push({key:k,expected:val(cloud,k),value:val(d,k)});else bad.push(k);}
 await remember(equal,cloud);if(stopped||localSaveFailure||generation!==localSaveGeneration)return;
 if(keys.some(k=>localStorage.getItem(k)!==val(d,k)))return;
 if(cfg.readOnly){
  if(cfg.hubStatus){const action=hubActions(pull,ops,bad,idle());if(action.applyKeys.length)await apply(action.applyKeys);if(stopped||localSaveFailure||generation!==localSaveGeneration)return;show([]);renderHub(action.pending);return;}
  if(pull.length&&idle())await apply(pull);if(stopped||localSaveFailure||generation!==localSaveGeneration)return;show([]);status(bad.length||ops.length?'허브: 기록 차이 있음 — 해당 과목에서 확인':'허브 서버 조회 완료');return;
 }
 if(bad.length){
  if(await tryAutoMerge(bad,d,generation)){
   if(stopped||localSaveFailure||generation!==localSaveGeneration||!idle()||readMergePending())return;
   const current=local(),remaining=bad.filter(k=>decide(has(base,k),val(base,k),val(current,k),val(cloud,k))==='conflict');
   if(remaining.length)show(remaining);
   return;
  }
  show(bad);return;
 }
 show([]);if(pull.length){if(!idle()){status('다른 기기 변경 대기 — 입력을 저장하거나 취소하세요',true);return;}await apply(pull);}
 if(stopped||localSaveFailure||generation!==localSaveGeneration)return;
 if(ops.some(o=>localStorage.getItem(o.key)!==o.value))return;
 if(ops.length){
  baselineStore.assertCurrent();status('서버 저장 중…');const s=await request({protocol:2,ops});if(stopped||localSaveFailure||generation!==localSaveGeneration)return;
  if(s.result==='conflict'){cloud=s.data;show(s.keys||ops.map(o=>o.key));return;}
  await remember(Object.fromEntries(ops.map(o=>[o.key,o.value])),s.data);if(stopped||localSaveFailure||generation!==localSaveGeneration)return;status('서버 저장 성공 · '+new Date().toLocaleTimeString('ko-KR'));
 }else{status('동기화 확인 · '+new Date().toLocaleTimeString('ko-KR'));}
 });}catch(e){status((stopped?'동기화 중단: ':'동기화 실패 — 기기 기록 유지: ')+e.message,true);console.error('[Flove Sync V2]',e);}finally{busy=false;}
}
function choiceStatus(message){
 status('충돌 '+conflicts.length+'개 — '+message,true);
 if(!details)return;
 let notice=document.getElementById('flove-sync-choice-status');
 if(!notice){notice=document.createElement('p');notice.id='flove-sync-choice-status';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.style.cssText='flex-basis:100%;margin:6px 0;white-space:pre-wrap';details.appendChild(notice);}
 notice.textContent=message;
}
async function choose(mode){
 if(busy){choiceStatus('다른 동기화 진행 중 — 완료 후 다시 선택해 주세요.');return;}
 if(stopped||localSaveFailure){choiceStatus(localSaveFailure?localSaveFailure.message:'동기화가 중단됐습니다. 원본을 보관한 뒤 새로고침해 주세요.');return;}
 if(cfg.readOnly||!conflicts.length)return;
 if(!idle()){choiceStatus('먼저 입력을 저장하거나 수정을 취소하세요.');return;}
 const keys=conflicts.slice(),d=local();
 if(!confirm(keys.join('\n')+'\n\n'+(mode==='local'?'이 기기 기록으로 서버':'서버 기록으로 이 기기')+'를 교체할까요? 기록 묶음 전체 교체이며 자동 병합이 아닙니다. 양쪽 원본은 교체 전에 보존합니다.'))return;
 busy=true;
 const generation=localSaveGeneration,buttons=details?[...details.querySelectorAll('button')]:[],disabled=buttons.map(b=>b.disabled);
 try{
  buttons.forEach(b=>{b.disabled=true;});choiceStatus('처리 중 — 양쪽 원본 백업 준비…');
  await new Promise(resolve=>setTimeout(resolve,0));
  await runSyncFlow(async()=>{
   if(stopped||localSaveFailure||generation!==localSaveGeneration){choiceStatus('저장 상태가 바뀌어 교체를 중단했습니다.');return;}
   if(!idle()||keys.some(k=>localStorage.getItem(k)!==val(d,k))){choiceStatus('입력 또는 기기 기록이 바뀌어 교체를 중단했습니다.');return;}
   baselineStore.assertCurrent();
   const pending=readMergePending();
   if(pending&&!pending.record.settled){choiceStatus('병합 저장 결과 미확인 — 수동 교체도 보류합니다');return;}
   if(pending&&pending.record.ops.some(op=>!keys.includes(op.key))){choiceStatus('병합 대기 항목 전체를 다시 조회해 주세요');return;}
   backup('conflict-'+mode);
   choiceStatus(mode==='local'?'처리 중 — 기기 기록을 서버에 저장하고 있습니다…':'처리 중 — 서버 최신 기록을 확인하고 있습니다…');
   if(mode==='local'){
    const ops=keys.map(k=>({key:k,expected:val(cloud,k),value:val(d,k)}));ops.forEach(o=>validate(o.key,o.value));
    const p=await request({protocol:2,ops});
    if(stopped||localSaveFailure||generation!==localSaveGeneration){choiceStatus('저장 상태가 바뀌었습니다. 서버 반영 여부를 다시 조회해 확인해 주세요.');return;}
    if(p.result==='conflict'){cloud=p.data;show(p.keys||keys);choiceStatus('서버 기록이 변경됐습니다. 확인 후 다시 선택해 주세요.');return;}
    await remember(Object.fromEntries(ops.map(o=>[o.key,o.value])),p.data);
   }else{
    const p=await request();
    if(stopped||localSaveFailure||generation!==localSaveGeneration){choiceStatus('저장 상태가 바뀌어 교체를 중단했습니다.');return;}
    if(p.result!=='success')throw Error('서버 조회 성공 확인 실패');
    baselineStore.assertCurrent();
    if(!idle()||keys.some(k=>val(local(),k)!==val(d,k))){choiceStatus('입력 또는 기기 기록이 바뀌어 교체를 중단했습니다.');return;}
    if(keys.some(k=>val(p.data,k)!==val(cloud,k))){cloud=p.data;choiceStatus('서버가 다시 바뀌었습니다. 확인 후 다시 선택해 주세요.');return;}
    await apply(keys);
   }
   if(stopped||localSaveFailure||generation!==localSaveGeneration){choiceStatus('저장 상태가 바뀌었습니다. 다시 조회해 확인해 주세요.');return;}
   if(pending)clearMergePending(pending);show([]);status('충돌 선택 적용 완료');
  });
 }catch(e){choiceStatus((stopped?'충돌 처리 중단: ':'충돌 처리 실패 — 원본 유지: ')+e.message);console.error('[Flove Sync conflict]',e);}
 finally{buttons.forEach((b,i)=>{b.disabled=disabled[i];});busy=false;}
 setTimeout(cycle,100);
}
let localSaveFailure=null,localSaveGeneration=0;
function recoverLocalMemory(fault){
 if(localSaveFailure!==fault)return;
 try{
  if(typeof adapter.refresh!=='function')throw Error('화면 기록 재로딩 기능이 없습니다.');
  adapter.refresh(fault.keys);
  if(fault.uncertain)throw Error('기기 저장소 원복을 확인하지 못했습니다.');
  localSaveFailure=null;
  status('기기 저장 실패 — 저장된 기록으로 복원, 입력 유지',true);
 }catch(error){
  stopped=true;
  fault.message='기록 복원 확인 실패 — 추가 저장·동기화 중단. 입력을 별도 보관하고 새로고침해 주세요: '+error.message;
  status(fault.message,true);
  console.error('[Flove local recovery]',error);
 }
}
function storeBatch(values){
 if(localSaveFailure)throw Error(localSaveFailure.message);
 const old=new Map(),attempted=[],keys=[];
 let entries=[];
 try{
  if(!obj(values))throw Error('기기 저장 값 형식 오류');
  entries=Object.entries(values);
  for(const[k,v]of entries){keys.push(k);if(typeof v!=='string')throw Error('기기 저장 값은 문자열이어야 합니다: '+k);validate(k,v);}
  for(const[k]of entries)old.set(k,localStorage.getItem(k));
  for(const[k,v]of entries){attempted.push([k,v]);localStorage.setItem(k,v);}
  for(const[k,v]of entries)if(localStorage.getItem(k)!==v)throw Error('기기 저장 결과 확인 실패: '+k);
  if(entries.length)localSaveGeneration++;
 }catch(error){
  let uncertain=false;
  for(const[k,v]of [...attempted].reverse()){
   try{
    const current=localStorage.getItem(k),previous=old.get(k);
    if(current!==previous){
     if(current!==v)throw Error('다른 탭에서 기록이 바뀌었습니다: '+k);
     if(previous===null)localStorage.removeItem(k);else localStorage.setItem(k,previous);
    }
    if(localStorage.getItem(k)!==previous)throw Error('기기 기록 원복 확인 실패: '+k);
   }catch(rollbackError){uncertain=true;console.error('[Flove local rollback]',rollbackError);}
  }
  dirty=true;localSaveGeneration++;
  const fault={keys:keys.length?[...new Set(keys)]:cfg.keys.slice(),uncertain,message:'기기 저장 실패 — 기록 복원 확인 중. 잠시 후 다시 시도해 주세요.'};
  localSaveFailure=fault;
  status(fault.message,true);
  // Run after callers finish their own catch/rollback blocks.
  queueMicrotask(()=>recoverLocalMemory(fault));
  alert('기기 저장 실패: '+error.message+(uncertain?'\n저장소 원복을 확인하지 못했습니다. 추가 저장·동기화를 중단합니다. 입력을 별도 보관하고 새로고침해 주세요.':'\n저장된 기록을 다시 읽어 화면 상태를 복원합니다. 작성 중인 입력은 유지합니다.'));
  throw error;
 }
}
function saved(){if(localSaveFailure){status(localSaveFailure.message,true);return;}localSaveGeneration++;dirty=false;setTimeout(cycle,100);}
function resetPlan(){if(!confirm('계획표 기록만 초기화할까요? 다른 과목은 삭제하지 않습니다.'))return;try{backup('before-plan-reset');const old={},keys=Object.keys(local()).filter(planKey);keys.forEach(k=>{old[k]=localStorage.getItem(k);});try{keys.forEach(k=>localStorage.removeItem(k));}catch(e){restore(old);throw e;}refresh(keys);saved();}catch(e){status('초기화 실패: '+e.message,true);}}
async function boot(){
 const box=document.createElement('section');box.id='flove-sync-v2-panel';Object.assign(box.style,{position:'relative',zIndex:'10000',margin:'12px',padding:'12px',border:'1px solid #cbd5e1',borderRadius:'12px',background:'#fff',color:'#0f172a',fontSize:'13px'});label=document.createElement('div');box.appendChild(label);status('서버 연결 확인 중…');
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;Object.assign(b.style,{margin:'6px',padding:'6px',border:'1px solid #cbd5e1',borderRadius:'6px',color:'#0f172a',background:'#f8fafc'});b.addEventListener('click',fn);return b;};
 box.append(button('다시 조회',()=>cycle(true)),button('양쪽 원본 내려받기',()=>{try{download();}catch(e){alert(e.message);}}));details=document.createElement('div');details.hidden=true;keysEl=document.createElement('pre');keysEl.style.whiteSpace='pre-wrap';details.append(keysEl,button('서버 기록 사용',()=>choose('cloud')),button('이 기기 기록 사용',()=>choose('local')));box.appendChild(details);if(cfg.readOnly&&cfg.hubStatus){hubLinks=document.createElement('nav');hubLinks.setAttribute('aria-label','확인이 필요한 학습 화면');hubLinks.hidden=true;box.appendChild(hubLinks);}document.body.prepend(box);
 try{if(cfg.keys.length||cfg.plan){baselineStore=createPersistentBaseline({storage:localStorage,locks:globalThis.navigator&&globalThis.navigator.locks,page:cfg.page,server:cfg.url||endpoint,owns:own,check:validate});base=baselineStore.load();}}catch(e){stopped=true;status('기준 데이터 오류 — 자동 저장 중단: '+e.message,true);return;}
 const track=e=>{if(cfg.plan||!e.target.closest||!e.target.closest('form,#tab-record')||/search|filter|sort/i.test(e.target.id||''))return;dirty=true;};document.addEventListener('input',track,true);document.addEventListener('change',track,true);document.addEventListener('reset',()=>setTimeout(()=>{dirty=false;},0),true);
 try{status('복구본 관리 준비 중…');await loadRecovery();}catch(e){stopped=true;status('복구본 관리 준비 실패 — 자동 동기화 중단: '+e.message,true);return;}
 try{mountRecovery(box);}catch(e){console.warn('[Flove Recovery UI]',e);}
 maintainRecovery();status('서버 연결 확인 중…');
 window.addEventListener('storage',e=>{if(e.key===null||(e.key&&own(e.key)))localSaveGeneration++;if(baselineStore&&(e.key===null||e.key===baselineStore.key)){stopped=true;status('기준 데이터 변경 — 새로고침 후 동기화 재확인 필요',true);return;}if(e.key&&own(e.key)&&idle()){try{refresh([e.key]);}catch(err){status('다른 탭 갱신 실패: '+err.message,true);}}});document.addEventListener('visibilitychange',()=>{if(!document.hidden)cycle();});window.addEventListener('online',cycle);setInterval(cycle,10000);setTimeout(cycle,0);
}
window.FloveSync={register:a=>{adapter=a;},markSaved:saved,saveLocal:(k,v)=>storeBatch({[k]:v}),saveBatch:storeBatch,validateData:validate,backupCurrent:backup,readArray:(k,fallback=[])=>{const v=localStorage.getItem(k);if(v===null)return fallback;validate(k,v);return JSON.parse(v);},resetPlan,retry:()=>cycle(true),_test:{decide,validate,createPersistentBaseline}};
window.addEventListener('error',e=>{if(/quota|storage|저장|형식|JSON|parse/i.test(String(e.message))){stopped=true;status('앱 데이터 오류 — 자동 동기화 중단: '+e.message,true);}});document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));
})();

/* Daily welcome loader; the synchronization logic above is unchanged. */
(() => {
  if (window.top !== window.self) return;
  const script = document.createElement('script');
  script.src = new URL('daily-welcome.js?v=1.0.0', document.currentScript.src).href;
  script.onerror = () => console.warn('[Flove] Daily welcome could not be loaded; study tools remain available.');
  document.head.appendChild(script);
})();

/* Opt-in compact hub presentation; subject screens keep their current panel. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='index'||!cfg.readOnly||!cfg.hubStatus)return;
  const script=document.createElement('script');
  script.src=new URL('hub-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Hub UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for math only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='math'||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('math-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Math UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for Korean only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='korean'||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('korean-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Korean UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for English only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='eng'||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('eng-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove English UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for Ethics only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='sang'||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('sang-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Ethics UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for Samun only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='samun'||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('samun-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Samun UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Pilot: compact sync presentation for Planner only. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='plan'||!cfg.plan||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('plan-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Planner UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();

/* Timer-only notice: no cloud synchronization controls. */
(() => {
  const cfg=window.FLOVE_SYNC_CONFIG||{};
  if(cfg.page!=='timer'||!Array.isArray(cfg.keys)||cfg.keys.length||cfg.plan||cfg.readOnly)return;
  const script=document.createElement('script');
  script.src=new URL('timer-sync-glass.js?v=1.0.0',document.currentScript.src).href;
  script.onerror=()=>console.warn('[Flove Timer UI] Keeping original sync panel.');
  document.head.appendChild(script);
})();


/* Stage 2A: pure, conservative record-set merge. No storage, DOM, or network. */
(function(root){
'use strict';
const keys=new Set(['saegibun_notes_v3','math_review_notes_v3','english_exam_logs_v14','liv_ethic_notes_v11','samun_notes_v1']);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const compare=(a,b)=>a<b?-1:a>b?1:0;
function stable(x,depth=0){
 if(depth>64)throw Error('NESTING_LIMIT');
 if(x===null||typeof x==='string'||typeof x==='boolean')return JSON.stringify(x);
 if(typeof x==='number'&&Number.isFinite(x))return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(y=>stable(y,depth+1)).join(',')+']';
 if(object(x))return '{'+Object.keys(x).sort(compare).map(k=>JSON.stringify(k)+':'+stable(x[k],depth+1)).join(',')+'}';
 throw Error('NON_JSON_VALUE');
}
function parse(raw){
 if(typeof raw!=='string')throw Error('MISSING_RECORD_SET');
 const records=JSON.parse(raw);
 if(!Array.isArray(records))throw Error('INVALID_RECORD_SET');
 const map=new Map(),texts=new Map(),ids=[];
 for(const record of records){
  if(!object(record)||!has(record,'id'))throw Error('INVALID_RECORD');
  const id=record.id;
  if(!((typeof id==='number'&&Number.isSafeInteger(id)&&!Object.is(id,-0))||(typeof id==='string'&&id.length>0&&id.trim()===id)))throw Error('INVALID_ID');
  const k=String(id);if(map.has(k))throw Error('DUPLICATE_ID');
  for(const f of ['content','title','originalText','unit','category','importance'])if(has(record,f)&&record[f]!==null&&typeof record[f]!=='string')throw Error('INVALID_FIELD');
  for(const f of ['vocabs','wrongQuestions','corrections'])if(has(record,f)&&(!Array.isArray(record[f])||record[f].some(x=>!object(x))))throw Error('INVALID_CHILDREN');
  texts.set(k,stable(record));map.set(k,record);ids.push(k);
 }
 return {records,map,texts,ids};
}
function fail(code,conflicts=[]){return {ok:false,code,value:null,conflicts};}
function ordered(selected,b,l,r){
 const common=b.ids.filter(id=>selected.has(id)&&l.map.has(id)&&r.map.has(id));
 const old=new Set(common),project=ids=>ids.filter(id=>old.has(id));
 const bo=common,lo=project(l.ids),ro=project(r.ids),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const lc=!same(lo,bo),rc=!same(ro,bo);
 if(lc&&rc&&!same(lo,ro))return null;
 const skeleton=lc?lo:rc?ro:bo;
 const edges=new Map([...selected.keys()].map(id=>[id,new Set()])),degree=new Map([...selected.keys()].map(id=>[id,0]));
 function edge(a,z){if(a===z||edges.get(a).has(z))return;edges.get(a).add(z);degree.set(z,degree.get(z)+1);}
 for(let i=1;i<skeleton.length;i++)edge(skeleton[i-1],skeleton[i]);
 for(const list of [l.ids,r.ids]){
  const ids=list.filter(id=>selected.has(id));
  for(let i=1;i<ids.length;i++)if(!b.map.has(ids[i-1])||!b.map.has(ids[i]))edge(ids[i-1],ids[i]);
 }
 const heap=[];
 function push(x){let i=heap.length;heap.push(x);while(i>0){const p=(i-1)>>1;if(compare(heap[p],x)<=0)break;heap[i]=heap[p];i=p;}heap[i]=x;}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(2*i+1<heap.length){let child=2*i+1;if(child+1<heap.length&&compare(heap[child+1],heap[child])<0)child++;if(compare(last,heap[child])<=0)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;}
 for(const[id,n]of degree)if(n===0)push(id);
 const result=[];
 while(heap.length){const id=pop();result.push(selected.get(id));for(const next of edges.get(id)){const n=degree.get(next)-1;degree.set(next,n);if(n===0)push(next);}}
 return result.length===selected.size?result:null;
}
function mergeSerialized(input){
 try{
  if(!object(input)||typeof input.known!=='boolean'||!has(input,'local')||!has(input,'remote')||(input.known&&!has(input,'base')))return fail('INVALID_ARGUMENT');
  if(!keys.has(input.key))return fail('UNSUPPORTED_KEY');
  const l=parse(input.local),r=parse(input.remote);
  const b=input.known?(input.base===null?parse('[]'):parse(input.base)):null;
  if(stable(l.records)===stable(r.records))return {ok:true,code:'EQUAL',value:stable(l.records),conflicts:[],stats:{records:l.records.length,addedToLocal:0,addedToRemote:0}};
  if(!b)return fail('MISSING_BASELINE');
  const ids=[...new Set([...b.ids,...l.ids,...r.ids])].sort(compare),selected=new Map(),conflicts=[];
  for(const id of ids){
   const bv=b.map.get(id),lv=l.map.get(id),rv=r.map.get(id),variants=[bv,lv,rv].filter(x=>x!==undefined);
   if(variants.some(x=>typeof x.id!==typeof variants[0].id)){conflicts.push({id,reason:'ID_TYPE_MISMATCH'});continue;}
   if(bv!==undefined&&(lv===undefined)!==(rv===undefined)){conflicts.push({id,reason:'DELETION_REQUIRES_REVIEW'});continue;}
   if(lv===undefined&&rv===undefined)continue;
   if(lv===undefined){selected.set(id,rv);continue;}
   if(rv===undefined){selected.set(id,lv);continue;}
   const bt=b.texts.get(id),lt=l.texts.get(id),rt=r.texts.get(id);
   if(lt===rt)selected.set(id,lv);
   else if(bv!==undefined&&lt===bt)selected.set(id,rv);
   else if(bv!==undefined&&rt===bt)selected.set(id,lv);
   else conflicts.push({id,reason:bv===undefined?'NEW_ID_COLLISION':'CONCURRENT_EDIT'});
  }
  if(conflicts.length)return fail('REVIEW_REQUIRED',conflicts);
  const records=ordered(selected,b,l,r);
  if(records===null)return fail('ORDER_CONFLICT',[{id:null,reason:'INCOMPATIBLE_ORDER'}]);
  return {ok:true,code:'MERGED',value:stable(records),conflicts:[],stats:{records:records.length,addedToLocal:records.filter(x=>!l.map.has(String(x.id))).length,addedToRemote:records.filter(x=>!r.map.has(String(x.id))).length}};
 }catch(error){return fail('INVALID_DATA',[{id:null,reason:error instanceof SyntaxError?'INVALID_JSON':String(error&&error.message||error)}]);}
}
const api=Object.freeze({version:1,mergeSerialized});
if(typeof module==='object'&&module.exports)module.exports=api;
else root.FloveConservativeMerge=api;
})(typeof globalThis==='object'?globalThis:this);


