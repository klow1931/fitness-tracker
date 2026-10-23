/* Device-local presentation preferences. Never modifies athlete or workout data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LoadnoteBeginnerExperience=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='loadnote.experience.v1';
 function normalize(value){
  const v=value&&typeof value==='object'?value:{};
  return {view:v.view==='simple'?'simple':'full',entry:['help','program','log'].includes(v.entry)?v.entry:null,
   guide:['active','skipped','complete'].includes(v.guide)?v.guide:'active',step:Number.isInteger(v.step)?Math.max(0,Math.min(3,v.step)):0};
 }
 function read(storage){try{return normalize(JSON.parse(storage.getItem(KEY)));}catch{return normalize();}}
 function write(storage,current,patch){
  const next=normalize({...current,...patch});
  storage.setItem(KEY,JSON.stringify(next));
  return next;
 }
 // Only new users without saved training or an explicit setting start Simple.
 function isNewAthlete(state){
  const s=state&&typeof state==='object'?state:{};
  if(s.onboardingDismissed)return false;
  return !['workouts','programmingProfiles','reviewedPrograms','phasePrograms',
   'meetCycles','programs','sportPrograms','customPrograms','scheduledSessions',
   'trainingBlocks'].some(key=>Array.isArray(s[key])&&s[key].length>0);
 }
 // Visual-only milestones: these do not complete a set or persist a workout.
 function guideStage({namedExercise=false,enteredSet=false,reviewOpen=false}={}){
  return reviewOpen?3:!namedExercise?0:!enteredSet?1:2;
 }
 const steps=[
  {title:'1. Choose your exercise',body:'Add an exercise you plan to do, or use a template. You do not need a program or a one-rep max to keep a workout log.'},
  {title:'2. Record what you actually did',body:'Targets are the plan, not proof of completed work. Enter your actual weight and reps (or duration). RPE means effort on a 1–10 scale; leave it blank if you are unsure. Never guess a max just to get started.'},
  {title:'3. Review the work you did',body:'When finished, choose Review workout or Finish. For planned sessions, mark only the work you completed as done. Rest controls are optional. Opening review does not save anything.'},
  {title:'4. Review, then save',body:'Choose Review workout (or Finish). Check the date, exercises and actual work, then choose Save workout in the review. Opening review does not save. Wait for the saved confirmation; if saving fails, keep this page open and retry.'}
 ];
 return {KEY,normalize,read,write,steps,isNewAthlete,guideStage};
});
