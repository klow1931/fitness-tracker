/* v2.57 — compact account status. Training remains local until cloud sync is implemented. */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const host=document.getElementById('account-status');if(!host||!window.LoadnoteAccountSession)return;
  const session=window.LoadnoteAccountSession.snapshot();
  if(session.status==='authenticated'&&session.account){
   const account=session.account,primary=account.displayName||account.email||'Signed-in Loadnote account';
   const meta=[account.email&&account.email!==primary?account.email:null,Array.isArray(account.providers)?account.providers.join(', '):(account.provider||session.provider?.name),session.expiresAt?'Session expires '+new Date(session.expiresAt).toLocaleString():null].filter(Boolean);
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">SIGNED IN</p><h3>'+esc(primary)+'</h3>'+(meta.length?'<p class="more-hint">'+esc(meta.join(' · '))+'</p>':'')+'</div><button type="button" class="btn-secondary text-sm" id="account-signout">Sign out</button></div><p class="more-hint">Your account identity is active. Workout history still stays on this device in v2.57; cloud training sync is not enabled yet.</p>';
   host.querySelector('#account-signout')?.addEventListener('click',async button=>{
    button.disabled=true;
    try{const response=await window.LoadnoteAccountSession.signOut();if(!response.ok)throw Error('Sign out failed');render();}
    catch(error){button.disabled=false;window.showToast?.('Could not sign out: '+error.message,'error');}
   });
   return;
  }
  if(session.status==='unknown'){
   host.innerHTML='<p class="more-hint">Checking account status…</p>';return;
  }
  if(session.loginAvailable){
   const label=session.provider?.name||'Sign in';
   host.innerHTML='<div class="account-status-head"><div><p class="eyebrow">OPTIONAL ACCOUNT</p><h3>Keep an identity ready for future sync</h3></div><a class="btn-primary text-sm" href="/api/auth/login?returnTo=%2F">'+esc(label)+'</a></div><p class="more-hint">Signing in creates your Loadnote account identity. Training data remains local until cloud synchronization is introduced in a later release.</p>';
   return;
  }
  host.innerHTML='<p class="more-hint">Account sign-in is not configured for this build. Core training remains available locally on this device.</p>';
 }
 window.renderAccountStatus=render;
})();
