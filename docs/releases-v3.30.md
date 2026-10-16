# Loadnote v3.30.0 — Personal appearance

## Scope
Personal visual themes, not a new training engine or AI model.

- Profile → Appearance contains six named preset accents (Indigo, Ocean, Emerald, Crimson, Amber, Slate), a native custom color picker, explicit Light / Dark / System choices, a live local preview and Reset to default.
- Appearance is saved in `localStorage` under `loadnote-appearance-v1`, separate from workouts, account sync, exports, programming and coach context. Saved appearance belongs to this device/browser. A rejected storage write leaves the previous selection active and shows an error.
- The existing top bar moon/sun control remains a quick explicit light/dark toggle and uses the same preference as Profile. A pre-v3.30 saved `data.dark` choice is honored when no local appearance preference exists. System mode follows `prefers-color-scheme` without adding a listener each render.
- Accent foreground on primary actions is darkened when necessary until white text reaches 4.5:1 contrast. The app keeps semantic success, warning, error and training-status colors independent of personal preferences.
- Shared CSS tokens and targeted overrides update core actions, nav highlights and appearance controls. The new CSS and modules are included in Pages, service-worker cache and native bundles. The Profile theme picker stays collapsed until chosen.
- DOM/browser acceptance exercises preset selection, persistence/reload, system changes, reset, custom extreme-light color contrast and a narrow-phone layout. Node tests cover normalization, contrast, failed local writes and legacy migration.

## Constraints and release gate
- Training schema remains 32; weight conversion, RPE, 1RM, training dose, Coach prompts, account sync and history are unchanged.
- `npm run check`, `npm test`, full Playwright browser shards plus mobile WebKit, mobile/native checks and Android beta checks should all pass before merging.
- iPhone/Android manual contrast and keyboard checks on actual devices remain to be performed; emulator/browser results are not a physical-device certification.
- No advanced theming of all semantic chart colors is claimed, and dynamic preference synchronization between devices is not claimed.
