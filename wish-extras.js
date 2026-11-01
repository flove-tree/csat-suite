/* Optional local preferences, replay menu, calendar and PNG keepsake. */
(() => {
'use strict';
function preferences(x={}){return {duration:['slow','short','off'].includes(x?.duration)?x.duration:'slow',density:x?.density==='quiet'?'quiet':'rich',volume:Number.isFinite(x?.volume)?Math.max(0,Math.min(1,x.volume)):.55,fx:x?.fx!==false};}
function monthCells(year,month){
 const offset=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7,days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 return [...Array(offset).fill(null),...Array.from({length:days},(_,i)=>year+'-'+String(month+1).padStart(2,'0')+'-'+String(i+1).padStart(2,'0'))];
}
function wrap(ctx,text,width,limit=3){
 const lines=[];let line='';
 for(const c of Array.from(text)){if(ctx.measureText(line+c).width>width&&line){lines.push(line);line=c;}else line+=c;}
 if(line)lines.push(line);if(lines.length<=limit)return lines;
 const out=lines.slice(0,limit);while(out[limit-1]&&ctx.measureText(out[limit-1]+'…').width>width)out[limit-1]=Array.from(out[limit-1]).slice(0,-1).join('');out[limit-1]+='…';return out;
}
if(typeof module==='object'&&module.exports){module.exports={preferences,monthCells,wrap};return;}
if(window.FloveWishExtras||!document.getElementById('dataDialog'))return;
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
const PREF='__flove_wish_preferences_v1';let pref;
try{pref=preferences(JSON.parse(localStorage.getItem(PREF)||'{}'));}catch(_){pref=preferences();}
const host=$('dataDialog'),settings=el('details'),settingsTitle=el('summary','음악 · 연출 설정'),settingStatus=el('p');settings.append(settingsTitle);host.append(settings);
function field(label,node){const box=el('label',label+' ');box.style.cssText='display:block;margin:10px 0;font-size:12px';box.append(node);settings.append(box);return node;}
function select(items){const n=el('select');for(const [value,label] of items){const o=el('option',label);o.value=value;n.append(o);}n.style.cssText='font:inherit;color:inherit;background:#17192b;border:1px solid #ffffff35;border-radius:8px;padding:7px';return n;}
const duration=field('보내기 연출',select([['slow','천천히'],['short','짧게'],['off','생략']])),density=field('별가루',select([['rich','풍성하게'],['quiet','은은하게']]));
const volume=el('input');volume.type='range';volume.min='0';volume.max='100';volume.step='1';field('음악 크기',volume);
const fx=el('input');fx.type='checkbox';field('음악을 켰을 때 연출 효과음 함께 재생',fx);
settings.append(el('small','이 설정은 현재 기기에만 저장돼요. 음악은 기존 ♫ 버튼으로 켜고 꺼요.'),settingStatus);
function volumeNow(){try{if(AC&&master&&musicOn){master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(pref.volume*.9,AC.currentTime,.15);}}catch(_){} }
function paint(){duration.value=pref.duration;density.value=pref.density;volume.value=String(Math.round(pref.volume*100));fx.checked=pref.fx;}
function save(){pref=preferences({duration:duration.value,density:density.value,volume:Number(volume.value)/100,fx:fx.checked});volumeNow();try{localStorage.setItem(PREF,JSON.stringify(pref));settingStatus.textContent='이 기기에 설정을 저장했어요.';}catch(_){settingStatus.textContent='설정 저장 실패 · 이번 화면에서는 선택한 설정을 사용해요.';}}
for(const n of [duration,density,volume,fx])n.onchange=save;
volume.oninput=()=>{pref={...pref,volume:Math.max(0,Math.min(1,Number(volume.value)/100))};volumeNow();};
const oldMusic=$('music').onclick;$('music').onclick=async function(event){await oldMusic.call(this,event);volumeNow();};
paint();window.addEventListener('storage',event=>{if(event.key===PREF){try{pref=preferences(JSON.parse(event.newValue||'{}'));paint();volumeNow();}catch(_){}}});
window.FloveWishPreferences=Object.freeze({get:()=>({...pref})});
const replayDialog=el('dialog'),replay=el('button','오늘 별의 탄생 다시 보기'),replayClose=el('button','닫기');replay.type=replayClose.type='button';replayDialog.append(el('h2','오늘의 별'),el('p','소원과 별 위치는 그대로 두고 연출만 다시 감상해요.'),replay,replayClose);document.body.append(replayDialog);
replayClose.onclick=()=>replayDialog.close();replay.onclick=async()=>{replayDialog.close();try{await window.FloveWishCinema.replay();}catch(error){toast('다시 보기를 마치지 못했어요. 저장된 소원은 유지돼요.');console.warn('[Wish replay]',error);}};
const emblem=$('emblem');emblem.removeAttribute('aria-hidden');emblem.setAttribute('role','button');emblem.tabIndex=0;emblem.setAttribute('aria-label','오늘 별의 연출 다시 보기');emblem.style.cursor='pointer';
function openReplay(){if(phase==='idle'&&data.some(w=>w.date===day)&&!replayDialog.open)replayDialog.showModal();}
emblem.addEventListener('click',openReplay);emblem.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openReplay();}});
const calendar=el('details'),calendarTitle=el('summary','별빛 달력'),bar=el('div'),previous=el('button','‹'),next=el('button','›'),monthLabel=el('span'),grid=el('div'),selected=el('div');
for(const n of [previous,next])n.type='button';previous.setAttribute('aria-label','이전 달');next.setAttribute('aria-label','다음 달');bar.append(previous,monthLabel,next);grid.style.cssText='display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:10px 0';calendar.append(calendarTitle,bar,grid,selected);host.insertBefore(calendar,$('records'));
let year=Number(day.slice(0,4)),month=Number(day.slice(5,7))-1,selectedDate=null;
function busy(){return phase!=='idle'||editing||!!flight||pending!==null||!!$('wish').value.trim()||(!$('pastForm')?.hidden&&!!$('pastWish')?.value.trim());}
function showDate(date){
 selectedDate=date;selected.replaceChildren(el('p',date));const wishes=data.filter(w=>w.date===date);
 if(wishes.length){for(const w of wishes){const p=el('p',w.text),find=el('button','이 별 보기');find.type='button';find.onclick=()=>{if(busy()){toast('작성·저장·비교 중인 작업을 먼저 마쳐 주세요.');return;}const live=data.find(x=>String(x.id)===String(w.id)&&x.date===w.date);if(!live){toast('기록이 바뀌었어요. 날짜를 다시 선택해 주세요.');return;}host.close();const k=key(live,data.indexOf(live)),n=nodes.get(k);openWish(k);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)n?.animate?.([{opacity:.5},{opacity:1,filter:'brightness(1.3)',offset:.5},{opacity:1}],{duration:1200});};selected.append(p,find);}return;}
 if(date<today()&&date<=END){const add=el('button','이날 소원 남기기');add.type='button';add.onclick=()=>{if(busy()){toast('작성 중인 내용을 먼저 저장하거나 취소해 주세요.');return;}if($('pastForm').hidden)$('openPast').click();$('pastDate').value=date;$('pastDate').dispatchEvent(new Event('change'));$('pastWish').focus();$('pastForm').scrollIntoView?.({block:'nearest'});};selected.append(el('small','이날의 소원은 아직 없어요.'),add);}
 else selected.append(el('small',date===today()?'오늘 소원은 메인 화면에서 남길 수 있어요.':'아직 소원을 남길 수 없는 날짜예요.'));
}
function renderCalendar(){
 monthLabel.textContent=year+'년 '+(month+1)+'월';grid.replaceChildren();
 for(const name of ['월','화','수','목','금','토','일'])grid.append(el('small',name));
 const dates=new Set(data.map(w=>w.date));
 for(const date of monthCells(year,month)){if(date===null){grid.append(el('span'));continue;}const b=el('button',String(Number(date.slice(8)))+(dates.has(date)?' ✦':''));b.type='button';b.style.cssText='min-width:0;padding:8px 0;font-size:11px;margin:0';b.setAttribute('aria-label',date+(dates.has(date)?' 소원 있음':' 소원 없음'));if(date===day)b.style.borderColor='#d6bfff';b.onclick=()=>showDate(date);grid.append(b);}
 if(selectedDate)showDate(selectedDate);
}
function moveMonth(delta){const d=new Date(Date.UTC(year,month+delta,1));year=d.getUTCFullYear();month=d.getUTCMonth();selectedDate=null;selected.replaceChildren();renderCalendar();}
previous.onclick=()=>moveMonth(-1);next.onclick=()=>moveMonth(1);calendar.addEventListener('toggle',()=>{if(calendar.open)renderCalendar();});
const originalRecords=records;records=function(){const result=originalRecords();if(calendar.open)renderCalendar();return result;};
const image=el('details'),imageTitle=el('summary','내 밤하늘 이미지 저장'),sentence=select([['','소원 문장 포함 안 함']]),saveImage=el('button','밤하늘 PNG 저장'),imageStatus=el('p');saveImage.type='button';
image.append(imageTitle,el('p','버튼·기록 창 없이 별빛만 이미지로 남겨요. 이미지 저장은 데이터 백업과 별개예요.'),sentence,saveImage,imageStatus);host.append(image);
image.addEventListener('toggle',()=>{if(!image.open)return;sentence.replaceChildren();const empty=el('option','소원 문장 포함 안 함');empty.value='';sentence.append(empty);for(const [i,w]of data.entries()){const o=el('option',w.date+' · '+w.text.slice(0,30));o.value=String(w.id)+'|'+w.date;sentence.append(o);}sentence.value='';});
function drawStar(ctx,w,x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=w.color||'#e4d5ff';ctx.strokeStyle=w.color||'#e4d5ff';ctx.shadowColor=w.color||'#e4d5ff';ctx.shadowBlur=10;
 if(w.shape==='planet'){ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(0,0,13,4,-.4,0,Math.PI*2);ctx.lineWidth=1;ctx.stroke();}
 else if(w.shape==='comet'){const g=ctx.createLinearGradient(0,0,23,-20);g.addColorStop(0,w.color||'#e4d5ff');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-3,2);ctx.quadraticCurveTo(9,-19,25,-22);ctx.quadraticCurveTo(16,-2,3,5);ctx.fill();ctx.fillStyle=w.color||'#e4d5ff';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();}
 else{ctx.beginPath();ctx.moveTo(0,-12);ctx.bezierCurveTo(2,-3,3,-2,12,0);ctx.bezierCurveTo(3,2,2,3,0,12);ctx.bezierCurveTo(-2,3,-3,2,-12,0);ctx.bezierCurveTo(-3,-2,-2,-3,0,-12);ctx.fill();}
 if(w.done){ctx.shadowBlur=0;ctx.strokeStyle='#fff0c780';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(0,0,15,11,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
async function png(){
 if(busy()){toast('작성·저장·연출·비교를 마친 뒤 저장해 주세요.');return;}
 const rows=data.map(w=>({...w})),include=sentence.value===''?null:rows.find(w=>String(w.id)+'|'+w.date===sentence.value);
 if(sentence.value!==''&&!include){imageStatus.textContent='선택한 소원이 바뀌었어요. 이미지 메뉴를 다시 열어 주세요.';return;}
 if(include&&!window.confirm('선택한 소원 문장을 이미지에 포함할까요? 공유 시 다른 사람에게 보일 수 있어요.'))return;
 saveImage.disabled=true;imageStatus.textContent='밤하늘 이미지를 만들고 있어요…';
 try{
  const scale=Math.min(2,1800/innerWidth,2400/innerHeight),W=Math.round(innerWidth*scale),H=Math.round(innerHeight*scale),cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  ctx.fillStyle='#060919';ctx.fillRect(0,0,W,H);for(const [x,y,color] of [[.2,.3,'#42236388'],[.85,.7,'#15456888']]){const g=ctx.createRadialGradient(W*x,H*y,0,W*x,H*y,Math.max(W,H)*.65);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  let seed=20261102;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<260;i++){ctx.fillStyle='rgba(228,229,255,'+(.2+random()*.6)+')';ctx.beginPath();ctx.arc(random()*W,random()*H,(.3+random()*.7)*scale,0,Math.PI*2);ctx.fill();}
  const stars=rows.map(w=>({w,p:dest(w)}));
  if(showLines&&stars.length>1){const used=new Set([0]);while(used.size<stars.length){let best;for(const a of used)for(let b=0;b<stars.length;b++)if(!used.has(b)){const d=Math.hypot(stars[a].p.x-stars[b].p.x,stars[a].p.y-stars[b].p.y);if(!best||d<best.d)best={a,b,d};}used.add(best.b);ctx.strokeStyle='#e3cef155';ctx.lineWidth=scale*.7;ctx.beginPath();ctx.moveTo(stars[best.a].p.x*scale,stars[best.a].p.y*scale);ctx.lineTo(stars[best.b].p.x*scale,stars[best.b].p.y*scale);ctx.stroke();}}
  for(const {w,p}of stars)drawStar(ctx,w,p.x*scale,p.y*scale,scale);
  ctx.textAlign='center';ctx.fillStyle='#ddd6ed';ctx.font=14*scale+'px sans-serif';ctx.fillText('내가 모은 별빛',W/2,H*.08);
  if(include){ctx.font=15*scale+'px sans-serif';const lines=wrap(ctx,include.text,W*.8,3);ctx.fillStyle='#eee8f7';lines.forEach((line,i)=>ctx.fillText(line,W/2,H*.87+i*23*scale));}
  const dates=rows.map(w=>w.date).sort();ctx.font=10*scale+'px sans-serif';ctx.fillStyle='#b4aec6';ctx.fillText(dates.length?dates[0]+' — '+dates.at(-1):'별을 기다리는 밤',W/2,H-22*scale);
  const blob=await new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(Error('PNG 생성 실패')),'image/png'));
  const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='나의_별빛_'+today()+'.png';a.target='_blank';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);imageStatus.textContent='PNG를 만들었어요. 모바일에서 미리보기가 열리면 공유·이미지 저장을 이용해 주세요.';
 }catch(error){imageStatus.textContent='이미지를 저장하지 못했어요. 소원 기록은 유지돼요.';console.warn('[Wish PNG]',error);}finally{saveImage.disabled=false;}
}
saveImage.onclick=png;
window.FloveWishExtras=Object.freeze({version:1});
})();
