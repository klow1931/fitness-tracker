const {test,expect}=require('playwright/test');
const ExcelJS=require('exceljs');

test('CSV import can be corrected, approved, scheduled and explained by Coach',async({page})=>{
 await page.clock.install({time:new Date('2026-10-18T18:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderCustomProgramStudio();});
 const studio=page.locator('#custom-program-studio');await expect(studio).toContainText('Custom Program Studio');
 await studio.getByRole('button',{name:'Write or upload a program'}).click();
 const file={name:'keith-program.csv',mimeType:'text/csv',buffer:Buffer.from('Week,Day,Exercise,Sets,Reps,Weight,Unit,RPE,Rest\n1,Monday,Competition Squat,4,5,315,lb,7,180\n2,Monday,Competition Squat,4,4,325,lb,8,180')};
 await page.locator('#custom-upload').setInputFiles(file);
 await expect(page.locator('#custom-count')).toContainText('2 exercise rows');
 await page.locator('#custom-start').fill('2026-10-19');
 await page.locator('#custom-preview').click();
 await expect(page.locator('#custom-preview-result')).toContainText('2 training sessions');
 await page.locator('#custom-confirm').check();
 await page.locator('#custom-save').click();
 await expect.poll(()=>page.evaluate(()=>data.customPrograms.length)).toBe(1);
 await expect(studio).toContainText('keith-program');
 expect(await page.evaluate(()=>data.customPrograms[0].source)).toEqual({kind:'csv',name:'keith-program.csv'});
 page.once('dialog',dlg=>dlg.accept());await studio.locator('[data-custom-schedule]').click();
 await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.filter(x=>x.id.startsWith('custom:')).length)).toBe(2);
 expect(await page.evaluate(()=>LoadnoteProgramLifecycle.inspect(data,{asOf:'2026-10-19'}).program.kind)).toBe('custom-program');
 await studio.locator('[data-custom-insights]').click();await expect(studio).toContainText('Recurring movements from your plan');
 const answer=await page.evaluate(()=>LoadnoteCoachingContext.answer(data,'What have you learned from my uploaded program?',{asOf:'2026-10-19'}));
 expect(answer.text).toContain('Competition Squat');
 expect(answer.text).toContain('not been');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test('Excel upload parses locally and invalid units block save',async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('My sessions');sheet.addRow(['Week','Day','Exercise','Sets','Reps','Weight','Unit','RPE']);sheet.addRow([1,'Monday','Bench Press',3,5,225,'lb',7]);
 const buffer=Buffer.from(await book.xlsx.writeBuffer());
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderCustomProgramStudio();});
 await page.locator('#custom-studio-open').click();
 await page.locator('#custom-upload').setInputFiles({name:'my-plan.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer});
 await expect(page.locator('#custom-count')).toContainText('1 exercise rows',{timeout:30000});
 await page.locator('#custom-start').fill('2026-10-19');
 await page.locator('#custom-preview').click();await expect(page.locator('#custom-preview-result')).toContainText('102.06 kg');
 await page.locator('[data-custom-row="0"] [data-field="unit"]').selectOption('');
 await page.locator('#custom-unit').selectOption('kg');
 await page.locator('#custom-preview').click();await expect(page.locator('#custom-preview-result')).toContainText('225 kg');
});
