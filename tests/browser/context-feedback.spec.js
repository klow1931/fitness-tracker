const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test('context analysis stays collapsed, handles old feedback, and compares without writes offline',async({page,context})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(async()=>{
  data.decisionEvents=LoadnoteDecisionFeedback.record([],{version:5,asOf:'2026-01-02',lift:'squat',decision:'hold',decisionAllowed:true,evidence:[{date:'2026-01-02',workoutId:'base',exerciseId:'sq',estimatedCapacity:120}]},{response:'accept'},{now:'2026-01-02T12:00:00.000Z',id:'old'});
  data.workouts=[{id:'follow',date:'2026-01-03',createdAt:'2026-01-03T12:00:00.000Z',exercises:[{name:'Squat',exerciseId:'sq',sets:[{weight:100,reps:5,rpe:8}]}]}];data.dark=true;await persistNow(data);
 });
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderDecisionReadiness();});
 await page.locator('.decision-review-tools > summary').click();await page.locator('.decision-performance > summary').click();
 await expect(page.locator('#context-comparisons')).not.toHaveAttribute('open','');
 await page.locator('#context-comparisons > summary').click();await expect(page.locator('#context-comparisons')).toContainText('Context unavailable');await expect(page.locator('#context-comparisons')).toContainText('Not enough data');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#policy-experiment > summary').click();await page.locator('[data-context-compare]').click();await expect(page.locator('#comparison-result')).toContainText('No policy is selected or applied');await expect(page.locator('#comparison-result')).toContainText('Not enough data');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 const box=await page.locator('#policy-experiment').boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width+1);
});
