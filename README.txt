FitTrack (web) — quick start for testers
========================================
Version: web v17

What this is
------------
A local-first fitness tracker in your browser:
workouts (strength + cardio), nutrition, PRs, calendar,
progress photos, AI coach (built-in + optional your own API key).

How to open
-----------
1. Unzip the folder.
2. Double-click index.html
   - Best: Chrome or Edge
   - Safari: File → Open File… then choose index.html
3. Allow storage if the browser asks.

First things to try
-------------------
• Tools → Load demo data (safe way to see charts & history)
• Workouts → log a set → Save
• Nutrition → search a food → Save Day Totals
• Toggle Gym mode (header) for bigger controls
• AI Coach → chat offline, or add your own API key (optional)
• Tools → Export JSON backup (photos excluded; Photos tab has its own export)

Privacy
-------
• Your logs stay in THIS browser on THIS device (IndexedDB / localStorage).
• Optional AI API keys stay in the browser and are NOT included in JSON backups.
• Keys are only sent to the AI provider you configure when API chat is enabled.
• Clearing browser site data will erase local history — export backups.

Notes / limits
--------------
• Each browser/profile has its own data (Chrome ≠ Edge).
• Opening via file:// is fine for testing; some features (camera barcode,
  install-as-app) work more reliably on a local server or hosted URL.
• This is a prototype for feedback — not medical advice.

Feedback
--------
Tell the person who shared this:
- What was confusing?
- What broke?
- What you wish it did next?
Screenshots help.

Thank you for testing!
