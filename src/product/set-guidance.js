/* v2.27 — deterministic next-set context, never an automatic prescription change. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnoteSetGuidance=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function evaluate(planned,performed){
    if(!Array.isArray(planned)||!Array.isArray(performed))throw Error('Provide planned and performed sets');
    const completed=performed.map((s,i)=>({s,i})).filter(({s})=>s?.done);
    const next=performed.findIndex(s=>!s?.done);
    const nextTarget=next>=0?planned[next]||null:null;
    const latest=completed.at(-1),target=latest&&planned[latest.i],result={nextIndex:next,nextTarget,completed:completed.length,status:'awaiting-set',message:'Follow the approved target and log your actual RPE.'};
    if(!completed.length)return result;
    if(!target||!Number.isFinite(target.weight)||!Number.isFinite(target.targetRpe)){result.status='no-comparable-target';result.message='No comparable approved RPE target for the last checked set. Log your actual work.';return result;}
    const actual=latest.s,rpe=actual.rpe===''||actual.rpe==null?null:Number(actual.rpe);
    if(!Number.isFinite(rpe)||rpe<1||rpe>10){result.status='rpe-missing';result.message='Enter actual RPE for the checked set before comparing effort to the approved cap.';return result;}
    const load=Number(actual.weightKg);
    if(!Number.isFinite(load)||Math.abs(load-target.weight)>.02||actual.reps!==target.reps){result.status='work-different';result.message='Logged load or reps differ from this approved set. Keep the recorded work; review the remaining targets manually.';return result;}
    result.rpeDifference=Math.round((rpe-target.targetRpe)*10)/10;
    if(rpe>target.targetRpe){result.status='above-cap';result.message='Last checked set exceeded its approved RPE cap by '+result.rpeDifference+'. Review remaining work rather than automatically increasing load.';}
    else{result.status='within-cap';result.message='Last checked set met its approved RPE cap. Keep the next approved target unless you deliberately modify the workout.';}
    if(next<0)result.message+=' All entered sets are checked.';
    return result;
  }
  return {evaluate};
});
