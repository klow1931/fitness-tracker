/* Read-only, identity-based v2.21 lift workload comparison. No prescription mutations. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./phase-builder'),require('./decision-readiness'),require('./schedule'));
  else root.LoadnoteLiftWorkload=factory(root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Phase,Readiness,Schedule){
  'use strict';
  const LIFTS=Phase.LIFTS;
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const round=n=>Math.round(n*100)/100;
  function compare(state,raw,{asOf,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)throw Error('Choose a valid analysis date and timestamp');
    const c=Phase.config(raw),built=Phase.build(c),cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',start=move(asOf,-27);
    const view=Readiness.workoutsAt(state,asOf,cutoff,false),workouts=view.workouts.filter(w=>w.date>=start&&w.date<=asOf);
    const result={version:1,asOf,from:start,through:asOf,firstWeek:built.weekly[0].week,lifts:{},warnings:['Historical sets are observations, not an optimal volume prescription or proof of recovery.','Four calendar-aligned seven-day windows are compared with proposed weekly exposure; unlogged sessions and incomplete data cannot establish zero training.']};
    if(view.legacyTimestampCount)result.warnings.push('Some workout records have no creation timestamp; their original knowledge date cannot be established.');
    for(const lift of LIFTS){
      const l=c.lifts[lift],mainId=l.exerciseId,variationId=l.variation?.exerciseId;
      const weeks=Array.from({length:4},(_,i)=>({from:move(start,i*7),through:move(start,i*7+6),sessions:0,competitionSets:0,variationSets:0,rpeSets:0,validSets:0,tonnageKg:0,highEffortSets:0}));
      const distinctDates=new Set();
      for(const w of workouts){
        const relevant=(w.exercises||[]).filter(e=>(e.exerciseId===mainId||e.exerciseId===variationId)&&e.type!=='cardio'&&e.trackBy!=='duration'),index=Math.floor((Date.parse(w.date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000/7);
        if(!relevant.length||index<0||index>=4)continue;
        const bucket=weeks[index];bucket.sessions++;distinctDates.add(w.date);
        for(const e of relevant)for(const s of e.sets||[]){
          if(!Number.isFinite(s.weight)||s.weight<=0||!Number.isInteger(s.reps)||s.reps<=0)continue;
          bucket.validSets++;bucket.tonnageKg+=s.weight*s.reps;
          if(e.exerciseId===mainId)bucket.competitionSets++;else bucket.variationSets++;
          if(Number.isFinite(s.rpe)&&s.rpe>=6&&s.rpe<=10){bucket.rpeSets++;if(s.rpe>=8)bucket.highEffortSets++;}
        }
      }
      weeks.forEach(w=>w.tonnageKg=round(w.tonnageKg));
      const totals=weeks.reduce((o,w)=>({sessions:o.sessions+w.sessions,competitionSets:o.competitionSets+w.competitionSets,variationSets:o.variationSets+w.variationSets,validSets:o.validSets+w.validSets,rpeSets:o.rpeSets+w.rpeSets,highEffortSets:o.highEffortSets+w.highEffortSets,tonnageKg:round(o.tonnageKg+w.tonnageKg)}),{sessions:0,competitionSets:0,variationSets:0,validSets:0,rpeSets:0,highEffortSets:0,tonnageKg:0});
      const first=built.sessions.filter(s=>s.week===1).flatMap(s=>s.exercises.filter(e=>e.lift===lift));
      const planned={exposures:first.length,competitionExposures:first.filter(e=>e.exerciseId===mainId).length,variationExposures:first.filter(e=>e.exerciseId===variationId&&variationId).length,competitionSets:first.filter(e=>e.exerciseId===mainId).reduce((n,e)=>n+e.sets.length,0),variationSets:first.filter(e=>e.exerciseId===variationId&&variationId).reduce((n,e)=>n+e.sets.length,0)};
      planned.totalSets=planned.competitionSets+planned.variationSets;
      const warnings=[];
      if(distinctDates.size<3||[...distinctDates].sort().at(-1)<move([...distinctDates].sort()[0]||asOf,14))warnings.push('Sparse dated exposure history: the proposed workload needs manual review.');
      if(weeks.some(w=>w.validSets===0))warnings.push('At least one comparison week has no matching logged sets; missing training must not be interpreted as low tolerance.');
      if(totals.validSets&&totals.rpeSets/totals.validSets<.75)warnings.push('Fewer than 75% of matching sets have valid RPE; observed effort is incomplete.');
      if(totals.validSets&&planned.totalSets>totals.validSets/4*1.25)warnings.push('First-week planned sets exceed the four-week logged weekly average by over 25%; investigate data completeness and athlete constraints.');
      if(totals.sessions&&planned.exposures>totals.sessions/4+1)warnings.push('Planned exposure frequency is greater than the observed weekly frequency; review scheduling and recovery.');
      result.lifts[lift]={exerciseId:mainId,name:l.name,variationExerciseId:variationId||null,observedWeeks:weeks,observedTotals:totals,weeklyAverage:{sets:round(totals.validSets/4),exposures:round(totals.sessions/4),tonnageKg:round(totals.tonnageKg/4)},firstWeekPlan:planned,rpeCoverage:totals.validSets?round(totals.rpeSets/totals.validSets):null,warnings};
    }
    return result;
  }
  return {compare};
});
