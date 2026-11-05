const {test,expect}=require('playwright/test');
const {showCoachOptions}=require('./helpers/coach-options');
const paper={source:'MED',id:'12345',title:'Resistance training volume review',pubYear:'2025',firstPublicationDate:'2025-06-01',authorString:'Synthetic Research Team',abstractText:'A synthetic research excerpt for interface validation.',pubTypeList:{pubType:['Systematic Review']}};
test.beforeEach(async({page})=>{
 await page.route('**/api/auth/session',r=>r.fulfill({contentType:'application/json',body:'{"authenticated":false,"authConfigured":false}'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');expect(errors).toEqual([]);await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function ask(page,q){await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
async function fits(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
test('explicit research stays in chat, shares sources, saves immediately and sends only topic keywords',async({page})=>{
 const requests=[];await page.route('**/europepmc/webservices/rest/search**',r=>{requests.push(r.request());return r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})});});
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();await ask(page,'What does research say about training volume? My private email is private@example.com');
 const offer=page.locator('#cc-messages .coach-research-offer').last();
 expect(requests).toHaveLength(0);await offer.getByRole('button',{name:'Research: Training volume',exact:true}).click();
 await expect(page.locator('#coach-research-dialog')).not.toBeVisible();await expect(page.locator('#coach-companion-panel')).toBeVisible();
 await expect(offer).toContainText(paper.title);await expect(page.locator('#chat-messages')).toContainText(paper.title);
 expect(requests).toHaveLength(1);expect(requests[0].url()).not.toContain('private');expect(requests[0].headers()['cookie']).toBeUndefined();expect(requests[0].headers()['referer']).toBeUndefined();
 const sources=offer.locator('.coach-research-sources');await expect(sources).not.toHaveAttribute('open','');await sources.locator(':scope > summary').click();await expect(offer.getByRole('link',{name:paper.title})).toBeVisible();await expect(offer).toContainText('2025-06-01');
 await offer.getByRole('button',{name:'Save these references offline'}).click();await expect(offer.getByRole('button',{name:'Saved on this device'})).toBeDisabled();
 await showCoachOptions(page,{quick:true});await page.locator('#cc-research').click();await expect(page.locator('#research-saved')).toContainText('Training volume');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('manual source library refreshes at save without reopening',async({page})=>{
 await page.route('**/europepmc/webservices/rest/search**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})}));
 await page.evaluate(()=>LoadnoteCoachResearchUI.open({topicId:'volume'}));const d=page.locator('#coach-research-dialog');
 await expect(d.locator('#research-saved')).toContainText('No references saved yet');await d.locator('#research-search').click();
 await d.getByRole('button',{name:'Save these references offline'}).click();await expect(d.locator('#research-saved')).toContainText('Training volume');await expect(d.locator('#research-saved')).not.toContainText('No references saved yet');
});
test('inline errors allow retry; clearing chat cancels pending research without late results',async({page})=>{
 let count=0,release;await page.route('**/europepmc/webservices/rest/search**',async r=>{count++;if(count===1)return r.fulfill({status:503,body:'unavailable'});await new Promise(resolve=>release=async()=>{await r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})}).catch(()=>{});resolve();});});
 await page.locator('#coach-companion-launcher').click();await ask(page,'Explain training volume');
 const offer=page.locator('#cc-messages .coach-research-offer').last(),search=offer.getByRole('button',{name:'Research: Training volume',exact:true});
 await search.click();await expect(offer.locator('[role=status]')).not.toHaveText('Searching Europe PMC…');await expect(search).toBeEnabled();await search.click();await expect(offer).toContainText('Searching Europe PMC…');
 await page.evaluate(()=>LoadnoteCoachCompanionUI.clearConversation());if(release)await release();
 await expect(page.locator('#cc-messages')).not.toContainText(paper.title);await expect(page.locator('#chat-messages')).not.toContainText(paper.title);expect(count).toBe(2);
});
test('compact options preserve a usable conversation and hide experimental downloads by default',async({page})=>{
 await page.setViewportSize({width:390,height:664});await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-options')).not.toHaveAttribute('open','');await expect(page.locator('#cc-online-conversation')).not.toBeVisible();await expect(page.locator('.cc-voice-start')).toBeVisible();
 expect(await page.locator('#cc-messages').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(140);
 await showCoachOptions(page,{quick:true});await page.locator('#cc-proactive select').selectOption('quiet');expect(await page.evaluate(()=>LoadnoteProactiveCoachUI.state().mode)).toBe('quiet');await page.locator('#cc-proactive .cc-cues-pause').click();expect(await page.evaluate(()=>LoadnoteProactiveCoachUI.state().paused)).toBe(true);await expect(page.locator('#cc-research')).toBeVisible();await expect(page.locator('#cc-local-ai')).not.toBeVisible();
 await page.locator('#cc-options > summary').click();await ask(page,'Explain training volume');await expect(page.locator('#cc-messages')).toContainText('Training volume describes how much work');await fits(page);
 await page.locator('.cc-close').click();await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});await expect(page.locator('#coach-options')).not.toHaveAttribute('open','');
 await page.setViewportSize({width:320,height:568});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await showCoachOptions(page);await page.locator('#coach-research-open').scrollIntoViewIfNeeded();await expect(page.locator('#coach-research-open')).toBeVisible();await fits(page);
});
test('all RPE choices fit without swiping and Coach access cannot float over the logger',async({page})=>{
 await page.setViewportSize({width:320,height:568});
 await page.evaluate(()=>{data.gymMode=true;data.gymModeUserSet=true;showTab('workouts');showSubTab('workouts','wo-log');fillWorkoutForm([{name:'Competition Bench Press',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);});
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}));
 const chips=page.locator('.quick-set-entry:visible .quick-rpe-chips');
 expect(await chips.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await expect(chips.locator('button')).toHaveCount(9);
 for(const chip of await chips.locator('button').all()){const r=await chip.boundingBox();expect(r.width).toBeGreaterThanOrEqual(43);expect(r.height).toBeGreaterThanOrEqual(44);}
 await expect.poll(()=>page.locator('#coach-companion-launcher').evaluate(el=>getComputedStyle(el).position)).toBe('static');
 await chips.locator('[data-quick-rpe="9.5"]').click();await expect(page.locator('.set-rpe').first()).toHaveValue('9.5');await expect(page.locator('.set-done-check').first()).toBeChecked();
 const field=page.locator('.set-rpe').nth(1);await field.scrollIntoViewIfNeeded();expect(await field.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
 await page.locator('#coach-companion-launcher').click();await expect(page.locator('#cc-context')).toContainText('Workout active');await ask(page,'How much rest is left?');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduled:data.scheduledSessions}))).toBe(before);await fits(page);
});

test('quick completion survives a focused numeric field and degraded checkpoint, including keyboard activation',async({page})=>{
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''},{weight:100,reps:5,rpe:''}]}],'',false);});
 await page.locator('.set-reps').first().focus();
 await expect.poll(()=>page.evaluate(()=>LoadnoteDraftSaveHealth)).toBe('saved');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='loadnote-workout-draft-v1')throw Error('Primary checkpoint unavailable');return write.call(this,key,value);};});
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('.set-done-check').first()).toBeChecked();await expect(page.locator('.set-rpe').first()).toHaveValue('8');
 await expect(page.locator('[data-cockpit-save-status]')).toContainText('saved in recovery copy');
 const finish=page.locator('.quick-set-entry:visible [data-quick-rpe="10"]');await finish.focus();await finish.press('Space');
 await expect(page.locator('.set-done-check').nth(1)).toBeChecked();await expect(page.locator('.set-rpe').nth(1)).toHaveValue('10');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('loadnote-workout-draft-v1-recovery')));
 expect(saved.rows[0].sets.map(s=>s.rpe)).toEqual(['8','10']);expect(saved.rows[0].sets.every(s=>s.done)).toBe(true);
});
