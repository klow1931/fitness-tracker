const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
async function addToday(page,id='today-session'){
 await page.evaluate(id=>{
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:7},{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Bench day'});
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions||[],{name:'Bench day',date:today(),role:'heavy-exposure',goal:'Build bench strength',prescription:plan},{id});
  saveData(data);renderDashboard();
 },id);
}
async function openOptions(page){const button=page.locator('#training-cockpit [data-cockpit-options]');await expect(button).toBeVisible();if((await button.textContent())==='Workout options')await button.click();}
test('v2.84 Home resumes another-date scheduled draft without competing start actions',async({page})=>{
 await addToday(page,'new-today');
 await page.evaluate(()=>{
  fillWorkoutForm([{name:'Yesterday squat',type:'strength',sets:[{weight:100,reps:5,rpe:7}]}],'',false);
  const plan=LoadnoteIntent.createPrescription([{name:'Yesterday squat',type:'strength',sets:[{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Yesterday squat'});
  restoreSessionIntentDraft({prescription:plan,schedule:{id:'yesterday-squat',revisionAt:new Date().toISOString()}});
  saveLoggerDraft();
 });
 // Template loading deliberately clears actual RPE. Enter performed effort
 // through the logger, as an athlete would, before asserting recovery.
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .set-rpe').first().fill('7');
 expect(await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id)).toBe('yesterday-squat');
 expect(await page.evaluate(()=>readLoggerDraft()?.rows?.[0]?.sets?.[0]?.rpe)).toBe('7');
 await page.reload();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#today-training')).toContainText('Workout in progress');
 await expect(page.locator('#home-empty')).toBeHidden();
 await expect(page.locator('#athlete-home-command')).not.toContainText('Ready to train?');
 await expect(page.locator('#athlete-home-command .btn-primary')).toHaveCount(0);
 await expect(page.locator('#today-training [data-today-train]')).toHaveCount(0);
 await page.locator('#today-training [data-today-resume]').click();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Yesterday squat');
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('100');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('7');
});
test('Home makes today scheduled training a one-tap start and resumes the draft after reload',async({page})=>{
 await addToday(page);
 await expect(page.locator('#today-training')).toContainText('Bench day');
 await expect(page.locator('#today-training')).toContainText('2 planned sets');
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 await expect(page.locator('.ex-name')).toHaveValue('Competition Bench Press');
 await expect(page.locator('.set-weight').first()).toHaveValue('100');
 await expect(page.locator('.set-rpe').first()).toHaveValue('');
 const cockpit=page.locator('#training-cockpit');await expect(cockpit).toBeVisible();await expect(cockpit).toContainText('Bench day');await expect(cockpit).toContainText('Exercise 1 of 1');await expect(cockpit).toContainText('Today');await expect(cockpit).toContainText('@7');
 expect(await page.evaluate(()=>document.getElementById('wo-date').value===today())).toBe(true);
 await page.locator('.set-rpe').first().fill('7.5');
 await page.reload();await expect(page.locator('.ex-name')).toHaveValue('Competition Bench Press');
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#today-training')).toContainText('Workout in progress');
 await page.getByRole('button',{name:'Resume workout',exact:true}).click();
 await expect(page.locator('.set-rpe').first()).toHaveValue('7.5');
 await expect(page.locator('#training-cockpit')).toBeVisible();
});
test('scheduled session must be rescheduled to today before it can start',async({page})=>{
 await page.evaluate(()=>{
  const d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);const tomorrow=d.toISOString().slice(0,10);
  const plan=LoadnoteIntent.createPrescription([{name:'Squat',type:'strength',sets:[{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Squat'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Tomorrow squat',date:tomorrow,role:'heavy-exposure',goal:'Squat',prescription:plan},{id:'future'});
 });
 await page.evaluate(()=>startScheduledWorkout('future'));
 await expect(page.locator('#toast-host')).toContainText('Reschedule this session to today');
 expect(await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id||null)).toBeNull();
});
test('Home reports scheduled training as logged after the linked workout is saved',async({page})=>{
 await addToday(page,'complete-me');await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await page.locator('.set-rpe').first().fill('7');await page.locator('.set-rpe').nth(1).fill('7');
 await page.locator('#training-cockpit [data-cockpit-review]').click();
 await page.getByRole('button',{name:'Save workout',exact:true}).click();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#today-training')).toContainText('Training logged');
 await expect(page.getByRole('button',{name:'View workout history',exact:true})).toBeVisible();
});

test('Home explains an athlete-approved scheduled adaptation from exact review evidence',async({page})=>{
 await page.evaluate(()=>{
  const id='meet:c1:w2d1',day=today(),prior=new Date(day+'T12:00:00Z');prior.setUTCDate(prior.getUTCDate()-1);
  const beforeAt=prior.toISOString().slice(0,10)+'T08:00:00.000Z',afterAt=day+'T08:00:00.000Z';
  const beforePlan=LoadnoteIntent.createPrescription([{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[
   {weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8}
  ]}],{type:'program',label:'Week 2 squat'},beforeAt);
  const afterPlan=LoadnoteIntent.createPrescription([{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[
   {weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8}
  ]}],{type:'program',label:'Week 2 squat'},afterAt);
  const before={recordedAt:beforeAt,context:{date:day,name:'Squat day',status:'scheduled',reason:'',blockId:null,role:'heavy-exposure',goal:'Build squat strength',prescription:beforePlan}};
  const after={recordedAt:afterAt,context:{...before.context,reason:'Athlete-approved week 1 review',prescription:afterPlan}};
  data.scheduledSessions=[{id,revisions:[before,after]}];
  data.meetCycles=[{id:'c1',sessions:[{key:'w2d1',exercises:[{exerciseId:'s',lift:'squat'}]}],weeklyReviews:[{
   version:3,id:'review-1',cycleId:'c1',week:1,phase:'accumulation',createdAt:afterAt,
   choices:{squat:'reduce-one',bench:'keep',deadlift:'keep'},
   report:{findings:{squat:{name:'Competition Squat',exerciseId:'s',comparableRpeSets:4,aboveCap:2},bench:{name:'Bench'},deadlift:{name:'Deadlift'}}},
   changes:[{id,before,after}]
  }]}];
  renderTodayTraining();
 });
 const host=page.locator('#today-training');
 await expect(host).toContainText('Squat day');
 await expect(host.locator('.adaptation-explanation > summary')).toContainText('What changed & why');
 await host.locator('.adaptation-explanation > summary').click();
 await expect(host).toContainText('one working set removed');
 await expect(host).toContainText('4 directly comparable RPE sets');
 await expect(host).toContainText('2 comparable sets above the approved RPE cap');
 await expect(host).toContainText('does not claim causation');
});

test('saving a shortened scheduled workout closes the loop to the next session',async({page})=>{
 await addToday(page,'continuity-today');
 const tomorrow=await page.evaluate(()=>{
  const d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);const day=d.toISOString().slice(0,10);
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight:140,reps:4,targetRpe:7.5},{weight:140,reps:4,targetRpe:7.5}]}],{type:'program',label:'Next squat'});
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Next squat',date:day,role:'volume',goal:'Build squat',prescription:plan},{id:'continuity-next'});
  saveData(data);renderDashboard();return day;
 });
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await openOptions(page);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:/Remove set$/}).last().click();
 await page.locator('.set-rpe').fill('8');
 await openOptions(page);
 await page.locator('#session-intent > summary').click();
 await expect(page.locator('#session-deviation-reason')).toBeVisible();
 await page.locator('#session-deviation-reason').selectOption('time');
 await page.locator('#session-deviation-notes').fill('Shortened for time');
 await page.locator('#training-cockpit [data-cockpit-review]').click();
 await expect(page.locator('#workout-review-content')).toContainText('1/2 planned sets represented');
 await page.getByRole('button',{name:'Save workout',exact:true}).click();
 const recap=page.locator('#workout-recap .training-continuity-recap');
 await expect(recap).toContainText('Session result');
 await expect(recap).toContainText('Partial session preserved: 1/2 planned sets represented');
 await expect(recap).toContainText('Plan vs actual:');
 await expect(recap).toContainText('Time constraint');
 await expect(recap).toContainText('Next: '+tomorrow+' · Next squat');
 await expect(recap.getByRole('button',{name:'Done'})).toBeVisible();
 await expect(recap.getByRole('button',{name:'View next workout'})).toBeVisible();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 const home=page.locator('#today-training');
 await expect(home).toContainText('Training logged');
 await expect(home).toContainText('Next scheduled:');
 await expect(home).toContainText('Next squat');
});
