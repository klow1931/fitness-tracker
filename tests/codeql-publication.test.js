const assert=require('node:assert/strict'),fs=require('node:fs'),{planUpload}=require('../scripts/codeql-upload-policy');
(async()=>{
 let reads=0;const readConfiguration=async()=>{reads++;return {state:'configured'};};
 assert.equal((await planUpload({eventName:'pull_request',readConfiguration})).upload,false);assert.equal(reads,0);
 assert.equal((await planUpload({eventName:'push',readConfiguration})).upload,false);
 assert.match((await planUpload({eventName:'push',readConfiguration})).warning,/default CodeQL setup is active/);
 assert.equal((await planUpload({eventName:'push',readConfiguration:async()=>({state:'not-configured'})})).upload,true);
 for(const status of [403,404]){
  const readConfiguration=async()=>{throw Object.assign(Error('Unavailable'),{status});};
  const automatic=await planUpload({eventName:'push',readConfiguration});assert.equal(automatic.upload,false);assert.match(automatic.warning,/unverified/);
  assert.equal((await planUpload({eventName:'workflow_dispatch',requested:true,readConfiguration})).upload,true);
 }
 await assert.rejects(planUpload({eventName:'push',readConfiguration:async()=>{throw Object.assign(Error('Unavailable'),{status:503});}}));
 await assert.rejects(planUpload({eventName:'push',readConfiguration:async()=>({state:'unknown'})}));
 await assert.rejects(planUpload({eventName:'workflow_dispatch',requested:true,readConfiguration}),/Default CodeQL setup is active/);
 const workflow=fs.readFileSync(require('node:path').join(__dirname,'../.github/workflows/codeql.yml'),'utf8');
 for(const lang of ['actions','javascript-typescript','python','java-kotlin','swift'])assert(workflow.includes('language: '+lang));
 assert.match(workflow,/github\/codeql-action\/analyze@v4/);assert.match(workflow,/codeql-results\/\*\.sarif/);assert.match(workflow,/steps\.publication\.outputs\.upload/);assert(!workflow.includes('continue-on-error'));
 console.log('CodeQL default/advanced publication compatibility, explicit handoff and preserved analysis passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
