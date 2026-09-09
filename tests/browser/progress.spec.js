const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{constructor(ctx,config){window.lastChartConfig=config;}destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.addStyleTag({content:'.hidden{display:none!important}'});
 await page.evaluate(()=>{
  data.workouts=[{id:'one',date:'2026-01-01',exercises:[{name:'Bench',type:'strength',trackBy:'reps',sets:[{reps:5,weight:80}]}]},{id:'two',date:'2026-01-02',exercises:[{name:'Bench',type:'strength',trackBy:'reps',sets:[{reps:5,weight:100}]},{name:'Bench',type:'strength',trackBy:'duration',sets:[{duration:20,weight:10}]}]}];
  data.prs=LoadnoteSession.reconcilePRs([],data.workouts,estimated1RM,()=> 'pr');invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');
 });
});
test('History date filters and pages handle varied card heights',async({page})=>{
 await page.evaluate(()=>{data.workouts=Array.from({length:45},(_,i)=>({id:String(i),date:'2026-01-02',notes:'Long note '.repeat(i+1),exercises:[{name:'Bench',sets:[{reps:5,weight:i+1}]}]}));renderWorkoutHistory();});
 await expect(page.locator('[data-hist-id]')).toHaveCount(20);await page.locator('#workout-history summary').first().click();
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('#workout-history')).toContainText('Page 2 of 3');
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('[data-hist-id]')).toHaveCount(5);
 await page.locator('#history-from').fill('2026-02-01');await expect(page.locator('#workout-history')).toContainText('No matches');
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('#workout-history')).toContainText('Page 1 of 3');
});
test('Exercise details distinguish actual loads, estimates and hold tracking',async({page})=>{
 await page.locator('[data-hist-id="two"] summary').click();await page.locator('[data-hist-id="two"] [data-tracking="reps"]').click();
 await expect(page.locator('#detail-summary')).toContainText('100 kg');await page.locator('#detail-metric').selectOption('estimate');
 expect(await page.evaluate(()=>window.lastChartConfig.data.datasets[0].label)).toContain('Estimated 1RM');
 await page.locator('#detail-range').selectOption('4');await expect(page.locator('#detail-summary')).toContainText('No matching sessions');
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('[data-hist-id="two"] [data-tracking="duration"]').click();await expect(page.locator('#detail-metric-label')).not.toBeVisible();await expect(page.locator('#detail-sessions')).toContainText('20s');
});
test('Comparison keeps unmatched tracking modes separate',async({page})=>{
 await page.locator('[data-hist-id="two"] [data-workout-action="compare-session"]').click();
 await expect(page.locator('#comparison-results')).toContainText('Not in this workout');await expect(page.locator('#comparison-results')).toContainText('80kg');await expect(page.locator('#comparison-results')).toContainText('100kg');
 await page.locator('#compare-b').selectOption('two');await expect(page.locator('#comparison-results')).toContainText('two different');
});
test('Deleting a record source recalculates PRs; failed deletion preserves both',async({page})=>{
 page.once('dialog',d=>d.accept());await page.locator('[data-hist-id="two"] [data-workout-action="delete"]').click();
 await expect(page.locator('[data-hist-id]')).toHaveCount(1);expect(await page.evaluate(()=>data.prs[0].weight)).toBe(80);
 await page.evaluate(()=>{persistNow=async()=>{throw Error('quota');};});page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="delete"]').click();
 await expect(page.locator('#toast-host')).toContainText('Could not delete');expect(await page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.prs[0].weight)).toBe(80);
});
test('Chart range and metric controls use filtered actual data',async({page})=>{
 await page.evaluate(()=>{showTab('dashboard');document.getElementById('progress-exercise').value='Bench';renderProgressChart();});
 await page.locator('#progress-metric').selectOption('load');await expect(page.locator('#progress-description')).toContainText('Heaviest actual set');
 await page.locator('#progress-range').selectOption('4');await expect(page.locator('#progress-description')).toContainText('No rep-based strength data');
});
