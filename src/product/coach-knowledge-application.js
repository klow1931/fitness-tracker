/* v3.82 — connect a vetted concept to verified setup, logs and reviewed program.
 * This is a read-only explanation layer, never a training-dose calculator.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./coach-evidence-brief'),require('./schedule'),require('./athlete-intake'),require('./progress-story'));
 else root.LoadnoteCoachKnowledgeApplication=factory(root.LoadnoteProgrammingProfile,root.LoadnoteCoachEvidenceBrief,root.LoadnoteSchedule,root.LoadnoteAthleteIntake,root.LoadnoteProgressStory);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Brief,Schedule,Intake,Story){
 'use strict';
 const SOURCE='Shared coaching · training context';
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,230);
 const count=n=>Number.isInteger(n)&&n>=0?n:null;
 const next='Any change to your future workouts must use the reviewed Decisions workflow and your approval.';
 const applicationQuestion=q=>/^(?:how (?:does|would|could) (?:that|this) apply (?:for|to) (?:me|my training)|how (?:can|should) i apply (?:that|this)(?: to my training)?|what does (?:that|this) mean for (?:me|my training))\??$/i.test(String(q||'').trim());
 function inspect(state,{asOf,card}={}){
  if(!Schedule?.date(asOf))return {status:'unavailable',reason:'The training review date is invalid.',asOf:asOf||null,profile:null,observed:null,program:null,topic:null};
  if(!card||typeof card.id!=='string'||!card.id)return {status:'unavailable',reason:'No confirmed educational topic was provided.',asOf,profile:null,observed:null,topic:null};
  let p=null,profileStatus='missing';
  try{
   const record=Profile.current(state?.programmingProfiles||[],asOf+'T23:59:59.999Z');
   if(record){p=record.context;profileStatus='saved';}
  }catch{profileStatus='unavailable';}
  let recap=null;
  try{recap=Brief.inspect(state,{asOf});}catch{}
  const raw=recap?.observed||{};
  const observed=recap&&count(raw.sessions)!==null&&count(raw.sets)!==null&&count(raw.rpeSets)!==null&&raw.rpeSets<=raw.sets?
   {status:'recorded',window:'most recent 28 days',sessions:raw.sessions,sets:raw.sets,rpeSets:raw.rpeSets,missingRpeSets:raw.sets-raw.rpeSets}:null;
  const profile=p?{goal:clean(Profile.GOALS[p.goal]||p.goal),experience:clean(p.experience),consistency:clean(p.consistency),
   availableDays:count(p.availableDays?.length),sessionMinutes:count(p.sessionMinutes),
   avoidedExercises:count(p.avoidedExerciseIds?.length),symptomHold:!!Intake?.active(p.intake)}:null;
  // Use the canonical Progress Story program selector. Only resolved Calendar
  // outcomes permit an adherence denominator; mere availability never does.
  let selected=null;
  try{selected=Story?.selectedProgram(state,{asOf}.asOf);}catch{}
  const c=selected?.counts||{},completed=count(c.completed),skipped=count(c.skipped),resolved=count(selected?.resolved);
  const program=selected&&typeof selected.id==='string'&&selected.id&&typeof selected.name==='string'&&
   completed!==null&&skipped!==null&&resolved===completed+skipped&&
   (resolved===0||Number.isFinite(selected.adherence)&&selected.adherence>=0&&selected.adherence<=100)?
   {id:selected.id,name:clean(selected.name),phase:clean(selected.progress?.phaseLabel||''),
    week:count(selected.progress?.week),totalWeeks:count(selected.progress?.totalWeeks),
    completed,skipped,resolved,adherence:resolved?selected.adherence:null,
    unconfirmed:count(c.unconfirmed),cancelled:count(c.cancelled)}:null;
  return {version:2,status:observed||profile||program?'ready':'limited',asOf,topic:card.id,profileStatus,profile,observed,program,
   notice:'Saved preferences and training logs are not proof of medical readiness, cause of progress, or an appropriate new training dose.'};
 }
 function explain(review){
  if(review.status==='unavailable')return 'I need a valid training date and a confirmed training principle before connecting this guidance to your own records. '+next;
  const p=review.profile,o=review.observed,lines=[];
  if(p){
   lines.push('Your saved setup says '+p.goal+', '+p.experience+' experience, '+p.consistency+' recent training consistency, '+p.availableDays+
    ' available day(s) per week and '+p.sessionMinutes+' minutes per session.');
   if(p.symptomHold)lines.push('Your athlete intake reports a current concern. This educational comparison does not clear you for loading or replace medical evaluation.');
   if(p.avoidedExercises)lines.push(p.avoidedExercises+' saved exercise exclusion(s) still need to be respected by any separately reviewed plan.');
  }else if(review.profileStatus==='unavailable')lines.push('Your saved training setup could not be validated, so I cannot use it to personalize this guidance.');
  else lines.push('Your training setup has not been saved. Confirm your goal, available days and equipment before judging how a training method fits.');
  if(o){
   lines.push('Your logs show '+o.sessions+' workout(s) and '+o.sets+' eligible strength set(s) in the most recent 28 days, with actual RPE on '+o.rpeSets+' set(s).');
   if(o.missingRpeSets)lines.push(o.missingRpeSets+' strength set(s) have no recorded actual RPE; their effort is unknown.');
  }else lines.push('I cannot verify a recent training recap from the saved records. That is missing evidence, not proof that you did not train.');
  if(review.program){
   const v=review.program,phase=v.phase?' in '+v.phase:'',week=v.week&&v.totalWeeks?' (week '+v.week+' of '+v.totalWeeks+')':'';
   lines.push('Your reviewed program '+v.name+phase+week+' has '+v.completed+' completed and '+v.skipped+' explicitly skipped resolved Calendar session(s) as of '+review.asOf+'. '+
    (v.resolved?'Adherence among its '+v.resolved+' resolved sessions is '+v.adherence+'%. ':'There are no resolved sessions from which to calculate adherence. ')+
    'Unconfirmed, upcoming and cancelled sessions are not counted as failures; this does not show that every planned session was completed.');
  }
  const topic=review.topic;
  if(topic==='training-frequency'){
   lines.push('Available training days describe your schedule, not verified adherence. Compare the exact scheduled sessions with completed logs in Progress and Decisions before considering frequency.');
  }else if(topic==='dynamic-effort'||topic==='conjugate'){
   lines.push('Your history does not establish measured bar speed or validate an individual dynamic-effort load. Compare your actual program, equipment and movement practice with the cited method before considering it.');
  }else if(topic==='deload-purpose'||topic==='workload'||topic==='workout-quality'){
   lines.push('Logged sessions and RPE can help review workload, but they do not measure physiological recovery or show that a deload is medically needed.');
  }else if(topic==='hypertrophy'){
   lines.push('Total eligible strength sets do not establish direct weekly work for each muscle group. Review your exact exercise and effort history before evaluating a hypertrophy program.');
  }else if(topic==='specificity'||topic==='phase-purpose'){
   lines.push('Check your current program phase and confirmed exercise identities. Assistance-lift performance cannot replace observed results on your competition lifts.');
  }else{
   lines.push('This source is general training guidance. Your recorded history and approved program remain the evidence for personal decisions.');
  }
  lines.push(review.notice);
  lines.push(next);
  return lines.join(' ');
 }
 function cards(review){
  const result=[];
  if(review.profile)result.push({title:'Saved training setup',status:'observed',
    observed:review.profile.goal+' · '+review.profile.availableDays+' days available · '+review.profile.sessionMinutes+' minutes per session.',
    limitation:'Athlete-authored availability and experience do not establish adherence or a safe training dose.',source:'Programming profile · saved athlete setup'});
  if(review.observed)result.push({title:'Recent logged training',status:'observed',
    observed:review.observed.sessions+' workouts · '+review.observed.sets+' strength sets · '+review.observed.rpeSets+' sets with recorded RPE in 28 days.',
    limitation:'Missing actual RPE remains unknown. A logged session is not proof of readiness.',source:'Progress story · dated workout logs'});
  if(review.program){
   const p=review.program;
   result.push({title:'Reviewed program and Calendar',status:'observed',
    observed:p.name+(p.phase?' · '+p.phase:'')+' · '+p.completed+' completed / '+p.resolved+' resolved session(s)'+
     (p.adherence===null?' · adherence unknown':' · '+p.adherence+'% resolved-session adherence'),
    limitation:'Only exact completed and explicitly skipped Calendar sessions enter the denominator; availability, upcoming and unconfirmed sessions do not.',
    source:'Progress story · reviewed program and resolved Calendar sessions'});
  }
  if(!result.length)result.push({title:'Personal training evidence',status:'unavailable',observed:'Saved profile or recent workout evidence could not be verified.',
   limitation:'No individualized programming inference is supported.',source:SOURCE});
  return result.slice(0,3);
 }
 function answer(state,{asOf,card}={}){
  const report=inspect(state,{asOf,card});
  return {text:explain(report),source:SOURCE,readOnly:true,evidence:[report],evidenceCards:cards(report),
   applicationReview:report,actions:[{kind:'progress',label:'Review recorded training'}]};
 }
 return {applicationQuestion,inspect,explain,cards,answer};
});