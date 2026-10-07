const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});data.onboardingDismissed=true;updateOnboardingUI();invalidateViews();showTab('profile');},phaseFixture().state);
});

test('setup checklist uses saved status, optional history and goal-specific mapping without changing training',async({page},info)=>{
 const saved=()=>page.evaluate(()=>JSON.stringify({workouts:data.workouts,plans:data.phasePrograms,sessions:data.scheduledSessions}));
 const before=await saved();
 await page.evaluate(()=>{data.programmingProfiles=[];renderProfileHub();});
 await expect(page.locator('#profile-athlete-intake')).toBeDisabled();
 await page.locator('#profile-edit-training').click();
 await page.locator('#profile-goal').selectOption('hypertrophy');
 await page.locator('#programming-profile-dialog button[type="submit"]').click();
 await expect(page.locator('#programming-profile-dialog')).not.toBeVisible();
 await expect(page.locator('#profile-athlete-intake')).toBeEnabled();
 await expect(page.locator('.setup-checklist')).toContainText('Saved');
 await expect(page.locator('.setup-checklist')).toContainText('Optional');
 await expect(page.locator('.setup-checklist')).not.toContainText('Powerlifting lift mapping');
 await page.locator('#profile-athlete-intake').click();
 await expect(page.locator('#athlete-intake-dialog')).toBeVisible();
 await page.locator('#intake-years').fill('5');
 await page.locator('#intake-confirm').check();
 await page.locator('#athlete-intake-dialog button[type="submit"]').click();
 await expect(page.locator('#athlete-intake-dialog')).not.toBeVisible();
 await expect(page.locator('.setup-checklist')).toContainText('Recorded');
 await page.locator('#profile-edit-training').click();
 await page.locator('#profile-goal').selectOption('meet');
 await page.locator('#programming-profile-dialog button[type="submit"]').click();
 await expect(page.locator('.setup-checklist')).toContainText('Powerlifting lift mapping');
 expect(await page.evaluate(()=>LoadnoteProgrammingProfile.current(data.programmingProfiles).context.intake.years)).toBe(5);
 for(const width of [320,390,430])for(const size of [16,24]){
  await page.setViewportSize({width,height:740});await page.evaluate(font=>{document.documentElement.style.fontSize=font+'px';},size);
  const widths=await page.locator('.setup-checklist').evaluate(list=>[...list.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};}));
  for(const b of widths){expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.height).toBeGreaterThanOrEqual(43.99);expect(Math.abs(b.width-widths[0].width)).toBeLessThan(1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(await saved()).toBe(before);
 await page.evaluate(()=>{document.documentElement.style.fontSize='16px';scrollTo(0,0);});
 await page.setViewportSize({width:390,height:740});await expect(page.locator('#toast-host .toast')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('setup-checklist-mobile.png'),fullPage:true});
});

test('Coach puts the primary next action above optional tools and retains encouragement access',async({page},info)=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-today');});
 await expect(page.locator('#coach-today-brief [data-lifecycle-action]')).toHaveClass(/btn-primary/);
 const order=await page.evaluate(()=>document.querySelector('#coach-today-brief').compareDocumentPosition(document.querySelector('.coach-more'))&Node.DOCUMENT_POSITION_FOLLOWING);
 expect(order).toBeTruthy();
 await expect(page.locator('#panel-coach')).not.toContainText('Need a training partner?');
 await page.locator('#panel-coach .section-tabs').getByRole('tab',{name:'Ask Coach',exact:true}).click();
 await expect(page.locator('[data-sub="co-chat"].sub-panel')).toBeVisible();
 await page.locator('#panel-coach .section-tabs').getByRole('tab',{name:'Today',exact:true}).click();
 await page.locator('.coach-more>summary').click();
 await expect(page.getByRole('button',{name:'Open Coach companion',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.locator('.coach-more>summary').click();await page.setViewportSize({width:390,height:740});await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('coach-focused-mobile.png')});
});
