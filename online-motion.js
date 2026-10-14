// Horizontal interpolation must not delay authoritative ground contact or the roll phase.
// A/D only: Space prediction/interpolation and all simulation rules remain unchanged.
export function remoteFlopPose(player,snapshot,elapsed,state){
 const dt=state==='PLAYING'?Math.max(0,Math.min(.1,elapsed)):0;
 const time=snapshot.time+dt;
 if(player.grounded||player.dead||player.feigning)return {y:snapshot.y,time};
 const gravity=player.jumpGravity||0;
 const y=snapshot.y+snapshot.v.y*dt-.5*gravity*dt*dt;
 // Avoid forecasting below the arena floor while waiting for the next landing packet.
 return {y:Math.max(.28,y),time};
}
