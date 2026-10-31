/* Offline reflection across everyday topics. No generated factual answers,
 * silent memory, diagnosis, inferred emotions, or writes. User turns alone
 * supply the temporary problem/goal/options/next-step workspace.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'),require('./coach-understanding'));else root.LoadnoteCoachOpenDialogue=factory(root.LoadnoteCoachSupport,root.LoadnoteCoachUnderstanding);})(typeof globalThis!=='undefined'?globalThis:this,function(Support,Understanding){
 'use strict';
 const clean=q=>String(q??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const reset=q=>/^(?:start over|new topic|forget (?:that|this)|stop (?:chatting|talking)|back to training|thanks|thank you|hello|hi|hey)[.!?]*$/i.test(q);
 const entry=q=>/\b(?:let'?s|let us) talk (?:it|this) through\b|\b(?:just want to talk|just (?:need|want) to vent|help me think (?:through|about)|sounding board|talk about my day)\b/i.test(q);
 const sensitive=q=>Support.health(q)||Support.kind(q)==='urgent-support'||/\b(?:medication|therapy|therapist|diagnosis|abuse|eating disorder|self.harm|depress\w*)\b/i.test(q);
 // An explicit factual or app request exits reflection, even during an active
 // workspace. It is never answered by reflecting an unrelated old statement.
 const factual=q=>/^(?:who|when|where|what (?:is|are|was|were|does|did)|how (?:is|are|has|did|many|much|long|does|do)|why (?:is|are|does|did))\b/i.test(q)&&!/\b(?:my options|my next step|do i (?:decide|choose|start))\b/i.test(q);
 const tool=q=>/\b(?:rpe|rir|training max|sets?|reps?|rest timer|sources|research|evidence|logged|recorded|plateau|progress|history)\b|\b(?:build|create|draft|save|delete|cancel|change|schedule|review|explain)\b.{0,50}\b(?:workout|program|plan|training|preference|equipment)\b/i.test(q)||/\b(?:bench|squat|deadlift)\b/i.test(q)&&/^(?:how|what|why|explain|show|review)\b/i.test(q);
 const summary=q=>/^(?:summari[sz]e (?:that|this|our conversation|what i said)|(?:give me )?(?:a )?recap|what have i said so far|short version)[.!?]*$/i.test(q);
 const repair=q=>/^(?:that(?:'s| is) not what i meant|you misunderstood|that doesn.t help|i (?:already )?tried that)[.!?]*$/i.test(q);
 const control=q=>summary(q)||repair(q)||/^(?:tell me more|why|what next|what should i do|what do you think|i don't know|not sure|yes|no)[.!?]*$/i.test(q);
 const listening=q=>/\b(?:just listen|no advice|only vent|rather vent|just (?:(?:want|need) to )?vent|don't (?:give|want) advice)\b/i.test(q);
 function root(q){if(entry(q))return 'reflection';const h=Understanding.classify(q);return h.accepted&&['reflection','habit'].includes(h.intent)?h.intent:null;}
 function advance(c,q){
  if(!c)return null;
  if(listening(q))return {...c,listening:true};
  if(/\b(?:help me decide|ready for advice|think through options)\b/i.test(q))return {...c,listening:false};
  if(control(q))return {...c,repair:repair(q)};
  const correction=/^(?:actually|no,? i meant|instead|correction)[,:]?\s*/i.test(q);
  if(c.listening&&c.situation&&!correction)return {...c,latest:q,notes:[...(c.notes||[]),q].slice(-4),repair:false};
  const field=correction?c.lastField||'situation':!c.situation?'situation':!c.goal?'goal':!c.options?'options':!c.step?'step':'obstacle';
  return {...c,[field]:q,latest:q,lastField:field,repair:false};
 }
 function context(history=[]){
  let c=null;
  for(const row of (Array.isArray(history)?history:[]).slice(-24)){
   if(row?.role!=='user')continue;const q=clean(row.content);
   if(!q||reset(q)||sensitive(String(row.content))||tool(q)){c=null;continue;}
   const topic=root(q);
   if(topic&&(!c||entry(q))){c={topic,listening:listening(q),situation:entry(q)?null:q};continue;}
   if(!c)continue;
   if(factual(q)){c=null;continue;}
   c=advance(c,q);
  }
  return c;
 }
 const quote=q=>'“'+clean(q).slice(0,220)+'”';
 function answer(question,{history=[]}={}){
  const q=clean(question);
  if(!q||reset(q)||sensitive(String(question??''))||tool(q))return null;
  const prior=context(history),topic=root(q);
  if(!topic&&!prior)return null;
  if(!topic&&factual(q))return null;
  const c=topic&&(!prior||entry(q))?{topic,listening:listening(q),situation:entry(q)?null:q}:advance(prior,q);
  let text,detail;
  if(summary(q)){
   const rows=[['Situation',c.situation],['Desired outcome',c.goal],['Options you named',c.options],['Step you named',c.step],['Possible obstacle you named',c.obstacle]].filter(([,v])=>v);
   for(const note of c.notes||[])rows.push(['Other things you said',note]);
   text=rows.length?'Here is what you said in this conversation:\n'+rows.map(([k,v])=>k+': '+quote(v)).join('\n'):'You have asked to talk, but have not described the situation yet.';
   text+='\nThese are your statements, not verified facts or saved preferences. What would you like to revise?';
  }else if(repair(q))text='Let’s set my last suggestion aside. What did I miss about what you need?';
  else if(c.listening)text=(c.latest||c.situation?'You said '+quote(c.latest||c.situation)+'. ':'')+'We can stay with what you want to share, without turning it into an action plan. What would you like to say next?';
  else if(!c.situation)text='We can talk about your day, a decision, or something on your mind. Would you like to vent, reflect, or work through a choice?';
  else if(!c.goal)text=(c.topic==='habit'?'We can work toward a routine that fits your life. ':'You said '+quote(c.situation)+'. ')+'What would a useful outcome look like for you?';
  else if(!c.options)text='The outcome you named is '+quote(c.goal)+'. What options are you considering, including leaving things as they are?';
  else if(!c.step)text='You named these possibilities: '+quote(c.options)+'. Which fits your stated outcome best, and what is one manageable first step?';
  else if(!c.obstacle)text='The step you named is '+quote(c.step)+'. What might get in the way, and how would you want to handle it?';
  else text='You have outlined an outcome, options, a step, and a possible obstacle. Would you like a recap, or to reconsider one part?';
  detail=text+'\n\nThis workspace lasts only for this conversation. You can correct what you said, ask for a recap, say “just listen,” or return to a training question at any time.';
  return {text,variants:{brief:text,standard:text,detail},supportive:true,openDialogue:true,readOnly:true,evidence:[],source:'Shared coaching · talk it through',intent:{topic:'reflection',stage:!c.situation?'situation':!c.goal?'goal':!c.options?'options':!c.step?'step':!c.obstacle?'obstacle':'review'},followUps:(c.situation?['Give me a recap','Just listen']:['I just want to vent','Help me think through a decision'])};
 }
 return {answer,context,entry};
});
