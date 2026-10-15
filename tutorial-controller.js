import {BATTLE,FLOP_RULES} from './battle-rules.js';
// Archived course points remain reusable; tutorial completion no longer depends on the exit.
export const TUTORIAL_ROUTE=[[-4.2,2.5],[-4.2,-.5],[4.2,-.5],[4.2,-4.5],[-4.2,-4.5],[-4.2,-8.5],[0,-9.5],[0,-11.2]];
export const TUTORIAL_INTRO=['ここは、魚たちがビタンビタンする世界。','普通の対戦ゲームだと思った？','BBBの主役は、攻撃じゃない。','ビタンビタンだ！！'];
export const TUTORIAL_GOALS=Object.freeze({introSeconds:4.4,flops:4,recovery:15,challengeCombo:8,challengeBP:100});
export const TUTORIAL_STEPS=[
 {id:'bitan',name:'1 / 6 ビタンビタンが主役！',text:'AとDを交互に押して、ビタンビタン！',detail:'続けるほどコンボがつながる！ 着地でBPを稼ごう。'},
 {id:'water',name:'2 / 6 水分を取り戻そう',text:'ビタンビタンすると水分が減る！',detail:'マウスで青い水たまりへ向き、A / Dで進もう。入ったらキーを離して回復！'},
 {id:'tradeoff',name:'3 / 6 水たまりは万能じゃない',text:'水たまりの中で、左クリックを試そう。',detail:'回復するか、外に出て戦うか。判断が大事！'},
 {id:'attack',name:'4 / 6 攻撃はビタンビタンの妨害',text:'TPSで練習CPUを狙い、左クリック！',detail:'倒す必要はない。まずは三人称視点で狙ってみよう。'},
 {id:'jump',name:'5 / 6 ジャンプは回避の切り札',text:'水たまりの外でSpaceを押して、1回着地しよう！',detail:'ジャンプにも水分が2%必要！ ビタンビタンと使い分けよう。'},
 {id:'challenge',name:'6 / 6 BBBチャレンジ',text:'A / Dで8コンボ＆100 BP！ 倒さなくてもクリア！',detail:'大切なのは、自分がビタンビタンし続けること！ 必要なら水たまりへ。'},
];
export class TutorialController{
 constructor(sim){this.sim=sim;this.reset();}
 reset(){const s=this.sim;this.phase=-1;this.introStart=s.time;this.phaseStart=s.time;this.flops=0;this.adCombo=0;this.lastAD=-Infinity;this.lastLand=-Infinity;this.recovered=0;this.blockedTried=false;this.outsideShot=false;this.tpsShot=false;this.fpsSeen=false;this.fpsShot=false;this.fpsHit=false;this.cpuHit=false;this.jumped=false;this.challengeBP=0;this.complete=false;this.pauseCPU=false;this.view='TPS';this.times=[s.time];this.feedback='';this.feedbackUntil=0;this.previousWater=100;s.tutorialPhase='intro';s.practiceTarget=null;
  s.spawns=[s.stage.practiceStart,{x:-3,y:BATTLE.bodyY,z:9},{x:3,y:BATTLE.bodyY,z:10}];this.place(s.stage.practiceStart);
  for(const p of s.players)if(p.id!==0){p.spectator=true;p.bot=false;p.dead=true;p.hp=0;p.deadUntil=Infinity;p.invUntil=Infinity;}
  for(const c of s.chefs)c.tutorialDisabled=true;
 }
 place(position){const p=this.sim.players[0];Object.assign(p.p,position);Object.assign(p.prev,position);Object.assign(p.v,{x:0,y:0,z:0});Object.assign(p,{grounded:true,buffer:null,lastJump:-10,jumpStart:-10,lastKey:'',inputKey:'',acceleration:0,feigning:false,still:0,inWater:false,yaw:0,desiredYaw:0,aimActive:true,slideUntil:0});p.surpriseWindows=[];this.sim.updateWet(p);}
 announce(message,seconds=2){this.feedback=message;this.feedbackUntil=this.sim.time+seconds;this.sim.emit('tutorialFeedback',{message});}
 begin(){if(this.phase===-1)this.next();}
 next(){if(this.complete)return;const s=this.sim,p=s.players[0];this.phase++;s.tutorialPhase=TUTORIAL_STEPS[this.phase].id;this.phaseStart=s.time;this.times.push(s.time);p.buffer=null;p.slideUntil=0;
  if(this.phase===1){p.water=Math.min(45,p.water);this.previousWater=p.water;this.announce('水分管理の練習：水分を45%に調整しました。',3);}
  if(this.phase===3){this.view='TPS';this.clearPracticeShots();this.spawnCPU();}
  if(this.phase===5){this.challengeBP=0;this.adCombo=0;s.resetCombo(p,'tutorialChallenge');this.place(s.stage.practiceStart);this.spawnCPU();this.nextCPUAttack=s.time+4.5;}
  s.emit('tutorialStep',{phase:this.phase});
 }
 clearPracticeShots(){for(const k of this.sim.projectiles)if(k.owner===0)k.active=false;}
 spawnCPU(){const s=this.sim,q=s.players[1],position={x:2.5,y:BATTLE.bodyY,z:6.3};Object.assign(q,{spectator:false,bot:false,dead:false,hp:s.balance.hp,water:100,grounded:true,inWater:false,feigning:false,buffer:null,lastJump:-10,jumpStart:-10,lastKey:'',inputKey:'',acceleration:0,yaw:0,invUntil:s.time+.25,name:'練習CPU'});Object.assign(q.p,position);Object.assign(q.prev,position);Object.assign(q.v,{x:0,y:0,z:0});q.ai.path=[];this.cpuJump=0;this.nextCPUJump=s.time+.8;}
 beforeStep(){const s=this.sim,p=s.players[0];if(s.state!=='PLAYING'||this.complete)return;if(this.phase===-1&&s.time-this.introStart>=TUTORIAL_GOALS.introSeconds)this.begin();
  if(p.water<15){p.water=20;this.previousWater=20;this.announce('練習補助：水分を20%まで補給。青い水たまりで回復しよう。',3);}
  const q=s.players[1];if(q.spectator||q.dead||![3,5].includes(this.phase))return;q.water=Math.max(25,q.water);
  if(q.grounded&&(Math.hypot(q.p.x-2.5,q.p.z-6.3)>2.6||q.inWater)){Object.assign(q.p,{x:2.5,y:BATTLE.bodyY,z:6.3});Object.assign(q.prev,q.p);q.inWater=false;}
  // Once aiming takes a while, let the actual NPC settle instead of widening hitboxes.
  const stationary=this.phase===3&&(this.pauseCPU||this.fpsHit||s.time-this.phaseStart>8);
  if(!stationary&&q.grounded&&s.time>=this.nextCPUJump){q.yaw=this.cpuJump%2?Math.PI:0;s.jump(1,this.cpuJump%2?'D':'A');this.cpuJump++;this.nextCPUJump=s.time+.95;}
  if(this.phase===5&&!p.dead&&s.time>=(this.nextCPUAttack||0)){const o=s.muzzle(q),dx=p.p.x-o.x,dz=p.p.z-o.z,a=Math.atan2(-dx,-dz)+.20*(this.cpuJump%2?1:-1),distance=Math.hypot(dx,dz);s.fire(1,{x:-Math.sin(a),y:(p.p.y-o.y)/(distance||1),z:-Math.cos(a)});this.nextCPUAttack=s.time+4.5;}
 }
 blockedAttack(){const s=this.sim,p=s.players[0];if(s.state!=='PLAYING'||p.dead||!s.waterAt(p.p,p.inWater))return false;if(this.phase===2)this.blockedTried=true;this.announce('攻撃不可！ 水たまりの中では包丁を投げられない！',3);return true;}
 setView(value){if(!['TPS','FPS'].includes(value)||this.view===value)return;this.view=value;if(this.phase!==3)return;this.clearPracticeShots();if(value==='FPS'&&this.tpsShot){this.fpsSeen=true;this.announce('FPSに切り替わった！ 左クリックで練習CPUを狙おう。');}if(value==='TPS'&&this.fpsHit){this.announce('視点はいつでもVで切り替え！ でも主役はビタンビタンだ！！');this.next();}}
 consume(events){const s=this.sim,p=s.players[0];for(const e of [...events]){
  if(e.type==='respawn'&&e.id===0){this.place(s.stage.practiceStart);this.adCombo=0;this.announce('この段階から再開！ BPや達成済みの練習はそのまま。',3);}
  if(e.type==='comboReset'&&e.id===0)this.adCombo=0;
  if(e.type==='hit'&&e.owner===0&&e.id===1&&this.phase===3){this.cpuHit=true;if(this.view==='FPS'&&this.fpsSeen&&this.fpsShot){this.fpsHit=true;this.announce('命中！ Vでもう一度TPSへ。主役は攻撃じゃない、ビタンビタンだ！！',3);}s.players[1].hp=s.balance.hp;}
  if(e.type==='hit'&&e.id===1)s.players[1].hp=s.balance.hp;
  if(e.id!==0)continue;
  if(e.type==='score')this.lastScore={time:e.time,delta:e.delta};
  if(e.type==='shoot'){if(this.phase===2&&this.blockedTried&&!s.waterAt(p.p,p.inWater)){this.outsideShot=true;this.announce('外では攻撃できた！ 回復と妨害を使い分けよう。');this.next();}else if(this.phase===3){if(this.view==='TPS'&&!this.fpsSeen){this.tpsShot=true;this.announce('相手を狙うのが難しい？ Vで一人称視点（FPS）も使える！！',4);}if(this.view==='FPS'&&this.fpsSeen)this.fpsShot=true;}}
  if(e.type==='jump'&&this.phase===4&&e.key==='Space')this.jumpCost=e.cost;
  if(e.type!=='land'||e.time<=this.lastLand)continue;this.lastLand=e.time;
  if(e.scored&&['A','D'].includes(e.key)){this.adCombo=(e.time-this.lastAD<=FLOP_RULES.comboWindow+1e-7?this.adCombo:0)+1;this.lastAD=e.time;this.flops++;if(this.phase===0&&this.adCombo>=TUTORIAL_GOALS.flops)this.next();else if(this.phase===5){if(this.lastScore?.time===e.time)this.challengeBP+=this.lastScore.delta;this.checkGoal();}}
  else this.adCombo=0;
  if(this.phase===4&&e.key==='Space'&&e.scored){this.jumped=true;this.announce(`ジャンプ成功！ 水分を${this.jumpCost??FLOP_RULES.spaceWaterCost}%使った。次はビタンビタンだ！`,3);this.next();}
 }
 if(this.phase===1){if(p.inWater&&p.water>this.previousWater)this.recovered+=p.water-this.previousWater;this.previousWater=p.water;if(this.recovered>=TUTORIAL_GOALS.recovery-1e-7){this.announce('水分が回復した！ でも、水たまりは万能じゃない。',3);this.next();}}
 this.checkGoal();}
 checkGoal(){const s=this.sim,p=s.players[0];if(!this.complete&&this.phase===5&&s.state==='PLAYING'&&!p.dead&&p.grounded&&!p.inWater&&this.adCombo>=TUTORIAL_GOALS.challengeCombo&&this.challengeBP>=TUTORIAL_GOALS.challengeBP){this.complete=true;s.state='FINISHED';this.times.push(s.time);for(const k of s.projectiles)k.active=false;s.emit('tutorialClear',{time:s.time});}}
 retry(){if(this.complete||!['PLAYING','PAUSED'].includes(this.sim.state)||this.sim.players[0].dead)return;const p=this.sim.players[0];this.place(this.sim.stage.practiceStart);this.sim.resetCombo(p,'tutorialRetry');this.adCombo=0;this.announce('練習位置へ戻った！ この段階から続けよう。');}
 repeatHelp(){this.announce(this.hint.detail,4);}
 get hint(){const s=this.sim,p=s.players[0];if(this.phase===-1)return {name:'BBB / FIRST BITAN',text:TUTORIAL_INTRO[Math.min(3,Math.floor((s.time-this.introStart)/1.1))],detail:'A / Dを押すと、すぐにビタンビタン練習へ！',progress:'攻撃じゃない。ビタンビタンが主役だ。'};const step=TUTORIAL_STEPS[this.phase];let text=step.text,detail=step.detail,progress='';
  if(this.phase===0)progress=`A → D → A → D　${Math.min(this.adCombo,4)} / 4 コンボ`;
  if(this.phase===1)progress=`水分回復 ${Math.min(15,this.recovered).toFixed(0)} / 15%（毎秒${this.sim.flopRules.waterRecovery}%）`;
  if(this.phase===2){text=this.blockedTried?'水たまりの外へ出て、もう一度左クリック！':step.text;detail=this.blockedTried?'中では攻撃できない！ マウスで外へ向き、A / Dで出よう。':step.detail;progress=this.blockedTried?'✓ 水中で攻撃不可を体験　□ 外で攻撃':'□ 水たまりの中で左クリック';}
  if(this.phase===3){if(this.fpsHit){text='Vで三人称視点（TPS）へ戻してみよう！';detail='でも忘れるな！ BBBの主役は攻撃じゃない！ ビタンビタンだ！！';}else if(!this.tpsShot){text=this.view==='TPS'?step.text:'まずVでTPSに戻り、練習CPUを狙おう。';}else if(!this.fpsSeen){text='相手を狙うのが難しい？ Vで一人称視点（FPS）！！';detail='狙いやすい視点に切り替えてみよう！';}else{text=this.view==='FPS'?'FPSで練習CPUに1回当てよう！ 左クリックで攻撃。':'VでFPSへ戻り、練習CPUを狙ってみよう。';detail=s.time-this.phaseStart>8?'練習CPUは静止中。倒さなくてOK。狙うときだけFPSも便利！':'狙いはマウスで調整。攻撃は相手のビタンビタンを邪魔する手段！';}progress=`${this.tpsShot?'✓':'□'} TPSで狙う　${this.fpsSeen?'✓':'□'} VでFPS　${this.fpsHit?'✓':'□'} 命中　${this.fpsHit&&this.view==='TPS'?'✓':'□'} TPSへ戻す`;}
  if(this.phase===4)progress=p.inWater?'まずは水たまりの外へ！':'Space → 着地で成功（消費2%）';
  if(this.phase===5)progress=`${Math.min(this.adCombo,8)} / 8 コンボ　${this.challengeBP} / 100 BP（この挑戦で獲得）`;
  return {...step,text,detail,progress};}
}
