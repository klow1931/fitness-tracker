/* Explain exact saved Calendar targets without generating or changing a prescription. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./program-lifecycle'),require('./coach-support'),require('./coach-turn-context'));else root.LoadnoteWorkoutBrief=factory(root.LoadnoteSchedule,root.LoadnoteProgramLifecycle,root.LoadnoteCoachSupport,root.LoadnoteCoachTurnContext);})(typeof globalThis!=='undefined'?globalThis:this,function(S,L,Support,Turns){
 'use strict';const clone=x=>JSON.parse(JSON.stringify(x)),shift=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 const PURPOSE={accumulation:'Build planned training volume and repeatable practice.',strength:'Practice the reviewed strength targets with their effort limits.',deload:'Follow the reduced work planned for this recovery week.',peaking:'Practice the reviewed meet-specific work.',taper:'Follow the reduced pre-event workload.',meet:'Follow the competition plan and event review.', 'mock-meet':'Follow the mock-meet plan and record the event results.'};
 const NOTICE='These are saved targets, not a new prescription or proof of readiness. Record actual reps and effort; review any change in Decisions.';
 function inspect(state,{asOf,question='Explain my next workout',sessionId=null,now=new Date().toISOString()}={}){
  if(!S.date(asOf)||!Number.isFinite(Date.parse(now)))throw Error('Choose a valid workout review date');
  const q=String(question),day=(new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7,nextMonday=shift(asOf,7-day),from=/next week/i.test(q)?nextMonday:/tomorrow/i.test(q)?shift(asOf,1):asOf,through=/next week/i.test(q)?shift(nextMonday,6):/today|this workout|tomorrow/i.test(q)?from:null;
  let rows=S.list(S.validate(state.scheduledSessions||[]),now).filter(s=>s.status==='scheduled'&&s.date>=from&&(!through||s.date<=through)&&!(state.workouts||[]).some(w=>w.date<=asOf&&w.sessionIntent?.schedule?.id===s.id));
  const movements=Turns.names(state,q);if(/\bfor\b/i.test(q)&&movements.length===1)rows=rows.filter(s=>s.prescription.plannedExercises.some(e=>e.name===movements[0]));
  if(sessionId)rows=rows.filter(s=>s.id===sessionId);
  const first=rows[0]?.date,candidates=rows.filter(s=>s.date===first);if(candidates.length!==1)return {status:candidates.length?'ambiguous':'empty',asOf,question:q,candidates:candidates.map(s=>({id:s.id,name:s.name,date:s.date})),notice:NOTICE};
  const session=candidates[0];let programs=[],sourceError=false;try{programs=L.programs(state);}catch{sourceError=true;}
  const matches=programs.filter(p=>session.id.startsWith(p.prefix)&&session.prescription.source.referenceId===p.id),p=matches.length===1?matches[0]:null,source=p?.record.sessions.find(s=>session.id===p.prefix+s.key),progress=p&&source?L.progress(p,source.date||session.date):null;
  const event=p?.kind==='meet-cycle'?{date:p.record.config.meetDate,type:p.record.config.eventType||'mock'}:null;
  const reasons=[];if(sourceError||!p)reasons.push('The Calendar targets are saved, but a single reviewed source program could not be verified.');
  if(session.prescription.capturedAt!==session.revisionAt)reasons.push('The prescription timestamp differs from this Calendar revision; review its provenance.');
  const targets=clone(session.prescription.plannedExercises),focus=targets.slice(0,3).map(e=>e.name).join(', '),purpose=PURPOSE[progress?.phase]||session.goal||'Follow the reviewed session targets.';
  return {status:'ready',asOf,question:q,session:clone(session),program:p?{id:p.id,name:p.name,kind:p.kind}:null,progress,event,targets,purpose,focus,reasons,recordedReason:session.reason||null,notice:NOTICE};
 }
 function describe(e,unit='kg'){
  const weight=x=>Number.isFinite(x)?Math.round(x*(unit==='lb'?2.2046226218:1)*10)/10+' '+unit:'unknown load';
  if(e.type==='cardio')return e.name+' · '+e.duration+' min';if(e.type==='practice')return e.name+' · reviewed '+e.kind+' protocol';
  const lines=(e.sets||[]).map(s=>weight(s.weight)+' × '+(s.duration!=null?s.duration+' sec':s.minReps!=null?s.minReps+'–'+s.maxReps:s.reps)+' · RPE cap '+(s.targetRpe??'unknown'));
  return e.name+' · '+(lines.length&&lines.every(l=>l===lines[0])?lines.length+' sets · '+lines[0]:lines.map((l,i)=>'Set '+(i+1)+': '+l).join(' / '));
 }
 function summary(r){if(r.status==='empty')return 'No scheduled workout is recorded for that window. Open Calendar to review your plan.';if(r.status==='ambiguous')return 'More than one workout is scheduled on '+r.candidates[0].date+'. Choose the exact session in Calendar.';
  return r.session.date+' · '+r.session.name+'. '+(r.progress?'Week '+r.progress.week+' of '+r.progress.totalWeeks+' · '+r.progress.phaseLabel+'. ':'')+'Focus: '+r.focus+'. '+r.purpose+(r.event?' '+(r.event.type==='competition'?'Competition':'Mock meet')+' on '+r.event.date+'.':'')+(r.reasons.length?' '+r.reasons[0]:'')+' '+NOTICE;
 }
 function answer(state,q,options){if(Support.health(q)||!/\b(explain|why|focus|prepare|what)\b.*\b(next (workout|session)|today.s workout|tomorrow.s workout|next week.s workout|this workout)\b|\b(workout|session)\b.*\b(purpose|focus)\b/i.test(q))return null;const r=inspect(state,{...options,question:q});return {text:summary(r),source:'Shared coaching · workout explanation',readOnly:true,evidence:[r],actions:[{kind:'workout-brief',label:'See workout targets',question:q,...(r.session?{sessionId:r.session.id}:{})}],followUps:['Why?','What about next week?']};}
 return {inspect,describe,summary,answer,NOTICE};
});
