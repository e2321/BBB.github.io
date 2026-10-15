import {BATTLE,BOT_RULES,BOT_COMBO_RULES,BOT_CLOSE_AIM,BOT_DODGE_RULES,BOT_TARGET_RULES,KITCHEN_BOT_RULES,FEIGN_RULES,movementStrength,angleDelta,clamp} from './battle-rules.js';
import {segmentBox} from './simulation.js';
export const BOT_PREDICTIVE_SHOT_RATE=1/3;
export const botAttackRate=()=>BOT_RULES.attackRate;
// Select once per attack. All knives then keep the original straight trajectory.
export function botAimPoint(sim,shooter,target){
 const predictive=sim.random()<BOT_PREDICTIVE_SHOT_RATE,origin=sim.muzzle(shooter);
 let lead=0;
 if(predictive){
  const rx=target.p.x-origin.x,ry=target.p.y-origin.y,rz=target.p.z-origin.z,v=target.v;
  const a=v.x*v.x+v.y*v.y+v.z*v.z-BATTLE.knifeSpeed**2,b=2*(rx*v.x+ry*v.y+rz*v.z),c=rx*rx+ry*ry+rz*rz,disc=b*b-4*a*c;
  if(Math.abs(a)<1e-8){if(b<0)lead=-c/b;}else if(disc>=0){const roots=[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)].filter(t=>t>0);if(roots.length)lead=Math.min(...roots);}
 }
 return {predictive,x:target.p.x+target.v.x*lead,y:target.p.y+target.v.y*lead,z:target.p.z+target.v.z*lead};
}
export function visible(sim,a,b){const start={x:a.p.x,y:a.p.y+.10,z:a.p.z},end={x:b.p.x,y:b.p.y,z:b.p.z};return !sim.obstacles.some(o=>segmentBox(start,end,o,.035));}
function crossesPool(a,b,w){if(!w)return false;const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((w.x-a.x)*dx+(w.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);if(t===0&&Math.hypot(b.x-w.x,b.z-w.z)>=Math.hypot(a.x-w.x,a.z-w.z))return false;return Math.hypot(a.x+dx*t-w.x,a.z+dz*t-w.z)<w.radius*1.14+.12;}
export class BotController{
 constructor(sim){this.sim=sim;this.nodes=[];for(let z=-12;z<=12;z+=2)for(let x=-12;x<=12;x+=2)if(!sim.obstacles.some(o=>x>o.min.x-.65&&x<o.max.x+.65&&z>o.min.z-.65&&z<o.max.z+.65))this.nodes.push({id:this.nodes.length,x,z,edges:[]});for(const a of this.nodes)for(const b of this.nodes)if(a!==b&&Math.hypot(a.x-b.x,a.z-b.z)<2.01&&!sim.obstacles.some(o=>segmentBox({x:a.x,y:.25,z:a.z},{x:b.x,y:.25,z:b.z},o,.65)))a.edges.push(b.id);}
 // Attack selection is independent of navigation and resource goals.
 attackable(p,q){return !!q&&q!==p&&!q.dead&&!q.spectator&&q.hp>0&&this.sim.time>=(q.invUntil||0)&&Math.hypot(q.p.x-p.p.x,q.p.z-p.p.z)<BOT_TARGET_RULES.range&&visible(this.sim,p,q);}
 selectAttackTarget(p){
  const s=this.sim,r=BOT_TARGET_RULES,current=s.players[p.ai.target],valid=this.attackable(p,current);
  if(valid&&s.time<(p.ai.nextTargetDecision||0))return current;
  const highest=Math.max(0,...s.players.filter(q=>!q.spectator).map(q=>q.points));let best=null,bestScore=-Infinity,currentScore=0;
  for(const q of s.players){
   if(!this.attackable(p,q))continue;
   const distance=Math.hypot(q.p.x-p.p.x,q.p.z-p.p.z),focused=s.players.filter(other=>other!==p&&other!==q&&other.bot&&!other.dead&&!other.spectator&&!other.ai.refilling&&other.ai.target===q.id&&other.ai.seen&&this.attackable(other,q)).length;
   const leader=highest>0&&q.points===highest,score=(leader?1+r.leaderBonus:1)*(q===current?1+r.currentBonus:1)/((r.distanceOffset+distance)*(1+focused*r.focusPenalty));
   if(q===current)currentScore=score;if(score>bestScore){best=q;bestScore=score;}
  }
  p.ai.nextTargetDecision=s.time+r.decisionMin+s.random()*r.decisionJitter;
  if(valid&&best!==current){const threshold=s.time<(p.ai.targetHoldUntil||0)?r.urgentSwitchRatio:r.switchRatio;if(bestScore<currentScore*threshold)best=current;}
  if(best?.id!==p.ai.target)p.ai.targetHoldUntil=s.time+r.holdMin+s.random()*r.holdJitter;
  p.ai.target=best?.id??null;p.ai.seen=!!best;return best;
 }
 nearest(p){let best=this.nodes[0],d=Infinity;for(const n of this.nodes){const delta=(n.x-p.x)**2+(n.z-p.z)**2;if(delta<d){d=delta;best=n;}}return best;}
 route(a,b,avoid=null){const from=this.nearest(a),to=this.nearest(b),queue=[from.id],previous=new Map([[from.id,null]]);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===to.id)break;for(const next of this.nodes[id].edges)if(!previous.has(next)&&!crossesPool(id===from.id?a:this.nodes[id],this.nodes[next],avoid)){previous.set(next,id);queue.push(next);}}if(!previous.has(to.id))return [];const result=[];for(let id=to.id;id!==from.id;id=previous.get(id))result.unshift(this.nodes[id]);return result;}
 attacked(p,owner){
  const s=this.sim;if(!p.bot||!p.inWater)return;
  const pool=s.puddles.find(w=>Math.hypot(w.x-p.p.x,w.z-p.p.z)<w.radius*1.15)||s.puddles.reduce((a,b)=>Math.hypot(a.x-p.p.x,a.z-p.p.z)<Math.hypot(b.x-p.p.x,b.z-p.p.z)?a:b);
  const attacker=s.players[owner],origin=attacker&&attacker!==p?attacker.p:pool;
  const candidates=this.nodes.filter(n=>!s.waterAt(n,true)&&Math.hypot(n.x-p.p.x,n.z-p.p.z)>2).map(n=>({n,score:Math.hypot(n.x-origin.x,n.z-origin.z)-Math.hypot(n.x-p.p.x,n.z-p.p.z)*.65})).sort((a,b)=>b.score-a.score);
  for(const {n} of candidates){const path=this.route(p.p,n);if(!path.length)continue;p.ai.waterEscape={goal:n,until:s.time+6,pool};p.ai.path=path;break;}
  p.ai.avoidPool=pool;p.ai.avoidPoolUntil=s.time+9;p.ai.refilling=false;p.ai.nextThink=0;p.ai.prankChef=null;p.ai.hideUntil=0;p.ai.state='EVADE_WATER';
 }
 update(p,dt){
  const s=this.sim;if(p.dead)return;
  const escape=p.ai.waterEscape;if(escape&&(s.time>=escape.until||!p.inWater)){p.ai.waterEscape=null;p.ai.avoidPoolUntil=Math.max(p.ai.avoidPoolUntil||0,s.time+4);p.ai.nextThink=0;}
  const waterEscape=!!p.ai.waterEscape;
  if(s.stage.id==='kitchen'&&!waterEscape){
   const threat=s.chefs.filter(c=>c.state!=='STUNNED'&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<KITCHEN_BOT_RULES.escapeDistance).sort((a,b)=>Math.hypot(a.x-p.p.x,a.z-p.p.z)-Math.hypot(b.x-p.p.x,b.z-p.p.z))[0];
   if(threat&&s.time>=(p.ai.nextDefense||0)&&!p.ai.prankChef){p.ai.nextDefense=s.time+2.5;
    if(p.grounded&&!p.inWater&&threat.state!=='ATTACKING'&&s.random()<.35){s.feign(p.id);p.ai.hideUntil=s.time+2.8;p.ai.prankChef=threat.id;p.ai.prankUntil=p.ai.hideUntil;return;}
    const d=Math.hypot(p.p.x-threat.x,p.p.z-threat.z)||1;p.ai.escapeGoal={x:clamp(p.p.x+(p.p.x-threat.x)/d*5,-12,12),z:clamp(p.p.z+(p.p.z-threat.z)/d*5,-12,12)};p.ai.escapeUntil=s.time+1.8;p.ai.nextThink=0;
   }
   p.ai.nextPrank??=10+p.id*4;if(s.time>=p.ai.nextPrank){p.ai.nextPrank=s.time+25+p.id*3;const c=s.chefs.find(c=>s.time>=c.nextBonus&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<5);if(c&&p.water>65&&s.random()<.25){p.ai.prankChef=c.id;p.ai.prankUntil=s.time+7;}}
   const c=s.chefs.find(c=>c.id===p.ai.prankChef);if(c&&s.time<p.ai.prankUntil){if(p.feigning){if(c.target===p.id&&c.unguarded){p.ai.prankDecision??=s.random();if(!p.ai.hideUntil||p.ai.prankDecision<.45){s.jump(p.id,p.inputKey==='A'?'D':'A');p.ai.prankChef=null;p.ai.hideUntil=0;p.ai.prankDecision=null;}}return;}if(p.grounded&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<1.2){s.feign(p.id);return;}}
   else if(p.feigning){s.jump(p.id,'Space');p.ai.prankChef=null;p.ai.hideUntil=0;p.ai.prankDecision=null;return;}
  }
  if(!waterEscape&&p.water<(p.combo>=25?BOT_COMBO_RULES.refillThreshold:BOT_RULES.refillThreshold))p.ai.refilling=true;if(p.water>=80)p.ai.refilling=false;
  if(s.time>=p.ai.nextThink){
   if(!p.inWater){for(const k of s.projectiles){if(!k.active||k.owner===p.id||k.stuck>0)continue;const vx=k.v.x-p.v.x,vy=k.v.y-p.v.y,vz=k.v.z-p.v.z,speed=vx*vx+vy*vy+vz*vz;if(speed<1)continue;const t=((p.p.x-k.p.x)*vx+(p.p.y-k.p.y)*vy+(p.p.z-k.p.z)*vz)/speed;if(t<0||t>BOT_DODGE_RULES.lookAhead)continue;const miss=Math.hypot(k.p.x-p.p.x+vx*t,k.p.y-p.p.y+vy*t,k.p.z-p.p.z+vz*t);if(miss>BOT_DODGE_RULES.radius||!visible(s,p,{p:k.p}))continue;const length=Math.hypot(k.v.x,k.v.z)||1,side=p.id%2?1:-1;p.ai.dodgeGoal={x:clamp(p.p.x+side*k.v.z/length*BOT_DODGE_RULES.distance,-12,12),z:clamp(p.p.z-side*k.v.x/length*BOT_DODGE_RULES.distance,-12,12)};p.ai.dodgeUntil=s.time+BOT_DODGE_RULES.duration;break;}}
   p.ai.nextThink=s.time+BOT_RULES.thinkInterval;this.selectAttackTarget(p);
   p.ai.food=p.hp<this.sim.balance.hp?s.sashimi.filter(i=>i.active&&(i.expires===undefined||i.expires>s.time)&&Math.hypot(i.p.x-p.p.x,i.p.z-p.p.z)<7).sort((a,b)=>Math.hypot(a.p.x-p.p.x,a.p.z-p.p.z)-Math.hypot(b.p.x-p.p.x,b.p.z-p.p.z))[0]:null;
   p.ai.boost=s.time>=p.boostUntil?s.boosts.filter(i=>i.active&&Math.hypot(i.p.x-p.p.x,i.p.z-p.p.z)<6).sort((a,b)=>Math.hypot(a.p.x-p.p.x,a.p.z-p.p.z)-Math.hypot(b.p.x-p.p.x,b.p.z-p.p.z))[0]:null;
   p.ai.waterTarget=s.puddles.filter(w=>w!==p.ai.avoidPool||s.time>=(p.ai.avoidPoolUntil||0)).reduce((best,w)=>!best||Math.hypot(w.x-p.p.x,w.z-p.p.z)<Math.hypot(best.x-p.p.x,best.z-p.p.z)?w:best,null);
   if(!p.ai.pointGoal||s.time>=(p.ai.nextPointGoal||0)||Math.hypot(p.ai.pointGoal.x-p.p.x,p.ai.pointGoal.z-p.p.z)<1){p.ai.pointGoal=this.nodes[Math.floor(s.random()*this.nodes.length)];p.ai.nextPointGoal=s.time+6;}
   const prank=s.chefs.find(c=>c.id===p.ai.prankChef&&s.time<p.ai.prankUntil),escaping=s.stage.id==='kitchen'&&s.time<(p.ai.escapeUntil||0);p.ai.goal=waterEscape?p.ai.waterEscape.goal:s.time<(p.ai.dodgeUntil||0)?p.ai.dodgeGoal:escaping?p.ai.escapeGoal:p.ai.food?.p||(p.ai.refilling?p.ai.waterTarget:prank?{x:prank.x,z:prank.z}:p.ai.boost?.p||p.ai.pointGoal);
   const avoid=!waterEscape&&s.time<(p.ai.avoidPoolUntil||0)?p.ai.avoidPool:null;if(avoid&&p.ai.goal&&Math.hypot(p.ai.goal.x-avoid.x,p.ai.goal.z-avoid.z)<avoid.radius*1.14+.3){p.ai.goal=p.ai.waterTarget||p.ai.pointGoal;if(p.ai.goal&&Math.hypot(p.ai.goal.x-avoid.x,p.ai.goal.z-avoid.z)<avoid.radius*1.14+.3)p.ai.goal=this.nodes.find(n=>Math.hypot(n.x-avoid.x,n.z-avoid.z)>avoid.radius+2);}
   if(p.ai.goal){p.ai.state=waterEscape?'EVADE_WATER':p.ai.refilling?'REFILL':prank?'PRANK':'SCORE';p.ai.path=s.obstacles.some(o=>segmentBox({x:p.p.x,y:.1,z:p.p.z},{x:p.ai.goal.x,y:.1,z:p.ai.goal.z},o,.65))||crossesPool(p.p,p.ai.goal,avoid)?this.route(p.p,p.ai.goal,avoid):[];if(avoid&&crossesPool(p.p,p.ai.goal,avoid)&&!p.ai.path.length){p.ai.goal=this.nodes.filter(n=>!crossesPool(p.p,n,avoid)).sort((a,b)=>Math.hypot(a.x-p.p.x,a.z-p.p.z)-Math.hypot(b.x-p.p.x,b.z-p.p.z))[0]||p.p;}}
  }
  if(p.ai.food&&!p.ai.food.active){p.ai.food=null;p.ai.nextThink=0;p.ai.path=[];}if(p.ai.boost&&!p.ai.boost.active){p.ai.boost=null;p.ai.nextThink=0;p.ai.path=[];}
  while(p.ai.path.length&&Math.hypot(p.p.x-p.ai.path[0].x,p.p.z-p.ai.path[0].z)<.7)p.ai.path.shift();const destination=p.ai.path[0]||p.ai.goal;if(!destination)return;
  const heading=Math.atan2(-(destination.x-p.p.x),-(destination.z-p.p.z)),strength=movementStrength(p.water);p.yaw+=clamp(angleDelta(heading,p.yaw),-BOT_RULES.turnSpeed*dt,BOT_RULES.turnSpeed*dt);
  p.ai.progressTime??=s.time;p.ai.progressPosition??={...p.p};if(s.time-p.ai.progressTime>1.5){if(Math.hypot(p.p.x-p.ai.progressPosition.x,p.p.z-p.ai.progressPosition.z)<.25&&(!p.inWater||waterEscape)){p.ai.path=this.route(p.p,p.ai.goal,!waterEscape&&s.time<(p.ai.avoidPoolUntil||0)?p.ai.avoidPool:null);p.ai.nextThink=s.time+.4;p.yaw+=(p.id%2?1:-1)*.9;p.ai.nextJump=s.time;}p.ai.progressPosition={...p.p};p.ai.progressTime=s.time;}
  if(p.inWater&&p.ai.refilling&&!waterEscape){const w=p.ai.waterTarget;s.swim(p.id,Math.hypot(p.p.x-w.x,p.p.z-w.z)>.55);}
  else if(p.inWater)s.swim(p.id);
  else if(s.time>=p.ai.nextJump){s.jump(p.id,p.inputKey==='A'?'D':'A');p.ai.nextJump=s.time+BOT_RULES.jumpInterval+p.id*.035+s.random()*BOT_RULES.jumpJitter;if(p.combo>=20&&s.random()<BOT_COMBO_RULES.continueChance)p.ai.nextJump=Math.min(p.ai.nextJump,s.time+.12);}
  const target=s.players[p.ai.target],d=target?Math.hypot(target.p.x-p.p.x,target.p.z-p.p.z):Infinity;
  if(target&&d<BOT_CLOSE_AIM.distance){if(p.ai.closeTarget!==target.id){p.ai.closeTarget=target.id;p.ai.closeReady=s.time+BOT_CLOSE_AIM.reaction;p.ai.closeYaw=p.yaw;p.ai.closeSample=null;p.ai.nextCloseSample=s.time+BOT_CLOSE_AIM.reaction;}if(s.time>=p.ai.nextCloseSample){p.ai.closeSample={p:{...target.p},v:{...target.v}};p.ai.nextCloseSample=s.time+BOT_CLOSE_AIM.reaction;}const sample=p.ai.closeSample;if(sample){const desired=Math.atan2(p.p.x-sample.p.x,p.p.z-sample.p.z);p.ai.closeYaw+=clamp(angleDelta(desired,p.ai.closeYaw),-BOT_CLOSE_AIM.turnSpeed*dt,BOT_CLOSE_AIM.turnSpeed*dt);}}else{p.ai.closeTarget=null;p.ai.closeSample=null;}

  if(!p.ai.refilling&&p.ai.seen&&target&&this.attackable(p,target)&&s.time>=p.ai.nextFire&&(d>=BOT_CLOSE_AIM.distance||s.time>=p.ai.closeReady)){
   const close=clamp(1-d/BOT_CLOSE_AIM.distance,0,1),aim=botAimPoint(s,p,p.ai.closeSample||target),origin=s.muzzle(p),error=(s.random()-.5)*(BOT_RULES.aimError+close*BOT_CLOSE_AIM.yawError),tx=aim.x-origin.x,tz=aim.z-origin.z,ty=aim.y-origin.y;
   const aimYaw=Math.atan2(-tx,-tz),yaw=(close>0?p.ai.closeYaw+clamp(angleDelta(aimYaw,p.ai.closeYaw),-.12,.12):aimYaw)+error,pitch=clamp(Math.atan2(ty,Math.hypot(tx,tz))+(s.random()-.5)*(BOT_RULES.pitchError+close*BOT_CLOSE_AIM.pitchError),-Math.PI/3,Math.PI/3);s.fire(p.id,{x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)});p.ai.nextFire=s.time+(BATTLE.fireInterval+s.random()*.18)/botAttackRate();
  }
 }
}
