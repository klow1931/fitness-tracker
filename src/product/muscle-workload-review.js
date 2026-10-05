/* Reviewed workload context and descriptive comparisons. Never edits prescriptions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./training-knowledge'),require('./schedule'),require('../core/loadnote-core'),require('./session-intent'),require('./programming-profile'));
 else root.LoadnoteMuscleReview=factory(root.LoadnoteTrainingKnowledge,root.LoadnoteSchedule,root.LoadnoteCore,root.LoadnoteIntent,root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(K,Schedule,Core,Intent,Profile){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),date=Schedule.date,iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const shift=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 function context(raw){
  if(!raw||!['unknown','complete','incomplete'].includes(raw.coverage)||!['unknown','tolerated','needs-review','discomfort'].includes(raw.tolerance))throw Error('Choose coverage and reported training tolerance');
  const from=raw.from||null,through=raw.through||null;
  if(raw.coverage!=='unknown'&&(!date(from)||!date(through)||from>through))throw Error('Declare the exact history coverage range');
  const targets={};if(!raw.targets||typeof raw.targets!=='object'||Array.isArray(raw.targets))throw Error('Invalid workload targets');
  for(const [k,t]of Object.entries(raw.targets)){
   if(!Object.hasOwn(K.MUSCLES,k)||!t||!Number.isInteger(t.min)||!Number.isInteger(t.max)||t.min<0||t.max<t.min||t.max>50||typeof t.restricted!=='boolean')throw Error('Choose valid reviewed direct-set ranges (0–50 software limit) and restrictions');
   targets[k]={min:t.min,max:t.max,restricted:t.restricted};
  }
  return {coverage:raw.coverage,from:raw.coverage==='unknown'?null:from,through:raw.coverage==='unknown'?null:through,tolerance:raw.tolerance,targets};
 }
 function validate(records){
  if(!Array.isArray(records)||records.length>500)throw Error('Invalid workload profile history');let last='',ids=new Set();
  return records.slice().sort((a,b)=>String(a?.recordedAt).localeCompare(String(b?.recordedAt))).map(r=>{if(!r||r.version!==1||typeof r.id!=='string'||!r.id||r.id.length>160||ids.has(r.id)||!iso(r.recordedAt)||r.recordedAt<=last)throw Error('Invalid or ambiguous workload profile revision');ids.add(r.id);last=r.recordedAt;return {version:1,id:r.id,recordedAt:r.recordedAt,context:context(r.context)};});
 }
 function current(records,knownAt){return validate(records||[]).filter(r=>!knownAt||r.recordedAt<=knownAt).at(-1)||null;}
 function save(state,raw,{now=new Date().toISOString(),expected=null}={}){
  const before=current(state.workloadProfiles);if(JSON.stringify(before)!==JSON.stringify(expected))throw Error('Workload context changed. Reopen the review form.');
  const value=context(raw);if(value.through&&value.through>now.slice(0,10))throw Error('Do not confirm future history completeness');
  return {...state,workloadProfiles:validate([...(state.workloadProfiles||[]),{version:1,id:Core.createId(),recordedAt:now,context:value}])};
 }
 function week(state,asOf,profile){
  const actual=K.workload(state,{asOf}),from=actual.from;
  const sessions=Schedule.list(Schedule.validate(state.scheduledSessions||[])).filter(s=>s.date>=from&&s.date<=asOf);
  const plans=[],plannedIds=new Set();let ambiguous=0,latePlans=0,completedSessions=0,unconfirmedSessions=0,skippedSessions=0,mismatchedSessions=0;
  for(const s of sessions){
   if(s.status!=='scheduled'){skippedSessions++;continue;}
   const linked=(state.workouts||[]).filter(w=>w.sessionIntent?.schedule?.id===s.id&&w.date===s.date);
   if(linked.length>1){ambiguous++;continue;}
   const w=linked[0],p=w?.sessionIntent?.prescription||s.prescription;
   // Linked workouts use the performed prescription; unscheduled original plans stay unknown.
   if(!p||Intent.planTiming(p,s.date,w?.sessionIntent?.timing)!=='before-training'||w&&(!iso(w.createdAt)||p.capturedAt>w.createdAt)){latePlans++;continue;}
   plans.push({date:s.date,exercises:p.plannedExercises||[]});plannedIds.add(s.id);
   if(w){
    completedSessions++;let mismatch=false;
    for(const e of p.plannedExercises||[]){if(e.type==='cardio'||e.type==='practice'||e.trackBy==='duration')continue;const matches=(w.exercises||[]).filter(a=>a.exerciseId===e.exerciseId&&a.type!=='cardio'&&a.trackBy!=='duration');const actualSets=matches.flatMap(a=>(a.sets||[]).filter(t=>t.done!==false&&t.completed!==false&&!t.skipped&&!t.warmup&&t.type!=='warmup'));
     if(matches.length!==1||actualSets.length!==e.sets.length)mismatch=true;
     for(let i=0;i<e.sets.length;i++){const t=e.sets[i],a=actualSets[i];if(!a||!Number.isFinite(a.weight)||!Number.isFinite(t.weight)||Math.abs(a.weight-t.weight)>.02||!Number.isInteger(a.reps)||a.reps<(t.minReps??t.reps)||a.reps>(t.maxReps??t.reps))mismatch=true;}
    }
    if(mismatch)mismatchedSessions++;
   }else unconfirmedSessions++;
  }
  const planned=K.workload({...state,workouts:plans},{asOf});
  const independent=(state.workouts||[]).filter(w=>date(w.date)&&w.date>=from&&w.date<=asOf&&!plannedIds.has(w.sessionIntent?.schedule?.id)).length;
  const complete=profile?.coverage==='complete'&&profile.from<=from&&profile.through>=asOf;
  const protectedIntent=sessions.some(s=>['deload','recovery','testing'].includes(s.role)||/\b(deload|taper(?:ing)?|peak(?:ing)?|meet|mock)\b/i.test(s.name))||(state.workouts||[]).some(w=>w.date>=from&&w.date<=asOf&&['deload','recovery','testing'].includes(w.sessionIntent?.role));
  return {from,through:asOf,actual,planned,plannedSessions:plans.length,coverage:complete?'athlete-declared complete':profile?.coverage==='incomplete'?'athlete-declared incomplete':'unknown',complete,completedSessions,unconfirmedSessions,skippedSessions,ambiguous,latePlans,independent,protectedIntent,mismatchedSessions};
 }
 function performance(state,from,through){
  const result=[],catalog=new Map((state.exerciseCatalog||[]).map(e=>[e.id,e]));
  for(const w of state.workouts||[]){if(!date(w.date)||w.date<from||w.date>through)continue;
   for(const e of w.exercises||[]){let m;try{m=K.mapping(catalog.get(e.exerciseId)?.muscles);}catch{}if(m?.mode!=='resistance'||e.type==='cardio'||e.trackBy==='duration')continue;
    const sets=(e.sets||[]).filter(s=>s.done!==false&&s.completed!==false&&!s.skipped&&!s.warmup&&s.type!=='warmup');
    if(!sets.length||sets.some(s=>!Number.isFinite(s.weight)||s.weight<0||s.weight>1000||!Number.isInteger(s.reps)||s.reps<1||!Number.isFinite(s.rpe)||s.rpe<1||s.rpe>10))continue;
    result.push({exerciseId:e.exerciseId,name:catalog.get(e.exerciseId)?.name||e.name,date:w.date,primary:m.primary,loads:sets.map(s=>s.weight),reps:sets.reduce((n,s)=>n+s.reps,0),effort:sets.reduce((n,s)=>n+s.rpe,0)/sets.length});
   }
  }
  const byId=new Map();for(const r of result){const list=byId.get(r.exerciseId)||[];list.push(r);byId.set(r.exerciseId,list);}
  return [...byId.values()].map(rows=>{
   rows.sort((a,b)=>a.date.localeCompare(b.date));const latest=rows.at(-1),sameDay=rows.filter(r=>r.date===latest.date).length;
   const previous=rows.slice(0,-1).reverse().find(r=>r.date<latest.date&&JSON.stringify(r.loads)===JSON.stringify(latest.loads)&&rows.filter(x=>x.date===r.date).length===1);
   const comparable=sameDay===1&&!!previous&&Math.abs(previous.effort-latest.effort)<=1;
   return {exerciseId:latest.exerciseId,name:latest.name,primary:latest.primary,latest,previous:previous||null,comparable,repChange:comparable?latest.reps-previous.reps:null};
  });
 }
 function analyze(state,{asOf}={}){
  if(!date(asOf))throw Error('Choose a valid review date');const saved=current(state.workloadProfiles),profile=saved?.context||null;
  const weeks=Array.from({length:4},(_,i)=>week(state,shift(asOf,-7*i),profile));const trends=performance(state,weeks.at(-1).from,asOf),findings={};
  const avoided=Profile.current(state.programmingProfiles||[])?.context?.avoidedExerciseIds||[];
  for(const [k,label]of Object.entries(K.MUSCLES)){
   const recent=weeks.slice(0,2),target=profile?.targets[k]||null,reasons=[],g=weeks[0].actual.groups[k];
   const comparable=trends.filter(t=>t.primary.includes(k)&&t.comparable),declining=comparable.some(t=>t.repChange<0);
   const gaps=recent.some(w=>!w.complete||w.actual.unmappedSets||w.actual.incompleteSets||w.actual.groups[k].effortUnknown||w.ambiguous||w.latePlans||w.unconfirmedSessions||w.skippedSessions||w.mismatchedSessions||w.planned.unmappedSets||w.planned.incompleteSets);
   const upcoming=Schedule.list(state.scheduledSessions||[]).filter(s=>s.status==='scheduled'&&s.date>asOf&&s.date<=shift(asOf,7));
   const protectedIntent=recent.some(w=>w.protectedIntent)||upcoming.some(s=>['deload','recovery','testing'].includes(s.role)||/\b(deload|taper(?:ing)?|peak(?:ing)?|meet|mock)\b/i.test(s.name)),avoidedWork=trends.some(t=>t.primary.includes(k)&&avoided.includes(t.exerciseId));
   let status='gather',direction=null;
   if(!target)reasons.push('No athlete-reviewed direct-set target. Choose a range or leave this muscle descriptive only.');
   if(gaps)reasons.push('Two-week comparison has coverage, mapping, effort, plan-timing or completion gaps. Missing work is not zero training.');
   if(profile?.tolerance!=='tolerated')reasons.push(profile?.tolerance==='discomfort'?'Discomfort was reported. No workload adjustment is proposed; seek appropriate professional guidance.':'Reported tolerance is unknown or needs review.');
   if(target?.restricted)reasons.push('This muscle is restricted. No increase is proposed; review its existing workload and constraints manually.');
   if(!comparable.length)reasons.push('No comparable same-load, same-set-count sessions with similar recorded effort.');
   if(declining)reasons.push('Comparable rep performance declined; do not infer that more work is needed.');
   if(protectedIntent)reasons.push('Deload, recovery, testing or event intent is present. Preserve its design and use the existing program review.');
   if(avoidedWork)reasons.push('Logged work includes an exercise marked avoided in your programming profile. Review that restriction first.');
   if(target&&!gaps&&profile?.tolerance==='tolerated'&&!target.restricted&&comparable.length&&!declining&&!protectedIntent&&!avoidedWork){
    const below=recent.every(w=>w.actual.groups[k].direct<target.min),above=recent.every(w=>w.actual.groups[k].direct>target.max);
    if(below||above){status='review-adjustment';direction=below?'review-more-work':'review-less-work';reasons.push('Two consecutive seven-day windows are '+(below?'below':'above')+' your reviewed range. Revisit the target and program before changing training.');}
    else {status='hold';reasons.push('Evidence does not support changing workload under this conservative review rule. Hold the reviewed plan.');}
   }
   findings[k]={muscle:k,label,status,direction,target,direct:g.direct,indirect:g.indirect,planned:weeks[0].planned.groups[k].direct,reasons,performance:comparable,nextCheckpoint:'Log the next comparable exposure with actual effort; review again after the next seven-day window.'};
  }
   return {version:1,asOf,weeks,trends,findings,profile:saved,readOnly:true,policy:'workload-review-v1',notice:'Current corrected history and current confirmed mappings; athlete-declared coverage is not independently verified. '+(!profile||profile.coverage==='unknown'?'History completeness is unknown. ':'')+'No program targets are changed.'};
 }
 function explain(report,muscles=[]){
  const selected=muscles.length?muscles:Object.keys(report.findings).filter(k=>report.findings[k].target||report.findings[k].direct||report.findings[k].indirect);
  return selected.map(k=>{const f=report.findings[k];if(!f)return '';const values=report.weeks.map(w=>w.actual.groups[k].direct).join(' / ');return `${f.label}: ${f.status}. This window: ${f.direct} direct sets, ${f.indirect} indirect exposures. Direct sets across four seven-day windows (newest first): ${values}; ${report.weeks[0].plannedSessions?f.planned+' planned direct sets':'planned workload unknown (no usable scheduled prescription)'}. ${f.target?`Reviewed range: ${f.target.min}–${f.target.max} direct sets.`:'No reviewed target.'} ${f.reasons.join(' ')} ${f.nextCheckpoint}`;}).join(' ')||'Confirm muscle mappings and a workload context to inspect individualized reviews.';
 }
 return {context,validate,current,save,analyze,explain};
});
