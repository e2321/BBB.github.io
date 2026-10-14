import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const physical=(color,roughness=.5,metalness=0)=>new THREE.MeshPhysicalMaterial({color,roughness,metalness});
export function mesh(geo,mat,parent,pos=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const cube=(parent,size,pos,mat,round=0)=>mesh(round?new RoundedBoxGeometry(...size,3,round):new THREE.BoxGeometry(...size),mat,parent,pos);
const sphere=(parent,size,pos,mat)=>{const m=mesh(new THREE.SphereGeometry(1,24,16),mat,parent,pos);m.scale.set(...size);return m;};
function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');let seed=31;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(kind==='wood'){c.fillStyle='#be9361';c.fillRect(0,0,512,512);for(let i=0;i<1100;i++){const y=rand()*512;c.strokeStyle=`rgba(${rand()>.5?'71,39,15':'246,212,150'},${rand()*.24})`;c.lineWidth=rand()*2;c.beginPath();for(let x=0;x<=512;x+=16){const yy=y+Math.sin(x*.018+y)*3;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}for(let i=0;i<70;i++){c.strokeStyle='#42332718';c.beginPath();const x=rand()*512,y=rand()*512;c.moveTo(x,y);c.lineTo(x+rand()*100-50,y+rand()*100-50);c.stroke();}}
 else if(kind==='steel'){c.fillStyle='#b8c5c8';c.fillRect(0,0,512,512);for(let i=0;i<2500;i++){c.strokeStyle=`rgba(${rand()>.5?'255,255,255':'40,50,55'},${rand()*.08})`;c.beginPath();const y=rand()*512,x=rand()*512;c.moveTo(x,y);c.lineTo(x+40+rand()*150,y+rand());c.stroke();}}
 else {const grad=c.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#293b42');grad.addColorStop(.26,'#667e85');grad.addColorStop(.5,'#c8d6d6');grad.addColorStop(.72,'#e5e7da');grad.addColorStop(1,'#516973');c.fillStyle=grad;c.fillRect(0,0,512,512);for(let y=0;y<512;y+=16)for(let x=-16;x<512;x+=19){const xx=x+(Math.floor(y/16)%2)*9;c.strokeStyle=`rgba(29,55,65,${.11+rand()*.18})`;c.lineWidth=1.2;c.beginPath();c.ellipse(xx,y,10,8,0,-.1,Math.PI);c.stroke();c.strokeStyle='#f8ffff60';c.beginPath();c.ellipse(xx,y-1,9,7,0,.25,2.3);c.stroke();}c.strokeStyle='#476b7170';c.lineWidth=2;c.beginPath();c.moveTo(0,244);c.lineTo(512,244);c.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
export function createWorld(scene,renderer,boxes){
 scene.background=new THREE.Color('#a7bcbf');scene.fog=new THREE.Fog('#a7bcbf',10,24);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
 const steel=physical('#bfcbd0',.28,.85);steel.map=texture('steel');steel.bumpMap=steel.map;steel.bumpScale=.002;
 const wood=physical('#ffffff',.72);wood.map=texture('wood');wood.bumpMap=wood.map;wood.bumpScale=.006;
 const tile=physical('#bac5bf',.74),dark=physical('#233b40',.5,.3),ceramic=physical('#f4f0e4',.24),black=physical('#172a2c',.32,.6);
 const cameraObstacles=[];
 for(const b of boxes){const s=b.size,p=b.center;let mat=b.id==='board'?wood:b.id==='floor'||b.id.startsWith('wall')?tile:steel;
  const m=cube(scene,[s.x,s.y,s.z],[p.x,p.y,p.z],mat,b.id==='board'?.02:b.id.startsWith('sink')?.012:0);
  if(b.id!=='floor'&&b.id!=='board')cameraObstacles.push(m);
 }
 // Stainless counter faces, raised edges and open shelf details.
 for(const x of [-2.58,2.58])for(const z of [.58,3.02])cube(scene,[.07,.78,.07],[x,.39,z],dark);
 cube(scene,[5.2,.035,2.4],[0,.26,1.8],dark);
 for(let i=0;i<5;i++){const x=-2.15+i*1.075;cube(scene,[1.02,.64,.022],[x,.42,3.213],steel,.013);cube(scene,[.26,.025,.035],[x,.64,3.245],dark,.008);}
 for(const x of [.55,1.18,1.81,2.44]){const knob=mesh(new THREE.CylinderGeometry(.035,.035,.04,16),black,scene,[x,.68,-.278]);knob.rotation.x=Math.PI/2;}
 for(const x of [-2.62,-.38])for(const z of [-2.17,-.43])cube(scene,[.065,.46,.065],[x,.23,z],dark);
 for(let i=0;i<7;i++)cube(scene,[.38,.022,.34],[-1.2+i*.4,.3,2.5],ceramic,.01);
 // Tile joints remain subtle so the escape route reads clearly.
 const grout=physical('#899e99',.9);
 for(let i=-6;i<=6;i++){cube(scene,[.008,.003,10],[i, .002,0],grout);cube(scene,[12,.003,.008],[0,.002,i],grout);}
 for(let i=-11;i<=11;i++)cube(scene,[.008,3.2,.004],[i*.5,1.6,-4.615],grout);
 for(let i=1;i<7;i++)cube(scene,[11.6,.008,.004],[0,i*.48,-4.615],grout);
 // Front lip is low enough for a 2.6 m/s jump, with an uninterrupted bridge.
 const water=mesh(new THREE.PlaneGeometry(2.27,1.77,24,24),new THREE.MeshPhysicalMaterial({color:'#7bccc6',roughness:.13,metalness:.08,transparent:true,opacity:.33,clearcoat:1,depthWrite:false,side:THREE.DoubleSide}),scene,[-1.5,.60,-1.3]);water.rotation.x=-Math.PI/2;water.castShadow=false;
 const drain=mesh(new THREE.CylinderGeometry(.18,.18,.012,48),physical('#243d40',.3,.8),scene,[-1.5,.559,-1.5]);
 const ring=mesh(new THREE.TorusGeometry(.18,.015,10,48),physical('#ecc585',.23,.65),scene,[-1.5,.567,-1.5]);ring.rotation.x=Math.PI/2;
 for(let i=0;i<7;i++)cube(scene,[.015,.012,.30],[-1.5+(i-3)*.036,.567,-1.5],steel);
 const glow=mesh(new THREE.TorusGeometry(.23,.007,8,48),new THREE.MeshBasicMaterial({color:'#baf8d7',transparent:true,opacity:.8}),scene,[-1.5,.615,-1.5]);glow.rotation.x=Math.PI/2;
 const goalLight=new THREE.PointLight('#a1ffda',1.3,1.8);goalLight.position.set(-1.5,.77,-1.5);scene.add(goalLight);
 // Faucet with a real curved spout.
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.5,1,-2.2),new THREE.Vector3(-1.5,1.5,-2.2),new THREE.Vector3(-1.5,1.57,-1.94),new THREE.Vector3(-1.5,1.35,-1.88)]);
 mesh(new THREE.TubeGeometry(curve,28,.027,12,false),steel,scene);
 for(const x of [-1.7,-1.3])cube(scene,[.08,.06,.06],[x,1.035,-2.2],steel,.015);
 // Four stove burners and a pan sit off the escape route.
 for(const x of [.9,2.05])for(const z of [-.85,-1.7]){mesh(new THREE.CylinderGeometry(.29,.29,.025,32),black,scene,[x,.88,z]);for(let j=0;j<3;j++){const r=mesh(new THREE.TorusGeometry(.09+j*.065,.01,6,32),dark,scene,[x,.899,z]);r.rotation.x=Math.PI/2;}}
 mesh(new THREE.CylinderGeometry(.25,.22,.12,32,1,true),black,scene,[2.05,.97,-1.7]);cube(scene,[.44,.035,.055],[2.46,.99,-1.7],black,.01);
 // Upper racks, crockery, bottles, extractor, and ceiling fixtures.
 for(const y of [1.2,2.05]){cube(scene,[4,.05,.42],[.8,y,-4.3],steel);for(let i=0;i<9;i++){mesh(new THREE.CylinderGeometry(.14,.14,.018,24),ceramic,scene,[-.5+i*.28,y+.04,-4.3]);}}
 for(let i=0;i<6;i++){const mat=physical(['#697d53','#94764d','#73978b'][i%3],.24);mesh(new THREE.CylinderGeometry(.075,.08,.28,20),mat,scene,[-3.3+i*.22,.99,2.1]);mesh(new THREE.CylinderGeometry(.028,.033,.10,16),mat,scene,[-3.3+i*.22,1.18,2.1]);}
 cube(scene,[2.5,.3,1.5],[1.5,2.75,-1.3],steel,.06);cube(scene,[.65,.6,.65],[1.5,3.18,-1.3],steel);
 const lampMat=new THREE.MeshBasicMaterial({color:'#fff9df'});
 for(const z of [-1,2]){cube(scene,[3.7,.07,.5],[0,3.65,z],dark,.02);cube(scene,[3.5,.01,.38],[0,3.61,z],lampMat);}
 const key=new THREE.DirectionalLight('#fff1d9',3.3);key.position.set(-2,6,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:15});key.shadow.bias=-.00015;key.shadow.normalBias=.015;scene.add(key);
 scene.add(new THREE.HemisphereLight('#dcefff','#6b8074',1.8));const fill=new THREE.DirectionalLight('#d7e9ff',1.4);fill.position.set(3,4,-3);scene.add(fill);
 // Small brass chevrons guide the player left, then over the bridge.
 const arrowMat=new THREE.MeshBasicMaterial({color:'#eed4a4',transparent:true,opacity:.82});
 const arrows=[];
 for(const [x,z,angle] of [[-.55,1.38,-Math.PI/2],[-1.2,.82,0],[-1.5,.22,0],[-1.5,-.5,0],[-1.5,-1,0]]){
  const shape=new THREE.Shape();shape.moveTo(-.09,.055);shape.lineTo(0,-.04);shape.lineTo(.09,.055);shape.lineTo(.09,.005);shape.lineTo(0,-.09);shape.lineTo(-.09,.005);shape.closePath();const a=mesh(new THREE.ShapeGeometry(shape),arrowMat,scene,[x,z<-.4?.62:.857,z]);a.rotation.set(-Math.PI/2,0,angle);a.castShadow=false;arrows.push(a);
 }
 return {key,cameraObstacles,water,glow,arrows,drain};
}
export function createFish(scene){
 const root=new THREE.Group();scene.add(root);const skin=new THREE.Group();root.add(skin);skin.rotation.z=Math.PI/2;skin.position.y=-.019;
 const sections=52,sides=32,positions=[],uv=[],indices=[];
 for(let i=0;i<=sections;i++){const t=i/sections,z=-.16+t*.29;const profile=Math.pow(Math.sin(Math.PI*Math.pow(t,.73)),.72);const h=.058*profile+.005,th=.041*profile+.003;
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;positions.push(Math.sin(a)*th,Math.cos(a)*h,z);uv.push(t,j/sides);if(i<sections&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const scales=texture('fish');const material=new THREE.MeshPhysicalMaterial({map:scales,bumpMap:scales,bumpScale:.0011,metalness:.07,roughness:.23,clearcoat:1,clearcoatRoughness:.08});
 mesh(geo,material,skin);
 const finMat=new THREE.MeshPhysicalMaterial({color:'#7a9394',metalness:.03,roughness:.33,transparent:true,opacity:.83,side:THREE.DoubleSide,clearcoat:.8});
 function fin(points,pos){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));const idx=[];for(let i=1;i<points.length-1;i++)idx.push(0,i,i+1);g.setIndex(idx);g.computeVertexNormals();return mesh(g,finMat,skin,pos);}
 const tail=fin([[0,0,0],[0,.062,.065],[0,.016,.052],[0,0,.043],[0,-.016,.052],[0,-.062,.065]],[0,0,.127]);
 const dorsal=fin([[0,.03,-.02],[0,.098,.015],[0,.075,.065],[0,.03,.092]],[0,0,0]);
 const pectoral=[];for(const side of [-1,1]){
  pectoral.push(fin([[0,0,0],[side*.048,-.005,.039],[side*.053,-.012,.065],[0,-.025,.03]],[side*.038,-.008,-.07]));
  const eye=sphere(skin,[.008,.011,.011],[side*.026,.014,-.126],physical('#d8bc67',.22));sphere(skin,[.003,.007,.007],[side*.033,.014,-.129],physical('#08161a',.07));sphere(skin,[.0015,.002,.002],[side*.035,.018,-.132],physical('#ffffff',.03));
  const gillCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.031,.035,-.091),new THREE.Vector3(side*.043,0,-.078),new THREE.Vector3(side*.031,-.039,-.091)]);mesh(new THREE.TubeGeometry(gillCurve,14,.0016,5,false),physical('#4e6364',.38),skin);
 }
 const mouth=mesh(new THREE.TorusGeometry(.008,.0012,6,20),physical('#5c7270',.4),skin,[0,-.003,-.159]);mouth.scale.y=.48;
 const base=new Float32Array(positions);
 const finBases=[tail,dorsal,...pectoral].map(o=>({o,p:o.position.clone()}));
 return {root,update(sim,t){root.position.set(sim.p.x,sim.p.y,sim.p.z);root.rotation.y=sim.yaw;
  const phase=sim.stroke/.42,amp=Math.sin(phase*Math.PI)*.7*sim.strokeSide;const array=geo.attributes.position.array;
  for(let i=0;i<array.length;i+=3){const u=(base[i+2]+.16)/.29;const bend=amp*u*u;array[i]=base[i]+Math.sin(bend)*u*.085;array[i+1]=base[i+1];array[i+2]=base[i+2]-(1-Math.cos(bend))*u*.075;}
  geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();
  for(const {o,p} of finBases){const u=(p.z+.16)/.29;o.position.copy(p);o.position.x+=Math.sin(amp*u*u)*u*.085;o.rotation.y=amp*u;}
  skin.rotation.z=Math.PI/2+(sim.dead?.015:sim.grounded?Math.sin(t*18)*phase*.06:Math.sin(t*14)*.17);skin.rotation.x=sim.dead?0:Math.sin(t*15)*phase*.11;
 }};
}
export function createChef(scene){
 const root=new THREE.Group();scene.add(root);const coat=physical('#f7f4e9',.79),apron=physical('#344a46',.89),skin=physical('#c89879',.62),shoe=physical('#27312e',.62),hair=physical('#433b32',.84);
 const torso=cube(root,[.44,.60,.25],[0,1.03,0],coat,.06);cube(root,[.35,.48,.015],[0,.88,-.145],apron,.02);
 for(const x of [-.085,.085])for(let i=0;i<4;i++)sphere(root,[.014,.014,.009],[x,.92+i*.10,-.139],shoe);
 const head=new THREE.Group();head.position.set(0,1.48,0);root.add(head);sphere(head,[.13,.16,.12],[0,0,0],skin);sphere(head,[.034,.028,.032],[0,-.004,-.119],skin);
 for(const x of [-.05,.05]){sphere(head,[.025,.014,.008],[x,.035,-.11],coat);sphere(head,[.009,.010,.007],[x,.033,-.118],shoe);cube(head,[.054,.012,.008],[x,.061,-.116],hair,.003);sphere(head,[.024,.044,.025],[Math.sign(x)*.131,0,0],skin);}
 const moustache=sphere(head,[.050,.015,.010],[0,-.037,-.114],hair);cube(head,[.23,.085,.22],[0,.15,0],coat,.03);for(let i=0;i<5;i++)sphere(head,[.07,.078,.07],[(i-2)*.043,.22,0],coat);
 const limbs=[];
 function limb(x,y,z,length,r,mat){const pivot=new THREE.Group();pivot.position.set(x,y,z);root.add(pivot);mesh(new THREE.CylinderGeometry(r,r*.85,length,16),mat,pivot,[0,-length/2,0]);return pivot;}
 for(const x of [-.12,.12]){const leg=limb(x,.75,0,.63,.075,coat);cube(leg,[.16,.09,.27],[0,-.65,-.04],shoe,.035);limbs.push(leg);}
 const arms=[];for(const x of [-.27,.27]){const arm=limb(x,1.29,0,.29,.068,coat);const elbow=new THREE.Group();elbow.position.y=-.29;arm.add(elbow);mesh(new THREE.CylinderGeometry(.058,.042,.26,16),coat,elbow,[0,-.13,0]);sphere(elbow,[.05,.066,.043],[0,-.29,0],skin);arms.push({arm,elbow});}
 const knife=createKnife();arms[1].elbow.add(knife);knife.position.set(0,-.29,-.12);knife.rotation.x=Math.PI/2;
 const chefMaterials=new Set();root.traverse(o=>{if(o.isMesh)chefMaterials.add(o.material);});
 return {root,head,setOpacity(opacity){for(const mat of chefMaterials){if(mat.transparent!==(opacity<1)){mat.transparent=opacity<1;mat.depthWrite=opacity===1;mat.needsUpdate=true;}mat.opacity=opacity;}},update(sim,t){const c=sim.chef;root.position.set(c.x,c.y,c.z);root.rotation.y=Math.atan2(-(sim.p.x-c.x),-(sim.p.z-c.z));const state=c.state;const walking=['CHASING','APPROACHING'].includes(state)&&Math.hypot(c.x-sim.p.x,c.z-sim.p.z)>.65;
  limbs.forEach((l,i)=>l.rotation.x=walking?Math.sin(t*7+i*Math.PI)*.36:0);head.rotation.x=state==='STUNNED'?-.35:.24;head.rotation.z=state==='SUSPICIOUS'?Math.sin(t*2)*.13:0;
  root.rotation.z=state==='STUNNED'?Math.sin(t*17)*.08:0;torso.rotation.x=state==='INSPECTING'?.15:0;
  arms.forEach(({arm,elbow},i)=>{arm.rotation.set(walking?Math.sin(t*7+i*Math.PI)*.25:0,0,i?-.1:.1);elbow.rotation.x=-.22;
   if(state==='ATTACKING'&&i===1){arm.rotation.x=-2.4*Math.min(1,c.timer/.4);elbow.rotation.x=-.7;}
   if(state==='INSPECTING'){arm.rotation.x=1.05*Math.min(1,c.timer/.75);elbow.rotation.x=.5;}
   if(state==='STUNNED'){arm.rotation.x=-1.7;arm.rotation.z=i?-.6:.6;}
   if(state==='SUSPICIOUS')arm.rotation.x=.12;
  });knife.visible=!['INSPECTING','STUNNED','APPROACHING'].includes(state);
 }};
}
export function createKnife(){const group=new THREE.Group();const steel=physical('#dae2e4',.16,.95),handle=physical('#282b24',.45);cube(group,[.055,.012,.20],[0,0,-.03],steel,.003);cube(group,[.036,.023,.10],[0,0,.12],handle,.005);for(const z of [.09,.14])sphere(group,[.004,.012,.004],[0,0,z],steel);return group;}
export class Effects {
 constructor(scene){this.drops=[];this.ripples=[];const mat=new THREE.MeshPhysicalMaterial({color:'#bfefef',roughness:.1,transparent:true,opacity:.7});const geo=new THREE.SphereGeometry(.007,6,4);for(let i=0;i<200;i++){const m=mesh(geo,mat,scene);m.visible=false;m.castShadow=false;this.drops.push({m,life:0,v:new THREE.Vector3()});}for(let i=0;i<24;i++){const m=mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:'#c3ede6',transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false}),scene);m.rotation.x=-Math.PI/2;m.visible=false;this.ripples.push({m,life:0});}}
 splash(p,count){let left=count;for(const d of this.drops){if(d.life<=0&&left-->0){d.life=.7;d.m.visible=true;d.m.position.set(p.x,p.y-.03,p.z);d.v.set((Math.random()-.5)*.8,.35+Math.random()*.6,(Math.random()-.5)*.8);}}const r=this.ripples.find(r=>r.life<=0);if(r){r.life=1.2;r.m.visible=true;r.m.position.set(p.x,p.y-.062,p.z);}}
 reset(){for(const a of [...this.drops,...this.ripples]){a.life=0;a.m.visible=false;}}
 update(dt){for(const d of this.drops)if(d.life>0){d.life-=dt;d.m.visible=d.life>0;d.v.y-=2.8*dt;d.m.position.addScaledVector(d.v,dt);}for(const r of this.ripples)if(r.life>0){r.life-=dt;r.m.visible=r.life>0;r.m.scale.setScalar(.02+.16*(1-r.life/1.2));r.m.material.opacity=.35*r.life/1.2;}}
}
