const assert=require('node:assert/strict');
const History=require('../src/product/history-reliability');

const workout=(id,date,weight=100,extra={})=>({
 id,date,notes:extra.notes||'',createdAt:date+'T20:00:00.000Z',
 exercises:[{exerciseId:'bench',name:'Competition Bench Press',type:'strength',trackBy:'reps',sets:[{weight,reps:5,rpe:extra.rpe===undefined?8:extra.rpe}]}],
 ...(extra.intent?{sessionIntent:extra.intent}:{})
});
const repeatedIntent={version:1,role:'volume',goal:'Bench volume',prescription:{version:1,capturedAt:'2026-09-01T12:00:00.000Z',source:{type:'repeated-workout',referenceId:'old',label:'Repeat'},plannedExercises:[]},deviationReason:'none',deviationNotes:''};
const scheduledIntent={version:1,role:'heavy-exposure',goal:'Bench practice',prescription:{version:1,capturedAt:'2026-09-01T12:00:00.000Z',source:{type:'program',referenceId:'p',label:'Plan'},plannedExercises:[]},deviationReason:'none',deviationNotes:'',schedule:{id:'s1',revisionAt:'2026-09-01T12:00:00.000Z'}};

const a=workout('a','2026-09-10',100,{notes:'Morning session'});
const b=JSON.parse(JSON.stringify(a));b.id='b';b.createdAt='2026-09-10T21:00:00.000Z';
const c=workout('c','2026-09-11',105,{intent:repeatedIntent});
const d=workout('d','2026-09-12',110,{intent:scheduledIntent});
const bad=workout('bad','2026-09-13',115,{rpe:11,notes:'Check RPE'});
const state={workouts:[a,b,c,d,bad],scheduledSessions:[],workoutRevisions:[],lastExportDate:'2026-09-09'};

const snapshot=JSON.stringify(state),report=History.inspect(state,{asOf:'2026-09-30'});
assert.equal(JSON.stringify(state),snapshot,'history reliability must stay read-only');
assert.equal(report.counts.total,5);
assert.equal(report.duplicates.length,1);
assert.deepEqual(report.duplicates[0].workoutIds,['a','b']);
assert.equal(report.counts.needsReview,3,'two possible duplicates plus invalid RPE');
assert.equal(report.lastExportDate,'2026-09-09');

assert.equal(History.source(a),'manual');
assert.equal(History.source(c),'repeated');
assert.equal(History.source(d),'scheduled');
assert.equal(History.duplicateMatches(state.workouts,a,{excludeId:'a'}).length,1);
assert.equal(History.duplicateMatches(state.workouts,c,{excludeId:'c'}).length,0);

assert.deepEqual(History.filter(state,{query:'morning'}).map(w=>w.id),['b','a']);
assert.deepEqual(History.filter(state,{query:'bench practice'}).map(w=>w.id),['d']);
assert.deepEqual(History.filter(state,{sourceKind:'repeated'}).map(w=>w.id),['c']);
assert.deepEqual(History.filter(state,{quality:'review'}).map(w=>w.id),['bad','b','a']);
assert.deepEqual(History.filter(state,{from:'2026-09-10',to:'2026-09-11',sort:'oldest'}).map(w=>w.id),['b','a','c']);

const changed=JSON.parse(JSON.stringify(b));changed.exercises[0].sets[0].weight=102.5;
assert.notEqual(History.workoutSignature(a),History.workoutSignature(changed));

console.log('v2.73 workout history reliability flags exact duplicates, supports filters, and remains read-only');