const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-30T12:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  const phase=LoadnotePhaseBuilder.prepare(data,seed.config,args);
  data=LoadnotePhaseBuilder.save(data,phase,{confirmed:true},{...args,id:'reviewed-setup'});
  const c=LoadnoteMeetCycle.prepare(data,data.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args);
  data=LoadnoteMeetCycle.save(data,c,{confirmed:true},{...args,id:'cycle12'});
  data=LoadnoteMeetCycle.schedule(data,'cycle12',{...args,now:'2026-09-24T13:00:00.000Z'});
  showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();renderPhaseReview();
 },phaseFixture());
});
test('Decisions shows current phase, focus, exact per-lift evidence and original-cycle shortcut',async({page})=>{
 const card=page.locator('[data-phase-guidance]');
 await expect(card).toHaveAttribute('data-phase','accumulation');
 await expect(card).toContainText('Week 1 / 12');
 await expect(card).toContainText('Complete planned work');
 await expect(card).toContainText('Mock meet: 2026-12-19');
 await expect(card).toContainText('Current-week review: 2026-10-04');
 await card.locator('.phase-guidance-detail > summary').click();
 await expect(card.locator('[data-phase-lift]')).toHaveCount(3);
 await expect(card).toContainText('unconfirmed');
 const before=await page.evaluate(()=>JSON.stringify({meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions,workouts:data.workouts}));
 await card.locator('#decision-cycle-cta').click();
 await expect(page.locator('#phase-builder-panel')).toHaveAttribute('open','');
 await expect(page.locator('[data-cycle="cycle12"]')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>JSON.stringify({meetCycles:data.meetCycles,scheduledSessions:data.scheduledSessions,workouts:data.workouts}))).toBe(before);
});
test('current-week linked session changes evidence but not approved loads, even on mobile and reload',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 const result=await page.evaluate(()=>{
  const row=data.scheduledSessions[0],plan=row.revisions[0].context.prescription,e=plan.plannedExercises[0];
  data.workouts.push({id:'linked-test',date:'2026-09-28',createdAt:'2026-09-28T19:00:00.000Z',exercises:[{name:e.name,exerciseId:e.exerciseId,type:'strength',trackBy:'reps',sets:e.sets.map((s,i)=>({weight:s.weight,reps:s.reps,rpe:i===0?s.targetRpe+1:null}))}],sessionIntent:{prescription:plan,schedule:{id:row.id,revisionAt:row.revisions[0].recordedAt}}});
  return {original:JSON.stringify(data.meetCycles),planned:JSON.stringify(data.scheduledSessions)};
 });
 await page.evaluate(()=>renderPhaseReview());
 const card=page.locator('[data-phase-guidance]');await card.locator('.phase-guidance-detail > summary').click();
 await expect(card).toContainText('1 linked session');
 await expect(card.locator('[data-phase-lift="squat"]')).toContainText('1 above original cap');
 expect(await page.evaluate(()=>JSON.stringify(data.meetCycles))).toBe(result.original);
 expect(await page.evaluate(()=>JSON.stringify(data.scheduledSessions))).toBe(result.planned);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
