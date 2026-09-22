/* Context-matched observations and an offline, non-applying policy experiment. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'),require('./block-decision-context'),require('./decision-performance'),require('./decision-backtest'),require('./decision-engine'),require('./decision-readiness'));
 else root.LoadnoteDecisionContextAnalysis=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteBlockDecisionContext,root.LoadnoteDecisionPerformance,root.LoadnoteDecisionBacktest,root.LoadnoteDecisionEngine,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Context,Performance,Backtest,Engine,Readiness){
 'use strict';
 const signature=c=>JSON.stringify([c.blockType,c.phase,c.loadStrategy,c.progressionIntent]);
 function context(block){if(!block)return null;const c=Context.interpret(block);return {version:1,blockId:block.id,blockType:block.blockType,phase:c.phase,loadStrategy:block.loadStrategy,progressionIntent:block.progressionIntent,conflicted:c.conflicts.length>0};}
 function usable(c){return c?.version===1&&typeof c.blockId==='string'&&c.blockId&&['return','accumulation','strength','peaking','testing','deload'].includes(c.phase)&&Object.hasOwn(Blocks.types,c.blockType)&&Object.hasOwn(Blocks.strategies,c.loadStrategy)&&c.loadStrategy!=='unknown'&&Object.hasOwn(Blocks.intents,c.progressionIntent)&&!['unknown','custom'].includes(c.progressionIntent)&&c.conflicted===false;}
 const at=(state,date,knownAt)=>context(Blocks.at(state.trainingBlocks||[],date,{knownAt,retrospective:false}));
 function qualify(state,row){
  const c=row.snapshot.trainingContext,base=row.snapshot.evidence?.at(-1),out=row.outcome;
  if(row.attribution!=='attributed')return row.attribution;
  if(!usable(c))return 'context-unavailable';
  if(!base?.exerciseId||base.exerciseId!==out?.exerciseId||!Number.isFinite(out.capacityChangePct))return 'identity-or-capacity-missing';
  const b=at(state,base.date,row.updatedAt),o=at(state,out.date,out.date+'T23:59:59.999Z');
  if(!usable(b)||!usable(o))return 'dated-context-unavailable';
  if(b.blockId!==c.blockId||o.blockId!==c.blockId||signature(b)!==signature(c)||signature(o)!==signature(c))return 'context-changed';
  return 'included';
 }
 function analyze(state,{asOf}={}){
  if(!Blocks.date(asOf))throw Error('A valid report date is required.');
  const cutoff=asOf+'T23:59:59.999Z';
  const observed={...state,workouts:Readiness.workoutsAt(state,asOf,cutoff,false).workouts,decisionEvents:(state.decisionEvents||[]).filter(e=>e.updatedAt<=cutoff)};
  const report=Performance.analyze(observed,{asOf});
  const groups=new Map(),rows=report.rows.map(row=>({...row,contextStatus:qualify(state,row)}));
  for(const row of rows){
   const c=row.snapshot.trainingContext,id=row.snapshot.evidence?.at(-1)?.exerciseId||'unknown';
   const key=JSON.stringify([row.snapshot.lift,id,usable(c)?signature(c):'unknown']);
   if(!groups.has(key))groups.set(key,{key,lift:row.snapshot.lift,exerciseId:id,context:usable(c)?c:null,rows:[]});groups.get(key).rows.push(row);
  }
  const cohorts=[...groups.values()].map(g=>{
   const included=g.rows.filter(r=>r.contextStatus==='included'),excluded={};for(const r of g.rows)if(r.contextStatus!=='included')excluded[r.contextStatus]=(excluded[r.contextStatus]||0)+1;
   const byResponse=Object.fromEntries(['accept','modify','ignore'].map(response=>{const a=included.filter(r=>r.response===response);return [response,{count:a.length,meanCapacityChangePct:a.length>=3?Core.round(a.reduce((n,r)=>n+r.outcome.capacityChangePct,0)/a.length,1):null}];}));
   return {...g,recorded:g.rows.length,included:included.length,excluded,byResponse};
  });
  return {version:1,asOf,readOnly:true,cohorts,rows,note:'Matched on saved lift identity, block type, phase, load strategy and intent. Baseline and follow-up must stay in the same block. These observations are not causal evidence or verified execution of the chosen direction.'};
 }
 function compare(state,{asOf,lift='squat',days=84}={}){
  if(!Blocks.date(asOf)||!['squat','bench','deadlift'].includes(lift)||!Number.isInteger(days)||days<1||days>180)throw Error('Choose a valid date, lift and 1–180 day window.');
  // Freeze the evaluation dataset at report time; later edits/outcomes cannot leak into it.
  const cutoff=asOf+'T23:59:59.999Z';
  const view={...state,workouts:Readiness.workoutsAt(state,asOf,cutoff,false).workouts};
  const from=new Date(Date.parse(asOf+'T12:00:00Z')-(days-1)*86400000).toISOString().slice(0,10);
  const cutoffs=Backtest.candidateDates(view,lift,{from,to:asOf,retrospective:false});
  const baseline=Engine.policy(),candidate=Engine.policy({...baseline,increaseTrendPct:Number(baseline.increaseTrendPct)+1,conservativeIncreaseTrendPct:Number(baseline.conservativeIncreaseTrendPct)+1});
  const options={from,to:asOf,lifts:[lift],cutoffs,retrospective:false};
  const current=Backtest.run(view,{...options,policy:baseline}),proposed=Backtest.run(view,{...options,policy:candidate});
  const rows=current.rows.map((a,i)=>({date:a.asOf,current:a.decision,candidate:proposed.rows[i].decision,changed:a.decision!==proposed.rows[i].decision,outcomeDate:a.outcome?.date||null}));
  return {readOnly:true,automaticChanges:false,asOf,from,lift,baseline,candidate,current:current.summary,proposed:proposed.summary,rows,changed:rows.filter(r=>r.changed).length,note:'Sensitivity experiment only: increase thresholds are raised by 1 percentage point; all other rules stay fixed. Same dates and as-recorded evidence are used. No policy is selected or applied. Outcomes may be shared across replay dates, so totals are not independent trials. Missing timestamps, aliases and pruned revisions limit historical reconstruction. This does not establish which rule is better.'};
 }
 return {analyze,compare,qualify};
});
