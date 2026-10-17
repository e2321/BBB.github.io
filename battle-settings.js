import {maxHPValue,validMaxHP} from './battle-rules.js';
export function loadMaxHP(storage){try{storage??=globalThis.localStorage;return maxHPValue(Number(storage?.getItem('bbb.maxHP')));}catch{return 3;}}
export function saveMaxHP(value,storage){const hp=maxHPValue(Number(value));try{storage??=globalThis.localStorage;storage?.setItem('bbb.maxHP',String(hp));}catch{}return hp;}
export function loadRenderQuality(storage){try{storage??=globalThis.localStorage;const value=storage?.getItem('bbb.renderQuality')||storage?.getItem('bbb.modelQuality')?.toUpperCase();return ['MEDIUM','HIGH','通常','標準','高','最高'].includes(value)?'MEDIUM':'LOW';}catch{return 'LOW';}}
export function saveRenderQuality(value,storage){value=['MEDIUM','HIGH'].includes(value)?'MEDIUM':'LOW';try{storage??=globalThis.localStorage;storage?.setItem('bbb.renderQuality',value);}catch{}}

// The current UI value is authoritative for the next match, even if persistence is blocked.
export function selectedMaxHP(element,storage){const value=Number(element?.value);return validMaxHP(value)?value:loadMaxHP(storage);}

export const chefCount=value=>Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=3?Number(value):2;
export function loadChefCount(storage){try{storage??=globalThis.localStorage;const v=storage?.getItem('bbb.chefCount');return v===null||v===undefined?2:chefCount(v);}catch{return 2;}}
export function saveChefCount(value,storage){const n=chefCount(value);try{(storage??globalThis.localStorage)?.setItem('bbb.chefCount',String(n));}catch{}return n;}

export function selectedChefCount(element,storage){const raw=element?.value,n=Number(raw);return raw!==undefined&&raw!==''&&Number.isInteger(n)&&n>=0&&n<=3?n:loadChefCount(storage);}
