const assert=require('node:assert/strict');
const Intelligence=require('../src/product/companion-intelligence');
const Readiness=require('../src/product/decision-readiness');

const asOf='2026-09-28';
const workout=(id,date,weight,rpe=8)=>({id,date,createdAt:date+'T20:00:00.000Z',exercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight,reps:5,rpe}]}]});
const roles=Readiness.replace([],[{exerciseId:'s',role:'competition',competitionLift:'squat'}],{now:'2026-07-01T00:00:00.000Z',createId:()=> 'role-s'});
const beforePlan={version:1,capturedAt:'2026-09-14T10:00:00.000Z',source:{type:'program'},plannedExercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:110,reps:5,targetRpe:8},{weight:110,reps:5,targetRpe:8}]}]};
const afterPlan={version:1,capturedAt:'2026-09-15T10:00:00.000Z',source:{type:'program'},plannedExercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:112.5,reps:5,targetRpe:8},{weight:112.5,reps:5,targetRpe:8}]}]};
const phaseReview={id:'review-1',programId:'p1',phase:'accumulation',createdAt:'2026-09-15T10:00:00.000Z',choices:{squat:'progress',bench:'keep',deadlift:'keep'},exerciseLifts:{s:'squat'},findings:{squat:{name:'Competition Squat',reason:'Matched exposures stayed inside the reviewed effort margin.',completedSessions:3,expectedSessions:3,comparedSets:6,overCapSessions:0,underCapSessions:3,averageRpe:7.5},bench:{name:'Bench'},deadlift:{name:'Deadlift'}},changes:[{id:'phase:p1:w10d1',before:{recordedAt:'2026-09-14T10:00:00.000Z',context:{prescription:beforePlan}},after:{recordedAt:'2026-09-15T10:00:00.000Z',context:{prescription:afterPlan}}}]};
const state={exerciseCatalog:[{id:'s',name:'Competition Squat'}],exerciseRoles:roles,scheduledSessions:[],phasePrograms:[],meetCycles:[],phaseReviews:[phaseReview],workouts:[workout('b1','2026-07-10',100),workout('b2','2026-07-24',102.5),workout('r1','2026-09-07',110),workout('r2','2026-09-21',112.5)]};
const draft={version:3,date:asOf,unit:'kg',rows:[{type:'strength',name:'Competition Squat',trackBy:'reps',sets:[{weight:'112.5',reps:'5',rpe:'9',done:true},{weight:'112.5',reps:'5',rpe:'',done:false}]}],sessionIntent:{version:1,role:'heavy-exposure',goal:'Execute the reviewed squat exposure',deviationReason:'none',deviationNotes:'',prescription:afterPlan,schedule:{id:'phase:p1:w10d1',revisionAt:'2026-09-15T10:00:00.000Z'}}};
const liveWorkout={active:true,date:asOf,name:'Squat day',currentExercise:{name:'Competition Squat',index:0,count:1,set:{index:1,count:2}},exercises:[{name:'Competition Squat',completedSets:1,totalSets:2}]};

const report=Intelligence.build(state,{asOf,liveWorkout,draft});
assert.equal(report.version,1);
assert.equal(report.session.scheduleId,'phase:p1:w10d1');
assert.equal(report.session.roleLabel,'Heavy exposure');
assert.equal(report.session.currentPlannedSet.weightKg,112.5);
assert.equal(report.session.currentPlannedSet.targetRpe,8);
assert.equal(report.session.guidance.status,'above-cap');
assert.equal(report.session.guidance.rpeDifference,1);
assert(report.session.acceptedChange);
assert.equal(report.session.acceptedChange.lifts[0].lift,'squat');
assert.match(report.session.acceptedChange.lifts[0].why,/reviewed|approved|phase/i);
assert.equal(report.progress.currentMovement.name,'Competition Squat');
assert.equal(report.progress.currentMovement.direction.status,'higher');
assert(report.todayFocus.some(x=>/reviewed squat exposure/i.test(x)));

const why=Intelligence.answer(report,'Why this set?');
assert.match(why,/accepted accumulation phase review/i);
assert.match(why,/Evidence:/i);
const trend=Intelligence.answer(report,'How is my training trending?');
assert.match(trend,/Competition Squat/i);
assert.match(trend,/descriptive/i);
const change=Intelligence.answer(report,'Why did Loadnote change this?');
assert.match(change,/latest stored accepted change/i);

const phaseAnswer=Intelligence.answer({lifecycle:{program:{name:'Meet prep'},progress:{week:7,totalWeeks:12,phase:'peaking',phaseLabel:'Peaking',phaseWeek:2,purpose:Intelligence.phasePurpose.peaking}},session:{},progress:{}},'What phase am I in?');
assert.match(phaseAnswer,/week 7 of 12/i);
assert.match(phaseAnswer,/Peaking/i);
assert.match(phaseAnswer,/competition specificity/i);

assert.match(report.limits.join(' '),/read-only/i);
console.log('v2.83 Companion intelligence stays deterministic, evidence-grounded and read-only');
