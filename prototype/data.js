/* ── PLACEHOLDER DATA ─────────────────────────────────────────────────────────
 * NOTE: CHARGERS[].priceSek are PLACEHOLDER **fully-installed, incl. moms** prices
 * (box + standard installation, 25% VAT in), BEFORE Grön Teknik. Ampy replaces
 * these with real turnkey quotes from the signed Excel before go-live.
 * EV efficiencies (efficiencyKwhPer10km) and all rates remain illustrative too.
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
      "id": "amina-s",
      "name": "Amina S",
      "description": "Smart 11 kW · inkl. installation",
      "badge": "Rekommenderas",
      "maxPowerKw": 11,
      "priceSek": 21900,
      "slug": "#",
      "available": true
    },
    {
      "id": "easee-charge",
      "name": "Easee Charge",
      "description": "Kompakt · inkl. installation",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 19900,
      "slug": "#",
      "available": true
    },
    {
      "id": "zaptec-go",
      "name": "Zaptec Go",
      "description": "Diskret · inkl. installation",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 20900,
      "slug": "#",
      "available": true
    },
    {
      "id": "garo-entity",
      "name": "Garo Entity",
      "description": "Svensktillverkad · inkl. installation",
      "badge": null,
      "maxPowerKw": 22,
      "priceSek": 22900,
      "slug": "#",
      "available": true
    }
  ],
  "REGIONS": {
    "SE1": {
      "label": "SE1 – Norra Sverige",
      "homeRateSekPerKwh": 1.45
    },
    "SE2": {
      "label": "SE2 – Norra Mellansverige",
      "homeRateSekPerKwh": 1.5
    },
    "SE3": {
      "label": "SE3 – Södra Mellansverige",
      "homeRateSekPerKwh": 1.9
    },
    "SE4": {
      "label": "SE4 – Södra Sverige",
      "homeRateSekPerKwh": 2.1
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
    "annualKm": 15000,
    "publicChargingPct": 50,
    "publicChargingType": "dc"
  },
  "defaultRegion": "SE3",
  "postId": 0,
  "restUrl": "",
  "nonce": ""
};
