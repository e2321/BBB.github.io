import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadFish(scene,onProgress=()=>{}) {
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/models/madai.glb`,e=>{if(e.total)onProgress(e.loaded/e.total);});
 const root=new THREE.Group(),skin=new THREE.Group();scene.add(root);root.add(skin);skin.add(gltf.scene);skin.rotation.z=Math.PI/2;skin.position.y=-.020;
 const materials=[];let vertices=0,skinnedMeshes=0;
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;vertices+=o.geometry.attributes.position.count;const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){if(!materials.some(a=>a.mat===m)){materials.push({mat:m,color:m.color.clone(),roughness:m.roughness,clearcoat:m.clearcoat||0});for(const key of ['map','normalMap','roughnessMap'])if(m[key])m[key].anisotropy=8;}}}if(o.isSkinnedMesh)skinnedMeshes++;});
 if(!skinnedMeshes)throw new Error('魚GLBにスキンメッシュがありません');
 const mixer=new THREE.AnimationMixer(gltf.scene),actions=new Map();
 for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
 for(const name of ['TailBeat_A','TailBeat_D','Airborne','FeignDeath','Landing','Captured','Dry'])if(!actions.has(name))throw new Error(`魚GLBに ${name} アニメーションがありません`);
 let current='',dryLevel=0;
 function play(name,once=false){if(current===name&&!once)return;const action=actions.get(name);if(!action)return;const previous=actions.get(current);action.reset();action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.enabled=true;action.setEffectiveWeight(1);action.play();if(previous&&previous!==action){previous.fadeOut(.06);action.fadeIn(.06);}current=name;}
 play('FeignDeath');
 const api={root,skin,animations:[...actions.keys()],vertices,skinnedMeshes,play,
  reset(){mixer.stopAllAction();current='';dryLevel=0;root.visible=true;skin.scale.set(1,1,1);for(const {mat,color,roughness,clearcoat} of materials){mat.color.copy(color);mat.roughness=roughness;mat.clearcoat=clearcoat;}play('FeignDeath');},
  update(sim,dt,deathElapsed=0){root.position.set(sim.p.x,sim.p.y,sim.p.z);root.rotation.set(0,sim.yaw,0);
   if(sim.state==='GAMEOVER'){
    if(sim.deathCause==='CAPTURE'){play('Captured');const forward=new THREE.Vector3(-Math.sin(sim.chefFacing??0),0,-Math.cos(sim.chefFacing??0));root.position.set(sim.chef.x,sim.chef.y+1.12,sim.chef.z).addScaledVector(forward,.38);root.rotation.y=sim.chefFacing??sim.yaw;skin.rotation.z=Math.PI/2+.15*Math.sin(deathElapsed*7)*Math.exp(-deathElapsed);}
    else if(sim.deathCause==='DRY'){play('Dry');dryLevel=Math.min(1,deathElapsed/1.8);for(const {mat,color} of materials){mat.color.copy(color).lerp(new THREE.Color('#866542'),dryLevel*.9);mat.roughness=.25+dryLevel*.6;mat.clearcoat=1-dryLevel;}skin.rotation.z=Math.PI/2;skin.scale.set(1,1-.12*dryLevel,1);}
    else if(sim.deathCause==='KNIFE')root.visible=false;
   }else{
    root.visible=true;skin.scale.set(1,1,1);if(sim.stroke>0){const name=sim.strokeSide>0?'TailBeat_A':'TailBeat_D';if(current!==name)play(name,true);}
    else if(!sim.grounded)play('Airborne');else if(sim.dead||sim.state==='READY')play('FeignDeath');else if(current!=='Landing')play('FeignDeath');
    skin.rotation.z=Math.PI/2+(sim.dead?0:sim.grounded?0:Math.sin(sim.time*11)*.12);
   }
   // Only presentation animation continues after death; gameplay physics stays frozen.
   if(sim.state==='PLAYING'||sim.state==='GAMEOVER')mixer.update(dt);
  }
 };
 return api;
}
