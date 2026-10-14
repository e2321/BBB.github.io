import {ARENA_OBSTACLES,ARENA_WALLS,PUDDLES,SPAWNS} from './battle-rules.js';
const fixture=(id,kind,x,z,sx,sz,height)=>({id,kind,min:{x:x-sx/2,y:0,z:z-sz/2},max:{x:x+sx/2,y:height,z:z+sz/2}});
const boosts=positions=>positions.map(([x,z],id)=>({id,p:{x,y:.35,z}}));
export const KITCHEN_OBSTACLES=[fixture('counter-west','counter',-9,-5,2.4,5,1.5),fixture('counter-east','counter',9,5,2.4,5,1.5),fixture('shelf-north','shelf',2,-10,5,1.4,2.4),fixture('sink-west','sink',-8,9,4,2,1.3),fixture('prep-center','counter',0,0,3,1.8,.4)];
export const BATTLE_STAGES={
 normal:{id:'normal',name:'ノーマル',playable:true,obstacles:ARENA_OBSTACLES,walls:ARENA_WALLS,puddles:PUDDLES,spawns:SPAWNS,ceiling:Infinity,boosts:boosts([[-2,-6],[8,0],[-3,5]]),chefs:[]},
 kitchen:{id:'kitchen',name:'厨房',playable:true,obstacles:KITCHEN_OBSTACLES,walls:ARENA_WALLS,puddles:PUDDLES,spawns:SPAWNS,ceiling:4.1,boosts:boosts([[-3,-6],[5,2],[-3,5]]),chefs:[{id:0,x:-9,z:0,patrol:[[-10,0],[-10,-10],[-3,-10],[-3,2]]},{id:1,x:9,z:0,patrol:[[10,0],[10,10],[6,10],[6,0]]}]},
 stove:{id:'stove',name:'コンロ',playable:false},
};
export function battleStage(id='normal'){const stage=BATTLE_STAGES[id];if(!stage?.playable)throw new Error('このステージはCOMING SOONです');return stage;}
