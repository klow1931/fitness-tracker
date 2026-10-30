/* An optional model chooses a name, never arguments, athlete facts or mutations. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));else root.LoadnoteLocalCoachTools=factory(root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const names=Object.freeze(['read_plan','exercise_history','explain_concept','draft_request','program_followthrough','none']);
 function parse(raw){try{const v=JSON.parse(raw);return v&&Object.keys(v).length===1&&names.includes(v.tool)?v.tool:null;}catch{return null;}}
 function execute(raw,state,question,options={}){
  const name=parse(raw);if(!name||name==='none'||Support?.health(question)||['health','urgent-support'].includes(Support?.kind(question)))return null;
  const get=(file,global)=>typeof module==='object'&&module.exports?require('./'+file):globalThis[global];
  // Only fixed retrieval intent is added; original athlete text supplies all request values. Each tool
  // preserves its own identity, chronology, missing-data and prescription checks.
  const handlers={
   read_plan:()=>get('coach-conversation','LoadnoteCoachConversation').answer(state,question+' What should I train today?',options),
   exercise_history:()=>get('coach-training-history','LoadnoteCoachTrainingHistory').answer(state,'Show recorded exercise history. '+question,options),
   explain_concept:()=>get('coaching-library','LoadnoteCoachingLibrary').answer(state,question,options),
   program_followthrough:()=>get('coach-followthrough','LoadnoteCoachFollowthrough').answer(state,'Is my program working? '+question,options),
   draft_request:()=>get('offline-planner','LoadnoteOfflinePlanner').answer(state,question,options)
  };
  try{const reply=handlers[name]();return reply?.readOnly===true?reply:null;}catch{return null;}
 }
 return {names,parse,execute};
});
