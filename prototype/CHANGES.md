# Laddbox-kalkylator — iteration log

The prototype is the working "transplant source". Each change here must be ported
back into the WordPress snippets before go-live:
- markup edits → `../_decoded/01_backend.php` (inside `ampy_render_ev_lead_magnet()`)
- engine edits → `../_decoded/00_js-engine.js` (the WP "JS Engine" snippet)

## Iteration 1 (2026-06-08) — copy, honesty, a11y

| # | File | Change | Why | Port to (WP) |
|---|---|---|---|---|
| 1 | index.html | `Din körvanor` → `Dina körvanor` | Swedish plural agreement | 01_backend.php (tier label) |
| 2 | index.html | Removed `for="ampyEvKmSlider"` on the km label | Broken label association — no element has that id (slider is a div in `#ampyEvKmContainer`) | 01_backend.php |
| 3 | index.html | Footnote `(50%)` → `(ca 48,5% av priset)` | Honesty: the engine deducts 48,5% (0,485) and the trio shows it; "50%" overstated the share of total price | 01_backend.php |
| 4 | engine.js | Hero subtitle now states the baseline: "…jämfört med fortsatt publik laddning…" + `inräknat`→`inräknad` | Makes the savings claim's comparison explicit (Ampy honesty moat); grammar agreement | 00_js-engine.js (`renderSingleResult`, `ampyEvHero10Sub`) |

Engine calculation logic untouched (battery-proven). Verified: renders, 0 console
errors, math reconciles (46 370 kr / 1,3 år with Tesla Model Y + Amina S defaults).

## Iteration 2 (2026-06-10) — production data + spec items 1, 4, 5, 6, 7

Implements the owner-approved data set and a subset of the production feature spec
(items 1, 4, 5, 6, 7). **Not** in this stage: the ROI toggle (spec 2) and the hero
hierarchy restructure (spec 3) — those land next.

| # | File | Change | Why | Port to (WP) |
|---|---|---|---|---|
| 1 | data.js | Replaced `window.AmpyEvCalcData` with the approved object (8 EV models incl. new Volvo EX40 / VW ID.7; 4 chargers; SE1–SE4 home rates 1,45 / 1,50 / 1,90 / 2,10; DC 5,50; `defaultRegion` SE3) + `postId:0, restUrl:'', nonce:''` | Single approved source of truth | 01_backend.php (post-meta defaults) |
| 2 | data.js | **Charger `priceSek` are PLACEHOLDER fully-installed prices, incl. moms (box + standard installation, 25% VAT in), BEFORE Grön Teknik** (Amina S 21 900, Easee 19 900, Zaptec 20 900, Garo 22 900); selector subtitles now say "· inkl. installation"; flagged in a header comment | Spec 1 installed-price model; Ampy replaces with real turnkey quotes | 01_backend.php / Excel import |
| 3 | engine.js | Fallback `REGIONS` / `RATES` Object.assign defaults updated to match data (SE2 1,50 · SE3 1,90 · SE4 2,10; DC 5,99→5,50); `calculateFor` home-rate fallback 2,20→1,90 | Fallbacks must agree with injected data | 00_js-engine.js |
| 4 | engine.js | "Att betala" sub line: `"Total … − Grön Teknik …"` → `"Pris inkl. installation & moms {grossPrice} kr − Grön Teknik {gronTeknik} kr"` | Spec 1(b): copy must state price is incl. installation & moms | 00_js-engine.js (`renderSingleResult`) |
| 5 | engine.js | Methodology item 4 rewritten + derived from `RATES.gronTeknikRate`: "50% av arbete + material × Skatteverkets 97% schablon ≈ 48,5% av totalpriset; kalkylen drar 48,5%." Eligibility now: äger bostaden, tillräcklig skatt, installatör har F-skatt, uttag enligt EN 62196-2/-3 (removed the incorrect "professionell installation kvalificerar alltid / ingen solanläggning" wording; no `lastbalansering` claim) | Spec 4 coherent 48,5% narrative + correct eligibility | 00_js-engine.js (`populateMethodology`) |
| 6 | index.html | DC tooltip `~5,99` → `~5,50 kr/kWh` + `(abonnemang ~3,40–4,50)` | Spec 5 | 01_backend.php |
| 7 | index.html | Elprisområde tooltip: described as "marginal allt-i-ett hemmakostnad", SE4 2,60→2,10 | Spec 6 | 01_backend.php |
| 8 | engine.js | "Läs mer om laddboxen" link now hidden (`display:none`) when `charger.slug === '#'` | Spec 7: no dead links while slugs are placeholders | 00_js-engine.js (`renderSingleResult`) |
| 9 | index.html | Methodology footnote: "* Ungefärligt pris **inkl. installation & moms** efter Grön Teknik-avdrag (ca 48,5% av priset)…" | Spec 1(b) | 01_backend.php |

Verified: `node --check` clean on data.js + engine.js; all engine-touched
`getElementById` ids still resolve in index.html; no stale 5,99 / 2,60 / 2,20
strings remain. Methodology DC rate auto-renders from `RATES` (now 5,50).

## Iteration 3 (2026-06-10) — spec items 2 (ROI toggle) + 3 (hero hierarchy)

Implements the two remaining production-spec items. The annual saving is now the
dominant hero number in **both** toggle states, and a real on/off switch decides
whether the laddbox cost is counted.

### New element ids (added to BOTH index.html markup and engine.js wiring)

| id | Where | Purpose |
|---|---|---|
| `ampyEvInvestmentToggle` | results card | `role="switch"` button; click/keyboard toggles `state.includeInvestment` |
| `ampyEvInvestmentToggleLabel` | results card | accessible name target (`aria-labelledby`) for the switch |
| `ampyEvInvestmentToggleState` | results card | live text label: "Med investering" / "Utan investering" |
| `ampyEvHeroAnnualSub` | hero | hero sub copy "jämfört med fortsatt publik laddning" (was on the 10-yr hero) |
| `ampyEvCumulativeTile` | trio | wrapper tile for the demoted 10-yr cumulative figure |
| `ampyEvCumulativeLabel` | trio | label that switches "Sparar på 10 år" ↔ "Besparing på 10 år" |
| `ampyEvNetPayTile` | trio | wrapper for "Att betala" tile — hidden when toggle OFF |
| `ampyEvPaybackTile` | trio | wrapper for "Payback-tid" tile — hidden when toggle OFF |

Moved (not new): `ampyEvAnnualSaving` + `ampyEvAnnualRange` now live in the hero;
`ampyEvCumulativeValue` + `ampyEvHero10Sub` now live in the secondary trio tile.

### Changes

| # | File | Change | Why | Port to (WP) |
|---|---|---|---|---|
| 1 | engine.js | Added `state.includeInvestment` (default `true`) | Spec 2 ROI toggle state | 00_js-engine.js (state) |
| 2 | engine.js | `calculateFor` now returns two series — `cumulativeNet` (saving×yr − netCost) and `cumulativeSavings` (saving×yr) — plus `cumulativeNetN` / `cumulativeSavingsN` end values (replaces old `cumulative` / `cumulativeN`) | Lets render branch without recomputing | 00_js-engine.js (`calculateFor`) |
| 3 | index.html + engine.js | **Hero hierarchy restructured (spec 3):** the ANNUAL saving "≈ X kr/år" is now the dominant `hero15-value` (`--fs-4xl`), eyebrow "Du sparar per år", sub "jämfört med fortsatt publik laddning" + spann line. The 10-yr cumulative is demoted to a secondary `trio-tile` (`--fs-lg`) and the chart end-label | Spec 3: lead with the credible annual number in both states | 01_backend.php + 00_js-engine.js (`renderSingleResult`) |
| 4 | index.html | Added ROI switch row: `<button role="switch" aria-checked aria-labelledby>` with track/thumb + state text + tooltip explaining med/utan investering | Spec 2: real, keyboard-operable on/off control | 01_backend.php |
| 5 | engine.js | `renderSingleResult` branches on `state.includeInvestment`: ON → shows "Att betala" + "Payback-tid" tiles, 10-yr tile uses `cumulativeNetN`, sub "laddboxen betald, Grön Teknik inräknad". OFF → hides both tiles (`display:none`), 10-yr tile uses `cumulativeSavingsN`, label "Besparing på 10 år", sub "Din besparing på laddningen – oavsett vad laddboxen kostar." | Spec 2 behaviour | 00_js-engine.js |
| 6 | engine.js | `renderPaybackChart` branches on the toggle: ON → `cumulativeNet` with loss→profit zones + break-even marker. OFF → `cumulativeSavings`, single all-profit zone (`--chart-zone-profit`), profit-coloured line + start dot, NO loss zone, NO break-even (adds `is-savings-only` + reuses `is-no-be`) | Spec 2 chart switch | 00_js-engine.js |
| 7 | engine.js | Added `updateInvestmentToggle()` (syncs `aria-checked` + state label), called in `renderAll`; click handler in `bindUI` flips state. Native `<button>` ⇒ Space/Enter operate it | Spec 2 a11y switch | 00_js-engine.js |
| 8 | engine.js | `buildPayload` now sends `cumulative10` (net), `cumulativeSavings10`, and `includeInvestment` in the lead `results.ev` object | Lead payload reflects which mode the user viewed | 00_js-engine.js (`buildPayload`) |
| 9 | styles.css | New `.ampy-calc__switch` (track/thumb/state) + `.ampy-calc__roi-toggle-row` + `.ampy-calc__hero15-range`; trio rebuilt as `auto-fit` grid of `.ampy-calc__trio-tile` blocks (so individual tiles can be hidden and the row reflows); trio value demoted `--fs-xl`→`--fs-lg`; toggle row added to the staggered reveal | Spec 2/3 styling | (CSS snippet) |

Verified in-browser (prototype served at localhost): 0 console errors.
- **ON** (default): hero ≈ 5 070 kr/år · Att betala 11 279 kr · Payback 2,2 år · 10-yr 39 422 kr · chart end +39 422 kr · break-even marker shown. Reconciles: 5 070×10 − 11 279 = 39 421; 11 279 ÷ 5 070 = 2,2 år.
- **OFF**: hero unchanged ≈ 5 070 kr/år · "Att betala"/"Payback-tid" tiles hidden · 10-yr 50 700 kr (= 5 070×10, pure savings) · chart end +50 700 kr · single profit zone, no break-even.
- Switch: `role="switch"`, `aria-checked` toggles, accessible name via `aria-labelledby`, native button ⇒ keyboard-operable. All engine `getElementById` ids resolve (only dynamic `ampyEvChartKeyframes` is created at runtime). `node --check engine.js` clean.

## Iteration 4 (2026-06-10) — GDPR (client) + telemetry

Adds client-side GDPR consent + anti-bot signals to the lead form, and a small
funnel-event + UTM/referrer telemetry layer. **No** calculation logic changed.
All server-side enforcement (sub-2s reject, honeypot reject, consent storage) is
the WP/n8n side's job — this stage only produces the signals and blocks the
obvious client cases.

### New element ids / hooks

| id / hook | Where | Purpose |
|---|---|---|
| `ampyEvLeadConsent` | lead form | REQUIRED, UNTICKED granular consent checkbox (separate control from submit) |
| `ampyEvLeadConsentNotice` | lead form | Article-13 micro-notice text + privacy link |
| `ampyEvLeadConsentError` | lead form | `role="alert"` inline error when unticked |
| `ampyEvLeadCompany` | lead form | honeypot text input (must stay empty) |
| `window.dataLayer` | global | funnel events pushed here (guarded — no-op if absent) |
| `window.ampyEvAnalytics(name, detail)` | global | OPTIONAL 3rd-party analytics sink; **only called when consent is ticked** |

### Changes

| # | File | Change | Why | Port to (WP) |
|---|---|---|---|---|
| 1 | index.html | Added required/unticked consent checkbox with Article-13 micro-notice + privacy link `href="/integritetspolicy"` (**PLACEHOLDER — Ampy must repoint before go-live**); `aria-describedby` ties notice + error to the box | GDPR Art. 6/7/13 lawful basis + transparency | 01_backend.php (lead form markup) |
| 2 | index.html | Added visually-hidden honeypot input (`#ampyEvLeadCompany`, `tabindex=-1`, `autocomplete=off`, `aria-hidden` wrapper) | Bot trap; server rejects if non-empty | 01_backend.php |
| 3 | styles.css | Added `.ampy-calc__hp` (off-screen 1px, not display:none so bots still see it), `.ampy-calc__consent` + `.ampy-calc__consent-row/-check/-text` (incl. ≥44px touch target, error outline) | Honeypot must be invisible-but-present; consent legible on the dark surface | (CSS snippet) |
| 4 | engine.js | Added `CONSENT_VERSION` (`2026-06-10.1`) + `CONSENT_TEXT`; `submitLeadForm` now blocks (client) when the box is unticked, shows an `role=alert` error, moves focus, and clears the error on success | Consent must be explicit, auditable, and versioned (Art. 7) | 00_js-engine.js |
| 5 | engine.js | `buildPayload` now adds a `meta` block (utm_source/medium/campaign/term/content + `document.referrer` + `landingPath`/`landingUrl`), captured ONCE at load in `META`/`captureMeta()`, degrading to `null` when absent | Telemetry / attribution | 00_js-engine.js |
| 6 | engine.js | `buildPayload` adds an `antibot` block: `honeypot` value, `formOpenedAt` (stamped when the form first opens, in the CTA handler), `submittedAt`, `elapsedMs` | Lets the server reject sub-2s + honeypot-filled submits | 00_js-engine.js |
| 7 | engine.js | Lead `contact.consent` block carries `{given, version, text, timestamp}` | Stores WHAT/WHEN was agreed (Art. 7 audit trail) | 00_js-engine.js |
| 8 | engine.js | Added `emitEvent(name, detail)` → always `console.debug`, pushes to `window.dataLayer` when present (guarded), and fans out to `window.ampyEvAnalytics` **only behind `hasConsent()`**. Wired the full funnel: `calc_view` (init), `input_change` (each user recalculation, guarded so boot render is excluded via `_initDone`), `cta_quote_click`, `lead_submit`, `lead_success`, `email_calc_submit` | Funnel analytics with consent-gated 3rd-party fan-out | 00_js-engine.js |

**⚠ OWNER FLAGS for Ampy**
- `href="/integritetspolicy"` is a PLACEHOLDER — point at the live policy URL.
- `CONSENT_TEXT` / `CONSENT_VERSION` must match the legally-approved wording; bump the version string whenever the copy changes.
- Server (WP/n8n) must actually enforce: reject `antibot.honeypot !== ""`, reject `antibot.elapsedMs < 2000`, and persist `contact.consent` (+ IP/timestamp) for the audit trail.
- Wire a real `window.ampyEvAnalytics` (or GTM tags) only after a consent/CMP review — the hook already gates on consent but the vendor choice is Ampy's.

Verified in-browser (prototype @ localhost, URL carrying all 5 UTM params):
0 console errors/warnings. Consent unticked ⇒ submit blocked + inline alert + focus
moved; ticked ⇒ submits, payload carries `meta` (all UTM + referrer + landingPath),
`contact.consent` (given/version/text/timestamp), and `antibot` (empty honeypot,
formOpenedAt set, numeric elapsedMs). Filled honeypot still submits client-side but
its value rides in `antibot.honeypot` for server rejection. Funnel order observed:
`calc_view → cta_quote_click → input_change → lead_submit → lead_success`; email path
emits `email_calc_submit`. `dataLayer` push is a no-op (guarded) when GTM is absent.
`node --check engine.js` clean.

## Port to WordPress (2026-06-10) — prototype → deployed snippets

Release-engineering pass. The prototype (`index.html` markup + `engine.js` + `styles.css`)
was ported into the three deployed FluentSnippets sources under `../_decoded/`. This
folds iterations 1–4 (production data, ROI toggle, hero restructure, GDPR/telemetry,
all the a11y/WCAG fixes) into the live snippets in one shot. No prototype logic was
changed during the port.

| Target snippet | Action | Result |
|---|---|---|
| `../_decoded/00_js-engine.js` | Replaced verbatim with `prototype/engine.js` (engine is delivered as-is) | byte-identical to prototype (`diff` clean) |
| `../_decoded/02_styles.css` | Replaced verbatim with `prototype/styles.css` | byte-identical to prototype (`diff` clean) |
| `../_decoded/01_backend.php` | Updated **only** the markup inside `ampy_render_ev_lead_magnet()` to match `prototype/index.html` | see markup notes below |

### Markup ported into `ampy_render_ev_lead_magnet()`

- ROI on/off switch row (`#ampyEvInvestmentToggle` + label/state) added above the hero.
- Hero restructured: ANNUAL saving "≈ X kr/år" is now the dominant `hero15-value`
  (`#ampyEvAnnualSaving` + eyebrow "Du sparar per år" + `#ampyEvHeroAnnualSub` + `#ampyEvAnnualRange`).
- 10-yr cumulative demoted into a secondary `.ampy-calc__trio-tile`
  (`#ampyEvCumulativeTile` / `#ampyEvCumulativeLabel` / `#ampyEvHero10Sub`); "Att betala"
  and "Payback-tid" are now their own tiles (`#ampyEvNetPayTile` / `#ampyEvPaybackTile`).
- Added the debounced SR status region `#ampyEvSrStatus` and removed `aria-live="polite"`
  from the whole results card.
- Lead form: added the honeypot block (`#ampyEvLeadCompany` in `.ampy-calc__hp`) and the
  required/unticked consent block (`#ampyEvLeadConsent` + `#ampyEvLeadConsentNotice` +
  `#ampyEvLeadConsentError`) with the `href="/integritetspolicy"` **PLACEHOLDER** link.
- Tier label `Din körvanor` → `Dina körvanor`; orphan `<label>`s on the custom
  selectors/sliders converted to `<span>`+id (aria-labelledby); tooltip text on the
  public-type / region tooltips updated; footnote → "inkl. installation & moms … (ca 48,5% av priset)".
- Each literal SVG that has a PHP helper was rendered via the helper: both selector
  chevrons → `ampy_ev_chevron()`, the "Få en offert" arrow → `ampy_ev_arrow_icon()`.
  The car/charger icons stay JS-rendered (empty `#ampyEvCarImgA`/`#ampyEvChargerImgA`
  spans, populated at runtime) — matching the prototype. The remaining literal SVGs
  (success check, error circle, product-link arrow, email-success check) have no helper
  and were left literal, exactly as in the prototype.

### Preserved — backend-stage PHP (untouched)

The backend-hardening stage's PHP was **not removed or altered**:
- REST routes `/data/{id}` (READABLE) and `/lead/{id}` (CREATABLE, public + in-callback enforcement).
- Lead callback: payload-size cap (413), type allow-list, honeypot accept-but-drop,
  form-open delta sub-2s reject (`too_fast`), nonce-when-present check, per-IP transient
  rate limit (5/10 min → 429), GDPR `consent_required` (400), durable webhook delivery
  via blocking `wp_remote_post` + `wp_mail` fallback, delivery-failure counter/last-error
  meta, raw-PII retention switch (`AMPY_EV_CALC_STORE_RAW_PII`) + consent metadata log.
- The Excel parser (sheet map, shared strings, EVModels/Chargers/PriceAreas/
  SystemCoefficients/Advanced parsers), the admin metabox, and the `save_post` hook.
- Render-fn plumbing (`$js_data`, font HTML, `data-default-car-id`/`-charger-id` echoes,
  `AmpyEvCalcData` injection) and the `[ampy_ev_lead_magnet]` shortcode.

### Verified

- `diff prototype/engine.js ../_decoded/00_js-engine.js` → identical.
- `diff prototype/styles.css ../_decoded/02_styles.css` → identical.
- All 85 element ids in `prototype/index.html` are present in the backend render markup
  (id set comparison clean; only "extras" are the two PHP `data-default-*` echo attrs),
  so the JS engine wires up. PHP `<?= … ?>` tag pairs balanced; backend-stage anchors
  (`register_rest_route '/lead'`, `consent_required`, `wp_remote_post`,
  `_ampy_ev_calc_delivery_failures`, `AMPY_EV_CALC_STORE_RAW_PII`, parser/metabox/save hook)
  all still grep-present. (Local `php -l` unavailable in this env.)

## Iteration 5 (2026-06-10) — Round-2 Spec A (catalogue + net/gross model + offert) + Spec B (defaults)

Owner-confirmed Round-2, **first slice**: the 16-box catalogue, the net/gross
Grön-Teknik model (fixes the double-deduction blocker), the offert-only path, and
the new 100 % / 20 000 km defaults. The remaining Round-2 items from MASTER-SPEC
(chart→monthly swap §1D, ROI segmented-control redesign §1E, slider perf §1F,
single-CTA + product image §1H, selector grouping/copy/micro-trust) are **not** in
this slice and land next.

| # | File | Change | Why | Port to (WP) |
|---|------|--------|-----|--------------|
| 1 | data.js | Replaced `CHARGERS` with the owner-confirmed 16-box `CATALOGUE_V3` (verbatim, fixed order): 14 consumer boxes + Zaptec Pro (offert-only) + Garo Entity Pro (priced företag/BRF). Each box now carries `priceSek` (NET, after Grön Teknik = "Att betala"), `grossPriceSek` (ordinarie/gross), `offertOnly`, and a real product-page `slug` (e.g. `https://ampy.se/laddboxar/amina-s/`). Header comment rewritten to document the net/gross model | Spec A catalogue + resolves the Grön-Teknik double-deduction blocker (§0/§1A of MASTER-SPEC) | 01_backend.php parser + Excel "Chargers" sheet (add `grossPriceSek`/`offertOnly` columns, real slugs) |
| 2 | data.js | `ADVANCED_DEFAULTS` → `publicChargingPct: 100`, `annualKm: 20000` (type unchanged `dc`) | Spec B defaults | Excel "Advanced" sheet / post-meta defaults |
| 3 | engine.js | `ADVANCED_DEFAULTS` `Object.assign` fallbacks → `100` / `20000` so a missing-data boot uses the new defaults too. Initial state + `init()` snap-to-step are no-ops (100 ∈ `PCT_STEPS`, 20000 ∈ `KM_STEPS`) | Spec B fallbacks + clean initial snap | 00_js-engine.js |
| 4 | engine.js | `calculateFor`: **net/gross model** — `grossPrice = charger.grossPriceSek`, `netCost = charger.priceSek`, `gronTeknik = grossPrice − netCost` (NO second 48,5 % deduction). Added an `r.offert` flag (`charger.offertOnly` or null `priceSek`); for offert boxes `grossPrice`/`netCost`/`gronTeknik`/`paybackYears`/`cumulativeNet*` are `null`, but `annualSaving` + `publicKwh` + rates + the monthly-derivable figures STILL compute (independent of box price). `cumulativeNet[]` entries are null for offert boxes | Spec A net/gross + offert-only path (§1A/B, P0-1) | 00_js-engine.js (`calculateFor`) |
| 5 | engine.js | `renderSingleResult`: when `r.offert` → "Att betala" tile shows **"Begär offert"** (sub "Pris tas fram i offert för din anläggning."), Payback → **"—"**, and the 10-yr tile falls back to pure savings (never NaN); otherwise unchanged "Att betala" = `netCost` with sub "Pris inkl. installation & moms {grossPrice} kr − Grön Teknik {gronTeknik} kr". Count-up memory for `evNetPay` is cleared on the offert path so a switch back to a priced box animates from its real value | Spec A/B offert UI (§1B, d) | 00_js-engine.js (`renderSingleResult`) |
| 6 | engine.js | `renderPaybackChart`: offert boxes force the pure-savings series (`withInvest = state.includeInvestment && !r.offert`) so the chart never reads null `cumulativeNet` coords (no NaN, no break-even marker). (Chart is removed wholesale in the §1D slice; this guard keeps it correct meanwhile) | Prevent NaN on the still-present chart | 00_js-engine.js (`renderPaybackChart`) |
| 7 | engine.js | "Läs mer om {name}" product link now uses the real `charger.slug` and shows for every box (graceful hide retained only if a slug is still `'#'`/empty) | Spec A real slugs (§1I, d) — slugs are now real product URLs | 00_js-engine.js (`renderSingleResult`) |
| 8 | engine.js | `buildPayload`: added a null-preserving `rnd()` so offert-only leads carry **`null`** (not fabricated `0`) for price/payback/cumulative; added `offertOnly` to `results.ev` | Honesty: no fake zeros in the lead payload (§1B) | 00_js-engine.js (`buildPayload`) |

**Verified:** `node --check` clean on `data.js` + `engine.js`. Catalogue parses to 16 boxes in
the spec order; defaults `{annualKm:20000, publicChargingPct:100, dc}`; only Zaptec Pro is
`offertOnly`/null-price; Garo Entity Pro is a normal priced box; every priced box has
`grossPriceSek ≥ priceSek` and `gronTeknik = gross − net`. All 52 engine `getElementById`
ids still resolve in `index.html` (only the runtime-created `ampyEvChartKeyframes` is
absent from markup, as before). Math reconciles at the new defaults (Tesla Model Y / SE3 /
100 % / 20 000 km, DC 5,50): publicKwh ≈ 3 756 kWh/år → annualSaving ≈ 13 520 kr/år for
every box; Zaptec Go "Att betala" 4 490 kr (gross 8 980 − Grön Teknik 4 490), Amina S
4 350 kr (gross 8 700 − 4 350); Zaptec Pro computes annualSaving + publicKwh but null for
all price-derived fields (no NaN).

## Iteration 6 (2026-06-10) — Round-2 Spec C (monthly comparison), D (ROI toggle redesign), F (single lead flow), G (copy)

Owner-confirmed Round-2, **second slice**. Replaces the payback chart with a monthly
publik-vs-hemma cost comparison, redesigns the ROI control to a clean two-pill
segmented control, collapses the lead flow to a single "Få en exakt offert" CTA
(removes the "Maila kalkylen" email path), and fixes the lead-form intro copy.

### Removed element ids (gone from markup + engine; no dangling refs)

| id | Was | Removed because |
|---|---|---|
| `ampyEvPaybackTile` / `ampyEvPaybackValue` | "Payback-tid" trio tile | Spec C — payback removed for this calculator |
| `ampyEvChart` / `ampyEvChartSvg` / `ampyEvChartEmpty` / `ampyEvChartEndValue` / `ampyEvChartToday` | payback SVG chart block | Spec C — chart torn down wholesale |
| `ampyEvBeMarker` / `ampyEvBeTime` | break-even marker | Spec C |
| `ampyEvInvestmentToggleState` | ROI switch state caption | Spec D — redundant with segmented control |
| `ampyEvEmailForm` / `ampyEvEmailInput` / `ampyEvEmailSubmit` / `ampyEvEmailSubmitLabel` / `ampyEvEmailSuccess` / `ampyEvEmailSuccessText` | "Maila kalkylen" email row | Spec F — single lead flow |

### New element ids

| id | Where | Purpose |
|---|---|---|
| `ampyEvMonthly` | results card | wrapper for the monthly comparison panel (bar fractions set via CSS vars) |
| `ampyEvMonthlyPublic` | monthly panel | "Publik laddning idag" kr/mån value (count-up key `evMonthlyPublic`) |
| `ampyEvMonthlyHome` | monthly panel | "Hemma efter installation" kr/mån value (count-up key `evMonthlyHome`) |
| `ampyEvMonthlySaving` | monthly panel | "Du sparar" kr/mån delta value (count-up key `evMonthlySaving`) |
| `ampyEvMonthlyDelta` | monthly panel | full-width delta row wrapper |

`#ampyEvInvestmentToggle` is **reused** but its role changed from `switch` (a single
`<button role=switch aria-checked>`) to a two-pill `role=group` segmented control with
two `<button data-value aria-pressed>` options (`with` / `without`).

### Changes

| # | File | Change | Why | Port to (WP) |
|---|------|--------|-----|--------------|
| 1 | engine.js | `calculateFor` now computes `monthlyPublicCost = publicKwh×publicRate/12`, `monthlyHomeCost = publicKwh×homeRate/12`, `monthlySaving = monthlyPublicCost − monthlyHomeCost`, returned in the result. Segment-agnostic (computed for offert-only boxes too) | Spec C math; reconciles to annual hero (×12) | 00_js-engine.js (`calculateFor`) |
| 2 | engine.js | **Removed `renderPaybackChart()` entirely** (function + its call + the `ampyEvChartKeyframes` style injection + all `$('ampyEvChart*')` / `ampyEvBe*` / `is-no-payback`/`is-savings-only`/`is-no-be`/`is-be-early` refs + chart empty-state strings). Added `renderMonthlyComparison(r)` in its place: sets the three count-up numbers + `--monthly-public-frac`/`--monthly-home-frac` bar fractions (∝ cost). Empty/offert states handled (clears numbers + bars, never NaN) | Spec C teardown + replacement | 00_js-engine.js |
| 3 | engine.js | `renderSingleResult`: dropped the `ampyEvPaybackTile`/`ampyEvPaybackValue` handling, swapped the `renderPaybackChart(r)` call for `renderMonthlyComparison(r)`, cleaned the unavailable branch (no chart refs; resets the three monthly ids) | Spec C wiring | 00_js-engine.js |
| 4 | engine.js | `updateInvestmentToggle()` rewritten: sets `aria-pressed` on both pills from `state.includeInvestment` (`with` pressed when investment counted) instead of `aria-checked` + caption text | Spec D segmented-control a11y | 00_js-engine.js |
| 5 | engine.js | ROI `bindUI` listener: replaced the single switch-toggle click with `wireToggle("ampyEvInvestmentToggle", v => state.includeInvestment = (v === "with"))` (reuses the existing toggle helper) | Spec D behaviour via the standard helper | 00_js-engine.js |
| 6 | engine.js | **Removed `submitEmailForm()`** + its `#ampyEvEmailForm` submit listener in `bindUI`; cleaned the stale "email-only path" comment in `buildPayload` | Spec F single lead flow | 00_js-engine.js |
| 7 | index.html | Replaced the `.ampy-calc__roi-toggle-row` + `.ampy-calc__switch` markup with `.ampy-calc__roi-control` (label) + the two-pill `.ampy-calc__toggle.ampy-calc__toggle--investment` (`role=group`, `aria-labelledby`, two `aria-pressed` buttons). Kept `#ampyEvInvestmentToggleLabel` + tooltip; removed the caption span | Spec D | 01_backend.php |
| 8 | index.html | Removed the `#ampyEvPaybackTile` trio tile and the entire `.ampy-calc__chart-block`; inserted the `.ampy-calc__monthly` panel (heading "Din månadskostnad – publikt vs hemma", two cols + delta row) directly under the trio, above "Hur besparingen räknas" | Spec C | 01_backend.php |
| 9 | index.html | CTA label "Få en offert" → **"Få en exakt offert"**; lead-form intro → exactly "Vår laddbox-expert hör av sig med ett offertförslag, oftast inom en arbetsdag."; removed the `.ampy-calc__cta-secondary` email block; "Läs mer om {box}" link kept as the smaller link below the CTA | Spec F + G | 01_backend.php |
| 10 | styles.css | Removed all `.ampy-calc__chart*` / `.ampy-calc__be-*` / `.ampy-calc__chart-block` / `.ampy-calc__chart-head` rules + the `@container` chart rule; removed `.ampy-calc__switch*` / `.ampy-calc__roi-toggle-row`; removed `.ampy-calc__email-row` / `.ampy-calc__cta-secondary` + the `@container` email-row rule. Added `.ampy-calc__monthly*` (panel, two cost-proportional bars via `::before`/`::after` + `--bar-frac`, delta row), `.ampy-calc__roi-control` + the on-surface `.ampy-calc__toggle--investment` variant (inactive text `--on-surface-text-muted`, active `--action-primary`/white on the dark surface). Fixed the staggered-reveal list (`__chart-block`→`__monthly`, `__roi-toggle-row`→`__roi-control`) | Spec C/D/F styling + teardown | 02_styles.css |

**Verified (in-browser @ localhost:5178 + node):** `node --check` clean on `engine.js` + `data.js`;
0 console errors/warnings across ROI-toggle (both directions), offert-box switch, slider, and
CTA-open interactions. All engine `getElementById` ids resolve in `index.html`. Monthly panel
at default (Tesla Model Y / SE3 / 100 % / 20 000 km / DC 5,50): Publik ≈ 1 721, Hemma ≈ 595,
Du sparar ≈ 1 127 kr/mån; `(public − home) × 12 = 13 520 kr/år` = the annual hero **exactly**,
reconciles at every tested slider position (SE1/50 %/15 000/AC, SE4/75 %/30 000/DC, SE3/25 %/5 000/DC,
SE2/100 %/50 000/AC). ROI "Utan investering" hides "Att betala" + flips the 10-yr label, monthly
stays visible. Offert-only Zaptec Pro: monthly + annual still render (1 721/595/1 127, 13 520),
"Att betala" → "Begär offert", no NaN. CTA = "Få en exakt offert"; lead intro matches the exact
spec string; no `#ampyEvEmailForm`/`.ampy-calc__cta-secondary` in the DOM; "Läs mer om Zaptec Go"
links to the real slug.

**Note:** the "Sparar på 10 år" cumulative tile + its `cumulativeNet`/`cumulativeSavings` series
were left in place (MASTER-SPEC P1-4 / Q-D is an open owner decision, out of scope for this stage).

## Iteration 7 (2026-06-10) — Round-2 Spec E (slider perf) + finesse (P1-1, P1-2, touch/scroll polish)

Implements the laggy-slider fix (MASTER-SPEC §E) and the in-scope conversion/polish
finesse (P1-1 honest 100 %-default framing, P1-2 micro-trust row) plus a11y/touch
hardening for the redesigned ROI toggle and the 16-box catalogue picker. Preserves
stages 1–2. Did **not** touch the open owner decisions (P0 data model / Grön-Teknik
double-deduction, P1-3 Postnummer, P1-4 10-yr tile retire, Spec A/B catalogue
grouping + offert ROI-disable) — those belong to their own specs.

### Changes

| # | File | Change | Why | Port to (WP) |
|---|------|--------|-----|--------------|
| 1 | engine.js | **Slider perf (Spec E).** Rewrote the drag path in `renderRangeSlider`: `.is-dragging` is added on `pointerdown` and removed on `pointerup`/`pointercancel`; `pointermove` only **stores `lastClientX`** and a single `requestAnimationFrame` (`paintDrag`) coalesces the paint (≤1×/frame). During drag the thumb tracks the **raw pointer via a composited `translateX`** off its nearest-step `left` anchor (the sub-step residual), and the fill tracks it via **`scaleX`** (no per-frame width reflow). On release `updateVisual(current)` snaps home with transitions restored. Replaced the old `pickByX` (which wrote `left`/`width` every move while a 300 ms transition was live → trailing). `setPointerCapture` wrapped in try/catch. | Spec E — thumb trailed the pointer because every drag pixel restarted a 300 ms `left`/`width` transition + forced layout | 00_js-engine.js (`renderRangeSlider`) |
| 2 | engine.js | `updateVisual` now expresses the snapped fill via `scaleX` on a full-travel base width (same mechanism as the drag path, so release never flashes between a width- and a transform-based fill) and clears the inline drag transforms. | Spec E — unify snap + drag paint; glitch-free release | 00_js-engine.js |
| 3 | styles.css | `.ampy-calc__slider-fill`: `transition: width …` → `transition: transform …` + `transform-origin: left center` (fill length is now `scaleX`, animates on the compositor). `.ampy-calc__slider-thumb` transform transition gets the shared easing. Added `.ampy-calc__slider.is-dragging .slider-fill, .is-dragging .slider-thumb { transition: none; }` (the load-bearing transition-kill) + `.is-dragging .slider-thumb { cursor: grabbing; }`. | Spec E styling | 02_styles.css |
| 4 | styles.css | Touch target (WCAG 2.5.5): `.ampy-calc__toggle-option` coarse-pointer `min-height` **4rem → 4.4rem** (≥44px) — covers the redesigned ROI "Med/Utan investering" pills and the AC/DC toggle. | The redesigned toggle pills were 40px on touch, under 44px | 02_styles.css |
| 5 | engine.js | **P1-1 honest 100 %-framing.** Hero sub (`#ampyEvHeroAnnualSub`) is now %-aware: ≥100 % → "om du flyttar all din publika laddning hem"; 1–99 % → "om du flyttar {pct} % av din publika laddning hem"; 0 % → "Höj andelen offentlig laddning för att se din besparing." (was the static "jämfört med fortsatt publik laddning"). Segment-agnostic (renders for offert-only boxes too). Framing only — no math change. | P1-1 — keep the (maximised) 100 %-default headline honest | 00_js-engine.js (`renderSingleResult`) |
| 6 | index.html | **P1-2 micro-trust row** added directly under `#ampyEvCtaQuote`, reusing the already-styled-but-unused `.ampy-calc__micro-trust`: three spans w/ a success-check SVG (aria-hidden) — "Svar inom 24 h" · "Inget köpkrav" · "Dina uppgifter skyddas". | P1-2 — risk-reversal at the decision point | 01_backend.php |
| 7 | index.html | Andel-tooltip reworded to frame the slider as "andelen … som du kan flytta hem … 100 % betyder att all din nuvarande publika laddning flyttas hem" (kept the 60–80 % typical-share note). | P1-1 companion — tooltip matches the honest 100 % model | 01_backend.php |
| 8 | styles.css | `.ampy-calc__selector-list` `max-height: 50rem` → `min(50rem, 60vh)` + `overscroll-behavior: contain` + `-webkit-overflow-scrolling: touch`. | Catalogue picker scroll for the 16-box list — never run off a short viewport; no page chain-scroll on touch flick | 02_styles.css |

**Verified (in-browser @ localhost:5178 + node):** `node --check` clean on `engine.js` + `data.js`;
0 console errors/warnings on load and across region / AC-DC / km / pct / applicant / ROI-toggle /
offert-box / CTA-open interactions. All 49 engine `getElementById` ids (static + the dynamic
selector ids) resolve in `index.html`.
**Spec E:** at rest the fill transition is `transform 0.3s` with `transform-origin` left; `.is-dragging`
drives both fill + thumb transition-duration to `0s` (confirmed via computed style); fill `scaleX`
tracks exact step fractions on tick/keyboard (0, 0.571, 0.714, 1 …) and recalcs; thumb resets to
`translate(-50%,-50%)` + snapped `left` on release; drag lifecycle adds/removes `.is-dragging` on
down/up. Smooth with no trailing on desktop; on mobile (375px) the 100 % thumb stays within the
track (right 351 = slider right 351), no horizontal overflow, km ticks collapse to endpoints.
**a11y/toggle:** investment toggle `role=group` + `aria-labelledby`, two native `<button aria-pressed>`,
flips with/without correctly + hides "Att betala" + flips the 10-yr label; AC/DC same pattern. AA
contrast on the dark surface — monthly labels 8.45:1, public value 9.85, home 8.33, delta 8.33–16.7,
hero sub/eyebrow 8.45, micro-trust 8.45, active-pill white-on-teal 5.07 — all pass AA.
**Reconciliation intact:** `(monthlyPublic − monthlyHome) × 12 = annual` to ≤12 kr (rounding) across
default 100 %/20k/DC/SE3, SE1, SE1/AC, SE1/AC/50k, SE1/AC/50k/75 %.
**P1-1:** hero sub reads "…all din publika laddning hem" at 100 %, "…50 % av…" at 50 %, the empty-state
copy at 0 %. **Offert-only (Zaptec Pro):** monthly + annual still render, no NaN, "Att betala" →
"Begär offert", same honest hero framing, restores cleanly.

## Port to WordPress (2026-06-10, round 2) — prototype → deployed snippets (iters 5–7 folded in)

Second release-engineering pass. The earlier port (above) only carried iterations 1–4.
This pass re-syncs all three deployed FluentSnippets sources under `../_decoded/` with the
current prototype, folding in the Round-2 work: the 16-box catalogue + net/gross
Grön-Teknik model + offert path (iter 5), the chart→monthly-comparison swap + ROI
toggle redesign + single-CTA lead flow + copy (iter 6), and the slider-perf rewrite +
P1-1/P1-2 finesse (iter 7). No prototype logic was changed during the port.

| Target snippet | Action | Result |
|---|---|---|
| `../_decoded/00_js-engine.js` | Replaced verbatim with `prototype/engine.js` | byte-identical to prototype (`diff` clean) |
| `../_decoded/02_styles.css` | Replaced verbatim with `prototype/styles.css` | byte-identical to prototype (`diff` clean) |
| `../_decoded/01_backend.php` | Updated **only** the markup inside `ampy_render_ev_lead_magnet()` to match `prototype/index.html` | see markup notes below |

### Markup re-ported into `ampy_render_ev_lead_magnet()` (delta vs the iter 1–4 port)

- **ROI control redesigned (iter 6 / Spec D):** the old `.ampy-calc__roi-toggle-row` +
  `role=switch` `.ampy-calc__switch` (track/thumb/state) was replaced with
  `.ampy-calc__roi-control` (label) + a two-pill `.ampy-calc__toggle.ampy-calc__toggle--investment`
  (`role=group`, `aria-labelledby="ampyEvInvestmentToggleLabel"`, two
  `<button data-value="with"/"without" aria-pressed>` options). `#ampyEvInvestmentToggle`
  id reused; `#ampyEvInvestmentToggleState` removed.
- **Chart → monthly comparison (iter 6 / Spec C):** the entire `.ampy-calc__chart-block`
  (`#ampyEvChart*`, `#ampyEvBeMarker`/`#ampyEvBeTime`, inline SVG) and the
  `#ampyEvPaybackTile`/`#ampyEvPaybackValue` trio tile were removed. Inserted the
  `.ampy-calc__monthly` panel (`#ampyEvMonthly`, heading "Din månadskostnad – publikt vs
  hemma", `#ampyEvMonthlyPublic` / `#ampyEvMonthlyHome` cols + `#ampyEvMonthlyDelta` /
  `#ampyEvMonthlySaving` row) directly under the trio, above "Hur besparingen räknas".
- **Single lead flow (iter 6 / Spec F):** CTA label "Få en offert" → **"Få en exakt offert"**;
  the `.ampy-calc__cta-secondary` "Maila kalkylen" email block (`#ampyEvEmailForm`/
  `#ampyEvEmailInput`/`#ampyEvEmailSubmit`/`#ampyEvEmailSuccess` …) was removed; the
  smaller "Läs mer om {box}" link (`#ampyEvProductLink`) is kept below the CTA.
- **Lead-form copy (iter 6 / Spec G):** intro → exactly "Vår laddbox-expert hör av sig med
  ett offertförslag, oftast inom en arbetsdag."
- **Micro-trust row (iter 7 / P1-2):** added `.ampy-calc__micro-trust` (three
  aria-hidden check SVGs — "Svar inom 24 h" · "Inget köpkrav" · "Dina uppgifter skyddas")
  directly under `#ampyEvCtaQuote`.
- **Andel-tooltip (iter 7 / P1-1):** reworded to the honest 100 %-default framing
  ("andelen … som du kan flytta hem … 100 % betyder att all din nuvarande publika
  laddning flyttas hem").
- Helper substitution unchanged: both selector chevrons → `ampy_ev_chevron()`, the
  CTA arrow → `ampy_ev_arrow_icon()`; car/charger icons stay JS-rendered; the remaining
  literal SVGs (CTA/lead/error/product-link, success check, micro-trust checks) have no
  PHP helper and stay literal, exactly as in the prototype. All ids kept identical.

### Preserved — backend-stage PHP (untouched), incl. the round-2 charger-parser changes

The backend-hardening PHP was **not removed or altered**:
- REST routes `/data/{id}` (READABLE) and `/lead/{id}` (CREATABLE, public + in-callback enforcement).
- Lead callback: payload-size cap (413), type allow-list, honeypot accept-but-drop,
  form-open delta sub-2s reject (`too_fast`), nonce-when-present check, per-IP transient
  rate limit (5/10 min → 429), GDPR `consent_required` (400), durable webhook delivery
  via blocking `wp_remote_post` + `wp_mail` fallback, delivery-failure counter/last-error
  meta, raw-PII retention switch (`AMPY_EV_CALC_STORE_RAW_PII`) + consent metadata log.
- **Round-2 charger parser** `ampy_ev_calc_parse_chargers()`: net `priceSek` + `grossPriceSek`
  (null when blank) + `offertOnly` + real `slug`, with offert-keep / blank-price-skip logic — intact.
- The rest of the Excel parser (sheet map, shared strings, EVModels/PriceAreas/
  SystemCoefficients/Advanced), the admin metabox, and the `save_post` hook.
- Render-fn plumbing (`$js_data`, font HTML, `data-default-car-id`/`-charger-id` echoes,
  `AmpyEvCalcData` injection) and the `[ampy_ev_lead_magnet]` shortcode.

### Verified

- `diff prototype/engine.js ../_decoded/00_js-engine.js` → identical; `diff prototype/styles.css
  ../_decoded/02_styles.css` → identical.
- Stale markup grep clean: no `ampy-calc__switch` / `ampy-calc__chart` / `ampyEvChart` /
  `ampyEvBe*` / `ampyEvPaybackTile` / `roi-toggle` / `ampy-calc__email-row` / `ampyEvEmail` /
  `cta-secondary` remains in `01_backend.php`. New markup present:
  `ampy-calc__toggle--investment`, `#ampyEvMonthly*`, `micro-trust`, "Få en exakt offert".
- PHP `<?= … ?>` tag pairs balanced; backend-stage anchors all still grep-present
  (`register_rest_route '/lead'`, `consent_required`, `wp_remote_post`,
  `_ampy_ev_calc_delivery_failures`, `AMPY_EV_CALC_STORE_RAW_PII`, `parse_chargers` with
  `grossPriceSek`/`offertOnly`, metabox, `save_post` hook, `return ob_get_clean`, shortcode).
  (Local `php -l` unavailable in this env.)

## Iteration 8 (2026-06-11) — R3 STAGE 1: structure + data + scheduled bar (MASTER-SPEC v2)

Implements the owner's STRUCTURE + DATA + SCHEDULED BAR stage from `MASTER-SPEC-v2.md`,
`research/r3-copy.md`, and `research/r3-scheduled-charging.md`. Owner REMOVE/DECISIONS
override any contrary expert "keep". **This stage is data/DOM/copy/scheduled-bar only —
the headline `annualSaving` math is untouched** (still flat-rate; verified 13 520 kr/år
on the SE3 Model-Y default). **Not in this stage:** the Part 3 pixel-craft pass
(badge tiers, type staircase, bars-as-climax, tooltip popover, slider touch fixes,
mobile sizing) and the host-page 62.5 % rem-scoping (G4).

### DATA (`data.js`)
| # | Change | Why |
|---|---|---|
| 1 | REGIONS: added `homeRateOptimizedSekPerKwh` per zone — **SE1 1.05 · SE2 1.15 · SE3 1.35 · SE4 1.45** (owner D1 "aggressive-but-defensible", ~23–31 % under flat; overrides the spec's milder 1.30/1.35/1.60/1.80) | Feeds the third "Hemma, schemalagd" bar. Data-contract change #1. |
| 2 | All 16 chargers: `description` + `badge` set from CHARGERS_R3 (R3 marketing copy); prices/slugs/`offertOnly` kept | Point 10 / r3-copy §3. Data-contract change #2. Exactly **7 of 16** badged (Bästsäljare ×2, Rekommenderas, Prisvärd, Dubbel laddning, Offert, Företag/BRF). |
| 3 | **Amina S** badge `Rekommenderas` → `null` | Owner-mandated removal (badge moved to Zaptec Go 2). |
| 4 | **Charge Amps Aura** (D3): `"11 kW · stativ…"` → `"Två bilar samtidigt · inkl. installation"`, badge `null` → `Dubbel laddning`, `maxPowerKw` 11 → **22** | Confirmed dual-outlet 22 kW per product page; old data was a false single-outlet spec. |

### ENGINE removals / simplifications (`engine.js`)
| # | Change | Why |
|---|---|---|
| 5 | **ROI toggle removed entirely** — dropped `state.includeInvestment`, `updateInvestmentToggle()` + its `renderAll` call, the `wireToggle("ampyEvInvestmentToggle",…)` binding | Owner REMOVE (Point 4). Single view: net price + 10-yr net always shown. |
| 6 | `renderSingleResult` simplified to the always-invest path: 10-yr tile always uses `cumulativeNet` for priced boxes (savings series for offert, no NaN); `ampyEvNetPayTile` always visible | Follows from #5. `calculateFor`'s `cumulativeNet` kept. |
| 7 | **"Antal sökande" stepper removed** — deleted `renderApplicants()` + its `renderAll` call + both `±` click bindings. `state.numTaxApplicants` hard-pinned to **1**; Grön Teknik **cap logic kept** in the engine; `numTaxApplicants:1` kept in `buildPayload` inputs | Owner REMOVE (Point 3). |
| 8 | **"Spann …" hero line removed** — deleted both `ampyEvAnnualRange` writes (active + unavailable reset). `savingLow/High` still computed (methodology + payload) | Owner REMOVE (Point 5). |
| 9 | **Savings-breakdown explainer `… kWh × … kr/kWh = … kr/år` paragraph removed** — kept the 3 rate rows (public, home, bold "Du sparar per kWh") | Owner REMOVE (Point 7); math verified correct, the row was just confusing. |
| 10 | **D2 single price line:** "Att betala" sub now `"Pris inkl. installation, Grön Teknik & moms"` — removed the `{gross} kr − Grön Teknik {x} kr` breakdown. `gross`/`gronTeknik` still in payload | Owner D2 / Point 6. |
| 11 | `buildPayload` `results.ev`: dropped `includeInvestment` key | Only payload-shape change (Point 4). ⚠️ confirm n8n/backend before WP port. |
| 12 | REGIONS engine fallback (L27–32) mirrors the 4 optimised rates | Old data never NaNs the third bar. |

### ENGINE additions (`engine.js`)
| # | Change | Why |
|---|---|---|
| 13 | `calculateFor`: added `homeRateOpt = (REGIONS[zone].homeRateOptimizedSekPerKwh \|\| homeRate*0.78)` and `monthlyHomeOptCost = publicKwh × homeRateOpt / 12`; both returned on `r`. **`annualSaving` (flat) untouched** | Owner D1 third-bar math. |
| 14 | `renderMonthlyComparison`: third bar — sets `--monthly-homeopt-frac = homeOpt/maxCost` (maxCost stays public) + `animateNumber("evMonthlyHomeOpt",…)`; degrades to "—"/0 in empty/0 %/offert paths. Works in **offert state too** (verified) | Owner D1. |
| 15 | `populateMethodology`: 5 items rewritten to benefit-led copy (Point 9 / r3-copy §2) + **new item 6 "Schemalagd laddning"** ("…när elen är som billigast…", never "på natten"; ca 20–30 % of hemmakostnad, not the full 30–60 % spread) | Point 9 + D1 honesty (MFL §10). Item-6 % widened from the spec's 10–16 % to match the owner's more aggressive optimised rates. |

### DOM / COPY (`index.html`)
| # | Change | Why |
|---|---|---|
| 16 | Removed: ROI control block, applicants stepper field, `ampyEvAnnualRange` span, the 3-item micro-trust `<p>` | Points 3/4/5/8a. |
| 17 | Added the **third `.ampy-calc__monthly-col--homeopt`** ("Hemma, schemalagd") with `#ampyEvMonthlyHomeOpt` + an "i" tooltip ("…spotpriset är 30–60 % lägre på lågpristimmar…"). Tagged the existing public/home cols with `--public`/`--home` modifier classes | Owner D1. |
| 18 | Tooltips rewritten: Andel offentlig laddning, Elprisområde, Typ av offentlig laddning | Points 1/2a + r3-copy §1. |
| 19 | Primary CTA `Få en exakt offert →` → **`Få en laddbox-offert →`** (owner-mandated compound; overrides r3-copy's "keep exakt") | Owner CTA directive. |
| 20 | Removed phone (`07X XXX XX XX`) + zip (`12345`) placeholders; added `inputmode="tel"` to phone | Point 8b. |
| 21 | Methodology disclaimer + footnote rewritten ("Så här läser du kalkylen." / `* "Att betala" är ungefärligt pris … med Grön Teknik-avdraget redan avdraget…`) | Point 9 / r3-copy §2. |

### CSS (`styles.css`) — only dead CSS + the new third bar
| # | Change | Why |
|---|---|---|
| 22 | Monthly bars: replaced `:first-child`/`:last-child` fraction selectors with explicit `--public`/`--home`/`--homeopt` modifier classes; added the **third-bar style** (dashed lighter-green `repeating-linear-gradient`, value `--fs-md` + 0.85 opacity → subordinate to the solid home bar) | Third bar would have broken `:last-child` (home). |
| 23 | Removed now-dead rules: `.ampy-calc__roi-control(-label)`, `.ampy-calc__toggle--investment*`, `.ampy-calc__stepper*`, `.ampy-calc__hero15-range`, `.ampy-calc__micro-trust*`, and the `roi-control` reveal-stagger entry | Components removed above. |

### IDs removed / added
- **Removed (DOM):** `ampyEvAnnualRange`, `ampyEvApplicantsLabel`, `ampyEvApplicantsDec`,
  `ampyEvApplicantsValue`, `ampyEvApplicantsInc`, `ampyEvInvestmentToggleLabel`,
  `ampyEvInvestmentToggle`. (No remaining `aria-labelledby`/`describedby` points at any of them.)
- **Added (DOM):** `ampyEvMonthlyHomeOpt` (third-bar value span).
- **Engine fns removed:** `updateInvestmentToggle`, `renderApplicants`.

### Verify
- `node --check` clean on `data.js` + `engine.js`. All **33** engine-referenced element
  ids resolve in `index.html` (automated cross-check). No dangling `ampyEvApplicants` /
  `ampyEvInvestmentToggle` / `roi-control` / `ampyEvAnnualRange` / `micro-trust` refs in
  html/js/css. No console errors in browser.
- **Math (SE3 Model-Y, 20 000 km, 100 %, DC):** headline **13 520 kr/år UNCHANGED**;
  monthly publik **1 721** / hemma **595** / schemalagd **423**; staircase pub>home>opt
  holds; `(publik − schemalagd) × 12` reconciles to `annualSavingOpt`; 10-yr **130 710 kr**;
  Att betala **4 490 kr / "Pris inkl. installation, Grön Teknik & moms"**.
- **SE4:** home 657 / schemalagd 454 (per-zone optimised rate updates). **Offert
  (Zaptec Pro):** "Begär offert" + third bar still renders (423 kr/mån). Default selector =
  Zaptec Go "Kompakt favorit · inkl. installation" + **Bästsäljare** badge; CTA =
  "Få en laddbox-offert".

### Port to WP (next)
- `01_backend.php` (`ampy_render_ev_lead_magnet`): the 16 box `description`/`badge`,
  the per-zone `homeRateOptimizedSekPerKwh`, the third monthly col + its "i", the removed
  ROI/applicants/span/micro-trust DOM, the rewritten tooltips/disclaimer/footnote, the
  CTA label, removed placeholders.
- `00_js-engine.js`: items 5–15 above (REGIONS fallback, `calculateFor` opt-rate math,
  third-bar render, removed toggle/stepper/span/explainer, D2 price line, methodology).
- `excel/build_xlsx.py` + oracle: emit the new `homeRateOptimizedSekPerKwh` column + the
  16 box strings; assert all 4 optimised rates and the 16 descriptions/badges.
- ⚠️ Confirm the n8n payload no longer keys on `results.ev.includeInvestment`.

## Iteration 9 (2026-06-11) — R3 STAGE 2: apply rewritten copy verbatim (r3-copy.md)

Copy-only pass. Applies the verbatim rewritten Swedish microcopy from
`research/r3-copy.md` and verifies that everything stage 1 (iter 8) set still
matches it exactly. **No structural, math, or data changes** — the headline
`annualSaving` and the third-bar logic are untouched.

| # | File | Change | Why |
|---|---|---|---|
| 1 | engine.js | **pct-0 empty state warmed** — hero sub at `publicChargingPct = 0` changed from `"Höj andelen offentlig laddning för att se din besparing."` → **`"Dra upp andelen publik laddning så ser du vad du kan spara."`** | r3-copy.md §4 ("Other on-screen microcopy") — the only string still on the old wording after iter 8. |

### Verified-already-matching (no edit needed — confirmed verbatim vs r3-copy.md)

- **Tooltips (index.html):** Andel offentlig laddning (L106), Typ av offentlig
  laddning (L122), Elprisområde (L139) — all three byte-match r3-copy §"KEY COPY".
- **Methodology (engine.js `populateMethodology`):** items 1–5 render verbatim to
  r3-copy §2 (item-1 `90 %` derived from `RATES.chargerEfficiencyPct`; item-2
  `AC 4,50 · DC 5,50` derived from `RATES`; item-4 `48,5 % … (upp till 2 sökande)`
  derived from `RATES`). Item 6 "Schemalagd laddning" kept at **ca 20–30 %** (NOT
  the spec's 10–16 %) because the owner's data.js optimised rates
  (SE1 1.05 / SE2 1.15 / SE3 1.35 / SE4 1.45) are 23–31 % below flat — verified by
  computation; 10–16 % copy would contradict the displayed third bar. Owner data wins.
- **Disclaimer + footnote (index.html L354–359):** "Så här läser du kalkylen." block
  and `* "Att betala" är ungefärligt pris … med Grön Teknik-avdraget redan avdraget…`
  match r3-copy §2 verbatim.
- **In-result price label (engine.js L791):** `Pris inkl. installation, Grön Teknik & moms` ✓.
- **16 box descriptions/tags (data.js):** all 16 match r3-copy §3 verbatim; exactly
  7 of 16 badged; Amina S badge gone; Aura = "Två bilar samtidigt"/"Dubbel laddning".
- **CTA = exactly two actions:** primary `Få en laddbox-offert →` (L257) + smaller
  `Läs mer om {box} →` product link (L334–336). No micro-trust, no antal-sökande,
  no ROI toggle re-introduced.

### Verify
- `node --check` clean on `engine.js` + `data.js`.
- No stale `"Höj andelen offentlig laddning"` string remains in live code (only the
  historical mention in this log, iter 7 row). New warmer string grep-confirmed in
  `engine.js`.

### Port to WP (next)
- `00_js-engine.js`: the one-line pct-0 hero-sub string change.
- The rest of this stage was verification-only (no new edits to port).

## Iteration 8 (2026-06-11) — PIXEL-CRAFT + MOBILE PASS (owner points 11–15)

Pixel/interaction pass against MASTER-SPEC-v2 Part 3 + `r3-audit-ui-pixel.md` +
`r3-audit-usability-mobile.md`. Stages 1–2 (copy, removals, third bar, math)
untouched — this is pure CSS/JS craft. `node --check` clean on `engine.js` +
`data.js`; browser-verified desktop + mobile (320 / 375 / desktop). No console
errors. Files: `styles.css`, `engine.js`, `index.html`.

### Point 13 — tooltip redesign (the big one)
- **Replaced the pure-CSS `::after` data-tip slab with a JS popover** (`engine.js`
  `setupTooltips` + `.ampy-calc__popover` CSS). One reusable popover per "i",
  built from its `data-tip`, appended to `<body>` (NOT `.ampy-calc-outer` — that
  wrapper's `container-type:inline-size` would re-anchor a `position:fixed` child
  and break the viewport-coordinate math). Tokens carry px fallbacks since it
  lives outside the scoped `.ampy-calc`.
- Triggers: **desktop** hover/keyboard-focus open, leave/blur/Escape close;
  **touch** tap-toggle, outside-tap / Escape / scroll / re-tap close. A
  `pointerdown` pointerType guard stops a touch-induced focus from auto-opening
  then the tap's click closing it. **One open at a time** (closes other tips AND
  selectors). Caret tracks the "i"; bubble clamped to a 12px viewport gutter,
  width-capped at `min(280px, 100vw−24px)` with `box-sizing:border-box`. Prefers
  above, flips below. `aria-expanded`/`aria-controls`/`role="tooltip"`/
  `aria-describedby`; reduced-motion drops the entrance. **Verified:** mobile
  popover renders 280px (not a full-width slab), near-edge region tip stays in
  viewport, outside-tap/Escape/re-tap all close, only one open.
- Removed the old `.ampy-calc__tip::after` bubble + the `max-width:768px`
  full-width slab rule + the coarse-pointer `::after` override + `cursor:help`.

### Point 11 — Apple-smooth slider drag
- **`touch-action: pan-y` at rest, `none` while `.is-dragging`** (`styles.css`) +
  `pointerdown` now calls `e.preventDefault()` on a **non-passive** listener and
  ignores non-left buttons (`engine.js`). This is the actual iOS lag fix (kills
  scroll-vs-drag disambiguation). **Verified:** `touch-action` flips none↔pan-y,
  `preventDefault` honoured, `.is-dragging` toggles correctly; a synthetic drag
  to 97 % snapped km→50 000 and recalced the hero.
- **Robust geometry:** `dragGeom` reads the real thumb half-width
  (`getComputedStyle(thumb).width/2`) instead of the hard-coded 12/24px, so the
  thumb stays under the finger if the host root font-size ≠ 62.5 % (G4).
- **Window-level `pointermove`/`pointerup` fallback** while dragging (a fast drag
  off the thumb still tracks even if `setPointerCapture` throws).
- **No count-up mid-drag:** `_dragInstant` flag makes `animateNumber` write
  instantly during a drag; one animated settle runs on release (no machine-gun).
- **Fill + thumb release transitions unified to `--motion-fast`** so they land
  together (was fill trailing the thumb by 150 ms).

### Point 12 — mobile km ticks legible
- `renderRangeSlider` gains `visibleTickValues`; km slider passes
  `[5000,20000,30000,50000]` (the actual even-spaced steps — 35k isn't a real
  step). Non-labelled stops render as a 2px tick **mark**
  (`.ampy-calc__slider-tick--marker::after`), not invisible text. Deleted the old
  `≤390px` "blank every interior label" hack. All 8 stops stay
  draggable/snappable/keyboard-reachable. Tick→track gap `xs→sm`. **Verified:** 4
  legible labels + marks at 375/320px.

### Point 14 — mobile "blaffigt"
- Four clamp **floors** lowered (desktop ceilings untouched): `--fs-2xl` 2.2→2.0,
  `--fs-xl` 2.0→1.8, `--fs-lg` 1.8→1.7, `--fs-4xl` 4.0→3.4rem.
- `@container ≤600px`: H1 `clamp(2rem,6.4cqi,2.6rem)` lh 1.15 ls −0.01em; selector
  img 56→48px + prominent padding md→sm; hero value↔unit gap 1.2→0.6rem + unit
  `--fs-xl→--fs-lg`; dark-card block gap + monthly-panel padding lg→md; input card
  gap lg→md; container gap →lg.
- `@container ≤480px`: hero value steps down to `--fs-3xl`.
- `@container ≤420px`: card padding lg→md (reclaims ~10px/side).
- **Verified at 320px:** no horizontal overflow, hero value clears the card edge
  by ≥8px, H1 reads as a tight 2-line headline.

### Point 15 / Part 3 — pixel craft
- **4-tier staircase (3-0a):** 10-year cumulative tile value `--fs-lg→--fs-xl`
  (`#ampyEvCumulativeTile` only; "Att betala" stays lg); monthly delta
  `--fs-lg→--fs-xl`. Schemalagd value already `--fs-md`. Squint test = 4 tiers.
- **Bars as climax (3-0b):** bar height 6→10px; empty-track tint →0.08; bar gap
  md→lg; public bar gets a **crisp amber end cap** (solid→darker, was fading
  translucent). Third schemalagd bar = lighter dashed green (subordinate).
- **Badges 3-tier (3-1):** `--badge--promote` (solid teal: Bästsäljare,
  Rekommenderas), `--badge--soft` (wash: Prisvärd, Dubbel laddning, Populär),
  `--badge--flow`/`--muted` (outline: Offert, Företag/BRF). Mapped via
  `BADGE_TIER`/`badgeTierClass` in `engine.js`. Right-aligned before the chevron
  (selected) / off the edge (list). **Verified:** 7 badges, 3 distinct weights.
- **Weight system (3-2):** selector img 56→48px desktop (matches dropdown option);
  `--tier--primary` gap lg→md; dropped the tier-label negative margin; tier-label
  tracking 0.08→0.06em (P2-3).
- **Hero (3-3):** hero-sub colour muted→full (owner-loved framing no longer faint).
- **Trio (3-4):** `1.2fr 1fr` at ≥560px; removed the redundant trio→monthly `<hr>`.
- **CTA (3-5):** "Läs mer" promoted to a bordered secondary button
  (`--btn-link--bordered`); **8c continuous underline** — phrase wrapped in one
  inline `.ampy-calc__btn-link-label`, container `text-decoration:none`, only the
  label underlines on hover/focus, arrow excluded (**verified**); form CTA
  `scrollIntoView` `nearest`→`start`.
- **Nested cards (3-6):** dropped the lead-form's full border (now a section, not
  a mini-card).
- **Polish:** all focus rings repointed from the old `rgba(0,169,145,…)` to the
  current `rgb(0,125,107)` (P2-5); segmented + AC/DC toggle share `min-height:4rem`
  + active region pill 1px ring (P2-4); tick labels mono→body font (P2-2);
  reveal-stagger re-timed 40/100/160/220/280 (P2-6); `≈` kept on the hero only
  (1 glyph remains, was 5).

### Port to WP (next)
- `00_js-engine.js`: `setupTooltips` + popover system, slider drag changes
  (`touch-action`/`preventDefault`/non-passive, `dragGeom` thumb-width, window
  listeners, `_dragInstant`, release-transition), `visibleTickValues`, the badge
  tier map, `scrollIntoView` block:start.
- `01_backend.php` markup: `.ampy-calc__btn-link-label` wrapper, removed
  trio→monthly `<hr>`, the four monthly `≈` removed.
- The CSS block is the FluentSnippets frontend stylesheet (1:1).
- ⚠ G4 still open: scope `html{font-size:62.5%}` to the component in the WP port
  (the popover already uses px fallbacks so it survives a 16px host root).

## Backlog — judgment calls for owner (not yet done)

1. **Default public type = DC (5,99 kr/kWh) maximises the headline.** DC vs AC (4,50)
   is a positioning/honesty choice — DC gives the biggest gap vs home. Decide whether
   AC or a blend is more representative for the target audience.
2. **Model framing:** the saving assumes 100 % of *today's* public charging moves home.
   Realistic (road trips still need public charging) → consider modelling a small
   residual public share post-install. Now clarified in copy; the math is unchanged.
3. **`aria-live="polite"` on the whole results card** re-announces the entire card on
   every recalculation (noisy with count-up). Scope live regions to key values.
   (Shared pattern with the battery calc.)
4. **Research sign-off on the load-bearing rates** (public AC/DC, home SE1–SE4, Grön
   Teknik schablon) once the real .xlsx lands — same process as the LED calc. These
   numbers *are* the claim.
5. ~~**Payback reads almost too-good-to-be-true** — consider whether to lead with
   annual saving for credibility.~~ **Done (iter 3):** annual saving is now the
   dominant hero in both toggle states; the payback figure is demoted to a secondary
   tile that the ROI toggle can hide entirely.
