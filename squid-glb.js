import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assetURL} from './character-registry.js';
import {MODEL_QUALITY} from './seafood-settings.js';
import {prepareSquidRig,bindSquidRig,SquidMotion} from './squid-motion.js';
import {FishContact} from './fish-contact.js';
import {BATTLE} from './battle-rules.js';

// Presentation units only. The original procedural mantle is about .255 long.
// Squid_Root has +Z arms and a -Z mantle, matching the existing squid, not fish.
export const SQUID_GLB={path:'assets/models/squid.glb',mantleLength:.255,rotationY:0};
export class SquidAsset{
 constructor(load=url=>new GLTFLoader().loadAsync(url)){this.load=load;this.state='idle';this.templates=new Map();}
 request({retry=false}={}){
  if(this.promise)return this.promise;
  if(this.state==='ready')return Promise.resolve(this.value);
  if(this.state==='failed'&&!retry)return Promise.resolve(null);
  this.state='loading';
  this.promise=Promise.resolve().then(()=>this.load(assetURL(SQUID_GLB.path))).then(gltf=>{
   const scene=gltf.scene||gltf;
   if(!scene.getObjectByName('Body'))throw Error('squid.glb に Body がありません');
   scene.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(scene);
   if(bounds.isEmpty()||!Number.isFinite(bounds.getSize(new THREE.Vector3()).length()))throw Error('squid.glb の寸法が不正です');
   this.value=scene;this.state='ready';return scene;
  }).catch(error=>{this.state='failed';this.error=String(error.message||error);console.warn('[BBB squid.glb] 従来のイカで続行します:',this.error);return null;}).finally(()=>{this.promise=null;});
  return this.promise;
 }
 template(quality){
  if(this.state!=='ready')return null;
  if(this.templates.has(quality))return this.templates.get(quality);
  const scene=this.value,body=scene.getObjectByName('Body');scene.updateMatrixWorld(true);
  const bodyBounds=new THREE.Box3().setFromObject(body),bounds=new THREE.Box3().setFromObject(scene),center=bounds.getCenter(new THREE.Vector3());
  const scale=SQUID_GLB.mantleLength/(bodyBounds.max.z-bodyBounds.min.z);
  if(!Number.isFinite(scale)||scale<=0)throw Error('イカの胴体寸法が不正です');
  const parts=[];let arm=0,tentacle=8;
  scene.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const name=mesh.name,role=name==='Body'?'mantle':/^Fin_/.test(name)?'fin':/^(Arm_|Tentacle_)/.test(name)?'arm':null;
   const geometry=mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);geometry.translate(-center.x,-center.y,-center.z);geometry.scale(scale,scale,scale);geometry.rotateY(SQUID_GLB.rotationY);geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const index=role==='arm'?(/^Tentacle_/.test(name)?tentacle++:arm++):0;
   const rig=role?prepareSquidRig(geometry,role,index,quality):null;
   // Raise long hanging tips at their root rather than letting their rest pose
   // lift the entire mantle off the floor. Skinning preserves the source shape.
   if(role==='arm'){const floor=(bodyBounds.min.y-center.y)*scale;rig.restPitch=-Math.min(.42,Math.atan2(Math.max(0,floor-geometry.boundingBox.min.y),Math.max(.001,geometry.boundingBox.max.z-rig.start)));}
   parts.push({name,geometry,material:mesh.material,rig});
  });
  const eye=scene.getObjectByName('Eye_L'),head=new THREE.Box3().setFromObject(eye||body).getCenter(new THREE.Vector3()).sub(center).multiplyScalar(scale);head.x=0;
  const result={parts,head,scale,bounds:bounds.clone(),bodyBounds:bodyBounds.clone()};this.templates.set(quality,result);return result;
 }
}
export const squidAsset=new SquidAsset();
export const requestSquidGLB=options=>squidAsset.request(options);
export const squidModelSource=()=>squidAsset.state==='ready'?'glb':'procedural';

export function createGLBSquid(parent,quality='medium',asset=squidAsset){
 const data=asset.template(quality);if(!data)return null;
 const root=new THREE.Group(),skin=new THREE.Group(),head=new THREE.Object3D(),materials=new Map(),rigs=[],q=MODEL_QUALITY[quality];
 root.add(skin);skin.position.y=-.055;head.position.copy(data.head);skin.add(head);parent.add(root);
 function material(source,fin){
  if(!materials.has(source)){
   const mat=source.clone();mat.envMapIntensity=.6;
   if(fin){mat.depthWrite=false;mat.forceSinglePass=true;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-1;}
   materials.set(source,{mat,base:mat.color.clone(),color:mat.color.clone(),roughness:mat.roughness});
  }
  return materials.get(source).mat;
 }
 for(const part of data.parts){
  const fin=part.rig?.role==='fin',m=Array.isArray(part.material)?part.material.map(x=>material(x,fin)):material(part.material,fin);
  const mesh=part.rig?new THREE.SkinnedMesh(part.geometry,m):new THREE.Mesh(part.geometry,m);mesh.name=part.name;mesh.userData.sharedPool=true;mesh.castShadow=q.shadows&&!fin;mesh.receiveShadow=false;
  if(part.rig){mesh.boundingSphere=part.geometry.boundingSphere.clone();mesh.boundingSphere.radius+=.25;}
  skin.add(mesh);if(part.rig)rigs.push(bindSquidRig(mesh,part.rig));
 }
 const contact=new FishContact({root}),motion=new SquidMotion(skin,rigs,quality);let strength=1,disposed=false;
 return {root,skin,kind:'squid',source:'glb',quality,vertices:data.parts.reduce((sum,p)=>sum+p.geometry.attributes.position.count,0),skinnedMeshes:rigs.length,animations:['TailBeat_A','TailBeat_D','Airborne','Landing','FeignDeath'],
  accent(value){const tint=new THREE.Color(value);for(const {mat,base,color}of materials.values()){color.copy(base);if(!/Eye/.test(mat.name))color.lerp(tint,.25);mat.color.copy(color);}},
  moisture(value){const dry=1-THREE.MathUtils.clamp(value/100,0,1);for(const {mat,color,roughness}of materials.values()){mat.color.copy(color);mat.roughness=Math.min(1,roughness+dry*.3);}},
  strength(value){strength=value;},flash(hit){for(const {mat}of materials.values())mat.emissive?.setScalar(hit?1.8:0);},
  rainbow(amount,time,hit){if(!hit)for(const {mat}of materials.values())mat.emissive?.setHSL(time*.12%1,.8,.09*amount);},
  headPosition(target){head.getWorldPosition(target);},stroke(){},play(){},poseStats(){return {clip:'SquidFlexGLB',sideways:skin.rotation.z,...motion.snapshot()};},
  reset(){root.visible=true;motion.reset();for(const rig of rigs)rig.restApplied=0;},
  update(pose){root.position.set(pose.p.x,pose.p.y,pose.p.z);root.rotation.set(0,pose.yaw+Math.PI/2,0);for(const rig of rigs)if(rig.restPitch)rig.bones[0].rotation.x-=rig.restApplied||0;motion.update(pose,strength,q.animationHz);for(const rig of rigs)if(rig.restPitch){rig.restApplied=rig.restPitch;rig.bones[0].rotation.x+=rig.restApplied;}if(pose.grounded)contact.correct(pose.p.y-BATTLE.bodyY+.008);},
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();motion.dispose();for(const {mat}of materials.values())mat.dispose();}
 };
}
