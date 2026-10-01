const assert=require('node:assert/strict');
const Handoff=require('../src/product/adaptive-handoff');
const Intent=require('../src/product/session-intent');
const Schedule=require('../src/product/schedule');
const Phase=require('../src/product/phase-builder');
const Meet=require('../src/product/meet-cycle');
const {phaseFixture}=require('./fixtures/phase-builder');

const captured='2026-10-01T12:00:00.000Z';
const plan=Intent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
 {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
]}],{type:'program',label:'Bench day'},captured);
const workout={id:'done-workout',date:'2026-10-01',createdAt:'2026-10-01T18:00:00.000Z',exercises:[{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
 {weight:100,reps:5,rpe:7.5},{weight:100,reps:5,rpe:8},{weight:100,reps:5,rpe:7.5}
]}],sessionIntent:{version:1,role:'heavy-exposure',goal:'Bench',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:'manual-done',revisionAt:captured}}};
const doneRecord={id:'manual-done',revisions:[{recordedAt:captured,context:{date:'2026-10-01',name:'Bench day',status:'scheduled',reason:'',blockId:null,role:'heavy-exposure',goal:'Bench',prescription:plan}}]};
const nextBeforePlan=Intent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
 {weight:102.5,reps:5,targetRpe:8},{weight:102.5,reps:5,targetRpe:8},{weight:102.5,reps:5,targetRpe:8}
]}],{type:'program',label:'Next bench'},'2026-10-01T12:01:00.000Z');
const nextAfterPlan=Intent.createPrescription([{exerciseId:'b',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
 {weight:105,reps:5,targetRpe:8},{weight:105,reps:5,targetRpe:8},{weight:105,reps:5,targetRpe:8}
]}],{type:'program',label:'Next bench'},'2026-10-01T19:00:00.000Z');
const before={recordedAt:'2026-10-01T12:01:00.000Z',context:{date:'2026-10-03',name:'Next bench',status:'scheduled',reason:'',blockId:null,role:'heavy-exposure',goal:'Bench',prescription:nextBeforePlan}};
const after={recordedAt:'2026-10-01T19:00:00.000Z',context:{...before.context,reason:'Approved accumulation phase review',prescription:nextAfterPlan}};
const nextRecord={id:'phase:p1:w2d1',revisions:[before,after]};
const updatedState={scheduledSessions:Schedule.validate([doneRecord,nextRecord]),workouts:[workout],meetCycles:[],phasePrograms:[],phaseReviews:[{
 id:'phase-review',programId:'p1',phase:'accumulation',createdAt:'2026-10-01T19:00:00.000Z',
 choices:{squat:'keep',bench:'progress',deadlift:'keep'},exerciseLifts:{b:'bench'},
 findings:{squat:{name:'Squat'},bench:{name:'Competition Bench',reason:'All matched exposures stayed within the reviewed effort margin.',completedSessions:3,expectedSessions:3,comparedSets:9,overCapSessions:0,underCapSessions:3,averageRpe:7.5},deadlift:{name:'Deadlift'}},
 changes:[{id:'phase:p1:w2d1',before,after}]
}]};

let report=Handoff.inspect(updatedState,{asOf:'2026-10-01',workoutId:'done-workout'});
assert.equal(report.status,'updated');
assert.equal(report.label,'Next workout updated');
assert.equal(report.performance.comparableRpeSets,3);
assert.equal(report.performance.averageTargetRpe,8);
assert.equal(report.performance.averageActualRpe,7.7);
assert.equal(report.changes.length,1);
assert.deepEqual(report.changes[0].before.map(x=>x.weight),[102.5,102.5,102.5]);
assert.deepEqual(report.changes[0].after.map(x=>x.weight),[105,105,105]);

const unchangedState={...updatedState,phaseReviews:[],scheduledSessions:Schedule.validate([doneRecord,{id:'phase:p1:w2d1',revisions:[before]}])};
report=Handoff.inspect(unchangedState,{asOf:'2026-10-01',workoutId:'done-workout'});
assert.equal(report.status,'unchanged');
assert.match(report.reason,/no review window is open/i);

const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let meetState=Phase.save(state,Phase.prepare(state,config,args),{confirmed:true,notes:'handoff source'},{...args,id:'handoff-source'});
const source=meetState.phasePrograms[0];
const meetDate=(()=>{const d=new Date(source.config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7*7+5);return d.toISOString().slice(0,10);})();
const proposal=Meet.prepare(meetState,source,{version:1,weeks:8,peakWeeks:2,taperWeeks:1,meetDate,eventType:'mock'},args);
meetState=Meet.save(meetState,proposal,{confirmed:true,notes:'handoff cycle'},{...args,id:'handoff-cycle'});
meetState=Meet.schedule(meetState,'handoff-cycle',{...args,now:'2026-09-24T13:00:00.000Z'});
const cycle=meetState.meetCycles[0],week1=cycle.weekly.find(w=>w.week===1);
for(const session of cycle.sessions.filter(s=>s.week===1)){
 const id='meet:'+cycle.id+':'+session.key,record=meetState.scheduledSessions.find(x=>x.id===id),revision=record.revisions.at(-1),prescription=revision.context.prescription;
 meetState.workouts.push({id:'logged-'+session.key,date:session.date,createdAt:session.date+'T20:00:00.000Z',exercises:prescription.plannedExercises.map(e=>({...e,sets:(e.sets||[]).map(s=>({weight:s.weight,reps:s.reps,duration:s.duration,rpe:s.targetRpe}))})),sessionIntent:{version:1,role:revision.context.role,goal:revision.context.goal,prescription,deviationReason:'none',deviationNotes:'',schedule:{id,revisionAt:revision.recordedAt}}});
}
const last=meetState.workouts.filter(w=>w.id.startsWith('logged-')).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
report=Handoff.inspect(meetState,{asOf:week1.endDate,workoutId:last.id});
assert.equal(report.status,'review-available');
assert.equal(report.lifecycle.nextAction.kind,'review-week');
assert.match(report.reason,/No future prescription changes until you review and approve/i);
assert(report.next);

console.log('v2.71 adaptive handoff distinguishes updated, unchanged and review-available next-workout states');