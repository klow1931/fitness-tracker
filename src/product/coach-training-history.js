/* Read-only exercise-history retrieval for the offline Coach.
 * Saved exercise identity and corrected workout history are authoritative.
 * Conversation history supplies a topic only; assistant assertions are never evidence.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./decision-readiness'),require('./coach-support'));
 else root.LoadnoteCoachTrainingHistory=factory(root.LoadnoteReadiness,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Readiness,Support){
 'use strict';
 const clean=q=>String(q||'').replace(/\s+/g,' ').trim().slice(0,500);
 const normalize=q=>clean(q).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const phrase=(q,label)=>(' '+normalize(q)+' ').includes(' '+normalize(label)+' ');
 const historyQuestion=q=>/\b(last|previous|recent|history|historical|compare|comparison|progress|trend|changed|change|performed|performance|logged|past|sessions?|workouts?|volume)\b|how (?:did|has|have).*\b(go|gone|doing|performed|progress)/i.test(q);
 const follow=q=>/^(what about (it|that|last time|the previous (one|workout|session))|and (last time|previous workout)|how did (it|that) go|compare (those|them)|what about [\w\s-]+)\??$/i.test(q);
 function matches(state,q){
  const entries=(state?.exerciseCatalog||[]).filter(e=>e&&e.id!=null&&typeof e.name==='string'&&e.name.trim());
  return entries.filter(e=>[e.name,...(Array.isArray(e.aliases)?e.aliases:[])].some(name=>name&&phrase(q,name)))
   .filter((e,i,list)=>list.findIndex(x=>String(x.id)===String(e.id))===i)
   .sort((a,b)=>b.name.length-a.name.length);
 }
 function context(state,history){
  // A topic change, medical question or new plan must clear pronoun references.
  for(const item of (Array.isArray(history)?history:[]).slice(-8).reverse()){
   if(item.role!=='user')continue;
   const q=clean(item.content);
   if(Support.health(q))return null;
   if(follow(q))continue;
   if(!historyQuestion(q))return null;
   const rows=matches(state,q);return rows.length===1?rows[0]:null;
  }
  return null;
 }
 function resolve(state,question,history=[]){
  const q=clean(question);
  if(!q||Support.health(String(question||''))||/\b(build|create|draft|write|generate|schedule|cancel|delete|replace|swap|prescribe)\b.*\b(plan|program|workout|session|exercise)\b/i.test(q))return null;
  const rows=matches(state,q);
  // A fresh, named exercise can start a history query or continue one.
  const prior=context(state,history),continuation=follow(q)&&!!prior;
  if(!historyQuestion(q)&&!continuation)return null;
  if(!rows.length&&!continuation)return null;
  if(rows.length>1){
   const longest=rows[0];
   const others=rows.filter(e=>normalize(e.name)!==normalize(longest.name)&&!phrase(longest.name,e.name));
   if(others.length)return {clarification:'Which exercise should I review: '+rows.slice(0,5).map(e=>e.name).join(', ')+'?',name:null};
  }
  const row=rows[0]||prior;
  if(!row)return null;
  const competing=(state.exerciseCatalog||[]).filter(e=>e.id!=null&&String(e.id)!==String(row.id)&&normalize(e.name)===normalize(row.name));
  if(competing.length)return {clarification:'Multiple saved exercises share the name '+row.name+'. Review their names in Exercises before comparing recorded work.',name:null};
  // Preserve the established powerlifting lift-specific evidence and mapping rules.
  if((state.exerciseRoles||[]).some(e=>String(e.exerciseId)===String(row.id)&&e.role==='competition'&&e.competitionLift))return null;
  return {exerciseId:String(row.id),name:row.name,aliases:[row.name,...(row.aliases||[])],follow:continuation};
 }
 const done=set=>set&&!set.skipped&&!set.warmup&&set.type!=='warmup'&&set.done!==false&&set.completed!==false;
 const formatWeight=(kg,unit)=>kg==null||kg===''||!Number.isFinite(Number(kg))||Number(kg)<0?'load not recorded':(Math.round(Number(kg)*(unit==='lb'?2.2046226218:1)*10)/10)+' '+unit;
 function inspect(state,selection,{asOf,unit='kg'}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf||''))throw Error('An explicit analysis date is required.');
  const rows=Readiness.workoutsAt(state,asOf,null,true).workouts,entries=(state.exerciseCatalog||[]);
  const nameOwners=entries.filter(e=>e.id!=null&&(selection.aliases||[]).some(alias=>normalize(e.name)===normalize(alias)||Array.isArray(e.aliases)&&e.aliases.some(a=>normalize(a)===normalize(alias))));
  const unambiguous=nameOwners.every(e=>String(e.id)===selection.exerciseId);
  const records=[];
  for(const w of rows){
   const matches=(w.exercises||[]).filter(e=>e&&e.type!=='cardio'&&e.type!=='practice'&&e.trackBy!=='duration'&&
    (e.exerciseId!=null?String(e.exerciseId)===selection.exerciseId:unambiguous&&selection.aliases.some(n=>normalize(e.name)===normalize(n))));
   if(!matches.length)continue;
   let excluded=0,unmarked=0,confirmed=0;const sets=[];
   for(const ex of matches)for(const set of (ex.sets||[])){
    if(!done(set)){excluded++;continue;}
    const n=Number(set.reps),reps=set.reps!==null&&set.reps!==''&&Number.isInteger(n)&&n>0?n:null;
    const weight=formatWeight(set.weight,unit),rpe=Number(set.rpe),effort=set.rpe!=null&&set.rpe!==''&&Number.isFinite(rpe)&&rpe>=1&&rpe<=10?rpe:null;
    if(reps===null&&weight==='load not recorded'){unmarked++;continue;}
    if(set.done===true||set.completed===true)confirmed++;else unmarked++;
    sets.push({reps,weight,rpe:effort});
   }
   records.push({date:w.date,sets,confirmed,unmarked,excluded,sessionId:String(w.id)});
  }
  const ordered=records.filter(r=>r.sets.length).slice(-3).reverse();
  return {exercise:selection.name,asOf,unit,sessions:ordered,totalSessions:records.filter(r=>r.sets.length).length};
 }
 function answer(state,question,{asOf,unit='kg',history=[]}={}){
  const selected=resolve(state,question,history);
  if(!selected)return null;
  if(selected.clarification)return {text:selected.clarification,source:'Recorded exercise history · clarification',readOnly:true,evidence:[],intent:{topic:'exercise-history'}};
  let review;try{review=inspect(state,selected,{asOf,unit});}
  catch{return {text:'I could not validate corrected workout history for '+selected.name+'. Check saved workout data and try again; no training adjustment was made.',source:'Recorded exercise history unavailable',readOnly:true,evidence:[],intent:{topic:'exercise-history',movement:selected.name}};}
  const lines=review.sessions.map(r=>{
   const entries=r.sets.slice(0,6).map(s=>(s.reps===null?'reps not recorded':s.reps+' reps')+' × '+s.weight+' · '+(s.rpe==null?'RPE unknown':'RPE '+s.rpe));
   return r.date+': '+r.sets.length+' recorded set(s) ('+r.confirmed+' explicitly completed, '+r.unmarked+' completion not marked). '+entries.join(' / ')+(r.sets.length>6?' / additional sets omitted from summary':'')+(r.excluded?' '+r.excluded+' skipped, warm-up or explicitly incomplete set(s) excluded.':'');
  });
  const message=lines.length?'Last '+lines.length+' recorded workouts for '+review.exercise+' through '+asOf+' ('+unit+'): '+lines.join('; ')+'. ':'No recorded working sets for '+review.exercise+' were found through '+asOf+'. ';
  return {text:message+'These are saved sets, not approved future targets or a verified strength trend. Unmarked completion and missing RPE stay unknown; compare equivalent reps and effort before interpreting changes. No training load was changed.',source:'Recorded exercise history',readOnly:true,
   evidence:[{exercise:review.exercise,asOf,unit,sessions:review.sessions.map(r=>({date:r.date,sets:r.sets.length,confirmed:r.confirmed,completionUnmarked:r.unmarked,excluded:r.excluded}))}],
   intent:{topic:'exercise-history',movement:review.exercise},followUps:['What about the previous workout?']};
 }
 return {resolve,inspect,answer};
});
