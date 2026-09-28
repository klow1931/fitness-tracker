const assert=require('node:assert/strict');
const Integrity=require('../src/product/data-integrity');

const plan={version:1,capturedAt:'2026-09-28T12:00:00.000Z',source:{type:'program',label:'Week 1'},plannedExercises:[
 {name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8}]}
]};
const schedule={id:'session-1',revisions:[{recordedAt:'2026-09-28T12:00:00.000Z',context:{date:'2026-09-29',name:'Squat day',status:'scheduled',reason:'',blockId:null,role:'heavy-exposure',goal:'Squat',prescription:plan}}]};
const workout={id:'w1',date:'2026-09-29',createdAt:'2026-09-29T15:00:00.000Z',updatedAt:'2026-09-29T15:00:00.000Z',
 exercises:[{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight:150,reps:5,rpe:8},{weight:150,reps:5,rpe:8}]}],
 sessionIntent:{version:1,role:'heavy-exposure',goal:'Squat',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:'session-1',revisionAt:'2026-09-28T12:00:00.000Z'}}
};
const revision={id:'rev1',workoutId:'w1',recordedAt:'2026-09-29T15:00:00.000Z',action:'create',before:null,after:workout};
const clean={schemaVersion:25,releaseVersion:'2.52.0',workouts:[workout],scheduledSessions:[schedule],workoutRevisions:[revision]};
let audit=Integrity.auditRelationships(clean);
assert.equal(audit.status,'clean');
assert.equal(audit.blocking,0);
assert.equal(audit.warnings,0);
assert.equal(audit.counts.linkedWorkouts,1);

const duplicate=JSON.parse(JSON.stringify(clean));
duplicate.workouts.push({...JSON.parse(JSON.stringify(workout)),id:'w2'});
audit=Integrity.auditRelationships(duplicate);
assert(audit.issues.some(i=>i.code==='duplicate-schedule-completion'&&i.severity==='blocking'));
assert(audit.blocking>=1);

const mismatched=JSON.parse(JSON.stringify(clean));
mismatched.workouts[0].sessionIntent.prescription.plannedExercises[0].sets[0].weight=145;
audit=Integrity.auditRelationships(mismatched);
assert(audit.issues.some(i=>i.code==='linked-plan-mismatch'));

const orphan=JSON.parse(JSON.stringify(clean));orphan.scheduledSessions=[];
audit=Integrity.auditRelationships(orphan);
assert(audit.issues.some(i=>i.code==='orphan-schedule-link'));

const badHistory=JSON.parse(JSON.stringify(clean));
badHistory.workoutRevisions=[{id:'same',workoutId:'w1',recordedAt:'bad-time',action:'edit',before:null,after:workout},{id:'same',workoutId:'w1',recordedAt:'2026-09-29T16:00:00.000Z',action:'undo',targetRevisionId:'missing',before:workout,after:null}];
audit=Integrity.auditRelationships(badHistory);
assert.equal(audit.blocking,0,'revision-history warnings must not replace/block the current workout record');
assert(audit.warnings>=3);
assert(audit.issues.some(i=>i.code==='orphan-undo-target'));

const manifest=Integrity.addBackupManifest(clean,{exportedAt:'2026-09-30T12:00:00.000Z',releaseVersion:'2.52.0'});
const verified=Integrity.verifyBackupManifest(manifest);
assert.equal(verified.status,'verified');
assert.equal(verified.verified,true);
assert.equal(verified.schemaVersion,25);
const tampered=JSON.parse(JSON.stringify(manifest));tampered.workouts[0].exercises[0].sets[0].weight=999;
assert.equal(Integrity.verifyBackupManifest(tampered).status,'invalid');
assert.equal(Integrity.verifyBackupManifest(clean).status,'legacy');

let withSnapshot=Integrity.addRecoverySnapshot({workouts:[]},clean,'Before change',{now:'2026-09-30T13:00:00.000Z',id:'snap'});
assert(withSnapshot.recoverySnapshots[0].fingerprint);
assert.equal(Integrity.restoreRecoverySnapshot(withSnapshot,'snap').workouts[0].id,'w1');
withSnapshot=JSON.parse(JSON.stringify(withSnapshot));
const payload=JSON.parse(withSnapshot.recoverySnapshots[0].payload);payload.workouts[0].date='2030-01-01';withSnapshot.recoverySnapshots[0].payload=JSON.stringify(payload);
assert.throws(()=>Integrity.restoreRecoverySnapshot(withSnapshot,'snap'),/integrity check failed/i);

const reliability=Integrity.auditReliability(clean);
assert.equal(reliability.status,'clean');
assert.equal(reliability.blocking,0);
console.log('v2.52 backup, relationship, recovery-snapshot and combined reliability checks passed');
