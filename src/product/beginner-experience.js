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
 const steps=[
  {title:'1. Choose your exercise',body:'Add an exercise you plan to do, or use a template. You do not need a program or a one-rep max to keep a workout log.'},
  {title:'2. Record what you actually did',body:'Targets are the plan, not proof of completed work. Enter your actual weight and reps (or duration). RPE means effort on a 1–10 scale; leave it blank if you are unsure. Never guess a max just to get started.'},
  {title:'3. Complete work, then rest',body:'For a planned workout, mark only the sets or cardio you actually completed as done. Unfinished planned work is not saved as completed. In an empty workout, entered actuals can be saved without the checklist. Rest controls are optional; check the timer before continuing.'},
  {title:'4. Review, then save',body:'Choose Review workout (or Finish). Check the date, exercises and actual work, then choose Save workout in the review. Opening review does not save. Wait for the saved confirmation; if saving fails, keep this page open and retry.'}
 ];
 return {KEY,normalize,read,write,steps};
});
