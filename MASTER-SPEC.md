# Ampy Laddbox-kalkylator — MASTER IMPLEMENTATION SPEC

**Owner:** Ampy · **Product:** Swedish laddbox lead-magnet (hur mycket sparar du på att ladda hemma → få offert)
**Author:** PM / Product lead · **Date:** 2026-06-10 · **Round:** Iteration 5
**Sources synthesized:** verified prototype (`prototype/index.html`, `engine.js`, `styles.css`, `data.js`, `CHANGES.md`), CRO/lead-magnet expert audit (12 findings), catalogue synthesis (`research/laddbox-catalogue.json`, 16 items validated).

This is the single source of truth for this round. It supersedes scattered audit text. Everything below is concrete, with acceptance criteria. Build order is in §4; QA gate is in §5.

---

## 0. Reading this spec / hard ground rules

- **Prototype is the transplant source.** Every change lands first in `prototype/` (index.html + engine.js + styles.css + data.js), is verified in-browser with `node --check` clean + 0 console errors, THEN ported to WordPress (`../_decoded/01_backend.php` markup, `../_decoded/00_js-engine.js`, `../_decoded/02_styles.css`, and the Excel/post-meta data). Mirror the CHANGES.md "Port to (WP)" column.
- **Design system is mandatory.** All new UI uses Ampy semantic tokens, fluid type (`--fs-*`), existing component patterns. Do NOT invent components where one exists (the AC/DC `.ampy-calc__toggle` is the reuse target for the ROI control). Consult the `ampy-design-system` skill before writing CSS.
- **Honesty moat is non-negotiable.** Every displayed number must reconcile to the methodology. No fabricated zeros for price-less boxes; no NaN.
- **The calculator currently ships a `car` (EV model) selector AND a `charger` (laddbox) selector.** This round does not remove the car selector (it drives energy/efficiency). All "selected box" language below refers to the **charger/laddbox** selector. Leave the EV selector intact unless a finding says otherwise.

### ⛔ BLOCKER discovered during synthesis — Grön Teknik double-deduction (read before any pricing work)

The new catalogue (`research/laddbox-catalogue.json`) stores `priceSek` as the **already-discounted, post-Grön Teknik, incl-moms installed price** (e.g. Amina S `4350`, Aura `14550`). But the current engine treats `charger.priceSek` as the **gross/pre-Grön-Teknik** price and deducts 48,5% again (`engine.js` lines 234–239: `gronTeknik = priceSek * 0.485; netCost = priceSek − gronTeknik`). The old `data.js` placeholders (Amina S `21900`) were gross, which is why it "worked". **If we drop the new catalogue in unchanged, every "Att betala" and payback figure is wrong (deducts the subsidy twice).**

**Decision required from owner (see §3 Q-C).** Recommended resolution, assumed for this spec: **the catalogue price IS the net "Att betala" price.** Therefore:
- Rename/treat `priceSek` as **net installed price** (`netCost = charger.priceSek`).
- Derive gross for the breakdown line as `grossPrice = netCost / (1 − 0.485)` (≈ catalogue "ord."/2 — sanity-check against the "ord." column) OR carry an explicit `grossPriceSek` field from the catalogue's "ord." price (≈ 2× the shown price). Preferred: **add `grossPriceSek` to the data model** (= the "ord." price, e.g. Amina S `8700`) so both numbers are real, not back-derived, and Grön Teknik = `grossPriceSek − netCost`.
- The Grön-Teknik-cap logic (`min(rate×gross, 50000×applicants)`) still applies to `grossPriceSek`; for consumer boxes well under the cap this is a no-op, but keep it so multi-applicant/expensive-box cases stay correct.

This is folded into §1 item C below. **Do not ship pricing without resolving this.**

---

# §1 — OWNER REQUIREMENTS (exact spec per item)

Ordered to match the owner's brief. Each is a hard requirement and must be reflected in the final build.

---

## A. Full catalogue: 14 consumer boxes (fixed order) + 2 offert-only företag/BRF boxes

**Requirement:** Show ALL 14 of Ampy's consumer laddboxar in a fixed order, PLUS Zaptec Pro and Garo Entity Pro (företag/BRF) which have no fixed price and require an offert.

**Fixed display order (from `research/laddbox-catalogue.json` — DO NOT sort, render in array order):**

| # | id | Name | segment | priceSek (net, kr) | grossPriceSek (ord., kr) | badge | offertOnly |
|---|----|------|---------|--------------------|--------------------------|-------|-----------|
| 1 | `zaptec-go` | Zaptec Go laddbox | consumer | 4 490 | 8 980 | — | false |
| 2 | `zaptec-go-2` | Zaptec Go 2 laddbox | consumer | 5 890 | 11 780 | — | false |
| 3 | `easee-charge-up` | Easee Charge Up | consumer | 4 390 | 8 780 | — | false |
| 4 | `nexblue-edge-2` | NexBlue Edge 2 | consumer | 4 190 | 8 380 | — | false |
| 5 | `go-e-gemini-flex-2-0` | go-e Gemini Flex 2.0 | consumer | 4 990 | 9 980 | — | false |
| 6 | `tesla-wall-connector` | Tesla Wall Connector | consumer | 4 450 | 8 900 | — | false |
| 7 | `charge-amps-luna` | Charge Amps Luna | consumer | 4 850 | 9 700 | — | false |
| 8 | `charge-amps-halo` | Charge Amps Halo | consumer | 4 990 | 9 980 | — | false |
| 9 | `charge-amps-dawn` | Charge Amps Dawn | consumer | 6 850 | 13 700 | — | false |
| 10 | `charge-amps-aura` | Charge Amps Aura | consumer | 14 550 | 29 100 | — | false |
| 11 | `defa-power` | Defa Power | consumer | 5 250 | 10 500 | — | false |
| 12 | `amina-s` | Amina S | consumer | 4 350 | 8 700 | **Rekommenderas** | false |
| 13 | `garo-entity-home` | Garo Entity Home | consumer | 5 310 | 10 620 | — | false |
| 14 | `wallbox-pulsar-max` | Wallbox Pulsar Max | consumer | 4 425 | 8 850 | — | false |
| 15 | `zaptec-pro` | Zaptec Pro | **business** | `null` | `null` | **Offert** | **true** |
| 16 | `garo-entity-pro` | Garo Entity Pro | **business** | `null` | `null` | **Offert** | **true** |

**Schema (add to every charger in data.js / Excel import):**
- `segment`: `"consumer"` | `"business"`
- `offertOnly`: boolean (true for the 2 business boxes)
- `priceSek`: number (net installed, incl. moms, post-Grön Teknik) | `null`
- `grossPriceSek`: number (the "ord." price, pre-Grön Teknik, incl. moms) | `null`  ← NEW, resolves the double-deduction blocker
- `imageUrl`: string (real product photo) — already present in catalogue
- `slug` → real product-page URL (already present in catalogue; replaces old `'#'`)
- keep `id`, `name`, `description`, `badge`, `maxPowerKw`, `available`

**Selector grouping (`renderSelector`):** while iterating, when `item.segment` changes from the previous item, inject a non-selectable group header `<li role="presentation" class="ampy-calc__selector-group" aria-hidden="true">` — `"För hemmet"` above #1, `"För företag & BRF"` above #15. These are labels, never options (no `role="option"`, not focusable, skipped by keyboard nav). For `offertOnly` items render the `Offert` badge instead of any price subtitle.

**Default boot selection:** must pick the first **consumer + available** box (so the calculator boots with real numbers — never a business box). Adjust `init()` charger fallback to `CHARGERS.find(c => c.available && c.segment === 'consumer')`.

**Acceptance:**
- Selector lists exactly 16 boxes in the table order, under two visible group labels.
- The 14 consumer boxes produce price-derived results; the 2 business boxes never produce NaN anywhere.
- Default boot = a consumer box (Zaptec Go unless owner pins a different `data-default-charger-id`).
- `node --check` clean; 0 console errors.

---

## B. Offert-only boxes = a separate high-intent path (no price / no payback / no Grön Teknik math)

**Requirement (owner #1, second half):** the 2 business boxes have no price and require an offert. They must not flow through the consumer payback/Grön-Teknik math.

**Behaviour when an `offertOnly` box is selected:**
- `calculateFor` returns `{ ...savingsFields, offertOnly:true, netCost:null, paybackYears:null, gronTeknik:null, grossPrice:null }`. It STILL computes the segment-agnostic savings: `annualSaving`, `publicKwh`, `publicRate`, `homeRate`, and the new monthly figures (§1 item D). The monthly publik-vs-hemma comparison is true for a BRF/company too and stays visible.
- `renderSingleResult`: hide every price-derived element — the "Att betala" tile (`#ampyEvNetPayTile`), the (removed) payback tile, the Grön Teknik breakdown line; **force the ROI control into "Utan investering" and disable it** (you cannot compute investment without a price). On switching back to a consumer box, re-enable it and restore the prior consumer `includeInvestment` value.
- Hero sub becomes offert-framed: `"Ladda hemma i stället för publikt — vi tar fram ett offertpris för er anläggning."`
- Primary CTA label swaps to **"Få offert för företag/BRF"**; the offert-summary echo (§1 item H) omits the krona-precise payback claim and reads `"Vi tar fram ett anläggningsanpassat pris för er anläggning."`
- `buildPayload`: send `chargerSegment` + `offertOnly:true` and `null` for price/payback/gronTeknik (do NOT fabricate `0`).

**Acceptance:** selecting Zaptec Pro or Garo Entity Pro → monthly + annual savings still render and reconcile; no price/payback/Grön-Teknik element visible; ROI control disabled + showing "Utan investering"; CTA reads "Få offert för företag/BRF"; payload carries `offertOnly:true` + null price fields; switching back fully restores the priced consumer view; zero NaN.

---

## C. Defaults: Andel offentlig laddning = 100 %, Körsträcka = 20 000 km/år

**Requirement (owner #2, #3):** change defaults from 50 %→**100 %** and 15 000→**20 000 km/år**.

Both are existing slider steps (`PCT_STEPS` includes 100; `KM_STEPS` includes 20000) — no step changes needed, defaults only.

**Edits:**
- `data.js` → `ADVANCED_DEFAULTS = { annualKm: 20000, publicChargingPct: 100, publicChargingType: "dc" }`.
- `engine.js` → the `ADVANCED_DEFAULTS` `Object.assign` fallback object (lines 45–49) updated identically to `20000 / 100 / "dc"` so a missing-data boot also uses the new defaults.
- WP: same values in the Excel "Advanced" sheet / post-meta defaults.
- The existing init snap-to-nearest-step lands cleanly on 100 and 20000 — no logic change.

**Honest framing at 100 % (folded in, see §2 P1):** at 100 % the engine models "ALL of today's public charging moves home". The hero sub MUST state the assumption (`"≈ X kr/år om du flyttar all din publika laddning hem"`); the Andel tooltip frames 100 % as "din nuvarande publika laddning som du kan flytta hem". This keeps the big number honest.

**Acceptance:** fresh load shows **100 %** on the Andel slider and **20 000 km/år** on the Körsträcka slider, both ticks active; hero recalculates to the 100 %/20 000 numbers; `node --check` clean.

---

## D. REMOVE payback-kurva → REPLACE with MONTHLY cost comparison (publik vs hemma, kr/månad + difference)

**Requirement (owner #4):** delete the payback chart for this calculator. Add a concrete monthly comparison: cost to charge publicly vs at home (kr/månad each) + the difference. Households feel monthly cash, not a 10-year curve.

### The math (derive from existing engine quantities — reconciles exactly to the annual hero)

In `calculateFor`, after `publicKwh`, `publicRate`, `homeRate`:
```
monthlyPublicCost = publicKwh * publicRate / 12   // what those kWh cost if charged publicly
monthlyHomeCost   = publicKwh * homeRate   / 12   // same kWh charged at home
monthlySaving     = monthlyPublicCost - monthlyHomeCost
```
Reconciliation guarantee: `(monthlyPublicCost − monthlyHomeCost) × 12 === annualSaving` exactly (same `publicKwh × rateGap`). **Verified at the new defaults (100 % / 20 000 km, DC 5,50, SE3 home 1,90, Tesla Model Y):**
`publicKwh ≈ 3 756 kWh/år` → public ≈ **1 721 kr/mån**, home ≈ **595 kr/mån**, saving ≈ **1 127 kr/mån** (× 12 ≈ 13 521 kr/år = the annual hero). Re-verify the exact kWh against the real EV efficiency when the signed Excel lands.

### The visual (replaces the whole `.ampy-calc__chart-block`)

A compact two-column panel placed directly under the hero, **above** "Hur besparingen räknas". Reuse trio token styles — no new color system.

```
┌─────────────────────────────┬─────────────────────────────┐
│  PUBLIK LADDNING IDAG        │  HEMMA EFTER INSTALLATION   │  ← labels --fs-xs, uppercase, muted
│  ≈ 1 721 kr/mån             │  ≈ 595 kr/mån               │  ← mono, --fs-lg
│  (warning colour value)      │  (success colour value)     │
├─────────────────────────────┴─────────────────────────────┤
│  Du sparar  ≈ 1 127 kr/mån                                 │  ← full-width delta row, --state-success, bold
└────────────────────────────────────────────────────────────┘
```

- New block `.ampy-calc__monthly`: two `.ampy-calc__monthly-col` tiles + a full-width `.ampy-calc__monthly-delta` row.
- Column labels: **"Publik laddning idag"** (value in `--state-warning`) / **"Hemma efter installation"** (value in `--state-success`) — the "idag vs efter" framing makes it today-vs-after, not two simultaneous costs.
- Delta row: "Du sparar" + mono value in `--state-success`, bold.
- Animate the three numbers with the existing `animateNumber()` (keys `evMonthlyPublic` / `evMonthlyHome` / `evMonthlySaving`).
- Keep the existing "Hur besparingen räknas" per-kWh breakdown directly beneath as evidence.
- For offert-only boxes the monthly block STILL renders (segment-agnostic).
- Add `.ampy-calc__monthly` to the staggered-reveal list in styles.css (in place of `.ampy-calc__chart-block`).

### What to DELETE (full chart teardown — no orphans)

- **index.html:** the entire `.ampy-calc__chart-block` (lines ~252–281) AND the `Payback-tid` trio tile (`#ampyEvPaybackTile`, lines ~233–239) AND the now-dead `is-no-payback` empty-state.
- **engine.js:** `renderPaybackChart()` + its call in `renderSingleResult`; the `ampyEvChartKeyframes` style injection; all `$('ampyEvChart*')`, `ampyEvBe*`, `is-no-payback`/`is-savings-only`/`is-no-be`/`is-be-early` references; the chart empty-state strings.
- **styles.css:** `.ampy-calc__chart*`, `.ampy-calc__be-*`, `.ampy-calc__chart-block`, `.ampy-calc__chart-head`, `@keyframes ampy-draw`, `@keyframes ampy-zone-fade`, and the `@container` rules targeting `.ampy-calc__chart`.

**Note on the 10-year tile:** the secondary trio currently has three tiles (10-yr cumulative, Att betala, Payback). Payback is removed here. **Recommendation (see §2 P1):** also retire the "Sparar på 10 år" cumulative tile for this calculator — the owner has explicitly reframed value around the *month*, and a 10-yr number reintroduces the long-horizon framing we're removing. Keep only "Att betala" in the trio (consumer boxes). Confirm in §3 Q-D. If owner wants to keep the 10-yr tile, it stays as a single tile; the trio grid reflows via `auto-fit`.

**Acceptance:** no SVG chart anywhere in the DOM; a monthly panel shows publik vs hemma kr/mån + a bold difference; `(public − home) × 12` equals the annual hero saving to the krona at default AND at several slider positions; numbers count-up on change; offert-only boxes still show the monthly panel; no orphaned chart JS/CSS/ids; `node --check` clean; 0 console errors.

---

## E. ROI toggle REDESIGN — kill the bordered box, use a polished segmented control

**Requirement (owner #5):** the "Med investering / Utan investering" control visually breaks — it sits in an awkward bordered, filled box (`.ampy-calc__roi-toggle-row`) above the hero with a redundant `role=switch` + duplicated state caption. Redesign to a best-practice control.

**Design:** replace the `role=switch` + bordered row with a **two-pill segmented control**, styled with the existing `.ampy-calc__toggle` pattern (same component as AC/DC). A segmented control shows BOTH states at once — clearer than a switch whose meaning depends on reading a caption — and removes the redundant state span.

**Markup (replace `.ampy-calc__roi-toggle-row` + `.ampy-calc__switch`):**
```html
<div class="ampy-calc__toggle ampy-calc__toggle--investment"
     role="group" aria-labelledby="ampyEvInvestmentToggleLabel" id="ampyEvInvestmentToggle">
  <button type="button" class="ampy-calc__toggle-option" data-value="with"    aria-pressed="true">Med investering</button>
  <button type="button" class="ampy-calc__toggle-option" data-value="without" aria-pressed="false">Utan investering</button>
</div>
```
Keep the label `#ampyEvInvestmentToggleLabel` + the tooltip `i`. **Remove** `#ampyEvInvestmentToggleState` (the caption) and all `.ampy-calc__switch*` / `.ampy-calc__roi-toggle-row` CSS.

**Styling:** reuse `.ampy-calc__toggle` (pill group, `--bg-subtle` track, `--action-primary` active fill, white active text). Because this control sits on the dark `--bg-surface` (not the light input card like AC/DC), add an on-surface variant `.ampy-calc__toggle--investment` so the inactive track/text read correctly on dark: inactive text `--on-surface-text-muted`, active fill `--action-primary` with white text (verify AA on dark). **No border, no box.** Place it as a quiet inline control under the hero eyebrow (right-aligned or centered), not as a settings panel. `≥44px` touch targets are already covered by the `@media (pointer: coarse)` rule on `.ampy-calc__toggle-option`. Honour `prefers-reduced-motion` (transition ≤150ms).

**Engine:** rename `updateInvestmentToggle()` to set `aria-pressed` on both buttons from `state.includeInvestment` (`with` ⇒ true pressed when `includeInvestment`). Click handler maps `data-value` → boolean. Wire via the existing `wireToggle` helper pattern. For offert-only boxes, add `.ampy-calc__toggle--disabled` + `aria-disabled="true"` on both buttons and force `without`.

**Acceptance:** no bordered ROI box; a two-pill segmented control shows both states with the active one highlighted; keyboard (Tab + Enter/Space) toggles it; `aria-pressed` stays in sync; the redundant caption is gone; it reads as part of the hero, not a settings panel; disabled + muted for offert-only boxes; AA contrast on the dark surface.

---

## F. Slider drag perf — kill the transition-on-every-pointermove lag

**Requirement (owner #6):** slider drag is laggy on desktop AND mobile. The thumb visibly trails the pointer.

**Root cause (confirmed in code):** `updateVisual()` writes `thumb.style.left` and `fill.style.width` on every `pointermove`, but `.ampy-calc__slider-fill` has `transition: width var(--motion-normal)` (300ms) and `.ampy-calc__slider-thumb` has `transition: left var(--motion-normal)`. Every drag pixel restarts a 300ms width/left animation on a continuously-changing property → trailing. Animating `left`/`width` also forces layout each frame.

**Fix (two parts):**

1. **Don't transition position during interaction, and move off layout-triggering props.**
   - Switch positional updates from `left`/`width` to `transform: translateX(...)` (thumb, GPU-composited, no layout) and `transform: scaleX(...)` or a translate-driven width (fill). Preserve the thumb's `translate(-50%,-50%)` centering (wrap the percentage translate in an inner element, or compose with `translate3d`).
   - Add `.is-dragging` on `pointerdown`, remove on `pointerup`/`pointercancel`. While `.ampy-calc__slider.is-dragging` is set → `transition: none` on fill + thumb.
   - Non-dragging default keeps a **`--motion-fast` (150ms)** ease for keyboard arrow + tick taps only — NOT 300ms on the live-dragged property.

2. **rAF-coalesce pointermove.** Store the latest `clientX`; if no frame is pending, `rafId = requestAnimationFrame(flush)` where `flush` calls `pickByX(lastX)` and clears `rafId`. On `pointerup`/`pointercancel`, cancel any pending rAF. This caps work at one update per frame instead of one per event.

Respect `prefers-reduced-motion` (already globally forced to ~0ms — instant snaps).

**Acceptance:** dragging on desktop and a real touch device tracks the pointer with no visible lag/easing trail; profiling shows no per-move 300ms transition and no per-frame layout from `left`/`width`; keyboard arrows + tick taps still animate smoothly (≤150ms); reduced-motion shows instant snaps; 0 console errors.

---

## G. Copy fix: "belysningsexpert" → "laddbox-expert" (LED-calc leftover)

**Requirement:** the form intro must not say "belysningsexpert".

In the current prototype `index.html` the intro already reads "En laddbox-expert återkommer…" (line 299) — but the owner is explicit, and the prototype + deployed snippet can drift. **Audit every surface:** `prototype/` AND `../_decoded/01_backend.php` AND `../_decoded/00_js-engine.js`. `grep -ri 'belysning\|belysningsexpert\|LED\|lampor'` and replace any human-facing instance with the laddbox equivalent.

**Canonical string:** `"En laddbox-expert återkommer inom 24 timmar med en exakt offert."` Verify the form intro, the success toast, and any email subject/body use laddbox wording.

**Acceptance:** `grep -ri 'belysning'` over `prototype/` and `_decoded/` returns zero human-facing hits; form intro + success copy reference laddbox/laddbox-expert; CHANGES.md notes the audit.

---

## H. Single "Få offert" flow — remove the "Maila kalkylen" email path; show ONE product image of the selected box

**Requirement:** remove the secondary "Maila kalkylen" email path; one clean "Få offert" flow that shows ONE product image of the selected laddbox.

### H1 — Remove the secondary email path entirely

Two competing CTAs split intent, and the email path collects a weaker, consent-bypassing lead (`buildPayload` comments note it skips the anti-bot gate). Design system = one primary action per section.

**Delete:**
- index.html: the entire `.ampy-calc__cta-secondary` block (lines ~368–380) — `#ampyEvEmailForm`, `#ampyEvEmailInput`, `#ampyEvEmailSubmit`/`Label`, `#ampyEvEmailSuccess`/`Text`.
- engine.js: `submitEmailForm`, its `addEventListener` bind (line 927), the `email_calculation` payload type, the `email_calc_submit` event, and the "Maila kalkylen till mig" strings.
- styles.css: `.ampy-calc__cta-secondary`, `.ampy-calc__email-row`, and the `@container` rules targeting `.ampy-calc__email-row` (lines ~1021–1023).

Result: exactly one CTA → one lead form (name/email/phone/zip + consent) → success/error → product link. Every lead now passes the consent + honeypot + timing gate. (If Ampy later wants "send me the calc", fold it into the one form as an optional checkbox — not a second flow.)

### H2 — Product image inside the "Få offert" form (the value anchor)

**Interpretation (stated assumption — see §3 Q-A):** "1 bild" = show the **selected box's product image inside the expanded lead form**, as an offert-summary header. We build to this assumption.

At the top of the opened lead form (`#ampyEvLeadForm`, as its first child), render an offert-summary header:
```html
<div class="ampy-calc__offert-summary">
  <span class="ampy-calc__offert-img">
    <img id="ampyEvOffertImg" alt="" loading="lazy" decoding="async" width="..." height="...">
  </span>
  <span class="ampy-calc__offert-meta">
    <span id="ampyEvOffertName">{box name}</span>
    <span id="ampyEvOffertEcho">Du sparar ≈ {X} kr/mån genom att ladda hemma</span>
  </span>
</div>
```
- `syncOffertSummary()` runs on form-open AND on charger change while the form is open: sets `img.src = charger.imageUrl` (else inject `chargerIconSvg()` and hide `<img>` — graceful fallback so placeholder data never shows a broken-image glyph), `img.alt = charger.name`, name text, echo = `"Du sparar ≈ " + fmtKr(monthlySaving) + " kr/mån genom att ladda hemma"`.
- Image box ~6.4rem square, `--radius-md`, `--bg-subtle`, `object-fit: contain`, lazy-loaded.
- For offert-only boxes the echo reads `"Vi tar fram ett anläggningsanpassat pris för er anläggning."` (no krona claim).

**Acceptance:** only one CTA + one form in the results card; no "Maila kalkylen" anywhere; `submitEmailForm` + all email-only ids gone; no dangling `getElementById` on removed ids. Opening the form shows the selected box's photo + name + a live value echo; changing the box while the form is open updates image/name/echo; missing `imageUrl` falls back to the icon with no broken glyph; alt = box name; image lazy-loaded. `node --check` clean.

---

## I. "Läs mer om {box}" → auto-named, links to the selected box's product page

**Requirement:** "Läs mer om {laddbox name}" must auto-show the selected box's name and link to its product page.

The mechanism already exists (`#ampyEvProductLink` sets `#ampyEvProductLinkName` to `charger.name`, hidden when `slug === '#'`). The gap was placeholder slugs. The catalogue now ships **real** `slug` URLs (e.g. `https://ampy.se/laddboxar/amina-s/`) for all 16 boxes.

**Edits:**
- Use `charger.slug` (real URL) as the href; show the link whenever the slug is a real URL (keep the graceful hide if any slug is still `'#'`/empty).
- Link text stays auto-named: `"Läs mer om " + charger.name`; updates on charger change (existing behaviour).
- **Reposition** the link to sit directly under the product image / value echo (or immediately under the primary CTA) — not buried at the very bottom — so a researcher can deep-dive without scrolling past the form.
- For offert-only boxes the link points at that box's företag/BRF product page, same auto-named pattern. Same-tab is fine for on-site pages; keep `rel="noopener"` if any URL is ever external.

**Acceptance:** "Läs mer om {exact box name}" is visible for every box, auto-updates on box change, navigates to that box's product page; offert-only boxes link to their företag/BRF pages; placeholder `'#'` data still hides gracefully (no dead links).

---

# §2 — ADDITIONAL POLISH BACKLOG (deduped from audits)

## P0 — correctness / must-fix this round (beyond §1)

- **P0-1 — Grön Teknik double-deduction fix.** Already escalated in §0 + §1A/C. Implement the `grossPriceSek` field (= catalogue "ord." price) so `netCost = priceSek` and `gronTeknik = grossPriceSek − priceSek`; keep the cap `min(rate × grossPriceSek, 50000 × applicants)`. The "Att betala" sub line shows `grossPriceSek` and `gronTeknik`. **Acceptance:** Amina S shows Att betala = 4 350 kr (not double-discounted), Grön Teknik ≈ 4 350 kr, gross 8 700 kr; no box shows a net > gross.
- **P0-2 — `requiresQuote` vs `offertOnly` field name.** The catalogue JSON uses `requiresQuote`; this spec/engine uses `offertOnly`. Pick ONE (recommend `offertOnly` in the engine; map `requiresQuote → offertOnly` at import, or rename in the catalogue) so data and code agree. **Acceptance:** one field name end-to-end; no box where the two disagree.
- **P0-3 — Methodology + payload cleanup after chart removal.** Remove payback/break-even/10-year language from "Så har vi räknat"; add a "Månadskostnad" note: monthly publik-vs-hemma = `(public − home) × public-kWh ÷ 12`. `buildPayload`: drop `cumulative10`/`cumulativeSavings10`/`paybackYears` (or send `null` for offert-only) and ADD `monthlyPublicCost`/`monthlyHomeCost`/`monthlySaving` (rounded). Remove the `* Att betala` footnote's chart-era phrasing if the cumulative tile is retired. **Acceptance:** no methodology/footnote/payload text references the removed chart; payload carries monthly + annual; offert-only payloads have null price fields.

## P1 — conversion finesse

- **P1-1 — Honest 100 %-default framing.** (Owner #2 × #4 interaction.) Hero sub at 100 %: `"≈ X kr/år om du flyttar all din publika laddning hem"`; at other %: `"… om du flyttar {pct}% av din laddning hem"`. Monthly labels "Publik laddning idag" / "Hemma efter installation". Keep the ±10 % spann line. Framing only — no math change.
- **P1-2 — Micro-trust row under the CTA.** Reuse the already-styled-but-unused `.ampy-calc__micro-trust` (styles.css ~956–962): three spans with the success-check SVG — `"Svar inom 24 h · Inget köpkrav · Dina uppgifter skyddas"` — directly under `#ampyEvCtaQuote`. Risk-reversal at the decision point.
- **P1-3 — Reduce form friction (Postnummer).** Four required PII fields is high for top-of-funnel. Consider making Postnummer optional-but-encouraged (`"Postnummer (frivilligt)"`, drop `required` + the hard zip block) unless Ampy needs it to route the offert. Keep phone + email + consent required. **Owner decision — see §3 Q-E.**
- **P1-4 — Retire the "Sparar på 10 år" cumulative tile.** Consistent with the month-first reframe (see §1D note). Owner decision — §3 Q-D.

## P2 — polish / maintainability

- **P2-1 — CHANGES.md Iteration 5 entry** documenting: 16-box catalogue + grouping, new defaults, chart→monthly swap, single-CTA + product image, ROI redesign, slider perf, Grön-Teknik net-price fix, belysning audit — each with a "Port to (WP)" target (`../_decoded/01_backend.php`, `00_js-engine.js`, `02_styles.css`, Excel).
- **P2-2 — Privacy policy link is a PLACEHOLDER** (`href="/integritetspolicy"`). Carried from iter 4. Repoint before go-live (owner).
- **P2-3 — `CONSENT_VERSION` / `CONSENT_TEXT`** must match legally-approved wording; bump version if copy changes this round.
- **P2-4 — DC default positioning** (existing backlog item). DC (5,50) maximises the headline vs AC (4,50). Owner already aware; no action unless owner re-decides. Note it now compounds with the 100 % default — both push the headline up, so the §2 P1-1 honesty framing matters more.
- **P2-5 — Image asset verification.** Catalogue flags 2 unverified image URLs (Charge Amps Halo, Aura) and one price-basis low-confidence (Garo Entity Pro). Verify all 16 `imageUrl`s return 200 before go-live; the JS already falls back to the icon, so a 404 degrades gracefully but looks unpolished.
- **P2-6 — Research sign-off on load-bearing rates** (public AC/DC, home SE1–SE4, Grön Teknik schablon, EV efficiencies) once the signed .xlsx lands — same gate as the LED calc. These numbers *are* the claim.

---

# §3 — OPEN QUESTIONS / INTERPRETATIONS FOR THE OWNER

**Q-A (explicitly requested) — Does "Få offert / 1 bild" mean show the selected box's product image in the expanded lead form?**
**Our assumption (built to):** YES — one real product image of the currently-selected laddbox, rendered as an offert-summary header at the top of the expanded "Få offert" form, with the box name + a live monthly-saving echo, updating if the box changes while the form is open. (Alternative we did NOT assume: a persistent product image in the results hero before the form opens. If that's what you meant, it's a small reposition — flag it.)

**Q-B (explicitly requested) — Catalogue price basis: installed incl. moms?**
Catalogue synthesis treats all consumer prices as **installed, incl. moms, AFTER 50 % Grön Teknik** (only Wallbox Pulsar Max states moms explicitly; the rest assumed moms-inclusive per Swedish convention). **Confirm:** are these net "att betala" prices incl. moms? This determines the Grön Teknik handling in Q-C.

**Q-C (BLOCKER — must answer before pricing ships) — Grön Teknik double-deduction.**
The catalogue `priceSek` is post-Grön-Teknik, but the engine deducts Grön Teknik again. **Our resolution (assumed):** the catalogue price = the net "Att betala"; we add a `grossPriceSek` field (= the "ord." price, ≈ 2× shown) so "Att betala" = catalogue price and Grön Teknik = gross − net. **Confirm**, or tell us the catalogue prices are gross (then we keep the current deduction and ignore the "ord." column).

**Q-D — Keep or retire the "Sparar på 10 år" cumulative tile?**
You reframed value around the month and asked to remove the long-horizon curve. We recommend retiring the 10-year tile too (keep only "Att betala" in the trio) for consistency. Keep it, or drop it?

**Q-E — Postnummer required or optional?**
Recommend optional-but-encouraged to cut form drop-off, UNLESS you need the zip to route/price the offert before the callback. Your call.

**Q-F — Garo Entity Pro: pure offert (null) or show "Från 7 350 kr" as indicative?**
Garo Entity Pro displays a real "Från 7 350 kr inkl. installation" price but is offert-gated (företag/BRF, no buy button). Per your "Garo Entity Pro as offert" instruction we set `priceSek = null` (pure Offert). Confirm, or show 7 350 kr as an indicative "Från"-price (set `priceSek`/`grossPriceSek` and keep the offert CTA).

**Q-G — EV (car) selector: keep?**
This round's brief is silent on it. It drives the energy math (efficiency × km). We keep it. Flag if you want a simplified single-input version.

**Q-H — Default consumer box.**
We boot to the first consumer box (Zaptec Go, list position 1). Amina S carries the "Rekommenderas" badge — do you want Amina S as the default selection instead (set `data-default-charger-id="amina-s"`)?

---

# §4 — BUILD SEQUENCE (with files touched)

Each step: prototype first → `node --check` + in-browser 0-console-errors → port to WP. Files per step listed as **[P]** prototype / **[W]** WordPress.

1. **Data model + catalogue (unblocks everything).**
   [P] `data.js` (swap to 16-box catalogue with `segment`/`offertOnly`/`grossPriceSek`/`priceSek`(net)/`imageUrl`/real `slug`; defaults 100 % / 20 000). [W] Excel "Chargers" + "Advanced" sheets, `01_backend.php` parser mapping (add `segment`/`offertOnly`/`grossPriceSek`/`imageUrl` columns). Resolve Q-C/Q-B/Q-F first.
2. **Grön Teknik net-price fix + offert-only calc branch.** [P]/[W] `engine.js` / `00_js-engine.js` — `calculateFor` (`netCost = priceSek`, `gronTeknik = grossPriceSek − priceSek`, cap; `offertOnly` returns null price fields + monthly). (§1A/B, P0-1, P0-2)
3. **Defaults 100 % / 20 000.** [P]/[W] `data.js`/Excel + `engine.js` fallback. (§1C)
4. **Selector grouping + offert badge + default-consumer boot.** [P]/[W] `engine.js` `renderSelector` + `init`; [P]/[W] CSS `.ampy-calc__selector-group`. (§1A)
5. **Monthly comparison block (+ teardown of the payback chart).** [P] `index.html` (delete chart-block + payback tile, add `.ampy-calc__monthly`); [P]/[W] `engine.js` (add monthly math, delete `renderPaybackChart` + refs); [P]/[W] `styles.css` (delete `.ampy-calc__chart*`/`.ampy-calc__be-*`/keyframes, add `.ampy-calc__monthly*`, fix staggered-reveal list); [W] `01_backend.php` markup + `02_styles.css`. (§1D, P0-3)
6. **ROI segmented-control redesign.** [P] `index.html` (swap switch→toggle markup); [P]/[W] `engine.js` (`updateInvestmentToggle` → aria-pressed pair; offert-only disable); [P]/[W] `styles.css` (`.ampy-calc__toggle--investment`; delete `.ampy-calc__switch*`/`.ampy-calc__roi-toggle-row`). (§1E)
7. **Slider perf.** [P]/[W] `styles.css` (transform-based fill/thumb, `.is-dragging` → transition:none, 150ms default); [P]/[W] `engine.js` `renderRangeSlider` (rAF-coalesce, `.is-dragging` toggle, `updateVisual` writes transform). (§1F)
8. **Single "Få offert" flow.** [P] `index.html` (delete `.ampy-calc__cta-secondary` + email block; add `.ampy-calc__offert-summary`); [P]/[W] `engine.js` (delete `submitEmailForm` + binds + event; add `syncOffertSummary`); [P]/[W] `styles.css` (delete email-row rules, add offert-summary). (§1H)
9. **Product link reposition + real slugs.** [P]/[W] `engine.js` `renderSingleResult` (href = `charger.slug`, reposition). (§1I)
10. **Copy audit (belysning→laddbox) + honest 100 % framing + micro-trust + methodology cleanup.** [P]/[W] `index.html`/`01_backend.php` + `engine.js`/`00_js-engine.js`. (§1G, P0-3, P1-1, P1-2)
11. **Postnummer optional (if owner approves Q-E).** [P]/[W] `index.html` + `engine.js` validation.
12. **CHANGES.md Iteration 5** + WP port verification (id-set comparison, diff engine/styles, grep anchors). (P2-1)

---

# §5 — ACCEPTANCE / QA CHECKLIST

**Catalogue & data**
- [ ] Selector shows exactly 16 boxes in the §1A fixed order, under "För hemmet" (14) and "För företag & BRF" (2) group labels.
- [ ] Group labels are non-selectable, non-focusable, aria-hidden; keyboard nav skips them.
- [ ] Offert-only boxes show an "Offert" badge, no price subtitle.
- [ ] Boot selection is a consumer box; no business box can be the default.

**Pricing correctness (P0)**
- [ ] Amina S "Att betala" = 4 350 kr (net), Grön Teknik ≈ 4 350 kr, gross 8 700 kr — NOT double-deducted.
- [ ] No box renders net > gross or a negative/ NaN price.
- [ ] One field name (`offertOnly`) end-to-end; `requiresQuote` reconciled.

**Offert-only path**
- [ ] Zaptec Pro / Garo Entity Pro: monthly + annual savings render and reconcile.
- [ ] No "Att betala" / payback / Grön-Teknik element visible.
- [ ] ROI control disabled + showing "Utan investering"; restores on switch back to consumer.
- [ ] CTA reads "Få offert för företag/BRF"; payload `offertOnly:true` + null price fields.
- [ ] Zero NaN across both business boxes.

**Defaults**
- [ ] Fresh load: Andel = 100 %, Körsträcka = 20 000 km/år, both ticks active.
- [ ] Hero recalculates to the 100 %/20 000 numbers.

**Monthly comparison (replaces chart)**
- [ ] No SVG chart / `is-no-payback` / be-marker anywhere in the DOM.
- [ ] Monthly panel: "Publik laddning idag" (warning) vs "Hemma efter installation" (success) + bold "Du sparar ≈ X kr/mån".
- [ ] `(public − home) × 12 === annualSaving` to the krona at default AND ≥3 slider positions.
- [ ] The three monthly numbers count-up on change; monthly panel renders for offert-only boxes too.
- [ ] No orphaned `ampyEvChart*` / `renderPaybackChart` / chart CSS / keyframes.

**ROI control**
- [ ] No bordered ROI box; two-pill segmented control, active pill highlighted.
- [ ] Keyboard (Tab + Enter/Space) toggles; `aria-pressed` synced; caption span gone.
- [ ] AA contrast on the dark surface; disabled+muted for offert-only.

**Slider perf**
- [ ] Drag on desktop + a real touch device tracks the pointer, no easing trail.
- [ ] No per-move 300ms transition; no per-frame layout from `left`/`width` (transform-based).
- [ ] Keyboard arrows + tick taps animate ≤150ms; reduced-motion snaps instantly.

**Conversion flow**
- [ ] Exactly one CTA + one lead form; no "Maila kalkylen"; `submitEmailForm` + email ids gone.
- [ ] Form open shows selected box image + name + live monthly-saving echo; updates on box change; missing image falls back to icon (no broken glyph).
- [ ] "Läs mer om {exact box name}" visible, auto-named, links to the real product page; offert-only → företag/BRF page; placeholder `'#'` hides gracefully.
- [ ] Micro-trust row under the CTA ("Svar inom 24 h · Inget köpkrav · Dina uppgifter skyddas").
- [ ] Every lead passes consent + honeypot + timing gate.

**Copy / honesty**
- [ ] `grep -ri 'belysning'` over `prototype/` + `_decoded/` = 0 human-facing hits; intro = "laddbox-expert".
- [ ] Hero sub at 100 % states the "flyttar all din publika laddning hem" assumption; updates with the %.
- [ ] ±10 % spann line present; methodology has the monthly note; no chart-era language.

**Build hygiene / port**
- [ ] `node --check` clean on `data.js` + `engine.js`; 0 console errors/warnings in-browser.
- [ ] All engine `getElementById` ids resolve in markup; no dangling refs to removed ids.
- [ ] `diff prototype/engine.js ../_decoded/00_js-engine.js` and `…/styles.css ↔ 02_styles.css` clean after port; `01_backend.php` markup id-set matches `index.html`.
- [ ] CHANGES.md Iteration 5 written with per-row "Port to (WP)" targets.
- [ ] Privacy-policy link repointed (or owner-acknowledged placeholder); all 16 image URLs return 200.

**Owner sign-offs gating go-live:** Q-A, Q-B, Q-C (blocker), Q-D, Q-E, Q-F resolved; research sign-off on load-bearing rates once the signed .xlsx lands.
