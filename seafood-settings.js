export const SEAFOOD=Object.freeze([{id:'fish',name:'魚'},{id:'squid',name:'イカ'}]);
export const MODEL_QUALITY=Object.freeze({low:{radial:5,curve:4,animationHz:20,shadows:false},medium:{radial:10,curve:8,animationHz:40,shadows:true},high:{radial:18,curve:16,animationHz:60,shadows:true}});
export const characterId=value=>SEAFOOD.some(c=>c.id===value)?value:'fish';
export const qualityId=value=>Object.hasOwn(MODEL_QUALITY,value)?value:'low';
export function loadSeafoodSettings(storage){let character='fish',quality='low';try{storage??=globalThis.localStorage;character=characterId(storage?.getItem('bbb.character'));quality=qualityId(storage?.getItem('bbb.modelQuality'));}catch{}return {character,quality};}
export function saveSeafoodSettings(settings,storage){try{storage??=globalThis.localStorage;storage?.setItem('bbb.character',characterId(settings.character));storage?.setItem('bbb.modelQuality',qualityId(settings.quality));}catch{}}
// Cosmetic assignment does not consume the gameplay random stream.
export const cpuCharacter=(seed,id)=>SEAFOOD[((seed>>>0)+Math.imul(id+1,2654435761)>>>0)%SEAFOOD.length].id;
