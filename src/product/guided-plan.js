/* Editable planning structures. This module never prescribes loads or writes training. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./athlete-goals'),require('./programming-profile'),require('./muscle-workload-review'),require('./training-knowledge'));
 else root.LoadnoteGuidedPlan=factory(root.LoadnoteGoals,root.LoadnoteProgrammingProfile,root.LoadnoteMuscleReview,root.LoadnoteTrainingKnowledge);
})(typeof globalThis!=='undefined'?globalThis:this,function(G,P,W,K){
 'use strict';
 const MODES={hypertrophy:'Muscle growth',weightlifting:'Olympic weightlifting',athlete:'Athlete support'};
 const STRUCTURES={
  hypertrophy:{name:'Lower / push / pull',roles:[{id:'lower',label:'Lower-body resistance',kind:'strength',groups:['quadriceps','hamstrings','glutes'],purpose:'Lower-body muscle training within the reviewed workload.'},{id:'push',label:'Upper-body push',kind:'strength',groups:['chest','shoulders'],purpose:'Upper-body pushing muscle training within the reviewed workload.'},{id:'pull',label:'Upper-body pull',kind:'strength',groups:['lats','upper-back'],purpose:'Upper-body pulling muscle training within the reviewed workload.'}]},
  weightlifting:{name:'Technical lift + strength support',roles:[{id:'technical',label:'Technical lift',kind:'weightlifting',purpose:'Coach-reviewed practice of the selected lift and exact variation.'},{id:'support',label:'Strength support',kind:'strength',purpose:'Reviewed strength support, separate from technical attempt outcomes.'}]},
  athlete:{name:'Quality drill + strength support',roles:[{id:'quality',label:'Quality drill',kind:'speed',purpose:'Reviewed sport drill with its own distance, quality and stop protocol.'},{id:'support',label:'Strength support',kind:'strength',purpose:'Reviewed strength support coordinated with sport practice and games.'}]}
 };
 function inspect(state,mode){
  if(!Object.hasOwn(MODES,mode))throw Error('Choose a supported guided plan');
  const profile=P.current(state.programmingProfiles||[])?.context,w=W.current(state.workloadProfiles||[])?.context;
  const goals=G.list(state.athleteGoals||[]).filter(g=>g.status==='active'&&(g.trainingContext.primary===mode||g.trainingContext.secondary.includes(mode))).map(g=>{
   const gaps=[];if(!g.equipment.trim())gaps.push('equipment');if(!g.availableDays.length||!g.sessionMinutes)gaps.push('days and session time');
   if(mode!=='hypertrophy'){if(!g.experience.trim())gaps.push('experience / coaching');if(!g.trainingContext.scheduleKnown||g.trainingContext.season==='unknown')gaps.push('season and practice/game schedule');if(mode==='athlete'&&/^powerlifting$/i.test(g.sport.trim()))gaps.push('actual athlete sport');}
   const protectedDays=mode==='hypertrophy'?[]:g.trainingContext.competitionDays.flatMap(d=>[d,(d+6)%7]);
   const days=g.availableDays.filter(d=>(!profile||profile.availableDays.includes(d))&&!protectedDays.includes(d));
   if(!days.length)gaps.push('available days outside protected game days');
   if(profile?.goal==='return'||profile?.consistency==='returning'||['needs-review','discomfort'].includes(w?.tolerance))gaps.push('individual return/tolerance review');
   return {...g,days,minutes:Math.min(g.sessionMinutes||60,profile?.sessionMinutes||240),gaps};
  });
  const catalog=(state.exerciseCatalog||[]).filter(e=>{try{const m=K.mapping(e.muscles);return m&&!profile?.avoidedExerciseIds.includes(e.id)&&![...m.primary,...m.secondary].some(k=>w?.targets[k]?.restricted);}catch{return false;}});
  const roles=STRUCTURES[mode].roles.map(role=>({...role,choices:catalog.filter(e=>e.muscles.mode===(role.kind==='weightlifting'?'weightlifting':role.kind==='strength'?'resistance':'other')&&(!role.groups||role.groups.some(m=>e.muscles.primary.includes(m)))).sort((a,b)=>Number(profile?.preferredExerciseIds.includes(b.id)||false)-Number(profile?.preferredExerciseIds.includes(a.id)||false)||a.name.localeCompare(b.name)).map(e=>({id:e.id,name:e.name}))}));
  return {mode,name:STRUCTURES[mode].name,goals,roles,readOnly:true};
 }
 function draft(state,{mode,goalId,days,selections,drillKind='speed'}={}){
  const view=inspect(state,mode),goal=view.goals.find(g=>g.id===goalId);if(!goal||goal.gaps.length)throw Error('Complete the matching goal first: '+(goal?.gaps.join(', ')||'active training priority'));
  if(!Array.isArray(days)||!days.length||days.length>6||new Set(days).size!==days.length||days.some(d=>!goal.days.includes(d)))throw Error('Choose 1–6 days within confirmed availability and outside protected days');
  if(!['speed','jump','agility'].includes(drillKind))throw Error('Choose the actual quality drill category');
  const chosen=view.roles.map(r=>{const e=r.choices.find(e=>e.id===selections?.[r.id]);if(!e)throw Error('Choose a confirmed identity for '+r.label);return {exerciseId:e.id,kind:r.id==='quality'?drillKind:r.kind,purpose:'Loadnote starting structure: '+r.purpose};});
  if(new Set(chosen.map(s=>s.exerciseId)).size!==chosen.length)throw Error('Use distinct exercise identities within each training day');
  return {mode,goalId,name:view.name,days:[...days].sort((a,b)=>a-b),minutes:goal.minutes,slots:[...days].sort((a,b)=>a-b).flatMap(day=>chosen.map(s=>({...s,day}))),notice:'Editable Loadnote structure, not a coach-authored or individualized prescription. Review equipment, dose, exact variations and stop rules in the planner. Nothing is saved or scheduled here.'};
 }
 return {MODES,STRUCTURES,inspect,draft};
});
