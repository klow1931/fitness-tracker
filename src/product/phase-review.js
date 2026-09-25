(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./decision-readiness'),require('./schedule'),require('./session-intent'),require('./programming-profile'),require('./program-review'));
  else root.LoadnotePhaseReview=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteProgrammingProfile,root.LoadnoteProgramReview);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Builder,Readiness,Schedule,Intent,Profile,Review){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const LIFTS=Builder.LIFTS,POLICY='phase-effort-v2',LEGACY_POLICY='phase-effort-v1';
  function increased(weight,incrementKg,trainingMaxKg){
    if(!Number.isFinite(trainingMaxKg)||trainingMaxKg<=0)throw Error('Missing exercise-specific training max');
    const result=Core.round(Math.floor((weight*1.025+1e-9)/incrementKg)*incrementKg,2);
    if(!(result>weight&&result<=trainingMaxKg*.85+.001))throw Error('Load progression exceeds the supported ceiling or does not clear the load increment');
    return result;
  }
  function analyze(state,{programId,phase,asOf,recovery,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!stamp(now)||asOf>move(now.slice(0,10),1)||!Builder.TYPES.includes(phase))throw Error('Choose a completed phase and valid review date');
    const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
    const program=Builder.validate(state.phasePrograms||[]).find(p=>p.id===programId);
    if(!program?.scheduledAt||program.createdAt>cutoff||program.scheduledAt>cutoff)throw Error('No scheduled phase program was known on this date');
    const index=program.config.phases.findIndex(p=>p.type===phase),weeksBefore=program.config.phases.slice(0,index).reduce((n,p)=>n+p.weeks,0);
    const from=move(program.config.startDate,weeksBefore*7),through=move(from,program.config.phases[index].weeks*7-1);
    if(through>asOf)throw Error('Review a phase on or after its final calendar day');
    const ci=Review.checkin(recovery),roles=Readiness.list(state.exerciseRoles||[],cutoff),profile=Profile.current(state.programmingProfiles||[],cutoff);
    const all=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>stamp(w.createdAt));
    const calendar=Schedule.list(Schedule.validate(state.scheduledSessions||[]),cutoff),expected=program.sessions.filter(s=>s.phase===phase);
    const evidence=expected.map(s=>{
      const id=`phase:${program.id}:${s.key}`,record=(state.scheduledSessions||[]).find(r=>r.id===id),current=calendar.find(r=>r.id===id);
      const ws=all.filter(w=>w.sessionIntent?.schedule?.id===id),w=ws.length===1?ws[0]:null;
      const linked=record?.revisions.find(r=>r.recordedAt===w?.sessionIntent?.schedule?.revisionAt&&r.recordedAt<=cutoff);
      let validTiming=false;
      try{validTiming=!!(w&&linked&&w.date>=from&&w.date<=through&&w.date===linked.context.date&&same(Intent.prescription(w.sessionIntent.prescription),linked.context.prescription)&&Intent.planTiming(linked.context.prescription,w.date,w.sessionIntent.timing)==='before-training');}catch(e){/* Malformed evidence cannot authorize a change. */}
      return {id,key:s.key,date:s.date,name:s.name,state:ws.length>1?'ambiguous':w?'completed':current?.status==='scheduled'?'unconfirmed':current?.status||'missing',validTiming,
        originalPlan:record?.revisions[0]?.recordedAt<=cutoff?copy(record.revisions[0].context.prescription):null,performedPlan:linked?copy(linked.context.prescription):null,workout:w?copy(w):null};
    });
    const nextPhase=program.config.phases[index+1]?.type||null,findings={};
    for(const lift of LIFTS){
      const main=program.config.lifts[lift],rows=evidence.filter(e=>expected.find(s=>s.key===e.key).exercises.some(x=>x.lift===lift));
      const ids=new Set([main.exerciseId,main.variation?.exerciseId].filter(Boolean));
      let complete=true,comparedSets=0,overCapSets=0,overCapSessions=0,underCapSessions=0,plannedSets=0,actualSets=0,totalVolumeKg=0,rpeSum=0,rpeCount=0;const performance=[];
      for(const row of rows){
        const planned=(row.performedPlan?.plannedExercises||[]).filter(e=>ids.has(e.exerciseId));
        const actual=(row.workout?.exercises||[]).filter(e=>ids.has(e.exerciseId));
        plannedSets+=(row.originalPlan?.plannedExercises||[]).filter(e=>ids.has(e.exerciseId)).reduce((n,e)=>n+e.sets.length,0);
        if(!row.validTiming||!planned.length||actual.length!==planned.length||(row.workout?.sessionIntent?.deviationReason||'none')!=='none')complete=false;
        let over=false,under=true,seen=0;
        for(const e of actual)for(const s of e.sets||[]){
          if(Number.isFinite(s.weight)&&s.weight>0&&Number.isInteger(s.reps)&&s.reps>0){actualSets++;totalVolumeKg+=s.weight*s.reps;const r=Number(s.rpe);if(s.rpe!=null&&s.rpe!==''&&r>=1&&r<=10){rpeSum+=r;rpeCount++;}}
        }
        for(const e of planned){
          const matches=actual.filter(a=>a.exerciseId===e.exerciseId),a=matches.length===1?matches[0]:null;
          if(!a||a.type==='cardio'||a.trackBy==='duration'||a.sets?.length!==e.sets.length)complete=false;
          for(let i=0;i<e.sets.length;i++){
            const t=e.sets[i],s=a?.sets?.[i],r=Number(s?.rpe);
            if(!row.validTiming||!s||!Number.isFinite(s.weight)||s.weight<=0||Math.abs(s.weight-t.weight)>.02||s.reps!==t.reps||s.rpe==null||s.rpe===''||!Number.isFinite(r)||r<6||r>10||!Number.isFinite(t.targetRpe)){complete=false;continue;}
            comparedSets++;seen++;if(r>t.targetRpe-(t.targetRpe>=7?1:0))under=false;if(r>=t.targetRpe+1){over=true;overCapSets++;}
            if(e.exerciseId===main.exerciseId)performance.push({date:row.workout.date,workoutId:row.workout.id,weight:s.weight,reps:s.reps,rpe:r,targetRpe:t.targetRpe,estimatedCapacity:Core.capacityEvidence(s.weight,s.reps,r).estimate});
          }
        }
        if(over)overCapSessions++;if(seen&&under)underCapSessions++;
      }
      const selected=program.roleSnapshot.filter(r=>ids.has(r.exerciseId)),roleOK=selected.every(r=>roles.some(x=>x.exerciseId===r.exerciseId&&x.role===r.role&&x.competitionLift===r.competitionLift))&&roles.filter(r=>r.role==='competition'&&r.competitionLift===lift).length===1;
      const days=[...new Set(performance.filter(p=>Number.isFinite(p.estimatedCapacity)).map(p=>p.date))].sort();
      // Compare only competition-lift evidence; variations never establish competition capacity.
      const capacity=days.length>=3&&days.at(-1)>=move(days[0],14)?{firstDate:days[0],lastDate:days.at(-1),firstKg:Math.max(...performance.filter(p=>p.date===days[0]&&p.estimatedCapacity!=null).map(p=>p.estimatedCapacity)),lastKg:Math.max(...performance.filter(p=>p.date===days.at(-1)&&p.estimatedCapacity!=null).map(p=>p.estimatedCapacity))}:null;
      const nextSessions=program.sessions.filter(s=>s.phase===nextPhase);
      let canIncrease=nextSessions.some(s=>s.exercises.some(e=>e.lift===lift));
      if(canIncrease)try{for(const s of nextSessions)for(const e of s.exercises.filter(e=>e.lift===lift))for(const set of e.sets)increased(set.weight,program.config.incrementKg,e.trainingMaxKg);}catch(e){canIncrease=false;}
      let decision='keep',reason='Matched work does not justify an additional change. Keeping retains the existing next-phase prescription, including any originally planned progression.';
      if(nextPhase!=='strength'){decision='gather';reason=nextPhase==='deload'?'Preserve the planned deload. Review recovery manually; no automatic deload modification.':'Sequence complete. Review outcomes before building another program.';}
      else if(!roleOK||!same(profile,program.profileSnapshot)){decision='gather';reason='Exercise roles or programming profile changed. Review the program manually before adjusting.';}
      else if(ci.discomfort!=='none'||['sleep','fatigue','soreness'].some(k=>ci[k]==='unknown')){decision='gather';reason='Complete recovery context first. Reported discomfort needs appropriate professional review, not an automatic prescription.';}
      else if(!complete||rows.length<3||!comparedSets){decision='gather';reason='Not enough complete, before-training matched evidence. Missing, skipped, rescheduled, changed or low-RPE work requires manual review.';}
      else if(overCapSessions>=2&&overCapSets>=2){decision='reduce-load';reason='At least two matched exposures exceeded their effort caps by at least 1 RPE. A 5% next-phase load reduction is available for review, not a diagnosis of lost strength.';}
      else if(overCapSets){decision='gather';reason='Effort exceeded a cap, but the repeated-exposure rule was not met.';}
      else if(['sleep','fatigue','soreness'].some(k=>ci[k]==='worse')){if(main.sets>=3){decision='reduce-sets';reason='Matched work stayed within caps, but recovery was reported worse. An optional reduction of one final working set per exposure is available; this is a conservative heuristic, not proof of excessive volume.';}else{decision='gather';reason='Recovery needs review, but removing a set would leave fewer than two working sets. Review manually.';}}
      else if(underCapSessions===rows.length&&capacity&&capacity.lastKg>=capacity.firstKg*.99&&canIncrease){decision='progress';reason='Every matched exposure stayed at least 1 RPE below caps of 7 or more, and at or below any cap of 6, with 3+ competition-lift evidence dates across 14+ days and no material decline in the compared capacity endpoints. An optional 2.5% next-phase load increase fits the exercise-specific training-max ceiling. This does not prove strength gains or an optimal dose.';}
      else if(underCapSessions===rows.length&&!canIncrease){decision='gather';reason='Repeated work was below caps, but the rounded load increase cannot fit the exercise-specific training-max ceiling. Review the load increment and planned progression manually.';}
      else if(underCapSessions===rows.length&&!capacity){decision='gather';reason='Repeated work was below caps, but at least three dated competition-lift capacity observations spanning 14 days are needed before proposing progression.';}
      else if(underCapSessions===rows.length){decision='gather';reason='Comparable effort was below caps, but the earliest and latest eligible capacity endpoints did not meet the conservative progression guard.';}
      findings[lift]={name:main.name,exerciseId:main.exerciseId,decision,reason,expectedSessions:rows.length,completedSessions:rows.filter(r=>r.state==='completed').length,plannedSets,actualSets,totalVolumeKg:Core.round(totalVolumeKg,2),averageRpe:rpeCount?Core.round(rpeSum/rpeCount,2):null,comparedSets,overCapSets,overCapSessions,underCapSessions,performance,capacity};
    }
    const targets=program.sessions.filter(s=>s.phase===nextPhase).map(s=>{const id=`phase:${program.id}:${s.key}`;return {id,key:s.key,session:calendar.find(c=>c.id===id)||null,completed:all.some(w=>w.sessionIntent?.schedule?.id===id)};});
    return {version:1,policy:POLICY,programId,phase,asOf,from,through,nextPhase,recovery:ci,findings,evidence,targets,basis:{program,roles,profile}};
  }
  function choicesValid(report,choices){for(const l of LIFTS)if(!['keep','reduce-load','reduce-sets',...(report.policy===POLICY?['progress']:[])].includes(choices?.[l])||choices[l]!=='keep'&&choices[l]!==report.findings[l].decision)throw Error('Choose only a supported adjustment for each lift');}
  function preview(report,choices){
    choicesValid(report,choices);const changes=[];
    for(const t of report.targets){
      const s=t.session;if(!s||s.status!=='scheduled'||s.date<=report.asOf||t.completed)continue;
      const source=report.basis.program.sessions.find(x=>x.key===t.key);
      const expected=Intent.createPrescription(source.exercises,s.prescription.source,s.prescription.capturedAt);
      if(!same(expected,s.prescription)||s.date!==source.date)continue; // Never overwrite manual plan edits or rescheduling.
      const after=copy(s.prescription);let changed=false;
      for(const e of after.plannedExercises){const lift=source.exercises.find(x=>x.exerciseId===e.exerciseId)?.lift,choice=choices[lift];
        if(choice==='progress'){for(const set of e.sets)set.weight=increased(set.weight,report.basis.program.config.incrementKg,e.trainingMaxKg);changed=true;}
        if(choice==='reduce-load'){const inc=report.basis.program.config.incrementKg;for(const set of e.sets){const weight=Core.round(Math.floor((set.weight*.95+1e-9)/inc)*inc,2);if(!(weight>0&&weight<set.weight))throw Error('Rounded load is unusable; review manually');set.weight=weight;}changed=true;}
        if(choice==='reduce-sets'){if(e.sets.length<3)throw Error('Set reduction would leave fewer than two working sets; keep this lift unchanged');e.sets.pop();changed=true;}
      }
      if(changed)changes.push({id:t.id,before:s,after});
    }
    return changes;
  }
  function validate(records){
    if(!Array.isArray(records)||records.length>1000)throw Error('Invalid phase reviews');const ids=new Set(),keys=new Set();
    return records.map(r=>{
      if(!r||r.version!==1||![POLICY,LEGACY_POLICY].includes(r.policy)||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.programId!=='string'||!r.programId||!Builder.TYPES.includes(r.phase)||!Schedule.date(r.asOf)||!Schedule.date(r.through)||r.through>r.asOf||!stamp(r.createdAt)||r.asOf>move(r.createdAt.slice(0,10),1)||!Array.isArray(r.changes)||r.changes.length>30||!Array.isArray(r.evidence)||r.evidence.length>30||!r.findings)throw Error('Invalid phase review record');
      const key=r.programId+':'+r.phase;if(keys.has(key))throw Error('Duplicate accepted phase review');keys.add(key);ids.add(r.id);Review.checkin(r.recovery);choicesValid(r,r.choices);
      for(const l of LIFTS){const f=r.findings[l];if(!f||!['keep','gather','reduce-load','reduce-sets',...(r.policy===POLICY?['progress']:[])].includes(f.decision)||typeof f.reason!=='string'||typeof f.exerciseId!=='string'||!Array.isArray(f.performance)||!Number.isInteger(f.comparedSets)||f.comparedSets<0)throw Error('Invalid phase finding');}
      if(r.policy===POLICY&&(!r.trainingMaxKg||Object.keys(r.trainingMaxKg).length>6||Object.values(r.trainingMaxKg).some(x=>!Number.isFinite(x)||x<10||x>1000)))throw Error('Invalid progression training-max context');
      if(!Number.isFinite(r.incrementKg)||r.incrementKg<.1||r.incrementKg>10||!r.exerciseLifts||Object.keys(r.exerciseLifts).length>6||Object.values(r.exerciseLifts).some(l=>!LIFTS.includes(l)))throw Error('Invalid phase adjustment context');
      const seen=new Set();for(const c of r.changes){
        if(typeof c.id!=='string'||seen.has(c.id)||!c.id.startsWith('phase:'+r.programId+':'))throw Error('Invalid phase review change');seen.add(c.id);Schedule.validate([{id:c.id,revisions:[c.before,c.after]}]);
        if(c.after.recordedAt!==r.createdAt||c.after.context.date<=r.asOf||c.before.context.date!==c.after.context.date||c.after.context.prescription.capturedAt!==r.createdAt||c.before.context.status!=='scheduled')throw Error('Phase changes must affect future sessions only');
        const expected=copy(c.before.context);let changed=false;expected.reason=`Approved ${r.phase} phase review (${POLICY})`;expected.prescription.capturedAt=r.createdAt;
        for(const e of expected.prescription.plannedExercises){const choice=r.choices[r.exerciseLifts[e.exerciseId]];
          if(choice==='progress'){if(r.policy!==POLICY)throw Error('Legacy phase policy cannot progress');for(const s of e.sets){s.weight=increased(s.weight,r.incrementKg,r.trainingMaxKg[e.exerciseId]);}changed=true;}
          if(choice==='reduce-load'){for(const s of e.sets){const weight=Core.round(Math.floor((s.weight*.95+1e-9)/r.incrementKg)*r.incrementKg,2);if(!(weight>0&&weight<s.weight))throw Error('Invalid phase load reduction');s.weight=weight;}changed=true;}
          if(choice==='reduce-sets'){if(e.sets.length<3)throw Error('Invalid phase set reduction');e.sets.pop();changed=true;}
        }
        if(!changed||!same(expected,c.after.context))throw Error('Phase revision differs from approved policy');
      }
      return copy(r);
    });
  }
  function apply(state,report,choices,{confirmed=false,asOf,now=new Date().toISOString(),lockedSessionIds=[]}={}){
    if(!confirmed||!stamp(now)||asOf!==report.asOf||asOf<move(now.slice(0,10),-1)||asOf>move(now.slice(0,10),1))throw Error('Confirm a fresh review for today before applying');
    const records=validate(state.phaseReviews||[]);if(records.some(r=>r.programId===report.programId&&r.phase===report.phase))throw Error('This phase already has an accepted review');
    const fresh=analyze(state,{programId:report.programId,phase:report.phase,asOf,recovery:report.recovery,now});if(!same(fresh,report))throw Error('Evidence or schedule changed. Generate a fresh review');
    const edits=preview(report,choices);
    for(const l of LIFTS)if(choices[l]!=='keep'){
      const required=report.targets.filter(t=>report.basis.program.sessions.find(s=>s.key===t.key).exercises.some(e=>e.lift===l));
      if(!required.length||required.some(t=>!edits.some(e=>e.id===t.id)))throw Error('The full next phase is not eligible for this adjustment; changed, completed, past or missing sessions need manual review');
    }
    if(edits.some(e=>lockedSessionIds.includes(e.id)))throw Error('A target session is open in your workout draft. Finish or clear it first');
    if(edits.some(e=>(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===e.id)))throw Error('A target already has a completed workout');
    const sessions=Schedule.validate(state.scheduledSessions||[]),changes=[];
    for(const e of edits){const record=sessions.find(s=>s.id===e.id),before=copy(record.revisions.at(-1));if(before.recordedAt!==e.before.revisionAt)throw Error('Schedule changed after the review cutoff');const after={recordedAt:now,context:{...before.context,prescription:{...e.after,capturedAt:now},reason:`Approved ${report.phase} phase review (${POLICY})`}};record.revisions.push(after);changes.push({id:e.id,before,after});}
    const exerciseLifts=Object.fromEntries(report.basis.program.sessions.flatMap(s=>s.exercises.map(e=>[e.exerciseId,e.lift])));
    const trainingMaxKg=Object.fromEntries(report.basis.program.sessions.flatMap(s=>s.exercises.map(e=>[e.exerciseId,e.trainingMaxKg])));
    const event={version:1,policy:POLICY,id:Core.createId(),programId:report.programId,phase:report.phase,asOf,through:report.through,createdAt:now,recovery:report.recovery,findings:report.findings,evidence:report.evidence,choices:copy(choices),incrementKg:report.basis.program.config.incrementKg,exerciseLifts,trainingMaxKg,changes};
    return {...state,scheduledSessions:Schedule.validate(sessions),phaseReviews:validate([...records,event])};
  }
  return {analyze,preview,apply,validate};
});
