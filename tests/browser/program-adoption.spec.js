const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test('saved user program can be adopted, scheduled and reviewed without rewriting its source',async({page})=>{
 await page.clock.install({time:new Date('2026-09-13T19:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
   data.programs=[{id:7,name:'My Program',days:[{day:'Bench Day',exercises:['Competition Bench 3×5']}],daysPerWeek:1,level:'intermediate',focus:'strength',generated:'2026-09-01'}];
   data.exerciseCatalog=[{id:'bench',name:'Competition Bench',aliases:[]}];
   data.workouts=[{id:'prior',date:'2026-09-01',createdAt:'2026-09-01T18:00:00.000Z',exercises:[{name:'Competition Bench',exerciseId:'bench',type:'strength',sets:[{reps:5,weight:100,rpe:8}]}]}];
   showTab('coach');showSubTab('coach','co-programs');renderProgramAdoption();document.getElementById('program-adoption-panel').open=true;
 });
 const host=page.locator('#program-adoption');await expect(host).toContainText('Adopt an existing program');
 await host.locator('#adoption-open').click();await page.locator('#adoption-start').fill('2026-09-07');await page.locator('#adoption-weeks').fill('2');
 await page.getByRole('button',{name:'Preview adopted baseline'}).click();
 await expect(page.locator('#adoption-preview')).toContainText('Loadnote-filled');
 await expect(page.locator('#adoption-preview')).toContainText('100');
 await page.locator('#adoption-confirm').check();await page.locator('#adoption-save').click();
 await expect.poll(()=>page.evaluate(()=>data.adoptedPrograms.length)).toBe(1);
 const sourceBefore=await page.evaluate(()=>JSON.stringify(data.programs[0]));
 page.once('dialog',d=>d.accept());await host.locator('[data-adoption-schedule]').click();
 await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.filter(s=>s.id.startsWith('adopted:')).length)).toBe(2);
 expect(await page.evaluate(()=>JSON.stringify(data.programs[0]))).toBe(sourceBefore);
 await page.evaluate(()=>{
   const rec=data.scheduledSessions.find(r=>r.id==='adopted:adopted-'+data.adoptedPrograms[0].id.split('adopted_').pop()+':w1d0')||data.scheduledSessions.find(r=>r.id.endsWith(':w1d0'));
   const view=LoadnoteSchedule.list([rec])[0],plan=view.prescription;
   data.workouts.push({id:'logged',date:view.date,createdAt:'2026-09-07T20:00:00.000Z',sessionIntent:{version:1,role:'mixed',goal:'Follow adopted program baseline',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:rec.id,revisionAt:view.revisionAt}},exercises:[{name:'Competition Bench',exerciseId:'bench',type:'strength',sets:[{reps:5,weight:100,rpe:9},{reps:5,weight:100,rpe:9},{reps:5,weight:100,rpe:8}]}]});
   renderProgramAdoption();
 });
 await host.locator('[data-adoption-review]').click();await expect(host.locator('[data-adopt-choice="bench"] option')).toHaveCount(2);
 await host.locator('[data-adopt-choice="bench"]').selectOption('reduce-one');await host.locator('#adopt-review-confirm').check();await host.locator('#adopt-review-save').click();
 await expect.poll(()=>page.evaluate(()=>data.adoptedPrograms[0].weeklyReviews.length)).toBe(1);
 expect(await page.evaluate(()=>{const p=data.adoptedPrograms[0],r=LoadnoteSchedule.list(data.scheduledSessions).find(x=>x.id==='adopted:'+p.id+':w2d0');return r.prescription.plannedExercises[0].sets.length;})).toBe(2);
 expect(await page.evaluate(()=>JSON.stringify(data.programs[0]))).toBe(sourceBefore);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
