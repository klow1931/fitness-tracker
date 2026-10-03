const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {verifyIosBundle}=require('../scripts/verify-ios-bundle');
const app=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-ios-fixture-'));
const options={version:'2.86.0',buildNumber:28600,appId:'app.loadnote.mobile'};
const info={CFBundleIdentifier:options.appId,CFBundleShortVersionString:options.version,CFBundleVersion:'28600',CFBundleExecutable:'App',CFBundleSupportedPlatforms:['iPhoneSimulator']};
try{
 for(const file of ['PrivacyInfo.xcprivacy','public/index.html','public/assets/capacitor.js','public/src/product/native-backup.js']){fs.mkdirSync(path.dirname(path.join(app,file)),{recursive:true});fs.writeFileSync(path.join(app,file),'fixture');}
 fs.writeFileSync(path.join(app,'App'),Buffer.from('cffaedfe00000000','hex'));fs.writeFileSync(path.join(app,'capacitor.config.json'),JSON.stringify({appId:options.appId}));
 assert.equal(verifyIosBundle(app,info,'simulator',options).physicalDeviceTested,false);
 assert.throws(()=>verifyIosBundle(app,{...info,CFBundleVersion:'1'},'simulator',options));
 assert.throws(()=>verifyIosBundle(app,info,'device',options));
 fs.writeFileSync(path.join(app,'capacitor.config.json'),JSON.stringify({appId:options.appId,server:{url:'https://example.test'}}));assert.throws(()=>verifyIosBundle(app,info,'simulator',options),/live server/);
 fs.writeFileSync(path.join(app,'capacitor.config.json'),JSON.stringify({appId:options.appId}));
 fs.mkdirSync(path.join(app,'_CodeSignature'));assert.throws(()=>verifyIosBundle(app,info,'simulator',options),/signed app/);fs.rmdirSync(path.join(app,'_CodeSignature'));
 fs.unlinkSync(path.join(app,'PrivacyInfo.xcprivacy'));assert.throws(()=>verifyIosBundle(app,info,'simulator',options));
 console.log('Synthetic iOS bundle validation rejects version/platform drift, live-server configuration, signing and missing privacy resources; no native compilation claimed by these fixtures.');
}finally{fs.rmSync(app,{recursive:true,force:true});}
