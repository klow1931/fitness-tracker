(function(root,factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnotePersistence = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  function createWriter(io) {
    let queue = Promise.resolve();
    return function write(state) {
      const snapshot = JSON.parse(JSON.stringify(state));
      const operation = queue.then(async () => {
        if (io.backend() === 'indexedDB') {
          try {
            await io.idbSet(snapshot);
            // A successful primary commit supersedes a previous fallback snapshot.
            try { io.local.removeItem(io.key); } catch (_) {}
            return;
          } catch (_) { /* Fall back atomically with a marker used at startup. */ }
        }
        io.local.setItem(io.key, JSON.stringify({...snapshot, _loadnoteFallback:true}));
        io.setBackend('localStorage');
      });
      queue = operation.catch(() => {});
      return operation;
    };
  }
  return {createWriter};
});
