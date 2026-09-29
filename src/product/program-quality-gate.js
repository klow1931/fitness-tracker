/* Loadnote v2.67 — deterministic whole-cycle structural quality gate. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./cycle-observability'));
  else root.LoadnoteProgramQualityGate=factory(root.LoadnoteCycleObservability);
})(typeof globalThis!=='undefined'?globalThis:this,function(Observability){
  'use strict';
  const VERSION=1,POLICY='program-quality-gate-v1',LIFTS=['squat','bench','deadlift'],SEVERITIES=['review','blocking'];
  const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
  const round=(n,d=1)=>{const p=10**d;return Math.round(Number(n)*p)/p;};
  const finite=x=>x===null||x===undefined||x===''?null:Number.isFinite(Number(x))?Number(x):null;
  const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
  function input(proposal){
    return {config:copy(proposal?.config||null),sourceProgram:{id:proposal?.sourceProgram?.id||null,config:copy(proposal?.sourceProgram?.config||null)},sessions:copy(proposal?.sessions||[]),weekly:copy(proposal?.weekly||[])};
  }
  function finding(code,severity,message,extra={}){
    if(!SEVERITIES.includes(severity))throw Error('Invalid program quality severity');
    return {code,severity,message,...extra};
  }
  function setPct(exercise,set){
    const tm=finite(exercise?.trainingMaxKg),weight=finite(set?.weight);
    return tm>0&&weight>0?weight/tm*100:null;
  }
  function weekMetrics(proposal,week){
    const source=proposal.sourceProgram.config,rows=(proposal.sessions||[]).filter(s=>s.week===week.week),lifts={};
    for(const lift of LIFTS){
      const competitionId=source.lifts[lift].exerciseId,entries=rows.flatMap(s=>(s.exercises||[]).filter(e=>e.lift===lift)),sets=entries.flatMap(e=>(e.sets||[]).map(s=>({exercise:e,set:s,pct:setPct(e,s)}))),competition=entries.filter(e=>e.exerciseId===competitionId),variation=entries.filter(e=>e.exerciseId!==competitionId),competitionSets=competition.reduce((n,e)=>n+(e.sets||[]).length,0),variationSets=variation.reduce((n,e)=>n+(e.sets||[]).length,0),pcts=sets.map(x=>x.pct).filter(x=>x!=null),rpes=sets.map(x=>finite(x.set.targetRpe)).filter(x=>x!=null);
      lifts[lift]={
        exposures:entries.length,sets:sets.length,
        competitionExposures:competition.length,competitionSets,variationExposures:variation.length,variationSets,
        specificityPct:sets.length?round(competitionSets/sets.length*100):null,
        averagePercent:pcts.length?round(pcts.reduce((a,b)=>a+b,0)/pcts.length):null,
        maxPercent:pcts.length?round(Math.max(...pcts)):null,
        maxRpeCap:rpes.length?round(Math.max(...rpes),1):null,
        primaryCompetitionExposures:competition.filter(e=>e.role==='primary').length
      };
    }
    const minutes=rows.map(s=>finite(s.estimatedMinutes)).filter(x=>x!=null),budget=finite(source.sessionMinutes);
    return {week:week.week,phase:week.phase,phaseWeek:week.phaseWeek||null,startDate:week.startDate,endDate:week.endDate,meetDate:week.meetDate||null,sessionCount:rows.length,maxSessionMinutes:minutes.length?Math.max(...minutes):0,sessionBudgetMinutes:budget,sessionBudgetPct:budget>0&&minutes.length?round(Math.max(...minutes)/budget*100):0,lifts};
  }
  function inspect(proposal){
    if(!Observability||typeof Observability.fingerprint!=='function')throw Error('Program quality gate requires deterministic fingerprint support');
    if(!proposal||proposal.version!==1||!proposal.config||!proposal.sourceProgram?.config||!Array.isArray(proposal.sessions)||!Array.isArray(proposal.weekly))throw Error('A complete meet-cycle proposal is required for program quality review');
    const c=proposal.config,source=proposal.sourceProgram.config,weeks=proposal.weekly.map(w=>weekMetrics(proposal,w)),findings=[];
    const add=(code,severity,message,extra={})=>findings.push(finding(code,severity,message,extra));
    const expectedPhases=[['accumulation',c.accumulationWeeks],['strength',c.strengthWeeks],['peaking',c.peakWeeks],['taper',c.taperWeeks],[c.eventType==='competition'?'meet':'mock-meet',1]];
    const actualCounts=new Map();
    for(const w of proposal.weekly)actualCounts.set(w.phase,(actualCounts.get(w.phase)||0)+1);
    if(proposal.weekly.length!==c.weeks)add('week-count','blocking','The generated weekly outline does not match the selected cycle length.');
    for(const [phase,count] of expectedPhases)if((actualCounts.get(phase)||0)!==count)add('phase-count','blocking',phase+' week count does not match the reviewed cycle configuration.',{phase,expected:count,actual:actualCounts.get(phase)||0});
    const eventWeek=weeks.at(-1),eventPhase=c.eventType==='competition'?'meet':'mock-meet';
    if(!eventWeek||eventWeek.phase!==eventPhase||eventWeek.meetDate!==c.meetDate)add('event-alignment','blocking','The final event week does not match the reviewed event type and date.');
    if(eventWeek?.sessionCount)add('event-week-training','blocking','Event week contains an inferred training session. Event attempts must remain separate from training prescriptions.',{week:eventWeek.week});
    for(const session of proposal.sessions){
      const weekly=proposal.weekly.find(w=>w.week===session.week);
      if(!weekly||session.date<weekly.startDate||session.date>weekly.endDate)add('session-week-date','blocking','A generated session falls outside its declared program week.',{week:session.week,date:session.date});
      if(session.date>=c.meetDate)add('session-after-event','blocking','A generated training session lands on or after the event date.',{week:session.week,date:session.date});
      if(finite(session.estimatedMinutes)>finite(source.sessionMinutes))add('session-time-block','blocking','A generated session exceeds the athlete-reviewed session time budget.',{week:session.week,date:session.date,estimatedMinutes:session.estimatedMinutes,budgetMinutes:source.sessionMinutes});
      else if(finite(session.estimatedMinutes)>=finite(source.sessionMinutes)*.9)add('session-time-review','review','A generated session uses at least 90% of the athlete-reviewed session time budget.',{week:session.week,date:session.date,estimatedMinutes:session.estimatedMinutes,budgetMinutes:source.sessionMinutes});
      for(const exercise of session.exercises||[])for(const set of exercise.sets||[]){
        const pct=setPct(exercise,set),rpe=finite(set.targetRpe);
        if(pct==null||pct<=0)add('invalid-set-load','blocking','A generated set has no valid positive percentage of its explicit training max.',{week:session.week,date:session.date,lift:exercise.lift});
        else if(pct>85.01)add('intensity-ceiling','blocking','A generated set exceeds the supported 85% training-max ceiling.',{week:session.week,date:session.date,lift:exercise.lift,percent:round(pct)});
        if(rpe==null||rpe<1||rpe>10)add('rpe-cap','blocking','A generated set has an invalid RPE cap.',{week:session.week,date:session.date,lift:exercise.lift});
      }
    }
    for(let i=1;i<weeks.length;i++){
      const prev=weeks[i-1],next=weeks[i];
      for(const lift of LIFTS){
        const a=prev.lifts[lift],b=next.lifts[lift];
        if(prev.phase===next.phase){
          if(Math.abs(b.exposures-a.exposures)>1)add('within-phase-frequency-jump','review',lift+' exposure frequency changes abruptly inside '+next.phase+'.',{lift,week:next.week,from:a.exposures,to:b.exposures});
          if(a.sets>0&&Math.abs(b.sets-a.sets)/a.sets>.25)add('within-phase-set-jump','review',lift+' working-set count changes by more than 25% inside '+next.phase+'.',{lift,week:next.week,from:a.sets,to:b.sets});
        }else if(next.phase!=='mock-meet'&&next.phase!=='meet'){
          const setRise=a.sets>0?(b.sets-a.sets)/a.sets*100:null,pctRise=a.averagePercent!=null&&b.averagePercent!=null?b.averagePercent-a.averagePercent:null;
          if(setRise!=null&&setRise>=25&&pctRise!=null&&pctRise>=5)add('transition-double-jump','review',lift+' increases both working sets and average loading at the '+prev.phase+' → '+next.phase+' transition.',{lift,week:next.week,setChangePct:round(setRise),percentPointChange:round(pctRise)});
          if(prev.phase==='accumulation'&&next.phase==='strength'&&pctRise!=null&&pctRise>15)add('strength-transition-intensity','review',lift+' average loading jumps more than 15 percentage points entering strength.',{lift,week:next.week,percentPointChange:round(pctRise)});
          if(next.phase==='peaking'&&a.sets>0&&b.sets>a.sets*1.25)add('peak-volume-rise','review',lift+' working sets rise entering the peak instead of preserving or reducing workload.',{lift,week:next.week,from:a.sets,to:b.sets});
          if(next.phase==='peaking'&&a.specificityPct!=null&&b.specificityPct!=null&&b.specificityPct<a.specificityPct)add('peak-specificity-drop','review',lift+' competition-lift specificity falls when entering peaking.',{lift,week:next.week,from:a.specificityPct,to:b.specificityPct});
        }
      }
    }
    for(const w of weeks.filter(w=>w.phase==='peaking'||w.phase==='taper'))for(const lift of LIFTS){
      const row=w.lifts[lift];
      if(row.variationSets>0)add('late-variation','blocking',lift+' variation work appears in '+w.phase+'; late-cycle work must remain on the reviewed competition lift.',{lift,week:w.week});
      if(row.competitionExposures<1)add('late-specificity-missing','blocking',lift+' has no competition-lift exposure in '+w.phase+'.',{lift,week:w.week});
    }
    const lastPeak=weeks.filter(w=>w.phase==='peaking').at(-1),firstTaper=weeks.find(w=>w.phase==='taper');
    if(lastPeak&&firstTaper)for(const lift of LIFTS){
      const p=lastPeak.lifts[lift],t=firstTaper.lifts[lift];
      if(t.sets>=p.sets)add('taper-set-reduction','review',lift+' taper working sets do not decrease from the final peak week.',{lift,week:firstTaper.week,peakSets:p.sets,taperSets:t.sets});
      if(t.averagePercent!=null&&p.averagePercent!=null&&t.averagePercent>=p.averagePercent)add('taper-load-reduction','review',lift+' taper average loading does not decrease from the final peak week.',{lift,week:firstTaper.week,peakPercent:p.averagePercent,taperPercent:t.averagePercent});
    }
    if(c.taperWeeks>1){
      const taper=weeks.filter(w=>w.phase==='taper');
      const repeated=LIFTS.every(l=>taper.every((w,i)=>i===0||w.lifts[l].sets===taper[0].lifts[l].sets&&w.lifts[l].averagePercent===taper[0].lifts[l].averagePercent));
      if(repeated)add('repeated-taper-dose','review','The multi-week taper repeats the same bounded prescription. Review whether that deliberate hold matches the athlete and event timeline.');
    }
    if(c.accumulationWeeks>6)add('extended-accumulation-hold','review','Accumulation extends beyond six progressive weeks, so the last supported prescription repeats for '+(c.accumulationWeeks-6)+' additional week'+(c.accumulationWeeks-6===1?'':'s')+'.',{phase:'accumulation'});
    if(c.strengthWeeks>6)add('extended-strength-hold','review','Strength extends beyond six progressive weeks, so the last supported prescription repeats for '+(c.strengthWeeks-6)+' additional week'+(c.strengthWeeks-6===1?'':'s')+'.',{phase:'strength'});
    const hard={squat:[],deadlift:[]};
    for(const session of proposal.sessions)for(const exercise of session.exercises||[]){
      if(!hard[exercise.lift]||exercise.exerciseId!==source.lifts[exercise.lift].exerciseId||exercise.role!=='primary')continue;
      const pcts=(exercise.sets||[]).map(s=>setPct(exercise,s)).filter(x=>x!=null),rpes=(exercise.sets||[]).map(s=>finite(s.targetRpe)).filter(x=>x!=null);
      if((pcts.length&&Math.max(...pcts)>=75)||(rpes.length&&Math.max(...rpes)>=8))hard[exercise.lift].push({date:session.date,week:session.week,phase:session.phase});
    }
    const closePairs=[];
    for(const s of hard.squat)for(const d of hard.deadlift){const gap=Math.abs(daysBetween(s.date,d.date));if(gap<=1)closePairs.push({squatDate:s.date,deadliftDate:d.date,gapDays:gap});}
    if(closePairs.length)add('squat-deadlift-spacing','review','Hard primary squat and deadlift exposures occur on the same or adjacent day '+closePairs.length+' time'+(closePairs.length===1?'':'s')+' across the cycle. Review whether that spacing is intentional.',{examples:closePairs.slice(0,3)});
    const blocking=findings.filter(f=>f.severity==='blocking').length,review=findings.filter(f=>f.severity==='review').length,status=blocking?'blocking':review?'review':'pass';
    const maxMinutes=Math.max(0,...weeks.map(w=>w.maxSessionMinutes)),minMinutes=Math.min(...weeks.filter(w=>w.sessionCount).map(w=>w.maxSessionMinutes));
    const report={
      version:VERSION,policy:POLICY,inputFingerprint:Observability.fingerprint(input(proposal)),status,
      counts:{blocking,review},
      summary:status==='pass'?'No structural quality-gate findings require review.':status==='blocking'?blocking+' blocking issue'+(blocking===1?'':'s')+' must be resolved before this cycle can be approved.':review+' review item'+(review===1?'':'s')+' should be inspected before athlete approval.',
      cycle:{weeks:c.weeks,startDate:c.startDate,eventDate:c.meetDate,eventType:c.eventType||'mock',sessionCount:(proposal.sessions||[]).length,sessionMinutesRange:{min:Number.isFinite(minMinutes)?minMinutes:0,max:maxMinutes,budget:source.sessionMinutes}},
      findings,weekly:weeks,
      notes:['This gate checks program structure, continuity, specificity, spacing and feasibility; it does not estimate physiological recovery or an optimal training dose.','Review findings are prompts, not proof that a program is wrong. Blocking findings indicate an internal structural inconsistency that must be resolved before approval.','All loading remains in internal kg and is evaluated against each exercise’s explicit training max; display units do not change the result.']
    };
    return report;
  }
  function validate(raw,proposal){
    if(!raw||raw.version!==VERSION||raw.policy!==POLICY||!['pass','review','blocking'].includes(raw.status)||!raw.counts||!Array.isArray(raw.findings)||!Array.isArray(raw.weekly)||!raw.cycle||!Array.isArray(raw.notes))throw Error('Invalid program quality-gate snapshot');
    if(raw.inputFingerprint!==Observability.fingerprint(input(proposal)))throw Error('Program quality-gate snapshot does not match the reviewed cycle');
    const blocking=raw.findings.filter(f=>f.severity==='blocking').length,review=raw.findings.filter(f=>f.severity==='review').length,status=blocking?'blocking':review?'review':'pass';
    if(blocking!==raw.counts.blocking||review!==raw.counts.review||status!==raw.status)throw Error('Program quality-gate counts are inconsistent');
    return copy(raw);
  }
  return {VERSION,POLICY,LIFTS,input,inspect,validate};
});