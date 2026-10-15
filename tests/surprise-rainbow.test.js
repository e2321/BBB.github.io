import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleSimulation} from '../battle-simulation.js';
import {Session} from '../server/src/session.js';
import {FEIGN_RULES,FLOP_RULES,NORMAL_FLOP_SPEED,RAINBOW_FLOP_SPEED} from '../battle-rules.js';
const step=(s,time,dt=1/60)=>{for(let t=0;t<time-1e-8;t+=dt)s.step(Math.min(dt,time-t));};
function game(){const s=new BattleSimulation(145,'kitchen');s.start();for(const p of s.players){p.bot=false;p.p={x:12,y:.28,z:11};}return s;}
function ready(s,id=0,chef=0){const p=s.players[id],c=s.chefs[chef];Object.assign(p,{p:{x:c.x,y:.28,z:c.z+1},v:{x:0,y:0,z:0},dead:false,hp:4,grounded:true,feigning:false,still:0,buffer:null,lastJump:-10,inputKey:'',inputTime:-10});s.feign(id);for(let i=0;i<300&&!c.unguarded;i++)s.step();assert.equal(c.unguarded,true);assert.equal(c.target,id);return {p,c};}
test('a real surprise launch awards 1000 once and applies rainbow speed and half cost immediately for fish, squid and CPU',()=>{
 for(const character of ['fish','squid'])for(const bot of [false,true]){const s=game(),{p,c}=ready(s);p.character=character;p.bot=bot;p.points=123;p.water=100;
  assert.equal(s.jump(p.id,'A'),true);assert.equal(p.points,1123);assert.equal(p.combo,50);assert.equal(p.multiplier,3);assert.equal(p.lastComboLanding,s.time);assert.equal(p.water,99.5);assert.equal(p.jumpAnimationSpeed,NORMAL_FLOP_SPEED*RAINBOW_FLOP_SPEED);assert.equal(c.rewardUntil[p.id],s.time+20);assert.equal(c.state,'CHASING');
  assert.equal(s.events.filter(e=>e.type==='chefBonus').length,1);assert.equal(s.events.filter(e=>e.type==='rainbow').length,1);s.chefController.surprise(p);assert.equal(p.points,1123);assert.equal(p.combo,50);
  p.bot=false;for(let i=0;i<60&&!p.grounded;i++)s.step();assert.equal(p.points,1173);assert.equal(p.combo,51);assert.equal(s.events.filter(e=>e.type==='score').length,1);assert.equal(s.events.filter(e=>e.type==='rainbow').length,1);
 }
});
test('existing rainbow is neither lowered nor replayed or artificially refreshed by the bonus',()=>{
 const s=game(),{p}=ready(s);Object.assign(p,{combo:67,multiplier:3,lastComboLanding:s.time-.2});const last=p.lastComboLanding;s.events=[];
 s.jump(0,'A');assert.equal(p.points,1000);assert.equal(p.combo,67);assert.equal(p.lastComboLanding,last);assert.equal(s.events.filter(e=>e.type==='rainbow').length,0);assert.equal(s.events.filter(e=>e.type==='chefBonus').length,1);
});
test('surprise rainbow uses the normal timeout and water recovery/reset rules',()=>{
 for(const mode of ['timeout','water']){const s=game(),{p}=ready(s);s.jump(0,'A');
  if(mode==='timeout'){s.updateFeign=()=>{};step(s,FLOP_RULES.comboWindow+.8);assert.equal(p.combo,0);assert.ok(s.events.some(e=>e.type==='comboReset'&&e.reason==='timeout'));}
  else{const w=s.puddles[0];p.water=20;Object.assign(p.p,{x:w.x,y:.28,z:w.z});s.updateWet(p);assert.equal(p.water,70);assert.equal(p.combo,0);s.updateWet(p);assert.equal(p.water,70);assert.equal(s.events.filter(e=>e.type==='rainbowWater').length,1);}
 }
});
test('a second fish can earn from the same chef during the first fish cooldown; cooldown persists per pair',()=>{
 const s=game(),first=ready(s);s.jump(0,'A');const until=first.c.rewardUntil[0];first.p.p={x:12,y:.28,z:12};
 const second=ready(s,1);s.jump(1,'A');assert.equal(second.p.points,1000);assert.equal(first.c.rewardUntil[0],until);assert.ok(s.time<until);assert.equal(s.events.filter(e=>e.type==='chefBonus').length,2);
 const firstPoints=first.p.points;first.p.combo=0;first.p.surpriseWindows=[{chef:first.c.id,session:first.p.feignSession,valid:true,until:s.time+1,expires:s.time+1}];s.chefController.surprise(first.p,'D');assert.equal(first.p.points,firstPoints);assert.equal(first.p.combo,0);assert.equal(s.events.filter(e=>e.type==='chefBonus').length,2);
 s.time=until+.01;second.p.p={x:12,y:.28,z:12};const again=ready(s);const before=again.p.points;s.jump(0,'D');assert.equal(again.p.points-before,1000);assert.equal(again.p.combo,50);
});
test('successful surprise does not stun or delay the chef attack timer',()=>{
 const s=game(),{p,c}=ready(s);c.nextAttack=0;s.jump(0,'A');assert.equal(c.state,'CHASING');assert.equal(c.nextAttack,0);assert.equal(c.stunUntil,undefined);assert.equal(c.surpriseAt,s.time);
 Object.assign(p,{p:{x:c.x,y:.28,z:c.z+1},grounded:true,v:{x:0,y:0,z:0},scoringJump:false,invUntil:0});s.updateFeign=()=>{};s.step();assert.equal(c.state,'ATTACKING');step(s,.8);assert.equal(p.hp,3);
});
test('normal stage cannot grant a surprise bonus and new matches clear pair cooldowns',()=>{
 const s=game(),{c}=ready(s);s.jump(0,'A');assert.ok(c.rewardUntil[0]>0);s.start();assert.deepEqual(s.chefs[0].rewardUntil,{});assert.deepEqual(s.chefs[0].attemptSessions,{});
 s.start('normal');const p=s.players[0];p.surpriseWindows=[{chef:0,session:0,valid:true,until:1,expires:1}];s.chefController.surprise(p,'A');assert.equal(p.points,0);assert.equal(p.combo,0);assert.equal(s.chefs.length,0);
});
test('server-owned shared simulation snapshots carry the authoritative reward, combo and one-time events',()=>{
 const room=new Session('ABC234');room.add('a','A');room.ready('a',true);room.start('a');room.sim=game();const {p}=ready(room.sim);room.sim.jump(p.id,'A');
 const snapshot=room.snapshot();assert.equal(snapshot.players[0].points,1000);assert.equal(snapshot.players[0].combo,50);assert.equal(snapshot.players[0].water,99.5);assert.equal(snapshot.events.filter(e=>e.type==='chefBonus').length,1);assert.equal(snapshot.events.filter(e=>e.type==='rainbow').length,1);assert.equal(room.snapshot().events.length,0);
 // Kitchen is not exposed by the online lobby; this verifies the shared authority path only.
});
