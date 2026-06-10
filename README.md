# Ampy Laddbox-kalkylator (EV Charging Savings Calculator)

A Swedish lead-generation calculator that shows an EV owner how much they save by
charging **at home** instead of **publicly**, and converts them into a laddbox quote
request.

## Live site

The runnable calculator is in **`prototype/`** — a standalone static build (no
WordPress required). Point the web root at `prototype/`, or use the repo-root
`index.html`, which redirects there.

```
prototype/index.html   ← the calculator
```

## Structure

| Path | What |
|---|---|
| `prototype/` | Standalone static calculator (the deployable site): `index.html`, `engine.js`, `data.js`, `styles.css` |
| `_decoded/` | WordPress / FluentSnippets deployment source: `01_backend.php` (REST + Excel parser + render + metabox), `00_js-engine.js`, `02_styles.css` |
| `excel/` | Data file + `build_xlsx.py` importer + `verify_faithful.py` (a faithful Python mirror of the WP parser, used as a data oracle) |
| `research/` | Sourced data dossier, Grön Teknik verification (Skatteverket), the round-2 product catalogue |
| `PRODUCTION-PLAN.md` | Production-readiness plan (P0/P1/P2, owner decisions, launch checklist) |
| `MASTER-SPEC.md` | Round-2 implementation spec (full catalogue, monthly comparison, toggle redesign, …) |

## Calculation (engine)

```
besparing/år   = publik kWh × (publik taxa − hemma taxa)
publik kWh     = (km/10 × kWh-per-10km ÷ 0,90 laddförluster) × andel offentlig
Att betala     = laddboxpris (inkl. installation & moms) − Grön Teknik (48,5 %)
```

A ROI toggle switches the result between *med investering* (payback + net cost) and
*utan investering* (pure charging saving). The annual saving is the dominant hero
number in both states.

## Status

MVP → production hardening. Engine verified (oracle PASS, 0 console errors, WCAG AA
fixes, GDPR consent + anti-spam mechanics, telemetry). **Pending owner input** before
go-live: real catalogue price sign-off, privacy-policy URL, n8n webhook, and the
`lead-magnet` custom post type registration.
