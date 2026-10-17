import {squidAsset,requestSquidGLB,createGLBSquid} from './squid-glb.js';
import {prepareSquidRig,bindSquidRig,SquidMotion} from './squid-motion.js';
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

  const profile=Array.from({length:q.curve*2+1},(_,i)=>{const t=i/(q.curve*2);return new THREE.Vector2(.003+.046*Math.sin(Math.PI*t)**.7,.23*t);});const g=new THREE.LatheGeometry(profile,q.radial*2);g.rotateX(Math.PI/2);g.translate(0,0,-.185);part('mantle','skin',[g,oval(0,-.002,.065,.032,.029,.04)]);
  part('mantle fins','fin',[fin([[0,-.18],[-.085,-.10],[0,-.025]]),fin([[0,-.18],[.085,-.10],[0,-.025]])]);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.cos(a)*.023,y=Math.sin(a)*.016;part('arm'+i,'skin',[tube([[x,y,0],[x*1.3,y*.8,.055],[x*1.8,y*.6,.11],[x*2,y,.15+(i>7?.04:0)]],i>7?.003:.0055)],[0,0,.075]);}

 const headZ=.06,eyeWidth=.03;
 part('eyes','eye',[-1,1].map(s=>oval(s*eyeWidth,.021,headZ,.010,.011,.011)));
 part('pupils','pupil',[-1,1].map(s=>oval(s*(eyeWidth+.007),.022,headZ-.002,.005,.007,.007)));
 // Keep the visual envelope close to the existing common fish hit volume.
 const bounds=new THREE.Box3();for(const p of parts){p.geometry.computeBoundingBox();bounds.union(p.geometry.boundingBox);}const scale=.455/(bounds.max.z-bounds.min.z),centerZ=(bounds.min.z+bounds.max.z)/2;
 for(const p of parts){p.geometry.translate(0,0,-centerZ);p.geometry.scale(scale,scale,scale);p.geometry.computeBoundingSphere();p.pivot=p.pivot.map((n,i)=>(n-(i===2?centerZ:0))*scale);const role=p.name==='mantle'?'mantle':p.name==='mantle fins'?'fin':p.name.startsWith('arm')?'arm':null;if(role)p.rig=prepareSquidRig(p.geometry,role,role==='arm'?Number(p.name.slice(3)):0,quality);}
 const result={parts,headZ:(headZ-centerZ)*scale};templates.set(key,result);return result;
}
export function createSeafoodModel(parent,kind='squid',quality='medium'){
 kind=characterId(kind);quality=qualityId(quality);if(kind==='fish')throw new Error('魚は既存のGLBファクトリを使用してください');
 if(kind==='squid'){if(squidAsset.state==='ready')return createGLBSquid(parent,quality);if(typeof window!=='undefined'&&squidAsset.state==='idle')requestSquidGLB();}
 const data=template(kind,quality),q=MODEL_QUALITY[quality],root=new THREE.Group(),skin=new THREE.Group(),head=new THREE.Object3D();root.add(skin);parent.add(root);head.position.set(0,.03,data.headZ);skin.add(head);skin.position.y=-.055;
 const palette={skin:'#b7aaa0',fin:'#acb0a1',eye:'#c1bca6',pupil:'#101c1c'},materials=new Map(),rigs=[];
 for(const item of data.parts){let mat=materials.get(item.category);if(!mat){const Material=quality==='high'?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;mat=new Material({...(quality==='high'?{clearcoat:.18,clearcoatRoughness:.38}:{}),color:palette[item.category],roughness:quality==='low'?.8:.47,metalness:0,envMapIntensity:.6,flatShading:quality==='low',vertexColors:item.category==='skin',side:THREE.DoubleSide});if(item.category==='fin'&&quality!=='low'){mat.transparent=true;mat.opacity=.86;mat.depthWrite=false;mat.forceSinglePass=true;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-1;}materials.set(item.category,mat);}const mesh=item.rig?new THREE.SkinnedMesh(item.geometry,mat):new THREE.Mesh(item.geometry,mat);if(item.rig){mesh.boundingSphere=item.geometry.boundingSphere.clone();mesh.boundingSphere.radius+=.12;}mesh.userData.sharedPool=true;// Thin deforming surfaces must not receive their own stale shadow map (updated at 12.5 Hz).
 mesh.castShadow=q.shadows&&item.category!=='fin';mesh.receiveShadow=false;const pivot=new THREE.Group();pivot.name=item.name;pivot.position.fromArray(item.pivot);mesh.position.set(-item.pivot[0],-item.pivot[1],-item.pivot[2]);pivot.add(mesh);skin.add(pivot);if(item.rig)rigs.push(bindSquidRig(mesh,item.rig));}
 const originals=new Map([...materials].map(([k,m])=>[k,m.color.clone()])),colors=new Map([...originals].map(([k,c])=>[k,c.clone()]));let strength=1;const contact=new FishContact({root}),motion=new SquidMotion(skin,rigs,quality);
 const api={root,skin,kind,quality,source:'procedural',animations:['TailBeat_A','TailBeat_D','Airborne','Landing','FeignDeath'],vertices:data.parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),skinnedMeshes:rigs.length,
  accent(value){for(const [k,m] of materials){colors.get(k).copy(originals.get(k));if(k==='skin'||k==='fin')colors.get(k).lerp(new THREE.Color(value),.25);m.color.copy(colors.get(k));}},
  moisture(value){const dry=1-THREE.MathUtils.clamp(value/100,0,1);for(const [k,m] of materials){m.color.copy(colors.get(k));m.roughness=Math.min(1,(quality==='low'?.8:.47)+dry*.3);}},
  strength(v){strength=v;},flash(hit){for(const m of materials.values())m.emissive.setScalar(hit?1.8:0);},rainbow(amount,time,hit){if(!hit)for(const m of materials.values())m.emissive.setHSL(time*.12%1,.8,.09*amount);},
  headPosition(target){head.getWorldPosition(target);},stroke(){},play(){},poseStats(){return {clip:'SquidFlex',sideways:skin.rotation.z,...motion.snapshot()};},
  reset(){root.visible=true;motion.reset();},
  update(sim){root.position.set(sim.p.x,sim.p.y,sim.p.z);root.rotation.set(0,sim.yaw+Math.PI/2,0);motion.update(sim,strength,q.animationHz);if(sim.grounded)contact.correct(sim.p.y-BATTLE.bodyY+.008);},
  dispose(){root.removeFromParent();motion.dispose();materials.forEach(m=>m.dispose());}
 };return api;
}
export function seafoodTemplateStats(kind,quality){const t=template(kind,qualityId(quality));return {vertices:t.parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),meshes:t.parts.length};}
