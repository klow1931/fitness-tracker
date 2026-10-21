const assert=require('node:assert/strict');
const Review=require('../src/product/coach-evidence-options');
const Reasoning=require('../src/product/coach-reasoning');
const Coach=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const asOf='2026-09-24',now='2026-09-24T18:00:00.000Z',state=fixture(),before=JSON.stringify(state);
const source='Corrected training evidence';
const trend=(status,overrides={})=>({source,evidence:[{status,name:'Competition Bench',baselineDays:status==='insufficient'?0:3,recentDays:status==='insufficient'?1:3,recentSets:10,...overrides}]});
let a=Review.summarize('performance',trend('insufficient'),asOf);
assert.equal(a.status,'limited');assert.match(a.observed,/insufficient/);assert.match(a.limitation,/not a tested maximum/);
a=Review.summarize('performance',trend('higher'),asOf);
assert.equal(a.status,'observed');assert.match(a.observed,/3 earlier \/ 3 recent/);
a=Review.summarize('performance',trend('unmapped'),asOf);
assert.equal(a.status,'limited');assert.match(a.limitation,/mapping/);
a=Review.summarize('performance',{source,evidence:[]},asOf);
assert.equal(a.status,'unavailable');
a=Review.summarize('recap',{source,evidence:[{status:'ready',observed:{sessions:3,sets:22,rpeSets:12}}]},asOf);
assert.match(a.observed,/3 workouts, 22 eligible strength sets, 12 with recorded RPE/);
a=Review.summarize('recap',{source,evidence:[{status:'ready',observed:{sessions:1,sets:2,rpeSets:0}}]},asOf);
assert.match(a.limitation,/Missing RPE is unknown/);
a=Review.summarize('upcoming',{source,evidence:[{status:'ready',session:{date:'2026-09-25',name:'Bench day'},reasons:['Timestamp mismatch']}]},asOf);
assert.equal(a.status,'limited');
a=Review.summarize('upcoming',{source,evidence:[{status:'ambiguous'}]},asOf);
assert.equal(a.status,'limited');
a=Review.summarize('weekly',{source,evidence:[{status:'ready',week:3,groups:[{plannedSets:6,comparedSets:3,aboveCap:1,status:'gather'}]}]},asOf);
assert.equal(a.status,'limited');assert.match(a.observed,/3\/6/);assert.match(a.observed,/1 above cap/);
const weekly={status:'ready',week:3,asOf,program:{name:'Training block'},groups:[],
 proposal:{status:'review',changes:[{sessionId:'a'},{sessionId:'b'}]}};
let result=Review.compare(weekly);
assert.equal(result.status,'ready');assert.equal(result.options[0].id,'keep');
assert.equal(result.options[1].status,'review-available');assert.equal(result.changesPreviewed,2);
assert.match(result.options[1].reason,/2 future session/);
assert.match(result.explanation,/No option is auto-selected/i);
assert.deepEqual(Review.compare({...weekly,proposal:{status:'review',changes:[]}}).options.map(x=>x.id),['keep','evidence']);
assert.equal(Review.compare({...weekly,proposal:{status:'phase-review',changes:[]}}).options[1].id,'phase-review');
assert.equal(Review.compare({...weekly,proposal:{status:'approved',changes:[]}}).options[1].id,'already-approved');
assert.equal(Review.compare({...weekly,proposal:{status:'gather',changes:[]},groups:[{status:'gather',name:'Bench',reason:'RPE unknown'}]}).options[1].status,'not-ready');
assert.equal(Review.compare({status:'ambiguous'}).options.length,0,'Ambiguous saved programs cannot be compared');
assert.equal(Review.compare({status:'waiting'}).options.length,0,'An incomplete week cannot generate an adjustment');
const diff=Review.differences([],{
 performance:trend('insufficient'),weekly:{evidence:[weekly]}
});
assert.match(diff[0],/insufficient comparable RPE-aware days/);
const higher=Review.differences([],{
 performance:trend('higher'),weekly:{evidence:[{...weekly,groups:[{status:'gather',aboveCap:1}]}]}
});
assert.match(higher[0],/different|Neither/i);
assert.equal(Review.differences([],{performance:trend('higher'),weekly:{evidence:[{...weekly,groups:[]}]}}).length,0);
for(const q of ['Compare my options for next week','Compare keeping my plan versus reviewing changes for next week']){
 assert(Review.wantsComparison(q),q);
 const answer=Coach.answer(state,q,{asOf,now,unit:'lb'});
 assert.equal(answer.readOnly,true);assert.equal(answer.source,'Offline Coach · reviewed program options');
 assert(answer.comparison,'Only existing validated weekly choices should be surfaced');
 assert(answer.actions.every(x=>x.kind==='weekly-coaching'));
}
for(const q of ['Create a new program','What are my training options?','My Achilles hurts. Compare weekly plan options']){
 assert.equal(Review.answer(state,q,{asOf,now}),null,q);
}
const compound=Reasoning.answer(state,'Why has my bench stalled and explain my next workout?',{asOf,now,unit:'lb'});
assert.equal(compound.evidenceCards.length,2);
assert.equal(compound.reasoning.sections.length,2);
assert(compound.evidenceCards.every(x=>['observed','limited','unavailable'].includes(x.status)));
assert.equal(JSON.stringify(state),before,'All Coach option comparisons and evidence summaries must preserve actual athlete state');
console.log('v3.77 evidence cards, contradictory/missing signal fixtures, reviewed options, safety and immutable data passed');
