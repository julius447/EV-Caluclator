# R3 — Copy (Ampy Laddbox-kalkylator)

Conversion-copywriting pass over all on-screen Swedish microcopy. Reasoned from the live-tool screenshots (desktop + mobile) and the source (`index.html`, `engine.js`, `data.js`). Box descriptions are grounded in the live Ampy product pages (WebFetch). Where data and product page disagree, it is flagged under **Data flags** at the end.

Brand voice: trygg, konkret, nyttoledd, utan superlativ-spam. "Du"-tilltal. Inga utropstecken. Siffror och fakta gör jobbet.

---

## (1) TOOLTIPS

### "Andel offentlig laddning" (`index.html` line 106)

**Problem with current:** Two sentences that pull in opposite directions — first says "andelen som sker publikt idag", then "100 % betyder att all din publika laddning flyttas hem". That conflates *share charged publicly today* with *share you move home*, which is self-contradictory. The point of the control (per the brief, point 1) is simply: **how much of your charging happens publicly vs at home today.**

**NEW (one sentence):**
> Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.

(`data-tip` value, plain text — no markup.)

---

### "Elprisområde" (`index.html` line 139)

**Problem with current:** Far too long for a tooltip — three clauses, two exact öre-figures, and a causal aside. The user only needs to know what the four buttons mean and why it matters.

**NEW (drastically shortened):**
> Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.

---

### "Typ av offentlig laddning" (`index.html` line 122)

**Current is fine in intent but cluttered** (the "abonnemang ~3,40–4,50" aside isn't used by the engine and confuses). Tighten to the two prices the calc actually applies.

**NEW:**
> AC = långsam laddning vid parkering och köpcentrum (ca 4,50 kr/kWh). DC = snabbladdning längs vägen (ca 5,50 kr/kWh).

---

### "Antal sökande" (`index.html` line 150) — current text is slop

**Problem:** "relevant om man köper flera boxar" is vague and, for a single-home lead magnet, mostly irrelevant — one laddbox is always far under the 50 000 kr/år/sökande cap, so the control changes the result for essentially nobody. It adds a field, a decision, and a tooltip for ~zero payoff.

**RECOMMENDATION: remove the control.** It does not move the number for any realistic single-box home install, and every extra input lowers completion. The Grön Teknik-cap logic can stay in the engine (it already caps correctly); just default `numTaxApplicants` to 1 and hide the stepper. This is the cleaner call and I'd push for it.

**IF the owner insists on keeping it**, use this non-slop tooltip:
> Antal personer i hushållet som delar på Grön Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer taket om ni installerar flera.

---

## (2) "SÅ HAR VI RÄKNAT" (rewritten word-by-word)

Rendered from `populateMethodology()` in `engine.js` (lines 868–884). Each item is `{ h, c, p }` → heading / code-line / prose. Kept accurate to the engine; reconciled the footnote with the in-result price line per point 6.

### 1. Energiåtgång
- **h:** `1. Så mycket energi din bil drar`
- **c:** `körsträcka ÷ 10 × förbrukning per 10 km ÷ 90 % laddningseffektivitet`
- **p:** `Vi utgår från bilens WLTP-förbrukning och din körsträcka. Cirka 10 % försvinner som förlust i laddkabel och box, så vi räknar med det.`

### 2. Offentlig laddkostnad
- **h:** `2. Vad publik laddning kostar dig`
- **c:** `offentlig andel × energi × publik taxa (AC 4,50 kr/kWh · DC 5,50 kr/kWh)`
- **p:** `Typiska svenska priser 2025 för publik AC- respektive DC-laddning. Du väljer själv vilken typ du oftast använder.`

### 3. Hemmaladdningskostnad
- **h:** `3. Vad samma laddning kostar hemma`
- **c:** `offentlig andel × energi × hemtaxa (1,45–2,10 kr/kWh, SE1–SE4)`
- **p:** `Din totala hemma-kostnad per kWh — spotpris, nätavgift och skatt — i snitt för ditt elprisområde.`

### 4. Grön Teknik-avdraget
- **h:** `4. Grön Teknik-avdraget`
- **c:** `48,5 % av priset, max 50 000 kr/sökande/år (upp till 2 sökande)`
- **p:** `Avdraget är 50 % av arbete och material. Med Skatteverkets schablon på 97 % blir det cirka 48,5 % av totalpriset, vilket vi drar av direkt. Kräver att du äger bostaden, har skatt att dra mot, att installatören har F-skatt och att laddpunkten har uttag enligt EN 62196-2/-3.`

### 5. Osäkerhetsspann
- **h:** `5. Varför vi visar ett spann`
- **c:** `± 10 % på den årliga besparingen`
- **p:** `Elpriser och körvanor svänger. Spannet visar en realistisk lägsta- och högstanivå — din verkliga besparing landar troligen däremellan.`

### Disclaimer (`index.html` lines 385–389) — rewritten
> **Så här läser du kalkylen.** Siffrorna bygger på publik branschdata för 2025–2026. Ditt verkliga utfall beror på hur du kör, hur du laddar och hur elpriset utvecklas. Kalkylen är en uppskattning — inte ett erbjudande och inte bindande för Ampy. Vill du ha ett exakt pris, begär en offert.

### Footnote (`index.html` line 390) — rewritten + reconciled with point 6
The in-result price line should read **"Pris inkl. installation, Grön Teknik & moms"** (point 6). The footnote must match that wording and explain the asterisk without re-introducing the "48,5 % av priset" framing already covered in methodology item 4.

**In-result price-line label** (currently rendered in `engine.js` line 804 as
`"Pris inkl. installation & moms " + grossPrice + " kr − Grön Teknik " + gronTeknik + " kr"`):
> Pris inkl. installation, Grön Teknik & moms

(i.e. the `Att betala`-sub becomes: `Pris inkl. installation, Grön Teknik & moms` — the gross-minus-deduction math can stay as the value detail if desired, but the *label* matches point 6.)

**NEW footnote:**
> \* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.

This reconciles cleanly: the footnote and the in-result line both say the price is *inkl. installation, Grön Teknik & moms*, and the footnote clarifies that the deduction is already applied (so the user isn't left wondering whether they still need to claim it).

---

## (3) LADDBOX DESCRIPTIONS — all 16 boxes

Format per box: **description** (product-focused, 2–5 words, NOT just kW) + **tag** (badge) where warranted. These map to `data.js` → each charger's `description` and `badge` fields (and the mirror in `excel/build_xlsx.py`).

Owner-mandated tags applied exactly. Amina S "Rekommenderas" removed. Tasteful tags kept for Zaptec Pro (offert) and Garo Entity Pro (företag/BRF). All other boxes get a clean product description with no badge unless mandated, to keep the badge signal meaningful (over-badging kills trust).

| # | Box | `description` (NEW) | `badge` (NEW) | Note |
|---|-----|--------------------|--------------|------|
| 1 | Zaptec Go | `Kompakt favorit · inkl. installation` | `Bästsäljare` | mandated |
| 2 | Zaptec Go 2 | `Inbyggd display · inkl. installation` | `Rekommenderas` | mandated |
| 3 | Easee Charge Up | `Smart & nätt · inkl. installation` | `Bästsäljare` | mandated |
| 4 | NexBlue Edge 2 | `Prisbelönt design · inkl. installation` | `Prisvärd` | mandated |
| 5 | go-e Gemini Flex 2.0 | `Fast eller flyttbar · inkl. installation` | `null` | portable plug-in |
| 6 | Tesla Wall Connector | `Fast kabel 7,3 m · inkl. installation` | `null` | passar alla elbilar |
| 7 | Charge Amps Luna | `Skandinavisk design · inkl. installation` | `null` | premium aluminium |
| 8 | Charge Amps Halo | `Fast kabel & statusljus · inkl. installation` | `null` | IP66, extrauttag |
| 9 | Charge Amps Dawn | `Svensktillverkad premium · inkl. installation` | `null` | MID-mätare, 4G |
| 10 | Charge Amps Aura | `Två bilar samtidigt · inkl. installation` | `Dubbel laddning` | mandated |
| 11 | Defa Power | `Display & −40 °C · inkl. installation` | `null` | arktisk |
| 12 | Amina S | `Marknadens minsta · inkl. installation` | `null` (remove "Rekommenderas") | mandated removal |
| 13 | Garo Entity Home | `Driftsäker villabox · inkl. installation` | `null` | |
| 14 | Wallbox Pulsar Max | `Prisbelönt & kompakt · inkl. installation` | `null` | iF Design, fast kabel |
| 15 | Zaptec Pro | `Skalbar för flera platser · offert` | `Offert` | tasteful, kept |
| 16 | Garo Entity Pro | `Byggd för många bilar` | `Företag/BRF` | tasteful, kept |

**Box-by-box rationale (concise):**

1. **Zaptec Go** — `Kompakt favorit` says why people pick it (small, proven) without just repeating "22 kW". Tag `Bästsäljare` (mandated).
2. **Zaptec Go 2** — the headline upgrade over Go is the built-in display + MID-meter; `Inbyggd display` is the one feature a shopper sees and understands. Tag `Rekommenderas` (mandated).
3. **Easee Charge Up** — `Smart & nätt` captures the compact, app-first positioning. Tag `Bästsäljare` (mandated).
4. **NexBlue Edge 2** — Red Dot-winning industrial design is the real hook; `Prisbelönt design` earns the `Prisvärd` tag a friend (mandated) without sounding cheap.
5. **go-e Gemini Flex 2.0** — its unique selling point is dual use: fixed at home OR portable on the road. `Fast eller flyttbar` is the differentiator; no tag needed.
6. **Tesla Wall Connector** — built-in 7,3 m cable is the practical draw and it works with all EVs, so `Fast kabel 7,3 m` (not "Tesla-bara"). No tag.
7. **Charge Amps Luna** — premium recycled-aluminium, ex-Koenigsegg design; `Skandinavisk design` is the honest pitch. No tag.
8. **Charge Amps Halo** — fixed cable + LED status ring + extra outlet; `Fast kabel & statusljus` are the two things you notice on the wall. No tag.
9. **Charge Amps Dawn** — Swedish-made, MID-meter, premium tier; `Svensktillverkad premium`. No tag.
10. **Charge Amps Aura** — dual outlets, two cars at once; `Två bilar samtidigt` is plain-Swedish for the mandated `Dubbel laddning` tag.
11. **Defa Power** — built-in display + rated to −40 °C; `Display & −40 °C` is the memorable, true differentiator. No tag.
12. **Amina S** — genuinely the smallest box on the market; `Marknadens minsta` is its actual claim. **Badge removed** (mandated) — it had a `Rekommenderas` that now belongs to Zaptec Go 2.
13. **Garo Entity Home** — reliable mainstream villa box; `Driftsäker villabox`. No tag.
14. **Wallbox Pulsar Max** — iF Design Award, very compact, fixed cable; `Prisbelönt & kompakt`. No tag.
15. **Zaptec Pro** — BRF/commercial, scales across sites; `Skalbar för flera platser`. Tag `Offert` kept (tasteful, signals the different flow).
16. **Garo Entity Pro** — commercial multi-vehicle box; `Byggd för många bilar`. Tag `Företag/BRF` kept.

> **Tag discipline note:** only 7 of 16 boxes carry a badge (5 mandated + Zaptec Pro + Garo Entity Pro). Keeping the other 9 badge-free is deliberate — if every box is "rekommenderad" the badges stop meaning anything and the bestsellers lose their edge.

---

## (4) OTHER ON-SCREEN MICROCOPY TO SHARPEN

### Hero (`index.html` lines 24–25)
- Eyebrow `Laddbox-kalkylator` — keep.
- H1 `Hur mycket sparar du på att ladda hemma?` — strong, keep. (It's a question that promises a personal number; on-brand.)

### Hero sub / annual-saving framing (`engine.js`)
- `om du flyttar all din publika laddning hem` — keep; honest and clear.
- Empty state `Välj en elbil och en laddbox för att se din besparing.` — keep.
- `Höj andelen offentlig laddning för att se din besparing.` (pct 0) — fine; could be warmer: **`Dra upp andelen publik laddning så ser du vad du kan spara.`**

### Trio tiles (`index.html` / `engine.js`)
- `Sparar på 10 år` / sub `laddboxen betald, Grön Teknik inräknad` — clear, keep.
- `Att betala*` — keep. (Asterisk now resolves to the reconciled footnote above.)
- Offert sub `Pris tas fram i offert för din anläggning.` — keep.

### Monthly panel (`index.html` lines 239–256)
- `Din månadskostnad – publikt vs hemma` — keep.
- `Publik laddning idag` / `Hemma efter installation` / `Du sparar` — all crisp, keep.

### ROI toggle (`index.html` lines 183–190)
- Label `Räkna med laddboxens kostnad` + tooltip — clear, keep.
- Pills `Med investering` / `Utan investering` — fine. (Minor: `Med boxens pris` / `Utan boxens pris` would be plainer-Swedish, but "investering" reads as deliberate framing; leave it.)

### Primary CTA (`index.html` line 279)
- `Få en exakt offert →` — **keep.** It's the right verb (low-commitment, value-forward) and pairs perfectly with the micro-trust row below it. Note the brief mentions "Få en laddbox offert" — that phrasing is grammatically off in Swedish ("en laddboxoffert" or "en offert på laddbox"); the live tool already says **`Få en exakt offert`**, which is better. Keep the live version.

### Micro-trust row (`index.html` lines 289–291)
- `Svar inom 24 h` · `Inget köpkrav` · `Dina uppgifter skyddas` — excellent, keep all three.

### Lead form
- Intro `Vår laddbox-expert hör av sig med ett offertförslag, oftast inom en arbetsdag.` — good; tiny tighten: **`En av våra laddbox-experter hör av sig med ett offertförslag, oftast inom en arbetsdag.`** (avoids the slightly impersonal "vår laddbox-expert" singular).
- Submit `Skicka offertförfrågan` — keep.
- Success `Tack! En expert återkommer inom 24 timmar med en exakt offert. Du får kalkylen mailad till dig.` — keep; consistent with the 24 h promise.
- Error fallback with phone number — keep.

### Product link (`index.html` lines 365–367)
- `Läs mer om <Box> →` — **keep.** Clean, scannable, and the dynamic box name makes it feel tailored. (Brief lists "Läs mer om X"; live tool already does exactly this.)

---

## DATA FLAGS (not copy, but blocking for accuracy)

1. **Charge Amps Aura mismatch.** `data.js` line 198 says `"11 kW · stativ"`, but the live product page states **wall-mounted, dual outlets up to 22 kW each**. My description `Två bilar samtidigt` and tag `Dubbel laddning` follow the *product page* (and the owner's mandated tag), which contradicts the "stativ" + "11 kW" in data. **Someone must confirm the real spec** before go-live and fix `data.js`/`build_xlsx.py` accordingly. If it truly is the 11 kW stativ variant, description should become `Stativ för två bilar · inkl. installation`.

2. **"inkl. installation" suffix.** I've appended `· inkl. installation` to the priced boxes (matching the current data pattern, e.g. Zaptec Go `"22 kW · inkl. installation"`). The selector shows this `description` as the sub-line, so dropping the kW and keeping `inkl. installation` is intentional — kW is rarely the deciding factor for a home buyer and most boxes are 22 kW anyway. If product/legal wants kW retained, append it: e.g. `Kompakt favorit · 22 kW · inkl. installation` (longer, but data supports it).

3. **Antal sökande control** — see section 1. Recommendation is to remove it; if kept, ship the rewritten tooltip.

---

## KEY COPY — READY TO PASTE (the load-bearing strings)

**Tooltips:**
- Andel offentlig laddning: `Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.`
- Elprisområde: `Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.`
- Typ av offentlig laddning: `AC = långsam laddning vid parkering och köpcentrum (ca 4,50 kr/kWh). DC = snabbladdning längs vägen (ca 5,50 kr/kWh).`
- Antal sökande (if kept): `Antal personer i hushållet som delar på Grön Teknik-avdraget. Varje person har ett eget tak på 50 000 kr/år — räcker gott för en laddbox, men höjer taket om ni installerar flera.`

**Footnote (reconciled):** `* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.`

**In-result price label:** `Pris inkl. installation, Grön Teknik & moms`
