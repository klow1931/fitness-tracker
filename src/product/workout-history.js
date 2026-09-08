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
              <button data-workout-id="${escapeHtml(w.id)}" onclick="editWorkout(this.dataset.workoutId)" class="btn-secondary">Edit</button>
              <button data-workout-id="${escapeHtml(w.id)}" onclick="saveWorkoutAsTemplate(this.dataset.workoutId)" class="text-xs text-indigo-600 hover:underline">Template</button>
              <button data-workout-id="${escapeHtml(w.id)}" onclick="deleteWorkout(this.dataset.workoutId)" class="btn-danger">Delete</button>
            </div>
          </div>
          ${exercisesHtml}
          ${w.notes ? `<p class="text-slate-500 text-sm mt-1 italic">${escapeHtml(w.notes)}</p>` : ''}
        </div>
      `;
    }
