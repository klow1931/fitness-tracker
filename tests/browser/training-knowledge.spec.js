const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{data=normalizeDataShape({...data,exerciseCatalog:[{id:'q',name:'My Squat',aliases:[]}],workouts:[{id:'w',date:'2026-10-04',exercises:[{exerciseId:'q',name:'My Squat',type:'strength',sets:[{weight:100,reps:5,rpe:8},{weight:100,reps:5}]}]}]});showTab('coach');showSubTab('coach','co-programs');renderDecisionReadiness();});
});
test('confirm mappings, workload evidence and persisted metadata',async({page})=>{
 await page.locator('summary').filter({hasText:'Muscle workload & training knowledge'}).click();
 await expect(page.locator('#muscle-workload')).toContainText('2 unmapped sets');
 await page.locator('#muscle-map-open').click();await page.locator('#muscle-suggest').click();
 await expect(page.locator('#muscle-map-status')).toContainText('Suggestion only');
 await page.locator('#muscle-map-dialog').getByRole('button',{name:'Save confirmed mapping',exact:true}).click();
 await expect(page.locator('#muscle-map-status')).toContainText('Saved confirmed mapping');
 await page.locator('#muscle-close').click();
 const row=page.locator('#muscle-workload tbody tr').filter({hasText:'Quads'});await expect(row).toContainText('1/2');
 await page.reload();await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 expect(await page.evaluate(()=>data.exerciseCatalog.find(e=>e.id==='q').muscles.primary)).toContain('quadriceps');
});
test('Coach and Companion share workload evidence and sport limits without modifying state',async({page})=>{
 await page.evaluate(()=>{data.exerciseCatalog[0].muscles={confirmed:true,mode:'resistance',primary:['quadriceps'],secondary:['glutes']};showSubTab('coach','co-chat');});
 const before=await page.evaluate(()=>JSON.stringify(data));
 async function ask(q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();}
 await ask('Are my quads getting enough work?');await expect(page.locator('#chat-messages')).toContainText('2 direct sets');await expect(page.locator('#chat-messages')).toContainText('History completeness is unknown');
 await ask('Olympic weightlifting');await expect(page.locator('#chat-messages')).toContainText('does not generate weightlifting cycles');
 await page.locator('#coach-companion-launcher').click();await page.locator('#cc-input').fill('Are my quads getting enough work?');await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();await expect(page.locator('#cc-messages')).toContainText('2 direct sets');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});

test('malformed imported mappings remain unknown and can be repaired',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>{data.exerciseCatalog[0].muscles={confirmed:true,mode:'resistance',primary:{},secondary:[]};renderDecisionReadiness();});
 await page.locator('summary').filter({hasText:'Muscle workload & training knowledge'}).click();
 await expect(page.locator('#muscle-workload')).toContainText('2 unmapped sets');
 await page.locator('#muscle-map-open').click();await expect(page.locator('#muscle-map-status')).toContainText('Unknown until confirmed');
 await page.locator('#muscle-suggest').click();await page.locator('#muscle-map-dialog').getByRole('button',{name:'Save confirmed mapping',exact:true}).click();
 await expect(page.locator('#muscle-map-status')).toContainText('Saved confirmed mapping');expect(errors).toEqual([]);
});
