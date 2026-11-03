'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const U=require('../src/product/cockpit-fill-undo');
const args={name:'Competition Bench',exerciseId:'bench',date:'2026-11-03',reps:5,unit:'lb',before:'',after:'220.5'};
const record=U.capture(args);
assert(Object.isFrozen(record));
assert.deepEqual(record,{source:'confirmed-load-fill',...args});
const now={name:'Competition Bench',exerciseId:'bench',date:'2026-11-03',reps:5,unit:'lb',weight:'220.5',done:false,sameSet:true,connected:true};
assert.equal(U.canUndo(record,now),true);
for(const change of [{weight:'225'},{weight:''},{weight:'0'},{unit:'kg'},{date:'2026-11-04'},
 {reps:3},{name:'Competition Squat'},{exerciseId:'squat'},{done:true},{sameSet:false},{connected:false}]){
 assert.equal(U.canUndo(record,{...now,...change}),false,'Undo must decline changed '+Object.keys(change)[0]);
}
assert.equal(U.canUndo(null,now),false);
assert.equal(U.canUndo({...record,source:'manual-fill'},now),false);
assert.equal(U.capture({...args,before:'100'}),null,'never undo over an entry that existed before fill');
assert.equal(U.capture({...args,after:''}),null);
assert.equal(U.capture({...args,after:'NaN'}),null);
assert.equal(U.capture({...args,after:'-4'}),null);
assert.equal(U.capture({...args,date:'not-date'}),null);
assert.equal(U.capture({...args,reps:0}),null);
assert.equal(U.capture({...args,unit:'stone'}),null);
const zero=U.capture({...args,unit:'kg',before:'',after:'0'});
assert.equal(U.canUndo(zero,{...now,unit:'kg',weight:'0'}),true,'valid saved bodyweight zero can be reversed');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8'),ui=read('src/product/training-cockpit-ui.js');
assert(ui.includes('data-cockpit-undo-confirmed'));
assert(ui.includes('event.isTrusted&&lastConfirmedFill&&event.target===lastConfirmedFill.input'),'typed input must invalidate the action even if value is restored later');
assert(ui.includes('lastConfirmedFill=null;\n  input.value=action.snapshot.before;changed(input);'));
assert(read('index.html').includes('src/product/cockpit-fill-undo.js'));
assert(read('sw.js').includes('./src/product/cockpit-fill-undo.js'),'undo module must be offline');
const cfg=read('playwright.config.js'),m=cfg.match(/name:'mobile-webkit',testMatch:\[([^\]]+)\]/);
assert(m&&m[1].includes("'v66-confirmed-fill-undo.spec.js'"));
assert(read('.github/workflows/test.yml').split('\n').some(s=>s.includes('npx playwright test ')&&s.includes('tests/browser/v66-confirmed-fill-undo.spec.js')));
console.log('v6.6 confirmed-load undo guards and offline/WebKit inclusion passed');
