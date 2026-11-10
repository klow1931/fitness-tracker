const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const release=require('../scripts/release'),{verify}=require('../scripts/verify-deployment');
const root=path.resolve(__dirname,'..');
(async()=>{
 assert.equal(release.check(),require('../package.json').version);
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-release-'));
 const files=['package.json','package-lock.json','native-beta.json','src/core/loadnote-core.js','src/release.js','src/product/navigation.js','index.html','sw.js','README.md','CHANGELOG.md','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj'];
 try{
  for(const file of new Set(files.concat(release.assetPaths(fs.readFileSync(path.join(root,'sw.js'),'utf8')).map(file=>file==='./'?'index.html':file.slice(2))))){
   fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(fixture,file));
  }
  fs.mkdirSync(path.join(fixture,'docs'),{recursive:true});
  const old=fs.readFileSync(path.join(fixture,'package.json'),'utf8');
  assert.throws(()=>release.plan(fixture,{version:'8.0',build:40000}),/semantic/);
  assert.throws(()=>release.plan(fixture,{version:'0.1.0',build:40000}),/backwards/);
  assert.throws(()=>release.plan(fixture,{version:'99.0.0',build:1}),/higher|number/);
  assert.equal(fs.readFileSync(path.join(fixture,'package.json'),'utf8'),old,'Planning never writes files');
  const changes=release.plan(fixture,{version:'99.0.0',build:99900,title:'Test release'});
  let writes=0;
  assert.throws(()=>release.write(fixture,changes,(file,content)=>{if(++writes===4)throw Error('Test disk failure');fs.writeFileSync(file,content);}),/disk failure/);
  assert.equal(fs.readFileSync(path.join(fixture,'package.json'),'utf8'),old,'Failed preparation restores original files');
  assert.equal(fs.existsSync(path.join(fixture,'docs/releases-v99.0.md')),false);
  release.write(fixture,changes);assert.equal(release.check(fixture),'99.0.0');
  assert.equal(release.plan(fixture,{version:'99.0.0',build:99900}).size,0,'Preparation is idempotent');
  fs.appendFileSync(path.join(fixture,'src/product/app-version.js'),'\n// changed\n');
  assert.throws(()=>release.check(fixture),/assets differ/,'Changed offline files must invalidate the release');
  const expected={version:'99.0.0',buildNumber:99900,assets:{'./index.html':require('node:crypto').createHash('sha256').update('shell').digest('hex')}};
  let broken=false,missing=false,stale=false;
  const fetcher=async url=>{
   assert.equal(url.origin,'https://example.test');assert(url.pathname.startsWith('/loadnote/'));assert(url.searchParams.has('release-check'));
   const body=url.pathname.endsWith('release.json')?JSON.stringify(stale?{...expected,version:'98.0.0'}:expected):broken?'mixed shell':'shell';
   return {ok:!missing,status:missing?404:200,arrayBuffer:async()=>Buffer.from(body)};
  };
  assert.equal((await verify('https://example.test/loadnote/',expected,{fetcher})).assets,1);
  broken=true;await assert.rejects(verify('https://example.test/loadnote/',expected,{fetcher}),/content differs/);broken=false;
  missing=true;await assert.rejects(verify('https://example.test/loadnote/',expected,{fetcher}),/HTTP 404/);missing=false;
  stale=true;await assert.rejects(verify('https://example.test/loadnote/',expected,{fetcher}),/does not match/);
  await assert.rejects(verify('http://example.test/',expected,{fetcher}),/HTTPS/);
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
 console.log('Release preparation, rollback, idempotence, asset integrity and deployed version verification passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
