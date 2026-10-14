import test from 'node:test';
import assert from 'node:assert/strict';
import {RemoteFlopTrack} from '../remote-flop-track.js';
const player=(y,grounded,key='A',start=0)=>({p:{x:1,y,z:2},yaw:0,grounded,lastKey:key,jumpStart:start,jumpPeriod:.5});
test('remote hop starts, changes side and lands on the same presentation clock',()=>{
 const t=new RemoteFlopTrack();t.push(player(.28,true,'A',-1),0);t.push(player(.6,false,'D',.05),.05);t.push(player(.28,true,'D',.05),.1);
 let p=t.sample(.025);assert.equal(p.grounded,true);assert.equal(p.lastKey,'A');assert.equal(p.p.y,.28);
 p=t.sample(.05);assert.equal(p.lastKey,'D');assert.equal(p.jumpStart,.05);assert.equal(p.grounded,false);
 p=t.sample(.075);assert.ok(p.p.y>.28&&p.p.y<.6);assert.equal(p.grounded,false);
 p=t.sample(.1);assert.equal(p.grounded,true);assert.equal(p.p.y,.28);
});
test('jitter, reordered and repeated packets cannot rewind or grow history indefinitely',()=>{
 const t=new RemoteFlopTrack();for(let i=0;i<50;i++)t.push(player(.28,true),i*.05);
 assert.equal(t.frames.length,12);const time=t.sample(2.42).time;t.push(player(99,false),1);assert.equal(t.sample(2.1).time,time);
 t.push(player(.28,true),2.45);assert.equal(t.frames.length,12);assert.equal(t.sample(10).p.y,.28);
});
test('height interpolation respects elevated support and yaw takes the short route',()=>{
 const t=new RemoteFlopTrack(),a=player(1.48,true),b=player(1.48,true);a.yaw=Math.PI-.1;b.yaw=-Math.PI+.1;t.push(a,0);t.push(b,.1);
 const p=t.sample(.05);assert.equal(p.p.y,1.48);assert.ok(Math.abs(p.yaw-Math.PI)<1e-10);
});
