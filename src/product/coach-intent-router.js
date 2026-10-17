/* v3.44: deterministic intent and bounded, session-only referents.
 * This is a read-only router, not an LLM, medical triage, or program engine.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));
 else root.LoadnoteCoachIntentRouter=factory(root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const clean=q=>String(q??'').replace(/\s+/g,' ').trim().slice(0,500);
 const lift=q=>/\b(bench(?: press)?|pressing)\b/i.test(q)?'bench':/\b(deadlift|sumo)\b/i.test(q)?'deadlift':/\bsquat(?:ting)?\b/i.test(q)?'squat':null;
 const plan=q=>/\b(build|create|write|make|design|generate|draft)\b.*\b(program|plan|routine|workout|session)\b|\b(workout|session) for (today|tomorrow)\b/i.test(q)||/\b(help me|can you|could you|i would like|i'd like)\b.*\b(draft|build|create|plan|program|workout|routine)\b/i.test(q)&&!/\b(explain|understand|what|why|how)\b/i.test(q);
 const topic=q=>/\b(progress|stall|plateau)\b|\bhow (?:is|has|did) (?:my )?training\b/i.test(q)?'progress':/\b(weekly|this week|last week)\b/i.test(q)?'weekly':/\b(phase|periodization|mesocycle)\b/i.test(q)?'program':/\b(rpe|effort)\b/i.test(q)?'effort':/\b(gear|equipment|available days|training setup)\b/i.test(q)?'profile':null;
 const follow=q=>/^(why|how so|explain that|tell me more|what about (it|that)|and (the|my) (bench|squat|deadlift)|why is (it|that) (?:stalled|harder)|what changed\??)\??$/i.test(q);
 function classify(question,history=[]){
  const original=String(question??''),q=clean(original);
  if(Support?.kind(original)==='urgent-support'||Support?.health(original))return {kind:'safety',question:q,reason:'Safety questions retain priority over training routing.',lift:null};
  if(!q)return {kind:'clarify',question:q,reason:'Ask a training question.',lift:null};
  if(plan(q))return {kind:'draft',question:q,reason:'Use the existing reviewed draft builder; never save from chat.',lift:lift(q)};
  if(/\b(what can you do|what can (?:the )?offline coach do|how can (?:the )?offline coach help|help me get started|how can you help)\b/i.test(q))return {kind:'capabilities',question:q,reason:'Describe only implemented offline capabilities.',lift:null};
  const historyRows=(Array.isArray(history)?history:[]).slice(-8).filter(x=>x?.role==='user');
  const last=historyRows.at(-1),previous=clean(last?.content);
  const priorLift=lift(previous),sameTopic=previous&&!/^(hello|hi|hey|thanks|thank you)\b/i.test(previous)&&!/\b(injury|pain|diagnos|unrelated|nutrition)\b/i.test(previous);
  if(follow(q)&&sameTopic&&priorLift&&!lift(q))return {kind:'follow-up',question:q,lift:priorLift,referenceQuestion:previous,reason:'Only the most recent named athlete question supplies a lift; prior assistant messages are not evidence.'};
  if(follow(q)&&!lift(q))return {kind:'clarify',question:q,lift:null,reason:'Which lift or topic do you mean? I will not guess from old conversation.'};
  return {kind:topic(q)||'general',question:q,lift:lift(q),reason:'Resolve this turn against current stored training evidence.'};
 }
 function capabilities(){
  return {text:'Offline, I can explain your saved training, compare recorded sets and RPE, review the next planned workout, examine completed weeks and help you draft a workout or program for athlete approval. Ask, for example, “How did my bench go?”, “Explain next week’s workout” or “Draft a 3-day strength program”. I do not diagnose injuries, invent missing loads or change future sessions without the reviewed Decisions workflow.',
   source:'Offline Coach · available capabilities',readOnly:true,evidence:[],followUps:['Explain my next workout','How did this week go?','Build a strength program']};
 }
 return {classify,capabilities};
});
