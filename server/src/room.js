import {Room} from '@colyseus/core';
import {Session} from './session.js';
export const rooms=new Map();
export class BBBRoom extends Room{
 onCreate(options){this.maxClients=4;this.maxMessagesPerSecond=120;this.setPrivate(true);this.session=new Session(options.code);this.ticket=options.ticket;rooms.set(options.code,this);this.expiry=this.clock.setTimeout(()=>{if(!this.clients.length)this.disconnect();},15000);this.onMessage('ready',(c,v)=>{if(!this.accept(c))return;if(this.session.ready(c.sessionId,v))this.broadcastLobby();});this.onMessage('start',c=>{if(!this.accept(c))return;if(this.session.start(c.sessionId)){this.lock();this.broadcastLobby();this.broadcast('snapshot',this.session.snapshot());}});this.onMessage('input',(c,data)=>{if(!this.accept(c))return;if(data&&typeof data.phase==='string')this.session.input(c.sessionId,data);});this.onMessage('ping',(c,t)=>{if(!this.accept(c))return;if(Number.isFinite(t))c.send('pong',t);});this.onMessage('*',c=>this.accept(c));this.accumulator=0;this.sentTick=0;this.setSimulationInterval(delta=>{this.accumulator=Math.min(1,this.accumulator+Math.max(0,Math.min(delta,250))/1000);while(this.accumulator>=1/60){this.session.step();this.accumulator-=1/60;}if(this.session.phase==='MATCH'&&this.session.tick-this.sentTick>=3){this.sentTick=this.session.tick;this.broadcast('snapshot',this.session.snapshot());}},1000/60);}
 accept(client){const now=Date.now(),bucket=client.userData??={tokens:120,at:now};bucket.tokens=Math.min(120,bucket.tokens+Math.max(0,now-bucket.at)*.12);bucket.at=now;if(bucket.tokens<1)return false;bucket.tokens--;return true;}
 onAuth(client,options){if(options.code!==this.session.code)throw new Error('ルームコードが一致しません');if(!this.session.members.size&&options.ticket!==this.ticket)throw new Error('作成者の認証が必要です');return true;}
 onJoin(client,options){this.session.add(client.sessionId,options.name);this.expiry.clear();this.broadcastLobby();}
 broadcastLobby(){this.broadcast('lobby',this.session.lobby());}
 async onLeave(client,consented){this.session.connection(client.sessionId,false);this.broadcastLobby();if(!consented){try{await this.allowReconnection(client,20);this.session.connection(client.sessionId,true);this.broadcastLobby();this.broadcast('snapshot',this.session.snapshot());return;}catch{}}
  const m=this.session.members.get(client.sessionId);if(m&&this.session.phase==='MATCH'){const p=this.session.sim.players[m.slot];p.bot=true;p.name=`CPU ${m.slot+1}`;}this.session.remove(client.sessionId);this.broadcastLobby();if(!this.session.members.size)this.disconnect();
 }
 onDispose(){rooms.delete(this.session.code);}
}
