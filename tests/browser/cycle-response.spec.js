const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T20:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  data=LoadnotePhaseBuilder.save(data,LoadnotePhaseBuilder.prepare(data,seed.config,args),{confirmed:true},{...args,id:'setup'});
  const p=LoadnoteMeetCycle.prepare(data,data.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args);
  data=LoadnoteMeetCycle.save(data,p,{confirmed:true},{...args,id:'cycle12'});
  data=LoadnoteMeetCycle.schedule(data,'cycle12',{...args,now:'2026-09-24T13:00:00.000Z'});
  showTab('coach');showSubTab('coach','co-programs');renderPhaseReview();
 },phaseFixture());
});
test('Decisions displays separate completed-phase summaries with honest sparse evidence',async({page})=>{
 const container=page.locator('#cycle-response');
 await expect(container).toContainText('Training response · 5 of 12 completed weeks');
 await container.locator('.cycle-response-panel > summary').click();
 await expect(container.locator('[data-response-phase]')).toHaveCount(2);
 await container.locator('[data-response-phase="accumulation"] > summary').click();
 await expect(container.locator('[data-response-lift]')).toHaveCount(3);
 await expect(container).toContainText('No within-phase capacity comparison');
 await expect(container).toContainText('unconfirmed');
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions}));
 await container.locator('[data-response-phase="strength"] > summary').click();
 await expect(container).toContainText('strength');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions}))).toBe(before);
});
test('mobile linked workouts produce competition-specific response and leave prescribed sessions unchanged',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 const original=await page.evaluate(()=>{
  for(const item of data.meetCycles[0].sessions.filter(s=>s.week<=5)){
   const row=data.scheduledSessions.find(r=>r.id==='meet:cycle12:'+item.key),p=row.revisions[0].context.prescription;
   data.workouts.push({id:'linked-'+item.key,date:item.date,createdAt:item.date+'T18:00:00.000Z',sessionIntent:{schedule:{id:row.id,revisionAt:row.revisions[0].recordedAt},prescription:p},
   exercises:p.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({...s,rpe:s.targetRpe,weight:s.weight+(e.exerciseId==='s'&&i===0?item.week*2.5:0)}))}))});
  }
  return JSON.stringify({meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions});
 });
 await page.evaluate(()=>renderPhaseReview());
 const container=page.locator('#cycle-response');
 await container.locator('.cycle-response-panel > summary').click();
 await container.locator('[data-response-phase="accumulation"] > summary').click();
 await expect(container.locator('[data-response-phase="accumulation"] [data-response-lift="squat"]')).toContainText('Observed estimated-capacity difference');
 await expect(container.locator('[data-response-phase="strength"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify({meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions}))).toBe(original);
});
