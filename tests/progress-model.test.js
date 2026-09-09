const assert=require('assert'),P=require('../src/product/progress-model'),S=require('../src/product/workout-session');
const estimate=(w,r)=>w*(1+r/30),lift=(weight,name='Bench',trackBy='reps')=>({name,type:'strength',trackBy,sets:[trackBy==='reps'?{reps:5,weight}:{duration:30,weight}]}),workout=(id,date,exercises)=>({id,date,exercises});
const list=[workout('a','2026-01-01',[lift(100)]),workout('b','2026-01-10',[lift(110),lift(900,'Bench','duration')]),workout('c','2026-02-01',[lift(200)])];
assert.equal(P.filter(list,{query:' BENCH ',from:'2026-01-02',to:'2026-01-31'}).length,1);
assert.deepEqual(P.series(list,'bench',{metric:'load',end:'2026-01-31'},estimate).map(p=>p.value),[100,110]);
assert.equal(P.series(list,'bench',{weeks:4,metric:'load',end:'2026-01-31'},estimate).length,1);
const comparison=P.compare(list[0],list[1]);assert.equal(comparison.length,2);assert.equal(comparison[1].left.length,0);assert.equal(comparison[0].right.length,1);
const duplicate=workout('d','2026-01-12',[lift(90),lift(95)]);assert.equal(P.compare(duplicate,list[0])[0].left.length,2);
const prs=S.reconcilePRs([],list,estimate,()=> 'record');const state={workouts:list,prs};const next=S.remove(state,'c',estimate,()=> 'record');
assert.equal(next.prs[0].weight,110);assert.equal(state.prs[0].weight,200);assert.equal(next.workouts.length,2);
const manual={id:'manual',exercise:'Bench',weight:120,reps:5};const withManual={workouts:list,prs:S.reconcilePRs([manual],list,estimate,()=> 'record')};
assert.deepEqual(S.remove(withManual,'c',estimate,()=> 'record').prs,[manual]);
assert.equal(S.remove({workouts:[list[0]],prs:S.reconcilePRs([],[list[0]],estimate,()=> 'x')},'a',estimate,()=> 'x').prs.length,0);
assert.throws(()=>S.remove(state,'missing',estimate,()=> 'x'));
const Core=require('../src/core/loadnote-core'),Analytics=require('../src/training/analytics');
for(const rpe of [undefined,8,10,0,11]) {
 const dated=new Date().toISOString().slice(0,10);
 const records=[workout('rpe',dated,[{name:'Bench',sets:[{weight:80,reps:5,rpe}]}])];
 const value=P.series(records,'Bench',{},Core.estimated1RM)[0].value;
 assert.equal(value,Analytics.exerciseTrend(records,'Bench').latestEstimated1RM);
 assert.equal(value,rpe===8?98.7:93.3);
 assert.equal(P.series(records,'Bench',{metric:'load'},Core.estimated1RM)[0].value,80);
}
console.log('Progress ranges, mode-aware comparisons and deletion PR reconciliation passed');
