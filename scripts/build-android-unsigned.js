const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'build-android'),sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
if(!sdk)throw Error('Android SDK is required. Use the Loadnote Android compilation GitHub workflow.');
const apk=path.join(root,'android/app/build/outputs/apk/release/app-release-unsigned.apk');
const analyzer=path.join(sdk,'cmdline-tools/latest/bin/apkanalyzer'),signer=path.join(sdk,'build-tools/36.0.0/apksigner');
for(const tool of [analyzer,signer])if(!fs.existsSync(tool))throw Error('Missing SDK tool '+path.basename(tool));
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
const java=spawnSync('java',['-version'],{encoding:'utf8'}),javaVersion=(java.stderr||'')+(java.stdout||'');
if(java.status!==0||!/(?:version|openjdk) "?21[.\s"]/.test(javaVersion))throw Error('Use JDK 21 for the locked Capacitor 7 Android project');
const gradle=execFileSync('bash',['./gradlew','--version','--no-daemon'],{cwd:path.join(root,'android'),encoding:'utf8'});
fs.writeFileSync(path.join(output,'toolchain.txt'),javaVersion+'\n'+gradle+'\nSDK baseline: API 36 / build-tools 36.0.0\n');
// Never accept a stale APK as compilation evidence.
fs.rmSync(apk,{force:true});
const result=spawnSync('bash',['./gradlew',':app:assembleRelease','--no-daemon','--stacktrace'],{cwd:path.join(root,'android'),encoding:'utf8',maxBuffer:64*1024*1024,timeout:25*60*1000});
const logs=(result.stdout||'')+'\n'+(result.stderr||'');fs.writeFileSync(path.join(output,'build.log'),logs);process.stdout.write(logs);
if(result.error||result.status!==0){console.error(result.error||'Android compilation failed');process.exit(result.status||1);}
const manifest=execFileSync(analyzer,['manifest','print',apk],{encoding:'utf8'});fs.writeFileSync(path.join(output,'manifest.xml'),manifest);
execFileSync('unzip',['-t',apk],{stdio:'pipe'});
const files=execFileSync('unzip',['-Z1',apk],{encoding:'utf8'}).trim().split('\n');
const config=JSON.parse(execFileSync('unzip',['-p',apk,'assets/capacitor.config.json'],{encoding:'utf8'}));
const dex=execFileSync('unzip',['-p',apk,'classes.dex'],{maxBuffer:64*1024*1024});
const signature=spawnSync(signer,['verify',apk],{encoding:'utf8'});if(signature.error)throw signature.error;
const report=require('./verify-android-bundle').verifyAndroidBundle({manifest,files,config,dexMagic:dex.subarray(0,4).toString('hex'),signatureVerified:signature.status===0,signatureOutput:(signature.stdout||'')+(signature.stderr||'')});
fs.writeFileSync(path.join(output,'build-report.json'),JSON.stringify({...report,apkSha256:crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex')},null,2));
console.log('Unsigned Android compilation and APK verification passed. No signing, launch, device testing or distribution performed.');
