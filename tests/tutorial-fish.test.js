import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {improveTutorialFish} from '../tutorial-fish.js';

test('real tutorial GLB preserves source geometry, bones and animation; private resources disposed',async()=>{
 globalThis.ProgressEvent??=class{constructor(type,options){Object.assign(this,options);}};
 const b=fs.readFileSync(new URL('../public/assets/models/madai.glb',import.meta.url));const n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n));
 const bin=b.subarray(28+n,28+n+b.readUInt32LE(20+n));j.buffers=[{byteLength:bin.length,uri:'data:application/octet-stream;base64,'+bin.toString('base64')}];
 // Image decoding requires a browser; test the actual geometry/rig in Node.
 j.images=[];j.textures=[];j.materials=j.materials.map(m=>({name:m.name,pbrMetallicRoughness:{roughnessFactor:.29,metallicFactor:.04}}));
 const gltf=await new GLTFLoader().parseAsync(JSON.stringify(j),'');const original=[];gltf.scene.traverse(m=>{if(m.isMesh)original.push({g:m.geometry,p:m.geometry.attributes.position.array.slice(),mat:m.material});});
 const root=clone(gltf.scene);root.traverse(m=>{if(m.isMesh)m.material=m.material.clone();});const model={root,update(){},reset(){},dispose(){}};improveTutorialFish(model);
 let i=0;root.traverse(m=>{if(!m.isMesh)return;const src=original[i++];assert.notEqual(m.geometry,src.g);assert.notEqual(m.material,src.mat);assert.deepEqual(src.g.attributes.position.array,src.p);assert.equal(m.geometry.attributes.position.count,src.g.attributes.position.count);assert.ok(m.geometry.attributes.position.array.every(Number.isFinite));assert.deepEqual(m.geometry.attributes.skinWeight.array,src.g.attributes.skinWeight.array);if(/skin/i.test(m.material.name)){assert.ok(m.material.vertexColors);assert.ok(m.material.roughness>.5);assert.equal(m.material.metalness,0);}});
 const mixer=new THREE.AnimationMixer(root);for(const name of ['TailBeat_A','TailBeat_D','Airborne','Landing']){mixer.stopAllAction();const clip=gltf.animations.find(a=>a.name===name);assert.ok(clip);mixer.clipAction(clip).play();mixer.update(.12);model.update({grounded:true,dead:false,p:{y:.28}},0);assert.ok(Number.isFinite(root.position.y));}
 model.moisture(0);model.reset();let disposed=0;root.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposed++);});model.dispose();assert.equal(disposed,original.length);
});
