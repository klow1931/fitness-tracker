/* v3.78 — precise, read-only explanations of approved change outcomes.
 * This module interprets only Learning's exact linked workout evidence.
 * It does not invent causes, preferences, programming doses, or a new policy.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./adaptive-outcome-learning'),require('./coach-support'),require('./schedule'));
 else root.LoadnoteCoachOutcomeReview=factory(root.LoadnoteAdaptiveOutcomeLearning,root.LoadnoteCoachSupport,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Learning,Support,Schedule){
 'use strict';
 const SOURCE='Offline Coach · approved training outcomes';
 const LIMIT='Results after an approved change are descriptive associations, not proof that the change caused them. They do not authorize a new load, set count, or automatic progression.';
 const lifts=['squat','bench','deadlift'];
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,400);
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const percentage=n=>(n>0?'+':'')+Math.round(n*10)/10+'%';
 const liftMatches=q=>lifts.filter(l=>new RegExp('\\b'+(l==='deadlift'?'(?:deadlift|sumo)':l)+'\\b','i').test(q));
 function intent(question){
  const q=String(question||'');
  if(!q.trim()||Support.health(q)||Support.kind(q)==='urgent-support')return null;
  if(/\b(?:uploaded|imported|custom|athlete.authored)\b.{0,28}\b(?:program|plan)\b/i.test(q))return null;
  if(!/\b(?:change(?:s|d)?|adjustment(?:s)?|decision(?:s)?|progression|increase(?:s|d)?|reduction(?:s)?|reduce(?:d)?|outcome(?:s)?)\b/i.test(q))return null;
  if(!/\b(?:what happened|how (?:did|has|have)|have|has|did|what (?:have|has)|show|review|explain|did those|after|usually|pattern|result)\b/i.test(q))return null;
  if(!/\b(?:after|last|past|previous|approved|helped|worked|respond|learned|outcome|usually|pattern|result)\b/i.test(q))return null;
  const selected=liftMatches(q);
  // Do not steal general "what did Loadnote learn?" questions from the
  // already-shipped longitudinal Coach.
  if(!selected.length&&!/\b(?:last|past|previous)\s+approved\s+(?:training|program|load)\s+(?:change|adjustment)\b/i.test(q))return null;
  const filter=/\b(?:load increases?|increased? loads?|increasing loads?)\b/i.test(q)?'increase-load':
   /\b(?:load reductions?|reduced? loads?|decreasing loads?)\b/i.test(q)?'reduce-load':null;
  return {kind:/\b(?:usually|pattern|repeated|over time|history|past (?:few|several)|previous (?:few|several))\b/i.test(q)?'pattern':'latest',lifts:selected,action:filter};
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
  const missing=rows.length-observed.length;
  return {version:1,asOf,lift,action,kind:'approved-outcomes',recorded:rows.length,observed:observed.length,unobserved:missing,
   latest:latest?{acceptedAt:latest.acceptedAt,scope:latest.scope,programName:clean(latest.programName),action:clean(latest.action),
     status:latest.status,baseline:{status:latest.baseline?.status||null,matched:latest.baseline?.matched??null,expected:latest.baseline?.expected??null},
     followup:{status:latest.followup?.status||null,matched:latest.followup?.matched??null,expected:latest.followup?.expected??null},
     capacityChangePct:latest.status==='observed'&&finite(latest.capacityChangePct)?latest.capacityChangePct:null}:null,
   patterns:patterns.map(p=>({action:p.action,recorded:p.recorded,observed:p.observed,unobserved:p.unobserved,
     counts:{...p.counts},medianCapacityChangePct:p.observed>=3&&finite(p.medianCapacityChangePct)?p.medianCapacityChangePct:null,
     evidence:p.evidence,description:clean(p.pattern)})).slice(0,4),notice:LIMIT};
 }
 function explain(report,kind){
  const lift=report.lift,latest=report.latest;
  if(!report.recorded)return 'No eligible athlete-approved '+lift+' programming changes were found through '+report.asOf+
   '. There is no verified personal response to compare. Use Decisions to review actual logged evidence rather than assuming a change worked.';
  const head=report.observed+' of '+report.recorded+' approved '+lift+' changes have usable exact linked follow-ups; '+
   report.unobserved+' have no validated comparison. Missing RPE, incomplete logging or later revised targets remain unknown.';
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
  const counts=Number.isInteger(latest.followup?.expected)&&Number.isInteger(latest.followup?.matched)?
   ' '+latest.followup.matched+'/'+latest.followup.expected+' follow-up sessions are validated.':'';
  return head+' The latest approved change was '+clean(latest.action)+' for '+(latest.programName||'a reviewed program')+
   ' on '+latest.acceptedAt.slice(0,10)+'. '+status+counts+' '+LIMIT+
   ' Next: inspect the saved workout evidence in Progress; any future change still requires the Decisions approval flow.';
 }
 function answer(state,question,{asOf,now}={}){
  const ask=intent(question);if(!ask)return null;
  if(ask.lifts.length!==1)return {text:ask.lifts.length?'Which lift should I review first: squat, bench or deadlift?':'Which competition lift should I review: squat, bench or deadlift?',
   source:SOURCE,readOnly:true,evidence:[],actions:[],intent:{topic:'approved-outcomes',needsClarification:true}};
  let report;try{report=inspect(state,{asOf,now,lift:ask.lifts[0],action:ask.action});}
  catch{return {text:'I could not validate the exact approved adjustment history for that lift. Review Decisions and the linked workouts; no change was made.',
   source:SOURCE,readOnly:true,evidence:[],actions:[],intent:{topic:'approved-outcomes',lift:ask.lifts[0],unavailable:true}};}
  const text=explain(report,ask.kind);
  return {text,source:SOURCE,readOnly:true,evidence:[report],
   evidenceCards:[{title:'Approved '+report.lift+' follow-ups',status:report.observed?'observed':report.recorded?'limited':'unavailable',
     observed:report.observed+' of '+report.recorded+' approved changes have exact comparable linked follow-up.',
     limitation:'Unobserved changes cannot be graded; observed changes do not establish causality.',source:SOURCE}],
   insight:{version:1,lift:report.lift,scope:ask.kind,recorded:report.recorded,observed:report.observed,
     latest:report.latest,patterns:ask.kind==='pattern'?report.patterns:[]},
   intent:{topic:'approved-outcomes',lift:report.lift,scope:ask.kind},
   actions:[{kind:'progress',label:'Review recorded lift history'}],
   followUps:['What have we learned from my program changes?','How did this week go?']};
 }
 return {intent,inspect,explain,answer,LIMIT};
});