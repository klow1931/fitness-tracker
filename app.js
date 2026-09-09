    const MEASURE_KEYS = [
      { key: 'neck', label: 'Neck' },
      { key: 'shoulders', label: 'Shoulders' },
      { key: 'chest', label: 'Chest' },
      { key: 'leftArm', label: 'Left arm' },
      { key: 'rightArm', label: 'Right arm' },
      { key: 'waist', label: 'Waist' },
      { key: 'hips', label: 'Hips' },
      { key: 'leftThigh', label: 'Left thigh' },
      { key: 'rightThigh', label: 'Right thigh' },
      { key: 'leftCalf', label: 'Left calf' },
      { key: 'rightCalf', label: 'Right calf' }
    ];
    let measuresChart = null;

    const API_KEY_STORAGE = 'fitness-tracker-api-key';
    let chatHistory = []; // {role, content} for API multi-turn
    let lastCoachSnapshot = null;
    let pendingProgramSession = null;

    // ========== Helpers ==========
    function today() {
      return new Date().toISOString().slice(0, 10);
    }

    function formatDate(d) {
      return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function calcVolume(workout) {
      if (window.LoadnoteCore?.calcVolume) return window.LoadnoteCore.calcVolume(workout);
      return (workout.exercises || []).reduce((sum, ex) => {
        if (ex.type === 'cardio' || !ex.sets) return sum;
        return sum + ex.sets.reduce((s, set) => {
          if (set.reps > 0) return s + (set.reps * (set.weight || 0));
          // Timed holds don't use classic volume; skip or count weight only once
          return s;
        }, 0);
      }, 0);
    }

    function estimated1RM(weight, reps, rpe) {
      if (window.LoadnoteCore?.estimated1RM) return window.LoadnoteCore.estimated1RM(weight, reps, rpe);
      const w = Number(weight) || 0;
      const r = Number(reps) || 0;
      if (r <= 1) return w;
      // Epley formula
      return Math.round(w * (1 + r / 30) * 10) / 10;
    }

    // ========== Tab Navigation ==========
    function showTab(name) { navigateTab(name); }
    function showSubTab(panel, sub) { navigateSubTab(panel, sub); }

    function toggleMobileMore(force) {
      const sheet = document.getElementById('mobile-more-sheet');
      if (!sheet) return;
      const open = force === false ? false : force === true ? true : sheet.classList.contains('hidden');
      sheet.classList.toggle('hidden', !open);
    }

    function maybeAutoGymMode() {
      // On narrow screens, enable Gym mode once unless the user has chosen manually
      if (data.gymModeUserSet) return;
      const narrow = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
      if (narrow && !data.gymMode) {
        data.gymMode = true;
        saveData(data);
      }
    }

    function updateOnboardingUI() {
      const card = document.getElementById('onboarding-card');
      if (!card) return;
      card.classList.toggle('hidden', !!data.onboardingDismissed);
    }

    function dismissOnboarding() {
      data.onboardingDismissed = true;
      saveData(data);
      updateOnboardingUI();
      showToast('Quick-start tips dismissed', 'info');
    }

    function toggleDark() {
      data.dark = !data.dark;
      saveData(data);
      applyDark();
    }
    function applyDark() {
      document.body.classList.toggle('dark', !!data.dark);
      const btn = document.getElementById('dark-toggle');
      if (btn) btn.textContent = data.dark ? '☀️' : '🌙';
      // Refresh charts so axis/tooltip colors match theme
      try {
        if (document.getElementById('progressChart')) renderProgressChart();
        if (document.getElementById('nutritionChart')) renderNutritionChart();
        if (document.getElementById('bwChart')) renderBwChart();
        if (document.getElementById('cardioChart')) renderCardioChart();
        if (document.getElementById('measuresChart')) renderMeasuresChart();
      } catch (e) { /* charts may not be ready yet */ }
    }

    function hideAppLoader() {
      const loader = document.getElementById('app-loader');
      if (!loader) return;
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 300);
    }

    function showToast(message, type) {
      const host = document.getElementById('toast-host');
      if (!host) {
        console.log(message);
        return;
      }
      const el = document.createElement('div');
      el.className = 'toast ' + (type || 'info');
      el.textContent = message;
      host.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.25s';
        setTimeout(() => el.remove(), 250);
      }, 2800);
    }

    function toggleGymMode() {
      data.gymMode = !data.gymMode;
      data.gymModeUserSet = true; // don't auto-override after explicit choice
      saveData(data);
      applyGymMode();
      showToast(data.gymMode ? 'Gym mode on — larger controls + sticky save' : 'Gym mode off', 'info');
    }
    function applyGymMode() {
      document.body.classList.toggle('gym-mode', !!data.gymMode);
      const btn = document.getElementById('gym-mode-btn');
      if (btn) {
        btn.textContent = data.gymMode ? '🏋️ Gym ON' : '🏋️ Gym';
        btn.classList.toggle('btn-primary', !!data.gymMode);
        btn.classList.toggle('btn-secondary', !data.gymMode);
      }
      const sticky = document.getElementById('sticky-save-bar');
      if (sticky) {
        // Show sticky bar only in gym mode while on workouts tab
        const onWorkouts = !document.getElementById('panel-workouts')?.classList.contains('hidden');
        sticky.classList.toggle('hidden', !(data.gymMode && onWorkouts));
      }
    }

    function updateBackupBanner() {
      const banner = document.getElementById('backup-banner');
      const text = document.getElementById('backup-banner-text');
      if (!banner || !text) return;
      const hasData = (data.workouts || []).length > 0 || (data.nutrition || []).length > 0;
      if (!hasData) {
        banner.classList.add('hidden');
        return;
      }
      const last = data.lastExportDate ? new Date(data.lastExportDate + 'T00:00:00') : null;
      const now = new Date();
      const days = last ? Math.floor((now - last) / 86400000) : 999;
      const dismissed = data.backupBannerDismissed;
      if (dismissed && days < 14) {
        banner.classList.add('hidden');
        return;
      }
      if (days >= 14) {
        text.textContent = last
          ? `Backup reminder: last export was ${days} days ago. Export JSON to keep your data safe.`
          : 'Backup reminder: you have training data but no export yet. Export JSON to keep it safe.';
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    function dismissBackupBanner() {
      data.backupBannerDismissed = today();
      saveData(data);
      const banner = document.getElementById('backup-banner');
      if (banner) banner.classList.add('hidden');
      showToast('Backup reminder dismissed', 'info');
    }

    // ========== Nutrition ==========
    // ========== Nutrition (expanded) ==========
    // Nutrition is maintained in src/product/nutrition-ui.js.

    // ========== PRs ==========
    function savePR() {
      const exercise = document.getElementById('pr-exercise').value.trim();
      const weightRaw = parseFloat(document.getElementById('pr-weight').value);
      const reps = parseInt(document.getElementById('pr-reps').value) || 1;
      const date = document.getElementById('pr-date').value || today();

      if (!exercise || !weightRaw) return alert('Exercise and weight required');

      const weight = toStorage(weightRaw);
      const est = estimated1RM(weight, reps);
      const existing = data.prs.find(p => p.exercise.toLowerCase() === exercise.toLowerCase());
      const newBest = !existing || est > estimated1RM(existing.weight, existing.reps);
      if (existing) {
        existing.weight = weight;
        existing.reps = reps;
        existing.date = date;
        existing.estimated1RM = est;
        delete existing.source; delete existing.sourceWorkoutId; delete existing.baselinePR;
      } else {
        data.prs.push({
          id: Date.now(),
          exercise,
          weight,
          reps,
          date,
          estimated1RM: est
        });
      }
      data.prs.sort((a, b) => a.exercise.localeCompare(b.exercise));
      saveData(data);
      document.getElementById('pr-exercise').value = '';
      document.getElementById('pr-weight').value = '';
      document.getElementById('pr-reps').value = '1';
      renderPRs();
      showToast(newBest ? 'PR saved · New personal best!' : 'PR updated', newBest ? 'milestone' : 'success');
    }

    function deletePR(id) {
      if (!confirm('Delete this PR?')) return;
      data.prs = data.prs.filter(p => String(p.id) !== String(id));
      saveData(data);
      renderPRs();
    }

    function renderPRs() {
      const el = document.getElementById('pr-list');
      if (!data.prs.length) {
        el.innerHTML = '<p class="text-slate-500">No personal records yet. Log workouts or add them manually.</p>';
        return;
      }
      el.innerHTML = data.prs.map(p => `
        <div class="flex justify-between items-center border border-slate-200 rounded-lg px-4 py-3">
          <div>
            <span class="font-medium">${escapeHtml(p.exercise)}</span>
            <span class="text-slate-600 ml-2">${toDisplay(p.weight)} ${unitLabel()} × ${p.reps}</span>
            <span class="text-slate-400 text-sm ml-2">(est. 1RM: ${toDisplay(p.estimated1RM)} ${unitLabel()})</span>
            <div class="text-xs text-slate-500">${formatDate(p.date)}</div>
          </div>
          <button data-pr-id="${escapeHtml(p.id)}" onclick="deletePR(this.dataset.prId)" class="btn-danger">Delete</button>
        </div>
      `).join('');
    }

    // ========== Dashboard & Charts ==========
    let progressChart = null;
    let nutritionChart = null;

    function getUniqueExercises() {
      const set = new Set();
      data.workouts.forEach(w => w.exercises.forEach(e => {
        if (e.type !== 'cardio') set.add(e.name);
      }));
      data.prs.forEach(p => set.add(p.exercise));
      return Array.from(set).sort();
    }

    function calcStreak() {
      if (!data.workouts.length) return 0;
      const dates = [...new Set(data.workouts.map(w => w.date))].sort().reverse();
      let streak = 0;
      let cursor = new Date();
      // Allow today or yesterday as start
      const todayStr = today();
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      if (dates[0] !== todayStr && dates[0] !== yStr) return 0;
      let expect = dates[0];
      for (const d of dates) {
        if (d === expect) {
          streak++;
          const prev = new Date(expect + 'T00:00:00');
          prev.setDate(prev.getDate() - 1);
          expect = prev.toISOString().slice(0, 10);
        } else if (d < expect) break;
      }
      return streak;
    }

    let bwChart = null;
    function renderDashboard() {
      renderHomeActivity();
      const now = new Date();
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
      const d30Str = d30.toISOString().slice(0, 10);
      const d7Str = d7.toISOString().slice(0, 10);

      // Week start (Monday)
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const weekStr = monday.toISOString().slice(0, 10);

      const recentWorkouts = data.workouts.filter(w => w.date >= d30Str);
      const weekWorkouts = data.workouts.filter(w => w.date >= weekStr);
      const totalVol = recentWorkouts.reduce((s, w) => s + calcVolume(w), 0);
      const weekVol = weekWorkouts.reduce((s, w) => s + calcVolume(w), 0);
      const recentNu = data.nutrition.filter(n => n.date >= d7Str);
      const weekNu = data.nutrition.filter(n => n.date >= weekStr);
      const proteinSummary = nutritionSummary7('protein');

      document.getElementById('stat-workouts').textContent = recentWorkouts.length;
      document.getElementById('stat-volume').textContent = Math.round(toDisplay(totalVol)) + ' ' + unitLabel();
      document.getElementById('stat-protein').textContent = nutritionSummaryLabel(proteinSummary,'g');
      document.getElementById('stat-prs').textContent = data.prs.length;
      document.getElementById('stat-streak').textContent = calcStreak() + 'd';

      const bwList = data.bodyweight || [];
      if (bwList.length) {
        const last = [...bwList].sort((a, b) => b.date.localeCompare(a.date))[0];
        document.getElementById('stat-bw').textContent = toDisplay(last.weight) + ' ' + unitLabel();
      } else {
        document.getElementById('stat-bw').textContent = '—';
      }

      // v0.3 Training Intelligence — deterministic analysis, no AI required.
      try { renderTrainingIntelligence(); } catch (e) { console.warn('Training intelligence render failed', e); }
      try { renderAthleteHome(); } catch (e) { console.warn('Athlete home render failed', e); }

      // Empty vs active home layout
      const isEmptyHome = !(data.workouts || []).length && !(data.nutrition || []).length && !(data.prs || []).length;
      const homeEmpty = document.getElementById('home-empty');
      const startHere = document.getElementById('start-here-card');
      const statsGrid = document.getElementById('home-stats-grid');
      const insights = document.getElementById('home-insights');
      if (homeEmpty) homeEmpty.classList.toggle('hidden', !isEmptyHome);
      // Compact "start here" when empty hero is showing (avoid double walls of CTAs)
      if (startHere) startHere.classList.toggle('hidden', isEmptyHome);
      if (statsGrid) statsGrid.classList.toggle('hidden', isEmptyHome);
      if (insights) insights.classList.toggle('hidden', isEmptyHome);

      // Weekly training report + charts only when user has data
      if (!isEmptyHome) {
        renderWeeklyReport();
        const sel = document.getElementById('progress-exercise');
        if (sel) {
          const current = sel.value;
          const exercises = getUniqueExercises();
          sel.innerHTML = '<option value="">Select exercise…</option>' +
            exercises.map(e => `<option value="${escapeHtml(e)}" ${e === current ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('');
          if (!current && exercises.length) sel.value = exercises[0];
        }
        renderProgressChart();
        renderNutritionChart();
        renderBwChart();
        populateCardioSelectors();
        renderCardioChart();
        renderRecentActivity();
      }
      const bwDate = document.getElementById('bw-date');
      if (bwDate && !bwDate.value) bwDate.value = today();
    }

    function renderAthleteHome() {
      const el = document.getElementById('athlete-home-command');
      if (!el) return;
      const active = getActiveProgram();
      const profile = window.LoadnoteAthlete?.inferProfileFromData
        ? window.LoadnoteAthlete.inferProfileFromData(data, window.LoadnoteCore)
        : (data.athleteProfile || {});
      const fatigue = window.LoadnoteFatigue?.analyze?.(data.workouts || [], { plannedDaysPerWeek: profile?.daysPerWeek });
      let session = null;
      if (active && window.LoadnoteMesocycle && window.LoadnoteAthlete) {
        try {
          const state = getProgramMesocycleState(active);
          const decision = state.currentWeek > 1 ? getProgramWeekDecision(active) : { action: 'progress', confidence: 'medium', reason: 'First week baseline.' };
          session = window.LoadnoteMesocycle.buildSession(active, data.workouts || [], profile, currentUnit(), state.currentWeek, decision.action, window.LoadnoteCore, window.LoadnoteAthlete);
        } catch (e) { console.warn('v1 session preview failed', e); }
      }
      const statusLabel = fatigue?.status === 'strong' ? 'Strong' : fatigue?.status === 'high-fatigue' ? 'High fatigue' : fatigue?.status === 'elevated-fatigue' ? 'Elevated fatigue' : fatigue?.status === 'normal' ? 'Normal' : 'Getting started';
      const trend = fatigue?.performance?.direction || 'unknown';
      const exerciseRows = (session?.exercises || []).slice(0, 5).map(ex => {
        const load = ex.weight != null ? `${escapeHtml(String(toDisplay(ex.weight)))} ${unitLabel()}` : 'Auto';
        return `<div class="v1-session-row"><span>${escapeHtml(ex.name)}</span><b>${load} · ${ex.sets} × ${ex.reps}${ex.targetRPE ? ` · RPE ${ex.targetRPE}` : ''}</b></div>`;
      }).join('');
      const startButton = session ? `<button class="btn-primary text-sm" onclick="startNextAdaptiveWorkout()">Start today's workout</button>` : `<button class="btn-primary text-sm" onclick="showTab('workouts'); showSubTab('workouts','wo-log')">Open workout logger</button><button class="btn-secondary text-sm" onclick="showTab('coach'); showSubTab('coach','co-programs')">Build a program</button>`;
      el.innerHTML = `
        <div class="v1-command-grid">
          <div>
            <span class="eyebrow">TRAIN. LOG. BUILD.</span>
            <h2 class="v1-command-title">${active ? escapeHtml(session?.dayName || 'Next session') : 'Your next session starts here.'}</h2>
            <p class="text-sm text-slate-600 mt-1">${active ? `Week ${session?.week || 1} · Block ${session?.blockIndex || 1} · ${escapeHtml(profile?.goal || 'strength')}` : 'Pick up your log, find your rhythm, and make each set count.'}</p>
            ${exerciseRows ? `<div class="v1-session-list mt-4">${exerciseRows}</div>` : `<p class="v1-empty-note mt-4">Train your way, or build a program for a guided session.</p>`}
            <div class="home-workout-actions">${startButton}</div>
          </div>
          <div class="v1-status-panel">
            <div class="v1-status-item"><span>Training status</span><b>${statusLabel}</b></div>
            <div class="v1-status-item"><span>Performance</span><b>${trend === 'improving' ? 'Trending up' : trend === 'declining' ? 'Needs attention' : trend === 'stable' ? 'Stable' : 'Not enough data'}</b></div>
            <div class="v1-status-item"><span>30-day workouts</span><b>${data.workouts.filter(w => w.date >= new Date(Date.now()-30*86400000).toISOString().slice(0,10)).length}</b></div>
            ${fatigue?.recommendation ? `<p class="text-xs text-slate-500 mt-3">${escapeHtml(fatigue.recommendation)}</p>` : ''}
          </div>
        </div>`;
    }

    function renderTrainingIntelligence() {
      const summaryEl = document.getElementById('training-intelligence-summary');
      const liftsEl = document.getElementById('training-intelligence-lifts');
      const statusEl = document.getElementById('training-status-value');
      const statusHintEl = document.getElementById('training-status-hint');
      const nextEl = document.getElementById('next-workout-recommendation');
      const detailsEl = document.getElementById('adaptive-session-details');
      if (!summaryEl && !liftsEl && !statusEl && !nextEl) return;

      const analytics = window.LoadnoteAnalytics;
      if (!analytics) return;
      const summary = analytics.dashboardSummary(data.workouts || []);
      const fatigue = window.LoadnoteFatigue?.analyze?.(data.workouts || [], { plannedDaysPerWeek: data.athleteProfile?.daysPerWeek });
      const status = summary.status || {};
      const fatigueStatus = fatigue?.status || null;
      const fatigueStatusMap = { 'strong': 'strong', 'normal': 'normal', 'elevated-fatigue': 'elevated-fatigue', 'high-fatigue': 'performance-watch' };
      if (fatigueStatus && fatigueStatusMap[fatigueStatus]) status.status = fatigueStatusMap[fatigueStatus];
      const statusMap = {
        'normal': ['Normal', 'Training load looks manageable based on recent logged sessions.'],
        'elevated-fatigue': ['Elevated fatigue', 'Recent logged RPE is high. Consider holding load or reducing volume if performance also drops.'],
        'performance-watch': ['Performance watch', 'Volume has dropped while recent RPE is high. Review recovery and consider a lighter exposure.'],
        'insufficient-data': ['Not enough data', 'Log a few sessions with RPE to unlock stronger training signals.']
      };
      const statusCopy = statusMap[status.status] || statusMap.normal;
      if (statusEl) statusEl.textContent = statusCopy[0];
      if (statusHintEl) statusHintEl.textContent = fatigue?.recommendation || statusCopy[1];
      const fatigueScoreEl = document.getElementById('fatigue-score-value');
      const fatigueDetailsEl = document.getElementById('fatigue-engine-details');
      if (fatigueScoreEl && fatigue) fatigueScoreEl.textContent = `${fatigue.score}/100`;
      if (fatigueDetailsEl && fatigue) {
        const flagText = fatigue.flags.length ? fatigue.flags.slice(0, 3).map(f => `<span class=\"inline-block mr-2 mb-1\">• ${escapeHtml(f.message)}</span>`).join('') : '<span>No major training-stress flags detected from the available log.</span>';
        const ratio = fatigue.load.ratio == null ? '—' : `${fatigue.load.ratio}×`;
        const rpe = fatigue.rpe.averageRPE == null ? '—' : fatigue.rpe.averageRPE;
        fatigueDetailsEl.innerHTML = `<div class=\"grid sm:grid-cols-3 gap-2 mb-2\"><div><b>7d / 4wk load</b><br>${ratio}</div><div><b>14d avg RPE</b><br>${rpe}</div><div><b>Performance</b><br>${escapeHtml(fatigue.performance.direction)}</div></div><div class=\"text-xs text-slate-500\">${flagText}</div>`;
      }

      const top = (summary.exerciseTrends || []).filter(Boolean).slice(0, 6);
      if (liftsEl) {
        liftsEl.innerHTML = top.length ? top.map(t => {
          const pct = t.change?.percent;
          const arrow = pct == null ? '→' : pct > 1 ? '↑' : pct < -1 ? '↓' : '→';
          const cls = pct == null ? 'text-slate-500' : pct > 1 ? 'text-emerald-600' : pct < -1 ? 'text-rose-600' : 'text-slate-600';
          const plateau = t.change?.percent != null && t.change.percent <= 1 ? ' · possible plateau' : '';
          return `<div class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"><div class="min-w-0"><p class="font-medium truncate">${escapeHtml(t.exercise)}</p><p class="text-xs text-slate-500">${t.sessions} session${t.sessions === 1 ? '' : 's'} · e1RM ${toDisplay(t.latestEstimated1RM)} ${unitLabel()}${plateau}</p></div><span class="font-semibold ${cls}">${arrow} ${pct == null ? '—' : Math.abs(pct) + '%'}</span></div>`;
        }).join('') : '<p class="text-sm text-slate-500">Log at least a few strength sessions to see lift trends.</p>';
      }

      const recent = (data.workouts || []).slice().sort((a,b) => String(b.date).localeCompare(String(a.date)))[0];
      let nextText = 'Complete a few logged sessions to unlock a personalized next-workout recommendation.';
      let detailText = '';
      if (recent) {
        const exs = (recent.exercises || []).filter(ex => ex.type !== 'cardio' && (ex.sets || []).some(s => Number(s.reps) > 0 && Number(s.weight) >= 0));
        const fatigue = status.status === 'elevated-fatigue' || status.status === 'performance-watch' ? 'high' : 'normal';
        const recommendations = exs.map(ex => {
          const meta = window.LoadnoteExercises?.resolve?.(ex.name);
          const parentName = meta?.parentLift ? window.LoadnoteExercises?.resolve(meta.parentLift)?.name : ex.name;
          const trend = (summary.exerciseTrends || []).find(t => t.exercise === ex.name || t.exercise === parentName);
          const rec = window.LoadnoteAdaptive?.recommendExercise?.(ex, {
            targetRPE: 8, sets: ex.sets.filter(s => Number(s.reps) > 0).length || 3,
            reps: Number(ex.sets.filter(s => Number(s.reps) > 0)[0]?.reps || 5), unit: currentUnit(), fatigue,
            recentTrend: Number(trend?.change?.percent || 0)
          });
          if (!rec) return null;
          return { name: ex.name, rec };
        }).filter(Boolean).slice(0, 5);
        if (recommendations.length) {
          nextText = recommendations.map(({name, rec}) => {
            const actionLabels = { increase: 'Increase', hold: 'Hold', reduce: 'Reduce', repeat: 'Repeat' };
            const label = actionLabels[rec.action] || 'Repeat';
            const next = rec.nextWeight == null ? '—' : `${toDisplay(rec.nextWeight)} ${unitLabel()}`;
            const color = rec.action === 'increase' ? 'text-emerald-700' : rec.action === 'reduce' ? 'text-amber-700' : 'text-slate-700';
            return `<div class="py-2 border-b border-slate-100 last:border-0"><div class="flex items-center justify-between gap-2"><b>${escapeHtml(name)}</b><span class="font-semibold ${color}">${label} · ${next}</span></div><p class="text-xs text-slate-500 mt-1">${escapeHtml(rec.reason)}</p></div>`;
          }).join('');
          detailText = `<p class="text-xs text-slate-500">Based on ${recommendations.length} exercise${recommendations.length === 1 ? '' : 's'} from your latest session. Recommendations are deterministic; AI can explain them later.</p>`;
        }
      }
      if (nextEl) nextEl.innerHTML = nextText;
      if (detailsEl) detailsEl.innerHTML = detailText;
      if (summaryEl) {
        const vol = summary.volume?.changePercent;
        const volumeText = vol == null ? 'No prior period' : `${vol > 0 ? '+' : ''}${vol}% vs previous 7 days`;
        summaryEl.innerHTML = `<div class="text-sm text-slate-600"><b>${statusCopy[0]}</b> · ${volumeText} · ${status.workouts14d || 0} workouts in 14 days.</div>`;
      }
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getWeekBounds(refDate) {
      const now = refDate ? new Date(refDate + 'T00:00:00') : new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const toIso = (d) => d.toISOString().slice(0, 10);
      return { start: toIso(monday), end: toIso(sunday), monday, sunday };
    }

    function buildWeeklyReportText() {
      const { start, end } = getWeekBounds();
      const weekWorkouts = (data.workouts || []).filter(w => w.date >= start && w.date <= end);
      const weekVol = weekWorkouts.reduce((s, w) => s + calcVolume(w), 0);
      const weekNu = (data.nutrition || []).filter(n => n.date >= start && n.date <= end);
      const proteinSummary=LoadnoteNutrition.summary(weekNu,'protein',start,today());
      const calorieSummary=LoadnoteNutrition.summary(weekNu,'calories',start,today());
      const avgProtein=proteinSummary.average, avgCal=calorieSummary.average;
      let cardioMin = 0;
      let cardioSessions = 0;
      weekWorkouts.forEach(w => (w.exercises || []).forEach(ex => {
        if (ex.type === 'cardio') {
          cardioSessions++;
          cardioMin += ex.duration || 0;
        }
      }));
      const prsWeek = (data.prs || []).filter(p => p.date >= start && p.date <= end);
      const restCount = (data.restDays || []).filter(d => d >= start && d <= end).length;
      const uniqueLifts = new Set();
      weekWorkouts.forEach(w => (w.exercises || []).forEach(ex => {
        if (ex.type !== 'cardio') uniqueLifts.add(ex.name);
      }));

      return {
        start, end, weekWorkouts, weekVol, weekNu, avgProtein, avgCal, proteinSummary, calorieSummary,
        cardioMin, cardioSessions, prsWeek, restCount, uniqueLifts
      };
    }

    function renderWeeklyReport() {
      const ws = document.getElementById('weekly-summary');
      if (!ws) return;
      const r = buildWeeklyReportText();
      const streak = calcStreak();
      ws.innerHTML = `
        <p class="text-xs text-slate-500 mb-1">${formatDate(r.start)} – ${formatDate(r.end)}</p>
        <p>• <b>${r.weekWorkouts.length}</b> workouts · strength volume <b>${Math.round(toDisplay(r.weekVol))} ${unitLabel()}</b></p>
        <p>• <b>${r.uniqueLifts.size}</b> different lifts · <b>${r.restCount}</b> marked rest day(s)</p>
        <p>• Cardio: <b>${r.cardioSessions}</b> bout(s) · <b>${Math.round(r.cardioMin)}</b> total minutes</p>
        <p>• Nutrition: protein <b>${nutritionSummaryLabel(r.proteinSummary,'g')}</b> · calories <b>${nutritionSummaryLabel(r.calorieSummary,'kcal')}</b></p>
        <p>• PRs this week: <b>${r.prsWeek.length}</b>${r.prsWeek.length ? ' — ' + escapeHtml(r.prsWeek.map(p => p.exercise).slice(0, 4).join(', ')) : ''}</p>
        <p>• Current streak: <b>${streak} day${streak === 1 ? '' : 's'}</b></p>
      `;
    }

    function copyWeeklyReport() {
      const r = buildWeeklyReportText();
      const streak = calcStreak();
      const text = [
        `Weekly Training Report (${r.start} to ${r.end})`,
        `Workouts: ${r.weekWorkouts.length}`,
        `Strength volume: ${Math.round(toDisplay(r.weekVol))} ${unitLabel()}`,
        `Lifts trained: ${r.uniqueLifts.size}`,
        `Rest days marked: ${r.restCount}`,
        `Cardio sessions: ${r.cardioSessions} (${Math.round(r.cardioMin)} min)`,
        `Protein: ${nutritionSummaryLabel(r.proteinSummary,'g')}`,
        `Calories: ${nutritionSummaryLabel(r.calorieSummary,'kcal')}`,
        `PRs this week: ${r.prsWeek.length}${r.prsWeek.length ? ' (' + r.prsWeek.map(p => p.exercise).join(', ') + ')' : ''}`,
        `Streak: ${streak} day(s)`
      ].join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert('Weekly report copied.')).catch(() => {
          prompt('Copy report:', text);
        });
      } else {
        prompt('Copy report:', text);
      }
    }

    // ========== Cardio charts ==========
    let cardioChart = null;

    function getCardioEntries() {
      const entries = [];
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio') {
            entries.push({
              date: w.date,
              name: ex.name,
              duration: ex.duration || 0,
              distance: ex.distance || 0,
              distanceUnit: ex.distanceUnit || 'km',
              avgHr: ex.avgHr
            });
          }
        });
      });
      return entries.sort((a, b) => a.date.localeCompare(b.date));
    }

    function populateCardioSelectors() {
      const sel = document.getElementById('cardio-exercise');
      if (!sel) return;
      const current = sel.value;
      const names = [...new Set(getCardioEntries().map(e => e.name))].sort();
      sel.innerHTML = '<option value="">All cardio</option>' +
        names.map(n => `<option value="${escapeHtml(n)}" ${n === current ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('');
    }

    function renderCardioChart() {
      const canvas = document.getElementById('cardioChart');
      if (!canvas || typeof Chart === 'undefined') return;
      const ctx = canvas.getContext('2d');
      if (cardioChart) cardioChart.destroy();

      const metric = document.getElementById('cardio-metric')?.value || 'duration';
      const filterName = document.getElementById('cardio-exercise')?.value || '';
      let entries = getCardioEntries();
      if (filterName) entries = entries.filter(e => e.name === filterName);
      entries = entries.slice(-40);

      if (!entries.length) {
        cardioChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {
            plugins: chartPluginOptions(false),
            scales: chartScaleOptions('Duration (min)', true)
          }
        });
        return;
      }

      // Aggregate by date when "All cardio"
      const byDate = {};
      entries.forEach(e => {
        if (!byDate[e.date]) byDate[e.date] = { duration: 0, distance: 0 };
        byDate[e.date].duration += e.duration || 0;
        byDate[e.date].distance += e.distance || 0;
      });
      const dates = Object.keys(byDate).sort();
      const values = dates.map(d => metric === 'distance' ? byDate[d].distance : byDate[d].duration);
      const label = metric === 'distance' ? 'Distance' : 'Duration (min)';
      const dark = !!data.dark;

      cardioChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.map(formatDate),
          datasets: [{
            label,
            data: values,
            borderColor: dark ? '#38bdf8' : '#0ea5e9',
            backgroundColor: dark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: dark ? '#7dd3fc' : '#0ea5e9'
          }]
        },
        options: {
          responsive: true,
          plugins: chartPluginOptions(false),
          scales: chartScaleOptions(label, true)
        }
      });
    }

    // ========== Calendar ==========
    let calCursor = new Date();
    let calSelectedDate = null;

    function shiftCalendar(deltaMonths) {
      calCursor.setMonth(calCursor.getMonth() + deltaMonths);
      renderCalendar();
    }
    function goCalendarToday() {
      calCursor = new Date();
      calSelectedDate = today();
      renderCalendar();
      showCalDayDetail(calSelectedDate);
    }

    function workoutsByDateMap() {
      const map = {};
      (data.workouts || []).forEach(w => {
        if (!map[w.date]) map[w.date] = { strength: false, cardio: false, list: [] };
        map[w.date].list.push(w);
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio') map[w.date].cardio = true;
          else map[w.date].strength = true;
        });
      });
      return map;
    }

    function renderCalendar() {
      const grid = document.getElementById('calendar-grid');
      const label = document.getElementById('cal-month-label');
      if (!grid || !label) return;

      const year = calCursor.getFullYear();
      const month = calCursor.getMonth();
      label.textContent = calCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

      // Monday-start grid
      const first = new Date(year, month, 1);
      let startDow = first.getDay(); // 0 Sun
      startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0
      const start = new Date(year, month, 1 - startDow);
      const byDate = workoutsByDateMap();
      const restSet = new Set(data.restDays || []);
      const todayStr = today();

      let html = '';
      for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const inMonth = d.getMonth() === month;
        const info = byDate[iso];
        let cls = 'cal-cell';
        if (!inMonth) cls += ' other-month';
        if (iso === todayStr) cls += ' today';
        if (iso === calSelectedDate) cls += ' selected';
        if (restSet.has(iso) && !info) cls += ' rest-day';
        if (info) {
          if (info.strength && info.cardio) cls += ' has-both';
          else if (info.cardio) cls += ' has-cardio';
          else cls += ' has-workout';
        }
        let tip = '';
        if (info) tip = info.list.length + ' session(s)';
        else if (restSet.has(iso)) tip = 'Rest';
        html += `<button type="button" class="${cls}" aria-label="${iso}${tip ? ', '+tip : ''}" aria-pressed="${iso === calSelectedDate}" onclick="selectCalDay('${iso}')">
          <span class="cal-num">${d.getDate()}</span>
          <span class="cal-dot">${tip}</span>
        </button>`;
      }
      grid.innerHTML = html;
      if (calSelectedDate) showCalDayDetail(calSelectedDate);
    }

    function selectCalDay(iso) {
      calSelectedDate = iso;
      renderCalendar();
      showCalDayDetail(iso);
    }

    function showCalDayDetail(iso) {
      const label = document.getElementById('cal-day-label');
      const detail = document.getElementById('cal-day-detail');
      if (!label || !detail) return;
      label.textContent = formatDate(iso) + (iso === today() ? ' (today)' : '');
      const sessions = (data.workouts || []).filter(w => w.date === iso);
      const isRest = (data.restDays || []).includes(iso);
      if (!sessions.length && !isRest) {
        detail.innerHTML = '<p class="text-slate-500">No workout logged. Rest day or open day.</p>';
        return;
      }
      let html = '';
      if (isRest) html += '<p class="text-slate-600">Marked as <b>rest day</b>.</p>';
      sessions.forEach(w => {
        const lines = (w.exercises || []).map(ex => {
          if (ex.type === 'cardio') {
            return `• ${escapeHtml(ex.name)}: ${ex.duration || '—'} min` + (ex.distance ? `, ${ex.distance} ${ex.distanceUnit || 'km'}` : '');
          }
          const sets = (ex.sets || []).map(s => formatStrengthSet(s)).join(', ');
          return `• ${escapeHtml(ex.name)}: ${escapeHtml(sets)}`;
        }).join('<br>');
        html += `<div class="border border-slate-200 rounded-lg p-2 mb-2">
          <div class="font-medium">Session${w.notes ? ' — ' + escapeHtml(w.notes) : ''}</div>
          <div class="text-slate-600 mt-1">${lines || 'No exercises'}</div>
        </div>`;
      });
      detail.innerHTML = html;
    }

    function logWorkoutOnSelectedDay() {
      if (!calSelectedDate) return alert('Select a day first');
      showTab('workouts'); showSubTab('workouts','wo-log');
      const el = document.getElementById('wo-date');
      if (el) el.value = calSelectedDate;
    }

    function markRestDay() {
      if (!calSelectedDate) return alert('Select a day first');
      data.restDays = data.restDays || [];
      if (data.restDays.includes(calSelectedDate)) {
        data.restDays = data.restDays.filter(d => d !== calSelectedDate);
        showToast('Rest day removed', 'info');
      } else {
        data.restDays.push(calSelectedDate);
        showToast('Marked as rest day', 'success');
      }
      saveData(data);
      renderCalendar();
    }

    function saveBodyweight() {
      const date = document.getElementById('bw-date').value || today();
      const raw = parseFloat(document.getElementById('bw-value').value);
      if (!raw) return alert('Enter a weight');
      const weight = toStorage(raw);
      data.bodyweight = data.bodyweight || [];
      const idx = data.bodyweight.findIndex(b => b.date === date);
      if (idx >= 0) data.bodyweight[idx].weight = weight;
      else data.bodyweight.push({ date, weight });
      data.bodyweight.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);
      document.getElementById('bw-value').value = '';
      renderDashboard();
    }

    // ========== Body measurements (cm storage) ==========
    function measureUnitLabel() {
      return (data.measureUnit === 'in') ? 'in' : 'cm';
    }
    function toMeasureStorage(displayVal) {
      const n = parseFloat(displayVal);
      if (!n && n !== 0) return null;
      if (data.measureUnit === 'in') return round1(n * 2.54);
      return round1(n);
    }
    function toMeasureDisplay(cm) {
      if (cm == null || cm === '') return '';
      if (data.measureUnit === 'in') return round1(cm / 2.54);
      return round1(cm);
    }
    function formatMeasure(cm) {
      if (cm == null || cm === '') return '—';
      return toMeasureDisplay(cm) + measureUnitLabel();
    }

    function setMeasureUnit(u) {
      const previous=measureUnitLabel(), next=u==='in'?'in':'cm';
      if(previous===next)return;
      MEASURE_KEYS.forEach(({key})=>{const input=document.getElementById('meas-'+key);if(input && input.value!==''){const value=Number(input.value);if(Number.isFinite(value))input.value=round1(previous==='in'?value*2.54:value/2.54);}});
      data.measureUnit = next;
      saveData(data);
      updateMeasureUnitUI();
      renderMeasures();
    }
    function updateMeasureUnitUI() {
      const u = measureUnitLabel();
      document.querySelectorAll('.meas-unit-label').forEach(el => { el.textContent = u; });
      const cmBtn = document.getElementById('meas-unit-cm');
      const inBtn = document.getElementById('meas-unit-in');
      if (cmBtn && inBtn) {
        const isCm = data.measureUnit !== 'in';
        cmBtn.setAttribute('aria-pressed',String(isCm));
        inBtn.setAttribute('aria-pressed',String(!isCm));
      }
    }

    function clearMeasurementForm() {
      MEASURE_KEYS.forEach(({ key }) => {
        const el = document.getElementById('meas-' + key);
        if (el) el.value = '';
      });
      const notes = document.getElementById('meas-notes');
      if (notes) notes.value = '';
      document.getElementById('measure-edit-status').textContent='Enter one or more measurements to get started.';
    }

    function saveMeasurements() {
      const date = document.getElementById('meas-date')?.value || today();
      const entry = { id: Date.now() + Math.random(), date, notes: (document.getElementById('meas-notes')?.value || '').trim() };
      let any = false;
      const invalid=MEASURE_KEYS.find(({key})=>{const value=document.getElementById('meas-'+key)?.value;return value!=='' && value!=null && (!Number.isFinite(Number(value)) || Number(value)<=0);});
      if(invalid) {showToast('Measurements must be positive numbers.','error');return;}
      MEASURE_KEYS.forEach(({ key }) => {
        const raw = document.getElementById('meas-' + key)?.value;
        const cm = toMeasureStorage(raw);
        if (cm != null && cm > 0) {
          entry[key] = cm;
          any = true;
        }
      });
      if (!any) return showToast('Enter at least one measurement', 'error');
      data.measurements = data.measurements || [];
      const idx = data.measurements.findIndex(m => m.date === date);
      if (idx >= 0) {
        // merge: new values overwrite, keep previous sites if blank this time
        const prev = data.measurements[idx];
        MEASURE_KEYS.forEach(({ key }) => {
          if (entry[key] != null) prev[key] = entry[key];
        });
        if (entry.notes) prev.notes = entry.notes;
        data.measurements[idx] = prev;
      } else {
        data.measurements.push(entry);
      }
      data.measurements.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);
      clearMeasurementForm();
      renderMeasures();
      showToast('Measurements saved', 'success');
    }

    function deleteMeasurement(id) {
      if (!confirm('Delete this measurement entry?')) return;
      data.measurements = (data.measurements || []).filter(m => String(m.id) !== String(id));
      saveData(data);
      renderMeasures();
      showToast('Measurement deleted', 'info');
    }

    function loadMeasurementIntoForm(id) {
      const m = (data.measurements || []).find(x => String(x.id) === String(id));
      if (!m) return;
      const dateEl = document.getElementById('meas-date');
      if (dateEl) dateEl.value = m.date;
      MEASURE_KEYS.forEach(({ key }) => {
        const el = document.getElementById('meas-' + key);
        if (el) el.value = m[key] != null ? toMeasureDisplay(m[key]) : '';
      });
      const notes = document.getElementById('meas-notes');
      if (notes) notes.value = m.notes || '';
      showToast('Loaded into form — edit and save to update', 'info');
      document.getElementById('measure-edit-status').textContent='Editing check-in for '+formatDate(m.date)+'. Save to update this date.';
      document.querySelectorAll('#measurement-form details').forEach(detail=>{if([...detail.querySelectorAll('input')].some(input=>input.value!==''))detail.open=true;});
      focusMeasurementForm();
    }

    function focusMeasurementForm() {
      document.getElementById('measure-entry').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
      document.getElementById('meas-date').focus({preventScroll:true});
    }
    function renderMeasureOverview() {
      const rows=[...(data.measurements || [])].sort((a,b)=>b.date.localeCompare(a.date));
      const tiles=[['waist','Waist'],['chest','Chest'],['hips','Hips']].map(([key,label])=>{
        const record=rows.find(r=>Number(r[key])>0);
        return '<div class="measure-stat"><span>'+label+'</span><strong>'+ (record?escapeHtml(formatMeasure(record[key])):'—')+'</strong><small>'+(record?escapeHtml(formatDate(record.date)):'No check-in yet')+'</small></div>';
      });
      tiles.unshift('<div class="measure-stat"><span>Check-ins</span><strong>'+rows.length+'</strong><small>'+(rows.length?'Latest: '+escapeHtml(formatDate(rows[0].date)):'Start with one measurement')+'</small></div>');
      document.getElementById('measure-overview').innerHTML=tiles.join('');
    }
    function renderMeasuresHistory() {
      const tbody = document.getElementById('measures-history');
      const empty = document.getElementById('measures-empty');
      if (!tbody) return;
      const list = data.measurements || [];
      document.getElementById('measure-history-count').textContent=list.length+' check-ins';
      if (empty) empty.classList.toggle('hidden', list.length > 0);
      if (!list.length) {
        tbody.innerHTML = '';
        return;
      }
      tbody.innerHTML = [...list].sort((a,b)=>b.date.localeCompare(a.date)).map((m,index)=>{
        const values=MEASURE_KEYS.filter(({key})=>m[key]!=null);
        return `<details ${index===0?'open':''}><summary>${escapeHtml(formatDate(m.date))}<span>${values.length} measurements</span></summary><dl>${values.map(({key,label})=>'<div><dt>'+label+'</dt><dd>'+escapeHtml(formatMeasure(m[key]))+'</dd></div>').join('')}</dl>${m.notes?'<p>'+escapeHtml(m.notes)+'</p>':''}<div class="measure-actions"><button data-id="${escapeHtml(m.id)}" onclick="loadMeasurementIntoForm(this.dataset.id)" class="btn-secondary">Edit check-in</button><button data-id="${escapeHtml(m.id)}" onclick="deleteMeasurement(this.dataset.id)" class="btn-secondary">Delete</button></div></details>`;
      }).join('');
    }

    function renderMeasuresChart() {
      const canvas = document.getElementById('measuresChart');
      if (!canvas || typeof Chart === 'undefined') return;
      const key = document.getElementById('meas-chart-key')?.value || 'waist';
      const sorted = [...(data.measurements || [])]
        .filter(m => m[key] != null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-40);
      const dark = !!data.dark;
      if (measuresChart) measuresChart.destroy();
      const label = (MEASURE_KEYS.find(k => k.key === key)?.label || key) + ' (' + measureUnitLabel() + ')';
      measuresChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: sorted.map(m => formatDate(m.date)),
          datasets: [{
            label,
            data: sorted.map(m => toMeasureDisplay(m[key])),
            borderColor: dark ? '#a78bfa' : '#7c3aed',
            backgroundColor: dark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: dark ? '#c4b5fd' : '#7c3aed'
          }]
        },
        options: {
          responsive: true,
          plugins: typeof chartPluginOptions === 'function' ? chartPluginOptions(false) : { legend: { display: true } },
          scales: {
            x: { ticks: { color: dark ? '#94a3b8' : '#64748b' }, grid: { color: dark ? '#334155' : '#e2e8f0' } },
            y: { ticks: { color: dark ? '#94a3b8' : '#64748b' }, grid: { color: dark ? '#334155' : '#e2e8f0' } }
          }
        }
      });
      const deltaEl = document.getElementById('meas-delta');
      if (deltaEl) {
        if (sorted.length >= 2) {
          const first = toMeasureDisplay(sorted[0][key]);
          const last = toMeasureDisplay(sorted[sorted.length - 1][key]);
          const d = round1(last - first);
          const sign = d > 0 ? '+' : '';
          deltaEl.textContent = `${label}: ${first}${measureUnitLabel()} → ${last}${measureUnitLabel()} (${sign}${d} ${measureUnitLabel()}) over ${sorted.length} check-ins`;
        } else if (sorted.length === 1) {
          deltaEl.textContent = `One data point for ${label}. Log again later to see change.`;
        } else {
          deltaEl.textContent = `No data yet for ${label}.`;
        }
      }
    }

    function renderMeasures() {
      updateMeasureUnitUI();
      renderMeasureOverview();
      const dateEl = document.getElementById('meas-date');
      if (dateEl && !dateEl.value) dateEl.value = today();
      renderMeasuresHistory();
      renderMeasuresChart();
    }

    function renderBwChart() {
      const canvas = document.getElementById('bwChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (bwChart) bwChart.destroy();
      const sorted = [...(data.bodyweight || [])].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
      const dark = !!data.dark;
      bwChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sorted.map(b => formatDate(b.date)),
          datasets: [{
            label: 'Bodyweight (' + unitLabel() + ')',
            data: sorted.map(b => toDisplay(b.weight)),
            borderColor: dark ? '#34d399' : '#10b981',
            backgroundColor: dark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: dark ? '#6ee7b7' : '#10b981'
          }]
        },
        options: {
          responsive: true,
          plugins: chartPluginOptions(false),
          scales: chartScaleOptions(unitLabel(), false)
        }
      });
    }

    function calc1RM() {
      const w = parseFloat(document.getElementById('orm-weight').value);
      const r = parseInt(document.getElementById('orm-reps').value) || 1;
      if (!w) return;
      const kg = toStorage(w);
      const est = estimated1RM(kg, r);
      document.getElementById('orm-result').textContent =
        `Estimated 1RM: ${toDisplay(est)} ${unitLabel()} (Epley)`;
    }

    /**
     * Approximate % of 1RM for a given rep count at a given RPE.
     * Based on common RPE/% charts (simplified). Returns null if out of range.
     */
    function rpePercentOf1RM(reps, rpe) {
      reps = Math.max(1, Math.min(12, Math.round(reps)));
      rpe = Math.round(parseFloat(rpe) * 2) / 2; // nearest 0.5
      // Columns: RPE 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6 for reps 1..12
      const table = {
        1:  { 10: 100, 9.5: 97.8, 9: 95.5, 8.5: 93.0, 8: 90.7, 7.5: 88.3, 7: 85.8, 6.5: 83.3, 6: 80.8 },
        2:  { 10: 95.5, 9.5: 93.9, 9: 92.2, 8.5: 90.2, 8: 88.0, 7.5: 85.8, 7: 83.5, 6.5: 81.2, 6: 78.8 },
        3:  { 10: 92.2, 9.5: 90.7, 9: 89.2, 8.5: 87.3, 8: 85.3, 7.5: 83.2, 7: 81.0, 6.5: 78.8, 6: 76.5 },
        4:  { 10: 89.2, 9.5: 87.8, 9: 86.3, 8.5: 84.5, 8: 82.6, 7.5: 80.6, 7: 78.5, 6.5: 76.3, 6: 74.0 },
        5:  { 10: 86.3, 9.5: 85.0, 9: 83.5, 8.5: 81.8, 8: 80.0, 7.5: 78.0, 7: 76.0, 6.5: 73.8, 6: 71.5 },
        6:  { 10: 83.7, 9.5: 82.4, 9: 80.9, 8.5: 79.2, 8: 77.4, 7.5: 75.5, 7: 73.5, 6.5: 71.4, 6: 69.2 },
        7:  { 10: 81.1, 9.5: 79.9, 9: 78.4, 8.5: 76.8, 8: 75.0, 7.5: 73.1, 7: 71.1, 6.5: 69.0, 6: 66.8 },
        8:  { 10: 78.6, 9.5: 77.4, 9: 76.0, 8.5: 74.4, 8: 72.6, 7.5: 70.7, 7: 68.7, 6.5: 66.6, 6: 64.4 },
        9:  { 10: 76.2, 9.5: 75.0, 9: 73.6, 8.5: 72.0, 8: 70.2, 7.5: 68.3, 7: 66.3, 6.5: 64.2, 6: 62.0 },
        10: { 10: 73.9, 9.5: 72.7, 9: 71.3, 8.5: 69.7, 8: 67.9, 7.5: 66.0, 7: 64.0, 6.5: 61.9, 6: 59.7 },
        11: { 10: 71.6, 9.5: 70.4, 9: 69.0, 8.5: 67.4, 8: 65.6, 7.5: 63.7, 7: 61.7, 6.5: 59.6, 6: 57.4 },
        12: { 10: 69.4, 9.5: 68.2, 9: 66.8, 8.5: 65.2, 8: 63.4, 7.5: 61.5, 7: 59.5, 6.5: 57.4, 6: 55.2 }
      };
      const row = table[reps];
      if (!row) return null;
      if (row[rpe] != null) return row[rpe];
      // nearest available RPE key
      const keys = Object.keys(row).map(Number).sort((a, b) => a - b);
      let best = keys[0];
      let bestD = Math.abs(rpe - best);
      keys.forEach(k => {
        const d = Math.abs(rpe - k);
        if (d < bestD) { best = k; bestD = d; }
      });
      return row[best];
    }

    function calcRpeTargetWeight() {
      const ormDisp = parseFloat(document.getElementById('rpe-1rm')?.value);
      const reps = parseInt(document.getElementById('rpe-target-reps')?.value, 10) || 5;
      const rpe = parseFloat(document.getElementById('rpe-target-rpe')?.value) || 8;
      const out = document.getElementById('rpe-target-result');
      if (!out) return;
      if (!ormDisp || ormDisp <= 0) {
        out.textContent = 'Enter a known 1RM first.';
        return;
      }
      const pct = rpePercentOf1RM(reps, rpe);
      if (pct == null) {
        out.textContent = 'Reps/RPE out of chart range.';
        return;
      }
      const weightDisp = round1(ormDisp * (pct / 100));
      out.innerHTML = `~<b>${weightDisp} ${unitLabel()}</b> for <b>${reps}</b> reps @ RPE <b>${rpe}</b> <span class="text-slate-500 font-normal">(~${pct}% of 1RM)</span>`;
    }

    function calcPercentWeight() {
      const ormDisp = parseFloat(document.getElementById('rpe-1rm')?.value);
      const pct = parseFloat(document.getElementById('rpe-pct')?.value);
      const out = document.getElementById('rpe-target-result');
      if (!out) return;
      if (!ormDisp || ormDisp <= 0) {
        out.textContent = 'Enter a known 1RM first.';
        return;
      }
      if (!pct || pct <= 0) {
        out.textContent = 'Enter a percentage (e.g. 75).';
        return;
      }
      const weightDisp = round1(ormDisp * (pct / 100));
      out.innerHTML = `<b>${pct}%</b> of ${ormDisp} ${unitLabel()} ≈ <b>${weightDisp} ${unitLabel()}</b>`;
    }

    function calcRpe1RM() {
      const wDisp = parseFloat(document.getElementById('rpe-set-weight')?.value);
      const reps = parseInt(document.getElementById('rpe-set-reps')?.value, 10) || 1;
      const rpe = parseFloat(document.getElementById('rpe-set-rpe')?.value) || 9;
      const out = document.getElementById('rpe-1rm-result');
      if (!out) return;
      if (!wDisp || wDisp <= 0) {
        out.textContent = 'Enter the weight you lifted.';
        return;
      }
      const pct = rpePercentOf1RM(reps, rpe);
      if (!pct || pct <= 0) {
        out.textContent = 'Could not map that set to the RPE chart.';
        return;
      }
      const est1rm = round1(wDisp / (pct / 100));
      out.innerHTML = `Estimated 1RM ≈ <b>${est1rm} ${unitLabel()}</b> <span class="text-slate-500 font-normal">(${wDisp} × ${reps} @ RPE ${rpe} ≈ ${pct}% 1RM)</span>`;
      // Convenience: fill the 1RM field for chart / target calc
      const ormField = document.getElementById('rpe-1rm');
      if (ormField && !ormField.value) ormField.value = est1rm;
    }

    function renderPercentChart() {
      const tbody = document.getElementById('pct-chart-body');
      if (!tbody) return;
      const ormDisp = parseFloat(document.getElementById('rpe-1rm')?.value);
      if (!ormDisp || ormDisp <= 0) {
        tbody.innerHTML = '<tr><td class="py-2 text-slate-500" colspan="4">Enter a 1RM above and click Refresh table.</td></tr>';
        return;
      }
      const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
      tbody.innerHTML = pcts.map(p => {
        const w = round1(ormDisp * (p / 100));
        let rpeLow = '—';
        let rpeHigh = '—';
        if (p >= 95) { rpeLow = '9–10'; rpeHigh = 'too heavy'; }
        else if (p >= 90) { rpeLow = '8–9'; rpeHigh = '9–10'; }
        else if (p >= 85) { rpeLow = '7–8'; rpeHigh = '8–9'; }
        else if (p >= 80) { rpeLow = '6–7'; rpeHigh = '7–8.5'; }
        else if (p >= 75) { rpeLow = 'easy singles'; rpeHigh = '6–7.5'; }
        else if (p >= 70) { rpeLow = 'warm-up'; rpeHigh = '6–7'; }
        else { rpeLow = 'warm-up'; rpeHigh = 'easy volume'; }
        return `<tr class="border-b border-slate-100">
          <td class="py-1.5 pr-2 font-medium">${p}%</td>
          <td class="py-1.5 pr-2">${w} ${unitLabel()}</td>
          <td class="py-1.5 pr-2 text-slate-500">${rpeLow}</td>
          <td class="py-1.5 pr-2 text-slate-500">${rpeHigh}</td>
        </tr>`;
      }).join('');
    }

    function calcPlates() {
      const targetDisp = parseFloat(document.getElementById('plate-target').value);
      const barDisp = parseFloat(document.getElementById('plate-bar').value) || (currentUnit() === 'lb' ? 45 : 20);
      if (!targetDisp) return;
      const target = toStorage(targetDisp);
      const bar = toStorage(barDisp);
      let perSide = (target - bar) / 2;
      if (perSide < 0) {
        document.getElementById('plate-result').innerHTML = '<p class="text-red-500">Target is less than bar weight.</p>';
        return;
      }
      // Plates in kg
      const platesKg = currentUnit() === 'lb'
        ? [25, 20, 15, 10, 5, 2.5, 1.25] // will convert display
        : [25, 20, 15, 10, 5, 2.5, 1.25];
      // Use standard kg plates for calc, convert display
      const std = [25, 20, 15, 10, 5, 2.5, 1.25];
      const result = [];
      let remaining = Math.round(perSide * 100) / 100;
      for (const p of std) {
        let count = 0;
        while (remaining >= p - 0.01) {
          remaining -= p;
          remaining = Math.round(remaining * 100) / 100;
          count++;
        }
        if (count) result.push({ plate: p, count });
      }
      if (!result.length && perSide > 0) {
        document.getElementById('plate-result').innerHTML = '<p>Could not match exact weight with standard plates.</p>';
        return;
      }
      document.getElementById('plate-result').innerHTML =
        `<p class="mb-1">Per side (${toDisplay(perSide)} ${unitLabel()}):</p>` +
        result.map(r => `<p>• ${r.count} × ${toDisplay(r.plate)} ${unitLabel()}</p>`).join('') +
        (remaining > 0.05 ? `<p class="text-amber-600 text-xs mt-1">Remainder ~${toDisplay(remaining)} ${unitLabel()} unmatched</p>` : '');
    }

    function chartTheme() {
      const dark = !!data.dark;
      return {
        dark,
        text: dark ? '#cbd5e1' : '#64748b',
        grid: dark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.25)',
        tooltipBg: dark ? '#1e293b' : '#0f172a',
        tooltipTitle: dark ? '#f1f5f9' : '#f8fafc',
        tooltipBody: dark ? '#cbd5e1' : '#e2e8f0'
      };
    }

    function chartScaleOptions(yTitle, beginAtZero) {
      const t = chartTheme();
      return {
        x: {
          ticks: { color: t.text },
          grid: { color: t.grid },
          border: { color: t.grid }
        },
        y: {
          beginAtZero: !!beginAtZero,
          title: yTitle ? { display: true, text: yTitle, color: t.text } : undefined,
          ticks: { color: t.text },
          grid: { color: t.grid },
          border: { color: t.grid }
        }
      };
    }

    function chartPluginOptions(showLegend) {
      const t = chartTheme();
      return {
        legend: {
          display: !!showLegend,
          labels: { color: t.text }
        },
        tooltip: {
          backgroundColor: t.tooltipBg,
          titleColor: t.tooltipTitle,
          bodyColor: t.tooltipBody,
          borderColor: t.grid,
          borderWidth: 1
        }
      };
    }

    function renderProgressChart() {
      const exercise=document.getElementById('progress-exercise')?.value,canvas=document.getElementById('progressChart');
      if(!canvas)return;
      if(progressChart)progressChart.destroy();
      const weeks=Number(document.getElementById('progress-range')?.value||0),metric=document.getElementById('progress-metric')?.value||'estimate';
      const series=LoadnoteProgress.series(data.workouts,exercise,{weeks,metric,end:today()},estimated1RM);
      const label=metric==='load'?'Heaviest actual set':'Estimated 1RM';
      document.getElementById('progress-description').textContent=series.length?label+' · '+series.length+' logged days. Actual load is not necessarily a tested 1RM; estimates are calculated.':'No rep-based strength data in this range. Timed holds and cardio are available in exercise details.';
      progressChart=new Chart(canvas.getContext('2d'),{type:'line',data:{labels:series.map(p=>formatDate(p.date)),datasets:[{label:label+' ('+unitLabel()+')',data:series.map(p=>toDisplay(p.value)),borderColor:data.dark?'#a5b4fc':'#4f46e5',tension:0,pointRadius:4}]},options:{responsive:true,animation:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,plugins:chartPluginOptions(false),scales:chartScaleOptions(unitLabel(),true)}});
    }

    function renderNutritionChart() {
      const canvas = document.getElementById('nutritionChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (nutritionChart) nutritionChart.destroy();

      const sorted = [...data.nutrition].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
      const labels = sorted.map(n => formatDate(n.date)+(n.complete===true?' (complete)':' (partial / unconfirmed)'));
      const dark = !!data.dark;

      nutritionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Protein', data: sorted.map(n => n.protein), backgroundColor: dark ? '#818cf8' : '#4f46e5' },
            { label: 'Carbs', data: sorted.map(n => n.carbs), backgroundColor: dark ? '#34d399' : '#10b981' },
            { label: 'Fat', data: sorted.map(n => n.fat), backgroundColor: dark ? '#fbbf24' : '#f59e0b' }
          ]
        },
        options: {
          responsive: true,
          plugins: chartPluginOptions(true),
          scales: chartScaleOptions('grams', true)
        }
      });
    }

    function renderRecentActivity() {
      const el = document.getElementById('recent-activity');
      const items = [];

      data.workouts.slice(0, 5).forEach(w => {
        items.push({ date: w.date, text: `Workout: ${w.exercises.map(e => e.name).join(', ')}`, type: 'wo' });
      });
      data.nutrition.slice(0, 5).forEach(n => {
        items.push({ date: n.date, text: `Nutrition: P${n.protein ?? 'unknown'} / C${n.carbs ?? 'unknown'} / F${n.fat ?? 'unknown'}`, type: 'nu' });
      });

      items.sort((a, b) => b.date.localeCompare(a.date));
      const top = items.slice(0, 8);

      if (!top.length) {
        el.innerHTML = '<p class="text-slate-500">No activity yet. Start logging!</p>';
        return;
      }
      el.innerHTML = top.map(i => `
        <div class="flex gap-3 items-center">
          <span class="text-xs font-medium w-20 text-slate-500">${formatDate(i.date)}</span>
          <span class="text-slate-700">${escapeHtml(i.text)}</span>
        </div>
      `).join('');
    }

    // ========== Progress photos (local) ==========
    function compressImageFile(file, maxSide, quality) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read image'));
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            let w = img.width, h = img.height;
            const scale = Math.min(1, maxSide / Math.max(w, h));
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = () => reject(new Error('Invalid image'));
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    async function handlePhotoFile(ev) {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) return showToast('Please choose an image', 'error');
      try {
        showToast('Processing photo…', 'info');
        const dataUrl = await compressImageFile(file, 1200, 0.72);
        const entry = {
          id: Date.now() + Math.random(),
          date: document.getElementById('photo-date')?.value || today(),
          tag: document.getElementById('photo-tag')?.value || 'front',
          note: (document.getElementById('photo-note')?.value || '').trim(),
          dataUrl,
          created: today()
        };
        data.progressPhotos = data.progressPhotos || [];
        data.progressPhotos.push(entry);
        data.progressPhotos.sort((a, b) => b.date.localeCompare(a.date));
        saveData(data);
        if (document.getElementById('photo-note')) document.getElementById('photo-note').value = '';
        renderPhotos();
        showToast('Progress photo saved locally', 'success');
      } catch (e) {
        showToast('Photo failed: ' + e.message, 'error');
      }
    }

    function deletePhoto(id) {
      if (!confirm('Delete this progress photo?')) return;
      data.progressPhotos = (data.progressPhotos || []).filter(p => String(p.id) !== String(id));
      saveData(data);
      renderPhotos();
      showToast('Photo deleted', 'info');
    }

    function renderPhotos() {
      const grid = document.getElementById('photos-grid');
      const dateEl = document.getElementById('photo-date');
      if (dateEl && !dateEl.value) dateEl.value = today();
      const list = data.progressPhotos || [];
      if (!grid) return;
      if (!list.length) {
        grid.innerHTML = `<div class="empty-state col-span-full">
          <p class="empty-title">No progress photos yet</p>
          <p>Add a front/side/back check-in photo. Images stay on this device.</p>
        </div>`;
        document.getElementById('photo-compare')?.classList.add('hidden');
        return;
      }
      document.getElementById('photo-compare')?.classList.remove('hidden');
      grid.innerHTML = list.map(p => `
        <div class="photo-card">
          <img src="${escapeHtml(p.dataUrl)}" alt="${escapeHtml(p.tag)} ${escapeHtml(p.date)}" data-photo-id="${escapeHtml(p.id)}" onclick="viewPhotoFull(this.dataset.photoId)" />
          <div class="photo-meta flex justify-between items-start gap-1">
            <div>
              <div class="font-medium text-slate-700">${formatDate(p.date)} · ${escapeHtml(p.tag)}</div>
              ${p.note ? `<div>${escapeHtml(p.note)}</div>` : ''}
            </div>
            <button data-photo-id="${escapeHtml(p.id)}" onclick="deletePhoto(this.dataset.photoId)" aria-label="Delete photo" class="btn-danger text-xs">✕</button>
          </div>
        </div>
      `).join('');
      const opts = list.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.date)} · ${escapeHtml(p.tag)}${p.note ? ' · ' + escapeHtml(p.note) : ''}</option>`
      ).join('');
      const a = document.getElementById('photo-compare-a');
      const b = document.getElementById('photo-compare-b');
      if (a && b) {
        const prevA = a.value, prevB = b.value;
        a.innerHTML = opts;
        b.innerHTML = opts;
        if (list.length >= 2) {
          a.value = prevA || String(list[list.length - 1].id);
          b.value = prevB || String(list[0].id);
        }
        renderPhotoCompare();
      }
    }

    function renderPhotoCompare() {
      const list = data.progressPhotos || [];
      const idA = document.getElementById('photo-compare-a')?.value;
      const idB = document.getElementById('photo-compare-b')?.value;
      const pA = list.find(p => String(p.id) === String(idA));
      const pB = list.find(p => String(p.id) === String(idB));
      const vA = document.getElementById('photo-compare-a-view');
      const vB = document.getElementById('photo-compare-b-view');
      if (vA) vA.innerHTML = pA ? `<img src="${escapeHtml(pA.dataUrl)}" alt="compare A" />` : '';
      if (vB) vB.innerHTML = pB ? `<img src="${escapeHtml(pB.dataUrl)}" alt="compare B" />` : '';
    }

    function viewPhotoFull(id) {
      const p = (data.progressPhotos || []).find(x => String(x.id) === String(id));
      if (!p) return;
      const w = window.open('');
      if (w) {
        w.document.write(`<title>${escapeHtml(p.date)} ${escapeHtml(p.tag)}</title><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh"><img src="${escapeHtml(p.dataUrl)}" style="max-width:100%;max-height:100vh" /></body>`);
      }
    }

    /** Parse program lines like "Back Squat 4×5" or "Plank 3×30s" into form exercises */
    function parseProgramExerciseLine(line) {
      const raw = String(line).trim();
      if (!raw) return null;
      // "Name 3×8" or "Name 3x8" or "Name 3x30s"
      const m = raw.match(/^(.+?)\s+(\d+)\s*[×x]\s*(\d+)(s)?\s*$/i);
      if (m) {
        const name = m[1].trim();
        const setsN = parseInt(m[2], 10);
        const reps = parseInt(m[3], 10);
        const sets = [];
        for (let i = 0; i < setsN; i++) sets.push({ reps, weight: '' });
        return { name, type: 'strength', sets };
      }
      // Cardio-ish names without sets
      const cardioHints = /run|jog|cycle|bike|row|swim|walk|hike|cardio|elliptical|stair/i;
      if (cardioHints.test(raw) && !/\d+\s*[×x]\s*\d+/i.test(raw)) {
        return { name: raw, type: 'cardio', duration: '', distance: '', distanceUnit: 'km' };
      }
      return { name: raw, type: 'strength', sets: [{ reps: '', weight: '' }] };
    }

    function getProgramMesocycleState(prog) {
      const engine = window.LoadnoteMesocycle;
      if (!engine || !prog) return null;
      data.programStates = data.programStates || {};
      const state = engine.normalizeState(data.programStates[prog.id], prog.daysPerWeek);
      const completed = (data.workouts || []).filter(w => w.programId === prog.id).length;
      const sessionsPerWeek = Math.max(1, prog.daysPerWeek || prog.days?.length || 4);
      const weeksCompleted = Math.floor(completed / sessionsPerWeek);
      state.currentWeek = (weeksCompleted % state.lengthWeeks) + 1;
      state.blockIndex = Math.floor(weeksCompleted / state.lengthWeeks) + 1;
      data.programStates[prog.id] = state;
      return state;
    }

    function getProgramWeekDecision(prog) {
      const engine = window.LoadnoteMesocycle;
      if (!engine || !prog) return { action: 'progress', confidence: 'medium', reason: 'A small planned progression is appropriate.' };
      const state = getProgramMesocycleState(prog);
      const assessmentWeek = state.currentWeek > 1 ? state.currentWeek - 1 : state.lengthWeeks;
      const metrics = engine.programMetrics(prog, data.workouts || [], prog.daysPerWeek, assessmentWeek);
      return engine.recommendDecision(metrics);
    }

    function startProgramDay(dayIndex, fromAdaptive = false) {
      const prog = getActiveProgram();
      if (!prog || !prog.days || !prog.days[dayIndex]) return alert('Program day not found. Activate a program first.');
      const meso = window.LoadnoteMesocycle;
      const state = meso ? getProgramMesocycleState(prog) : null;
      const decision = state && state.currentWeek > 1 ? getProgramWeekDecision(prog).action : 'progress';
      const profile = window.LoadnoteAthlete ? window.LoadnoteAthlete.inferProfileFromData(data, window.LoadnoteCore) : (data.athleteProfile || {});
      const session = meso
        ? meso.buildSession(prog, data.workouts || [], profile, currentUnit(), state?.currentWeek || 1, decision, window.LoadnoteCore, window.LoadnoteAthlete, dayIndex)
        : null;
      const day = prog.days[dayIndex];
      const exercises = session
        ? session.exercises.map(ex => ({
            name: ex.name,
            type: ex.duration ? 'strength' : 'strength',
            sets: Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || '', weight: ex.weight == null ? '' : ex.weight }))
          }))
        : (day.exercises || []).map(parseProgramExerciseLine).filter(Boolean);
      if (!exercises.length) return alert('No exercises on this day.');
      const programContext = { programId: prog.id, dayIndex, dayName: day.day, week: session?.week || state?.currentWeek || 1, blockIndex: session?.blockIndex || state?.blockIndex || 1, decision };
      showTab('workouts'); showSubTab('workouts','wo-log');
      if (fillWorkoutForm(exercises, 'From program: ' + day.day + (session ? ` · Week ${session.week} · ${decision}` : '')) === false) return;
      pendingProgramSession = programContext;
      saveLoggerDraft();
      showToast(session ? `Week ${session.week} loaded — review targets before starting.` : 'Program workout loaded.', 'success');
    }

    function startNextProgramWorkout() {
      const prog = getActiveProgram();
      if (!prog) return alert('Activate a program first.');
      const meso = window.LoadnoteMesocycle;
      if (meso) {
        const state = getProgramMesocycleState(prog);
        const decision = state.currentWeek > 1 ? getProgramWeekDecision(prog).action : 'progress';
        const profile = window.LoadnoteAthlete ? window.LoadnoteAthlete.inferProfileFromData(data, window.LoadnoteCore) : (data.athleteProfile || {});
        const session = meso.buildSession(prog, data.workouts || [], profile, currentUnit(), state.currentWeek, decision, window.LoadnoteCore, window.LoadnoteAthlete);
        if (session) return startProgramDay(session.dayIndex, true);
      }
      const adaptive = window.LoadnoteAdaptivePrograms;
      if (!adaptive) return alert('Adaptive programming engine unavailable.');
      const session = adaptive.buildNextSession(prog, data.workouts || [], currentUnit(), window.LoadnoteAdaptive);
      if (!session) return alert('No next session is available.');
      startProgramDay(session.dayIndex, true);
    }

    function explainProgramDecision() {
      const prog = getActiveProgram();
      const el = document.getElementById('program-decision-explanation');
      if (!prog || !el || !window.LoadnoteMesocycle) return;
      const state = getProgramMesocycleState(prog);
      const decision = state.currentWeek > 1 ? getProgramWeekDecision(prog) : { action: 'progress', confidence: 'medium', reason: 'This is the first week, so Loadnote starts with the planned baseline.' };
      el.innerHTML = `<div class="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3"><b>Why ${decision.action}?</b><p class="text-xs text-slate-600 mt-1">${escapeHtml(window.LoadnoteMesocycle.explain(decision.action, state.currentWeek, state.lengthWeeks))}</p><p class="text-xs text-slate-500 mt-1">${escapeHtml(decision.reason)} · ${decision.confidence} confidence.</p></div>`;
      el.classList.remove('hidden');
    }

    // ========== AI Coach ==========
    function toggleGoalFields() {
      const type = document.getElementById('goal-type').value;
      document.getElementById('goal-strength-fields').classList.toggle('hidden', type !== 'strength');
      document.getElementById('goal-protein-fields').classList.toggle('hidden', type !== 'protein');
      document.getElementById('goal-consistency-fields').classList.toggle('hidden', type !== 'consistency');
    }

    function saveGoal() {
      const type = document.getElementById('goal-type').value;
      const deadline = document.getElementById('goal-deadline').value || null;
      const notes = document.getElementById('goal-notes').value.trim();
      let goal = { id: Date.now(), type, deadline, notes, created: today(), completed: false };

      if (type === 'strength') {
        const exercise = document.getElementById('goal-exercise').value.trim();
        const weightRaw = parseFloat(document.getElementById('goal-weight').value);
        if (!exercise || !weightRaw) return alert('Exercise and target weight required');
        goal.exercise = exercise;
        goal.targetWeight = toStorage(weightRaw);
      } else if (type === 'protein') {
        const target = parseFloat(document.getElementById('goal-protein-target').value);
        if (!target) return alert('Protein target required');
        goal.targetProtein = target;
      } else if (type === 'consistency') {
        const perWeek = parseInt(document.getElementById('goal-workouts-week').value);
        if (!perWeek) return alert('Workouts per week required');
        goal.targetPerWeek = perWeek;
      }

      data.goals = data.goals || [];
      data.goals.push(goal);
      saveData(data);
      // Clear form
      document.getElementById('goal-exercise').value = '';
      document.getElementById('goal-weight').value = '';
      document.getElementById('goal-protein-target').value = '';
      document.getElementById('goal-workouts-week').value = '';
      document.getElementById('goal-deadline').value = '';
      document.getElementById('goal-notes').value = '';
      renderCoach();
      alert('Goal saved!');
    }

    function deleteGoal(id) {
      if (!confirm('Delete this goal?')) return;
      data.goals = data.goals.filter(g => g.id !== id);
      saveData(data);
      renderCoach();
    }

    function completeGoal(id) {
      const g = data.goals.find(g => g.id === id);
      if (g) { g.completed = true; saveData(data); renderCoach(); }
    }

    function getSchemeInfo(scheme) {
      const map = {
        linear: {
          label: 'Linear progression',
          tip: 'Add weight each session (or each week) when you complete all sets/reps. Best for beginners. Typical jumps: +2.5 kg upper / +5 kg lower (or 5/10 lb). When you stall 2–3 times, deload 10% and rebuild.'
        },
        step: {
          label: 'Step loading',
          tip: 'Hold the same weight for 2–3 sessions (or a full week), then jump up. Example: 100×5 for 3 sessions → 105×5. Reduces noise from daily fatigue and works well for intermediate lifters.'
        },
        flat: {
          label: 'Flat loading',
          tip: 'Same sets, reps, and load across the training week for a lift. Progress week to week (e.g. Week 1: 3×5 @ 100, Week 2: 3×5 @ 102.5). Simple and recoverable; pair with a deload every 4–6 weeks.'
        },
        dup: {
          label: 'Daily undulating (DUP)',
          tip: 'Vary intensity/reps within the week on the same lifts. Example: Mon 5×3 heavy, Wed 4×6 moderate, Fri 3×10 lighter. Great for intermediate+ strength and hypertrophy together. Track each day type separately.'
        },
        wup: {
          label: 'Weekly undulating',
          tip: 'Change the main set/rep target each week in a repeating wave (e.g. Week 1: 5s, Week 2: 3s, Week 3: 8s, then repeat with slightly more weight). Good middle ground between linear and DUP.'
        },
        block: {
          label: 'Block periodization',
          tip: 'Train in focused blocks: Accumulation (higher volume, 6–12 reps) → Transmutation (strength, 3–6 reps) → Realization (peak/low volume, 1–3 reps) → Deload. Each block 3–6 weeks. Best for intermediate/advanced with a meet or test date.'
        },
        concurrent: {
          label: 'Concurrent (strength + hypertrophy)',
          tip: 'Train heavy compounds for strength (3–6 reps) and add higher-rep accessories (8–15) in the same mesocycle. Manage fatigue: keep compounds at RPE 7–9 and don’t take every accessory set to failure.'
        },
        conjugate: {
          label: 'Conjugate / Westside-style',
          tip: 'Rotate max-effort work (heavy singles/doubles, vary the lift weekly) and dynamic effort (speed work with bands/chains or lighter % for bar speed). Use many accessory variations. Advanced only — requires good recovery and exercise library.'
        }
      };
      return map[scheme] || map.linear;
    }

    // ========== v0.7 Athlete Profile + Personalized Programming ==========
    function getAthleteProfile() {
      const engine = window.LoadnoteAthlete;
      if (!engine) return data.athleteProfile || null;
      return engine.normalizeProfile(data.athleteProfile || {});
    }

    function saveAthleteProfile() {
      const engine = window.LoadnoteAthlete;
      if (!engine) return showToast('Athlete profile engine unavailable.', 'error');
      const num = id => {
        const v = parseFloat(document.getElementById(id)?.value);
        return Number.isFinite(v) && v > 0 ? toStorage(v) : null;
      };
      const pct = parseFloat(document.getElementById('athlete-tm-percent')?.value);
      data.athleteProfile = engine.normalizeProfile({
        goal: document.getElementById('athlete-goal')?.value || 'strength',
        experience: document.getElementById('athlete-experience')?.value || 'intermediate',
        daysPerWeek: parseInt(document.getElementById('athlete-days')?.value || '4', 10),
        programStyle: document.getElementById('athlete-style')?.value || 'auto',
        squat: num('athlete-squat'),
        bench: num('athlete-bench'),
        deadlift: num('athlete-deadlift'),
        overheadPress: num('athlete-ohp'),
        trainingMaxPercent: Number.isFinite(pct) ? pct / 100 : 0.90,
        targetDate: document.getElementById('athlete-target-date')?.value || null,
        notes: document.getElementById('athlete-notes')?.value.trim() || ''
      });
      saveData(data);
      renderCoach();
      showToast('Athlete profile saved.', 'success');
    }

    function renderAthleteProfile() {
      const engine = window.LoadnoteAthlete;
      const root = document.getElementById('athlete-profile-card');
      if (!root || !engine) return;
      const p = engine.inferProfileFromData(data, window.LoadnoteCore);
      const tms = engine.calculateTrainingMaxes(p, data.workouts || [], window.LoadnoteCore);
      const set = (id, value) => { const el = document.getElementById(id); if (el && (document.activeElement !== el || !el.value)) el.value = value ?? ''; };
      set('athlete-goal', p.goal); set('athlete-experience', p.experience); set('athlete-days', p.daysPerWeek); set('athlete-style', p.programStyle);
      set('athlete-squat', p.squat != null ? toDisplay(p.squat) : ''); set('athlete-bench', p.bench != null ? toDisplay(p.bench) : '');
      set('athlete-deadlift', p.deadlift != null ? toDisplay(p.deadlift) : ''); set('athlete-ohp', p.overheadPress != null ? toDisplay(p.overheadPress) : '');
      set('athlete-tm-percent', Math.round(p.trainingMaxPercent * 100)); set('athlete-target-date', p.targetDate || ''); set('athlete-notes', p.notes || '');
      const table = document.getElementById('athlete-tm-table');
      if (table) table.innerHTML = engine.buildPersonalizedSummary(p, tms, currentUnit()).map(row => row.available
        ? `<div class="flex items-center justify-between gap-3 py-2 border-t border-slate-200"><span class="font-medium">${escapeHtml(row.lift)}</span><span class="text-sm"><b>${escapeHtml(String(toDisplay(row.estimated1RM)))} ${unitLabel()}</b> e1RM · <b>${escapeHtml(String(toDisplay(row.trainingMax)))} ${unitLabel()}</b> TM</span></div>`
        : `<div class="flex items-center justify-between gap-3 py-2 border-t border-slate-200"><span class="font-medium">${escapeHtml(row.lift)}</span><span class="text-xs text-slate-500">No data yet</span></div>`).join('');
    }

    function personalizeGeneratedProgram(prog) {
      const engine = window.LoadnoteAthlete;
      if (!engine) return prog;
      const profile = engine.inferProfileFromData(data, window.LoadnoteCore);
      const tms = engine.calculateTrainingMaxes(profile, data.workouts || [], window.LoadnoteCore);
      prog.athleteProfileSnapshot = JSON.parse(JSON.stringify(profile));
      prog.trainingMaxes = tms;
      prog.personalized = true;
      prog.personalizationNote = `Built for a ${profile.experience} ${profile.goal} trainee training ${profile.daysPerWeek} days/week using a ${Math.round(profile.trainingMaxPercent * 100)}% training max.`;
      return prog;
    }

    function renderProgramProgressionStatus(active) {
      const el = document.getElementById('program-progression-status');
      if (!el) return;
      if (!active || !window.LoadnoteMesocycle) { el.innerHTML = ''; return; }
      const engine = window.LoadnoteMesocycle;
      const state = getProgramMesocycleState(active);
      const decision = state.currentWeek > 1 ? getProgramWeekDecision(active) : { action: 'progress', confidence: 'medium', reason: 'First week baseline.' };
      const completed = (data.workouts || []).filter(w => w.programId === active.id).length;
      const labels = { progress: 'Progress', maintain: 'Maintain', deload: 'Deload', pivot: 'Pivot' };
      const cls = decision.action === 'progress' ? 'text-emerald-700' : decision.action === 'deload' ? 'text-amber-700' : decision.action === 'pivot' ? 'text-indigo-700' : 'text-slate-700';
      el.innerHTML = `<div class="mt-3 rounded-lg border border-slate-200 bg-white p-3"><div class="flex items-center justify-between gap-2"><div><b>Adaptive mesocycle</b><div class="text-xs text-slate-500 mt-0.5">Week ${state.currentWeek} of ${state.lengthWeeks} · Block ${state.blockIndex} · ${completed} sessions logged</div></div><span class="font-semibold ${cls}">${labels[decision.action] || decision.action}</span></div><p class="text-xs text-slate-500 mt-1">${escapeHtml(decision.reason)} · ${decision.confidence} confidence.</p><button onclick="explainProgramDecision()" class="text-xs text-indigo-600 hover:underline mt-1">Why this decision?</button><div id="program-decision-explanation"></div></div>`;
    }

    function generateProgram() {
      const level = document.getElementById('prog-level').value;
      const days = parseInt(document.getElementById('prog-days').value);
      const focus = document.getElementById('prog-focus').value;
      const scheme = document.getElementById('prog-scheme')?.value || 'linear';
      const schemeInfo = getSchemeInfo(scheme);

      const programs = {
        3: {
          name: 'Full Body (3-Day)',
          days: [
            { day: 'Day A', exercises: ['Back Squat 3×5', 'Bench Press 3×5', 'Barbell Row 3×8', 'Plank 3×30s'] },
            { day: 'Day B', exercises: ['Deadlift 3×5', 'Overhead Press 3×5', 'Pull-Up / Lat Pulldown 3×8', 'Romanian Deadlift 3×8'] },
            { day: 'Day C', exercises: ['Front Squat 3×5', 'Incline Bench Press 3×8', 'Dumbbell Curl 3×10', 'Tricep Extension 3×10', 'Lunges 3×8/leg'] }
          ]
        },
        4: {
          name: 'Upper / Lower (4-Day)',
          days: [
            { day: 'Upper A', exercises: ['Bench Press 4×5', 'Barbell Row 4×6', 'Overhead Press 3×8', 'Pull-Up 3×8', 'Dumbbell Curl 3×10', 'Tricep Extension 3×10'] },
            { day: 'Lower A', exercises: ['Back Squat 4×5', 'Romanian Deadlift 3×8', 'Leg Press 3×10', 'Lunges 3×8/leg', 'Calf Raise 3×12'] },
            { day: 'Upper B', exercises: ['Incline Bench Press 4×6', 'Pull-Up / Chin-Up 4×6', 'Dumbbell Shoulder Press 3×8', 'Barbell Row 3×8', 'Face Pull 3×12'] },
            { day: 'Lower B', exercises: ['Deadlift 3×5', 'Front Squat 3×6', 'Hip Thrust 3×10', 'Leg Curl 3×10', 'Calf Raise 3×12'] }
          ]
        },
        5: {
          name: 'Push / Pull / Legs + Upper/Lower (5-Day)',
          days: [
            { day: 'Push', exercises: ['Bench Press 4×5', 'Overhead Press 3×8', 'Incline Dumbbell Press 3×10', 'Lateral Raise 3×12', 'Tricep Extension 3×10'] },
            { day: 'Pull', exercises: ['Deadlift 3×5', 'Barbell Row 4×6', 'Pull-Up 3×8', 'Face Pull 3×12', 'Dumbbell Curl 3×10'] },
            { day: 'Legs', exercises: ['Back Squat 4×5', 'Romanian Deadlift 3×8', 'Leg Press 3×10', 'Lunges 3×8/leg', 'Calf Raise 3×12'] },
            { day: 'Upper', exercises: ['Incline Bench Press 4×6', 'Chin-Up 3×8', 'Dumbbell Shoulder Press 3×8', 'Barbell Row 3×8'] },
            { day: 'Lower', exercises: ['Front Squat 3×6', 'Hip Thrust 3×10', 'Leg Curl 3×10', 'Calf Raise 3×15'] }
          ]
        },
        6: {
          name: 'Push / Pull / Legs (6-Day)',
          days: [
            { day: 'Push A', exercises: ['Bench Press 4×5', 'Overhead Press 3×8', 'Incline Dumbbell Press 3×10', 'Lateral Raise 3×12', 'Tricep Extension 3×10'] },
            { day: 'Pull A', exercises: ['Deadlift 3×5', 'Barbell Row 4×6', 'Pull-Up 3×8', 'Face Pull 3×12', 'Dumbbell Curl 3×10'] },
            { day: 'Legs A', exercises: ['Back Squat 4×5', 'Romanian Deadlift 3×8', 'Leg Press 3×10', 'Calf Raise 3×12'] },
            { day: 'Push B', exercises: ['Incline Bench Press 4×6', 'Dumbbell Shoulder Press 3×8', 'Cable Fly 3×12', 'Skull Crusher 3×10'] },
            { day: 'Pull B', exercises: ['Barbell Row 4×6', 'Chin-Up 3×8', 'Seated Cable Row 3×10', 'Face Pull 3×15', 'Hammer Curl 3×10'] },
            { day: 'Legs B', exercises: ['Front Squat 3×6', 'Hip Thrust 3×10', 'Lunges 3×8/leg', 'Leg Curl 3×10', 'Calf Raise 3×15'] }
          ]
        }
      };

      // Conjugate-style template override for 4 days
      if (scheme === 'conjugate' && days >= 4) {
        prog = {
          name: 'Conjugate-Style (4-Day)',
          days: [
            { day: 'Max Effort Upper', exercises: ['Heavy Bench variation 1–3RM', 'Barbell Row 4×6', 'Dumbbell Press 3×8', 'Tricep Extension 3×12', 'Face Pull 3×15'] },
            { day: 'Max Effort Lower', exercises: ['Heavy Squat/Deadlift variation 1–3RM', 'Romanian Deadlift 3×6', 'Leg Curl 3×10', 'Hip Thrust 3×8', 'Abs 3×12'] },
            { day: 'Dynamic Upper', exercises: ['Speed Bench 8×3 @ ~50–60% (explosive)', 'Pull-Up 4×6', 'Lateral Raise 3×15', 'Tricep Pushdown 3×12', 'Rear Delt Fly 3×15'] },
            { day: 'Dynamic Lower', exercises: ['Speed Squat 8×2 @ ~50–60%', 'Good Morning 3×6', 'Lunges 3×8/leg', 'Calf Raise 4×12', 'Back Extension 3×10'] }
          ]
        };
      } else {
        var prog = programs[days] || programs[4];
      }

      prog = JSON.parse(JSON.stringify(prog));

      // Adjust set/rep schemes based on focus, level, and periodization
      if (scheme === 'dup' && prog.days.length >= 3) {
        // Tag days with heavy / moderate / light emphasis on main lifts
        prog.days.forEach((d, i) => {
          const mod = i % 3;
          if (mod === 0) d.day += ' (Heavy ~3–5 reps)';
          else if (mod === 1) d.day += ' (Moderate ~6–8 reps)';
          else d.day += ' (Volume ~8–12 reps)';
        });
      } else if (scheme === 'block') {
        prog.name += ' — Accumulation block template';
        prog.days.forEach(d => {
          d.exercises = d.exercises.map(e => e.replace(/(\d+)×(\d+)/, (_, s, r) => {
            return e.replace(/\d+×\d+/, `4×8`);
          }));
        });
      } else if (focus === 'hypertrophy') {
        prog.days.forEach(d => {
          d.exercises = d.exercises.map(e => e.replace(/(\d+)×(\d+)/, (_, s, r) => {
            const sets = Math.min(4, parseInt(s) + 0);
            const reps = Math.max(8, parseInt(r) + 3);
            return e.replace(/\d+×\d+/, `${sets}×${reps}`);
          }));
        });
      } else if (focus === 'strength' && level !== 'beginner') {
        prog.days.forEach(d => {
          d.exercises = d.exercises.map(e => e.replace(/(\d+)×(\d+)/, (match, s, r) => {
            if (parseInt(r) <= 6) return match;
            return e.replace(/\d+×\d+/, `${s}×5`);
          }));
        });
      }

      if (level === 'beginner') {
        prog.name += ' — Beginner';
      } else if (level === 'advanced') {
        prog.name += ' — Advanced';
      }
      prog.name += ' · ' + schemeInfo.label;

      const newProg = {
        id: Date.now(),
        ...prog,
        level,
        daysPerWeek: days,
        focus,
        scheme,
        schemeLabel: schemeInfo.label,
        progressionTip: schemeInfo.tip,
        generated: today()
      };
      personalizeGeneratedProgram(newProg);
      data.programs = data.programs || [];
      data.programs.push(newProg);
      data.activeProgramId = newProg.id;
      data.programStates = data.programStates || {};
      data.programStates[newProg.id] = { lengthWeeks: 4, currentWeek: 1, blockIndex: 1, lastDecision: 'progress', decisionReason: 'New program baseline.' };
      // Migrate old single activeProgram if present
      if (data.activeProgram && !data.programs.find(p => p.name === data.activeProgram.name)) {
        data.programs.push({ ...data.activeProgram, id: Date.now() + 1 });
      }
      delete data.activeProgram;
      saveData(data);
      renderCoach();
      alert('Program saved to library and set as active!');
    }

    function getActiveProgram() {
      if (!data.activeProgramId) return null;
      return (data.programs || []).find(p => p.id === data.activeProgramId) || null;
    }

    function activateProgram(id) {
      data.activeProgramId = id;
      saveData(data);
      renderCoach();
    }

    function deactivateProgram() {
      data.activeProgramId = null;
      saveData(data);
      renderCoach();
    }

    function deleteProgram(id) {
      if (!confirm('Delete this program from your library?')) return;
      data.programs = (data.programs || []).filter(p => p.id !== id);
      if (data.activeProgramId === id) data.activeProgramId = null;
      saveData(data);
      renderCoach();
    }

    function getLiftTrend(exerciseName, lookbackDays) {
      const since = new Date();
      since.setDate(since.getDate() - (lookbackDays || 45));
      const sinceStr = since.toISOString().slice(0, 10);
      const key = exerciseName.toLowerCase();
      const points = [];
      (data.workouts || []).filter(w => w.date >= sinceStr).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio' || (ex.name || '').toLowerCase() !== key || !ex.sets?.length) return;
          const repSets = (ex.sets || []).filter(s => s.reps > 0);
          if (!repSets.length) return;
          const best = Math.max(...repSets.map(s => estimated1RM(s.weight, s.reps)));
          points.push({ date: w.date, est: best });
        });
      });
      points.sort((a, b) => a.date.localeCompare(b.date));
      return points;
    }

    function getCoachAdvice() {
      const tips = [];
      const now = new Date();
      const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
      const d14 = new Date(now); d14.setDate(d14.getDate() - 14);
      const d7Str = d7.toISOString().slice(0, 10);
      const d14Str = d14.toISOString().slice(0, 10);
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const d30Str = d30.toISOString().slice(0, 10);

      // Workouts last 7 days
      const wo7 = data.workouts.filter(w => w.date >= d7Str).length;
      const wo14prev = data.workouts.filter(w => w.date >= d14Str && w.date < d7Str).length;
      if (wo7 === 0) tips.push('You haven’t logged a workout in the last 7 days. Even a short session helps maintain momentum.');
      else if (wo7 >= 4) tips.push(`Strong consistency — ${wo7} workouts in the last 7 days. Keep protecting recovery.`);
      else tips.push(`You’ve trained ${wo7} time${wo7 === 1 ? '' : 's'} in the last 7 days. Aim for consistency over perfection.`);
      if (wo14prev > 0 && wo7 >= wo14prev + 2) {
        tips.push(`Frequency is up vs the prior week (${wo7} vs ${wo14prev}). Watch sleep and soreness so the jump is recoverable.`);
      }

      // Volume trend (last 2 weeks vs prior 2)
      const weeks = weekVolumeSeries(4);
      if (weeks.length === 4) {
        const recent = weeks[2].volume + weeks[3].volume;
        const prior = weeks[0].volume + weeks[1].volume;
        if (prior > 0 && recent > prior * 1.25) {
          tips.push(`Training volume is up ~${Math.round((recent / prior - 1) * 100)}% over the last 2 weeks vs the 2 before. If bars feel heavy, consider a lighter week.`);
        } else if (prior > 0 && recent < prior * 0.7 && weeks[3].sessions > 0) {
          tips.push('Volume dropped meaningfully vs earlier weeks. Fine if planned (cut/deload); otherwise ease compounds back up.');
        }
      }

      // Stagnant main lifts
      ['Back Squat', 'Bench Press', 'Deadlift', 'Conventional Deadlift', 'Competition Bench'].forEach(name => {
        const pts = getLiftTrend(name, 40);
        if (pts.length < 3) return;
        const first = pts[0].est, last = pts[pts.length - 1].est;
        if (last <= first * 1.01) {
          tips.push(`${name} estimated strength is flat over recent logs. Try a small jump, pause variants, or a deload then rebuild.`);
        }
      });

      const proteinSummary=nutritionSummary7('protein');
      tips.push(proteinSummary.validDays ? 'Protein: '+nutritionSummaryLabel(proteinSummary,'g')+'. Partial days are excluded.' : 'Mark finished nutrition days complete to enable intake summaries. Partial or unknown days are not treated as zero.');

      // Cardio balance
      let cardioMin = 0;
      data.workouts.filter(w => w.date >= d7Str).forEach(w => (w.exercises || []).forEach(ex => {
        if (ex.type === 'cardio') cardioMin += ex.duration || 0;
      }));
      if (cardioMin >= 150) tips.push(`Nice cardio base — ~${Math.round(cardioMin)} min logged this week. Keep hard intervals away from heavy lower-body days if recovery is tight.`);
      else if (wo7 >= 3 && cardioMin === 0) tips.push('No cardio logged this week. Easy zone-2 walks can help recovery without much interference.');

      // Strength goals progress
      const strengthGoals = (data.goals || []).filter(g => g.type === 'strength' && !g.completed);
      strengthGoals.forEach(g => {
        const pr = data.prs.find(p => p.exercise.toLowerCase() === g.exercise.toLowerCase());
        if (pr) {
          const pct = Math.round((pr.estimated1RM / g.targetWeight) * 100);
          if (pct >= 100) tips.push(`You’ve reached or passed your ${g.exercise} goal target. Time to set a new one!`);
          else tips.push(`${g.exercise}: current est. 1RM ${toDisplay(pr.estimated1RM)} ${unitLabel()} → goal ${toDisplay(g.targetWeight)} ${unitLabel()} (${pct}%).`);
        }
      });

      // Program reminder
      const activeProg = getActiveProgram();
      if (activeProg) {
        tips.push(`Active program: ${activeProg.name}. Use “Start this day” on a session, then Last weights / + Jump on each lift.`);
      } else {
        tips.push('No active program. Generate one above or activate one from your library.');
      }

      // Deload signal
      const dl = analyzeDeloadNeed();
      if (dl.level === 'high') {
        tips.push(`Deload signal: ${dl.summary} Open Deload Helper for a lighter-week plan.`);
      } else if (dl.level === 'moderate') {
        tips.push(`Recovery watch: ${dl.summary}`);
      }

      // Progress photos
      const photos = data.progressPhotos || [];
      if (!photos.length && (data.workouts || []).length >= 6) {
        tips.push('You’ve logged several workouts — a progress photo (Photos tab) makes visual changes easier to see than the scale alone.');
      } else if (photos.length) {
        const last = [...photos].sort((a, b) => b.date.localeCompare(a.date))[0];
        const days = Math.floor((now - new Date(last.date + 'T00:00:00')) / 86400000);
        if (days >= 21) tips.push(`Last progress photo was ${days} days ago (${last.date}). A new check-in photo can help track physique changes.`);
      }

      // Backup
      if ((data.workouts || []).length > 10 && !data.lastExportDate) {
        tips.push('You have a solid training history — export a JSON backup from Tools so you don’t lose it.');
      }

      if (!tips.length) tips.push('Log a few workouts and nutrition days so I can give you more specific advice.');
      return tips;
    }

    function weekVolumeSeries(numWeeks) {
      const weeks = [];
      const now = new Date();
      for (let i = numWeeks - 1; i >= 0; i--) {
        const ref = new Date(now);
        ref.setDate(ref.getDate() - i * 7);
        const day = ref.getDay();
        const monday = new Date(ref);
        monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
        const start = monday.toISOString().slice(0, 10);
        const endD = new Date(monday);
        endD.setDate(monday.getDate() + 6);
        const end = endD.toISOString().slice(0, 10);
        const sessions = (data.workouts || []).filter(w => w.date >= start && w.date <= end);
        const volume = sessions.reduce((s, w) => s + calcVolume(w), 0);
        const rest = (data.restDays || []).filter(d => d >= start && d <= end).length;
        weeks.push({ start, end, sessions: sessions.length, volume, rest });
      }
      return weeks;
    }

    function analyzeDeloadNeed() {
      const weeks = weekVolumeSeries(4);
      const reasons = [];
      let score = 0;
      if (weeks.length < 2 || weeks.every(w => w.sessions === 0)) {
        return {
          level: 'low',
          score: 0,
          summary: 'Not enough recent training data yet.',
          reasons: ['Log a few more weeks of workouts for a better deload signal.'],
          weeks
        };
      }
      const last = weeks[weeks.length - 1];
      const prev = weeks[weeks.length - 2];
      const avgVol = weeks.reduce((s, w) => s + w.volume, 0) / weeks.filter(w => w.sessions > 0).length || 1;
      const totalSessions4 = weeks.reduce((s, w) => s + w.sessions, 0);
      const totalRest4 = weeks.reduce((s, w) => s + w.rest, 0);

      if (last.sessions >= 5) { score += 2; reasons.push(`High frequency this week (${last.sessions} sessions).`); }
      else if (last.sessions >= 4) { score += 1; reasons.push(`Solid frequency this week (${last.sessions} sessions).`); }

      if (prev.volume > 0 && last.volume > prev.volume * 1.15) {
        score += 2;
        reasons.push('Volume jumped more than ~15% vs last week.');
      }
      if (avgVol > 0 && last.volume > avgVol * 1.2) {
        score += 1;
        reasons.push('This week’s volume is well above your 4-week average.');
      }
      if (totalSessions4 >= 14 && totalRest4 <= 1) {
        score += 2;
        reasons.push('Many sessions in 4 weeks with very few marked rest days.');
      }
      // Rising volume 3 weeks in a row
      if (weeks.length >= 3) {
        const a = weeks[weeks.length - 3].volume;
        const b = weeks[weeks.length - 2].volume;
        const c = weeks[weeks.length - 1].volume;
        if (a > 0 && b > a && c > b) {
          score += 2;
          reasons.push('Volume has climbed three weeks in a row.');
        }
      }

      let level = 'low';
      if (score >= 5) level = 'high';
      else if (score >= 3) level = 'moderate';

      let summary = 'Training load looks manageable.';
      if (level === 'high') summary = 'Load looks high — a deload week is likely a good idea.';
      else if (level === 'moderate') summary = 'Load is elevated — consider an easier week soon.';
      if (!reasons.length) reasons.push('No strong fatigue flags from volume/frequency alone.');

      return { level, score, summary, reasons, weeks };
    }

    function refreshDeloadHelper() {
      const el = document.getElementById('deload-status');
      if (!el) return;
      const dl = analyzeDeloadNeed();
      const color = dl.level === 'high' ? 'text-red-700' : dl.level === 'moderate' ? 'text-amber-700' : 'text-emerald-700';
      const badge = dl.level === 'high' ? 'High need' : dl.level === 'moderate' ? 'Moderate' : 'Low need';
      const weekLines = dl.weeks.map((w, i) =>
        `<li>W${i + 1} (${w.start}): ${w.sessions} sessions · vol ${Math.round(toDisplay(w.volume))} ${unitLabel()} · rest ${w.rest}</li>`
      ).join('');
      el.innerHTML = `
        <p><span class="font-semibold ${color}">${badge}</span> — ${dl.summary}</p>
        <ul class="list-disc ml-5 text-slate-600">${dl.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
        <p class="font-medium mt-2">Last 4 weeks</p>
        <ul class="text-slate-600 text-xs space-y-0.5">${weekLines}</ul>
      `;
    }

    function showDeloadPlan() {
      const planEl = document.getElementById('deload-plan');
      if (!planEl) return;
      const dl = analyzeDeloadNeed();
      const jump = currentUnit() === 'lb' ? '5–10 lb' : '2.5–5 kg';
      planEl.classList.remove('hidden');
      planEl.innerHTML = `
        <p class="font-semibold">Suggested deload week</p>
        <p class="text-slate-600">${dl.summary}</p>
        <ul class="list-disc ml-5 space-y-1 text-slate-700 mt-2">
          <li><b>Volume:</b> cut sets by ~40–50% on main lifts (e.g. 4 sets → 2).</li>
          <li><b>Intensity:</b> keep weights around 80–90% of recent working weight, or drop about ${jump} if you feel beat up.</li>
          <li><b>Reps:</b> stay away from failure — stop ~3–4 reps in reserve (RPE ≤ 7).</li>
          <li><b>Cardio:</b> easy only (zone 2); skip hard intervals.</li>
          <li><b>Frequency:</b> same days is fine, or drop one session if sleep/stress is poor.</li>
          <li><b>Next week:</b> resume normal sets; start weights at last pre-deload or a small jump.</li>
        </ul>
        <p class="text-xs text-slate-500 mt-2">If pain (not normal soreness) is present, prioritize rest and professional care over programming.</p>
      `;
      refreshDeloadHelper();
    }

    function applyDeloadRestDays() {
      const start = new Date();
      data.restDays = data.restDays || [];
      let added = 0;
      // Mark every other day for the next 7 days as optional rest markers (user can clear)
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        // Suggest rest on day 3 and 7 of the window
        if (i === 2 || i === 6) {
          if (!data.restDays.includes(iso)) {
            data.restDays.push(iso);
            added++;
          }
        }
      }
      saveData(data);
      alert(added ? `Added ${added} rest day marker(s) over the next week. Edit anytime on the Calendar tab.` : 'Rest markers for this window already present.');
      refreshDeloadHelper();
    }

    // ========== Chat ==========
    function askSuggestion(text) {
      document.getElementById('chat-input').value = text;
      sendChat();
    }

    function appendChatMessage(text, isUser) {
      const container = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'flex gap-2 ' + (isUser ? 'justify-end' : '');
      div.innerHTML = `
        <div class="${isUser ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-900'} rounded-lg px-3 py-2 max-w-[85%]">
          ${text}
        </div>
      `;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    function getChatResponse(msg) {
      const q = msg.toLowerCase().trim();

      // --- Progression ---
      if (q.includes('progress') || q.includes('increase weight') || q.includes('add weight') || q.includes('how should i progress') || q.includes('linear progression')) {
        const up = currentUnit() === 'lb' ? '5 lb' : '2.5 kg';
        const low = currentUnit() === 'lb' ? '10 lb' : '5 kg';
        let personal = '';
        const flat = [];
        ['Back Squat', 'Bench Press', 'Deadlift'].forEach(n => {
          const pts = getLiftTrend(n, 40);
          if (pts.length >= 3 && pts[pts.length - 1].est <= pts[0].est * 1.01) flat.push(n);
        });
        if (flat.length) personal = `<br><br><b>From your log:</b> ${flat.join(', ')} look flat recently — use <b>Last weights</b> then <b>+ Jump</b>, or swap in a pause/tempo variant for 2–3 weeks.`;
        else if ((data.workouts || []).length) personal = '<br><br><b>From your log:</b> keep using Last weights / + Jump on compounds so each session tries a small overload.';
        return `Progressive overload is the main driver of strength and muscle. The simplest reliable method:<br><br>• Complete all prescribed sets and reps with good form.<br>• Next session, add weight: typically <b>+${up}</b> on upper-body lifts and <b>+${low}</b> on lower-body compounds.<br>• If you fail any set, stay at the same weight until you succeed.<br>• When linear progression stalls (you can’t add weight for 2–3 sessions), switch to smaller jumps, add a back-off set, or move to a weekly progression model.${personal}`;
      }

      // --- Protein ---
      if (q.includes('protein') || q.includes('how much protein')) {
        const summary=nutritionSummary7('protein');
        const extra=' Your log: '+nutritionSummaryLabel(summary,'g')+'. Partial days are excluded.';
        return `For lifters, the evidence-based range is <b>1.6–2.2 g of protein per kg of bodyweight</b>. Many people land in the practical zone of 150–180 g per day.<br><br>Spread intake across 3–5 meals so each feeding has ~30–50 g. Higher protein also helps during a cut by preserving muscle and increasing satiety.${extra}<br><br>You can set a daily protein goal using the Goal form on this page.`;
      }

      // --- Soreness / recovery ---
      if (q.includes('sore') || q.includes('soreness') || q.includes('recover') || q.includes(' recovery') || q.includes('doms')) {
        return 'Muscle soreness (DOMS) is common, especially after new exercises or higher volume. Guidelines:<br><br>• <b>Mild–moderate soreness</b> → train as planned if performance is still decent.<br>• <b>Sharp pain, joint pain, or big strength drop</b> → rest that movement or take an easy day.<br>• Best recovery tools are still the basics: enough sleep, sufficient protein, and not exceeding recoverable volume.<br><br>If soreness keeps stopping you from training consistently, reduce weekly sets slightly for 1–2 weeks rather than skipping sessions entirely.';
      }

      // --- Deload ---
      if (q.includes('deload') || q.includes('overreach') || q.includes('fatigued') || q.includes('burnt out') || q.includes('stalled')) {
        const dl = analyzeDeloadNeed();
        const signal = `<br><br><b>Your current deload signal:</b> ${dl.level.toUpperCase()} — ${dl.summary} Open <b>Deload Helper</b> on this page for a full plan.`;
        return 'A deload is a planned easier week that lets fatigue drop so you can keep progressing long-term. Signs you may need one:<br><br>• Strength has stalled or dropped for 2+ weeks<br>• Motivation is unusually low<br>• Sleep quality is down<br>• Joints or connective tissue feel beat up<br><br><b>Simple deload protocol:</b> keep the same exercises but cut sets roughly in half <i>or</i> reduce the weight by 40–50% for 5–7 days. Then return to normal training. Most intermediate and advanced lifters benefit from a deload every 4–8 weeks.' + signal;
      }

      // --- Squat form ---
      if (q.includes('squat') && (q.includes('form') || q.includes('technique') || q.includes('tip') || q.includes('cue'))) {
        return 'High-value squat cues:<br><br>1. Brace hard (big breath into the belt area) before you unrack.<br>2. Sit back <i>and</i> down — knees track in line with toes.<br>3. Aim for hip crease below the top of the knee if mobility allows.<br>4. Keep the chest up and spine neutral; don’t round or excessively lean.<br>5. Drive through the mid-foot on the way up.<br><br>Common fixes: knees caving → actively push them out. Excessive forward lean → strengthen upper back and core, and check ankle mobility. Film from the side every couple of weeks — it’s the fastest way to improve.';
      }

      // --- Bench form ---
      if (q.includes('bench') && (q.includes('form') || q.includes('technique') || q.includes('tip') || q.includes('cue'))) {
        return 'Solid bench press technique:<br><br>1. Retract and depress the shoulder blades to create a stable “shelf”.<br>2. A moderate arch is normal and safe for most lifters.<br>3. Feet planted firmly, glutes tight, upper back tight.<br>4. Lower under control to the lower chest / nipple line.<br>5. Elbows roughly 45–70° from the torso (not flared straight out).<br>6. Press up and slightly back toward the rack.<br><br>Touch the chest every rep unless you have a specific reason not to. If shoulders bother you, check scapular position and elbow angle first.';
      }

      // --- Deadlift form ---
      if (q.includes('deadlift') && (q.includes('form') || q.includes('technique') || q.includes('tip') || q.includes('cue'))) {
        return 'Deadlift checklist:<br><br>1. Bar starts over mid-foot.<br>2. Hinge at the hips, shins relatively vertical, grab the bar.<br>3. Flatten the back (neutral spine) and brace hard.<br>4. Push the floor away — think “leg press the ground”.<br>5. Keep the bar close to the body the entire time.<br>6. Lock out by standing tall; don’t hyperextend the lower back.<br><br>Conventional and sumo are both valid — choose the style that fits your leverages and feels stronger. Film from the side to check bar path and back position.';
      }

      // --- Warm-up ---
      if (q.includes('warm') || q.includes('warm-up') || q.includes('warmup') || q.includes('warm up')) {
        return 'A good warm-up prepares you without fatiguing you:<br><br>1. 3–5 min light cardio or easy movement to raise body temperature.<br>2. 1–2 dynamic mobility drills for the joints you’ll use (hips, shoulders, T-spine).<br>3. Specific warm-up sets for the main lift: start empty bar or very light, then 2–4 progressively heavier sets that ramp toward your working weight (e.g. 40% → 60% → 75–80%).<br><br>Keep warm-up sets low-rep (especially as the weight climbs). You should feel primed, not tired, when the real work starts.';
      }

      // --- Sleep ---
      if (q.includes('sleep') || q.includes('rest day') || q.includes('recovery day')) {
        return 'Sleep is one of the highest-leverage recovery tools. Aim for <b>7–9 hours</b> most nights. Poor sleep reduces strength, raises injury risk, and makes progressive overload harder.<br><br>On rest days you don’t need to be completely still — light walking, easy mobility, or very light technique work is fine. Full rest is also fine. The goal is to arrive at the next hard session recovered enough to perform and progress.';
      }

      // --- Training to failure ---
      if (q.includes('failure') || q.includes('to failure') || q.includes('amrap') || q.includes('rir')) {
        return 'Training to failure is a tool, not a requirement every set.<br><br>• <b>Compounds (squat, bench, deadlift, row)</b>: leave 1–3 reps in reserve (RIR) on most sets. Going to failure often is fatiguing and can hurt technique.<br>• <b>Isolation work</b> (curls, laterals, etc.): failure or close to it is more appropriate.<br>• Beginners usually progress fine without frequent failure.<br><br>Use an occasional AMRAP (as many reps as possible) set to test progress, then return to controlled RIR-based training.';
      }

      // --- Frequency / split ---
      if (q.includes('how many days') || q.includes('how often') || q.includes('frequency') || q.includes('split') || q.includes('routine')) {
        return 'Training frequency guidelines:<br><br>• <b>Beginners</b>: 3 full-body sessions per week works extremely well.<br>• <b>Intermediate</b>: 4 days (Upper/Lower) is a sweet spot for most; 5–6 days (Push/Pull/Legs) also works if recovery is good.<br>• Hitting each muscle 2× per week tends to be better than once per week for most people.<br><br>Consistency beats the “perfect” split. Use the Program Generator above to build something that matches the days you can actually train.';
      }

      // --- Goals ---
      if (q.includes('goal') || q.includes('set a goal') || q.includes('target') || q.includes('aim')) {
        return 'Clear goals dramatically improve results. On this page you can set:<br><br>• <b>Strength goals</b> — pick a lift and a target weight (tracked against estimated 1RM)<br>• <b>Protein goals</b> — daily target in grams<br>• <b>Consistency goals</b> — target number of workouts per week<br><br>Write the goal, give it an optional deadline, and check progress as you log data. Strength goals + a structured program is one of the highest-ROI combinations you can make.';
      }

      // --- Nutrition / bulk / cut ---
      if (q.includes('calorie') || q.includes('macros') || q.includes('diet') || q.includes('cut') || q.includes('bulk') || q.includes('surplus') || q.includes('deficit')) {
        return 'Simple nutrition frameworks:<br><br>• <b>Build muscle (bulk)</b>: small calorie surplus (roughly +200–300 kcal), high protein, progressive training.<br>• <b>Lose fat (cut)</b>: moderate deficit, keep protein high (often toward the upper end of 1.6–2.2 g/kg), try to maintain strength.<br>• <b>Recomp</b>: possible for beginners or those returning from a break — eat around maintenance, train hard, be patient.<br><br>Track nutrition for at least 1–2 weeks in the Nutrition tab so we have real numbers instead of guesses.';
      }

      // --- RPE ---
      if (q.includes('rpe') || q.includes('rate of perceived') || q.includes('effort')) {
        return 'RPE (Rate of Perceived Exertion) is a 1–10 scale of how hard a set felt. In practice:<br><br>• RPE 10 = absolute failure, no more reps<br>• RPE 9 = 1 rep left<br>• RPE 8 = 2 reps left<br>• RPE 7 = 3 reps left<br><br>Most working sets for compounds work well around RPE 7–9. It helps you autoregulate — on good days you can push a bit more, on poor days you don’t force a number that isn’t there.';
      }

      // --- Plateaus ---
      if (q.includes('plateau') || q.includes('stuck') || q.includes('not getting stronger') || q.includes('no progress')) {
        return 'When progress stalls, check these in order:<br><br>1. Are you actually recovering (sleep, protein, stress)?<br>2. Has your bodyweight been stable or dropping unintentionally?<br>3. Are you still progressing load or reps over the weeks?<br>4. Has it been 4–8+ weeks without a deload?<br>5. Is technique breaking down at heavier weights?<br><br>Often the fix is a deload, a small technique reset, or simply adding a bit more food. Log consistently so patterns become obvious.';
      }

      // --- Periodization / loading schemes ---
      if (q.includes('step load') || q.includes('step loading')) {
        return getSchemeInfo('step').tip + '<br><br>Use the Program Generator and select <b>Step loading</b> to attach this scheme to a template.';
      }
      if (q.includes('flat load') || q.includes('flat loading')) {
        return getSchemeInfo('flat').tip + '<br><br>Select <b>Flat loading</b> in the Program Generator when building a program.';
      }
      if (q.includes('linear period') || (q.includes('linear') && (q.includes('progress') || q.includes('period')))) {
        return getSchemeInfo('linear').tip + '<br><br>Best default for beginners. Choose <b>Linear progression</b> in the Program Generator.';
      }
      if (q.includes('dup') || q.includes('daily undulating') || (q.includes('undulating') && q.includes('daily'))) {
        return getSchemeInfo('dup').tip + '<br><br>Choose <b>Daily undulating (DUP)</b> in the Program Generator — days get tagged Heavy / Moderate / Volume.';
      }
      if (q.includes('weekly undulating') || q.includes('wup') || (q.includes('undulating') && q.includes('week'))) {
        return getSchemeInfo('wup').tip + '<br><br>Select <b>Weekly undulating</b> when generating a program.';
      }
      if (q.includes('block period') || q.includes('block training') || q.includes('accumulation') || q.includes('transmutation') || q.includes('realization')) {
        return getSchemeInfo('block').tip + '<br><br>Generator option: <b>Block periodization</b> (starts you in an accumulation-style template). Rotate blocks every 3–6 weeks.';
      }
      if (q.includes('concurrent')) {
        return getSchemeInfo('concurrent').tip + '<br><br>Pick <b>Concurrent</b> in the Program Generator, or use Strength focus on compounds and add higher-rep accessories yourself.';
      }
      if (q.includes('conjugate') || q.includes('westside')) {
        return getSchemeInfo('conjugate').tip + '<br><br>Select <b>Conjugate</b> + 4 days in the Program Generator for a max-effort / dynamic-effort style template. Rotate main lifts weekly.';
      }
      if (q.includes('periodization') || q.includes('loading scheme') || q.includes('loading method') || q.includes('programming model')) {
        return 'Common strength loading schemes:<br><br>• <b>Linear</b> — add weight each session/week (beginner gold standard)<br>• <b>Step loading</b> — same weight 2–3 sessions, then jump<br>• <b>Flat loading</b> — same load across the week; progress weekly<br>• <b>DUP</b> — heavy / moderate / light days in the same week<br>• <b>Weekly undulating</b> — wave set/rep targets week to week<br>• <b>Block</b> — accumulation → transmutation → realization<br>• <b>Concurrent</b> — strength + hypertrophy in the same phase<br>• <b>Conjugate</b> — max effort + dynamic effort, rotate lifts<br><br>Ask about any one of these, or pick it in the Program Generator under <b>Loading / Periodization</b>.';
      }

      // --- Default ---
      return 'I can help with a wide range of topics:<br><br>• Progression & loading schemes (linear, step, flat, DUP, block, concurrent, conjugate)<br>• Protein and nutrition (bulk/cut)<br>• Soreness, recovery, sleep<br>• Deloads and plateaus<br>• Form cues for squat, bench, deadlift<br>• Warm-ups, RPE, training to failure<br>• Frequency, splits, and goal setting<br><br>Try one of the quick buttons, ask about a periodization model, or generate a program with a specific loading scheme.';
    }

    function getStoredApiKey() {
      try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; }
    }
    function setStoredApiKey(key) {
      try {
        if (key) localStorage.setItem(API_KEY_STORAGE, key);
        else localStorage.removeItem(API_KEY_STORAGE);
      } catch (e) {
        showToast('Could not store API key', 'error');
      }
    }

    function applyApiProviderPreset() {
      const p = document.getElementById('api-provider')?.value || 'xai';
      const base = document.getElementById('api-base');
      const model = document.getElementById('api-model');
      if (p === 'xai') {
        if (base) base.value = 'https://api.x.ai/v1';
        if (model && (!model.value || model.value.startsWith('gpt'))) model.value = 'grok-2-latest';
      } else if (p === 'openai') {
        if (base) base.value = 'https://api.openai.com/v1';
        if (model && (!model.value || model.value.includes('grok'))) model.value = 'gpt-4o-mini';
      }
    }

    function saveApiSettings() {
      data.api = data.api || {};
      data.api.enabled = !!document.getElementById('api-enabled')?.checked;
      data.api.backendEnabled = document.getElementById('api-backend-enabled')?.checked !== false;
      data.api.backendUrl = (document.getElementById('api-backend-url')?.value || '/api/coach').trim();
      data.api.provider = document.getElementById('api-provider')?.value || 'xai';
      data.api.baseUrl = (document.getElementById('api-base')?.value || '').trim().replace(/\/$/, '');
      data.api.model = (document.getElementById('api-model')?.value || '').trim();
      const key = (document.getElementById('api-key')?.value || '').trim();
      if (key && key !== '••••••••') setStoredApiKey(key);
      saveData(data);
      updateApiStatusUI();
      showToast('API settings saved (key stays in this browser only)', 'success');
    }

    function clearApiKey() {
      setStoredApiKey('');
      const el = document.getElementById('api-key');
      if (el) el.value = '';
      if (data.api) data.api.enabled = false;
      const en = document.getElementById('api-enabled');
      if (en) en.checked = false;
      saveData(data);
      updateApiStatusUI();
      showToast('API key cleared', 'info');
    }

    function updateApiStatusUI() {
      const key = getStoredApiKey();
      const backendEnabled = !!(data.api && data.api.backendEnabled !== false);
      const enabled = !!(data.api && data.api.enabled && key);
      const aiEnabled = backendEnabled || enabled;
      const status = document.getElementById('api-status');
      const hint = document.getElementById('chat-mode-hint');
      if (status) {
        status.textContent = backendEnabled
          ? `Secure backend · ${data.api.backendUrl || '/api/coach'}`
          : (enabled ? `Developer API · ${(data.api.model || 'model')}` : (key ? 'Key saved — enable developer API' : 'Offline rule-based coach'));
        status.className = 'text-xs ' + (aiEnabled ? 'text-emerald-600 font-medium' : 'text-slate-500');
      }
      if (hint) {
        hint.textContent = backendEnabled
          ? 'Using Loadnote Coach backend when available; deterministic insights remain available offline.'
          : (enabled ? 'Using developer API mode — answers can use your recent training data.' : 'Using built-in coach (no API).');
      }
      // Populate form fields
      const api = data.api || {};
      const prov = document.getElementById('api-provider');
      const base = document.getElementById('api-base');
      const model = document.getElementById('api-model');
      const en = document.getElementById('api-enabled');
      const keyEl = document.getElementById('api-key');
      const backendToggle = document.getElementById('api-backend-enabled');
      const backendUrl = document.getElementById('api-backend-url');
      if (prov && api.provider) prov.value = api.provider;
      if (base) base.value = api.baseUrl || 'https://api.x.ai/v1';
      if (model) model.value = api.model || 'grok-2-latest';
      if (en) en.checked = !!api.enabled;
      if (backendToggle) backendToggle.checked = api.backendEnabled !== false;
      if (backendUrl) backendUrl.value = api.backendUrl || '/api/coach';
      if (keyEl && key && keyEl.value !== '••••••••') keyEl.placeholder = 'Developer key saved on this device (local development only)';
    }

    function buildCoachSystemPrompt() {
      const unit = unitLabel();
      const recentWo = (data.workouts || []).slice(0, 8);
      const woLines = recentWo.map(w => {
        const parts = (w.exercises || []).map(ex => {
          if (ex.type === 'cardio') return `${escapeHtml(ex.name)} ${ex.duration || 0}min`;
          const sets = (ex.sets || []).map(s => {
            if (s.duration > 0 && !(s.reps > 0)) return `${s.duration}s x ${toDisplay(s.weight)}${unit}`;
            return `${s.reps}x${toDisplay(s.weight)}${unit}`;
          }).join(', ');
          return `${escapeHtml(ex.name)}: ${sets}`;
        }).join('; ');
        return `${w.date}: ${parts}`;
      }).join('\n') || 'No workouts logged yet.';
      const proteinSummary = nutritionSummary7('protein');
      const prs = (data.prs || []).slice(0, 8).map(p =>
        `${p.exercise}: ${toDisplay(p.weight)}${unit} x ${p.reps}`
      ).join('; ') || 'None';
      const dl = typeof analyzeDeloadNeed === 'function' ? analyzeDeloadNeed() : null;
      const active = typeof getActiveProgram === 'function' ? getActiveProgram() : null;

      return `You are a practical strength & nutrition coach inside a local fitness tracking app.
Be concise, actionable, and evidence-informed. Use the user's units (${unit}).
Do not invent specific lifts or numbers that contradict the log summary.
If data is missing, say what to log.
Important: You are not a doctor, physical therapist, dietitian, or licensed medical professional. Your suggestions are general fitness recommendations only — not medical advice, diagnosis, or treatment. If the user describes pain, injury, illness, or a medical condition, encourage them to consult a qualified professional.

USER CONTEXT:
- Weight unit: ${unit}
- Workouts (30d count): ${(data.workouts || []).filter(w => w.date >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).length}
- Streak: ${typeof calcStreak === 'function' ? calcStreak() : 0} days
- Recent workouts:
${woLines}
- Recent protein: ${nutritionSummaryLabel(proteinSummary,'g')}. Only complete days with known values contribute. Do not infer full-week intake or deficiencies from partial coverage.
- Top PRs: ${prs}
- Deload signal: ${dl ? dl.level + ' — ' + dl.summary : 'n/a'}
- Active program: ${active ? active.name : 'none'}
- Goals: ${(data.goals || []).filter(g => !g.completed).map(g => g.type + (g.exercise ? ' ' + g.exercise : '')).join(', ') || 'none'}
- Progress photos on device: ${(data.progressPhotos || []).length}
- Last photo date: ${((data.progressPhotos || []).slice().sort((a,b)=>b.date.localeCompare(a.date))[0] || {}).date || 'none'}`;
    }

    function buildCoachContext() {
      const engine = window.LoadnoteCoach;
      const analytics = window.LoadnoteAnalytics;
      const active = typeof getActiveProgram === 'function' ? getActiveProgram() : null;
      if (!engine) return null;
      return engine.buildContext({
        data,
        analytics,
        adaptive: lastCoachSnapshot?.recommendation || null,
        unit: unitLabel(),
        activeProgram: active
      });
    }

    function buildCoachMessages(userMessage) {
      const engine = window.LoadnoteCoach;
      const context = buildCoachContext();
      const system = engine ? engine.buildSystemPrompt() : buildCoachSystemPrompt();
      return [
        { role: 'system', content: system + '\n\nATHLETE CONTEXT:\n' + JSON.stringify(context || {}, null, 2) },
        ...chatHistory.slice(-10),
        { role: 'user', content: userMessage }
      ];
    }

    async function callCoachAPI(userMessage) {
      const api = data.api || {};
      const backendEnabled = api.backendEnabled !== false;
      const messages = buildCoachMessages(userMessage);
      let url = '';
      let headers = { 'Content-Type': 'application/json' };
      let body = { messages };

      if (backendEnabled) {
        url = (api.backendUrl || '/api/coach').trim();
      } else {
        const key = getStoredApiKey();
        if (!key) throw new Error('No API key saved');
        if (!api.baseUrl) throw new Error('No API base URL');
        url = api.baseUrl.replace(/\/$/, '') + '/chat/completions';
        headers.Authorization = 'Bearer ' + key;
        body = { model: api.model || 'grok-2-latest', messages, temperature: 0.4 };
      }

      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let msg = 'Coach API error ' + res.status;
        try { const j = JSON.parse(errText); msg = j.error?.message || j.message || msg; }
        catch { if (errText) msg += ': ' + errText.slice(0, 180); }
        throw new Error(msg);
      }
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from coach API');
      return content;
    }

    async function requestStructuredCoach(userMessage) {
      const engine = window.LoadnoteCoach;
      const raw = await callCoachAPI(userMessage);
      if (!engine) return null;
      const parsed = engine.parseStructuredResponse(raw);
      lastCoachSnapshot = parsed;
      return parsed;
    }

    async function testApiConnection() {
      saveApiSettings();
      const backend = (data.api || {}).backendEnabled !== false;
      if (!backend && !getStoredApiKey()) return showToast('Save an API key first', 'error');
      showToast('Testing coach connection…', 'info');
      try {
        if (backend) {
          const healthUrl = ((data.api || {}).backendUrl || '/api/coach').replace(/\/coach\/?$/, '/health');
          const res = await fetch(healthUrl);
          if (!res.ok) throw new Error('Backend returned ' + res.status);
          const j = await res.json();
          if (!j.ok) throw new Error('Backend health check failed');
          showToast(j.aiConfigured ? 'Secure coach backend connected' : 'Backend connected, but AI key is not configured', j.aiConfigured ? 'success' : 'error');
        } else {
          const reply = await callCoachAPI('Reply with exactly: OK connected');
          showToast('API connected', 'success');
          appendChatMessage('<i>Connection test:</i> ' + escapeChat(reply), false);
        }
      } catch (e) { showToast('Coach connection failed: ' + e.message, 'error'); }
    }

    function escapeChat(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    async function sendChat() {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
      appendChatMessage(escapeChat(text), true);
      input.value = '';
      const useApi = !!(data.api && (data.api.enabled || data.api.backendEnabled));
      const btn = document.getElementById('chat-send-btn');
      if (btn) { btn.disabled = true; btn.textContent = useApi ? '…' : 'Send'; }

      try {
        if (useApi) {
          const structured = await requestStructuredCoach(text);
          const reply = structured ? structured.summary : await callCoachAPI(text);
          chatHistory.push({ role: 'user', content: text });
          chatHistory.push({ role: 'assistant', content: reply });
          if (chatHistory.length > 24) chatHistory = chatHistory.slice(-24);
          if (structured) {
            appendChatMessage(escapeChat(structured.summary || 'Coach recommendation ready.'), false);
            renderCoachSnapshot(structured);
          } else {
            appendChatMessage(escapeChat(reply), false);
          }
        } else {
          await new Promise(r => setTimeout(r, 250));
          const reply = getChatResponse(text);
          appendChatMessage(reply, false);
        }
      } catch (e) {
        appendChatMessage('API error: ' + escapeChat(e.message) + '<br><span class="text-xs">Falling back to built-in coach…</span>', false);
        const reply = getChatResponse(text);
        appendChatMessage(reply, false);
        showToast('API failed — used built-in coach', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
      }
    }

    function renderProactiveCoachPreview() {
      const el = document.getElementById('coach-proactive');
      if (!el || !window.LoadnoteCoach) return;
      const context = buildCoachContext();
      const insights = window.LoadnoteCoach.deterministicInsights(context);
      const top = insights[0] || { title: 'Keep logging', body: 'Complete workouts with RPE so Loadnote can personalize your next-session recommendations.' };
      el.innerHTML = `<div class="coach-snapshot-head"><div><span class="eyebrow">Proactive coach</span><h3>${escapeHtml(top.title)}</h3><p class="text-sm text-slate-600 mt-1">${escapeHtml(top.body)}</p></div><button class="btn-secondary text-sm" onclick="refreshCoachAnalysis(this)">Analyze</button></div><div class="text-xs text-slate-500 mt-2">Uses your local training analytics. AI is optional.</div>`;
    }

    async function refreshCoachAnalysis(btn) {
      if (btn) { btn.disabled = true; btn.textContent = 'Analyzing…'; }
      try {
        const useApi = !!(data.api && (data.api.enabled || data.api.backendEnabled));
        if (!useApi) { renderProactiveCoachPreview(); return; }
        const snapshot = await requestStructuredCoach('Analyze my current training and give me the single most useful next-workout recommendation.');
        if (snapshot) renderCoachSnapshot(snapshot);
      } catch (e) {
        showToast('AI analysis unavailable: ' + e.message, 'error');
        renderProactiveCoachPreview();
      } finally { if (btn) { btn.disabled = false; btn.textContent = 'Analyze'; } }
    }

    function renderCoachSnapshot(snapshot) {
      const el = document.getElementById('coach-proactive');
      if (!el || !snapshot) return;
      const rec = snapshot.recommendation || {};
      const actionLabels = { increase:'Increase', hold:'Hold', reduce:'Reduce', repeat:'Repeat', none:'No change' };
      const insights = Array.isArray(snapshot.insights) ? snapshot.insights : [];
      el.innerHTML = `
        <div class="coach-snapshot-head"><div><span class="eyebrow">Coach analysis</span><h3>${escapeHtml(snapshot.summary || 'Your latest training snapshot is ready.')}</h3></div><span class="coach-confidence">${escapeHtml(snapshot.confidence || 'medium')} confidence</span></div>
        ${insights.map(i => `<div class="coach-insight-row"><span class="coach-dot ${i.type === 'watch' ? 'watch' : i.type === 'positive' ? 'positive' : ''}"></span><div><b>${escapeHtml(i.title || 'Insight')}</b><p>${escapeHtml(i.body || '')}</p></div></div>`).join('')}
        ${rec.action && rec.action !== 'none' ? `<div class="coach-recommendation"><div><span class="eyebrow">Next recommendation</span><b>${escapeHtml(actionLabels[rec.action] || rec.action)}${rec.exercise ? ' · ' + escapeHtml(rec.exercise) : ''}</b></div><div class="coach-rec-load">${rec.weight != null ? escapeHtml(toDisplay(rec.weight) + ' ' + unitLabel()) : '—'}${rec.sets && rec.reps ? ` · ${rec.sets} × ${rec.reps}` : ''}${rec.targetRPE ? ` · RPE ${rec.targetRPE}` : ''}</div><p>${escapeHtml(rec.reason || '')}</p></div>` : ''}
      `;
    }

    function renderCoach() {
      try { renderAthleteProfile(); } catch (e) { console.warn('Athlete profile render failed', e); }
      // Advice
      const adviceEl = document.getElementById('coach-advice');
      const tips = getCoachAdvice();
      if (adviceEl) adviceEl.innerHTML = (tips || []).map(t => `<p>• ${t}</p>`).join('');
      try { if (lastCoachSnapshot) renderCoachSnapshot(lastCoachSnapshot); else renderProactiveCoachPreview(); } catch (e) { console.warn(e); }
      try { refreshDeloadHelper(); } catch (e) { console.warn(e); }
      try { updateApiStatusUI(); } catch (e) { console.warn(e); }

      // Goals list
      const goalsEl = document.getElementById('goals-list');
      if (!goalsEl) return;
      const goals = data.goals || [];
      if (!goals.length) {
        goalsEl.innerHTML = '<p class="text-slate-500 text-sm">No goals set yet. Add one above.</p>';
      } else {
        goalsEl.innerHTML = goals.slice().reverse().map(g => {
          let detail = '';
          if (g.type === 'strength') detail = `${g.exercise} → ${toDisplay(g.targetWeight)} ${unitLabel()}`;
          else if (g.type === 'protein') detail = `${g.targetProtein}g protein / day`;
          else if (g.type === 'consistency') detail = `${g.targetPerWeek} workouts / week`;
          const status = g.completed
            ? '<span class="text-green-600 text-xs font-medium">Completed</span>'
            : `<button onclick="completeGoal(${g.id})" class="text-xs text-indigo-600 hover:underline">Mark done</button>`;
          return `
            <div class="border border-slate-200 rounded-lg p-3 flex justify-between items-start">
              <div>
                <div class="font-medium">${detail}</div>
                <div class="text-xs text-slate-500 mt-0.5">
                  ${g.deadline ? 'Target: ' + formatDate(g.deadline) + ' · ' : ''}Created ${formatDate(g.created)}
                  ${g.notes ? ' · ' + g.notes : ''}
                </div>
              </div>
              <div class="flex gap-2 items-center">
                ${status}
                <button onclick="deleteGoal(${g.id})" class="btn-danger text-xs">Delete</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Active program display
      const progEl = document.getElementById('program-display');
      const clearBtn = document.getElementById('clear-prog-btn');
      const active = getActiveProgram();
      if (!active) {
        progEl.innerHTML = '<p class="text-slate-500 text-sm">No active program. Generate one or activate from your library.</p>';
        clearBtn.style.display = 'none';
      } else {
        clearBtn.style.display = '';
        const p = active;
        progEl.innerHTML = `
          <div class="mb-3">
            <div class="font-medium text-lg">${p.name}</div>
            <div class="text-sm text-slate-500">${p.level} · ${p.daysPerWeek} days/week · ${p.focus} focus · Generated ${formatDate(p.generated)}</div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            ${p.days.map((d, di) => `
              <div class="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div class="flex justify-between items-start gap-2 mb-1">
                  <div class="font-medium text-indigo-700">${d.day}</div>
                  <button onclick="startProgramDay(${di})" class="text-xs text-indigo-600 hover:underline shrink-0">Start this day</button>
                </div>
                <ul class="text-sm text-slate-700 space-y-0.5">
                  ${d.exercises.map(e => `<li>• ${e}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          <p class="text-xs text-slate-500 mt-3"><b>Loading scheme (${p.schemeLabel || 'Linear'}):</b> ${p.progressionTip || 'Add weight when you complete all sets/reps with good form.'}</p>
        `;
      }

      // v0.6 Adaptive Programs — preview the next session from the active program.
      const adaptiveEl = document.getElementById('adaptive-program-next');
      if (adaptiveEl) {
        if (!active || !window.LoadnoteAdaptivePrograms) {
          adaptiveEl.innerHTML = '';
        } else {
          const session = window.LoadnoteAdaptivePrograms.buildNextSession(active, data.workouts || [], currentUnit(), window.LoadnoteAdaptive);
          if (!session || !session.exercises.length) {
            adaptiveEl.innerHTML = '';
          } else {
            adaptiveEl.innerHTML = `
              <div class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div><span class="eyebrow">Adaptive next session</span><h3 class="font-semibold text-lg mt-1">${escapeHtml(session.dayName)}</h3><p class="text-xs text-slate-600 mt-1">Targets are based on your most recent logged performance for each matching exercise. Review before starting.</p></div>
                  <button onclick="startNextProgramWorkout()" class="btn-primary text-sm shrink-0">Start next workout</button>
                </div>
                <div class="mt-3 space-y-1">
                  ${session.exercises.map(ex => `<div class="flex items-center justify-between gap-3 py-2 border-t border-indigo-100"><span class="font-medium">${escapeHtml(ex.name)}</span><span class="text-sm font-semibold">${ex.weight == null ? 'New movement' : escapeHtml(toDisplay(ex.weight) + ' ' + unitLabel())}${ex.sets && ex.reps ? ` · ${ex.sets} × ${ex.reps}` : ''}${ex.targetRPE ? ` · RPE ${ex.targetRPE}` : ''}</span></div>`).join('')}
                </div>
              </div>`;
          }
        }
      }

      try { renderProgramProgressionStatus(active); } catch (e) { console.warn('Program progression status failed', e); }

      // Program library list
      const libEl = document.getElementById('programs-list');
      const progs = data.programs || [];
      if (!libEl) return;
      if (!progs.length) {
        libEl.innerHTML = '<p class="text-slate-500">No saved programs yet. Generate one above.</p>';
      } else {
        libEl.innerHTML = progs.slice().reverse().map(p => {
          const isActive = data.activeProgramId === p.id;
          return `
            <div class="border border-slate-200 rounded-lg p-3 flex justify-between items-center ${isActive ? 'bg-indigo-50 border-indigo-200' : ''}">
              <div>
                <div class="font-medium">${p.name} ${isActive ? '<span class="text-xs text-indigo-600">• Active</span>' : ''}</div>
                <div class="text-xs text-slate-500">${p.level} · ${p.daysPerWeek} days · ${p.focus} · ${formatDate(p.generated)}</div>
              </div>
              <div class="flex gap-2">
                ${!isActive ? `<button onclick="activateProgram(${p.id})" class="text-xs text-indigo-600 hover:underline">Activate</button>` : ''}
                <button onclick="deleteProgram(${p.id})" class="btn-danger text-xs">Delete</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // ========== Seed sample data if empty ==========
    function buildDemoPayload() {
      const sampleWorkouts = [
        {
          id: 1, date: '2026-08-20', notes: 'Good session',
          exercises: [
            { name: 'Back Squat', type: 'strength', sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }, { reps: 5, weight: 100 }] },
            { name: 'Bench Press', type: 'strength', sets: [{ reps: 5, weight: 80 }, { reps: 5, weight: 80 }, { reps: 5, weight: 75 }] }
          ]
        },
        {
          id: 2, date: '2026-08-25', notes: '',
          exercises: [
            { name: 'Back Squat', type: 'strength', sets: [{ reps: 5, weight: 105 }, { reps: 5, weight: 105 }, { reps: 3, weight: 110 }] },
            { name: 'Deadlift', type: 'strength', sets: [{ reps: 5, weight: 140 }, { reps: 3, weight: 150 }] }
          ]
        },
        {
          id: 3, date: '2026-09-01', notes: 'Felt strong',
          exercises: [
            { name: 'Back Squat', type: 'strength', sets: [{ reps: 3, weight: 115 }, { reps: 3, weight: 115 }, { reps: 3, weight: 120 }] },
            { name: 'Bench Press', type: 'strength', sets: [{ reps: 5, weight: 85 }, { reps: 5, weight: 85 }, { reps: 5, weight: 85 }] },
            { name: 'Deadlift', type: 'strength', sets: [{ reps: 5, weight: 150 }, { reps: 3, weight: 160 }] },
            { name: 'Running', type: 'cardio', duration: 25, distance: 4, distanceUnit: 'km', avgHr: 145 }
          ]
        }
      ];
      const sampleNutrition = [
        { date: '2026-08-28', protein: 160, carbs: 280, fat: 65, calories: 2345, fiber: 28, sodium: 2200 },
        { date: '2026-08-29', protein: 145, carbs: 250, fat: 70, calories: 2210, fiber: 22, sodium: 2400 },
        { date: '2026-08-30', protein: 170, carbs: 300, fat: 60, calories: 2420, fiber: 30, sodium: 2100 },
        { date: '2026-08-31', protein: 155, carbs: 220, fat: 75, calories: 2175, fiber: 20, sodium: 2600 },
        { date: '2026-09-01', protein: 165, carbs: 270, fat: 68, calories: 2356, fiber: 26, sodium: 2300 },
        { date: '2026-09-02', protein: 150, carbs: 240, fat: 72, calories: 2216, fiber: 24, sodium: 2500 }
      ];
      return { sampleWorkouts, sampleNutrition };
    }

    function applyDemoData(merge) {
      const { sampleWorkouts, sampleNutrition } = buildDemoPayload();
      if (!merge) {
        data.workouts = sampleWorkouts;
        data.nutrition = sampleNutrition;
        data.prs = [];
      } else {
        const dates = new Set((data.workouts || []).map(w => w.date + '|' + (w.notes || '')));
        sampleWorkouts.forEach(w => {
          if (!dates.has(w.date + '|' + (w.notes || ''))) data.workouts.push({ ...w, id: Date.now() + Math.random() });
        });
        sampleNutrition.forEach(n => {
          if (!(data.nutrition || []).some(x => x.date === n.date)) data.nutrition.push(n);
        });
      }
      data.workouts.sort((a, b) => b.date.localeCompare(a.date));
      data.nutrition.sort((a, b) => b.date.localeCompare(a.date));
      // Rebuild PRs from all strength work (reps-based only)
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio' || !ex.sets) return;
          ex.sets.forEach(set => {
            if (!(set.reps > 0)) return;
            const est = estimated1RM(set.weight, set.reps);
            const existing = data.prs.find(p => p.exercise === ex.name);
            if (!existing || est > (existing.estimated1RM || 0)) {
              if (existing) {
                existing.weight = set.weight;
                existing.reps = set.reps;
                existing.date = w.date;
                existing.estimated1RM = est;
              } else {
                data.prs.push({ id: Date.now() + Math.random(), exercise: ex.name, weight: set.weight, reps: set.reps, date: w.date, estimated1RM: est });
              }
            }
          });
        });
      });
      saveData(data);
    }

    function seedIfEmpty() {
      // No automatic sample data — new users start blank.
      // Optional demo is available via Tools → Load demo data.
      return;
    }

    function loadDemoData() {
      const has = (data.workouts || []).length || (data.nutrition || []).length;
      if (has) {
        const ok = confirm('Replace current workouts/nutrition/PRs with demo sample data?\n\nOK = replace\nCancel = keep your data and only fill missing demo days');
        if (ok) applyDemoData(false);
        else applyDemoData(true);
      } else {
        applyDemoData(false);
      }
      showTab('dashboard');
      showToast('Demo data loaded — explore Dashboard, Workouts, Nutrition, Coach', 'success');
    }

    // ========== Init ==========
    
async function initApp() {
      try {
        data = normalizeDataShape(await loadDataAsync());
      } catch (e) {
        console.warn(e);
        data = normalizeDataShape(loadFromLocalStorage() || { ...DEFAULT_DATA });
        storageBackend = 'localStorage';
      }

      const woDate = document.getElementById('wo-date');
      if (woDate) woDate.value = today();
      const nuDate = document.getElementById('nu-date');
      if (nuDate) nuDate.value = today();
      const prDate = document.getElementById('pr-date');
      if (prDate) prDate.value = today();
      ensureFoodLibrary();
      const bwDateEl = document.getElementById('bw-date');
      if (bwDateEl) bwDateEl.value = today();
      const measDateEl = document.getElementById('meas-date');
      if (measDateEl) measDateEl.value = today();
      seedIfEmpty();
      // Persist after seed / library ensure
      persistNow(data).catch(reportStorageFailure);
      addExerciseRow();
      updateUnitToggle();
      updateMeasureUnitUI();
      applyDark();
      maybeAutoGymMode();
      applyGymMode();
      updateOnboardingUI();
      const checkToggle = document.getElementById('gym-checklist-toggle');
      if (checkToggle) checkToggle.checked = !!data.checklistMode;
      document.querySelectorAll('.unit-label').forEach(el => el.textContent = unitLabel());
      const plateBar = document.getElementById('plate-bar');
      if (plateBar) plateBar.value = currentUnit() === 'lb' ? 45 : 20;
      showTab('dashboard');
      updateBackupBanner();
      initWorkoutEvents();
      initWorkoutLogger();
      hideAppLoader();

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }

      // Keep gym-mode preference in sync if user resizes across breakpoint before choosing
      if (window.matchMedia) {
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = () => {
          if (!data.gymModeUserSet) {
            maybeAutoGymMode();
            if (!mq.matches && !data.gymModeUserSet) {
              // leaving mobile: don't force off; leave as-is
            }
            applyGymMode();
          }
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { initApp(); });
    } else {
      initApp();
    }
