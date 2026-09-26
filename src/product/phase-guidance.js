/* v2.31 — read-only, phase-aware evidence for explicitly scheduled meet cycles. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./meet-cycle'),require('./schedule'),require('./decision-readiness'),require('./session-intent'));
 else root.LoadnotePhaseGuidance=factory(root.LoadnoteMeetCycle,root.LoadnoteSchedule,root.LoadnoteReadiness,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Cycle,Schedule,Readiness,Intent){
 'use strict';
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const labels={'accumulation':'Accumulation','strength':'Strength','peaking':'Peaking','taper':'Taper','mock-meet':'Mock meet','meet':'Competition meet'};
 const focus={
  accumulation:['Complete planned work with recorded effort.','Observe per-lift set completion, exposure frequency and RPE without treating tonnage as recovery or capacity.'],
  strength:['Practice competition-specific work while comparing actual effort to planned caps.','Compare completed competition-lift exposures and RPE; inspect missing work before proposing any change.'],
  peaking:['Prioritize the scheduled competition-lift exposures.','Inspect logged execution of the prescribed work; these bounded examples do not validate maximal singles or meet openers.'],
  taper:['Follow the explicitly reviewed lower-volume schedule.','Compare actual exposure and prescribed effort without interpreting fatigue or readiness as medical measurements.'],
  'mock-meet':['Review the mock-meet date and record actual lift results.','This plan does not prescribe attempts; no readiness prediction or inferred competition result is available.'],
  meet:['Review the competition meet date and record actual lift results.','This plan does not prescribe attempts or verify official results; no readiness prediction or inferred competition result is available.']
 };
 const byId=(state,id)=> (state.scheduledSessions||[]).find(r=>r.id===id);
 const round=x=>Math.round(x*10)/10;
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 function inspect(state,{asOf,now=new Date().toISOString(),cycleId,reviewWeek}={}){
   if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Choose a valid phase-guidance review date');
   const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
   const candidates=Cycle.validate(state.meetCycles||[]).filter(c=>c.scheduledAt&&c.scheduledAt<=cutoff&&(!cycleId||c.id===cycleId));
   const running=candidates.filter(c=>c.config.startDate<=asOf&&c.config.meetDate>=asOf);
   const upcoming=candidates.filter(c=>c.config.startDate>asOf).sort((a,b)=>a.config.startDate.localeCompare(b.config.startDate));
   const previous=candidates.filter(c=>c.config.meetDate<asOf).sort((a,b)=>b.config.meetDate.localeCompare(a.config.meetDate));
   if(!cycleId&&running.length>1)throw Error('Multiple overlapping cycles need an explicit selection');
   const cycle=cycleId?candidates.find(c=>c.id===cycleId):running[0]||upcoming[0]||previous[0];
   if(!cycle)return null;
   const status=asOf<cycle.config.startDate?'upcoming':asOf>cycle.config.meetDate?'completed':'active';
   let week=status==='upcoming'?cycle.weekly[0]:status==='completed'?cycle.weekly.at(-1):cycle.weekly.find(w=>w.startDate<=asOf&&w.endDate>=asOf);
   if(reviewWeek!=null){
     if(!Number.isInteger(reviewWeek)||reviewWeek<1||reviewWeek>cycle.config.weeks)throw Error('Choose a valid cycle week');
     const selected=cycle.weekly.find(w=>w.week===reviewWeek);
     if(selected.endDate>asOf)throw Error('Review only after the selected week finishes');
     week=selected;
   }
   if(!week)throw Error('Original cycle week cannot be resolved');
   const samePhase=cycle.weekly.filter(w=>w.phase===week.phase),phaseEnd=samePhase.at(-1).endDate;
   const current=Schedule.list(state.scheduledSessions||[],cutoff),map=new Map(current.map(s=>[s.id,s]));
   const view=Readiness.workoutsAt(state,asOf,cutoff,false);
   const workouts=view.workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff);
   const linked=new Map();
   for(const w of workouts)if(w.sessionIntent?.schedule?.id?.startsWith('meet:'+cycle.id+':')){
     const id=w.sessionIntent.schedule.id,arr=linked.get(id)||[];arr.push(w);linked.set(id,arr);
   }
   const summary={planned:0,completed:0,skipped:0,cancelled:0,unconfirmed:0,upcoming:0,revised:0,unknown:0};
   const lifts={};
   for(const lift of ['squat','bench','deadlift'])lifts[lift]={lift,name:cycle.sourceProgram.config.lifts[lift].name,exerciseId:cycle.sourceProgram.config.lifts[lift].exerciseId,plannedSets:0,completedSets:0,validActualSets:0,plannedExposures:0,loggedExposures:0,rpeSets:0,aboveCap:0,comparableRpeSets:0,unmatchedSets:0,notes:[]};
   const details=[];
   for(const original of cycle.sessions.filter(s=>s.week===week.week)){
     const id='meet:'+cycle.id+':'+original.key,record=map.get(id),saved=linked.get(id)||[];
     let stateName='upcoming',trusted=null,match=false,unknown=false;
     if(record?.status==='skipped')stateName='skipped';
     else if(record?.status==='cancelled')stateName='cancelled';
     else if(saved.length===1){
       trusted=saved[0];const linkedRevision=byId(state,id)?.revisions.find(r=>r.recordedAt===trusted.sessionIntent?.schedule?.revisionAt&&r.recordedAt<=cutoff);
       try{match=!!(linkedRevision&&trusted.date===linkedRevision.context.date&&JSON.stringify(Intent.prescription(trusted.sessionIntent.prescription))===JSON.stringify(linkedRevision.context.prescription));}catch(error){match=false;}
       stateName=match?'completed':'unknown';unknown=!match;
     }else if(saved.length>1){stateName='unknown';unknown=true;}
     else if(original.date<asOf)stateName='unconfirmed';
     else if(!record){stateName='unknown';unknown=true;}
     if(record?.revisionAt&&byId(state,id)?.revisions[0]?.recordedAt!==record.revisionAt)summary.revised++;
     summary.planned++;summary[stateName]++;
     for(const originalExercise of original.exercises){
       const lift=lifts[originalExercise.lift];if(!lift)continue;
       lift.plannedExposures++;lift.plannedSets+=originalExercise.sets.length;
       if(!trusted||!match)continue;
       const actual=(trusted.exercises||[]).filter(e=>e.exerciseId===originalExercise.exerciseId&&e.type!=='cardio'&&e.trackBy!=='duration');
       if(!actual.length)continue;lift.loggedExposures++;
       const valid=actual.flatMap(e=>e.sets||[]).filter(s=>Number.isFinite(s.weight)&&s.weight>0&&Number.isInteger(s.reps)&&s.reps>0);
       lift.validActualSets+=valid.length;
       lift.completedSets+=Math.min(valid.length,originalExercise.sets.length);
       const planned=(trusted.sessionIntent?.prescription?.plannedExercises||[]).filter(e=>e.exerciseId===originalExercise.exerciseId);
       const originallyPlanned=planned.length===1&&planned[0].sets.length===originalExercise.sets.length&&planned[0].sets.every((set,i)=>{const prior=originalExercise.sets[i];return Math.abs(set.weight-prior.weight)<.02&&set.reps===prior.reps&&(set.targetRpe??null)===(prior.targetRpe??null);});
       const beforeTraining=Intent.planTiming(trusted.sessionIntent.prescription,trusted.date,trusted.sessionIntent.timing)==='before-training';
       for(const [i,s] of valid.entries()){
         if(Number.isFinite(s.rpe)&&s.rpe>=1&&s.rpe<=10)lift.rpeSets++;
         const target=originalExercise.sets[i],canCompare=originallyPlanned&&beforeTraining&&target&&Math.abs(s.weight-target.weight)<.02&&s.reps===target.reps&&Number.isFinite(s.rpe)&&s.rpe>=1&&s.rpe<=10&&Number.isFinite(target.targetRpe);
         if(canCompare){lift.comparableRpeSets++;if(s.rpe>target.targetRpe)lift.aboveCap++;}
         else lift.unmatchedSets++;
       }
     }
     details.push({id,date:original.date,name:original.name,status:stateName,revisionChanged:!!(record?.revisionAt&&byId(state,id)?.revisions[0]?.recordedAt!==record.revisionAt),linkedWorkoutId:trusted?.id||null,comparable:match,unknown});
   }
   const next=cycle.sessions.filter(s=>s.date>=asOf&&(!map.get('meet:'+cycle.id+':'+s.key)||map.get('meet:'+cycle.id+':'+s.key).status==='scheduled')&&!linked.has('meet:'+cycle.id+':'+s.key)).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
   const warnings=['The original schedule is a reference. Revised Calendar sessions are not silently interpreted as original planned work.','Missing workout logs are unconfirmed, not evidence that the athlete skipped training.','RPE comparisons require matching exercise identity, load and reps; missing or changed sets are not counted as cap exceedances.'];
   if(view.legacyTimestampCount)warnings.push(view.legacyTimestampCount+' historical workout record(s) lack an auditable creation timestamp and are not used for cycle guidance.');
   if(summary.revised)warnings.push(summary.revised+' current-week Calendar session(s) have recorded revisions; original targets are retained for comparison.');
   if(summary.unknown)warnings.push(summary.unknown+' current-week session(s) cannot be linked unambiguously to its approved prescription.');
   if(status==='completed')warnings.push('This cycle ended; guidance summarizes its last week rather than claiming an active prescription.');
   const phaseStart=samePhase[0].startDate,phaseLast=phaseEnd;
   return {version:1,asOf,cutoff,cycleId:cycle.id,cycleName:cycle.sourceProgram.config.name,totalWeeks:cycle.config.weeks,meetDate:cycle.config.meetDate,eventType:Cycle.eventType(cycle.config),eventName:cycle.config.eventName||null,
     status,week:week.week,phase:week.phase,phaseLabel:labels[week.phase],phaseWeek:week.phaseWeek,phaseWeeks:samePhase.length,phaseStart,phaseEnd:phaseLast,
     phaseFocus:focus[week.phase],nextReview:week.endDate,phaseReviewDate:phaseLast,summary,lifts,details,next:next?{key:next.key,date:next.date,name:next.name}:null,warnings,
     notice:'Read-only training context. Phase descriptions are programming priorities, not proof of adaptation or automatic approval to alter future sessions.'};
 }
 return {inspect,labels,focus};
});
