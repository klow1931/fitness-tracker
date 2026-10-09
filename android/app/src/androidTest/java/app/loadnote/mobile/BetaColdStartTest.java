package app.loadnote.mobile;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Assume;
import org.junit.Test;
import org.junit.runner.RunWith;
@RunWith(AndroidJUnit4.class)
public class BetaColdStartTest extends BetaHarness {
    @Test public void forceStopAndSameCertificateUpgradeKeepReviewedRecordsAndDraft() throws Exception {
        Assume.assumeTrue("Requires fixture from the disposable beta runner", "cold".equals(InstrumentationRegistry.getArguments().getString("betaPhase")));
        assertState();
    }
}
