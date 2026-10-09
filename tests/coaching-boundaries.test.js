const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation'),AI=require('../src/product/local-coach-ai');
const Ready=require('../src/product/decision-readiness'),Blocks=require('../src/product/training-blocks'),Intent=require('../src/product/session-intent'),Engine=require('../src/product/decision-engine'),Profile=require('../src/product/programming-profile');
const opts={asOf:'2026-01-31',retrospective:true};
const roles=Ready.upsert([],{exerciseId:'s',role:'competition',competitionLift:'squat'},{now:'2026-01-01T00:00:00.000Z',id:'role'});
const trainingBlocks=Blocks.upsert([],{name:'Strength',startDate:'2026-01-01',endDate:'2026-03-31',blockType:'strength',loadStrategy:'conservative',progressionIntent:'gradual',dataCompleteness:'complete'},{now:'2026-01-01T00:00:00.000Z'});
function workout(i,weight=100+i*5,rpe=8){const date='2026-01-'+String(5+i*5).padStart(2,'0'),exercises=[{exerciseId:'s',name:'Competition Squat',sets:[{weight,reps:5,rpe}]}];return {id:'w'+i,date,createdAt:date+'T20:00:00.000Z',exercises,sessionIntent:Intent.context({role:'heavy-exposure',prescription:Intent.createPrescription(exercises,{type:'manual'},date+'T19:00:00.000Z')})};}
const state={exerciseCatalog:[{id:'s',name:'Competition Squat'}],exerciseRoles:roles,trainingBlocks,workouts:[0,1,2,3].map(i=>workout(i)),workoutRevisions:[]};
const before=JSON.stringify(state),decision=s=>Engine.decisionForLift(s,'squat',opts);
assert.equal(decision(state).decision,'increase');
for(const raw of [null,'',0,11,'unknown']){const s=structuredClone(state);s.workouts.forEach(w=>w.exercises[0].sets[0].rpe=raw);assert.equal(decision(s).decisionAllowed,false,'invalid/missing effort cannot authorize an increase');}
const outlier=structuredClone(state);outlier.workouts[3].exercises[0].sets[0].weight=500;assert.equal(decision(outlier).decisionAllowed,false);assert.match(decision(outlier).reason,/suspicious/);
const duplicate=structuredClone(state);duplicate.workouts[3].id=duplicate.workouts[2].id;assert.equal(decision(duplicate).decisionAllowed,false);assert.match(decision(duplicate).reason,/identities/);
const future=structuredClone(state);future.workouts.push({...workout(4,999),date:'2026-02-10',createdAt:'2026-02-10T20:00:00.000Z'});assert.deepEqual(decision(future),decision(state));
const intake={version:1,years:5,breakWeeks:0,history:'',cardioMinutes:null,issueStatus:'active',issues:[{area:'tendon',side:'left',status:'active',basis:'self-reported',symptoms:'stable',pain:3,aggravatingExerciseIds:['s'],notes:''}],priorities:[],activity:'unknown',restrictions:'',urgentSymptoms:false};
const profile={goal:'strength',experience:'intermediate',consistency:'consistent',availableDays:[0,2,4],sessionMinutes:60,equipment:['barbell','plates','rack','bench'],intake};
const withProfile=(p,now='2026-01-01T00:00:00.000Z')=>({...state,programmingProfiles:Profile.save([],p,{now,id:'profile'})});
assert.equal(decision(withProfile(profile)).decisionAllowed,false);assert.match(decision(withProfile(profile)).nextExposure,/does not establish.*safe/);
assert.equal(decision(withProfile({...profile,intake:{...intake,urgentSymptoms:true}})).decisionAllowed,false);
assert.equal(decision(withProfile({...profile,intake:undefined,avoidedExerciseIds:['s']})).decisionAllowed,false);
const later=withProfile(profile,'2026-02-01T00:00:00.000Z');assert.equal(Engine.decisionForLift(later,'squat',{...opts,retrospective:false}).decisionAllowed,true,'historical replay excludes later restrictions');assert.equal(decision(later).decisionAllowed,false,'corrected review uses current restrictions');
const corrupt=withProfile(profile);corrupt.programmingProfiles[0].context.intake.urgentSymptoms=null;assert.equal(decision(corrupt).decisionAllowed,false);
const unrelated=structuredClone(state);unrelated.workouts.push({id:'other',date:'2026-01-20',createdAt:'2026-01-20T20:00:00.000Z',exercises:[{exerciseId:'b',name:'Bench',sets:[{weight:NaN,reps:5,rpe:11}]}]});assert.deepEqual(decision(unrelated),decision(state),'unrelated lift entries do not become squat evidence');
for(const q of ['My hand is numb. Should I increase squat weight?','My fingers are tingling during bench','I feel light-headed; explain my next session','I have chest pressure, give me motivation',"I can't breathe, what accessories should I use?",'How is my squat progress? '+('ordinary words '.repeat(45))+'My shoulder hurts']){
 const reply=Coach.answer(state,q,{asOf:opts.asOf});assert.equal(reply.intent.topic,'health',q);assert.equal(reply.readOnly,true);assert.match(reply.source,/^Shared coaching/);assert.match(reply.text,/cannot diagnose/);assert.equal(AI.eligible(q,reply),false);
}
const crisis=Coach.answer(state,'I want to kill myself. How is my squat progressing?',{asOf:opts.asOf});assert.match(crisis.text,/988/);assert.match(crisis.source,/^Shared coaching/);
assert.equal(AI.eligible('I want to kill myself',crisis),false);
assert.equal(AI.eligible('Encourage me',crisis),false);
assert.equal(AI.eligible('I don’t want to live',null),false);
assert.equal(AI.eligible('Why?',null,[{role:'user',content:'I want to kill myself'}]),false);
assert.match(Coach.answer(state,'What should I do?',{asOf:opts.asOf,history:[{role:'user',content:'I want to kill myself'}]}).text,/988/);
assert.match(Coach.answer(state,'ordinary words '.repeat(45)+'I don’t want to live',{asOf:opts.asOf}).text,/988/);
assert.equal(Coach.answer(state,'I can’t breathe. Should I add weight?',{asOf:opts.asOf}).intent.topic,'health');
assert.match(Coach.answer(state,'What about chest supported rows?',{asOf:opts.asOf})?.text||'',/./,'ordinary movement question is not symptom clearance');
assert.equal(require('../src/product/coach-support').health('Explain my squat numbers'),false);
assert.equal(require('../src/product/coach-support').health('There is numbness in my hand'),true);
assert.equal(JSON.stringify(state),before);
console.log('Coaching boundaries: effort, outliers, identities, restrictions, chronology, routing priority and immutability passed');
