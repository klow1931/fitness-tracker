const assert=require('node:assert/strict');
const Gateway=require('../backend/coach-gateway');

const context={
 version:'0.6',unit:'lb',units:{storageWeight:'kg',displayWeight:'lb'},
 companion:{
  version:1,surface:'train',liveWorkout:{active:true,currentExercise:{name:'Competition Squat'}},restTimer:{active:false},
  capabilities:{trainingIntelligenceRead:true,programmingMutation:false},
  intelligence:{version:1,asOf:'2026-10-03',lifecycle:{progress:{week:7,totalWeeks:12,phase:'peaking',phaseLabel:'Peaking'}},session:{role:'heavy-exposure',guidance:{status:'above-cap',rpeDifference:1,message:'Completed work is above the reviewed RPE cap.'}},progress:{strength:[{name:'Competition Squat',status:'higher',deltaPct:3.5}],changes:{rows:[]}},limits:['Progress direction is descriptive evidence, not a readiness score.','Only stored athlete-approved review changes are described as programming changes.','This intelligence layer is read-only.']}
 }
};
const normalized=Gateway.normalizeContext(context);
assert.equal(normalized.companion.intelligence.lifecycle.progress.phase,'peaking');
assert.equal(normalized.companion.intelligence.session.guidance.status,'above-cap');
assert.equal(normalized.companion.intelligence.progress.strength[0].deltaPct,3.5);
assert.equal(normalized.companion.capabilities.programmingMutation,false);
const messages=Gateway.providerMessages({question:'Why this set?',context,history:[]});
assert.match(messages[0].content,/deterministic, read-only Loadnote evidence/i);
assert.match(messages[0].content,/not a readiness\/recovery score/i);
assert.match(messages[0].content,/Never invent an adaptation/i);
assert.match(messages.at(-2).content,/"phase":"peaking"/);
assert.match(messages.at(-2).content,/"trainingIntelligenceRead":true/);
console.log('secure Coach keeps Companion intelligence bounded, deterministic and read-only');
