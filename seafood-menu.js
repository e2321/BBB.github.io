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
 constructor(fish,{createRenderer=()=>{const canvas=document.createElement('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.setSize(192,192,false);return renderer;}}={}){this.fish=fish;this.createRenderer=createRenderer;this.renderer=null;this.cache=new Map();this.enabled=true;this.creations=0;this.draws=0;this.contextLost=0;this.contextRestored=0;}
 draw(kind,quality,canvas){if(!this.enabled)return false;const key=characterId(kind)+':'+quality,cached=this.cache.get(key);if(cached){canvas.getContext('2d')?.putImageData(cached,0,0);return true;}if(!this.renderer){this.renderer=this.createRenderer();this.creations++;this.renderer.domElement?.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost++;this.lost=true;});this.renderer.domElement?.addEventListener('webglcontextrestored',()=>{this.contextRestored++;this.lost=false;this.cache.clear();});}if(this.lost)return false;const image=renderCharacterThumbnail(this.fish,this.renderer,kind,quality,canvas);this.cache.set(key,image);this.draws++;return true;}
 snapshot(){return {enabled:this.enabled,rendererCreations:this.creations,draws:this.draws,cacheEntries:this.cache.size,contextLost:this.contextLost,contextRestored:this.contextRestored,animationLoops:0};}
 dispose(){this.renderer?.dispose();this.renderer=null;this.cache.clear();}
}
export function initSeafoodMenu(fish,onChange,options={}){
 const settings=loadSeafoodSettings(),panel=document.getElementById('characterPanel'),cards=document.getElementById('characterCards'),quality=document.getElementById('modelQuality');if(!panel||!cards||!quality)return;const previews=new CharacterPreviews(fish,options);quality.value=settings.quality;cards.replaceChildren();
 function selection(){for(const c of cards.children){const selected=c.dataset.character===settings.character;c.classList.toggle('selected',selected);c.setAttribute('aria-pressed',String(selected));}document.getElementById('selectedCharacterName').textContent=SEAFOOD.find(c=>c.id===settings.character).name;}
 function thumbnails(){for(const card of cards.children){try{const drawn=previews.draw(card.dataset.character,settings.quality,card.querySelector('canvas'));card.querySelector('canvas').hidden=!drawn;card.removeAttribute('title');}catch(error){card.querySelector('canvas').hidden=true;card.title='プレビューを表示できません。名前を押して選択できます。';console.warn('[BBB character preview]',card.dataset.character,error);}}}
 for(const item of SEAFOOD){const button=document.createElement('button');button.type='button';button.dataset.character=item.id;button.setAttribute('aria-label',item.name+'を選択');const canvas=document.createElement('canvas');canvas.width=canvas.height=192;canvas.setAttribute('aria-hidden','true');const name=document.createElement('strong');name.textContent=item.name;button.append(canvas,name);button.addEventListener('click',()=>{settings.character=item.id;saveSeafoodSettings(settings);selection();onChange(settings);});cards.append(button);}
 selection();thumbnails();quality.addEventListener('change',()=>{settings.quality=quality.value;saveSeafoodSettings(settings);thumbnails();onChange(settings);});panel.dataset.ready='true';return {snapshot:()=>previews.snapshot(),setPreviewsEnabled(enabled){previews.enabled=!!enabled;thumbnails();},dispose:()=>previews.dispose()};
}
