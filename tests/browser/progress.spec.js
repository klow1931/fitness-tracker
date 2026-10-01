const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{constructor(ctx,config){window.lastChartConfig=config;}destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.addStyleTag({content:'.hidden{display:none!important}'});
 await page.evaluate(()=>{
  data.workouts=[{id:'one',date:'2026-01-01',exercises:[{name:'Bench',type:'strength',trackBy:'reps',sets:[{reps:5,weight:80}]}]},{id:'two',date:'2026-01-02',exercises:[{name:'Bench',type:'strength',trackBy:'reps',sets:[{reps:5,weight:100}]},{name:'Bench',type:'strength',trackBy:'duration',sets:[{duration:20,weight:10}]}]}];
  data.prs=LoadnoteSession.reconcilePRs([],data.workouts,estimated1RM,()=> 'pr');invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');
 });
});
test('History date filters and pages handle varied card heights',async({page})=>{
 await page.evaluate(()=>{data.workouts=Array.from({length:45},(_,i)=>({id:String(i),date:'2026-01-02',notes:'Long note '.repeat(i+1),exercises:[{name:'Bench',sets:[{reps:5,weight:i+1}]}]}));renderWorkoutHistory();});
 await expect(page.locator('[data-hist-id]')).toHaveCount(20);await page.locator('#workout-history summary').first().click();
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('#workout-history')).toContainText('Page 2 of 3');
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('[data-hist-id]')).toHaveCount(5);
 await page.locator('#history-from').fill('2026-02-01');await expect(page.locator('#workout-history')).toContainText('No matches');
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('#workout-history')).toContainText('Page 1 of 3');
});
test('Exercise details distinguish actual loads, estimates and hold tracking',async({page})=>{
 await page.locator('[data-hist-id="two"] summary').click();await page.locator('[data-hist-id="two"] [data-tracking="reps"]').click();
 await expect(page.locator('#detail-summary')).toContainText('100 kg');await page.locator('#detail-metric').selectOption('estimate');
 expect(await page.evaluate(()=>window.lastChartConfig.data.datasets[0].label)).toContain('Estimated 1RM');
 await page.locator('#detail-range').selectOption('4');await expect(page.locator('#detail-summary')).toContainText('No matching sessions');
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('[data-hist-id="two"] [data-tracking="duration"]').click();await expect(page.locator('#detail-metric-label')).not.toBeVisible();await expect(page.locator('#detail-sessions')).toContainText('20s');
});
test('Comparison keeps unmatched tracking modes separate',async({page})=>{
 await page.locator('[data-hist-id="two"] [data-workout-action="compare-session"]').click();
 await expect(page.locator('#comparison-results')).toContainText('Not in this workout');await expect(page.locator('#comparison-results')).toContainText('80kg');await expect(page.locator('#comparison-results')).toContainText('100kg');
 await page.locator('#compare-b').selectOption('two');await expect(page.locator('#comparison-results')).toContainText('two different');
});
test('Deleting a record source recalculates PRs; failed deletion preserves both',async({page})=>{
 page.once('dialog',d=>d.accept());await page.locator('[data-hist-id="two"] [data-workout-action="delete"]').click();
 await expect(page.locator('[data-hist-id]')).toHaveCount(1);expect(await page.evaluate(()=>data.prs[0].weight)).toBe(80);
 await page.evaluate(()=>{persistNow=async()=>{throw Error('quota');};});page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="delete"]').click();
 await expect(page.locator('#toast-host')).toContainText('Could not delete');expect(await page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.prs[0].weight)).toBe(80);
});
test('Chart range and metric controls use filtered actual data',async({page})=>{
 await page.evaluate(()=>{showTab('dashboard');document.getElementById('progress-exercise').value='Bench';renderProgressChart();});
 await page.locator('#home-details > summary').click();
 await page.locator('#progress-metric').selectOption('load');await expect(page.locator('#progress-description')).toContainText('Heaviest actual set');
 await page.locator('#progress-range').selectOption('4');await expect(page.locator('#progress-description')).toContainText('No rep-based strength data');
});
test('New lifter dashboard avoids premature fatigue and plateau signals and agrees with chart estimates',async({page})=>{
 await page.evaluate(()=>{
  data.workouts=[{id:'baseline',date:today(),exercises:[{name:'Bench',type:'strength',sets:[{weight:80,reps:5,rpe:8}]}]}];
  invalidateViews();showTab('dashboard');
  document.getElementById('progress-exercise').value='Bench';renderProgressChart();
 });
 await expect(page.locator('#training-status-value')).toHaveText('Not enough data');
 await expect(page.locator('#fatigue-score-value')).toHaveText('Not enough data');
 await expect(page.locator('#training-intelligence-lifts')).not.toContainText('possible plateau');
 await expect(page.locator('#training-intelligence-lifts')).toContainText('98.7');
 await expect(page.locator('#next-workout-recommendation')).not.toContainText('Reduce');
 expect(await page.evaluate(()=>window.lastChartConfig.data.datasets[0].data)).toEqual([98.7]);
 await page.evaluate(()=>{
  const original=data.workouts[0];data.workouts=[0,2,4].map((ago,i)=>{
   const d=new Date();d.setDate(d.getDate()-ago);return {...original,id:String(i),date:d.toISOString().slice(0,10)};
  });invalidateViews();renderTrainingIntelligence();
 });
 await expect(page.locator('#training-intelligence-lifts')).toContainText('possible plateau');
});

test('Progress record book searches compact rows and hides destructive action',async({page})=>{
 await page.evaluate(()=>{
  data.prs=[
   {id:'bench-one',exercise:'Competition Bench Press',weight:120,reps:1,date:'2026-01-02',estimated1RM:120},
   {id:'squat-three',exercise:'Competition Back Squat',weight:150,reps:3,date:'2026-01-01',estimated1RM:165}
  ];showTab('prs');renderPRs();
 });
 await expect(page.locator('#progress-workouts-count')).toContainText('sessions');
 await expect(page.locator('#progress-pr-count')).toHaveText('2 records');
 await expect(page.locator('#pr-entry')).not.toHaveAttribute('open','');
 await expect(page.locator('#pr-list .pr-record')).toHaveCount(2);
 await expect(page.locator('#pr-list')).toContainText('Actual single');
 await expect(page.locator('#pr-list')).toContainText('Multi-rep record');
 await expect(page.locator('#pr-list')).toContainText('Est. 1RM');
 await expect(page.locator('#pr-list .btn-danger').first()).not.toBeVisible();
 await page.locator('#pr-search').fill('BENCH');
 await expect(page.locator('#pr-list .pr-record')).toHaveCount(1);
 await expect(page.locator('#pr-search-count')).toHaveText('1 of 2 records');
 await expect(page.locator('#pr-list')).toContainText('Competition Bench Press');
 await page.locator('#pr-list .pr-record-actions summary').click();
 await expect(page.locator('#pr-list .btn-danger')).toBeVisible();
 await page.locator('#pr-search').fill('not here');
 await expect(page.locator('#pr-list')).toContainText('No records match');
 await page.locator('#pr-search').fill('');
 await expect(page.locator('#pr-list .pr-record')).toHaveCount(2);
 await page.locator('#pr-entry > summary').click();
 await expect(page.locator('#pr-exercise')).toBeVisible();
 expect(await page.evaluate(()=>data.prs.map(p=>p.id))).toEqual(['bench-one','squat-three']);
});

test('Progress tells a compact strength story without turning sparse data into a score',async({page})=>{
 await page.evaluate(()=>{
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const asOf=today(),dates=[move(asOf,-77),move(asOf,-63),move(asOf,-21),move(asOf,-7)];
  data.exerciseCatalog=[{id:'s',name:'Competition Squat',aliases:[]}];
  data.exerciseRoles=LoadnoteReadiness.replace([],[{exerciseId:'s',role:'competition',competitionLift:'squat'}],{now:dates[0]+'T00:00:00.000Z',createId:()=> 'progress-role'});
  data.workouts=dates.map((date,i)=>({id:'progress-'+i,date,createdAt:date+'T20:00:00.000Z',exercises:[{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight:100+i*5,reps:5,rpe:8}]},...(i>=2?[{name:'Chest-Supported Row',exerciseId:'row',type:'strength',trackBy:'reps',sets:[{weight:60+(i-2)*2.5,reps:8,rpe:8}]}]:[])]}));
  data.scheduledSessions=[];data.phasePrograms=[];data.meetCycles=[];data.phaseReviews=[];data.prs=[];invalidateViews();showTab('prs');
 });
 const host=page.locator('#progress-analytics');
 await expect(host).toContainText('What your training is doing.');
 await expect(host).toContainText('Strength direction');
 await expect(host).toContainText('Recent evidence is higher');
 await expect(host).toContainText('Plan adherence');
 await page.evaluate(()=>setUnit('lb'));
 await expect(host).toContainText('lb');
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(100);
 await host.getByRole('tab',{name:'Strength'}).click();
 await expect(host).toContainText('Confirmed competition lift');
 await expect(host).toContainText('Best recent set');
 await expect(host).toContainText('Recent demonstrated capacity');
 await host.locator('[data-progress-exercise]').selectOption('id:row');
 await expect(host).toContainText('Chest-Supported Row');
 await expect(host).toContainText('2 sessions');
 await host.getByRole('button',{name:'Exercise details'}).click();
 await expect(page.locator('#exercise-detail')).toBeVisible();
 await expect(page.locator('#exercise-detail-title')).toContainText('Chest-Supported Row');
});

test('Progress separates adherence from unresolved sessions and shows accepted program decisions',async({page})=>{
 await page.evaluate(()=>{
  const asOf=today(),move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const plan=LoadnoteIntent.createPrescription([{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}],{type:'program',label:'Squat'},move(asOf,-40)+'T08:00:00.000Z');
  data.exerciseCatalog=[{id:'s',name:'Competition Squat',aliases:[]}];
  data.exerciseRoles=LoadnoteReadiness.replace([],[{exerciseId:'s',role:'competition',competitionLift:'squat'}],{now:move(asOf,-80)+'T00:00:00.000Z',createId:()=> 'progress-role'});
  data.workouts=[{id:'done',date:move(asOf,-7),createdAt:move(asOf,-7)+'T20:00:00.000Z',exercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:110,reps:5,rpe:8}]}],sessionIntent:{version:1,role:'volume',goal:'Squat',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:'manual-complete',revisionAt:move(asOf,-40)+'T08:00:00.000Z'}}}];
  data.scheduledSessions=[];
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Completed squat',date:move(asOf,-7),role:'volume',goal:'Squat',prescription:plan},{id:'manual-complete',now:move(asOf,-40)+'T08:00:00.000Z'});
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Skipped squat',date:move(asOf,-6),role:'volume',goal:'Squat',prescription:plan},{id:'manual-skip',now:move(asOf,-40)+'T08:01:00.000Z'});
  data.scheduledSessions=LoadnoteSchedule.change(data.scheduledSessions,'manual-skip',{status:'skipped',reason:'Travel'},move(asOf,-6)+'T07:00:00.000Z');
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Unresolved squat',date:move(asOf,-5),role:'volume',goal:'Squat',prescription:plan},{id:'manual-open',now:move(asOf,-40)+'T08:02:00.000Z'});
  const before={recordedAt:move(asOf,-15)+'T10:00:00.000Z',context:{prescription:plan}};
  const afterPlan=LoadnoteIntent.createPrescription([{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:102.5,reps:5,targetRpe:8}]}],{type:'program',label:'Squat'},move(asOf,-14)+'T10:00:00.000Z');
  const after={recordedAt:move(asOf,-14)+'T10:00:00.000Z',context:{prescription:afterPlan}};
  data.phaseReviews=[{id:'progress-review',programId:'old-program',phase:'accumulation',createdAt:move(asOf,-14)+'T10:00:00.000Z',choices:{squat:'progress',bench:'keep',deadlift:'keep'},exerciseLifts:{s:'squat'},findings:{squat:{name:'Competition Squat',reason:'Matched exposures stayed within the reviewed effort margin.',completedSessions:3,expectedSessions:3,comparedSets:9,overCapSessions:0,underCapSessions:3,averageRpe:7.5},bench:{name:'Bench'},deadlift:{name:'Deadlift'}},changes:[{id:'phase:old-program:w2d1',before,after}]}];
  data.phasePrograms=[];data.meetCycles=[];invalidateViews();showTab('prs');
 });
 const host=page.locator('#progress-analytics');
 await host.getByRole('tab',{name:'Adherence'}).click();
 const recent=host.locator('[data-progress-adherence="recent"]');
 await expect(recent.locator('[data-progress-count="completed"] b')).toHaveText('1');
 await expect(recent.locator('[data-progress-count="skipped"] b')).toHaveText('1');
 await expect(recent.locator('[data-progress-count="unconfirmed"] b')).toHaveText('1');
 await expect(recent).toContainText('50%');
 await expect(recent).toContainText('not counted as failures');
 await host.getByRole('tab',{name:'Program history'}).click();
 await expect(host).toContainText('accumulation phase review');
 await expect(host).toContainText('1 changed');
 await expect(host).toContainText('Competition Squat');
 await expect(host).toContainText('Load progressed');
});
