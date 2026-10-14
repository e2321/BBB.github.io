export const BATTLE={duration:90,size:30,players:4,hp:3,fishLength:1.5,bodyRadius:.27,bodyHalfLength:.46,bodyY:.28,jumpDuration:.5,jumpSpeed:2.8,gravity:11.2,walkSpeed:4,buffer:.4,fireInterval:.6,knifeSpeed:20,knifeRadius:.065,respawn:5,invincible:1};
export const FLOP_RULES={landingPoints:10,jumpWaterCost:3,absorbRate:.10,waterRecovery:5,minStrength:.25,maxAcceleration:1,accelerationDecay:.55,maxFrequencyMultiplier:2.1,inputMinInterval:.06,swimSpeed:3.2,waterHysteresis:.07};
export const ACCENTS=['#658fb1','#b16b64','#7f9c73','#b8a270'];
export const PUDDLES=[{x:-2.4,z:0,radius:1.55},{x:2.4,z:0,radius:1.55},{x:0,z:2.8,radius:1.55}];
export const movementStrength=water=>FLOP_RULES.minStrength+(1-FLOP_RULES.minStrength)*clamp(water/100,0,1);
const obstacle=(id,x,z,sx,sz,height)=>({id,min:{x:x-sx/2,y:0,z:z-sz/2},max:{x:x+sx/2,y:height,z:z+sz/2}});
export const ARENA_OBSTACLES=[...[-1,1].flatMap(x=>[-1,1].flatMap(z=>[obstacle(`high-${x}-${z}`,x*8,z*7,1.2,5,1.8),obstacle(`low-${x}-${z}`,x*4.6,z*9.6,2.2,1.6,.20)])),obstacle('north-cover',0,-11.8,4,1.1,1.8),obstacle('south-cover',0,11.8,4,1.1,1.8)];
export const ARENA_WALLS=[obstacle('west',-15.25,0,.5,31,3),obstacle('east',15.25,0,.5,31,3),obstacle('north',0,-15.25,30,.5,3),obstacle('south',0,15.25,30,.5,3)];
export const SPAWNS=[[-12,-12],[12,12],[-12,12],[12,-12],[0,-7],[0,7],[-11,0],[11,0]].map(([x,z])=>({x,y:BATTLE.bodyY,z}));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function standings(players){const sorted=players.map(p=>({id:p.id,name:p.name,points:p.points,bot:p.bot})).sort((a,b)=>b.points-a.points||a.id-b.id);return sorted.map(p=>({...p,rank:1+sorted.filter(q=>q.points>p.points).length,winner:p.points===sorted[0].points}));}
// Closest distance between two 3D segments, including nearly parallel segments.
export function segmentDistanceSq(a,b,c,d){
 const u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:d.x-c.x,y:d.y-c.y,z:d.z-c.z},w={x:a.x-c.x,y:a.y-c.y,z:a.z-c.z};const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),E=dot(v,w),den=A*C-B*B;let s=den>1e-10?clamp((B*E-C*D)/den,0,1):0,t=C>1e-10?clamp((B*s+E)/C,0,1):0;
 s=A>1e-10?clamp((B*t-D)/A,0,1):0;t=C>1e-10?clamp((B*s+E)/C,0,1):0;return (w.x+s*u.x-t*v.x)**2+(w.y+s*u.y-t*v.y)**2+(w.z+s*u.z-t*v.z)**2;
}
