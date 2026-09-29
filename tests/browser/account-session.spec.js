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
  const body=route.request().postDataJSON();
  expect(Object.keys(body).sort()).toEqual(['context','history','question']);
  expect(body.messages).toBeUndefined();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({coach:{
   summary:'Authenticated coach reply',
   insights:[],
   recommendation:{action:'none',exercise:null,weightKg:null,sets:null,reps:null,targetRPE:null,reason:''},
   confidence:'medium'
  }})});
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
  return await window.LoadnoteCoachClient.ask({
   question:'Use the authenticated backend',
   context:{version:'0.6',unit:'kg',units:{storageWeight:'kg',displayWeight:'kg'},athlete:{goals:[]},training:{workouts30d:0},nutrition:{},bodyweight:null,prs:[],adaptive:null,lifecycle:null},
   history:[]
  });
 });
 expect(result.summary).toBe('Authenticated coach reply');
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


test('v2.60 deletes the server account from Profile without erasing local training',async({page})=>{
 let deleteHeaders=null;
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/api/auth/session',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:true,account:{id:'acct_browser_delete_test',displayName:'Delete Athlete',email:'delete@example.com',emailVerified:true,providers:['test-idp']},expiresAt:'2030-09-29T00:00:00.000Z',csrf:'delete-csrf',transport:'cookie',loginAvailable:true,provider:{id:'test-idp',name:'Continue with Test ID'}})
 }));
 await page.route('**/api/sync/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:'loadnote-sync-v1',status:'empty',hasSnapshot:false,revision:0})}));
 await page.route('**/api/account',async route=>{
  if(route.request().method()!=='DELETE')return route.fulfill({status:405,contentType:'application/json',body:'{}'});
  deleteHeaders=await route.request().allHeaders();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({deleted:true,remoteTrainingDeleted:false,localDeviceDataDeleted:false})});
 });
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(async()=>{
  data.workouts=[{id:'local-survives-delete',date:today(),exercises:[]}];
  await persistNow(data);
  localStorage.setItem('loadnote_remote_receipt_v1:acct_browser_delete_test','{"revision":1}');
  await window.LoadnoteDeviceStorage.set(window.LoadnoteSyncCoordinator.key('acct_browser_delete_test'),{temporary:true});
  showTab('profile');
 });
 const account=page.locator('#account-status');
 await account.locator('.account-danger-zone > summary').click();
 page.once('dialog',dialog=>dialog.accept());
 await account.getByRole('button',{name:'Delete Loadnote account'}).click();
 await expect(account).toContainText('Back up and sync training across devices');
 expect(deleteHeaders['x-loadnote-csrf']).toBe('delete-csrf');
 expect(await page.evaluate(()=>(data.workouts||[]).some(w=>w.id==='local-survives-delete'))).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteDeviceStorage.get(window.LoadnoteSyncCoordinator.key('acct_browser_delete_test')))).toBeNull();
 expect(await page.evaluate(()=>localStorage.getItem('loadnote_remote_receipt_v1:acct_browser_delete_test'))).toBeNull();
});
