'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('../src/product/cockpit-verified-history');
const state={exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:['Bench Competition']},{id:'row',name:'Chest-supported Row'}],exerciseRoles:[],workoutRevisions:[],workouts:[
 {id:'old',date:'2026-10-15',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:90,reps:5,done:true,rpe:8}]}]},
 {id:'latest',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[
  {weight:100,reps:5,rpe:8.5,done:true},{weight:125,reps:5,rpe:10,done:false},
  {weight:130,reps:5,rpe:10,warmup:true,done:true},
  {weight:110,reps:3,rpe:9,done:true}
 ]}]},
 {id:'today',date:'2026-11-03',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:999,reps:5,done:true}]}]}
]};
const preserved=JSON.stringify(state),req={name:'Bench Competition',date:'2026-11-03',reps:5,unit:'lb',trackBy:'reps'};
const saved=H.lastConfirmed(state,req);
assert.equal(saved.weightKg,100);assert.equal(saved.weight,'220.5 lb');assert.equal(saved.source,'corrected-saved-history');
const choose=(e=saved,o={})=>H.confirmedLoadValue(e,{reps:5,currentWeight:'',done:false,unit:'lb',...o});
assert.equal(choose(),220.5);
assert.equal(choose(saved,{unit:'kg'}),100);
assert.equal(choose(saved,{currentWeight:'0'}),null,'typed zero is a real entered load, never overwritten');
assert.equal(choose(saved,{currentWeight:'225'}),null);
assert.equal(choose(saved,{currentWeight:'  '}),220.5,'whitespace-only entry is blank');
assert.equal(choose(saved,{reps:3}),null,'rep-count change after rendering invalidates the action');
assert.equal(choose(saved,{reps:null}),null);
assert.equal(choose(saved,{done:true}),null,'completed sets are never rewritten');
assert.equal(choose(saved,{unit:'stone'}),null);
assert.equal(choose({...saved,source:'unsaved-draft'}),null);
assert.equal(choose({...saved,confirmed:false}),null);
for(const kg of [undefined,null,Number.NaN,Infinity,-1,2001,'100'])assert.equal(choose({...saved,weightKg:kg}),null,'invalid stored kg is not copied: '+kg);
assert.equal(choose({...saved,weightKg:0}),0,'explicit zero is valid bodyweight');
assert.equal(choose({...saved,weightKg:102.5}),226,'display conversion uses exactly one kg→lb boundary');
assert.equal(choose(null),null);
const changed={...state,workouts:state.workouts.map(w=>w.id==='latest'?{...w,exercises:[{...w.exercises[0],sets:[{weight:105,reps:5,rpe:8.5,done:true}]}]}:w)};
assert.equal(choose(H.lastConfirmed(changed,req)),231.5,'a history correction must change the available fill before the next tap');
const unknownRpe={...state,workouts:state.workouts.map(w=>w.id==='latest'?{...w,exercises:[{...w.exercises[0],sets:[{weight:100,reps:5,done:true,rpe:null}]}]}:w)};
assert.equal(H.lastConfirmed(unknownRpe,req).rpe,null,'missing historical RPE remains unknown');
assert.equal(choose(H.lastConfirmed(unknownRpe,req)),220.5,'unknown RPE does not invent or block the known load');
const ambiguous={...state,exerciseCatalog:[...state.exerciseCatalog,{id:'other',name:'Bench Competition'}]};
assert.equal(H.lastConfirmed(ambiguous,req),null);
assert.equal(JSON.stringify(state),preserved,'no reads or fill proposals mutate saved history');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ui=read('src/product/training-cockpit-ui.js');
assert(ui.includes('data-cockpit-use-confirmed'));
assert(ui.includes('confirmedLoadValue(ctx,confirmed(ctx))'),'click-time history revalidation must be present');
assert(ui.includes('saveLoggerDraft()')&&ui.includes("input.value=String(value)"),'writes stay in the existing draft logger');
const config=read('playwright.config.js'),m=config.match(/name:'mobile-webkit',testMatch:\[([^\]]+)\]/);
assert(m&&m[1].includes("'v65-confirmed-load-fill.spec.js'"));
assert(read('.github/workflows/test.yml').split('\n').some(s=>s.includes('npx playwright test ')&&s.includes('tests/browser/v65-confirmed-load-fill.spec.js')));
console.log('v6.5 load-only confirmed history fill: kg/lb, zero, RPE, stale edits, read-only and WebKit gates passed');
