# R4 — Code-Quality + Dead-Code Audit (laddbox-kalkylator)

Scope: `prototype/{index.html,engine.js,styles.css,data.js}`, WP mirror `_decoded/{01_backend.php,00_js-engine.js,02_styles.css}`, `excel/verify_faithful.py`.
Date: 2026-06-11. Live: https://julius447.github.io/EV-Caluclator/

**Parity baseline (verified):** `diff prototype/engine.js _decoded/00_js-engine.js` → IDENTICAL; `diff prototype/styles.css _decoded/02_styles.css` → IDENTICAL. So every CSS/JS finding below applies to BOTH layers and a fix MUST be made in both files to keep verbatim parity. The PHP render markup (`ampy_render_ev_lead_magnet`) matches `index.html` element-for-element with ids intact, EXCEPT the documented head/font-scope difference (Finding 14) and SVGs factored into helper functions (cosmetic, not drift).

Legend: **SAFE-TO-REMOVE** = provably dead (zero runtime references). **REVIEW** = needs a human decision (live copy, cross-layer behaviour, or shared-snippet blast radius).

---

## A. DEAD CODE / ORPHANED CSS FROM R3 REMOVALS

The R3 removals left NO dead JS functions — `submitEmailForm`, `ampyEvEmailForm`, `renderPaybackChart`, and any `includeInvestment`/applicants-stepper handlers are fully gone from `engine.js` (grep: 0 hits). The dead weight is in CSS classes that were never deleted, plus residual `numTaxApplicants` plumbing. The orphan set is larger than just R3 — it includes battery/LED-calc leftovers carried over from the shared scaffold.

### A1. Payback-chart CSS (REMOVED feature) — **SAFE-TO-REMOVE**
The SVG payback chart was replaced by the monthly-cost panel; its line/zone tokens are now orphaned.
- `styles.css:66-69` — `--chart-line-loss`, `--chart-line-profit`, `--chart-zone-loss`, `--chart-zone-profit` (zero refs in markup/JS). **SAFE-TO-REMOVE.**
- `styles.css:61-64` — `--chart-stream-1..4` (only consumed by the dead streams legend, A2). **SAFE-TO-REMOVE.**

### A2. Streams chart CSS (battery-calc leftover, never in EV markup) — **SAFE-TO-REMOVE**
14 selectors, zero references in `index.html`/`engine.js`:
`styles.css:548-568` — `.ampy-calc__streams`, `__streams-bar`, `__streams-segment`, `__streams-legend`, `__stream-row`, `__stream-dot`, `__stream-name`, `__stream-value`, `__stream-pct`, `__stream-row--zero`; plus `styles.css:1043-1054` `.ampy-calc__streams-disclosure`, `__streams-summary` (+ open-state rules). **SAFE-TO-REMOVE.**

### A3. Spec-table CSS (leftover) — **SAFE-TO-REMOVE**
`styles.css:676-685` `.ampy-calc__spec-table` (+ th/td/last-child) and `styles.css:1056-1068` `.ampy-calc__spec-disclosure`, `__spec-summary` — zero markup/JS refs. **SAFE-TO-REMOVE.**

### A4. Cumulative-callout CSS (leftover; not the trio tile) — **SAFE-TO-REMOVE**
`styles.css:664-673` `.ampy-calc__cumulative`, `__cumulative-label`, `__cumulative-value`, `__cumulative-suffix`. (The JS `cumulativeNet*` are local variables, NOT these classes — the rendered 10-yr figure uses `.ampy-calc__trio-*`.) Zero markup refs. **SAFE-TO-REMOVE.**

### A5. Trust-strip / micro-trust CSS (REMOVED feature) — **SAFE-TO-REMOVE**
`styles.css:775-789` `.ampy-calc__trust-strip`, `__trust-block`, `__trust-block-icon`, `__trust-block-text`, `__trust-block-title`, `__trust-block-sub`. The "Svar inom 24 h…" micro-trust strip is gone from markup; these are orphaned. **SAFE-TO-REMOVE.**

### A6. Old hero (pre-hero15) CSS — **SAFE-TO-REMOVE**
The card now uses `.ampy-calc__hero15*`. The old hero set is orphaned:
`styles.css:526-538` `.ampy-calc__hero`, `__hero-label`, `__hero-value` (+ sup), `__hero-unit`, `__hero-sub`; and `styles.css:540-546` `.ampy-calc__return`, `__return-value`, `__return-range` (the old ROI "return" block). Zero markup refs. **SAFE-TO-REMOVE.**

### A7. `.ampy-calc__hero15-mini` — **SAFE-TO-REMOVE**
`styles.css:1002-1008`. The "Spann"/range mini-line under the hero was removed in R3; the class is orphaned (zero markup/JS refs). **SAFE-TO-REMOVE.**

### A8. `.ampy-calc__value-prominent.is-snap` + `@keyframes ampy-snap-highlight` — **SAFE-TO-REMOVE**
`styles.css:845-849`. `is-snap` is never added by `engine.js` (grep: 0 hits in JS; the snap visual was superseded by the count-up animation). The class + its keyframes are dead. **SAFE-TO-REMOVE.**

### A9. Unused button/selector/field variants (shared-scaffold leftovers) — **REVIEW**
Zero refs in current markup/JS, but these are generic DS utilities a future edit might reach for:
- `styles.css:473-479` `.ampy-calc__btn--secondary` (+ surface variant 474-476), `__btn--ghost` (+ surface 478), `__btn--outline`.
- `styles.css:856-862` `.ampy-calc__selector-button--on-surface` (+ children).
- `styles.css:450,453-457` `.ampy-calc__toggle--disabled` (the AC/DC toggle is never disabled now the ROI toggle is gone).
- `styles.css:394-400` `.ampy-calc__locked-value` (+ svg).
- `styles.css:863-867` `.ampy-calc__field--solar`, `__field-hint--conditional` (solar = battery-calc leftover).
- `styles.css:206-207` `.ampy-calc__field-hint`, `__field-divider`.
Mark **REVIEW** (not R3-specific; quality-prune candidates — recommend deleting since prototype is feature-complete).

### A10. Unused typography utilities — **REVIEW**
`styles.css:136-143` — `.ampy-calc__t-display`, `__t-3xl`, `__t-heading`, `__t-body`, `__t-caption` have zero markup/JS refs (only `t-2xl`, `t-subheading`, `t-small`, `t-mono` are used). These are a type-scale utility set; deletion is safe but they're conventional DS utilities. **REVIEW.**

### A11. `numTaxApplicants` residue (applicants stepper REMOVED) — **REVIEW**
The "Antal sökande" stepper UI is gone, but the state field is hard-pinned and still shipped in the payload:
- `engine.js:67` `numTaxApplicants: 1` (state), `engine.js:1203` sent in `buildPayload.inputs.numTaxApplicants`.
- `01_backend.php:249` logs `'Applicants: ' . (int)($inputs['numTaxApplicants'] ?? 1)`.
The engine never reads it for any calculation (Grön Teknik cap logic referenced in the comment is not actually applied in `calculateFor`). It's inert plumbing, not dead syntax. **REVIEW** — safe to drop from payload+state+email, but it's a benign no-op and the PHP reads it tolerantly (`?? 1`). Keep only if Ampy still wants the field in the CRM export.

---

## B. STALE COMMENTS referencing removed/old features — all **SAFE-TO-REMOVE** (comment text only)

- `styles.css:451-452` — "(AC/DC + the redesigned ROI **"Med/Utan investering"** segmented control)". The ROI toggle is removed; only AC/DC remains. Stale.
- `styles.css:1010-1012` — "individual tiles (Att betala / **Payback**) can be hidden by the **ROI toggle**". No Payback tile, no ROI toggle. Stale.
- `styles.css:570-573` & `index.html:199` (`01_backend.php:1174`) — "Replaces the **payback chart**" — historical, describes a removed feature; harmless but stale.
- `engine.js:234,877` (`00_js-engine.js` same) — comments call the third bar **"Hemma, schemalagd"**, but the rendered label (markup) is **"Schemalagd hemma laddning"** (index.html:225). Label-vs-comment mismatch — update the comment to the live string.
- `engine.js:318-319` — announcer comment "dragging a slider or stepping **applicants**" references the removed stepper. Stale.
- `styles.css:999` — "(range removed)" and `styles.css:1079` "after the ROI/range removals" — accurate history but reference removed features; low priority.
These are comments, so removal is risk-free, but they live in the verbatim-shared JS/CSS — edit BOTH copies to preserve parity.

---

## C. HOST-PAGE LEAK + PLACEHOLDER

### C1. `html{font-size:62.5%}` global leak — **REVIEW (prototype only; WP already fixed)**
- **Prototype LEAKS:** `index.html:6` `<style>html{font-size:62.5%}</style>` sets the GLOBAL document root to 10px. On a standalone GitHub Pages demo this is harmless, but it is the exact anti-pattern the WP layer was written to avoid.
- **WP is already scoped (correct):** `01_backend.php:993` emits `<style>.ampy-calc-outer{font-size:62.5%;}</style>` with a G4 comment (984-992) explaining the re-anchor to the component wrapper.
- This is therefore BOTH a host-leak AND a **prototype↔WP head drift** (different `font-size` host). **REVIEW** — recommend changing prototype line 6 to `.ampy-calc-outer{font-size:62.5%}` so the two layers match and the demo can't teach the leak back in. (Note: the tooltip popover lives on `<body>` outside `.ampy-calc-outer`; it already carries explicit px fallbacks — `styles.css:929-934` — so scoping won't break it.)

### C2. `/integritetspolicy` placeholder — **REVIEW**
`index.html:313` (and `01_backend.php:1285`) — consent link `href="/integritetspolicy"` is a documented PLACEHOLDER (comment at 302-303 / 1273-1275). Must point at the live policy before go-live. GDPR-blocking. **REVIEW.**

---

## D. PROTOTYPE↔WP DRIFT / DUP LOGIC / MAGIC NUMBERS / FRAGILITY

### D1. `homeRateOpt` safe-fallback constant drift — **REVIEW**
The scheduled-charging fallback (used only when the per-zone optimised rate is blank) differs across layers:
- `engine.js:238` (`00_js-engine.js:238`): `homeRate * 0.78`.
- `01_backend.php:850,853` and `verify_faithful.py:308,310`: `home_rate * 0.88`.
Same intent, two different constants → up to a ~10pp difference in the third bar when data is incomplete. With the shipped `data.js`/Excel every zone has an explicit optimised rate, so the fallback is dormant — but it's a real cross-layer inconsistency. Also note the engine comment "~22% under flat" (0.78) contradicts methodology item 6 "ca 20–30 %" (engine.js:944-946). **REVIEW** — pick one constant and align all four sites + the comment.

### D2. `publicDcRateSekPerKwh` default drift — **REVIEW**
- Active data (`data.js:305`) and the verify oracle expected object (`verify_faithful.py:455`) = `5.5`; engine hard-default `engine.js:37` = `5.50`; methodology/tooltip copy says "DC ca 5,50" (index.html:122).
- PHP/Python parser DEFAULTS = `5.99` (`01_backend.php:887`, `verify_faithful.py:340`).
Only triggered if the Excel omits the DC rate (it doesn't), so latent. Still, a 5.99 fallback would silently contradict the on-screen "5,50" tooltip. **REVIEW** — align the parser default to 5.50.

### D3. Consent version/text drift (JS payload vs PHP stored record) — **REVIEW**
- JS (`engine.js:129-134`): `CONSENT_VERSION = "2026-06-10.1"`, full multi-sentence `CONSENT_TEXT`.
- PHP (`01_backend.php:86-89`): `consent_version() = "2026-06-v1"`, a SHORTER one-line text ("Jag godkänner att Ampy lagrar mina uppgifter…").
The server overwrites the lead's stored consent with its OWN version/text (`01_backend.php:328-334`), so the audit trail records different wording/version than what the user actually saw and what the JS sent in `contact.consent`. For GDPR Article-7 provenance these MUST match the rendered consent string (index.html:309-315). **REVIEW** — make PHP echo the client-sent `contact.consent.version/text` (or sync both constants to the rendered copy).

### D4. Success-message claims an email that is no longer sent — **REVIEW**
`index.html:327` (and `01_backend.php:1299`): "…Du får kalkylen **mailad** till dig." The "Maila kalkylen" email path was removed in R3; the lead flow only sends a quote request. The copy promises a calculation email the system no longer produces. **REVIEW** (copy fix, owner-facing claim).

### D5. `email_calculation` lead type still allow-listed — **REVIEW**
`01_backend.php:82` `ampy_ev_calc_allowed_types()` still returns `[ 'quote_request', 'email_calculation' ]`, and the email body subject branches on it (220-222). The frontend only ever sends `quote_request` now (R3 removed the email path). `email_calculation` is an unreachable branch. **REVIEW** — drop `email_calculation` from the allow-list + subject branch unless a server-side email path is planned.

### D6. Anti-bot field-name mismatch (latent) — **REVIEW**
JS sends timing under `payload.antibot.formOpenedAt`/`elapsedMs` and honeypot under `payload.antibot.honeypot` (`engine.js:1186-1193`). PHP reads `payload['formElapsedMs']`/`payload['formOpenedAt']` at top level and honeypot from `payload['hp']/['website']/['honeypot']` top-level (`01_backend.php:149,161-164`). The nested `antibot` object is never inspected → the too-fast and honeypot server checks are effectively no-ops for this client. Not a regression from R3, but a real fragility. **REVIEW.**

### D7. `paybackYears` still computed and shipped though no UI consumes it — **REVIEW**
`engine.js:270,303` computes `paybackYears`; `engine.js:1178` ships it in the payload; `01_backend.php:239` emails "Payback: … years". The payback CHART/tile UI is gone, but the figure is still useful in the lead email, so this is intentional retention, not dead code. **REVIEW** (no action needed unless trimming payload).

### D8. Magic numbers — **REVIEW** (low priority)
- `engine.js:541-542` slider geometry hard-codes `1.2rem`/`2.4rem` inset in `calc()` strings, coupled to `.ampy-calc__slider-track{left:1.2rem}` (styles.css:311) and thumb `2.4rem` (327). A token would prevent silent breakage if the thumb size changes. (Note: `dragGeom` at engine.js:613-615 already reads the computed thumb width to stay robust — good — but the CSS-calc path still hard-codes it.)
- `engine.js:238` `0.78`, `01_backend.php:853` `0.88` (see D1).
**REVIEW** (quality, not correctness).

---

## E. LEAD PAYLOAD KEYING ON REMOVED `includeInvestment` — NO ISSUE FOUND

- `engine.js buildPayload` (1163-1212) does NOT reference `includeInvestment` anywhere — the results object ships `offertOnly`, prices, `annualSaving`, `paybackYears`, `cumulative10`, `cumulativeSavings10`. Clean.
- `01_backend.php:211-214` explicitly documents that `results.ev` is read tolerantly (`?? default`) and that R3 dropped `includeInvestment`; its absence is a deliberate no-op. The backend never keys on it.
**No dead dependency.** The only residual ROI/investment artifacts are the stale COMMENTS (B) and dead CSS (A6). No code path branches on `includeInvestment`.

---

## SUMMARY

- **Verbatim parity intact:** `engine.js`/`styles.css` are byte-identical to their WP mirrors; PHP render markup matches `index.html` ids. Any A/B fix must be applied to both copies.
- **No dead JS functions/handlers** survived R3 (`submitEmailForm`, `renderPaybackChart`, `includeInvestment` branches, applicants stepper logic are all fully gone). The dead weight is orphaned CSS + stale comments + inert `numTaxApplicants` plumbing.
- **The host-page font leak is prototype-only** (`index.html:6`); the WP layer already scopes it to `.ampy-calc-outer` (correct). This is also a prototype↔WP head drift.
- **Highest-value REVIEW items before go-live:** C2 `/integritetspolicy` placeholder (GDPR), D3 consent version/text drift (GDPR audit trail), D4 "mailad till dig" false promise, C1 prototype font-leak scope-fix.

### SAFE-TO-REMOVE count: **9 items**
(A1 chart-line/zone+stream tokens, A2 streams CSS, A3 spec-table CSS, A4 cumulative-callout CSS, A5 trust-strip CSS, A6 old-hero/return CSS, A7 hero15-mini CSS, A8 is-snap+keyframes CSS, B all stale comments) — all provably dead (zero runtime references), to be deleted in BOTH prototype and `_decoded` copies to preserve parity.

REVIEW items: A9, A10, A11, C1, C2, D1, D2, D3, D4, D5, D6, D7, D8 (13 groups).
