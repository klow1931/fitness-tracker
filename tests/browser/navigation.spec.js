const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});
});
test('subsection, scroll and entered food form survive switching tabs',async({page})=>{
 await page.evaluate(()=>{showTab('nutrition');showSubTab('nutrition','nu-add');showFoodMode('custom');});
 await page.locator('#cf-name').fill('My lunch');
 await page.evaluate(()=>window.scrollTo(0,200));
 const before=await page.evaluate(()=>window.scrollY);
 await page.evaluate(()=>showTab('workouts'));await page.evaluate(()=>new Promise(requestAnimationFrame));
 await page.evaluate(()=>showTab('nutrition'));await page.evaluate(()=>new Promise(requestAnimationFrame));
 await expect(page.locator('#food-mode-custom')).toBeVisible();await expect(page.locator('#cf-name')).toHaveValue('My lunch');
 expect(Math.abs(await page.evaluate(()=>window.scrollY)-before)).toBeLessThan(4);
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-history');showTab('nutrition');showTab('workouts');});
 await expect(page.locator('[data-panel="workouts"][data-sub="wo-history"]')).toBeVisible();
});
test('food entry keeps live totals visible without a return trip',async({page})=>{
 await page.evaluate(()=>showTab('nutrition'));
 await page.getByRole('button',{name:'Add food →',exact:true}).click();
 await page.evaluate(()=>showFoodMode('manual'));
 await page.locator('#nu-protein').fill('25');await page.locator('#nu-calories').fill('250');await page.evaluate(()=>addQuickMacros());
 await expect(page.locator('#food-entry-summary')).toContainText('250 kcal');
 await expect(page.locator('#food-entry-summary')).toContainText('25g protein');
 await expect(page.locator('#food-entry-summary')).toContainText('1 foods');
 await expect(page.locator('#food-mode-manual')).toBeVisible();
 await page.getByRole('button',{name:'Done adding'}).click();await expect(page.locator('#tot-cal')).toHaveText('250');
});
test('navigation skips hidden and unchanged renders and refreshes changed totals',async({page})=>{
 const metrics=await page.evaluate(()=>{
   const counts={history:0,library:0,day:0};
   const h=renderNutritionHistory,l=renderFoodLibrary,d=loadDayFoods;
   renderNutritionHistory=()=>{counts.history++;return h();};renderFoodLibrary=()=>{counts.library++;return l();};loadDayFoods=()=>{counts.day++;return d();};
   const start=performance.now();showTab('nutrition');showTab('workouts');showTab('nutrition');
   return {...counts,elapsedMs:performance.now()-start};
 });
 console.log('Navigation two visits:',JSON.stringify(metrics));
 expect(metrics).toMatchObject({history:0,library:0,day:1});
 await page.evaluate(()=>{data.nutrition=[{date:today(),protein:80,calories:800,complete:true}];saveData(data);showTab('dashboard');});
 await expect(page.locator('#stat-protein')).toContainText('80 g');
});
test('reduced motion and visible keyboard focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>showTab('nutrition'));
 expect(await page.locator('#panel-nutrition').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await expect(page.locator('#panel-nutrition')).toBeFocused();
 await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>document.getElementById('panel-nutrition').contains(document.activeElement))).toBe(true);
});
