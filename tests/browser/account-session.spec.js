const {test,expect}=require('playwright/test');

test('v2.60 keeps account and sync inside Profile while low-level remote writes stay explicit',async({page})=>{
 let coachHeaders=null,syncPutHeaders=null,syncPutBody=null;
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/api/auth/session',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:true,account:{id:'acct_browser_test',displayName:'Browser Athlete',email:'browser@example.com',emailVerified:true,providers:['test-idp']},expiresAt:'2026-09-29T00:00:00.000Z',csrf:'browser-csrf',transport:'cookie',loginAvailable:true,provider:{id:'test-idp',name:'Continue with Test ID'}})
 }));
 await page.route('**/api/sync/status',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({protocol:'loadnote-sync-v1',status:'stored',hasSnapshot:true,revision:3,updatedAt:'2026-09-28T23:30:00.000Z',current:{records:42,packageFingerprint:'pkg3',manifestFingerprint:'manifest3'}})
 }));
 await page.route('**/api/sync/state',async route=>{
  if(route.request().method()!=='PUT')return route.fulfill({status:405,contentType:'application/json',body:JSON.stringify({error:'method'})});
  syncPutHeaders=await route.request().allHeaders();
  syncPutBody=JSON.parse(route.request().postData()||'{}');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:'loadnote-sync-v1',status:'committed',changed:true,revision:4,current:{records:syncPutBody.package.manifest.records,packageFingerprint:syncPutBody.package.packageFingerprint,manifestFingerprint:syncPutBody.package.manifest.fingerprint}})});
 });
 let logoutHeaders=null;
 await page.route('**/api/coach',async route=>{
  coachHeaders=await route.request().allHeaders();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'Authenticated coach reply'}}]})});
 });
 await page.route('**/api/auth/logout',async route=>{
  logoutHeaders=await route.request().allHeaders();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
 });
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');

 const result=await page.evaluate(async()=>{
  data.api={...(data.api||{}),backendEnabled:true,backendUrl:'/api/coach'};
  return await callCoachAPI('Use the authenticated backend');
 });
 expect(result).toBe('Authenticated coach reply');
 expect(coachHeaders['x-loadnote-csrf']).toBe('browser-csrf');

 expect(await page.locator('#api-backend-url').count()).toBe(0);
 expect(await page.locator('#api-backend-enabled').count()).toBe(0);
 expect(await page.evaluate(()=>localStorage.getItem('loadnote_session'))).toBeNull();

 const beforeRemote=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>showTab('profile'));
 const account=page.locator('#account-status');
 await expect(account).toContainText('Browser Athlete');
 await expect(account).toContainText('browser@example.com');
 await expect(account).toContainText('Training sync');
 await expect(account).toContainText('Cloud revision 3');
 await expect(account).toContainText('42 structured records');
 await expect(account).toContainText('Sync is manual.');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(beforeRemote);

 const upload=await page.evaluate(async()=>{
  const before=JSON.stringify(data);
  const result=await window.LoadnoteRemoteSync.upload(data,{expectedRevision:3,client:'client_browser_remote_12345',createdAt:'2026-09-28T23:31:00.000Z',releaseVersion:'2.59.0',accountId:'acct_browser_test'});
  return {result,before,after:JSON.stringify(data)};
 });
 expect(upload.result.revision).toBe(4);
 expect(upload.after).toBe(upload.before);
 expect(syncPutHeaders['x-loadnote-csrf']).toBe('browser-csrf');
 expect(syncPutBody.expectedRevision).toBe(3);
 expect(syncPutBody.package.protocol).toBe('loadnote-sync-v1');
 expect(syncPutBody.package.data.api).toBeUndefined();
 expect(await page.evaluate(()=>localStorage.getItem('loadnote_remote_receipt_v1:acct_browser_test'))).toContain('"revision":4');
 await account.getByRole('button',{name:'Sign out'}).click();
 await expect(account).toContainText('Back up and sync training across devices');
 await expect(account.getByRole('link',{name:'Continue with Test ID'})).toHaveAttribute('href','/api/auth/login?returnTo=%2F');
 expect(logoutHeaders['x-loadnote-csrf']).toBe('browser-csrf');
});
