// Shared reward arithmetic; online callers use the server's earned-BP record.
export const COIN_MULTIPLIERS=Object.freeze({bronze:1,silver:1.2,gold:1.5,platinum:1.8,diamond:2.2,master:3});
export const rewardRank=id=>Object.hasOwn(COIN_MULTIPLIERS,id)?id:'bronze';
export function bpCoinReward(earnedBP,rank='bronze'){
 const bp=Number.isSafeInteger(earnedBP)&&earnedBP>=0?Math.min(earnedBP,1e8):0;
 rank=rewardRank(rank);const multiplier=COIN_MULTIPLIERS[rank],baseCoins=bp/10;
 return {earnedBP:bp,baseCoins,multiplier,rewardRank:rank,coins:Math.floor(baseCoins*multiplier+1e-9)};
}
