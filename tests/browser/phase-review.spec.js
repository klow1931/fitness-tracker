const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/phase-review');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-10-18T22:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');renderPhaseReview();},fixture());await page.locator('#phase-review-panel > summary').click();});
async function review(page){await page.locator('#phase-review-program').selectOption('ph');for(const k of ['sleep','fatigue','soreness'])await page.locator(`[data-phase-check="${k}"]`).selectOption('usual');await page.locator('[data-phase-check="discomfort"]').selectOption('none');await page.locator('#phase-review-generate').click();await expect(page.locator('#phase-review-report')).toContainText('reduce-load');await page.locator('[data-phase-choice="squat"]').selectOption('reduce-load');}
test('phase approval preserves originals, exports review history and survives offline reload',async({page,context})=>{
 await review(page);const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,originals:data.scheduledSessions.map(s=>s.revisions[0])}));
 await page.locator('#phase-review-apply').click();await expect(page.locator('#phase-review-error')).toContainText('Confirm');await page.locator('#phase-review-confirm').check();await page.locator('#phase-review-apply').click();await expect.poll(()=>page.evaluate(()=>data.phaseReviews.length)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,originals:data.scheduledSessions.map(s=>s.revisions[0])}))).toBe(before);expect(await page.evaluate(()=>data.scheduledSessions.filter(s=>s.revisions.length===2).length)).toBe(6);
 expect(await page.evaluate(()=>JSON.stringify(normalizeDataShape(JSON.parse(JSON.stringify(data))).phaseReviews)===JSON.stringify(data.phaseReviews))).toBe(true);
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);expect(await page.evaluate(()=>data.phaseReviews.length)).toBe(1);expect(await page.evaluate(()=>data.scheduledSessions.filter(s=>s.revisions.length===2).length)).toBe(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('phase preview invalidation, failed storage and draft locks do not revise data',async({page})=>{
 await review(page);await page.locator('[data-phase-check="fatigue"]').selectOption('worse');await expect(page.locator('#phase-review-report')).toBeEmpty();await page.locator('#phase-review-generate').click();await page.locator('[data-phase-choice="squat"]').selectOption('reduce-load');await page.locator('#phase-review-confirm').check();
 await page.evaluate(()=>{window.realPersist=persistNow;persistNow=async()=>{throw Error('Storage full');};});await page.locator('#phase-review-apply').click();await expect(page.locator('#phase-review-error')).toContainText('Storage full');expect(await page.evaluate(()=>data.phaseReviews.length)).toBe(0);expect(await page.evaluate(()=>data.scheduledSessions.every(s=>s.revisions.length===1))).toBe(true);
 await page.evaluate(()=>{persistNow=window.realPersist;pendingScheduledSession={id:data.scheduledSessions[9].id};});await page.locator('#phase-review-apply').click();await expect(page.locator('#phase-review-error')).toContainText('workout draft');expect(await page.evaluate(()=>data.phaseReviews.length)).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('supported per-lift progression is optional and retains the unmodified program',async({page})=>{
 await page.evaluate(()=>{for(const w of data.workouts)for(const e of w.exercises)if(e.exerciseId==='b')for(const set of e.sets)set.rpe=Math.max(6,set.targetRpe-1);renderPhaseReview();});
 await page.locator('#phase-review-program').selectOption('ph');
 for(const k of ['sleep','fatigue','soreness'])await page.locator(`[data-phase-check="${k}"]`).selectOption('usual');
 await page.locator('[data-phase-check="discomfort"]').selectOption('none');
 await page.locator('#phase-review-generate').click();
 await expect(page.locator('[data-phase-choice="bench"] option[value="progress"]')).toHaveCount(1);
 await expect(page.locator('#phase-review-report')).toContainText('2.5%');
 await page.locator('[data-phase-choice="bench"]').selectOption('progress');
 await expect(page.locator('#phase-review-changes')).toContainText('Exact next-phase changes');
 await page.locator('#phase-review-confirm').check();
 await page.locator('#phase-review-apply').click();
 await expect.poll(()=>page.evaluate(()=>data.phaseReviews.length)).toBe(1);
 expect(await page.evaluate(()=>data.phaseReviews[0].choices.bench)).toBe('progress');
 expect(await page.evaluate(()=>data.scheduledSessions.filter(s=>s.revisions.length===2).length)).toBe(9);
 expect(await page.evaluate(()=>data.phasePrograms[0].config.lifts.bench.trainingMaxKg>0)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('Decisions highlights the plan and routes into a phase review without burying logging',async({page})=>{
 await expect(page.locator('#decision-action-center')).toContainText('Your training plan');
 await expect(page.locator('#decision-action-center')).toContainText('Next:');
 await page.locator('#decision-review-cta').click();
 await expect(page.locator('#phase-review-panel')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
