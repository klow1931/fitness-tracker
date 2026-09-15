/* Bounded pages use natural card heights; exercise names and IDs remain data. */
let historyPage=0,historyFilterSignature='';
const HISTORY_PAGE_SIZE=20;
function workoutHistoryCardHtml(w){
 const vol=calcVolume(w),id=escapeHtml(w.id);
 const intentEngine=typeof LoadnoteIntent!=='undefined'?LoadnoteIntent:null,comparison=intentEngine?.compare(w),role=w.sessionIntent&&intentEngine?.SESSION_ROLES[w.sessionIntent.role],intentSummary=role?`<p class="text-sm"><b>${escapeHtml(role)}</b>${w.sessionIntent.goal?' · '+escapeHtml(w.sessionIntent.goal):''}${comparison?` · ${comparison.completedSets}/${comparison.plannedSets} planned sets represented`:''}</p>`:'';
 const exercises=(w.exercises||[]).map(ex=>{
  const tracking=ex.type==='cardio'?'cardio':ex.trackBy==='duration'||(!ex.trackBy&&(ex.sets||[]).some(s=>s.duration>0&&!(s.reps>0)))?'duration':'reps';
  const values=tracking==='cardio'?`${ex.duration||0} min · ${ex.distance||0} ${ex.distanceUnit||'km'}`:(ex.sets||[]).map(formatStrengthSet).join(', ');
  return `<div class="history-exercise"><button type="button" class="btn-secondary" data-workout-action="exercise-detail" data-exercise-name="${escapeHtml(ex.name)}" data-tracking="${tracking}">${escapeHtml(ex.name)}</button><p>${escapeHtml(values)}</p></div>`;
 }).join('');
 return `<article class="card history-session" data-hist-id="${id}"><div class="history-session-heading"><strong>${formatDate(w.date)}</strong><span>${(w.exercises||[]).length} exercises · ${Math.round(toDisplay(vol))} ${unitLabel()} weighted tonnage</span></div>${intentSummary}<div class="history-session-actions"><button data-workout-id="${id}" data-workout-action="edit" class="btn-secondary">Edit</button><button data-workout-id="${id}" data-workout-action="duplicate" class="btn-secondary">Duplicate</button><button data-workout-id="${id}" data-workout-action="history-template" class="btn-secondary">Template</button><button data-workout-id="${id}" data-workout-action="compare-session" class="btn-secondary">Compare</button><button data-workout-id="${id}" data-workout-action="delete" class="btn-danger">Delete</button></div><details><summary>View exercises and notes</summary>${exercises}${w.notes?`<p>${escapeHtml(w.notes)}</p>`:''}</details></article>`;
}
function workoutChangesHtml(){const changes=window.LoadnoteIntegrity?.undoableWorkoutRevisions(data,5)||[];if(!changes.length)return '';
 return `<details class="card"><summary><b>Recent workout changes</b> · ${changes.length} undoable</summary>${changes.map(change=>{const workout=change.after||change.before,date=workout?.date||'',label=change.action==='delete'?'Deleted workout':'Edited workout';return `<article><p><b>${escapeHtml(label)}</b> · ${escapeHtml(date)} · ${escapeHtml(new Date(change.recordedAt).toLocaleString())}</p><button type="button" class="btn-secondary" data-workout-action="undo-change" data-revision-id="${escapeHtml(change.id)}">Undo</button></article>`;}).join('')}</details>`;}
async function undoWorkoutChange(id){if(window.loggerSaving||!confirm('Undo this saved workout change?'))return;window.loggerSaving=true;let next;
 try{next=LoadnoteIntegrity.undoWorkoutRevision(data,id);next.prs=LoadnoteSession.reconcilePRs(next.prs,next.workouts,estimated1RM,()=>window.LoadnoteCore.createId());next=LoadnoteIntegrity.normalizeState(next);clearTimeout(saveTimer);await persistNow(next);}
 catch(error){showToast(error.message||'Could not undo this change.','error');return;}
 finally{window.loggerSaving=false;}
 data=next;invalidateViews();renderWorkoutHistory();renderDashboard();updateBackupBanner();showToast('Workout change undone · records recalculated','success');
}
async function deleteWorkout(id){
 if(window.loggerSaving||!confirm('Delete this workout? Its derived PRs will be recalculated. You can undo the deletion from History.'))return;
 let next;window.loggerSaving=true;
 try{next=LoadnoteSession.remove(data,id,estimated1RM,()=>window.LoadnoteCore.createId());clearTimeout(saveTimer);await persistNow(next);}
 catch(error){showToast('Could not delete. Your workout and records are unchanged.','error');return;}
 finally{window.loggerSaving=false;}
 data=next;renderWorkoutHistory();renderDashboard();showToast('Workout deleted · records updated','success');
}
function renderWorkoutHistory(){
 window.renderHistoryCleanup?.();
 const el=document.getElementById('workout-history');if(!el)return;
 const options={query:document.getElementById('history-search')?.value||'',from:document.getElementById('history-from')?.value||'',to:document.getElementById('history-to')?.value||''};
 const signature=JSON.stringify(options);if(signature!==historyFilterSignature){historyPage=0;historyFilterSignature=signature;}
 if(options.from&&options.to&&options.from>options.to){el.textContent='Choose an end date on or after the start date.';return;}
 const list=LoadnoteProgress.filter(data.workouts,options),pages=Math.max(1,Math.ceil(list.length/HISTORY_PAGE_SIZE));historyPage=Math.min(historyPage,pages-1);
 if(!list.length){el.innerHTML=workoutChangesHtml()+'<div class="empty-state"><p class="empty-title">'+(options.query||options.from||options.to?'No matches':'No workouts yet')+'</p><p>Adjust the filters or log a workout.</p></div>';return;}
 el.innerHTML=workoutChangesHtml()+`<p role="status">${list.length} workouts · Page ${historyPage+1} of ${pages}</p>`+list.slice(historyPage*HISTORY_PAGE_SIZE,(historyPage+1)*HISTORY_PAGE_SIZE).map(workoutHistoryCardHtml).join('')+`<div class="history-pagination"><button class="btn-secondary" data-workout-action="history-prev" ${historyPage===0?'disabled':''}>Previous page</button><button class="btn-secondary" data-workout-action="history-next" ${historyPage===pages-1?'disabled':''}>Next page</button></div>`;
}
function changeHistoryPage(delta){historyPage=Math.max(0,historyPage+delta);renderWorkoutHistory();const el=document.getElementById('workout-history');el.tabIndex=-1;el.focus();el.scrollIntoView({block:'start'});}
function clearHistoryFilters(){for(const id of ['history-search','history-from','history-to'])document.getElementById(id).value='';historyPage=0;renderWorkoutHistory();}
const debouncedHistorySearch=debounce(()=>renderWorkoutHistory(),150);
