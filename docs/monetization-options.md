# Free-first monetization options — decision notes, 2026-10-08

No monetization is implemented in v3.21: no advertising SDK, analytics tracker, billing account, ad unit or sponsor contract. The local-only beta boundary remains intact. These are proposals, not income forecasts.

## Recommended sequence

Keep core logging, programming, safety explanations, backup/restore and offline access free. Start with the Android beta and observe voluntary user feedback/retention before changing the business model. If monetizing later, trial a clearly labelled sponsored card or restrained native/banner placement in Home/Progress, away from navigation and training controls. Keep the logger, RPE controls, rest timer, review/save, intake and backup/restore ad-free. Consider optional paid ad removal/supporter features rather than putting core training behind a mandatory subscription.

Avoid full-screen interstitials during workouts, on every tab change or before saving. Google allows interstitials at appropriate content breaks, but those breaks are limited in a lifting log. Rewarded ads should be explicitly optional, with a nonessential benefit such as a cosmetic theme; never require a video to save, restore, receive a safety explanation or continue training. A direct equipment sponsor could avoid an ad-network SDK, but requires actual commercial outreach/terms and does not guarantee revenue. Sponsorship must not bias programming or exercise advice.

## Revenue sensitivity, not market benchmarks

Publisher ad revenue is approximately served impressions / 1,000 × observed eCPM. Google defines eCPM this way and notes that geography, market trends and ad delivery affect results. Downloads are not daily active users, and ad requests are not necessarily served impressions. The following invented eCPM scenarios are arithmetic examples only, not current fitness-app rates or predictions. They assume one successfully served impression per daily active user, every day in a 30-day month, before taxes and operating costs.

| Daily active users | Monthly impressions | At $0.50 eCPM | At $2 eCPM | At $5 eCPM |
|---:|---:|---:|---:|---:|
| 100 | 3,000 | $1.50 | $6 | $15 |
| 1,000 | 30,000 | $15 | $60 | $150 |
| 10,000 | 300,000 | $150 | $600 | $1,500 |

At the assumed $2 eCPM and one served impression per active user per day, $1,000/month requires about 16,667 daily active users. Actual usage, consent, no-fill and placement exposure can reduce impressions; increasing ad density can harm the product. Do not budget income from these examples. Set an operating-cost/support target, then reassess with actual served impressions, earnings and retention from a small approved pilot. If ads do not meet that target, consider optional premium extras/ad removal or sponsorship before abandoning the free core.

## Privacy and approval gate before an ad pilot

AdMob is a plausible first network to evaluate, not an installed dependency. Its SDK introduces automatic data collection/sharing, and applicable consent/privacy controls and Play Data safety disclosures need review for the exact SDK and geography. Non-personalized ads do not mean no data collection. Never target ads with intake symptoms, injury history, body measurements or workout details, and never send these as ad parameters. Core training must work when offline, ads fail, or consent limits advertising. Use test ads during development; do not click your own live ads. Adding a network, payments, SDK permissions or commercial outreach requires a separate explicitly approved update.

Sources reviewed: [AdMob revenue factors](https://admob.google.com/home/resources/how-much-revenue-can-you-earn-from-admob/), [eCPM definition and variability](https://support.google.com/admob/answer/15337570), [placement guidance](https://support.google.com/admob/answer/2936217), [interstitial restrictions](https://support.google.com/admob/answer/6201362), [consent SDK](https://developers.google.com/admob/android/privacy), [SDK data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure).
