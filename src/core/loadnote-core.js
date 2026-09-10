/* Loadnote Core v0.2 — non-UI, deterministic application primitives. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 11;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'ln_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  const DEFAULT_COLLECTIONS = [
    'workouts', 'nutrition', 'prs', 'goals', 'programs', 'templates',
    'bodyweight', 'foodLibrary', 'restDays', 'progressPhotos', 'measurements', 'formReviews'
  ];

  function normalizeState(input, defaults) {
    const base = { ...(defaults || {}), ...(input || {}) };
    DEFAULT_COLLECTIONS.forEach((key) => {
      if (!Array.isArray(base[key])) base[key] = [];
    });
    if (!base.exerciseNotes || typeof base.exerciseNotes !== 'object') base.exerciseNotes = {};
    if (!base.api || typeof base.api !== 'object') base.api = { enabled: false, backendEnabled: false, backendUrl: '/api/coach', provider: 'xai', baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest' };
    base.api = { enabled: false, backendEnabled: false, backendUrl: '/api/coach', provider: 'xai', baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest', ...base.api };
    if (base.unit !== 'kg' && base.unit !== 'lb') base.unit = 'kg';
    if (base.measureUnit !== 'cm' && base.measureUnit !== 'in') base.measureUnit = 'cm';
    return migrateState(base);
  }

  function ensureIds(items) {
    return (items || []).map((item) => ({ ...item, id: item.id == null ? createId() : item.id }));
  }

  function migrateState(input) {
    const state = clone(input) || {};
    const version = Number(state.schemaVersion || 1);

    // v1 → v2: preserve all data while assigning stable IDs to records that lack them.
    if (version < 2) {
      DEFAULT_COLLECTIONS.forEach((key) => {
        state[key] = ensureIds(state[key]);
      });
      state.schemaVersion = 2;
    }

    // v2 → v3: add an explicit training-intelligence version marker.
    if (Number(state.schemaVersion || 1) < 3) {
      state.trainingIntelligenceVersion = 1;
      state.schemaVersion = 3;
    } else if (!state.trainingIntelligenceVersion) {
      state.trainingIntelligenceVersion = 1;
    }

    // v3 → v4: add adaptive-programming state without changing existing workouts.
    if (Number(state.schemaVersion || 1) < 4) {
      state.adaptiveProgrammingVersion = 1;
      state.schemaVersion = 4;
    } else if (!state.adaptiveProgrammingVersion) {
      state.adaptiveProgrammingVersion = 1;
    }

    // v4 → v5: add coach architecture settings without changing user training data.
    if (Number(state.schemaVersion || 1) < 5) {
      state.coachVersion = 2;
      state.api = { enabled: false, backendEnabled: false, backendUrl: '/api/coach', provider: 'xai', baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest', ...(state.api || {}) };
      state.schemaVersion = 5;
    } else {
      state.coachVersion = state.coachVersion || 2;
    }

    // v5 → v6: add adaptive-program session state without changing workout history.
    if (Number(state.schemaVersion || 1) < 6) {
      state.adaptiveProgrammingVersion = 2;
      state.schemaVersion = 6;
    } else {
      state.adaptiveProgrammingVersion = state.adaptiveProgrammingVersion || 2;
    }

    // v6 → v7: add an athlete profile for personalized programming without changing workout history.
    if (Number(state.schemaVersion || 1) < 7) {
      state.athleteProfileVersion = 1;
      state.athleteProfile = state.athleteProfile || null;
      state.schemaVersion = 7;
    } else {
      state.athleteProfileVersion = state.athleteProfileVersion || 1;
    }

    // v7 → v8: add persistent adaptive mesocycle state without changing workout history.
    if (Number(state.schemaVersion || 1) < 8) {
      state.mesocycleVersion = 1;
      state.programStates = state.programStates || {};
      state.schemaVersion = 8;
    } else {
      state.mesocycleVersion = state.mesocycleVersion || 1;
      state.programStates = state.programStates || {};
    }

    // v8 → v9: add performance/fatigue engine metadata without changing workout history.
    if (Number(state.schemaVersion || 1) < 9) {
      state.fatigueEngineVersion = 1;
      state.schemaVersion = 9;
    } else {
      state.fatigueEngineVersion = state.fatigueEngineVersion || 1;
    }

    // v9 → v10: release metadata and athlete-command-center state.
    if (Number(state.schemaVersion || 1) < 10) {
      state.releaseVersion = '1.0.0';
      state.productVersion = 1;
      state.schemaVersion = 10;
    } else {
      state.releaseVersion = state.releaseVersion || '1.0.0';
      state.productVersion = state.productVersion || 1;
    }

    if (Number(state.schemaVersion || 1) >= 3) {
      // Also repair malformed/missing IDs defensively on every load.
      DEFAULT_COLLECTIONS.forEach((key) => {
        state[key] = ensureIds(state[key]);
      });
    }

    // Blocks are independent of workouts. Preserve existing block records verbatim;
    // strict validation happens on import and block mutations, never by dropping data.
    if(state.trainingBlocks === undefined)state.trainingBlocks=[];
    if(Number(state.schemaVersion||1)<11)state.schemaVersion=11;
    return state;
  }

  function setSchemaVersion(state) {
    return { ...(state || {}), schemaVersion: SCHEMA_VERSION };
  }

  function round(value, decimals) {
    const p = 10 ** decimals;
    return Math.round((Number(value) || 0) * p) / p;
  }

  function estimated1RM(weight, reps, rpe) {
    const w = Number(weight) || 0;
    const r = Number(reps) || 0;
    if (w <= 0 || r <= 0) return 0;
    let result = r <= 1 ? w : w * (1 + r / 30); // Epley baseline.
    // Conservative RPE adjustment. RPE is optional and never overrides the raw set.
    const effort = Number(rpe);
    if (effort >= 6 && effort <= 10 && r > 1) {
      const rir = Math.max(0, 10 - effort);
      result = w * (1 + (r + rir) / 30);
    }
    return round(result, 1);
  }

  function volumeForExercise(exercise) {
    if (!exercise || exercise.type === 'cardio') return 0;
    return (exercise.sets || []).reduce((sum, set) => {
      const reps = Number(set.reps) || 0;
      const weight = Number(set.weight) || 0;
      return sum + (reps > 0 ? reps * weight : 0);
    }, 0);
  }

  function calcVolume(workout) {
    return (workout?.exercises || []).reduce((sum, ex) => sum + volumeForExercise(ex), 0);
  }

  function strengthSets(workout) {
    const out = [];
    (workout?.exercises || []).forEach((ex) => {
      if (ex.type === 'cardio') return;
      (ex.sets || []).forEach((set) => {
        if ((Number(set.reps) || 0) > 0) out.push({ exercise: ex.name, ...set });
      });
    });
    return out;
  }

  function averageRPE(workouts) {
    const values = [];
    (workouts || []).forEach((w) => (w.exercises || []).forEach((ex) => (ex.sets || []).forEach((s) => {
      const rpe = Number(s.rpe);
      if (rpe >= 1 && rpe <= 10) values.push(rpe);
    })));
    return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length, 1) : null;
  }

  function exerciseHistory(workouts, exerciseName) {
    const target = String(exerciseName || '').trim().toLowerCase();
    if (!target) return [];
    const rows = [];
    (workouts || []).forEach((w) => (w.exercises || []).forEach((ex) => {
      if (String(ex.name || '').trim().toLowerCase() !== target || ex.type === 'cardio') return;
      (ex.sets || []).forEach((set) => {
        if ((Number(set.reps) || 0) > 0) {
          rows.push({ date: w.date, weight: Number(set.weight) || 0, reps: Number(set.reps) || 0, rpe: Number(set.rpe) || null, estimated1RM: estimated1RM(set.weight, set.reps, set.rpe) });
        }
      });
    }));
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function weeklySummary(workouts, startDate, endDate) {
    const filtered = (workouts || []).filter((w) => (!startDate || w.date >= startDate) && (!endDate || w.date <= endDate));
    const sets = filtered.flatMap(strengthSets);
    return {
      workoutCount: filtered.length,
      volume: filtered.reduce((sum, w) => sum + calcVolume(w), 0),
      strengthSetCount: sets.length,
      averageRPE: averageRPE(filtered),
      cardioMinutes: filtered.reduce((sum, w) => sum + (w.exercises || []).filter(e => e.type === 'cardio').reduce((s, e) => s + (Number(e.duration) || 0), 0), 0)
    };
  }

  return {
    SCHEMA_VERSION,
    createId,
    round,
    clone,
    normalizeState,
    migrateState,
    setSchemaVersion,
    estimated1RM,
    volumeForExercise,
    calcVolume,
    strengthSets,
    averageRPE,
    exerciseHistory,
    weeklySummary
  };
});
