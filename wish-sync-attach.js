/* Load AFTER the original wish script, wish-sync-core.js and wish-sync-bridge.js.
   Only enabled when FLOVE_WISH_SYNC_CONFIG.enabled === true and endpoint is explicit. */
(() => {
'use strict';
const config=window.FLOVE_WISH_SYNC_CONFIG;
if(!config||config.enabled!==true||window.FloveWishConnection)return;
try{
 const connection=window.FloveWishBridge.connect({
  exclusive:fn=>exclusive(fn),
  isBusy:()=>phase!=='idle'||editing||!!flight||pending!==null||!!$('wish').value.trim()||document.activeElement===$('wish'),
  refresh:()=>{data=read();sync();view();if($('dataDialog').open)records();},
  onState:state=>window.dispatchEvent(new CustomEvent('flove-wish-sync-state',{detail:state}))
 },config);
 window.FloveWishConnection=connection;
 const originalCommit=commit,originalFinish=finish;
 commit=async function(change){const ok=await originalCommit(change);if(ok)queueMicrotask(()=>{void connection.syncOnce();});return ok;};
 finish=function(){const result=originalFinish();queueMicrotask(()=>{void connection.syncOnce();});return result;};
}catch(error){console.error('[Wish sync disabled]',error);}
})();
