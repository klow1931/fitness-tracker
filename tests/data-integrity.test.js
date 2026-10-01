const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core'),Integrity=require('../src/product/data-integrity'),Session=require('../src/product/workout-session'),Blocks=require('../src/product/training-blocks'),Progress=require('../src/product/progress-model');
const original={schemaVersion:11,workouts:[
 {id:'a',date:'2026-08-01',exercises:[{name:'Tricep Pushdown',sets:[{weight:40,reps:10,rpe:8}]},{name:'Adduction Machine',sets:[{weight:50,reps:10,rpe:8}]}]},
 {id:'b',date:'2026-08-08',exercises:[{name:'Tricep Push Down',sets:[{weight:45,reps:10,rpe:8}]},{name:'Hip Adduction',sets:[{weight:55,reps:10,rpe:8}]}]}
],prs:[],templates:[],trainingBlocks:[]};
const snapshot=JSON.stringify(original),migrated=Integrity.normalizeState(Core.normalizeState(original,{}));
assert.equal(JSON.stringify(original),snapshot,'migration must not mutate imported input');assert.equal(migrated.schemaVersion,25);assert.equal(migrated.releaseVersion,require('../package.json').version);
assert.equal(migrated.workouts[0].exercises[0].exerciseId,migrated.workouts[1].exercises[0].exerciseId,'compact spelling variants share identity');
assert.notEqual(migrated.workouts[0].exercises[1].exerciseId,migrated.workouts[1].exercises[1].exerciseId,'semantic aliases require explicit merge');
const source=migrated.workouts[0].exercises[1].exerciseId,target=migrated.workouts[1].exercises[1].exerciseId,merged=Integrity.mergeExercises(migrated,source,target);
assert.equal(merged.workouts[0].exercises[1].exerciseId,target);assert.equal(merged.exerciseCatalog.some(e=>e.id===source),false);assert(merged.exerciseCatalog.find(e=>e.id===target).aliases.includes('Adduction Machine'));
assert.equal(Progress.entries(merged.workouts,'Hip Adduction','reps',target).length,2);assert.equal(Session.findPerformance(merged.workouts,'Hip Adduction',()=>true,target).exercise.name,'Adduction Machine');
assert.equal(Session.reconcilePRs([],merged.workouts,(w,r)=>w*(1+r/30),()=>Math.random()).length,2,'aliases share one derived record identity');

const before={id:'workout',date:'2026-08-01',notes:'before',exercises:[{name:'Bench',sets:[{weight:100,reps:5,rpe:8}]}]};
const edited={id:'workout',date:'2026-08-02',notes:'after',exercises:[{name:'Bench',sets:[{weight:105,reps:5,rpe:8}]}]};
let state={workouts:[before],prs:[],workoutRevisions:[],exerciseCatalog:[],recoverySnapshots:[]};
state=Session.apply(state,edited,{id:'workout',original:before},null,(w,r)=>w*(1+r/30),()=> 'generated','2026-09-01T00:00:00.000Z');
assert.equal(state.workoutRevisions.length,1);assert.equal(state.workoutRevisions[0].action,'edit');assert.equal(Integrity.undoableWorkoutRevisions(state).length,1);
state=Integrity.undoWorkoutRevision(state,state.workoutRevisions[0].id,{now:'2026-09-01T00:00:01.000Z',id:'undo'});assert.equal(state.workouts[0].date,'2026-08-01');assert.equal(Integrity.undoableWorkoutRevisions(state).length,0);
state=Session.remove(state,'workout',(w,r)=>w*(1+r/30),()=> 'delete-revision','2026-09-02T00:00:00.000Z');assert.equal(state.workouts.length,0);assert.equal(Integrity.undoableWorkoutRevisions(state)[0].action,'delete');
state=Integrity.undoWorkoutRevision(state,'delete-revision',{now:'2026-09-02T00:00:01.000Z',id:'restore'});assert.equal(state.workouts[0].id,'workout');

const preview=Integrity.previewImport({workouts:[{id:'1',x:1},{id:'2'}],trainingBlocks:[],templates:[],decisionEvents:[{id:'d1',response:'accept'}],nutrition:[{id:'n1',date:'2026-09-01'}],bodyweight:[{id:'bw1',date:'2026-09-01',weight:90}]},{workouts:[{id:'1',x:2},{id:'3'}],trainingBlocks:[],templates:[],decisionEvents:[{id:'d1',response:'modify'},{id:'d2',response:'ignore'}],nutrition:[{id:'n2',date:'2026-09-02'}],bodyweight:[]});
assert.deepEqual(preview.workouts,{before:2,after:2,added:1,changed:1,removed:1});assert.deepEqual(preview.decisionEvents,{before:1,after:2,added:1,changed:1,removed:0});assert.deepEqual(preview.nutrition,{before:1,after:1,added:1,changed:0,removed:1});assert.deepEqual(preview.bodyweight,{before:1,after:0,added:0,changed:0,removed:1});
const outlierWorkout={id:'outlier',date:'2026-09-14',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',sets:[{weight:132.45,reps:1,rpe:8},{weight:119.75,reps:2,rpe:7},{weight:114.76,reps:2,rpe:6.5},{weight:114.76,reps:2,rpe:6.5},{weight:109.77,reps:3,rpe:6},{weight:1016.95,reps:3,rpe:6}]}]};
const correctedWorkout=JSON.parse(JSON.stringify(outlierWorkout));correctedWorkout.exercises[0].sets[5].weight=109.77;
const dirtyAudit=Integrity.auditTrainingData({workouts:[outlierWorkout],workoutRevisions:[]});
assert.equal(dirtyAudit.status,'review');assert.equal(dirtyAudit.current.suspiciousLoads,1);assert.equal(dirtyAudit.current.rpeCoverage,100);
const correctedAudit=Integrity.auditTrainingData({workouts:[correctedWorkout],workoutRevisions:[{id:'fix',workoutId:'outlier',recordedAt:'2026-09-15T00:00:00.000Z',action:'edit',before:outlierWorkout,after:correctedWorkout}]});
assert.equal(correctedAudit.status,'clean','corrected current workout must not be contaminated by a bad historical revision');assert.equal(correctedAudit.current.suspiciousLoads,0);assert(correctedAudit.history.suspiciousLoads>=1,'historical outlier remains visible only as audit history');
const missingAudit=Integrity.auditTrainingData({workouts:[{id:'rpe',date:'2026-09-15',exercises:[{name:'Bench',sets:[{weight:100,reps:5},{weight:100,reps:5,rpe:11}]}]}]});
assert.equal(missingAudit.current.missingRpe,1);assert.equal(missingAudit.current.invalidRpe,1);assert.equal(missingAudit.status,'review');

const withRecovery=Integrity.addRecoverySnapshot({workouts:[]},{workouts:[before],recoverySnapshots:[{id:'old'}]},'Before import',{now:'2026-09-03T00:00:00.000Z',id:'snapshot'});
assert.equal(withRecovery.recoverySnapshots.length,1);assert.equal(Integrity.restoreRecoverySnapshot(withRecovery,'snapshot').workouts[0].id,'workout');

const context={name:'Return block',startDate:'2026-08-01',endDate:'2026-08-31',blockType:'return-reentry',primaryGoal:'Rebuild strength',loadStrategy:'performance-based',progressionIntent:'testing',dataCompleteness:'incomplete'};
const records=Blocks.upsert([],context,{now:'2026-09-04T00:00:00.000Z'}),analysis=Blocks.analyze(records,migrated.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true});
assert.equal(analysis.frequencyPerWeek,null);assert.equal(analysis.observedFrequencyPerWeek,1.8);assert.equal(Blocks.contextWarnings(context).length,2);
const mergedAnalysis=Blocks.analyze(records,merged.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true});assert.equal(mergedAnalysis.exercises.length,2);assert.equal(Core.exerciseHistory(merged.workouts,'Hip Adduction').length,2);
const complete=Blocks.upsert(records,{...context,dataCompleteness:'complete'},{id:records[0].id,now:'2026-09-05T00:00:00.000Z'});assert.equal(Blocks.analyze(complete,migrated.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true}).frequencyPerWeek,0.5);
console.log('Data integrity migration, aliases, revisions, health audit, recovery, previews, and coverage passed');
