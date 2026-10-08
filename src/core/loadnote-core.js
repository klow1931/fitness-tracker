/* Loadnote Core v0.2 — non-UI, deterministic application primitives. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 32;
  const RELEASE_VERSION = '3.20.0';

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
    'bodyweight', 'foodLibrary', 'restDays', 'progressPhotos', 'measurements', 'formReviews',
    'exerciseCatalog', 'workoutRevisions', 'recoverySnapshots', 'exerciseRoles', 'decisionEvents', 'adoptedPrograms'
  ];

  function normalizeState(input, defaults) {
    const base = { ...(defaults || {}), ...(input || {}) };
    DEFAULT_COLLECTIONS.forEach((key) => {
      if (!Array.isArray(base[key])) base[key] = [];
    });
    if (!base.exerciseNotes || typeof base.exerciseNotes !== 'object') base.exerciseNotes = {};
    if (!base.api || typeof base.api !== 'object') base.api = { enabled: false, backendEnabled: false };
    base.api = { enabled: false, backendEnabled: false, ...base.api };
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

    if (version < 2) {
      DEFAULT_COLLECTIONS.forEach((key) => {
        state[key] = ensureIds(state[key]);
      });
      state.schemaVersion = 2;
    }

    if (Number(state.schemaVersion || 1) < 3) {
      state.trainingIntelligenceVersion = 1;
      state.schemaVersion = 3;
    } else if (!state.trainingIntelligenceVersion) {
      state.trainingIntelligenceVersion = 1;
    }

    if (Number(state.schemaVersion || 1) < 4) {
      state.adaptiveProgrammingVersion = 1;
      state.schemaVersion = 4;
    } else if (!state.adaptiveProgrammingVersion) {
      state.adaptiveProgrammingVersion = 1;
    }

    if (Number(state.schemaVersion || 1) < 5) {
      state.coachVersion = 2;
      state.api = { enabled: false, backendEnabled: false, ...(state.api || {}) };
      state.schemaVersion = 5;
    } else {
      state.coachVersion = state.coachVersion || 2;
    }

    if (Number(state.schemaVersion || 1) < 6) {
      state.adaptiveProgrammingVersion = 2;
      state.schemaVersion = 6;
    } else {
      state.adaptiveProgrammingVersion = state.adaptiveProgrammingVersion || 2;
    }

    if (Number(state.schemaVersion || 1) < 7) {
      state.athleteProfileVersion = 1;
      state.athleteProfile = state.athleteProfile || null;
      state.schemaVersion = 7;
    } else {
      state.athleteProfileVersion = state.athleteProfileVersion || 1;
    }

    if (Number(state.schemaVersion || 1) < 8) {
      state.mesocycleVersion = 1;
      state.programStates = state.programStates || {};
      state.schemaVersion = 8;
    } else {
      state.mesocycleVersion = state.mesocycleVersion || 1;
      state.programStates = state.programStates || {};
    }

    if (Number(state.schemaVersion || 1) < 9) {
      state.fatigueEngineVersion = 1;
      state.schemaVersion = 9;
    } else {
      state.fatigueEngineVersion = state.fatigueEngineVersion || 1;
    }

    if (Number(state.schemaVersion || 1) < 10) {
      state.releaseVersion = '1.0.0';
      state.productVersion = 1;
      state.schemaVersion = 10;
    } else {
      state.releaseVersion = state.releaseVersion || '1.0.0';
      state.productVersion = state.productVersion || 1;
    }

    if (Number(state.schemaVersion || 1) >= 3) {
      DEFAULT_COLLECTIONS.forEach((key) => {
        state[key] = ensureIds(state[key]);
      });
    }

    if(state.trainingBlocks === undefined)state.trainingBlocks=[];
    if(Number(state.schemaVersion||1)<11)state.schemaVersion=11;
    if(Number(state.schemaVersion||1)<12){
      if(!Array.isArray(state.exerciseCatalog))state.exerciseCatalog=[];
      if(!Array.isArray(state.workoutRevisions))state.workoutRevisions=[];
      if(!Array.isArray(state.recoverySnapshots))state.recoverySnapshots=[];
      state.integrityVersion=1;state.schemaVersion=12;
    }else state.integrityVersion=state.integrityVersion||1;
    if(Number(state.schemaVersion||1)<13){
      if(!Array.isArray(state.exerciseRoles))state.exerciseRoles=[];
      state.readinessVersion=1;state.schemaVersion=13;
    }else state.readinessVersion=state.readinessVersion||1;
    if(Number(state.schemaVersion||1)<14){
      state.prescriptionVersion=1;state.schemaVersion=14;
    }else state.prescriptionVersion=state.prescriptionVersion||1;
    state.releaseVersion=RELEASE_VERSION;
    state.productVersion=17;
    if(state.scheduledSessions===undefined)state.scheduledSessions=[];
    if(Number(state.schemaVersion||1)<15)state.schemaVersion=15;
    if(Number(state.schemaVersion||1)<16){
      if(!Array.isArray(state.decisionEvents))state.decisionEvents=[];
      state.decisionFeedbackVersion=1;state.schemaVersion=16;
    }else{
      if(!Array.isArray(state.decisionEvents))state.decisionEvents=[];
      state.decisionFeedbackVersion=state.decisionFeedbackVersion||1;
    }
    if(state.athleteGoals===undefined)state.athleteGoals=[];
    if(Number(state.schemaVersion||1)<17)state.schemaVersion=17;
    if(state.reviewedPrograms===undefined)state.reviewedPrograms=[];
    if(Number(state.schemaVersion||1)<18)state.schemaVersion=18;
    if(state.programReviews===undefined)state.programReviews=[];
    if(Number(state.schemaVersion||1)<19)state.schemaVersion=19;
    if(state.programmingProfiles===undefined)state.programmingProfiles=[];
    if(Number(state.schemaVersion||1)<20)state.schemaVersion=20;
    if(state.phasePrograms===undefined)state.phasePrograms=[];
    if(Number(state.schemaVersion||1)<21)state.schemaVersion=21;
    if(state.phaseReviews===undefined)state.phaseReviews=[];
    if(Number(state.schemaVersion||1)<22)state.schemaVersion=22;
    if(state.meetCycles===undefined)state.meetCycles=[];
    if(Number(state.schemaVersion||1)<23)state.schemaVersion=23;
    if(state.adoptedPrograms===undefined)state.adoptedPrograms=[];
    if(Number(state.schemaVersion||1)<24)state.schemaVersion=24;
    if(state.transitionSnapshots===undefined)state.transitionSnapshots=[];
    if(Number(state.schemaVersion||1)<25)state.schemaVersion=25;
    if(state.workloadProfiles===undefined)state.workloadProfiles=[];
    if(Number(state.schemaVersion||1)<26)state.schemaVersion=26;
    if(state.olympicPractice===undefined)state.olympicPractice=[];
    if(Number(state.schemaVersion||1)<27)state.schemaVersion=27;
    if(state.hypertrophyPrograms===undefined)state.hypertrophyPrograms=[];
    if(Number(state.schemaVersion||1)<28)state.schemaVersion=28;
    if(state.sportPrograms===undefined)state.sportPrograms=[];
    if(state.athleticPractice===undefined)state.athleticPractice=[];
    if(Number(state.schemaVersion||1)<29)state.schemaVersion=29;
    if(state.coachingReviews===undefined)state.coachingReviews=[];
    if(Number(state.schemaVersion||1)<30)state.schemaVersion=30;
    if(state.programCancellations===undefined)state.programCancellations=[];
    if(Number(state.schemaVersion||1)<31)state.schemaVersion=31;
    // Schema 32 adds optional, explicit intake inside programming-profile revisions.
    // Legacy contexts remain intact: missing intake stays unknown.
    if(Number(state.schemaVersion||1)<32)state.schemaVersion=32;
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
    let result = r <= 1 ? w : w * (1 + r / 30);
    const effort = Number(rpe);
    if (effort >= 6 && effort <= 10 && r > 1) {
      const rir = Math.max(0, 10 - effort);
      result = w * (1 + (r + rir) / 30);
    }
    return round(result, 1);
  }

  function capacityEvidence(weight, reps, rpe) {
    const w=Number(weight),r=Number(reps),effort=Number(rpe);
    let reason=null;
    if(!Number.isFinite(w)||w<=0||!Number.isInteger(r)||r<1)reason='invalid-set';
    else if(r>12)reason='high-reps';
    else if(rpe==null||rpe==='')reason='missing-rpe';
    else if(!Number.isFinite(effort)||effort<1||effort>10)reason='invalid-rpe';
    else if(effort<6)reason='low-rpe';
    else if(r===1&&effort<10)reason='submax-single';
    return {version:2,estimate:reason?null:estimated1RM(w,r,effort),reason};
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
    const identities=new Set();
    (workouts || []).forEach(w=>(w.exercises||[]).forEach(ex=>{if(String(ex.name||'').trim().toLowerCase()===target&&ex.exerciseId)identities.add(ex.exerciseId);}));
    const rows = [];
    (workouts || []).forEach((w) => (w.exercises || []).forEach((ex) => {
      if ((String(ex.name || '').trim().toLowerCase() !== target && !(ex.exerciseId&&identities.has(ex.exerciseId))) || ex.type === 'cardio') return;
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
    RELEASE_VERSION,
    createId,
    round,
    clone,
    normalizeState,
    migrateState,
    setSchemaVersion,
    estimated1RM,
    capacityEvidence,
    volumeForExercise,
    calcVolume,
    strengthSets,
    averageRPE,
    exerciseHistory,
    weeklySummary
  };
});
