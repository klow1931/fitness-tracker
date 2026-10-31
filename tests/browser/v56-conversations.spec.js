const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-31T16:00:00Z')});await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(state=>{data=normalizeDataShape({...data,...state});window.remoteCalls=[];LoadnoteCoachClient.ensureSignedIn=async()=>true;LoadnoteCoachClient.ask=async r=>{remoteCalls.push(r);return {summary:'A broader conversation response',recommendation:{action:'none'}};};showTab('coach');showSubTab('coach','co-chat');},phaseFixture().state);
});
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
test('paraphrases and two grounded questions preserve evidence and training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));let r=await ask(page,'My bench gains have dried up');await expect(r).toContainText(/evidence|history/);
 r=await ask(page,'How do I score the difficulty of a set?');await expect(r).toContainText('Missing RPE is unknown');
 r=await ask(page,'Explain RPE and how long should I rest between sets?');await expect(r).toContainText('RPE means');await expect(r).toContainText('IUSCA');
 expect(await page.evaluate(()=>remoteCalls.length)).toBe(0);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('everyday reflection follows options, accepts corrections and forgets on clear',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-talk-through').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();
 await ask(page,'I am deciding whether to join a class');await ask(page,'I want an enjoyable routine');await ask(page,'I could try a class or keep lifting alone');await ask(page,'I could visit one class');await ask(page,'My schedule might conflict');
 let r=await ask(page,'Give me a recap');await expect(r).toContainText('I want an enjoyable routine');await expect(r).toContainText('not verified facts or saved preferences');
 await ask(page,'Actually my schedule is flexible');r=await ask(page,'Give me a recap');await expect(r).toContainText('schedule is flexible');await expect(r).not.toContainText('schedule might conflict');
 await ask(page,'Just listen');r=await ask(page,'I had a rough shift');await expect(r).toContainText('rough shift');
 expect(await page.evaluate(()=>remoteCalls.length)).toBe(0);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();r=await ask(page,'Give me a recap');await expect(r).not.toContainText('enjoyable routine');
});
test('linked concepts retain sources and safety takes priority over reflection',async({page})=>{
 let r=await ask(page,'How do volume and fatigue relate?');await expect(r).toContainText('cannot establish recovery');await r.getByText('Sources and coverage',{exact:true}).click();await expect(r.locator('a').first()).toBeVisible();
 r=await ask(page,'What sources support that?');await expect(r).toContainText('curated training principles');
 await ask(page,'Let’s talk it through');r=await ask(page,'I feel dizzy but just listen');await expect(r).toContainText('cannot diagnose');expect(await page.evaluate(()=>remoteCalls.length)).toBe(0);
});
test('online conversation excludes offline chat, local evidence and training context',async({page})=>{
 await ask(page,'I had a long day at work');await ask(page,'My private offline phrase');
 await page.evaluate(()=>LoadnoteCoachClient.availability=async()=>({online:true}));await page.locator('#coach-online-conversation').click();await expect(page.locator('#coach-online-conversation')).toHaveAttribute('aria-pressed','true');
 let r=await ask(page,'Can we talk about my day?');await expect(r).toContainText('broader conversation response');
 let calls=await page.evaluate(()=>remoteCalls);expect(calls).toHaveLength(1);expect(Object.keys(calls[0].context).sort()).toEqual(['unit','version']);expect(calls[0].history).toEqual([]);
 await ask(page,'What does RPE mean?');expect(await page.evaluate(()=>remoteCalls.length)).toBe(1);
 await ask(page,'What is a constellation?');calls=await page.evaluate(()=>remoteCalls);expect(calls).toHaveLength(2);expect(calls[1].history).toHaveLength(2);expect(JSON.stringify(calls[1])).not.toContain('private offline phrase');expect(JSON.stringify(calls[1])).not.toContain('RPE means');
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await expect(page.locator('#coach-online-conversation')).toHaveAttribute('aria-pressed','false');
});
test('missing server and native beta keep broader online chat off',async({page})=>{
 await page.evaluate(()=>LoadnoteCoachClient.availability=async()=>({online:false}));await page.locator('#coach-online-conversation').click();await expect(page.locator('#chat-messages')).toContainText('unavailable here');await expect(page.locator('#coach-online-conversation')).toHaveAttribute('aria-pressed','false');
 await page.evaluate(()=>{LoadnoteCoachClient.availability=async()=>({online:true});window.Capacitor={isNativePlatform:()=>true};});await page.locator('#coach-online-conversation').click();await expect(page.locator('#chat-messages')).toContainText('unavailable in this native beta');expect(await page.evaluate(()=>remoteCalls.length)).toBe(0);
});
test('clearing during an availability check cannot enable online chat later',async({page})=>{
 await page.evaluate(()=>{LoadnoteCoachClient.availability=()=>new Promise(resolve=>window.resolveMode=resolve);void LoadnoteCoachCompanionUI.toggleOnlineConversation();});
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await page.evaluate(()=>resolveMode({online:true}));await expect(page.locator('#coach-online-conversation')).toHaveAttribute('aria-pressed','false');
});
test('narrow large-text reflection stays usable and renders user text literally',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await page.locator('#coach-talk-through').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();
 const r=await ask(page,'<img src=x onerror="window.injected=true">');await expect(r).toContainText('<img');expect(await page.evaluate(()=>window.injected)).toBeUndefined();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.evaluate(()=>{document.activeElement?.blur();showTab('dashboard');});await page.locator('#coach-companion-launcher').click();await expect(page.locator('#cc-online-conversation')).toBeVisible();expect(await page.locator('#coach-companion-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
test('bundled understanding and reflection survive an actual offline reload',async({browser,baseURL})=>{
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 try{await page.goto(baseURL);await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await expect(page.locator('#coach-companion-launcher')).toBeVisible();
  const replies=await page.evaluate(()=>['My bench gains have dried up','Let’s talk it through','How do volume and fatigue relate?'].map(q=>LoadnoteCoachConversation.answer({},q,{asOf:'2026-10-31'})?.source));expect(replies).toEqual(['Offline Coach · training trends','Shared coaching · talk it through','Shared coaching · knowledge connections']);
 }finally{await context.close();}
});
