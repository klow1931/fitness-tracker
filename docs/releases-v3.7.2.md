# Loadnote v3.7.2 — Mobile layout polish

An extra closing div in the legacy generator prematurely closed the app shell, leaving Profile and Tools outside its padding and responsive layout. The closing tag is corrected and browser checks require both panels to remain inside the shell.

Compact mobile header, explicit hidden-panel handling, clearer Device & backup disclosure, and a smaller Profile hero. Coach has consistent section and card spacing and a labeled More tools disclosure. The floating companion is hidden on Coach and Profile; Ask Coach remains in primary navigation and the quick companion is available under More tools.

Program planner status has explicit foreground and background colors in both themes. Long route explanations are available under Why this plan?; setup and the recommended action remain visible.

Browser regressions cover three phone widths, both themes, actual header and card gaps, status contrast, access to the companion, and unchanged training data. CI captures fresh Profile, Today and planner screenshots.

Version 3.7.2/build 30702. No schema or training prescription changes. Physical Safari acceptance remains a separate user check.
