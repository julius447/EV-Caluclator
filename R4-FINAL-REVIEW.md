# R4 — Final Review (Ampy laddbox-kalkylator)

Product-lead consolidation of three R4 research passes (code audit, polish, QA) plus
the dead-code cleanup pass. Date: 2026-06-11.
Live: https://julius447.github.io/EV-Caluclator/

---

## 0. Executive summary

The tool is in strong shape and is **functionally correct**: QA found **no math,
parity, or a11y defect**. `verify_faithful.py` passes deep-equal (8 EV models, 16
chargers), the new third "Schemalagd" bar is fully wired in both layers, and the
headline is provably invariant to it. Prototype↔WP parity is byte-identical for both
`engine.js`/`00_js-engine.js` and `styles.css`/`02_styles.css` (re-verified just now).

The cleanup pass already swept the **dead weight**: 8 groups of orphaned CSS, every
stale comment, and the prototype font-leak scope-fix — all mirrored into `_decoded`
with parity preserved and the A11 `numTaxApplicants` plumbing deliberately untouched.

So the engineering hygiene is essentially done. **But the tool is NOT yet a genuine
10/10**, for two reasons:

1. **The polish pass (r4-polish.md) was not applied at all** — and it contains two
   user-visible UX defects that undercut the number story on exactly the paths Ampy
   cares about: the offert tile literally renders **"Begär offert kr"** (orphaned
   unit), and a low-public-charging probe shows **"Sparar på 10 år −4 490 kr"** (a
   negative number under a "you save" label). Neither is a crash, but both read as
   broken/contradictory. These are the gap between "clean code" and "premium tool."

2. **Go-live blockers remain open** — the `/integritetspolicy` consent link is still a
   placeholder (GDPR-blocking 404 risk), the consent version/text drifts between JS and
   the stored PHP record (Article-7 audit trail), and the success message still promises
   an email ("Du får kalkylen mailad till dig") the system no longer sends.

Verdict: **code-quality ≈ 9.5/10; product ≈ 8/10 until the two polish defects land and
the go-live items are closed.** None of the remaining work is large; most is a few
lines in two mirrored files.

---

## 1. What the cleanup pass already applied (verified)

All changes mirrored into `_decoded`; parity re-confirmed IDENTICAL for engine.js and
styles.css. 5 files changed; `01_backend.php` correctly untouched.

- **A1–A8 dead CSS removed** from `prototype/styles.css` + `_decoded/02_styles.css`:
  orphaned `--chart-*` tokens; streams chart CSS; spec-table CSS; cumulative-callout
  CSS; trust-strip CSS; old pre-hero15 hero/return CSS; `hero15-mini`; `is-snap` +
  `@keyframes ampy-snap-highlight`. Verified gone (`grep streams` / `trust-strip` → 0).
- **B stale comments fixed** (text-only) in engine.js + styles.css (both layers): the
  "Hemma, schemalagd" comment label aligned to the live string; announcer "stepping
  applicants" dropped; the dead ROI "Med/Utan investering" + Payback/ROI-toggle comment
  references removed.
- **C1 font-leak scope-fix**: `prototype/index.html:6` now
  `<style>.ampy-calc-outer{font-size:62.5%;}</style>` — matches `01_backend.php:993`
  (which was already correct). Verified in both layers. No host `<html>` leak.
- **E `includeInvestment`**: confirmed already clean (no emit, PHP reads `results.ev`
  tolerantly) — no change made, correctly.

QA gate after cleanup: `node --check` OK (engine + data), `verify_faithful.py` PASS,
both diffs IDENTICAL, all REVIEW items confirmed still present.

---

## 2. Prioritised remaining work

### 2A. Safe — I can apply now

These are zero-decision: provably dead, or a copy/CSS fix with no behavioural ambiguity.
All must be applied to **both** prototype and `_decoded` to preserve byte-parity, then
re-diffed.

| # | Item | File:line | Recommendation |
|---|------|-----------|----------------|
| S1 | **P1-1 — "Begär offert kr" orphaned unit** | `engine.js:852` + `index.html:190` (mirror `00_js-engine.js`, `01_backend.php`) | In the offert branch, hide the static `<span class="ampy-calc__trio-unit">kr</span>` on `#ampyEvNetPayTile` (add an `is-text` class that `display:none`s `.ampy-calc__trio-unit`; restore in the priced branch at `engine.js:855`). Highest-value visible fix; affects the premium B2B/BRF path. |
| S2 | **P3-1 — label parallelism** | `index.html:180` ("Sparar på 10 år") vs `index.html:162` ("Du sparar per år") | Change priced label to "Du sparar på 10 år"; offert label to "Din besparing på 10 år". One-voice copy. Trivial. |
| S3 | **A10 — unused typography utilities** | `styles.css:136-143` `.ampy-calc__t-display/__t-3xl/__t-heading/__t-body/__t-caption` | 0 refs. Prototype is feature-complete; delete. (Only `t-2xl/t-subheading/t-small/t-mono` are used.) Pure dead CSS. |
| S4 | **A9 — unused button/field/selector variants** | `styles.css:473-479, 856-862, 450/453-457, 394-400, 863-867, 206-207` | 0 refs (`btn--secondary/ghost/outline`, `selector-button--on-surface`, `toggle--disabled`, `locked-value`, `field--solar`/`field-hint--conditional`, `field-hint`/`field-divider`). Recommend delete — these are battery/LED-scaffold leftovers, not part of this tool's surface. (Slightly lower confidence than S3 since they're generic DS utilities; still safe — nothing references them.) |
| S5 | **N1/D1/D8 — PHP fallback comment mis-states engine** | `01_backend.php:850` says engine uses `homeRate * 0.88` but engine uses `0.78` (`engine.js:238`) | Fix the **comment** to say 0.78 now (safe, text-only). NOTE: changing the actual 0.88→0.78 *constant* is a Needs-Decision item (R1 below) because it changes fallback output. Splitting them: comment-fix is safe today. |

I recommend applying **S1 and S2 immediately** (user-visible, no decision), and S3/S4/S5
as a same-pass hygiene sweep. After applying, re-run `node --check`, `verify_faithful.py`,
and both diffs.

### 2B. Needs owner (Ampy) decision

Concrete, with recommendation, but each changes behaviour / copy claims / CRM contract /
GDPR posture — not mine to decide unilaterally.

| # | Item | File:line | Why it needs a decision / recommendation |
|---|------|-----------|------------------------------------------|
| R1 | **P1-2 — negative value under "Sparar" label** | `engine.js:838` sets label "Sparar på X år"; tile shows `cumulativeNetN` which goes negative at low public-share (e.g. −4 490 kr) | UX defect, but the *fix* is a copy/framing decision. Recommend: when `cumulativeNetN < 0` (or `annualSaving <= 0`) switch the tile to neutral framing ("Återbetalar sig inte vid den här andelen" or "—" + nudge) so "Sparar"/"betald" never pairs with a minus. Owner picks the wording. **High priority — visible on a realistic probe.** |
| R2 | **C2 / P3-3 — `/integritetspolicy` placeholder** | `index.html:313`, `01_backend.php:1285` | GDPR-blocking. Needs the **real production privacy URL** from Ampy. Go-live blocker. |
| R3 | **D3 — consent version/text drift** | JS `engine.js:129-134` (`2026-06-10.1`, long text) vs PHP `01_backend.php:86-89` (`2026-06-v1`, short text); server overwrites at `:328-334` | Stored audit trail records different wording than the user saw (Article-7 provenance). Recommend PHP echo the client-sent `contact.consent.version/text`, or sync both to the rendered copy at `index.html:309-315`. Owner must confirm the canonical consent string. **Go-live / legal.** |
| R4 | **D4 — "mailad till dig" false promise** | `index.html:327`, `01_backend.php:1299` | Success copy promises an emailed calculation the R3 email path no longer sends. Recommend drop "Du får kalkylen mailad till dig." Owner confirms the post-submit promise (they may *want* to wire an email instead). |
| R5 | **A11 — `numTaxApplicants` inert plumbing** | `engine.js:67,1203`; `01_backend.php:249` (logs "Applicants:") | Hard-pinned to 1, never read in any calc; ships in payload + lead email. Keep only if Ampy wants the field in the CRM export. Recommend drop if not — but it's a benign no-op, so owner call. **Left intact by cleanup, correctly.** |
| R6 | **D5 — `email_calculation` unreachable lead type** | `01_backend.php:82` allow-list + subject branch `:220-222` | Frontend only sends `quote_request`. Drop unless a server-side email path is planned (ties to R4). |
| R7 | **D1 — fallback constant divergence (0.78 vs 0.88)** | `engine.js:238` ×0.78 vs `01_backend.php:853`/`verify_faithful.py:308,310` ×0.88 | Dormant (all 4 shipped regions carry an explicit optimised rate) but a real cross-layer inconsistency. Pick ONE constant, align all 4 sites + comment + methodology "ca 20–30%" wording (`engine.js:944-946`). Changing the oracle constant touches `verify_faithful.py`, so it needs a deliberate decision. |
| R8 | **D2 — `publicDcRate` parser default 5.99 vs 5.50** | `01_backend.php:887`, `verify_faithful.py:340` = 5.99; data/engine/tooltip = 5.50 | Latent (Excel always supplies it). Recommend align parser default to 5.50 so a blank-Excel can't contradict the on-screen "5,50". |
| R9 | **D6 — anti-bot field-name mismatch (latent)** | JS nests under `payload.antibot.*` (`engine.js:1186-1193`); PHP reads top-level `formElapsedMs`/`formOpenedAt`/`hp` (`01_backend.php:149,161-164`) | The honeypot + too-fast server checks are effectively no-ops for this client. Not an R3 regression but a real fragility. Recommend PHP read the nested `antibot` object (or JS flatten). Owner/security decision. |
| R10 | **P1-3 — Schemalagd "i" tooltip contrast on dark card** | `styles.css:778` `.ampy-calc__tip` ships only light-card styling; the third-bar tip sits on the navy `--card--surface` | a11y/contrast: glyph near-invisible. Recommend a `.ampy-calc__card--surface .ampy-calc__tip` dark variant (on-surface muted text + border). Listed as decision only because it needs a design token choice; otherwise low-risk and I'd happily apply. |
| R11 | **P2-1 — methodology explains a "spann" the UI no longer shows** | `engine.js:941` item "5. Varför vi visar ett spann"; `savingLow/High` at `:308-309`, `uncertaintyBand` `:42` | Phantom feature: R3 removed the hero range. Recommend reframe item 5 to a general ±10% caveat (or fold into disclaimer), drop unused `savingLow/savingHigh`, renumber 6→5. Copy decision. |
| R12 | **P2-2 — Schemalagd 423 kr can't be traced inline** | breakdown lists DC 5,50 / Hemma 1,90 / gap 3,60 only; third bar uses optimised 1,35 | Recommend a 4th subordinate breakdown row "Hemma, schemalagd (SE3) — 1,35 kr/kWh" so 5,50→1,90→1,35 reconciles. Content decision. |
| R13 | **P2-3 — third-bar subordination too weak (595 vs 423 read as equals)** | values 18.08px vs 17.10px, identical green `rgb(57,194,129)` | Recommend step schemalagd value to `--fs-sm`, shift colour toward muted teal, add "(med smart styrning)" qualifier. Design decision. |
| R14 | **P3-2 — km separator NBSP renders wide** | `fmtKm`/`fmtKr` use U+00A0 (`engine.js:82,87`) | Cosmetic; swap to U+202F narrow no-break space for tighter grouping. Low priority, defensible as-is. |

---

## 3. Real defects QA / polish found

QA's verdict on **correctness** stands: **no math, parity, or a11y defect.** Edge cases
(0% public, offert-only, AC/DC, region switch, missing opt-rate) all clean, no NaN,
ordering preserved, headline invariant. That part is genuinely solid.

But two **user-visible UX defects** from the polish pass are real and currently shipped:

- **DEFECT 1 (P1-1): "Begär offert kr".** `engine.js:852` sets `#ampyEvNetPay` to
  `"Begär offert"` while the static unit span at `index.html:190` keeps rendering "kr",
  producing the literal string **"Begär offert kr"** on the offert/B2B path. → S1 above.
- **DEFECT 2 (P1-2): negative number under a savings label.** At low public-share the
  10-yr tile shows e.g. **"Sparar på 10 år −4 490 kr"** with sub "laddboxen betald" — a
  negative paired with "you save"/"paid off". Self-contradicting on a realistic probe.
  → R1 above.

Plus **DEFECT 3 (P1-3, a11y-adjacent): the third-bar info tooltip fails contrast** on the
dark card (`styles.css:778` light-only styling). QA passed a11y on tooltip *wiring*
(focus/aria/keyboard all correct), but the polish pass caught the *visual* contrast miss
— both can be true. → R10 above.

Everything else QA/audit flagged is dead code (handled or in §2A) or latent/dormant cross-
layer nits (in §2B).

---

## 4. Still-pending Ampy go-live items

These are owner-only and gate launch:

1. **Real-data sign-off** — `data.js` / Excel content (prices, rates, EV/charger list)
   needs the final human "this is correct to ship" confirmation. `verify_faithful.py`
   proves the *pipeline* is faithful, not that the *numbers* are the ones Ampy wants live.
2. **Privacy URL** — `/integritetspolicy` is a placeholder (R2). GDPR consent row must
   point at the real production policy before go-live; a 404 there is the worst case.
   Also confirm the support phone `tel:+46102657979` / "010-265 79 79" is production.
3. **n8n webhook** — the lead `buildPayload` → webhook → n8n → CRM path needs the
   production endpoint wired and an end-to-end test lead confirmed landing in the CRM.
   (Tie-in: R3 consent provenance, R4 success-copy, R6 lead-type, R9 anti-bot all touch
   this submission path.)
4. **CPT** — the WordPress custom-post-type / lead storage on the Ampy install needs to
   be registered/confirmed so submitted leads persist server-side (`01_backend.php` store
   path).

---

## 5. Is it a 10/10?

**Not yet — honestly an 8/10 product on a 9.5/10 codebase.** The engineering is clean,
correct, parity-true, and accessible at the wiring level. To reach a genuine 10/10:

- Apply **S1 + S2** now (kills the most visible defect + tightens voice) — I can do this.
- Get an owner ruling on **R1, R10** (the two remaining visible/contrast defects) and the
  polish content items **R11–R13** (the number-story credibility polish).
- Close the **four go-live items** in §4, especially the privacy URL (R2) and consent
  drift (R3), which are launch-blocking, not nice-to-have.

After S1/S2 land and R1/R10 are resolved, the *tool* is a 10/10. Until the go-live items
in §4 are signed off, it is not *launchable* regardless of code quality.
