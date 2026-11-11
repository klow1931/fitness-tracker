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
