// Save-path integration: run the real save function against a small form fixture.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8');
const saveFunction = source.slice(source.indexOf('    async function saveWorkout()'), source.indexOf('    function deleteWorkout('));
function fixture(fail = false) {
  const fields = {'.set-weight':{value:'100'}, '.set-reps':{value:'5'}, '.set-rpe':{value:'8'}};
  const set = {querySelector:s=>fields[s]};
  const row = {dataset:{type:'strength',trackBy:'reps'},querySelector:s=>s==='.ex-name'?{value:'Bench Press'}:{value:''},querySelectorAll:()=>[set]};
  const ctx = { window:{}, data:{workouts:[],prs:[]}, pendingProgramSession:{programId:7,dayIndex:0,dayName:'Day 1'}, saveTimer:0,
    document:{getElementById:id=>({value:id==='wo-date'?'2026-09-07':''}),querySelectorAll:()=>[row]},
    validateWorkoutForm:()=>true, showToast:()=>{}, toStorage:x=>x, estimated1RM:(w,r)=>w*(1+r/30), saveData:()=>{},clearTimeout:()=>{},
    persistNow:async()=>{if(fail)throw Error('quota');}, clearWorkoutForm:()=>{ctx.cleared=true;},saveLoggerDraft:()=>{},
    readLoggerDraft:()=>({program:{programId:7}}),renderWorkoutHistory:()=>{},updateBackupBanner:()=>{} };
  vm.createContext(ctx);vm.runInContext(saveFunction,ctx);return ctx;
}
(async()=>{
 const ok=fixture();await Promise.all([ok.saveWorkout(),ok.saveWorkout()]);
 assert.equal(ok.data.workouts.length,1);assert.equal(ok.data.workouts[0].exercises[0].sets[0].weight,100);
 assert.equal(ok.data.workouts[0].programId,7);assert(ok.cleared);assert.equal(ok.data.prs.length,1);
 const bad=fixture(true);await bad.saveWorkout();assert.equal(bad.data.workouts.length,0);assert.equal(bad.data.prs.length,0);
 assert(!bad.cleared);assert.equal(bad.pendingProgramSession.programId,7);assert.equal(bad.window.loggerSaving,false);
 console.log('logger save integration tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
