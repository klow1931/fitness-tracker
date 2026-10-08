// Explicitly destructive only to a disposable .beta sandbox on an emulator.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'build-android-emulator'),serial=process.env.ANDROID_SERIAL;
if(!process.argv.includes('--disposable-beta'))throw Error('Acceptance clears synthetic beta data. Pass --disposable-beta only on a disposable emulator.');
if(!/^emulator-\d+$/.test(serial||''))throw Error('ANDROID_SERIAL must identify a disposable emulator, never hardware.');
const adb=(...args)=>execFileSync('adb',['-s',serial,...args],{encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
if(adb('shell','getprop','ro.kernel.qemu').trim()!=='1')throw Error('Refusing non-emulator target');
const appId=require('../capacitor.config.json').appId+'.beta',apk=path.join(root,'android/app/build/outputs/apk/debug/app-debug.apk'),testApk=path.join(root,'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk');
for(const file of [apk,testApk])if(!fs.existsSync(file))throw Error('Build the beta and test APKs first');
fs.mkdirSync(output,{recursive:true});
const test=(name,label)=>{
 const text=adb('shell','am','instrument','-w','-e','class','app.loadnote.mobile.'+name,appId+'.test/androidx.test.runner.AndroidJUnitRunner');
 fs.writeFileSync(path.join(output,label+'.txt'),text);process.stdout.write(text);
 if(!/OK \(1 test\)/.test(text)||/FAILURES!!!|INSTRUMENTATION_FAILED/.test(text))throw Error(label+' instrumentation failed');
};
try {
 adb('install','-r',apk);adb('install','-r',testApk);adb('shell','pm','clear',appId);
 adb('shell','cmd','connectivity','airplane-mode','enable');
 adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');
 test('BetaJourneyTest','offline-journey');
 adb('shell','am','force-stop',appId);test('BetaColdStartTest','force-stop-cold-start');
 // Same artifact/certificate update without clearing application storage.
 adb('install','-r',apk);adb('shell','am','force-stop',appId);test('BetaColdStartTest','same-certificate-upgrade');
 fs.writeFileSync(path.join(output,'acceptance.json'),JSON.stringify({version:require('../package.json').version,appId,serial,apiLevel:adb('shell','getprop','ro.build.version.sdk').trim(),emulator:true,offlineJourney:true,nativeFilesystemCacheRoundtrip:true,reviewedImport:true,activityRecreation:true,forceStopColdStart:true,sameCertificateUpgrade:true,externalPickerAndShare:false,physicalKeyboardAndTouch:false,talkBack:false,physicalDeviceTested:false,storeReady:false},null,2));
 console.log('Synthetic offline Android emulator acceptance passed; external sharing and physical-device gates remain open.');
} finally { adb('shell','cmd','connectivity','airplane-mode','disable');adb('shell','svc','wifi','enable');adb('shell','svc','data','enable'); }
