import { RADIUS } from './physics-config.js';
// Metres, Y-up. Both collision and rendering consume these same stage records.
export const START = { x: 0, y: .91+RADIUS, z: 7.15 };
export const GOAL = { x: 0, y: .80, z: -35.6, radius: .22 };
export const SINK = { x: 0, z: -35.2, width: 2.9, depth: 2.5, bottom: .80, rim: 1.30, water: .85 };
export const ARENA = { minX: -1.38, maxX: 1.38, minZ: -11.15, maxZ: -8.05, y: 1.05 };
export const GATE = { id:'chef-gate', x:0, y:1.65, z:-11.55, sx:3.35, sy:1.2, sz:.16, kind:'gate' };
export const ARENAS=[{...ARENA,id:0,entry:-7.94,spawn:{x:0,y:1.05,z:-9.22},gateId:'chef-gate'},
 {id:1,minX:-1.52,maxX:1.52,minZ:-31.8,maxZ:-28.35,y:1.10,entry:-28.15,spawn:{x:-.35,y:1.10,z:-29.55},gateId:'chef-gate-rear'}];
export const GATES=[GATE,{id:'chef-gate-rear',x:0,y:1.70,z:-32.15,sx:3.75,sy:1.2,sz:.16,kind:'gate'}];
export const box = (id,x,y,z,sx,sy,sz,kind='steel') => ({ id,kind, min:{x:x-sx/2,y:y-sy/2,z:z-sz/2},max:{x:x+sx/2,y:y+sy/2,z:z+sz/2},center:{x,y,z},size:{x:sx,y:sy,z:sz} });
const platform=(id,x,z,sx,sz,top,kind='steel')=>box(id,x,top/2,z,sx,top,sz,kind);
export const PLATFORMS = [
 platform('prep',0,6,4.8,4,.85),box('board',0,.88,7.05,1.8,.06,1.2,'wood'),
 platform('dish-1',-.70,3.35,1.50,1.25,1.0,'plate'),
 platform('dish-2',.35,2.18,1.50,1.25,1.15,'bowl'),
 platform('dish-3',-.65,1.02,1.50,1.25,1.30,'plate'),
 platform('dish-4',.30,-.12,1.50,1.25,1.12,'bowl'),
 platform('checkpoint-1',0,-1.38,2.4,1.5,.95),
 platform('stove-route',0,-4.17,2.9,4.1,1.0),
 platform('checkpoint-2',0,-7.08,2.6,1.8,1.05),
 platform('chef-arena',0,-9.82,3.4,3.9,1.05),
 platform('checkpoint-3',0,-12.05,2.5,1.3,1.05),
 platform('prep-rear',0,-14,3.6,2.4,1.0),
 platform('dish-rear-1',-.8,-15.85,1.5,1.25,1.10,'bowl'),
 platform('dish-rear-2',.45,-17.10,1.5,1.25,1.25,'plate'),
 platform('dish-rear-3',-.65,-18.4,1.5,1.25,1.40,'bowl'),
 platform('dish-rear-4',.25,-19.65,1.5,1.25,1.20,'plate'),
 platform('checkpoint-4',0,-20.95,2.9,1.6,1.05),
 platform('stove-rear',0,-24.1,2.9,4.6,1.10),
 platform('checkpoint-5',0,-27.30,3.0,1.8,1.10),
 platform('chef-arena-rear',0,-30.2,3.8,4.2,1.10),
 platform('sink-launch',0,-33.0,2.0,1.4,1.10),
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
 box('rear-pot',.95,1.21,-14.3,.4,.42,.5,'pot'),
 box('rear-carrot',-.4,1.10,-13.85,.24,.2,.5,'carrot'),
 box('arena-rear-left',-1.86,1.60,-30.4,.12,1.0,4.6,'rail'),
 box('arena-rear-right',1.86,1.60,-30.4,.12,1.0,4.6,'rail'),
];
export const FIRE_ZONES=[{id:'fire-1',x:-.35,z:-2.82,radius:.40,heatRadius:.92,base:1.015,height:.55,period:4.8,on:1.6,offset:0},
 {id:'fire-2',x:.32,z:-4.06,radius:.42,heatRadius:.95,base:1.015,height:.55,period:4.8,on:1.6,offset:1.6},
 {id:'fire-3',x:-.18,z:-5.38,radius:.43,heatRadius:.98,base:1.015,height:.55,period:4.8,on:1.6,offset:3.2},
 {id:'fire-rear-1',x:.45,z:-22.7,radius:.43,heatRadius:1,base:1.115,height:.58,period:5,on:1.6,offset:1},
 {id:'fire-rear-2',x:-.45,z:-24.1,radius:.43,heatRadius:1,base:1.115,height:.58,period:5,on:1.6,offset:2.7},
 {id:'fire-rear-3',x:.10,z:-25.5,radius:.44,heatRadius:1,base:1.115,height:.58,period:5,on:1.6,offset:4.2}];
export const WATER_ZONES=[{id:'prep-water',x:-1.05,z:4.6,sx:.65,sz:.65,y:.85},
 {id:'checkpoint-water-1',x:0,z:-1.45,sx:1.15,sz:.72,y:.95},
 {id:'checkpoint-water-2',x:0,z:-7.12,sx:1.45,sz:.85,y:1.05},
 {id:'checkpoint-water-3',x:0,z:-12.05,sx:1.25,sz:.75,y:1.05},
 {id:'rear-prep-water',x:-.95,z:-14.5,sx:.65,sz:.65,y:1},
 {id:'checkpoint-water-4',x:0,z:-20.95,sx:1.25,sz:.90,y:1.05},
 {id:'checkpoint-water-5',x:0,z:-27.30,sx:1.45,sz:.85,y:1.10},
 {id:'sink-water',x:0,z:SINK.z,sx:2.65,sz:2.22,y:SINK.bottom}];
export const CHECKPOINTS=[{id:1,name:'食器エリア突破',p:{x:0,y:.95+RADIUS,z:-1.45},sz:.70,sx:2.2},
 {id:2,name:'前半コンロ突破',p:{x:0,y:1.05+RADIUS,z:-7.12},sz:.80,sx:2.4},
 {id:3,name:'前半料理人突破',p:{x:0,y:1.05+RADIUS,z:-12.05},sz:.80,sx:2.3},
 {id:4,name:'後半食器突破',p:{x:0,y:1.05+RADIUS,z:-20.95},sz:.80,sx:2.7},
 {id:5,name:'後半コンロ突破',p:{x:0,y:1.10+RADIUS,z:-27.30},sz:.80,sx:2.8}];
export const ZONES=[{id:'prep',name:'01 まな板',threshold:Infinity,hint:'A・Dを交互に。食材をよけて、まな板の先へ。'},
 {id:'dishes',name:'02 食器の足場',threshold:3.98,hint:'皿から皿へ！空中でもう一度A / Dで2段ジャンプ。'},
 {id:'stove',name:'03 コンロ',threshold:-2.12,hint:'炎は即死！赤い輪を避け、橙色の高温エリアを短く通れ。'},
 {id:'chef',name:'04 料理人',threshold:-7.90,hint:'止まって死んだふり。手が伸びたらA / Dで奇襲！'},
 {id:'rear-prep',name:'05 後半・調理台',threshold:-12.72,hint:'前半突破！水分を補給し、次の食器へ。'},
 {id:'rear-dishes',name:'06 後半・食器',threshold:-15.2,hint:'大きめの横移動。着地点を見て2段ジャンプ！'},
 {id:'rear-stove',name:'07 後半・コンロ',threshold:-21.8,hint:'点火の順番が違う！赤い輪の外を通れ。'},
 {id:'rear-chef',name:'08 後半・料理人',threshold:-28.15,hint:'もう一度死んだふり。広い「今だ！」の合図で跳ねろ！'},
 {id:'sink',name:'09 最後のシンク',threshold:-32.4,hint:'最後の段差を2段ジャンプ。光る排水溝へ！'}];
export function stageBoxes(){return [box('floor',0,-.1,-14,14,.2,50,'tile'),...PLATFORMS,...OBSTACLES,
 box('basin',0,SINK.bottom-.06,SINK.z,SINK.width,.12,SINK.depth),box('sink-left',-1.40,1.05,SINK.z,.1,.5,2.5),box('sink-right',1.40,1.05,SINK.z,.1,.5,2.5),box('sink-front',0,1.05,SINK.z+1.2,SINK.width,.5,.10),box('sink-back',0,1.05,SINK.z-1.2,SINK.width,.5,.10),
 box('wall-left',-6.8,2,-14,.15,4,50,'tile'),box('wall-right',6.8,2,-14,.15,4,50,'tile'),box('wall-back',0,2,-38.5,14,4,.15,'tile')];}
export function fireActive(f,time){return ((time+f.offset)%f.period)<f.on;}
export function stageIndex(p){let n=0;for(let i=1;i<ZONES.length;i++)if(p.z<ZONES[i].threshold)n=i;return n;}

export function createEscapeStage(){return {mode:'ESCAPE',start:START,goal:GOAL,sink:SINK,platforms:PLATFORMS,boxes:stageBoxes(),water:WATER_ZONES,fires:FIRE_ZONES,checkpoints:CHECKPOINTS,zones:ZONES,gates:GATES,arenas:ARENAS,room:{width:14,depth:50,z:-14},intro:{x:0,y:.85,z:6.05}};}
export function createSurvivalStage(){
 const platforms=[],nodes=[],edges=[];let id=0;
 for(const z of [-4,0,4])for(const x of [-4,0,4]){platforms.push(platform(`island-${id}`,x,z,3.3,3.3,.85));nodes.push({id,x,z});id++;}
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){const n=row*3+col;if(col<2){platforms.push(platform(`bridge-x-${n}`,nodes[n].x+2,nodes[n].z,1.4,1.3,.85));edges.push([n,n+1]);}if(row<2){platforms.push(platform(`bridge-z-${n}`,nodes[n].x,nodes[n].z+2,1.3,1.4,.85));edges.push([n,n+3]);}}
 platforms.push(box('board',0,.88,.4,1.5,.06,1.1,'wood'));
 const water=[{id:'water-center',x:-.95,z:.9,sx:.7,sz:.7,y:.85},...nodes.filter(n=>n.id!==4).map(n=>({id:`water-${n.id}`,x:n.x,z:n.z+.8,sx:.85,sz:.75,y:.85}))];
 const fires=[{id:'survival-fire-1',x:4.5,z:-.45,radius:.32,heatRadius:.8,base:.865,height:.5,period:5.2,on:1.4,offset:0},{id:'survival-fire-2',x:-4.5,z:-4.6,radius:.32,heatRadius:.8,base:.865,height:.5,period:5.2,on:1.4,offset:2.6}];
 const boxes=[box('floor',0,-.1,0,14,.2,14,'tile'),...platforms,box('wall-left',-6.8,2,0,.15,4,14,'tile'),box('wall-right',6.8,2,0,.15,4,14,'tile'),box('wall-back',0,2,-6.8,14,4,.15,'tile')];
 return {mode:'SURVIVAL',start:{x:0,y:.91+RADIUS,z:.45},goal:null,sink:null,platforms,boxes,water,fires,checkpoints:[],gates:[],arenas:[],zones:[{name:'ENDLESS SURVIVAL',hint:'台と橋を行き来して逃げろ！青い水場で回復。30秒ごとに料理人が増える。'}],nodes,edges,room:{width:14,depth:14,z:0},intro:null};
}
export const createStage=mode=>mode==='SURVIVAL'?createSurvivalStage():createEscapeStage();
