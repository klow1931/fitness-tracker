# Nutrition tracking

## v1.4.1

Mark a day complete once finished logging. Food edits reopen it. Dashboard, weekly report and coach averages use only complete days with known values for that nutrient, with contributing-day counts. Legacy days remain unconfirmed; real zero values count and missing values do not. Seven-day summaries use seven calendar dates through today and exclude future entries. Charts label partial/unconfirmed days.

The portion picker accepts grams or milliliters when the food has an explicit serving basis. The editor can set that basis from the package; mass and volume never convert implicitly. Food editing uses a mobile dialog with nutrients per one serving, amount to log, and validation. Library edits affect future uses only.

Barcode refresh bypasses the saved lookup and opens a comparison of saved and online values with both serving bases. Replacement requires package-review confirmation. Refresh does not rewrite historical meals. Editing a saved library food also allows manual label corrections. Scanner behavior is unchanged.

Nutrition is a local calorie/protein companion to the training log. Targets are entered by the user; this feature does not prescribe a diet.

`src/product/nutrition-model.js` owns serving validation, scaling, totals and Open Food Facts conversion. `nutrition-ui.js` owns the library, day editing, targets, lookup and scanner. Existing global entry points remain compatible with other screens.

Every day mutation commits a snapshot through the shared serialized persistence writer. Food arrays are copied to avoid later edits mutating a saved snapshot. The UI reports success only after persistence completes and displays failures. Historical totals-only days open as a single editable entry. Targets and food entries are retained by JSON backup/import.

Open Food Facts values use a single basis: 100g/100ml when available, otherwise the provider's serving. Missing fields do not fall back to a different basis. Users match mass or volume to the label and enter fractional servings (e.g. 0.3 for 30g on a 100g basis). Nutrient mass is normalized from grams to mg or micrograms as appropriate. Missing values are null; a day total is unknown if any entry lacks that nutrient. Built-in foods remain estimates without per-item source verification.

Legacy records are preserved. Old missing values stored as zero cannot be reconstructed, and old barcode library entries are not silently recalculated. Check them against the label or delete the old library copy and look up the barcode again.

Tests cover units, serving basis, missing/zero distinction, input validation, navigation/reload, portions, clearing, legacy totals, recent foods, targets, unsafe text and persistence failure. Camera behavior on physical iOS devices and cached service-worker upgrades remain manual checks.
