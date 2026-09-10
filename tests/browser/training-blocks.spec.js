const {test,expect}=require('playwright/test'),fs=require('fs');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));await page.locator('#training-blocks summary').click();});
async function create(page,name='Return to Powerlifting'){
 await page.getByRole('button',{name:'Create block',exact:true}).click();await page.locator('#block-name').fill(name);await page.locator('#block-start').fill('2026-06-10');await page.locator('#block-end').fill('2026-09-08');await page.locator('#block-type').selectOption('return-reentry');await page.locator('#block-strategy').selectOption('conservative');await page.locator('#block-intent').selectOption('return-ramp');
}
test('Block CRUD preserves historical workouts, draft and lb benchmarks offline',async({page,context})=>{
 await page.evaluate(()=>{data.unit='lb';data.workouts=[{id:'historic',date:'2026-06-15',exercises:[]}];});
 await page.locator('.ex-name').fill('Unfinished bench');
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);
 await create(page);await page.locator('#block-dialog details summary').click();await page.locator('#block-add-max').click();await page.locator('#block-maxes [data-exercise]').fill('Squat');await page.locator('#block-maxes [data-load]').fill('365');await page.locator('#block-add-known').click();await page.locator('#block-known [data-exercise]').fill('Squat');await page.locator('#block-known [data-load]').fill('446');
 await page.getByRole('button',{name:'Save block',exact:true}).click();await expect(page.locator('#block-dialog')).not.toBeVisible();
 const stored=await page.evaluate(()=>LoadnoteBlocks.list(data.trainingBlocks)[0]);expect(stored.trainingMaxes[0].kg).toBeCloseTo(365/2.2046226218,5);expect(stored.known1RMs[0].kg).toBeCloseTo(446/2.2046226218,5);
 await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.ex-name')).toHaveValue('Unfinished bench');await page.locator('#training-blocks summary').click();
 await page.locator('[data-block-edit]').click();await expect(page.locator('#block-maxes [data-load]')).toHaveValue('365');await page.locator('#block-name').fill('Return revised');await page.getByRole('button',{name:'Save block',exact:true}).click();
 await page.locator('[data-block-view]').click();await expect(page.locator('#block-analysis')).toContainText('1 workouts');await expect(page.locator('#block-analysis')).toContainText('Not enough data');
 expect(await page.evaluate(()=>LoadnoteBlocks.at(data.trainingBlocks,'2026-06-15',{retrospective:true}).name)).toBe('Return revised');
 page.once('dialog',d=>d.accept());await page.locator('[data-block-delete]').click();await expect(page.locator('[data-block-edit]')).toHaveCount(0);expect(await page.evaluate(()=>data.workouts[0].id)).toBe('historic');await expect(page.locator('.ex-name')).toHaveValue('Unfinished bench');
});
test('Backup roundtrip, overlap validation, old imports and failed writes',async({page})=>{
 await create(page);await page.getByRole('button',{name:'Save block',exact:true}).click();await expect(page.locator('#block-dialog')).not.toBeVisible();
 const records=await page.evaluate(()=>JSON.stringify(data.trainingBlocks));
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const backup=fs.readFileSync(await (await downloaded).path(),'utf8');expect(JSON.stringify(JSON.parse(backup).trainingBlocks)).toBe(records);
 await create(page,'Conflicting');await page.getByRole('button',{name:'Save block',exact:true}).click();await expect(page.locator('#block-error')).toContainText('overlap');await page.locator('#block-cancel').click();
 await page.locator('[data-block-edit]').click();await page.locator('#block-name').fill('Failed edit');await page.evaluate(()=>{window.originalPersist=persistNow;persistNow=async()=>{throw Error('Storage full');};});await page.getByRole('button',{name:'Save block',exact:true}).click();await expect(page.locator('#block-error')).toContainText('Storage full');expect(await page.evaluate(()=>JSON.stringify(data.trainingBlocks))).toBe(records);await page.locator('#block-cancel').click();await page.evaluate(()=>{persistNow=window.originalPersist;});
 page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});await expect(page.locator('#toast-host')).toContainText('Import successful');expect(await page.evaluate(()=>JSON.stringify(data.trainingBlocks))).toBe(records);
 const malformed=JSON.parse(backup);malformed.trainingBlocks.push(malformed.trainingBlocks[0]);page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malformed))});await expect.poll(()=>page.evaluate(()=>JSON.stringify(data.trainingBlocks))).toBe(records);
 page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:10,workouts:[],nutrition:[]}))});await expect.poll(()=>page.evaluate(()=>data.trainingBlocks.length)).toBe(0);
});
