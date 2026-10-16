// Requires actual Colyseus dependencies. No mocks or replacement WebSocket server.
import {fork} from 'node:child_process';import assert from 'node:assert/strict';
import {Client} from 'colyseus.js';
const processServer=fork(new URL('../src/index.js',import.meta.url),[],{env:{...process.env,PORT:'2568'},stdio:'inherit'}),url='http://127.0.0.1:2568',clients=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 let ready=false;for(let i=0;i<50;i++){try{ready=(await fetch(url+'/health')).ok;}catch{}if(ready)break;await sleep(200);}assert.ok(ready,'server starts');
 const sdk=await fetch(url+'/sdk/colyseus.js');assert.equal(sdk.status,200);assert.ok((await sdk.text()).length>1000);
 const info=await(await fetch(url+'/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();assert.match(info.code,/^\d{2}$/);
 const join=await(await fetch(url+'/rooms/'+info.code)).json();assert.equal(join.roomId,info.roomId);
 for(let i=0;i<4;i++){const client=new Client(url.replace('http','ws'));clients.push(await client.joinById(info.roomId,{code:info.code,ticket:i===0?info.ticket:undefined,name:`魚${i}`}));}
 assert.equal((await fetch(url+'/rooms/'+info.code)).status,409);
 let latest;for(const c of clients){c.onMessage('lobby',()=>{});c.onMessage('snapshot',data=>{latest=data;});c.send('ready',true);}await sleep(200);clients[0].send('start');await sleep(3500);assert.equal(latest.state,'PLAYING');assert.equal(latest.players.length,4);assert.ok(latest.players.every(p=>!p.bot));assert.equal((await fetch(url+'/rooms/'+info.code)).status,409);
 clients[0].send('input',{phase:'PLAYING',seq:1,kind:'jump',points:999999});await sleep(100);assert.equal(latest.players[0].points,0);clients[0].send('input',{phase:'PLAYING',seq:2,kind:'flop',key:'A'});await sleep(600);assert.equal(latest.players[0].points,10);assert.equal(latest.players[0].water,99);
 const token=clients[1].reconnectionToken;clients[1].connection.close();await sleep(100);const resumed=await new Client(url.replace('http','ws')).reconnect(token);clients[1]=resumed;resumed.onMessage('lobby',()=>{});resumed.onMessage('snapshot',()=>{});assert.ok(resumed.sessionId);console.log('Colyseus HTTP/SDK, four clients, countdown, authoritative input and reconnection passed.');
}finally{await Promise.allSettled(clients.map(c=>c.leave(true)));processServer.kill();}
