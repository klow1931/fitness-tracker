const {test,expect}=require('playwright/test');

async function hitTarget(page,locator){
 await locator.scrollIntoViewIfNeeded();
 await expect.poll(()=>locator.evaluate(button=>{
  const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  return r.width>=44&&r.height>=44&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&button.contains(document.elementFromPoint(x,y));
 })).toBe(true);
}
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{data.gymModeUserSet=true;});
});

test('short screens and enlarged text keep Coach actions and Progress explanations reachable',async({page},info)=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 for(const size of [{width:320,height:480},{width:390,height:568},{width:667,height:390}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';showTab('coach');showSubTab('coach','co-today');});
  for(const tab of await page.locator('#panel-coach .section-tab').all())await hitTarget(page,tab);
  await page.locator('#panel-coach .section-tab[data-sub="co-programs"]').click();
  for(const button of await page.locator('#decision-action-center .adaptive-entry-actions>button').all())await hitTarget(page,button);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.evaluate(()=>showTab('prs'));
  const method=page.locator('.progress-story-method');
  await expect(method).not.toHaveAttribute('open','');
  await hitTarget(page,method.locator('summary'));
  await method.locator('summary').click();await expect(method).toHaveAttribute('open','');
  await expect(method).toContainText('do not create a readiness score');
  await method.locator('summary').click();await expect(method).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.screenshot({path:info.outputPath('larger-text-progress.png')});
});

test('enlarged short-screen logger keeps actual set entry and completion hit targets clear',async({page},info)=>{
 await page.setViewportSize({width:320,height:480});
 await page.evaluate(()=>{
  document.documentElement.style.fontSize='24px';data.gymMode=true;
  showTab('workouts');showSubTab('workouts','wo-log');
  fillWorkoutForm([{name:'Competition Bench Press',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);
 });
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}));
 await hitTarget(page,page.locator('.quick-set-entry:visible [data-quick-rpe="8"]'));
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('.set-done-check').first()).toBeChecked();
 await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');
 await hitTarget(page,page.locator('.quick-set-entry:visible [data-quick-rpe="7"]'));
 await page.locator('.quick-set-entry:visible [data-quick-rpe="7"]').click();
 await expect(page.locator('.set-done-check').nth(1)).toBeChecked();
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('short-screen-logger.png')});
 await page.reload();await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await expect(page.locator('.set-rpe').first()).toHaveValue('8');await expect(page.locator('.set-rpe').nth(1)).toHaveValue('7');
});

test('scheduled three-set logging has a six-button budget without implicit effort or history writes',async({page},info)=>{
 await page.evaluate(()=>{
  const prescription=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',type:'strength',sets:Array.from({length:3},()=>({weight:100,reps:5,targetRpe:8}))}],{type:'manual',label:'Button budget'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Button budget',date:today(),prescription},{id:'budget'});
  data.gymMode=true;saveData(data);renderDashboard();window.loggingButtonClicks=0;
  document.addEventListener('click',event=>{if(event.target.closest('button'))loggingButtonClicks++;},true);
 });
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}));
 await page.locator('#today-training [data-today-train]').click();
 for(let index=0;index<3;index++){
  await expect(page.locator('.set-rpe').nth(index)).toHaveValue('');
  await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
  await expect(page.locator('.set-done-check').nth(index)).toBeChecked();
 }
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}))).toBe(before);
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 expect(await page.evaluate(()=>loggingButtonClicks)).toBe(6);
 const recorded=await page.evaluate(()=>data.workouts.at(-1).exercises[0].sets);
 expect(recorded).toHaveLength(3);expect(recorded.every(s=>s.weight===100&&s.reps===5&&s.rpe===8)).toBe(true);
 await info.attach('button-budget',{body:JSON.stringify({buttonActivations:6,sets:3,physicalPhoneTiming:'pending'}),contentType:'application/json'});
});
