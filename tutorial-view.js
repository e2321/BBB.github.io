import * as THREE from 'three';
import {BattleMode} from './battle-view.js';
import {TutorialController,TUTORIAL_ROUTE} from './tutorial-controller.js';
import {texture} from './visuals.js';
const $=id=>document.getElementById(id);
const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
export class TutorialMode extends BattleMode{
 constructor(scene,camera,fish,effects,audio,chefFactory){super(scene,camera,fish,effects,audio,chefFactory,'tutorial');this.tutorial=new TutorialController(this.sim);
  if(chefFactory)for(const c of this.sim.chefs)this.chefModels.push(chefFactory.create(this.root));
  const wood=new THREE.MeshStandardMaterial({map:texture('wood'),roughness:.72});for(let i=0;i<this.sim.obstacles.length;i++)if(this.sim.obstacles[i].kind==='prep-barrier')this.meshes[i].material=wood;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5ecd4';ctx.fillRect(0,0,256,256);for(const [r,c] of [[105,'#ab4b39'],[75,'#f5ecd4'],[45,'#ab4b39'],[15,'#ffe477']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(128,128,r,0,Math.PI*2);ctx.fill();}
  const targetTexture=new THREE.CanvasTexture(canvas);targetTexture.colorSpace=THREE.SRGBColorSpace;this.practiceMesh=new THREE.Mesh(new THREE.BoxGeometry(2.4,2,.16),new THREE.MeshStandardMaterial({map:targetTexture,roughness:.65}));this.practiceMesh.position.set(0,1.05,5.5);this.root.add(this.practiceMesh);
  this.goalRing=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,32),new THREE.MeshBasicMaterial({color:'#b6f0b5'}));this.goalRing.rotation.x=-Math.PI/2;this.goalRing.position.set(0,.04,this.sim.stage.goal.z);this.root.add(this.goalRing);
  const sign=document.createElement('canvas');sign.width=256;sign.height=128;const signContext=sign.getContext('2d');signContext.fillStyle='#285e4d';signContext.fillRect(0,0,256,128);signContext.fillStyle='#dfffe6';signContext.font='bold 65px sans-serif';signContext.textAlign='center';signContext.fillText('出口',128,88);this.goalSign=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sign)}));this.goalSign.position.set(0,2.3,this.sim.stage.goal.z);this.goalSign.scale.set(1.4,.7,1);this.root.add(this.goalSign);
  const arrow=new THREE.Shape();arrow.moveTo(0,-.45);arrow.lineTo(-.28,0);arrow.lineTo(-.1,0);arrow.lineTo(-.1,.35);arrow.lineTo(.1,.35);arrow.lineTo(.1,0);arrow.lineTo(.28,0);arrow.closePath();const arrowGeometry=new THREE.ShapeGeometry(arrow),arrowMaterial=new THREE.MeshBasicMaterial({color:'#e5c981',side:THREE.DoubleSide});
  const arrowRoute=[[-.8,4.2],...TUTORIAL_ROUTE];for(let i=0;i<arrowRoute.length-1;i++){const [x,z]=arrowRoute[i],[nx,nz]=arrowRoute[i+1],m=new THREE.Mesh(arrowGeometry,arrowMaterial);m.rotation.x=Math.PI/2;m.rotation.z=Math.atan2(nx-x,-(nz-z));m.position.set(x,.035,z);this.root.add(m);}
  this.enter();
 }
 enter(){super.enter();this.tutorial?.reset();$('battleLobby').hidden=true;$('tutorialLobby').hidden=false;$('tutorialResults').hidden=true;$('tutorialSkip').hidden=false;if(this.tutorial)this.update(0);}
 start(){super.start(false);this.tutorial.reset();this.yaw=0;this.sim.aim(0,0,this.pitch);$('tutorialLobby').hidden=true;$('tutorialHUD').hidden=false;this.update(0);}
 events(){this.tutorial?.consume(this.sim.events);for(const e of this.sim.events){if(e.type==='tutorialStep'){this.yaw=0;this.pitch=-.06;this.swimming=false;this.onMatchStart?.();this.audio.effect('comboUp');}if(e.type==='practiceHit')this.audio.effect('metal');}super.events();}
 fire(){if(this.tutorial?.phase===1)super.fire();}
 togglePause(){super.togglePause();$('battleContinue').textContent='チュートリアルに戻る';}
 showResult(){this.shown=true;if(document.pointerLockElement)document.exitPointerLock();$('battleHUD').hidden=true;$('tutorialHUD').hidden=true;$('tutorialSkip').hidden=true;$('tutorialResults').hidden=false;$('tutorialClearTime').textContent=`クリアタイム ${time(this.sim.time)} ／ ${this.sim.players[0].points} BP`;this.audio.effect('win');this.onClear?.();}
 update(raw,dt=Math.min(raw,.1)){super.update(raw,dt);if(!this.tutorial)return;const hint=this.tutorial.hint;$('tutorialStepName').textContent=hint.name;$('tutorialInstruction').textContent=hint.text;$('tutorialDetail').textContent=hint.detail;$('tutorialProgress').textContent=`${hint.progress} ／ ${this.sim.players[0].points} BP`;$('tutorialHUD').hidden=this.sim.state==='READY'||this.sim.state==='FINISHED';$('battleStageBadge').textContent='チュートリアル';$('battleTime').textContent=time(this.sim.time);$('battleRules').hidden=true;$('battleCountdown').hidden=true;$('battleFeignGuide').hidden=true;
  if(this.sim.players[0].feigning)$('battleFeignHint').textContent='死んだふり体験！ A / D・Spaceで起きよう';
  if(this.practiceMesh)this.practiceMesh.visible=this.tutorial.phase===1;if(this.goalRing)this.goalRing.visible=this.tutorial.phase===2;if(this.goalSign)this.goalSign.visible=this.tutorial.phase===2;
  for(const model of this.chefModels)model.root.visible=this.tutorial.phase===2;
  const gateIndex=this.sim.stage.obstacles.findIndex(o=>o.id==='practice-gate');if(this.meshes[gateIndex]){this.meshes[gateIndex].visible=this.tutorial.phase<2;this.meshes[gateIndex].layers.set(this.tutorial.phase<2?0:2);}
 }
 dispose(){super.dispose();$('tutorialHUD').hidden=true;$('tutorialLobby').hidden=true;$('tutorialResults').hidden=true;$('tutorialSkip').hidden=true;}
 snapshot(){return {...super.snapshot(),tutorial:{phase:this.tutorial.phase,flops:this.tutorial.flops,jumped:this.tutorial.jumped,hit:this.tutorial.hit,feignPracticed:this.tutorial.feignPracticed,complete:this.tutorial.complete,times:[...this.tutorial.times]}};}
}
