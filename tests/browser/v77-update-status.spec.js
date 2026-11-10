const {test,expect}=require('playwright/test');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
test.use({serviceWorkers:'allow'});
test.describe.configure({timeout:60000});
let server,origin,old,broken;
const root=path.resolve(__dirname,'../..'),current=require('../../package.json').version;
test.beforeEach(async()=>{
 old=false;broken=false;
 server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(broken&&pathname==='/release.json'){res.writeHead(503).end();return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,bytes)=>{
   if(error){res.writeHead(404).end();return;}
   res.setHeader('Cache-Control','no-store');
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
   if(old&&pathname==='/sw.js')bytes=Buffer.from(bytes.toString().replace('loadnote-v'+current,'loadnote-v7.6.0'));
   if(old&&pathname==='/src/core/loadnote-core.js')bytes=Buffer.from(bytes.toString().replace("RELEASE_VERSION = '"+current+"'","RELEASE_VERSION = '7.6.0'"));
   res.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
});
async function stop(){if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
test.afterEach(stop);
async function open(page){
 await page.goto(origin);await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.locator('#device-status-details>summary').click();
 await expect(page.locator('#update-check-status')).toHaveText('Offline app files are ready.',{timeout:30000});
}
test('explicit live check bypasses a stale cached manifest and failure never claims current',async({page})=>{
 await open(page);await expect(page.locator('#app-version-status')).toContainText('Tap Check for updates');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(async()=>{const names=await caches.keys();const cache=await caches.open(names.find(name=>name.startsWith('loadnote-v')));await cache.put(new URL('./release.json',location.href),new Response(JSON.stringify({version:'0.1.0'})));});
 await page.locator('#check-app-update').click();await expect(page.locator('#app-version-status')).toContainText('Live v'+current+'. You have the current version.');
 broken=true;await page.locator('#check-app-update').click();await expect(page.locator('#app-version-status')).toContainText('could not be verified');
 await expect(page.locator('#check-app-update')).toBeEnabled();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
for(const unit of ['kg','lb'])test('waiting update preserves unfinished '+unit+' entry through explicit save and reload',async({page})=>{
 old=true;await open(page);
 await page.evaluate(unit=>{showTab('workouts');showSubTab('workouts','wo-log');setUnit(unit);},unit);
 await page.locator('.ex-name').fill('Competition bench');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill(unit==='lb'?'225':'100');await page.locator('.set-rpe').fill('8');
 const readDraft=()=>page.evaluate(()=>{const draft=captureLoggerDraft();delete draft.updatedAt;return draft;});
 const before=await readDraft();
 old=false;await page.locator('#check-app-update').click();
 await expect(page.locator('#apply-app-update')).toBeVisible({timeout:30000});
 await expect(page.locator('#app-version-status')).toContainText('Installed v7.6.0');
 await expect(page.locator('#app-version-status')).toContainText('Live v'+current);
 expect(await readDraft()).toEqual(before);
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await Promise.all([page.waitForEvent('load'),page.locator('#apply-app-update').click()]);
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteCore?.RELEASE_VERSION)).toBe(current);
 await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.ex-name')).toHaveValue('Competition bench');
 await expect(page.locator('.set-weight')).toHaveValue(unit==='lb'?'225':'100');await expect(page.locator('.set-reps')).toHaveValue('5');await expect(page.locator('.set-rpe')).toHaveValue('8');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 // Stop the origin rather than relying on WebKit's service-worker offline emulation.
 await page.locator('#device-status-details>summary').click();await expect(page.locator('#update-check-status')).toHaveText('Offline app files are ready.',{timeout:30000});
 await stop();const response=await page.reload();expect(response.fromServiceWorker()).toBe(true);
 await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.set-weight')).toHaveValue(unit==='lb'?'225':'100');
 await page.locator('#device-status-details>summary').click();await page.locator('#check-app-update').click();
 await expect(page.locator('#app-version-status')).toContainText('could not be verified');
});
