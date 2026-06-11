
/**
 * Ampy — EV Charging Savings Calculator — JS Engine
 * Fluent Snippets: set Run Location → Frontend
 *
 * Reads:     window.AmpyEvCalcData  (injected by ampy_render_ev_lead_magnet)
 * Exposes:   window.AmpyEvCalculator
 * DOM root:  #ampyEvCalc
 *
 * Early-exits silently on any page that does not have window.AmpyEvCalcData,
 * so loading this snippet globally never costs anything on other pages.
 */
(function () {
  "use strict";

  /* Exit immediately on pages without the EV calculator */
  if ( !window.AmpyEvCalcData ) return;

  /* =====================================================================
     DATA
     ===================================================================== */
  var _d = window.AmpyEvCalcData;

  var EV_MODELS = _d.EV_MODELS || [];
  var CHARGERS  = _d.CHARGERS  || [];

  var REGIONS = _d.REGIONS || {
    SE1: { label: "SE1 – Norra Sverige",       homeRateSekPerKwh: 1.45, homeRateOptimizedSekPerKwh: 1.05 },
    SE2: { label: "SE2 – Norra Mellansverige", homeRateSekPerKwh: 1.50, homeRateOptimizedSekPerKwh: 1.15 },
    SE3: { label: "SE3 – Södra Mellansverige", homeRateSekPerKwh: 1.90, homeRateOptimizedSekPerKwh: 1.35 },
    SE4: { label: "SE4 – Södra Sverige",       homeRateSekPerKwh: 2.10, homeRateOptimizedSekPerKwh: 1.45 }
  };

  var RATES = Object.assign({
    horizonYears:              10,
    publicAcRateSekPerKwh:     4.50,
    publicDcRateSekPerKwh:     5.50,
    chargerEfficiencyPct:      0.90,
    gronTeknikRate:            0.485,
    gronTeknikCapPerApplicant: 50000,
    maxApplicants:             2,
    uncertaintyBand:           0.10
  }, _d.RATES || {});

  var ADVANCED_DEFAULTS = Object.assign({
    annualKm:           20000,
    publicChargingPct:  100,
    publicChargingType: "dc"
  }, _d.ADVANCED_DEFAULTS || {});

  var DEFAULT_REGION = _d.defaultRegion || "SE3";

  /* Km slider steps and % slider steps */
  var KM_STEPS  = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
  var PCT_STEPS = [0, 25, 50, 75, 100];

  /* ── State ──────────────────────────────────────────────────────────── */
  /* The investment is ALWAYS included now (single view: net price + 10-yr net).
     The ROI "Med/Utan investering" toggle was removed (owner decision); the
     10-yr tile always uses calculateFor's cumulativeNet series.
     numTaxApplicants is hard-pinned to 1 (the "Antal sökande" stepper UI was
     removed) — the engine's Grön Teknik cap logic still reads it. */
  var state = {
    evModelId:        null,
    chargerId:        null,
    region:           DEFAULT_REGION,
    numTaxApplicants: 1,
    annualKm:         ADVANCED_DEFAULTS.annualKm,
    publicChargingPct:ADVANCED_DEFAULTS.publicChargingPct,
    publicChargingType: ADVANCED_DEFAULTS.publicChargingType
  };

  /* ── Helpers ────────────────────────────────────────────────────────── */
  var $  = function (id) { return document.getElementById(id); };
  var root = $("ampyEvCalc");

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NBSP = "\u00a0";

  function fmtKr(value) {
    if (value == null || !isFinite(value)) return "—";
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  }

  function fmtKm(value) {
    if (value == null) return "—";
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  }

  function fmtPct(value) {
    if (value == null) return "—";
    return Math.round(value).toString();
  }

  /* Short tick label for the km slider: 5000→"5k", 50000→"50k".
     Keeps tick labels legible on phones ≤390px (full value lives in the
     tick's aria-label/title and in the live value display above the slider). */
  function fmtKmShort(value) {
    if (value == null) return "—";
    return Math.round(value / 1000) + "k";
  }

  function fmtRate(value) {
    if (value == null) return "—";
    return value.toFixed(2).replace(".", ",");
  }

  function fmtYears(years) {
    if (years == null || !isFinite(years)) return "—";
    return years.toFixed(1).replace(".", ",");
  }

  function findEvModel(id) {
    return EV_MODELS.find(function (m) { return m.id === id; }) || null;
  }

  function findCharger(id) {
    return CHARGERS.find(function (c) { return c.id === id; }) || null;
  }

  /* =====================================================================
     GDPR / CONSENT
     The exact consent wording shown in the form. Versioned + timestamped so
     the server stores WHAT the user agreed to and WHEN. Bump CONSENT_VERSION
     whenever the wording changes (audit trail for Article 7 GDPR).
     ===================================================================== */
  var CONSENT_VERSION = "2026-06-10.1";
  var CONSENT_TEXT =
    "Jag samtycker till att Ampy lagrar och behandlar mina kontakt- och " +
    "kalkyluppgifter för att kontakta mig med en offert. Du kan när som helst " +
    "återkalla samtycket. Se vår integritetspolicy för hur vi hanterar dina " +
    "uppgifter och dina rättigheter.";

  /* Form-open timestamp — recorded when the lead form is first revealed.
     Sent in the payload so the server can reject implausibly fast (bot) submits
     (e.g. < 2s). null until the form opens. */
  var _formOpenedAt = null;

  /* =====================================================================
     TELEMETRY
     - UTM + referrer + landing path captured once at load (degrades cleanly
       when absent — every field defaults to null, never throws).
     - Funnel events pushed to window.dataLayer (guarded) AND console.debug.
       Third-party analytics is gated behind consent (see emitEvent).
     ===================================================================== */
  function captureMeta() {
    var meta = {
      utmSource:   null, utmMedium: null, utmCampaign: null,
      utmTerm:     null, utmContent: null,
      referrer:    null, landingPath: null, landingUrl: null
    };
    try {
      if (typeof URLSearchParams !== "undefined" && window.location) {
        var qs = new URLSearchParams(window.location.search || "");
        meta.utmSource   = qs.get("utm_source")   || null;
        meta.utmMedium   = qs.get("utm_medium")   || null;
        meta.utmCampaign = qs.get("utm_campaign") || null;
        meta.utmTerm     = qs.get("utm_term")     || null;
        meta.utmContent  = qs.get("utm_content")  || null;
      }
    } catch (e) { /* malformed query string — leave UTM null */ }
    try {
      meta.referrer    = (document && document.referrer) ? document.referrer : null;
      if (window.location) {
        meta.landingPath = window.location.pathname || null;
        meta.landingUrl  = window.location.href || null;
      }
    } catch (e2) { /* no document/location — leave null */ }
    return meta;
  }

  /* Captured once at module load so later navigation/UTM stripping can't lose it. */
  var META = captureMeta();

  /* Has the user given marketing consent in THIS session? Gates 3rd-party
     analytics fan-out. Read live from the checkbox so it always reflects the
     current UI state. */
  function hasConsent() {
    var cb = $("ampyEvLeadConsent");
    return !!(cb && cb.checked);
  }

  /* Emit a funnel event. Always console.debug (dev signal, no PII). Pushes to
     window.dataLayer only when it exists. Any third-party analytics call is
     gated behind consent. `detail` is optional and must never carry PII. */
  function emitEvent(name, detail) {
    var payload = Object.assign({ event: "ampy_ev_calc", ampyEvent: name }, detail || {});
    try { console.debug("[ampy-ev]", name, detail || {}); } catch (e) {}
    try {
      if (window.dataLayer && typeof window.dataLayer.push === "function") {
        window.dataLayer.push(payload);
      }
    } catch (e2) {}
    /* 3rd-party analytics fan-out — consent-gated. Hook left for Ampy to wire a
       real vendor (e.g. window.gtag / Plausible). Never fires without consent. */
    try {
      if (hasConsent() && typeof window.ampyEvAnalytics === "function") {
        window.ampyEvAnalytics(name, detail || {});
      }
    } catch (e3) {}
  }

  /* =====================================================================
     CALCULATION
     ===================================================================== */
  function calculateFor(evModelId, chargerId) {
    var evModel = findEvModel(evModelId);
    var charger = findCharger(chargerId);

    if (!evModel || !evModel.available) return { unavailable: true, evModel: evModel };
    if (!charger || !charger.available) return { unavailable: true, charger: charger };

    var annualKm          = state.annualKm;
    var publicPct         = state.publicChargingPct / 100;
    var pubType           = state.publicChargingType;
    var horizon           = RATES.horizonYears || 10;

    /* Energy */
    var annualEnergyNeeded   = (annualKm / 10) * evModel.efficiencyKwhPer10km;
    var annualEnergyFromGrid = annualEnergyNeeded / RATES.chargerEfficiencyPct;
    var publicKwh            = annualEnergyFromGrid * publicPct;

    /* Rates */
    var publicRate = pubType === "ac"
      ? RATES.publicAcRateSekPerKwh
      : RATES.publicDcRateSekPerKwh;
    var homeRate   = (REGIONS[state.region] || {}).homeRateSekPerKwh || 1.90;
    var rateGap    = publicRate - homeRate;

    /* Scheduled / optimised home rate (owner decision D1).
       A modern laddbox shifts charging to the cheapest hours, so the effective
       home rate is lower. This feeds the THIRD "Hemma, schemalagd" bar ONLY —
       the headline annualSaving below stays anchored to the conservative flat
       homeRate and is NOT touched. Safe fallback (~22% under flat) if the
       per-zone optimised rate is absent in the data. */
    var homeRateOpt = (REGIONS[state.region] || {}).homeRateOptimizedSekPerKwh || homeRate * 0.78;

    /* Annual saving — independent of the box price, so it is valid for
       offert-only boxes too. Uses the FLAT homeRate (unchanged). */
    var annualSaving = publicKwh * rateGap;

    /* Monthly cost comparison — what the public-charged kWh cost publicly vs at
       home, per month. Segment-agnostic (valid for offert-only boxes too).
       Reconciles to the annual hero exactly: (public − home) × 12 === annualSaving. */
    var monthlyPublicCost = publicKwh * publicRate / 12;
    var monthlyHomeCost   = publicKwh * homeRate   / 12;
    var monthlySaving     = monthlyPublicCost - monthlyHomeCost;

    /* Third bar: monthly cost if the box schedules charging to the cheapest
       hours. Same shape as monthlyHomeCost, at the optimised rate. Additive
       upside — does NOT change the headline saving. */
    var monthlyHomeOptCost = publicKwh * homeRateOpt / 12;

    /* Charger cost + Grön Teknik.
       The catalogue ships TWO real prices per box:
         - charger.priceSek      = NET installed price, incl. moms, AFTER Grön Teknik
                                    ("Att betala").
         - charger.grossPriceSek = ordinarie/gross price, incl. moms, BEFORE Grön Teknik.
       Grön Teknik is simply the difference (gross − net). DO NOT deduct 48,5% again.
       Offert-only boxes carry null prices → no price-derived figures (offert flag). */
    var offert = !!charger.offertOnly || charger.priceSek == null;

    var grossPrice = offert ? null : charger.grossPriceSek;
    var netCost    = offert ? null : charger.priceSek;
    var gronTeknik = offert ? null : (grossPrice - netCost);

    /* Payback — needs a net price; null for offert-only boxes. */
    var paybackYears = (!offert && annualSaving > 0) ? netCost / annualSaving : null;

    /* Cumulative — two series (only meaningful when there is a box price):
       - cumulativeNet:     annualSaving×year − netCost (with investment; loss→profit)
       - cumulativeSavings: annualSaving×year          (pure savings, all-profit) */
    var cumulativeNet     = [];
    var cumulativeSavings = [];
    for (var y = 0; y <= horizon; y++) {
      cumulativeNet.push(offert ? null : (annualSaving * y - netCost));
      cumulativeSavings.push(annualSaving * y);
    }

    return {
      unavailable:         false,
      offert:              offert,
      evModel:             evModel,
      charger:             charger,
      annualKm:            annualKm,
      publicPct:           publicPct,
      publicKwh:           publicKwh,
      pubType:             pubType,
      publicRate:          publicRate,
      homeRate:            homeRate,
      rateGap:             rateGap,
      annualSaving:        annualSaving,
      homeRateOpt:         homeRateOpt,
      monthlyPublicCost:   monthlyPublicCost,
      monthlyHomeCost:     monthlyHomeCost,
      monthlyHomeOptCost:  monthlyHomeOptCost,
      monthlySaving:       monthlySaving,
      grossPrice:          grossPrice,
      gronTeknik:          gronTeknik,
      netCost:             netCost,
      paybackYears:        paybackYears,
      cumulativeNet:       cumulativeNet,
      cumulativeSavings:   cumulativeSavings,
      cumulativeNetN:      offert ? null : cumulativeNet[horizon],
      cumulativeSavingsN:  cumulativeSavings[horizon],
      savingLow:           annualSaving * (1 - RATES.uncertaintyBand),
      savingHigh:          annualSaving * (1 + RATES.uncertaintyBand),
      horizon:             horizon
    };
  }

  /* =====================================================================
     A11Y: DEBOUNCED HEADLINE ANNOUNCER
     One polite live region (#ampyEvSrStatus) replaces the old aria-live on
     the whole results card. We debounce so dragging a slider or stepping
     applicants does not spam the SR queue — only the settled headline
     (annual saving) is announced, ~600ms after the last input change.
     ===================================================================== */
  var _srTimer = null;
  var _srLast  = null;
  function announceHeadline(message) {
    var el = $("ampyEvSrStatus");
    if (!el) return;
    if (_srTimer) clearTimeout(_srTimer);
    _srTimer = setTimeout(function () {
      /* skip if nothing meaningful changed since the last announcement */
      if (message === _srLast) return;
      _srLast = message;
      el.textContent = message;
    }, 600);
  }

  /* =====================================================================
     COUNT-UP ANIMATION
     ===================================================================== */
  /* Point 11c: while a slider is being dragged, the count-up is suppressed —
     numbers update INSTANTLY each step so the result column doesn't "machine-gun"
     through intermediate counts on a fast drag. The full animated render runs
     once on release (endDrag → renderAll). Toggled by the slider drag handlers. */
  var _dragInstant = false;
  var previousValues = {};
  function animateNumber(key, targetValue, formatter, elementId) {
    var el = $(elementId);
    if (!el) return;
    var hasPrev = Object.prototype.hasOwnProperty.call(previousValues, key);
    var from    = hasPrev ? previousValues[key] : targetValue;
    previousValues[key] = targetValue;
    el.textContent = formatter(targetValue);
    if (!hasPrev || _dragInstant || prefersReducedMotion || !isFinite(targetValue) ||
        !isFinite(from) || from === targetValue) return;
    var duration = 280, start = performance.now(), finalized = false;
    function tick(now) {
      var t     = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatter(from + (targetValue - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else        finalized = true;
    }
    requestAnimationFrame(tick);
    setTimeout(function () { if (!finalized) el.textContent = formatter(targetValue); }, duration + 60);
  }

  /* =====================================================================
     RENDER: SELECTOR (shared pattern for both car and charger)
     ===================================================================== */
  function carIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17H3a2 2 0 0 1-2-2v-4l3.3-5.5A2 2 0 0 1 6.1 4h11.8a2 2 0 0 1 1.7.9L23 10v5a2 2 0 0 1-2 2h-2"/><circle cx="8.5" cy="17" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/></svg>';
  }

  function chargerIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 8h4M12 5v6M9 20h6"/></svg>';
  }

  /* Badge 3-tier map (Part 3 §3-1). Promote = solid teal (the boxes Ampy
     pushes); Attribute = soft wash (helpful descriptor); Flow = muted outline
     ("different path"). Unknown tags fall back to the soft descriptor look. */
  var BADGE_TIER = {
    "Bästsäljare":   "promote",
    "Rekommenderas": "promote",
    "Prisvärd":      "soft",
    "Dubbel laddning": "soft",
    "Populär":       "soft",
    "Prisbelönt":    "soft",
    "Offert":        "flow",
    "Företag/BRF":   "flow"
  };
  function badgeTierClass(tag) {
    return "ampy-calc__badge--" + (BADGE_TIER[tag] || "soft");
  }

  function renderSelector(opts) {
    /* opts: { suffix, items, selectedId, idPrefix, labelId, onSelect, iconFn } */
    var suffix    = opts.suffix;
    var items     = opts.items;
    var selectedId= opts.selectedId;
    var p         = opts.idPrefix;
    var iconFn    = opts.iconFn;
    var onSelect  = opts.onSelect;

    var list = $(p + "List" + suffix);
    list.innerHTML = "";

    items.forEach(function (item) {
      var li  = document.createElement("li");
      li.setAttribute("role", "option");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ampy-calc__selector-option";
      btn.setAttribute("data-item-id", item.id);
      btn.setAttribute("aria-selected", item.id === selectedId ? "true" : "false");
      if (!item.available) btn.setAttribute("aria-disabled", "true");

      var img       = document.createElement("span");
      img.className = "ampy-calc__selector-img";
      img.innerHTML = iconFn();

      var text      = document.createElement("span");
      text.className= "ampy-calc__selector-text";
      var name      = document.createElement("span");
      name.className= "ampy-calc__selector-name";
      name.textContent = item.name;
      var best      = document.createElement("span");
      best.className= "ampy-calc__selector-best";
      best.textContent = item.description || item.bestFor || "";
      text.appendChild(name); text.appendChild(best);

      btn.appendChild(img); btn.appendChild(text);

      if (item.badge) {
        var badge = document.createElement("span");
        badge.className = "ampy-calc__badge " +
          (item.available ? badgeTierClass(item.badge) : "ampy-calc__badge--muted");
        badge.textContent = item.badge;
        btn.appendChild(badge);
      }

      btn.addEventListener("click", function () {
        if (!item.available) return;
        onSelect(item.id);
        closeAllSelectors();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    var selected = items.find(function (i) { return i.id === selectedId; });
    if (selected) {
      $(p + "Name" + suffix).textContent = selected.name;
      $(p + "Best" + suffix).textContent = selected.description || selected.bestFor || "";
      $(p + "Img"  + suffix).innerHTML   = iconFn();
      var badgeEl = $(p + "Badge" + suffix);
      badgeEl.innerHTML = "";
      if (selected.badge) {
        badgeEl.innerHTML = '<span class="ampy-calc__badge ' +
          (selected.available ? badgeTierClass(selected.badge) : "ampy-calc__badge--muted") +
          '">' + selected.badge + "</span>";
      }
    }
  }

  function closeAllSelectors() {
    $("ampyEvCarSelectorA").setAttribute("aria-expanded", "false");
    $("ampyEvChargerSelectorA").setAttribute("aria-expanded", "false");
  }

  /* =====================================================================
     RENDER: RANGE SLIDER (km and %)
     ===================================================================== */
  function renderRangeSlider(opts) {
    /* opts: { containerId, displayId, steps, currentValue, formatter, unit, onChangeFn, labelId } */
    var container = $(opts.containerId);
    container.innerHTML = "";

    var steps   = opts.steps;
    var current = opts.currentValue;

    function indexFor(val) {
      var best = 0, bestDist = Math.abs(steps[0] - val);
      for (var i = 1; i < steps.length; i++) {
        var d = Math.abs(steps[i] - val);
        if (d < bestDist) { best = i; bestDist = d; }
      }
      return best;
    }

    var wrap  = document.createElement("div"); wrap.className = "ampy-calc__slider-wrap";
    var slider= document.createElement("div"); slider.className = "ampy-calc__slider";
    slider.setAttribute("role", "slider");
    slider.setAttribute("tabindex", "0");
    slider.setAttribute("aria-valuemin", String(steps[0]));
    slider.setAttribute("aria-valuemax", String(steps[steps.length - 1]));
    /* a11y: give the slider an accessible NAME via its visible field label.
       Without this the role=slider was an unnamed control. aria-valuetext
       (set in updateVisual) supplies the spoken value on every change. */
    if (opts.labelId) slider.setAttribute("aria-labelledby", opts.labelId);

    var track = document.createElement("div"); track.className = "ampy-calc__slider-track";
    var fill  = document.createElement("div"); fill.className  = "ampy-calc__slider-fill";
    var thumb = document.createElement("div"); thumb.className = "ampy-calc__slider-thumb";
    slider.appendChild(track); slider.appendChild(fill); slider.appendChild(thumb);

    var ticks = document.createElement("div"); ticks.className = "ampy-calc__slider-ticks";
    var lastIdx = steps.length - 1;
    /* Point 12: which steps print a LABEL. If opts.visibleTickValues is given
       (the km slider passes [5000,20000,35000,50000]), only those + the two
       endpoints render text; the rest become a small tick MARK so the scale
       still reads without label collision on a 344px phone. With no option
       (the % slider), every step is labelled. */
    var visible = opts.visibleTickValues || null;
    function tickShowsLabel(step, i) {
      if (!visible) return true;
      return i === 0 || i === lastIdx || visible.indexOf(step) !== -1;
    }
    steps.forEach(function (step, i) {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "ampy-calc__slider-tick";
      /* a11y/mobile: visible label uses the short tick formatter (e.g. "5k")
         so all labels stay legible ≤390px; the full value is kept as the
         accessible name + tooltip so meaning is never lost. */
      var shortLabel = (opts.tickFormatter ? opts.tickFormatter(step) : opts.formatter(step));
      var fullLabel  = opts.formatter(step) + (opts.unit ? " " + opts.unit : "");
      var showLabel  = tickShowsLabel(step, i);
      t.textContent = showLabel ? shortLabel : "";
      if (!showLabel) t.classList.add("ampy-calc__slider-tick--marker");
      t.setAttribute("data-step", String(step));
      t.setAttribute("aria-label", fullLabel);
      t.setAttribute("title", fullLabel);
      /* endpoints flagged for any endpoint-specific styling. */
      if (i === 0 || i === lastIdx) t.setAttribute("data-endpoint", "true");
      t.addEventListener("click", function () { setVal(step); });
      ticks.appendChild(t);
    });

    wrap.appendChild(slider); wrap.appendChild(ticks); container.appendChild(wrap);

    /* Geometry note: the thumb/fill anchor at left:1.2rem and the usable travel
       is (100% − 2.4rem). pct (0..1) is the fraction along that travel. */
    function pctToLeft(pct) { return "calc(1.2rem + (100% - 2.4rem) * " + pct + ")"; }
    function pctToFill(pct) { return "calc((100% - 2.4rem) * " + pct + ")"; }

    /* updateVisual = the SNAPPED/canonical paint. Used on boot, tick, keyboard
       and on drag-release. CSS transitions on .ampy-calc__slider-fill/-thumb stay
       live here, so these moves animate smoothly to the settled step. During a
       drag we DON'T call this (see the rAF path below) — .is-dragging kills those
       transitions and we track the raw pointer instead, then snap on release. */
    function updateVisual(val) {
      var idx = indexFor(val);
      var max = steps.length - 1;
      var pct = max === 0 ? 0 : idx / max;
      /* Snapped paint.
         FILL: width pinned at full travel; position via scaleX (transform-origin
         :left in styles.css) — the SAME mechanism the drag path uses, so release
         never flashes between a width-based and a transform-based fill.
         THUMB: positioned via `left` (slider-relative %, which translateX can't
         express) and re-centered with the resting translate(-50%,-50%); the drag
         transform is cleared. With .is-dragging removed, the `left`/`transform`
         transitions animate both home to the settled step. */
      fill.style.width      = pctToFill(1);
      fill.style.transform  = "translateY(-50%) scaleX(" + pct + ")";
      thumb.style.transform = "translate(-50%, -50%)";
      thumb.style.left      = pctToLeft(pct);
      slider.setAttribute("aria-valuenow",  String(val));
      slider.setAttribute("aria-valuetext", opts.formatter(val) + (opts.unit ? " " + opts.unit : ""));
      Array.from(ticks.children).forEach(function (tickEl, i) {
        tickEl.classList.toggle("ampy-calc__slider-tick--active", i === idx);
      });
      var dispEl = $(opts.displayId);
      if (dispEl) dispEl.textContent = opts.formatter(val);
    }
    updateVisual(current);

    function setVal(newVal) {
      current = newVal;
      updateVisual(current);
      opts.onChangeFn(current);
    }

    slider.addEventListener("keydown", function (e) {
      var idx = indexFor(current), target = idx;
      if      (e.key === "ArrowRight" || e.key === "ArrowUp")   target = Math.min(steps.length - 1, idx + 1);
      else if (e.key === "ArrowLeft"  || e.key === "ArrowDown") target = Math.max(0, idx - 1);
      else if (e.key === "Home") target = 0;
      else if (e.key === "End")  target = steps.length - 1;
      else return;
      e.preventDefault();
      setVal(steps[target]);
    });

    /* ── Drag (Spec E: smooth, lag-free on desktop AND touch) ────────────────
       Why the old version trailed: updateVisual() wrote left/width every
       pointermove, but those properties have a 300ms CSS transition, so each
       pixel restarted a 300ms animation → the thumb chased the pointer. Fix:
         1. .is-dragging kills the transitions on fill + thumb (see styles.css).
         2. pointermove only STORES the latest clientX; one rAF coalesces them
            so we paint at most once per frame (no per-event layout thrash).
         3. During the drag the thumb tracks the RAW pointer via transform
            (translateX off the snapped base), and the value snaps to the nearest
            step for the live readout/recalc. On release we remove .is-dragging
            and call updateVisual(current) so the transition animates the thumb
            home to its exact step. */
    var dragging   = false;
    var rafId      = null;
    var lastClientX = 0;

    /* Resolve the track travel in PIXELS. Point 11b: read the REAL thumb
       half-width instead of hard-coding 12/24px — the hard-code only held while
       the host kept html{font-size:62.5%}. If a WP/Bricks theme overrides root
       font-size, reading the computed thumb width keeps the thumb under the
       finger. The CSS calc() path (pctToLeft/pctToFill) is already px-agnostic. */
    function dragGeom(clientX) {
      var r = slider.getBoundingClientRect();
      var inset = parseFloat(getComputedStyle(thumb).width) / 2 || 12;
      var travel = r.width - inset * 2;
      if (travel <= 0) return { travel: 0, x: 0, frac: 0 };
      var x = Math.max(0, Math.min(travel, clientX - r.left - inset));
      return { travel: travel, x: x, frac: x / travel };
    }
    function nearestStepIndex(frac) {
      return Math.round(frac * (steps.length - 1));
    }

    /* Paint one drag frame. The thumb follows the RAW pointer, but we split its
       position so release is a single, glitch-free transition:
         - `left` is pinned to the NEAREST STEP (pctToLeft(snappedPct)).
         - a composited translateX carries only the sub-step RESIDUAL (rawX −
           snappedX), so the thumb sits exactly under the finger.
       On pointerup we just clear that transform → the small residual animates to
       0 over motion-fast while `left` (already at the step) doesn't move. No
       dual-timed left+transform race, no flash.
       The fill tracks the raw pointer via scaleX (composited, no width reflow).
       .is-dragging has killed the fill/thumb transitions, so every frame here is
       an instant, layout-free paint at ≤1×/frame. No updateVisual() in the loop. */
    function paintDrag() {
      rafId = null;
      if (!dragging) return;
      var g    = dragGeom(lastClientX);
      var max  = steps.length - 1;
      var idx  = nearestStepIndex(g.frac);
      var snapFrac = max === 0 ? 0 : idx / max;
      var residual = g.x - snapFrac * g.travel; /* px from the step to the finger */

      thumb.style.left      = pctToLeft(snapFrac);
      /* keep the grab-affordance scale while dragging (inline transform overrides
         the :active rule, so we re-add the 1.08 lift here) */
      thumb.style.transform = "translate(-50%, -50%) translateX(" + residual + "px) scale(1.08)";
      /* Fill: full-travel base width, scaled to the RAW pointer fraction so the
         fill edge tracks the finger continuously. transform-origin:left in CSS. */
      fill.style.width      = pctToFill(1);
      fill.style.transform  = "translateY(-50%) scaleX(" + g.frac + ")";

      /* Snap the underlying value (live readout + recalc) to the nearest step. */
      var s = steps[idx];
      Array.from(ticks.children).forEach(function (tickEl, i) {
        tickEl.classList.toggle("ampy-calc__slider-tick--active", i === idx);
      });
      if (s !== current) {
        current = s;
        slider.setAttribute("aria-valuenow",  String(s));
        slider.setAttribute("aria-valuetext", opts.formatter(s) + (opts.unit ? " " + opts.unit : ""));
        var dispEl = $(opts.displayId);
        if (dispEl) dispEl.textContent = opts.formatter(s);
        opts.onChangeFn(s);
      }
    }
    function queueDragFrame() {
      if (rafId == null) rafId = requestAnimationFrame(paintDrag);
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      _dragInstant = false;        /* re-enable count-ups for the settle render */
      slider.classList.remove("is-dragging");
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      /* Point 11d: detach the window-level fallback listeners. */
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup",   endDrag);
      window.removeEventListener("pointercancel", endDrag);
      /* Snap home with the smooth transition restored, and run ONE animated
         render (count-up) for the settled value. */
      updateVisual(current);
      opts.onChangeFn(current);
    }

    /* Point 11d: window-level move fallback so a fast drag that leaves the thumb
       still tracks (setPointerCapture is in a swallowing try/catch and can fail
       on some engines). */
    function onWindowMove(e) {
      if (!dragging) return;
      lastClientX = e.clientX;
      queueDragFrame();
    }

    slider.addEventListener("pointerdown", function (e) {
      /* ignore right/middle click */
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      _dragInstant = true;          /* suppress count-up while dragging (point 11c) */
      slider.classList.add("is-dragging");
      try { slider.setPointerCapture(e.pointerId); } catch (err) {}
      lastClientX = e.clientX;
      /* Point 11a: own the gesture — stop iOS text-selection / scroll hijack so
         the thumb tracks the finger 1:1 with no disambiguation delay. The
         listener is non-passive (below) so preventDefault is honoured. */
      e.preventDefault();
      window.addEventListener("pointermove", onWindowMove);
      window.addEventListener("pointerup",   endDrag);
      window.addEventListener("pointercancel", endDrag);
      queueDragFrame();
    }, { passive: false });
    slider.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      lastClientX = e.clientX;      /* store latest; rAF coalesces the paint */
      queueDragFrame();
    });
    slider.addEventListener("pointerup",     endDrag);
    slider.addEventListener("pointercancel", endDrag);
  }

  /* =====================================================================
     RENDER: REGION SEGMENTED CONTROL
     ===================================================================== */
  function renderRegion() {
    var wrap = $("ampyEvRegion");
    wrap.innerHTML = "";
    Object.keys(REGIONS).forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ampy-calc__segmented-option";
      btn.setAttribute("data-region", key);
      btn.setAttribute("aria-pressed", state.region === key ? "true" : "false");
      btn.textContent = key;
      btn.addEventListener("click", function () {
        state.region = key;
        renderRegion();
        renderAll();
      });
      wrap.appendChild(btn);
    });
  }

  /* =====================================================================
     RENDER: TOGGLES
     ===================================================================== */
  function wireToggle(groupId, onChangeFn) {
    var group = $(groupId);
    if (!group) return;
    Array.from(group.querySelectorAll(".ampy-calc__toggle-option")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        onChangeFn(btn.dataset.value);
        renderAll();
      });
    });
  }

  function updatePublicTypeToggle() {
    var group = $("ampyEvPublicType");
    if (!group) return;
    Array.from(group.children).forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.value === state.publicChargingType ? "true" : "false");
    });
  }

  /* =====================================================================
     RENDER: SAVINGS BREAKDOWN
     ===================================================================== */
  function renderSavingsBreakdown(r) {
    var el = $("ampyEvSavingsBreakdown");
    if (!el) return;

    if (r.unavailable || !isFinite(r.annualSaving)) { el.innerHTML = ""; return; }

    var pubLabel = r.pubType === "ac" ? "Offentlig AC-laddning" : "Offentlig DC-laddning";
    var regionName = (REGIONS[state.region] || {}).label || state.region;

    var row = function(label, rate, colorVar, bold) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.3rem 0;">' +
        '<span style="color:var(--on-surface-text-muted);font-size:var(--fs-xs);">' + label + '</span>' +
        '<span class="ampy-calc__t-mono" style="font-size:var(--fs-sm);font-weight:' + (bold ? "700" : "600") +
        ';color:' + colorVar + ';">' + fmtRate(rate) + ' kr/kWh</span>' +
        '</div>';
    };

    el.innerHTML =
      '<div style="background:var(--on-surface-subtle-bg);border-radius:var(--radius-md);padding:var(--spacing-sm) var(--spacing-md);">' +
        row(pubLabel, r.publicRate, "var(--state-warning)", false) +
        row("Hemmaladdning (" + regionName.split(" – ")[0] + ")", r.homeRate, "var(--state-success)", false) +
        '<div style="height:1px;background:var(--on-surface-border);margin:0.4rem 0;"></div>' +
        row("Du sparar per kWh", r.rateGap, "var(--state-success)", true) +
      '</div>';
  }

  /* =====================================================================
     RENDER: RESULT PANEL
     ===================================================================== */
  function renderSingleResult() {
    var r = calculateFor(state.evModelId, state.chargerId);

    /* The investment is always included now (ROI toggle removed); the "Att
       betala" tile is always visible. */

    if (r.unavailable) {
      $("ampyEvAnnualSaving").textContent = "—";
      $("ampyEvHeroAnnualSub").textContent = "Välj en elbil och en laddbox för att se din besparing.";
      $("ampyEvCumulativeValue").textContent = "—";
      $("ampyEvHero10Sub").textContent = "—";
      $("ampyEvNetPay").textContent = "—";
      $("ampyEvNetPaySub").textContent = "—";
      ["ampyEvMonthlyPublic","ampyEvMonthlyHome","ampyEvMonthlyHomeOpt","ampyEvMonthlySaving"].forEach(function(id){ var el = $(id); if (el) el.textContent = "—"; });
      $("ampyEvSavingsBreakdown").innerHTML = "";
      announceHeadline("Välj en elbil och en laddbox för att se din besparing.");
      return;
    }

    var horizon = r.horizon || 10;

    /* HERO — annual saving is the dominant figure (flat-rate, conservative). */
    animateNumber("evAnnualSaving", r.annualSaving, fmtKr, "ampyEvAnnualSaving");
    /* P1-1 honest framing: the saving assumes today's public charging moves home.
       At 100 % say "all", otherwise name the share, so the big number stays honest
       (the default is 100 %, which maximises the headline). pct 0 → no saving. */
    var pubPct = Math.round((r.publicPct != null ? r.publicPct : 0) * 100);
    var heroSub;
    if (pubPct <= 0)        heroSub = "Dra upp andelen publik laddning så ser du vad du kan spara.";
    else if (pubPct >= 100) heroSub = "om du flyttar all din publika laddning hem";
    else                    heroSub = "om du flyttar " + pubPct + " % av din publika laddning hem";
    $("ampyEvHeroAnnualSub").textContent = heroSub;

    /* SECONDARY 10-year figure — always the net series (investment counted).
       For offert-only boxes there is no net series; fall back to pure savings so
       the tile never shows NaN. */
    var tenYear = !r.offert ? r.cumulativeNetN : r.cumulativeSavingsN;
    animateNumber("evCumulative", tenYear, fmtKr, "ampyEvCumulativeValue");
    if (!r.offert) {
      $("ampyEvCumulativeLabel").textContent = "Sparar på " + horizon + " år";
      $("ampyEvHero10Sub").textContent = "laddboxen betald, Grön Teknik inräknad";
    } else {
      $("ampyEvCumulativeLabel").textContent = "Besparing på " + horizon + " år";
      $("ampyEvHero10Sub").textContent = "Din besparing på laddningen – oavsett vad laddboxen kostar.";
    }

    /* "Att betala" tile. Offert-only boxes have no price → "Begär offert".
       D2: priced boxes show ONE clean net price line — the gross − Grön Teknik
       breakdown is gone (the methodology explains the 48,5% statutory deduction). */
    if (r.offert) {
      /* No count-up for a non-numeric value; clear the stored prev so a later
         switch back to a priced box animates from its real value, not a string. */
      delete previousValues.evNetPay;
      $("ampyEvNetPay").textContent = "Begär offert";
      $("ampyEvNetPaySub").textContent = "Pris tas fram i offert för din anläggning.";
    } else {
      animateNumber("evNetPay", r.netCost, fmtKr, "ampyEvNetPay");
      $("ampyEvNetPaySub").textContent = "Pris inkl. installation, Grön Teknik & moms";
    }

    renderSavingsBreakdown(r);
    renderMonthlyComparison(r);

    var productLink = $("ampyEvProductLink");
    var hasRealSlug = r.charger.slug && r.charger.slug !== "#";
    productLink.style.display = hasRealSlug ? "" : "none";
    productLink.setAttribute("href", hasRealSlug ? r.charger.slug : "#");
    $("ampyEvProductLinkName").textContent = r.charger.name;

    /* a11y: announce ONLY the headline annual saving, debounced. */
    announceHeadline("Du sparar ungefär " + fmtKr(r.annualSaving) + " kronor per år.");
  }

  /* =====================================================================
     RENDER: MONTHLY COST COMPARISON  (publik vs hemma vs hemma-schemalagd, kr/mån)
     Replaces the payback chart. THREE on-brand bars whose widths are proportional
     to the monthly cost, plus a "Du sparar ≈ X kr/mån" delta. The numbers count
     up. The first two reconcile to the annual hero (× 12); the third
     ("Hemma, schemalagd", owner decision D1) is an additive, visually-subordinate
     bar showing the optimised-rate cost — it does NOT change the headline saving.
     Renders for offert-only boxes too (segment-agnostic — no box price needed).
     ===================================================================== */
  function renderMonthlyComparison(r) {
    var block = $("ampyEvMonthly");
    if (!block) return;

    /* Empty / no-saving state: clear the numbers and the bars. publicKwh can be 0
       (0 % public charging) → all costs 0, saving 0; still a valid, honest view. */
    if (!r || r.unavailable || !isFinite(r.monthlySaving)) {
      ["ampyEvMonthlyPublic","ampyEvMonthlyHome","ampyEvMonthlyHomeOpt","ampyEvMonthlySaving"].forEach(function(id){
        var el = $(id); if (el) el.textContent = "—";
      });
      block.style.setProperty("--monthly-public-frac",  "0");
      block.style.setProperty("--monthly-home-frac",    "0");
      block.style.setProperty("--monthly-homeopt-frac", "0");
      return;
    }

    var pub     = r.monthlyPublicCost;
    var home    = r.monthlyHomeCost;
    var homeOpt = r.monthlyHomeOptCost;

    /* Bar widths ∝ cost, scaled so the largest bar (public, since publicRate >
       homeRate > homeRateOpt) fills the track. Guard the divide-by-zero at 0 %
       public. The optimised bar shares the same maxCost so the staircase reads
       public > home > schemalagd. */
    var maxCost     = Math.max(pub, home, homeOpt, 0);
    var pubFrac     = maxCost > 0 ? pub     / maxCost : 0;
    var homeFrac    = maxCost > 0 ? home    / maxCost : 0;
    var homeOptFrac = maxCost > 0 ? homeOpt / maxCost : 0;
    block.style.setProperty("--monthly-public-frac",  String(pubFrac));
    block.style.setProperty("--monthly-home-frac",    String(homeFrac));
    block.style.setProperty("--monthly-homeopt-frac", String(homeOptFrac));

    animateNumber("evMonthlyPublic",  pub,             fmtKr, "ampyEvMonthlyPublic");
    animateNumber("evMonthlyHome",    home,            fmtKr, "ampyEvMonthlyHome");
    animateNumber("evMonthlyHomeOpt", homeOpt,         fmtKr, "ampyEvMonthlyHomeOpt");
    animateNumber("evMonthlySaving",  r.monthlySaving, fmtKr, "ampyEvMonthlySaving");
  }

  /* =====================================================================
     RENDER: METHODOLOGY
     ===================================================================== */
  function populateMethodology() {
    var host = $("ampyEvMethodologyStack");
    if (!host) return;
    var gronPct   = (RATES.gronTeknikRate * 100).toFixed(1).replace(".", ",");
    var cap1      = RATES.gronTeknikCapPerApplicant.toLocaleString("sv-SE");
    var uncertPct = Math.round(RATES.uncertaintyBand * 100);
    var items = [
      { h: "1. Så mycket energi din bil drar",
        c: "körsträcka ÷ 10 × förbrukning per 10 km ÷ " + (RATES.chargerEfficiencyPct * 100).toFixed(0) + " % laddningseffektivitet",
        p: "Vi utgår från bilens WLTP-förbrukning och din körsträcka. Cirka 10 % försvinner som förlust i laddkabel och box, så vi räknar med det." },
      { h: "2. Vad publik laddning kostar dig",
        c: "offentlig andel × energi × publik taxa (AC " + fmtRate(RATES.publicAcRateSekPerKwh) + " kr/kWh · DC " + fmtRate(RATES.publicDcRateSekPerKwh) + " kr/kWh)",
        p: "Typiska svenska priser 2025 för publik AC- respektive DC-laddning. Du väljer själv vilken typ du oftast använder." },
      { h: "3. Vad samma laddning kostar hemma",
        c: "offentlig andel × energi × hemtaxa (1,45–2,10 kr/kWh, SE1–SE4)",
        p: "Din totala hemma-kostnad per kWh — spotpris, nätavgift och skatt — i snitt för ditt elprisområde." },
      { h: "4. Grön Teknik-avdraget",
        c: gronPct + " % av priset, max " + cap1 + " kr/sökande/år (upp till " + RATES.maxApplicants + " sökande)",
        p: "Avdraget är 50 % av arbete och material. Med Skatteverkets schablon på 97 % blir det cirka " + gronPct + " % av totalpriset, vilket vi drar av direkt. Kräver att du äger bostaden, har skatt att dra mot, att installatören har F-skatt och att laddpunkten har uttag enligt EN 62196-2/-3." },
      { h: "5. Varför vi visar ett spann",
        c: "± " + uncertPct + " % på den årliga besparingen",
        p: "Elpriser och körvanor svänger. Spannet visar en realistisk lägsta- och högstanivå — din verkliga besparing landar troligen däremellan." },
      { h: "6. Schemalagd laddning",
        c: "hemtaxa × ca 20–30 % lägre (varierar SE1–SE4)",
        p: "En modern laddbox flyttar laddningen automatiskt till de billigaste timmarna. Vi räknar med en sänkning på cirka 20–30 % av hemmakostnaden — inte hela spotskillnaden (30–60 %), eftersom den inte gäller alla timmar eller alla elavtal." },
    ];
    host.innerHTML = items.map(function (it) {
      return '<div class="ampy-calc__methodology-item"><h3>' + it.h + "</h3><code>" + it.c + "</code><p>" + it.p + "</p></div>";
    }).join("");
  }

  /* =====================================================================
     MAIN RENDER
     ===================================================================== */
  /* Set true once init finishes, so renderAll() during boot does NOT emit an
     input_change (the boot render is covered by calc_view instead). */
  var _initDone = false;

  function renderAll() {
    updatePublicTypeToggle();
    renderSingleResult();
    /* Funnel: every user-driven recalculation is an input_change. Guarded so
       the initial boot render is excluded. */
    if (_initDone) emitEvent("input_change");
  }

  /* =====================================================================
     EVENT HANDLERS
     ===================================================================== */
  function onSelectCar(id) {
    state.evModelId = id;
    renderSelector({ suffix:"A", items:EV_MODELS, selectedId:state.evModelId, idPrefix:"ampyEvCar", iconFn:carIconSvg, onSelect:onSelectCar });
    renderAll();
  }

  function onSelectCharger(id) {
    state.chargerId = id;
    renderSelector({ suffix:"A", items:CHARGERS, selectedId:state.chargerId, idPrefix:"ampyEvCharger", iconFn:chargerIconSvg, onSelect:onSelectCharger });
    renderAll();
  }

  /* =====================================================================
     TOOLTIP POPOVERS (point 13)
     Replaces the pure-CSS ::after data-tip slab. One reusable popover element
     per "i" (built from its data-tip), positioned in viewport coords so it can
     never clip a container edge. Desktop: open on hover/focus, close on
     leave/blur/Escape. Touch/all: toggle on click, close on outside-tap,
     Escape, scroll, or re-tap. One open at a time.
     ===================================================================== */
  var _tips = [];                 /* { btn, pop } pairs */
  var _openTip = null;            /* the currently-open pop element, or null */

  function positionPopover(btn, pop) {
    /* Make it measurable without flashing: render hidden-but-laid-out. */
    pop.style.visibility = "hidden";
    pop.setAttribute("data-open", "");
    pop.style.left = "0px"; pop.style.top = "0px";
    var GUTTER = 12;
    var b  = btn.getBoundingClientRect();
    var pr = pop.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;

    /* Horizontal: centre on the "i", then clamp into a 12px viewport gutter. */
    var cx   = b.left + b.width / 2;
    var left = cx - pr.width / 2;
    left = Math.max(GUTTER, Math.min(left, vw - pr.width - GUTTER));

    /* Vertical: prefer ABOVE; flip BELOW if it would clip the top. */
    var placement = "top";
    var top = b.top - pr.height - 10;
    if (top < GUTTER) { placement = "bottom"; top = b.bottom + 10; }
    /* if below would clip the bottom and above has more room, go back above */
    if (placement === "bottom" && top + pr.height > vh - GUTTER && (b.top - pr.height - 10) > GUTTER) {
      placement = "top"; top = b.top - pr.height - 10;
    }

    pop.style.left = Math.round(left) + "px";
    pop.style.top  = Math.round(top) + "px";
    pop.setAttribute("data-placement", placement);
    /* Caret tracks the "i" horizontally, clamped within the bubble. */
    var caretX = cx - left;
    caretX = Math.max(12, Math.min(caretX, pr.width - 12));
    pop.style.setProperty("--caret-x", Math.round(caretX) + "px");
    pop.style.visibility = "";
  }

  function openTip(btn, pop) {
    closeAllTips();
    closeAllSelectors();          /* one-open-at-a-time across the whole UI */
    positionPopover(btn, pop);
    pop.setAttribute("data-open", "");
    btn.setAttribute("aria-expanded", "true");
    _openTip = pop;
  }

  function closeTip(btn, pop) {
    pop.removeAttribute("data-open");
    btn.setAttribute("aria-expanded", "false");
    if (_openTip === pop) _openTip = null;
  }

  function closeAllTips() {
    _tips.forEach(function (t) { closeTip(t.btn, t.pop); });
  }

  function setupTooltips() {
    /* Append to <body>, NOT .ampy-calc-outer: that wrapper has
       container-type:inline-size, which establishes layout containment and would
       make a position:fixed child position relative to the WRAPPER instead of the
       viewport — breaking the getBoundingClientRect() math. On <body> the popover
       is truly viewport-positioned. The CSS is scoped under .ampy-calc__popover
       (a plain class), so it still styles correctly outside .ampy-calc. */
    var host = document.body;
    var tipButtons = document.querySelectorAll(".ampy-calc__tip");
    var n = 0;
    tipButtons.forEach(function (btn) {
      var text = btn.getAttribute("data-tip");
      if (!text) return;
      n++;
      var id = "ampyEvTip" + n;
      var pop = document.createElement("div");
      pop.className = "ampy-calc__popover";
      pop.id = id;
      pop.setAttribute("role", "tooltip");
      pop.textContent = text;
      host.appendChild(pop);

      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", id);
      /* a11y: the tip text is associated with its control for SR users without
         polluting the field's accessible NAME (which uses aria-labelledby). */
      btn.setAttribute("aria-describedby", id);
      /* data-tip no longer drives any CSS; keep it as the content source. */

      _tips.push({ btn: btn, pop: pop });

      var isOpen = function () { return pop.hasAttribute("data-open"); };
      /* Track the pointer type of the gesture that's about to focus the button,
         so a TOUCH tap (which fires focus→click) doesn't auto-open via focus and
         then immediately close via the click toggle. Mouse/keyboard still get
         the hover/focus-to-open nicety. */
      var lastPointerWasTouch = false;
      btn.addEventListener("pointerdown", function (e) {
        lastPointerWasTouch = (e.pointerType === "touch" || e.pointerType === "pen");
      });

      /* Toggle on click (the canonical action — works for touch AND mouse). */
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (isOpen()) closeTip(btn, pop); else openTip(btn, pop);
      });
      /* Desktop niceties: hover opens; mouse-leave closes. */
      btn.addEventListener("mouseenter", function () { if (!lastPointerWasTouch) openTip(btn, pop); });
      btn.addEventListener("mouseleave", function () { if (!lastPointerWasTouch) closeTip(btn, pop); });
      /* Keyboard focus (Tab) opens for SR/keyboard users; a touch-induced focus
         is suppressed (the tap's click handles it). blur closes. */
      btn.addEventListener("focus", function () { if (!lastPointerWasTouch) openTip(btn, pop); });
      btn.addEventListener("blur",  function () { lastPointerWasTouch = false; closeTip(btn, pop); });
    });

    /* Outside-click / Escape / scroll close (mirrors the selector discipline). */
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".ampy-calc__tip, .ampy-calc__popover")) closeAllTips();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && _openTip) closeAllTips();
    });
    /* A detached popover floating after a scroll looks broken — close on scroll. */
    window.addEventListener("scroll", function () { if (_openTip) closeAllTips(); }, true);
    window.addEventListener("resize", function () { if (_openTip) closeAllTips(); });
  }

  function bindUI() {
    /* Car selector button */
    $("ampyEvCarButtonA").addEventListener("click", function () {
      var sel  = $("ampyEvCarSelectorA");
      var open = sel.getAttribute("aria-expanded") === "true";
      closeAllSelectors();
      sel.setAttribute("aria-expanded", open ? "false" : "true");
    });

    /* Charger selector button */
    $("ampyEvChargerButtonA").addEventListener("click", function () {
      var sel  = $("ampyEvChargerSelectorA");
      var open = sel.getAttribute("aria-expanded") === "true";
      closeAllSelectors();
      sel.setAttribute("aria-expanded", open ? "false" : "true");
    });

    /* Close on outside click or Escape */
    document.addEventListener("click",   function (e) { if (!e.target.closest(".ampy-calc__selector")) closeAllSelectors(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllSelectors(); });

    /* Public type toggle */
    wireToggle("ampyEvPublicType", function (v) { state.publicChargingType = v; });

    /* Tooltip popovers (point 13) — tap-dismissible, edge-aware, one open. */
    setupTooltips();

    /* Lead form open */
    $("ampyEvCtaQuote").addEventListener("click", function () {
      var form = $("ampyEvLeadForm");
      var wasOpen = form.classList.contains("is-open");
      if (!wasOpen) form.classList.add("is-open");
      /* GDPR/anti-bot: stamp the moment the form is first revealed so the
         server can reject implausibly fast (bot) submits. Only set once. */
      if (_formOpenedAt == null) _formOpenedAt = Date.now();
      emitEvent("cta_quote_click", { formAlreadyOpen: wasOpen });
      $("ampyEvLeadName").focus();
      /* 3-5: land the form near the top so the Namn field is fully visible
         (block:"nearest" could leave it half-off on mobile). */
      form.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });

    $("ampyEvLeadForm").addEventListener("submit",  function (e) { e.preventDefault(); submitLeadForm(); });
  }

  /* =====================================================================
     LEAD SUBMISSION
     ===================================================================== */
  function buildPayload(type, extras) {
    var r = calculateFor(state.evModelId, state.chargerId);
    /* Round helper that preserves null (offert-only boxes have no price/payback —
       do NOT fabricate a 0). */
    var rnd = function (v) { return (v == null || !isFinite(v)) ? null : Math.round(v); };
    var result = (!r || r.unavailable) ? null : {
      evModelId:    r.evModel.id,
      evModelName:  r.evModel.name,
      chargerId:    r.charger.id,
      chargerName:  r.charger.name,
      offertOnly:   !!r.offert,
      grossPrice:   rnd(r.grossPrice),
      gronTeknik:   rnd(r.gronTeknik),
      netCost:      rnd(r.netCost),
      annualSaving:       rnd(r.annualSaving),
      paybackYears:       r.paybackYears,
      cumulative10:       rnd(r.cumulativeNetN),
      cumulativeSavings10:rnd(r.cumulativeSavingsN)
    };
    /* Anti-bot signals for server-side rejection:
       - honeypot: must be empty; non-empty ⇒ bot.
       - formOpenedAt / elapsedMs: server rejects sub-2s (formOpenedAt is null
         until the lead form is first opened). */
    var hp = $("ampyEvLeadCompany");
    var now = Date.now();
    var antibot = {
      honeypot:     hp ? hp.value : "",
      formOpenedAt: _formOpenedAt ? new Date(_formOpenedAt).toISOString() : null,
      submittedAt:  new Date(now).toISOString(),
      elapsedMs:    _formOpenedAt ? (now - _formOpenedAt) : null
    };

    return Object.assign({
      type:      type,
      timestamp: new Date().toISOString(),
      inputs: {
        region:             state.region,
        annualKm:           state.annualKm,
        publicChargingPct:  state.publicChargingPct,
        publicChargingType: state.publicChargingType,
        numTaxApplicants:   state.numTaxApplicants
      },
      results: { ev: result },
      /* Telemetry — UTM / referrer / landing path. Degrades to nulls when
         absent (captured once at load in META). */
      meta: Object.assign({}, META),
      /* Anti-bot timing + honeypot signals for the server. */
      antibot: antibot
    }, extras || {});
  }

  function wpLeadFetch(payload) {
    var d = window.AmpyEvCalcData;
    return fetch(d.restUrl + "/lead/" + d.postId, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "X-WP-Nonce": d.nonce },
      body:    JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function submitLeadForm() {
    var ok     = true;
    var fields = [
      { id: "ampyEvLeadName",  err: "ampyEvLeadNameError",  test: function (v) { return v.trim().length >= 2; },               msg: "Ange ditt namn (minst 2 tecken)." },
      { id: "ampyEvLeadEmail", err: "ampyEvLeadEmailError", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: "Ange en giltig e-postadress." },
      { id: "ampyEvLeadPhone", err: "ampyEvLeadPhoneError", test: function (v) { return /^[0-9 +\-()]{7,}$/.test(v.trim()); },  msg: "Ange ett giltigt telefonnummer." },
      { id: "ampyEvLeadZip",   err: "ampyEvLeadZipError",   test: function (v) { return /^\d{3}\s?\d{2}$/.test(v.trim()); },    msg: "Ange ett postnummer (5 siffror)." }
    ];
    /* a11y: wire each error span as a live alert and link it to its input via
       aria-describedby; set aria-invalid; track the first invalid field so we
       can move focus there. */
    var firstInvalid = null;
    fields.forEach(function (f) {
      var input = $(f.id), errEl = $(f.err);
      errEl.setAttribute("role", "alert");
      if (!f.test(input.value)) {
        input.classList.add("ampy-calc__input--error");
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", f.err);
        errEl.textContent = f.msg;
        ok = false;
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.classList.remove("ampy-calc__input--error");
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
        errEl.textContent = "";
      }
    });
    /* GDPR: required consent checkbox — validated separately from the fields
       above and from the submit action. Blocks submit (client) when unticked
       and shows an inline, alert-role error. */
    var consentEl  = $("ampyEvLeadConsent");
    var consentErr = $("ampyEvLeadConsentError");
    if (consentErr) consentErr.setAttribute("role", "alert");
    if (!consentEl || !consentEl.checked) {
      ok = false;
      if (consentEl) {
        consentEl.classList.add("ampy-calc__input--error");
        consentEl.setAttribute("aria-invalid", "true");
      }
      if (consentErr) consentErr.textContent =
        "Du måste godkänna behandlingen av dina uppgifter för att vi ska kunna kontakta dig.";
      if (!firstInvalid) firstInvalid = consentEl;
    } else {
      consentEl.classList.remove("ampy-calc__input--error");
      consentEl.removeAttribute("aria-invalid");
      if (consentErr) consentErr.textContent = "";
    }

    if (!ok) {
      /* move focus to the first invalid field so SR/keyboard users land on the error */
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var btn = $("ampyEvLeadSubmit"), label = $("ampyEvLeadSubmitLabel");
    btn.disabled = true;
    label.innerHTML = '<span class="ampy-calc__btn-spinner" aria-hidden="true"></span> Skickar…';
    $("ampyEvLeadErrorBox").classList.remove("is-visible");

    var payload = buildPayload("quote_request", { contact: {
      name:  $("ampyEvLeadName").value.trim(),
      email: $("ampyEvLeadEmail").value.trim(),
      phone: $("ampyEvLeadPhone").value.trim(),
      zip:   $("ampyEvLeadZip").value.trim(),
      /* GDPR: record WHAT was agreed to, the version string, and WHEN. */
      consent: {
        given:     true,
        version:   CONSENT_VERSION,
        text:      CONSENT_TEXT,
        timestamp: new Date().toISOString()
      }
    }});

    emitEvent("lead_submit", { leadType: "quote_request" });

    Promise.resolve(window.AmpyEvCalculator.submitLead(payload))
      .then(function ()  {
        emitEvent("lead_success", { leadType: "quote_request" });
        /* a11y: clear all error state on success so stale aria-invalid /
           aria-describedby never linger on the fields. */
        fields.forEach(function (f) {
          var input = $(f.id), errEl = $(f.err);
          input.classList.remove("ampy-calc__input--error");
          input.removeAttribute("aria-invalid");
          input.removeAttribute("aria-describedby");
          errEl.textContent = "";
        });
        /* clear consent error state too so nothing lingers after success */
        if (consentEl) { consentEl.classList.remove("ampy-calc__input--error"); consentEl.removeAttribute("aria-invalid"); }
        if (consentErr) consentErr.textContent = "";
        $("ampyEvLeadForm").classList.remove("is-open");
        $("ampyEvLeadSuccess").classList.add("is-visible");
      })
      .catch(function () { $("ampyEvLeadErrorBox").classList.add("is-visible"); })
      .finally(function () { btn.disabled = false; label.textContent = "Skicka offertförfrågan"; });
  }

  /* =====================================================================
     INIT
     ===================================================================== */
  function init(opts) {
    opts = opts || {};

    if (!EV_MODELS.length || !CHARGERS.length) {
      var el = $("ampyEvCalc");
      if (el) el.innerHTML = '<div style="padding:2rem;font-family:sans-serif;color:#666;">Laddbox-kalkylator: ladda upp Excel-filen i inställningarna för det här lead magnet-inlägget.</div>';
      return;
    }

    /* Default car */
    var requestedCarId = opts.defaultCarId
      || (root && root.getAttribute("data-default-car-id"))
      || null;
    var defaultCar = requestedCarId
      ? EV_MODELS.find(function (m) { return m.id === requestedCarId && m.available; })
      : null;
    if (!defaultCar) defaultCar = EV_MODELS.find(function (m) { return m.available; });
    if (!defaultCar) return;
    state.evModelId = defaultCar.id;

    /* Default charger */
    var requestedChargerId = opts.defaultChargerId
      || (root && root.getAttribute("data-default-charger-id"))
      || null;
    var defaultCharger = requestedChargerId
      ? CHARGERS.find(function (c) { return c.id === requestedChargerId && c.available; })
      : null;
    if (!defaultCharger) defaultCharger = CHARGERS.find(function (c) { return c.available; });
    if (!defaultCharger) return;
    state.chargerId = defaultCharger.id;

    /* Sync state from Advanced defaults */
    state.region             = DEFAULT_REGION;
    state.annualKm           = ADVANCED_DEFAULTS.annualKm;
    state.publicChargingPct  = ADVANCED_DEFAULTS.publicChargingPct;
    state.publicChargingType = ADVANCED_DEFAULTS.publicChargingType || "dc";

    /* Snap km to nearest step */
    var kmIdx = 0, kmDist = Math.abs(KM_STEPS[0] - state.annualKm);
    KM_STEPS.forEach(function (s, i) {
      var d = Math.abs(s - state.annualKm);
      if (d < kmDist) { kmIdx = i; kmDist = d; }
    });
    state.annualKm = KM_STEPS[kmIdx];

    /* Snap % to nearest step */
    var pctIdx = 0, pctDist = Math.abs(PCT_STEPS[0] - state.publicChargingPct);
    PCT_STEPS.forEach(function (s, i) {
      var d = Math.abs(s - state.publicChargingPct);
      if (d < pctDist) { pctIdx = i; pctDist = d; }
    });
    state.publicChargingPct = PCT_STEPS[pctIdx];

    /* Render selectors */
    renderSelector({ suffix:"A", items:EV_MODELS, selectedId:state.evModelId, idPrefix:"ampyEvCar",     iconFn:carIconSvg,     onSelect:onSelectCar });
    renderSelector({ suffix:"A", items:CHARGERS,  selectedId:state.chargerId, idPrefix:"ampyEvCharger", iconFn:chargerIconSvg, onSelect:onSelectCharger });

    /* Render sliders */
    renderRangeSlider({
      containerId: "ampyEvKmContainer",
      displayId:   "ampyEvKmValue",
      steps:       KM_STEPS,
      currentValue:state.annualKm,
      formatter:   fmtKm,
      tickFormatter: fmtKmShort,   /* abbreviate "5 000"→"5k" so ticks stay legible ≤390px */
      /* Point 12: label a clean evenly-spaced subset of the ACTUAL 8 steps
         (5/10/15/20/25/30/40/50k) → 5k·20k·30k·50k (idx 0/3/5/7, evenly
         distributed). The other 4 stops render as tick marks. All 8 stay
         draggable/snappable/keyboard-reachable. */
      visibleTickValues: [5000, 20000, 30000, 50000],
      unit:        "km/år",
      labelId:     "ampyEvKmLabel",
      onChangeFn:  function (v) { state.annualKm = v; renderAll(); }
    });
    renderRangeSlider({
      containerId: "ampyEvPctContainer",
      displayId:   "ampyEvPctValue",
      steps:       PCT_STEPS,
      currentValue:state.publicChargingPct,
      formatter:   fmtPct,
      unit:        "%",
      labelId:     "ampyEvPctLabel",
      onChangeFn:  function (v) { state.publicChargingPct = v; renderAll(); }
    });

    /* Render region + methodology + event bindings + first calc */
    renderRegion();
    populateMethodology();
    bindUI();
    renderAll();

    /* Funnel: calculator is now interactive. Emitted after the boot render so
       it is the first event; input_change fires only on subsequent changes. */
    _initDone = true;
    emitEvent("calc_view");
  }

  /* =====================================================================
     PUBLIC API
     ===================================================================== */
  window.AmpyEvCalculator = {
    init:       init,
    submitLead: wpLeadFetch
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.AmpyEvCalculator.init(); });
  } else {
    window.AmpyEvCalculator.init();
  }

})();
