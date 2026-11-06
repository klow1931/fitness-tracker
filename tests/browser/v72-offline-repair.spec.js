const {test,expect}=require('playwright/test');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
test.use({serviceWorkers:'allow'});
let server,origin,broken,requests;
test.beforeEach(async()=>{
 broken=true;requests=new Map();const root=path.resolve(__dirname,'../..');
 server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.headers['x-loadnote-test-repair']==='1')requests.set(pathname,(requests.get(pathname)||0)+1);
  if(broken&&pathname==='/assets/vendor/local-coach-manifest.json'){res.writeHead(503,{'Cache-Control':'no-store'}).end('Temporary test failure');return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');// Count actual worker downloads separately from browser/tooling requests.
  if(pathname==='/sw.js')bytes=Buffer.from(bytes.toString().replace("new Request(url,{cache:'reload',signal:controller.signal})","new Request(url,{cache:'reload',signal:controller.signal,headers:{'X-Loadnote-Test-Repair':'1'}})"));res.end(bytes);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
});
async function stop(){if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
test.afterEach(stop);
test('one unavailable asset preserves completed downloads and retry fetches only the missing file',async({page,context})=>{
 await page.goto(origin);await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await expect(page.locator('#repair-offline-cache')).not.toHaveAttribute('hidden');
 await page.locator('#device-status-details>summary').click();await expect(page.locator('#update-check-status')).toHaveText(/^1 of \d+ offline files could not be saved/,{timeout:30000});
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});await page.locator('.ex-name').first().fill('Keep this draft');await page.locator('.set-reps').first().fill('8');await page.locator('.set-weight').first().fill('10');
 const good=requests.get('/src/release.js'),bad=requests.get('/assets/vendor/local-coach-manifest.json');broken=false;
 await page.locator('#repair-offline-cache').click();await expect(page.locator('#update-check-status')).toContainText('Offline app files are ready');
 expect(requests.get('/src/release.js')).toBe(good);expect(requests.get('/assets/vendor/local-coach-manifest.json')).toBe(bad+1);
 await context.setOffline(true);await stop();await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.ex-name').first()).toHaveValue('Keep this draft');await expect(page.locator('.set-weight').first()).toHaveValue('10');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('failed retry stays clear and retryable while completed cache entries and training remain untouched',async({page})=>{
 await page.goto(origin);await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.locator('#device-status-details>summary').click();await expect(page.locator('#update-check-status')).toHaveText(/^1 of \d+ offline files could not be saved/,{timeout:30000});
 const before=await page.evaluate(()=>JSON.stringify(data)),good=requests.get('/src/release.js');
 await page.locator('#repair-offline-cache').click();await expect(page.locator('#update-check-status')).toContainText('Completed downloads are kept');await expect(page.locator('#repair-offline-cache')).toBeEnabled();
 expect(requests.get('/src/release.js')).toBe(good);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
