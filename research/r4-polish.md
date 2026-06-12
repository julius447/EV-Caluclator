# R4 — Final polish pass (laddbox-kalkylator)

Fresh-eyes detail review of the live, feature-complete tool. Prototype↔WP parity
verified first: `engine.js` == `00_js-engine.js` and `styles.css` == `02_styles.css`
are **byte-identical** (diff clean); `01_backend.php` render markup matches
`index.html` with all `ampyEv*` ids intact. So every fix below must be applied in
**both** the prototype and the WP mirror to preserve parity.

Reviewed states live (desktop 1280, mobile 375): default, 0 % public charging,
offert-only box (Zaptec Pro), AC/DC, methodology open. Owner-shipped decisions
(third bar exists, ROI toggle gone, investment always included, etc.) are NOT
re-litigated.

---

## P1 — fix before it embarrasses the number story

### P1-1. Offert box: "Att betala" reads "**Begär offert kr**" (orphaned unit)
`renderSingleResult()` sets `#ampyEvNetPay` to the string `"Begär offert"` but the
sibling `<span class="ampy-calc__trio-unit">kr</span>` is static markup and is never
hidden — so the tile literally renders **"Begär offert kr"** (confirmed:
`fullTileText === "Begär offertkr"`). Reads broken/machine-generated on exactly the
B2B/BRF path Ampy most wants to look premium.
**Fix:** in the offert branch, hide the unit span (e.g. give `#ampyEvNetPayTile` a
`is-text`/`--text` class that `display:none`s `.ampy-calc__trio-unit`, or null the
unit's text); restore it in the priced branch. Same treatment any time a trio value
is non-numeric.

### P1-2. Zero / low-% state: "**Sparar på 10 år −4 490 kr**" contradicts its own label
At 0 % public charging the hero correctly drops to "≈ 0 kr/år" with the nice nudge
sub-copy — but the 10-year tile shows a **negative** "−4 490 kr" under the label
"Sparar på 10 år" ("You save over 10 years") with sub "laddboxen betald, Grön Teknik
inräknad". A negative number under a *savings* label, next to a "betald" claim, is
self-contradicting and faintly alarming. Any user who drags public-share low (a
realistic "what if I barely charge publicly" probe) hits this.
**Fix:** when `cumulativeNetN < 0` (or `annualSaving <= 0`), switch the tile to a
neutral framing — e.g. relabel to "Återbetalar sig inte vid den här andelen" or show
"—" with the nudge, rather than a red-flavoured minus. At minimum, never pair the
word "Sparar"/"betald" with a negative value.

### P1-3. Schemalagd "i" tooltip is near-invisible on the dark card (contrast)
The third bar's info button is the **only** `.ampy-calc__tip` that lives on the dark
surface, but the component only ships the light-card styling: computed
`color: rgb(86,94,130)` (dark slate) and `border-color: rgba(15,18,60,0.12)`
(near-black) on a `rgb(9,11,50)` navy background — the circle and glyph almost
disappear, and it fails contrast. Users can't discover the explanation for the most
novel number in the panel.
**Fix:** add a dark-surface variant, e.g.
`.ampy-calc__card--surface .ampy-calc__tip { color: var(--on-surface-text-muted);
border-color: var(--on-surface-border-strong); }` plus the coarse-pointer `::before`
border. Keep hover/active using `--action-primary` (already legible).

---

## P2 — hierarchy / honesty / discoverability

### P2-1. Methodology still explains a "spann" the UI no longer shows
Item **"5. Varför vi visar ett spann"** ("Why we show a range", "± 10 % på den årliga
besparingen") is still rendered, and `savingLow`/`savingHigh`/`uncertaintyBand` are
still computed — but R3 removed the hero "Spann" line, so **no range is displayed
anywhere**. The methodology now documents a phantom feature; a curious reader will
hunt for a range that doesn't exist. Honesty/dead-content issue.
**Fix:** either (a) reframe item 5 to match what's shown — "Siffrorna är
uppskattningar (±10 %)" as a general-caveat note without claiming a visible span — or
(b) drop item 5 and fold the ±10 % caveat into the existing disclaimer paragraph.
Then remove the now-unused `savingLow`/`savingHigh` (and re-number items 6→5).

### P2-2. Schemalagd number is the one figure the inline breakdown can't substantiate
"Hur besparingen räknas" lists only DC 5,50 / Hemma 1,90 / gap 3,60 kr/kWh. The
third bar's 423 kr/mån comes from the **optimised** rate (SE3 = 1,35 kr/kWh), which
appears nowhere in the breakdown — so the most eye-catching "bonus" number can't be
traced inline (only buried in methodology item 6). Undercuts the research-signed,
"show your work" credibility the rest of the panel earns.
**Fix:** add a fourth breakdown row, e.g. "Hemma, schemalagd (SE3) — 1,35 kr/kWh",
visually subordinate, so the staircase 5,50 → 1,90 → 1,35 reconciles every bar.

### P2-3. Third-bar subordination barely lands — 595 vs 423 read as equals
Intended hierarchy is public > home > schemalagd, but the home value (18.08px) and
schemalagd value (17.10px) differ by ~1px and share the **identical** green
`rgb(57,194,129)`; only a 0.85 opacity and the dashed fill separate them. On mobile
the two look like two equal home numbers, and a user may wonder why "Du sparar" =
1 127 (1721−595) instead of 1 298 (1721−423). The "additive bonus" intent is lost.
**Fix:** widen the gap — step the schemalagd value down a full token (→ `--fs-sm`)
and/or shift its colour toward the muted teal (`--chart-stream-3`), and add a tiny
inline qualifier on the value or label such as "(med smart styrning)" so it reads as
an optional extra, not a competing home figure. Consider a one-line "Du sparar"
note clarifying the headline uses the conservative flat home rate.

---

## P3 — micro-polish

### P3-1. Label parallelism: "Du sparar per år" vs "Sparar på 10 år"
The hero eyebrow is "Du sparar per år" but the adjacent tile drops the pronoun:
"Sparar på 10 år". Tighten to "Du sparar på 10 år" (and offert variant "Din
besparing på 10 år") so the two savings figures read as one voice.

### P3-2. km thousands separator renders as a wide "20 000" gap
`fmtKm` uses NBSP (U+00A0) as the thousands separator; in JetBrains Mono with `tnum`
that's a full mono advance, so the live value looks like "20  000" with an oversized
gap (locale-correct, but visually loose). Swap the separator to a thin/narrow
no-break space (U+202F) in `fmtKm`/`fmtKr`/`fmtKm` displays for a tighter group while
staying valid Swedish formatting. (Low priority — defensible as-is.)

### P3-3. Pre-go-live placeholders still in markup
`href="/integritetspolicy"` in the consent notice and `tel:+46102657979` /
"010-265 79 79" in the error box are placeholders flagged in earlier rounds; the
consent block comment already calls this out. Worth a final confirm that the privacy
URL and phone are the real production values before go-live — a dead privacy link on
a GDPR consent row is the worst place for a 404.

---

### Parity reminder
Apply P1-1, P1-2, P2-1, P2-2, P2-3, P3-1, P3-2 in `engine.js` **and**
`00_js-engine.js`; P1-3, P2-3 (CSS) in `styles.css` **and** `02_styles.css`; any
markup change (P1-1 unit span) in `index.html` **and** `01_backend.php`. Re-diff to
confirm byte-parity after each.
