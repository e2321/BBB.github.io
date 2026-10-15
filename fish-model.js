import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {prepareFishQuality,finishFishQuality} from './fish-quality.js';
import { RADIUS } from './physics-config.js';

export async function loadFish(scene,onProgress=()=>{}) {
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/models/madai.glb`,e=>{if(e.total)onProgress(e.loaded/e.total);});
 return createFish(gltf,scene);
}
function createFish(gltf,scene,instance=false){
 const root=new THREE.Group(),skin=new THREE.Group();scene.add(root);root.add(skin);skin.add(gltf.scene);skin.rotation.z=Math.PI/2;skin.position.y=.056-RADIUS;
 const materials=[];let vertices=0,skinnedMeshes=0;
 gltf.scene.traverse(o=>{if(o.isMesh){if(instance)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;vertices+=o.geometry.attributes.position.count;const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){if(!materials.some(a=>a.mat===m)){materials.push({mat:m,color:m.color.clone(),originalColor:m.color.clone(),roughness:m.roughness,clearcoat:m.clearcoat||0});for(const key of ['map','normalMap','roughnessMap'])if(m[key])m[key].anisotropy=4;}}}if(o.isSkinnedMesh)skinnedMeshes++;});
 if(!skinnedMeshes)throw new Error('魚GLBにスキンメッシュがありません');
 const headBone=gltf.scene.getObjectByName('head');
 const mixer=new THREE.AnimationMixer(gltf.scene),actions=new Map();
 for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
 for(const name of ['TailBeat_A','TailBeat_D','Airborne','FeignDeath','Landing','Captured','Dry'])if(!actions.has(name))throw new Error(`魚GLBに ${name} アニメーションがありません`);
 let current='',dryLevel=0,motionStrength=1;const dryColor=new THREE.Color('#86795f');
 function play(name,once=false){if(current===name&&!once)return;const action=actions.get(name);if(!action)return;const previous=actions.get(current);action.reset();action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.enabled=true;action.setEffectiveWeight(motionStrength);action.play();if(previous&&previous!==action){previous.fadeOut(.06);action.fadeIn(.06);}current=name;}
 play('FeignDeath');
 const api={root,skin,animations:[...actions.keys()],vertices,skinnedMeshes,play,
  createInstance(parent,options){const modelScene=clone(gltf.scene);if(options)prepareFishQuality(modelScene,options.quality);const model=createFish({...gltf,scene:modelScene},parent,true);return options?finishFishQuality(model,options.quality):model;},
  accent(color){for(const item of materials){if(/skin|scale/i.test(item.mat.name)){item.color.copy(item.originalColor).lerp(new THREE.Color(color),.28);item.mat.color.copy(item.color);}}},
  rainbow(amount,time,hit=false){if(hit)return;for(const {mat} of materials){if(mat.emissive)mat.emissive.setHSL((time*.12+mat.id*.03)%1,.8,.09*amount);}},
  flash(value){for(const {mat} of materials){mat.emissive?.setRGB(value?1.8:0,value?1.8:0,value?1.8:0);}},
  headPosition(target){headBone.getWorldPosition(target);},
  strength(value){motionStrength=THREE.MathUtils.clamp(value,.2,1);actions.get(current)?.setEffectiveWeight(motionStrength);},
  moisture(value){const dry=1-THREE.MathUtils.clamp(value/100,0,1);for(const {mat,color,roughness,clearcoat} of materials){mat.color.copy(color).lerp(dryColor,dry*.45);mat.roughness=Math.min(1,roughness+dry*.4);mat.clearcoat=clearcoat*(1-dry*.65);}},
  dispose(){root.removeFromParent();mixer.stopAllAction();if(instance){const skeletons=new Set();root.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());materials.forEach(({mat})=>mat.dispose());}},
  stroke(key){mixer.stopAllAction();current='';play(key==='A'?'TailBeat_A':'TailBeat_D',true);},
  poseStats(){gltf.scene.updateMatrixWorld(true);const jaw=gltf.scene.getObjectByName('jaw');return {jawAngle:jaw?2*Math.acos(THREE.MathUtils.clamp(jaw.quaternion.w,-1,1)):null,clip:current,sideways:skin.rotation.z};},
  reset(){mixer.stopAllAction();current='';dryLevel=0;root.visible=true;skin.scale.set(1,1,1);for(const {mat,color,roughness,clearcoat} of materials){mat.color.copy(color);mat.roughness=roughness;mat.clearcoat=clearcoat;}play('FeignDeath');},
  update(sim,dt,deathElapsed=0){root.position.set(sim.p.x,sim.p.y,sim.p.z);root.rotation.set(0,sim.yaw+Math.PI/2,0);
   if(sim.state==='GAMEOVER'){
    if(sim.deathCause==='CAPTURE'){play('Captured');const forward=new THREE.Vector3(-Math.sin(sim.chefFacing??0),0,-Math.cos(sim.chefFacing??0));root.position.set(sim.chef.x,sim.chef.y+1.12,sim.chef.z).addScaledVector(forward,.38);root.rotation.y=(sim.chefFacing??sim.yaw)+Math.PI/2;skin.rotation.z=Math.PI/2+.15*Math.sin(deathElapsed*7)*Math.exp(-deathElapsed);}
    else if(sim.deathCause==='DRY'){play('Dry');dryLevel=Math.min(1,deathElapsed/1.8);for(const {mat,color} of materials){mat.color.copy(color).lerp(new THREE.Color('#866542'),dryLevel*.9);mat.roughness=.25+dryLevel*.6;mat.clearcoat=1-dryLevel;}skin.rotation.z=Math.PI/2;skin.scale.set(1,1-.12*dryLevel,1);}
    else if(['KNIFE','FIRE'].includes(sim.deathCause))root.visible=false;
   }else{
    root.visible=true;skin.scale.set(1,1,1);
    if(sim.dead||sim.state==='READY'){if(current!=='FeignDeath'){mixer.stopAllAction();current='';play('FeignDeath');}const a=actions.get('FeignDeath');a.paused=true;a.time=0;mixer.update(0);}
    else if(sim.stroke>0){const name=sim.strokeSide>0?'TailBeat_A':'TailBeat_D';if(current!==name)api.stroke(sim.strokeSide>0?'A':'D');const a=actions.get(name);a.paused=true;a.time=(1-sim.stroke/.44)*a.getClip().duration;mixer.update(0);}
    else if(!sim.grounded)play('Airborne');else if(current!=='Landing'||!actions.get('Landing').isRunning())play('FeignDeath');
    skin.rotation.z=Math.PI/2+(sim.dead?0:sim.grounded?Math.sin(sim.time*18)*sim.stroke*.12:Math.sin(sim.time*13)*.17);
    skin.rotation.x=sim.dead?0:!sim.grounded?Math.sin(sim.time*11)*.10:0;
   }
   // Only presentation animation continues after death; gameplay physics stays frozen.
   if(sim.state==='GAMEOVER'||sim.state==='PLAYING'&&!sim.dead&&sim.stroke<=0)mixer.update(dt);
  }
 };
 return api;
}
