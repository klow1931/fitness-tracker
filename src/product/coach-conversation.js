/* Read-only local conversation: fresh evidence on every turn, session-only topic memory. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./decision-readiness'),require('./companion-intelligence'),require('./training-knowledge'),require('./muscle-workload-review'),require('./sport-training'),require('./hypertrophy-builder'),require('./sport-planner'),require('./coaching-context'),require('./smart-coach'),require('./program-cancellation'));
 else root.LoadnoteCoachConversation=factory(root.LoadnoteReadiness,root.LoadnoteCompanionIntelligence,root.LoadnoteTrainingKnowledge,root.LoadnoteMuscleReview,root.LoadnoteSportTraining,root.LoadnoteHypertrophyBuilder,root.LoadnoteSportPlanner,root.LoadnoteCoachingContext,root.LoadnoteSmartCoach,root.LoadnoteProgramCancellation);
})(typeof globalThis!=='undefined'?globalThis:this,function(Readiness,Intelligence,Knowledge,Workload,Sport,Hyp,Planner,Unified,Smart,Cancellation){
 'use strict';
 const Support=typeof module==='object'&&module.exports?require('./coach-support'):globalThis.LoadnoteCoachSupport;
 const clean=x=>String(x??'').replace(/\s+/g,' ').trim().slice(0,500);
 const liftOf=q=>/\b(bench|press)\b/i.test(q)?'bench':/\b(deadlift|sumo)\b/i.test(q)?'deadlift':/\b(squat)\b/i.test(q)?'squat':null;
 function topic(q){
  if(Support?.health(q))return 'health';
  if(/\b(training goal|training priorit|primary goal|secondary goal|practice schedule|sport schedule|conditioning|game days)\w*\b/i.test(q))return 'training-context';
  const domain=Knowledge?.classify(q);if(domain)return domain;
  if(/\b(accessor|biceps|triceps|upper back|quad|core)\w*\b/i.test(q))return 'accessories';
  if(/\b(training max|1rm|one.rep max|estimated capacity|benchmark)\b/i.test(q))return 'benchmarks';
  if(/\b(progress|increase|add weight|plateau|stronger|trend|ready|readiness)\w*\b/i.test(q))return 'evidence';
  if(/\b(rpe|effort|failure)\b/i.test(q))return 'effort';
  if(/\b(program|phase|week|deload|taper|peak|meet)\w*\b/i.test(q))return 'program';
  if(/\b(why.*set|why.*load|why.*weight|last time|previous)\b/i.test(q))return 'session';
  return null;
 }
 function resolve(question,history=[]){
  const q=clean(question),explicitLift=liftOf(q),explicitTopic=topic(q);
  const follow=/^(why\??|how so\??|tell me more\.?|explain (that|more)\.?|what about (it|that|(my )?(bench|squat|deadlift))\??|and (my )?(bench|squat|deadlift)\??)$/i.test(q);
  let prior=null;
  // Never search across a clear topic change or reuse assistant assertions as evidence.
  const bounded=history.slice(-8);for(let i=bounded.length-1;i>=0;i--){const row=bounded[i];if(row.role!=='user')continue;prior=resolve(row.content,bounded.slice(0,i));break;}
  const muscles=Object.entries(Knowledge?.MUSCLES||{}).filter(([k,v])=>new RegExp('\\b'+(k==='quadriceps'?'quad\\w*':v.toLowerCase())+'\\b','i').test(q)).map(([k])=>k);
  const muscleProgression=!explicitLift&&prior?.topic==='hypertrophy'&&/^(should i |do i |can i )?(add|increase) (sets|weight|load)\??$/i.test(q);
  const sportProgression=!explicitLift&&['athlete','weightlifting','training-context'].includes(prior?.topic)&&/^(should i |do i |can i )?(add|increase) (sets|weight|load)\??$/i.test(q);
  return {question:q,lift:explicitLift||(follow?prior?.lift:null)||null,topic:muscleProgression?'hypertrophy':sportProgression?prior.topic:explicitTopic||(follow?prior?.topic:null)||null,muscles:muscles.length?muscles:(follow||muscleProgression?prior?.muscles||[]:[]),referenceQuestion:follow||sportProgression||muscleProgression?prior?.referenceQuestion||prior?.question||q:q,follow};
 }
 function answer(state,question,{asOf,unit='kg',history=[],live=null,intelligence=null}={}){
  const intent=resolve(question,history),q=intent.question;
  if(intent.topic!=='health'){
   const exercise=(typeof module==='object'&&module.exports?require('./exercise-explanation'):globalThis.LoadnoteExerciseExplanation)?.answer(state,q,{history,live,intelligence});
   if(exercise)return {...exercise,intent};
  }
  const support=Support?.answer(q,{history,live});if(support)return support;
  const referenced=(typeof module==='object'&&module.exports?require('./coaching-library'):globalThis.LoadnoteCoachingLibrary)?.answer(state,q,{asOf,history});if(referenced)return referenced;
  const intake=(typeof module==='object'&&module.exports?require('./athlete-intake'):globalThis.LoadnoteAthleteIntake)?.answer(state,q);if(intake)return intake;
  if(intent.topic!=='health'&&Smart){const smart=Smart.answer(state,q,{asOf,history,live,sportLive:live?.sportWorkout||null});if(smart)return smart;}
  if(intent.topic!=='health'&&Unified){try{const unified=Unified.answer(state,q,{asOf,unit,history,live,sportLive:live?.sportWorkout||null});if(unified)return unified;}catch{/* Existing domain-specific evidence handlers remain available. */}}
  const result=(text,source='Built-in explanation',evidence=[])=>({text,source,evidence,intent,readOnly:true});
  if(intent.topic==='health')return result('I cannot diagnose pain or decide that an injured area is safe to load from your log. Describe the location, onset and what aggravates it to a qualified clinician. I can explain recorded training targets, but I will not prescribe injury rehabilitation.','Capability limit');
  if(intent.topic==='hypertrophy'&&Hyp&&/\b(program|plan|progression)\b/i.test(intent.referenceQuestion)){
   try{const programs=Hyp.validate(state.hypertrophyPrograms||[]).filter(r=>!Cancellation.isCancelled(state,r.id,'hypertrophy-program')&&r.scheduledAt&&r.config.startDate<=asOf&&r.weekly.at(-1).through>=asOf);if(programs.length===1){const report=Hyp.progression(state,programs[0].id,{asOf});return result(Hyp.explain(report),'Shared hypertrophy progression review',[report]);}return result(programs.length>1?'More than one hypertrophy plan covers today. Resolve overlapping programs before progression review.':'Build or schedule a reviewed hypertrophy plan in Decisions first; no exercise loads are inferred.','Hypertrophy programming policy');}catch{return result('Hypertrophy evidence could not be validated. Open Decisions to resolve it; no change is proposed.','Hypertrophy evidence unavailable');}
  }
  if(intent.topic==='hypertrophy'&&Workload){
   const source=Knowledge.SOURCES.hypertrophy;
   if(/\b(rest|rep range|failure)\b/i.test(q)&&!/\b(my|logged|recent)\b/i.test(q))return result(Knowledge.GUIDANCE.hypertrophy+' Source: '+source.title+' — '+source.url,source.title);
   let review;try{review=Workload.analyze(state,{asOf});}catch{return result('I could not validate the workload review. Open Decisions to resolve the data issue; no adjustment is proposed.','Workload evidence unavailable');}
   return result(Workload.explain(review,intent.muscles)+' '+review.notice+' Indirect exposure is not equivalent to direct sets. Open Decisions → Muscle workload → Individualized workload review to inspect or update the reviewed context. Source: '+source.title+' — '+source.url,'Shared workload review',[review]);
  }
  if(['athlete','weightlifting'].includes(intent.topic)&&Planner&&/\b(program|plan|progression)\b/i.test(intent.referenceQuestion)){
   try{const plans=Planner.validate(state.sportPrograms||[]).filter(p=>!Cancellation.isCancelled(state,p.id,'sport-program')&&p.scheduledAt&&p.config.mode===intent.topic&&p.config.startDate<=asOf&&p.weekly.at(-1).through>=asOf);if(plans.length===1){const report=Planner.review(state,plans[0].id,{asOf});return result(Planner.explain(report),'Shared sport-plan evidence',[report]);}return result(plans.length>1?'Multiple matching sport plans cover today; select and review one in Decisions.':'Build or schedule a dedicated reviewed sport plan in Decisions first. No loading or performance is inferred.','Sport planning policy');}catch{return result('Sport-plan evidence could not be validated. Open Decisions; no change is proposed.','Sport planning evidence unavailable');}
  }
  if(['athlete','weightlifting','training-context'].includes(intent.topic)&&Sport){
   let review;try{const candidates=Sport.select(state).candidates,named=candidates.filter(g=>g.name.length>=3&&intent.referenceQuestion.toLowerCase().includes(g.name.toLowerCase()));review=Sport.review(state,{asOf,goalId:named.length===1?named[0].id:undefined,domain:intent.topic==='training-context'?undefined:intent.topic});}catch{return result('I could not validate sport context. Open Decisions and resolve the data issue; no training change is proposed.','Sport context unavailable');}
   const guidance=['athlete','weightlifting'].includes(intent.topic)?Knowledge.GUIDANCE[intent.topic]:'';
   const source=Knowledge.SOURCES.athlete;return result(Sport.explain(review,{domain:intent.topic})+' '+guidance+' Open Decisions → Sport-aware training review, or Home → This week → Goals to review context. Source: '+source.title+' — '+source.url,'Shared sport-context review',[review]);
  }
  if(intent.topic==='accessories')return result('Accessories support the session beyond the primary and secondary lifts. In either builder, open Accessories, choose movements or use Suggest from my priorities, then confirm equipment and enter starting loads. You can include rep ranges, holds and conditioning. Suggestions reflect your stated priorities, not diagnosed weaknesses. Loads stay fixed until you review them. For rep work, review progression only after all prescribed sets reach the top of the range within the effort cap with complete effort evidence. Deload reduces accessory work; peak, taper and event sessions omit it. Assigned-group totals do not measure all indirect work or recovery. Which movement or session would you like to review?','Accessory programming policy');
  if(intent.topic==='effort')return result('RPE records how hard the completed work felt; a target RPE is the planned effort cap. Record actual effort rather than copying the target. Missing RPE is unknown, not zero. Low-RPE work can be intentional; Loadnote keeps logged load, training max and estimated capacity separate. Review deviations through Decisions rather than treating every completed set as permission to add weight. Are you asking about a specific set or your recent lift evidence?','Logged versus prescribed effort');
  if(intent.topic==='benchmarks'||intent.topic==='evidence'&&intent.lift){
   if(!intent.lift)return result('Which lift should we inspect: squat, bench or deadlift? Training max is a programming input, known 1RM is a reported/tested result, estimated capacity is performance-derived, and logged load is work performed. They are not interchangeable.');
   let snap;try{snap=Readiness.snapshot(state,{asOf,retrospective:true});}catch{return result('I could not validate the current evidence snapshot. Open Decisions and resolve the data issue before interpreting this lift.','Evidence unavailable');}
   const row=snap.lifts[intent.lift],m=row.metrics;
   const weight=x=>x==null?'not recorded':(Math.round(x*(unit==='lb'?2.2046226218:1)*10)/10)+' '+(unit==='lb'?'lb':'kg');
   let text=row.label+' — '+(row.competitionExercise||'competition exercise not mapped')+'. Current corrected evidence as of '+asOf+': '+m.sessions+' matching training days since '+snap.windowStart+'. ';
   const benchmark=x=>weight(x?.kg)+(x?.observedOn?' · observed '+x.observedOn:'');
   if(intent.topic==='benchmarks')text+='Training max: '+benchmark(row.evidence.trainingMax)+'. Known 1RM: '+benchmark(row.evidence.known1RM)+'. Legacy profile benchmark: '+weight(row.evidence.profileBenchmark?.kg)+' (legacy athlete profile; not a newly verified max). ';
   text+='Latest logged load: '+weight(row.evidence.loggedLoad?.kg)+(row.evidence.loggedLoad?.date?' on '+row.evidence.loggedLoad.date:'')+'. Latest estimated capacity: '+weight(row.evidence.estimatedCapacity?.kg)+(row.evidence.estimatedCapacity?.date?' on '+row.evidence.estimatedCapacity.date:'')+'. ';
   text+='Decision evidence: '+row.status+'. '+row.reasons.slice(0,3).join(' ');
   if(row.interpretation)text+=' '+row.interpretation;
   text+=' This describes evidence, not a tested max, historical as-recorded replay or an instruction to increase load. Review any adjustment in Decisions.';
   return result(text,'Current corrected lift evidence',row.reasons);
  }
  if(intent.topic==='evidence'&&/\b(increase|add weight|plateau|stronger|ready|readiness)\b/i.test(q))return result('Which lift should we inspect: squat, bench or deadlift? I will check its mapped evidence and limitations before discussing progression. Completing a session alone does not justify an automatic load increase.','Clarification');
  if(intent.topic==='session'&&/last time|previous/i.test(q))return result(live?.liveWorkout?.currentExercise?.set?.previous?'Previous comparison shown in the logger: '+live.liveWorkout.currentExercise.set.previous+'. This is recorded comparison context, not a new target.':'There is no previous-set comparison available in the current logger context. Name the movement and open its history to compare equivalent work.','Logger comparison');
  if(intent.topic==='program'){
   const life=intelligence?.lifecycle;
   if(life?.program){const p=life.progress||{};return result(life.program.name+': '+(p.phaseLabel||'reviewed program')+(p.week?' · week '+p.week+' of '+p.totalWeeks:'')+'. '+(p.purpose||'')+' Next workflow step: '+(life.nextAction?.label||'review the program')+'. '+(life.nextAction?.detail||'')+' This explains the stored program; it does not rewrite its targets.','Reviewed program lifecycle');}
   return result('There is no single active reviewed program in the current context. Open Programs to review and schedule one. Accumulation, strength, deload and meet phases have different purposes; the app keeps their reviewed targets fixed until an approved review changes future work. Which phase are you asking about?','Program context unavailable');
  }
  const existing=(Intelligence||globalThis.LoadnoteCompanionIntelligence)?.answer?.(intelligence,q);if(existing)return result(existing,'Descriptive training evidence');
  if(intent.topic==='evidence')return result('Which lift should we inspect: squat, bench or deadlift? I can describe recorded evidence and its gaps, but cannot infer a load increase from an unspecified movement.','Clarification');
  if(intent.follow)return result('What would you like me to explain: a lift’s evidence, an accessory, or the purpose of a program phase? I do not have a clear prior topic to resolve that follow-up.','Clarification');
  if(/\b(hello|hi|hey|thanks|thank you)\b/i.test(q))return result('I can help explain your lift evidence, accessory choices, effort targets and program phases. What would you like to look at?');
  return null;
 }
 return {resolve,answer};
});
