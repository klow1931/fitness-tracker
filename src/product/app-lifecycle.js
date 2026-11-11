(function(){
 'use strict';
 function connection(){const el=document.getElementById('connection-status');if(el)el.textContent=window.LoadnoteRuntime?.native?'Native beta · local training · account, cloud and online AI unavailable':navigator.onLine?'Online · training saved on this device':'Offline · log workouts; online coach and food lookup need internet';}
 async function start(){
  const platform=window.LoadnotePlatform?.detect(window)||{surface:'browser',native:false,nativePlatform:null,standalone:false};
  window.LoadnoteRuntime=window.LoadnotePlatform?.apply(document,platform)||platform;
  window.LoadnoteBetaOnboarding?.start();
  connection();window.addEventListener('online',connection);window.addEventListener('offline',connection);
  const refreshAccount=()=>{if(navigator.onLine)void window.LoadnoteAccountSession?.refresh().then(()=>window.renderAccountStatus?.());};
  refreshAccount();window.addEventListener('online',refreshAccount);
  const versionStatus=document.getElementById('app-version-status'),versionAPI=window.LoadnoteAppVersion,installed=window.LoadnoteCore?.RELEASE_VERSION;
  let waitingShown=false,latest=null,versionState=platform.native?'native':navigator.onLine?'unchecked':'offline';
  const renderVersion=()=>{if(versionStatus&&versionAPI&&installed)versionStatus.textContent=versionAPI.describe(installed,latest,waitingShown?'waiting':versionState);};
  renderVersion();window.addEventListener('offline',()=>{if(!platform.native){latest=null;versionState='offline';renderVersion();}});
  // Installed native assets update through the signed app, not a web cache.
  if(platform.native||!('serviceWorker' in navigator))return;
  const banner=document.getElementById('app-update'),status=document.getElementById('app-update-status'),button=document.getElementById('apply-app-update');
  const checkButton=document.getElementById('check-app-update'),repairButton=document.getElementById('repair-offline-cache'),checkStatus=document.getElementById('update-check-status');
  try{
   const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
   if(!registration){
     banner.hidden=false;button.hidden=true;status.textContent='Offline updates are unavailable in this browser session. Keep your local data and export a backup before changing the installation.';
     connection();return; // Some managed/test browsers decline registration without rejecting.
   }
   checkButton.hidden=false;
   const warn=message=>{banner.hidden=false;button.hidden=true;status.textContent=message;};
   const show=()=>{
     if(registration.waiting&&navigator.serviceWorker.controller){
       waitingShown=true;banner.hidden=false;button.hidden=false;status.textContent='A newer Loadnote version is ready. Save your workout and update when you are ready.';renderVersion();
     }else if(waitingShown){
       // First-install takeover can consume a briefly waiting worker. Restore the
       // previous check result; cache readiness alone never proves live currency.
       waitingShown=false;banner.hidden=true;button.hidden=true;renderVersion();
     }
   };
   const workerState=worker=>{
     if(worker?.state==='redundant'&&!registration.waiting)warn('The update could not finish installing. Your workouts are unchanged. Keep this app and its data; open Device & backup to retry or export a backup.');
     else show();
   };
   const checkOfflineCache=()=>navigator.serviceWorker.controller?.postMessage({type:'CHECK_OFFLINE_CACHE'});
   // Installed pages may stay open for days: check when the athlete returns, not only at first load.
   // Only ask the browser to fetch the service worker; never activate a new app during a workout.
   let lastCheck=0,checking=false;
   const check=async(force=false)=>{
     if(registration.waiting&&!force){show();return;}
     if(!navigator.onLine){if(force){checkStatus.textContent='Connect to the internet to check for updates. Your saved data is unchanged.';latest=null;versionState='offline';renderVersion();}return;}
     if(!force&&(document.hidden||Date.now()-lastCheck<60000))return;
     if(checking)return;
     lastCheck=Date.now();
     checking=true;if(force){checkButton.disabled=true;checkStatus.textContent='Checking for an update…';}
     let versionTimer;
     try{
       if(force&&versionAPI){
         latest=null;versionState='checking';renderVersion();
         const controller=new AbortController();versionTimer=setTimeout(()=>controller.abort(),10000);
         try{latest=await versionAPI.fetchLatest(window.fetch.bind(window),controller.signal);versionState='checked';}
         catch(error){versionState=navigator.onLine?'failed':'offline';}
         finally{clearTimeout(versionTimer);renderVersion();}
       }
       if(!registration.waiting)await registration.update();show();
       if(force&&registration.waiting)checkStatus.textContent='An update is ready above. Save your workout before applying it.';
       if(force&&!registration.waiting)checkStatus.textContent='Update check completed. If a new version is installing, the update prompt will appear shortly.';
     }catch(error){if(force)checkStatus.textContent='Update check failed. Keep your data and try again online; no reset is needed.';}
     finally{clearTimeout(versionTimer);checking=false;checkButton.disabled=false;}
   };
   checkButton.addEventListener('click',()=>{void check(true);});
   let repairTimer=null;
   const clearRepairTimer=()=>{clearTimeout(repairTimer);repairTimer=null;};
   const watchRepair=()=>{clearRepairTimer();repairTimer=setTimeout(()=>{
     repairButton.hidden=false;repairButton.disabled=false;
     checkStatus.textContent='Offline repair is taking longer than expected. Keep Loadnote online and retry. Your saved workouts are unchanged.';
   },45000);};
   repairButton.addEventListener('click',()=>{
     if(!navigator.onLine){checkStatus.textContent='Connect to the internet before repairing offline files.';return;}
     if(!navigator.serviceWorker.controller){checkStatus.textContent='Reopen Loadnote before repairing offline files.';return;}
     repairButton.disabled=true;checkStatus.textContent='Repairing offline files…';watchRepair();
     navigator.serviceWorker.controller.postMessage({type:'REPAIR_OFFLINE_CACHE'});
   });
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
   window.addEventListener('focus',()=>{void check();});
   window.addEventListener('online',()=>{void check();});
   show();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>workerState(worker));workerState(worker);});
   if(registration.installing){const worker=registration.installing;worker.addEventListener('statechange',()=>workerState(worker));}
   void check();
   let requested=false;
   navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requested)location.reload();else{show();checkOfflineCache();}});
   navigator.serviceWorker.addEventListener('message',event=>{
     if(event.data?.type==='UPDATE_BLOCKED'){requested=false;button.disabled=false;status.textContent='Close other Loadnote tabs before updating, then try again.';}
     if(event.data?.type==='OFFLINE_CACHE_PROGRESS'){
       const value=event.data,cached=Number(value.cached),total=Number(value.total);
       if(!Number.isInteger(cached)||!Number.isInteger(total)||total<1||cached<0||cached>total)return;
       repairButton.hidden=false;repairButton.disabled=true;watchRepair();
       checkStatus.textContent='Preparing offline use · '+cached+' of '+total+' files saved. Keep Loadnote online.';
       if(!registration.waiting){banner.hidden=false;button.hidden=true;status.textContent='Preparing Loadnote for offline use. Your training data is saved separately.';}
       return;
     }
     if(event.data?.type==='OFFLINE_CACHE_INCOMPLETE'||event.data?.type==='OFFLINE_CACHE_STATUS'&&!event.data.ready){
       clearRepairTimer();
       repairButton.hidden=false;repairButton.disabled=false;
       const missing=Number(event.data.failed),total=Number(event.data.total);
       checkStatus.textContent=Number.isInteger(missing)&&Number.isInteger(total)&&missing>0&&missing<=total
        ?missing+' of '+total+' offline files could not be saved. Completed downloads are kept. Retry Repair offline files online; your workouts are unchanged.'
        :'Offline files are incomplete. Keep Loadnote online and use Repair offline files. Your workouts are unchanged.';
       if(!registration.waiting)warn('Loadnote needs to finish downloading offline files. Open Device & backup, then tap Repair offline files. Do not clear website data.');
     }else if(event.data?.type==='OFFLINE_CACHE_STATUS'&&event.data.ready){
       clearRepairTimer();show();
       repairButton.hidden=true;repairButton.disabled=false;checkStatus.textContent='Offline app files are ready.';
       if(!registration.waiting&&button.hidden)banner.hidden=true;
     }
   });
   if(navigator.serviceWorker.controller)checkOfflineCache();
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     if(!saveLoggerDraft())throw Error('Unfinished workout could not be saved');
     clearTimeout(saveTimer);await persistNow(data);
     if(!registration.waiting){status.textContent='Update no longer waiting. Reopen the app when ready.';button.disabled=false;return;}
     requested=true;registration.waiting.postMessage({type:'APPLY_UPDATE'});
    }catch(error){requested=false;button.disabled=false;status.textContent='Could not save. Update paused; export a backup before closing.';reportStorageFailure(error);}
   });
  }catch(error){
    document.getElementById('connection-status').textContent='Offline setup unavailable. Keep this page open while training.';
    banner.hidden=false;button.hidden=true;status.textContent='The update checker could not start. Your local data is unchanged; export a backup before trying a new installation.';
  }
 }
 window.LoadnoteLifecycle={start};
})();
