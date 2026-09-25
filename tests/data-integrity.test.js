const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core'),Integrity=require('../src/product/data-integrity'),Session=require('../src/product/workout-session'),Blocks=require('../src/product/training-blocks'),Progress=require('../src/product/progress-model');
const original={schemaVersion:11,workouts:[
 {id:'a',date:'2026-08-01',exercises:[{name:'Tricep Pushdown',sets:[{weight:40,reps:10,rpe:8}]},{name:'Adduction Machine',sets:[{weight:50,reps:10,rpe:8}]}]},
 {id:'b',date:'2026-08-08',exercises:[{name:'Tricep Push Down',sets:[{weight:45,reps:10,rpe:8}]},{name:'Hip Adduction',sets:[{weight:55,reps:10,rpe:8}]}]}
],prs:[],templates:[],trainingBlocks:[]};
const snapshot=JSON.stringify(original),migrated=Integrity.normalizeState(Core.normalizeState(original,{}));
assert.equal(JSON.stringify(original),snapshot,'migration must not mutate imported input');assert.equal(migrated.schemaVersion,22);assert.equal(migrated.releaseVersion,'2.15.0');
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

const preview=Integrity.previewImport({workouts:[{id:'1',x:1},{id:'2'}],trainingBlocks:[],templates:[],decisionEvents:[{id:'d1',response:'accept'}]},{workouts:[{id:'1',x:2},{id:'3'}],trainingBlocks:[],templates:[],decisionEvents:[{id:'d1',response:'modify'},{id:'d2',response:'ignore'}]});
assert.deepEqual(preview.workouts,{before:2,after:2,added:1,changed:1,removed:1});assert.deepEqual(preview.decisionEvents,{before:1,after:2,added:1,changed:1,removed:0});
const withRecovery=Integrity.addRecoverySnapshot({workouts:[]},{workouts:[before],recoverySnapshots:[{id:'old'}]},'Before import',{now:'2026-09-03T00:00:00.000Z',id:'snapshot'});
assert.equal(withRecovery.recoverySnapshots.length,1);assert.equal(Integrity.restoreRecoverySnapshot(withRecovery,'snapshot').workouts[0].id,'workout');

const context={name:'Return block',startDate:'2026-08-01',endDate:'2026-08-31',blockType:'return-reentry',primaryGoal:'Rebuild strength',loadStrategy:'performance-based',progressionIntent:'testing',dataCompleteness:'incomplete'};
const records=Blocks.upsert([],context,{now:'2026-09-04T00:00:00.000Z'}),analysis=Blocks.analyze(records,migrated.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true});
assert.equal(analysis.frequencyPerWeek,null);assert.equal(analysis.observedFrequencyPerWeek,1.8);assert.equal(Blocks.contextWarnings(context).length,2);
const mergedAnalysis=Blocks.analyze(records,merged.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true});assert.equal(mergedAnalysis.exercises.length,2);assert.equal(Core.exerciseHistory(merged.workouts,'Hip Adduction').length,2);
const complete=Blocks.upsert(records,{...context,dataCompleteness:'complete'},{id:records[0].id,now:'2026-09-05T00:00:00.000Z'});assert.equal(Blocks.analyze(complete,migrated.workouts,records[0].id,{asOf:'2026-08-31',retrospective:true}).frequencyPerWeek,0.5);
console.log('Data integrity migration, aliases, revisions, recovery, previews, and coverage passed');
