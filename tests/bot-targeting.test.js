import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleSimulation} from '../battle-simulation.js';
import {BOT_TARGET_RULES,BOT_CLOSE_AIM,BOT_COMBO_RULES} from '../battle-rules.js';
import {BOT_PREDICTIVE_SHOT_RATE,botAttackRate} from '../battle-ai.js';
import {Session} from '../server/src/session.js';
function setup(stage='normal'){
 const s=new BattleSimulation(19,stage);s.start();s.obstacles=[];s.chefs.forEach(c=>c.tutorialDisabled=true);
 for(const [i,p] of s.players.entries()){Object.assign(p,{p:{x:0,y:.28,z:0},v:{x:0,y:0,z:0},bot:i===1,points:0,invUntil:0});p.ai.nextJump=Infinity;p.ai.nextFire=Infinity;}
 s.players[0].p.x=5;s.players[2].p.z=5;s.players[3].dead=true;
 return s;
}
test('equal distance modestly favors the BP leader, whether human or CPU, in both stages',()=>{
 for(const stage of ['normal','kitchen'])for(const leaderId of [0,2]){const s=setup(stage),p=s.players[1],leader=s.players[leaderId];leader.points=100;leader.bot=leaderId===2;assert.equal(s.ai.selectAttackTarget(p),leader);assert.equal(p.ai.target,leaderId);}
 assert.equal(BOT_TARGET_RULES.leaderBonus,.12);
});
test('nearby available rivals beat distant, occluded or out-of-range leaders',()=>{
 for(const mode of ['far','wall','range']){const s=setup(),p=s.players[1];s.players[0].points=100;
  if(mode==='far'){s.players[0].p.x=15;s.players[2].p.z=3;}
  if(mode==='wall')s.obstacles=[{min:{x:2,y:0,z:-1},max:{x:3,y:3,z:1}}];
  if(mode==='range')s.players[0].p.x=26;
  assert.equal(s.ai.selectAttackTarget(p).id,2,mode);
 }
});
test('other CPUs already targeting a leader encourage a similarly reachable alternative',()=>{
 const s=setup(),p=s.players[1],other=s.players[2];s.players[0].points=100;
 assert.equal(s.ai.selectAttackTarget(p).id,0);p.ai.target=null;p.ai.nextTargetDecision=0;
 other.bot=true;other.ai.target=0;other.ai.seen=true;
 assert.equal(s.ai.selectAttackTarget(p).id,2);
});
test('ranking changes do not cause twitchy switching, but clearly better opportunities can break a hold',()=>{
 const s=setup(),p=s.players[1];s.players[0].points=100;s.ai.selectAttackTarget(p);
 s.time=.8;s.players[2].points=200;assert.equal(s.ai.selectAttackTarget(p).id,0);
 s.time=p.ai.nextTargetDecision+.001;s.players[2].p.z=1;assert.equal(s.ai.selectAttackTarget(p).id,2);
});
test('death, loss of sight and range force reselection before the target hold expires',()=>{
 for(const mode of ['death','wall','range','spectator','invincible']){const s=setup(),p=s.players[1],q=s.players[0];q.points=100;s.ai.selectAttackTarget(p);s.time=.01;
  if(mode==='death')q.dead=true;if(mode==='spectator')q.spectator=true;if(mode==='invincible')q.invUntil=2;
  if(mode==='range')q.p.x=26;if(mode==='wall')s.obstacles=[{min:{x:2,y:0,z:-1},max:{x:3,y:3,z:1}}];
  assert.equal(s.ai.selectAttackTarget(p).id,2,mode);
 }
 const s=setup(),p=s.players[1];for(const q of s.players)if(q!==p)q.dead=true;assert.equal(s.ai.selectAttackTarget(p),null);assert.equal(p.ai.seen,false);
});
test('CPU decisions are staggered and a stable valid target is not reconsidered on every update',()=>{
 const s=setup(),a=s.players[1],b=s.players[2];b.bot=true;s.ai.selectAttackTarget(a);s.ai.selectAttackTarget(b);
 assert.notEqual(a.ai.nextTargetDecision,b.ai.nextTargetDecision);assert.notEqual(a.ai.targetHoldUntil,b.ai.targetHoldUntil);
 const seed=s.seed,next=a.ai.nextTargetDecision;s.time=.01;s.ai.selectAttackTarget(a);assert.equal(s.seed,seed);assert.equal(a.ai.nextTargetDecision,next);
});
test('leader selection never changes refill/navigation priorities or attack and prediction settings',()=>{
 for(const stage of ['normal','kitchen']){const s=setup(stage),p=s.players[1];s.players[0].points=100;p.water=10;s.ai.update(p,1/60);assert.equal(p.ai.refilling,true);assert.equal(p.ai.goal,p.ai.waterTarget);assert.equal(p.ai.state,'REFILL');
  p.water=100;p.combo=30;p.lastComboLanding=s.time;p.ai.nextThink=0;s.ai.update(p,1/60);assert.equal(p.ai.refilling,false);assert.equal(p.ai.goal,p.ai.boost?.p||p.ai.pointGoal);assert.equal(p.ai.state,'SCORE');assert.equal(p.combo,30);
 }
 assert.equal(BOT_PREDICTIVE_SHOT_RATE,1/3);assert.equal(botAttackRate(),.85);assert.equal(BOT_CLOSE_AIM.yawError,.65);assert.equal(BOT_COMBO_RULES.continueChance,.9);
});
test('server CPU and solo use identical leader selection, including CPU leaders and spectator exclusion',()=>{
 const r=new Session('ABC234');r.add('a','A');r.ready('a',true);r.start('a');for(let i=0;i<180;i++)r.step();const offline=setup();
 for(const s of [offline,r.sim]){s.obstacles=[];for(const [i,p] of s.players.entries()){Object.assign(p,{p:{x:0,y:.28,z:i===0?5:i===2?-5:0},points:i===2?100:0,bot:i>0,dead:i===3,invUntil:0});p.ai.target=null;p.ai.seen=false;p.ai.nextTargetDecision=0;}
  assert.equal(s.ai.selectAttackTarget(s.players[1]).id,2);s.players[2].spectator=true;assert.equal(s.ai.selectAttackTarget(s.players[1]).id,0);
 }
});
test('three CPUs spread their targets instead of staying unanimously locked on a reachable leader',()=>{
 for(const stage of ['normal','kitchen']){const s=setup(stage);s.players[0].p={x:5,y:.28,z:0};s.players[0].points=100;
  Object.assign(s.players[2],{bot:true,p:{x:-2,y:.28,z:4}});Object.assign(s.players[3],{dead:false,bot:true,p:{x:-2,y:.28,z:-4}});
  for(let i=0;i<40;i++){s.time=i*.2;for(const p of s.players.slice(1))s.ai.selectAttackTarget(p);const targets=s.players.slice(1).map(p=>p.ai.target);assert.ok(targets.includes(0),'leader remains a candidate');assert.ok(targets.some(id=>id!==0),'available alternatives prevent unanimous focus');}
 }
});
