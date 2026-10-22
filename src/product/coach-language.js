/* v3.87 — bounded multi-turn context, explicit corrections and dialogue follow-ups.
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
 // A short topic switch or correction must name the new lift. Elliptical
 // explanations stay limited to verified accepted decisions and outcomes.
 const switchLift=q=>/^(?:(?:and|what about|how about|now)\s+)(?:my |the )?(squat|bench|deadlift)(?: press)?(?: instead)?\s*[?.!]*$/i.exec(q);
 const correctLift=q=>/^(?:(?:actually|sorry|no),?\s*)?(?:i meant|i mean|make that)\s+(?:my |the )?(squat|bench|deadlift)(?: press)?(?: instead)?\s*[?.!]*$/i.exec(q)||
  /^(?:actually|sorry|no),?\s+(?:my |the )?(squat|bench|deadlift)(?: press)?(?: instead)?\s*[?.!]*$/i.exec(q);
 const outcomeFollow=q=>/^(?:did that (?:help|work)|did it (?:help|work)|what happened afterwards?|what happened after that)\s*[?.!]*$/i.test(q);
 const rationaleFollow=q=>/^(?:why was (?:that|it) approved|why was that change made)\s*[?.!]*$/i.test(q);
 const phrasing=(kind,lift)=>{
  if(kind==='rationale')return 'Why did Loadnote change my '+lift+'?';
  if(kind==='outcome')return 'What happened after my last '+lift+' change?';
  if(kind==='history')return 'How did my '+lift+' training change across my last three workouts?';
  if(kind==='training-max')return 'What is my '+lift+' training max?';
  if(kind==='progress')return 'How is my '+lift+' progress?';
  return null;
 };
 function advance(prior,question){
  if(!prior)return null;
  const pivot=switchLift(question)||correctLift(question);
  if(pivot)return {...prior,lift:pivot[1].toLowerCase()};
  if(outcomeFollow(question)&&prior.kind==='rationale')return {...prior,kind:'outcome'};
  if(rationaleFollow(question)&&prior.kind==='outcome')return {...prior,kind:'rationale'};
  return null;
 }
 // Walk only eight recent message rows, accepting user questions as context
 // but never assistant claims. An unrelated topic or safety report resets.
 // Three short replies is the maximum between complete training questions.
 function fromHistory(history){
  let prior=null,hops=0;
  const recent=(Array.isArray(history)?history:[]).slice(-8);
  for(const row of recent){
   if(row?.role!=='user')continue;
   const raw=String(row.content??'');
   if(!raw.trim()||unsafe(raw)){prior=null;hops=0;continue;}
   const q=normalize(raw),root=priorKind(q);
   if(root){prior=root;hops=0;continue;}
   const next=hops<3?advance(prior,q):null;
   if(next){prior=next;hops++;}else{prior=null;hops=0;}
  }
  return prior;
 }
 function interpret(question,history=[]){
  const original=clean(question);
  if(!original||unsafe(String(question??'')))return {question:original,changed:false,reason:'safety-or-empty'};
  const normalized=normalize(original),prior=fromHistory(history),next=advance(prior,normalized);
  const resolved=next?phrasing(next.kind,next.lift):normalized;
  const reason=next?(switchLift(normalized)?'explicit-lift-follow-up':correctLift(normalized)?'explicit-correction':outcomeFollow(normalized)?'approved-change-follow-up':'original-approval-follow-up'):'vocabulary';
  return {question:resolved,changed:resolved!==original,reason};
 }
 return {normalize,onlyLift,priorKind,interpret};
});