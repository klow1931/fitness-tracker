# Loadnote v4.7.0 — Optional Coach research

Coach remains usable offline. Web users can optionally retrieve indexed training publications through Europe PMC's public REST API, without an online LLM, paid search credential or separate backend deployment. The first release covers twelve preset general training topics, rather than unrestricted browsing.

## Permission and privacy

- **Ask first** is the default: recognizing a topic offers a button; opening Research previews the search keywords. No search is sent until the user presses Search.
- **Offline only** stops research requests and cancels pending work. Built-in coaching and saved references remain available.
- **Automatic training-topic searches** requires an explicit settings choice. Recognized supported general training questions can retrieve references alongside the existing answer. Health/injury and recorded-history questions do not trigger research.
- Only preset public topic keywords are sent. Raw chat, workout logs, saved athlete context, identity and injury notes are never request parameters. Browser credentials and referrers are omitted. Europe PMC still receives the network address. Opening a publication connects to its host separately.
- The web feature works on GitHub Pages through the API's public CORS response. Packaged native builds use the same opt-in public lookup, similar to barcode/reference downloads; account, remote training sync, online AI and realtime voice remain disabled in that beta. No athlete data service is enabled.

## Results and offline use

Results show publication dates, retrieval date, review/publication labels, authors, journal metadata when available and links built from validated PubMed/PMC identifiers. Review publications are preferred within the returned set. Detected preprints, retracted publications, corrections and future-dated records are excluded. Index membership and these filters do not certify study quality, relevance or current retraction status.

Short abstract excerpts are collapsed and labelled as source excerpts, not Loadnote conclusions or full-text reviews. Missing abstracts remain missing. A ready local model can optionally explain fresh or saved excerpts on-device, including while offline; generated prose is supplementary and experimental. The existing output checks cannot guarantee factual accuracy. Citations and excerpts remain visible, and no research is forwarded to Online Coach or used to change training.

Save retains one collection per topic, up to twelve collections, on this device. Saving is explicit and reports storage failures. Saved cards show their original retrieval date and an additional warning after ninety days; opening them does not fetch the internet. Clear removes only research storage. Collections are excluded from training backups and cloud sync. Model weights are not retrained from these references.

Recent topic results are reused in memory for fifteen minutes to avoid repeated requests; their original retrieval time remains visible. Cancellation, timeouts, bounded responses and safe identifier/text handling keep failed or malformed requests from blocking Coach. Topic-only lookup and the public provider mean there are no browser search credentials to expose. Privacy information and permission controls are accessible from the Research button in Coach Companion.

## Validation and limits

Automated coverage includes permission modes; zero network before confirmation; request minimization; safe source links and text; cache persistence and corrupt cache handling; storage quota failure; offline guards; cancelled and stale responses; stalled/oversized/rate-limited requests; desktop/mobile research flow; and unchanged training state. Existing Coach, local-model and packaging regressions are also checked. A live Europe PMC response and its public CORS headers were inspected during implementation.

A preset literature search does not provide exhaustive scientific review or broad general web intelligence. Physical iPhone/Android acceptance, changing third-party availability, real local-model source explanation quality and publication-level validity still require separate review. No model download or retraining was performed for this release.

Version **4.7.0**, native development build **36700**, schema **34** unchanged.

API documentation: https://europepmc.org/RestfulWebService
