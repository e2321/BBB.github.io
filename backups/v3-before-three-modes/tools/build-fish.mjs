import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
let executable=process.env.BLENDER_PATH||'blender';
if(!process.env.BLENDER_PATH&&process.platform==='win32'){
 const root='C:/Program Files/Blender Foundation';
 if(fs.existsSync(root)){const folders=fs.readdirSync(root).filter(n=>n.startsWith('Blender ')).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));for(const folder of folders){const file=path.join(root,folder,'blender.exe');if(fs.existsSync(file)){executable=file;break;}}}
}
const choice=process.argv[2]||'all';
if(!['all','fish','chef'].includes(choice)){console.error('Usage: node tools/build-fish.mjs [all|fish|chef]');process.exit(1);}
for(const model of choice==='all'?['fish','chef']:[choice]){
 const result=spawnSync(executable,['--background','--factory-startup','--python',path.resolve(`tools/build_${model}.py`)],{stdio:'inherit'});
 if(result.error){console.error('Blenderを起動できません。Blenderをインストールし、BLENDER_PATHに実行ファイルの絶対パスを指定してください。');console.error(result.error.message);process.exit(1);}
 if(result.status!==0)process.exit(result.status??1);
}
