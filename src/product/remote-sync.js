/* v2.59 — explicit remote-training snapshot client.
 * Reading status is automatic for signed-in account UI. Upload/download helpers never
 * mutate local training state and are not automatically invoked by the app.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./sync-model'),require('./account-session'));
 else root.LoadnoteRemoteSync=factory(root.LoadnoteSync,root.LoadnoteAccountSession);
})(typeof globalThis!=='undefined'?globalThis:this,function(Sync,AccountSession){
 'use strict';
 if(!Sync)throw Error('Remote training client requires Loadnote sync model');
 const CLIENT_KEY='loadnote_remote_client_v1';
 const RECEIPT_PREFIX='loadnote_remote_receipt_v1:';
 const clean=value=>String(value??'').trim();
 const json=async response=>{
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
   const error=Error(body.error||('Remote training request failed ('+response.status+')'));
   error.status=response.status;error.code=body.code||null;error.remote=body.remote||null;throw error;
  }
  return body;
 };
 function randomId(){
  const api=globalThis.crypto;
  if(api?.randomUUID)return 'client_'+api.randomUUID();
  if(api?.getRandomValues){const bytes=new Uint8Array(16);api.getRandomValues(bytes);return 'client_'+[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');}
  return 'client_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
 }
 function clientId(storage=globalThis.localStorage){
  if(!storage)return randomId();
  let id=clean(storage.getItem(CLIENT_KEY));
  if(!/^client_[A-Za-z0-9_-]{12,}$/.test(id)){id=randomId();storage.setItem(CLIENT_KEY,id);}
  return id;
 }
 function receiptKey(accountId){return RECEIPT_PREFIX+clean(accountId);}
 function loadReceipt(accountId,storage=globalThis.localStorage){
  if(!storage||!clean(accountId))return null;
  try{const value=JSON.parse(storage.getItem(receiptKey(accountId))||'null');return value&&Number.isInteger(value.revision)?value:null;}catch{return null;}
 }
 function saveReceipt(accountId,value,storage=globalThis.localStorage){
  if(!storage||!clean(accountId))return;
  storage.setItem(receiptKey(accountId),JSON.stringify(value));
 }
 const requester=(url,options,request)=>request?request(url,options):AccountSession?.request?AccountSession.request(url,options):fetch(url,{...options,credentials:options?.credentials||'include'});
 async function status({request}={}){
  return json(await requester('/api/sync/status',{method:'GET',headers:{Accept:'application/json'}},request));
 }
 async function fetchSnapshot({request}={}){
  const body=await json(await requester('/api/sync/state',{method:'GET',headers:{Accept:'application/json'}},request));
  if(body.hasSnapshot){
   const verification=Sync.verifyPackage(body.package);
   if(!verification.verified){const error=Error('Remote training snapshot failed client verification: '+verification.reason);error.code='remote_snapshot_invalid';throw error;}
  }
  return body;
 }
 function prepare(state,{client=clientId(),createdAt=new Date().toISOString(),releaseVersion}={}){
  return Sync.createPackage(state,{clientId:client,createdAt,releaseVersion});
 }
 async function uploadPackage(pkg,{expectedRevision,request,accountId,storage=globalThis.localStorage}={}){
  if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw Error('A non-negative expected remote revision is required');
  const verification=Sync.verifyPackage(pkg);
  if(!verification.verified)throw Error('Cannot upload an invalid training sync package: '+verification.reason);
  const body=await json(await requester('/api/sync/state',{
   method:'PUT',headers:{'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify({expectedRevision,package:pkg})
  },request));
  if(accountId&&Number.isInteger(body.revision)){
   saveReceipt(accountId,{version:1,revision:body.revision,packageFingerprint:body.current?.packageFingerprint||pkg.packageFingerprint,manifestFingerprint:body.current?.manifestFingerprint||pkg.manifest.fingerprint,acknowledgedAt:new Date().toISOString()},storage);
  }
  return body;
 }
 async function upload(state,{expectedRevision,client=clientId(),createdAt=new Date().toISOString(),releaseVersion,request,accountId,storage=globalThis.localStorage}={}){
  const pkg=prepare(state,{client,createdAt,releaseVersion});
  return uploadPackage(pkg,{expectedRevision,request,accountId,storage});
 }
 return {CLIENT_KEY,RECEIPT_PREFIX,clientId,loadReceipt,status,fetchSnapshot,prepare,uploadPackage,upload};
});
