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

test('native welcome guides reviewed restore and leaves backup reminders untouched',async({page})=>{
 await expect(page.locator('#native-beta-welcome')).toBeVisible();
 await expect(page.locator('#onboarding-account')).toContainText('Protect your local data');
 await page.locator('#native-import-guide').click();
 await expect(page.locator('#native-restore-guide')).toBeVisible();
 await expect(page.locator('#native-diagnostics')).toContainText(require('../../package.json').version);
 await expect(page.locator('#native-diagnostics')).toContainText('not a backup');
 const before=await page.evaluate(()=>({workouts:JSON.stringify(data.workouts),date:data.lastExportDate,dismissed:data.backupBannerDismissed}));
 const backup=await page.evaluate(()=>JSON.stringify(LoadnoteIntegrity.addBackupManifest({...data,recoverySnapshots:[]},{releaseVersion:'2.87.0'})));
 await page.locator('#import-file').setInputFiles({name:'loadnote-test.json',mimeType:'application/json',buffer:Buffer.from(backup)});
 await expect(page.locator('#import-review')).toBeVisible();
 await expect(page.locator('[data-import-check="backup"]')).toContainText('verified');
 await page.locator('#cancel-import-review').click();
 expect(await page.evaluate(()=>({workouts:JSON.stringify(data.workouts),date:data.lastExportDate,dismissed:data.backupBannerDismissed}))).toEqual(before);
 await page.evaluate(()=>showTab('dashboard'));
 await page.locator('#native-welcome-dismiss').click();
 await page.reload();await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await expect(page.locator('#native-beta-welcome')).toBeHidden();
 await page.evaluate(()=>showTab('tools'));await page.locator('#native-welcome-reopen').click();
 await expect(page.locator('#native-beta-welcome')).toBeVisible();
 await page.evaluate(()=>{window.LoadnoteSaveHealth='failed';window.LoadnoteBetaOnboarding.refresh();showTab('tools');});
 await expect(page.locator('#native-diagnostics')).toContainText('Save failed');
});

test('browser onboarding retains account guidance and hides native controls',async({page})=>{
 await page.evaluate(()=>{delete window.Capacitor;});
 // A fresh page without the native bootstrap exercises the browser surface.
 const browserPage=await page.context().browser().newPage();
 await browserPage.goto('/');await expect(browserPage.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await expect(browserPage.locator('#native-beta-welcome')).toBeHidden();
 await expect(browserPage.locator('#native-beta-safety')).toBeHidden();
 await expect(browserPage.locator('#onboarding-account')).toContainText('Account is optional');
 await browserPage.close();
});
