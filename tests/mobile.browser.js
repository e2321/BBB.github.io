import {test,expect} from '@playwright/test';
test.use({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
async function ready(page){await page.goto('/');await page.waitForFunction(()=>window.__game?.snapshot().assetReady,null,{timeout:150000});await expect(page.locator('#prologueMode')).toHaveAttribute('aria-pressed','true');await page.locator('#start').tap();await expect(page.locator('#mobileBitan')).toBeVisible();}
test('mobile one-tap/hold, water gauge clearance and touch tutorial copy',async({page,context})=>{
 await ready(page);await page.locator('#mobileBitan').tap();await expect.poll(()=>page.evaluate(()=>window.__game.battle.sim.players[0].points)).toBe(10);await expect(page.locator('#tutorialInstruction')).toContainText('ビタンボタン');await expect(page.locator('#tutorialDetail')).toContainText('1タップで1回');
 const bitan=await page.locator('#mobileBitan').boundingBox(),water=await page.locator('#battleWater').boundingBox(),attack=await page.locator('#mobileAttack').boundingBox();expect(bitan.x+bitan.width).toBeLessThan(water.x);expect(water.x+water.width).toBeLessThan(attack.x);
 const cdp=await context.newCDPSession(page),point={x:bitan.x+bitan.width/2,y:bitan.y+bitan.height/2,id:1};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await page.waitForTimeout(800);const score=await page.evaluate(()=>window.__game.battle.sim.players[0].points);await page.waitForTimeout(900);expect(await page.evaluate(()=>window.__game.battle.sim.players[0].points)).toBe(score);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(score).toBe(20);expect(await page.evaluate(()=>document.pointerLockElement===null)).toBe(true);
});
test('mobile multi-touch camera, orientation and pause preserve the match without stuck inputs',async({page,context})=>{
 await ready(page);const cdp=await context.newCDPSession(page),b=await page.locator('#mobileBitan').boundingBox(),left={x:b.x+b.width/2,y:b.y+b.height/2,id:1},right={x:740,y:145,id:2};const before=await page.evaluate(()=>window.__game.battle.yaw);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left,{...right,x:785,y:155}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.evaluate(()=>window.__game.battle.yaw)).not.toBe(before);
 const time=await page.evaluate(()=>window.__game.battle.sim.time);await page.setViewportSize({width:390,height:844});await expect(page.locator('#mobilePortrait')).toBeVisible();expect(await page.evaluate(()=>window.__game.battle.sim.time)).toBeGreaterThanOrEqual(time);await page.setViewportSize({width:844,height:390});await page.locator('[data-mobile-action=menu]').tap();await expect(page.locator('#battlePause')).toBeVisible();await page.locator('#battleContinue').tap();await expect(page.locator('#mobileBitan')).toBeVisible();
});

test('mobile settings persist sensitivity/layout, cancel edits and preserve relative layout across rotation',async({page,context})=>{
 await page.goto('/');await page.locator('#overlay [data-open-mobile-settings]').tap();await expect(page.locator('#mobileSettings')).toBeVisible();
 await page.locator('#mobileSensitivity').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(page.locator('#mobileSensitivityValue')).toHaveText('2.0倍');
 await page.locator('#mobileEditLayout').tap();const b=page.locator('[data-layout-button=bitan]'),r=await b.boundingBox(),cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:r.x+r.width/2,y:r.y+r.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:220,y:280}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.locator('#mobileButtonSize').evaluate(el=>{el.value='1.4';el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(page.locator('#mobileButtonSizeValue')).toHaveText('140%');await page.locator('#mobileLayoutSave').tap();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbb.mobileControls.v1')));expect(saved.buttons.bitan.scale).toBe(1.4);expect(saved.buttons.bitan.x).toBeGreaterThan(.2);
 await page.locator('#mobileEditLayout').tap();await page.locator('#mobileLayoutReset').tap();await page.locator('#mobileLayoutCancel').tap();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bbb.mobileControls.v1')))).toEqual(saved);
 await page.reload();await page.locator('#overlay [data-open-mobile-settings]').tap();await expect(page.locator('#mobileSensitivity')).toHaveValue('2');await page.locator('#mobileEditLayout').tap();await page.setViewportSize({width:390,height:844});const box=await b.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);expect(box.y+box.height).toBeLessThanOrEqual(844);
});


test('mobile has no jump control, can enable auto fire and retains the manual water tutorial exercise',async({page})=>{
 await ready(page);await expect(page.locator('[data-mobile-action=jump]')).toHaveCount(0);
 await page.locator('[data-mobile-action=menu]').tap();await page.locator('#battlePause [data-open-mobile-settings]').tap();await page.locator('#mobileAutoFire').check();await page.locator('#mobileSettingsClose').tap();await page.locator('#battleContinue').tap();await expect(page.locator('#mobileAutoStatus')).toBeVisible();await expect(page.locator('#mobileAttack')).toBeHidden();
 await page.evaluate(()=>{const b=window.__game.battle;while(b.tutorial.phase<3)b.tutorial.next();b.events();b.sim.projectiles.forEach(k=>k.active=false);b.sim.players[0].nextFire=0;});await expect.poll(()=>page.evaluate(()=>window.__game.battle.sim.projectiles.some(k=>k.active))).toBe(true);
 await page.locator('[data-mobile-action=menu]').tap();await page.locator('#battlePause [data-open-mobile-settings]').tap();await page.locator('#mobileAutoFire').uncheck();await page.locator('#mobileSettingsClose').tap();await page.locator('#battleContinue').tap();await expect(page.locator('#mobileAttack')).toBeVisible();await expect(page.locator('#mobileAutoStatus')).toBeHidden();
});
