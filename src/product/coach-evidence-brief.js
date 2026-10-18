/* v3.47: read-only personalized recap from canonical Progress and weekly evidence.
 * No recovery diagnosis, invented training dose, or automatic plan changes.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./progress-story'),require('./schedule'));
 else root.LoadnoteCoachEvidenceBrief=factory(root.LoadnoteProgressStory,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Story,Schedule){
 'use strict';
 const question=q=>/\b(summariz(?:e|ing) my training|training recap|my recent training overview|how has my training gone (?:this|last) month|what should i focus on (?:this|next) week|what is worth reviewing)\b/i.test(q);
 function inspect(state,{asOf}={}){
  if(!Schedule.date(asOf))throw Error('A valid coaching review date is required');
  const report=Story.analyze(state,{asOf,weeks:12}),month=report.overview.recent,consistency=report.summary.consistency,decision=report.summary.changes;
  const directions=(report.summary.strength||[]).filter(x=>['higher','similar','lower'].includes(x.status));
  const sparse=(report.summary.strength||[]).filter(x=>!['higher','similar','lower'].includes(x.status));
  const notes=[];
  notes.push(month.sessions+' workouts and '+month.strengthSets+' eligible strength sets were logged in the most recent 28 days.');
  notes.push(month.strengthSets?month.rpeSets+' of '+month.strengthSets+' working sets include valid actual RPE. Missing RPE cannot be treated as a low or high effort.':'No eligible strength sets were logged in that window.');
  if(consistency.mode==='scheduled')notes.push(consistency.resolved?consistency.resolved+' explicitly resolved Calendar sessions; adherence '+consistency.adherence+'%. Unconfirmed and cancelled sessions are excluded.':'Calendar includes no explicitly resolved sessions for an adherence comparison.');
  else notes.push('No comparable scheduled-session adherence can be calculated for this window.');
  if(directions.length)notes.push(directions.slice(0,3).map(x=>x.label+': '+x.status+' RPE-aware capacity evidence ('+(x.deltaPct>0?'+':'')+x.deltaPct+'%).').join(' '));
  if(sparse.length)notes.push(sparse.length+' exercise trend(s) require more comparable RPE-aware days.');
  if(decision.changed)notes.push(decision.rows.length+' approved changes are documented in the selected timeline; later results cannot be attributed to these changes alone.');
  else notes.push('No changed, athlete-approved programming decision is documented in the selected window.');
  const next=month.sessions===0?'Start with a dated workout log so the Coach has evidence to discuss.':
   month.strengthSets>0&&month.rpeSets<month.strengthSets?'Record actual RPE when practical and review the exact planned targets before deciding whether to adjust training.':
   sparse.length?'Keep comparing equivalent movement practice and effort over time; review the exact training history before proposing changes.':
   'Continue reviewing recorded performance against the current approved targets in Decisions; no load increase is inferred.';
  return {version:1,status:'ready',asOf,readOnly:true,notes,next,observed:{sessions:month.sessions,sets:month.strengthSets,rpeSets:month.rpeSets},notice:'Describes logged training evidence, not medical readiness, fatigue or proof of a training intervention.'};
 }
 function answer(state,q,options={}){
  if(!question(String(q||'')))return null;
  try{
   const report=inspect(state,options);
   return {text:report.notes.join('\n\n')+'\n\nNext: '+report.next+'\n\n'+report.notice,source:'Offline Coach · training recap',readOnly:true,evidence:[report],intent:{topic:'training-recap'},
    clarity:{happened:report.observed.sessions+' completed workouts and '+report.observed.sets+' eligible strength sets in the last 28 days.',meaning:report.observed.sets?report.observed.rpeSets+' of '+report.observed.sets+' sets have recorded actual RPE; missing effort remains unknown.':'No supported strength-work trend is available yet; that does not erase your other training.',next:report.next},
    followUps:['How did this week go?','Explain my next workout']};
  }catch{return {text:'I could not validate a current training recap. Check saved dates, exercise mappings and training history first; no program changes were made.',source:'Offline Coach · training recap unavailable',readOnly:true,evidence:[]};}
 }
 return {question,inspect,answer};
});
