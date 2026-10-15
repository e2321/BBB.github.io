// Parent-process test fixture only; no HTTP/WebSocket administration endpoint.
await import('../src/index.js');
const {rooms}=await import('../src/room.js');
process.on('message',m=>{const room=rooms.get(m.code);if(!room)return;
 if(m.kind==='finish'){const s=room.session.sim;s.state='PLAYING';s.time=89.99;for(const p of s.players)if(!p.spectator){p.points=100+p.id;p.hp=2;p.water=31;p.combo=9;}s.hearts[0].active=false;s.hearts[0].respawnAt=99;}
 process.send({done:m.kind});
});
