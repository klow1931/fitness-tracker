async function showCoachOptions(page,{quick=false}={}){
 const menu=page.locator(quick?'#cc-options':'#coach-options');
 if(await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
}
module.exports={showCoachOptions};
