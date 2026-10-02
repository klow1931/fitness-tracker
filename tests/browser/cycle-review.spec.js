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
  showTab('coach');showSubTab('coach','co-programs');renderPhaseReview();document.getElementById('phase-review-panel').open=true;
 },phaseFixture());
});
test('weekly review is compact, explains missing evidence, and requires approval to save a keep review',async({page})=>{
 const host=page.locator('#cycle-week-review');
 await expect(host).toHaveCount(1);
 await expect(host).toContainText('completed training weeks');
 await host.locator('.cycle-review-panel > summary').click();
 await host.locator('#cycle-review-analyze').click();
 await expect(host).toContainText('Week 1');
 await expect(host).toContainText('Accumulation: protect repeatable volume');
 await expect(host.locator('[data-cycle-phase-policy]')).toContainText('increase one load increment');
 await expect(host).toContainText('unconfirmed');
 await expect(host.locator('[data-cycle-review-choice]')).toHaveCount(3);
 expect(await host.locator('[data-cycle-review-choice="squat"] option').count()).toBe(1);
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,original:data.meetCycles[0].sessions}));
 await host.locator('#cycle-review-save').click();
 await expect(host.locator('#cycle-review-error')).toContainText('Approve');
 await host.locator('#cycle-review-confirm').check();
 await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.length)).toBe(1);
 expect(await page.evaluate(()=>data.meetCycles[0].weeklyReviews[0].version)).toBe(5);
 expect(await page.evaluate(()=>data.meetCycles[0].weeklyReviews[0].controllerSnapshot?.environment?.releaseVersion)).toBe('2.75.0');
 await expect(page.locator('#cycle-journal')).toContainText('Cycle journal');
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
  data.unit='lb';renderPhaseReview();
 });
 const host=page.locator('#cycle-week-review');await host.locator('.cycle-review-panel > summary').click();await host.locator('#cycle-review-analyze').click();
 await expect(host.locator('[data-cycle-review-choice="squat"] option')).toHaveCount(3);
 await expect(host.locator('[data-cycle-review-choice="squat"] option[value="reduce-load"]')).toContainText('lb');
 await expect(host.locator('[data-cycle-review-choice="bench"] option')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,original:data.meetCycles[0].sessions}));
 await host.locator('[data-cycle-review-choice="squat"]').selectOption('reduce-one');
 await host.locator('#cycle-review-confirm').check();
 await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.[0]?.changes.length)).toBe(2);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,original:data.meetCycles[0].sessions}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('fully completed below-cap competition bench can approve one-increment upward progression without changing structure',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.evaluate(()=>{
  data.unit='lb';
  for(const row of data.meetCycles[0].sessions.filter(s=>s.week===1)){
   const record=data.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
   data.workouts.push({id:'easy-'+row.key,date:row.date,createdAt:row.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:e.exerciseId==='b'?Math.max(1,s.targetRpe-.5):s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
  }
  renderPhaseReview();
 });
 const host=page.locator('#cycle-week-review');await host.locator('.cycle-review-panel > summary').click();await host.locator('#cycle-review-analyze').click();
 const bench=host.locator('[data-cycle-review-choice="bench"]');
 await expect(bench.locator('option[value="increase-load"]')).toContainText('lb');
 const originalCycle=await page.evaluate(()=>JSON.stringify(data.meetCycles[0].sessions));
 const before=await page.evaluate(()=>data.meetCycles[0].sessions.filter(s=>s.week===2).flatMap(s=>s.exercises.filter(e=>e.exerciseId==='b').map(e=>({key:s.key,sets:e.sets.map(x=>({weight:x.weight,reps:x.reps}))}))));
 await bench.selectOption('increase-load');await host.locator('#cycle-review-confirm').check();await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.[0]?.choices?.bench)).toBe('increase-load');
 const after=await page.evaluate(()=>{const cycle=data.meetCycles[0];return cycle.sessions.filter(s=>s.week===2).flatMap(s=>s.exercises.filter(e=>e.exerciseId==='b').map(e=>{const row=LoadnoteSchedule.list(data.scheduledSessions).find(x=>x.id==='meet:'+cycle.id+':'+s.key),planned=row.prescription.plannedExercises.find(x=>x.exerciseId==='b');return {key:s.key,sets:planned.sets.map(x=>({weight:x.weight,reps:x.reps}))};}));});
 expect(after.length).toBe(before.length);
 for(let i=0;i<before.length;i++){expect(after[i].sets.length).toBe(before[i].sets.length);for(let j=0;j<before[i].sets.length;j++){expect(after[i].sets[j].reps).toBe(before[i].sets[j].reps);expect(after[i].sets[j].weight).toBe(Math.round((before[i].sets[j].weight+2.5)*100)/100);}}
 expect(await page.evaluate(()=>JSON.stringify(data.meetCycles[0].sessions))).toBe(originalCycle);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('learned-history guardrail suppresses controller upward choice without removing live manual eligibility',async({page})=>{
 await page.evaluate(()=>{
  for(const row of data.meetCycles[0].sessions.filter(s=>s.week===1)){
   const record=data.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
   data.workouts.push({id:'history-easy-'+row.key,date:row.date,createdAt:row.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:e.exerciseId==='b'?Math.max(1,s.targetRpe-.5):s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
  }
  const real=LoadnoteAdaptiveOutcomeLearning.analyze,realResponse=LoadnoteCycleResponse.inspect;window.__realAdaptiveLearning=real;window.__realCycleResponse=realResponse;
  LoadnoteAdaptiveOutcomeLearning.analyze=()=>({summary:{patterns:[{lift:'bench',action:'increase-load',observed:4,recorded:4,counts:{improved:1,stable:0,declined:3},medianCapacityChangePct:-1.5,evidence:'early-pattern'}]}});
  LoadnoteCycleResponse.inspect=()=>({phases:[{phase:'accumulation',lifts:{squat:{observedChangePct:0},bench:{observedChangePct:2.4},deadlift:{observedChangePct:0}}}]});
  renderCycleWeekReview();
 });
 const host=page.locator('#cycle-week-review');await host.locator('.cycle-review-panel > summary').click();await host.locator('#cycle-review-analyze').click();
 const bench=host.locator('[data-cycle-review-choice="bench"]');
 await expect(bench.locator('option[value="increase-load"]')).toHaveCount(1);
 const benchLabel=bench.locator('xpath=..');
 await expect(benchLabel).toContainText('Keep original plan');
 await expect(benchLabel).toContainText('history');
 await expect(benchLabel).toContainText('Repeated exact follow-ups');
 await host.locator('#cycle-controller-use').click();
 await expect(bench).toHaveValue('keep');
 await bench.selectOption('increase-load');
 await host.locator('#cycle-review-confirm').check();
 await host.locator('#cycle-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.meetCycles[0].weeklyReviews?.[0]?.version)).toBe(5);
 expect(await page.evaluate(()=>data.meetCycles[0].weeklyReviews[0].controllerSnapshot.recommendation.choices.bench)).toBe('keep');
 expect(await page.evaluate(()=>data.meetCycles[0].weeklyReviews[0].choices.bench)).toBe('increase-load');
 await expect(page.locator('#cycle-journal')).toContainText('overrode displayed recommendation');
 await page.evaluate(()=>{LoadnoteAdaptiveOutcomeLearning.analyze=window.__realAdaptiveLearning;LoadnoteCycleResponse.inspect=window.__realCycleResponse;});
});


test('peaking review preserves structure and only offers a bounded downward competition-load action',async({page})=>{
 const peak=await page.evaluate(()=>{const cycle=data.meetCycles[0];return cycle.weekly.find(w=>w.phase==='peaking'&&cycle.weekly[w.week]?.phase==='peaking');});
 expect(peak).toBeTruthy();
 await page.clock.setFixedTime(new Date(peak.endDate+'T19:00:00.000Z'));
 await page.evaluate(week=>{
  const cycle=data.meetCycles[0];
  for(const row of cycle.sessions.filter(s=>s.week===week)){
   const record=data.scheduledSessions.find(x=>x.id==='meet:'+cycle.id+':'+row.key),plan=record.revisions[0].context.prescription;
   data.workouts.push({id:'browser-peak-'+row.key,date:row.date,createdAt:row.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:Math.min(10,s.targetRpe+1)}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
  }
  renderCycleWeekReview();
 },peak.week);
 const host=page.locator('#cycle-week-review');await host.locator('.cycle-review-panel > summary').click();
 await host.locator('#cycle-review-week').selectOption(String(peak.week));await host.locator('#cycle-review-analyze').click();
 await expect(host.locator('[data-cycle-phase-policy]')).toContainText('Peak: preserve specificity');
 await expect(host.locator('[data-cycle-phase-policy]')).toContainText('reduce one load increment');
 await expect(host.locator('[data-cycle-phase-policy]')).not.toContainText('increase one load increment');
 const squat=host.locator('[data-cycle-review-choice="squat"]');
 await expect(squat.locator('option')).toHaveCount(2);
 await expect(squat.locator('option[value="reduce-load"]')).toHaveCount(1);
 await expect(squat.locator('option[value="reduce-one"]')).toHaveCount(0);
 await expect(squat.locator('option[value="increase-load"]')).toHaveCount(0);
 const label=squat.locator('xpath=..');await expect(label).toContainText('peak work');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});


test('cycle journal is available for an upcoming scheduled cycle and remains compact on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.clock.setFixedTime(new Date('2026-09-25T12:00:00.000Z'));
 await page.evaluate(()=>{renderCycleJournal();});
 const journal=page.locator('#cycle-journal');
 await expect(journal).toContainText('Cycle journal');
 await journal.locator('.cycle-journal-panel > summary').click();
 await expect(journal).toContainText('Starting program reviewed');
 await expect(journal).toContainText('Meet cycle reviewed');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
