const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const Session=require('../src/product/workout-session');
function fixture(fail=false){
 const draft={version:2,date:'2026-09-08',notes:'',unit:'kg',program:{programId:7,dayIndex:0},edit:null,rows:[{type:'strength',trackBy:'reps',name:'Bench',note:'',sets:[{reps:'5',weight:'100',rpe:'8'}]}]};
 const nodes=new Map();let finish;
 const context={LoadnoteSession:Session,window:{LoadnoteCore:{createId:()=> 'new-id'}},data:{workouts:[],prs:[]},saveTimer:0,
 captureLoggerDraft:()=>JSON.parse(JSON.stringify(draft)),estimated1RM:(w,r)=>w*(1+r/30),
 document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,{close(){}});return nodes.get(id);}},
 clearTimeout:()=>{},persistNow:async()=>{if(fail)throw Error('quota');await new Promise(resolve=>{finish=resolve;});},
 clearWorkoutForm:()=>{context.cleared=true;},saveLoggerDraft:()=>{},renderWorkoutHistory:()=>{},updateBackupBanner:()=>{},showToast:()=>{},showSubTab:()=>{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/product/session-ui.js'),'utf8'),context);
 context.testDraft=draft;vm.runInContext("reviewedSession={draft:JSON.stringify(testDraft),workout:LoadnoteSession.fromDraft(testDraft,'new-id'),program:testDraft.program,edit:null}",context);
 return {context,finish:()=>finish()};
}
(async()=>{
 const {context:c,finish}=fixture();const first=c.commitReviewedWorkout();await c.commitReviewedWorkout();
 assert.equal(c.data.workouts.length,0,'Do not expose unsaved state');finish();await first;
 assert.equal(c.data.workouts.length,1);assert.equal(c.data.workouts[0].programId,7);assert(c.cleared);assert.equal(c.data.prs.length,1);
 const {context:bad}=fixture(true);await bad.commitReviewedWorkout();assert.equal(bad.data.workouts.length,0);assert(!bad.cleared);assert.equal(bad.window.loggerSaving,false);
 console.log('Review commit durability and duplicate-save tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
