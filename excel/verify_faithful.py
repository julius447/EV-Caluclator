#!/usr/bin/env python3
"""
FAITHFUL port of the REAL (HARDENED) PHP parser in 01_backend.php.
The goal is to reproduce EXACTLY what WordPress would store in
_ampy_ev_calc_data given THIS .xlsx, then deep-compare to the expected object.

This mirrors the hardened parser (Part 2):
  1. build_sheet_map: targets are normalised so BOTH relative
     ('worksheets/sheet1.xml') and absolute ('/xl/worksheets/sheet1.xml',
     openpyxl-style) resolve. PHP:
         $t    = ltrim((string) $rel['Target'], '/');
         $path = (strpos($t, 'xl/') === 0) ? $t : 'xl/' . $t;
     -> the old 'xl/' . 'xl/...' path-doubling bug is GONE; openpyxl files
        now resolve too.
  2. read_sheet cell value: t=='s' (shared), t=='b' (bool) AND t=='inlineStr'
     are special-cased. inlineStr reads <is><t> plus concatenated <is><r><t>
     runs, so inline-string cells (openpyxl) no longer collapse to ''.

xlsxwriter (this fixture) still emits relative targets + shared strings, so the
hardened code produces identical output to the happy path on THIS file — but the
oracle now reflects the real parser's broadened acceptance.
"""

import zipfile
import re
import xml.etree.ElementTree as ET
import json

XLSX = "/Users/juliuscallahan/Desktop/Claude Code/ev-kalkylatorn/excel/laddbox-kalkylator-data.xlsx"


def localname(tag):
    return tag.split('}', 1)[-1] if '}' in tag else tag

def attr(el, name):
    if name in el.attrib:
        return el.attrib[name]
    for k, v in el.attrib.items():
        if localname(k) == name:
            return v
    return None

def get_from_name(z, name):
    """Mirror ZipArchive::getFromName -> returns False if not present."""
    try:
        return z.read(name)
    except KeyError:
        return False


def col_idx(col):
    col = col.upper()
    idx = 0
    for ch in col:
        idx = idx * 26 + (ord(ch) - 64)
    return idx - 1


def parse_shared_strings(z):
    xml = get_from_name(z, 'xl/sharedStrings.xml')
    if not xml:
        return []
    root = ET.fromstring(xml)
    out = []
    for si in root:
        if localname(si.tag) != 'si':
            continue
        t = [c for c in si if localname(c.tag) == 't']
        r = [c for c in si if localname(c.tag) == 'r']
        if t:
            out.append(t[0].text or '')
        elif r:
            s = ''
            for rr in r:
                for x in rr:
                    if localname(x.tag) == 't':
                        s += (x.text or '')
            out.append(s)
        else:
            out.append('')
    return out


def build_sheet_map(z):
    wb_xml = get_from_name(z, 'xl/workbook.xml')
    rels_xml = get_from_name(z, 'xl/_rels/workbook.xml.rels')
    if not wb_xml or not rels_xml:
        return {}
    wb = ET.fromstring(wb_xml)
    rels = ET.fromstring(rels_xml)
    rid_map = {}
    for rel in rels:
        if localname(rel.tag) != 'Relationship':
            continue
        rid = attr(rel, 'Id')
        target = attr(rel, 'Target')
        # HARDENED PHP: normalise so BOTH relative ('worksheets/sheet1.xml')
        # and absolute ('/xl/worksheets/sheet1.xml') targets resolve.
        #   $t    = ltrim(Target, '/');
        #   $path = (strpos($t, 'xl/') === 0) ? $t : 'xl/' . $t;
        t = target.lstrip('/')
        rid_map[rid] = t if t.startswith('xl/') else 'xl/' + t
    smap = {}
    sheets_el = next((c for c in wb if localname(c.tag) == 'sheets'), None)
    if sheets_el is None:
        return {}
    for sheet in sheets_el:
        if localname(sheet.tag) != 'sheet':
            continue
        rid = None
        for k, v in sheet.attrib.items():
            if localname(k) == 'id':
                rid = v
                break
        name = attr(sheet, 'name')
        if rid in rid_map:
            smap[name] = rid_map[rid]
    return smap


def read_sheet(z, path, shared):
    xml = get_from_name(z, path)
    if not xml:
        return []   # <-- path-doubling bug lands here
    ws = ET.fromstring(xml)
    sd = next((c for c in ws if localname(c.tag) == 'sheetData'), None)
    if sd is None:
        return []
    rows = {}
    for row in sd:
        if localname(row.tag) != 'row':
            continue
        ri = int(attr(row, 'r')) - 1
        rd = []
        for cell in row:
            if localname(cell.tag) != 'c':
                continue
            r_ref = attr(cell, 'r') or ''
            col = col_idx(re.sub(r'\d', '', r_ref))
            t = attr(cell, 't') or ''
            # (string)$cell->v  -> the <v> child (shared-string idx / number / bool).
            v = ''
            for cc in cell:
                if localname(cc.tag) == 'v':
                    v = cc.text or ''
                    break
            if t == 's':
                try:
                    v = shared[int(v)]
                except (ValueError, IndexError):
                    v = ''
            elif t == 'b':
                v = 'TRUE' if v == '1' else 'FALSE'
            elif t == 'inlineStr':
                # HARDENED PHP: read <is><t> and concatenate <is><r><t> runs.
                is_el = next((c for c in cell if localname(c.tag) == 'is'), None)
                v = ''
                if is_el is not None:
                    for child in is_el:
                        ln = localname(child.tag)
                        if ln == 't':
                            v += (child.text or '')
                        elif ln == 'r':
                            for rt in child:
                                if localname(rt.tag) == 't':
                                    v += (rt.text or '')
            while len(rd) <= col:
                rd.append('')
            rd[col] = v
        rows[ri] = rd
    return [rows[k] for k in sorted(rows.keys())]


def header_map(rows):
    if not rows:
        return {}
    hm = {}
    for i, v in enumerate(rows[0]):
        hm[v] = i
    return hm


def php_trim(s):
    return (s or '').strip()

def php_float(v):
    if v is None or v == '':
        return 0.0
    try:
        return float(v)
    except ValueError:
        m = re.match(r'\s*[-+]?(\d+(\.\d*)?|\.\d+)', str(v))
        return float(m.group(0)) if m else 0.0

def get(r, col, key, default=''):
    # PHP: $r[ $col['key'] ] ?? default
    if key not in col:
        # $col['key'] undefined -> null -> $r[null] -> typically '' (treated as ?? default? no:
        # $r[null] yields null in PHP with notice -> ?? default applies)
        return default
    idx = col[key]
    if idx < 0 or idx >= len(r) or r[idx] is None:
        return default
    return r[idx]


def parse_ev_models(rows):
    col = header_map(rows)
    models = {}
    order = []
    for i in range(2, len(rows)):
        r = rows[i]
        mid = php_trim(get(r, col, 'model_id'))
        if not mid:
            continue
        eff_raw = get(r, col, 'efficiency_kwh_per_10km', None)
        on_raw = get(r, col, 'onboard_ac_kw', None)
        sort_raw = get(r, col, 'sort_order', None)
        badge = php_trim(get(r, col, 'badge'))
        if mid not in models:
            order.append(mid)
        models[mid] = {
            'id': mid,
            'name': php_trim(get(r, col, 'name')),
            'description': php_trim(get(r, col, 'description')),
            'badge': badge if badge else None,
            'available': php_trim(get(r, col, 'active')).lower() == 'true',
            'efficiencyKwhPer10km': php_float(eff_raw) if eff_raw not in (None, '') else 1.70,
            'onboardAcKw': php_float(on_raw) if on_raw not in (None, '') else 11.0,
            '_sort': int(php_float(sort_raw)) if sort_raw not in (None, '') else 999,
        }
    items = [(k, models[k]) for k in order]
    items.sort(key=lambda kv: kv[1]['_sort'])
    out = []
    for k, m in items:
        m = dict(m); del m['_sort']; out.append(m)
    return out


def parse_chargers(rows):
    col = header_map(rows)
    chargers = {}
    order = []
    for i in range(2, len(rows)):
        r = rows[i]
        cid = php_trim(get(r, col, 'charger_id'))
        if not cid:
            continue
        # Mirror hardened PHP: offert boxes have NO price but must be kept when
        # offert=true; a blank price with offert=false is a placeholder row -> skip.
        #   $offert    = strtolower(trim((string)($r[col] ?? ''))) === 'true';
        #   $price_raw = (string)($r[col] ?? '');  $price = (float)$price_raw;
        #   if ( ! $price && ! $offert ) continue;
        offert = php_trim(get(r, col, 'offert', '')).lower() == 'true'
        price_raw = get(r, col, 'price_sek', '')
        price_raw = '' if price_raw is None else str(price_raw)
        gross_raw = get(r, col, 'gross_price_sek', '')
        gross_raw = '' if gross_raw is None else str(gross_raw)
        price = php_float(price_raw)
        if not price and not offert:
            continue
        badge = php_trim(get(r, col, 'badge'))
        mp_raw = get(r, col, 'max_power_kw', None)
        sort_raw = get(r, col, 'sort_order', None)
        # slug: trim( $r[col] ?? '#' ); if key absent -> '#', if '' -> ''
        slug = php_trim(get(r, col, 'learn_more_url', '#'))
        if cid not in chargers:
            order.append(cid)
        chargers[cid] = {
            'id': cid,
            'name': php_trim(get(r, col, 'name')),
            'description': php_trim(get(r, col, 'description')),
            'badge': badge if badge else None,
            'maxPowerKw': php_float(mp_raw) if mp_raw not in (None, '') else 11.0,
            # price_sek = NET (after Grön Teknik); gross_price_sek = gross.
            # Offert boxes leave both null (PHP: ($raw === '') ? null : (int)round(...)).
            'priceSek': None if price_raw == '' else int(round(price)),
            'grossPriceSek': None if gross_raw == '' else int(round(php_float(gross_raw))),
            'slug': slug,
            'available': php_trim(get(r, col, 'active')).lower() == 'true',
            'offertOnly': offert,
            '_sort': int(php_float(sort_raw)) if sort_raw not in (None, '') else 999,
        }
    items = [(k, chargers[k]) for k in order]
    items.sort(key=lambda kv: kv[1]['_sort'])
    out = []
    for k, c in items:
        c = dict(c); del c['_sort']; out.append(c)
    return out


def parse_price_areas(rows):
    col = header_map(rows)
    regions = {}
    for i in range(2, len(rows)):
        r = rows[i]
        code = php_trim(get(r, col, 'area_code'))
        if not code:
            continue
        name = get(r, col, 'name', None)
        label = php_trim(name) if name not in (None,) else code
        # PHP: trim( $r[col] ?? $code ) ; absent->code, '' -> '' (trim of '')
        if name in (None,):
            label = code
        hr_raw = get(r, col, 'home_rate_sek_per_kwh', None)
        home_rate = php_float(hr_raw) if hr_raw not in (None, '') else 2.20
        # homeRateOptimizedSekPerKwh: new PriceAreas column. Blank/absent -> ~88%
        # of the flat home rate (mirrors PHP `round($home_rate * 0.88, 2)`).
        opt_raw = get(r, col, 'home_rate_optimized_sek_per_kwh', None)
        opt_rate = round(home_rate * 0.88, 2) if opt_raw in (None, '') else php_float(opt_raw)
        regions[code] = {
            'label': label,
            'homeRateSekPerKwh': home_rate,
            'homeRateOptimizedSekPerKwh': opt_rate,
            '_is_default': php_trim(get(r, col, 'is_default')).lower() == 'true',
        }
    if not regions:
        regions = {
            'SE1': {'label': 'SE1 – Norra Sverige', 'homeRateSekPerKwh': 1.45, 'homeRateOptimizedSekPerKwh': 1.05, '_is_default': False},
            'SE2': {'label': 'SE2 – Norra Mellansverige', 'homeRateSekPerKwh': 1.60, 'homeRateOptimizedSekPerKwh': 1.15, '_is_default': False},
            'SE3': {'label': 'SE3 – Södra Mellansverige', 'homeRateSekPerKwh': 2.20, 'homeRateOptimizedSekPerKwh': 1.35, '_is_default': True},
            'SE4': {'label': 'SE4 – Södra Sverige', 'homeRateSekPerKwh': 2.60, 'homeRateOptimizedSekPerKwh': 1.45, '_is_default': False},
        }
    return regions


def parse_system_coefficients(rows):
    col = header_map(rows)
    kmap = {
        'horizon_years': 'horizonYears',
        'public_ac_rate_sek_per_kwh': 'publicAcRateSekPerKwh',
        'public_dc_rate_sek_per_kwh': 'publicDcRateSekPerKwh',
        'charger_efficiency_pct': 'chargerEfficiencyPct',
        'gron_teknik_pct': 'gronTeknikRate',
        'gron_teknik_cap_per_applicant_sek': 'gronTeknikCapPerApplicant',
        'max_applicants': 'maxApplicants',
        'uncertainty_pct': 'uncertaintyBand',
    }
    rates = {
        'horizonYears': 10, 'publicAcRateSekPerKwh': 4.50, 'publicDcRateSekPerKwh': 5.99,
        'chargerEfficiencyPct': 0.90, 'gronTeknikRate': 0.485,
        'gronTeknikCapPerApplicant': 50000, 'maxApplicants': 2, 'uncertaintyBand': 0.10,
    }
    int_keys = {'gron_teknik_cap_per_applicant_sek', 'max_applicants', 'horizon_years'}
    for i in range(2, len(rows)):
        r = rows[i]
        key = php_trim(get(r, col, 'key'))
        val = get(r, col, 'value', '')
        if val == '' or key not in kmap:
            continue
        rates[kmap[key]] = int(round(php_float(val))) if key in int_keys else php_float(val)
    return rates


def parse_advanced(rows):
    col = header_map(rows)
    kmap = {'annual_km': 'annualKm', 'public_charging_pct': 'publicChargingPct',
            'public_charging_type': 'publicChargingType'}
    defaults = {'annualKm': 15000, 'publicChargingPct': 50, 'publicChargingType': 'dc'}
    for i in range(2, len(rows)):
        r = rows[i]
        key = php_trim(get(r, col, 'key'))
        val = get(r, col, 'default', '')
        if val == '' or key not in kmap:
            continue
        js_key = kmap[key]
        defaults[js_key] = str(val) if js_key == 'publicChargingType' else php_float(val)
    return defaults


def build():
    z = zipfile.ZipFile(XLSX)
    shared = parse_shared_strings(z)
    smap = build_sheet_map(z)

    def read(name):
        return read_sheet(z, smap[name], shared) if name in smap else []

    rows_dump = {n: read(n) for n in ['EVModels', 'Chargers', 'PriceAreas', 'SystemCoefficients', 'Advanced']}

    EV_MODELS = parse_ev_models(read('EVModels'))
    CHARGERS = parse_chargers(read('Chargers'))
    REGIONS = parse_price_areas(read('PriceAreas'))
    RATES = parse_system_coefficients(read('SystemCoefficients'))
    ADVANCED = parse_advanced(read('Advanced'))
    z.close()

    defaultRegion = 'SE3'
    for code, rr in REGIONS.items():
        if rr.get('_is_default'):
            defaultRegion = code
            break
    for rr in REGIONS.values():
        rr.pop('_is_default', None)

    data = {
        'EV_MODELS': EV_MODELS,
        'CHARGERS': CHARGERS,
        'REGIONS': REGIONS,
        'RATES': RATES,
        'ADVANCED_DEFAULTS': ADVANCED,
        'defaultRegion': defaultRegion,
    }

    # HARDENED PHP: a 0-row import is a HARD error (status must NOT contain "OK")
    # and the previously-good _ampy_ev_calc_data is NOT overwritten. Mirror the
    # status string here so the oracle reflects the parser's accept/reject gate.
    ev_count, ch_count = len(EV_MODELS), len(CHARGERS)
    if ev_count == 0 or ch_count == 0:
        status = (f"Error: no rows imported "
                  f"({ev_count} EV models, {ch_count} chargers). "
                  f"Previous data kept.")
    else:
        status = (f"OK — {ev_count} EV model{'' if ev_count == 1 else 's'}, "
                  f"{ch_count} charger{'' if ch_count == 1 else 's'} imported.")

    return data, smap, rows_dump, status


EXPECTED = {
  "EV_MODELS": [
    {"id":"tesla-model-y","name":"Tesla Model Y","description":"Vanligast i Sverige","badge":None,"available":True,"efficiencyKwhPer10km":1.69,"onboardAcKw":11},
    {"id":"volvo-ex40","name":"Volvo EX40","description":"Mest sålda elbilen 2025","badge":"Populär","available":True,"efficiencyKwhPer10km":1.7,"onboardAcKw":11},
    {"id":"volvo-ex30","name":"Volvo EX30","description":"Kompakt SUV","badge":None,"available":True,"efficiencyKwhPer10km":1.7,"onboardAcKw":11},
    {"id":"vw-id7","name":"Volkswagen ID.7","description":"Effektiv sedan","badge":None,"available":True,"efficiencyKwhPer10km":1.62,"onboardAcKw":11},
    {"id":"vw-id4","name":"Volkswagen ID.4","description":"Rymlig familjebil","badge":None,"available":True,"efficiencyKwhPer10km":1.75,"onboardAcKw":11},
    {"id":"kia-ev6","name":"Kia EV6","description":"Lång räckvidd","badge":None,"available":True,"efficiencyKwhPer10km":1.72,"onboardAcKw":11},
    {"id":"byd-atto-3","name":"BYD Atto 3","description":"Prisvärd SUV","badge":None,"available":True,"efficiencyKwhPer10km":1.55,"onboardAcKw":7},
    {"id":"annan","name":"Annan elbil","description":"Genomsnittlig förbrukning","badge":None,"available":True,"efficiencyKwhPer10km":1.7,"onboardAcKw":11},
  ],
  "CHARGERS": [
    {"id":"zaptec-go","name":"Zaptec Go","description":"Kompakt favorit · inkl. installation","badge":"Bästsäljare","maxPowerKw":22,"priceSek":4490,"grossPriceSek":8980,"slug":"https://ampy.se/laddboxar/zaptec-go/","available":True,"offertOnly":False},
    {"id":"zaptec-go-2","name":"Zaptec Go 2","description":"Inbyggd display · inkl. installation","badge":"Rekommenderas","maxPowerKw":22,"priceSek":5890,"grossPriceSek":11780,"slug":"https://ampy.se/laddboxar/zaptec-go-2/","available":True,"offertOnly":False},
    {"id":"easee-charge-up","name":"Easee Charge Up","description":"Smart & nätt · inkl. installation","badge":"Bästsäljare","maxPowerKw":22,"priceSek":4390,"grossPriceSek":8780,"slug":"https://ampy.se/laddboxar/easee-charge-up/","available":True,"offertOnly":False},
    {"id":"nexblue-edge-2","name":"NexBlue Edge 2","description":"Prisbelönt design · inkl. installation","badge":"Prisvärd","maxPowerKw":22,"priceSek":4190,"grossPriceSek":8380,"slug":"https://ampy.se/laddboxar/nexblue-edge-2/","available":True,"offertOnly":False},
    {"id":"go-e-gemini-flex-2-0","name":"go-e Gemini Flex 2.0","description":"Fast eller flyttbar · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":4990,"grossPriceSek":9980,"slug":"https://ampy.se/laddboxar/go-e-gemini-flex-2-0/","available":True,"offertOnly":False},
    {"id":"tesla-wall-connector","name":"Tesla Wall Connector","description":"Fast kabel 7,3 m · inkl. installation","badge":None,"maxPowerKw":11,"priceSek":4450,"grossPriceSek":8900,"slug":"https://ampy.se/laddboxar/tesla-wall-connector/","available":True,"offertOnly":False},
    {"id":"charge-amps-luna","name":"Charge Amps Luna","description":"Skandinavisk design · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":4850,"grossPriceSek":9700,"slug":"https://ampy.se/laddboxar/charge-amps-luna/","available":True,"offertOnly":False},
    {"id":"charge-amps-halo","name":"Charge Amps Halo","description":"Fast kabel & statusljus · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":4990,"grossPriceSek":9980,"slug":"https://ampy.se/laddboxar/charge-amps-halo/","available":True,"offertOnly":False},
    {"id":"charge-amps-dawn","name":"Charge Amps Dawn","description":"Svensktillverkad premium · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":6850,"grossPriceSek":13700,"slug":"https://ampy.se/laddboxar/charge-amps-dawn/","available":True,"offertOnly":False},
    {"id":"charge-amps-aura","name":"Charge Amps Aura","description":"Två bilar samtidigt · inkl. installation","badge":"Dubbel laddning","maxPowerKw":22,"priceSek":14550,"grossPriceSek":29100,"slug":"https://ampy.se/laddboxar/charge-amps-aura/","available":True,"offertOnly":False},
    {"id":"defa-power","name":"Defa Power","description":"Display & −40 °C · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":5250,"grossPriceSek":10500,"slug":"https://ampy.se/laddboxar/defa-power/","available":True,"offertOnly":False},
    {"id":"amina-s","name":"Amina S","description":"Marknadens minsta · inkl. installation","badge":None,"maxPowerKw":11,"priceSek":4350,"grossPriceSek":8700,"slug":"https://ampy.se/laddboxar/amina-s/","available":True,"offertOnly":False},
    {"id":"garo-entity-home","name":"Garo Entity Home","description":"Driftsäker villabox · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":5310,"grossPriceSek":10620,"slug":"https://ampy.se/laddboxar/garo-entity-home/","available":True,"offertOnly":False},
    {"id":"wallbox-pulsar-max","name":"Wallbox Pulsar Max","description":"Prisbelönt & kompakt · inkl. installation","badge":None,"maxPowerKw":22,"priceSek":4425,"grossPriceSek":8850,"slug":"https://ampy.se/laddboxar/wallbox-pulsar-max/","available":True,"offertOnly":False},
    {"id":"zaptec-pro","name":"Zaptec Pro","description":"Skalbar för flera platser · offert","badge":"Offert","maxPowerKw":22,"priceSek":None,"grossPriceSek":None,"slug":"https://ampy.se/laddboxar/zaptec-pro/","available":True,"offertOnly":True},
    {"id":"garo-entity-pro","name":"Garo Entity Pro","description":"Byggd för många bilar","badge":"Företag/BRF","maxPowerKw":22,"priceSek":7350,"grossPriceSek":14700,"slug":"https://ampy.se/laddboxar/garo-entity-pro/","available":True,"offertOnly":False},
  ],
  "REGIONS": {
    "SE1":{"label":"SE1 – Norra Sverige","homeRateSekPerKwh":1.45,"homeRateOptimizedSekPerKwh":1.05},
    "SE2":{"label":"SE2 – Norra Mellansverige","homeRateSekPerKwh":1.5,"homeRateOptimizedSekPerKwh":1.15},
    "SE3":{"label":"SE3 – Södra Mellansverige","homeRateSekPerKwh":1.9,"homeRateOptimizedSekPerKwh":1.35},
    "SE4":{"label":"SE4 – Södra Sverige","homeRateSekPerKwh":2.1,"homeRateOptimizedSekPerKwh":1.45},
  },
  "RATES": {"horizonYears":10,"publicAcRateSekPerKwh":4.5,"publicDcRateSekPerKwh":5.5,"chargerEfficiencyPct":0.9,"gronTeknikRate":0.485,"gronTeknikCapPerApplicant":50000,"maxApplicants":2,"uncertaintyBand":0.1},
  "ADVANCED_DEFAULTS": {"annualKm":20000,"publicChargingPct":100,"publicChargingType":"dc"},
  "defaultRegion": "SE3",
}


def norm(x):
    """Normalize for deep compare: ints and floats that are equal compare equal
    (mirrors JSON numeric serialization where 11.0 -> 11)."""
    if isinstance(x, bool):
        return ('bool', x)
    if isinstance(x, (int, float)):
        f = float(x)
        return ('num', int(f)) if f.is_integer() else ('num', f)
    if isinstance(x, dict):
        return {k: norm(v) for k, v in x.items()}
    if isinstance(x, list):
        return [norm(v) for v in x]
    return x


def diff(path, a, b, out):
    na, nb = norm(a), norm(b)
    if isinstance(a, dict) and isinstance(b, dict):
        for k in a:
            if k not in b:
                out.append(f"{path}.{k}: EXTRA in actual = {a[k]!r}")
            else:
                diff(f"{path}.{k}", a[k], b[k], out)
        for k in b:
            if k not in a:
                out.append(f"{path}.{k}: MISSING in actual (expected {b[k]!r})")
        return
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            out.append(f"{path}: length actual={len(a)} expected={len(b)}")
        for i in range(max(len(a), len(b))):
            if i >= len(a):
                out.append(f"{path}[{i}]: MISSING in actual (expected {b[i]!r})")
            elif i >= len(b):
                out.append(f"{path}[{i}]: EXTRA in actual = {a[i]!r}")
            else:
                diff(f"{path}[{i}]", a[i], b[i], out)
        return
    if na != nb:
        out.append(f"{path}: actual={a!r}  expected={b!r}")


if __name__ == '__main__':
    data, smap, rows_dump, status = build()
    print("=== SHEET MAP (paths PHP would request) ===")
    print(json.dumps(smap, ensure_ascii=False, indent=2))
    print("\n=== ROW COUNTS read by PHP per sheet ===")
    for n, rws in rows_dump.items():
        print(f"  {n}: {len(rws)} rows")
    print("\n=== IMPORT STATUS (hardened parser would store) ===")
    print(f"  {status}")
    print("\n=== ACTUAL STORED JSON (what WordPress would save) ===")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    print("\n=== DEEP DIFF vs EXPECTED ===")
    diffs = []
    diff('root', data, EXPECTED, diffs)
    status_ok = 'OK' in status
    if not status_ok:
        diffs.append(f"import status is NOT OK -> hard error: {status!r}")
    if not diffs:
        print("PASS — deep-equal")
    else:
        print(f"FAIL — {len(diffs)} mismatch(es):")
        for d in diffs:
            print("  " + d)
