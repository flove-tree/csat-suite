/* Pure record merge logic. No network or storage writes. */
(function(root){
'use strict';
function stable(x){
 if(x===null)return 'null';
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 if(typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x)))return JSON.stringify(x);
 throw new Error('Non-JSON value in record');
}
const equal=(a,b)=>a===undefined||b===undefined?a===b:stable(a)===stable(b);
function index(records){
 if(!Array.isArray(records))throw new Error('Records must be an array');
 const m=new Map();
 for(const r of records){
  if(!r||typeof r!=='object'||Array.isArray(r))throw new Error('Invalid record');
  const id=r.id;if(!((typeof id==='number'&&Number.isSafeInteger(id))||(typeof id==='string'&&id.trim())))throw new Error('Invalid ID');
  stable(r);const k=String(id);if(m.has(k))throw new Error('Duplicate ID: '+k);m.set(k,r);
 }
 return m;
}
function mergeRecords(base,local,remote){
 const known=base!==undefined,b=known?index(base):new Map(),l=index(local),r=index(remote);
 const keys=new Set([...b.keys(),...l.keys(),...r.keys()]),selected=new Map(),conflicts=[];
 for(const id of keys){
  const bv=b.get(id),lv=l.get(id),rv=r.get(id);let choice;
  if(equal(lv,rv))choice=lv;
  else if(!known){conflicts.push({id,reason:lv===undefined||rv===undefined?'missing-baseline':'different-content'});continue;}
  else if(equal(lv,bv))choice=rv;
  else if(equal(rv,bv))choice=lv;
  else{conflicts.push({id,reason:lv===undefined||rv===undefined?'delete-versus-edit':'different-content'});continue;}
  if(choice!==undefined)selected.set(id,choice);
 }
 const shared=[...selected.keys()].filter(k=>b.has(k)&&l.has(k)&&r.has(k));
 const order=a=>a.map(x=>String(x.id)).filter(k=>shared.includes(k));
 const bo=known?order(base):[],lo=order(local),ro=order(remote);
 let primary=local;if(known&&equal(local,base)&&!equal(remote,base))primary=remote;
 if(known){const lc=stable(lo)!==stable(bo),rc=stable(ro)!==stable(bo);if(lc&&rc&&stable(lo)!==stable(ro))conflicts.push({id:null,reason:'different-order'});else if(rc&&!lc)primary=remote;}
 else if(conflicts.length===0&&stable(local.map(x=>String(x.id)))!==stable(remote.map(x=>String(x.id))))conflicts.push({id:null,reason:'different-order'});
 if(conflicts.length)return {ok:false,records:null,conflicts};
 const ids=[...new Set([...primary,...local,...remote].map(x=>String(x.id)))].filter(k=>selected.has(k));
 const records=ids.map(k=>JSON.parse(JSON.stringify(selected.get(k))));
 return {ok:true,records,conflicts:[],addedToLocal:records.filter(x=>!l.has(String(x.id))).length,addedToRemote:records.filter(x=>!r.has(String(x.id))).length};
}
const api={mergeRecords,equal};root.FloveMerge=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
