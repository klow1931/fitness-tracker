const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {assertSavedWorkout}=require('./browser/helpers/offline-workout-contract');
const valid=()=>[{id:'synthetic-session',date:'2026-11-16',exercises:[{name:'Offline Acceptance Press',sets:[{weight:61.23,reps:5,rpe:8},{weight:63.5,reps:3,rpe:9}]}]}];
assertSavedWorkout(valid());
for(const mutate of [w=>w.push(w[0]),w=>w[0].exercises[0].sets.pop(),w=>w[0].exercises[0].sets[0].weight=135,w=>w[0].exercises[0].sets[1].rpe=8,w=>w[0].exercises[0].sets[0].reps=3,w=>w[0].exercises[0].name='Wrong exercise']){const w=valid();mutate(w);assert.throws(()=>assertSavedWorkout(w),'Integrity contract must reject corruption/duplicates');}
const root=path.resolve(__dirname,'..'),cli=path.join(path.dirname(require.resolve('playwright/package.json')),'cli.js');
for(const live of [false,true]){
 const env={...process.env};if(live)env.LOADNOTE_OFFLINE_URL='https://klow1931.github.io/fitness-tracker/';else delete env.LOADNOTE_OFFLINE_URL;
 const result=spawnSync(process.execPath,[cli,'test','--config=playwright.offline.config.js','--list','--reporter=json'],{cwd:root,env,encoding:'utf8'});assert.equal(result.status,0,result.stderr+result.stdout);
 const report=JSON.parse(result.stdout),selected=[];function visit(suites){for(const suite of suites||[]){for(const spec of suite.specs||[])for(const t of spec.tests)selected.push(t.projectName);visit(suite.suites);}}visit(report.suites);
 assert.deepEqual(selected.sort(),live?['mobile-chromium']:['mobile-chromium','mobile-webkit']);
}
const testWorkflow=fs.readFileSync(path.join(root,'.github/workflows/test.yml'),'utf8');assert.match(testWorkflow,/needs: \[smoke, browser, webkit, offline\]/);assert.match(testWorkflow,/OFFLINE_RESULT.*needs.offline.result/);assert.match(testWorkflow,/test "\$OFFLINE_RESULT" = success/);
const config=require('../playwright.offline.config');assert.equal(config.retries,0);assert.equal(config.use.serviceWorkers,'allow');assert.equal(config.use.trace,'on');
const pages=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');assert.match(pages,/workflow_run:/);assert.match(pages,/check-publication-gates.js/);assert.match(pages,/LOADNOTE_OFFLINE_URL: https:\/\/klow1931.github.io\/fitness-tracker\//);assert.match(pages,/needs: deploy/);
console.log('Offline integrity contract rejects unit/RPE/history corruption; both release profiles and isolated live Chromium are discovered and required');

const mobile=fs.readFileSync(path.join(root,'.github/workflows/mobile-review.yml'),'utf8');const liveGuard=mobile.split('name: Verify approved live release and offline assets')[1].split('run:')[0];assert(liveGuard.includes("github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'"),'Pre-publication push gate must not require unpublished assets already live');
