import {BattleMode} from '../battle-view.js';
import {ItemPreview} from '../item-preview.js';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {SquidAsset,createGLBSquid,squidAsset} from '../squid-glb.js';import {createSeafoodModel} from '../seafood-model.js';import {fitPreviewCamera} from '../seafood-menu.js';import {BATTLE} from '../battle-rules.js';
// Decode the shipped GLB hierarchy/geometry with the real loader. Texture decode
// is stubbed only in Node: real browser/GPU appearance is a separate manual check.
const oldBitmap=globalThis.createImageBitmap,oldSelf=globalThis.self;globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:64,height:64,close(){}});
const bytes=await readFile(new URL('../public/assets/models/squid.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
if(oldBitmap)globalThis.createImageBitmap=oldBitmap;else delete globalThis.createImageBitmap;if(oldSelf)globalThis.self=oldSelf;else delete globalThis.self;
const loadAsset=async()=>{const asset=new SquidAsset(async()=>gltf);await asset.request();return asset;};
const meshList=model=>{const meshes=[];model.root.traverse(o=>{if(o.isMesh)meshes.push(o);});return meshes;};
const pose=(time,extra={})=>({p:{x:2,y:BATTLE.bodyY,z:-3},time,yaw:.4,actionKey:'A',actionStart:0,actionDuration:.5,strokeSide:1,grounded:false,dead:false,...extra});
test('one shared GLB request, cached readiness and failures do not retry forever',async()=>{
 let loads=0;const asset=new SquidAsset(async url=>{loads++;assert.ok(url.endsWith('/assets/models/squid.glb'));return gltf;});const a=asset.request(),b=asset.request();assert.equal(a,b);await a;await asset.request();assert.equal(loads,1);assert.equal(asset.state,'ready');
 const warn=console.warn;console.warn=()=>{};try{let attempts=0;const failed=new SquidAsset(async()=>{attempts++;throw Error('404');});assert.equal(await failed.request(),null);await failed.request();assert.equal(attempts,1);await failed.request({retry:true});assert.equal(attempts,2);assert.equal(failed.state,'failed');}finally{console.warn=warn;}
});
test('actual Blender hierarchy preserves 8 arms, 2 tentacles and body-based scale across quality levels',async()=>{
 const asset=await loadAsset(),body=gltf.scene.getObjectByName('Body');assert.ok(body);assert.equal(gltf.animations.length,0);let previous=0;
 for(const quality of ['low','medium','high']){const parent=new THREE.Group(),m=createGLBSquid(parent,quality,asset),stats=m.poseStats(),t=asset.template(quality);assert.equal(stats.arms,8);assert.equal(stats.tentacles,2);assert.ok(stats.bones>previous);previous=stats.bones;assert.equal(m.source,'glb');assert.equal(m.kind,'squid');assert.ok(Math.abs((t.bodyBounds.max.z-t.bodyBounds.min.z)*t.scale-.255)<1e-9);assert.ok(t.parts.some(p=>p.material.map),'embedded body texture retained');assert.equal(parent.children.length,1);m.dispose();assert.equal(parent.children.length,0);}
});
test('instances share immutable geometry/textures but own materials, skeletons, tints and disposal',async()=>{
 const asset=await loadAsset(),a=createGLBSquid(new THREE.Group(),'medium',asset),b=createGLBSquid(new THREE.Group(),'medium',asset),ma=meshList(a),mb=meshList(b);let disposed=0;ma[0].geometry.addEventListener('dispose',()=>disposed++);
 assert.equal(ma[0].geometry,mb[0].geometry);assert.notEqual(ma[0].material,mb[0].material);assert.notEqual(ma[0].skeleton,mb[0].skeleton);const before=mb[0].material.color.clone();a.accent('#ff0000');a.flash(true);assert.ok(mb[0].material.color.equals(before));a.dispose();a.dispose();assert.equal(disposed,0);b.update(pose(.2));assert.ok(Number.isFinite(b.poseStats().bend));b.dispose();
});
test('shipped squid bends, lands on the floor and remains finite without changing authoritative poses',async()=>{
 const asset=await loadAsset(),point=new THREE.Vector3();for(const quality of ['low','medium','high']){const m=createGLBSquid(new THREE.Group(),quality,asset);m.root.scale.setScalar(BATTLE.fishLength/.455);const meshes=meshList(m),geometries=meshes.map(o=>o.geometry),base=geometries.map(g=>g.attributes.position.array.slice());let peak=0;
 for(let i=0;i<=60;i++){const t=i/100,p=pose(t,{grounded:t>=.5}),copy=JSON.stringify(p);m.update(p);m.root.updateMatrixWorld(true);peak=Math.max(peak,Math.abs(m.poseStats().bend));assert.equal(JSON.stringify(p),copy);let min=Infinity;for(const mesh of meshes){mesh.skeleton?.update();for(let j=0;j<mesh.geometry.attributes.position.count;j+=3){mesh.getVertexPosition(j,point);point.applyMatrix4(mesh.matrixWorld);assert.ok(Number.isFinite(point.lengthSq()));min=Math.min(min,point.y);}}if(p.grounded)assert.ok(min>-.02,'no deep floor penetration');}
 assert.ok(peak>.7);meshes.forEach((o,i)=>{assert.equal(o.geometry,geometries[i]);assert.deepEqual(o.geometry.attributes.position.array,base[i]);});m.reset();m.dispose();}
});
test('new squid fits portrait and wide preview cameras including both long tentacles',async()=>{
 const asset=await loadAsset(),m=createGLBSquid(new THREE.Group(),'low',asset);m.update(pose(0,{p:{x:0,y:0,z:0},yaw:0,dead:true}));const box=new THREE.Box3().setFromObject(m.root);for(const aspect of [.4,1,2.4]){const camera=new THREE.PerspectiveCamera(38,aspect);fitPreviewCamera(camera,box,new THREE.Vector3(.7,.45,1));for(let i=0;i<8;i++){const p=new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);}}m.dispose();
});
test('central seafood factory keeps the old squid as fallback, then uses the same ID for ready GLB',async()=>{
 const before=createSeafoodModel(new THREE.Group(),'squid','low');assert.equal(before.source,'procedural');before.dispose();const original=squidAsset.load;squidAsset.load=async()=>gltf;try{await squidAsset.request();const m=createSeafoodModel(new THREE.Group(),'squid','low');assert.equal(m.source,'glb');assert.equal(m.kind,'squid');m.dispose();}finally{squidAsset.load=original;}
});


test('solo and online model refresh preserve display scale and identity when GLB becomes ready',()=>{
 for(const online of [false,true]){
  let disposed=0;const parent=new THREE.Group(),old={kind:'squid',source:'procedural',quality:'low',root:new THREE.Group(),dispose(){disposed++;}},p={id:0,character:'squid',color:'#388cff'};old.root.scale.setScalar(BATTLE.fishLength/.455);
  const context={online,sim:{stage:{id:'kitchen'},players:[p]},models:[old],modelSettings:{quality:'low'},modelLibrary:{display:()=> 'squid'},inventory:{owns:()=>true},createCharacterModel:()=>createSeafoodModel(parent,'squid','low')};
  BattleMode.prototype.syncCharacterModels.call(context);assert.equal(context.models[0].source,'glb');assert.equal(context.models[0].kind,'squid');assert.equal(context.models[0].root.scale.x,BATTLE.fishLength/.455);assert.equal(disposed,1);BattleMode.prototype.syncCharacterModels.call(context);assert.equal(disposed,1);context.models[0].dispose();
 }
});
test('equipment preview uses the new squid and releases instances on repeated selection',()=>{
 const renderer={domElement:{width:256,height:256},getRenderTarget:()=>null,getClearAlpha:()=>1,getClearColor:c=>c.set('#000'),setRenderTarget(){},setClearColor(){},clear(){},render(){}};
 const canvas={isConnected:true,closest:()=>null,getContext:()=>({clearRect(){},drawImage(){}})},preview=new ItemPreview({},()=>renderer);
 for(let i=0;i<3;i++){preview.select(canvas,{type:'character',id:'squid',name:'イカ'});assert.equal(preview.model.source,'glb');assert.equal(preview.scene.children.filter(x=>x===preview.model.root).length,1);preview.update(1000+i*100);preview.clear();assert.equal(preview.model,null);assert.equal(preview.scene,null);}
});
