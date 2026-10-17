// Shared entry points for the hero home. No game/debug state is changed here.
export async function openModes(page){if(!await page.locator('#modeSheet').isVisible())await page.locator('#homeModes').click();}
export async function setHomeQuality(page,value){if(await page.locator('#modeSheet').isVisible())await page.locator('#modeSheetClose').click();await page.locator('#homeSettings').click();await page.locator('#quality').selectOption(value);await page.locator('#homePanelClose').click();}
