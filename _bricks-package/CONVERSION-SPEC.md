# CONVERSION-SPEC — EV/Laddbox-kalkylatorn → 3 FluentSnippets (1-to-1 Bricks clone)

**Status: ✅ APPLIED.** This spec has been **executed** — the shipped `snippets/CSS.css`,
`snippets/PHP-HTML.php` and `snippets/JAVASCRIPT.js` already contain everything below. Read this as the
**record of what was done**, not a to-do. In particular the two §3 additions are **already baked into
`PHP-HTML.php`**: 3-family font loading (~lines 1073–1090) and the page-gated rem anchor
`html:has(.ampy-calc-outer){font-size:62.5%}` (~line 1107). **Do NOT re-apply them; do NOT restore the
older mono-only `<link>` or the scoped `.ampy-calc-outer{62.5%}` rule.** Any imperative or present-tense
phrasing below ("ships JetBrains only…", "replace…", "change it to…") describes the edit that was made and
is historical. (Line numbers cited in older sub-sections predate the edits; the correct current anchors
are in §8.)

**Zero design values change.** This is not a redesign, not a rebuild — it is a byte-faithful clone of the
runnable reference into WordPress/Bricks: CSS + JS ship byte-identical, and the PHP differs from the raw
production file only by the two additions above.

---

## 0. THE CORE PRINCIPLE (unmissable — read this before anything else)

> **1-to-1 fidelity is achieved by deploying the SAME code, not by re-creating the UI.**
> The CSS and JS ship **byte-identical** to the proven prototype. The PHP emits **render markup
> that is provably identical** to the prototype `<body>` (same element tree, IDs, classes, order,
> inline SVGs, `data-*`), differing only in values that are *meant* to be injected at runtime
> (the JSON dataset, the nonce, escaping, `data-default-*`).
>
> **You must NOT rebuild any part of the calculator with native Bricks elements** (Container /
> Heading / Button / Form / Slider). The design lives in ~1,175 lines of scoped CSS keyed to the
> exact `ampy-calc__*` class tree, and the sliders / selectors / segmented controls / tooltips /
> monthly panel are generated at runtime by the JS engine binding to fixed element IDs
> (`ampyEvKmContainer`, `ampyEvTrio`, `ampyEvMonthly`, …). A Bricks rebuild produces a different
> DOM → the JS finds nothing and the CSS matches nothing → a broken lookalike, not a clone.
> **The only Bricks element involved is ONE Code block that calls the render function.**

---

## 1. GROUNDED PROOF THIS IS SAFE (already verified — do not re-litigate)

| Pair | Result |
|---|---|
| `_decoded/00_js-engine.js` vs `prototype/engine.js` | **byte-identical** — SHA256 `14fa0a49…46817d`, 66 945 bytes |
| `_decoded/02_styles.css` vs `prototype/styles.css` | **byte-identical** — SHA256 `3add2d1a…6a23f7`, 67 257 bytes |
| `_handover/…/code/fluentsnippets/{1-backend.php,2-engine.js,3-styles.css}` vs `_decoded/*` | **byte-identical** (all three) |
| Render DOM (`ampy_render_ev_lead_magnet()`, `PHP-HTML.php:1012–1461`) vs reference `<body>` | **structurally identical** — same tree/IDs/classes/order/SVGs/`data-*`; only runtime-injected values differ |
| CSS self-containment | **zero** `@font-face` / `@import` / `url(` / `http(s):` inside `02_styles.css` |

So 2 of the 3 files (CSS, JS) are pasted **verbatim** with no transformation, and the 3rd (PHP)
is already 1-to-1 with the reference in the parts that produce visible pixels.

---

## 2. WHICH FILE BECOMES WHICH DELIVERABLE

| # | FluentSnippet | Source file (paste VERBATIM unless noted) | FluentSnippets Run Location |
|---|---|---|---|
| **1** | **CSS** | `snippets/CSS.css` — **verbatim, byte-for-byte** | **Frontend**, output in **`wp_head`** |
| **2** | **PHP + render** | `snippets/PHP-HTML.php` — verbatim (the two §3 additions are **already baked in**) | **Frontend & Backend** (PHP snippet) |
| **3** | **JS engine** | `snippets/JAVASCRIPT.js` — **verbatim, byte-for-byte** | **Frontend**, output in **`wp_footer`** |

Ordering contract at runtime: **head CSS → body render (prints inline `window.AmpyEvCalcData` + the
markup) → footer JS**. The engine's first executable line is `if (!window.AmpyEvCalcData) return;`,
so it MUST run after the render's inline data script — which `wp_footer` guarantees. Never put the
JS in `<head>`.

> **CSS and JS are independent global snippets — the PHP does NOT enqueue them.** The render function
> only injects the font block, the inline data `<script>`, the rem `<style>`, and the HTML. Keep that
> separation; do not add `wp_enqueue_*` inside the render.

---

## 3. THE ONLY ADDITIONS ALLOWED (both are packaging, NEITHER changes a design value)

The prototype's `<head>` supplied two ambient conditions that a stock Bricks page may not. These are
the **entire** portability surface. Everything else ships untouched.

### 3A. Self-contained font loading for ALL THREE families

**What used to ship (before this package):** the render injected **JetBrains Mono only** — local woff2
via `@font-face` if present, else a JetBrains-Mono-only Google `<link>`. It injected **nothing** for Plus
Jakarta Sans (`--font-heading`) or Outfit (`--font-body`), which only worked on ampy.se because Core
Framework serves those two globally — an **undocumented host dependency**. On any page/site where they
were not already enqueued, headings and body silently fell back to `system-ui`.

**✅ Applied in `snippets/PHP-HTML.php` (~lines 1073–1090):** the render now emits **all three families**,
matching the prototype's canonical URL verbatim:

```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap
```

If a local JetBrains Mono `@font-face` woff2 exists it is kept for the mono (progressive upgrade) and only
Jakarta + Outfit come from Google; otherwise all three come from the single 3-family link. The `--font-*`
**token values did not change** — this only guarantees the families they already name resolve. Weights
covered: Jakarta 500/600/700, Outfit 400/500/600/700, JetBrains Mono variable.

*Fully self-hosted alternative (no Google call):* three local `@font-face` blocks (Jakarta, Outfit,
Mono) at the same weights — identical result, zero visual delta.

### 3B. Guaranteeing the rem scale (1rem = 10px)

Every size token is rem-anchored to `1rem = 10px` (142 rem occurrences; the fluid `--fs-*` clamps mix
rem + cqi + px). `2rem` in a clamp means 20px. If `1rem ≠ 10px`, the whole type ramp, spacing, radii
and clamp floors/ceilings rescale.

- **Prototype (`reference/index.html:6`):** `<style>html{font-size:62.5%}</style>` — GLOBAL on `<html>`
  → `1rem=10px` everywhere. Correct for a standalone page, but a global rule you would NOT want to inject
  onto a shared WordPress/Bricks host.
- **What used to render:** `<style>.ampy-calc-outer{font-size:62.5%;}</style>` — scoped to the wrapper.
  **This was a NO-OP:** `rem` resolves against the root `<html>`, never the nearest ancestor, so on a host
  whose root is the WordPress default 16px the calculator rendered at **1.6× scale**.

**✅ Applied in `snippets/PHP-HTML.php` (~line 1107):** the injected rule now targets the root but is
**page-gated**, so it only fires where the calculator exists and never touches unrelated pages:
```css
html:has(.ampy-calc-outer){font-size:62.5%;}
```
- **On ampy.se** it is redundant-but-harmless (Core Framework already sets the global root to 62.5%).
- **Anywhere else** it re-anchors the root so `rem = 10px` on the calculator page only.
- **Do NOT** add a second global `html{font-size:62.5%}` to the theme, and **do NOT** revert to the scoped
  no-op form. `:has()` is universally supported.

> **Browser-verified:** on a simulated stock 16px page with only this rule present, `.ampy-calc` computes
> to 17px — identical to the reference. **Do NOT "fix" scale by editing rem values or the `--fs-*` clamps**
> — that changes design values and breaks byte-identity. The anchor is this one injected rule.

**Documentation reconciliation — ✅ done.** The earlier `_handover/…/IMPLEMENTATION-GUIDE.md` told the
reader to ensure a **global** `html{font-size:62.5%}`, contradicting the correct choice above. That
package is **superseded by this one**, whose docs use only the page-gated `:has()` form. Ignore the old
handover.

---

## 4. PLUGIN REMOVAL — ✅ done in this package

The **earlier** handover shipped two overlapping deploy variants (a `code/fluentsnippets/` path **and** a
`code/plugin/ampy-ev-calculator/` enqueue-wrapper path). Deploying both — or mixing files across them —
double-enqueues CSS/JS, duplicates `window.AmpyEvCalcData`, and hides which is authoritative. That is
exactly the confusion Chris hit.

**This package ships ONLY the three snippets** (`snippets/CSS.css`, `snippets/PHP-HTML.php`,
`snippets/JAVASCRIPT.js`) — there is no plugin folder here. One path, three snippets, no ambiguity.
Nothing to remove.

---

## 5. EXACT FLUENTSNIPPETS RUN LOCATIONS (restate for the runbook)

- **Snippet 1 — CSS** (`snippets/CSS.css`, verbatim): **Frontend → `wp_head`.** In the head so the
  calculator paints styled on first render (no FOUC).
- **Snippet 2 — PHP + render** (`snippets/PHP-HTML.php`, §3 additions already baked in): **Frontend &
  Backend.** Backend is required for the metabox (`lead-magnet` CPT) + `save_post`; Frontend for the
  render + REST routes (`ampy-ev-calc/v1/data`, `/lead`).
- **Snippet 3 — JS engine** (`snippets/JAVASCRIPT.js`, verbatim): **Frontend → `wp_footer`.** After the
  DOM + the inline data. Never `<head>`, never `defer`/`async` in a way that reorders it before the data.

---

## 6. PLACEMENT — ONE Bricks Code element (or the shortcode)

Both resolve to the same `ampy_render_ev_lead_magnet()` output.

**Option A (recommended) — Bricks Code element, PHP/HTML tab:**
```php
<?php echo ampy_render_ev_lead_magnet( 'laddboxkalkylator' ); // by slug
// or: echo ampy_render_ev_lead_magnet( 56467 );              // by post ID
// or: echo ampy_render_ev_lead_magnet( get_the_ID() );       // auto, on the lead-magnet post
```

**Option B — the shortcode** (`snippets/PHP-HTML.php:1471`), in a Bricks Shortcode element or content area:
```
[ampy_ev_lead_magnet slug="laddboxkalkylator"]
[ampy_ev_lead_magnet id="56467"]
```

Recommend **Option A (by slug)** for the production page — explicit, avoids shortcode-parsing edge
cases in Bricks, and is what the PHP header documents first. Keep the shortcode registered as the
portable fallback.

**Container requirement:** place the Code element in a **full-width Bricks section/container** (same
effective content width as the prototype). The calculator is responsive via **container queries**
against `.ampy-calc-outer` width — a narrow column will correctly render the *narrow* layout. Do NOT
remove/rename `container-type: inline-size; container-name: ampy;` on `.ampy-calc-outer`, and do not
delete the `.ampy-calc-outer` wrapper.

---

## 7. THE STATIC HTML FALLBACK — ship it as the visual-truth REFERENCE, not the production path

The package ships a runnable, byte-identical clone in **`reference/`** (`index.html` + `data.js` +
`styles.css` + `engine.js`). Because its `<head>` supplies both ambient dependencies explicitly (global
62.5% + the 3-family font link) and its CSS/JS are the production bytes, it is **guaranteed pixel-identical**
to the intended production output with zero WordPress/Bricks/Core-Framework variables in play.

**Use `reference/` as the acceptance target Chris diffs the live Bricks page against.** It de-risks both
§3 gaps: if the live page doesn't match this file, the cause is fonts-not-loaded or root-not-62.5%.

**But it must NOT be the production deploy** — it drops the entire dynamic spine:

| | Static reference | Dynamic 3-snippet pipeline |
|---|---|---|
| Visual fidelity | identical | identical (ampy.se today; §3 makes it identical anywhere) |
| Data source | **frozen** (inlined at author time) | live from post meta / metabox (Excel-driven) |
| Lead capture | **none** | REST `/lead` endpoint + nonce |
| Per-item WP media images | **lost** | intact (`_ampy_ev_calc_images` merge) |
| Editability | hand-edit a monolith | change data in WP admin |

Deploy the **dynamic pipeline**; keep the static file as the fidelity reference / offline smoke test.

---

## 8. KEY FILE PATHS (package-relative) + current line anchors

All deliverables live in this package under `snippets/` (and `reference/`). Anchors are the **current**
line numbers (after the §3 additions were applied).

- **`snippets/PHP-HTML.php`** — the PHP snippet. Font-loading block `1073–1090`; rem `<style>`
  (page-gated `html:has(.ampy-calc-outer){62.5%}`) **`1107`**; inline data `<script>` **`1096`**;
  empty-defaults array (Path B insertion point) **`1036`**; render "post not found → return ''" gate
  **`1025`**; render fn ends (`return ob_get_clean()`) **`1461`**; shortcode **`1471`**; Excel parser ≈`688–920`.
- **`snippets/JAVASCRIPT.js`** (== `reference/engine.js`) — byte-identical; data guard
  `if (!window.AmpyEvCalcData) return;` at line **`17`**.
- **`snippets/CSS.css`** (== `reference/styles.css`) — byte-identical; font tokens `107–109`; fluid
  `--fs-*` clamps `98–105`; zero external URLs (self-contained tokens).
- **`reference/index.html`** — the runnable pixel-truth; global rem line `6`; 3-family Google font URL line `9`.
- **`data/laddbox-kalkylator-data.xlsx`** — the dataset to upload (Path A).

> The earlier `ampy-ev-calculator-handover` package (with its `code/plugin/` variant and an
> IMPLEMENTATION-GUIDE that wrongly told the reader to add a **global** `html{font-size:62.5%}`) is
> **superseded by this package** — that cleanup is already done here. Ship this package; ignore the old one.
