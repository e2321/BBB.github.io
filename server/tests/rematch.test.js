import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
const make=n=>{const s=new Session('ABC234');for(let i=0;i<n;i++)s.add(`u${i}`,`Name${i}`);return s;};
const ready=s=>{for(const m of s.members.values())s.ready(m.id,true);};
const finish=s=>{for(let i=0;i<5580;i++)s.step();assert.equal(s.phase,'RESULT');assert.equal(s.sim.state,'FINISHED');};
test('two and four humans play three rounds in one room with stable names and colors and full reset',()=>{
 for(const n of [2,4]){const s=make(n);ready(s);s.start('u0');const identity=s.lobby().players.map(p=>[p.id,p.name,p.color,p.slot]);
  for(let round=1;round<=3;round++){assert.equal(s.round,round);assert.equal(s.sim.time,0);assert.equal(s.sim.state,'COUNTDOWN');assert.ok(s.sim.players.every(p=>p.points===0&&p.combo===0&&p.kills===0&&p.water===100&&p.hp===3&&!p.dead&&p.boostUntil===0));assert.equal(s.sim.hearts,undefined);assert.ok(s.sim.boosts.every(i=>i.active&&i.respawnAt===0));assert.equal(s.sim.sashimi.length,0);assert.deepEqual(s.lobby().players.map(p=>[p.id,p.name,p.color,p.slot]),identity);
   finish(s);const results=s.snapshot().result;assert.deepEqual(results,s.snapshot().result);assert.equal(results.length,4);assert.equal(s.code,'ABC234');
   if(round<3){for(let i=0;i<n;i++){assert.equal(s.requestRematch(`u${i}`,true,round),true);assert.equal(s.phase,i===n-1?'MATCH':'REMATCH');}assert.equal(s.requestRematch('u0',true,round),false);}
  }
 }
});
test('CPU toggle is host-only, lobby-only, shared and no empty-slot AI/scoring/items remain',()=>{
 for(const n of [1,2,3,4])for(const fill of [true,false]){const s=make(n);assert.equal(s.setCpu('unknown',false),false);if(!fill)assert.equal(s.setCpu('u0',false),true);ready(s);assert.equal(s.start('u0'),true);assert.equal(s.setCpu('u0',!fill),false);assert.equal(s.sim.players.filter(p=>p.bot).length,fill?4-n:0);assert.equal(s.sim.ranking.length,fill?4:n);assert.equal(s.snapshot().fillCpu,fill);let updates=0;const original=s.sim.ai.update.bind(s.sim.ai);s.sim.ai.update=(...args)=>{updates++;return original(...args);};finish(s);assert.equal(updates>0,fill&&n<4);assert.equal(s.sim.result.length,fill?4:n);assert.ok(s.sim.players.filter(p=>p.spectator).every(p=>p.points===0&&p.hp===0&&p.dead));
  assert.equal(s.backToLobby('u0',s.round),true);assert.equal(s.setCpu('u0',!fill),true);ready(s);s.start('u0');assert.equal(s.sim.players.filter(p=>p.bot).length,!fill?4-n:0);assert.equal(s.sim.ranking.length,!fill?4:n);
 }
});
test('leaving results migrates host, clears votes and keeps survivors and room code',()=>{
 const s=make(3);ready(s);s.start('u0');finish(s);s.requestRematch('u1',true,1);s.remove('u0');assert.equal(s.host,'u1');assert.equal(s.code,'ABC234');assert.equal(s.phase,'RESULT');assert.ok([...s.members.values()].every(m=>!m.rematch));assert.equal(s.backToLobby('u2',1),false);assert.equal(s.backToLobby('u1',1),true);s.setCpu('u1',false);ready(s);s.start('u1');assert.equal(s.sim.ranking.length,2);assert.equal(s.sim.players[0].spectator,true);
 assert.equal(s.input('u1',{round:1,phase:'COUNTDOWN',seq:1,kind:'flop',key:'A'}),false);assert.equal(s.input('u1',{round:2,phase:'COUNTDOWN',seq:1,kind:'flop',key:'A'}),true);
});
test('disconnect and rejoin during rematch clears votes without changing identity or freezing peers',()=>{
 const s=make(2);ready(s);s.start('u0');finish(s);const color=s.members.get('u0').color;s.requestRematch('u0',true,1);s.connection('u0',false);assert.equal(s.phase,'RESULT');assert.equal(s.host,'u1');assert.ok([...s.members.values()].every(m=>!m.rematch));s.connection('u0',true);assert.equal(s.members.get('u0').color,color);s.requestRematch('u0',true,1);s.requestRematch('u1',true,1);assert.equal(s.round,2);
});
