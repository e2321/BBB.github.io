export const ROUTE=[[-.85,5.05],[-.70,3.35],[.35,2.18],[-.65,1.02],[.30,-.12],[0,-1.45],
 [.95,-2.4],[.95,-3.44],[-.95,-3.44],[-.95,-4.75],[.95,-4.75],[.95,-5.9],[0,-7.12],
 [.65,-8.38],[.90,-10.80],[0,-12.05],[-.95,-14.5],[-.80,-15.85],[.45,-17.10],[-.65,-18.40],[.25,-19.65],[0,-20.95],
 [-.95,-22.15],[-.95,-23.4],[.95,-23.4],[.95,-24.8],[-.95,-24.8],[-.95,-26.1],[0,-27.30],
 [.55,-28.65],[.95,-31.25],[0,-33.0],[0,-34.65],[0,-35.60]];
const waterIndices=new Set([5,12,15,16,21,28]);const gateIndices=new Map([[13,'chef-gate']]);
export function runRoute(sim,{maxSteps=30000,onStep=()=>{},startIndex=0}={}){
 let n=startIndex,key='A',next=sim.time;const visited=[];
 for(let i=0;i<maxSteps&&sim.state==='PLAYING';i++){
  const [x,z]=ROUTE[n],d=Math.hypot(x-sim.p.x,z-sim.p.z),arrived=d<.22&&sim.grounded,gate=gateIndices.get(n);
  const needsWater=waterIndices.has(n)&&sim.water<94,needsSurprise=gate&&!sim.openGates.has(gate);
  if(needsSurprise&&d<.25){const c=sim.chef;if(c.state==='INSPECTING'&&c.timer>=.40&&c.timer<=1.1){sim.input(key,Math.atan2(sim.p.x-ROUTE[n+1][0],sim.p.z-ROUTE[n+1][1]));key=key==='A'?'D':'A';next=sim.time+.28;}}
  if(arrived&&n<ROUTE.length-1&&!needsWater&&(!needsSurprise||sim.openGates.has(gate))){visited.push(n);n++;}
  const wait=d<.22&&(needsWater||needsSurprise);
  if(!wait&&sim.time>=next&&(n<ROUTE.length-1||d>.11)){sim.input(key,Math.atan2(sim.p.x-ROUTE[n][0]+sim.v.x*.50,sim.p.z-ROUTE[n][1]+sim.v.z*.50));key=key==='A'?'D':'A';next=sim.time+.28;}
  sim.step();onStep(sim,n,i);
 }
 return {state:sim.state,reason:sim.reason,cause:sim.deathCause,time:sim.time,p:{...sim.p},water:sim.water,n,visited,checkpoint:sim.checkpointId,successes:sim.successes,gates:[...sim.openGates]};
}
