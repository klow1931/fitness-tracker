// Required release-build acceptance and repeatable approved-live smoke share one journey.
const {defineConfig}=require('playwright/test');
const live=process.env.LOADNOTE_OFFLINE_URL;
if(live){const u=new URL(live);if(u.href!=='https://klow1931.github.io/fitness-tracker/')throw Error('Live smoke is restricted to the approved Loadnote URL');}
module.exports=defineConfig({
 testDir:'./tests/browser',testMatch:'offline.spec.js',grep:/Real assets recover exact offline workout/,
 workers:1,retries:0,timeout:120000,fullyParallel:false,
 reporter:[['list'],['html',{open:'never',outputFolder:live?'playwright-report/offline-live':'playwright-report/offline-release'}]],
 outputDir:live?'test-results/offline-live':'test-results/offline-release',
 use:{timezoneId:'UTC',serviceWorkers:'allow',trace:'on',screenshot:'only-on-failure'},
 // WebKit release coverage stops its dedicated origin, because setOffline blocks
 // worker responses in this pinned engine. Live smoke cannot stop a remote server.
 projects:[{name:'mobile-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},...(!live?[{name:'mobile-webkit',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]:[])]
});
