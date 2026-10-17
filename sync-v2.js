/* Flove protocol-2 sync. Public client code: do not store OAuth tokens here. */
(() => {
'use strict';
const endpoint='https://script.google.com/macros/s/AKfycbzf5zZG53ArO38Y9pYUQi4uBTLCvf8x1qLH5_CHSJRMXabslHh17XbnYo8xxE6ntPZR/exec';
const cfg=window.FLOVE_SYNC_CONFIG||{page:'none',keys:[]};
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),val=(o,k)=>has(o,k)?o[k]:null;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const planKey=k=>/^\d{4}-\d{2}-\d{2}-[A-Za-z0-9_-]+$/.test(k)||/^rolled-id-\d+-\d+$/.test(k)||/^flove-rolled-\d{4}-\d{2}-\d{2}$/.test(k)||['flove-active-preset','flove-custom-hex','flove-last-save'].includes(k);
const own=k=>cfg.keys.includes(k)||(cfg.plan&&planKey(k))||(cfg.readOnly&&cfg.hubStatus&&cfg.inspectPlan&&planKey(k));
const meta='__flove_sync_base_v2_'+cfg.page;
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
function idle(){return !dirty&&(!adapter.editing||!adapter.editing());}
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
function remember(){sessionStorage.setItem(meta,JSON.stringify(base));}
function snapshot(reason){return {format:'flove-sync-recovery-v2',createdAt:new Date().toISOString(),reason,page:cfg.page,local:local(),cloud:Object.fromEntries(Object.entries(cloud).filter(([k])=>own(k)))};}
function backup(reason){const r=snapshot(reason);try{requireRecovery().save(r);recoveryNotice='';return r;}finally{recoveryRender();}}
function download(){const u=URL.createObjectURL(new Blob([JSON.stringify(snapshot('download'),null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='Flove_동기화복구_'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function show(keys){conflicts=keys;if(!details)return;details.hidden=!keys.length;keysEl.textContent=keys.join('\n');if(keys.length)status('충돌 '+keys.length+'개 — 자동 덮어쓰기 중단',true);}
async function request(body){const c=new AbortController(),timer=setTimeout(()=>c.abort(),45000);try{const opt={cache:'no-store',signal:c.signal};if(body){opt.method='POST';opt.headers={'Content-Type':'text/plain;charset=UTF-8'};opt.body=JSON.stringify(body);}const r=await fetch(cfg.url||endpoint,opt);if(!r.ok)throw Error('HTTP '+r.status);const p=await r.json();if(!obj(p)||p.protocol!==2||!['success','conflict'].includes(p.result)||!obj(p.data))throw Error(p.message||'서버 V2 응답 오류');for(const[k,v]of Object.entries(p.data))if(own(k))validate(k,v);return p;}finally{clearTimeout(timer);}}
function refresh(keys){if(adapter.refresh)adapter.refresh(keys);}
function restore(old){for(const k of Object.keys(old)){try{if(old[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,old[k]);}catch(_){stopped=true;}}}
function apply(keys){if(!keys.length)return;backup('before-cloud-apply');const old={};keys.forEach(k=>{old[k]=localStorage.getItem(k);});try{for(const k of keys){const v=val(cloud,k);validate(k,v);if(v===null&&/notes_v\d+$|exam_logs_v\d+$/.test(k))localStorage.setItem(k,'[]');else if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}refresh(keys);}catch(e){restore(old);try{refresh(keys);}catch(_){stopped=true;}throw e;}keys.forEach(k=>{base[k]=val(cloud,k);});remember();}
async function cycle(){
 if(busy||stopped||!recoveryReady||document.hidden)return;if(!cfg.keys.length&&!cfg.plan){status('타이머: 클라우드 저장 대상 없음');return;}busy=true;
 try{const p=await request();cloud=p.data;const d=local(),keys=[...new Set([...Object.keys(d),...Object.keys(cloud).filter(own),...Object.keys(base).filter(own)])],pull=[],ops=[],bad=[];
 for(const k of keys){validate(k,val(d,k));const a=decide(has(base,k),val(base,k),val(d,k),val(cloud,k));if(a==='equal'){if(idle())base[k]=val(cloud,k);}else if(a==='pull')pull.push(k);else if(a==='push')ops.push({key:k,expected:val(cloud,k),value:val(d,k)});else bad.push(k);}
 if(cfg.readOnly){
  if(cfg.hubStatus){const action=hubActions(pull,ops,bad,idle());if(action.applyKeys.length)apply(action.applyKeys);remember();show([]);renderHub(action.pending);return;}
  if(pull.length&&idle())apply(pull);remember();show([]);status(bad.length||ops.length?'허브: 기록 차이 있음 — 해당 과목에서 확인':'허브 서버 조회 완료');return;
 }
 show(bad);if(bad.length)return;if(pull.length){if(!idle()){status('다른 기기 변경 대기 — 입력을 저장하거나 취소하세요',true);return;}apply(pull);}
 if(ops.length){status('서버 저장 중…');const s=await request({protocol:2,ops});if(s.result==='conflict'){cloud=s.data;show(s.keys||ops.map(o=>o.key));return;}ops.forEach(o=>{base[o.key]=o.value;});remember();status('서버 저장 성공 · '+new Date().toLocaleTimeString('ko-KR'));}else{remember();status('동기화 확인 · '+new Date().toLocaleTimeString('ko-KR'));}
 }catch(e){status('동기화 실패 — 기기 기록 유지: '+e.message,true);console.error('[Flove Sync V2]',e);}finally{busy=false;}
}
async function choose(mode){
 if(busy||cfg.readOnly||!conflicts.length)return;if(!idle()){alert('먼저 입력을 저장하거나 수정을 취소하세요.');return;}
 const keys=conflicts.slice(),d=local();if(!confirm(keys.join('\n')+'\n\n'+(mode==='local'?'이 기기 기록으로 서버':'서버 기록으로 이 기기')+'를 교체할까요? 기록 묶음 전체 교체이며 자동 병합이 아닙니다. 양쪽 원본은 교체 전에 보존합니다.'))return;
 busy=true;try{backup('conflict-'+mode);if(mode==='local'){const ops=keys.map(k=>({key:k,expected:val(cloud,k),value:val(d,k)}));ops.forEach(o=>validate(o.key,o.value));const p=await request({protocol:2,ops});if(p.result==='conflict'){cloud=p.data;show(p.keys||keys);return;}ops.forEach(o=>{base[o.key]=o.value;});remember();}
 else{const p=await request();if(!idle()||keys.some(k=>val(local(),k)!==val(d,k))){status('입력 또는 기기 기록이 바뀌어 교체를 중단했습니다',true);return;}if(keys.some(k=>val(p.data,k)!==val(cloud,k))){cloud=p.data;status('서버가 다시 바뀌었습니다. 다시 조회 후 선택하세요',true);return;}apply(keys);}show([]);status('충돌 선택 적용 완료');
 }catch(e){status('충돌 처리 실패 — 원본 유지: '+e.message,true);}finally{busy=false;}setTimeout(cycle,100);
}
function storeBatch(values){const old={};Object.keys(values).forEach(k=>{old[k]=localStorage.getItem(k);});try{Object.entries(values).forEach(([k,v])=>localStorage.setItem(k,v));}catch(e){restore(old);try{refresh(Object.keys(old));}catch(_){}status('기기 저장 실패 — 입력 유지',true);alert('기기 저장 실패: '+e.message);throw e;}}
function saved(){dirty=false;setTimeout(cycle,100);}
function resetPlan(){if(!confirm('계획표 기록만 초기화할까요? 다른 과목은 삭제하지 않습니다.'))return;try{backup('before-plan-reset');const old={},keys=Object.keys(local()).filter(planKey);keys.forEach(k=>{old[k]=localStorage.getItem(k);});try{keys.forEach(k=>localStorage.removeItem(k));}catch(e){restore(old);throw e;}refresh(keys);saved();}catch(e){status('초기화 실패: '+e.message,true);}}
async function boot(){
 const box=document.createElement('section');box.id='flove-sync-v2-panel';Object.assign(box.style,{position:'relative',zIndex:'10000',margin:'12px',padding:'12px',border:'1px solid #cbd5e1',borderRadius:'12px',background:'#fff',color:'#0f172a',fontSize:'13px'});label=document.createElement('div');box.appendChild(label);status('서버 연결 확인 중…');
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;Object.assign(b.style,{margin:'6px',padding:'6px',border:'1px solid #cbd5e1',borderRadius:'6px',color:'#0f172a',background:'#f8fafc'});b.addEventListener('click',fn);return b;};
 box.append(button('다시 조회',cycle),button('양쪽 원본 내려받기',()=>{try{download();}catch(e){alert(e.message);}}));details=document.createElement('div');details.hidden=true;keysEl=document.createElement('pre');keysEl.style.whiteSpace='pre-wrap';details.append(keysEl,button('서버 기록 사용',()=>choose('cloud')),button('이 기기 기록 사용',()=>choose('local')));box.appendChild(details);if(cfg.readOnly&&cfg.hubStatus){hubLinks=document.createElement('nav');hubLinks.setAttribute('aria-label','확인이 필요한 학습 화면');hubLinks.hidden=true;box.appendChild(hubLinks);}document.body.prepend(box);
 try{const raw=sessionStorage.getItem(meta);if(raw!==null){base=JSON.parse(raw);if(!obj(base))throw Error('기준 데이터 손상');}}catch(e){stopped=true;status('기준 데이터 오류 — 자동 저장 중단',true);return;}
 const track=e=>{if(cfg.plan||!e.target.closest||!e.target.closest('form,#tab-record')||/search|filter|sort/i.test(e.target.id||''))return;dirty=true;};document.addEventListener('input',track,true);document.addEventListener('change',track,true);document.addEventListener('reset',()=>setTimeout(()=>{dirty=false;},0),true);
 try{status('복구본 관리 준비 중…');await loadRecovery();}catch(e){stopped=true;status('복구본 관리 준비 실패 — 자동 동기화 중단: '+e.message,true);return;}
 try{mountRecovery(box);}catch(e){console.warn('[Flove Recovery UI]',e);}
 maintainRecovery();status('서버 연결 확인 중…');
 window.addEventListener('storage',e=>{if(e.key&&own(e.key)&&idle()){try{refresh([e.key]);}catch(err){status('다른 탭 갱신 실패: '+err.message,true);}}});document.addEventListener('visibilitychange',()=>{if(!document.hidden)cycle();});window.addEventListener('online',cycle);setInterval(cycle,10000);setTimeout(cycle,0);
}
window.FloveSync={register:a=>{adapter=a;},markSaved:saved,saveLocal:(k,v)=>storeBatch({[k]:v}),saveBatch:storeBatch,validateData:validate,backupCurrent:backup,readArray:(k,fallback=[])=>{const v=localStorage.getItem(k);if(v===null)return fallback;validate(k,v);return JSON.parse(v);},resetPlan,retry:cycle,_test:{decide,validate}};
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
