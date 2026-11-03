/* Visual scene engine. Wish storage, coordinates and sync metadata remain owned by the app. */
(() => {
'use strict';
if(window.FloveWishCinema)return;
const moduleURL=document.currentScript?.src,motion=matchMedia('(prefers-reduced-motion:reduce)');
function prefs(){if(window.FloveWishPreferences)return window.FloveWishPreferences.get();try{return JSON.parse(localStorage.getItem('__flove_wish_preferences_v1')||'{}')||{};}catch(_){return {};}}
const reduced=()=>motion.matches||!Element.prototype.animate||prefs().duration==='off';
const el=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
const style=el('style');
style.textContent=`
#wish-depth-mist,#wish-depth-near,#cinema-layer{position:fixed;inset:0;pointer-events:none;overflow:hidden}
#wish-depth-mist{z-index:1;opacity:.55;background:radial-gradient(ellipse at 16% 28%,#6b3e932b,transparent 55%),radial-gradient(ellipse at 84% 70%,#32688b22,transparent 55%);animation:depth-breathe 28s ease-in-out infinite alternate}
#wish-depth-near{z-index:4}#wish-depth-near i{position:absolute;border-radius:50%;background:#dcd1ff;box-shadow:0 0 12px #d2bfff50;animation:depth-float 23s ease-in-out infinite alternate;opacity:.07}
.wish-cinema-quiet #wish-depth-near i:nth-child(n+7){display:none}
.wish-cinema-paused #wish-depth-near i,.wish-cinema-paused #wish-depth-mist,.wish-cinema-still #wish-depth-near i,.wish-cinema-still #wish-depth-mist{animation-play-state:paused}
#cinema-seed{height:54px;position:relative;display:grid;place-items:center;pointer-events:none;--power:.25}
#cinema-seed:before{content:'';width:9px;height:9px;border-radius:50%;background:#fff6df;box-shadow:0 0 12px #e5cfff,0 0 32px #b8a0ec;opacity:calc(.35 + var(--power)*.6);animation:seed-breathe 4s ease-in-out infinite}
#cinema-seed i{position:absolute;width:3px;height:3px;border-radius:50%;background:#e9dcff;opacity:.35;transform:rotate(var(--angle)) translateX(23px);animation:seed-orbit 10s linear infinite;animation-delay:var(--delay)}
#cinema-layer{z-index:4;--wish-light:#e7d4ff}#cinema-layer canvas{position:absolute;inset:0;display:block}
.cinema-quote,.cinema-ending{position:absolute;left:50%;top:33%;transform:translate(-50%,-50%);width:min(80vw,460px);text-align:center;font-size:16px;line-height:2;white-space:pre-wrap;overflow-wrap:anywhere;color:#f4edf9;text-shadow:0 0 16px #d9bfff60}
.cinema-quote span{display:inline-block;white-space:pre-wrap}.cinema-ending{top:44%;font-size:18px;line-height:2.1;letter-spacing:.04em;opacity:0}
#cinema-skip{position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:9;font-size:11px;background:#0b0d2070;color:#cec6dd;padding:7px 13px}
.astro.completed.landed svg{animation:achieved-breathe 6s ease-in-out infinite}
@keyframes depth-breathe{to{opacity:.72}}@keyframes depth-float{to{transform:translate(9px,-14px);opacity:.12}}
@keyframes seed-breathe{50%{transform:translateY(-4px) scale(1.12)}}@keyframes seed-orbit{to{transform:rotate(calc(var(--angle) + 360deg)) translateX(23px)}}
@keyframes achieved-breathe{0%,100%{filter:drop-shadow(0 0 5px #ffe8b1)}50%{filter:drop-shadow(0 0 9px #ffe8b1);opacity:.85}}
@media(prefers-reduced-motion:reduce){#wish-depth-mist,#wish-depth-near i,#cinema-seed:before,#cinema-seed i,.astro.completed.landed svg{animation:none!important}}
#wish-depth-mist{background:radial-gradient(ellipse at 15% 28%,#7951a55c,transparent 58%),radial-gradient(ellipse at 85% 72%,#367ba84a,transparent 58%)}
#wish-depth-far{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
#wish-depth-far i{position:absolute;background:#e4e4ff;border-radius:50%;opacity:.35;animation:depth-far 42s ease-in-out infinite alternate}
#wish-depth-near i{width:18px!important;height:18px!important;background:radial-gradient(circle,#e5dcff,transparent 70%);filter:blur(2.5px);box-shadow:0 0 28px #cfbaff40;opacity:.16}
#wish-depth-near i:nth-child(3n){width:30px!important;height:30px!important;filter:blur(5px)}
.wish-cinema-quiet #wish-depth-far i:nth-child(n+25){display:none}
.wish-cinema-paused #wish-depth-far i,.wish-cinema-still #wish-depth-far i{animation-play-state:paused}
@keyframes depth-far{to{transform:translate(3px,-2px);opacity:.5}}
@keyframes depth-float{from{transform:translate(0,0);opacity:.14}to{transform:translate(24px,-34px);opacity:.23}}
@media(prefers-reduced-motion:reduce){#wish-depth-far i{animation:none!important}}
`;
document.head.append(style);
const mist=el('div'),near=el('div');mist.id='wish-depth-mist';near.id='wish-depth-near';mist.setAttribute('aria-hidden','true');near.setAttribute('aria-hidden','true');
for(let i=0;i<18;i++){const p=el('i');p.style.cssText='left:'+((i*37+11)%97)+'%;top:'+((i*53+17)%93)+'%;width:'+(i%3+2)+'px;height:'+(i%3+2)+'px;animation-delay:-'+i+'s;animation-duration:'+(22+i%7*3)+'s';near.append(p);}document.body.append(mist,near);
const far=el('div');far.id='wish-depth-far';far.setAttribute('aria-hidden','true');let depthSeed=731;const depthRandom=()=>{depthSeed=(Math.imul(depthSeed,1664525)+1013904223)>>>0;return depthSeed/4294967296;};for(let i=0;i<48;i++){const p=el('i'),size=.7+depthRandom();p.style.cssText='left:'+depthRandom()*100+'%;top:'+depthRandom()*100+'%;width:'+size+'px;height:'+size+'px;animation-delay:-'+i+'s';far.append(p);}document.body.append(far);[...near.children].forEach((p,i)=>{const x=parseFloat(p.style.left),y=parseFloat(p.style.top);if(x>30&&x<70&&y>25&&y<75)p.style.left=(i%2?12:88)+'%';});
function depthSettings(){document.body.classList.toggle('wish-cinema-quiet',prefs().density==='quiet');document.body.classList.toggle('wish-cinema-still',reduced());document.body.classList.toggle('wish-cinema-paused',document.hidden);}
depthSettings();document.addEventListener('change',depthSettings);window.addEventListener('storage',depthSettings);
const seed=el('div');seed.id='cinema-seed';seed.setAttribute('aria-hidden','true');for(let i=0;i<8;i++){const p=el('i');p.style.setProperty('--angle',i*45+'deg');p.style.setProperty('--delay',-i+'s');seed.append(p);}$('write').prepend(seed);$('wish').addEventListener('input',()=>seed.style.setProperty('--power',$('wish').value.trim()?'.9':'.25'));
let active=null;
const originalFinish=finish,originalCommit=commit,originalSync=sync,originalDest=dest;
dest=function(w){return active?{x:Math.max(25,Math.min(active.width-25,w.px*active.width)),y:Math.max(110,Math.min(active.height-100,w.py*active.height))}:originalDest(w);};
function scene(f,name,text){if(active!==f)return;f.scene=name;f.sceneStart=performance.now();f.layer.dataset.scene=name;if(text)$('stage').textContent=text;}
function wait(f,ms){return new Promise(resolve=>{const item={resolve,id:0},delay=f.scene==='arrival'&&(ms===1500||ms===1400)?ms*f.rate+(ms===1400?1800:1300):ms*f.rate;item.id=setTimeout(()=>{f.waiters.delete(item);resolve();},delay);f.waiters.add(item);});}
function play(f,node,frames,options={}){if(!node?.animate)return Promise.resolve();const timing={duration:900,easing:'cubic-bezier(.4,0,.2,1)',...options};timing.duration*=f.rate;timing.delay=(timing.delay||0)*f.rate;const a=node.animate(frames,timing);f.animations.push(a);return a.finished.catch(()=>{});}
function sound(f,notes){if(reduced()||prefs().fx===false||!musicOn||!AC||AC.state!=='running'||!master)return;try{notes.forEach((hz,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.015/(i+1),t+.12);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);g.connect(master);if(verb)g.connect(verb);o.start(t);o.stop(t+1.7);o.onended=()=>{o.disconnect();g.disconnect();};f.sounds.push({o,g});});}catch(error){console.warn('[Wish scene audio]',error);}}
function emit(f,x,y,count=20){const n=Math.min(Math.ceil(count*f.density),f.limit-f.parts.length);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=7+Math.random()*25;f.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-4,age:0,life:1+Math.random()*1.1,size:.5+Math.random()*1.3});}}
function curve(a,b,c,t){const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}
function drawCloud(f,t){
 if(!['gather','birth','hold'].includes(f.scene))return;
 const age=(t-f.sceneStart)/f.rate,progress=f.scene==='gather'?Math.min(1,age/1800):1,fade=f.scene==='gather'?1:f.scene==='birth'?Math.max(0,1-age/1700):0;
 if(fade<=0)return;const ctx=f.ctx,color=CSS.supports('color',f.w.color)?f.w.color:'#e7d4ff',radius=Math.max(170,Math.min(380,Math.min(f.width,f.height)*.46)),shrink=1-.94*progress;
 ctx.save();ctx.globalCompositeOperation='screen';
 const haze=ctx.createRadialGradient(f.center.x,f.center.y,0,f.center.x,f.center.y,Math.max(22,radius*(1-.8*progress)));haze.addColorStop(0,color);haze.addColorStop(.28,color);haze.addColorStop(1,'transparent');ctx.globalAlpha=.17*fade;ctx.fillStyle=haze;ctx.fillRect(0,0,f.width,f.height);
 ctx.fillStyle=color;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=10;ctx.lineWidth=1.2;
 for(const c of f.cloud){const a=c.angle+t*.00012,r=radius*(.3+.7*(c.radius-25)/95)*shrink,x=f.center.x+Math.cos(a)*r,y=f.center.y+Math.sin(a)*r*(f.shape==='planet'?.58:1);ctx.globalAlpha=fade*(.3+c.light*.42);ctx.beginPath();ctx.arc(x,y,c.size*1.4,0,Math.PI*2);ctx.fill();if(c.light>.68){ctx.globalAlpha*=.45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(f.center.x+Math.cos(a+.35)*r*.5,f.center.y+Math.sin(a+.35)*r*.5,f.center.x,f.center.y);ctx.stroke();}}
 if(f.shape==='planet'){ctx.globalAlpha=fade*.55;ctx.shadowBlur=14;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(f.center.x,f.center.y,radius*(.5-.35*progress),radius*(.18-.12*progress),-.4,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
function drawWave(f,t){
 if(!f.wave)return;const ctx=f.ctx,p=f.wave,age=t-p.start,duration=1900*f.rate+850,maxRadius=Math.max(170,Math.min(420,Math.min(f.width,f.height)*.46)),color=f.kind==='achieved'?'#ffe6b0':CSS.supports('color',f.w.color)?f.w.color:'#e7d4ff';
 ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=color;ctx.shadowColor=color;
 for(let i=0;i<2;i++){const u=(age-i*200*f.rate)/duration;if(u<0||u>=1)continue;const radius=(12+maxRadius*(1-Math.pow(1-u,1.7)))*(i?.82:1),alpha=.8*(u<.55?1:(1-u)/.45);
  const glow=ctx.createRadialGradient(p.x,p.y,Math.max(0,radius-18),p.x,p.y,radius+18);glow.addColorStop(0,'transparent');glow.addColorStop(.5,color);glow.addColorStop(1,'transparent');ctx.globalAlpha=alpha*.2;ctx.fillStyle=glow;ctx.fillRect(p.x-radius-18,p.y-radius-18,(radius+18)*2,(radius+18)*2);
  ctx.shadowBlur=16;ctx.globalAlpha=alpha*.23;ctx.lineWidth=8;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=alpha;ctx.shadowBlur=6;ctx.lineWidth=i?1.8:2.8;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=alpha*.55;ctx.lineWidth=1.5;if(f.shape==='planet'||f.kind==='achieved'){ctx.beginPath();ctx.ellipse(p.x,p.y,radius*.8,radius*.35,-.4,0,Math.PI*2);ctx.stroke();}else if(f.shape==='star'){for(let j=0;j<4;j++){const a=j*Math.PI/2;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*radius*.85,p.y+Math.sin(a)*radius*.85);ctx.lineTo(p.x+Math.cos(a)*radius*1.12,p.y+Math.sin(a)*radius*1.12);ctx.stroke();}}else{ctx.beginPath();ctx.arc(p.x,p.y,radius*.7,-Math.PI,0);ctx.stroke();}
 }ctx.restore();
}
function render(f,t){
 if(active!==f)return;f.raf=requestAnimationFrame(next=>{try{render(f,next);}catch(error){console.warn('[Wish scene frame]',error);finish();}});if(t-f.last<25)return;const dt=Math.min(.05,(t-f.last)/1000);f.last=t;const ctx=f.ctx;ctx.clearRect(0,0,f.width,f.height);drawCloud(f,t);
 if(f.flyStart!==null){const v=Math.max(0,Math.min(1,(t-f.flyStart)/f.flightMs)),q=f.shape==='comet'?v*v*(3-2*v):.5-.5*Math.cos(Math.PI*v),p=curve(...f.path,q);f.node.style.transform=tr(p.x,p.y)+' scale('+(1-.72*q)+')';f.trail.push(p);const max=f.shape==='comet'?54:f.shape==='planet'?20:34;if(f.trail.length>max)f.trail.shift();for(let i=1;i<f.trail.length;i++){ctx.globalAlpha=i/f.trail.length*(f.shape==='comet'?.55:.3);ctx.strokeStyle=f.w.color;ctx.lineWidth=f.shape==='planet'?.8:1+2*i/f.trail.length;ctx.beginPath();ctx.moveTo(f.trail[i-1].x,f.trail[i-1].y);ctx.lineTo(f.trail[i].x,f.trail[i].y);ctx.stroke();}if(v<1)emit(f,p.x,p.y,f.shape==='comet'?3:1);}
 f.parts=f.parts.filter(p=>p.age<p.life);for(const p of f.parts){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.max(0,1-p.age/p.life)*.65;ctx.fillStyle=f.kind==='achieved'?'#ffe6b0':f.w.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;drawWave(f,t);
}
function create(w,node,k,kind){
 const settings=prefs(),width=innerWidth,height=innerHeight,rate=settings.duration==='short'?.45:1,density=settings.density==='quiet'?.35:1;
 const layer=el('div');layer.id='cinema-layer';layer.setAttribute('aria-hidden','true');layer.style.width=width+'px';layer.style.height=height+'px';layer.style.setProperty('--wish-light',w.color);const canvas=el('canvas');canvas.style.width=width+'px';canvas.style.height=height+'px';const d=Math.min(devicePixelRatio||1,1.5);canvas.width=width*d;canvas.height=height*d;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.setTransform(d,0,0,d,0,0);layer.append(canvas);
 const skip=el('button');skip.id='cinema-skip';skip.type='button';skip.textContent='연출 건너뛰기';skip.onclick=()=>finish();document.body.append(layer,skip);
 const f={w,node,key:k,kind,shape:['star','planet','comet'].includes(w.shape)?w.shape:'star',width,height,rate,density,flightMs:3200*rate,center:{x:width/2,y:height*.44},target:dest(w),ctx,layer,skip,parts:[],trail:[],cloud:[],wave:null,flyStart:null,scene:'intro',sceneStart:performance.now(),animations:[],waiters:new Set(),sounds:[],cleanups:[],limit:Math.round((width<600?150:240)*(density===1?1:.5)),last:performance.now(),raf:null,timer:null,deferredResize:false,oldStage:$('stage').textContent,stageTop:$('stage').style.top};
 for(let i=0;i<Math.round((width<600?64:104)*density);i++)f.cloud.push({angle:Math.random()*Math.PI*2,radius:25+Math.random()*95,light:Math.random(),size:.5+Math.random()*2});
 active=f;flight=f;phase='animating';f.timer=setTimeout(()=>finish(),35000);f.raf=requestAnimationFrame(t=>{try{render(f,t);}catch(error){console.warn('[Wish scene start]',error);finish();}});$('stage').style.top='66%';$('stage').style.opacity=1;$('whisper').style.opacity=0;$('submit').disabled=true;$('edit').disabled=true;$('panel').style.pointerEvents='none';links();depthSettings();return f;
}
finish=function(){
 const f=active;if(!f)return originalFinish();active=null;cancelAnimationFrame(f.raf);clearTimeout(f.timer);for(const p of f.waiters){clearTimeout(p.id);p.resolve();}f.waiters.clear();for(const a of f.animations){try{a.cancel();}catch(_){}}for(const cleanup of f.cleanups){try{cleanup();}catch(_){}}for(const {o,g}of f.sounds){try{const t=AC.currentTime;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(.0001,t,.02);o.stop(t+.08);}catch(_){}}f.layer.remove();f.skip.remove();$('stage').textContent=f.oldStage;$('stage').style.top=f.stageTop;
 const previous=f.node.style.transform;let result;if(f.kind==='replay'){flight=null;park(f.node,f.w);phase='idle';$('stage').style.opacity=0;view();$('panel').style.opacity=1;$('panel').style.pointerEvents='auto';sync();}else result=originalFinish();
 if(f.deferredResize){if(!reduced()&&previous!==f.node.style.transform){try{f.node.animate([{transform:previous},{transform:f.node.style.transform}],{duration:600,easing:'ease-in-out'});}catch(_){}}requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}return result;
};
async function ending(f,text){
 scene(f,'ending');f.parts=[];f.cloud=[];f.trail=[];f.wave=null;$('stage').textContent=text;const caption=el('div','cinema-ending');caption.textContent=text;f.layer.append(caption);
 await play(f,caption,[{opacity:0},{opacity:1}],{duration:1000,fill:'forwards'});if(active!==f)return;await wait(f,2400);if(active!==f)return;await play(f,caption,[{opacity:1},{opacity:0}],{duration:900,fill:'forwards'});if(active!==f)return;caption.remove();await wait(f,180);if(active!==f)return;scene(f,'return');editing=false;view();await play(f,$('panel'),[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000,fill:'forwards'});
}
function response(f){
 const p=f.target;f.wave={...p,start:performance.now()};emit(f,p.x,p.y,f.shape==='comet'?35:20);
 const previous=new Set([...$('links').children]);f.key=null;links();
 for(const line of $('links').children)if(!previous.has(line)){const length=Math.hypot(Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')),Number(line.getAttribute('y2'))-Number(line.getAttribute('y1')));const dash=line.style.strokeDasharray,offset=line.style.strokeDashoffset;line.style.strokeDasharray=String(length);line.style.strokeDashoffset='0';f.cleanups.push(()=>{line.style.strokeDasharray=dash;line.style.strokeDashoffset=offset;});void play(f,line,[{strokeDashoffset:String(length)},{strokeDashoffset:'0'}],{duration:1800});}
 const nearby=data.filter(w=>w.id!==f.w.id).map(w=>({w,d:Math.hypot(dest(w).x-p.x,dest(w).y-p.y)})).sort((a,b)=>a.d-b.d).slice(0,6);nearby.forEach(({w},i)=>{const n=nodes.get(key(w,data.indexOf(w)));void play(f,n?.querySelector('svg'),[{opacity:.6,filter:'brightness(.9)'},{opacity:1,filter:'drop-shadow(0 0 18px var(--c)) brightness(1.5)',offset:.45},{opacity:1,filter:'drop-shadow(0 0 6px var(--c)) brightness(1)'}],{duration:1700,delay:i*240});});void play(f,mist,[{opacity:.55},{opacity:.78,offset:.5},{opacity:.55}],{duration:2600});
}
launch=async function(w,node,k,options={}){
 if(reduced()||document.hidden||!node){phase='idle';editing=false;view();sync();return;}$('wish').blur?.();await new Promise(resolve=>setTimeout(resolve,400));if(document.hidden){phase='idle';editing=false;view();sync();return;}let f;
 try{
  f=create(w,node,k,options.replay?'replay':'new');const {x:cx,y:cy}=f.center;node.classList.remove('landed');node.classList.add('presenting');node.disabled=true;node.style.pointerEvents='none';node.style.opacity=0;node.style.transform=tr(cx,cy);const svg=node.querySelector('svg');svg.style.cssText='width:100px;height:100px;left:-26px;top:-26px';scene(f,'intro','오늘의 마음을 잠시 바라봐');seed.style.setProperty('--power','.25');const quote=el('div','cinema-quote'),letters=Array.from(w.text),chunk=letters.length>72?3:1;for(let i=0;i<letters.length;i+=chunk){const span=el('span');span.textContent=letters.slice(i,i+chunk).join('');quote.append(span);}f.layer.append(quote);
  void play(f,$('panel'),[{opacity:1},{opacity:0}],{duration:900,fill:'forwards'});await play(f,quote,[{opacity:0},{opacity:1}],{duration:900});if(active!==f)return;await wait(f,Math.min(1400,700+letters.length*8));if(active!==f)return;
  scene(f,'gather','작은 빛들이 너의 소원으로 모이고 있어');await Promise.all([...quote.children].map((span,i)=>{const r=span.getBoundingClientRect();return play(f,span,[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:'translate('+(cx-r.left-r.width/2)+'px,'+(cy-r.top-r.height/2)+'px) scale(.1)'}],{duration:1500,delay:Math.min(300,i*8),fill:'forwards'});}));if(active!==f)return;quote.remove();
  scene(f,'birth',f.shape==='planet'?'빛의 중심에 작은 세계가 태어나고 있어':f.shape==='comet'?'너의 마음에 빛의 꼬리가 피어나':'너의 소원이 별이 되는 순간');node.style.opacity=1;sound(f,f.shape==='planet'?[440,659.25]:f.shape==='comet'?[587.33,880]:[523.25,783.99]);emit(f,cx,cy,22);
  const frames=f.shape==='planet'?[{transform:'rotate(-16deg) scale(.65)',opacity:0},{transform:'rotate(0deg) scale(1)',opacity:1}]:f.shape==='comet'?[{transform:'translate(12px,-8px) scale(.6)',opacity:0},{transform:'translate(0,0) scale(1)',opacity:1}]:[{transform:'scale(.5)',opacity:0},{transform:'scale(1)',opacity:1}];
  await Promise.all([play(f,svg,frames,{duration:1700}),play(f,node,[{opacity:0},{opacity:1}],{duration:1700})]);if(active!==f)return;scene(f,'hold');await wait(f,800);if(active!==f)return;
  scene(f,'flight','오늘의 소원을 하늘에 걸고 있어');const p=f.target;f.path=[f.center,{x:(cx+p.x)/2,y:Math.max(65,Math.min(cy,p.y)-(f.shape==='planet'?55:90))},p];f.flyStart=performance.now();if(f.shape==='planet')void play(f,svg,[{transform:'rotate(-8deg)'},{transform:'rotate(7deg)',offset:.55},{transform:'rotate(0)'}],{duration:3200});await wait(f,3200);if(active!==f)return;f.flyStart=null;f.trail=[];park(node,w);
  scene(f,'arrival','');response(f);sound(f,[659.25,880]);await play(f,$('stage'),[{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});if(active!==f)return;await wait(f,1500);if(active!==f)return;await ending(f,'오늘의 마음이\n너의 밤하늘에 남았어.');
 }catch(error){console.warn('[Wish scene fallback]',error);if(!f){if(active)finish();phase='idle';editing=false;$('panel').style.opacity=1;$('panel').style.pointerEvents='auto';view();sync();}}
 finally{if(f&&active===f)finish();}
};
function busy(){return phase!=='idle'||editing||!!flight||pending!==null||!!$('wish').value.trim()||(!$('pastForm')?.hidden&&!!$('pastWish')?.value.trim());}
async function shortScene(w,kind){
 if(reduced()||document.hidden||busy())return;const node=nodes.get(key(w,data.indexOf(w)));if(!node)return;let f;
 try{if(kind==='achieved'&&$('dataDialog').open)$('dataDialog').close();f=create(w,node,key(w,data.indexOf(w)),kind);park(node,w);scene(f,'arrival');$('stage').style.opacity=0;void play(f,$('panel'),[{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});response(f);sound(f,kind==='achieved'?[523.25,659.25]:[587.33,880]);await wait(f,1400);if(active!==f)return;await ending(f,kind==='achieved'?'그날의 마음이\n오늘에 닿았어.':'늦게 도착한 마음도\n너의 밤하늘에 남았어.');}
 catch(error){console.warn('[Wish short scene]',error);}
 finally{if(f&&active===f)finish();}
}
const identity=w=>String(w.id)+'|'+w.date;
commit=async function(change){
 const fromPast=typeof pastBusy!=='undefined'&&pastBusy,wasEditing=editing,canAchieve=day>END&&phase==='idle'&&!editing,before=new Map(data.map(w=>[identity(w),{text:w.text,done:!!w.done}]));const ok=await originalCommit(change);if(!ok)return ok;
 let chosen,kind;
 if(fromPast){const added=data.filter(w=>!before.has(identity(w)));if(added.length===1){chosen=added[0];kind='past';}}
 else if(canAchieve){chosen=data.find(w=>before.has(identity(w))&&!before.get(identity(w)).done&&w.done);kind='achieved';}
 if(chosen){const id=identity(chosen);setTimeout(()=>{const live=data.find(w=>identity(w)===id);if(live&&(kind!=='achieved'||live.done))void shortScene(live,kind);},0);}
 else if(wasEditing){const w=data.find(w=>w.date===day);if(w&&!reduced())setTimeout(()=>{const n=nodes.get(key(w,data.indexOf(w)));n?.querySelector('svg')?.animate([{filter:'brightness(.85)'},{filter:'drop-shadow(0 0 12px var(--c)) brightness(1.2)',offset:.5},{filter:'brightness(1)'}],{duration:1600});},0);}
 return ok;
};
sync=function(){const previous=new Set(nodes.keys()),result=originalSync();if(!active&&phase==='idle'&&!reduced())for(const [k,n]of nodes)if(!previous.has(k))n.animate?.([{opacity:0},{opacity:1}],{duration:1000});return result;};
function interrupt(){if(active)finish();}
window.addEventListener('resize',event=>{if(active&&Math.abs(innerWidth-active.width)<4){active.deferredResize=true;event.stopImmediatePropagation();}},true);document.addEventListener('visibilitychange',()=>{depthSettings();if(document.hidden)interrupt();});window.addEventListener('resize',interrupt);window.addEventListener('pagehide',interrupt);motion.addEventListener?.('change',()=>{depthSettings();interrupt();});
async function replay(){if(busy()){toast('진행 중인 작업을 먼저 마쳐 주세요.');return false;}if(reduced()||document.hidden){toast('연출 생략 또는 움직임 줄이기 설정에서는 재생하지 않아요.');return false;}const w=data.find(w=>w.date===day);if(!w)return false;const k=key(w,data.indexOf(w)),node=nodes.get(k);if(!node)return false;phase='animating';view();await launch({...w},node,k,{replay:true});return true;}
window.FloveWishCinema=Object.freeze({version:5,skip:interrupt,replay});
try{if(moduleURL&&!document.getElementById('wish-extras-loader')){const from=new URL(moduleURL),url=new URL('wish-extras.js',from);if(from.searchParams.has('flove_build'))url.searchParams.set('flove_build',from.searchParams.get('flove_build'));const script=el('script');script.id='wish-extras-loader';script.src=url.href;script.onerror=()=>console.warn('[Wish extras unavailable]');document.head.append(script);}}catch(error){console.warn('[Wish extras loader]',error);}
})();
