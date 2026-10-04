# Loadnote v2.89.0 — Mobile UX & Accessibility

- Contextual logger names distinguish exercise, set number, repetitions/hold seconds, current load unit, RPE and completion/removal. Unit switching updates names while preserving existing kg conversion rules.
- Cardio controls gain explicit accessible names and appropriate numeric keyboard hints.
- Workout validation retains existing rules/toasts and adds a persistent inline alert linked to the focused invalid input; error state clears on edit or the next validation pass.
- Section tabs use tab/tab-panel relationships, a single selected tab stop and Left/Right/Home/End keyboard navigation. See the [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- Keyboard skip link targets the current visible section; dark-mode button and unit buttons expose names/selection.
- Mobile set-removal/addition, tracking and unit controls have 44px minimum targets. Logger inputs remain at least 16px and respect larger root text sizing.

Regression coverage includes contextual labels, unit conversion, invalid-field feedback, tabs, 320px viewport, larger text, reduced motion and skip navigation. These are targeted browser checks, not a whole-app accessibility certification or evidence of native VoiceOver/TalkBack or software-keyboard operation.

Schema v25, training calculations, Apple credentials and signing/distribution configuration unchanged. Build 28900 remains unsigned development. Native device acceptance is still required.
