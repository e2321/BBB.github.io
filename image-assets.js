// Vite enumerates existing files. An absent optional photo creates no HTTP request.
const files=import.meta.glob('./assets/images/*',{eager:true,query:'?url',import:'default'});
const find=(names)=>{for(const n of names){const key=Object.keys(files).find(p=>p.endsWith('/'+n));if(key)return files[key];}return null;};
export const imageAssets={grilled:find(['grilled_fish.png','grilled_fish.png.jpg','grilled_fish.jpg']),sashimi:find(['sashimi.png','sashimi.jpg'])};
