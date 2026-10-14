// A controller for reachability tests: uses only real A/D impulses, no teleports,
// no disabled AI and no changes to velocity, water or stage geometry.
export const ROUTE=[[-.85,5.05],[-.70,3.35],[.35,2.18],[-.65,1.02],[.30,-.12],[0,-1.45],
 [.72,-2.50],[-.70,-3.65],[.72,-4.90],[0,-6.20],[0,-7.12],[.65,-8.38],[.90,-10.80],[0,-12.15],[0,-13.65],[0,-14.60]];
export function runRoute(sim,{maxSteps=18000,onStep=()=>{},startIndex=0}={}){
 let n=startIndex,key='A',next=sim.time,inspected=false;
 const visited=[];
 for(let i=0;i<maxSteps&&sim.state==='PLAYING';i++){
  const [x,z]=ROUTE[n],d=Math.hypot(x-sim.p.x,z-sim.p.z);
  const arrived=d<.22&&sim.grounded;
  if(arrived&&n<ROUTE.length-1){
   const needsWater=[5,10].includes(n)&&sim.water<95;
   const needsSurprise=n===11&&!sim.gateOpened;
   if(needsSurprise){if(sim.chef.state==='INSPECTING'&&sim.chef.timer>=.52&&sim.chef.timer<=.80){sim.input(key,Math.atan2(sim.p.x-ROUTE[12][0],sim.p.z-ROUTE[12][1]));inspected=true;key=key==='A'?'D':'A';next=sim.time+.28;}}
   if(!needsWater&&(!needsSurprise||sim.gateOpened)){visited.push(n);n++;}
  }
  const wait=(n===11&&!sim.gateOpened&&d<.22)||(n===5&&d<.18&&sim.water<95)||(n===10&&d<.18&&sim.water<95);
  if(!wait&&sim.time>=next){
   const dx=sim.p.x-ROUTE[n][0]+sim.v.x*.50,dz=sim.p.z-ROUTE[n][1]+sim.v.z*.50;
   if(n<ROUTE.length-1||Math.hypot(sim.p.x-x,sim.p.z-z)>.11){sim.input(key,Math.atan2(dx,dz));key=key==='A'?'D':'A';next=sim.time+.28;}
  }
  sim.step();onStep(sim,n,i);
 }
 return {state:sim.state,reason:sim.reason,time:sim.time,p:{...sim.p},water:sim.water,n,visited,inspected,checkpoint:sim.checkpointId,successes:sim.successes};
}
