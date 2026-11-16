const assert=require('node:assert/strict');
function assertSavedWorkout(workouts){
 assert.equal(workouts.length,1,'Exactly one completed session, including after reconnect');
 const w=workouts[0];assert.ok(w.id,'Saved session identity');assert.match(w.date,/^\d{4}-\d{2}-\d{2}$/);assert.equal(w.exercises.length,1);assert.equal(w.exercises[0].name,'Offline Acceptance Press');
 const sets=w.exercises[0].sets;assert.equal(sets.length,2);
 // Explicit independent expected kg values, not toStorage() reused by the test.
 assert.deepEqual(sets.map(s=>({weight:s.weight,reps:s.reps,rpe:s.rpe})),[{weight:61.23,reps:5,rpe:8},{weight:63.5,reps:3,rpe:9}]);
}
module.exports={assertSavedWorkout};
