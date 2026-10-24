'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const here=__dirname,root=path.resolve(here,'../..'),engine=path.join(root,'sync-v2.js'),before=fs.readFileSync(engine);
const run=cp.spawnSync('python3',[path.join(here,'verify_and_apply.py'),'--emit']);
assert.equal(run.status,0,run.stderr.toString());
const source=run.stdout.toString('utf8');
assert.equal(crypto.createHash('sha256').update(run.stdout).digest('hex'),'36d80b9108cf345e89486195d85e8b28ef2a869fc23277aade4f53311aca17e7');
assert.equal(cp.spawnSync(process.execPath,['--check'],{input:source}).status,0);
const anchor='window.FloveSync={';assert.equal(source.split(anchor).length,2);
const hook=`globalThis.__h={request,cycle,revision:()=>serverRevisionObserver.snapshot(),state:()=>({base,cloud,stopped,busy}),prime:()=>{baselineStore=createPersistentBaseline({storage:localStorage,locks:navigator.locks,page:cfg.page,server:cfg.url||endpoint,owns:own,check:validate});base=baselineStore.load();recoveryReady=true;recoveryManagerInstance={save:()=>{}};}};\n`;
const KEY='saegibun_notes_v3';
function env(){
 const data=new Map([[KEY,'[]']]),writes=[],timers=new Set();let serial=0;
 const storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{data.set(k,v);writes.push(k);},removeItem:k=>{data.delete(k);writes.push(k);},key:i=>[...data.keys()][i]||null,get length(){return data.size;}};
 const c={URL,AbortController,console:{error:()=>{},warn:()=>{}},localStorage:storage,navigator:{locks:{request:async(k,o,fn)=>fn()}},FLOVE_SYNC_CONFIG:{page:'korean',keys:[KEY],url:'https://example.invalid/sync'},document:{hidden:false,currentScript:{src:'https://example.invalid/sync-v2.js'},createElement:()=>({}),head:{appendChild:()=>{}},addEventListener:()=>{}},addEventListener:()=>{},setTimeout:()=>{timers.add(++serial);return serial;},clearTimeout:id=>timers.delete(id),top:{},self:{},fetch:async()=>{throw Error('fake offline');}};
 c.window=c;vm.createContext(c);vm.runInContext(source.replace(anchor,hook+anchor),c,{timeout:1000});
 const response=p=>({ok:true,status:200,json:async()=>p});
 return {c,h:c.__h,data,writes,timers,response,reply:p=>{c.fetch=async()=>response(p);}};
}
const p=revision=>({protocol:2,result:'success',data:{[KEY]:'[]'},revision});
let total=0;
async function test(name,fn){await fn();total++;console.log('PASS '+name);}
(async()=>{
 await test('candidate is exact and baseline unchanged',()=>assert.deepEqual(fs.readFileSync(engine),before));
 await test('browser engine smoke without boot',()=>assert.equal(typeof env().c.FloveSync.saveBatch,'function'));
 await test('observation is not application or storage',async()=>{const e=env();e.reply(p(9));await e.h.request();assert.equal(e.h.revision().observed,9);assert.equal(e.h.state().base[KEY],undefined);assert.equal(e.h.state().cloud[KEY],undefined);assert.equal(e.writes.length,0);});
 await test('missing revision keeps legacy handling',async()=>{const e=env(),v=p(0);delete v.revision;e.reply(v);await e.h.request();assert.equal(e.h.revision().observed,null);});
 for(const value of [null,'9',-1,-0,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,{},true])await test('reject invalid '+String(value),async()=>{const e=env();e.reply(p(4));await e.h.request();e.reply(p(value));await assert.rejects(e.h.request(),/형식 오류/);assert.equal(e.h.revision().observed,4);assert.equal(e.writes.length,0);assert.equal(e.timers.size,0);});
 await test('zero and duplicate allowed',async()=>{const e=env();e.reply(p(0));await e.h.request();await e.h.request();assert.equal(e.h.revision().observed,0);});
 await test('out-of-order old response rejected',async()=>{const e=env();let release;const delayed=new Promise(r=>{release=r;});e.c.fetch=()=>delayed;const old=e.h.request();e.reply(p(10));await e.h.request();release(e.response(p(8)));await assert.rejects(old,/이전 서버 revision/);assert.equal(e.h.revision().observed,10);});
 await test('POST body unchanged and conflict not confirmation',async()=>{const e=env(),body={protocol:2,ops:[]};e.c.fetch=async(url,opt)=>{assert.equal(opt.method,'POST');assert.equal(opt.body,JSON.stringify(body));return e.response({...p(5),result:'conflict'});};assert.equal((await e.h.request(body)).result,'conflict');assert.equal(e.writes.length,0);});
 await test('malformed data cannot advance observation',async()=>{const e=env();e.reply({...p(99),data:{[KEY]:'bad'}});await assert.rejects(e.h.request());assert.equal(e.h.revision().observed,null);});
 await test('network error clears timer',async()=>{const e=env();await assert.rejects(e.h.request(),/fake offline/);assert.equal(e.h.revision().observed,null);assert.equal(e.timers.size,0);});
 await test('baseline counter separate from server version',async()=>{const e=env();e.h.prime();e.reply(p(100));await e.h.cycle();const key=[...e.data.keys()].find(k=>k.startsWith('__flove_sync_baseline_v1:'));assert.equal(JSON.parse(e.data.get(key)).revision,1);assert.equal(e.h.revision().observed,100);assert.equal(e.data.get(KEY),'[]');});
 await test('invalid cycle response preserves storage',async()=>{const e=env();e.h.prime();e.reply(p('bad'));await e.h.cycle();assert.equal(e.writes.length,0);assert.equal(e.h.state().busy,false);});
 await test('fresh instance has unknown revision',async()=>{const e=env();e.reply(p(8));await e.h.request();assert.equal(env().h.revision().observed,null);});
 await test('wrong baseline refused by patch tool',()=>{const result=cp.spawnSync('python3',['-c',"import importlib.util;from pathlib import Path;p=Path('tools/sync-stage1/verify_and_apply.py');s=importlib.util.spec_from_file_location('stage1',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);m.build(b'wrong source')"],{cwd:root});assert.notEqual(result.status,0);assert.match(result.stderr.toString(),/Source blob changed/);});
 assert.deepEqual(fs.readFileSync(engine),before);
 console.log('TOTAL '+total+' PASS; tracked engine unchanged');
})().catch(e=>{console.error(e);process.exitCode=1;});
