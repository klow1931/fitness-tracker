const {defineConfig}=require('playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',fullyParallel:true,retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{baseURL:'http://127.0.0.1:8000',trace:'retain-on-failure',serviceWorkers:'block'},
  projects:[{name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1280,height:900}}},{name:'mobile-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},...(process.env.LOADNOTE_WEBKIT?[{name:'mobile-webkit',testMatch:['beginner-program.spec.js','beginner-first-week.spec.js','beginner-experience.spec.js','beginner-review-fixes.spec.js','review-v391-regressions.spec.js','program-review-fixes.spec.js','coach-clarity.spec.js','native-restore.spec.js','first-week.spec.js','mobile-navigation.spec.js','guided-programming-ux.spec.js','coach-action-navigation.spec.js','calendar-day-actions.spec.js','iphone-interface.spec.js','v398-gym-floor.spec.js','offline-planning.spec.js','appearance.spec.js'],use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]:[])],
  webServer:{command:'node scripts/serve.js',url:'http://127.0.0.1:8000',reuseExistingServer:!process.env.CI}
});
