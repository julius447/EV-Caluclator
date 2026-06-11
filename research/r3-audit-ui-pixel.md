# R3 — UI / Pixel-Craft Audit (Ampy Laddbox-kalkylator)

**Lens:** Owner point 15 — the 8→10 craft pass. Spacing, typographic scale, hierarchy,
component sizing, colour/contrast, vertical rhythm, the dark results card, the monthly
bars, badges/tags. Specific token/px/font deltas per region, **desktop + mobile**.

**Method:** read the live full-page screenshots (desktop @ ~1280 + mobile @ 344px CSS
width), then `index.html`, `styles.css`, `engine.js`, `data.js`, and the three Phase-1
research files (math, scheduled-charging, copy). Cross-referenced every recommendation
against the existing token system so nothing here invents a new primitive unnecessarily.

**Unit key (load-bearing):** `html{font-size:62.5%}` → **1rem = 10px**. Token spacing:
`xs 5 · sm 7.5 · md 10 · lg 15 · xl 20 · 2xl 30` (px). Type clamps are container-query
fluid (`100cqi`). When I say "bump `--fs-x`", I mean adjust the clamp tuple in
`styles.css` lines 91–98.

This audit assumes the other agents land points 1–14 (copy, math-row removal, scheduled
3rd bar, slider physics, ROI-toggle removal, tooltip redesign). My job is everything
**around** those: making the result read like a designed object, not an assembled one.

---

## 0. The one-paragraph diagnosis

The tool is structurally sound and the dark results card is genuinely good. What keeps it
at 8/10 is **rhythm and proportion, not bugs**: (1) the dark card crams six different
type sizes into one column with inconsistent vertical gaps, so the eye has no clear
staircase; (2) mobile is *oversized* ("blaffigt") because the same desktop type-ramp and
`--spacing-xl` paddings fire on a 344px screen — the H1, the eyebrows, the card padding
and the hero number are all one notch too big for the viewport; (3) the inputs card and
results card don't share a visual weight system (left card is airy, right card is dense);
(4) badges/tags are under-designed (hollow pill, single colour, no semantic differentiation
between "Bästsäljare" and "Offert"); (5) the monthly bars — the emotional core — are thin,
short, and visually quieter than the breakdown table directly below them. Fix proportion
and the same content jumps to 10.

---

## P0 — Highest impact (do these first)

### P0-1 · Mobile type ramp is one notch too big everywhere ("blaffigt", points 12/14)

**Problem.** On the 344px capture, the H1 wraps to **two lines and dominates a third of
the first screen**; eyebrows ("DIN ELBIL OCH LADDBOX", "DU SPARAR PER ÅR") are heavy;
the hero "≈ 13 520" plus unit nearly hits both edges. The fluid clamps were tuned for the
*container*, but at the 320–375px floor they sit at the top of their lower bound and still
read large because the column is narrow. This is the single biggest driver of the
oversized feel.

**Recommendation — tighten the small end of four clamps + the H1.** These only affect
narrow containers (the `100cqi` interpolation leaves desktop untouched):

| Token | Current min | New min | Effect |
|-------|------------:|--------:|--------|
| `--fs-2xl` (H1) | `2.2rem` | **`2.0rem`** | H1 from ~22→20px floor; still wraps 2 lines but lighter |
| `--fs-4xl` (hero value) | `4rem` | **`3.4rem`** | "13 520" stops crowding the card edges on 344px |
| `--fs-xl` (hero unit, value-prominent) | `2rem` | **`1.8rem`** | "kr/år" unit + km/% values calmer |
| `--fs-lg` (monthly/trio/delta values) | `1.8rem` | **`1.7rem`** | secondary numbers stop competing with the hero |

Additionally, **drop the H1 letter-spacing on mobile** — `--t-2xl` uses `-0.015em`, which
at a 2-line wrap makes "ladda hemma?" feel tight. Add to the `max-width:768px` container
block: `.ampy-calc__t-2xl{letter-spacing:-0.01em;}`.

**Acceptance.** On a 360px viewport the H1 occupies ≤ 2 lines and ≤ ~120px tall; the hero
value + "kr/år" sits with ≥ `--spacing-md` (10px) clear space to the card's right padding.

---

### P0-2 · Mobile card padding & header gaps are oversized

**Problem.** `.ampy-calc__card` keeps `--spacing-xl` (20px) padding down to the 600px
breakpoint, where it drops to `--spacing-lg` (15px). But on a 344px screen even 15px on
both sides eats ~9% of width per side, and the dark card's internal `--spacing-lg` panels
(monthly block padding) stack to a tall, loose column. The header→card gap is `--spacing-2xl`
(30px) via `.ampy-calc__container` until 768px where it becomes `--spacing-xl` (20px).

**Recommendation.**
- Add a sub-400px step: `@container ampy (max-width: 400px){ .ampy-calc__card{ padding: var(--spacing-md); } }` (15→10px). Reclaims ~10px of usable width per side.
- The dark **monthly panel** padding `--spacing-lg` → `--spacing-md` under 600px (it's an inner card inside an already-padded card; 15px nested in 15px reads as a fat double-frame).
- Header→main gap: already 20px under 768px — good. But the **eyebrow→H1 gap** (`--spacing-xs` = 5px) is fine; leave it.
- Tighten the dark card's internal vertical gap on mobile: `.ampy-calc__card--surface` uses the base card `gap: var(--spacing-lg)` (15px) between every block. Under 600px set `gap: var(--spacing-md)` so the six result blocks form a tighter, more deliberate stack.

**Acceptance.** On 360px, left/right dead space per side ≤ ~12px; no nested element shows
two concentric paddings > 12px each.

---

### P0-3 · The dark results card has no clear type staircase (hierarchy, point 15 core)

**Problem.** Reading top-to-bottom on the dark card, the sizes go: ROI label (`--fs-sm`
14px) → eyebrow (`--fs-sm`) → **hero 40–75px** → hero-sub (`--fs-sm`) → range (`--fs-xs`)
→ trio labels (`--fs-xs`) → trio values (`--fs-lg` ~18–28px) → monthly label (`--fs-sm`)
→ monthly values (`--fs-lg`) → breakdown rows (`--fs-xs`/`--fs-sm`). The **trio values and
the monthly values are the same size (`--fs-lg`)**, so "Sparar på 10 år 135 200" and
"Hemma efter installation 595" read as equal-rank, even though the 10-year number is a
much bigger claim. And the monthly panel — the most persuasive comparison — uses the same
`--fs-lg` as the trio it sits beside, so nothing signals "this is the proof".

**Recommendation — establish three explicit ranks on the dark card:**

1. **Rank 1 (hero):** annual saving — keep `--fs-4xl`. Untouchable.
2. **Rank 2 (the 10-year cumulative):** bump `ampy-calc__trio-value` for the *cumulative
   tile only* to `--fs-xl` (was `--fs-lg`). The 10-year figure is the second-biggest
   emotional number and currently hides at trio size. Give the cumulative tile its own
   class modifier `--trio-value--hero2` rather than enlarging both tiles (Att betala stays
   `--fs-lg`).
3. **Rank 3 (monthly comparison values + delta):** keep `--fs-lg` but make the **delta
   ("Du sparar ≈ 1 127 kr/mån") visually win** within the panel — it currently equals the
   per-column values. Bump the delta value to `--fs-xl` and keep column values at `--fs-lg`.
   The delta is the payoff line of that panel and should be its largest number.

This creates a clean descending staircase: 4xl hero → xl (10-year + monthly delta) → lg
(column/secondary values) → sm/xs (labels). Right now it's 4xl → lg → lg → lg, which is
why the lower two-thirds of the card reads flat.

**Acceptance.** Squint test: on the dark card you can identify exactly four type tiers,
and the 10-year number + monthly "Du sparar" are visibly larger than the per-column
monthly figures.

---

### P0-4 · Badges/tags are under-designed and semantically flat (point 10 visual half)

**Problem.** Every badge uses one style: `.ampy-calc__badge` — a hollow teal-outlined
pill. After point 10, seven different tags exist (`Bästsäljare`, `Rekommenderas`,
`Prisvärd`, `Dubbel laddning`, `Offert`, `Företag/BRF`, `Populär`). They will all look
identical, so "Bästsäljare" (a commercial push) and "Offert" (a flow signal) carry the
same weight. The hollow outline is also low-contrast on the light card and the selected
button shows the badge to the right of the chevron area where it competes with the
dropdown arrow. In the selector list the badge sits flush-right with no breathing room.

**Recommendation — a 3-tier badge system, same pill geometry, different fills:**

| Tier | Tags | Style |
|------|------|-------|
| **Promote** (filled) | Bästsäljare, Rekommenderas | Solid `--action-primary` bg, white text. The strongest visual — these are the boxes Ampy wants chosen. |
| **Attribute** (soft) | Prisvärd, Dubbel laddning, Populär | Soft fill: `rgba(0,125,107,0.10)` bg, `--action-primary` text, no border. Reads as a helpful descriptor, not a hard push. |
| **Flow / neutral** (outline) | Offert, Företag/BRF | Keep the current hollow style but in `--text-secondary` (the existing `--badge--muted`), since these signal "different path", not "buy this". |

Spec: add `--badge--promote` (solid) and `--badge--soft` modifiers; map them in
`renderSelector` from a `badgeTier` field (or infer from a small lookup of tag→tier).
Pill metrics: bump padding to `0.3rem 0.7rem` (from `0.15rem 0.5rem`), `font-size`
keep `--fs-xs`, `font-weight 600`, `letter-spacing 0.02em`. In the **selected button**,
give the badge `margin-left:auto` so it right-aligns *before* the chevron with a
`--spacing-sm` gap; in the **list option** add `margin-left:auto; margin-right:var(--spacing-xs)`
so it never kisses the edge.

**Acceptance.** The two "push" tags are solid teal; descriptor tags are soft; flow tags
are muted outline — three visually distinct weights. No badge touches a chevron or a card
edge; ≥ 6px gap on both sides.

---

### P0-5 · Monthly bars (the emotional core) are too quiet vs the table below them

**Problem.** The "Din månadskostnad – publikt vs hemma" bars are the single most
persuasive object — a long orange bar vs a short green one. But they are only **0.6rem
(6px) tall**, sit *under* their number rather than visually paired with it, and the
**breakdown table immediately below them (5,50 / 1,90 / 3,60 in bold mono) is louder**
than the bars because the mono numbers are right-aligned, bold, and colour-coded. The
proof chart loses to a rate table. After point 2 adds a **third bar** (schemalagd), this
panel becomes even more important and must be the visual climax of the card's lower half.

**Recommendation.**
- **Thicken the bars** from `0.6rem` → `1.0rem` (10px) and increase the track→fill
  contrast: track `--on-surface-subtle-bg` is nearly invisible on the dark card; add
  `box-shadow: inset 0 0 0 1px var(--on-surface-border)` is already there — keep it but
  raise the empty-track tint to `rgba(255,255,255,0.08)`.
- **Round the bar caps fully** (already `--radius-full`) — good; with 10px height they'll
  read as proper capsule bars.
- Add a hair of **gap between the two/three bars** so each cost+bar pair is a unit:
  `.ampy-calc__monthly-cols` gap `--spacing-md` → `--spacing-lg` (10→15px) so public,
  home, and (new) schemalagd each get clear separation.
- The **third (schemalagd) bar** per the research: lighter/dashed green. Spec a
  `repeating-linear-gradient(90deg, var(--state-success) 0 6px, rgba(57,194,129,0.45) 6px 12px)`
  fill or simpler `--state-success` at 0.6 opacity, so "optimised" reads as a softer,
  bonus layer beneath the solid home bar — visually subordinate to the hero claim
  (honesty, per the scheduled-charging research §6.5).
- **Demote the breakdown table** so it stops out-shouting the bars: the rate rows can drop
  to `--fs-xs` for the labels (already) and the values from `--fs-sm` bold to `--fs-sm`
  weight 600 — but more importantly, move the whole "Hur besparingen räknas" block into a
  collapsed `<details>` (or at minimum give it less contrast: rows on
  `--on-surface-subtle-bg` already; reduce the value colour saturation). The bars should
  be the hero of the lower card; the rate table is supporting evidence.

**Acceptance.** On both breakpoints the monthly bars are the most eye-catching element
below the hero; the rate breakdown reads as secondary; the three bars (after point 2)
form a clean tall→short→shorter descending visual that tells the saving story at a glance.

---

## P1 — Strong craft wins

### P1-1 · Inputs card vs results card share no weight system

**Problem.** The light inputs card is airy (big selector tiles, generous slider rows)
while the dark results card is dense. Side by side at desktop the 5fr/7fr split is fine,
but the inputs card's **two large selector buttons (`5.6rem` images, `--spacing-md`
padding)** make the top of the left column feel heavier than the "Dina körvanor" section
below it, and the `--spacing-lg` (15px) gap inside `--tier--primary` vs `--spacing-md`
(10px) in `--tier--modifiers` makes the two halves feel like different densities.

**Recommendation.**
- Unify selector image size: `5.6rem` (56px) is slightly large for the row; **drop to
  `4.8rem` (48px)** (the list-option images are already 4.8rem — this also makes the
  selected button match its own dropdown). Reduces top-heaviness.
- Make the two tiers share one internal gap: set `--tier--primary` gap to `--spacing-md`
  to match modifiers, and instead rely on the existing `--tier + --tier` border+padding
  for separation. Consistent rhythm top-to-bottom.
- The **tier-label** ("DIN ELBIL OCH LADDBOX") has `margin-bottom: calc(-1 * --spacing-xs)`
  — a negative pull that makes it sit oddly close to the first field's tiny label. Remove
  the negative margin; let the `--spacing-md` tier gap do the spacing. Cleaner.

**Acceptance.** Scrolling the inputs card, every field-to-field gap is visually equal; the
selected selector image equals its dropdown option image (48px).

---

### P1-2 · Slider tick row spacing & the "only endpoints visible" mobile bug (point 12)

**Problem.** Point 12: on mobile only the two outer km ticks show. The CSS at
`max-width:390px` deliberately sets interior non-endpoint, non-active ticks to
`color:transparent` — so by design only `5k`, `50k`, and the active tick are visible. That
is the *cause* of "only the two outermost show": when the active value is itself an
endpoint (default 20k snaps to a visible tick, but 50k/5k extremes), the middle collapses
entirely. The intent (legibility) is right; the execution drops too much.

**Recommendation — show a clean *subset*, not just endpoints.** For the 8-step km slider,
keep a labelled subset that's evenly spaced and always legible: **5k · 15k · 25k · 40k ·
50k** (or 5/20/35/50). Implement by tagging those indices `data-tick-major` in
`renderRangeSlider` and, in the `max-width:390px` rule, hide only
`:not([data-tick-major]):not(--active):not([data-endpoint])`. This guarantees ~5 evenly
spaced legible labels + the active one, instead of 2.
- Also raise the kept labels' size: the rule already bumps endpoints/active to `0.9rem`;
  extend that to `data-tick-major`.
- **Tick→track vertical gap:** `--spacing-xs` (5px) `margin-top` on `.ampy-calc__slider-ticks`
  is tight given the 4.4rem slider height; the ticks read as crowding the thumb. Bump to
  `--spacing-sm` (7.5px).

**Acceptance.** On a 360px screen the km slider shows ≥ 4 evenly spaced legible labels plus
the active value; no label is clipped or transparent-collapsed into a gap.

---

### P1-3 · The hero range line is being removed (point 5) — reclaim the space deliberately

**Problem.** Point 5 removes "Spann 12 168–14 872 kr/år" and keeps the dynamic sub. Today
the hero block is: eyebrow → value → sub → range. Removing the range leaves the hero-sub
(`--fs-sm`, muted) as the last line, then a `--spacing-lg` gap to the trio. Without the
range the hero will feel slightly unmoored / bottom-light.

**Recommendation.**
- After removing the range `<span>`, **tighten the hero internal gap** from `--spacing-xs`
  to keep value↔sub paired, and **increase the hero→trio gap** to `--spacing-lg` so the
  hero reads as one complete unit with clear separation from the tiles.
- Give the hero-sub a touch more presence now that it's the hero's closing line: it's the
  owner-loved "om du flyttar all din publika laddning hem" — keep `--fs-sm` but lift colour
  from `--on-surface-text-muted` to `--on-surface-text` so the honest framing isn't faint.

**Acceptance.** Hero block reads value + one supporting line as a tight pair; clear gap to
the trio; the dynamic sub is legible, not greyed-out.

---

### P1-4 · Trio tiles: alignment, divider rhythm, and the lonely "Att betala" after ROI removal (point 4)

**Problem.** Point 4 strongly considers **removing the ROI toggle** and always including
the investment. If removed, the "Med/Utan investering" segmented control disappears and
the trio may collapse from 2 tiles to a stable pair (10-year + Att betala) — good. But two
issues remain: (a) the trio uses `repeat(auto-fit, minmax(0,1fr))` so with 2 tiles they
split 50/50, leaving the longer "Sparar på 10 år 135 200 kr" cramped against "Att betala";
(b) the `--internal-divider` immediately above and below the monthly panel creates three
hairlines in close succession (after trio, before monthly is via the panel's own bg, after
monthly before CTA) — busy.

**Recommendation.**
- If ROI toggle is removed (recommended by copy + this audit — it only affects 1 box and
  the target user has none), **delete `.ampy-calc__roi-control` entirely** and reclaim its
  vertical space + the reveal-stagger slot. The card starts cleaner with the eyebrow.
- Trio: give the 10-year tile more room — `grid-template-columns: 1.2fr 1fr` at ≥560px so
  the larger number breathes; stack to 1-col below 560 (already does).
- Reduce divider count: the monthly panel already has its own `--on-surface-subtle-bg`
  background, so the `<hr>` *before* it is redundant. Remove the `--internal-divider`
  between trio and monthly; let the panel's bg do the separation. Keep the one before the
  CTA stack.

**Acceptance.** Two trio tiles read comfortably (no number kissing a neighbour); at most
one hairline divider between hero region and CTA; no empty space where the ROI control was.

---

### P1-5 · CTA region: micro-trust removal, two-CTA layout, continuous underline (point 8)

**Problem.** Point 8 removes the three-item micro-trust row, the input placeholders, and
fixes the "Läs mer om X" two-segment underline. Today:
- The micro-trust `<p>` is centered with `gap: var(--spacing-md) var(--spacing-xl)` and
  wraps to 2 lines on mobile (visible in capture: "Svar inom 24 h / Inget köpkrav" then
  "Dina uppgifter skyddas" centered alone — awkward orphan). Removing it (point 8a) is
  correct and also cleans this orphan.
- The "Läs mer om <span>Box</span>" link: the `<span id=...Name>` is a separate inline box,
  so `text-decoration:underline` on hover underlines "Läs mer om" and the span separately
  → the two-segment break the owner flagged. Cause confirmed in `index.html` 365–367.

**Recommendation.**
- Remove the `.ampy-calc__micro-trust` block (point 8a). Reclaim its negative top margin
  hack (`margin: calc(-1*--spacing-xs) 0 ...`) — that hack exists only to pull it under the
  CTA; gone with the block.
- **Two CTAs, clear hierarchy:** primary "Få en exakt offert" (filled, lg) and the
  "Läs mer om X" as the secondary. Currently the secondary is a faint
  `--on-surface-text-muted` link at the very bottom. Promote it to a proper **ghost/outline
  button on the dark surface** (`--on-surface-subtle-bg` bg, `--on-surface-border-strong`
  border, white text) so the two CTAs read as a deliberate primary/secondary pair, not a
  button + an afterthought link. Keep it `--btn--block` for full-width symmetry with the
  primary, or center it — but give it button affordance.
- **Continuous underline fix:** the link's hover underline must span both text nodes as one.
  Set the `<a>` to `text-decoration: underline; text-decoration-color: transparent` and on
  hover `text-decoration-color: currentColor` — and crucially ensure the inner `<span>` does
  **not** establish its own decoration (set `.ampy-calc__btn-link span{ text-decoration: inherit; }`).
  If promoting to a button, the underline issue disappears (buttons don't underline) — that's
  the cleanest fix.
- **Lead-form intro spacing:** the intro line "Vår laddbox-expert hör av sig…" sits flush
  to the "Namn" label with only the form-grid gap; give the intro `margin-bottom:
  var(--spacing-xs)` so it reads as a sentence above the form, not a crammed label.

**Acceptance.** Exactly two CTA affordances (one filled, one bordered); the "Läs mer" hover
underline is one continuous line; no orphaned trust line; phone/zip inputs are empty (no
placeholder) per point 8b.

---

### P1-6 · Tooltip "i" on mobile creates a huge ugly box (point 13)

**Problem.** Point 13. On touch, `.ampy-calc__tip:hover/focus::after` renders a CSS bubble.
On mobile the bubble is `width: 100%; max-width: 100%` (the 768px rule) and on coarse
pointers `width: max-content; max-width: 24rem`. With long tip text (the current
Elprisområde tip is ~30 words) this produces the "huge ugly box" — a full-width dark slab
that covers the control. Also, tap-to-focus shows it but there's no dismiss affordance and
it can clip.

**Recommendation (pairs with copy point 1/2 shortening the text).**
- After copy shortens every tip to ≤ ~12 words, cap the bubble at a **comfortable readable
  width regardless of pointer**: `max-width: 28rem; width: max-content` on all breakpoints;
  remove the `width:100%` mobile rule (it's the slab cause). `font-size --fs-xs`, `line-height 1.45`,
  `padding: var(--spacing-sm) var(--spacing-md)`.
- Add a subtle **caret/arrow** so the bubble points at its "i" (a `::before` triangle), which
  reads as a designed tooltip rather than a floating slab.
- On touch, make it a **tap-to-open, tap-anywhere-to-dismiss popover** (engine already
  focus-toggles on click; add a one-line outside-tap/Escape close, reusing the selector's
  existing outside-click handler pattern). Give the open state a soft entrance
  (`opacity`+`translateY(2px)` over `--motion-fast`).
- Raise the resting "i" contrast slightly: the hollow `--text-secondary` circle on the light
  card is faint; keep size but use `--border-default` → a touch darker so the affordance is
  discoverable.

**Acceptance.** On mobile, tapping any "i" shows a compact bubble ≤ 28rem wide with a caret,
not a full-width slab; tapping elsewhere dismisses it; it never covers the control it
describes.

---

## P2 — Polish (the last 5%)

### P2-1 · Colour/contrast token cleanup on the dark card
The card defines `--chart-stream-*` and `--chart-line-*` tokens (lines 61–69) that the
monthly-bar redesign no longer uses (the old payback chart is gone). Dead tokens — leave
for now but note for cleanup; the **active** semantic colours are `--state-warning`
(public/orange) and `--state-success` (home/green), which is a clear, correct mapping. One
refinement: the public-bar gradient `linear-gradient(90deg, --state-warning, rgba(240,175,56,0.7))`
fades to translucent at the right end on the dark bg — the bar tip looks unfinished. Use a
solid-to-slightly-darker amber instead so the long bar has a crisp end cap.

### P2-2 · Mono font for labels is slightly over-applied
`--font-mono` (JetBrains) is used for values (correct — tabular numbers prevent jitter
during count-up) AND for the slider tick labels and the breakdown rate values. The tick
labels in mono ("5k", "50k") look slightly techy; consider body font for ticks, keep mono
strictly for live/animating numbers. Minor.

### P2-3 · Eyebrow letter-spacing & weight
Eyebrows ("DU SPARAR PER ÅR", tier labels) use `letter-spacing: 0.06–0.08em` uppercase at
`--fs-sm/xs`. On the dark card the `0.06em` hero eyebrow is good; the tier labels at
`0.08em` + `--fs-sm` on the *light* card read a hair wide/loud relative to the field
labels. Drop tier-label tracking to `0.06em` for a calmer caps style. Minor.

### P2-4 · Segmented controls (SE1–SE4 / AC-DC) vertical alignment
The region segmented control and the AC/DC toggle have different heights (segmented option
`--spacing-sm var(--spacing-xs)` padding vs toggle `0.6rem var(--spacing-md)`), so the two
"chips" rows in the inputs card don't share a baseline rhythm. Normalise both to a shared
`min-height` (44px touch floor already enforced under coarse pointers — extend a `4rem`
min-height to pointer-fine too) so the control column has even row heights.

### P2-5 · Focus-ring colour uses the *old* teal
Several focus shadows use `rgba(0,169,145,0.x)` (the pre-darkened teal) while the action
colour is now `rgb(0,125,107)`. Visually fine, but for token hygiene the focus rings should
reference the current `--action-primary`. Cosmetic; flag for the consistency pass.

### P2-6 · Reveal-stagger timing after blocks are removed
The staggered reveal (lines 968–984) animates roi-control→hero→trio→monthly→evidence→cta.
If the ROI control is removed (P1-4) and the math row is removed (point 7), re-tune the
delays so the sequence stays evenly paced (e.g. 40/100/160/220/280) and the now-hero
monthly panel gets a slightly earlier, more prominent entrance. Small but it's the
difference between "animated" and "choreographed".

### P2-7 · Stepper (if "Antal sökande" kept, point 3)
Copy recommends removing it. If kept: the stepper `−/+` buttons are `3.6rem` and the value
`min-width:4rem` — fine, but it floats right of a long label and on mobile the row wraps.
Give the field-row a `min-width:0` label and `flex-wrap:nowrap` with the stepper pinned, or
just remove the control (preferred). If removed, also delete its reveal/space.

---

## Region-by-region summary table (where to touch)

| Region | Desktop change | Mobile change |
|--------|----------------|---------------|
| **H1 / header** | leave | `--fs-2xl` min 2.2→2.0rem; letter-spacing −0.01em |
| **Inputs card** | selector img 56→48px; unify tier gaps; drop tier-label neg-margin | card padding 15→10px <400px |
| **Sliders** | tick→track gap +2.5px | show 5-label subset (not just endpoints); kept labels 0.9rem |
| **Dark card frame** | leave 20px | block gap 15→10px; monthly panel pad 15→10px <600px |
| **Hero** | hero→trio gap →15px; sub colour →text (not muted); remove range (pt5) | hero value `--fs-4xl` min 4→3.4rem; unit `--fs-xl` min 2→1.8rem |
| **Trio** | 10-yr tile `--fs-xl`; 1.2fr/1fr split; remove ROI control (pt4) | stack (already) |
| **Monthly bars** | bars 6→10px; bar gap →15px; 3rd schemalagd bar (pt2); crisp amber end | same; bars stack |
| **Breakdown table** | demote contrast / consider `<details>`; remove math row (pt7) | same |
| **Badges** | 3-tier system (promote/soft/flow); padding 0.3/0.7rem; margin-left:auto | same |
| **CTA** | remove micro-trust (pt8a); promote "Läs mer" to bordered btn; continuous underline | fixes 2-line orphan |
| **Tooltip** | caret + cap 28rem | tap popover, no full-width slab (pt13) |

---

## Acceptance for the whole pass (10/10 bar)
1. Squint test on the dark card yields **four clean type tiers**, descending.
2. On a 360px viewport nothing feels oversized: H1 ≤ 2 lines, hero value clears the edge,
   card side-margins ≤ ~12px.
3. The **monthly bars are the visual climax** of the lower card; the rate table is clearly
   secondary; the third (schemalagd) bar reads as a soft bonus layer.
4. Badges carry **three distinguishable weights**; only "push" tags are solid teal.
5. Exactly **two CTAs** with one continuous underline; no orphaned trust line.
6. Tooltips are **compact captioned popovers**, never full-width slabs, on mobile + desktop.
7. Every field-to-field and block-to-block gap is on the token scale and visually even —
   no negative-margin hacks, no double paddings, no redundant dividers.
