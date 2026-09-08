/* Retired UI, not loaded by the app. */
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

