/* v2.50 — compact user-facing "what changed / why / evidence" explanation. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const weight=kg=>typeof toDisplay==='function'?Math.round(toDisplay(kg)*100)/100:Math.round(Number(kg)*100)/100;
 const unit=()=>typeof unitLabel==='function'?unitLabel():'kg';
 function deltaText(lift){
  const i=lift.impact||{},d=(i.loadDeltasKg||[]).filter(x=>Math.abs(x)>.0001),sessions=i.sessionCount||0,name=lift.name||lift.lift;
  if(lift.action==='reduce-one')return name+': one working set removed from each eligible exposure in '+sessions+' upcoming session'+(sessions===1?'':'s')+'.';
  if(lift.action==='add-set')return name+': one final working set added to each eligible exposure in '+sessions+' upcoming session'+(sessions===1?'':'s')+'.';
  if(d.length){
    const vals=d.map(x=>weight(Math.abs(x))),min=Math.min(...vals),max=Math.max(...vals),dir=d.every(x=>x>0)?'raised':d.every(x=>x<0)?'lowered':'changed';
    const amount=Math.abs(max-min)<.001?min+' '+unit():min+'–'+max+' '+unit();
    return name+': working loads '+dir+' by '+amount+' across '+sessions+' upcoming session'+(sessions===1?'':'s')+'.';
  }
  if(i.setDelta)return name+': working-set structure changed across '+sessions+' upcoming session'+(sessions===1?'':'s')+'.';
  return name+': scheduled prescription changed across '+sessions+' upcoming session'+(sessions===1?'':'s')+'.';
 }
 function render(report,{summary='What changed & why'}={}){
  if(!report?.lifts?.length)return '';
  return '<details class="adaptation-explanation"><summary>'+esc(summary)+'</summary><p class="more-hint">Approved '+esc(report.sourceLabel)+(report.createdAt?' · '+esc(report.createdAt.slice(0,10)):'')+'</p>'+
   report.lifts.map(l=>'<article class="adaptation-explanation-lift" data-adaptation-lift="'+esc(l.lift)+'"><p><b>What changed:</b> '+esc(deltaText(l))+'</p><p><b>Why:</b> '+esc(l.why)+'</p>'+(l.evidence?.length?'<p><b>Evidence:</b> '+l.evidence.map(esc).join(' · ')+'</p>':'')+'</article>').join('')+
   '<p class="more-hint">'+esc(report.notice)+'</p></details>';
 }
 window.LoadnoteAdaptationExplanationUI={render};
})();
