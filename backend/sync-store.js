/* v2.58 — account-scoped remote structured-training snapshot store.
 * Single-process/file adapter with compare-and-swap revisions. It intentionally does
 * not perform merge decisions; the v2.55 three-way model remains the merge authority.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const STORE_VERSION=1;
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
const isoNow=now=>new Date(typeof now==='function'?now():Date.now()).toISOString();

function validAccountId(value){return /^acct_[A-Za-z0-9_-]{20,}$/.test(clean(value));}
function accountKey(accountId){
 if(!validAccountId(accountId))throw Error('Invalid Loadnote account identity');
 return crypto.createHash('sha256').update(clean(accountId)).digest('hex');
}
function validateStored(doc,accountId){
 if(!doc||doc.version!==STORE_VERSION||doc.accountId!==accountId)throw Error('Remote training store format is invalid');
 if(!Number.isInteger(doc.revision)||doc.revision<1)throw Error('Remote training store revision is invalid');
 if(!doc.current||typeof doc.current!=='object'||typeof doc.current.packageFingerprint!=='string')throw Error('Remote training store snapshot is invalid');
 if(!Array.isArray(doc.history))throw Error('Remote training store history is invalid');
 return doc;
}
function metadata(pkg,verification,revision,committedAt){
 return {
  revision,
  committedAt,
  clientId:verification.clientId,
  packageCreatedAt:verification.createdAt,
  schemaVersion:verification.schemaVersion??null,
  releaseVersion:verification.releaseVersion||'',
  records:verification.manifest?.records??null,
  manifestFingerprint:verification.manifest?.fingerprint||null,
  packageFingerprint:verification.packageFingerprint||pkg.packageFingerprint
 };
}
function createFileSyncStore({rootDir,verifyPackage,now=Date.now,maxHistory=50}={}){
 if(typeof verifyPackage!=='function')throw Error('Remote training store requires sync-package verification');
 const root=path.resolve(clean(rootDir)||path.join(process.cwd(),'.loadnote-data','training'));
 const historyLimit=Math.max(5,Math.min(Number(maxHistory)||50,500));

 function fileFor(accountId){return path.join(root,accountKey(accountId)+'.json');}
 function read(accountId){
  const id=clean(accountId),file=fileFor(id);
  if(!fs.existsSync(file))return null;
  const doc=validateStored(JSON.parse(fs.readFileSync(file,'utf8')),id);
  const verification=verifyPackage(doc.package);
  if(!verification?.verified)throw Error('Stored remote training package failed integrity verification: '+(verification?.reason||'invalid package'));
  if(doc.current.packageFingerprint!==verification.packageFingerprint||doc.current.manifestFingerprint!==verification.manifest?.fingerprint)throw Error('Stored remote training metadata does not match its package');
  for(let index=0;index<doc.history.length;index++){
   const entry=doc.history[index],previous=doc.history[index-1];
   if(!entry||!Number.isInteger(entry.revision)||entry.revision<1)throw Error('Stored remote training revision history is inconsistent');
   if(previous&&entry.revision!==previous.revision+1)throw Error('Stored remote training revision history is inconsistent');
  }
  const latest=doc.history[doc.history.length-1];
  if(!latest||latest.revision!==doc.revision||doc.current.revision!==doc.revision||latest.packageFingerprint!==doc.current.packageFingerprint||latest.manifestFingerprint!==doc.current.manifestFingerprint||latest.committedAt!==doc.updatedAt)throw Error('Stored remote training revision history is inconsistent');
  return doc;
 }
 function write(accountId,doc){
  const file=fileFor(accountId);
  fs.mkdirSync(root,{recursive:true});
  const temp=file+'.'+process.pid+'.tmp';
  fs.writeFileSync(temp,JSON.stringify(doc,null,2)+'\n',{encoding:'utf8',mode:0o600});
  fs.renameSync(temp,file);
  try{fs.chmodSync(file,0o600);}catch{}
 }
 function status(accountId){
  const doc=read(accountId);
  if(!doc)return {version:STORE_VERSION,status:'empty',hasSnapshot:false,revision:0,updatedAt:null,current:null,recentRevisions:[]};
  return {
   version:STORE_VERSION,status:'stored',hasSnapshot:true,revision:doc.revision,updatedAt:doc.updatedAt,
   current:clone(doc.current),
   recentRevisions:clone(doc.history.slice(-10).reverse())
  };
 }
 function get(accountId){
  const doc=read(accountId);
  if(!doc)return {version:STORE_VERSION,status:'empty',hasSnapshot:false,revision:0,updatedAt:null,package:null,current:null};
  return {version:STORE_VERSION,status:'stored',hasSnapshot:true,revision:doc.revision,updatedAt:doc.updatedAt,package:clone(doc.package),current:clone(doc.current)};
 }
 function commit(accountId,pkg,{expectedRevision}={}){
  const id=clean(accountId);
  fileFor(id); // validates before doing work
  if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw Object.assign(Error('expectedRevision must be a non-negative integer'),{statusCode:400,code:'invalid_revision'});
  const verification=verifyPackage(pkg);
  if(!verification?.verified)throw Object.assign(Error(verification?.reason||'Sync package verification failed'),{statusCode:400,code:'invalid_package'});
  const existing=read(id),currentRevision=existing?.revision||0;
  if(existing?.current?.packageFingerprint===verification.packageFingerprint){
   return {version:STORE_VERSION,status:'unchanged',changed:false,revision:existing.revision,updatedAt:existing.updatedAt,current:clone(existing.current)};
  }
  if(expectedRevision!==currentRevision){
   const error=Object.assign(Error('Remote training revision changed before this commit.'),{
    statusCode:409,code:'revision_conflict',
    remote:status(id)
   });
   throw error;
  }
  const revision=currentRevision+1,committedAt=isoNow(now),entry=metadata(pkg,verification,revision,committedAt);
  const history=[...(existing?.history||[]),entry].slice(-historyLimit);
  const doc={version:STORE_VERSION,accountId:id,revision,updatedAt:committedAt,current:entry,package:clone(pkg),history};
  write(id,doc);
  return {version:STORE_VERSION,status:'committed',changed:true,revision,updatedAt:committedAt,current:clone(entry)};
 }
 function inspect(accountId){const doc=read(accountId);return clone(doc);}
 return {version:STORE_VERSION,rootDir:root,status,get,commit,inspect,fileFor};
}

module.exports={STORE_VERSION,createFileSyncStore,accountKey,validAccountId};
