# R3 — Math verification: EV charging savings engine

**Scope:** `prototype/engine.js` (`calculateFor` + `renderSavingsBreakdown` + `renderMonthlyComparison`) and `prototype/data.js`.
**Date:** 2026-06-11. **Method:** read the source, re-derived the full default chain and the AC variant numerically with the engine's own formulas and rounding, cross-checked reconciliation to machine precision.

---

## Owner's point 7 — definitive resolution

> The breakdown card shows public DC **5,50** / AC **4,50** and home **1,90**, but the explainer line below reads
> "**3 756 kWh × 3,60 kr/kWh = 13 520**" (DC) and "**× 2,60 = 9 764**" (AC). Is 3,60 a contradictory price?

**VERDICT: PASS — no contradiction, no error, no double-count, no hidden lower span.**

The explainer's **3,60** and **2,60** are NOT prices. They are the **per-kWh saving** — the gap between the public rate and the home rate — which the card already labels on its own row as **"Du sparar per kWh"**. In `calculateFor`:

```
rateGap      = publicRate − homeRate          (engine.js ~L228)
annualSaving = publicKwh  × rateGap           (engine.js ~L232)
```

And `renderSavingsBreakdown` prints the explainer with `r.rateGap`, not a rate (engine.js ~L734–738):

```
fmtKm(round(publicKwh)) + ' kWh ... × ' + fmtRate(r.rateGap) + ' kr/kWh = ' + fmtKr(r.annualSaving)
```

Step-by-step confirmation of the two values:

| Quantity        | DC                     | AC                     |
|-----------------|------------------------|------------------------|
| publicRate      | 5,50                   | 4,50                   |
| homeRate (SE3)  | 1,90                   | 1,90                   |
| **rateGap**     | 5,50 − 1,90 = **3,60** | 4,50 − 1,90 = **2,60** |

So **3,60 = 5,50 − 1,90** and **2,60 = 4,50 − 1,90** exactly. The explainer row is internally consistent with the three rows above it (public, home, "du sparar per kWh"); the "3,60" literally *is* the "Du sparar per kWh = 3,60" row restated inside the multiplication. It only *looks* like a contradictory price because it sits next to "5,50/4,50" with no in-line reminder that it is a delta.

---

## Item-by-item audit

### 1. Energy chain (Tesla Model Y, 20 000 km, 100 % public, SE3) — **PASS**
```
annualEnergyNeeded   = (20000 / 10) × 1.69            = 3380   kWh
annualEnergyFromGrid = 3380 / 0.90                    = 3755.5… kWh
publicKwh            = 3755.5… × 1.00                  = 3755.5… kWh  → displayed "3 756"
```
The 10 % charging-loss divide (`/0.90`) is applied once, in the energy step only — it does not reappear in the rate math, so no double count.

### 2. DC default — **PASS** (matches owner's quoted figures exactly)
```
rateGap      = 5,50 − 1,90 = 3,60
annualSaving = 3755.5… × 3,60 = 13 520,00  → "13 520 kr/år"   ✓ matches owner
explainer    : "3 756 kWh × 3,60 kr/kWh = 13 520 kr/år"        ✓ reproduced verbatim
spann (±10 %): 12 168 – 14 872 kr/år
10-år ren besparing: 135 200 kr
```
Note: the explainer's left factor is the *rounded* display value (3 756) while the engine multiplies the *unrounded* 3755.5… kWh. 3 756 × 3,60 = 13 521,6, but the printed result 13 520 comes from the unrounded product. This ≈1,6 kr cosmetic gap is harmless and below any meaningful precision, but it is a second reason the line invites scrutiny.

### 3. AC variant — **PASS**
```
rateGap      = 4,50 − 1,90 = 2,60
annualSaving = 3755.5… × 2,60 = 9 764,44…  → "9 764 kr/år"     ✓ matches owner
explainer    : "3 756 kWh × 2,60 kr/kWh = 9 764 kr/år"          ✓ reproduced verbatim
spann (±10 %): 8 788 – 10 741 kr/år
10-år ren besparing: 97 644 kr
```

### 4. Annual ↔ monthly reconciliation — **PASS (exact, machine precision)**
```
monthlyPublicCost = publicKwh × publicRate / 12
monthlyHomeCost   = publicKwh × homeRate   / 12
monthlySaving     = monthlyPublicCost − monthlyHomeCost = publicKwh × (publicRate − homeRate) / 12
⇒ monthlySaving × 12 ≡ publicKwh × rateGap ≡ annualSaving
```
Verified numerically: DC monthlySaving × 12 = 13 520,0000 = annualSaving; AC = 9 764,4444 = annualSaving. The monthly comparison (DC: publik 1 721 / hemma 595 / sparar 1 127 kr/mån; AC: 1 408 / 595 / 814) is the *same* `annualSaving` re-expressed — there is **no hidden lower span** and **no second, smaller saving** anywhere. The only other "lower" numbers in the system are the deliberate −10 % uncertainty band (`savingLow`) and the net-of-investment 10-year series, both clearly labelled and distinct.

### 5. Net / gross / Grön Teknik (Zaptec Go) — **PASS**
```
gross      = 8 980 kr
net        = 4 490 kr   ("Att betala")
gronTeknik = gross − net = 4 490 kr        (engine.js ~L252: grossPrice − netCost)
```
Grön Teknik is taken as the simple gross−net difference; the engine does **not** re-apply the 48,5 % schablon (the catalogue prices already bake it in — confirmed by the comment block at engine.js ~L241–247 and data.js header). The net-pay sub-line "Pris inkl. installation & moms 8 980 kr − Grön Teknik 4 490 kr" reconciles to net 4 490. (Coincidence note: for Zaptec Go the deduction equals exactly 50 % of gross because net is exactly half of gross in the catalogue; this is a data artifact, not a formula.)

### 6. Payback / 10-year net — **PASS**
```
paybackYears        = net / annualSaving = 4 490 / 13 520 ≈ 0,33 år (DC)
cumulativeNet10 (DC) = 13 520 × 10 − 4 490 = 130 710 kr
```
Both use the box price exactly once and are gated to null for offert-only boxes (Zaptec Pro), so no NaN leaks.

---

## CONCERN (presentation only, not a math error)

**The explainer row is confusing.** Sitting directly beneath "5,50 / 1,90", the line "3 756 kWh × **3,60** kr/kWh = 13 520" reads as a third, contradictory price even though 3,60 is the already-shown per-kWh *saving*. The card therefore states the same delta twice — once correctly labelled ("Du sparar per kWh = 3,60") and once unlabelled inside a multiplication that looks like a price. There is also the minor 3 756×3,60 = 13 521,6 vs printed 13 520 rounding mismatch (item 2).

### Recommendation (exact)
In `renderSavingsBreakdown` (engine.js ~L734–738), **remove the trailing explainer `<p>` row** — the
`fmtKm(...) + ' kWh offentlig laddning per år × ' + fmtRate(r.rateGap) + ' kr/kWh = ' + fmtKr(r.annualSaving) + ' kr/år'`
paragraph. **Keep all three rows inside the card**: the public rate row (5,50 / 4,50), the home rate row (1,90), and the bold **"Du sparar per kWh"** row (3,60 / 2,60). Those three rows already tell the whole story unambiguously, and the headline annual saving (13 520 / 9 764) plus the monthly comparison already carry the "× kWh = kr/år" result without restating the delta as a pseudo-price. No formula change is needed — the engine math is correct as-is; this is purely deleting one redundant, confusable display line.

---

## Summary table

| # | Item                                   | Verdict |
|---|----------------------------------------|---------|
| 7 | 3,60 / 2,60 = saving, not a price      | **PASS** |
| 1 | Energy chain (3 756 kWh)               | **PASS** |
| 2 | DC default (13 520)                    | **PASS** |
| 3 | AC variant (9 764)                     | **PASS** |
| 4 | Annual ↔ monthly reconciliation        | **PASS** |
| 5 | Net/gross/Grön Teknik (gross−net)      | **PASS** |
| 6 | Payback / 10-year net                  | **PASS** |
|   | Explainer row clarity                  | **CONCERN → remove the row, keep the 3 card rows** |
