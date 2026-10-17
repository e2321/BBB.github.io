// Metadata only. Clients and the authoritative simulation share these definitions.
const entry=(weaponId,name,speed,hitbox,interval,description,rotation,effect,color)=>Object.freeze({id:weaponId,weaponId,type:'weapon',name,enabled:true,defaultOwned:weaponId==='knife',projectileSpeedMultiplier:speed,hitboxScale:hitbox,fireIntervalMultiplier:interval,damage:1,modelId:weaponId,displayScale:1.5,muzzleOffset:{side:.35,up:.10},initialRotation:[0,0,0],rotationSpeed:rotation,projectileEffect:effect,hitEffect:effect,soundId:weaponId==='knife'?'hit':'metal',soundPitch:weaponId==='fork'?1.3:weaponId==='ladle'?.8:weaponId==='spatula'?.95:1,color,description,thumbnail:`assets/weapons/${weaponId}.svg`});
export const WEAPONS=Object.freeze([
 entry('knife','包丁',1,1,1,'扱いやすい標準の投擲武器。',[15,0,0],'steel','#dbe9ef'),
 entry('fork','フォーク',1.3,.7,1.1,'速く細い弾。正確に狙う人向け。',[8,0,20],'fork','#a3e6ff'),
 entry('ladle','おたま',.75,1.4,1.2,'大きめの判定。弾が遅く、回避もされやすい。',[11,5,0],'ladle','#93d6e0'),
 entry('spatula','フライ返し',.9,1.6,1.5,'広い判定と遅い連射。',[0,0,13],'spatula','#ffc788')]);
const map=new Map(WEAPONS.map(w=>[w.id,w]));
export const weaponDefinition=id=>map.get(id);
export const knownWeapon=id=>map.has(id)?id:'knife';
export const weaponFor=id=>map.get(id)||map.get('knife');
export const visibleWeapon=(id,owns)=>owns(knownWeapon(id))?knownWeapon(id):'knife';
