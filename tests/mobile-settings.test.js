import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validateSettings,loadSettings,saveSettings,buttonRect,TOUCH_LOOK_BASE} from '../mobile-settings.js';
test('mobile defaults use a faster base than 0.85 and safely reject corrupt saved values',()=>{
 assert.ok(TOUCH_LOOK_BASE>.85);assert.equal(defaults().sensitivity,1);
 for(const raw of [null,[],{},'broken',{sensitivity:Infinity,buttons:{jump:{x:2,y:-1,scale:9}}}])assert.deepEqual(validateSettings(raw),defaults());
 assert.deepEqual(loadSettings({getItem:()=>'{'}),defaults());assert.deepEqual(loadSettings({getItem(){throw Error();}}),defaults());assert.equal(saveSettings(undefined,defaults()),false);
 const input=defaults();input.sensitivity=3;input.buttons.attack={x:.8,y:.7,scale:1.5};let saved;
 const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};assert.equal(saveSettings(storage,input),true);assert.deepEqual(loadSettings(storage),input);
});
test('relative button positions and touch hit sizes remain inside safe areas after portrait/landscape resize',()=>{
 for(const [w,h]of [[844,390],[390,844],[568,320]])for(const scale of [.7,1,1.5])for(const key of ['bitan','jump','attack','view'])for(const [x,y]of [[0,0],[1,1],[.4,.7]]){
  const r=buttonRect(key,{x,y,scale},w,h,{left:44,right:44,top:8,bottom:24});
  assert.ok(r.x-r.size/2>=44-.0001);assert.ok(r.x+r.size/2<=w-44+.0001);assert.ok(r.y-r.size/2>=8-.0001);assert.ok(r.y+r.size/2<=h-24+.0001);
 }
 const large=buttonRect('bitan',{x:.5,y:.5,scale:1.5},844,390);assert.equal(large.size,144);
});
