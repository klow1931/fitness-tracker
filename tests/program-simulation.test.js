const assert=require('node:assert/strict');
const Phase=require('../src/product/phase-builder');
const Meet=require('../src/product/meet-cycle');
const Gate=require('../src/product/program-quality-gate');
const {phaseFixture}=require('./fixtures/phase-builder');

const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const finalDate=(start,weeks,dayOffset=5)=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+dayOffset);return d.toISOString().slice(0,10);};
function sourceFor({fiveDay=false,advanced=false,sparse=false,unit='kg',id='source'}={}){
  const {state:raw,config:rawConfig}=phaseFixture(),state=structuredClone(raw),config=structuredClone(rawConfig);
  state.unit=unit;
  if(sparse){state.workouts=[];state.workoutRevisions=[];}
  if(advanced)state.programmingProfiles=state.programmingProfiles.map(p=>({...p,context:p.context?{...p.context,experience:'advanced'}:p.context}));
  if(fiveDay){
    config.days=[0,1,2,3,4];
    config.lifts.squat.exposures=[{day:0,role:'primary',format:'top-backoff'},{day:2,role:'variation',format:'straight'}];
    config.lifts.bench.exposures=[{day:0,role:'primary',format:'straight'},{day:1,role:'light',format:'straight'},{day:3,role:'light',format:'straight'}];
    config.lifts.deadlift.exposures=[{day:2,role:'primary',format:'top-backoff'},{day:4,role:'light',format:'straight'}];
  }
  const proposal=Phase.prepare(state,config,args),saved=Phase.save(state,proposal,{confirmed:true,notes:'simulation source'},{...args,id});
  return {state:saved,source:saved.phasePrograms.find(p=>p.id===id),config};
}
const cases=[
  {weeks:8,fiveDay:false,advanced:false,sparse:false,unit:'kg',eventType:'mock'},
  {weeks:12,fiveDay:true,advanced:true,sparse:false,unit:'kg',eventType:'competition'},
  {weeks:16,fiveDay:false,advanced:false,sparse:true,unit:'lb',eventType:'mock'},
  {weeks:20,fiveDay:true,advanced:true,sparse:true,unit:'lb',eventType:'mock'}
];
for(const [i,test] of cases.entries()){
  const {state,source,config}=sourceFor({...test,id:'sim-'+i}),day=test.eventType==='competition'?2:5,meetDate=finalDate(config.startDate,test.weeks,day);
  const raw={version:1,weeks:test.weeks,peakWeeks:2,taperWeeks:1,meetDate,eventType:test.eventType,eventName:test.eventType==='competition'?'Simulation Championships':''};
  const proposal=Meet.prepare(state,source,raw,args),gate=proposal.qualityGate;
  assert.notEqual(gate.status,'blocking',JSON.stringify({test,findings:gate.findings}));
  assert.equal(gate.weekly.length,test.weeks);
  assert.equal(gate.cycle.sessionCount,proposal.sessions.length);
  assert(gate.weekly.filter(w=>w.sessionCount).every(w=>w.maxSessionMinutes<=source.config.sessionMinutes));
  assert(gate.weekly.filter(w=>w.phase==='peaking'||w.phase==='taper').every(w=>Object.values(w.lifts).every(l=>l.specificityPct===100)));
  assert.equal(gate.weekly.at(-1).meetDate,meetDate);
  assert.equal(gate.weekly.at(-1).sessionCount,0);
  assert(proposal.sessions.every(s=>s.date<meetDate));
  assert.equal(Gate.validate(gate,proposal).inputFingerprint,gate.inputFingerprint);
}
console.log('v2.67 8/12/16/20-week, 3/5-day, sparse-history, advanced, kg/lb and mock/competition simulations passed');