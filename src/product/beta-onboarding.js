(function(root){
 'use strict';
 const KEY='loadnote-native-welcome-v1';
 function diagnostics({version,platform,backend,saveStatus}){
  return {version:String(version||'Unknown'),platform:['ios','android'].includes(platform)?platform:'native',backend:['indexedDB','localStorage'].includes(backend)?backend:'Unknown',saveStatus:['pending','saved','failed'].includes(saveStatus)?saveStatus:'unknown'};
 }
 function start(){
  if(!root.LoadnoteRuntime?.native)return;
  const welcome=document.getElementById('native-beta-welcome'),tools=document.getElementById('native-beta-safety');
  if(!welcome||!tools)return;
  tools.hidden=false;
  try{welcome.hidden=localStorage.getItem(KEY)==='dismissed';}catch{welcome.hidden=false;}
  const account=document.getElementById('onboarding-account');
  if(account){account.removeAttribute('onclick');account.onclick=()=>openSafety();account.querySelector('b').textContent='Protect your local data';account.querySelector('.text-slate-500').textContent='Native beta has no account or cloud sync';}
  document.getElementById('native-welcome-dismiss').onclick=()=>{try{localStorage.setItem(KEY,'dismissed');welcome.hidden=true;}catch{welcome.hidden=true;}};
  document.getElementById('native-welcome-reopen').onclick=()=>{welcome.hidden=false;welcome.scrollIntoView({block:'start'});};
  document.getElementById('native-import-guide').onclick=()=>{document.getElementById('native-restore-guide').hidden=false;openSafety();};
  document.getElementById('native-diagnostics-refresh').onclick=refresh;
  refresh();
 }
 function openSafety(){root.showTab('tools');document.getElementById('native-beta-safety')?.scrollIntoView({block:'start'});refresh();}
 function refresh(){
  const host=document.getElementById('native-diagnostics');if(!host||!root.LoadnoteRuntime?.native)return;
  const value=diagnostics({version:root.LoadnoteCore?.RELEASE_VERSION,platform:root.LoadnoteRuntime.nativePlatform,backend:typeof storageBackend==='undefined'?null:storageBackend,saveStatus:root.LoadnoteSaveHealth});
  const status={pending:'Save pending — keep the app open',saved:'Last save succeeded (not a backup or device durability test)',failed:'Save failed — keep the app open and export now',unknown:'No save result available'};
  host.textContent='Version '+value.version+' · '+value.platform+' · Storage: '+value.backend+' · '+status[value.saveStatus];
 }
 const api={start,refresh,diagnostics};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LoadnoteBetaOnboarding=api;
})(typeof globalThis==='undefined'?this:globalThis);
