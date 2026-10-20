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
        waitFor("!document.getElementById('athlete-intake-dialog')?.open");
        js("(()=>{openFastStartLogger({compact:false});const fields={'.ex-name':'Competition Bench Press','.set-reps':'5','.set-weight':'100.25','.set-rpe':'8'};for(const [s,v] of Object.entries(fields)){const el=document.querySelector(s);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('wo-notes').value='Synthetic Android beta acceptance';saveLoggerDraft();reviewWorkout();return true;})()");
        waitFor("document.getElementById('workout-review')?.open");
        js("(()=>{document.getElementById('confirm-workout-save').click();return true;})()");
        waitFor("data.workouts.length===1 && !document.getElementById('workout-review')?.open && !readLoggerDraft()");
        // v3.73: a past synthetic program week can be reviewed and checked in
        // without touching its Calendar prescriptions, even while offline.
        async("const d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)-14);const startDate=d.toISOString().slice(0,10);const raw={name:'Disposable beta review',weeks:2,startDate,unit:'kg',rows:[{week:1,day:'Monday',exercise:'Competition Squat',sets:3,reps:5,weight:100,rpe:8},{week:2,day:'Monday',exercise:'Competition Squat',sets:3,reps:5,weight:102.5,rpe:8}]};let next=LoadnoteCustomProgram.save(data,LoadnoteCustomProgram.build(data,raw),{confirmed:true,id:'beta-custom-week'});next=LoadnoteCustomProgram.schedule(next,'beta-custom-week');const before=JSON.stringify(next.scheduledSessions);next=LoadnoteCustomProgramWeeklyReview.save(next,'beta-custom-week',1,{sleep:'unknown',fatigue:'usual',soreness:'unknown',sessionExperience:'modified',notes:'Synthetic offline Android beta review'},{asOf:today(),confirmed:true});if(JSON.stringify(next.scheduledSessions)!==before)throw Error('Weekly feedback changed Calendar');await persistNow(next);data=next;if(LoadnoteCustomProgramWeeklyReview.inspect(data,'beta-custom-week',{week:1,asOf:today()}).checkInCount!==1)throw Error('Weekly check-in missing');");
        // Real native filesystem plugin, cache only. No claim of external sharing/picker delivery.
        async("const F=Capacitor.registerPlugin('Filesystem');const payload=LoadnoteIntegrity.addBackupManifest({...data,recoverySnapshots:[],progressPhotos:[]},{releaseVersion:LoadnoteCore.RELEASE_VERSION});const path='loadnote-exports/loadnote-emulator.json';await F.writeFile({path,directory:'CACHE',data:JSON.stringify(payload),encoding:'utf8',recursive:true});const file=await F.readFile({path,directory:'CACHE',encoding:'utf8'});if(!LoadnoteIntegrity.verifyBackupManifest(JSON.parse(file.data)).verified)throw Error('Backup fingerprint failed');window.betaBackup=file.data;data={...data,workouts:[],customProgramWeeklyReviews:[]};await persistNow(data);");
        String upload="(()=>{handleImport({target:{files:[new File([window.betaBackup],'loadnote-emulator.json',{type:'application/json'})],value:''}});return true;})()";
        js(upload);waitFor("document.getElementById('import-review')?.open");
        assertTrue(js("document.querySelector('[data-import-check=backup]').textContent.includes('verified')").getBoolean("value"));
        js("(()=>{document.getElementById('cancel-import-review').click();return true;})()");
        assertEquals(0,js("data.workouts.length").getInt("value"));
        js(upload);waitFor("document.getElementById('import-review')?.open");
        js("(()=>{document.getElementById('confirm-import-review').click();return true;})()");
        waitFor("data.workouts.length===1 && data.customProgramWeeklyReviews.length===1 && !document.getElementById('import-review')?.open");
        js("(()=>{openFastStartLogger({compact:false});const fields={'.ex-name':'Competition Bench Press','.set-reps':'5','.set-weight':'103','.set-rpe':'7'};for(const [s,v] of Object.entries(fields)){const el=document.querySelector(s);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}saveLoggerDraft();return true;})()");
        assertState();scenario.moveToState(Lifecycle.State.CREATED);scenario.moveToState(Lifecycle.State.RESUMED);assertState();
        scenario.recreate();waitFor("typeof data!=='undefined' && !!document.querySelector('.ex-name')");assertState();
        js("(()=>{for(const name of ['coach','profile','dashboard','prs','workouts'])showTab(name);return true;})()");
        assertTrue(js("!document.body.classList.contains('mobile-keyboard-open')").getBoolean("value"));
    }
}
