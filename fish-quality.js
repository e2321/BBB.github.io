import {compactSkinnedGeometry} from './model-optimization.js';
import {MODEL_QUALITY,qualityId} from './seafood-settings.js';
const reduced=new WeakMap();
// Same GLB design/rig; low quality welds nearby vertices while preserving UV,
// material and bone boundaries. Medium/high retain the original surface.
export function prepareFishQuality(scene,quality){quality=qualityId(quality);scene.traverse(m=>{if(!m.isMesh)return;m.userData.sharedPool=true;if(quality==='low'){let g=reduced.get(m.geometry);if(!g){g=compactSkinnedGeometry(m.geometry,.004);reduced.set(m.geometry,g);}m.geometry=g;}});}
export function finishFishQuality(model,quality){quality=qualityId(quality);const q=MODEL_QUALITY[quality];model.quality=quality;model.kind='fish';model.root.traverse(m=>{if(!m.isMesh)return;m.castShadow=q.shadows;m.receiveShadow=q.shadows;for(const mat of Array.isArray(m.material)?m.material:[m.material]){if(quality==='low'){mat.normalMap=null;mat.roughnessMap=null;if('clearcoat' in mat)mat.clearcoat=0;}}});
 if(quality==='low'){const moisture=model.moisture.bind(model);model.moisture=value=>{moisture(value);model.root.traverse(m=>{if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])if('clearcoat' in mat)mat.clearcoat=0;});};}
 const update=model.update.bind(model);let elapsed=0;model.update=(sim,dt=0,deathElapsed=0)=>{elapsed+=dt;if(elapsed>=1/q.animationHz||dt===0){update(sim,elapsed,deathElapsed);elapsed=0;}else{model.root.position.set(sim.p.x,sim.p.y,sim.p.z);model.root.rotation.y=sim.yaw+Math.PI/2;}};return model;}
