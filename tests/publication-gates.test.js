const assert=require('node:assert/strict');
const {REQUIRED,assess,check}=require('../scripts/check-publication-gates');
const sha='a'.repeat(40),other='b'.repeat(40);
const valid=()=>REQUIRED.map((file,i)=>({id:i+1,path:'.github/workflows/'+file,head_sha:sha,event:'push',status:'completed',conclusion:'success'}));
(async()=>{
 assert.deepEqual(assess(sha,sha,valid()),[]);
 assert.throws(()=>assess(sha,other,valid()),/main changed/);
 const pr=valid().map(r=>({...r,event:'pull_request'}));assert.equal(assess(sha,sha,pr).length,REQUIRED.length);
 assert.equal(assess(sha,sha,valid().map(r=>({...r,head_sha:other}))).length,REQUIRED.length);
 for(const conclusion of ['failure','cancelled','timed_out','skipped','neutral'])assert.throws(()=>assess(sha,sha,valid().map((r,i)=>i? r:{...r,conclusion})),/failed/);
 assert.deepEqual(assess(sha,sha,[...valid(),{...valid()[0],id:999,status:'in_progress',conclusion:null}]),['test.yml'],'Newer rerun supersedes earlier green result');
 let requests=0,waits=0;
 const fetcher=async url=>({ok:true,json:async()=>url.includes('/git/ref/')?{object:{sha}}:{workflow_runs:++requests===1?[]:valid()}});
 await check({repository:'synthetic/repo',sha,token:'synthetic-token',fetcher,wait:async()=>{waits++;},attempts:2});assert.equal(waits,1);
 await assert.rejects(check({repository:'synthetic/repo',sha,token:'synthetic-token',fetcher:async()=>({ok:false,status:403}),attempts:1}),/HTTP 403/);
 await assert.rejects(check({repository:'synthetic/repo',sha,token:'synthetic-token',fetcher:async()=>({ok:true,json:async()=>({object:{sha},workflow_runs:[]})}),attempts:1}),/not complete/);
 console.log('Publication fails closed on stale, missing, PR-only, failed, superseded or inaccessible exact-head release gates');
})().catch(e=>{console.error(e);process.exitCode=1;});
