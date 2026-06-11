# R3 — Audit: Usability, Accessibility & Mobile Interaction

**Lens:** Owner points 11–14 (laggy slider, mobile tick visibility, "i" tooltip redesign,
overall mobile polish) + the cross-cutting share of point 15 (pixel/spacing/type) that
lands on the **primary platform: mobile**.
**Method:** read the four full-page PDFs (desktop + mobile), then `index.html`,
`styles.css`, `engine.js`, `data.js`, cross-referenced against the Phase-1 research
(`r3-math-verification.md`, `r3-scheduled-charging.md`, `r3-copy.md`).
**Root font:** `html{font-size:62.5%}` → **1rem = 10px**, so 4.4rem = 44px (the WCAG 2.5.5
target floor), 2.4rem = 24px, 1.2rem = 12px. All rem→px below use this.
**Container model:** every breakpoint is `@container ampy (...)`, not viewport. The mobile
PDFs render at **body 344 × 3383** (per the inspector chip in PDF #3), i.e. the calculator
container is ~344px wide — the reference width for all "mobile" specs here.

Priorities: **P0** = blocks "10/10" / breaks on the primary platform · **P1** = clearly
visible polish gap · **P2** = refinement.

---

## EXECUTIVE SUMMARY (highest-impact first)

1. **P0 — Slider lag is caused by `touch-action: pan-y`** (`styles.css` L272), not the
   paint path. The rAF/`is-dragging` architecture is already good; the gesture is being
   throttled/stolen by the browser's scroll-disambiguation. Fix: `touch-action: none`
   while dragging + `pan-y` at rest, and stop the page from scrolling mid-drag.
2. **P0 — Mobile tick labels: only endpoints + active show** (point 12). The `≤390px`
   rule blanks every interior km tick to `color:transparent`. Replace the "hide" strategy
   with a **legible 4-label subset** (5k · 20k · 35k · 50k) that never collides.
3. **P0 — Tooltip "i" is a 240px CSS bubble with no dismiss** (point 13). Redesign as a
   real tap-dismissible popover (mobile) / hover+focus popover (desktop), width-capped,
   edge-aware, Escape-to-close, one open at a time.
4. **P1 — Mobile is "blaffig" because the fluid type/spacing scales toward the desktop
   ceiling** (point 14): H1 ~30px wrapping to 2 lines, 56px selector thumbnails, hero
   number crowding the unit, oversized vertical rhythm. Tighten the sub-600px container
   step (type, thumbnails, card padding, gaps).
5. **P1 — "Läs mer om {box}" underline breaks into two segments** (point 8c) because the
   link is `inline-flex` with a `gap`; the hover underline can't cross the flex gaps. Make
   the label one inline text run with a single underline; keep the arrow outside it.
6. **P1 — Tap targets pass on paper but the slider thumb's real drag-start zone and the
   segmented region tabs are visually cramped on 344px**; verify ≥44px and add the missing
   `pointerdown` affordance so a track tap jumps crisply.
7. **P2 — Reduced-motion, focus-visible on the new popover, and the count-up still firing
   during fast drags** are smaller correctness items below.

Everything is WCAG 2.1 AA throughout; specifics are called out per item.

---

# POINT 11 — SLIDER DRAG MUST BE APPLE-SMOOTH (P0)

## Problem (root-caused from source, not guessed)

The drag engine in `renderRangeSlider` (`engine.js` L540–639) is already well-built:
pointer events, `setPointerCapture`, one `requestAnimationFrame` coalescing `pointermove`,
`.is-dragging` kills the fill/thumb CSS transitions (`styles.css` L301–304), and the thumb
tracks the raw pointer via a composited `translateX` residual off a snapped `left`. That is
the correct pattern. **So why does it feel laggy on iOS?**

**Root cause #1 — `touch-action: pan-y` on the slider (`styles.css` L272).**
`pan-y` tells the browser: "this element scrolls vertically; horizontal intent is
ambiguous." On touch, the browser then **delays the first `pointermove`s** until it has
disambiguated horizontal-drag vs vertical-scroll, and crucially it **keeps the vertical
pan alive** — so a slightly diagonal drag scrolls the page *and* the thumb stutters. On a
horizontal stepped slider this is exactly the wrong contract. The visible symptom is "the
thumb doesn't start moving until my finger has travelled a bit, then jumps" = perceived
lag. The paint code is fine; the **gesture contract** is wrong.

**Root cause #2 — no `preventDefault` / scroll-lock during the drag.** `pointerdown`
(L625) captures the pointer but never prevents the default touch behavior, and the body can
still scroll under the gesture. With pointer capture this is usually OK on desktop, but iOS
Safari can still rubber-band/scroll the page if the gesture is read as vertical, fighting
the slider.

**Root cause #3 — transition restored *and* a `left` change on release can double-animate.**
`endDrag` (L616) calls `updateVisual(current)` which writes both `thumb.style.left` (the
snapped %) and `thumb.style.transform` (clears the residual). The residual animates over
`--motion-fast` while `left` is already at the step — good — but the **fill** transitions
over `--motion-normal` (300ms, `styles.css` L287) while the thumb settles over 150ms. On a
fast flick the fill visibly lags the thumb by ~150ms. Minor, but it reads as "loose."

**Root cause #4 — `dragGeom` hard-codes the 12px inset** (`engine.js` L558–563: `r.width −
24`, `clientX − r.left − 12`). This assumes 1.2rem = 12px, which only holds while the host
page keeps `html{font-size:62.5%}`. If Ampy's live theme overrides root font-size (very
common in WordPress/Bricks), the geometry desyncs and the thumb sits off-finger — feels
broken, not just laggy. Robustness issue for go-live.

## Recommendation + concrete spec

**A. Fix the gesture contract (the actual lag fix).**
```css
/* styles.css — replace L272 */
.ampy-calc__slider { position: relative; height: 4.4rem; user-select: none;
  touch-action: pan-y; }                 /* at rest: let vertical page scroll pass through */
.ampy-calc__slider.is-dragging { touch-action: none; }  /* during drag: we own the gesture */
```
And in `engine.js` `pointerdown` (L625), once we've decided this is a horizontal drag,
prevent the default so the page can't scroll under it:
```js
slider.addEventListener("pointerdown", function (e) {
  if (e.button != null && e.button !== 0) return;   // ignore right/middle click
  dragging = true;
  slider.classList.add("is-dragging");
  try { slider.setPointerCapture(e.pointerId); } catch (err) {}
  lastClientX = e.clientX;
  e.preventDefault();          // stop iOS text-selection / scroll hijack
  queueDragFrame();
}, { passive: false });        // MUST be non-passive to allow preventDefault
```
> Net effect: at rest the slider doesn't trap vertical scrolling (page still scrolls if you
> swipe over it), but the instant a drag is recognised `touch-action:none` + `preventDefault`
> hand the gesture entirely to the slider — no disambiguation delay, no scroll fight. This is
> the single change that makes it feel "as if Apple built it."

**B. Make the fill and thumb settle on the same clock on release.** Either drop the fill's
release transition to `--motion-fast`, or (cleaner) give both a unified spring-ish ease:
```css
.ampy-calc__slider-fill  { transition: transform var(--motion-fast) var(--easing); }
.ampy-calc__slider-thumb { transition: left var(--motion-fast) var(--easing),
                                       box-shadow var(--motion-fast),
                                       transform var(--motion-fast) var(--easing); }
```
Keep the snap-highlight on the value readout (`ampy-snap-highlight`, already present) so the
"click into place" is felt, not just seen. 150ms is the Apple-ish snap duration; 300ms reads
as sluggish for a discrete slider.

**C. Robust geometry — read the real inset, don't hard-code 12/24.**
```js
function dragGeom(clientX) {
  var r = slider.getBoundingClientRect();
  var inset = parseFloat(getComputedStyle(thumb).width) / 2 || 12; // thumb half-width
  var travel = r.width - inset * 2;
  if (travel <= 0) return { travel: 0, x: 0, frac: 0 };
  var x = Math.max(0, Math.min(travel, clientX - r.left - inset));
  return { travel: travel, x: x, frac: x / travel };
}
```
(`pctToLeft/pctToFill` already use `1.2rem` in `calc()`, which is correct regardless of px,
so only the JS pixel path needs this.)

**D. Honor reduced motion in the drag-release.** When `prefersReducedMotion`, `endDrag`
should set value without the animated settle (the global reduced-motion rule already nukes
durations, but the count-up in `animateNumber` is separately guarded — confirm the slider's
`onChangeFn` → `renderAll` path doesn't animate distractingly on every step during a drag).

**E. Throttle the recalc, not just the paint.** `paintDrag` calls `opts.onChangeFn(s)` →
`renderAll()` → full `renderSingleResult()` + `renderMonthlyComparison()` on **every step
crossed** during a drag. On the km slider that's up to 8 full re-renders per drag, each
firing `animateNumber` count-ups. It's not the thumb lag, but it's wasteful and can cause
the result column to "machine-gun." Recommend: during `.is-dragging`, update the live value
readout every frame but **debounce the heavy `renderAll` to settle on release** (or run a
lightweight "numbers only, no count-up" update mid-drag and the full render on `endDrag`).

## Acceptance (point 11)
- [ ] On iOS Safari (real device or correct simulator), dragging the thumb tracks the finger
      **1:1 with no start-delay**; a diagonal drag does **not** scroll the page.
- [ ] At rest, a vertical swipe **over** the slider scrolls the page normally.
- [ ] Thumb + fill arrive at the snapped step **together** (≤160ms), no fill trailing.
- [ ] Tapping anywhere on the track jumps the thumb to that step (already works — keep).
- [ ] With the host root font-size overridden to 16px, the thumb still sits exactly under
      the finger (geometry test).
- [ ] `prefers-reduced-motion`: no animated settle, value updates instantly.
- [ ] Keyboard (←/→/Home/End) still steps correctly with visible focus ring.

---

# POINT 12 — MOBILE TICK STEPS NOT ALL VISIBLE (P0)

## Problem

`styles.css` L1050–1059 (`@container ampy (max-width:390px)`) sets **every interior km tick
that is neither an endpoint nor active** to `color: transparent`. So on a 344px phone the km
slider shows only `5k`, `50k`, and whichever step is active (screenshot #3/#4 confirm: "only
the two outermost show," plus the active `20k`). That's the documented bug. Root causes:

- The km slider has **8 steps** (`5,10,15,20,25,30,40,50k` — `engine.js` L54). Eight mono
  labels across 344px (minus 2×1.2rem padding ≈ 320px usable) = ~40px each; at `--fs-xs`
  (10–12px) they collide, so the previous author blanked them rather than overlap.
- `justify-content: space-between` + `overflow: hidden` (`styles.css` L319–323) means any
  overflow is clipped, not wrapped — so partial labels would shear.

## Recommendation + concrete spec

Don't hide labels — **show a clean, evenly-spaced subset** that always fits, and make the
**active** step's exact value unmistakable via the big readout above (already there:
`#ampyEvKmValue` shows e.g. "20 000"). Two clean options; I recommend **(1)**:

**(1) Render a 4-label subset on the km slider (keep 8 *steps*, show 4 *labels*).**
The thumb still snaps to all 8 steps; only the printed tick labels are thinned to a legible
set that's symmetric and collision-free: **5k · 20k · 35k · 50k** (or `5k · 20k · 35k · 50k`
chosen so gaps are even). Implementation: in `renderRangeSlider`, add a `tickLabelEvery` /
`visibleTickValues` option; ticks not in the visible set render as a short **dash/dot marker**
(a 2px tall tick mark) instead of a number, so the user still sees "there are more stops here"
without text collision. Endpoints always labelled.

```js
// engine.js renderRangeSlider — when building each tick:
var showLabel = !opts.visibleTickValues || opts.visibleTickValues.indexOf(step) !== -1
                || i === 0 || i === lastIdx;
t.textContent = showLabel ? shortLabel : "";
t.classList.toggle("ampy-calc__slider-tick--marker", !showLabel);  // dot/dash only
```
```js
// km slider init (engine.js ~L1206)
visibleTickValues: [5000, 20000, 35000, 50000],
```
```css
/* styles.css — a label-less tick becomes a small centered mark */
.ampy-calc__slider-tick--marker { color: transparent; min-width: 0; padding: 0; }
.ampy-calc__slider-tick--marker::after {
  content:""; display:block; width:2px; height:6px; margin:0 auto;
  background: var(--border-default); border-radius: 1px;
}
.ampy-calc__slider-tick--marker.ampy-calc__slider-tick--active::after { background: var(--action-primary); }
```
Then **delete** the `≤390px` "blank interior labels" hack (L1050–1059) — it's superseded.

**(2) (Simpler fallback) Always-4-labels everywhere.** If the marker dots feel busy, just
render labels for `[5k, 20k, 35k, 50k]` and nothing (not even a dot) for the others on all
widths. Cleaner, but loses the "there are intermediate stops" signal. Given paid traffic and
the desire for finesse, (1) is the stronger UX.

**The % slider (5 steps: 0/25/50/75/100) already fits** at 344px — leave it fully labelled.
Only the km slider needs thinning.

## Acceptance (point 12)
- [ ] At 320px and 344px container width, the km slider shows **4 legible labels** (5k, 20k,
      35k, 50k) with **no clipping, no overlap, no sheared glyphs**.
- [ ] All 8 km stops are still selectable by drag/keyboard; the active step's exact value is
      shown in the readout above and (if active) its tick label/mark is highlighted.
- [ ] The % slider remains fully labelled (0/25/50/75/100).
- [ ] Tick labels stay mono, baseline-aligned, vertically centered with the marks.

---

# POINT 13 — TOOLTIP REDESIGN (P0)

## Problem

The "i" tooltip is a **pure-CSS `::after` bubble** driven by `data-tip` and shown on
`:hover`/`:focus-visible` (`styles.css` L856–867). On mobile the click handler (`engine.js`
L959–961) just `tip.focus()`s the button to trigger `:focus-visible`. Issues:

- **Width:** `width: max-content; max-width: 26rem` (260px) desktop, `24rem` (240px) on the
  narrow-container coarse rule (L1031). On a 344px screen a 240px dark box with the long
  region/applicants copy is the "huge ugly box" the owner flagged.
- **No dismiss model on touch:** it shows on focus and only hides on blur. There's no tap-
  outside, no Escape, no close affordance, no "only one open." Tap the "i", scroll, and it
  can linger or get stranded.
- **Edge clipping:** the bubble is centered on the tip (`left:50%; translateX(-50%)`); near
  the right edge (e.g. the ROI "i" or region "i") it can overflow the container despite the
  narrow-screen re-anchor, because `max-content` ignores the tip's x-position.
- **Content is shrinking anyway (points 1, 2):** the copywriter is cutting the "Andel" and
  "Elprisområde" tooltips to one short sentence each, so the bubble should be **small** by
  design — the redesign should assume short content and look intentional.
- **Pointer:** `cursor: help` on a control that on touch behaves like a toggle is slightly
  off; fine on desktop.

## Recommendation: a real disclosure popover (best-practice, mobile + desktop)

Replace the `::after` data-tip with a **lightweight JS popover** that is the same component
on both platforms, with platform-appropriate triggers. This is the only way to get tap-
dismiss, Escape, edge-awareness, and one-open-at-a-time. Keep it tiny and on-brand.

**Markup pattern (per tip):**
```html
<button type="button" class="ampy-calc__tip" aria-label="Mer info"
        aria-expanded="false" aria-controls="tip-pop-andel">i</button>
<div class="ampy-calc__popover" id="tip-pop-andel" role="tooltip" hidden>
  Hur stor del av din laddning du gör publikt idag i stället för hemma. …
</div>
```
- `role="tooltip"` + `aria-controls`/`aria-expanded` on the button (the button stays the
  accessible owner; the field's `aria-labelledby` already excludes the tip from the
  control's name — keep that).
- **Desktop triggers:** open on `mouseenter`/`focus`, close on `mouseleave`/`blur`/Escape.
- **Touch triggers:** open on `click` (toggle), close on second tap, **tap-outside**,
  scroll, or Escape. **Only one popover open at a time** (close others on open).
- **No `cursor:help`** on coarse pointers.

**Visual spec (intentionally small):**
```css
.ampy-calc__popover {
  position: absolute; z-index: 60;
  max-width: 24rem;                 /* 240px desktop */
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-surface); color: var(--on-surface-text);
  font-size: var(--fs-xs); line-height: 1.45; font-weight: 400;
  border-radius: var(--radius-sm); box-shadow: var(--shadow-md);
  /* subtle entrance */
  opacity: 0; transform: translateY(2px) scale(0.98);
  transition: opacity var(--motion-fast), transform var(--motion-fast);
}
.ampy-calc__popover[data-open] { opacity: 1; transform: none; }
.ampy-calc__popover::after {     /* small caret pointing at the "i" */
  content:""; position:absolute; width:8px; height:8px; rotate:45deg;
  background: var(--bg-surface);
}
@container ampy (max-width: 600px) {
  .ampy-calc__popover { max-width: min(28rem, calc(100cqi - 3.2rem)); }  /* never wider than the card minus gutters */
}
```
- **Edge-aware positioning (JS):** after showing, measure `getBoundingClientRect()`; if it
  overflows the container left/right, clamp `left` to keep a 12px gutter and slide the caret
  to stay pointed at the "i". Prefer placing **above** the trigger; flip below if it would
  clip the top. This is ~30 lines of vanilla JS, shared by all tips.
- **Tap-target:** the existing coarse-pointer rule already gives the "i" a 44px hit area via
  `::before` (`styles.css` L839–855) — **keep that**, it's correct; just drop the
  `cursor:help` on coarse pointers.
- **Mobile sizing result:** with the shortened point-1/point-2 copy, the popover is ~2 lines
  and ~240px — a small, tidy card, not the full-width slab. That directly answers "huge ugly
  box."

**Dismiss/lifecycle (JS sketch):**
```js
function closeAllPopovers(except){ /* hide all, set aria-expanded=false */ }
tip.addEventListener("click", function(e){
  e.preventDefault(); e.stopPropagation();
  var open = pop.hasAttribute("data-open");
  closeAllPopovers();
  if (!open) { showPopover(tip, pop); }   // sets [data-open], aria-expanded, positions, focus stays on button
});
document.addEventListener("click", function(e){ if(!e.target.closest(".ampy-calc__tip,.ampy-calc__popover")) closeAllPopovers(); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeAllPopovers(); });
// also close on scroll of the calculator (popovers shouldn't float detached)
```

**If a full JS popover is out of scope for this pass,** the *minimum* fix is: (a) cap the
bubble `max-width` to `min(24rem, calc(100cqi - 3.2rem))` so it can't exceed the card on
344px, (b) add tap-outside + Escape close, and (c) ensure only one shows. But the proper
popover is the "10/10" answer and is reusable across Ampy's other calculators.

## Acceptance (point 13)
- [ ] Mobile: tapping "i" opens a **small** card (≤240px, ≤ card width − gutters), tapping
      again or tapping outside or Escape closes it; only one open at a time.
- [ ] Desktop: hover **and** keyboard-focus open it; mouse-leave/blur/Escape close it.
- [ ] Near the right edge (ROI "i", region "i", applicants "i") the popover never clips the
      container; the caret stays aimed at the "i".
- [ ] `role="tooltip"` + `aria-expanded`/`aria-controls`; the field control's accessible
      name still excludes the "i".
- [ ] 44px tap target preserved; no `cursor:help` on touch.
- [ ] `prefers-reduced-motion`: no scale/translate entrance.

---

# POINT 14 — MOBILE LOOKS "BLAFFIGT" (P0/P1, PRIMARY PLATFORM)

The fluid type/spacing tokens scale **toward the desktop ceiling** as the *container* grows,
but several land too large at 344px because their clamp floors are high and the layout
inherits desktop rhythm. Ruthless, itemised:

### 14.1 H1 too big, wraps to 2 lines (P1)
`--fs-2xl` = `clamp(2.2rem … 4.8rem)` → floor **22px**, and `.ampy-calc__t-2xl` line-height
1.2. At 344px the H1 "Hur mycket sparar du på att ladda hemma?" wraps to **two lines at
~30px** (screenshots #1/#3) and dominates. **Spec:** add a sub-600px container step that
caps the H1 nearer **24–26px** and tightens line-height to 1.15, letter-spacing −0.02em:
```css
@container ampy (max-width: 600px) {
  .ampy-calc__t-2xl { font-size: clamp(2.2rem, 6.4cqi, 2.6rem); line-height: 1.15; }
}
```
Two lines is acceptable; the goal is it reads as a confident headline, not a banner.

### 14.2 Selector thumbnails 56px → too heavy (P1)
`.ampy-calc__selector-img--lg` = 5.6rem (**56px**) (`styles.css` L806). At 344px the car/box
rows feel chunky (screenshot #3). **Spec:** sub-600px, drop to **44–48px** and reduce the
prominent button padding from `--spacing-md` (16px) to `--spacing-sm` (12px):
```css
@container ampy (max-width: 600px) {
  .ampy-calc__selector-img--lg { width: 4.4rem; height: 4.4rem; }
  .ampy-calc__selector-button--prominent { padding: var(--spacing-sm) var(--spacing-md); }
}
```

### 14.3 Hero number crowds its unit; eyebrow rhythm loose (P1)
`.ampy-calc__hero15-value` is `--fs-4xl` (up to 75px) with `gap: 1.2rem` to the `≈` and
unit. On mobile the floor is 40px which is right, but the **gap (12px)** between the big
number and "kr/år", plus the `≈` glyph, eats width and on some values pushes "kr/år" tight to
the edge (screenshot #3: "≈ 33 800 kr/år" nearly full-width). **Spec:** sub-600px reduce the
inter-token gap to `0.6rem`, and let the unit drop to its own baseline if needed:
```css
@container ampy (max-width: 600px) {
  .ampy-calc__hero15-value { gap: 0.6rem; }
  .ampy-calc__hero15-unit  { font-size: var(--fs-lg); }   /* was --fs-xl */
}
```
Also: with point 5 removing the "Spann …" line, the hero block gets shorter and cleaner —
good. Keep the dynamic sub ("om du flyttar all din publika laddning hem").

### 14.4 Vertical rhythm / card padding (P1)
The mobile column is one long scroll (body height 3383px). Card padding is `--spacing-lg`
(15px) sub-600px (`styles.css` L1067–1069) — fine — but the **inter-section gaps**
(`--spacing-2xl` = 30px on `.ampy-calc__container`, reduced to `--spacing-xl` = 20px at
≤768px, L1004–1007) still feel airy between the input card and the dark result card on a
phone. **Spec:** at ≤600px set the container gap to `--spacing-lg` (15px) and the result
stack gap stays `--spacing-md`. Tighten the `--spacing-lg` card-internal `gap` on the input
card to `--spacing-md` so fields don't drift apart.

### 14.5 ROI control wraps awkwardly + is arguably removed (P1, ties to point 4)
On mobile the "Räkna med laddboxens kostnad [i]" label sits on its own line above the
`Med investering / Utan investering` pills (screenshot #3) — a 2-line block at the very top
of the result card that pushes the hero down. **Phase-1 / point 4 recommends removing this
toggle entirely.** If removed, the result card opens directly on the hero number — a big
mobile win (less "blaffigt", faster to the payoff). I strongly endorse removal on the
primary platform. If kept, stack it tighter: label `--fs-xs`, pills `min-width:0`, and let
the row be `flex-direction:column; align-items:stretch` so the pills are full-width and
finger-sized rather than two floating lozenges.

### 14.6 Micro-trust row wraps 3→2 lines unevenly (P1, ties to point 8a)
`.ampy-calc__micro-trust` (`styles.css` L946–952) wraps to "Svar inom 24 h / Inget köpkrav"
on line 1 and "Dina uppgifter skyddas" centered on line 2 (screenshot #3) — visually
unbalanced. **Point 8a removes this row entirely.** Endorsed; it also de-clutters the dark
card on mobile. (If any trust line is retained elsewhere, make it a single centered line.)

### 14.7 Lead-form inputs are tall + placeholders (P1, ties to point 8b)
Inputs are `min-height:4.8rem` (48px) — good for touch — but the **placeholders**
("07X XXX XX XX", "12345") are being removed per point 8b. Removing them also fixes a real
a11y nit: placeholder-as-hint disappears on focus. With labels already present, dropping the
placeholders is strictly better. After removal, the empty fields read cleaner on mobile
(screenshots show the phone field still has the grey placeholder).

### 14.8 Segmented region control cramped (P2)
`.ampy-calc__segmented` is a 4-col grid with `--fs-sm` labels; at 344px "SE1…SE4" fit but
the active pill's white bg + shadow on the light-grey track is subtle. Coarse-pointer min-
height 44px is set — good. Minor: bump the active contrast by giving the pressed pill a 1px
`--border-default` ring so the selected zone is unmistakable on a phone in sunlight.

### 14.9 "Så har vi räknat" disclosure summary alignment (P2)
On mobile the collapsed "Så har vi räknat" card (screenshot #4) has the chevron far right
and a lot of empty width — fine, but ensure the summary min-height is ≥44px and the whole
row is tappable (currently the `<summary>` is, good).

## Acceptance (point 14)
- [ ] At 344px: H1 reads as a tight 1–2 line headline (~24–26px), not a banner.
- [ ] Selector thumbnails ≤48px; rows feel like list items, not cards-within-cards.
- [ ] Hero number + "kr/år" never touch the card edge; comfortable gap.
- [ ] Result card opens on (or very near) the hero number — minimal chrome above it.
- [ ] No 3→2 awkward wraps (micro-trust removed; ROI removed or full-width-stacked).
- [ ] No input placeholders; labels carry the meaning.
- [ ] Overall mobile scroll length drops meaningfully (removals in points 4/5/8 help).

---

# POINT 8c — "LÄS MER OM {BOX}" SPLIT UNDERLINE (P1)

## Problem
`.ampy-calc__btn-link` is `display:inline-flex; gap:var(--spacing-xs)` (`styles.css`
L870–878) and contains: text node `"Läs mer om "`, a `<span id="ampyEvProductLinkName">`,
and an arrow `<svg>`. The hover underline comes from the global `.ampy-calc a:hover {
text-decoration: underline }` (L126). Because the link is a **flex container**, the
text-decoration is applied per flex item, so it underlines "Läs mer om" and "{box}" as two
separate runs with the flex `gap` un-underlined between them (and the arrow too). That's the
"two segments" the owner sees (screenshot #4: "Läs mer om  Zaptec Go" split underline).

## Recommendation + spec
Make the **text one inline run** with a single underline, and keep the arrow as a separate
inline-flex sibling that is **not** underlined:
```html
<a class="ampy-calc__btn-link ampy-calc__btn-link--center" id="ampyEvProductLink" href="#">
  <span class="ampy-calc__btn-link-label">Läs mer om <span id="ampyEvProductLinkName">laddboxen</span></span>
  <svg …>…</svg>
</a>
```
```css
.ampy-calc__btn-link { text-decoration: none; }                 /* container: never underline */
.ampy-calc__btn-link:hover { text-decoration: none; }           /* override global a:hover */
.ampy-calc__btn-link-label { text-decoration: none;
  text-underline-offset: 0.25em; }
.ampy-calc__btn-link:hover .ampy-calc__btn-link-label,
.ampy-calc__btn-link:focus-visible .ampy-calc__btn-link-label { text-decoration: underline; }
.ampy-calc__btn-link-label { display: inline; }                 /* NOT a flex item → one continuous underline */
```
Because the label is a single inline element wrapping the whole phrase (incl. the dynamic
box name), the underline is **one continuous line** under "Läs mer om {box}", and the arrow
(a flex sibling) stays clean. This also fixes the same latent bug if the box name wraps.

## Acceptance (point 8c)
- [ ] Hover/focus underline is **one continuous line** under "Läs mer om {box}", no gap.
- [ ] The arrow is never underlined.
- [ ] Works for short ("Amina S") and long ("Charge Amps Aura") box names, incl. when the
      name wraps to a second line (underline continues per line, not split mid-phrase).

---

# CROSS-CUTTING POINT 15 ITEMS (mobile/interaction slice)

**P1 — One-open-at-a-time for popovers AND selectors.** The car/charger dropdowns already
close on outside-click (`engine.js` L940). Fold the new tooltip popovers into the same
"close everything else on open" discipline so a tip + an open dropdown never overlap on a
phone.

**P1 — Slider thumb focus ring vs the new `touch-action`.** Keep
`.ampy-calc__slider:focus-within .ampy-calc__slider-thumb` ring (`styles.css` L316). Verify
it's visible against the dark result card context (the sliders live on the light input card,
so OK) and meets 3:1 non-text contrast.

**P2 — Count-up during drag.** `animateNumber` runs a 280ms count-up on every step crossed
mid-drag (see point 11E). On a fast km drag the hero flickers through intermediate counts.
Recommend: suppress count-up while `.is-dragging` (set the value directly), run it only on
release. Feels calmer and more "premium."

**P2 — `≈` glyph baseline.** The `≈` before the hero and monthly values is part of the
static HTML, baseline-aligned via `align-items:baseline`. On mono fonts the `≈` sits slightly
low; consider `vertical-align` nudge or moving it into the unit span for perfect optical
alignment. Cosmetic.

**P2 — Tap target audit summary (WCAG 2.5.5, all pass on paper, verify on device):** tip
44px ✓ (L839), segmented 44px ✓ (L372), toggle 44px ✓ (L396), stepper 36px **✗→** the
`+`/`−` stepper buttons are `3.6rem` (36px) with no coarse-pointer enlargement
(`styles.css` L432–437). **Fix:** add a coarse-pointer rule giving the stepper buttons a
44px hit area (visible 36px is fine, expand the tap zone like the tip does). If point 3/point
4 keeps the applicants stepper, this is required for AA on touch.

```css
@media (pointer: coarse) {
  .ampy-calc__stepper-btn { position: relative; }
  .ampy-calc__stepper-btn::before {
    content:""; position:absolute; inset:50% 50%;
    width:4.4rem; height:4.4rem; transform:translate(-50%,-50%);
  }
}
```

**P2 — Third "schemalagd" bar (from `r3-scheduled-charging.md`) on mobile.** When the
optimised third bar lands in the monthly panel, on 344px it stacks as a third
`.ampy-calc__monthly-col` — fine — but watch the vertical height of that panel; with three
labelled bars + the delta row it gets tall. Recommend the third bar use a **lighter/dashed**
green fill and a slightly smaller value type (`--fs-md` vs `--fs-lg`) so the hierarchy stays:
public (biggest) → home (green) → schemalagd (lighter green, secondary). Keep it out of the
SR live region (only the headline is announced — correct).

---

# CONSOLIDATED PRIORITY TABLE

| P | Point | Item | Fix location |
|---|-------|------|--------------|
| P0 | 11 | `touch-action: pan-y`→`none` while dragging + `preventDefault`+non-passive | `styles.css` L272; `engine.js` L625 |
| P0 | 11 | Robust drag geometry (read thumb half-width, not hard-coded 12px) | `engine.js` L558 |
| P0 | 12 | Show 4 legible km tick labels (5k·20k·35k·50k) + dot markers; delete blank-interior hack | `engine.js` L465–483 + init; `styles.css` L1050 |
| P0 | 13 | Replace CSS `::after` data-tip with tap-dismissible, edge-aware popover (one open) | new JS + `styles.css` L856; HTML tips |
| P0/P1 | 14 | Sub-600px type/thumbnail/gap step (H1 24–26px, thumb 44–48px, hero gap, container gap) | `styles.css` `@container` blocks |
| P1 | 8c | Single continuous underline on "Läs mer om {box}" (one inline label, arrow separate) | `index.html` L365–367; `styles.css` L870 |
| P1 | 11 | Unify fill+thumb release transition to `--motion-fast`; suppress count-up during drag | `styles.css` L287/294; `engine.js` paintDrag |
| P1 | 14/8a/8b | Remove micro-trust row + input placeholders; remove/full-width ROI toggle | `index.html` L288–292, L311/316, L178–192 |
| P2 | 15 | Stepper buttons 44px tap target on coarse pointers | `styles.css` L432 |
| P2 | 15 | One-open-at-a-time across popovers + selectors; reduced-motion on popover | `engine.js` |

---

# DEVICE / VIEWPORT TEST MATRIX (acceptance harness)

- **iPhone SE (375×667, but container ~344)** — H1 lines, ticks, popover width, slider drag.
- **iPhone 14/15 (390 / 393)** — the old `≤390px` boundary; verify tick subset, not blanks.
- **Small Android (360)** + **320px hard floor** — nothing clips; popover ≤ card width.
- **iPad / tablet (768–960)** — single-column boundary (`@container ≤960`), tooltip anchor.
- **Desktop (≥1024)** — two-column, hover tooltips, focus rings, keyboard slider.
- **Cross-cut:** `prefers-reduced-motion: reduce`; keyboard-only; VoiceOver/NVDA reads the
  debounced headline only; host root font-size overridden to 16px (geometry robustness).
</content>
</invoke>
