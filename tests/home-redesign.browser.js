import {openModes} from './home-browser.js';
import {test,expect} from '@playwright/test';
const ready=async page=>{await page.goto('/');await page.waitForFunction(()=>window.__game?.snapshot().assetReady,{timeout:120000});};
test('hero home, owned arrows, mode sheet and return preserve a single render loop',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await expect(page.locator('#homeModes')).toBeVisible();await expect(page.locator('#prologueMode')).not.toBeVisible();await expect(page.locator('#homePreview')).toBeVisible();
 const initial=await page.locator('#selectedCharacterName').textContent();await page.locator('#characterNext').click();await expect(page.locator('#selectedCharacterName')).not.toHaveText(initial);await page.locator('#characterPrevious').click();await expect(page.locator('#selectedCharacterName')).toHaveText(initial);
 await page.locator('#homeModes').click();await expect(page.locator('#prologueMode')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#modeSheet')).toBeHidden();await expect(page.locator('#homeModes')).toBeFocused();
 await page.locator('#homeModes').click();await openModes(page);await page.locator('#prologueMode').click();await page.locator('#homePlay').click();await expect(page.locator('#overlay')).toBeHidden();await page.evaluate(()=>window.__game.returnTitle());await expect(page.locator('#homeModes')).toBeVisible();expect(await page.evaluate(()=>window.__game.renderDiagnostics().activeLoops)).toBe(1);expect(errors).toEqual([]);
});
for(const [name,width,height]of [['phone',844,390],['tablet',1024,768]])test(name+' compact touch lesson and home scroll',async({page})=>{
 await page.setViewportSize({width,height});await page.addInitScript(()=>Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}));await ready(page);
 const home=page.locator('#overlay');expect(await home.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await home.evaluate(e=>e.scrollTop=0);expect(await page.locator('h1').evaluate(e=>e.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
 await page.locator('#homeModes').click();await openModes(page);await page.locator('#prologueMode').click();await page.locator('#homePlay').click();await page.waitForTimeout(6000);const panel=page.locator('#tutorialHUD');expect(await panel.evaluate(e=>e.getBoundingClientRect().height)).toBeLessThanOrEqual(height*.31);expect(await page.locator('#tutorialInstruction').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeLessThanOrEqual(14);await expect(page.locator('#mobileBitan')).toBeVisible();
});
