/* v4.4 — session-only communication follow-ups over canonical Coach answers.
 * Only athlete questions provide a referent. Answers and model text never
 * provide evidence. All personal facts are recomputed by existing engines.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachDialogue=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clean=x=>String(x??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const brief=/^(?:can you (?:say|put|explain) (?:that|it) (?:more )?(?:simply|clearly|in plain english)|(?:could you |can you )?break (?:that|it) down|(?:i (?:didn't|did not) (?:follow|understand) (?:that|it)[,.]? )?(?:can you )?(?:simplify (?:that|it)|explain (?:that|it) (?:more )?simply)|(?:give me |what(?:'s| is) )(?:the )?(?:short version|quick takeaway|main takeaway|bottom line)|(?:what does (?:that|it) (?:actually )?mean|in plain english|short version|tl;?dr))[.!?]*$/i;
 const detail=/^(?:can you )?(?:go (?:a bit |into )?(?:more )?detail|expand on (?:that|it)|tell me more about (?:that|it)|explain (?:that|it) in (?:more )?detail|give me (?:more )?context)[.!?]*$/i;
 const reset=/^(?:hello|hi|hey|thanks|thank you|start over|new topic|forget that|change (?:the )?subject)[.!?]*$/i;
 const knownRoot=/\b(?:how (?:is|has|did) my (?:bench|squat|deadlift)|why (?:has|is) my (?:bench|squat|deadlift)|training recap|summari[sz]e my training|my recent training|how did (?:my |this |last )?week go|weekly (?:review|training)|explain (?:my |the )?(?:next|today'?s|tomorrow'?s) (?:workout|session)|what is my (?:bench|squat|deadlift) training max|what happened after my last (?:bench|squat|deadlift) change|what have we learned from my (?:training|program) changes)\b/i;
 const sensitive=q=>/\b(?:pain|hurt|injur\w*|diagnos\w*|numb\w*|suicid\w*|kill myself|self.harm|achilles|chest (?:pressure|tightness|discomfort)|can't breathe|cannot breathe)\b/i.test(q);
 const mode=q=>brief.test(clean(q))?'brief':detail.test(clean(q))?'detail':null;
 function request(question,history=[]){
  const m=mode(question);
  if(!m||sensitive(String(question??'')))return null;
  const recent=(Array.isArray(history)?history:[]).slice(-8);
  let hops=0;
  for(let i=recent.length-1;i>=0;i--){
   const row=recent[i];if(row?.role!=='user')continue;
   const text=clean(row.content);
   if(!text||reset.test(text)||sensitive(String(row.content)))return null;
   if(mode(text)){if(++hops>2)return null;continue;}
   // Do not convert a compound request into a one-topic summary.
   if(!knownRoot.test(text)||/\b(?:and|plus)\b.{0,80}\b(?:next (?:workout|session)|weekly|training recap|summari[sz]e)\b/i.test(text))return null;
   return {mode:m,anchor:text,history:recent.slice(0,i),follow:true};
  }
  return null;
 }
 function present(reply,plan){
  if(!reply||typeof reply.text!=='string'||reply.readOnly!==true||!plan)return reply;
  // Preserve all links, full evidence objects, and vetted actions.
  const meta={...reply,intent:{...(reply.intent||{}),communication:{mode:plan.mode,follow:true}}};
  if(plan.mode==='detail')return {...meta,text:'Here is the full explanation from your current training records:\n\n'+reply.text};
  const clarity=reply.clarity;
  if(clarity&&['happened','meaning','next'].every(k=>typeof clarity[k]==='string'&&clarity[k].trim())){
   return {...meta,text:'Here is the short version from your saved training:\n\n'+clarity.happened+'\n\n'+clarity.meaning+'\n\nNext: '+clarity.next+'\n\nThis describes recorded evidence, not an automatic training change.'};
  }
  const card=(reply.evidenceCards||[]).find(c=>c&&['observed','limited','unavailable'].includes(c.status)&&typeof c.observed==='string'&&typeof c.limitation==='string'&&c.source);
  if(card)return {...meta,text:'Here is the main point from the recorded evidence:\n\n'+card.observed+'\n\nLimit: '+card.limitation+'\nSource: '+card.source+'. The current training plan is unchanged.'};
  // Do not truncate a validated technical answer and silently drop caveats.
  return {...meta,text:reply.text,communicationNotice:'A shorter supported evidence summary is not available for this topic.'};
 }
 return {request,present,mode};
});
