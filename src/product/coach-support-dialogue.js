/* Session-only supportive dialogue. Athlete turns supply context, never model prose. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));
 else root.LoadnoteCoachSupportDialogue=factory(root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const clean=q=>String(q??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const roots=new Set(['motivation','confidence','setback','alone']);
 const reset=q=>/^(?:new topic|start over|forget (?:that|this)|change (?:the )?subject|thanks|thank you|hi|hello|hey)[.!?]*$/i.test(q);
 const repair=q=>/^(?:that(?:'s| is) not what i meant|you misunderstood|that doesn.t help|i (?:already )?tried that|i don.t know|not sure)[.!?]*$/i.test(q);
 const eased=q=>/\b(?:not|no longer) (?:nervous|anxious|discouraged|frustrated|intimidated)\b/i.test(q);
 const mode=q=>/^(?:(?:please |can you )?(?:give me (?:the )?|say (?:that|it) )?(?:short version|shorter|briefly)|(?:explain|say) (?:that|it) (?:more )?simply)[.!?]*$/i.test(q)?'brief':/^(?:tell me more|more detail|explain that|what should i do|how do i start|what next|why)[.!?]*$/i.test(q)?'detail':null;
 function rootTopic(q){if(eased(q))return null;const k=Support.kind(q);if(roots.has(k))return k;if(/\b(?:workout|session)\b.{0,35}\b(?:felt|was)\b.{0,15}\b(?:terrible|awful|rough|bad)\b/i.test(q)||/\bmissed\b.{0,20}\bworkouts?\b/i.test(q))return 'setback';return null;}
 function choice(q){
  // Ignore explicitly rejected alternatives, keeping “not enough time” intact.
  const positive=q.toLowerCase().replace(/\b(?:not|isn't|wasn't)\s+(?:my\s+|the\s+)?(?:energy|time|confidence|equipment|load|weights|people)(?:\s+(?:issue|problem))?\b/g,'');
  const checks=[['time',/\b(?:short on time|not enough time|time|busy|schedule)\b/],['equipment',/\b(?:equipment|machines?|setup|setting (?:it|them) up)\b/],['people',/\b(?:other people|being watched|judg(?:ed|ing)|crowded|crowds|around people)\b/],['alone',/\b(?:alone|solo|without (?:a )?(?:partner|spotter)|no (?:partner|spotter))\b/],['energy',/\b(?:energy|tired|exhausted|fatigued)\b/],['confidence',/\b(?:confidence|nervous|awkward|intimidat\w*|anxious)\b/],['performance',/\b(?:performance|load|weights?|reps?|sets?)\b/]];
  // Explicit corrections prefer the corrected clause over the rejected one.
  const corrected=positive.split(/\b(?:actually|rather|instead|but)\b/).at(-1);
  return checks.find(([,re])=>re.test(corrected))?.[0]||checks.find(([,re])=>re.test(positive))?.[0]||null;
 }
 function context(history){
  let c=null;
  for(const row of (Array.isArray(history)?history:[]).slice(-24)){
   if(row?.role!=='user')continue;
   const q=clean(row.content);
   if(!q||reset(q)||Support.health(q)||Support.kind(q)==='urgent-support'){c=null;continue;}
   if(repair(q)&&c){c={topic:c.topic,barrier:null,turns:c.turns+1};continue;}
   const topic=rootTopic(q);
   if(topic){c={topic,barrier:choice(q),turns:(c?.turns||0)+1};continue;}
   if(!c)continue;
   const barrier=choice(q);
   if(barrier&&q.length<=160){c={...c,barrier,turns:c.turns+1};continue;}
   if(c.barrier==='time'&&/^\d{1,3}\s*(?:minutes?|mins?)[.!?]*$/i.test(q)){const minutes=Number(q.match(/^\d+/)[0]);if(minutes>=1&&minutes<=240)c.minutes=minutes;c.turns++;continue;}
   if(mode(q)||/^(?:bench(?: press)?|squat|deadlift|yes|no|not sure|i don't know)[.!?]*$/i.test(q)){c.turns++;continue;}
   c=null;
  }
  return c;
 }
 function answer(question,{history=[],live=null}={}){
  const q=clean(question);
  if(!q||reset(q)||Support.health(String(question??''))||Support.kind(String(question??''))==='urgent-support')return null;
  const prior=context(history),topic=rootTopic(q),short=mode(q),selected=choice(q);
  const duration=prior?.barrier==='time'&&q.match(/^\s*(\d{1,3})\s*(?:minutes?|mins?)[.!?]*$/i);
  const continuation=prior&&(repair(q)||eased(q)||duration||short||selected&&q.length<=160||/^(?:bench(?: press)?|squat|deadlift|not sure|i don't know)[.!?]*$/i.test(q));
  if(!topic&&!continuation)return null;
  // Informational or action requests retain their existing authoritative routes.
  if(/\b(?:research|sources|evidence|training max|rpe|build|create|draft|save|delete|schedule|swap|replace|increase|decrease|progress|plateau|declin\w*|history|logged|recorded|compare|prescribed|target|outcomes?)\b|\b(?:program|plan)\b.{0,25}\bworking\b/i.test(q))return null;
  const c={topic:topic||prior.topic,barrier:selected||(!topic?prior.barrier:null),turns:(prior?.turns||0)+1};
  const minutes=duration?Number(duration[1]):!topic?prior?.minutes:null;
  if(c.barrier==='time'&&Number.isInteger(minutes)&&minutes>=1&&minutes<=240)c.minutes=minutes;
  let brief,detail,questionText,followUps=[],actions=[];
  const correction=/\b(?:actually|not .{0,20}(?:issue|problem)|instead|weights? (?:were|was|are) fine)\b/i.test(q)?'Thanks for clarifying. ':'';
  if(repair(q)){
   brief='Thanks for telling me. Let’s set that suggestion aside and clarify what would help.';detail=brief+' I do not want to treat an earlier guess as your concern.';questionText='What would you like me to understand about the situation?';followUps=['Mostly the equipment','Not enough time'];
  }else if(eased(q)){
   brief='You’re saying that concern has eased. We can leave it there.';detail=brief+' That is your report, rather than a measured change in performance.';questionText='Would reviewing today’s plan be useful now?';actions=[{kind:'workout-brief',label:'Review today’s plan'}];
  }else if(c.barrier==='time'){
   brief='Time is the constraint. We can review a shorter session before changing any targets.';
   detail=brief+' There is no need to rush essential rest or add work later to compensate. The existing session review can show supported options for your current plan.';
   questionText=c.minutes?'Would you like to review the session options?':'How much time do you have today?';if(c.minutes){brief='You reported '+c.minutes+' minutes available. Review supported session options before changing targets.';detail=brief+' The review keeps the existing plan authoritative until you approve a change.';}followUps=['Review session options'];actions=[{kind:'adapt',label:'Review session options'}];
  }else if(c.barrier==='equipment'){
   brief='Unfamiliar equipment can make a session feel awkward. Pick one setup to get comfortable with first.';
   detail=brief+' Check its setup instructions and ask gym staff to demonstrate the adjustments and safety features. I can explain movement guidance, but I cannot assess your technique or act as a spotter.';
   questionText='Which movement or piece of equipment feels unfamiliar?';followUps=['Show exercise guidance'];actions=[{kind:'guidance',label:'Open exercise guidance'}];
   if(/^(?:bench(?: press)?|squat|deadlift)[.!?]*$/i.test(q)){brief='For that setup, ask gym staff to show the adjustments and safety equipment before you use it.';detail=brief+' We can use the exercise guidance to review its purpose and setup cues. Chat cannot assess technique or replace a qualified spotter.';questionText='Would opening the exercise guidance help?';}
  }else if(c.barrier==='people'){
   brief='Being around other people is the concern. You do not have to prove anything to them.';
   detail=brief+' Choose a familiar part of your reviewed session to focus on, and ask staff for help finding equipment if the gym is crowded. The next step can be small.';
   questionText='Would you rather talk through getting started or review today’s plan?';followUps=['Review today’s plan','Give me encouragement'];actions=[{kind:'workout-brief',label:'Review today’s plan'}];
  }else if(c.barrier==='alone'||c.topic==='alone'){
   brief='Training alone is the concern. I can talk through the session, but cannot spot you or assess technique.';
   detail=brief+' Use appropriate safety equipment and a qualified spotter when needed; staff, classes or a training group can offer in-person support.';
   questionText='Is it the equipment, confidence, or having nobody to check in with that feels hardest?';followUps=['Mostly the equipment','Mostly confidence'];
  }else if(c.barrier==='energy'){
   brief='You are reporting low energy. That alone does not tell us your training readiness.';
   detail=brief+' You can pause and review the session instead of forcing a harder effort. If you feel unwell or this persists, seek appropriate professional advice. Any training change still goes through the existing review.';
   questionText='Would reviewing today’s session help you choose a next step?';actions=[{kind:'workout-brief',label:'Review today’s session'}];followUps=['Review today’s plan'];
  }else if(c.barrier==='performance'){
   brief='Let’s separate how the workout felt from what was performed. Record the actual work and effort, including missed or skipped work.';
   detail=brief+' One session does not establish a trend or a reason to add compensatory work. The training review can compare the logged evidence without guessing what happened.';
   questionText='Would you like to review the logged results?';actions=[{kind:'training-feedback',label:'Review logged training'}];followUps=['How is my training going?'];
  }else if(c.barrier==='confidence'||c.topic==='confidence'){
   brief='Confidence is the concern. You can focus on one familiar, controllable step rather than proving yourself.';
   detail=brief+' Review the movement and setup, and ask staff or a qualified coach about anything unfamiliar. We can talk through what feels difficult without treating that feeling as a performance measurement.';
   questionText='Is it the equipment, training alone, or being around other people?';followUps=['Mostly the equipment','Training alone','Being around other people'];
  }else if(c.topic==='setback'){
   brief='That sounds frustrating. A difficult session is not a verdict on you, and you do not need to make up for it with extra work.';
   detail=brief+' Save what actually happened so a later review can distinguish an isolated session from a pattern. Your description matters, but it is separate from the recorded training evidence.';
   questionText='Was it the performance, your energy, or something else?';followUps=['The performance','Low energy','Mostly confidence'];
  }else{
   brief='You do not have to feel fired up to take a useful next step, and choosing rest when needed is not failure.';
   detail=brief+' We can review the planned session and identify a manageable next action. There is no need to chase a personal record to make the session worthwhile.';
   questionText='Is the biggest barrier time, energy, or confidence?';followUps=['Not enough time','Low energy','Mostly confidence'];
  }
  // Variants are authored together so shortening never drops a generated fact.
  const variants={brief:correction+brief+' '+questionText,standard:correction+brief+' '+questionText,detail:correction+detail+' '+questionText};
  if(short==='detail')variants.standard=variants.detail;
  if(short==='brief')variants.standard=variants.brief;
  return {text:variants.standard,variants,...(short?{requestedLength:short}:{}),source:'Shared coaching · supportive conversation',readOnly:true,evidence:[],intent:{topic:topic||c.topic},supportive:true,followUps:followUps.slice(0,2),actions};
 }
 return {answer,context,choice};
});
