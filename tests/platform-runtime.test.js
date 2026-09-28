const assert=require('node:assert/strict');
const Platform=require('../src/product/platform-runtime');

let ctx=Platform.detect({navigator:{},matchMedia:()=>({matches:false})});
assert.deepEqual(ctx,{version:1,surface:'browser',native:false,nativePlatform:null,standalone:false});

ctx=Platform.detect({navigator:{standalone:true},matchMedia:()=>({matches:false})});
assert.equal(ctx.surface,'installed-web');
assert.equal(ctx.standalone,true);
assert.equal(ctx.native,false);

ctx=Platform.detect({navigator:{},matchMedia:query=>({matches:query==='(display-mode: standalone)'})});
assert.equal(ctx.surface,'installed-web');

ctx=Platform.detect({
 navigator:{},matchMedia:()=>({matches:false}),
 Capacitor:{isNativePlatform:()=>true,getPlatform:()=> 'ios'}
});
assert.equal(ctx.surface,'native');
assert.equal(ctx.native,true);
assert.equal(ctx.nativePlatform,'ios');
assert.equal(ctx.standalone,true);

const classes=new Set(['runtime-browser','other']);
const doc={
 documentElement:{dataset:{}},
 body:{classList:{
  add:(...names)=>names.forEach(name=>classes.add(name)),
  remove:(...names)=>names.forEach(name=>classes.delete(name))
 }}
};
Platform.apply(doc,ctx);
assert.equal(doc.documentElement.dataset.loadnoteSurface,'native');
assert.equal(doc.documentElement.dataset.loadnotePlatform,'ios');
assert(classes.has('runtime-native'));
assert(classes.has('runtime-ios'));
assert(!classes.has('runtime-browser'));
assert(classes.has('other'));
console.log('v2.54 browser, installed-web and native runtime detection passed');
