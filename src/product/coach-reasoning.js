/* v3.90 — deterministic, attributed evidence-source and coverage follow-ups.
 * Single-topic requests retain their established handlers. The coordinator
 * invokes existing validated analyses; it never creates a training dose.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('./coach-support'),require('./coach-performance-insights'),
  require('./weekly-coaching'),require('./workout-brief'),require('./coach-evidence-brief'),require('./coach-evidence-options')
 );
 else root.LoadnoteCoachReasoning=factory(root.LoadnoteCoachSupport,root.LoadnoteCoachPerformanceInsights,root.LoadnoteWeeklyCoaching,root.LoadnoteWorkoutBrief,root.LoadnoteCoachEvidenceBrief,root.LoadnoteCoachEvidenceOptions);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support,Trends,Weekly,Workout,Recap,EvidenceOptions){
 'use strict';
 const clean=text=>String(text??'').replace(/\s+/g,' ').trim().slice(0,500);
 const lifts=[['bench',/\bbench(?: press)?\b/i],['squat',/\bsquat(?:ting)?\b/i],['deadlift',/\b(?:deadlift|sumo)\b/i]];
 const blocked=/\b(?:build|create|generate|draft|write|design|make)\b.{0,70}\b(?:program|plan|workout|session)\b|\b(?:set|save|update|replace|remove|cancel|delete|change)\b.{0,70}\b(?:my (?:preferences|equipment|schedule|program)|training days|my profile)\b/i;
 const handlers=[
  {kind:'performance',label:'Performance',test:q=>/\b(?:stall(?:ed|ing)?|plateau(?:ed|ing)?|stagnat(?:e|ed|ing|ion)|not improv(?:ing|ed)|not (?:getting|becoming) stronger)\b/i.test(q)},
  {kind:'weekly',label:'Weekly training',test:q=>/\b(?:how did (?:my |this |last )?week go|weekly (?:review|coaching|training)|review (?:my |this |last )?week|what should i do next week)\b/i.test(q)},
  {kind:'upcoming',label:'Next scheduled workout',test:q=>/\b(?:next (?:planned )?(?:workout|session)|next week(?:'s)? workout|tomorrow(?:'s)? workout)\b/i.test(q)},
  {kind:'recap',label:'Recent training',test:q=>/\b(?:training recap|summari[sz]e my training|my recent training overview)\b/i.test(q)}
 ];
 // Follow-ups are resolved from a short sequence of athlete-authored turns.
 // No assistant reply, model completion or unsaved preference becomes evidence.
 const followLift=q=>lifts.filter(([,rx])=>rx.test(q)).map(([name])=>name);
 // Athlete section selection is a closed vocabulary of existing evidence
 // engines. It cannot invent a new topic, athlete preference or programming action.
 function focusPart(question){
  const q=clean(question);
  const m=/^(?:(?:just|only|please)\s+(?:the\s+)?|the\s+|(?:can we|could we|let's)\s+(?:focus on|look at)\s+(?:the\s+)?|(?:focus on|talk about)\s+(?:the\s+)?)?(?:(bench|squat|deadlift)\s+)?(performance|progress|stall|plateau|weekly training|weekly review|weekly|week|next scheduled workout|upcoming workout|next workout|workout|recent training|training recap|recap)(?:\s+(?:part|section|one))?\s*[.!?]*$/i.exec(q);
  if(!m)return null;
  const word=m[2].toLowerCase();
  const kind=/^(?:performance|progress|stall|plateau)$/.test(word)?'performance':
   /^(?:weekly training|weekly review|weekly|week)$/.test(word)?'weekly':
   /^(?:next scheduled workout|upcoming workout|next workout|workout)$/.test(word)?'upcoming':'recap';
  if(m[1]&&kind!=='performance')return null;
  return {kind,lift:m[1]||null};
 }
 // Brief requests refer only to recent athlete-authored compound questions.
 // No stored assistant answer is summarized, and no new training facts are made up.
 const briefFollow=q=>/^(?:give me (?:the |a )?(?:short version|quick summary|main takeaway)|(?:what(?:'s| is) (?:the )?(?:takeaway|main point|bottom line))|(?:can you )?(?:put (?:that|it) (?:more )?simply|explain (?:that|it) (?:more )?simply)|(?:sum(?:marize|marise) (?:that|it))|(?:in plain english)|(?:tl;?dr))[.!?]*$/i.test(q);
 // Source and coverage requests are never resolved from an assistant reply.
 // They require a prior athlete-asked multi-evidence review in the last 8 rows.
 const sourceFollow=q=>/^(?:where did (?:that|this) come from|what (?:data|records|evidence) (?:is|are) (?:that|this) based on|(?:show(?: me)? (?:the )?(?:data sources|evidence sources|sources))|what (?:source|sources) (?:did you use|are you using))[.!?]*$/i.test(q);
 const gapFollow=q=>/^(?:what(?:'s| is) missing|what (?:data|evidence|information) (?:is|are) missing|what (?:do|don't) (?:we|you) (?:know|have)|is (?:there|anything) (?:enough|missing)|what (?:are|is) the (?:gaps|limitations))[.!?]*$/i.test(q);
 const simpleFollow=q=>sourceFollow(q)||gapFollow(q)||briefFollow(q)||!!focusPart(q)||/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo|next (?:workout|session)|next week)\??$|^(?:bench|squat|deadlift|sumo|performance|weekly training|recent training|next scheduled workout|tomorrow|next week)[.!?]?$|^(?:why|how so|explain that|tell me more|what does that mean)\??$/i.test(q);
 const neutralReset=q=>/^(?:hello|hi|hey|thanks|thank you|new topic|start over)[.!?]*$/i.test(q);
 function lastCompound(history){
  const bounded=(Array.isArray(history)?history:[]).slice(-8).filter(t=>t&&t.role==='user');
  if(!bounded.length)return null;
  let narrowedLift=null,focusedKind=null,nextWeekFocus=false,tomorrowFocus=false;
  for(let i=bounded.length-1;i>=0;i--){
   const q=clean(bounded[i].content);
   if(!q||neutralReset(q)||Support.health(q)||Support.kind(q)==='urgent-support')return null;
   // A new independent athlete question terminates the previous referent.
   if(!simpleFollow(q)){
    const anchor=plan(q,[]);
    if(!anchor||!['ready','clarification'].includes(anchor.status))return null;
    return {anchor,preferredLift:narrowedLift,focusedKind,nextWeekFocus,tomorrowFocus};
   }
   const names=followLift(q);
   if(names.length===1&&narrowedLift===null)narrowedLift=names[0];
   if(focusedKind===null&&/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo)\??$/i.test(q))focusedKind='performance';
   if(focusedKind===null&&/^(?:(?:what|how) about|and) (?:my |the )?(?:next (?:workout|session)|next week)\??$/i.test(q))focusedKind='upcoming';
   if(focusedKind===null){const selected=focusPart(q)?.kind||{performance:'performance','weekly training':'weekly','recent training':'recap','next scheduled workout':'upcoming'}[q.replace(/[.!?]+$/,'').toLowerCase()];if(selected)focusedKind=selected;}
   if(focusedKind==='upcoming'&&/\bnext week\b/i.test(q))nextWeekFocus=true;
   if(focusedKind===null&&/^(?:tomorrow|next week)[.!?]?$/i.test(q))focusedKind='upcoming';
   if(focusedKind==='upcoming'&&/^tomorrow[.!?]?$/i.test(q))tomorrowFocus=true;
  }
  return null;
 }
 function followPlan(question,history){
  const q=clean(question);
  if(!simpleFollow(q))return null;
  const prior=lastCompound(history);if(!prior)return null;
  const {anchor,preferredLift,focusedKind,nextWeekFocus,tomorrowFocus}=prior,names=followLift(q);
  const full=anchor.kinds||[],hasPerformance=full.includes('performance');
  const questionIsLift=/^(?:bench|squat|deadlift|sumo)[.!?]?$/i.test(q);
  const liftOnly=/^(?:(?:what|how) about|and) (?:my |the )?(?:bench|squat|deadlift|sumo)\??$/i.test(q);
  const upcoming=/^(?:(?:what|how) about|and) (?:my |the )?(?:next (?:workout|session)|next week)\??$/i.test(q);
  const vague=/^(?:why|how so|explain that|tell me more|what does that mean)\??$/i.test(q);
  const brief=briefFollow(q);
  // A question with two explicit date windows needs an athlete selection.
  // Re-check lift ambiguity after the date is selected; never pick a lift silently.
  const dateChoice=/^(?:tomorrow|next week)[.!?]?$/i.test(q)?(/^tomorrow/i.test(q)?'tomorrow':'next-week'):null;
  if(dateChoice&&anchor.status==='clarification'&&/tomorrow.*next week/i.test(anchor.clarification||'')&&full.includes('upcoming')){
   const roots=followLift(anchor.question);
   if(full.includes('performance')&&roots.length!==1)return {status:'clarification',question:q,kinds:full,
    clarification:'Which lift should I review first: squat, bench, or deadlift?'};
   return {status:'ready',question:q,kinds:full.slice(0,3),lift:roots[0]||null,follow:true,
    nextWeek:dateChoice==='next-week',tomorrow:dateChoice==='tomorrow'};
  }
  const focus=focusPart(q);
  const chosen=focus?.kind||{performance:'performance','weekly training':'weekly','recent training':'recap','next scheduled workout':'upcoming'}[q.replace(/[.!?]+$/,'').toLowerCase()];
  if(chosen&&full.includes(chosen)){
   const selectedLift=focus?.lift||preferredLift||anchor.lift||null;
   // Picking a section does not resolve a missing or conflicting lift.
   if(chosen==='performance'&&!selectedLift)return {status:'clarification',question:q,kinds:[chosen],
    clarification:'Which lift should I review first: squat, bench, or deadlift?'};
   // A section choice does not silently decide between two date windows.
   if(chosen==='upcoming'&&anchor.status==='clarification'&&/tomorrow.*next week/i.test(anchor.clarification||''))
    return {status:'clarification',question:q,kinds:[chosen],clarification:'Should I review tomorrow’s workout or next week’s workout first?'};
   return {status:'ready',question:q,kinds:[chosen],lift:selectedLift,follow:true,
    nextWeek:chosen==='upcoming'&&(nextWeekFocus||!!anchor.nextWeek),
    tomorrow:chosen==='upcoming'&&(tomorrowFocus||!!anchor.tomorrow)};
  }
  if((questionIsLift||liftOnly)&&hasPerformance){
   if(names.length!==1)return null;
   return {status:'ready',question:q,kinds:liftOnly?['performance']:full.slice(0,3),
    lift:names[0],follow:true,focus:liftOnly?'performance':'clarification'};
  }
  if(upcoming&&full.includes('upcoming'))return {status:'ready',question:q,kinds:['upcoming'],lift:null,
   follow:true,nextWeek:/next week/i.test(q)};
  const evidenceProbe=sourceFollow(q)?'source':gapFollow(q)?'coverage':null;
  if(evidenceProbe){
   const kinds=focusedKind&&full.includes(focusedKind)?[focusedKind]:full.slice(0,3);
   const named=followLift(anchor.question),lift=preferredLift||anchor.lift||(named.length===1?named[0]:null);
   if(kinds.includes('performance')&&(!lift||named.length!==1&&!preferredLift))
    return {status:'clarification',question:q,kinds,clarification:'Which lift should I review first: squat, bench, or deadlift?'};
   if(kinds.includes('upcoming')&&anchor.status==='clarification'&&/tomorrow.*next week/i.test(anchor.clarification||''))
    return {status:'clarification',question:q,kinds,clarification:'Should I review tomorrow’s workout or next week’s workout first?'};
   return {status:'ready',question:q,kinds,lift,follow:true,probe:evidenceProbe,
    nextWeek:kinds.includes('upcoming')&&(nextWeekFocus||!!anchor.nextWeek),
    tomorrow:kinds.includes('upcoming')&&(tomorrowFocus||!!anchor.tomorrow)};
  }
  if(brief){
   const kinds=focusedKind&&full.includes(focusedKind)?[focusedKind]:full.slice(0,3);
   const named=followLift(anchor.question);
   const lift=preferredLift||anchor.lift||(named.length===1?named[0]:null);
   if(kinds.includes('performance')&&(!lift||named.length!==1&&!preferredLift))
    return {status:'clarification',question:q,kinds,
     clarification:'Which lift should I review first: squat, bench, or deadlift?'};
   if(kinds.includes('upcoming')&&anchor.status==='clarification'&&/tomorrow.*next week/i.test(anchor.clarification||''))
    return {status:'clarification',question:q,kinds,
     clarification:'Should I review tomorrow’s workout or next week’s workout first?'};
   return {status:'ready',question:q,kinds,lift,follow:true,brief:true,
    nextWeek:kinds.includes('upcoming')&&(nextWeekFocus||!!anchor.nextWeek),
    tomorrow:kinds.includes('upcoming')&&(tomorrowFocus||!!anchor.tomorrow)};
  }
  if(vague&&focusedKind&&full.includes(focusedKind))return {status:'ready',question:q,kinds:[focusedKind],lift:preferredLift||anchor.lift||null,follow:true,
   // Once the athlete chose a topic, an elliptical meaning question gets a
   // short sourced restatement. A multi-topic question still clarifies below.
   brief:/^(?:what does that mean|explain that|how so)\??$/i.test(q),
   nextWeek:focusedKind==='upcoming'&&(nextWeekFocus||!!anchor.nextWeek),tomorrow:focusedKind==='upcoming'&&(tomorrowFocus||!!anchor.tomorrow)};
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
  return {status:'ready',question:q,kinds:found.slice(0,3),lift:liftMatches[0]||null,nextWeek:/\bnext week(?:'s)? workout\b/i.test(q),tomorrow:/\btomorrow(?:'s)? workout\b/i.test(q)};
 }
 function query(kind,lift,plan){
  if(kind==='performance')return 'Why has my '+lift+' stalled?';
  if(kind==='weekly')return 'How did this week go?';
  if(kind==='upcoming')return plan?.nextWeek?"Explain next week's workout":plan?.tomorrow?"Explain tomorrow's workout":'Explain my next workout';
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
  const sections=[],evidence=[],actions=[],engineReplies={};
  for(const kind of p.kinds){
   let row=null;
   try{row=response(kind,state,{asOf,unit,now,history},p.lift,p);}catch{/* A failed evidence engine must not fabricate facts. */}
   const handler=handlers.find(h=>h.kind===kind),label=handler.label;
   engineReplies[kind]=row;
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
  const evidenceCards=p.kinds.map(kind=>EvidenceOptions?.summarize(kind,engineReplies[kind],asOf)).filter(Boolean).slice(0,3);
  const evidenceWarnings=EvidenceOptions?.differences(evidenceCards,engineReplies)||[];
  // Compact replies are rendered from freshly validated evidence cards. A
  // missing card stays unavailable; no assistant text or inferred cause used.
  const briefText=p.brief?sections.map(section=>{
   const card=EvidenceOptions?.summarize(section.kind,engineReplies[section.kind],asOf);
   return section.label+': '+(card?.observed||'Evidence unavailable.')+' '+(card?.limitation||'No validated conclusion available.')+
    ' Source: '+(card?.source||section.source)+'.';
  }).join('\n'):null;
  // Ask the existing evidence-card validator again, never summarize a previous
  // assistant message or infer that an observation proves causality.
  const probeText=p.probe?sections.map(section=>{
   const card=EvidenceOptions?.summarize(section.kind,engineReplies[section.kind],asOf);
   if(!card)return section.label+': The evidence card could not be validated.';
   if(p.probe==='source')return section.label+': Source: '+card.source+'. Evidence: '+card.observed+
    ' Status: '+card.status+'. Limit: '+card.limitation;
   return section.label+': Evidence status: '+card.status+'. What is established: '+card.observed+
    ' Remaining limitation: '+card.limitation;
  }).join('\n'):null;
  const next='Next: review the exact training records and your existing approved targets. Any programming adjustment must go through Decisions and athlete approval.';
  return {
       text:(p.probe?(p.probe==='source'?'Evidence sources from saved records:\n':'Evidence coverage from saved records:\n')+probeText:p.brief?'Short version from saved records:\n'+briefText:sections.map(s=>s.label+': '+s.text).join('\n\n'))+(evidenceWarnings.length?'\n\nDifferent signals: '+evidenceWarnings.join(' '):'')+'\n\n'+next,
   source:'Offline Coach · combined validated evidence',readOnly:true,
   intent:{topic:'unified-evidence',kinds:p.kinds,lift:p.lift||null,...(p.follow?{follow:true}:{} ),...(p.brief?{brief:true}:{}),...(p.probe?{probe:p.probe}:{})},
   reasoning:{version:1,asOf,sections:sections.map(({kind,label,source})=>({kind,label,source})),notice:'Each section comes from an existing read-only Loadnote engine; no new loads or recovery judgments were generated.'},
   evidence:evidence.slice(0,3),evidenceCards,evidenceWarnings,actions:actions.slice(0,3),
   followUps:['Review my exact workout history','Explain my next workout']
  };
 }
 return {plan,answer};
});