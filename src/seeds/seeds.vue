<script lang="ts">
import {
  allCultivars,
  buildCultivarIndex,
  ntepMeta,
  searchCultivars,
  siteCodesForMetric,
  speciesList,
} from '../data/seedDb'
import {
  scoreBlendForLocation,
  scoreCultivarForLocation,
  nearestNtepSites,
  coverageLabel,
  fitRank,
} from '../services/suitability'
import type {
  Blend,
  BlendComponentFit,
  BlendFit,
  Coverage,
  Cultivar,
  CultivarFit,
  NearbySite,
  ScoreFactor,
  UserLocation,
} from '../types'

const QUALITY_SITES = siteCodesForMetric('transitionQuality')

const FACTOR_LABELS: Record<ScoreFactor, string> = {
  nearest: 'nearest trial site',
  region: 'regional quality',
  summerStress: 'drought / brown patch',
  color: 'genetic color',
  national: 'national mean',
}

interface DraftComponent {
  name: string
  percent: number | null
}

export default {
  name: 'Seeds',
  data() {
    return {
      tab: 'blends',
      tabs: [
        { id: 'blends', label: 'Blends' },
        { id: 'cultivars', label: 'Cultivars' },
        { id: 'compare', label: 'Compare' },
        { id: 'data', label: 'NTEP data' },
      ],
      blendQuery: '',
      cultQuery: '',
      sortKey: 'fit',
      selectedBlendId: 'calypsow',
      showBlendForm: false,
      compareIds: ['calypsow', 'resilience-ii', ''] as string[],
      draft: {
        name: '',
        manufacturer: '',
        components: [
          { name: '', percent: null },
          { name: '', percent: null },
        ] as DraftComponent[],
      },
      cultivarIndex: buildCultivarIndex(),
      ntepMeta,
      speciesList,
      fitCache: {} as Record<string, BlendFit>,
    }
  },
  computed: {
    allBlends(): Blend[] {
      return this.$store.getters.allBlends
    },
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    blends(): Blend[] {
      return this.allBlends
    },
    cultivarCount(): number {
      return allCultivars.length
    },
    nearestSite(): NearbySite | null {
      if (!this.userLocation) return null
      return (
        nearestNtepSites(
          this.userLocation.latitude,
          this.userLocation.longitude,
          1,
          QUALITY_SITES,
        )[0] || null
      )
    },
    nearestSiteHeader(): string {
      return this.nearestSite ? `Nearest — ${this.nearestSite.name}` : 'Knoxville, TN (default)'
    },
    filteredBlends(): Blend[] {
      const q = this.blendQuery.trim().toLowerCase()
      if (!q) return this.blends
      return this.blends.filter((b) => `${b.name} ${b.manufacturer}`.toLowerCase().includes(q))
    },
    selectedBlend(): Blend | null {
      return this.blends.find((b) => b.id === this.selectedBlendId) || null
    },
    selectedFit(): BlendFit | null {
      return this.selectedBlend ? this.fitFor(this.selectedBlend) : null
    },
    selectedComponents(): BlendComponentFit[] {
      if (this.selectedFit) return this.selectedFit.components
      return (this.selectedBlend?.components || []).map((c) => ({
        ...c,
        cultivar: null,
        fit: null,
      }))
    },
    cultivarRows(): (Cultivar & { fit: CultivarFit | null })[] {
      const list = searchCultivars(this.cultQuery, allCultivars)
      const withFit = list.map((c) => ({
        ...c,
        fit: this.userLocation ? scoreCultivarForLocation(c, this.userLocation) : null,
      }))
      withFit.sort((a, b) => {
        if (this.sortKey === 'name') return a.name.localeCompare(b.name)
        if (this.sortKey === 'fit') {
          const diff = fitRank(b.fit) - fitRank(a.fit)
          return diff !== 0 ? diff : (b.fit?.score || 0) - (a.fit?.score || 0)
        }
        if (this.sortKey === 'transition') {
          return (b.metrics?.transitionQuality?.mean || 0) - (a.metrics?.transitionQuality?.mean || 0)
        }
        if (this.sortKey === 'drought') {
          return (b.metrics?.droughtQuality?.mean || 0) - (a.metrics?.droughtQuality?.mean || 0)
        }
        if (this.sortKey === 'brownPatch') {
          return (b.metrics?.brownPatch?.mean || 0) - (a.metrics?.brownPatch?.mean || 0)
        }
        return 0
      })
      return withFit.slice(0, 80)
    },
    compareBlends(): Blend[] {
      return this.compareIds.map((id) => this.blends.find((b) => b.id === id)).filter((b): b is Blend => Boolean(b))
    },
  },
  methods: {
    fitFor(blend: Blend | null): BlendFit | null {
      if (!blend) return null
      const key = `${blend.id}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.fitCache[key]) {
        this.fitCache[key] = scoreBlendForLocation(blend, this.cultivarIndex, this.userLocation)
      }
      return this.fitCache[key]
    },
    fitClass(score: number | null | undefined): string {
      if (score == null) return 'unk'
      if (score >= 6.6) return 'great'
      if (score >= 6.2) return 'good'
      if (score >= 5.8) return 'ok'
      return 'low'
    },
    coverageLabel,
    coverageTitle(coverage: Coverage | null | undefined): string {
      if (!coverage) return ''
      if (coverage.complete) return 'Scored on all five factors.'
      const missing = coverage.missing.map((k) => FACTOR_LABELS[k] || k).join(', ')
      return `Scored on ${coverageLabel(coverage)}. No trial data for: ${missing}.`
    },
    selectBlend(id: string) {
      this.selectedBlendId = id
    },
    fmt(v: number | null | undefined): string {
      return typeof v === 'number' ? v.toFixed(1) : '—'
    },
    nearestMetric(cultivar: Cultivar): number | null | undefined {
      const near = this.nearestSite
      if (!near) return cultivar.metrics?.knoxvilleQuality?.mean
      const siteVal = cultivar.metrics?.transitionQuality?.bySite?.[near.code]
      return siteVal ?? cultivar.metrics?.knoxvilleQuality?.mean
    },
    saveDraft() {
      const components = this.draft.components
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          cultivarId: c.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          percent: c.percent || null,
        }))
      if (!this.draft.name || !components.length) return
      this.$store.dispatch('upsertUserBlend', {
        name: this.draft.name,
        manufacturer: this.draft.manufacturer || 'Custom',
        species: 'tall_fescue',
        summary: 'User-entered blend',
        components,
      })
      this.showBlendForm = false
      this.draft = {
        name: '',
        manufacturer: '',
        components: [
          { name: '', percent: null },
          { name: '', percent: null },
        ],
      }
      this.fitCache = {}
    },
    removeBlend(id: string) {
      this.$store.dispatch('deleteUserBlend', id)
      if (this.selectedBlendId === id) this.selectedBlendId = 'calypsow'
      this.fitCache = {}
    },
  },
}
</script>

<style lang="scss">
.seeds {
  .seeds-hero {
    padding: clamp(2rem, 5vw, 3rem) 0 0.5rem;

    h1 {
      margin: 0 0 0.65rem;
      max-width: 18ch;
      font-size: clamp(1.7rem, 3.8vw, 2.5rem);
    }

    .lede {
      margin: 0 0 0.65rem;
      max-width: 44rem;
      color: var(--color-text-muted);
    }

    .meta {
      margin: 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  }

  .seeds__inner {
    padding-block: 1.25rem 3.5rem;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .tab {
    min-height: var(--input-height);
    padding: 0.4rem 0.95rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &.active {
      color: var(--color-white);
      background: var(--color-primary);
      border-color: var(--color-primary);
    }
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-bottom: 1rem;

    input,
    select {
      flex: 1 1 12rem;
      min-width: 12rem;
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  .card {
    margin-bottom: 1rem;
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .blend-card {
    padding: 1rem 1.1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);
    cursor: pointer;

    &.selected {
      border-color: var(--color-primary);
      box-shadow: var(--shadow), inset 0 0 0 1px var(--color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .blend-card__top {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    h3 {
      margin: 0 0 0.2rem;
      font-size: 1.15rem;
    }

    .mfr,
    p {
      margin: 0 0 0.35rem;
      font-size: 0.88rem;
      color: var(--color-text-muted);
    }

    .comps {
      font-size: 0.8rem !important;
    }
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;
  }

  .fit {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;

    em {
      font-style: normal;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }

    &.great,
    &.good {
      color: var(--color-success);
      background: var(--color-success-bg);
    }

    &.ok {
      color: var(--color-warning);
      background: var(--color-warning-bg);
    }
  }

  .fit-box {
    display: grid;
    gap: 0.35rem;
    margin: 0.85rem 0 1rem;
    padding: 0.85rem 1rem;
    background: var(--color-surface-alt);
    border-radius: calc(var(--border-radius) * 1.5);

    ul {
      margin: 0.25rem 0 0;
      padding-left: 1.1rem;
    }

    .warn {
      color: var(--color-warning);
    }
  }

  .comp-line {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--color-border);

    .missing {
      font-style: italic;
      color: var(--color-text-muted);
    }
  }

  .fit-mini {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .fit-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .fit-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;

    &.great,
    &.good {
      color: var(--color-success);
      background: var(--color-success-bg);
    }
  }

  .coverage {
    font-size: 0.7rem;
    font-style: normal;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    white-space: nowrap;
    cursor: help;

    &--partial {
      font-weight: 600;
      color: var(--color-warning);
    }
  }

  .muted {
    color: var(--color-text-muted);
  }

  .form-grid {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 0.85rem;

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input {
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }

    .full {
      grid-column: 1 / -1;
    }
  }

  .comp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .linkish {
    color: var(--color-text-muted);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
  }

  .compare-picks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    select {
      min-width: 12rem;
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  .compare-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }

    ul {
      margin: 0.5rem 0 0;
      padding-left: 1.1rem;
      font-size: 0.88rem;
    }

    .warn {
      color: var(--color-warning);
    }
  }

  code {
    font-size: 0.8rem;
  }
}
</style>

<template>
  <div class="seeds">
    <header class="seeds-hero">
          <div class="seeds-hero__inner container">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-seedling" />
          Seed intel
        </p>
        <h1>Pick seed on evidence.</h1>
        <p class="lede">
          Blends and cultivars scored against the NTEP trial sites nearest you.
        </p>
        <p class="meta">
          {{ cultivarCount }} tall fescue cultivars · {{ blends.length }} blends
          <span v-if="userLocation"> · scoring for {{ userLocation.label || userLocation.city }}</span>
        </p>
      </div>
    </header>

    <div class="seeds__inner container">
      <div class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- BLENDS -->
      <section v-if="tab === 'blends'" class="panel">
        <div class="toolbar">
          <input v-model="blendQuery" type="search" placeholder="Search blends…" />
          <button type="button" class="btn" @click="showBlendForm = !showBlendForm">
            {{ showBlendForm ? 'Close' : 'Add my blend' }}
          </button>
        </div>

        <div v-if="showBlendForm" class="blend-form card">
          <h3>Add a blend from your bag label</h3>
          <div class="form-grid">
            <label>
              <span>Name</span>
              <input v-model="draft.name" type="text" />
            </label>
            <label>
              <span>Manufacturer</span>
              <input v-model="draft.manufacturer" type="text" />
            </label>
            <label class="full">
              <span>Components (name, optional %)</span>
              <div v-for="(row, i) in draft.components" :key="i" class="comp-row">
                <input v-model="row.name" type="text" placeholder="Cultivar name" />
                <input v-model.number="row.percent" type="number" min="0" max="100" placeholder="%" />
                <button type="button" class="linkish" @click="draft.components.splice(i, 1)">Remove</button>
              </div>
              <button type="button" class="btn btn--ghost" @click="draft.components.push({ name: '', percent: null })">
                + Cultivar
              </button>
            </label>
          </div>
          <button type="button" class="btn btn--primary" @click="saveDraft">Save to this browser</button>
        </div>

        <div class="card-grid">
          <article
            v-for="b in filteredBlends"
            :key="b.id"
            class="blend-card"
            :class="{ selected: selectedBlendId === b.id }"
            @click="selectBlend(b.id)"
          >
            <div class="blend-card__top">
              <span class="tag">{{ b.curated ? 'Curated' : 'Yours' }}</span>
              <span v-if="fitFor(b)" class="fit" :class="fitClass(fitFor(b)?.score)">
                {{ fitFor(b)?.label }}
                <em v-if="fitFor(b)?.score != null">{{ fitFor(b)?.score }}</em>
              </span>
            </div>
            <h3>{{ b.name }}</h3>
            <p class="mfr">{{ b.manufacturer }}</p>
            <p>{{ b.summary || b.profile }}</p>
            <p class="comps">
              {{ (b.components || []).map((c) => c.name).join(' · ') }}
            </p>
          </article>
        </div>

        <div v-if="selectedBlend" class="detail card">
          <h2>{{ selectedBlend.name }}</h2>
          <p class="muted">{{ selectedBlend.notes }}</p>

          <div v-if="selectedFit" class="fit-box">
            <strong>{{ selectedFit.label }}</strong>
            <span v-if="selectedFit.score != null">
              Score {{ selectedFit.score }} / 9
              <em
                v-if="selectedFit.coverage"
                class="coverage"
                :class="{ 'coverage--partial': !selectedFit.coverage.complete }"
                :title="coverageTitle(selectedFit.coverage)"
              >
                · based on {{ coverageLabel(selectedFit.coverage) }}
              </em>
            </span>
            <ul v-if="selectedFit.strengths?.length">
              <li v-for="s in selectedFit.strengths" :key="s">{{ s }}</li>
            </ul>
            <ul v-if="selectedFit.watchouts?.length" class="warn">
              <li v-for="w in selectedFit.watchouts" :key="w">{{ w }}</li>
            </ul>
          </div>

          <h3>Cultivars in this blend</h3>
          <div class="comp-table">
            <div v-for="c in selectedComponents" :key="c.name" class="comp-line">
              <div>
                <strong>{{ c.name }}</strong>
                <span v-if="c.percent"> · {{ c.percent }}%</span>
                <span v-if="!c.cultivar && !c.fit" class="missing"> · not in NTEP extract</span>
              </div>
              <div v-if="c.fit?.score != null" class="fit-mini">
                {{ c.fit.label }} · {{ c.fit.score }}
                <span
                  class="coverage"
                  :class="{ 'coverage--partial': !c.fit.coverage.complete }"
                  :title="coverageTitle(c.fit.coverage)"
                >
                  {{ c.fit.coverage.factors }}/{{ c.fit.coverage.totalFactors }}
                </span>
              </div>
            </div>
          </div>

          <button
            v-if="!selectedBlend.curated"
            type="button"
            class="btn btn--ghost"
            @click="removeBlend(selectedBlend.id)"
          >
            Delete my blend
          </button>
        </div>
      </section>

      <!-- CULTIVARS -->
      <section v-if="tab === 'cultivars'" class="panel">
        <div class="toolbar">
          <input v-model="cultQuery" type="search" placeholder="Search cultivars…" />
          <select v-model="sortKey">
            <option value="fit">Best for my area</option>
            <option value="name">Name</option>
            <option value="transition">Transition quality</option>
            <option value="drought">Drought</option>
            <option value="brownPatch">Brown patch</option>
          </select>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cultivar</th>
                <th>Area fit</th>
                <th>Transition</th>
                <th>{{ nearestSiteHeader }}</th>
                <th>Drought</th>
                <th>Brown patch</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in cultivarRows" :key="row.id">
                <td><strong>{{ row.name }}</strong></td>
                <td>
                  <span class="fit-cell">
                    <span class="fit-pill" :class="fitClass(row.fit?.score)">
                      {{ row.fit?.score ?? '—' }}
                    </span>
                    <span
                      v-if="row.fit?.coverage?.factors"
                      class="coverage"
                      :class="{ 'coverage--partial': !row.fit.coverage.complete }"
                      :title="coverageTitle(row.fit.coverage)"
                    >
                      {{ row.fit.coverage.factors }}/{{ row.fit.coverage.totalFactors }}
                    </span>
                  </span>
                </td>
                <td class="num">{{ fmt(row.metrics?.transitionQuality?.mean) }}</td>
                <td class="num">{{ fmt(nearestMetric(row)) }}</td>
                <td class="num">{{ fmt(row.metrics?.droughtQuality?.mean) }}</td>
                <td class="num">{{ fmt(row.metrics?.brownPatch?.mean) }}</td>
                <td class="num">{{ fmt(row.metrics?.geneticColor?.mean) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="hint">
          Showing {{ cultivarRows.length }} of {{ cultivarCount }} (search to narrow).
          The fraction under each fit score is how many of the five rating factors had
          trial data — <strong>4/5</strong> means the score rests on less evidence than
          <strong>5/5</strong>, not that the grass is worse.
        </p>
      </section>

      <!-- COMPARE -->
      <section v-if="tab === 'compare'" class="panel">
        <p class="hint">Pick up to 3 blends to compare for your location.</p>
        <div class="compare-picks">
          <label v-for="slot in 3" :key="slot">
            <span>Blend {{ slot }}</span>
            <select v-model="compareIds[slot - 1]">
              <option value="">—</option>
              <option v-for="b in blends" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </label>
        </div>
        <div class="compare-grid">
          <div v-for="b in compareBlends" :key="b.id" class="card">
            <h3>{{ b.name }}</h3>
            <p class="fit" :class="fitClass(fitFor(b)?.score)">
              {{ fitFor(b)?.label }}
              <strong v-if="fitFor(b)?.score">{{ fitFor(b)?.score }}</strong>
            </p>
            <ul>
              <li v-for="s in fitFor(b)?.strengths || []" :key="s">{{ s }}</li>
            </ul>
            <ul class="warn">
              <li v-for="w in fitFor(b)?.watchouts || []" :key="w">{{ w }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- DATA -->
      <section v-if="tab === 'data'" class="panel card">
        <h2>NTEP data coverage</h2>
        <p v-if="ntepMeta">
          Source: {{ ntepMeta.sourcePdf }} ({{ ntepMeta.trial }}, {{ ntepMeta.year }}).
          Parsed high-value tables only — regional turf quality, genetic color, brown patch, drought.
        </p>
        <h3>Species roadmap</h3>
        <ul>
          <li v-for="s in speciesList" :key="s.id">
            <strong>{{ s.label }}</strong>
            — {{ s.ntepTrials?.length ? `loaded (${s.ntepTrials.join(', ')})` : s.status || 'pending ingest' }}
          </li>
        </ul>
        <p class="hint">
          Re-run ingest:
          <code>.venv/bin/python scripts/ntep/ingest_pdf.py --pdf path/to/report.pdf</code>
        </p>
      </section>
    </div>
  </div>
</template>
