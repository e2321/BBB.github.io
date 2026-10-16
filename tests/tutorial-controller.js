// Automated learner: uses real simulation inputs and the existing view-switch callback.
export function runTutorial(sim,c,{maxSteps=18000,onStep=()=>{},reactionDelay=0,inputInterval=.52}={}){
 let key='A',next=0,phase=c.phase,ready=sim.time+reactionDelay;
 for(let i=0;i<maxSteps&&sim.state==='PLAYING';i++){
  c.beforeStep();const p=sim.players[0];if(phase!==c.phase){phase=c.phase;ready=sim.time+reactionDelay;next=sim.time;}
  if(sim.time>=ready){
   const moveTo=target=>{sim.aim(0,Math.atan2(p.p.x-target.x+p.v.x*.2,p.p.z-target.z+p.v.z*.2),0);if(p.inWater)sim.swim(0);else if(p.grounded&&sim.time>=next){sim.jump(0,key);key=key==='A'?'D':'A';next=sim.time+inputInterval;}};
   const shoot=target=>{const o=sim.muzzle(p);sim.fire(0,{x:target.x-o.x,y:target.y-o.y,z:target.z-o.z});};
   if(c.phase===0||c.phase===5){sim.aim(0,0,0);if(p.grounded&&sim.time>=next){sim.jump(0,key);key=key==='A'?'D':'A';next=sim.time+inputInterval;}}
   if(c.phase===1){if(p.inWater)sim.swim(0,false);else moveTo(sim.puddles[0]);}
   if(c.phase===2){if(!c.blockedTried){if(p.inWater){sim.fire(0);c.blockedAttack();}else moveTo(sim.puddles[0]);}else if(p.inWater)moveTo(sim.stage.practiceStart);else shoot({x:p.p.x,y:p.p.y,z:p.p.z-3});}
   if(c.phase===3){if(!c.tpsShot){c.setView('TPS');shoot(sim.players[1].p);}else if(!c.fpsSeen)c.setView('FPS');else if(!c.fpsHit){c.setView('FPS');shoot(sim.players[1].p);}else c.setView('TPS');}
  }
  sim.step();c.consume(sim.events);sim.events.length=0;onStep(sim,c,i);
 }
 return {state:sim.state,complete:c.complete,time:sim.time,phase:c.phase,flops:c.flops,recovered:c.recovered,blocked:c.blockedTried,outside:c.outsideShot,tps:c.tpsShot,fps:c.fpsSeen,fpsHit:c.fpsHit,jumped:c.jumped,challengeBP:c.challengeBP,combo:c.adCombo,kills:sim.players[0].kills,hp:sim.players[0].hp,phases:[...c.times]};
}
