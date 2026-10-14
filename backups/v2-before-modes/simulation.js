export const DT = 1 / 60;
export const RADIUS = .065;
export const STATES = ['READY', 'PLAYING', 'GAMEOVER', 'CLEAR'];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
import { START, GOAL, ARENA, GATE, FIRE_ZONES, WATER_ZONES, CHECKPOINTS, ZONES, fireActive, stageIndex, stageBoxes, box } from './stage.js';
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
 constructor(){this.staticBoxes=stageBoxes();this.reset();}
 reset(){this.state='READY';this.time=0;this.attemptTime=0;this.p={...START};this.v={x:0,y:0,z:0};this.grounded=true;this.jumps=0;this.water=100;this.lastInput=-10;this.lastKey='';this.combo=0;this.alternations=0;this.successes=0;this.dead=false;this.suspicion=100;this.chef={x:0,y:ARENA.y,z:-9.22,state:'WAITING',timer:0,nextThrow:6,active:false};this.knives=[];this.events=[];this.reason='';this.deathCause=null;this.score=0;this.stroke=0;this.strokeSide=1;this.still=0;this.yaw=0;this.gateOpened=false;this.checkpoint=null;this.checkpointId=0;this.attempts=1;this.stage=0;this.seenStages=new Set([0]);this.stageMessageUntil=9;this.burning=false;this.heatNotice=-10;this.debugPaused=false;}
 get boxes(){return this.gateOpened?this.staticBoxes:[...this.staticBoxes,box(GATE.id,GATE.x,GATE.y,GATE.z,GATE.sx,GATE.sy,GATE.sz,'gate')];}
 start(){this.reset();this.state='PLAYING';this.emit('stage',{index:0});}
 retry(){
  if(!this.checkpoint){this.start();return;}
  const saved=this.checkpoint,elapsed=this.time,attempts=this.attempts+1;
  this.reset();this.state='PLAYING';this.p={...saved.p};this.time=elapsed;this.attempts=attempts;this.checkpoint=saved;this.checkpointId=saved.id;this.successes=saved.successes;this.alternations=saved.alternations;this.seenStages=new Set(saved.seenStages);this.stage=stageIndex(this.p);this.stageMessageUntil=this.time+7;this.chef.nextThrow=this.time+3;this.emit('retry',{id:saved.id});
 }
 emit(type,data={}){this.events.push({type,...data});}
 setChef(state){if(this.chef.state!==state){this.chef.state=state;this.chef.timer=0;this.emit('chef',{state});}}
 input(key,yaw=this.yaw){
  if(this.state!=='PLAYING'||!['A','D'].includes(key)||this.time-this.lastInput<.12)return false;
  const gap=this.time-this.lastInput,alt=key!==this.lastKey&&gap>=.16&&gap<=.4;
  const bonus=alt?1+.5*(1-Math.abs(gap-.28)/.12):key===this.lastKey?.72:1;
  const surprise=this.chef.state==='INSPECTING'&&this.chef.timer>=.45&&this.chef.timer<=.85;
  if(this.chef.state==='INSPECTING'&&this.chef.timer>.85){this.finish('GAMEOVER','拾い上げられた！跳ねるタイミングが遅かった。','CAPTURE');return false;}
  this.lastInput=this.time;this.lastKey=key;this.dead=false;this.still=0;this.yaw=yaw;this.stroke=.42;this.strokeSide=key==='A'?1:-1;
  this.emit('stroke',{key});
  if(alt){this.combo++;this.alternations++;this.emit('combo',{combo:this.combo});}else this.combo=0;
  const force=.65*bonus*(surprise?1.8:1);this.v.x-=Math.sin(yaw)*force;this.v.z-=Math.cos(yaw)*force;
  const speed=Math.hypot(this.v.x,this.v.z);if(speed>3.2){this.v.x*=3.2/speed;this.v.z*=3.2/speed;}
  if(this.grounded||this.jumps<2){this.v.y=this.grounded?2.6:2.3;this.jumps=this.grounded?1:2;this.grounded=false;this.water=Math.max(0,this.water-.25);this.emit('jump');}
  if(surprise){this.successes++;this.suspicion=100;this.setChef('STUNNED');if(this.stage>=3&&!this.gateOpened){this.gateOpened=true;this.emit('gate');}this.emit('surprise');}
  else if(['SUSPICIOUS','APPROACHING','INSPECTING'].includes(this.chef.state)){this.suspicion=100;this.setChef('CHASING');this.chef.nextThrow=this.time+3;}
  return true;
 }
 step(dt=DT){
  if(this.state!=='PLAYING')return;
  this.time+=dt;this.attemptTime+=dt;this.stroke=Math.max(0,this.stroke-dt);
  const wasGrounded=this.grounded,landingSpeed=this.v.y,boxes=this.boxes;
  this.v.y-=9.8*dt;const friction=this.grounded?4-2.5*this.water/100:.4;this.v.x*=Math.exp(-friction*dt);this.v.z*=Math.exp(-friction*dt);this.grounded=false;
  const steps=Math.max(1,Math.ceil(Math.hypot(this.v.x,this.v.y,this.v.z)*dt/(RADIUS*.45)));
  for(let i=0;i<steps;i++){this.p.x+=this.v.x*dt/steps;this.p.y+=this.v.y*dt/steps;this.p.z+=this.v.z*dt/steps;for(const bb of boxes)if(resolveSphere(this.p,this.v,bb))this.grounded=true;}
  if(this.grounded){this.jumps=0;if(!wasGrounded&&landingSpeed<-.4)this.emit('land');}
  this.still=this.grounded&&Math.hypot(this.v.x,this.v.z)<.15?this.still+dt:0;
  this.dead=this.grounded&&this.still>=.8&&this.time-this.lastInput>=.8;
  const inWater=WATER_ZONES.some(w=>Math.abs(this.p.x-w.x)<w.sx/2&&Math.abs(this.p.z-w.z)<w.sz/2&&Math.abs(this.p.y-(w.y+RADIUS))<.10);
  this.water=clamp(this.water+(inWater?15:-1.5)*dt,0,100);
  this.burning=FIRE_ZONES.some(f=>fireActive(f,this.time)&&Math.hypot(this.p.x-f.x,this.p.z-f.z)<f.radius+RADIUS&&this.p.y>f.base-RADIUS&&this.p.y<f.base+f.height+RADIUS);
  if(this.burning){this.water=Math.max(0,this.water-18*dt);if(this.time-this.heatNotice>.4){this.heatNotice=this.time;this.emit('heat');}}
  this.suspicion=clamp(this.suspicion+(this.dead?-22*Math.max(.4,1-.2*this.successes):25)*dt,0,100);
  this.updateProgress();this.updateChef(dt);this.updateKnives(dt);
  if(this.state!=='PLAYING')return;
  if(this.water<=0)this.finish('GAMEOVER','水分を失った。水たまりで回復し、炎が消えるのを待とう。','DRY');
  else if(this.p.y<.4)this.finish('GAMEOVER','足場を外した！着地点を見て2段ジャンプしよう。','FALL');
  else if(this.gateOpened&&this.grounded&&this.p.y<GOAL.y+RADIUS+.025&&Math.hypot(this.p.x-GOAL.x,this.p.z-GOAL.z)<GOAL.radius)this.finish('CLEAR');
 }
 updateProgress(){
  const n=stageIndex(this.p);this.stage=n;
  if(!this.seenStages.has(n)){this.seenStages.add(n);this.stageMessageUntil=this.time+8;this.emit('stage',{index:n});}
  for(const c of CHECKPOINTS)if(c.id>this.checkpointId&&this.grounded&&Math.abs(this.p.x-c.p.x)<c.sx/2&&Math.abs(this.p.z-c.p.z)<c.sz/2&&Math.abs(this.p.y-c.p.y)<.08){this.checkpointId=c.id;this.checkpoint={id:c.id,p:{...c.p},successes:this.successes,alternations:this.alternations,seenStages:[...this.seenStages]};this.emit('checkpoint',{id:c.id,name:c.name});}
 }
 chefReachable(p){return p.x>=ARENA.minX&&p.x<=ARENA.maxX&&p.z>=ARENA.minZ&&p.z<=ARENA.maxZ;}
 moveChef(dt,speed){const c=this.chef,dx=this.p.x-c.x,dz=this.p.z-c.z,dist=Math.hypot(dx,dz);if(dist<.60)return;const n=dist||1;c.x=clamp(c.x+dx/n*speed*dt,ARENA.minX,ARENA.maxX);c.z=clamp(c.z+dz/n*speed*dt,ARENA.minZ,ARENA.maxZ);}
 updateChef(dt){
  const c=this.chef;
  if(!c.active){if(this.p.z<-7.94&&this.p.y>.4){c.active=true;c.nextThrow=this.time+6;c.timer=0;this.setChef('WAITING');}else return;}
  c.timer+=dt;
  if(c.state==='WAITING'){if(c.timer>=3)this.setChef('CHASING');return;}
  if(c.state==='STUNNED'){if(c.timer>=2){this.setChef('CHASING');c.nextThrow=this.time+3;}return;}
  if(c.state==='INSPECTING'){if(!this.dead){this.setChef('CHASING');c.nextThrow=this.time+3;}else if(c.timer>=1.2)this.finish('GAMEOVER','料理人に拾い上げられた。手を伸ばしてから「今だ！」の合図で跳ねよう。','CAPTURE');return;}
  if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.30&&this.p.y>c.y+.02&&this.p.y<c.y+1.65&&!this.dead){this.finish('GAMEOVER','料理人に直接捕まった。死んだふりで油断させよう。','CAPTURE');return;}
  if(c.state==='ATTACKING'){
   if(this.dead&&this.suspicion<70){this.setChef('SUSPICIOUS');return;}
   if(c.timer>=.6){const origin={x:c.x,y:c.y+1.08,z:c.z},dx=this.p.x-origin.x,dy=this.p.y-origin.y,dz=this.p.z-origin.z,len=Math.hypot(dx,dy,dz)||1;this.knives.push({p:origin,v:{x:dx/len*3.5,y:dy/len*3.5,z:dz/len*3.5},life:4,angle:0});this.emit('throw');this.setChef('CHASING');c.nextThrow=this.time+3;}return;
  }
  if(this.suspicion<30&&this.dead){this.setChef('APPROACHING');this.moveChef(dt,.7);if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.65&&Math.abs(this.p.y-(c.y+RADIUS))<.25)this.setChef('INSPECTING');return;}
  if(this.suspicion<70&&this.dead){this.setChef('SUSPICIOUS');return;}
  this.setChef('CHASING');this.moveChef(dt,1.1);if(this.time>=c.nextThrow){this.setChef('ATTACKING');this.emit('warning');}
 }
 updateKnives(dt){
  this.knives=this.knives.filter(k=>{const old={...k.p};k.p.x+=k.v.x*dt;k.p.y+=k.v.y*dt;k.p.z+=k.v.z*dt;k.life-=dt;k.angle+=8*dt;
   if(segmentSphere(old,k.p,this.p,RADIUS+.025)){this.finish('GAMEOVER','投げられた包丁に当たった。赤い予告線から跳ねて離れよう。','KNIFE');return false;}
   return k.life>0&&!this.boxes.some(bb=>segmentBox(old,k.p,bb,.008));
  });
 }
 finish(state,reason='',cause=null){if(this.state!=='PLAYING')return;this.state=state;this.reason=reason;this.deathCause=state==='GAMEOVER'?cause:null;this.score=Math.max(0,Math.floor(state==='CLEAR'?5000+Math.max(0,300-this.time)*30+this.water*10+this.successes*500+this.alternations*20-(this.attempts-1)*250:this.attemptTime*10+this.successes*300+this.alternations*10));this.emit('finish',{state,cause});}
}
