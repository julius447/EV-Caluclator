# R3 — QA / Red-team / Adversarial Audit (Ampy Laddbox-kalkylator)

**Role:** ruthless QA, red-team, feedback. Lens: challenge everything, re-verify the math, hunt contradictions, honesty/legal risk (marknadsföringslagen/MFL, konsumentverket), edge/offert/empty states, and any remaining "8/10 smell."
**Inputs read:** live screenshots (desktop + mobile), `prototype/{index.html,engine.js,styles.css,data.js}`, and Phase-1 outputs `r3-math-verification.md`, `r3-scheduled-charging.md`, `r3-copy.md`.
**Method:** read source line-by-line; independently re-derived the full math chain in Python (not trusting the math agent); inspected every container-query breakpoint and the slider drag path.

Priorities: **P0 = blocks 10/10 / honesty-legal / breaks on real input. P1 = visibly hurts conversion or polish. P2 = finesse.**

---

## A. INDEPENDENT MATH RE-VERIFICATION (owner point 7 + beyond)

I re-derived everything from scratch rather than trusting `r3-math-verification.md`. **It checks out**, with two caveats the others under-weighted.

| Quantity (Model Y, SE3, DC, 100 %, 20 000 km) | My derivation | Engine/screenshot | Verdict |
|---|---|---|---|
| publicKwh | 3 755.56 → "3 756" | 3 756 | PASS |
| annual saving | 3 755.56 × 3,60 = 13 520,00 | 13 520 | PASS |
| AC variant | × 2,60 = 9 764,44 | 9 764 | PASS |
| monthly pub/home/save | 1 721 / 595 / 1 127, ×12 = 13 520 exact | matches | PASS (exact reconciliation) |
| 50 000 km case | 9 388.89 kWh, 33 800 kr/år | 33 800 (mobile shot) | PASS |

**Point 7 verdict — CONFIRMED.** The "× 3,60 kr/kWh" in the explainer is the **per-kWh saving (public − home)**, NOT a price. It is the same number as the bold "Du sparar per kWh = 3,60" row directly above it, restated inside a multiplication where it reads as a third, contradictory price. **No math error, no double-count, no hidden lower span.** Delete the row (it is `renderSavingsBreakdown`'s trailing `<p>`, engine.js ~L734–738). **[P0 — do delete; it is the literal thing the owner flagged and it is genuinely confusing.]**

**Red-team caveat 7a (cosmetic but real):** the deleted row was also slightly *wrong* as printed: `3 756 × 3,60 = 13 521,6`, but it prints `13 520` (engine multiplies the *unrounded* 3 755.56). A sharp user multiplying the on-screen numbers gets a different answer than the on-screen result. One more reason to delete, not "fix," the row.

### A2. NEW honesty contradiction the other agents missed — Grön Teknik "48,5 %" vs the on-screen 50 % — **[P0, honesty/MFL]**
Every one of the **15 priced boxes has `grossPriceSek = exactly 2 × priceSek`** (verified all 15). So the deduction the UI prints — `gross − net` — is **exactly 50,0 % of the gross price, every single time** (e.g. Zaptec Go: 8 980 − 4 490 = 4 490 = 50 %). But:
- the **footnote** says "Grön Teknik-avdrag (ca 48,5% av priset)" (index.html L390), and
- **methodology item 4** says "48,5% av totalpriset … kalkylen drar 48,5%" (engine.js L879–880).

So the calculator **claims 48,5 % while visibly applying 50 %.** This is an internal contradiction any diligent user (or Konsumentverket) can catch by dividing the two displayed numbers, and it undermines the credibility of the whole "Så har vi räknat" section — the one place whose entire job is to be trustworthy. The real Grön Teknik schablon *is* ~48,5 % (50 % × 97 %), so the **data is wrong, not the copy**: gross prices look like placeholder "net × 2" values, not real ordinarie priser.
**Spec:**
1. **Treat as a data/sign-off blocker.** Real gross (ordinarie) prices must replace the `net × 2` placeholders so that `(gross − net) / gross ≈ 0,485`, OR
2. If the business genuinely gives a 50 % effective deduction, change *all* copy (footnote + methodology) to say 50 %, not 48,5 %.
Either way **the number shown and the number described must match.** Flag to the Excel sign-off owner. (`r3-math-verification.md` noted "net is exactly half of gross … a data artifact" but did **not** connect it to the 48,5 % copy claim — that link is the actual risk.)
**Acceptance:** `(gross − net)/gross` for every box equals the percentage stated in the footnote and methodology, to within rounding.

### A3. Headline honesty under MFL — **[P1, verify-and-hold]**
The hero defaults to **100 % public** which *maximises* the headline ("13 520 kr/år … om du flyttar all din publika laddning hem"). This is defensible because (a) the sub-line states the 100 % assumption honestly, and (b) the target user genuinely has no home box. **Keep**, but two guardrails:
- The disclosure must say the figure assumes today's public charging moves home (it does, via the hero sub). Good.
- Do **not** also bake scheduled-charging savings into the headline (the scheduled-charging agent agrees: third bar only, hero stays on the conservative flat rate). **Hold that line** — folding both 100 %-public *and* optimised-scheduling into one number would be a stacked best-case that fails MFL §10.

---

## B. THE 15 OWNER POINTS — adversarial pass (where I disagree or add)

Most points are well-handled by the copy/scheduled agents. I only record where I **disagree, add risk, or tighten the spec.**

**P1 (Andel-offentlig tooltip)** — agree with copy agent's one-liner. **Add:** the *control itself* is still subtly mislabeled. "Andel offentlig laddning = 100 %" reads as "I charge 100 % publicly," which for someone who already charges at home a bit is false. The new tooltip fixes meaning; ensure the **default stays 100 %** only because the persona has no box. [P1]

**P4 (ROI toggle — remove?)** — **I agree: REMOVE it. [P1]** Red-team reasoning the brief hints at: the toggle's "Utan investering" state shows a 10-year number that *ignores the box price entirely* ("oavsett vad laddboxen kostar") — for a lead-gen tool whose whole premise is "buy a box," presenting a number that pretends the box is free is mildly dishonest and definitely confusing. The target user must buy a box, so "Med investering" is the only honest framing. Removing it deletes a toggle, a tooltip, a state branch, and the awkward "Begär offert"/null-payback divergence for offert boxes. **Net simplification + honesty win.** If kept, the toggle must never be the default-off state.
- **Edge note if removed:** `renderSingleResult` currently keys the "Sparar på 10 år" vs "Besparing på 10 år" label and the Att-betala tile visibility off `withInvest`. Hard-wire `includeInvestment = true`, delete the toggle DOM + `updateInvestmentToggle` + `wireToggle('ampyEvInvestmentToggle')`, and keep the "Med investering" code path. **Acceptance:** no dead `ampyEvInvestmentToggle` references; offert box still renders "Begär offert" cleanly.

**P5 (remove "Spann 12 168–14 872")** — agree. **But:** the ±10 % uncertainty band is a genuine honesty asset under MFL. Removing the *visible* span line is fine **only if** the methodology disclosure keeps the "± 10 %" item (it does, item 5). **Do not also delete the methodology span item.** [P1]

**P7** — see Section A. Delete the row. [P0]

**P8a (two CTAs only; remove micro-trust)** — **Disagree slightly / flag a conversion risk. [P1]** The brief says remove "Svar inom 24 h / Inget köpkrav / Dina uppgifter skyddas." The copy agent calls this row "excellent." Removing trust microcopy *directly under a form that asks for phone + postnummer + GDPR consent* can depress completion. **Recommendation:** comply with the owner (remove the 3-up checkrow), but **relocate** "Inget köpkrav · Svar inom en arbetsdag" into the form intro line (which already says "hör av sig … inom en arbetsdag") so the risk-reversal survives without the standalone strip. Acceptance: no standalone `.ampy-calc__micro-trust` block; risk-reversal still present in one quiet line.

**P8b (remove placeholders)** — agree, trivially correct: drop `placeholder="07X XXX XX XX"` (L311) and `placeholder="12345"` (L316). **Red-team add:** with placeholders gone, the **input height looks empty/tall on the dark surface**; ensure the label sits close and the field doesn't read as a big empty box (point 14 "blaffigt"). Consider `inputmode="tel"`/`"numeric"` retained for mobile keyboards (zip already has `inputmode="numeric"`; phone should keep `type="tel"`). [P1]

**P8c (two-segment underline on "Läs mer om X")** — **Confirmed root cause. [P1]** In `index.html` L365–367 the link is `Läs mer om <span id=...>laddboxen</span> <svg>`. The hover underline (`.ampy-calc a:hover { text-decoration: underline }`) underlines each inline box separately → the whitespace between "om" and the span, and the SVG, break the line into segments. **Fix:** put the whole label in one text node / wrap text (not the icon) in a single underline target, or set `text-decoration` on the anchor with the SVG `text-decoration: none` and use a flex gap that is not underlined. Cleanest: render the full string "Läs mer om Zaptec Go" as one `<span>` (underline target) + separate icon. Acceptance: one continuous underline across the entire phrase incl. the dynamic box name, icon not underlined.

**P9 (methodology verify)** — verified every line against the engine (see A + below). All formulas reconcile **except the 48,5 % claim (A2)**. The copy agent's rewrite is good; it must inherit the corrected percentage from A2. [P0 ties to A2]

**P10 (16 box descriptions/tags)** — copy agent delivered. **Red-team adds two data blockers:**
- **Charge Amps Aura (P0 data):** `data.js` says "11 kW · stativ"; copy agent's mandated tag is "Dubbel laddning / Två bilar samtidigt" based on the *product page* (22 kW dual). **These contradict.** Shipping "Två bilar samtidigt" on an "11 kW stativ" record is a false product claim (MFL). **Must confirm real spec before go-live.** Also note Aura's price (14 550 net) is 3× the others — if it's the single-outlet stativ, the tag is wrong; if dual-22kW, the data is wrong. [P0]
- **Amina S badge removal:** owner says remove "Rekommenderas" — currently hard-coded `"badge": "Rekommenderas"` in data.js L223. Confirm it's removed in data, not just visually. [P1]

**P11 (slider drag)** — see Section C (deep dive). The current rAF/`.is-dragging` approach is *correct in architecture* but has concrete bugs. [P1]

**P12 (mobile ticks not all visible)** — **Confirmed, by design, and it IS bad UX. [P1]** The CSS at `@container ampy (max-width: 390px)` sets all non-endpoint, non-active km ticks to `color: transparent` (L1050–1058). The mobile screenshot (344px body) shows only **5k, 20k(active), 50k** — exactly this rule firing. So on the most common phone widths the slider has **no intermediate reference points**, making it feel imprecise. See Section C for the fix (legible subset, not transparent).

**P13 (mobile "i" tap → huge ugly box)** — **Confirmed and worse than described. [P1]** On `max-width: 768px` the tooltip bubble becomes `width: 100%` (L1015–1020), so tapping any "i" throws a full-width banner over the layout. Worse: it's a **CSS `:hover`/`:focus` `::after`** — on touch there is no hover, and tapping only `.focus()`es the button (engine.js L959–961), so the bubble shows on focus but **never dismisses on tap-away** except by focusing elsewhere, and it has no close affordance. This is the single worst mobile interaction. See Section D for redesign spec.

**P14 ("blaffigt" mobile)** — see Section E (component-by-component). [P1]

**P15 (find more)** — Sections C–H below. [mixed]

---

## C. SLIDER — drag + ticks (points 11, 12) — deep dive

The drag engine (engine.js L540–639) is genuinely good (rAF coalescing, `.is-dragging` kills transitions, residual-transform trick on release). But:

1. **`pointermove` is bound to the slider element, not the document/captured target. [P1]** It relies on `setPointerCapture`. If capture fails (it's in a `try/catch` that swallows errors — L628), fast drags off the thumb stop tracking. **Spec:** also listen on `window` for `pointermove`/`pointerup` while dragging, or assert capture. Acceptance: dragging fast past the slider edge still tracks and snaps.

2. **`touch-action: pan-y` on `.ampy-calc__slider` (L272) is correct** (lets vertical scroll through, captures horizontal). Keep. But verify the **44px thumb `::before`** (L309–314) doesn't block page scroll when the user tries to scroll starting on the thumb — `pan-y` should allow it; test on iOS Safari specifically (the brief's "as if Apple built it" bar). [P1]

3. **Tick click vs drag conflict. [P2]** Ticks are `<button>`s with click handlers (L481); a drag that ends over a tick can fire a phantom click. Add a small drag-distance threshold before treating pointerup as a tick tap, or `preventDefault` on the tick if a drag occurred.

4. **Mobile ticks (point 12) — replace `transparent` with a legible subset. [P1]**
   - **Spec:** at ≤390px, instead of hiding interior km ticks, **render fewer ticks** (e.g. 5k / 20k / 35k / 50k, or 5k/15k/25k/50k) as *real, visible* labels, plus keep small tick marks (dots/notches) under the unlabeled steps so the scale still reads. Transparent text = invisible reference points = the exact complaint.
   - Acceptance: on a 360px-wide container, at least 4 evenly-spaced, legible km labels are visible; the active step is always legible; no label overlaps its neighbor.

5. **Slider height 4.4rem (44px) but the visible track is thin (0.6rem). [P2]** Good for touch; fine. Thumb 2.4rem with 3px border reads slightly heavy on mobile (point 14) — consider 2rem thumb on coarse pointers.

---

## D. MOBILE TOOLTIP REDESIGN (point 13) — spec

The current pattern (CSS `::after` bubble on `:hover/:focus`, full-width on mobile, no dismiss) is not acceptable for a touch-first tool.

**Recommended pattern — tap-to-toggle popover, anchored, dismissible:**
- Convert the "i" to a real toggle: `aria-expanded`, click toggles an *adjacent* small popover (not a full-width banner). Reuse the dark `--bg-surface` bubble but cap `max-width: 28rem` and **left/right-clamp to the container** (never `width:100%`).
- **Dismiss on:** tap-away (document listener), Escape, a small ✕, or tapping the "i" again. Today none of these exist on touch.
- **One open at a time:** opening one closes others (mirror `closeAllSelectors`).
- **Position:** above the field if room, else below; arrow/caret pointing at the "i". Avoid covering the control the tooltip describes.
- **a11y:** `role="tooltip"` or a labelled popover; `aria-describedby` from the trigger; focus stays on the trigger; SR reads the content.
- **Desktop:** keep hover-to-show but add the same click-to-pin behaviour (so it doesn't vanish when the mouse moves to read a long tip).
- Acceptance: on iOS Safari, tapping "i" shows a compact card that does **not** resize the layout, dismisses on tap-away/Escape/re-tap, and never clips off either edge at 320–430px.

---

## E. MOBILE "BLAFFIGT" — component-by-component (point 14) — what's oversized

Reasoning from the mobile PDFs (344px body):
1. **H1 `--fs-2xl` (up to 4.8rem) wraps to 3 lines and dominates the first screen. [P1]** On ≤480px cap H1 nearer 2.8–3.2rem so "Hur mycket sparar du på att ladda hemma?" is 2 lines, not 3, and the card is visible above the fold.
2. **Hero value `--fs-4xl` (up to 7.5rem). [P1]** "≈ 33 800 kr/år" already nudges the edge on mobile (screenshot). Cap the hero at ~5–5.6rem on ≤430px; keep it dominant but not edge-to-edge.
3. **Selector tiles: 5.6rem icon (`--lg`) + big padding. [P1]** The car/charger rows are tall; the icon block is heavier than the text. On mobile drop icon to ~4rem and tighten vertical padding — these are *secondary* to the result.
4. **Stepper buttons 3.6rem and toggle pills min 6.4rem wide. [P2]** Fine for touch; visually chunky stacked. Acceptable.
5. **`--spacing-2xl` (3rem) container gap between header and card on mobile. [P2]** The mobile override already drops the container gap to `--spacing-xl`; consider `--spacing-lg` between header and first card to lift content up.
6. **The dark result card's internal padding `--spacing-xl` (2rem) + big section gaps. [P2]** With three monthly bars coming (scheduled-charging), watch total height; tighten internal gaps on mobile.
7. **Field labels are `--fs-xs` uppercase tracked** — these read fine; not the problem. The problem is the **hero + H1 + selector icons**, in that order.

Acceptance: on a 360–390px container the hero, the H1, and at least the top of the input card are all visible within the first ~1.3 viewports; nothing touches the horizontal edges.

---

## F. EDGE / EMPTY / OFFERT STATES — red-team

1. **0 % public charging. [P1]** At pct 0: `publicKwh = 0` → annual saving 0, monthly 0/0/0, bars 0. Hero sub correctly switches to "Höj andelen offentlig laddning…". But the **monthly panel still renders "≈ 0 kr/mån" twice + "Du sparar ≈ 0 kr/mån"**, and the **breakdown card still shows the rate rows** (5,50 / 1,90 / 3,60) which now describe a saving of 0. Verify this doesn't read as broken. Recommend: at pct 0, show a single quiet "—" empty state in the monthly + breakdown, not a wall of zeros. Acceptance: pct 0 reads intentional, not bugged.

2. **Offert-only box (Zaptec Pro). [P1]** "Att betala" → "Begär offert", payback null, 10-year falls back to pure savings. Good. **But** with the ROI toggle present, switching "Med investering" on a no-price box shows a 10-year *savings* number labelled as if investment-counted unless the label branch fires — verify the label says "Besparing på 10 år" (pure) for offert boxes, which it does (engine.js L790). If P4 removes the toggle, re-verify offert path. Also: the product link uses `r.charger.slug`; Zaptec Pro slug is real. OK.

3. **"Annan elbil" + extreme km. [P2]** 50 000 km × generic 1,7 efficiency → 33 800 kr/år headline. Plausible but high; the ±10 % span and disclosure cover it. Fine.

4. **Form validation edge: postnummer regex `^\d{3}\s?\d{2}$` [P2]** accepts "123 45" and "12345" — good. Phone regex `^[0-9 +\-()]{7,}$` accepts "+46" formats — good. Honeypot + timing gate present. Solid. **One gap:** the consent checkbox error uses `outline` on a 2rem box — verify it's visible on the dark surface. [P2]

5. **Reduced motion. [P1]** Count-up + reveal animations honor `prefers-reduced-motion` (engine + CSS). The slider drag path doesn't animate during drag anyway. Good — keep when adding the third (scheduled) bar.

6. **Selector dropdown with 16 boxes. [P2]** `max-height: min(50rem, 60vh)` + scroll. On a short mobile screen the open list covers the whole card; ensure it scrolls within itself (it does, `overscroll-behavior: contain`). Fine.

---

## G. THINGS THE OTHER AGENTS MISSED / UNDER-SPECCED

1. **48,5 % vs 50 % data contradiction (A2). [P0]** — the headline red-team find.
2. **Aura 11 kW/stativ vs "Två bilar samtidigt" (P10). [P0]** — false-claim risk; copy agent flagged the mismatch but did not rank it as a go-live blocker. It is one.
3. **Hero/methodology will need a THIRD monthly bar (scheduled charging).** The scheduled-charging agent's Option (a) is correct; my add: **the third bar must NOT change the hero**, and at pct 0 / offert it must degrade with the others (it's rate-only, so it will). When implemented, re-check mobile height (Section E.6) — three stacked bars + delta is the tallest the panel gets.
4. **`html{font-size:62.5%}` is set globally (index.html L6) — outside `.ampy-calc`. [P1]** In a real WordPress/Bricks page this **changes the rem base for the whole page**, not just the calculator, and can shrink every other element's rem-based sizing on the host site. The calculator is `container-type` scoped but this one line is not. **Spec:** scope the rem base to the component (e.g. set base font-size on `.ampy-calc-outer`, or use a wrapper with its own `font-size`), or confirm with the WP integrator that 62.5 % is intentional site-wide. This is a real integration footgun.
5. **`.ampy-calc__header h2` is styled but the markup uses `<h1>` (index.html L25).** The CSS selector `.ampy-calc__header h2` (L155) never matches → the H1 max-width/color rule is dead. Harmless visually (the `__t-2xl` class carries the look) but it's a latent bug. [P2]
6. **Count-up on the monthly bars + hero fires on every input change**, including slider drag steps (which already call `renderAll` per step). During a fast drag this re-triggers 280ms count-ups repeatedly. It's debounced visually by `animateNumber`'s `from`-tracking but verify it doesn't stutter on low-end phones. [P2]
7. **Two CTAs requirement (P8a):** after removing the micro-trust row, the brief wants exactly "Få en exakt offert" + "Läs mer om X". Today there are effectively **three** action affordances in the stack: primary CTA, the lead-form submit ("Skicka offertförfrågan"), and the product link. The submit only appears after opening the form, so it's sequential, not parallel — acceptable. Just confirm the owner counts the in-form submit as part of CTA #1's flow, not a third CTA. [P2]
8. **Telephone field `autocomplete="tel"` + `type="tel"` good; but no `inputmode="tel"`.** Minor mobile keyboard nicety. [P2]

---

## H. THE 10/10 BAR — what MUST be true

1. **Every number shown reconciles to every other number shown, and to its own explanation.** The 48,5 %/50 % gap (A2) currently fails this. Fix data or copy. **[P0]**
2. **No on-screen product claim contradicts the product data** (Aura). **[P0]**
3. **The confusable pseudo-price explainer row is gone**, math unchanged. **[P0]**
4. **Mobile is first-class:** tooltip is a dismissible compact popover (not a full-width banner); the slider drags 1:1 on iOS and snaps cleanly; at least 4 legible km ticks; hero + H1 don't dominate the first screen or touch the edges. **[P1]**
5. **Honesty holds under MFL:** headline = conservative flat rate; scheduled-charging is an additive, labelled third bar, never folded into the hero; ±10 % span retained in methodology; "när elen är som billigast," never "alltid på natten." **[P1]**
6. **The ROI toggle is removed** (single honest "with investment" framing) OR provably never defaults to the box-free number. **[P1]**
7. **One continuous underline** on "Läs mer om {box}"; no placeholders; risk-reversal microcopy preserved in one quiet line. **[P1]**
8. **Empty/0 %/offert states read as intentional**, not broken (no wall of zeros, no NaN, no orphaned rate rows). **[P1]**
9. **The `62.5%` rem base does not leak onto the host page.** **[P1]**
10. **Pixel polish:** hero/H1/selector-icon sizing tuned down on mobile; consistent vertical rhythm; the third bar doesn't blow up panel height. **[P2]**

---

## PRIORITISED PUNCH-LIST

**P0 (blocks 10/10 / honesty-legal):**
- A2: Grön Teknik shows 50 % but copy says 48,5 % — fix gross prices in data (so gross−net ≈ 48,5 %) or change all copy to 50 %. Reconcile footnote + methodology + displayed value.
- P10/F: Charge Amps Aura spec contradiction ("11 kW stativ" data vs "Två bilar samtidigt/22 kW" claim) — confirm real spec before applying the mandated tag.
- P7: delete the confusable "× 3,60 kr/kWh = …" explainer row (math is correct; row is a pseudo-price and is itself rounding-inconsistent).

**P1 (conversion / polish / correctness):**
- P13/D: redesign mobile tooltip → compact, dismissible, edge-clamped popover (tap-away/Escape/re-tap close).
- P12/C4: replace transparent km ticks with a legible 4-label subset + notches.
- P11/C: harden drag (window-level move/up listeners; iOS test; tick-vs-drag threshold).
- P14/E: scale down H1, hero value, selector icons on ≤430px; keep content above the fold; no edge bleed.
- P4: remove the ROI "Med/Utan investering" toggle (assume investment included).
- P8a: remove the 3-up micro-trust strip but relocate "Inget köpkrav · svar inom en arbetsdag" into the form intro.
- P8b/P8c: remove input placeholders; fix the "Läs mer om {box}" underline to one continuous segment.
- G4: stop the `font-size:62.5%` rem base leaking to the host page (scope it).
- P5: remove the visible span line but KEEP the ±10 % methodology item.
- F1: 0 %-public state should read as intentional, not a wall of zeros.
- Scheduled charging: implement as a third bar only; hero unchanged; degrade with empty/offert; re-check mobile height.

**P2 (finesse):**
- G5: dead `.ampy-calc__header h2` selector (markup is `<h1>`).
- C3: phantom tick-click after drag.
- C5/E: thumb size + spacing trims on coarse pointers.
- G6: count-up stutter check on low-end phones.
- F4: consent-error outline visibility on dark surface; add `inputmode` to phone.
- F6/G8: misc mobile keyboard + dropdown-on-short-screen checks.
