const assert=require('node:assert/strict');
const Lifecycle=require('../src/product/program-lifecycle');
const Phase=require('../src/product/phase-builder');
const Meet=require('../src/product/meet-cycle');
const CycleReview=require('../src/product/cycle-review');
const PhaseReview=require('../src/product/phase-review');
const Result=require('../src/product/mock-meet');
const Transition=require('../src/product/transition-baseline');
const Goals=require('../src/product/athlete-goals');
const Schedule=require('../src/product/schedule');
const {phaseFixture}=require('./fixtures/phase-builder');

function completedWorkout(state,id,workoutId){
 const rec=state.scheduledSessions.find(x=>x.id===id),rev=rec.revisions.at(-1),p=rev.context.prescription;
 return {id:workoutId,date:rev.context.date,createdAt:rev.context.date+'T20:00:00.000Z',exercises:p.plannedExercises.map(e=>({...e,sets:(e.sets||[]).map(s=>({...s,rpe:s.targetRpe||8}))})),sessionIntent:{schedule:{id,revisionAt:rev.recordedAt},prescription:p,timing:'planned-before-training'}};
}
function completeThrough(state,prefix,through){
 for(const row of Schedule.list(state.scheduledSessions).filter(x=>x.id.startsWith(prefix)&&x.date<=through)){
  if(!(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===row.id))state.workouts.push(completedWorkout(state,row.id,'done-'+row.id));
 }
}
function skipAll(state,prefix,now){
 for(const row of Schedule.list(state.scheduledSessions).filter(x=>x.id.startsWith(prefix)&&x.status==='scheduled')){
  state.scheduledSessions=Schedule.change(state.scheduledSessions,row.id,{status:'skipped',reason:'Lifecycle test resolution'},now);
 }
}

const fixture=phaseFixture(),base=fixture.state,config=fixture.config;
base.athleteGoals=Goals.upsert([],{name:'SBD goal',sport:'Powerlifting',eventDate:null,targets:[{lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}]},{now:'2026-09-23T09:00:00.000Z'});
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let phaseState=Phase.save(base,Phase.prepare(base,config,args),{confirmed:true,notes:'Lifecycle source'},{...args,id:'life-phase'});
phaseState=Phase.schedule(phaseState,'life-phase',{...args,now:'2026-09-24T13:00:00.000Z'});
const phaseProgram=phaseState.phasePrograms[0],firstSession=phaseProgram.sessions[0];
let report=Lifecycle.inspect(phaseState,{asOf:firstSession.date});
assert.equal(report.program.id,'life-phase');
assert.equal(report.program.kind,'phase-program');
assert.equal(report.nextAction.kind,'start-workout');
assert.equal(report.nextAction.scheduleId,'phase:life-phase:'+firstSession.key);
assert.equal(report.progress.week,1);

const firstPhaseWeeks=phaseProgram.config.phases[0].weeks;
const firstPhaseEnd=new Date(phaseProgram.config.startDate+'T12:00:00Z');firstPhaseEnd.setUTCDate(firstPhaseEnd.getUTCDate()+firstPhaseWeeks*7-1);
const phaseEnd=firstPhaseEnd.toISOString().slice(0,10),nextDay=new Date(phaseEnd+'T12:00:00Z');nextDay.setUTCDate(nextDay.getUTCDate()+1);
const phaseReviewDay=nextDay.toISOString().slice(0,10);
completeThrough(phaseState,'phase:life-phase:',phaseEnd);
report=Lifecycle.inspect(phaseState,{asOf:phaseReviewDay});
assert.equal(report.nextAction.kind,'review-phase','phase review must surface before the first next-phase workout');
assert.equal(report.nextAction.phase,'accumulation');

const unresolved=structuredClone(phaseState),one=unresolved.workouts.findIndex(w=>w.sessionIntent?.schedule?.id?.startsWith('phase:life-phase:'));
unresolved.workouts.splice(one,1);
report=Lifecycle.inspect(unresolved,{asOf:phaseReviewDay});
assert.equal(report.nextAction.kind,'resolve-overdue','unresolved prior work must block review routing');

const finalDate=Transition.endDate(phaseProgram);
completeThrough(phaseState,'phase:life-phase:',finalDate);
const keep={squat:'keep',bench:'keep',deadlift:'keep'},recovery={sleep:'unknown',fatigue:'unknown',soreness:'unknown',discomfort:'unknown',notes:''};
for(const phase of ['accumulation','strength']){
 const reviewed=PhaseReview.analyze(phaseState,{programId:'life-phase',phase,asOf:finalDate,recovery,now:finalDate+'T21:0'+(phase==='accumulation'?'0':'2')+':00.000Z'});
 phaseState=PhaseReview.apply(phaseState,reviewed,keep,{confirmed:true,asOf:finalDate,now:finalDate+'T21:0'+(phase==='accumulation'?'1':'3')+':00.000Z'});
}
report=Lifecycle.inspect(phaseState,{asOf:finalDate});
assert.equal(report.nextAction.kind,'save-transition');

const meetBase=phaseFixture(),meetStateBase=meetBase.state,meetConfig=meetBase.config;
meetStateBase.athleteGoals=Goals.upsert([],{name:'Meet goal',sport:'Powerlifting',eventDate:null,targets:[{lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}]},{now:'2026-09-23T09:00:00.000Z'});
let meetState=Phase.save(meetStateBase,Phase.prepare(meetStateBase,meetConfig,args),{confirmed:true,notes:'Meet setup'},{...args,id:'meet-setup'});
const proposal=Meet.prepare(meetState,meetState.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args);
meetState=Meet.save(meetState,proposal,{confirmed:true,notes:'Full cycle reviewed'},{...args,id:'life-meet'});
meetState=Meet.schedule(meetState,'life-meet',{...args,now:'2026-09-24T13:00:00.000Z'});
const cycle=meetState.meetCycles[0],week1=cycle.weekly[0],week2=cycle.weekly[1];
completeThrough(meetState,'meet:life-meet:',week1.endDate);
report=Lifecycle.inspect(meetState,{asOf:week2.startDate});
assert.equal(report.nextAction.kind,'review-week','weekly review must precede untouched next-week training');
assert.equal(report.nextAction.week,1);

skipAll(meetState,'meet:life-meet:','2026-12-19T10:00:00.000Z');
report=Lifecycle.inspect(meetState,{asOf:'2026-12-19'});
assert.equal(report.nextAction.kind,'review-week','older unreviewed weeks stay ahead of event closure');
for(let week=1;week<cycle.config.weeks;week++){
 const minute=String(week).padStart(2,'0'),now='2026-12-19T10:'+minute+':00.000Z';
 const reviewed=CycleReview.analyze(meetState,{cycleId:'life-meet',week,asOf:'2026-12-19',now});
 meetState=CycleReview.apply(meetState,reviewed,keep,{confirmed:true,notes:'Lifecycle closure',asOf:'2026-12-19',now,id:'closed-'+week});
}
report=Lifecycle.inspect(meetState,{asOf:'2026-12-19'});
assert.equal(report.nextAction.kind,'record-event');

const pass={status:'passed',weightKg:null},made=kg=>({status:'made',weightKg:kg});
meetState=Result.save(meetState,'life-meet',{date:'2026-12-19',attempts:{squat:[made(200),pass,pass],bench:[made(140),pass,pass],deadlift:[made(250),pass,pass]},notes:'Lifecycle mock meet'},{confirmed:true,now:'2026-12-19T12:00:00.000Z'});
report=Lifecycle.inspect(meetState,{asOf:'2026-12-19'});
assert.equal(report.nextAction.kind,'save-transition');

const transition=Transition.preview(meetState,{programId:'life-meet',asOf:'2026-12-19',now:'2026-12-19T13:00:00.000Z'});
assert.equal(transition.version,2);
assert.equal(transition.programType,'meet-cycle');
assert.equal(transition.event.resultRecorded,true);
assert.equal(transition.event.totalKg,590);
assert.equal(transition.decisionHistory.weeklyReviews.length,11);
meetState=Transition.save(meetState,transition,{confirmed:true,notes:'Cycle closed'},{now:'2026-12-19T13:01:00.000Z',id:'life-meet-transition'});
report=Lifecycle.inspect(meetState,{asOf:'2026-12-19'});
assert.equal(report.nextAction.kind,'review-next-program',JSON.stringify(report.nextAction.handoff));
assert.equal(report.nextAction.handoff.ready,true);
assert.equal(report.transition.programType,'meet-cycle');

const draftReport=Lifecycle.inspect(meetState,{asOf:'2026-12-19',draft:{sessionIntent:{schedule:{id:'meet:life-meet:w1d1'}}},draftOpen:true});
assert.equal(draftReport.nextAction.kind,'resume-workout');

console.log('v2.61 active program lifecycle routes training, reviews, event closure, transition and next-block handoff deterministically');
