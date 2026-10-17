import {RankStore,RANKS,rankAt,rankedReward} from '../../ranked.js';
import {EFFECTS,effectDefinition,defaultEffects,defaultOwnedEffects} from '../../effect-registry.js';
import {GACHA_POOLS} from '../../gacha-catalogue.js';
import {drawItem,poolDefinition,poolComplete} from '../../gacha-catalogue.js';
import {WEAPONS,weaponDefinition} from '../../weapon-registry.js';
import express from 'express';
import {randomBytes,createHash,timingSafeEqual,randomInt} from 'node:crypto';
import {CollectionStore,GACHA} from '../../gacha-store.js';
import {CHARACTERS,characterDefinition} from '../../character-registry.js';
export const ADMIN_TTL=15*60*1000;
const digest=s=>createHash('sha256').update(s).digest();
const error=(status,message)=>Object.assign(new Error(message),{status});
const freshTest=()=>new CollectionStore({getItem:()=>null,setItem:()=>{}});
// Tokens and TEST collections live only in this process, never in player saves/rooms.
export class AdminService{
 constructor({password=process.env.BBB_ADMIN_PASSWORD||'',now=Date.now,ttl=ADMIN_TTL,random=()=>randomInt(0,0x100000000)/0x100000000}={}){Object.assign(this,{password,now,ttl,random});this.sessions=new Map();this.attempts=new Map();}
 prune(){const now=this.now();for(const [k,s]of this.sessions)if(s.expiresAt<=now)this.sessions.delete(k);for(const [k,a]of this.attempts)if(a.until<=now)this.attempts.delete(k);}
 login(password,ip){this.prune();if(!this.password)throw error(503,'開発者認証は未設定です。サーバーのBBB_ADMIN_PASSWORDを設定してください。');const a=this.attempts.get(ip)||{count:0,until:this.now()+60000};if(this.attempts.size>=2000&&!this.attempts.has(ip)||a.count>=5)throw error(429,'認証試行が多すぎます。1分ほど待ってください。');a.count++;this.attempts.set(ip,a);if(typeof password!=='string'||password.length>256||!timingSafeEqual(digest(password),digest(this.password)))throw error(401,'パスワードが違います。');if(this.sessions.size>=100)throw error(503,'管理セッションが混雑しています。');const token=randomBytes(32).toString('base64url'),session={expiresAt:this.now()+this.ttl,store:freshTest(),requests:0,window:this.now()+60000};session.rank=new RankStore({getItem:()=>null,setItem(){}},session.store);session.rankDifficulty=null;this.sessions.set(digest(token).toString('hex'),session);return {token,expiresAt:session.expiresAt,test:session.store.data,rank:session.rank.data,rankDifficulty:session.rankDifficulty};}
 session(token){this.prune();if(typeof token!=='string'||token.length>128)throw error(401,'開発者認証が必要です。');const s=this.sessions.get(digest(token).toString('hex'));if(!s)throw error(401,'認証が失効しました。もう一度ログインしてください。');if(s.window<=this.now()){s.requests=0;s.window=this.now()+60000;}if(++s.requests>180)throw error(429,'管理操作が多すぎます。少し待ってください。');return s;}
 logout(token){this.session(token);this.sessions.delete(digest(token).toString('hex'));}
 action(token,body){const s=this.session(token),store=s.store,type=body?.type;let result;const number=(value,min,max)=>{if(!Number.isFinite(value)||value<min||value>max)throw error(400,'数値が許容範囲外です。');return value;};
  if(type==='coins'){const n=number(body.value,0,1000000);if(!Number.isSafeInteger(n))throw error(400,'整数で指定してください。');store.commit({...store.data,coins:Math.min(1e9,store.data.coins+n)});}
  else if(type==='resetCoins')store.commit({...store.data,coins:0});
  else if(type==='resetTest'){s.store=freshTest();s.rank=new RankStore({getItem:()=>null,setItem(){}},s.store);s.rankDifficulty=null;}
  else if(type==='unlock'){const ids=body.id==='all'?CHARACTERS.map(c=>c.id):[body.id];if(ids.some(id=>!characterDefinition(id)))throw error(400,'不明なキャラクターです。');store.commit({...store.data,owned:[...new Set([...store.data.owned,...ids])]});}
  else if(type==='resetOwned')store.commit({...store.data,owned:['fish','squid'],selected:'fish',ownedWeapons:['knife'],equippedWeapon:'knife',ownedEffects:defaultOwnedEffects(),equippedEffects:defaultEffects()});
  else if(type==='select'){if(!store.select(body.id))throw error(400,'TEST未所持です。');}
  else if(type==='unlockWeapons')store.commit({...store.data,ownedWeapons:WEAPONS.map(w=>w.id)});
  else if(type==='equipWeapon'){if(!store.equipWeapon(body.id))throw error(400,'TEST未所持武器です。');}
  else if(type==='unlockEffects')store.commit({...store.data,ownedEffects:EFFECTS.map(e=>e.id)});
  else if(type==='equipEffect'){if(!store.equipEffect(body.slot,body.id))throw error(400,'TEST未所持またはスロット不一致です。');}
  else if(type==='probabilities')result=GACHA_POOLS.map(p=>({id:p.id,enabled:p.enabled,category:p.category,entries:p.entries}));
  else if(type==='rankSet'){const rp=number(body.rp,0,100000);if(!Number.isInteger(rp))throw error(400,'RPは整数です。');s.rank.commit({...s.rank.data,rp,bestTier:Math.max(s.rank.data.bestTier,rankAt(rp).tier)});}
  else if(type==='rankTier'){const r=RANKS.find(r=>r.id===body.id);if(!r)throw error(400,'不明なランクです。');s.rank.commit({...s.rank.data,rp:r.min,bestTier:Math.max(s.rank.data.bestTier,r.tier)});}
  else if(type==='rankDifficulty')s.rankDifficulty=number(body.value,.8,1.45);
  else if(type==='rankReward'){if(!RANKS.some(r=>r.id===body.rank)||!Number.isInteger(body.position)||body.position<1||body.position>4)throw error(400,'ランクまたは順位が不正です。');result=rankedReward(body.rank,body.position,true,true);}
  else if(type==='rankPreview'){if(!['promotion','demotion','result','achievement','title'].includes(body.kind))throw error(400,'不明なプレビューです。');const preview=new RankStore({getItem:()=>null,setItem(){}},{claim:()=>true}),rp=body.kind==='promotion'?99:body.kind==='demotion'?100:s.rank.data.rp;preview.commit({...preview.data,rp});preview.begin('preview');result=preview.finish('preview',{rank:body.kind==='demotion'?4:1,points:1234,earnedBP:1234,maxCombo:50},true,true);result.kind=body.kind;}
  else if(type==='draw'){if(![1,10].includes(body.count))throw error(400,'1回か10連を選んでください。');if(store.data.coins<(body.count===10?GACHA.tenCost:GACHA.cost))throw error(400,'TESTコイン不足です。');if(poolComplete(store.data,body.pool||'sea'))throw error(400,'コンプリート済みです。');result=store.drawBatch(body.count,this.random,body.pool||'sea');}
  else if(type==='simulate'){if(![1,10,100,1000].includes(body.count))throw error(400,'指定された抽選回数は無効です。');const p=poolDefinition(body.pool||'sea');if(!p?.enabled)throw error(400,'準備中のガチャです。');const counts=Object.fromEntries(p.entries.map(c=>[c.id,0]));for(let i=0;i<body.count;i++)counts[drawItem(this.random,p.id).id]++;result=Object.entries(counts).map(([id,count])=>{const e=p.entries.find(e=>e.id===id);return {id,type:e.type,count,actual:count/body.count*100,expected:100*e.weight};});}
  else if(type==='revealTest'){if(!['new','duplicate','weapon','splash','presentation'].includes(body.kind))throw error(400,'無効な演出テストです');result=[{id:body.kind==='splash'?'splash-rainbow':body.kind==='presentation'?'trail-prism':body.kind==='weapon'?'fork':'starfish',type:['splash','presentation','weapon'].includes(body.kind)?body.kind:'character',duplicate:body.kind==='duplicate',refund:body.kind==='duplicate'?50:0}];}
  else if(type==='game'){if(!['start','bp','combo','water','hp','rainbow','chefs','notifications','surprise','stop','weaponDebug','wallTest','effectPreview','effectLoad'].includes(body.field))throw error(400,'不明なTEST操作です。');if(body.field==='effectPreview'&&!effectDefinition(body.value))throw error(400,'不明なエフェクトです。');const ranges={bp:[0,1e7],combo:[0,1000],water:[0,100],hp:[1,4],rainbow:[0,1],chefs:[0,3]};if(ranges[body.field]){number(body.value,...ranges[body.field]);if(body.field!=='water'&&!Number.isInteger(body.value))throw error(400,'整数で指定してください。');}result={field:body.field,value:body.value};}
  else if(!['metrics','modelLoad','modelFailure','fallback'].includes(type))throw error(400,'許可されていない管理操作です。');
  return {test:s.store.data,rank:s.rank.data,rankDifficulty:s.rankDifficulty,result,expiresAt:s.expiresAt};
 }
}
export function adminRouter({service=new AdminService(),env=process.env}={}){const router=express.Router();router.use((req,res,next)=>{res.set('Cache-Control','no-store');const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),secure=!!req.socket.encrypted||(env.RENDER==='true'&&req.headers['x-forwarded-proto']==='https');if(!secure&&!(local&&env.NODE_ENV!=='production'&&env.RENDER!=='true'))return res.status(403).json({error:'開発者認証にはHTTPSが必要です。'});next();});const token=req=>req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];const wrap=fn=>(req,res)=>{try{res.json(fn(req));}catch(e){res.status(e.status||400).json({error:e.status?e.message:'管理操作を処理できませんでした。'});}};router.post('/login',wrap(req=>service.login(req.body?.password,env.RENDER==='true'?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim():req.socket.remoteAddress)));router.post('/logout',wrap(req=>{service.logout(token(req));return {ok:true};}));router.post('/action',wrap(req=>service.action(token(req),req.body)));router.get('/session',wrap(req=>{const s=service.session(token(req));return {expiresAt:s.expiresAt,test:s.store.data,rank:s.rank.data,rankDifficulty:s.rankDifficulty};}));return router;}
