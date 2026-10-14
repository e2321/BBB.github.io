import * as THREE from 'three';
import { Simulation, DT, clamp } from './simulation.js';
import { createChef, createKnife, Effects } from './visuals.js';
import { createWorld } from './kitchen.js';
import { loadFish } from './fish-model.js';
import { START, ZONES } from './stage.js';
import { deathPresentation } from './death-presentation.js';
import { drawMap } from './ui-map.js';
import './style.css';

const $=id=>document.getElementById(id),canvas=$('world'),sim=new Simulation();
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('message').textContent='WebGLを利用できません。ブラウザのハードウェアアクセラレーションを有効にしてください。';$('start').disabled=true;throw error;}
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,1,.025,60);
const world=createWorld(scene,renderer,sim.boxes),chef=createChef(scene),effects=new Effects(scene);
let fish=null,sashimiAvailable=false,assetReady=false;
const knifeMeshes=[],warnGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
const warning=new THREE.Line(warnGeometry,new THREE.LineDashedMaterial({color:'#ff5d3c',dashSize:.08,gapSize:.045,transparent:true,opacity:.9}));warning.frustumCulled=false;warning.visible=false;scene.add(warning);
const target=new THREE.Vector3(START.x,START.y+.12,START.z),desired=new THREE.Vector3(),direction=new THREE.Vector3(),raycaster=new THREE.Raycaster();
let yaw=0,pitch=40*Math.PI/180,distance=2.2,shake=0,last=performance.now(),accumulator=0,frameCount=0,fpsTime=0,comboUntil=0,finishRendered=false,deathElapsed=0,checkpointToastUntil=0;
const held=new Set(),dragPointers=new Map();let audioContext,soundOn=true;
function sound(type){if(!soundOn||!audioContext)return;const t=audioContext.currentTime,gain=audioContext.createGain();gain.connect(audioContext.destination);gain.gain.setValueAtTime(type==='warning'?.04:.055,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);
 if(type==='land'||type==='jump'){const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.15),audioContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=audioContext.createBufferSource();source.buffer=buffer;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='land'?1100:650;source.connect(filter);filter.connect(gain);source.start(t);}
 else{const o=audioContext.createOscillator();o.type='sine';o.frequency.setValueAtTime(type==='surprise'?560:240,t);o.frequency.exponentialRampToValueAtTime(type==='surprise'?950:130,t+.15);o.connect(gain);o.start(t);o.stop(t+.16);}
}
const formatTime=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
let record={best:0,fastest:null};try{record={...record,...JSON.parse(localStorage.getItem('sabakarenuna-tutorial-v2')||'{}')};}catch{}
function showRecord(){$('record').textContent=`BEST SCORE ${Math.floor(record.best).toLocaleString()}${record.fastest?`　／　最短 ${formatTime(record.fastest)}`:''}`;}showRecord();
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
function quality(){const q=$('quality').value;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='HIGH'?2:q==='MEDIUM'?1.5:1));renderer.shadowMap.enabled=q!=='LOW';world.key.shadow.mapSize.setScalar(q==='HIGH'?2048:1024);if(world.key.shadow.map){world.key.shadow.map.dispose();world.key.shadow.map=null;}resize();}
quality();addEventListener('resize',resize);$('quality').addEventListener('change',quality);
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=`音 ${soundOn?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(soundOn));});
function restart(fresh=false){
 if(!assetReady)return;
 if(!fresh&&sim.state==='GAMEOVER'&&sim.checkpoint)sim.retry();else sim.start();
 fish.reset();effects.reset();knifeMeshes.forEach(k=>k.visible=false);warning.visible=false;held.clear();dragPointers.clear();yaw=0;pitch=40*Math.PI/180;distance=2.2;target.set(sim.p.x,sim.p.y+.12,sim.p.z);accumulator=0;comboUntil=0;shake=0;finishRendered=false;deathElapsed=0;checkpointToastUntil=0;
 $('overlay').hidden=true;$('overlay').classList.remove('sashimi-result');$('deathImage').hidden=true;$('hud').hidden=false;$('combo').textContent='';$('newRun').hidden=true;last=performance.now();
 try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{}
 if(matchMedia('(pointer:fine)').matches){try{const result=canvas.requestPointerLock();result?.catch?.(()=>{});}catch{}}
}
$('start').addEventListener('click',()=>restart());$('newRun').addEventListener('click',()=>restart(true));
function press(key){sim.input(key,yaw);}
addEventListener('keydown',e=>{if(e.code==='Escape'&&document.pointerLockElement)document.exitPointerLock();const key=e.code==='KeyA'?'A':e.code==='KeyD'?'D':null;if(!key||e.target instanceof HTMLSelectElement)return;e.preventDefault();if(e.repeat||held.has(key))return;held.add(key);press(key);});
addEventListener('keyup',e=>held.delete(e.code==='KeyA'?'A':e.code==='KeyD'?'D':''));addEventListener('blur',()=>{held.clear();dragPointers.clear();});
function rotate(dx,dy){if(sim.state!=='PLAYING')return;yaw-=dx*.003;pitch=clamp(pitch+dy*.003,20*Math.PI/180,75*Math.PI/180);}
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)rotate(e.movementX,e.movementY);});
function capturePointer(element,id){if(document.pointerLockElement)return;try{element.setPointerCapture(id);}catch{/* The pointer may have been cancelled by a lock or window transition. */}}
canvas.addEventListener('pointerdown',e=>{if(sim.state!=='PLAYING'||document.pointerLockElement===canvas)return;capturePointer(canvas,e.pointerId);dragPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas)return;const p=dragPointers.get(e.pointerId);if(p){rotate(e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;}});
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,e=>dragPointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=clamp(distance+e.deltaY*.002,2,4.5);},{passive:false});
for(const key of ['A','D']){$(`touch${key}`).addEventListener('pointerdown',e=>{e.preventDefault();capturePointer(e.currentTarget,e.pointerId);press(key);});}
const names={WAITING:'準備をしている',CHASING:'追跡中',ATTACKING:'包丁を構えている',SUSPICIOUS:'警戒している',APPROACHING:'拾いに近づく',INSPECTING:'手を伸ばしている',STUNNED:'驚いて気絶！'};
function hint(){const c=sim.chef;let text='',urgent=false;
 if(c.state==='INSPECTING'){if(c.timer<.45)text='まだ…手が近づくのを待て。';else if(c.timer<=.85){text='今だ！ A / D で跳ねろ！';urgent=true;}else text='つかまれる！';}
 else if(c.state==='STUNNED')text='奇襲成功！ワゴンが動いた。今のうちに突破！';
 else if(c.state==='ATTACKING'){text='包丁が来る！予告線から跳ねて逃げろ！';urgent=true;}
 else if(sim.burning){text='熱い！炎から離れて、水分を回復しよう！';urgent=true;}
 else if(sim.water<25){text='干からびる！青緑色の水たまりで回復！';urgent=true;}
 else if(sim.stage===3&&!sim.gateOpened)text=sim.dead?(c.state==='APPROACHING'?'手が伸びたら「今だ！」の合図で跳ねろ！':'死んだふり中…疑い度が下がるのを待とう。'):'料理人の前で止まれ。死んだふりでワゴンを突破！';
 else text=ZONES[sim.stage].hint;
 $('hint').textContent=text;$('hint').classList.toggle('urgent',urgent);
 $('stageName').textContent=ZONES[sim.stage].name;$('checkpointHUD').textContent=`チェックポイント ${sim.checkpointId} / 2　挑戦 ${sim.attempts}回目`;
 const showBanner=sim.time<sim.stageMessageUntil;$('stageBanner').hidden=!showBanner;if(showBanner)$('stageBanner').textContent=`${ZONES[sim.stage].name}　—　${ZONES[sim.stage].hint}`;
}
function finish(){
 finishRendered=true;deathElapsed=0;target.set(sim.p.x,sim.p.y+.12,sim.p.z);$('hud').hidden=true;if(document.pointerLockElement)document.exitPointerLock();record.best=Math.max(record.best,sim.score);if(sim.state==='CLEAR')record.fastest=record.fastest===null?sim.time:Math.min(record.fastest,sim.time);try{localStorage.setItem('sabakarenuna-tutorial-v2',JSON.stringify(record));}catch{}
 const clear=sim.state==='CLEAR',p=deathPresentation(sim.deathCause);$('overlay').hidden=false;$('overlay').classList.toggle('sashimi-result',!clear&&p.effect==='sashimi');document.querySelector('.eyebrow').textContent=clear?'FIVE CHALLENGES. ONE SURVIVOR.':p.eyebrow;document.querySelector('h1').textContent=clear?'脱出成功！！':p.title;document.querySelector('.subtitle').textContent=clear?'厨房を越えて、生き延びた。':p.subtitle;$('message').textContent=sim.reason||'5つの区間を突破し、排水溝から厨房の外へ。';
 $('results').innerHTML=`${clear?'CLEAR TIME':'SURVIVAL'}　${formatTime(sim.time)}　／　SCORE ${sim.score.toLocaleString()}<br><small>奇襲 ${sim.successes}回　／　交互入力 ${sim.alternations}回　／　残水分 ${Math.round(sim.water)}%　／　挑戦 ${sim.attempts}回</small>`;
 $('deathImage').hidden=clear||p.effect!=='sashimi'||!sashimiAvailable;if(!clear&&p.effect==='sashimi'&&!sashimiAvailable)$('message').textContent+=' 刺身画像を読み込めませんでした。必要なファイル: public/assets/images/sashimi.png';
 document.querySelector('.instructions').hidden=true;$('start').innerHTML=sim.checkpoint&&!clear?'RETRY <span>→</span>':'RETRY <span>→</span>';$('newRun').hidden=!sim.checkpoint||clear;showRecord();sound(clear?'surprise':'warning');
 if(!clear&&p.effect==='capture'){chef.setOpacity(1);fish.play('Captured');target.set(sim.chef.x,sim.chef.y+1.13,sim.chef.z);camera.position.set(sim.chef.x+1.45,sim.chef.y+1.8,sim.chef.z+1.8);camera.lookAt(target);}if(!clear&&p.effect==='dry'){fish.play('Dry');target.set(sim.p.x,sim.p.y+.03,sim.p.z);camera.position.set(sim.p.x+.50,sim.p.y+.43,sim.p.z+.55);camera.lookAt(target);}
}
function events(){for(const e of sim.events){
 if(e.type==='stroke')fish?.play(e.key==='A'?'TailBeat_A':'TailBeat_D',true);
 if(e.type==='jump'){effects.splash(sim.p,12);sound('jump');}if(e.type==='land'){effects.splash(sim.p,20);sound('land');fish?.play('Landing',true);shake=.018;}
 if(e.type==='surprise'){comboUntil=sim.time+2;$('combo').textContent='奇襲成功！';sound('surprise');shake=.03;}if(e.type==='combo'){comboUntil=sim.time+.8;$('combo').textContent=`RHYTHM × ${e.combo+1}`;}if(e.type==='warning'||e.type==='heat')sound('warning');
 if(e.type==='checkpoint'){checkpointToastUntil=sim.time+3;comboUntil=checkpointToastUntil;$('combo').textContent=`CHECKPOINT ${e.id} 保存！`;sound('surprise');}
 }sim.events.length=0;}
function renderCamera(dt){
 if(sim.state==='READY'){camera.position.set(2.35,2.65,9.5);camera.lookAt(0,1.15,6.75);return;}
 if(sim.state==='GAMEOVER'&&sim.deathCause==='CAPTURE'){target.set(sim.chef.x,sim.chef.y+1.13,sim.chef.z);desired.set(sim.chef.x+1.45,sim.chef.y+1.8,sim.chef.z+1.8);camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(target);return;}
 if(sim.state==='GAMEOVER'&&sim.deathCause==='DRY'){target.set(sim.p.x,sim.p.y+.03,sim.p.z);camera.position.set(sim.p.x+.50,sim.p.y+.43,sim.p.z+.55);camera.lookAt(target);return;}
 const follow=new THREE.Vector3(sim.p.x,sim.p.y+.12,sim.p.z);target.lerp(follow,1-Math.exp(-12*dt));
 let effectivePitch=pitch;desired.set(Math.sin(yaw)*Math.cos(effectivePitch)*distance,Math.sin(effectivePitch)*distance,Math.cos(yaw)*Math.cos(effectivePitch)*distance).add(target);
 function getHit(){direction.copy(desired).sub(target);raycaster.set(target,direction.clone().normalize());raycaster.far=direction.length();return raycaster.intersectObjects(world.cameraObstacles,false)[0];}
 let hit=getHit();
 // Lift the camera over a nearby sink rim before shortening the boom. This keeps
 // the full 35 cm fish in frame instead of placing the lens 25 cm away.
 if(hit&&hit.distance<.8){effectivePitch=Math.max(pitch,65*Math.PI/180);desired.set(Math.sin(yaw)*Math.cos(effectivePitch)*distance,Math.sin(effectivePitch)*distance,Math.cos(yaw)*Math.cos(effectivePitch)*distance).add(target);hit=getHit();}
 if(hit)desired.copy(target).addScaledVector(direction.normalize(),Math.max(.32,hit.distance-.10));
 camera.position.copy(desired);if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake*=Math.exp(-14*dt);}camera.lookAt(target);
 if(fish){direction.copy(fish.root.position).sub(camera.position);raycaster.set(camera.position,direction.clone().normalize());raycaster.far=direction.length();chef.setOpacity(raycaster.intersectObject(chef.root,true).length?.2:1);}
}
function renderObjects(dt){chef.update(sim,sim.time);sim.chefFacing=chef.root.rotation.y;fish?.update(sim,dt,deathElapsed);world.update(sim);
 while(knifeMeshes.length<sim.knives.length){const k=createKnife();scene.add(k);knifeMeshes.push(k);}knifeMeshes.forEach((m,i)=>{const k=sim.knives[i];m.visible=!!k;if(k){m.position.set(k.p.x,k.p.y,k.p.z);m.rotation.set(k.angle,Math.atan2(-k.v.x,-k.v.z),0);}});
 warning.visible=sim.state==='PLAYING'&&sim.chef.state==='ATTACKING';if(warning.visible){const a=warning.geometry.attributes.position;a.setXYZ(0,sim.chef.x,sim.chef.y+1.08,sim.chef.z);a.setXYZ(1,sim.p.x,sim.p.y,sim.p.z);a.needsUpdate=true;warning.computeLineDistances();}
}
function frame(now){requestAnimationFrame(frame);const rawDelta=Math.max(0,(now-last)/1000),delta=Math.min(.1,rawDelta);last=now;
 if(sim.state==='PLAYING'&&!(import.meta.env.DEV&&sim.debugPaused)){accumulator=Math.min(accumulator+delta,DT*5);let steps=0;while(accumulator>=DT&&steps++<5){sim.step();events();effects.update(DT);accumulator-=DT;}}
 if(['GAMEOVER','CLEAR'].includes(sim.state)&&!finishRendered)finish();if(sim.state==='GAMEOVER')deathElapsed+=Math.min(.5,rawDelta);
 renderObjects(delta);renderCamera(delta);renderer.render(scene,camera);
 frameCount++;fpsTime+=delta;if(fpsTime>=.5){$('fps').textContent=`${Math.round(frameCount/fpsTime)} FPS`;fpsTime=0;frameCount=0;}
 $('time').textContent=formatTime(sim.time);$('enemy').textContent=names[sim.chef.state];$('enemyDetail').textContent=`疑い度 ${Math.round(sim.suspicion)}%${sim.dead?'　／　死んだふり':''}`;$('suspicion').style.width=`${sim.suspicion}%`;$('water').style.width=`${sim.water}%`;$('waterText').textContent=`${Math.ceil(sim.water)}%`;$('water').parentElement.classList.toggle('low',sim.water<25);if(sim.time>comboUntil)$('combo').textContent='';hint();drawMap($('minimap'),sim);
}
$('hud').hidden=true;requestAnimationFrame(frame);
const sashimi=new Image();sashimi.onload=()=>{sashimiAvailable=true;$('sashimiImage').src=sashimi.src;};sashimi.onerror=()=>{sashimiAvailable=false;};sashimi.src=`${import.meta.env.BASE_URL}assets/images/sashimi.png`;
loadFish(scene,p=>{$('loadingStatus').textContent=`Blender製マダイを読み込み中… ${Math.round(p*100)}%`;}).then(async model=>{fish=model;await renderer.compileAsync(scene,camera);assetReady=true;$('start').disabled=false;$('start').innerHTML='START <span>→</span>';$('loadingStatus').textContent='マダイGLB / 6ボーン / 7アニメーション 読み込み完了';}).catch(error=>{$('loadingStatus').textContent=`魚の読み込みに失敗: ${error.message}`;$('message').textContent='魚GLBを確認してください。Blenderで tools/build_fish.py を実行して再生成できます。低品質な代替モデルへの置換は行いません。';console.error(error);});
if(import.meta.env.DEV){window.__game={sim,setCamera(a,p=pitch){yaw=a;pitch=p;},snapshot(){return {state:sim.state,p:{...sim.p},v:{...sim.v},water:sim.water,time:sim.time,dead:sim.dead,jumps:sim.jumps,chef:{...sim.chef},suspicion:sim.suspicion,successes:sim.successes,knives:sim.knives.length,score:sim.score,checkpoint:sim.checkpointId,gateOpened:sim.gateOpened,assetReady,model:fish?{animations:fish.animations,vertices:fish.vertices,skinnedMeshes:fish.skinnedMeshes}:null,camera:camera.position.toArray()};},step(n){for(let i=0;i<n;i++){sim.step();events();}if(sim.state!=='PLAYING'&&!finishRendered)finish();}};}
