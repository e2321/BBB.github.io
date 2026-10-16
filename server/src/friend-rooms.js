import {GAME_PROTOCOL} from '../../game-protocol.js';
import {randomBytes} from 'node:crypto';
import {privateRoomCode} from './session.js';
import {FRIEND_CODE_FORMAT} from '../../friend-code.js';

// Synchronous reservation before the first await makes allocation atomic in one process.
export async function createFriendRoom(rooms,reserved,create){const code=privateRoomCode(new Set([...rooms.keys(),...reserved]));reserved.add(code);const ticket=randomBytes(24).toString('hex');try{const room=await create({code,ticket});return {code,roomId:room.roomId,ticket};}finally{reserved.delete(code);}}
export function healthInfo(env=process.env){return {ok:true,version:1,gameProtocol:GAME_PROTOCOL,friendCodeFormat:FRIEND_CODE_FORMAT,revision:/^[0-9a-f]{40}$/i.test(env.RENDER_GIT_COMMIT||'')?env.RENDER_GIT_COMMIT:null};}
export class JoinAttempts{
 constructor(limit=30,window=60000){this.limit=limit;this.window=window;this.entries=new Map();}
 allow(key,now=Date.now()){for(const [k,v]of this.entries)if(v.until<=now)this.entries.delete(k);let entry=this.entries.get(key);if(!entry){if(this.entries.size>=2000)return false;entry={count:0,until:now+this.window};this.entries.set(key,entry);}return ++entry.count<=this.limit;}
}
// Only Render's trusted reverse proxy may supply forwarded IPs. Ignore them locally.
export function joinIP(headers,remote,env=process.env){const forwarded=headers?.['x-forwarded-for'];return env.RENDER==='true'&&typeof forwarded==='string'?forwarded.split(',').at(-1).trim()||remote||'unknown':remote||'unknown';}
export const joinAttempts=new JoinAttempts();
