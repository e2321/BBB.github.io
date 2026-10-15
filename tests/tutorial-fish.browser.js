import {test,expect} from '@playwright/test';
test('tutorial-only private fish geometry, natural surface and unchanged shared factory',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#quality').selectOption('LOW');await page.waitForFunction(()=>window.__game?.snapshot().assetReady,null,{timeout:150000});
 const before=await page.evaluate(()=>{const b=window.__game.battle;return b.models.map(f=>{let a=[];f.root.traverse(m=>{if(m.isMesh)a.push([m.geometry.uuid,m.geometry.attributes.position.count,m.material.roughness,m.material.color.getHex()]);});return a;});});
 await page.locator('#prologueMode').click();await page.locator('#start').click();
 const result=await page.evaluate(()=>{const b=window.__game.battle;b.sim.debugPaused=true;const f=b.models[0],source=[];b.source.root.traverse(m=>{if(m.isMesh)source.push(m.geometry);});let privateBuffers=true,skinRoughness=0,colors=false;f.root.traverse(m=>{if(m.isMesh){privateBuffers&&=!source.includes(m.geometry);if(/skin/i.test(m.material.name)){skinRoughness=m.material.roughness;colors=!!m.geometry.attributes.color;}}});b.updateCamera=()=>{const p=b.models[0].root.position;b.camera.position.set(p.x+2.1,p.y+1.9,p.z+1.2);b.camera.lookAt(p.x,p.y,p.z);};return {privateBuffers,skinRoughness,colors,onlyPlayer:b.models.map(m=>!!m.tutorialQuality)};});
 expect(result.privateBuffers).toBe(true);expect(result.colors).toBe(true);expect(result.skinRoughness).toBeGreaterThan(.5);expect(result.onlyPlayer).toEqual([true,false,false,false]);
 await page.waitForTimeout(500);await page.screenshot({path:'tests/screenshots/tutorial-fish-quality.png'});
 for(const key of ['a','d','Space']){await page.keyboard.press(key);await page.evaluate(()=>window.__game.battle.step(35));}
 await page.evaluate(()=>window.__game.returnTitle());await page.locator('#battleMode').click();const after=await page.evaluate(()=>window.__game.battle.models.map(f=>{let a=[];f.root.traverse(m=>{if(m.isMesh)a.push([m.geometry.uuid,m.geometry.attributes.position.count,m.material.roughness,m.material.color.getHex()]);});return a;}));expect(after).toEqual(before);expect(errors).toEqual([]);
});
