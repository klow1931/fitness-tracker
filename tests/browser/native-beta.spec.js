const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{
  window.Chart=class{destroy(){}update(){}};
  window.nativeCalls=[];window.cancelNativeShare=false;
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',registerPlugin:name=>name==='Filesystem'?{
   writeFile:async options=>window.nativeCalls.push({type:'write',options}),
   getUri:async()=>({uri:'file:///cache/loadnote-exports/test.json'})
  }:{share:async options=>{window.nativeCalls.push({type:'share',options});if(window.cancelNativeShare)throw Error('cancelled');}}};
 });
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('native beta is local-only and JSON sharing does not claim a durable backup',async({page})=>{
 await expect(page.locator('#connection-status')).toContainText('Native beta');
 const result=await page.evaluate(async()=>{
  data.lastExportDate='2026-01-01';data.backupBannerDismissed=null;
  const before=JSON.stringify(data.workouts);await exportData();
  const payload=JSON.parse(window.nativeCalls.find(call=>call.type==='write').options.data);
  return {date:data.lastExportDate,workoutsUnchanged:before===JSON.stringify(data.workouts),payloadValid:LoadnoteIntegrity.verifyBackupManifest(payload).verified,
   account:window.LoadnoteAccountSession.snapshot().status,directory:window.nativeCalls[0].options.directory,share:window.nativeCalls[1].type};
 });
 expect(result.date).toBe('2026-01-01');expect(result.workoutsUnchanged).toBe(true);
 expect(result.payloadValid).toBe(true);expect(result.account).toBe('unavailable');expect(result.directory).toBe('CACHE');expect(result.share).toBe('share');
 await expect(page.locator('#toast-host')).toContainText('Confirm the JSON was saved');
 await page.evaluate(()=>{showTab('profile');renderAccountStatus();});
 await expect(page.locator('#account-status')).toContainText('Native beta');
});

test('native cancellation preserves reminder state and CSV fails explicitly',async({page})=>{
 const result=await page.evaluate(async()=>{
  data.lastExportDate='2026-01-01';data.backupBannerDismissed=null;window.cancelNativeShare=true;
  await exportData();return {date:data.lastExportDate,dismissed:data.backupBannerDismissed};
 });
 expect(result).toEqual({date:'2026-01-01',dismissed:null});
 await expect(page.locator('#toast-host')).toContainText('Backup was not confirmed');
 await page.evaluate(()=>exportCSV());await expect(page.locator('#toast-host')).toContainText('CSV export is not supported');
});
