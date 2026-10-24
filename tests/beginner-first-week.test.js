const assert=require('node:assert/strict');
const First=require('../src/product/beginner-first-week');
const Today=require('../src/product/today-training');
const Continuity=require('../src/product/training-continuity');
const Intent=require('../src/product/session-intent');
const Schedule=require('../src/product/schedule');
const asOf='2026-10-23';
const logged=(id,date)=>({id,date,exercises:[{name:'Goblet Squat',type:'strength',sets:[{weight:15,reps:8,rpe:null}]}]});
const plan=Intent.createPrescription([{name:'Goblet Squat',type:'strength',sets:[{weight:null,reps:8,targetRpe:null}]}],{type:'manual',label:'Starter'});
const session=(date,id='starter')=>Schedule.create([],{name:'Starter full body',date,role:'mixed',prescription:plan},{id,now:'2026-10-20T12:00:00.000Z'});
const state={workouts:[],scheduledSessions:[]};
const before=JSON.stringify(state);
function observe(s,day=asOf,draft=null,entry='log'){
 const todayReport=Today.inspect(s,{day,draft}),continuity=Continuity.inspect(s,{asOf:day});
 return First.inspect(s,{asOf:day,entry,todayReport,continuity});
}
assert.equal(observe(state).count,0);
assert.equal(observe(state).action,'log');
assert.equal(observe(state,asOf,null,'program'),null);
assert.equal(observe(state,asOf,null,null),null);
assert.deepEqual(state,JSON.parse(before));
const saved={...state,workouts:[logged('one','2026-10-21')]};
let r=observe(saved);
assert.equal(r.count,1);assert.equal(r.action,'repeat');assert.equal(r.label,'Repeat last workout');assert.equal(r.repeatSourceId,'one');
assert.match(r.detail,/No training day is assumed/);
assert.equal(observe({...state,workouts:[logged('same-day',asOf)]}).action,'history','Do not prompt an extra same-day session');
assert.equal(r.firstDate,'2026-10-21');
assert.equal(observe({...state,workouts:[logged('a','2026-10-21'),logged('b','2026-10-22')]}).repeatSourceId,'b',
 'Repeat button should use latest recorded workout regardless of array order');
assert.equal(observe({...state,workouts:[logged('older','2026-10-21'),logged('newer','2026-10-22')]}).repeatSourceId,'newer');
const pastUnrepeatable={...state,workouts:[{...logged('sport','2026-10-22'),
 exercises:[{type:'practice',name:'Practice',sets:[{reps:3}]}]}]};
assert.equal(observe(pastUnrepeatable).action,'log','Practice-only records must not pass through the strength repeat workflow');
const anonymous={...state,workouts:[{...logged('id','2026-10-22'),id:null}]};
assert.equal(observe(anonymous).action,'log','Never guess an unidentified history source');
assert.equal(observe({...state,workouts:[logged('past','2026-10-22'),logged('future','2026-12-30')]}).repeatSourceId,'past',
 'A future workout is never selected for an as-of repeat');

assert.equal(observe({...state,workouts:[logged('older','2026-10-22'),logged('most-recent',asOf)]}).action,'history');
assert.equal(observe(saved,asOf,{rows:[{name:'Goblet Squat',sets:[{reps:'8',weight:'15'}]}]}).action,'resume',
 'An unfinished draft outranks advice to log again');
assert.equal(observe(saved,'2026-10-28'),null,'Guide expires after the first real training week');
assert.equal(observe({...state,workouts:[logged('a','2026-10-21'),logged('b','2026-10-22'),logged('c',asOf)]}),null);
const future={...state,workouts:[logged('future','2026-11-08')]};
assert.equal(observe(future).count,0,'Future workout is not completed historical evidence');
const unmeasured={...state,workouts:[{id:'bad',date:asOf,exercises:[{name:'Goblet Squat',sets:[{weight:40,reps:null}]}]}]};
assert.equal(observe(unmeasured).count,0,'Planned loads alone are not completed training');
let scheduled={...state,scheduledSessions:session('2026-10-25')};
r=observe(scheduled);
assert.equal(r.action,'calendar');assert.match(r.detail,/2026-10-25/);
assert.match(r.detail,/plan, not a completed session/);
scheduled={...state,scheduledSessions:session(asOf)};
r=observe(scheduled);assert.equal(r.action,'today');assert.match(r.detail,/Review its targets/);
const draft={rows:[{name:'Goblet Squat',sets:[{weight:'20',reps:'8'}]}],sessionIntent:{}};
r=observe(scheduled,asOf,draft);assert.equal(r.action,'resume','Unlinked draft wins over scheduled Today session');
const tomorrow={...state,scheduledSessions:session('2026-10-22')};
r=observe(tomorrow);
assert.equal(r.action,'calendar');assert.match(r.detail,/does not assume you missed/);
assert.equal(observe({...state,workouts:[logged('x','2026-10-22')]},asOf,null,'help').count,1);
assert.equal(JSON.stringify(state),before,'First-week advice cannot mutate stored history');
assert.equal(JSON.stringify(scheduled.scheduledSessions),JSON.stringify(session(asOf)));
assert.throws(()=>First.inspect(state,{asOf:'2026-02-30'}),/valid local/);
console.log('v3.94 first-week guide uses actual logs, true schedule and draft state; expires safely without writes');
