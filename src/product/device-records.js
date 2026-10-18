/* Phase 6 — fail-closed device records for account sync bases and receipts.
 * A local fallback must win over an old IndexedDB record after a failed IDB
 * write. Never silently forget an acknowledged sync base after storage errors.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteDeviceRecords=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='loadnote-device-v1:',MARKER='loadnote-device-fallback-v1:';
 const key=x=>PREFIX+String(x),marker=x=>MARKER+String(x);
 const parse=(raw,k)=>{
  if(raw==null)throw Error('Device sync fallback is missing for '+k+'. Sync is blocked until storage is recovered.');
  try{const value=JSON.parse(raw);if(value==null||typeof value!=='object')throw Error('invalid');return value;}
  catch{throw Error('Device sync fallback is damaged for '+k+'. Do not select a different cloud copy until this record is recovered.');}
 };
 async function get(k,{idbGet,idbSet,local}){
  const pending=local.getItem(marker(k));
  if(pending!=null)return parse(local.getItem(key(k)),k);
  try{
   const value=await idbGet(k);
   if(value!=null)return value;
   const legacy=local.getItem(key(k));
   if(legacy==null)return null;
   const restored=parse(legacy,k);
   try{await idbSet(k,restored);local.removeItem(key(k));}
   catch{/* Preserve the original fallback for the next read. */}
   return restored;
  }catch(error){
   // A missing fallback is not proof that IDB never held a shared sync base.
   const fallback=local.getItem(key(k));
   if(fallback!=null)return parse(fallback,k);
   throw Error('Device storage cannot confirm the previous sync base. Restore device storage before syncing.');
  }
 }
 async function set(k,value,{idbSet,local}){
  const record=JSON.parse(JSON.stringify(value));
  try{
   await idbSet(k,record);
   // Clearing the fallback marker before the fallback contents allows an
   // interrupted cleanup to prefer the now-durable IDB record.
   local.removeItem(marker(k));
   local.removeItem(key(k));
  }catch(error){
   // The payload must be present *before* the marker is set. Markers prevent
   // stale IDB values from overruling a newer localStorage fallback.
   local.setItem(key(k),JSON.stringify(record));
   local.setItem(marker(k),'1');
  }
 }
 async function remove(k,{idbRemove,local}){
  // Keep a marker when IDB deletion fails, so an old record cannot reappear.
  try{await idbRemove(k);local.removeItem(marker(k));local.removeItem(key(k));}
  catch(error){throw Error('Could not clear the device sync base safely. Try again after restoring device storage.');}
 }
 return {PREFIX,MARKER,key,marker,parse,get,set,remove};
});
