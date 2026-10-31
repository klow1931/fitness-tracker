'use strict';
const U=require('../src/product/coach-understanding'),cases=require('../tests/fixtures/coach-understanding-heldout.json');
function run(){
 const rows=cases.map(c=>{const r=U.classify(c.question);return {...c,actual:r.intent,accepted:r.accepted,correct:r.intent===c.expected,abstained:!r.accepted&&c.expected!=='unknown'};});
 const accepted=rows.filter(r=>r.accepted),errors=rows.filter(r=>r.accepted&&!r.correct),supported=rows.filter(r=>r.expected!=='unknown');
 return {version:1,total:rows.length,accepted:accepted.length,acceptedCorrect:accepted.filter(r=>r.correct).length,acceptedErrors:errors.length,abstained:supported.filter(r=>r.abstained).length,supportedCoverage:accepted.filter(r=>r.expected!=='unknown').length/supported.length,acceptedPrecision:accepted.length?(accepted.length-errors.length)/accepted.length:0,unknownRejected:rows.filter(r=>r.expected==='unknown'&&!r.accepted).length,unknownTotal:rows.filter(r=>r.expected==='unknown').length,rows,notice:'Held-out synthetic language benchmark. Abstentions are reported separately from correct classifications. This does not certify general conversation quality or medical safety.'};
}
if(require.main===module){const r=run();console.log(JSON.stringify(r,null,2));if(r.acceptedPrecision<0.95||r.supportedCoverage<0.5)process.exitCode=1;}
module.exports={run};
