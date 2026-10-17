import test from 'node:test';import assert from 'node:assert/strict';import {BattleMode} from '../battle-view.js';
test('chef suspicion HUD belongs to an active match, never the home or results',()=>{
 const previous=globalThis.document,host={hidden:false},overlay={hidden:false};globalThis.document={getElementById:id=>id==='chefMeters'?host:id==='overlay'?overlay:null};
 const context={sim:{stage:{id:'kitchen'},state:'READY',chefs:[]},meters:[]};
 try{
  for(const state of ['READY','PLAYING','COUNTDOWN','PAUSED','FINISHED']){context.sim.state=state;BattleMode.prototype.updateChefMeters.call(context);assert.equal(host.hidden,true,'home '+state);}
  overlay.hidden=true;
  for(const state of ['PLAYING','COUNTDOWN','PAUSED']){context.sim.state=state;BattleMode.prototype.updateChefMeters.call(context);assert.equal(host.hidden,false,state);}
  context.sim.state='FINISHED';BattleMode.prototype.updateChefMeters.call(context);assert.equal(host.hidden,true);
  context.sim.state='PLAYING';context.sim.stage.id='normal';BattleMode.prototype.updateChefMeters.call(context);assert.equal(host.hidden,true);
 }finally{globalThis.document=previous;}
});
