/* v3.75 — bounded read-only multi-evidence Coach orchestration.
 * Single-topic requests retain their established handlers. The coordinator
 * invokes existing validated analyses; it never creates a training dose.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('./coach-support'),require('./coach-performance-insights'),
  require('./weekly-coaching'),require('./workout-brief'),require('./coach-evidence-brief')
 );
 else root.LoadnoteCoachReasoning=factory(root.LoadnoteCoachSupport,root.LoadnoteCoachPerformanceInsights,root.LoadnoteWeeklyCoaching,root.LoadnoteWorkoutBrief,root.LoadnoteCoachEvidenceBrief);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support,Trends,Weekly,Workout,Recap){
 'use strict';
 const clean=text=>String(text??'').replace(/\s+/g,' ').trim().slice(0,500);
 const lifts=[['bench',/\bbench(?: press)?\b/i],['squat',/\bsquat(?:ting)?\b/i],['deadlift',/\b(?:deadlift|sumo)\b/i]];
 const blocked=/\b(?:build|create|generate|draft|write|design)\b.{0,70}\b(?:program|plan|workout|session)\b|\b(?:set|save|update|replace|remove|cancel|delete|change)\b.{0,70}\b(?:my (?:preferences|equipment|schedule|program)|training days|my profile)\b/i;
 const handlers=[
  {kind:'performance',label:'Performance',test:q=>/\b(?:stall(?:ed|ing)?|plateau(?:ed|ing)?|stagnat(?:e|ed|ing|ion)|not improv(?:ing|ed)|not (?:getting|becoming) stronger)\b/i.test(q)},
  {kind:'weekly',label:'Weekly training',test:q=>/\b(?:how did (?:my |this |last )?week go|weekly (?:review|coaching|training)|review (?:my |this |last )?week|what should i do next week)\b/i.test(q)},
  {kind:'upcoming',label:'Next scheduled workout',test:q=>/\b(?:next (?:planned )?(?:workout|session)|next week(?:'s)? workout|tomorrow(?:'s)? workout)\b/i.test(q)},
  {kind:'recap',label:'Recent training',test:q=>/\b(?:training recap|summari[sz]e my training|my recent training overview)\b/i.test(q)}
 ];
 // Follow-ups are resolved from a short sequence of athlete-authored turns.
 // No assistant reply, model completion or unsaved preference becomes evidence.
 const followLift=q=>lifts.filter(([,rx])=>rx.test(q)).map(([name])=>name);
 const simpleFollow=q=>/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo|next (?:workout|session)|next week)\??$|^(?:bench|squat|deadlift|sumo)[.!?]?$|^(?:why|how so|explain that|tell me more|what does that mean)\??$/i.test(q);
 const neutralReset=q=>/^(?:hello|hi|hey|thanks|thank you|new topic|start over)[.!?]*$/i.test(q);
 function lastCompound(history){
  const bounded=(Array.isArray(history)?history:[]).slice(-8).filter(t=>t&&t.role==='user');
  if(!bounded.length)return null;
  let narrowedLift=null,focusedKind=null;
  for(let i=bounded.length-1;i>=0;i--){
   const q=clean(bounded[i].content);
   if(!q||neutralReset(q)||Support.health(q)||Support.kind(q)==='urgent-support')return null;
   // A new independent athlete question terminates the previous referent.
   if(!simpleFollow(q)){
    const anchor=plan(q,[]);
    if(!anchor||!['ready','clarification'].includes(anchor.status))return null;
    return {anchor,preferredLift:narrowedLift,focusedKind};
   }
   const names=followLift(q);
   if(names.length===1&&narrowedLift===null)narrowedLift=names[0];
   if(focusedKind===null&&/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo)\??$/i.test(q))focusedKind='performance';
   if(focusedKind===null&&/^(?:(?:what|how) about|and) (?:my |the )?(?:next (?:workout|session)|next week)\??$/i.test(q))focusedKind='upcoming';
  }
  return null;
 }
 function followPlan(question,history){
  const q=clean(question);
  if(!simpleFollow(q))return null;
  const prior=lastCompound(history);if(!prior)return null;
  const {anchor,preferredLift,focusedKind}=prior,names=followLift(q);
  const full=anchor.kinds||[],hasPerformance=full.includes('performance');
  const questionIsLift=/^(?:bench|squat|deadlift|sumo)[.!?]?$/i.test(q);
  const liftOnly=/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo)\??$/i.test(q);
  const upcoming=/^(?:(?:what|how) about|and) (?:my |the )?(?:next (?:workout|session)|next week)\??$/i.test(q);
  const vague=/^(?:why|how so|explain that|tell me more|what does that mean)\??$/i.test(q);
  if((questionIsLift||liftOnly)&&hasPerformance){
   if(names.length!==1)return null;
   return {status:'ready',question:q,kinds:liftOnly?['performance']:full.slice(0,3),
    lift:names[0],follow:true,focus:liftOnly?'performance':'clarification'};
  }
  if(upcoming&&full.includes('upcoming'))return {status:'ready',question:q,kinds:['upcoming'],lift:null,
   follow:true,nextWeek:/next week/i.test(q)};
  if(vague&&focusedKind&&full.includes(focusedKind))return {status:'ready',question:q,kinds:[focusedKind],lift:preferredLift||anchor.lift||null,follow:true};
  if(vague&&full.length>1){
   const labels=full.map(kind=>handlers.find(h=>h.kind===kind)?.label).filter(Boolean);
   return {status:'clarification',question:q,kinds:full,follow:true,
    clarification:'Which part should I explain: '+labels.join(' or ')+'?'};
  }
  if(vague&&full.length===1&&anchor.status==='ready')return {status:'ready',question:q,
   kinds:full,lift:preferredLift||anchor.lift||null,follow:true};
  return null;
 }
 function plan(question,history=[]){
  // The original, untruncated message must be checked before planning.
  if(typeof question!=='string'||!question.trim()||Support.health(question)||Support.kind(question)==='urgent-support')return null;
  const q=clean(question),found=handlers.filter(row=>row.test(q)).map(row=>row.kind);
  if(blocked.test(q))return null;
  if(found.length<2)return followPlan(q,history);
  const liftMatches=lifts.filter(([,rx])=>rx.test(q)).map(([name])=>name);
  if(found.includes('upcoming')&&/\btomorrow\b/i.test(q)&&/\bnext week\b/i.test(q))return {status:'clarification',question:q,kinds:found,clarification:'Should I review tomorrow’s workout or next week’s workout first?'};
  if(found.includes('performance')&&liftMatches.length!==1)
   return {status:'clarification',question:q,kinds:found,clarification:liftMatches.length?'Which lift should I review first: squat, bench, or deadlift?':'Which lift appears stalled: squat, bench, or deadlift?'};
  return {status:'ready',question:q,kinds:found.slice(0,3),lift:liftMatches[0]||null};
 }
 function query(kind,lift,plan){
  if(kind==='performance')return 'Why has my '+lift+' stalled?';
  if(kind==='weekly')return 'How did this week go?';
  if(kind==='upcoming')return plan?.nextWeek?"Explain next week's workout":'Explain my next workout';
  return 'Summarize my training';
 }
 function response(kind,state,{asOf,unit,now,history},lift,plan){
  const q=query(kind,lift,plan),options={asOf,unit,now,history};
  if(kind==='performance')return Trends.answer(state,q,options);
  if(kind==='weekly')return Weekly.answer(state,q,options);
  if(kind==='upcoming')return Workout.answer(state,q,options);
  return Recap.answer(state,q,options);
 }
 function answer(state,question,{asOf,unit='kg',now,history=[]}={}){
  const p=plan(question,history);
  if(!p)return null;
  if(p.status==='clarification')return {
   text:p.clarification,source:'Offline Coach · focused clarification',
   evidence:[],readOnly:true,actions:[],intent:{topic:'unified-evidence',needsClarification:true,kinds:p.kinds}
  };
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf||''))return null;
  const sections=[],evidence=[],actions=[];
  for(const kind of p.kinds){
   let row=null;
   try{row=response(kind,state,{asOf,unit,now,history},p.lift,p);}catch{/* A failed evidence engine must not fabricate facts. */}
   const handler=handlers.find(h=>h.kind===kind),label=handler.label;
   if(!row||typeof row.text!=='string'||!row.text.trim()){
    sections.push({kind,label,source:'Unavailable',text:'The saved evidence could not be validated. Review the underlying records before changing your plan.'});
    continue;
   }
   const text=kind==='performance'&&row.clarity?
    row.clarity.happened+' '+row.clarity.meaning:row.text;
   sections.push({kind,label,source:String(row.source||'Saved training evidence'),text});
   if(Array.isArray(row.evidence))evidence.push(...row.evidence.slice(0,1));
   // Only expose navigation/inspection actions; no mutation or draft approval.
   for(const action of row.actions||[])if(['progress','weekly-coaching','workout-brief'].includes(action?.kind)&&!actions.some(a=>a.kind===action.kind))actions.push(action);
  }
  if(sections.length<2&&!p.follow)return null;
  const next='Next: review the exact training records and your existing approved targets. Any programming adjustment must go through Decisions and athlete approval.';
  return {
   text:sections.map(s=>s.label+': '+s.text).join('\n\n')+'\n\n'+next,
   source:'Offline Coach · combined validated evidence',readOnly:true,
   intent:{topic:'unified-evidence',kinds:p.kinds,lift:p.lift||null,...(p.follow?{follow:true}:{} )},
   reasoning:{version:1,asOf,sections:sections.map(({kind,label,source})=>({kind,label,source})),notice:'Each section comes from an existing read-only Loadnote engine; no new loads or recovery judgments were generated.'},
   evidence:evidence.slice(0,3),actions:actions.slice(0,3),
   followUps:['Review my exact workout history','Explain my next workout']
  };
 }
 return {plan,answer};
});