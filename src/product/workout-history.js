/* Workout history rendering. Event IDs are data, never JavaScript source. */
    function workoutHistoryCardHtml(w) {
      const vol = calcVolume(w);
      const exercisesHtml = w.exercises.map(ex => {
        if (ex.type === 'cardio') {
          const parts = [];
          if (ex.duration) parts.push(`${escapeHtml(ex.duration)} min`);
          if (ex.distance) parts.push(`${escapeHtml(ex.distance)} ${escapeHtml(ex.distanceUnit || 'km')}`);
          if (ex.avgHr) parts.push(`HR ${escapeHtml(ex.avgHr)}`);
          return `<div class="text-slate-600"><span class="font-medium text-slate-800">${escapeHtml(ex.name)}</span> <span class="text-xs text-indigo-600">cardio</span>: ${parts.join(' · ') || '—'}</div>`;
        }
        const setsStr = (ex.sets || []).map(s => formatStrengthSet(s)).join(', ');
        const modeTag = ex.trackBy === 'duration' || (ex.sets || []).some(s => s.duration > 0 && !(s.reps > 0))
          ? ' <span class="text-xs text-slate-400">hold</span>' : '';
        return `<div class="text-slate-600"><span class="font-medium text-slate-800">${escapeHtml(ex.name)}</span>${modeTag}: ${escapeHtml(setsStr)}</div>`;
      }).join('');
      return `
        <div class="border border-slate-200 rounded-lg p-3 mb-3" data-hist-id="${escapeHtml(w.id)}">
          <div class="flex justify-between items-start mb-1 gap-2">
            <div>
              <span class="font-medium">${formatDate(w.date)}</span>
              <span class="text-slate-500 text-sm ml-2">Vol: ${Math.round(toDisplay(vol))} ${unitLabel()}</span>
            </div>
            <div class="flex gap-2 shrink-0">
              <button data-workout-id="${escapeHtml(w.id)}" data-workout-action="edit" class="btn-secondary">Edit</button>
              <button data-workout-id="${escapeHtml(w.id)}" data-workout-action="history-template" class="text-xs text-indigo-600 hover:underline">Template</button>
              <button data-workout-id="${escapeHtml(w.id)}" data-workout-action="delete" class="btn-danger">Delete</button>
            </div>
          </div>
          ${exercisesHtml}
          ${w.notes ? `<p class="text-slate-500 text-sm mt-1 italic">${escapeHtml(w.notes)}</p>` : ''}
        </div>
      `;
    }
    function deleteWorkout(id) {
      if (!confirm('Delete this workout?')) return;
      data.workouts = data.workouts.filter(w => String(w.id) !== String(id));
      saveData(data);
      renderWorkoutHistory();
      renderDashboard();
    }

    // Virtualized workout history
    let _histList = [];
    let _histScrollEl = null;
    const HIST_ROW_EST = 96; // px estimate per card
    const HIST_OVERSCAN = 6;
    const HIST_VIEWPORT = 420;

    function paintVirtualHistory() {
      if (!_histScrollEl) return;
      const scrollTop = _histScrollEl.scrollTop;
      const viewH = _histScrollEl.clientHeight || HIST_VIEWPORT;
      const total = _histList.length;
      if (!total) return;

      let start = Math.floor(scrollTop / HIST_ROW_EST) - HIST_OVERSCAN;
      if (start < 0) start = 0;
      let end = Math.ceil((scrollTop + viewH) / HIST_ROW_EST) + HIST_OVERSCAN;
      if (end > total) end = total;

      const topPad = start * HIST_ROW_EST;
      const bottomPad = (total - end) * HIST_ROW_EST;
      const slice = _histList.slice(start, end);

      const inner = _histScrollEl.querySelector('[data-virt-inner]');
      if (!inner) return;
      inner.innerHTML =
        `<div style="height:${topPad}px"></div>` +
        slice.map(workoutHistoryCardHtml).join('') +
        `<div style="height:${bottomPad}px"></div>`;
    }

    const onHistScroll = debounce(() => paintVirtualHistory(), 16);

    function renderWorkoutHistory() {
      const el = document.getElementById('workout-history');
      if (!el) return;
      const q = (document.getElementById('history-search')?.value || '').toLowerCase().trim();
      let list = data.workouts;
      if (q) list = list.filter(w => w.exercises.some(e => e.name.toLowerCase().includes(q)));
      _histList = list;

      if (!list.length) {
        el.innerHTML = q
          ? '<div class="empty-state"><p class="empty-title">No matches</p><p>Try a different exercise name.</p></div>'
          : `<div class="empty-state">
              <p class="empty-title">No workouts yet</p>
              <p>Log your first session above — strength, cardio, or both.</p>
              <button data-workout-action="focus-date" class="btn-primary text-sm mt-3">Start logging</button>
            </div>`;
        _histScrollEl = null;
        renderTemplates();
        return;
      }

      // Small lists: render fully (no virtualization overhead)
      if (list.length <= 25) {
        el.innerHTML = list.map(workoutHistoryCardHtml).join('');
        _histScrollEl = null;
        renderTemplates();
        return;
      }

      el.innerHTML = `
        <p class="text-xs text-slate-500 mb-2">${list.length} workouts · scroll to load more (virtualized)</p>
        <div id="hist-virt-scroll" style="max-height:${HIST_VIEWPORT}px;overflow-y:auto;position:relative;">
          <div data-virt-inner></div>
        </div>
      `;
      _histScrollEl = document.getElementById('hist-virt-scroll');
      if (_histScrollEl) {
        _histScrollEl.removeEventListener('scroll', onHistScroll);
        _histScrollEl.addEventListener('scroll', onHistScroll, { passive: true });
        paintVirtualHistory();
      }
      renderTemplates();
    }

    const debouncedHistorySearch = debounce(() => renderWorkoutHistory(), 150);
