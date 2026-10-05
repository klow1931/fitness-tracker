# Loadnote v3.0 competitor gap review

Reviewed October 5, 2026 against official product/help pages. Competitor descriptions below are vendor claims, not independent evidence of better training outcomes. Loadnote comparisons are assessments of the repository implementation and synthetic tests; this was not a paid-account usability study.

| Competitor | Relevant capability documented by its vendor | What v3.0 closes | Gap still open |
|---|---|---|---|
| Fitbod | Workout choices use goals, experience, equipment and preferences. Duration settings change the number of exercises. | A practical shorter-session review shows exact optional accessory omissions while protecting primary work. Coach links directly to that review. | Equipment-aware replacement recommendations and flexible whole-session duration planning; v3.0 does not claim equivalent replacement loads or guarantee a time limit. |
| JuggernautAI | Feedback-driven powerlifting/powerbuilding programs, periodization, exercise videos/cues, meet preparation and coaching resources. | Shared daily evidence and progression constraints, current program routing, reviewed wave loading, and traceable future changes. | A curated instruction library and richer within-session adaptation. Loadnote does not claim to learn an individualized policy or diagnose weak points. |
| TrainHeroic | Private/group coaching conversations with media and program delivery. | One companion can explain strength, hypertrophy, Olympic attempts and athlete drills while retaining their distinct evidence models. Program management and direct review buttons reduce navigation. | Verified coach relationships, remote collaboration, video feedback and team operations. A reported reviewer name is not an authenticated coaching relationship. |

Sources: [Fitbod workout generation](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout), [Fitbod duration guidance](https://help.fitbod.me/hc/en-us/articles/43488199311767-How-long-are-Fitbod-workouts-and-can-I-make-them-shorter), [JuggernautAI product](https://www.juggernautai.app/), [TrainHeroic coach tools](https://www.trainheroic.com/coach/), [TrainHeroic chat documentation](https://support.trainheroic.com/hc/en-us/articles/18156749640717-TH-Chat-Message-your-Athletes).

## Implementation and practical limits

The daily brief uses the same current corrected training records as Decisions and conversation. It brings together program lifecycle, explicit session outcomes, reported sleep/fatigue/soreness, per-lift evidence, sport conflicts, logging gaps and eligible proposals. Those observations remain separate from diagnoses and measured recovery. Contextual buttons navigate to existing reviews; conversation cannot approve training changes. Follow-ups read fresh records and use only bounded user-topic history.

Wave loading is a reviewed strength option, with three-week rep/percentage waves, an explicitly chosen step between waves, partial-wave boundaries, unchanged light/top-backoff conventions and a fixed deload. Existing linear plans keep their original normalized shape. Meet-cycle planning continues to use its event-specific phase policy rather than silently inheriting standalone waves.

Cancellation affects unperformed sessions from today onward. Reviewed plans, completed workouts and earlier unresolved dates survive. The journal is validated against exact Calendar revisions and participates in backup/import and sync. Restoration checks dates, revisions, open drafts and replacement conflicts. Cancelled programs no longer monopolize lifecycle or programming routing.

Shorter-session options are deliberately narrower than full adaptive generation: a supported next-seven-day phase/meet date can omit its athlete-selected accessories after explicit before/after review. Primary, light and variation work stays exact. This reduces accessory dose and does not justify rushed rest or substitution claims. Olympic and athletic protocols are not shortened by a generic accessory rule.

## Next priorities

1. **Reviewed movement alternatives:** explicit equipment compatibility, purpose, athlete-confirmed muscle mapping and a fresh starting dose. Preserve Olympic/drill protocols and never transfer a strength estimate to a new identity automatically.
2. **Execution instruction:** a licensed, curated movement library with short cues, setup guidance and qualified coaching review; measure whether athletes can complete a session with fewer navigation steps.
3. **Real coach collaboration:** authenticated coach/athlete relationships, reviewed remote changes and media feedback, with explicit conflict handling and ownership.
4. **Device acceptance and usability:** test signed builds on actual devices, including interruptions, offline recovery, accessibility, voice and long training histories. Unsigned compilation and browser simulations do not replace this.

v3.0 closes specific workflow gaps. It does not establish parity with the competitors’ full products or prove that a more elaborate explanation improves athlete outcomes.
