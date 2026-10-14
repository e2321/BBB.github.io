import * as THREE from 'three';
// Collapse nearby vertices inside each material primitive. Keep skin/UV seams,
// joint weights and hard normals; never simplify the player's existing fish.
export function compactSkinnedGeometry(source,cell=.014){
 const index=source.index?.array;if(!index)return source;
 const attrs=source.attributes,p=attrs.position,n=attrs.normal,joints=attrs.skinIndex,weights=attrs.skinWeight,uv=attrs.uv;
 const mapping=new Map(),buckets=new Map(),representatives=[],sums=[],remapped=[];
 for(const vertex of index){if(mapping.has(vertex))continue;const key=[Math.round(p.getX(vertex)/cell),Math.round(p.getY(vertex)/cell),Math.round(p.getZ(vertex)/cell)];
  if(n)key.push(Math.round(n.getX(vertex)*3),Math.round(n.getY(vertex)*3),Math.round(n.getZ(vertex)*3));
  if(joints)for(let k=0;k<4;k++)key.push(joints.array[vertex*4+k],Math.round(weights.array[vertex*4+k]*5));
  if(uv)key.push(Math.floor(uv.getX(vertex)*16),Math.floor(uv.getY(vertex)*16));
  const hash=key.join(':');let target=buckets.get(hash);if(target===undefined){target=representatives.length;buckets.set(hash,target);representatives.push(vertex);sums.push([0,0,0,0]);}mapping.set(vertex,target);const sum=sums[target];sum[0]+=p.getX(vertex);sum[1]+=p.getY(vertex);sum[2]+=p.getZ(vertex);sum[3]++;
 }
 for(let i=0;i<index.length;i+=3){const a=mapping.get(index[i]),b=mapping.get(index[i+1]),c=mapping.get(index[i+2]);if(a!==b&&b!==c&&a!==c)remapped.push(a,b,c);}
 const geometry=new THREE.BufferGeometry();for(const [name,attr] of Object.entries(attrs)){const array=new attr.array.constructor(representatives.length*attr.itemSize);for(let i=0;i<representatives.length;i++)for(let k=0;k<attr.itemSize;k++)array[i*attr.itemSize+k]=name==='position'?sums[i][k]/sums[i][3]:attr.array[representatives[i]*attr.itemSize+k];geometry.setAttribute(name,new THREE.BufferAttribute(array,attr.itemSize,attr.normalized));}
 geometry.setIndex(remapped);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
