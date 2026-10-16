import {CHARACTERS,knownCharacter} from './character-registry.js';
import {collection,CollectionStore} from './gacha-store.js';
export const SEAFOOD=CHARACTERS;
export const MODEL_QUALITY=Object.freeze({low:{radial:5,curve:4,animationHz:20,shadows:false},medium:{radial:10,curve:8,animationHz:40,shadows:true},high:{radial:18,curve:16,animationHz:60,shadows:true}});
export const characterId=value=>SEAFOOD.some(c=>c.id===value)?value:'fish';
export const qualityId=value=>['medium','high','normal','標準','通常','高','最高'].includes(value)?'medium':'low';
export function loadSeafoodSettings(storage){let character='fish',quality='low';try{storage??=globalThis.localStorage;character=characterId(storage?.getItem('bbb.character'));const owned=storage===globalThis.localStorage?collection:new CollectionStore(storage);if(!owned.owns(character))character='fish';quality=qualityId(storage?.getItem('bbb.renderQuality')?.toLowerCase()||storage?.getItem('bbb.modelQuality'));}catch{}return {character,quality};}
export function saveSeafoodSettings(settings,storage){try{storage??=globalThis.localStorage;const id=characterId(settings.character),owned=storage===globalThis.localStorage?collection:new CollectionStore(storage);if(owned.owns(id)){owned.select(id);storage?.setItem('bbb.character',id);}storage?.setItem('bbb.modelQuality',qualityId(settings.quality));}catch{}}
// Cosmetic assignment does not consume the gameplay random stream.
export const cpuCharacter=(seed,id)=>SEAFOOD[((seed>>>0)+Math.imul(id+1,2654435761)>>>0)%2].id;
