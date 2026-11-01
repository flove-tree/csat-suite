/* Presentation only: never writes wish records or sync metadata. */
(() => {
'use strict';
if(window.FloveWishCinema)return;
const motion=matchMedia('(prefers-reduced-motion:reduce)');
const reduced=()=>motion.matches||!Element.prototype.animate;
const style=document.createElement('style');
style.textContent=`
#cinema-seed{height:54px;position:relative;display:grid;place-items:center;pointer-events:none;--power:.25}
#cinema-seed:before{content:'';width:9px;height:9px;border-radius:50%;background:#fff6df;box-shadow:0 0 12px #e5cfff,0 0 32px #b8a0ec;opacity:calc(.35 + var(--power)*.6);animation:cinema-breathe 4s ease-in-out infinite}
#cinema-seed i{position:absolute;width:3px;height:3px;border-radius:50%;background:#e9dcff;opacity:calc(.1 + var(--power)*.5);transform:rotate(var(--angle)) translateX(25px);animation:cinema-dust 8s linear infinite;animation-delay:var(--delay)}
#cinema-layer{position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden;--wish-light:#e7d4ff}
#cinema-layer canvas{position:absolute;inset:0;display:block}
.cinema-quote{position:absolute;left:50%;top:33%;transform:translate(-50%,-50%);width:min(78vw,440px);text-align:center;font-size:16px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;color:#f4edf9;text-shadow:0 0 12px #d9bfff80}
.cinema-quote span{display:inline-block;white-space:pre-wrap}
.cinema-halo{position:absolute;width:220px;height:220px;margin:-110px 0 0 -110px;border-radius:50%;background:radial-gradient(circle,var(--wish-light),transparent 65%);opacity:0;filter:blur(18px)}
.cinema-ring{position:absolute;width:155px;height:155px;margin:-77.5px 0 0 -77.5px;border:1px solid var(--wish-light);border-radius:50%;opacity:0;box-shadow:0 0 16px #dbc9ff25}
#cinema-skip{position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:9;font-size:11px;background:#0b0d2070;color:#cec6dd;padding:7px 13px}
@keyframes cinema-breathe{50%{transform:translateY(-4px) scale(1.15);filter:brightness(1.25)}}
@keyframes cinema-dust{50%{transform:rotate(calc(var(--angle) + 180deg)) translateX(13px)}100%{transform:rotate(calc(var(--angle) + 360deg)) translateX(25px)}}
@media(prefers-reduced-motion:reduce){#cinema-seed:before,#cinema-seed i{animation:none!important}}
`;
document.head.append(style);
const seed=document.createElement('div');seed.id='cinema-seed';seed.setAttribute('aria-hidden','true');
for(let i=0;i<8;i++){const p=document.createElement('i');p.style.setProperty('--angle',i*45+'deg');p.style.setProperty('--delay',-i+'s');seed.append(p);}
$('write').prepend(seed);
$('wish').addEventListener('input',()=>{seed.style.setProperty('--power',$('wish').value.trim()?'.9':'.25');});
let active=null;
const originalFinish=finish,originalCommit=commit,originalSync=sync;
function sound(f,frequencies){
 if(reduced()||!musicOn||!AC||AC.state!=='running'||!master)return;
 try{frequencies.forEach((frequency,i)=>{
  const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
  o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.018/(i+1),t+.09);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);
  o.connect(g);g.connect(master);if(verb)g.connect(verb);o.start(t);o.stop(t+1.5);
  o.onended=()=>{o.disconnect();g.disconnect();};f.sounds.push({o,g});
 });}catch(error){console.warn('[Wish cinema audio]',error);}
}
function wait(f,ms){return new Promise(resolve=>{const item={resolve,id:null};item.id=setTimeout(()=>{f.waiters.delete(item);resolve();},ms);f.waiters.add(item);});}
function play(f,el,frames,options={}){
 if(!el?.animate)return Promise.resolve();const a=el.animate(frames,{duration:700,easing:'ease-in-out',...options});f.animations.push(a);return a.finished.catch(()=>{});
}
function point(a,b,c,t){const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}
function spark(f,x,y,count=20){
 const available=Math.min(count,Math.max(0,f.limit-f.parts.length));
 for(let i=0;i<available;i++){const a=Math.random()*Math.PI*2,s=10+Math.random()*35;f.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-8,life:0,max:.6+Math.random()*.9,r:.5+Math.random()*1.5});}
}
function draw(f,t){
 if(active!==f)return;f.raf=requestAnimationFrame(next=>draw(f,next));
 if(t-f.last<22)return;const dt=Math.min(.05,(t-f.last)/1000);f.last=t;
 const ctx=f.ctx;ctx.clearRect(0,0,innerWidth,innerHeight);
 if(f.flyStart!==null){
  const v=Math.max(0,Math.min(1,(t-f.flyStart)/1700)),q=.5-.5*Math.cos(Math.PI*v),p=point(f.path[0],f.path[1],f.path[2],q);
  f.node.style.transform=tr(p.x,p.y)+' scale('+(1-.72*q)+')';
  f.trail.push(p);if(f.trail.length>30)f.trail.shift();
  for(let i=1;i<f.trail.length;i++){ctx.globalAlpha=i/f.trail.length*.5;ctx.strokeStyle=f.w.color;ctx.lineWidth=.5+2*i/f.trail.length;ctx.beginPath();ctx.moveTo(f.trail[i-1].x,f.trail[i-1].y);ctx.lineTo(f.trail[i].x,f.trail[i].y);ctx.stroke();}
  if(v<1&&f.parts.length<f.limit)spark(f,p.x,p.y,2);
 }
 f.parts=f.parts.filter(p=>p.life<p.max);
 for(const p of f.parts){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=3*dt;ctx.globalAlpha=Math.max(0,1-p.life/p.max)*.8;ctx.fillStyle=f.w.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
 if(f.ripple){const v=Math.min(1,(t-f.ripple.start)/900);ctx.globalAlpha=(1-v)*.5;ctx.strokeStyle=f.w.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(f.ripple.x,f.ripple.y,8+85*v,0,Math.PI*2);ctx.stroke();}
 ctx.globalAlpha=1;
}
function create(w,node,k){
 const layer=document.createElement('div');layer.id='cinema-layer';layer.setAttribute('aria-hidden','true');layer.style.setProperty('--wish-light',w.color);
 const canvas=document.createElement('canvas');layer.append(canvas);document.body.append(layer);
 const d=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*d;canvas.height=innerHeight*d;
 const ctx=canvas.getContext('2d');if(!ctx){layer.remove();throw Error('Canvas unavailable');}ctx.setTransform(d,0,0,d,0,0);
 const skip=document.createElement('button');skip.id='cinema-skip';skip.type='button';skip.textContent='연출 건너뛰기';skip.onclick=()=>finish();document.body.append(skip);
 const f={w,node,key:k,animations:[],waiters:new Set(),sounds:[],parts:[],trail:[],flyStart:null,ripple:null,ctx,layer,skip,limit:innerWidth<600?140:220,last:performance.now(),raf:null,timer:null,oldStage:$('stage').textContent,stageTop:$('stage').style.top};
 active=f;flight=f;phase='animating';f.timer=setTimeout(()=>finish(),8000);f.raf=requestAnimationFrame(t=>draw(f,t));
 $('stage').style.top='62%';$('stage').style.opacity=1;$('whisper').style.opacity=0;$('submit').disabled=true;$('edit').disabled=true;links();return f;
}
finish=function(){
 const f=active;
 if(f){
  active=null;cancelAnimationFrame(f.raf);clearTimeout(f.timer);
  for(const item of f.waiters){clearTimeout(item.id);item.resolve();}f.waiters.clear();
  for(const a of f.animations){try{a.cancel();}catch(_){}}
  for(const {o,g}of f.sounds){try{const t=AC.currentTime;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(.0001,t,.02);o.stop(t+.08);}catch(_){}}
  f.layer.remove();f.skip.remove();$('stage').textContent=f.oldStage;$('stage').style.top=f.stageTop;
 }
 return originalFinish();
};
launch=async function(w,node,k){
 if(reduced()||document.hidden||!node){phase='idle';editing=false;view();sync();return;}
 let f;
 try{
  seed.style.setProperty('--power','.25');f=create(w,node,k);const cx=innerWidth/2,cy=innerHeight*.44;
  node.classList.remove('landed');node.classList.add('presenting');node.disabled=true;node.style.pointerEvents='none';node.style.opacity=0;node.style.transform=tr(cx,cy);
  const svg=node.querySelector('svg');svg.style.cssText='width:100px;height:100px;left:-26px;top:-26px';
  $('panel').style.pointerEvents='none';$('stage').textContent='오늘의 마음이 빛으로 모이고 있어';
  const quote=document.createElement('div');quote.className='cinema-quote';
  const characters=Array.from(w.text),chunk=characters.length>72?3:1;
  for(let i=0;i<characters.length;i+=chunk){const span=document.createElement('span');span.textContent=characters.slice(i,i+chunk).join('');quote.append(span);}f.layer.append(quote);
  void play(f,$('panel'),[{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});
  await play(f,quote,[{opacity:0},{opacity:1}],{duration:500});if(active!==f)return;
  const letters=[...quote.children];
  await Promise.all(letters.map((span,i)=>{const r=span.getBoundingClientRect();spark(f,r.left+r.width/2,r.top+r.height/2,1);return play(f,span,[{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:'translate('+(cx-r.left-r.width/2)+'px,'+(cy-r.top-r.height/2)+'px) scale(.12)'}],{duration:850,delay:Math.min(280,i*8),fill:'forwards'});}));if(active!==f)return;quote.remove();
  const halo=document.createElement('div');halo.className='cinema-halo';halo.style.left=cx+'px';halo.style.top=cy+'px';f.layer.append(halo);
  void play(f,halo,[{opacity:0,transform:'scale(.4)'},{opacity:.17,transform:'scale(1.15)',offset:.65},{opacity:0,transform:'scale(1.4)'}],{duration:2100});
  for(let i=0;i<2;i++){const ring=document.createElement('div');ring.className='cinema-ring';ring.style.left=cx+'px';ring.style.top=cy+'px';f.layer.append(ring);void play(f,ring,[{opacity:0,transform:'rotate('+i*55+'deg) scaleY(.45) scale(.5)'},{opacity:.45,offset:.4,transform:'rotate('+(70+i*55)+'deg) scaleY(.45) scale(1)'},{opacity:0,transform:'rotate('+(160+i*55)+'deg) scaleY(.45) scale(1.3)'}],{duration:2000});}
  $('stage').textContent='너의 소원이 별이 되는 순간';node.style.opacity=1;spark(f,cx,cy,34);sound(f,[523.25,783.99]);
  await Promise.all([play(f,node,[{opacity:0,transform:tr(cx,cy)+' scale(.6)'},{opacity:1,transform:tr(cx,cy)+' scale(1)'}],{duration:1000}),play(f,svg,[{filter:'drop-shadow(0 0 3px var(--c)) brightness(.8)'},{filter:'drop-shadow(0 0 22px var(--c)) brightness(1.35)',offset:.7},{filter:'drop-shadow(0 0 10px var(--c)) brightness(1)'}],{duration:1100})]);if(active!==f)return;
  await wait(f,180);if(active!==f)return;
  $('stage').textContent='오늘의 소원을 하늘에 걸고 있어';const p=dest(w);f.path=[{x:cx,y:cy},{x:(cx+p.x)/2,y:Math.max(65,Math.min(cy,p.y)-85)},p];f.flyStart=performance.now();
  void play(f,$('sky'),[{transform:'scale(1)'},{transform:'scale(1.018) translateY(-3px)'},{transform:'scale(1)'}],{duration:2500});
  await wait(f,1700);if(active!==f)return;f.flyStart=null;f.trail=[];park(node,w);f.key=null;links();f.ripple={...p,start:performance.now()};spark(f,p.x,p.y,28);sound(f,[659.25,880]);
  const nearby=data.filter(x=>x.id!==w.id).map(x=>({w:x,d:Math.hypot(dest(x).x-p.x,dest(x).y-p.y)})).sort((a,b)=>a.d-b.d).slice(0,4);
  nearby.forEach(({w:x},i)=>{const n=nodes.get(key(x,data.indexOf(x)));void play(f,n?.querySelector('svg'),[{opacity:.7},{opacity:1,filter:'drop-shadow(0 0 12px var(--c))',offset:.5},{opacity:1}],{duration:850,delay:i*100});});
  $('stage').textContent='오늘의 마음이 너의 밤하늘에 남았어';
  await wait(f,650);if(active!==f)return;editing=false;view();
  await play(f,$('panel'),[{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,fill:'forwards'});
 }catch(error){console.warn('[Wish cinema fallback]',error);if(!f){if(active)finish();phase='idle';editing=false;$('panel').style.opacity=1;$('panel').style.pointerEvents='auto';view();sync();}}
 finally{if(f&&active===f)finish();}
};
async function pastArrival(w){
 if(reduced()||document.hidden||phase!=='idle'||active)return;
 const node=nodes.get(key(w,data.indexOf(w)));if(!node)return;let f;
 try{f=create(w,node,key(w,data.indexOf(w)));park(node,w);f.key=null;links();const p=dest(w);f.ripple={...p,start:performance.now()};spark(f,p.x,p.y,35);$('stage').textContent='늦게 도착한 마음도 별로 남았어';sound(f,[587.33,880]);await play(f,node.querySelector('svg'),[{filter:'brightness(.7)'},{filter:'drop-shadow(0 0 17px var(--c)) brightness(1.3)',offset:.5},{filter:'brightness(1)'}],{duration:1300});}
 catch(error){console.warn('[Wish past cinema]',error);}
 finally{if(f&&active===f)finish();}
}
commit=async function(change){
 const fromPast=typeof pastBusy!=='undefined'&&pastBusy,wasEditing=editing,before=new Map(data.map(w=>[String(w.id)+'|'+w.date,w.text]));
 const ok=await originalCommit(change);if(!ok)return ok;
 if(fromPast){const added=data.filter(w=>!before.has(String(w.id)+'|'+w.date));if(added.length===1)setTimeout(()=>{if(data.includes(added[0]))void pastArrival(added[0]);},0);}
 else if(wasEditing){const w=data.find(w=>w.date===day);if(w&&!reduced())setTimeout(()=>{const n=nodes.get(key(w,data.indexOf(w)));n?.querySelector('svg')?.animate([{filter:'brightness(.8)'},{filter:'drop-shadow(0 0 15px var(--c)) brightness(1.25)',offset:.5},{filter:'brightness(1)'}],{duration:1200});},0);}
 return ok;
};
sync=function(){const previous=new Set(nodes.keys());const result=originalSync();if(!active&&phase==='idle'&&!reduced())for(const [k,n]of nodes)if(!previous.has(k))n.animate?.([{opacity:0},{opacity:1}],{duration:750});return result;};
function interrupt(){if(active)finish();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
window.addEventListener('resize',interrupt);window.addEventListener('pagehide',interrupt);
motion.addEventListener?.('change',interrupt);
window.FloveWishCinema=Object.freeze({version:1,skip:interrupt});
})();
