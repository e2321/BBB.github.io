// Real HTTP + Colyseus SDK / WebSocket test. Run separately from unit tests.
import {fork} from 'node:child_process';import assert from 'node:assert/strict';import {Client} from 'colyseus.js';
const child=fork(new URL('../src/index.js',import.meta.url),[],{env:{...process.env,PORT:'2586'},stdio:'inherit'}),url='http://127.0.0.1:2586',clients=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const post=async path=>{const response=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(3000)});assert.equal(response.status,200);return response.json();};
try{let ready=false;for(let i=0;i<25;i++){try{ready=(await fetch(url+'/health',{signal:AbortSignal.timeout(1000)})).ok;}catch(e){if(e.cause?.code==='EACCES')throw e;}if(ready)break;await sleep(200);}assert.ok(ready,'server starts');
 const privateRoom=await post('/rooms'),seats=await Promise.all([post('/quick-match'),post('/quick-match')]);assert.equal(seats[0].room.roomId,seats[1].room.roomId);assert.notEqual(seats[0].room.roomId,privateRoom.roomId);
 const sdk=new Client(url.replace('http','ws'));const a=await sdk.consumeSeatReservation(seats[0]);clients.push(a);let lobby,snapshot;a.onMessage('lobby',v=>lobby=v);a.onMessage('snapshot',v=>snapshot=v);
 const b=await sdk.consumeSeatReservation(seats[1]);clients.push(b);b.onMessage('lobby',()=>{});b.onMessage('snapshot',()=>{});await sleep(300);assert.equal(lobby.quick,true);assert.equal(lobby.players.length,2);
 await b.leave(true);await sleep(300);assert.equal(lobby.phase,'LOBBY');assert.equal(lobby.quickRemaining,null);
 const c=await sdk.consumeSeatReservation(await post('/quick-match'));clients.push(c);c.onMessage('lobby',()=>{});c.onMessage('snapshot',()=>{});await sleep(8500);assert.equal(snapshot.state,'PLAYING');assert.equal(snapshot.players.filter(p=>!p.bot&&!p.spectator).length,2);assert.equal(snapshot.players.filter(p=>p.bot).length,2);
 assert.equal((await fetch(url+'/rooms/'+lobby.code)).status,404);const next=await post('/quick-match');assert.notEqual(next.room.roomId,a.roomId);console.log('Quick HTTP + two real SDK clients, cancel/rejoin, start and CPU fill passed.');
}finally{await Promise.allSettled(clients.map(c=>c.leave(true)));child.kill();}
