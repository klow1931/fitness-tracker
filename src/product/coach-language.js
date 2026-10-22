/* v3.86 — bounded linguistic aliases and user-only conversational references.
 * Every interpretation is revalidated by existing offline coaching evidence routes.
 * No training, preferences or conversation is written to persistent storage.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));
 else root.LoadnoteCoachLanguage=factory(root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const clean=s=>String(s??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const unsafe=q=>Support?.health(q)||['health','urgent-support'].includes(Support?.kind(q));
 // Explicit typo/alias list, not approximate matching across arbitrary words.
 const aliases=[
  [/\bsqaunts?\b/gi,'squat'],[/\bsqauds?\b/gi,'squat'],[/\bsquats\b/gi,'squat'],
  [/\bbnech\b/gi,'bench'],[/\bbech\b/gi,'bench'],[/\bbenches\b/gi,'bench'],
  [/\bbenchpress\b/gi,'bench press'],[/\bdeadifts?\b/gi,'deadlift'],
  [/\bdeadlifts\b/gi,'deadlift'],[/\bdeads\b/gi,'deadlift'],
  [/\bprogres\b/gi,'progress'],[/\bprogresss\b/gi,'progress']
 ];
 const lifts=['squat','bench','deadlift'];
 function onlyLift(q){const found=lifts.filter(l=>new RegExp('\\b'+l+'\\b','i').test(q));return found.length===1?found[0]:null;}
 function normalize(question){
  let q=clean(question);
  if(!q||unsafe(q))return q;
  for(const [pattern,value] of aliases)q=q.replace(pattern,value);
  q=q.replace(/^hows my\b/i,'how is my').replace(/^how's my\b/i,'how is my');
  const lift=onlyLift(q);
  if(lift){
   const simple=new RegExp('^(?:how is my|how am i doing (?:on|with)(?: my)?|is my)\\s+'+lift+
    '(?: press)?(?: (?:doing|looking|going|coming along|progress|progressing|improving|getting better|getting stronger))?[?.!]*$','i');
   if(simple.test(q))return 'How is my '+lift+' progress?';
  }
  return q;
 }
 // A previous athlete question supplies only the topic and named lift.
 // Assistant text, unrelated turns, symptom turns and guesses are excluded.
 function priorKind(question){
  const q=normalize(question),lift=onlyLift(q);
  if(!lift||unsafe(q))return null;
  if(/\b(?:why|reason|explain)\b/i.test(q)&&
     (/\bloadnote\b.*\b(?:change|changed|adjust|adjusted)\b/i.test(q)||
      /\bapproved\b.*\b(?:change|changed|adjustment|load|reduced|increased)\b/i.test(q)))
   return {kind:'rationale',lift};
  if(/\bwhat happened after my last\b.*\bchange\b/i.test(q))return {kind:'outcome',lift};
  if(/\bhow did my\b.*\btraining change across my last three workouts\b/i.test(q))return {kind:'history',lift};
  if(/\btraining max\b/i.test(q)&&/\b(?:what|explain|show|my)\b/i.test(q))return {kind:'training-max',lift};
  if(/\b(?:progress|improving|progressing)\b/i.test(q)&&/\b(?:how|is my|am i doing)\b/i.test(q))return {kind:'progress',lift};
  return null;
 }
 const switchLift=q=>/^(?:(?:and|what about)\s+)(?:my |the )?(squat|bench|deadlift)(?: press)?\s*[?.!]*$/i.exec(q);
 const outcomeFollow=q=>/^(?:did that (?:help|work)|did it (?:help|work)|what happened afterwards?|what happened after that)\s*[?.!]*$/i.test(q);
 function interpret(question,history=[]){
  const original=clean(question);
  if(!original||unsafe(String(question??'')))return {question:original,changed:false,reason:'safety-or-empty'};
  const normalized=normalize(original);
  const users=(Array.isArray(history)?history:[]).slice(-8).filter(row=>row?.role==='user'&&typeof row.content==='string');
  let prior=users.length?priorKind(users.at(-1).content):null;
  // Support exactly one explicitly named follow-up after a grounded question.
  if(!prior&&users.length>=2&&switchLift(normalize(users.at(-1).content))){
   const ancestor=priorKind(users.at(-2).content);
   if(ancestor)prior={...ancestor,lift:onlyLift(normalize(users.at(-1).content))};
  }
  const pivot=switchLift(normalized);
  let resolved=normalized,reason='vocabulary';
  if(pivot&&prior){
   const lift=pivot[1].toLowerCase();
   if(prior.kind==='rationale')resolved='Why did Loadnote change my '+lift+'?';
   if(prior.kind==='outcome')resolved='What happened after my last '+lift+' change?';
   if(prior.kind==='history')resolved='How did my '+lift+' training change across my last three workouts?';
   if(prior.kind==='training-max')resolved='What is my '+lift+' training max?';
   if(prior.kind==='progress')resolved='How is my '+lift+' progress?';
   reason='explicit-lift-follow-up';
  }else if(outcomeFollow(normalized)&&prior?.kind==='rationale'){
   resolved='What happened after my last '+prior.lift+' change?';
   reason='approved-change-follow-up';
  }
  return {question:resolved,changed:resolved!==original,reason};
 }
 return {normalize,onlyLift,priorKind,interpret};
});