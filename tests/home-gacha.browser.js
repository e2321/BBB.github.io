import {test,expect} from '@playwright/test';
test('home opens the real gacha, explains insufficient coins, draws once and persists the result',async({page})=>{
 const errors=[],models=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/characters/')&&r.url().includes('.glb'))models.push(r.url());});
 await page.goto('/');await page.waitForFunction(()=>window.__game?.snapshot().assetReady,null,{timeout:150000});
 await expect(page.locator('#homeGacha')).toContainText('ガチャ');await expect(page.locator('#homeGachaCoins')).toHaveText('0');await page.locator('#homeGacha').click();
 await expect(page.locator('#homePanelTitle')).toHaveText('海のなかまたちガチャ');await expect(page.locator('#gachaDraw')).toBeDisabled();await expect(page.locator('#homePanelContent')).toContainText('あと100枚');
 await page.evaluate(async()=>{const {collection}=await import('/gacha-store.js');collection.claim('isolated-browser-test',100);Math.random=()=>.1;});await expect(page.locator('#homeGachaCoins')).toHaveText('100');await expect(page.locator('#gachaDraw')).toBeEnabled();
 await page.locator('#gachaDraw').click();await expect(page.locator('.gacha-fullscreen')).toBeVisible();await page.locator('.gacha-skip').click();await expect(page.locator('.gacha-result-card').first()).toContainText('NEW!');await expect(page.locator('#homeGachaCoins')).toHaveText('30');await expect(page.locator('#gachaDraw')).toBeDisabled();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbb.collection.v1')));expect(saved.draws).toBe(1);expect(saved.owned).toHaveLength(3);expect(['starfish','octopus']).toContain(saved.lastDraw.id);expect(models.every(url=>/starfish|octopus/.test(url))).toBe(true);await page.locator('.gacha-done').click();
 await page.locator('#homePanelClose').click();await page.reload();await page.waitForFunction(()=>window.__game?.snapshot().assetReady,null,{timeout:150000});await page.locator('#homeGacha').click();await expect(page.locator('.gacha-result-card').first()).toContainText('NEW!');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bbb.collection.v1')).draws)).toBe(1);expect(errors).toEqual([]);
});
