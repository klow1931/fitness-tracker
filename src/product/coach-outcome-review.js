/* v3.85 — explain approved change provenance and exact follow-up coverage.
 * This module interprets only Learning's exact linked workout evidence.
 * It does not invent causes, preferences, programming doses, or a new policy.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./adaptive-outcome-learning'),require('./coach-support'),require('./schedule'),require('./phase-review'),require('./cycle-review'));
 else root.LoadnoteCoachOutcomeReview=factory(root.LoadnoteAdaptiveOutcomeLearning,root.LoadnoteCoachSupport,root.LoadnoteSchedule,root.LoadnotePhaseReview,root.LoadnoteCycleReview);
})(typeof globalThis!=='undefined'?globalThis:this,function(Learning,Support,Schedule,PhaseReview,CycleReview){
 'use strict';
 const SOURCE='Offline Coach · approved training outcomes';
 const LIMIT='Results after an approved change are descriptive associations, not proof that the change caused them. They do not authorize a new load, set count, or automatic progression.';
 const lifts=['squat','bench','deadlift'];
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,400);
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const percentage=n=>(n>0?'+':'')+Math.round(n*10)/10+'%';
 // These classifications describe only what the existing Learning engine
 // could validate. They are not diagnoses, causal conclusions, or new rules
 // for deciding whether to progress training.
 const reasons={
  'baseline-incomplete':'Baseline linked sessions are incomplete',
  'followup-incomplete':'Follow-up linked sessions are incomplete',
  'baseline-estimate-missing':'Baseline RPE-aware estimate is unavailable',
  'followup-estimate-missing':'Follow-up RPE-aware estimate is unavailable',
  'comparison-unavailable':'Comparable before-and-after result is unavailable'
 };
 const validPair=x=>Number.isInteger(x?.expected)&&x.expected>0&&Number.isInteger(x?.matched)&&x.matched>=0&&x.matched<=x.expected;
 function classifyEvidence(row){
  if(row?.status==='observed'&&finite(row.capacityChangePct))return 'observed';
  if(validPair(row?.baseline)&&row.baseline.matched<row.baseline.expected)return 'baseline-incomplete';
  if(validPair(row?.followup)&&row.followup.matched<row.followup.expected)return 'followup-incomplete';
  if(!finite(row?.baseline?.capacityKg)||row.baseline.capacityKg<=0)return 'baseline-estimate-missing';
  if(!finite(row?.followup?.capacityKg)||row.followup.capacityKg<=0)return 'followup-estimate-missing';
  return 'comparison-unavailable';
 }
 function coverageOf(rows){
  const gaps=Object.fromEntries(Object.keys(reasons).map(k=>[k,0])),list=Array.isArray(rows)?rows:[];
  for(const row of list){const status=classifyEvidence(row);if(Object.hasOwn(gaps,status))gaps[status]++;}
  const missing=Object.entries(gaps).filter(([,count])=>count>0).map(([code,count])=>({code,count,label:reasons[code]}));
  return {version:1,recorded:list.length,observed:list.length-missing.reduce((sum,x)=>sum+x.count,0),
   unobserved:missing.reduce((sum,x)=>sum+x.count,0),missing,
   latest:list.length?{reason:classifyEvidence(list[0]),label:reasons[classifyEvidence(list[0])]||'Exact follow-up comparison available',
    baseline:validPair(list[0]?.baseline)?{matched:list[0].baseline.matched,expected:list[0].baseline.expected}:null,
    followup:validPair(list[0]?.followup)?{matched:list[0].followup.matched,expected:list[0].followup.expected}:null}:null};
 }
 const liftMatches=q=>lifts.filter(l=>new RegExp('\\b'+(l==='deadlift'?'(?:deadlift|sumo)':l)+'\\b','i').test(q));
 function intent(question){
  const q=String(question||'');
  if(!q.trim()||Support.health(q)||Support.kind(q)==='urgent-support')return null;
  if(/\b(?:uploaded|imported|custom|athlete.authored)\b.{0,28}\b(?:program|plan)\b/i.test(q))return null;
  // Preserve the existing exercise-history route: "how did my bench training
  // change across my last three workouts?" compares logged sessions, not
  // athlete-approved prescription changes.
  // A bare verb "change" is not evidence that a Decisions review was approved.
  const explicitApproval=/\b(?:approved|athlete.approved)\b/i.test(q);
  const namedAdjustment=/\b(?:adjustments?|approved decisions?|load increases?|load reductions?|reduced loads?|increased loads?)\b/i.test(q);
  const retrospectiveChange=/\bafter\b.{0,100}\b(?:last|past|previous)\b.{0,75}\b(?:changes?|adjustments?)\b/i.test(q)||
   /\b(?:last|past|previous)\b.{0,40}\b(?:squat|bench|deadlift|sumo)\b.{0,35}\b(?:changes?|adjustments?)\b/i.test(q);
  // Explicit questions about *missing approved outcomes* are routed to a
  // coverage explanation, not an invented cause or fresh programming advice.
  const coverageAsk=/\b(?:why|what|which|show|explain|review|how)\b/i.test(q)&&
   /\b(?:missing|incomplete|unknown|unobserved|not (?:observed|comparable)|(?:no|not enough) (?:comparable )?(?:evidence|follow-?ups?))\b/i.test(q)&&
   /\b(?:approved|adjustments?|decisions?|follow-?ups?|programming changes?)\b/i.test(q);
  if(coverageAsk)return {kind:'coverage',lifts:liftMatches(q),action:null};
  // Only requests for a *past approved* adjustment use frozen review reasons.
  // Live proposals continue through Decisions; workout history stays separate.
  const whyApproved=/\b(?:why|reason|explain)\b/i.test(q)&&/\b(?:approved|loadnote)\b/i.test(q)&&
    /\b(?:change(?:s|d)?|adjustment(?:s)?|reduc(?:e|ed|tion)|increas(?:e|ed)|sets?|loads?|weights?)\b/i.test(q)&&
    !/\b(?:what happened after|how did .* (?:respond|work)|did .* help|missing|incomplete|unknown|unobserved|usually|pattern)\b/i.test(q);
  if(whyApproved)return {kind:'rationale',lifts:liftMatches(q),action:null};
  // Keep the historic approval gate for every other retrospective request.
  // Questions naming Loadnote itself explicitly are handled above.
  if(!explicitApproval&&!namedAdjustment&&!retrospectiveChange)return null;

  if(!/\b(?:change(?:s|d)?|adjustment(?:s)?|decision(?:s)?|progression|increase(?:s|d)?|reduction(?:s)?|reduce(?:d)?|outcome(?:s)?)\b/i.test(q))return null;
  if(!/\b(?:what happened|how (?:did|has|have)|have|has|did|do|what (?:have|has)|show|review|explain|did those|after|usually|pattern|result)\b/i.test(q))return null;
  if(!/\b(?:after|last|past|previous|approved|helped|worked|respond|learned|outcome|usually|pattern|result)\b/i.test(q))return null;
  const selected=liftMatches(q);
  // Do not steal general "what did Loadnote learn?" questions from the
  // already-shipped longitudinal Coach.
  if(!selected.length&&!/\b(?:last|past|previous)\s+approved\s+(?:training|program|load)\s+(?:change|adjustment)\b/i.test(q))return null;
  const filter=/\b(?:load increases?|increased? loads?|increasing loads?)\b/i.test(q)?'increase-load':
   /\b(?:load reductions?|reduced? loads?|decreasing loads?)\b/i.test(q)?'reduce-load':null;
  return {kind:/\b(?:usually|pattern|repeated|over time|history|learned|past (?:few|several)|previous (?:few|several))\b/i.test(q)?'pattern':'latest',lifts:selected,action:filter};
 }
 function inspect(state,{asOf,now=new Date().toISOString(),lift,action=null}={}){
  if(!Schedule.date(asOf)||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now||!lifts.includes(lift))throw Error('Valid date and one confirmed competition lift required');
  if(action!==null&&!['increase-load','reduce-load'].includes(action))throw Error('Unsupported action filter');
  const learning=Learning.analyze(state,{asOf,now});
  const rows=(learning.rows||[]).filter(r=>r.lift===lift&&(!action||r.action===action))
   .sort((a,b)=>String(b.acceptedAt).localeCompare(String(a.acceptedAt))||String(a.reviewId).localeCompare(String(b.reviewId)));
  const patterns=(learning.summary?.patterns||[]).filter(p=>p.lift===lift&&(!action||p.action===action));
  const latest=rows[0]||null;
  const observed=rows.filter(r=>r.status==='observed'&&finite(r.capacityChangePct));
  const missing=rows.length-observed.length,coverage=coverageOf(rows);
  return {version:1,asOf,lift,action,kind:'approved-outcomes',recorded:rows.length,observed:observed.length,unobserved:missing,
   latest:latest?{acceptedAt:latest.acceptedAt,scope:latest.scope,programName:clean(latest.programName),action:clean(latest.action),
     status:latest.status,baseline:{status:latest.baseline?.status||null,matched:latest.baseline?.matched??null,expected:latest.baseline?.expected??null},
     followup:{status:latest.followup?.status||null,matched:latest.followup?.matched??null,expected:latest.followup?.expected??null},
     capacityChangePct:latest.status==='observed'&&finite(latest.capacityChangePct)?latest.capacityChangePct:null}:null,
   coverage,
   patterns:patterns.map(p=>({action:p.action,recorded:p.recorded,observed:p.observed,unobserved:p.unobserved,
     counts:{...p.counts},medianCapacityChangePct:p.observed>=3&&finite(p.medianCapacityChangePct)?p.medianCapacityChangePct:null,
     evidence:p.evidence,description:clean(p.pattern)})).slice(0,4),notice:LIMIT};
 }
 // The Learning engine establishes eligible saved approvals and their exact
 // review IDs. Validation of the original frozen review is the authority for
 // the action and rationale, not a fresh decision or inferred cause.
 function rationale(state,{asOf,now=new Date().toISOString(),lift}={}){
  if(!Schedule.date(asOf)||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now||!lifts.includes(lift))throw Error('Valid historical rationale date and lift required');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
  const rows=Learning.analyze(state,{asOf,now:cutoff}).rows.filter(r=>r.lift===lift&&r.acceptedAt<=cutoff)
   .sort((a,b)=>String(b.acceptedAt).localeCompare(String(a.acceptedAt))||String(a.reviewId).localeCompare(String(b.reviewId)));
  if(!rows.length)return {version:1,lift,status:'none',asOf,knownAt:cutoff,readOnly:true,reason:null};
  const chosen=rows[0];
  let event=null,reason=null,policy=null,reviewType=null;
  if(chosen.scope==='phase'){
   event=PhaseReview.validate(state.phaseReviews||[]).find(r=>r.id===chosen.reviewId&&r.programId===chosen.programId);
   if(event&&event.choices[lift]===chosen.action){reason=event.findings[lift]?.reason;policy=event.policy;reviewType='completed '+event.phase+' phase';}
  }else if(chosen.scope==='cycle'){
   const cycles=CycleReview.validate(state);
   event=cycles.find(c=>c.id===chosen.programId)?.weeklyReviews?.find(r=>r.id===chosen.reviewId);
   if(event&&event.choices[lift]===chosen.action){
    const f=event.report?.findings?.[lift]||{};
    reason=chosen.action==='reduce-one'?f.setReason:chosen.action==='reduce-load'?f.loadReason:
     chosen.action==='increase-load'?f.increaseReason:null;
    policy=event.policy;reviewType='week '+event.week+' meet-cycle';
   }
  }
  // In historical policies a reason may not have been persisted. Do not
  // substitute today's policy or construct a hypothetical explanation.
  const verified=event&&event.createdAt===chosen.acceptedAt&&typeof reason==='string'&&reason.trim().length>0;
  return {version:1,lift,status:verified?'verified':'unavailable',asOf,knownAt:cutoff,readOnly:true,reviewId:chosen.reviewId,
    approvedAt:chosen.acceptedAt,scope:chosen.scope,reviewType:verified?reviewType:null,programName:clean(chosen.programName),
    action:clean(chosen.action),policy:verified?clean(policy):null,reason:verified?clean(reason):null,
    followup:chosen.status==='observed'&&finite(chosen.capacityChangePct)?
     {status:'observed',capacityChangePct:chosen.capacityChangePct}:{status:'unobserved',capacityChangePct:null},
    notice:'This is the rationale recorded at approval, not proof of the athlete’s motive or that the change caused the subsequent performance. No future prescription was altered.'};
 }
 function explainRationale(report){
  if(report.status==='none')return 'No eligible saved athlete-approved '+report.lift+' adjustment was recorded through '+report.asOf+
   '. I cannot explain an approval that is not in the validated history. Review Decisions if you expected one.';
  if(report.status!=='verified')return 'The latest saved '+report.lift+' adjustment exists, but its original approved reason could not be validated. I will not substitute a current recommendation or guess its rationale.';
  const observed=report.followup.status==='observed'?
   'An exact linked RPE-aware follow-up estimate changed '+percentage(report.followup.capacityChangePct)+' after the approval. This is descriptive, not causal.':
   'An exact comparable follow-up outcome is not established; the effect is unknown.';
  return 'Your latest athlete-approved '+report.lift+' change was '+report.action+' on '+report.approvedAt.slice(0,10)+
   ' for '+(report.programName||'a reviewed program')+' ('+report.reviewType+'). The saved review stated: '+report.reason+
   ' This was recorded under '+report.policy+'. '+observed+' '+report.notice+
   ' Review its original accepted decision and linked sessions in Decisions and Progress.';
 }
 function explain(report,kind){
  const lift=report.lift,latest=report.latest;
  if(!report.recorded)return 'No eligible athlete-approved '+lift+' programming changes were found through '+report.asOf+
   '. There is no verified personal response to compare. Use Decisions to review actual logged evidence rather than assuming a change worked.';
  const head=report.observed+' of '+report.recorded+' approved '+lift+' changes have usable exact linked follow-ups; '+
   report.unobserved+' have no validated comparison. Missing RPE, incomplete logging or later revised targets remain unknown.';
  if(kind==='coverage'){
   if(!report.unobserved)return head+' All eligible approved changes have exact comparable follow-up in the current saved evidence. '+LIMIT;
   const list=report.coverage.missing.map(x=>x.count+' '+x.label.toLowerCase()).join('; ');
   const recent=report.coverage.latest,latestDetail=recent?.reason!=='observed'?
    ' For the latest approval: '+recent.label+'.'+
    (recent.baseline?' Baseline matched '+recent.baseline.matched+'/'+recent.baseline.expected+' linked sessions.':'')+
    (recent.followup?' Follow-up matched '+recent.followup.matched+'/'+recent.followup.expected+' linked sessions.':''):
    ' The latest approval has a comparable outcome; earlier approvals may still have gaps.';
   return head+' Evidence gaps: '+list+'.'+latestDetail+
    ' A missing estimate or unmatched session can have more than one cause; this review cannot attribute it to a particular missed workout or absent RPE. '+
    LIMIT+' Next: inspect the exact saved workout and approved target in Progress and Decisions.';
  }
  if(kind==='pattern'){
   const groups=report.patterns;
   const lines=groups.length?groups.slice(0,3).map(p=>p.action+': '+p.observed+'/'+p.recorded+
    ' exact follow-ups; '+(p.observed>=3?'improved '+p.counts.improved+', stable '+p.counts.stable+', declined '+p.counts.declined+
    (finite(p.medianCapacityChangePct)?'; median RPE-aware estimate change '+percentage(p.medianCapacityChangePct):'; median change unavailable')+'. '+p.description:
    'fewer than three observed follow-ups. No repeated personal pattern is established.')).join(' '):
    'No reviewed lift-action group is available.';
   return head+' '+lines+' '+LIMIT+' Next: inspect the linked workouts in Progress and keep any future decision inside Decisions.';
  }
  const status=latest.status==='observed'&&finite(latest.capacityChangePct)?
   'The comparable RPE-aware capacity estimate changed '+percentage(latest.capacityChangePct)+' after approval.':
   'No exact comparable follow-up is established for this approval.';
  const gap=latest.status==='observed'?'':' Evidence gap: '+report.coverage.latest.label+'.';
  const counts=Number.isInteger(latest.followup?.expected)&&Number.isInteger(latest.followup?.matched)?
   ' '+latest.followup.matched+'/'+latest.followup.expected+' follow-up sessions are validated.':'';
  return head+' The latest approved change was '+clean(latest.action)+' for '+(latest.programName||'a reviewed program')+
   ' on '+latest.acceptedAt.slice(0,10)+'. '+status+counts+gap+' '+LIMIT+
   ' Next: inspect the saved workout evidence in Progress; any future change still requires the Decisions approval flow.';
 }
 function answer(state,question,{asOf,now}={}){
  const ask=intent(question);if(!ask)return null;
  if(ask.lifts.length!==1)return {text:ask.lifts.length?'Which lift should I review first: squat, bench or deadlift?':'Which competition lift should I review: squat, bench or deadlift?',
   source:SOURCE,readOnly:true,evidence:[],actions:[],intent:{topic:'approved-outcomes',needsClarification:true}};
  if(ask.kind==='rationale'){
   let original;
   try{original=rationale(state,{asOf,now,lift:ask.lifts[0]});}
   catch{return {text:'I could not validate the saved approved-change history. Open Decisions to review it; nothing was changed.',source:SOURCE,readOnly:true,evidence:[],actions:[],intent:{topic:'approved-rationale',unavailable:true}};}
   return {text:explainRationale(original),source:SOURCE,readOnly:true,evidence:[original],
    evidenceCards:[{title:'Saved approved '+original.lift+' rationale',status:original.status==='verified'?'observed':'unavailable',
      observed:original.status==='verified'?original.action+' · '+original.approvedAt.slice(0,10)+' · '+original.reviewType:'No verifiable original rationale.',
      limitation:'Approval-time evidence is not proof of a training benefit or a fresh programming decision.',source:'Accepted Decisions review · frozen policy'}],
    intent:{topic:'approved-rationale',lift:original.lift},actions:[{kind:'progress',label:'Review recorded lift history'}],
    followUps:['What happened after my last '+original.lift+' adjustment?']};
  }
  let report;try{report=inspect(state,{asOf,now,lift:ask.lifts[0],action:ask.action});}
  catch{return {text:'I could not validate the exact approved adjustment history for that lift. Review Decisions and the linked workouts; no change was made.',
   source:SOURCE,readOnly:true,evidence:[],actions:[],intent:{topic:'approved-outcomes',lift:ask.lifts[0],unavailable:true}};}
  const text=explain(report,ask.kind);
  return {text,source:SOURCE,readOnly:true,evidence:[report],
   evidenceCards:[{title:'Approved '+report.lift+' follow-ups',status:report.observed?'observed':report.recorded?'limited':'unavailable',
     observed:report.observed+' of '+report.recorded+' approved changes have exact comparable linked follow-up.',
     limitation:'Unobserved changes cannot be graded; observed changes do not establish causality.',source:SOURCE}],
   insight:{version:2,lift:report.lift,scope:ask.kind,recorded:report.recorded,observed:report.observed,coverage:report.coverage,
     latest:report.latest,patterns:ask.kind==='pattern'?report.patterns:[]},
   intent:{topic:'approved-outcomes',lift:report.lift,scope:ask.kind},
   actions:[{kind:'progress',label:'Review recorded lift history'}],
   followUps:['Which '+report.lift+' adjustments have missing comparable evidence?','What have we learned from my program changes?']};
 }
 return {intent,inspect,rationale,explainRationale,explain,answer,classifyEvidence,coverageOf,LIMIT};
});