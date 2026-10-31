const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-30T16:00:00Z')});await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(state=>{data=normalizeDataShape({...data,...state});window.remoteCalls=0;LoadnoteCoachClient.ensureSignedIn=async()=>true;LoadnoteCoachClient.ask=async()=>{remoteCalls++;throw Error('Unexpected online request');};showTab('coach');showSubTab('coach','co-chat');},phaseFixture().state);
});
async function ask(page,q){await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
test('supportive turns follow equipment and corrected time concerns without modifying training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));let r=await ask(page,'That workout felt terrible');await expect(r).toContainText('performance');
 r=await ask(page,'The weights were fine. I just felt awkward training alone');await expect(r).toContainText('Training alone');
 r=await ask(page,'Mostly the equipment');await expect(r).toContainText('Which movement');
 r=await ask(page,'Bench press');await expect(r).toContainText('safety equipment');
 r=await ask(page,'Actually I am short on time, not confidence');await expect(r).toContainText('Time is the constraint');
 r=await ask(page,'20 minutes');await expect(r).toContainText('20 minutes available');
 r=await ask(page,'Tell me more');await expect(r).toContainText('until you approve');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);expect(await page.evaluate(()=>remoteCalls)).toBe(0);
});
test('explicit reply settings survive reload, change detail and can be removed without storing conversation',async({page})=>{
 let r=await ask(page,'Remember I prefer detailed replies with upbeat encouragement');
 expect(await page.evaluate(()=>localStorage.getItem(LoadnoteCoachConversationPreferences.KEY))).toBeNull();
 await r.getByRole('button',{name:'Review reply preferences',exact:true}).click();const d=page.locator('#coach-communication-dialog');
 await expect(d.locator('#coach-reply-length')).toHaveValue('detail');await d.getByRole('button',{name:'Save preferences',exact:true}).click();await expect(d).toContainText('Preferences saved on this device');await expect(d.locator('#coach-communication-status')).toBeInViewport();
 await d.locator('[data-review-close]').click();r=await ask(page,'I am nervous');await expect(r).toContainText('One step at a time');await expect(r).toContainText('performance measurement');
 const raw=await page.evaluate(()=>localStorage.getItem(LoadnoteCoachConversationPreferences.KEY));expect(JSON.parse(raw)).toEqual({version:1,length:'detail',encouragement:'upbeat'});expect(raw).not.toContain('nervous');
 await page.reload();await expect(page.locator('#coach-companion-launcher')).toBeVisible();await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#coach-reply-preferences').click();await expect(d.locator('#coach-reply-length')).toHaveValue('detail');await d.getByRole('button',{name:'Remove saved preferences',exact:true}).click();await expect(d).toContainText('Defaults are in use');expect(await page.evaluate(()=>localStorage.getItem(LoadnoteCoachConversationPreferences.KEY))).toBeNull();
});
test('settings failure stays visible and preserves previously saved choices',async({page})=>{
 await page.locator('#coach-reply-preferences').click();const d=page.locator('#coach-communication-dialog');await d.getByRole('button',{name:'Save preferences',exact:true}).click();
 await page.evaluate(()=>{window.originalCommunicationSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===LoadnoteCoachConversationPreferences.KEY)throw Error('Quota');return originalCommunicationSet.call(this,k,v);};});
 await d.locator('#coach-reply-length').selectOption('detail');await d.getByRole('button',{name:'Save preferences',exact:true}).click();await expect(d).toContainText('could not be saved');await expect(d.locator('#coach-communication-status')).toBeInViewport();expect(await page.evaluate(()=>LoadnoteCoachConversationPreferencesUI.current().preferences.length)).toBe('standard');
});
test('topic changes, clearing and health questions stop supportive continuation',async({page})=>{
 await ask(page,'I am nervous');await ask(page,'Explain RPE');let r=await ask(page,'Mostly the equipment');await expect(r).not.toContainText('Which movement or piece of equipment feels unfamiliar');
 await ask(page,'I am nervous');await page.getByRole('button',{name:'Clear conversation',exact:true}).click();r=await ask(page,'Mostly the equipment');await expect(r).not.toContainText('Which movement or piece of equipment feels unfamiliar');
 r=await ask(page,'I feel dizzy but how many sets are left?');await expect(r).toContainText('cannot diagnose');await expect(r).not.toContainText('sets remain unchecked');
});
test('live questions read fresh draft counts and timer, never save or complete a workout',async({page})=>{
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');document.getElementById('wo-date').value=today();fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);document.querySelector('.set-done-check').checked=true;saveLoggerDraft();});
 const before=await page.evaluate(()=>JSON.stringify(data));let r=await ask(page,'How many sets are left?');await expect(r).toContainText('1 displayed strength sets remain unchecked');await expect(r).toContainText('not saved workout history');
 await page.evaluate(()=>document.querySelectorAll('.set-done-check').forEach(e=>e.checked=true));r=await ask(page,'Am I done?');await expect(r).toContainText('2 of 2');await expect(r).toContainText('Review and save');
 await r.getByRole('button',{name:'Return to workout',exact:true}).click();await expect(page.locator('#panel-workouts')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);expect(await page.locator('.set-done-check:checked').count()).toBe(2);
});
test('new preferences stay reachable at narrow large-text sizes',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await page.locator('#coach-reply-preferences').click();const d=page.locator('#coach-communication-dialog');await expect(d).toBeVisible();expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
