# Grön teknik (skattereduktion) — VERIFIED against primary sources

**Scope:** Rules for *installation av laddningspunkt till elfordon* (EV charging point / laddbox)
under the **skattereduktion för grön teknik**, for **2025 and 2026**.
**Verified:** 2026-06-09 against Skatteverket primary pages (with corroborating secondary sources).
**Replaces:** DATA-DOSSIER.md §3.

> TL;DR for the calculator config:
> `gron_teknik_pct = 0.485` ✅ **CONFIRMED** (50% × 97% schablon on a fixed-price/turnkey job)
> `gron_teknik_cap_per_applicant_sek = 50000` ✅ **CONFIRMED** (per person, per year, shared across all grön-teknik categories)
> `max_applicants = 2` ✅ **CONFIRMED in effect** (each co-owner is an independent taxpayer with their own 50 000 kr cap → household up to 100 000 kr)
> **No 2026 change for laddningspunkt** — the 50% rate is unchanged. (The 2025 cut from 20%→15% applies to **solceller only**.)

---

## 1. The rate and the exact schablon mechanism — `gron_teknik_pct`

### Statutory rate
Skatteverket: *"Installation av laddningspunkt till elfordon. Skattereduktion ges med **50 procent** av kostnaden för arbete och material."*
The same 50% applies to **system för lagring av egenproducerad elenergi** (batterilagring).
For **solceller** the rate is **15%** (lowered from 20% on 1 July 2025 — see §5).

So there are two distinct grön-teknik rates:
- **Laddningspunkt + batterilagring → 50%** of labour + material
- **Solceller → 15%** of labour + material

### Why the calculator uses 48.5% (the schablon)
The 50% is applied to the **arbets- och materialkostnad**, not to the full turnkey invoice (which can also include profit margin, project management, travel, etc.). For a **fixed-price job (totalentreprenad)** — which is how a laddbox is almost always sold to a consumer — Skatteverket lets the firm use a **schablon**:

> *"Vid installation av grön teknik till fast pris (totalentreprenad) kan kostnaderna för arbete och material beräknas till **97 procent** av totalpriset för installationen."*

That yields the effective rate on the **turnkey price**:

| Category | Statutory rate | Schablon | Effective rate on turnkey price |
|---|---|---|---|
| **Laddningspunkt / batterilagring** | 50% | × 97% | **0.50 × 0.97 = 0.485 → 48.5%** |
| Solceller (from 2025-07-01) | 15% | × 97% | 0.15 × 0.97 = 14.55% |

✅ **CONFIRMED:** `gron_teknik_pct = 0.485` is correct **for a fixed-price laddbox installation**.
Confidence: **HIGH** (Skatteverket states both the 50% rate and the 97% schablon explicitly).

> Methodology note for the calculator copy: 48.5% is **not** a statutory percentage in its own right — it is the *consumer-facing turnkey-price* rate derived from `50% × 97% schablon`. If a job is **not** priced as a fixed-price totalentreprenad (i.e. labour/material are itemised separately), the reduction is 50% of the *actual* labour+material lines, which can differ from 48.5% of the total. For a normal "allt-i-ett" laddbox price, 48.5% is the right number to show.

---

## 2. The annual cap — `gron_teknik_cap_per_applicant_sek`

Skatteverket: *"Skattereduktion för grön teknik är sammanlagt **högst 50 000 kronor per person och år**."*

- It is **per person, per calendar year.**
- It is **shared (one common ceiling) across all three grön-teknik categories** (solceller + batterilagring + laddningspunkt) — the word *"sammanlagt"* (in total) makes this explicit.
- It is a **separate** ceiling from ROT/RUT. Grön teknik has its own 50 000 kr cap and does **not** consume, and is not consumed by, the ROT/RUT ceiling. (Grön teknik is a different skattereduktion with its own underlag.)

✅ **CONFIRMED:** `gron_teknik_cap_per_applicant_sek = 50000`. Shared across grön-teknik categories; separate from ROT/RUT.
Confidence: **HIGH** (Skatteverket primary text); the "separate from ROT/RUT" point is **HIGH** (different statutory reduction).

---

## 3. Multiple applicants — `max_applicants`

The 50 000 kr cap is **per person**. Each individual who (a) co-owns the bostad, (b) is part of the household, (c) is ≥18 at year-end, and (d) has enough tax to absorb the reduction, has their **own** 50 000 kr ceiling.

To use two ceilings on one installation, the **begäran/fakturan must be split** between the two persons (the installing firm files a *begäran om utbetalning* for each buyer). Done this way, **two co-owners → up to 100 000 kr** household skattereduktion on a single laddbox job.

- Skatteverket's consumer page frames it strictly as *"högst 50 000 kr per person och år"* and describes **omfördelning** if one person's tax is insufficient.
- The doubling to 100 000 kr for two co-owners is the standard, widely-published practical application (each co-owner is simply a separate taxpayer claiming their own per-person cap).

✅ **CONFIRMED (in effect):** `max_applicants = 2` → household cap up to **100 000 kr/år**, *provided the invoice is split between the two owners and each has sufficient tax.*
Confidence: **HIGH** that two owners each get their own 50 000 kr cap (direct consequence of "per person"); **MEDIUM** only in that Skatteverket's page states the per-person rule rather than printing the "100 000 kr household" figure itself — the 100 000 figure comes from corroborating installer/industry sources applying the per-person rule.

---

## 4. Eligibility conditions

| Condition | Verdict | Detail (Skatteverket) |
|---|---|---|
| **Must be installed by an F-skatt firm** | ✅ Required | *"Företaget måste vara godkänt för F-skatt."* (Non-Swedish firms need equivalent tax documentation.) The reduction is applied **on the invoice** (preliminär skattereduktion); the firm reclaims it from Skatteverket. |
| **Buyer must have sufficient tax** | ✅ Required | *"Du behöver ha betalat tillräckligt med skatt under året för att kunna nyttja hela skattereduktionen."* Final reduction is reconciled in the buyer's deklaration. |
| **Must own the bostad** | ✅ Required | Installation must concern *"ett småhus eller en ägarlägenhet (m.fl.) som ägs av den som begär skattereduktion."* Tenant-owned/rental nuances aside, the claimant must be an owner. Must be ≥18 at year-end and alive when work is done. |
| **Charging point prepared for el-metering** | ✅ Required | *"Laddningspunkten ska vara förberedd för elmätning och debitering av elkostnad."* |
| **Connector standard (the real technical bar)** | ✅ Required | Must have at least the uttag/anslutningsdon in **EN 62196-2 (Type 2)** or **EN 62196-3 (Combo)**. This — together with the "förberedd för elmätning" point — is the actual statutory technical requirement. |
| **Load balancing (lastbalansering)** | ⚠️ Not a statutory requirement | "Lastbalansering" is **not** a condition for eligibility. A **lastbalanserare** is merely listed as an *example of approved material* that can be included in the underlag. Do **not** advertise it as a requirement. |
| **Solar installation required?** | ❌ NOT required | A laddningspunkt qualifies **on its own**. No solar / battery / egenproducerad-el prerequisite. (Batterilagring has its own "egenproducerad el" condition, but that does not apply to the charging point.) |

Confidence: **HIGH** for F-skatt, sufficient-tax, ownership, "förberedd för elmätning", and EN 62196 connector standard (all on Skatteverket pages). **HIGH** that solar is not required. **HIGH** that lastbalansering is not a statutory condition (it appears only as approvable material).

---

## 5. 2025 → 2026 changes

- **Laddningspunkt: NO CHANGE.** The 50% rate (48.5% turnkey via schablon) and the 50 000 kr/person cap are **unchanged for 2025 and 2026**. The government's reductions explicitly left laddningspunkt and batterilagring untouched.
- **Solceller only:** rate cut **20% → 15%** effective **1 July 2025** (14.55% turnkey via schablon). This does **not** affect the laddbox figure.
- **Unrelated:** the separate *skattereduktion för mikroproduktion av förnybar el* (60 öre/kWh) is being **abolished from 1 Jan 2026** — this is a different reduction and does not touch grön teknik for laddboxar.

> ⚠️ Dossier hygiene note: the existing DATA-DOSSIER.md §3 says *"the general Grön Teknik rate for solceller is 20%"*. As of **2025-07-01 this is stale — solceller is 15%** (14.55% turnkey). It does not affect the laddbox number but the surrounding copy should be corrected.

Confidence: **HIGH** (laddningspunkt unchanged; solar 20→15% on 2025-07-01).

---

## 6. Corrected Swedish eligibility wording for the calculator methodology

> **Grön teknik-avdrag för laddbox**
> Du får **48,5 % i skattereduktion** på priset för installation av laddningspunkt till elfordon
> (lagstadgad sats är **50 % av arbets- och materialkostnaden**; vid fast pris/totalentreprenad
> får arbete och material schablonmässigt antas vara **97 %** av totalpriset, vilket ger
> 0,50 × 0,97 = **48,5 %** av totalpriset). Avdraget dras **direkt på fakturan** av installatören.
> Skattereduktionen är **högst 50 000 kr per person och år** och gäller **gemensamt** för all
> grön teknik (solceller, batterilagring och laddpunkt). **Äger ni bostaden tillsammans kan ni
> dela avdraget** – två ägare kan få upp till **100 000 kr/år** totalt om fakturan delas mellan er.
> Krav: installationen ska utföras av ett företag med **godkänd F-skatt**, du måste **äga bostaden**
> och ha **betalat tillräckligt med skatt** under året. Laddningspunkten ska vara **förberedd för
> elmätning och debitering** och ha uttag/anslutningsdon enligt **EN 62196-2 (Typ 2)** eller
> **EN 62196-3 (Combo)**. *Ingen solcellsanläggning krävs.*

Changes vs. the dossier's suggested wording:
- **Kept:** 48,5% on arbets-/materialkostnad, dras på fakturan, tak 50 000 kr/person/år, delas av två ägare (→100 000 kr), kräver tillräcklig skatt, förberedd för elmätning. ✅
- **Corrected:** the dossier text said the laddpunkt "måste vara förberedd för elmätare **och lastbalansering**." **Lastbalansering is NOT a requirement** — the real second technical bar is the **EN 62196-2/-3 connector standard**. Replaced "lastbalansering" with the correct connector-standard wording; lastbalanserare is only optional approvable material.
- **Added:** explicit "F-skatt" and "äga bostaden" conditions, the "gemensamt tak för all grön teknik" clarification, and "ingen solcellsanläggning krävs."

---

## Sources (accessed 2026-06-09)

1. Skatteverket — *Så fungerar skattereduktionen för grön teknik* (rates, 50 000 kr/person cap, sufficient-tax, owner ≥18, on-invoice mechanism):
   https://www.skatteverket.se/privat/fastigheterochbostad/gronteknik/safungerarskattereduktionenforgronteknik.4.676f4884175c97df4192870.html
2. Skatteverket — *Grön teknik (företag)* (50% laddningspunkt rate; F-skatt requirement; 50 000 kr cap):
   https://www.skatteverket.se/foretag/skatterochavdrag/gronteknik.4.676f4884175c97df4192a42.html
3. Skatteverket — *Godkända arbeten – grön teknik* (technical requirements: "förberedd för elmätning och debitering", EN 62196-2/-3 connector standard; owner/household; lastbalanserare as approved material):
   https://www.skatteverket.se/privat/fastigheterochbostad/gronteknik/godkandaarbetengronteknik.html
4. Skatteverket — *Grön teknik, installation (Rättslig vägledning)* (50% rate; 97% schablon → 48,5%/14,55%): edition reference
   https://www4.skatteverket.se/rattsligvagledning/edition/2025.3/420580.html
5. Riksdagen — *Förändrade skattesubventioner för solceller* (SkU17; 20%→15% solceller from 2025-07-01; laddpunkt/batteri unchanged):
   https://data.riksdagen.se/dokument/HC01SkU17.html
6. Vattenfall — *Minskad skattereduktion* (corroborates solar 20→15% 2025-07-01; laddbox unchanged):
   https://www.vattenfall.se/fokus/solceller/minskad-skattereduktion/
7. Bilbolaget — *Grön teknik – avdrag laddboxinstallation* (corroborates two-owner → 100 000 kr household application of the per-person cap):
   https://bilbolaget.nu/artiklar/gron-teknik-avdrag-laddboxinstallation/

(1–4 are Skatteverket primary; 5 is Riksdagen primary; 6–7 corroborating secondary.)
