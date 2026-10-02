# v2.76 — Calm Navigation & Information Hierarchy

Loadnote v2.76 reduces visible interface complexity without changing training data, training math, or adaptive policy.

## Product rule

Each primary destination should answer one immediate question:

- **Home:** What should I do today?
- **Train:** What am I doing in this workout?
- **Progress:** What is my training doing over time?
- **Coach:** What does Loadnote think I should know or help me understand?
- **Profile:** How is Loadnote configured, and where are secondary features?

Secondary capability remains available, but it should not compete visually with the action an athlete is most likely to need now.

## Home

Home remains training-first. The v2.76 presentation:

- keeps today's training as the primary surface;
- groups current-program/recent-training context beneath it;
- removes the duplicate **Start here** block from the visible hierarchy;
- removes nutrition and demo-data calls to action from the normal Home empty state;
- removes protein and nutrition-chart cards from Home while keeping Nutrition reachable from Profile;
- keeps weekly rhythm and detailed training evidence collapsed until requested;
- renames the deeper disclosure to **Training insights & history**.

The existing underlying elements remain in the DOM where practical so established render functions and data flows remain compatible.

## Global navigation and preferences

Primary navigation stays:

**Home → Train → Progress → Coach → Profile**

Global unit, appearance, and Gym mode controls no longer compete with primary navigation in the header. Their existing controls remain available in **Profile → Preferences**.

## Train

v2.75's execution-first workout experience remains authoritative. v2.76 intentionally avoids a logger rewrite. Existing workout setup, draft persistence, exercise controls, rest timing, and review/save flows are unchanged.

## Progress

Progress remains summary-first. Detailed review and manual PR entry are visually quieter than the primary progress story, while all existing evidence and editing paths remain available.

## Coach

Reviewed/current programming remains the main programming surface. The legacy generator selection and legacy library are retained under an additional **Advanced programming** disclosure so they do not compete with the current program workflow.

## Profile

Profile is the home for complexity that should not interrupt training:

- training setup and powerlifting lift mapping;
- account and sync/data protection;
- weight units, Gym mode, and appearance;
- Calendar, Food, Measurements, Photos, and Tools & data.

## Integrity

v2.76 is a presentation release:

- schema remains v25;
- no migration;
- internal weight storage remains kg;
- no changes to RPE, estimated 1RM, training max, progression, fatigue/status, adaptive policy, phase progression, or meet-cycle logic;
- workout history and draft persistence remain authoritative;
- secondary feature data is not deleted or transformed.

## Verification

Browser coverage verifies that:

- the five primary destinations remain unchanged;
- global header utilities are demoted while Profile preferences remain available;
- Home's secondary onboarding/nutrition surfaces are not shown by default;
- detailed evidence remains behind disclosure;
- legacy programming remains reachable through Advanced programming.
