# v1.5 navigation and flow

Tab subsections, scroll positions and food-entry mode are retained during the page session. Refresh still initializes Home and the existing persisted workout draft; navigation itself does not change saved data or add a migration.

Navigation renders the selected view only. A revision increment on save/persist invalidates cached views, and date changes invalidate nutrition views. Any new mutation that bypasses those entry points must call invalidateViews(). Program/calendar/edit actions explicitly open the workout logger even if History was last selected.

Food entry has a sticky date/totals strip and Done adding action. Adding multiple foods does not require returning to Today. Today emphasizes Add food; manual save and clear sit under Day options. Mobile inputs use 16px text, main buttons have 44px targets, and workout review actions remain near the bottom above navigation. Focus moves to the destination panel on tab changes. Transitions are brief and disabled with reduced-motion preference.

Render-count benchmark (Nutrition → Workouts → Nutrition without data changes): v1.4.1 executes 4 day loads, 2 hidden nutrition-history renders and 2 hidden library renders. The new browser regression expects 1 day load and 0 hidden history/library renders. It also logs elapsed time; timing is environment-dependent and not a phone-performance guarantee.

Regression tests cover scroll/subsection/form retention, live food totals, view invalidation, reduced motion and keyboard focus, alongside existing workout/nutrition tests. Physical iOS keyboard, camera and service-worker upgrade behavior still require device verification.
