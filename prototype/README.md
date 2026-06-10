# Ampy Laddbox-kalkylator — standalone prototype

A runnable, WordPress-free version of Ampy's EV charging savings calculator
(laddbox-kalkylator). It is the exact frontend bundle — the same engine, markup,
and CSS that ship inside the WordPress lead magnet — wired to a local placeholder
dataset instead of WordPress post meta.

## Run it

The calculator uses CSS container queries and ES modules-free vanilla JS, so you
just need any static file server. From inside this `prototype/` directory:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

(Opening `index.html` directly via `file://` also mostly works, but a local
server is recommended so font loading and relative paths behave normally.)

## Files

| File         | What it is                                                                 |
|--------------|----------------------------------------------------------------------------|
| `index.html` | Page shell + the calculator markup (extracted verbatim from the PHP render function). |
| `styles.css` | Verbatim copy of the production stylesheet.                                |
| `engine.js`  | Verbatim copy of the production JS engine (IIFE, auto-inits on load).      |
| `data.js`    | Sets `window.AmpyEvCalcData` with placeholder data in the engine's shape.  |

`index.html` loads `data.js` in `<head>` (before the engine), then `engine.js`
at the end of `<body>`. The engine reads `window.AmpyEvCalcData`, renders into
`#ampyEvCalc`, and auto-initializes on `DOMContentLoaded`.

The required `<style>html{font-size:62.5%}</style>` is in `<head>`: the entire
CSS rem scale assumes `1rem = 10px`. Without it everything renders ~1.6x too
large.

## What is placeholder data

Everything in `data.js` is illustrative and **not** the research-signed figures.
In particular:

- **Charger names and prices** (`CHARGERS`) — the listed boxes (Amina S, Easee
  Charge, Zaptec Go, Garo Entity) and their `priceSek` values are placeholders.
- **EV efficiencies** (`EV_MODELS[].efficiencyKwhPer10km`) — the kWh-per-10km
  figures per model are placeholders.

Regions, public/home rates, Grön Teknik rules, and the horizon in `RATES` /
`REGIONS` / `ADVANCED_DEFAULTS` are also illustrative defaults. In production,
all of this is imported from the signed Excel file into WordPress post meta.

## Lead submission is mocked

There is no backend here. The inline script at the bottom of `index.html`
overrides `window.AmpyEvCalculator.submitLead` (which normally POSTs to the
WordPress REST endpoint) with a local mock that logs the payload to the browser
console and resolves successfully:

```js
window.AmpyEvCalculator.submitLead = function (p) {
  console.log('MOCK submitLead', p);
  return Promise.resolve({ success: true });
};
```

So both the "Skicka offertförfrågan" lead form and the "Maila kalkylen" email
form will show their success state, but nothing is actually sent. Open the
browser console to inspect the payload that would have been delivered.
