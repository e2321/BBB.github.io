import {squidModelSource,requestSquidGLB} from './squid-glb.js';
import {collection} from './gacha-store.js';
import {assetURL} from './character-registry.js';
import {models as collectionModels,createCollectionModel,requestCollectionModel} from './collection-model.js';
import {COLORS} from './progression.js';
import * as THREE from 'three';
import {createSeafoodModel} from './seafood-model.js';
import {SEAFOOD,loadSeafoodSettings,saveSeafoodSettings,characterId} from './seafood-settings.js';

// Preview rendering is optional. Always release GPU resources and restore the
// preview render target, including after a failed texture read or shader compile.
export function renderCharacterThumbnail(fish,renderer,kind,quality,canvas){
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#f4f7ff','#4b4843',2));const light=new THREE.DirectionalLight('#fff3dc',3);light.position.set(2,4,3);scene.add(light);
 let model,target;const old=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),clear=renderer.getClearColor(new THREE.Color()).clone();
 try{
  kind=characterId(kind);model=kind==='fish'?fish.createInstance(scene,{quality}):createSeafoodModel(scene,kind,quality);model.root.scale.setScalar(3.3);model.update({p:{x:0,y:0,z:0},yaw:0,time:0,grounded:false,dead:true,state:'READY',stroke:0},0);scene.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model.root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),distance=Math.max(size.x,size.y,size.z)*2.2;
  if(!Number.isFinite(distance)||distance<=0)throw new Error('プレビューモデルの大きさを取得できません');
  const camera=new THREE.PerspectiveCamera(38,1,.01,20);camera.position.copy(center).add(new THREE.Vector3(distance*.6,distance*.55,distance));camera.lookAt(center);
  target=new THREE.WebGLRenderTarget(192,192);target.texture.colorSpace=THREE.SRGBColorSpace;renderer.setRenderTarget(target);renderer.setClearColor('#19363e',1);renderer.clear();renderer.render(scene,camera);
  const pixels=new Uint8Array(192*192*4);renderer.readRenderTargetPixels(target,0,0,192,192,pixels);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('プレビュー画像を描画できません');const image=ctx.createImageData(192,192);for(let y=0;y<192;y++)image.data.set(pixels.subarray((191-y)*192*4,(192-y)*192*4),y*192*4);ctx.putImageData(image,0,0);return image;
 }finally{renderer.setRenderTarget(old);renderer.setClearColor(clear,alpha);model?.dispose();target?.dispose();}
}
// One detached preview context, reused for quality changes, no animation loop.
export class CharacterPreviews {
 constructor(fish,{createRenderer=()=>{const canvas=document.createElement('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.setSize(192,192,false);return renderer;}}={}){this.fish=fish;this.createRenderer=createRenderer;this.renderer=null;this.cache=new Map();this.enabled=true;this.creations=0;this.draws=0;this.contextLost=0;this.contextRestored=0;}
 draw(kind,quality,canvas){if(!this.enabled)return false;const key=characterId(kind)+':'+quality+(kind==='squid'?':'+squidModelSource():''),cached=this.cache.get(key);if(cached){canvas.getContext('2d')?.putImageData(cached,0,0);return true;}if(!this.renderer){this.renderer=this.createRenderer();this.creations++;this.renderer.domElement?.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost++;this.lost=true;});this.renderer.domElement?.addEventListener('webglcontextrestored',()=>{this.contextRestored++;this.lost=false;this.cache.clear();});}if(this.lost)return false;const image=renderCharacterThumbnail(this.fish,this.renderer,kind,quality,canvas);this.cache.set(key,image);this.draws++;return true;}
 snapshot(){return {enabled:this.enabled,rendererCreations:this.creations,draws:this.draws,cacheEntries:this.cache.size,contextLost:this.contextLost,contextRestored:this.contextRestored,animationLoops:0};}
 dispose(){this.renderer?.dispose();this.renderer=null;this.cache.clear();}
}
// Small 2D sample of the chosen effect, sharing the preview's bounded 12Hz clock.
function previewEffect(ctx,style,time){if(!ctx.beginPath||style==='normal')return;for(let i=0;i<8;i++){const phase=(time*.4+i/8)%1,x=48+i*23,y=205-phase*45,r=2+(i%3);ctx.beginPath();ctx.strokeStyle=ctx.fillStyle=style==='rainbow'?`hsl(${i*45},80%,68%)`:style==='sparkle'?'#f9ce57':'#56b7d2';if(style==='sparkle'){ctx.moveTo(x,y-r*2);ctx.lineTo(x+r*.7,y-r*.7);ctx.lineTo(x+r*2,y);ctx.lineTo(x+r*.7,y+r*.7);ctx.lineTo(x,y+r*2);ctx.lineTo(x-r*.7,y+r*.7);ctx.lineTo(x-r*2,y);ctx.closePath();ctx.fill();}else{ctx.arc(x,y,r,0,Math.PI*2);if(style==='bubble'){ctx.lineWidth=1;ctx.stroke();}else ctx.fill();}}}
// Fit the full preview bounds in camera space, including orbit and animation margin.
// This never changes model scale, gameplay geometry or collision bounds.
export function fitPreviewCamera(camera,box,direction,margin=1.18){
 const center=box.getCenter(new THREE.Vector3());
 if(box.isEmpty()||!Number.isFinite(box.min.x+box.max.x+box.min.y+box.max.y+box.min.z+box.max.z))throw new Error('プレビューモデルの大きさを取得できません');
 const forward=direction.clone().normalize(),right=new THREE.Vector3().crossVectors(camera.up,forward).normalize(),up=new THREE.Vector3().crossVectors(forward,right);
 const v=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),h=v*camera.aspect;
 let distance=.01;const size=box.getSize(new THREE.Vector3()),padding=Math.max(size.length()*.035,.025);
 for(let i=0;i<8;i++){
  const x=(i&1?box.max.x:box.min.x)-center.x,y=(i&2?box.max.y:box.min.y)-center.y,z=(i&4?box.max.z:box.min.z)-center.z;
  const depth=x*forward.x+y*forward.y+z*forward.z;
  distance=Math.max(distance,depth+margin*Math.max((Math.abs(x*right.x+y*right.y+z*right.z)+padding)/h,(Math.abs(x*up.x+y*up.y+z*up.z)+padding)/v));
 }
 camera.near=Math.max(.001,distance*.001);camera.far=distance+size.length()*3+1;
 camera.position.copy(center).addScaledVector(forward,distance);camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 return distance;
}
export function previewResolution(width,height,quality='low',dpr=1){
 width=Math.max(1,width||256);height=Math.max(1,height||256);
 const cap=quality==='low'?512:768,ratio=Math.min(Math.max(1,dpr||1),quality==='low'?1:1.5,cap/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
}
// Reuses the detached preview renderer. Driven by the existing application RAF only.
export class LiveCharacterPreview{
 constructor(previews,canvas){this.previews=previews;this.canvas=canvas;this.last=-Infinity;this.retryAfter=0;this.key='';this.scene=null;this.orbitX=0;this.orbitY=0;this.orbitDirty=false;}
 update(now,kind,choice,reduce=false,copyCanvas=null,quality='low'){const copyChanged=this.copyCanvas!==copyCanvas;this.copyCanvas=copyCanvas;const color=choice?.color||'normal',effect=choice?.effect||'water',effectChanged=this.effect!==effect,key=kind+':'+quality+':'+collectionModels.status(kind)+':'+color+(kind==='squid'?':'+squidModelSource():'');if(!['fish','squid'].includes(kind)&&collection.owns(kind)&&collectionModels.status(kind)==='idle')requestCollectionModel(kind);this.effect=effect;if(!this.previews.enabled||this.previews.lost||now<this.retryAfter)return;const rect=this.canvas.getBoundingClientRect?.(),width=rect?.width||256,height=rect?.height||256,resized=width!==this.viewWidth||height!==this.viewHeight||this.dpr!==(globalThis.devicePixelRatio||1);if(!resized&&!copyChanged&&!effectChanged&&key===this.key&&(now-this.last<1000/(quality==='low'?8:12)||reduce&&!this.orbitDirty))return;this.orbitDirty=false;this.last=now;const renderer=this.previews.renderer;if(!renderer)return;
  try{if(this.key!==key){this.model?.dispose();this.key=key;this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight('#effaff','#5d8296',2));const lamp=new THREE.DirectionalLight('#fff5cf',2.4);lamp.position.set(2,4,3);this.scene.add(lamp);const rim=new THREE.DirectionalLight('#69e8ff',1.4);rim.position.set(-2,1,-2);this.scene.add(rim);this.model=!['fish','squid'].includes(kind)?(createCollectionModel(this.scene,kind,quality)||this.previews.fish.createInstance(this.scene,{quality})):kind==='fish'?this.previews.fish.createInstance(this.scene,{quality}):createSeafoodModel(this.scene,kind,quality);this.model.root.scale.setScalar(3.3);this.model.update({p:{x:0,y:0,z:0},yaw:0,time:0,grounded:false,dead:true,state:'READY',stroke:0},0);this.scene.updateMatrixWorld(true);this.bounds=new THREE.Box3().setFromObject(this.model.root);this.baseY=this.model.root.position.y;this.camera=new THREE.PerspectiveCamera(38,1,.01,30);const tint=COLORS.find(c=>c.id===color)?.color;if(tint)this.model.accent(tint);}
   this.viewWidth=width;this.viewHeight=height;this.dpr=globalThis.devicePixelRatio||1;
   const resolution=previewResolution(width,height,quality,this.dpr);
   if(this.bufferWidth!==resolution.width||this.bufferHeight!==resolution.height||(renderer.domElement?.width!==undefined&&renderer.domElement.width!==resolution.width)||(renderer.domElement?.height!==undefined&&renderer.domElement.height!==resolution.height)){
    this.bufferWidth=resolution.width;this.bufferHeight=resolution.height;
    renderer.setSize?.(resolution.width,resolution.height,false);
    this.canvas.width=resolution.width;this.canvas.height=resolution.height;
   }
   const t=reduce?0:now/1000;this.model.root.position.y=this.baseY+(reduce?0:Math.sin(t*1.5)*.018);
   const angle=.6+Math.sin(t*.22)*.25+this.orbitX*.35;this.orbitOffset??=new THREE.Vector3();
   this.camera.aspect=width/height;this.distance=fitPreviewCamera(this.camera,this.bounds,this.orbitOffset.set(Math.sin(angle),.45+this.orbitY*.12,Math.cos(angle)));
   this.model.rainbow?.(color==='rainbow'?.5:0,t,false);const target=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),clear=renderer.getClearColor(new THREE.Color()).clone();try{renderer.setRenderTarget(null);renderer.setClearColor('#081d36',0);renderer.clear();renderer.render(this.scene,this.camera);const ctx=this.canvas.getContext('2d');ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.drawImage(renderer.domElement,0,0,this.canvas.width,this.canvas.height);if(ctx.save){ctx.save();ctx.scale(this.canvas.width/256,this.canvas.height/256);previewEffect(ctx,effect,t);ctx.restore();}if(copyCanvas){const ctx2=copyCanvas.getContext('2d');ctx2.clearRect(0,0,256,256);const ratio=this.bufferWidth/this.bufferHeight,w=ratio>=1?256:256*ratio,h=ratio>=1?256/ratio:256;ctx2.drawImage(renderer.domElement,(256-w)/2,(256-h)/2,w,h);previewEffect(ctx2,effect,t);}this.canvas.hidden=false;}finally{renderer.setRenderTarget(target);renderer.setClearColor(clear,alpha);}
  }catch(error){this.canvas.hidden=true;this.model?.dispose();this.model=null;this.key='';this.retryAfter=now+5000;console.warn('[BBB home preview]',error);}
 }
 setOrbit(x,y){const a=Math.max(-1,Math.min(1,x)),b=Math.max(-1,Math.min(1,y));if(this.orbitX===a&&this.orbitY===b)return;this.orbitX=a;this.orbitY=b;this.orbitDirty=true;}
 dispose(){this.model?.dispose();this.scene=null;}
}
export function initSeafoodMenu(fish,onChange,options={}){
 const settings=loadSeafoodSettings(),panel=document.getElementById('characterPanel'),cards=document.getElementById('characterCards'),quality=document.getElementById('modelQuality');if(!panel||!cards||!quality)return;const previews=new CharacterPreviews(fish,options);quality.value=settings.quality;cards.replaceChildren();
 let previousCharacter=null,switchAnimation=null;function selection(){if(previousCharacter&&previousCharacter!==settings.character&&!document.body?.classList.contains('reduce-motion')&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){switchAnimation?.cancel();switchAnimation=document.getElementById('homePreview')?.animate?.([{transform:'translateX(16px) scale(.94)',opacity:.4},{transform:'translateX(0) scale(1)',opacity:1}],{duration:360,easing:'cubic-bezier(.2,.75,.25,1)'});}previousCharacter=settings.character;for(const c of cards.children){const owned=collection.owns(c.dataset.character);c.disabled=!owned;c.title=owned?'選択できます':'ガチャで入手できます';const selected=c.dataset.character===settings.character;c.classList.toggle('selected',selected);c.setAttribute('aria-pressed',String(selected));}document.getElementById('selectedCharacterName').textContent=SEAFOOD.find(c=>c.id===settings.character).name;}
 // Cards identify the character; full game quality is independent of this small image.
 function thumbnails(){for(const card of cards.children){if(!card.querySelector('canvas'))continue;try{const drawn=previews.draw(card.dataset.character,'low',card.querySelector('canvas'));card.querySelector('canvas').hidden=!drawn;card.removeAttribute('title');}catch(error){card.querySelector('canvas').hidden=true;card.title='プレビューを表示できません。名前を押して選択できます。';console.warn('[BBB character preview]',card.dataset.character,error);}}}
 for(const item of SEAFOOD){const button=document.createElement('button');button.type='button';button.dataset.character=item.id;button.setAttribute('aria-label',item.name+'を選択');const canvas=document.createElement('canvas');canvas.width=canvas.height=192;canvas.setAttribute('aria-hidden','true');const name=document.createElement('strong');name.textContent=item.name;if(item.defaultOwned)button.append(canvas,name);else{const img=document.createElement('img');img.src=assetURL(item.thumbnailURL);img.alt=item.name;img.width=img.height=96;button.append(img,name);}button.addEventListener('click',()=>{if(!collection.owns(item.id))return;settings.character=item.id;saveSeafoodSettings(settings);selection();onChange(settings);});cards.append(button);}
 const cycle=direction=>{const owned=SEAFOOD.filter(c=>collection.owns(c.id));const index=owned.findIndex(c=>c.id===settings.character);settings.character=owned[(index+direction+owned.length)%owned.length].id;saveSeafoodSettings(settings);selection();onChange(settings);};const previous=()=>cycle(-1),next=()=>cycle(1);document.getElementById('characterPrevious').addEventListener('click',previous);document.getElementById('characterNext').addEventListener('click',next);collection.listeners.add(selection);selection();thumbnails();let disposed=false;if(typeof window!=='undefined')requestSquidGLB().then(value=>{if(value&&!disposed)thumbnails();});const liveCanvas=document.getElementById('homePreview'),live=liveCanvas?new LiveCharacterPreview(previews,liveCanvas):null;const orbit=e=>{if(e.pointerType==='touch')return;const b=liveCanvas.getBoundingClientRect();live?.setOrbit((e.clientX-b.left)/Math.max(1,b.width)*2-1,(e.clientY-b.top)/Math.max(1,b.height)*2-1);},unorbit=()=>live?.setOrbit(0,0);liveCanvas?.addEventListener('pointermove',orbit);liveCanvas?.addEventListener('pointerleave',unorbit);quality.addEventListener('change',()=>{settings.quality=quality.value;saveSeafoodSettings(settings);onChange(settings);});panel.dataset.ready='true';return {update(now,equipped,reduce){const panel=document.getElementById('homePanel'),custom=panel&&!panel.hidden?document.getElementById('customPreview'):null;if(live&&!document.getElementById('overlay').hidden&&!document.hidden&&document.getElementById('modeSheet')?.hidden!==false&&document.getElementById('sessionSheet')?.hidden!==false&&document.getElementById('developerDialog')?.hidden!==false&&(!panel||panel.hidden||custom))live.update(now,settings.character,equipped?.[settings.character],reduce||globalThis.matchMedia?.('(prefers-reduced-motion:reduce)').matches,custom,settings.quality);},refresh(){Object.assign(settings,loadSeafoodSettings());quality.value=settings.quality;selection();},renderer:()=>previews.renderer,snapshot:()=>previews.snapshot(),setPreviewsEnabled(enabled){previews.enabled=!!enabled;thumbnails();},dispose:()=>{disposed=true;switchAnimation?.cancel();liveCanvas?.removeEventListener('pointermove',orbit);liveCanvas?.removeEventListener('pointerleave',unorbit);collection.listeners.delete(selection);document.getElementById('characterPrevious').removeEventListener('click',previous);document.getElementById('characterNext').removeEventListener('click',next);live?.dispose();previews.dispose();}};
}
