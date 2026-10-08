/* Current corrected observations, not a recovery score or automatic prescription. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./workout-brief'));
 else root.LoadnoteTrainingWeek=factory(root.LoadnoteSchedule,root.LoadnoteWorkoutBrief);
})(typeof globalThis!=='undefined'?globalThis:this,function(S,Brief){
 'use strict';
 const shift=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 function inspect(state,{asOf,now=new Date().toISOString()}={}){
  if(!S.date(asOf)||!Number.isFinite(Date.parse(now)))throw Error('Choose a valid training-week date');
  const from=shift(asOf,-(new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7),through=shift(from,6);
  const logs=(state.workouts||[]).filter(w=>S.date(w.date)&&w.date<=asOf&&(!w.createdAt||w.createdAt<=now));
  const weekLogs=logs.filter(w=>w.date>=from&&w.date<=through);
  let sets=0,unknownEffort=0;
  for(const w of weekLogs)for(const e of w.exercises||[])if(e.type!=='cardio'&&e.type!=='practice')for(const s of e.sets||[]){sets++;if(!Number.isFinite(s.rpe)||s.rpe<1||s.rpe>10)unknownEffort++;}
  let rows;try{rows=S.list(S.validate(state.scheduledSessions||[]),now).filter(s=>s.date>=from&&s.date<=through);}catch{return {status:'invalid',from,through,notice:'Calendar needs review. No training-week totals are shown.'};}
  const counts={linked:0,unconfirmed:0,upcoming:0,skipped:0,cancelled:0,changed:0,duplicates:0};
  for(const row of rows){const linked=logs.filter(w=>w.sessionIntent?.schedule?.id===row.id);
   if(linked.length){counts.linked++;if(linked.length>1)counts.duplicates++;if(linked.some(w=>w.sessionIntent.schedule.revisionAt!==row.revisionAt))counts.changed++;}
   else if(row.status==='skipped')counts.skipped++;
   else if(row.status==='cancelled')counts.cancelled++;
   else if(row.date<asOf)counts.unconfirmed++;
   else counts.upcoming++;
  }
  const recent=logs.slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];
  return {status:'ready',from,through,workouts:weekLogs.length,sets,unknownEffort,counts,
   recent:recent?{date:recent.date,names:(recent.exercises||[]).map(e=>e.name).filter(Boolean).slice(0,3)}:null,
   brief:Brief.review({...state,workouts:logs},{asOf,now}),
   notice:'Session logs do not prove every target was met. Unconfirmed is not missed; unknown effort stays unknown. Counts use corrected saved records, not a recovery score.'};
 }
 return {inspect};
});
