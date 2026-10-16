import {characterDefinition,assetURL} from './character-registry.js';
// Keeps ownership separate from HTTP cache and loaded GPU data.
export class ModelManager{
 constructor({load,dispose=()=>{},limit=4,definitions=characterDefinition}={}){this.definitions=definitions;this.load=load;this.dispose=dispose;this.limit=limit;this.entries=new Map();}
 status(id){return this.entries.get(id)?.state||'idle';}
 peek(id){return this.entries.get(id)?.value;}
 request(id,{owned=false,retry=false}={}){const def=this.definitions(id);if(!owned||!def?.modelURL)return Promise.resolve(null);let e=this.entries.get(id);if(e?.state==='ready')return Promise.resolve(e.value);if(e?.promise)return e.promise;if(e?.state==='failed'&&!retry)return Promise.resolve(null);e={state:'loading',refs:0,used:Date.now()};this.entries.set(id,e);e.promise=Promise.resolve().then(()=>this.load(assetURL(def.modelURL))).then(value=>{e.value=value;e.state='ready';e.refs++;this.trim();e.refs--;return value;}).catch(error=>{e.state='failed';e.error=String(error.message||error);return null;}).finally(()=>{e.promise=null;});return e.promise;}
 retain(id){const e=this.entries.get(id);if(e?.state!=='ready')return null;e.refs++;e.used=Date.now();return e.value;}
 release(id){const e=this.entries.get(id);if(e)e.refs=Math.max(0,e.refs-1);this.trim();}
 trim(){const ready=[...this.entries].filter(([,e])=>e.state==='ready').sort((a,b)=>a[1].used-b[1].used);while(ready.length>this.limit){const i=ready.findIndex(([,e])=>e.refs===0);if(i<0)break;const [id,e]=ready.splice(i,1)[0];this.dispose(e.value);this.entries.delete(id);}}
 display(id,owned){return id==='fish'||id==='squid'?id:owned&&this.status(id)==='ready'?id:'fish';}
 clear(){for(const [id,e]of this.entries)if(!e.refs&&!e.promise){if(e.value)this.dispose(e.value);this.entries.delete(id);}}
}
