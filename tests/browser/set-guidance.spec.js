const {test,expect}=require('playwright/test'),{fixture,args}=require('../fixtures/phase-review');
test.use({serviceWorkers:'allow'});
test('set targets and next-set feedback update without revising approved plan or workout history',async({page})=>{
 await page.clock.install({time:new Date('2026-10-19T12:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(({seed,args})=>{
   data=normalizeDataShape({...data,...seed});
   const review=LoadnotePhaseReview.analyze(data,args);
   data=LoadnotePhaseReview.apply(data,review,{squat:'reduce-load',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:args.asOf,now:args.now});
   renderSchedule();
 },{seed:fixture(),args});
 await page.evaluate(()=>document.querySelector('[data-start="phase:ph:w4d0"]').click());
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,phaseReviews:data.phaseReviews}));
 const first=page.locator('#exercise-rows > div').first();
 await expect(first.locator('.set-target-note').first()).toContainText('RPE cap');
 await expect(first.locator('.next-set-guidance')).toContainText('Next set 1');
 await expect(first.locator('.set-done-check')).toHaveCount(await first.locator('.logger-set').count());
 await first.locator('.set-rpe').first().fill('9.5');await first.locator('.set-done-check').first().check();
 await expect(first.locator('.next-set-guidance')).toContainText('exceeded its approved RPE cap');
 await expect(first.locator('.next-set-guidance')).toContainText('Next set 2');
 await first.locator('.set-rpe').first().fill('');
 await expect(first.locator('.next-set-guidance')).toContainText('Enter actual RPE');
 await first.locator('.set-rpe').first().fill('7');
 await expect(first.locator('.next-set-guidance')).toContainText('met its approved RPE cap');
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem(LOGGER_DRAFT_KEY)));
 expect(draft.rows[0].sets[0].done).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,phaseReviews:data.phaseReviews}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.reload();await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('#exercise-rows > div').first().locator('.next-set-guidance')).toContainText('met its approved RPE cap');
});
test('unscheduled workouts have no in-set training claims',async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
 await page.locator('.ex-name').fill('Bench Press');await page.locator('.set-reps').fill('5');
 await expect(page.locator('.next-set-guidance')).toBeHidden();
 await expect(page.locator('.set-target-note')).toBeHidden();
});
