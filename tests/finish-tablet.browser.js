import {fileURLToPath} from 'node:url';
import {test,expect} from '@playwright/test';
async function ready(page){await page.goto('/');await page.waitForFunction(()=>window.__game?.snapshot().assetReady,null,{timeout:150000});}
test('real result screens, lobby replay and tutorial completion survive denied storage',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('test quota','QuotaExceededError');};});
 await page.locator('#battleMode').click();
 for(let round=0;round<3;round++){
  await page.locator('#start').click();await page.evaluate(()=>{const b=window.__game.battle;b.sim.state='PLAYING';b.jump('A');b.step(45);b.sim.time=89.99;b.step(1);});
  await expect(page.locator('#battleResults')).toBeVisible();await expect(page.locator('#bpFloats > *')).toHaveCount(0);await expect(page.locator('#battleResultRows tr')).toHaveCount(4);
  if(round<2){await page.locator('#battleLobbyReturn').click();await expect(page.locator('#battleLobby')).toBeVisible();}
 }
 await page.locator('#battleResultTitle').click();await expect(page.locator('#overlay')).toBeVisible();expect(await page.locator('#overlay').evaluate(el=>el.scrollTop)).toBe(0);
 await page.locator('#start').click();const result=await page.evaluate(async()=>{const b=window.__game.battle,{runTutorial}=await import('/tests/tutorial-controller.js');const result=runTutorial(b.sim,b.tutorial);b.update(0);return result;});
 expect(result.complete).toBe(true);expect(result.combo).toBe(0);await expect(page.locator('#tutorialResults')).toBeVisible();await page.locator('#tutorialHome').click();await expect(page.locator('#overlay')).toBeVisible();await page.locator('#start').click();await expect(page.locator('#tutorialHUD')).toBeVisible();
 expect(await page.evaluate(()=>window.__game.renderDiagnostics().activeLoops)).toBe(1);expect(errors).toEqual([]);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
});
test.describe('tablet touch',()=>{test.use({viewport:{width:1024,height:768},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 test('tablet taps and swipe survive rotation with bounded buttons and one renderer',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await page.locator('#battleMode').tap();await page.locator('#start').tap();await page.evaluate(()=>window.__game.battle.step(180));
  await expect(page.locator('#mobileBitan')).toBeVisible();await page.locator('#mobileBitan').tap();await expect.poll(()=>page.evaluate(()=>window.__game.battle.sim.players[0].points)).toBeGreaterThan(0);
  const before=await page.evaluate(()=>window.__game.battle.yaw),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:740,y:250,id:4}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:820,y:270,id:4}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.evaluate(()=>window.__game.battle.yaw)).not.toBe(before);
  await page.setViewportSize({width:768,height:1024});await expect(page.locator('#mobilePortrait')).toBeVisible();await page.setViewportSize({width:1180,height:820});await expect(page.locator('#mobilePortrait')).toBeHidden();
  for(const id of ['mobileBitan','mobileAttack']){const box=await page.locator('#'+id).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(1180);expect(box.y+box.height).toBeLessThanOrEqual(820);}
  await page.evaluate(()=>{const b=window.__game.battle,p=b.sim.players[0];if(p.dead)b.sim.respawn(p);p.invUntil=b.sim.time+1000;});await page.locator('#mobileBitan').tap();const d=await page.evaluate(()=>window.__game.renderDiagnostics());expect(d.activeLoops).toBe(1);expect(d.gameCanvasCount).toBe(1);expect(d.gameContextLost).toBe(false);expect(d.errors).toBe(0);expect(errors).toEqual([]);await page.screenshot({path:fileURLToPath(new URL('../../.cache/tablet-stability.png',import.meta.url))});
 });
});
