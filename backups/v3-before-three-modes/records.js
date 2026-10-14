// Local repository boundary: a remote adapter can implement the same methods later.
const KEY='sabakarenuna-records-v3';
export class RecordRepository {
 constructor(storage){this.storage=storage;this.data={version:1,survival:[],escape:{best:0,fastest:null}};try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.version===1){this.data.escape={...this.data.escape,...saved.escape};this.data.survival=(saved.survival||[]).filter(r=>Number.isFinite(r.time)&&r.time>=0).slice(0,10);}}catch{}}
 persist(){try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
 listSurvival(){return this.data.survival.map(r=>({...r}));}
 escapeRecord(){return {...this.data.escape};}
 add(mode,result){if(mode==='SURVIVAL'){const record={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,time:Math.max(0,result.time),score:result.score,cause:result.deathCause,chefs:result.chefs.length,date:new Date().toISOString()};this.data.survival.push(record);this.data.survival.sort((a,b)=>b.time-a.time||b.score-a.score||a.date.localeCompare(b.date));this.data.survival=this.data.survival.slice(0,10);}else{this.data.escape.best=Math.max(this.data.escape.best,result.score);if(result.state==='CLEAR')this.data.escape.fastest=this.data.escape.fastest===null?result.time:Math.min(this.data.escape.fastest,result.time);}this.persist();}
}
