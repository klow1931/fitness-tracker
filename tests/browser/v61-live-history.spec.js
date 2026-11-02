const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'registered-bench',name:'Competition Bench'}];
  data.workouts=[{
   id:'saved-bench',date:'2026-10-24',createdAt:'2026-10-24T20:00:00.000Z',
   exercises:[{exerciseId:'registered-bench',name:'Competition Bench',type:'strength',
    sets:[{weight:100,reps:5,rpe:8,done:true},{weight:100,reps:4,rpe:null,done:true}]}]
  }];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);
 });
 await page.locator('#exercise-rows .set-weight').first().fill('225');
});
async function ask(page,question){
 await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#chat-input').fill(question);await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v6.1 last time uses saved kg-to-lb evidence, separate from checked draft performance',async({page})=>{
 await page.locator('#exercise-rows .set-done-check').first().check();
 await page.locator('#exercise-rows .set-rpe').first().fill('8.5');
 const before=await page.evaluate(()=>JSON.stringify(data));
 let reply=await ask(page,'How did I do last time?');
 await expect(reply).toContainText('2026-10-24');
 await expect(reply).toContainText('5 reps × 220.5 lb · RPE 8');
 await expect(reply).toContainText('4 reps × 220.5 lb · RPE unknown');
 await expect(reply).toContainText('unsaved draft');
 await expect(reply).toContainText('5 reps × 225 lb · RPE 8.5');
 await expect(reply).toContainText('does not establish progress');
 await reply.getByRole('button',{name:'Return to workout'}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('225');
});
test('v6.1 exercise history refreshes after correcting saved data, not from uncommitted logger values',async({page})=>{
 let reply=await ask(page,'How did I do last time?');
 await expect(reply).toContainText('220.5 lb');
 await page.evaluate(()=>{
  data.workouts[0].exercises[0].sets[0].weight=105;
  showTab('workouts');showSubTab('workouts','wo-log');
 });
 reply=await ask(page,'How did I do last time?');
 await expect(reply).toContainText('231.5 lb');
 await expect(reply).not.toContainText('999 lb');
});
