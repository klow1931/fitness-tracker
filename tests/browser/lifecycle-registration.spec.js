const {test,expect}=require('playwright/test');
test('declined service-worker registration leaves focus and navigation usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{navigator.serviceWorker.register=async()=>undefined;});
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));showTab('coach');showTab('profile');});
 await expect(page.locator('#panel-profile')).toBeVisible();
 expect(errors).toEqual([]);
});
