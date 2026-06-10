# EV / Laddbox-kalkylatorn — Production-Readiness Plan

**Owner:** Ampy · **Author:** PM & System Architect (synthesis of 4 audits + completeness critic + verified research)
**Date:** 2026-06-09 · **Status:** MVP prototype verified; NOT production-ready. ~10 P0 blockers.

---

## 1. Executive summary & current state

The EV/laddbox savings calculator is an **architecturally sound, visually polished MVP prototype** whose calculation engine is internally correct and reconciles exactly to its oracle (Tesla Model Y + Amina S + SE3 + DC + 15 000 km + 50 % → **annual saving 5 306 kr, payback 1,26 år, 10-yr cumulative 46 370 kr**, reproduced by `excel/verify_faithful.py`). The model *structure* — "move public charging home", grid-side kWh via the symmetric 0.90 charger-efficiency division, Grön Teknik at an effective 48,5 % — is the right shape and well-phrased in the methodology.

**It is not production-ready.** The blockers fall into five buckets, none of which the engine math can fix on its own:

1. **The headline rests entirely on placeholder + overstated data.** Per `excel/EXCEL-SCHEMA.md`, *every* charger name/price/`learn_more_url` and *every* EV efficiency is an explicit UNVERIFIED placeholder. Independently, verified research shows home rates **SE2/SE3/SE4 are too high** (1.60/2.20/2.60 vs marginal 1.50/1.90/2.10) and the **default DC rate 5.99 is ~9 % above** the ~5.50 market-average ad-hoc. Under marknadsföringslagen's reversed burden of proof, every displayed "spara X kr" must be documented *before* publish. Today it is not.

2. **WordPress-blocked dependencies are missing or unverified.** The `lead-magnet` custom post type is **registered in no snippet** (the calculator silently renders blank without it); the real `.xlsx` is not yet uploaded/research-signed; the n8n webhook URL + notify email are per-post meta that must be set on production.

3. **The lead pipeline is unsafe and non-compliant.** Both REST routes use `permission_callback => '__return_true'` with **no rate-limit, honeypot, or captcha** (open spammable POST that emails staff, hits n8n, writes PII to `wp_postmeta`); the form collects name/email/phone/postnummer with **zero GDPR consent, no Article-13 notice, no privacy link**; the webhook is `blocking => false` with email only in the `elseif` branch, so **an n8n 5xx drops the lead silently** while the user sees "Tack!".

4. **The Excel parser bricks silently on a routine re-save.** `build_sheet_map` (L505) prepends `'xl/'` to already-absolute openpyxl targets, and `read_sheet` (L524) only handles shared-strings (`t='s'`), not openpyxl `inlineStr`. An editor re-saving the data file in Excel-for-web/openpyxl imports **0 rows behind a green "OK" badge** → blank calculator on a "successful" save.

5. **Prototype↔WP drift undoes the honesty fixes, and there are real WCAG AA + framing problems.** The four logged Iteration-1 fixes are **still stale in the deployed WP source** (`_decoded/01_backend.php` L1030 still says `(50%)`; L791 `Din körvanor`; L795 orphan `for="ampyEvKmSlider"`; `00_js-engine.js` L491 hero sub still lacks the baseline clause and says `inräknat`). Two primary inputs (custom sliders) have no accessible name; the CTA fails AA contrast (2.96:1); and the headline framing (10-yr hero, "laddboxen är betald" while **installation cost is unmodelled**, sub-1.5-yr payback) reads "too good to be true".

**Verified file inventory** (all paths absolute under `/Users/juliuscallahan/Desktop/Claude Code/ev-kalkylatorn/`):
- Prototype (transplant source): `prototype/index.html`, `prototype/engine.js`, `prototype/data.js`, `prototype/styles.css`, `prototype/CHANGES.md`
- Deployed WP snippets: `_decoded/01_backend.php` (render + REST + parser + metabox), `_decoded/00_js-engine.js` (JS engine), `_decoded/02_styles.css`
- Data + oracle: `excel/laddbox-kalkylator-data.xlsx`, `excel/build_xlsx.py`, `excel/verify_faithful.py`, `excel/EXCEL-SCHEMA.md`

> **Build-fidelity rule (carried from CHANGES.md):** the prototype is the source of truth for markup/engine; every change must be ported into `_decoded/01_backend.php` (markup, inside `ampy_render_ev_lead_magnet()`) and `_decoded/00_js-engine.js` (engine), with `excel/verify_faithful.py` EXPECTED kept in lockstep. The deployed artifact is the WP snippet, so **a fix only counts when it lands in `_decoded/`.**

---

## 2. Prioritized backlog

Legend — Effort: S (<½ day) / M (½–2 days) / L (>2 days). "Owner?" = needs an owner decision before/while building.
Merged across all 4 audits + critic; contradictions flagged by the critic are resolved inline (see §2.0).

### 2.0 Contradictions resolved (so the build doesn't re-litigate them)

- **Home-rate direction (critic flag):** Lower SE2/SE3/SE4 **because the displayed per-kWh home figure must be independently defensible as a *marginal* cost** (research: SE3 2.20 is ~16 % too high). This is the single coherent rationale — do *not* ship the calc-lead's "is it conservative?" out-loud reasoning. Net effect on saving is secondary; defensibility of the displayed line is primary.
- **Default public type (3-way disagreement):** **OWNER DECISION (DC-1).** Recommendation: keep **DC at the corrected 5.50** as the default *ad-hoc* representative, and disclose subscription pricing (~3.40–4.50) in the tooltip. (Calc-lead = DC 5.50; UX = AC/blend; research = DC 5.50 centered / AC 4.50 justified / subscriber ~4.0–4.5.) One value must ship.
- **±10 % band characterization:** It is **not** a confidence interval. Reframe as an *illustrative modelling band* (it does not capture region/rate/switchable-share/winter spread). Do **not** surface "±10 %" as a trust anchor as written; if surfaced, label it "modellintervall", not statistical confidence.
- **Payback-credibility path:** The two credibility fixes push payback in **opposite** directions — correcting home rates *down* widens the gap (faster payback), adding installation cost *raises* net cost (slower payback). **Model them jointly** (P0-2 + P1-1) and read the *combined* payback, not fix-by-fix.
- **WLTP-vs-real-world convention:** Use the **VERIFY-step** numbers, not the primary research: EX30 ~**1.70–1.71** WLTP (not 1.67), Atto 3 pure-WLTP ~**1.40–1.56** (its 1.78 is a real-world figure and is the one inconsistent row). Pick **one convention table-wide** (WLTP), state the Model Y figure is pre-Juniper LR basis.
- **Grön Teknik %:** One coherent narrative everywhere: *50 % of arbete+material × Skatteverkets 97 % schablon ≈ **48,5 %** of turnkey price; the calc applies 48,5 %.* Three competing standalone figures (48,5/50/97) must not appear.

---

### P0 — BLOCKS GO-LIVE (must be true before any public claim or live form)

**P0-1 — Replace ALL placeholder + sign the data dossier (data provenance / substantiation).**
- *Problem:* Every charger name/price/`learn_more_url` (`#`) and every EV efficiency in the shipped `.xlsx` is an explicit UNVERIFIED placeholder (`EXCEL-SCHEMA.md` L58/71/75/76/80–81). The public claims "46 370 kr / 1,3 år" are dominated by these unverified numbers. Marknadsföringslagen reversed burden of proof requires a written, sourced methodology *before* publish; no such signed file exists (critic: "no audit fully owns this").
- *Recommendation:* Block go-live until Ampy signs real charger prices/names/URLs and EV efficiencies. Adopt VERIFY-step WLTP values; **add Volvo EX40 (#1 2025 seller) and VW ID.7 (#2)** — both currently missing; fix Atto 3 to WLTP-consistent. Produce a signed `research/METHODOLOGY.md` backing all four rate families (public AC/DC, home SE1–SE4, Grön Teknik schablon) — same sign-off process as the LED calc.
- *Acceptance:* No cell marked PLACEHOLDER/UNVERIFIED in the shipped `.xlsx`; EX40 + ID.7 present; Atto 3 WLTP-consistent or relabeled; `research/METHODOLOGY.md` signed and dated; `verify_faithful.py` EXPECTED updated and PASS.
- *Effort:* M · *Owner?* **Yes** · *Files:* `excel/laddbox-kalkylator-data.xlsx` (+ `build_xlsx.py`), `excel/verify_faithful.py`, new `research/METHODOLOGY.md`, real `.xlsx` uploaded to the `lead-magnet` post on prod.

**P0-2 — Correct home rates to verified marginal values (data integrity / honesty).**
- *Problem:* `engine.js` L28–31 ships SE2 1.60 / SE3 2.20 / SE4 2.60. Verified research (confirmed, high confidence): marginal all-in home cost is SE1 1.45 / SE2 1.50 / SE3 1.90 / SE4 2.10 for 2025–2026; the higher values resemble fixed-fee-inclusive *average* house prices and are indefensible as a displayed marginal per-kWh figure ("Hemmaladdning 2,20 kr/kWh" is ~16 % too high).
- *Recommendation:* Set `REGIONS` = {SE1 1.45, SE2 1.50, SE3 1.90, SE4 2.10}; label the figure "marginal all-in (spot+nät+skatt+moms, off-peak)" in methodology. Caveat for marketing: if any copy says "hemmaladdning kostar UPP TILL X", the defensible ceiling is ~2.4 (peak-month only) — never 2.60.
- *Acceptance:* Rates corrected in `prototype/data.js`, `prototype/engine.js` fallback, `_decoded/00_js-engine.js`, the `.xlsx` PriceAreas sheet, and `verify_faithful.py` EXPECTED (currently L275–277 still hold 1.60/2.20/2.60); region tooltip text matches; methodology states "marginal"; oracle PASS.
- *Effort:* S · *Owner?* **Yes** (sign-off on the values) · *Files:* `prototype/data.js`, `prototype/engine.js`, `_decoded/00_js-engine.js`, `excel/laddbox-kalkylator-data.xlsx`, `excel/verify_faithful.py`.

**P0-3 — Set DC default rate to 5.50 + record the AC/DC/blend default decision.**
- *Problem:* `engine.js` L37 `publicDcRateSekPerKwh = 5.99`, DC is the default public type (`aria-pressed='true'`), and DC maximises the headline gap (CHANGES.md backlog 1). Research: ~5.50 is the defensible ad-hoc average; 5.99 errs ~9 % high.
- *Recommendation:* Set DC = 5.50 across engine, decoded engine, `.xlsx` coefficients, and oracle; update the DC tooltip copy (`index.html` ~L110 "~5,99 kr/kWh") to the shipped value; disclose subscription pricing (~3.40–4.50). Resolve **OWNER DECISION DC-1** (default type) and record it in `CHANGES.md`.
- *Acceptance:* DC = 5.50 in `engine.js`, `_decoded/00_js-engine.js`, `.xlsx`, `verify_faithful.py` (L295/383 currently 5.99); tooltip matches; DC-1 recorded.
- *Effort:* S · *Owner?* **Yes** · *Files:* `prototype/engine.js`, `prototype/index.html`, `prototype/data.js`, `_decoded/00_js-engine.js`, `_decoded/01_backend.php` (DC tooltip in render fn), `excel/laddbox-kalkylator-data.xlsx`, `excel/verify_faithful.py`.

**P0-4 — Register / verify the `lead-magnet` CPT and all external deps on production.**
- *Problem:* Every entry point gates on `post_type === 'lead-magnet'` (data API L79, render L690, save hook `save_post_lead-magnet`, metabox), but **no `register_post_type` exists in any snippet** (grep confirmed). Absent CPT → `ampy_render_ev_lead_magnet()` returns `''` (blank section) and `/data` 404s, with no diagnostic. This is the most likely "blank on go-live" failure.
- *Recommendation:* Either (a) document the exact plugin/snippet that registers the CPT as a hard prerequisite and verify on prod, or (b) add a defensive `register_post_type` guarded by `post_type_exists('lead-magnet')` inside this snippet. Add an admin notice if the CPT is absent. Verify on a clean site: CPT exists, real `.xlsx` uploaded + parsed, webhook URL + notify email set.
- *Acceptance:* On a clean site with only Ampy snippets, the CPT exists, metabox renders, and the calculator outputs (not empty state); handover names the registering component or this snippet registers it defensively.
- *Effort:* S · *Owner?* **Yes** (which option) · *Files:* `_decoded/01_backend.php`, plus a deployment runbook in `research/RUNBOOK.md`.

**P0-5 — Protect the `/lead` endpoint against abuse (REST security / anti-spam).**
- *Problem:* Both routes `permission_callback => '__return_true'` (L64, L71); the JS-sent `X-WP-Nonce` is never verified; no rate-limit, honeypot, or captcha. `/lead` fires n8n, emails staff, and appends PII to post meta — trivially floodable.
- *Recommendation:* Keep route public (anonymous must submit) but add: hidden honeypot + min-time-to-submit (<2 s rejected); per-IP transient rate-limit (e.g. 5 / 10 min, return 429); optional Cloudflare Turnstile verified server-side; validate `X-WP-Nonce` when present; enforce max payload + reject unknown/oversized `type`.
- *Acceptance:* A scripted POST loop is throttled to 429; filled-honeypot / sub-threshold submissions return 200 but are dropped (not delivered/logged); a single legit UI submission still reaches webhook/email/log.
- *Effort:* M · *Owner?* **Yes** (Turnstile yes/no) · *Files:* `_decoded/01_backend.php` (REST callbacks), `prototype/index.html` + `_decoded/01_backend.php` form (honeypot field), `prototype/engine.js` + `_decoded/00_js-engine.js` (time-stamp the form open).

**P0-6 — GDPR: consent checkbox + Article-13 notice + retention before the form collects PII.**
- *Problem:* Form collects name/email/phone/postnummer with **zero** consent/integritet/samtycke (grep: 0 hits in both backend and prototype), no privacy link, no lawful basis surfaced. On submit, full PII is written to `_ampy_ev_calc_leads` post meta (L152–168, capped at 100 via `array_slice($log,0,100)` — silent truncation), forwarded to n8n (undocumented processor, no DPA) and staff email. §19 MFL requires PRIOR opt-in for the "Maila kalkylen" path (electronic direct marketing); postnummer→local-installer routing is a third-party disclosure.
- *Recommendation:* Add a required, **unticked, granular** consent checkbox (separate from submit) with a working integritetspolicy link + concise Article-13 notice **at the form**; record consent text/version + timestamp in the payload; block submit client- AND server-side without it. Document n8n as a processor + a DPA. Decide retention: prefer **not** persisting raw PII in post meta (webhook/email = system of record), or set a retention window + erasure path. Honor opt-out immediately.
- *Acceptance:* Submit blocked client+server without consent; payload carries consent flag + policy version + timestamp; privacy link visible; n8n documented as processor; written retention/erasure decision exists and the post-meta log either stops holding raw PII or has enforced retention.
- *Effort:* M · *Owner?* **Yes** (retention policy, privacy-policy URL, DPA) · *Files:* `prototype/index.html` + `_decoded/01_backend.php` (form markup), `prototype/engine.js` + `_decoded/00_js-engine.js` (validation + payload), `_decoded/01_backend.php` (server validation + storage), `research/RUNBOOK.md` (retention/erasure + DPA).

**P0-7 — Excel parser must not silently import 0 rows as "OK".**
- *Problem:* Confirmed: `build_sheet_map` L505 `'xl/' . ltrim($rel['Target'],'/')` breaks on openpyxl absolute targets (`/xl/...` → `xl/xl/...`); `read_sheet` L524 only special-cases `t==='s'` (and `'b'`), not openpyxl `inlineStr` (`<is><t>`); the success path L460–462 emits "… imported." which contains "OK", so the metabox shows green even at 0 rows → blank calculator on a "successful" save by a non-technical editor.
- *Recommendation:* (a) Normalise absolute/relative targets: `$t = ltrim(Target,'/'); $map = strpos($t,'xl/')===0 ? $t : 'xl/'.$t;` (b) Add `inlineStr` support in `read_sheet` (read `$cell->is->t` + concatenate `is->r->t` runs). (c) Make zero-row a **hard red Error** (no "OK" substring), do **not** overwrite previously-good `_ampy_ev_calc_data`.
- *Acceptance:* An openpyxl copy imports the same 6 models / 4 chargers; an empty/garbled file → red "Error" badge and no overwrite; `verify_faithful.py` (mirroring the patch) still PASSes.
- *Effort:* M · *Owner?* No · *Files:* `_decoded/01_backend.php` (parser), `excel/verify_faithful.py`.

**P0-8 — Webhook delivery must not silently drop leads (reliability).**
- *Problem:* L109–116 posts to n8n with `blocking => false`, result never inspected; email fallback is in the `elseif` (L117) — fires only when webhook URL is **empty**. So if n8n is down/5xx, the lead is neither retried nor emailed, yet the browser always gets `{success:true}` → silent lead loss, the worst failure for a lead-gen tool.
- *Recommendation:* Send the webhook **blocking** with a short timeout; on non-2xx/WP_Error fall through to the notification email (and/or enqueue a wp-cron / Action Scheduler retry). At minimum, always send the fallback email *in addition* for now, and record a delivery-failed flag + count surfaced in the metabox.
- *Acceptance:* With the webhook pointed at a 500, a submitted lead is still delivered via email (or retried) and the failure is visible in admin; user sees success only when ≥1 delivery path succeeded or a durable record exists.
- *Effort:* M · *Owner?* **Yes** (blocking-with-fallback vs always-also-email) · *Files:* `_decoded/01_backend.php`.

**P0-9 — Port the four Iteration-1 honesty/a11y fixes into the deployed WP source.**
- *Problem:* The deployed artifact is the WP snippet, and all four logged fixes are still stale: `_decoded/01_backend.php` L1030 `(50%)` (overstates Grön Teknik vs engine's 48,5 %), L791 `Din körvanor`, L795 orphan `for="ampyEvKmSlider"`; `_decoded/00_js-engine.js` L491 hero sub still `"…laddboxen är betald och Grön Teknik inräknat."` without the baseline clause. Go-live would ship the *less honest, less accessible* copy — a direct moat regression.
- *Recommendation:* Port all four; reconcile the methodology card's "50 % avdrag (… 97 % av priset)" prose to the single 48,5 % narrative (derive from `RATES.gronTeknikRate` so it can't drift). Add a prototype↔WP diff step to the launch checklist.
- *Acceptance:* `01_backend.php` reads `Dina körvanor`, no orphan `for=`, footnote `ca 48,5% av priset`; `00_js-engine.js` hero sub carries the `jämfört med fortsatt publik laddning` clause; grep for `(50%)` marketing-copy returns nothing; CHANGES.md logs the port.
- *Effort:* S · *Owner?* No · *Files:* `_decoded/01_backend.php`, `_decoded/00_js-engine.js`, `prototype/CHANGES.md`.

**P0-10 — Fix the two WCAG 2.1 AA blockers that undercut the "defensible" positioning.**
- *Problem (a) — slider names:* the two primary inputs (Körsträcka, Andel offentlig) are `div role="slider" tabindex=0` in `renderRangeSlider()` with **no accessible name** (no aria-label/labelledby; the km label's `for` is orphaned) and value changes announce nothing → unusable for SR users.
- *Problem (b) — contrast:* computed (not eyeballed) white-on-teal CTA "Få en offert" = **2.96:1**, active segmented teal-on-white = 2.81:1, faint `.42`-alpha captions/axis = 3.99:1 — all below AA. (c) `aria-live="polite"` wraps the entire results card → re-announces hero+trio+breakdown+chart+CTA on every tick (CHANGES.md backlog 3).
- *Recommendation:* Give each slider `aria-labelledby` (or replace with native `<input type=range>` styled to match — keyboard/AT/touch-correct for free); darken the action teal for text surfaces and raise faint alpha to ~.55 (these are **design-system-shared** tokens — coordinate with LED/battery calcs); remove card-level `aria-live`, scope one debounced visually-hidden status that announces only the headline once.
- *Acceptance:* Focusing each slider announces name+value+unit and arrow-key changes are spoken; CTA/submit/active-segment/captions all pass AA; one concise summary per input change, no count-up firehose.
- *Effort:* M · *Owner?* **Yes** (design-system token change affects other calcs) · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js` (slider names, live region), `prototype/styles.css` + `_decoded/02_styles.css` (tokens), `prototype/index.html` + `_decoded/01_backend.php` (card `aria-live`, label `for`).

---

### P1 — SHOULD (honesty framing, parity, reliability, lead-funnel quality)

**P1-1 — Resolve the headline honesty framing (installation cost + residual public share + "Ren besparing"/"betald").**
- *Problem:* `netCost = price − 48.5%` only; **installation (5 000–15 000+ kr) is never modelled**, yet the hero asserts "laddboxen är betald" and "Att betala" reads as all-in. Separately, `annualSaving` credits 100 % of today's public kWh as switchable (road trips still need public charging). Both inflate the figure; both are flagged across calc-lead, UX, and CHANGES.md backlog 2.
- *Recommendation:* **OWNER DECISION FRAME-1.** Either (a) add an installation-cost input/assumption to `netCost`+payback AND a residual-switchable-share (default ~80 % of public kWh), or (b) relabel: "Att betala" → "Laddboxens nettopris (exkl. installation)", soften "Ren besparing" → "Uppskattad besparing", drop "betald" for an installation-excluded figure, and state the 100 %-switch assumption **adjacent to the saving number** (not only in collapsed methodology). Model the combined payback jointly with P0-2/P0-3 (see §2.0).
- *Acceptance:* No "cost"/"payback" number implies installation is included unless it is; "betald"/"paid" not used for an installation-excluded figure; 100 %-switch assumption sits next to the hero; combined payback reads credibly.
- *Effort:* M · *Owner?* **Yes** · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`, `prototype/index.html` + `_decoded/01_backend.php`, `prototype/CHANGES.md`.

**P1-2 — Lead with the annual saving, not the 10-yr cumulative (squint test + credibility).**
- *Problem:* Hero shows "Sparar på 10 år 46 370 kr" as the giant number; the believable, instantly-verifiable annual ~5 300 kr/år is demoted into the trio. The 10-yr lump next to a ~13 000 kr product triggers skepticism and fails the 5-second squint test.
- *Recommendation:* Make the **annual saving** the largest element ("~5 300 kr/år … jämfört med fortsatt publik laddning"); keep the 10-yr figure as secondary support (already on the chart end-label). After P0-2/P0-3/P1-1 corrections, re-check the number lands as credible.
- *Acceptance:* On default load, the single largest element expresses kr/år; a 5-second viewer can state the approximate yearly saving; 10-yr remains visible but secondary.
- *Effort:* M · *Owner?* **Yes** (hero hierarchy) · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`, `prototype/styles.css` + `_decoded/02_styles.css`.

**P1-3 — Reliable lead delivery telemetry + UTM/source capture.**
- *Problem:* Zero instrumentation (no gtag/dataLayer/utm_/referrer in `buildPayload`); the LED calc had funnel telemetry — this regressed to none. Business goal is *qualified leads* but source attribution and funnel drop-off are invisible; live A/B (the only way to validate the vendor-sourced CRO benchmarks) is impossible without it.
- *Recommendation:* Capture UTM + referrer + landing path on load into the payload (webhook/email/log); emit a small event set (calc_view, input_change, cta_quote_click, lead_submit, lead_success, email_calc_submit) consistent with the LED taxonomy; gate third-party analytics behind the P0-6 consent decision; degrade cleanly with no UTM/tag.
- *Acceptance:* A lead at n8n/email includes utm_source/medium/campaign + referrer + path when present; funnel events fire and are visible; no errors when absent.
- *Effort:* M · *Owner?* **Yes** (which analytics tag; consent coupling) · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`, `_decoded/01_backend.php`.

**P1-4 — Methodology Grön Teknik card: one coherent 48,5 % narrative.**
- *Problem:* `populateMethodology()` item 4 renders the live 48,5 % in code but hard-codes prose "50 % avdrag (Skatteverkets schablon: 97 % av priset)" — three figures in one card (folded into P0-9's port, but the prose itself must be rewritten).
- *Recommendation:* Single derivation: 50 % of arbete+material × 97 % schablon ≈ 48,5 % of turnkey price; calc applies 48,5 %; derive the displayed % from `RATES.gronTeknikRate×100` so it can't drift.
- *Acceptance:* One coherent narrative; stated % = `gronTeknikRate×100` = the "Att betala" math; no standalone "50 %".
- *Effort:* S · *Owner?* No · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`.

**P1-5 — Lead form: value reinforcement, trust line, phone friction, email-only path.**
- *Problem:* Single CTA opens a 4-field form (namn/e-post/telefon/postnummer, all required) with no result echo at the point of commitment and no privacy/no-spam line near the phone ask; the lower-friction "Maila kalkylen" path is visually subordinate.
- *Recommendation:* Echo the result + deliverable in the open form; add a trust line near phone/zip; make phone optional OR two-step (email first, phone on success); elevate the email-only capture to equal prominence. (Research: ≤4–5 fields; multi-step +~21 % B2B; result-first lifts fill.)
- *Acceptance:* Open form restates the headline result + deliverable; privacy reassurance adjacent to phone; phone optional or email-only path equally prominent; form-start→submit tracked.
- *Effort:* M · *Owner?* **Yes** (phone required?) · *Files:* `prototype/index.html` + `_decoded/01_backend.php`, `prototype/engine.js` + `_decoded/00_js-engine.js`.

**P1-6 — Mobile km-slider tick labels illegible ≤390 px.**
- *Problem:* 8 full-number ticks (5 000…50 000) in a flex row with `overflow:hidden` cannot fit ~358 px → clipped/overlapping; non-uniform steps under uniform spacing reads as a broken scale.
- *Recommendation:* On narrow containers abbreviate ("5k"…"50k") or show endpoints + active only; drop the clipping.
- *Acceptance:* At 360 px and 390 px all rendered tick labels are fully visible and non-overlapping; active step clear.
- *Effort:* S · *Owner?* No · *Files:* `prototype/styles.css` + `_decoded/02_styles.css` (+ engine tick rendering if abbreviating).

**P1-7 — Hide dead "Läs mer" link when `learn_more_url === '#'`.**
- *Problem:* All four chargers' `learn_more_url` is `#`; the engine renders "Läs mer om <charger>" as a no-op anchor at the bottom of the conversion path.
- *Recommendation:* Hide the link when slug `=== '#'`; real URLs land via P0-1.
- *Acceptance:* No dead anchor renders; every active charger has a non-`#` URL or the link is hidden.
- *Effort:* S · *Owner?* No (URLs themselves are P0-1/owner) · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`.

**P1-8 — Custom listbox selectors: complete the ARIA/keyboard model.**
- *Problem:* Car/charger pickers put `aria-expanded` on the wrapper not the trigger; options are focusable `<button>`s inside `li role="option"` (malformed listbox); no arrow-key nav, no `aria-activedescendant`, Escape doesn't return focus to the trigger.
- *Recommendation:* Adopt the APG combobox/listbox pattern (expanded+controls on the trigger; Arrow/Home/End/type-ahead; activedescendant; focus return) OR replace with a native `<select>` styled to match (shared with other calcs — native is robust).
- *Acceptance:* Trigger exposes expanded+controls; list navigable by Arrow/Home/End; active option conveyed; Escape returns focus; no focusable controls inside `role=option`.
- *Effort:* L · *Owner?* **Yes** (APG vs native, design-system-shared) · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`, `prototype/styles.css` + `_decoded/02_styles.css`.

**P1-9 — Touch targets < 44 px (slider thumb, tooltip "i", tick buttons, segments).**
- *Problem:* Slider thumb 24 px, tooltip "i" 16 px, ticks shrink below 24 px under 500 px, segments 32–36 px — several fail even the 24 px AA minimum (2.5.8).
- *Recommendation:* ≥44 px hit areas (invisible target around the 24 px thumb; padded "i"; stop shrinking ticks below ~24 px; ≥44 px segment/toggle height on touch).
- *Acceptance:* All interactive controls pass a 44 px tap test at phone width.
- *Effort:* M · *Owner?* No · *Files:* `prototype/styles.css` + `_decoded/02_styles.css`.

**P1-10 — Lead-form a11y: tie validation errors to inputs + announce.**
- *Problem:* `submitLeadForm()` sets a red border + sibling error span but no `aria-invalid`, no `aria-describedby`, errors not in a live region, focus not moved → SR users get no feedback (color-only).
- *Recommendation:* On failure set `aria-invalid=true` + `aria-describedby=errorId`, move focus to first invalid field, clear on success.
- *Acceptance:* Invalid submit sets aria-invalid + describedby, focus moves, SR announces the field error; error conveyed by more than color.
- *Effort:* S · *Owner?* No · *Files:* `prototype/engine.js` + `_decoded/00_js-engine.js`.

---

### P2 — NICE (polish, robustness, defensibility nuance)

| # | Item | Problem → Recommendation | Effort | Owner? | Files |
|---|---|---|---|---|---|
| P2-1 | DC charging-loss precision | Flat 0.90 over-penalises DC kWh (~5 % real loss); symmetric so saving ~neutral but displayed publicKwh inflated. Differentiate AC/DC loss OR document the uniform 0.90 as an AC-chain assumption. | M | Yes | `engine.js`, `00_js-engine.js`, `.xlsx`, methodology |
| P2-2 | ±10 % band reframing | Reframe as illustrative modelling band, list real uncertainty drivers (rate/region/switch-share/winter +15–30 %); align payback-display cap with chart horizon. | S | No | `engine.js`, `00_js-engine.js` |
| P2-3 | Empty/no-saving state coordination | At 0 % public the hero shows a negative 10-yr number while the chart shows a helpful nudge — card contradicts itself. Coordinate: neutral hero, suppress negative cumulative, keep nudge. | S | No | `engine.js`, `00_js-engine.js` |
| P2-4 | 10-yr hero range + assumptions caption | Show 10-yr as a range and/or adjacent assumptions caption; reproducible from signed inputs (depends on P0-1/2/3). | M | Yes | `engine.js`, `00_js-engine.js`, `index.html` |
| P2-5 | "Antal sökande" stepper friction | Almost never changes output (cap 50 000 ≫ ~6 300 deduction). Demote to advanced/collapsed or surface only if net cost would exceed cap. | S | Yes | `index.html`, `01_backend.php`, `engine.js` |
| P2-6 | "I dag" axis label hidden when payback early | Common case hides the origin label. Reposition/stack instead of hiding so both origin + break-even show. | S | No | `styles.css`, `02_styles.css` |
| P2-7 | Payback chart text alternative | Chart fully `aria-hidden`; add a visually-hidden summary (break-even year + 10-yr net), updated on input. | S | No | `engine.js`, `00_js-engine.js` |
| P2-8 | Tooltips keyboard/touch/SR | Tip text only in `data-tip`/`::after`; not in a11y tree, broken on touch/`:focus-visible`. Expose via `aria-describedby`/visible help; toggle on click/Enter, dismiss Esc. | M | No | `engine.js`, `00_js-engine.js`, `styles.css` |
| P2-9 | Heading outline (h1→h3 skip) | Make inputs/results/methodology titles real headings; no level skips. | S | No | `engine.js`, `index.html`, `01_backend.php` |
| P2-10 | Re-import only on attachment-ID change | Replacing file contents at same media ID never re-parses → stale data behind "OK". Compare mtime/md5; add a "Re-import now" button; show parsed counts + timestamp. | S | No | `_decoded/01_backend.php` |
| P2-11 | Fluid type 100cqi vs half-width container | Type interpolates toward clamp-min on desktop. Recalibrate clamp denominators to real container width, or revert `--fs-*` to design-system 100vw. | M | Yes | `styles.css`, `02_styles.css` |
| P2-12 | Empty/error/loading states + silent 2.20 fallback | Branded empty/error state w/ phone fallback; email-failure uses error style not green; surface data-route 404/500 to admins; reconsider silent `homeRate=2.20` fallback (prefer disabling result over a fabricated number). | M | No | `engine.js`, `00_js-engine.js`, `01_backend.php` |
| P2-13 | Performance: minify + self-host fonts + scope CSS | Minify the ~51 KB CSS / ~40 KB JS global snippets; self-host all 3 font families (display:swap, used weights only); scope heavy CSS to lead-magnet pages. | M | No | snippet delivery, `styles.css` |
| P2-14 | Winter-consumption disclosure | UI note: real-world Swedish winter consumption ~15–30 % above WLTP (extreme cold +60–80 %); engine keeps WLTP (charging loss separate — do not double-count). | S | No | `index.html`, `01_backend.php`, methodology |
| P2-15 | Browser support / no-JS / SEO | Document a browser support matrix (container-queries needed); add a `<noscript>` value-prop fallback; consider SSR of the headline value prop for crawlability. | M | Yes | `index.html`, `01_backend.php` |
| P2-16 | Automated test/diff gate | Add an engine unit test, a prototype↔WP copy-diff gate, and keep `verify_faithful.py` in lockstep with rate changes (currently the only oracle, hand-maintained). | M | No | `excel/verify_faithful.py`, new test/CI |

---

## 3. Sequenced roadmap (MVP → production)

**Milestone A — Data truth & substantiation (unblocks every public number).** P0-1, P0-2, P0-3, P1-4. Owner signs the data dossier (`research/METHODOLOGY.md`), home/DC rates corrected, oracle (`verify_faithful.py`) green. **Gate A:** no placeholder/overstated number remains; oracle PASS. *(Owner decisions DC-1 land here.)*

**Milestone B — Honest framing (the headline reads credible).** P1-1, P1-2, P1-4, P2-2. Decide FRAME-1 (installation + residual share vs relabel); lead with annual saving; reconcile Grön Teknik. **Gate B:** combined payback credible; no "betald"/"Ren besparing" overclaim; assumptions adjacent to the number.

**Milestone C — Pipeline safety & compliance (the form can legally collect PII).** P0-5, P0-6, P0-8, P1-3. Honeypot+rate-limit, consent+Article-13+retention+DPA, durable webhook delivery, telemetry/UTM. **Gate C:** spam loop 429'd; submit blocked without consent; n8n-down lead still delivered; UTM in payload.

**Milestone D — Deploy integrity (it actually renders on prod).** P0-4, P0-7, P0-9, P2-10. CPT verified/registered, parser hardened (no silent-zero), Iteration-1 fixes ported, in-place re-import detected. **Gate D:** clean-site render; openpyxl re-save imports correctly or red-errors; prototype↔WP diff clean.

**Milestone E — Accessibility & UX polish.** P0-10, P1-5–P1-10, P2-* (a11y/UX). **Gate E:** WCAG 2.1 AA pass on the audited blockers; mobile legible; lead funnel optimized.

**Milestone F — Launch hardening.** P2-13, P2-15, P2-16 + the launch checklist (§5). **Gate F:** perf/SEO acceptable; diff gate + oracle in CI.

> P0-1→C is the critical path: substantiation gates the public claim, compliance gates the form, deploy integrity gates rendering. A–D are mandatory for go-live; E is strongly recommended (legal/credibility risk if skipped); F is post-launch-tolerable but should be scheduled.

---

## 4. OWNER DECISIONS NEEDED (explicit — nothing ships until these are recorded in CHANGES.md)

1. **DC-1 — Default public charging type & rate.** AC 4.50 / DC 5.50 / blend ~4.0–4.5. *Recommendation: DC 5.50 default + disclose subscription ~3.40–4.50.* (Drives the headline gap.)
2. **FRAME-1 — Installation cost & residual public share.** (a) Model installation + ~80 % switchable share, or (b) relabel "Att betala"/"Ren besparing"/"betald" and disclose 100 %-switch. *Recommendation: (a) for the honesty moat.*
3. **Real product data sign-off.** Final charger names, prices, `learn_more_url`s, and EV efficiencies (incl. add EX40 + ID.7, fix Atto 3) — **who signs `research/METHODOLOGY.md`** and dates it.
4. **Home + public rate values.** Confirm SE1 1.45 / SE2 1.50 / SE3 1.90 / SE4 2.10 and the four rate-family sources.
5. **GDPR package.** Privacy-policy URL, consent copy wording, retention window + erasure path, n8n DPA, whether raw PII persists in post meta at all.
6. **Anti-spam posture.** Cloudflare Turnstile yes/no; per-IP rate-limit thresholds.
7. **Webhook reliability mode.** Blocking-with-email-fallback vs always-also-email vs queued retry.
8. **CPT ownership.** Document the registering plugin/snippet, or approve the defensive `register_post_type` in this snippet.
9. **Analytics tag & event taxonomy.** Which tag (gtag/Plausible/…), aligned to the LED calc; consent coupling.
10. **Hero hierarchy & "Ren besparing" wording.** Approve leading with annual saving and the softened estimate language.
11. **Design-system token change.** Darkening the action teal + raising faint alpha affects the LED/battery calcs — approve the shared-token change.
12. **Selector a11y route.** Full-APG listbox vs native `<select>` (shared component decision).

---

## 5. Launch checklist (acceptance gates — all must be ✅)

**Data & substantiation**
- [ ] No PLACEHOLDER/UNVERIFIED cell in the shipped `.xlsx`; EX40 + ID.7 present; Atto 3 WLTP-consistent.
- [ ] `research/METHODOLOGY.md` signed + dated, backs all four rate families.
- [ ] Home rates SE1 1.45 / SE2 1.50 / SE3 1.90 / SE4 2.10; DC 5.50; consistent across `engine.js`, `_decoded/00_js-engine.js`, `.xlsx`, `verify_faithful.py`.
- [ ] `excel/verify_faithful.py` PASS against the real `.xlsx` (EXPECTED updated off the stale 1.60/2.20/2.60/5.99).

**Honesty / claims**
- [ ] Hero leads with annual saving; 10-yr secondary; assumptions adjacent.
- [ ] No "betald"/"Ren besparing"/all-in "Att betala" overclaim (FRAME-1 resolved).
- [ ] One coherent 48,5 % Grön Teknik narrative everywhere; grep `(50%)` in `_decoded/` returns no marketing-copy hit.

**Compliance & pipeline**
- [ ] Required unticked consent checkbox + Article-13 notice + working privacy link; submit blocked client+server without it; consent recorded in payload.
- [ ] n8n documented as processor + DPA; retention/erasure decision written; post-meta PII handled per policy.
- [ ] `/lead` honeypot + min-time + per-IP rate-limit (429 verified by a scripted loop); nonce validated when present.
- [ ] n8n-down (500) lead still delivered via email/retry; failure visible in admin; success shown only on durable delivery.
- [ ] UTM/referrer/path in payload; funnel events fire.

**Deploy integrity**
- [ ] `lead-magnet` CPT exists on prod (or defensively registered); real `.xlsx` uploaded + parsed; webhook URL + notify email set.
- [ ] openpyxl/Excel-for-web re-save imports correctly; empty/garbled file → red Error, no overwrite of good data.
- [ ] Four Iteration-1 fixes present in `_decoded/`; prototype↔WP copy diff clean.
- [ ] Clean-site smoke test: calculator renders (not empty state); a real submission reaches webhook + email + log.

**Accessibility (WCAG 2.1 AA)**
- [ ] Both sliders have accessible names + announce value changes; arrow keys work.
- [ ] CTA/submit/active-segment/captions pass AA contrast.
- [ ] Card-level `aria-live` removed; one debounced status summary.
- [ ] Touch targets ≥44 px; mobile km ticks legible at 360/390 px; form errors tied + announced.

**Pre-launch verification**
- [ ] Manual end-to-end on staging (desktop + ≤390 px) with NVDA/VoiceOver spot-check.
- [ ] Lighthouse run; render-blocking third-party fonts removed from non-calc pages.
- [ ] Rollback plan documented (previous snippet versions retained).
