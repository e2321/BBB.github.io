import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const physical=(color,roughness=.5,metalness=0)=>new THREE.MeshPhysicalMaterial({color,roughness,metalness});
export function mesh(geo,mat,parent,pos=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export const cube=(parent,size,pos,mat,round=0)=>mesh(round?new RoundedBoxGeometry(...size,3,round):new THREE.BoxGeometry(...size),mat,parent,pos);
export const sphere=(parent,size,pos,mat)=>{const m=mesh(new THREE.SphereGeometry(1,24,16),mat,parent,pos);m.scale.set(...size);return m;};
export function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const c=canvas.getContext('2d');c.scale(4,4);let seed=31;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(kind==='wood'){c.fillStyle='#be9361';c.fillRect(0,0,512,512);for(let i=0;i<1100;i++){const y=rand()*512;c.strokeStyle=`rgba(${rand()>.5?'71,39,15':'246,212,150'},${rand()*.24})`;c.lineWidth=rand()*2;c.beginPath();for(let x=0;x<=512;x+=16){const yy=y+Math.sin(x*.018+y)*3;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}for(let i=0;i<70;i++){c.strokeStyle='#42332718';c.beginPath();const x=rand()*512,y=rand()*512;c.moveTo(x,y);c.lineTo(x+rand()*100-50,y+rand()*100-50);c.stroke();}}
 else if(kind==='steel'){c.fillStyle='#9fa9ac';c.fillRect(0,0,512,512);for(let i=0;i<8000;i++){c.strokeStyle=`rgba(${rand()>.5?'255,255,255':'40,50,55'},${rand()*.09})`;c.lineWidth=.15+rand()*.20;c.beginPath();const y=rand()*512,x=rand()*512;c.moveTo(x,y);c.lineTo(x+8+rand()*90,y+rand()*.3);c.stroke();}for(let i=0;i<40;i++){c.strokeStyle='#47555715';c.beginPath();const x=rand()*512,y=rand()*512;c.moveTo(x,y);c.lineTo(x+rand()*80,y+rand()*35);c.stroke();}}
 else {const grad=c.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#293b42');grad.addColorStop(.26,'#667e85');grad.addColorStop(.5,'#c8d6d6');grad.addColorStop(.72,'#e5e7da');grad.addColorStop(1,'#516973');c.fillStyle=grad;c.fillRect(0,0,512,512);for(let y=0;y<512;y+=16)for(let x=-16;x<512;x+=19){const xx=x+(Math.floor(y/16)%2)*9;c.strokeStyle=`rgba(29,55,65,${.11+rand()*.18})`;c.lineWidth=1.2;c.beginPath();c.ellipse(xx,y,10,8,0,-.1,Math.PI);c.stroke();c.strokeStyle='#f8ffff60';c.beginPath();c.ellipse(xx,y-1,9,7,0,.25,2.3);c.stroke();}c.strokeStyle='#476b7170';c.lineWidth=2;c.beginPath();c.moveTo(0,244);c.lineTo(512,244);c.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
export function createKnife(){const group=new THREE.Group();const steel=physical('#dae2e4',.16,.95),handle=physical('#282b24',.45);cube(group,[.055,.012,.20],[0,0,-.03],steel,.003);cube(group,[.036,.023,.10],[0,0,.12],handle,.005);for(const z of [.09,.14])sphere(group,[.004,.012,.004],[0,0,z],steel);return group;}
export class Effects {
 constructor(scene){this.drops=[];this.ripples=[];const mat=new THREE.MeshPhysicalMaterial({color:'#bfefef',roughness:.1,transparent:true,opacity:.7});const geo=new THREE.SphereGeometry(.007,6,4);for(let i=0;i<200;i++){const m=mesh(geo,mat,scene);m.visible=false;m.castShadow=false;this.drops.push({m,life:0,v:new THREE.Vector3()});}for(let i=0;i<24;i++){const m=mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:'#c3ede6',transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false}),scene);m.rotation.x=-Math.PI/2;m.visible=false;this.ripples.push({m,life:0});}}
 splash(p,count){let left=count;for(const d of this.drops){if(d.life<=0&&left-->0){d.life=.7;d.m.visible=true;d.m.position.set(p.x,p.y-.03,p.z);d.v.set((Math.random()-.5)*.8,.35+Math.random()*.6,(Math.random()-.5)*.8);}}const r=this.ripples.find(r=>r.life<=0);if(r){r.life=1.2;r.m.visible=true;r.m.position.set(p.x,p.y-.062,p.z);}}
 reset(){for(const a of [...this.drops,...this.ripples]){a.life=0;a.m.visible=false;}}
 update(dt){for(const d of this.drops)if(d.life>0){d.life-=dt;d.m.visible=d.life>0;d.v.y-=2.8*dt;d.m.position.addScaledVector(d.v,dt);}for(const r of this.ripples)if(r.life>0){r.life-=dt;r.m.visible=r.life>0;r.m.scale.setScalar(.02+.16*(1-r.life/1.2));r.m.material.opacity=.35*r.life/1.2;}}
}
