const assert=require('node:assert/strict');
const Starter=require('../src/product/beginner-program'),Custom=require('../src/product/custom-program'),First=require('../src/product/beginner-first-week'),Coach=require('../src/product/coach-conversation'),Prefs=require('../src/product/coach-training-profile');
const {phaseFixture}=require('./fixtures/phase-builder');
const asOf='2026-10-24',now=asOf+'T12:00:00.000Z',state=phaseFixture().state,opts={asOf,now};
for(const minutes of [20,300]){const r=Prefs.answer(state,'I train Monday and Wednesday for '+minutes+' minutes',opts);assert.match(r.text,/clarify the duration/);assert.equal(r.actions.length,0);}
assert.equal(Prefs.answer(state,'I train Monday and Wednesday for 45 minutes',opts).actions[0].proposal.changes.sessionMinutes,45);
for(const goal of Object.keys(Starter.GOALS)){
 const db=Starter.suggested({goal,equipment:'dumbbells',days:[0,2,4]});assert(db.flatMap(d=>d.exercises).every(e=>!/bench|supported/i.test(e.name)));
 const bw=Starter.suggested({goal,equipment:'bodyweight',days:[0,2,4]});assert(bw.flatMap(d=>d.exercises).every(e=>!/step-up|incline/i.test(e.name)));
}
const fresh={customPrograms:[],exerciseCatalog:[],scheduledSessions:[],workouts:[]};
const proposal=Starter.make(fresh,{goal:'fitness',equipment:'dumbbells',days:[0,2]},{asOf}).proposal;
const saved=Custom.save(fresh,proposal,{confirmed:true,id:'starter',now,source:{kind:'manual',name:'Loadnote beginner starting structure'}}),before=JSON.stringify(saved);
assert.equal(Starter.saved(saved,{asOf,unscheduled:true}).length,1);assert.equal(Starter.saved(saved,{asOf:'2026-10-23'}).length,0);
assert.equal(First.inspect(saved,{asOf,entry:'help'}).action,'starter');
assert.equal(First.inspect(saved,{asOf,entry:'help',todayReport:{unlinkedDraft:true}}).action,'resume');
assert.equal(First.inspect(saved,{asOf,entry:'help',continuity:{next:{date:'2026-10-26'}}}).action,'calendar');
for(const q of ['I am new to lifting. Can you help me start?','What weight should I start with?','Show my first training plan']){
 const r=Coach.answer(saved,q,opts);assert.equal(r.intent.topic,'beginner-help');assert.equal(r.readOnly,true);assert(r.actions.length>0);assert.doesNotMatch(r.text,/I do not have a reliable/);
}
assert.equal(Coach.answer(saved,'I am new to lifting and my knee hurts',opts).intent.topic,'health');
assert.match(Coach.answer(saved,'What is RPE?',opts).text,/two more reps/);
assert.throws(()=>Starter.saved(saved,{asOf:'2026-02-30'}));
const later=Custom.schedule(saved,'starter',{now:'2026-10-25T12:00:00.000Z'});assert.equal(Starter.saved(later,{asOf,unscheduled:true})[0].scheduledAt,undefined);
const scheduled=Custom.schedule(saved,'starter',{now});assert.equal(Starter.saved(scheduled,{asOf,unscheduled:true}).length,0);
assert.equal(JSON.stringify(saved),before);
console.log('Beginner review fixes: duration clarification, equipment fit, saved-plan handoff, as-of selection and read-only Coach passed');
