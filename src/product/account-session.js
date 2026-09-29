/* v2.56 — in-memory account session client.
 * Session cookies remain HttpOnly; CSRF state is kept in memory only.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteAccountSession=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const state={status:'unknown',account:null,expiresAt:null,csrf:null,transport:null,authConfigured:null,authRequired:null,loginAvailable:false,provider:null,lastCheckedAt:null};
 const clone=value=>JSON.parse(JSON.stringify(value));
 function reset(status='anonymous'){
  state.status=status;state.account=null;state.expiresAt=null;state.csrf=null;state.transport=null;return snapshot();
 }
 function snapshot(){return clone(state);}
 function apply(json){
  state.lastCheckedAt=new Date().toISOString();
  state.authConfigured=json?.authConfigured??state.authConfigured;
  state.authRequired=json?.authRequired??state.authRequired;
  state.loginAvailable=json?.loginAvailable===true;
  state.provider=json?.provider&&typeof json.provider.id==='string'?{id:String(json.provider.id),name:String(json.provider.name||'Sign in')}:null;
  if(json?.authenticated){
   state.status='authenticated';
   const raw=json.account;
   state.account=raw&&typeof raw.id==='string'?{
    id:raw.id,
    displayName:typeof raw.displayName==='string'?raw.displayName:null,
    email:typeof raw.email==='string'?raw.email:null,
    emailVerified:raw.emailVerified===true,
    avatarUrl:typeof raw.avatarUrl==='string'?raw.avatarUrl:null,
    providers:Array.isArray(raw.providers)?raw.providers.map(String):[],
    provider:typeof raw.provider==='string'?raw.provider:null
   }:null;
   state.expiresAt=typeof json.expiresAt==='string'?json.expiresAt:null;
   state.csrf=typeof json.csrf==='string'?json.csrf:null;
   state.transport=json.transport||'cookie';
  }else reset('anonymous');
  return snapshot();
 }
 async function refresh(fetchImpl=globalThis.fetch,endpoint='/api/auth/session'){
  if(typeof fetchImpl!=='function'){reset('unavailable');return snapshot();}
  try{
   const response=await fetchImpl(endpoint,{method:'GET',credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
   if(!response.ok){
    if(response.status===404){state.loginAvailable=false;state.provider=null;state.authConfigured=null;state.authRequired=null;reset('unavailable');}
    else reset('anonymous');
    return snapshot();
   }
   return apply(await response.json());
  }catch{state.loginAvailable=false;state.provider=null;state.authConfigured=null;state.authRequired=null;reset('unavailable');return snapshot();}
 }
 function csrfMethod(method){return !['GET','HEAD','OPTIONS'].includes(String(method||'GET').toUpperCase());}
 async function request(url,options={},fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=='function')throw Error('Fetch is unavailable');
  if(state.status==='unknown')await refresh(fetchImpl);
  const headers=new Headers(options.headers||{});
  const method=String(options.method||'GET').toUpperCase();
  if(csrfMethod(method)&&state.status==='authenticated'&&state.transport==='cookie'&&state.csrf&&!headers.has('X-Loadnote-CSRF'))headers.set('X-Loadnote-CSRF',state.csrf);
  const response=await fetchImpl(url,{...options,method,headers,credentials:options.credentials||'include'});
  if(response.status===401)await refresh(fetchImpl);
  return response;
 }
 async function signOut(fetchImpl=globalThis.fetch,endpoint='/api/auth/logout'){
  if(typeof fetchImpl!=='function')throw Error('Fetch is unavailable');
  const response=await request(endpoint,{method:'POST'},fetchImpl);
  if(response.ok)reset('anonymous');
  return response;
 }
 return {state,snapshot,refresh,request,signOut,_applyForTest:apply,_resetForTest:reset};
});
