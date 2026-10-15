import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleSimulation} from '../battle-simulation.js';
import {FEIGN_RULES,CHEF_RULES,BOT_RULES,FLOP_RULES,BATTLE,COUNTDOWN_RULES} from '../battle-rules.js';
import {botAttackRate} from '../battle-ai.js';

function game(stage='kitchen'){
 const s=new BattleSimulation(151,stage);s.start();for(const p of s.players)p.bot=false;
 for(const [i,p] of s.players.entries())p.p={x:12,y:.28,z:10+i};
 return s;
}
function advance(s,seconds,dt=1/60){for(let t=0;t<seconds-1e-8;t+=dt)s.step(Math.min(dt,seconds-t));}
function observed(s,fish=0){const p=s.players[fish],c=s.chefs[0];p.p={x:c.x,y:.28,z:c.z+1};s.feign(fish);s.step();s.step();assert.equal(c.state,'INSPECTING');return {p,c};}
function ready(s,fish=0){const pair=observed(s,fish);advance(s,FEIGN_RULES.inspection);assert.equal(pair.c.unguarded,true);return pair;}

test('countdown freezes all authoritative game state and accepts only cosmetic alternating A/D',()=>{
 for(const stage of ['normal','kitchen']){const s=game(stage);s.start(stage,true);const positions=s.players.map(p=>({...p.p})),chefs=s.chefs.map(c=>({x:c.x,z:c.z}));
  assert.equal(s.state,'COUNTDOWN');assert.equal(s.fire(0),false);assert.equal(s.jump(0,'Space'),false);assert.equal(s.feign(0),false);assert.equal(s.swim(0),false);
  assert.equal(s.jump(0,'A'),true);assert.equal(s.jump(0,'A'),false);advance(s,.5);assert.equal(s.jump(0,'D'),true);
  s.collectBoosts();assert.equal(s.damage(s.players[0],1),false);advance(s,2.49);
  assert.equal(s.state,'COUNTDOWN');assert.equal(s.time,0);assert.deepEqual(s.players.map(p=>p.p),positions);assert.deepEqual(s.chefs.map(c=>({x:c.x,z:c.z})),chefs);
  assert.ok(s.players.every(p=>p.water===100&&p.points===0&&p.combo===0&&p.hp===BATTLE.hp&&p.boostUntil===0&&!p.feigning));assert.ok(s.boosts.every(b=>b.active));assert.ok(s.projectiles.every(k=>!k.active));
  assert.ok(s.events.some(e=>e.type==='warmupLand'));advance(s,.01);assert.equal(s.state,'PLAYING');assert.equal(s.time,0);
  assert.deepEqual(s.events.filter(e=>e.type==='countdown').map(e=>e.value),[3,2,1,0]);assert.equal(s.events.filter(e=>e.type==='matchStart').length,1);
  assert.ok(s.players.every(p=>!p.buffer&&!p.inputKey&&p.acceleration===0&&p.slideUntil===0));s.step();assert.ok(s.time>0);assert.equal(s.jump(0,'Space'),true);assert.equal(s.players[0].water,98);
 }
});
test('three-second countdown is independent of update frequency and leaves the full ninety seconds',()=>{
 for(const dt of [1/30,1/60,1/144,.17]){const s=game();s.start('kitchen',true);advance(s,3,dt);assert.equal(s.state,'PLAYING');assert.equal(s.time,0);advance(s,90);assert.equal(s.time,90);assert.equal(s.state,'FINISHED');}
});
test('two chefs chase the closest visible live fish including a CPU and remain outside ranking',()=>{
 const s=game(),c=s.chefs[0],p=s.players[2];p.p={x:c.x,y:.28,z:c.z+4};const before={x:c.x,z:c.z};s.step();assert.equal(c.target,2);advance(s,.4);assert.ok(Math.hypot(c.x-before.x,c.z-before.z)>.3);
 const other=s.chefs[1];s.players[1].p={x:other.x,y:.28,z:other.z-4};advance(s,.35);assert.equal(other.target,1);assert.equal(s.ranking.length,4);assert.equal(s.chefs.length,2);assert.ok(s.chefs.every(c=>c.points===undefined));
});
test('chef attacks have a visible windup, one damage and a cooldown; jump, retreat and equipment can evade',()=>{
 for(const scenario of ['hit','jump','retreat','wall']){const s=game(),c=s.chefs[0],p=s.players[0];s.updateFeign=()=>{};p.p={x:c.x,y:.28,z:c.z+1};c.nextAttack=0;s.step();assert.equal(c.state,'ATTACKING');advance(s,.4);assert.equal(p.hp,BATTLE.hp);
  if(scenario==='jump'){s.jump(0,'Space');}if(scenario==='retreat')p.p.z+=3;if(scenario==='wall')s.obstacles.push({min:{x:c.x-1,y:0,z:c.z+.3},max:{x:c.x+1,y:2,z:c.z+.5}});
  advance(s,.36);assert.equal(p.hp,scenario==='hit'?BATTLE.hp-1:BATTLE.hp,scenario);if(scenario==='hit'){assert.ok(s.time-c.lastThrow<1/60);advance(s,2);assert.equal(p.hp,BATTLE.hp-1);}
 }
});
test('chef deaths use existing sashimi and unlimited four-second respawns without BP theft',()=>{
 const s=game(),c=s.chefs[0],p=s.players[0];s.updateFeign=()=>{};p.p={x:c.x,y:.28,z:c.z+1};p.points=1800;p.hp=1;c.nextAttack=0;advance(s,.8);
 assert.equal(p.dead,true);assert.equal(p.hp,0);assert.equal(p.points,1800);assert.equal(s.sashimi.length,1);assert.equal(s.events.filter(e=>e.type==='kill').length,1);assert.equal(s.events.find(e=>e.type==='kill').killer,null);
 advance(s,4);assert.equal(p.dead,false);assert.equal(p.hp,BATTLE.hp);assert.equal(p.water,100);assert.equal(p.points,1800);assert.equal(s.ranking.length,4);
});
test('feigning before a committed strike leads to inspection and can safely outlast its bonus window',()=>{
 const s=game(),c=s.chefs[0],p=s.players[0];p.p={x:c.x,y:.28,z:c.z+1};c.nextAttack=0;s.step();assert.equal(c.state,'ATTACKING');s.feign(0);advance(s,3);
 assert.equal(p.hp,BATTLE.hp);assert.equal(p.feigning,true);assert.equal(p.points,0);assert.equal(c.unguarded,false);assert.equal(c.ignoreSession,`0:${p.feignSession}`);
});
test('a late feign in front of an already committed chef does not guarantee protection',()=>{
 const s=game(),c=s.chefs[0],p=s.players[0];p.p={x:c.x,y:.28,z:c.z+1};c.nextAttack=0;s.step();advance(s,CHEF_RULES.commitTime+.02);s.feign(0);advance(s,.4);assert.equal(p.hp,BATTLE.hp-1);
});
test('surprise has a 0.8-second unguarded window and a 0.4-second release deadline at different tick rates',()=>{
 assert.equal(FEIGN_RULES.unguarded,.8);assert.equal(FEIGN_RULES.releaseWindow,.4);assert.equal(FEIGN_RULES.bonusDistance,1.5);
 for(const dt of [1/30,1/60,1/144]){const s=game(),{p,c}=ready(s);s.releaseFeign(p);advance(s,.4,dt);assert.equal(s.jump(0,'A'),true);assert.equal(p.points,500);assert.equal(c.state,'STUNNED');assert.equal(c.nextBonus,s.time+20);}
});
test('early, late, delayed or distant surprise attempts lose one thousand BP once, with zero floor',()=>{
 for(const scenario of ['early','late','delay','distance'])for(const points of [1500,250])for(const bot of [false,true]){
  const s=game(),{p,c}=scenario==='early'?observed(s):ready(s);p.points=points;
  if(scenario==='late')advance(s,FEIGN_RULES.unguarded+.02);
  if(scenario==='distance')p.p.z=c.z+1.65;
  s.releaseFeign(p);if(scenario==='delay')advance(s,FEIGN_RULES.releaseWindow+.02);
  p.bot=bot;s.jump(p.id,'A');assert.equal(p.points,Math.max(0,points-1000),scenario);assert.equal(c.state,'CHASING');assert.equal(c.target,p.id);assert.equal(c.retryUntil,s.time+4);
  s.chefController.surprise(p);assert.equal(s.events.filter(e=>e.type==='chefFail').length,1);assert.equal(s.events.filter(e=>e.type==='chefBonus').length,0);
 }
});
test('normal flops, unobserved feign, a plain release and Space escape never trigger a penalty',()=>{
 for(const scenario of ['normal','unobserved','release','space']){const s=game(),p=s.players[0];p.points=1200;
  if(scenario==='normal'){p.p={x:-9,y:.28,z:1};s.jump(0,'A');}
  if(scenario==='unobserved'){s.feign(0);s.jump(0,'A');}
  if(scenario==='release'){observed(s);s.releaseFeign(p);advance(s,.2);}
  if(scenario==='space'){observed(s);s.jump(0,'Space');}
  assert.equal(p.points,1200);assert.equal(s.events.filter(e=>e.type==='chefFail').length,0);
 }
});
test('a failed session is blocked briefly; a later fresh attempt can earn the same fixed five hundred',()=>{
 const s=game(),{p,c}=observed(s);p.points=1200;s.jump(0,'A');assert.equal(p.points,200);const retry=c.retryUntil;p.grounded=true;p.buffer=null;p.v={x:0,y:0,z:0};s.feign(0);advance(s,.2);assert.equal(c.unguarded,false);
 s.time=retry+.01;p.feigning=false;p.lastJump=-10;p.inputKey='';p.p={x:c.x,y:.28,z:c.z+1};c.target=null;c.state='CHASING';c.nextTargetThink=0;ready(s);const before=p.points;s.jump(0,'D');assert.equal(p.points-before,500);
});
test('both BBB stages recover twenty per second smoothly for every fish, clamped at one hundred',()=>{
 assert.equal(FLOP_RULES.waterRecovery,20);for(const stage of ['normal','kitchen'])for(const id of [0,1,2,3]){const s=game(stage),p=s.players[id],w=s.puddles[0];p.p={x:w.x,y:.28,z:w.z};p.water=20;s.chefs=[];advance(s,1);assert.ok(Math.abs(p.water-40)<1e-8);p.water=99;advance(s,1);assert.equal(p.water,100);assert.equal(p.points,0);}
});
test('normal and kitchen share the slightly reduced CPU cadence and efficiency',()=>{
 assert.equal(botAttackRate('normal',false),.85);assert.equal(botAttackRate('normal',true),.85);assert.equal(botAttackRate('kitchen',false),.85);assert.equal(botAttackRate('kitchen',true),.85);assert.equal(BOT_RULES.scoreEfficiency,.9);assert.equal(BOT_RULES.accelerationEfficiency,.9);
 const counts=[];for(const stage of ['normal','kitchen']){const s=game(stage),p=s.players[1],q=s.players[2];s.chefs=[];p.bot=true;p.p={x:0,y:.28,z:-6};q.p={x:1,y:.28,z:-6};p.ai.nextJump=999;p.ai.nextPrank=999;p.ai.nextFire=0;for(let i=0;i<600;i++){s.time=i/60;s.ai.update(p,1/60);}counts.push(s.events.filter(e=>e.type==='shoot').length);}assert.equal(counts[1],counts[0],JSON.stringify(counts));
});
test('CPU chooses flight or feign in response to nearby chefs without freezing all movement',()=>{
 const s=game(),p=s.players[1],c=s.chefs[0];p.bot=true;p.p={x:c.x,y:.28,z:c.z+2};p.ai.nextPrank=999;s.ai.update(p,1/60);assert.ok(p.feigning||p.ai.escapeUntil>s.time);if(!p.feigning)assert.equal(p.ai.goal,p.ai.escapeGoal);
 advance(s,8);assert.equal(p.dead,false);assert.ok(s.events.some(e=>e.type==='jump'||e.type==='feign'));
});
