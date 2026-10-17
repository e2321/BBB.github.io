import {ARENA_OBSTACLES,ARENA_WALLS,PUDDLES,SPAWNS} from './battle-rules.js';
import {TUTORIAL_STAGE} from './tutorial-stage.js';
const fixture=(id,kind,x,z,sx,sz,height)=>({id,kind,min:{x:x-sx/2,y:0,z:z-sz/2},max:{x:x+sx/2,y:height,z:z+sz/2}});
const boosts=positions=>positions.map(([x,z],id)=>({id,p:{x,y:.35,z}}));
export const KITCHEN_OBSTACLES=[fixture('counter-west','counter',-9,-5,2.4,5,1.5),fixture('counter-east','counter',9,5,2.4,5,1.5),fixture('shelf-north','shelf',2,-10,5,1.4,2.4),fixture('sink-west','sink',-8,9,4,2,1.3),fixture('prep-center','counter',0,0,3,1.8,.4)];
export const BATTLE_STAGES={
 tutorial:TUTORIAL_STAGE,
 normal:{id:'normal',name:'ノーマル',playable:true,obstacles:ARENA_OBSTACLES,walls:ARENA_WALLS,puddles:PUDDLES,spawns:SPAWNS,ceiling:Infinity,boosts:boosts([[-2,-6],[8,0],[-3,5]]),chefs:[]},
 kitchen:{id:'kitchen',name:'厨房',playable:true,obstacles:KITCHEN_OBSTACLES,walls:ARENA_WALLS,puddles:PUDDLES,spawns:SPAWNS,ceiling:4.1,boosts:boosts([[-3,-6],[5,2],[-3,5]]),chefs:[{id:0,x:-9,z:0,patrol:[[-10,0],[-10,-10],[-3,-10],[-3,2]]},{id:1,x:9,z:0,patrol:[[10,0],[10,10],[6,10],[6,0]]},{id:2,x:0,z:10,patrol:[[0,10],[-4,10],[-4,4],[4,4]]}]},
};
export function battleStage(id='normal'){const stage=BATTLE_STAGES[id];if(!stage?.playable)throw new Error('このステージは選択できません。');return stage;}

// Shrink only competitive arenas; the tutorial keeps its original course.
export const ARENA_SCALE=.85;
const planar=p=>({...p,x:p.x*ARENA_SCALE,z:p.z*ARENA_SCALE});
const box=o=>({...o,min:planar(o.min),max:planar(o.max)});
for(const id of ['normal','kitchen']){const s=BATTLE_STAGES[id];s.halfSize=15*ARENA_SCALE;s.obstacles=s.obstacles.map(box);s.walls=s.walls.map(box);s.puddles=s.puddles.map(p=>({...planar(p),radius:p.radius*ARENA_SCALE}));s.spawns=s.spawns.map(planar);s.boosts=s.boosts.map(i=>({...i,p:planar(i.p)}));s.chefs=s.chefs.map(c=>({...planar(c),patrol:c.patrol.map(([x,z])=>[x*ARENA_SCALE,z*ARENA_SCALE])}));}
