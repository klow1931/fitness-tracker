/* Athlete-specific offline context from reviewed, saved training preferences.
 * Chat history only resolves follow-up topics; no inferred memories or medical claims.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./coach-support'));
 else root.LoadnoteCoachTrainingProfile=factory(root.LoadnoteProgrammingProfile,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Support){
 'use strict';
 const clean=q=>String(q||'').trim().replace(/\s+/g,' ').slice(0,500);
 const contextQuestion=q=>/\b(what|which|show|tell|know|remember|remind)\b.*\b(my|about my|for me)\b.*\b(training setup|training preferences|goal|equipment|available days|training days|schedule|preferences|exclusions|session time|preferred exercises|avoided exercises)\b|\b(my|athlete) (profile|training setup|preferences)\b|\b(what equipment|which equipment|my available days|my training goal|what.*know about my training)\b/i.test(q);
 const specific=q=>/\b(equipment|available days|schedule|session time|session length|goals?|training setup|preferences|exclusions|avoided exercises|preferred exercises)\b/i.test(q);
 const follow=q=>/^(and|what about) (my |the )?(equipment|goals?|schedule|training days|available days|exclusions|preferred exercises|session time)\??$/i.test(q);
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 function answer(state,question,{asOf,history=[]}={}){
  const q=clean(question);
  if(!q||Support.health(String(question||'')))return null;
  // Dedicated movement-reference and sport-goal tools take precedence.
  // Saved Profile equipment is not the equipment needed for an exercise.
  if(/\bequipment\s+(?:for|needed for|used for)\b/i.test(q)||/\b(?:review|analyse|analyze|compare|evaluate)\b.*\b(?:sport|training)\s+goal\b/i.test(q))return null;
  let requested=contextQuestion(q);
  if(!requested&&follow(q)){
   for(const turn of (Array.isArray(history)?history:[]).slice(-8).reverse()){
    if(turn.role!=='user')continue;
    const prior=clean(turn.content);
    if(Support.health(prior))break;
    if(contextQuestion(prior)){requested=true;break;}
    if(!follow(prior))break;
   }
  }
  if(!requested)return null;
  let record;try{record=Profile.current(state.programmingProfiles||[],asOf?asOf+'T23:59:59.999Z':undefined);}
  catch{return {text:'I could not validate the saved training setup. Open Profile to review it; I will not guess your preferences.',source:'Saved training preferences unavailable',readOnly:true,evidence:[],intent:{topic:'training-preferences'}};}
  const p=record?.context;
  if(!p)return {text:'You have not completed a saved training setup yet. Open Profile → Training setup to record your goals, available days and equipment. I cannot infer preferences from chat or past workouts.',source:'Saved training preferences',readOnly:true,evidence:[],intent:{topic:'training-preferences'}};
  const goal=Profile.GOALS?.[p.goal]||'Not confirmed';
  const schedule=Array.isArray(p.availableDays)?p.availableDays.map(i=>days[i]).filter(Boolean):[];
  const equipment=Array.isArray(p.equipment)?p.equipment.filter(x=>typeof x==='string').slice(0,12):[];
  const catalog=state.exerciseCatalog||[];
  const names=ids=>(Array.isArray(ids)?ids:[]).slice(0,8).map(id=>catalog.find(e=>e.id===id)?.name||'Unmapped exercise').join(', ');
  const sections={
   goal:'Saved goal: '+goal+'. Experience: '+(p.experience||'not confirmed')+'.',
   schedule:'Saved training days: '+(schedule.join(', ')||'not confirmed')+'. Time per session: '+(Number.isFinite(p.sessionMinutes)?p.sessionMinutes+' minutes':'not confirmed')+'.',
   equipment:'Saved equipment: '+(equipment.join(', ')||'none confirmed')+'.',
   exercises:'Preferred movements: '+(names(p.preferredExerciseIds)||'none confirmed')+'. Excluded movements: '+(names(p.avoidedExerciseIds)||'none confirmed')+'.'
  };
  const ask=q.toLowerCase();
  const rows=/\b(equipment)\b/.test(ask)?[sections.equipment]:/\b(exclusion|avoid|preferred exercise)\b/.test(ask)?[sections.exercises]:/\b(schedule|days|availability|session time|session length)\b/.test(ask)?[sections.schedule]:/\bgoal\b/.test(ask)?[sections.goal]:Object.values(sections);
  return {text:rows.join(' ')+' These are your saved training preferences, not a diagnosis or a memory of unsaved conversations. Update them in Profile before planning a new program.',source:'Saved training preferences',readOnly:true,
   evidence:[{goal:p.goal,experience:p.experience,availableDays:schedule,sessionMinutes:p.sessionMinutes,equipment,preferred:names(p.preferredExerciseIds),excluded:names(p.avoidedExerciseIds)}],
   intent:{topic:'training-preferences'}};
 }
 return {answer};
});
