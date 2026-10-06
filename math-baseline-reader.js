/* Math baseline read-only bridge. Diagnostic snapshots are not permission to merge or overwrite. */
(function(root){
'use strict';
const cfg=root.FLOVE_SYNC_CONFIG||{};
if(cfg.page!=='math')return;
if(root.FloveMathBaselineRead&&root.FloveMathBaselineRead.version===1){root.FloveMathBaselineRead.refresh();return;}
const fallback='https://script.google.com/macros/s/AKfycbzf5zZG53ArO38Y9pYUQi4uBTLCvf8x1qLH5_CHSJRMXabslHh17XbnYo8xxE6ntPZR/exec';
const mathKey='math_review_notes_v3';
let snapshot;
function refresh(){
 let result,key=null;
 try{
  const api=root.FloveSyncStateStore;
  if(!api||typeof api.create!=='function')result={ok:false,code:'MODULE_UNAVAILABLE'};
  else{
   const store=api.create({page:'math',endpoint:cfg.url||fallback,writerId:'math-read-only'});key=store.key;
   const r=store.read();
   if(!r||typeof r.ok!=='boolean'||(r.ok&&typeof r.exists!=='boolean'))result={ok:false,code:'INVALID_READ_RESULT'};
   else if(!r.ok)result={ok:false,code:r.code||'READ_FAILED',raw:r.raw===undefined?null:r.raw,error:r.error||null};
   else if(!r.exists)result={ok:true,exists:false,hasMathBaseline:false,code:'NO_BASELINE',raw:null,state:null};
   else{
    const state=JSON.parse(JSON.stringify(r.state));
    if(!state||!state.baseline||typeof state.baseline!=='object'||Array.isArray(state.baseline))throw Error('Invalid state result');
    const hasMathBaseline=Object.prototype.hasOwnProperty.call(state.baseline,mathKey);
    Object.freeze(state.baseline);Object.freeze(state);
    result={ok:true,exists:true,hasMathBaseline,code:hasMathBaseline?'BASELINE_READ':'NO_MATH_BASELINE',raw:r.raw,state};
   }
  }
 }catch(e){result={ok:false,code:'READER_FAILED',error:String(e)};}
 snapshot=Object.freeze({stage:'read-only',key,...result});
 try{if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('flove:math-baseline-read',{detail:{ok:snapshot.ok,code:snapshot.code,exists:!!snapshot.exists}}));}catch(_){}
 return snapshot;
}
root.FloveMathBaselineRead=Object.freeze({version:1,get snapshot(){return snapshot;},refresh});
if(typeof root.addEventListener==='function')root.addEventListener('storage',e=>{if(snapshot&&snapshot.key&&e.key===snapshot.key)refresh();});
refresh();
})(typeof globalThis!=='undefined'?globalThis:this);
