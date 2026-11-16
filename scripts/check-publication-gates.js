'use strict';
// Read-only exact-head release gate. Never authorize an older head or a PR run.
const REQUIRED=['test.yml','mobile-review.yml','android-build.yml','ios-build.yml','android-beta.yml','codeql.yml'];
function assess(sha,main,runs){
 if(main!==sha)throw Error('Approved main changed; refusing to publish an older checkout');
 const pending=[];
 for(const file of REQUIRED){
  const matching=runs.filter(r=>r.head_sha===sha&&r.event==='push'&&r.path==='.github/workflows/'+file).sort((a,b)=>b.id-a.id);
  const run=matching[0];
  if(!run||run.status!=='completed'){pending.push(file);continue;}
  if(run.conclusion!=='success')throw Error('Required exact-head workflow failed: '+file);
 }
 return pending;
}
async function check({repository,sha,token,fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=60}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository||'')||!/^[a-f0-9]{40}$/.test(sha||'')||!token)throw Error('Publication requires repository, exact commit and Actions token');
 async function json(path){
  let response;try{response=await fetcher('https://api.github.com/repos/'+repository+path,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});}catch{throw Error('Could not verify publication gates');}
  if(!response.ok)throw Error('Could not verify publication gates (HTTP '+response.status+')');
  try{return await response.json();}catch{throw Error('Unreadable publication-gate response');}
 }
 for(let i=0;i<attempts;i++){
  const main=await json('/git/ref/heads/main');
  const runs=await json('/actions/runs?head_sha='+sha+'&event=push&per_page=100');
  if(!Array.isArray(runs.workflow_runs))throw Error('Missing publication-gate results');
  const pending=assess(sha,main.object?.sha,runs.workflow_runs);
  if(!pending.length)return;
  if(i===attempts-1)throw Error('Required exact-head workflows not complete: '+pending.join(', '));
  console.log('Waiting for required exact-head workflows: '+pending.join(', '));await wait(20000);
 }
}
if(require.main===module)check({repository:process.env.GITHUB_REPOSITORY,sha:process.env.LOADNOTE_PUBLICATION_SHA||process.env.GITHUB_SHA,token:process.env.GITHUB_TOKEN}).then(()=>console.log('All required workflows passed on current approved main')).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={REQUIRED,assess,check};
