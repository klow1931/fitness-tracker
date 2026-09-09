/* Loadnote v1.0 release helpers — product-level status and data-quality checks. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteRelease = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function assess(data) {
    const d = data || {};
    const checks = [
      { id:'storage', label:'Local workout storage', ok:Array.isArray(d.workouts) },
      { id:'programs', label:'Program support', ok:Array.isArray(d.programs) },
      { id:'analytics', label:'Training analytics', ok:Number(d.schemaVersion || 0) >= 3 },
      { id:'adaptive', label:'Adaptive programming', ok:Number(d.schemaVersion || 0) >= 6 },
      { id:'coach', label:'Coach architecture', ok:Number(d.schemaVersion || 0) >= 5 },
      { id:'fatigue', label:'Performance & fatigue signals', ok:Number(d.schemaVersion || 0) >= 9 },
      { id:'migration', label:'Current data schema', ok:Number(d.schemaVersion || 0) >= 10 }
    ];
    return { version:'1.5.2', checks, ready:checks.every(c=>c.ok), completed:checks.filter(c=>c.ok).length, total:checks.length };
  }
  return { assess };
});
