# Consumer Profile and onboarding (v2.60)

## Product purpose

Profile is the fifth primary Loadnote destination after Home, Train, Progress and Coach. It owns consumer identity, training setup and preferences while keeping secondary functionality available without making those tools compete with the gym-floor workflow.

## Training setup

Profile reuses the existing revisioned programming profile. It does not introduce another athlete-settings document. The setup records the athlete's programming goal, availability, session-time limit, equipment access, self-reported experience/consistency and optional preferences/notes.

Hard programming constraints remain enforced by the existing builder. Free-text priorities and preferences remain context rather than automatic diagnoses or prescriptions.

Powerlifting competition-lift mappings remain in the existing revisioned exercise-role model. Profile only summarizes how many squat/bench/deadlift competition identities are confirmed and provides a direct handoff to the established mapping UI.

## Account and sync

Account remains optional. Local training, history and programming continue to work without sign-in.

When signed in, Profile contains account identity/status, manual Sync now, conflict review through the v2.59 sync flow, sign out and account deletion.

Deleting an account removes the durable server account, provider-identity mappings and the account-scoped remote structured-training snapshot. The initiating device clears sync-base acknowledgement/receipt metadata. Local workout history and other local-only data stay on the device unless the athlete separately erases them.

## First-run onboarding

The compact first-run card now points to training setup, the Train logger and optional account/sync. Demo data remains available as a secondary development/exploration tool but is not part of the normal onboarding path.

## Secondary destinations

Calendar, Food, Measurements, Photos and Tools remain reachable from Profile. They are not removed; they are deliberately one level below the primary Home/Train/Progress/Coach/Profile loop.

## Non-goals

v2.60 does not add automatic/background sync, cloud photo storage, subscriptions or billing, native store signing, provider-specific native login provisioning, a second athlete-profile schema, or new training-programming logic.
