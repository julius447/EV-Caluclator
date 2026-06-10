# Ampy laddbox-katalog — källaudit

Datum: 2026-06-10
Källa: fetchade produktsidor på ampy.se/laddboxar/ (14 konsumentprodukter + 2 företag/BRF-offert)
Syfte: kanonisk katalog för EV/laddbox-kalkylatorn. `priceSek` = INSTALLERAT nyckelfärdigt pris inkl. moms (kundens nettopris efter 50 % Grön Teknik-avdrag), heltal; `null` om endast offert.

## Prisbas-princip (gäller hela katalogen)
Alla konsumentpriser på ampy.se visas som kundens **nettopris efter 50 % Grön Teknik-avdrag**, **inklusive standardinstallation** av certifierad elektriker. Det visade priset är alltså redan det nyckelfärdiga utpriset till kund — det är detta vi använder som `priceSek` rakt av. "Ordinarie pris" = priset FÖRE avdraget (ca dubbla det visade). Moms anges sällan explicit i prisblocket, men Grön Teknik beräknas på momsinklusivt belopp, så de visade siffrorna är konsekventa med inkl. moms.

## Tabell — varje box

| Name | Price as shown | price_basis (per sida) | Our priceSek | Why | Power (kW) | Image | URL | Category | NEEDS OWNER CONFIRMATION |
|------|----------------|------------------------|--------------|-----|------------|-------|-----|----------|--------------------------|
| Zaptec Go laddbox | Från 4 490 kr (ord. 8 980 kr) | Inkl. installation, efter 50 % Grön Teknik, inkl. moms | 4490 | Visat utpris efter avdrag = nyckelfärdigt | 11/22 | Zaptec-go-produktbild.webp | https://ampy.se/laddboxar/zaptec-go/ | consumer | JA — sidan listar flera "Fr."-priser (5 890/4 390/4 190/4 990); bekräfta att 4 490 kr är rätt rubrikpris för just Zaptec Go |
| Zaptec Go 2 laddbox | 5 890 :- (ord. 11 780 :-) | Inkl. installation + material, efter 50 % Grön Teknik | 5890 | Visat nettopris efter avdrag | 11/22 | Zaptec-go-2-produktbild.webp | https://ampy.se/laddboxar/zaptec-go-2/ | consumer | Nej |
| Easee Charge Up | 4 390 kr (ord. 8 780 kr) | Inkl. installation, efter 50 % Grön Teknik | 4390 | Visat nettopris efter avdrag | 22 | Easee-charge-up-produktbild.webp | https://ampy.se/laddboxar/easee-charge-up/ | consumer | Moms ej explicit på sidan (antas inkl.) |
| NexBlue Edge 2 - Laddbox | 4 190 :- (ord. 8 380 :-) | Inkl. installation, efter 50 % Grön Teknik | 4190 | Visat nettopris efter avdrag | 22 | nexblue-edge-2-produktbild.webp | https://ampy.se/laddboxar/nexblue-edge-2/ | consumer | Moms ej explicit (antas inkl.) |
| go-e Gemini Flex 2.0 | Totalt 4 990 :- (ord. 9 980 :-) | Inkl. installation, efter 50 % Grön Teknik | 4990 | Visat totalpris efter avdrag | 11/22 | go-e-gemini-flex-2-0-produktbild.webp | https://ampy.se/laddboxar/go-e-gemini-flex-2-0/ | consumer | Moms ej explicit (antas inkl.) |
| Tesla Wall Connector | Från 4 450 kr (ord. 8 900 kr) | Inkl. installation, efter 50 % Grön Teknik på faktura | 4450 | "Från"-pris efter avdrag = startpris nyckelfärdigt | 11/22 | Tesla-wall-connector-produktbild.webp | https://ampy.se/laddboxar/tesla-wall-connector/ | consumer | Moms ej explicit (antas inkl.); "Från" = startpris, kan variera |
| Charge Amps Luna | Från 4 850 kr (ord. 9 700 kr) | Inkl. installation, efter 50 % Grön Teknik | 4850 | "Från"-pris efter avdrag | 22 | charge-amps-luna-produktbild.webp | https://ampy.se/laddboxar/charge-amps-luna/ | consumer | Moms ej explicit (antas inkl.); "Från"-pris |
| Charge Amps Halo | 4 990 :- (ord. 9 980 :-) | Inkl. standardinstallation, efter 50 % Grön Teknik | 4990 | Visat nettopris efter avdrag | 11 | Charge-amps-halo-produktbild.webp | https://ampy.se/laddboxar/charge-amps-halo/ | consumer | Moms ej explicit; bild-URL härledd från sidinnehåll, ej HTTP-verifierad |
| Charge Amps Dawn | 6 850 kr (ord. 13 700 kr) | Inkl. installation, efter 50 % Grön Teknik på faktura | 6850 | Visat nettopris efter avdrag | 22 | Charge-amps-dawn-produktbild.webp | https://ampy.se/laddboxar/charge-amps-dawn/ | consumer | Moms ej explicit (antas inkl.) |
| Charge Amps Aura laddbox | 14 550 :- (ord. 29 100 :-) | Inkl. installation, efter 50 % Grön Teknik på faktura | 14550 | Visat nettopris efter avdrag | 22 | charge-amps-aura-produktbild.webp | https://ampy.se/laddboxar/charge-amps-aura/ | consumer | Moms-behandling EJ explicit nära priset — flaggas; bild-URL bör spot-checkas |
| Defa Power | Från 5 250 kr (ord. 10 500 kr) | Inkl. standardinstallation, efter 50 % Grön Teknik på faktura | 5250 | Visat totalpris efter avdrag | 22 | Defa-power-produktbild.webp | https://ampy.se/laddboxar/defa-power/ | consumer | Moms ej explicit (antas inkl.) |
| Amina S | Från 4 350 kr (ord. 8 700 kr) | Inkl. installation, efter 50 % Grön Teknik | 4350 | "Från"-pris efter avdrag; BADGE "Rekommenderas" | 14/22 | Amina-s-produktbild.webp | https://ampy.se/laddboxar/amina-s/ | consumer | Moms ej explicit (antas inkl.); "Från"-pris |
| Garo Entity Home | Från 5 310 kr (ord. 10 620 kr) | Inkl. installation + moms, efter 50 % Grön Teknik | 5310 | "Från"-pris efter avdrag | 14 (11/22 vid install) | Garo-entity-home-produktbild.webp | https://ampy.se/laddboxar/garo-entity-home/ | consumer | Effektmärkning 11 vs 14 vs 22 kW — bekräfta spec-tabell live |
| Wallbox Pulsar Max laddbox | 4 425 kr (ord. 8 850 kr) | Inkl. standardinstallation, inkl. moms, efter 50 % Grön Teknik | 4425 | Visat nettopris efter avdrag | 22 | Wallbox-pulsar-max-produktbild.webp | https://ampy.se/laddboxar/wallbox-pulsar-max/ | consumer | Nej (moms explicit inkl. på denna sida) |
| Zaptec Pro | Begär offert | Offert; vid offert inkl. installation + 50 % Grön Teknik, inkl. moms | null | Inget fast pris publicerat — offert | 22 | Zaptec-pro-produktbild.webp | https://ampy.se/laddboxar/zaptec-pro/ | foretag_brf_offert | Nej — korrekt offert-only |
| Garo Entity Pro | Från 7 350 kr (ord. 14 700 kr) | "Från"-pris inkl. installation, efter 50 % Grön Teknik; men företag/BRF → slutpris via offert | null | Offert-gated (CTA = offertformulär, ingen Köp-knapp); listas som offert i ägarens ordning | 22 | Garo-entity-pro-produktbild.webp | https://ampy.se/laddboxar/garo-entity-pro/ | foretag_brf_offert | JA — sidan VISAR "Från 7 350 kr" men är offert-styrd. Ska kalkylatorn visa 7 350 kr som riktpris, eller bara "Offert"? Sätter null tills ägaren bekräftar |

## Osäkerheter / beslut att bekräfta

1. **Zaptec Go (4 490 kr)** — sidan innehåller flera "Fr."-priser (5 890 / 4 390 / 4 190 / 4 990 kr) som är andra produkters korsförsäljning. Rubrikpriset bedöms vara 4 490 kr men bör spot-checkas av människa.
2. **Garo Entity Pro** — VISAR ett "Från 7 350 kr"-pris men är funktionellt offert-only (företag/BRF, inga köpknappar). Satt `priceSek: null` + `requiresQuote: true` enligt ägarens ordningsangivelse ("Garo Entity Pro as offert"). Om kalkylatorn ska visa 7 350 kr som riktpris, ändra `priceSek` till 7350.
3. **Moms** — anges explicit endast på Wallbox Pulsar Max. Övriga konsumentpriser antas inkl. moms per svensk konsumentpriskonvention + Grön Teknik-logik. Ingen prisjustering gjord; siffrorna används rakt av.
4. **Charge Amps Aura** — moms-behandling ej explicit nära priset; bild-URL rapporterad av fetch-modell, ej HTTP-verifierad.
5. **Charge Amps Halo** — bild-URL härledd från sidinnehåll, ej oberoende HTTP-verifierad.
6. **Effekt-normalisering** — `maxPowerKw` i JSON satt som heltal (engine-form). För switchbara modeller (11/22, 14/22) används det högre maxvärdet 22. Garo Entity Home behåller 14 (sidans nominella spec-värde) — bekräfta önskad märkning.
7. **Badge** — "Rekommenderas" satt på Amina S per instruktion. "Offert" satt på de två företag/BRF-produkterna. Inga andra badges i källdatan.

## Inga 404
Samtliga 16 sidor returnerade `found: true` (live, ej 404). Inga produkter saknades i fetchen.
