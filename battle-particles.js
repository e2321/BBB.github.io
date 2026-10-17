import * as THREE from 'three';
// BBB-only bounded pools. No changes to the prologue's existing Effects class.
export class BattleParticles{
 constructor(root,waterEnabled=true,capacity=160){
  this.waterEnabled=waterEnabled;this.root=root;this.capacity=waterEnabled?capacity:0;this.cursor=0;this.ringCursor=0;this.quality=1;this.frameAverage=1/60;this.color=new THREE.Color();this.dummy=new THREE.Object3D();
  this.drops=Array.from({length:this.capacity},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),life:0,size:1,rainbow:false,hue:0}));
  this.mesh=null;if(waterEnabled){this.mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.023,5,3),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.2,metalness:.18,transparent:true,opacity:.82,depthWrite:false}),this.capacity);this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.frustumCulled=false;root.add(this.mesh);}
  const geometry=waterEnabled?new THREE.RingGeometry(.9,1,24):null;this.rings=waterEnabled?Array.from({length:Math.min(16,Math.max(4,Math.floor(capacity/10)))},()=>{const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#9ce4ff',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.visible=false;root.add(mesh);return {mesh,life:0,maxLife:.5,radius:1};}):[];
  this.update(0);
 }
 load(dt){if(dt>0){this.frameAverage+=.03*(Math.min(.15,dt)-this.frameAverage);this.quality=this.frameAverage>1/28?.4:this.frameAverage>1/42?.7:1;}}
 burst(p,{kind='land',direction={x:0,z:-1},water=100,combo=0,time=0,floor=0,style='water'}={}){
  if(!this.waterEnabled)return;const base=style==='normal'?5:kind==='water'?28:kind==='exit'?14:kind==='jump'?6:12,count=Math.max(2,Math.round((base+(combo>=10?4:0))*this.quality*(this.detailScale||1)*(.3+.7*water/100)));
  const heading=Math.atan2(direction.z||0,direction.x||0),bias=Math.min(1,Math.hypot(direction.x||0,direction.z||0)/5);
  for(let i=0;i<count;i++){const d=this.drops[this.cursor++%this.capacity],angle=Math.random()*Math.PI*2,speed=.7+Math.random()*1.8;d.p.set(p.x+(Math.random()-.5)*.5,floor+.09,p.z+(Math.random()-.5)*.5);d.v.set(Math.cos(angle)*speed+Math.cos(heading)*bias,.7+Math.random()*(kind==='water'?1.8:1.1),Math.sin(angle)*speed+Math.sin(heading)*bias);d.life=.35+Math.random()*.25;d.size=.45+Math.random()*1.1;d.style=style;d.rainbow=(combo>=50&&style!=='ink')||style==='rainbow';if(style==='bubble'){d.v.y*=.45;d.v.x*=.5;d.v.z*=.5;d.size*=1.3;}if(style==='sparkle'){d.size*=.65;d.life*=.8;}d.hue=i/count;d.gloss=combo>=25;}
  const ring=this.rings[this.ringCursor++%this.rings.length];ring.life=ring.maxLife=kind==='water'?.65:.45;ring.radius=kind==='water'?1.2:kind==='jump'?.45:.75;ring.mesh.position.set(p.x,floor+.026,p.z);ring.mesh.material.color.set(style==='ink'?'#63416f':combo>=50?'#f6b8ff':'#9ce4ff');ring.mesh.visible=true;this.update(0,time);
 }
 update(dt,time=0){let alive=0;for(let i=0;i<this.drops.length;i++){const d=this.drops[i];if(d.life>0){d.life=Math.max(0,d.life-dt);d.v.y+=(d.style==='bubble'?.45:-6)*dt;d.p.addScaledVector(d.v,dt);}this.dummy.position.copy(d.p);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(d.life>0?d.size:0,d.life>0?d.size*(d.style==='bubble'?1:1.4):0,d.life>0?d.size:0);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);if(d.rainbow)this.color.setHSL((time*.12+d.hue)%1,.75,.7);else this.color.set(d.style==='ink'?'#392451':d.style==='sparkle'?'#ffe6a1':d.style==='bubble'?'#c5f9f1':d.gloss?'#e7faff':'#9cdcf7');this.mesh.setColorAt(i,this.color);if(d.life>0)alive++;}if(this.mesh){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;this.mesh.visible=alive>0;}
  for(const r of this.rings){r.life=Math.max(0,r.life-dt);r.mesh.visible=r.life>0;r.mesh.scale.setScalar(r.radius*(.2+.8*(1-r.life/r.maxLife)));r.mesh.material.opacity=.28*r.life/r.maxLife;}
 }
 reset(){for(const d of this.drops)d.life=0;for(const r of this.rings)r.life=0;this.update(0);}
}
