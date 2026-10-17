const assert=require('assert');
const S=require('../src/product/workout-session');
const estimate=(w,r)=>w*(1+r/30),id=()=> 'pr-id';
const original={id:'uuid',date:'2026-09-07',notes:'before',programId:'prog',programDayIndex:0,programWeek:3,exercises:[{name:'Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8}]}]};
const workout={id:'different',date:'2026-09-06',notes:'corrected',exercises:[{name:'Bench',type:'strength',sets:[{weight:80,reps:5,rpe:7}]}]};
const state={workouts:[original],prs:[]};
const updated=S.apply(state,workout,{id:'uuid',original},null,estimate,id);
assert.equal(updated.workouts.length,1);assert.equal(updated.workouts[0].id,'uuid');assert.equal(updated.workouts[0].programWeek,3);assert.equal(updated.workouts[0].programDayIndex,0);assert.equal(original.notes,'before');
assert.equal(updated.prs[0].weight,80);assert.equal(updated.prs[0].sourceWorkoutId,'uuid');
assert.throws(()=>S.apply(updated,workout,{id:'uuid',original},null,estimate,id),/changed/);
assert.throws(()=>S.apply({workouts:[],prs:[]},workout,{id:'uuid',original},null,estimate,id),/deleted/);
const identityOnly={...original,exercises:original.exercises.map(e=>({...e,exerciseId:'exercise-bench'}))};assert.doesNotThrow(()=>S.apply({workouts:[identityOnly],prs:[]},workout,{id:'uuid',original},null,estimate,id));
const baseline={id:9,exercise:'Bench',weight:70,reps:5,date:'2020-01-01'};
let p=S.reconcilePRs([baseline],[original],estimate,id);assert.equal(p[0].weight,100);assert.equal(p[0].baselinePR.weight,70);
p=S.reconcilePRs(p,[],estimate,id);assert.equal(p[0].weight,70,'Restore independent benchmark');
assert.equal(S.reconcilePRs(updated.prs,[],estimate,id).length,0,'Remove managed PR without supporting workout');
const d=S.fromDraft({date:'2026-09-08',notes:' hi ',unit:'lb',rows:[{name:'Bench',type:'strength',sets:[{reps:'5',weight:'220.46',rpe:'8'}]},{name:'Plank',type:'strength',trackBy:'duration',sets:[{duration:'30',weight:'',rpe:''}]},{name:'Bike',type:'cardio',duration:'20',distance:'5',distanceUnit:'mi'}]},'new');
assert.equal(d.exercises[0].sets[0].weight,100);assert.equal(d.exercises[1].sets[0].weight,0);assert.equal(d.exercises[1].sets[0].duration,30);assert.equal(d.exercises[2].distanceUnit,'mi');
assert.equal(S.previous([original],' bench ','2026-09-08',null).exercise.name,'Bench');
assert.equal(S.previous([original],'Bench','2026-09-06',null),null);
assert.equal(S.previous([original],'Bench','2026-09-08','uuid'),null);
assert.equal(S.previous([original],'Bench','2026-09-08',null,'strength','duration'),null);
console.log('Session edits, provenance, comparisons, and unit tests passed');

const named=(id,date,exerciseId,name,weight)=>({id,date,exercises:[{exerciseId,name,type:'strength',trackBy:'reps',sets:[{weight,reps:5,rpe:8}]}]});
const history=[
 named('other-newer','2026-10-05','other','Bench Press',150),
 named('actual-older','2026-09-27','bench','Bench Press',100),
 named('future','2026-11-01','bench','Bench Press',500),
 named('legacy','2026-09-22',null,'Bench Press',95)
];
let prior=S.previous(history,'Bench Press','2026-10-06',null,'strength','reps','bench');
assert.equal(prior.exercise.sets[0].weight,100,'A newer different exercise ID must not supersede the correct identity');
prior=S.previous(history,'Bench Press','2026-11-03',null,'strength','reps','bench');
assert.equal(prior.exercise.sets[0].weight,500,'Known identity can use a future workout only once its date has passed');
prior=S.previous(history,'Bench Press','2026-09-25',null,'strength','reps','bench');
assert.equal(prior.exercise.sets[0].weight,95,'Name-only legacy rows are a compatibility fallback');
prior=S.previous(history,'Competition Bench','2026-10-06',null,'strength','reps','bench');
assert.equal(prior.exercise.name,'Bench Press','Renamed exercise retains exact stable ID');
assert.equal(S.previous(history,'Bench Press','2026-10-06','actual-older','strength','reps','bench').exercise.sets[0].weight,95,'Editing excludes the edited workout');
assert.equal(S.previous(history,'Bench Press','2026-09-20',null,'strength','reps','bench'),null);
assert.equal(S.findPerformance(history,'Bench Press',()=>true,null,{asOf:'2026-10-06'}),null,'Multiple IDs under one label cannot be guessed');
const shuffled=[named('old','2026-01-01','bench','Bench Press',10),named('later','2026-04-01','bench','Bench Press',20),named('middle','2026-03-01','bench','Bench Press',15)];
assert.equal(S.findPerformance(shuffled,'Bench Press',()=>true,'bench',{asOf:'2026-03-15'}).exercise.sets[0].weight,15,'Unsorted imported records must be ordered by date');
assert.deepEqual(S.catalogIdentity([{id:'b',name:'Competition Bench',aliases:['Bench Press']}],' bench press '),{exerciseId:'b',ambiguous:false});
assert.deepEqual(S.catalogIdentity([{id:'b',name:'Bench Press'},{id:'b2',name:'Special Bench',aliases:['Bench Press']}],'Bench Press'),{exerciseId:null,ambiguous:true});
assert.equal(S.findPerformance([named('other','2026-09-01','other','Bench Press',222)],'Bench Press',()=>true,'bench'),null,'Never borrow an explicitly different exercise');
console.log('v3.34 previous-performance identity, catalog ambiguity, future cutoff, rename, legacy fallback, edit exclusion and imports passed');
