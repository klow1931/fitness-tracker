const assert=require('node:assert/strict');
const Custom=require('../src/product/custom-program');
const Coach=require('../src/product/custom-program-coach');
const Conversation=require('../src/product/coach-conversation');
const Profile=require('../src/product/programming-profile');

const rows=[
 {week:1,day:'Monday',exercise:'Competition Bench',sets:3,reps:5,weight:100,unit:'kg',rpe:7},
 {week:1,day:'Thursday',exercise:'Chest Supported Row',sets:3,reps:10,weight:'',unit:'kg',rpe:''},
 {week:2,day:'Monday',exercise:'Competition Bench',sets:3,reps:4,weight:105,unit:'kg',rpe:8}
];
const base={exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:[]},{id:'row',name:'Chest Supported Row',aliases:[]}],customPrograms:[],scheduledSessions:[],workouts:[],programmingProfiles:[]};
base.programmingProfiles=Profile.save([],{goal:'strength',experience:'intermediate',consistency:'consistent',availableDays:[0,2],sessionMinutes:75,equipment:['barbell','rack','bench','plates'],avoidedExerciseIds:['row'],preferredExerciseIds:[],notes:'',priorities:''},{now:'2026-10-18T12:00:00.000Z',id:'setup'});
const reviewed=Custom.build(base,{name:'My Bench Block',weeks:2,startDate:'2026-11-02',rows,unit:'kg'});
let state=Custom.save(base,reviewed,{confirmed:true,now:'2026-10-19T12:00:00.000Z',id:'bench-plan'});
const beforeSchedule=JSON.stringify(state);
const pre=Coach.inspect(state,'bench-plan',{asOf:'2026-10-20'});
assert.equal(pre.scheduled,false);
assert.deepEqual(pre.outsideAvailability,['Thursday']);
assert.deepEqual(pre.excludedMovements.map(x=>x.name),['Chest Supported Row']);
assert.equal(pre.missingLoad,1);
assert.equal(pre.missingRpe,1);
assert.deepEqual(pre.weekly.map(w=>w.strengthSets),[6,3]);
assert.match(Coach.explain(pre),/outside|Availability mismatch/);
assert.equal(JSON.stringify(state),beforeSchedule,'Offline check must never change saved data');

state=Custom.schedule(state,'bench-plan',{now:'2026-10-20T12:00:00.000Z'});
assert.equal(Coach.inspect(state,'bench-plan',{asOf:'2026-10-19'}).scheduled,false,'Future scheduling cannot enter a past review');
const checked=Coach.answer(state,'Review my uploaded program',{asOf:'2026-11-04'});
assert.equal(checked.intent.topic,'custom-program');
assert.equal(checked.readOnly,true);
assert.equal(checked.actions[0].kind,'custom-programs');
assert.match(checked.text,/My Bench Block/);
assert.match(checked.text,/linked|Linked/);
assert.equal(Conversation.answer(state,'Does my custom program fit my available days?',{asOf:'2026-11-04'}).source,'Offline Coach · custom program check');
assert.equal(Coach.answer(state,'Draft a 3 day strength program',{asOf:'2026-11-04'}),null,'General programming requests belong to the existing draft builder');
const first=state.scheduledSessions[0],lateLog={id:'late-log',date:'2026-11-02',createdAt:'2026-11-06T12:00:00.000Z',sessionIntent:{schedule:{id:first.id,revisionAt:first.revisions.at(-1).recordedAt},prescription:first.revisions.at(-1).context.prescription},exercises:[]};
assert.equal(Coach.inspect({...state,workouts:[lateLog]},'bench-plan',{asOf:'2026-11-04'}).execution.completed,0,'Workouts recorded after the review date must be excluded');

const changed=Custom.build(state,{name:'My Adjusted Bench Block',weeks:2,startDate:'2026-11-02',rows:rows.map((r,i)=>i===2?{...r,sets:2}:r),unit:'kg'});
const withPrivate=Custom.save(state,changed,{confirmed:true,now:'2026-10-21T12:00:00.000Z',id:'private-edit',parentId:'bench-plan',reason:{kind:'recovery',detail:'Private personal recovery detail',coachVisible:false}});
const privateReport=Coach.inspect(withPrivate,'private-edit',{asOf:'2026-10-22'});
assert.equal(privateReport.sharedReasons.length,0);
assert.equal(privateReport.privateReasonCount,1);
assert.doesNotMatch(JSON.stringify(privateReport),/Private personal recovery detail|recovery/i);
const privateReply=Coach.answer(withPrivate,'What have you learned from my program edits in My Adjusted Bench Block?',{asOf:'2026-10-22'});
assert.match(privateReply.text,/private reasons/);
assert.doesNotMatch(JSON.stringify(privateReply),/Private personal recovery detail/);
assert(!Coach.select(withPrivate,{asOf:'2026-10-20',id:'private-edit'}).record,'Future edits cannot appear in historical coaching');
const withShared=Custom.save(state,changed,{confirmed:true,now:'2026-10-22T12:00:00.000Z',id:'shared-edit',parentId:'bench-plan',reason:{kind:'preference',detail:'More time for back training',coachVisible:true}});
const shared=Coach.inspect(withShared,'shared-edit',{asOf:'2026-10-23'});
assert.equal(shared.sharedReasons.length,1);
assert.match(Coach.explain(shared,'edits'),/More time for back training/);
assert.equal(Coach.questionKind('Review my custom program'),'review');
assert.equal(Coach.questionKind('What have you learned from my program edits?'),'edits');
assert.equal(Coach.questionKind('I have shoulder pain during my uploaded program'),'review');
assert.match(Conversation.answer(withShared,'I have shoulder pain during my uploaded program',{asOf:'2026-10-23'}).source,/capability limit|support/i,'Health requests retain the safety route');
assert.equal(Coach.select({...state,customPrograms:[]},{asOf:'2026-11-04'}).record,null);
assert.match(Coach.answer({...state,customPrograms:[]},'Review my uploaded program',{asOf:'2026-11-04'}).text,/no reviewed custom program/);
assert.equal(JSON.stringify(withShared.customPrograms[0].entries),JSON.stringify(state.customPrograms[0].entries),'Reviewed original stays immutable');
console.log('v3.67 offline program checks, profile constraints, private consent, coaching routing and immutability passed');
