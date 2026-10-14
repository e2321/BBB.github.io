import {randomBytes} from 'node:crypto';
import {BattleSimulation} from '../../battle-simulation.js';
export const roomCode=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return [...randomBytes(6)].map(n=>chars[n%32]).join('');};
export function playerName(value,fallback){if(typeof value!=='string')return fallback;return Array.from(value.replace(/[\p{Cc}\p{Cf}]/gu,'').trim()).slice(0,12).join('')||fallback;}
// Pure room rules: the Colyseus adapter owns authenticated connections, never the client payload.
export class Session{
 constructor(code){this.code=code;this.members=new Map();this.host=null;this.phase='LOBBY';this.sim=new BattleSimulation(randomBytes(4).readUInt32LE());this.tick=0;}
 add(id,name){if(this.phase!=='LOBBY')throw new Error('対戦は開始済みです');if(this.members.size>=4)throw new Error('ルームは満員です');if(this.members.has(id))throw new Error('参加済みです');const occupied=new Set([...this.members.values()].map(m=>m.slot));let slot=0;while(occupied.has(slot))slot++;const member={id,name:playerName(name,`魚 ${slot+1}`),slot,ready:false,connected:true,seq:0,tokens:60,refilledAt:Date.now()};this.members.set(id,member);this.host??=id;return member;}
 remove(id){this.members.delete(id);if(this.host===id)this.host=[...this.members.values()].find(m=>m.connected)?.id||this.members.keys().next().value||null;}
 ready(id,value){const m=this.members.get(id);if(this.phase!=='LOBBY'||!m||typeof value!=='boolean'||m.ready===value)return false;m.ready=value;return true;}
 start(id){if(id!==this.host||this.phase!=='LOBBY'||this.members.size<2||![...this.members.values()].every(m=>m.ready&&m.connected))return false;this.sim.start('normal',true);for(const p of this.sim.players){const m=[...this.members.values()].find(m=>m.slot===p.id);p.bot=!m;p.name=m?.name||`CPU ${p.id+1}`;p.networkId=m?.id||`${this.code}:cpu:${p.id}`;}this.phase='MATCH';return true;}
 input(id,data,now=Date.now()){
  const m=this.members.get(id);if(!m||!m.connected||this.phase!=='MATCH'||!data||typeof data!=='object'||Array.isArray(data))return false;
  const allowed=['phase','seq','kind','key','yaw','pitch','direction','enabled'];if(Object.keys(data).some(k=>!allowed.includes(k)))return false;
  if(!Number.isSafeInteger(data.seq)||data.seq<=m.seq||data.seq>m.seq+10000)return false;
  m.tokens=Math.min(60,m.tokens+Math.max(0,now-m.refilledAt)*.09);m.refilledAt=now;if(m.tokens<1)return false;m.tokens--;m.seq=data.seq;
  const s=this.sim,p=s.players[m.slot];p.inputSeq=data.seq;if(data.phase&&data.phase!==s.state)return false;
  if(data.kind==='flop'&&['A','D'].includes(data.key))return s.jump(m.slot,data.key);
  if(data.kind==='jump')return s.jump(m.slot,'Space');
  if(data.kind==='aim'&&Number.isFinite(data.yaw)&&Math.abs(data.yaw)<100000&&Number.isFinite(data.pitch)&&Math.abs(data.pitch)<=Math.PI/3){s.aim(m.slot,data.yaw,data.pitch);return true;}
  if(data.kind==='swim'&&typeof data.enabled==='boolean')return s.swim(m.slot,data.enabled);
  if(data.kind==='fire'){const d=data.direction;if(!d||Object.keys(d).length!==3||!['x','y','z'].every(k=>Number.isFinite(d[k])&&Math.abs(d[k])<=1.01)||Math.hypot(d.x,d.y,d.z)<.9)return false;return s.fire(m.slot,d);}
  return false;
 }
 connection(id,connected){const m=this.members.get(id);if(!m)return;m.connected=connected;if(this.phase==='MATCH')this.sim.players[m.slot].bot=!connected;if(!connected&&this.phase==='LOBBY'){m.ready=false;if(this.host===id)this.host=[...this.members.values()].find(q=>q.connected)?.id||id;}}
 step(){if(this.phase!=='MATCH')return;this.sim.step(1/60);this.tick++;}
 lobby(){return {code:this.code,host:this.host,phase:this.phase,players:[...this.members.values()].map(({id,name,slot,ready,connected})=>({id,name,slot,ready,connected}))};}
 snapshot(){const s=this.sim;return {tick:this.tick,serverTime:Date.now(),state:s.state,time:s.time,countdownElapsed:s.countdownElapsed,countdownValue:s.countdownValue,players:s.players.map(p=>({...p,ai:undefined,buffer:undefined,surpriseWindows:undefined})),projectiles:s.projectiles.filter(k=>k.active),boosts:s.boosts,sashimi:s.sashimi,result:s.result,events:s.events.splice(0)};}
}
