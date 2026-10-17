import test from 'node:test';
import assert from 'node:assert/strict';
import {HomeUI} from '../home-ui.js';
import {collection,parseCollection,GACHA_KEY} from '../gacha-store.js';
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.classList={remove(){}};}
 append(...items){this.children.push(...items);}
 replaceChildren(){this.children=[];}
 setAttribute(){}
 addEventListener(type,fn){this.events[type]=fn;}
 get textContent(){return this.text||'';}
 set textContent(value){this.text=value;}
}
const descendants=element=>[element,...element.children.flatMap(descendants)];
test('the real gacha panel handles insufficient coins, a draw click and the persisted result',async t=>{
 const oldDocument=globalThis.document,oldData=collection.data,oldStorage=collection.storage,storage=new Map(),content=new Element('main');
 const view={onCharacterChange(){},render(){content.replaceChildren();HomeUI.prototype.renderGacha.call(this,content);}},listener=()=>view.render();
 globalThis.document={createElement:tag=>new Element(tag)};collection.storage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};collection.data=parseCollection(null);collection.listeners.add(listener);t.mock.method(Math,'random',()=>.1);
 try{view.render();assert.equal(descendants(content).find(n=>n.id==='gachaDraw').disabled,true);assert.ok(descendants(content).some(n=>n.textContent.includes('コイン不足')));
 collection.claim('home-panel-test',100);const draw=descendants(content).find(n=>n.id==='gachaDraw');assert.equal(draw.disabled,false);await draw.events.click();view.skipGacha();
 const saved=JSON.parse(storage.get(GACHA_KEY));assert.equal(saved.coins,30);assert.equal(saved.draws,1);assert.equal(saved.lastDraw.id,'squid');assert.deepEqual(saved.owned,['fish','squid']);assert.equal(descendants(content).find(n=>n.id==='gachaDraw').disabled,true);assert.ok(descendants(content).some(n=>n.textContent==='NEW!'));
 }finally{collection.listeners.delete(listener);collection.data=oldData;collection.storage=oldStorage;globalThis.document=oldDocument;}
});
