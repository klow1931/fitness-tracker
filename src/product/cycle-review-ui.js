/* v2.32 — deliberate weekly review in Decisions, no extra steps in workout logging. */
(function(){
 'use strict';let busy=false,report=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const host=document.getElementById('cycle-week-review');if(!host)return;
  report=null;
  const cycles=LoadnoteCycleReview.validate(data).filter(c=>c.scheduledAt&&c.config.startDate<=today()&&c.config.meetDate>=today()&&c.weekly.some(w=>w.week<c.config.weeks&&w.endDate<=today()&&!(c.weeklyReviews||[]).some(r=>r.week===w.week)));
  const cycle=cycles.at(-1);
  if(!cycle){host.innerHTML='<p class="cycle-review-hint">No completed mock-meet cycle week is awaiting review. Your scheduled workout targets remain unchanged.</p>';return;}
  const available=cycle.weekly.filter(w=>w.week<cycle.config.weeks&&w.endDate<=today()&&!(cycle.weeklyReviews||[]).some(r=>r.week===w.week));
  host.innerHTML='<details class="more-details cycle-review-panel"><summary>Review completed training weeks · '+available.length+' awaiting review</summary><p>Compare your logged work with its original schedule. Keeping the plan is the default; only supported next-week changes can be approved.</p>'+
  '<label>Completed week<select class="input" id="cycle-review-week">'+available.map(w=>'<option value="'+w.week+'">Week '+w.week+' · '+esc(w.phase)+' · ended '+esc(w.endDate)+'</option>').join('')+'</select></label>'+
  '<button type="button" class="btn-secondary" id="cycle-review-analyze">Review this week</button><div id="cycle-review-report"></div><p id="cycle-review-error" role="alert"></p></details>';
  host.querySelector('#cycle-review-week').onchange=()=>{report=null;host.querySelector('#cycle-review-report').replaceChildren();host.querySelector('#cycle-review-error').textContent='';};
  host.querySelector('#cycle-review-analyze').onclick=()=>{try{
   report=LoadnoteCycleReview.analyze(data,{cycleId:cycle.id,week:Number(host.querySelector('#cycle-review-week').value),asOf:today()});
   show(report,host);
  }catch(error){report=null;host.querySelector('#cycle-review-report').replaceChildren();host.querySelector('#cycle-review-error').textContent=error.message;}};
 }
 function choices(host){return Object.fromEntries(['squat','bench','deadlift'].map(lift=>[lift,host.querySelector('[data-cycle-review-choice="'+lift+'"]').value]));}
 function show(r,host){
  const el=host.querySelector('#cycle-review-report');
  el.innerHTML='<div class="cycle-review-meta"><b>Week '+r.week+' · '+esc(r.phase)+' → '+esc(r.nextPhase)+'</b><p>'+esc(r.kind==='phase-transition'?'Phase transition review: only the first week of the next phase is eligible for the bounded set rule.':'Weekly review: only the next week is eligible for the bounded set rule.')+'</p><p>Recorded: '+r.guidance.summary.completed+' linked; '+r.guidance.summary.skipped+' skipped; '+r.guidance.summary.unconfirmed+' unconfirmed; '+r.guidance.summary.unknown+' need review.</p></div>'+
   ['squat','bench','deadlift'].map(l=>{const f=r.findings[l];return '<label class="cycle-review-choice"><b>'+esc(f.name)+'</b><small>'+f.comparableRpeSets+' comparable RPE sets · '+f.aboveCap+' above cap · '+f.plannedNextExposures+' next-week exposures</small><select class="input" data-cycle-review-choice="'+l+'"><option value="keep">Keep the original next-week plan</option>'+(f.canReduceOne?'<option value="reduce-one">Review one fewer set per next-week exposure</option>':'')+'</select><small>'+esc(f.reason)+'</small></label>';}).join('')+
   '<details class="more-details"><summary>Evidence limitations and safeguards</summary>'+r.notes.map(t=>'<p>'+esc(t)+'</p>').join('')+r.guidance.warnings.map(t=>'<p>'+esc(t)+'</p>').join('')+'</details>'+
   '<label>Review notes<textarea class="input" id="cycle-review-notes" maxlength="1000" placeholder="Why did you keep or adjust this week?"></textarea></label>'+
   '<label class="cycle-review-approval"><input type="checkbox" id="cycle-review-confirm"> I reviewed the evidence and the proposed next-week changes. Preserve the original cycle.</label>'+
   '<button type="button" class="btn-primary" id="cycle-review-save">Approve review</button><p class="more-hint">No prescription changes until you approve. Keep decisions produce no Calendar revisions.</p>';
  el.querySelector('#cycle-review-save').onclick=async()=>{
   if(busy||!report)return;busy=true;
   const error=host.querySelector('#cycle-review-error');error.textContent='';
   try{
    let draft;try{draft=JSON.parse(localStorage.getItem(LOGGER_DRAFT_KEY)||'null');}catch(e){throw Error('Workout draft is unreadable; restore or clear it before approving');}
    const nowDate=today(),next=LoadnoteCycleReview.apply(data,report,choices(host),{confirmed:el.querySelector('#cycle-review-confirm').checked,notes:el.querySelector('#cycle-review-notes').value,asOf:nowDate,lockedSessionIds:[draft?.sessionIntent?.schedule?.id,typeof pendingScheduledSession!=='undefined'?pendingScheduledSession?.id:null].filter(Boolean)});
    clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderPhaseReview?.();window.renderSchedule?.();window.renderMeetCycle?.();showToast('Weekly review approved; original cycle retained','success');
   }catch(e){error.textContent=e.message;}finally{busy=false;}
  };
 }
 window.renderCycleWeekReview=render;
})();
