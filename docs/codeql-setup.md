# CodeQL configuration handoff

The existing GitHub-managed default Swift scanner fails because it runs an automatic native build without installing the npm-managed Capacitor dependencies. The ordinary iOS compilation workflow already installs them successfully.

The prepared `.github/workflows/codeql.yml` installs dependencies, synchronizes native assets, initializes Swift analysis in manual mode, and builds the actual iOS app with signing and Swift compile caches disabled. It retains Actions, JavaScript/TypeScript, Python and Java analysis. The app has Java native sources, not Kotlin; introduce a manual Kotlin build if Kotlin sources are added.

Pull requests generate SARIF artifacts without uploading competing code-scanning results. This verifies the prepared scanner without claiming to replace GitHub's currently enabled default setup.

## One repository-admin action before merging

In the repository's Settings → Advanced Security → CodeQL analysis, choose **Switch to advanced** and disable the existing default setup, then use the workflow already prepared in this PR. Do not add a second generated workflow. GitHub does not accept advanced scan uploads while default setup is active. The connected repository tools can edit workflows but cannot change this administration setting.

After merge, the workflow runs on pushes to `main` and uploads all five language results. It also runs on pull requests and can be dispatched manually; enable `upload-results` for manual uploads only after the setup switch. Confirm the Swift analysis succeeds and results appear in Security before calling this issue resolved. No vulnerability-free or device-acceptance claim follows from a successful scan.

Official references:
- https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning
- https://docs.github.com/en/code-security/tutorials/customize-code-scanning/prepare-code-for-analysis
