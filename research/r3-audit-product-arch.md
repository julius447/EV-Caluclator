# R3 — Product-owner + systemarkitekt audit: Laddbox-kalkylator 8/10 → 10/10

**Lens:** feasibility, data-model, architecture, sequencing, prototype↔WP parity, MFL/honesty, and pixel/word/interaction finesse.
**Date:** 2026-06-11. **Author:** Product owner + systemarkitekt.
**Files in scope:** `prototype/index.html`, `prototype/engine.js`, `prototype/styles.css`, `prototype/data.js`; mirror `excel/build_xlsx.py` (data) + oracle.
**Inputs read:** the 4 live-tool PDFs (desktop + mobile), all four source files, and the three Phase-1 outputs (`r3-math-verification.md`, `r3-scheduled-charging.md`, `r3-copy.md`).

> **Verdict up front:** the engine math is correct (math-verification PASS on all 7 items). Nothing in the 15-point punch-list requires a math rewrite. The build is overwhelmingly **copy + DOM + CSS + one additive data field (scheduled-charging 3rd bar)**. The two architecturally interesting changes are (A) removing the ROI toggle cleanly without orphaning the net/payback code, and (B) wiring the optimised-home-rate third bar through engine → data.js → Excel/oracle as a purely additive layer. Everything else is low-risk and parity-friendly.

---

## 0. Architecture map — what each change touches

| Layer | Touched by points |
|---|---|
| `data.js` only (mirror `build_xlsx.py` + oracle) | 2 (new `homeRateOptimizedSekPerKwh`), 3 (drop applicants — data unaffected), 10 (16 box `description`/`badge`) |
| `index.html` (static DOM/copy) | 1, 2, 3, 4, 5, 6, 8a/8b, 9 disclaimer/footnote |
| `engine.js` (render/logic) | 2 (3rd bar math+render), 3 (remove stepper), 4 (remove ROI state/branches), 5, 6, 7 (delete explainer row), 9 (methodology strings), 10 (badges render already supports) |
| `styles.css` | 2 (3rd bar style), 8c (underline fix), 11 (slider drag), 12/14 (mobile ticks/sizing), 13 (tooltip redesign), 15 (pixel pass) |
| `excel/build_xlsx.py` + oracle | 2 (new column + expected values), 10 (descriptions/badges), 3 (applicants default) |

**Parity rule (non-negotiable):** every value the prototype reads from `window.AmpyEvCalcData` must also exist as an Excel column the WP parser emits, and the oracle must assert it. So **point 2's new rate** and **point 10's strings** are the only two that ripple into Excel/oracle. Points 1, 4, 5, 6, 7, 8, 11–15 are prototype-only (copy/DOM/CSS) and do **not** change the data contract — they are parity-safe by construction.

---

# P0 — Must ship (correctness, honesty, conversion-critical, math-trust)

### P0-1 — Point 7: delete the confusable explainer row (`engine.js` ~L734–738)
**Problem:** Under "Hur besparingen räknas", the line `"3 756 kWh × 3,60 kr/kWh = 13 520 kr/år"` reads as a *third price* sitting under "5,50 / 1,90". Math-verification confirms **3,60 = 5,50 − 1,90** (the per-kWh saving, already shown bold as "Du sparar per kWh") — PASS, no error — but it is presented as a pseudo-price and even has a cosmetic rounding gap (3 756×3,60 = 13 521,6 vs printed 13 520, because the engine multiplies the unrounded 3 755,5 kWh).
**Recommendation:** Remove **only** the trailing `<p>` (the `fmtKm(...) + ' kWh ... × ... = ... kr/år'` paragraph). Keep all three card rows (public rate, home rate, bold "Du sparar per kWh"). No formula change.
**Spec:** in `renderSavingsBreakdown`, delete the final `'<p ...>' + … + '</p>'` concatenation; the function ends after the `</div>` of the rate card.
**Acceptance:** breakdown shows exactly 3 rows + divider; no "× kr/kWh =" line anywhere; headline 13 520 and monthly panel unchanged.

### P0-2 — Point 4: remove the ROI "Räkna med laddboxens kostnad" toggle (the cleanest-architecture change)
**Problem:** The toggle (`Med/Utan investering`) only affects whether the single box price is subtracted in the 10-year tile. The target user has **no box** and *must* install one, so the investment is always relevant — the "Utan investering" state models a fiction. It adds a control, a tooltip, two render branches, and SR noise for ~zero user value.
**Recommendation:** **Remove the control; hard-assume `includeInvestment = true`.** Keep the net/payback engine math (it's correct and the 10-year tile needs it) but delete the branch that ever runs the "without" path.
**Concrete build notes (do it in this order so nothing orphans):**
1. `index.html`: delete the whole `.ampy-calc__roi-control` block (L178–192).
2. `engine.js`: delete `state.includeInvestment` (L66–68), `updateInvestmentToggle()` (L688–696), its call in `renderAll` (L899), the `wireToggle("ampyEvInvestmentToggle", …)` line (L948), and the `data-value` toggle CSS usage.
3. `renderSingleResult`: replace `var withInvest = state.includeInvestment;` with a constant `true`; **keep** the `netPayTile` always-visible; **keep** the `(withInvest && !r.offert)` branch but simplify to `(!r.offert)`. The offert-only fallback to `cumulativeSavingsN` stays (Zaptec Pro has no net series).
4. `buildPayload`: drop `includeInvestment` from the `results.ev` object **and** from the WP/oracle expectations — this is the only payload-shape change. Coordinate with the parser/oracle so the field's removal doesn't fail a schema assert.
5. `styles.css`: remove `.ampy-calc__roi-control`, `.ampy-calc__roi-control-label`, `.ampy-calc__toggle--investment` rules and the `.ampy-calc__roi-control` reveal-animation entry (L969, L978).
**Risk:** low. The net/gross/Grön-Teknik/payback math is untouched; we only delete the *fiction branch* and one payload key. **Flag:** confirm Ampy's backend/n8n mapping doesn't key on `includeInvestment` before dropping it from the payload.
**Acceptance:** no ROI control renders; 10-year tile always shows the net ("laddboxen betald") series for priced boxes and the savings series for offert-only; payload has no `includeInvestment`; oracle green.

### P0-3 — Point 5: drop the "Spann …" line under the hero; keep the dynamic sub
**Problem:** Under "Du sparar per år" the hero shows BOTH a dynamic sub ("om du flyttar all din publika laddning hem" — owner loves it) AND `Spann 12 168–14 872 kr/år`. Two muted lines stacked = text-on-text clutter; the ±10 % band is already explained in methodology item 5.
**Recommendation:** Remove the range line; keep the dynamic sub.
**Spec:** `index.html` delete `<span class="ampy-calc__hero15-range" id="ampyEvAnnualRange">`. `engine.js` delete both writes to `ampyEvAnnualRange` (L770 set, and the unavailable-state line L754) and the now-dead `savingLow/savingHigh` *display* (keep them in the payload if the backend wants them — they're cheap). `styles.css` `.ampy-calc__hero15-range` can stay or be pruned.
**Acceptance:** hero = eyebrow + big number + one dynamic sub line; no "Spann" anywhere on the result surface.

### P0-4 — Point 6: one price line "Pris inkl. installation, Grön Teknik & moms"
**Problem:** `ampyEvNetPaySub` currently renders `"Pris inkl. installation & moms 8 980 kr − Grön Teknik 4 490 kr"` — a busy two-number subtraction under "Att betala".
**Recommendation:** Collapse to the single static string **`Pris inkl. installation, Grön Teknik & moms`** (per copy r3, reconciled with the footnote).
**Spec:** `engine.js` L804 → `$("ampyEvNetPaySub").textContent = "Pris inkl. installation, Grön Teknik & moms";` (drop the gross/gronTeknik interpolation). Keep gross/gronTeknik in the payload for the backend. Offert-only sub stays "Pris tas fram i offert för din anläggning."
**Acceptance:** "Att betala" tile shows the net number + exactly that one line; no gross-minus-deduction math on screen.

### P0-5 — Point 8a/8b/8c: CTA cleanup (conversion-critical)
- **8a — remove the micro-trust row** `Svar inom 24 h / Inget köpkrav / Dina uppgifter skyddas`. Delete the `<p class="ampy-calc__micro-trust">` (index L288–292). Two CTAs only: primary **`Få en exakt offert →`** + the **`Läs mer om <Box> →`** link. (Copy r3 *liked* the micro-trust, but the owner's directive wins — remove it. The same reassurance lives in the form intro "hör av sig … oftast inom en arbetsdag".) Can prune the `.ampy-calc__micro-trust` CSS.
  - *Note:* the owner wrote the primary as "Få en laddbox offert" — that's ungrammatical Swedish; the live **`Få en exakt offert`** is better and copy r3 agrees. **Keep `Få en exakt offert`.**
- **8b — remove input placeholders.** `index.html` L311 (`placeholder="07X XXX XX XX"`) and L316 (`placeholder="12345"`) → delete both `placeholder` attributes. Labels already exist; placeholders double as fake values and hurt clarity on the dark surface. `inputmode="numeric"` on zip stays.
- **8c — fix the broken underline on `Läs mer om <Box>`.** Root cause: `.ampy-calc__btn-link` is an `<a>`; the global `.ampy-calc a:hover { text-decoration: underline }` underlines the anchor, but the anchor contains a text node, a `<span id=ampyEvProductLinkName>`, AND a trailing `<svg>` — the underline runs under the text segments but the inline-flex layout + the SVG break it into two visible dashes ("Läs mer om" / "Zaptec Go").
  - **Fix:** make the link `text-decoration:none` and underline a single inner text wrapper instead. Wrap the two text parts in one `<span class="ampy-calc__btn-link-text">Läs mer om <span id="ampyEvProductLinkName">…</span></span>`, keep the SVG OUTSIDE that span, and apply `text-decoration: underline; text-underline-offset: 0.25em;` to `.ampy-calc__btn-link-text` on `:hover`/`:focus-visible` of the link. Because the underline now lives on one continuous inline text box (no SVG inside it), it renders as one unbroken line.
  - **Acceptance:** hovering the link shows ONE continuous underline spanning "Läs mer om Zaptec Go"; the arrow is not underlined.

### P0-6 — Point 2: scheduled/smart charging as a THIRD bar (the one real feature add)
**Problem & research:** `r3-scheduled-charging.md` recommends Option (a): a third bar "Hemma, schemalagd (optimerad)" in the "Din månadskostnad – publikt vs hemma" panel, fed by a new per-zone `homeRateOptimizedSekPerKwh` (SE1 1.30 / SE2 1.35 / SE3 1.60 / SE4 1.80). Headline annual saving **stays** anchored to the conservative flat rate; the optimised bar is additive upside. This is MFL-safe and more *exact*.
**Architecture / feasibility — purely additive, does not touch the net/gross model:**
- **data.js (mirror build_xlsx.py + oracle):** add `homeRateOptimizedSekPerKwh` to each of the 4 REGIONS. Engine fallback: if absent, `homeRate * 0.88` so old data never NaNs. This is a **new Excel column** → the WP parser must emit it and the oracle must assert all 4 values. *This is the only data-contract change in the whole punch-list.*
- **engine.js `calculateFor`:** add
  ```
  var homeRateOpt        = (REGIONS[state.region]||{}).homeRateOptimizedSekPerKwh || homeRate * 0.88;
  var monthlyHomeOptCost = publicKwh * homeRateOpt / 12;
  ```
  Return `homeRateOpt`, `monthlyHomeOptCost`. **Do NOT touch `annualSaving`** (stays `publicKwh × (publicRate − homeRate)`), so the net/payback/10-year chain and the math-verification PASS are unaffected. Reconciliation `(monthlyPublic − monthlyHomeOpt) × 12 === publicKwh × (publicRate − homeRateOpt)` holds by construction.
- **index.html:** add a 3rd `.ampy-calc__monthly-col` under "Hemma efter installation": label **`Hemma, schemalagd`**, value `≈ <span id="ampyEvMonthlyHomeOpt">—</span> kr/mån`, with a small "i" tooltip (see copy below). Keep it inside `.ampy-calc__monthly-cols`.
- **engine.js `renderMonthlyComparison`:** add a `--monthly-homeopt-frac` CSS var (`homeOptCost / maxCost`; maxCost stays the public bar since `publicRate > homeRate > homeRateOpt`), and `animateNumber("evMonthlyHomeOpt", …)`. Empty-state path sets it to "—" / frac 0 like the others.
- **styles.css:** third `.ampy-calc__monthly-col:nth-child(3)::before` fill = a **lighter/dashed green** (e.g. `--state-success` at reduced opacity or `repeating-linear-gradient`) so "optimised" reads as a *variant* of home, not a new product. Wire `--bar-frac: var(--monthly-homeopt-frac)`.
- **Copy (MFL-safe, from research):** tooltip `Med schemalagd laddning låter du laddboxen ladda när elen är som billigast. Det sänker din hemmakostnad ytterligare några procent. Faktisk besparing beror på elavtal och elområde.` + methodology bullet (see P1-1). **Never** say "alltid billigast på natten" (false in SE4 summer 2025).
- **a11y:** the third value count-ups; the SR live region keeps announcing **only the headline** — don't add the optimised number to the queue.
**Risk:** low-medium. The only risk surfaces are (i) Excel/oracle column wiring and (ii) the three-bar density on the narrowest phones (mitigated — bars already stack). **Flag:** the 4 optimised rates are research-grade defaults and join the existing sign-off gate (all `data.js` rates pending the signed Excel before go-live).
**Acceptance:** SE3 defaults render publik ≈1 721 / hemma ≈595 / **schemalagd ≈501** kr/mån; third bar is a lighter green, shorter than the home bar; headline 13 520 kr/år untouched; oracle asserts the 4 new rates; `(publik − schemalagd)×12` reconciles.

---

# P1 — High value (copy quality, methodology trust, the marketing-grade box catalogue)

### P1-1 — Point 9: methodology verified + copywriter rewrite (drop-in strings)
Math-verification PASS on every line. `populateMethodology()` strings replaced **word-by-word** with the copy r3 versions (headings now benefit-led, prose warmer, accurate):
- 1 → h `1. Så mycket energi din bil drar`
- 2 → h `2. Vad publik laddning kostar dig`
- 3 → h `3. Vad samma laddning kostar hemma` (c: `… hemtaxa (1,45–2,10 kr/kWh, SE1–SE4)`)
- 4 → h `4. Grön Teknik-avdraget` (c: `48,5 % av priset, max 50 000 kr/sökande/år (upp till 2 sökande)`)
- 5 → h `5. Varför vi visar ett spann`
- **NEW item 6 (scheduled charging, ties to P0-6):** h `6. Schemalagd laddning` · c `hemtaxa × ca 10–16 % lägre (varierar SE1–SE4)` · p `En modern laddbox flyttar laddningen till de billigaste timmarna. Vi räknar med en försiktig sänkning på 10–16 % av hemmakostnaden — inte hela spotskillnaden (30–60 %), eftersom den inte gäller alla timmar eller alla elavtal.`
- **Disclaimer** (index L385–389) and **footnote** (L390) → copy r3 rewrites; footnote `* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.`
**Acceptance:** all 6 (was 5) items render with new strings; numbers still reconcile to engine; footnote wording matches the in-result price line (P0-4).

### P1-2 — Point 10: rewrite all 16 box descriptions + tags (marketing-grade)
Apply the copy r3 table verbatim to `data.js` (mirror `build_xlsx.py` + oracle). The badge-render path already exists (`renderSelector` reads `item.badge`), so this is **data-only** — no engine change. Mandated tags: Zaptec Go=`Bästsäljare`, Zaptec Go 2=`Rekommenderas`, Easee Charge Up=`Bästsäljare`, NexBlue Edge 2=`Prisvärd`, Charge Amps Aura=`Dubbel laddning`. **Remove Amina S `Rekommenderas`** (→ null). Keep Zaptec Pro=`Offert`, Garo Entity Pro=`Företag/BRF`. The other 9 stay badge-free (tag discipline — over-badging kills the bestseller signal).
**DATA FLAG (blocking accuracy):** copy r3 flags Charge Amps Aura — `data.js` says "11 kW · stativ" but the chosen copy ("Två bilar samtidigt" / `Dubbel laddning`) follows the product page's wall-mounted dual-22 kW variant. **Ampy must confirm the real SKU** before go-live; if it truly is the 11 kW stativ, description → `Stativ för två bilar · inkl. installation`. Until confirmed, mark as placeholder.
**Acceptance:** all 16 descriptions = the new strings; exactly 7 badges (5 mandated + 2 kept); Amina S badge gone; oracle updated; Aura flagged for human confirm.

### P1-3 — Point 3: remove "Antal sökande" (recommended) — or rewrite the slop
**Problem:** A single home box is always far under the 50 000 kr/sökande Grön Teknik cap, so this control changes the result for essentially nobody, yet adds a field + decision + tooltip (every extra input lowers completion). The current tooltip ("relevant om man köper flera boxar") is AI-slop.
**Recommendation (mine + copy r3): REMOVE the stepper.** Keep the cap logic in the engine (it already caps correctly), hard-default `numTaxApplicants = 1`.
**Spec:** `index.html` delete the applicants `.ampy-calc__field` block (L144–158). `engine.js` delete `renderApplicants()` + its `renderAll` call + the two stepper click handlers (L951–956) + the `renderApplicants` def (L701–705). Keep `state.numTaxApplicants = 1` and `RATES.maxApplicants`/cap math so the payload + Grön-Teknik methodology line are unchanged. `buildPayload` keeps `numTaxApplicants:1` (stable payload shape).
**If owner insists on keeping it:** ship the copy r3 tooltip `Antal personer i hushållet som delar på Grön Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer taket om ni installerar flera.`
**Acceptance:** no applicants control renders (or, if kept, non-slop tooltip); Grön Teknik methodology + payload unchanged; one fewer input before the CTA.

### P1-4 — Point 1: "Andel offentlig laddning" tooltip → one clear sentence
Replace `data-tip` (index L106) with: `Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.` Removes the self-contradiction (share-today vs share-you-move). Plain text, no markup.

### P1-5 — Point 2 (tooltip half): "Elprisområde" tooltip → drastically shorter
Replace `data-tip` (index L139) with: `Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.` (The scheduled-charging benefit is surfaced via the 3rd bar + its own tooltip + methodology item 6, not crammed into this one.)

### P1-6 — Point 13: redesign the mobile tooltip interaction (research-backed)
**Problem:** On mobile the "i" is CSS-`:hover`/`:focus`-only via `::after`. On touch there is no hover; the focus-click handler (`engine.js` L959–961) just focuses the button, so the bubble shows via `:focus-visible`, but the `@container max-width:768px` rule blows the `::after` to `width:100%` — a huge, full-width box that looks broken (matches the owner's "huge ugly box").
**Recommendation (best-practice, both platforms):** convert the tooltip to a **tap-to-toggle popover** with a constrained width and a small caret, dismiss on outside-tap/Escape, and an accessible pattern (`aria-expanded` on the button, the bubble as a referenced `role="tooltip"`/`aria-describedby` element). Concretely:
- Keep desktop hover/focus as-is (it works).
- On `pointerdown`/click, toggle an `is-open` class on the tip (instead of only `focus()`); CSS shows `::after` when `.ampy-calc__tip.is-open` OR `:hover`/`:focus-visible`.
- Cap the mobile bubble at `max-width: min(28rem, calc(100cqi - 3.2rem))` (NOT 100 %), center it, add a 0.6rem caret, and clamp horizontal position so it never clips the container edge.
- Close on outside tap (extend the existing document click handler) and Escape (already wired).
**Acceptance:** tapping "i" on mobile shows a tidy, constrained bubble with a caret (not a full-width slab); tapping elsewhere/Escape closes it; desktop hover unchanged; SR announces the tip text via `aria-describedby`.

### P1-7 — Point 11: make slider drag "Apple-smooth" on iOS/touch + desktop
**Problem:** The drag is laggy. The current code is already sophisticated (rAF-coalesced, `.is-dragging` kills transitions, residual translateX), but two issues remain:
1. **`touch-action: pan-y`** on `.ampy-calc__slider` (L272) lets the browser still arbitrate vertical scroll vs horizontal drag, which on iOS introduces a recognition delay / occasional drop of the first moves. For a horizontal-only thumb the drag surface should be `touch-action: none` **on the thumb's hit area during interaction** (so the page can still scroll when you touch the track background but the thumb itself grabs immediately). Pragmatic fix: set `touch-action: none` on the slider while `.is-dragging`, and rely on `setPointerCapture` (already used) to keep the gesture.
2. The thumb sub-step residual + snap is good, but **the live `opts.onChangeFn(s)` fires a full `renderAll()` (recalc + count-up animations + SR debounce) on every step crossing mid-drag** — on a slow phone that's the real jank source, not the paint. Decouple: during drag, update only the *value display + bar fractions* cheaply, and defer the full `renderAll()` to `endDrag()` (or throttle it to ≤1 per ~80ms). The count-up `animateNumber` is especially wasteful mid-drag.
**Recommendation:** (a) `touch-action:none` while dragging; (b) during drag call a lightweight `applyValueLive(v)` (sets `state`, updates the result numbers WITHOUT count-up animation — write `el.textContent` directly) and run the full animated `renderAll()` once on release. Gate `animateNumber` with an `instant` flag during drag.
**Acceptance:** on a mid-range phone the thumb tracks the finger with no perceptible trail; numbers update live but don't "spin"; releasing snaps + does the count-up once; desktop drag is 1:1.

### P1-8 — Point 12: mobile slider ticks — all steps legible (or a clean subset)
**Problem:** On the km slider ≤390px, the `@container max-width:390px` rule sets all interior non-endpoint, non-active ticks to `color: transparent` — so only the two endpoints (5k / 50k) + the active one show. The owner sees "only the two outermost." That's the rule working, but the *result* is bad UX (8 steps, 3 visible).
**Recommendation:** show a **clean, evenly-spaced subset** rather than just endpoints. For the 8-step km slider, keep **every other tick** visible on narrow screens (5k · 15k · 25k · 40k · plus active), which reads as a legible scale instead of two lonely ends. Implement by tagging alternate ticks `data-tick-keep` in `renderRangeSlider` (e.g. even indices) and changing the ≤390px rule to hide only `:not([data-tick-keep]):not(--active):not([data-endpoint])`. The % slider (5 ticks) stays fully visible.
**Acceptance:** ≤390px km slider shows ~4–5 evenly spaced labels + the active one, never just two; labels don't collide; the active label is always shown even if it's a "hidden" index.

### P1-9 — Point 14: de-"blaffigt" the mobile view (it's mobile-primary)
Targeted shrinks for the clunky/oversized mobile feel (all via `@container` so desktop is untouched):
- **Hero number** `--fs-4xl` clamps to 4rem floor (40px) — on a 344px body the "≈ 13 520 kr/år" with the big `≈` glyph + `gap:1.2rem` is heavy. Reduce the hero `gap` to `0.6rem` and the `≈`/unit weight relationship on ≤500px; consider floor 3.6rem.
- **Selector images** `--lg = 5.6rem` (56px) tiles for car/charger are oversized on mobile; drop to ~4.4rem ≤500px.
- **Card padding** is already `--spacing-lg` ≤600px; tighten the **result surface** internal `--spacing-lg`→`--spacing-md` between hero/trio/monthly on ≤500px so the dark card isn't a tall slab.
- **Field-label-tiny vs value-prominent** spacing: the `--fs-xl` mono value (km/%) is large; keep, but reduce the gap to the slider.
- **Monthly panel** `padding: --spacing-lg` → `--spacing-md` ≤500px (it's the densest block, soon to have 3 bars).
**Acceptance:** on a 360–390px viewport the result surface fits more above the fold, nothing feels oversized, tap targets stay ≥44px.

---

# P2 — Finesse (point 15: pixel/typography/hierarchy — heavy paid traffic deserves this)

1. **Vertical rhythm on the result surface:** the reveal-stagger + `--spacing-lg` gaps make the dark card long. Standardize inter-block gap to `--spacing-md` and let the two `<hr class="internal-divider">` carry separation; removes the "floaty" feel.
2. **Hero unit alignment:** `kr/år` baseline-aligns to a `--fs-4xl` number via `align-items:baseline` + `gap:1.2rem` — the gap is too wide; `0.6rem` reads tighter and more premium.
3. **Trio tiles:** with the ROI toggle gone, the "Att betala" + "Sparar på 10 år" pair has more room — give them equal optical weight; ensure the `<sup>*</sup>` on "Att betala" doesn't shift the baseline (it currently nudges the label up).
4. **Segmented (SE1–SE4) active state** uses white bg + teal text + `shadow-sm`; on the *light input card* the inactive teal-hover is subtle — fine, but ensure the active pill's contrast ≥ the AA fix already applied. The "i" tooltips next to labels should be vertically centered with the label cap-height (they sit slightly low at `--fs-sm`).
5. **Tick label color** uses `--text-secondary` mono at `--fs-xs`; the active tick is teal-bold. Good. Ensure the active tick never renders *under* the thumb illegibly — add `pointer-events:none` consideration is moot (they're buttons) but visually the active label below the thumb is fine.
6. **Input fields on the dark surface:** placeholders removed (P0-5); ensure the label→input gap and the 4.8rem min-height read consistently; the consent checkbox row + privacy link is dense — give the consent block a touch more top spacing.
7. **"Så har vi räknat" closed state** on mobile is a lone white bar under the dark card — give it the same horizontal inset as the card and a slightly stronger summary affordance (the ▾ is faint).
8. **Typography scale check:** `--fs-2xl` H1 "Hur mycket sparar du på att ladda hemma?" wraps to 2 lines on mobile — good; keep `letter-spacing:-0.015em`. The eyebrow `Laddbox-kalkylator` uppercase tracking is fine.
9. **Color-token note (parity caution):** several AA fixes and the chart teal live in a SHARED FluentSnippets stylesheet consumed by LED + battery calcs. Any further teal/contrast tweak here must be re-checked against those two before promotion (already flagged in-file at L35–40, L51–56).
10. **Reveal animation delays** (20→260ms) are tasteful; with one block removed (ROI), re-sequence so there's no gap in the cascade (hero 40→trio 120 is fine; just drop the 20ms ROI entry).

---

## Sequencing (build order to avoid orphaned code / failed oracle)

1. **Data first:** P1-2 (box copy/badges) + P0-6 data field + P1-3 applicants default → update `data.js`, then `build_xlsx.py`, then regenerate + green the oracle in one pass. (Two data-contract changes total: optimised rate column; box strings.)
2. **Engine removals:** P0-2 (ROI) + P1-3 (applicants render) + P0-1 (explainer row) + P0-3/P0-4 (hero range / price line) — pure deletions/simplifications, run after data so the oracle baseline is stable.
3. **Engine add:** P0-6 third-bar math + render; P1-1 methodology strings (incl. new item 6).
4. **DOM/copy:** P0-5 (CTA), P1-4/P1-5 (tooltips), index third-col markup.
5. **CSS:** P0-5c underline, P0-6 third-bar style, P1-6 tooltip popover, P1-7 slider drag, P1-8 ticks, P1-9 mobile sizing, P2 pixel pass.
6. **Verify:** browser-test desktop + mobile (the existing Phase pattern), re-run oracle, re-screenshot.

## Risks & what stays placeholder pending Ampy
- **All `data.js` rates** (home, public AC/DC, **new optimised**, efficiencies, prices) are research-grade → the existing **signed-Excel sign-off gate** still applies before go-live. The 4 optimised rates join that gate.
- **Charge Amps Aura spec** (11 kW stativ vs 22 kW dual wall) — blocking data confirmation (P1-2 flag).
- **Payload shape change:** dropping `includeInvestment` (P0-2) — confirm Ampy's n8n/backend mapping first.
- **`/integritetspolicy` href** + `restUrl`/`nonce`/`postId` remain WP-injection placeholders (unchanged by this pass).
- **Shared stylesheet teal/contrast tokens** — re-check LED + battery calcs before promoting any color change.

## Parity statement
Only **two** changes touch the prototype↔WP data contract: the new `homeRateOptimizedSekPerKwh` region column, and the 16 box `description`/`badge` strings. Everything else (1, 4, 5, 6, 7, 8, 9-copy, 11–15) is prototype-side copy/DOM/CSS and is parity-safe by construction. Update `build_xlsx.py` + oracle for those two, and prototype and WP stay in lockstep.
