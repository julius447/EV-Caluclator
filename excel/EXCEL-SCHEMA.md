# Laddbox-kalkylator — Excel data schema

Data file: `laddbox-kalkylator-data.xlsx`
Consumed by the WordPress PHP importer in `../_decoded/01_backend.php`
(`ampy_ev_calc_parse_excel` and the five `ampy_ev_calc_parse_*` sheet parsers).

Upload this `.xlsx` in the lead-magnet post's **EV Charging Calculator — Settings**
metabox ("Data Source — Excel File"). On save, the parser reads it and stores the
resulting JSON in post meta `_ampy_ev_calc_data`, which is served to the frontend
via `window.AmpyEvCalcData`.

---

## CRITICAL row layout (applies to EVERY sheet)

The importer's `ampy_ev_calc_header_map()` reads **row index 0** (the FIRST row)
for the column names. Every sheet parser then loops `for ($i = 2; ...)`, i.e. data
starts at **row index 2** (the THIRD spreadsheet row). Row index 1 (the SECOND row)
is therefore **skipped/ignored** by the importer.

| Spreadsheet row | Role | Importer behaviour |
|---|---|---|
| Row 1 | Exact header strings (column names) | Read as the header map |
| Row 2 | Example / hint row | **Ignored** — first cell says `EXEMPEL – ignoreras vid import` |
| Row 3+ | Real data | Parsed |

Do **not** delete or reorder rows 1 and 2. If you add real data, append from row 3
downward. Column order within a row does not strictly matter to the parser (it maps
by header name), but keep the given order for readability.

### Boolean cells
`active` and `is_default` must be the literal lowercase text **`true`** or
**`false`**. The parser does `strtolower(...) === 'true'`, so anything other than
`true` (e.g. blank, `yes`, `TRUE` works too via strtolower) resolves to false.
They are stored as text strings in the file, not spreadsheet booleans.

### Empty badge
Leave the `badge` cell **empty** when there is no badge. The parser does
`trim(...) ?: null`, so an empty cell becomes `null`.

### Sort order
`sort_order` = `1..n` in display order. The parser sorts ascending and then drops
the field; missing/blank defaults to `999`.

---

## Sheet 1 — `EVModels`

Header: `model_id | name | description | badge | active | efficiency_kwh_per_10km | onboard_ac_kw | sort_order`

| Column | Type | Meaning | Parser key |
|---|---|---|---|
| `model_id` | text | Unique slug; row skipped if blank | `id` |
| `name` | text | Display name | `name` |
| `description` | text | Short subtitle | `description` |
| `badge` | text / empty | Optional label; empty ⇒ null | `badge` |
| `active` | `true`/`false` | Selectable in the UI | `available` |
| `efficiency_kwh_per_10km` | number | **PLACEHOLDER** — kWh consumed per 10 km; default 1.70 | `efficiencyKwhPer10km` |
| `onboard_ac_kw` | number | On-board AC charger power (kW); default 11 | `onboardAcKw` |
| `sort_order` | int | 1..n display order | (sort only) |

6 EV models. Names are real; **efficiency figures are illustrative/UNVERIFIED placeholders.**

## Sheet 2 — `Chargers`

Header: `charger_id | name | description | badge | max_power_kw | price_sek | learn_more_url | active | sort_order`

| Column | Type | Meaning | Parser key |
|---|---|---|---|
| `charger_id` | text | Unique slug; row skipped if blank | `id` |
| `name` | text | Display name (**PLACEHOLDER**) | `name` |
| `description` | text | Short subtitle | `description` |
| `badge` | text / empty | Optional label; empty ⇒ null | `badge` |
| `max_power_kw` | number | Max charge power (kW); default 11 | `maxPowerKw` |
| `price_sek` | number | Gross price in SEK (**PLACEHOLDER**); **row skipped if 0/blank** | `priceSek` (rounded int) |
| `learn_more_url` | text | "Read more" link; `#` until real URLs exist | `slug` |
| `active` | `true`/`false` | Selectable in the UI | `available` |
| `sort_order` | int | 1..n display order | (sort only) |

4 chargers. **All charger names AND prices are illustrative/UNVERIFIED placeholders.**
`learn_more_url` is `#` for all rows (to be replaced with real product URLs).

## Sheet 3 — `PriceAreas`

Header: `area_code | name | home_rate_sek_per_kwh | is_default`

| Column | Type | Meaning | Parser key |
|---|---|---|---|
| `area_code` | text | `SE1`..`SE4`; becomes the REGIONS object key; row skipped if blank | (key) |
| `name` | text | Display label | `label` |
| `home_rate_sek_per_kwh` | number | Home electricity rate kr/kWh; default 2.20 | `homeRateSekPerKwh` |
| `is_default` | `true`/`false` | Exactly one row `true` (here: SE3) | sets `defaultRegion` |

4 regions. `SE3` is the default (`is_default = true`); SE1/SE2/SE4 are `false`.
If no row is flagged, the importer falls back to `defaultRegion = 'SE3'`.

## Sheet 4 — `SystemCoefficients`

Header: `key | value`

Only the keys below are recognised; any other key is ignored, and blank values keep
the parser's built-in default. **IMPORTANT:** despite "pct" in some names, the parser
stores these as **fractions**, NOT 0–100 percentages.

| key | value | Meaning | Parser key |
|---|---|---|---|
| `horizon_years` | 10 | Projection horizon (years, int) | `horizonYears` |
| `public_ac_rate_sek_per_kwh` | 4.50 | Public AC charging rate kr/kWh | `publicAcRateSekPerKwh` |
| `public_dc_rate_sek_per_kwh` | 5.99 | Public DC (fast) charging rate kr/kWh | `publicDcRateSekPerKwh` |
| `charger_efficiency_pct` | 0.90 | Charging efficiency as a **fraction** (0.90 = 90%) | `chargerEfficiencyPct` |
| `gron_teknik_pct` | 0.485 | Grön Teknik deduction as a **fraction** (0.485 = 48.5%) | `gronTeknikRate` |
| `gron_teknik_cap_per_applicant_sek` | 50000 | Grön Teknik cap per applicant, SEK (int) | `gronTeknikCapPerApplicant` |
| `max_applicants` | 2 | Max tax applicants (int) | `maxApplicants` |
| `uncertainty_pct` | 0.10 | Uncertainty band as a **fraction** (0.10 = ±10%) | `uncertaintyBand` |

`horizon_years`, `gron_teknik_cap_per_applicant_sek`, and `max_applicants` are cast
to int; the rest to float.

## Sheet 5 — `Advanced`

Header: `key | default`

Default values for the calculator's input controls.

| key | default | Meaning | Parser key |
|---|---|---|---|
| `annual_km` | 15000 | Default annual driving distance (km) | `annualKm` (float) |
| `public_charging_pct` | 50 | Default public-charging share (**0–100 percentage here**, UI slider value) | `publicChargingPct` (float) |
| `public_charging_type` | dc | Default public charging type: `ac` or `dc` | `publicChargingType` (string) |

Note: `public_charging_pct` here is the UI slider's 0–100 value (kept as a number),
unlike the SystemCoefficients "pct" fractions above.

---

## PLACEHOLDER / unverified data — replace before go-live

These cells are illustrative only and must be swapped for Ampy's verified figures:

- **Chargers sheet:** every charger `name` and `price_sek` (all 4 rows), plus
  `learn_more_url` (currently `#`).
- **EVModels sheet:** every `efficiency_kwh_per_10km` value. The model `name`s are
  real; the consumption figures are illustrative.

Everything else (price-area labels/rates, system coefficients, advanced defaults)
came from the engine-shape JSON spec and matches the parser's built-in defaults, but
should still be confirmed against Ampy's verified source before launch.

---

## Regenerating the file

**Use a writer that produces a shared-string table + RELATIVE worksheet
relationships** — Excel, LibreOffice, Google Sheets (export to .xlsx), or Python
`xlsxwriter`. The generator that produced this file is `build_xlsx.py`:

    /tmp/ampy_xlsx_venv/bin/python build_xlsx.py     # uses xlsxwriter

Then verify it imports correctly with the bundled oracle (a faithful Python port of
the real PHP parser, bugs included):

    python3 verify_faithful.py     # must print "PASS — deep-equal"

### ⚠️ Do NOT regenerate with openpyxl
The WordPress parser in `01_backend.php` has two quirks that openpyxl's output trips,
producing a **silent** `OK — 0 imported` (empty calculator):
1. `build_sheet_map()` computes the sheet path as `'xl/' . ltrim(Target, '/')`. That
   only resolves when the workbook's rels use **relative** targets
   (`worksheets/sheet1.xml`). openpyxl writes **absolute** targets (`/xl/...`) →
   the path doubles to `xl/xl/...` → every sheet reads 0 rows.
2. `read_sheet()` only special-cases shared-string (`t="s"`) and boolean cells.
   openpyxl writes text as `inlineStr` with no shared-string table → every text cell
   reads empty → every data row is skipped by the `if (!$id) continue;` guards.

xlsxwriter, Excel and LibreOffice all avoid both. (When we take over the parser, a
small hardening patch — normalise absolute targets + handle `inlineStr` — would make
it tolerant of any writer; until then, generate with a compatible tool.)

Header row is bold. After editing, re-upload the `.xlsx` in the metabox to re-import
(the parser re-runs only when the attachment ID changes).
