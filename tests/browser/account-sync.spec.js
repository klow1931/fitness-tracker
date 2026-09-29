const {test,expect}=require('playwright/test');
const Sync=require('../../src/product/sync-model');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const syncState=overrides=>({schemaVersion:25,releaseVersion:'2.59.0',...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,...overrides});
const authBody=id=>({authenticated:true,account:{id,displayName:'Sync Athlete',email:'sync@example.com',emailVerified:true,providers:['test-idp']},expiresAt:'2030-09-29T00:00:00.000Z',csrf:'sync-csrf',transport:'cookie',loginAvailable:true,provider:{id:'test-idp',name:'Continue with Test ID'}});

test('v2.59 explicitly creates the first cloud training snapshot and stores a device sync base',async({page})=>{
 let putBody=null,putHeaders=null;
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(authBody('acct_browser_sync_first'))}));
 await page.route('**/api/sync/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:Sync.PROTOCOL,status:'empty',hasSnapshot:false,revision:0})}));
 await page.route('**/api/sync/state',async route=>{
  if(route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:Sync.PROTOCOL,status:'empty',hasSnapshot:false,revision:0})});
  putBody=JSON.parse(route.request().postData()||'{}');putHeaders=await route.request().allHeaders();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:Sync.PROTOCOL,status:'committed',changed:true,revision:1,current:{records:putBody.package.manifest.records,packageFingerprint:putBody.package.packageFingerprint,manifestFingerprint:putBody.package.manifest.fingerprint}})});
 });
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>showTab('tools'));
 const account=page.locator('#account-status');
 await account.getByRole('button',{name:'Sync now'}).click();
 await expect(account).toContainText('Synced');
 await expect(account).toContainText('Revision 1');
 expect(putBody.expectedRevision).toBe(0);
 expect(putBody.package.protocol).toBe(Sync.PROTOCOL);
 expect(putHeaders['x-loadnote-csrf']).toBe('sync-csrf');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 const base=await page.evaluate(()=>window.LoadnoteSyncCoordinator.loadBase('acct_browser_sync_first'));
 expect(base.revision).toBe(1);
 expect(base.manifestFingerprint).toBe(putBody.package.manifest.fingerprint);
});

test('v2.59 refuses first-link guessing and recovery-backs an explicit cloud choice',async({page})=>{
 const remoteState=syncState({workouts:[{id:'remote_workout',date:'2026-09-28',createdAt:'2026-09-28T18:00:00.000Z',updatedAt:'2026-09-28T18:00:00.000Z',notes:'From cloud',exercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]}]});
 const pkg=Sync.createPackage(remoteState,{clientId:'client_cloud_browser_12345',createdAt:'2026-09-29T01:30:00.000Z',releaseVersion:'2.59.0'});
 let putCount=0;
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(authBody('acct_browser_sync_cloud'))}));
 await page.route('**/api/sync/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:Sync.PROTOCOL,status:'stored',hasSnapshot:true,revision:1,updatedAt:'2026-09-29T01:30:00.000Z',current:{records:pkg.manifest.records,packageFingerprint:pkg.packageFingerprint,manifestFingerprint:pkg.manifest.fingerprint}})}));
 await page.route('**/api/sync/state',route=>{
  if(route.request().method()==='PUT'){putCount++;return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'unexpected upload'})});}
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({protocol:Sync.PROTOCOL,status:'stored',hasSnapshot:true,revision:1,package:pkg})});
 });
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(()=>showTab('tools'));
 const account=page.locator('#account-status');
 await account.getByRole('button',{name:'Sync now'}).click();
 await expect(account).toContainText('Choose the starting copy');
 expect(await page.evaluate(()=>(data.workouts||[]).some(w=>w.id==='remote_workout'))).toBe(false);
 await account.getByRole('button',{name:'Use cloud on this device'}).click();
 await expect(account).toContainText('Synced');
 expect(putCount).toBe(0);
 const applied=await page.evaluate(()=>({workouts:data.workouts.map(w=>w.id),recoveries:data.recoverySnapshots.length}));
 expect(applied.workouts).toContain('remote_workout');
 expect(applied.recoveries).toBeGreaterThan(0);
 const base=await page.evaluate(()=>window.LoadnoteSyncCoordinator.loadBase('acct_browser_sync_cloud'));
 expect(base.revision).toBe(1);
});
