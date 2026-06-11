# R3 — Lead-Magnet / CRO / CMO Audit (Ampy Laddbox-kalkylator)

**Lens:** maximise *qualified* laddbox-offert leads, honestly. Every recommendation is judged on: does it raise completed, intent-qualified offert submissions without burning trust or violating MFL?
**Method:** read both full-page PDFs (desktop + mobile), the source (`index.html`, `engine.js`, `styles.css`, `data.js`), and the three Phase-1 outputs (`r3-math-verification.md`, `r3-scheduled-charging.md`, `r3-copy.md`). Line numbers are current as of this read.
**Date:** 2026-06-11.

Priorities: **P0** = directly moves lead volume/quality or fixes a conversion leak; ship first. **P1** = meaningful lift / trust. **P2** = polish.

---

## 0. The conversion thesis (why this tool converts, and where it leaks)

The funnel is: **land → see a big honest number → believe it → submit offert**. The single most important job of the page is to make the headline number *credible* and the offert *frictionless*. Most of the owner's 15 points map cleanly onto one of those two jobs:

- **Credibility leaks** (kill these): contradictory tooltips (pt 1, 2), the AI-slop "Antal sökande" copy (pt 3), the confusing `3,60 kr/kWh` explainer row (pt 7), the double "Spann" text (pt 5), an unneeded ROI toggle the target user can't reason about (pt 4), weak box descriptions (pt 10).
- **Friction / form leaks** (kill these): a 3-item micro-trust line *and* a 4-field form *and* a placeholder-filled form (pt 8), a broken hover underline (pt 8c), a clunky mobile experience (pt 11–14).
- **Upside add** (build this honestly): the scheduled-charging third bar (pt 2) — a *second* green number that makes the win feel even bigger without overclaiming.

Net: this is already an 8/10 tool. The path to 10/10 is **subtraction** (remove every element the buyer doesn't need to act) plus **two additions** (the scheduled bar, the box tags). Below, each point gets problem → recommendation → concrete spec → acceptance.

---

## P0 — Conversion-critical

### P0-1 — CTA simplification: remove the micro-trust line, land on TWO CTAs (owner pt 8a)

**Problem.** Under the primary CTA (`index.html` 288–292) sits a 3-item check-row "✓ Svar inom 24 h ✓ Inget köpkrav ✓ Dina uppgifter skyddas". On mobile (screenshot 4) it wraps to two lines and stacks *above* an already-long form that *also* says "Vår laddbox-expert hör av sig… oftast inom en arbetsdag." → the same promise twice, plus a privacy promise the consent checkbox restates a third time. This is reassurance theatre: it adds vertical noise at the exact decision point and competes with the CTA for the eye. The owner is right.

**Recommendation.** Remove the micro-trust `<p class="ampy-calc__micro-trust">` block entirely. Land on exactly **two** actions in the CTA stack:
1. Primary: **`Få en exakt offert →`** (keep — see copy note below).
2. Tertiary link: **`Läs mer om {box} →`** (keep, fix underline per P0-7).

The single reassurance the buyer needs ("no commitment, expert calls you") already lives in the form intro line and the consent text — one mention each is enough. One promise, well placed, beats three scattered.

> **Naming note (defer to copy agent / r3-copy §Primary CTA):** the brief says "Få en laddbox offert", but that is grammatically awkward Swedish; the live `Få en exakt offert →` is stronger and the copy agent recommends keeping it. **Keep the live label.** The "two CTAs" requirement is satisfied by primary + "Läs mer om X"; do not add a third.

**Concrete spec.**
- Delete `index.html` lines 285–292 (the comment + the `<p class="ampy-calc__micro-trust">…</p>`).
- Remove the now-orphan `.ampy-calc__micro-trust` rules from `styles.css` (946–952) to keep the sheet clean.
- Keep the CTA `→` arrow; keep the form intro line (tightened per copy agent: "En av våra laddbox-experter hör av sig…").

**Acceptance.** Below the primary CTA there are zero trust-badge rows. The CTA stack contains: primary button → (form, when opened) → "Läs mer om {box} →". No promise appears more than once on screen. Mobile: the gap between CTA and "Läs mer" tightens by one wrapped line.

---

### P0-2 — Strip the form placeholders (owner pt 8b)

**Problem.** Telefon and Postnummer carry placeholder text `07X XXX XX XX` and `12345` (`index.html` 311, 316). On the dark surface these render at `--on-surface-text-faint` (styles 678) and on mobile (screenshot 4) the half-grey `07X XXX XX XX` reads like a *pre-filled value*, not a hint — users tab past it, or worse, think the field is done. Placeholders also disappear on focus, removing the only label-substitute for users who lose the real label while typing (it's a known a11y + completion anti-pattern). Name and E-post have no placeholder, so the form is also visually inconsistent. The owner is right to kill them.

**Recommendation.** Remove both placeholders. The `<label>` above each input already names the field; that's the correct, accessible pattern and it's what Name/E-post already do.

**Concrete spec.**
- `index.html` 311: delete `placeholder="07X XXX XX XX"`.
- `index.html` 316: delete `placeholder="12345"` (keep `inputmode="numeric"` — it still gives the numeric keypad).
- Optional, kept: nothing else changes; validation messages (engine 1051–1052) already guide format on error.

**Acceptance.** All four inputs are visually empty until typed into; none shows ghost text. Phone field still opens the default keyboard; Zip still opens the numeric keypad on mobile. No field reads as pre-filled.

---

### P0-3 — Remove the ROI toggle "Räkna med laddboxens kostnad" (owner pt 4)

**Problem.** The two-pill "Med investering / Utan investering" control (`index.html` 178–192) sits at the very top of the results card — the first thing the eye hits after the inputs. For the target user (no box yet, needs one installed) the investment is *always* part of reality, so "Utan investering" is a hypothetical they can't act on. Worse, it forces a decision before they've even seen their number, and its tooltip ("Med investering: vi drar av vad laddboxen kostar… Utan investering: ren besparing…") is a paragraph of finance jargon at the moment of first impression. It only changes one tile ("Att betala" / the 10-year framing). This is a classic "engineer's toggle" — it exposes an internal model choice to a buyer who just wants to know "what do I save and what does it cost." Every toggle is a micro-decision that leaks attention; this one leaks it at the worst possible spot. The owner's instinct (remove) is correct and the highest-leverage simplification on the page.

**Recommendation.** Remove the control. **Hard-default `includeInvestment = true`** ("med investering" — investment included), which is the honest, complete picture: the hero shows pure annual saving, the "Sparar på 10 år" tile nets out the box (130 710 kr), and "Att betala" shows the real price after Grön Teknik. That is exactly the buyer's mental model. Nothing of value is lost; the engine already computes both series and the "with investment" branch is the truthful default.

**Concrete spec.**
- `index.html`: delete the entire `.ampy-calc__roi-control` block (178–192).
- `engine.js`: keep `state.includeInvestment = true` (line 68) as a constant; remove `updateInvestmentToggle()` (688–696), its call in `renderAll` (899), and the `wireToggle("ampyEvInvestmentToggle", …)` binding (948). `renderSingleResult` already handles `withInvest = true` correctly.
- `styles.css`: remove `.ampy-calc__roi-control*` and `.ampy-calc__toggle--investment*` rules (405–425, 969/978) once unused.
- The hero (`Du sparar per år`) now sits directly under the card top — a cleaner, more confident first impression.

**Acceptance.** The results card opens straight into "DU SPARAR PER ÅR ≈ 13 520 kr/år" with no toggle above it. The 10-year tile shows the net-of-box figure ("laddboxen betald, Grön Teknik inräknad"); "Att betala" shows the real price. No "Med/Utan investering" UI exists. Removing it deletes ~one full input-row of height on mobile above the hero.

---

### P0-4 — Drop the "Spann …" line under the hero; keep the dynamic sub (owner pt 5)

**Problem.** Under "≈ 13 520 kr/år" there are two grey sub-lines (`index.html` 201–204): the dynamic `om du flyttar all din publika laddning hem` (good — it qualifies the number honestly and personalises it) and `Spann 12 168–14 872 kr/år` (mono, faint). Two stacked grey lines under the hero is text-on-text; the span line invites the reader to *discount* the big number they just got excited about — a conversion own-goal. The ±10 % band still lives in the methodology ("5. Osäkerhetsspann"), which is the right place for it. Owner is right.

**Recommendation.** Remove the visible `Spann …` line from the hero. Keep the dynamic sub (the owner explicitly loves it). The uncertainty band stays disclosed in "Så har vi räknat" — honesty preserved, hero kept clean and confident.

**Concrete spec.**
- `index.html`: delete `<span class="ampy-calc__hero15-range" id="ampyEvAnnualRange">—</span>` (204).
- `engine.js`: remove the line that writes it (`$("ampyEvAnnualRange").textContent = "Spann …"`, ~770) and the unavailable-state reset (~754). `savingLow`/`savingHigh` stay computed (still used for the methodology / payload).
- `styles.css`: `.ampy-calc__hero15-range` (892–895) can be removed once unreferenced.

**Acceptance.** The hero shows exactly: eyebrow → `≈ 13 520 kr/år` → one dynamic sub-line. No "Spann" text anywhere in the result card. The ±10 % band still appears in the methodology disclosure.

---

### P0-5 — Scheduled-charging THIRD bar: a second, honest green number (owner pt 2)

**Problem & opportunity.** Today the home rate is a flat per-zone kr/kWh and we never mention that a modern box auto-schedules to the cheapest hours — leaving real, defensible savings (and persuasion) on the table. Per `r3-scheduled-charging.md`, the right move is **Option (a): a third bar** "Hemma, schemalagd (optimerad)" in the monthly panel, fed by a new per-zone `homeRateOptimizedSekPerKwh` (SE1 1.30 / SE2 1.35 / SE3 1.60 / SE4 1.80). The hero stays anchored to the conservative flat rate; the third bar is *additive upside*.

**Why this is a P0 for leads (the CRO case).** A second, even-lower green number ("≈ 501 kr/mån") directly under "Hemma efter installation ≈ 595 kr/mån" does three things for conversion: (1) it dramatises "it gets even better" at the exact moment of belief-formation; (2) it introduces a *capability of the box being quoted* ("din laddbox sköter tajmingen automatiskt") — i.e. it sells the product, not just the saving, which raises *intent* to ask for an offert on a smart box; (3) it deepens credibility because we *under*-claim vs the raw 30–60 % spot spread. This is the rare addition that lifts conversion *and* trust.

**Recommendation.** Build Option (a) exactly as specced in `r3-scheduled-charging.md` §6. The hero/annual number does **not** change. From a CMO lens, lean the copy on **the box does it for you**, automatically — that is the line that turns a saving into a reason to buy a box.

**Concrete spec.** (full detail in `r3-scheduled-charging.md` §6 — summarised here for the lead lens)
- `data.js` REGIONS: add `homeRateOptimizedSekPerKwh` per zone (1.30 / 1.35 / 1.60 / 1.80). Engine fallback `homeRate * 0.88` if absent.
- `engine.js` `calculateFor`: add `monthlyHomeOptCost = publicKwh * homeRateOpt / 12` and `extraVsFlatPerYear = publicKwh * (homeRate − homeRateOpt)`.
- `index.html` monthly panel: add a third `.ampy-calc__monthly-col` "Hemma, schemalagd (optimerad)" with its own value span + bar; lighter/dashed green fill to distinguish from the normal home bar.
- Copy (CMO-tuned, MFL-safe): bar label **`Hemma, schemalagd`** with a small "(optimerad)" qualifier; one-line note under the panel: **`Din laddbox laddar automatiskt när elen är som billigast — sänker hemmakostnaden ytterligare ca {discount} %. Beror på elavtal och elområde.`** Never say "alltid billigast på natten" (false in SE4 summer 2025).
- a11y: do NOT add the optimised number to the SR live region (headline-only stays).

**Acceptance.** Monthly panel shows three stacked rows: Publik (orange) > Hemma (green) > Hemma schemalagd (lighter green), with `(publik − hemma_opt) × 12 === annualSavingOpt`. Hero annual saving is unchanged (still flat-rate). The note uses "när elen är som billigast", carries a "beror på elavtal och elområde" hedge, and frames the box as doing it automatically. Methodology gains the scheduled-charging bullet (r3-scheduled §6.3).

---

### P0-6 — Delete the confusing `3,60 kr/kWh` explainer row (owner pt 7)

**Problem.** In "Hur besparingen räknas" the card shows public 5,50 / home 1,90 / **Du sparar per kWh 3,60**, then a trailing grey line `3 756 kWh … × 3,60 kr/kWh = 13 520 kr/år` (engine 734–738). `r3-math-verification.md` confirms the math is **correct** (3,60 = 5,50 − 1,90, the per-kWh *saving*, not a price) — but sitting next to "5,50 / 1,90" the `3,60` reads as a third, contradictory price, and there's a cosmetic rounding wrinkle (3 756 × 3,60 = 13 521,6 vs printed 13 520). It restates the same delta twice and invites the exact "wait, which price is real?" doubt that stalls a lead. Owner and the math verifier agree: delete the row.

**Recommendation.** Remove only the trailing `<p>` explainer. **Keep all three rows** in the card (public rate, home rate, bold "Du sparar per kWh") — they tell the whole story unambiguously, and the hero + monthly panel already carry the "× kWh = kr/år" result. No formula change.

**Concrete spec.**
- `engine.js` `renderSavingsBreakdown` (734–738): delete the trailing `'<p …>' + fmtKm(...) + ' kWh offentlig laddning per år × ' + fmtRate(r.rateGap) + …'</p>'` paragraph. Keep the three-row box above it.
- When P0-5 lands, optionally add the 4th rate row "Hemmaladdning, schemalagd ({zone}) {opt} kr/kWh" here for full transparency (r3-scheduled §6.3) — that's additive, not the confusing line.

**Acceptance.** "Hur besparingen räknas" shows exactly the three rate rows in the rounded box; no free-floating "× 3,60 = …" sentence below it. No number on the page reads as a contradictory price.

---

### P0-7 — Fix the broken "Läs mer om X" hover underline (owner pt 8c)

**Problem.** The product link (`index.html` 365–367) is `Läs mer om <span id="…Name">laddboxen</span>` inside an `<a>`. The default `a:hover { text-decoration: underline }` (styles 126) underlines the two text nodes separately, and the inline-flex layout (`.ampy-calc__btn-link`, styles 870–875) + `gap` between the text and the trailing SVG breaks the underline into segments ("Läs mer om" — gap — "Zaptec Go"). It reads as two broken links. Small, but it's the secondary CTA — it should look crisp.

**Recommendation.** Make the underline one continuous run on hover, and never underline the arrow icon.

**Concrete spec.** In `styles.css`, scope the link:
```css
.ampy-calc__btn-link--center { text-decoration: none; }
.ampy-calc__btn-link--center:hover { text-decoration: none; }
/* underline only the text, as one run, via an inner wrapper or border-bottom */
```
Cleanest implementation: wrap the visible text ("Läs mer om {name}") in a single `<span class="ampy-calc__btn-link-text">` and apply `:hover { text-decoration: underline; text-underline-offset: 0.25em; }` to *that span only* (the SVG stays outside it). Set the `<a>` itself to `text-decoration: none` in both states. This guarantees one continuous underline under the full phrase including the dynamic box name, and the arrow never underlines.

**Acceptance.** Hovering "Läs mer om Zaptec Go →" draws a single unbroken underline under "Läs mer om Zaptec Go" (including the box name), the arrow `→` is never underlined, and there is no gap-break in the underline at any box name length.

---

### P0-8 — Rewrite "Antal sökande" — and strongly consider removing it (owner pt 3)

**Problem.** The tooltip (`index.html` 150) is AI-slop: "…relevant om ni köper flera boxar." For a single-home lead magnet this control changes the result for essentially **nobody** — one box (4 000–15 000 kr) is always far under the 50 000 kr/år/sökande Grön Teknik cap, so stepping 1→2 moves zero kronor for the realistic buyer. It adds a field, a decision, and a tooltip for ~zero payoff, and it sits in the input column the user must clear to reach their number. From a lead lens, it's pure friction with no qualifying value.

**Recommendation (preferred).** **Remove the stepper**, default `numTaxApplicants = 1`, keep the cap logic in the engine (it already caps correctly). This shortens the input column by one row — meaningful on mobile, where every row pushes the result further below the fold. This is the cleaner call and the one I'd push for.

**If the owner insists on keeping it**, ship the non-slop tooltip from `r3-copy.md`:
> `Antal personer i hushållet som delar på Grön Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer taket om ni installerar flera.`

**Concrete spec.**
- Remove path: delete the applicants `.ampy-calc__field` (145–158); in `engine.js` remove `renderApplicants()` (701–705 + call at 900) and the inc/dec bindings (951–956); keep `state.numTaxApplicants = 1`.
- Keep path: replace only the `data-tip` string at 150 with the copy above.

**Acceptance.** Either the input column ends at "Elprisområde" (stepper gone) and the engine still caps Grön Teknik at 50 000 kr × applicants internally; or, if kept, the tooltip contains no "relevant om man köper fler boxar" phrasing and reads as the rewritten sentence.

---

## P1 — Trust, value framing, and the box catalogue

### P1-1 — Laddbox descriptions + tags: sell the product, discipline the badges (owner pt 10)

**Problem.** All 16 boxes show only "{kW} · inkl. installation" — a spec, not a reason to choose. The selector sub-line is prime real estate (it's what the buyer reads while choosing the box they'll request an offert on), and a spec line does no selling. Amina S carries a stray "Rekommenderas" badge that should move to Zaptec Go 2.

**Recommendation.** Apply the full rewrite from `r3-copy.md §3` (product-focused 2–5-word descriptions + owner-mandated tags). The CMO discipline that matters for conversion: **only 7 of 16 boxes carry a badge** (5 mandated + Zaptec Pro + Garo Entity Pro). Over-badging destroys badge signal; keeping 9 boxes badge-free is what makes "Bästsäljare"/"Rekommenderas" actually pull. Mandated tags: Zaptec Go=Bästsäljare, Zaptec Go 2=Rekommenderas, Easee Charge Up=Bästsäljare, NexBlue Edge 2=Prisvärd, Charge Amps Aura=Dubbel laddning; remove Amina S "Rekommenderas"; keep tasteful tags on Zaptec Pro (Offert) + Garo Entity Pro (Företag/BRF).

**Concrete spec.** Update each charger's `description` and `badge` in `data.js` (and the `excel/build_xlsx.py` mirror) to the table in `r3-copy.md §3`. **Data flag (blocking):** Charge Amps Aura — `data.js` says "11 kW · stativ" but the product page says wall-mounted dual-outlet up to 22 kW; the "Dubbel laddning" tag + "Två bilar samtidigt" copy follow the product page. Confirm the real spec before go-live (r3-copy Data flag 1).

**Acceptance.** Each box shows a benefit-led description (not bare kW); exactly the 7 badges above appear; Amina S has no badge; the badge on the selected box also renders in the closed selector (engine 413–418 already handles this).

> **CRO note on default box:** the calculator boots on the *first available* charger (engine 1175) = Zaptec Go. With Zaptec Go now tagged "Bästsäljare", the default first impression is a bestseller — good. Keep Zaptec Go first in `data.js` order.

### P1-2 — Methodology copy verified + rewritten (owner pt 9)

**Problem/Recommendation.** `r3-math-verification.md` confirms every methodology line is numerically correct (energy chain, AC/DC, reconciliation, Grön Teknik, payback all PASS). The copy agent (`r3-copy.md §2`) has rewritten all five items + disclaimer + footnote word-by-word in brand voice. From the lead lens the only load-bearing change is **point 6's footnote reconciliation**: the in-result price label becomes `Pris inkl. installation, Grön Teknik & moms` and the footnote stops re-introducing "48,5 % av priset" — so the buyer is never left wondering whether they still have to *claim* the deduction (they don't; it's pre-applied). That ambiguity is a quiet objection that can stall a price-sensitive lead.

**Concrete spec.** Apply `r3-copy.md §2` to `populateMethodology()` (engine 868–884), the disclaimer (`index.html` 384–390), and the in-result price sub-line (engine 804). When P0-5 lands, add the scheduled-charging methodology bullet.

**Acceptance.** Every methodology item matches the rewritten copy; the price sub-line reads `Pris inkl. installation, Grön Teknik & moms`; the footnote says the deduction is *already* applied; no line contradicts the math verifier's confirmed formulas.

### P1-3 — Show ONE price line: "Pris inkl. installation, Grön Teknik & moms" (owner pt 6)

**Problem.** "Att betala" currently subtitles with the full arithmetic: `Pris inkl. installation & moms 8 980 kr − Grön Teknik 4 490 kr` (engine 804). On mobile (screenshot 3) this is a long, math-y line under the price that competes with the hero saving and reads as "there's a bigger number you're not paying" — fine in principle, but it's clutter at the value moment. Owner wants one clean line.

**Recommendation.** Replace the sub with the single label `Pris inkl. installation, Grön Teknik & moms`. The gross-minus-deduction detail lives in the methodology footnote (P1-2), where a curious buyer can find it — not stacked under the price.

**Concrete spec.** `engine.js` 804: change the priced-box branch to `$("ampyEvNetPaySub").textContent = "Pris inkl. installation, Grön Teknik & moms";`. Offert branch (801) unchanged.

**Acceptance.** Under "Att betala 4 490 kr" there is exactly one sub-line: `Pris inkl. installation, Grön Teknik & moms`. No gross figure or "− Grön Teknik …" arithmetic appears in the result tile.

### P1-4 — Tighten tooltips 1 & 2 (owner pt 1, pt 2-tooltip)

**Problem/Recommendation.** Per `r3-copy.md §1`: "Andel offentlig laddning" is self-contradictory and "Elprisområde" is a paragraph. Both are credibility leaks (a confused tooltip makes the *number* feel shaky). Replace with the one-sentence versions:
- Andel offentlig laddning (`index.html` 106): `Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.`
- Elprisområde (`index.html` 139): `Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.`
- Typ av offentlig laddning (122): tighten to the two prices the engine uses (drop the unused "abonnemang" aside): `AC = långsam laddning vid parkering och köpcentrum (ca 4,50 kr/kWh). DC = snabbladdning längs vägen (ca 5,50 kr/kWh).`

**Acceptance.** Each tooltip is one or two short sentences, internally consistent, and matches the rates the engine applies.

---

## P2 — Mobile UX, interaction, and pixel polish (owner pt 11–15)

> These are handled in depth by the UX/design agents; below are the lead-/CRO-relevant calls and a few pixel findings of my own. The tool is *primarily mobile under paid traffic* (pt 14) — every one of these protects the conversion the ad spend paid for.

### P2-1 — Slider drag must be flawless on iOS/touch/desktop (owner pt 11)
The engine already has a sophisticated rAF + `.is-dragging` + residual-transform path (engine 540–639) and a 44px hit-area (`::before`, styles 309–314). If it still feels laggy, the likely culprits to verify on a real iPhone: (a) `touch-action: pan-y` on `.ampy-calc__slider` (styles 272) is correct for vertical scroll but confirm the pointer events aren't being pre-empted by the page; (b) the count-up `animateNumber` (280 ms, engine 322–341) firing on every snapped step during a drag can jank the main thread — consider suppressing the count-up *while* `.is-dragging` and only animating on release. **Acceptance:** dragging either slider on iOS Safari tracks the finger 1:1 with no trailing thumb and no number-flicker; release snaps smoothly to the step.

### P2-2 — Mobile slider ticks: all steps legible, or a clean subset (owner pt 12)
Per screenshots 5/6, the km slider currently collapses interior labels to transparent below 390px, leaving only endpoints + active (styles 1050–1059) — so "only the two outermost show", exactly the complaint. **Recommendation:** show a clean *subset* at all widths rather than hiding to two. For the 8-step km slider, render every *other* tick label below 500px (5k · 15k · 25k · 40k, plus active), keeping them evenly spaced and legible, instead of going to endpoints-only. The % slider's 5 ticks (0/25/50/75/100) already fit — leave it. **Acceptance:** on a 360px phone the km slider shows ≥4 evenly distributed, readable labels (never just 2), and the active step is always labelled.

### P2-3 — Mobile tooltip "i" → redesign off the giant box (owner pt 13)
Tapping "i" on mobile currently shows the CSS `::after` bubble sized `width: max-content; max-width: 24rem` re-anchored full-width (styles 1015–1034) — which on a narrow screen balloons into the "huge ugly box" the owner describes, and it relies on `:focus`/`:hover` which is finicky on touch. **Recommendation (best-practice):** on coarse pointers, replace the hover-bubble with a tap-triggered, compact **popover** anchored to the "i", max-width ~28rem, with a small caret, a subtle backdrop scrim, and tap-outside/Esc to dismiss — i.e. a real disclosure, not a CSS hover tooltip. Keep the desktop hover bubble. This is a JS+CSS change to the `.ampy-calc__tip` interaction. **Acceptance:** tapping "i" on mobile opens a tidy, readable popover (not a full-width slab), dismissable by tapping elsewhere; desktop hover is unchanged.

### P2-4 — De-"blaffigt" the mobile view (owner pt 14) — my pixel findings
The mobile screenshots read oversized in several spots; concrete reductions (container-query scoped, ≤600px):
- **Hero unit gap.** `.ampy-calc__hero15-value { gap: 1.2rem }` (styles 888) is large between "13 520" and "kr/år" on mobile — drop to `0.6rem` ≤600px so the unit hugs the number.
- **Section eyebrows.** "DIN MÅNADSKOSTNAD – PUBLIKT VS HEMMA" and "HUR BESPARINGEN RÄKNAS" wrap to two lines on mobile (screenshots 4, 8) and feel heavy. Consider `letter-spacing: 0.04em` (from 0.06) and allow them to sit on one line where possible; the monthly-panel label could shorten to `Din månadskostnad: publikt vs hemma`.
- **Monthly-col value size.** `--fs-lg` (up to 2.8rem) for "≈ 1 721 kr/mån" is large with three bars stacking after P0-5 — verify it doesn't dominate the hero; consider `--fs-md` for the secondary home/optimised values, keeping the public (orange, anchor) at `--fs-lg`.
- **Card padding.** ≤600px the surface card keeps `--spacing-xl` (2rem) padding (only the *input* card drops to `--spacing-lg`, styles 1067–1069). Add the surface card to that rule so the dark card also tightens to `--spacing-lg` on mobile — recovers ~16px horizontal on each side where the bars/numbers feel cramped against the edge.
**Acceptance:** on a 390px phone the hero, panel labels, and card gutters read tighter and more premium; no element feels oversized relative to the hero; nothing clips.

### P2-5 — Additional CRO/pixel findings beyond the 14 (owner pt 15)
- **First-impression order after P0-3/P0-4.** With the ROI toggle and Spann line gone, the result card opens hero-first. Verify the staggered reveal delays (styles 978–983) still feel right with the removed `.ampy-calc__roi-control` (its 20 ms slot frees up); re-time so the hero reveals first (~20 ms) and the monthly panel (now 3 bars) lands by ~180 ms.
- **Default % = 100 maximises the headline honestly.** Defaults are 20 000 km, 100 % public, DC, SE3 → 13 520 kr/år (engine/data confirm). 100 % public is the most aggressive (largest) honest headline and the sub-line "om du flyttar all din publika laddning hem" qualifies it. Keep. (At pct 0 the empty-state copy could warm up to `Dra upp andelen publik laddning så ser du vad du kan spara.` per r3-copy §4.)
- **CTA arrow + form auto-open.** Clicking "Få en exakt offert" opens the form inline and scrolls to it (engine 964–974) — good, no page change, momentum preserved. Verify on mobile the scroll lands the Name field above the keyboard, not under it.
- **"Att betala" asterisk.** The `*` (index 223) now resolves to the reconciled footnote (P1-2) — confirm the asterisk and footnote both render after the copy change so the superscript isn't an orphan.
- **Consent link placeholder.** `href="/integritetspolicy"` (index 343) is a known placeholder — must point at the live policy before go-live (GDPR Article 13). Flagging as a go-live blocker for the lead form specifically.
- **Selector dropdown on mobile.** The 16-box list caps at `min(50rem, 60vh)` and scrolls (styles 249) — good; verify the bestseller-tagged boxes (Zaptec Go, Easee) sit near the top of the scroll so the badges are seen without scrolling.

---

## Priority summary (lead/CRO lens)

| # | Item | Owner pt | Pri | Lead impact |
|---|------|---------|-----|-------------|
| P0-1 | Remove micro-trust line; 2 CTAs only | 8a | P0 | Cuts noise at decision point |
| P0-2 | Remove form placeholders | 8b | P0 | Fixes "looks pre-filled" leak |
| P0-3 | Remove ROI toggle (default med investering) | 4 | P0 | Removes worst-placed friction |
| P0-4 | Drop "Spann" line; keep dynamic sub | 5 | P0 | Stops self-discounting the hero |
| P0-5 | Scheduled-charging 3rd bar | 2 | P0 | Second green number; sells the box |
| P0-6 | Delete "× 3,60 kr/kWh" explainer row | 7 | P0 | Kills the "contradictory price" doubt |
| P0-7 | Fix "Läs mer om X" underline | 8c | P0 | Secondary CTA looks intentional |
| P0-8 | Rewrite/remove "Antal sökande" | 3 | P0 | Removes zero-payoff input |
| P1-1 | Box descriptions + disciplined tags | 10 | P1 | Sells the box; badge signal kept |
| P1-2 | Methodology copy (verified) | 9 | P1 | Trust; removes "claim it?" objection |
| P1-3 | One price line | 6 | P1 | Clean value moment |
| P1-4 | Tooltips 1 & 2 tightened | 1 | P1 | Credibility of the number |
| P2-1..5 | Slider, ticks, mobile tooltip, "blaffigt", polish | 11–15 | P2 | Protects mobile (paid) conversion |
