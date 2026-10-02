const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.73 History filters notes/source/review state and surfaces exact duplicate groups without deleting data',async({page})=>{
 await page.evaluate(()=>{
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}],{type:'repeated-workout',referenceId:'old',label:'Repeat'},'2026-09-01T12:00:00.000Z');
  const base={id:'a',date:'2026-09-10',createdAt:'2026-09-10T20:00:00.000Z',notes:'Morning bench',exercises:[{name:'Competition Bench Press',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]};
  const copy=structuredClone(base);copy.id='b';copy.createdAt='2026-09-10T21:00:00.000Z';
  const repeated={id:'repeat',date:'2026-09-11',createdAt:'2026-09-11T20:00:00.000Z',notes:'Volume repeat',exercises:[{name:'Competition Bench Press',type:'strength',trackBy:'reps',sets:[{weight:102.5,reps:5,rpe:8}]}],sessionIntent:{version:1,role:'volume',goal:'Bench volume',prescription:plan,deviationReason:'none',deviationNotes:''}};
  const bad={id:'bad',date:'2026-09-12',createdAt:'2026-09-12T20:00:00.000Z',notes:'Check effort entry',exercises:[{name:'Row',type:'strength',trackBy:'reps',sets:[{weight:60,reps:8,rpe:11}]}]};
  data=normalizeDataShape({...data,workouts:[base,copy,repeated,bad],scheduledSessions:[],workoutRevisions:[],lastExportDate:'2026-09-09'});
  invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');
 });
 await expect(page.locator('#history-reliability-summary')).toContainText('4');
 await expect(page.locator('#history-reliability-summary')).toContainText('Possible duplicates');
 await expect(page.locator('#history-duplicate-review')).not.toHaveAttribute('hidden','');
 await page.locator('#history-quality').selectOption('review');
 await expect(page.locator('[data-hist-id]')).toHaveCount(3);
 await expect(page.locator('[data-hist-id="bad"]')).toContainText('Review');
 await page.locator('#history-quality').selectOption('all');
 await page.locator('#history-source').selectOption('repeated');
 await expect(page.locator('[data-hist-id]')).toHaveCount(1);
 await expect(page.locator('[data-hist-id="repeat"]')).toContainText('Repeated');
 await page.locator('#history-source').selectOption('all');
 await page.locator('#history-search').fill('morning');
 await expect(page.locator('[data-hist-id]')).toHaveCount(2);
 await page.getByRole('button',{name:'Clear filters'}).click();
 await expect(page.locator('[data-hist-id]')).toHaveCount(4);
 await page.locator('#history-duplicate-review > summary').click();
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await page.locator('[data-workout-action="review-duplicate"]').click();
 await expect(page.locator('#session-comparison')).toBeVisible();
 expect(await page.locator('#compare-a').inputValue()).toBe('a');
 expect(await page.locator('#compare-b').inputValue()).toBe('b');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});

test('v2.73 workout review warns about an exact same-day duplicate but still lets the athlete save intentionally',async({page})=>{
 await page.evaluate(()=>{
  const date=today(),existing=LoadnoteSession.fromDraft({date,notes:'',unit:'kg',sessionIntent:null,rows:[{name:'Bench Press',type:'strength',trackBy:'reps',sets:[{weight:'100',reps:'5',rpe:'8'}]}]},'existing');
  existing.createdAt=date+'T12:00:00.000Z';existing.updatedAt=existing.createdAt;
  data=normalizeDataShape({...data,unit:'kg',workouts:[existing],scheduledSessions:[],workoutRevisions:[]});
  updateUnitToggle();invalidateViews();showTab('workouts');showSubTab('workouts','wo-log');
 });
 await page.locator('.ex-name').fill('Bench Press');
 await page.locator('.ex-name').blur();
 await expect(page.locator('.set-reps')).toHaveValue('5');
 await expect(page.locator('.set-weight')).toHaveValue('100');
 await page.locator('.set-rpe').fill('8');
 const duplicateDebug=await page.evaluate(()=>{
  const candidate=LoadnoteSession.fromDraft(captureLoggerDraft(),'candidate');
  return {existing:data.workouts[0],candidate,existingSignature:LoadnoteHistoryReliability.workoutSignature(data.workouts[0]),candidateSignature:LoadnoteHistoryReliability.workoutSignature(candidate),matches:LoadnoteHistoryReliability.duplicateMatches(data.workouts,candidate).map(w=>w.id)};
 });
 expect(duplicateDebug.candidateSignature,JSON.stringify(duplicateDebug)).toBe(duplicateDebug.existingSignature);
 expect(duplicateDebug.matches,JSON.stringify(duplicateDebug)).toContain('existing');
 await page.locator('#training-cockpit [data-cockpit-review]').click();
 const review=page.locator('#workout-review');
 await expect(review).toBeVisible();
 await expect(review).toContainText('Possible duplicate');
 await expect(page.locator('#confirm-workout-save')).toHaveText('Save duplicate anyway');
 await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(2);
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-history');});
 await expect(page.locator('#history-duplicate-review')).not.toHaveAttribute('hidden','');
 await expect(page.locator('#history-reliability-summary')).toContainText('1');
});

test('v2.73 import review keeps current data untouched until explicit replacement',async({page})=>{
 await page.evaluate(()=>{
  data=normalizeDataShape({...data,workouts:[{id:'current',date:'2026-09-20',exercises:[{name:'Squat',sets:[{weight:100,reps:5,rpe:8}]}]}]});
  invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');
 });
 const incoming={schemaVersion:25,workouts:[{id:'incoming',date:'2026-09-21',exercises:[{name:'Deadlift',sets:[{weight:150,reps:3,rpe:8}]}]}],nutrition:[],trainingBlocks:[],scheduledSessions:[],athleteGoals:[],programmingProfiles:[],phaseReviews:[],phasePrograms:[],reviewedPrograms:[],programReviews:[],meetCycles:[],adoptedPrograms:[],transitionSnapshots:[],exerciseRoles:[]};
 await page.locator('#import-file').setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 const dialog=page.locator('#import-review');await expect(dialog).toBeVisible();
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe('current');
 await expect(dialog).toContainText('What will change');
 await expect(dialog).toContainText('Recovery protection');
 await dialog.getByRole('button',{name:'Cancel'}).click();
 await expect(dialog).not.toBeVisible();
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe('current');
});
