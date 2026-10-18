const {test,expect}=require('playwright/test');
test('sync cannot replace training when the local snapshot changed before the apply',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.ex-name')).toHaveCount(1);
 const result=await page.evaluate(async()=>{
  const before=JSON.stringify(data),incoming=structuredClone(data),expected='this-is-not-the-current-local-fingerprint';
  let rejected=false;
  try{await window.LoadnoteStateStore.applySyncedState(incoming,{label:'Phase 6 test',expectedProjectFingerprint:expected});}
  catch(e){rejected=/Local training changed before/.test(e.message);}
  return {rejected,unchanged:JSON.stringify(data)===before};
 });
 expect(result).toEqual({rejected:true,unchanged:true});
});
test('late workout entry during a slow local sync save is recovered rather than replaced',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.ex-name')).toHaveCount(1);
 const result=await page.evaluate(async()=>{
  const expected=window.LoadnoteSyncCoordinator.projectFingerprint(data);
  const incoming=structuredClone(data),beforeWorkouts=data.workouts.length;
  const original=persistNow;
  let saves=0,failed=false;
  // Inject a new local log while asynchronous IndexedDB is completing.
  persistNow=async state=>{
   saves++;
   if(saves===1)data.workouts.push({id:'during-sync',date:'2026-10-18',createdAt:'2026-10-18T16:00:00.000Z',exercises:[]});
  };
  try{
   await LoadnoteStateStore.applySyncedState(incoming,{expectedProjectFingerprint:expected,label:'Phase 6 slow-save test'});
  }catch(error){failed=/Local training or the signed-in account changed while sync was saving/.test(error.message);}
  finally{persistNow=original;}
  return {failed,saves,retained:data.workouts.length===beforeWorkouts+1&&data.workouts.at(-1).id==='during-sync'};
 });
 expect(result).toEqual({failed:true,saves:2,retained:true});
});
