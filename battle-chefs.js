// BBB-only adapter reuses the prologue's Inspect/Stunned states and animation timings.
import {FEIGN_RULES,clamp,angleDelta,BATTLE} from './battle-rules.js';
import {INSPECTION} from './physics-config.js';
export class KitchenChefs{
 constructor(sim){this.sim=sim;}
 reset(){this.sim.chefs=this.sim.stage.chefs.map(def=>({...def,y:0,state:'CHASING',timer:0,speed:0,heading:0,lastThrow:-10,nextBonus:0,lastSession:null,target:null,unguarded:false,patrolIndex:0,path:[],nextThink:0,stunUntil:0}));}
 transition(c,state){if(c.state===state)return;c.state=state;c.timer=0;c.unguarded=false;c.path=[];c.nextThink=0;}
 move(c,goal,dt,speed){const s=this.sim;if(s.time>=c.nextThink){c.path=s.ai.route({x:c.x,z:c.z},goal);c.nextThink=s.time+.5;}while(c.path.length&&Math.hypot(c.path[0].x-c.x,c.path[0].z-c.z)<.6)c.path.shift();const destination=c.path[0]||goal,dx=destination.x-c.x,dz=destination.z-c.z,d=Math.hypot(dx,dz);if(d<.1){c.speed=0;return;}const oldX=c.x,oldZ=c.z,step=Math.min(speed*dt,d);c.x+=dx/d*step;c.z+=dz/d*step;
  const body={p:{x:c.x,y:BATTLE.bodyY,z:c.z},yaw:Math.atan2(-dx,-dz)};s.bodyCollision(body);c.x=body.p.x;c.z=body.p.z;c.speed=Math.hypot(c.x-oldX,c.z-oldZ)/dt;c.heading=Math.atan2(-(c.x-oldX),-(c.z-oldZ));
 }
 release(p){const s=this.sim;p.surpriseWindows=[];for(const c of s.chefs){if(c.target===p.id&&c.state==='INSPECTING'&&c.unguarded&&c.watchedSession===p.feignSession&&Math.hypot(c.x-p.p.x,c.y+BATTLE.bodyY-p.p.y,c.z-p.p.z)<=FEIGN_RULES.bonusDistance){p.surpriseWindows.push({chef:c.id,session:p.feignSession,until:s.time+FEIGN_RULES.releaseWindow});c.state='RELEASE_WAIT';c.timer=0;c.unguarded=false;}}}
 surprise(p){const s=this.sim;for(const window of p.surpriseWindows){const c=s.chefs.find(c=>c.id===window.chef),session=`${p.id}:${window.session}`;if(!c||s.time>window.until||c.state!=='RELEASE_WAIT'||c.target!==p.id||c.watchedSession!==window.session||s.time<c.nextBonus||c.lastSession===session||Math.hypot(c.x-p.p.x,c.y+BATTLE.bodyY-p.p.y,c.z-p.p.z)>FEIGN_RULES.bonusDistance)continue;
   c.lastSession=session;c.nextBonus=s.time+FEIGN_RULES.cooldown;c.stunUntil=s.time+FEIGN_RULES.stun;c.recoil={x:c.x-p.p.x,z:c.z-p.p.z};this.transition(c,'STUNNED');p.points+=FEIGN_RULES.bonus;s.emit('chefBonus',{id:p.id,chef:c.id,delta:FEIGN_RULES.bonus,total:p.points,p:{...p.p}});
  }p.surpriseWindows=[];
 }
 update(dt){const s=this.sim;for(const c of s.chefs){c.timer+=dt;c.speed=0;const p=s.players[c.target];
   if(c.state==='STUNNED'){if(c.timer<.5){const d=Math.hypot(c.recoil.x,c.recoil.z)||1;this.move(c,{x:c.x+c.recoil.x/d,z:c.z+c.recoil.z/d},dt,1.8);}if(s.time>=c.stunUntil)this.transition(c,'CHASING');continue;}
   if(c.state==='RELEASE_WAIT'){if(!p||p.dead||c.timer>FEIGN_RULES.releaseWindow)this.transition(c,'CHASING');continue;}
   if(c.state==='INSPECTING'){if(!p||p.dead||!p.feigning||p.feignSession!==c.watchedSession||Math.hypot(c.x-p.p.x,c.y+BATTLE.bodyY-p.p.y,c.z-p.p.z)>FEIGN_RULES.bonusDistance){this.transition(c,'CHASING');continue;}c.unguarded=c.timer>=Math.max(FEIGN_RULES.inspection,INSPECTION.start)&&c.timer<=FEIGN_RULES.inspection+FEIGN_RULES.unguarded;if(c.timer>FEIGN_RULES.inspection+FEIGN_RULES.unguarded)this.transition(c,'CHASING');continue;}
   if(c.state==='APPROACHING'){if(p&&c.timer>FEIGN_RULES.approachTimeout){c.ignoreSession=`${p.id}:${p.feignSession}`;c.target=null;this.transition(c,'CHASING');continue;}if(!p||p.dead||!p.feigning||Math.abs(p.p.y-BATTLE.bodyY-c.y)>.6){this.transition(c,'CHASING');continue;}const distance=Math.hypot(c.x-p.p.x,c.z-p.p.z);if(distance<=FEIGN_RULES.inspectDistance){c.watchedSession=p.feignSession;this.transition(c,'INSPECTING');}else this.move(c,p.p,dt,.85);continue;}
   const candidates=s.players.filter(q=>!q.dead&&q.feigning&&!q.inWater&&Math.abs(q.p.y-BATTLE.bodyY-c.y)<=.6&&s.time>=c.nextBonus&&c.lastSession!==`${q.id}:${q.feignSession}`&&c.ignoreSession!==`${q.id}:${q.feignSession}`&&Math.hypot(c.x-q.p.x,c.z-q.p.z)<=FEIGN_RULES.noticeDistance).sort((a,b)=>Math.hypot(c.x-a.p.x,c.z-a.p.z)-Math.hypot(c.x-b.p.x,c.z-b.p.z));
   if(candidates.length){c.target=candidates[0].id;this.transition(c,'APPROACHING');continue;}
   const [x,z]=c.patrol[c.patrolIndex];if(Math.hypot(c.x-x,c.z-z)<.7)c.patrolIndex=(c.patrolIndex+1)%c.patrol.length;
   const nearby=s.players.find(q=>!q.dead&&Math.hypot(q.p.x-c.x,q.p.z-c.z)<3);if(nearby&&s.time>=(c.nextReact||0)){c.reactionUntil=s.time+.4;c.nextReact=s.time+4;c.target=nearby.id;}if(s.time<(c.reactionUntil||0)&&nearby){c.speed=0;c.heading=Math.atan2(-(nearby.p.x-c.x),-(nearby.p.z-c.z));}else this.move(c,{x,z},dt,.7);
  }}
}
