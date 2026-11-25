# Pages publisher recovery

The November 11, 2026 review found v7.7.0's manifest online but five generated
vendor assets missing. The custom Publish Loadnote web workflow verified all 319
assets on November 10 at 23:21:56 UTC. A separate branch/Jekyll Pages deployment
completed at 23:22:01 UTC. Generated vendor files are intentionally ignored by
git and are built during `npm ci`; the branch publisher does not build them.
See weekly tracker #264 for evidence and current status.

Before an explicitly approved republish, inspect repository **Settings → Pages →
Build and deployment → Source**. It must be **GitHub Actions**, so the custom
workflow is the single publisher. Do not enable a branch/Jekyll publisher in
parallel. The source guard reads this setting and blocks publication for legacy,
unknown, unreadable or inaccessible settings. It never changes hosting settings.

After the owner approves publishing the latest merged release through **Publish
Loadnote web**, run `npm ci` and
`npm run release:verify -- https://klow1931.github.io/fitness-tracker/` from that
exact release checkout. Require every asset to match, then repeat after any
competing deployment has finished. The main-branch scheduled/manual mobile review
also checks the actual live assets; PRs only validate their unpublished source.

Keep source validation, compiled-browser tests, native build/emulator gates and
physical-phone acceptance separate. A current version label or a passing earlier
deployment is not proof that the current offline asset set is complete. Verify
fresh installation/offline preparation and returning-user draft recovery using
synthetic records. Never clear existing athlete data as a repair step.

This change is build/review tooling only. Web/native version 7.7.0, native build
39700, schema 34, release manifest and training behavior remain coherent and
unchanged. No new runtime release is published by this PR. The source rollback
baseline is `758ff898c9d6efe8c8f92e2b12859c6f943f5625`; reverting this guard does
not repair a missing-asset deployment. Keep main intact and use an approved,
complete artifact to recover hosting.

## Deployment retries

The guarded publisher names each upload `github-pages-${{ github.run_attempt }}`
and passes that exact name to `deploy-pages` using `artifact_name`. GitHub keeps
artifacts across job retries within a run; the default shared `github-pages`
name can therefore make deployment fail with multiple matching artifacts. The
attempt-specific pair selects only the current upload and preserves earlier
evidence. Both action versions support these inputs:
[upload-pages-artifact v3](https://github.com/actions/upload-pages-artifact/blob/v3/action.yml)
and [deploy-pages v5](https://github.com/actions/deploy-pages/blob/v5/action.yml).

Rerun the deploy job from its beginning when a transient failure warrants a retry;
it must rerun all exact-main and single-publisher guards and create a fresh upload.
Never delete artifacts or weaken checks to force publication. Rerunning an older
workflow run still uses its old workflow definition: the November19 failed run
44406736977 must not be retried again. Use a fresh guarded run after this fix is
approved and merged. Required post-deploy double asset scans and actual live
Chromium offline recovery still determine verified-live status.

This retry fix is tooling only: v7.12.0/build40200/schema34 and all328 runtime
assets remain unchanged. Rollback source is approved main
`db35c4ec1656e4e9d63edbc536f72ebc0a830d86`; no migration or native release is needed.
