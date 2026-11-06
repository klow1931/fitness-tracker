/* v7.2 — first-run display choice; conversion and persistence stay in units.js. */
(function(){
 'use strict';
 function refresh(){
  if(typeof currentUnit!=='function')return;
  for(const button of document.querySelectorAll('[data-start-unit]')){
   const selected=button.dataset.startUnit===currentUnit();
   button.setAttribute('aria-pressed',String(selected));button.classList.toggle('profile-choice-active',selected);
  }
 }
 function init(){for(const button of document.querySelectorAll('[data-start-unit]'))button.addEventListener('click',()=>{setUnit(button.dataset.startUnit);refresh();});refresh();}
 window.LoadnoteStartingUnitsUI={refresh};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
