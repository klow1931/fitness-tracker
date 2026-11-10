/* Reproducible web/native release metadata. Never changes training data. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const json=value=>JSON.stringify(value,null,2)+'\n';
function assetPaths(sw){
 const list=sw.match(/const ASSETS = \[([\s\S]*?)\];/);
 if(!list)throw Error('Missing offline asset list');
 return [...new Set([...list[1].matchAll(/'([^']+)'/g)].map(match=>match[1]).concat('./sw.js'))].sort();
}
function manifest(base=root,planned=new Map()){
 const read=file=>planned.has(file)?Buffer.from(planned.get(file)):fs.readFileSync(path.join(base,file));
 const pkg=JSON.parse(read('package.json')),beta=JSON.parse(read('native-beta.json'));
 const assets={};
 for(const asset of assetPaths(read('sw.js').toString())){
  if(!/^\.\/[a-zA-Z0-9_./-]*$/.test(asset)||asset.split('/').includes('..'))throw Error('Invalid release asset '+asset);
  assets[asset]=crypto.createHash('sha256').update(read(asset==='./'?'index.html':asset.slice(2))).digest('hex');
 }
 return json({version:pkg.version,buildNumber:beta.buildNumber,assets});
}
function plan(base,{version,build,title='Release update'}){
 if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version||''))throw Error('Use a stable semantic version, for example 7.7.0');
 if(!Number.isSafeInteger(build)||build<1||build>2100000000)throw Error('Use a positive Android/iOS build number');
 if(!title.trim()||/[\r\n]/.test(title))throw Error('Use a single-line release title');
 const read=file=>fs.readFileSync(path.join(base,file),'utf8'),next=new Map();
 const pkg=JSON.parse(read('package.json')),beta=JSON.parse(read('native-beta.json')),old=pkg.version;
 const compare=(a,b)=>{for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]-b[i];}return 0;};
 if(compare(version.split('.').map(Number),old.split('.').map(Number))<0)throw Error('Release version cannot go backwards');
 if(build<beta.buildNumber||version!==old&&build<=beta.buildNumber)throw Error('A new release needs a higher native build number');
 const replace=(file,regex,value,count=1)=>{
  const source=next.has(file)?next.get(file):read(file),matches=[...source.matchAll(new RegExp(regex.source,'g'))];
  if(matches.length!==count)throw Error('Expected '+count+' release markers in '+file+', found '+matches.length);
  next.set(file,source.replace(regex,value));
 };
 pkg.version=version;next.set('package.json',json(pkg));
 const lock=JSON.parse(read('package-lock.json'));lock.version=version;lock.packages[''].version=version;next.set('package-lock.json',json(lock));
 beta.buildNumber=build;next.set('native-beta.json',json(beta));
 replace('src/core/loadnote-core.js',/const RELEASE_VERSION = '[^']+';/,"const RELEASE_VERSION = '"+version+"';");
 replace('src/release.js',/version:'\d+\.\d+\.\d+'/,"version:'"+version+"'");
 for(const file of ['index.html','src/product/navigation.js'])replace(file,/Loadnote web v\d+\.\d+\.\d+ ·/,'Loadnote web v'+version+' ·');
 replace('sw.js',/const CACHE = 'loadnote-v[^']+';/,"const CACHE = 'loadnote-v"+version+"';");
 replace('README.md',/^(# Loadnote\r?\n\r?\n)\*\*v\d+\.\d+\.\d+ · Development build\.\*\*/,'$1**v'+version+' · Development build.**');
 replace('android/app/build.gradle',/versionCode \d+/,'versionCode '+build);
 replace('android/app/build.gradle',/versionName "[^"]+"/,'versionName "'+version+'"');
 replace('ios/App/App.xcodeproj/project.pbxproj',/MARKETING_VERSION = [^;]+;/g,'MARKETING_VERSION = '+version+';',2);
 replace('ios/App/App.xcodeproj/project.pbxproj',/CURRENT_PROJECT_VERSION = [^;]+;/g,'CURRENT_PROJECT_VERSION = '+build+';',2);
 const notes='docs/releases-v'+version.replace(/\.0$/,'')+'.md';
 if(!fs.existsSync(path.join(base,notes)))next.set(notes,'# Loadnote v'+version+' — '+title+'\n\nVersion '+version+' · unsigned native build '+build+'.\n\nDescribe behavior, architecture, rollback baseline and validation before review.\n');
 const changelog=read('CHANGELOG.md');
 if(!changelog.startsWith('# v'+version+' —'))next.set('CHANGELOG.md','# v'+version+' — '+title+'\n\nSee ['+version+']('+notes+') for behavior and validation.\n\n'+changelog);
 next.set('release.json',manifest(base,next));
 return new Map([...next].filter(([file,content])=>!fs.existsSync(path.join(base,file))||read(file)!==content));
}
function write(base,changes,writer=fs.writeFileSync){
 const originals=new Map([...changes].map(([file])=>[file,fs.existsSync(path.join(base,file))?fs.readFileSync(path.join(base,file)):null]));
 try{for(const [file,content]of changes)writer(path.join(base,file),content);}
 catch(error){for(const [file,content]of originals){if(content===null)fs.rmSync(path.join(base,file),{force:true});else fs.writeFileSync(path.join(base,file),content);}throw error;}
}
function check(base=root){
 const read=file=>fs.readFileSync(path.join(base,file),'utf8'),pkg=JSON.parse(read('package.json')),beta=JSON.parse(read('native-beta.json'));
 const drift=plan(base,{version:pkg.version,build:beta.buildNumber});
 if(drift.size)throw Error('Release metadata or assets differ: '+[...drift.keys()].join(', ')+'. Prepare the release or run release:manifest after asset edits.');
 if(!read('CHANGELOG.md').startsWith('# v'+pkg.version+' —'))throw Error('Missing changelog entry');
 return pkg.version;
}
if(require.main===module){
 try{
  const args=process.argv.slice(2);
  if(args[0]==='--check')console.log('Release '+check()+' metadata and offline asset hashes agree');
  else if(args[0]==='--manifest'){fs.writeFileSync(path.join(root,'release.json'),manifest());console.log('Updated release asset hashes');}
  else{
   const value=flag=>args[args.indexOf(flag)+1];
   if(!args.includes('--version')||!args.includes('--build'))throw Error('Usage: npm run release:prepare -- --version 7.7.0 --build 39700 --title "Release title" [--dry-run]');
   const changes=plan(root,{version:value('--version'),build:Number(value('--build')),title:args.includes('--title')?value('--title'):undefined});
   console.log((args.includes('--dry-run')?'Would update: ':'Updating: ')+([...changes.keys()].join(', ')||'already consistent'));
   if(!args.includes('--dry-run'))write(root,changes);
  }
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={assetPaths,manifest,plan,write,check};
