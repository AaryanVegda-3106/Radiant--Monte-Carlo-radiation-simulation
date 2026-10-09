import {MATERIALS,BEAMS} from './presets.js';
const palette={transmitted:'#29edb9',absorbed:'#ff6088',reflected:'#b888ff',capped:'#b1c7dc',scatter:'#ffc052',source:'#d7edff'};
// Animation is a repeated playback of sampled histories, not additional histories.
export function createTransportView(canvas,controls){
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let time=0,last=0,paused=reduced.matches,cache=null,cacheKey='',cacheCount=-1,paths=[];
 function syncButton(){controls.pause.textContent=paused?'▶ Play motion':'Ⅱ Pause motion';controls.pause.setAttribute('aria-pressed',String(paused));}
 syncButton();controls.pause.onclick=()=>{paused=!paused;syncButton();};
 controls.replay.onclick=()=>{time=0;paused=reduced.matches;syncButton();};
 function reset(){time=0;cache=null;}
 function dot(x,y,r,color,glow=0){ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 function line(points,color,alpha,width=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.globalAlpha=1;}
 function draw(now,current){
  const dt=last?Math.min(80,now-last):0;last=now;if(!paused)time+=dt*Number(controls.speed.value);
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;
  const dpr=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const p=current?.p||{thickness:10,material:'concrete',particle:'neutral'},L=p.thickness;
  const material=MATERIALS[p.material]||MATERIALS.custom,beam=BEAMS[p.particle]||BEAMS.neutral;
  const project=(x,y,z)=>[w*.25+x/L*w*.51+z/L*w*.11,h*.57-y/L*h*.58-z/L*h*.16];
  const box=[[0,-L*.42,-L*.35],[L,-L*.42,-L*.35],[L,L*.42,-L*.35],[0,L*.42,-L*.35],[0,-L*.42,L*.35],[L,-L*.42,L*.35],[L,L*.42,L*.35],[0,L*.42,L*.35]].map(q=>project(...q));
  const bg=ctx.createRadialGradient(w*.48,h*.53,5,w*.48,h*.53,w*.65);bg.addColorStop(0,material.color+'18');bg.addColorStop(1,'#030910');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(let i=0;i<11;i++)line([[w*.08,h*.81+i*8],[w*.96,h*.69+i*8]],'#43688f',.18,.6);
  for(const face of [[0,1,2,3],[3,2,6,7],[0,3,7,4]]){ctx.beginPath();face.forEach((k,i)=>i?ctx.lineTo(...box[k]):ctx.moveTo(...box[k]));ctx.closePath();ctx.fillStyle=material.color+(face[0]===0?'13':'09');ctx.fill();}
  for(let i=1;i<12;i++){const x=L*i/12;line([project(x,-L*.42,-L*.35),project(x,L*.42,-L*.35)],material.color,.09,.6);}
  for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])line([box[a],box[b]],material.color,.48,1);
  const tracks=current?.result.tracks||[],count=Math.min(Number(controls.density.value),tracks.length);
  controls.note.textContent=tracks.length?`${count} sampled histories · ${paused?'motion paused':'looping playback'} · visual time scale`:'Run a simulation to animate sampled histories';
  const key=[w,h,L,p.particle,count].join('|');
  if(cache!==tracks||cacheKey!==key||cacheCount!==tracks.length){cache=tracks;cacheKey=key;cacheCount=tracks.length;
   paths=tracks.slice(0,count).map(t=>{const oy=(((t.id*.61803398875)%1)-.5)*L*.64,oz=(((t.id*.41421356237)%1)-.5)*L*.55;
    const pts=[{q:project(-L*.36,oy,oz),kind:'source'},...t.points.map(q=>({q:project(q[0],q[1]+oy,q[2]+oz),kind:q[3]}))];
    if(['transmitted','reflected'].includes(t.kind)){const end=pts.at(-1).q;pts.push({q:[end[0]+(t.kind==='transmitted'?1:-1)*w*.16,end[1]],kind:t.kind});}
    let length=0;for(let i=0;i<pts.length;i++){if(i)length+=Math.hypot(pts[i].q[0]-pts[i-1].q[0],pts[i].q[1]-pts[i-1].q[1]);pts[i].at=length;}
    return {id:t.id,kind:t.kind,pts,length:Math.max(length,1)};
   });
  }
  ctx.save();ctx.beginPath();ctx.rect(0,42,w,h-80);ctx.clip();
  // A source aperture, not a simulated material boundary.
  const sourceX=w*.075,sourceTop=h*.30,sourceBottom=h*.80;
  line([[sourceX,sourceTop],[sourceX,sourceBottom]],beam.color,.55,2);
  for(let i=0;i<11;i++)dot(sourceX,sourceTop+i*(sourceBottom-sourceTop)/10,1.5,beam.color,6);
  for(const path of paths){const {pts,length,id,kind}=path,color=palette[kind]||palette.capped;
   if(controls.trails.checked)line(pts.map(p=>p.q),color,.055,.7);
   if(paused&&reduced.matches&&time===0){line(pts.map(p=>p.q),color,.34,.9);dot(...pts.at(-1).q,1.7,color);continue;}
   const duration=4800+(id%11)*147,phase=((time/duration+(id*.61803398875)%1)%1),travel=phase*1.24*length;
   const tail=Math.max(0,travel-length*.19),head=Math.min(travel,length);let headPoint=null,headKind='source';
   for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],segment=b.at-a.at;if(segment<.001)continue;
    const from=Math.max(tail,a.at),to=Math.min(head,b.at);if(to<from)continue;
    const at=d=>{const u=(d-a.at)/segment;return [a.q[0]+(b.q[0]-a.q[0])*u,a.q[1]+(b.q[1]-a.q[1])*u];};
    const q1=at(from),q2=at(to),c=i===1?beam.color:color;
    const grad=ctx.createLinearGradient(...q1,...q2);grad.addColorStop(0,c+'08');grad.addColorStop(1,c+'dc');ctx.strokeStyle=grad;ctx.lineWidth=i===1?1.15:1.45;ctx.beginPath();ctx.moveTo(...q1);ctx.lineTo(...q2);ctx.stroke();
    if(travel<=b.at&&travel>=a.at){headPoint=at(travel);headKind=i===1?'source':kind;}
   }
   if(headPoint){const c=headKind==='source'?beam.color:color;dot(...headPoint,4.3,c+'18');dot(...headPoint,1.85,c,7);dot(...headPoint,.75,'#ffffff');}
   for(let i=2;i<pts.length;i++){const event=pts[i];if(!['scatter','absorbed'].includes(event.kind))continue;const age=(travel-event.at)/length;if(age<0||age>.07)continue;
    const fade=1-age/.07,c=palette[event.kind],r=2+(1-fade)*10;ctx.globalAlpha=fade*.6;ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.arc(...event.q,r,0,Math.PI*2);ctx.stroke();dot(...event.q,2.2,c,9);ctx.globalAlpha=1;
   }
  }
  ctx.restore();ctx.globalAlpha=1;ctx.font='10px DM Sans';ctx.fillStyle=beam.color;ctx.fillText('INCIDENT BEAM',w*.035,h*.24);ctx.fillStyle=material.color;ctx.fillText(material.name.toUpperCase(),w*.46,h*.23);ctx.fillStyle='#8aaccf';ctx.fillText('EXIT',w*.86,h*.82);
 }
 return {draw,reset};
}
