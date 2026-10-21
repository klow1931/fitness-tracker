/* v3.77 — concise, attributed evidence and bounded program-option comparisons.
 * Deterministic and read-only. The underlying weekly review owns eligibility.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'),require('./weekly-coaching'));
 else root.LoadnoteCoachEvidenceOptions=factory(root.LoadnoteCoachSupport,root.LoadnoteWeeklyCoaching);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support,Weekly){
 'use strict';
 const clean=s=>String(s??'').replace(/\s+/g,' ').trim().slice(0,260);
 const count=n=>Number.isInteger(n)&&n>=0?n:null;
 const card=(title,status,observed,limitation,source)=>({title:clean(title),status,observed:clean(observed),limitation:clean(limitation),source:clean(source)});
 const failure=(title,source)=>card(title,'unavailable','The source evidence could not be validated.','No programming change is supported from this result.',source||'Unavailable');
 function summarize(kind,row,asOf){
  const source=clean(row?.source||'Unavailable'),e=row?.evidence?.[0];
  if(!e||typeof e!=='object')return failure(({performance:'Performance trend',weekly:'Weekly training',upcoming:'Next workout',recap:'Training recap'})[kind]||'Training evidence',source);
  if(kind==='performance'){
   if(e.status==='unmapped')return card('Performance trend','limited','Competition-lift identity needs confirmation.','Confirm the exercise mapping; no trend or load change is established.',source);
   if(!['higher','lower','similar','insufficient'].includes(e.status))return failure('Performance trend',source);
   const good=e.status!=='insufficient',base=count(e.baselineDays),recent=count(e.recentDays);
   return card('Performance trend',good?'observed':'limited',
    (e.name||'Mapped lift')+': '+(good?e.status+' RPE-aware capacity evidence':'insufficient comparable RPE-aware days')+(base!==null&&recent!==null?' ('+base+' earlier / '+recent+' recent days).':''),
    'This is an estimated training trend, not a tested maximum or a verified cause.',source);
  }
  if(kind==='weekly'){
   if(e.status!=='ready')return card('Weekly training','limited','Weekly review: '+clean(e.status||'unavailable')+'.','No specific adjustment is established until the saved program and completed week are validated.',source);
   const groups=Array.isArray(e.groups)?e.groups:[],matched=groups.reduce((n,g)=>n+(count(g.comparedSets)||0),0),
    planned=groups.reduce((n,g)=>n+(count(g.plannedSets)||0),0),
    gaps=groups.some(g=>g.status==='gather'),over=groups.reduce((n,g)=>n+(count(g.aboveCap)||0),0);
   return card('Weekly training',gaps?'limited':'observed',
    'Week '+e.week+': '+matched+'/'+planned+' sets with comparable effort; '+over+' above cap'+(gaps?'; some work remains unverified.':'.'),
    'Only the existing Decisions review can approve a future target change.',source);
  }
  if(kind==='upcoming'){
   if(e.status!=='ready'||!e.session)return card('Next workout','limited','No unique verified scheduled session for the requested window.','Check Calendar before interpreting an upcoming prescription.',source);
   const provenance=Array.isArray(e.reasons)&&e.reasons.length>0;
   return card('Next workout',provenance?'limited':'observed',clean(e.session.date)+' · '+clean(e.session.name||'Saved session')+'.',
    provenance?'Saved targets have an unresolved source or revision warning.':'These are approved Calendar targets, not a new prescription.',source);
  }
  if(kind==='recap'){
   if(e.status!=='ready')return failure('Training recap',source);
   const sessions=count(e.observed?.sessions),sets=count(e.observed?.sets),rpe=count(e.observed?.rpeSets);
   return card('Training recap',sessions===null||sets===null||rpe===null?'limited':'observed',
    sessions===null?'Recorded-work counts are not available.':sessions+' workouts, '+sets+' eligible strength sets, '+rpe+' with recorded RPE in the latest 28-day window.',
    'Missing RPE is unknown; logged performance does not establish the cause of any change.',source);
  }
  return failure('Training evidence',source);
 }
 function differences(cards,evidence){
  const trend=evidence.performance?.evidence?.[0],week=evidence.weekly?.evidence?.[0];
  if(!trend||!week||week.status!=='ready')return [];
  const gathering=Array.isArray(week.groups)&&week.groups.some(g=>g.status==='gather');
  if(trend.status==='insufficient'&&week.proposal?.status==='review')
   return ['A scheduled weekly proposal exists, but the performance trend has insufficient comparable RPE-aware days. These are different evidence questions; do not treat the proposal as proof of increased capacity.'];
  if(trend.status==='higher'&&(gathering||week.groups?.some(g=>g.aboveCap>0)))
   return ['The mapped lift has higher estimated capacity while the weekly execution review has missing or above-cap effort. Neither observation overrides the other; use the existing reviewed program policy.'];
  return [];
 }
 const wantsComparison=q=>/\b(?:compare|comparison|options|alternatives)\b.{0,100}\b(?:weekly|next week|last week|this week|program|plan|targets|adjustments)\b|\b(?:keep|maintain)\b.{0,60}\b(?:versus|vs\.?|or)\b.{0,60}\b(?:review|adjust|change)\b.{0,50}\b(?:plan|program|week|targets)\b/i.test(q);
 function compare(report){
  const status=report?.status,proposal=report?.proposal;
  if(status!=='ready')return {status:'unavailable',asOf:report?.asOf||null,options:[],
    explanation:'A unique completed-week review is not available ('+clean(status||'invalid')+'). No future change is proposed. Open Decisions to confirm the saved program and completed weeks.'};
  const gaps=Array.isArray(report.groups)?report.groups.filter(g=>g.status==='gather').map(g=>clean(g.name)+': '+clean(g.reason)).slice(0,2):[];
  const keep={id:'keep',label:'Keep saved targets',status:'available',
   reason:'The current approved Calendar targets remain in force until a separate Decisions approval.'};
  const n=Array.isArray(proposal?.changes)?proposal.changes.length:0;
  let second;
  if(proposal?.status==='review'&&n>0){
   second={id:'review',label:'Review existing proposal',status:'review-available',
    reason:n+' future session(s) have an exact preview in Decisions. Only its explicit approval can apply them; Coach does not choose or schedule an adjustment.'};
  }else if(proposal?.status==='phase-review'){
   second={id:'phase-review',label:'Review completed phase',status:'review-available',
    reason:'The saved program reached a supported phase review. No next-week load change is claimed here.'};
  }else if(proposal?.status==='approved'){
   second={id:'already-approved',label:'Review existing approved targets',status:'already-approved',
    reason:'A saved review was already approved. This comparison does not reopen or duplicate it.'};
  }else{
   second={id:'evidence',label:'Collect or validate more evidence',status:'not-ready',
    reason:gaps[0]||'No separate supported target-change preview is available for this completed week.'};
  }
  return {status:'ready',asOf:report.asOf||null,week:report.week,program:report.program?.name||null,
   options:[keep,second],gaps,proposalStatus:clean(proposal?.status),changesPreviewed:n,
   explanation:'These are existing workflow choices, not competing new prescriptions. No option is auto-selected. The athlete must open Decisions and approve any actual change.'};
 }
 function answer(state,question,{asOf,now}={}){
  const original=String(question??'');
  if(!original.trim()||Support?.health(original)||Support?.kind(original)==='urgent-support'||!wantsComparison(original))return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf||''))
   return {text:'Choose a valid training review date before comparing program options.',source:'Offline Coach · reviewed program options',readOnly:true,evidence:[],actions:[]};
  let report;
  try{report=Weekly.review(state,{asOf,now});}catch{report={status:'invalid'};}
  const choice=compare(report),readOnly=true;
  if(choice.status!=='ready')return {text:choice.explanation,source:'Offline Coach · reviewed program options',readOnly,evidence:[report],comparison:choice,
   actions:[{kind:'weekly-coaching',label:'Open weekly review'}]};
  const text='Week '+choice.week+' · '+choice.program+'. '+choice.options.map(o=>o.label+': '+o.reason).join('\n\n')+
   (choice.gaps.length?'\n\nEvidence to check: '+choice.gaps.join('; ')+'.':'')+'\n\n'+choice.explanation;
  return {text,source:'Offline Coach · reviewed program options',readOnly,evidence:[report],comparison:choice,
   evidenceCards:[summarize('weekly',{source:'Shared coaching · weekly review',evidence:[report]},asOf)],
   actions:[{kind:'weekly-coaching',label:'Open weekly review'}],
   intent:{topic:'reviewed-options'},followUps:['How did this week go?','Explain my next workout']};
 }
 return {summarize,differences,wantsComparison,compare,answer};
});