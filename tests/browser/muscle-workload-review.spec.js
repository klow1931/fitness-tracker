const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{data=normalizeDataShape({...data,exerciseCatalog:[{id:'q',name:'Squat',muscles:{confirmed:true,mode:'resistance',primary:['quadriceps'],secondary:['glutes']}}],workouts:['2026-09-08','2026-09-15','2026-09-22','2026-09-29'].map((date,i)=>({id:'w'+i,date,createdAt:date+'T18:00:00.000Z',exercises:[{exerciseId:'q',name:'Squat',type:'strength',sets:[{weight:100,reps:5+i,rpe:8},{weight:100,reps:5+i,rpe:8}]}]}))});showTab('coach');showSubTab('coach','co-programs');renderDecisionReadiness();});
 await page.locator('summary').filter({hasText:'Muscle workload & training knowledge'}).click();await page.locator('#workload-review-panel > summary').click();
});
async function fill(page){
 await page.locator('#workload-context-open').click();await page.locator('#workload-coverage').selectOption('complete');await page.locator('#workload-from').fill('2026-09-07');await page.locator('#workload-through').fill('2026-10-04');await page.locator('#workload-tolerance').selectOption('tolerated');
 await page.locator('#workload-context-dialog details > summary').click();const f=page.locator('[data-target="quadriceps"]');await f.locator('[data-enabled]').check();await f.locator('[data-min]').fill('3');await f.locator('[data-max]').fill('5');
}
test('reviewed context persists, restricts proposals and does not alter workouts or prescriptions',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}));
 await expect(page.locator('[data-workload-muscle="quadriceps"] > summary')).toContainText('gather');await fill(page);await page.getByRole('button',{name:'Save reviewed context',exact:true}).click();await expect(page.locator('#workload-context-dialog')).not.toBeVisible();
 await page.locator('#workload-review-panel > summary').click();await expect(page.locator('[data-workload-muscle="quadriceps"] > summary')).toContainText('review-adjustment');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}))).toBe(before);
 await page.reload();await expect(page.locator('#coach-companion-launcher')).toBeVisible();expect(await page.evaluate(()=>data.schemaVersion)).toBe(27);expect(await page.evaluate(()=>LoadnoteMuscleReview.current(data.workloadProfiles).context.targets.quadriceps.min)).toBe(3);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderDecisionReadiness();});await page.locator('summary').filter({hasText:'Muscle workload & training knowledge'}).click();await page.locator('#workload-review-panel > summary').click();await fill(page);await page.locator('[data-target="quadriceps"] [data-restricted]').check();await page.getByRole('button',{name:'Save reviewed context',exact:true}).click();await expect(page.locator('#workload-context-dialog')).not.toBeVisible();await page.locator('#workload-review-panel > summary').click();await expect(page.locator('[data-workload-muscle="quadriceps"] > summary')).toContainText('gather');
});
test('failed persistence keeps the reviewed context and training data unchanged',async({page})=>{
 await fill(page);const before=await page.evaluate(()=>JSON.stringify(data));await page.evaluate(()=>{window.savedPersist=persistNow;persistNow=async()=>{throw Error('Injected storage failure');};});await page.getByRole('button',{name:'Save reviewed context',exact:true}).click();await expect(page.locator('#workload-context-status')).toContainText('Injected storage failure');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);await page.evaluate(()=>{persistNow=window.savedPersist;});await page.getByRole('button',{name:'Save reviewed context',exact:true}).click();await expect(page.locator('#workload-context-dialog')).not.toBeVisible();
});
test('both coaching surfaces share muscle-specific evidence and follow-up context',async({page})=>{
 await page.evaluate(()=>{data=LoadnoteMuscleReview.save(data,{coverage:'complete',from:'2026-09-07',through:'2026-10-04',tolerance:'tolerated',targets:{quadriceps:{min:3,max:5,restricted:false}}});showSubTab('coach','co-chat');});const before=await page.evaluate(()=>JSON.stringify(data));
 async function ask(q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();}
 await ask('Are my quads getting enough work?');await expect(page.locator('#chat-messages')).toContainText('review-adjustment');await ask('Should I add weight?');await expect(page.locator('#chat-messages')).toContainText('No program targets are changed');
 await page.locator('#coach-companion-launcher').click();await page.locator('#cc-input').fill('Are my quads getting enough work?');await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();await expect(page.locator('#cc-messages')).toContainText('review-adjustment');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
