const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
  data.gymMode=true;data.gymModeUserSet=true;
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:7},{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Bench day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench day',date:today(),role:'heavy-exposure',goal:'Build bench strength',prescription:plan},{id:'loop'});
  data.workouts=[{id:'previous',date:'2026-01-01',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:95,reps:5,rpe:8}]}]}];
  saveData(data);renderDashboard();window.demoTaps=[];
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)demoTaps.push(b.textContent.trim());},true);
 });
});
test('one-tap start and completion keep rest keyboard closed, targets intact and draft recoverable',async({page},info)=>{
 await page.locator('#today-training [data-today-train]').click();
 expect(await page.evaluate(()=>demoTaps.length)).toBe(1);
 await expect(page.locator('#training-cockpit')).toContainText('95 kg');
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions}));
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 expect(await page.evaluate(()=>demoTaps.length)).toBe(2);
 await expect(page.locator('.set-done-check').first()).toBeChecked();
 await expect(page.locator('[data-cockpit-save-status]')).toContainText('Draft saved');
 await expect(page.locator('[data-cockpit-rest]')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.activeElement?.matches('#exercise-rows input'))).toBe(false);
 await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');
 await expect(page.locator('.set-weight').nth(1)).toHaveValue('100');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions}))).toBe(before);
 await page.screenshot({path:info.outputPath('between-sets.png')});
 await page.reload();await page.locator('#today-training [data-today-resume]').click();
 await expect(page.locator('.set-done-check').first()).toBeChecked();await expect(page.locator('.set-rpe').first()).toHaveValue('8');
 await page.locator('.quick-set-entry:visible [data-quick-done]').click();
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 const sets=await page.evaluate(()=>data.workouts.find(w=>w.id!=='previous').exercises[0].sets);
 expect(sets[0].weight).toBe(100);expect(sets[0].rpe).toBe(8);expect(sets[1].rpe==null||sets[1].rpe==='').toBe(true);
});
test('failed draft save stays visible without opening options and retries the same data',async({page})=>{
 await page.locator('#today-training [data-today-train]').click();
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===LOGGER_DRAFT_KEY)throw Error('quota');return originalSetItem.call(this,k,v);};});
 await page.locator('.set-weight').first().fill('97.5');
 await expect(page.locator('[data-cockpit-save-status]')).toContainText('Draft not saved');
 await expect(page.locator('[data-cockpit-retry-save]')).toBeVisible();
 await page.evaluate(()=>Storage.prototype.setItem=originalSetItem);
 await page.locator('[data-cockpit-retry-save]').click();await expect(page.locator('[data-cockpit-save-status]')).toContainText('Draft saved');
 expect(await page.evaluate(()=>readLoggerDraft().rows[0].sets[0].weight)).toBe('97.5');
});
test('invalid quick completion cannot check a set or start rest',async({page})=>{
 await page.locator('#today-training [data-today-train]').click();
 await page.locator('.set-reps').first().fill('2.5');
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('.set-done-check').first()).not.toBeChecked();
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(false);
  await expect(page.locator('#logger-validation-error')).toContainText('whole-number reps');
});
test('pound display remains kilograms in reviewed history and repeated completion is ignored',async({page})=>{
 await page.evaluate(()=>setUnit('lb'));await page.locator('#today-training [data-today-train]').click();
 // Planned loads use the established one-decimal display contract.
 await expect(page.locator('.set-weight').first()).toHaveValue('220.5');
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 expect(await page.evaluate(()=>completeLoggerSetQuickly(document.querySelector('.sets-container > div'),9))).toBe(false);
 await expect(page.locator('.set-rpe').first()).toHaveValue('8');
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 // 220.5 lb rounds to 100.02 kg in storage, never 220.5 kg.
 expect(await page.evaluate(()=>data.workouts.find(w=>w.id!=='previous').exercises[0].sets[0].weight)).toBe(100.02);
});
