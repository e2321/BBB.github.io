export const DT = 1 / 60;
export const RADIUS = .065;
export const STATES = ['READY', 'PLAYING', 'GAMEOVER', 'CLEAR'];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const box = (id, x, y, z, sx, sy, sz) => ({ id, min: { x:x-sx/2, y:y-sy/2, z:z-sz/2 }, max: { x:x+sx/2, y:y+sy/2, z:z+sz/2 }, center:{x,y,z}, size:{x:sx,y:sy,z:sz} });
export function stageBoxes() {
 return [box('floor',0,-.1,0,12,.2,10),box('prep',0,.425,1.8,5.5,.85,2.8),box('board',0,.88,2.1,1.5,.06,1),box('bridge',-1.5,.425,.05,1.25,.85,.9),box('stove',1.5,.425,-1.3,2.5,.85,2),box('basin',-1.5,.50,-1.3,2.5,.1,2),box('sink-left',-2.7,.775,-1.3,.1,.45,2),box('sink-right',-.3,.775,-1.3,.1,.45,2),box('sink-back',-1.5,.775,-2.25,2.5,.45,.1),box('sink-front',-1.5,.775,-.35,2.5,.45,.1),box('wall-back',0,1.6,-4.7,12,3.2,.15),box('wall-left',-5.8,1.6,0,.15,3.2,10),box('wall-right',5.8,1.6,0,.15,3.2,10)];
}
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
 constructor(){this.boxes=stageBoxes();this.reset();}
 reset(){this.state='READY';this.time=0;this.p={x:0,y:.975,z:2.35};this.v={x:0,y:0,z:0};this.grounded=true;this.jumps=0;this.water=100;this.lastInput=-10;this.lastKey='';this.combo=0;this.alternations=0;this.successes=0;this.dead=false;this.suspicion=100;this.chef={x:0,y:.85,z:1.1,state:'WAITING',timer:0,nextThrow:6};this.knives=[];this.events=[];this.reason='';this.score=0;this.stroke=0;this.strokeSide=1;this.still=0;this.yaw=0;}
 start(){this.reset();this.state='PLAYING';}
 emit(type,data={}){this.events.push({type,...data});}
 setChef(state){if(this.chef.state!==state){this.chef.state=state;this.chef.timer=0;this.emit('chef',{state});}}
 input(key,yaw=this.yaw){
  if(this.state!=='PLAYING'||this.time-this.lastInput<.12)return false;
  const gap=this.time-this.lastInput,alt=key!==this.lastKey&&gap>=.16&&gap<=.4;
  const bonus=alt?1+ .5*(1-Math.abs(gap-.28)/.12):key===this.lastKey?.72:1;
  const surprise=this.chef.state==='INSPECTING'&&this.chef.timer>=.45&&this.chef.timer<=.85;
  if(this.chef.state==='INSPECTING'&&this.chef.timer>.85){this.finish('GAMEOVER','拾い上げられた！跳ねるタイミングが遅かった。');return false;}
  this.lastInput=this.time;this.lastKey=key;this.dead=false;this.still=0;this.yaw=yaw;this.stroke=.42;this.strokeSide=key==='A'?1:-1;
  if(alt){this.combo++;this.alternations++;this.emit('combo',{combo:this.combo});}else this.combo=0;
  const force=.65*bonus*(surprise?1.8:1);this.v.x-=Math.sin(yaw)*force;this.v.z-=Math.cos(yaw)*force;
  const speed=Math.hypot(this.v.x,this.v.z);if(speed>3.2){this.v.x*=3.2/speed;this.v.z*=3.2/speed;}
  if(this.grounded||this.jumps<2){this.v.y=this.grounded?2.6:2.3;this.jumps=this.grounded?1:2;this.grounded=false;this.water=Math.max(0,this.water-.25);this.emit('jump');}
  if(surprise){this.successes++;this.suspicion=100;this.setChef('STUNNED');this.emit('surprise');}
  else if(['SUSPICIOUS','APPROACHING','INSPECTING'].includes(this.chef.state)){this.suspicion=100;this.setChef('CHASING');this.chef.nextThrow=this.time+3;}
  return true;
 }
 step(dt=DT){
  if(this.state!=='PLAYING')return;
  this.time+=dt;this.stroke=Math.max(0,this.stroke-dt);
  const wasGrounded=this.grounded;const landingSpeed=this.v.y;
  this.v.y-=9.8*dt;const friction=this.grounded?4-2.5*this.water/100:.4;this.v.x*=Math.exp(-friction*dt);this.v.z*=Math.exp(-friction*dt);
  this.grounded=false;
  const steps=Math.max(1,Math.ceil(Math.hypot(this.v.x,this.v.y,this.v.z)*dt/(RADIUS*.45)));
  for(let i=0;i<steps;i++){this.p.x+=this.v.x*dt/steps;this.p.y+=this.v.y*dt/steps;this.p.z+=this.v.z*dt/steps;for(const bb of this.boxes)if(resolveSphere(this.p,this.v,bb))this.grounded=true;}
  if(this.grounded){this.jumps=0;if(!wasGrounded&&landingSpeed<-.4)this.emit('land');}
  this.still=this.grounded&&Math.hypot(this.v.x,this.v.z)<.15?this.still+dt:0;
  this.dead=this.grounded&&this.still>=.8&&this.time-this.lastInput>=.8;
  const inWater=this.p.x>-2.64&&this.p.x<-.36&&this.p.z>-2.19&&this.p.z<-.41&&this.p.y<.72;
  this.water=clamp(this.water+(inWater?15:-1.5)*dt,0,100);
  this.suspicion=clamp(this.suspicion+(this.dead?-22*Math.max(.4,1-.2*this.successes):25)*dt,0,100);
  this.updateChef(dt);this.updateKnives(dt);
  if(this.state!=='PLAYING')return;
  if(this.water<=0)this.finish('GAMEOVER','干からびてしまった。シンクの水で潤そう。');
  else if(this.p.y<.4)this.finish('GAMEOVER','台から落ちた！接続台を通ってシンクへ。');
  else if(this.grounded&&this.p.y<.64&&Math.hypot(this.p.x+1.5,this.p.z+1.5)<.18)this.finish('CLEAR');
 }
 chefReachable(p){return (p.x>=-2.47&&p.x<=2.47&&p.z>=.68&&p.z<=2.92)||(p.x>=-1.82&&p.x<=-1.18&&p.z>=-.03&&p.z<=.8);}
 moveChef(dt,speed){const c=this.chef,dx=this.p.x-c.x,dz=this.p.z-c.z,dist=Math.hypot(dx,dz);if(dist<.6)return;const n=dist||1;let nx=c.x+dx/n*speed*dt,nz=c.z+dz/n*speed*dt;if(this.chefReachable({x:nx,z:nz})){c.x=nx;c.z=nz;}else{nx=clamp(nx,-2.47,2.47);nz=clamp(nz,.68,2.92);c.x=nx;c.z=nz;}}
 updateChef(dt){
  const c=this.chef;c.timer+=dt;
  if(c.state==='WAITING'){if(this.time>=3)this.setChef('CHASING');return;}
  if(c.state==='STUNNED'){if(c.timer>=2){this.setChef('CHASING');c.nextThrow=this.time+3;}return;}
  if(c.state==='INSPECTING'){if(!this.dead){this.setChef('CHASING');c.nextThrow=this.time+3;}else if(c.timer>=1.2)this.finish('GAMEOVER','死んだふりを見抜かれ、捕まった！手が伸びた瞬間にA / D。');return;}
  if(c.state==='ATTACKING'){
   if(this.dead&&this.suspicion<70){this.setChef('SUSPICIOUS');return;}
   if(c.timer>=.6){const origin={x:c.x,y:c.y+1.08,z:c.z},dx=this.p.x-origin.x,dy=this.p.y-origin.y,dz=this.p.z-origin.z,len=Math.hypot(dx,dy,dz)||1;this.knives.push({p:origin,v:{x:dx/len*3.5,y:dy/len*3.5,z:dz/len*3.5},life:4,angle:0});this.emit('throw');this.setChef('CHASING');c.nextThrow=this.time+3;}return;
  }
  if(this.suspicion<30&&this.dead){this.setChef('APPROACHING');this.moveChef(dt,.7);if(Math.hypot(c.x-this.p.x,c.z-this.p.z)<.65&&Math.abs(this.p.y-(c.y+.065))<.25)this.setChef('INSPECTING');return;}
  if(this.suspicion<70&&this.dead){this.setChef('SUSPICIOUS');return;}
  this.setChef('CHASING');this.moveChef(dt,1.1);
  if(this.time>=c.nextThrow){this.setChef('ATTACKING');this.emit('warning');}
 }
 updateKnives(dt){
  this.knives=this.knives.filter(k=>{const old={...k.p};k.p.x+=k.v.x*dt;k.p.y+=k.v.y*dt;k.p.z+=k.v.z*dt;k.life-=dt;k.angle+=8*dt;
   if(segmentSphere(old,k.p,this.p,RADIUS+.025)){this.finish('GAMEOVER','飛んできた包丁に捌かれた！予告線を見て跳ねよう。');return false;}
   return k.life>0&&!this.boxes.some(bb=>segmentBox(old,k.p,bb,.008));
  });
 }
 finish(state,reason=''){if(this.state!=='PLAYING')return;this.state=state;this.reason=reason;this.score=Math.floor(state==='CLEAR'?5000+Math.max(0,120-this.time)*30+this.water*10+this.successes*500+this.alternations*20:this.time*10+this.successes*300+this.alternations*10);this.emit('finish',{state});}
}
