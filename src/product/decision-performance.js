/* Loadnote v2.5 — observational feedback and next-exposure attribution. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./decision-feedback'));
  else root.LoadnoteDecisionPerformance=factory(root.LoadnoteCore,root.LoadnoteDecisionFeedback);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Feedback){
  'use strict';
  if(!Core||!Feedback)throw Error('Decision performance dependencies are required');
  const VERSION=1,LIFTS=['squat','bench','deadlift'];
  const pct=(n,d)=>d?Core.round(n/d*100,1):null;
  const mean=values=>values.length?Core.round(values.reduce((a,b)=>a+b,0)/values.length,1):null;
  const chosen=e=>e.response==='ignore'?null:e.response==='modify'?e.chosenDirection:e.snapshot.decisionAllowed?e.snapshot.decision:null;
  const direction=d=>['increase','hold','reduce'].includes(d)?d:null;
  const kind=change=>change==null?'unobserved':change>=1?'improved':change<=-1?'declined':'stable';
  const after=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  function analyze(state,{horizonDays=42,asOf}={}){
    if(!Number.isInteger(horizonDays)||horizonDays<1||horizonDays>365)throw Error('Invalid outcome horizon.');
    const today=asOf||new Date().toISOString().slice(0,10);
    const observedState={...state,workouts:(state?.workouts||[]).filter(w=>w.date<=today)};
    const rows=Feedback.history(observedState,{horizonDays}).map(event=>({
      ...event,chosenDirection:chosen(event),outcomeClass:kind(event.outcome?.capacityChangePct??null),
      attribution:event.outcome?'attributed':after(event.snapshot.asOf,horizonDays)<today?'window-ended':'awaiting-outcome'
    }));
    // A workout is one observed outcome per lift, even if several decisions preceded it.
    // Attribute to the latest decision made for that lift before the exposure.
    const groups=new Map();
    for(const row of rows){
      if(!row.outcome)continue;
      const key=[row.snapshot.lift,row.outcome.date,row.outcome.workoutId].join('|');
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(row);
    }
    for(const group of groups.values()){
      group.sort((a,b)=>b.snapshot.asOf.localeCompare(a.snapshot.asOf)||b.createdAt.localeCompare(a.createdAt)||String(b.id).localeCompare(String(a.id)));
      group.slice(1).forEach(row=>{row.attribution='overlapping';});
    }
    return {version:VERSION,readOnly:true,horizonDays,asOf:today,rows,summary:summarize(rows),lifts:Object.fromEntries(LIFTS.map(lift=>[lift,summarize(rows.filter(row=>row.snapshot.lift===lift))]))};
  }
  function summarize(rows){
    const count=rows.length;
    const responses={accept:0,modify:0,ignore:0};
    const decisions={increase:0,hold:0,reduce:0,'insufficient-evidence':0};
    const choices={increase:0,hold:0,reduce:0,none:0};
    for(const row of rows){
      responses[row.response]=(responses[row.response]||0)+1;
      decisions[row.snapshot.decision]=(decisions[row.snapshot.decision]||0)+1;
      const actual=direction(row.chosenDirection)||'none';
      choices[actual]++;
    }
    const observed=rows.filter(row=>row.attribution==='attributed');
    const overlapping=rows.filter(row=>row.attribution==='overlapping').length;
    const pending=rows.filter(row=>row.attribution==='awaiting-outcome').length;
    const expired=rows.filter(row=>row.attribution==='window-ended').length;
    const byResponse=Object.fromEntries(Object.keys(responses).map(response=>{
      const matches=observed.filter(row=>row.response===response);
      return [response,{observed:matches.length,meanCapacityChangePct:mean(matches.map(row=>row.outcome.capacityChangePct).filter(Number.isFinite)),meanRpeChange:mean(matches.map(row=>row.outcome.rpeChange).filter(Number.isFinite)),outcomes:{improved:matches.filter(row=>row.outcomeClass==='improved').length,stable:matches.filter(row=>row.outcomeClass==='stable').length,declined:matches.filter(row=>row.outcomeClass==='declined').length}}];
    }));
    const overrides=observed.filter(row=>row.response==='modify'&&direction(row.chosenDirection)&&row.chosenDirection!==row.snapshot.decision);
    const overridePatterns={};
    for(const row of overrides){
      const k=row.snapshot.decision+' → '+row.chosenDirection;
      const entry=overridePatterns[k]||(overridePatterns[k]={count:0,improved:0,stable:0,declined:0});
      entry.count++;entry[row.outcomeClass]++;
    }
    return {
      count,responses,decisions,choices,acceptanceRate:pct(responses.accept,count),
      modificationRate:pct(responses.modify,count),ignoreRate:pct(responses.ignore,count),
      uniqueObserved:observed.length,overlapping,pending,expired,
      outcomeCoverage:pct(observed.length,count),byResponse,overridePatterns,
      evidenceStatus:observed.length<3?'collecting':observed.length<10?'early-pattern':'reviewable-history'
    };
  }
  return {VERSION,LIFTS,analyze,summarize};
});
