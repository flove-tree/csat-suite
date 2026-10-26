/* Wish-only protocol-2 connector. Inert until explicitly configured and started. */
(function(root){
'use strict';
const KEY='suneung-wishes-v1';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function canonical(x){
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 if(object(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function parse(raw){
 if(raw===null)return [];
 if(typeof raw!=='string')throw Error('Wish value is not a string');
 const rows=JSON.parse(raw),dates=new Set();
 if(!Array.isArray(rows))throw Error('Wish array required');
 for(const row of rows){
  if(!object(row)||typeof row.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||typeof row.text!=='string')throw Error('Invalid wish record');
  const date=new Date(row.date+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==row.date||dates.has(row.date))throw Error('Invalid or duplicate wish date');
  dates.add(row.date);
  if(own(row,'id')&&(typeof row.id!=='string'||!row.id))throw Error('Invalid wish id');
  if(own(row,'done')&&typeof row.done!=='boolean')throw Error('Invalid completion state');
  for(const p of ['px','py'])if(own(row,p)&&(!Number.isFinite(row[p])||row[p]<0||row[p]>1))throw Error('Invalid star coordinate');
  if(own(row,'shape')&&!['star','planet','comet'].includes(row.shape))throw Error('Invalid star shape');
  if(own(row,'color')&&typeof row.color!=='string')throw Error('Invalid star color');
 }
 return rows;
}
function normalize(raw){return canonical(parse(raw).slice().sort((a,b)=>a.date.localeCompare(b.date)));}
function merge(base,local,remote,known){
 const lists=[known?parse(base):[],parse(local),parse(remote)];
 const [b,l,r]=lists.map(a=>new Map(a.map(w=>[w.date,w])));
 const dates=[...new Set([...b.keys(),...l.keys(),...r.keys()])].sort(),out=[],conflicts=[];
 for(const day of dates){
  const bv=b.get(day),lv=l.get(day),rv=r.get(day),bs=canonical(bv),ls=canonical(lv),rs=canonical(rv);
  let winner;
  if(ls===rs)winner=lv;
  else if(known&&bs!==undefined&&(ls===undefined||rs===undefined)){conflicts.push(day);continue;}
  else if(ls===bs)winner=rv;
  else if(rs===bs)winner=lv;
  else {conflicts.push(day);continue;}
  if(winner!==undefined)out.push(winner);
 }
 return conflicts.length?{ok:false,conflicts}:{ok:true,value:canonical(out)};
}
function createTransport(options){
 const {endpoint,fetchImpl,timeoutMs=45000}=options;
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password||url.hash)throw Error('Explicit HTTPS endpoint required');
 if(typeof fetchImpl!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1)throw Error('Invalid transport options');
 async function request(body){
  const controller=new AbortController();let timer;
  const options={cache:'no-store',signal:controller.signal};
  if(body){options.method='POST';options.headers={'Content-Type':'text/plain;charset=UTF-8'};options.body=JSON.stringify(body);}
  const task=(async()=>{
   const response=await fetchImpl(url.href,options);
   if(!response.ok)throw Error('HTTP '+response.status);
   const packet=await response.json();
   if(!object(packet)||packet.protocol!==2||!['success','conflict'].includes(packet.result)||!object(packet.data))throw Error('Invalid protocol-2 response');
   const value=own(packet.data,KEY)?packet.data[KEY]:null;parse(value);
   return {result:packet.result,value};
  })();
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Wish request timed out'));},timeoutMs);});
  try{return await Promise.race([task,timeout]);}finally{clearTimeout(timer);}
 }
 return Object.freeze({identity:url.href,
  async read(){const p=await request();if(p.result!=='success')throw Error('Read was not confirmed');return p.value;},
  async compareAndSet(expected,value){parse(expected);parse(value);return request({protocol:2,ops:[{key:KEY,expected,value}]});}
 });
}
function create(options){
 const {storage,transport,exclusive,isBusy=()=>false,onRemote=()=>{},onState=()=>{}}=options;
 if(!storage||typeof exclusive!=='function'||!transport||typeof transport.identity!=='string'||!transport.identity||typeof transport.read!=='function'||typeof transport.compareAndSet!=='function')throw Error('Connector dependencies required');
 const metaKey='__flove_wish_sync_v1:'+encodeURIComponent(transport.identity);
 const backupKey=metaKey+':recovery';
 let running=false,timer=null,stopped=false,epoch=0,state={status:'idle'};
 function emit(status,extra={}){state={status,...extra};try{onState({...state});}catch(_){}return {...state};}
 function load(){
  const raw=storage.getItem(metaKey);
  if(raw===null)return {raw,meta:{version:1,known:false,base:null,pending:null}};
  const meta=JSON.parse(raw);
  if(!object(meta)||meta.version!==1||typeof meta.known!=='boolean'||!own(meta,'base')||!own(meta,'pending')||(!meta.known&&meta.base!==null))throw Error('Invalid wish sync metadata');
  parse(meta.base);
  if(meta.pending!==null){
   const p=meta.pending;
   if(!object(p)||!own(p,'expected')||typeof p.value!=='string'||!own(p,'local'))throw Error('Invalid pending wish write');
   parse(p.expected);parse(p.value);parse(p.local);
  }
  return {raw,meta};
 }
 function save(meta,expected){
  if(storage.getItem(metaKey)!==expected)throw Error('Sync metadata changed');
  const raw=JSON.stringify(meta);storage.setItem(metaKey,raw);
  if(storage.getItem(metaKey)!==raw)throw Error('Sync metadata write not confirmed');
  return raw;
 }
 function backup(local,remote){
  const raw=storage.getItem(backupKey),history=raw===null?[]:JSON.parse(raw);
  if(!Array.isArray(history))throw Error('Invalid recovery archive');
  const next=JSON.stringify([...history.slice(-4),{local,remote}]);
  storage.setItem(backupKey,next);
  if(storage.getItem(backupKey)!==next)throw Error('Recovery write not confirmed');
 }
 async function settle(s,value,expectedLocal,token){
  return exclusive('wish-daily-save',()=>{
   if(stopped||token!==epoch)return emit('stopped');
   if(isBusy())return emit('deferred');
   if(storage.getItem(metaKey)!==s.raw||storage.getItem(KEY)!==s.local)return emit('stale');
   const replace=s.local===expectedLocal&&normalize(s.local)!==normalize(value);
   if(replace){
    backup(s.local,value);
    try{
     storage.setItem(KEY,value===null?'[]':value);
     if(storage.getItem(KEY)!==(value===null?'[]':value))throw Error('Local wish write not confirmed');
     onRemote();
     if(storage.getItem(KEY)!==(value===null?'[]':value))throw Error('Refresh changed wish storage');
    }catch(error){
     const current=storage.getItem(KEY);
     if(current===(value===null?'[]':value)){
      if(s.local===null)storage.removeItem(KEY);else storage.setItem(KEY,s.local);
      try{onRemote();}catch(_){}
     }
     throw error;
    }
   }
   save({...s.meta,known:true,base:value,pending:null},s.raw);
   return emit(normalize(storage.getItem(KEY))===normalize(value)?'synced':'local-pending');
  });
 }
 async function send(s,token){
  const p=s.meta.pending;
  const result=await transport.compareAndSet(p.expected,p.value);
  if(stopped||token!==epoch)return emit('stopped');
  if(result.result==='conflict'){
   return exclusive('wish-daily-save',()=>{
    if(stopped||token!==epoch)return emit('stopped');
    if(storage.getItem(metaKey)===s.raw)save({...s.meta,pending:null},s.raw);
    return emit('retry');
   });
  }
  if(result.result!=='success'||result.value!==p.value)throw Error('Server wish write not confirmed');
  return settle(s,p.value,p.local,token);
 }
 async function syncOnce(){
  if(stopped)return emit('stopped');
  if(running)return {status:'running'};
  running=true;const token=epoch;
  try{return await exclusive('flove-wish-flow:'+transport.identity,async()=>{
   const s=await exclusive('wish-daily-save',()=>{
    if(stopped||token!==epoch||isBusy())return null;
    const loaded=load(),local=storage.getItem(KEY);parse(local);
    return {...loaded,local};
   });
   if(!s)return emit(stopped?'stopped':'deferred');
   const remote=await transport.read();parse(remote);
   if(stopped||token!==epoch)return emit('stopped');
   if(s.meta.pending){
    const p=s.meta.pending;
    if(remote===p.value)return settle(s,p.value,p.local,token);
    if(remote===p.expected)return send(s,token);
    return emit('uncertain',{reason:'Pending write and server differ; originals retained'});
   }
   if(remote===null&&s.meta.known&&parse(s.local).length)return emit('remote-missing');
   const result=merge(s.meta.base,s.local,remote,s.meta.known);
   if(!result.ok)return emit('conflict',{dates:result.conflicts});
   if(normalize(result.value)===normalize(remote))return settle(s,remote,s.local,token);
   const pending={expected:remote,value:result.value,local:s.local};
   const staged=await exclusive('wish-daily-save',()=>{
    if(stopped||token!==epoch||isBusy()||storage.getItem(KEY)!==s.local||storage.getItem(metaKey)!==s.raw)return null;
    const meta={...s.meta,pending};return {local:s.local,meta,raw:save(meta,s.raw)};
   });
   if(!staged)return emit('stale');
   return send(staged,token);
  });}catch(error){return emit('error',{message:error.message});}
  finally{running=false;}
 }
 function start(intervalMs=15000){
  if(!Number.isFinite(intervalMs)||intervalMs<1000)throw Error('Invalid sync interval');
  if(timer!==null)return;
  stopped=false;timer=setInterval(()=>{void syncOnce();},intervalMs);void syncOnce();
 }
 function stop(){stopped=true;epoch++;if(timer!==null)clearInterval(timer);timer=null;}
 return Object.freeze({syncOnce,start,stop,getState:()=>({...state}),metaKey,backupKey});
}
const api=Object.freeze({version:1,KEY,parse,merge,normalize,createTransport,create});
if(typeof module==='object'&&module.exports)module.exports=api;else root.FloveWishSync=api;
})(typeof globalThis==='object'?globalThis:this);
