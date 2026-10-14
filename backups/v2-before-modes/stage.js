// All lengths are metres. Rendering and collision share this stage description.
export const START = { x: 0, y: .975, z: 7.15 };
export const GOAL = { x: 0, y: .752, z: -14.6, radius: .18 };
export const SINK = { x: 0, z: -14.2, width: 2.7, depth: 2.5, bottom: .75, rim: 1.25, water: .80 };
export const ARENA = { minX: -1.38, maxX: 1.38, minZ: -11.15, maxZ: -8.05, y: 1.05 };
export const GATE = { id:'chef-gate', x:0, y:1.65, z:-11.55, sx:3.35, sy:1.2, sz:.16, kind:'gate' };
export const box = (id,x,y,z,sx,sy,sz,kind='steel') => ({ id,kind, min:{x:x-sx/2,y:y-sy/2,z:z-sz/2},max:{x:x+sx/2,y:y+sy/2,z:z+sz/2},center:{x,y,z},size:{x:sx,y:sy,z:sz} });
const platform=(id,x,z,sx,sz,top,kind='steel')=>box(id,x,top/2,z,sx,top,sz,kind);
export const PLATFORMS = [
 platform('prep',0,6,4.8,4,.85),box('board',0,.88,7.05,1.8,.06,1.2,'wood'),
 platform('dish-1',-.70,3.35,1.25,1.15,1.0,'plate'),
 platform('dish-2',.35,2.18,1.25,1.15,1.15,'bowl'),
 platform('dish-3',-.65,1.02,1.25,1.15,1.30,'plate'),
 platform('dish-4',.30,-.12,1.25,1.15,1.12,'bowl'),
 platform('checkpoint-1',0,-1.38,2.4,1.5,.95),
 platform('stove-route',0,-4.17,2.4,4.1,1.0),
 platform('checkpoint-2',0,-7.08,2.6,1.8,1.05),
 platform('chef-arena',0,-9.82,3.4,3.9,1.05),
 platform('sink-launch',0,-12.05,1.8,1.2,1.05),
];
export const OBSTACLES=[
 box('carrot',-.64,.98,6.25,.22,.26,.58,'carrot'),
 box('cucumber',.66,.97,5.52,.22,.24,.68,'cucumber'),
 box('cutting-knife',-.32,.935,4.92,.72,.17,.18,'utensil'),
 box('tomato',.65,1.0,6.4,.32,.30,.32,'tomato'),
 box('utensil-pot',-1.80,1.16,5.25,.45,.62,.45,'utensil'),
 box('stove-pot',-.91,1.22,-3.42,.40,.44,.45,'pot'),
 box('stove-pan',.9,1.12,-4.76,.4,.24,.55,'pan'),
 // Tall arena rails prevent a jump around the chef-controlled trolley.
 box('arena-rail-left',-1.65,1.55,-10.23,.12,1.0,4.70,'rail'),
 box('arena-rail-right',1.65,1.55,-10.23,.12,1.0,4.70,'rail'),
];
export const FIRE_ZONES=[{id:'fire-1',x:-.35,z:-2.82,radius:.53,base:1.015,height:.60,period:4.4,on:1.65,offset:0},
 {id:'fire-2',x:.32,z:-4.06,radius:.55,base:1.015,height:.60,period:4.4,on:1.65,offset:1.4},
 {id:'fire-3',x:-.18,z:-5.38,radius:.58,base:1.015,height:.60,period:4.4,on:1.65,offset:2.8}];
export const WATER_ZONES=[{id:'prep-water',x:-1.05,z:4.6,sx:.65,sz:.65,y:.85},
 {id:'checkpoint-water-1',x:0,z:-1.45,sx:1.15,sz:.72,y:.95},
 {id:'checkpoint-water-2',x:0,z:-7.12,sx:1.45,sz:.85,y:1.05},
 {id:'sink-water',x:0,z:-14.2,sx:2.42,sz:2.22,y:.75}];
export const CHECKPOINTS=[{id:1,name:'食器エリア突破',p:{x:0,y:1.015,z:-1.45},sz:.70,sx:2.2},
 {id:2,name:'コンロエリア突破',p:{x:0,y:1.115,z:-7.12},sz:.80,sx:2.4}];
export const ZONES=[{id:'prep',name:'01 まな板',threshold:Infinity,hint:'A・Dを交互に。食材をよけて、まな板の先へ。'},
 {id:'dishes',name:'02 食器の足場',threshold:3.98,hint:'皿から皿へ！空中でもう一度A / Dで2段ジャンプ。'},
 {id:'stove',name:'03 コンロ',threshold:-2.12,hint:'炎が消えるのを待て。触れると水分が減る！'},
 {id:'chef',name:'04 料理人',threshold:-7.90,hint:'止まって死んだふり。手が伸びたらA / Dで奇襲！'},
 {id:'sink',name:'05 最後のシンク',threshold:-11.72,hint:'最後の段差を2段ジャンプ。シンクの光る排水溝へ！'}];
export function stageBoxes(){return [box('floor',0,-.1,-3.2,14,.2,28,'tile'),...PLATFORMS,...OBSTACLES,
 box('basin',0,.69,-14.2,2.7,.12,2.5),box('sink-left',-1.30,1.0,-14.2,.1,.5,2.5),box('sink-right',1.30,1.0,-14.2,.1,.5,2.5),box('sink-front',0,1.0,-13.0,2.7,.5,.10),box('sink-back',0,1.0,-15.4,2.7,.5,.10),
 box('wall-left',-6.8,2,-3.2,.15,4,28,'tile'),box('wall-right',6.8,2,-3.2,.15,4,28,'tile'),box('wall-back',0,2,-16.6,14,4,.15,'tile')];}
export function fireActive(f,time){return ((time+f.offset)%f.period)<f.on;}
export function stageIndex(p){let n=0;for(let i=1;i<ZONES.length;i++)if(p.z<ZONES[i].threshold)n=i;return n;}
