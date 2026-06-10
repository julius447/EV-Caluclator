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
