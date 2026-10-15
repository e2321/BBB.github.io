// Test-only IPC setup; never loaded by the public server or exposed over WebSocket.
await import('../src/index.js');
const {rooms}=await import('../src/room.js');
process.on('message',message=>{const room=rooms.get(message.code);if(!room)return;const s=room.session.sim;for(const p of s.players)p.bot=false;
 if(message.kind==='pickup'){for(const p of s.players){p.hp=3;p.boostUntil=0;}for(const id of [0,1])s.players[id].p={...s.boosts[0].p,y:.28};s.collectBoosts();}
 if(message.kind==='respawn'){for(const p of s.players)p.p={...s.spawns[p.id]};s.time=s.boosts[0].respawnAt;s.collectBoosts();}
 if(message.kind==='kill'){s.players[0].points=0;const victim=s.players[1];victim.points=2000;victim.hp=1;victim.invUntil=0;s.damage(victim,0);s.damage(victim,0);}
 room.broadcast('snapshot',room.session.snapshot());process.send({done:message.kind});
});
