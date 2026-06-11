# MASTER-SPEC v2 — Ampy Laddbox-kalkylator (8/10 → 10/10)

**Role of this document:** the single decisive build spec. It synthesises the full R3 panel
(math verification, scheduled-charging, copy, and the six audits: UI/pixel, UX, product-arch,
QA/red-team, CMO/CRO, usability/mobile) into one set of *decided* changes. Where experts
disagreed, the call is made here and the reason stated. Build from this file, not the audits.

**Source of truth read:** `prototype/{index.html, engine.js, styles.css, data.js}` (line numbers
below are current as of 2026-06-11) + all `research/r3-*.md`.

**Date:** 2026-06-11 · **Author:** Design Director + PM (synthesis)

**Unit key:** `html{font-size:62.5%}` → **1rem = 10px**. Spacing tokens: `xs 5 · sm 7.5 · md 10 ·
lg 15 · xl 20 · 2xl 30` (px). Type via fluid `clamp()` tuples on container width (`100cqi`).

---

## EXECUTIVE SUMMARY

The tool is a genuine 8/10: the engine math is **correct on every line** (math-verification PASS
7/7, independently re-derived by red-team), the dark results card is good, and the architecture is
parity-friendly. The path to 10/10 is **subtraction + two additions + a proportion pass**, not a
rewrite. Nothing requires a formula change.

**What changes, in one breath:** remove the ROI toggle, the "Antal sökande" stepper, the "Spann"
line, the confusable "× 3,60 kr/kWh" explainer row, the micro-trust strip, and the form
placeholders. Add the scheduled-charging **third bar** (the one real feature add, MFL-safe) and the
**16-box marketing copy + disciplined badges**. Rewrite every tooltip, the methodology, and the
price line to the drop-in copy below. Then run the pixel-craft pass — tighten the mobile type/spacing
("blaffigt"), give the dark card a clean 4-tier staircase, make the monthly bars the visual climax,
build a 3-tier badge system, redesign the tooltip as a tap-dismissible popover, and harden slider
drag + km-tick legibility on touch.

**The single biggest find beyond the 15** (QA red-team, not in the owner list): the calculator
**prints a 50,0 % Grön Teknik deduction on every box** (every `grossPriceSek` is exactly `net × 2`)
while the footnote and methodology **claim 48,5 %**. Verified across all 15 priced boxes — all
exactly 50,0 %. This is an internal contradiction any user (or Konsumentverket) catches by division,
in the one section whose job is trust. **It is a go-live blocker** and needs an owner/Excel decision
(see Owner Decision D2).

**Data contract:** only **two** changes touch the prototype↔WP/Excel data contract — the new
per-zone `homeRateOptimizedSekPerKwh`, and the 16-box `description`/`badge` strings. Everything else
is prototype-side copy/DOM/CSS and is parity-safe by construction.

### Open owner decisions (kept minimal — 3 real ones)

| # | Decision | Recommendation | Why it needs you |
|---|----------|----------------|------------------|
| **D1** | Scheduled-charging **third bar** — ship it, and OK the 4 optimised rates (SE1 1,30 / SE2 1,35 / SE3 1,60 / SE4 1,80 kr/kWh)? | **Ship Option (a), third bar.** Hero stays on the conservative flat rate; the optimised bar is additive, labelled, MFL-safe upside. | It's the one *new claim* on the page. The rates are research-grade defaults and join the signed-Excel gate. One quick OK. |
| **D2** | Grön Teknik shows **50,0 %** but copy says **48,5 %**. Fix which way? | **Replace placeholder gross prices** so `(gross − net)/gross ≈ 48,5 %` (i.e. gross ≈ net ÷ 0,515), keeping the real schablon. Fallback: if Ampy truly gives 50 %, change *all* copy to 50 %. | Either the data or the copy is wrong; both can't ship. Needs the Excel/pricing owner. **Blocker.** |
| **D3** | **Charge Amps Aura** — data says "11 kW · stativ"; mandated copy ("Två bilar samtidigt" / `Dubbel laddning`) follows the product page's wall-mounted dual-22 kW SKU. | **Confirm the real SKU**, then apply matching copy. If 11 kW stativ → `Stativ för två bilar · inkl. installation`, drop the dual claim. | Shipping a dual-charging claim on a single-outlet stativ record is a false product claim (MFL). **Blocker for that box only.** |

Two non-decision go-live placeholders also remain (not owner *choices*, just must-do before launch):
the `/integritetspolicy` href (GDPR Art. 13) and the WP-injected `restUrl`/`nonce`/`postId`. And one
integration footgun to fix in the port (QA G4): the global `html{font-size:62.5%}` must be **scoped to
the component**, not the host page.

### Scheduled-charging recommendation (inline, the one item that may want a quick OK)

**Decision: build Option (a) — a THIRD bar "Hemma, schemalagd (optimerad)"** in the "Din månadskostnad
– publikt vs hemma" panel, default visible, fed by a new per-zone `homeRateOptimizedSekPerKwh`
(SE1 **1,30** / SE2 **1,35** / SE3 **1,60** / SE4 **1,80** kr/kWh — ~10–16 % below the flat rate).
The **headline annual saving does not change** (stays anchored to the conservative flat home rate).
The third bar is a softer, lighter-green, visually-subordinate "and it gets even better" layer.

Rejected alternatives, with reasons: **(b) a toggle** — buries the win behind a click and adds a 4th
toggle to a toggle-heavy column → *less* compelling; **(c) silently lower the headline rate** — bakes a
best-case scheduling assumption into the single hero number, which the SE4 summer-2025 price inversion
and non-universal timprisavtal make non-guaranteed → **fails MFL §10.** Only (a) is simultaneously *more
exact*, *more compelling*, and *honest*. The 4 rates are deliberately conservative (we discount only the
controllable spot slice, ~30 % of it, hedged for the SE4 inversion) — we **under**-claim vs the raw
30–60 % spot spread, which is what makes it defensible. Copy must say **"när elen är som billigast"**,
never "alltid billigast på natten" (false in SE4, spring/summer 2025). **Worked example (SE3 default):**
publik ≈ 1 721 / hemma ≈ 595 / **schemalagd ≈ 501 kr/mån**; `(1 721 − 501) × 12` reconciles to the
optimised annual; the 13 520 kr/år hero is untouched. **This is the only item that wants your explicit
OK (D1).**

---

# PART 1 — THE OWNER'S 15 POINTS (each: decided spec · where · acceptance)

Priorities use the panel consensus. All line numbers are `prototype/` current.

---

### Point 1 — "Andel offentlig laddning" tooltip is self-contradictory · **P1**

- **Decision:** replace the two-sentence, self-contradictory tip (it conflates "share you charge
  publicly today" with "share you move home") with one clear sentence.
- **Where:** `index.html` L106 `data-tip`.
- **Drop-in copy:**
  > `Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.`
- **Acceptance:** one sentence; no "100 % betyder…" clause; default stays 100 %.

---

### Point 2 — Scheduled / smart charging + "Elprisområde" tooltip · **P0** (bar) / **P1** (tooltip)

This is two things: the tooltip rewrite, and the feature (the third bar).

**2a — Elprisområde tooltip (P1)**
- **Decision:** drastically shorten (current is a paragraph with two öre-figures).
- **Where:** `index.html` L139 `data-tip`.
- **Drop-in copy:**
  > `Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.`

**2b — Scheduled-charging THIRD bar (P0)** — full design in Part 2. Summary of the build:
- **`data.js` REGIONS (data-contract change #1):** add `homeRateOptimizedSekPerKwh` per zone:
  SE1 `1.30` · SE2 `1.35` · SE3 `1.60` · SE4 `1.80`. Mirror into `engine.js` REGIONS fallback
  (L28–31) and `excel/build_xlsx.py` + oracle.
- **`engine.js calculateFor` (after L238):** add
  `var homeRateOpt = (REGIONS[state.region]||{}).homeRateOptimizedSekPerKwh || homeRate * 0.88;`
  and `var monthlyHomeOptCost = publicKwh * homeRateOpt / 12;`. Return both on `r`. **Do NOT touch
  `annualSaving`** (L232) — the hero, net/payback and the math-verification PASS stay intact.
- **`index.html`:** add a 3rd `.ampy-calc__monthly-col` after the "Hemma efter installation" col
  (after L253), label `Hemma, schemalagd`, value `≈ <span id="ampyEvMonthlyHomeOpt">—</span> kr/mån`,
  plus one small "i" with the tooltip copy below.
- **`engine.js renderMonthlyComparison` (~L840):** add `--monthly-homeopt-frac = homeOptCost / maxCost`
  (maxCost stays the public bar) + `animateNumber("evMonthlyHomeOpt", …)`; degrade to "—" / frac 0 in
  the empty/0 % and offert paths like the other bars.
- **`styles.css`:** third bar = lighter/dashed green (subordinate to the solid home bar).
- **Tooltip + methodology copy:** see Part 2 §C and Point 9.
- **a11y:** the optimised number is **not** added to the SR live region (headline-only stays).
- **Acceptance:** three stacked bars, widths ∝ cost; `(publik − schemalagd) × 12` reconciles to the
  optimised annual; hero unchanged; lighter-green third bar; oracle asserts all 4 new rates; no new toggle.

---

### Point 3 — "Antal sökande" stepper · **P0 (REMOVE)**

- **Decision:** **REMOVE the control.** Unanimous across UX, CMO, product-arch, copy. A single home
  box (4 190–14 550 kr) is always far under the 50 000 kr/sökande Grön Teknik cap, so 1→2 applicants
  moves the headline for *nobody* — it's friction with zero payoff, and the current tip ("relevant om
  ni köper flera boxar") is slop. Keep the cap logic in the engine; hard-pin `numTaxApplicants = 1`.
- **Where / exact edits:**
  - `index.html`: delete the applicants `.ampy-calc__field` block **L144–158**.
  - `engine.js`: keep `state.numTaxApplicants = 1` (L62). Delete `renderApplicants()` (def L701–705)
    + its call in `renderAll` (~L900) + the two stepper click bindings (L951–956). Keep the cap math
    and keep `numTaxApplicants:1` in `buildPayload` (stable payload shape).
  - `styles.css`: stepper rules may stay (harmless) or be pruned; if pruned, also drop the coarse-pointer
    tap-target rule (usability P2) since the control is gone.
  - **Regression guard (UX C8):** grep `ampyEvApplicants` across html/js/css → no dangling IDs in any
    `aria-labelledby`/`describedby`.
- **Methodology:** keep the "(upp till 2 sökande)" wording in item 4 — it's a capability disclosure, not
  a live control.
- **Acceptance:** no stepper renders; "Dina körvanor" ends on Elprisområde; Grön Teknik math + payload
  unchanged; no console errors.
- **If owner overrules (keep it):** ship the copy tooltip `Antal personer i hushållet som delar på Grön
  Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer
  taket om ni installerar flera.` and move it into the "Så har vi räknat" disclosure, out of the primary
  flow; and add the 44px coarse-pointer tap target to the `±` buttons.

---

### Point 4 — ROI "Med/Utan investering" toggle · **P0 (REMOVE)**

- **Decision:** **REMOVE.** Unanimous. The target user has no box and *must* install one, so "utan
  investering" models a fiction (a 10-year number that pretends the box is free — mildly dishonest for a
  lead-gen tool, and confusing). It sits *first* in the results card, forcing a finance decision before
  the user has even seen their saving. Hard-pin `includeInvestment = true` — the honest, complete picture.
- **Where / exact edits (do in this order so nothing orphans):**
  1. `index.html`: delete the whole `.ampy-calc__roi-control` block **L178–192**.
  2. `engine.js`: keep `state.includeInvestment = true` (L68) as a now-constant. Delete
     `updateInvestmentToggle()` (L688–696) + its call in `renderAll` (~L899) + the
     `wireToggle("ampyEvInvestmentToggle", …)` line (L948).
  3. `renderSingleResult`: `withInvest` (L746) is now constant `true`; the `(withInvest && …)` branches
     simplify to the always-true path. **Keep** `netPayTile` always visible; **keep** the offert-only
     fallback to `cumulativeSavings` for Zaptec Pro (no NaN).
  4. `buildPayload`: drop `includeInvestment` from `results.ev` (L1000) — **the only payload-shape
     change in the whole punch-list.** ⚠️ Confirm Ampy's n8n/backend doesn't key on it before dropping
     (see go-live placeholders).
  5. `styles.css`: remove `.ampy-calc__roi-control`, `.ampy-calc__roi-control-label`,
     `.ampy-calc__toggle--investment`, and the `.ampy-calc__roi-control` reveal-stagger entry.
- **Acceptance:** no ROI control renders; the hero "Du sparar per år" is the first element in the card;
  the 10-year tile always shows the net ("laddboxen betald") series for priced boxes and the savings
  series for offert; trio is a permanent clean 2-up; payload has no `includeInvestment`; oracle green.

---

### Point 5 — "Spann 12 168–14 872 kr/år" line under the hero · **P0**

- **Decision:** **REMOVE the visible span line; KEEP the dynamic sub** (owner loves it). The ±10 % band
  stays disclosed in methodology item 5 — honesty intact (red-team: do **not** also delete that item).
  Two stacked grey lines is text-on-text and invites the reader to discount the number they just got
  excited about.
- **Where / exact edits:**
  - `index.html`: delete `<span class="ampy-calc__hero15-range" id="ampyEvAnnualRange">` **L204**.
  - `engine.js`: delete the write at **L770** (`"Spann " + …`) and the unavailable-state reset at
    **L754** (`$("ampyEvAnnualRange").textContent = "—"`). Keep `savingLow`/`savingHigh` computed (still
    used by methodology + payload).
  - `styles.css`: `.ampy-calc__hero15-range` can be pruned.
- **Acceptance:** hero = eyebrow → big number → exactly one dynamic sub; "Spann" appears nowhere on the
  result surface; methodology still documents ±10 %.

---

### Point 6 — "Att betala" price sub-line · **P0**

- **Decision:** collapse the busy `Pris inkl. installation & moms 8 980 kr − Grön Teknik 4 490 kr`
  subtraction to one clean label.
- **Where:** `engine.js` **L804** priced-box branch.
- **Drop-in:** `$("ampyEvNetPaySub").textContent = "Pris inkl. installation, Grön Teknik & moms";`
  (Keep `gross`/`gronTeknik` in the payload.) Offert branch (L801) unchanged:
  `"Pris tas fram i offert för din anläggning."`
- **Acceptance:** "Att betala" shows the net number + exactly that one sub-line; no inline arithmetic;
  the footnote (Point 9) matches this wording.

---

### Point 7 — confusable "× 3,60 kr/kWh = …" explainer row · **P0 · RESOLVED (math verified PASS)**

- **Resolution (decisive):** **DELETE the row. The math is correct — there is no contradiction, no
  double-count, no hidden lower span.** Independently re-derived twice (math-verification + red-team).
  The `3,60` is **not** a price — it is the per-kWh *saving* `= 5,50 − 1,90 = rateGap`, the exact same
  number already shown bold one row above as "Du sparar per kWh". It only *reads* as a third
  contradictory price because it sits unlabelled inside a multiplication next to "5,50 / 1,90". (AC
  variant: `2,60 = 4,50 − 1,90`, same logic.) There is also a cosmetic rounding tell: the printed
  `3 756 × 3,60` would be 13 521,6 but the engine prints **13 520** (it multiplies the unrounded
  3 755,5 kWh) — a second reason to delete, not "fix," the line.
- **Where:** `engine.js renderSavingsBreakdown` **L734–738** — delete only the trailing
  `'<p …>' + fmtKm(...) + ' kWh … × ' + fmtRate(r.rateGap) + ' kr/kWh = ' + fmtKr(r.annualSaving) + ' kr/år</p>'`
  paragraph. **Keep all three card rows** (public rate, home rate, bold "Du sparar per kWh"). No formula
  change.
- **Optional (when Point 2 lands):** add a 4th transparency row in this card — `Hemmaladdning,
  schemalagd ({zone})  {homeRateOpt} kr/kWh` — under the existing home row. That is additive clarity, not
  the confusing line.
- **Acceptance:** "Hur besparingen räknas" shows exactly the 3 rate rows; no `kWh × kr/kWh = kr/år`
  sentence anywhere; headline 13 520 and the monthly panel unchanged.

---

### Point 8 — CTA block (3 sub-fixes) · **P0/P1**

**8a — Remove the micro-trust strip; land on TWO CTAs (P0).**
- **Decision:** **REMOVE** the `Svar inom 24 h / Inget köpkrav / Dina uppgifter skyddas` row (owner
  directive). *Disagreement noted:* copy + CMO liked it; red-team flagged a small completion risk. **The
  owner overrides — remove the standalone strip**, but **relocate the risk-reversal** so it isn't lost:
  the form intro already says "hör av sig … oftast inom en arbetsdag"; tighten it to also carry "Inget
  köpkrav" (see copy in Part 4 / "Other microcopy"). The two CTAs are then: primary `Få en exakt offert →`
  + the `Läs mer om {box} →` link.
- **Where:** `index.html` delete `<p class="ampy-calc__micro-trust">` **L288–292** (and the comment).
  `styles.css` prune `.ampy-calc__micro-trust`.
- **Naming:** the brief's "Få en laddbox offert" is ungrammatical Swedish; **keep the live `Få en exakt
  offert →`** (copy + CMO + product-arch all agree).

**8b — Remove input placeholders (P1).**
- **Decision:** delete `placeholder="07X XXX XX XX"` (`index.html` **L311**) and `placeholder="12345"`
  (**L316**). On the dark surface the half-grey phone placeholder reads as a *pre-filled value*; labels
  already name the fields. Keep `inputmode="numeric"` on zip; keep `type="tel"` on phone (add
  `inputmode="tel"` as a nicety).
- **Acceptance:** all four inputs visually empty until typed; phone gets default keyboard, zip numeric.

**8c — Fix the broken two-segment underline on "Läs mer om {box}" (P1).**
- **Root cause (confirmed):** `.ampy-calc__btn-link` is `inline-flex` with a `gap`; the global
  `a:hover{text-decoration:underline}` underlines each flex item separately → "Läs mer om" and "{box}"
  underline as two runs with the gap (and the SVG) un-underlined.
- **Decision / fix:** wrap the whole phrase in one inline label and underline only that; keep the SVG
  outside it.
  - `index.html` L365–367 →
    ```html
    <a class="ampy-calc__btn-link ampy-calc__btn-link--center" id="ampyEvProductLink" href="#" target="_self">
      <span class="ampy-calc__btn-link-label">Läs mer om <span id="ampyEvProductLinkName">laddboxen</span></span>
      <svg …>…</svg>
    </a>
    ```
  - `styles.css`:
    ```css
    .ampy-calc__btn-link, .ampy-calc__btn-link:hover { text-decoration: none; }
    .ampy-calc__btn-link-label { display: inline; text-underline-offset: 0.25em; }
    .ampy-calc__btn-link:hover .ampy-calc__btn-link-label,
    .ampy-calc__btn-link:focus-visible .ampy-calc__btn-link-label { text-decoration: underline; }
    ```
- **Acceptance:** hover/focus draws ONE continuous underline under "Läs mer om {box}" (incl. dynamic
  name, any length); the arrow `→` is never underlined.

---

### Point 9 — "Så har vi räknat" methodology · **P1 · math verified PASS**

- **Decision:** replace the five `{h,c,p}` items in `populateMethodology()` (`engine.js` L868–884) with
  the rewritten copy below (benefit-led headings, warmer, still accurate), **add a new item 6**
  (scheduled charging, ties to Point 2), and replace the disclaimer + footnote (`index.html` L384–390).
  No formula edits. **The Grön Teknik percentage inherits the D2 resolution** — if D2 fixes the gross
  prices to a true 48,5 %, keep "48,5 %"; if Ampy confirms a 50 % effective deduction, change every "48,5 %"
  here and in the footnote to "50 %".

**Drop-in methodology items** (`{h, c, p}`):

1. **h** `1. Så mycket energi din bil drar` · **c** `körsträcka ÷ 10 × förbrukning per 10 km ÷ 90 % laddningseffektivitet` · **p** `Vi utgår från bilens WLTP-förbrukning och din körsträcka. Cirka 10 % försvinner som förlust i laddkabel och box, så vi räknar med det.`
2. **h** `2. Vad publik laddning kostar dig` · **c** `offentlig andel × energi × publik taxa (AC 4,50 kr/kWh · DC 5,50 kr/kWh)` · **p** `Typiska svenska priser 2025 för publik AC- respektive DC-laddning. Du väljer själv vilken typ du oftast använder.`
3. **h** `3. Vad samma laddning kostar hemma` · **c** `offentlig andel × energi × hemtaxa (1,45–2,10 kr/kWh, SE1–SE4)` · **p** `Din totala hemma-kostnad per kWh — spotpris, nätavgift och skatt — i snitt för ditt elprisområde.`
4. **h** `4. Grön Teknik-avdraget` · **c** `48,5 % av priset, max 50 000 kr/sökande/år (upp till 2 sökande)` · **p** `Avdraget är 50 % av arbete och material. Med Skatteverkets schablon på 97 % blir det cirka 48,5 % av totalpriset, vilket vi drar av direkt. Kräver att du äger bostaden, har skatt att dra mot, att installatören har F-skatt och att laddpunkten har uttag enligt EN 62196-2/-3.` *(percentage subject to D2)*
5. **h** `5. Varför vi visar ett spann` · **c** `± 10 % på den årliga besparingen` · **p** `Elpriser och körvanor svänger. Spannet visar en realistisk lägsta- och högstanivå — din verkliga besparing landar troligen däremellan.`
6. **h** `6. Schemalagd laddning` · **c** `hemtaxa × ca 10–16 % lägre (varierar SE1–SE4)` · **p** `En modern laddbox flyttar laddningen automatiskt till de billigaste timmarna. Vi räknar med en försiktig sänkning på 10–16 % av hemmakostnaden — inte hela spotskillnaden (30–60 %), eftersom den inte gäller alla timmar eller alla elavtal.`

**Disclaimer** (`index.html` L385–389 prose) →
> **Så här läser du kalkylen.** Siffrorna bygger på publik branschdata för 2025–2026. Ditt verkliga
> utfall beror på hur du kör, hur du laddar och hur elpriset utvecklas. Kalkylen är en uppskattning —
> inte ett erbjudande och inte bindande för Ampy. Vill du ha ett exakt pris, begär en offert.

**Footnote** (`index.html` L390) →
> `* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.`

- **Acceptance:** all 6 items render with the new strings; every code-line still matches the engine;
  the scheduled-charging item is present; the footnote wording matches the Point 6 price line; the
  stated Grön Teknik % equals the displayed `(gross − net)/gross` to within rounding (D2).

---

### Point 10 — 16 laddbox descriptions + tags · **P1**

- **Decision:** apply the table below verbatim to each charger's `description` and `badge` in `data.js`
  (data-contract change #2; mirror `excel/build_xlsx.py` + oracle). The badge-render path already reads
  `item.badge` — **data-only, no engine change.** **Tag discipline:** exactly **7 of 16** carry a badge
  (5 owner-mandated + Zaptec Pro + Garo Entity Pro). The other 9 stay badge-free on purpose — over-badging
  kills the bestseller signal.

| # | Box (`id`) | `description` (NEW) | `badge` (NEW) |
|---|-----------|--------------------|--------------|
| 1 | `zaptec-go` | `Kompakt favorit · inkl. installation` | `Bästsäljare` |
| 2 | `zaptec-go-2` | `Inbyggd display · inkl. installation` | `Rekommenderas` |
| 3 | `easee-charge-up` | `Smart & nätt · inkl. installation` | `Bästsäljare` |
| 4 | `nexblue-edge-2` | `Prisbelönt design · inkl. installation` | `Prisvärd` |
| 5 | `go-e-gemini-flex-2-0` | `Fast eller flyttbar · inkl. installation` | `null` |
| 6 | `tesla-wall-connector` | `Fast kabel 7,3 m · inkl. installation` | `null` |
| 7 | `charge-amps-luna` | `Skandinavisk design · inkl. installation` | `null` |
| 8 | `charge-amps-halo` | `Fast kabel & statusljus · inkl. installation` | `null` |
| 9 | `charge-amps-dawn` | `Svensktillverkad premium · inkl. installation` | `null` |
| 10 | `charge-amps-aura` | `Två bilar samtidigt · inkl. installation` ⚠️D3 | `Dubbel laddning` ⚠️D3 |
| 11 | `defa-power` | `Display & −40 °C · inkl. installation` | `null` |
| 12 | `amina-s` | `Marknadens minsta · inkl. installation` | `null` *(remove "Rekommenderas")* |
| 13 | `garo-entity-home` | `Driftsäker villabox · inkl. installation` | `null` |
| 14 | `wallbox-pulsar-max` | `Prisbelönt & kompakt · inkl. installation` | `null` |
| 15 | `zaptec-pro` | `Skalbar för flera platser · offert` | `Offert` |
| 16 | `garo-entity-pro` | `Byggd för många bilar` | `Företag/BRF` |

- **Blocking data flags:** **(D3)** Charge Amps Aura — `data.js` L198 says "11 kW · stativ"; the chosen
  copy follows the dual-22 kW product page. If the real SKU is the 11 kW stativ, set description to
  `Stativ för två bilar · inkl. installation` and **drop** `Dubbel laddning`. Confirm before go-live.
  **(D2-adjacent)** the `net × 2` gross prices are placeholders (see D2) — replacing them is the same
  Excel sign-off task.
- **Acceptance:** selector shows the new descriptions; exactly 7 badges; Amina S badge gone (verify in
  `data.js`, not just visually); oracle updated; Aura held until D3.

---

### Point 11 — slider drag must be "Apple-smooth" · **P1**

The rAF/`is-dragging`/residual-transform architecture is already correct; the lag is the **gesture
contract**, not the paint. Four concrete fixes:

- **(a) The actual lag fix — `touch-action`.** `styles.css` L272 has `touch-action: pan-y` on
  `.ampy-calc__slider`, which makes the browser delay first `pointermove`s while it disambiguates
  scroll-vs-drag. Keep `pan-y` at rest; set `touch-action: none` **while `.is-dragging`**:
  ```css
  .ampy-calc__slider.is-dragging { touch-action: none; }
  ```
  And in `pointerdown` (`engine.js` ~L625) add `e.preventDefault();` with a **non-passive** listener
  (`{ passive: false }`) so iOS can't scroll/select under the gesture.
- **(b) Robust geometry (go-live, QA #4).** `dragGeom` hard-codes the 12/24px inset (`engine.js`
  ~L558), which only holds while root font-size is 62.5 %. Read the real thumb half-width:
  `var inset = parseFloat(getComputedStyle(thumb).width)/2 || 12;`. Pairs with the rem-scoping fix (G4).
- **(c) Decouple recalc from paint.** `paintDrag` fires a full `renderAll()` (recalc + count-ups + SR)
  on every step crossed mid-drag — the real jank on slow phones. During `.is-dragging`, update only the
  live value display + bar fractions (write `textContent` directly, **no count-up**); run the full
  animated `renderAll()` once on `endDrag`. Gate `animateNumber` with an `instant` flag during drag.
- **(d) Settle on one clock.** Drop the fill's release transition to `--motion-fast` so fill + thumb
  arrive together (~150ms), not fill trailing by 150ms. Honor `prefers-reduced-motion` (instant settle).
  Also listen for `pointermove`/`pointerup` on `window` while dragging (capture is in a swallowing
  `try/catch`) so a fast drag off the thumb still tracks.
- **Acceptance:** iOS Safari + iPadOS + Android Chrome + desktop — thumb tracks finger/cursor 1:1, no
  start-delay, no trailing; diagonal drag doesn't scroll the page; at rest a vertical swipe over the
  slider still scrolls; release snaps once with count-up; geometry holds with host root font-size = 16px.

---

### Point 12 — mobile slider ticks: only endpoints visible · **P1**

- **Root cause:** the `@container ampy (max-width:390px)` rule (`styles.css` ~L1050–1059) sets every
  interior, non-active km tick to `color: transparent`, leaving only `5k`, `50k`, and the active tick.
  8 km steps don't fit as labels at 344px, so the prior author hid them.
- **Decision:** **show a clean, evenly-spaced 4-label subset** — `5k · 20k · 35k · 50k` — keep all 8 as
  snap stops, and render the unlabelled stops as a small 2px tick **mark** (not invisible text), so the
  scale still reads. Always also show the active value's label; the big readout above
  (`#ampyEvKmValue`) remains the source of truth.
- **Where / how:**
  - `engine.js renderRangeSlider`: add a `visibleTickValues` option; for the km slider init pass
    `[5000, 20000, 35000, 50000]`. A tick not in the set (and not endpoint/active) renders empty text +
    `.ampy-calc__slider-tick--marker`.
  - `styles.css`: delete the `≤390px` "blank interior labels" hack; add the marker dot:
    ```css
    .ampy-calc__slider-tick--marker { color: transparent; min-width: 0; padding: 0; }
    .ampy-calc__slider-tick--marker::after { content:""; display:block; width:2px; height:6px; margin:0 auto; background:var(--border-default); border-radius:1px; }
    .ampy-calc__slider-tick--marker.ampy-calc__slider-tick--active::after { background:var(--action-primary); }
    ```
  - Bump the tick→track gap from `--spacing-xs` (5px) to `--spacing-sm` (7.5px) — ticks crowd the thumb.
  - The % slider (5 ticks 0/25/50/75/100) already fits — leave fully labelled.
  - Add a small drag-distance threshold before a `pointerup` over a tick counts as a tick tap (avoid the
    phantom click after a drag).
- **Acceptance:** at 320/344/360px the km slider shows ≥4 evenly-spaced legible labels + the active one;
  no clipped/sheared/transparent-collapsed labels; all 8 stops still draggable/snappable.

---

### Point 13 — mobile tooltip "i" → "huge ugly box" · **P0**

- **Root cause:** pure-CSS `::after` bubble on `:hover`/`:focus`; the `max-width:768px` rule forces
  `width:100%` → a full-width dark slab over the layout; on touch there's no hover, the click handler
  only `.focus()`es, and there's no dismiss/caret/edge-awareness.
- **Decision:** replace with a **tap-to-toggle disclosure popover** — the same component desktop + mobile.
  Desktop: open on hover/focus, close on leave/blur/Escape. Touch: toggle on tap, close on second tap /
  tap-outside / Escape; **one open at a time** (fold into the existing `closeAllSelectors` discipline);
  small caret; capped width; edge-clamped.
- **Where / spec:**
  - Markup per tip: button gets `aria-expanded` + `aria-controls`; the tip content becomes a referenced
    `role="tooltip"` element (the field's accessible name still excludes the "i").
  - `engine.js`: extend the tip click handler (~L959–961) to toggle an `is-open`/`data-open` class and
    close others; add document-click + Escape close (mirror selector close logic); after open, measure
    `getBoundingClientRect()` and clamp `left` to a 12px gutter, slide the caret to stay aimed at the "i",
    prefer above / flip below if it would clip the top.
  - `styles.css`: bubble `max-width: min(28rem, calc(100cqi - 3.2rem))` on **all** sizes (kill the
    `width:100%` mobile rule); `font-size --fs-xs`, `line-height 1.45`, `padding sm md`; caret `::before`;
    subtle `opacity + translateY(2px)` entrance over `--motion-fast` (suppressed under reduced-motion).
    Drop `cursor:help` on coarse pointers. Keep the 44px hit area.
  - Tooltip copy is already short (Points 1/2/3) → the popover is ~2 lines.
- **Acceptance:** mobile tap opens a compact (≤28rem / ≤ card width) caret popover; tap-again /
  tap-outside / Escape closes; only one open; never clips an edge nor covers its own control; desktop
  hover/focus unchanged; reduced-motion has no entrance.

---

### Point 14 — mobile "blaffigt" (oversized) · **P0 · primary platform**

Container-query–scoped tightening only (desktop untouched). Reference width ≈ 344px.

- **H1** (`--fs-2xl`): floor `2.2rem → 2.0rem`; on `≤600px` set `clamp(2.2rem, 6.4cqi, 2.6rem)`,
  `line-height: 1.15`, `letter-spacing: -0.01em` — reads as a tight 2-line headline, not a banner.
- **Hero value** (`--fs-4xl`): mobile floor `4rem → 3.4rem`; on `≤480px` step the value down one token to
  `--fs-3xl`; reduce the value↔unit `gap` from `1.2rem → 0.6rem`; unit `--fs-xl → --fs-lg` on `≤600px`.
- **Hero unit / secondary values:** `--fs-xl` floor `2rem → 1.8rem`; `--fs-lg` floor `1.8rem → 1.7rem`.
- **Selector thumbnails** (`--lg`): `5.6rem → 4.4–4.8rem` on `≤600px`; prominent-button padding
  `--spacing-md → --spacing-sm`. (Also unify to 4.8rem on desktop so the selected button matches its
  dropdown option — see Part 3.)
- **Card padding:** add a sub-step `@container ampy (max-width:420px){ .ampy-calc__card{ padding: var(--spacing-md); } }` (15→10px).
- **Dark card internal rhythm:** block `gap` `--spacing-lg → --spacing-md` on `≤600px`; the monthly panel
  padding `--spacing-lg → --spacing-md` (densest block, soon 3 bars).
- **Container gap** header→card: on `≤600px` → `--spacing-lg`.
- **Acceptance:** at 360–390px the first screen shows H1 + both selectors + the start of "Dina körvanor";
  the hero number + "kr/år" fit one line and clear the edge by ≥10px; nothing reads oversized; all sizes
  still come from the token clamp scale (no raw px beyond token-stepping); tap targets stay ≥44px.

---

### Point 15 — pixel-craft pass (8→10) · see PART 3

The full prioritised spacing/typography/sizing/hierarchy list (desktop + mobile) is Part 3.

---

# PART 2 — SCHEDULED CHARGING (the chosen design, rates, math, copy, honesty)

**Decision (and the one item that may want a quick owner OK — D1):** **Option (a), a THIRD bar.**

### A. Why (a) over (b) and (c)
The hero annual saving must stay anchored to the **conservative flat rate** (what you save simply by
moving public→home, regardless of timing). Scheduling is *incremental upside*, so it belongs as a
visible, labelled, secondary layer — not folded into the headline (**c**, fails MFL §10 because the SE4
summer-2025 inversion + non-universal timprisavtal make best-case scheduling non-guaranteed), and not
hidden behind a click (**b**, buries the benefit and adds a 4th toggle). A third bar shows both truths at
once: "you save a lot by charging at home; a bit more if you let the box schedule it." It is the only
option that is simultaneously more *exact*, more *compelling*, and *honest*. CMO note: a second, even-lower
green number also **sells the box** ("din laddbox sköter tajmingen automatiskt") — lifts intent, not just
the saving.

### B. The per-zone optimised rates (research-grade defaults — D1 / Excel sign-off)

| Zone | Flat home (current) | **Optimised `homeRateOptimizedSekPerKwh`** | Discount | Confidence |
|------|--------------------:|-------------------------------------------:|---------:|------------|
| SE1  | 1,45 | **1,30** | ~10 % | High |
| SE2  | 1,50 | **1,35** | ~10 % | High |
| SE3  | 1,90 | **1,60** | ~16 % | Medium-High |
| SE4  | 2,10 | **1,80** | ~14 % | Medium |

Derivation: discount only the **controllable spot slice** of the all-in rate (~11 % of the rate in the
north, ~26–31 % in the south), capture ~30 % of it (mid of the 20–30 % "smart vs flat" finding), hedge
down for the SE4 inversion + non-universal timprisavtal, fold a token effekttariff saving. Deliberately
**below** the raw 30–60 % spot spread → we under-claim. SE4's 1,80 is intentionally cautious.

### C. Math (additive — does not touch the net/gross model or the hero)
```
homeRateOpt        = REGIONS[zone].homeRateOptimizedSekPerKwh  || homeRate * 0.88   // safe fallback
monthlyHomeOptCost = publicKwh * homeRateOpt / 12
annualSavingOpt    = publicKwh * (publicRate − homeRateOpt)     // for the optional copy line
extraVsFlatPerYear = publicKwh * (homeRate − homeRateOpt)       // the "schemalagd" upside
```
- **Hero `annualSaving = publicKwh × (publicRate − homeRate)` is UNCHANGED.**
- Third bar fraction = `homeOptCost / maxCost`; maxCost stays the public bar (since
  `publicRate > homeRate > homeRateOpt`).
- Reconciliation holds by construction: `(monthlyPublic − monthlyHomeOpt) × 12 === annualSavingOpt`.
- **Worked (SE3 default, Model Y, 20 000 km, 100 %, DC):** publik `3 756 × 5,50 / 12 ≈ 1 721`; hemma
  `3 756 × 1,90 / 12 ≈ 595`; **schemalagd `3 756 × 1,60 / 12 ≈ 501 kr/mån`**; extra upside vs flat
  `3 756 × (1,90 − 1,60) ≈ 1 127 kr/år` on top of the untouched 13 520 kr/år hero.

### D. Build (files)
- **`data.js`** REGIONS (+ `engine.js` REGIONS fallback L28–31 + `excel/build_xlsx.py` + oracle): add
  `homeRateOptimizedSekPerKwh` per zone. **Data-contract change — the WP parser must emit the new column
  and the oracle must assert all 4 values.**
- **`engine.js calculateFor`** (after L238): add `homeRateOpt`, `monthlyHomeOptCost`; return on `r`.
- **`index.html`** monthly panel (after L253): 3rd `.ampy-calc__monthly-col`, label `Hemma, schemalagd`,
  value `≈ <span id="ampyEvMonthlyHomeOpt">—</span> kr/mån`, one "i" with the tooltip below.
- **`engine.js renderMonthlyComparison`** (~L840): `--monthly-homeopt-frac` + `animateNumber`; empty/0 %/
  offert → "—" / frac 0.
- **`styles.css`:** third bar lighter/dashed green (`--state-success` at ~0.6 opacity or a
  `repeating-linear-gradient`), visually subordinate to the solid home bar; value type one notch smaller
  (`--fs-md`) so hierarchy is public > home > schemalagd.

### E. Copy (Swedish, MFL-safe)
- **Bar label:** `Hemma, schemalagd` (with a quiet `(optimerad)` qualifier if it fits one line).
- **Value:** `≈ {X} kr/mån`.
- **Panel "i" tooltip:**
  > `Med schemalagd laddning låter du laddboxen ladda när elen är som billigast. Det sänker din hemmakostnad ytterligare några procent. Beror på elavtal och elområde.`
- **Methodology item 6** (already in Point 9): "En modern laddbox flyttar laddningen automatiskt till de
  billigaste timmarna. Vi räknar med en försiktig sänkning på 10–16 % … inte hela spotskillnaden (30–60 %)…"
- **Optional transparency row** in the breakdown card (Point 7): `Hemmaladdning, schemalagd ({zone})
  {homeRateOpt} kr/kWh`.

### F. Honesty framing (MFL §10)
1. Headline = conservative flat rate; **no scheduling baked into the hero.**
2. The optimised bar is labelled "schemalagd"/"optimerad" and **capped well below** the raw spot spread.
3. Copy says **"när elen är som billigast"**, never "alltid billigast på natten" (false in SE4 summer 2025).
4. The note discloses dependence on elavtal + elområde → no unconditional promise.
5. The methodology row exposes the exact kr/kWh → fully auditable.
6. The ±10 % uncertainty band stays on the headline (methodology item 5).

### G. a11y / responsive
Third value count-ups; **not** added to the SR live region (headline-only). On mobile it stacks naturally
as a third col; watch panel height (Part 3 tightens its padding). Lighter green + smaller value preserves
the public > home > schemalagd staircase.

> ⚠️ **Sign-off gate (D1):** the 4 optimised rates are defensible research-grade defaults and join the
> existing signed-Excel gate with all other `data.js` rates before go-live.

---

# PART 3 — PIXEL-CRAFT PASS (Point 15) — prioritised, per region, with values

Each item = the specific token/px/value change. P0 = reads broken/oversized on the primary platform;
P1 = clear craft win; P2 = last-5 % polish.

## P0 — proportion & hierarchy

**3-0a · Dark results card — establish a 4-tier type staircase (desktop + mobile).**
Today it's `4xl hero → lg → lg → lg`, so the 10-year number, monthly values and breakdown all read
equal-rank. Make four explicit tiers:
1. Hero annual saving — `--fs-4xl` (untouched).
2. **10-year cumulative tile** — bump that tile's value to `--fs-xl` (was `--fs-lg`) via a
   `--trio-value--hero2` modifier (only the cumulative tile; "Att betala" stays `--fs-lg`).
3. **Monthly "Du sparar" delta** — bump to `--fs-xl`; the per-column values stay `--fs-lg` (and the new
   schemalagd value one notch lower, `--fs-md`). The delta is the panel's payoff and should be its
   largest number.
4. Labels/eyebrows — `--fs-sm/xs` (unchanged).
*Acceptance:* squint test yields exactly four descending tiers; the 10-year + monthly-delta are visibly
larger than the per-column monthly figures.

**3-0b · Monthly bars are the emotional core — make them the visual climax (desktop + mobile).**
- Bar height `0.6rem → 1.0rem` (6→10px); keep `--radius-full` (capsule).
- Empty-track tint up to `rgba(255,255,255,0.08)` so the track is visible on the dark card.
- Bar-to-bar gap `--spacing-md → --spacing-lg` (10→15px) so each cost+bar pair is one unit (3 bars now).
- Public-bar gradient currently fades translucent at the right tip — replace with solid→slightly-darker
  amber for a crisp end cap.
- Third (schemalagd) bar: lighter/dashed green (Part 2 §D).
- **Demote the breakdown table** so it stops out-shouting the bars: reduce the rate-value colour
  saturation (rows already on `--on-surface-subtle-bg`); keep labels `--fs-xs`. (Optional: collapse "Hur
  besparingen räknas" into a `<details>`.)
*Acceptance:* on both breakpoints the bars are the most eye-catching element below the hero; the rate
table reads secondary; the 3 bars form a clean tall→short→shorter story.

**3-0c · Mobile type ramp one notch down (the "blaffigt" fix).** As Point 14 — H1, hero value + unit,
secondary values, selector thumbnails, card padding, dark-card gaps. (Values listed under Point 14.)

## P1 — craft wins

**3-1 · Badges — a 3-tier system (same pill geometry, different fills).** After Point 10 there are 7
tags; today they all render as one hollow teal pill, so "Bästsäljare" (push) and "Offert" (flow) look
identical.
| Tier | Tags | Style |
|------|------|-------|
| **Promote** (solid) | Bästsäljare, Rekommenderas | solid `--action-primary` bg, white text |
| **Attribute** (soft) | Prisvärd, Dubbel laddning, Populär | `rgba(0,125,107,0.10)` bg, `--action-primary` text, no border |
| **Flow** (outline) | Offert, Företag/BRF | muted hollow (`--text-secondary`) — "different path", not "buy this" |
Pill metrics: padding `0.15rem 0.5rem → 0.3rem 0.7rem`, `font-size --fs-xs`, `weight 600`,
`letter-spacing 0.02em`. In the selected button give the badge `margin-left:auto` (right-align before the
chevron, `--spacing-sm` gap); in the list option `margin-left:auto; margin-right:var(--spacing-xs)` so it
never kisses the edge. Map tier from a small `tag→tier` lookup in `renderSelector`.
*Acceptance:* push tags solid, descriptors soft, flow muted — three distinct weights; ≥6px gap each side;
no badge touches a chevron/edge.

**3-2 · Inputs card vs results card share one weight system.**
- Selector image `5.6rem → 4.8rem` (matches its own dropdown option size; reduces top-heaviness).
- Unify tiers: `--tier--primary` gap → `--spacing-md` to match `--tier--modifiers`; rely on the
  `tier + tier` border for separation.
- Remove the tier-label negative `margin-bottom: calc(-1 * --spacing-xs)` — let the `--spacing-md` gap do it.
*Acceptance:* every field-to-field gap is visually equal; selected selector image = dropdown option image.

**3-3 · Hero block after the range/ROI removals.** With Point 5 (range) and Point 4 (ROI) gone, the hero
becomes the card's true top. Tighten value↔sub to keep them paired; increase hero→trio gap to
`--spacing-lg`; lift the hero-sub colour `--on-surface-text-muted → --on-surface-text` (the owner-loved
"om du flyttar all din publika laddning hem" shouldn't read faint). Re-time the reveal stagger
(e.g. 40/100/160/220/280) now that the ROI slot is gone, with the monthly panel entering a touch earlier.
*Acceptance:* hero reads as one tight unit; clear gap to the trio; sub legible, not greyed.

**3-4 · Trio after ROI removal.** Permanent 2-up. Give the 10-year tile room:
`grid-template-columns: 1.2fr 1fr` at ≥560px; stack at <560px (already). Ensure the "Att betala" `<sup>*</sup>`
doesn't shift the label baseline. Remove the now-redundant `<hr>` between trio and the monthly panel (the
panel's own bg separates it) — keep the one before the CTA stack.
*Acceptance:* two tiles read comfortably (no number kissing a neighbour); ≤1 hairline between hero region
and CTA.

**3-5 · CTA region.** After 8a removes the micro-trust (clears the 2-line mobile orphan) and 8c fixes the
underline: promote "Läs mer om {box}" from a faint muted link to a proper **bordered/ghost button on the
dark surface** (`--on-surface-subtle-bg` bg, `--on-surface-border-strong` border, white text,
`--btn--block`) so the two CTAs read as a deliberate primary/secondary pair. Give the form intro
`margin-bottom: --spacing-xs`. Fix the form scroll target: tapping "Få en exakt offert" should
`scrollIntoView({block:'start'})` landing **Namn** near the top (currently `nearest` can leave it half-off).
*Acceptance:* exactly two CTA affordances (one filled, one bordered); tapping the CTA on mobile lands the
Namn field fully visible near the top.

**3-6 · Nested-cards DS violation.** `.ampy-calc__card--surface` contains `.ampy-calc__monthly` and
`.ampy-calc__lead-form`, both with their own bg+border+radius (mini-cards-in-a-card — DS forbids it). Drop
their 1px borders; keep subtle bg + radius (or a hairline top rule) so they read as **sections**, not
cards. Also reduces the boxy mobile feel.
*Acceptance:* no element inside the surface card has full card treatment (bg+border+shadow).

**3-7 · Zero / empty state reads intentional (not a wall of zeros).** At `publicChargingPct = 0` the hero
animates toward "≈ 0 kr/år", the bars collapse, and the breakdown still shows rate rows describing a 0
saving. Suppress the "≈ 0 kr/år" hero (grey it / show "—"), show the warmer prompt
`Dra upp andelen publik laddning så ser du vad du kan spara.`, and quiet the monthly + breakdown to a
single "—".
*Acceptance:* at 0 % the hero shows a prompt, not "≈ 0 kr/år"; raising the slider restores the count-up.

## P2 — last 5 %

- **3-p1 · "≈" declutter.** Five "≈" in one card is noise. Keep "≈" on the **hero only**; drop it from the
  monthly bars/delta (the "Din månadskostnad" framing already signals estimate). Target ≤2 "≈" visible.
- **3-p2 · Mono over-applied.** Keep `--font-mono` strictly for live/animating numbers; move slider tick
  labels to body font (mono "5k/50k" reads techy).
- **3-p3 · Eyebrow tracking.** Drop tier-label `letter-spacing 0.08em → 0.06em` on the light card.
- **3-p4 · Segmented vs toggle row heights.** Normalise SE1–SE4 segmented and AC/DC toggle to a shared
  `min-height: 4rem` (extend the coarse-pointer 44px floor to pointer-fine) so the control column has even
  rows; add a 1px ring to the active region pill for sunlight legibility.
- **3-p5 · Focus-ring token hygiene.** Several focus shadows use the pre-darkened `rgba(0,169,145,…)`;
  point them at the current `--action-primary` (`rgb(0,125,107)`).
- **3-p6 · Dead tokens / dead selector.** `--chart-stream-*`/`--chart-line-*` (old payback chart) are
  unused — note for cleanup. `.ampy-calc__header h2` never matches (markup is `<h1>`) — harmless, prune.
- **3-p7 · ≈ glyph baseline + stepper tap target.** `≈` sits slightly low on mono — minor `vertical-align`
  nudge. (If the applicants stepper is kept against the recommendation, add the 44px coarse-pointer hit
  area to the `±` buttons.)

---

# PART 4 — ADDITIONAL IMPROVEMENTS THE PANEL FOUND BEYOND THE 15

These are net-new finds (not in the owner's 15). The first three are **blocking**.

1. **[BLOCKER · D2] Grön Teknik 50,0 % shown vs 48,5 % claimed.** Every `grossPriceSek` is exactly
   `net × 2` → the displayed deduction is **50,0 % on all 15 priced boxes** (verified), but the footnote +
   methodology say **48,5 %**. Internal contradiction in the trust section. **Fix:** replace placeholder
   gross prices so `(gross − net)/gross ≈ 48,5 %` (gross ≈ net ÷ 0,515), OR change all copy to 50 %. Excel
   sign-off owner. *Acceptance:* `(gross − net)/gross` for every box matches the stated %, to rounding.

2. **[BLOCKER · D3] Charge Amps Aura spec contradiction** — see Point 10 / D3. Don't ship a dual-charging
   claim on an "11 kW stativ" record without confirming the SKU (MFL false-claim risk).

3. **[BLOCKER · integration, QA G4] `html{font-size:62.5%}` leaks to the host page.** `index.html` L6 sets
   the rem base **globally**, outside `.ampy-calc` — in a real WordPress/Bricks page this shrinks every
   other element's rem sizing on the host site, and desyncs the slider's hard-coded px geometry if the
   theme overrides root font-size. **Fix:** scope the 62.5 % base to the component wrapper
   (`.ampy-calc-outer { font-size: 62.5%; }`) and use `em`/component-relative units inside, or confirm with
   the WP integrator that site-wide is intentional. Pairs with the robust slider geometry (Point 11b).

4. **[go-live placeholder] `/integritetspolicy` href** (`index.html` L343) — must point at the live policy
   before go-live (GDPR Art. 13). Lead-form blocker.

5. **[go-live placeholder] Payload shape — confirm `includeInvestment` removal** (Point 4) doesn't break
   Ampy's n8n/backend mapping before dropping the key. And `restUrl`/`nonce`/`postId` stay WP-injection
   placeholders.

6. **[P1] Slider capture hardening** — `setPointerCapture` is in a swallowing `try/catch`; add window-level
   `pointermove`/`pointerup` while dragging so a fast drag off the thumb still tracks (Point 11d).

7. **[P2] Selector listbox keyboard nav** — 16 items with only Tab; add roving
   `ArrowUp/Down/Home/End/Enter` + keep the selected item scrolled into view on open. Type-ahead is a
   nice-to-have.

8. **[P2] Count-up stutter on low-end phones** during fast drags — covered by the Point 11c "no count-up
   mid-drag" change; verify on a real device.

9. **[P2] Form niceties** — add `inputmode="tel"` to phone; verify the consent-error outline is visible on
   the dark surface; verify bestseller-tagged boxes (Zaptec Go, Easee) sit near the top of the open list so
   the badges are seen without scrolling (Zaptec Go is already first → boots on a "Bästsäljare").

---

# PART 5 — BUILD SEQUENCE (files per step) + OPEN OWNER DECISIONS

Build the prototype first, browser-verify (desktop + mobile), then port to WP and reconcile Excel/oracle.
Order chosen so the oracle baseline is stable before deletions and so nothing orphans.

### Step 1 — DATA FIRST (the only two data-contract changes)
- `data.js`: (a) 16 box `description`/`badge` (Point 10); (b) add `homeRateOptimizedSekPerKwh` to the 4
  REGIONS (Part 2); (c) Aura held on **D3**; gross prices on **D2**.
- `engine.js` REGIONS fallback (L28–31): mirror the optimised rates.
- `excel/build_xlsx.py` + oracle: emit the new optimised-rate column + the new box strings; **regenerate
  and green the oracle in one pass.** Assert all 4 optimised rates and the 16 strings.

### Step 2 — ENGINE REMOVALS (pure deletions/simplifications, after data so the baseline is stable)
- `engine.js`/`index.html`: remove ROI toggle (Point 4), applicants stepper (Point 3), the "Spann" line
  (Point 5), the explainer row (Point 7). Drop `includeInvestment` from payload (D2-confirm backend).
- Regression guard: grep `ampyEvApplicants`, `ampyEvInvestmentToggle`, `roi-control`, `ampyEvAnnualRange`
  → no dangling IDs; re-verify tab order.

### Step 3 — ENGINE ADDITIONS
- `engine.js calculateFor` + `renderMonthlyComparison`: third-bar math + render (Part 2).
- `engine.js populateMethodology`: 6 rewritten items incl. the new scheduled-charging item (Point 9).
- Price line one-liner (Point 6); zero-state suppression (3-7).

### Step 4 — DOM / COPY
- `index.html`: tooltips (Points 1, 2a), third monthly col + its "i", disclaimer + footnote (Point 9),
  remove placeholders (8b), "Läs mer" label wrapper (8c), remove micro-trust (8a), tighten form intro.

### Step 5 — CSS
- `styles.css`: 8c underline; third-bar style; tooltip popover (Point 13); slider drag `touch-action` +
  release transition (Point 11); km tick subset + markers (Point 12); mobile sizing/rhythm (Point 14);
  the full Part 3 pixel pass (staircase, bars-as-climax, 3-tier badges, weight-system, hero, trio,
  CTA, nested-cards, polish); scope the 62.5 % rem base (G4).

### Step 6 — VERIFY
- Browser-test desktop + mobile (existing Phase pattern); re-run oracle; re-screenshot. Device matrix:
  iPhone SE (~344), iPhone 14/15 (390/393), small Android (360), 320 floor, iPad (768–960), desktop
  (≥1024); cross-cut reduced-motion, keyboard-only, VoiceOver/NVDA (headline-only), host root font-size = 16px.

### Step 7 — WP PORT + EXCEL/ORACLE RECONCILE
- Port the prototype to the WP/Bricks/FluentSnippets target; inject `restUrl`/`nonce`/`postId`; point the
  `/integritetspolicy` href; confirm the n8n payload (sans `includeInvestment`). Confirm the parser emits
  the two new data-contract fields and the oracle is green against the WP-rendered data.

### Open OWNER DECISIONS (the only blocking choices — repeated for the build owner)
- **D1 — Scheduled-charging third bar + the 4 optimised rates.** Recommend: ship; quick OK on rates.
- **D2 — Grön Teknik 50 % vs 48,5 %.** Recommend: fix gross prices to true 48,5 % in the signed Excel.
- **D3 — Charge Amps Aura SKU** (11 kW stativ vs dual-22 kW). Recommend: confirm SKU, then apply matching copy.
- *(Overrule options preserved:* keep "Antal sökande" → ship the non-slop tooltip + 44px stepper; keep
  micro-trust → make it one centered line. Neither is recommended.)*

---

# PART 6 — ACCEPTANCE / QA CHECKLIST FOR A 10/10

**Correctness & honesty (P0 — blockers)**
1. ☐ Every number on screen reconciles to every other number **and to its own explanation** — incl. the
   Grön Teknik %: `(gross − net)/gross` == the footnote/methodology % for every box (D2).
2. ☐ No on-screen product claim contradicts the product data (Aura SKU, D3).
3. ☐ The confusable "× 3,60 kr/kWh = …" explainer row is gone; the 3 rate rows remain; headline 13 520 and
   the monthly panel unchanged (math untouched).
4. ☐ Scheduled-charging is a **third bar only**, never folded into the hero; `(publik − schemalagd) × 12`
   reconciles; degrades cleanly at 0 %/offert; copy says "när elen är som billigast" (never "på natten");
   ±10 % band retained in methodology.
5. ☐ ROI toggle removed; the card opens on the hero; 10-year shows the net series for priced boxes, savings
   for offert; payload has no `includeInvestment` (backend confirmed).
6. ☐ "Antal sökande" removed (or, if overruled, non-slop tooltip + out of primary flow); Grön Teknik cap
   math unchanged.
7. ☐ "Spann" line gone from the surface; ±10 % still in methodology.
8. ☐ One clean price line "Pris inkl. installation, Grön Teknik & moms"; footnote matches.
9. ☐ Exactly two CTAs (filled primary + bordered "Läs mer"); "Läs mer om {box}" hover = one continuous
   underline; no placeholders; risk-reversal preserved in the form intro.
10. ☐ `62.5 %` rem base scoped to the component — does not leak to the host page; slider geometry holds at
    host root = 16px.

**Mobile / interaction (P1 — primary platform)**
11. ☐ At 360–390px: H1 ≤2 lines (~24–26px), hero value + "kr/år" one line clearing the edge, both selectors
    + the start of "Dina körvanor" visible on the first screen; nothing oversized; no edge bleed.
12. ☐ Slider drags 1:1 on iOS with no start-delay/trailing; diagonal drag doesn't scroll; release snaps once;
    at rest a vertical swipe over it still scrolls.
13. ☐ km slider shows ≥4 evenly-spaced legible labels (5k·20k·35k·50k) + the active one; all 8 stops snap.
14. ☐ Tooltip "i" opens a compact caret popover (≤28rem / ≤ card width), tap-outside/Escape/re-tap closes,
    one open at a time, never clips an edge nor covers its control; desktop hover/focus unchanged.
15. ☐ Empty/0 %/offert states read intentional — no wall of zeros, no NaN, no orphaned rate rows.

**Pixel craft (10/10 bar)**
16. ☐ Squint test on the dark card → four clean descending type tiers (hero → 10-yr+monthly-delta →
    per-column values → labels).
17. ☐ The monthly bars are the visual climax below the hero; the rate table reads secondary; the third
    (schemalagd) bar is a soft lighter-green bonus layer.
18. ☐ Badges carry three distinguishable weights; only push tags are solid teal; exactly 7 of 16 boxed;
    Amina S has none; no badge touches a chevron/edge.
19. ☐ Inputs and results cards share one weight system (selector img 48px = dropdown option; even
    field-to-field gaps; no negative-margin hacks; no nested full-card treatments; ≤1 redundant divider).
20. ☐ Reveal stagger re-timed after removals; ≤2 "≈" visible; reduced-motion honored on slider, count-ups,
    popover, and the new bar.

**Process / parity**
21. ☐ Oracle green; only two data-contract fields changed (optimised rate column + 16 box strings); WP parser
    emits both; prototype ↔ WP in lockstep.
22. ☐ Go-live placeholders resolved: `/integritetspolicy` href live; `restUrl`/`nonce`/`postId` injected;
    n8n payload confirmed. All `data.js` rates (incl. the 4 optimised) signed off in the Excel.
23. ☐ Keyboard-only path clean (no dangling IDs, sane tab order, listbox arrow-nav if shipped); VoiceOver/NVDA
    announces the headline only.
