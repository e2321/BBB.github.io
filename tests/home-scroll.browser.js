import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

// Exercise the real HTML and stylesheet cascade without loading WebGL/models/network.
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const css=['style.css','graphics.css','mobile.css','home.css','neon-home.css'].map(read).join('\n');
for(const [name,width,height,mobile] of [['desktop short',1280,600,false],['mobile landscape',844,390,true],['mobile tall landscape',900,500,true],['small landscape',568,320,true],['portrait',390,844,true],['iPad landscape',1024,768,true],['large tablet',1366,1024,true],['Android tablet',1280,800,true]]){
 test(name+': title, banner and final settings are reachable with no horizontal overflow',async({page})=>{
  await page.setViewportSize({width,height});await page.setContent(html);await page.addStyleTag({content:css});
  await page.evaluate(mobile=>{document.body.classList.toggle('mobile-ui',mobile);document.querySelector('#onlineMenu').hidden=false;document.querySelector('#onlineStatus').textContent='オンライン接続失敗：'+ 'connection-error/'.repeat(25);},mobile);
  const home=page.locator('#overlay');
  const top=await home.evaluate(el=>{el.scrollTop=0;return {top:el.querySelector('h1').getBoundingClientRect().top,x:el.scrollWidth,w:el.clientWidth,touch:getComputedStyle(el).touchAction};});
  expect(top.top).toBeGreaterThanOrEqual(0);expect(top.x).toBeLessThanOrEqual(top.w+1);expect(top.touch).toBe('pan-y');
  await expect(page.locator('.mobile-play-banner')).toContainText('PCでもスマホでもビタンビタン！');
  await home.evaluate(el=>el.scrollTop=el.scrollHeight);
  const end=await home.evaluate(el=>({bottom:el.querySelector('#homeModes').getBoundingClientRect().bottom,viewport:el.getBoundingClientRect().bottom}));expect(end.bottom).toBeLessThanOrEqual(end.viewport+1);
  await home.evaluate(el=>el.scrollTop=0);expect(await page.locator('h1').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.evaluate(()=>{const p=document.querySelector('#homePanel');p.hidden=false;document.querySelector('#homePanelContent').textContent='実績・カスタマイズ・設定 '.repeat(1000);});
  const panel=page.locator('#homePanel');expect(await panel.evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');await panel.evaluate(el=>el.scrollTop=el.scrollHeight);expect(await panel.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await page.setViewportSize({width:height,height:width});await home.evaluate(el=>el.scrollTop=0);expect(await home.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 });
}
