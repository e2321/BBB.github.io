// Presentation data is independent of tutorial simulation and reusable by future modes.
export const DEATH_PRESENTATIONS={
 CAPTURE:{title:'捕まりました',eyebrow:'CAUGHT BY THE CHEF',subtitle:'手が伸びた瞬間が、最後のチャンス。',effect:'capture'},
 KNIFE:{title:'刺身になりました',eyebrow:'A BEAUTIFULLY PLATED END',subtitle:'次は包丁の予告線から、跳ねて逃げよう。',effect:'sashimi',image:'assets/images/sashimi.png',alt:'白い器に美しく盛り付けられたマダイの刺身'},
 FIRE:{title:'焼き魚になりました',eyebrow:'TOO CLOSE TO THE FLAME',subtitle:'炎が消えるタイミングを見て、次は慎重に。',effect:'grilled',image:'assets/images/grilled_fish.jpg',alt:'美しく盛り付けられた焼き魚'},
 DRY:{title:'干からびました',eyebrow:'OUT OF MOISTURE',subtitle:'道中の水たまりで、潤いを取り戻そう。',effect:'dry'},
 FALL:{title:'台から落ちました',eyebrow:'MISSED THE LANDING',subtitle:'着地点を見て、空中でもう一度A / D。',effect:'fall'},
};
export const deathPresentation=cause=>DEATH_PRESENTATIONS[cause]||DEATH_PRESENTATIONS.FALL;
