const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test('preferences stay uniform at phone widths and larger text; toggles preserve saved training',async({page},info)=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});data.onboardingDismissed=true;updateOnboardingUI();data.gymModeUserSet=true;invalidateViews();showTab('profile');},phaseFixture().state);
 const saved=()=>page.evaluate(()=>JSON.stringify({workouts:data.workouts,plans:data.phasePrograms,sessions:data.scheduledSessions}));
 const before=await saved();
 for(const width of [320,390,430])for(const font of [16,24]){
  await page.setViewportSize({width,height:740});
  await page.evaluate(size=>{document.documentElement.style.fontSize=size+'px';},font);
  for(const dark of [false,true]){
   await page.evaluate(d=>{data.dark=d;document.body.classList.toggle('dark',d);renderProfileHub();},dark);
   const bounds=await page.locator('#profile-preferences').evaluate(host=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,height:r.height,width:r.width};};
    return [...host.querySelectorAll('.profile-preference-row')].map(row=>({row:rect(row),controls:rect(row.lastElementChild),buttons:[...row.querySelectorAll('button')].map(rect)}));
   });
   for(const row of bounds){expect(Math.abs(row.controls.width-row.row.width)).toBeLessThan(1);for(const b of row.buttons){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(43.99);expect(b.right).toBeLessThanOrEqual(width);}}
   expect(Math.abs(bounds[0].buttons[0].top-bounds[0].buttons[1].top)).toBeLessThan(1);
   expect(Math.abs(bounds[0].buttons[0].width-bounds[0].buttons[1].width)).toBeLessThan(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
 await page.evaluate(()=>{document.documentElement.style.fontSize='16px';});await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Kilograms',exact:true}).click();await expect(page.locator('[data-profile-unit="kg"]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Pounds',exact:true}).click();await expect(page.locator('[data-profile-unit="lb"]')).toHaveAttribute('aria-pressed','true');
 const gym=await page.locator('#profile-gym-mode').getAttribute('aria-pressed');await page.getByRole('button',{name:'Gym mode',exact:true}).click();await expect(page.locator('#profile-gym-mode')).toHaveAttribute('aria-pressed',gym==='true'?'false':'true');
 await page.getByRole('button',{name:'Dark appearance',exact:true}).click();await expect(page.locator('#profile-theme')).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Dark appearance',exact:true}).click();await expect(page.locator('#profile-theme')).toHaveAttribute('aria-pressed','true');
 expect(await saved()).toBe(before);
 await page.locator('#profile-preferences').scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:info.outputPath('uniform-preferences-mobile.png')});
 const alpha=await page.locator('#mobile-nav').evaluate(nav=>getComputedStyle(nav).backgroundColor);expect(alpha).not.toMatch(/rgba\([^)]*,\s*0\./);
});
