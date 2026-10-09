/* Bounded, read-only encouragement and educational answers. No inferred mood,
 * safety clearance, fabricated achievements, persistent memory or training writes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteCoachSupport=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SOURCES={resistance:{title:'ACSM resistance training position stand (2026)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/'},hypertrophy:{title:'IUSCA hypertrophy position stand (2021)',url:'https://doi.org/10.47206/ijsc.v1i1.81'},power:{title:'NSCA weightlifting for sports performance (2023)',url:'https://pubmed.ncbi.nlm.nih.gov/36952649/'}};
 const clean=q=>String(q??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const health=q=>/\b(pain|hurt|injur|torn|tear|diagnos|rehab|achilles|dizz|faint|numb|tingl|blackout|lightheaded)\w*\b|\b(light.headed|chest (pressure|tightness|discomfort)|short(ness)? of breath|(?:difficulty|trouble) breathing|can(?:not|'t) breathe)\b/i.test(String(q||'').replace(/[’‘]/g,"'"));
 function kind(q){
  q=String(q||'').replace(/[’‘]/g,"'");
  if(/\b(suicid\w*|kill myself|hurt myself|harm myself|end my life|don't want to live|do not want to live)\b/i.test(q))return 'urgent-support';
  if(health(q))return 'health';
  if(/\b(no (lifting|training|workout|gym) partner|train(?:ing)? (alone|solo)|lift(?:ing)? (alone|solo)|lonely|no spotter)\b/i.test(q))return 'alone';
  if(/\b(bad|rough|terrible|awful) (session|workout|day)|\b(failed|missed) (a |my |the )?(rep|lift|set)|\b(disappointed|discouraged|frustrated)\b/i.test(q))return 'setback';
  if(/\b(nervous|intimidated|gym anxiety|embarrassed|confidence)\b/i.test(q))return 'confidence';
  if(/\b(motivat\w*|encourag\w*|hype me|don't feel like training|do not feel like training|want to quit|feel like giving up)\b/i.test(q))return 'motivation';
  if(/\b(i (finished|completed|did) (my |the |a )?(workout|session)|pr today|personal best today)\b/i.test(q))return 'celebrate';
  if(/\b(strength vs (size|hypertrophy)|strength (and|or) (size|hypertrophy)|build strength|heavy vs light|light weights)\b/i.test(q))return 'strength-knowledge';
  if(/\b(always.*failure|failure.*required|need.*failure|every set.*failure)\b/i.test(q))return 'failure-knowledge';
  if(/\b(rest periods|rest between sets|how long.*rest)\b/i.test(q))return 'rest-knowledge';
  if(/\b(power vs strength|strength vs power|train.*explosiv|explosiv.*training)\b/i.test(q))return 'power-knowledge';
  if(/^(hi|hello|hey|thanks|thank you)[!.?]*$/i.test(q))return 'greeting';
  return null;
 }
 function answer(question,{history=[],live=null}={}){
  const q=clean(question);let type=kind(String(question||''));
  const last=history.slice(-8).filter(r=>r.role==='user').at(-1);
  const prior=last?kind(clean(last.content)):null;
  if(!type&&prior==='urgent-support'&&/^(why\??|tell me more\.?|what should i do\??|how do i start\??)$/i.test(q))type='urgent-support';
  if(!type&&['motivation','setback'].includes(prior)&&/^(low energy|energy|tired|time|not enough time|consistency)[.!]*$/i.test(q))type='barrier';
  if(!type&&/^(why\??|tell me more\.?|what should i do\??|how do i start\??)$/i.test(q)&&last){const prior=kind(clean(last.content));if(['alone','setback','confidence','motivation'].includes(prior))type=prior;}
  if(!type||type==='health')return null;
  const reply=(text,source=null,followUps=[])=>({text,source:'Shared coaching · '+(source?source.title:'supportive conversation'),readOnly:true,evidence:[],followUps,intent:{topic:type},...(source?{sources:[source]}:{})});
  if(type==='urgent-support')return reply("I'm sorry you're dealing with this. Your safety matters more than this workout. If you may act on these thoughts or are in immediate danger, contact emergency services now and reach someone you trust who can stay with you. In the US or Canada, call or text 988; elsewhere contact your local crisis service. I cannot provide emergency help or monitor your safety.");
  if(type==='barrier')return reply(/time/i.test(q)?"Time is a real constraint, not a character flaw. You can review supported shorter-session options in Decisions; keep essential targets and rest intact until you approve a change. How much time do you have?":"Thanks for saying that. Low energy doesn't establish recovery or readiness by itself. You can pause, record how you're feeling, and review the session rather than forcing a harder effort. If this is persistent or you feel unwell, seek appropriate professional advice. Would reviewing today's plan help?",null,['Review session options','What should I focus on today?']);
  if(type==='alone')return reply("Training alone can feel harder without someone in your corner. I can help you take the session one step at a time. I can't spot you or assess technique; use appropriate safety equipment and a qualified spotter when needed. You don't have to chase a PR. A class or training group can also offer real-world support. Would encouragement or help with today's plan be more useful?",null,['Give me encouragement','What should I focus on today?']);
  if(type==='setback')return reply("That sounds frustrating. One rough session isn't a verdict on you, and you don't have to make up for it with extra work. Record what actually happened, including missed or skipped work and effort, so we can separate a difficult day from a pattern. What felt off: the load, your energy, or confidence?",null,['What evidence is missing?','Give me encouragement']);
  if(type==='confidence')return reply("It's understandable to feel nervous. You don't need to prove yourself to anyone in the gym. Focus on one controllable step: review your planned movement and ask staff or a qualified coach about any unfamiliar setup. I can't assess technique from a chat. Is the equipment, lifting alone, or being around other people the main concern?",null,['I am training alone','Show exercise guidance']);
  if(type==='motivation'){
   const name=live?.liveWorkout?.active?clean(live.liveWorkout.currentExercise?.name):'';
   return reply("You don't have to feel fired up to take a useful next step—and choosing rest when needed isn't failure. "+(name?'The logger currently shows '+name+'. ':'')+"Let's focus on what you can control: check the reviewed plan, then decide whether you're ready to start. No need to chase a PR or push through pain to earn a good session. What's the biggest barrier today: time, low energy, or confidence?",null,['What should I focus on today?','Review session options']);
  }
  if(type==='celebrate')return reply("Nice work getting through the session—that's worth acknowledging. I'm responding to what you told me, not verifying a PR or technique. Save the actual work and effort so your next review has honest evidence. What went well that you'd like to repeat?",null,['How is my training going?']);
  if(type==='greeting')return reply(/thanks|thank you/i.test(q)?"You're welcome. Want to talk through the next step, or take a moment to reflect on what went well?":"Hi—how is training feeling today? I can help with your plan, explain the evidence, or offer encouragement when you're training solo.",null,['What should I focus on today?','Give me encouragement']);
  let text,source;
  if(type==='strength-knowledge'){source=SOURCES.resistance;text='Strength and muscle size overlap, but are not identical goals. Heavier loading tends to favor maximal strength; muscle growth can occur with different loads, with volume also relevant. Consistent progressive resistance training matters more than finding a single perfect scheme. These are healthy-adult research findings, not a personalized dose or proof that you should increase your load.';}
  if(type==='failure-knowledge'){source=SOURCES.resistance;text='No—you do not need every set to reach failure. The 2026 ACSM review did not find a consistent advantage from momentary muscle fatigue across outcomes. Choose effort in the context of the reviewed goal; a technical lift or an unspotted heavy lift is not a place to chase a grind. Log actual effort rather than copying the target. Individual response and training experience still matter.';}
  if(type==='rest-knowledge'){source=SOURCES.hypertrophy;text='Use rest to preserve the quality of the next set, not as a test of toughness. For hypertrophy, the IUSCA stand generally advises at least two minutes for compound lifts; shorter rests may suit some isolation or machine work. That is a general reference, not a universal prescription. Keep your reviewed rest target, and review the plan rather than rushing essential work to fit a timer.';}
  if(type==='power-knowledge'){source=SOURCES.power;text='Strength is force capacity; power also depends on how quickly work is performed. Weightlifting derivatives can develop power, but are not interchangeable with the competition lifts or with sport skill practice. Selection depends on experience, instruction and the sport. Review the session purpose and stop protocol; do not infer a technical load from a squat or deadlift max.';}
  return reply(text+' Source: '+source.title+' — '+source.url,source,['What should I focus on today?']);
 }
 return {SOURCES,kind,health,answer};
});
