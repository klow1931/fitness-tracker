/* v3.94 — a read-only, first-week training handoff.
 * The existing Today and Continuity engines determine actual status and dates.
 * The guide never writes a workout, confirms attendance or assigns loads.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LoadnoteBeginnerFirstWeek=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY_MS=86400000;
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
   !Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const dayNumber=s=>Date.parse(s+'T12:00:00Z')/DAY_MS;
 function inspect(state,{asOf,entry=null,todayReport=null,continuity=null}={}){
  if(!validDate(asOf))throw Error('Choose a valid local training date');
  // This is a small optional training handoff, not a general dashboard.
  if(entry!=='log'&&entry!=='help')return null;
  const workouts=Array.isArray(state?.workouts)?state.workouts:[];
  const actual=workouts.filter(w=>validDate(w?.date)&&w.date<=asOf&&
   Array.isArray(w.exercises)&&w.exercises.some(e=>
    (e?.sets||[]).some(s=>Number(s?.reps)>0||Number(s?.duration)>0)||
    e?.type==='cardio'&&Number(e?.duration)>0
   ));
  const sorted=actual.map(w=>w.date).sort();
  // Source the repeat button from the last ACTUALLY saved session, not the
  // newest array item or a planned/future workout.
  const latest=actual.slice().sort((a,b)=>b.date.localeCompare(a.date)||
   String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null;
  const repeatId=latest?.id!=null&&String(latest.id).length>0&&
   Array.isArray(latest.exercises)&&latest.exercises.length>0&&
   latest.exercises.every(e=>e&&e.type!=='practice')?String(latest.id):null;
  // Stop showing onboarding after the first actual week, or when a lifter
  // has already logged three sessions; previously saved history is untouched.
  const graduated=sorted.length>=3||!!(sorted.length&&dayNumber(asOf)-dayNumber(sorted[0])>6);
  let plans=[];try{const Starter=typeof module==='object'&&module.exports?require('./beginner-program'):globalThis.LoadnoteBeginnerProgram;plans=Starter?.saved(state,{asOf})||[];}catch{}
  if(graduated&&!plans.length)return null;
  const count=sorted.length;
  const report=todayReport||{},next=continuity?.next||null;
  const overdue=Array.isArray(continuity?.unresolvedOverdue)?continuity.unresolvedOverdue.length:0;
  const status={visible:true,count,asOf,graduated,firstDate:sorted[0]||null,action:'log',label:'Open workout log',
   title:graduated?'Your training plan':count?count+' saved workout'+(count===1?'':'s')+' in your first week':'Your first week starts with one workout',
   detail:'When you are ready, choose your exercises and log what you actually do. RPE is optional.'};
  if(report.unlinkedDraft||report.active?.draftOpen){
   return {...status,action:'resume',label:'Resume your workout',
    detail:'An unfinished workout is saved on this device. Resume it before starting something new.'};
  }
  if(overdue){
   return {...status,action:'calendar',label:'Review Calendar',
    detail:overdue+' earlier scheduled session'+(overdue===1?' needs':'s need')+' review. Loadnote does not assume you missed training.'};
  }
  if(report.active){
   // A due lifecycle review is not a license to bypass an existing gate.
   const multiple=(report.sessions||[]).filter(s=>s.status==='scheduled').length>1;
   return {...status,action:multiple?'calendar':'today',label:multiple?'Choose in Calendar':'Review today’s workout',
    detail:multiple?'Multiple sessions are scheduled today. Choose which to review in Calendar.':
     'You have a scheduled workout today. Review its targets, then log only what you complete.'};
  }
  if(next&&validDate(next.date)&&next.date>=asOf){
   return {...status,action:'calendar',label:'View upcoming workout',
    detail:'Next scheduled: '+next.date+' · '+String(next.name||'Workout')+
     '. That is a plan, not a completed session.'};
  }
  if(graduated||!count||latest?.date<asOf){
   if(plans.some(p=>!p.scheduledAt)||graduated&&plans.length)return {...status,action:'starter',label:'Review a workout from your saved plan',
    detail:'Your reviewed plan stays available beyond the first week. Choose the version and workout you want to review. Scheduled plans continue through Calendar; nothing is completed automatically.'};
  }
  if(count){
   // Avoid prompting two training sessions on the same day. If the last
   // confirmed workout was on a prior day and no session is scheduled,
   // provide a direct next-log action plus access to past performance.
   if(sorted.at(-1)<asOf){
    if(repeatId)return {...status,action:'repeat',label:'Repeat last workout',repeatSourceId:repeatId,
     detail:'Your previous workout can be reused as an editable starting point. Check today’s weights and reps, and mark only sets you complete. No training day is assumed.'};
    return {...status,action:'log',label:'Log your next workout',
     detail:'Your last workout is saved in History. No next session is scheduled. When you are ready to train again, log your actual work; no training day is assumed.'};
   }
   return {...status,action:'history',label:'See saved workout',
    detail:'Your workout is saved in History. No next session is scheduled; choose your next training day when ready.'};
  }
  return status;
 }
 return {inspect};
});
