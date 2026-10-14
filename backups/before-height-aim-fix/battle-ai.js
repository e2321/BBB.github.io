import {BATTLE,PUDDLES,angleDelta,clamp} from './battle-rules.js';
import {segmentBox} from './simulation.js';
export function visible(sim,a,b){const start={x:a.p.x,y:a.p.y+.10,z:a.p.z},end={x:b.p.x,y:b.p.y,z:b.p.z};return !sim.obstacles.some(o=>segmentBox(start,end,o,.035));}
export class BotController{
 constructor(sim){this.sim=sim;this.nodes=[];for(let z=-12;z<=12;z+=2)for(let x=-12;x<=12;x+=2)if(!sim.obstacles.some(o=>x>o.min.x-.65&&x<o.max.x+.65&&z>o.min.z-.65&&z<o.max.z+.65))this.nodes.push({id:this.nodes.length,x,z,edges:[]});for(const a of this.nodes)for(const b of this.nodes)if(a!==b&&Math.hypot(a.x-b.x,a.z-b.z)<2.01&&!sim.obstacles.some(o=>segmentBox({x:a.x,y:.25,z:a.z},{x:b.x,y:.25,z:b.z},o,.65)))a.edges.push(b.id);}
 nearest(p){let best=this.nodes[0],d=Infinity;for(const n of this.nodes){const delta=(n.x-p.x)**2+(n.z-p.z)**2;if(delta<d){d=delta;best=n;}}return best;}
 route(a,b){const from=this.nearest(a),to=this.nearest(b),queue=[from.id],previous=new Map([[from.id,null]]);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===to.id)break;for(const next of this.nodes[id].edges)if(!previous.has(next)){previous.set(next,id);queue.push(next);}}if(!previous.has(to.id))return [];const result=[];for(let id=to.id;id!==from.id;id=previous.get(id))result.unshift(this.nodes[id]);return result;}
 update(p,dt){
  const s=this.sim;if(p.dead)return;
  if(p.water<45)p.ai.refilling=true;if(p.water>=80)p.ai.refilling=false;
  if(s.time>=p.ai.nextThink){p.ai.nextThink=s.time+.16;let nearest=null,seen=null,dist=Infinity,seenDist=Infinity;for(const q of s.players){if(q===p||q.dead)continue;const d=(q.p.x-p.p.x)**2+(q.p.z-p.p.z)**2;if(d<dist){dist=d;nearest=q;}if(d<seenDist&&visible(s,p,q)){seenDist=d;seen=q;}}p.ai.target=(seen||nearest)?.id;p.ai.seen=!!seen;
   const q=s.players[p.ai.target];p.ai.waterTarget=PUDDLES.reduce((best,w)=>Math.hypot(w.x-p.p.x,w.z-p.p.z)<Math.hypot(best.x-p.p.x,best.z-p.p.z)?w:best);const goal=p.ai.refilling?p.ai.waterTarget:q?.p;if(goal){p.ai.state=p.ai.refilling?'REFILL':seen?'CHASE':'SEARCH';if(!seen||s.obstacles.some(o=>segmentBox({x:p.p.x,y:.1,z:p.p.z},{x:goal.x,y:.1,z:goal.z},o,.65)))p.ai.path=this.route(p.p,goal);else p.ai.path=[];}
  }
  const target=s.players[p.ai.target];if((!target||target.dead)&&!p.ai.refilling)return;
  while(p.ai.path.length&&Math.hypot(p.p.x-p.ai.path[0].x,p.p.z-p.ai.path[0].z)<.8)p.ai.path.shift();
  const destination=p.ai.path[0]||(p.ai.refilling?p.ai.waterTarget:target.p),d=target?Math.hypot(target.p.x-p.p.x,target.p.z-p.p.z):Infinity;let heading=Math.atan2(-(destination.x-p.p.x),-(destination.z-p.p.z));
  if(!p.ai.refilling&&d<3.4&&p.ai.seen&&s.time>=p.ai.nextJump){heading+=s.random()>.5?.6:-.6;}
  p.yaw+=clamp(angleDelta(heading,p.yaw),-3.0*dt,3.0*dt);
  if(p.inWater&&p.ai.refilling){const center=p.ai.waterTarget,distance=Math.hypot(p.p.x-center.x,p.p.z-center.z);s.swim(p.id,distance>.55);}
  else if(s.time>=p.ai.nextJump){s.jump(p.id,p.inputKey==='A'?'D':'A');p.ai.nextJump=s.time+.13+p.id*.035+s.random()*.045;}
  if(!p.ai.refilling&&p.ai.seen&&d<25&&s.time>=p.ai.nextFire&&visible(s,p,target)){
   const lead=d/BATTLE.knifeSpeed*.48,origin=s.muzzle(p),error=(s.random()-.5)*.09,tx=target.p.x+target.v.x*lead-origin.x,tz=target.p.z+target.v.z*lead-origin.z,ty=target.p.y+target.v.y*lead*.35-origin.y;
   const yaw=Math.atan2(-tx,-tz)+error,pitch=clamp(Math.atan2(ty,Math.hypot(tx,tz))+(s.random()-.5)*.06,-Math.PI/3,Math.PI/3);s.fire(p.id,{x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)});p.ai.nextFire=s.time+BATTLE.fireInterval+s.random()*.18;
  }
 }
}
