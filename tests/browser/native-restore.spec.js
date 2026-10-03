const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{
  window.Chart=class{destroy(){}update(){}};window.sharedBackup=null;
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'ios',registerPlugin:name=>name==='Filesystem'?{writeFile:async options=>{window.sharedBackup=options.data;},getUri:async()=>({uri:'file:///cache/loadnote-exports/test.json'})}:{share:async()=>{}}};
 });
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(async()=>{
  data.workouts=[{id:'native-roundtrip',date:'2026-10-01',notes:'Test session',exercises:[{name:'Competition Bench Press',type:'strength',trackBy:'reps',sets:[{weight:100.25,reps:5,rpe:7.5}]}]}];
  data.programs=[{id:'native-program',name:'Recovery test program',exercises:[]}];
  data.templates=[{id:'native-template',name:'Bench day',exercises:[]}];
  data.unit='lb';data.measureUnit='in';data.workoutRevisions=[{id:'native-revision',workoutId:'native-roundtrip',action:'edit',recordedAt:'2026-10-02T00:00:00.000Z',before:null,after:data.workouts[0]}];
  data=normalizeDataShape(data);await persistNow(data);
 });
});
const keys=['workouts','programs','templates','workoutRevisions','exerciseCatalog','unit','measureUnit'];
async function snapshot(page){return page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,data[key]])),keys);}
async function backup(page){return page.evaluate(async()=>{await exportData();return window.sharedBackup;});}
async function upload(page,text){await page.locator('#import-file').setInputFiles({name:'loadnote-native-test.json',mimeType:'application/json',buffer:Buffer.from(text)});}

test('native shared JSON restores training, program history and units after restart',async({page})=>{
 const before=await snapshot(page),text=await backup(page);
 expect(JSON.parse(text).workouts[0].exercises[0].sets[0].weight).toBe(100.25);
 await page.evaluate(async()=>{data.workouts=[];data.programs=[];data.unit='kg';await persistNow(data);});
 await upload(page,text);await expect(page.locator('#import-review')).toBeVisible();
 await expect(page.locator('[data-import-check="backup"]')).toContainText('verified');
 await page.locator('#confirm-import-review').click();await expect(page.locator('#import-review')).toBeHidden();
 expect(await snapshot(page)).toEqual(before);
 expect(await page.evaluate(()=>data.recoverySnapshots.length)).toBeGreaterThan(0);
 await page.reload();await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);expect(await snapshot(page)).toEqual(before);
});

test('cancelled restore and corrupted backup leave native training unchanged',async({page})=>{
 const before=await snapshot(page),text=await backup(page);
 await upload(page,text);await expect(page.locator('#import-review')).toBeVisible();await page.locator('#cancel-import-review').click();expect(await snapshot(page)).toEqual(before);
 const broken=JSON.parse(text);broken.workouts[0].exercises[0].sets[0].weight=999;
 let message='';page.once('dialog',dialog=>{message=dialog.message();return dialog.accept();});await upload(page,JSON.stringify(broken));
 await expect.poll(()=>message).toContain('Backup integrity check failed');expect(await snapshot(page)).toEqual(before);await expect(page.locator('#import-review')).toBeHidden();
});

test('failed native restore remains reviewable and never replaces durable training',async({page})=>{
 const before=await snapshot(page),text=await backup(page),incoming=JSON.parse(text);
 delete incoming._loadnoteBackup;incoming.workouts[0].notes='Uncommitted replacement';
 await upload(page,JSON.stringify(incoming));await expect(page.locator('#import-review')).toBeVisible();
 await page.evaluate(()=>{persistNow=async()=>{throw Error('Simulated unavailable device storage');};});
 await page.locator('#confirm-import-review').click();await expect(page.locator('#toast-host')).toContainText('Import could not be saved');
 await expect(page.locator('#import-review')).toBeVisible();await expect(page.locator('#confirm-import-review')).toBeEnabled();expect(await snapshot(page)).toEqual(before);
 await page.locator('#cancel-import-review').click();await page.reload();await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);expect(await snapshot(page)).toEqual(before);
});
