const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'bench',name:'Competition Bench'}];
  data.workouts=[{id:'bench-saved',date:'2026-10-24',createdAt:'2026-10-24T16:00:00.000Z',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8,done:true},{weight:115,reps:3,rpe:null,done:true}]}]}];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);
 });
 await page.locator('#exercise-rows .set-weight').first().fill('225');
});
async function ask(page,q){
 await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v6.2 exact-rep comparison uses recorded kg, entered lb, and never saves the draft',async({page})=>{
 await page.locator('#exercise-rows .set-done-check').first().check();
 await page.locator('#exercise-rows .set-rpe').first().fill('8.5');
 const before=await page.evaluate(()=>JSON.stringify(data));
 const reply=await ask(page,'Compare my checked set to last time');
 await expect(reply).toContainText('Exact-rep comparison');
 await expect(reply).toContainText('220.5 lb');
 await expect(reply).toContainText('225 lb');
 await expect(reply).toContainText('+4.5 lb');
 await expect(reply).toContainText('reported RPE 8.5');
 await expect(reply).toContainText('unsaved draft');
 await reply.getByRole('button',{name:'Return to workout'}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('225');
});
test('v6.2 does not invent a comparison for unmatched reps or incomplete saved sets',async({page})=>{
 await page.locator('#exercise-rows .set-reps').first().fill('8');
 await page.locator('#exercise-rows .set-done-check').first().check();
 let reply=await ask(page,'How does my checked set compare to last time?');
 await expect(reply).toContainText('no explicitly completed working set at 8 reps');
 await page.evaluate(()=>{data.workouts[0].exercises[0].sets[0].done=false;showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .set-reps').first().fill('5');
 reply=await ask(page,'Compare my checked set to last time');
 await expect(reply).toContainText('no explicitly completed working set at 5 reps');
});
