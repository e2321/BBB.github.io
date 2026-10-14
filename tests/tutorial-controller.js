import {TUTORIAL_ROUTE} from '../tutorial-controller.js';
export function runTutorial(sim,controller,{maxSteps=18000,onStep=()=>{},reactionDelay=0,inputInterval=.28}={}){
 let key='A',next=sim.time,routeIndex=0,trackedPhase=controller.phase,readyAt=sim.time+reactionDelay;
 for(let i=0;i<maxSteps&&sim.state==='PLAYING';i++){
  const p=sim.players[0],phase=controller.phase;
  if(phase!==trackedPhase){trackedPhase=phase;readyAt=sim.time+reactionDelay;}if(sim.time<readyAt){sim.step();controller.consume(sim.events);sim.events.length=0;onStep(sim,controller,i);continue;}
  if(phase===0&&sim.time>=next){sim.jump(0,key);key=key==='A'?'D':'A';next=sim.time+.5;}
  if(phase===1){if(!controller.jumped&&p.grounded)sim.jump(0,'Space');if(!controller.hit){const origin=sim.muzzle(p),t=sim.stage.target;sim.fire(0,{x:(t.min.x+t.max.x)/2-origin.x,y:(t.min.y+t.max.y)/2-origin.y,z:(t.min.z+t.max.z)/2-origin.z});}}
  if(phase===2){if(!controller.feignPracticed){if(p.feigning)sim.jump(0,'Space');}else{
   let [x,z]=TUTORIAL_ROUTE[routeIndex];if(Math.hypot(p.p.x-x,p.p.z-z)<.7&&p.grounded&&routeIndex<TUTORIAL_ROUTE.length-1){routeIndex++;[x,z]=TUTORIAL_ROUTE[routeIndex];}
   const yaw=Math.atan2(p.p.x-x+p.v.x*.32,p.p.z-z+p.v.z*.32);sim.aim(0,yaw,0);
   if(p.grounded&&sim.time>=next){sim.jump(0,key);key=key==='A'?'D':'A';next=sim.time+inputInterval;}
  }}
  sim.step();controller.consume(sim.events);sim.events.length=0;onStep(sim,controller,i);
 }
 return {state:sim.state,complete:controller.complete,time:sim.time,phase:controller.phase,flops:controller.flops,jumped:controller.jumped,hit:controller.hit,feignPracticed:controller.feignPracticed,routeIndex,p:{...sim.players[0].p},hp:sim.players[0].hp,phases:[...controller.times]};
}
