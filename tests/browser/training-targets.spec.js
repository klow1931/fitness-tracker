const {test,expect}=require('playwright/test');
const {fixture,args}=require('../fixtures/phase-review');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-19T12:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(({seed,args})=>{
  data=normalizeDataShape({...data,...seed});
  const report=LoadnotePhaseReview.analyze(data,args);
  data=LoadnotePhaseReview.apply(data,report,{squat:'reduce-load',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:args.asOf,now:args.now});
  document.getElementById('home-week-plan').open=true;renderSchedule();
 },{seed:fixture(),args});
});
test('calendar and active workout show approved per-lift targets, preceding evidence and rationale without editing draft',async({page})=>{
 const target=page.locator('[data-target-panel="phase:ph:w4d0"]');
 await target.locator('summary').click();
 await expect(target).toContainText('Previous logged (2026-10-16)');
 await expect(target).toContainText('reduce-load');
 await expect(target).toContainText('Approved change');
 const scheduled=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,phaseReviews:data.phaseReviews,scheduledSessions:data.scheduledSessions}));
 await page.locator('[data-start="phase:ph:w4d0"]').click();
 await expect(page.locator('#workout-plan-context')).toBeVisible();
 await page.locator('#workout-plan-context > summary').click();
 await expect(page.locator('#workout-plan-context-body')).toContainText('Previous logged (2026-10-16)');
 await expect(page.locator('#workout-plan-context-body')).toContainText('RPE cap');
 await expect(page.locator('#workout-plan-context-body')).toContainText('reduce-load');
 const snapshot=await page.evaluate(()=>JSON.stringify(captureLoggerDraft()));
 await page.locator('#workout-plan-context > summary').click();
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem(LOGGER_DRAFT_KEY)));
 const captured=JSON.parse(snapshot);delete draft.updatedAt;delete captured.updatedAt;expect(draft).toEqual(captured);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,phaseReviews:data.phaseReviews,scheduledSessions:data.scheduledSessions}))).toBe(scheduled);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('standalone logger stays uncluttered when no scheduled workout is loaded',async({page})=>{
 await page.evaluate(()=>{clearWorkoutForm(true);renderPrescriptionSummary();});
 await expect(page.locator('#workout-plan-context')).toBeHidden();
});
