import * as THREE from 'three';
// Sample the deformed surface, not the root origin or an undeformed bounding box.
// Bounded work: at most 192 representative vertices per fish, no per-frame allocations.
export class FishContact {
 constructor(model){this.root=model.root;this.meshes=[];this.point=new THREE.Vector3();this.minY=0;
  const meshes=[];model.root.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position)meshes.push(o);});
  const budget=Math.max(12,Math.floor(192/Math.max(1,meshes.length)));
  for(const mesh of meshes){const count=mesh.geometry.attributes.position.count,indices=new Set();
   for(let i=0;i<Math.min(budget,count);i++)indices.add(Math.floor(i*count/Math.min(budget,count)));
   // Include axis extrema so sparse sampling does not miss fins/body contact.
   const attr=mesh.geometry.attributes.position,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],ends=Array(6).fill(0);
   for(let i=0;i<count;i++)for(let axis=0;axis<3;axis++){const value=attr.getComponent(i,axis);if(value<lo[axis]){lo[axis]=value;ends[axis*2]=i;}if(value>hi[axis]){hi[axis]=value;ends[axis*2+1]=i;}}
   ends.forEach(i=>indices.add(i));this.meshes.push({mesh,indices:[...indices]});
  }
 }
 correct(floor){this.root.updateMatrixWorld(true);let min=Infinity;
  for(const {mesh,indices} of this.meshes){mesh.skeleton?.update();for(const index of indices){mesh.getVertexPosition(index,this.point);this.point.applyMatrix4(mesh.matrixWorld);min=Math.min(min,this.point.y);}}
  if(!Number.isFinite(min))return;
  this.root.position.y+=floor-min;this.root.updateMatrixWorld(true);this.minY=floor;
 }
}
