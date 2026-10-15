import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {characterId,qualityId,MODEL_QUALITY} from './seafood-settings.js';
import {FishContact} from './fish-contact.js';
import {BATTLE} from './battle-rules.js';
const templates=new Map();
// Templates contain immutable shared buffers. Each instance owns its materials,
// animated transforms and colors; all choices are cosmetic, never collision data.
function template(kind,quality){
 const key=kind+':'+quality;if(templates.has(key))return templates.get(key);
 const q=MODEL_QUALITY[quality],parts=[];
 function part(name,category,geometries,pivot=[0,0,0]){const prepared=geometries.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(prepared);new Set([...geometries,...prepared]).forEach(g=>g.dispose());if(category==='skin'){const a=g.attributes.position,colors=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){const shade=.90+.09*Math.sin(a.getZ(i)*260+a.getX(i)*95)*Math.sin(a.getY(i)*340);colors[i*3]=shade;colors[i*3+1]=shade;colors[i*3+2]=shade;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));}g.computeBoundingSphere();parts.push({name,category,geometry:g,pivot});}
 function oval(x,y,z,sx,sy,sz){const g=new THREE.SphereGeometry(1,q.radial*2,q.radial);g.scale(sx,sy,sz);g.translate(x,y,z);return g;}
 function tube(points,radius){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),q.curve,radius,q.radial,false);}
 function fin(points){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const g=new THREE.ShapeGeometry(shape,Math.max(2,q.curve));g.rotateX(Math.PI/2);return g;}
 if(kind==='shrimp'){
  for(let group=0;group<3;group++){const segments=[];for(let i=group*3;i<Math.min(7,group*3+3);i++)segments.push(oval(0,.01+Math.sin(i/7*Math.PI)*.012,-.11+i*.037,.041-i*.003,.037-i*.002,.027));part('shell'+group,'skin',segments,[0,0,-.11+group*.09]);}
  const ridges=[];for(let i=0;i<6;i++){const g=new THREE.TorusGeometry(.037-i*.002,.0015,q.radial,q.radial*2);g.scale(1,1,.65);g.translate(0,.016,-.095+i*.037);ridges.push(g);}part('shell joints','detail',ridges);
  part('tail fan','fin',[-1,0,1].map(s=>fin([[0,.11],[s*.065-.025,.20],[s*.045+.025,.215],[.016,.12]])),[0,0,.12]);
  const legs=[];for(let s of [-1,1])for(let i=0;i<5;i++)legs.push(tube([[s*.025,-.012,-.1+i*.028],[s*.05,-.029,-.09+i*.028],[s*.068,-.032,-.065+i*.028]],.002));part('legs','fin',legs);
  part('antennae','detail',[-1,1].map(s=>tube([[s*.018,.015,-.14],[s*.045,.021,-.20],[s*.075,.024,-.245]],.0013)));
  part('rostrum','skin',[tube([[0,.01,-.11],[0,.008,-.19]],.006)]);
 }else if(kind==='squid'){
  const profile=Array.from({length:q.curve*2+1},(_,i)=>{const t=i/(q.curve*2);return new THREE.Vector2(.003+.046*Math.sin(Math.PI*t)**.7,.23*t);});const g=new THREE.LatheGeometry(profile,q.radial*2);g.rotateX(Math.PI/2);g.translate(0,0,-.185);part('mantle','skin',[g,oval(0,-.002,.065,.032,.029,.04)]);
  part('mantle fins','fin',[fin([[0,-.18],[-.085,-.10],[0,-.025]]),fin([[0,-.18],[.085,-.10],[0,-.025]])]);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.cos(a)*.023,y=Math.sin(a)*.016;part('arm'+i,'skin',[tube([[x,y,0],[x*1.3,y*.8,.055],[x*1.8,y*.6,.11],[x*2,y,.15+(i>7?.04:0)]],i>7?.003:.0055)],[0,0,.075]);}
 }else{
  part('mantle','skin',[oval(0,.018,-.045,.068,.057,.087),oval(0,-.008,.035,.043,.033,.035)]);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a),z=Math.sin(a),points=[[x*.02,0,z*.02],[x*.06,-.018,z*.07],[x*.105,-.023,z*.13],[x*.13,-.015,z*.16]];part('arm'+i,'skin',[tube(points,.010)],[0,-.01,.03]);
   const suckers=[];for(let j=1;j<5;j++){const t=j/5;suckers.push(oval(x*(.025+.10*t),-.026,z*(.025+.13*t),.004,.002,.004));}part('suckers'+i,'belly',suckers,[0,-.01,.03]);}
 }
 const headZ=kind==='shrimp'?-.125:kind==='squid'?.06:-.025,eyeWidth=kind==='octopus'?.053:.03;
 part('eyes','eye',[-1,1].map(s=>oval(s*eyeWidth,.021,headZ,.010,.011,.011)));
 part('pupils','pupil',[-1,1].map(s=>oval(s*(eyeWidth+.007),.022,headZ-.002,.005,.007,.007)));
 // Keep the visual envelope close to the existing common fish hit volume.
 const bounds=new THREE.Box3();for(const p of parts){p.geometry.computeBoundingBox();bounds.union(p.geometry.boundingBox);}const scale=.455/(bounds.max.z-bounds.min.z),centerZ=(bounds.min.z+bounds.max.z)/2;
 for(const p of parts){p.geometry.translate(0,0,-centerZ);p.geometry.scale(scale,scale,scale);p.geometry.computeBoundingSphere();p.pivot=p.pivot.map((n,i)=>(n-(i===2?centerZ:0))*scale);}
 const result={parts,headZ:(headZ-centerZ)*scale};templates.set(key,result);return result;
}
export function createSeafoodModel(parent,kind='shrimp',quality='medium'){
 kind=characterId(kind);quality=qualityId(quality);if(kind==='fish')throw new Error('魚は既存のGLBファクトリを使用してください');
 const data=template(kind,quality),q=MODEL_QUALITY[quality],root=new THREE.Group(),skin=new THREE.Group(),head=new THREE.Object3D();root.add(skin);parent.add(root);head.position.set(0,.03,data.headZ);skin.add(head);skin.position.y=-.055;
 const base=kind==='shrimp'?'#ae6751':kind==='squid'?'#b7aaa0':'#9f6a58',palette={skin:base,detail:'#6d4c40',fin:kind==='shrimp'?'#b9856d':'#acb0a1',belly:'#cbb9a2',eye:'#c1bca6',pupil:'#101c1c'},materials=new Map(),parts=[];
 for(const item of data.parts){let mat=materials.get(item.category);if(!mat){mat=new THREE.MeshStandardMaterial({color:palette[item.category],roughness:quality==='low'?.8:.53,metalness:0,flatShading:quality==='low',vertexColors:item.category==='skin',side:THREE.DoubleSide});if(item.category==='fin'&&quality!=='low'){mat.transparent=true;mat.opacity=.86;mat.depthWrite=false;}materials.set(item.category,mat);}const mesh=new THREE.Mesh(item.geometry,mat);mesh.userData.sharedPool=true;mesh.castShadow=q.shadows;mesh.receiveShadow=q.shadows;const pivot=new THREE.Group();pivot.name=item.name;pivot.position.fromArray(item.pivot);mesh.position.set(-item.pivot[0],-item.pivot[1],-item.pivot[2]);pivot.add(mesh);skin.add(pivot);parts.push({pivot,name:item.name});}
 const originals=new Map([...materials].map(([k,m])=>[k,m.color.clone()])),colors=new Map([...originals].map(([k,c])=>[k,c.clone()]));let strength=1,frame=-1,strokeSide=1;const contact=new FishContact({root});
 const api={root,skin,kind,quality,animations:['TailBeat_A','TailBeat_D','Airborne','Landing','FeignDeath'],vertices:data.parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),skinnedMeshes:0,
  accent(value){for(const [k,m] of materials){colors.get(k).copy(originals.get(k));if(k==='skin'||k==='fin')colors.get(k).lerp(new THREE.Color(value),.25);m.color.copy(colors.get(k));}},
  moisture(value){const dry=1-THREE.MathUtils.clamp(value/100,0,1);for(const [k,m] of materials){m.color.copy(colors.get(k));m.roughness=Math.min(1,(quality==='low'?.8:.53)+dry*.3);}},
  strength(v){strength=v;},flash(hit){for(const m of materials.values())m.emissive.setScalar(hit?1.8:0);},rainbow(amount,time,hit){if(!hit)for(const m of materials.values())m.emissive.setHSL(time*.12%1,.8,.09*amount);},
  headPosition(target){head.getWorldPosition(target);},stroke(key){strokeSide=key==='D'?-1:1;frame=-1;},play(){},poseStats(){return {clip:'Seafood',sideways:skin.rotation.z};},
  reset(){root.visible=true;frame=-1;for(const {pivot} of parts)pivot.rotation.set(0,0,0);skin.rotation.set(0,0,0);},
  update(sim){root.position.set(sim.p.x,sim.p.y,sim.p.z);root.rotation.set(0,sim.yaw+Math.PI/2,0);const tick=Math.floor(sim.time*q.animationHz);if(tick!==frame){frame=tick;const t=sim.time,w=sim.dead?0:Math.min(1,sim.stroke/.44)*strength,side=sim.strokeSide||strokeSide;skin.rotation.z=sim.dead?.45:side*Math.sin(w*Math.PI)*.32;skin.rotation.x=sim.dead?0:Math.sin(t*12)*w*.09;
   for(let i=0;i<parts.length;i++){const {pivot,name}=parts[i];if(name.startsWith('arm')||name.startsWith('suckers')){pivot.rotation.x=Math.sin(t*11-i*.5)*(.03+w*.15);pivot.rotation.y=Math.sin(t*8-i*.5)*w*.17;}if(name==='tail fan')pivot.rotation.x=Math.sin(t*13-.4)*w*.65;if(/^shell[0-2]$/.test(name)){const index=Number(name.at(-1));pivot.rotation.x=Math.sin(w*Math.PI)*index*.28;pivot.position.y=Math.sin(w*Math.PI)*index*.009;}if(name==='tail fan'){pivot.position.y=Math.sin(w*Math.PI)*.025;}if(name==='legs'||name==='antennae'||name==='mantle fins')pivot.rotation.y=Math.sin(t*11-.6)*w*.12;}
  }if(sim.grounded)contact.correct(sim.p.y-BATTLE.bodyY+.008);},
  dispose(){root.removeFromParent();materials.forEach(m=>m.dispose());}
 };return api;
}
export function seafoodTemplateStats(kind,quality){const t=template(kind,qualityId(quality));return {vertices:t.parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),meshes:t.parts.length};}
