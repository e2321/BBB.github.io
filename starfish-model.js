import * as THREE from 'three';
// Blender starfish is already flat in XZ. Only visual groups are normalized.
export function prepareStarfish(scene){
 scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=.455/Math.max(size.x,size.z);
 if(!Number.isFinite(scale)||scale<=0)throw Error('ヒトデの寸法が不正です');
 const template=new THREE.Group();for(const name of ['low','medium']){const level=new THREE.Group();level.name=name;const correction=new THREE.Group(),copy=scene.clone(true);copy.position.sub(center);correction.scale.setScalar(scale);correction.add(copy);level.add(correction);template.add(level);}return template;
}
