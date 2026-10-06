/* Flove sync baseline store v1. Metadata only; never writes study-record keys. */
(function(root){
'use strict';
const APP='flove-sync-baseline',PREFIX='__flove_sync_state_v1:';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
function dictionary(o){
 if(!plain(o))throw Error('Invalid baseline dictionary');
 for(const k of Object.keys(o))if(!k||['__proto__','prototype','constructor'].includes(k)||(o[k]!==null&&typeof o[k]!=='string'))throw Error('Invalid baseline entry');
 return JSON.parse(JSON.stringify(o));
}
function create(options){
 const opt=options||{},page=opt.page;
 if(!['index','korean','math','eng','sang','samun','plan','timer'].includes(page))throw Error('Invalid page');
 const url=new URL(opt.endpoint);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Invalid endpoint');
 const endpoint=url.href,key=PREFIX+encodeURIComponent(endpoint)+':'+page;
 const storage=()=>has(opt,'storage')?opt.storage:root.localStorage;
 const locks=()=>has(opt,'locks')?opt.locks:root.navigator&&root.navigator.locks;
 const now=opt.now||Date.now,writerId=opt.writerId||('tab-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 if(typeof writerId!=='string'||!writerId)throw Error('Invalid writer ID');
 function read(){
  let raw=null;
  try{raw=storage().getItem(key);}catch(e){return {ok:false,code:'READ_FAILED',raw,error:String(e)};}
  if(raw===null)return {ok:true,exists:false,raw:null,state:null};
  if(typeof raw!=='string')return {ok:false,code:'INVALID_READ',raw};
  let s;try{s=JSON.parse(raw);}catch(e){return {ok:false,code:'CORRUPT',raw,error:String(e)};}
  if(!plain(s)||s.schemaVersion!==1)return {ok:false,code:'UNSUPPORTED_SCHEMA',raw};
  try{
   if(s.app!==APP||s.page!==page||s.endpoint!==endpoint||!Number.isSafeInteger(s.revision)||s.revision<1||!Number.isSafeInteger(s.serverRevision)||s.serverRevision<0||!Number.isSafeInteger(s.savedAt)||s.savedAt<0||typeof s.writerId!=='string'||!s.writerId)throw Error('Invalid metadata');
   dictionary(s.baseline);
  }catch(e){return {ok:false,code:'CORRUPT',raw,error:String(e)};}
  return {ok:true,exists:true,raw,state:s};
 }
 async function saveConfirmed(baseline,expectedRaw,ack){
  if(expectedRaw!==null&&typeof expectedRaw!=='string')return {ok:false,code:'EXPECTED_RAW_REQUIRED'};
  let copy,confirmedRevision;
  try{
   copy=dictionary(baseline);
   if(!plain(ack)||ack.protocol!==2||ack.result!=='success'||!Number.isSafeInteger(ack.revision)||ack.revision<0||!plain(ack.data))return {ok:false,code:'UNCONFIRMED'};
   for(const k of Object.keys(copy))if(copy[k]!== (has(ack.data,k)?ack.data[k]:null))return {ok:false,code:'ACK_MISMATCH'};
   confirmedRevision=ack.revision;
  }catch(e){return {ok:false,code:'INVALID_BASELINE',error:String(e)};}
  let manager;try{manager=locks();}catch(e){return {ok:false,code:'LOCK_FAILED',error:String(e)};}
  if(!manager||typeof manager.request!=='function')return {ok:false,code:'LOCK_UNAVAILABLE'};
  try{return await manager.request(key,{mode:'exclusive'},()=>{
   const old=read();if(!old.ok)return old;
   if(old.raw!==expectedRaw)return {ok:false,code:'CONFLICT',raw:old.raw};
   if(old.exists&&confirmedRevision<old.state.serverRevision)return {ok:false,code:'STALE_ACK',raw:old.raw};
   if(old.exists&&confirmedRevision===old.state.serverRevision){for(const k of Object.keys(copy))if(has(old.state.baseline,k)&&old.state.baseline[k]!==copy[k])return {ok:false,code:'STALE_ACK',raw:old.raw};}
   const s={app:APP,schemaVersion:1,page,endpoint,revision:old.exists?old.state.revision+1:1,serverRevision:confirmedRevision,savedAt:now(),writerId,baseline:copy};
   if(!Number.isSafeInteger(s.revision)||!Number.isSafeInteger(s.savedAt)||s.savedAt<0)return {ok:false,code:'INVALID_METADATA',raw:old.raw};
   const raw=JSON.stringify(s);
   try{storage().setItem(key,raw);}catch(e){return {ok:false,code:'WRITE_FAILED',raw:old.raw,error:String(e)};}
   try{if(storage().getItem(key)!==raw)return {ok:false,code:'VERIFY_CONFLICT',attemptedRaw:raw};}catch(e){return {ok:false,code:'VERIFY_FAILED',attemptedRaw:raw,error:String(e)};}
   return {ok:true,raw,state:s};
  });}catch(e){return {ok:false,code:'LOCK_FAILED',error:String(e)};}
 }
 function exportRaw(){const r=read();return {key,ok:r.ok,code:r.code||null,raw:r.raw};}
 return {key,read,saveConfirmed,exportRaw};
}
function inspectLegacy(raw){
 if(typeof raw!=='string')return {ok:false,code:'INVALID_LEGACY',raw};
 try{return {ok:true,raw,baseline:dictionary(JSON.parse(raw)),needsServerCheck:true};}catch(e){return {ok:false,code:'CORRUPT_LEGACY',raw,error:String(e)};}
}
const api={create,inspectLegacy};root.FloveSyncStateStore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
