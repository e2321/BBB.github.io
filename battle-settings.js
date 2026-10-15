import {maxHPValue} from './battle-rules.js';
export function loadMaxHP(storage){try{storage??=globalThis.localStorage;return maxHPValue(Number(storage?.getItem('bbb.maxHP')));}catch{return 3;}}
export function saveMaxHP(value,storage){const hp=maxHPValue(Number(value));try{storage??=globalThis.localStorage;storage?.setItem('bbb.maxHP',String(hp));}catch{}return hp;}
export function loadRenderQuality(storage){try{storage??=globalThis.localStorage;const value=storage?.getItem('bbb.renderQuality')||storage?.getItem('bbb.modelQuality')?.toUpperCase();return ['LOW','MEDIUM','HIGH'].includes(value)?value:'LOW';}catch{return 'LOW';}}
export function saveRenderQuality(value,storage){if(!['LOW','MEDIUM','HIGH'].includes(value))return;try{storage??=globalThis.localStorage;storage?.setItem('bbb.renderQuality',value);}catch{}}
