/* v2.53 — compact, descriptive progress analytics from saved training evidence. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./decision-readiness'),require('./schedule'));
  else root.LoadnoteProgressAnalytics=factory(root.LoadnoteCore,root.LoadnoteReadiness,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Readiness,Schedule){
  'use strict';
  if(!Core||!Readiness||!Schedule)throw Error('Loadnote progress analytics dependencies are required');
  const LIFTS=['squat','bench','deadlift'];
  const liftLabels={squat:'Squat',bench:'Bench Press',deadlift:'Deadlift'};
  const nameKey=value=>String(value||'').trim().toLowerCase();
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const strengthExercise=exercise=>exercise?.type!=='cardio'&&exercise?.trackBy!=='duration';
  function period(asOf,offsetDays){
    const to=move(asOf,-offsetDays),from=move(to,-27);
    return {from,to};
  }
  function workoutsIn(state,range){
    return (state?.workouts||[]).filter(w=>Schedule.date(w?.date)&&w.date>=range.from&&w.date<=range.to);
  }
  function trainingSummary(workouts){
    let strengthSets=0,rpeSets=0;
    for(const workout of workouts)for(const exercise of workout.exercises||[])if(strengthExercise(exercise))for(const set of exercise.sets||[]){
      const reps=Number(set?.reps),weight=Number(set?.weight);
      if(!(Number.isInteger(reps)&&reps>0&&Number.isFinite(weight)&&weight>=0))continue;
      strengthSets++;
      const rpe=Number(set.rpe);if(Number.isFinite(rpe)&&rpe>=1&&rpe<=10)rpeSets++;
    }
    return {sessions:workouts.length,strengthSets,rpeSets,rpeCoverage:strengthSets?Core.round(rpeSets/strengthSets*100,1):null,sessionsPerWeek:Core.round(workouts.length/4,1)};
  }
  function scheduleSummary(state,range,asOf){
    if(!(state?.scheduledSessions||[]).length)return null;
    const summary=Schedule.summary(state.scheduledSessions||[],state.workouts||[],{from:range.from,to:range.to,asOf});
    return {planned:summary.sessions.length,counts:summary.counts,resolved:summary.resolved,adherence:summary.adherence,definition:summary.definition};
  }
  function markerCandidates(state,through){
    const catalog=new Map((state?.exerciseCatalog||[]).map(e=>[e.id,e]));
    const roles=Readiness.list(state?.exerciseRoles||[]);
    const explicit=[];
    for(const lift of LIFTS){
      const mapped=roles.filter(r=>r.role==='competition'&&r.competitionLift===lift);
      if(mapped.length!==1)continue;
      const role=mapped[0],entry=catalog.get(role.exerciseId);
      explicit.push({key:'id:'+role.exerciseId,exerciseId:role.exerciseId,name:entry?.name||role.exerciseId,label:liftLabels[lift],source:'competition',lift});
    }
    if(explicit.length)return explicit;
    const counts=new Map();
    const from=move(through,-55);
    for(const workout of state?.workouts||[]){
      if(!Schedule.date(workout?.date)||workout.date<from||workout.date>through)continue;
      const seen=new Set();
      for(const exercise of workout.exercises||[]){
        if(!strengthExercise(exercise))continue;
        const hasWork=(exercise.sets||[]).some(s=>Number.isInteger(Number(s?.reps))&&Number(s.reps)>0);
        if(!hasWork)continue;
        const key=exercise.exerciseId?'id:'+exercise.exerciseId:'name:'+nameKey(exercise.name);
        if(!key||seen.has(key))continue;seen.add(key);
        const row=counts.get(key)||{key,exerciseId:exercise.exerciseId||null,name:exercise.name||'Strength exercise',sessions:0,lastDate:''};
        row.sessions++;if(workout.date>row.lastDate){row.lastDate=workout.date;row.name=exercise.name||row.name;}counts.set(key,row);
      }
    }
    return [...counts.values()].sort((a,b)=>b.sessions-a.sessions||b.lastDate.localeCompare(a.lastDate)||String(a.name).localeCompare(String(b.name))).slice(0,3).map(row=>({...row,label:row.name,source:'frequent',lift:null}));
  }
  function matches(exercise,marker){
    if(!strengthExercise(exercise))return false;
    if(marker.exerciseId)return exercise.exerciseId===marker.exerciseId;
    return nameKey(exercise.name)===nameKey(marker.name);
  }
  function markerSummary(workouts,marker){
    const sessions=new Set(),capacityByDay=new Map();let bestLoad=null,bestCapacity=null,sets=0;
    for(const workout of workouts)for(const exercise of workout.exercises||[])if(matches(exercise,marker))for(const set of exercise.sets||[]){
      const weight=Number(set?.weight),reps=Number(set?.reps);
      if(!(Number.isFinite(weight)&&weight>0&&Number.isInteger(reps)&&reps>0))continue;
      sessions.add(String(workout.id));sets++;
      const row={date:workout.date,workoutId:String(workout.id),weight,reps,rpe:set.rpe==null||set.rpe===''?null:Number(set.rpe)};
      if(!bestLoad||row.weight>bestLoad.weight)bestLoad=row;
      const capacity=Core.capacityEvidence(weight,reps,set.rpe);
      if(capacity.estimate!=null){
        const cap={...row,kg:capacity.estimate};
        const day=capacityByDay.get(workout.date);if(!day||cap.kg>day.kg)capacityByDay.set(workout.date,cap);
        if(!bestCapacity||cap.kg>bestCapacity.kg)bestCapacity=cap;
      }
    }
    return {sessions:sessions.size,sets,capacityDays:capacityByDay.size,bestLoad,bestCapacity};
  }
  function comparison(recent,prior){
    if(!recent.bestCapacity)return {status:'insufficient',reason:'No capacity-eligible performance in the recent 4-week window.'};
    if(!prior.bestCapacity)return {status:'insufficient',reason:'No capacity-eligible performance in the previous 4-week window.'};
    if(recent.capacityDays<2||prior.capacityDays<2)return {status:'sparse',reason:'Both 4-week windows need at least two capacity-evidence days before showing a change.'};
    const deltaKg=Core.round(recent.bestCapacity.kg-prior.bestCapacity.kg,1),deltaPct=prior.bestCapacity.kg>0?Core.round(deltaKg/prior.bestCapacity.kg*100,1):null;
    return {status:'comparable',deltaKg,deltaPct,recentKg:recent.bestCapacity.kg,priorKg:prior.bestCapacity.kg,
      note:'Compares each window’s best RPE-aware demonstrated-capacity estimate; it is not a tested 1RM or a causal strength-gain estimate.'};
  }
  function analyze(state,{asOf}={}){
    if(!Schedule.date(asOf))throw Error('Choose a valid progress analysis date.');
    const recentRange=period(asOf,0),priorRange=period(asOf,28),recentWorkouts=workoutsIn(state,recentRange),priorWorkouts=workoutsIn(state,priorRange);
    const recent=trainingSummary(recentWorkouts),prior=trainingSummary(priorWorkouts);
    const markers=markerCandidates(state,asOf).map(marker=>{
      const current=markerSummary(recentWorkouts,marker),previous=markerSummary(priorWorkouts,marker);
      return {...marker,recent:current,prior:previous,comparison:comparison(current,previous)};
    });
    return {
      version:1,asOf,recentRange,priorRange,recent,prior,
      deltas:{sessions:recent.sessions-prior.sessions,strengthSets:recent.strengthSets-prior.strengthSets},
      schedule:scheduleSummary(state,recentRange,asOf),markers,
      markerMode:markers.length?(markers[0].source==='competition'?'confirmed competition lifts':'most-trained strength exercises'):'none',
      notes:[
        'Session and set counts describe logged training; more is not automatically better.',
        'Scheduled-session adherence is completed / (completed + explicitly skipped). Unconfirmed and cancelled sessions are shown separately.',
        'Capacity comparisons require RPE-aware evidence and at least two evidence days in each 4-week window. Planned loads, training maxes and known 1RMs do not fill missing performance evidence.'
      ]
    };
  }
  return {analyze,trainingSummary,markerCandidates,markerSummary,comparison};
});
