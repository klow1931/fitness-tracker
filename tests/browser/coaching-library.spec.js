const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
});
async function ask(page,q){await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
test('Companion shares referenced Westside knowledge with full Coach without altering training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();await ask(page,'Explain Louie Simmons book of methods');const message=page.locator('#cc-messages .assistant').last();await expect(message).toContainText('Westside');await message.getByText('Sources and coverage',{exact:true}).click();await expect(message.getByRole('link',{name:'Westside Barbell Book of Methods',exact:true})).toBeVisible();
 await ask(page,'Tell me more');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Westside');await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});await expect(page.locator('#chat-messages')).toContainText('Book of Methods');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('Reference explorer searches, explains source coverage, and makes download opt-in',async({page})=>{
 let downloads=0;await page.route('**/esm.run/**',r=>{downloads++;return r.abort();});await page.evaluate(()=>LoadnoteCoachingLibraryUI.open());const dialog=page.locator('#coaching-library-dialog');await expect(dialog).toBeVisible();await dialog.locator('#knowledge-search').fill('dynamic effort');await expect(dialog.locator('#knowledge-results')).toContainText('speed intent');await dialog.getByText('Sources & coverage',{exact:true}).click();await expect(dialog).toContainText('fifth edition');await expect(dialog).toContainText('full textbook not imported');await dialog.getByText('Local AI · experimental',{exact:true}).click();await dialog.locator('#local-ai-enable').click();await expect(dialog.locator('#local-ai-status')).toContainText('Confirm the optional model download');expect(downloads).toBe(0);
 await dialog.locator('[data-review-close]').click();await expect(dialog).toHaveCount(0);
});
test('opted-in local explanations retain canonical guidance and medical questions bypass the model',async({page})=>{
 await page.evaluate(()=>{window.modelRequests=0;window.LoadnoteLocalCoachAI=LoadnoteLocalCoachAI.create({gpu:()=>({requestAdapter:async()=>({})}),loadRuntime:async()=>({prebuiltAppConfig:{model_list:[{model_id:'Test-Instruct',vram_required_MB:500}]},CreateMLCEngine:async()=>({unload:async()=>{},chat:{completions:{create:async request=>{modelRequests++;const q=JSON.parse(request.messages[1].content).question;return {choices:[{message:{content:JSON.stringify({text:/injury/.test(q)?'I cannot decide that; ask a qualified professional.':'Speed intent serves a different goal from heavy strength work.'})}}]};}}}})})});LoadnoteCoachingLibraryUI.open();});
 const dialog=page.locator('#coaching-library-dialog');await dialog.getByText('Local AI · experimental',{exact:true}).click();await dialog.locator('#local-ai-consent').check();await dialog.locator('#local-ai-enable').click();await expect(dialog.locator('#local-ai-status')).toContainText('ready');await dialog.locator('[data-review-close]').click();
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();await ask(page,'Explain dynamic effort');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Local AI explanation (experimental');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Reviewed guidance:');expect(await page.evaluate(()=>modelRequests)).toBe(3);
 await ask(page,'My Achilles hurts with pain');await expect(page.locator('#cc-messages .assistant').last()).toContainText('cannot');expect(await page.evaluate(()=>modelRequests)).toBe(3);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});

test('local model inspection exposes compatible choices without downloading weights or changing training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{
  window.v332Inspections=0;window.v332Downloads=0;window.v332Selection=null;
  const ai=window.LoadnoteLocalCoachAI;
  ai.listModels=async()=>{window.v332Inspections++;return [{id:'Small-Instruct',estimatedGpuMB:560},{id:'Medium-Instruct',estimatedGpuMB:1190}];};
  ai.enable=async o=>{window.v332Downloads++;window.v332Selection=o.modelId;return {...ai.snapshot(),status:'ready',model:o.modelId,memoryMB:1190};};
  LoadnoteCoachingLibraryUI.open({localAI:true});
 });
 const d=page.locator('#coaching-library-dialog');
 await expect(d.locator('#local-ai-model')).toBeDisabled();
 await expect(d.locator('#local-ai-model-note')).toContainText('No model list inspected');
 await d.locator('#local-ai-check').click();
 await expect(d.locator('#local-ai-model')).toBeEnabled();
 await expect(d.locator('#local-ai-model option')).toHaveCount(3);
 await expect(d.locator('#local-ai-model-note')).toContainText('2 compatible instruction model');
 expect(await page.evaluate(()=>window.v332Downloads)).toBe(0);
 await d.locator('#local-ai-model').selectOption('Medium-Instruct');
 await d.locator('#local-ai-consent').check();
 await d.locator('#local-ai-enable').click();
 expect(await page.evaluate(()=>window.v332Selection)).toBe('Medium-Instruct');
 expect(await page.evaluate(()=>window.v332Downloads)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
