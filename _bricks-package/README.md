# Ampy EV / Laddbox Calculator — Bricks/WordPress 1-to-1 package

The **definitive, FluentSnippets-native** package to deploy the calculator as a
**pixel-perfect 1-to-1 clone** in Bricks/WordPress — exactly what you asked for:
**three files (CSS · PHP/HTML · JavaScript)**, no plugin, nothing to rebuild.

> This **supersedes** the earlier `ampy-ev-calculator-handover.zip` (which shipped a
> confusing second *plugin* variant and a doc that wrongly told you to add a **global**
> `html{font-size:62.5%}`). Use this package instead.

---

## The one idea that makes this trivial

**1-to-1 fidelity is achieved by deploying the *same code* — never by rebuilding the
UI with native Bricks elements.** The whole design is ~1,175 lines of scoped CSS keyed
to an exact `ampy-calc__*` class tree, and the sliders / selectors / tooltips / charts
are generated at runtime by the JS engine binding to fixed element IDs. Rebuild any of
it with Bricks Containers/Headings/Buttons and the JS finds nothing + the CSS matches
nothing → a broken lookalike.

**The only Bricks element involved is ONE Code block that calls the render function.**
The three snippets carry the entire design.

---

## The three files (map to FluentSnippets)

| File in this package | FluentSnippet | Run Location | Notes |
|---|---|---|---|
| `snippets/CSS.css` | **CSS** | Frontend → `wp_head` | **byte-identical** to the proven reference (SHA `3add2d1a…`) |
| `snippets/PHP-HTML.php` | **PHP** | **Frontend & Backend** | render + REST + metabox + importer; verbatim **+ the two portability fixes below** |
| `snippets/JAVASCRIPT.js` | **JS** | Frontend → `wp_footer` | **byte-identical** to the proven reference (SHA `14fa0a49…`) |

Runtime order (do not disturb): **head CSS → body render (inline data + HTML) →
footer JS.** The engine early-exits if `window.AmpyEvCalcData` isn't defined first, so
the JS must be `wp_footer`, never `<head>`.

---

## What's in the box

```
bricks-package/
├── README.md                  ← you are here
├── BRICKS-IMPLEMENTATION.md   ← step-by-step for you + your AI agent (start here)
├── CONVERSION-SPEC.md         ← what was converted and why (the packaging spec)
├── FIDELITY-CHECKLIST.md      ← every design atom to tick off (desktop + mobile)
├── snippets/                  ← the 3 files you paste
│   ├── CSS.css
│   ├── PHP-HTML.php
│   └── JAVASCRIPT.js
├── data/
│   └── laddbox-kalkylator-data.xlsx   ← upload in the metabox
└── reference/                 ← the runnable pixel-truth (diff the live page against this)
    ├── index.html  data.js  engine.js  styles.css
```

**Read order:** `BRICKS-IMPLEMENTATION.md` → paste the 3 snippets → verify against
`FIDELITY-CHECKLIST.md`. `CONVERSION-SPEC.md` is the "why" reference.

---

## The only two changes vs the raw production code (both packaging, zero design change)

The reference prototype's `<head>` supplied two ambient conditions a stock Bricks page
may not. These are the entire portability surface; everything else is untouched.

1. **Fonts** — the render used to inject **JetBrains Mono only** and silently relied on
   ampy.se's Core Framework to serve Plus Jakarta Sans + Outfit. It now emits all three
   families (the prototype's exact Google URL). Token values unchanged.
2. **Rem scale** — the render used to emit `.ampy-calc-outer{font-size:62.5%}`, which is
   a **no-op** (`rem` is root-relative) → 1.6× too big on any non-62.5% root. It now
   emits `html:has(.ampy-calc-outer){font-size:62.5%}` — re-anchors the root, but only on
   pages that contain the calculator. On ampy.se (already 62.5% globally) it's redundant-
   but-harmless.

> **Both were verified in a real browser:** on a simulated stock 16px page with only the
> `:has()` rule, `.ampy-calc` resolves to **17px** — identical to the reference; and all
> three font families report `loaded`. **No `rem`, `--fs-*`, color, spacing, gradient,
> shadow, or radius value was changed.**

---

## Verification summary (why you can trust this is 1-to-1)

- **CSS + JS byte-identical** to the runnable reference (SHA256-proven).
- **Render DOM structurally identical** to the reference `<body>` — same tree, IDs,
  classes, order, inline SVGs, `data-*` (independently confirmed).
- **The PHP diff is exactly the two additions above** — nothing else changed.
- **Browser-proven**: rem re-anchors correctly on a non-62.5% host; all 3 fonts load.
- **Default scenario** (Tesla Model Y + Zaptec Go + SE3 + DC + 100 % + 20 000 km):
  hero **≈17 276 kr/år**, monthly **1 721 / 282 / 1 440**, 10-yr **168 266 kr** *(net of the box —
  cumulative savings 172 756 − 4 490 net price)*, Att betala **4 490 kr** — the acceptance target the
  live page must reproduce.

---

## Before you go live (details in BRICKS-IMPLEMENTATION.md)

1. Create the 3 snippets with the exact run locations above.
2. On ampy.se you likely need **neither** portability fix (Core Framework already gives
   fonts + 62.5%) — but the fixes are already baked in and harmless, so just deploy.
3. Ensure the `lead-magnet` CPT exists; create the post; **upload the provided `.xlsx`**
   (do not regenerate it).
4. Place ONE Bricks **Code** element (full-width container):
   `<?php echo ampy_render_ev_lead_magnet( 'laddboxkalkylator' ); ?>`
5. Turn caching/minification off, confirm pixel-perfect against `reference/`, then
   re-enable optimizations one at a time (exclude the inline data script + JS from
   defer/combine).
6. Walk `FIDELITY-CHECKLIST.md` at 1440px and ~375px.
