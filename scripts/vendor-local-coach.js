'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/vendor');
module.exports=function bundleLocalCoach(){
 fs.mkdirSync(out,{recursive:true});
 require('esbuild').buildSync({entryPoints:[path.join(root,'src/local-ai/runtime-entry.mjs')],outfile:path.join(out,'local-coach-runtime.mjs'),bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',legalComments:'linked'});
 fs.copyFileSync(path.join(root,'node_modules/@mlc-ai/web-llm/LICENSE'),path.join(out,'web-llm-LICENSE.txt'));
 const bytes=fs.readFileSync(path.join(out,'local-coach-runtime.mjs'));
 fs.writeFileSync(path.join(out,'local-coach-manifest.json'),JSON.stringify({runtime:'@mlc-ai/web-llm',version:require('@mlc-ai/web-llm/package.json').version,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length},null,2)+'\n');
};
if(require.main===module)module.exports();
