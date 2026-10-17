import {BATTLE} from './battle-rules.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createKnife} from './visuals.js';
import {weaponFor,visibleWeapon} from './weapon-registry.js';
const cache=new Map();
export function createWeaponModel(id){if(id==='knife')return createKnife();const w=weaponFor(id);if(w.id==='knife')return createKnife();if(!cache.has(id)){const parts=[],metal=new THREE.MeshStandardMaterial({color:'#bed0d5',metalness:.75,roughness:.3}),handle=new THREE.MeshStandardMaterial({color:'#314b57',roughness:.65}),group=new THREE.Group();const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m;};const box=(x,y,z,px,py,pz,mat=metal)=>add(new THREE.BoxGeometry(x,y,z),mat,px,py,pz);
 box(.028,.022,.24,0,0,.10,handle);box(.024,.014,.10,0,0,-.06);
 if(id==='fork'){box(.065,.012,.055,0,0,-.125);for(let i=0;i<4;i++)box(.012,.012,.095,(i-1.5)*.017,0,-.195);}
 if(id==='ladle'){const bowl=add(new THREE.SphereGeometry(.06,16,8,0,Math.PI*2,0,Math.PI/2),metal,0,-.025,-.16);bowl.rotation.x=Math.PI;box(.03,.03,.08,0,-.0125,-.105);const rim=add(new THREE.TorusGeometry(.06,.004,5,18),metal,0,-.025,-.16);rim.rotation.x=Math.PI/2;}
 if(id==='spatula'){box(.15,.013,.14,0,0,-.16);for(let i=-1;i<=1;i++)box(.012,.014,.085,i*.036,.001,-.165,handle);}
 group.updateMatrixWorld(true);for(const m of group.children){const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrixWorld),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3)m.material.color.toArray(colors,i);g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g);m.geometry.dispose();}const mesh=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({vertexColors:true,metalness:.68,roughness:.34,side:THREE.DoubleSide}));mesh.userData.sharedPool=true;cache.set(id,mesh);parts.forEach(g=>g.dispose());metal.dispose();handle.dispose();}
 const root=new THREE.Group();root.add(cache.get(id).clone());return root;}
export function updateWeaponPose(root,projectile,id){const w=weaponFor(id),time=projectile.angle/15;root.rotation.set(w.initialRotation[0]+w.rotationSpeed[0]*time,w.initialRotation[1]+Math.atan2(-projectile.v.x,-projectile.v.z)+w.rotationSpeed[1]*time,w.initialRotation[2]+w.rotationSpeed[2]*time);}
export {visibleWeapon};

export function updateWeaponDebug(view){if(!view.testSession)return;if(view.weaponDebugEnabled&&!view.weaponDebugMesh){view.weaponDebugMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(BATTLE.knifeRadius,8,4),new THREE.MeshBasicMaterial({color:'#f9a1ff',wireframe:true,depthTest:false}),64);view.weaponDebugMesh.frustumCulled=false;view.root.add(view.weaponDebugMesh);view.weaponDebugDummy=new THREE.Object3D();}const mesh=view.weaponDebugMesh;if(!mesh)return;mesh.visible=!!view.weaponDebugEnabled;if(!mesh.visible)return;const d=view.weaponDebugDummy;for(let i=0;i<64;i++){const k=view.sim.projectiles[i];d.position.set(k.p.x,k.p.y,k.p.z);d.scale.setScalar(k.active?weaponFor(k.weapon).hitboxScale:0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);}mesh.instanceMatrix.needsUpdate=true;}
