/* v5.7 — Flexible, bounded, session-only conversation frames.
 * A small dialogue-act coordinator, not a source of training facts or a model.
 * Athlete turns supply provisional statements; an assistant reply never does.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));
 else root.LoadnoteCoachFlow=factory(root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const clean=x=>String(x??'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().slice(0,500);
 const reset=/^(?:start over|new topic|forget (?:that|this)|change (?:the )?subject|hello|hi|hey)[.!?]*$/i;
 const closing=/^(?:that's (?:all|enough)(?: for (?:now|today))?|that is (?:all|enough)|no more questions|i(?:'m| am) (?:done|good) (?:chatting|talking)(?: for now)?|let's (?:stop|leave it there)|thanks[, ]*(?:that's all|that is all|i'm good)|stop (?:talking|chatting))[.!?]*$/i;
 const resume=/^(?:back to (?:that|our (?:earlier |previous )?(?:topic|conversation)|what we were talking about|(?:my |the )?(work|day|routine|class) (?:thing|topic)?)|can we (?:go|get) back to (?:that|what we were talking about|(?:my |the )?(work|day|routine|class)(?: thing)?))[.!?]*$/i;
 const listen=/\b(?:just listen|only listen|listen for (?:a |one )?(?:bit|moment)|no advice|don't (?:give|want|need) advice|i (?:just )?(?:want|need) to vent|just (?:let me|want to) vent|rather (?:just )?vent|hear me out)\b/i;
 const ideas=/\b(?:i(?:'m| am) ready for (?:ideas|suggestions|advice)|can you (?:give me|offer) (?:some )?(?:ideas|suggestions)|can you (?:help me )?(?:think through|suggest some) (?:ideas|options)|i(?:'d| would) like (?:some )?(?:ideas|suggestions)|let's (?:think through|discuss) (?:my |the )?options)\b/i;
 const correction=/^(?:no[, ]+|actually[, ]+|i meant\b|that's not what i meant\b|that isn't what i meant\b|not (?:the |my )?\w+[,;:. -]+|sorry[, ]+i meant\b)/i;
 const help=/^(?:what do you think i should do|what might help|where do i start|what should i do about that)[.!?]*$/i;
 const entry=/\b(?:can we (?:just )?talk(?: about\b| for a bit)|i (?:just )?(?:want|need) to talk(?: about\b)?|could i talk to you about|i need someone to (?:listen|talk to)|i (?:just )?(?:want|need) to vent|i had a (?:rough|stressful|difficult) day|work was (?:rough|stressful|difficult))\b/i;
 const direct=/^(?:who|where|when|calculate|convert|translate|define|teach|explain|review|show|compare|build|create|draft|save|delete|change|schedule|cancel|swap|replace|increase|decrease|what (?:is|are|was|were)|how (?:many|much|long|is|are|did|do)|why (?:does|did|is|are)|can you (?:calculate|explain|review|build|create|change|show))\b/i;
 const training=/\b(?:rpe|rir|training max|personal record|rest timer|logged|recorded|training history|training evidence|prescribed|programming|training program|sets? (?:left|remaining)|reps? (?:left|remaining))\b|\b(?:how|why|what|explain|review|compare|calculate)\b.{0,65}\b(?:squat|bench|deadlift|workout|lifting|training|program)\b/i;
 const unsupported=/\b(?:medication|therapy|therapist|diagnosis|abuse|eating disorder|self.harm|depress\w*|suicid\w*)\b/i;
 const sensitive=q=>Support?.health(q)||Support?.kind(q)==='urgent-support'||unsupported.test(q);
 const topicOf=q=>/\b(?:my )?(?:work|job|shift)\b/i.test(q)?'work':/\b(?:my )?(?:routine|habit)\b/i.test(q)?'routine':/\b(?:class|course)\b/i.test(q)?'class':/\b(?:my )?(?:day|evening)\b/i.test(q)?'day':'conversation';
 const report=q=>{
  const raw=clean(q),mixed=listen.test(raw)&&/(?:;|\bbut\b)/i.test(raw);
  const slice=mixed?raw.split(/;|\bbut\b/i).at(-1).trim():raw;
  return slice.replace(/^(?:i (?:just )?(?:want|need) to (?:talk|vent)(?: about)?|can we (?:just )?talk about|could i talk to you about)\s*/i,'')
   .replace(/\b(?:and )?i (?:just )?(?:want|need) to vent[.!?]*$/i,'').trim();
 };
 const quote=q=>'“'+clean(q).slice(0,180)+'”';
 function act(raw){
  const q=clean(raw);
  if(!q||sensitive(String(raw??'')))return 'blocked';
  if(reset.test(q))return 'reset';
  if(closing.test(q)||/^(?:thank you|thanks)[!.?]*$/i.test(q))return 'close';
  if(resume.test(q))return 'resume';
  // Opening a conversation with a request to vent needs a durable frame.
  if(entry.test(q)&&(!training.test(q)||listen.test(q)))return 'start';
  if(listen.test(q))return 'listen';
  if(/^(?:actually|no|sorry)[, ]+(?:i (?:mean|meant)|my)\b.{0,35}\b(?:bench|squat|deadlift)\b/i.test(q))return 'direct';
  // Explicit training/factual questions remain with authoritative handlers;
  // a mixed training report with an explicit vent request is listening, not a claim.
  if(/^(?:(?:please )?remember\b|ask me next time\b|(?:open|manage|edit|delete|clear) (?:my |the )?(?:coach )?memories\b)/i.test(q))return 'direct';
  if(direct.test(q)||training.test(q))return 'direct';
  if(ideas.test(q)||help.test(q))return 'ideas';
  if(correction.test(q))return 'correct';
  return 'report';
 }
 const makeFrame=q=>{
  const introductory=/^(?:can we|could i|i (?:just )?(?:want|need) to talk)\b/i.test(q),content=introductory&&/\?$/.test(q)?'':report(q);
  return {subject:topicOf(q),statements:content?[content]:[],listening:listen.test(q),turns:1};
 };
 function fold(history=[]){
  const recent=(Array.isArray(history)?history:[]).slice(-24),frames=[];
  let active=-1,interrupted=false;
  for(const row of recent){
   if(row?.role!=='user')continue;
   const q=clean(row.content),a=act(row.content);
   if(a==='blocked'||a==='reset'||a==='close'){frames.length=0;active=-1;interrupted=false;continue;}
   if(a==='direct'){active=-1;interrupted=true;continue;}
   if(a==='start'){
    frames.push(makeFrame(q));if(frames.length>2)frames.shift();
    active=frames.length-1;interrupted=false;continue;
   }
   if(a==='resume'){
    if(frames.length===1){active=0;interrupted=false;}
    else if(frames.length>1){
     const subject=topicOf(q),matches=frames.map((f,i)=>({f,i})).filter(x=>subject!=='conversation'&&x.f.subject===subject);
     active=matches.length===1?matches[0].i:-1;
     interrupted=active===-1;
    }
    continue;
   }
   if(active<0||!frames[active])continue;
   const frame=frames[active];frame.turns++;
   if(a==='listen')frame.listening=true;
   if(a==='ideas')frame.listening=false;
   if(a==='correct'){
    frame.statements=frame.statements.slice(0,-1);
    frame.statements.push(q);
   }else if(a==='report'||a==='start'){
    frame.statements.push(q);
   }else if(a==='listen'&&q.length>28){
    frame.statements.push(q);
   }
   frame.statements=frame.statements.slice(-4);
  }
  return {frames:frames.map(f=>({...f,statements:[...f.statements]})),active,interrupted};
 }
 function interpret(question,history=[]){
  const q=clean(question),type=act(question);
  if(type==='blocked'||type==='direct'||type==='reset')return null;
  const ctx=fold(history),frame=ctx.frames[ctx.active]||null;
  if(type==='close'){
   if(/^(?:thanks|thank you)[!.?]*$/i.test(q)&&!frame)return null;
   // A clear closing must not trigger another intake question.
   return {act:'close',frame:null,question:q};
  }
  if(type==='resume'){
   if(!ctx.frames.length)return {act:'clarify',question:q,reason:'No earlier user topic is available in this conversation.'};
   if(ctx.frames.length===1)return {act:'resume',frame:ctx.frames[0],question:q};
   const subject=topicOf(q),matches=ctx.frames.filter(f=>f.subject===subject);
   return matches.length===1?{act:'resume',frame:matches[0],question:q}:{act:'clarify',question:q,reason:'Which earlier topic would you like to return to?'};
  }
  if(type==='start'){
   // A new topic may interrupt an old frame, but nothing resumes automatically.
   return {act:'start',frame:makeFrame(q),question:q};
  }
  if(type==='listen'&&!frame)return {act:'listen',frame:makeFrame(q),question:q};
  if(!frame)return null;
  if(type==='ideas'||type==='listen'||type==='correct'||type==='report'){
   // Avoid treating an unrelated factual query as an invitation to resume.
   if(type==='report'&&/\?$/.test(q))return null;
   return {act:type,frame,question:q};
  }
  return null;
 }
 const response=(text,actName,extra={})=>({text,readOnly:true,openDialogue:true,
  variants:{brief:text,standard:text,detail:text},source:'Shared coaching · flexible conversation',
  evidence:[],actions:[],intent:{topic:'reflection',act:actName},...extra});
 function answer(question,{history=[]}={}){
  const turn=interpret(question,history);
  if(!turn)return null;
  const {act:a,frame:f}=turn,q=turn.question;
  if(a==='close')return response('Understood. We can leave it here. You can come back whenever you want.',a);
  if(a==='clarify')return response(turn.reason,a);
  if(a==='start'){
   const last=f.statements.at(-1);
   return response(f.listening
    ?(last?'You mentioned '+quote(last)+'. I can listen without trying to solve it.':'I can listen. No need to turn this into an action plan.')
    :(last?'You mentioned '+quote(last)+'. Would listening or talking through ideas be more helpful?':'What would you like to talk about?'),a);
  }
  if(a==='resume'){
   const last=f.statements.at(-1);
   return response(last?'We can return to '+f.subject+'. You last said '+quote(last)+'. Would you like to continue from there?':
    'We can return to that topic. What would you like to pick up?',a);
  }
  if(a==='correct'){
   const corrected=q.replace(/^(?:actually|no|sorry|i meant)[, :.]*/i,'').trim();
   return response(corrected?'Thanks for correcting me. I will use what you just said: '+quote(corrected)+'.':
    'Thanks for correcting me. What should I understand instead?',a);
  }
  if(a==='listen'){
   const content=report(q),newReport=content.length>25&&!/^(?:just listen|no advice|hear me out)/i.test(content);
   return response(newReport?'I hear you. You said '+quote(content)+'. I can stay with that without jumping to solutions.':
    'I can listen. Go ahead at your pace.',a);
  }
  if(a==='ideas')return response('We can work through options without making changes for you. What part would you most like help with?',a);
  if(a==='report'){
   const last=report(q);
   return response(f.listening
    ?'I hear you. You said '+quote(last)+'. No need to solve it right now.'
    :'You mentioned '+quote(last)+'. Would listening or exploring options be more useful?',a);
  }
  return null;
 }
 return {act,fold,interpret,answer};
});