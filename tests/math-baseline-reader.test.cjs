/* Run: node tests/math-baseline-reader.test.cjs */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Store=require('../sync-state-store.js');
const code=fs.readFileSync(require.resolve('../math-baseline-reader.js'),'utf8');
const endpoint='https://script.google.com/macros/s/AKfycbzf5zZG53ArO38Y9pYUQi4uBTLCvf8x1qLH5_CHSJRMXabslHh17XbnYo8xxE6ntPZR/exec';
let count=0;
function setup(opt={}){
 const data=new Map([['math_review_notes_v3','study-original']]);let reads=0,writes=0;const listeners=[],events=[];
 const storage={getItem(k){reads++;if(opt.blocked)throw Error('blocked');return data.has(k)?data.get(k):null;},setItem(){writes++;throw Error('Unexpected write');}};
 const context={FLOVE_SYNC_CONFIG:{page:opt.page||'math',url:opt.url},addEventListener(n,f){listeners.push({n,f});},dispatchEvent(e){events.push(e);if(opt.eventError)throw Error('event error');},CustomEvent:class{constructor(name,o){this.type=name;this.detail=o.detail;}}};
 const ref=Store.create({page:'math',endpoint:opt.url||endpoint,storage,locks:null,writerId:'test'});
 function seed(baseline={math_review_notes_v3:'[]'},revision=1){data.set(ref.key,JSON.stringify({app:'flove-sync-baseline',schemaVersion:1,page:'math',endpoint:opt.url||endpoint,revision,serverRevision:revision,savedAt:1,writerId:'test',baseline}));}
 if(opt.seed)seed();if(opt.raw!==undefined)data.set(ref.key,opt.raw);
 if(!opt.noModule)context.FloveSyncStateStore=opt.api||{create(o){return Store.create({...o,storage,locks:null});}};
 vm.createContext(context);vm.runInContext(code,context);
 return {context,data,ref,seed,events,listeners,get reads(){return reads;},get writes(){return writes;},get snapshot(){return context.FloveMathBaselineRead?.snapshot;},refresh(){return context.FloveMathBaselineRead.refresh();},reload(){vm.runInContext(code,context);}};
}
function test(name,fn){fn();count++;console.log('PASS '+name);}
test('non-math page untouched',()=>{const x=setup({page:'korean'});assert.equal(x.context.FloveMathBaselineRead,undefined);assert.equal(x.reads,0);assert.equal(x.listeners.length,0);});
test('missing module does not crash app',()=>assert.equal(setup({noModule:true}).snapshot.code,'MODULE_UNAVAILABLE'));
test('no metadata is not initialized',()=>{const x=setup();assert.equal(x.snapshot.code,'NO_BASELINE');assert.equal(x.writes,0);assert.equal(x.data.size,1);});
test('committed real store is read without locks',()=>{const x=setup({seed:true});assert.equal(x.snapshot.code,'BASELINE_READ');assert.equal(x.snapshot.state.baseline.math_review_notes_v3,'[]');assert.equal(x.writes,0);});
test('study key unchanged',()=>{const x=setup({seed:true});assert.equal(x.data.get('math_review_notes_v3'),'study-original');assert.equal(x.writes,0);});
test('corrupt metadata retains raw',()=>{const x=setup({raw:'{broken'});assert.equal(x.snapshot.code,'CORRUPT');assert.equal(x.snapshot.raw,'{broken');assert.equal(x.data.get(x.ref.key),'{broken');});
test('unknown version not replaced',()=>{const x=setup({raw:'{"schemaVersion":99}'});assert.equal(x.snapshot.code,'UNSUPPORTED_SCHEMA');assert.equal(x.writes,0);});
test('read denied reported without write',()=>{const x=setup({blocked:true});assert.equal(x.snapshot.code,'READ_FAILED');assert.equal(x.writes,0);});
test('missing math entry not invented',()=>{const x=setup();x.seed({saegibun_notes_v3:'[]'});x.refresh();assert.equal(x.snapshot.code,'NO_MATH_BASELINE');assert.equal(x.snapshot.hasMathBaseline,false);assert.equal(x.writes,0);});
test('raw state, baseline, and public snapshot are isolated',()=>{const x=setup({seed:true});assert(Object.isFrozen(x.snapshot));assert(Object.isFrozen(x.snapshot.state));assert(Object.isFrozen(x.snapshot.state.baseline));assert(Object.isFrozen(x.context.FloveMathBaselineRead));});
test('refresh reads updated criteria',()=>{const x=setup({seed:true});x.seed({math_review_notes_v3:'[]'},2);x.refresh();assert.equal(x.snapshot.state.revision,2);assert.equal(x.writes,0);});
test('storage event for unrelated key ignored',()=>{const x=setup({seed:true}),n=x.reads;x.listeners[0].f({key:'saegibun_notes_v3'});assert.equal(x.reads,n);});
test('storage event for metadata only refreshes diagnostic',()=>{const x=setup({seed:true});x.seed({math_review_notes_v3:'[]'},2);x.listeners[0].f({key:x.ref.key});assert.equal(x.snapshot.state.revision,2);assert.equal(x.writes,0);});
test('reloaded script does not duplicate listeners',()=>{const x=setup({seed:true});x.reload();assert.equal(x.listeners.length,1);assert.equal(x.writes,0);});
test('diagnostic event does not expose raw record data',()=>{const x=setup({seed:true});const e=x.events[0];assert.equal(e.type,'flove:math-baseline-read');assert.equal(e.detail.raw,undefined);assert.equal(e.detail.state,undefined);});
test('event dispatch failure does not change read result',()=>assert.equal(setup({seed:true,eventError:true}).snapshot.code,'BASELINE_READ'));
test('module exceptions contained',()=>assert.equal(setup({api:{create(){throw Error('module failed');}}}).snapshot.code,'READER_FAILED'));
test('invalid read result never becomes empty metadata',()=>assert.equal(setup({api:{create(){return {key:'test',read:()=>({ok:true})};}}}).snapshot.code,'INVALID_READ_RESULT'));
test('configured endpoint respected',()=>{const x=setup({url:'https://example.test/exec',seed:true});assert.equal(x.snapshot.state.endpoint,'https://example.test/exec');});
test('null confirmed value preserved, not converted to array',()=>{const x=setup();x.seed({math_review_notes_v3:null});x.refresh();assert.equal(x.snapshot.state.baseline.math_review_notes_v3,null);});
console.log('TOTAL '+count);
