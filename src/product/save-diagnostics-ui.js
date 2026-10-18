/* A manual, local-only diagnostic receipt for beta testers. */
(function(root){
 'use strict';
 function refresh(){
  const field=document.getElementById('save-diagnostics-report');
  if(field&&root.LoadnoteSaveDiagnostics&&root.LoadnoteLocalSaveInfo)
   field.value=root.LoadnoteSaveDiagnostics.format(root.LoadnoteLocalSaveInfo());
 }
 function start(){
  const copy=document.getElementById('save-diagnostics-copy');
  if(!copy)return;
  const status=document.getElementById('save-diagnostics-copy-status');
  document.getElementById('save-diagnostics-refresh')?.addEventListener('click',refresh);
  copy.addEventListener('click',async()=>{
   refresh();
   try{
    if(!navigator.clipboard?.writeText)throw Error('unavailable');
    await navigator.clipboard.writeText(document.getElementById('save-diagnostics-report').value);
    status.textContent='Copied locally. Share only if you choose.';
   }catch{status.textContent='Copy unavailable. Select the report text manually.';}
  });
  refresh();
 }
 root.LoadnoteSaveDiagnosticsUI={refresh,start};
 if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',start);
})(typeof globalThis!=='undefined'?globalThis:this);
