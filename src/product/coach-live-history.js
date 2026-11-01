/* v6.1 — read-only, evidence-linked last saved exercise session for an open
 * workout. Reuses the corrected workout-history engine; never interprets a
 * checked draft set as recorded history or authorizes a new training load.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-training-history'));
 else root.LoadnoteCoachLiveHistory=factory(root.LoadnoteCoachTrainingHistory);
})(typeof globalThis!=='undefined'?globalThis:this,function(History){
 'use strict';
 const clean=(v,max=180)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
 const key=v=>clean(v,180).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 const pastDay=v=>{const d=new Date(v+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
 function wants(question){
  const q=clean(question,240).toLowerCase().replace(/[’‘]/g,"'").replace(/[?!.]+$/,'').trim();
  return /^(?:how did i do last time|what did i do last time|what did i lift last time|what did i log last time|how did (?:my|the) (?:last|previous) (?:set|session) go|show (?:my |the )?(?:last|previous) (?:saved |recorded )?(?:sets|session) for this exercise|how did i do last time (?:on|for|with) (?:this|the current) (?:exercise|lift|movement)|(?:what|how) (?:did i|was i) (?:do|perform) (?:on|for) this exercise last time|compare (?:this|my current) exercise (?:to|with) (?:last time|my last session)|compare (?:my )?current (?:exercise|set) (?:to|with) (?:my )?(?:last|previous) (?:saved )?(?:session|workout))$/.test(q);
 }
 function selection(state,name){
  const target=key(name);
  if(!target)return {error:'The logger has no identified current exercise. Choose an exercise in Train first.'};
  const entries=Array.isArray(state?.exerciseCatalog)?state.exerciseCatalog:[];
  const matched=entries.filter(e=>e&&e.id!=null&&typeof e.name==='string'&&
   [e.name,...(Array.isArray(e.aliases)?e.aliases:[])].some(x=>key(x)===target));
  const ids=[...new Set(matched.map(e=>String(e.id)))];
  if(ids.length>1)return {error:'More than one saved exercise matches '+clean(name)+'. Resolve the exercise names or aliases in Exercises before comparing recorded work.'};
  if(ids.length!==1)return {error:'I could not match '+clean(name)+' to one saved exercise. Confirm the exercise in Exercises before reviewing its recorded history.'};
  const entry=matched[0];
  // Legacy name-only records are compared only if all saved catalog aliases
  // for this identity have a single owner.
  const aliases=[entry.name,...(Array.isArray(entry.aliases)?entry.aliases:[])];
  const owners=entries.filter(e=>e&&e.id!=null&&[e.name,...(Array.isArray(e.aliases)?e.aliases:[])].some(n=>aliases.some(a=>key(a)===key(n))));
  if(owners.some(e=>String(e.id)!==ids[0]))return {error:'The exercise aliases overlap with another saved exercise. Check exercise identity before comparing history.'};
  return {exerciseId:ids[0],name:entry.name,aliases};
 }
 function answer(state,question,{asOf,unit='kg',live=null}={}){
  if(!wants(question)||!live?.liveWorkout?.active)return null;
  const result=(text,evidence=[])=>({
   text,source:'Shared coaching · last saved exercise session',
   readOnly:true,liveSavedHistoryBridge:true,evidence,
   intent:{topic:'current-exercise-history'},actions:[{kind:'current-workout',label:'Return to workout'}],
   followUps:['Review my last checked set','Any RPE missing?']
  });
  const draft=live.liveWorkout;
  if(!validDate(asOf)||!validDate(draft.date)||draft.date!==asOf)return result('The open workout date does not match the review date. Confirm it in Train before comparing recorded performance; no saved workout was changed.');
  const name=clean(draft.currentExercise?.name||draft.lastCheckedSet?.exerciseName);
  if(!name)return result('The open strength workout has no current or last checked exercise to identify. Select an exercise in Train first.');
  const found=selection(state,name);
  if(found.error)return result(found.error);
  const unitName=unit==='lb'?'lb':'kg';
  let reviewed;
  try{reviewed=History.inspect(state,found,{asOf:pastDay(asOf),unit:unitName});}
  catch{return result('I could not verify corrected saved history for '+found.name+'. Review your saved exercise records before comparing; the current draft was not changed.');}
  const previous=reviewed.sessions[0];
  if(!previous)return result('No earlier saved working sets for '+found.name+' were found before '+asOf+'. This open workout is still a draft, not evidence of a past performance.');
  const lines=previous.sets.slice(0,4).map(s=>
   (s.reps==null?'reps not recorded':s.reps+' reps')+' × '+s.weight+' · '+(s.rpe==null?'RPE unknown':'RPE '+s.rpe));
  let text='Last saved working sets for '+found.name+' were on '+previous.date+': '+lines.join(' / ')+'.';
  if(previous.sets.length>4)text+=' '+(previous.sets.length-4)+' further saved sets omitted.';
  text+=' Completion: '+previous.confirmed+' explicitly marked, '+previous.unmarked+' not marked';
  if(previous.excluded)text+=', '+previous.excluded+' excluded (warm-up, skipped or incomplete)';
  text+='. ';
  const checked=draft.lastCheckedSet;
  if(checked&&key(checked.exerciseName)===key(name)){
   const load=checked.displayWeight,entered=typeof load==='number'&&Number.isFinite(load)&&load>=0&&load<=2000?load+' '+(checked.displayUnit==='lb'?'lb':'kg'):'load not entered';
   const reps=Number.isInteger(checked.reps)&&checked.reps>=0&&checked.reps<=1000?checked.reps+' reps':typeof checked.durationSeconds==='number'&&Number.isFinite(checked.durationSeconds)&&checked.durationSeconds>=0?checked.durationSeconds+' seconds':'reps not entered';
   const effort=typeof checked.rpe==='number'&&Number.isFinite(checked.rpe)&&checked.rpe>=1&&checked.rpe<=10?'RPE '+checked.rpe:'RPE not entered';
   text+='The last checked set in your *unsaved draft* shows '+reps+' × '+load+' · '+effort+'. ';
  }
  text+='Saved sets and checked draft entries are different evidence. Missing effort and unmarked completion remain unknown. This does not establish progress or authorize a new target; review changes in Decisions.';
  return result(text,[{exercise:found.name,exerciseId:found.exerciseId,date:previous.date,cutoff:pastDay(asOf),unit:unitName,sets:previous.sets.length,confirmed:previous.confirmed,completionUnmarked:previous.unmarked,excluded:previous.excluded}]);
 }
 return {wants,selection,answer};
});
