/* Bounded, session-only references from user turns; assistant text is never evidence. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./exercise-reference'),require('./coach-support'));else root.LoadnoteCoachTurnContext=factory(root.LoadnoteExerciseReference,root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(Reference,Support){
 'use strict';
 const clean=x=>String(x||'').replace(/\s+/g,' ').trim().slice(0,500),words=x=>' '+clean(x).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';
 const short=q=>/^(why|how so|tell me more|explain (that|more)|what about next week|and next week|should i (keep|use) (that|the same) (weight|load)|what about (it|that))\??$/i.test(q);
 function names(state,q){
  const rows=[...(state.exerciseCatalog||[]),...(state.scheduledSessions||[]).flatMap(s=>s.revisions?.at(-1)?.context?.prescription?.plannedExercises||[])],matches=[];
  for(const e of rows)if([e.name,...(e.aliases||[])].some(n=>n&&words(q).includes(words(n))))matches.push(e.name);
  for(const e of Reference.entries)if([e.name,...e.aliases].some(n=>words(q).includes(words(n))))matches.push(e.name);
  const unique=[...new Set(matches)];return unique.filter(n=>!unique.some(other=>other!==n&&words(other).includes(words(n))));
 }
 function seed(state,q){
  if(Support.health(q))return null;const movements=names(state,q);
  if(/\b(explain|why|focus|prepare|what)\b.*\b(next (workout|session)|today.s workout|tomorrow.s workout|next week.s workout|this workout)\b|\b(workout|session)\b.*\b(purpose|focus)\b/i.test(q))return {kind:'workout',question:q,movements};
  const accessories=[...(state.phasePrograms||[]),...(state.meetCycles||[])].flatMap(p=>(p.sessions||[]).flatMap(s=>(s.exercises||[]).filter(e=>e.role==='accessory').map(e=>e.name)));
  if(movements.length&&(/\baccessor\w*\b/i.test(q)||movements.every(m=>accessories.includes(m)))&&/\b(accessor\w*|next time|keep.*(weight|load)|progress\w*|approved (change|target))\b/i.test(q))return {kind:/\b(follow|result|outcome|how did|history|recap)\w*\b/i.test(q)?'follow-up':'accessory',question:q,movements};
  if(movements.length&&/\b(exercise|movement|what is|what's|tell me about|why this)\b/i.test(q))return {kind:'reference',question:q,movements};
  return null;
 }
 function resolve(state,question,history=[]){
  const original=clean(question);let context=null;
  for(const turn of history.slice(-8).filter(r=>r.role==='user')){const q=clean(turn.content);if(short(q)){if(!context)continue;if(/next week/i.test(q))context={...context,kind:'workout',question:"Explain next week's workout"+(context.movements.length===1?' for '+context.movements[0]:'')};}else context=seed(state,q);}
  if(!short(original)||!context)return {question:original,original,follow:false};
  if(context.movements.length>1)return {question:original,original,follow:true,clarification:'Which movement do you mean: '+context.movements.join(', ')+'?'};
  const movement=context.movements[0]||null;
  if(context.kind==='workout'||/next week/i.test(original))return {question:/next week/i.test(original)?"Explain next week's workout"+(movement?' for '+movement:''):context.question,original,follow:true,movement};
  if(!movement)return {question:original,original,follow:false};
  const q=context.kind==='reference'&&!/weight|load/i.test(original)?'Tell me about '+movement:context.kind==='follow-up'?'How did my accessory change work for '+movement:'What should I do next time for '+movement+'?';
  return {question:q,original,follow:true,movement};
 }
 return {resolve,names};
});
