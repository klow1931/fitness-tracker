// ========== Data Layer (IndexedDB + localStorage migration) ==========
    const STORAGE_KEY = 'fitness-tracker-v1';
    const IDB_NAME = 'fitness-tracker-db';
    const IDB_VERSION = 1;
    const IDB_STORE = 'app';
    const IDB_KEY = 'state';

    const DEFAULT_DATA = {
      workouts: [], nutrition: [], prs: [], goals: [], programs: [],
      activeProgramId: null, templates: [], bodyweight: [], foodLibrary: [],
      restDays: [], exerciseNotes: {}, unit: 'kg', measureUnit: 'cm', dark: false, gymMode: false, checklistMode: false,
      gymModeUserSet: false, onboardingDismissed: false,
      lastExportDate: null, backupBannerDismissed: null,
      progressPhotos: [], measurements: [], formReviews: [],
      api: { enabled: false, provider: 'xai', baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest' }
    };

    const TECHNIQUE_LIBRARY = {
      squat: {
        label: 'Back Squat',
        film: [
          'Film from the side (or slight 45°) so depth and torso angle are visible.',
          'Full body in frame — bar, hips, knees, and feet.',
          'Capture 1–3 working reps, not only warm-ups.'
        ],
        cues: [
          'Brace before unrack; ribs down, big breath into the belt area',
          'Bar sits stable (high- or low-bar) without sliding',
          'Knees track roughly in line with toes (not collapsing hard inward)',
          'Hip crease reaches at or below top of knee if mobility allows',
          'Torso stays controlled — no excessive forward collapse or rounding',
          'Feet stay planted; drive through mid-foot on the way up',
          'Lockout is tall without hyperextending the lower back'
        ]
      },
      bench: {
        label: 'Bench Press',
        film: [
          'Film from the side or slight 45° to see bar path and arch.',
          'Include upper back, elbows, and bar touch point.',
          'Use a pause or controlled touch if that is your competition style.'
        ],
        cues: [
          'Shoulder blades retracted and set before the first rep',
          'Glutes stay on the bench; feet planted',
          'Bar lowers under control to lower chest / nipple line',
          'Elbows roughly 45–70° from torso (not flared straight out)',
          'Wrists stacked over elbows at the bottom',
          'Press up and slightly back toward the rack',
          'Bar path is fairly consistent rep to rep'
        ]
      },
      deadlift: {
        label: 'Deadlift',
        film: [
          'Side view is best for bar path and back position.',
          'Show the bar over mid-foot at the start.',
          'Film the full lockout — not only the pull off the floor.'
        ],
        cues: [
          'Bar starts over mid-foot',
          'Hips hinge; shins relatively vertical before the pull',
          'Spine stays neutral — no rounding under load',
          'Push the floor away; bar stays close to the legs',
          'Shoulders and hips rise together (no extreme butt-wink shoot-up)',
          'Lockout is tall without leaning way back',
          'Lower under control if you are practicing touch-and-go or controlled eccentrics'
        ]
      },
      ohp: {
        label: 'Overhead Press',
        film: [
          'Film from the side or front-45° to see lockout and rib position.',
          'Include feet, hips, and full arm lockout.'
        ],
        cues: [
          'Glutes and core braced; minimal excessive lean-back',
          'Bar starts near shoulders / upper chest',
          'Elbows not flared wildly; press in a smooth path',
          'Head moves slightly back then through as bar passes face',
          'Lockout is stacked — bar over mid-foot / shoulders',
          'No soft elbows at the top'
        ]
      },
      row: {
        label: 'Barbell Row',
        film: [
          'Side view shows torso angle and bar path to the torso.',
          'Film strict reps if that is the goal (less cheat-momentum).'
        ],
        cues: [
          'Hinge position stays relatively fixed (not standing up each rep)',
          'Bar pulled toward lower chest / upper abs depending on variation',
          'Elbows track close enough to load the back, not only the arms',
          'Controlled eccentric — no free-fall',
          'Neck stays neutral'
        ]
      },
      rdl: {
        label: 'Romanian Deadlift',
        film: [
          'Side view for hip hinge and bar closeness.',
          'Soft knees should stay consistent through the set.'
        ],
        cues: [
          'Soft knee bend stays steady (not a squat)',
          'Hips push back; feel stretch in hamstrings',
          'Bar stays close to the legs',
          'Spine neutral — no rounding to reach lower',
          'Drive hips forward to stand tall without overextending'
        ]
      },
      generic: {
        label: 'General lift',
        film: [
          'Film from the side when possible.',
          'Keep the full movement in frame.',
          'Use the same angle next time so comparisons are fair.'
        ],
        cues: [
          'Setup is stable before the first rep',
          'Range of motion is consistent rep to rep',
          'No sudden pain or joint pinching (stop if pain appears)',
          'Control the weight — limited bouncing or uncontrolled drop',
          'Breathing / bracing matches the effort of the set'
        ]
      }
    };
    let formVideoUrl = null;

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

    let data = { ...DEFAULT_DATA };
    let idb = null;
    let idbReady = null;
    let saveTimer = null;
    let storageBackend = 'memory';

    function debounce(fn, ms) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    }

    function openIDB() {
      if (idbReady) return idbReady;
      idbReady = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          reject(new Error('IndexedDB not supported'));
          return;
        }
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => {
          idb = req.result;
          resolve(idb);
        };
        req.onerror = () => reject(req.error || new Error('IDB open failed'));
      });
      return idbReady;
    }

    function idbGet() {
      return openIDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      }));
    }

    function idbSet(value) {
      return openIDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(value, IDB_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }));
    }

    function loadFromLocalStorage() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        return { ...DEFAULT_DATA, ...JSON.parse(raw) };
      } catch {
        return null;
      }
    }

    async function loadDataAsync() {
      // Prefer IndexedDB; migrate from localStorage once if needed
      try {
        const fromIdb = await idbGet();
        if (fromIdb && typeof fromIdb === 'object') {
          storageBackend = 'indexedDB';
          return { ...DEFAULT_DATA, ...fromIdb };
        }
        const fromLs = loadFromLocalStorage();
        if (fromLs) {
          await idbSet(fromLs);
          storageBackend = 'indexedDB';
          // Keep LS as backup until next successful IDB saves accumulate; optional cleanup:
          // localStorage.removeItem(STORAGE_KEY);
          return fromLs;
        }
        storageBackend = 'indexedDB';
        return { ...DEFAULT_DATA };
      } catch (e) {
        console.warn('IndexedDB unavailable, falling back to localStorage', e);
        storageBackend = 'localStorage';
        return loadFromLocalStorage() || { ...DEFAULT_DATA };
      }
    }

    function persistNow(state) {
      const payload = state || data;
      if (storageBackend === 'indexedDB') {
        return idbSet(payload).catch((err) => {
          console.warn('IDB save failed, trying localStorage', err);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            storageBackend = 'localStorage';
          } catch (e2) {
            alert('Could not save (storage full?). Export a JSON backup.');
          }
        });
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        alert('Could not save (storage full?). Export a JSON backup and clear old history.');
      }
      return Promise.resolve();
    }

    function saveData(state) {
      if (state) data = state;
      // Debounce rapid saves (typing / bulk updates)
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        persistNow(data);
      }, 120);
    }

    function updateStorageInfo() {
      const el = document.getElementById('storage-info');
      if (!el) return;
      try {
        const json = JSON.stringify(data);
        const kb = (json.length / 1024).toFixed(1);
        const mb = (json.length / 1024 / 1024).toFixed(2);
        const workouts = (data.workouts || []).length;
        const foods = (data.foodLibrary || []).length;
        el.textContent = `Storage: ${kb} KB (${mb} MB) via ${storageBackend} · ${workouts} workouts · ${foods} foods in library`;
      } catch {
        el.textContent = 'Storage: unavailable';
      }
    }

    // ========== Unit helpers (internal storage is always kg) ==========
    const KG_TO_LB = 2.2046226218;

    function currentUnit() {
      return data.unit || 'kg';
    }

    function unitLabel() {
      return currentUnit() === 'lb' ? 'lb' : 'kg';
    }

    /** Convert kg → display unit */
    function toDisplay(kg) {
      if (kg == null || isNaN(kg)) return kg;
      if (currentUnit() === 'lb') return Math.round(kg * KG_TO_LB * 10) / 10;
      return Math.round(kg * 10) / 10;
    }

    /** Convert display unit → kg for storage */
    function toStorage(val) {
      if (val == null || isNaN(val)) return val;
      if (currentUnit() === 'lb') return Math.round((val / KG_TO_LB) * 100) / 100;
      return val;
    }

    function setUnit(u) {
      if (u !== 'kg' && u !== 'lb') return;
      data.unit = u;
      saveData(data);
      updateUnitToggle();
      document.querySelectorAll('.unit-label').forEach(el => el.textContent = unitLabel());
      const plateBar = document.getElementById('plate-bar');
      if (plateBar) plateBar.value = u === 'lb' ? 45 : 20;
      const active = document.querySelector('.tab-btn.nav-active');
      if (active) showTab(active.id.replace('tab-', ''));
    }

    function updateUnitToggle() {
      const isKg = currentUnit() === 'kg';
      const kgBtn = document.getElementById('unit-kg');
      const lbBtn = document.getElementById('unit-lb');
      if (kgBtn && lbBtn) {
        kgBtn.className = isKg ? 'px-3 py-1.5 bg-indigo-600 text-white' : 'px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50';
        lbBtn.className = !isKg ? 'px-3 py-1.5 bg-indigo-600 text-white' : 'px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50';
      }
    }

    // ========== Helpers ==========
    function today() {
      return new Date().toISOString().slice(0, 10);
    }

    function formatDate(d) {
      return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function calcVolume(workout) {
      return (workout.exercises || []).reduce((sum, ex) => {
        if (ex.type === 'cardio' || !ex.sets) return sum;
        return sum + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0);
      }, 0);
    }

    function estimated1RM(weight, reps) {
      if (reps <= 1) return weight;
      // Epley formula
      return Math.round(weight * (1 + reps / 30) * 10) / 10;
    }

    // ========== Tab Navigation ==========
    function showTab(name) {
      ['dashboard', 'calendar', 'workouts', 'nutrition', 'prs', 'measures', 'form', 'photos', 'coach', 'tools'].forEach(t => {
        const panel = document.getElementById('panel-' + t);
        const tab = document.getElementById('tab-' + t);
        if (panel) panel.classList.toggle('hidden', t !== name);
        if (tab) tab.classList.toggle('nav-active', t === name);
      });
      // Mobile bottom nav active state
      const primary = ['dashboard', 'workouts', 'nutrition', 'coach'];
      document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const t = btn.getAttribute('data-tab');
        if (t === 'more') {
          btn.classList.toggle('nav-active', !primary.includes(name));
        } else {
          btn.classList.toggle('nav-active', t === name);
        }
      });
      if (name === 'dashboard') renderDashboard();
      if (name === 'calendar') renderCalendar();
      if (name === 'workouts') {
        showSubTab('workouts', 'wo-log');
        renderWorkoutHistory();
        renderTemplates();
      }
      if (name === 'nutrition') {
        showSubTab('nutrition', 'nu-today');
        ensureFoodLibrary();
        loadDayFoods();
        renderNutritionHistory();
        renderFoodLibrary();
        showFoodMode('search');
      }
      if (name === 'prs') renderPRs();
      if (name === 'measures') renderMeasures();
      if (name === 'form') renderFormReview();
      if (name === 'photos') renderPhotos();
      if (name === 'coach') {
        showSubTab('coach', 'co-insights');
        renderCoach();
      }
      if (name === 'tools') updateStorageInfo();
      applyGymMode();
      updateBackupBanner();
    }

    /** Show one sub-section inside a dense panel (workouts / nutrition / coach) */
    function showSubTab(panel, sub) {
      document.querySelectorAll('.sub-panel[data-panel="' + panel + '"]').forEach(el => {
        el.classList.toggle('hidden', el.getAttribute('data-sub') !== sub);
      });
      const section = document.getElementById('panel-' + panel);
      if (section) {
        section.querySelectorAll('.section-tab').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-sub') === sub);
        });
      }
      if (panel === 'workouts' && sub === 'wo-history') renderWorkoutHistory();
      if (panel === 'workouts' && sub === 'wo-templates') renderTemplates();
      if (panel === 'nutrition' && sub === 'nu-today') loadDayFoods();
      if (panel === 'nutrition' && (sub === 'nu-library' || sub === 'nu-add')) {
        ensureFoodLibrary();
        renderFoodLibrary();
      }
      if (panel === 'nutrition' && sub === 'nu-history') renderNutritionHistory();
      if (panel === 'coach') renderCoach();
    }

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
    function addExerciseRow(ex = { name: '', sets: [{ reps: '', weight: '' }], type: 'strength' }) {
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
              <input type="text" class="input ex-name" list="exercise-list" value="${ex.name || ''}" placeholder="e.g. Running, Cycling" />
            </div>
            <span class="text-xs text-indigo-600 font-medium mb-2">Cardio</span>
            <button onclick="this.closest('[data-idx]').remove()" class="btn-danger">Remove</button>
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
      div.innerHTML = `
        <div class="flex gap-2 mb-2 items-end flex-wrap">
          <div class="flex-1 min-w-[160px]">
            <label class="label">Exercise</label>
            <input type="text" class="input ex-name" list="exercise-list" value="${ex.name || ''}" placeholder="e.g. Bench Press" />
          </div>
          <button type="button" class="btn-secondary text-sm whitespace-nowrap" onclick="fillLastWeights(this)" title="Load last session sets">Last weights</button>
          <button type="button" class="btn-secondary text-sm whitespace-nowrap" onclick="fillLastWeights(this, true)" title="Last weights + small jump">+ Jump</button>
          <button onclick="this.closest('[data-idx]').remove()" class="btn-danger">Remove</button>
        </div>
        <div class="mb-2">
          <label class="label">Personal notes / form cues</label>
          <input type="text" class="input ex-note text-sm" value="${String(note).replace(/"/g, '&quot;')}" placeholder="e.g. brace hard, eyes forward…" onchange="saveExerciseNoteFromRow(this)" />
        </div>
        <div class="sets-container space-y-2"></div>
        <button onclick="addSetRow(this)" class="text-sm text-indigo-600 hover:underline mt-2">+ Add Set</button>
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
      (ex.sets || [{ reps: '', weight: '' }]).forEach(s => addSetToContainer(setsContainer, s));
    }

    function getLastExercisePerformance(name) {
      if (!name) return null;
      const key = name.toLowerCase();
      for (const w of (data.workouts || [])) {
        for (const ex of (w.exercises || [])) {
          if (ex.type === 'cardio') continue;
          if ((ex.name || '').toLowerCase() === key && ex.sets && ex.sets.length) {
            return { date: w.date, sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight, rpe: s.rpe })) };
          }
        }
      }
      return null;
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
      setsContainer.innerHTML = '';
      last.sets.forEach(s => {
        addSetToContainer(setsContainer, {
          reps: s.reps,
          weight: (s.weight || 0) + jump,
          rpe: s.rpe
        });
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

    function addSetToContainer(container, set = { reps: '', weight: '', rpe: '' }) {
      const row = document.createElement('div');
      row.className = 'flex gap-2 items-center flex-wrap';
      const displayWeight = set.weight !== '' && set.weight != null ? toDisplay(set.weight) : '';
      const checkHtml = data.checklistMode
        ? `<input type="checkbox" class="set-done-check" title="Mark set done" />`
        : '';
      row.innerHTML = `
        ${checkHtml}
        <input type="number" class="input set-reps w-20" placeholder="Reps" min="1" value="${set.reps || ''}" />
        <span class="text-slate-400">×</span>
        <input type="number" class="input set-weight w-24" placeholder="${unitLabel()}" min="0" step="0.5" value="${displayWeight}" />
        <input type="number" class="input set-rpe w-16" placeholder="RPE" min="1" max="10" step="0.5" value="${set.rpe || ''}" title="RPE 1-10" />
        <button onclick="this.parentElement.remove()" class="text-red-500 text-sm">✕</button>
      `;
      const check = row.querySelector('.set-done-check');
      if (check) {
        check.addEventListener('change', () => {
          row.classList.toggle('set-row-done', check.checked);
          if (check.checked && data.gymMode) startRest(90);
        });
      }
      container.appendChild(row);
    }

    function addSetRow(btn) {
      const container = btn.previousElementSibling;
      addSetToContainer(container);
    }

    function clearWorkoutForm(force) {
      const rows = document.querySelectorAll('#exercise-rows > div');
      let hasData = false;
      rows.forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        if (name) hasData = true;
        row.querySelectorAll('.set-reps, .set-weight').forEach(inp => {
          if (inp.value) hasData = true;
        });
      });
      if (hasData && !force) {
        if (!confirm('Clear the workout form? Unsaved sets will be lost.')) return;
      }
      document.getElementById('wo-date').value = today();
      document.getElementById('wo-notes').value = '';
      document.getElementById('exercise-rows').innerHTML = '';
      addExerciseRow();
    }

    function saveWorkout() {
      const date = document.getElementById('wo-date').value;
      const notes = document.getElementById('wo-notes').value.trim();
      if (!date) return showToast('Please select a date', 'error');

      const exercises = [];
      document.querySelectorAll('#exercise-rows > div').forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        if (!name) return;
        if (row.dataset.type === 'cardio') {
          const duration = parseFloat(row.querySelector('.cardio-duration')?.value) || 0;
          const distance = parseFloat(row.querySelector('.cardio-distance')?.value) || 0;
          const distanceUnit = row.querySelector('.cardio-distance-unit')?.value || 'km';
          const avgHr = parseFloat(row.querySelector('.cardio-hr')?.value);
          if (duration <= 0 && distance <= 0) return;
          const entry = { name, type: 'cardio', duration, distance, distanceUnit, sets: [] };
          if (!isNaN(avgHr) && avgHr > 0) entry.avgHr = avgHr;
          exercises.push(entry);
          return;
        }
        const sets = [];
        row.querySelectorAll('.sets-container > div').forEach(s => {
          const reps = parseFloat(s.querySelector('.set-reps').value);
          const weightRaw = parseFloat(s.querySelector('.set-weight').value);
          const rpeRaw = parseFloat(s.querySelector('.set-rpe')?.value);
          if (reps > 0 && weightRaw >= 0) {
            const setObj = { reps, weight: toStorage(weightRaw) };
            if (!isNaN(rpeRaw) && rpeRaw >= 1) setObj.rpe = rpeRaw;
            sets.push(setObj);
          }
        });
        if (sets.length) exercises.push({ name, type: 'strength', sets });
      });

      if (!exercises.length) return showToast('Add at least one strength set or cardio entry', 'error');

      const workout = { id: Date.now(), date, notes, exercises };
      data.workouts.push(workout);
      data.workouts.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);

      // Auto-update PRs if better (strength only)
      exercises.forEach(ex => {
        if (ex.type === 'cardio' || !ex.sets) return;
        ex.sets.forEach(set => {
          const est = estimated1RM(set.weight, set.reps);
          const existing = data.prs.find(p => p.exercise.toLowerCase() === ex.name.toLowerCase());
          if (!existing || est > estimated1RM(existing.weight, existing.reps)) {
            if (existing) {
              existing.weight = set.weight;
              existing.reps = set.reps;
              existing.date = date;
              existing.estimated1RM = est;
            } else {
              data.prs.push({
                id: Date.now() + Math.random(),
                exercise: ex.name,
                weight: set.weight,
                reps: set.reps,
                date,
                estimated1RM: est
              });
            }
          }
        });
      });
      // Persist any exercise notes from the form
      data.exerciseNotes = data.exerciseNotes || {};
      document.querySelectorAll('#exercise-rows > div').forEach(row => {
        if (row.dataset.type === 'cardio') return;
        const n = row.querySelector('.ex-name')?.value.trim();
        const note = row.querySelector('.ex-note')?.value.trim();
        if (!n) return;
        if (note) data.exerciseNotes[n] = note;
      });
      saveData(data);

      clearWorkoutForm(true);
      renderWorkoutHistory();
      showToast('Workout saved', 'success');
      updateBackupBanner();
    }

    function deleteWorkout(id) {
      if (!confirm('Delete this workout?')) return;
      data.workouts = data.workouts.filter(w => w.id !== id);
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

    function workoutHistoryCardHtml(w) {
      const vol = calcVolume(w);
      const exercisesHtml = w.exercises.map(ex => {
        if (ex.type === 'cardio') {
          const parts = [];
          if (ex.duration) parts.push(`${ex.duration} min`);
          if (ex.distance) parts.push(`${ex.distance} ${ex.distanceUnit || 'km'}`);
          if (ex.avgHr) parts.push(`HR ${ex.avgHr}`);
          return `<div class="text-slate-600"><span class="font-medium text-slate-800">${ex.name}</span> <span class="text-xs text-indigo-600">cardio</span>: ${parts.join(' · ') || '—'}</div>`;
        }
        const setsStr = (ex.sets || []).map(s => {
          let t = `${s.reps}×${toDisplay(s.weight)}${unitLabel()}`;
          if (s.rpe) t += ` @${s.rpe}`;
          return t;
        }).join(', ');
        return `<div class="text-slate-600"><span class="font-medium text-slate-800">${ex.name}</span>: ${setsStr}</div>`;
      }).join('');
      return `
        <div class="border border-slate-200 rounded-lg p-3 mb-3" data-hist-id="${w.id}">
          <div class="flex justify-between items-start mb-1 gap-2">
            <div>
              <span class="font-medium">${formatDate(w.date)}</span>
              <span class="text-slate-500 text-sm ml-2">Vol: ${Math.round(toDisplay(vol))} ${unitLabel()}</span>
            </div>
            <div class="flex gap-2 shrink-0">
              <button onclick="saveWorkoutAsTemplate(${w.id})" class="text-xs text-indigo-600 hover:underline">Template</button>
              <button onclick="deleteWorkout(${w.id})" class="btn-danger">Delete</button>
            </div>
          </div>
          ${exercisesHtml}
          ${w.notes ? `<p class="text-slate-500 text-sm mt-1 italic">${w.notes}</p>` : ''}
        </div>
      `;
    }

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
              <button onclick="document.getElementById('wo-date')?.focus()" class="btn-primary text-sm mt-3">Start logging</button>
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

    // ========== Nutrition ==========
    // ========== Nutrition (expanded) ==========
    let dayFoods = []; // in-memory foods for selected date
    let pickedFood = null;
    let html5QrCode = null;
    let scannerRunning = false;

    const DEFAULT_FOODS = [
      // Proteins — meat & fish
      { name: 'Chicken breast (cooked)', serving: '100g', protein: 31, carbs: 0, fat: 3.6, calories: 165, fiber: 0, sugar: 0, sodium: 74 },
      { name: 'Chicken thigh (cooked, skinless)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 179, fiber: 0, sugar: 0, sodium: 84 },
      { name: 'Chicken drumstick (cooked)', serving: '1 medium', protein: 12, carbs: 0, fat: 5, calories: 95, fiber: 0, sugar: 0, sodium: 45 },
      { name: 'Turkey breast', serving: '100g', protein: 29, carbs: 0, fat: 1, calories: 135, fiber: 0, sugar: 0, sodium: 50 },
      { name: 'Ground turkey (93% lean)', serving: '100g', protein: 27, carbs: 0, fat: 8, calories: 176, fiber: 0, sugar: 0, sodium: 90 },
      { name: 'Beef (lean ground 90%)', serving: '100g', protein: 26, carbs: 0, fat: 10, calories: 200, fiber: 0, sugar: 0, sodium: 66 },
      { name: 'Beef (sirloin steak)', serving: '100g', protein: 27, carbs: 0, fat: 8, calories: 183, fiber: 0, sugar: 0, sodium: 55 },
      { name: 'Beef (ribeye)', serving: '100g', protein: 24, carbs: 0, fat: 22, calories: 291, fiber: 0, sugar: 0, sodium: 54 },
      { name: 'Pork tenderloin', serving: '100g', protein: 26, carbs: 0, fat: 4, calories: 143, fiber: 0, sugar: 0, sodium: 48 },
      { name: 'Pork chop (lean)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 172, fiber: 0, sugar: 0, sodium: 55 },
      { name: 'Bacon (cooked)', serving: '2 slices', protein: 6, carbs: 0.4, fat: 7, calories: 87, fiber: 0, sugar: 0, sodium: 370 },
      { name: 'Ham (sliced)', serving: '50g', protein: 10, carbs: 1, fat: 2.5, calories: 70, fiber: 0, sugar: 1, sodium: 550 },
      { name: 'Salmon (Atlantic)', serving: '100g', protein: 20, carbs: 0, fat: 13, calories: 208, fiber: 0, sugar: 0, sodium: 59 },
      { name: 'Salmon (canned)', serving: '100g', protein: 20, carbs: 0, fat: 7, calories: 142, fiber: 0, sugar: 0, sodium: 400 },
      { name: 'Tuna (canned in water)', serving: '100g', protein: 26, carbs: 0, fat: 1, calories: 116, fiber: 0, sugar: 0, sodium: 320 },
      { name: 'Tuna (canned in oil)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 186, fiber: 0, sugar: 0, sodium: 350 },
      { name: 'Cod (baked)', serving: '100g', protein: 20, carbs: 0, fat: 0.7, calories: 82, fiber: 0, sugar: 0, sodium: 78 },
      { name: 'Tilapia (cooked)', serving: '100g', protein: 26, carbs: 0, fat: 2.7, calories: 128, fiber: 0, sugar: 0, sodium: 56 },
      { name: 'Shrimp (cooked)', serving: '100g', protein: 24, carbs: 0.2, fat: 0.3, calories: 99, fiber: 0, sugar: 0, sodium: 111 },
      { name: 'Sardines (canned in oil)', serving: '100g', protein: 25, carbs: 0, fat: 11, calories: 208, fiber: 0, sugar: 0, sodium: 307 },
      // Eggs & dairy
      { name: 'Eggs (whole)', serving: '1 large', protein: 6.3, carbs: 0.4, fat: 5, calories: 72, fiber: 0, sugar: 0.2, sodium: 71 },
      { name: 'Egg whites', serving: '100g', protein: 11, carbs: 0.7, fat: 0.2, calories: 52, fiber: 0, sugar: 0.7, sodium: 166 },
      { name: 'Greek yogurt (nonfat)', serving: '170g', protein: 17, carbs: 6, fat: 0.7, calories: 100, fiber: 0, sugar: 6, sodium: 60 },
      { name: 'Greek yogurt (2%)', serving: '170g', protein: 16, carbs: 6, fat: 3.5, calories: 130, fiber: 0, sugar: 5, sodium: 55 },
      { name: 'Regular yogurt (plain)', serving: '170g', protein: 9, carbs: 12, fat: 4, calories: 120, fiber: 0, sugar: 12, sodium: 100 },
      { name: 'Cottage cheese (low-fat)', serving: '100g', protein: 11, carbs: 3.4, fat: 1, calories: 72, fiber: 0, sugar: 2.7, sodium: 364 },
      { name: 'Cottage cheese (full-fat)', serving: '100g', protein: 11, carbs: 3.4, fat: 4.3, calories: 98, fiber: 0, sugar: 2.7, sodium: 364 },
      { name: 'Whole milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 8, calories: 150, fiber: 0, sugar: 12, sodium: 105 },
      { name: '2% milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 5, calories: 122, fiber: 0, sugar: 12, sodium: 115 },
      { name: 'Skim milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 0.2, calories: 83, fiber: 0, sugar: 12, sodium: 103 },
      { name: 'Almond milk (unsweetened)', serving: '240ml', protein: 1, carbs: 1, fat: 2.5, calories: 30, fiber: 0, sugar: 0, sodium: 150 },
      { name: 'Oat milk', serving: '240ml', protein: 3, carbs: 16, fat: 5, calories: 120, fiber: 2, sugar: 7, sodium: 100 },
      { name: 'Soy milk (unsweetened)', serving: '240ml', protein: 7, carbs: 4, fat: 4, calories: 80, fiber: 1, sugar: 1, sodium: 90 },
      { name: 'Cheddar cheese', serving: '28g (1 oz)', protein: 7, carbs: 0.4, fat: 9, calories: 114, fiber: 0, sugar: 0.1, sodium: 180 },
      { name: 'Mozzarella (part-skim)', serving: '28g (1 oz)', protein: 7, carbs: 1, fat: 5, calories: 72, fiber: 0, sugar: 0.5, sodium: 175 },
      { name: 'Parmesan', serving: '15g', protein: 5.4, carbs: 0.5, fat: 4.3, calories: 63, fiber: 0, sugar: 0.1, sodium: 228 },
      { name: 'Feta cheese', serving: '28g', protein: 4, carbs: 1.1, fat: 6, calories: 75, fiber: 0, sugar: 1, sodium: 316 },
      { name: 'Cream cheese', serving: '2 tbsp (30g)', protein: 2, carbs: 2, fat: 10, calories: 100, fiber: 0, sugar: 2, sodium: 105 },
      { name: 'Butter', serving: '1 tbsp', protein: 0.1, carbs: 0, fat: 11.5, calories: 102, fiber: 0, sugar: 0, sodium: 91 },
      // Plant proteins
      { name: 'Tofu (firm)', serving: '100g', protein: 8, carbs: 2, fat: 4.5, calories: 76, fiber: 0.3, sugar: 0.6, sodium: 14 },
      { name: 'Tempeh', serving: '100g', protein: 19, carbs: 9, fat: 11, calories: 193, fiber: 0, sugar: 0, sodium: 9 },
      { name: 'Edamame (shelled)', serving: '100g', protein: 12, carbs: 9, fat: 5, calories: 121, fiber: 5, sugar: 2.2, sodium: 6 },
      { name: 'Lentils (cooked)', serving: '100g', protein: 9, carbs: 20, fat: 0.4, calories: 116, fiber: 8, sugar: 1.8, sodium: 2 },
      { name: 'Black beans (cooked)', serving: '100g', protein: 8.9, carbs: 24, fat: 0.5, calories: 132, fiber: 8.7, sugar: 0.3, sodium: 1 },
      { name: 'Chickpeas (cooked)', serving: '100g', protein: 8.9, carbs: 27, fat: 2.6, calories: 164, fiber: 7.6, sugar: 4.8, sodium: 7 },
      { name: 'Kidney beans (cooked)', serving: '100g', protein: 8.7, carbs: 23, fat: 0.5, calories: 127, fiber: 6.4, sugar: 0.3, sodium: 2 },
      { name: 'Pinto beans (cooked)', serving: '100g', protein: 9, carbs: 26, fat: 0.7, calories: 143, fiber: 9, sugar: 0.3, sodium: 1 },
      { name: 'Seitan', serving: '100g', protein: 25, carbs: 4, fat: 1.9, calories: 120, fiber: 0.6, sugar: 0, sodium: 29 },
      // Carbs — grains & starches
      { name: 'Oats (dry)', serving: '40g', protein: 5.4, carbs: 27, fat: 2.6, calories: 150, fiber: 4, sugar: 0.4, sodium: 2 },
      { name: 'Oatmeal (cooked)', serving: '1 cup', protein: 5.5, carbs: 27, fat: 3, calories: 150, fiber: 4, sugar: 1, sodium: 5 },
      { name: 'Brown rice (cooked)', serving: '100g', protein: 2.6, carbs: 23, fat: 0.9, calories: 112, fiber: 1.8, sugar: 0.4, sodium: 5 },
      { name: 'White rice (cooked)', serving: '100g', protein: 2.7, carbs: 28, fat: 0.3, calories: 130, fiber: 0.4, sugar: 0.1, sodium: 1 },
      { name: 'Jasmine rice (cooked)', serving: '100g', protein: 2.7, carbs: 28, fat: 0.2, calories: 129, fiber: 0.4, sugar: 0, sodium: 1 },
      { name: 'Quinoa (cooked)', serving: '100g', protein: 4.4, carbs: 21, fat: 1.9, calories: 120, fiber: 2.8, sugar: 0.9, sodium: 7 },
      { name: 'Couscous (cooked)', serving: '100g', protein: 3.8, carbs: 23, fat: 0.2, calories: 112, fiber: 1.4, sugar: 0.1, sodium: 5 },
      { name: 'Pasta (cooked)', serving: '100g', protein: 5, carbs: 25, fat: 0.9, calories: 131, fiber: 1.8, sugar: 0.6, sodium: 1 },
      { name: 'Whole wheat pasta (cooked)', serving: '100g', protein: 5.8, carbs: 26, fat: 0.5, calories: 124, fiber: 3.9, sugar: 0.8, sodium: 3 },
      { name: 'Bread (whole wheat)', serving: '1 slice (28g)', protein: 3.5, carbs: 12, fat: 1, calories: 70, fiber: 2, sugar: 1.5, sodium: 130 },
      { name: 'Bread (white)', serving: '1 slice (28g)', protein: 2.5, carbs: 13, fat: 1, calories: 70, fiber: 0.7, sugar: 1.5, sodium: 140 },
      { name: 'Sourdough bread', serving: '1 slice (40g)', protein: 3.5, carbs: 18, fat: 0.5, calories: 90, fiber: 1, sugar: 1, sodium: 180 },
      { name: 'Bagel', serving: '1 medium', protein: 10, carbs: 55, fat: 1.5, calories: 270, fiber: 2, sugar: 6, sodium: 450 },
      { name: 'English muffin', serving: '1 muffin', protein: 4.5, carbs: 26, fat: 1, calories: 130, fiber: 1.5, sugar: 2, sodium: 250 },
      { name: 'Tortilla (flour, 8\")', serving: '1 tortilla', protein: 4, carbs: 25, fat: 4, calories: 150, fiber: 1, sugar: 1, sodium: 320 },
      { name: 'Tortilla (corn)', serving: '1 tortilla', protein: 1.4, carbs: 11, fat: 0.7, calories: 52, fiber: 1.5, sugar: 0.4, sodium: 11 },
      { name: 'Potato (baked)', serving: '100g', protein: 2.5, carbs: 21, fat: 0.1, calories: 93, fiber: 2.2, sugar: 1.2, sodium: 10 },
      { name: 'Sweet potato (baked)', serving: '100g', protein: 2, carbs: 20.7, fat: 0.2, calories: 90, fiber: 3.3, sugar: 6.5, sodium: 36 },
      { name: 'French fries', serving: '100g', protein: 3.4, carbs: 38, fat: 15, calories: 312, fiber: 3.5, sugar: 0.3, sodium: 210 },
      { name: 'Hash browns', serving: '100g', protein: 2.5, carbs: 28, fat: 9, calories: 206, fiber: 2.5, sugar: 1, sodium: 350 },
      // Fruits
      { name: 'Banana', serving: '1 medium', protein: 1.3, carbs: 27, fat: 0.4, calories: 105, fiber: 3.1, sugar: 14, sodium: 1 },
      { name: 'Apple', serving: '1 medium', protein: 0.5, carbs: 25, fat: 0.3, calories: 95, fiber: 4.4, sugar: 19, sodium: 2 },
      { name: 'Orange', serving: '1 medium', protein: 1.2, carbs: 15, fat: 0.2, calories: 62, fiber: 3.1, sugar: 12, sodium: 0 },
      { name: 'Strawberries', serving: '100g', protein: 0.7, carbs: 8, fat: 0.3, calories: 32, fiber: 2, sugar: 4.9, sodium: 1 },
      { name: 'Blueberries', serving: '100g', protein: 0.7, carbs: 14, fat: 0.3, calories: 57, fiber: 2.4, sugar: 10, sodium: 1 },
      { name: 'Grapes', serving: '100g', protein: 0.7, carbs: 18, fat: 0.2, calories: 69, fiber: 0.9, sugar: 16, sodium: 2 },
      { name: 'Mango', serving: '100g', protein: 0.8, carbs: 15, fat: 0.4, calories: 60, fiber: 1.6, sugar: 14, sodium: 1 },
      { name: 'Pineapple', serving: '100g', protein: 0.5, carbs: 13, fat: 0.1, calories: 50, fiber: 1.4, sugar: 10, sodium: 1 },
      { name: 'Watermelon', serving: '100g', protein: 0.6, carbs: 8, fat: 0.2, calories: 30, fiber: 0.4, sugar: 6, sodium: 1 },
      { name: 'Pear', serving: '1 medium', protein: 0.6, carbs: 27, fat: 0.2, calories: 101, fiber: 5.5, sugar: 17, sodium: 2 },
      { name: 'Peach', serving: '1 medium', protein: 1, carbs: 15, fat: 0.4, calories: 59, fiber: 2.3, sugar: 13, sodium: 0 },
      { name: 'Kiwi', serving: '1 fruit', protein: 0.8, carbs: 10, fat: 0.4, calories: 42, fiber: 2.1, sugar: 6, sodium: 2 },
      { name: 'Dates (Medjool)', serving: '2 dates', protein: 0.8, carbs: 36, fat: 0.1, calories: 133, fiber: 3.2, sugar: 32, sodium: 1 },
      { name: 'Raisins', serving: '40g (small box)', protein: 1.2, carbs: 32, fat: 0.2, calories: 120, fiber: 1.5, sugar: 26, sodium: 5 },
      // Vegetables
      { name: 'Broccoli (cooked)', serving: '100g', protein: 2.4, carbs: 7, fat: 0.4, calories: 35, fiber: 3.3, sugar: 1.4, sodium: 41 },
      { name: 'Spinach (raw)', serving: '100g', protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23, fiber: 2.2, sugar: 0.4, sodium: 79 },
      { name: 'Kale (raw)', serving: '100g', protein: 4.3, carbs: 9, fat: 0.9, calories: 49, fiber: 3.6, sugar: 2.3, sodium: 38 },
      { name: 'Asparagus (cooked)', serving: '100g', protein: 2.4, carbs: 4, fat: 0.2, calories: 22, fiber: 2.1, sugar: 1.3, sodium: 14 },
      { name: 'Green beans (cooked)', serving: '100g', protein: 1.9, carbs: 8, fat: 0.1, calories: 35, fiber: 3.2, sugar: 1.5, sodium: 1 },
      { name: 'Carrots (raw)', serving: '100g', protein: 0.9, carbs: 10, fat: 0.2, calories: 41, fiber: 2.8, sugar: 4.7, sodium: 69 },
      { name: 'Bell pepper (red)', serving: '100g', protein: 1, carbs: 6, fat: 0.3, calories: 31, fiber: 2.1, sugar: 4.2, sodium: 4 },
      { name: 'Tomato', serving: '1 medium', protein: 1.1, carbs: 5, fat: 0.2, calories: 22, fiber: 1.5, sugar: 3.2, sodium: 6 },
      { name: 'Cucumber', serving: '100g', protein: 0.7, carbs: 3.6, fat: 0.1, calories: 15, fiber: 0.5, sugar: 1.7, sodium: 2 },
      { name: 'Zucchini (cooked)', serving: '100g', protein: 1.1, carbs: 3, fat: 0.4, calories: 17, fiber: 1, sugar: 1.5, sodium: 3 },
      { name: 'Cauliflower (cooked)', serving: '100g', protein: 1.8, carbs: 4, fat: 0.5, calories: 23, fiber: 2.3, sugar: 1.5, sodium: 15 },
      { name: 'Brussels sprouts (cooked)', serving: '100g', protein: 3.4, carbs: 9, fat: 0.5, calories: 43, fiber: 3.5, sugar: 2.2, sodium: 21 },
      { name: 'Mushrooms (white)', serving: '100g', protein: 3.1, carbs: 3.3, fat: 0.3, calories: 22, fiber: 1, sugar: 2, sodium: 5 },
      { name: 'Onion', serving: '100g', protein: 1.1, carbs: 9, fat: 0.1, calories: 40, fiber: 1.7, sugar: 4.2, sodium: 4 },
      { name: 'Garlic', serving: '3 cloves', protein: 0.6, carbs: 3, fat: 0, calories: 13, fiber: 0.2, sugar: 0.1, sodium: 1 },
      { name: 'Corn (sweet, cooked)', serving: '100g', protein: 3.3, carbs: 21, fat: 1.5, calories: 96, fiber: 2.4, sugar: 4.5, sodium: 1 },
      { name: 'Peas (cooked)', serving: '100g', protein: 5.4, carbs: 14, fat: 0.4, calories: 81, fiber: 5.5, sugar: 5.7, sodium: 3 },
      { name: 'Mixed salad greens', serving: '2 cups', protein: 1.5, carbs: 3, fat: 0.2, calories: 15, fiber: 1.5, sugar: 1, sodium: 20 },
      // Nuts, seeds, fats
      { name: 'Almonds', serving: '28g (1 oz)', protein: 6, carbs: 6, fat: 14, calories: 164, fiber: 3.5, sugar: 1.2, sodium: 0 },
      { name: 'Walnuts', serving: '28g (1 oz)', protein: 4.3, carbs: 4, fat: 18, calories: 185, fiber: 1.9, sugar: 0.7, sodium: 1 },
      { name: 'Cashews', serving: '28g (1 oz)', protein: 5, carbs: 9, fat: 12, calories: 157, fiber: 0.9, sugar: 1.7, sodium: 3 },
      { name: 'Peanuts', serving: '28g (1 oz)', protein: 7, carbs: 4.5, fat: 14, calories: 161, fiber: 2.4, sugar: 1.3, sodium: 2 },
      { name: 'Peanut butter', serving: '2 tbsp (32g)', protein: 7, carbs: 6, fat: 16, calories: 190, fiber: 2, sugar: 3, sodium: 140 },
      { name: 'Almond butter', serving: '2 tbsp (32g)', protein: 6, carbs: 6, fat: 17, calories: 190, fiber: 3, sugar: 1, sodium: 0 },
      { name: 'Chia seeds', serving: '15g (1 tbsp)', protein: 2.5, carbs: 6, fat: 4.5, calories: 70, fiber: 5, sugar: 0, sodium: 2 },
      { name: 'Flax seeds (ground)', serving: '15g', protein: 2.5, carbs: 4, fat: 6, calories: 75, fiber: 4, sugar: 0.2, sodium: 4 },
      { name: 'Pumpkin seeds', serving: '28g', protein: 8.5, carbs: 5, fat: 13, calories: 151, fiber: 1.7, sugar: 0.4, sodium: 5 },
      { name: 'Sunflower seeds', serving: '28g', protein: 5.5, carbs: 5.5, fat: 14, calories: 164, fiber: 2.5, sugar: 0.7, sodium: 1 },
      { name: 'Avocado', serving: '1/2 fruit', protein: 2, carbs: 9, fat: 15, calories: 160, fiber: 7, sugar: 0.7, sodium: 7 },
      { name: 'Olive oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 119, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Coconut oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 120, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Canola oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 124, fiber: 0, sugar: 0, sodium: 0 },
      // Convenience & restaurant-style
      { name: 'White rice bowl (restaurant)', serving: '1 cup cooked', protein: 4, carbs: 45, fat: 0.5, calories: 200, fiber: 0.6, sugar: 0, sodium: 5 },
      { name: 'Pizza (cheese, slice)', serving: '1 slice', protein: 12, carbs: 34, fat: 10, calories: 285, fiber: 2, sugar: 4, sodium: 640 },
      { name: 'Burger (beef, no cheese)', serving: '1 sandwich', protein: 25, carbs: 30, fat: 20, calories: 400, fiber: 1.5, sugar: 6, sodium: 600 },
      { name: 'Cheeseburger', serving: '1 sandwich', protein: 28, carbs: 31, fat: 25, calories: 460, fiber: 1.5, sugar: 7, sodium: 780 },
      { name: 'Chicken sandwich (breaded)', serving: '1 sandwich', protein: 25, carbs: 40, fat: 18, calories: 440, fiber: 2, sugar: 5, sodium: 900 },
      { name: 'Sushi roll (California)', serving: '6–8 pieces', protein: 9, carbs: 38, fat: 7, calories: 255, fiber: 3, sugar: 6, sodium: 500 },
      { name: 'Ramen (instant, prepared)', serving: '1 package', protein: 9, carbs: 52, fat: 14, calories: 380, fiber: 2, sugar: 2, sodium: 1600 },
      { name: 'Burrito (bean & cheese)', serving: '1 burrito', protein: 18, carbs: 55, fat: 15, calories: 420, fiber: 8, sugar: 3, sodium: 900 },
      { name: 'Tacos (beef, 2 soft)', serving: '2 tacos', protein: 18, carbs: 28, fat: 16, calories: 330, fiber: 3, sugar: 2, sodium: 550 },
      { name: 'Pad Thai', serving: '1 serving (~300g)', protein: 18, carbs: 55, fat: 16, calories: 450, fiber: 3, sugar: 12, sodium: 1100 },
      // Snacks & sweets
      { name: 'Protein bar (typical)', serving: '1 bar (60g)', protein: 20, carbs: 22, fat: 7, calories: 220, fiber: 5, sugar: 8, sodium: 180 },
      { name: 'Granola bar', serving: '1 bar (25g)', protein: 2, carbs: 18, fat: 4, calories: 110, fiber: 1.5, sugar: 8, sodium: 70 },
      { name: 'Rice cakes (plain)', serving: '2 cakes', protein: 1, carbs: 14, fat: 0.3, calories: 70, fiber: 0.4, sugar: 0, sodium: 20 },
      { name: 'Popcorn (air-popped)', serving: '3 cups', protein: 3, carbs: 19, fat: 1.2, calories: 90, fiber: 3.5, sugar: 0.2, sodium: 2 },
      { name: 'Dark chocolate (70%)', serving: '30g', protein: 2.5, carbs: 13, fat: 13, calories: 170, fiber: 3.5, sugar: 7, sodium: 5 },
      { name: 'Ice cream (vanilla)', serving: '1/2 cup', protein: 2.5, carbs: 16, fat: 7, calories: 137, fiber: 0, sugar: 14, sodium: 50 },
      { name: 'Honey', serving: '1 tbsp', protein: 0, carbs: 17, fat: 0, calories: 64, fiber: 0, sugar: 17, sodium: 1 },
      { name: 'Maple syrup', serving: '1 tbsp', protein: 0, carbs: 13, fat: 0, calories: 52, fiber: 0, sugar: 12, sodium: 2 },
      { name: 'Table sugar', serving: '1 tbsp', protein: 0, carbs: 12.5, fat: 0, calories: 48, fiber: 0, sugar: 12.5, sodium: 0 },
      // Supplements & drinks
      { name: 'Whey protein powder', serving: '1 scoop (30g)', protein: 24, carbs: 3, fat: 1.5, calories: 120, fiber: 0, sugar: 1, sodium: 50 },
      { name: 'Casein protein powder', serving: '1 scoop (30g)', protein: 24, carbs: 3, fat: 1, calories: 120, fiber: 1, sugar: 1, sodium: 60 },
      { name: 'Plant protein powder', serving: '1 scoop (30g)', protein: 20, carbs: 5, fat: 2, calories: 120, fiber: 2, sugar: 1, sodium: 200 },
      { name: 'Creatine monohydrate', serving: '5g', protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Coffee (black)', serving: '240ml', protein: 0.3, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 5 },
      { name: 'Tea (black, plain)', serving: '240ml', protein: 0, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 5 },
      { name: 'Green tea', serving: '240ml', protein: 0, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 2 },
      { name: 'Orange juice', serving: '240ml', protein: 1.7, carbs: 26, fat: 0.5, calories: 110, fiber: 0.5, sugar: 21, sodium: 2 },
      { name: 'Apple juice', serving: '240ml', protein: 0.2, carbs: 28, fat: 0.3, calories: 114, fiber: 0.2, sugar: 24, sodium: 10 },
      { name: 'Gatorade / sports drink', serving: '240ml', protein: 0, carbs: 14, fat: 0, calories: 50, fiber: 0, sugar: 14, sodium: 110 },
      { name: 'Cola / soda', serving: '355ml can', protein: 0, carbs: 39, fat: 0, calories: 140, fiber: 0, sugar: 39, sodium: 45 },
      { name: 'Beer (regular)', serving: '355ml', protein: 1.6, carbs: 13, fat: 0, calories: 153, fiber: 0, sugar: 0, sodium: 14 },
      { name: 'Wine (red)', serving: '150ml glass', protein: 0.1, carbs: 4, fat: 0, calories: 125, fiber: 0, sugar: 1, sodium: 5 },
      // Breakfast favorites
      { name: 'Pancakes (from mix)', serving: '3 medium', protein: 8, carbs: 50, fat: 6, calories: 280, fiber: 1.5, sugar: 10, sodium: 550 },
      { name: 'Waffle (frozen)', serving: '1 waffle', protein: 3, carbs: 18, fat: 4, calories: 120, fiber: 0.5, sugar: 3, sodium: 220 },
      { name: 'Cereal (corn flakes)', serving: '1 cup', protein: 2, carbs: 24, fat: 0.2, calories: 100, fiber: 1, sugar: 3, sodium: 200 },
      { name: 'Cereal (oat / granola)', serving: '1/2 cup', protein: 5, carbs: 32, fat: 6, calories: 200, fiber: 4, sugar: 12, sodium: 50 },
      { name: 'Breakfast sausage', serving: '2 links', protein: 8, carbs: 1, fat: 12, calories: 140, fiber: 0, sugar: 0, sodium: 340 },
      { name: 'Hash brown patty', serving: '1 patty', protein: 1.5, carbs: 15, fat: 9, calories: 140, fiber: 1.5, sugar: 0.5, sodium: 280 }
    ];

    function ensureFoodLibrary() {
      data.foodLibrary = data.foodLibrary || [];
      if (data.foodLibrary.length === 0) {
        data.foodLibrary = DEFAULT_FOODS.map((f, i) => ({ id: 'default-' + i, ...f, source: 'builtin' }));
        saveData(data);
        return;
      }
      // Merge any new built-in foods for users who already have a library
      const existing = new Set(data.foodLibrary.map(f => (f.name || '').toLowerCase()));
      let added = 0;
      DEFAULT_FOODS.forEach((f, i) => {
        const key = (f.name || '').toLowerCase();
        if (!existing.has(key)) {
          data.foodLibrary.push({ id: 'default-' + i + '-' + Date.now(), ...f, source: 'builtin' });
          existing.add(key);
          added++;
        }
      });
      if (added) saveData(data);
    }

    function showFoodMode(mode) {
      ['search', 'barcode', 'manual', 'custom'].forEach(m => {
        const el = document.getElementById('food-mode-' + m);
        if (el) el.classList.toggle('hidden', m !== mode);
        const btn = document.getElementById('mode-' + m);
        if (btn) {
          btn.className = m === mode ? 'btn-primary text-sm' : 'btn-secondary text-sm';
        }
      });
      if (mode !== 'barcode' && scannerRunning) stopBarcodeScanner();
      if (mode === 'search') searchFoodLibrary();
    }

    const debouncedFoodSearch = debounce(() => searchFoodLibrary(), 150);
    const debouncedHistorySearch = debounce(() => renderWorkoutHistory(), 150);
    const debouncedLibraryFilter = debounce(() => renderFoodLibrary(), 150);

    const FOOD_ROW_EST = 44;
    const FOOD_OVERSCAN = 8;
    const FOOD_VIEWPORT = 256;
    let _foodSearchList = [];
    let _foodLibList = [];
    let _foodSearchScroll = null;
    let _foodLibScroll = null;

    function foodRowHtml(f, compact) {
      const id = String(f.id).replace(/'/g, '');
      if (compact) {
        return `
        <div class="flex justify-between items-center border border-slate-200 rounded px-2 py-1.5 hover:bg-slate-50 cursor-pointer" onclick="pickFoodById('${id}')">
          <div>
            <span class="font-medium">${f.name}</span>
            <span class="text-slate-500 text-xs ml-1">${f.serving || ''}</span>
          </div>
          <span class="text-xs text-slate-500">P${f.protein} C${f.carbs} F${f.fat} · ${f.calories}kcal</span>
        </div>`;
      }
      return `
        <div class="flex justify-between items-center border border-slate-200 rounded px-2 py-1">
          <div class="cursor-pointer flex-1" onclick="pickFoodById('${id}')">
            <span class="font-medium">${f.name}</span>
            <span class="text-xs text-slate-500 ml-1">${f.serving || ''} · ${f.calories}kcal</span>
          </div>
          ${f.source === 'custom' || f.source === 'barcode' ? `<button onclick="deleteLibraryFood('${id}')" class="btn-danger text-xs">✕</button>` : ''}
        </div>`;
    }

    function paintFoodVirtual(scrollEl, list, compact) {
      if (!scrollEl) return;
      const inner = scrollEl.querySelector('[data-virt-inner]');
      if (!inner) return;
      const total = list.length;
      if (!total) {
        inner.innerHTML = '';
        return;
      }
      const scrollTop = scrollEl.scrollTop;
      const viewH = scrollEl.clientHeight || FOOD_VIEWPORT;
      let start = Math.floor(scrollTop / FOOD_ROW_EST) - FOOD_OVERSCAN;
      if (start < 0) start = 0;
      let end = Math.ceil((scrollTop + viewH) / FOOD_ROW_EST) + FOOD_OVERSCAN;
      if (end > total) end = total;
      const topPad = start * FOOD_ROW_EST;
      const bottomPad = (total - end) * FOOD_ROW_EST;
      inner.innerHTML =
        `<div style="height:${topPad}px"></div>` +
        list.slice(start, end).map(f => foodRowHtml(f, compact)).join('') +
        `<div style="height:${bottomPad}px"></div>`;
    }

    const onFoodSearchScroll = debounce(() => paintFoodVirtual(_foodSearchScroll, _foodSearchList, true), 16);
    const onFoodLibScroll = debounce(() => paintFoodVirtual(_foodLibScroll, _foodLibList, false), 16);

    function mountFoodVirtual(container, list, compact, which) {
      if (list.length <= 40) {
        container.innerHTML = list.map(f => foodRowHtml(f, compact)).join('');
        if (which === 'search') _foodSearchScroll = null;
        else _foodLibScroll = null;
        return;
      }
      container.innerHTML = `
        <p class="text-xs text-slate-500 mb-1">${list.length} items · virtualized</p>
        <div data-food-virt-scroll style="max-height:${FOOD_VIEWPORT}px;overflow-y:auto;">
          <div data-virt-inner></div>
        </div>`;
      const sc = container.querySelector('[data-food-virt-scroll]');
      if (which === 'search') {
        _foodSearchScroll = sc;
        _foodSearchList = list;
        sc.removeEventListener('scroll', onFoodSearchScroll);
        sc.addEventListener('scroll', onFoodSearchScroll, { passive: true });
      } else {
        _foodLibScroll = sc;
        _foodLibList = list;
        sc.removeEventListener('scroll', onFoodLibScroll);
        sc.addEventListener('scroll', onFoodLibScroll, { passive: true });
      }
      paintFoodVirtual(sc, list, compact);
    }

    function searchFoodLibrary() {
      ensureFoodLibrary();
      const q = (document.getElementById('food-search')?.value || '').toLowerCase().trim();
      const results = document.getElementById('food-search-results');
      if (!results) return;
      let list = data.foodLibrary;
      if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q));
      if (!list.length) {
        results.innerHTML = '<p class="text-slate-500">No foods found.</p>';
        _foodSearchScroll = null;
        return;
      }
      mountFoodVirtual(results, list, true, 'search');
    }

    function pickFoodById(id) {
      ensureFoodLibrary();
      const f = data.foodLibrary.find(x => String(x.id) === String(id));
      if (f) pickFood(f);
    }

    function pickFood(f) {
      pickedFood = f;
      document.getElementById('food-serving-picker').classList.remove('hidden');
      document.getElementById('picked-food-name').textContent = f.name + (f.brand ? ' (' + f.brand + ')' : '');
      document.getElementById('picked-servings').value = 1;
      const microBits = MICRO_FIELDS
        .filter(({ key }) => f[key])
        .map(({ key, unit }) => `${key === 'satFat' ? 'Sat' : key}: ${f[key]}${unit}`)
        .slice(0, 6)
        .join(' · ');
      document.getElementById('picked-food-info').textContent =
        `Per serving (${f.serving || '1'}): ${f.calories || 0} kcal · P ${f.protein || 0}g · C ${f.carbs || 0}g · F ${f.fat || 0}g` +
        (microBits ? ' · ' + microBits : '');
    }

    function cancelPickedFood() {
      pickedFood = null;
      document.getElementById('food-serving-picker').classList.add('hidden');
    }

    const MICRO_FIELDS = [
      { key: 'fiber', unit: 'g', decimals: 1 },
      { key: 'sugar', unit: 'g', decimals: 1 },
      { key: 'satFat', unit: 'g', decimals: 1 },
      { key: 'cholesterol', unit: 'mg', decimals: 0 },
      { key: 'sodium', unit: 'mg', decimals: 0 },
      { key: 'potassium', unit: 'mg', decimals: 0 },
      { key: 'calcium', unit: 'mg', decimals: 0 },
      { key: 'iron', unit: 'mg', decimals: 1 },
      { key: 'vitaminC', unit: 'mg', decimals: 1 },
      { key: 'vitaminD', unit: 'µg', decimals: 1 },
      { key: 'magnesium', unit: 'mg', decimals: 0 }
    ];

    function round1(n) { return Math.round(n * 10) / 10; }
    function roundN(n, d) {
      const m = Math.pow(10, d);
      return Math.round((n || 0) * m) / m;
    }

    function scaleFoodEntry(f, servings) {
      const entry = {
        id: Date.now() + Math.random(),
        name: f.name,
        servings,
        serving: f.serving,
        protein: round1((f.protein || 0) * servings),
        carbs: round1((f.carbs || 0) * servings),
        fat: round1((f.fat || 0) * servings),
        calories: Math.round((f.calories || ((f.protein || 0) * 4 + (f.carbs || 0) * 4 + (f.fat || 0) * 9)) * servings)
      };
      MICRO_FIELDS.forEach(({ key, decimals }) => {
        entry[key] = roundN((f[key] || 0) * servings, decimals);
      });
      return entry;
    }

    function sumDayFoods(list) {
      const t = {
        protein: 0, carbs: 0, fat: 0, calories: 0
      };
      MICRO_FIELDS.forEach(({ key }) => { t[key] = 0; });
      (list || []).forEach(f => {
        t.protein += f.protein || 0;
        t.carbs += f.carbs || 0;
        t.fat += f.fat || 0;
        t.calories += f.calories || 0;
        MICRO_FIELDS.forEach(({ key }) => { t[key] += f[key] || 0; });
      });
      return t;
    }

    function confirmAddFood() {
      if (!pickedFood) return;
      const servings = parseFloat(document.getElementById('picked-servings').value) || 1;
      dayFoods.push(scaleFoodEntry(pickedFood, servings));
      cancelPickedFood();
      renderDayFoods();
    }

    function removeDayFood(id) {
      dayFoods = dayFoods.filter(f => f.id !== id);
      renderDayFoods();
    }

    function renderDayFoods() {
      const list = document.getElementById('day-foods-list');
      if (!list) return;
      if (!dayFoods.length) {
        list.innerHTML = '<p class="text-slate-500">No foods added for this day yet.</p>';
      } else {
        list.innerHTML = dayFoods.map(f => `
          <div class="flex justify-between items-center border border-slate-200 rounded-lg px-3 py-2">
            <div>
              <span class="font-medium">${f.name}</span>
              <span class="text-slate-500 text-xs ml-1">×${f.servings}${f.serving ? ' (' + f.serving + ')' : ''}</span>
              <div class="text-xs text-slate-500">${f.calories} kcal · P${f.protein} C${f.carbs} F${f.fat}${f.fiber ? ' · Fi' + f.fiber : ''}${f.sodium ? ' · Na' + f.sodium + 'mg' : ''}${f.potassium ? ' · K' + f.potassium + 'mg' : ''}</div>
            </div>
            <button onclick="removeDayFood(${f.id})" class="btn-danger text-xs">Remove</button>
          </div>
        `).join('');
      }
      const t = sumDayFoods(dayFoods);
      document.getElementById('tot-cal').textContent = Math.round(t.calories);
      document.getElementById('tot-p').textContent = round1(t.protein) + 'g';
      document.getElementById('tot-c').textContent = round1(t.carbs) + 'g';
      document.getElementById('tot-f').textContent = round1(t.fat) + 'g';
      MICRO_FIELDS.forEach(({ key, unit, decimals }) => {
        const el = document.getElementById('tot-' + key);
        if (!el) return;
        el.textContent = (decimals === 0 ? Math.round(t[key] || 0) : roundN(t[key] || 0, decimals)) + unit;
      });
      document.getElementById('tot-foods').textContent = dayFoods.length;
    }

    function loadDayFoods() {
      const date = document.getElementById('nu-date').value || today();
      const entry = data.nutrition.find(n => n.date === date);
      dayFoods = entry && entry.foods ? JSON.parse(JSON.stringify(entry.foods)) : [];
      renderDayFoods();
    }

    function saveDayFromFoods() {
      const date = document.getElementById('nu-date').value || today();
      if (!dayFoods.length) return showToast('Add some foods first, or use Quick Macros.', 'error');
      const t = sumDayFoods(dayFoods);
      const entry = {
        date,
        protein: round1(t.protein),
        carbs: round1(t.carbs),
        fat: round1(t.fat),
        calories: Math.round(t.calories),
        foods: dayFoods
      };
      MICRO_FIELDS.forEach(({ key, decimals }) => {
        entry[key] = decimals === 0 ? Math.round(t[key] || 0) : roundN(t[key] || 0, decimals);
      });
      const idx = data.nutrition.findIndex(n => n.date === date);
      if (idx >= 0) data.nutrition[idx] = entry;
      else data.nutrition.push(entry);
      data.nutrition.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);
      renderNutritionHistory();
      showToast('Nutrition day saved', 'success');
    }

    function clearDayFoods() {
      if (dayFoods.length && !confirm('Clear all foods for this day?')) return;
      dayFoods = [];
      renderDayFoods();
    }

    function addQuickMacros() {
      const protein = parseFloat(document.getElementById('nu-protein').value) || 0;
      const carbs = parseFloat(document.getElementById('nu-carbs').value) || 0;
      const fat = parseFloat(document.getElementById('nu-fat').value) || 0;
      const fiber = parseFloat(document.getElementById('nu-fiber').value) || 0;
      let calories = parseFloat(document.getElementById('nu-calories').value);
      if (!calories) calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
      if (protein === 0 && carbs === 0 && fat === 0) return alert('Enter at least one macro');
      dayFoods.push({
        id: Date.now(),
        name: 'Quick entry',
        servings: 1,
        protein, carbs, fat, calories, fiber, sugar: 0, sodium: 0
      });
      document.getElementById('nu-protein').value = '';
      document.getElementById('nu-carbs').value = '';
      document.getElementById('nu-fat').value = '';
      document.getElementById('nu-fiber').value = '';
      document.getElementById('nu-calories').value = '';
      renderDayFoods();
    }

    function saveCustomFood(addToDay) {
      const name = document.getElementById('cf-name').value.trim();
      if (!name) return alert('Name required');
      const protein = parseFloat(document.getElementById('cf-p').value) || 0;
      const carbs = parseFloat(document.getElementById('cf-c').value) || 0;
      const fat = parseFloat(document.getElementById('cf-f').value) || 0;
      let calories = parseFloat(document.getElementById('cf-cal').value);
      if (!calories) calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
      const food = {
        id: Date.now(),
        name,
        serving: document.getElementById('cf-serving').value.trim() || '1 serving',
        protein, carbs, fat, calories,
        fiber: parseFloat(document.getElementById('cf-fiber').value) || 0,
        sugar: parseFloat(document.getElementById('cf-sugar').value) || 0,
        sodium: parseFloat(document.getElementById('cf-sodium').value) || 0,
        satFat: parseFloat(document.getElementById('cf-satFat')?.value) || 0,
        cholesterol: parseFloat(document.getElementById('cf-cholesterol')?.value) || 0,
        potassium: parseFloat(document.getElementById('cf-potassium')?.value) || 0,
        calcium: parseFloat(document.getElementById('cf-calcium')?.value) || 0,
        iron: parseFloat(document.getElementById('cf-iron')?.value) || 0,
        vitaminC: parseFloat(document.getElementById('cf-vitaminC')?.value) || 0,
        vitaminD: parseFloat(document.getElementById('cf-vitaminD')?.value) || 0,
        magnesium: parseFloat(document.getElementById('cf-magnesium')?.value) || 0,
        barcode: document.getElementById('cf-barcode').value.trim() || null,
        source: 'custom'
      };
      ensureFoodLibrary();
      data.foodLibrary.push(food);
      saveData(data);
      renderFoodLibrary();
      if (addToDay) {
        pickedFood = food;
        confirmAddFood();
      } else {
        showToast('Saved to library', 'success');
      }
      ['cf-name','cf-serving','cf-p','cf-c','cf-f','cf-cal','cf-fiber','cf-sugar','cf-sodium','cf-satFat','cf-cholesterol','cf-potassium','cf-calcium','cf-iron','cf-vitaminC','cf-vitaminD','cf-magnesium','cf-barcode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    }

    function renderFoodLibrary() {
      ensureFoodLibrary();
      const q = (document.getElementById('library-filter')?.value || '').toLowerCase().trim();
      let list = data.foodLibrary;
      if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q));
      const countEl = document.getElementById('library-count');
      if (countEl) countEl.textContent = data.foodLibrary.length + ' foods';
      const el = document.getElementById('food-library-list');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = '<p class="text-slate-500">No foods match.</p>';
        _foodLibScroll = null;
        return;
      }
      mountFoodVirtual(el, list, false, 'lib');
    }

    function deleteLibraryFood(id) {
      data.foodLibrary = data.foodLibrary.filter(f => String(f.id) !== String(id));
      saveData(data);
      renderFoodLibrary();
    }

    async function lookupBarcode(code) {
      const barcode = code || document.getElementById('barcode-input').value.trim();
      if (!barcode) return alert('Enter a barcode');
      const resultEl = document.getElementById('barcode-result');
      resultEl.innerHTML = '<p class="text-slate-500">Looking up…</p>';
      try {
        const res = await fetch('https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(barcode) + '.json');
        const json = await res.json();
        if (json.status !== 1 || !json.product) {
          resultEl.innerHTML = '<p class="text-red-500">Product not found in Open Food Facts.</p>';
          return;
        }
        const p = json.product;
        const n = p.nutriments || {};
        // Prefer per serving if available, else per 100g
        const perServing = (servKey, g100Key) => {
          if (n[servKey] != null) return +n[servKey];
          if (n[g100Key] != null) return +n[g100Key];
          return 0;
        };
        const food = {
          id: 'bc-' + barcode,
          name: p.product_name || p.generic_name || 'Unknown product',
          brand: p.brands || '',
          barcode,
          serving: p.serving_size || '100g',
          protein: perServing('proteins_serving', 'proteins_100g'),
          carbs: perServing('carbohydrates_serving', 'carbohydrates_100g'),
          fat: perServing('fat_serving', 'fat_100g'),
          calories: perServing('energy-kcal_serving', 'energy-kcal_100g'),
          fiber: perServing('fiber_serving', 'fiber_100g'),
          sugar: perServing('sugars_serving', 'sugars_100g'),
          satFat: perServing('saturated-fat_serving', 'saturated-fat_100g'),
          cholesterol: perServing('cholesterol_serving', 'cholesterol_100g'),
          potassium: perServing('potassium_serving', 'potassium_100g'),
          calcium: perServing('calcium_serving', 'calcium_100g'),
          iron: perServing('iron_serving', 'iron_100g'),
          vitaminC: perServing('vitamin-c_serving', 'vitamin-c_100g'),
          vitaminD: perServing('vitamin-d_serving', 'vitamin-d_100g'),
          magnesium: perServing('magnesium_serving', 'magnesium_100g'),
          sodium: 0,
          source: 'barcode'
        };
        // sodium often stored in grams
        if (n.sodium_serving != null) food.sodium = Math.round(+n.sodium_serving * (+n.sodium_serving < 1 ? 1000 : 1));
        else if (n.sodium_100g != null) food.sodium = Math.round(+n.sodium_100g * 1000);
        // convert common mg minerals if OFF reported in grams (< 1)
        ['potassium', 'calcium', 'magnesium', 'cholesterol'].forEach(k => {
          if (food[k] > 0 && food[k] < 1) food[k] = Math.round(food[k] * 1000);
        });
        food.protein = round1(+food.protein);
        food.carbs = round1(+food.carbs);
        food.fat = round1(+food.fat);
        food.calories = Math.round(+food.calories);
        food.fiber = round1(+food.fiber);
        food.sugar = round1(+food.sugar);
        food.satFat = round1(+food.satFat);
        food.iron = round1(+food.iron);
        food.vitaminC = round1(+food.vitaminC);
        food.vitaminD = round1(+food.vitaminD);

        window._lastBarcodeFood = food;
        resultEl.innerHTML = `
          <div class="border border-slate-200 rounded-lg p-3">
            <p class="font-medium">${food.name.replace(/</g,'&lt;')}</p>
            <p class="text-xs text-slate-500">${(food.brand||'').replace(/</g,'&lt;')} · ${food.serving}</p>
            <p class="text-sm mt-1">${food.calories} kcal · P${food.protein} C${food.carbs} F${food.fat}</p>
            <div class="flex gap-2 mt-2">
              <button class="btn-primary text-sm" onclick="pickFood(window._lastBarcodeFood)">Add to Day</button>
              <button class="btn-secondary text-sm" onclick="saveBarcodeToLibrary(window._lastBarcodeFood)">Save to Library</button>
            </div>
          </div>
        `;
      } catch (e) {
        resultEl.innerHTML = '<p class="text-red-500">Lookup failed. Check internet connection.</p>';
      }
    }

    function saveBarcodeToLibrary(food) {
      if (!food) return;
      ensureFoodLibrary();
      if (!data.foodLibrary.find(f => f.barcode && f.barcode === food.barcode)) {
        data.foodLibrary.push(food);
        saveData(data);
        renderFoodLibrary();
      }
      alert('Saved to library!');
    }

    function toggleBarcodeScanner() {
      if (scannerRunning) stopBarcodeScanner();
      else startBarcodeScanner();
    }

    function loadHtml5Qrcode() {
      return new Promise((resolve, reject) => {
        if (typeof Html5Qrcode !== 'undefined') return resolve();
        const existing = document.querySelector('script[data-html5-qrcode]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        s.async = true;
        s.dataset.html5Qrcode = '1';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load scanner library'));
        document.head.appendChild(s);
      });
    }

    async function startBarcodeScanner() {
      const btn = document.getElementById('scan-btn');
      try {
        if (btn) btn.textContent = 'Loading scanner…';
        await loadHtml5Qrcode();
      } catch (e) {
        if (btn) btn.textContent = 'Start Camera Scan';
        alert('Barcode scanner library not available. Use manual barcode entry.');
        return;
      }
      html5QrCode = new Html5Qrcode('barcode-reader');
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decoded) => {
          document.getElementById('barcode-input').value = decoded;
          stopBarcodeScanner();
          lookupBarcode(decoded);
        },
        () => {}
      ).then(() => {
        scannerRunning = true;
        if (btn) btn.textContent = 'Stop Camera';
      }).catch(err => {
        if (btn) btn.textContent = 'Start Camera Scan';
        alert('Camera error: ' + err);
      });
    }

    function stopBarcodeScanner() {
      if (html5QrCode && scannerRunning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          scannerRunning = false;
          document.getElementById('scan-btn').textContent = 'Start Camera Scan';
        }).catch(() => { scannerRunning = false; });
      }
    }

    function deleteNutrition(date) {
      if (!confirm('Delete this entry?')) return;
      data.nutrition = data.nutrition.filter(n => n.date !== date);
      saveData(data);
      renderNutritionHistory();
      if (document.getElementById('nu-date').value === date) {
        dayFoods = [];
        renderDayFoods();
      }
    }

    function renderNutritionHistory() {
      const tbody = document.getElementById('nutrition-history');
      if (!data.nutrition.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-4 text-slate-500">No nutrition data yet.</td></tr>';
        return;
      }
      tbody.innerHTML = data.nutrition.map(n => `
        <tr class="border-b border-slate-100">
          <td class="py-2">${formatDate(n.date)}</td>
          <td class="py-2">${n.calories}</td>
          <td class="py-2">${n.protein}g</td>
          <td class="py-2">${n.carbs}g</td>
          <td class="py-2">${n.fat}g</td>
          <td class="py-2">${n.fiber != null ? n.fiber + 'g' : '—'}</td>
          <td class="py-2">${n.sodium != null ? n.sodium + 'mg' : '—'}</td>
          <td class="py-2"><button onclick="deleteNutrition('${n.date}')" class="btn-danger">Delete</button></td>
        </tr>
      `).join('');
    }

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
      if (existing) {
        existing.weight = weight;
        existing.reps = reps;
        existing.date = date;
        existing.estimated1RM = est;
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
      showToast('PR saved', 'success');
    }

    function deletePR(id) {
      if (!confirm('Delete this PR?')) return;
      data.prs = data.prs.filter(p => p.id !== id);
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
            <span class="font-medium">${p.exercise}</span>
            <span class="text-slate-600 ml-2">${toDisplay(p.weight)} ${unitLabel()} × ${p.reps}</span>
            <span class="text-slate-400 text-sm ml-2">(est. 1RM: ${toDisplay(p.estimated1RM)} ${unitLabel()})</span>
            <div class="text-xs text-slate-500">${formatDate(p.date)}</div>
          </div>
          <button onclick="deletePR(${p.id})" class="btn-danger">Delete</button>
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
      const avgProtein = recentNu.length ? Math.round(recentNu.reduce((s, n) => s + n.protein, 0) / recentNu.length) : 0;
      const weekProtein = weekNu.length ? Math.round(weekNu.reduce((s, n) => s + n.protein, 0) / weekNu.length) : 0;

      document.getElementById('stat-workouts').textContent = recentWorkouts.length;
      document.getElementById('stat-volume').textContent = Math.round(toDisplay(totalVol)) + ' ' + unitLabel();
      document.getElementById('stat-protein').textContent = avgProtein + ' g';
      document.getElementById('stat-prs').textContent = data.prs.length;
      document.getElementById('stat-streak').textContent = calcStreak() + 'd';

      const bwList = data.bodyweight || [];
      if (bwList.length) {
        const last = [...bwList].sort((a, b) => b.date.localeCompare(a.date))[0];
        document.getElementById('stat-bw').textContent = toDisplay(last.weight) + ' ' + unitLabel();
      } else {
        document.getElementById('stat-bw').textContent = '—';
      }

      // Weekly training report
      renderWeeklyReport();

      // Exercise selector
      const sel = document.getElementById('progress-exercise');
      const current = sel.value;
      const exercises = getUniqueExercises();
      sel.innerHTML = '<option value="">Select exercise…</option>' +
        exercises.map(e => `<option value="${e}" ${e === current ? 'selected' : ''}>${e}</option>`).join('');
      if (!current && exercises.length) sel.value = exercises[0];
      renderProgressChart();
      renderNutritionChart();
      renderBwChart();
      populateCardioSelectors();
      renderCardioChart();
      renderRecentActivity();
      const bwDate = document.getElementById('bw-date');
      if (bwDate && !bwDate.value) bwDate.value = today();
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
      const avgProtein = weekNu.length ? Math.round(weekNu.reduce((s, n) => s + (n.protein || 0), 0) / weekNu.length) : 0;
      const avgCal = weekNu.length ? Math.round(weekNu.reduce((s, n) => s + (n.calories || 0), 0) / weekNu.length) : 0;
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
        start, end, weekWorkouts, weekVol, weekNu, avgProtein, avgCal,
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
        <p>• Nutrition: avg protein <b>${r.avgProtein || '—'} g</b> · avg calories <b>${r.avgCal || '—'}</b> (${r.weekNu.length} days logged)</p>
        <p>• PRs this week: <b>${r.prsWeek.length}</b>${r.prsWeek.length ? ' — ' + r.prsWeek.map(p => p.exercise).slice(0, 4).join(', ') : ''}</p>
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
        `Avg protein: ${r.avgProtein || '—'} g across ${r.weekNu.length} days`,
        `Avg calories: ${r.avgCal || '—'}`,
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
        names.map(n => `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`).join('');
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
        html += `<div class="${cls}" onclick="selectCalDay('${iso}')">
          <div class="cal-num">${d.getDate()}</div>
          <div class="cal-dot">${tip}</div>
        </div>`;
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
            return `• ${ex.name}: ${ex.duration || '—'} min` + (ex.distance ? `, ${ex.distance} ${ex.distanceUnit || 'km'}` : '');
          }
          const sets = (ex.sets || []).map(s => `${s.reps}×${toDisplay(s.weight)}${unitLabel()}`).join(', ');
          return `• ${ex.name}: ${sets}`;
        }).join('<br>');
        html += `<div class="border border-slate-200 rounded-lg p-2 mb-2">
          <div class="font-medium">Session${w.notes ? ' — ' + w.notes : ''}</div>
          <div class="text-slate-600 mt-1">${lines || 'No exercises'}</div>
        </div>`;
      });
      detail.innerHTML = html;
    }

    function logWorkoutOnSelectedDay() {
      if (!calSelectedDate) return alert('Select a day first');
      showTab('workouts');
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
      data.measureUnit = u === 'in' ? 'in' : 'cm';
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
        cmBtn.className = 'px-3 py-1.5 ' + (isCm ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50');
        inBtn.className = 'px-3 py-1.5 ' + (!isCm ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50');
      }
    }

    function clearMeasurementForm() {
      MEASURE_KEYS.forEach(({ key }) => {
        const el = document.getElementById('meas-' + key);
        if (el) el.value = '';
      });
      const notes = document.getElementById('meas-notes');
      if (notes) notes.value = '';
    }

    function saveMeasurements() {
      const date = document.getElementById('meas-date')?.value || today();
      const entry = { id: Date.now() + Math.random(), date, notes: (document.getElementById('meas-notes')?.value || '').trim() };
      let any = false;
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderMeasuresHistory() {
      const tbody = document.getElementById('measures-history');
      const empty = document.getElementById('measures-empty');
      if (!tbody) return;
      const list = data.measurements || [];
      if (empty) empty.classList.toggle('hidden', list.length > 0);
      if (!list.length) {
        tbody.innerHTML = '';
        return;
      }
      tbody.innerHTML = list.map(m => `
        <tr class="border-b border-slate-100">
          <td class="py-2 pr-2 whitespace-nowrap font-medium">${formatDate(m.date)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.waist)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.chest)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.shoulders)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.leftArm)} / ${formatMeasure(m.rightArm)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.hips)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.leftThigh)} / ${formatMeasure(m.rightThigh)}</td>
          <td class="py-2 pr-2">${formatMeasure(m.leftCalf)} / ${formatMeasure(m.rightCalf)}</td>
          <td class="py-2 pr-2 whitespace-nowrap">
            <button onclick="loadMeasurementIntoForm('${m.id}')" class="text-xs text-indigo-600 hover:underline mr-2">Edit</button>
            <button onclick="deleteMeasurement('${m.id}')" class="text-xs text-red-500 hover:underline">Del</button>
          </td>
        </tr>
      `).join('');
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
      const dateEl = document.getElementById('meas-date');
      if (dateEl && !dateEl.value) dateEl.value = today();
      renderMeasuresHistory();
      renderMeasuresChart();
    }

    // ========== Technique review (Level 1 — guided cues) ==========
    function getFormLiftKey() {
      return document.getElementById('form-lift')?.value || 'squat';
    }
    function getFormLiftDef() {
      return TECHNIQUE_LIBRARY[getFormLiftKey()] || TECHNIQUE_LIBRARY.generic;
    }

    function onFormLiftChange() {
      renderFormCues();
      updateFormSummary();
    }

    function loadFormVideo(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        showToast('Please choose a video file', 'error');
        return;
      }
      if (formVideoUrl) URL.revokeObjectURL(formVideoUrl);
      formVideoUrl = URL.createObjectURL(file);
      const player = document.getElementById('form-video-player');
      const wrap = document.getElementById('form-video-wrap');
      if (player) {
        player.src = formVideoUrl;
        player.load();
      }
      if (wrap) wrap.classList.remove('hidden');
      showToast('Video ready for playback only — not analyzed', 'success');
    }

    function clearFormVideo() {
      const player = document.getElementById('form-video-player');
      const input = document.getElementById('form-video');
      const wrap = document.getElementById('form-video-wrap');
      if (player) {
        player.pause();
        player.removeAttribute('src');
        player.load();
      }
      if (formVideoUrl) {
        URL.revokeObjectURL(formVideoUrl);
        formVideoUrl = null;
      }
      if (input) input.value = '';
      if (wrap) wrap.classList.add('hidden');
    }

    function renderFormCues() {
      const def = getFormLiftDef();
      const tips = document.getElementById('form-film-tips');
      const host = document.getElementById('form-cues');
      if (tips) tips.innerHTML = (def.film || []).map(t => `<li>${t}</li>`).join('');
      if (!host) return;
      host.innerHTML = (def.cues || []).map((cue, i) => `
        <label class="form-cue-row">
          <input type="checkbox" class="form-cue-check" data-idx="${i}" onchange="updateFormSummary()" />
          <span>${cue}</span>
        </label>
      `).join('');
      updateFormSummary();
    }

    function updateFormSummary() {
      const def = getFormLiftDef();
      const checks = [...document.querySelectorAll('.form-cue-check')];
      const total = checks.length || (def.cues || []).length;
      const ok = checks.filter(c => c.checked).length;
      const missed = checks.filter(c => !c.checked).map(c => {
        const i = parseInt(c.getAttribute('data-idx'), 10);
        return def.cues[i];
      });
      const el = document.getElementById('form-summary');
      if (!el) return;
      if (!total) {
        el.textContent = '';
        return;
      }
      if (ok === total) {
        el.innerHTML = `<span class="text-emerald-600 font-medium">All ${total} cues checked</span> for ${def.label}. Nice — still film next week from the same angle.`;
      } else {
        el.innerHTML = `<b>${ok}/${total}</b> cues checked for ${def.label}.` +
          (missed.length ? `<br><span class="text-slate-500">Focus next time:</span> ${missed.slice(0, 3).map(m => `• ${m}`).join(' ')}` : '');
      }
    }

    function resetFormReview() {
      document.querySelectorAll('.form-cue-check').forEach(c => { c.checked = false; });
      const notes = document.getElementById('form-notes');
      if (notes) notes.value = '';
      updateFormSummary();
    }

    function saveFormReview() {
      const def = getFormLiftDef();
      const key = getFormLiftKey();
      const date = document.getElementById('form-date')?.value || today();
      const notes = (document.getElementById('form-notes')?.value || '').trim();
      const checks = [...document.querySelectorAll('.form-cue-check')];
      const checked = [];
      const missed = [];
      checks.forEach(c => {
        const i = parseInt(c.getAttribute('data-idx'), 10);
        const text = def.cues[i];
        if (c.checked) checked.push(text);
        else missed.push(text);
      });
      if (!checked.length && !missed.length && !notes) {
        return showToast('Check some cues or add a note first', 'error');
      }
      const entry = {
        id: Date.now() + Math.random(),
        date,
        liftKey: key,
        liftLabel: def.label,
        checked,
        missed,
        notes,
        score: checked.length + '/' + (checked.length + missed.length)
      };
      data.formReviews = data.formReviews || [];
      data.formReviews.push(entry);
      data.formReviews.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);
      renderFormHistory();
      showToast('Checklist saved (not an AI video breakdown)', 'success');
    }

    function deleteFormReview(id) {
      if (!confirm('Delete this technique review?')) return;
      data.formReviews = (data.formReviews || []).filter(r => String(r.id) !== String(id));
      saveData(data);
      renderFormHistory();
      showToast('Review deleted', 'info');
    }

    function renderFormHistory() {
      const host = document.getElementById('form-history');
      const empty = document.getElementById('form-history-empty');
      if (!host) return;
      const list = data.formReviews || [];
      if (empty) empty.classList.toggle('hidden', list.length > 0);
      if (!list.length) {
        host.innerHTML = '';
        return;
      }
      host.innerHTML = list.map(r => `
        <div class="border border-slate-200 rounded-lg p-3">
          <div class="flex justify-between gap-2 items-start">
            <div>
              <div class="font-medium">${formatDate(r.date)} · ${r.liftLabel}</div>
              <div class="text-xs text-slate-500">Cues checked: ${r.score}${r.missed?.length ? ' · Focus: ' + r.missed.slice(0, 2).join('; ') : ''}</div>
              ${r.notes ? `<div class="text-xs mt-1">${r.notes}</div>` : ''}
            </div>
            <button onclick="deleteFormReview('${r.id}')" class="btn-danger text-xs">Del</button>
          </div>
        </div>
      `).join('');
    }

    function renderFormReview() {
      const dateEl = document.getElementById('form-date');
      if (dateEl && !dateEl.value) dateEl.value = today();
      renderFormCues();
      renderFormHistory();
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

    // Rest timer
    let restInterval = null;
    function setRestLabels(text) {
      const el = document.getElementById('rest-timer');
      const sticky = document.getElementById('rest-timer-sticky');
      if (el) el.textContent = text;
      if (sticky) sticky.textContent = text;
    }
    function startRest(seconds) {
      stopRest();
      let left = seconds;
      setRestLabels(left + 's');
      restInterval = setInterval(() => {
        left--;
        setRestLabels(left + 's');
        if (left <= 0) {
          stopRest();
          setRestLabels('Done!');
          showToast('Rest done', 'success');
          try { navigator.vibrate && navigator.vibrate(200); } catch (e) {}
        }
      }, 1000);
    }
    function stopRest() {
      if (restInterval) clearInterval(restInterval);
      restInterval = null;
      const el = document.getElementById('rest-timer');
      if (el && el.textContent !== 'Done!') setRestLabels('—');
      else if (!el) setRestLabels('—');
    }

    // Import / Export helpers
    function importData() {
      document.getElementById('import-file').click();
    }
    function handleImport(ev) {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed.workouts && !parsed.nutrition) throw new Error('Invalid file');
          if (!confirm('This will replace your current data. Continue?')) return;
          data = { ...DEFAULT_DATA, ...parsed };
          persistNow(data);
          applyDark();
          updateUnitToggle();
          showTab('dashboard');
          showToast('Import successful', 'success');
        } catch (e) {
          alert('Import failed: ' + e.message);
        }
        ev.target.value = '';
      };
      reader.readAsText(file);
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
      const exercise = document.getElementById('progress-exercise')?.value;
      const canvas = document.getElementById('progressChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (progressChart) progressChart.destroy();

      if (!exercise) {
        progressChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {
            plugins: chartPluginOptions(false),
            scales: chartScaleOptions(unitLabel(), true)
          }
        });
        return;
      }

      // Collect best estimated 1RM per day for this exercise
      const byDate = {};
      data.workouts.forEach(w => {
        w.exercises.filter(e => e.name === exercise && e.type !== 'cardio').forEach(ex => {
          if (!ex.sets || !ex.sets.length) return;
          const best = Math.max(...ex.sets.map(s => estimated1RM(s.weight, s.reps)));
          if (!byDate[w.date] || best > byDate[w.date]) byDate[w.date] = best;
        });
      });

      const dates = Object.keys(byDate).sort();
      const values = dates.map(d => toDisplay(byDate[d]));
      const dark = !!data.dark;

      progressChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.map(d => formatDate(d)),
          datasets: [{
            label: 'Est. 1RM (' + unitLabel() + ')',
            data: values,
            borderColor: dark ? '#a5b4fc' : '#4f46e5',
            backgroundColor: dark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: dark ? '#c7d2fe' : '#4f46e5'
          }]
        },
        options: {
          responsive: true,
          plugins: chartPluginOptions(false),
          scales: chartScaleOptions(unitLabel(), false)
        }
      });
    }

    function renderNutritionChart() {
      const canvas = document.getElementById('nutritionChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (nutritionChart) nutritionChart.destroy();

      const sorted = [...data.nutrition].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
      const labels = sorted.map(n => formatDate(n.date));
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
        items.push({ date: n.date, text: `Nutrition: P${n.protein} / C${n.carbs} / F${n.fat}`, type: 'nu' });
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
          <span class="text-slate-700">${i.text}</span>
        </div>
      `).join('');
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
      a.download = `fitness-tracker-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      data.lastExportDate = today();
      data.backupBannerDismissed = null;
      saveData(data);
      updateBackupBanner();
      showToast('JSON backup downloaded (photos excluded — use Photos tab to export them)', 'success');
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
      data.progressPhotos = (data.progressPhotos || []).filter(p => p.id !== id);
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
          <img src="${p.dataUrl}" alt="${p.tag} ${p.date}" onclick="viewPhotoFull('${p.id}')" />
          <div class="photo-meta flex justify-between items-start gap-1">
            <div>
              <div class="font-medium text-slate-700">${formatDate(p.date)} · ${p.tag}</div>
              ${p.note ? `<div>${p.note}</div>` : ''}
            </div>
            <button onclick="deletePhoto(${p.id})" class="btn-danger text-xs">✕</button>
          </div>
        </div>
      `).join('');
      const opts = list.map(p =>
        `<option value="${p.id}">${p.date} · ${p.tag}${p.note ? ' · ' + p.note : ''}</option>`
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
      if (vA) vA.innerHTML = pA ? `<img src="${pA.dataUrl}" alt="compare A" />` : '';
      if (vB) vB.innerHTML = pB ? `<img src="${pB.dataUrl}" alt="compare B" />` : '';
    }

    function viewPhotoFull(id) {
      const p = (data.progressPhotos || []).find(x => String(x.id) === String(id));
      if (!p) return;
      const w = window.open('');
      if (w) {
        w.document.write(`<title>${p.date} ${p.tag}</title><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh"><img src="${p.dataUrl}" style="max-width:100%;max-height:100vh" /></body>`);
      }
    }

    function exportPhotosBackup() {
      const list = data.progressPhotos || [];
      if (!list.length) return showToast('No photos to export', 'error');
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-photos-${today()}.json`;
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
      const woHeaders = ['date', 'workout_id', 'exercise', 'type', 'set_index', 'reps', 'weight_kg', 'rpe', 'duration_min', 'distance', 'distance_unit', 'avg_hr', 'notes'];
      const woRows = [woHeaders.join(',')];
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio') {
            woRows.push([
              w.date, w.id, csvEscape(ex.name), 'cardio', '', '', '', '',
              ex.duration || '', ex.distance || '', ex.distanceUnit || '', ex.avgHr || '', csvEscape(w.notes || '')
            ].join(','));
          } else {
            (ex.sets || []).forEach((s, i) => {
              woRows.push([
                w.date, w.id, csvEscape(ex.name), 'strength', i + 1, s.reps, s.weight, s.rpe || '',
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

    function startProgramDay(dayIndex) {
      const prog = getActiveProgram();
      if (!prog || !prog.days || !prog.days[dayIndex]) {
        return alert('Program day not found. Activate a program first.');
      }
      const day = prog.days[dayIndex];
      const exercises = (day.exercises || []).map(parseProgramExerciseLine).filter(Boolean);
      if (!exercises.length) return alert('No exercises on this day.');
      showTab('workouts');
      fillWorkoutForm(exercises, 'From program: ' + day.day);
      alert('Loaded "' + day.day + '". Fill in weights / cardio details, then Save.');
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
      data.programs = data.programs || [];
      data.programs.push(newProg);
      data.activeProgramId = newProg.id;
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
          const best = Math.max(...ex.sets.map(s => estimated1RM(s.weight, s.reps)));
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

      // Protein + sodium micro if present
      const nu7 = data.nutrition.filter(n => n.date >= d7Str);
      if (nu7.length) {
        const avgP = Math.round(nu7.reduce((s, n) => s + n.protein, 0) / nu7.length);
        const avgNa = Math.round(nu7.reduce((s, n) => s + (n.sodium || 0), 0) / nu7.length);
        if (avgP < 120) tips.push(`Average protein is ${avgP}g/day. Most lifters benefit from 1.6–2.2g per kg of bodyweight.`);
        else if (avgP >= 150) tips.push(`Solid protein intake (avg ${avgP}g). This supports recovery and muscle growth.`);
        if (avgNa > 3500) tips.push(`Average sodium is high (~${avgNa}mg/day on logged days). Useful around hard training, but worth watching if blood pressure is a concern.`);
      } else {
        tips.push('No recent nutrition logs. Tracking protein for even a few days can reveal easy wins.');
      }

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
        const nu7 = (data.nutrition || []).filter(n => {
          const d7 = new Date(); d7.setDate(d7.getDate() - 7);
          return n.date >= d7.toISOString().slice(0, 10);
        });
        let extra = '';
        if (nu7.length) {
          const avg = Math.round(nu7.reduce((s, n) => s + n.protein, 0) / nu7.length);
          extra = ` Your recent 7-day average is <b>${avg}g/day</b>.`;
        }
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
      const enabled = !!(data.api && data.api.enabled && key);
      const status = document.getElementById('api-status');
      const hint = document.getElementById('chat-mode-hint');
      if (status) {
        status.textContent = enabled
          ? `API ready · ${(data.api.model || 'model')}`
          : (key ? 'Key saved — enable “Use API for chat”' : 'Offline rule-based coach');
        status.className = 'text-xs ' + (enabled ? 'text-emerald-600 font-medium' : 'text-slate-500');
      }
      if (hint) {
        hint.textContent = enabled
          ? 'Using your API key — answers can use your recent training data.'
          : 'Using built-in coach (no API). Add a key above for full AI.';
      }
      // Populate form fields
      const api = data.api || {};
      const prov = document.getElementById('api-provider');
      const base = document.getElementById('api-base');
      const model = document.getElementById('api-model');
      const en = document.getElementById('api-enabled');
      const keyEl = document.getElementById('api-key');
      if (prov && api.provider) prov.value = api.provider;
      if (base) base.value = api.baseUrl || 'https://api.x.ai/v1';
      if (model) model.value = api.model || 'grok-2-latest';
      if (en) en.checked = !!api.enabled;
      if (keyEl && key && keyEl.value !== '••••••••') keyEl.placeholder = 'Key saved on this device (enter new to replace)';
    }

    function buildCoachSystemPrompt() {
      const unit = unitLabel();
      const recentWo = (data.workouts || []).slice(0, 8);
      const woLines = recentWo.map(w => {
        const parts = (w.exercises || []).map(ex => {
          if (ex.type === 'cardio') return `${ex.name} ${ex.duration || 0}min`;
          const sets = (ex.sets || []).map(s => `${s.reps}x${toDisplay(s.weight)}${unit}`).join(', ');
          return `${ex.name}: ${sets}`;
        }).join('; ');
        return `${w.date}: ${parts}`;
      }).join('\n') || 'No workouts logged yet.';
      const nu7 = (data.nutrition || []).slice(0, 7);
      const avgP = nu7.length ? Math.round(nu7.reduce((s, n) => s + (n.protein || 0), 0) / nu7.length) : null;
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
- Recent avg protein (logged days): ${avgP != null ? avgP + 'g' : 'n/a'}
- Top PRs: ${prs}
- Deload signal: ${dl ? dl.level + ' — ' + dl.summary : 'n/a'}
- Active program: ${active ? active.name : 'none'}
- Goals: ${(data.goals || []).filter(g => !g.completed).map(g => g.type + (g.exercise ? ' ' + g.exercise : '')).join(', ') || 'none'}
- Progress photos on device: ${(data.progressPhotos || []).length}
- Last photo date: ${((data.progressPhotos || []).slice().sort((a,b)=>b.date.localeCompare(a.date))[0] || {}).date || 'none'}`;
    }

    async function callCoachAPI(userMessage) {
      const key = getStoredApiKey();
      const api = data.api || {};
      if (!key) throw new Error('No API key saved');
      if (!api.baseUrl) throw new Error('No API base URL');
      const url = api.baseUrl.replace(/\/$/, '') + '/chat/completions';
      const messages = [
        { role: 'system', content: buildCoachSystemPrompt() },
        ...chatHistory.slice(-12),
        { role: 'user', content: userMessage }
      ];
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: api.model || 'grok-2-latest',
          messages,
          temperature: 0.6
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let msg = 'API error ' + res.status;
        try {
          const j = JSON.parse(errText);
          msg = j.error?.message || j.message || msg;
        } catch { if (errText) msg += ': ' + errText.slice(0, 180); }
        throw new Error(msg);
      }
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from API');
      return content;
    }

    async function testApiConnection() {
      saveApiSettings();
      if (!getStoredApiKey()) return showToast('Save an API key first', 'error');
      showToast('Testing API…', 'info');
      try {
        const reply = await callCoachAPI('Reply with exactly: OK connected');
        showToast('API connected', 'success');
        appendChatMessage('<i>Connection test:</i> ' + escapeChat(reply), false);
      } catch (e) {
        showToast('API test failed: ' + e.message, 'error');
      }
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
      const useApi = !!(data.api && data.api.enabled && getStoredApiKey());
      const btn = document.getElementById('chat-send-btn');
      if (btn) { btn.disabled = true; btn.textContent = useApi ? '…' : 'Send'; }

      try {
        if (useApi) {
          const reply = await callCoachAPI(text);
          chatHistory.push({ role: 'user', content: text });
          chatHistory.push({ role: 'assistant', content: reply });
          if (chatHistory.length > 24) chatHistory = chatHistory.slice(-24);
          appendChatMessage(escapeChat(reply), false);
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

    function renderCoach() {
      // Advice
      const adviceEl = document.getElementById('coach-advice');
      const tips = getCoachAdvice();
      adviceEl.innerHTML = tips.map(t => `<p>• ${t}</p>`).join('');
      refreshDeloadHelper();
      updateApiStatusUI();

      // Goals list
      const goalsEl = document.getElementById('goals-list');
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

    // ========== Templates & Repeat Last ==========
    function fillWorkoutForm(exercises, notes) {
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
            sets: (ex.sets || []).map(s => ({ reps: s.reps, weight: s.weight, rpe: s.rpe }))
          });
        }
      });
      if (!(exercises || []).length) addExerciseRow();
    }

    function repeatLastWorkout() {
      if (!data.workouts.length) return alert('No previous workouts found.');
      const last = data.workouts[0]; // already sorted newest first
      fillWorkoutForm(last.exercises, last.notes ? 'Repeat of ' + formatDate(last.date) : '');
      alert('Loaded last workout. Adjust weights/reps as needed, then Save.');
    }

    function saveCurrentAsTemplate() {
      const exercises = [];
      document.querySelectorAll('#exercise-rows > div').forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        if (!name) return;
        if (row.dataset.type === 'cardio') {
          const duration = parseFloat(row.querySelector('.cardio-duration')?.value) || 0;
          const distance = parseFloat(row.querySelector('.cardio-distance')?.value) || 0;
          const distanceUnit = row.querySelector('.cardio-distance-unit')?.value || 'km';
          const avgHr = parseFloat(row.querySelector('.cardio-hr')?.value);
          exercises.push({
            name, type: 'cardio', duration, distance, distanceUnit,
            avgHr: !isNaN(avgHr) && avgHr > 0 ? avgHr : undefined,
            sets: []
          });
          return;
        }
        const sets = [];
        row.querySelectorAll('.sets-container > div').forEach(s => {
          const reps = parseFloat(s.querySelector('.set-reps').value) || 0;
          const weightRaw = parseFloat(s.querySelector('.set-weight').value);
          const weight = isNaN(weightRaw) ? 0 : toStorage(weightRaw);
          if (reps > 0) sets.push({ reps, weight });
        });
        if (sets.length) exercises.push({ name, type: 'strength', sets });
      });
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
      const t = (data.templates || []).find(x => x.id === parseInt(id));
      if (!t) return;
      fillWorkoutForm(t.exercises, '');
      document.getElementById('template-select').value = '';
      alert('Template loaded. Adjust and Save when ready.');
    }

    function deleteTemplate(id) {
      if (!confirm('Delete this template?')) return;
      data.templates = (data.templates || []).filter(t => t.id !== id);
      saveData(data);
      renderTemplates();
    }

    function saveWorkoutAsTemplate(workoutId) {
      const w = data.workouts.find(x => x.id === workoutId);
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
          templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      }
      if (!listEl) return;
      if (!templates.length) {
        listEl.innerHTML = '<p class="text-slate-500">No templates yet. Save one from the form or from history.</p>';
        return;
      }
      listEl.innerHTML = templates.slice().reverse().map(t => `
        <div class="border border-slate-200 rounded-lg p-2 flex justify-between items-center">
          <div>
            <span class="font-medium">${t.name}</span>
            <span class="text-slate-500 text-xs ml-2">${t.exercises.length} exercises · ${formatDate(t.created)}</span>
          </div>
          <div class="flex gap-2">
            <button onclick="loadTemplate(${t.id})" class="text-xs text-indigo-600 hover:underline">Load</button>
            <button onclick="deleteTemplate(${t.id})" class="btn-danger text-xs">Delete</button>
          </div>
        </div>
      `).join('');
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
      // Rebuild PRs from all strength work
      (data.workouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
          if (ex.type === 'cardio' || !ex.sets) return;
          ex.sets.forEach(set => {
            const est = estimated1RM(set.weight, set.reps);
            const existing = data.prs.find(p => p.exercise === ex.name);
            if (!existing || est > existing.estimated1RM) {
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
        data = await loadDataAsync();
      } catch (e) {
        console.warn(e);
        data = loadFromLocalStorage() || { ...DEFAULT_DATA };
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
      const formDateEl = document.getElementById('form-date');
      if (formDateEl) formDateEl.value = today();
      seedIfEmpty();
      // Persist after seed / library ensure
      persistNow(data);
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
