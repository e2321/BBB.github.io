import {MobileEditor} from './mobile-editor.js';
import {TOUCH_LOOK_BASE} from './mobile-settings.js';
import {TapInput} from './mobile-input.js';
export class MobileControls {
 constructor({canvas,state,flop,jump,attack,view,menu,look,invalidate=()=>{},onDeviceChange=()=>{},activate=()=>{},lastKey}){
  this.canvas=canvas;this.state=state;this.invalidate=invalidate;this.onDeviceChange=onDeviceChange;this.activate=activate;this.root=document.getElementById('mobileControls');this.portrait=document.getElementById('mobilePortrait');this.bp=document.getElementById('mobileBP');this.media=matchMedia('(pointer:coarse)');this.enabled=this.media.matches;this.elements=new Map();this.listeners=[];this.active=false;this.token=null;this.round=null;
  this.input=new TapInput({flop,jump,attack,view,menu,look:(x,y)=>look(x*TOUCH_LOOK_BASE*(this.editor?.settings.sensitivity??1),y*TOUCH_LOOK_BASE*(this.editor?.settings.sensitivity??1)),lastKey,fullscreen:()=>this.fullscreen()});
  this.on(this.media,'change',()=>this.enable(this.media.matches));
  this.on(document,'pointerdown',e=>{if(e.pointerType==='touch')this.enable(true);else if(e.pointerType==='mouse'&&!this.media.matches)this.enable(false);},{capture:true});
  for(const button of this.root.querySelectorAll('[data-mobile-action]')){
   const action=button.dataset.mobileAction;this.elements.set(action,button);
   this.on(button,'pointerdown',e=>{if(this.editor?.open||e.pointerType==='mouse'||!this.enabled||e.button>0)return;e.preventDefault();e.stopPropagation();this.update();const s=this.state();if(!s.active||(['jump','attack'].includes(action)&&s.state!=='PLAYING')||s.dead&&['bitan','jump','attack'].includes(action))return;
    this.activate();if(this.input.down(e.pointerId,action)){button.setPointerCapture?.(e.pointerId);button.classList.add('pressed');this.invalidate();}});
   this.on(button,'pointermove',e=>{if(!this.input.buttons.has(e.pointerId))return;const r=button.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.left+r.width||e.clientY<r.top||e.clientY>r.top+r.height){this.release(e.pointerId);try{button.releasePointerCapture?.(e.pointerId);}catch{}}});
   this.on(button,'lostpointercapture',e=>this.release(e.pointerId));
   this.on(button,'contextmenu',e=>e.preventDefault());
  }
  this.on(canvas,'pointerdown',e=>{if(this.editor?.open||e.pointerType!=='touch'||!this.enabled||!this.state().active)return;const rect=canvas.getBoundingClientRect();if(e.clientX<rect.left+rect.width/2)return;e.preventDefault();this.activate();if(this.input.beginLook(e.pointerId,e.clientX,e.clientY))canvas.setPointerCapture?.(e.pointerId);});
  this.on(canvas,'pointermove',e=>{if(this.editor?.open)return;if(this.input.move(e.pointerId,e.clientX,e.clientY)){e.preventDefault();this.invalidate();}},{passive:false});
  this.on(canvas,'contextmenu',e=>{if(this.enabled)e.preventDefault();});
  for(const event of ['pointerup','pointercancel'])this.on(document,event,e=>this.release(e.pointerId));
  this.on(canvas,'lostpointercapture',e=>this.release(e.pointerId));
  this.on(window,'blur',()=>this.reset());this.on(document,'visibilitychange',()=>{if(document.hidden)this.reset();});
  this.on(window,'resize',()=>{this.reset();this.update();});
  this.on(window.visualViewport,'resize',()=>{this.reset();this.update();});
  this.on(document,'fullscreenchange',()=>{this.reset();this.invalidate();});
  this.staticCopies=new Map();for(const id of ['tutorialLobby','battleControlsHelp','battleCountdownHint']){const el=document.getElementById(id);if(el)this.staticCopies.set(el,el.innerHTML);}
  this.editor=new MobileEditor(this);
  this.enable(this.enabled,true);
 }
 on(target,event,fn,options){if(!target?.addEventListener)return;target.addEventListener(event,fn,options);this.listeners.push(()=>target.removeEventListener(event,fn,options));}
 enable(value,force=false){if(this.enabled===value&&!force)return;this.enabled=value;if(!value&&this.editor?.open){this.editor.dispose();}this.editor?.layout();this.signature=null;document.body.classList.toggle('mobile-ui',value);this.reset();for(const [el,pc] of this.staticCopies||[]){if(el.id==='tutorialLobby')el.innerHTML=value?'<p>BBBの主役は、攻撃じゃない。ビタンビタンだ！！</p><ol><li>左下のビタンボタンをタップ！ 1タップで1回。連打で移動とコンボ！</li><li>右側スワイプで視点を動かし、水たまりで回復</li><li>照準を合わせて攻撃ボタン。視点ボタンでTPS / FPS</li><li>ジャンプで回避。8コンボ＆100 BPを目指そう！</li></ol>':pc;else if(el.id==='battleControlsHelp')el.innerHTML=value?'左下：ビタン！を1タップで1回　右側スワイプ：視点<br>右下：ジャンプ・攻撃　視点：TPS / FPS　メニュー：一時停止':pc;else el.innerHTML=value?'ビタンボタンでその場ビタン！ 開始まで移動・得点なし':pc;}this.update();this.onDeviceChange(this.enabled);this.invalidate();}
 release(id){this.input.release(id);for(const [action,el] of this.elements)if(![...this.input.buttons.values()].includes(action))el.classList.remove('pressed');}
 reset(){this.input.reset();for(const el of this.elements.values())el.classList.remove('pressed');}
 update(){const s=this.state();if(this.token!==s.token||this.round!==s.round||this.active!==s.active){this.reset();this.token=s.token;this.round=s.round;this.active=s.active;}const show=this.enabled&&s.active&&!this.editor?.open,portrait=innerHeight>innerWidth,signature=[show,portrait,s.state,s.dead,s.connected,s.inWater,s.cooldown,s.grounded,s.view,s.points].join('|');if(signature===this.signature)return;this.signature=signature;this.root.hidden=!show;this.portrait.hidden=!(show&&portrait);if(!show)return;if(this.bp)this.label(this.bp,`${s.points||0} BP`);
  const attack=this.elements.get('attack'),jump=this.elements.get('jump'),bitan=this.elements.get('bitan');const unavailable=s.state!=='PLAYING'||s.dead||!s.connected||s.inWater||s.cooldown;
  this.set(attack,'aria-disabled',String(!!unavailable));attack.classList.toggle('unavailable',!!unavailable);this.label(attack,s.inWater?'水中は攻撃不可':s.cooldown?'準備中':'攻撃');
  jump.classList.toggle('unavailable',s.state!=='PLAYING'||s.dead||!s.grounded||s.inWater||!s.connected);bitan.classList.toggle('unavailable',s.dead||!s.connected);this.label(this.elements.get('view'),s.view||'TPS');
 }
 set(el,key,value){if(el.getAttribute(key)!==value)el.setAttribute(key,value);}
 label(el,value){if(el.textContent!==value)el.textContent=value;}
 async fullscreen(){try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();await screen.orientation?.lock?.('landscape');}catch{}this.invalidate();}
 dispose(){this.editor?.dispose();this.reset();for(const remove of this.listeners)remove();this.root.hidden=true;this.portrait.hidden=true;}
}
