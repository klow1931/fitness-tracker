/* v3.73 — evidence-based weekly reviews for athlete-authored programs.
 * Check-ins are explicit athlete reports. Observations never change Calendar targets.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./custom-program'),require('./schedule'),require('./workout-feedback'));
 else root.LoadnoteCustomProgramWeeklyReview=factory(root.LoadnoteCustomProgram,root.LoadnoteSchedule,root.LoadnoteWorkoutFeedback);
})(typeof globalThis!=='undefined'?globalThis:this,function(Custom,Schedule,Feedback){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const advance=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 const CHOICES={sleep:['unknown','adequate','poor'],fatigue:['unknown','usual','elevated'],soreness:['unknown','usual','elevated'],sessionExperience:['unknown','as-planned','modified']};
 const NOTICE='Training observations are descriptive, not a diagnosis, measured recovery score, proof of causation or a new prescription. Unconfirmed dates are not silently treated as skipped. Changes require an athlete-reviewed program copy and separate future-only Calendar approval.';
 function validate(records){
  if(!Array.isArray(records)||records.length>3000)throw Error('Invalid custom-program weekly check-in history');
  const ids=new Set();return records.map(r=>{
   if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.programId!=='string'||!r.programId||r.programId.length>160||!Number.isInteger(r.week)||r.week<1||r.week>52||!Schedule.date(r.from)||!Schedule.date(r.through)||r.through!==advance(r.from,6)||!iso(r.createdAt)||r.through>r.createdAt.slice(0,10)||!r.checkIn||typeof r.checkIn.notes!=='string'||r.checkIn.notes.length>1000)throw Error('Invalid custom-program weekly check-in');
   for(const [name,choices] of Object.entries(CHOICES))if(!choices.includes(r.checkIn[name]))throw Error('Invalid '+name+' report');
   ids.add(r.id);return {version:1,id:r.id,programId:r.programId,week:r.week,from:r.from,through:r.through,createdAt:r.createdAt,checkIn:{...Object.fromEntries(Object.keys(CHOICES).map(k=>[k,r.checkIn[k]])),notes:r.checkIn.notes.trim()}};
  });
 }
 function validateState(state){
  const programs=new Map(Custom.validate(state?.customPrograms||[]).map(p=>[p.id,p]));
  return validate(state?.customProgramWeeklyReviews||[]).map(r=>{
   const p=programs.get(r.programId),from=p&&advance(p.config.startDate,(r.week-1)*7);
   if(!p||r.week>p.config.weeks||r.from!==from||r.through!==advance(from,6))throw Error('Weekly check-in refers to a missing or mismatched program week');
   return r;
  });
 }
 function inspect(state,id,{week=null,asOf,now=new Date().toISOString()}={}){
  if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Choose a valid review date');
  const p=Custom.validate(state.customPrograms||[]).find(p=>p.id===id);
  if(!p)throw Error('This saved program is unavailable');
  if(!p.scheduledAt||p.scheduledAt>now)return {status:'unscheduled',name:p.config.name,notice:NOTICE};
  const available=Array.from({length:p.config.weeks},(_,i)=>({week:i+1,from:advance(p.config.startDate,i*7),through:advance(p.config.startDate,i*7+6)})).filter(w=>w.through<=asOf);
  const selected=week==null?available.at(-1):available.find(w=>w.week===week);
  if(week!=null&&!selected)throw Error('Choose a completed program week');
  if(!selected)return {status:'waiting',name:p.config.name,through:advance(p.config.startDate,6),notice:NOTICE};
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
  const sessions=Schedule.rows(state.scheduledSessions||[],state.workouts||[],{asOf,knownAt:cutoff}).filter(s=>s.id.startsWith('custom:'+id+':')&&s.date>=selected.from&&s.date<=selected.through);
  const expected=p.sessions.filter(s=>s.week===selected.week);
  const totals={planned:expected.length,completed:0,skipped:0,cancelled:0,unconfirmed:0,unavailable:0,comparable:0,different:0,matchedSets:0,plannedSets:0,effortCompared:0,aboveCap:0,missingEffort:0};
  const rows=[];
  for(const planned of expected){
   const s=sessions.find(x=>x.id==='custom:'+id+':'+planned.key);
   const stateName=s?.state||'unavailable';
   if(Object.hasOwn(totals,stateName))totals[stateName]++;
   const matching=(state.workouts||[]).filter(w=>w.sessionIntent?.schedule?.id===s?.id&&w.date<=asOf&&w.createdAt&&w.createdAt<=cutoff);
   let comparison=null;
   if(stateName==='completed'&&matching.length===1){
    const w=matching[0],linkedRevision=(state.scheduledSessions||[]).find(x=>x.id===s.id)?.revisions.find(v=>v.recordedAt===w.sessionIntent.schedule.revisionAt);
    if(linkedRevision&&linkedRevision.recordedAt<=w.createdAt&&linkedRevision.context.prescription?.source?.referenceId===id)comparison=Feedback.compare(w);
   }
   if(comparison){totals.matchedSets+=comparison.matchedSets;totals.plannedSets+=comparison.plannedSets;totals.effortCompared+=comparison.effortCompared;totals.aboveCap+=comparison.aboveCap;totals.missingEffort+=comparison.missingRpe;if(['within-cap','above-cap'].includes(comparison.status))totals.comparable++;else totals.different++;}
   else if(stateName==='completed')totals.different++;
   rows.push({id:s?.id||null,date:planned.date,name:planned.name,status:stateName,comparison:comparison?.status||null,reasons:comparison?.reasons||[]});
  }
  const reviews=validateState(state).filter(r=>r.programId===id&&r.week===selected.week&&r.createdAt<=cutoff).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const latest=reviews.at(-1)||null,observations=[];
  if(totals.unconfirmed)observations.push({kind:'gather',label:'Resolve scheduled sessions',reason:totals.unconfirmed+' earlier date(s) lack an explicit outcome. Do not infer a skip or completion.'});
  if(totals.skipped)observations.push({kind:'review',label:'Review the planned week',reason:totals.skipped+' session(s) were explicitly skipped. Consider whether the next scheduled week still fits your availability; no replacement is added.'});
  if(totals.aboveCap>=2)observations.push({kind:'review',label:'Review effort targets',reason:totals.aboveCap+' exactly comparable strength sets exceeded their saved RPE caps. Check logging and context before considering any future load or set edits.'});
  if(totals.different||totals.missingEffort)observations.push({kind:'gather',label:'Complete the evidence',reason:totals.different+' logged session(s) could not be fully compared; '+totals.missingEffort+' otherwise matched strength sets lack actual RPE. Modified work is not automatically a failure.'});
  if(latest&&(latest.checkIn.sleep==='poor'||latest.checkIn.fatigue==='elevated'||latest.checkIn.soreness==='elevated'))observations.push({kind:'review',label:'Discuss reported recovery',reason:'Your own check-in reports a possible recovery concern. This is subjective, not a medical assessment or automatic reason to adjust training.'});
  if(!observations.length)observations.push({kind:'maintain',label:'Continue the reviewed plan',reason:totals.comparable?'Comparable logs are within reported effort caps. This does not by itself establish that the next load should increase.':'Not enough exact completed evidence to recommend a change. Keep the reviewed targets or consult your coach.'});
  return {status:'ready',programId:id,programName:p.config.name,week:selected.week,weeks:available,from:selected.from,through:selected.through,totals,rows,checkIn:latest,checkInCount:reviews.length,observations,canEditFuture:!p.replacedBy,notice:NOTICE};
 }
 function save(state,id,week,raw,{asOf,now=new Date().toISOString(),confirmed=false}={}){
  if(!confirmed||!iso(now))throw Error('Confirm your self-report before saving');
  const r=inspect(state,id,{week,asOf,now});if(r.status!=='ready')throw Error('Wait until the selected program week is complete');
  const checkIn={notes:String(raw?.notes??'').trim()};if(checkIn.notes.length>1000)throw Error('Keep notes under 1000 characters');
  for(const [field,values] of Object.entries(CHOICES)){if(!values.includes(raw?.[field]))throw Error('Choose '+field+' or Not reported');checkIn[field]=raw[field];}
  const entry={version:1,id:'custom_week_'+now.replace(/\W/g,'')+'_'+Math.random().toString(36).slice(2,9),programId:id,week,from:r.from,through:r.through,createdAt:now,checkIn};
  const next={...state,customProgramWeeklyReviews:[...(state.customProgramWeeklyReviews||[]),entry]};return {...next,customProgramWeeklyReviews:validateState(next)};
 }
 function explain(r){if(r.status!=='ready')return r.status==='waiting'?'The first full week ends '+r.through+'. A completed-week review is not available yet.':'Schedule a reviewed custom program before inspecting weekly training evidence.';
  return r.programName+' · week '+r.week+' ('+r.from+'–'+r.through+'): '+r.totals.completed+'/'+r.totals.planned+' sessions linked, '+r.totals.skipped+' explicitly skipped, '+r.totals.unconfirmed+' unconfirmed. '+r.totals.comparable+' fully comparable log(s), '+r.totals.matchedSets+'/'+r.totals.plannedSets+' strength sets with matching logged targets, '+r.totals.effortCompared+' with actual RPE, '+r.totals.aboveCap+' above cap. '+r.observations.map(o=>o.label+': '+o.reason).join(' ')+' '+NOTICE;
 }
 return {validate,validateState,inspect,save,explain,CHOICES,NOTICE};
});
