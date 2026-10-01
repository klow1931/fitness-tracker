    // Import / Export helpers
    let pendingImportReview=null;
    const importEsc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    function importData() {
      document.getElementById('import-file').click();
    }
    function importChangeRow(label,row){
      const changed=row.added+row.changed+row.removed;
      return '<div class="import-review-row"><span>'+importEsc(label)+'</span><b>'+row.before+' → '+row.after+'</b><small>'+(changed?(row.added+' added · '+row.changed+' changed · '+row.removed+' removed'):'No changes')+'</small></div>';
    }
    function closeImportReview(){
      const dialog=document.getElementById('import-review');if(dialog?.open)dialog.close();
      pendingImportReview=null;const input=document.getElementById('import-file');if(input)input.value='';
    }
    async function commitImportReview(){
      if(!pendingImportReview)return;
      const button=document.getElementById('confirm-import-review'),cancel=document.getElementById('cancel-import-review');button.disabled=true;cancel.disabled=true;
      const {incoming,previousState}=pendingImportReview;
      try{
        let next=LoadnoteIntegrity.addRecoverySnapshot(incoming,previousState,'Before JSON import');
        clearTimeout(saveTimer);await persistNow(next);
        data=next;invalidateViews();applyDark();updateUnitToggle();closeImportReview();showTab('dashboard');window.renderDataIntegrityTools?.();updateBackupBanner();
        showToast('Import complete · previous data saved in Recovery snapshots','success');
      }catch(error){
        data=previousState;button.disabled=false;cancel.disabled=false;reportStorageFailure(error);showToast('Import could not be saved. Current data is unchanged.','error');
      }
    }
    function showImportReview(fileName,backup,preview,reliability,incoming,previousState){
      const dialog=document.getElementById('import-review'),host=document.getElementById('import-review-content'),source=document.getElementById('import-review-source');
      if(!dialog||!host)throw Error('Import review is unavailable.');
      const health=reliability.training,relationships=reliability.relationships;
      const backupTitle=backup.verified?'Integrity fingerprint verified':'Legacy backup';
      const backupDetail=backup.verified?('Exported '+backup.exportedAt+' · schema '+(backup.schemaVersion??'—')+'.'):'No Loadnote integrity fingerprint is present. Structural validation passed, but file corruption cannot be fingerprint-verified.';
      const healthTitle=health.status==='clean'?'Training entries passed current value checks':'Training entries need review';
      const healthDetail=health.status==='clean'
        ?('RPE coverage '+(health.current.rpeCoverage??'—')+'% · no invalid or extreme current strength-set entries detected.')
        :((health.current.invalidLoad+health.current.invalidRpe+health.current.suspiciousLoads)+' current load/RPE issue(s) · RPE coverage '+(health.current.rpeCoverage??'—')+'%.');
      const linkTitle=relationships.blocking?'Record links need review':relationships.warnings?'Record links usable with history warnings':'Record links are internally consistent';
      const linkDetail=relationships.blocking
        ?relationships.blocking+' blocking relationship issue(s) must be reviewed before adaptive evidence is trusted.'
        :relationships.warnings?relationships.warnings+' revision-history warning(s); current workout/Calendar relationships remain usable.':'Workout, Calendar, and planned-work references passed relationship checks.';
      const rows=[
        ['Workouts',preview.workouts],['Calendar sessions',preview.scheduledSessions],['Workout revisions',preview.workoutRevisions],
        ['Training blocks',preview.trainingBlocks],['Meet cycles',preview.meetCycles],['Athlete goals',preview.athleteGoals],
        ['Reviewed programs',preview.reviewedPrograms],['Phase programs',preview.phasePrograms],['Phase reviews',preview.phaseReviews],
        ['Program reviews',preview.programReviews],['Programming profiles',preview.programmingProfiles],['Adopted programs',preview.adoptedPrograms],
        ['Decision history',preview.decisionEvents],['Transition baselines',preview.transitionSnapshots],['Templates',preview.templates],
        ['Exercise catalog',preview.exerciseCatalog],['Exercise roles',preview.exerciseRoles],['PR records',preview.prs],
        ['Nutrition days',preview.nutrition],['Bodyweight entries',preview.bodyweight],['Measurements',preview.measurements],
        ['Progress-photo records',preview.progressPhotos],['Rest days',preview.restDays]
      ];
      source.textContent=(fileName||'JSON backup')+' · This will replace local structured data only after you confirm.';
      host.innerHTML='<div class="import-review-status">'+
        '<article data-import-check="backup"><span>Backup file</span><b>'+importEsc(backupTitle)+'</b><small>'+importEsc(backupDetail)+'</small></article>'+
        '<article data-import-check="training"><span>Training data</span><b>'+importEsc(healthTitle)+'</b><small>'+importEsc(healthDetail)+'</small></article>'+
        '<article data-import-check="links"><span>Record links</span><b>'+importEsc(linkTitle)+'</b><small>'+importEsc(linkDetail)+'</small></article>'+
       '</div><div class="import-review-changes"><h3>What will change</h3>'+rows.map(([label,row])=>importChangeRow(label,row)).join('')+'</div>'+
       '<p class="import-review-recovery"><b>Recovery protection:</b> Loadnote will save your current data as an automatic recovery snapshot before replacement. Import does not silently merge conflicting records.</p>';
      pendingImportReview={incoming,previousState,backup,preview,reliability,fileName};
      document.getElementById('confirm-import-review').disabled=false;document.getElementById('cancel-import-review').disabled=false;
      if(!dialog.open)dialog.showModal();
    }
    function handleImport(ev) {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const previousState = data;
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed.workouts && !parsed.nutrition) throw new Error('Invalid file');
          const backup=LoadnoteIntegrity.verifyBackupManifest(parsed);
          if(backup.status==='invalid')throw new Error('Backup integrity check failed: '+backup.reason);
          delete parsed._loadnoteBackup;
          parsed.scheduledSessions=LoadnoteSchedule.validate(parsed.scheduledSessions??[]);
          parsed.athleteGoals=LoadnoteGoals.validate(parsed.athleteGoals===undefined?[]:parsed.athleteGoals);
          parsed.programmingProfiles=LoadnoteProgrammingProfile.validate(parsed.programmingProfiles===undefined?[]:parsed.programmingProfiles);
          parsed.phaseReviews=LoadnotePhaseReview.validate(parsed.phaseReviews===undefined?[]:parsed.phaseReviews);
          parsed.phasePrograms=LoadnotePhaseBuilder.validate(parsed.phasePrograms===undefined?[]:parsed.phasePrograms);
          parsed.reviewedPrograms=LoadnoteBuilder.validate(parsed.reviewedPrograms===undefined?[]:parsed.reviewedPrograms);
          parsed.programReviews=LoadnoteProgramReview.validate(parsed.programReviews===undefined?[]:parsed.programReviews);
          parsed.meetCycles=LoadnoteMeetCycle.validate(parsed.meetCycles===undefined?[]:parsed.meetCycles);
          parsed.adoptedPrograms=LoadnoteProgramAdoption.validate(parsed.adoptedPrograms===undefined?[]:parsed.adoptedPrograms);
          parsed.transitionSnapshots=LoadnoteTransitionBaseline.validate(parsed.transitionSnapshots===undefined?[]:parsed.transitionSnapshots);
          for(const w of parsed.workouts||[])LoadnoteSchedule.checkLink(parsed,w,{id:w.id,original:w});
          parsed.trainingBlocks = LoadnoteBlocks.validate(parsed.trainingBlocks === undefined ? [] : parsed.trainingBlocks);
          parsed.exerciseRoles = LoadnoteReadiness.validate(parsed.exerciseRoles === undefined ? [] : parsed.exerciseRoles);
          const incoming=normalizeDataShape(parsed),preview=LoadnoteIntegrity.previewImport(data,incoming),reliability=LoadnoteIntegrity.auditReliability(incoming);
          showImportReview(file.name,backup,preview,reliability,incoming,previousState);
        } catch (e) {
          data = previousState;ev.target.value='';alert('Import failed: ' + e.message);
        }
      };
      reader.onerror=()=>{ev.target.value='';showToast('Could not read this backup file.','error');};
      reader.readAsText(file);
    }
    document.addEventListener('DOMContentLoaded',()=>{
      document.getElementById('cancel-import-review')?.addEventListener('click',closeImportReview);
      document.getElementById('confirm-import-review')?.addEventListener('click',commitImportReview);
      document.getElementById('import-review')?.addEventListener('cancel',event=>{event.preventDefault();closeImportReview();});
    });

    function exportData() {
      // Strip large photo binaries from routine backup
      const rawPayload = { ...data, recoverySnapshots:[], progressPhotos: (data.progressPhotos || []).map(p => ({
        id: p.id, date: p.date, tag: p.tag, note: p.note, hasImage: !!p.dataUrl
      })) };
      const payload=LoadnoteIntegrity.addBackupManifest(rawPayload,{releaseVersion:window.LoadnoteCore?.RELEASE_VERSION||data.releaseVersion||''});
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loadnote-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      data.lastExportDate = today();
      data.backupBannerDismissed = null;
      saveData(data);
      updateBackupBanner();
      if(typeof renderWorkoutHistory==='function'&&document.getElementById('panel-workouts')&&!document.getElementById('panel-workouts').classList.contains('hidden'))renderWorkoutHistory();
      showToast('Verified JSON backup downloaded · '+(data.workouts||[]).length+' workouts protected (photos excluded)', 'success');
    }

    function exportPhotosBackup() {
      const list = data.progressPhotos || [];
      if (!list.length) return showToast('No photos to export', 'error');
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loadnote-photos-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Photos backup downloaded', 'success');
    }

    function csvEscape(val) {
      const s = val == null ? '' : String(val);
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }

    function downloadText(filename, text, mime) {
      const blob = new Blob([text], { type: mime || 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      // Workouts CSV (one row per set / cardio line)
      const woHeaders = ['date', 'workout_id', 'exercise', 'type', 'set_index', 'reps', 'hold_sec', 'weight_kg', 'rpe', 'duration_min', 'distance', 'distance_unit', 'avg_hr', 'session_role', 'session_goal', 'deviation_reason', 'deviation_notes', 'notes'];
      const woRows = [woHeaders.join(',')];
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio') {
            woRows.push([
              w.date, w.id, csvEscape(ex.name), 'cardio', '', '', '', '', '',
              ex.duration || '', ex.distance || '', ex.distanceUnit || '', ex.avgHr || '', w.sessionIntent?.role || '', csvEscape(w.sessionIntent?.goal || ''), w.sessionIntent?.deviationReason || '', csvEscape(w.sessionIntent?.deviationNotes || ''), csvEscape(w.notes || '')
            ].join(','));
          } else {
            (ex.sets || []).forEach((s, i) => {
              woRows.push([
                w.date, w.id, csvEscape(ex.name), 'strength', i + 1,
                s.reps || '', s.duration || '', s.weight, s.rpe || '',
                '', '', '', '', w.sessionIntent?.role || '', csvEscape(w.sessionIntent?.goal || ''), w.sessionIntent?.deviationReason || '', csvEscape(w.sessionIntent?.deviationNotes || ''), csvEscape(w.notes || '')
              ].join(','));
            });
          }
        });
      });
      downloadText(`workouts-${today()}.csv`, woRows.join('\n'));

      // Planned work is exported separately so it cannot be mistaken for completed performance.
      const planRows=[['date','workout_id','source_type','source_reference','source_label','session_role','session_goal','exercise','type','set_index','planned_reps','planned_hold_sec','planned_weight_kg','target_rpe','planned_duration_min','planned_distance','distance_unit'].join(',')];
      (data.workouts||[]).forEach(w=>{const intent=w.sessionIntent,plan=intent?.prescription;if(!plan)return;(plan.plannedExercises||[]).forEach(ex=>{if(ex.type==='cardio')planRows.push([w.date,w.id,plan.source.type,plan.source.referenceId||'',csvEscape(plan.source.label||''),intent.role,csvEscape(intent.goal||''),csvEscape(ex.name),'cardio','','','','', '',ex.duration||'',ex.distance||'',ex.distanceUnit||''].join(','));else (ex.sets||[]).forEach((set,index)=>planRows.push([w.date,w.id,plan.source.type,plan.source.referenceId||'',csvEscape(plan.source.label||''),intent.role,csvEscape(intent.goal||''),csvEscape(ex.name),'strength',index+1,set.reps||'',set.duration||'',set.weight,set.targetRpe||'','','',''].join(',')));});});
      if(planRows.length>1)downloadText(`workout-prescriptions-${today()}.csv`,planRows.join('\n'));

      // Nutrition CSV (macros + micros)
      const nuHeaders = [
        'date', 'calories', 'protein_g', 'carbs_g', 'fat_g',
        'fiber_g', 'sugar_g', 'sat_fat_g', 'cholesterol_mg', 'sodium_mg',
        'potassium_mg', 'calcium_mg', 'iron_mg', 'vitamin_c_mg', 'vitamin_d_ug', 'magnesium_mg',
        'foods_count'
      ];
      const nuRows = [nuHeaders.join(',')];
      (data.nutrition || []).forEach(n => {
        nuRows.push([
          n.date, n.calories || '', n.protein || '', n.carbs || '', n.fat || '',
          n.fiber || '', n.sugar || '', n.satFat || '', n.cholesterol || '', n.sodium || '',
          n.potassium || '', n.calcium || '', n.iron || '', n.vitaminC || '', n.vitaminD || '', n.magnesium || '',
          (n.foods || []).length
        ].join(','));
      });
      downloadText(`nutrition-${today()}.csv`, nuRows.join('\n'));

      // Bodyweight CSV
      const bwRows = ['date,weight_kg'];
      (data.bodyweight || []).forEach(b => bwRows.push(`${b.date},${b.weight}`));
      if (bwRows.length > 1) downloadText(`bodyweight-${today()}.csv`, bwRows.join('\n'));

      // Measurements CSV (stored in cm)
      const mHeaders = ['date', 'neck_cm', 'shoulders_cm', 'chest_cm', 'left_arm_cm', 'right_arm_cm', 'waist_cm', 'hips_cm', 'left_thigh_cm', 'right_thigh_cm', 'left_calf_cm', 'right_calf_cm', 'notes'];
      const mRows = [mHeaders.join(',')];
      (data.measurements || []).forEach(m => {
        mRows.push([
          m.date,
          m.neck || '', m.shoulders || '', m.chest || '',
          m.leftArm || '', m.rightArm || '',
          m.waist || '', m.hips || '',
          m.leftThigh || '', m.rightThigh || '',
          m.leftCalf || '', m.rightCalf || '',
          csvEscape(m.notes || '')
        ].join(','));
      });
      if (mRows.length > 1) downloadText(`measurements-${today()}.csv`, mRows.join('\n'));

      showToast('CSV files downloaded', 'success');
    }
