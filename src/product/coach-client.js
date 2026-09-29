/* v2.63 — consumer Coach client.
 * Production-facing requests use only the Loadnote server boundary.
 * No provider key, base URL, model or raw system prompt is accepted here.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachClient=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ENDPOINT='/api/coach',HEALTH='/api/health';
 let healthCache=null,healthAt=0;
 function session(){
  try{return globalThis.LoadnoteAccountSession?.snapshot?.()||{status:'unknown'};}catch{return {status:'unknown'};}
 }
 function signedIn(){return session().status==='authenticated';}
 async function availability({force=false,request=globalThis.LoadnoteAccountSession?.request||globalThis.fetch}={}){
  const now=Date.now();
  if(!force&&healthCache&&now-healthAt<60000)return healthCache;
  if(typeof request!=='function')return {online:false,reason:'unavailable'};
  try{
   const response=await request(HEALTH);
   if(!response.ok)throw Error('health '+response.status);
   const body=await response.json();
   healthCache={online:!!(body.coach?.configured??body.aiConfigured),authRequired:body.coach?.authRequired!==false,reason:null};
  }catch{healthCache={online:false,authRequired:true,reason:'unavailable'};}
  healthAt=now;return healthCache;
 }
 async function ask({question,context,history=[]}={}, {request=globalThis.LoadnoteAccountSession?.request}={}){
  if(!signedIn()){const error=new Error('Sign in from Profile to use the online Coach.');error.code='coach_sign_in_required';throw error;}
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
 return {ENDPOINT,HEALTH,session,signedIn,availability,ask,resetHealth};
});
