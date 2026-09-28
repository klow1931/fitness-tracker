const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.55 sync model is available without mutating local training data',async({page})=>{
 const result=await page.evaluate(()=>{
  const before=JSON.stringify(data);
  const report=LoadnoteSync.preflight(data);
  const manifest=LoadnoteSync.manifest(data);
  const pkg=LoadnoteSync.createPackage(data,{clientId:'browser-test',createdAt:'2026-09-28T21:00:00.000Z'});
  const verified=LoadnoteSync.verifyPackage(pkg);
  return {
   before,
   after:JSON.stringify(data),
   status:report.status,
   manifestVersion:manifest.version,
   protocol:pkg.protocol,
   verified:verified.verified,
   hasApi:Object.hasOwn(pkg.data,'api'),
   hasPhotos:Object.hasOwn(pkg.data,'progressPhotos')
  };
 });
 expect(result.status).toBe('ready');
 expect(result.manifestVersion).toBe(1);
 expect(result.protocol).toBe('loadnote-sync-v1');
 expect(result.verified).toBe(true);
 expect(result.hasApi).toBe(false);
 expect(result.hasPhotos).toBe(false);
 expect(result.after).toBe(result.before);
});
