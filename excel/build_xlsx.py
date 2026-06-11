#!/usr/bin/env python3
"""
Generate laddbox-kalkylator-data.xlsx in a format the REAL WordPress parser
(01_backend.php) can read: shared-string table (t="s") + RELATIVE rels targets.
xlsxwriter produces exactly that (unlike openpyxl, whose absolute targets +
inlineStr cells the parser cannot read -> silent "OK — 0 imported").

NOTE: As of the hardened parser (01_backend.php), BOTH relative
('worksheets/sheet1.xml') and absolute ('/xl/worksheets/sheet1.xml') rels
targets resolve, and inlineStr cells are also read. xlsxwriter still emits the
"easy" shape (relative targets + shared strings), so this file remains the
canonical happy-path fixture.

NOTE: charger pricing is now split into TWO columns:
  price_sek       = NET installed price AFTER Grön Teknik (what the customer pays)
  gross_price_sek = GROSS installed price incl. moms, BEFORE Grön Teknik
plus an `offert` flag (true/false). Offert-only boxes (e.g. Zaptec Pro) carry
blank prices and offert=true; the parser keeps them despite the empty price_sek.

Row layout the parser expects per sheet:
  row 0 (Excel 1) = headers
  row 1 (Excel 2) = example row, SKIPPED by the parser's `$i = 2` loop
  row 2+ (Excel 3+) = data
"""
import xlsxwriter

OUT = "/Users/juliuscallahan/Desktop/Claude Code/ev-kalkylatorn/excel/laddbox-kalkylator-data.xlsx"
HINT = "EXEMPEL – ignoreras vid import"

EVMODELS = (
    ["model_id", "name", "description", "badge", "active", "efficiency_kwh_per_10km", "onboard_ac_kw", "sort_order"],
    [
        ["tesla-model-y", "Tesla Model Y",    "Vanligast i Sverige",       "",        "true", 1.69, 11, 1],
        ["volvo-ex40",    "Volvo EX40",       "Mest sålda elbilen 2025",   "Populär", "true", 1.70, 11, 2],
        ["volvo-ex30",    "Volvo EX30",       "Kompakt SUV",               "",        "true", 1.70, 11, 3],
        ["vw-id7",        "Volkswagen ID.7",  "Effektiv sedan",            "",        "true", 1.62, 11, 4],
        ["vw-id4",        "Volkswagen ID.4",  "Rymlig familjebil",         "",        "true", 1.75, 11, 5],
        ["kia-ev6",       "Kia EV6",          "Lång räckvidd",             "",        "true", 1.72, 11, 6],
        ["byd-atto-3",    "BYD Atto 3",       "Prisvärd SUV",              "",        "true", 1.55, 7,  7],
        ["annan",         "Annan elbil",      "Genomsnittlig förbrukning", "",        "true", 1.70, 11, 8],
    ],
)

CHARGERS = (
    ["charger_id", "name", "description", "badge", "max_power_kw", "price_sek", "gross_price_sek", "offert", "learn_more_url", "active", "sort_order"],
    [
        # charger_id            name                   description                                    badge               kW  net    gross  offert   slug                                                  active  sort
        ["zaptec-go",            "Zaptec Go",            "Kompakt favorit · inkl. installation",        "Bästsäljare",      22,  4490,  8980, "false", "https://ampy.se/laddboxar/zaptec-go/",                "true",  1],
        ["zaptec-go-2",          "Zaptec Go 2",          "Inbyggd display · inkl. installation",        "Rekommenderas",    22,  5890, 11780, "false", "https://ampy.se/laddboxar/zaptec-go-2/",              "true",  2],
        ["easee-charge-up",      "Easee Charge Up",      "Smart & nätt · inkl. installation",           "Bästsäljare",      22,  4390,  8780, "false", "https://ampy.se/laddboxar/easee-charge-up/",          "true",  3],
        ["nexblue-edge-2",       "NexBlue Edge 2",       "Prisbelönt design · inkl. installation",      "Prisvärd",         22,  4190,  8380, "false", "https://ampy.se/laddboxar/nexblue-edge-2/",           "true",  4],
        ["go-e-gemini-flex-2-0", "go-e Gemini Flex 2.0", "Fast eller flyttbar · inkl. installation",    "",                 22,  4990,  9980, "false", "https://ampy.se/laddboxar/go-e-gemini-flex-2-0/",     "true",  5],
        ["tesla-wall-connector", "Tesla Wall Connector", "Fast kabel 7,3 m · inkl. installation",       "",                 11,  4450,  8900, "false", "https://ampy.se/laddboxar/tesla-wall-connector/",     "true",  6],
        ["charge-amps-luna",     "Charge Amps Luna",     "Skandinavisk design · inkl. installation",    "",                 22,  4850,  9700, "false", "https://ampy.se/laddboxar/charge-amps-luna/",         "true",  7],
        ["charge-amps-halo",     "Charge Amps Halo",     "Fast kabel & statusljus · inkl. installation","",                 22,  4990,  9980, "false", "https://ampy.se/laddboxar/charge-amps-halo/",         "true",  8],
        ["charge-amps-dawn",     "Charge Amps Dawn",     "Svensktillverkad premium · inkl. installation","",                22,  6850, 13700, "false", "https://ampy.se/laddboxar/charge-amps-dawn/",         "true",  9],
        ["charge-amps-aura",     "Charge Amps Aura",     "Två bilar samtidigt · inkl. installation",    "Dubbel laddning",  22, 14550, 29100, "false", "https://ampy.se/laddboxar/charge-amps-aura/",         "true", 10],
        ["defa-power",           "Defa Power",           "Display & −40 °C · inkl. installation",        "",                 22,  5250, 10500, "false", "https://ampy.se/laddboxar/defa-power/",               "true", 11],
        ["amina-s",              "Amina S",              "Marknadens minsta · inkl. installation",      "",                 11,  4350,  8700, "false", "https://ampy.se/laddboxar/amina-s/",                  "true", 12],
        ["garo-entity-home",     "Garo Entity Home",     "Driftsäker villabox · inkl. installation",    "",                 22,  5310, 10620, "false", "https://ampy.se/laddboxar/garo-entity-home/",         "true", 13],
        ["wallbox-pulsar-max",   "Wallbox Pulsar Max",   "Prisbelönt & kompakt · inkl. installation",   "",                 22,  4425,  8850, "false", "https://ampy.se/laddboxar/wallbox-pulsar-max/",       "true", 14],
        ["zaptec-pro",           "Zaptec Pro",           "Skalbar för flera platser · offert",          "Offert",           22,    "",    "", "true",  "https://ampy.se/laddboxar/zaptec-pro/",               "true", 15],
        ["garo-entity-pro",      "Garo Entity Pro",      "Byggd för många bilar",                       "Företag/BRF",      22,  7350, 14700, "false", "https://ampy.se/laddboxar/garo-entity-pro/",          "true", 16],
    ],
)

PRICEAREAS = (
    ["area_code", "name", "home_rate_sek_per_kwh", "home_rate_optimized_sek_per_kwh", "is_default"],
    [
        ["SE1", "SE1 – Norra Sverige",       1.45, 1.05, "false"],
        ["SE2", "SE2 – Norra Mellansverige", 1.50, 1.15, "false"],
        ["SE3", "SE3 – Södra Mellansverige", 1.90, 1.35, "true"],
        ["SE4", "SE4 – Södra Sverige",       2.10, 1.45, "false"],
    ],
)

SYSTEMCOEFFICIENTS = (
    ["key", "value"],
    [
        ["horizon_years", 10],
        ["public_ac_rate_sek_per_kwh", 4.50],
        ["public_dc_rate_sek_per_kwh", 5.50],
        ["charger_efficiency_pct", 0.90],
        ["gron_teknik_pct", 0.485],
        ["gron_teknik_cap_per_applicant_sek", 50000],
        ["max_applicants", 2],
        ["uncertainty_pct", 0.10],
    ],
)

ADVANCED = (
    ["key", "default"],
    [
        ["annual_km", 20000],
        ["public_charging_pct", 100],
        ["public_charging_type", "dc"],
    ],
)

SHEETS = [
    ("EVModels", EVMODELS),
    ("Chargers", CHARGERS),
    ("PriceAreas", PRICEAREAS),
    ("SystemCoefficients", SYSTEMCOEFFICIENTS),
    ("Advanced", ADVANCED),
]

wb = xlsxwriter.Workbook(OUT, {"in_memory": True})
bold = wb.add_format({"bold": True})

for name, (headers, data) in SHEETS:
    ws = wb.add_worksheet(name)
    for c, h in enumerate(headers):
        ws.write_string(0, c, h, bold)
    ws.write_string(1, 0, HINT)            # row index 1 — skipped by parser
    for ri, row in enumerate(data, start=2):
        for c, val in enumerate(row):
            if val == "" or val is None:
                continue                    # leave blank -> parser reads '' -> null
            if isinstance(val, str):
                ws.write_string(ri, c, val)
            else:
                ws.write_number(ri, c, val)

wb.close()
print("Wrote", OUT)
for name, (h, d) in SHEETS:
    print(f"  {name}: {len(d)} data rows")
