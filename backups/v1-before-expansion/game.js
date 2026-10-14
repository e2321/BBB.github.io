import * as THREE from 'three';
import { Simulation, DT, clamp } from './simulation.js';
import { createWorld, createFish, createChef, createKnife, Effects } from './visuals.js';
import './style.css';

const $=id=>document.getElementById(id),canvas=$('world');
const sim=new Simulation();
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('message').textContent='WebGLを利用できません。ブラウザのハードウェアアクセラレーションを有効にして再起動してください。';$('start').disabled=true;throw error;}
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,1,.025,40);
const world=createWorld(scene,renderer,sim.boxes),fish=createFish(scene),chef=createChef(scene),effects=new Effects(scene);
const knifeMeshes=[];
const warnGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
const warning=new THREE.Line(warnGeometry,new THREE.LineDashedMaterial({color:'#ff5d3c',dashSize:.08,gapSize:.045,transparent:true,opacity:.9}));scene.add(warning);warning.visible=false;warning.frustumCulled=false;
const target=new THREE.Vector3(0,1.095,2.35),desired=new THREE.Vector3(),direction=new THREE.Vector3(),raycaster=new THREE.Raycaster();
let yaw=0,pitch=40*Math.PI/180,distance=2.2,shake=0,last=performance.now(),accumulator=0,frameCount=0,fpsTime=0,fps=60,comboUntil=0,finishRendered=false;
const held=new Set(),dragPointers=new Map();
let audioContext,soundOn=true;
function sound(type){if(!soundOn||!audioContext)return;const t=audioContext.currentTime;const gain=audioContext.createGain();gain.connect(audioContext.destination);gain.gain.setValueAtTime(type==='warning'?.04:.055,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);
 if(type==='land'||type==='jump'){const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.15),audioContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=audioContext.createBufferSource();source.buffer=buffer;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='land'?1100:650;source.connect(filter);filter.connect(gain);source.start(t);}
 else{const o=audioContext.createOscillator();o.type='sine';o.frequency.setValueAtTime(type==='surprise'?560:240,t);o.frequency.exponentialRampToValueAtTime(type==='surprise'?950:130,t+.15);o.connect(gain);o.start(t);o.stop(t+.16);}
}
function formatTime(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;}
let record={best:0,fastest:null};try{record={...record,...JSON.parse(localStorage.getItem('sabakarenuna-record')||'{}')};}catch{}
function showRecord(){$('record').textContent=`BEST SCORE ${Math.floor(record.best).toLocaleString()}${record.fastest?`　／　最短 ${formatTime(record.fastest)}`:''}`;}showRecord();
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
function quality(){const q=$('quality').value;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='HIGH'?2:q==='MEDIUM'?1.5:1));renderer.shadowMap.enabled=q!=='LOW';const size=q==='HIGH'?2048:1024;world.key.shadow.mapSize.set(size,size);if(world.key.shadow.map){world.key.shadow.map.dispose();world.key.shadow.map=null;}resize();}
quality();addEventListener('resize',resize);$('quality').addEventListener('change',quality);
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=`音 ${soundOn?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(soundOn));});
function restart(){sim.start();if(import.meta.env.DEV)sim.debugPaused=false;effects.reset();knifeMeshes.forEach(k=>k.visible=false);warning.visible=false;held.clear();dragPointers.clear();yaw=0;pitch=40*Math.PI/180;distance=2.2;target.set(0,1.095,2.35);accumulator=0;comboUntil=0;shake=0;finishRendered=false;$('overlay').hidden=true;$('hud').hidden=false;$('combo').textContent='';last=performance.now();
 try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{}
 // Pointer lock is optional; dragging also works if it is declined or released.
 if(matchMedia('(pointer:fine)').matches){try{const result=canvas.requestPointerLock();result?.catch?.(()=>{});}catch{}}
}
$('start').addEventListener('click',restart);
function press(key){sim.input(key,yaw);}
addEventListener('keydown',e=>{const key=e.code==='KeyA'?'A':e.code==='KeyD'?'D':null;if(!key)return;if(e.target instanceof HTMLSelectElement)return;e.preventDefault();if(e.repeat||held.has(key))return;held.add(key);press(key);});
addEventListener('keyup',e=>held.delete(e.code==='KeyA'?'A':e.code==='KeyD'?'D':''));
addEventListener('blur',()=>{held.clear();dragPointers.clear();});
function rotate(dx,dy){if(sim.state!=='PLAYING')return;yaw-=dx*.003;pitch=clamp(pitch+dy*.003,20*Math.PI/180,75*Math.PI/180);}
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)rotate(e.movementX,e.movementY);});
canvas.addEventListener('pointerdown',e=>{if(sim.state!=='PLAYING')return;canvas.setPointerCapture(e.pointerId);dragPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas)return;const p=dragPointers.get(e.pointerId);if(p){rotate(e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;}});
for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,e=>dragPointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=clamp(distance+e.deltaY*.002,2,4.5);},{passive:false});
for(const key of ['A','D']){const b=$(`touch${key}`);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(key);});}
const names={WAITING:'様子見',CHASING:'追跡中',ATTACKING:'包丁を構えている',SUSPICIOUS:'警戒している',APPROACHING:'拾いに近づく',INSPECTING:'手を伸ばしている',STUNNED:'驚いている！'};
function hint(){const c=sim.chef;let text='',urgent=false;
 if(c.state==='INSPECTING'){if(c.timer<.45)text='まだ…手が近づくのを待て。';else if(c.timer<=.85){text='今だ！ A / D で跳ねろ！';urgent=true;}else text='つかまれる！';}
 else if(c.state==='STUNNED')text='奇襲成功！今のうちにシンクへ逃げろ！';
 else if(c.state==='ATTACKING'){text='包丁が来る！予告線から跳ねて逃げろ！';urgent=true;}
 else if(sim.water<25){text='干からびる！シンクの水場を探せ！';urgent=true;}
 else if(sim.p.y<.75&&sim.p.z<-.4)text='排水溝に飛び込め！光る輪が出口だ。';
 else if(sim.dead)text=c.state==='APPROACHING'?'料理人が近づく…手が伸びたら跳ねろ！':'死んだふり中…疑いが晴れるのを待とう。';
 else if(sim.time<3)text='A・Dを交互に押して逃げろ！';
 else if(sim.time<16&&sim.successes===0)text='動きを止めて死んだふり！料理人を油断させろ。';
 else text='金色の矢印をたどれ。マウスで向きを変えてシンクへ！';
 $('hint').textContent=text;$('hint').classList.toggle('urgent',urgent);
}
function finish(){finishRendered=true;target.set(sim.p.x,sim.p.y+.12,sim.p.z);$('hud').hidden=true;if(document.pointerLockElement)document.exitPointerLock();record.best=Math.max(record.best,sim.score);if(sim.state==='CLEAR')record.fastest=record.fastest===null?sim.time:Math.min(record.fastest,sim.time);try{localStorage.setItem('sabakarenuna-record',JSON.stringify(record));}catch{}
 $('overlay').hidden=false;document.querySelector('.eyebrow').textContent=sim.state==='CLEAR'?'ESCAPED. STILL ALIVE.':'ONE MORE CHANCE.';document.querySelector('h1').textContent=sim.state==='CLEAR'?'脱出成功！！':'捌かれた…';document.querySelector('.subtitle').textContent=sim.state==='CLEAR'?'死んだふりで、生き延びた。':'次こそ、死を回避せよ。';$('message').textContent=sim.reason||'シンクの排水溝から、厨房の外へ。';$('results').innerHTML=`${sim.state==='CLEAR'?'CLEAR TIME':'SURVIVAL'}　${formatTime(sim.time)}<br>SCORE　${sim.score.toLocaleString()}<br><small>奇襲 ${sim.successes}回　／　交互入力 ${sim.alternations}回　／　残水分 ${Math.round(sim.water)}%</small>`;$('start').innerHTML='RETRY <span>→</span>';showRecord();sound(sim.state==='CLEAR'?'surprise':'warning');
}
function events(){for(const e of sim.events){if(e.type==='jump'){effects.splash(sim.p,12);sound('jump');}if(e.type==='land'){effects.splash(sim.p,20);sound('land');shake=.018;}if(e.type==='surprise'){comboUntil=sim.time+2;$('combo').textContent='DEAD FAKE SUCCESS!';sound('surprise');shake=.03;}if(e.type==='combo'){comboUntil=sim.time+.8;$('combo').textContent=`RHYTHM × ${e.combo+1}`;}if(e.type==='warning')sound('warning');}sim.events.length=0;}
function renderCamera(dt){
 if(sim.state==='READY'){camera.position.set(2.5,2.65,4.55);camera.lookAt(-.25,1.4,1.65);return;}
 const follow=new THREE.Vector3(sim.p.x,sim.p.y+.12,sim.p.z);target.lerp(follow,1-Math.exp(-12*dt));
 desired.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance).add(target);
 direction.copy(desired).sub(target);const len=direction.length();raycaster.set(target,direction.normalize());raycaster.far=len;const hit=raycaster.intersectObjects(world.cameraObstacles,false)[0];if(hit)desired.copy(target).addScaledVector(direction,Math.max(.25,hit.distance-.14));
 camera.position.copy(desired);if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake*=Math.exp(-14*dt);}camera.lookAt(target);
 direction.copy(fish.root.position).sub(camera.position);raycaster.set(camera.position,direction.clone().normalize());raycaster.far=direction.length();
 chef.setOpacity(raycaster.intersectObject(chef.root,true).length?.2:1);
}
function renderObjects(){const t=sim.time;fish.update(sim,t);chef.update(sim,t);while(knifeMeshes.length<sim.knives.length){const k=createKnife();scene.add(k);knifeMeshes.push(k);}knifeMeshes.forEach((m,i)=>{const k=sim.knives[i];m.visible=!!k;if(k){m.position.set(k.p.x,k.p.y,k.p.z);m.rotation.set(k.angle,Math.atan2(-k.v.x,-k.v.z),0);}});
 warning.visible=sim.state==='PLAYING'&&sim.chef.state==='ATTACKING';if(warning.visible){const a=warning.geometry.attributes.position;a.setXYZ(0,sim.chef.x,sim.chef.y+1.08,sim.chef.z);a.setXYZ(1,sim.p.x,sim.p.y,sim.p.z);a.needsUpdate=true;warning.computeLineDistances();}
 world.glow.material.opacity=.55+Math.sin(t*3)*.25;world.glow.scale.setScalar(1+Math.sin(t*2)*.06);
}
function frame(now){requestAnimationFrame(frame);const delta=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(sim.state==='PLAYING'&&!(import.meta.env.DEV&&sim.debugPaused)){accumulator=Math.min(accumulator+delta,DT*5);let steps=0;while(accumulator>=DT&&steps++<5){sim.step();events();effects.update(DT);accumulator-=DT;}if(sim.state!=='PLAYING'&&!finishRendered)finish();}
 if(['GAMEOVER','CLEAR'].includes(sim.state)&&!finishRendered)finish();
 renderObjects();renderCamera(delta);renderer.render(scene,camera);
 frameCount++;fpsTime+=delta;if(fpsTime>=.5){fps=Math.round(frameCount/fpsTime);fpsTime=0;frameCount=0;$('fps').textContent=`${fps} FPS`;}
 $('time').textContent=formatTime(sim.time);$('enemy').textContent=names[sim.chef.state];$('enemyDetail').textContent=`疑い度 ${Math.round(sim.suspicion)}%${sim.dead?'　／　死んだふり':''}`;$('suspicion').style.width=`${sim.suspicion}%`;$('water').style.width=`${sim.water}%`;$('waterText').textContent=`${Math.ceil(sim.water)}%`;$('water').parentElement.classList.toggle('low',sim.water<25);if(sim.time>comboUntil)$('combo').textContent='';hint();
}
$('hud').hidden=true;requestAnimationFrame(frame);
// Development-only inspection used by the automated checks; stripped by Vite in production.
if(import.meta.env.DEV){window.__game={sim,setCamera(a,p=pitch){yaw=a;pitch=p;},snapshot(){return {state:sim.state,p:{...sim.p},v:{...sim.v},water:sim.water,time:sim.time,dead:sim.dead,jumps:sim.jumps,chef:{...sim.chef},suspicion:sim.suspicion,successes:sim.successes,knives:sim.knives.length,score:sim.score};},step(n){for(let i=0;i<n;i++){sim.step();events();}if(sim.state!=='PLAYING'&&!finishRendered)finish();}};}
