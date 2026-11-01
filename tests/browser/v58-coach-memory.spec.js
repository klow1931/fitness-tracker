const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T14:00:00.000Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(state=>{data=normalizeDataShape({...data,...state});LoadnoteAccountSession._resetForTest('anonymous');showTab('coach');showSubTab('coach','co-chat');},fixture());
});
async function ask(page,q){
 await page.locator('#chat-input').fill(q);
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v5.8 review-only memory is retained on reload but never saved from a chat message',async({page})=>{
 page.on('dialog',d=>d.accept());
 const before=await page.evaluate(()=>JSON.stringify(data));
 let r=await ask(page,'Remember that I want to keep enjoying exercise');
 await expect(r).toContainText('Nothing from this chat was stored');
 await expect(r.getByRole('button',{name:'Review memory before saving'})).toBeVisible();
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records.length)).toBe(0);
 await r.getByRole('button',{name:'Review memory before saving'}).click();
 const d=page.locator('#coach-memory-dialog');
 await expect(d).toBeVisible();
 await expect(d.locator('#coach-memory-text')).toHaveValue('I want to keep enjoying exercise');
 await d.locator('#coach-memory-save').click();
 await expect(d.locator('#coach-memory-status')).toContainText('Memory saved');
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records[0].text)).toBe('I want to keep enjoying exercise');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await d.locator('[data-review-close]').click();
 await page.reload();
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{LoadnoteAccountSession._resetForTest('anonymous');showTab('coach');showSubTab('coach','co-chat');});
 r=await ask(page,'What do you remember about me?');
 await expect(r).toContainText('I want to keep enjoying exercise');
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records.length)).toBe(1);
 await page.locator('#coach-memory-open').click();
 await expect(d.locator('[data-coach-memory-id]')).toHaveCount(1);
 await d.locator('[data-memory-edit]').click();
 await d.locator('#coach-memory-text').fill('Keep exercise enjoyable every week');
 await d.locator('#coach-memory-save').click();
 await expect(d).toContainText('Keep exercise enjoyable every week');
 await d.locator('[data-memory-delete]').click();
 await expect(d.locator('[data-coach-memory-id]')).toHaveCount(0);
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records.length)).toBe(0);
});
test('v5.8 follow-up is offered on a later opening, and a profile switch isolates memory',async({page})=>{
 page.on('dialog',d=>d.accept());
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-memory-open').click();
 const d=page.locator('#coach-memory-dialog');
 await d.locator('#coach-memory-type').selectOption('follow-up');
 await d.locator('#coach-memory-text').fill('Did I try putting my phone away while cooking?');
 await d.locator('#coach-memory-save').click();
 await expect(d.locator('#coach-memory-status')).toContainText('Memory saved');
 await d.locator('[data-review-close]').click();
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.nextVisit().length)).toBe(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.reload();
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>LoadnoteAccountSession._resetForTest('anonymous'));
 // The fixture assigned in beforeEach is transient; a real page reload restores
 // saved browser state instead. Profile isolation must be compared within the
 // same post-reload session, not against an unsaved pre-reload fixture.
 const afterReload=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-messages')).toContainText('Did I try putting my phone away while cooking?');
 await page.evaluate(()=>LoadnoteAccountSession._applyForTest({authenticated:true,account:{id:'other-user'},authConfigured:true}));
 await page.evaluate(()=>LoadnoteCoachCompanionUI.refresh());
 await expect(page.locator('#cc-messages')).not.toContainText('putting my phone away');
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records.length)).toBe(0);
 await page.evaluate(()=>LoadnoteAccountSession._resetForTest('anonymous'));
 await page.evaluate(()=>LoadnoteCoachCompanionUI.refresh());
 expect(await page.evaluate(()=>LoadnoteCoachMemoryUI.current().records.length)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(afterReload);
});
test('v5.8 account changes erase an in-flight Coach reply instead of displaying another profile\'s chat',async({page})=>{
 await page.evaluate(()=>{
  LoadnoteAccountSession._resetForTest('anonymous');
  LoadnoteCoachCompanionUI.refresh();
  window.LoadnoteLocalCoachAI={
   snapshot:()=>({conversationConsent:true,status:'ready'}),
   eligible:()=>true,
   respond:()=>new Promise(resolve=>{window.resolveCoachReply=resolve;})
  };
  window.pendingCoachReply=LoadnoteCoachCompanionUI.ask('I had a rough day');
 });
 await page.waitForFunction(()=>typeof window.resolveCoachReply==='function');
 await expect(page.locator('#chat-messages')).toContainText('I had a rough day');
 await page.evaluate(()=>{
  LoadnoteAccountSession._applyForTest({authenticated:true,account:{id:'other-user'},authConfigured:true});
  LoadnoteCoachCompanionUI.refresh();
 });
 await expect(page.locator('#chat-messages')).not.toContainText('rough day');
 await page.evaluate(()=>window.resolveCoachReply('Stale previous account reply'));
 expect(await page.evaluate(()=>window.pendingCoachReply)).toBeNull();
 await expect(page.locator('#chat-messages')).not.toContainText('Stale previous account reply');
 expect(await page.evaluate(()=>LoadnoteCoachCompanionUI.history().length)).toBe(0);
});
test('v5.8 manual memory backup imports only in matching scope and clear-all is independent of training',async({page})=>{
 page.on('dialog',d=>d.accept());
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-memory-open').click();
 const d=page.locator('#coach-memory-dialog');
 await d.locator('#coach-memory-type').selectOption('routine-cue');
 await d.locator('#coach-memory-text').fill('Put gym shoes near the door on Sunday');
 await d.locator('#coach-memory-save').click();
 const backup=await page.evaluate(()=>LoadnoteCoachMemory.createStore(localStorage,LoadnoteCoachMemoryUI.scope()).exportData());
 await d.locator('#coach-memory-clear').click();
 await expect(d.locator('[data-coach-memory-id]')).toHaveCount(0);
 const tampered=JSON.stringify({...JSON.parse(backup),scope:'account:someone-else'});
 await d.locator('#coach-memory-import').setInputFiles({name:'other.json',mimeType:'application/json',buffer:Buffer.from(tampered)});
 await expect(d.locator('#coach-memory-status')).toContainText('Import did not change memories');
 await d.locator('#coach-memory-import').setInputFiles({name:'my-memories.json',mimeType:'application/json',buffer:Buffer.from(backup)});
 await expect(d).toContainText('Put gym shoes near the door on Sunday');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});