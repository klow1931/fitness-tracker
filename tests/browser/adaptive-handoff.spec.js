const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.71 post-workout handoff shows target-vs-actual RPE and accepted before/after prescription changes',async({page})=>{
 await page.clock.install({time:new Date('2026-10-01T20:00:00.000Z')});
 await page.evaluate(()=>{
  data.unit='kg';
  const captured='2026-10-01T12:00:00.000Z';
  const plan=LoadnoteIntent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
  ]}],{type:'program',label:'Bench day'},captured);
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench day',date:'2026-10-01',role:'heavy-exposure',goal:'Bench',prescription:plan},{id:'manual-done',now:captured});
  const workout={id:'done-workout',date:'2026-10-01',createdAt:'2026-10-01T18:00:00.000Z',exercises:[{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:100,reps:5,rpe:7.5},{weight:100,reps:5,rpe:8},{weight:100,reps:5,rpe:7.5}
  ]}],sessionIntent:{version:1,role:'heavy-exposure',goal:'Bench',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:'manual-done',revisionAt:captured}}};
  data.workouts=[workout];
  const beforePlan=LoadnoteIntent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:102.5,reps:5,targetRpe:8},{weight:102.5,reps:5,targetRpe:8},{weight:102.5,reps:5,targetRpe:8}
  ]}],{type:'program',label:'Next bench'},'2026-10-01T12:01:00.000Z');
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Next bench',date:'2026-10-03',role:'heavy-exposure',goal:'Bench',prescription:beforePlan},{id:'phase:p1:w2d1',now:'2026-10-01T12:01:00.000Z'});
  const record=data.scheduledSessions.find(x=>x.id==='phase:p1:w2d1'),before=structuredClone(record.revisions[0]);
  const afterPlan=LoadnoteIntent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:105,reps:5,targetRpe:8},{weight:105,reps:5,targetRpe:8},{weight:105,reps:5,targetRpe:8}
  ]}],{type:'program',label:'Next bench'},'2026-10-01T19:00:00.000Z');
  const after={recordedAt:'2026-10-01T19:00:00.000Z',context:{...before.context,reason:'Approved accumulation phase review',prescription:afterPlan}};
  record.revisions.push(after);data.scheduledSessions=LoadnoteSchedule.validate(data.scheduledSessions);
  data.phaseReviews=[{id:'phase-review',programId:'p1',phase:'accumulation',createdAt:'2026-10-01T19:00:00.000Z',choices:{squat:'keep',bench:'progress',deadlift:'keep'},exerciseLifts:{b:'bench'},findings:{
   squat:{name:'Squat'},bench:{name:'Competition Bench',reason:'All matched exposures stayed within the reviewed effort margin.',completedSessions:3,expectedSessions:3,comparedSets:9,overCapSessions:0,underCapSessions:3,averageRpe:7.5},deadlift:{name:'Deadlift'}
  },changes:[{id:'phase:p1:w2d1',before,after}]}];
  showTab('workouts');document.getElementById('workout-recap').hidden=false;LoadnoteTrainingContinuityUI.renderRecap(workout,data,{asOf:'2026-10-01'});
 });
 const card=page.locator('.adaptive-handoff');
 await expect(card).toContainText('Next workout updated');
 await expect(card).toContainText('target RPE 8 · actual RPE 7.7');
 await expect(card).toContainText('Before');
 await expect(card).toContainText('102.5 kg');
 await expect(card).toContainText('Now');
 await expect(card).toContainText('105 kg');
 await expect(card).toContainText('Why did this change?');
 await card.getByRole('button',{name:'View next workout'}).click();
 await expect(page.locator('#panel-calendar')).toBeVisible();
});

test('v2.71 completed program week surfaces the existing athlete-approved review workflow instead of silently adapting',async({page})=>{
 await page.clock.install({time:new Date('2026-10-04T20:00:00.000Z')});
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed.state});
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  data=LoadnotePhaseBuilder.save(data,LoadnotePhaseBuilder.prepare(data,seed.config,args),{confirmed:true,notes:'handoff source'},{...args,id:'handoff-source'});
  const source=data.phasePrograms[0],event=(()=>{const d=new Date(source.config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7*7+5);return d.toISOString().slice(0,10);})();
  const proposal=LoadnoteMeetCycle.prepare(data,source,{version:1,weeks:8,peakWeeks:2,taperWeeks:1,meetDate:event,eventType:'mock'},args);
  data=LoadnoteMeetCycle.save(data,proposal,{confirmed:true,notes:'handoff cycle'},{...args,id:'handoff-cycle'});
  data=LoadnoteMeetCycle.schedule(data,'handoff-cycle',{...args,now:'2026-09-24T13:00:00.000Z'});
  const cycle=data.meetCycles[0],week=cycle.weekly.find(w=>w.week===1);
  for(const session of cycle.sessions.filter(s=>s.week===1)){
   const id='meet:'+cycle.id+':'+session.key,record=data.scheduledSessions.find(x=>x.id===id),revision=record.revisions.at(-1),prescription=revision.context.prescription;
   data.workouts.push({id:'logged-'+session.key,date:session.date,createdAt:session.date+'T20:00:00.000Z',exercises:prescription.plannedExercises.map(e=>({...e,sets:(e.sets||[]).map(s=>({weight:s.weight,reps:s.reps,duration:s.duration,rpe:s.targetRpe}))})),sessionIntent:{version:1,role:revision.context.role,goal:revision.context.goal,prescription,deviationReason:'none',deviationNotes:'',schedule:{id,revisionAt:revision.recordedAt}}});
  }
  const last=data.workouts.filter(w=>String(w.id).startsWith('logged-')).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  showTab('workouts');document.getElementById('workout-recap').hidden=false;LoadnoteTrainingContinuityUI.renderRecap(last,data,{asOf:week.endDate});
 },phaseFixture());
 const card=page.locator('.adaptive-handoff');
 await expect(card).toContainText('Weekly review available');
 await expect(card).toContainText('No future prescription changes until you review and approve');
 await card.getByRole('button',{name:'Review week'}).click();
 await expect(page.locator('#cycle-week-review')).toBeVisible();
 await expect(page.locator('#cycle-week-review .cycle-review-panel')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
