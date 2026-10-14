import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});
const results=[];
try{
 for(const mode of ['ESCAPE','SURVIVAL']){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push(`${r.status()} ${r.url()}`);});
  await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4174/');await page.locator('#quality').selectOption('LOW');await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:150000});
  assert.equal(await page.evaluate(()=>typeof window.__game),'undefined');
  if(mode==='SURVIVAL')await page.locator('#survivalMode').click();
  await page.locator('#start').click();await page.keyboard.press('Escape');await page.keyboard.press('a');await page.waitForTimeout(350);await page.keyboard.press('d');
  assert.equal(await page.locator('#hud').isVisible(),true);assert.equal(await page.locator('#overlay').isVisible(),false);
  await page.screenshot({path:`tests/screenshots/v3-production-${mode.toLowerCase()}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);results.push({mode,modelReady:true,hud:true,debugHook:false,errors,badResponses});await page.close();
 }
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
