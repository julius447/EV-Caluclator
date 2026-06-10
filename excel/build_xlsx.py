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

NOTE: charger price_sek is now the INSTALLED, turnkey price incl. moms
(PLACEHOLDER values — to be replaced with real installed quotes).

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
    ["charger_id", "name", "description", "badge", "max_power_kw", "price_sek", "learn_more_url", "active", "sort_order"],
    [
        ["amina-s",      "Amina S",      "Smart 11 kW · inkl. installation",     "Rekommenderas", 11, 21900, "#", "true", 1],
        ["easee-charge", "Easee Charge", "Kompakt · inkl. installation",         "",              22, 19900, "#", "true", 2],
        ["zaptec-go",    "Zaptec Go",    "Diskret · inkl. installation",         "",              22, 20900, "#", "true", 3],
        ["garo-entity",  "Garo Entity",  "Svensktillverkad · inkl. installation","",              22, 22900, "#", "true", 4],
    ],
)

PRICEAREAS = (
    ["area_code", "name", "home_rate_sek_per_kwh", "is_default"],
    [
        ["SE1", "SE1 – Norra Sverige",       1.45, "false"],
        ["SE2", "SE2 – Norra Mellansverige", 1.50, "false"],
        ["SE3", "SE3 – Södra Mellansverige", 1.90, "true"],
        ["SE4", "SE4 – Södra Sverige",       2.10, "false"],
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
        ["annual_km", 15000],
        ["public_charging_pct", 50],
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
