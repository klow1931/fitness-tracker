const assert=require('node:assert/strict');
const Policy=require('../src/product/cycle-phase-policy');

const acc=Policy.resolve({phase:'accumulation',nextPhase:'accumulation'});
assert.deepEqual(acc.allowedActions,['keep','reduce-one','reduce-load','increase-load']);
assert.equal(acc.thresholds.increaseCompetitionComparable,6);
assert.equal(acc.thresholds.increaseCompetitionBelowCapHalf,3);
assert.equal(acc.thresholds.increaseCapacityPct,2);
assert.equal(acc.historyScope,'general');

const accStrength=Policy.resolve({phase:'accumulation',nextPhase:'strength'});
assert.deepEqual(accStrength.allowedActions,['keep','reduce-one','reduce-load']);
assert.equal(Policy.allows(accStrength,'increase-load'),false);
assert.match(accStrength.objective,/planned phase transition/i);

const strength=Policy.resolve({phase:'strength',nextPhase:'strength'});
assert.equal(strength.thresholds.increaseCompetitionComparable,4);
assert.equal(strength.thresholds.increaseCompetitionBelowCapHalf,2);
assert.equal(strength.thresholds.increaseCapacityPct,1);

const intoPeak=Policy.resolve({phase:'strength',nextPhase:'peaking'});
assert.deepEqual(intoPeak.allowedActions,['keep','reduce-load']);
assert.equal(intoPeak.reductionEvidence,'competition-only');

const peak=Policy.resolve({phase:'peaking',nextPhase:'peaking'});
assert.deepEqual(peak.allowedActions,['keep','reduce-load']);
assert.equal(peak.historyScope,'none');
assert.match(peak.objective,/competition-specific/i);

const taper=Policy.resolve({phase:'peaking',nextPhase:'taper'});
assert.deepEqual(taper.allowedActions,['keep']);
assert.match(taper.label,/taper/i);

const event=Policy.resolve({phase:'taper',nextPhase:'mock-meet'});
assert.deepEqual(event.allowedActions,['keep']);
assert.match(event.label,/event/i);

console.log('v2.65 phase-specific cycle policy tests passed');