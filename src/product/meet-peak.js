/* v2.28: bounded, read-only meet-peak session proposal. Athlete review is required. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./meet-preparation'),require('./phase-builder'),require('./decision-readiness'),require('./lift-performance'),require('./schedule'));
  else root.LoadnoteMeetPeak=factory(root.LoadnoteMeetPreparation,root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteLiftPerformance,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Meet,Builder,Readiness,Performance,Schedule){
 'use strict';
 const LIFTS=Builder.LIFTS;
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const shift=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 const round=(n,step)=>Math.round(Math.floor((n+1e-8)/step)*step*100)/100;
 function preview(state,program,{meetDate,peakWeeks=3,asOf,now=new Date().toISOString()}={}){
   if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Choose a valid review date no later than the current date');
   const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
   const record=Builder.validate([program])[0];
   if(record.createdAt>cutoff)throw Error('Reviewed phase program was not known at this time');
   const timeline=Meet.plan(record.config,{meetDate,peakWeeks});
   if(timeline.peakStart<=asOf)throw Error('Choose a meet timeline whose peak starts after the review date');
   const performance=Performance.compare(state,record.config,{asOf,now:cutoff});
   const recent=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff&&w.date>=shift(asOf,-27));
   const entries=[],evidence={};
   for(const lift of LIFTS){
     const main=record.config.lifts[lift],roleSnapshot=record.roleSnapshot.filter(r=>r.role==='competition'&&r.competitionLift===lift);
     if(roleSnapshot.length!==1||roleSnapshot[0].exerciseId!==main.exerciseId)throw Error('Reviewed competition-lift identity is incomplete');
     const latestRoles=Readiness.list(state.exerciseRoles||[],cutoff).filter(r=>r.role==='competition'&&r.competitionLift===lift);
     if(latestRoles.length!==1||latestRoles[0].exerciseId!==main.exerciseId)throw Error('Competition exercise mappings changed; review before proposing a meet peak');
     const mainDay=main.exposures.find(e=>e.role==='primary')?.day;
     const dates=new Set(),sets=[];
     for(const w of recent){
       const exs=(w.exercises||[]).filter(e=>e.exerciseId===main.exerciseId&&e.type!=='cardio'&&e.trackBy!=='duration');
       for(const ex of exs)for(const set of ex.sets||[])if(Number.isFinite(set.weight)&&set.weight>0&&Number.isInteger(set.reps)&&set.reps>0){
         dates.add(w.date);sets.push({date:w.date,weight:set.weight,reps:set.reps,rpe:set.rpe});
       }
     }
     const last=performance.lifts[lift],sufficient=dates.size>=3&&last.evidenceDays>=4,over=sets.filter(s=>s.rpe!=null&&s.rpe!==''&&Number.isFinite(Number(s.rpe))&&Number(s.rpe)>8).length;
     evidence[lift]={exerciseId:main.exerciseId,name:main.name,trainingMaxKg:main.trainingMaxKg,recordedDays:dates.size,recordedSets:sets.length,highRpeSets:over,estimatedDirection:last.direction,estimatedChangePct:last.changePct,readiness:sufficient&&last.direction!=='lower-estimate'&&over===0?'review-proposal':'individual-review-needed',
       notes:[!sufficient?'Fewer than three recent competition-lift exposure dates or four distinct valid RPE-aware estimate dates; no athlete-specific tolerance is inferred.':'Recent competition-lift history is available for manual comparison.',
       ...(last.direction==='lower-estimate'?['Estimated competition-lift capacity is lower over the review window; review this lift before confirming any peak loads.']:[]),
       ...(over?[`${over} recent valid set(s) had logged RPE above 8; check the actual exposures before approving heavier practice.`]:[])]};
     for(let i=0;i<timeline.weeks.length;i++){
       const week=timeline.weeks[i],taper=i===timeline.weeks.length-1;
       const pct=taper?60:Math.min(80,75+i*5);
       const weight=round(main.trainingMaxKg*pct/100,record.config.incrementKg);
       if(!(weight>0&&weight<=main.trainingMaxKg*.85+.001))throw Error('A proposed load exceeds the supported training-max ceiling');
       const count=taper?1:Math.min(main.sets,2),reps=taper?3:2,cap=taper?6:8;
       entries.push({lift,exerciseId:main.exerciseId,name:main.name,date:shift(week.startDate,mainDay),week:i+1,emphasis:week.emphasis,source:'reviewed training max',sets:Array.from({length:count},()=>({weight,reps,targetRpe:cap})),percentageTrainingMax:pct,
         notice:taper?'Single low-load familiar-lift exposure proposal; meet-week practice and exact last session require manual review.':'Conservative, competition-specific example; not clearance for a heavy single, a meet opener, or demonstrated recoverability.'});
     }
   }
   entries.sort((a,b)=>a.date.localeCompare(b.date)||LIFTS.indexOf(a.lift)-LIFTS.indexOf(b.lift));
   const existing=Schedule.list(state.scheduledSessions||[],cutoff).filter(s=>s.status==='scheduled'&&entries.some(e=>e.date===s.date));
   const warnings=[...timeline.warnings.filter(w=>!w.startsWith('Planning preview only: no sets, loads')),
     'Example training-max percentages are bounded to 80% and do not infer safe near-max singles, meet attempts or actual recovery from the training log.',
     'Only confirmed competition-lift identities and the original primary-exposure days are used. Close variations and accessories are excluded.',
     'This preview is not scheduled or approved. Review each lift, taper timing, session duration and competition-week logistics before using any prescription.',
     ...(existing.length?[`${existing.length} Calendar session(s) fall on proposed peak training dates; no conflicts are overwritten.`]:[])];
   if(Object.values(evidence).some(e=>e.readiness!=='review-proposal'))warnings.push('At least one lift requires individual review before treating any suggested peak load as appropriate.');
   return {version:1,asOf,cutoff,programId:record.id,meetDate,peakWeeks,timeline,evidence,entries,warnings,
     notice:'Read-only competition-specific training proposal, not personalized validated meet preparation. Training maxes are not verified maxes. No automatic adjustments, scheduling, attempt selection or historical writes.'};
 }
 return {preview};
});
