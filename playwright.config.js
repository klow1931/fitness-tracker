const {defineConfig}=require('playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',fullyParallel:true,retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{baseURL:'http://127.0.0.1:8000',trace:'retain-on-failure',serviceWorkers:'block'},
  projects:[{name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1280,height:900}}},{name:'mobile-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
  webServer:{command:'node scripts/serve.js',url:'http://127.0.0.1:8000',reuseExistingServer:!process.env.CI}
});
