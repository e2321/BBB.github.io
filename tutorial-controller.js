import {BATTLE,FLOP_RULES,RAINBOW_WATER_COST_MULTIPLIER} from './battle-rules.js';
// Archived course points remain reusable; tutorial completion no longer depends on the exit.
export const TUTORIAL_ROUTE=[[-4.2,2.5],[-4.2,-.5],[4.2,-.5],[4.2,-4.5],[-4.2,-4.5],[-4.2,-8.5],[0,-9.5],[0,-11.2]];
export const TUTORIAL_INTRO=['ここは、魚たちがビタンビタンする世界。','普通の対戦ゲームだと思った？','BBBの主役は、攻撃じゃない。','ビタンビタンだ！！'];
export const TUTORIAL_GOALS=Object.freeze({introSeconds:4.4,flops:4,recovery:15,challengeCombo:30,challengeBP:100});
export const TUTORIAL_STEPS=[
 {id:'bitan',name:'1 / 5 ビタンビタンが主役！',text:'AとDを交互に押して、ビタンビタン！',detail:'続けるほどコンボがつながる！ 50コンボで虹色状態に突入、1回50 BPのチャンス！'},
 {id:'water',name:'2 / 5 水分を取り戻そう',text:'ビタンビタンすると水分が減る！',detail:'マウスで青い水たまりへ向き、A / Dで進もう。入ったらキーを離して回復！ 虹色のうちに入ると+50ポイント（30%→80%、最大100%）。水中でコンボは終了。'},
 {id:'tradeoff',name:'3 / 5 水たまりは万能じゃない',text:'水たまりの中で、左クリックを試そう。',detail:'回復するか、外に出て戦うか。判断が大事！'},
 {id:'attack',name:'4 / 5 攻撃はビタンビタンの妨害',text:'TPSで練習CPUを狙い、左クリック！',detail:'倒す必要はない。まずは三人称視点で狙ってみよう。'},
 null, // Reserved legacy phase ID; independent jump practice has been removed.
 {id:'challenge',name:'5 / 7 BBBチャレンジ',text:'A / Dで30コンボ＆100 BP！ 倒さなくてもクリア！',detail:'大切なのは、自分がビタンビタンし続けること！ 必要なら水たまりへ。'},
 {id:'surprise',name:'6 / 7 コックをだまそう',text:'止まって死んだふり。「今だ！」でA / D！',detail:'コックが確認して油断するまで待とう。奇襲成功で+1000 BP＆50コンボ！'},
 {id:'rainbowWater',name:'7 / 7 虹色で水たまりへ',text:'虹色のまま、青い水たまりへ！',detail:'通常は50コンボで虹色！ 1回50 BP・アニメ約1.5倍・水分消費0.6。水たまりで+50ポイント回復！ 練習中は虹色を維持します。'},
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
 next(){if(this.complete)return;const s=this.sim,p=s.players[0];this.phase++;if(this.phase===4)this.phase=5;s.tutorialPhase=TUTORIAL_STEPS[this.phase].id;this.phaseStart=s.time;this.times.push(s.time);p.buffer=null;p.slideUntil=0;
  if(this.phase===1){p.water=Math.min(45,p.water);this.previousWater=p.water;this.announce('水分管理の練習：水分を45%に調整しました。',3);}
  if(this.phase===3){this.view='TPS';this.clearPracticeShots();this.spawnCPU();}
  if(this.phase===5){this.challengeBP=0;this.adCombo=0;s.resetCombo(p,'tutorialChallenge');this.place(s.stage.practiceStart);this.spawnCPU();this.nextCPUAttack=s.time+4.5;}
  if(this.phase===6){this.place({x:-1,y:BATTLE.bodyY,z:7});this.adCombo=0;for(const q of s.players)if(q.id!==0){q.spectator=true;q.dead=true;}const c=s.chefs[0];Object.assign(c,{x:0,z:7,y:0,tutorialDisabled:false,target:null,question:0,state:'CHASING',timer:0,nextAttack:s.time+2,observedSession:null});this.announce('コックが近づいてきた！ 止まって死んだふり。今だ！の合図でビタン！',4);}
  if(this.phase===7){p.water=30;p.combo=Math.max(50,p.combo);p.lastComboLanding=s.time;p.rainbowWaterUsed=false;for(const c of s.chefs)c.tutorialDisabled=true;this.announce('大成功！ 水分を30%に調整。虹色のまま水たまりで80%へ回復しよう！',4);}
  s.emit('tutorialStep',{phase:this.phase});
 }
 clearPracticeShots(){for(const k of this.sim.projectiles)if(k.owner===0)k.active=false;}
 spawnCPU(){const s=this.sim,q=s.players[1],position={x:2.5,y:BATTLE.bodyY,z:6.3};Object.assign(q,{spectator:false,bot:false,dead:false,hp:s.balance.hp,water:100,grounded:true,inWater:false,feigning:false,buffer:null,lastJump:-10,jumpStart:-10,lastKey:'',inputKey:'',acceleration:0,yaw:0,invUntil:s.time+.25,name:'練習CPU'});Object.assign(q.p,position);Object.assign(q.prev,position);Object.assign(q.v,{x:0,y:0,z:0});q.ai.path=[];this.cpuJump=0;this.nextCPUJump=s.time+.8;}
 beforeStep(){const s=this.sim,p=s.players[0];if(s.state!=='PLAYING'||this.complete)return;if(this.phase===-1&&s.time-this.introStart>=TUTORIAL_GOALS.introSeconds)this.begin();
  if(p.water<15){p.water=20;this.previousWater=20;this.announce('練習補助：水分を20%まで補給。青い水たまりで回復しよう。',3);}
  if(this.phase===6){const chef=s.chefs[0];if(p.dead){p.deadUntil=Math.min(p.deadUntil,s.time+.5);}else {p.invUntil=s.time+.1;if(chef?.ignoreSession===`${p.id}:${p.feignSession}`&&s.time>=(chef.dismissedUntil||0)){s.releaseFeign(p);p.still=0;chef.ignoreSession=null;}}}
  if(this.phase===7){p.combo=Math.max(50,p.combo);p.lastComboLanding=s.time;} // Tutorial reading assistance only; normal matches keep the existing timeout.
  if(this.phase===6&&this.mobile){const c=s.chefs[0];if(c?.unguarded&&p.feigning)s.jump(0,p.inputKey==='A'?'D':'A');}
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
  if(this.phase===6&&e.type==='chefBonus'&&e.id===0){this.next();continue;}
  if(this.phase===7&&e.type==='rainbowWater'&&e.id===0&&e.amount===50){this.complete=true;s.state='FINISHED';this.times.push(s.time);for(const k of s.projectiles)k.active=false;s.emit('tutorialClear',{time:s.time});continue;}
  if(e.type==='respawn'&&e.id===0){this.place(s.stage.practiceStart);this.adCombo=0;this.announce('この段階から再開！ BPや達成済みの練習はそのまま。',3);}
  if(e.type==='comboReset'&&e.id===0)this.adCombo=0;
  if(e.type==='hit'&&e.owner===0&&e.id===1&&this.phase===3){this.cpuHit=true;if(this.view==='FPS'&&this.fpsSeen&&this.fpsShot){this.fpsHit=true;this.announce('命中！ Vでもう一度TPSへ。主役は攻撃じゃない、ビタンビタンだ！！',3);}s.players[1].hp=s.balance.hp;}
  if(e.type==='hit'&&e.id===1)s.players[1].hp=s.balance.hp;
  if(e.id!==0)continue;
  if(e.type==='score')this.lastScore={time:e.time,delta:e.delta};
  if(e.type==='shoot'){if(this.phase===2&&this.blockedTried&&!s.waterAt(p.p,p.inWater)){this.outsideShot=true;this.announce('外では攻撃できた！ 回復と妨害を使い分けよう。');this.next();}else if(this.phase===3){if(this.view==='TPS'&&!this.fpsSeen){this.tpsShot=true;this.announce('相手を狙うのが難しい？ Vで一人称視点（FPS）も使える！！',4);}if(this.view==='FPS'&&this.fpsSeen)this.fpsShot=true;}}
  if(e.type!=='land'||e.time<=this.lastLand)continue;this.lastLand=e.time;
  if(e.scored&&['A','D'].includes(e.key)){this.adCombo=(e.time-this.lastAD<=FLOP_RULES.comboWindow+1e-7?this.adCombo:0)+1;this.lastAD=e.time;this.flops++;if(this.phase===0&&this.adCombo>=TUTORIAL_GOALS.flops)this.next();else if(this.phase===5){if(this.lastScore?.time===e.time)this.challengeBP+=this.lastScore.delta;this.checkGoal();}}
  else this.adCombo=0;
 }
 if(this.phase===1){if(p.inWater&&p.water>this.previousWater)this.recovered+=p.water-this.previousWater;this.previousWater=p.water;if(this.recovered>=TUTORIAL_GOALS.recovery-1e-7){this.announce('水分が回復した！ でも、水たまりは万能じゃない。',3);this.next();}}
 this.checkGoal();}
 checkGoal(){const s=this.sim,p=s.players[0];if(!this.complete&&this.phase===5&&s.state==='PLAYING'&&!p.dead&&p.grounded&&!p.inWater&&this.adCombo>=TUTORIAL_GOALS.challengeCombo&&this.challengeBP>=TUTORIAL_GOALS.challengeBP){this.announce('30コンボ達成！ 次はコックへの奇襲を体験しよう！');this.next();}}
 retry(){if(this.complete||!['PLAYING','PAUSED'].includes(this.sim.state)||this.sim.players[0].dead)return;const p=this.sim.players[0];this.place(this.sim.stage.practiceStart);this.sim.resetCombo(p,'tutorialRetry');this.adCombo=0;this.announce('練習位置へ戻った！ この段階から続けよう。');}
 repeatHelp(){this.announce(this.hint.detail,4);}
 get hint(){const s=this.sim,p=s.players[0];if(this.phase===-1)return {name:'BBB / FIRST BITAN',text:TUTORIAL_INTRO[Math.min(3,Math.floor((s.time-this.introStart)/1.1))],detail:'A / Dを押すと、すぐにビタンビタン練習へ！',progress:'攻撃じゃない。ビタンビタンが主役だ。'};const step=TUTORIAL_STEPS[this.phase];let text=step.text,detail=step.detail,progress='';
  if(this.phase===0)progress=`A → D → A → D　${Math.min(this.adCombo,4)} / 4 コンボ`;
  if(this.phase===1)progress=`水分回復 ${Math.min(15,this.recovered).toFixed(0)} / 15%（毎秒${this.sim.flopRules.waterRecovery}%）`;
  if(this.phase===2){text=this.blockedTried?'水たまりの外へ出て、もう一度左クリック！':step.text;detail=this.blockedTried?'中では攻撃できない！ マウスで外へ向き、A / Dで出よう。':step.detail;progress=this.blockedTried?'✓ 水中で攻撃不可を体験　□ 外で攻撃':'□ 水たまりの中で左クリック';}
  if(this.phase===3){if(this.fpsHit){text='Vで三人称視点（TPS）へ戻してみよう！';detail='でも忘れるな！ BBBの主役は攻撃じゃない！ ビタンビタンだ！！';}else if(!this.tpsShot){text=this.view==='TPS'?step.text:'まずVでTPSに戻り、練習CPUを狙おう。';}else if(!this.fpsSeen){text='相手を狙うのが難しい？ Vで一人称視点（FPS）！！';detail='狙いやすい視点に切り替えてみよう！';}else{text=this.view==='FPS'?'FPSで練習CPUに1回当てよう！ 左クリックで攻撃。':'VでFPSへ戻り、練習CPUを狙ってみよう。';detail=s.time-this.phaseStart>8?'練習CPUは静止中。倒さなくてOK。狙うときだけFPSも便利！':'狙いはマウスで調整。攻撃は相手のビタンビタンを邪魔する手段！';}progress=`${this.tpsShot?'✓':'□'} TPSで狙う　${this.fpsSeen?'✓':'□'} VでFPS　${this.fpsHit?'✓':'□'} 命中　${this.fpsHit&&this.view==='TPS'?'✓':'□'} TPSへ戻す`;}
  if(this.phase===5){detail=`本番は50コンボで虹色！ 1回50 BP・アニメ約1.5倍・水分消費${RAINBOW_WATER_COST_MULTIPLIER}。虹色で水たまりに入ると+50回復！ この課題は30コンボでOK。`; }
  if(this.phase===5)progress=`${Math.min(this.adCombo,TUTORIAL_GOALS.challengeCombo)} / ${TUTORIAL_GOALS.challengeCombo} コンボ　${this.challengeBP} / 100 BP（この挑戦で獲得）`;
  if(this.phase===6){const c=s.chefs[0];text=this.mobile?'死んだふり→奇襲の実演を見よう！':c?.unguarded?'今だ！ A / Dで突然ビタンビタン！':p.feigning?'死んだふり中… コックが油断するまで待とう。':step.text;detail=this.mobile?'モバイルに専用ボタンは追加しません。実演後の水たまりは自分で操作！':step.detail;progress=`疑問度 ${Math.round(c?.question||0)}%`; }
  if(this.phase===7)progress=`水分 ${p.water.toFixed(0)}% → 虹色入場で+50ポイント`;
  return {...step,text,detail,progress};}
}
