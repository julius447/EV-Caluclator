# R3 — UX / Flow / Ergonomics Audit (Ampy Laddbox-kalkylator)

**Lens:** end-to-end flow, input ergonomics, defaults, result comprehension, the offert path, friction, decision-cognition. Owner points 3 & 4 owned here; all 15 addressed from the UX angle; plus net-new finds (point 15).
**Inputs read:** live screenshots (desktop + mobile, full-page), `prototype/index.html`, `engine.js`, `styles.css`, `data.js`, and the three phase-1 outputs (`r3-math-verification.md` = PASS, `r3-scheduled-charging.md` = third-bar spec, `r3-copy.md`). Tokens checked against the Ampy design system.

Format per item: **Problem → Recommendation → Concrete spec → Acceptance.** Priority tags: **P0** (blocks 10/10 / high-traffic credibility), **P1** (clear lift), **P2** (polish).

---

## A. THE TWO OWNER QUESTIONS I OWN

### Point 4 — REMOVE the ROI "Med/Utan investering" toggle. **VERDICT: REMOVE. P0.**

**Problem.** The toggle is the single most cognition-heavy control in the tool, and it sits *first* in the dark results card — the user's eye lands on a binary they cannot evaluate before they've even read the saving. Reasoning from the target user: this lead magnet is for someone who has **no box** and needs one installed. For them the box cost is **always** part of the decision — there is no real "utan investering" world. The toggle's only mechanical effect is (a) swap the 10-year tile between `cumulativeNetN` (133 510 net) and `cumulativeSavingsN` (135 200 gross) and (b) show/hide the "Att betala" tile. Those two states differ by exactly **one box price** — on the default Zaptec Go that is 4 490 kr out of a 130 000+ kr ten-year number, i.e. a **rounding-error-sized difference dressed up as a major decision.** It also quietly changes the 10-year *label* ("Sparar på 10 år" ↔ "Besparing på 10 år") and *sub* ("laddboxen betald…" ↔ "…oavsett vad laddboxen kostar"), which most users will never notice — pure hidden complexity. It is a developer's hedge, not a user's need.

**Recommendation.** Delete the control. Hard-pin `state.includeInvestment = true` (the honest, complete picture: box paid, Grön Teknik in, net 10-year shown, "Att betala" visible). Keep the engine's `includeInvestment` plumbing so nothing else breaks, but remove the UI and the toggle wiring. This removes a whole row of dark-card clutter above the hero and lets the hero saving be the first thing the eye hits — which is the entire point of a savings calculator.

**Concrete spec.**
- `index.html`: delete the entire `.ampy-calc__roi-control` block (lines ~178–192).
- `engine.js`: in `state`, keep `includeInvestment: true` but it's now constant. Delete `updateInvestmentToggle()` and its call in `renderAll()` (line ~899). Delete the `wireToggle("ampyEvInvestmentToggle", …)` binding (line ~948). In `renderSingleResult`, the `withInvest` branch can stay (it now always takes the `true` path) — no need to touch the math.
- `styles.css`: remove `.ampy-calc__roi-control`, `.ampy-calc__roi-control-label`, `.ampy-calc__toggle--investment` rules, and drop `.ampy-calc__roi-control` from the staggered-reveal selector list + its `animation-delay` (lines ~969–978).
- The "Att betala" tile is now **always** visible → the trio is permanently a clean 2-up (10-year + Att betala). Good: that's its strongest state.

**Acceptance.** No toggle renders in the dark card. The hero "Du sparar per år" is the first element after the card's top padding. Both the 10-year net (e.g. 130 710 kr) and "Att betala" (4 490 kr) always show. No console errors; the SR live region still announces only the headline. Offert-only boxes (Zaptec Pro) still show "Begär offert" in Att betala with no NaN.

---

### Point 3 — "Antal sökande" stepper. **VERDICT: REMOVE. P0.** (Copy agrees; UX makes the harder call.)

**Problem.** The control fails a simple ergonomics test: **does changing it ever change the headline for a real user?** No. One home laddbox (4 190–14 550 kr gross) is far under the 50 000 kr/år/sökande Grön Teknik cap, so going 1→2 applicants moves *nothing* on screen for any single-box install — the cap never binds. So we are asking a paid-traffic visitor to parse a tax-law concept ("sökande"), read a tooltip, and make a decision that has zero effect on their number. That is the textbook definition of **friction with no payoff**: every extra input measurably lowers completion, and this one buys us literally nothing. The current copy ("relevant om man köper flera boxar") is also slop that exposes the control's own irrelevance.

**Recommendation.** Remove the stepper from the UI. Keep `state.numTaxApplicants = 1` constant and keep the cap logic in the engine (it already caps correctly and will simply never bind for one box). This is the clean call and I'd push hard for it: the input column drops from 6 controls to 5, the last "Dina körvanor" field becomes Elprisområde (a real, number-moving choice), and the card ends on a strong note instead of a confusing tax field.

**Concrete spec.**
- `index.html`: delete the `Antal sökande` field block (lines ~144–158).
- `engine.js`: keep `numTaxApplicants: 1`. Delete `renderApplicants()` body's DOM writes guard or keep it harmless; remove the `renderApplicants()` call from `renderAll()` and the two stepper click bindings (lines ~951–956). `numTaxApplicants: 1` still flows into `buildPayload.inputs` for the server — keep that.
- Methodology item 4 keeps the "(upp till 2 sökande)" wording — that's fine as a *capability disclosure*, it just no longer needs a live control.

**Acceptance.** No stepper renders. The Grön Teknik math is unchanged for a single box. Payload still carries `numTaxApplicants: 1`. No reference errors from the removed `ampyEvApplicants*` IDs.

> If the owner overrules and keeps it: ship the copy team's non-slop tooltip ("Antal personer i hushållet som delar på Grön Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer taket om ni installerar flera.") and **move it out of the primary flow** into the "Så har vi räknat" disclosure or an "avancerat" sub-section, so it never taxes the first-time decision.

---

## B. THE PUNCH-LIST (UX-relevant points)

### Point 1 — "Andel offentlig laddning" tooltip. **P1.**
**Problem.** Self-contradictory two-sentence tip conflates "share you charge publicly today" with "share you move home."
**Spec.** Replace `data-tip` (index.html line 106) with the copy team's single sentence: `Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.`
**Acceptance.** One sentence, no "100 % betyder…" clause.

### Point 2 — Elprisområde tooltip + SCHEDULED CHARGING third bar. **P0** (third bar) / **P1** (tooltip).
**Problem.** Tooltip too long; tool never models smart/scheduled charging — a core EV benefit and a more exact home price.
**Spec.**
- Tooltip → `Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.`
- Implement the scheduled-charging research's **Option (a): a third bar** "Hemma, schemalagd (optimerad)" in `.ampy-calc__monthly`, fed by new per-zone `homeRateOptimizedSekPerKwh` (SE1 1.30 / SE2 1.35 / SE3 1.60 / SE4 1.80). Headline hero stays on the conservative flat rate; the third bar is additive upside. Full data/math/copy/MFL spec is in `r3-scheduled-charging.md` §6 — adopt verbatim.
- **UX guardrail (mine):** the third bar must be visually subordinate to the second (lighter/dashed green fill, smaller or same label) so it reads as "and even better" not "a different product." Add **one** quiet sub-line or "i" on the panel, not a paragraph. Do **not** add a fourth toggle (research rejected option b).
**Acceptance.** Three stacked bars; widths ∝ cost; `(publik − schemalagd) × 12` reconciles to `annualSavingOpt`; hero number unchanged; one-line honest note present; no new toggle.

### Point 5 — Hero sub-lines. **P1.**
**Problem.** Two stacked grey lines under the big number ("om du flyttar all din publika laddning hem" + "Spann 12 168–14 872 kr/år") = text-on-text, dilutes the hero.
**Spec.** Keep the dynamic `#ampyEvHeroAnnualSub`. **Delete** `#ampyEvAnnualRange` (the "Spann …" line) — remove the span from `index.html` (line 204) and the two writes in `engine.js` (the `Spann …` assignment ~line 770 and the unavailable-state reset ~line 754). The ±10 % spann is still disclosed in methodology item 5, so honesty is intact. Also drop `.ampy-calc__hero15-range` CSS or leave it unused.
**Acceptance.** Exactly one sub-line under the hero. The Spann text appears nowhere in the result card. Methodology still documents the ±10 % band.

### Point 6 — Price sub-line. **P1.**
**Problem.** "Att betala" sub reads `Pris inkl. installation & moms 8 980 kr − Grön Teknik 4 490 kr` — a busy subtraction that re-states numbers the user didn't ask for.
**Spec.** Replace the priced-box sub (engine.js line 804) with the single label: `Pris inkl. installation, Grön Teknik & moms`. Footnote (`index.html` line 390) → copy team's reconciled `* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.`
**Acceptance.** One line, no inline arithmetic, footnote matches.

### Point 7 — Breakdown explainer row. **P0** (confusion) — math verified PASS.
**Problem.** The `3 756 kWh × 3,60 kr/kWh = 13 520` line reads as a third contradictory price next to 5,50/1,90 (3,60 is actually the per-kWh *saving*). Math is correct (see `r3-math-verification.md`), the row is just confusing.
**Spec.** In `renderSavingsBreakdown` (engine.js ~lines 734–738) **delete the trailing explainer `<p>`**. Keep the three card rows (public rate, home rate, bold "Du sparar per kWh").
**Acceptance.** Breakdown card shows exactly 3 rows; no `kWh × kr/kWh = kr/år` paragraph beneath it.

### Point 8 — CTA block. **P1.**
**8a — Micro-trust + two CTAs.** Owner wants the `Svar inom 24 h / Inget köpkrav / Dina uppgifter skyddas` row **removed**, leaving exactly two CTAs: the primary offert button + "Läs mer om X". (Note: copy team's r3-copy.md argued to *keep* the micro-trust; the **owner overrides** — remove it. Flagging the disagreement, executing the owner's call.) Delete the `.ampy-calc__micro-trust` `<p>` (index.html lines 288–292). The trust content (24 h, inget köpkrav) is preserved inside the form intro + success copy, so it's not lost.
**8b — Placeholders.** Remove `placeholder="07X XXX XX XX"` (line 311) and `placeholder="12345"` (line 316). The visible `<label>`s already name the fields; placeholders inside empty inputs add visual noise and (for the phone) a fake-data look. Keep `inputmode="numeric"` on zip.
**8c — Underline break.** "Läs mer om <span>X</span>" underlines as two segments on hover because the link is `display:inline-flex` with a separate child span and a trailing SVG, so the underline can't span the gap.
**Spec (8c).** On `.ampy-calc__btn-link` hover, don't rely on `text-decoration`. Either (i) wrap "Läs mer om {name}" in a single text node and apply a `border-bottom`/`box-shadow` underline to one inline element, or (ii) set the link `display:inline` for the text and move the arrow SVG to a `::after` with `text-decoration:none`. Cleanest: keep flex layout but give **only the text** a continuous underline via a child `<span class="ampy-calc__btn-link-label">Läs mer om {name}</span>` that wraps *both* words, and put `text-decoration:underline` on that label on hover (SVG outside it, no underline). Ensure the dynamic box name sits inside the same underlined label.
**Acceptance.** Hover shows ONE continuous underline under "Läs mer om Zaptec Go" (arrow not underlined). No micro-trust row. No placeholders in Telefon/Postnummer. Form labels still present (a11y intact).

### Point 9 — "Så har vi räknat" methodology. **P1** — math verified.
**Problem.** Copy is engine-generated and serviceable but not optimised.
**Spec.** Replace the five `{h,c,p}` items in `populateMethodology()` (engine.js ~lines 868–884) with the copy team's word-by-word rewrite (r3-copy.md §2), and the two disclaimer `<p>`s (index.html lines 384–390) with the rewritten disclaimer + footnote. **Add** the scheduled-charging methodology bullet from r3-scheduled-charging.md §6.3 (one new item) so the third bar is auditable. Math lines are all verified PASS — no formula edits.
**Acceptance.** Methodology reads as the rewritten copy; every code-line still matches the engine; a scheduled-charging row is present.

### Point 10 — Laddbox descriptions + tags. **P1.**
**Spec.** Apply the 16-box description/badge table from r3-copy.md §3 to `data.js` (and the Excel mirror). Owner-mandated tags exactly: Zaptec Go = Bästsäljare, Zaptec Go 2 = Rekommenderas, Easee Charge Up = Bästsäljare, NexBlue Edge 2 = Prisvärd, Charge Amps Aura = Dubbel laddning; remove Amina S "Rekommenderas"; keep Zaptec Pro = Offert, Garo Entity Pro = Företag/BRF. **Blocking data flag:** confirm Charge Amps Aura real spec (data says "11 kW · stativ"; product page says wall, dual 22 kW) before shipping its copy/tag.
**Acceptance.** Selector list shows the new descriptions; exactly 7 of 16 carry a badge; Amina S has none.

### Point 11 — Slider drag perfection. **P1** (already strong; tighten).
**Problem.** Owner reports lag. The current engine is actually well-built (rAF-coalesced pointermove, `.is-dragging` kills transitions, residual-transform split on release — see engine.js ~540–639). The remaining risks: (a) `touch-action: pan-y` on `.ampy-calc__slider` (styles.css line 272) lets the browser claim horizontal-ish gestures for scroll before `pointermove` fires, which *feels* like lag/stutter on iOS; (b) on iOS Safari, `pointercapture` + page scroll can drop the first frames.
**Spec.** Set `touch-action: none` on `.ampy-calc__slider` (the thumb hit area is already ≥44px; vertical page scroll elsewhere is unaffected because the slider is a small target). Confirm `pointerdown` calls `e.preventDefault()` is **not** needed (capture handles it) but verify no passive-listener warning. Keep the rAF path. Confirm `-webkit-user-select:none` (present via `user-select:none`). Test on a real iOS device: thumb must sit exactly under the finger with zero perceived trail.
**Acceptance.** On iOS Safari, iPadOS, Android Chrome and desktop: dragging the thumb tracks the finger/cursor 1:1 with no trailing; releasing snaps smoothly to the nearest step; vertical page scroll started *outside* the slider still works.

### Point 12 — Mobile slider ticks visibility. **P1.**
**Problem.** On the km slider ≤390px, the CSS collapses all interior tick labels to `color:transparent`, leaving only the two endpoints (`5k`, `50k`) + the active tick (styles.css lines 1050–1058). The screenshots confirm only 5k/50k (and the active 20k) show — the owner's exact complaint. Result: the user can't see 10k/15k/25k/30k/40k as targets.
**Recommendation.** Don't hide labels — **thin the tick set** to a legible subset that's evenly spaced, so every shown label is real and tappable. The 8-step km scale [5,10,15,20,25,30,40,50] is too dense for ~320–390px. Show a clean subset (e.g. 5 / 15 / 25 / 50 — or 5 / 20 / 35 / 50) as labelled ticks, keep all 8 as *snap stops* for the drag, and render the unlabelled stops as small tick marks (not invisible). Always also show the **active** value's label.
**Spec.** Replace the `color:transparent` rule (lines 1050–1058) with: on ≤390px, render interior non-shown ticks as a 2px dot/line (visible affordance, no text), show labels only on a curated subset + the active tick, and keep the live value display above the slider as the source of truth. Alternatively, reduce `KM_STEPS` granularity is **not** advised (loses precision); keep 8 stops, thin only the *labels*.
**Acceptance.** On a 360px viewport the km slider shows ≥4 legible, evenly-spaced labels plus the active value; all 8 stops remain draggable/snappable; no label is rendered as invisible-but-present text (so screen width is honestly used).

### Point 13 — Mobile tooltip "i" interaction. **P0.**
**Problem.** On mobile, tapping "i" relies on `:focus` to show a CSS `::after` bubble that, in the narrow container, is forced to `width:100%` and re-anchored (styles.css lines 1004–1034) — producing the "huge ugly box" the owner describes, with no close affordance, no arrow, and it can cover the control it explains. It's a desktop hover pattern bolted onto touch.
**Recommendation.** Replace the pure-CSS hover tooltip with a **tap-to-toggle popover** that is best-practice on both: on desktop it shows on hover/focus (keep), on touch it toggles on tap, is dismissed by tapping elsewhere/Esc, has a small arrow, a sane max-width (~26rem, not 100%), and never exceeds ~3 lines for the (now shortened) copy. Since all tooltip copy is being shortened (points 1, 2, 3), the bubble shrinks naturally.
**Spec.**
- Keep the `data-tip` content model, but drive visibility with a JS-toggled class (`.is-open`) on tap (the engine already has a tip click handler at lines 959–961 — extend it to toggle `.is-open` and close others, instead of just `.focus()`).
- CSS: bubble `max-width: 26rem` on all sizes (kill the `width:100%` narrow override at line 1016); add a small caret via `::before`; position above the icon, flipping below if it would clip the card top. Add `tabindex`/`aria-expanded` and `Esc`/outside-tap close (mirror the selector close logic).
- Touch target stays ≥44px (already handled).
**Acceptance.** On mobile, tapping "i" opens a compact (~≤26rem, ≤3-line) popover with a caret; tapping elsewhere or the "i" again closes it; it never spans the full card width or covers its own control; desktop hover/focus unchanged; keyboard Esc closes it.

### Point 14 — Mobile "blaffigt" (oversized/clunky). **P0** (this is the primary device).
**Problem.** Several elements are sized for desktop and read as oversized on a phone (confirmed in mobile screenshots):
1. **Selector tiles** — `.ampy-calc__selector-img--lg` is 5.6rem (56px) with `--spacing-md` padding; the car/charger rows eat a huge vertical chunk before the user reaches any control.
2. **Hero number** uses `--fs-4xl` (clamp up to 7.5rem) — on the dark card at phone width it's enormous and the unit/sub crowd it.
3. **Section labels** ("DIN ELBIL OCH LADDBOX", "DINA KÖRVANOR") are uppercase `--fs-sm` with heavy letter-spacing — fine, but the `--spacing-lg`/`xl` gaps between every field make the input card very tall (the whole first viewport is just the two selectors).
4. **Card padding** drops to `--spacing-lg` (24px) only ≤600px; on a 360px phone that's still chunky on both sides.
**Spec (mobile-first tightening, container queries only — no viewport media for layout):**
- `@container ampy (max-width: 480px)`: `.ampy-calc__selector-img--lg { width: 4.4rem; height: 4.4rem; }` and `.ampy-calc__selector-button--prominent { padding: var(--spacing-sm) var(--spacing-md); }` — recover ~30px per selector.
- Hero: cap the phone size — the hero value is `--fs-4xl`; add `@container ampy (max-width: 480px) { .ampy-calc__hero15-value { font-size: var(--fs-3xl); } }` so it's bold but not screen-dominating; keep `--fs-4xl` ≥480px. (clamp scale preserved — we step *down one token*, not invent a size.)
- Tighten vertical rhythm on phones: `@container ampy (max-width: 480px) { .ampy-calc__tier--primary { gap: var(--spacing-md); } .ampy-calc__field--prominent { gap: var(--spacing-xs); } }`.
- Reduce card padding one step earlier/further: `@container ampy (max-width: 420px) { .ampy-calc__card { padding: var(--spacing-md); } }`.
- Dark-card monthly panel: it currently uses `--spacing-lg` padding; on phones reduce to `--spacing-md` so three bars don't push the CTA far down.
**Acceptance.** On a 360–390px viewport: the first screen shows the H1 + both selectors *and* the start of "Dina körvanor" (not just two giant selectors). The hero number fits on one line with its unit and one sub-line, no wrap. No element looks oversized relative to the dark card width. All sizes still come from the clamp token scale (no static px sizes introduced beyond token-stepping).

---

## C. NET-NEW FINDS (point 15 — pixel/word/interaction, beyond the 14)

### C1 — Design-system violation: nested cards. **P1.**
**Problem.** The DS rule "no nested cards" is broken: `.ampy-calc__card--surface` (a card) contains `.ampy-calc__monthly` and `.ampy-calc__lead-form`, both of which have their own background + border + radius (mini-cards). Visually it reads as cards-in-a-card.
**Spec.** Keep the panels but make them read as *sections*, not cards: drop their 1px borders, use only the subtle bg + radius (or a hairline `--on-surface-border` top rule) so they're grouping, not nested cards. This also reduces the "boxy" mobile feel (point 14).
**Acceptance.** No element inside the surface card has the full card treatment (bg + border + shadow); panels read as grouped sections.

### C2 — Hero hierarchy: the saving competes with the (now-removed) toggle and the trio. **P1.**
**Problem.** With the ROI toggle gone (point 4), the hero becomes the true top of the card — capitalise on it. Currently the eyebrow "DU SPARAR PER ÅR" is `--fs-sm` and the hero `--fs-4xl`; the jump is good, but the trio tiles directly under it (`--fs-lg`) are visually loud and pull focus.
**Spec.** Add a touch more breathing room: `gap: var(--spacing-lg)` between hero and trio; make trio labels `--fs-xs` (already) but ensure the trio values don't exceed `--fs-lg`. Keep the monthly panel as the *evidence* below. The reading order should be: big saving → two supporting numbers → monthly proof → breakdown → CTA. Verify that order top-to-bottom.
**Acceptance.** Clear single focal point (the annual saving); supporting numbers visibly secondary; no two elements fight for "biggest."

### C3 — The "≈" prefix on every number. **P2.**
**Problem.** "≈ 13 520", "≈ 1 721", "≈ 595", "≈ 1 127", "≈ 4 303" — the approx sign on *every* figure is visual noise and slightly undersells precision on the hero. It's defensible (these are estimates) but five "≈" in one card is a lot.
**Spec.** Keep "≈" on the hero only (sets the "estimate" frame once); drop it from the monthly bars and delta where the "Din månadskostnad" framing + methodology already signal estimation. Low-risk, declutters. (Owner judgement call — flag, don't force.)
**Acceptance.** ≤2 "≈" symbols visible in the result card.

### C4 — Empty / zero-public state is a dead end. **P1.**
**Problem.** At `publicChargingPct = 0` the hero sub becomes "Höj andelen offentlig laddning för att se din besparing." but the big number still animates toward 0 kr/år and the monthly bars collapse — a confusing "0 kr" hero. For a paid-traffic tool, a 0-state should never be reachable as a *default*, and when reached should guide, not show a defeating zero.
**Spec.** Default is 100 % (good — keep). When pct hits 0, suppress the "≈ 0 kr/år" hero and instead show a single prompt state (grey the number or show "—") with the copy team's warmer line: `Dra upp andelen publik laddning så ser du vad du kan spara.` Engine already branches on `pubPct <= 0` for the sub — extend it to also blank the hero value rather than show 0.
**Acceptance.** At 0 % public the hero shows a prompt, not "≈ 0 kr/år"; raising the slider restores the number with the count-up.

### C5 — Selector dropdown: no search, 16 items, no keyboard arrow-nav. **P2.**
**Problem.** The charger list is 16 items in a `max-height: min(50rem,60vh)` scroller. It opens/closes and items are clickable, but there's no type-ahead and (from the code) no ArrowUp/Down roving focus inside the listbox — only Tab. For 16 boxes that's a long tab-walk for keyboard users and a lot of scrolling on mobile.
**Spec.** P2 (not blocking): add roving `ArrowUp/Down/Home/End/Enter` keyboard handling to the listbox (mirror the slider's keydown pattern), and keep the selected item scrolled into view on open. Type-ahead (first-letter jump) is a nice-to-have. Mobile: ensure the open list scrolls within itself (already `overscroll-behavior:contain`).
**Acceptance.** Keyboard users can arrow through the list and Enter to select; the active item is in view on open.

### C6 — Lead form lives *below* the breakdown; the offert path is long on mobile. **P1.**
**Problem.** On mobile the order is: inputs → hero → trio → monthly (soon 3 bars) → breakdown → **CTA** → micro-trust → form → product link → methodology. The full-page mobile capture is ~3383px tall; the primary conversion action sits deep. The CTA button does scroll the form into view on click (good), but the *form itself* is far down.
**Spec.** Keep the primary CTA where it is (right after the value story — correct). Ensure tapping "Få en exakt offert" reveals the form and `scrollIntoView({block:'start'})` lands the **Namn** field near the top of the viewport (currently `block:'nearest'` can leave it half-off). With micro-trust removed (8a) the form is one row closer. Consider a slim sticky "Få offert" affordance is **out of scope/over-engineering** for now — don't add. Just fix the scroll target.
**Acceptance.** Tapping the CTA on mobile reveals the form and scrolls so the Namn label/field is fully visible near the top; the user can complete name→zip without hunting.

### C7 — `100 %` value display uses mono with a space before "%". **P2.**
**Problem.** The percent and km value displays render as e.g. "100 %" / "20 000 km/år" with the unit in a lighter span — fine — but the `%` slider only has 5 steps [0,25,50,75,100] and the default 100 % sits the thumb hard against the right end, visually "maxed." That subtly implies the user is already at the top with nowhere to go, which is correct but undersold.
**Spec.** P2 cosmetic: no change required; if desired, label the 100 % end tick more prominently since it's the default. Leave the value formatting as-is (it's consistent with the design).
**Acceptance.** n/a (informational).

### C8 — Focus order & the removed controls. **P1 (regression guard).**
**Problem.** Removing the ROI toggle and applicants stepper (points 3, 4) changes tab order and removes `aria-labelledby` targets. Stale `id` references (`ampyEvApplicantsLabel`, `ampyEvInvestmentToggleLabel`) must not be left dangling in `aria-describedby`/`labelledby` anywhere.
**Spec.** After removal, grep for `ampyEvApplicants`, `ampyEvInvestmentToggle`, `roi-control` across html/js/css and delete all references. Re-verify tab order: car → charger → km slider → % slider → AC/DC → region → (hero is non-interactive) → primary CTA → form fields → consent → submit → product link → methodology summary.
**Acceptance.** No dangling IDs; clean tab order; no console a11y warnings.

---

## D. PRIORITISED EXECUTION ORDER

**P0 (do first):**
- Point 4 — remove ROI toggle.
- Point 3 — remove Antal sökande.
- Point 2 — scheduled-charging third bar (the single biggest *value* add).
- Point 7 — delete confusing breakdown explainer row.
- Point 13 — mobile tooltip popover redesign.
- Point 14 — mobile de-blaffigt (sizing/rhythm).

**P1:**
- Points 1, 2-tooltip, 5, 6, 8 (all), 9, 10, 11, 12 — copy + CTA + slider ticks + methodology + box copy.
- C1 nested cards, C2 hero hierarchy, C4 zero-state, C6 offert scroll, C8 regression guard.

**P2:**
- C3 "≈" declutter, C5 listbox keyboard nav, C7 informational.

---

## E. ACCEPTANCE — TOOL-LEVEL (10/10 gate)
1. First mobile screen (360–390px) shows H1 + both selectors + the start of "Dina körvanor"; nothing looks oversized.
2. Results card top-to-bottom: hero saving (one focal point) → 2 supporting tiles → 3-bar monthly proof → 3-row breakdown → primary CTA → form → "Läs mer om X".
3. No ROI toggle; no Antal sökande; no "Spann …" line; no breakdown explainer paragraph; no micro-trust row; no input placeholders.
4. Tooltips: one short sentence each; mobile tap opens a compact caret popover, dismissible.
5. Slider: 1:1 finger tracking on iOS, smooth snap, ≥4 legible km tick labels on a phone.
6. "Läs mer om {box}" hover = one continuous underline.
7. Scheduled-charging third bar present, reconciles, hero unchanged, honest one-line note + methodology row.
8. No dangling IDs / console errors; all tokens from the DS scale (no raw hex/px).
