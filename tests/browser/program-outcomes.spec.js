const {test,expect}=require('playwright/test'),{outcomesFixture}=require('../fixtures/program-outcomes');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
  await page.clock.install({time:new Date('2026-09-20T22:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
  await page.evaluate(async seed=>{data=normalizeDataShape({...data,...seed});await persistNow(data);showTab('coach');showSubTab('coach','co-programs');renderProgramOutcomes();},outcomesFixture());
  await page.locator('#program-outcomes-panel > summary').click();
});
test('compact outcome timeline and historical cutoff preserve all stored training data',async({page})=>{
  const snapshot=await page.evaluate(()=>JSON.stringify(data));
  const review=page.locator('.outcome-review');await expect(review).not.toHaveAttribute('open','');await review.locator(':scope > summary').click();
  const squat=page.locator('[data-outcome-lift="squat"]');await expect(squat).toContainText('2 / 2 sessions comparable');await expect(squat).toContainText('All comparable sessions within RPE caps');
  await expect(page.locator('[data-outcome-lift="deadlift"]')).toContainText('Not enough comparable data');
  await squat.locator('details > summary').click();await expect(squat).toContainText('Plan at approval:');await expect(squat).toContainText('Recorded work:');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('#program-outcomes-date').fill('2026-09-14');await page.locator('#program-outcomes-date').dispatchEvent('change');await page.locator('.outcome-review > summary').click();await expect(squat).toContainText('1 / 2 sessions comparable');await expect(squat).toContainText('Not enough comparable data');
  await page.locator('#program-outcomes-date').fill('2026-09-12');await page.locator('#program-outcomes-date').dispatchEvent('change');await expect(page.locator('#program-outcomes-report')).toContainText('No accepted program reviews');
  expect(await page.evaluate(()=>JSON.stringify(data))).toBe(snapshot);
});
test('outcomes work offline in night mode with lb display and unchanged kg records',async({page,context})=>{
  await page.evaluate(async()=>{data.dark=true;data.unit='lb';applyDark();await persistNow(data);renderProgramOutcomes();});
  const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,reviews:data.programReviews,schedule:data.scheduledSessions}));
  await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
  await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderProgramOutcomes();});await page.locator('#program-outcomes-panel > summary').click();await page.locator('.outcome-review > summary').click();
  const squat=page.locator('[data-outcome-lift="squat"]');await squat.locator('details > summary').click();await expect(squat).toContainText(' lb');await expect(squat).toContainText('All comparable sessions within RPE caps');
  expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,reviews:data.programReviews,schedule:data.scheduledSessions}))).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
