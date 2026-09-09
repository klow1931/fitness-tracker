    function toggleChecklistMode() {
      data.checklistMode = !!document.getElementById('gym-checklist-toggle')?.checked;
      saveData(data);
      // Re-paint set rows to show/hide checkboxes without clearing values
      document.querySelectorAll('#exercise-rows > div').forEach(row => {
        row.querySelectorAll('.sets-container > div').forEach(setRow => {
          let check = setRow.querySelector('.set-done-check');
          if (data.checklistMode) {
            if (!check) {
              check = document.createElement('input');
              check.type = 'checkbox';
              check.className = 'set-done-check';
              check.title = 'Mark set done';
              check.addEventListener('change', () => {
                setRow.classList.toggle('set-row-done', check.checked);
                if (check.checked && data.gymMode) startRest(90);
              });
              setRow.insertBefore(check, setRow.firstChild);
            }
          } else if (check) {
            check.remove();
            setRow.classList.remove('set-row-done');
          }
        });
      });
    }

    // ========== Workout Form ==========
    function addExerciseRow(ex = { name: '', sets: [{ reps: '', weight: '' }], type: 'strength', trackBy: 'reps' }) {
      const container = document.getElementById('exercise-rows');
      if (!container) return;
      const idx = container.children.length;
      const div = document.createElement('div');
      const isCardio = ex.type === 'cardio';
      div.className = 'border border-slate-200 rounded-lg p-3 bg-slate-50';
      div.dataset.idx = idx;
      div.dataset.type = isCardio ? 'cardio' : 'strength';
      if (isCardio) {
        div.innerHTML = `
          <div class="flex gap-2 mb-2 items-end flex-wrap">
            <div class="flex-1 min-w-[140px]">
              <label class="label">Cardio</label>
              <input type="text" class="input ex-name" list="exercise-list" value="${escapeHtml(ex.name || '')}" placeholder="e.g. Running, Cycling" />
            </div>
            <span class="text-xs text-indigo-600 font-medium mb-2">Cardio</span>
            <label class="cardio-completion-label"><input type="checkbox" class="cardio-done" /> Cardio complete</label>
            <button data-workout-action="remove-exercise" class="btn-danger">Remove</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label class="label">Duration (min)</label>
              <input type="number" class="input cardio-duration" min="0" step="0.5" value="${ex.duration ?? ''}" placeholder="30" />
            </div>
            <div>
              <label class="label">Distance</label>
              <input type="number" class="input cardio-distance" min="0" step="0.01" value="${ex.distance ?? ''}" placeholder="5" />
            </div>
            <div>
              <label class="label">Unit</label>
              <select class="input cardio-distance-unit">
                <option value="km" ${(ex.distanceUnit || 'km') === 'km' ? 'selected' : ''}>km</option>
                <option value="mi" ${ex.distanceUnit === 'mi' ? 'selected' : ''}>mi</option>
                <option value="m" ${ex.distanceUnit === 'm' ? 'selected' : ''}>m</option>
              </select>
            </div>
            <div>
              <label class="label">Avg HR (optional)</label>
              <input type="number" class="input cardio-hr" min="0" step="1" value="${ex.avgHr ?? ''}" placeholder="140" />
            </div>
          </div>
        `;
        container.appendChild(div);
        return;
      }
      const note = (data.exerciseNotes && ex.name) ? (data.exerciseNotes[ex.name] || '') : '';
      // Infer trackBy from existing sets (duration holds) or explicit field
      let trackBy = ex.trackBy === 'duration' ? 'duration' : 'reps';
      if (!ex.trackBy && (ex.sets || []).some(s => s.duration > 0 && !(s.reps > 0))) trackBy = 'duration';
      div.dataset.trackBy = trackBy;
      div.innerHTML = `
        <div class="flex gap-2 mb-2 items-end flex-wrap">
          <div class="flex-1 min-w-[160px]">
            <label class="label">Exercise</label>
            <input type="text" class="input ex-name" list="exercise-list" value="${escapeHtml(ex.name || '')}" placeholder="e.g. Bench Press, Prone Y-Raise" />
          </div>
          <div>
            <label class="label">Track sets by</label>
            <div class="flex rounded-lg border border-slate-300 overflow-hidden text-sm font-medium">
              <button type="button" class="track-by-btn px-2 py-1.5 ${trackBy === 'reps' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}" data-track="reps" data-workout-action="track-reps">Reps</button>
              <button type="button" class="track-by-btn px-2 py-1.5 ${trackBy === 'duration' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}" data-track="duration" data-workout-action="track-duration">Hold (sec)</button>
            </div>
          </div>
          <button type="button" class="btn-secondary text-sm whitespace-nowrap" data-workout-action="last-weights" title="Load last session sets">Last weights</button>
          <button type="button" class="btn-secondary text-sm whitespace-nowrap" data-workout-action="jump-weights" title="Last weights + small jump">+ Jump</button>
          <button data-workout-action="remove-exercise" class="btn-danger">Remove</button>
        </div>
        <div class="mb-2">
          <label class="label">Personal notes / form cues</label>
          <input type="text" class="input ex-note text-sm" value="${escapeHtml(note)}" placeholder="e.g. brace hard, eyes forward…" data-workout-change="exercise-note" />
        </div>
        <div class="sets-container space-y-2"></div>
        <button data-workout-action="add-set" class="text-sm text-indigo-600 hover:underline mt-2">+ Add Set</button>
      `;
      container.appendChild(div);
      const nameInput = div.querySelector('.ex-name');
      nameInput.addEventListener('change', () => {
        const n = nameInput.value.trim();
        const noteEl = div.querySelector('.ex-note');
        if (noteEl) noteEl.value = (data.exerciseNotes && data.exerciseNotes[n]) || '';
        // Auto-fill last weights if sets are empty
        const hasWeight = [...div.querySelectorAll('.set-weight')].some(el => el.value !== '');
        if (n && !hasWeight) fillLastWeights(nameInput, false, true);
      });
      const setsContainer = div.querySelector('.sets-container');
      (ex.sets || [{ reps: '', weight: '', duration: '' }]).forEach(s => addSetToContainer(setsContainer, s, trackBy));
    }

    function setExerciseTrackBy(btn, mode) {
      if (!btn || typeof btn.closest !== 'function') return;
      const row = btn.closest('[data-idx]');
      if (!row || row.dataset.type === 'cardio') return;
      row.dataset.trackBy = mode === 'duration' ? 'duration' : 'reps';
      row.querySelectorAll('.track-by-btn').forEach(b => {
        const active = b.getAttribute('data-track') === row.dataset.trackBy;
        b.className = 'track-by-btn px-2 py-1.5 ' + (active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600');
      });
      const setsContainer = row.querySelector('.sets-container');
      if (!setsContainer) return;
      // Rebuild set rows keeping whatever values we can
      const prev = [...setsContainer.querySelectorAll(':scope > div')].map(s => ({
        reps: s.querySelector('.set-reps')?.value || '',
        duration: s.querySelector('.set-duration')?.value || '',
        weight: s.querySelector('.set-weight')?.value !== '' && s.querySelector('.set-weight')?.value != null
          ? toStorage(parseFloat(s.querySelector('.set-weight').value) || 0)
          : '',
        rpe: s.querySelector('.set-rpe')?.value || '',
        done: !!s.querySelector('.set-done-check')?.checked
      }));
      setsContainer.innerHTML = '';
      (prev.length ? prev : [{ reps: '', duration: '', weight: '', rpe: '' }]).forEach(s => {
        addSetToContainer(setsContainer, s, row.dataset.trackBy);
      });
    }

    function getLastExercisePerformance(name) {
      if (!name) return null;
      const found = LoadnoteSession.findPerformance(data.workouts, name, ex => ex.type !== 'cardio' && ex.sets?.length);
      if (!found) return null;
      return {date:found.date, trackBy:found.exercise.trackBy, sets:found.exercise.sets.map(s => ({reps:s.reps,duration:s.duration,weight:s.weight,rpe:s.rpe}))};
    }

    function smallJumpKg() {
      // ~5 lb or 2.5 kg in storage units (kg)
      return currentUnit() === 'lb' ? (5 / 2.2046226218) : 2.5;
    }

    function fillLastWeights(el, withJump, quiet) {
      const row = el.closest('[data-idx]');
      if (!row || row.dataset.type === 'cardio') return;
      const name = row.querySelector('.ex-name')?.value.trim();
      if (!name) {
        if (!quiet) alert('Enter an exercise name first.');
        return;
      }
      const last = getLastExercisePerformance(name);
      if (!last) {
        if (!quiet) alert('No previous sets found for "' + name + '".');
        return;
      }
      const jump = withJump ? smallJumpKg() : 0;
      const setsContainer = row.querySelector('.sets-container');
      const hasEntries = [...setsContainer.querySelectorAll('input[type=number]')].some(input => input.value !== '');
      if (hasEntries && quiet) return;
      if (hasEntries && !confirm('Replace the entered sets for this exercise with the previous session?')) return;
      // Prefer duration mode if last sets were timed holds
      const lastWasDuration = last.sets.some(s => s.duration > 0 && !(s.reps > 0));
      {
        row.dataset.trackBy = lastWasDuration ? 'duration' : 'reps';
        row.querySelectorAll('.track-by-btn').forEach(b => {
          const active = b.getAttribute('data-track') === row.dataset.trackBy;
          b.className = 'track-by-btn px-2 py-1.5 ' + (active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600');
        });
      }
      const trackBy = row.dataset.trackBy || (lastWasDuration ? 'duration' : 'reps');
      setsContainer.innerHTML = '';
      last.sets.forEach(s => {
        addSetToContainer(setsContainer, {
          reps: s.reps,
          duration: s.duration,
          weight: (s.weight || 0) + jump,
          rpe: ''
        }, trackBy);
      });
      if (!quiet) {
        const tip = withJump
          ? `Loaded last session (${formatDate(last.date)}) + jump.`
          : `Loaded last session (${formatDate(last.date)}).`;
        // non-blocking soft feedback via title on button
        el.title = tip;
      }
    }

    function saveExerciseNoteFromRow(input) {
      const row = input.closest('[data-idx]');
      const name = row?.querySelector('.ex-name')?.value.trim();
      if (!name) return;
      data.exerciseNotes = data.exerciseNotes || {};
      const val = input.value.trim();
      if (val) data.exerciseNotes[name] = val;
      else delete data.exerciseNotes[name];
      saveData(data);
    }

    function addSetToContainer(container, set = { reps: '', weight: '', rpe: '', duration: '' }, trackBy) {
      const row = document.createElement('div');
      row.className = 'logger-set flex gap-2 items-center flex-wrap';
      const displayWeight = set.weight !== '' && set.weight != null ? toDisplay(set.weight) : '';
      const checkHtml = (data.checklistMode || set.showCompletion)
        ? `<input type="checkbox" class="set-done-check" aria-label="Mark set done" title="Mark set done" ${set.done ? 'checked' : ''} />`
        : '';
      // Infer mode from parent exercise row if not passed
      if (!trackBy) {
        const exRow = container.closest('[data-idx]');
        trackBy = exRow?.dataset?.trackBy === 'duration' ? 'duration' : 'reps';
      }
      const isDuration = trackBy === 'duration';
      const measureInput = isDuration
        ? `<input type="number" class="input set-duration w-24" placeholder="Sec" min="1" step="1" value="${set.duration || ''}" title="Hold duration in seconds" />`
        : `<input type="number" class="input set-reps w-20" placeholder="Reps" min="1" value="${set.reps || ''}" />`;
      row.innerHTML = `
        <span class="set-number" aria-label="Set number"></span>${checkHtml}
        ${measureInput}
        <span class="text-slate-400">${isDuration ? 'sec ×' : '×'}</span>
        <input type="number" class="input set-weight w-24" placeholder="${unitLabel()}" min="0" step="0.5" value="${displayWeight}" title="Load (0 for bodyweight holds)" />
        <input type="number" class="input set-rpe w-16" placeholder="RPE" min="1" max="10" step="0.5" value="${set.rpe || ''}" title="RPE 1-10" />
        <button type="button" aria-label="Remove set" data-workout-action="remove-set" class="text-red-500 text-sm">✕</button>
      `;
      const check = row.querySelector('.set-done-check');
      if (check) {
        check.addEventListener('change', () => {
          row.classList.toggle('set-row-done', check.checked);
          if (check.checked && data.gymMode) startRest(90);
        });
      }
      row.classList.toggle('set-row-done', !!set.done);
      row.querySelectorAll('input[type=number]').forEach(input => { input.setAttribute('aria-label', input.placeholder); input.inputMode = 'decimal'; });
      container.appendChild(row);
    }

    function addSetRow(btn) {
      const exRow = btn.closest('[data-idx]');
      const container = btn.previousElementSibling;
      const trackBy = exRow?.dataset?.trackBy === 'duration' ? 'duration' : 'reps';
      const previous = container.lastElementChild;
      addSetToContainer(container, previous ? { reps: previous.querySelector('.set-reps')?.value || '', duration: previous.querySelector('.set-duration')?.value || '', weight: previous.querySelector('.set-weight')?.value === '' ? '' : toStorage(Number(previous.querySelector('.set-weight')?.value)), rpe: '' } : {}, trackBy);
    }

    function formatStrengthSet(s) {
      if (!s) return '—';
      const w = toDisplay(s.weight || 0);
      const u = unitLabel();
      const rpe = s.rpe ? ` @RPE${s.rpe}` : '';
      if (s.duration > 0 && !(s.reps > 0)) {
        return `${s.duration}s × ${w}${u}${rpe}`;
      }
      return `${s.reps || 0}×${w}${u}${rpe}`;
    }

    function clearWorkoutForm(force) {
      const rows = document.querySelectorAll('#exercise-rows > div');
      let hasData = false;
      rows.forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        if (name) hasData = true;
        row.querySelectorAll('.set-reps, .set-duration, .set-weight').forEach(inp => {
          if (inp.value) hasData = true;
        });
      });
      if ((hasData || loggerHasContent()) && !force) {
        if (!confirm('Clear the workout form? Unsaved sets will be lost.')) return;
      }
      pendingProgramSession = null;
      resetSessionEdit();
      stopRest();
      document.getElementById('wo-date').value = today();
      document.getElementById('wo-notes').value = '';
      document.getElementById('exercise-rows').innerHTML = '';
      addExerciseRow();
    }

    function saveWorkout() { return reviewWorkout(); }
