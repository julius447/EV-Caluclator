
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
    SE1: { label: "SE1 – Norra Sverige",       homeRateSekPerKwh: 1.45 },
    SE2: { label: "SE2 – Norra Mellansverige", homeRateSekPerKwh: 1.50 },
    SE3: { label: "SE3 – Södra Mellansverige", homeRateSekPerKwh: 1.90 },
    SE4: { label: "SE4 – Södra Sverige",       homeRateSekPerKwh: 2.10 }
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
  var state = {
    evModelId:        null,
    chargerId:        null,
    region:           DEFAULT_REGION,
    numTaxApplicants: 1,
    annualKm:         ADVANCED_DEFAULTS.annualKm,
    publicChargingPct:ADVANCED_DEFAULTS.publicChargingPct,
    publicChargingType: ADVANCED_DEFAULTS.publicChargingType,
    /* ROI toggle (spec 2): true = "med investering" (subtract charger cost,
       show payback); false = "utan investering" (pure laddning-saving). */
    includeInvestment: true
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

    /* Annual saving — independent of the box price, so it is valid for
       offert-only boxes too. */
    var annualSaving = publicKwh * rateGap;

    /* Monthly cost comparison — what the public-charged kWh cost publicly vs at
       home, per month. Segment-agnostic (valid for offert-only boxes too).
       Reconciles to the annual hero exactly: (public − home) × 12 === annualSaving. */
    var monthlyPublicCost = publicKwh * publicRate / 12;
    var monthlyHomeCost   = publicKwh * homeRate   / 12;
    var monthlySaving     = monthlyPublicCost - monthlyHomeCost;

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
      monthlyPublicCost:   monthlyPublicCost,
      monthlyHomeCost:     monthlyHomeCost,
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
  var previousValues = {};
  function animateNumber(key, targetValue, formatter, elementId) {
    var el = $(elementId);
    if (!el) return;
    var hasPrev = Object.prototype.hasOwnProperty.call(previousValues, key);
    var from    = hasPrev ? previousValues[key] : targetValue;
    previousValues[key] = targetValue;
    el.textContent = formatter(targetValue);
    if (!hasPrev || prefersReducedMotion || !isFinite(targetValue) ||
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
        badge.className = "ampy-calc__badge" + (item.available ? "" : " ampy-calc__badge--muted");
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
        badgeEl.innerHTML = '<span class="ampy-calc__badge' +
          (selected.available ? "" : " ampy-calc__badge--muted") + '">' + selected.badge + "</span>";
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
    steps.forEach(function (step, i) {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "ampy-calc__slider-tick";
      /* a11y/mobile: visible label uses the short tick formatter (e.g. "5k")
         so all labels stay legible ≤390px; the full value is kept as the
         accessible name + tooltip so meaning is never lost. */
      var shortLabel = (opts.tickFormatter ? opts.tickFormatter(step) : opts.formatter(step));
      var fullLabel  = opts.formatter(step) + (opts.unit ? " " + opts.unit : "");
      t.textContent = shortLabel;
      t.setAttribute("data-step", String(step));
      t.setAttribute("aria-label", fullLabel);
      t.setAttribute("title", fullLabel);
      /* endpoints stay visible on narrow screens even when interior labels are
         collapsed to "active only" (see styles.css narrow-container rule). */
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

    /* Resolve the track travel in PIXELS (= rect.width − 2.4rem). 1.2rem each
       side; root font-size is 62.5% so 1.2rem = 12px, 2.4rem = 24px. */
    function dragGeom(clientX) {
      var r = slider.getBoundingClientRect();
      var travel = r.width - 24;
      if (travel <= 0) return { travel: 0, x: 0, frac: 0 };
      var x = Math.max(0, Math.min(travel, clientX - r.left - 12));
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
      slider.classList.remove("is-dragging");
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      /* Snap home with the smooth transition restored. */
      updateVisual(current);
    }

    slider.addEventListener("pointerdown", function (e) {
      dragging = true;
      slider.classList.add("is-dragging");
      try { slider.setPointerCapture(e.pointerId); } catch (err) {}
      lastClientX = e.clientX;
      queueDragFrame();
    });
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

  /* ROI investment toggle (two-pill segmented control) — sync aria-pressed on
     both pills from state.includeInvestment ("with" pressed when investment is
     counted). */
  function updateInvestmentToggle() {
    var group = $("ampyEvInvestmentToggle");
    if (!group) return;
    var on = state.includeInvestment;
    Array.from(group.querySelectorAll(".ampy-calc__toggle-option")).forEach(function (btn) {
      var isWith = btn.dataset.value === "with";
      btn.setAttribute("aria-pressed", (isWith === on) ? "true" : "false");
    });
  }

  /* =====================================================================
     RENDER: APPLICANTS STEPPER
     ===================================================================== */
  function renderApplicants() {
    $("ampyEvApplicantsValue").textContent = String(state.numTaxApplicants);
    $("ampyEvApplicantsDec").disabled = state.numTaxApplicants <= 1;
    $("ampyEvApplicantsInc").disabled = state.numTaxApplicants >= RATES.maxApplicants;
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
      '</div>' +
      '<p style="color:var(--on-surface-text-muted);font-size:var(--fs-xs);margin-top:var(--spacing-xs);">' +
        fmtKm(Math.round(r.publicKwh)) + NBSP + 'kWh offentlig laddning per år × ' +
        fmtRate(r.rateGap) + ' kr/kWh = ' +
        fmtKr(r.annualSaving) + ' kr/år' +
      '</p>';
  }

  /* =====================================================================
     RENDER: RESULT PANEL
     ===================================================================== */
  function renderSingleResult() {
    var r = calculateFor(state.evModelId, state.chargerId);
    var withInvest = state.includeInvestment;

    /* Investment-only tile ("Att betala") is hidden when the toggle is OFF */
    var netPayTile  = $("ampyEvNetPayTile");
    if (netPayTile)  netPayTile.style.display  = withInvest ? "" : "none";

    if (r.unavailable) {
      $("ampyEvAnnualSaving").textContent = "—";
      $("ampyEvAnnualRange").textContent = "—";
      $("ampyEvHeroAnnualSub").textContent = "Välj en elbil och en laddbox för att se din besparing.";
      $("ampyEvCumulativeValue").textContent = "—";
      $("ampyEvHero10Sub").textContent = "—";
      $("ampyEvNetPay").textContent = "—";
      $("ampyEvNetPaySub").textContent = "—";
      ["ampyEvMonthlyPublic","ampyEvMonthlyHome","ampyEvMonthlySaving"].forEach(function(id){ $(id).textContent = "—"; });
      $("ampyEvSavingsBreakdown").innerHTML = "";
      announceHeadline("Välj en elbil och en laddbox för att se din besparing.");
      return;
    }

    var horizon = r.horizon || 10;

    /* HERO — annual saving is the dominant figure in BOTH toggle states */
    animateNumber("evAnnualSaving", r.annualSaving, fmtKr, "ampyEvAnnualSaving");
    $("ampyEvAnnualRange").textContent = "Spann " + fmtKr(r.savingLow) + "–" + fmtKr(r.savingHigh) + " kr/år";
    /* P1-1 honest framing: the saving assumes today's public charging moves home.
       At 100 % say "all", otherwise name the share, so the big number stays honest
       (the default is 100 %, which maximises the headline). pct 0 → no saving. */
    var pubPct = Math.round((r.publicPct != null ? r.publicPct : 0) * 100);
    var heroSub;
    if (pubPct <= 0)        heroSub = "Höj andelen offentlig laddning för att se din besparing.";
    else if (pubPct >= 100) heroSub = "om du flyttar all din publika laddning hem";
    else                    heroSub = "om du flyttar " + pubPct + " % av din publika laddning hem";
    $("ampyEvHeroAnnualSub").textContent = heroSub;

    /* SECONDARY 10-year figure — series depends on the toggle.
       For offert-only boxes there is no net series; fall back to pure savings so
       the tile never shows NaN. */
    var tenYear = (withInvest && !r.offert) ? r.cumulativeNetN : r.cumulativeSavingsN;
    animateNumber("evCumulative", tenYear, fmtKr, "ampyEvCumulativeValue");
    if (withInvest && !r.offert) {
      $("ampyEvCumulativeLabel").textContent = "Sparar på " + horizon + " år";
      $("ampyEvHero10Sub").textContent = "laddboxen betald, Grön Teknik inräknad";
    } else {
      $("ampyEvCumulativeLabel").textContent = "Besparing på " + horizon + " år";
      $("ampyEvHero10Sub").textContent = "Din besparing på laddningen – oavsett vad laddboxen kostar.";
    }

    /* Investment-only tile. Offert-only boxes have no price → "Begär offert"
       for "Att betala", and no gross/Grön-Teknik sub line. */
    if (r.offert) {
      /* No count-up for a non-numeric value; clear the stored prev so a later
         switch back to a priced box animates from its real value, not a string. */
      delete previousValues.evNetPay;
      $("ampyEvNetPay").textContent = "Begär offert";
      $("ampyEvNetPaySub").textContent = "Pris tas fram i offert för din anläggning.";
    } else {
      animateNumber("evNetPay", r.netCost, fmtKr, "ampyEvNetPay");
      $("ampyEvNetPaySub").textContent = "Pris inkl. installation & moms " + fmtKr(r.grossPrice) + " kr − Grön Teknik " + fmtKr(r.gronTeknik) + " kr";
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
     RENDER: MONTHLY COST COMPARISON  (publik vs hemma, kr/mån)
     Replaces the payback chart. Two on-brand bars whose widths are proportional
     to the monthly cost, plus a "Du sparar ≈ X kr/mån" delta. The three numbers
     count up. Reconciles to the annual hero (× 12). Renders for offert-only
     boxes too (segment-agnostic — no box price needed). The "Att betala"/payback
     framing lives elsewhere; this panel is purely the laddning cost.
     ===================================================================== */
  function renderMonthlyComparison(r) {
    var block = $("ampyEvMonthly");
    if (!block) return;

    /* Empty / no-saving state: clear the numbers and the bars. publicKwh can be 0
       (0 % public charging) → both costs 0, saving 0; still a valid, honest view. */
    if (!r || r.unavailable || !isFinite(r.monthlySaving)) {
      ["ampyEvMonthlyPublic","ampyEvMonthlyHome","ampyEvMonthlySaving"].forEach(function(id){
        var el = $(id); if (el) el.textContent = "—";
      });
      block.style.setProperty("--monthly-public-frac", "0");
      block.style.setProperty("--monthly-home-frac",   "0");
      return;
    }

    var pub  = r.monthlyPublicCost;
    var home = r.monthlyHomeCost;

    /* Bar widths ∝ cost, scaled so the larger bar (public, since publicRate >
       homeRate) fills the track. Guard the divide-by-zero at 0 % public. */
    var maxCost   = Math.max(pub, home, 0);
    var pubFrac   = maxCost > 0 ? pub  / maxCost : 0;
    var homeFrac  = maxCost > 0 ? home / maxCost : 0;
    block.style.setProperty("--monthly-public-frac", String(pubFrac));
    block.style.setProperty("--monthly-home-frac",   String(homeFrac));

    animateNumber("evMonthlyPublic",  pub,             fmtKr, "ampyEvMonthlyPublic");
    animateNumber("evMonthlyHome",    home,            fmtKr, "ampyEvMonthlyHome");
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
      { h: "1. Energiåtgång",
        c: "(körsträcka ÷ 10) × kWh per 10 km ÷ " + (RATES.chargerEfficiencyPct * 100).toFixed(0) + "% laddningseffektivitet",
        p: "Bilens WLTP-förbrukning multipliceras med din körsträcka. 10% förlust i laddkedjan ingår." },
      { h: "2. Offentlig laddkostnad",
        c: "offentlig andel × energi × offentlig taxa (AC " + fmtRate(RATES.publicAcRateSekPerKwh) + " kr/kWh · DC " + fmtRate(RATES.publicDcRateSekPerKwh) + " kr/kWh)",
        p: "Typpriser 2025 för AC- respektive DC-laddning i Sverige." },
      { h: "3. Hemmaladdningskostnad",
        c: "offentlig andel × energi × hemtaxa (varierar SE1–SE4)",
        p: "Genomsnittlig total el-kostnad hemma inklusive spotpris, nätavgift och skatt per område." },
      { h: "4. Grön Teknik-avdraget",
        c: gronPct + "% av totalpriset, max " + cap1 + " kr/sökande/år (upp till " + RATES.maxApplicants + " sökande)",
        p: "50% av arbete + material × Skatteverkets 97% schablon ≈ " + gronPct + "% av totalpriset; kalkylen drar " + gronPct + "%. Kräver att du äger bostaden, har tillräcklig skatt att dra av mot, att installatören har F-skatt, och att laddpunkten har uttag enligt EN 62196-2/-3." },
      { h: "5. Osäkerhetsspann",
        c: "± " + uncertPct + "% på den årliga besparingen",
        p: "Elpriser och körvanor varierar. Spannet visar realistisk under- och övergräns." },
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
    updateInvestmentToggle();
    renderApplicants();
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

    /* ROI investment toggle — two-pill segmented control (native <button>s,
       keyboard-operable). data-value "with"/"without" → includeInvestment. */
    wireToggle("ampyEvInvestmentToggle", function (v) { state.includeInvestment = (v === "with"); });

    /* Applicants stepper */
    $("ampyEvApplicantsDec").addEventListener("click", function () {
      if (state.numTaxApplicants > 1) { state.numTaxApplicants--; renderAll(); }
    });
    $("ampyEvApplicantsInc").addEventListener("click", function () {
      if (state.numTaxApplicants < RATES.maxApplicants) { state.numTaxApplicants++; renderAll(); }
    });

    /* Tooltip focus-click */
    document.querySelectorAll(".ampy-calc__tip").forEach(function (tip) {
      tip.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); tip.focus(); });
    });

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
      form.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
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
      cumulativeSavings10:rnd(r.cumulativeSavingsN),
      includeInvestment:  state.includeInvestment
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
