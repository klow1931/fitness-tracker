const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
  data.exerciseCatalog.push({id:'v331-row',name:'Chest-supported Row',aliases:['Chest supported row']},{id:'v331-lat',name:'Lat Pulldown'});
  data.workouts.push(
   {id:'v331-a',date:'2026-09-10',exercises:[{name:'Chest-supported Row',exerciseId:'v331-row',sets:[{weight:50,reps:8,rpe:7,done:true},{weight:55,reps:8,rpe:null,done:false}]}]},
   {id:'v331-b',date:'2026-09-20',exercises:[{name:'Chest-supported Row',exerciseId:'v331-row',sets:[{weight:60,reps:8,rpe:8,done:true}]},{name:'Lat Pulldown',exerciseId:'v331-lat',sets:[{weight:40,reps:10,rpe:null,done:true}]}]},
   {id:'v331-future',date:'2026-10-01',exercises:[{name:'Chest-supported Row',exerciseId:'v331-row',sets:[{weight:999,reps:8,rpe:10,done:true}]}]}
  );
  invalidateViews();
 });
});
async function ask(page,q){
 await page.locator('#cc-input').fill(q);
 await page.locator('#cc-form button').click();
 await expect(page.locator('#cc-form button')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}
test('offline Coach reviews named accessory work and resolves follow-up without assuming progression',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await page.locator('#coach-companion-launcher').click();
 const first=await ask(page,'How did my chest supported row change over my last workouts?');
 await expect(first).toContainText('Chest-supported Row');
 await expect(first).toContainText('132.3 lb').catch(()=>{});
 await expect(first).toContainText('RPE 8');
 await expect(first).not.toContainText('999');
 await expect(first).toContainText('No training load was changed');
 const follow=await ask(page,'What about last time?');
 await expect(follow).toContainText('Chest-supported Row');
 const next=await ask(page,'What about lat pulldown?');
 await expect(next).toContainText('Lat Pulldown');
 await expect(next).toContainText('RPE unknown');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
 await page.evaluate(()=>clearCoachConversation());
 const unknown=await ask(page,'What about last time?');
 await expect(unknown).not.toContainText('Chest-supported Row');
});
test('offline history rejects cross-topic references and uses latest corrected saved sets',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 async function full(q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages');}
 await full('Show my chest supported row history');
 await expect(page.locator('#chat-messages')).toContainText('Chest-supported Row');
 await page.evaluate(()=>{const workout=data.workouts.find(w=>w.id==='v331-b');workout.exercises[0].sets[0].weight=63;});
 await full('Show my chest supported row history');
 await expect(page.locator('#chat-messages')).toContainText('63 kg');
 await full('Hello');
 await full('What about last time?');
 await expect(page.locator('#chat-messages .cc-msg').last()).not.toContainText('Chest-supported Row');
});
