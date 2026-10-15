import * as THREE from 'three';
import {FishContact} from './fish-contact.js';
import {BATTLE} from './battle-rules.js';

// Applied only to TutorialMode.models[0]. All buffers are private copies;
// original GLB skeleton, clips and the BBB factory remain untouched.
export function improveTutorialFish(model){
 const geometries=[],materials=[];
 const back=new THREE.Color('#173f55'),silver=new THREE.Color('#a6b9bc'),belly=new THREE.Color('#e0e4d8'),c=new THREE.Color();
 model.root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.geometry=mesh.geometry.clone();geometries.push(mesh.geometry);
  const g=mesh.geometry,p=g.attributes.position,mat=mesh.material,name=mat.name;
  const fin=/fin/i.test(name),eye=/eye|iris|pupil/i.test(name),skin=/skin/i.test(name);
  const colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
   let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   // GLB coordinates: X thickness, Y back/belly, -Z head. Preserve
   // longitudinal bone positions and apply the same envelope to attached parts.
   const mid=Math.exp(-Math.pow((z+.015)/.12,2));
   x*=1-.14*mid;y*=1-.29*mid;
   // Keep fin roots on the body: the shared envelope also transforms rays.
   if(eye){y=.029+(y-.029)*1.12;z=-.1586+(z+.1586)*1.12;x+=Math.sign(x)*.001;}
   p.setXYZ(i,x,y,z);
   if(skin){const h=THREE.MathUtils.smoothstep(y,-.03,.04);c.copy(belly).lerp(silver,THREE.MathUtils.smoothstep(h,0,.55));c.lerp(back,THREE.MathUtils.smoothstep(h,.52,1));
    // Subtle mackerel markings and scales, baked once into vertex colors.
    const stripe=Math.sin(z*280+Math.sin(y*170)*1.1);c.multiplyScalar(1-(h>.65?.07*(stripe*.5+.5):0));
    c.toArray(colors,i*3);
   }
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  mat.metalness=0;mat.roughness=eye?.25:.57;if('clearcoat' in mat){mat.clearcoat=eye?.25:.12;mat.clearcoatRoughness=.52;}
  if(skin){g.setAttribute('color',new THREE.BufferAttribute(colors,3));mat.vertexColors=true;mat.map=null;mat.normalScale?.setScalar(.18);mat.roughnessMap=null;}
  if(fin){mat.color.set('#63858b');mat.transparent=true;mat.opacity=/rays/i.test(name)?.78:.72;mat.depthWrite=false;mat.side=THREE.DoubleSide;}
  else if(/iris/i.test(name))mat.color.set('#687c66');
  else if(/lips/i.test(name))mat.color.set('#8caaa9');
  else if(/crease/i.test(name))mat.color.set('#304e56');
  materials.push({mat,color:mat.color.clone(),roughness:mat.roughness,clearcoat:mat.clearcoat||0});mat.needsUpdate=true;
 });
 const contact=new FishContact(model),update=model.update.bind(model),dispose=model.dispose.bind(model),reset=model.reset.bind(model);
 function appearance(water=100){const dry=1-THREE.MathUtils.clamp(water/100,0,1);for(const {mat,color,roughness,clearcoat} of materials){mat.color.copy(color);mat.roughness=Math.min(1,roughness+dry*.2);mat.clearcoat=clearcoat*(1-dry*.5);}}
 model.moisture=appearance;
 model.reset=()=>{reset();appearance();};
 model.update=(sim,dt,deathElapsed)=>{update(sim,dt,deathElapsed);if(sim.grounded&&!sim.dead)contact.correct(sim.p.y-BATTLE.bodyY+.008);};
 model.dispose=()=>{dispose();geometries.forEach(g=>g.dispose());};
 model.tutorialQuality=true;
 return model;
}
