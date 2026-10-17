// Shared server/client character rules. No rendering or persistence dependencies.
export const CHARACTER_COMBAT=Object.freeze({
 fish:{hp:3,aim:0,bulletSpeed:1,bulletRadius:1,flop:1,jump:1,special:'ビタンビタンフィーバー',detail:'速度・ビタンBP×1.5',duration:5},
 squid:{hp:2,aim:10,bulletSpeed:1.2,bulletRadius:1.15,flop:.75,jump:1,special:'ロックオンラッシュ',detail:'照準補助15°・攻撃間隔75%',duration:4},
 starfish:{hp:4,aim:0,bulletSpeed:.9,bulletRadius:1,flop:.85,jump:.95,special:'無限うるおい',detail:'全アクションの水分消費0',duration:5}
});
export const SPECIAL_RULES=Object.freeze({max:100,landing:1,hit:3,kill:5,feverSpeed:1.5,feverBP:1.5,rushAngle:15,rushInterval:.75});
export const combatRules=p=>CHARACTER_COMBAT[p?.character]||CHARACTER_COMBAT.fish;
export const specialActive=(p,time=p?.combatTime||0)=>!p?.dead&&Number.isFinite(p?.specialUntil)&&time<p.specialUntil;
export const specialKind=p=>['squid','starfish'].includes(p?.character)?p.character:'fish';
export const effectSpeed=(p,time,rainbow=1.25)=>Math.max(p.combo>=50?rainbow:1,specialActive(p,time)&&specialKind(p)==='fish'?SPECIAL_RULES.feverSpeed:1);
export const waterCostMultiplier=(p,time)=>specialActive(p,time)&&specialKind(p)==='starfish'?0:1;
export const abilityText=id=>{const r=combatRules({character:id});return `HP ${r.hp} ／ ビタン速度 ×${r.flop} ／ 弾速 ×${r.bulletSpeed} ／ 弾判定 ×${r.bulletRadius} ／ 跳躍 ×${r.jump} ／ ${r.aim?'強い照準補助':'照準補助なし'} ／ ${r.special}（${r.duration}秒：${r.detail}）`;};
export const COMBO_STAGES=Object.freeze([
 {min:0,label:'',semitones:0,color:'#e9f4f7',scale:1},
 {min:5,label:'GOOD!',semitones:2,color:'#8df5c5',scale:1.08},
 {min:10,label:'GREAT!',semitones:4,color:'#73dfff',scale:1.16},
 {min:20,label:'EXCELLENT!',semitones:6,color:'#cfacff',scale:1.24},
 {min:35,label:'AMAZING!',semitones:9,color:'#ffbc6b',scale:1.32},
 {min:50,label:'RAINBOW!',semitones:12,color:'#ffe58b',scale:1.4}
]);
export const comboStage=count=>COMBO_STAGES.findLast(s=>count>=s.min)||COMBO_STAGES[0];
export const comboPitch=count=>2**(comboStage(count).semitones/12);

export const comboWindowSeconds=(p,time,base=1.5)=>base/(combatRules(p).flop*effectSpeed(p,time));
