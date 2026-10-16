/* Compact Profile appearance controls; never writes workout or account data. */
(function(){
 'use strict';
 const A=()=>window.LoadnoteAppearance;
 const palettes=[['indigo','Indigo'],['ocean','Ocean'],['emerald','Emerald'],['crimson','Crimson'],['amber','Amber'],['slate','Slate']];
 function markup(){
  const p=A()?.current()||{mode:'light',palette:'indigo',customColor:null};
  return '<details id="profile-appearance" class="profile-appearance"><summary><b>Appearance</b><small>Color theme and light / dark display</small></summary>'+
   '<div class="profile-appearance-body">'+
   '<p class="more-hint">Choose how Loadnote looks on this device. Workout history and training data do not change.</p>'+
   '<fieldset><legend>Color theme</legend><div class="appearance-palette" role="group" aria-label="Color theme">'+
   palettes.map(([id,name])=>'<button type="button" class="appearance-swatch" data-appearance-palette="'+id+'" aria-label="'+name+' theme" aria-pressed="false"><span class="appearance-swatch-color" style="background:'+A().PALETTES[id]+'"></span><span>'+name+'</span></button>').join('')+
   '</div></fieldset>'+
   '<label class="appearance-custom-row" for="appearance-custom-color"><span><b>Custom accent</b><small>Choose a color; Loadnote adjusts it for readable button text.</small></span>'+
   '<input id="appearance-custom-color" type="color" aria-label="Custom accent color" value="'+(p.customColor||'#4f46e5')+'"></label>'+
   '<fieldset><legend>Display mode</legend><div class="appearance-mode" role="group" aria-label="Display mode">'+
   ['light','dark','system'].map(mode=>'<button type="button" class="btn-secondary" data-appearance-mode="'+mode+'" aria-pressed="false">'+(mode==='system'?'System':mode==='dark'?'Dark':'Light')+'</button>').join('')+'</div></fieldset>'+
   '<div class="appearance-preview" aria-label="Theme preview"><span class="appearance-preview-label">Preview</span><div><b>Today's workout</b><span class="appearance-preview-action">Start workout</span></div></div>'+
   '<div class="appearance-actions"><button type="button" class="btn-secondary" id="appearance-reset">Reset to default</button><span id="appearance-status" role="status" aria-live="polite"></span></div>'+
   '</div></details>';
 }
 function bind(host,refresh){
  const area=host.querySelector('#profile-appearance');if(!area||!A())return;
  const status=area.querySelector('#appearance-status');
  function paint(){
   const p=A().current();
   area.querySelectorAll('[data-appearance-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appearanceMode===p.mode)));
   area.querySelectorAll('[data-appearance-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appearancePalette===p.palette)));
   area.querySelector('#appearance-custom-color').value=p.customColor||'#4f46e5';
   area.querySelector('.appearance-preview-action').textContent='Start workout';
  }
  function change(operation){
   try{operation();refresh();paint();status.textContent='Appearance saved on this device.';}
   catch(e){status.textContent=e.message;}
  }
  area.querySelectorAll('[data-appearance-mode]').forEach(b=>b.addEventListener('click',()=>change(()=>A().set({mode:b.dataset.appearanceMode}))));
  area.querySelectorAll('[data-appearance-palette]').forEach(b=>b.addEventListener('click',()=>change(()=>A().set({palette:b.dataset.appearancePalette}))));
  area.querySelector('#appearance-custom-color').addEventListener('change',e=>change(()=>A().set({palette:'custom',customColor:e.target.value})));
  area.querySelector('#appearance-reset').addEventListener('click',()=>change(()=>A().reset()));
  paint();
 }
 window.LoadnoteAppearanceUI={markup,bind};
})();