const assert=require('node:assert/strict');
const Custom=require('../src/product/custom-program');
const Schedule=require('../src/product/schedule');
const Lifecycle=require('../src/product/program-lifecycle');
const Coach=require('../src/product/coach-longitudinal');
const UI=require('../src/product/coach-longitudinal-ui');

const source={
 exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:[]}],
 customPrograms:[],scheduledSessions:[],workouts:[],phasePrograms:[],meetCycles:[],
 hypertrophyPrograms:[],sportPrograms:[],programmingProfiles:[],phaseReviews:[]
};
const rows=[
 {week:1,day:'Monday',exercise:'Competition Bench',sets:3,reps:5,weight:100,unit:'kg',rpe:7},
 {week:2,day:'Monday',exercise:'Competition Bench',sets:3,reps:5,weight:102.5,unit:'kg',rpe:8}
];
let state=Custom.save(source,Custom.build(source,{name:'Athlete Bench Plan',weeks:2,startDate:'2026-11-02',rows,unit:'kg'}),{confirmed:true,now:'2026-10-28T12:00:00.000Z',id:'phase5-custom'});
state=Custom.schedule(state,'phase5-custom',{now:'2026-10-29T12:00:00.000Z'});
for(const scheduled of Schedule.list(state.scheduledSessions)){
 state.scheduledSessions=Schedule.change(state.scheduledSessions,scheduled.id,
  {status:'skipped',reason:'Explicitly not performed'},scheduled.date+'T19:00:00.000Z');
}
const when={asOf:'2026-11-15',now:'2026-11-15T20:00:00.000Z'},before=JSON.stringify(state);
const official=Lifecycle.inspect(state,{asOf:when.asOf,draft:null,draftOpen:false});
assert.equal(official.nextAction.kind,'review-custom','The lifecycle is authoritative');
const coaching=Coach.inspect(state,when);
assert.equal(coaching.nextAction?.kind,'review-custom','Phase 5 must not silently drop a valid custom-program review');
assert.equal(coaching.nextAction?.label,official.nextAction.label);
assert.equal(coaching.readOnly,true);
const response=Coach.answer(state,'Should my next workout adapt?',when);
assert.equal(response.source,'Offline Coach · longitudinal training');
assert.match(response.text,/Review your custom program/);
assert.match(response.text,/athlete|approved|review/i);
assert.equal(JSON.stringify(state),before,'Coach cannot change athlete sessions or approvals');

const sample={
 version:1,readOnly:true,
 program:{name:'Athlete Plan',week:2,totalWeeks:2,phase:'Personal'},
 nextAction:{kind:'review-custom',label:'Review your custom program',detail:'Check exact work.'},
 nextSession:null,learning:{recorded:0,observed:0,patterns:[]},
 setup:{status:'unconfirmed'},unavailable:[],notice:'Review only.'
};
for(const kind of ['review-custom','review-hypertrophy','review-sport','review-week','review-phase','review-handoff']){
 const html=UI.markup({...sample,nextAction:{...sample.nextAction,kind}});
 assert.match(html,/data-longitudinal-review/,'Direct review routing must exist for '+kind);
 assert.match(html,/Open next review/);
}
for(const kind of ['keep-plan','start-workout','no-program']){
 const html=UI.markup({...sample,nextAction:{...sample.nextAction,kind}});
 assert.doesNotMatch(html,/data-longitudinal-review/,'Keep passive or training actions free from new review buttons: '+kind);
}
assert.equal(JSON.stringify(state),before,'Rendering and analysis are read-only');
console.log('v4.3 Phase 5 custom/sport/hypertrophy review routing, lifecycle authority and immutable history passed');
