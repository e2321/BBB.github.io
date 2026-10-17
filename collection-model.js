import {prepareStarfish} from './starfish-model.js';
import {BATTLE} from './battle-rules.js';
import {FishContact} from './fish-contact.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ModelManager} from './model-manager.js';
import {assetURL} from './character-registry.js';
import {collection} from './gacha-store.js';
const disposeTemplate=root=>{const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());};
export const createModelLibrary=()=>new ModelManager({load:async url=>{const loader=new GLTFLoader();try{const scene=(await loader.loadAsync(url)).scene;return url.endsWith('/models/starfish.glb')?prepareStarfish(scene):scene;}catch(error){if(!url.endsWith('/models/starfish.glb'))throw error;console.warn('[BBB starfish] 旧モデルへ切り替えます:',error.message);return (await loader.loadAsync(assetURL('assets/characters/starfish.glb'))).scene;}},dispose:disposeTemplate});
export const models=createModelLibrary();
export const requestCollectionModel=(id,retry=false)=>models.request(id,{owned:collection.owns(id),retry});
export function createCollectionModel(parent,kind,quality='low',library=models){
 const template=library.retain(kind);if(!template)return null;const source=template.getObjectByName(quality==='low'?'low':'medium');if(!source){library.release(kind);return null;}
 const root=new THREE.Group(),skin=source.clone(true),materials=new Map(),arms=[];skin.position.y=-BATTLE.bodyY/(BATTLE.fishLength/.455)+.003;root.scale.setScalar(BATTLE.fishLength/.455);root.add(skin);parent.add(root);skin.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.userData.sharedPool=true;o.castShadow=quality!=='low';o.receiveShadow=false;materials.set(o.material,{color:o.material.color.clone(),base:o.material.color.clone()});}if(/^arm\d+$/.test(o.name))arms.push({node:o,base:o.rotation.y});});const contact=new FishContact({root});let last=-1,strength=1;
 const api={root,skin,kind,quality,previewElevation:kind==='starfish'?1.6:.45,accent(value){const tint=new THREE.Color(value);for(const [m,b]of materials){b.color.copy(b.base).lerp(tint,.22);m.color.copy(b.color);}},moisture(){for(const [m,b]of materials)m.color.copy(b.color);},strength(v){strength=v;},flash(hit){for(const m of materials.keys())m.emissive.setScalar(hit?.6:0);},rainbow(amount,time,hit){if(!hit)for(const m of materials.keys())m.emissive.setHSL(time*.12%1,.8,.09*amount);},headPosition(target){root.getWorldPosition(target);target.y+=.12;},stroke(){},play(){},reset(){root.visible=true;last=-1;},
 update(pose){root.position.set(pose.p.x,pose.p.y,pose.p.z);root.rotation.set(0,pose.yaw,0);const now=pose.time||0;if(last>=0&&now-last<1/(quality==='low'?20:40)){if(pose.grounded)contact.correct(pose.p.y-BATTLE.bodyY+.008);return;}last=now;const age=Math.max(0,now-(pose.actionStart??-10)),duration=.44/(pose.actionSpeed||1),envelope=age<duration?Math.sin(age/duration*Math.PI):0,side=pose.strokeSide||1;skin.rotation.z=pose.dead?.2:envelope*.25*side;skin.scale.set(1,1-envelope*.12*strength,1);for(let i=0;i<arms.length;i++){const a=arms[i];a.node.rotation.x=Math.max(-.08,Math.sin(age*15-i*.55)*envelope*.22);a.node.rotation.y=a.base+Math.sin(age*12-i*.7)*envelope*.12;}if(pose.grounded)contact.correct(pose.p.y-BATTLE.bodyY+.008);}
 ,dispose(){root.removeFromParent();for(const m of materials.keys())m.dispose();library.release(kind);}};return api;
}
