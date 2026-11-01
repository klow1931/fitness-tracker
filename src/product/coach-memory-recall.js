/* v5.9 — explicit, read-only recall of approved Coach notes.
 * Only matching user questions can surface notes. This module has no storage,
 * transcript, training-write, AI or network access.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachMemoryRecall=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPE_LABELS={'reason':'training reason or goal','routine-cue':'routine cue','preferred-name':'preferred name','follow-up':'next-visit follow-up'};
 const actions=[{kind:'coach-memory',label:'Things Coach remembers'}];
 function intent(question){
  const q=String(question??'').replace(/[’‘]/g,"'").trim().replace(/[?!.]+$/,'').toLowerCase();
  if(q.length>200||!q)return null;
  if(/^(?:remind me why i (?:train|lift|exercise|work out)|why (?:do|did) i (?:train|lift|exercise|work out)|what(?:'s| is| was) my (?:training )?(?:goal|motivation|reason)|what did i (?:say|tell you) about my (?:training )?(?:goal|motivation|reason)|remind me (?:of|about) my (?:training )?(?:goal|motivation|reason))$/.test(q))return 'reason';
  if(/^(?:what(?:'s| is| was) my (?:training |workout )?(?:routine|habit|cue)|what (?:routine|habit|cue) did i (?:save|tell you about|want to follow)|remind me (?:of|about) my (?:training |workout )?(?:routine|habit|cue))$/.test(q))return 'routine-cue';
  if(/^(?:what (?:name should you call me|did i ask you to call me)|what(?:'s| is) my preferred name|do you (?:know|remember) my name)$/.test(q))return 'preferred-name';
  if(/^(?:what (?:did i ask you to|should you|were you supposed to) (?:ask me|follow up (?:with me )?about)(?: next time| on my next visit)?|what follow-ups? (?:did i save|do you have for me)|remind me (?:of|about) (?:my )?(?:follow-ups?|next-visit questions?))$/.test(q))return 'follow-up';
  if(/^(?:where did we leave off|can we pick up where we left off|let's pick up where we left off|what did we (?:talk about|discuss) last time|do you remember our last (?:chat|conversation)|continue where we left off|what do you know about me)$/.test(q))return 'continuity';
  return null;
 }
 function answer(question,view){
  const kind=intent(question);if(!kind)return null;
  const base={readOnly:true,evidence:[],source:'Shared coaching · approved memories',actions:actions.map(a=>({...a}))};
  if(!view||view.error||!Array.isArray(view.records))return {...base,text:'I cannot verify approved Coach notes in this account space right now. Open Things Coach remembers to inspect storage. I have not recovered or saved any past chat.'};
  const records=view.records.filter(r=>r&&r.approved===true&&r.source==='manual-review'&&Object.hasOwn(TYPE_LABELS,r.type)&&typeof r.text==='string');
  if(kind==='continuity'){
   const selected=records.filter(r=>['follow-up','reason','routine-cue'].includes(r.type)).slice(0,3);
   return {...base,text:selected.length?
    'I do not keep your previous chat transcript. Here is what you explicitly asked me to remember: '+selected.map(r=>TYPE_LABELS[r.type]+': '+r.text).join(' · ')+'. These are saved notes, not proof that you completed anything. What would you like to talk through now?':
    'I do not save previous conversations as memories. There are no approved follow-up, goal or routine notes in this account space to resume from. Tell me what you want to work on and we can start here.'};
  }
  const selected=records.filter(r=>r.type===kind).slice(0,3);
  if(!selected.length)return {...base,text:'I do not have an approved '+TYPE_LABELS[kind]+' note in this account space. You can review and save one in Things Coach remembers; I will not guess from an earlier chat.'};
  const total=records.filter(r=>r.type===kind).length;
  const shown=selected.map(r=>r.text).join(' · ');
  return {...base,text:(total===1?'Your approved '+TYPE_LABELS[kind]+' note says: ':'Your approved '+TYPE_LABELS[kind]+' notes say: ')+shown+'.'+(total>selected.length?' Showing '+selected.length+' of '+total+' notes; open Things Coach remembers for the rest.':'')+' This is your saved wording, not verified training performance or completion.'};
 }
 return {intent,answer};
});
