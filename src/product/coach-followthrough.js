/* Program follow-through coordinates existing validated reviews; it never applies them. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./program-lifecycle'),require('./weekly-coaching'),require('./custom-program-weekly-review'),require('./coach-longitudinal'),require('./schedule'),require('./coach-support'),require('./decision-readiness'));else root.LoadnoteCoachFollowthrough=factory(root.LoadnoteProgramLifecycle,root.LoadnoteWeeklyCoaching,root.LoadnoteCustomProgramWeeklyReview,root.LoadnoteLongitudinalCoach,root.LoadnoteSchedule,root.LoadnoteCoachSupport,root.LoadnoteReadiness);})(typeof globalThis!=='undefined'?globalThis:this,function(Lifecycle,Weekly,Custom,Long,Schedule,Support,Readiness){
 'use strict';
 const NOTICE='Logged outcomes describe what happened. They do not establish a training change caused improvement, medical readiness, or permission to increase targets. Future changes require the existing reviewed workflow and your approval.';
 const wants=q=>!/\b(?:calories|protein|nutrition|diet|bodyweight|weight loss)\b/i.test(q)&&/\b(?:is (?:my|this) (?:program|plan) working|am i on track|program follow.?through|review (?:my )?program results|what needs (?:to )?chang(?:e|ing) next week|what should (?:we|i) review next|compare (?:my )?plan (?:with|to) results)\b/i.test(q);
 function inspect(state,{asOf,now=new Date().toISOString(),programId=null,programKind=null,question=''}={}){
  if(!Schedule.date(asOf)||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now||asOf>now.slice(0,10))throw Error('Choose a valid review date');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
  // Rather than let future cancellation metadata alter a past review, ask for
  // the current dated review. The owning engine remains authoritative.
  if((state.programCancellations||[]).some(c=>c.revisions?.some(r=>r.recordedAt>cutoff)))throw Error('Later cancellation history exists. Review at the current date before interpreting program follow-through.');
  const all=Lifecycle.programs(state).filter(p=>p.record.scheduledAt<=cutoff&&(!p.record.createdAt||p.record.createdAt<=cutoff));
  let candidates=all.filter(p=>p.startDate<=asOf&&p.endDate>=asOf);
  const named=all.filter(p=>String(question).toLowerCase().includes(p.name.toLowerCase()));
  if(programId)candidates=all.filter(p=>p.id===programId&&(!programKind||p.kind===programKind));
  else if(named.length)candidates=named;
  else if(!candidates.length){const end=all.filter(p=>p.endDate<asOf).map(p=>p.endDate).sort().at(-1);candidates=all.filter(p=>p.endDate===end);}
  if(candidates.length!==1){const logs=Readiness.workoutsAt(state,asOf,cutoff,false).workouts;return {status:candidates.length?'ambiguous':'empty',candidates:candidates.map(p=>({id:p.id,kind:p.kind,name:p.name,startDate:p.startDate,endDate:p.endDate,linkedLogs:logs.filter(w=>w.createdAt&&w.createdAt<=cutoff&&String(w.sessionIntent?.schedule?.id||'').startsWith(p.prefix)).length})),notice:NOTICE,readOnly:true};}
  const p=candidates[0],program={id:p.id,kind:p.kind,name:p.name},options={asOf,now:cutoff,programId:p.id,programKind:p.kind};
  let review,summary,route;
  if(p.kind==='custom-program'){
   const raw=Custom.inspect(state,p.id,options);const {checkIn,...safe}=raw;review=safe;summary=Custom.explain(raw);route='custom';
  }else if(['meet-cycle','phase-program'].includes(p.kind)){review=Weekly.review(state,options);summary=Weekly.summary(review);route='weekly';}
  else return {status:'dedicated',program,summary:'Review this plan through its dedicated '+(p.kind==='sport-program'?'sport':'muscle-growth')+' review. Powerlifting adjustment rules cannot be substituted for it.',notice:NOTICE,readOnly:true};
  let outcomes=null;try{outcomes=Long.inspect(state,{asOf,now:cutoff}).learning;}catch{}
  return {status:review.status,program,review,summary,route,outcomes:outcomes?{recorded:outcomes.recorded,observed:outcomes.observed,unobserved:outcomes.unobserved}:null,asOf,cutoff,notice:NOTICE,readOnly:true};
 }
 function explain(r){
  if(r.status==='empty')return 'No single scheduled program is available for this date. Review or schedule a plan first.';
  if(r.status==='ambiguous')return 'Which program should I review? '+r.candidates.map(p=>p.name).join('; ')+'. Program evidence will not be combined.';
  const outcomes=r.outcomes?' Across the saved approved-change history, '+r.outcomes.observed+' of '+r.outcomes.recorded+' changes have observed follow-up. Those totals are not proof this program caused an improvement.':'';
  return (r.summary||'A validated review is not available.')+outcomes+' '+r.notice;
 }
 function answer(state,question,options={}){
  if(!wants(question)||Support.health(question)||Support.kind(question)==='urgent-support')return null;
  try{const r=inspect(state,{...options,question});return {text:explain(r),source:'Offline Coach · program follow-through',readOnly:true,intent:{topic:'program-followthrough'},evidence:[r],actions:[{kind:'coach-followthrough',label:r.status==='ambiguous'?'Choose the program to review':'Review plan and logged results',programId:r.program?.id,programKind:r.program?.kind}],followUps:['What are my saved coaching preferences?']};}
  catch{return {text:'The program evidence could not be validated for this date. Review saved program history and dates before interpreting results. No change was proposed.',source:'Offline Coach · program follow-through unavailable',readOnly:true,evidence:[],actions:[{kind:'lifecycle',label:'Review program status'}]};}
 }
 return {wants,inspect,explain,answer,NOTICE};
});
