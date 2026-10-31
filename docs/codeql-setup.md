# CodeQL analysis and publication

## Why the v5.0 main checks failed

The advanced workflow completed analyses but GitHub rejected its SARIF uploads because default CodeQL setup was still enabled. GitHub does not accept competing advanced CodeQL uploads while default setup is active. This is a publication configuration conflict, not evidence of a newly detected application vulnerability.

## Compatible workflow behavior in v5.3

The workflow retains Actions, JavaScript/TypeScript, Python and Java analysis, plus a manual Swift/Xcode build with Capacitor dependencies installed and compile caches disabled. Kotlin sources require an explicit traced build if introduced. Analysis failures still fail checks; no scanner or repository setting is disabled.

Pull requests and ordinary manual runs retain the five SARIF reports as reviewable artifacts without publishing competing results. On a push, the publication policy reads default-setup configuration when the workflow token has permission:

- `configured`: retain artifacts, report a warning, leave GitHub-managed default scanning unchanged.
- `not-configured`: upload the advanced analysis to Security.
- Administration-read unavailable (403/404): retain artifacts and explicitly report that advanced publication is unverified.
- Unexpected API errors or unknown configuration values: fail rather than assume publication is safe.

The standard workflow token may not have Administration read. A green prepared-analysis job therefore establishes analysis/artifact generation, not that every language was published in the Security UI. The job summary identifies the selected publication mode. SARIF artifacts are retained for seven days.

## Publishing the advanced results

An administrator can go to Settings → Advanced Security → CodeQL analysis → **Switch to advanced**, disable default setup, and keep the existing workflow rather than adding a second generated one. Then dispatch **Loadnote CodeQL** with **upload-results** enabled. This explicit manual request can upload even when the workflow token cannot inspect the admin setting; GitHub still validates the upload and rejects it if default setup remains active. A confirmed active default configuration blocks the explicit request with a clear error.

Verify all five language results appear in Security before calling advanced publication complete. The connected repository tools cannot change the administrator setting. No new credential or elevated token is requested by this workflow.

Official references:

- https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning
- https://docs.github.com/en/rest/code-scanning/code-scanning#get-a-code-scanning-default-setup-configuration
- https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/troubleshoot-sarif-uploads/default-setup-enabled
