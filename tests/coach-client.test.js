const assert=require('node:assert/strict');
const Client=require('../src/product/coach-client');

(async()=>{
 globalThis.LoadnoteAccountSession={
  snapshot:()=>({status:'anonymous'}),
  request:async()=>new Response('{}',{status:500,headers:{'Content-Type':'application/json'}})
 };
 assert.equal(Client.signedIn(),false);
 await assert.rejects(()=>Client.ask({question:'test',context:{version:'0.5'}}),error=>error.code==='coach_sign_in_required');

 const calls=[];
 globalThis.LoadnoteAccountSession={
  snapshot:()=>({status:'authenticated'}),
  request:async(url,options={})=>{
   calls.push({url,options});
   if(url==='/api/health')return new Response(JSON.stringify({ok:true,coach:{configured:true,authRequired:true}}),{status:200,headers:{'Content-Type':'application/json'}});
   return new Response(JSON.stringify({coach:{summary:'Ready',insights:[],recommendation:{action:'none',exercise:null,weightKg:null,sets:null,reps:null,targetRPE:null,reason:''},confidence:'medium'}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
 };
 const fakeStorage={removed:[],removeItem(key){this.removed.push(key);}};
 assert.equal(Client.scrubLegacyCredential(fakeStorage),true);
 assert.deepEqual(fakeStorage.removed,[Client.LEGACY_KEY]);
 Client.resetHealth();
 assert.equal(Client.signedIn(),true);
 const health=await Client.availability({force:true});
 assert.equal(health.online,true);
 const coach=await Client.ask({question:'What next?',context:{version:'0.5',unit:'kg'},history:[{role:'user',content:'Earlier'}]});
 assert.equal(coach.summary,'Ready');
 const request=calls.find(row=>row.url==='/api/coach');
 assert(request);
 const body=JSON.parse(request.options.body);
 assert.deepEqual(Object.keys(body).sort(),['context','history','question']);
 assert.equal(body.question,'What next?');
 assert.equal(Object.hasOwn(body,'messages'),false);
 assert.equal(Object.hasOwn(body,'apiKey'),false);

 console.log('v2.63 consumer Coach client uses only the authenticated Loadnote server contract');
})().catch(error=>{console.error(error);process.exit(1);});
