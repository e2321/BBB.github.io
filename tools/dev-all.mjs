import {spawn} from 'node:child_process';
import net from 'node:net';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function available(port,host='127.0.0.1'){
 return new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',error=>reject(new Error(`ポート${port}を使用できません（${error.code}）。起動済みのVite / Colyseusを終了してから再実行してください。`)));probe.listen({port,host,exclusive:true},()=>probe.close(resolve));});
}
export function developmentEnv(env=process.env){return {...env,NODE_ENV:'development',PORT:'2567',VITE_ONLINE_SERVER_URL:'ws://localhost:2567'};}
export async function main(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 for(const dependency of ['node_modules/vite/bin/vite.js','server/node_modules/@colyseus/core/package.json'])if(!existsSync(path.join(root,dependency)))throw new Error('依存関係がありません。npm install と npm run server:install を先に実行してください。');
 await available(5173);await available(2567,'0.0.0.0');
 const children=[];let stopping=false;
 const stop=async(code=0)=>{if(stopping)return;stopping=true;await Promise.all(children.map(child=>new Promise(resolve=>{if(child.exitCode!==null)return resolve();if(process.platform==='win32'){const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});killer.once('error',()=>{child.kill();resolve();});killer.once('exit',resolve);}else{try{process.kill(-child.pid,'SIGTERM');}catch{}const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}resolve();},2000);child.once('exit',()=>{clearTimeout(timer);resolve();});}})));process.exitCode=code;};
 process.once('SIGINT',()=>void stop());process.once('SIGTERM',()=>void stop());
 for(const [name,cwd,args] of [['Colyseus',path.join(root,'server'),['src/index.js']],['Vite',root,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort','--configLoader','native']]]){
  const child=spawn(process.execPath,args,{cwd,env:developmentEnv(),stdio:'inherit',windowsHide:true,detached:process.platform!=='win32'});children.push(child);
  child.once('error',error=>{console.error(`${name}: ${error.message}`);void stop(1);});child.once('exit',(code)=>{if(!stopping){console.error(`${name}が終了したため、開発サーバーを停止します。`);void stop(code||1);}});
 }
 console.log('BBB: http://127.0.0.1:5173/ ／ Colyseus: ws://localhost:2567\n両方を終了するには Ctrl+C。');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
