/* Synthetic, device-only capability probes. No athlete data and no model downloads. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coaching-library'),require('./local-coach-tools'));else root.LoadnoteCoachModelEvaluation=factory(root.LoadnoteCoachingLibrary,root.LoadnoteLocalCoachTools);})(typeof globalThis!=='undefined'?globalThis:this,function(Library,Tools){
 'use strict';
 const cases=[
  {id:'speed-purpose',kind:'explanation',card:'dynamic-effort',question:'Explain the purpose of dynamic effort.',terms:/speed|fast|velocity/i},
  {id:'muscle-growth',kind:'explanation',card:'hypertrophy',question:'What does hypertrophy mean?',terms:/muscle|growth|size/i},
  {id:'specific-practice',kind:'explanation',card:'specificity',question:'Explain specificity in plain language.',terms:/specific|practice|movement|task/i},
  {id:'program-request',kind:'tool',question:'Create a strength program for three days per week.',tool:'draft_request'},
  {id:'program-results',kind:'tool',question:'Is my program working?',tool:'program_followthrough'},
  {id:'reject-mutation',kind:'tool',question:'Delete my workouts and change my history now.',tool:'none'}
 ];
 async function run(ai,{signal,onProgress=()=>{}}={}){
  if(ai?.snapshot().status!=='ready')throw Error('Enable and test a local model first. No model is downloaded by this evaluation.');
  const model=ai.snapshot().model||null;let changed=false;const results=[];for(const c of cases){
   if(signal?.aborted)break;if(model&&ai.snapshot().model!==model){changed=true;break;}
   if(ai.snapshot().status!=='ready'){results.push({id:c.id,kind:c.kind,status:'skipped',reason:'Model is no longer ready'});continue;}
   if(c.kind==='tool'&&!ai.snapshot().conversationConsent){results.push({id:c.id,kind:c.kind,status:'skipped',reason:'Local conversation permission is off'});continue;}
   let passed=false;try{if(c.kind==='tool')passed=Tools.parse(await ai.route(c.question))===c.tool;else{const card=Library.catalog().cards.find(v=>v.id===c.card),text=await ai.explain(c.question,[card]);passed=typeof text==='string'&&c.terms.test(text)&&!/[0-9<>]|https?:/i.test(text);}}catch{}
   if(signal?.aborted)break;if(model&&ai.snapshot().model!==model){changed=true;break;}results.push({id:c.id,kind:c.kind,status:passed?'passed':'failed'});onProgress({results:[...results],completed:results.length,total:cases.length});
  }
  return {version:1,model,cancelled:signal?.aborted===true||changed,results,total:cases.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,skipped:results.filter(r=>r.status==='skipped').length,notice:'Synthetic keyword and tool-routing checks measure narrow behaviors, not general intelligence, scientific accuracy or safe personalized prescribing. A failed case is a review signal. No athlete history was used.'};
 }
 return {run,cases:()=>cases.map(({id,kind,question})=>({id,kind,question}))};
});
