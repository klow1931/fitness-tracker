/* v2.71 — current-program workout viewer with adaptation transparency. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayWeight=kg=>{
   const n=Number(kg);if(!Number.isFinite(n))return '';
   try{return toDisplay(n)+' '+unitLabel();}catch{return Math.round(n*100)/100+' kg';}
 };
 const pct=(kg,tm)=>{const a=Number(kg),b=Number(tm);return Number.isFinite(a)&&Number.isFinite(b)&&b>0?Math.round(a/b*1000)/10:null;};
 const statusLabel=s=>({scheduled:'Planned',completed:'Completed',unconfirmed:'Needs outcome',skipped:'Skipped',cancelled:'Cancelled'}[s]||s||'Planned');
 const dateLabel=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}catch{return d;}};
 function setText(set,exercise){
   const amount=exercise.trackBy==='duration'?(Number(set.duration)||0)+' sec':set.minReps!==undefined?set.minReps+'–'+set.maxReps+' reps':(Number(set.reps)||0)+' reps';
   const parts=[amount];
   if(Object.hasOwn(set||{},'weight'))parts.unshift(displayWeight(set.weight));
   const percent=pct(set?.weight,exercise.trainingMaxKg);if(percent!=null)parts.push(percent+'% TM');
   if(Number(set?.targetRpe)>=1&&Number(set.targetRpe)<=10)parts.push('RPE '+set.targetRpe);
   return parts.join(' · ');
 }
 function why(exercise){
   const parts=[];
   if(exercise.loadConvention)parts.push(window.LoadnoteHypertrophyBuilder?.CONVENTIONS[exercise.loadConvention]||exercise.loadConvention);
   if(exercise.restSeconds)parts.push(exercise.restSeconds+'s rest allowance');
   if(exercise.purpose)parts.push(exercise.purpose);
   if(exercise.progression)parts.push(exercise.progression);
   if(exercise.role)parts.push(exercise.role.replaceAll('-',' ')+' role');
   if(exercise.format)parts.push(exercise.format.replaceAll('-',' ')+' format');
   return parts.join(' · ');
 }
 function actualSummary(workout){
   if(!workout)return '';
   const total=(workout.exercises||[]).reduce((n,e)=>n+(e.type==='cardio'?1:(e.sets||[]).length),0);
   return '<p class="program-workout-actual"><b>Logged:</b> '+total+' completed set'+(total===1?'':'s')+(workout.notes?' · '+esc(workout.notes):'')+'</p>';
 }
 function exerciseHtml(exercise){
   if(exercise.type==='practice')return '<section class="program-workout-exercise"><h4>'+esc(exercise.name)+'</h4><p>'+esc(exercise.kind+' · '+exercise.rounds+' × '+exercise.reps+(exercise.kind==='weightlifting'?' attempts · '+displayWeight(exercise.weight)+' total-bar load · '+exercise.family+' · '+exercise.variation:exercise.kind==='jump'?' contacts per round':' reps · '+exercise.distanceMeters+'m per rep')+' · rest '+exercise.restSeconds+'s')+'</p><p>'+esc(exercise.protocol)+'</p><p>Actual outcomes are recorded separately, never strength PRs or inferred readiness.</p></section>';
   const sets=(exercise.sets||[]).map((s,i)=>'<li><span>Set '+(i+1)+'</span><b>'+esc(setText(s,exercise))+'</b></li>').join('');
   const context=why(exercise);
   return '<section class="program-workout-exercise"><div class="program-workout-exercise-head"><h4>'+esc(exercise.name)+'</h4>'+(exercise.trainingMaxKg?'<span>TM '+esc(displayWeight(exercise.trainingMaxKg))+'</span>':'')+'</div>'+
     (exercise.type==='cardio'?'<p>'+esc(exercise.duration+' conditioning minutes')+'</p>':sets?'<ol class="program-workout-sets">'+sets+'</ol>':'<p>No set targets captured.</p>')+
     (context?'<p class="program-workout-why"><b>Why:</b> '+esc(context)+'</p>':'')+'</section>';
 }
 function sessionHtml(session,{open=false,calendar=false}={}){
   const summary=(calendar?'Planned workout':'')+(calendar?' · ':'')+dateLabel(session.date)+' · '+session.exercises.map(e=>e.name).join(' / ');
   const start=session.state==='scheduled'&&session.date===today()?'<button type="button" class="btn-primary" data-program-start="'+esc(session.id)+'">Start workout</button>':'';
   let adaptation=null;try{adaptation=window.LoadnoteAdaptationExplanation?.forSession?.(data,session.id)||null;}catch{}
   const adapted=!!adaptation?.changedLifts?.length;
   const state='<span class="program-workout-state" data-state="'+esc(session.state)+'">'+esc(adapted&&session.state==='scheduled'?'Updated':statusLabel(session.state))+'</span>';
   const adaptationHtml=adapted?(window.LoadnoteAdaptationExplanationUI?.render?.(adaptation,{summary:'Why this prescription changed'})||''):'';
   return '<details class="program-workout-session" data-program-session="'+esc(session.id)+'" '+(open?'open':'')+'><summary><span><b>'+esc(summary)+'</b><small>'+esc(session.name)+(session.estimatedMinutes?' · ~'+session.estimatedMinutes+' min':'')+'</small></span>'+state+'</summary>'+
     '<div class="program-workout-session-body">'+session.exercises.map(exerciseHtml).join('')+adaptationHtml+actualSummary(session.completedWorkout)+(session.reason?'<p class="more-hint">'+esc(session.reason)+'</p>':'')+
     '<div class="program-workout-session-actions">'+start+'</div></div></details>';
 }
 function phaseStrip(view){
   if(!view.phases?.length)return '';
   return '<div class="program-workout-phase-strip" aria-label="Program phases">'+view.phases.map(p=>'<span data-phase="'+esc(p.phase)+'">'+esc(p.phaseLabel)+'<small>W'+p.startWeek+(p.endWeek!==p.startWeek?'–'+p.endWeek:'')+'</small></span>').join('')+'</div>';
 }
 function eventLine(p){
   if(p.kind!=='meet-cycle')return '';
   const name=p.eventType==='competition'?(p.eventName||'Competition meet'):'Mock meet';
   return '<p class="program-workout-event">'+esc(name)+' · '+esc(p.eventDate)+'</p>';
 }
 function viewerHtml(view,{sessionId=null}={}){
   const selected=view.sessions.find(s=>s.id===sessionId)||null,currentWeek=selected?.week||view.progress?.week||null;
   const weeks=view.weeks.map(w=>{
     const open=w.week===currentWeek;
     const event=!w.sessions.length&&w.eventDate?'<div class="program-workout-event-week"><b>'+esc(w.phaseLabel)+'</b><p>'+esc(w.eventDate)+' · Event day. Attempt loads are not automatically prescribed.</p></div>':'';
     return '<details class="program-workout-week" data-program-week="'+w.week+'" '+(open?'open':'')+'><summary><span><b>Week '+w.week+' — '+esc(w.phaseLabel)+'</b><small>'+w.sessions.length+' workout'+(w.sessions.length===1?'':'s')+(w.startDate?' · '+esc(w.startDate)+(w.endDate&&w.endDate!==w.startDate?' – '+esc(w.endDate):''):'')+'</small></span></summary>'+
       '<div class="program-workout-week-body">'+event+w.sessions.map(s=>sessionHtml(s,{open:s.id===sessionId})).join('')+'</div></details>';
   }).join('');
   return '<div class="program-workout-viewer-head"><div><p class="eyebrow">CURRENT PROGRAM</p><h2>'+esc(view.program.name)+'</h2><p>'+esc(view.program.totalWeeks+' weeks · '+view.program.startDate+' → '+view.program.endDate)+'</p>'+eventLine(view.program)+'</div><button type="button" class="btn-secondary" data-program-close>Close</button></div>'+
     phaseStrip(view)+'<p class="program-workout-help">Open any workout to see its current scheduled prescription, target RPE, training-max context and why it was prescribed.</p>'+weeks;
 }
 function bind(host){
   host.querySelectorAll('[data-program-start]').forEach(b=>b.addEventListener('click',()=>window.startScheduledWorkout?.(b.dataset.programStart)));
   host.querySelector('[data-program-close]')?.addEventListener('click',()=>host.closest('dialog')?.close());
 }
 function open(programId=null,sessionId=null){
   if(!window.LoadnoteProgramWorkoutViewer)return;
   let view;try{view=LoadnoteProgramWorkoutViewer.view(data,{asOf:today(),programId});}catch(error){showToast?.(error.message,'error');return;}
   if(!view){showToast?.('No reviewed scheduled program is available.','info');return;}
   let dlg=document.getElementById('program-workout-dialog');
   if(!dlg){dlg=document.createElement('dialog');dlg.id='program-workout-dialog';dlg.className='card program-workout-dialog';document.body.append(dlg);}
   dlg.innerHTML=viewerHtml(view,{sessionId});bind(dlg);dlg.showModal();
   if(sessionId)setTimeout(()=>{const target=[...dlg.querySelectorAll('[data-program-session]')].find(x=>x.dataset.programSession===sessionId);target?.scrollIntoView({block:'center',behavior:'smooth'});},40);
 }
 function calendarDayHtml(day,rows){
   if(!rows?.length)return '';
   return '<section class="calendar-program-plan"><div class="calendar-program-plan-head"><span class="eyebrow">PLANNED</span><b>'+rows.length+' scheduled workout'+(rows.length===1?'':'s')+'</b></div>'+rows.map(r=>sessionHtml(r,{open:true,calendar:true})).join('')+'</section>';
 }
 function bindCalendarDay(host){if(host)bind(host);}
 window.LoadnoteProgramWorkoutViewerUI={open,calendarDayHtml,bindCalendarDay,sessionHtml};
})();
