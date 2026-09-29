const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();},phaseFixture().state);await page.locator('#phase-builder-panel > summary').click();});
async function preview(page,expected='7 weeks · 21 sessions'){await page.locator('#phase-new').click();for(const [i,l]of ['squat','bench','deadlift'].entries()){await page.locator('.phase-lift > summary').nth(i).click();await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));}await page.locator('#phase-dialog button[type="submit"]').click();await expect(page.locator('#phase-preview')).toContainText(expected);}
test('reviewed phase plan survives offline and schedules without rewriting history or draft',async({page,context})=>{
 await page.evaluate(()=>{document.querySelector('.ex-name').value='Preserve my draft';saveLoggerDraft();});const draft=await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY)),history=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.reviewedPrograms}));
 await preview(page);await page.locator('#phase-save').click();await expect(page.locator('#phase-error')).toContainText('Review every phase');await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();await expect(page.locator('#phase-dialog')).not.toBeVisible();expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(1);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY))).toBe(draft);
 expect(await page.evaluate(()=>JSON.stringify(normalizeDataShape(JSON.parse(JSON.stringify(data))).phasePrograms)===JSON.stringify(data.phasePrograms))).toBe(true);
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();document.getElementById('phase-builder-panel').open=true;});
 await page.locator('#phase-builder > details > summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-phase-schedule]').click();await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(21);expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.reviewedPrograms}))).toBe(history);const restored=JSON.parse(await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY))),original=JSON.parse(draft);expect(restored.updatedAt).toBeGreaterThanOrEqual(original.updatedAt);delete restored.updatedAt;delete original.updatedAt;expect(restored).toEqual(original);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('changed inputs invalidate previews, time limits block plans and failed writes preserve data',async({page})=>{
 await preview(page);await page.locator('#phase-minutes').fill('30');await expect(page.locator('#phase-preview')).toBeEmpty();await page.locator('#phase-dialog button[type="submit"]').click();await expect(page.locator('#phase-error')).toContainText('needs about');await page.locator('#phase-minutes').fill('90');await page.locator('#phase-dialog button[type="submit"]').click();await page.locator('#phase-confirm').check();await page.evaluate(()=>{persistNow=async()=>{throw Error('Storage full');};});await page.locator('#phase-save').click();await expect(page.locator('#phase-error')).toContainText('Storage full');expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(0);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);expect(await page.evaluate(()=>document.getElementById('phase-dialog').scrollWidth<=document.getElementById('phase-dialog').clientWidth+1)).toBe(true);
});

test('meet preparation timeline previews from a reviewed phase without scheduling or editing workouts',async({page})=>{
 const baseline=await page.evaluate(config=>{const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Reviewed for timeline'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'meet-preview'});renderPhaseBuilder();return JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions,programs:data.phasePrograms});},phaseFixture().config);
 await page.locator('#phase-builder > details > summary').click();
 await page.locator('[data-meet-panel] > summary').click();
 await page.locator('[data-meet-date]').fill('2026-12-19');
 await page.locator('[data-meet-preview]').click();
 await expect(page.locator('[data-meet-result]')).toContainText('2026-11-23');
 await expect(page.locator('[data-meet-result]')).toContainText('taper');
 await page.locator('[data-peak-sessions] > summary').click();
 await expect(page.locator('[data-peak-session="squat"]')).toHaveCount(3);
 await expect(page.locator('[data-peak-lift="bench"]')).toContainText('competition-lift');
 await expect(page.locator('[data-peak-sessions]')).toContainText('RPE cap');
 await expect(page.locator('[data-peak-sessions]')).toContainText('Read-only');
 await page.locator('[data-meet-date]').fill('2026-11-28');
 await page.locator('[data-meet-preview]').click();
 await expect(page.locator('[data-meet-result]')).toContainText('overlaps');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions,programs:data.phasePrograms}))).toBe(baseline);
});

test('lift-specific workload preview separates competition and variations without changing history',async({page})=>{
 const {config}=phaseFixture();
 const original=await page.evaluate(config=>{
  const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
  data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Reviewed'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'workload-preview'});
  renderPhaseBuilder();
  return JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions});
 },config);
 await page.locator('#phase-builder > details > summary').click();
 await page.locator('[data-workload-panel] > summary').click();
 await page.locator('[data-workload-compare]').click();
 await expect(page.locator('[data-workload-result]')).toContainText('Competition');
 await expect(page.locator('[data-workload-result]')).toContainText('Valid RPE coverage');
 await expect(page.locator('[data-workload-result]')).toContainText('logged');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}))).toBe(original);
});

test('athlete independently reviews and regenerates squat sets without editing stored training',async({page})=>{
 const baseline=await page.evaluate(()=>{
  const squat=LoadnoteReadiness.list(data.exerciseRoles).find(r=>r.role==='competition'&&r.competitionLift==='squat').exerciseId;
  data.workouts=['2026-09-02','2026-09-09','2026-09-16','2026-09-23'].map((date,i)=>({id:'training-'+i,date,createdAt:date+'T12:00:00.000Z',exercises:[{exerciseId:squat,name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:7},{weight:100,reps:5,rpe:8},{weight:100,reps:5,rpe:8}]}]}));
  data.workoutRevisions=[];
  return JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions});
 });
 await preview(page);
 await page.locator('#phase-workload-review > summary').click();
 await expect(page.locator('[data-workload-choice="squat"] option')).toHaveCount(2);
 await expect(page.locator('[data-workload-choice="bench"] option')).toHaveCount(1);
 await page.locator('[data-workload-choice="squat"]').selectOption('reduce-one');
 await page.locator('#phase-workload-apply').click();
 await expect(page.locator('#phase-squat-sets')).toHaveValue('2');
 await expect(page.locator('#phase-bench-sets')).toHaveValue('3');
 await expect(page.locator('#phase-deadlift-sets')).toHaveValue('3');
 await expect(page.locator('#phase-notes')).toContainText('athlete chose 3 to 2 sets');
 await expect(page.locator('#phase-preview')).toContainText('7 weeks · 21 sessions');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}))).toBe(baseline);
});

test('competition-lift performance context stays separate from variation logs and saved data',async({page})=>{
 const {config}=phaseFixture(),baseline=await page.evaluate(config=>{
   const ids=Object.fromEntries(['squat','bench','deadlift'].map(l=>[l,config.lifts[l].exerciseId]));
   data.workouts=['2026-09-02','2026-09-09','2026-09-16','2026-09-23'].map((date,i)=>({
      id:'capacity-'+i,date,createdAt:date+'T12:00:00.000Z',
      exercises:[{exerciseId:ids.squat,type:'strength',trackBy:'reps',sets:[{weight:[120,118,110,109][i],reps:5,rpe:8}]},
       {exerciseId:'ss',type:'strength',trackBy:'reps',sets:[{weight:500,reps:5,rpe:10}]}]
    }));
   data.workoutRevisions=[];
   const p=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
   data=LoadnotePhaseBuilder.save(data,p,{confirmed:true,notes:'Reviewed performance context'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'capacity-preview'});
   renderPhaseBuilder();
   return JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,calendar:data.scheduledSessions});
 },config);
 await page.locator('#phase-builder > details > summary').click();
 await page.locator('[data-workload-panel] > summary').click();
 await page.locator('[data-workload-compare]').click();
 await expect(page.locator('[data-workload-result]')).toContainText('Competition-lift estimated-capacity context');
 await expect(page.locator('[data-workload-result]')).toContainText('lower-estimate');
 await expect(page.locator('[data-workload-result]')).toContainText('Variations are excluded');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,calendar:data.scheduledSessions}))).toBe(baseline);
});

test('phase preview explains date-free strength goals without turning targets into training maxes',async({page})=>{
 await page.evaluate(()=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-23T09:00:00.000Z'});
 });
 await preview(page,'8 weeks · 24 sessions');
 const previewHost=page.locator('#phase-preview');
 await expect(previewHost).toContainText('Goal programming context');
 await expect(previewHost).toContainText('no target date required');
 await expect(previewHost).toContainText('Goal targets do not replace training maxes');
 await expect(previewHost).toContainText('target');
 await page.locator('#phase-confirm').check();
 await page.locator('#phase-save').click();
 await expect.poll(()=>page.evaluate(()=>data.phasePrograms[0]?.goalSnapshot?.status)).toBe('ready');
 expect(await page.evaluate(()=>data.phasePrograms[0].goalSnapshot.lifts.squat.targetKg)).toBe(220);
 expect(await page.evaluate(()=>data.phasePrograms[0].goalSnapshot.lifts.squat.selectedProgramTrainingMaxKg)).not.toBe(220);
});

test('date-free goal cycle prefills phase shape and withholds horizon until enough completed blocks exist',async({page})=>{
 await page.evaluate(()=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-23T09:00:00.000Z'});
 });
 await page.locator('#phase-new').click();
 await expect(page.locator('#phase-dialog')).toContainText('Goal-cycle guidance');
 await expect(page.locator('#phase-dialog')).toContainText('No target date required');
 await expect(page.locator('#phase-dialog')).toContainText('Need more completed blocks');
 await expect(page.locator('#phase-accumulation')).toHaveValue('4');
 await expect(page.locator('#phase-strength')).toHaveValue('3');
 await expect(page.locator('#phase-dialog')).toContainText('Training maxes, exercises, frequency, sets and weekly adaptations still require normal review');
});

test('completed phase program freezes a reviewed transition baseline without rewriting training',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-13T22:00:00Z'));
 const {config}=phaseFixture();
 const baseline=await page.evaluate(config=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-23T09:00:00.000Z'});
  const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
  data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Transition test'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'transition-browser'});
  data=LoadnotePhaseBuilder.schedule(data,'transition-browser',{asOf:'2026-09-24',now:'2026-09-24T13:00:00.000Z'});
  const program=data.phasePrograms.find(p=>p.id==='transition-browser');
  for(const session of program.sessions){
   const id='phase:'+program.id+':'+session.key,record=data.scheduledSessions.find(x=>x.id===id),rev=record.revisions[0],plan=rev.context.prescription;
   data.workouts.push({id:'transition-'+session.key,date:session.date,createdAt:session.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id,revisionAt:rev.recordedAt},timing:'planned-before-training'}});
  }
  renderPhaseBuilder();
  return JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,sessions:data.scheduledSessions});
 },config);
 const programCard=page.locator('#phase-builder > details').filter({hasText:'Phased strength'}).first();
 await programCard.locator(':scope > summary').click();
 const transition=programCard.locator('[data-transition-card]');
 await expect(transition.locator(':scope > summary')).toContainText('ready to review');
 await transition.locator(':scope > summary').click();
 await transition.locator('[data-transition-review]').click();
 await expect(transition.locator('[data-transition-result]')).toContainText('Frozen transition baseline');
 await expect(transition.locator('[data-transition-result]')).toContainText('21/21 scheduled sessions completed');
 await expect(transition.locator('[data-transition-result]')).toContainText('last 28d');
 await transition.locator('[data-transition-note]').fill('Reviewed handoff');
 await transition.locator('[data-transition-confirm]').check();
 await transition.locator('[data-transition-save]').click();
 await expect.poll(()=>page.evaluate(()=>data.transitionSnapshots.length)).toBe(1);
 await expect(page.locator('[data-transition-card]')).toContainText('saved 2026-11-13');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.phasePrograms,sessions:data.scheduledSessions}))).toBe(baseline);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('latest frozen transition drives conservative next-block objectives and reviewed snapshot',async({page})=>{
 await page.evaluate(()=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-01T09:00:00.000Z'});
  const goal=LoadnoteGoals.list(data.athleteGoals)[0],roles=LoadnoteReadiness.list(data.exerciseRoles),ids=Object.fromEntries(['squat','bench','deadlift'].map(l=>[l,roles.find(r=>r.role==='competition'&&r.competitionLift===l).exerciseId]));
  data.transitionSnapshots=[{
   version:1,id:'transition-prior',programId:'prior-block',programName:'Prior block',programCreatedAt:'2026-07-01T10:00:00.000Z',programStart:'2026-07-06',programEnd:'2026-08-28',asOf:'2026-08-28',knowledgeCutoff:'2026-08-28T23:00:00.000Z',createdAt:'2026-08-28T23:01:00.000Z',
   goalAtStart:{status:'ready',goal:{id:goal.id,name:goal.name,eventDate:null},lifts:{}},goalAtTransition:{status:'ready'},
   schedule:{expected:24,completed:24,skipped:0,cancelled:0,unconfirmed:0,upcoming:0,adherence:100},
   lifts:{
    squat:{lift:'squat',exerciseId:ids.squat,changePct:3,recent28d:{averageRpe:8}},
    bench:{lift:'bench',exerciseId:ids.bench,changePct:.3,recent28d:{averageRpe:8.2}},
    deadlift:{lift:'deadlift',exerciseId:ids.deadlift,changePct:-2.5,recent28d:{averageRpe:8.7}}
   },
   decisionHistory:{phaseReviews:[{id:'r1',phase:'strength',createdAt:'2026-08-20T18:00:00.000Z',choices:{squat:'keep',bench:'keep',deadlift:'reduce-one'},policy:'phase-review-v1'}],count:1},
   review:{confirmed:true,recordedAt:'2026-08-28T23:01:00.000Z',notes:'done'}
  }];
 });
 await page.locator('#phase-new').click();
 const dialog=page.locator('#phase-dialog');
 await expect(dialog).toContainText('Next-block objectives');
 await expect(dialog).toContainText('Continue productive progression');
 await expect(dialog).toContainText('Consolidate and reassess');
 await expect(dialog).toContainText('Rebuild tolerable loading');
 await expect(page.locator('#phase-accumulation')).toHaveValue('4');
 await expect(page.locator('#phase-strength')).toHaveValue('2');
 for(const [i,l]of ['squat','bench','deadlift'].entries()){await page.locator('.phase-lift > summary').nth(i).click();await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));}
 await page.locator('#phase-dialog button[type="submit"]').click();
 await expect(page.locator('#phase-preview')).toContainText('7 weeks · 21 sessions');
 await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();
 await expect.poll(()=>page.evaluate(()=>data.phasePrograms[0]?.objectiveSnapshot?.transition?.id)).toBe('transition-prior');
 expect(await page.evaluate(()=>data.phasePrograms[0].objectiveSnapshot.lifts.deadlift.nextObjective.code)).toBe('rebuild-tolerance');
 expect(await page.evaluate(()=>data.phasePrograms[0].config.phases.map(p=>p.weeks))).toEqual([4,2,1]);
});

test('next-program handoff opens reviewed phase builder with frozen evidence prefilled',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-14T14:00:00Z'));
 const {config}=phaseFixture();
 await page.evaluate(config=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
   {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
  ]},{now:'2026-09-23T09:00:00.000Z'});
  const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
  data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Handoff source'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'handoff-browser'});
  data=LoadnotePhaseBuilder.schedule(data,'handoff-browser',{asOf:'2026-09-24',now:'2026-09-24T13:00:00.000Z'});
  const program=data.phasePrograms.find(p=>p.id==='handoff-browser');
  for(const session of program.sessions){
   const id='phase:'+program.id+':'+session.key,record=data.scheduledSessions.find(x=>x.id===id),rev=record.revisions[0],plan=rev.context.prescription;
   data.workouts.push({id:'handoff-'+session.key,date:session.date,createdAt:session.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id,revisionAt:rev.recordedAt},timing:'planned-before-training'}});
  }
  const report=LoadnoteTransitionBaseline.preview(data,{programId:'handoff-browser',asOf:'2026-11-13',now:'2026-11-13T21:00:00.000Z'});
  data=LoadnoteTransitionBaseline.save(data,report,{confirmed:true,notes:'Frozen handoff'},{now:'2026-11-13T21:01:00.000Z',id:'handoff-baseline'});
  renderPhaseBuilder();
 },config);
 const handoff=page.locator('#next-block-handoff');
 await expect(handoff).toContainText('Next program handoff');
 await expect(handoff).toContainText('ready for athlete review');
 await expect(handoff).toContainText('2026-11-16');
 await expect(handoff).toContainText('What Loadnote carries forward');
 await handoff.locator('[data-next-block-start]').click();
 const dialog=page.locator('#phase-dialog');
 await expect(dialog).toContainText('Started from next-program handoff');
 await expect(page.locator('#phase-start')).toHaveValue('2026-11-16');
 const handoffReport=await page.evaluate(()=>LoadnoteNextBlockHandoff.inspect(data,{asOf:'2026-11-14'}));
 await expect(page.locator('#phase-accumulation')).toHaveValue(String(handoffReport.prefill.accumulationWeeks));
 await expect(page.locator('#phase-strength')).toHaveValue(String(handoffReport.prefill.strengthWeeks));
 await expect(page.locator('#phase-squat-tm')).toHaveValue(String(Math.round(handoffReport.prefill.trainingMaxKg.squat*100)/100));
 await expect(dialog).toContainText('Prior training maxes');
 expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(1);
});

test('next-program handoff blocks when an unfinished workout draft exists',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-14T14:00:00Z'));
 const {config}=phaseFixture();
 await page.evaluate(config=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[{lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}]},{now:'2026-09-23T09:00:00.000Z'});
  const p=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
  data=LoadnotePhaseBuilder.save(data,p,{confirmed:true},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'draft-source'});
  data=LoadnotePhaseBuilder.schedule(data,'draft-source',{asOf:'2026-09-24',now:'2026-09-24T13:00:00.000Z'});
  const program=data.phasePrograms[0];
  for(const s of program.sessions){const id='phase:'+program.id+':'+s.key,r=data.scheduledSessions.find(x=>x.id===id),v=r.revisions[0],plan=v.context.prescription;data.workouts.push({id:'done-'+s.key,date:s.date,createdAt:s.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(x=>({weight:x.weight,reps:x.reps,rpe:x.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id,revisionAt:v.recordedAt},timing:'planned-before-training'}});}
  const report=LoadnoteTransitionBaseline.preview(data,{programId:'draft-source',asOf:'2026-11-13',now:'2026-11-13T21:00:00.000Z'});data=LoadnoteTransitionBaseline.save(data,report,{confirmed:true},{now:'2026-11-13T21:01:00.000Z',id:'draft-baseline'});
  localStorage.setItem('loadnote-workout-draft-v1',JSON.stringify({version:3,date:'2026-11-14',notes:'unfinished',unit:'kg',rows:[]}));
  renderPhaseBuilder();
 },config);
 const handoff=page.locator('#next-block-handoff');
 await expect(handoff).toContainText('unfinished workout draft');
 await expect(handoff.locator('[data-next-block-start]')).toHaveCount(0);
});

test('evidence-backed starting suggestion is explicit, editable and frozen on save',async({page})=>{
 await page.evaluate(()=>{
  const rows=[];const add=(id,date,exerciseId,name,sets)=>rows.push({id,date,createdAt:date+'T20:00:00.000Z',exercises:[{exerciseId,name,type:'strength',trackBy:'reps',sets}]});
  for(const [i,date] of ['2026-09-05','2026-09-12','2026-09-19'].entries())add('sq'+i,date,'s','Competition Squat',[{weight:140+i*5,reps:1,rpe:7},{weight:120+i*2,reps:5,rpe:7},{weight:117.5+i*2,reps:5,rpe:7.5},{weight:115+i*2,reps:5,rpe:8},{weight:112.5+i*2,reps:5,rpe:8}]);
  for(const [i,date] of ['2026-09-08','2026-09-10','2026-09-15','2026-09-17','2026-09-22','2026-09-24'].entries())add('be'+i,date,'b','Competition Bench',[{weight:90+i,reps:5,rpe:6},{weight:87.5+i,reps:5,rpe:6.5},{weight:85+i,reps:5,rpe:6.5}]);
  for(const [i,date] of ['2026-09-05','2026-09-10','2026-09-12','2026-09-17','2026-09-19','2026-09-24'].entries())add('dl'+i,date,'d','Competition Sumo Deadlift',[{weight:170+i,reps:4,rpe:8.5},{weight:165+i,reps:4,rpe:9}]);
  data.workouts=rows;data.workoutRevisions=[];renderPhaseBuilder();
 });
 await page.locator('#phase-new').click();
 const card=page.locator('[data-starting-prescription]').first();
 await expect(card).toContainText('Evidence-backed starting structure');
 await expect(card).toContainText('Low RPE alone');
 await expect(page.locator('#phase-starting-apply')).toBeVisible();
 await page.locator('#phase-starting-apply').click();
 await expect(page.locator('#phase-squat-sets')).toHaveValue('4');
 await expect(page.locator('#phase-bench-sets')).toHaveValue('3');
 await expect(page.locator('#phase-deadlift-sets')).toHaveValue('2');
 await expect(page.locator('#phase-bench-step')).toHaveValue('1');
 await expect(page.locator('#phase-deadlift-step')).toHaveValue('0.5');
 const checked=await page.locator('[data-phase-day]:checked').evaluateAll(rows=>rows.map(x=>Number(x.value)));
 expect(checked).toEqual([1,3,5]);
 for(const [i,l]of ['squat','bench','deadlift'].entries()){await page.locator('.phase-lift > summary').nth(i).click();await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));}
 await page.locator('#phase-dialog button[type="submit"]').click();
 await expect(page.locator('#phase-preview [data-starting-prescription]')).toContainText('Starting prescription audit');
 await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();
 await expect.poll(()=>page.evaluate(()=>data.phasePrograms[0]?.startingPrescriptionSnapshot?.status)).toBe('reviewed-comparison');
 expect(await page.evaluate(()=>data.phasePrograms[0].startingPrescriptionSnapshot.lifts.deadlift.recommendation.stepPct)).toBe(.5);
});
