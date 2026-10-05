const {test,expect}=require('playwright/test');

async function seedProgressEvidence(page){
 await page.evaluate(()=>{
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const asOf=today(),dates=[move(asOf,-77),move(asOf,-63),move(asOf,-21),move(asOf,-7)];
  data.workouts=dates.map((date,i)=>({id:'intel-'+i,date,createdAt:date+'T20:00:00.000Z',exercises:[{name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:100+i*5,reps:5,rpe:8}]}]}));
  data.scheduledSessions=[];data.phasePrograms=[];data.meetCycles=[];data.phaseReviews=[];data.exerciseRoles=[];
  window.LoadnoteCompanionIntelligenceUI?.clearCache?.();
 });
}

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
});

test('v2.83 signed-out Companion and Voice share deterministic training evidence',async({page})=>{
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>typeof window.LoadnoteCompanionIntelligenceUI?.forContext)).toBe('function');
 await expect.poll(()=>page.evaluate(()=>typeof window.LoadnoteCoachVoiceUI?.tool)).toBe('function');
 await seedProgressEvidence(page);
 await page.locator('#coach-companion-launcher').click();
 await page.locator('#cc-input').fill('How is my training trending?');
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-messages')).toContainText('Competition Squat');
 await expect(page.locator('#cc-messages')).toContainText('descriptive training signals');
 const voice=await page.evaluate(()=>window.LoadnoteCoachVoiceUI.tool('get_live_workout_context'));
 expect(voice.ok).toBe(true);
 expect(voice.context.capabilities.trainingIntelligenceRead).toBe(true);
 expect(voice.context.intelligence.progress.strength[0].name).toBe('Competition Squat');
 expect(voice.context.intelligence.progress.strength[0].status).toBe('higher');
 expect(voice.context.intelligence.limits.join(' ')).toContain('read-only');
});

test('v2.83 secure Coach request carries bounded deterministic Companion intelligence',async({page})=>{
 let requestBody=null;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:true,account:{id:'acct_intelligence',displayName:'Athlete',providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'intel-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.route('**/api/coach',route=>{
  requestBody=route.request().postDataJSON();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({coach:{summary:'Your recent squat evidence is higher across the compared windows.',insights:[],recommendation:{action:'none',exercise:null,weightKg:null,sets:null,reps:null,targetRPE:null,reason:''},confidence:'high'}})});
 });
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await seedProgressEvidence(page);
 await page.locator('#coach-companion-launcher').click();
 // Daily training briefs are authoritative locally in v3.0. A broader question still exercises authenticated transport.
 await page.locator('#cc-input').fill('How can I build a consistent training habit?');
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-messages')).toContainText('recent squat evidence is higher');
 await expect.poll(()=>requestBody!==null).toBe(true);
 expect(requestBody.context.companion.capabilities.trainingIntelligenceRead).toBe(true);
 expect(requestBody.context.companion.intelligence.version).toBe(1);
 expect(requestBody.context.companion.intelligence.progress.strength[0].name).toBe('Competition Squat');
 expect(requestBody.context.companion.intelligence.progress.strength[0].status).toBe('higher');
 expect(requestBody.context.companion.intelligence.limits.join(' ')).toContain('athlete-approved');
});
