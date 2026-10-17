/* v3.43 — deterministic weekly observations from the existing exact-match review.
 * No second progression policy, medical recovery claim, or automatic scheduling.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteWeeklyCoachingInsights=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inspect(review){
  if(!review||review.status!=='ready')return {status:'unavailable',items:[],notice:'A single completed, validated program week is needed.'};
  const groups=(review.groups||[]),items=[],planned=groups.reduce((n,g)=>n+(g.plannedSets||0),0),matched=groups.reduce((n,g)=>n+(g.comparedSets||0),0);
  const incomplete=groups.filter(g=>g.status==='gather'),over=groups.filter(g=>g.aboveCap>0),reviewable=groups.filter(g=>g.status==='review');
  if(incomplete.length)items.push({kind:'missing',label:'Evidence to resolve',text:incomplete.map(g=>g.name).join(', ')+': not all prescribed work was comparable. Missing sets, RPE or changed sessions do not count as unsuccessful training.'});
  if(over.length)items.push({kind:'effort',label:'Effort above target',text:over.map(g=>g.name+': '+g.aboveCap+' sets above the planned RPE cap').join('; ')+'. Review the saved set details before interpreting the cause.'});
  if(matched>0)items.push({kind:'completion',label:'Matched training',text:matched+' of '+planned+' prescribed sets matched their saved load, reps and effort criteria; a match does not by itself authorize progression.'});
  if(!items.length)items.push({kind:'starting',label:'Awaiting comparable work',text:'No matched set evidence was available for this completed week. Review the logged or scheduled sessions.'});
  const proposal=review.proposal||{};
  items.push({kind:'next',label:'Next review step',text:proposal.label?proposal.label+'. '+(proposal.reason||''):'Continue the existing scheduled program; no new dose is inferred.'});
  return {status:'ready',week:review.week,from:review.from,through:review.through,programName:review.program?.name,plannedSets:planned,matchedSets:matched,items:items.slice(0,4),
   notice:'Only explicitly approved Decisions reviews can change future sessions. These observations are not fatigue, readiness or medical measurements.'};
 }
 return {inspect};
});
