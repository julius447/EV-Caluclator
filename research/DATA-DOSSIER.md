# Laddbox-kalkylatorn — DATA DOSSIER

Sourced, recommended default values for the EV/laddbox savings calculator.
Compiled by the DATA lead from the VERIFIED RESEARCH bundle (research + adversarial
verification). Date: 2026-06-09.

This dossier is the single source of truth for the **researched & sourced** numbers
that feed `recommended-data.json` and (via `excel/build_xlsx.py`) the importable
`.xlsx`. It is paired with the machine-readable file:
`/Users/juliuscallahan/Desktop/Claude Code/ev-kalkylatorn/research/recommended-data.json`.

---

## 0. Two kinds of data — read this first

| Bucket | What | Status |
|---|---|---|
| **RESEARCHED & SOURCED** | Public AC/DC rates, home kr/kWh per zone, per-EV kWh/10km, "Annan elbil" average, laddbox market price *ranges*, charging-loss & uncertainty defaults | Defensible from cited sources below. Use these. |
| **MUST COME FROM AMPY** | Ampy's real laddbox **SKUs / product names**, their **actual sell prices** (`price_sek`), their **product URLs** (`learn_more_url`), and the **Grön Teknik rate/cap** they intend to advertise | Placeholders only. Do **not** publish without Ampy sign-off. |

The Grön Teknik figures (rate + cap) were **not** in the research bundle and are a
business/tax-policy input, so they are flagged **MUST COME FROM AMPY** with the
statutory default noted below.

---

## 1. Public charging — AC & DC (kr/kWh)

**RESEARCHED & SOURCED.** Topic: `public-tariffs`. Confidence: AC medium, DC high.

| Field | Recommended | Prototype | Representative spread | Confidence |
|---|---|---|---|---|
| `public_ac_rate_sek_per_kwh` | **4.50** (KEEP) | 4.50 | 3.00–5.79 kr/kWh (public AC normal-/destinationsladdning) | medium |
| `public_dc_rate_sek_per_kwh` | **5.50** (lower from 5.99) | 5.99 | ad-hoc 4.99–6.30 typical; full 1.80–6.80 incl. dynamic/member; w/ subscription 3.40–4.50 | high |

**Sources**
- DC drop-in network average ~5.50 kr/kWh; full ad-hoc spread 1.80–6.80 — Allt om Elbil priskoll (2025-08-30): https://alltomelbil.se/stor-prisvariation-pa-snabbladdning-i-sverige-fran-180-kr-kwh-till-680-kr-kwh/
- Recharge official: AC ad-hoc 5.79, DC ad-hoc 6.29 — https://rechargeinfra.com/sv/priser/
- Ionity Direct 6.00 / Go 5.70; member 3.42–4.28 — https://laddpriser.nu/
- Mer member 3.40–5.10, ad-hoc ~4.95 — https://se.mer.eco/laddstationer/priser/
- Vattenfall InCharge AC example 3.50 (Nordstan) — https://www.nordstan.se/en/elbilsladdning
- Tesla Supercharger dynamic, non-member ~4.20–5.40 — https://teslaclubsweden.se/hur-mycket-kostar-det-att-ladda-pa-supercharger/

**Recommendation rationale**
- **AC 4.50 — KEEP.** Squarely mid-band for *public* AC (3.00–5.79). Well-justified; neither inflated nor low.
- **DC 5.50 — recommend lowering from 5.99.** 5.50 is the explicitly stated drop-in/ad-hoc **network average** — the most defensible single representative ad-hoc DC figure. 5.99 is also defensible (matches Recharge/Ionity/InCharge ad-hoc and errs conservatively toward expensive), but it sits ~9% above the market-average ad-hoc rate. 5.50 is the more centered choice. If the audience is mostly subscription/app users, ~4.50–5.00 would be even more representative.

**Caveats**
- Prices are highly **dynamic** (time-of-day): same station can swing ~1.70 (night) to ~6.10 (peak). Any single number masks this.
- **Member vs ad-hoc** is the biggest lever: subscriptions (79–249 kr/mo) cut DC by 20–40%. The default models a casual ad-hoc driver.
- Public **AC data is genuinely sparse** (mostly DC is published) → AC confidence is medium.
- Do **not** confuse public AC (3.00–5.79) with **home** AC charging (~1.50–3.00). 4.50 is correct ONLY as public/destination AC.
- Snapshot dated 2025-08-30; Ionity cut prices Feb 2026, so specifics may have drifted slightly.

---

## 2. Home electricity — all-in MARGINAL cost per elområde (kr/kWh incl. moms)

**RESEARCHED & SOURCED.** Topic: `home-elpris`. Verdict: confirmed (high). Per-zone
totals are medium confidence (network fee is monopoly-distributor-specific, doesn't
map cleanly to price zones).

| Zone | Recommended `home_rate_sek_per_kwh` | Prototype | Verdict on prototype | Confidence |
|---|---|---|---|---|
| **SE1** | **1.45** | 1.45 | KEEP (defensible as an upper bound) | medium |
| **SE2** | **1.50** | 1.60 | LOWER — 1.60 above even high-spot 2026 estimate | medium |
| **SE3** | **1.90** | 2.20 | LOWER — 2.20 exceeds high-spot 2026; resembles AVERAGE house price | medium |
| **SE4** | **2.10** | 2.60 | LOWER — 2.60 only reached in extreme winter-peak months | medium |

**Definition used.** All-in **MARGINAL** cost of one extra home-charged kWh =
spotpris + rörlig elöverföringsavgift + energiskatt + elhandlarens påslag, all + 25% moms.
Fixed monthly nät-/elhandelsavgifter are **excluded** (they don't change with EV kWh —
they belong in AVERAGE price, not marginal). Leaning toward higher early-2026 spot for a
forward-looking, conservative baseline.

**Component sources (all high confidence)**
- Spotpris 2025 annual: SE1 18.50 / SE2 18.31 / SE3 51.25 / SE4 66.97 öre/kWh ex moms — https://www.elbruk.se/elpris-historik-2025
- Spotpris early-2026 (Jan–May): SE1 58.4 / SE2 58.8 / SE3 82.1 / SE4 94.4 öre/kWh ex moms — https://www.energimarknadsbyran.se/el/dina-elavtal-och-kostnader/elhandelsavtalet/elpriser-statistik/manadspriser-pa-elborsen/
- Energiskatt 2026: std 36.0 / reduced (N Sweden) 26.4 öre ex moms — https://www.energimarknadsbyran.se/nyheter/nyhetsarkiv/2025/sankt-energiskatt-pa-el-2026/
- Rörlig elöverföring: Ellevio 26, Vattenfall 44.5 (2026), E.ON ~20+spot öre incl moms; representative ~28 incl (~22 ex) — https://www.ellevio.se/abonnemang/elnatspriser/hus/ , https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/elnatsavgifter/sakringsabonnemang-16-63a/
- Elhandlarens påslag villa ~13 öre/kWh incl moms — https://www.energimarknadsbyran.se/el/dina-elavtal-och-kostnader/elhandelsavtalet/elpriser-statistik/elpriser-utveckling-och-statistik/
- Moms 25% — Skatteverket

**Computed marginal totals (2025 low-spot / early-2026 spot), incl. moms** — verified by re-running the build-up:
SE1 1.07 / 1.47 · SE2 1.07 / 1.48 · SE3 1.60 / 1.89 · SE4 1.80 / 2.04 (winter-peak ~2.26 briefly).
Published AVERAGE all-in house price for contrast: 2.03–2.32 kr/kWh (includes amortized fixed fees — NOT the marginal EV cost; explains why prototype values look inflated).

**Caveats**
- **MARGINAL vs AVERAGE** is the key distinction. The prototype's high SE2/SE3/SE4 values conflate AVERAGE price (or 2022–23 crisis prices) with marginal cost. Overstating the home baseline **inflates the claimed saving** — so these must come down to keep the savings claim conservative.
- 2025 was an unusually LOW spot year (north summer spot 3–5 öre). Recommendation is weighted toward higher 2026 spot. 2026 full-year not yet available (Jan–May only at 2026-06-09).
- The **variable network fee** is the biggest uncertainty (~16–36 öre/kWh ex moms by nätbolag) and is set by the local monopoly distributor — it does **not** map cleanly to SE1–SE4.
- Reduced energiskatt applies to **all** of Norrbotten/Västerbotten/Jämtland + only Sollefteå/Ånge/Örnsköldsvik in Västernorrland. Much of southern/coastal SE2 (Sundsvall, Gävle, Dalarna) pays the **standard** rate → SE2 1.50 is a representative midpoint, closer to a floor than a ceiling for those households.
- For any "home charging costs UP TO X" copy, the defensible upper bound is **~2.4 kr/kWh** (peak month, high-network villa), **not 2.6**.
- Figures assume **off-peak/night** charging (favorable, ignores effekttariffer) → they are a floor, not a ceiling, for peak-hour fast charging.

---

## 3. Grön Teknik (skattereduktion) — rate, cap, eligibility

**RESEARCHED & SOURCED — verified against Skatteverket primary sources (2026-06-09; full detail in `gron-teknik-verified.md`).** All three parser keys are CONFIRMED:
- `gron_teknik_pct = 0.485` — 50 % of arbete+material × Skatteverkets 97 % schablon = 0,485 of the turnkey price (Rättslig vägledning 2025.3).
- `gron_teknik_cap_per_applicant_sek = 50000` — "högst 50 000 kr per person och år", shared across all grön-teknik categories, separate from ROT/RUT.
- `max_applicants = 2` — the cap is per person → up to 100 000 kr/household when two owners split the invoice and each has enough tax.
- **2026:** unchanged for laddningspunkt. (Only solceller dropped 20 %→15 % from 2025-07-01 — does NOT affect the laddbox figure; ignore the stale "20 %" mention in the table note below.)
- **Eligibility correction:** *lastbalansering is NOT statutory.* The real conditions are: prepared for **elmätning och debitering**, connector per **EN 62196-2 (Typ 2) / -3 (Combo)**, installed by an **F-skatt** firm, buyer **owns the bostad** and has sufficient tax. No solar required. Ampy still signs off on the exact advertised wording.

| Field | Prototype value | Status | Note |
|---|---|---|---|
| `gron_teknik_pct` (rate, fraction) | **0.485** (48.5%) | ✅ CONFIRMED (Skatteverket) | This is the statutory **laddningspunkt** sub-rate. The general Grön Teknik rate for solceller is 20%; for **laddningspunkt till elfordon** and battery storage the rate is **48.5%** (50% for solar-cell batteries under newer rules — confirm which Ampy uses). 48.5% is the correct figure for an EV charge-point installation. |
| `gron_teknik_cap_per_applicant_sek` (cap, SEK) | **50000** | ✅ CONFIRMED (Skatteverket) | Statutory Grön Teknik cap is **50 000 kr per person per year** (across all grön-teknik categories combined). Correct as a default. |
| `max_applicants` | **2** | ✅ CONFIRMED (Skatteverket) | Two co-owners can each claim → effective household cap 100 000 kr. Defensible. |

**Eligibility wording (suggested, MUST be confirmed with Ampy / against Skatteverket
before publishing):**

> "Grön teknik-avdraget ger **48,5 % skattereduktion på arbets- och materialkostnad** för
> installation av en laddningspunkt till elfordon. Avdraget dras direkt på fakturan
> (likt rot/rut). Taket är **50 000 kr per person och år**, och kan delas av upp till
> **två personer** som äger bostaden. Förutsätter att du har tillräckligt med skatt att
> reducera. Laddningspunkten måste vara förberedd för elmätare och kommunikation
> (lastbalansering) enligt Skatteverkets krav."

**Action for Ampy:** confirm (a) the **rate** they advertise (48.5% standard for
charge-points), (b) the **cap** (50 000 kr/person), (c) **eligibility caveats** they want
shown (bostadsägare, tillräcklig skatt, installerad av godkänd firma), and (d) whether
they want to model 1 or 2 applicants by default. Source of truth: Skatteverket "Grön teknik".

---

## 4. Per-EV-model consumption — kWh/10km (WLTP basis)

**RESEARCHED & SOURCED.** Topic: `ev-efficiency`. Verdict: partly_confirmed (high).
**Model names are real; consumption figures were illustrative placeholders and are now sourced.**

**Critical engine constraint:** the engine applies a **separate 10% charging loss**
(`charger_efficiency_pct = 0.90`, energy ÷ 0.90). Per-model figures **MUST stay
WLTP-based** — do NOT inflate for winter/charging, or losses double-count. A WLTP
kWh/100km ÷ 10 = the tool's kWh/10km.

| Model | `efficiency_kwh_per_10km` (recommended) | Prototype | Confidence | Note |
|---|---|---|---|---|
| Tesla Model Y | **1.69** | 1.68 | high | LR WLTP 16.9. State pre-Juniper LR basis; 2025+ Juniper RWD ~13.9 (more efficient → conservative). |
| Volvo EX30 | **1.70** | 1.65 | high | Type-approval WLTP 17.0–17.1 (Single Motor / ER). Research's 1.67 undershot; correction → ~1.70. |
| Volkswagen ID.4 | **1.75** | 1.75 | high | KEEP. WLTP ~17.0–17.7; real-world 171 Wh/km. |
| Kia EV6 | **1.72** | 1.72 | high | KEEP. LR RWD ~16.5 WLTP / 176 Wh/km real-world. |
| BYD Atto 3 | **1.55** | 1.78 | medium | LOWER. 1.78 was the *real-world* number (178 Wh/km), inconsistent w/ WLTP rows. True WLTP ~13.8–15.6 → ~1.40–1.56. Use ~1.55. (`onboard_ac_kw` = 7 for Atto 3.) |
| Annan elbil (average) | **1.70** | 1.70 | high | KEEP. 17.0 kWh/100km WLTP — sound, slightly conservative market average (SUV/crossover-heavy mix). |

**Optional additions (actual 2025 Swedish #1/#2 sellers, currently MISSING from picker):**

| Model | Suggested kWh/10km | 2025 regs | Note |
|---|---|---|---|
| Volvo EX40 / XC40 | **1.70** | 8,788 (#1) | WLTP 16.7; real-world ~194 Wh/km. Strong candidate to add. |
| Volkswagen ID.7 | **1.62** | 8,134 (#2) | Efficient aero sedan; real-world 159 Wh/km. Strong candidate to add. |

(Other corroborated values if the picker is widened: VW ID.3 ~1.60, Kia EV3 ~1.58,
Kia Niro EV ~1.60, Polestar 2 ~1.62, Hyundai Kona ~1.60, Hyundai Ioniq 5 ~1.72,
Toyota bZ4X ~1.70 [flag worst winter gap], Skoda Enyaq ~1.66.)

**Sources**
- Tesla Model Y WLTP 16.9 (LR) — https://www.wltpinfo.com/model/tesla/model_y_2024-2025/Electricity.html
- Real-world Wh/km (all models) — https://ev-database.org/cheatsheet/energy-consumption-electric-car
- Volvo EX30 type-approval WLTP 17.0–17.1 — https://www.wltpinfo.com/model/volvo/ex30_model_year_2024/Electricity.html
- BYD Atto 3 WLTP ~13.8 — https://evkx.net/models/byd/atto_3/atto_3/rangeandconsumption/
- 2025 best-sellers (EX40 8,788; ID.7 8,134; Model Y 5,820; 99,721 total EVs) — https://alltomelbil.se/de-50-mest-salda-elbilarna-i-sverige-2025/ (citing Mobility Sweden)

**Caveats**
- WLTP varies by variant/wheel/trim; one figure per model unavoidably averages over trims.
- Reject any sub-14 kWh/100km WLTP for an SUV (bad aggregator data, e.g. bZ4X ~12.4, Kona ~13.1 are erroneous).
- Two action items from verification: (1) make BYD Atto 3 WLTP-consistent (drop 1.78 → ~1.55); (2) optionally add EX40 + ID.7, the real 2025 top-2.
- **UI note to add:** real-world Swedish winter consumption runs **~15–30% above WLTP** (extreme cold up to +60–80%) — do NOT bake this into the per-model figure; show as informational context. Sources: M Sverige "Kalla fakta om räckvidd"; NAF El Prix 2026 (38% range loss at −32°C).

---

## 5. Laddbox market price ranges (kr, gross incl. moms)

**RESEARCHED CONTEXT for sanity-checking; actual SKUs/prices/URLs MUST COME FROM AMPY.**

The Chargers sheet (`name`, `price_sek`, `learn_more_url`) is **entirely placeholder**.
The numbers below are typical **market ranges** for the common Swedish 11/22 kW smart
laddboxar so Ampy's real figures can be sanity-checked — they are **not** Ampy's prices.

| Tier | Hardware-only range (kr, box only) | Notes |
|---|---|---|
| Budget 11 kW smart box | ~6 000–9 000 | e.g. entry Easee/Zaptec-class hardware, before installation |
| Mid 11/22 kW smart box | ~9 000–13 000 | most common band (matches prototype placeholder 10 990–13 490) |
| Premium / 22 kW w/ extras | ~13 000–17 000 | dynamic load balancing, display, etc. |
| **Installed** (box + typical installation) | **~15 000–30 000** before Grön Teknik | installation 6 000–18 000+ depending on cabling/distance; Grön Teknik 48.5% then applies |

Prototype placeholder rows (Amina S 12 990 / Easee Charge 10 990 / Zaptec Go 11 990 /
Garo Entity 13 490) are **plausible mid-tier hardware prices** but are **NOT verified
Ampy figures** — every `name`, `price_sek`, `badge`, and `learn_more_url` must be replaced
with Ampy's real catalogue before go-live. Note the schema: a charger row is **skipped if
`price_sek` is 0/blank**, and `learn_more_url` is `#` until real product URLs exist.

> Market-range price band is a rough, lower-confidence reference (retail varies widely by
> retailer, campaign, and whether installation is bundled). It exists only to flag if an
> Ampy price looks wildly off. **Do not publish these ranges as Ampy prices.**

---

## 6. System coefficients & advanced defaults

**RESEARCHED & SOURCED where applicable; tax/business inputs flagged.**

| Key | Recommended | Source / status | Confidence |
|---|---|---|---|
| `horizon_years` | 10 | Engine spec default | n/a (business choice) |
| `public_ac_rate_sek_per_kwh` | 4.50 | §1 — KEEP | medium |
| `public_dc_rate_sek_per_kwh` | 5.50 | §1 — lower from 5.99 | high |
| `charger_efficiency_pct` | 0.90 | Engine constant (10% charging loss); per-model figures must stay WLTP so this isn't double-counted | high |
| `gron_teknik_pct` | 0.485 | §3 — statutory laddningspunkt rate; **✅ CONFIRMED (Skatteverket) w/ Ampy** | n/a (tax) |
| `gron_teknik_cap_per_applicant_sek` | 50000 | §3 — statutory cap/person; **✅ CONFIRMED (Skatteverket)** | n/a (tax) |
| `max_applicants` | 2 | §3 — **✅ CONFIRMED (Skatteverket)** | n/a (business) |
| `uncertainty_pct` | 0.10 | ±10% uncertainty band; supports the legal requirement to show the saving as a **range, not a fixed figure** | n/a (modeling choice) |
| `annual_km` | 15000 | Typical Swedish annual mileage default | medium |
| `public_charging_pct` | 50 | UI slider default (0–100 here, not a fraction) | n/a (default) |
| `public_charging_type` | dc | UI default; pairs with the DC rate | n/a (default) |

**Legal note (from `legal-gdpr-cro` research, verdict: confirmed/high):** every
"spara X kr" claim is under **reversed burden of proof** (marknadsföringslagen). Keep this
sourced methodology file as the documented basis, present the saving as a **transparent
range with assumptions disclosed** (the `uncertainty_pct = 0.10` band supports this), and
ensure any baseline comparison is real and defensible. Do not publish a single exact
guaranteed figure.

---

## 7. Summary of changes vs prototype

| What | Prototype | Recommended | Why |
|---|---|---|---|
| DC public rate | 5.99 | **5.50** | Market-average ad-hoc; 5.99 ran ~9% high |
| SE2 home rate | 1.60 | **1.50** | Above high-spot 2026 marginal estimate |
| SE3 home rate | 2.20 | **1.90** | Exceeds high-spot 2026; resembled AVERAGE price |
| SE4 home rate | 2.60 | **2.10** | 2.60 only in extreme winter-peak |
| Volvo EX30 kWh/10km | 1.65 | **1.70** | Type-approval WLTP 17.0–17.1 |
| Tesla Model Y kWh/10km | 1.68 | **1.69** | LR WLTP 16.9 (rounding) |
| BYD Atto 3 kWh/10km | 1.78 | **1.55** | 1.78 was real-world, not WLTP-consistent |
| AC rate, ID.4, EV6, Annan, coeffs | — | **KEEP** | Already well-calibrated |
| (optional) add EX40 + ID.7 | absent | **add** | Actual 2025 #1/#2 sellers |

**Still blocked on Ampy:** real laddbox SKUs, `price_sek`, `learn_more_url`; and
confirmation of the Grön Teknik rate/cap/eligibility wording.
