const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');

async function boot(page){
 await page.clock.install({time:new Date('2026-10-04T19:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  // Resizing normally chooses Gym mode on small screens. Fix the demo's
  // explicit UI preference so the whole-state integrity assertion stays valid.
  data.gymModeUserSet=true;
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  data=LoadnotePhaseBuilder.save(data,LoadnotePhaseBuilder.prepare(data,seed.config,args),{confirmed:true},{...args,id:'layout-base'});
  data=LoadnoteMeetCycle.save(data,LoadnoteMeetCycle.prepare(data,data.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args),{confirmed:true},{...args,id:'layout-cycle'});
  data=LoadnoteMeetCycle.schedule(data,'layout-cycle',{...args,now:'2026-09-24T13:00:00.000Z'});
  invalidateViews();showTab('coach');showSubTab('coach','co-programs');
 },phaseFixture());
}
async function stacked(page,selector){
 const bounds=await page.locator(selector).evaluate(s=>{
  const b=s.querySelector('b').getBoundingClientRect(),d=s.querySelector('small').getBoundingClientRect();
  return {titleBottom:b.bottom,descriptionTop:d.top,titleLeft:b.left,descriptionLeft:d.left,descriptionRight:d.right,width:innerWidth};
 });
 expect(bounds.descriptionTop).toBeGreaterThanOrEqual(bounds.titleBottom);
 expect(Math.abs(bounds.titleLeft-bounds.descriptionLeft)).toBeLessThan(2);
 expect(bounds.descriptionRight).toBeLessThanOrEqual(bounds.width);
}
test('mobile demo: stacked review rows and compact actions preserve training',async({page},info)=>{
 await boot(page);const before=await page.evaluate(()=>JSON.stringify(data));
 for(const width of [320,390,430,1280]){
  await page.setViewportSize({width,height:844});
  for(const dark of [false,true]){
   await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   for(const selector of ['#cycle-journal summary','#phase-review-panel > summary','#program-week-review-panel > summary','.decision-workspace > .more-details > summary'])await stacked(page,selector);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#cycle-journal').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('program-review-mobile.png')});
 await page.locator('#cycle-journal > details > summary').click();await expect(page.locator('#cycle-journal > details')).toHaveAttribute('open','');
 await page.locator('#cycle-journal summary').first().click();
 await page.locator('#phase-review-panel > summary').click();await expect(page.locator('#phase-review')).toBeVisible();
 await page.locator('#phase-review-panel > summary').click();
 const buttons=page.locator('#decision-action-center .adaptive-entry-actions > button');
 for(const button of await buttons.all()){const b=await button.boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);}
 await buttons.filter({hasText:'Training preferences'}).click();await expect(page.locator('#adaptive-preferences-dialog')).toBeVisible();
 await page.locator('#adaptive-preferences-dialog [data-adaptive-close]').click();
 await page.locator('#decision-action-center').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('program-actions-mobile.png')});
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('mobile demo: Progress disclosure stacks, opens records and retains evidence',async({page},info)=>{
 await boot(page);const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>showTab('prs'));
 for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});await stacked(page,'#progress-explore > summary');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.locator('#progress-explore').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('progress-mobile.png')});
 await page.locator('#progress-explore > summary').click();await expect(page.locator('#pr-search')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
