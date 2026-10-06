const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);});
async function enter(page){
 await page.evaluate(()=>{showTab('workouts');data.gymMode=true;data.gymModeUserSet=true;});
 await page.locator('.ex-name').fill('Bench');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');
}
test('Coach has three primary paths and preserves secondary tools',async({page},info)=>{
 await page.evaluate(()=>showTab('coach'));
 const tabs=page.locator('#panel-coach [role="tablist"] [role="tab"]');
 await expect(tabs).toHaveText(['Today','Your program','Ask Coach']);
 await expect(page.locator('#coach-today-brief')).toBeVisible();
 await tabs.nth(1).click();await expect(page.locator('#programming-workspace')).toBeVisible();
 await tabs.nth(2).click();await expect(page.locator('#chat-input')).toBeVisible();
 await page.locator('.coach-more > summary').click();await page.locator('.coach-more').getByRole('button',{name:'Goals',exact:true}).click();
 await expect(page.locator('#goal-type')).toBeVisible();expect(await tabs.evaluateAll(nodes=>nodes.filter(n=>n.tabIndex===0).length)).toBe(1);
 await tabs.first().click();await page.screenshot({path:info.outputPath('coach-today.png')});
});
test('undo preserves entered work and missing effort, restores prior rest and survives reload',async({page})=>{
 await enter(page);const frozen=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}));
 await page.evaluate(()=>LoadnoteRestTimer.start(60));const prior=await page.evaluate(()=>LoadnoteRestTimer.checkpoint());
 await page.locator('[data-quick-rpe="8"]:visible').click();await expect(page.locator('.set-done-check')).toBeChecked();
 await page.locator('[data-cockpit-undo]').click();await expect(page.locator('.set-done-check')).not.toBeChecked();
 await expect(page.locator('.set-rpe')).toHaveValue('');await expect(page.locator('.set-weight')).toHaveValue('100');
 expect(await page.evaluate(()=>LoadnoteRestTimer.checkpoint())).toEqual(prior);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}))).toBe(frozen);
 await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.set-rpe')).toHaveValue('');await expect(page.locator('.set-done-check')).not.toBeChecked();
 await expect(page.locator('[data-cockpit-undo]')).toHaveCount(0);
});
test('undo will not replace later edits or an independently changed timer',async({page})=>{
 await enter(page);await page.locator('[data-quick-rpe="8"]:visible').click();
 await page.evaluate(()=>LoadnoteRestTimer.add());const changed=await page.evaluate(()=>LoadnoteRestTimer.checkpoint());
 await page.locator('[data-cockpit-undo]').click();expect(await page.evaluate(()=>LoadnoteRestTimer.checkpoint())).toEqual(changed);
 await page.locator('[data-quick-rpe="8"]:visible').click();
 await page.evaluate(()=>{document.querySelector('.set-rpe').value='9';});
 expect(await page.evaluate(()=>LoadnoteQuickCompletionUndo.undo())).toBe(false);await expect(page.locator('.set-rpe')).toHaveValue('9');await expect(page.locator('.set-done-check')).toBeChecked();
});
test('takeaway appears only after successful reviewed save; undo cannot change history',async({page})=>{
 await enter(page);await page.locator('[data-quick-done]:visible').click();
 await page.locator('[data-cockpit-review]').click();await expect(page.locator('.workout-takeaway')).toHaveCount(0);
 await page.locator('#confirm-workout-save').click();await expect(page.locator('.workout-takeaway')).toContainText('1 sets have no recorded RPE');
 await expect(page.locator('.recap-details')).not.toHaveAttribute('open','');
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));expect(await page.evaluate(()=>LoadnoteQuickCompletionUndo.undo())).toBe(false);
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('proposal preview shows exact before and after, why and explicit approval',async({page})=>{
 await page.evaluate(()=>{const before={date:today(),name:'Bench',status:'scheduled',prescription:{plannedExercises:[{name:'Bench',sets:[{weight:100,reps:5,targetRpe:8}]}]}};
 const after=JSON.parse(JSON.stringify(before));after.prescription.plannedExercises[0].sets[0].weight=102.5;
 LoadnoteCoachingReviewUI.preview({asOf:today(),reason:'Comparable logged work',evidence:['Reported effort'],changes:[{before,after}]});});
 await expect(page.locator('.proposal-targets')).toContainText('100 kg');await expect(page.locator('.proposal-targets')).toContainText('102.5 kg');
 await expect(page.locator('#coaching-response')).toHaveValue('declined');await expect(page.locator('#coaching-proposal-confirm')).not.toBeChecked();
 await page.locator('#coaching-proposal-dialog').getByText('Why?',{exact:true}).click();await expect(page.locator('#coaching-proposal-dialog')).toContainText('Comparable logged work');
});
