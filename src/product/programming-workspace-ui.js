/* Loadnote v2.68 — one primary programming path with alternate tools collapsed. */
(function(){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function panel(id){const el=document.getElementById(id);if(!el)return;el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}
  function phaseSource(id){try{return LoadnotePhaseBuilder.validate(data.phasePrograms||[]).find(p=>p.id===id)||null;}catch{return null;}}
  function primaryLabel(action){
    return {profile:'Set up training preferences',quick:'Build 4-week return block',phase:'Open program designer','phase-meet':'Start meet-prep setup',meet:'Continue to meet timeline','view-reviewed-cycle':'Review saved cycle','view-current':'View current program',adopt:'Adopt an existing program'}[action]||'Continue';
  }
  function render(){
    const host=document.getElementById('programming-workspace');if(!host)return;
    let route;try{route=LoadnoteProgrammingWorkspace.route(data,{asOf:today()});}catch(e){host.innerHTML='<p role="alert">'+esc(e.message)+'</p>';return;}
    const p=route.profile,meta=p?(esc(p.goalLabel)+' · '+esc(p.availableDayLabels.join(', '))+' · up to '+esc(p.sessionMinutes)+' min'+(p.eventDate?' · event '+esc(p.eventDate):'')):'No programming setup saved yet';
    host.innerHTML='<div class="programming-workspace-head"><div><span class="eyebrow">PROGRAM PLANNER</span><h3>'+esc(route.title)+'</h3><p>'+esc(route.reason)+'</p></div><span class="readiness-status">'+esc(route.status.replaceAll('-',' '))+'</span></div>'+
      '<div class="programming-workspace-meta"><b>Your setup</b><span>'+meta+'</span></div>'+
      '<div class="programming-workspace-actions"><button type="button" class="btn-primary" id="programming-workspace-primary">'+esc(primaryLabel(route.primaryAction))+'</button>'+
      (p?'<button type="button" class="btn-secondary" id="programming-workspace-profile">Edit setup</button>':'')+
      '<button type="button" class="btn-secondary" id="programming-workspace-tools">Show all program tools</button></div>'+
      '<p class="more-hint">Decisions chooses one primary route from your saved setup and calculates supported program structure where possible. The 4-week builder, manual controls and adoption tools still exist, but they no longer compete for attention.</p>';
    host.querySelector('#programming-workspace-profile')?.addEventListener('click',()=>window.openProgrammingProfile?.());
    host.querySelector('#programming-workspace-tools').addEventListener('click',()=>panel('programming-tools-panel'));
    host.querySelector('#programming-workspace-primary').addEventListener('click',()=>{
      switch(route.primaryAction){
        case 'profile': window.openProgrammingProfile?.();break;
        case 'quick': window.LoadnoteProgramBuilderUI?.open?.();break;
        case 'phase': window.LoadnotePhaseBuilderUI?.open?.();break;
        case 'phase-meet': window.LoadnotePhaseBuilderUI?.open?.(null,{continueToMeet:true});break;
        case 'meet': {const source=phaseSource(route.sourceId);if(source)window.LoadnoteMeetCycleUI?.open?.(source);else window.LoadnotePhaseBuilderUI?.open?.(null,{continueToMeet:true});break;}
        case 'view-reviewed-cycle': panel('programming-tools-panel');panel('phase-builder-panel');setTimeout(()=>document.getElementById('meet-cycle')?.scrollIntoView({behavior:'smooth',block:'start'}),50);break;
        case 'view-current': document.getElementById('decision-action-center')?.scrollIntoView({behavior:'smooth',block:'start'});break;
        case 'adopt': panel('programming-tools-panel');panel('program-adoption-panel');break;
      }
    });
  }
  window.LoadnoteProgrammingWorkspaceUI={render};
  window.renderProgrammingWorkspace=render;
})();