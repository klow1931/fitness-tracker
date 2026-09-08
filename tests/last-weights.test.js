const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const source=app.slice(app.indexOf('    function fillLastWeights'),app.indexOf('    function saveExerciseNoteFromRow'));
function fixture(accept){
 let loaded=[],prompts=0;
 const container={innerHTML:'original',querySelectorAll:()=>[{value:'100'}]};
 const row={dataset:{type:'strength',trackBy:'duration'},querySelector:s=>s==='.ex-name'?{value:'Bench'}:container,querySelectorAll:()=>[]};
 const ctx={getLastExercisePerformance:()=>({date:'2026-01-01',sets:[{reps:5,weight:80,rpe:9}]}),smallJumpKg:()=>2.5,confirm:()=>{prompts++;return accept;},addSetToContainer:(c,s)=>loaded.push(s),formatDate:d=>d,alert:()=>{}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {run:(jump=false,quiet=false)=>ctx.fillLastWeights({closest:()=>row},jump,quiet),loaded,container,row,prompts:()=>prompts};
}
const decline=fixture(false);decline.run();assert.equal(decline.container.innerHTML,'original');assert.equal(decline.loaded.length,0);
const automatic=fixture(true);automatic.run(false,true);assert.equal(automatic.prompts(),0);assert.equal(automatic.loaded.length,0);
const accept=fixture(true);accept.run(true);assert.equal(accept.loaded[0].weight,82.5);assert.equal(accept.loaded[0].rpe,'');assert.equal(accept.row.dataset.trackBy,'reps');
console.log('Last-session overwrite, RPE, and tracking-mode tests passed');
