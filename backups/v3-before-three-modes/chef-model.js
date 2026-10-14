import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
export async function loadChefFactory(){
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/models/chef.glb`);
 const names=gltf.animations.map(c=>c.name);for(const n of ['Idle','Walk','Windup','Throw','Inspect','Stunned','Capture','IntroChop'])if(!names.includes(n))throw new Error(`料理人GLBに ${n} がありません`);
 return {animations:names,create(parent){
  const root=new THREE.Group(),model=clone(gltf.scene);parent.add(root);root.add(model);const materials=[];const knives=[];
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.material=o.material.clone();materials.push(o.material);if(o.material.name.startsWith('Knife'))knives.push(o);}});
  const mixer=new THREE.AnimationMixer(model),actions=new Map(gltf.animations.map(a=>[a.name,mixer.clipAction(a)]));let current='';
  const api={root,model,animations:names,setOpacity(opacity){for(const m of materials){if(m.transparent!==(opacity<1)){m.transparent=opacity<1;m.depthWrite=opacity===1;m.needsUpdate=true;}m.opacity=opacity;}},
   update(sim,c,dt,{intro=false,captured=false}={}){
    root.position.set(c.x,c.y,c.z);root.rotation.y=c.heading||0;
    if(c.speed<.05||['ATTACKING','INSPECTING','APPROACHING','SUSPICIOUS'].includes(c.state)||captured||intro)root.rotation.y=Math.atan2(-(sim.p.x-c.x),-(sim.p.z-c.z));
    let name=captured?'Capture':intro?(sim.time<1.8?'IntroChop':'Idle'):c.state==='STUNNED'?'Stunned':c.state==='ATTACKING'?'Windup':c.state==='INSPECTING'?'Inspect':sim.time-c.lastThrow<.4?'Throw':c.speed>.05?'Walk':'Idle';
    if(current!==name){const prev=actions.get(current),next=actions.get(name);next.reset().setEffectiveWeight(1).play();if(prev){prev.fadeOut(.08);next.fadeIn(.08);}current=name;}
    const action=actions.get(current);if(['Windup','Inspect','IntroChop'].includes(name)){action.paused=true;action.time=name==='Windup'?Math.min(c.timer,.59):name==='Inspect'?Math.min(c.timer,1.73):Math.min(sim.time,1.76);mixer.update(0);}else{action.paused=false;if(sim.state==='PLAYING'||captured)mixer.update(dt);else mixer.update(0);}
    for(const k of knives)k.visible=intro||['WAITING','CHASING','ATTACKING'].includes(c.state)&&!captured;
   },dispose(){root.removeFromParent();mixer.stopAllAction();materials.forEach(m=>m.dispose());}
  };return api;
 }};
}
