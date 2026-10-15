import {characterId} from '../../seafood-settings.js';
import {ACCENTS} from '../../battle-rules.js';
import {randomBytes} from 'node:crypto';
import {BattleSimulation} from '../../battle-simulation.js';
export const roomCode=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return [...randomBytes(6)].map(n=>chars[n%32]).join('');};
export function playerName(value,fallback){if(typeof value!=='string')return fallback;return Array.from(value.replace(/[\p{Cc}\p{Cf}]/gu,'').trim()).slice(0,12).join('')||fallback;}
// Pure room rules: the Colyseus adapter owns authenticated connections, never the client payload.
export class Session{
 constructor(code){this.code=code;this.members=new Map();this.host=null;this.phase='LOBBY';this.fillCpu=true;this.round=0;this.sim=new BattleSimulation(randomBytes(4).readUInt32LE());this.tick=0;}
 add(id,name,character){if(this.phase!=='LOBBY')throw new Error('対戦は開始済みです');if(this.members.size>=4)throw new Error('ルームは満員です');if(this.members.has(id))throw new Error('参加済みです');const occupied=new Set([...this.members.values()].map(m=>m.slot));let slot=0;while(occupied.has(slot))slot++;const member={id,character:characterId(character),name:playerName(name,`魚 ${slot+1}`),slot,color:ACCENTS[slot],ready:false,rematch:false,connected:true,seq:0,tokens:60,refilledAt:Date.now()};this.members.set(id,member);this.host??=id;return member;}
 resetVotes(){for(const m of this.members.values()){m.ready=false;m.rematch=false;}if(this.phase==='REMATCH')this.phase='RESULT';}
 remove(id){this.members.delete(id);this.resetVotes();if(this.host===id)this.host=[...this.members.values()].find(m=>m.connected)?.id||this.members.keys().next().value||null;}
 ready(id,value){const m=this.members.get(id);if(this.phase!=='LOBBY'||!m||typeof value!=='boolean'||m.ready===value)return false;m.ready=value;return true;}
 start(id){if(id!==this.host||this.phase!=='LOBBY'||this.members.size<1||![...this.members.values()].every(m=>m.ready&&m.connected))return false;this.round++;this.sim.start('normal',true);for(const p of this.sim.players){const m=[...this.members.values()].find(m=>m.slot===p.id);if(m)p.character=m.character;p.inputSeq=m?.seq||0;p.color=m?.color||ACCENTS[p.id];p.spectator=!m&&!this.fillCpu;p.dead=p.spectator;p.hp=p.spectator?0:this.sim.balance.hp;p.bot=!m&&this.fillCpu;p.name=m?.name||`CPU ${p.id+1}`;p.networkId=m?.id||`${this.code}:cpu:${p.id}`;}for(const m of this.members.values()){m.ready=false;m.rematch=false;}this.phase='MATCH';return true;}
 setCpu(id,value){if(id!==this.host||this.phase!=='LOBBY'||typeof value!=='boolean'||value===this.fillCpu)return false;this.fillCpu=value;this.resetVotes();return true;}
 backToLobby(id,round){if(id!==this.host||!['RESULT','REMATCH'].includes(this.phase)||round!==this.round)return false;this.phase='LOBBY';this.resetVotes();return true;}
 requestRematch(id,value,round){const m=this.members.get(id);if(!m||!m.connected||!['RESULT','REMATCH'].includes(this.phase)||round!==this.round||typeof value!=='boolean'||m.rematch===value)return false;m.rematch=value;this.phase='REMATCH';if(this.members.size&&[...this.members.values()].every(q=>q.connected&&q.rematch)){this.phase='LOBBY';for(const q of this.members.values())q.ready=true;this.start(this.host);}return true;}
 input(id,data,now=Date.now()){
  const m=this.members.get(id);if(!m||!m.connected||this.phase!=='MATCH'||!data||typeof data!=='object'||Array.isArray(data))return false;
  if(data.round!==undefined&&data.round!==this.round||this.round>1&&data.round!==this.round)return false;
  const allowed=['round','phase','seq','kind','key','yaw','pitch','direction','enabled'];if(Object.keys(data).some(k=>!allowed.includes(k)))return false;
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
 connection(id,connected){const m=this.members.get(id);if(!m)return;m.connected=connected;if(this.phase==='MATCH')this.sim.players[m.slot].bot=!connected&&this.fillCpu;if(!connected&&this.phase!=='MATCH'){this.resetVotes();if(this.host===id)this.host=[...this.members.values()].find(q=>q.connected)?.id||id;}}
 step(){if(this.phase!=='MATCH')return;this.sim.step(1/60);this.tick++;if(this.sim.state==='FINISHED'){this.phase='RESULT';this.resetVotes();}}
 lobby(){return {code:this.code,host:this.host,phase:this.phase,round:this.round,fillCpu:this.fillCpu,players:[...this.members.values()].map(({id,name,character,slot,color,ready,rematch,connected})=>({id,name,character,slot,color,ready,rematch,connected}))};}
 snapshot(){const s=this.sim;return {round:this.round,phase:this.phase,fillCpu:this.fillCpu,tick:this.tick,serverTime:Date.now(),state:s.state,time:s.time,countdownElapsed:s.countdownElapsed,countdownValue:s.countdownValue,players:s.players.map(p=>({...p,ai:undefined,buffer:undefined,surpriseWindows:undefined})),projectiles:s.projectiles.filter(k=>k.active),boosts:s.boosts,hearts:s.hearts,sashimi:s.sashimi,result:s.result,events:s.events.splice(0)};}
}
