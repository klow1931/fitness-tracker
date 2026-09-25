const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-04T19:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  data=LoadnotePhaseBuilder.save(data,LoadnotePhaseBuilder.prepare(data,seed.config,args),{confirmed:true},{...args,id:'setup'});
  const p=LoadnoteMeetCycle.prepare(data,data.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args);
  data=LoadnoteMeetCycle.save(data,p,{confirmed:true},{...args,id:'c12'});
  data=LoadnoteMeetCycle.schedule(data,'c12',{...args,now:'2026-09-24T13:00:00.000Z'});
  showTab('coach');showSubTab('coach','co-programs');renderPhaseReview();
 },phaseFixture());
});
test('weekly review is compact, explains missing evidence, and requires approval to save a keep review',async({page})=>{
 const host=page.locator('#cycle-week-review');
 await expect(host).toContainText('completed training weeks');
 await host.locator('.cycle-review-panel > summary').click();
 await host.locator('#cycle-review-analyze').click();
 await expect(host).toContainText('Week 1');
 await expect(host).toContainText('unconfirmed');
 await expect(host.locator('[data-cycle-review-choice]')).toHaveCount(3);
 expect(await host.locator('[data-cycle-review-choice="squat"] option').count()).toBe(1);
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,original:data.meetCycles[0].sessions}));
 await host.locator('#cycle-review-save').click();
 await expect(host.locator('#cycle-review-error')).toContainText('Approve');
 await host.locator('#cycle-review-confirm').check();
 await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.length)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,original:data.meetCycles[0].sessions}))).toBe(before);
 await page.reload();await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderPhaseReview();});
 await expect(page.locator('#cycle-week-review')).not.toContainText('1 awaiting review');
});
test('linked completed sets offer a bounded independent lift choice without silent scheduling',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.evaluate(()=>{
  for(const row of data.meetCycles[0].sessions.filter(s=>s.week===1)){
   const record=data.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
   data.workouts.push({id:'logged-'+row.key,date:row.date,createdAt:row.date+'T17:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({weight:s.weight,reps:s.reps,rpe:e.exerciseId==='s'&&i<2?Math.min(10,s.targetRpe+1):s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
  }
  renderPhaseReview();
 });
 const host=page.locator('#cycle-week-review');await host.locator('.cycle-review-panel > summary').click();await host.locator('#cycle-review-analyze').click();
 await expect(host.locator('[data-cycle-review-choice="squat"] option')).toHaveCount(2);
 await expect(host.locator('[data-cycle-review-choice="bench"] option')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,original:data.meetCycles[0].sessions}));
 await host.locator('[data-cycle-review-choice="squat"]').selectOption('reduce-one');
 await host.locator('#cycle-review-confirm').check();
 await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.[0]?.changes.length)).toBe(2);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,original:data.meetCycles[0].sessions}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
