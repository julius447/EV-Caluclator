# BRICKS-IMPLEMENTATION — step-by-step for Chris (+ his AI agent)

Deploy the EV/Laddbox savings calculator as **exactly 3 FluentSnippets** on ampy.se, pixel-identical
to the reference. This is a **packaging job**, not a rebuild.

---

## ⛔ THE ONE RULE THAT OVERRIDES EVERYTHING

**Do NOT recreate any part of the calculator with native Bricks elements** (Container, Heading,
Button, Form, Slider, etc.). The design is ~1,175 lines of CSS keyed to an exact `ampy-calc__*` class
tree, and the sliders / selectors / segmented controls / tooltips / monthly panel are built at runtime
by the JS engine binding to fixed IDs. A Bricks rebuild makes a different DOM → the JS finds nothing,
the CSS matches nothing → a broken lookalike.

**The only Bricks element for the calculator is ONE Code block that calls the render function.** The 3
snippets carry the entire design; Bricks just provides the page and the mount point.

---

## STEP 0 — Files you deploy (three, and only three)

| Snippet | File in this package | Paste |
|---|---|---|
| CSS | **`snippets/CSS.css`** | **VERBATIM** (byte-identical to `reference/styles.css`) |
| JS | **`snippets/JAVASCRIPT.js`** | **VERBATIM** (byte-identical to `reference/engine.js`) |
| PHP + render | **`snippets/PHP-HTML.php`** | **VERBATIM** — the two portability fixes are already baked in (Step 3) |

The CSS and JS are **byte-identical to the proven reference** (SHA256 verified). Do not touch them, do
not reformat, do not minify by hand. `PHP-HTML.php` already includes the two Step-3 fixes — paste it
verbatim too (do not re-edit it).

> This package ships **only** the three snippets — there is no plugin folder to confuse it with. Deploy
> the three files as three FluentSnippets; nothing else.

---

## STEP 1 — Create the 3 FluentSnippets with these exact run locations

1. **CSS snippet** → paste `snippets/CSS.css` → **Run Location: Frontend**, output in **`wp_head`**.
   (In head so the calculator paints styled on first render — no flash.)
2. **PHP snippet** → paste `snippets/PHP-HTML.php` (verbatim — fixes already baked in) → **Run Location:
   Frontend & Backend** (a PHP snippet). Backend is needed for the metabox + save; Frontend for the
   render + REST routes.
3. **JS snippet** → paste `snippets/JAVASCRIPT.js` → **Run Location: Frontend**, output in **`wp_footer`**.
   **Never `<head>`.** The engine's first line is `if (!window.AmpyEvCalcData) return;`, and the data
   global is printed by the render inside the page body — so the JS must run *after* it. `wp_footer`
   guarantees that.

Runtime order (do not disturb): **head CSS → body render (inline data + HTML) → footer JS.**

---

## STEP 2 — Verify fonts + rem on the target page (the two silent-failure gaps)

The prototype's `<head>` supplied two things a stock page may not: the 3 web fonts and `1rem = 10px`.
On ampy.se both are already provided by Core Framework — but **verify, don't assume.**

**Fonts** — the render already injects **all three families** (Step 3A, baked in). On the live console,
check a **used** weight (the design renders Jakarta at 500/600/700, never 400):
```js
document.fonts.status                                  // "loaded" when fonts are ready
document.fonts.check('700 16px "Plus Jakarta Sans"')   // true when loaded
document.fonts.check('400 16px "Outfit"')              // true when loaded
```
> `check('16px "Plus Jakarta Sans"')` defaults to weight **400**, which the design never uses for
> Jakarta, so it can read `false` even when the font is loaded — a false negative. Also confirm the H1
> visibly renders in Plus Jakarta Sans. If headings/body genuinely fall back to system-ui, confirm the
> 3-family font link (Step 3A) is present in the rendered `<head>`.

**Rem scale** — on the live page:
```js
getComputedStyle(document.querySelector('.ampy-calc')).fontSize   // must be ≈17px, NOT ≈27px
```
≈27px means the root is 16px and the anchor was lost → confirm the page-gated
`html:has(.ampy-calc-outer){font-size:62.5%}` rule (Step 3B, baked in) is present in the rendered head.
On ampy.se (Core Framework's global 62.5%) it will already read ≈17px and you need nothing.

---

## STEP 3 — The two portability fixes are ALREADY BAKED INTO `PHP-HTML.php` — just verify

> ⚠️ **Do NOT re-apply, "replace", or "restore" anything in this step.** The shipped
> `snippets/PHP-HTML.php` already contains both fixes below. This is a *confirmation*, not an edit.
> Reverting either one to its older form is the single fastest way to break 1-to-1. Both fixes are pure
> packaging — they change **no** design value.

### 3A. All three font families are ALREADY injected (`PHP-HTML.php` ~lines 1073–1090)

The render already emits **Plus Jakarta Sans + Outfit + JetBrains Mono** (the prototype's exact Google
URL). If a local JetBrains Mono woff2 exists it is used for the mono and only Jakarta + Outfit come from
Google; otherwise all three come from the one 3-family link. Confirm the rendered page `<head>` contains:
```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700…
```
(An *earlier* build injected JetBrains Mono **only** and relied on the theme for Jakarta/Outfit — that is
now fixed. **Do not revert to a mono-only link.**) Token values are untouched; this only guarantees the
families the `--font-*` tokens already name resolve.

### 3B. The rem anchor ALREADY targets the root, page-gated (`PHP-HTML.php` ~line 1107)

The render already emits:
```css
<style>html:has(.ampy-calc-outer){font-size:62.5%;}</style>
```
This re-anchors the root to `1rem = 10px`, but only on pages that contain the calculator. It replaced an
earlier `.ampy-calc-outer{font-size:62.5%}` that was a **no-op** (rem is root-relative) and left the
calculator at 1.6× on any non-62.5% host. **Verified in a browser:** on a stock 16px page with only this
rule, `.ampy-calc` resolves to 17px — identical to the reference. **Do not revert to the scoped form.**

> **On ampy.se** this rule is redundant-but-harmless (Core Framework already sets the global root to
> 62.5%). **Do NOT add a separate GLOBAL `html{font-size:62.5%}` to the theme** — on any page that didn't
> already do it, that would shrink every other rem-based Bricks element. **Never** "fix" rem by editing
> the `--fs-*` clamps or any rem value — that breaks byte-identity with the proven reference. The anchor
> is this one injected rule, already in place.

---

## STEP 4 — Place ONE Bricks Code element (or the shortcode)

On the calculator page, in a **full-width Bricks section/container**, add a single **Code element**
(PHP/HTML tab):

```php
<?php echo ampy_render_ev_lead_magnet( 'laddboxkalkylator' ); ?>
```
(or by ID: `ampy_render_ev_lead_magnet( 56467 )`; or on the lead-magnet post itself:
`ampy_render_ev_lead_magnet( get_the_ID() )`.)

**Shortcode alternative** (Bricks Shortcode element or any content area):
```
[ampy_ev_lead_magnet slug="laddboxkalkylator"]
```

Recommended: the **Code element by slug** — explicit, avoids Bricks shortcode-parsing edge cases.

**Why full-width:** the calculator is responsive via **container queries** against `.ampy-calc-outer`
width (not the viewport). A narrow Bricks column will correctly render the *narrow* layout — that is
the container query working, not a bug. Give it the same effective width as the prototype for the
desktop layout. Do NOT remove/rename `container-type: inline-size; container-name: ampy;` on
`.ampy-calc-outer`, and do not delete the wrapper.

---

## STEP 5 — Get the DATA in (pick ONE path)

The render pulls its dataset from a **`lead-magnet` custom post type**. Two distinct failure modes:
- **No matching published `lead-magnet` post found → the render returns an empty string**
  (`PHP-HTML.php` ~line 1025), so the Bricks Code element outputs **nothing at all** — no shell, no
  error. A blank spot where the calculator should be is almost always this.
- **Post found but its data meta is empty → the shell paints but every value shows "—"** (no
  cars/chargers). The render falls back to empty-defaults arrays at `~line 1036`.

> ⚠️ **The `lead-magnet` CPT is an EXTERNAL dependency this package does NOT create.** On ampy.se it
> already exists (the battery/LED calculators use it). On any install where it doesn't, register it first
> (theme `functions.php`, a mu-plugin, or a 4th PHP snippet):
> ```php
> add_action('init', function () {
>   register_post_type('lead-magnet', [
>     'label' => 'Lead Magnets', 'public' => true, 'show_ui' => true,
>     'supports' => ['title','editor','custom-fields'], 'show_in_rest' => true,
>   ]);
> });
> ```

### Path A — Dynamic Excel pipeline (production, owner-editable) — RECOMMENDED for ampy.se
1. Confirm the **`lead-magnet` CPT exists** (see the note above; register it if not).
2. Create/identify the lead-magnet post; note its slug/ID.
3. Upload the **provided** `data/laddbox-kalkylator-data.xlsx` in the "EV Charging Calculator — Settings"
   metabox. **Do NOT regenerate the xlsx** (the parser has tool-specific caveats; re-saving in the wrong
   tool can silently drop rows).
4. **Read the metabox status** — it must say `OK — N EV models, M chargers imported`. A red/hard-fail
   keeps the old data rather than importing zero.
5. Point the Step 4 Code element at that post slug/ID.

### Path B — Inlined static data (locked clone, zero admin steps, no CPT/Excel)
1. Open the bundled **`reference/data.js`** — its `window.AmpyEvCalcData = { … }` object is the exact,
   verified dataset (the same `data.js` the reference page uses).
2. In `PHP-HTML.php`, the render builds `$js_data` by `array_merge`-ing over an **empty-defaults array at
   ~line 1036** (`'EV_MODELS' => [], 'CHARGERS' => [], 'REGIONS' => …`). Replace those empty defaults
   with the arrays from `reference/data.js` (translated to PHP), so the render always has data with no
   post meta. Eliminates the CPT / metabox / Excel / parser as failure points.
3. Still place the Code element (Step 4); the CSS/JS snippets are unchanged.

Cost: changing prices/models later needs a code edit instead of an Excel re-upload. Simplest for a pure
"3 files, pixel-perfect, no admin" clone. **This choice is data-plumbing only — it changes no CSS,
markup, or design value.**

**Confirm either path worked:** defaults (Tesla Model Y + Zaptec Go + SE3 + DC + 100 % + 20 000 km)
reproduce hero **≈17 276 kr/år**, monthly **1 721 / 282 / 1 440**, 10-yr **168 266 kr** *(net of the
box — cumulative savings 172 756 kr − 4 490 kr net price)*, Att betala **4 490 kr**. If everything shows
"—", the data didn't load (CPT/meta/Excel or script order); if the element is entirely blank, no
`lead-magnet` post was found (see above).

---

## STEP 6 — Caching / optimization (do this last, carefully)

The render prints an **inline `window.AmpyEvCalcData`** script and multiple **inline SVGs**. Aggressive
optimizers can break them:
- **Exclude the inline data script + `JAVASCRIPT.js` from JS defer/combine/Rocket Loader.** They must keep
  document order and not be deferred ahead of the inline data (else same silent blank as a script-order
  bug).
- Do NOT let an HTML/JS minifier touch the inline JSON — it is emitted with
  `JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES` to keep å/ä/ö and URLs intact. Leave those flags.
- Turn caching/minification **off**, confirm pixel-perfect, then re-enable one optimization at a time
  and re-verify. Test on the **live cached** page (not just logged-in preview, which often bypasses cache).

---

## STEP 7 — Verify against the fidelity checklist

Open `FIDELITY-CHECKLIST.md` and walk it with two tabs: the static reference
(`reference/index.html` — byte-identical to production output, no WordPress in play) and the live
Bricks page. Run the **§0 fast gates** first; then spot-diff `getComputedStyle` on the key elements
(§12) between reference and live. Verify at **1440px and ~375px**. Any delta traces to one of: fonts
not loaded (confirm Step 3A present), rem not 62.5% (confirm Step 3B present), theme CSS bleed (fix
narrowly inside `CSS.css`), or an optimizer mangling (Step 6).

---

## Quick diagnostics (hand these to the AI agent)

- **The Code element is entirely blank (no shell at all), no error** → no matching published
  `lead-magnet` post was found and the render returned an empty string. Create/point at a published
  `lead-magnet` post (Step 5), or register the CPT if it doesn't exist.
- **Shell paints but everything shows "—", no console error** → data didn't load. Check
  `window.AmpyEvCalcData` is a valid object in the console; check the CPT/meta/Excel (Step 5) and that
  `JAVASCRIPT.js` is the last script (Step 1/6).
- **Whole calculator looks 1.6× too big** → root not 62.5%: the `html:has(.ampy-calc-outer){…}` rule
  (Step 3B, already baked in) got stripped/overridden or the page has an unusual root. Confirm it is
  present in the rendered head; do NOT revert to the scoped form or add a global `html{62.5%}`.
- **Headings/body look "off" but layout works** → Jakarta/Outfit not loaded: confirm the 3-family font
  link (Step 3A, already baked in) is present in the rendered head.
- **A control looks slightly wrong (uppercase button, odd input border, list bullets)** → theme CSS
  bleed. Add the explicit prototype value to the matching `.ampy-calc__*` selector inside `CSS.css`.
  Never `all:revert`/`all:unset`.
- **Layout won't reflow on resize** → the container context was dropped. Confirm `.ampy-calc-outer`
  still has `container-type: inline-size; container-name: ampy;`.
