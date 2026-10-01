const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){} update(){}};});await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
});
async function review(page){const cockpit=page.locator('#training-cockpit [data-cockpit-review]');if(await cockpit.isVisible())await cockpit.click();else await page.locator('#workout-actions [data-workout-action="review"]').click();}
async function save(page,name='Bench Press',weight='100'){
 await page.locator('.ex-name').fill(name);await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill(weight);await page.locator('.set-rpe').fill('8');await review(page);await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
}
test('duplicate is a new draft and edit/delete revisions can be undone',async({page})=>{
 await save(page);const original=await page.evaluate(()=>data.workouts[0].id);await page.evaluate(()=>showSubTab('workouts','wo-history'));
 await page.locator(`[data-hist-id="${original}"] [data-workout-action="duplicate"]`).click();await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-rpe')).toHaveValue('');
 await page.locator('.set-rpe').fill('7');await review(page);await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>new Set(data.workouts.map(w=>w.id)).size)).toBe(2);
 await page.evaluate(id=>editWorkout(id),original);await page.locator('.set-weight').fill('90');await review(page);await page.locator('#confirm-workout-save').click();
 await page.evaluate(()=>showSubTab('workouts','wo-history'));
 await expect(page.locator('#workout-history')).toContainText('Edited workout');await page.locator('#workout-history details:has([data-workout-action="undo-change"]) > summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="undo-change"]').first().click();await expect.poll(()=>page.evaluate(id=>data.workouts.find(w=>w.id===id)?.exercises[0]?.sets[0]?.weight,original)).toBe(100);
 page.once('dialog',d=>d.accept());await page.locator(`[data-hist-id="${original}"] [data-workout-action="delete"]`).click();await expect.poll(()=>page.evaluate(id=>data.workouts.some(w=>w.id===id),original)).toBe(false);await expect(page.locator('#workout-history')).toContainText('Deleted workout');await page.locator('#workout-history details:has([data-workout-action="undo-change"]) > summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="undo-change"]').first().click();await expect.poll(()=>page.evaluate(id=>data.workouts.some(w=>w.id===id),original)).toBe(true);
});
test('replacement import previews changes, saves recovery, and restores prior state',async({page})=>{
 await save(page,'Squat','120');const before=await page.evaluate(()=>JSON.parse(JSON.stringify(data)));const incoming={schemaVersion:11,workouts:[{id:'replacement',date:'2026-09-01',exercises:[{name:'Deadlift',sets:[{weight:150,reps:3,rpe:7}]}]}],nutrition:[],trainingBlocks:[]};
 await page.locator('#import-file').setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 const review=page.locator('#import-review');await expect(review).toBeVisible();await expect(review).toContainText('Legacy backup');await expect(review).toContainText('Workouts');await expect(review).toContainText('1 added');await expect(review).toContainText('1 removed');expect(await page.evaluate(()=>data.workouts[0].id)).toBe(before.workouts[0].id);
 await review.getByRole('button',{name:'Replace current data'}).click();await expect.poll(()=>page.evaluate(()=>data.workouts[0].id)).toBe('replacement');await expect(review).not.toBeVisible();
 await page.evaluate(()=>showTab('tools'));await expect(page.locator('#recovery-snapshots')).toContainText('Before JSON import');await page.locator('details:has(#recovery-snapshots) > summary').click();page.once('dialog',d=>d.accept());await page.locator('#recovery-snapshots [data-restore-snapshot]').click();await expect.poll(()=>page.evaluate(()=>data.workouts[0].id)).toBe(before.workouts[0].id);
});
test('exercise alias merge preserves labels and unifies identities',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'a',date:'2026-08-01',exercises:[{name:'Adduction Machine',sets:[{weight:50,reps:10}]}]},{id:'b',date:'2026-08-08',exercises:[{name:'Hip Adduction',sets:[{weight:55,reps:10}]}]}];data=LoadnoteIntegrity.normalizeState(data);invalidateViews();showTab('tools');});
 await page.locator('details:has(#exercise-alias-tools) > summary').click();
 await page.locator('#exercise-alias-source').selectOption({label:'Adduction Machine'});await page.locator('#exercise-alias-target').selectOption({label:'Hip Adduction'});page.once('dialog',d=>d.accept());await page.locator('#merge-exercise-alias').click();
 const result=await page.evaluate(()=>({names:data.workouts.map(w=>w.exercises[0].name),ids:data.workouts.map(w=>w.exercises[0].exerciseId)}));expect(result.names).toEqual(['Adduction Machine','Hip Adduction']);expect(new Set(result.ids).size).toBe(1);await expect(page.locator('#recovery-snapshots')).toContainText('Before exercise identity merge');
});

test('training data health surfaces current outliers without treating corrected revision history as active',async({page})=>{
 await page.evaluate(()=>{
  const bad={id:'bench-outlier',date:'2026-09-14',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',sets:[{weight:132.45,reps:1,rpe:8},{weight:119.75,reps:2,rpe:7},{weight:114.76,reps:2,rpe:6.5},{weight:114.76,reps:2,rpe:6.5},{weight:109.77,reps:3,rpe:6},{weight:1016.95,reps:3,rpe:6}]}]};
  const fixed=JSON.parse(JSON.stringify(bad));fixed.exercises[0].sets[5].weight=109.77;
  data.workouts=[fixed];data.workoutRevisions=[{id:'fix',workoutId:bad.id,recordedAt:'2026-09-15T00:00:00.000Z',action:'edit',before:bad,after:fixed}];
  data=LoadnoteIntegrity.normalizeState(data);showTab('tools');renderDataIntegrityTools();
 });
 await page.locator('details:has(#training-data-health) > summary').click();
 await expect(page.locator('#training-data-health')).toContainText('Current training data and record links passed the integrity audit');
 await expect(page.locator('#training-data-health')).toContainText('suspicious loads: 0');
 await expect(page.locator('#training-data-health')).toContainText('Historical suspicious loads: 1');
 await expect(page.locator('#training-data-health')).toContainText('Corrected revisions remain audit history');
});

test('replacement import rejects malformed v25 program-transition records before replacing data',async({page})=>{
 await save(page,'Squat','120');const before=await page.evaluate(()=>data.workouts[0].id);
 const incoming={schemaVersion:25,workouts:[{id:'replacement',date:'2026-09-01',exercises:[{name:'Deadlift',sets:[{weight:150,reps:3,rpe:7}]}]}],nutrition:[],trainingBlocks:[],transitionSnapshots:[{id:'broken'}]};
 let message='';page.once('dialog',dialog=>{message=dialog.message();dialog.accept();});
 await page.locator('#import-file').setInputFiles({name:'malformed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 await expect.poll(()=>message).toContain('Import failed');
 expect(message).toContain('Invalid transition baseline');
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe(before);
});

test('Tools reports broken workout-to-Calendar links without rewriting current training',async({page})=>{
 await page.evaluate(()=>{
  const plan=LoadnoteIntent.createPrescription([{name:'Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}],{type:'program',label:'Bench plan'});
  data.workouts=[{id:'orphan-workout',date:today(),exercises:[{name:'Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}],
   sessionIntent:{version:1,role:'heavy-exposure',goal:'Bench',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:'missing-session',revisionAt:plan.capturedAt}}}];
  data.scheduledSessions=[];data.workoutRevisions=[];data=LoadnoteIntegrity.normalizeState(data);showTab('tools');renderDataIntegrityTools();
 });
 await page.locator('details:has(#training-data-health) > summary').click();
 const health=page.locator('#training-data-health');
 await expect(health).toContainText('record-link issues');
 await expect(health).toContainText('Calendar session that no longer exists');
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe('orphan-workout');
});

test('replacement import rejects a tampered v2.52 fingerprint before replacing data',async({page})=>{
 await save(page,'Bench Press','100');const before=await page.evaluate(()=>data.workouts[0].id);
 const signed=await page.evaluate(()=>{
  const payload={...data,recoverySnapshots:[],progressPhotos:(data.progressPhotos||[]).map(p=>({id:p.id,date:p.date,tag:p.tag,note:p.note,hasImage:!!p.dataUrl}))};
  return LoadnoteIntegrity.addBackupManifest(payload,{exportedAt:'2026-09-28T18:00:00.000Z',releaseVersion:'2.52.0'});
 });
 signed.workouts[0].notes='tampered after fingerprint';
 let message='';page.once('dialog',dialog=>{message=dialog.message();dialog.accept();});
 await page.locator('#import-file').setInputFiles({name:'tampered-v252.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(signed))});
 await expect.poll(()=>message).toContain('Backup integrity check failed');
 expect(message).toContain('contents do not match');
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe(before);
});
