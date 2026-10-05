// ========== Data Layer (IndexedDB + localStorage migration) ==========
    const STORAGE_KEY = 'fitness-tracker-v1';
    const IDB_NAME = 'fitness-tracker-db';
    const IDB_VERSION = 10;
    const IDB_STORE = 'app';
    const IDB_KEY = 'state';

    const DEFAULT_DATA = {
      schemaVersion: 31, programCancellations: [], coachingReviews: [], sportPrograms: [], athleticPractice: [], hypertrophyPrograms: [], olympicPractice: [], workloadProfiles: [], transitionSnapshots: [], adoptedPrograms: [], meetCycles: [], phaseReviews: [], phasePrograms: [], programmingProfiles: [], programReviews: [], reviewedPrograms: [], athleteGoals: [], scheduledSessions: [], trainingBlocks: [], integrityVersion: 1, readinessVersion: 1, prescriptionVersion: 1,
      exerciseCatalog: [], workoutRevisions: [], recoverySnapshots: [], exerciseRoles: [],
      athleteProfileVersion: 1, athleteProfile: null,
      workouts: [], nutrition: [], prs: [], goals: [], programs: [],
      activeProgramId: null, templates: [], bodyweight: [], foodLibrary: [],
      restDays: [], exerciseNotes: {}, unit: 'kg', measureUnit: 'cm', dark: false, gymMode: false, checklistMode: true,
      gymModeUserSet: false, onboardingDismissed: false,
      lastExportDate: null, backupBannerDismissed: null,
      progressPhotos: [], measurements: [], formReviews: [],
      api: { enabled: false, backendEnabled: false }
    };

    let data = { ...DEFAULT_DATA };
    let idb = null;
    let idbReady = null;
    let saveTimer = null;
    let storageBackend = 'memory';

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
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
        tx.onerror = () => reject(tx.error || new Error('Storage transaction failed'));
        req.onerror = () => reject(req.error);
      }));
    }

    const DEVICE_RECORD_PREFIX = 'loadnote-device-v1:';
    function idbRecordGet(key) {
      return openIDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(DEVICE_RECORD_PREFIX + key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error || new Error('Device record read failed'));
      }));
    }
    function idbRecordSet(key,value) {
      return openIDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const req = tx.objectStore(IDB_STORE).put(JSON.parse(JSON.stringify(value)), DEVICE_RECORD_PREFIX + key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error('Device record write aborted'));
        tx.onerror = () => reject(tx.error || new Error('Device record write failed'));
        req.onerror = () => reject(req.error);
      }));
    }
    function idbRecordRemove(key) {
      return openIDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const req = tx.objectStore(IDB_STORE).delete(DEVICE_RECORD_PREFIX + key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error('Device record removal aborted'));
        tx.onerror = () => reject(tx.error || new Error('Device record removal failed'));
        req.onerror = () => reject(req.error);
      }));
    }
    const deviceFallbackKey = key => DEVICE_RECORD_PREFIX + key;
    async function getDeviceRecord(key) {
      try { return await idbRecordGet(key); }
      catch (_) {
        try { return JSON.parse(localStorage.getItem(deviceFallbackKey(key)) || 'null'); }
        catch { return null; }
      }
    }
    async function setDeviceRecord(key,value) {
      try {
        await idbRecordSet(key,value);
        try { localStorage.removeItem(deviceFallbackKey(key)); } catch (_) {}
      } catch (_) {
        localStorage.setItem(deviceFallbackKey(key), JSON.stringify(value));
      }
    }
    async function removeDeviceRecord(key) {
      try { await idbRecordRemove(key); } catch (_) {}
      try { localStorage.removeItem(deviceFallbackKey(key)); } catch (_) {}
    }

    function loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return { ...DEFAULT_DATA, ...JSON.parse(raw) };
      } catch {
        return null;
      }
    }

    async function loadDataAsync() {
      const fallback = loadFromLocalStorage();
      if (fallback?._loadnoteFallback) {
        storageBackend = 'localStorage';
        return fallback;
      }
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

    let persistenceWriter;
    let persistenceRevision=0;
    function persistNow(state) {
      const revision=++persistenceRevision;
      window.LoadnoteSaveHealth='pending';window.LoadnoteBetaOnboarding?.refresh();
      const status=document.getElementById('device-save-status');
      if(status)status.textContent='Saving on this device…';
      if(typeof invalidateViews==='function')invalidateViews();
      if (!persistenceWriter) persistenceWriter = LoadnotePersistence.createWriter({backend:()=>storageBackend,setBackend:value=>{storageBackend=value;},idbSet,local:localStorage,key:STORAGE_KEY});
      return persistenceWriter(state || data).then(() => {
        if(revision!==persistenceRevision)return;
        window.LoadnoteSaveHealth='saved';window.LoadnoteBetaOnboarding?.refresh();
        document.getElementById('storage-error-banner')?.remove();
        if(status)status.textContent='Saved on this device';
      }).catch(error=>{if(revision===persistenceRevision){window.LoadnoteSaveHealth='failed';window.LoadnoteBetaOnboarding?.refresh();if(status)status.textContent='Not saved — keep open and retry';}throw error;});
    }
    function reportStorageFailure(error) {
      console.warn('Loadnote could not persist changes', error);
      if (!document.getElementById('storage-error-banner')) {
        const banner=document.createElement('div');
        banner.id='storage-error-banner'; banner.setAttribute('role','alert');
        banner.className='card';
        banner.textContent='Changes could not be saved on this device. Keep this page open and export a JSON backup from Tools before closing.';
        const retry=document.createElement('button');retry.type='button';retry.className='btn-secondary';retry.textContent='Retry saving training data';
        retry.addEventListener('click',async()=>{retry.disabled=true;clearTimeout(saveTimer);try{await persistNow(data);}catch(error){reportStorageFailure(error);}finally{retry.disabled=false;}});
        banner.appendChild(retry);
        document.body.prepend(banner);
      }
    }

    function saveData(state) {
      if(typeof invalidateViews==='function')invalidateViews();
      if (state) data = state;
      // Debounce rapid saves (typing / bulk updates)
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        persistNow(data).catch(reportStorageFailure);
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

    function normalizeDataShape(d) {
      if (window.LoadnoteCore?.normalizeState) {
        const normalized=window.LoadnoteCore.normalizeState(d, DEFAULT_DATA);
        const integrity=window.LoadnoteIntegrity?.normalizeState?window.LoadnoteIntegrity.normalizeState(normalized):normalized;
        if(window.LoadnoteGoals)integrity.athleteGoals=window.LoadnoteGoals.validate(integrity.athleteGoals===undefined?[]:integrity.athleteGoals);
        if(window.LoadnoteSportContext)integrity.olympicPractice=window.LoadnoteSportContext.validatePractice(integrity.olympicPractice===undefined?[]:integrity.olympicPractice);
        if(window.LoadnoteProgrammingProfile)integrity.programmingProfiles=window.LoadnoteProgrammingProfile.validate(integrity.programmingProfiles===undefined?[]:integrity.programmingProfiles);
        if(window.LoadnoteMuscleReview)integrity.workloadProfiles=window.LoadnoteMuscleReview.validate(integrity.workloadProfiles===undefined?[]:integrity.workloadProfiles);
        if(window.LoadnoteHypertrophyBuilder)integrity.hypertrophyPrograms=window.LoadnoteHypertrophyBuilder.validate(integrity.hypertrophyPrograms===undefined?[]:integrity.hypertrophyPrograms);
        if(window.LoadnoteProgramCancellation)integrity.programCancellations=window.LoadnoteProgramCancellation.validateState(integrity);
        if(window.LoadnoteCoachingReview)integrity.coachingReviews=window.LoadnoteCoachingReview.validate(integrity.coachingReviews===undefined?[]:integrity.coachingReviews);
        if(window.LoadnoteSportPlanner){integrity.sportPrograms=window.LoadnoteSportPlanner.validate(integrity.sportPrograms===undefined?[]:integrity.sportPrograms);integrity.athleticPractice=window.LoadnoteSportPlanner.validateAthletic(integrity.athleticPractice===undefined?[]:integrity.athleticPractice);}
        if(window.LoadnotePhaseReview)integrity.phaseReviews=window.LoadnotePhaseReview.validate(integrity.phaseReviews===undefined?[]:integrity.phaseReviews);
        if(window.LoadnotePhaseBuilder)integrity.phasePrograms=window.LoadnotePhaseBuilder.validate(integrity.phasePrograms===undefined?[]:integrity.phasePrograms);
        if(window.LoadnoteMeetCycle)integrity.meetCycles=window.LoadnoteMeetCycle.validate(integrity.meetCycles===undefined?[]:integrity.meetCycles);
        if(window.LoadnoteCycleReview)integrity.meetCycles=window.LoadnoteCycleReview.validate(integrity);
        if(window.LoadnoteMockMeet)integrity.meetCycles=window.LoadnoteMockMeet.validate(integrity);
        if(window.LoadnoteProgramAdoption)integrity.adoptedPrograms=window.LoadnoteProgramAdoption.validate(integrity.adoptedPrograms===undefined?[]:integrity.adoptedPrograms);
        if(window.LoadnoteTransitionBaseline)integrity.transitionSnapshots=window.LoadnoteTransitionBaseline.validate(integrity.transitionSnapshots===undefined?[]:integrity.transitionSnapshots);
        if(window.LoadnoteBuilder)integrity.reviewedPrograms=window.LoadnoteBuilder.validate(integrity.reviewedPrograms===undefined?[]:integrity.reviewedPrograms);
        if(window.LoadnoteProgramReview)integrity.programReviews=window.LoadnoteProgramReview.validate(integrity.programReviews===undefined?[]:integrity.programReviews);
        return window.LoadnoteIntent?.validateState?window.LoadnoteIntent.validateState(integrity):integrity;
      }
      const base = { ...DEFAULT_DATA, ...(d || {}) };
      ['workouts','nutrition','prs','goals','programs','templates','bodyweight','foodLibrary','restDays','progressPhotos','measurements','formReviews','exerciseCatalog','workoutRevisions','recoverySnapshots','exerciseRoles'].forEach(k => {
        if (!Array.isArray(base[k])) base[k] = [];
      });
      if (!base.exerciseNotes || typeof base.exerciseNotes !== 'object') base.exerciseNotes = {};
      if (!base.api || typeof base.api !== 'object') base.api = { ...DEFAULT_DATA.api };
      base.api = { ...DEFAULT_DATA.api, ...base.api };
      return base;
    }

    // Device-only records are outside the account sync payload. v2.59 uses this
    // for the acknowledged shared sync base so large histories do not depend on
    // localStorage quota and never recursively sync their own sync metadata.
    window.LoadnoteDeviceStorage = { get:getDeviceRecord, set:setDeviceRecord, remove:removeDeviceRecord };
    window.LoadnoteStateStore = {
      current: () => data,
      async applySyncedState(incoming,{label='Before account sync'}={}) {
        const previous=data;
        const normalized=normalizeDataShape(incoming);
        const relationships=window.LoadnoteIntegrity?.auditRelationships?.(normalized);
        if(relationships?.blocking)throw Error('Synced data has blocking workout/Calendar relationship problems.');
        const next=window.LoadnoteIntegrity?.addRecoverySnapshot
          ? window.LoadnoteIntegrity.addRecoverySnapshot(normalized,previous,label)
          : normalized;
        clearTimeout(saveTimer);
        await persistNow(next);
        data=next;
        if(typeof applyDark==='function')applyDark();
        if(typeof updateUnitToggle==='function')updateUnitToggle();
        if(typeof updateStorageInfo==='function')updateStorageInfo();
        if(typeof invalidateViews==='function')invalidateViews();
        return data;
      }
    };
