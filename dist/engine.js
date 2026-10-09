export const MAX_TRACKS=384;
export const VERSION='slab-elastic-v1';
export function validate(p){for(const [k,lo,hi] of [['n',1,1e9],['seed',0,4294967295],['thickness',0.01,100],['sigma',0,100],['absorb',0,1],['energy',0.001,1000]])if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(`Invalid ${k}: expected ${lo}–${hi}`);if(!Number.isInteger(p.n)||!Number.isInteger(p.seed))throw Error('Histories and seed must be integers');return p;}
export function rng(seed,id){let s=(seed^Math.imul(id+1,0x9e3779b9))>>>0;s^=s>>>16;s=Math.imul(s,0x85ebca6b)>>>0;s^=s>>>13;s=Math.imul(s,0xc2b2ae35)>>>0;s=(s^(s>>>16))>>>0;if(!s)s=1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)+0.5)/4294967296;};}
export function empty(){return {done:0,transmitted:0,absorbed:0,reflected:0,capped:0,scatter:0,collisions:0,path:0,deposited:0,escaped:0,residual:0,heat:Array(640).fill(0),depth:Array(40).fill(0),tracks:[],trace:[]};}
export function merge(a,b){for(const k of ['done','transmitted','absorbed','reflected','capped','scatter','collisions','path','deposited','escaped','residual'])a[k]+=b[k];for(let i=0;i<640;i++)a.heat[i]+=b.heat[i];for(let i=0;i<40;i++)a.depth[i]+=b.depth[i];a.tracks.push(...b.tracks);a.trace.push(...b.trace);return a;}
export function chunk(p,start,end){const out=empty();for(let id=start;id<end;id++){const random=rng(p.seed,id);let x=0,y=0,z=0,dx=1,dy=0,dz=0,steps=0,kind='capped';const sampled=id<MAX_TRACKS,track=sampled?{id,points:[[0,0,0,'source']],kind:''}:null;
 while(steps<10000){const u=random(),distance=p.sigma===0?Infinity:-Math.log(u)/p.sigma;const boundary=dx>0?(p.thickness-x)/dx:dx<0?-x/dx:Infinity;const travel=Math.min(distance,boundary);x+=dx*travel;y+=dy*travel;z+=dz*travel;out.path+=travel;
 if(boundary<=distance){kind=dx>0?'transmitted':'reflected';out.escaped+=p.energy;if(sampled)track.points.push([x,y,z,kind]);break;}
 steps++;out.collisions++;const bin=Math.min(39,Math.max(0,Math.floor(x/p.thickness*40)));out.depth[bin]++;const choice=random();if(id===0&&steps<=12)out.trace.push({step:steps,u,distance,choice,x});
 if(choice<p.absorb){kind='absorbed';out.deposited+=p.energy;const row=Math.min(15,Math.max(0,Math.floor((y/p.thickness+0.5)*16)));out.heat[row*40+bin]+=p.energy;if(sampled)track.points.push([x,y,z,kind]);break;}
 out.scatter++;if(sampled&&track.points.length<256)track.points.push([x,y,z,'scatter']);dx=2*random()-1;const phi=2*Math.PI*random(),s=Math.sqrt(1-dx*dx);dy=s*Math.cos(phi);dz=s*Math.sin(phi);
 }if(kind==='capped')out.residual+=p.energy;out[kind]++;out.done++;if(sampled){track.kind=kind;out.tracks.push(track);}}
 return out;}
