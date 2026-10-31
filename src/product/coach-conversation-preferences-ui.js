(function(){
 'use strict';
 const P=()=>window.LoadnoteCoachConversationPreferences;
 function store(){return P().createStore(window.localStorage);}
 function current(){try{return store().read();}catch{return {saved:false,preferences:{...P().DEFAULTS},error:'Communication storage is unavailable. Defaults are in use.'};}}
 function open({proposal=null}={}){
  const u=window.LoadnoteReviewedPlanningUI;if(!u)return;
  const snapshot=current();let value=snapshot.preferences;
  if(proposal)try{value=P().normalize(proposal);}catch{}
  const d=u.dialog('coach-communication-dialog','Conversation preferences','<p>Optional settings for this device. Saving stores only reply length and encouragement style—not chat, feelings or workout data. These settings are separate from training backups and sync.</p><form id="coach-communication-form"><label for="coach-reply-length">Reply length</label><select id="coach-reply-length" class="input"><option value="brief">Brief</option><option value="standard">Standard</option><option value="detail">More detail</option></select><label for="coach-encouragement">Encouragement</label><select id="coach-encouragement" class="input"><option value="calm">Calm</option><option value="upbeat">Upbeat</option></select><p>Length applies to supportive conversation. Training explanations keep the context needed to interpret them.</p><button type="submit" class="btn-primary">Save preferences</button><button type="button" class="btn-secondary" id="coach-communication-clear">Remove saved preferences</button><p id="coach-communication-status" role="status"></p></form>');
  if(!d)return;
  const length=d.querySelector('#coach-reply-length'),encouragement=d.querySelector('#coach-encouragement'),status=d.querySelector('#coach-communication-status');
  length.value=value.length;encouragement.value=value.encouragement;
  status.textContent=snapshot.error||(snapshot.saved?'Preferences are saved on this device.':'No communication preferences have been saved.');
  d.querySelector('form').onsubmit=e=>{e.preventDefault();try{store().save({version:1,length:length.value,encouragement:encouragement.value});status.textContent='Preferences saved on this device.';}catch{status.textContent='Preferences could not be saved. The previously saved settings remain in use.';}};
  d.querySelector('#coach-communication-clear').onclick=()=>{try{store().clear();length.value=P().DEFAULTS.length;encouragement.value=P().DEFAULTS.encouragement;status.textContent='Saved communication preferences removed. Defaults are in use.';}catch{status.textContent='Preferences could not be removed. The previously saved settings remain in use.';}};
 }
 window.LoadnoteCoachConversationPreferencesUI={open,current};
})();
