const fs=require('node:fs'),path=require('node:path'),{spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),target=process.argv[2]||'simulator';
if(!['simulator','device'].includes(target))throw Error('Choose simulator or device');
if(process.platform!=='darwin')throw Error('iOS compilation requires macOS/Xcode. Use the Loadnote iOS compilation GitHub workflow.');
const output=path.join(root,'build-ios',target),derived=path.join(output,'DerivedData'),sdk=target==='simulator'?'iphonesimulator':'iphoneos';
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
const toolchain=execFileSync('xcodebuild',['-version'],{encoding:'utf8'})+'\nSDK: '+execFileSync('xcrun',['--sdk',sdk,'--show-sdk-version'],{encoding:'utf8'});
fs.writeFileSync(path.join(output,'toolchain.txt'),toolchain);process.stdout.write(toolchain);
const result=spawnSync('xcodebuild',[
 '-project','ios/App/App.xcodeproj','-scheme','App','-configuration','Release',
 '-sdk',sdk,'-destination',target==='simulator'?'generic/platform=iOS Simulator':'generic/platform=iOS',
 '-derivedDataPath',derived,'-clonedSourcePackagesDirPath',path.join(output,'SourcePackages'),
 '-resultBundlePath',path.join(output,'Build.xcresult'),
 'CODE_SIGNING_ALLOWED=NO','CODE_SIGNING_REQUIRED=NO','CODE_SIGN_IDENTITY=',
 'COMPILER_INDEX_STORE_ENABLE=NO','build'
],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:25*60*1000});
const logs=(result.stdout||'')+'\n'+(result.stderr||'');fs.writeFileSync(path.join(output,'build.log'),logs);process.stdout.write(logs);
if(result.error||result.status!==0){console.error(result.error||'Xcode compilation failed');process.exit(result.status||1);}
const app=path.join(derived,'Build/Products','Release-'+sdk,'App.app');
const info=JSON.parse(execFileSync('plutil',['-convert','json','-o','-',path.join(app,'Info.plist')],{encoding:'utf8'}));
const {verifyIosBundle}=require('./verify-ios-bundle');
const report=verifyIosBundle(app,info,target);
fs.writeFileSync(path.join(output,'build-report.json'),JSON.stringify({...report,toolchain},null,2));
console.log('Unsigned iOS compilation and bundled-resource verification passed. No signing, launch, device test or distribution was performed.');
