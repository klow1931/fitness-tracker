/* v2.61 — deterministic active-program lifecycle controller.
 * Coordinates existing program, schedule, review, event and handoff systems.
 * It does not create prescriptions or apply adaptations by itself.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
   require('./schedule'),require('./phase-builder'),require('./meet-cycle'),
   require('./cycle-review'),require('./phase-review'),require('./transition-baseline'),
   require('./next-block-handoff'),require('./hypertrophy-builder'),require('./sport-planner')
 );
 else root.LoadnoteProgramLifecycle=factory(
   root.LoadnoteSchedule,root.LoadnotePhaseBuilder,root.LoadnoteMeetCycle,
   root.LoadnoteCycleReview,root.LoadnotePhaseReview,root.LoadnoteTransitionBaseline,
   root.LoadnoteNextBlockHandoff,root.LoadnoteHypertrophyBuilder,root.LoadnoteSportPlanner
 );
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Phase,Meet,CycleReview,PhaseReview,Transition,Handoff,Hyp,Sport){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const daysBetween=(a,b)=>Math.floor((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
 const phaseLabel=x=>({weightlifting:'Technical lifting',athlete:'Athlete development',hypertrophy:'Hypertrophy',accumulation:'Accumulation',strength:'Strength',deload:'Deload',peaking:'Peaking',taper:'Taper','mock-meet':'Mock meet',meet:'Competition meet'}[x]||x||'Program');
 function phaseBounds(program){
   let cursor=program.config.startDate,week=0;
   return program.config.phases.map((p,index)=>{
     const startDate=cursor,endDate=move(startDate,p.weeks*7-1),startWeek=week+1,endWeek=week+p.weeks;
     cursor=move(endDate,1);week=endWeek;
     return {type:p.type,index,weeks:p.weeks,startDate,endDate,startWeek,endWeek};
   });
 }
 function phaseProgram(row){
   const bounds=phaseBounds(row),totalWeeks=bounds.reduce((n,p)=>n+p.weeks,0),end=Transition.endDate(row)||bounds.at(-1)?.endDate||row.config.startDate;
   return {kind:'phase-program',id:row.id,name:row.config.name,startDate:row.config.startDate,endDate:end,totalWeeks,record:row,prefix:'phase:'+row.id+':',phaseBounds:bounds};
 }
 function meetProgram(row){
   return {kind:'meet-cycle',id:row.id,name:row.sourceProgram.config.name,startDate:row.config.startDate,endDate:row.config.meetDate,totalWeeks:row.config.weeks,record:row,prefix:'meet:'+row.id+':',eventType:Meet.eventType(row.config),eventName:row.config.eventName||null,eventDate:row.config.meetDate};
 }
 function programs(state){
   const phases=Phase.validate(state?.phasePrograms||[]).filter(x=>x.scheduledAt).map(phaseProgram);
   const cycles=CycleReview.validate(state||{}).filter(x=>x.scheduledAt).map(meetProgram);
   const hypertrophy=Hyp.validate(state?.hypertrophyPrograms||[]).filter(r=>r.scheduledAt).map(r=>({kind:'hypertrophy-program',id:r.id,name:r.config.name,startDate:r.config.startDate,endDate:r.weekly.at(-1).through,totalWeeks:r.config.weeks,record:r,prefix:'hypertrophy:'+r.id+':',phaseBounds:r.weekly.map((w,index)=>({type:w.phase,index,weeks:1,startDate:w.from,endDate:w.through,startWeek:w.week,endWeek:w.week}))}));
   const sports=Sport.validate(state?.sportPrograms||[]).filter(r=>r.scheduledAt).map(r=>({kind:'sport-program',id:r.id,name:r.config.name,startDate:r.config.startDate,endDate:r.weekly.at(-1).through,totalWeeks:r.config.weeks,record:r,prefix:'sport:'+r.id+':',phaseBounds:r.weekly.map((w,index)=>({type:w.phase,index,weeks:1,startDate:w.from,endDate:w.through,startWeek:w.week,endWeek:w.week}))}));
   return [...phases,...cycles,...hypertrophy,...sports].sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.endDate.localeCompare(b.endDate)||a.id.localeCompare(b.id));
 }
 function transitionFor(state,p){if(['hypertrophy-program','sport-program'].includes(p.kind))return null;return Transition.validate(state?.transitionSnapshots||[]).find(x=>x.programId===p.id)||null;}
 function eventRecorded(p){
   if(p.kind!=='meet-cycle')return true;
   const record=p.eventType==='competition'?p.record.meetResult:p.record.mockMeet;
   return !!record?.revisions?.length;
 }
 function needsClosure(state,p){
   if(['hypertrophy-program','sport-program'].includes(p.kind))return false;
   if(p.kind==='meet-cycle'&&!eventRecorded(p))return true;
   return !transitionFor(state,p);
 }
 function select(state,asOf){
   const all=programs(state),active=all.filter(p=>p.startDate<=asOf&&p.endDate>=asOf);
   if(active.length>1)return {status:'ambiguous',program:null,candidates:active,all};
   if(active.length===1)return {status:'selected',program:active[0],selection:'active',all};
   const ended=all.filter(p=>p.endDate<asOf).sort((a,b)=>b.endDate.localeCompare(a.endDate)||b.startDate.localeCompare(a.startDate));
   const closure=ended.find(p=>needsClosure(state,p));
   if(closure)return {status:'selected',program:closure,selection:'closure',all};
   const upcoming=all.filter(p=>p.startDate>asOf).sort((a,b)=>a.startDate.localeCompare(b.startDate));
   if(upcoming.length)return {status:'selected',program:upcoming[0],selection:'upcoming',all};
   if(ended.length)return {status:'selected',program:ended[0],selection:'handoff',all};
   return {status:'none',program:null,candidates:[],all};
 }
 function progress(p,asOf){
   const offset=daysBetween(p.startDate,asOf),week=Math.max(1,Math.min(p.totalWeeks,Math.floor(Math.max(0,offset)/7)+1));
   if(p.kind==='meet-cycle'){
     const row=p.record.weekly.find(x=>x.week===week)||p.record.weekly.at(-1);
     return {week,totalWeeks:p.totalWeeks,phase:row?.phase||null,phaseLabel:phaseLabel(row?.phase),phaseWeek:row?.phaseWeek||null};
   }
   const bound=p.phaseBounds.find(x=>week>=x.startWeek&&week<=x.endWeek)||p.phaseBounds.at(-1);
   return {week,totalWeeks:p.totalWeeks,phase:bound?.type||null,phaseLabel:phaseLabel(bound?.type),phaseWeek:bound?week-bound.startWeek+1:null};
 }
 function scopedRows(state,p,asOf){
   return Schedule.rows(state?.scheduledSessions||[],state?.workouts||[],{asOf}).filter(x=>x.id.startsWith(p.prefix));
 }
 function resolvedIds(state,p,asOf){
   const rows=scopedRows(state,p,asOf),resolved=new Set(rows.filter(x=>['completed','skipped','cancelled'].includes(x.state)).map(x=>x.id));
   return resolved;
 }
 function phaseReviewDue(state,p,asOf){
   if(p.kind!=='phase-program')return null;
   const accepted=PhaseReview.validate(state?.phaseReviews||[]).filter(x=>x.programId===p.id),resolved=resolvedIds(state,p,asOf);
   for(const bound of p.phaseBounds.filter(x=>x.index<p.phaseBounds.length-1&&!accepted.some(r=>r.phase===x.type)).sort((a,b)=>a.endDate.localeCompare(b.endDate))){
     const next=p.phaseBounds[bound.index+1];
     if(!(bound.endDate<=asOf&&asOf<next.startDate))continue;
     const ids=p.record.sessions.filter(s=>s.phase===bound.type).map(s=>p.prefix+s.key);
     if(ids.length&&ids.every(id=>resolved.has(id)))return bound;
   }
   return null;
 }
 function weekReviewDue(state,p,asOf){
   if(p.kind!=='meet-cycle')return null;
   const reviewed=new Set((p.record.weeklyReviews||[]).map(x=>x.week)),resolved=resolvedIds(state,p,asOf);
   for(const row of p.record.weekly.filter(x=>x.week<p.totalWeeks&&!reviewed.has(x.week)).sort((a,b)=>a.week-b.week)){
     const next=p.record.weekly.find(x=>x.week===row.week+1);
     if(!next||!(row.endDate<=asOf&&asOf<next.startDate))continue;
     const ids=p.record.sessions.filter(s=>s.week===row.week).map(s=>p.prefix+s.key);
     if(ids.length&&ids.every(id=>resolved.has(id)))return row;
   }
   return null;
 }
 function missedReviewWindows(state,p,asOf){
   if(['hypertrophy-program','sport-program'].includes(p.kind))return [];
   if(p.kind==='meet-cycle'){
     const reviewed=new Set((p.record.weeklyReviews||[]).map(x=>x.week));
     return p.record.weekly.filter(x=>x.week<p.totalWeeks&&!reviewed.has(x.week)&&p.record.weekly.find(n=>n.week===x.week+1)?.startDate<=asOf).map(x=>({kind:'week',week:x.week,phase:x.phase,ended:x.endDate}));
   }
   const reviewed=new Set(PhaseReview.validate(state?.phaseReviews||[]).filter(x=>x.programId===p.id).map(x=>x.phase));
   return p.phaseBounds.filter(x=>x.index<p.phaseBounds.length-1&&!reviewed.has(x.type)&&p.phaseBounds[x.index+1]?.startDate<=asOf).map(x=>({kind:'phase',phase:x.type,ended:x.endDate}));
 }
 function action(kind,label,detail,extra={}){return {kind,label,detail,...extra};}
 function inspect(state,{asOf,draft=null,draftOpen=false}={}){
   if(!Schedule.date(asOf))throw Error('Choose a valid lifecycle date');
   const chosen=select(state,asOf);
   if(chosen.status==='ambiguous')return {version:1,asOf,status:'ambiguous',program:null,progress:null,schedule:null,nextAction:action('review-programs','Review overlapping programs','More than one scheduled program covers today. Loadnote will not guess which plan is active.'),candidates:chosen.candidates.map(x=>({kind:x.kind,id:x.id,name:x.name,startDate:x.startDate,endDate:x.endDate})),notes:['Resolve overlapping scheduled programs before relying on a single active-program next action.']};
   if(chosen.status==='none'){
     let handoff=null;try{handoff=Handoff.inspect(state,{asOf,draftOpen:!!draftOpen});}catch{}
     return {version:1,asOf,status:'no-program',program:null,progress:null,schedule:null,nextAction:handoff?.ready?action('review-next-program','Review next program','A completed transition is ready to hand into the next reviewed block.',{handoff}):action('no-program','Choose your next training plan','No reviewed hypertrophy plan, phase program or meet cycle is currently scheduled.'),handoff,notes:['Loadnote does not invent or activate a program automatically.']};
   }
   const p=chosen.program,rows=scopedRows(state,p,asOf),unconfirmed=rows.filter(x=>x.state==='unconfirmed').sort((a,b)=>a.date.localeCompare(b.date)),todayRows=rows.filter(x=>x.date===asOf&&x.state==='scheduled'),next=rows.filter(x=>x.state==='scheduled'&&x.date>=asOf).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
   const counts={planned:rows.length,completed:rows.filter(x=>x.state==='completed').length,skipped:rows.filter(x=>x.state==='skipped').length,cancelled:rows.filter(x=>x.state==='cancelled').length,unconfirmed:unconfirmed.length,upcoming:rows.filter(x=>x.state==='scheduled').length};
   const prog=progress(p,asOf),draftScheduleId=draft?.sessionIntent?.schedule?.id||null,isProgramDraft=!!draftScheduleId&&draftScheduleId.startsWith(p.prefix),openDraft=!!draftOpen||!!draftScheduleId;
   const transition=transitionFor(state,p),weekDue=weekReviewDue(state,p,asOf),phaseDue=phaseReviewDue(state,p,asOf),missedReviews=missedReviewWindows(state,p,asOf);
   let nextAction;
   if(isProgramDraft)nextAction=action('resume-workout','Resume workout','An unfinished workout from this program is open on this device.',{scheduleId:draftScheduleId});
   else if(openDraft)nextAction=action('resume-draft','Finish the open workout first','An unfinished workout is open on this device. Finish, save, or clear it before applying a program review.');
   else if(unconfirmed.length)nextAction=action('resolve-overdue','Resolve earlier scheduled training',unconfirmed.length+' earlier program session'+(unconfirmed.length===1?' needs':'s need')+' an explicit outcome before Loadnote advances the review path.',{sessionIds:unconfirmed.map(x=>x.id)});
   else if(weekDue)nextAction=action('review-week','Review week '+weekDue.week,'Week '+weekDue.week+' is complete. Review its logged evidence before starting work that the review could still change.',{cycleId:p.id,week:weekDue.week,phase:weekDue.phase});
   else if(phaseDue)nextAction=action('review-phase','Review '+phaseLabel(phaseDue.type)+' phase',phaseLabel(phaseDue.type)+' is complete. Review its evidence before starting the next phase.',{programId:p.id,phase:phaseDue.type});
   else if(todayRows.length)nextAction=action('start-workout',todayRows[0].name,todayRows.length===1?'Today’s reviewed session is ready.':todayRows.length+' reviewed sessions are scheduled today.',{scheduleId:todayRows[0].id});
   else if(p.kind==='meet-cycle'&&asOf>=p.eventDate&&!eventRecorded(p))nextAction=action('record-event','Record '+(p.eventType==='competition'?(p.eventName||'competition meet'):'mock meet')+' results','The program endpoint has arrived. Record actual attempts before closing the cycle.',{cycleId:p.id,eventType:p.eventType,eventDate:p.eventDate});
   else if(p.kind==='sport-program'&&asOf>=p.endDate)nextAction=action('review-sport','Review sport-plan evidence','Review separately logged skill/performance outcomes with your coach; no SBD transition or sport peak is inferred.',{programId:p.id});
   else if(p.kind==='hypertrophy-program'&&asOf>=p.endDate)nextAction=action('review-hypertrophy','Review hypertrophy evidence','Review complete logs and tolerance before choosing the next plan; no strength transition is inferred.',{programId:p.id});
   else if(asOf>=p.endDate&&!transition)nextAction=action('save-transition','Review program handoff','Freeze the completed program’s training evidence as the transition baseline for the next block.',{programId:p.id});
   else if(transition){
     let handoff=null;try{handoff=Handoff.inspect(state,{asOf,draftOpen:false});}catch(e){handoff={ready:false,status:'blocked',summary:e.message,blockers:[e.message]};}
     nextAction=handoff?.ready?action('review-next-program','Review next program','The transition baseline is frozen and the next-block handoff is ready for athlete review.',{handoff}):action('review-handoff','Resolve next-block handoff','The program is complete, but the next reviewed block still has handoff items to resolve.',{handoff});
   }else if(next)nextAction=action(chosen.selection==='upcoming'?'program-upcoming':'next-session',chosen.selection==='upcoming'?'Program starts '+p.startDate:'Next session '+next.date,(chosen.selection==='upcoming'?'The reviewed program is scheduled and waiting to begin.':next.name),{scheduleId:next.id,date:next.date});
   else if(p.kind==='meet-cycle'&&asOf<p.eventDate)nextAction=action('wait-event','Next: '+(p.eventType==='competition'?(p.eventName||'competition meet'):'mock meet')+' '+p.eventDate,'All scheduled training before the event is resolved. No attempt loads are inferred.');
   else nextAction=action('keep-plan','Keep the reviewed plan','No review or session needs action right now.');
   return {version:1,asOf,status:chosen.selection==='upcoming'?'upcoming':asOf>p.endDate?'completed':'active',selection:chosen.selection,
     program:{kind:p.kind,id:p.id,name:p.name,startDate:p.startDate,endDate:p.endDate,totalWeeks:p.totalWeeks,eventType:p.eventType||null,eventName:p.eventName||null,eventDate:p.eventDate||null},
     progress:prog,schedule:{...counts,next:next?{id:next.id,date:next.date,name:next.name}:null,unconfirmed:unconfirmed.map(x=>({id:x.id,date:x.date,name:x.name}))},
     transition:transition?{id:transition.id,asOf:transition.asOf,programType:transition.programType||'phase-program'}:null,missedReviews:copy(missedReviews),nextAction,notes:['The lifecycle controller selects the next workflow step; it never applies a training change by itself.','Weekly/phase adjustments still require the existing evidence checks and explicit athlete approval.','A review blocks the next step only while its future-only adjustment window is still open and the reviewed period is fully resolved. Missed historical review windows remain visible but do not trap later training.','Unconfirmed past sessions block review routing instead of being silently treated as skipped.']};
 }
 return {programs,select,progress,phaseBounds,phaseReviewDue,weekReviewDue,missedReviewWindows,inspect};
});
