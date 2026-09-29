/* v2.58 — compact account + remote-training storage status.
 * Status reads are safe; this UI never uploads, downloads into, or rewrites local training.
 */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let remoteRenderToken=0;
 async function renderRemote(host,accountId){
  const target=host.querySelector('#remote-training-status');if(!target)return;
  const token=++remoteRenderToken;
  if(!window.LoadnoteRemoteSync){target.innerHTML='<p class="more-hint">Remote training storage is unavailable in this build.</p>';return;}
  try{
   const status=await window.LoadnoteRemoteSync.status();
   if(token!==remoteRenderToken||!target.isConnected||host.dataset.accountId!==accountId)return;
   if(status.hasSnapshot){
    const records=Number.isFinite(Number(status.current?.records))?Number(status.current.records):null;
    const saved=status.updatedAt?new Date(status.updatedAt).toLocaleString():null;
    const detail=['Revision '+status.revision,records!=null?records+' structured records':null,saved?'saved '+saved:null].filter(Boolean).join(' · ');
    target.innerHTML='<p class="account-remote-title"><b>Remote training snapshot</b></p><p class="more-hint">'+esc(detail)+'</p><p class="more-hint">Automatic sync is off. This status check does not change training on this device.</p>';
   }else{
    target.innerHTML='<p class="account-remote-title"><b>Remote training storage</b></p><p class="more-hint">Ready, but no training snapshot is stored for this account yet. Automatic sync is off.</p>';
   }
  }catch(error){
   if(token!==remoteRenderToken||!target.isConnected)return;
   const unavailable=error?.code==='remote_storage_unavailable'||error?.status===503;
   target.innerHTML='<p class="account-remote-title"><b>Remote training storage</b></p><p class="more-hint">'+esc(unavailable?'Not configured for this server yet. Local training is unaffected.':'Could not check remote storage right now. Local training is unaffected.')+'</p>';
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
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">SIGNED IN</p><h3>'+esc(primary)+'</h3>'+(meta.length?'<p class="more-hint">'+esc(meta.join(' · '))+'</p>':'')+'</div><button type="button" class="btn-secondary text-sm" id="account-signout">Sign out</button></div><p class="more-hint">Your account identity is active. v2.58 can store a verified remote training snapshot, but this app does not automatically upload or merge your local history.</p><div id="remote-training-status" class="remote-training-status" aria-live="polite"><p class="more-hint">Checking remote training storage…</p></div>';
   void renderRemote(host,account.id);
   host.querySelector('#account-signout')?.addEventListener('click',async button=>{
    button.disabled=true;
    try{const response=await window.LoadnoteAccountSession.signOut();if(!response.ok)throw Error('Sign out failed');render();}
    catch(error){button.disabled=false;window.showToast?.('Could not sign out: '+error.message,'error');}
   });
   return;
  }
  delete host.dataset.accountId;
  if(session.status==='unknown'){
   host.innerHTML='<p class="more-hint">Checking account status…</p>';return;
  }
  if(session.loginAvailable){
   const label=session.provider?.name||'Sign in';
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">OPTIONAL ACCOUNT</p><h3>Keep an identity ready for protected backup &amp; sync services</h3></div><a class="btn-primary text-sm" href="/api/auth/login?returnTo=%2F">'+esc(label)+'</a></div><p class="more-hint">Signing in creates your Loadnote account identity. Local training is not uploaded automatically.</p>';
   return;
  }
  host.innerHTML='<p class="more-hint">Account sign-in is not configured for this build. Core training remains available locally on this device.</p>';
 }
 window.renderAccountStatus=render;
})();
