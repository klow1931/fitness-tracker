/* Local-only, privacy-safe support receipt. Never include workout content, names,
 * account identities, errors' raw messages, or storage keys. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteSaveDiagnostics=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const validStamp=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value;
 const storageError=error=>{
  const name=String(error?.name||'');
  const message=String(error?.message||'');
  if(name==='QuotaExceededError'||/quota|storage full|disk full|not enough space/i.test(message))return 'storage-full';
  if(name==='SecurityError'||/permission denied|securityerror|access denied/i.test(message))return 'permission';
  if(name==='AbortError'||/abort|transaction/i.test(message))return 'transaction';
  return 'storage-error';
 };
 function collect({version,platform,backend,status,lastSavedAt,errorCode}={}){
  return {
   version:/^\d+\.\d+\.\d+$/.test(String(version))?String(version):'unknown',
   platform:['web','ios','android'].includes(platform)?platform:'unknown',
   backend:['indexedDB','localStorage'].includes(backend)?backend:'unknown',
   status:['pending','saved','failed'].includes(status)?status:'unknown',
   lastSavedAt:validStamp(lastSavedAt)?lastSavedAt:null,
   errorCode:['storage-full','permission','transaction','storage-error'].includes(errorCode)?errorCode:null
  };
 }
 function format(raw){
  const d=collect(raw);
  return ['Loadnote local save diagnostics (no training records)',
   'Version: '+d.version,'Platform: '+d.platform,'Storage: '+d.backend,
   'Last save state: '+d.status,'Last successful save in this session: '+(d.lastSavedAt||'unknown'),
   'Failure category: '+(d.errorCode||'none recorded'),
   d.backend==='localStorage'?'Fallback storage active: export and verify an external JSON backup.':'A save confirmation is not a verified external backup.',
   'No data was sent. Device restart and file restore must be tested separately.'].join('\n');
 }
 return {storageError,collect,format};
});
