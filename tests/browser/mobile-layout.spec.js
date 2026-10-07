const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
  data.onboardingDismissed=true;updateOnboardingUI();data.gymModeUserSet=true;
  data.programmingProfiles=LoadnoteProgrammingProfile.save([],{goal:'meet',experience:'intermediate',consistency:'consistent',availableDays:[1,3,4,6],sessionMinutes:109,equipment:['barbell','plates','rack','bench'],preferredExerciseIds:[],avoidedExerciseIds:[],eventDate:'2027-01-09',priorities:'',notes:''},{id:'layout-profile',now:'2026-10-05T00:00:00.000Z'});
  invalidateViews();
 });
});

test('mobile Profile and Coach avoid empty header space and overlapping duplicate actions',async({page},info)=>{
 await expect(page.locator('.app-shell > #panel-profile')).toHaveCount(1);
 await expect(page.locator('.app-shell > #panel-tools')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.stringify(data));
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:740});
  for(const dark of [false,true]){
   await page.evaluate(d=>{document.body.classList.toggle('dark',d);showTab('profile');},dark);
   await expect(page.locator('#panel-profile')).toBeVisible();
   const gap=await page.evaluate(()=>document.querySelector('#panel-profile').getBoundingClientRect().top-document.querySelector('.app-shell > header').getBoundingClientRect().bottom);
   expect(gap).toBeGreaterThanOrEqual(0);expect(gap).toBeLessThanOrEqual(24);
   await expect(page.locator('#coach-companion-launcher')).not.toBeVisible();
   const widths=await page.locator('#profile-training-setup .profile-actions').evaluate(actions=>({row:actions.clientWidth,buttons:[...actions.children].map(b=>b.getBoundingClientRect().width)}));
   for(const width of widths.buttons)expect(width).toBeGreaterThanOrEqual(widths.row-1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-today');});
   const spacing=await page.locator('[data-sub="co-today"].sub-panel').evaluate(panel=>{
    const first=panel.querySelector('#coach-today-brief').getBoundingClientRect();
    const more=document.querySelector('.coach-more').getBoundingClientRect();
    return {tools:more.top-first.bottom};
   });
   expect(spacing.tools).toBeGreaterThanOrEqual(12);
   await expect(page.locator('[data-sub="co-today"].sub-panel > .card')).toHaveCount(0);
   await expect(page.locator('#coach-companion-launcher')).not.toBeVisible();
  }
 }
 await page.setViewportSize({width:390,height:740});
 await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:info.outputPath('coach-today-mobile.png')});
 await page.locator('.coach-more > summary').click();
 await page.getByRole('button',{name:'Open Coach companion',exact:true}).click();
 await expect(page.locator('#coach-companion-panel')).toBeVisible();await page.locator('.cc-close').click();
 await page.evaluate(()=>showTab('profile'));await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('profile-mobile.png')});
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});

test('planner status stays readable and explanation can be opened without changing training',async({page},info)=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
 const before=await page.evaluate(()=>JSON.stringify(data));
 for(const dark of [false,true]){
  await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
  const badge=page.locator('#programming-workspace .readiness-status');
  await expect(badge).toBeVisible();expect((await badge.textContent()).trim()).not.toBe('');
  const contrast=await badge.evaluate(el=>{
   const s=getComputedStyle(el),l=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(x=>{x=Number(x)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   const a=l(s.color),b=l(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
 }
 const explanation=page.locator('.programming-workspace-explanation');await expect(explanation).not.toHaveAttribute('open','');
 await explanation.locator('summary').click();await expect(explanation).toHaveAttribute('open','');await expect(explanation).toContainText('schedule sessions separately');
 await explanation.locator('summary').click();
 await page.setViewportSize({width:390,height:740});await page.locator('#programming-workspace').scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath('planner-mobile.png')});
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
