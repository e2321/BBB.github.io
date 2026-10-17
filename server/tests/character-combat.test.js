import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';

function room(){
 const s=new Session('09');
 for(const [id,character] of [['a','fish'],['b','squid'],['c','starfish']]){s.add(id,id,character);s.ready(id,true);}
 s.chefCount=0;s.start('a');for(let i=0;i<180;i++)s.step();s.sim.ai.update=()=>{};return s;
}
test('authoritative character HP, gauge inputs and snapshots agree; forged charge and duplicate activation are rejected',()=>{
 const s=room(),p=s.sim.players[0];assert.deepEqual(s.sim.players.slice(0,3).map(p=>p.hp),[3,2,4]);
 const input=(seq,extra={})=>s.input('a',{kind:'special',seq,round:s.round,phase:'PLAYING',...extra});
 assert.equal(input(1,{specialGauge:100}),false);assert.equal(input(2),false);
 p.specialGauge=100;assert.equal(input(3),true);assert.equal(input(3),false);assert.equal(input(4),false);
 const snapshot=JSON.parse(JSON.stringify(s.snapshot()));assert.equal(snapshot.players[0].specialGauge,0);assert.equal(snapshot.players[0].specialUntil,5);assert.equal('specialCredits' in snapshot.players[0],false);
 assert.equal(input(5,{round:s.round-1}),false);
 p.specialGauge=40;p.hp=1;s.sim.damage(p,1);assert.equal(p.specialUntil,0);s.sim.time=p.deadUntil;s.sim.respawn(p);assert.equal(p.hp,3);assert.equal(p.specialGauge,40);assert.equal(p.invUntil,s.sim.time);
});
test('online rematch resets effects and gauge, retaining characters and identity',()=>{
 const s=room(),p=s.sim.players[1];p.specialGauge=100;s.sim.special(1);s.sim.finishMatch(60);s.step();assert.equal(s.phase,'RESULT');
 for(const q of s.sim.players){assert.equal(q.specialGauge,0);assert.equal(q.specialUntil,0);}
 const code=s.code,identities=[...s.members.values()].map(m=>[m.id,m.character,m.color]);
 for(const id of ['a','b','c'])s.requestRematch(id,true,s.round);
 assert.equal(s.round,2);assert.equal(s.code,code);assert.deepEqual([...s.members.values()].map(m=>[m.id,m.character,m.color]),identities);assert.deepEqual(s.sim.players.slice(0,3).map(p=>p.hp),[3,2,4]);
 assert.ok(s.sim.players.every(p=>p.specialGauge===0&&p.specialUntil===0));
});
