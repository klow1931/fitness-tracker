const assert=require('node:assert/strict'),P=require('../src/product/coach-workspace'),fs=require('node:fs'),path=require('node:path');
for(const signedIn of [false,true]){
 const offline=P.connection({signedIn,loginAvailable:true,availability:{online:false}});assert.equal(offline.account,false);assert.equal(offline.ready,false);assert.doesNotMatch(offline.text,/Sign in from Profile/);
}
assert.equal(P.connection({loginAvailable:true,availability:{online:true}}).account,true);
assert.equal(P.connection({loginAvailable:false,availability:{online:true}}).account,false);
assert.equal(P.connection({signedIn:true,availability:{online:true}}).ready,true);
for(const opts of [{native:true},{online:false},{localAI:{conversationConsent:true,status:'unsupported'}}]){
 const value=P.connection({...opts,signedIn:true,availability:{online:true},loginAvailable:true});assert.equal(value.account,false);assert.equal(value.ready,false);
}
assert.equal(P.continuity().visible,false);assert.equal(P.continuity({hasDraft:true}).visible,true);
assert.match(P.continuity({hasDraft:true,failed:true}).text,/needs attention/);
assert.doesNotMatch(P.continuity({hasDraft:true,failed:true}).text,/saved/);
assert.match(P.continuity({hasDraft:true,degraded:true}).text,/one local checkpoint/);
const input={hasDraft:true,workout:{name:'Bench',date:'2026-01-01'},other:{sets:[]}},before=JSON.stringify(input);P.continuity(input);assert.equal(JSON.stringify(input),before);
for(const file of ['../playwright.config.js','../.github/workflows/test.yml'])assert(fs.readFileSync(path.join(__dirname,file),'utf8').includes('v69-coach-continuity.spec.js'));
console.log('v6.9 connection truth, account gating, draft health and read-only continuity passed');
