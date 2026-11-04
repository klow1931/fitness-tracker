const {test,expect}=require('playwright/test');
const KEY='loadnote-workout-draft-v1';
async function blockSlot(page,mode){
 await page.evaluate(({key,mode})=>{
  const original=Storage.prototype.setItem;
  window.__restoreCheckpointWriter=()=>{Storage.prototype.setItem=original;};
  Storage.prototype.setItem=function(slot,value){
   if((mode==='both'&&(slot===key||slot===key+'-recovery'))||
      (mode==='primary'&&slot===key)||(mode==='recovery'&&slot===key+'-recovery'))
     throw new Error('simulated local checkpoint write failure');
   return original.call(this,slot,value);
  };
 },{key:KEY,mode});
}
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .ex-name').first().fill('Competition Bench');
 await page.locator('#exercise-rows .set-weight').first().fill('100');
 await page.locator('#exercise-rows .set-reps').first().fill('5');
 await expect(page.locator('#training-cockpit')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteDraftSaveHealth)).toBe('saved');
});
test('v6.7 recovery-only checkpoint is accurately reported and reload restores checked sets',async({page})=>{
 const history=await page.evaluate(()=>JSON.stringify(data));
 await blockSlot(page,'primary');
 await page.locator('#exercise-rows > div').first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('#exercise-rows .set-done-check').first()).toBeChecked();
 const cockpit=page.locator('#training-cockpit');
 await expect(cockpit.locator('[data-cockpit-save-status]')).toContainText('saved in recovery copy');
 await expect(cockpit).toHaveClass(/cockpit-save-degraded/);
 await expect(cockpit.locator('[data-cockpit-retry-save]')).toBeVisible();
 await expect(page.locator('#logger-draft-failure')).toBeHidden();
 expect(await page.evaluate(()=>window.LoadnoteDraftSaveHealth)).toBe('degraded');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(history);
 const copies=await page.evaluate(key=>({primary:JSON.parse(localStorage.getItem(key)),recovery:JSON.parse(localStorage.getItem(key+'-recovery'))}),KEY);
 expect(copies.primary.rows[0].sets[0].done).toBe(false);
 expect(copies.recovery.rows[0].sets[0].done).toBe(true);
 expect(copies.recovery.rows[0].sets[0].rpe).toBe('8');
 await page.reload();
 await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Competition Bench');
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('100');
 await expect(page.locator('#exercise-rows .set-reps').first()).toHaveValue('5');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('8');
 await expect(page.locator('#exercise-rows .set-done-check').first()).toBeChecked();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0,'recovering a draft cannot fabricate saved history');
});
test('v6.7 primary-only checkpoint is recoverable and retry repairs redundancy',async({page})=>{
 await blockSlot(page,'recovery');
 await page.locator('#exercise-rows .set-weight').first().fill('105');
 const cockpit=page.locator('#training-cockpit');
 await expect(cockpit.locator('[data-cockpit-save-status]')).toContainText('recovery copy unavailable');
 await expect(cockpit).toHaveClass(/cockpit-save-degraded/);
 await expect(cockpit.locator('[data-cockpit-retry-save]')).toBeVisible();
 expect(await page.evaluate(()=>window.LoadnoteDraftSaveHealth)).toBe('degraded');
 await page.evaluate(()=>window.__restoreCheckpointWriter());
 await cockpit.locator('[data-cockpit-retry-save]').click();
 await expect(cockpit.locator('[data-cockpit-save-status]')).toHaveText('Draft saved on this device');
 await expect(cockpit.locator('[data-cockpit-retry-save]')).toBeHidden();
 const copies=await page.evaluate(key=>[JSON.parse(localStorage.getItem(key)),JSON.parse(localStorage.getItem(key+'-recovery'))],KEY);
 expect(copies[0].rows[0].sets[0].weight).toBe('105');
 expect(copies[1].rows[0].sets[0].weight).toBe('105');
});
test('v6.7 when both writes fail warn about unsaved work and allow retry',async({page})=>{
 await blockSlot(page,'both');
 await page.locator('#exercise-rows .set-weight').first().fill('110');
 const cockpit=page.locator('#training-cockpit');
 await expect(cockpit.locator('[data-cockpit-save-status]')).toContainText('Draft not saved');
 await expect(cockpit).toHaveClass(/cockpit-save-failed/);
 await expect(cockpit.locator('[data-cockpit-retry-save]')).toBeVisible();
 await expect(page.locator('#logger-draft-failure')).toBeVisible();
 expect(await page.evaluate(()=>window.LoadnoteDraftSaveHealth)).toBe('failed');
 await page.evaluate(()=>window.__restoreCheckpointWriter());
 await cockpit.locator('[data-cockpit-retry-save]').click();
 await expect(cockpit.locator('[data-cockpit-save-status]')).toHaveText('Draft saved on this device');
 await expect(cockpit.locator('[data-cockpit-retry-save]')).toBeHidden();
 await page.reload();
 await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('110');
});
