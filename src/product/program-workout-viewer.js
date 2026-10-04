/* v2.69.2 — read-only current-program workout viewer model.
 * Resolves the reviewed lifecycle program to the current Calendar prescription
 * without creating a second copy of the plan or changing training data.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./program-lifecycle'),require('./schedule'));
 else root.LoadnoteProgramWorkoutViewer=factory(root.LoadnoteProgramLifecycle,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Lifecycle,Schedule){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const phaseLabel=x=>({accumulation:'Accumulation',strength:'Strength',deload:'Deload',peaking:'Peaking',taper:'Taper','mock-meet':'Mock meet',meet:'Competition meet'}[x]||x||'Program');
 function requireDay(day){if(!Schedule.date(day))throw Error('Choose a valid program-view date');return day;}
 function allPrograms(state){return Lifecycle.programs(state||{});}
 function pickProgram(state,{asOf,programId=null}={}){
   requireDay(asOf);
   const all=allPrograms(state);
   if(programId){
     const found=all.find(p=>p.id===programId);
     if(!found)throw Error('Program is not available in the reviewed scheduled lifecycle');
     return found;
   }
   return Lifecycle.select(state,asOf).program||null;
 }
 function sourceSession(program,scheduleId){
   if(!program||!scheduleId?.startsWith(program.prefix))return null;
   const key=scheduleId.slice(program.prefix.length);
   return (program.record.sessions||[]).find(s=>s.key===key)||null;
 }
 function sourceExercise(source,planned){
   if(!source)return null;
   const id=planned?.exerciseId?String(planned.exerciseId):null;
   return (source.exercises||[]).find(e=>id&&String(e.exerciseId||'')===id)
     ||(source.exercises||[]).find(e=>String(e.name||'').trim().toLowerCase()===String(planned?.name||'').trim().toLowerCase())
     ||null;
 }
 function linkedWorkout(state,id,asOf){
   return (state?.workouts||[]).find(w=>w.sessionIntent?.schedule?.id===id&&w.date<=asOf)||null;
 }
 function exercise(planned,source){
   const tm=Number(source?.trainingMaxKg);
   return {...copy(planned),
     lift:source?.lift||null,
     ...(source?.progression?{progression:source.progression}:{}),
     ...(source?.repRange?{repRange:copy(source.repRange)}:{}),
     role:source?.role||null,
     format:source?.format||null,
     trainingMaxKg:Number.isFinite(tm)&&tm>0?tm:null,
     sourcePercentOfTrainingMax:Number.isFinite(Number(source?.percentOfTrainingMax))?Number(source.percentOfTrainingMax):null,
     purpose:source?.purpose||null
   };
 }
 function rowModel(state,row,program,asOf){
   const source=sourceSession(program,row.id);
   const done=linkedWorkout(state,row.id,asOf);
   return {
     id:row.id,date:row.date,name:row.name,state:row.state,status:row.status,reason:row.reason||'',
     revisionAt:row.revisionAt,role:row.role||'unspecified',goal:row.goal||'',
     sourceLabel:row.prescription?.source?.label||'',sourceType:row.prescription?.source?.type||null,
     program:program?{id:program.id,kind:program.kind,name:program.name}:null,
     week:Number(source?.week)||null,phase:source?.phase||null,phaseLabel:phaseLabel(source?.phase),phaseWeek:Number(source?.phaseWeek)||null,
     estimatedMinutes:Number(source?.estimatedMinutes)||null,
     exercises:(row.prescription?.plannedExercises||[]).map(p=>exercise(p,sourceExercise(source,p))),
     completedWorkout:done?{id:done.id,date:done.date,notes:done.notes||'',exercises:copy(done.exercises||[])}:null
   };
 }
 function programRows(state,program,asOf){
   return Schedule.rows(state?.scheduledSessions||[],state?.workouts||[],{asOf})
     .filter(row=>row.id.startsWith(program.prefix))
     .map(row=>rowModel(state,row,program,asOf));
 }
 function weekDefinitions(program,sessions){
   if(Array.isArray(program.record.weekly)&&program.record.weekly.length){
     return program.record.weekly.map(w=>({
       week:Number(w.week),phase:w.phase||null,phaseLabel:phaseLabel(w.phase),phaseWeek:Number(w.phaseWeek)||null,
       startDate:w.startDate||null,endDate:w.endDate||null,eventDate:w.meetDate||null
     }));
   }
   const byWeek=new Map();
   for(const s of program.record.sessions||[]){
     const week=Number(s.week)||1;
     if(!byWeek.has(week))byWeek.set(week,{week,phase:s.phase||null,phaseLabel:phaseLabel(s.phase),phaseWeek:Number(s.phaseWeek)||null,startDate:null,endDate:null,eventDate:null});
     const w=byWeek.get(week);if(!w.startDate||s.date<w.startDate)w.startDate=s.date;if(!w.endDate||s.date>w.endDate)w.endDate=s.date;
   }
   if(!byWeek.size&&sessions.length)for(const s of sessions){const week=s.week||1;if(!byWeek.has(week))byWeek.set(week,{week,phase:s.phase||null,phaseLabel:s.phaseLabel,phaseWeek:s.phaseWeek,startDate:s.date,endDate:s.date,eventDate:null});}
   return [...byWeek.values()].sort((a,b)=>a.week-b.week);
 }
 function phaseTimeline(weeks){
   const out=[];
   for(const w of weeks){
     const prior=out.at(-1);
     if(prior&&prior.phase===w.phase){prior.endWeek=w.week;prior.endDate=w.endDate||prior.endDate;continue;}
     out.push({phase:w.phase,phaseLabel:w.phaseLabel,startWeek:w.week,endWeek:w.week,startDate:w.startDate||null,endDate:w.endDate||null});
   }
   return out;
 }
 function view(state,{asOf,programId=null}={}){
   const program=pickProgram(state,{asOf,programId});if(!program)return null;
   const sessions=programRows(state,program,asOf),defs=weekDefinitions(program,sessions);
   const weeks=defs.map(w=>({...w,sessions:sessions.filter(s=>s.week===w.week)}));
   let progress=null;try{progress=Lifecycle.progress(program,asOf);}catch{}
   return {
     version:1,asOf,
     program:{id:program.id,kind:program.kind,name:program.name,startDate:program.startDate,endDate:program.endDate,totalWeeks:program.totalWeeks,eventType:program.eventType||null,eventName:program.eventName||null,eventDate:program.eventDate||null},
     progress,phases:phaseTimeline(weeks),weeks,sessions
   };
 }
 function day(state,day,{asOf=day}={}){
   requireDay(day);requireDay(asOf);
   const programs=allPrograms(state),rows=Schedule.rows(state?.scheduledSessions||[],state?.workouts||[],{asOf}).filter(r=>r.date===day);
   return rows.map(row=>{
     const program=programs.find(p=>row.id.startsWith(p.prefix))||null;
     return rowModel(state,row,program,asOf);
   });
 }
 function calendarDates(state,{asOf}={}){
   requireDay(asOf);
   const map={};
   for(const row of Schedule.rows(state?.scheduledSessions||[],state?.workouts||[],{asOf})){
     if(!map[row.date])map[row.date]={count:0,scheduled:0,completed:0,unconfirmed:0,skipped:0,cancelled:0};
     const bucket=map[row.date];bucket.count++;if(Object.hasOwn(bucket,row.state))bucket[row.state]++;
   }
   return map;
 }
 return {view,day,calendarDates,sourceSession,phaseTimeline};
});
