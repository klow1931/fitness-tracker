const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-18T14:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},phaseFixture().state);
});
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
test('save diagnostics are visible, local and free of training details',async({page})=>{
 await page.evaluate(()=>{data.workouts.push({id:'private',date:'2026-10-18',notes:'PRIVATE ATHLETE NOTES',exercises:[]});showTab('tools');});
 await page.locator('#tools-save-diagnostics summary').click();
 await page.locator('#save-diagnostics-refresh').click();
 await expect(page.locator('#save-diagnostics-report')).toHaveValue(/Version: 3\.62\.0/);
 const report=await page.locator('#save-diagnostics-report').inputValue();
 expect(report).toContain('Platform: web');expect(report).not.toContain('PRIVATE ATHLETE NOTES');expect(report).not.toContain('private');
});
test('saved backup fingerprint can be checked without triggering an import',async({page})=>{
 await page.evaluate(()=>showTab('tools'));
 const before=await page.evaluate(()=>JSON.stringify(data));
 const original=await page.evaluate(()=>JSON.stringify(LoadnoteIntegrity.addBackupManifest({schemaVersion:32,workouts:[{id:'w1'}],prs:[],unit:'lb'},{exportedAt:'2026-10-18T14:00:00.000Z'})));
 await page.locator('#verify-backup-input').setInputFiles({name:'saved-file.json',mimeType:'application/json',buffer:Buffer.from(original)});
 await expect(page.locator('#verify-backup-result')).toContainText('fingerprint VERIFIED');
 const tampered=JSON.parse(original);tampered.workouts[0].id='w2';
 await page.locator('#verify-backup-input').setInputFiles({name:'altered-file.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});
 await expect(page.locator('#verify-backup-result')).toContainText('check FAILED');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('Coach follows corrections but does not choose an ambiguous frequency',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 const before=await page.evaluate(()=>JSON.stringify(data));
 const first=await ask(page,'Create a 12-week strength program 4 days per week 60 minutes full gym');
 await expect(first).toContainText('4 days/week');
 const corrected=await ask(page,'Instead of 4 days use 3 days and 45 minutes');
 await expect(corrected).toContainText('3 days/week');await expect(corrected).toContainText('45 minutes');
 const unclear=await ask(page,'Actually 3 or 4 days per week');
 await expect(unclear).toContainText('more than one training frequency');
 await expect(unclear.getByRole('button',{name:'Review program request'})).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('training review distinguishes matched sets from missing actual effort',async({page})=>{
 await page.evaluate(()=>{
  const p=LoadnoteIntent.createPrescription([{name:'Competition Bench',exerciseId:'test-bench',type:'strength',trackBy:'reps',loadConvention:'total',sets:[{weight:90,reps:5,targetRpe:7},{weight:90,reps:5,targetRpe:7}]}],{type:'manual'},'2026-10-15T12:00:00.000Z');
  data.workouts=[{id:'feedback-test',date:'2026-10-17',createdAt:'2026-10-17T17:00:00.000Z',sessionIntent:{prescription:p},exercises:[{name:'Competition Bench',exerciseId:'test-bench',type:'strength',trackBy:'reps',loadConvention:'total',sets:[{weight:90,reps:5,rpe:7},{weight:90,reps:5}]}]}];
  showTab('prs');window.renderTrainingReview();
 });
 await page.getByText('Explore Progress',{exact:true}).click();
 await page.locator('#training-review-panel > summary').click();
 await page.locator('#review-weeks').selectOption('1');
 await expect(page.locator('#training-review-results')).toContainText('Planned versus logged');
 await expect(page.locator('#training-review-results')).toContainText('0/1 logged workouts have a full');
 await expect(page.locator('#training-review-results')).toContainText('Missing effort stays unknown');
});
