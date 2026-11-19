const {showCoachOptions}=require('./helpers/coach-options');
const {test,expect}=require('playwright/test');
const paper={source:'MED',id:'12345',title:'Training volume and strength: a systematic review',pubYear:'2025',firstPublicationDate:'2025-06-01',authorString:'Research Team',abstractText:'<p>Training outcomes depend on the population and methods studied.</p>',pubTypeList:{pubType:['Systematic Review']}};
test.beforeEach(async({page})=>{
 await page.route('**/api/auth/session',r=>r.fulfill({contentType:'application/json',body:'{"authenticated":false,"authConfigured":false}'}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
});
async function settings(page){await page.locator('#coach-companion-launcher').click();await showCoachOptions(page,{quick:true});await page.locator('#cc-research').click();return page.locator('#coach-research-dialog');}
async function ask(page,text){await page.locator('#cc-input').fill(text);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
test('default asks first; only topic keywords leave the app; citations save and work offline',async({page,context})=>{
 let requests=[];await page.route('**/europepmc/webservices/rest/search**',r=>{requests.push(r.request());return r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})});});
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();await ask(page,'Explain training volume. My private email is private@example.com');expect(requests.length).toBe(0);
 await page.locator('#cc-messages .coach-research-offer button').last().click();const d=page.locator('#cc-messages .coach-research-offer').last();await expect(page.locator('#coach-research-dialog')).not.toBeVisible();await expect(d).toContainText(paper.title);expect(requests.length).toBe(1);expect(requests[0].url()).not.toContain('private');expect(requests[0].postData()).toBeNull();expect(requests[0].headers()['cookie']).toBeUndefined();expect(requests[0].headers()['referer']).toBeUndefined();await expect(d.locator('a')).toHaveAttribute('href','https://pubmed.ncbi.nlm.nih.gov/12345/');
 await d.getByRole('button',{name:'Save these references offline'}).click();await expect(d).toContainText('References saved on this device');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.reload();const again=await settings(page);await expect(again.locator('#research-saved')).toContainText('Training volume');await context.setOffline(true);await again.locator('#research-saved button').click();await expect(again.locator('#research-results')).toContainText('saved references');await again.locator('#research-search').click();await expect(again.locator('#research-results')).toContainText('You are offline');expect(requests.length).toBe(1);
 await again.locator('#research-clear').click();await expect(again.locator('#research-saved')).toContainText('No references saved');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('automatic research requires explicit choice; off and sensitive questions send nothing',async({page})=>{
 let count=0;await page.route('**/europepmc/webservices/rest/search**',r=>{count++;return r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})});});
 const d=await settings(page);await d.locator('#research-mode').selectOption('auto');expect(count).toBe(0);await d.locator('[data-review-close]').click();await page.locator('#coach-companion-launcher').click();await ask(page,'Explain training volume');await expect(page.locator('#cc-messages .coach-research-offer')).toContainText(paper.title);expect(count).toBe(1);
 await ask(page,'My injured knee hurts. Should I change training volume?');expect(count).toBe(1);await showCoachOptions(page,{quick:true});await page.locator('#cc-research').click();await d.locator('#research-mode').selectOption('off');await expect(d.locator('#research-search')).toBeDisabled();await d.locator('[data-review-close]').click();await page.locator('#coach-companion-launcher').click();await ask(page,'Explain RPE');expect(count).toBe(1);await page.reload();expect(await page.evaluate(()=>LoadnoteCoachResearch.mode())).toBe('off');
});
test('cancelled research and hostile source data cannot alter training or render executable content',async({page})=>{
 let fulfill;await page.route('**/europepmc/webservices/rest/search**',async r=>{await new Promise(resolve=>fulfill=()=>{void r.fulfill({contentType:'application/json',body:JSON.stringify({resultList:{result:[paper]}})}).catch(()=>{});resolve();});});
 const d=await settings(page),before=await page.evaluate(()=>JSON.stringify(data));await d.locator('#research-search').click();await expect(d.locator('#research-results')).toContainText('Searching Europe PMC');await d.locator('#research-mode').selectOption('off');if(fulfill)fulfill();await expect(d.locator('#research-results')).toBeEmpty();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.evaluate(()=>{LoadnoteCoachResearchUI.showResult(document.querySelector('#research-results'),LoadnoteCoachResearch.normalizeResult({resultList:{result:[{source:'MED',id:'2',title:'<img src=x onerror="window.hacked=true">Hostile title',pubYear:'2025',abstractText:'<script>window.hacked=true</script>Excerpt'}]}},'volume'));});await expect(d.locator('#research-results img')).toHaveCount(0);expect(await page.evaluate(()=>window.hacked)).toBeUndefined();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('saved sources can be explained on-device offline without sharing athlete context',async({page,context})=>{
 await page.evaluate(paper=>{window.explanationCalls=[];window.onlineCalls=0;LoadnoteCoachResearch.save(LoadnoteCoachResearch.normalizeResult({resultList:{result:[paper]}},'volume'));window.LoadnoteLocalCoachAI={snapshot:()=>({status:'ready'}),explain:async(...args)=>{explanationCalls.push(args);return 'The excerpt describes a research finding with population-specific limits.';}};window.LoadnoteCoachClient={ask:async()=>onlineCalls++};},paper);
 const before=await page.evaluate(()=>JSON.stringify(data)),d=await settings(page);await context.setOffline(true);await d.locator('#research-saved button').click();await d.getByRole('button',{name:'Explain these sources on this device'}).click();await expect(d.locator('#research-results')).toContainText('Experimental local explanation');expect(await page.evaluate(()=>explanationCalls.length)).toBe(1);const args=await page.evaluate(()=>explanationCalls[0]);expect(args[1][0].summary).toContain('Training outcomes');expect(Object.keys(args[1][0])).toEqual(['title','summary','application']);expect(await page.evaluate(()=>onlineCalls)).toBe(0);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('hosted explanation is explicit, requires no weights and displays freshly returned sources without athlete context',async({page})=>{
 const calls=[],downloads=[];
 await page.route('**/api/auth/session',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({authenticated:true,account:{id:'synthetic-reader'},csrf:'synthetic-csrf'})}));
 await page.evaluate(()=>LoadnoteAccountSession.refresh());
 await page.route('**/api/health',r=>r.fulfill({contentType:'application/json',body:'{"coach":{"configured":true,"researchConfigured":true}}'}));
 page.on('request',r=>{if(/huggingface|safetensors|gguf|model.*\.bin/i.test(r.url()))downloads.push(r.url());});
 const fresh={...paper,id:'54321',title:'Fresh synthetic strength review'};
 const evidence=await page.evaluate(p=>LoadnoteCoachResearch.normalizeResult({resultList:{result:[p]}},'volume'),fresh);
 await page.route('**/api/coach',r=>{calls.push(JSON.parse(r.request().postData()));return r.fulfill({contentType:'application/json',body:JSON.stringify({coach:{summary:'The abstract does not establish a personal dose.',insights:[],recommendation:{action:'none'},research:evidence}})});});
 const before=await page.evaluate(()=>JSON.stringify(data)),d=await settings(page);
 await page.evaluate(p=>LoadnoteCoachResearchUI.showResult(document.querySelector('#research-results'),LoadnoteCoachResearch.normalizeResult({resultList:{result:[p]}},'volume')),paper);
 expect(calls).toHaveLength(0);
 await d.getByRole('button',{name:'Explain online · no download'}).click();
 await expect(d.locator('#research-results')).toContainText('Hosted Coach explanation · no model downloaded');
 await expect(d.locator('#research-results')).toContainText(fresh.title);await expect(d.locator('#research-results a')).toHaveAttribute('href','https://pubmed.ncbi.nlm.nih.gov/54321/');
 expect(calls).toHaveLength(1);expect(calls[0].researchTopic).toBe('volume');expect(calls[0].history).toEqual([]);expect(Object.keys(calls[0].context).sort()).toEqual(['unit','version']);expect(calls[0]).not.toHaveProperty('sources');
 expect(downloads).toEqual([]);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('offline hosted explanation sends nothing; late or failed responses preserve source cards',async({page,context})=>{
 const d=await settings(page),before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(p=>{window.hostedCalls=0;window.LoadnoteCoachClient={availability:async()=>({online:true,researchConfigured:true}),ask:async()=>{hostedCalls++;throw Error('Hosted service unavailable');}};LoadnoteCoachResearchUI.showResult(document.querySelector('#research-results'),LoadnoteCoachResearch.normalizeResult({resultList:{result:[p]}},'volume'));},paper);
 await context.setOffline(true);await d.getByRole('button',{name:'Explain online · no download'}).click();await expect(d.locator('#research-results')).toContainText('Online research is off or unavailable');expect(await page.evaluate(()=>hostedCalls)).toBe(0);
 await context.setOffline(false);await page.evaluate(()=>{LoadnoteCoachClient.availability=async()=>({online:false});});await d.getByRole('button',{name:'Explain online · no download'}).click();await expect(d.locator('#research-results')).toContainText('Online explanations are unavailable here');expect(await page.evaluate(()=>hostedCalls)).toBe(0);
 await page.evaluate(()=>{LoadnoteCoachClient.availability=async()=>({online:true,researchConfigured:true});});await d.getByRole('button',{name:'Explain online · no download'}).click();await expect(d.locator('#research-results')).toContainText('Hosted service unavailable');await expect(d.locator('#research-results')).toContainText(paper.title);
 await page.evaluate(()=>{LoadnoteCoachClient.ask=()=>new Promise(resolve=>window.resolveHosted=resolve);});await d.getByRole('button',{name:'Explain online · no download'}).click();await expect.poll(()=>page.evaluate(()=>typeof resolveHosted)).toBe('function');await d.locator('#research-mode').selectOption('off');
 await page.evaluate(()=>resolveHosted({summary:'Late reply must be ignored',research:{topic:'volume',items:[{}]}}));await expect(d.locator('#research-results')).toBeEmpty();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
