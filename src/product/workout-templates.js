    // ========== Templates & Repeat Last ==========
    function fillWorkoutForm(exercises, notes, preserveRpe = false) {
      if (loggerHasContent() && !confirm('Replace the current workout draft?')) return false;
      pendingProgramSession = null;
      resetSessionEdit();
      document.getElementById('wo-date').value = today();
      document.getElementById('wo-notes').value = notes || '';
      document.getElementById('exercise-rows').innerHTML = '';
      (exercises || []).forEach(ex => {
        if (ex.type === 'cardio') {
          addExerciseRow({
            name: ex.name,
            type: 'cardio',
            duration: ex.duration,
            distance: ex.distance,
            distanceUnit: ex.distanceUnit || 'km',
            avgHr: ex.avgHr
          });
        } else {
          addExerciseRow({
            name: ex.name,
            type: 'strength',
            trackBy: ex.trackBy === 'duration' || (ex.sets || []).some(s => s.duration > 0 && !(s.reps > 0)) ? 'duration' : 'reps',
            sets: (ex.sets || []).map(s => ({ reps: s.reps, duration: s.duration, weight: s.weight, rpe: preserveRpe ? s.rpe : '' }))
          });
        }
      });
      if (!(exercises || []).length) addExerciseRow();
    }

    function repeatLastWorkout() {
      if (!data.workouts.length) return alert('No previous workouts found.');
      const last = data.workouts[0]; // already sorted newest first
      if (fillWorkoutForm(last.exercises, last.notes ? 'Repeat of ' + formatDate(last.date) : '') === false) return;
      alert('Loaded last workout. Adjust weights/reps or hold times as needed, then Save.');
    }

    function saveCurrentAsTemplate() {
      const exercises = LoadnoteSession.fromDraft(captureLoggerDraft(), null, {template:true}).exercises;
      if (!exercises.length) return alert('Add at least one exercise first.');
      const name = prompt('Template name:', exercises.map(e => e.name).slice(0, 3).join(' / '));
      if (!name) return;
      data.templates = data.templates || [];
      data.templates.push({ id: Date.now(), name: name.trim(), exercises, created: today() });
      saveData(data);
      renderTemplates();
      alert('Template saved!');
    }

    function loadTemplate(id) {
      if (!id) return;
      const t = (data.templates || []).find(x => String(x.id) === String(id));
      if (!t) return;
      if (fillWorkoutForm(t.exercises, '') === false) return;
      document.getElementById('template-select').value = '';
      alert('Template loaded. Adjust and Save when ready.');
    }

    function deleteTemplate(id) {
      if (!confirm('Delete this template?')) return;
      data.templates = (data.templates || []).filter(t => String(t.id) !== String(id));
      saveData(data);
      renderTemplates();
    }

    function saveWorkoutAsTemplate(workoutId) {
      const w = data.workouts.find(x => String(x.id) === String(workoutId));
      if (!w) return;
      const name = prompt('Template name:', w.exercises.map(e => e.name).slice(0, 3).join(' / '));
      if (!name) return;
      data.templates = data.templates || [];
      data.templates.push({ id: Date.now(), name: name.trim(), exercises: w.exercises, created: today() });
      saveData(data);
      renderTemplates();
      alert('Template saved from history!');
    }

    function renderTemplates() {
      const listEl = document.getElementById('templates-list');
      const sel = document.getElementById('template-select');
      const templates = data.templates || [];
      if (sel) {
        sel.innerHTML = '<option value="">Load template…</option>' +
          templates.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
      }
      if (!listEl) return;
      if (!templates.length) {
        listEl.innerHTML = '<p class="text-slate-500">No templates yet. Save one from the form or from history.</p>';
        return;
      }
      listEl.innerHTML = templates.slice().reverse().map(t => `
        <div class="border border-slate-200 rounded-lg p-2 flex justify-between items-center">
          <div>
            <span class="font-medium">${escapeHtml(t.name)}</span>
            <span class="text-slate-500 text-xs ml-2">${t.exercises.length} exercises · ${formatDate(t.created)}</span>
          </div>
          <div class="flex gap-2">
            <button data-template-id="${escapeHtml(t.id)}" data-workout-action="load-template" class="text-xs text-indigo-600 hover:underline">Load</button>
            <button data-template-id="${escapeHtml(t.id)}" data-workout-action="delete-template" class="btn-danger text-xs">Delete</button>
          </div>
        </div>
      `).join('');
    }

