/* Read-only exercise questions; references are refreshed from the current turn. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./exercise-reference'),require('./programming-profile'));
 else root.LoadnoteExerciseExplanation=factory(root.LoadnoteExerciseReference,root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(Reference,Profile){
 'use strict';
 function named(q){
  const text=String(q||'').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ');
  const matches=Reference.entries.filter(e=>[e.name,...e.aliases].some(n=>text.includes(n.toLowerCase().replace(/[-_]/g,' '))));
  const specific=matches.filter(e=>!matches.some(other=>other!==e&&other.name.toLowerCase().includes(e.name.toLowerCase())));
  return specific.length===1?specific[0]:null;
 }
 function answer(state,question,{history=[],live=null,intelligence=null}={}){
  const q=String(question||'').trim();
  if(/\b(occupied|busy|unavailable|replace|swap|substitut)\w*\b/i.test(q))return null; // Existing reviewed-session workflow owns constraint/change requests.
  if(/\b(training max|1rm|benchmark|progress|increase|add weight|rpe|phase|why.*set|why.*load|why.*weight)\b/i.test(q))return null;
  if(!/\b(exercise|movement|equipment|tools|alternative|instead|substitut|swap|why this|what is|what's|tell me about|what else|only dumbbells|only bodyweight)\w*\b/i.test(q))return null;
  let e=named(q),current=live?.liveWorkout?.currentExercise||null,contextual=false;
  if(!e&&/\b(this|current)\b/i.test(q)&&current?.name){e=Reference.resolve(current.name);contextual=true;}
  if(!e&&/\b(it|that|instead|alternative|what else|only dumbbells|only bodyweight)\w*\b/i.test(q)){
   const prior=history.filter(r=>r.role==='user').at(-1);
   const Support=typeof module==='object'&&module.exports?require('./coach-support'):globalThis.LoadnoteCoachSupport;
   if(Support?.health(prior?.content||''))return {text:'I can explain movement roles, but cannot choose a substitute to treat pain or an injury. Review that constraint with a qualified clinician.',source:'Capability limit',evidence:[],readOnly:true};
   e=named(prior?.content);
   if(!e&&/\b(this|current)\b/i.test(prior?.content||'')&&current?.name){e=Reference.resolve(current.name);contextual=true;}
  }
  const result=text=>({text,source:'Shared exercise reference',evidence:[],readOnly:true});
  if(!e)return /\b(exercise|movement|equipment)\w*\b/i.test(q)?result('Which exact movement do you mean? Name it, or open the workout and ask about the current exercise.'):null;
  const p=Profile.current(state.programmingProfiles||[])?.context;
  const parts=[Reference.explain(e.name)];
  if(contextual){
   const plan=intelligence?.session?.plannedExercise,goal=intelligence?.session?.goal;
   if(plan?.name===current.name&&plan.purpose)parts.push('Reviewed movement purpose: '+plan.purpose+'.');
   else if(goal)parts.push('Reviewed session goal: '+goal+'.');
   else parts.push('The saved plan does not explain why this movement was selected.');
   const rows=live?.liveWorkout?.exercises||[],row=rows[current.index];
   if(row?.name===current.name&&row.totalSets>0)parts.push(row.completedSets+' of '+row.totalSets+' sets marked complete. Keep logging actual effort so your review has usable evidence.');
  }
  if(/\b(alternative|instead|substitut|swap|what else|only dumbbells|only bodyweight)\w*\b/i.test(q)){
   const tools=/only dumbbells/i.test(q)?['dumbbells']:/only bodyweight/i.test(q)?['bodyweight']:p?.accessoryEquipment;
   const avoided=new Set(p?.avoidedExerciseIds||[]),options=Reference.alternatives(e.name,tools).filter(t=>!state.exerciseCatalog?.some(c=>avoided.has(c.id)&&[c.name,...(c.aliases||[])].some(n=>Reference.resolve(n)?.key===t.key)));
   parts.push(options.length?'Options to review for the same workload group: '+options.slice(0,3).map(t=>t.name+' ('+Reference.EQUIPMENT[t.equipment]+')').join(', ')+'.':'No supported alternative matches the saved equipment and exclusions.');
   if(!p?.accessoryEquipment)parts.push('Accessory equipment availability is not recorded; confirm access before choosing.');
   parts.push('These are not equivalent prescriptions. Review purpose, tracking, effort and a separate starting load. I have not changed the workout.');
  }
  return result(parts.join(' '));
 }
 return {answer,named};
});
