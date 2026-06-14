/* ── DATA ─────────────────────────────────────────────────────────────────────
 * CHARGERS — owner-confirmed 16-box catalogue (CATALOGUE_V3), fixed order:
 *   - priceSek      = NET installed price, incl. moms, AFTER Grön Teknik ("Att betala").
 *   - grossPriceSek = ordinarie (gross) installed price, incl. moms, BEFORE Grön Teknik.
 *   - gronTeknik    = grossPriceSek − priceSek (DO NOT deduct 48,5% again — see engine).
 *   - offertOnly    = true → no fixed price (priceSek/grossPriceSek null), CTA → offert.
 * Zaptec Pro is offert-only (null price); Garo Entity Pro has a real 7 350 kr price.
 * EV efficiencies (efficiencyKwhPer10km) and all rates remain illustrative pending
 * the signed Excel sign-off before go-live.
 * --------------------------------------------------------------------------- */
window.AmpyEvCalcData = {
  "EV_MODELS": [
    {
      "id": "tesla-model-y",
      "name": "Tesla Model Y",
      "description": "Vanligast i Sverige",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.69,
      "onboardAcKw": 11
    },
    {
      "id": "volvo-ex40",
      "name": "Volvo EX40",
      "description": "Mest sålda elbilen 2025",
      "badge": "Populär",
      "available": true,
      "efficiencyKwhPer10km": 1.7,
      "onboardAcKw": 11
    },
    {
      "id": "volvo-ex30",
      "name": "Volvo EX30",
      "description": "Kompakt SUV",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.7,
      "onboardAcKw": 11
    },
    {
      "id": "vw-id7",
      "name": "Volkswagen ID.7",
      "description": "Effektiv sedan",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.62,
      "onboardAcKw": 11
    },
    {
      "id": "vw-id4",
      "name": "Volkswagen ID.4",
      "description": "Rymlig familjebil",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.75,
      "onboardAcKw": 11
    },
    {
      "id": "kia-ev6",
      "name": "Kia EV6",
      "description": "Lång räckvidd",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.72,
      "onboardAcKw": 11
    },
    {
      "id": "byd-atto-3",
      "name": "BYD Atto 3",
      "description": "Prisvärd SUV",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.55,
      "onboardAcKw": 7
    },
    {
      "id": "annan",
      "name": "Annan elbil",
      "description": "Genomsnittlig förbrukning",
      "badge": null,
      "available": true,
      "efficiencyKwhPer10km": 1.7,
      "onboardAcKw": 11
    }
  ],
  "CHARGERS": [
    {
      "id": "zaptec-go",
      "name": "Zaptec Go",
      "description": "Kompakt, upp till 22 kW",
      "badge": "Bästsäljare",
      "maxPowerKw": 22,
      "priceSek": 4490,
      "grossPriceSek": 8980,
      "slug": "https://ampy.se/laddboxar/zaptec-go/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "zaptec-go-2",
      "name": "Zaptec Go 2",
      "description": "Nu med inbyggd skärm",
      "badge": "Rekommenderas",
      "maxPowerKw": 22,
      "priceSek": 5890,
      "grossPriceSek": 11780,
      "slug": "https://ampy.se/laddboxar/zaptec-go-2/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "easee-charge-up",
      "name": "Easee Charge Up",
      "description": "Smart laddning via app",
      "badge": "Bästsäljare",
      "maxPowerKw": 22,
      "priceSek": 4390,
      "grossPriceSek": 8780,
      "slug": "https://ampy.se/laddboxar/easee-charge-up/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "nexblue-edge-2",
      "name": "NexBlue Edge 2",
      "description": "Prisbelönt design",
      "badge": "Prisvärd",
      "maxPowerKw": 22,
      "priceSek": 4190,
      "grossPriceSek": 8380,
      "slug": "https://ampy.se/laddboxar/nexblue-edge-2/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "go-e-gemini-flex-2-0",
      "name": "go-e Gemini Flex 2.0",
      "description": "Fast eller flyttbar",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 4990,
      "grossPriceSek": 9980,
      "slug": "https://ampy.se/laddboxar/go-e-gemini-flex-2-0/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "tesla-wall-connector",
      "name": "Tesla Wall Connector",
      "description": "Fast kabel, 7,3 m",
      "badge": null,
      "maxPowerKw": 11,
      "priceSek": 4450,
      "grossPriceSek": 8900,
      "slug": "https://ampy.se/laddboxar/tesla-wall-connector/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "charge-amps-luna",
      "name": "Charge Amps Luna",
      "description": "Skandinavisk design",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 4850,
      "grossPriceSek": 9700,
      "slug": "https://ampy.se/laddboxar/charge-amps-luna/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "charge-amps-halo",
      "name": "Charge Amps Halo",
      "description": "Fast kabel & statusljus",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 4990,
      "grossPriceSek": 9980,
      "slug": "https://ampy.se/laddboxar/charge-amps-halo/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "charge-amps-dawn",
      "name": "Charge Amps Dawn",
      "description": "Svensktillverkad premium",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 6850,
      "grossPriceSek": 13700,
      "slug": "https://ampy.se/laddboxar/charge-amps-dawn/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "charge-amps-aura",
      "name": "Charge Amps Aura",
      "description": "Två bilar samtidigt",
      "badge": "Dubbel laddning",
      "maxPowerKw": 22,
      "priceSek": 14550,
      "grossPriceSek": 29100,
      "slug": "https://ampy.se/laddboxar/charge-amps-aura/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "defa-power",
      "name": "Defa Power",
      "description": "Display, klarar −40 °C",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 5250,
      "grossPriceSek": 10500,
      "slug": "https://ampy.se/laddboxar/defa-power/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "amina-s",
      "name": "Amina S",
      "description": "Marknadens minsta",
      "badge": null,
      "maxPowerKw": 11,
      "priceSek": 4350,
      "grossPriceSek": 8700,
      "slug": "https://ampy.se/laddboxar/amina-s/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "garo-entity-home",
      "name": "Garo Entity Home",
      "description": "Driftsäker villabox",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 5310,
      "grossPriceSek": 10620,
      "slug": "https://ampy.se/laddboxar/garo-entity-home/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "wallbox-pulsar-max",
      "name": "Wallbox Pulsar Max",
      "description": "Prisbelönt & kompakt",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 4425,
      "grossPriceSek": 8850,
      "slug": "https://ampy.se/laddboxar/wallbox-pulsar-max/",
      "available": true,
      "offertOnly": false
    },
    {
      "id": "zaptec-pro",
      "name": "Zaptec Pro",
      "description": "Skalbar för flera platser",
      "badge": "Offert",
      "maxPowerKw": 22,
      "priceSek": null,
      "grossPriceSek": null,
      "slug": "https://ampy.se/laddboxar/zaptec-pro/",
      "available": true,
      "offertOnly": true
    },
    {
      "id": "garo-entity-pro",
      "name": "Garo Entity Pro",
      "description": "Byggd för många bilar",
      "badge": "Företag/BRF",
      "maxPowerKw": 22,
      "priceSek": 7350,
      "grossPriceSek": 14700,
      "slug": "https://ampy.se/laddboxar/garo-entity-pro/",
      "available": true,
      "offertOnly": false
    }
  ],
  "REGIONS": {
    "SE1": {
      "label": "SE1 – Norra Sverige",
      "homeRateSekPerKwh": 1.1,
      "homeRateOptimizedSekPerKwh": 0.6
    },
    "SE2": {
      "label": "SE2 – Norra Mellansverige",
      "homeRateSekPerKwh": 1.15,
      "homeRateOptimizedSekPerKwh": 0.65
    },
    "SE3": {
      "label": "SE3 – Södra Mellansverige",
      "homeRateSekPerKwh": 1.6,
      "homeRateOptimizedSekPerKwh": 0.9
    },
    "SE4": {
      "label": "SE4 – Södra Sverige",
      "homeRateSekPerKwh": 1.8,
      "homeRateOptimizedSekPerKwh": 1.0
    }
  },
  "RATES": {
    "horizonYears": 10,
    "publicAcRateSekPerKwh": 4.5,
    "publicDcRateSekPerKwh": 5.5,
    "chargerEfficiencyPct": 0.9,
    "gronTeknikRate": 0.485,
    "gronTeknikCapPerApplicant": 50000,
    "maxApplicants": 2,
    "uncertaintyBand": 0.1
  },
  "ADVANCED_DEFAULTS": {
    "annualKm": 20000,
    "publicChargingPct": 100,
    "publicChargingType": "dc"
  },
  "defaultRegion": "SE3",
  "postId": 0,
  "restUrl": "",
  "nonce": ""
};
