/* Reviewed, stable-dose cardio Calendar plans. No inferred heart-rate zones. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./session-intent'),require('./programming-profile'),require('./athlete-intake'),require('./program-edit'),require('./athlete-goals'));else root.LoadnoteCardioPlanner=factory(root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteProgrammingProfile,root.LoadnoteAthleteIntake,root.LoadnoteProgramEdit,root.LoadnoteGoals);})(typeof globalThis!=='undefined'?globalThis:this,function(S,I,P,A,E,G){
 'use strict';const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const SOURCE={title:'CDC adult activity guidelines',url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html'};
 const move=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 function preview(state,raw,{asOf,now=new Date().toISOString()}={}){
  const p=P.current(state.programmingProfiles||[]);if(!p)throw Error('Complete training setup and review activity availability first');
  if(!S.date(asOf)||!S.date(raw?.startDate)||raw.startDate<asOf||!Number.isInteger(raw.weeks)||raw.weeks<1||raw.weeks>20||!Array.isArray(raw.days)||!raw.days.length||new Set(raw.days).size!==raw.days.length||raw.days.some(d=>!Number.isInteger(d)||d<0||d>6||!p.context.availableDays.includes(d)))throw Error('Choose 1–20 weeks and distinct available weekdays starting today or later');
  if(!['easy','moderate'].includes(raw.intensity)||raw.equipmentConfirmed!==true||raw.doseConfirmed!==true)throw Error('Confirm modality access and an individually chosen tolerated starting duration');
  const t=E.target(state,{...raw.movement,type:'cardio',duration:raw.minutes});A.guard(p.context.intake,[t.exercise.exerciseId],{generation:true});
  if(p.context.avoidedExerciseIds.includes(t.exercise.exerciseId)||raw.minutes>p.context.sessionMinutes)throw Error('The movement is avoided or exceeds your session availability');
  const sessions=[],existing=S.rows(state.scheduledSessions||[],state.workouts||[],{asOf});
  for(let n=0;n<raw.weeks*7;n++){const day=move(raw.startDate,n),weekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7;if(!raw.days.includes(weekday))continue;
   if(existing.some(s=>s.date===day&&s.state!=='cancelled'&&s.state!=='skipped')||(state.workouts||[]).some(w=>w.date===day))throw Error(day+' already has planned or logged training; add cardio through the session editor or choose another day');
   for(const g of G.list(state.athleteGoals||[])){if(g.status!=='active')continue;const c=g.trainingContext;if(g.eventDate===day||c?.scheduleKnown&&(c.practiceDays.includes(weekday)||c.competitionDays.includes(weekday)))throw Error('Cardio overlaps a reported event/practice day; review total workload and choose another day');}
   const goal=raw.intensity==='moderate'?'Reviewed moderate cardio: use the talk test (able to talk, not sing); no heart-rate zone inferred. Stop if symptoms develop.':'Reviewed easy cardio: comfortable conversation; no heart-rate zone inferred. Stop if symptoms develop.';
   sessions.push({date:day,name:t.exercise.name+' · '+raw.minutes+' min cardio',status:'scheduled',role:'recovery',goal,blockId:null,reason:'',prescription:I.createPrescription([t.exercise],{type:'program',label:'Athlete-reviewed cardio'},now)});
  }
  if(!sessions.length)throw Error('No selected dates are in this time window');
  return {version:1,asOf,createdAt:now,request:clone(raw),profileSnapshot:clone(p),sessions,catalogEntry:t.catalogEntry,weeklyMinutes:raw.days.length*raw.minutes,reportedBaseline:p.context.intake?.cardioMinutes??null,notice:'Stable starting dose selected by the athlete; no automatic progression or injury rehabilitation. CDC population guidelines are general context, not an instruction to jump to 150 minutes. Cardio and strength outcomes remain separate.',source:SOURCE};
 }
 function approve(state,p,{asOf,confirmed=false,draftOpen=false,now=new Date().toISOString(),id}={}){
  if(!confirmed||draftOpen||typeof id!=='string'||!id||id.length>100||!p||asOf!==p.asOf||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)throw Error('Close open training drafts and explicitly review all cardio dates');
  const fresh=preview(state,p.request,{asOf,now:p.createdAt});if(!same(fresh,p)||now<p.createdAt)throw Error('Training context changed; preview cardio again');
  let sessions=state.scheduledSessions||[];for(let n=0;n<p.sessions.length;n++)sessions=S.create(sessions,p.sessions[n],{id:'cardio:'+id+':'+n,now});
  return {...state,scheduledSessions:sessions,exerciseCatalog:p.catalogEntry?[...(state.exerciseCatalog||[]),p.catalogEntry]:state.exerciseCatalog};
 }
 return {SOURCE,preview,approve};
});
