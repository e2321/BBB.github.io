// Metadata only: importing the catalogue never requests model assets.
const entry=(id,name,defaultOwned,weight,animation)=>Object.freeze({id,name,rarity:defaultOwned?'BASIC':'RARE',defaultOwned,gacha:{weight},modelURL:defaultOwned?null:`assets/characters/${id}.glb`,thumbnailURL:`assets/characters/${id}.svg`,animation:{type:animation},version:1,colliderProfile:'bbb-common',loadingState:'idle'});
export const CHARACTERS=Object.freeze([entry('fish','魚',true,0,'fish'),entry('squid','イカ',true,0,'squid'),entry('starfish','ヒトデ',false,50,'arms'),entry('octopus','タコ',false,50,'arms')]);
const byId=new Map(CHARACTERS.map(c=>[c.id,c]));
export const characterDefinition=id=>byId.get(id);
export const knownCharacter=id=>byId.has(id)?id:'fish';
export const assetURL=path=>(import.meta.env?.BASE_URL||'/')+path;
