/* v2.59 — compact account status and explicit conflict-first training sync. */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let remoteRenderToken=0,syncBusy=false;
 const coordinator=()=>window.LoadnoteSyncCoordinator;
 const stateStore=()=>window.LoadnoteStateStore;
 function activeDraft(){
  try{return typeof window.loggerHasContent==='function'&&window.loggerHasContent();}catch{return false;}
 }
 function button(label,id,kind='primary'){
  return '<button type="button" class="btn-'+kind+' text-sm" id="'+id+'">'+esc(label)+'</button>';
 }
 function renderSyncBlocked(target,result){
  const detail=result?.preflight?.issues?.[0]?.detail||result?.message||'Sync cannot continue safely yet.';
  target.innerHTML='<p class="account-remote-title"><b>Sync needs review</b></p><p class="more-hint">'+esc(detail)+'</p><p class="more-hint">Training on this device is unchanged.</p>'+button('Check again','account-sync-now','secondary');
 }
 function conflictRows(preview){
  const items=(preview.plan?.items||[]).filter(item=>item.resolution==='conflict');
  return items.map((item,index)=>{
   const label=coordinator().conflictLabel(item),local=coordinator().conflictSummary(item.local),remote=coordinator().conflictSummary(item.remote);
   return '<div class="sync-conflict-item"><p><b>'+esc(label)+'</b></p><div class="sync-conflict-versions"><div><span class="sync-version-label">This device</span><p class="more-hint">'+esc(local)+'</p></div><div><span class="sync-version-label">Cloud</span><p class="more-hint">'+esc(remote)+'</p></div></div><label class="label" for="sync-choice-'+index+'">Keep which version?</label><select class="input sync-conflict-choice" id="sync-choice-'+index+'" data-sync-key="'+esc(window.LoadnoteSync.itemKey(item))+'"><option value="">Choose…</option><option value="local">Keep this device</option><option value="remote">Keep cloud</option></select></div>';
  }).join('');
 }
 function bindRetry(target,accountId){target.querySelector('#account-sync-now')?.addEventListener('click',()=>void startSync(target,accountId));}
 async function applyAndAcknowledge(target,accountId,result){
  try{
   if(result.applyRequired){
    await stateStore().applySyncedState(result.state,{label:'Before account sync'});
   }
   await coordinator().acknowledge(accountId,result.base);
   const changes=[];
   if(result.uploadRequired)changes.push('cloud updated');
   if(result.applyRequired)changes.push('this device updated');
   target.innerHTML='<p class="account-remote-title"><b>Synced</b></p><p class="more-hint">Revision '+esc(result.revision)+(changes.length?' · '+esc(changes.join(' · ')):' · already current')+'</p><p class="more-hint">A recovery snapshot was created before any incoming training data was applied.</p>'+button('Sync again','account-sync-now','secondary');
   bindRetry(target,accountId);
   window.showToast?.('Training sync complete','success');
  }catch(error){
   target.innerHTML='<p class="account-remote-title"><b>Device update not completed</b></p><p class="more-hint">The cloud step may have completed, but Loadnote could not safely apply or acknowledge it on this device. Your previous local training remains available. Run sync again.</p><p class="more-hint">'+esc(error.message||'Device storage failed')+'</p>'+button('Sync again','account-sync-now','secondary');
   bindRetry(target,accountId);
   window.showToast?.('Sync needs another pass','error');
  }
 }
 async function commitPreview(target,accountId,preview,options={}){
  const local=stateStore().current();
  target.innerHTML='<p class="account-remote-title"><b>Syncing training…</b></p><p class="more-hint">Checking the current cloud revision before committing changes.</p>';
  const result=await coordinator().commit(preview,local,{...options,releaseVersion:window.LoadnoteCore?.RELEASE_VERSION||local.releaseVersion||''});
  if(result.status==='stale'){
   target.innerHTML='<p class="account-remote-title"><b>Cloud changed during review</b></p><p class="more-hint">'+esc(result.message)+'</p>'+button('Review latest','account-sync-now','secondary');
   bindRetry(target,accountId);return;
  }
  if(result.status==='blocked'){renderSyncBlocked(target,result);bindRetry(target,accountId);return;}
  if(result.status==='review'){renderConflictReview(target,accountId,result.preview||preview);return;}
  await applyAndAcknowledge(target,accountId,result);
 }
 function renderFirstLink(target,accountId,preview){
  target.innerHTML='<p class="account-remote-title"><b>Choose the starting copy</b></p><p class="more-hint">This device and the cloud already contain different training data, but they have never shared a verified sync base. Loadnote will not guess or combine them.</p><div class="sync-choice-actions">'+button('Keep this device','sync-first-local','secondary')+button('Use cloud on this device','sync-first-remote','primary')+'</div><p class="more-hint">Using cloud creates a local recovery snapshot first. Keeping this device replaces the cloud snapshot only after a revision check.</p>';
  target.querySelector('#sync-first-local')?.addEventListener('click',()=>void commitPreview(target,accountId,preview,{choice:'local'}));
  target.querySelector('#sync-first-remote')?.addEventListener('click',()=>void commitPreview(target,accountId,preview,{choice:'remote'}));
 }
 function renderConflictReview(target,accountId,preview){
  const count=preview.plan?.counts?.conflicts||0;
  target.innerHTML='<p class="account-remote-title"><b>'+esc(count)+' sync conflict'+(count===1?'':'s')+'</b></p><p class="more-hint">The same saved item changed differently on this device and in the cloud. Nothing will be overwritten until every conflict has a choice.</p><div class="sync-conflict-list">'+conflictRows(preview)+'</div>'+button('Apply choices & sync','sync-resolve','primary')+' '+button('Cancel','sync-cancel','secondary');
  target.querySelector('#sync-cancel')?.addEventListener('click',()=>void renderRemote(document.getElementById('account-status'),accountId));
  target.querySelector('#sync-resolve')?.addEventListener('click',()=>{
   const resolutions={},choices=[...target.querySelectorAll('.sync-conflict-choice')];
   if(choices.some(select=>!select.value)){window.showToast?.('Choose a version for every conflict','error');return;}
   for(const select of choices)resolutions[select.dataset.syncKey]=select.value;
   void commitPreview(target,accountId,preview,{resolutions});
  });
 }
 async function startSync(target,accountId){
  if(syncBusy)return;
  if(activeDraft()){
   target.innerHTML='<p class="account-remote-title"><b>Finish the active workout first</b></p><p class="more-hint">Loadnote will not apply account data while an unfinished workout is open. Save or clear the workout, then sync.</p>'+button('Check again','account-sync-now','secondary');
   bindRetry(target,accountId);return;
  }
  if(!coordinator()||!stateStore()){
   target.innerHTML='<p class="more-hint">Account sync is unavailable in this build.</p>';return;
  }
  syncBusy=true;
  target.innerHTML='<p class="account-remote-title"><b>Checking training…</b></p><p class="more-hint">Comparing this device with the latest cloud revision.</p>';
  try{
   const preview=await coordinator().preview(stateStore().current(),{accountId});
   if(preview.status==='blocked'){renderSyncBlocked(target,preview);bindRetry(target,accountId);}
   else if(preview.mode==='first-link')renderFirstLink(target,accountId,preview);
   else if(preview.mode==='conflict')renderConflictReview(target,accountId,preview);
   else await commitPreview(target,accountId,preview);
  }catch(error){
   target.innerHTML='<p class="account-remote-title"><b>Sync unavailable</b></p><p class="more-hint">'+esc(error.message||'Could not reach account storage.')+'</p><p class="more-hint">Local training is unaffected.</p>'+button('Try again','account-sync-now','secondary');
   bindRetry(target,accountId);
  }finally{syncBusy=false;}
 }
 async function renderRemote(host,accountId){
  const target=host?.querySelector('#remote-training-status');if(!target)return;
  const token=++remoteRenderToken;
  if(!window.LoadnoteRemoteSync){target.innerHTML='<p class="more-hint">Remote training storage is unavailable in this build.</p>';return;}
  try{
   const status=await window.LoadnoteRemoteSync.status();
   if(token!==remoteRenderToken||!target.isConnected||host.dataset.accountId!==accountId)return;
   if(status.hasSnapshot){
    const records=Number.isFinite(Number(status.current?.records))?Number(status.current.records):null;
    const saved=status.updatedAt?new Date(status.updatedAt).toLocaleString():null;
    const detail=['Cloud revision '+status.revision,records!=null?records+' structured records':null,saved?'saved '+saved:null].filter(Boolean).join(' · ');
    target.innerHTML='<p class="account-remote-title"><b>Training sync</b></p><p class="more-hint">'+esc(detail)+'</p><p class="more-hint">Sync is manual in v2.59. Workout logging remains local and works offline.</p>'+button('Sync now','account-sync-now','primary');
   }else{
    target.innerHTML='<p class="account-remote-title"><b>Training sync</b></p><p class="more-hint">Cloud storage is ready but empty. Sync now will create the first verified account snapshot.</p>'+button('Sync now','account-sync-now','primary');
   }
   bindRetry(target,accountId);
  }catch(error){
   if(token!==remoteRenderToken||!target.isConnected)return;
   const unavailable=error?.code==='remote_storage_unavailable'||error?.status===503;
   target.innerHTML='<p class="account-remote-title"><b>Training sync</b></p><p class="more-hint">'+esc(unavailable?'Not configured for this server yet. Local training is unaffected.':'Could not check cloud storage right now. Local training is unaffected.')+'</p>';
  }
 }
 function render(){
  const host=document.getElementById('account-status');if(!host||!window.LoadnoteAccountSession)return;
  const session=window.LoadnoteAccountSession.snapshot();
  remoteRenderToken++;
  if(session.status==='authenticated'&&session.account){
   const account=session.account,primary=account.displayName||account.email||'Signed-in Loadnote account';
   const meta=[account.email&&account.email!==primary?account.email:null,Array.isArray(account.providers)?account.providers.join(', '):(account.provider||session.provider?.name),session.expiresAt?'Session expires '+new Date(session.expiresAt).toLocaleString():null].filter(Boolean);
   host.dataset.accountId=account.id;
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">SIGNED IN</p><h3>'+esc(primary)+'</h3>'+(meta.length?'<p class="more-hint">'+esc(meta.join(' · '))+'</p>':'')+'</div><button type="button" class="btn-secondary text-sm" id="account-signout">Sign out</button></div><p class="more-hint">Your account can back up and manually synchronize structured training data across devices. Loadnote never uses last-write-wins for conflicting training records.</p><div id="remote-training-status" class="remote-training-status" aria-live="polite"><p class="more-hint">Checking cloud training…</p></div>';
   void renderRemote(host,account.id);
   host.querySelector('#account-signout')?.addEventListener('click',async button=>{
    button.disabled=true;
    try{const response=await window.LoadnoteAccountSession.signOut();if(!response.ok)throw Error('Sign out failed');render();}
    catch(error){button.disabled=false;window.showToast?.('Could not sign out: '+error.message,'error');}
   });
   return;
  }
  delete host.dataset.accountId;
  if(session.status==='unknown'){host.innerHTML='<p class="more-hint">Checking account status…</p>';return;}
  if(session.loginAvailable){
   const label=session.provider?.name||'Sign in';
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">OPTIONAL ACCOUNT</p><h3>Back up and sync training across devices</h3></div><a class="btn-primary text-sm" href="/api/auth/login?returnTo=%2F">'+esc(label)+'</a></div><p class="more-hint">An account is optional. Training, history and programming continue to work locally without signing in.</p>';
   return;
  }
  host.innerHTML='<p class="more-hint">Account sign-in is not configured for this build. Core training remains available locally on this device.</p>';
 }
 window.renderAccountStatus=render;
})();
