/* Read-only review: shared estimates, dated evidence, no training decisions. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'),require('./decision-readiness'),require('./session-intent'),require('./schedule'));
  else root.LoadnoteReview=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteReadiness,root.LoadnoteIntent,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Readiness,Intent,Schedule){
  'use strict';
  const key=e=>e.exerciseId?'id:'+e.exerciseId:'name:'+String(e.name||'').trim().toLowerCase();
  const strength=e=>e.type!=='cardio'&&e.trackBy!=='duration';
  const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  function review(state,{asOf,weeks=12,retrospective=true,knownAt}={}){
    if(!Blocks.date(asOf)||![1,4,12].includes(weeks))throw Error('Choose a valid analysis date and review range.');
    if(knownAt&&!stamp(knownAt))throw Error('Invalid knowledge cutoff.');
    const end=asOf+'T23:59:59.999Z',cutoff=knownAt&&knownAt<end?knownAt:end,from=move(asOf,1-weeks*7);
    const replay=Readiness.workoutsAt(state,asOf,cutoff,retrospective);
    const all=replay.workouts.map(w=>{
      // workoutsAt returns copies. A future-captured prescription is not past knowledge.
      if(!retrospective&&w.sessionIntent?.prescription?.capturedAt>cutoff){
        w.sessionIntent.prescription=null;delete w.sessionIntent.schedule;
      }
      return w;
    });
    const workouts=all.filter(w=>w.date>=from);
    const monday=move(asOf,-(new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7),sunday=move(monday,6);
    // Schedule revisions retain their own knowledge boundary in both review modes.
    const schedule=Schedule.summary(state.scheduledSessions||[],all,{from:monday,to:sunday,asOf,knownAt:cutoff});
    const weekWorkouts=all.filter(w=>w.date>=monday&&w.date<=asOf);
    const week={...schedule,from:monday,to:sunday,loggedWorkouts:weekWorkouts.length,
      unlinkedWorkouts:weekWorkouts.filter(w=>!w.sessionIntent?.schedule).length,
      rescheduled:schedule.sessions.filter(s=>{
        const record=(state.scheduledSessions||[]).find(r=>r.id===s.id);
        return record?.revisions.some((v,i)=>i>0&&v.recordedAt<=cutoff&&v.context.date!==record.revisions[i-1].context.date);
      }).length};
    const scope={id:'review-window',createdAt:'0001-01-01T00:00:00.000Z',updatedAt:'0001-01-01T00:00:00.000Z',
      revisions:[{recordedAt:'0001-01-01T00:00:00.000Z',context:Blocks.context({name:'Review window',startDate:from,endDate:asOf})}]};
    // Reuse the existing block trends and sparse-data guards; this scope is never persisted.
    const metrics=Blocks.analyze([scope],workouts,scope.id,{asOf,retrospective:true});
    const groups=new Map(),blocks=new Map();
    for(const w of workouts){
      const block=Blocks.at(state.trainingBlocks||[],w.date,{retrospective,knownAt:cutoff});
      if(block)blocks.set(block.id,block);
      const seen=new Map();
      const ensure=e=>{
        const k=key(e);if(!groups.has(k))groups.set(k,{key:k,name:e.name,exerciseId:e.exerciseId||null,evidence:[],contexts:new Set()});
        if(!seen.has(k))seen.set(k,{workoutId:String(w.id),date:w.date,blockId:block?.id||null,actualSets:[],plannedSets:[],
          capturedAt:w.sessionIntent?.prescription?.capturedAt||null,
          retrospectivePlan:!!w.sessionIntent?.prescription&&w.sessionIntent.prescription.capturedAt.slice(0,10)>w.date,
          deviationReason:w.sessionIntent?.deviationReason||'none',deviationNotes:w.sessionIntent?.deviationNotes||''});
        return seen.get(k);
      };
      for(const e of w.exercises||[])if(strength(e))for(const s of e.sets||[]){
        const weight=Number(s.weight),reps=Number(s.reps),raw=s.rpe,rpe=raw==null||raw===''?null:Number(raw);
        if(!(Number.isFinite(weight)&&weight>0&&Number.isInteger(reps)&&reps>0))continue;
        const usable=reps<=12&&rpe>=6&&rpe<=10;
        ensure(e).actualSets.push({weight,reps,rpe:Number.isFinite(rpe)?rpe:null,
          estimatedCapacity:usable?Core.estimated1RM(weight,reps,rpe):null,
          limitation:reps>12?'More than 12 reps':!usable?'Missing or unusable RPE (requires 6–10)':null});
      }
      for(const e of w.sessionIntent?.prescription?.plannedExercises||[])if(strength(e))for(const s of e.sets||[]){
        if(Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0)
          ensure(e).plannedSets.push({weight:Number(s.weight),reps:Number(s.reps),targetRpe:s.targetRpe??null});
      }
      for(const [k,row] of seen){
        const group=groups.get(k);group.evidence.push(row);
        group.contexts.add(JSON.stringify(block?[block.id,block.blockType,block.loadStrategy,block.progressionIntent]:null));
      }
    }
    const exercises=[...groups.values()].map(group=>{
      const metric=metrics.exercises.find(e=>key(e)===group.key)||{};
      const actual=group.evidence.flatMap(e=>e.actualSets),usable=actual.filter(s=>s.estimatedCapacity!==null);
      const reasons=[];
      if(group.contexts.size>1)reasons.push('Training context changes in this range. Narrow the dates before comparing endpoints.');
      if(!group.exerciseId)reasons.push('Legacy name-based identity; variants with different names stay separate.');
      if(actual.length>usable.length)reasons.push((actual.length-usable.length)+' logged sets lack usable capacity evidence.');
      if(group.evidence.some(e=>!e.plannedSets.length))reasons.push('Some sessions have no recorded prescription; actual loads are not substituted.');
      if(group.evidence.some(e=>e.retrospectivePlan))reasons.push('Some plans were captured after training; they are retrospective context, not proof of advance intent.');
      const guarded=group.contexts.size>1;
      return {...group,contexts:undefined,actualSets:actual.length,usableSets:usable.length,
        capacityDays:new Set(group.evidence.filter(e=>e.actualSets.some(s=>s.estimatedCapacity!==null)).map(e=>e.date)).size,
        prescriptionTrend:guarded?null:metric.prescriptionTrend||null,
        loggedLoadTrend:guarded?null:metric.loggedLoadTrend||null,
        estimatedCapacityTrend:guarded?null:metric.estimatedCapacityTrend||null,reasons};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    const warnings=[];
    if(!retrospective&&replay.legacyTimestampCount)warnings.push('Legacy workouts lack saved-at timestamps. Historical replay is incomplete, not a verified backtest.');
    if(!retrospective)warnings.push('Replay uses retained workout revisions; pruned revisions and undated exercise-alias changes limit exact reconstruction.');
    if(!workouts.length)warnings.push('No workouts recorded in this review range.');
    if(workouts.some(w=>!Blocks.at(state.trainingBlocks||[],w.date,{retrospective,knownAt:cutoff})))warnings.push('Some workouts have no training-block context.');
    return {version:1,from,asOf,weeks,mode:retrospective?'current-corrected':'as-recorded',knowledgeCutoff:cutoff,
      week,workoutCount:workouts.length,execution:Intent.summarize(workouts),exercises,blocks:[...blocks.values()],warnings,
      interpretation:[...blocks.values()].some(b=>b.loadStrategy==='conservative'||b.blockType==='return-reentry'||b.progressionIntent==='return-ramp')
        ?'Deliberate progression context: prescription increases are not equivalent to strength gains. RPE-aware estimates describe demonstrated performance, not measured physiological strength.'
        :'Prescribed loads, logged loads and estimated performance are separate observations, not predictions.',
      decisionAllowed:false};
  }
  return {review};
});
