/* Repeatable scenario checks, not a general intelligence score. No network/model required. */
'use strict';
const assert=require('node:assert/strict'),P=require('../src/product/offline-planner'),C=require('../src/product/coach-conversation'),R=require('../src/product/coach-reference-retrieval'),F=require('../src/product/coach-followthrough'),{phaseFixture}=require('../tests/fixtures/phase-builder'),{fixture,args}=require('../tests/fixtures/weekly-coaching'),cases=require('../tests/fixtures/coach-capabilities-cases.json');
function run(){const results=[];for(const row of cases){try{
 let state=phaseFixture().state,before=JSON.stringify(state),reply;
 if(row.group==='planning')reply=P.answer(state,row.question);
 if(row.group==='dialogue'||row.group==='reset'){
  const first=P.answer(state,row.start||'Create a 12-week strength program 4 days 60 minutes full gym'),history=[{role:'user',content:row.start||'Create a strength program'},{role:'assistant',content:first.text,planning:first.planning}];
  if(row.interlude)history.push({role:'user',content:row.interlude},{role:'assistant',content:'This assistant text is not a planning fact.'});reply=P.answer(state,row.question,{history});if(row.group==='reset')assert.equal(reply,null);
  if(row.preserve)for(const key of row.preserve)assert.deepEqual(reply.planning[key],first.planning[key],key);
 }
 if(['planning','dialogue'].includes(row.group)){assert(reply,'A supported request should yield an explicit reply');if(row.field)assert.deepEqual(reply.planning[row.field],row.equals);if(row.slot)assert.equal(reply.clarificationSlot,row.slot);if(row.noAction)assert(!(reply.actions||[]).some(a=>a.kind==='offline-plan'));if(row.action)assert(reply.actions.some(a=>a.kind==='offline-plan'));}
 if(row.group==='references'){const r=R.retrieve(row.question);if(row.none)assert.equal(r.hits.length,0);else assert(r.hits.some(h=>h.id===row.hit),'Expected relevant educational reference');}
 if(row.group==='safety'){reply=C.answer(state,row.question,{asOf:'2026-10-30'});assert.equal(reply.intent?.topic,row.topic);assert(!reply.planning);}
 if(row.group==='followthrough'){state=row.empty?{}:fixture();if(row.overlap){const other=structuredClone(state.meetCycles[0]);other.id='overlapping';state.meetCycles.push(other);}before=JSON.stringify(state);reply=F.answer(state,row.question,args);assert.equal(reply.evidence[0].status,row.status);assert.equal(reply.readOnly,true);}
 assert.equal(JSON.stringify(state),before,'Evaluation must not mutate training state');results.push({id:row.id,group:row.group,passed:true});
 }catch(error){results.push({id:row.id,group:row.group,passed:false,reason:error.message});}}
 return {version:1,total:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results,notice:'These scenarios measure specified request, evidence and boundary behaviors. They do not certify program effectiveness, medical safety or general model intelligence.'};}
if(require.main===module){const r=run();console.log(JSON.stringify(r,null,2));if(r.failed)process.exitCode=1;}
module.exports={run};
