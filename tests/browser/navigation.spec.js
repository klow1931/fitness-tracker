const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
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

test('v2.1 primary navigation centers Train Progress and Decisions',async({page})=>{
 const labels=await page.locator('#mobile-nav .mobile-nav-btn span:last-child').allTextContents();
 expect(labels).toEqual(['Home','Train','Progress','Decisions','More']);
 await page.evaluate(()=>showTab('coach'));
 await expect(page.locator('[data-panel="coach"][data-sub="co-programs"]')).toBeVisible();
 await expect(page.locator('[data-panel="coach"][data-sub="co-insights"]')).toBeHidden();
 await expect(page.locator('#decision-readiness-card')).toBeVisible();
 await page.evaluate(()=>showTab('prs'));
 await expect(page.locator('#progress-overview')).toBeVisible();
 await expect(page.locator('#training-review')).toBeVisible();
 expect(await page.locator('#panel-dashboard #training-review').count()).toBe(0);
});

test('visible form controls stay inside cards and viewport on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const panels=['dashboard','workouts','nutrition','prs','measures','photos','coach','tools'];
 for(const panel of panels){
   await page.evaluate(panel=>showTab(panel),panel);
   await page.evaluate(()=>{
     document.querySelectorAll('details').forEach(d=>{if(!d.closest('.hidden'))d.open=true;});
   });
   const offenders=await page.locator('input:not([type=checkbox]):not([type=radio]), select, textarea').evaluateAll(nodes=>nodes.filter(el=>{
     const style=getComputedStyle(el),r=el.getBoundingClientRect();
     if(style.display==='none'||style.visibility==='hidden'||r.width===0||r.height===0)return false;
     const card=el.closest('.card,.session-review,.mobile-more-panel,section');
     const cr=card?.getBoundingClientRect();
     return r.right>innerWidth+1||r.left<-1||(cr&&(r.right>cr.right+1||r.left<cr.left-1));
   }).map(el=>({id:el.id,cls:el.className,tag:el.tagName,rect:el.getBoundingClientRect().toJSON()})));
   expect(offenders, panel+' overflowing controls').toEqual([]);
 }
});

test('date inputs stay inside mobile grid columns',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const panel of ['workouts','prs','measures','coach','tools']){
   await page.evaluate(panel=>showTab(panel),panel);
   const offenders=await page.locator('input[type=date]').evaluateAll(nodes=>nodes.filter(el=>{
     const r=el.getBoundingClientRect(),style=getComputedStyle(el);
     if(style.display==='none'||style.visibility==='hidden'||r.width===0||r.height===0)return false;
     const parent=el.parentElement?.getBoundingClientRect();
     return r.right>innerWidth+1||r.left<-1||(parent&&(r.right>parent.right+1||r.left<parent.left-1));
   }).map(el=>({id:el.id,rect:el.getBoundingClientRect().toJSON(),parent:el.parentElement?.getBoundingClientRect().toJSON()})));
   expect(offenders,panel+' date input overflow').toEqual([]);
 }
});

test('primary navigation and Home hide secondary tools without removing them',async({page})=>{
 await expect(page.locator('#desktop-more')).toBeVisible();
 expect(await page.locator('.desktop-tabs > button').allTextContents()).toEqual(['Home','Train','Progress','Decisions']);
 await expect(page.locator('#home-details')).not.toHaveAttribute('open','');
 await expect(page.locator('#athlete-home-command')).toBeVisible();
 await expect(page.locator('#week-plan')).toBeVisible();
 await page.locator('#home-details > summary').click();
 await expect(page.locator('#home-stats-grid')).toBeVisible();
 await page.locator('#desktop-more > summary').click();
 await expect(page.locator('#desktop-more-menu')).toHaveCount(0);
 await page.locator('#tab-calendar').click();
 await expect(page.locator('#panel-calendar')).toBeVisible();
 await expect(page.locator('#desktop-more')).not.toHaveAttribute('open','');
 await page.evaluate(()=>showTab('coach'));
 await expect(page.locator('.coach-programming-details')).not.toHaveAttribute('open','');
 await expect(page.locator('#decision-readiness-card')).toBeVisible();
 await page.locator('.coach-programming-details > summary').click();
 await expect(page.locator('#athlete-profile-card')).toBeVisible();
});
test('mobile More groups secondary destinations',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobile-nav [data-tab="more"]').click();
 await expect(page.locator('#mobile-more-sheet')).toBeVisible();
 await expect(page.locator('.mobile-more-group[open]')).toHaveCount(0);
 await page.locator('.mobile-more-group').first().locator('summary').click();
 await page.locator('.mobile-more-group').first().getByRole('button',{name:/Calendar/}).click();
 await expect(page.locator('#panel-calendar')).toBeVisible();
 await expect(page.locator('#mobile-more-sheet')).toBeHidden();
});
