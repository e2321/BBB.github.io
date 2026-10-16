// Private IPC fixture, never reachable from the game's HTTP/WebSocket API.
await import('../src/index.js');
const {rooms}=await import('../src/room.js');
process.on('message',m=>{const room=[...rooms.values()].find(r=>r.roomId===m.roomId);if(!room)return;if(m.kind==='deadline'){room.session.waitDeadline=Date.now();room.session.step();room.syncPhase();}process.send({done:m.kind});});
