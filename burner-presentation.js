import * as THREE from 'three';
import {flameOrigin,flameLength,GAS_BURNER_RULES} from './gas-burner.js';
export class BurnerPresentation{
 constructor(view){this.view=view;this.root=new THREE.Group();view.root.add(this.root);this.items=[];this.flames=[];const quality=view.modelSettings.quality,count=quality==='low'?3:quality==='high'?9:5;this.rays=count;
 const metal=new THREE.MeshStandardMaterial({color:0x67757b,roughness:.65}),can=new THREE.MeshStandardMaterial({color:0xd46526,roughness:.6}),blue=new THREE.MeshBasicMaterial({color:0x8bdfff,transparent:true,opacity:.8,depthWrite:false}),orange=new THREE.MeshBasicMaterial({color:0xff8b23,transparent:true,opacity:.42,depthWrite:false});
 for(const item of view.sim.burners){const group=new THREE.Group(),bottle=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.38,8),can),neck=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.16,6),metal),nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.27,6),metal);neck.position.y=.26;nozzle.rotation.z=Math.PI/2;nozzle.position.set(.1,.33,0);group.add(bottle,neck,nozzle);this.root.add(group);this.items.push(group);}
 const geometry=new THREE.CylinderGeometry(.20,.025,1,quality==='low'?4:8,1,true);geometry.rotateX(-Math.PI/2);
 for(let id=0;id<4;id++){const group=new THREE.Group(),rays=[];for(let i=0;i<count;i++){const ray=new THREE.Group(),flame=new THREE.Mesh(geometry,orange),core=new THREE.Mesh(geometry,blue);ray.add(flame,core);group.add(ray);rays.push({ray,flame,core,offset:((i+.5)/count*2-1)*GAS_BURNER_RULES.spread});}this.root.add(group);this.flames.push({group,rays});}
 this.label=document.createElement('div');this.label.style.cssText='position:absolute;left:24px;bottom:150px;color:#ffbc54;font-weight:bold;text-shadow:0 2px 3px #000;pointer-events:none';document.getElementById('battleHUD')?.append(this.label);
 }
 update(){const v=this.view,s=v.sim,t=s.time,playing=s.state==='PLAYING'&&(!v.online||v.connected!==false);let volume=0;
 for(let i=0;i<this.items.length;i++){const item=s.burners[i],m=this.items[i];m.visible=!!item?.active;if(item){m.position.set(item.p.x,item.p.y+.12+Math.sin(t*2+i)*.06,item.p.z);m.rotation.y=t*.7;}}
 for(const p of s.players){const f=this.flames[p.id];f.group.visible=playing&&!p.dead&&!p.spectator&&t<p.burnerUntil;if(!f.group.visible)continue;const origin=flameOrigin(p);f.group.position.set(origin.x,origin.y,origin.z);f.group.rotation.y=p.yaw;for(let i=0;i<f.rays.length;i++){const {ray,flame,core,offset}=f.rays[i],length=flameLength(s,p,offset);ray.rotation.y=offset;const flicker=.88+.12*Math.sin(t*31+i*2+p.id);flame.scale.set(length*Math.tan(GAS_BURNER_RULES.spread)/this.rays/.20*flicker,length*.85*flicker,length);flame.position.z=-length/2;core.scale.set(.42,.42,Math.min(.48,length));core.position.z=-Math.min(.48,length)/2;flame.rotation.z=Math.sin(t*19+i)*.07;}
 const listener=s.players[v.localId];volume=Math.max(volume,p.id===v.localId?.10:.07/(1+Math.hypot(p.p.x-listener.p.x,p.p.z-listener.p.z)/3));}
 const left=Math.max(0,(s.players[v.localId].burnerUntil||0)-t),text=playing&&left>0?`ガスバーナー 🔥 ${left.toFixed(1)}秒`:'';if(this.label.textContent!==text)this.label.textContent=text;v.audio.burner?.(volume);
 }
 dispose(){this.label.remove();this.view.audio.burner?.(0);this.root.removeFromParent();const geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
}
