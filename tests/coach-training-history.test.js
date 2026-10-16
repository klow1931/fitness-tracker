const assert=require('node:assert/strict');
const Tool=require('../src/product/coach-training-history'),Conversation=require('../src/product/coach-conversation');
const state={exerciseCatalog:[
 {id:'row',name:'Chest-supported Row',aliases:['Chest supported row']},
 {id:'lat',name:'Lat Pulldown',aliases:['Lat pull down']},
 {id:'db',name:'Dumbbell Bench Press'},
 {id:'s',name:'Competition Squat'}
],exerciseRoles:[],workoutRevisions:[],workouts:[
 {id:'a',date:'2026-09-01',exercises:[{exerciseId:'row',name:'Chest-supported Row',sets:[{reps:8,weight:50,rpe:7,done:true},{reps:8,weight:55,rpe:null},{reps:8,weight:60,rpe:10,done:false},{reps:6,weight:35,warmup:true}]}]},
 {id:'b',date:'2026-09-10',exercises:[{exerciseId:'row',name:'Chest-supported Row',sets:[{reps:8,weight:55,rpe:8,done:true},{reps:7,weight:55,rpe:9,skipped:true}]},{exerciseId:'lat',name:'Lat Pulldown',sets:[{reps:10,weight:45,rpe:null,completed:true}]}]},
 {id:'c',date:'2026-09-20',exercises:[{exerciseId:'row',name:'Chest-supported Row',sets:[{reps:8,weight:60,rpe:8,done:true},{reps:6,weight:65,rpe:9,done:true}]}]},
 {id:'future',date:'2026-10-01',exercises:[{exerciseId:'row',name:'Chest-supported Row',sets:[{reps:8,weight:999,rpe:10,done:true}]}]}
]};
const original=JSON.stringify(state),opts={asOf:'2026-09-24',unit:'lb'};
let a=Tool.answer(state,'How did my chest supported row change over my last workouts?',opts);
assert.equal(a.source,'Recorded exercise history');
assert.equal(a.readOnly,true);
assert.match(a.text,/Last 3 recorded workouts/);
assert.match(a.text,/2026-09-20/);
assert.match(a.text,/2026-09-10/);
assert.match(a.text,/2026-09-01/);
assert.match(a.text,/132\.3 lb/);
assert.doesNotMatch(a.text,/999|2026-10-01|RPE 0/);
assert.match(a.text,/RPE unknown/);
assert.match(a.text,/completion not marked/);
assert.match(a.text,/skipped, warm-up or explicitly incomplete/);
assert.match(a.text,/No training load was changed/);
assert.equal(a.evidence[0].sessions.length,3);
assert.equal(a.evidence[0].sessions[2].excluded,2);
const h=[{role:'user',content:'How did my chest supported row change over my last workouts?'},{role:'assistant',content:'Invented 9999 kg target'}];
a=Tool.answer(state,'What about last time?',{...opts,history:h});
assert.equal(a.intent.movement,'Chest-supported Row');
assert.doesNotMatch(a.text,/9999/);
const lat=Tool.answer(state,'What about lat pulldown?',{...opts,history:h});
assert.equal(lat.intent.movement,'Lat Pulldown');
assert.match(lat.text,/99\.2 lb/);
assert.equal(Tool.answer(state,'What about last time?',opts),null);
assert.equal(Tool.answer(state,'What about last time?',{...opts,history:[...h,{role:'user',content:'Hello'}]}),null);
assert.equal(Tool.answer(state,'What about last time?',{...opts,history:[{role:'assistant',content:'How did chest supported row change over my last workouts?'}]}),null);
assert.equal(Tool.answer(state,'My chest-supported row hurts and is numb',{...opts,history:h}),null);
assert.equal(Tool.answer(state,'Create a chest supported row program',opts),null);
assert.equal(Tool.answer(state,'What is my squat training max?',opts),null);
assert.equal(Tool.answer(state,'How did my competition squat change over my last workouts?',opts),null);
const broken={...state,exerciseCatalog:[...state.exerciseCatalog,{id:'row2',name:'Chest-supported Row'}]};
assert.match(Tool.answer(broken,'Show chest supported row history',opts).text,/Multiple saved exercises/);
const legacy={...state,workouts:[{id:'legacy',date:'2026-09-14',exercises:[{name:'Chest-supported Row',sets:[{reps:10,weight:30,rpe:null}]}]}]};
assert.match(Tool.answer(legacy,'Show chest supported row history',{...opts,unit:'kg'}).text,/30 kg/);
assert.equal(Tool.answer(broken,'Show chest supported row history',opts).evidence.length,0);
const updated={...state,workouts:state.workouts.map(w=>({...w,exercises:w.exercises.map(e=>({...e,sets:e.sets.map(s=>({...s}))}))}))};
updated.workouts[2].exercises[0].sets[0].weight=63;
assert.match(Tool.answer(updated,'Show chest supported row history',{...opts,unit:'kg'}).text,/63 kg/);
assert.doesNotMatch(Tool.answer(state,'Show chest supported row history',{...opts,unit:'kg'}).text,/63 kg/);
const fromCoach=Conversation.answer(state,'Show my chest supported row history',{...opts,history:[]});
assert.equal(fromCoach.source,'Recorded exercise history');
assert.equal(fromCoach.readOnly,true);
assert.equal(JSON.stringify(state),original);
console.log('v3.31 offline exercise history: current corrected evidence, bounded follow-ups, units, completion uncertainty, legacy IDs, exclusions and immutability passed');
