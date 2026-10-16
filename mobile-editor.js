import {BUTTONS,buttonRect,defaults,loadSettings,saveSettings} from './mobile-settings.js';
export class MobileEditor {
 constructor(controls){
  this.controls=controls;let storage;try{storage=localStorage;}catch{}this.storage=storage;this.settings=loadSettings(storage);this.open=false;this.editing=false;this.selected='bitan';this.drag=null;
  this.panel=document.getElementById('mobileSettings');if(!this.panel)return;
  this.stage=document.getElementById('mobileLayoutEditor');this.probe=document.getElementById('mobileSafeArea');
  this.sensitivity=document.getElementById('mobileSensitivity');this.size=document.getElementById('mobileButtonSize');this.preview=new Map();
  for(const button of document.querySelectorAll('[data-open-mobile-settings]'))controls.on(button,'click',()=>this.show());
  controls.on(document.getElementById('mobileSettingsClose'),'click',()=>this.close());
  controls.on(this.sensitivity,'input',()=>{this.settings.sensitivity=Number(this.sensitivity.value);this.persist();this.labels();});
  controls.on(document.getElementById('mobileEditLayout'),'click',()=>this.edit());
  controls.on(document.getElementById('mobileLayoutSave'),'click',()=>this.finish(true));
  controls.on(document.getElementById('mobileLayoutCancel'),'click',()=>this.finish(false));
  controls.on(document.getElementById('mobileLayoutReset'),'click',()=>{this.draft.buttons=defaults().buttons;this.layout();this.labels();});
  controls.on(this.size,'input',()=>{this.draft.buttons[this.selected].scale=Number(this.size.value);this.settle(this.selected);this.labels();});
  for(const key of Object.keys(BUTTONS)){
   const el=document.createElement('button');el.type='button';el.textContent=BUTTONS[key].name;el.dataset.layoutButton=key;this.stage.append(el);this.preview.set(key,el);
   controls.on(el,'pointerdown',e=>{if(!this.editing)return;e.preventDefault();this.selected=key;this.labels();const rect=el.getBoundingClientRect();this.drag={id:e.pointerId,key,dx:e.clientX-(rect.left+rect.width/2),dy:e.clientY-(rect.top+rect.height/2)};el.setPointerCapture(e.pointerId);});
   controls.on(el,'pointermove',e=>{if(this.drag?.id!==e.pointerId)return;e.preventDefault();const d=this.drag,b=this.draft.buttons[d.key];b.x=Math.max(0,Math.min(1,(e.clientX-d.dx)/innerWidth));b.y=Math.max(0,Math.min(1,(e.clientY-d.dy)/innerHeight));this.layout();});
   for(const event of ['pointerup','pointercancel','lostpointercapture'])controls.on(el,event,e=>{if(this.drag?.id!==e.pointerId)return;this.drag=null;this.settle(key);});
  }
  controls.on(window,'resize',()=>{this.drag=null;this.layout();});controls.on(window.visualViewport,'resize',()=>{this.drag=null;this.layout();});this.layout();
 }
 persist(){const ok=saveSettings(this.storage,this.settings);const el=document.getElementById('mobileSettingsStatus');if(el)el.textContent=ok?'設定を保存しました':'このブラウザでは保存できません。この画面では設定を適用します。';}
 show(){if(!this.controls.enabled)return;this.controls.reset();this.open=true;this.panel.hidden=false;this.labels();this.controls.update();}
 close(){if(this.editing){this.finish(false);return;}this.open=false;if(this.panel)this.panel.hidden=true;this.controls.reset();this.controls.signature=null;this.controls.update();}
 edit(){this.draft=structuredClone(this.settings);this.editing=true;this.panel.hidden=true;this.stage.hidden=false;this.controls.reset();this.labels();this.layout();}
 finish(save){if(save){this.settings=this.draft;this.persist();}this.drag=null;this.editing=false;this.draft=null;this.stage.hidden=true;this.panel.hidden=false;this.layout();this.labels();}
 labels(){if(!this.panel)return;this.sensitivity.value=this.settings.sensitivity;document.getElementById('mobileSensitivityValue').textContent=`${this.settings.sensitivity.toFixed(1)}倍`;
  if(this.editing){const b=this.draft.buttons[this.selected];this.size.value=b.scale;document.getElementById('mobileSelectedButton').textContent=BUTTONS[this.selected].name;document.getElementById('mobileButtonSizeValue').textContent=`${Math.round(b.scale*100)}%`;for(const [key,el]of this.preview)el.classList.toggle('selected',key===this.selected);}
 }
 insets(){if(!this.probe)return {};const css=getComputedStyle(this.probe);return Object.fromEntries(['left','right','top','bottom'].map(k=>[k,parseFloat(css.getPropertyValue(`padding-${k}`))||0]));}
 rect(key){return buttonRect(key,(this.draft||this.settings).buttons[key],innerWidth,innerHeight,this.insets());}
 layout(){if(!this.panel)return;for(const key of Object.keys(BUTTONS)){const r=this.rect(key);const el=this.editing?this.preview.get(key):this.controls.elements.get(key);if(!el)continue;Object.assign(el.style,{position:'fixed',left:`${r.x-r.size/2}px`,top:`${r.y-r.size/2}px`,right:'auto',bottom:'auto',width:`${r.size}px`,height:`${r.size}px`,minWidth:'0',minHeight:'0',fontSize:`${(key==='bitan'?22:key==='view'?11:13)*(this.draft||this.settings).buttons[key].scale}px`});if(this.editing){const position=`${BUTTONS[key].name} 横${Math.round(r.x/innerWidth*100)}% 縦${Math.round(r.y/innerHeight*100)}%`;el.setAttribute('aria-label',position);if(key===this.selected){const output=document.getElementById('mobileLayoutPosition');if(output)output.textContent=position;}}}this.placeTutorial();}
 placeTutorial(){
  if(!document.body.style?.setProperty)return;
  const safe=this.insets(),w=innerWidth,h=innerHeight,width=h>w?w-24:Math.min(460,Math.max(180,w-310)),height=Math.max(50,Math.min(110,h*.28)),total=height+96;
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const blocks=Object.keys(BUTTONS).map(k=>{const r=this.rect(k);return {x:r.x-r.size/2-6,y:r.y-r.size/2-6,w:r.size+12,h:r.size+12};});
  let best=null;
  for(const x0 of [(w-width)/2,124,12,w-width-12])for(const y0 of [48,84,12,h-total-16]){
   const x=Math.max(safe.left||12,Math.min(w-width-(safe.right||12),x0)),y=Math.max((safe.top||0)+8,Math.min(h-total-(safe.bottom||12),y0));
   const rect={x,y,w:width,h:total},score=blocks.reduce((v,b)=>v+overlap(rect,b),0)+(y<45?1000:0)+Math.abs(x-(w-width)/2)*.01;
   if(!best||score<best.score)best={x,y,score};
  }
  for(const [k,v]of Object.entries({left:best.x,top:best.y,width,height}))document.body.style.setProperty(`--touch-tutorial-${k}`,`${v}px`);
 }
 // Nudge only the edited button on release/resize, leaving intentional custom layouts possible.
 settle(key){const b=this.draft.buttons[key];let r=this.rect(key);for(const other of Object.keys(BUTTONS)){if(other===key)continue;const o=this.rect(other),dx=r.x-o.x,dy=r.y-o.y,dist=Math.hypot(dx,dy),gap=(r.size+o.size)/2+6;if(dist<gap){b.x=Math.max(0,Math.min(1,(o.x+(dx/(dist||1)||1)*gap)/innerWidth));b.y=Math.max(0,Math.min(1,(o.y+dy/(dist||1)*gap)/innerHeight));r=this.rect(key);}}b.x=r.x/innerWidth;b.y=r.y/innerHeight;this.layout();}
 dispose(){this.open=false;this.editing=false;this.draft=null;this.drag=null;if(this.panel)this.panel.hidden=true;if(this.stage)this.stage.hidden=true;}
}
