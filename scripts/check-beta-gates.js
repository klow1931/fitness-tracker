/* Phase 6 release-candidate gate. Source checks cannot certify a real device. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function check(base=root){
 const read=p=>fs.readFileSync(path.join(base,p),'utf8');
 const pkg=JSON.parse(read('package.json')),native=JSON.parse(read('native-beta.json'));
 const index=read('index.html'),sw=read('sw.js'),readme=read('README.md');
 const checks=[
  {id:'release-consistency',ok:read('src/release.js').includes("version:'"+pkg.version+"'")&&readme.includes('v'+pkg.version)},
  {id:'offline-assets',ok:index.includes('src/product/device-records.js')&&sw.includes("'./src/product/device-records.js'")},
  {id:'local-save-guard',ok:read('src/product/state-store.js').includes('expectedProjectFingerprint')},
  {id:'sync-conflicts',ok:read('src/product/account-ui.js').includes('Training changed during sync')&&read('src/product/sync-coordinator.js').includes('expectedLocalFingerprint')},
  {id:'backup-manifest',ok:read('src/product/data-integrity.js').includes('verifyBackupManifest')},
  {id:'single-host-durable-files',ok:read('backend/account-store.js').includes("require('./atomic-file')")&&read('backend/sync-store.js').includes("require('./atomic-file')")},
  {id:'native-local-only',ok:native.stage==='unsigned-development'&&native.storeReady===false&&native.services==='local-only'&&read('src/product/account-ui.js').includes('Native beta: local training only.')},
  {id:'physical-acceptance-unclaimed',ok:fs.existsSync(path.join(base,'docs/phase6-athlete-beta-acceptance.md'))},
  {id:'custom-weekly-data-portability',ok:read('src/product/sync-model.js').includes("'customProgramWeeklyReviews'")&&read('src/product/data-integrity.js').includes("'customProgramWeeklyReviews'")&&read('src/product/data-transfer.js').includes('LoadnoteCustomProgramWeeklyReview.validateState')},
  {id:'android-athlete-pilot-gate',ok:fs.existsSync(path.join(base,'docs/android-v3.73-pilot.md'))&&read('android/app/src/androidTest/java/app/loadnote/mobile/BetaJourneyTest.java').includes('LoadnoteCustomProgramWeeklyReview.save')&&read('sw.js').includes("'./src/product/custom-program-weekly-review.js'")}
 ];
 const pending=[
  'Physical Android and iOS cold-launch, save/relaunch, unit entry and export/restore acceptance',
  'Real OIDC provider, single-instance production volume, restore drills and backup-retention review',
  'Privacy, accessibility, permissions, Play/App Store declarations, signing and private beta distribution',
  'Multi-athlete training feedback and reliability evidence; no effectiveness claim before measurement'
 ];
 return {version:pkg.version,status:checks.every(x=>x.ok)?'source-gates-pass':'blocked',checks,pendingManual:pending};
}
if(require.main===module){const report=check();for(const c of report.checks)console.log((c.ok?'PASS ':'FAIL ')+c.id);console.log('Still requires human/device acceptance: '+report.pendingManual.length+' categories');if(report.status!=='source-gates-pass')process.exitCode=1;}
module.exports={check};
