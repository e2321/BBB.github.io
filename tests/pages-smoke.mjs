// A strict static server reproduces Pages: no Vite development server or SPA fallback.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {chromium} from '@playwright/test';
import {checkPages} from '../tools/check-pages.mjs';

const build=await checkPages(),root=resolve('dist'),prefix='/submission-check/',results=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.startsWith(prefix))path=path.slice(prefix.length);else path=path.slice(1);if(!path||path.endsWith('/'))path+='index.html';const file=resolve(root,path);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}const info=await stat(file);if(!info.isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':info.size});createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({...(process.platform==='win32'?{channel:'msedge'}:{}),headless:true,args:['--use-angle=swiftshader','--enable-webgl']});
 await mkdir('tests/screenshots',{recursive:true});
 for(const mount of ['/',prefix])for(const mode of ['PROLOGUE','BBB','KITCHEN']){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],failures=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>failures.push(`${r.failure()?.errorText} ${r.url()}`));page.on('request',r=>requests.push(r.url()));
  await page.goto(`${origin}${mount}${mount==='/'?'':'index.html'}`);await page.locator('#quality').selectOption('LOW');await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:180000});
  assert.equal(await page.evaluate(()=>typeof window.__game),'undefined','Development hook shipped');
  if(mode==='PROLOGUE')await page.locator('#prologueMode').click();if(mode==='KITCHEN')await page.locator('#battleStageKitchen').click();await page.locator('#start').click();if(mode==='PROLOGUE')await page.keyboard.press('Escape');
  assert.equal(await page.locator(mode!=='PROLOGUE'?'#battleHUD':'#hud').isVisible(),true);assert.equal(await page.locator('#overlay').isVisible(),false);
  if(mode!=='PROLOGUE'){await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('#battleRankingRows .ranking-self').textContent.includes('10 BP'),null,{timeout:15000});await page.keyboard.press('v');await page.keyboard.press('v');await page.mouse.click(640,400);assert.equal(await page.locator('#battleRankingRows div').count(),4);}
  else{await page.keyboard.press('a');await page.waitForTimeout(350);await page.keyboard.press('d');await page.waitForFunction(()=>parseInt(document.querySelector('#waterText').textContent)<100);}
  assert.equal(await page.evaluate(()=>document.getElementById('world').getContext('webgl2').isContextLost()),false);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`tests/screenshots/pages-${mount==='/'?'root':'subpath'}-${mode.toLowerCase()}.png`});
  for(const requested of requests){const url=new URL(requested);if(url.protocol==='data:'||url.protocol==='blob:')continue;assert.equal(url.origin,origin,`External request: ${requested}`);assert.ok(url.pathname.startsWith(mount),`Escaped repository path: ${requested}`);}
  for(const name of ['madai.glb','chef.glb'])assert.ok(requests.some(url=>url.endsWith(`/assets/models/${name}`)),`Model never requested: ${name}`);
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);results.push({path:mount,mode,modelReady:true,started:true,webgl:true,localAssetsOnly:true,debugHook:false,errors,failures});await page.close();
 }
 const report={build,checks:results,unverified:['GitHub Actions execution and public github.io HTTPS URL for these changes (not deployed)']};await writeFile('tests/pages-smoke-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
