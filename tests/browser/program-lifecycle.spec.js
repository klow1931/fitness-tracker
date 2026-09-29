const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');

test.use({serviceWorkers:'allow'});

async function bootPhase(page,clock='2026-10-18T12:00:00.000Z'){
 await page.clock.install({time:new Date(clock)});
 await page.goto('/');
 await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  data.athleteGoals=LoadnoteGoals.upsert(data.athleteGoals||[],{name:'Lifecycle goal',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-23T09:00:00.000Z'});
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  data=LoadnotePhaseBuilder.save(data,LoadnotePhaseBuilder.prepare(data,seed.config,args),{confirmed:true,notes:'Lifecycle browser'},{...args,id:'browser-life'});
  data=LoadnotePhaseBuilder.schedule(data,'browser-life',{...args,now:'2026-09-24T13:00:00.000Z'});
  const program=data.phasePrograms.find(p=>p.id==='browser-life');
  const phaseEnd='2026-10-18';
  for(const session of program.sessions.filter(s=>s.date<=phaseEnd)){
   const id='phase:'+program.id+':'+session.key,record=data.scheduledSessions.find(x=>x.id===id),rev=record.revisions.at(-1),plan=rev.context.prescription;
   data.workouts.push({id:'browser-'+session.key,date:session.date,createdAt:session.date+'T20:00:00.000Z',updatedAt:session.date+'T20:00:00.000Z',
    exercises:plan.plannedExercises.map(e=>({...e,sets:(e.sets||[]).map(s=>({...s,rpe:s.targetRpe||8}))})),
    sessionIntent:{role:rev.context.role,goal:rev.context.goal,prescription:structuredClone(plan),schedule:{id,revisionAt:rev.recordedAt},deviationReason:'none',deviationNotes:''}});
  }
  saveData(data);renderDashboard();
 },phaseFixture());
}

test('v2.61 Home surfaces the due phase review before next-phase training',async({page})=>{
 await bootPhase(page);
 const lifecycle=page.locator('#program-lifecycle-home');
 await expect(lifecycle).toBeVisible();
 await expect(lifecycle).toContainText('Phased strength');
 await expect(lifecycle).toContainText('Review Accumulation phase');
 await lifecycle.getByRole('button',{name:'Review phase'}).click();
 await expect(page.locator('#panel-coach')).toBeVisible();
 await expect(page.locator('#phase-review-panel')).toHaveAttribute('open','');
 await expect(page.locator('#phase-review-program')).toHaveValue('browser-life');
 await expect(page.locator('#phase-review-type')).toHaveValue('accumulation');
});

test('v2.61 Home and Coach resolve the same deterministic next action',async({page})=>{
 await bootPhase(page);
 const homeText=await page.locator('#program-lifecycle-home .program-lifecycle-next b').textContent();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
 await expect(page.locator('#decision-action-center .program-lifecycle-coach')).toBeVisible();
 await expect(page.locator('#decision-action-center .program-lifecycle-next b')).toHaveText(homeText);
 await expect(page.locator('#decision-action-center')).toContainText('Week 3 of 7');
});

test('v2.61 does not guess when two scheduled programs overlap today',async({page})=>{
 await bootPhase(page,'2026-10-06T12:00:00.000Z');
 await page.evaluate(()=>{
  const original=data.phasePrograms.find(p=>p.id==='browser-life'),copy=structuredClone(original);
  copy.id='overlap-life';copy.createdAt='2026-09-24T12:30:00.000Z';copy.review.recordedAt=copy.createdAt;copy.scheduledAt='2026-09-24T13:30:00.000Z';
  data.phasePrograms.push(copy);
  for(const session of copy.sessions){
   const source=data.scheduledSessions.find(x=>x.id==='phase:browser-life:'+session.key);
   const cloned=structuredClone(source);cloned.id='phase:overlap-life:'+session.key;data.scheduledSessions.push(cloned);
  }
  renderDashboard();
 });
 const lifecycle=page.locator('#program-lifecycle-home');
 await expect(lifecycle).toContainText('Review overlapping programs');
 await expect(lifecycle).toContainText('Loadnote will not guess');
});

test('v2.61 active program card remains compact on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await bootPhase(page);
 const lifecycle=page.locator('#program-lifecycle-home');
 await expect(lifecycle.getByRole('button',{name:'Review phase'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});


test('v2.61 a missed review window stays visible but does not trap later training',async({page})=>{
 await bootPhase(page,'2026-10-19T12:00:00.000Z');
 const state=await page.evaluate(()=>LoadnoteProgramLifecycle.inspect(data,{asOf:today()}));
 expect(state.missedReviews.some(x=>x.kind==='phase'&&x.phase==='accumulation')).toBe(true);
 expect(state.nextAction.kind).toBe('start-workout');
 const todayCard=page.locator('#today-training');
 await expect(todayCard.getByRole('button',{name:'Start workout'})).toBeVisible();
 await todayCard.getByRole('button',{name:'Start workout'}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 expect(await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id||null)).toBe(state.nextAction.scheduleId);
});
