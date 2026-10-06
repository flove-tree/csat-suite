/* Flove protocol-2 sync. Public client code: do not store OAuth tokens here. */
(() => {
'use strict';
const endpoint='https://script.google.com/macros/s/AKfycbzf5zZG53ArO38Y9pYUQi4uBTLCvf8x1qLH5_CHSJRMXabslHh17XbnYo8xxE6ntPZR/exec';
const cfg=window.FLOVE_SYNC_CONFIG||{page:'none',keys:[]};
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),val=(o,k)=>has(o,k)?o[k]:null;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const planKey=k=>/^\d{4}-\d{2}-\d{2}-[A-Za-z0-9_-]+$/.test(k)||/^rolled-id-\d+-\d+$/.test(k)||/^flove-rolled-\d{4}-\d{2}-\d{2}$/.test(k)||['flove-active-preset','flove-custom-hex','flove-last-save'].includes(k);
const own=k=>cfg.keys.includes(k)||(cfg.plan&&planKey(k));
const meta='__flove_sync_base_v2_'+cfg.page;
let base={},cloud={},adapter={},busy=false,dirty=false,stopped=false,conflicts=[],label,details,keysEl;
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
function status(s,bad=false){if(label){label.textContent=s;label.style.color=bad?'#b91c1c':'#166534';}}
function remember(){sessionStorage.setItem(meta,JSON.stringify(base));}
function snapshot(reason){return {format:'flove-sync-recovery-v2',createdAt:new Date().toISOString(),reason,page:cfg.page,local:local(),cloud:Object.fromEntries(Object.entries(cloud).filter(([k])=>own(k)))};}
function backup(reason){const r=snapshot(reason);localStorage.setItem('__flove_sync_recovery_'+Date.now()+'_'+Math.random().toString(36).slice(2),JSON.stringify(r));return r;}
function download(){const u=URL.createObjectURL(new Blob([JSON.stringify(snapshot('download'),null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='Flove_동기화복구_'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function show(keys){conflicts=keys;if(!details)return;details.hidden=!keys.length;keysEl.textContent=keys.join('\n');if(keys.length)status('충돌 '+keys.length+'개 — 자동 덮어쓰기 중단',true);}
async function request(body){const c=new AbortController(),timer=setTimeout(()=>c.abort(),45000);try{const opt={cache:'no-store',signal:c.signal};if(body){opt.method='POST';opt.headers={'Content-Type':'text/plain;charset=UTF-8'};opt.body=JSON.stringify(body);}const r=await fetch(cfg.url||endpoint,opt);if(!r.ok)throw Error('HTTP '+r.status);const p=await r.json();if(!obj(p)||p.protocol!==2||!['success','conflict'].includes(p.result)||!obj(p.data))throw Error(p.message||'서버 V2 응답 오류');for(const[k,v]of Object.entries(p.data))if(own(k))validate(k,v);return p;}finally{clearTimeout(timer);}}
function refresh(keys){if(adapter.refresh)adapter.refresh(keys);}
function restore(old){for(const k of Object.keys(old)){try{if(old[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,old[k]);}catch(_){stopped=true;}}}
function apply(keys){if(!keys.length)return;backup('before-cloud-apply');const old={};keys.forEach(k=>{old[k]=localStorage.getItem(k);});try{for(const k of keys){const v=val(cloud,k);validate(k,v);if(v===null&&/notes_v\d+$|exam_logs_v\d+$/.test(k))localStorage.setItem(k,'[]');else if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}refresh(keys);}catch(e){restore(old);try{refresh(keys);}catch(_){stopped=true;}throw e;}keys.forEach(k=>{base[k]=val(cloud,k);});remember();}
async function cycle(){
 if(busy||stopped||document.hidden)return;if(!cfg.keys.length&&!cfg.plan){status('타이머: 클라우드 저장 대상 없음');return;}busy=true;
 try{const p=await request();cloud=p.data;const d=local(),keys=[...new Set([...Object.keys(d),...Object.keys(cloud).filter(own),...Object.keys(base).filter(own)])],pull=[],ops=[],bad=[];
 for(const k of keys){validate(k,val(d,k));const a=decide(has(base,k),val(base,k),val(d,k),val(cloud,k));if(a==='equal'){if(idle())base[k]=val(cloud,k);}else if(a==='pull')pull.push(k);else if(a==='push')ops.push({key:k,expected:val(cloud,k),value:val(d,k)});else bad.push(k);}
 if(cfg.readOnly){if(pull.length&&idle())apply(pull);remember();show([]);status(bad.length||ops.length?'허브: 기록 차이 있음 — 해당 과목에서 확인':'허브 서버 조회 완료');return;}
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
function boot(){
 const box=document.createElement('section');box.id='flove-sync-v2-panel';Object.assign(box.style,{position:'relative',zIndex:'10000',margin:'12px',padding:'12px',border:'1px solid #cbd5e1',borderRadius:'12px',background:'#fff',color:'#0f172a',fontSize:'13px'});label=document.createElement('div');box.appendChild(label);status('서버 연결 확인 중…');
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;Object.assign(b.style,{margin:'6px',padding:'6px',border:'1px solid #cbd5e1',borderRadius:'6px',color:'#0f172a',background:'#f8fafc'});b.addEventListener('click',fn);return b;};
 box.append(button('다시 조회',cycle),button('양쪽 원본 내려받기',()=>{try{download();}catch(e){alert(e.message);}}));details=document.createElement('div');details.hidden=true;keysEl=document.createElement('pre');keysEl.style.whiteSpace='pre-wrap';details.append(keysEl,button('서버 기록 사용',()=>choose('cloud')),button('이 기기 기록 사용',()=>choose('local')));box.appendChild(details);document.body.prepend(box);
 try{const raw=sessionStorage.getItem(meta);if(raw!==null){base=JSON.parse(raw);if(!obj(base))throw Error('기준 데이터 손상');}}catch(e){stopped=true;status('기준 데이터 오류 — 자동 저장 중단',true);return;}
 const track=e=>{if(cfg.plan||!e.target.closest||!e.target.closest('form,#tab-record')||/search|filter|sort/i.test(e.target.id||''))return;dirty=true;};document.addEventListener('input',track,true);document.addEventListener('change',track,true);document.addEventListener('reset',()=>setTimeout(()=>{dirty=false;},0),true);
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
