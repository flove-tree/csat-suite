/* No auto-start, no production URL, no DOM changes. */
(function(root){
'use strict';
function connect(app,config,env=root){
 if(!config||config.enabled!==true)throw Error('Wish sync requires explicit opt-in');
 const api=env.FloveWishSync;
 if(!api||api.version!==1)throw Error('Wish sync core missing');
 if(!app||typeof app.exclusive!=='function'||typeof app.isBusy!=='function'||typeof app.refresh!=='function')throw Error('Wish app adapter missing');
 if(!env.navigator||!env.navigator.locks||typeof env.navigator.locks.request!=='function')throw Error('Safe flow locks unavailable');
 const transport=api.createTransport({endpoint:config.endpoint,fetchImpl:env.fetch.bind(env),timeoutMs:config.timeoutMs||45000});
 const controller=api.create({storage:env.localStorage,transport,
  exclusive:(name,fn)=>name==='wish-daily-save'?app.exclusive(fn):env.navigator.locks.request(name,fn),
  isBusy:()=>!!env.document.hidden||app.isBusy(),onRemote:()=>app.refresh(),
  onState:state=>{if(typeof app.onState==='function')app.onState(state);}
 });
 const listeners=[];
 const tick=()=>{if(!closed&&!paused&&!env.document.hidden)void controller.syncOnce();};
 let closed=false,paused=false;
 function close(){if(closed)return;closed=true;controller.stop();for(const [target,event,fn] of listeners)target.removeEventListener(event,fn);}
 function listen(target,event,fn){target.addEventListener(event,fn);listeners.push([target,event,fn]);}
 listen(env,'online',tick);listen(env,'focus',tick);listen(env.document,'visibilitychange',tick);
 listen(env,'pagehide',event=>{if(event.persisted){paused=true;controller.stop();}else close();});
 listen(env,'pageshow',()=>{if(paused&&!closed){paused=false;controller.start(config.intervalMs||15000);}});
 controller.start(config.intervalMs||15000);
 return Object.freeze({syncOnce:controller.syncOnce,getState:controller.getState,stop:close});
}
const api=Object.freeze({version:1,connect});
if(typeof module==='object'&&module.exports)module.exports=api;else root.FloveWishBridge=api;
})(typeof globalThis==='object'?globalThis:this);
