// Cosmetic metadata only. Never used by movement, scoring, damage or hit tests.
export const EFFECT_SLOTS=Object.freeze({splash:'水しぶき',trail:'投擲軌跡',hit:'命中エフェクト',kill:'撃破演出',combo:'コンボ演出'});
const effect=(id,slot,name,style,defaultOwned=false)=>Object.freeze({id,slot,name,style,defaultOwned,type:slot==='splash'?'splash':'presentation',enabled:true});
export const EFFECTS=Object.freeze([
 effect('splash-water','splash','通常の水しぶき','water',true),
 effect('splash-rainbow','splash','虹色の水しぶき','rainbow'),
 effect('splash-bubble','splash','泡の水しぶき','bubble'),
 effect('splash-sparkle','splash','キラキラ水しぶき','sparkle'),
 effect('splash-ink','splash','インク風水しぶき','ink'),
 effect('trail-default','trail','通常の軌跡','default',true),effect('trail-prism','trail','プリズム軌跡','prism'),
 effect('hit-default','hit','通常の命中','default',true),effect('hit-stars','hit','星の命中','stars'),
 effect('kill-default','kill','通常の撃破','default',true),effect('kill-confetti','kill','祝福の紙吹雪','confetti'),
 effect('combo-default','combo','通常のコンボ','default',true),effect('combo-glow','combo','コンボ・ネオン','glow')]);
export const effectDefinition=id=>EFFECTS.find(e=>e.id===id&&e.enabled);
const defaults=Object.freeze(Object.fromEntries(Object.keys(EFFECT_SLOTS).map(slot=>[slot,EFFECTS.find(e=>e.slot===slot&&e.defaultOwned).id])));
export const defaultEffects=()=>({...defaults});
export const defaultOwnedEffects=()=>EFFECTS.filter(e=>e.defaultOwned).map(e=>e.id);
// Only registered IDs and their intended slots can cross the network. No shader/code/particle counts from peers.
export function sanitizePresentation(raw){const result=defaultEffects();for(const slot of Object.keys(result)){const e=effectDefinition(raw?.[slot]);if(e?.slot===slot)result[slot]=e.id;}return result;}
export const presentationStyle=(player,slot)=>(effectDefinition(player?.presentation?.[slot])?.slot===slot?effectDefinition(player.presentation[slot]):effectDefinition(defaults[slot])).style;
