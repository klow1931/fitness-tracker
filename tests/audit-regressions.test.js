const assert=require('node:assert/strict');
const Session=require('../src/product/workout-session'),Intent=require('../src/product/session-intent'),Draft=require('../src/product/draft-model');
const Phase=require('../src/product/phase-builder'),Readiness=require('../src/product/decision-readiness'),Integrity=require('../src/product/data-integrity');
const Analytics=require('../src/training/analytics'),Lifecycle=require('../src/product/program-lifecycle'),Schedule=require('../src/product/schedule'),{phaseFixture}=require('./fixtures/phase-builder');
const now='2026-09-24T10:00:00.000Z';
const plan=Intent.createPrescription([{name:'Squat',type:'strength',sets:Array.from({length:6},()=>({weight:115,reps:5,targetRpe:7}))}],{type:'manual',label:'Audit'},now);
const draft={version:3,date:'2026-10-15',unit:'kg',sessionIntent:{role:'mixed',prescription:plan},rows:[{name:'Squat',type:'strength',sets:Array.from({length:6},()=>({weight:'115',reps:'5',rpe:'',done:false,showCompletion:true}))}]};
assert.deepEqual(Session.fromDraft(draft,'untouched').exercises,[],'untouched prescription must not become actual training');
// A typed change alone is not an assertion that the planned work was performed.
draft.rows[0].sets[0].weight='117.5';
assert.deepEqual(Session.fromDraft(draft,'edited-target').exercises,[]);
draft.rows[0].sets[0].done=true;
const partial=Session.fromDraft(draft,'partial');
assert.equal(partial.exercises[0].sets.length,1);assert.equal(partial.exercises[0].sets[0].weight,117.5);
assert.equal(Intent.compare(partial).completedSets,1);assert.equal(Intent.compare(partial).plannedSets,6);
assert.equal(Session.fromDraft(Draft.normalize(draft),'recovered').exercises[0].sets.length,1,'recovery preserves completion boundary');
assert.equal(Session.fromDraft({...draft,edit:{id:'existing'}},'existing').exercises[0].sets.length,6,'saved history edits retain actuals');
assert.equal(Session.fromDraft(draft,null,{template:true}).exercises[0].sets.length,6,'template capture retains all targets');
assert.equal(Session.fromDraft({...draft,sessionIntent:null},'free').exercises[0].sets.length,6,'manually entered free workouts remain supported');
const cardio={...draft,rows:[{name:'Bike',type:'cardio',duration:'20',distance:'5',cardioDone:false}]};
assert.equal(Session.fromDraft(cardio,'cardio').exercises.length,0);cardio.rows[0].cardioDone=true;assert.equal(Session.fromDraft(cardio,'cardio').exercises[0].duration,20);
const hold={...draft,rows:[{name:'Plank',type:'strength',trackBy:'duration',sets:[{duration:'30',weight:'0',done:true},{duration:'45',weight:'0',done:false}]}]};
assert.equal(Session.fromDraft(hold,'hold').exercises[0].sets.length,1);

const names={squat:'Competition Squat',bench:'Competition Bench',deadlift:'Competition Sumo Deadlift'},blank={workouts:[],exerciseCatalog:[],exerciseRoles:[]};
assert.throws(()=>Phase.registerCompetitionLifts(blank,names,{now}),/Confirm/);
const registered=Phase.registerCompetitionLifts(blank,names,{confirmed:true,now});
assert.equal(registered.workouts.length,0);assert.equal(blank.exerciseCatalog.length,0,'setup is immutable');assert.equal(registered.exerciseCatalog.length,3);
assert.deepEqual(Readiness.list(registered.exerciseRoles).map(r=>r.competitionLift).sort(),['bench','deadlift','squat']);
assert.deepEqual(Phase.registerCompetitionLifts(registered,names,{confirmed:true,now}),registered,'same mapping is idempotent');
assert.throws(()=>Phase.registerCompetitionLifts(blank,{...names,bench:'competition squat'},{confirmed:true,now}),/different exercise/);
const aliased=structuredClone(registered);aliased.exerciseCatalog.find(e=>e.name===names.bench).aliases=['Comp Bench'];
assert.equal(Phase.registerCompetitionLifts(aliased,{...names,bench:'Comp Bench'},{confirmed:true,now}).exerciseCatalog.length,3,'existing alias resolves to the same identity');
const replacement=Phase.registerCompetitionLifts(registered,{...names,deadlift:'Competition Conventional Deadlift'},{confirmed:true,now:'2026-09-25T12:00:00.000Z'});
assert.equal(Readiness.list(replacement.exerciseRoles).filter(r=>r.competitionLift==='deadlift').length,1);
assert.equal(replacement.exerciseRoles.find(r=>r.revisions.at(-1).context===null).revisions.length,2,'old role history retained');
// A new athlete can review programming with no fabricated baseline workout.
const fixture=phaseFixture(),fresh={...fixture.state,workouts:[],exerciseCatalog:registered.exerciseCatalog,exerciseRoles:registered.exerciseRoles};
const config=structuredClone(fixture.config);for(const lift of Phase.LIFTS){const e=Integrity.resolveExercise(registered.exerciseCatalog,names[lift]);config.lifts[lift]={...config.lifts[lift],exerciseId:e.id,name:e.name,variation:null,variationEquipmentConfirmed:false,exposures:config.lifts[lift].exposures.map(x=>({...x,role:x.role==='variation'?'light':x.role}))};}
assert.doesNotThrow(()=>Phase.prepare(fresh,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'}));

const dated=[{date:'2026-08-10',exercises:[{name:'Bench',sets:[{weight:100,reps:5}]}]}];
assert.equal(Analytics.exerciseTrend(dated,'Bench',60,'2026-10-09T12:00:00Z').sessions,1,'cutoff day included');
assert.equal(Analytics.exerciseTrend(dated,'Bench',60,'2026-10-10T12:00:00Z'),null,'day before cutoff excluded');
// Reschedule execution before the original start, without altering the original program.
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let state=Phase.save(fixture.state,Phase.prepare(fixture.state,fixture.config,args),{confirmed:true},{...args,id:'early'});
state=Phase.schedule(state,'early',args);const id=state.scheduledSessions[0].id,original=JSON.stringify(state.phasePrograms);
state.scheduledSessions=Schedule.change(state.scheduledSessions,id,{date:'2026-09-24',reason:'Start early'},'2026-09-24T13:00:00.000Z');
const revision=state.scheduledSessions.find(r=>r.id===id).revisions.at(-1);
state.workouts.push({id:'early-actual',date:'2026-09-24',createdAt:'2026-09-24T18:00:00.000Z',exercises:revision.context.prescription.plannedExercises,sessionIntent:{prescription:revision.context.prescription,schedule:{id,revisionAt:revision.recordedAt}}});
const early=Lifecycle.inspect(state,{asOf:'2026-09-24'});
assert.equal(early.status,'active');assert.equal(early.startedEarly,true);assert.equal(early.nextAction.kind,'next-session');assert.match(early.nextAction.detail,/Started early/);assert.equal(JSON.stringify(state.phasePrograms),original);
console.log('Audit regressions: planned actuals, fresh identities, fixed clock and early-start status passed');
