package app.loadnote.mobile;

import androidx.test.core.app.ActivityScenario;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.After;
import org.junit.Before;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Instrumented real WebView/bridge tests with disposable synthetic data only.
 * DOM actions do not establish touch keyboard, TalkBack or external picker acceptance. */
public class BetaHarness {
    protected ActivityScenario<MainActivity> scenario;
    @Before public void launch() throws Exception {
        scenario=ActivityScenario.launch(MainActivity.class);
        waitFor("typeof data!=='undefined' && !!window.LoadnoteRuntime?.native && !!document.querySelector('.ex-name')");
        js("(()=>{document.getElementById('native-welcome-dismiss')?.click();return true;})()");
    }
    @After public void close() { if(scenario!=null)scenario.close(); }
    protected JSONObject js(String expression) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        AtomicReference<String> result=new AtomicReference<>();
        String script="(()=>{try{return JSON.stringify({ok:true,value:("+expression+")});}catch(e){return JSON.stringify({ok:false,error:String(e)});}})()";
        scenario.onActivity(activity->activity.getBridge().getWebView().evaluateJavascript(script,value->{result.set(value);latch.countDown();}));
        assertTrue("WebView callback timed out",latch.await(10,TimeUnit.SECONDS));
        Object decoded=new JSONTokener(result.get()).nextValue();
        assertTrue("WebView returned no JSON",decoded instanceof String);
        JSONObject value=new JSONObject((String)decoded);
        assertTrue(value.optString("error"),value.getBoolean("ok"));return value;
    }
    protected void waitFor(String predicate) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(30);
        do { if(js("Boolean("+predicate+")").getBoolean("value"))return;Thread.sleep(100); } while(System.nanoTime()<deadline);
        fail("Timed out waiting for: "+predicate);
    }
    protected void async(String body) throws Exception {
        js("(()=>{window.betaAsync={done:false};(async()=>{"+body+"})().then(()=>window.betaAsync={done:true},e=>window.betaAsync={done:true,error:String(e)});return true;})()");
        waitFor("window.betaAsync?.done");assertFalse(js("window.betaAsync").getJSONObject("value").has("error"));
    }
    protected void assertState() throws Exception {
        waitFor("data.workouts.length===1 && data.workouts[0].exercises[0].sets[0].weight===100.25 && !!readLoggerDraft()");
        assertEquals("103",js("readLoggerDraft().rows[0].sets[0].weight").getString("value"));
        assertEquals("5",js("readLoggerDraft().rows[0].sets[0].reps").getString("value"));
        assertEquals(5,js("LoadnoteProgrammingProfile.current(data.programmingProfiles).context.intake.years").getInt("value"));
        assertTrue(js("data.recoverySnapshots.length>0").getBoolean("value"));
    }
}
