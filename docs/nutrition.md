# Nutrition tracking

Nutrition is a local calorie/protein companion to the training log. Targets are entered by the user; this feature does not prescribe a diet.

`src/product/nutrition-model.js` owns serving validation, scaling, totals and Open Food Facts conversion. `nutrition-ui.js` owns the library, day editing, targets, lookup and scanner. Existing global entry points remain compatible with other screens.

Every day mutation commits a snapshot through the shared serialized persistence writer. Food arrays are copied to avoid later edits mutating a saved snapshot. The UI reports success only after persistence completes and displays failures. Historical totals-only days open as a single editable entry. Targets and food entries are retained by JSON backup/import.

Open Food Facts values use a single basis: 100g/100ml when available, otherwise the provider's serving. Missing fields do not fall back to a different basis. Users match mass or volume to the label and enter fractional servings (e.g. 0.3 for 30g on a 100g basis). Nutrient mass is normalized from grams to mg or micrograms as appropriate. Missing values are null; a day total is unknown if any entry lacks that nutrient. Built-in foods remain estimates without per-item source verification.

Legacy records are preserved. Old missing values stored as zero cannot be reconstructed, and old barcode library entries are not silently recalculated. Check them against the label or delete the old library copy and look up the barcode again.

Tests cover units, serving basis, missing/zero distinction, input validation, navigation/reload, portions, clearing, legacy totals, recent foods, targets, unsafe text and persistence failure. Camera behavior on physical iOS devices and cached service-worker upgrades remain manual checks.
