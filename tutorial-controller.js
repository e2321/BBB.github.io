import {BATTLE} from './battle-rules.js';
import {BotController} from './battle-ai.js';
export const TUTORIAL_ROUTE=[[-4.2,2.5],[-4.2,-.5],[4.2,-.5],[4.2,-4.5],[-4.2,-4.5],[-4.2,-8.5],[0,-9.5],[0,-11.2]];
export const TUTORIAL_STEPS=[
 {name:'1 / 3 ビタンビタン練習',text:'A / Dを交互に4回ビタン！ 着地でBPをゲット。',detail:'画面下の水分が減ったら、青い水たまりで回復。'},
 {name:'2 / 3 ジャンプ・包丁',text:'Spaceで1回ジャンプ。マウスで的を狙い、左クリック！',detail:'最後に最もBPが高い魚が勝者。包丁はライバルの妨害に使おう。'},
 {name:'3 / 3 コックから逃げよう',text:'一度止まって死んだふり → A / D・Spaceで起きよう。',detail:'左右の矢印をたどって出口へ！ コックはゆっくり追ってくる。'},
];
export class TutorialController{
 constructor(sim){this.sim=sim;this.reset();}
 reset(){const s=this.sim;this.phase=0;this.flops=0;this.jumped=false;this.hit=false;this.feignSeen=false;this.feignPracticed=false;this.complete=false;this.times=[0];s.tutorialPhase=0;s.practiceTarget=null;s.spawns=s.stage.spawns;this.place(s.spawns[0]);
  for(const p of s.players){if(p.id===0)continue;p.spectator=true;p.bot=false;p.dead=true;p.hp=0;p.deadUntil=Infinity;p.invUntil=Infinity;}
  for(const c of s.chefs)c.tutorialDisabled=true;
 }
 place(position){const s=this.sim,p=s.players[0];p.p={...position};p.prev={...position};p.v={x:0,y:0,z:0};p.grounded=true;p.buffer=null;p.lastJump=-10;p.jumpStart=-10;p.lastKey='';p.inputKey='';p.acceleration=0;p.feigning=false;p.still=0;p.inWater=false;p.yaw=0;p.desiredYaw=0;p.aimActive=true;p.surpriseWindows=[];}
 next(){const s=this.sim;this.phase++;s.tutorialPhase=this.phase;this.times.push(s.time);
  if(this.phase===1){this.place(s.stage.practiceStart);s.practiceTarget=s.stage.target;}
  if(this.phase===2){s.practiceTarget=null;s.arenaObstacles=s.arenaObstacles.filter(o=>o.id!=='practice-gate');s.obstacles=[...s.arenaObstacles,...s.stage.walls];s.ai=new BotController(s);this.place(s.stage.escapeStart);s.spawns=[s.stage.escapeStart,...s.spawns.slice(1)];for(const c of s.chefs){c.tutorialDisabled=false;c.target=null;c.state='CHASING';c.timer=0;c.nextAttack=s.time+3;c.nextTargetThink=0;}}
  s.emit('tutorialStep',{phase:this.phase});
 }
 consume(events){for(const e of events){if(e.id!==0)continue;if(this.phase===0&&e.type==='land'&&e.scored&&this.sim.players[0].lastKey!=='Space'){this.flops++;if(this.flops>=4)this.next();}
   else if(this.phase===1){if(e.type==='land'&&this.sim.players[0].lastKey==='Space')this.jumped=true;if(e.type==='practiceHit')this.hit=true;if(this.jumped&&this.hit)this.next();}
   else if(this.phase===2){if(e.type==='feign')this.feignSeen=true;if(e.type==='wake'&&this.feignSeen)this.feignPracticed=true;}
  }this.checkGoal();
 }
 checkGoal(){const s=this.sim,p=s.players[0],g=s.stage.goal;if(this.complete||this.phase!==2||s.state!=='PLAYING'||p.dead||!p.grounded||!this.feignPracticed)return;if(Math.hypot(p.p.x-g.x,p.p.z-g.z)<=g.radius&&Math.abs(p.p.y-BATTLE.bodyY)<.1){this.complete=true;this.times.push(s.time);s.state='FINISHED';s.emit('tutorialClear',{time:s.time});}}
 get hint(){const step=TUTORIAL_STEPS[this.phase];return {...step,progress:this.phase===0?`${this.flops} / 4 回`:this.phase===1?`${this.jumped?'✓':'□'} ジャンプ　${this.hit?'✓':'□'} 包丁命中`:this.feignPracticed?'死んだふり体験 ✓　出口へ！':'死んだふりと解除を1回体験しよう'};}
}
