import {ranked,RankStore,RANKS} from './ranked.js';
import {EFFECTS as GACHA_EFFECTS} from './effect-registry.js';
import {CHARACTERS} from './character-registry.js';
import {collection,CollectionStore,GACHA} from './gacha-store.js';
// Cosmetic progression only. No gameplay constants or inputs depend on this module.
export const PROFILE_KEY='bbb.progression.v1';
export const STAT_KEYS=['plays','abandoned','wins','losses','flops','earnedBP','comboLandings','rainbows','seconds','shots','hits','rankSum','finalBPSum','maxComboSum','fish','squid','starfish','octopus','cleanGames','pvp','cpuGames'];
export const BEST_KEYS=['combo','bp','flops','rainbows','survival','earnedBP'];
export const emptyStats=()=>({ ...Object.fromEntries(STAT_KEYS.map(k=>[k,0])),best:Object.fromEntries(BEST_KEYS.map(k=>[k,0]))});
export const ACHIEVEMENTS=[
 ['flop1','はじめてのビタン','ビタンビタン','flops',1],['flop100','ビタン初心者','ビタンビタン','flops',100],['flop1000','ビタン職人','ビタンビタン','flops',1000],['flop10000','ビタンマスター','ビタンビタン','flops',10000],['flop100000','伝説の鮮魚','ビタンビタン','flops',100000],
 ['combo10','コンボ入門','コンボ','best.combo',10],['combo30','止まらぬビタン','コンボ','best.combo',30],['combo50','虹色の魚','コンボ','best.combo',50],['combo100','コンボの達人','コンボ','best.combo',100],['combo200','ビタンの神','コンボ','best.combo',200],
 ['win1','初めての勝利','対戦','wins',1],['win10','10勝達成','対戦','wins',10],['win50','50勝達成','対戦','wins',50],['win100','100勝達成','対戦','wins',100],
 ['bp1000','BPコレクター','BP','best.earnedBP',1000],['bp5000','BPハンター','BP','best.earnedBP',5000],['bp10000','BPキング','BP','best.earnedBP',10000],['water','水分管理の達人','水分管理','cleanGames',1],['rainbow10','虹の常連','レインボー','rainbows',10],['rainbow100','虹の支配者','レインボー','rainbows',100],
].map(([id,name,category,field,target])=>({id,name,category,field,target}));
ACHIEVEMENTS.push(...[
 ['totalBP10k','累計BPコレクター','累計BP','earnedBP',10000],['totalBP100k','BP富豪','累計BP','earnedBP',100000],['totalBP1m','BP王','累計BP','earnedBP',1000000],
 ...RANKS.slice(1).map(r=>['rank-'+r.id,r.name+'到達','ランク','rankTier',r.tier]),
 ['rank-first','ランク戦デビュー','ランク','rankGames',1],['gacha-first','はじめてのガチャ','ガチャ','gachaDraws',1],['gacha10','ガチャ10回','ガチャ','gachaDraws',10],['gacha100','ガチャ100回','ガチャ','gachaDraws',100],
 ['gacha-character','初めてのキャラクター獲得','ガチャ','rareCharacters',1],['gacha-weapon','初めての武器獲得','ガチャ','rareWeapons',1],['gacha-effect','初めてのエフェクト獲得','ガチャ','rareEffects',1],
 ['collect-characters','海のなかま全員集合','コレクション','charactersOwned',4],['collect-weapons','武器全種類所持','コレクション','weaponsOwned',4],['collect-effects','エフェクト10種類所持','コレクション','effectsOwned',10],['collect-pool','ガチャコンプリート','コレクション','poolsComplete',1]
].map(([id,name,category,field,target])=>({id,name,category,field,target})));
export const TITLES=[['rookie','新人ビタン','flop1'],['artisan','ビタン職人','flop1000'],['master','ビタンマスター','flop10000'],['legend','伝説の鮮魚','flop100000'],['combo','コンボの達人','combo100'],['rainbow','虹の住人','combo50'],['rainbowLord','虹の支配者','rainbow100'],['king','BPキング','bp10000'],['veteran','百戦錬磨','win100']].map(([id,name,unlock])=>({id,name,unlock}));
TITLES.push(...RANKS.map(r=>({id:'rank-'+r.id,name:r.name+'ビタン',unlock:r.tier?'rank-'+r.id:'rank-first'})));
export const COLORS=[['normal','ノーマル',null,null],['ocean','オーシャンブルー','flop100','#318bcd'],['sunset','サンセットオレンジ','combo30','#f49953'],['emerald','エメラルドグリーン','win10','#54b78a'],['gold','ゴールド','flop10000','#d9b651'],['rainbow','レインボー','combo100',null]].map(([id,name,unlock,color])=>({id,name,unlock,color}));
export const EFFECTS=[['normal','ノーマル',null],['water','水しぶき',null],['sparkle','キラキラ','combo50'],['bubble','泡','flop1000'],['rainbow','虹色の水しぶき','combo200']].map(([id,name,unlock])=>({id,name,unlock}));
export const valueAt=(stats,field)=>field.startsWith('best.')?stats.best[field.slice(5)]||0:stats[field]||0;
export const unlocked=(stats,id)=>{const a=ACHIEVEMENTS.find(a=>a.id===id);return !!a&&valueAt(stats,a.field)>=a.target;};
export function sanitizeStats(raw){const s=emptyStats();for(const key of STAT_KEYS)if(Number.isFinite(raw?.[key])&&raw[key]>=0)s[key]=key==='seconds'?Math.min(1e12,raw[key]):Math.floor(Math.min(1e12,raw[key]));for(const key of BEST_KEYS)if(Number.isFinite(raw?.best?.[key])&&raw.best[key]>=0)s.best[key]=key==='survival'?Math.min(1e12,raw.best[key]):Math.floor(Math.min(1e12,raw.best[key]));return s;}
export function combineStats(a,b){const s=emptyStats();for(const k of STAT_KEYS)s[k]=a[k]+b[k];for(const k of BEST_KEYS)s.best[k]=Math.max(a.best[k],b.best[k]);return s;}
export function addReport(stats,r,complete=true){const s=sanitizeStats(stats),n=k=>Math.max(0,Math.min(1e8,Number.isFinite(r[k])?r[k]:0));for(const [key,source]of [['flops','flops'],['earnedBP','earnedBP'],['comboLandings','comboLandings'],['rainbows','rainbows'],['seconds','seconds'],['shots','shots'],['hits','hits']])s[key]+=n(source);
 s[CHARACTERS.some(c=>c.id===r.character)?r.character:'fish']++;s.best.earnedBP=Math.max(s.best.earnedBP,n('earnedBP'));s.best.combo=Math.max(s.best.combo,n('maxCombo'));s.best.survival=Math.max(s.best.survival,n('longestLife'));
 if(complete){s.plays++;s[r.winner?'wins':'losses']++;s.finalBPSum+=n('points');s.rankSum+=Math.max(1,Math.min(4,n('rank')));s.maxComboSum+=n('maxCombo');s[r.humans>=2?'pvp':'cpuGames']++;if(!r.dry)s.cleanGames++;s.best.bp=Math.max(s.best.bp,n('points'));s.best.flops=Math.max(s.best.flops,n('flops'));s.best.rainbows=Math.max(s.best.rainbows,n('rainbows'));}else s.abandoned++;
 return sanitizeStats(s);
}
export function equipment(raw,can){const pick=(list,id,fallback)=>{const x=list.find(x=>x.id===id);return x&&(!x.unlock||can(x.unlock))?x.id:fallback;};return {title:pick(TITLES,raw?.title,''),...Object.fromEntries(CHARACTERS.map(c=>[c.id,{color:pick(COLORS,raw?.[c.id]?.color,'normal'),effect:pick(EFFECTS,raw?.[c.id]?.effect,'water')}]))};}
export const newProfile=()=>({version:1,solo:emptyStats(),online:emptyStats(),unlocks:{},equipped:equipment(null,()=>false),seen:[],proof:'',reduceMotion:false});
export function parseProfile(raw){if(raw?.version!==1)return newProfile();const p=newProfile();p.solo=sanitizeStats(raw.solo);p.online=sanitizeStats(raw.online);const all=combineStats(p.solo,p.online);for(const a of ACHIEVEMENTS)if(typeof raw.unlocks?.[a.id]==='string'&&Number.isFinite(Date.parse(raw.unlocks[a.id])))p.unlocks[a.id]=raw.unlocks[a.id];for(const a of ACHIEVEMENTS)if(unlocked(all,a.id)&&!p.unlocks[a.id])p.unlocks[a.id]=new Date().toISOString();p.equipped=equipment(raw.equipped,id=>!!p.unlocks[id]);p.seen=Array.isArray(raw.seen)?raw.seen.filter(x=>typeof x==='string'&&x.length<180).slice(-512):[];p.proof=typeof raw.proof==='string'&&raw.proof.length<12000?raw.proof:'';p.reduceMotion=raw.reduceMotion===true;return p;}
export class ProgressStore{
 constructor(storage){this.collection=storage?new CollectionStore(storage):collection;try{this.storage=storage??globalThis.localStorage;this.data=parseProfile(JSON.parse(this.storage?.getItem(PROFILE_KEY)||'null'));}catch{this.data=newProfile();}this.rank=storage?new RankStore(storage,this.collection):ranked;this.lastResults=new Map();this.listeners=new Set();this.notices=[];this.revision=0;this.collection.listeners.add(()=>this.refreshMeta());this.rank.listeners.add(()=>this.refreshMeta());this.refreshMeta();}
 achievementStats(base=this.total()){const c=this.collection.data,r=this.rank.data;return {...base,rankTier:r.bestTier,rankGames:r.completed,gachaDraws:c.draws,rareCharacters:c.owned.filter(id=>!['fish','squid'].includes(id)).length,rareWeapons:c.ownedWeapons.filter(id=>id!=='knife').length,rareEffects:c.ownedEffects.filter(id=>!GACHA_EFFECTS.find(e=>e.id===id)?.defaultOwned).length,charactersOwned:c.owned.length,weaponsOwned:c.ownedWeapons.length,effectsOwned:c.ownedEffects.length,poolsComplete:c.completePools.length};}
 refreshMeta(){if(this.refreshing)return;this.refreshing=true;try{const names=this.unlock(this.achievementStats());if(names.length){this.save();for(const a of ACHIEVEMENTS)if(names.includes(a.name)&&(a.category!=='ランク'||this.rank.data.results.at(-1)?.active===true))try{this.collection.claim('achievement:'+a.id,GACHA.achievement);}catch{this.error='実績コインを保存できませんでした。';}}return names;}finally{this.refreshing=false;}}
 total(){return combineStats(this.data.solo,this.data.online);}
 save(){try{this.storage?.setItem(PROFILE_KEY,JSON.stringify(this.data));this.error='';}catch{this.error='このブラウザでは記録を保存できません。';}this.revision++;for(const fn of this.listeners){try{fn();}catch(error){this.error='記録は更新しましたが、一部の表示更新に失敗しました。';console.error('[BBB profile listener]',error);}}}
 unlock(stats){stats=this.achievementStats(stats);const names=[];for(const a of ACHIEVEMENTS)if(!this.data.unlocks[a.id]&&unlocked(stats,a.id)){this.data.unlocks[a.id]=new Date().toISOString();this.notices.push(a.name);names.push(a.name);}return names;}
 observe(report,mode){if(!report||this.data.seen.includes(report.key))return;const temporary=addReport(this.data[mode],report,false);const names=this.unlock(combineStats(temporary,this.data[mode==='solo'?'online':'solo']));if(names.length)this.save();return names;}
 commit(report,mode,complete,options={}){if(!report?.key||!['solo','online'].includes(mode)||this.data.seen.includes(report.key))return null;const before={...this.data[mode].best};this.data[mode]=addReport(this.data[mode],report,complete);this.data.seen.push(report.key);this.data.seen=this.data.seen.slice(-512);const names=this.unlock(this.total());const result={report,unlocks:names,records:BEST_KEYS.filter(k=>this.data[mode].best[k]>before[k])};if(complete){try{if(options.rewardMatch!==false)this.collection.rewardMatch(report,true);if(options.rewardAchievements!==false)for(const id of Object.keys(this.data.unlocks))this.collection.claim('achievement:'+id,GACHA.achievement);}catch(error){this.error='コインを保存できませんでした：'+error.message;}}this.lastResults.set(report.key,result);if(this.lastResults.size>16)this.lastResults.delete(this.lastResults.keys().next().value);this.save();return result;}
 equip(raw){this.data.equipped=equipment(raw,id=>!!this.data.unlocks[id]);this.save();}
 setProof(token){if(typeof token==='string'&&token.length<12000&&token!==this.data.proof){this.data.proof=token;this.save();}}
 reset(){this.data=newProfile();this.lastResults.clear();this.notices=[];this.save();}
}
export const progress=new ProgressStore();
