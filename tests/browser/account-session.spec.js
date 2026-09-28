const {test,expect}=require('playwright/test');

test('v2.56 loads an authenticated account session in memory and sends CSRF with backend Coach requests',async({page})=>{
 let coachHeaders=null;
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/api/auth/session',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:true,account:{id:'acct_browser_test',provider:'test-idp'},expiresAt:'2026-09-29T00:00:00.000Z',csrf:'browser-csrf',transport:'cookie'})
 }));
 await page.route('**/api/coach',async route=>{
  coachHeaders=await route.request().allHeaders();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'Authenticated coach reply'}}]})});
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
});
