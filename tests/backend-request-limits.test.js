const assert=require('node:assert/strict'),{createRequestLimits}=require('../backend/request-limits');
let clock=0;const limits=createRequestLimits({now:()=>clock,env:{LOADNOTE_AI_REQUESTS_PER_MINUTE:'2',LOADNOTE_AI_REQUESTS_PER_DAY:'3',LOADNOTE_AI_MAX_CONCURRENT:'1',LOADNOTE_AI_GLOBAL_REQUESTS_PER_DAY:'4'}});
const a=limits.acquire('a');assert(a.ok);assert(!limits.acquire('b').ok);a.release();a.release();const b=limits.acquire('a');assert(b.ok);b.release();assert(!limits.acquire('a').ok);clock=60000;
const c=limits.acquire('a');assert(c.ok);c.release();assert(!limits.acquire('a').ok);const d=limits.acquire('b');assert(d.ok);d.release();assert(!limits.acquire('c').ok);clock=86400000;const e=limits.acquire('a');assert(e.ok);e.release();
for(const value of ['0','-1','1.5','NaN','10000000'])assert.throws(()=>createRequestLimits({env:{LOADNOTE_AI_MAX_CONCURRENT:value}}));
console.log('AI minute/day/global/concurrency limits, release idempotence and window reset passed');
