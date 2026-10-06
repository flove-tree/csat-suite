/* Run: node tests/sync-state-store.test.cjs */
const assert=require('node:assert/strict');
const Store=require('../sync-state-store.js');
const URL_='https://example.test/sync/exec';
let passed=0;
function memory(){const data=new Map();let reads=0;return {data,writes:0,failRead:false,failWrite:false,failVerify:false,overwrite:false,getItem(k){reads++;if(this.failRead||(this.failVerify&&this.writes))throw Error('blocked read');if(this.overwrite&&this.writes)return 'other writer';return data.has(k)?data.get(k):null;},setItem(k,v){if(this.failWrite)throw Error('quota');this.writes++;data.set(k,v);}};}
function manager(){let queue=Promise.resolve();return {request(k,o,fn){const p=queue.then(fn);queue=p.catch(()=>{});return p;}};}
function create(storage,locks=manager(),extra={}){return Store.create({page:'math',endpoint:URL_,storage,locks,writerId:'test-tab',now:()=>1234,...extra});}
const ack=(data={x:'a'},revision=1)=>({protocol:2,result:'success',revision,data});
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{
await test('missing metadata has no side effects',()=>{const m=memory();assert.equal(create(m).read().exists,false);assert.equal(m.writes,0);});
await test('confirmed save and reload',async()=>{const m=memory(),s=create(m),r=await s.saveConfirmed({x:'a'},null,ack());assert(r.ok);assert.equal(create(m).read().state.baseline.x,'a');assert.equal(r.state.revision,1);});
await test('recreated instance preserves baseline',async()=>{const m=memory();await create(m).saveConfirmed({x:'a'},null,ack());assert.equal(create(m,manager(),{writerId:'new-tab'}).read().state.serverRevision,1);});
await test('page scope separation',async()=>{const m=memory();await create(m).saveConfirmed({x:'a'},null,ack());assert.equal(create(m,manager(),{page:'korean'}).read().exists,false);});
await test('endpoint scope separation',async()=>{const m=memory();await create(m).saveConfirmed({x:'a'},null,ack());assert.equal(create(m,manager(),{endpoint:'https://other.test/exec'}).read().exists,false);});
await test('study keys are untouched',async()=>{const m=memory();m.data.set('math_review_notes_v3','original');m.data.set('saegibun_notes_v3','original2');await create(m).saveConfirmed({math_review_notes_v3:'[]'},null,ack({math_review_notes_v3:'[]'}));assert.equal(m.data.get('math_review_notes_v3'),'original');assert.equal(m.data.get('saegibun_notes_v3'),'original2');assert.equal(m.data.size,3);});
await test('corrupt raw preserved',async()=>{const m=memory(),s=create(m);m.data.set(s.key,'{broken');const r=await s.saveConfirmed({x:'a'},'{broken',ack());assert.equal(r.code,'CORRUPT');assert.equal(m.data.get(s.key),'{broken');assert.equal(m.writes,0);});
await test('unknown schema preserved',async()=>{const m=memory(),s=create(m),raw='{"schemaVersion":99}';m.data.set(s.key,raw);assert.equal((await s.saveConfirmed({x:'a'},raw,ack())).code,'UNSUPPORTED_SCHEMA');assert.equal(m.writes,0);});
await test('read errors reported',()=>{const m=memory();m.failRead=true;assert.equal(create(m).read().code,'READ_FAILED');});
await test('write failure does not report success',async()=>{const m=memory(),s=create(m);m.failWrite=true;assert.equal((await s.saveConfirmed({x:'a'},null,ack())).code,'WRITE_FAILED');assert.equal(s.read().exists,false);});
await test('old revision unchanged after write failure',async()=>{const m=memory(),s=create(m);const a=await s.saveConfirmed({x:'a'},null,ack());m.failWrite=true;assert.equal((await s.saveConfirmed({x:'b'},a.raw,ack({x:'b'},2))).code,'WRITE_FAILED');assert.equal(s.read().raw,a.raw);});
await test('verification read failure is not success',async()=>{const m=memory();m.failVerify=true;assert.equal((await create(m).saveConfirmed({x:'a'},null,ack())).code,'VERIFY_FAILED');});
await test('verification conflict never restores stale metadata',async()=>{const m=memory();m.overwrite=true;assert.equal((await create(m).saveConfirmed({x:'a'},null,ack())).code,'VERIFY_CONFLICT');assert.equal(m.writes,1);});
await test('old expected raw rejected',async()=>{const m=memory(),s=create(m);await s.saveConfirmed({x:'a'},null,ack());assert.equal((await s.saveConfirmed({x:'b'},null,ack({x:'b'},2))).code,'CONFLICT');assert.equal(m.writes,1);});
await test('exclusive simulated lock serializes competing tabs',async()=>{const m=memory(),l=manager(),a=create(m,l),b=create(m,l,{writerId:'other'});const r=await Promise.all([a.saveConfirmed({x:'a'},null,ack()),b.saveConfirmed({x:'b'},null,ack({x:'b'},2))]);assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.filter(x=>x.code==='CONFLICT').length,1);assert.equal(m.writes,1);});
await test('lock absence refuses unsafe write',async()=>{const m=memory();assert.equal((await create(m,null).saveConfirmed({x:'a'},null,ack())).code,'LOCK_UNAVAILABLE');assert.equal(m.writes,0);});
await test('lock failure leaves original alone',async()=>{const m=memory();assert.equal((await create(m,{request(){throw Error('lock blocked');}}).saveConfirmed({x:'a'},null,ack())).code,'LOCK_FAILED');assert.equal(m.writes,0);});
await test('server error cannot advance baseline',async()=>{const m=memory();assert.equal((await create(m).saveConfirmed({x:'a'},null,{...ack(),result:'error'})).code,'UNCONFIRMED');assert.equal(m.writes,0);});
await test('wrong protocol rejected',async()=>{const m=memory();assert.equal((await create(m).saveConfirmed({x:'a'},null,{...ack(),protocol:1})).code,'UNCONFIRMED');});
await test('acknowledged values must match baseline',async()=>{const m=memory();assert.equal((await create(m).saveConfirmed({x:'b'},null,ack())).code,'ACK_MISMATCH');assert.equal(m.writes,0);});
await test('missing expected comparison rejected',async()=>assert.equal((await create(memory()).saveConfirmed({x:'a'},undefined,ack())).code,'EXPECTED_RAW_REQUIRED'));
await test('invalid baseline rejected',async()=>assert.equal((await create(memory()).saveConfirmed({x:123},null,ack({x:123}))).code,'INVALID_BASELINE'));
await test('stale server response cannot regress baseline',async()=>{const m=memory(),s=create(m),r=await s.saveConfirmed({x:'b'},null,ack({x:'b'},5));assert.equal((await s.saveConfirmed({x:'a'},r.raw,ack({x:'a'},4))).code,'STALE_ACK');assert.equal(s.read().raw,r.raw);});
await test('same server revision with changed content rejected',async()=>{const m=memory(),s=create(m),r=await s.saveConfirmed({x:'a'},null,ack());assert.equal((await s.saveConfirmed({x:'b'},r.raw,ack({x:'b'}))).code,'STALE_ACK');});
await test('metadata revisions increment separately',async()=>{const s=create(memory()),r=await s.saveConfirmed({x:'a'},null,ack());const next=await s.saveConfirmed({x:'b'},r.raw,ack({x:'b'},2));assert.equal(next.state.revision,2);});
await test('raw export preserves broken text',()=>{const m=memory(),s=create(m);m.data.set(s.key,'broken');assert.equal(s.exportRaw().raw,'broken');assert.equal(m.writes,0);});
await test('legacy inspection never migrates automatically',()=>{const m=memory(),raw='{"x":"a"}',r=Store.inspectLegacy(raw);assert(r.ok&&r.needsServerCheck);assert.equal(r.raw,raw);assert.equal(m.writes,0);});
await test('corrupt legacy original retained',()=>{const raw='{broken';assert.equal(Store.inspectLegacy(raw).raw,raw);assert.equal(Store.inspectLegacy(raw).code,'CORRUPT_LEGACY');});
await test('empty confirmed baseline accepted',async()=>assert((await create(memory()).saveConfirmed({},null,ack({}))).ok));
await test('null baseline values retained',async()=>{const r=await create(memory()).saveConfirmed({x:null},null,ack({x:null}));assert(r.ok);assert.equal(r.state.baseline.x,null);});
await test('bad metadata clock rejected',async()=>{const m=memory();assert.equal((await create(m,manager(),{now:()=>NaN}).saveConfirmed({x:'a'},null,ack())).code,'INVALID_METADATA');assert.equal(m.writes,0);});
await test('invalid page cannot target study keys',()=>assert.throws(()=>create(memory(),manager(),{page:'math_review_notes_v3'})));
await test('non-http endpoint rejected',()=>assert.throws(()=>create(memory(),manager(),{endpoint:'javascript:alert(1)'})));
await test('acknowledgement copied before lock wait',async()=>{const m=memory();let release;const l={request(k,o,f){return new Promise(r=>{release=()=>r(f());});}},s=create(m,l),a=ack();const promise=s.saveConfirmed({x:'a'},null,a);a.revision=99;release();assert.equal((await promise).state.serverRevision,1);});
console.log('TOTAL '+passed);
})().catch(e=>{console.error(e);process.exit(1);});
