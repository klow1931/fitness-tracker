const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test('evidence checklist routes to existing mappings and weekly review works offline without writes',async({page,context})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
 const lift=page.locator('[data-decision-lift="squat"]');await lift.locator('summary.decision-lift-summary').click();await lift.locator('.decision-next-steps > summary').click();await expect(lift.locator('.decision-next-steps')).toContainText('do not raise effort');
 const before=await page.evaluate(()=>JSON.stringify(data));await lift.locator('[data-evidence-target="mapping"]').click();await expect(page.locator('#readiness-mappings')).toBeVisible();
 await page.locator('#weekly-decision-review > summary').click();await expect(page.locator('#weekly-decision-review')).toContainText('0 responses');await expect(page.locator('#weekly-decision-review')).toContainText('Load direction is not strength gain');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 const box=await page.locator('#weekly-decision-review').boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width+1);
 await page.locator('.decision-date-tools > summary').click();await page.locator('#readiness-date').fill('2026-01-01');await page.locator('#readiness-date').dispatchEvent('change');await expect(page.locator('[data-evidence-target]')).toHaveCount(0);await expect(page.locator('#weekly-decision-review')).toContainText('2026-01-01');
});
