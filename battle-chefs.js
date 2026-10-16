// BBB-only inspection rules; surprise reactions are visual and never suspend the chef AI.
import {FEIGN_RULES,CHEF_RULES,BATTLE,comboMultiplier} from './battle-rules.js';
import {segmentBox} from './simulation.js';
import {INSPECTION} from './physics-config.js';
export class KitchenChefs{
 constructor(sim){this.sim=sim;}
 reset(){this.sim.chefs=this.sim.stage.chefs.map(def=>({...def,y:0,state:'CHASING',timer:0,speed:0,heading:0,lastThrow:-10,nextAttack:1.5+def.id,rewardUntil:{},attemptSessions:{},retryUntil:0,target:null,question:0,unguarded:false,patrolIndex:0,path:[],nextThink:0,nextTargetThink:0,surpriseAt:-10}));}
 rewardReady(c,p){return this.sim.time>=(c.rewardUntil[p.id]||0);}
 distance(c,p){return Math.hypot(c.x-p.p.x,c.y+BATTLE.bodyY-p.p.y,c.z-p.p.z);}
 visible(c,p){return !this.sim.obstacles.some(o=>segmentBox({x:c.x,y:c.y+.45,z:c.z},p.p,o,.035));}
 canAttack(c,p){return p&&!p.dead&&this.distance(c,p)<=CHEF_RULES.attackDistance&&Math.abs(p.p.y-c.y-BATTLE.bodyY)<=CHEF_RULES.attackHeight&&this.visible(c,p);}
 transition(c,state){if(c.state===state)return;c.state=state;c.timer=0;c.unguarded=false;c.path=[];c.nextThink=0;}
 move(c,goal,dt,speed){const s=this.sim;if(s.time>=c.nextThink){c.path=s.ai.route({x:c.x,z:c.z},goal);c.nextThink=s.time+.5;}while(c.path.length&&Math.hypot(c.path[0].x-c.x,c.path[0].z-c.z)<.6)c.path.shift();const destination=c.path[0]||goal,dx=destination.x-c.x,dz=destination.z-c.z,d=Math.hypot(dx,dz);if(d<.1){c.speed=0;return;}const oldX=c.x,oldZ=c.z,step=Math.min(speed*dt,d);c.x+=dx/d*step;c.z+=dz/d*step;
  const body={p:{x:c.x,y:BATTLE.bodyY,z:c.z},yaw:Math.atan2(-dx,-dz)};s.bodyCollision(body);c.x=body.p.x;c.z=body.p.z;c.speed=Math.hypot(c.x-oldX,c.z-oldZ)/dt;c.heading=Math.atan2(-(c.x-oldX),-(c.z-oldZ));
 }
 release(p){const s=this.sim;p.surpriseWindows=[];if(s.stage.id!=='kitchen'||s.stage.allowChefBonus===false)return;
  // A release alone is free. A/D on the subsequent actual launch is the attempt;
  // Only a real A/D action can attempt a surprise.
  const candidates=s.chefs.filter(c=>(c.target===p.id||c.observedTarget===p.id)&&(['APPROACHING','INSPECTING'].includes(c.state)||(c.state==='CHASING'&&c.ignoreSession===`${p.id}:${p.feignSession}`))&&c.observedSession===p.feignSession&&this.rewardReady(c,p)&&s.time>=c.retryUntil&&c.attemptSessions[p.id]!==p.feignSession&&this.distance(c,p)<=FEIGN_RULES.attemptDistance&&this.visible(c,p)).sort((a,b)=>this.distance(a,p)-this.distance(b,p));
  const c=candidates[0];if(!c)return;
  const valid=c.state==='INSPECTING'&&c.unguarded&&c.watchedSession===p.feignSession;
  p.surpriseWindows.push({chef:c.id,session:p.feignSession,valid,until:s.time+FEIGN_RULES.releaseWindow,expires:s.time+FEIGN_RULES.attemptLifetime});
  if(valid){c.state='RELEASE_WAIT';c.timer=0;c.unguarded=false;}
 }
 surprise(p,key=p.lastKey){const s=this.sim,windows=p.surpriseWindows;p.surpriseWindows=[];if(!['A','D'].includes(key)||s.stage.id!=='kitchen'||s.state!=='PLAYING'||p.dead)return;
  const window=windows[0];if(!window||s.time>window.expires+1e-7)return;const c=s.chefs.find(c=>c.id===window.chef);
  if(!c||window.session!==p.feignSession||c.attemptSessions[p.id]===window.session||!this.rewardReady(c,p)||s.time<c.retryUntil)return;
  c.attemptSessions[p.id]=window.session;
  if(window.valid&&s.time<=window.until+1e-7&&c.state==='RELEASE_WAIT'&&c.target===p.id&&c.watchedSession===window.session&&this.distance(c,p)<=FEIGN_RULES.bonusDistance&&this.visible(c,p)){
   c.rewardUntil[p.id]=s.time+FEIGN_RULES.cooldown;c.surpriseAt=s.time;c.recoil={x:c.x-p.p.x,z:c.z-p.p.z};this.transition(c,'CHASING');p.points+=FEIGN_RULES.bonus;const rainbowStarted=p.combo<50;if(rainbowStarted){p.combo=50;p.multiplier=comboMultiplier(p.combo);p.lastComboLanding=s.time;s.emit('rainbow',{id:p.id,source:'surprise',p:{...p.p}});}s.emit('chefBonus',{id:p.id,chef:c.id,delta:FEIGN_RULES.bonus,total:p.points,combo:p.combo,rainbowStarted,p:{...p.p}});
  }else{
   const lost=Math.min(p.points,FEIGN_RULES.penalty);p.points=Math.max(0,p.points-FEIGN_RULES.penalty);c.retryUntil=s.time+FEIGN_RULES.retryDelay;c.target=p.id;this.transition(c,'CHASING');c.nextTargetThink=s.time+1;c.nextAttack=Math.max(c.nextAttack,s.time+.6);s.emit('chefFail',{id:p.id,chef:c.id,delta:-lost,penalty:FEIGN_RULES.penalty,total:p.points,p:{...p.p}});
  }
 }
 update(dt){const s=this.sim;if(s.state!=='PLAYING')return;for(const c of s.chefs){if(c.tutorialDisabled)continue;c.timer+=dt;c.speed=0;const inspecting=['APPROACHING','INSPECTING'].includes(c.state);c.question=Math.max(0,Math.min(100,(c.question||0)+(inspecting?65:-18)*dt));const p=s.players[c.target];
   if(c.state==='ATTACKING'){
    if(!p||p.dead||(!this.visible(c,p))){this.transition(c,'CHASING');c.nextAttack=s.time+.8;continue;}
    if(p.feigning&&c.timer<CHEF_RULES.commitTime){c.observedTarget=p.id;c.observedSession=p.feignSession;this.transition(c,'APPROACHING');continue;}
    c.heading=Math.atan2(-(p.p.x-c.x),-(p.p.z-c.z));
    if(c.timer+1e-7>=CHEF_RULES.windup){c.lastThrow=s.time;c.nextAttack=s.time+(c.attackCooldown??CHEF_RULES.attackCooldown);
     if(this.canAttack(c,p)&&s.time>=(p.chefHitUntil||0)&&s.damage(p,null)){p.chefHitUntil=s.time+CHEF_RULES.hitGrace;s.emit('chefStrike',{id:p.id,chef:c.id,p:{...p.p}});}
     this.transition(c,'CHASING');
    }continue;
   }
   if(c.state==='RELEASE_WAIT'){if(!p||p.dead||c.timer>FEIGN_RULES.releaseWindow+1e-7)this.transition(c,'CHASING');continue;}
   if(c.state==='INSPECTING'){if(!p||p.dead||!p.feigning||p.feignSession!==c.watchedSession||this.distance(c,p)>FEIGN_RULES.bonusDistance||!this.visible(c,p)){this.transition(c,'CHASING');continue;}c.unguarded=c.question>=95&&c.timer+1e-7>=(s.stage.id==='tutorial'?.6:FEIGN_RULES.inspection)&&c.timer<=(s.stage.id==='tutorial'?.6:FEIGN_RULES.inspection)+FEIGN_RULES.unguarded+1e-7;if(c.timer>(s.stage.id==='tutorial'?.6:FEIGN_RULES.inspection)+FEIGN_RULES.unguarded+1e-7){c.ignoreSession=`${p.id}:${p.feignSession}`;c.dismissedUntil=s.time+1.4;this.transition(c,'CHASING');}continue;}
   if(c.state==='APPROACHING'){if(p&&c.timer>FEIGN_RULES.approachTimeout){c.ignoreSession=`${p.id}:${p.feignSession}`;c.target=null;this.transition(c,'CHASING');continue;}if(!p||p.dead||!p.feigning||Math.abs(p.p.y-BATTLE.bodyY-c.y)>.6){this.transition(c,'CHASING');continue;}const distance=Math.hypot(c.x-p.p.x,c.z-p.p.z);if(distance<=FEIGN_RULES.inspectDistance){c.watchedSession=p.feignSession;c.question=Math.max(c.question,70);this.transition(c,'INSPECTING');}else this.move(c,p.p,dt,s.stage.id==='tutorial'?.85:1);continue;}
   const candidates=s.players.filter(q=>!q.dead&&q.feigning&&!q.inWater&&Math.abs(q.p.y-BATTLE.bodyY-c.y)<=.6&&this.rewardReady(c,q)&&s.time>=c.retryUntil&&c.attemptSessions[q.id]!==q.feignSession&&c.ignoreSession!==`${q.id}:${q.feignSession}`&&Math.hypot(c.x-q.p.x,c.z-q.p.z)<=FEIGN_RULES.noticeDistance&&this.visible(c,q)).sort((a,b)=>this.distance(c,a)-this.distance(c,b));
   if(candidates.length){c.question=Math.max(20,c.question);c.target=candidates[0].id;c.observedTarget=candidates[0].id;c.observedSession=candidates[0].feignSession;this.transition(c,'APPROACHING');continue;}
   if(s.time>=(c.nextTargetThink||0)){c.nextTargetThink=s.time+CHEF_RULES.thinkInterval;const live=s.players.filter(q=>!q.dead&&!q.feigning&&this.distance(c,q)<=CHEF_RULES.noticeDistance&&this.visible(c,q)).sort((a,b)=>this.distance(c,a)-this.distance(c,b));const current=s.players[c.target];if(!current||current.dead||current.feigning||this.distance(c,current)>CHEF_RULES.chaseDistance||!this.visible(c,current))c.target=live[0]?.id??null;}
   const target=s.players[c.target];if(target&&!target.dead&&!target.feigning&&s.time>=(c.dismissedUntil||0)&&this.visible(c,target)){
    if(this.canAttack(c,target)&&s.time>=c.nextAttack){this.transition(c,'ATTACKING');s.emit('chefWarning',{id:target.id,chef:c.id,p:{...target.p}});}
    else this.move(c,target.p,dt,c.chaseSpeed??CHEF_RULES.chaseSpeed);continue;
   }
   const [x,z]=c.patrol[c.patrolIndex];if(Math.hypot(c.x-x,c.z-z)<.7)c.patrolIndex=(c.patrolIndex+1)%c.patrol.length;
   this.move(c,{x,z},dt,CHEF_RULES.patrolSpeed);
  }}
}
