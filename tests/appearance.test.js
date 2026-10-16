const assert=require('node:assert/strict');
const Appearance=require('../src/product/appearance');

function rig(raw=null,{legacyDark=false,failWrites=false}={}){
 const records=new Map(raw===null?[]:[[Appearance.KEY,JSON.stringify(raw)]]);
 const store={
  getItem:key=>records.get(key)||null,
  setItem:(key,value)=>{if(failWrites)throw Error('disk full');records.set(key,value);},
  removeItem:key=>{if(failWrites)throw Error('disk full');records.delete(key);}
 };
 let listener=null;
 const m={matches:false,addEventListener:(type,handler)=>{assert.equal(type,'change');listener=handler;}};
 const vars=new Map();
 const classes=new Set();
 const meta={content:''};
 const d={documentElement:{style:{setProperty:(k,v)=>vars.set(k,v)}},body:{classList:{toggle:(key,on)=>{if(on)classes.add(key);else classes.delete(key);}}},querySelector:q=>q==='meta[name="theme-color"]'?meta:null};
 const api=Appearance.create({local:()=>store,media:()=>m,doc:()=>d});
 return {api,store,m,vars,classes,meta,records,fire:()=>listener?.(),legacyDark};
}

assert.deepEqual(Object.keys(Appearance.PALETTES),['indigo','ocean','emerald','crimson','amber','slate']);
for(const color of [...Object.values(Appearance.PALETTES),'#ffffff','#ffff00','#00ffff','#101010']){
 const brand=Appearance.accessible(color);
 assert.match(brand,/^#[0-9a-f]{6}$/);
 assert(Appearance.contrast(brand,'#ffffff')>=4.5,'Buttons need readable white text: '+color);
}
assert.throws(()=>Appearance.accessible('red'),/valid/);
{
 const r=rig();
 assert.equal(r.api.apply().mode,'light');
 assert.equal(r.vars.get('--brand'),Appearance.PALETTES.indigo);
 assert.equal(r.classes.has('dark'),false);
 r.api.set({mode:'dark',palette:'ocean'});
 assert.equal(r.api.apply().dark,true);
 assert.equal(r.classes.has('dark'),true);
 assert.equal(r.meta.content,'#0c1326');
 assert.deepEqual(JSON.parse(r.records.get(Appearance.KEY)),{version:1,mode:'dark',palette:'ocean',customColor:null});
 const reopened=Appearance.create({local:()=>r.store,media:()=>r.m,doc:()=>({})});
 assert.equal(reopened.current().palette,'ocean');
 assert.equal(reopened.current().mode,'dark');
 r.api.set({palette:'custom',customColor:'#FFFF00'});
 assert.equal(r.api.current().customColor,'#ffff00');
 assert(r.api.contrast(r.api.tokens(r.api.current(),true)['--brand'],'#ffffff')>=4.5);
 assert.equal(r.api.reset().palette,'indigo');
 assert.equal(r.api.current().mode,'light');
 assert.equal(r.records.has(Appearance.KEY),false);
}
{
 const r=rig({mode:'system',palette:'emerald',customColor:null});
 let count=0;r.api.listen(()=>{count++;r.api.apply();});
 assert.equal(r.api.apply().dark,false);
 r.m.matches=true;r.fire();assert.equal(count,1);assert.equal(r.classes.has('dark'),true);
 r.m.matches=false;r.fire();assert.equal(count,2);assert.equal(r.classes.has('dark'),false);
 r.api.set({mode:'light'});r.m.matches=true;r.fire();assert.equal(count,2,'System changes do not override explicit choices');
}
{
 const r=rig(null,{legacyDark:true});
 assert.equal(r.api.apply(true).dark,true,'Old saved dark-mode choice is honored');
}
{
 const r=rig({mode:'bogus',palette:'custom',customColor:'bad'});
 assert.equal(r.api.current().mode,'light');
 assert.equal(r.api.current().palette,'indigo');
 assert.throws(()=>r.api.set({mode:'broken'}),/Choose/);
 assert.throws(()=>r.api.set({palette:'custom'}),/custom color/);
 assert.throws(()=>r.api.set({customColor:'url(javascript:alert(1))'}),/valid/);
 assert.equal(r.api.current().palette,'indigo');
}
{
 const r=rig(null,{failWrites:true});
 assert.throws(()=>r.api.set({mode:'dark'}),/could not be saved/);
 assert.equal(r.api.current().mode,'light','Failed storage cannot create fake persistent state');
 assert.throws(()=>r.api.reset(),/could not be reset/);
}
console.log('Appearance: contrast, legacy mode, presets, custom colors, system updates, persistence and failed writes passed');
