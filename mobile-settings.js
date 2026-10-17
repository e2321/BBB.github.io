export const MOBILE_SETTINGS_KEY='bbb.mobileControls.v1';
// Touch camera only: previous base was 0.85. PC mouse scaling is unchanged.
export const TOUCH_LOOK_BASE=1.3;
export const BUTTONS={bitan:{name:'ビタン！',size:96},attack:{name:'攻撃',size:82},special:{name:'必殺',size:66},view:{name:'TPS/FPS',size:52}};
export const defaults=()=>({sensitivity:1,autoFire:false,buttons:Object.fromEntries(Object.keys(BUTTONS).map(k=>[k,{x:null,y:null,scale:1}]))});
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateSettings(value){
 const result=defaults();if(!value||typeof value!=='object')return result;
 if(typeof value.autoFire==='boolean')result.autoFire=value.autoFire;
 if(finite(value.sensitivity,.5,3))result.sensitivity=value.sensitivity;
 for(const k of Object.keys(BUTTONS)){const b=value.buttons?.[k];if(!b)continue;
  if(finite(b.x,0,1)&&finite(b.y,0,1)){result.buttons[k].x=b.x;result.buttons[k].y=b.y;}
  if(finite(b.scale,.7,1.5))result.buttons[k].scale=b.scale;
 }return result;
}
export function loadSettings(storage){try{return validateSettings(JSON.parse(storage.getItem(MOBILE_SETTINGS_KEY)));}catch{return defaults();}}
export function saveSettings(storage,value){try{storage.setItem(MOBILE_SETTINGS_KEY,JSON.stringify(validateSettings(value)));return true;}catch{return false;}}
export function buttonRect(key,setting,width,height,insets={}){
 const l=Math.max(12,insets.left||0),r=Math.max(12,insets.right||0),t=Math.max(8,insets.top||0),b=Math.max(12,insets.bottom||0);
 const size=Math.min(BUTTONS[key].size*setting.scale,width-l-r,height-t-b);
 const positions={bitan:[l+size/2,height-b-size/2],attack:[width-r-size/2,height-b-size/2],special:[width-r-92-size/2,height-b-size/2],view:[width-r-size/2,height-b-104-size/2]};
 const [x,y]=setting.x===null?positions[key]:[setting.x*width,setting.y*height];
 return {x:Math.max(l+size/2,Math.min(width-r-size/2,x)),y:Math.max(t+size/2,Math.min(height-b-size/2,y)),size};
}

export const hasTouchInput=({primaryCoarse=false,anyCoarse=false,maxTouchPoints=0}={})=>primaryCoarse||anyCoarse||maxTouchPoints>0;
export function buttonLayout(buttons,width,height,insets={}){
 const result={};for(const key of Object.keys(BUTTONS)){let r=buttonRect(key,buttons[key],width,height,insets);const overlaps=q=>Object.values(result).reduce((sum,o)=>sum+Math.max(0,(q.size+o.size)/2+6-Math.hypot(q.x-o.x,q.y-o.y)),0);
  if(overlaps(r)>0){let best=r,bestScore=Infinity;for(const x of [.08,.25,.5,.75,.92])for(const y of [.12,.4,.7,.9]){const q=buttonRect(key,{...buttons[key],x,y},width,height,insets),score=overlaps(q)*10000+Math.hypot(q.x-r.x,q.y-r.y);if(score<bestScore){best=q;bestScore=score;}}r=best;}result[key]=r;
 }return result;
}
