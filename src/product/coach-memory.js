/* v5.8 — explicitly approved, device-local Coach memories.
 * Independent of training state, session transcript, cloud sync and backups.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachMemory=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION=1,PREFIX='loadnote.coach-memory.v1.',MAX=12,MAX_TEXT=160;
 const TYPES=Object.freeze({'preferred-name':'Preferred name','reason':'Reason or non-sensitive goal','routine-cue':'Routine cue','follow-up':'Ask next visit'});
 const sensitive=/\b(?:pain|injur\w*|diagnos\w*|suicid\w*|self.harm|therapy|therapist|depress\w*|medication|pregnan\w*|religion|politic\w*|party affiliation|sexual|bank|password|credit card|social security|ssn|medical)\b/i;
 const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 function owner(session){
  if(session?.status==='authenticated'){
   const id=session.account?.id;
   if(typeof id!=='string'||!/^[\w.:@-]{1,128}$/.test(id))return null;
   return 'account:'+id;
  }
  if(session?.status==='unknown')return null;
  return 'local-device';
 }
 function validText(value){
  if(typeof value!=='string'||value.trim()!==value||value.length<2||value.length>MAX_TEXT||/[\x00-\x1F\x7F]/.test(value)||sensitive.test(value))throw Error('Use a short non-sensitive note (2–160 characters). Keep medical or private details in their dedicated area.');
  return value;
 }
 function validDate(value,{nullable=false}={}){
  if(nullable&&value==null)return null;
  if(typeof value!=='string'||! /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw Error('Memory has an invalid timestamp.');
  return value;
 }
 function validateRecord(row){
  if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!['id','type','text','createdAt','updatedAt','expiresAt','visit','source','approved'].includes(k)))throw Error('Unsupported memory record.');
  if(typeof row.id!=='string'||!/^m-[a-z0-9-]{8,90}$/.test(row.id))throw Error('Invalid memory ID.');
  if(!own(TYPES,row.type))throw Error('Unsupported memory type.');
  validText(row.text);validDate(row.createdAt);validDate(row.updatedAt);
  if(row.updatedAt<row.createdAt)throw Error('Memory update predates creation.');
  validDate(row.expiresAt,{nullable:true});
  if(row.expiresAt&&row.expiresAt<=row.createdAt)throw Error('Memory expiry must follow creation.');
  if(typeof row.visit!=='string'||!/^[a-z0-9-]{8,90}$/.test(row.visit))throw Error('Invalid visit marker.');
  if(row.source!=='manual-review'||row.approved!==true)throw Error('Only explicitly reviewed memory records are allowed.');
  return {...row,expiresAt:row.expiresAt??null};
 }
 function validateVault(value,scope){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['version','scope','revision','records'].includes(k))||value.version!==VERSION||value.scope!==scope||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.records)||value.records.length>MAX)throw Error('Saved memories are corrupt or belong to another profile. No changes were made.');
  const records=value.records.map(validateRecord),ids=new Set(records.map(r=>r.id));
  if(ids.size!==records.length)throw Error('Duplicate memory IDs.');
  return {version:VERSION,scope,revision:value.revision,records};
 }
 function empty(scope){return {version:VERSION,scope,revision:0,records:[]};}
 function newId(now,rows){
  let id;do{id='m-'+Date.parse(now).toString(36)+'-'+Math.random().toString(36).slice(2,12).padEnd(8,'0');}while(rows.some(r=>r.id===id));return id;
 }
 function createStore(storage,scope,{visit='visit-local-0001',clock=()=>new Date().toISOString()}={}){
  if(typeof scope!=='string'||!(scope==='local-device'||/^account:[\w.:@-]{1,128}$/.test(scope)))throw Error('Account identity is not verified. Memories are unavailable until it is known.');
  if(!/^[a-z0-9-]{8,90}$/.test(visit))throw Error('Invalid visit marker.');
  const key=PREFIX+encodeURIComponent(scope);
  function raw(){return storage.getItem(key);}
  function vault(){const s=raw();return s==null?empty(scope):validateVault(JSON.parse(s),scope);}
  function read(){
   try{
    const state=vault(),now=clock(),records=state.records.filter(r=>!r.expiresAt||r.expiresAt>now);
    return {scope,revision:state.revision,saved:state.records.length>0,records,expired:state.records.length-records.length,nextVisit:records.filter(r=>r.type==='follow-up'&&r.visit!==visit)};
   }catch{return {scope,revision:null,records:[],nextVisit:[],expired:0,error:'Saved Coach memories could not be read or verified. Nothing was overwritten.'};}
  }
  function commit(next,expectedRevision,confirmed){
   if(confirmed!==true)throw Error('Review and explicitly confirm the memory change.');
   const current=vault();
   if(current.revision!==expectedRevision)throw Error('Memories changed while reviewing. Reopen to inspect the latest saved version.');
   const checked=validateVault({...next,version:VERSION,scope,revision:current.revision+1},scope);
   storage.setItem(key,JSON.stringify(checked));return read();
  }
  function save({id=null,type,text,expiresAt=null},{expectedRevision,confirmed=false}={}){
   const now=validDate(clock()),value=validText(text);
   if(!own(TYPES,type))throw Error('Choose a supported memory type.');
   const expire=validDate(expiresAt,{nullable:true});
   if(expire&&expire<=now)throw Error('Expiry must be in the future.');
   const current=vault(),records=[...current.records],index=id==null?-1:records.findIndex(r=>r.id===id);
   if(id!=null&&index<0)throw Error('This memory no longer exists.');
   if(index===-1&&records.length>=MAX)throw Error('Memory list is full. Remove an entry before adding another.');
   const previous=index>=0?records[index]:null;
   const record={id:previous?.id||newId(now,records),type,text:value,createdAt:previous?.createdAt||now,updatedAt:now,expiresAt:expire,visit:previous?.visit||visit,source:'manual-review',approved:true};
   if(index<0)records.push(record);else records[index]=record;
   return commit({...current,records},expectedRevision,confirmed);
  }
  function remove(id,{expectedRevision,confirmed=false}={}){
   const current=vault(),records=current.records.filter(r=>r.id!==id);
   if(records.length===current.records.length)throw Error('The memory no longer exists.');
   return commit({...current,records},expectedRevision,confirmed);
  }
  function clear({expectedRevision,confirmed=false}={}){
   if(confirmed!==true)throw Error('Review and explicitly confirm clearing memories.');
   const s=raw(),current=s==null?empty(scope):validateVault(JSON.parse(s),scope);
   if(current.revision!==expectedRevision)throw Error('Memories changed while reviewing. Reopen to inspect the latest saved version.');
   storage.removeItem(key);
   // Removal is complete only if the storage provider confirms it.
   if(storage.getItem(key)!=null)throw Error('Memory deletion could not be confirmed.');
   return read();
  }
  function resetUnreadable({confirmed=false}={}){
   if(confirmed!==true)throw Error('Explicit confirmation is required to erase unreadable memories.');
   const current=raw();if(current==null)return read();
   // This recovery path must never delete a valid approved memory set.
   try{validateVault(JSON.parse(current),scope);throw Error('Memories are valid. Use ordinary Clear all instead.');}
   catch(e){if(e.message==='Memories are valid. Use ordinary Clear all instead.')throw e;}
   storage.removeItem(key);
   if(raw()!=null)throw Error('Memory deletion could not be confirmed.');
   return read();
  }
  function exportData(){const state=vault();return JSON.stringify({version:VERSION,scope,revision:state.revision,records:state.records},null,2);}
  function importData(input,{expectedRevision,confirmed=false}={}){
   const parsed=typeof input==='string'?JSON.parse(input):input,source=validateVault(parsed,scope);
   // Imported timestamps and expiry are validated; no transcript, training or foreign scope.
   const current=vault();
   return commit({...current,records:source.records},expectedRevision,confirmed);
  }
  return {scope,key,read,save,remove,clear,resetUnreadable,exportData,importData};
 }
 function response(question,view){
  const q=String(question??'').replace(/[’‘]/g,"'").trim().slice(0,500);
  const ask=/^(?:what (?:do you |have you )?(?:remember|saved) about me|show (?:my |the )?(?:coach )?memories|what will you ask me next time|what do you remember\??)[?!.]*$/i;
  const remembering=/^(?:(?:please )?remember (?:that |my )?|ask me next time (?:whether |if |about )?)(.{2,160})[.!]?$/i;
  const open=/^(?:open|manage|edit|delete|clear) (?:my |the )?(?:coach )?memories[.!?]*$/i;
  if(!ask.test(q)&&!open.test(q)&&!remembering.test(q))return null;
  const match=q.match(remembering);
  const followup=/^ask me next time\b/i.test(q);
  const proposal=match?{type:followup?'follow-up':'reason',text:match[1].replace(/[.!?]+$/,'').trim()}:null;
  const a=[{kind:'coach-memory',label:proposal?'Review memory before saving':'Things Coach remembers',...(proposal?{proposal}:{})}];
  if(!view||view.error)return {text:'I cannot verify saved memories on this device right now. Open Things Coach remembers to check storage. No chat was saved.',readOnly:true,evidence:[],source:'Shared coaching · approved memories',actions:a};
  if(proposal)return {text:'I can remember a short, non-sensitive detail only after you review and save it. Open Things Coach remembers, choose a type and confirm the exact wording. Nothing from this chat was stored.',readOnly:true,evidence:[],source:'Shared coaching · approved memories',actions:a};
  const text=view.records.length?'You approved '+view.records.length+' memory '+(view.records.length===1?'entry':'entries')+' on this device: '+view.records.map(r=>TYPES[r.type]+': '+r.text).join(' · ')+'. These are saved notes, not verified training performance.':'There are no approved Coach memories saved in this space. Conversation messages are not stored as memories.';
  return {text,readOnly:true,evidence:[],source:'Shared coaching · approved memories',actions:a};
 }
 return {VERSION,TYPES,PREFIX,owner,createStore,validateRecord,validateVault,response};
});