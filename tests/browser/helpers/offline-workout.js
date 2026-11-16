/* One real-service-worker journey shared by release and deployed-site checks.
 * Fresh Playwright contexts contain synthetic records only; no intercepted assets,
 * seeded history, disabled workers, or model downloads make this test pass. */
const {expect}=require('playwright/test');
const {waitForOfflineReady}=require('./offline-ready');
const {assertSavedWorkout}=require('./offline-workout-contract');
const release=require('../../../release.json');
async function networkReachable(page){
 return page.evaluate(async()=>{try{await fetch('./__loadnote_offline_network_probe__?attempt='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(3000)});return true;}catch{return false;}});
}
async function runOfflineWorkout({page,context,browserName},testInfo,{origin,disconnect,reconnect}){
 const evidence={targetURL:origin,sourceCommit:process.env.LOADNOTE_SOURCE_COMMIT||process.env.GITHUB_SHA||null,testedCommit:process.env.GITHUB_SHA||null,version:release.version,buildNumber:release.buildNumber,browser:browserName,project:testInfo.project.name,network:browserName==='webkit'?'dedicated loopback server stopped; WebKit service-worker/network-emulation limitation':'BrowserContext.setOffline(true/false)',stages:[]};
 const errors=[],modelRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/huggingface\.co|mlc-ai\.github\.io\/.*models|\.(?:safetensors|bin|gguf)(?:\?|$)/i.test(r.url()))modelRequests.push(r.url());});
 try{
  await page.goto(origin);await expect(page.locator('.ex-name')).toHaveCount(1);
  // Check target identity before writing even isolated synthetic data.
  const remote=await page.evaluate(async()=>{const r=await fetch('./release.json',{cache:'no-store'});if(!r.ok)throw Error('Release manifest unavailable');return r.json();});
  expect(remote).toEqual(release);await waitForOfflineReady(page);evidence.stages.push('exact release and all offline files ready under controlling worker');
  await page.locator('[data-beginner-entry=log]').click();
  await page.evaluate(()=>{data.gymMode=true;data.gymModeUserSet=true;setUnit('lb');});
  await page.locator('.ex-name').fill('Offline Acceptance Press');
  await page.locator('.set-weight').fill('135');await page.locator('.set-reps').fill('5');await page.locator('.set-rpe').fill('8');await page.locator('.set-rpe').blur();
  await page.locator('[data-quick-complete]:visible').click();
  await page.locator('#training-cockpit').getByRole('button',{name:'Workout options'}).click();await expect(page.locator('#logger-draft-status')).toContainText('Draft saved');
  await page.locator('#training-cockpit').getByRole('button',{name:'Close options'}).click();
  expect(await page.evaluate(()=>data.workouts.length)).toBe(0);evidence.stages.push('135 lb ×5 @8 draft saved online; no completed history');
  await disconnect(context);await expect.poll(()=>networkReachable(page)).toBe(false);const response=await page.reload();expect(response.fromServiceWorker()).toBe(true);
  // navigator.onLine can reset to true after a Chromium worker-served reload.
  // This uncached non-asset path bypasses worker handling, avoiding WebKit
  // reporting our deliberately rejected worker promise as an app pageerror.
  // Require actual network fetch rejection before AND after reload.
  await expect.poll(()=>networkReachable(page)).toBe(false);evidence.browserReportedOnlineAfterOfflineReload=await page.evaluate(()=>navigator.onLine);
  await page.evaluate(()=>showTab('workouts'));
  await expect(page.locator('.ex-name')).toHaveValue('Offline Acceptance Press');await expect(page.locator('.set-weight')).toHaveValue('135');await expect(page.locator('.set-reps')).toHaveValue('5');await expect(page.locator('.set-rpe')).toHaveValue('8');await expect(page.locator('.set-done-check')).toBeChecked();
  expect(await page.evaluate(()=>currentUnit())).toBe('lb');evidence.stages.push('disconnected reload served by real worker; exact completed draft set recovered');
  // Preserve the previous real-offline timer coverage.
  // The completed set already started the real rest timer; its legacy start
  // preset is intentionally hidden while it is running. Use the visible cockpit.
  await expect(page.locator('#training-cockpit [data-cockpit-rest]')).toBeVisible();await page.locator('#training-cockpit [data-cockpit-rest-pause]').click();await expect(page.locator('#training-cockpit [data-cockpit-rest]')).toContainText('paused');
  await page.locator('[data-continuation-set]').click();await page.locator('.set-weight').nth(1).fill('140');await page.locator('.set-reps').nth(1).fill('3');await page.locator('.set-rpe').nth(1).fill('9');await page.locator('.set-rpe').nth(1).blur();await page.locator('[data-quick-complete]:visible').click();
  await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-recap')).toContainText('Workout saved. Nice work.');await expect(page.locator('#device-save-status')).toHaveText('Saved on this device');
  let workouts=await page.evaluate(()=>data.workouts);assertSavedWorkout(workouts);const history=JSON.stringify(workouts);evidence.stages.push('second set140 lb ×3 @9 entered and session durably saved while disconnected');
  // Preserve real bundled chart and light/dark layout coverage from this journey.
  await page.evaluate(()=>{showTab('dashboard');document.getElementById('progress-exercise').value='Offline Acceptance Press';renderProgressChart();});expect(await page.evaluate(()=>Chart.version)).toBe('4.4.1');expect(await page.evaluate(()=>Chart.getChart(document.querySelector('#progressChart'))?.data.datasets[0].data.length)).toBe(1);
  for(const dark of [false,true]){await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
  // A second disconnected load proves completed history is durable, not just RAM.
  const savedResponse=await page.reload();expect(savedResponse.fromServiceWorker()).toBe(true);await expect(page.locator('.ex-name')).toHaveCount(1);workouts=await page.evaluate(()=>data.workouts);assertSavedWorkout(workouts);expect(JSON.stringify(workouts)).toBe(history);
  await page.locator('#coach-companion-launcher').click();await page.locator('#cc-input').fill('Summarize my training');await page.locator('#cc-form button').click();await expect(page.locator('#cc-messages .assistant').last()).toContainText('What happened');expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(history);expect(modelRequests).toEqual([]);evidence.stages.push('saved history survives second disconnected load; useful local Coach responds without LLM download');
  await reconnect(context);await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);await expect.poll(()=>networkReachable(page)).toBe(true);expect(await page.evaluate(()=>navigator.onLine)).toBe(true);assertSavedWorkout(await page.evaluate(()=>data.workouts));expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(history);expect(await page.evaluate(()=>currentUnit())).toBe('lb');
  expect(errors).toEqual([]);evidence.stages.push('reconnected/reloaded; exactly one unchanged workout, both kg loads/reps/RPE and lb preference intact');evidence.passed=true;
 }finally{
  // Attach even on failure; browser trace records the real network transition.
  evidence.errors=errors;await testInfo.attach('offline-workout-evidence',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
  // Cleanup must not replace the original assertion/timeout with a closed-context error.
  await reconnect(context).catch(()=>{});
 }
}
module.exports={runOfflineWorkout};
