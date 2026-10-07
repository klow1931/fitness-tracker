const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');

test('product demo visits every consumer destination in both themes without changing training',async({page},info)=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});data.gymModeUserSet=true;invalidateViews();},phaseFixture().state);
 const snapshot=()=>page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,phasePrograms:data.phasePrograms,meetCycles:data.meetCycles,prs:data.prs}));
 const before=await snapshot();
 for(const dark of [false,true]){
  await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);
  for(const panel of ['dashboard','workouts','prs','coach','profile','calendar','nutrition','measures','photos','tools']){
   await page.evaluate(panel=>showTab(panel),panel);await expect(page.locator('#panel-'+panel)).toBeVisible();
   for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth),{message:panel+' must fit '+width+'px'}).toBeLessThanOrEqual(width+1);
   }
   await page.setViewportSize({width:390,height:844});
   await page.locator('#panel-'+panel).evaluate(el=>el.scrollIntoView({block:'start'}));
   await page.screenshot({path:info.outputPath(`${panel}-${dark?'dark':'light'}.png`)});
  }
 }
 expect(await snapshot()).toBe(before);expect(errors).toEqual([]);
});
