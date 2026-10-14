// Height and horizontal travel are independently tunable; frequency preserves the apex.
export const BATTLE={duration:90,size:30,players:4,hp:4,fishLength:1.5,bodyRadius:.27,bodyHalfLength:.46,bodyY:.28,jumpDuration:.5,jumpHeight:1.26,spaceJumpHeight:1.26,jumpDistance:1.2,jumpSpeed:8.4,gravity:33.6,walkSpeed:2.4,buffer:.4,fireInterval:.6,knifeSpeed:14,knifeRadius:.065,respawn:4,invincible:1};
export const FLOP_RULES={landingPoints:10,jumpWaterCost:1,spaceWaterCost:2,lowWaterThreshold:10,lowWaterPenalty:10,comboWindow:1.5,absorbRate:.05,waterRecovery:10,minStrength:.60,maxAcceleration:1,accelerationDecay:.55,maxFrequencyMultiplier:2.1,inputMinInterval:.06,swimSpeed:3.2,waterHysteresis:.07};
export const ACCENTS=['#388cff','#ef5964','#4fcb79','#f4cf45'];
export const PUDDLES=[{x:-12,z:-4,radius:1.55},{x:12,z:4,radius:1.55},{x:5.5,z:13,radius:1.55}];
export const JUMP_STRENGTH_CURVE=[[0,.60],[10,.75],[20,.85],[30,.90],[50,.95],[75,.98],[100,1]];
function interpolateStrength(water,curve){
 const value=clamp(water,0,100);
 for(let i=1;i<curve.length;i++){const [low,a]=curve[i-1],[high,b]=curve[i];if(value<=high){const t=(value-low)/(high-low),smooth=t*t*(3-2*t);return a+(b-a)*smooth;}}
 return 1;
}
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

// Shared radial outline for water geometry and recovery collision.
export function puddleRadius(w,angle){return w.radius*(1+.085*Math.sin(angle*3+w.x)+.055*Math.cos(angle*5+w.z));}

export const comboMultiplier=combo=>combo>=30?3:combo>=20?2.5:combo>=10?2:combo>=5?1.5:1;

export const WATER_STRENGTH_CURVE=[[0,.60],[10,.75],[20,.85],[30,.90],[50,.95],[75,.98],[100,1]];
export const movementStrength=water=>interpolateStrength(water,WATER_STRENGTH_CURVE);
export const jumpStrength=water=>interpolateStrength(water,JUMP_STRENGTH_CURVE);
// Flat cost is shared by all fish; BP combo multipliers remain independent.
export const flopWaterCost=()=>FLOP_RULES.jumpWaterCost;
export const BOOST_RULES={multiplier:1.5,duration:8,respawn:15,radius:.75};
// Restored from commit 0fa9b41 and backups/before-kitchen-balance/battle-ai.js.
export const BOT_RULES={accelerationEfficiency:.9,scoreEfficiency:.9,thinkInterval:.2,attackRate:.85,aimError:.12,pitchError:.08,jumpInterval:.15,jumpJitter:.045,turnSpeed:2.8,refillThreshold:45};
export const FEIGN_RULES={idle:.8,noticeDistance:5,approachTimeout:6,inspectDistance:1.2,inspection:.51,unguarded:.8,releaseWindow:.4,attemptLifetime:1.4,attemptDistance:2.3,bonusDistance:1.5,bonus:500,penalty:1000,retryDelay:4,cooldown:20,stun:3};
export const CHEF_RULES={noticeDistance:7,chaseDistance:10,patrolSpeed:.7,chaseSpeed:1.35,attackDistance:1.55,attackHeight:.85,windup:.75,commitTime:.35,attackCooldown:3.2,hitGrace:.8,thinkInterval:.35};
export const KITCHEN_BOT_RULES={leaderTargetChance:.28,escapeDistance:3.5};
export const COUNTDOWN_RULES={duration:3,flopPeriod:.42,flopHeight:.18,botPeriod:.7,startDisplay:.65};

export const HEART_RULES={heal:1,respawn:15,radius:.75,heightTolerance:.7};
