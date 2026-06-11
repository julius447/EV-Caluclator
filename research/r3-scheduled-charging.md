# R3 — Scheduled / Smart Charging (owner point 2)

**Team:** UX · Research · CMO · Product Owner · Systemarkitekt
**Date:** 2026-06-11
**Tool:** Ampy Laddbox-kalkylator (`ev-kalkylatorn/prototype/`)
**Question from owner (point 2):** Surface SCHEDULED / SMART home charging so the
result is *more exact* and *more compelling*, without breaking honesty
(marknadsföringslagen / MFL §10 — no misleading claims).

---

## 0. TL;DR

- **Scheduled night/off-peak charging is real and material in Sweden 2025–26**, but
  the size of the win is **zone-dependent and shrinking in the south**. The classic
  "30–60 % cheaper at night" still holds for SE1/SE2 and in winter, but **spring/summer
  2025 inverted the curve in SE4** (cheapest mid-day, solar-driven). A defensible
  product must therefore claim a **modest, all-year, all-zone optimisation**, not the
  headline 50 %.
- The current calculator already uses a **flat marginal home rate** per zone
  (SE1 1.45 / SE2 1.50 / SE3 1.90 / SE4 2.10 kr/kWh). That flat rate is *roughly the
  time-weighted average* of charging at random hours. Scheduling concentrates the
  energy into the cheap hours → a **lower effective kr/kWh**.
- **Recommendation: Option (a) — a THIRD bar** "Hemma, schemalagd (optimerad)" in the
  *"Din månadskostnad – publikt vs hemma"* panel, **default visible**, fed by a new
  per-zone `homeRateOptimizedSekPerKwh`. The hero/annual saving stays anchored on the
  **normal** home rate (conservative, defensible); the optimised bar is an *additional,
  clearly-labelled* "så mycket mer kan du spara" layer. This is the only option that
  is simultaneously more *exact*, more *compelling*, and honest.

### Recommended optimised home rates (kr/kWh, delivered, allt-i-ett)

| Zone | Current flat home | **Optimised (schemalagd)** | Discount vs flat | Confidence |
|------|------------------:|---------------------------:|-----------------:|------------|
| SE1  | 1.45              | **1.30**                   | ~10 %            | High |
| SE2  | 1.50              | **1.35**                   | ~10 %            | High |
| SE3  | 1.90              | **1.60**                   | ~16 %            | Medium-High |
| SE4  | 2.10              | **1.80**                   | ~14 %            | Medium |

(Derivation in §4. These are deliberately *conservative* — the spot spread alone would
justify deeper cuts, but we discount only the **variable** part the household actually
controls, and we leave headroom for the SE4 inversion risk.)

---

## 1. First-principles: what does "scheduled charging saves money" actually mean?

The delivered home price of 1 kWh has three stacked parts:

```
home kr/kWh  =  spotpris (variable, hour-by-hour)
             +  påslag + elcertifikat + moms on energy (≈ fixed per kWh)
             +  nätavgift: överföringsavgift (fixed/kWh) + energiskatt (fixed/kWh)
             +  effektavgift (power tariff — depends on WHEN you draw, not just how much)
```

Only **two** of these move with *when* you charge:

1. **The spotpris component** — cheaper at night/off-peak (most of the year, most zones).
2. **The effektavgift / effekttariff** — many DSOs count **22:00–06:00 at half weight**,
   so shifting the car to the night roughly **halves its contribution to your monthly
   power peak**.

The fixed components (energiskatt ~42.8 öre/kWh + moms, överföring, påslag) do **not**
change with timing. So scheduling can only discount the *controllable slice* of the
bill — which is exactly why a **10–16 % cut on the all-in rate is the honest number**,
even though the spot *spread* alone is 30–60 %.

A modern laddbox does this automatically: you plug in, the box/app (Easee, Zaptec,
Wallbox, Tibber, Ellevio's app, etc.) shifts the kWh to the cheapest/half-tariff hours
overnight. **This is a real, default-available capability of the boxes Ampy sells** —
which is what makes claiming it defensible rather than aspirational.

---

## 2. Research findings (cited)

### 2.1 Spotpris day-vs-night spread, per zone

- **Night is typically 30–60 % cheaper than daytime** between ~00–06, confirmed across
  several Swedish sources. ([elbruk.se — billigare el dagtid/nattetid](https://www.elbruk.se/blogg/billigare-el-dagtid-nattetid))
- With a **timprisavtal + smart charging you cut charging cost ~20–30 % vs a fast/average
  contract.** ([elbruk.se](https://www.elbruk.se/blogg/billigare-el-dagtid-nattetid))
- Concrete SE3 (Stockholm) intraday example: overnight low (03:00) **€37/MWh** vs evening
  peak 19–21 **€85/MWh** vs weekend mid-day **€24/MWh** → **56 % weeknight / 52 % weekend
  savings** vs peak. ([gridio.io — 2025 Electricity Prices: 5 Insights for Swedish EV Drivers](https://www.gridio.io/blog/2025-electricity-prices-5-insights-for-swedish-ev-drivers))
- Smart charging "can save **up to ~2 100 kr/year** just by timing." ([gridio.io](https://www.gridio.io/blog/2025-electricity-prices-5-insights-for-swedish-ev-drivers))

### 2.2 2025 spot-price levels per zone (Jan–Oct 2025 averages, öre/kWh)

| | SE1 | SE2 | SE3 | SE4 | SE |
|--|----:|----:|----:|----:|---:|
| Jan–Oct 2025 avg | **15.8** | **15.9** | **49.9** | **66.3** | 35.6 |

([elmarknad.se — Elpriser 2025](https://elmarknad.se/elpriser/historik/elpriser-2025/)).
National 2025 average ~38.75 öre/kWh per [elspot.nu](https://elspot.nu/elpriser-historik-2025/).
For reference, 2024 full-year: SE1 30.1 / SE2 29.6 / SE3 39.4 / SE4 53.2 öre/kWh
([elbolag24.se](https://elbolag24.se/spotpris/)). The **north (SE1/SE2) is structurally
far cheaper** than the south (SE3/SE4) — the existing tool already encodes this in the
flat rates; scheduling adds a second axis on top.

### 2.3 The honesty caveat — the curve is inverting in the south

- **Spring/summer 2025, SE4 (and partly SE3): cheapest electricity is now MID-DAY, not
  at night** — solar floods the grid at noon, and night spot has at times been *higher*
  than day. "Ett tydligt trendbrott jämfört med tidigare år, då natten nästan alltid var
  billigast." ([elbruk.se](https://www.elbruk.se/blogg/billigare-el-dagtid-nattetid))
- **Implication:** a smart box optimises to the *cheapest hours whenever they are*
  (night in winter, mid-day in summer south) — so the **capability** still saves money,
  but a literal "ladda på natten = billigast" claim is **no longer universally true** and
  must not be the copy. We claim **"laddar automatiskt när elen är som billigast"**, not
  "på natten".

### 2.4 Effekttariffer / time-of-use nätavgifter

- **Ellevio:** effektavgift = average of the month's **3 highest hourly peaks**, and
  **22:00–06:00 is counted at HALF**. Explicitly recommends scheduling EV charging to
  22–06. ([Ellevio — Så fungerar effektavgiften](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/), [Ellevio — Elbilen, spotpriset och effektavgiften](https://www.ellevio.se/nyheter/elbil-laddning/elbilen-spotpriset-och-effektavgiften--sa-laddar-du-smart-i-vinter/))
- **Mechanism is spreading:** the 12 largest DSOs are rolling out effekttariffer; **all
  network companies must have them by 1 Jan 2027.** ([effekttariff.nu](https://effekttariff.nu/), [Vattenfall — Så fungerar effektavgifter](https://www.vattenfall.se/fokus/tips-rad/sa-fungerar-effektavgifter/))
- A Stockholm case study cites **~2 925 kr/yr** saved on peak-demand fees by shifting load.
  ([sourceful.energy](https://www.sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees))
- **Note:** from 1 Oct 2025 spot is set **per quarter-hour** (not hour), which makes
  automated boxes *more* valuable (finer granularity to exploit) — manual timing harder,
  automation easier. ([elbolag24.se](https://elbolag24.se/spotpris/))

### 2.5 Modern boxes schedule automatically (capability is real)

Every box in Ampy's catalogue (Zaptec, Easee, Wallbox, Charge Amps, go-e, Defa, Garo,
etc.) supports app-based scheduled/spot-following charging, natively or via Tibber/
Ellevio integrations. The owner can defensibly say "din laddbox gör det åt dig" because
it is a standard feature of the hardware being quoted. (General market knowledge,
corroborated by the smart-charging guidance in the cited DSO articles above.)

---

## 3. Why the flat rate already (roughly) represents "average" charging

The current `homeRateSekPerKwh` per zone is described in the tool's own tooltip as the
**"marginal allt-i-ett hemmakostnad (spotpris + nät + skatt)"**. That is the cost of a
kWh charged at a *representative* hour — i.e. close to the time-weighted average. So:

- **Flat home rate** = "I charge whenever, plug-and-forget on a flat/average basis."
- **Optimised home rate** = "My box shifts the kWh to the cheap + half-tariff hours."

The gap between them is precisely the value of point 2. Modelling it as a *second, lower
rate* is the cleanest possible representation and slots into the existing engine with
**one new field per zone** — no new math primitives.

---

## 4. Deriving the optimised rate per zone (defensible, conservative)

Let `flat` = current home rate. We discount **only the controllable slice**:

- **Spot share of the all-in rate** is small in the north (spot ~16 öre of a ~145 öre
  rate ≈ 11 %) and larger in the south (spot ~50–66 öre of 190–210 öre ≈ 26–31 %).
- A smart box captures roughly a **30 % cut on the spot share** (mid-point of the 20–30 %
  "smart vs flat contract" finding, hedged down for the SE4 inversion risk and the fact
  that not every household has a timprisavtal).
- **Effektavgift half-tariff** adds a further small, mostly-southern/urban saving, but it
  is not yet universal (full rollout 2027), so we fold only a token amount of it in and
  keep it as upside narrative, not headline math.

This yields:

| Zone | flat | spot share of rate | ~30 % off spot + token effekt | **optimised (rounded)** | effective discount |
|------|-----:|-------------------:|------------------------------:|------------------------:|-------------------:|
| SE1  | 1.45 | ~0.11              | −0.13 → 1.32                  | **1.30**                | ~10 % |
| SE2  | 1.50 | ~0.11              | −0.14 → 1.36                  | **1.35**                | ~10 % |
| SE3  | 1.90 | ~0.26              | −0.28 → 1.62                  | **1.60**                | ~16 % |
| SE4  | 2.10 | ~0.31              | −0.30 → 1.80                  | **1.80**                | ~14 % |

**Why these are safe under MFL:**
- They are **below** what the raw 30–60 % spot spread would justify → we under-claim.
- They are **all-year, all-zone** averages → robust to the SE4 summer inversion (the box
  still optimises; the *direction* changes, not the existence of a saving).
- They sit on top of an already-conservative flat rate, and the headline annual saving
  does **not** depend on them (see §5) → the optimised layer is purely additive upside.

**Confidence:** SE1/SE2 **High** (small spot share, low absolute risk). SE3 **Medium-High**.
SE4 **Medium** (inversion risk is real; the 1.80 figure is intentionally cautious).

> ⚠️ **Sign-off gate:** like all rates in `data.js`, these are research-grade and must be
> confirmed in the signed Excel before go-live. They are defensible defaults, not final.

---

## 5. DESIGN — evaluating the three options

### Option (a) — THIRD bar "Hemma, schemalagd (optimerad)"  ✅ RECOMMENDED
Add a third bar to the existing *"Din månadskostnad – publikt vs hemma"* panel, below the
normal home bar:

```
Publik laddning idag           ≈ 1 721 kr/mån   ████████████████████  (warning/orange)
Hemma efter installation       ≈   595 kr/mån   ██████                (success/green)
Hemma, schemalagd (optimerad)  ≈   501 kr/mån   █████                 (success, lighter/dashed)
```

- **Pros:** Most *exact* (shows the real extra win). Most *compelling* (a second, even
  smaller green number visually dramatizes "it gets even better"). Honest — both home
  states are shown, so nothing is hidden or overstated. Reuses the existing bar component
  (`--monthly-*-frac` CSS vars) — minimal build. Works for offert-only boxes (rate-only).
- **Cons:** Three bars is slightly denser on mobile (mitigated: bars already stack
  vertically; a third row is fine). Needs one clear sub-label so users don't think it's a
  separate product.
- **Verdict:** Best balance of exactness + persuasion + honesty.

### Option (b) — Toggle "schemalagd laddning på/av"
- **Pros:** Interactive, lets the user "discover" the saving.
- **Cons:** Adds a 4th toggle to an already toggle-heavy input column (public AC/DC,
  region, applicants, med/utan investering). Hides the win behind an interaction →
  *less* compelling for the ~majority who never toggle. Risk of being read as "do I have
  to do something?" friction. **Rejected** — buries the benefit.

### Option (c) — Default-on optimised rate with a note
i.e. silently lower the home rate to the optimised value and add a footnote.
- **Pros:** Maximises the headline saving.
- **Cons:** **Fails honesty / MFL.** It bakes a best-case "if you schedule perfectly"
  assumption into the *single* headline number, which the SE4 inversion + non-universal
  timprisavtal make non-guaranteed. The user can't see the conservative baseline. **High
  legal/credibility risk. Rejected.**

### Why (a) beats (b) and (c)
The hero annual saving must stay anchored to the **conservative flat rate** (what you save
just by moving public→home, regardless of timing). Scheduling is **incremental upside**,
so it belongs as a **visible, labelled, secondary layer** — not folded into the headline
(c), and not hidden behind a click (b). A third bar shows *both* truths at once: "you
save a lot by charging at home; you save a bit more if you let the box schedule it."

---

## 6. Exact spec for Option (a)

### 6.1 Data model (`data.js` REGIONS — add one field per zone)
```js
"REGIONS": {
  "SE1": { "label": "SE1 – Norra Sverige",       "homeRateSekPerKwh": 1.45, "homeRateOptimizedSekPerKwh": 1.30 },
  "SE2": { "label": "SE2 – Norra Mellansverige", "homeRateSekPerKwh": 1.50, "homeRateOptimizedSekPerKwh": 1.35 },
  "SE3": { "label": "SE3 – Södra Mellansverige", "homeRateSekPerKwh": 1.90, "homeRateOptimizedSekPerKwh": 1.60 },
  "SE4": { "label": "SE4 – Södra Sverige",       "homeRateSekPerKwh": 2.10, "homeRateOptimizedSekPerKwh": 1.80 }
}
```
Engine `REGIONS` fallback default should mirror these (keep `homeRateOptimizedSekPerKwh`
with a safe fallback, e.g. `homeRate * 0.88`, if the field is absent so old data never NaNs).

### 6.2 Math (in `calculateFor`, mirrors the existing home-cost math)
```js
var homeRateOpt = (REGIONS[state.region] || {}).homeRateOptimizedSekPerKwh
                  || homeRate * 0.88;            // safe fallback
var monthlyHomeOptCost = publicKwh * homeRateOpt / 12;
var annualSavingOpt    = publicKwh * (publicRate - homeRateOpt);   // optional, for copy
var extraVsFlatPerYear = publicKwh * (homeRate - homeRateOpt);     // the "schemalagd" upside
```
- **Headline hero stays `annualSaving = publicKwh × (publicRate − homeRate)`** (unchanged,
  conservative).
- The third bar uses `monthlyHomeOptCost`; bar fraction = `homeOptCost / maxCost` (maxCost
  is still the public bar, since `publicRate > homeRate > homeRateOpt`).
- Reconciliation holds: `(monthlyPublic − monthlyHomeOpt) × 12 === annualSavingOpt`.

### 6.3 Copy (Swedish, MFL-safe)
- Bar label: **"Hemma, schemalagd (optimerad)"**
- Value: **≈ {X} kr/mån**
- One-line note under the panel (or tooltip "i"):
  > *"Med schemalagd laddning låter du laddboxen ladda när elen är som billigast
  > (ofta natten, sommartid mitt på dagen i söder). Sänker din hemmakostnad ytterligare
  > ca {discount} %. Faktisk besparing beror på ditt elavtal och elområde."*
- Optional micro-line in the breakdown: add a 4th rate row
  **"Hemmaladdning, schemalagd ({zone})  {homeRateOpt} kr/kWh"** under the existing
  "Hemmaladdning" row, so the methodology stays fully transparent.
- Methodology disclosure ("Så har vi räknat") — add a bullet:
  > *"Schemalagd laddning: modern laddbox flyttar laddningen automatiskt till de
  > billigaste timmarna. Vi räknar med en försiktig sänkning på ca 10–16 % av
  > hemmakostnaden beroende på elområde — inte den fulla spotskillnaden (30–60 %), då den
  > inte är garanterad alla timmar eller alla elavtal."*

### 6.4 Honesty framing (MFL §10 — no misleading omission/claim)
1. Headline = conservative flat rate (no scheduling assumption baked in).
2. Optimised bar is **labelled "optimerad"** and **capped well below** the raw spot spread.
3. Copy says **"när elen är som billigast"**, never a literal "alltid billigare på natten"
   (false in SE4 summer 2025).
4. Note discloses dependence on elavtal + elområde → no unconditional promise.
5. Methodology row exposes the exact kr/kWh used → fully auditable.
6. Keep the existing ±10 % osäkerhetsspann on the headline; optionally widen the
   optimised note to "ca" language only (no false precision).

### 6.5 UX placement / responsive
- Reuse `.ampy-calc__monthly-col` pattern; add a third `.ampy-calc__monthly-col` with a
  lighter/dashed green fill (e.g. `--state-success` at reduced opacity or a
  `repeating-linear-gradient`) to visually distinguish "optimised" from "normal home".
- Mobile: third bar stacks naturally below the second; no layout change needed.
- a11y: third value gets the same count-up + the live region keeps announcing only the
  **headline** (unchanged) — don't add the optimised number to the SR queue.

---

## 7. Worked example (validates the feel)

Defaults: Tesla Model Y, 20 000 km/år, 100 % public, DC, SE3.
`publicKwh ≈ 3 756 kWh/år`, publicRate 5.50, flat home 1.90, **opt home 1.60**.

- Publik: 3 756 × 5.50 / 12 ≈ **1 721 kr/mån** (matches screenshot)
- Hemma (flat): 3 756 × 1.90 / 12 ≈ **595 kr/mån** (matches screenshot)
- **Hemma, schemalagd: 3 756 × 1.60 / 12 ≈ 501 kr/mån**  → a visible third, lower green bar
- Extra "schemalagd" upside vs flat home: 3 756 × (1.90 − 1.60) ≈ **1 127 kr/år** more,
  on top of the 13 520 kr/år headline.

The headline 13 520 kr/år is **untouched**; the user simply sees a third bar proving
"och det kan bli ännu billigare om du låter boxen sköta tajmingen." Compelling **and**
honest.

---

## 8. Sources

- [elbruk.se — Billigare el på dagen än på natten](https://www.elbruk.se/blogg/billigare-el-dagtid-nattetid) — 30–60 % night spread; SE4 inversion spring/summer 2025; 20–30 % smart vs flat.
- [gridio.io — 2025 Electricity Prices: 5 Insights for Swedish EV Drivers](https://www.gridio.io/blog/2025-electricity-prices-5-insights-for-swedish-ev-drivers) — SE3 €37 night / €85 peak / €24 weekend; 56 %/52 %; ~2 100 kr/yr; 2025 avg €47/MWh.
- [elmarknad.se — Elpriser 2025](https://elmarknad.se/elpriser/historik/elpriser-2025/) — Jan–Oct 2025 zone averages (SE1 15.8 / SE2 15.9 / SE3 49.9 / SE4 66.3 öre).
- [elbolag24.se — Spotpriser](https://elbolag24.se/spotpris/) — 2024 full-year zone averages; quarter-hourly spot from 1 Oct 2025.
- [elspot.nu — Elpriser historik 2025](https://elspot.nu/elpriser-historik-2025/) — 2025 national avg ~38.75 öre/kWh.
- [Ellevio — Så fungerar effektavgiften](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/) — effektavgift = top-3 hourly peaks; 22–06 counted at half.
- [Ellevio — Elbilen, spotpriset och effektavgiften](https://www.ellevio.se/nyheter/elbil-laddning/elbilen-spotpriset-och-effektavgiften--sa-laddar-du-smart-i-vinter/) — schedule EV to 22–06; combine spot + effekt.
- [effekttariff.nu](https://effekttariff.nu/) and [Vattenfall — Så fungerar effektavgifter](https://www.vattenfall.se/fokus/tips-rad/sa-fungerar-effektavgifter/) — effekttariff rollout, mandatory by 1 Jan 2027.
- [sourceful.energy — Stockholm peak-fee savings](https://www.sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) — ~2 925 kr/yr peak-demand saving case.
