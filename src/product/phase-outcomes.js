/* v2.24: read-only, as-recorded outcomes of accepted phase adjustments. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./phase-review'),require('./decision-readiness'),require('./schedule'),require('./session-intent'));
  else root.LoadnotePhaseOutcomes=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnotePhaseReview,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Builder,Review,Readiness,Schedule,Intent){
  'use strict';
  const LIFTS=Builder.LIFTS;
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const rounded=n=>Math.round(n*100)/100;
  const median=xs=>{const s=[...xs].sort((a,b)=>a-b);return (s[Math.floor((s.length-1)/2)]+s[Math.floor(s.length/2)])/2;};
  const selectedSets=(exercises,ids)=>(exercises||[]).filter(e=>ids.has(e.exerciseId)).flatMap(e=>(e.sets||[]).map(set=>({...set,exerciseId:e.exerciseId}))).sort((a,b)=>a.exerciseId.localeCompare(b.exerciseId));
  function bestCapacity(sets){
    const values=(sets||[]).map(s=>Core.capacityEvidence(s.weight,s.reps,s.rpe).estimate).filter(Number.isFinite);
    return values.length?Math.max(...values):null;
  }
  function analyze(state,{asOf,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!iso(now))throw Error('Choose a valid outcome date');
    const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
    const programs=Builder.validate(state.phasePrograms||[]),reviews=Review.validate(state.phaseReviews||[]).filter(r=>r.createdAt<=cutoff&&r.asOf<=asOf);
    const schedule=Schedule.validate(state.scheduledSessions||[]),workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff);
    const result=[];
    for(const review of reviews){
      const program=programs.find(p=>p.id===review.programId&&p.createdAt<=review.createdAt&&p.scheduledAt&&p.scheduledAt<=review.createdAt);
      const next=program?.config.phases[program.config.phases.findIndex(p=>p.type===review.phase)+1]?.type||null;
      const targets=next?program.sessions.filter(s=>s.phase===next&&s.date>review.asOf):[];
      const from=targets.length?targets[0].date:null,through=targets.length?targets.at(-1).date:null,findings={};
      for(const lift of LIFTS){
        const finding=review.findings[lift],id=finding.exerciseId,variationId=program?.config.lifts[lift].variation?.exerciseId||null,ids=new Set([id,...(variationId?[variationId]:[])]),rows=[];
        const source=targets.filter(s=>s.exercises.some(e=>e.lift===lift));
        for(const target of source){
          const sid=`phase:${program.id}:${target.key}`,record=schedule.find(s=>s.id===sid);
          const approved=record?.revisions.filter(v=>v.recordedAt<=review.createdAt).at(-1);
          const visible=record?.revisions.filter(v=>v.recordedAt<=cutoff).at(-1);
          const ws=workouts.filter(w=>w.sessionIntent?.schedule?.id===sid);
          const row={date:target.date,sessionId:sid,workoutId:ws.length===1?ws[0].id:null,status:'unconfirmed',approvedSets:selectedSets(approved?.context.prescription?.plannedExercises,ids).length,completedSets:0,withinCap:null,estimatedCapacityKg:null};
          if(!record||!approved||!visible){row.status='missing';rows.push(row);continue;}
          if(approved.context.status!=='scheduled'||approved.context.date!==target.date){row.status='changed-before-approval';rows.push(row);continue;}
          if(ws.length>1){row.status='ambiguous';rows.push(row);continue;}
          if(!ws.length){row.status=visible.context.status==='scheduled'?(target.date>asOf?'upcoming':'unconfirmed'):visible.context.status;rows.push(row);continue;}
          const w=ws[0],link=w.sessionIntent?.schedule;
          if(w.date!==target.date||w.createdAt<=review.createdAt||w.date<=review.asOf){row.status='timing';rows.push(row);continue;}
          const linked=record.revisions.find(v=>v.recordedAt===link?.revisionAt&&v.recordedAt<=w.createdAt);
          if(record.revisions.some(v=>v.recordedAt>review.createdAt&&v.recordedAt<=w.createdAt&&v.recordedAt!==approved.recordedAt)){row.status='plan-revised-or-timing';rows.push(row);continue;}
          if(!linked||linked.recordedAt!==approved.recordedAt||!same(linked.context.prescription,approved.context.prescription)||!same(w.sessionIntent?.prescription,approved.context.prescription)||Intent.planTiming(approved.context.prescription,w.date,w.sessionIntent?.timing)!=='before-training'){row.status='plan-revised-or-timing';rows.push(row);continue;}
          const mapped=Readiness.list(state.exerciseRoles||[],w.createdAt).filter(r=>r.role==='competition'&&r.competitionLift===lift);
          if(mapped.length!==1||mapped[0].exerciseId!==id){row.status='mapping-changed';rows.push(row);continue;}
          if(variationId&&target.exercises.some(e=>e.exerciseId===variationId)){const variation=Readiness.list(state.exerciseRoles||[],w.createdAt).filter(r=>r.exerciseId===variationId&&r.role==='close-variation'&&r.competitionLift===lift);if(variation.length!==1){row.status='mapping-changed';rows.push(row);continue;}}
          const expected=selectedSets(approved.context.prescription.plannedExercises,ids),actual=selectedSets((w.exercises||[]).filter(e=>e.type!=='cardio'&&e.trackBy!=='duration'),ids);
          row.completedSets=actual.filter(s=>Number.isFinite(s.weight)&&s.weight>0&&Number.isInteger(s.reps)&&s.reps>0).length;
          if(!expected.length||expected.length!==actual.length||!actual.every((s,i)=>s.exerciseId===expected[i].exerciseId&&s.reps===expected[i].reps&&Number.isFinite(s.weight)&&Math.abs(s.weight-expected[i].weight)<=.02)){row.status='work-deviated';rows.push(row);continue;}
          if(actual.some(s=>s.rpe==null||s.rpe===''||!Number.isFinite(Number(s.rpe))||Number(s.rpe)<6||Number(s.rpe)>10)){row.status='rpe-missing';rows.push(row);continue;}
          row.status='matched';row.withinCap=actual.every((s,i)=>Number(s.rpe)<=expected[i].targetRpe);
          row.estimatedCapacityKg=bestCapacity(actual.filter(s=>s.exerciseId===id));rows.push(row);
        }
        const completed=rows.filter(r=>r.workoutId).length,matched=rows.filter(r=>r.status==='matched'),withinCap=matched.filter(r=>r.withinCap).length;
        const baselineByDay=new Map();
        for(const s of finding.performance||[])if(s.date<=review.through&&Number.isFinite(s.estimatedCapacity)&&s.estimatedCapacity>0&&(!baselineByDay.has(s.date)||s.estimatedCapacity>baselineByDay.get(s.date)))baselineByDay.set(s.date,s.estimatedCapacity);
        const baseline=[...baselineByDay].sort((a,b)=>a[0].localeCompare(b[0])).slice(-2),followup=[...new Map(matched.filter(r=>r.estimatedCapacityKg!==null).map(r=>[r.date,r.estimatedCapacityKg])).values()];
        const comparable=rows.length>=2&&matched.length===rows.length&&baseline.length===2&&followup.length>=2;
        const early=comparable?median(baseline.map(r=>r[1])):null,late=comparable?median(followup.slice(-2)):null;
        const changePct=comparable&&early>0?rounded((late/early-1)*100):null;
        findings[lift]={exerciseId:id,name:finding.name,choice:review.choices[lift],why:finding.reason,expected:rows.length,completed,matched:matched.length,withinCap,aboveCap:matched.length-withinCap,baselineEstimateKg:early==null?null:rounded(early),followupEstimateKg:late==null?null:rounded(late),observedChangePct:changePct,
          status:!next?'sequence-complete':!rows.length?'no-next-phase-exposure':!comparable?'gather-follow-up':'observed-follow-up',
          evidenceNote:comparable?'Observed estimated-capacity difference is descriptive, not proof the adjustment caused a change.':'Complete linked, unmodified next-phase workouts with valid RPE plus two dated competition-lift capacity estimates before comparing.',rows};
      }
      result.push({reviewId:review.id,programId:review.programId,programName:program?.config.name||'Unavailable program',phase:review.phase,nextPhase:next,acceptedAt:review.createdAt,from,through,findings});
    }
    return {version:1,asOf,cutoff,reviews:result.reverse(),notice:'Outcomes are descriptive, as-recorded follow-up. No automatic program changes, causal claims, readiness diagnoses or proven optimal volume.'};
  }
  return {analyze};
});
