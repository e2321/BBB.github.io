import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BattleSimulation} from '../battle-simulation.js';
import {BOT_RULES,FLOP_RULES,BATTLE,movementStrength} from '../battle-rules.js';
import {movementStrength as historicalStrength} from '../backups/before-kitchen-balance/battle-rules.js';

test('gentle movement curve exactly matches the saved pre-weakening code throughout 0 to 100',()=>{
 for(let water=0;water<=100;water+=.1)assert.equal(movementStrength(water),historicalStrength(water));
 assert.equal(movementStrength(30),.9);assert.equal(movementStrength(0),.6);assert.equal(movementStrength(100),1);
});
test('CPU is modestly reduced from saved historical cadence, aim and turning',()=>{
 const source=readFileSync(new URL('../backups/before-kitchen-balance/battle-ai.js',import.meta.url),'utf8');
 for(const fragment of ['s.time+.16','-3.0*dt,3.0*dt','s.time+.13+p.id*.035+s.random()*.045','(s.random()-.5)*.09','(s.random()-.5)*.06','s.time+BATTLE.fireInterval+s.random()*.18','p.water<45'])assert.ok(source.includes(fragment),fragment);
 assert.deepEqual(BOT_RULES,{accelerationEfficiency:.9,scoreEfficiency:.9,thinkInterval:.2,attackRate:.85,aimError:.12,pitchError:.08,jumpInterval:.15,jumpJitter:.045,turnSpeed:2.8,refillThreshold:45});
});
test('both stages share flat one-percent flops and two-percent Space while all combo multipliers remain',()=>{
 for(const stage of ['normal','kitchen'])for(const bot of [false,true])for(const combo of [0,2,4,6,9,19,29])for(const key of ['A','Space']){
  const s=new BattleSimulation(23,stage);s.start();const p=s.players[0];p.bot=bot;p.p={x:0,y:.28,z:-6};p.combo=combo;p.lastComboLanding=0;
  s.jump(0,key);assert.equal(p.water,key==='Space'?98:99);assert.equal(p.points,0);p.grounded=true;s.scoreLanding(p);const multiplier=p.combo>=30?3:p.combo>=20?2.5:p.combo>=10?2:p.combo>=5?1.5:1;assert.equal(p.points,Math.round(10*multiplier*(bot?.9:1)));
 }
 assert.equal(FLOP_RULES.waterRecovery,10);
});
test('CPU acceleration and scoring are mildly weaker while human movement stays unchanged',()=>{
 for(const stage of ['normal','kitchen'])for(const water of [0,30,100]){
  const result=[];for(const bot of [false,true]){const s=new BattleSimulation(23,stage);s.start();const p=s.players[0];p.p={x:0,y:.28,z:-6};p.bot=bot;p.water=water;s.jump(0,'A');s.time=.1;p.grounded=true;p.lastJump=-10;s.jump(0,'D');p.grounded=true;s.scoreLanding(p);result.push({acceleration:p.acceleration,speed:Math.hypot(p.v.x,p.v.z),period:p.jumpPeriod,points:p.points});}
  assert.ok(result[1].acceleration<result[0].acceleration);assert.ok(result[1].speed<=result[0].speed);assert.equal(result[1].points,water<10?0:9);assert.equal(result[0].points,water<10?0:10);assert.ok(result[0].acceleration>0);
 }
 assert.equal(BATTLE.jumpDistance,1.2);assert.equal(BATTLE.fireInterval,.6);
});
