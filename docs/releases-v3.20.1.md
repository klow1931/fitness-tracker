# Loadnote v3.20.1 — Bottom navigation recovery

The bottom menu now hides only when a visible, editable keyboard field is focused, the viewport is not zoomed, and the visual viewport is substantially reduced. Browser chrome, rotation and stale viewport measurements alone cannot hide navigation. Focus changes, primary navigation, resize, page restore and foreground return re-evaluate the state, including while the keyboard close animation is still running.

Keyboard-aware hiding remains available during text or number entry so fixed controls do not obstruct the keyboard. Native selects, checkbox controls and read-only inputs are not treated as keyboard text entry. Labels, focus behavior and native controls remain intact. No schema, training data, target or draft changes.

Regression coverage simulates viewport changes and repeated navigation in mobile Chromium and WebKit. These simulations are not physical iPhone or Android keyboard/device acceptance. Version 3.20.1/build 32001; schema 32 unchanged. Packages remain unsigned development/local-only and are not store-ready.
