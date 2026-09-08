// ========== Data Layer (IndexedDB + localStorage migration) ==========
    const STORAGE_KEY = 'fitness-tracker-v1';
    const IDB_NAME = 'fitness-tracker-db';
    const IDB_VERSION = 10;
    const IDB_STORE = 'app';
    const IDB_KEY = 'state';

    const DEFAULT_DATA = {
      schemaVersion: 10,
      athleteProfileVersion: 1, athleteProfile: null,
      workouts: [], nutrition: [], prs: [], goals: [], programs: [],
      activeProgramId: null, templates: [], bodyweight: [], foodLibrary: [],
      restDays: [], exerciseNotes: {}, unit: 'kg', measureUnit: 'cm', dark: false, gymMode: false, checklistMode: true,
      gymModeUserSet: false, onboardingDismissed: false,
      lastExportDate: null, backupBannerDismissed: null,
      progressPhotos: [], measurements: [], formReviews: [],
      api: { enabled: false, backendEnabled: false, backendUrl: '/api/coach', provider: 'xai', baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest' }
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
    function persistNow(state) {
      if(typeof invalidateViews==='function')invalidateViews();
      if (!persistenceWriter) persistenceWriter = LoadnotePersistence.createWriter({backend:()=>storageBackend,setBackend:value=>{storageBackend=value;},idbSet,local:localStorage,key:STORAGE_KEY});
      return persistenceWriter(state || data).then(() => {
        document.getElementById('storage-error-banner')?.remove();
      });
    }
    function reportStorageFailure(error) {
      console.warn('Loadnote could not persist changes', error);
      if (!document.getElementById('storage-error-banner')) {
        const banner=document.createElement('div');
        banner.id='storage-error-banner'; banner.setAttribute('role','alert');
        banner.className='card';
        banner.textContent='Changes could not be saved on this device. Keep this page open and export a JSON backup from Tools before closing.';
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
      if (window.LoadnoteCore?.normalizeState) return window.LoadnoteCore.normalizeState(d, DEFAULT_DATA);
      const base = { ...DEFAULT_DATA, ...(d || {}) };
      ['workouts','nutrition','prs','goals','programs','templates','bodyweight','foodLibrary','restDays','progressPhotos','measurements','formReviews'].forEach(k => {
        if (!Array.isArray(base[k])) base[k] = [];
      });
      if (!base.exerciseNotes || typeof base.exerciseNotes !== 'object') base.exerciseNotes = {};
      if (!base.api || typeof base.api !== 'object') base.api = { ...DEFAULT_DATA.api };
      base.api = { ...DEFAULT_DATA.api, ...base.api };
      return base;
    }
