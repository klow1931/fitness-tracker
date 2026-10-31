/* Explicit device-only communication settings. Never stores chat or training data. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteCoachConversationPreferences=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='loadnote.coach-communication.v1',DEFAULTS=Object.freeze({version:1,length:'standard',encouragement:'calm'});
 function normalize(value){
  if(!value||value.version!==1||!['brief','standard','detail'].includes(value.length)||!['calm','upbeat'].includes(value.encouragement)||Object.keys(value).some(k=>!['version','length','encouragement'].includes(k)))throw Error('Invalid communication preferences');
  return {version:1,length:value.length,encouragement:value.encouragement};
 }
 function createStore(storage){
  return {
   read(){try{const raw=storage.getItem(KEY);return raw==null?{saved:false,preferences:{...DEFAULTS}}:{saved:true,preferences:normalize(JSON.parse(raw))};}catch{return {saved:false,preferences:{...DEFAULTS},error:'Saved communication preferences could not be read. Defaults are in use.'};}},
   save(value){const v=normalize(value);storage.setItem(KEY,JSON.stringify(v));return {saved:true,preferences:v};},
   clear(){storage.removeItem(KEY);return {saved:false,preferences:{...DEFAULTS}};}
  };
 }
 function answer(question,{preferences=null}={}){
  const q=String(question??'').replace(/[’‘]/g,"'").trim().slice(0,500);
  if(!/\b(?:reply|replies|response|responses|communication|conversation|encouragement|tone)\b/i.test(q)&&!/^what (?:do you|have you) remember(?:ed)? about me[?.!]*$/i.test(q))return null;
  const current=preferences?.preferences||DEFAULTS;
  const result=(text,proposal=null)=>({text,source:'Shared coaching · communication preferences',readOnly:true,evidence:[],intent:{topic:'communication-preferences'},actions:[{kind:'conversation-preferences',label:proposal?'Review reply preferences':'Review or remove reply preferences',...(proposal?{proposal}:{})}],followUps:[]});
  if(/\b(?:remember|prefer|use|keep|make|give|set|change|less hype|more encouragement)\b/i.test(q)){
   const lengths=[/\b(?:brief|short|shorter|concise)\b/i.test(q)&&'brief',/\b(?:detailed|longer|more detail)\b/i.test(q)&&'detail',/\b(?:standard|normal)\b/i.test(q)&&'standard'].filter(Boolean);
   const tones=[/\b(?:calm|less hype|no hype|low key)\b/i.test(q)&&'calm',/\b(?:upbeat|more encouragement|more encouraging)\b/i.test(q)&&'upbeat'].filter(Boolean);
   if(lengths.length>1||tones.length>1)return result('Which reply length and encouragement style do you prefer? Choose one of each in the preference review. Nothing has been saved.');
   if(lengths.length||tones.length){const proposed={...current,length:lengths[0]||current.length,encouragement:tones[0]||current.encouragement};return result('You requested '+proposed.length+' replies with '+proposed.encouragement+' encouragement. Review and save this device’s communication preferences if that is correct. Nothing has been saved from this message.',proposed);}
  }
  if(/\b(?:remember|saved|preferences|forget|remove|delete|settings)\b/i.test(q))return result((preferences?.saved?'Saved on this device: '+current.length+' replies and '+current.encouragement+' encouragement.':'No communication preferences have been saved on this device.')+' This stores only those two choices. Conversation and reported feelings are not saved as personal facts. Confirmed training setup remains separate in Profile.');
  return null;
 }
 function present(reply,setting){
  if(!reply)return reply;
  let p;try{p=normalize(setting?.preferences||DEFAULTS);}catch{p=DEFAULTS;}
  if(!reply.supportive||!reply.variants)return reply;
  const selected=reply.requestedLength||p.length;
  const text=reply.variants[selected]||reply.text;
  // Encouragement is optional phrasing, never a claim about verified progress.
  return {...reply,text:(p.encouragement==='upbeat'?'One step at a time. ':'')+text};
 }
 return {KEY,DEFAULTS,normalize,createStore,answer,present};
});
