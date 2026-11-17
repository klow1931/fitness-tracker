async function openFirstWeek(page){const card=page.locator('details#beginner-first-week');if(await card.count()&&await card.getAttribute('open')===null)await card.locator(':scope > summary').click();}
module.exports={openFirstWeek};
