const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Core=require('../src/core/loadnote-core'),G=require('../src/product/goal-progress');
function runner(kind){
 const values={'pr-exercise':'Synthetic press','pr-weight':'280','pr-reps':'1','pr-date':'2026-11-15','goal-type':'workout-count','goal-session-target':'4','goal-notes':'Synthetic','goal-deadline':''};
 const controls={};for(const [id,value] of Object.entries(values))controls[id]={value,disabled:false,closest:()=>root};
 const root={querySelectorAll:()=>Object.values(controls)};const toasts=[],writes=[];let resolve,reject;
 const old={id:'old',exercise:'Synthetic press',weight:100,reps:5,date:'2026-11-01',estimated1RM:116.7,source:'workout',sourceWorkoutId:'w',baselinePR:{id:'baseline'}};
 const state={prs:kind==='pr'?[old]:[],goals:[],workouts:[{id:'w'}]};
 const c={data:state,document:{getElementById:id=>id==='pr-entry'?root:(controls[id]||(controls[id]={value:'',disabled:false}))},window:{LoadnoteCore:Core},LoadnoteGoalProgress:G,today:()=> '2026-11-15',toStorage:x=>x*0.45359237,estimated1RM:Core.estimated1RM,saveTimer:0,clearTimeout:()=>{},invalidateViews:()=>{},renderPRs:()=>{},renderCoach:()=>{},showToast:(...args)=>toasts.push(args),alert:message=>{throw Error(message);},persistNow:next=>{writes.push(JSON.parse(JSON.stringify(next)));return new Promise((yes,no)=>{resolve=yes;reject=no;});}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('src/product/saved-records-ui.js','utf8'),c);
 return {c,controls,toasts,writes,resolve:()=>resolve(),reject:()=>reject(Error('quota'))};
}
(async()=>{for(const kind of ['pr','goal']){
 const r=runner(kind),save=()=>r.c[kind==='pr'?'savePR':'saveGoal'](),before=JSON.stringify(r.c.data),field=kind==='pr'?'pr-weight':'goal-session-target';
 const pending=save();await Promise.resolve();assert.equal(r.writes.length,1);assert.equal(JSON.stringify(r.c.data),before);assert.equal(r.toasts.length,0);assert.equal(r.controls[field].disabled,true);await save();assert.equal(r.writes.length,1);
 r.reject();await pending;assert.equal(JSON.stringify(r.c.data),before);assert.ok(r.toasts.at(-1)[0].includes('could not be saved'));assert.equal(r.controls[field].value,kind==='pr'?'280':'4');assert.equal(r.controls[field].disabled,false);
 const retry=save();await Promise.resolve();assert.equal(r.writes.length,2);assert.equal(JSON.stringify(r.c.data),before);r.resolve();await retry;assert.equal(r.controls[field].value,'');assert.equal(r.controls[field].disabled,false);
 if(kind==='pr'){assert.equal(r.c.data.prs[0].weight,280*0.45359237);assert.equal(r.c.data.prs[0].source,undefined);assert.equal(JSON.parse(before).prs[0].source,'workout');}
 else {assert.equal(r.c.data.goals.length,1);assert.equal(r.c.data.goals[0].targetSessions,4);}
 assert.equal(JSON.stringify(r.c.data.workouts),JSON.stringify(JSON.parse(before).workouts));
}
const parallel=runner('pr'),a=parallel.c.savePR(),b=parallel.c.saveGoal();await Promise.resolve();assert.equal(parallel.writes.length,1);parallel.resolve();await a;await Promise.resolve();assert.equal(parallel.writes.length,2);assert.equal(parallel.writes[1].prs[0].weight,280*0.45359237);parallel.resolve();await b;assert.equal(parallel.c.data.goals.length,1);assert.equal(parallel.c.data.prs[0].weight,280*0.45359237);
console.log('PR/goal saves await durable commits, reject duplicates, retain failed inputs and preserve history');})().catch(e=>{console.error(e);process.exitCode=1;});
