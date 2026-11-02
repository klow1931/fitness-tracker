'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('../src/product/cockpit-verified-history');
const asOf='2026-11-02';
const data={exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:['Comp Bench']},{id:'row',name:'Row'}],exerciseRoles:[],workoutRevisions:[],workouts:[
 {id:'older',date:'2026-10-10',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:95,reps:5,rpe:8.5,done:true}]}]},
 {id:'latest',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:100,reps:5,rpe:8,done:true},{weight:115,reps:5,rpe:9,done:false},{weight:130,reps:5,rpe:10,warmup:true,done:true},{weight:145,reps:5,rpe:10},{weight:110,reps:3,rpe:9,done:true}]}]},
 {id:'today',date:asOf,exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:999,reps:5,rpe:10,done:true}]}]},
 {id:'future',date:'2026-11-05',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:900,reps:5,done:true}]}]}
]};
const snapshot=JSON.stringify(data),req={name:'Comp Bench',date:asOf,reps:5,unit:'lb',trackBy:'reps'};
let r=H.lastConfirmed(data,req);
assert.deepEqual(r,{date:'2026-10-24',reps:5,weight:'220.5 lb',rpe:8,exercise:'Competition Bench',confirmed:true,source:'corrected-saved-history'});
r=H.lastConfirmed(data,{...req,unit:'kg'});
assert.equal(r.weight,'100 kg');
r=H.lastConfirmed(data,{...req,reps:3});
assert.equal(r.weight,'242.5 lb');
r=H.lastConfirmed(data,{...req,reps:8});
assert.equal(r,null,'an unmatched rep count cannot be passed off as a confirmed result');
for(const reps of [null,0,-1,4.5,1001,NaN])assert.equal(H.lastConfirmed(data,{...req,reps}),null);
assert.equal(H.lastConfirmed(data,{...req,trackBy:'duration'}),null);
assert.equal(H.lastConfirmed(data,{...req,date:'2026-13-01'}),null);
assert.equal(H.lastConfirmed(data,{...req,date:'2026-10-24'}).date,'2026-10-10','same day is excluded');
const changed={...data,workouts:data.workouts.map(w=>w.id==='latest'?{...w,exercises:[{...w.exercises[0],sets:w.exercises[0].sets.map(s=>({...s,done:false}))}]}:w)};
r=H.lastConfirmed(changed,req);
assert.equal(r.date,'2026-10-10','falls back to the previous explicitly completed saved session');
const none={...data,workouts:data.workouts.map(w=>({...w,exercises:w.exercises.map(e=>({...e,sets:e.sets.map(s=>({...s,done:false}))}))}))};
assert.equal(H.lastConfirmed(none,req),null,'never treats unmarked completion as confirmed');
const unknownRpe={...data,workouts:data.workouts.map(w=>w.id==='latest'?{...w,exercises:[{...w.exercises[0],sets:[{weight:0,reps:5,done:true,rpe:null}]}]}:w)};
r=H.lastConfirmed(unknownRpe,req);
assert.equal(r.weight,'0 lb','explicit zero load stays zero');
assert.equal(r.rpe,null,'missing RPE stays unknown');
const aliasConflict={...data,exerciseCatalog:[...data.exerciseCatalog,{id:'other',name:'Comp Bench'}]};
assert.equal(H.lastConfirmed(aliasConflict,req),null,'overlapping aliases never borrow evidence');
assert.equal(H.lastConfirmed(data,{...req,name:'Not in catalog'}),null);
assert.equal(JSON.stringify(data),snapshot,'no mutation of saved workouts or revisions');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
assert(read('index.html').includes('src/product/cockpit-verified-history.js'));
assert(read('sw.js').includes('./src/product/cockpit-verified-history.js'),'offline cache must contain the new logic');
const config=read('playwright.config.js'),m=config.match(/name:'mobile-webkit',testMatch:\[([^\]]+)\]/);
assert(m&&m[1].includes("'v64-verified-history.spec.js'"),'real WebKit must run new acceptance tests');
assert(read('.github/workflows/test.yml').split('\n').some(s=>s.includes('npx playwright test ')&&s.includes('tests/browser/v64-verified-history.spec.js')),'WebKit workflow must execute the acceptance test');
console.log('v6.4 correction-aware, exact-rep, explicitly completed cockpit history safeguards passed');
