/* Observational prescription-vs-log feedback. Never infers a new training dose. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'));
 else root.LoadnoteWorkoutFeedback=factory(root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Intent){
 'use strict';
 const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
 const advance=(day,count)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);};
 const key=e=>e.exerciseId?'id:'+String(e.exerciseId):'name:'+String(e.name||'').trim().toLowerCase();
 const strength=e=>e.type!=='cardio'&&e.type!=='practice'&&e.trackBy!=='duration';
 function compare(workout){
  const base={id:workout.id,date:workout.date,status:'no-prior-plan',plannedSets:0,matchedSets:0,effortCompared:0,aboveCap:0,missingRpe:0,reasons:[]};
  const raw=workout.sessionIntent?.prescription;
  if(!raw)return {...base,reasons:['No saved prescription for this workout.']};
  let plan,timing;
  try{plan=Intent.prescription(raw);timing=Intent.planTiming(plan,workout.date,workout.sessionIntent?.timing);}
  catch{return {...base,status:'invalid-plan',reasons:['Saved prescription or timing could not be validated.']};}
  if(timing!=='before-training'||!workout.createdAt||plan.capturedAt>workout.createdAt)return {...base,status:'unverified-timing',reasons:['The saved plan cannot be established as preceding training.']};
  const planned=plan.plannedExercises.filter(strength),actual=(workout.exercises||[]).filter(strength);
  base.plannedSets=planned.reduce((sum,e)=>sum+(e.sets||[]).length,0);
  if(!base.plannedSets)return {...base,status:'unsupported-plan',reasons:['No strength-set targets to compare.']};
  const pkeys=planned.map(key),akeys=actual.map(key);
  if(new Set(pkeys).size!==pkeys.length||new Set(akeys).size!==akeys.length||pkeys.length!==akeys.length||pkeys.some(k=>!akeys.includes(k)))
   return {...base,status:'different-work',reasons:['Exercise selections or identities differ from the saved prescription.']};
  for(const p of planned){
   const a=actual[akeys.indexOf(key(p))];
   if(a.loadConvention&&p.loadConvention&&a.loadConvention!==p.loadConvention){base.reasons.push('Load convention changed.');continue;}
   if((a.sets||[]).length!==p.sets.length){base.reasons.push('Set count differs.');continue;}
   for(let i=0;i<p.sets.length;i++){
    const target=p.sets[i],log=a.sets[i],reps=log?.reps;
    const repMatch=Number.isInteger(reps)&&(target.minReps!=null?reps>=target.minReps&&reps<=target.maxReps:reps===target.reps);
    if(!repMatch||!Number.isFinite(log?.weight)||!Number.isFinite(target.weight)||Math.abs(log.weight-target.weight)>.02){base.reasons.push('Logged reps or load differ from target.');continue;}
    base.matchedSets++;
    if(!Number.isFinite(log.rpe)||log.rpe<1||log.rpe>10||!Number.isFinite(target.targetRpe)){base.missingRpe++;continue;}
    base.effortCompared++;if(log.rpe>target.targetRpe)base.aboveCap++;
   }
  }
  base.reasons=[...new Set(base.reasons)];
  base.status=base.matchedSets!==base.plannedSets?'different-work':base.missingRpe?'missing-effort':base.aboveCap?'above-cap':'within-cap';
  return base;
 }
 function analyze(state,{asOf=new Date().toISOString().slice(0,10),days=7}={}){
  if(!date(asOf)||![7,28].includes(days))throw Error('Choose a valid review date and 7- or 28-day window.');
  const from=advance(asOf,1-days),rows=(state?.workouts||[]).filter(w=>date(w.date)&&w.date>=from&&w.date<=asOf&&(!w.createdAt||w.createdAt.slice(0,10)<=asOf)).map(compare);
  const count=status=>rows.filter(r=>r.status===status).length;
  const comparable=rows.filter(r=>['within-cap','above-cap'].includes(r.status));
  const matchedSets=rows.reduce((n,r)=>n+r.matchedSets,0),plannedSets=rows.reduce((n,r)=>n+r.plannedSets,0),effortCompared=rows.reduce((n,r)=>n+r.effortCompared,0),aboveCap=rows.reduce((n,r)=>n+r.aboveCap,0);
  const unknown=rows.filter(r=>!['within-cap','above-cap'].includes(r.status)).length;
  const next=[];
  if(!rows.length)next.push('Log a workout to begin a comparison; no training response is inferred.');
  if(rows.length&&count('no-prior-plan'))next.push('Capture a planned workout before training when you want an exact comparison.');
  if(count('unverified-timing')||count('invalid-plan'))next.push('Check plan timing and saved revisions; later or unverified plans cannot prove adherence.');
  if(count('different-work'))next.push('Review changed exercises, sets, reps or loads in Training Review; deliberate substitutions are not automatically failures.');
  if(count('missing-effort'))next.push('Enter actual RPE when known rather than copying the target. Missing effort stays unknown.');
  if(aboveCap)next.push('Some comparable sets exceeded their intended effort cap. Review the evidence and future targets in Decisions before approving changes.');
  if(comparable.length>=2&&!aboveCap)next.push('Comparable logs met their effort caps. This describes adherence, not evidence that weight should increase.');
  return {asOf,from,days,rows,logged:rows.length,comparable:comparable.length,unknown,plannedSets,matchedSets,effortCompared,aboveCap,next,readOnly:true,
   notice:'Observational current-corrected logs only. Unplanned, changed, late and missing-effort sessions are not counted as successful or failed prescriptions. Missed Calendar sessions are reviewed separately. No automatic dose, strength gain or causal benefit is inferred.'};
 }
 const wants=q=>/\b(planned\s*(?:vs\.?|versus|against)\s*actual|prescribed\s*(?:vs\.?|versus|against)\s*(?:actual|logged)|follow(?:ed|ing)?\s+(?:my\s+|the\s+)?(?:workout|session|training)\s+plan|adheren(?:ce|t)\s+(?:to\s+)?(?:my\s+)?(?:workout|program|training)|compare\s+(?:my\s+)?(?:planned|prescribed)\s+(?:and|to|with)\s+(?:logged|actual))\b/i.test(q);
 function answer(state,q,opts={}){
  if(!wants(String(q||'')))return null;
  let result;
  try{result=analyze(state,{asOf:opts.asOf,days:/\b(?:month|28\s*days|4\s*weeks)\b/i.test(q)?28:7});}
  catch{return {text:'I could not validate the workout comparison. Review saved records in Progress before interpreting the result.',source:'Offline Coach · workout feedback',readOnly:true,evidence:[]};}
  const text='Last '+result.days+' days ('+result.from+'–'+result.asOf+'): '+result.logged+' logged workouts; '+result.comparable+' fully comparable to pre-training prescriptions; '+result.unknown+' with missing, changed or unverified comparison context. '+result.matchedSets+'/'+result.plannedSets+' prescribed strength sets matched logged reps/load; '+result.effortCompared+' have comparable actual RPE, '+result.aboveCap+' above cap.\n\n'+result.next.join(' ')+'\n\n'+result.notice;
  return {text,source:'Offline Coach · planned versus actual',readOnly:true,evidence:[result],actions:[{kind:'training-feedback',label:'Inspect training review'}]};
 }
 return {compare,analyze,answer};
});
