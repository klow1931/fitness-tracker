# Loadnote v3.34.1 — Mobile appearance fixes

- Active Home, Train, Progress, Coach and Profile icons retain their outlined SVG shapes. Appearance themes color the strokes and selected-tab background, not the icon's rectangular container.
- Profile's Appearance summary groups its heading and description vertically. The heading remains one word at narrow phone widths and enlarged text, while the description wraps naturally and the disclosure arrow stays separate.
- Theme, custom-color, reset, system-mode and saved-workout behavior remain unchanged. No training schema, programming, logging, model selection or decision-policy changes.
- Regression coverage checks all five active tabs in every preset and light/dark mode, the SVG fill/stroke/background styles, unchanged workout history, 320/390px heading layout and enlarged text. Existing appearance persistence, contrast, reset and system-mode tests remain required.
- The iPhone WebKit CI job now explicitly runs the appearance suite; it was previously included in browser configuration but omitted from that job's selected files.
- Web service-worker cache and native build metadata advance to 3.34.1 (33401) so updated styles are packaged for offline and native use. Automated browser checks do not replace physical-device acceptance.
