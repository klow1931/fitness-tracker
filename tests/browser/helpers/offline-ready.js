/* Page control is not proof that the offline file set has finished downloading. */
const {expect}=require('playwright/test');
async function waitForOfflineReady(page){
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:30000}).toBe(true);
 await page.evaluate(()=>navigator.serviceWorker.controller.postMessage({type:'CHECK_OFFLINE_CACHE'}));
 await expect(page.locator('#update-check-status')).toContainText('Offline app files are ready',{timeout:30000});
}
module.exports={waitForOfflineReady};
