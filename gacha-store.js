import {CHARACTERS,characterDefinition} from './character-registry.js';
export const GACHA=Object.freeze({cost:100,duplicateRefund:30,match:20,win:10,achievement:15});
export const GACHA_KEY='bbb.collection.v1';
const fresh=()=>({version:1,coins:0,owned:['fish','squid'],selected:'fish',claims:[],lastDraw:null,draws:0});
export function parseCollection(raw){const d=fresh();if(raw?.version!==1)return d;d.coins=Number.isSafeInteger(raw.coins)&&raw.coins>=0?Math.min(raw.coins,1e9):0;d.owned=[...new Set([...d.owned,...(Array.isArray(raw.owned)?raw.owned:[]).filter(id=>characterDefinition(id))])];d.selected=d.owned.includes(raw.selected)?raw.selected:'fish';d.claims=Array.isArray(raw.claims)?raw.claims.filter(x=>typeof x==='string'&&x.length<200):[];d.draws=Number.isSafeInteger(raw.draws)&&raw.draws>=0?raw.draws:0;d.lastDraw=raw.lastDraw&&characterDefinition(raw.lastDraw.id)?raw.lastDraw:null;return d;}
export function drawCharacter(random=Math.random,catalogue=CHARACTERS){const pool=catalogue.filter(c=>c.gacha.weight>0),sum=pool.reduce((n,c)=>n+c.gacha.weight,0);let roll=Math.max(0,Math.min(.999999999,random()))*sum;for(const c of pool){roll-=c.gacha.weight;if(roll<0)return c.id;}throw new Error('排出対象がありません');}
export class CollectionStore{
 constructor(storage){try{this.storage=storage??globalThis.localStorage;this.data=parseCollection(JSON.parse(this.storage?.getItem(GACHA_KEY)||'null'));}catch{this.data=fresh();}this.listeners=new Set();this.busy=false;}
 owns(id){return this.data.owned.includes(id);}
 commit(next){if(!this.storage)throw new Error('保存領域を利用できません');this.storage.setItem(GACHA_KEY,JSON.stringify(next));this.data=next;for(const fn of this.listeners){try{fn();}catch(error){console.warn('[BBB collection display]',error);}}}
 claim(key,amount){if(this.data.claims.includes(key)||!Number.isSafeInteger(amount)||amount<=0)return false;const next=structuredClone(this.data);next.claims.push(key);next.coins=Math.min(1e9,next.coins+amount);this.commit(next);return true;}
 rewardMatch(report,complete){if(!complete||!report?.key||report.seconds<89.99||!Number.isFinite(report.seconds))return false;return this.claim('match:'+report.key,GACHA.match+(report.winner?GACHA.win:0));}
 select(id){if(!this.owns(id))return false;const next=structuredClone(this.data);next.selected=id;this.commit(next);return true;}
 async drawLocked(random=Math.random){const run=()=>{try{const stored=this.storage?.getItem(GACHA_KEY);if(stored)this.data=parseCollection(JSON.parse(stored));}catch{}return this.draw(random);};return globalThis.navigator?.locks?globalThis.navigator.locks.request('bbb-collection-draw',run):run();}
 draw(random=Math.random){if(this.busy)throw new Error('抽選処理中です');if(this.data.coins<GACHA.cost)throw new Error('コインが足りません');this.busy=true;try{const id=drawCharacter(random),duplicate=this.owns(id),next=structuredClone(this.data),refund=duplicate?GACHA.duplicateRefund:0;next.coins-=GACHA.cost-refund;if(!duplicate)next.owned.push(id);next.draws++;next.lastDraw={id,duplicate,refund,serial:next.draws,at:Date.now()};this.commit(next);return {...next.lastDraw};}finally{this.busy=false;}}
}
export const collection=new CollectionStore();
