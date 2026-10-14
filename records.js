// Preserve the prologue's existing best score; survival rankings are removed.
const KEY='sabakarenuna-records-v3';
export class RecordRepository{
 constructor(storage){this.storage=storage;this.escape={best:0,fastest:null};try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.escape)this.escape={...this.escape,...saved.escape};}catch{}}
 escapeRecord(){return {...this.escape};}
 add(mode,result){if(mode!=='ESCAPE')return;this.escape.best=Math.max(this.escape.best,result.score);if(result.state==='CLEAR')this.escape.fastest=this.escape.fastest===null?result.time:Math.min(this.escape.fastest,result.time);try{this.storage?.setItem(KEY,JSON.stringify({version:1,escape:this.escape}));}catch{}}
}

const ESCAPE_TITLES=[
 {minimum:25000,name:'伝説の脱走魚',tier:6},
 {minimum:22000,name:'脱走の達人',tier:5},
 {minimum:20000,name:'華麗なる逃亡魚',tier:4},
 {minimum:17000,name:'一人前の脱走魚',tier:3},
 {minimum:14000,name:'命からがら',tier:2},
 {minimum:0,name:'奇跡の生還',tier:1},
];
// Presentation reads the final score; scoring and stored records remain unchanged.
export function escapeTitle(result){
 if(result.mode!=='ESCAPE'||result.state!=='CLEAR')return null;
 return ESCAPE_TITLES.find(title=>result.score>=title.minimum)||null;
}
