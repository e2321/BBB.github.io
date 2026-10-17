// Solo-only ranking. Not an authoritative online leaderboard.
import {collection} from './gacha-store.js';
export const RANK_KEY='bbb.soloRank.v1';
export const RANK_RULES=Object.freeze({chefs:2,hp:3,players:4,abandonRP:-20,minActiveWindows:4,minLandings:6});
export const RANKS=Object.freeze([
 ['bronze','ブロンズ',0,.8,20,10,'◆','#bc865d'],['silver','シルバー',100,.9,25,15,'◇','#9ebaca'],['gold','ゴールド',250,1,30,20,'✦','#e6b93c'],['platinum','プラチナ',450,1.15,40,25,'⬟','#57c4be'],['diamond','ダイヤモンド',700,1.3,50,35,'♦','#70a7ef'],['master','マスター',1000,1.45,60,40,'♛','#c68df0']
].map(([id,name,min,difficulty,completion,win,icon,color],tier)=>Object.freeze({id,name,min,difficulty,completion,win,icon,color,tier})));
export const rankAt=rp=>RANKS.findLast(r=>r.min<=Math.max(0,Number.isFinite(rp)?rp:0))||RANKS[0];
const integer=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
const fresh=()=>({version:1,rp:0,bestTier:0,plays:0,completed:0,wins:0,bp:0,bestCombo:0,lastResultId:'',results:[],active:null});
export function parseRank(raw){const d=fresh();if(raw?.version!==1)return d;for(const k of ['rp','plays','completed','wins','bp','bestCombo'])d[k]=integer(raw[k]);d.bestTier=Math.max(rankAt(d.rp).tier,integer(raw.bestTier,5));d.lastResultId=typeof raw.lastResultId==='string'?raw.lastResultId:'';d.results=Array.isArray(raw.results)?raw.results.filter(r=>typeof r?.id==='string'&&Number.isInteger(r.after)&&r.after>=0&&Number.isInteger(r.coins)&&r.coins>=0&&r.coins<=100).slice(-512):[];if(typeof raw.active?.id==='string'&&RANKS.some(r=>r.id===raw.active.rank))d.active={id:raw.active.id,rank:raw.active.rank};return d;}
export function rankedReward(rank,position,complete,active=true){const r=RANKS.find(r=>r.id===rank)||RANKS[0];return {delta:complete?([30,10,-10,-20][Math.max(1,Math.min(4,position))-1]??-20):-20,coins:complete&&active?r.completion+(position===1?r.win:0):0};}
export class RankActivity{
 constructor(){this.windows=new Set();this.cells=new Set();this.lastFlops=0;this.distance=0;this.last=null;}
 observe(sim,id=0){if(sim.state!=='PLAYING')return;const p=sim.players[id],r=p.record;if(!p.dead&&this.last){const d=Math.hypot(p.p.x-this.last.x,p.p.z-this.last.z);if(d<2)this.distance+=d;}this.last={x:p.p.x,z:p.p.z};if(r.flops>this.lastFlops){this.windows.add(Math.floor(sim.time/10));this.cells.add(`${Math.floor(p.p.x/2)}:${Math.floor(p.p.z/2)}`);}this.lastFlops=r.flops;}
 eligible(report){return this.windows.size>=RANK_RULES.minActiveWindows&&report.comboLandings>=RANK_RULES.minLandings&&(this.distance>=4&&this.cells.size>=2||report.hits>=1);}
}
export class RankStore{
 constructor(storage,coins=collection){this.coins=coins;this.listeners=new Set();try{this.storage=storage??globalThis.localStorage;this.data=parseRank(JSON.parse(this.storage?.getItem(RANK_KEY)||'null'));}catch{this.data=fresh();}}
 commit(next){if(!this.storage)throw new Error('ランク戦の保存領域を利用できません');this.storage.setItem(RANK_KEY,JSON.stringify(next));this.data=next;for(const fn of this.listeners)try{fn();}catch(error){console.warn('[BBB rank display]',error);}}
 begin(id){if(this.data.active)this.finish(this.data.active.id,{},false,false);const rank=rankAt(this.data.rp);this.commit({...this.data,active:{id,rank:rank.id}});return rank;}
 deliver(result){if(result?.coins>0)this.coins.claim('rank:'+result.id,result.coins);return result;}
 finish(id,report,complete,active){const previous=this.data.results.find(r=>r.id===id);if(previous)return this.deliver(previous);if(this.data.active?.id!==id)return null;const before=this.data.rp,rank=this.data.active.rank,position=Number.isInteger(report.rank)?Math.max(1,Math.min(4,report.rank)):4,reward=rankedReward(rank,position,complete,active),after=Math.max(0,before+reward.delta),result={id,rank,position,points:integer(report.points),complete,active,delta:after-before,before,after,coins:reward.coins,promotion:rankAt(after).tier-rankAt(before).tier};const next={...this.data,rp:after,bestTier:Math.max(this.data.bestTier,rankAt(after).tier),plays:this.data.plays+1,completed:this.data.completed+(complete?1:0),wins:this.data.wins+(complete&&position===1?1:0),bp:this.data.bp+integer(report.earnedBP),bestCombo:Math.max(this.data.bestCombo,integer(report.maxCombo)),lastResultId:id,results:[...this.data.results,result].slice(-512),active:null};this.commit(next);return this.deliver(result);}
 recover(){if(this.data.active)this.finish(this.data.active.id,{},false,false);for(const r of this.data.results)this.deliver(r);}
}
export const ranked=new RankStore();
