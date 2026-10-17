/* Phase 2: explain the evidence underlying a reviewed phase decision.
 * Read-only, no schedule writes and no unit conversions: logged weights
 * are stored in kg and their display belongs in the presenting UI.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnotePhaseReviewBrief=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const labels={keep:'Keep scheduled targets',gather:'More evidence needed',progress:'Optional load increase', 'add-set':'Optional final set', 'reduce-load':'Optional load reduction','reduce-sets':'Optional set reduction'};
 const impacts={progress:'If approved, offer an increase of up to 2.5% to eligible next-phase loads, rounded to the existing increment and limited by each exercise training-max ceiling.', 'add-set':'If approved, add one copy of the final set to each eligible next-phase exposure, never exceeding four working sets.', 'reduce-load':'If approved, reduce eligible next-phase loads by about 5%, rounded down to the existing increment.', 'reduce-sets':'If approved, remove the final set from eligible next-phase exposures, preserving at least two working sets.'};
 function finite(n){return typeof n==='number'&&Number.isFinite(n);}
 function inspect(report,choices={}){
  if(!report?.findings||!Array.isArray(report.evidence))throw Error('Generate a reviewed training evidence report first');
  const result=LIFTS.map(lift=>{
   const f=report.findings[lift];
   if(!f||!Number.isInteger(f.expectedSessions)||!Number.isInteger(f.completedSessions)||!Number.isInteger(f.comparedSets))throw Error('Incomplete review evidence for '+lift);
   const action=choices[lift]||'keep',suggested=f.decision||'gather';
   if(!labels[action]||action!=='keep'&&action!==suggested||!['progress','add-set','reduce-load','reduce-sets'].includes(action)&&action!=='keep')throw Error('Unsupported adaptation choice for '+lift);
   const capacity=f.capacity;
   const evidence=[
    f.completedSessions+' of '+f.expectedSessions+' planned sessions logged',
    f.comparedSets+' matched sets with actual load, reps and RPE compared to the planned targets',
    'Average recorded RPE: '+(finite(f.averageRpe)?f.averageRpe:'unknown'),
    'Effort above cap: '+(f.overCapSets||0)+' matched sets across '+(f.overCapSessions||0)+' sessions',
    'Below-cap exposures: '+(f.underCapSessions||0),
    capacity&&finite(capacity.firstKg)&&finite(capacity.lastKg)?'Competition-lift capacity comparison: '+capacity.firstDate+' to '+capacity.lastDate+' (stored in kg; estimates, not tested 1RMs)':'No supported comparison of competition-lift capacity endpoints'
   ];
   const changed=action!=='keep';
   return {lift,name:f.name||lift,recommendation:suggested,label:labels[action],action,
    whatChanged:changed
      ? impacts[action]+' This changes only eligible unperformed sessions, after reviewing exact before-and-after targets.'
      : 'No change to the scheduled next-phase targets.',
    why:String(f.reason||'Insufficient supported evidence to recommend a change.'),
    evidence,observed:{expectedSessions:f.expectedSessions,completedSessions:f.completedSessions,comparedSets:f.comparedSets},
    needsMoreEvidence:suggested==='gather',requiresApproval:changed};
  });
  return {version:1,phase:report.phase||null,nextPhase:report.nextPhase||null,lifts:result,
   notice:'Recommendations come from recorded performance and declared context, not medical measures. Nothing changes automatically; athlete approval and fresh schedule validation are required.'};
 }
 return {LIFTS,labels,inspect};
});
