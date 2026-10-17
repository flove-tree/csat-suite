/* Flove recovery backups v1. No network requests or study-data writes. */
(() => {
'use strict';
function create(storage,validateValue){
 const PREFIX='__flove_sync_recovery_',MANAGED=PREFIX+'managed_v1_';
 const COUNT=8,BYTES=1048576,GRACE=60000,AGE=604800000,KEEP=2,BATCH=20;
 const pageKeys={math:['math_review_notes_v3'],korean:['saegibun_notes_v3'],eng:['english_exam_logs_v14'],sang:['liv_ethic_notes_v11','liv_ethic_layout_v11'],samun:['samun_notes_v1']};
 let serial=0,warning='';
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const dataMap=x=>object(x)&&Object.values(x).every(v=>v===null||typeof v==='string');
 const valid=x=>object(x)&&x.format==='flove-sync-recovery-v2'&&typeof x.page==='string'&&x.page.length>0&&typeof x.reason==='string'&&typeof x.createdAt==='string'&&Number.isFinite(Date.parse(x.createdAt))&&dataMap(x.local)&&dataMap(x.cloud);
 const kind=x=>['before-cloud-apply','recovery-maintenance'].includes(x.reason)?'auto':'protected';
 const pairs=x=>Object.keys(x).sort().map(k=>[k,x[k]]);
 const identity=x=>JSON.stringify([x.page,x.reason,pairs(x.local),pairs(x.cloud)]);
 const compare=(a,b)=>Date.parse(a.record.createdAt)-Date.parse(b.record.createdAt)||a.key.localeCompare(b.key);
 const planKey=k=>/^\d{4}-\d{2}-\d{2}-[A-Za-z0-9_-]+$/.test(k)||/^rolled-id-\d+-\d+$/.test(k)||/^flove-rolled-\d{4}-\d{2}-\d{2}$/.test(k)||['flove-active-preset','flove-custom-hex','flove-last-save'].includes(k);
 function payloadSafe(r){try{if(typeof validateValue==='function')for(const values of [r.local,r.cloud])for(const [k,v]of Object.entries(values))validateValue(k,v);return true;}catch(_){return false;}}
 function legacySafe(key,r){
  const match=key.match(/^__flove_sync_recovery_(\d{13})_[a-z0-9]+$/);
  if(!match||!valid(r)||r.reason!=='before-cloud-apply'||own(r,'recoveryPolicy')||typeof validateValue!=='function')return false;
  if(new Date(r.createdAt).toISOString()!==r.createdAt||Math.abs(Number(match[1])-Date.parse(r.createdAt))>GRACE)return false;
  if(!own(pageKeys,r.page)&&!['index','plan'].includes(r.page))return false;
  const allowed=k=>r.page==='plan'?planKey(k):r.page==='index'?(Object.values(pageKeys).flat().includes(k)||planKey(k)):pageKeys[r.page].includes(k);
  try{for(const values of [r.local,r.cloud])for(const [k,v]of Object.entries(values)){if(!allowed(k))return false;validateValue(k,v);}}catch(_){return false;}
  return true;
 }
 function inventory(includeOther=false){
  const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key!==null)keys.push(key);}
  const all=[];
  for(const key of [...new Set(keys)]){
   const recovery=key.startsWith(PREFIX);if(!includeOther&&!recovery)continue;
   const raw=storage.getItem(key);if(raw===null)continue;
   let record=null,managed=false;
   if(recovery){try{record=JSON.parse(raw);}catch(_){}managed=key.startsWith(MANAGED)&&valid(record)&&payloadSafe(record)&&object(record.recoveryPolicy)&&record.recoveryPolicy.version===1&&record.recoveryPolicy.kind===kind(record);}
   all.push({key,raw,record,recovery,managed,legacy:recovery&&legacySafe(key,record),bytes:2*(key.length+raw.length)});
  }
  return all;
 }
 const autos=all=>all.filter(e=>e.managed&&e.record.recoveryPolicy.kind==='auto');
 function legacyCandidates(all){
  const list=all.filter(e=>e.legacy).sort(compare),keep=new Set(),counts=new Map();
  for(const e of [...list].reverse()){const n=counts.get(e.record.page)||0;if(n<KEEP)keep.add(e.key);counts.set(e.record.page,n+1);}
  return list.filter(e=>!keep.has(e.key)&&Date.now()-Date.parse(e.record.createdAt)>=AGE);
 }
 function trimLegacy(anchor,raw){
  const candidates=legacyCandidates(inventory());
  for(const e of candidates.slice(0,BATCH)){
   if(storage.getItem(anchor)!==raw){warning='검증한 복구본이 변경되어 기존 복구본 정리를 중단했습니다.';return;}
   if(storage.getItem(e.key)!==e.raw)continue;
   storage.removeItem(e.key);
   if(storage.getItem(e.key)!==null){warning='기존 일반 복구본 일부를 정리하지 못했습니다.';return;}
  }
  if(candidates.length>BATCH)warning='기존 일반 복구본은 한 번에 20개씩 정리합니다. 다음 정리 때 이어서 진행합니다.';
 }
 function trimManaged(anchor,raw){
  const skipped=new Set();let remaining=BATCH;
  while(remaining-->0){
   if(storage.getItem(anchor)!==raw){warning='검증한 복구본이 변경되어 자동 정리를 중단했습니다.';return;}
   const list=autos(inventory()).sort(compare),counts=new Map(),latest=new Map();
   for(const e of list){counts.set(e.record.page,(counts.get(e.record.page)||0)+1);latest.set(e.record.page,e.key);}
   const overBytes=list.reduce((n,e)=>n+e.bytes,0)>BYTES;
   if(!overBytes&&![...counts.values()].some(n=>n>COUNT))return;
   const e=list.find(e=>e.key!==anchor&&!skipped.has(e.key)&&latest.get(e.record.page)!==e.key&&Date.now()-Date.parse(e.record.createdAt)>=GRACE&&(overBytes||counts.get(e.record.page)>COUNT));
   if(!e){warning='화면별 최신 복구본과 최근 1분 복구본을 보호하여 일반 복구본 보관 목표를 초과했습니다.';return;}
   skipped.add(e.key);
   if(storage.getItem(anchor)!==raw||storage.getItem(e.key)!==e.raw)continue;
   storage.removeItem(e.key);
   if(storage.getItem(e.key)!==null){warning='일반 복구본 일부를 정리하지 못했습니다.';return;}
  }
  warning='자동 정리 작업량을 제한했습니다. 다음 정리 때 이어서 진행합니다.';
 }
 function cleanup(key,raw){try{trimLegacy(key,raw);trimManaged(key,raw);}catch(e){warning='복구본은 확보했지만 자동 정리를 완료하지 못했습니다: '+e.message;}}
 function save(snapshot){
  warning='';if(!valid(snapshot)||!payloadSafe(snapshot))throw Error('복구본 데이터 형식 오류 — 기록 교체 중단');
  const record=JSON.parse(JSON.stringify(snapshot));record.recoveryPolicy={version:1,kind:kind(record)};
  const raw=JSON.stringify(record),id=identity(record);
  const existing=inventory().find(e=>e.managed&&e.record.recoveryPolicy.kind===kind(record)&&e.record.page===record.page&&e.record.reason===record.reason&&identity(e.record)===id);
  if(existing&&storage.getItem(existing.key)===existing.raw){cleanup(existing.key,existing.raw);return {key:existing.key,deduplicated:true};}
  let key;
  for(let n=0;n<8;n++){
   const random=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():Math.random().toString(36).slice(2);
   const candidate=MANAGED+Date.now()+'_'+(++serial)+'_'+random;
   if(storage.getItem(candidate)===null){key=candidate;break;}
  }
  if(!key)throw Error('복구본 이름 생성 실패 — 기록 교체 중단');
  try{storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('복구본 재읽기 검증 실패');}
  catch(e){throw Error('안전 복구본 저장 실패 — 기록 교체·초기화 중단. 기존 복구본은 삭제하지 않았습니다. '+e.message);}
  cleanup(key,raw);return {key,deduplicated:false};
 }
 function stats(){
  const all=inventory(true),recovery=all.filter(e=>e.recovery),automatic=autos(all),legacy=all.filter(e=>e.legacy);
  return {estimatedLocalStorageBytes:all.reduce((n,e)=>n+e.bytes,0),estimatedRecoveryBytes:recovery.reduce((n,e)=>n+e.bytes,0),estimatedAutomaticBytes:automatic.reduce((n,e)=>n+e.bytes,0),automaticCount:automatic.length,legacyAutomaticCount:legacy.length,legacyCleanupCandidateCount:legacyCandidates(all).length,protectedCount:recovery.length-automatic.length-legacy.length,remainingBytes:null,limits:{perPage:COUNT,automaticBytes:BYTES,graceMs:GRACE,legacyAgeMs:AGE,legacyKeepPerPage:KEEP,cleanupBatch:BATCH},warning};
 }
 function archive(){return {format:'flove-recovery-archive-v1',createdAt:new Date().toISOString(),entries:inventory().filter(e=>e.recovery).map(e=>({key:e.key,raw:e.raw}))};}
 return {save,stats,archive,needsLegacyCleanup:()=>legacyCandidates(inventory()).length>0};
}
globalThis.FloveRecovery=Object.freeze({version:1,create});
})();
