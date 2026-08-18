# Plan a Lawn

**A personal lawn operations planner for homeowners across the US.**

Live at [planalawn.com](https://planalawn.com).

Plan a Lawn helps you answer the questions that actually matter when you’re working on grass:

- **What should I do next** for my lawn, given the season and soil temperature?
- **How much product** do I put down (seed, fert, peat, topsoil, herbicide)?
- **How much SpeedZone goes in my tank**, and **what setting does my Scotts spreader need** for this bag?
- **Which seed blend makes sense for my area**, based on real NTEP trial data—not just bag marketing?

No account. No backend required. Your lawn profile, location, and custom blends stay in **your browser**.

---

## The goal

Most lawn advice is either:

1. Generic calendar tips that ignore where you live, or
2. Seed marketing that declares a “best” cultivar without showing regional trial context.

We want something in between: a **practical ops tool** you open before a weekend project, grounded in:

| Pillar | What it means |
|--------|----------------|
| **Local timing** | Soil temp + seasonal windows beat “seed in September” folklore |
| **Actionable rates** | Sq ft → pounds, depth → yards, label rate → tank mix |
| **Honest seed intel** | Blends map to cultivars; cultivars map to NTEP; NTEP maps to *your* climate |
| **Private by default** | Vuex + `localStorage`; export JSON if you switch devices |

The point is **not** to crown a single winning seed. The point is to help you understand **fit, tradeoffs, and next steps**.

---

## Product gameplan

### 1. Home
A clear front door. On a desktop the hero owns exactly one screen and centres in it, so the whole
product is visible before any scrolling: the wordmark and pitch, a live calendar panel (the year as a
tick per month with a dot per job, plus whatever is open today), seed intel as a one-line side note,
and a rail into every section. A **View more** cue at the bottom fades in and nods downward — press
it or scroll for the rest of the page. Month ticks deep-link into the calendar (`/calendar?month=9`).

Before a location is set the hero asks for one in the same slot the buttons live in, so the screen
never grows: the location banner that other pages carry is suppressed here.

Motion is used to show the page working, not to decorate it. On load the wordmark takes a single
light sweep, the stat figures tick up from zero, the month strip fills in left to right and the
current month blooms once the scan reaches it, and the open jobs land one beat apart. Further down,
blocks fade and rise as they arrive and the seed score bars hold at zero until their card is on
screen, so the bars draw where they can be seen. Everything above is dropped under
`prefers-reduced-motion`, landing straight on the final state.

### 2. Calendar / next actions
Combine:

- Seasonal windows (e.g. fall overseed, spring secondary windows)
- Live **6 cm soil temperature** from Open-Meteo for your coordinates
- Task gates (too hot / too cold / in band)

Buckets: **Do now · Coming up · Later**.

### 3. Tasks + calculators
Each job (kill, aerate, seed, topsoil, peat, mulch, fertilize, water) has:

- Why / when / steps / materials
- Rate or mix calculator tied to your lawn size

The library at `/tasks` groups them by the kind of work — **seed & renovate, weeds, feed, pests, beds
& trees** — and the group headings double as filters. Search reaches names, summaries, and materials,
so the jug in the garage ("quinclorac") finds the job. Each card carries its own icon, the month
range it usually happens in, the tool it goes down with, its soil gate, and a **Do now / Coming up**
chip from live soil temperature. Groups, icons, and those labels live in `src/tasks/task-ui.ts`.

### 3b. Calculate (`/calculate`)
Named products, not just product classes. Pick the bottle or bag you actually bought and get:

- Liquids: the dose for **your** tank, what that works out to per gallon (or litre), and how many tanks
- Granulars: pounds for the lawn, bags to buy, and the **published spreader setting** for your model
- A units switch (`fl oz / gal` or `ml / L`) in the toolbar and in Settings → Equipment. Labels are
  stored as printed and converted for display only, so the arithmetic has one source; areas stay in
  square feet and bags in pounds, because that's how both are sold
- A calibration helper (catch-and-weigh) when the bag prints no setting for your spreader — settings
  are never converted between models or invented
- Products for whatever task is **due now** sorted to the top
- A warning when the label doesn't cover the grass you told us you have (Celsius on fescue kills the
  lawn), and a distinct "not this spreader" answer where the label forbids hand-helds outright

Catalog rules in `src/data/products.ts`:

| Case | How it's stored |
| --- | --- |
| Reformulated product | One entry per analysis (Turf Builder 32-0-4 and 38-0-4 both exist — the dials moved) |
| Dry concentrate (WDG, DF) | `measure: 'oz wt'` — weighed on a scale, so the UI stops saying fl oz |
| Rate varies by species or region | Stored at a stated default with the full label range and the split in `grassNote` |
| Setting only on a retailer's site | Not stored — calibrate instead |
| Label prohibits a spreader | `notLabeledFor`, which suppresses the calibration offer too |
| Tank mix needs surfactant or oil | `adjuvant`, shown as its own line |

### 4. Seeds (the research workspace)
Three linked datasets:

```text
Commercial blend  →  cultivar list (%)  →  NTEP trial metrics  →  area suitability score
```

- **Curated blends** with published cultivars that map to NTEP (no marketing-only bags)
- **User blends** you add from a bag label (saved in-browser)
- **Cultivar browser** over ingested NTEP JSON
- **Weighted suitability** for your location:
  - nearest NTEP site quality
  - climate-band / regional quality
  - summer stress (drought + brown patch)
  - genetic color
  - national / LPI signal

Multi-species support is in the schema (tall fescue loaded first; KY bluegrass, perennial rye, fine fescue, bermuda ready for ingest).

### 5. My lawn (settings)
Location (GPS or ZIP), lawn size, equipment defaults, import/export backup.

---

## Design principles

1. **Soil temperature > calendar date** for seeding decisions.
2. **Small NTEP differences are small** — don’t fake dramatic winners.
3. **Management beats genetics** when gaps are tiny.
4. **Missing trial data ≠ bad cultivar** (e.g. a blend component not in a given NTEP cycle).
5. **Labels win** — calculators are templates; always follow the bag you bought.
6. **No invented numbers** — a spreader setting we can't source from the label is a setting we don't
   show. Dials aren't convertible between models, so the honest alternative is a calibration strip.
7. **Static-first** — ship as a client-side app; grow data via ingest scripts, not a server.
8. **Money never moves the ranking** — buy links pay the bills, so they are kept structurally
   incapable of influencing advice. Listings live in `src/data/commerce/`, which the modules that
   decide what to show and in what order may not import; `offers.test.ts` asserts that boundary
   rather than trusting it. Every earning link is marked, and the disclosure is wired to the same
   partner tag the links read, so it cannot claim a relationship that isn't live.

---

## Current status

| Area | Status |
|------|--------|
| Routing, calendar, tasks, product rates | In place |
| Vuex + localStorage (profile, location, user blends) | In place |
| US location (geolocation or ZIP) + local soil temp | In place |
| NTEP PDF → JSON ingest (Python) | In place |
| Tall fescue 2018–2023 high-value tables | Loaded (132 cultivars, all metrics) |
| Blend ↔ cultivar crosswalk + area fit scoring | In place |
| Other species full NTEP extracts | Schema ready / next ingest |
| Deeper ZIP→climate refinement | Rough lat bands today; improve later |

---

## Stack

- **Vue 3** (Options API) + **Vue Router** + **Vuex**
- **Vite** + **SCSS** + **D3**
- **Open-Meteo** (forecast / soil temp) + ZIP lookup
- **Python + PyMuPDF** for NTEP PDF ingest (`scripts/ntep/`)

---

## Develop

```bash
npm install
npm run dev    # http://localhost:5050
npm run build
```

### GitHub Pages

`npm run build` writes the static site to `docs/` (GitHub Pages **Deploy from a branch → `/docs`**).

1. In the repo: **Settings → Pages → Source → Deploy from a branch**
2. Branch `master`, folder `/docs`
3. Custom domain is `planalawn.com` (`public/CNAME`, copied into `docs/`). Point DNS at GitHub Pages, then add the same domain under **Settings → Pages**.

Commit the `docs/` output after you build so Pages can serve it. The build also copies `index.html` to `404.html` so Vue Router history URLs work.

### NTEP ingest

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/ntep/requirements.txt

# Place an NTEP progress/final PDF in scripts/ntep/cache/
# Example: tf18_24-8.pdf (2018 National Tall Fescue Test, 2023 data)

npm run ntep:ingest
```

Parsed JSON lands in `src/data/ntep/`. We intentionally extract **high-value homeowner metrics** (regional turf quality, color, brown patch, drought)—not every ancillary table.

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — conditions, next actions, navigation |
| `/calendar` | Do now / soon / later from season + soil temp |
| `/tasks` · `/tasks/:id` | Job library, rates, mixes |
| `/seeds` | Blends, cultivars, compare, NTEP coverage |
| `/calculate` | Named products → tank ounces, pounds, spreader settings (`/how-much` and `/tools/sprayer` redirect here) |
| `/settings` | Location, profile, JSON backup |

---

## Key data files

| Path | Role |
|------|------|
| `src/data/ntep/` | Cultivars, sites, species catalog from ingest |
| `src/data/blends/curated.json` | Starter commercial blends |
| `src/data/tasks.js` | Job catalog |
| `src/data/timingRules.js` | Months + soil gates |
| `src/data/rates.ts` | Generic rate / mix templates by product class |
| `src/data/products.ts` | Named products with label rates + published spreader settings |
| `src/data/spreaders.ts` | Spreader models the setting tables name |
| `src/services/units.ts` | US ↔ metric display conversion for doses, tanks and water |
| `src/data/climate.js` | Climate bands for suitability |
| `src/store/` | Persisted user state |

Browser storage key: `grass.store.v1`.

---

## Roadmap (next)

- Ingest additional NTEP species/cycles the same way as tall fescue
- Expand curated blend library + better cultivar name matching
- Richer US climate mapping (beyond simple latitude bands)
- Optional: keep growing D3 views for cultivar/blend comparison

---

## Who this is for

Homeowners (and friends helping each other) who want a **repeatable system** for lawn work—especially in demanding climates like the transition zone—without pretending trial averages replace soil, water, mowing, and summer luck.
