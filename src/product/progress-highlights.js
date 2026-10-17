/* v3.41 — concise progress facts from the established read-only ProgressStory.
 * This module never computes training decisions or changes stored weights.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteProgressHighlights=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inspect(report){
  if(!report?.overview?.recent||!report?.summary?.consistency)throw Error('A valid Progress story is required');
  const recent=report.overview.recent,prior=report.overview.prior||{},consistency=report.summary.consistency;
  const strength=report.summary.strength||[];
  const comparable=strength.filter(x=>['higher','similar','lower'].includes(x.status));
  const leading=comparable[0]||null;
  const rpe=Number.isFinite(recent.rpeCoverage)?recent.rpeCoverage:null;
  return {version:1,asOf:report.asOf,period:'Last 28 days',
   metrics:[
    {key:'sessions',label:'Workouts logged',value:recent.sessions,detail:'Previous 28 days: '+(prior.sessions||0)},
    {key:'sets',label:'Strength sets logged',value:recent.strengthSets,detail:'Only sets with recorded load and reps are counted'},
    {key:'rpe',label:'Sets with RPE',value:rpe==null?'—':rpe+'%',detail:recent.strengthSets?recent.rpeSets+' of '+recent.strengthSets+' eligible sets':'Log working sets to show coverage'}
   ],
   consistency:consistency.mode==='scheduled'
    ?{status:'scheduled',label:consistency.adherence==null?'No resolved scheduled sessions':consistency.adherence+'% adherence across '+consistency.resolved+' resolved sessions',detail:'Unconfirmed and cancelled sessions are not treated as misses'}
    :{status:'logged',label:'Schedule adherence unavailable',detail:'No scheduled sessions in the review window'},
   direction:leading?{status:leading.status,label:leading.label,deltaPct:leading.deltaPct,
      explanation:leading.label+': '+(leading.deltaPct>0?'+':'')+leading.deltaPct+'% in RPE-aware estimated capacity; not a tested maximum'}:
      {status:'unknown',label:'No supported lift trend yet',deltaPct:null,explanation:'At least two RPE-aware training days are needed in both comparison windows.'},
   note:'Describes corrected training records, not readiness, recovery or proof that any plan caused the result.'};
 }
 return {inspect};
});
