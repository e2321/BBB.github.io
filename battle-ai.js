import {BATTLE,BOT_RULES,KITCHEN_BOT_RULES,FEIGN_RULES,movementStrength,angleDelta,clamp} from './battle-rules.js';
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
export class BotController{
 constructor(sim){this.sim=sim;this.nodes=[];for(let z=-12;z<=12;z+=2)for(let x=-12;x<=12;x+=2)if(!sim.obstacles.some(o=>x>o.min.x-.65&&x<o.max.x+.65&&z>o.min.z-.65&&z<o.max.z+.65))this.nodes.push({id:this.nodes.length,x,z,edges:[]});for(const a of this.nodes)for(const b of this.nodes)if(a!==b&&Math.hypot(a.x-b.x,a.z-b.z)<2.01&&!sim.obstacles.some(o=>segmentBox({x:a.x,y:.25,z:a.z},{x:b.x,y:.25,z:b.z},o,.65)))a.edges.push(b.id);}
 nearest(p){let best=this.nodes[0],d=Infinity;for(const n of this.nodes){const delta=(n.x-p.x)**2+(n.z-p.z)**2;if(delta<d){d=delta;best=n;}}return best;}
 route(a,b){const from=this.nearest(a),to=this.nearest(b),queue=[from.id],previous=new Map([[from.id,null]]);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===to.id)break;for(const next of this.nodes[id].edges)if(!previous.has(next)){previous.set(next,id);queue.push(next);}}if(!previous.has(to.id))return [];const result=[];for(let id=to.id;id!==from.id;id=previous.get(id))result.unshift(this.nodes[id]);return result;}
 update(p,dt){
  const s=this.sim;if(p.dead)return;
  if(s.stage.id==='kitchen'){
   const threat=s.chefs.filter(c=>c.state!=='STUNNED'&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<KITCHEN_BOT_RULES.escapeDistance).sort((a,b)=>Math.hypot(a.x-p.p.x,a.z-p.p.z)-Math.hypot(b.x-p.p.x,b.z-p.p.z))[0];
   if(threat&&s.time>=(p.ai.nextDefense||0)&&!p.ai.prankChef){p.ai.nextDefense=s.time+2.5;
    if(p.grounded&&!p.inWater&&threat.state!=='ATTACKING'&&s.random()<.35){s.feign(p.id);p.ai.hideUntil=s.time+2.8;p.ai.prankChef=threat.id;p.ai.prankUntil=p.ai.hideUntil;return;}
    const d=Math.hypot(p.p.x-threat.x,p.p.z-threat.z)||1;p.ai.escapeGoal={x:clamp(p.p.x+(p.p.x-threat.x)/d*5,-12,12),z:clamp(p.p.z+(p.p.z-threat.z)/d*5,-12,12)};p.ai.escapeUntil=s.time+1.8;p.ai.nextThink=0;
   }
   p.ai.nextPrank??=10+p.id*4;if(s.time>=p.ai.nextPrank){p.ai.nextPrank=s.time+25+p.id*3;const c=s.chefs.find(c=>s.time>=c.nextBonus&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<5);if(c&&p.water>65&&s.random()<.25){p.ai.prankChef=c.id;p.ai.prankUntil=s.time+7;}}
   const c=s.chefs.find(c=>c.id===p.ai.prankChef);if(c&&s.time<p.ai.prankUntil){if(p.feigning){if(c.target===p.id&&c.unguarded){p.ai.prankDecision??=s.random();if(!p.ai.hideUntil||p.ai.prankDecision<.45){s.jump(p.id,p.inputKey==='A'?'D':'A');p.ai.prankChef=null;p.ai.hideUntil=0;p.ai.prankDecision=null;}}return;}if(p.grounded&&Math.hypot(c.x-p.p.x,c.z-p.p.z)<1.2){s.feign(p.id);return;}}
   else if(p.feigning){s.jump(p.id,'Space');p.ai.prankChef=null;p.ai.hideUntil=0;p.ai.prankDecision=null;return;}
  }
  if(p.water<BOT_RULES.refillThreshold)p.ai.refilling=true;if(p.water>=80)p.ai.refilling=false;
  if(s.time>=p.ai.nextThink){p.ai.nextThink=s.time+BOT_RULES.thinkInterval;let nearest=null,seen=null,dist=Infinity,seenDist=Infinity;for(const q of s.players){if(q===p||q.dead)continue;const d=(q.p.x-p.p.x)**2+(q.p.z-p.p.z)**2;if(d<dist){dist=d;nearest=q;}if(d<seenDist&&visible(s,p,q)){seenDist=d;seen=q;}}
   const player=s.players[0],playerLeads=s.ranking.find(q=>q.id===0)?.rank===1&&player.points>0;p.ai.playerLeads=playerLeads;if(playerLeads&&!player.dead&&seen&&Math.hypot(player.p.x-p.p.x,player.p.z-p.p.z)<12&&visible(s,p,player)&&s.random()<(s.stage.id==='kitchen'?KITCHEN_BOT_RULES.leaderTargetChance:.18))seen=player;p.ai.target=(seen||nearest)?.id;p.ai.seen=!!seen;
   p.ai.food=p.hp<this.sim.balance.hp?[...s.sashimi,...s.hearts].filter(i=>i.active&&(i.expires===undefined||i.expires>s.time)&&Math.hypot(i.p.x-p.p.x,i.p.z-p.p.z)<7).sort((a,b)=>Math.hypot(a.p.x-p.p.x,a.p.z-p.p.z)-Math.hypot(b.p.x-p.p.x,b.p.z-p.p.z))[0]:null;
   p.ai.boost=s.time>=p.boostUntil?s.boosts.filter(i=>i.active&&Math.hypot(i.p.x-p.p.x,i.p.z-p.p.z)<6).sort((a,b)=>Math.hypot(a.p.x-p.p.x,a.p.z-p.p.z)-Math.hypot(b.p.x-p.p.x,b.p.z-p.p.z))[0]:null;
   p.ai.waterTarget=s.puddles.reduce((best,w)=>Math.hypot(w.x-p.p.x,w.z-p.p.z)<Math.hypot(best.x-p.p.x,best.z-p.p.z)?w:best);
   if(!p.ai.pointGoal||s.time>=(p.ai.nextPointGoal||0)||Math.hypot(p.ai.pointGoal.x-p.p.x,p.ai.pointGoal.z-p.p.z)<1){p.ai.pointGoal=this.nodes[Math.floor(s.random()*this.nodes.length)];p.ai.nextPointGoal=s.time+6;}
   const prank=s.chefs.find(c=>c.id===p.ai.prankChef&&s.time<p.ai.prankUntil),q=s.players[p.ai.target],escaping=s.stage.id==='kitchen'&&s.time<(p.ai.escapeUntil||0);p.ai.goal=escaping?p.ai.escapeGoal:p.ai.food?.p||(p.ai.refilling?p.ai.waterTarget:prank?{x:prank.x,z:prank.z}:p.ai.boost?.p||(playerLeads?q?.p:p.ai.pointGoal));
   if(p.ai.goal){p.ai.state=p.ai.refilling?'REFILL':prank?'PRANK':playerLeads?'CHASE':'SCORE';p.ai.path=s.obstacles.some(o=>segmentBox({x:p.p.x,y:.1,z:p.p.z},{x:p.ai.goal.x,y:.1,z:p.ai.goal.z},o,.65))?this.route(p.p,p.ai.goal):[];}
  }
  if(p.ai.food&&!p.ai.food.active){p.ai.food=null;p.ai.nextThink=0;p.ai.path=[];}if(p.ai.boost&&!p.ai.boost.active){p.ai.boost=null;p.ai.nextThink=0;p.ai.path=[];}
  while(p.ai.path.length&&Math.hypot(p.p.x-p.ai.path[0].x,p.p.z-p.ai.path[0].z)<.7)p.ai.path.shift();const destination=p.ai.path[0]||p.ai.goal;if(!destination)return;
  const heading=Math.atan2(-(destination.x-p.p.x),-(destination.z-p.p.z)),strength=movementStrength(p.water);p.yaw+=clamp(angleDelta(heading,p.yaw),-BOT_RULES.turnSpeed*dt,BOT_RULES.turnSpeed*dt);
  p.ai.progressTime??=s.time;p.ai.progressPosition??={...p.p};if(s.time-p.ai.progressTime>1.5){if(Math.hypot(p.p.x-p.ai.progressPosition.x,p.p.z-p.ai.progressPosition.z)<.25&&!p.inWater){p.ai.path=this.route(p.p,p.ai.goal);p.ai.nextThink=s.time+.4;p.yaw+=(p.id%2?1:-1)*.9;p.ai.nextJump=s.time;}p.ai.progressPosition={...p.p};p.ai.progressTime=s.time;}
  if(p.inWater&&p.ai.refilling){const w=p.ai.waterTarget;s.swim(p.id,Math.hypot(p.p.x-w.x,p.p.z-w.z)>.55);}
  else if(p.inWater)s.swim(p.id);
  else if(s.time>=p.ai.nextJump){s.jump(p.id,p.inputKey==='A'?'D':'A');p.ai.nextJump=s.time+BOT_RULES.jumpInterval+p.id*.035+s.random()*BOT_RULES.jumpJitter;}
  const target=s.players[p.ai.target],d=target?Math.hypot(target.p.x-p.p.x,target.p.z-p.p.z):Infinity;
  if(!p.ai.refilling&&p.ai.seen&&target&&!target.dead&&d<25&&s.time>=p.ai.nextFire&&visible(s,p,target)){
   const aim=botAimPoint(s,p,target),origin=s.muzzle(p),error=(s.random()-.5)*BOT_RULES.aimError,tx=aim.x-origin.x,tz=aim.z-origin.z,ty=aim.y-origin.y;
   const yaw=Math.atan2(-tx,-tz)+error,pitch=clamp(Math.atan2(ty,Math.hypot(tx,tz))+(s.random()-.5)*BOT_RULES.pitchError,-Math.PI/3,Math.PI/3);s.fire(p.id,{x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)});p.ai.nextFire=s.time+(BATTLE.fireInterval+s.random()*.18)/botAttackRate(s.stage.id,p.ai.playerLeads);
  }
 }
}
