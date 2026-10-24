const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v4.0 saved workout explains verified evidence without silently changing a future plan',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  data.unit='kg';updateUnitToggle();
  const plan=LoadnoteIntent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
  ]}],{type:'manual',label:'Bench day'},'2026-10-01T12:00:00.000Z');
  const workout={id:'v4-verified',date:'2026-10-03',createdAt:'2026-10-03T18:00:00.000Z',exercises:[
   {exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:7.5},{weight:100,reps:5,rpe:8}]}
  ],sessionIntent:{prescription:plan}};
  data.workouts=[workout];data.scheduledSessions=[];
  showTab('workouts');document.getElementById('workout-recap').hidden=false;
  LoadnoteTrainingContinuityUI.renderRecap(workout,data,{asOf:'2026-10-03'});
 });
 const card=page.locator('.adaptive-handoff');
 await expect(card).toContainText('No later workout scheduled');
 await expect(card.locator('[data-adaptive-learning]')).toContainText('What this workout tells Loadnote');
 await expect(card.locator('[data-adaptive-learning]')).toContainText('2/2 planned strength sets matched');
 await expect(card.locator('[data-adaptive-learning]')).toContainText('not proof that the next load should increase');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v4.0 changed effort and unverified chronology never imply automatic dose changes',async({page})=>{
 await page.evaluate(()=>{
  const plan=LoadnoteIntent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
   {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
  ]}],{type:'manual'},'2026-10-01T12:00:00.000Z');
  const workout={id:'v4-effort',date:'2026-10-03',createdAt:'2026-10-03T18:00:00.000Z',exercises:[
   {exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:9},{weight:100,reps:5,rpe:null}]}
  ],sessionIntent:{prescription:plan}};
  data.workouts=[workout];data.scheduledSessions=[];
  showTab('workouts');document.getElementById('workout-recap').hidden=false;
  LoadnoteTrainingContinuityUI.renderRecap(workout,data,{asOf:'2026-10-03'});
 });
 let signal=page.locator('[data-adaptive-learning]');
 await expect(signal).toContainText('1 matched set lacked comparable RPE');
 await expect(signal).toContainText('Effort remains unknown');
 await page.evaluate(()=>{
  const row=data.workouts[0];
  row.sessionIntent.prescription.capturedAt='2026-10-04T12:00:00.000Z';
  LoadnoteTrainingContinuityUI.renderRecap(row,data,{asOf:'2026-10-03'});
 });
 signal=page.locator('[data-adaptive-learning]');
 await expect(signal).toContainText('cannot be verified');
 await expect(signal).not.toContainText('1 matched set lacked comparable RPE');
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
});
