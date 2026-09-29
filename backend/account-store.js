/* v2.57 — persistent account/identity store for a single Loadnote server instance.
 * This file-backed adapter is intentionally small and replaceable. It provides durable
 * account identity before cloud training-data storage is introduced.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const STORE_VERSION=1;
const clean=value=>String(value??'').trim();
const isoNow=now=>new Date(typeof now==='function'?now():Date.now()).toISOString();
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));

function emptyStore(){return {version:STORE_VERSION,accounts:{},identities:{}};}
function identityKey(provider,subject){return Buffer.from(provider+'\u0000'+subject).toString('base64url');}
function validateIdentity(input){
 const provider=clean(input?.provider).toLowerCase(),subject=clean(input?.subject);
 if(!/^[a-z0-9._-]{2,80}$/.test(provider))throw Error('Invalid identity provider');
 if(!subject||subject.length>512)throw Error('Invalid identity subject');
 return {provider,subject};
}
function publicAccount(account,providers=[]){
 if(!account)return null;
 return {
  id:account.id,
  createdAt:account.createdAt,
  updatedAt:account.updatedAt,
  lastLoginAt:account.lastLoginAt||null,
  displayName:account.displayName||null,
  email:account.email||null,
  emailVerified:account.emailVerified===true,
  avatarUrl:account.avatarUrl||null,
  providers:[...new Set(providers)].sort()
 };
}
function validateDocument(doc){
 if(!doc||doc.version!==STORE_VERSION||!doc.accounts||typeof doc.accounts!=='object'||!doc.identities||typeof doc.identities!=='object')throw Error('Unsupported account-store format');
 for(const [id,account] of Object.entries(doc.accounts)){
  if(id!==account?.id||!/^acct_[A-Za-z0-9_-]{20,}$/.test(id))throw Error('Account store contains an invalid account identity');
 }
 for(const record of Object.values(doc.identities)){
  const identity=validateIdentity(record);
  if(!doc.accounts[record.accountId])throw Error('Account store contains an orphaned identity mapping');
  if(identityKey(identity.provider,identity.subject)!==record.key)throw Error('Account store identity key mismatch');
 }
 return doc;
}
function createFileAccountStore({filePath,now=Date.now,createId}={}){
 const target=path.resolve(clean(filePath)||path.join(process.cwd(),'.loadnote-data','accounts.json'));
 const makeId=typeof createId==='function'?createId:()=> 'acct_'+crypto.randomBytes(24).toString('base64url');
 let cache=null;
 function load(){
  if(cache)return cache;
  if(!fs.existsSync(target)){cache=emptyStore();return cache;}
  const parsed=JSON.parse(fs.readFileSync(target,'utf8'));
  cache=validateDocument(parsed);
  return cache;
 }
 function persist(doc){
  validateDocument(doc);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const temp=target+'.'+process.pid+'.tmp';
  fs.writeFileSync(temp,JSON.stringify(doc,null,2)+'\n',{encoding:'utf8',mode:0o600});
  fs.renameSync(temp,target);
  try{fs.chmodSync(target,0o600);}catch{}
  cache=doc;
 }
 function providersFor(accountId){
  const doc=load(),set=[];
  for(const record of Object.values(doc.identities))if(record.accountId===accountId)set.push(record.provider);
  return set;
 }
 function getAccount(accountId){
  const doc=load(),account=doc.accounts[String(accountId||'')];
  return publicAccount(account,providersFor(account?.id));
 }
 function findByIdentity(input){
  const {provider,subject}=validateIdentity(input),doc=load(),record=doc.identities[identityKey(provider,subject)];
  return record?{account:getAccount(record.accountId),identity:clone(record)}:null;
 }
 function resolveIdentity(input){
  const identity=validateIdentity(input),doc=clone(load()),key=identityKey(identity.provider,identity.subject),at=isoNow(now);
  const existing=doc.identities[key];
  let account;
  if(existing){
   account=doc.accounts[existing.accountId];
  }else{
   const id=clean(makeId());
   if(!/^acct_[A-Za-z0-9_-]{20,}$/.test(id)||doc.accounts[id])throw Error('Could not create a unique Loadnote account id');
   account={id,createdAt:at,updatedAt:at,lastLoginAt:at,displayName:null,email:null,emailVerified:false,avatarUrl:null};
   doc.accounts[id]=account;
   doc.identities[key]={key,accountId:id,provider:identity.provider,subject:identity.subject,createdAt:at,lastLoginAt:at};
  }
  const mapping=doc.identities[key];
  mapping.lastLoginAt=at;
  const verifiedEmail=input?.emailVerified===true&&typeof input?.email==='string'&&input.email.trim()?input.email.trim().slice(0,320):null;
  const displayName=typeof input?.displayName==='string'&&input.displayName.trim()?input.displayName.trim().slice(0,120):null;
  const avatarUrl=typeof input?.avatarUrl==='string'&&/^https:\/\//i.test(input.avatarUrl.trim())?input.avatarUrl.trim().slice(0,1000):null;
  if(verifiedEmail){mapping.email=verifiedEmail;mapping.emailVerified=true;account.email=verifiedEmail;account.emailVerified=true;}
  if(displayName){mapping.displayName=displayName;account.displayName=displayName;}
  if(avatarUrl){mapping.avatarUrl=avatarUrl;account.avatarUrl=avatarUrl;}
  account.lastLoginAt=at;account.updatedAt=at;
  persist(doc);
  return {account:getAccount(account.id),identity:clone(mapping),created:!existing};
 }
 function snapshot(){return clone(load());}
 return {version:STORE_VERSION,filePath:target,getAccount,findByIdentity,resolveIdentity,snapshot};
}

module.exports={STORE_VERSION,createFileAccountStore,identityKey,validateIdentity,publicAccount};
