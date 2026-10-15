import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleSimulation} from '../battle-simulation.js';
import {Session} from '../server/src/session.js';
const game=()=>{const s=new BattleSimulation(91);s.start();for(const p of s.players)p.bot=false;return s;};
const land=s=>{for(let n=0;n<90&&!s.players[0].grounded;n++)s.step();};
test('brief wall contact and turning away preserve normal and rainbow combos for both character types',()=>{
 for(const character of ['fish','squid'])for(const combo of [3,50]){
  const s=game(),p=s.players[0];Object.assign(p,{character,combo,lastComboLanding:0,p:{x:14.2,y:.28,z:0},prev:{x:14.2,y:.28,z:0},yaw:-Math.PI/2});
  assert.equal(s.jump(0,'A'),true);land(s);assert.equal(p.combo,combo+1);assert.ok(p.wallBlockedTime<2);
  p.yaw=Math.PI/2;assert.equal(s.jump(0,'D'),true);land(s);assert.equal(p.combo,combo+2);assert.equal(p.wallBlockedTime,0);
  assert.ok(!s.events.some(e=>e.type==='comboReset'&&e.reason==='wallBlocked'));
 }
});
test('moving along a wall remains eligible for BP and combo growth',()=>{
 const s=game(),p=s.players[0];Object.assign(p,{p:{x:14.2,y:.28,z:0},prev:{x:14.2,y:.28,z:0},yaw:0});
 for(const key of ['A','D','A','D','A','D']){assert.equal(s.jump(0,key),true);land(s);}
 assert.equal(p.combo,6);assert.ok(p.points>0);assert.equal(p.wallBlockedTime,0);assert.ok(p.p.z<-1);
});
test('authoritative snapshots and score events contain no central area state and award fifty rainbow BP everywhere',()=>{
 const r=new Session('ABC234');r.add('a','A');r.add('b','B');r.ready('a',true);r.ready('b',true);r.start('a');for(let i=0;i<180;i++)r.step();
 for(const z of [2,-6]){const p=r.sim.players[0];Object.assign(p,{p:{x:0,y:.28,z},combo:49,lastComboLanding:r.sim.time,scoringJump:true,scoringWater:100,grounded:true});const before=p.points;assert.equal(r.sim.scoreLanding(p),true);assert.equal(p.points-before,50);}
 const snapshot=r.snapshot();for(const p of snapshot.players)assert.equal(Object.hasOwn(p,'inBPArea'),false);
 assert.ok(r.sim.events.every(e=>e.type!=='bpArea'&&!Object.hasOwn(e,'area')));
});
