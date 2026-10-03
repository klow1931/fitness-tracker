/* v2.82 — consumer Coach client + Companion bootstrap.
 * Production-facing requests use only the Loadnote server boundary.
 * No provider key, base URL, model or raw system prompt is accepted here.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachClient=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ENDPOINT='/api/coach',HEALTH='/api/health',LEGACY_KEY='fitness-tracker-api-key';
 let healthCache=null,healthAt=0;
 function session(){
  try{return globalThis.LoadnoteAccountSession?.snapshot?.()||{status:'unknown'};}catch{return {status:'unknown'};}
 }
 function signedIn(){return session().status==='authenticated';}
 async function ensureSignedIn(){
  let current=session();
  if(current.status==='unknown'&&typeof globalThis.LoadnoteAccountSession?.refresh==='function'){
   try{current=await globalThis.LoadnoteAccountSession.refresh();}catch{}
  }
  return current?.status==='authenticated';
 }
 async function availability({force=false,request=globalThis.LoadnoteAccountSession?.request||globalThis.fetch}={}){
  const now=Date.now();
  if(!force&&healthCache&&now-healthAt<60000)return healthCache;
  if(typeof request!=='function')return {online:false,reason:'unavailable'};
  try{
   const response=await request(HEALTH);
   if(!response.ok)throw Error('health '+response.status);
   const body=await response.json();
   healthCache={online:!!(body.coach?.configured??body.aiConfigured),authRequired:body.coach?.authRequired!==false,voiceConfigured:!!body.voice?.configured,reason:null};
  }catch{healthCache={online:false,authRequired:true,voiceConfigured:false,reason:'unavailable'};}
  healthAt=now;return healthCache;
 }
 async function ask({question,context,history=[]}={}, {request=globalThis.LoadnoteAccountSession?.request}={}){
  if(!await ensureSignedIn()){const error=new Error('Sign in from Profile to use the online Coach.');error.code='coach_sign_in_required';throw error;}
  if(typeof request!=='function'){const error=new Error('Secure Coach connection is unavailable.');error.code='coach_unavailable';throw error;}
  const response=await request(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context,history})});
  let body={};try{body=await response.json();}catch{}
  if(!response.ok){
   const error=new Error(body.error||('Online Coach request failed ('+response.status+').'));
   error.code=body.code||'coach_request_failed';error.status=response.status;throw error;
  }
  if(!body.coach||typeof body.coach!=='object')throw Error('Online Coach returned an invalid response.');
  return body.coach;
 }
 function resetHealth(){healthCache=null;healthAt=0;}
 function scrubLegacyCredential(storage=globalThis.localStorage){
  try{storage?.removeItem?.(LEGACY_KEY);return true;}catch{return false;}
 }
 function bootstrapCompanion(){
  if(typeof document==='undefined')return;
  const load=src=>new Promise((resolve,reject)=>{
   if(document.querySelector('script[data-loadnote-companion="'+src+'"]'))return resolve();
   const script=document.createElement('script');script.src=src;script.defer=true;script.dataset.loadnoteCompanion=src;script.onload=resolve;script.onerror=()=>reject(new Error('Unable to load '+src));document.head.appendChild(script);
  });
  const start=()=>load('src/product/coach-companion.js')
   .then(()=>load('src/product/coach-companion-ui.js'))
   .then(()=>load('src/product/coach-voice.js'))
   .then(()=>load('src/product/voice-workout-logging.js'))
   .then(()=>load('src/product/proactive-coach.js'))
   .then(()=>load('src/product/proactive-coach-ui.js'))
   .then(()=>load('src/product/coach-voice-ui.js'))
   .catch(error=>console.warn('Coach Companion unavailable',error));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 scrubLegacyCredential();
 bootstrapCompanion();
 return {ENDPOINT,HEALTH,LEGACY_KEY,session,signedIn,ensureSignedIn,availability,ask,resetHealth,scrubLegacyCredential,bootstrapCompanion};
});
