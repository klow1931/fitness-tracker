const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{resolveStaticFile}=require('../backend/static-files'),{createServer}=require('../backend/server');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-static-')),policy={rootFiles:new Set(['index.html']),prefixes:['src/','assets/']};
 try{
  fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'backend'));fs.writeFileSync(path.join(root,'index.html'),'ok');fs.writeFileSync(path.join(root,'src','safe.js'),'ok');fs.writeFileSync(path.join(root,'backend','secret.txt'),'synthetic secret');fs.symlinkSync(path.join(root,'backend','secret.txt'),path.join(root,'src','link.js'));
  assert.equal(resolveStaticFile(root,'/',policy),path.join(root,'index.html'));assert.equal(resolveStaticFile(root,'/src/safe.js',policy),path.join(root,'src/safe.js'));
  for(const url of ['/src/%2e%2e%2fbackend/secret.txt','/src/..%5cbackend%5csecret.txt','/src/link.js','/src/%00','/src/%zz','/backend/secret.txt','/src/../../outside','/src/'])assert.equal(resolveStaticFile(root,url,policy),null,url);
  const server=createServer({env:{NODE_ENV:'test',LOADNOTE_ACCOUNT_STORE_PATH:path.join(root,'accounts.json')}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const base='http://127.0.0.1:'+server.address().port;for(const url of ['/src/%2e%2e%2fbackend/server.js','/assets/%2e%2e%2fpackage.json','/src/%2e%2e%2f.env'])assert.equal((await fetch(base+url)).status,404,url);assert.equal((await fetch(base+'/src/product/plate-calculator.js')).status,200);}finally{await new Promise(r=>server.close(r));}
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 console.log('Canonical static allowlist rejects encoded traversal, symlink escape and private files');
})().catch(e=>{console.error(e);process.exit(1);});
