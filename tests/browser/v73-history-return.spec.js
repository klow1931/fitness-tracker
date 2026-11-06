const {test,expect}=require('playwright/test');
async function history(page){await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-history');});}
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{data=normalizeDataShape({...data,workouts:[{id:'original',date:'2026-09-01',notes:'Keep saved notes',exercises:[{name:'Bench Press',type:'strength',sets:[{weight:100,reps:5,rpe:8}]}]}]});saveData(data);invalidateViews();});
 await history(page);
});
test('active filters stay understandable and clearable with controls closed and in Full view',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await page.locator('#history-extra-filters>summary').click();await page.locator('#history-source').selectOption('repeated');await page.locator('#history-sort').selectOption('oldest');await page.locator('#history-extra-filters>summary').click();
 await expect(page.locator('#history-filter-status')).toBeVisible();await expect(page.locator('#history-filter-status')).toContainText('Source: Repeated workout');await expect(page.locator('#history-filter-status')).toContainText('Oldest first');await expect(page.locator('#workout-history')).toContainText('No matching workouts');
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('[data-hist-id]')).toHaveCount(1);await expect(page.locator('#history-filter-status')).toBeHidden();await expect(page.locator('#history-sort')).toHaveValue('newest');
 await page.locator('#history-search').fill('missing');await expect(page.locator('#history-filter-status')).toContainText('Search: missing');
 await page.evaluate(()=>showTab('dashboard'));await page.locator('#simple-show-all').click();await history(page);await expect(page.locator('#history-search')).toHaveValue('missing');await expect(page.locator('#history-filter-status')).toBeVisible();await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('[data-hist-id]')).toHaveCount(1);
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('invalid dates have a visible recovery path and resetting returns to the first page',async({page})=>{
 await page.evaluate(()=>{data.workouts=Array.from({length:23},(_,i)=>({...data.workouts[0],id:'session-'+i,notes:String(i)}));invalidateViews();renderWorkoutHistory();});
 await page.locator('[data-workout-action=history-next]').click();await expect(page.locator('[data-hist-id]')).toHaveCount(3);
 await page.locator('#history-extra-filters>summary').click();await page.locator('#history-from').fill('2026-10-02');await page.locator('#history-to').fill('2026-10-01');await page.locator('#history-extra-filters>summary').click();
 await expect(page.locator('#workout-history')).toContainText('Check the date range');await expect(page.locator('#workout-history')).toContainText('Choose an end date');await expect(page.locator('[data-hist-id]')).toHaveCount(0);
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('[data-hist-id]')).toHaveCount(20);await expect(page.locator('#workout-history')).toContainText('Page 1 of 2');expect(await page.evaluate(()=>data.workouts.length)).toBe(23);
});
test('Repeat workout starts today with converted targets and no invented performance, then saves a new record',async({page})=>{
 const original=await page.evaluate(()=>JSON.stringify(data.workouts[0]));await page.evaluate(()=>{setUnit('lb');renderWorkoutHistory();});
 await expect(page.locator('#history-action-help')).toBeVisible();await page.locator('[data-hist-id=original]').getByRole('button',{name:'Repeat workout',exact:true}).click();
 await expect(page.locator('.set-weight')).toHaveValue('220.5');await expect(page.locator('.set-rpe')).toHaveValue('');await expect(page.locator('.set-done-check')).not.toBeChecked();expect(await page.locator('#wo-date').inputValue()).toBe(await page.evaluate(()=>today()));expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.reload();await expect(page.locator('.ex-name')).toHaveValue('Bench Press');await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.set-weight')).toHaveValue('220.5');await expect(page.locator('.set-rpe')).toHaveValue('');
 await page.locator('.set-weight').fill('210');await page.locator('[data-quick-complete]:visible').click();await page.locator('[data-cockpit-review]').click();await expect(page.locator('#workout-review-content')).toContainText('210lb');await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(2);
 const result=await page.evaluate(()=>data.workouts.find(w=>w.id!=='original'));expect(result.exercises[0].sets[0].weight).toBeCloseTo(95.25,2);expect(result.exercises[0].sets[0].rpe).toBeFalsy();expect(result.id).not.toBe('original');expect(await page.evaluate(()=>JSON.stringify(data.workouts.find(w=>w.id==='original')))).toBe(original);
});
test('declining repeat replacement keeps the current draft and saved history',async({page})=>{
 await page.evaluate(()=>{showSubTab('workouts','wo-log');});await page.locator('.ex-name').fill('My current workout');await page.locator('.set-reps').fill('8');await page.locator('.set-weight').fill('35');
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));await history(page);page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Repeat workout',exact:true}).click();
 await expect(page.locator('[data-hist-id=original]')).toBeVisible();await page.evaluate(()=>showSubTab('workouts','wo-log'));await expect(page.locator('.ex-name')).toHaveValue('My current workout');await expect(page.locator('.set-weight')).toHaveValue('35');expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('empty History offers Train without replacing an unfinished workout',async({page})=>{
 await page.evaluate(()=>{showSubTab('workouts','wo-log');});await page.locator('.ex-name').fill('Unfinished');await page.locator('.set-weight').fill('20');await page.locator('.set-reps').fill('10');
 await page.evaluate(()=>{data.workouts=[];invalidateViews();});await history(page);await expect(page.locator('#workout-history')).toContainText('No workouts yet');await page.locator('#workout-history').getByRole('button',{name:'Go to Train',exact:true}).click();await expect(page.locator('.ex-name')).toHaveValue('Unfinished');await expect(page.locator('.set-weight')).toHaveValue('20');
});
test('narrow enlarged text and literal search remain usable with clear filters outside collapsed controls',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await page.locator('#history-search').fill('<img src=x onerror="window.injected=true">');await expect(page.locator('#history-filter-status')).toContainText('<img');expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('#history-filter-status img')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.getByRole('button',{name:'Repeat workout',exact:true})).toBeVisible();
});
