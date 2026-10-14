import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mesh, cube, sphere, physical, texture } from './visuals.js';
import { PLATFORMS, FIRE_ZONES, WATER_ZONES, CHECKPOINTS, GATE, SINK, GOAL, fireActive } from './stage.js';

function label(scene,text,x,y,z,color='#e8c98e'){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#102e35';ctx.fillRect(0,0,1024,256);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(8,8,1008,240);ctx.fillStyle=color;ctx.font='bold 58px "Yu Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=mesh(new THREE.PlaneGeometry(1.55,.39),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),scene,[x,y,z]);m.castShadow=false;return m;
}
function flameTexture(){const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,204,8,64,160,110);g.addColorStop(0,'#fff5aaff');g.addColorStop(.24,'#ffd267ed');g.addColorStop(.53,'#ff651aac');g.addColorStop(1,'#f32e0000');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(62,2);ctx.bezierCurveTo(42,100,11,142,22,224);ctx.bezierCurveTo(45,260,108,257,110,215);ctx.bezierCurveTo(116,160,71,117,62,2);ctx.fill();return new THREE.CanvasTexture(c);}
export function createWorld(scene,renderer,boxes){
 scene.background=new THREE.Color('#aec1c4');scene.fog=new THREE.Fog('#aec1c4',18,42);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
 const steel=physical('#bccbd0',.28,.85);steel.map=texture('steel');steel.bumpMap=steel.map;steel.bumpScale=.0015;
 const wood=physical('#ffffff',.72);wood.map=texture('wood');wood.bumpMap=wood.map;wood.bumpScale=.004;
 const tile=physical('#bbc6bf',.75),dark=physical('#273b3c',.55,.4),ceramic=physical('#f2ecda',.21),blueCeramic=physical('#739b9b',.26),brass=physical('#d6b77b',.3,.6);
 const cameraObstacles=[];
 for(const b of boxes){if(b.kind==='gate')continue;if(['carrot','cucumber','tomato','utensil','pot','pan'].includes(b.kind))continue;
  const {center:p,size:s}=b;let mat=b.kind==='wood'?wood:b.kind==='tile'?tile:b.kind==='rail'?dark:steel;
  if(b.kind==='plate'||b.kind==='bowl'){
   // The tray is the shared collision envelope; dishes sit flush within it.
   const tray=cube(scene,[s.x,.075,s.z],[p.x,b.max.y-.0375,p.z],steel,.035);cameraObstacles.push(tray);
   const radius=Math.min(s.x,s.z)*.45;
   for(let i=0;i<4;i++){const dish=mesh(new THREE.CylinderGeometry(radius*(1-i*.015),radius*.94,.022,64),i%2?ceramic:blueCeramic,scene,[p.x,b.max.y-.025-i*.023,p.z]);dish.receiveShadow=true;}
   const rim=mesh(new THREE.TorusGeometry(radius,.014,10,64),ceramic,scene,[p.x,b.max.y-.014,p.z]);rim.rotation.x=Math.PI/2;
   if(b.kind==='bowl'){const bowl=mesh(new THREE.SphereGeometry(radius*.8,48,24,0,Math.PI*2,0,Math.PI/2),ceramic,scene,[p.x,b.max.y-radius*.8*.40,p.z]);bowl.scale.y=.40;}
   for(const x of [-s.x*.4,s.x*.4])for(const z of [-s.z*.4,s.z*.4])cube(scene,[.05,b.max.y-.10,.05],[p.x+x,(b.max.y-.10)/2,p.z+z],dark);
  }else{const m=cube(scene,[s.x,s.y,s.z],[p.x,p.y,p.z],mat,b.kind==='wood'?.018:b.id.startsWith('sink')?.014:0);if(b.id!=='floor'&&b.id!=='board')cameraObstacles.push(m);}
 }
 // Detailed kitchen ingredients retain the same AABB used by simulation.
 for(const b of boxes){const {center:p,size:s}=b;
  if(b.kind==='carrot'){const m=mesh(new THREE.CylinderGeometry(.03,.095,s.z,28),physical('#c87737',.6),scene,[p.x,p.y,p.z]);m.rotation.x=Math.PI/2;sphere(scene,[.035,.015,.08],[p.x,p.y+.05,p.z-.29],physical('#48753d',.9));}
  if(b.kind==='cucumber'){const m=mesh(new THREE.CylinderGeometry(.095,.095,s.z,28),physical('#456a3d',.59),scene,[p.x,p.y,p.z]);m.rotation.x=Math.PI/2;for(let i=0;i<8;i++)sphere(scene,[.012,.015,.016],[p.x+.07*Math.sin(i),p.y+.07,p.z-.26+i*.065],physical('#769054',.7));}
  if(b.kind==='tomato'){sphere(scene,[s.x/2,s.y/2,s.z/2],[p.x,p.y,p.z],physical('#c14732',.3));for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=cube(scene,[.045,.01,.1],[p.x+Math.sin(a)*.035,p.y+s.y/2,p.z+Math.cos(a)*.035],physical('#426b35',.8),.009);leaf.rotation.y=a;}}
  if(b.id==='cutting-knife'){cube(scene,[.50,.016,.17],[p.x-.08,p.y-.04,p.z],physical('#dce6e5',.16,.95),.007);cube(scene,[.20,.08,.07],[p.x+.27,p.y,p.z],dark,.015);}
  if(b.id==='utensil-pot'){mesh(new THREE.CylinderGeometry(.20,.19,.45,40),steel,scene,[p.x,p.y-.07,p.z]);for(let i=0;i<4;i++){const spoon=mesh(new THREE.CylinderGeometry(.013,.013,.45,10),steel,scene,[p.x+(i-1.5)*.045,p.y+.16,p.z]);spoon.rotation.z=(i-1.5)*.10;sphere(scene,[.045,.07,.01],[p.x+(i-1.5)*.06,p.y+.39,p.z],steel);}}
  if(b.kind==='pot'||b.kind==='pan'){mesh(new THREE.CylinderGeometry(s.x/2,s.x*.43,s.y,40),dark,scene,[p.x,p.y,p.z]);const rim=mesh(new THREE.TorusGeometry(s.x/2,.012,8,40),steel,scene,[p.x,p.y+s.y/2,p.z]);rim.rotation.x=Math.PI/2;cube(scene,[.18,.045,.06],[p.x+.25,p.y,p.z],dark,.015);}
 }
 // Cabinet faces make the large platforms read as kitchen furniture.
 for(const b of PLATFORMS.filter(p=>!['plate','bowl'].includes(p.kind)&&p.size.z>1.3)){
  const count=Math.max(1,Math.floor(b.size.x/.8));for(let i=0;i<count;i++){const x=b.min.x+(i+.5)*b.size.x/count;cube(scene,[b.size.x/count-.025,b.size.y*.70,.025],[x,b.size.y*.44,b.max.z+.015],steel,.014);cube(scene,[.20,.026,.035],[x,b.size.y*.69,b.max.z+.043],dark,.009);}
 }
 // Controlled serving trolley: it moves aside only after the chef is surprised.
 const gate=new THREE.Group();gate.position.set(GATE.x,0,GATE.z);scene.add(gate);
 cube(gate,[3.3,.055,.18],[0,1.12,0],dark,.015);cube(gate,[3.3,.055,.18],[0,2.18,0],steel,.018);
 cube(gate,[3.3,.95,.09],[0,1.61,0],steel,.025);
 for(let i=0;i<9;i++)cube(gate,[.055,1.1,.075],[-1.5+i*.375,1.65,0],steel,.009);
 for(const x of [-1.4,1.4]){const wheel=mesh(new THREE.CylinderGeometry(.08,.08,.055,24),dark,gate,[x,1.10,.07]);wheel.rotation.z=Math.PI/2;}
 const gateSign=label(gate,'料理人のワゴン',0,1.76,.10);
 const gateObstacle=cube(scene,[GATE.sx,GATE.sy,GATE.sz],[GATE.x,GATE.y,GATE.z],new THREE.MeshBasicMaterial({visible:false}));cameraObstacles.push(gateObstacle);
 // Water patches are visual only. The same sizes/heights are used for recovery.
 const waterMaterial=new THREE.MeshPhysicalMaterial({color:'#72bbb9',roughness:.13,metalness:.06,transparent:true,opacity:.45,clearcoat:1,depthWrite:false,side:THREE.DoubleSide});
 const waters=[];for(const w of WATER_ZONES){const m=mesh(new THREE.PlaneGeometry(w.sx,w.sz),waterMaterial,scene,[w.x,w.id==='sink-water'?SINK.water:w.y+.009,w.z]);m.rotation.x=-Math.PI/2;m.castShadow=false;waters.push(m);if(w.id!=='sink-water'){const r=mesh(new THREE.TorusGeometry(Math.min(w.sx,w.sz)*.43,.009,8,48),brass,scene,[w.x,w.y+.012,w.z]);r.rotation.x=Math.PI/2;}}
 for(const c of CHECKPOINTS){label(scene,`CHECKPOINT ${c.id} / 水分回復`,1.8,c.p.y+.75,c.p.z-.60,'#9cdeca');cube(scene,[.04,c.p.y+.75,.04],[1.8,(c.p.y+.75)/2,c.p.z-.62],dark);const ring=mesh(new THREE.TorusGeometry(.27,.009,8,48),new THREE.MeshBasicMaterial({color:'#a9edcc'}),scene,[c.p.x,c.p.y-.059,c.p.z]);ring.rotation.x=Math.PI/2;}
 for(const [text,z] of [['01 まな板',5],['02 食器の足場',2.1],['03 コンロ',-4],['04 料理人',-9.2],['05 シンク',-14.2]])label(scene,text,2.25,1.65,z);
 mesh(new THREE.CylinderGeometry(GOAL.radius,GOAL.radius,.015,64),dark,scene,[GOAL.x,GOAL.y+.007,GOAL.z]);
 const drainRing=mesh(new THREE.TorusGeometry(GOAL.radius,.015,10,64),brass,scene,[GOAL.x,GOAL.y+.014,GOAL.z]);drainRing.rotation.x=Math.PI/2;
 for(let i=0;i<7;i++)cube(scene,[.014,.014,.29],[GOAL.x+(i-3)*.038,GOAL.y+.015,GOAL.z],steel);
 const glow=mesh(new THREE.TorusGeometry(.23,.006,8,64),new THREE.MeshBasicMaterial({color:'#a8f7dc',transparent:true,opacity:.8}),scene,[GOAL.x,SINK.water+.006,GOAL.z]);glow.rotation.x=Math.PI/2;
 const gl=new THREE.PointLight('#b3ffda',1.2,1.4);gl.position.set(0,1,-14.6);scene.add(gl);
 const faucet=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.25,-15.38),new THREE.Vector3(0,1.8,-15.38),new THREE.Vector3(0,1.85,-15.10),new THREE.Vector3(0,1.65,-15.03)]);mesh(new THREE.TubeGeometry(faucet,32,.028,12,false),steel,scene);
 // Burners, flame billboards, visible warning circles and warm dynamic light.
 const flames=[];const flameMap=flameTexture();
 for(const f of FIRE_ZONES){mesh(new THREE.CylinderGeometry(f.radius*.8,f.radius*.8,.025,48),dark,scene,[f.x,1.008,f.z]);for(let i=0;i<3;i++){const coil=mesh(new THREE.TorusGeometry(.11+i*.095,.010,8,48),steel,scene,[f.x,1.025,f.z]);coil.rotation.x=Math.PI/2;}
  const group=new THREE.Group();group.position.set(f.x,f.base,f.z);scene.add(group);const mat=new THREE.MeshBasicMaterial({map:flameMap,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,color:'#ffc877'});
  for(let i=0;i<6;i++){const a=i*Math.PI*2/6,m=mesh(new THREE.PlaneGeometry(.32,.58),mat,group,[Math.sin(a)*.30,.27,Math.cos(a)*.30]);m.rotation.y=a;m.castShadow=false;}
  const light=new THREE.PointLight('#ff7b27',1,1.8);light.position.set(f.x,1.4,f.z);scene.add(light);const pulse=mesh(new THREE.TorusGeometry(f.radius,.012,8,48),new THREE.MeshBasicMaterial({color:'#ffd181'}),scene,[f.x,1.045,f.z]);pulse.rotation.x=Math.PI/2;flames.push({f,group,light,pulse});
 }
 // Decoration lives far off the playable route, so it cannot form a shortcut.
 for(const side of [-1,1])for(const z of [5,0,-5,-10,-14]){
  cube(scene,[1.6,.85,3],[side*4.7,.425,z],steel,.025);for(let i=0;i<4;i++){mesh(new THREE.CylinderGeometry(.12,.12,.035,32),ceramic,scene,[side*4.7+(i-1.5)*.28,.88,z+.7]);}
  if(z===-5){cube(scene,[1.4,.18,2.5],[side*4.7,2.75,z],steel,.06);cube(scene,[.45,.8,.50],[side*4.7,3.2,z],steel);}
 }
 const grout=physical('#91a59f',.9);for(let x=-6;x<=6;x++)cube(scene,[.008,.003,28],[x,.002,-3.2],grout);for(let z=-16;z<=10;z++)cube(scene,[14,.003,.008],[0,.002,z],grout);
 for(let i=0;i<9;i++)cube(scene,[13.5,.006,.004],[0,i*.45,-16.51],grout);
 const lampMat=new THREE.MeshBasicMaterial({color:'#fff4d4'});for(const z of [6,1,-4,-9,-14]){cube(scene,[3.8,.07,.45],[0,3.65,z],dark,.015);cube(scene,[3.6,.012,.33],[0,3.61,z],lampMat);}
 const key=new THREE.DirectionalLight('#ffefd5',2.7);key.position.set(-3,6,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:18});key.shadow.bias=-.00015;key.shadow.normalBias=.01;scene.add(key);scene.add(key.target);
 scene.add(new THREE.HemisphereLight('#e2f2fc','#849582',1.6));const fill=new THREE.DirectionalLight('#d4e8ff',1.1);fill.position.set(4,5,-12);scene.add(fill);
 const arrowMat=new THREE.MeshBasicMaterial({color:'#e9c68c',transparent:true,opacity:.9});
 const waypoints=[[0,6.7,.918],[-.45,5.65,.853],[-.70,4.25,.853],...PLATFORMS.filter(b=>['plate','bowl'].includes(b.kind)).map(b=>[b.center.x,b.center.z,b.max.y+.004]),[0,-1.38,.955],[.72,-2.5,1.035],[-.72,-3.6,1.035],[.72,-4.9,1.035],[0,-6.2,1.055],[0,-7.7,1.055],[0,-8.5,1.055],[.65,-10.7,1.055],[0,-12.2,1.055],[0,-13.5,.81]];
 for(const [x,z,y] of waypoints){const shape=new THREE.Shape();shape.moveTo(-.08,.05);shape.lineTo(0,-.05);shape.lineTo(.08,.05);shape.lineTo(.08,0);shape.lineTo(0,-.10);shape.lineTo(-.08,0);shape.closePath();const a=mesh(new THREE.ShapeGeometry(shape),arrowMat,scene,[x,y,z]);a.rotation.x=-Math.PI/2;a.castShadow=false;}
 return {key,cameraObstacles,glow,gate,flames,update(sim){
  glow.material.opacity=.55+Math.sin(sim.time*3)*.22;gate.position.x=THREE.MathUtils.lerp(gate.position.x,sim.gateOpened?3.7:0,.15);gateObstacle.visible=!sim.gateOpened;gateObstacle.layers.set(sim.gateOpened?2:0);
  for(const {f,group,light,pulse} of flames){const active=fireActive(f,sim.time);group.visible=active;light.intensity=active?1.1+Math.sin(sim.time*19)*.3:0;group.scale.y=.92+Math.sin(sim.time*15+f.offset)*.12;pulse.material.color.set(active?'#ff6a35':'#99c9bc');pulse.material.opacity=active?1:.6;}
  key.target.position.set(sim.p.x,0,sim.p.z);key.position.set(sim.p.x-3,6,sim.p.z+4);key.target.updateMatrixWorld();
 }};
}
