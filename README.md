# Lawn Plan Nerd

**A personal lawn operations planner for homeowners across the US.**

Live at [lawnplannerd.com](https://lawnplannerd.com).

Lawn Plan Nerd helps you answer the questions that actually matter when you’re working on grass:

- **What should I do next** for my lawn, given the season and soil temperature?
- **How much product** do I put down (seed, fert, peat, topsoil, herbicide)?
- **How do I mix the sprayer** for my tank size and yard?
- **Which seed blend makes sense for my area**, based on real NTEP trial data—not just bag marketing?

No account. No backend required. Your lawn profile, location, task log, and custom blends stay in **your browser**.

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
A clear front door: live conditions (when location is set), “do now” actions, and paths into calendar, tasks, seeds, and settings.

### 2. Calendar / next actions
Combine:

- Seasonal windows (e.g. fall overseed, spring secondary windows)
- Live **6 cm soil temperature** from Open-Meteo for your coordinates
- Task gates (too hot / too cold / in band)

Buckets: **Do now · Coming up · Later**.

### 3. Tasks + calculators
Each job (kill, aerate, seed, topsoil, peat, mulch, fertilize, water) has:

- Why / when / steps / materials
- Rate or sprayer calculator tied to your lawn size
- A personal log (checklists, notes, done dates) saved locally

### 4. Seeds (the research workspace)
Three linked datasets:

```text
Commercial blend  →  cultivar list (%)  →  NTEP trial metrics  →  area suitability score
```

- **Curated blends** (starting with Calypsow and Resilience II)
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
Location (GPS or ZIP), lawn size, equipment defaults, project timeline, import/export backup.

---

## Design principles

1. **Soil temperature > calendar date** for seeding decisions.
2. **Small NTEP differences are small** — don’t fake dramatic winners.
3. **Management beats genetics** when gaps are tiny.
4. **Missing trial data ≠ bad cultivar** (e.g. a blend component not in a given NTEP cycle).
5. **Labels win** — calculators are templates; always follow the bag you bought.
6. **Static-first** — ship as a client-side app; grow data via ingest scripts, not a server.

---

## Current status

| Area | Status |
|------|--------|
| Routing, calendar, tasks, sprayer | In place |
| Vuex + localStorage (profile, location, logs, user blends) | In place |
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
3. Custom domain is `lawnplannerd.com` (`public/CNAME`, copied into `docs/`). Point DNS at GitHub Pages, then add the same domain under **Settings → Pages**.

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
| `/tasks` · `/tasks/:id` | Job library, rates, sprayer, personal log |
| `/seeds` | Blends, cultivars, compare, NTEP coverage |
| `/tools/sprayer` | Standalone tank mix calculator |
| `/settings` | Location, profile, timeline, JSON backup |

---

## Key data files

| Path | Role |
|------|------|
| `src/data/ntep/` | Cultivars, sites, species catalog from ingest |
| `src/data/blends/curated.json` | Starter commercial blends |
| `src/data/tasks.js` | Job catalog |
| `src/data/timingRules.js` | Months + soil gates |
| `src/data/rates.js` | Rate / mix templates |
| `src/data/climate.js` | Climate bands for suitability |
| `src/store/` | Persisted user state |

Browser storage key: `grass.store.v1`.

---

## Roadmap (next)

- Ingest additional NTEP species/cycles the same way as tall fescue
- Expand curated blend library + better cultivar name matching
- Richer US climate mapping (beyond simple latitude bands)
- Tighter calendar ↔ project timeline (renovation sequences)
- Optional: keep growing D3 views for cultivar/blend comparison

---

## Who this is for

Homeowners (and friends helping each other) who want a **repeatable system** for lawn work—especially in demanding climates like the transition zone—without pretending trial averages replace soil, water, mowing, and summer luck.
