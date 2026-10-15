import {OBSTACLES} from './stage.js';
import {BATTLE} from './battle-rules.js';
const box=(id,x,z,sx,sz,height,kind='steel')=>({id,kind,min:{x:x-sx/2,y:0,z:z-sz/2},max:{x:x+sx/2,y:height,z:z+sz/2}});
// Keep the original long escape data intact and reuse its three alternating barriers.
export const TUTORIAL_STAGE={id:'tutorial',name:'チュートリアル',playable:true,duration:Infinity,ceiling:Infinity,allowChefBonus:false,balance:{},flopRules:{},
 obstacles:[...OBSTACLES.filter(o=>o.kind==='prep-barrier').map((o,i)=>box(`tutorial-${o.id}`,Math.sign(o.center.x)*1.6,1-i*4,8,.25,1.8,'prep-barrier')),box('practice-gate',0,3,12,.2,2.4)],
 walls:[box('tutorial-west',-6.25,0,.5,26,3),box('tutorial-east',6.25,0,.5,26,3),box('tutorial-north',0,-13.25,12,.5,3),box('tutorial-south',0,12.25,12,.5,3)],
 puddles:[{x:-3,z:6,radius:1.15}],spawns:[{x:0,y:BATTLE.bodyY,z:9},...[1,2,3].map(i=>({x:13,y:BATTLE.bodyY,z:10+i*.5}))],boosts:[],
 chefs:[{id:0,x:0,z:10,chaseSpeed:.65,attackCooldown:4.5,patrol:[[0,10],[-4,8],[4,8]]}],
 practiceStart:{x:0,y:BATTLE.bodyY,z:8},escapeStart:{x:0,y:BATTLE.bodyY,z:4.8},goal:{x:0,y:BATTLE.bodyY,z:-11.2,radius:1},
 target:{min:{x:-1.2,y:.05,z:5.42},max:{x:1.2,y:2.05,z:5.58}},
};
