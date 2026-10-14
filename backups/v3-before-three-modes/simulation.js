import { DT, RADIUS, INSPECTION } from './physics-config.js';
export { DT, RADIUS } from './physics-config.js';

export const STATES = ['READY', 'PLAYING', 'GAMEOVER', 'CLEAR'];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
import { createStage, fireActive, stageIndex, box } from './stage.js';
export { stageBoxes, box } from './stage.js';
export function segmentSphere(a,b,p,r) {
 const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
 const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);
 return Math.hypot(a.x+t*dx-p.x,a.y+t*dy-p.y,a.z+t*dz-p.z)<=r;
}
export function segmentBox(a,b,bb,pad=0) {
 let lo=0,hi=1;
 for(const k of ['x','y','z']) {const d=b[k]-a[k];if(Math.abs(d)<1e-9){if(a[k]<bb.min[k]-pad||a[k]>bb.max[k]+pad)return false;}else{let t1=(bb.min[k]-pad-a[k])/d,t2=(bb.max[k]+pad-a[k])/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false;}}
 return true;
}
export function resolveSphere(p,v,bb) {
 const q={x:clamp(p.x,bb.min.x,bb.max.x),y:clamp(p.y,bb.min.y,bb.max.y),z:clamp(p.z,bb.min.z,bb.max.z)};
 let dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z,d=Math.hypot(dx,dy,dz);
 if(d>=RADIUS-1e-8)return false;
 if(d<1e-8){const faces=[['x',bb.min.x-RADIUS,-1],['x',bb.max.x+RADIUS,1],['y',bb.min.y-RADIUS,-1],['y',bb.max.y+RADIUS,1],['z',bb.min.z-RADIUS,-1],['z',bb.max.z+RADIUS,1]].sort((a,b)=>Math.abs(p[a[0]]-a[1])-Math.abs(p[b[0]]-b[1]));const [axis,value,sign]=faces[0];p[axis]=value;dx=axis==='x'?sign:0;dy=axis==='y'?sign:0;dz=axis==='z'?sign:0;d=1;}
 else {const push=(RADIUS-d)/d;p.x+=dx*push;p.y+=dy*push;p.z+=dz*push;}
 const nx=dx/d,ny=dy/d,nz=dz/d,into=v.x*nx+v.y*ny+v.z*nz;
 if(into<0){v.x-=into*nx;v.y-=into*ny;v.z-=into*nz;}
 return ny>.5;
}
export class Simulation {
 constructor(mode='ESCAPE'){this.reset(mode);}
 reset(mode=this.mode||'ESCAPE'){
  this.mode=mode;this.stageData=createStage(mode);this.staticBoxes=this.stageData.boxes;this.state='READY';this.time=0;this.attemptTime=0;this.p={...this.stageData.start};this.v={x:0,y:0,z:0};this.grounded=true;this.jumps=0;this.water=100;this.lastInput=-10;this.lastKey='';this.combo=0;this.alternations=0;this.successes=0;this.dead=false;this.knives=[];this.events=[];this.reason='';this.deathCause=null;this.culpritId=null;this.score=0;this.stroke=0;this.strokeSide=1;this.still=0;this.yaw=0;this.openGates=new Set();this.checkpoint=null;this.checkpointId=0;this.attempts=1;this.stage=0;this.seenStages=new Set([0]);this.stageMessageUntil=7;this.burning=false;this.hot=false;this.debugPaused=false;this.nextSpawn=30;
  this.chefs=mode==='SURVIVAL'?[this.makeChef(0,{x:4,y:.85,z:-4},null,true)]:this.stageData.arenas.map((a,i)=>this.makeChef(i,a.spawn,a,false));
 }
 makeChef(id,p,arena,active){return {...p,id,arena,active,state:'WAITING',timer:0,nextThrow:this.time+6,suspicion:100,successes:0,wait:3,heading:0,speed:0,lastThrow:-10,pathTarget:null,navPath:[]};}
 get chef(){if(this.culpritId!==null)return this.chefs.find(c=>c.id===this.culpritId)||this.chefs[0];return [...this.chefs].sort((a,b)=>Math.hypot(a.x-this.p.x,a.z-this.p.z)-Math.hypot(b.x-this.p.x,b.z-this.p.z))[0];}
 get suspicion(){return this.chef.suspicion;}set suspicion(v){this.chef.suspicion=v;}
 get gateOpened(){return this.openGates.has('chef-gate');}set gateOpened(v){v?this.openGates.add('chef-gate'):this.openGates.delete('chef-gate');}
 get boxes(){return [...this.staticBoxes,...this.stageData.gates.filter(g=>!this.openGates.has(g.id)).map(g=>box(g.id,g.x,g.y,g.z,g.sx,g.sy,g.sz,'gate'))];}
 start(mode=this.mode){this.reset(mode);this.state='PLAYING';this.emit('stage',{index:0});}
 retry(){
  if(this.mode==='SURVIVAL'||!this.checkpoint){this.start(this.mode);return;}
  const saved=this.checkpoint,elapsed=this.time,attempts=this.attempts+1;
  this.reset(this.mode);this.state='PLAYING';this.p={...saved.p};this.time=elapsed;this.attempts=attempts;this.checkpoint=saved;this.checkpointId=saved.id;this.successes=saved.successes;this.alternations=saved.alternations;this.openGates=new Set(saved.openGates);this.seenStages=new Set(saved.seenStages);this.stage=stageIndex(this.p);this.stageMessageUntil=this.time+7;
  for(const c of this.chefs){if(c.arena.gateId&&this.openGates.has(c.arena.gateId)){c.active=true;c.state='CHASING';c.nextThrow=this.time+6;}}
  this.emit('retry',{id:saved.id});
 }
 emit(type,data={}){this.events.push({type,...data});}
 setChef(state,c=this.chef){if(c.state!==state){c.state=state;c.timer=0;this.emit('chef',{state,id:c.id});}}
 input(key,yaw=this.yaw){
  if(this.state!=='PLAYING'||!['A','D'].includes(key)||this.time-this.lastInput<.12)return false;
  const inspectors=this.chefs.filter(c=>c.state==='INSPECTING'&&Math.hypot(c.x-this.p.x,c.z-this.p.z)<.95);
  const surprised=inspectors.filter(c=>c.timer>=INSPECTION.start&&c.timer<=INSPECTION.end);
  const gap=this.time-this.lastInput,alt=key!==this.lastKey&&gap>=.16&&gap<=.4,bonus=alt?1+.5*(1-Math.abs(gap-.28)/.12):key===this.lastKey?.72:1;
  this.lastInput=this.time;this.lastKey=key;this.dead=false;this.still=0;this.yaw=yaw;this.stroke=.44;this.strokeSide=key==='A'?1:-1;this.emit('stroke',{key});
  if(alt){this.combo++;this.alternations++;this.emit('combo',{combo:this.combo});}else this.combo=0;
  const force=.65*bonus*(surprised.length?1.8:1);this.v.x-=Math.sin(yaw)*force;this.v.z-=Math.cos(yaw)*force;const speed=Math.hypot(this.v.x,this.v.z);if(speed>3.2){this.v.x*=3.2/speed;this.v.z*=3.2/speed;}
  if(this.grounded||this.jumps<2){this.v.y=this.grounded?2.6:2.3;this.jumps=this.grounded?1:2;this.grounded=false;this.water=Math.max(0,this.water-.25);this.emit('jump');}
  if(surprised.length){this.successes++;for(const c of surprised){c.successes++;c.suspicion=100;this.setChef('STUNNED',c);if(c.arena?.gateId&&!this.openGates.has(c.arena.gateId)){this.openGates.add(c.arena.gateId);this.emit('gate',{id:c.arena.gateId});}}this.emit('surprise',{ids:surprised.map(c=>c.id)});}
  for(const c of this.chefs)if(!surprised.includes(c)&&['SUSPICIOUS','APPROACHING','INSPECTING'].includes(c.state)){c.suspicion=100;this.setChef('CHASING',c);c.nextThrow=this.time+3;}
  return true;
 }
 step(dt=DT){
  if(this.state!=='PLAYING')return;
  if(this.water<=0){this.finish('GAMEOVER','水分を失った。水たまりで回復しよう。','DRY');return;}
  this.time+=dt;this.attemptTime+=dt;this.stroke=Math.max(0,this.stroke-dt);
  const wasGrounded=this.grounded,landingSpeed=this.v.y,boxes=this.boxes;
  this.v.y-=9.8*dt;const friction=this.grounded?4-2.5*this.water/100:.4;this.v.x*=Math.exp(-friction*dt);this.v.z*=Math.exp(-friction*dt);this.grounded=false;
  const steps=Math.max(1,Math.ceil(Math.hypot(this.v.x,this.v.y,this.v.z)*dt/(RADIUS*.45)));
  for(let i=0;i<steps;i++){this.p.x+=this.v.x*dt/steps;this.p.y+=this.v.y*dt/steps;this.p.z+=this.v.z*dt/steps;for(const bb of boxes)if(resolveSphere(this.p,this.v,bb))this.grounded=true;}
  if(this.grounded){this.jumps=0;if(!wasGrounded&&landingSpeed<-.4)this.emit('land');}
  this.still=this.grounded&&Math.hypot(this.v.x,this.v.z)<.15?this.still+dt:0;this.dead=this.grounded&&this.still>=.8&&this.time-this.lastInput>=.8;
  const inWater=this.stageData.water.some(w=>Math.abs(this.p.x-w.x)<w.sx/2&&Math.abs(this.p.z-w.z)<w.sz/2&&Math.abs(this.p.y-(w.y+RADIUS))<.10);
  this.burning=this.stageData.fires.some(f=>fireActive(f,this.time)&&Math.hypot(this.p.x-f.x,this.p.z-f.z)<f.radius+RADIUS&&this.p.y>f.base-RADIUS&&this.p.y<f.base+f.height+RADIUS);
  this.hot=this.stageData.fires.some(f=>Math.hypot(this.p.x-f.x,this.p.z-f.z)<f.heatRadius&&this.p.y>f.base-.12&&this.p.y<f.base+.95);
  this.water=clamp(this.water+((inWater?15:-1.5)-(this.hot?6:0))*dt,0,100);
  if(this.burning){this.finish('GAMEOVER','炎に触れてしまった。赤い輪の外か、炎が消えるタイミングで通ろう。','FIRE');return;}
  if(this.water<=0){this.finish('GAMEOVER','水分を失った。青い水たまりで回復し、高温エリアを短く通ろう。','DRY');return;}
  if(this.p.y<.4){this.finish('GAMEOVER','足場を外した。着地点を見て2段ジャンプしよう。','FALL');return;}
  this.updateProgress();this.updateSpawns();
  for(const c of this.chefs){c.suspicion=clamp(c.suspicion+(this.dead?-22*Math.max(.4,1-.2*c.successes):25)*dt,0,100);this.updateChef(dt,c);if(this.state!=='PLAYING')break;}
  this.updateKnives(dt);if(this.state!=='PLAYING')return;
  const goal=this.stageData.goal;
  if(this.mode==='ESCAPE'&&this.stageData.gates.every(g=>this.openGates.has(g.id))&&goal&&this.grounded&&this.p.y<goal.y+RADIUS+.025&&Math.hypot(this.p.x-goal.x,this.p.z-goal.z)<goal.radius)this.finish('CLEAR');
 }
 updateProgress(){if(this.mode==='SURVIVAL')return;const n=stageIndex(this.p);this.stage=n;if(!this.seenStages.has(n)){this.seenStages.add(n);this.stageMessageUntil=this.time+7;this.emit('stage',{index:n});}
  for(const cp of this.stageData.checkpoints)if(cp.id>this.checkpointId&&this.grounded&&Math.abs(this.p.x-cp.p.x)<cp.sx/2&&Math.abs(this.p.z-cp.p.z)<cp.sz/2&&Math.abs(this.p.y-cp.p.y)<.08){this.checkpointId=cp.id;this.checkpoint={id:cp.id,p:{...cp.p},successes:this.successes,alternations:this.alternations,openGates:[...this.openGates],seenStages:[...this.seenStages]};this.emit('checkpoint',{id:cp.id,name:cp.name});}
 }
 updateSpawns(){if(this.mode!=='SURVIVAL')return;while(this.chefs.length<8&&this.time+1e-7>=this.nextSpawn){if(!this.spawnChef())break;this.nextSpawn+=30;}}
 spawnChef(){
  const candidates=[...this.stageData.nodes.flatMap(n=>[[0,0],[-.8,-.8],[.8,.8],[-.8,.8],[.8,-.8]].map(([x,z])=>({x:n.x+x,z:n.z+z}))),...this.stageData.platforms.filter(b=>b.id.startsWith('bridge')).map(b=>({x:b.center.x,z:b.center.z}))];
  const valid=candidates.filter(p=>Math.hypot(p.x-this.p.x,p.z-this.p.z)>=3.2&&this.chefs.every(c=>Math.hypot(p.x-c.x,p.z-c.z)>.65)&&!this.stageData.fires.some(f=>fireActive(f,this.time)&&Math.hypot(p.x-f.x,p.z-f.z)<f.radius+.35));
  valid.sort((a,b)=>Math.hypot(b.x-this.p.x,b.z-this.p.z)-Math.hypot(a.x-this.p.x,a.z-this.p.z));
  const p=valid[0];if(!p)return false;
  const c=this.makeChef(this.chefs.length,{x:p.x,y:this.surfaceAt(p),z:p.z},null,true);c.wait=2.5;c.nextThrow=this.time+6;this.chefs.push(c);this.emit('spawn',{id:c.id,p:{x:c.x,y:c.y,z:c.z},distance:Math.hypot(c.x-this.p.x,c.z-this.p.z)});return true;
 }
 surfaceAt(p){const heights=this.stageData.platforms.filter(b=>p.x>=b.min.x&&p.x<=b.max.x&&p.z>=b.min.z&&p.z<=b.max.z).map(b=>b.max.y);return heights.length?Math.max(...heights):null;}
 chefReachable(p,c=this.chef){if(this.mode==='ESCAPE'){const a=c.arena;return p.x>=a.minX&&p.x<=a.maxX&&p.z>=a.minZ&&p.z<=a.maxZ;}return [[0,0],[.28,0],[-.28,0],[0,.28],[0,-.28],[.20,.20],[.20,-.20],[-.20,.20],[-.20,-.20]].every(([x,z])=>this.surfaceAt({x:p.x+x,z:p.z+z})!==null);}
 pathBetween(from,to){const queue=[[from]],visited=new Set([from]);while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path;for(const edge of this.stageData.edges){const next=edge[0]===last?edge[1]:edge[1]===last?edge[0]:null;if(next!==null&&!visited.has(next)){visited.add(next);queue.push([...path,next]);}}}return [];}
 moveChef(dt,speed,c=this.chef){
  const oldX=c.x,oldZ=c.z;c.speed=0;if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.64)return;
  let dest=this.p;
  if(this.mode==='SURVIVAL'){
   const nearest=p=>[...this.stageData.nodes].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];const target=nearest(this.p),from=nearest(c);
   if(c.pathTarget!==target.id){c.pathTarget=target.id;c.navPath=this.pathBetween(from.id,target.id).slice(1);}
   while(c.navPath.length&&Math.hypot(c.x-this.stageData.nodes[c.navPath[0]].x,c.z-this.stageData.nodes[c.navPath[0]].z)<.18)c.navPath.shift();
   if(c.navPath.length)dest=this.stageData.nodes[c.navPath[0]];
  }
  const dx=dest.x-c.x,dz=dest.z-c.z,len=Math.hypot(dx,dz)||1,nx=c.x+dx/len*speed*dt,nz=c.z+dz/len*speed*dt;
  if(this.chefReachable({x:nx,z:nz},c)){c.x=nx;c.z=nz;}else if(this.mode==='ESCAPE'){c.x=clamp(nx,c.arena.minX,c.arena.maxX);c.z=clamp(nz,c.arena.minZ,c.arena.maxZ);}else{if(this.chefReachable({x:nx,z:c.z},c))c.x=nx;if(this.chefReachable({x:c.x,z:nz},c))c.z=nz;}
  c.y=this.mode==='SURVIVAL'?this.surfaceAt(c):c.arena.y;c.speed=Math.hypot(c.x-oldX,c.z-oldZ)/dt;c.heading=Math.atan2(-(c.x-oldX),-(c.z-oldZ));
 }
 updateChef(dt,c=this.chef){
  if(!c.active){if(this.p.z<c.arena.entry){c.active=true;c.nextThrow=this.time+6;c.timer=0;this.setChef('WAITING',c);}else return;}
  c.timer+=dt;c.speed=0;
  if(c.state==='WAITING'){if(c.timer>=c.wait)this.setChef('CHASING',c);return;}
  if(c.state==='STUNNED'){if(c.timer>=INSPECTION.stun){this.setChef('CHASING',c);c.nextThrow=this.time+3;}return;}
  if(c.state==='INSPECTING'){if(!this.dead){this.setChef('CHASING',c);c.nextThrow=this.time+3;}else if(c.timer>=INSPECTION.capture){this.culpritId=c.id;this.finish('GAMEOVER','拾い上げられた。「今だ！」が出ている約1秒間にA / Dで跳ねよう。','CAPTURE');}return;}
  if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.30&&this.p.y>c.y+.02&&this.p.y<c.y+1.65&&!this.dead){this.culpritId=c.id;this.finish('GAMEOVER','料理人に直接捕まった。死んだふりで油断させよう。','CAPTURE');return;}
  if(c.state==='ATTACKING'){if(this.dead&&c.suspicion<70){this.setChef('SUSPICIOUS',c);return;}if(c.timer>=.6){const origin={x:c.x,y:c.y+1.2,z:c.z},dx=this.p.x-origin.x,dy=this.p.y-origin.y,dz=this.p.z-origin.z,len=Math.hypot(dx,dy,dz)||1;this.knives.push({p:origin,v:{x:dx/len*3.5,y:dy/len*3.5,z:dz/len*3.5},life:4,angle:0,owner:c.id});c.lastThrow=this.time;this.emit('throw',{id:c.id});this.setChef('CHASING',c);c.nextThrow=this.time+3;}return;}
  if(c.suspicion<30&&this.dead){this.setChef('APPROACHING',c);this.moveChef(dt,.7,c);if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.70&&Math.abs(this.p.y-(c.y+RADIUS))<.25)this.setChef('INSPECTING',c);return;}
  if(c.suspicion<70&&this.dead){this.setChef('SUSPICIOUS',c);return;}
  this.setChef('CHASING',c);this.moveChef(dt,1.1,c);if(this.time>=c.nextThrow){this.setChef('ATTACKING',c);this.emit('warning',{id:c.id});}
 }
 updateKnives(dt){if(this.state!=='PLAYING')return;this.knives=this.knives.filter(k=>{const old={...k.p};k.p.x+=k.v.x*dt;k.p.y+=k.v.y*dt;k.p.z+=k.v.z*dt;k.life-=dt;k.angle+=8*dt;if(segmentSphere(old,k.p,this.p,RADIUS+.025)){this.culpritId=k.owner??null;this.finish('GAMEOVER','投げられた包丁に当たった。赤い予告線から跳ねて離れよう。','KNIFE');return false;}return k.life>0&&!this.boxes.some(bb=>segmentBox(old,k.p,bb,.008));});}
 finish(state,reason='',cause=null){if(this.state!=='PLAYING')return;if(this.mode==='SURVIVAL'&&state==='CLEAR')return;this.state=state;this.reason=reason;this.deathCause=state==='GAMEOVER'?cause:null;this.score=Math.max(0,Math.floor(state==='CLEAR'?5000+Math.max(0,480-this.time)*30+this.water*10+this.successes*500+this.alternations*20-(this.attempts-1)*250:this.attemptTime*10+this.successes*300+this.alternations*10));this.emit('finish',{state,cause});}
}
