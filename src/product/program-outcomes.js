(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./program-review'),require('./decision-readiness'),require('./schedule'),require('./session-intent'));
  else root.LoadnoteProgramOutcomes=factory(root.LoadnoteProgramReview,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Review,Readiness,Schedule,Intent){
  'use strict';
  const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const move=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const sets=(plan,id)=>(plan?.plannedExercises||[]).filter(e=>e.exerciseId===id).flatMap(e=>e.sets||[]);
  const samePlan=(a,b)=>JSON.stringify(Intent.prescription(a))===JSON.stringify(Intent.prescription(b));
  const labels={pending:'Upcoming / awaiting log',unconfirmed:'No confirmed workout',skipped:'Explicitly skipped',cancelled:'Cancelled',missing:'Schedule unavailable',ambiguous:'Multiple linked workouts',timing:'Timing not confirmed',outside:'Outside follow-up week',revised:'Plan changed after approval',mapping:'Competition mapping changed',substituted:'Lift missing or substituted',sets:'Set count changed',reps:'Reps changed',load:'Load changed',rpe:'RPE missing or outside 6–10',matched:'Followed approved plan',ineligible:'Not a future scheduled target',unavailable:'Program context unavailable'};

  function session(state,review,original,id,exerciseId,{from,to,asOf,cutoff,workouts}){
    const record=(state.scheduledSessions||[]).find(s=>s.id===id);
    const approved=record?.revisions.filter(v=>v.recordedAt<=review.createdAt).at(-1);
    const current=record?.revisions.filter(v=>v.recordedAt<=cutoff).at(-1);
    const change=review.changes.find(c=>c.id===id);
    const row={id,name:original.name,date:original.date,original:clone(original.exercises.filter(e=>e.exerciseId===exerciseId)),approved:clone((approved?.context.prescription?.plannedExercises||[]).filter(e=>e.exerciseId===exerciseId)),actual:[],workoutId:null,issues:[],followedWork:null,withinCap:null,comparedSets:0,deviationReason:'none',deviationNotes:''};
    const finish=code=>({...row,status:code,label:labels[code]});
    if(!approved||!current)return finish('missing');
    row.date=current.context.date;
    if(approved.context.status!=='scheduled'||approved.context.date<=review.asOf)return finish('ineligible');
    if(change&&(JSON.stringify(change.after)!==JSON.stringify(approved)))return finish('revised');
    const ws=workouts.filter(w=>w.sessionIntent?.schedule?.id===id);
    if(ws.length>1)return finish('ambiguous');
    if(!ws.length){
      if(current.context.status!=='scheduled')return finish(current.context.status);
      if(current.context.date<from||current.context.date>to)return finish('outside');
      return finish(current.context.date>=asOf?'pending':'unconfirmed');
    }
    const w=ws[0];row.workoutId=w.id;row.date=w.date;row.actual=clone((w.exercises||[]).filter(e=>e.exerciseId===exerciseId));
    row.deviationReason=w.sessionIntent?.deviationReason||'none';row.deviationNotes=w.sessionIntent?.deviationNotes||'';
    if(w.date<from||w.date>to)return finish('outside');
    const link=w.sessionIntent?.schedule,linked=record.revisions.find(v=>v.recordedAt===link?.revisionAt);
    if(!iso(w.createdAt)||w.createdAt<=review.createdAt||w.date<=review.asOf||!linked||linked.recordedAt>w.createdAt)return finish('timing');
    if(link.revisionAt!==approved.recordedAt||!samePlan(w.sessionIntent?.prescription,approved.context.prescription))return finish('revised');
    if(Intent.planTiming(approved.context.prescription,w.date,w.sessionIntent?.timing)!=='before-training')return finish('timing');
    // The lift is supplied by the immutable review finding, never inferred from its name.
    const lift=Object.keys(review.findings).find(l=>review.findings[l]?.exerciseId===exerciseId);
    const mappings=Readiness.list(state.exerciseRoles||[],w.createdAt).filter(r=>r.role==='competition'&&r.competitionLift===lift);
    if(mappings.length!==1||mappings[0].exerciseId!==exerciseId)return finish('mapping');
    const actual=(w.exercises||[]).filter(e=>e.exerciseId===exerciseId&&e.type!=='cardio'&&e.trackBy!=='duration').flatMap(e=>e.sets||[]);
    const plan=sets(approved.context.prescription,exerciseId);
    if(!actual.length){row.followedWork=false;return finish('substituted');}
    if(!plan.length)return finish('revised');
    if(actual.length!==plan.length)row.issues.push('sets');
    for(let i=0;i<Math.min(actual.length,plan.length);i++){
      const a=actual[i],p=plan[i];
      if(a.reps!==p.reps)row.issues.push('reps');
      if(!Number.isFinite(a.weight)||a.weight<=0||Math.abs(a.weight-p.weight)>.02)row.issues.push('load');
      if(a.rpe==null||a.rpe===''||!Number.isFinite(Number(a.rpe))||Number(a.rpe)<6||Number(a.rpe)>10||!Number.isFinite(p.targetRpe))row.issues.push('rpe');
    }
    row.issues=[...new Set(row.issues)];
    row.followedWork=!row.issues.some(code=>['sets','reps','load'].includes(code));
    if(row.issues.length)return finish(row.issues[0]);
    row.comparedSets=plan.length;row.withinCap=actual.every((s,i)=>Number(s.rpe)<=plan[i].targetRpe);
    return finish('matched');
  }

  function analyze(state,{asOf,knownAt,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!iso(now)||knownAt&&!iso(knownAt))throw Error('Choose a valid outcome date and knowledge cutoff');
    const cutoff=[asOf+'T23:59:59.999Z',now,...(knownAt?[knownAt]:[])].sort()[0];
    const reviews=Review.validate(state.programReviews||[]).filter(r=>r.createdAt<=cutoff&&r.asOf<=asOf).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
    const workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts;
    const claimed=new Set();
    const results=reviews.map(review=>{
      const program=(state.reviewedPrograms||[]).find(p=>p.id===review.programId&&p.createdAt<=review.createdAt);
      const from=program?move(program.config.startDate,review.week*7):null,to=from?move(from,6):null;
      const nextRecovery=reviews.find(r=>r.programId===review.programId&&r.week===review.week+1&&r.createdAt>review.createdAt&&r.asOf>=to);
      const findings={};
      for(const lift of ['squat','bench','deadlift']){
        const finding=review.findings[lift],exerciseId=finding?.exerciseId;
        const targets=(program?.sessions||[]).filter(s=>s.week===review.week+1&&s.exercises.some(e=>e.exerciseId===exerciseId));
        const rows=targets.map(s=>session(state,review,s,`builder:${program.id}:${s.key}`,exerciseId,{from,to,asOf,cutoff,workouts}));
        for(const row of rows){if(row.status!=='matched')continue;const key=lift+':'+row.workoutId;if(claimed.has(key)){row.status='ambiguous';row.label='Already attributed to an earlier review';row.followedWork=null;row.withinCap=null;row.comparedSets=0;}else claimed.add(key);}
        const matched=rows.filter(r=>r.status==='matched'),days=new Set(matched.map(r=>r.date));
        const enough=rows.length>0&&matched.length===rows.length&&days.size>=2;
        findings[lift]={name:finding?.name||lift,choice:review.choices[lift],baselineOverCapSessions:finding?.overCapSessions??null,expected:rows.length,followedWork:rows.filter(r=>r.followedWork===true).length,matched:matched.length,withinCap:matched.filter(r=>r.withinCap).length,aboveCap:matched.filter(r=>!r.withinCap).length,
          summary:!program?'Program context unavailable':!enough?'Not enough comparable data':matched.every(r=>r.withinCap)?'All comparable sessions within RPE caps':'Comparable sessions still exceeded RPE caps',
          evidenceLabel:enough?'Observed follow-up only; not evidence of cause or lasting benefit.':'At least two distinct training dates and complete comparable coverage are required for a week summary.',rows};
      }
      return {id:review.id,programName:program?.config.name||'Unavailable program',week:review.week,acceptedAt:review.createdAt,from,to,recoveryBefore:clone(review.recovery),recoveryAfter:nextRecovery?{recordedAt:nextRecovery.createdAt,value:clone(nextRecovery.recovery)}:null,findings};
    });
    return {asOf,cutoff,reviews:results.reverse(),notice:'Descriptive follow-up, not proof an adjustment caused improvement. Prescribed load changes are not strength gains. No automatic learning or plan changes.'};
  }
  return {analyze,labels};
});
