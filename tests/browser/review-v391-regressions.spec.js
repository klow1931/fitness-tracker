const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-22T18:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},phaseFixture().state);
});
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
async function pressCoachAction(button){if(test.info().project.name==='mobile-webkit')await button.tap();else await button.click();}
test('excluded or alternative days clarify without proposing changes',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 for(const q of ['I can train Monday but not Friday','I train Monday or Wednesday']){
  const r=await ask(page,q);await expect(r).toContainText('Which exact days');await expect(r.getByRole('button',{name:/Review training days/})).toHaveCount(0);
 }
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('compound day and duration preference reviews both, cancels safely and persists only on Save',async({page})=>{
 const initial=await page.evaluate(()=>({count:data.programmingProfiles.length,workouts:JSON.stringify(data.workouts),calendar:JSON.stringify(data.scheduledSessions)}));
 const r=await ask(page,'I train Monday and Wednesday for 45 minutes');
 const button=r.getByRole('button',{name:'Review training days and session time before saving'});
 await pressCoachAction(button);const d=page.locator('#programming-profile-dialog'),review=d.getByLabel('Review coaching preference');
 await expect(review).toContainText('Requested: Mon, Wed');await expect(review).toContainText('Requested session time: 45 minutes');
 await expect(d.locator('#profile-minutes')).toHaveValue('45');await expect(d.locator('[data-profile-day]:checked')).toHaveCount(2);
 await d.locator('#profile-close').click();expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(initial.count);
 await pressCoachAction(button);await d.getByRole('button',{name:'Save programming profile'}).click();await expect(d).toBeHidden();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
 const saved=await page.evaluate(()=>({count:data.programmingProfiles.length,context:LoadnoteProgrammingProfile.current(data.programmingProfiles).context,workouts:JSON.stringify(data.workouts),calendar:JSON.stringify(data.scheduledSessions)}));
 expect(saved.count).toBe(initial.count+1);expect(saved.context.availableDays).toEqual([0,2]);expect(saved.context.sessionMinutes).toBe(45);expect(saved.workouts).toBe(initial.workouts);expect(saved.calendar).toBe(initial.calendar);
});
test('two-lift short follow-up retains athlete context after coverage question',async({page})=>{
 await ask(page,'Compare my squat and bench progress');await ask(page,"What's missing for those two lifts?");
 const r=await ask(page,'Give me the short version');await expect(r).toContainText('Short version of the two-lift comparison');await expect(r).toContainText('Competition Squat');await expect(r).toContainText('Competition Bench');await expect(r).not.toContainText('I do not have a reliable built-in answer');
});
test('replacing a percentage movement clears its old max reference, with reversible Undo',async({page})=>{
 await page.evaluate(()=>{showSubTab('coach','co-programs');renderCustomProgramStudio();});
 await page.locator('#custom-studio-open').click();
 await page.locator('#custom-upload').setInputFiles({name:'percent.csv',mimeType:'text/csv',buffer:Buffer.from('Week,Day,Exercise,Sets,Reps,Percent,Percent basis,Reference,Reference unit,Round to,RPE\n1,Monday,Bench,3,5,75,training-max,100,kg,2.5,8')});
 await page.locator('#custom-start').fill('2026-10-26');await page.locator('#custom-quick-tools summary').click();
 await page.locator('#custom-swap-from').fill('Bench');await page.locator('#custom-swap-to').fill('Squat');
 page.once('dialog',d=>d.accept());await page.locator('#custom-swap-apply').click();await page.locator('#custom-preview').click();
 const preview=page.locator('#custom-preview-result');await expect(preview).toContainText('Squat');await expect(preview).not.toContainText('75 kg');await expect(preview).not.toContainText('100 kg reference');
 await page.locator('#custom-undo').click();await page.locator('#custom-preview').click();await expect(preview).toContainText('Bench');await expect(preview).toContainText('75 kg');await expect(preview).toContainText('100 kg reference');
});
