/* Explicit Coach-memory review UI. No transcript capture, auto-save or sync. */
(function(){
 'use strict';
 const M=()=>window.LoadnoteCoachMemory;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const visit='visit-'+Math.random().toString(36).slice(2,12).padEnd(8,'0');
 function scope(){
  const session=window.LoadnoteAccountSession?.snapshot?.()||{status:'unavailable'};
  if(window.Capacitor?.isNativePlatform?.())return 'local-device';
  return M().owner(session);
 }
 function store(){
  const s=scope();
  if(!s)throw Error('Account status is still loading. Check again once it is available.');
  return M().createStore(localStorage,s,{visit});
 }
 function current(){
  try{return store().read();}catch(e){return {records:[],nextVisit:[],error:String(e.message||e),scope:null};}
 }
 const nextVisit=()=>current().nextVisit||[];
 function open({proposal=null}={}){
  const u=window.LoadnoteReviewedPlanningUI;
  if(!u)return;
  const d=u.dialog('coach-memory-dialog','Things Coach remembers',
   '<p class="more-hint">Only notes you explicitly review and save are remembered. Chat messages are never saved here. Memories are local to this device and current account space, not included in workout backups or cloud sync. Avoid medical or other sensitive information.</p>'+
   '<p id="coach-memory-scope" class="more-hint"></p><div id="coach-memory-list"></div>'+
   '<form id="coach-memory-form"><h3 id="coach-memory-edit-title">Add a memory</h3>'+
   '<label for="coach-memory-type">Memory type</label><select class="input" id="coach-memory-type"></select>'+
   '<label for="coach-memory-text">Exact words to remember</label><textarea class="input" id="coach-memory-text" rows="2" maxlength="160" required></textarea>'+
   '<label for="coach-memory-expiry">Optional expiry date</label><input type="date" class="input" id="coach-memory-expiry">'+
   '<p class="more-hint">A follow-up is shown when you open Coach again in another app session. It is not a reminder, notification or background check.</p>'+
   '<button type="submit" class="btn-primary" id="coach-memory-save">Review and save memory</button> '+
   '<button type="button" class="btn-secondary" id="coach-memory-cancel-edit">Cancel edit</button></form>'+
   '<div class="profile-inline-actions"><button type="button" class="btn-secondary" id="coach-memory-export">Export memories</button> '+
   '<label class="btn-secondary">Import reviewed file <input id="coach-memory-import" type="file" accept="application/json,.json" style="max-width:180px"></label> '+
   '<button type="button" class="btn-secondary" id="coach-memory-clear">Clear all memories</button></div>'+
   '<p id="coach-memory-status" role="status" aria-live="polite"></p>');
  if(!d)return;
  const list=d.querySelector('#coach-memory-list'),form=d.querySelector('#coach-memory-form'),
   type=d.querySelector('#coach-memory-type'),note=d.querySelector('#coach-memory-text'),
   expiry=d.querySelector('#coach-memory-expiry'),status=d.querySelector('#coach-memory-status');
  type.innerHTML=Object.entries(M().TYPES).map(([id,label])=>'<option value="'+esc(id)+'">'+esc(label)+'</option>').join('');
  let initialScope=scope(),editing=null,revision=null;
  const tell=s=>{status.textContent=s;};
  const owns=()=>{if(scope()!==initialScope)throw Error('The account or profile changed. Close this review and reopen it in the correct space.');};
  const load=()=>{
   const snapshot=current();
   if(snapshot.error){
    list.innerHTML='<p>Saved memories are unreadable. You can delete this space’s unreadable memory file after confirming. Other training data and reply preferences will remain untouched.</p><button type="button" class="btn-secondary" id="coach-memory-recover">Erase unreadable memories</button>';
    list.querySelector('#coach-memory-recover').onclick=()=>{
     try{owns();if(!confirm('Erase the unreadable Coach memories for this space? This cannot be undone.'))return;
      store().resetUnreadable({confirmed:true});resetForm();load();tell('Unreadable Coach memories erased. Training history was not changed.');
     }catch(e){tell(e.message);}
    };
    form.hidden=true;d.querySelector('#coach-memory-scope').textContent=snapshot.error;revision=null;return;
   }
   form.hidden=false;revision=snapshot.revision;
   d.querySelector('#coach-memory-scope').textContent=initialScope==='local-device'?'Local device — not synchronized':'This signed-in account space on this device — not synchronized';
   list.innerHTML=snapshot.records.length?snapshot.records.map(r=>
     '<section class="card" data-coach-memory-id="'+esc(r.id)+'"><b>'+esc(M().TYPES[r.type])+'</b><p>'+esc(r.text)+'</p><p class="more-hint">Saved '+esc(r.createdAt.slice(0,10))+(r.expiresAt?' · Expires '+esc(r.expiresAt.slice(0,10)):'')+'</p>'+
     '<button type="button" class="btn-secondary" data-memory-edit="'+esc(r.id)+'">Edit</button> '+
     '<button type="button" class="btn-secondary" data-memory-delete="'+esc(r.id)+'">Delete</button></section>').join(''):
    '<p>No approved memories yet. You can add a short, non-sensitive note below.</p>';
   if(snapshot.expired)list.insertAdjacentHTML('beforeend','<p class="more-hint">'+snapshot.expired+' expired '+(snapshot.expired===1?'entry is':'entries are')+' hidden. Clear or replace memories to remove expired records.</p>');
   d.querySelector('#coach-memory-clear').disabled=!snapshot.saved;
   d.querySelector('#coach-memory-export').disabled=!snapshot.saved;
  };
  function resetForm(){
   editing=null;type.value='reason';note.value='';expiry.value='';
   d.querySelector('#coach-memory-edit-title').textContent='Add a memory';
   d.querySelector('#coach-memory-save').textContent='Review and save memory';
  }
  list.addEventListener('click',e=>{
   const edit=e.target.closest('[data-memory-edit]'),del=e.target.closest('[data-memory-delete]');
   if(!edit&&!del)return;
   try{
    owns();const snap=current();if(snap.error)throw Error(snap.error);
    const row=snap.records.find(r=>r.id===(edit?.dataset.memoryEdit||del?.dataset.memoryDelete));if(!row)throw Error('Memory changed. Reopen this review.');
    if(edit){editing=row.id;type.value=row.type;note.value=row.text;expiry.value=row.expiresAt?.slice(0,10)||'';d.querySelector('#coach-memory-edit-title').textContent='Edit reviewed memory';d.querySelector('#coach-memory-save').textContent='Review and save edit';note.focus();return;}
    if(!confirm('Delete this memory? This does not delete training history.'))return;
    store().remove(row.id,{expectedRevision:revision,confirmed:true});tell('Memory deleted. Training history was not changed.');resetForm();load();
   }catch(e){tell(e.message);}
  });
  form.addEventListener('submit',e=>{
   e.preventDefault();
   try{
    owns();
    const value=note.value.trim(),date=expiry.value,
      expire=date?new Date(date+'T23:59:59.999Z').toISOString():null;
    if(!confirm('Save this '+M().TYPES[type.value]+' exactly as written?\n'+value))return;
    store().save({id:editing,type:type.value,text:value,expiresAt:expire},{expectedRevision:revision,confirmed:true});
    tell('Memory saved on this device. It was not added to training history or cloud sync.');resetForm();load();
   }catch(e){tell(e.message);}
  });
  d.querySelector('#coach-memory-cancel-edit').onclick=resetForm;
  d.querySelector('#coach-memory-clear').onclick=()=>{
   try{
    owns();if(!confirm('Clear ALL approved Coach memories in this space? Training logs and reply preferences stay untouched.'))return;
    store().clear({expectedRevision:revision,confirmed:true});resetForm();load();tell('All approved memories in this space were removed.');
   }catch(e){tell(e.message);}
  };
  d.querySelector('#coach-memory-export').onclick=()=>{
   try{
    owns();const contents=store().exportData(),blob=new Blob([contents],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='loadnote-coach-memories.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
    tell('Export requested. Verify the file was saved by your browser before relying on it as a backup.');
   }catch(e){tell(e.message);}
  };
  d.querySelector('#coach-memory-import').addEventListener('change',async e=>{
   const file=e.target.files?.[0];e.target.value='';if(!file)return;
   try{
    owns();if(file.size>25000)throw Error('Memory file exceeds the 25 KB import limit.');
    const content=await file.text();owns();
    if(!confirm('Replace this space’s approved memories with the reviewed file? Existing memories will be overwritten.'))return;
    store().importData(content,{expectedRevision:revision,confirmed:true});
    resetForm();load();tell('Approved memory file restored in this account space. Training records were not changed.');
   }catch(e){tell('Import did not change memories: '+e.message);}
  });
  resetForm();
  if(proposal&&M().TYPES[proposal.type]){
   type.value=proposal.type;note.value=String(proposal.text||'').slice(0,160);
  }
  load();
 }
 window.LoadnoteCoachMemoryUI={open,current,nextVisit,scope};
})();