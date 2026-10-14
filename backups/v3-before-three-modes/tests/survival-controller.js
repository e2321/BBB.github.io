export function runSurvival(sim,seconds=90){
 const path=[[0,2],[0,4],[-2,4],[-4,4],[-4,2],[-4,0],[-4,-2],[-4,-4],[-2,-4],[0,-4],[2,-4],[4,-4],[4,-2],[4,0],[4,2],[4,4],[2,4],[0,4]];
 let n=0,key='A',next=sim.time;const targetTime=sim.time+seconds;
 while(sim.state==='PLAYING'&&sim.time<targetTime){
  const [x,z]=path[n],d=Math.hypot(sim.p.x-x,sim.p.z-z);if(d<.22&&sim.grounded)n=(n+1)%path.length;
  if(sim.time>=next){sim.input(key,Math.atan2(sim.p.x-path[n][0]+sim.v.x*.5,sim.p.z-path[n][1]+sim.v.z*.5));key=key==='A'?'D':'A';next=sim.time+.28;}
  sim.step();
 }
 return {state:sim.state,time:sim.time,cause:sim.deathCause,n,water:sim.water,chefCount:sim.chefs.length,p:sim.p};
}
