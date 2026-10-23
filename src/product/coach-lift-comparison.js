/* v3.91: two-lift read-only comparisons from existing RPE-aware trends. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-performance-insights'),require('./coach-support'));
 else root.LoadnoteCoachLiftComparison=factory(root.LoadnoteCoachPerformanceInsights,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Trends,Support){
 'use strict';
 const names=['squat','bench','deadlift'];
 const clean=q=>String(q??'').replace(/\s+/g,' ').trim().slice(0,500);
 const unsafe=q=>Support?.health(q)||Support?.kind(q)==='urgent-support';
 const named=q=>names.filter(l=>new RegExp('\\b'+(l==='deadlift'?'(?:deadlift|sumo)':l)+'\\b','i').test(q));
 const direct=q=>/\b(?:compare|comparison|versus|vs\.?|which)\b/i.test(q)&&/\b(?:progress|trends?|performance|improv(?:e|ing|ement)|stalled|plateau(?:ed|ing)?)\b/i.test(q);
 const pairFollow=q=>/^(?:what about|how about|and) (?:my |the )?(?:squat|bench|deadlift|sumo) (?:and|versus|vs\.?) (?:my |the )?(?:squat|bench|deadlift|sumo)\s*[?.!]*$/i.test(q);
 const coverage=q=>/^(?:what(?:'s| is) missing (?:for|in) (?:that comparison|those (?:two )?lifts)|(?:what|how much) (?:data|evidence) (?:is|are) (?:missing|available) for (?:that comparison|those (?:two )?lifts)|what are (?:the )?limits of that comparison)\s*[?.!]*$/i.test(q);
 const brief=q=>/^(?:give me (?:the |a )?(?:short version|quick summary|main takeaway)|what(?:'s| is) (?:the )?(?:takeaway|main point|bottom line)|(?:can you )?(?:put (?:that|it) (?:more )?simply|explain (?:that|it) (?:more )?simply)|summari[sz]e (?:that|it)|in plain english|tl;?dr)\s*[.!?]*$/i.test(q);
 const source=q=>/^(?:where did that comparison come from|what (?:evidence|data) supports that comparison)\s*[?.!]*$/i.test(q);
 function previousPair(history){
  let count=0;
  const users=(Array.isArray(history)?history:[]).slice(-8).filter(row=>row?.role==='user').reverse();
  for(const row of users){
   if(++count>3||typeof row.content!=='string'||unsafe(row.content))return null;
   const q=clean(row.content);
   if(coverage(q)||source(q)||brief(q))continue;
   const pair=named(q);
   return (direct(q)||pairFollow(q))&&pair.length===2?pair:null;
  }
  return null;
 }
 function intent(question,history=[]){
  if(typeof question!=='string'||!question.trim()||unsafe(question))return null;
  const q=clean(question),isDirect=direct(q),isFollow=pairFollow(q),
   isCoverage=coverage(q),isSource=source(q),isBrief=brief(q);
  if(!isDirect&&!isFollow&&!isCoverage&&!isSource&&!isBrief)return null;
  const prior=(isDirect?null:previousPair(history));
  if(!isDirect&&!prior)return null;
  const lifts=isDirect||isFollow?named(q):prior;
  if(lifts.length!==2)return {needsClarification:true,question:q,
   text:lifts.length>2?'Choose two lifts to compare: squat, bench or deadlift.':'Which two competition lifts should I compare: squat, bench or deadlift?'};
  return {question:q,lifts,mode:isCoverage?'coverage':isSource?'source':isBrief?'brief':'compare'};
 }
 function answer(state,question,{asOf,unit='kg',history=[]}={}){
  const request=intent(question,history);if(!request)return null;
  if(request.needsClarification)return {text:request.text,source:'Offline Coach · lift comparison clarification',
   readOnly:true,evidence:[],actions:[],intent:{topic:'lift-comparison',needsClarification:true}};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf||''))return null;
  const reports=request.lifts.map(lift=>{try{return Trends.inspect(state,{asOf,lift,weeks:12,unit});}
   catch{return {status:'unavailable',lift,reason:'Saved records or comparison dates could not be validated.'};}});
  const statuses={higher:'higher estimated RPE-aware capacity',lower:'lower estimated RPE-aware capacity',
   similar:'similar estimated RPE-aware capacity',insufficient:'insufficient comparable RPE-aware days'};
  const lines=reports.map(r=>{
   const label=r.name||r.lift[0].toUpperCase()+r.lift.slice(1);
   if(!Object.hasOwn(statuses,r.status))return label+': '+(r.reason||'Evidence unavailable.')+' No comparison is established.';
   const pct=Number.isFinite(r.changePct)&&r.status!=='insufficient'?
    ' Within this lift, median estimated capacity changed '+(r.changePct>0?'+':'')+Number(r.changePct.toFixed(1))+'%.':'';
   if(request.mode==='brief')return label+': '+statuses[r.status]+'.'+pct+ (r.status==='insufficient'?' Not enough logged effort-rated days to establish a trend.':'');
   const needed=r.status==='insufficient'?' At least two eligible RPE-aware days are required in each comparison window.':'';
   const detail=request.mode==='coverage'?' Recent recorded sets: '+r.recentSets+'; eligible days in the 12-week window: '+r.allEvidenceDays+'.':'';
   return label+': '+statuses[r.status]+'. Earlier window: '+r.baselineDays+
    ' RPE-aware days; recent window: '+r.recentDays+' RPE-aware days.'+pct+needed+detail;
  });
  const explanation=request.mode==='source'?
   '\nSources: recorded competition-lift mappings, completed working sets and valid logged RPE, evaluated in the existing 12-week training-trend windows.':'';
  const caveat=request.mode==='brief'?'\nSource: saved working sets, lift mappings and logged effort ratings. Missing data is unknown; this does not authorize a load change.':'\nEach trend compares a lift with its own prior performance; raw squat and bench weights are not comparable. A pattern cannot establish its cause or authorize a load change. Missing RPE or exercise mappings are unknown, not poor performance.';
  return {text:(request.mode==='brief'?'Short version of the two-lift comparison:':request.mode==='coverage'?'Available data for the two lifts:':request.mode==='source'?
   'Evidence behind the two-lift comparison:':'Two-lift training trend review:')+'\n'+lines.join('\n')+explanation+caveat,
   source:'Offline Coach · verified two-lift trends',readOnly:true,evidence:reports,
   intent:{topic:'lift-comparison',lifts:request.lifts,mode:request.mode},
   actions:[{kind:'progress',label:'Review exact lift histories'}],
   followUps:["What's missing for those two lifts?",'Review my exact workout history']};
 }
 return {intent,answer};
});