import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../server/src/session.js';
import {OnlineBattleMode} from '../online-view.js';
test('online client drops removed Space before sending and server rejects legacy jump packets',()=>{
 const packets=[];OnlineBattleMode.prototype.jump.call({send:p=>packets.push(p)},'Space');assert.deepEqual(packets,[]);
 const r=new Session('JMP234');r.add('h','Host');r.ready('h',true);r.start('h');r.sim.ai.update=()=>{};
 for(let i=0;i<180;i++)r.step();const p=r.sim.players[0],before={water:p.water,points:p.points,combo:p.combo,p:{...p.p},v:{...p.v}};
 for(let seq=1;seq<=20;seq++)assert.equal(r.input('h',{kind:'jump',seq,round:r.round,phase:'PLAYING'},100000+seq*100),false);
 assert.deepEqual({water:p.water,points:p.points,combo:p.combo,p:{...p.p},v:{...p.v}},before);
 assert.equal(r.input('h',{kind:'flop',key:'A',seq:21,round:r.round,phase:'PLAYING'},103000),true);assert.equal(p.water,99);
});
