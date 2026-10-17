import {knownWeapon,weaponDefinition} from '../../weapon-registry.js';
// Local browser inventory is not proof. This allowlist is server-owned only.
// No client payload, profile stats proof, or admin TEST grant can populate it.
export function authorizeWeapon(requested,serverOwned=new Set(['knife'])){const id=knownWeapon(requested);return weaponDefinition(id)?.enabled&&serverOwned.has(id)?id:'knife';}
export function weaponSelection(requested){const requestedWeapon=knownWeapon(requested),weapon=authorizeWeapon(requestedWeapon);return {requestedWeapon,weapon,weaponNotice:requestedWeapon!==weapon?'新武器はオンラインの所持確認が未対応のため、この試合では包丁を使用します。':''};}
