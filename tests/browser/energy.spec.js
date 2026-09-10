const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});
 await page.evaluate(()=>showTab('dashboard'));
});
test('Home logger shortcut preserves an unfinished session',async({page})=>{
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .ex-name').first().fill('Bench Press');
 await page.evaluate(()=>showTab('dashboard'));
 await page.getByRole('button',{name:'Open workout logger',exact:true}).click();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Bench Press');
});
test('Weekly rhythm reflects saved sessions and opens their calendar day',async({page})=>{
 await page.evaluate(()=>{const key=homeActivityWeek([],[]).days.find(d=>d.today).date;data.workouts=[{id:'rhythm',date:key,exercises:[]}];renderHomeActivity();});
 await expect(page.locator('#home-week-summary')).toContainText('1 session logged');
 await expect(page.locator('#home-week-days button')).toHaveCount(7);
 await page.locator('#home-week-days [aria-current="date"]').click();
 await expect(page.locator('#panel-calendar')).toBeVisible();
 await expect(page.locator('#calendar-grid [aria-pressed="true"]')).toHaveCount(1);
});
test('New PR feedback distinguishes improvement from correction',async({page})=>{
 await page.evaluate(()=>showTab('prs'));
 for(const [weight,expected] of [['100','New personal best'],['90','PR updated']]){
   await page.locator('#pr-exercise').fill('Bench Press');await page.locator('#pr-weight').fill(weight);
   await page.getByRole('button',{name:'Save PR',exact:true}).click();
   await expect(page.locator('#toast-host .toast').last()).toContainText(expected);
 }
});
test('Energy layout fits and honors reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const dark of [false,true]){
   await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);
   await expect(page.locator('#athlete-home-command')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.evaluate(()=>showToast('Workout saved','success'));
 expect(await page.locator('.toast').last().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
