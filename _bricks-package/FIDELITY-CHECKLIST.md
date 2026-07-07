# FIDELITY-CHECKLIST — every design atom, tick to confirm the clone matches

**Purpose:** the consolidated, exhaustive, tickable verification that the deployed Bricks clone is
1-to-1 with the bundled `reference/` on **desktop AND mobile**. Because the CSS and JS ship byte-identical,
most of this is *"confirm nothing got mangled in transit"* (caching/minification, font loading, rem scale)
rather than re-authoring. Reference values are verbatim from `reference/styles.css` (1175 lines,
`1rem = 10px`) and `reference/engine.js`.

> **How to verify:** open the static reference (`reference/index.html`) in one tab and the live Bricks
> page in another. Prefer `getComputedStyle` / DevTools inspection over screenshots for colors, weights,
> sizes. Diff key elements between the two.

---

## 0. FAST GATES (if any fails, stop — the whole thing is off)

> **This verifies a code-PASTE clone, not a Bricks rebuild.** If any control (slider, selector, segmented
> toggle, tooltip, monthly bars) was recreated with native Bricks elements, stop — it can never be 1-to-1;
> see `BRICKS-IMPLEMENTATION.md`. The gates below assume the 3 snippets carry the whole UI.

- [ ] **Data loads:** defaults (Tesla Model Y + Zaptec Go + SE3 + DC + 100 % + 20 000 km) reproduce
  hero **≈17 276 kr/år**, monthly **1 721 / 282 / 1 440**, 10-yr **168 266 kr** *(net of the box:
  cumulative savings 172 756 − 4 490 net price — NOT a mismatch with the 172 756 pure-savings number)*,
  Att betala **4 490 kr**. If the values are all "—", data didn't load (CPT/meta/Excel or script order).
  If the element is entirely blank (no shell), no `lead-magnet` post was found.
- [ ] **Rem scale:** `getComputedStyle('.ampy-calc').fontSize ≈ 17px` at desktop (from `--fs-md` floor
  1.7rem). If it reports **≈27px**, the root is 16px and the 62.5% anchor was lost.
- [ ] **Fonts present:** `document.fonts.check('16px "Plus Jakarta Sans"')` **true**,
  `document.fonts.check('16px "Outfit"')` **true**, JetBrains Mono present on mono values.
- [ ] **No console errors** on the **live cached** page (not just the logged-in preview).
- [ ] **Engine is the last script**, running after the inline `window.AmpyEvCalcData`.
- [ ] **DOM matches prototype** `<body>` modulo injected data/font/nonce (proves no native-Bricks rebuild).

---

## 1. FONTS — 3 families, 4 weights (styles.css 107–109)

- [ ] `--font-heading: "Plus Jakarta Sans", system-ui, sans-serif`
- [ ] `--font-body: "Outfit", system-ui, sans-serif`
- [ ] `--font-mono: "JetBrains Mono", ui-monospace, monospace`
- [ ] **Only 4 weights exist: 400 / 500 / 600 / 700.** No named keywords, no 300/800. All four served
  for Jakarta + Outfit (no synthetic bolding). Confirm a known-600 element
  (`.ampy-calc__disclosure-summary`) renders true 600, not synthesized.
- [ ] JetBrains Mono is the **variable** font (`font-weight:100 800`, `woff2-variations`). If the local
  woff2 is actually a static weight, delete it so the render falls through to the Google variable link.

**Family-mapping watch-outs (deliberate — must match):**
- [ ] `.ampy-calc__header h2` uses **`--font-body`** (Outfit), NOT heading (L162).
- [ ] `.ampy-calc__slider-tick` uses **`--font-body`** deliberately — mono reserved for live numbers (L374).
- [ ] `.ampy-calc__popover` uses `var(--font-body, "Outfit", system-ui, sans-serif)` — lives on `<body>`,
  outside scope, so it carries the explicit fallback (L910).
- [ ] Mono feature-settings on `.ampy-calc__t-mono`: `font-feature-settings: "tnum" 1, "lnum" 1` (L144).

---

## 2. FULL FLUID TYPE SCALE — `--fs-*` (styles.css 98–105, verbatim)

All interpolate over `100cqi` (container width), floor 320px, span 960px.

- [ ] `--fs-xs:  clamp(1rem,   …(1.2-1)…,   1.2rem)` → 10→12px
- [ ] `--fs-sm:  clamp(1.2rem, …(1.4-1.2)…, 1.4rem)` → 12→14px
- [ ] `--fs-md:  clamp(1.7rem, …(1.8-1.7)…, 1.8rem)` → 17→18px (base `.ampy-calc` font-size, L115)
- [ ] `--fs-lg:  clamp(1.7rem, …(2.8-1.7)…, 2.8rem)` → 17→28px
- [ ] `--fs-xl:  clamp(1.8rem, …(3.6-1.8)…, 3.6rem)` → 18→36px
- [ ] `--fs-2xl: clamp(2rem,   …(4.8-2)…,   4.8rem)` → 20→48px
- [ ] `--fs-3xl: clamp(2.6rem, …(6-2.6)…,   6rem)`   → 26→60px
- [ ] `--fs-4xl: clamp(3.4rem, …(7.5-3.4)…, 7.5rem)` → 34→75px

**Non-scale / literal font-sizes (replicate exactly):**
- [ ] `.ampy-calc__hero-value sup` → `0.4em` (L543)
- [ ] `.ampy-calc__tip` → `1rem` (L867)
- [ ] `.ampy-calc__popover` → `13px` explicit px (L913)
- [ ] `.ampy-calc__slider-tick` mobile → `0.9rem` @container ≤500px (L1100)
- [ ] `.ampy-calc__t-2xl` mobile → `clamp(2rem, 6.4cqi, 2.6rem)` @container ≤600px (note **6.4cqi**, L1125)

**Letter-spacing set (verbatim):** `-0.03em`, `-0.02em`, `-0.015em`, `-0.01em`, `0.01em`, `0.02em`,
`0.04em`, `0.06em`, `0.08em`.
- [ ] `-0.03em` → `.hero15-value` (L975)
- [ ] `-0.02em` → `.t-display`, `.t-3xl`, `.hero-value` (L136/137/540)
- [ ] `-0.015em` → `.t-2xl`, `.monthly-col-value`, `.monthly-delta-value`, `.trio-value` (L138/597/648/1005)
- [ ] `-0.01em` → `.t-heading`, `.value-prominent`, `.selector-name--lg`, `.hero15-unit`, + `.t-2xl` mobile (L139/831/844/978/1125)
- [ ] `0.01em` → `.field-label`, `.methodology-item h3` (L204/791)
- [ ] `0.02em` → `.badge`, `.monthly-col-label`, `.field-label-tiny`, `.trio-label` (L262/592/826/1000)
- [ ] `0.04em` → `.header-label` (L160)
- [ ] `0.06em` → `.tier-label`, `.hero15-eyebrow`, `.evidence-label` (L822/971/1018)
- [ ] `0.08em` → `.hero-label` (L536)

**Line-height set (verbatim):** `1.0`, `1.1`, `1.15`, `1.2`, `1.3`, `1.4`, `1.45`, `1.5`, `1.55`.
- [ ] `1.5` → root/body/small/caption + info-note/success/trust-sub/methodology-p/consent/trio-sub
- [ ] `1.0` → `.t-display`, `.hero-value`, `.hero15-value` (L136/539/974)
- [ ] `1.1` → `.t-3xl` (L137)
- [ ] `1.2` → `.t-2xl`, `.badge`, `.return-value`, `.monthly-col-value`, `.monthly-delta-value`, `.trio-value`
- [ ] `1.3` → `.t-heading`, `.cumulative-value`, `.value-prominent`
- [ ] `1.4` → `.t-subheading` (L140)
- [ ] `1.15` → `.t-2xl` mobile (L1125)
- [ ] `1.45` → `.popover` (L913)
- [ ] `1.55` → `.disclaimers` (L803)

---

## 3. COLOR TOKENS (scoped to `.ampy-calc`, styles.css 22–69, verbatim)

**Backgrounds/surfaces:**
- [ ] `--bg-primary: rgb(247, 249, 251)`
- [ ] `--bg-surface: rgb(9, 11, 50)`
- [ ] `--bg-subtle: rgb(234, 239, 243)`

**Text:**
- [ ] `--text-primary: rgb(15, 18, 60)`
- [ ] `--text-secondary: rgb(86, 94, 130)`
- [ ] `--text-inverse: rgb(255, 255, 255)`

**Action (a11y-darkened teal):**
- [ ] `--action-primary: rgb(0, 125, 107)`
- [ ] `--action-secondary: rgb(0, 150, 130)`

**State:**
- [ ] `--state-success: rgb(57, 194, 129)`
- [ ] `--state-error: rgb(214, 76, 76)`
- [ ] `--state-warning: rgb(240, 175, 56)`

**Borders/focus:**
- [ ] `--border-default: rgba(15, 18, 60, 0.12)`
- [ ] `--border-focus: rgb(0, 125, 107)`

**On-surface (over the dark card):**
- [ ] `--on-surface-text: rgba(255, 255, 255, 0.94)`
- [ ] `--on-surface-text-muted: rgba(255, 255, 255, 0.66)`
- [ ] `--on-surface-text-faint: rgba(255, 255, 255, 0.55)`
- [ ] `--on-surface-border: rgba(255, 255, 255, 0.14)`
- [ ] `--on-surface-border-strong: rgba(255, 255, 255, 0.28)`
- [ ] `--on-surface-subtle-bg: rgba(255, 255, 255, 0.06)`

**Chart streams:**
- [ ] `--chart-stream-1: rgb(0, 169, 145)`
- [ ] `--chart-stream-2: rgb(57, 194, 129)`
- [ ] `--chart-stream-3: rgb(122, 208, 198)`
- [ ] `--chart-stream-4: rgb(160, 184, 196)`

**Chart lines/zones (JS-consumed):**
- [ ] `--chart-line-loss: rgb(240, 175, 56)`
- [ ] `--chart-line-profit: rgb(0, 169, 145)`
- [ ] `--chart-zone-loss: rgba(240, 175, 56, 0.18)`
- [ ] `--chart-zone-profit: rgba(0, 169, 145, 0.16)`

> **Two teals coexist BY DESIGN:** `rgb(0,125,107)` for actionable UI (a11y-darkened);
> `rgb(0,169,145)` for decorative chart/glow/gradient. Do not unify them.

**Hardcoded (non-token) colors:**
- [ ] `#fff` behind product PNGs → `.selector-img:has(.selector-photo)` (L235) — the only hex in the file
- [ ] `.badge--soft` bg `rgba(0, 125, 107, 0.10)` (L271)
- [ ] `.monthly-col::after` track bg `rgba(255, 255, 255, 0.08)` (L611)
- [ ] `.info-note` bg `rgba(240,175,56,0.12)` + border `1px solid rgba(240,175,56,0.4)` (L680)
- [ ] `.lead-form-success` bg `rgba(57,194,129,0.14)` + border `…0.4)` (L719)
- [ ] `.lead-form-error` bg `rgba(214,76,76,0.14)` + border `…0.4)` (L720)
- [ ] `.selector-button--on-surface .selector-img` bg `rgba(255,255,255,0.08)` (L850)
- [ ] `.btn-link--bordered:hover` bg `rgba(255,255,255,0.10)` (L966)
- [ ] `.popover` bg `var(--bg-surface, rgb(9,11,50))`, color `…0.94)`, caret same (L908/909/931)

---

## 4. GRADIENTS (6, verbatim)

- [ ] **Dark card brand-glow** (`.card--surface`, L188–191), two stacked radials over `--bg-surface`:
  ```
  radial-gradient(120% 60% at 90% -10%, rgba(0,169,145,0.28), transparent 60%),
  radial-gradient(80% 50% at -10% 110%, rgba(57,194,129,0.16), transparent 60%)
  ```
- [ ] **Slider fill** (L324): `linear-gradient(90deg, var(--action-primary), var(--state-success))`
- [ ] **Monthly bar — PUBLIC/amber** (L627): `linear-gradient(90deg, var(--state-warning), rgb(214,150,40))`
  (note the one-off literal end-stop `rgb(214,150,40)`)
- [ ] **Monthly bar — HOME/teal→green** (L633): `linear-gradient(90deg, var(--action-primary), var(--state-success))`
- [ ] **Cumulative wash** (L657): `linear-gradient(90deg, rgba(0,169,145,0.18), rgba(57,194,129,0.10))`
  + border `1px solid var(--on-surface-border-strong)`

---

## 5. SHADOWS — 3 tokens + 15 literals (verbatim)

**Tokens (L83–85):**
- [ ] `--shadow-sm: 0 1px 2px rgba(15,18,60,0.06)`
- [ ] `--shadow-md: 0 0.4rem 1.2rem rgba(15,18,60,0.08)`
- [ ] `--shadow-lg: 0 1.6rem 4rem rgba(15,18,60,0.14)`

**Focus-ring teal `rgba(0,125,107,·)` — opacity varies per control (match each):**
- [ ] `.20` → inputs/select `:focus` (L526)
- [ ] `.25` → selector-button (L221) + slider focus-within `0 0 0 4px …,var(--shadow-md)` (L364)
- [ ] `.3` → segmented (L427), toggle (L453), disclosure (L512), tip (L878)
- [ ] `.35` → btn (L477)
- [ ] `.4` → btn-link (L947), streams-summary (L1031)
- [ ] Error ring `rgba(214,76,76,0.2)` → `.input--error:focus` (L529)
- [ ] `.selector-option:focus-visible` inset `inset 0 0 0 2px var(--border-focus)` (L300)
- [ ] `.segmented-option[aria-pressed="true"]` `var(--shadow-sm), inset 0 0 0 1px var(--border-default)` (L431)
- [ ] `.monthly-col::after` `inset 0 0 0 1px var(--on-surface-border)` (L612)
- [ ] `.popover` `var(--shadow-md, 0 4px 12px rgba(15,18,60,0.18))` — fallback differs (outside scope, L915)

---

## 6. RADII (L78–81 + literals)

- [ ] `--radius-sm: 0.6rem` (6px)
- [ ] `--radius-md: 1.2rem` (12px)
- [ ] `--radius-lg: 2rem` (20px)
- [ ] `--radius-full: 999rem`
- [ ] slider tick marker cap `border-radius: 1px` (L386)
- [ ] consent error outline `border-radius: 2px` (L756)

---

## 7. SPACING TOKENS (L71–76, scoped to `.ampy-calc`)

- [ ] `--spacing-xs: 0.5rem` (5px)
- [ ] `--spacing-sm: 0.75rem` (7.5px)
- [ ] `--spacing-md: 1rem` (10px)
- [ ] `--spacing-lg: 1.5rem` (15px)
- [ ] `--spacing-xl: 2rem` (20px)
- [ ] `--spacing-2xl: 3rem` (30px)

**Core layout grids (base/desktop):**
- [ ] `.ampy-calc-outer` → `container-type: inline-size; container-name: ampy; overflow-x:hidden; width/max-width:100%` (L10–18)
- [ ] `.ampy-calc__container` → `max-width:128rem; margin:0 auto; padding:var(--spacing-xl) 0;` flex col, gap 2xl (L147–154)
- [ ] `.ampy-calc__main` → `grid; grid-template-columns: minmax(0,5fr) minmax(0,7fr); gap:var(--spacing-xl); align-items:start` (L165–170) — the 5/7 split
- [ ] `.ampy-calc__result-stack` → flex col, gap md, min-width:0 (L171)
- [ ] `.ampy-calc__card` → padding xl, flex col, gap lg, radius lg (L174–182)
- [ ] `.ampy-calc__trio` → `grid; repeat(auto-fit, minmax(0,1fr)); column-gap lg; row-gap md` (L993–996)
- [ ] `.ampy-calc__streams-legend` → base `1fr`, gap xs (L562)
- [ ] `.ampy-calc__lead-form-grid` → base `1fr`, gap md (L703)
- [ ] `.ampy-calc__monthly-cols` → flex col, gap lg (L588)
- [ ] `.ampy-calc__trust` → `repeat(auto-fit, minmax(22rem,1fr)); gap md; padding lg` (L766–767)

---

## 8. EVERY CONTAINER BREAKPOINT — `@container ampy` (NOT viewport media)

> All respond to `.ampy-calc-outer` **width**. If the container context is dropped, NONE fire.
> Verify at desktop 1440px AND ~375px — container queries are viewport-agnostic, so a narrow container
> in a wide viewport still triggers the small-width rules (that is the whole architecture).

| Threshold | Dir | Change | Line |
|---|---|---|---|
| **960px** | ↓ | `.ampy-calc__main` 5fr/7fr → **1fr** (the 2-col → 1-col flip) | 1113 |
| 768px | ↓ | `.container` gap 2xl(30) → xl(20) | 1089 |
| 600px | ↑ | `.streams-legend` → `1fr 1fr` gap `sm lg` | 1157 |
| 600px | ↑ | `.lead-form-grid` → `1fr 1fr` | 1165 |
| 600px | ↓ | `.container` gap → lg(15) | 1092 |
| 600px | ↓ | `.card` pad xl→lg; `.t-2xl` `clamp(2rem,6.4cqi,2.6rem)` lh1.15 ls-0.01em; `.selector-img--lg` 4.8rem; `.selector-button--prominent` pad sm md; `.hero15-value` gap 0.6rem; `.hero15-unit` `--fs-lg`; `.card--surface` gap md; `.monthly` pad md; `.card` gap md | 1119–1143 |
| 560px | ↑ | `.trio` → `1.2fr 1fr` | 1171 |
| 560px | ↓ | `.trio` → `1fr` (stack) | 1174 |
| 500px | ↓ | `.slider-tick` font 0.9rem, pad 0.1rem 0.2rem (+ JS 4-label km subset `5k·20k·35k·50k`) | 1098 |
| 480px | ↓ | `.hero15-value` → `--fs-3xl` | 1147 |
| 420px | ↓ | `.card` pad → md (15→10) | 1152 |

- [ ] All 12 rows above verified.
- [ ] **Two separate `max-width:600px` blocks** exist (L1092 gap + L1119 sizing) — keep both.
- [ ] **Two separate `min-width:600px` blocks** exist (L1157 legend + L1165 form) — keep both.
- [ ] `@container ampy (max-width:960px)` appears **out of file order** (after the 500px rule) — that is intentional; keep it.

**The two non-container `@media` (must STAY `@media`):**
- [ ] `@media (pointer: coarse)` × 5 (L392/434/460/760/885) — grows touch targets to ≥4.4rem (44px), no visible-size change.
- [ ] `@media (prefers-reduced-motion: reduce)` × 2 (L935 popover transform; L1070–1078 global kill).

---

## 9. SLIDER / TOOLTIP GEOMETRY (styles.css)

- [ ] `.slider-ticks` → `padding: 0 1.2rem; margin-top: var(--spacing-sm); overflow:hidden` (L366–370)
- [ ] `.slider-tick` → `font-size var(--fs-xs); padding 0.2rem 0.4rem; border-radius var(--radius-sm)` (L371–378)
- [ ] `.slider-tick--marker` → 2px×6px centered tick (L383–387)
- [ ] `.tip` → `1.6rem × 1.6rem; margin-left var(--spacing-xs); position:relative` (L864–873)
- [ ] `.popover` → `position:fixed; z-index:2147483000; max-width:min(280px, calc(100vw - 24px)); padding:8px 12px` (L903–922).
  Appended to **`<body>`**, outside `.ampy-calc-outer` (container-type would re-anchor a fixed child). Do NOT move it inside the wrapper.
- [ ] popover caret `::after` 9px rotated square, `left: var(--caret-x, 50%)`, flips via `[data-placement]` (L928–934)

---

## 10. MOTION / ANIMATIONS / TRANSITIONS

**Tokens (L87–89):**
- [ ] `--motion-fast: 150ms`
- [ ] `--motion-normal: 300ms`
- [ ] `--easing: cubic-bezier(0.2, 0, 0.2, 1)`

**Keyframes (exactly 3):**
- [ ] `ampy-spin` (L495) → `to{transform:rotate(360deg)}`; applied `0.8s linear infinite` on `.btn-spinner` (submit)
- [ ] `ampy-snap-highlight` (L835–838) → color teal→primary, scale 1.04→1.0; `150ms var(--easing)` on `.value-prominent.is-snap` (CSS present; JS trigger not wired in this build — clone verbatim regardless)
- [ ] `ampy-reveal` (L1067) → `to{opacity:1; transform:translateY(0)}`

**Staggered reveal (L1050–1067)** — 5 blocks fade+rise, start `opacity:0 translateY(0.6rem)`, `ampy-reveal 300ms var(--easing) forwards`:
- [ ] `.hero15` delay **40ms**
- [ ] `.trio` delay **100ms**
- [ ] `.monthly` delay **160ms**
- [ ] `.evidence` delay **220ms**
- [ ] `.cta-stack` delay **280ms**

**Key transitions (all 150ms unless noted):**
- [ ] selector-button border-color+box-shadow 150ms `--easing` (L216); chevron transform 150ms → 180° on expanded (L247–248)
- [ ] slider-fill `transform 150ms --easing` (L332); slider-thumb `left/transform 150ms --easing, box-shadow 150ms` (L341); **`.is-dragging` → transition:none** (L348–351)
- [ ] segmented / toggle: bg+color+box-shadow 150ms (L423/447)
- [ ] btn: opacity/bg/color/box-shadow/transform 150ms (L471–472); `:hover` opacity .92; `:active` opacity .82 + translateY(1px) (L475–476)
- [ ] input/select: border-color+box-shadow 150ms (L522)
- [ ] disclosure `::after`, streams svg, spec svg: transform 150ms → 180° on `[open]` (L508/1032/1044)
- [ ] **streams-segment `width 300ms --easing`** (L561)
- [ ] **monthly `::before` fill `width 300ms --easing`**, `width:calc(100% * var(--bar-frac))` (L618)
- [ ] **popover `opacity/transform/visibility 150ms cubic-bezier(0.2,0,0.2,1)`** — hard-coded, NOT the token (L919–921); closed `translateY(2px)`, `[data-open]` rises to none

**JS motion (engine.js):**
- [ ] **Count-up** `animateNumber` — **280ms, easeOutCubic `1-(1-t)³`** (NOT the CSS easing), +60ms safety timeout; skips on first-set / drag / reduced-motion / non-finite / unchanged. Applied to annual saving, cumulative, net-pay, monthly public/home/saving.
- [ ] Drag: rAF-coalesced, `is-dragging` kills transitions, residual-transform trick, release glides fill+thumb home over 150ms together.
- [ ] `fmtKr` inserts NBSP (` `) thousands separators.
- [ ] Reduced-motion read once at load; count-up instant + form scroll `auto` when set.

---

## 11. STRUCTURE / A11y PARITY (proves no Bricks rebuild)

- [ ] Wrapper nesting: `.ampy-calc-outer` › `.ampy-calc#ampyEvCalc` › `.ampy-calc__container` › header + `.ampy-calc__main` › inputs card + `.ampy-calc__result-stack`.
- [ ] Every ID present: `ampyEvCarSelectorA`, `ampyEvChargerButtonA`, `ampyEvKmContainer`, `ampyEvTrio`, `ampyEvMonthly`, `ampyEvLeadForm`, `ampyEvLeadConsent`, `ampyEvSrStatus`, `ampyEvMethodologyStack`, `ampyEvAnnualSaving`, `ampyEvCumulativeValue`, `ampyEvNetPay`, `ampyEvMonthlyPublic/Home/Saving`, `ampyEvLeadSubmitLabel`.
- [ ] Inline SVGs match: two chevrons, primary-CTA arrow, success check, error circle, product-link arrow.
- [ ] All `role`/`aria-*`/`aria-labelledby`/`aria-pressed`/`aria-describedby`, form attrs (`novalidate`, `required`, `autocomplete`, `inputmode`, `type`), honeypot + consent sub-trees present.

---

## 12. COMPUTED-STYLE SPOT DIFFS (prototype vs live — catches theme bleed)

Diff `getComputedStyle` between the static reference and the live Bricks page for:
- [ ] `.ampy-calc__btn--primary` (bg, color, radius, padding, font-weight 600, no uppercase)
- [ ] `.ampy-calc__input` (border, height, font inherited)
- [ ] `.ampy-calc__t-2xl` (font-size, weight 700, letter-spacing, line-height)
- [ ] `.ampy-calc__internal-divider` (`<hr>` — border/margin not overridden by theme)
- [ ] `.ampy-calc__disclosure-summary` (weight 600, list-marker suppressed)

Any delta = a Bricks/theme rule bleeding in. Fix **narrowly, inside `snippets/CSS.css`**, by adding the
explicit reference-matching value to the existing scoped selector (e.g. `text-transform:none` on
`.ampy-calc__btn` if the theme uppercases buttons). **Never** use a blanket `all:revert`/`all:unset`.
