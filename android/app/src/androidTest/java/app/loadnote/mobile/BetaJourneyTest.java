package app.loadnote.mobile;

import androidx.lifecycle.Lifecycle;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class BetaJourneyTest extends BetaHarness {
    @Test public void athleteLoggerBackupRestoreAndActivityLifecycle() throws Exception {
        assertEquals("android",js("LoadnoteRuntime.nativePlatform").getString("value"));
        // navigator.onLine can remain true in a packaged WebView without proving reachability.
        async("const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);let reached=false;try{await fetch('https://example.com/loadnote-offline-probe',{mode:'no-cors',cache:'no-store',signal:controller.signal});reached=true;}catch{}finally{clearTimeout(timer);}if(reached)throw Error('External network reachable during offline acceptance');");
        js("(()=>{showTab('profile');document.getElementById('profile-athlete-intake').click();return true;})()");
        waitFor("document.getElementById('intake-setup-dialog')?.open");
        js("(()=>{document.querySelector('[data-intake-setup]').click();return true;})()");
        waitFor("document.getElementById('programming-profile-dialog')?.open");
        js("(()=>{document.querySelector('#programming-profile-dialog button[type=submit]').click();return true;})()");
        waitFor("document.getElementById('athlete-intake-dialog')?.open");
        js("(()=>{document.getElementById('intake-years').value='5';document.getElementById('intake-confirm').checked=true;document.querySelector('#athlete-intake-form button[type=submit]').click();return true;})()");
        waitFor("!document.getElementById('athlete-intake-dialog').open");
        js("(()=>{openFastStartLogger({compact:false});const fields={'.ex-name':'Competition Bench Press','.set-reps':'5','.set-weight':'100.25','.set-rpe':'8'};for(const [s,v] of Object.entries(fields)){const el=document.querySelector(s);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('wo-notes').value='Synthetic Android beta acceptance';saveLoggerDraft();reviewWorkout();return true;})()");
        waitFor("document.getElementById('workout-review')?.open");
        js("(()=>{document.getElementById('confirm-workout-save').click();return true;})()");
        waitFor("data.workouts.length===1 && !document.getElementById('workout-review').open && !readLoggerDraft()");
        // Real native filesystem plugin, cache only. No claim of external sharing/picker delivery.
        async("const F=Capacitor.registerPlugin('Filesystem');const payload=LoadnoteIntegrity.addBackupManifest({...data,recoverySnapshots:[],progressPhotos:[]},{releaseVersion:LoadnoteCore.RELEASE_VERSION});const path='loadnote-exports/loadnote-emulator.json';await F.writeFile({path,directory:'CACHE',data:JSON.stringify(payload),encoding:'utf8',recursive:true});const file=await F.readFile({path,directory:'CACHE',encoding:'utf8'});if(!LoadnoteIntegrity.verifyBackupManifest(JSON.parse(file.data)).verified)throw Error('Backup fingerprint failed');window.betaBackup=file.data;data={...data,workouts:[]};await persistNow(data);");
        String upload="(()=>{handleImport({target:{files:[new File([window.betaBackup],'loadnote-emulator.json',{type:'application/json'})],value:''}});return true;})()";
        js(upload);waitFor("document.getElementById('import-review')?.open");
        assertTrue(js("document.querySelector('[data-import-check=backup]').textContent.includes('verified')").getBoolean("value"));
        js("(()=>{document.getElementById('cancel-import-review').click();return true;})()");
        assertEquals(0,js("data.workouts.length").getInt("value"));
        js(upload);waitFor("document.getElementById('import-review')?.open");
        js("(()=>{document.getElementById('confirm-import-review').click();return true;})()");
        waitFor("data.workouts.length===1 && !document.getElementById('import-review').open");
        js("(()=>{openFastStartLogger({compact:false});const fields={'.ex-name':'Competition Bench Press','.set-reps':'5','.set-weight':'103','.set-rpe':'7'};for(const [s,v] of Object.entries(fields)){const el=document.querySelector(s);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}saveLoggerDraft();return true;})()");
        assertState();scenario.moveToState(Lifecycle.State.CREATED);scenario.moveToState(Lifecycle.State.RESUMED);assertState();
        scenario.recreate();waitFor("typeof data!=='undefined' && !!document.querySelector('.ex-name')");assertState();
        js("(()=>{for(const name of ['coach','profile','dashboard','prs','workouts'])showTab(name);return true;})()");
        assertTrue(js("!document.body.classList.contains('mobile-keyboard-open')").getBoolean("value"));
    }
}
