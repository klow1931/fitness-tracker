const {test,expect}=require('playwright/test');
const http=require('http'),fs=require('fs'),path=require('path');
test.use({serviceWorkers:'allow'});
test.describe.configure({mode:'serial'});
let server,origin,revision=0;
test.beforeAll(async()=>{
 const root=path.resolve(__dirname,'../..');
 server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.join(root,pathname==='/'?'index.html':pathname);
  try{let body=fs.readFileSync(file);if(pathname==='/sw.js')body=Buffer.from(body.toString().replaceAll('loadnote-v1.9.0',`loadnote-v1.9.0-test${revision}`));
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});
async function ready(page){await page.goto(origin);await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await page.evaluate(()=>showTab('workouts'));}
test('Real assets support offline draft reload, timer, save and chart',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await page.locator('.ex-name').fill('Offline Bench');await page.locator('.set-weight').fill('80');await page.locator('.set-reps').fill('5');
 await expect(page.locator('#logger-draft-status')).toContainText('Draft saved');
 await context.setOffline(true);await expect(page.locator('#connection-status')).toContainText('Offline');
 await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.ex-name')).toHaveValue('Offline Bench');await expect(page.locator('.set-weight')).toHaveValue('80');
 await page.locator('[data-workout-action="rest-90"]').click();await page.locator('#rest-pause').click();await expect(page.locator('#rest-pause')).toHaveText('Resume');
 await page.locator('#workout-actions [data-workout-action="review"]').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-recap')).toContainText('Session saved');
 await expect(page.locator('#device-save-status')).toHaveText('Saved on this device');
 await page.evaluate(()=>{showTab('dashboard');document.getElementById('progress-exercise').value='Offline Bench';renderProgressChart();});
 expect(await page.evaluate(()=>Chart.version)).toBe('4.4.1');
 expect(await page.evaluate(()=>Chart.getChart(document.querySelector('#progressChart'))?.data.datasets[0].data.length)).toBe(1);
 for(const dark of [false,true]){await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await context.setOffline(false);await expect(page.locator('#connection-status')).toContainText('Online');expect(errors).toEqual([]);
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
