import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeTitle} from '../records.js';
import {Simulation} from '../simulation.js';
test('escape titles include all six threshold boundaries and the reference score',()=>{
 const samples=[[0,'奇跡の生還',1],[13999,'奇跡の生還',1],[14000,'命からがら',2],[16999,'命からがら',2],[17000,'一人前の脱走魚',3],[18843,'一人前の脱走魚',3],[19999,'一人前の脱走魚',3],[20000,'華麗なる逃亡魚',4],[21999,'華麗なる逃亡魚',4],[22000,'脱走の達人',5],[24999,'脱走の達人',5],[25000,'伝説の脱走魚',6],[30000,'伝説の脱走魚',6]];
 for(const [score,name,tier] of samples){const result={mode:'ESCAPE',state:'CLEAR',score},before={...result};assert.deepEqual(escapeTitle(result),{minimum:[0,14000,17000,20000,22000,25000][tier-1],name,tier});assert.deepEqual(result,before);}
});
test('failed, unfinished or BBB runs never receive an escape title',()=>{for(const state of ['GAMEOVER','READY','PLAYING'])assert.equal(escapeTitle({mode:'ESCAPE',state,score:99999}),null);assert.equal(escapeTitle({mode:'BATTLE',state:'CLEAR',score:99999}),null);});
test('title selection uses the unchanged final score calculation',()=>{const s=new Simulation();s.start();Object.assign(s,{time:62.54,water:98,successes:1,attempts:3,alternations:17});s.finish('CLEAR');assert.equal(s.score,18843);assert.equal(escapeTitle(s).name,'一人前の脱走魚');});
