(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteDraft = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const string = v => v == null ? '' : String(v);
  function normalize(input) {
    if (!input || ![1, 2].includes(input.version) || !Array.isArray(input.rows) || input.rows.length > 200) return null;
    try {
      const rows = input.rows.map(raw => {
        let r = raw;
        if (input.version === 1) {
          if (!Array.isArray(r.fields)) throw Error('Invalid legacy fields');
          const f = r.fields, value = i => string(f[i]?.value);
          if (r.type === 'cardio') r = {type:'cardio', name:value(0), duration:value(1), distance:value(2), distanceUnit:value(3), avgHr:value(4)};
          else {
            if (!Number.isInteger(r.setCount) || r.setCount < 0 || r.setCount > 200) throw Error('Invalid set count');
            const checks = f.length === 2 + r.setCount * 4;
            if (f.length !== 2 + r.setCount * (checks ? 4 : 3)) throw Error('Invalid legacy shape');
            r = {type:'strength', name:value(0), note:value(1), trackBy:r.trackBy, sets:Array.from({length:r.setCount}, (_, i) => {
              const offset = 2 + i * (checks ? 4 : 3), first = offset + (checks ? 1 : 0);
              return {[r.trackBy === 'duration' ? 'duration' : 'reps']:value(first), weight:value(first+1), rpe:value(first+2), done:checks && !!f[offset]?.checked, showCompletion:checks};
            })};
          }
        }
        if (!r || !['cardio','strength'].includes(r.type)) throw Error('Invalid row');
        if (r.type === 'cardio') return {type:'cardio',name:string(r.name),duration:string(r.duration),distance:string(r.distance),distanceUnit:['km','mi','m'].includes(r.distanceUnit)?r.distanceUnit:'km',avgHr:string(r.avgHr)};
        if (!Array.isArray(r.sets) || r.sets.length > 200) throw Error('Invalid sets');
        return {type:'strength', name:string(r.name),note:string(r.note),trackBy:r.trackBy === 'duration'?'duration':'reps',sets:r.sets.map(s=>({reps:string(s.reps),duration:string(s.duration),weight:string(s.weight),rpe:string(s.rpe),done:!!s.done,showCompletion:!!s.showCompletion}))};
      });
      const edit=input.edit && input.edit.id!=null && input.edit.original && String(input.edit.id)===String(input.edit.original.id) && Array.isArray(input.edit.original.exercises)
        ? {id:input.edit.id,original:input.edit.original}:null;
      return {version:2, date:string(input.date),notes:string(input.notes),unit:input.unit === 'lb'?'lb':'kg',program:input.program && typeof input.program === 'object'?input.program:null,edit,updatedAt:input.updatedAt,rows};
    } catch (_) { return null; }
  }
  return {normalize};
});
