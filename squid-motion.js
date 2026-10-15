import * as THREE from 'three';
// Visual-only profiles. Physics, input acceptance and network state never use these.
export const SQUID_MOTION=Object.freeze({low:{mantle:3,arm:2,fin:2},medium:{mantle:5,arm:4,fin:3},high:{mantle:7,arm:6,fin:5}});
const clamp=THREE.MathUtils.clamp;
function pulse(t,a,b){if(t<=a||t>=b)return 0;const x=(t-a)/(b-a);return Math.sin(Math.PI*x)**2;}
function flex(phase){return -.24*pulse(phase,0,.19)+.55*pulse(phase,.12,.62)-.16*pulse(phase,.46,1.08);}
export function prepareSquidRig(geometry,role,index,quality){
 const p=geometry.attributes.position;geometry.computeBoundingBox();const box=geometry.boundingBox,count=SQUID_MOTION[quality][role],start=role==='arm'?box.min.z:box.max.z,end=role==='arm'?box.max.z:box.min.z;
 const indices=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);let x=0,y=0,samples=0;
 for(let i=0;i<p.count;i++){const t=clamp((p.getZ(i)-start)/(end-start||1),0,1)*(count-1),a=Math.min(count-2,Math.floor(t)),blend=t-a;indices[i*4]=a;indices[i*4+1]=a+1;weights[i*4]=1-blend;weights[i*4+1]=blend;if(Math.abs(p.getZ(i)-start)<Math.abs(end-start)*.12){x+=p.getX(i);y+=p.getY(i);samples++;}}
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));return {role,index,count,start,end,x:role==='arm'?x/(samples||1):0,y:role==='arm'?y/(samples||1):0,tentacle:role==='arm'&&index>=8};
}
export function bindSquidRig(mesh,description){const bones=[];for(let i=0;i<description.count;i++){const b=new THREE.Bone();b.name=description.role+':'+description.index+':'+i;if(i===0){b.position.set(description.x,description.y,description.start);mesh.add(b);}else{b.position.z=(description.end-description.start)/(description.count-1);bones[i-1].add(b);}bones.push(b);}mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));return {mesh,bones,...description};}
export class SquidMotion {
 constructor(skin,rigs,quality){this.skin=skin;this.rigs=rigs;this.quality=quality;this.history=Array.from({length:4},()=>({start:-Infinity,duration:.5,side:1,key:'A'}));this.cursor=0;this.reset();}
 reset(){this.clock=-Infinity;this.sample=-1;this.seenStart=-Infinity;this.previousStroke=0;this.previousSide=1;this.wasGrounded=true;this.landing=-Infinity;this.lastYaw=null;this.turn=0;this.bend=0;this.impact=0;this.action='idle';for(const h of this.history)h.start=-Infinity;this.skin.rotation.set(0,0,0);this.skin.scale.set(1,1,1);for(const rig of this.rigs)for(const b of rig.bones){b.rotation.set(0,0,0);b.scale.set(1,1,1);}}
 wave(time){let value=0;for(const h of this.history)if(h.key!=='Space')value+=h.side*flex((time-h.start)/h.duration);return clamp(value,-.65,.65);}
 update(sim,strength,hz){
  let time=Number.isFinite(sim.squidTime)?sim.squidTime:Number.isFinite(sim.time)?sim.time:0;if(time<this.clock-.2)this.reset();time=Math.max(time,this.clock);const elapsed=Number.isFinite(this.clock)?Math.max(0,time-this.clock):1/60,side=sim.strokeSide||1,key=sim.actionKey||((sim.stroke||0)>0?(side<0?'D':'A'):'');
  let start=sim.actionStart;if(!Number.isFinite(start)){if((sim.stroke||0)>0&&(this.previousStroke<=0||side!==this.previousSide))start=time;else start=this.seenStart;}
  if(!sim.dead&&['A','D','Space'].includes(key)&&Number.isFinite(start)&&time-start>=-1e-5&&time-start<1.2){const latest=this.history[(this.cursor+3)%4],correction=latest.key===key&&Math.abs(start-latest.start)<.12;if(start===this.seenStart){latest.duration=clamp(sim.actionDuration||.5,.12,1.1);}else if(start>this.seenStart||correction){const h=correction?latest:this.history[this.cursor];h.start=start;h.duration=clamp(sim.actionDuration||.5,.12,1.1);h.side=side;h.key=key;if(!correction)this.cursor=(this.cursor+1)%4;this.seenStart=start;this.action=key;}}
  const landed=sim.grounded&&!this.wasGrounded&&!sim.dead;if(landed)this.landing=time;const changedGround=sim.grounded!==this.wasGrounded;this.wasGrounded=sim.grounded;this.previousStroke=sim.stroke||0;this.previousSide=side;
  // Body yaw contributes a small, bounded lag to fins and arm tips.
  const yaw=Number.isFinite(sim.yaw)?sim.yaw:0,delta=this.lastYaw===null?0:Math.atan2(Math.sin(yaw-this.lastYaw),Math.cos(yaw-this.lastYaw));this.lastYaw=yaw;if(elapsed>0)this.turn=clamp(this.turn*Math.exp(-elapsed*10)+delta*.12,-.08,.08);
  this.clock=time;const tick=Math.floor(time*hz);if(tick===this.sample&&!changedGround&&!sim.dead)return;const dt=this.sample<0?1/60:Math.min(.1,Math.max(0,time-(this.sampleTime??time)));this.clock=time;this.sample=tick;this.sampleTime=time;
  const landingAge=time-this.landing;this.impact=sim.grounded&&!sim.dead&&landingAge>=0?(1-Math.exp(-landingAge/.018))*Math.exp(-landingAge/.10)*1.55:0;
  const desired=sim.dead?0:this.wave(time)*strength;this.bend+=(desired-this.bend)*(elapsed>.3?1:1-Math.exp(-dt/ .028));
  // No additional vertical bounce: authoritative jump height stays independent.
  this.skin.rotation.set(sim.dead?0:this.bend*.035,0,sim.dead?.45:this.bend*.075);this.skin.scale.set(1+this.impact*.025,1-this.impact*.075,1+this.impact*.012);
  for(const rig of this.rigs){const n=rig.bones.length-1;for(let j=0;j<=n;j++){const b=rig.bones[j],u=j/n;let yawBend=0,pitch=0,roll=0;
    if(!sim.dead&&rig.role==='mantle'){yawBend=this.bend*.55*Math.sin(Math.PI*u)/n;pitch=-this.impact*.018*Math.sin(Math.PI*u)/n;}
    if(!sim.dead&&rig.role==='fin'){yawBend=(this.wave(time-.035)*strength*.32-this.turn)*Math.sin(Math.PI*u)/n;roll=Math.sin(time*13-u*2)*Math.abs(this.bend)*.018*u;}
    if(!sim.dead&&rig.role==='arm'){const delay=.018+(rig.index%4)*.009+u*(rig.tentacle?.105:.065),lag=this.wave(time-delay)*strength,amp=rig.tentacle?1.4:1,splay=Math.cos(rig.index/10*Math.PI*2);yawBend=clamp((lag*.62*amp+this.impact*splay*.12-this.turn*u)*( .45+.55*u)/n,-(rig.tentacle?.42:.30)/n,(rig.tentacle?.42:.30)/n);const settle=Number.isFinite(this.landing)?Math.sin((time-this.landing-delay)*18-rig.index*.42)*Math.exp(-Math.max(0,time-this.landing)*7):0;pitch=clamp((sim.grounded?.055:.022)+settle*.025+lag*.025,-.035,.085)/n;roll=Math.sin(time*11-rig.index*.61-u*2)*Math.abs(lag)*.035*u/n;}
    b.rotation.set(pitch,yawBend,roll);
   }}
 }
 snapshot(){return {action:this.action,recordedActions:this.history.filter(h=>Number.isFinite(h.start)).length,bend:this.bend,impact:this.impact,arms:this.rigs.filter(r=>r.role==='arm'&&!r.tentacle).length,tentacles:this.rigs.filter(r=>r.tentacle).length,bones:this.rigs.reduce((n,r)=>n+r.bones.length,0)};}
 dispose(){for(const rig of this.rigs)rig.mesh.skeleton.dispose();}
}
