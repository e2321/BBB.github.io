// Edit each pool's category probabilities and relative item weights here.
// Within each category weights are normalized; defaults are never drawn.
const categories=()=>({character:.15,weapon:.35,splash:.30,presentation:.20});
export const GACHA_CONFIG=[
 {id:'sea',banner:'ocean.png',name:'海のなかまたちガチャ',enabled:true,category:categories(),items:{
 character:{starfish:1,octopus:1},weapon:{fork:8,ladle:6,spatula:6},
 splash:{'splash-rainbow':1,'splash-bubble':1,'splash-sparkle':1,'splash-ink':1},
 presentation:{'trail-prism':1,'hit-stars':1,'kill-confetti':1,'combo-glow':1}}},
 ...[['deep','深海ガチャ'],['crustacean','甲殻類ガチャ'],['fun','おもしろ海洋生物ガチャ']].map(([id,name])=>({id,name,banner:({deep:'deepsea.png',crustacean:'crustacean.jpg',fun:'funny.jpg'})[id],enabled:false,category:categories(),items:{character:{},weapon:{},splash:{},presentation:{}}}))];
export const CATEGORY_NAMES=Object.freeze({character:'キャラクター',weapon:'武器',splash:'水しぶき',presentation:'その他の演出'});
