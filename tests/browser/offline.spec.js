const {waitForOfflineReady}=require('./helpers/offline-ready');
const {runOfflineWorkout}=require('./helpers/offline-workout');
const {test,expect}=require('playwright/test');
const http=require('http'),fs=require('fs'),path=require('path');
test.use({serviceWorkers:'allow'});
test.describe.configure({mode:'serial'});
let server,origin,revision=0;
test.beforeAll(async()=>{
 if(process.env.LOADNOTE_OFFLINE_URL){origin=process.env.LOADNOTE_OFFLINE_URL;return;}
 const root=path.resolve(__dirname,'../..');
 server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.join(root,pathname==='/'?'index.html':pathname);
  try{let body=fs.readFileSync(file);if(pathname==='/sw.js'&&revision>0)body=Buffer.from(body.toString().replaceAll('loadnote-v'+require('../../package.json').version,`loadnote-test${revision}`));
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{if(server?.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}});
async function ready(page){await page.goto(origin);await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await waitForOfflineReady(page);await page.evaluate(()=>showTab('workouts'));}
test('Real assets recover exact offline workout and reconnect without duplicates',async({page,context,browserName},testInfo)=>{
 let stopped=false;
 const port=server?.address()?.port;
 const reconnect=async context=>{
  if(stopped){await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));stopped=false;}
  await context.setOffline(false);
 };
 await runOfflineWorkout({page,context,browserName},testInfo,{origin,reconnect,disconnect:async context=>{
  if(browserName==='webkit'){
   // Playwright WebKit rejects worker responses under setOffline (#42775).
   // Stop only this dedicated loopback origin; never pretend this is live/offline emulation.
   if(!server)throw Error('WebKit live offline emulation is unsupported; use Chromium live smoke');
   server.closeAllConnections();await new Promise(resolve=>server.close(resolve));stopped=true;
  }else await context.setOffline(true);
 }});
});
test('Update waits, blocks another tab and restores an entered draft',async({page,context})=>{
 await ready(page);await page.locator('.ex-name').fill('Update Bench');await page.locator('.set-reps').fill('6');
 const other=await context.newPage();await other.goto(origin);
 revision++;await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
 await expect(page.locator('#app-update')).toBeVisible();await expect(page.locator('.ex-name')).toHaveValue('Update Bench');
 await page.locator('#apply-app-update').click();await expect(page.locator('#app-update-status')).toContainText('Close other');await other.close();
 await Promise.all([page.waitForEvent('load'),page.locator('#apply-app-update').click()]);
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.ex-name')).toHaveValue('Update Bench');await expect(page.locator('.set-reps')).toHaveValue('6');
});

test('Returning to an installed app checks for a waiting update without reloading a draft',async({page})=>{
 await ready(page);
 await page.locator('.ex-name').fill('Keep My Draft');
 revision++;
 await page.evaluate(()=>{const clock=Date.now;Date.now=()=>clock()+61000;window.dispatchEvent(new Event('focus'));});
 await expect(page.locator('#app-update')).toBeVisible();
 await expect(page.locator('#app-update-status')).toContainText('newer Loadnote version');
 await expect(page.locator('.ex-name')).toHaveValue('Keep My Draft');
});

test('An athlete can check manually and repair missing offline files without changing the draft',async({page})=>{
 await ready(page);
 await page.locator('.ex-name').fill('Do Not Clear My Draft');
 await page.locator('#device-status-details summary').click();
 await expect(page.locator('#check-app-update')).toBeVisible();
 await page.locator('#check-app-update').click();
 await expect(page.locator('#update-check-status')).toContainText('Update check completed');
 await page.evaluate(async()=>{
   const target=new URL('./src/release.js',location.href).href;
   for(const name of await caches.keys()){
     const cache=await caches.open(name);
     if(await cache.match(target)){await cache.delete(target);break;}
   }
   navigator.serviceWorker.controller.postMessage({type:'CHECK_OFFLINE_CACHE'});
 });
 await expect(page.locator('#repair-offline-cache')).toBeVisible();
 await expect(page.locator('#app-update-status')).toContainText('Do not clear website data');
 await expect(page.locator('.ex-name')).toHaveValue('Do Not Clear My Draft');
 await page.locator('#repair-offline-cache').click();
 await expect(page.locator('#update-check-status')).toContainText('Offline app files are ready');
 await expect(page.locator('#repair-offline-cache')).toBeHidden();
 await expect(page.locator('.ex-name')).toHaveValue('Do Not Clear My Draft');
});
