/* v2.51 — deterministic continuity from saved training to the next scheduled session. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./session-intent'));
 else root.LoadnoteTrainingContinuity=factory(root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Intent){
 'use strict';
 const validRpe=x=>Number.isFinite(Number(x))&&Number(x)>=1&&Number(x)<=10;
 const strengthSets=workout=>(workout?.exercises||[]).filter(e=>e.type!=='cardio').flatMap(e=>{
   const measure=e.trackBy==='duration'?'duration':'reps';
   return (e.sets||[]).filter(s=>Number(s?.[measure])>0);
 });
 function scheduleMeta(state,session){
   if(!session)return null;
   const raw=(state?.scheduledSessions||[]).find(r=>r.id===session.id),first=raw?.revisions?.[0]?.context;
   const planned=session.prescription?.plannedExercises||[];
   return {...session,
     exerciseCount:planned.length,
     setCount:planned.reduce((n,e)=>n+(e.type==='cardio'?1:(e.sets||[]).length),0),
     revisionCount:raw?.revisions?.length||1,
     originalDate:first?.date||session.date,
     rescheduled:!!first?.date&&first.date!==session.date
   };
 }
 function evidence(workout){
   if(!workout)return null;
   const sets=strengthSets(workout),rpeSets=sets.filter(s=>validRpe(s.rpe)).length;
   const comparison=Intent.compare(workout),linked=!!workout.sessionIntent?.schedule?.id;
   const reason=workout.sessionIntent?.deviationReason||'none';
   const partial=!!comparison&&comparison.completedSets<comparison.plannedSets;
   const modifiedComplete=!!comparison&&!partial&&comparison.exactSets<comparison.plannedSets;
   return {
     linked,scheduleId:workout.sessionIntent?.schedule?.id||null,
     comparison,actualStrengthSets:sets.length,rpeSets,rpeCoverage:sets.length?Math.round(rpeSets/sets.length*1000)/10:null,
     partial,modifiedComplete,deviationReason:reason,deviationLabel:Intent.DEVIATION_REASONS?.[reason]||reason,
     deviationNotes:workout.sessionIntent?.deviationNotes||'',
     evidenceReady:linked&&sets.length>0&&!!comparison
   };
 }
 function inspect(state,{asOf,workoutId=null}={}){
   if(!Schedule.date(asOf))throw Error('Choose a valid continuity date');
   const workouts=state?.workouts||[],linkedIds=new Set(workouts.map(w=>w?.sessionIntent?.schedule?.id).filter(Boolean));
   const sessions=Schedule.list(state?.scheduledSessions||[]);
   const unresolvedOverdue=sessions.filter(s=>s.status==='scheduled'&&s.date<asOf&&!linkedIds.has(s.id)).map(s=>scheduleMeta(state,s));
   const upcoming=sessions.filter(s=>s.status==='scheduled'&&s.date>=asOf&&!linkedIds.has(s.id)).map(s=>scheduleMeta(state,s));
   const workout=workoutId==null?null:workouts.find(w=>String(w.id)===String(workoutId))||null;
   const workoutEvidence=evidence(workout);
   return {version:1,asOf,workoutId:workout?.id||null,workoutEvidence,
     unresolvedOverdue,next:upcoming[0]||null,upcomingCount:upcoming.length,
     notice:'Past scheduled sessions without a linked workout stay unresolved until the athlete marks them skipped, cancelled, rescheduled, or logs the session. Loadnote does not silently count them as missed.'};
 }
 return {inspect,evidence,scheduleMeta};
});
