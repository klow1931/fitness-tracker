(function(){
 'use strict';
 function connection(){const el=document.getElementById('connection-status');if(el)el.textContent=navigator.onLine?'Online · food lookup and online coach available':'Offline · log workouts; online coach and food lookup need internet';}
 async function start(){
  connection();window.addEventListener('online',connection);window.addEventListener('offline',connection);
  if(!('serviceWorker' in navigator))return;
  const banner=document.getElementById('app-update'),status=document.getElementById('app-update-status'),button=document.getElementById('apply-app-update');
  try{
   const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
   const show=()=>{if(registration.waiting&&navigator.serviceWorker.controller)banner.hidden=false;};
   show();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',show);});
   let requested=false;
   navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requested)location.reload();});
   navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='UPDATE_BLOCKED'){requested=false;button.disabled=false;status.textContent='Close other Loadnote tabs before updating, then try again.';}});
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     // Persist directly: saveLoggerDraft reports errors but intentionally swallows them.
     if(loggerHasContent())localStorage.setItem(LOGGER_DRAFT_KEY,JSON.stringify(captureLoggerDraft()));
     else localStorage.removeItem(LOGGER_DRAFT_KEY);
     clearTimeout(saveTimer);await persistNow(data);
     if(!registration.waiting){status.textContent='Update no longer waiting. Reopen the app when ready.';button.disabled=false;return;}
     requested=true;registration.waiting.postMessage({type:'APPLY_UPDATE'});
    }catch(error){requested=false;button.disabled=false;status.textContent='Could not save. Update paused; export a backup before closing.';reportStorageFailure(error);}
   });
  }catch(error){document.getElementById('connection-status').textContent='Offline setup unavailable. Keep this page open while training.';}
 }
 window.LoadnoteLifecycle={start};
})();
