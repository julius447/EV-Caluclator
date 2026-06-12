# R4 — QA / Red-Team: Ampy laddbox-kalkylator

Date: 2026-06-11. Scope: prototype (index.html, engine.js, styles.css, data.js),
WP mirror (_decoded/01_backend.php, 00_js-engine.js, 02_styles.css), and
excel/verify_faithful.py. Live: https://julius447.github.io/EV-Caluclator/

## Pass/fail per area

| # | Area | Result |
|---|------|--------|
| 1 | verify_faithful.py | **PASS** — "PASS — deep-equal", exit 0 |
| 2 | Default math + new third bar + headline invariance | **PASS** |
| 3 | Edge cases (0% public, offert-only, AC/DC, region switch, missing opt-rate) | **PASS** |
| 4 | A11y (popover tooltip, third bar, removed-underline link) | **PASS** |
| 5 | Prototype↔WP parity (engine, styles, ids) | **PASS** |
| — | Dead-code from R3-removed features | **PASS** (clean) — see one minor note |

No functional/correctness defect found. Two non-blocking cosmetic/consistency
notes below (neither affects the live tool's numbers, parity, or a11y).

---

## 1. verify_faithful.py — PASS
Ran `python3 excel/verify_faithful.py`. Output ends `PASS — deep-equal`, exit 0.
Import status "OK — 8 EV models, 16 chargers imported." Stored JSON matches expected.

## 2. Default math re-derived by hand — PASS
Tesla Model Y (1.69), Zaptec Go (net 4490 / gross 8980), SE3 (home 1.90 / opt 1.35),
DC 5.50, 20 000 km, 100 % public, chargerEff 0.90, horizon 10:

- annualEnergyNeeded = 20000/10 × 1.69 = 3380 kWh
- annualEnergyFromGrid = 3380 / 0.90 = 3755.56 kWh = publicKwh (100 %)
- rateGap = 5.50 − 1.90 = 3.60
- **annualSaving = 3755.56 × 3.60 = 13 520 kr/år** (headline)
- monthlyPublic = 3755.56 × 5.50 / 12 = **1 721 kr/mån**
- monthlyHome   = 3755.56 × 1.90 / 12 = **595 kr/mån**
- **monthlyHomeOpt (new 3rd bar) = 3755.56 × 1.35 / 12 = 423 kr/mån**
- monthlySaving = 1721 − 595 = **1 127 kr/mån**; reconciles: (pub−home)×12 = 13 520 = annualSaving ✓
- payback = 4490 / 13 520 = 0.3 yr; cumNet10 = 130 710; cumSav10 = 135 200; gronTeknik = 8980−4490 = 4490

**Headline invariance confirmed (structural):** `homeRateOpt` appears ONLY in
`monthlyHomeOptCost` (engine.js:254). `annualSaving` (engine.js:242) and the
10-yr/payback series never reference it. Adding the third bar cannot change the
headline. ✓

## 3. Edge cases — PASS (Node harness reproduction of engine logic)
- **0 % public**: publicKwh=0 → annualSaving=0, all three monthly bars=0, monthlySaving=0,
  payback=null, all `--monthly-*-frac`=0 (maxCost>0 guard at engine.js:905-908 prevents
  divide-by-zero). Hero sub flips to the "Dra upp andelen…" prompt (engine.js:827). No NaN.
- **Offert-only (Zaptec Pro, null price)**: `offert` true → netCost/grossPrice/gronTeknik/
  payback/cumulativeNet all null; tile shows "Begär offert"; `previousValues.evNetPay` deleted
  (engine.js:851) so a later switch to a priced box animates from a number, not a string.
  Savings + all three monthly bars still render (segment-agnostic). 10-yr tile falls back to
  `cumulativeSavingsN`. No NaN.
- **AC vs DC**: AC uses 4.50 (engine.js:226-228) → smaller positive saving (e.g. SE3 9 764 kr/år).
- **Region switches** incl. SE4 (home 2.10 / opt 1.45): ordering public > home > homeOpt holds in
  every zone (AC worst case SE4: 4.50 > 2.10 > 1.45), so the staircase never inverts and rateGap
  stays positive. ✓
- **Missing optimized rate** (hand-authored region without the field): engine falls back to
  `homeRate * 0.78` (engine.js:238). e.g. SE3 → 1.482, monthlyHomeOpt 464 kr < flat home 595 kr,
  ordering preserved, no NaN.
- **unavailable / offert↔priced transitions**: unavailable branch resets the four monthly ids to
  "—"; `previousValues.evMonthlyHomeOpt` is not cleared but next valid render just count-ups from
  the last good number — harmless. No stale-string animation.

## 4. A11y — PASS
- **Popover tooltips** (incl. the new third-bar "Schemalagd hemma laddning" "i"): each is a native
  `<button class="ampy-calc__tip">` (keyboard-focusable, Enter/Space), `aria-label="Mer info"`,
  and `setupTooltips()` wires `aria-expanded` + `aria-controls` + `aria-describedby` to a
  `role="tooltip"` popover. Toggle on click, open on hover/focus (mouse/keyboard only — touch
  suppressed via pointerType tracking), close on outside-click / Escape / scroll / resize / blur.
  `:focus-visible` ring (styles.css:889). `prefers-reduced-motion` honoured (styles.css:954-956).
- **Third bar**: pure-presentation bar fed by `--monthly-homeopt-frac`; its number lives in
  `#ampyEvMonthlyHomeOpt`. Not an interactive control itself; its only control (the tip) is
  covered above. No keyboard trap.
- **Removed-underline link** (`#ampyEvProductLink`): native `<a target="_self">`, `:focus-visible`
  ring (styles.css:966) and underline-on-focus of `.btn-link-label` (styles.css:975); hidden via
  `display:none` when slug is "#" so SR users never reach a dead link.
- Single debounced polite live region `#ampyEvSrStatus` announces only the settled headline.
- Sliders: `role="slider"`, `aria-labelledby`, `aria-valuemin/max/now/valuetext`, full keyboard
  (Arrows/Home/End). Toggles/segmented: `aria-pressed` kept in sync.

## 5. Prototype ↔ WP parity — PASS
- `diff _decoded/00_js-engine.js prototype/engine.js` → **IDENTICAL** (verbatim).
- `diff _decoded/02_styles.css prototype/styles.css` → **IDENTICAL**.
- **DOM ids**: all 68 ids in index.html are present in the 01_backend.php render markup
  (`comm -23` empty). The 10 extra ids in the PHP file are admin-metabox only. All new third-bar
  ids (`ampyEvMonthlyHomeOpt`, `--monthly-homeopt-frac`) present in both, styled in both.
- Live default data: data.js and the PHP-stored/imported JSON both carry DC 5.50, SE3 1.90/1.35,
  ADVANCED 20000/100/dc, 8 EVs / 16 chargers, Zaptec Pro offertOnly+null. Matches verified JSON.

---

## Non-blocking notes (NOT defects)

**N1 — engine fallback factor vs its own comment (consistency nit). engine.js:238**
```
var homeRateOpt = (REGIONS[state.region] || {}).homeRateOptimizedSekPerKwh || homeRate * 0.78;
```
The engine fallback multiplier is **0.78**, but two comments call it 0.88:
- engine.js:236-238 comment says "~22% under flat" (i.e. 0.78 — self-consistent there), BUT
- 01_backend.php:850 says the PHP import fallback "mirrors the engine's `homeRate * 0.88`", and
  PHP itself uses **0.88** (01_backend.php:853: `round($home_rate * 0.88, 2)`).

So the two layers diverge: engine runtime fallback = ×0.78, PHP import fallback = ×0.88, and the
PHP comment mis-states the engine value. **Impact: none on the live tool** — all 4 shipped regions
include `homeRateOptimizedSekPerKwh`, so neither fallback ever fires in production; they only
differ for hand-authored / blank-Excel data, and even then only the visually-subordinate third bar
shifts (headline untouched, ordering preserved). Recommend aligning the two factors and fixing the
PHP comment for future-proofing. This is a parity inconsistency in *fallback behaviour only*, not
in the verbatim engine diff (engine files are still identical to each other).

**N2 — dead `--chart-*` CSS tokens (cosmetic). styles.css:61-69**
Eight chart color custom properties (`--chart-stream-1..4`, `--chart-line-loss/profit`,
`--chart-zone-loss/profit`) have **0 `var()` references** anywhere in styles.css and 0 references
in either engine — leftover from the removed payback chart (renderPaybackChart). Harmless dead
CSS; identical in prototype and WP so no parity break. The other `payback`/`chart` text hits
(styles.css:39-40, 573) are comments only. Safe to delete.

**Dead-code audit (R3 removals): CLEAN.** No live code/CSS/DOM ids remain for: ROI
`includeInvestment` toggle, "Antal sökande" stepper, hero "Spann" line, savings-breakdown
explainer paragraph, micro-trust strip, `submitEmailForm`/`ampyEvEmailForm` email path, or
`renderPaybackChart`. All matches were confined to `prototype/CHANGES.md` (the changelog,
expected) and one explanatory comment each in engine.js:61 and 01_backend.php:212. The new
"Schemalagd hemma laddning" third bar is fully wired in markup, engine, and CSS in both targets.
