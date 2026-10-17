/* Phase 2: deterministic, reviewable setup defaults. Never infer a training max. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteProgramSetupPolicy=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION=1;
 const labels={linear:'Linear loading',undulating:'Daily-undulating loading',wave:'Three-week waves','weekly-undulating':'Weekly-undulating loading'};
 function recommend(profile,{days,meet=false}={}){
  const p=profile?.context||profile||{};
  const available=Array.isArray(p.availableDays)?p.availableDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6):[];
  const chosen=Array.isArray(days)?days:available.slice(0,3);
  const valid=chosen.length>=2&&chosen.length<=5&&new Set(chosen).size===chosen.length&&chosen.every(d=>available.includes(d));
  const experience=p.experience||'unknown',consistency=p.consistency||'unknown';
  const repeated=chosen.length>=3&&['intermediate','advanced'].includes(experience)&&consistency==='consistent';
  const style=repeated?'undulating':'linear';
  let reason=repeated
    ? 'Saved experience, consistency and at least three training days make primary and lighter exposures possible. Daily undulation is a setup suggestion, not evidence that it will outperform another style.'
    : 'Start with a straightforward loading pattern. Limited frequency, unknown experience or returning/inconsistent training does not justify extra programming complexity.';
  if(!valid)reason='Choose 2–5 distinct days within your saved availability before using a loading-style suggestion.';
  return {version:VERSION,status:valid?'ready':'needs-review',style,styleLabel:labels[style],reason,
   availableDays:[...available],selectedDays:[...chosen],reviewRequired:true,
   supportedStyles:Object.keys(labels),trainingMaxKg:null,
   notice:(meet?'Meet dates determine peak, taper and event weeks separately. ':'')+'This is an explainable interface default, not a prescribed load or inferred 1RM. Confirm competition lift mappings, training maxes and exact sets before saving.'};
 }
 return {VERSION,labels,recommend};
});
