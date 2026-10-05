const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
});
async function full(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();}
async function quick(page,q){await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
test('one history follows lift context across full and quick views',async({page})=>{
 await page.locator('#coach-companion-launcher').click();await quick(page,'How is my squat progress?');
 await page.locator('#cc-full').click();await full(page,'What about bench?');await expect(page.locator('#chat-messages .assistant').last()).toContainText('Competition Bench');
 await expect(page.locator('#coach-companion-launcher')).toBeHidden();
 await page.evaluate(()=>LoadnoteCoachCompanionUI.open());await quick(page,'Why?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Competition Bench');
 expect(await page.locator('#cc-messages .user').allTextContents()).toEqual(await page.locator('#chat-messages .user').allTextContents());
});
test('encouragement responds safely without changing training or claiming progress',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 await full(page,'I am training alone');await expect(page.locator('#chat-messages .assistant').last()).toContainText("can't spot you");
 await full(page,'Give me encouragement');await expect(page.locator('#chat-messages .assistant').last()).toContainText('choosing rest');
 await full(page,'Encourage me through Achilles pain');await expect(page.locator('#chat-messages .assistant').last()).toContainText('cannot diagnose');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('clear resets both transcripts and follow-ups',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});await full(page,'I am training alone');await full(page,'What should I do?');
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('Training alone');await page.getByRole('button',{name:'Clear conversation',exact:true}).click();
 await expect(page.locator('#chat-messages .user')).toHaveCount(0);await expect(page.locator('#cc-messages .user')).toHaveCount(0);await full(page,'Why?');await expect(page.locator('#chat-messages .assistant').last()).toContainText('clear prior topic');
});
test('research answers and friendly greeting work offline in both views',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});await full(page,'Hi');await expect(page.locator('#chat-messages .assistant').last()).toContainText('how is training feeling');
 await full(page,'Is failure required?');await expect(page.locator('#chat-messages .assistant').last()).toContainText('ACSM');await expect(page.locator('#cc-messages .assistant').last()).toContainText('PMC12965823');
});
test('dark transcript uses legible colors and escapes reported labels',async({page},info)=>{
 await page.evaluate(()=>{document.body.classList.add('dark');showTab('coach');showSubTab('coach','co-chat');});await full(page,'I am nervous <img src=x onerror=alert(1)>');
 await expect(page.locator('#chat-messages img')).toHaveCount(0);
 const colors=await page.locator('#chat-messages .assistant').last().evaluate(e=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor];});expect(colors).toEqual(['rgb(241, 245, 249)','rgb(30, 41, 59)']);
 await full(page,'I am training alone');await page.evaluate(()=>document.activeElement?.blur());await page.locator('[data-sub="co-chat"].sub-panel .card').screenshot({path:info.outputPath('unified-coach-dark.png')});
});
test('both send controls lock during one request and clear cannot race it',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');LoadnoteCoachClient.ensureSignedIn=async()=>true;LoadnoteCoachClient.ask=()=>new Promise(resolve=>window.finishCoach=()=>resolve({summary:'Reviewed response',recommendation:{action:'none'}}));});
 await page.locator('#chat-input').fill('Explain exercise physiology');await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeDisabled();
 await expect(page.locator('#cc-form button')).toBeDisabled();await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await expect(page.locator('#chat-messages .user')).toHaveCount(1);
 await page.evaluate(()=>window.finishCoach());await expect(page.locator('#chat-send-btn')).toBeEnabled();await expect(page.locator('#chat-messages')).toContainText('Reviewed response');
});
test('voice transcript shares bounded history without exposing mutable records',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');LoadnoteCoachCompanionUI.append('I am training alone','user','Voice Companion');const snapshot=LoadnoteCoachCompanionUI.history();snapshot[0].content='Wrong topic';});
 await expect(page.locator('#chat-messages')).toContainText('I am training alone');await full(page,'What should I do?');await expect(page.locator('#chat-messages .assistant').last()).toContainText('Training alone');
});
