export const FRIEND_CODE_FORMAT='digits-2-v1';
export const isFriendCode=value=>typeof value==='string'&&/^[0-9]{2}$/.test(value);
export function requireFriendCode(value){if(!isFriendCode(value))throw new Error('サーバーが旧形式または不正な友達コードを返しました。公開者がRenderのbbb-friends-serverを最新コードへ再デプロイしてください。コードは切り詰めず、接続を中止しました。');return value;}
