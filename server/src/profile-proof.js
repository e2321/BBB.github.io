import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {emptyStats,sanitizeStats,equipment,unlocked,addReport} from '../../progression.js';
const configured=process.env.BBB_PROFILE_SECRET;
// Stable across deployments only when Render has a persistent secret configured.
const secret=configured&&configured.length>=32?configured:randomBytes(32).toString('hex');
export const persistentProofs=!!configured&&configured.length>=32;
export function signProfile(stats){const data=Buffer.from(JSON.stringify({v:1,stats:sanitizeStats(stats)})).toString('base64url');return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');}
export function verifyProfile(token){try{if(typeof token!=='string'||token.length>12000)return emptyStats();const [data,mac,...extra]=token.split('.');if(extra.length||!data||!mac)return emptyStats();const expected=createHmac('sha256',secret).update(data).digest(),actual=Buffer.from(mac,'base64url');if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return emptyStats();const body=JSON.parse(Buffer.from(data,'base64url'));return body.v===1?sanitizeStats(body.stats):emptyStats();}catch{return emptyStats();}}
export function verifiedEquipment(stats,raw){return equipment(raw,id=>unlocked(stats,id));}
export {addReport};
