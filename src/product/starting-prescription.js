/* Loadnote v2.64 — evidence-backed starting prescription suggestions. Read-only until athlete review. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./decision-readiness'),require('./programming-profile'));
  else root.LoadnoteStartingPrescription=factory(root.LoadnoteCore,root.LoadnoteReadiness,root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Readiness,Profile){
  'use strict';
  const LIFTS=['squat','bench','deadlift'];
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const validDate=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const round=(n,d=2)=>{const p=10**d;return Math.round(Number(n)*p)/p;};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const median=values=>{const a=[...values].sort((x,y)=>x-y),n=a.length;return n?n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2:null;};
  const mondayIndex=day=>(new Date(day+'T12:00:00Z').getUTCDay()+6)%7;
  const finite=value=>Number.isFinite(Number(value))?Number(value):null;
  function chooseDays(available,counts,count,preferred){
    const list=[...available];
    if(!list.length||count<1)return [];
    const scored=list.sort((a,b)=>(counts[b]||0)-(counts[a]||0)||a-b);
    const picked=[];
    if(preferred!=null&&list.includes(preferred))picked.push(preferred);
    for(const day of scored)if(!picked.includes(day)&&picked.length<count)picked.push(day);
    return picked.slice(0,count).sort((a,b)=>a-b);
  }
  function topBackoffPattern(exercise){
    const sets=(exercise?.sets||[]).filter(s=>finite(s.weight)>0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0);
    if(sets.length<3)return false;
    const heavy=sets.find(s=>Number(s.reps)<=2);
    if(!heavy)return false;
    return sets.some(s=>Number(s.reps)>=3&&finite(s.weight)<=finite(heavy.weight)*.94);
  }
  function inspect(state,{asOf,knownAt}={}){
    if(!validDate(asOf))throw Error('Choose a valid starting-prescription review date');
    const cutoff=knownAt||asOf+'T23:59:59.999Z';if(!iso(cutoff))throw Error('Choose a valid starting-prescription knowledge cutoff');
    const profile=Profile.current(state?.programmingProfiles||[],cutoff);if(!profile)return {version:1,asOf,cutoff,status:'needs-profile',applyReady:false,from:move(asOf,-27),through:asOf,lifts:{},recommendedTrainingDays:[],summary:'Create a programming profile before using evidence-backed starting suggestions.',notes:[]};
    const available=profile.context.availableDays.slice(0,7),roles=Readiness.list(state?.exerciseRoles||[],cutoff),catalog=state?.exerciseCatalog||[];
    const mappings={};
    for(const lift of LIFTS){
      const comp=roles.filter(r=>r.role==='competition'&&r.competitionLift===lift);
      if(comp.length!==1)return {version:1,asOf,cutoff,status:'needs-mapping',applyReady:false,from:move(asOf,-27),through:asOf,lifts:{},recommendedTrainingDays:[],summary:'Confirm exactly one competition exercise for squat, bench and deadlift before using starting suggestions.',notes:[]};
      mappings[lift]={competition:comp[0],variations:roles.filter(r=>r.role==='close-variation'&&r.competitionLift===lift)};
    }
    const start=move(asOf,-27),view=Readiness.workoutsAt(state,asOf,cutoff,false),workouts=view.workouts.filter(w=>w.date>=start&&w.date<=asOf),lifts={},globalDays={};
    for(const lift of LIFTS){
      const map=mappings[lift],mainId=map.competition.exerciseId,ids=new Set([mainId,...map.variations.map(r=>r.exerciseId)]),dates=new Map(),compDates=new Set(),weekdayCounts={},compWeekdayCounts={},validSets=0,rpeSets=0,rpeValues=[],developmentSets=0,topBackoffDays=0,capacityByDay=new Map();
      for(const w of workouts){
        const relevant=(w.exercises||[]).filter(e=>ids.has(e.exerciseId)&&e.type!=='cardio'&&e.trackBy!=='duration');if(!relevant.length)continue;
        let dayValid=false,dayDevelopment=0,dayTopBackoff=false;
        for(const ex of relevant){
          if(ex.exerciseId===mainId&&topBackoffPattern(ex))dayTopBackoff=true;
          for(const set of ex.sets||[]){
            const weight=finite(set.weight),reps=finite(set.reps);if(!(weight>0)||!Number.isInteger(reps)||reps<1)continue;
            validSets++;dayValid=true;
            const rpe=finite(set.rpe);if(rpe!=null&&rpe>=6&&rpe<=10){rpeSets++;rpeValues.push(rpe);}
            if(reps>=3&&reps<=8){developmentSets++;dayDevelopment++;}
            if(ex.exerciseId===mainId){const ev=Core.capacityEvidence(weight,reps,set.rpe);if(ev.estimate!=null&&(!capacityByDay.has(w.date)||ev.estimate>capacityByDay.get(w.date)))capacityByDay.set(w.date,ev.estimate);}
          }
        }
        if(!dayValid)continue;
        const wd=mondayIndex(w.date);weekdayCounts[wd]=(weekdayCounts[wd]||0)+1;globalDays[wd]=(globalDays[wd]||0)+1;
        if(relevant.some(e=>e.exerciseId===mainId)){compDates.add(w.date);compWeekdayCounts[wd]=(compWeekdayCounts[wd]||0)+1;}
        const row=dates.get(w.date)||{developmentSets:0};row.developmentSets+=dayDevelopment;dates.set(w.date,row);if(dayTopBackoff)topBackoffDays++;
      }
      const exposureDates=[...dates.keys()].sort(),spanOK=exposureDates.length>=3&&exposureDates.at(-1)>=move(exposureDates[0],14),rpeCoverage=validSets?round(rpeSets/validSets):null,averageRpe=rpeValues.length?round(rpeValues.reduce((a,b)=>a+b,0)/rpeValues.length,1):null;
      const capacityDays=[...capacityByDay.entries()].sort((a,b)=>a[0].localeCompare(b[0])),capacityEnough=capacityDays.length>=4&&capacityDays.at(-1)[0]>=move(capacityDays[0][0],14),early=capacityEnough?median(capacityDays.slice(0,2).map(x=>x[1])):null,late=capacityEnough?median(capacityDays.slice(-2).map(x=>x[1])):null,capacityChangePct=capacityEnough&&early>0?round((late/early-1)*100,1):null;
      const weeklyExposures=round(exposureDates.length/4),weeklyDevelopmentSets=round(developmentSets/4),developmentPerExposure=[...dates.values()].map(x=>x.developmentSets).filter(Boolean),observedMedian=median(developmentPerExposure);
      let frequency=spanOK?clamp(Math.round(weeklyExposures),1,3):1;
      frequency=Math.min(frequency,Math.max(1,Math.min(3,available.length)));
      let setsPerExposure=spanOK&&observedMedian!=null?clamp(Math.round(observedMedian),2,4):3;
      if(weeklyDevelopmentSets>0)while(setsPerExposure>2&&setsPerExposure*frequency>weeklyDevelopmentSets*1.25)setsPerExposure--;
      let stepPct=1;if((averageRpe!=null&&averageRpe>=8.5)||(capacityChangePct!=null&&capacityChangePct<=-3))stepPct=.5;
      const preferred=[...compDates].map(d=>mondayIndex(d)).sort((a,b)=>(compWeekdayCounts[b]||0)-(compWeekdayCounts[a]||0))[0];
      const recommendedDays=chooseDays(available,weekdayCounts,frequency,preferred),primaryDay=recommendedDays.includes(preferred)?preferred:recommendedDays[0]??null,primaryFormat=topBackoffDays>=2?'top-backoff':'straight';
      const confidence=!spanOK?'gather':rpeCoverage!=null&&rpeCoverage>=.75?'supported':'limited';
      const reasons=[];
      if(!spanOK)reasons.push('Fewer than three recent matching exposure dates spanning 14 days; keep the suggestion conservative and review manually.');
      else reasons.push(`${exposureDates.length} matching exposure dates across the last 28 days support a ${frequency}×/week starting-frequency reference.`);
      if(observedMedian==null)reasons.push('Recent 3–8 rep development-set history is sparse, so three sets per exposure remains a neutral editable default.');
      else reasons.push(`Recent 3–8 rep work had a median of ${round(observedMedian,1)} matching sets per exposure; the suggestion is bounded to 2–4 sets.`);
      if(rpeCoverage==null||rpeCoverage<.75)reasons.push('RPE coverage is below 75%; effort evidence cannot justify more aggressive progression.');
      if(stepPct<1)reasons.push(capacityChangePct!=null&&capacityChangePct<=-3?'Recent competition-lift estimated-capacity direction is lower, so weekly percentage-point progression is reduced to 0.5.':'Recent matching-set average RPE is high, so weekly percentage-point progression is reduced to 0.5.');
      else reasons.push('Weekly progression stays at 1 percentage point; easy work alone never earns a larger starting step.');
      if(primaryFormat==='top-backoff')reasons.push('At least two recent competition-lift sessions used a heavy low-rep set followed by lighter 3+ rep work, so top/back-off is suggested for the primary exposure.');
      lifts[lift]={lift,exerciseId:mainId,name:catalog.find(e=>e.id===mainId)?.name||mainId,variationExerciseIds:map.variations.map(r=>r.exerciseId),confidence,evidence:{from:start,through:asOf,exposureDates:exposureDates.length,competitionExposureDates:compDates.size,validSets,developmentSets,rpeSets,rpeCoverage,averageRpe,weeklyExposures,weeklyDevelopmentSets,capacityEvidenceDays:capacityDays.length,capacityChangePct,topBackoffDays},recommendation:{frequency,setsPerExposure,weeklySets:frequency*setsPerExposure,stepPct,days:recommendedDays,primaryDay,primaryFormat},reasons};
    }
    let recommendedTrainingDays=[...new Set(LIFTS.flatMap(l=>lifts[l].recommendation.days))].sort((a,b)=>a-b);
    if(recommendedTrainingDays.length>5){recommendedTrainingDays=[...recommendedTrainingDays].sort((a,b)=>(globalDays[b]||0)-(globalDays[a]||0)||a-b).slice(0,5).sort((a,b)=>a-b);for(const lift of LIFTS){const rec=lifts[lift].recommendation,kept=rec.days.filter(d=>recommendedTrainingDays.includes(d));if(kept.length<rec.frequency){const extras=recommendedTrainingDays.filter(d=>!kept.includes(d));rec.days=[...kept,...extras.slice(0,rec.frequency-kept.length)].sort((a,b)=>a-b);rec.primaryDay=rec.days.includes(rec.primaryDay)?rec.primaryDay:rec.days[0];}}}
    const applyReady=recommendedTrainingDays.length>=2&&recommendedTrainingDays.length<=5&&LIFTS.every(l=>lifts[l].recommendation.days.length===lifts[l].recommendation.frequency);
    const notes=['This is a starting-structure suggestion, not an estimate of optimal volume or recoverability.','Training maxes remain athlete-selected or handoff-derived and are never inferred from these workload observations.','Competition-lift and confirmed close-variation history can inform starting workload; only competition-lift RPE-aware estimates inform capacity direction.','A low RPE by itself never increases the suggested weekly progression step.'];
    if(view.legacyTimestampCount)notes.push(view.legacyTimestampCount+' historical workout record(s) lack an auditable creation time and are excluded from point-in-time evidence.');
    return {version:1,asOf,cutoff,status:'ready',applyReady,from:start,through:asOf,profileId:profile.id,recommendedTrainingDays,lifts,summary:applyReady?'Evidence-backed starting structure is available for athlete review.':'Evidence can be summarized, but it does not form a complete 2–5 day starting structure yet.',notes};
  }
  function audit(report,config){
    if(!report||report.version!==1||report.status!=='ready'||!report.lifts)throw Error('Generate current starting-prescription evidence before auditing a proposal');
    if(!config||!config.lifts)throw Error('A phase configuration is required for starting-prescription audit');
    const lifts={},warnings=[];
    for(const lift of LIFTS){
      const rec=report.lifts[lift]?.recommendation,selected=config.lifts[lift];if(!rec||!selected||selected.exerciseId!==report.lifts[lift].exerciseId)throw Error('Starting-prescription evidence no longer matches the selected competition lifts');
      const frequency=selected.exposures.length,weeklySets=frequency*selected.sets,dayOverlap=selected.exposures.filter(e=>rec.days.includes(e.day)).length;
      const comparison={frequencyDelta:frequency-rec.frequency,setsPerExposureDelta:selected.sets-rec.setsPerExposure,weeklySetsDelta:weeklySets-rec.weeklySets,stepPctDelta:round(selected.stepPct-rec.stepPct,2),recommendedDayMatches:dayOverlap,recommendedDays:rec.days.slice(),selectedDays:selected.exposures.map(e=>e.day).sort((a,b)=>a-b)};
      if(Math.abs(comparison.frequencyDelta)>=1)warnings.push(`${lift}: selected ${frequency} exposure(s)/week versus evidence suggestion ${rec.frequency}.`);
      if(Math.abs(comparison.weeklySetsDelta)>=2)warnings.push(`${lift}: selected ${weeklySets} weekly working sets versus evidence suggestion ${rec.weeklySets}.`);
      if(comparison.stepPctDelta>.5)warnings.push(`${lift}: selected weekly step is more than 0.5 percentage points above the evidence suggestion.`);
      lifts[lift]={exerciseId:selected.exerciseId,name:selected.name,confidence:report.lifts[lift].confidence,evidence:JSON.parse(JSON.stringify(report.lifts[lift].evidence)),recommendation:JSON.parse(JSON.stringify(rec)),selected:{frequency,setsPerExposure:selected.sets,weeklySets,stepPct:selected.stepPct,days:comparison.selectedDays,primaryFormat:selected.exposures.find(e=>e.role==='primary')?.format||null},comparison,reasons:[...report.lifts[lift].reasons]};
    }
    return {version:1,asOf:report.asOf,cutoff:report.cutoff,from:report.from,through:report.through,status:'reviewed-comparison',profileId:report.profileId||null,recommendedTrainingDays:[...(report.recommendedTrainingDays||[])],lifts,warnings,notes:[...report.notes,'Differences are review prompts, not evidence that the selected prescription is wrong.']};
  }
  function validateAudit(raw,config){
    if(!raw||raw.version!==1||raw.status!=='reviewed-comparison'||!validDate(raw.asOf)||!iso(raw.cutoff)||!raw.lifts||!Array.isArray(raw.warnings)||!Array.isArray(raw.notes))throw Error('Invalid starting-prescription audit snapshot');
    for(const lift of LIFTS){const row=raw.lifts[lift],selected=config?.lifts?.[lift];if(!row||!selected||row.exerciseId!==selected.exerciseId||row.selected?.frequency!==selected.exposures.length||row.selected?.setsPerExposure!==selected.sets||row.selected?.weeklySets!==selected.sets*selected.exposures.length||row.selected?.stepPct!==selected.stepPct)throw Error('Starting-prescription audit does not match the saved phase configuration');}
    return JSON.parse(JSON.stringify(raw));
  }
  return {LIFTS,inspect,audit,validateAudit};
});