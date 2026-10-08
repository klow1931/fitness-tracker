const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.clock.install({time:new Date('2026-10-08T16:00:00Z')});
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
async function seed(page,mode='reps'){
 await page.evaluate(mode=>{
  data.unit='kg';updateUnitToggle();
  data.workouts=[{id:'earlier',date:'2026-10-01',exercises:[{name:'Bench Press',type:'strength',trackBy:mode,sets:[{weight:90,reps:mode==='reps'?6:undefined,duration:mode==='duration'?20:undefined,rpe:8}]}]}];
  const sets=[{weight:100,reps:mode==='reps'?5:undefined,duration:mode==='duration'?15:undefined,targetRpe:7},{weight:100,reps:mode==='reps'?5:undefined,duration:mode==='duration'?15:undefined,targetRpe:7}];
  const plan=LoadnoteIntent.createPrescription([{name:'Bench Press',type:'strength',trackBy:mode,sets}],{type:'manual',label:'Bench day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench day',date:today(),goal:'Practice controlled bench reps',role:'heavy-exposure',prescription:plan},{id:'flow-today'});
  const next=LoadnoteIntent.createPrescription([{name:'Squat',type:'strength',sets:[{weight:120,reps:5,targetRpe:7}]}],{type:'manual',label:'Squat day'});
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions,{name:'Squat day',date:'2026-10-09',prescription:next},{id:'flow-next'});
  saveData(data);showTab('dashboard');renderDashboard();
 },mode);
}
async function themes(page,testInfo,label){
 await page.clock.runFor(5000);
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{data.theme=theme;document.body.classList.toggle('dark',theme==='dark');},theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=321)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(label+'-'+theme+'.png')});
 }
}
test('Today keeps the start action and focus visible with keyboard-accessible exercise details',async({page},testInfo)=>{
 await seed(page);const host=page.locator('#today-training');
 const before=await page.evaluate(()=>JSON.stringify(data.scheduledSessions));
 await expect(host).toContainText('Focus: Practice controlled bench reps');
 await expect(host).toContainText('2 planned sets');
 const detail=host.locator('.today-session-preview');await expect(detail).not.toHaveAttribute('open','');
 const summary=detail.locator('summary');await summary.focus();await summary.press('Enter');
 await expect(detail).toHaveAttribute('open','');await expect(detail.getByText('Bench Press',{exact:true})).toBeVisible();
 await summary.press('Space');await expect(detail).not.toHaveAttribute('open','');
 expect(await page.evaluate(()=>JSON.stringify(data.scheduledSessions))).toBe(before);
 await host.scrollIntoViewIfNeeded();await themes(page,testInfo,'today');
 await host.getByRole('button',{name:'Start workout',exact:true}).click();
 await expect(page.locator('#training-cockpit')).toBeVisible();
 await expect(page.locator('.set-rpe').first()).toHaveValue('');
});
for(const mode of ['reps','duration'])test('copy current previous '+mode+' set protects entered effort, completion and other sets',async({page})=>{
 await seed(page,mode);await page.locator('#today-training [data-today-train]').click();
 const set=page.locator('.logger-set').first(),second=page.locator('.logger-set').nth(1),measure=mode==='reps'?'.set-reps':'.set-duration';
 await set.locator('.set-rpe').fill('7.5');
 const copy=page.locator('[data-cockpit-previous]');await expect(copy).toBeVisible();
 page.once('dialog',d=>d.dismiss());await copy.click();await expect(set.locator('.set-weight')).toHaveValue('100');
 page.once('dialog',d=>d.accept());await copy.click();
 await expect(set.locator('.set-weight')).toHaveValue('90');await expect(set.locator(measure)).toHaveValue(mode==='reps'?'6':'20');
 await expect(set.locator('.set-rpe')).toHaveValue('7.5');await expect(set.locator('.set-done-check')).not.toBeChecked();
 await expect(second.locator('.set-weight')).toHaveValue('100');await expect(second.locator(measure)).toHaveValue(mode==='reps'?'5':'15');
 await expect(second.locator('.set-rpe')).toHaveValue('');
 await page.reload();await expect(set.locator('.set-weight')).toHaveValue('90');await expect(set.locator('.set-rpe')).toHaveValue('7.5');
});
test('current workout rest and swap actions remain reachable without setup',async({page},testInfo)=>{
 await seed(page);await page.locator('#today-training [data-today-train]').click();
 const cockpit=page.locator('#training-cockpit');const before=await page.evaluate(()=>JSON.stringify(readLoggerDraft().rows));
 await cockpit.getByRole('button',{name:'Start 90 seconds of rest'}).click();await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('90s');
 await cockpit.locator('[data-cockpit-rest-pause]').click();await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('paused');
 await cockpit.getByRole('button',{name:'Add 30 seconds of rest'}).click();await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('120s');
 await cockpit.locator('[data-cockpit-rest-stop]').click();await expect(cockpit.locator('[data-cockpit-rest-start]')).toHaveCount(2);
 await cockpit.getByRole('button',{name:'Start 3 minutes of rest'}).click();expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().totalMs)).toBe(180000);
 expect(await page.evaluate(()=>JSON.stringify(readLoggerDraft().rows))).toBe(before);
 await cockpit.scrollIntoViewIfNeeded();await themes(page,testInfo,'logging');
 await cockpit.getByRole('button',{name:'Swap exercise',exact:true}).click();await expect(page.locator('#exercise-swap')).toBeVisible();
 await page.locator('#exercise-swap').press('Escape');await expect(page.locator('#exercise-swap')).not.toBeVisible();
});
test('finish shows a concise saved result, retains evidence and routes to the next session',async({page},testInfo)=>{
 await seed(page);await page.locator('#today-training [data-today-train]').click();
 await page.locator('.set-rpe').first().fill('7');await page.locator('.set-rpe').nth(1).fill('7.5');
 await page.locator('[data-cockpit-review]').click();await page.getByRole('button',{name:'Save workout',exact:true}).click();
 const recap=page.locator('#workout-recap');await expect(recap).toBeVisible();
 await expect(recap.locator('.session-result-summary')).toContainText('2/2 planned sets represented');
 await expect(recap.getByRole('button',{name:'Dismiss recap'})).toHaveCount(0);
 const evidence=recap.locator('.session-result-evidence').filter({has:page.getByText('Plan comparison',{exact:true})});
 await expect(evidence).not.toHaveAttribute('open','');await evidence.locator('summary').focus();await evidence.locator('summary').press('Enter');
 await expect(evidence).toContainText('2/2 logged strength sets include RPE');await evidence.locator('summary').press('Space');
 await expect(recap).toContainText('Next: 2026-10-09 · Squat day');
 const heading=recap.locator('.adaptive-handoff-head h3');expect((await heading.boundingBox()).width).toBeGreaterThan(180);
 await recap.scrollIntoViewIfNeeded();await themes(page,testInfo,'finish');
 await recap.getByRole('button',{name:'View next workout'}).click();await expect(page.locator('#panel-calendar')).toBeVisible();
 expect(await page.evaluate(()=>data.workouts.filter(w=>w.sessionIntent?.schedule?.id==='flow-today').length)).toBe(1);
});
