const {test,expect}=require('playwright/test');
const {showCoachOptions}=require('./helpers/coach-options');
async function boot(page,{configured=false,authenticated=false,loginAvailable=true}={}){
 await page.route('**/api/auth/session',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({authenticated,account:authenticated?{id:'v69_synthetic_account',displayName:'Test athlete',providers:['test']}:null,authConfigured:true,loginAvailable,expiresAt:'2030-01-01T00:00:00Z',csrf:'synthetic'})}));
 await page.route('**/api/health',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({coach:{configured,authRequired:true}})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
}
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();}
test('only a configured backend with a working sign-in route offers an account action',async({page})=>{
 let posts=0;await page.route('**/api/coach',r=>{posts++;return r.abort();});await boot(page);
 await expect(page.locator('#coach-online-status')).toContainText('not configured or reachable');await expect(page.locator('#coach-account-link')).toBeHidden();
 await page.route('**/api/health',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({coach:{configured:true}})}));
 await page.evaluate(()=>LoadnoteCoachWorkspaceUI.connection({force:true}));await expect(page.locator('#coach-account-link')).toBeVisible();
 await expect(page.locator('#coach-online-status')).toContainText('Sign in from Profile');await ask(page,'Explain RPE');await expect(page.locator('#chat-messages')).toContainText('RPE');expect(posts).toBe(0);
});
test('native and private local conversation states override an online-capable server',async({page})=>{
 await boot(page,{configured:true,authenticated:true});await expect(page.locator('#coach-online-status')).toContainText('Secure online Coach available');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(async()=>{window.Capacitor={isNativePlatform:()=>true};await LoadnoteCoachWorkspaceUI.connection();});await expect(page.locator('#coach-online-status')).toContainText('local-only');await expect(page.locator('#coach-account-link')).toBeHidden();
 await page.evaluate(async()=>{delete window.Capacitor;window.LoadnoteLocalCoachAI={snapshot:()=>({conversationConsent:true,status:'unsupported'})};await LoadnoteCoachWorkspaceUI.connection();});await expect(page.locator('#coach-online-status')).toContainText('Local conversation selected');await expect(page.locator('#coach-online-status')).toContainText('paused');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('late availability replies cannot overwrite newer offline capability state',async({page,context})=>{
 await boot(page,{configured:true,authenticated:true});await expect(page.locator('#coach-online-status')).toContainText('Secure online Coach available');
 await page.evaluate(()=>{window.v69Health=[];LoadnoteCoachClient.availability=()=>new Promise(resolve=>v69Health.push(resolve));window.v69Pending=LoadnoteCoachWorkspaceUI.connection();});
 await expect.poll(()=>page.evaluate(()=>v69Health.length)).toBe(1);await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
 await expect(page.locator('#coach-online-status')).toContainText('need a connection');await page.evaluate(async()=>{v69Health[0]({online:true});await v69Pending;});
 await expect(page.locator('#coach-online-status')).toContainText('need a connection');await expect(page.locator('#coach-account-link')).toBeHidden();
});
test('return to a past-dated lb draft preserves exact entered work and never creates history',async({page},info)=>{
 await page.setViewportSize({width:320,height:568});await boot(page);await page.evaluate(()=>document.documentElement.style.fontSize='20px');await expect(page.locator('#coach-workout-continuity')).toBeHidden();
 await page.evaluate(()=>{setUnit('lb');fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);document.getElementById('wo-date').value='2026-11-01';document.getElementById('wo-notes').value='Synthetic draft note';openFastStartLogger({compact:true});saveLoggerDraft();});
 await page.locator('.set-weight').first().fill('225');await page.locator('.set-rpe').first().fill('8');await page.locator('.set-done-check').first().check();
 const snapshot=()=>page.evaluate(()=>({data:JSON.stringify(data),date:document.getElementById('wo-date').value,notes:document.getElementById('wo-notes').value,inputs:[...document.querySelectorAll('#exercise-rows input')].map(i=>i.type==='checkbox'?i.checked:i.value),unit:currentUnit(),intent:JSON.stringify(readSessionIntentDraft())}));const before=await snapshot();
 await page.locator('#mobile-nav [data-tab="coach"]').click();await page.locator('#panel-coach .section-tab[data-sub="co-chat"]').click();await expect(page.locator('#coach-workout-continuity')).toBeVisible();
 await expect(page.locator('#coach-context-questions')).toContainText('Why this set?');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('#coach-resume-workout').click();
 await expect(page.locator('#panel-workouts')).toBeVisible();await expect(page.locator('#workout-log-card')).toBeVisible();expect(await snapshot()).toEqual(before);
 await page.screenshot({path:info.outputPath('resume-draft.png')});
});
test('cleared drafts hide the return action and both Coach views share current question choices',async({page})=>{
 await page.setViewportSize({width:390,height:664});await boot(page);await expect.poll(()=>page.locator('#coach-context-questions button').allTextContents()).toEqual(await page.evaluate(()=>LoadnoteCoachCompanionUI.suggestedQuestions()));
 await page.evaluate(()=>{fillWorkoutForm([{name:'Competition Squat',type:'strength',sets:[{weight:100,reps:3,rpe:''}]}],'',false);LoadnoteCoachCompanionUI.refresh();});await expect(page.locator('#coach-workout-continuity')).toBeVisible();
 expect(await page.locator('#chat-messages').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(300);
 await expect(page.locator('#coach-context-questions')).toContainText('Why this set?');const same=await page.evaluate(()=>{const first=document.querySelector('#coach-context-questions button');for(let i=0;i<5;i++)LoadnoteCoachCompanionUI.refresh();return first===document.querySelector('#coach-context-questions button');});expect(same).toBe(true);
 await page.evaluate(()=>{clearWorkoutForm(true);LoadnoteCoachCompanionUI.refresh();});await expect(page.locator('#coach-workout-continuity')).toBeHidden();await expect(page.locator('#coach-context-questions')).toContainText('Build a program');
});
test('research library returns to its originating conversation without losing messages or input',async({page})=>{
 await boot(page);await ask(page,'Explain training volume');await page.locator('#chat-input').fill('My unfinished question');await showCoachOptions(page);await page.locator('#coach-research-open').click();
 await page.locator('#research-return-to-coach').click();await expect(page.locator('#panel-coach')).toBeVisible();await expect(page.locator('#chat-input')).toHaveValue('My unfinished question');await expect(page.locator('#chat-messages')).toContainText('Training volume describes');
 await page.evaluate(()=>showTab('dashboard'));await page.locator('#coach-companion-launcher').click();await page.locator('#cc-input').fill('Another unfinished question');await showCoachOptions(page,{quick:true});await page.locator('#cc-research').click();await page.locator('#research-return-to-coach').click();
 await expect(page.locator('#coach-companion-panel')).toBeVisible();await expect(page.locator('#cc-input')).toHaveValue('Another unfinished question');await expect(page.locator('#cc-messages')).toContainText('Training volume describes');
});

test('a contextual shortcut sends once and keeps an unfinished typed question',async({page},info)=>{
 await boot(page);await page.locator('#chat-input').fill('My unfinished question');const encouragement=page.locator('#coach-context-questions').getByRole('button',{name:'Give me encouragement',exact:true});
 if(info.project.use.hasTouch)await encouragement.tap();else await encouragement.click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();await expect(page.locator('#chat-messages .user')).toHaveCount(1);
 await expect(page.locator('#chat-messages .user')).toContainText('Give me encouragement');await expect(page.locator('#chat-input')).toHaveValue('My unfinished question');
});

test('optional welcome choices stay on Home and do not obstruct other destinations',async({page})=>{
 await boot(page);await expect(page.locator('#onboarding-card')).toBeHidden();const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>showTab('dashboard'));await expect(page.locator('#onboarding-card')).toBeVisible();
 for(const panel of ['workouts','prs','coach','profile']){await page.evaluate(panel=>showTab(panel),panel);await expect(page.locator('#onboarding-card')).toBeHidden();}
 await page.evaluate(()=>showTab('dashboard'));await expect(page.locator('#onboarding-card')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
