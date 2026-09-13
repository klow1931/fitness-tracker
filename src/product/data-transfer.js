    // Import / Export helpers
    function importData() {
      document.getElementById('import-file').click();
    }
    function handleImport(ev) {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const previousState = data;
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed.workouts && !parsed.nutrition) throw new Error('Invalid file');
          parsed.trainingBlocks = LoadnoteBlocks.validate(parsed.trainingBlocks === undefined ? [] : parsed.trainingBlocks);
          if (!confirm('This will replace your current data. Continue?')) return;
          data = normalizeDataShape(parsed);
          clearTimeout(saveTimer);
          await persistNow(data).catch(error => { reportStorageFailure(error); throw error; });
          applyDark();
          updateUnitToggle();
          showTab('dashboard');
          showToast('Import successful', 'success');
        } catch (e) {
          data = previousState;
          alert('Import failed: ' + e.message);
        }
        ev.target.value = '';
      };
      reader.readAsText(file);
    }

    function exportData() {
      // Strip large photo binaries from routine backup
      const payload = { ...data, progressPhotos: (data.progressPhotos || []).map(p => ({
        id: p.id, date: p.date, tag: p.tag, note: p.note, hasImage: !!p.dataUrl
      })) };
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
      showToast('JSON backup downloaded (photos excluded — use Photos tab to export them)', 'success');
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
      const woHeaders = ['date', 'workout_id', 'exercise', 'type', 'set_index', 'reps', 'hold_sec', 'weight_kg', 'rpe', 'duration_min', 'distance', 'distance_unit', 'avg_hr', 'notes'];
      const woRows = [woHeaders.join(',')];
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio') {
            woRows.push([
              w.date, w.id, csvEscape(ex.name), 'cardio', '', '', '', '', '',
              ex.duration || '', ex.distance || '', ex.distanceUnit || '', ex.avgHr || '', csvEscape(w.notes || '')
            ].join(','));
          } else {
            (ex.sets || []).forEach((s, i) => {
              woRows.push([
                w.date, w.id, csvEscape(ex.name), 'strength', i + 1,
                s.reps || '', s.duration || '', s.weight, s.rpe || '',
                '', '', '', '', csvEscape(w.notes || '')
              ].join(','));
            });
          }
        });
      });
      downloadText(`workouts-${today()}.csv`, woRows.join('\n'));

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
